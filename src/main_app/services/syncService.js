import db from '../db/apex.db';
import apiClient from './apiClient';
import authService from './authService';
import useAuthStore from '../store/authStore';

// Helper: generate a local ID
function generateLocalId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

// Helper: convert Supabase snake_case keys to Dexie camelCase keys
function mapSnakeToCamel(record) {
  const mapped = {};
  for (const [key, value] of Object.entries(record)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    mapped[camelKey] = value;
  }
  return mapped;
}

// Debounce helper
function createDebounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

const syncService = {
  // ============================================
  // PULL ALL USER DATA (login / app load)
  // ============================================
  pullAllUserData: async function () {
    try {
      const response = await apiClient.get('/api/sync/pull/all');
      if (!response.data) return;

      const { user, books, reading_progress, highlights, ai_conversations, bookmarks, user_dictionary_history } = response.data;

      // Store user in auth store
      if (user) {
        const authStore = useAuthStore.getState();
        authStore.setUser(user);
      }

      // ---- Category A data → clear Dexie tables → insert pulled records ----
      // Books: merge — keep local fileBlob, update metadata from Supabase
      if (books && books.length > 0) {
        const existingBooks = await db.books.toArray();
        const existingBlobMap = {};
        for (const eb of existingBooks) {
          if (eb.fileBlob) {
            // Key by supabaseId or local_id
            const key = eb.supabaseId || eb.local_id || eb.id?.toString();
            if (key) existingBlobMap[key] = eb.fileBlob;
          }
        }

        await db.books.clear();
        const mappedBooks = books.map(b => {
          const mapped = {
            ...mapSnakeToCamel(b),
            supabaseId: b.id,
            synced: true,
          };
          delete mapped.id; // Remove Supabase UUID to avoid Dexie auto-increment clash

          // Restore fileBlob if we had it locally
          const blobKey = b.id || b.local_id;
          if (blobKey && existingBlobMap[blobKey]) {
            mapped.fileBlob = existingBlobMap[blobKey];
          }

          return mapped;
        });
        await db.books.bulkAdd(mappedBooks);
      }

      // Reading Progress
      if (reading_progress && reading_progress.length > 0) {
        await db.reading_progress.clear();
        const mapped = reading_progress.map(r => ({
          ...mapSnakeToCamel(r),
          supabaseId: r.id,
          synced: true,
        }));
        for (const m of mapped) { delete m.id; }
        await db.reading_progress.bulkAdd(mapped);
      }

      // Highlights
      if (highlights && highlights.length > 0) {
        await db.highlights.clear();
        const mapped = highlights.map(h => ({
          ...mapSnakeToCamel(h),
          supabaseId: h.id,
          synced: true,
        }));
        for (const m of mapped) { delete m.id; }
        await db.highlights.bulkAdd(mapped);
      }

      // Bookmarks
      if (bookmarks && bookmarks.length > 0) {
        await db.bookmarks.clear();
        const mapped = bookmarks.map(b => ({
          ...mapSnakeToCamel(b),
          supabaseId: b.id,
          synced: true,
        }));
        for (const m of mapped) { delete m.id; }
        await db.bookmarks.bulkAdd(mapped);
      }

      // ---- Category B data → Zustand only (no Dexie) ----
      // AI Conversations — store in Zustand for components to read
      // (Components that need these should read from Zustand or fetch from API directly)
      // We don't store in Dexie as per Category B rules

      // Dictionary History — same, Category B, no Dexie

      // Update last_synced_at
      await db.app_settings.put({ key: 'last_synced_at', value: new Date().toISOString() });

      console.log('Pull sync complete: all user data hydrated');
    } catch (error) {
      console.error('pullAllUserData failed:', error);
      throw error;
    }
  },

  // ============================================
  // DIRECT SAVE — HIGHLIGHTS
  // ============================================
  saveHighlight: async function (bookId, highlightData) {
    const localId = generateLocalId();
    const now = new Date().toISOString();

    const dexieRecord = {
      bookId,
      localId,
      highlightedText: highlightData.highlighted_text || highlightData.text || '',
      color: highlightData.color || 'yellow',
      pageNumber: highlightData.page_number || highlightData.page || 0,
      textPosition: highlightData.text_position || highlightData.position || '',
      note: highlightData.note || null,
      createdAt: now,
      updatedAt: now,
      synced: false,
      supabaseId: null,
    };

    // Step 1: Save to Dexie immediately
    const dexieId = await db.highlights.add(dexieRecord);

    // Step 2: If online, save to Supabase directly
    if (navigator.onLine) {
      try {
        const response = await apiClient.post(`/api/books/${bookId}/highlights`, {
          highlighted_text: dexieRecord.highlightedText,
          color: dexieRecord.color,
          page_number: dexieRecord.pageNumber,
          text_position: dexieRecord.textPosition,
          note: dexieRecord.note,
          local_id: localId,
        });
        // Step 3: Update Dexie with Supabase UUID
        await db.highlights.update(dexieId, {
          supabaseId: response.data.id,
          synced: true,
        });
        this._triggerDebouncedFlush();
        return { ...dexieRecord, id: dexieId, supabaseId: response.data.id };
      } catch (error) {
        console.error('Failed to save highlight to Supabase:', error);
        // Step 4: Queue for later sync
        await this._queueForSync('upload', 'highlights', localId, {
          book_id: bookId,
          highlighted_text: dexieRecord.highlightedText,
          color: dexieRecord.color,
          page_number: dexieRecord.pageNumber,
          text_position: dexieRecord.textPosition,
          note: dexieRecord.note,
        });
      }
    } else {
      // Step 5: Offline — queue for sync
      await this._queueForSync('upload', 'highlights', localId, {
        book_id: bookId,
        highlighted_text: dexieRecord.highlightedText,
        color: dexieRecord.color,
        page_number: dexieRecord.pageNumber,
        text_position: dexieRecord.textPosition,
        note: dexieRecord.note,
      });
    }

    return { ...dexieRecord, id: dexieId };
  },

  updateHighlight: async function (supabaseId, updateData) {
    if (navigator.onLine && supabaseId) {
      try {
        await apiClient.put(`/api/highlights/${supabaseId}`, updateData);
      } catch (error) {
        console.error('Failed to update highlight on Supabase:', error);
      }
    }
  },

  deleteHighlight: async function (supabaseId, dexieId) {
    // Delete from Dexie
    if (dexieId) {
      await db.highlights.delete(dexieId).catch(() => {});
    }
    // Delete from Supabase if online
    if (navigator.onLine && supabaseId) {
      try {
        await apiClient.delete(`/api/highlights/${supabaseId}`);
      } catch (error) {
        console.error('Failed to delete highlight from Supabase:', error);
      }
    }
  },

  // ============================================
  // DIRECT SAVE — READING PROGRESS (debounced)
  // ============================================
  _saveProgressDirect: async function (bookId, progressData) {
    const localId = generateLocalId();
    const now = new Date().toISOString();

    // Save to Dexie — upsert by bookId
    const existing = await db.reading_progress.where('bookId').equals(bookId).first();
    const dexieData = {
      bookId,
      currentPage: progressData.current_page,
      scrollPosition: progressData.scroll_position || 0,
      progressPercentage: progressData.progress_percentage,
      lastReadAt: now,
      synced: false,
    };

    if (existing) {
      await db.reading_progress.update(existing.id, dexieData);
    } else {
      dexieData.localId = localId;
      await db.reading_progress.add(dexieData);
    }

    // If online, save to Supabase directly
    if (navigator.onLine) {
      try {
        const response = await apiClient.post(`/api/books/${bookId}/progress`, {
          current_page: progressData.current_page,
          scroll_position: progressData.scroll_position || 0,
          progress_percentage: progressData.progress_percentage,
          total_time_read: progressData.total_time_read || 0,
          local_id: existing?.localId || localId,
        });
        // Update Dexie synced status
        const record = await db.reading_progress.where('bookId').equals(bookId).first();
        if (record) {
          await db.reading_progress.update(record.id, {
            supabaseId: response.data.id,
            synced: true,
          });
        }
        this._triggerDebouncedFlush();
      } catch (error) {
        console.error('Failed to save progress to Supabase:', error);
        await this._queueForSync('upload', 'reading_progress', existing?.localId || localId, {
          book_id: bookId,
          current_page: progressData.current_page,
          scroll_position: progressData.scroll_position || 0,
          progress_percentage: progressData.progress_percentage,
          last_read_at: now,
        });
      }
    } else {
      await this._queueForSync('upload', 'reading_progress', existing?.localId || localId, {
        book_id: bookId,
        current_page: progressData.current_page,
        scroll_position: progressData.scroll_position || 0,
        progress_percentage: progressData.progress_percentage,
        last_read_at: now,
      });
    }
  },

  // Debounced version — called by BookContext
  saveProgress: null, // initialized in init()

  // ============================================
  // DIRECT SAVE — BOOKMARKS
  // ============================================
  saveBookmark: async function (bookId, bookmarkData) {
    const localId = generateLocalId();
    const now = new Date().toISOString();

    const dexieRecord = {
      bookId,
      localId,
      pageNumber: bookmarkData.page_number || bookmarkData.page,
      label: bookmarkData.label || `Page ${bookmarkData.page_number || bookmarkData.page}`,
      createdAt: now,
      synced: false,
      supabaseId: null,
    };

    const dexieId = await db.bookmarks.add(dexieRecord);

    if (navigator.onLine) {
      try {
        const response = await apiClient.post(`/api/books/${bookId}/bookmarks`, {
          page_number: dexieRecord.pageNumber,
          label: dexieRecord.label,
          local_id: localId,
        });
        await db.bookmarks.update(dexieId, {
          supabaseId: response.data.id,
          synced: true,
        });
        this._triggerDebouncedFlush();
        return { ...dexieRecord, id: dexieId, supabaseId: response.data.id };
      } catch (error) {
        console.error('Failed to save bookmark to Supabase:', error);
        await this._queueForSync('upload', 'bookmarks', localId, {
          book_id: bookId,
          page_number: dexieRecord.pageNumber,
          label: dexieRecord.label,
        });
      }
    } else {
      await this._queueForSync('upload', 'bookmarks', localId, {
        book_id: bookId,
        page_number: dexieRecord.pageNumber,
        label: dexieRecord.label,
      });
    }

    return { ...dexieRecord, id: dexieId };
  },

  deleteBookmark: async function (supabaseId, dexieId) {
    if (dexieId) {
      await db.bookmarks.delete(dexieId).catch(() => {});
    }
    if (navigator.onLine && supabaseId) {
      try {
        await apiClient.delete(`/api/bookmarks/${supabaseId}`);
      } catch (error) {
        console.error('Failed to delete bookmark from Supabase:', error);
      }
    }
  },

  // ============================================
  // DIRECT SAVE — AI CONVERSATIONS (Category B — no Dexie)
  // ============================================
  saveAIConversation: async function (conversationData) {
    // Category B: AI conversations are saved by the backend during streaming.
    // This is kept as a no-op placeholder for consistency.
    // The backend saves the conversation after streaming completes.
    console.log('AI conversation saved by backend during streaming');
  },

  // ============================================
  // SYNC QUEUE HELPER
  // ============================================
  _queueForSync: async function (action, tableName, localId, payload) {
    // Cap queue at 500 items — purge oldest synced if exceeded
    const queueCount = await db.sync_queue.count();
    if (queueCount >= 500) {
      const oldSynced = await db.sync_queue
        .where('status').equals('synced')
        .sortBy('createdAt');
      const toDelete = oldSynced.slice(0, Math.max(50, queueCount - 450));
      for (const item of toDelete) {
        await db.sync_queue.delete(item.id);
      }
    }

    await db.sync_queue.add({
      action,
      tableName,
      local_id: localId,
      payload,
      status: 'pending',
      attempts: 0,
      createdAt: new Date().toISOString(),
    });
  },

  // ============================================
  // PUSH SYNC — flush sync_queue to Supabase
  // ============================================
  pushSync: async function () {
    try {
      const queueItems = await db.sync_queue
        .where('status').equals('pending')
        .toArray();

      if (queueItems.length === 0) {
        console.log('Sync: No pending items to push');
        return;
      }

      console.log(`Sync: Pushing ${queueItems.length} pending items...`);

      // Process in batches of 50
      const batchSize = 50;
      for (let i = 0; i < queueItems.length; i += batchSize) {
        const batch = queueItems.slice(i, i + batchSize);

        const payload = {
          queue: batch.map(item => ({
            action: item.action,
            table_name: item.tableName,
            local_id: item.local_id,
            record_id: item.recordId,
            payload: { ...item.payload, local_queue_id: item.id }
          }))
        };

        try {
          const response = await apiClient.post('/api/sync', payload);

          if (response.data) {
            const { synced, failed } = response.data;

            for (const item of synced) {
              const tableName = item.tableName || 'books';
              try {
                // Update the local Dexie record with supabaseId
                const localRecord = await db[tableName]
                  .where('local_id').equals(item.local_id)
                  .first()
                  .catch(() => null);

                if (localRecord) {
                  await db[tableName].update(localRecord.id, {
                    supabaseId: item.record_id,
                    synced: true,
                  });
                }
              } catch (err) {
                console.warn(`Sync: Could not update local record for ${tableName}:`, err);
              }

              // Mark queue item as synced
              if (item.local_queue_id) {
                await db.sync_queue.update(item.local_queue_id, {
                  status: 'synced'
                });
              }
            }

            for (const item of failed) {
              const queueItem = batch.find(q => q.local_id === item.local_id);
              if (queueItem) {
                const attempts = (queueItem.attempts || 0) + 1;
                await db.sync_queue.update(queueItem.id, {
                  attempts,
                  status: attempts >= 3 ? 'failed' : 'pending'
                });
              }
            }

            if (synced.length > 0) {
              console.log(`Sync: Successfully pushed ${synced.length} items (batch ${Math.floor(i / batchSize) + 1})`);
            }
            if (failed.length > 0) {
              console.warn(`Sync: ${failed.length} items failed in batch`, failed);
            }
          }
        } catch (batchError) {
          console.error(`Sync: Batch ${Math.floor(i / batchSize) + 1} failed:`, batchError);
        }
      }

      // Clean up: delete synced items older than 7 days
      try {
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const oldSynced = await db.sync_queue
          .where('status').equals('synced')
          .filter(item => item.createdAt < sevenDaysAgo)
          .toArray();
        for (const item of oldSynced) {
          await db.sync_queue.delete(item.id);
        }
        if (oldSynced.length > 0) {
          console.log(`Sync: Cleaned up ${oldSynced.length} old synced queue items`);
        }
      } catch (cleanupErr) {
        console.warn('Sync queue cleanup failed:', cleanupErr);
      }
    } catch (error) {
      console.error('Push sync failed:', error);
    }
  },

  // Debounced flush trigger — called after every successful Category A save
  _flushTimeout: null,
  _triggerDebouncedFlush: function () {
    if (this._flushTimeout) clearTimeout(this._flushTimeout);
    this._flushTimeout = setTimeout(() => {
      if (navigator.onLine) this.pushSync();
    }, 3000);
  },

  // ============================================
  // INITIALIZE — listeners, debounced functions
  // ============================================
  init() {
    // Debounced progress save (1500ms)
    this.saveProgress = createDebounce(
      (bookId, progressData) => this._saveProgressDirect(bookId, progressData),
      1500
    );

    // Online event — flush sync queue
    window.addEventListener('online', () => {
      console.log('Device online, flushing sync queue...');
      this.pushSync();
    });

    // Legacy triggerSync alias
    this.triggerSync = () => this._triggerDebouncedFlush();
  },

  // ============================================
  // ON APP LOAD — full pull then push
  // ============================================
  onAppLoad: async function () {
    const authStore = useAuthStore.getState();

    if (authService.isAuthenticated()) {
      try {
        const user = await authService.me();
        authStore.setUser(user);

        if (navigator.onLine) {
          await this.pullAllUserData();
          await this.pushSync();
        }
        // If offline, Dexie already has Category A data from last sync
        // Category B data (AI convos, dict history) will be empty but that's expected
      } catch (error) {
        console.error('Auth verification failed:', error);
        authStore.clearUser();
      }
    } else {
      authStore.setLoading(false);
    }
  },

  // ============================================
  // MIGRATE LOCAL DATA (pre-account)
  // ============================================
  migrateLocalData: async function () {
    try {
      const allBooks = await db.books.toArray();
      const unsyncedBooks = allBooks.filter(b => !b.recordId && !b.supabaseId);

      if (unsyncedBooks.length === 0) {
        console.log('Migration: No local data to migrate');
        return;
      }

      console.log(`Migration: Found ${unsyncedBooks.length} local books to migrate`);
      let queuedCount = 0;

      for (const book of unsyncedBooks) {
        const localId = (book.local_id || book.id).toString();
        if (!book.local_id) {
          await db.books.update(book.id, { local_id: localId });
        }

        const existingQueue = await db.sync_queue
          .where('local_id').equals(localId)
          .and(item => item.tableName === 'books' && item.status === 'pending')
          .first();

        if (!existingQueue) {
          await db.sync_queue.add({
            action: 'upload',
            tableName: 'books',
            local_id: localId,
            payload: {
              title: book.title || 'Untitled',
              author: book.author || 'Unknown',
              file_type: book.fileType,
              file_size: book.fileSize,
              last_read_at: book.lastReadAt || book.uploadedAt || new Date().toISOString(),
            },
            createdAt: new Date().toISOString(),
            attempts: 0,
            status: 'pending'
          });
          queuedCount++;
        }
      }

      console.log(`Migration: Queued ${queuedCount} records for sync`);

      if (queuedCount > 0 && navigator.onLine) {
        await this.pushSync();
      }
    } catch (error) {
      console.error('Migration failed:', error);
    }
  }
};

export default syncService;
