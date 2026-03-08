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

      // Hydrate Dexie tables — clear existing, insert pulled data
      // We do NOT clear the books table fileBlob data since pull doesn't include that
      // Instead we merge: update metadata from Supabase but keep local fileBlob

      // Reading Progress
      if (reading_progress && reading_progress.length > 0) {
        await db.reading_progress.clear();
        const mapped = reading_progress.map(r => ({
          ...mapSnakeToCamel(r),
          supabaseId: r.id,
          synced: true,
        }));
        // Remove supabase 'id' to avoid clashing with Dexie auto-increment
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

      // AI Conversations
      if (ai_conversations && ai_conversations.length > 0) {
        await db.ai_conversations.clear();
        const mapped = ai_conversations.map(c => ({
          ...mapSnakeToCamel(c),
          supabaseId: c.id,
          synced: true,
        }));
        for (const m of mapped) { delete m.id; }
        await db.ai_conversations.bulkAdd(mapped);
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

      // Dictionary History
      if (user_dictionary_history && user_dictionary_history.length > 0) {
        await db.user_dictionary_history.clear();
        const mapped = user_dictionary_history.map(d => ({
          ...mapSnakeToCamel(d),
          synced: true,
        }));
        for (const m of mapped) { delete m.id; }
        await db.user_dictionary_history.bulkAdd(mapped);
      }

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
  // DIRECT SAVE — AI CONVERSATIONS (no debounce)
  // ============================================
  saveAIConversation: async function (conversationData) {
    const localId = generateLocalId();
    const now = new Date().toISOString();

    const dexieRecord = {
      localId,
      bookId: conversationData.book_id || null,
      chatType: conversationData.chat_type || 'general',
      queryText: conversationData.query_text,
      aiResponse: conversationData.ai_response,
      pageNumber: conversationData.page_number || null,
      createdAt: now,
      synced: true, // Backend already saves during streaming
      supabaseId: null,
    };

    await db.ai_conversations.add(dexieRecord);
  },

  // ============================================
  // DIRECT SAVE — DICTIONARY HISTORY
  // ============================================
  saveDictionaryLookup: async function (word) {
    const now = new Date().toISOString();
    await db.user_dictionary_history.add({
      word: word.toLowerCase(),
      localId: generateLocalId(),
      lookedUpAt: now,
      synced: true, // Backend already saves via dictionary endpoint
    });
  },

  // ============================================
  // SYNC QUEUE HELPER
  // ============================================
  _queueForSync: async function (action, tableName, localId, payload) {
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

      const payload = {
        queue: queueItems.map(item => ({
          action: item.action,
          table_name: item.tableName,
          local_id: item.local_id,
          record_id: item.recordId,
          payload: { ...item.payload, local_queue_id: item.id }
        }))
      };

      const response = await apiClient.post('/api/sync', payload);

      if (response.data) {
        const { synced, failed } = response.data;

        for (const item of synced) {
          const tableName = item.tableName || 'books';
          try {
            await db[tableName].update(parseInt(item.local_id), {
              recordId: item.record_id
            });
          } catch (err) {
            console.warn(`Sync: Could not update local record for ${tableName}:`, err);
          }

          if (item.local_queue_id) {
            await db.sync_queue.update(item.local_queue_id, {
              status: 'synced'
            });
          }
        }

        for (const item of failed) {
          const queueItem = queueItems.find(q => q.local_id === item.local_id);
          if (queueItem) {
            const attempts = (queueItem.attempts || 0) + 1;
            await db.sync_queue.update(queueItem.id, {
              attempts,
              status: attempts > 3 ? 'failed' : 'pending'
            });
          }
        }

        if (synced.length > 0) {
          console.log(`Sync: Successfully pushed ${synced.length} items`);
        }
        if (failed.length > 0) {
          console.warn(`Sync: ${failed.length} items failed to push`, failed);
        }
      }
    } catch (error) {
      console.error('Push sync failed:', error);
    }
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

    // Debounced trigger helper for legacy sync_queue pattern
    let timeoutId;
    this.triggerSync = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        if (navigator.onLine) this.pushSync();
      }, 3000);
    };
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
      const unsyncedBooks = allBooks.filter(b => !b.recordId);

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
