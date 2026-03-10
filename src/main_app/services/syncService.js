import db from '../db/apex.db';
import { saveChat, clearAllChats } from '../utils/db';
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
  // HELPER: Resolve a Dexie book ID to Supabase UUID
  // ============================================
  _resolveBookId: async function (bookId) {
    // If it already looks like a UUID string, return it directly
    if (typeof bookId === 'string' && bookId.includes('-')) {
      return bookId;
    }
    // Look up the book in Dexie to get its supabaseId
    try {
      const book = await db.books.get(bookId);
      if (book?.supabaseId) return book.supabaseId;
      // Also try matching by local_id
      if (!book) {
        const byLocalId = await db.books.where('local_id').equals(bookId.toString()).first();
        if (byLocalId?.supabaseId) return byLocalId.supabaseId;
      }
    } catch (err) {
      console.warn('Failed to resolve book ID:', err);
    }
    return null; // Book hasn't synced to Supabase yet
  },

  // ============================================
  // UPLOAD BOOK FILE + METADATA directly to Supabase
  // ============================================
  uploadBook: async function (fileObject, title, author, dexieBookId) {
    if (!navigator.onLine) return null;

    try {
      const formData = new FormData();
      formData.append('file', fileObject);
      formData.append('title', title);
      formData.append('author', author || 'Unknown');
      formData.append('local_id', dexieBookId.toString());

      const response = await apiClient.post('/api/books/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data && response.data.id) {
        // Update Dexie with the Supabase UUID
        await db.books.update(dexieBookId, {
          supabaseId: response.data.id,
          synced: true,
          filePath: response.data.file_path,
        });
        console.log('Book uploaded to Supabase:', response.data.id);
        return response.data;
      }
    } catch (error) {
      console.error('Failed to upload book to Supabase:', error);
    }
    return null;
  },

  // ============================================
  // DOWNLOAD BOOK FILE (lazy load missing blob)
  // ============================================
  downloadBookFile: async function (supabaseBookId, dexieBookId) {
    if (!navigator.onLine) {
      console.error('[Apex Sync] Cannot download book file — device is offline');
      return null;
    }

    try {
      // 1. Get signed URL from backend
      const response = await apiClient.get(`/api/books/${supabaseBookId}/file`);
      if (!response.data || !response.data.url) {
        console.error('[Apex Sync] Signed URL fetch returned empty for book:', supabaseBookId);
        return null;
      }

      // 2. Fetch the actual file blob
      const fileResponse = await fetch(response.data.url);
      if (!fileResponse.ok) {
        console.error('[Apex Sync] File download failed with status', fileResponse.status, 'for book:', supabaseBookId);
        return null;
      }

      const blob = await fileResponse.blob();
      const arrayBuffer = await blob.arrayBuffer();

      // 3. Save to Dexie for offline use
      const updateCount = await db.books.update(dexieBookId, {
        fileBlob: arrayBuffer,
        fileType: blob.type
      });

      if (updateCount === 0) {
        console.error('[Apex Sync] Dexie update returned 0 — book record may not exist for id:', dexieBookId);
      } else {
        console.log(`[Apex Sync] Downloaded and cached file for book ${supabaseBookId}`);
      }
      return blob;
    } catch (error) {
      console.error('[Apex Sync] Failed to download book file:', { supabaseBookId, dexieBookId, error });
    }
    return null;
  },

  // ============================================
  // PULL ALL USER DATA (login / app load)
  // ============================================
  pullAllUserData: async function () {
    try {
      const response = await apiClient.get('/api/sync/pull/all');
      if (!response.data) return;

      const { user, books, reading_progress, highlights, bookmarks, ai_conversations } = response.data;

      // Store user in auth store
      if (user) {
        const authStore = useAuthStore.getState();
        authStore.setUser(user);
      }

      // ---- Category A data → clear Dexie tables → insert pulled records ----
      // Books: merge — keep local fileBlob, update metadata from Supabase
      if (books && books.length > 0) {
        const existingBooks = await db.books.toArray();
        // Build blob map using ONLY supabaseId — the stable identifier that persists across Dexie clears
        const existingBlobMap = {};
        for (const eb of existingBooks) {
          if (eb.fileBlob) {
            if (eb.supabaseId) existingBlobMap[eb.supabaseId] = eb.fileBlob;
            if (eb.localId || eb.local_id) {
              existingBlobMap[eb.localId || eb.local_id] = eb.fileBlob;
            }
          }
        }

        await db.books.clear();
        const mappedBooks = books.map(b => {
          const mapped = {
            ...mapSnakeToCamel(b),
            supabaseId: b.id,
            synced: true,
          };
          delete mapped.id;

          // Restore blob using supabaseId as stable key (or local_id if unpublished)
          if (existingBlobMap[b.id]) {
            mapped.fileBlob = existingBlobMap[b.id];
          } else if (existingBlobMap[b.local_id]) {
            mapped.fileBlob = existingBlobMap[b.local_id];
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
      // Dictionary History is Category B — fetched directly from the API when needed
      // AI Conversations (Map to ApexBooksDB)
      if (ai_conversations && ai_conversations.length > 0) {
        
        // Wipe local chats before applying the new 1-to-1 Hydration list
        await clearAllChats();

        // Find book titles for scopes
        const bookTitles = {};
        const localBooks = await db.books.toArray();
        for (const b of localBooks) {
          const supabaseId = b.supabaseId || (b.synced ? b.id?.toString() : null);
          if (supabaseId) bookTitles[supabaseId] = b.title;
        }

        // Group Q&A pairs by book_id or 'general'
        // 1-to-1 Match: Convert every single query row into its own isolated Chat Session
        for (const row of ai_conversations) {
          const timeMs = new Date(row.created_at).getTime();
          const groupId = row.chat_type === 'general' ? 'general' : row.book_id;
          
          if (!groupId) continue;

          // Title is extracted directly from the user's question
          const title = row.query_text 
            ? (row.query_text.slice(0, 40) + (row.query_text.length > 40 ? '...' : ''))
            : 'Sync Chat';

          // Assign correct Book title if scoped
          const scope = groupId === 'general' ? 'general' : (bookTitles[groupId] || 'Unknown Book');
          
          // Formulate the distinct session
          const messagesToSave = [
            { id: timeMs, role: 'user', content: row.query_text },
            { id: timeMs + 1, role: 'ai', content: row.ai_response }
          ];

          await saveChat({
            id: timeMs,          // Enforce absolute isolation by making the creation Unix time its ID
            title,
            scope,
            updatedAt: new Date(timeMs).toISOString(),
            messages: messagesToSave
          });
        }
      }

      // Update last_synced_at
      const setting = await db.app_settings.where('key').equals('last_synced_at').first();
      if (setting && setting.id !== undefined) {
        await db.app_settings.update(setting.id, { value: new Date().toISOString() });
      } else {
        if (setting) await db.app_settings.where('key').equals('last_synced_at').delete();
        await db.app_settings.add({ key: 'last_synced_at', value: new Date().toISOString() });
      }

      console.log('Pull sync complete: all user data hydrated');
    } catch (error) {
      console.error('pullAllUserData failed:', error);
      throw error;
    }
  },

  // ============================================
  // DIRECT SAVE — HIGHLIGHTS (Category A)
  // ============================================
  saveHighlight: async function (bookId, highlightData) {
    const localId = generateLocalId();
    const now = new Date().toISOString();

    const dexieRecord = {
      bookId,
      local_id: localId,
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

    // Step 2: If online, resolve the Supabase book UUID and save directly
    if (navigator.onLine) {
      const supabaseBookId = await this._resolveBookId(bookId);
      if (supabaseBookId) {
        try {
          const response = await apiClient.post(`/api/books/${supabaseBookId}/highlights`, {
            highlighted_text: dexieRecord.highlightedText,
            color: dexieRecord.color,
            page_number: dexieRecord.pageNumber,
            text_position: dexieRecord.textPosition,
            note: dexieRecord.note,
            local_id: localId,
          });
          await db.highlights.update(dexieId, {
            supabaseId: response.data.id,
            synced: true,
          });
          this._triggerDebouncedFlush();
          return { ...dexieRecord, id: dexieId, supabaseId: response.data.id };
        } catch (error) {
          console.error('Failed to save highlight to Supabase:', error);
          await this._queueForSync('upload', 'highlights', localId, {
            book_id: supabaseBookId,
            highlighted_text: dexieRecord.highlightedText,
            color: dexieRecord.color,
            page_number: dexieRecord.pageNumber,
            text_position: dexieRecord.textPosition,
            note: dexieRecord.note,
          });
        }
      } else {
        // Book hasn't synced yet — queue for later
        console.warn('Book not synced to Supabase yet, queuing highlight');
        await this._queueForSync('upload', 'highlights', localId, {
          _dexie_book_id: bookId, // Will need to resolve later
          highlighted_text: dexieRecord.highlightedText,
          color: dexieRecord.color,
          page_number: dexieRecord.pageNumber,
          text_position: dexieRecord.textPosition,
          note: dexieRecord.note,
        });
      }
    } else {
      await this._queueForSync('upload', 'highlights', localId, {
        _dexie_book_id: bookId,
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
    if (dexieId) {
      await db.highlights.delete(dexieId).catch(() => {});
    }
    if (navigator.onLine && supabaseId) {
      try {
        await apiClient.delete(`/api/highlights/${supabaseId}`);
      } catch (error) {
        console.error('Failed to delete highlight from Supabase:', error);
      }
    }
  },

  // ============================================
  // DIRECT SAVE — READING PROGRESS (Category A, debounced)
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
      dexieData.local_id = localId;
      await db.reading_progress.add(dexieData);
    }

    // If online, resolve UUID and save to Supabase
    if (navigator.onLine) {
      const supabaseBookId = await this._resolveBookId(bookId);
      if (supabaseBookId) {
        try {
          const response = await apiClient.post(`/api/books/${supabaseBookId}/progress`, {
            current_page: progressData.current_page,
            scroll_position: progressData.scroll_position || 0,
            progress_percentage: progressData.progress_percentage,
            total_time_read: progressData.total_time_read || 0,
            local_id: existing?.local_id || localId,
          });
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
          await this._queueForSync('upload', 'reading_progress', existing?.local_id || localId, {
            book_id: supabaseBookId,
            current_page: progressData.current_page,
            scroll_position: progressData.scroll_position || 0,
            progress_percentage: progressData.progress_percentage,
            last_read_at: now,
          });
        }
      } else {
        await this._queueForSync('upload', 'reading_progress', existing?.local_id || localId, {
          _dexie_book_id: bookId,
          current_page: progressData.current_page,
          scroll_position: progressData.scroll_position || 0,
          progress_percentage: progressData.progress_percentage,
          last_read_at: now,
        });
      }
    } else {
      await this._queueForSync('upload', 'reading_progress', existing?.local_id || localId, {
        _dexie_book_id: bookId,
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
  // DIRECT SAVE — BOOKMARKS (Category A)
  // ============================================
  saveBookmark: async function (bookId, bookmarkData) {
    const localId = generateLocalId();
    const now = new Date().toISOString();

    const dexieRecord = {
      bookId,
      local_id: localId,
      pageNumber: bookmarkData.page_number || bookmarkData.page,
      label: bookmarkData.label || `Page ${bookmarkData.page_number || bookmarkData.page}`,
      createdAt: now,
      synced: false,
      supabaseId: null,
    };

    const dexieId = await db.bookmarks.add(dexieRecord);

    if (navigator.onLine) {
      const supabaseBookId = await this._resolveBookId(bookId);
      if (supabaseBookId) {
        try {
          const response = await apiClient.post(`/api/books/${supabaseBookId}/bookmarks`, {
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
            book_id: supabaseBookId,
            page_number: dexieRecord.pageNumber,
            label: dexieRecord.label,
          });
        }
      } else {
        await this._queueForSync('upload', 'bookmarks', localId, {
          _dexie_book_id: bookId,
          page_number: dexieRecord.pageNumber,
          label: dexieRecord.label,
        });
      }
    } else {
      await this._queueForSync('upload', 'bookmarks', localId, {
        _dexie_book_id: bookId,
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
  // AI CONVERSATIONS (Category B — no Dexie, backend saves during streaming)
  // ============================================
  saveAIConversation: async function () {
    // No-op: backend saves AI conversations during streaming
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
      const pendingBooks = await db.sync_queue
        .where('status').equals('pending')
        .filter(item => item.tableName === 'books')
        .toArray();

      for (const item of pendingBooks) {
        const localBook = await db.books
          .where('local_id').equals(item.local_id)
          .first();

        console.log('[DEBUG] Book lookup:', item.local_id, '→', localBook?.id, '| hasBlob:', !!localBook?.fileBlob);

        if (!localBook?.fileBlob) {
          console.log('[DEBUG] Skipping — no blob for local_id:', item.local_id);
          continue;
        }

        const file = new File(
          [localBook.fileBlob],
          localBook.title,
          { type: localBook.fileType }
        );

        const result = await this.uploadBook(file, localBook.title, localBook.author, localBook.id);

        await db.sync_queue.update(item.id, {
          status: result ? 'synced' : 'pending',
          attempts: result ? item.attempts : (item.attempts || 0) + 1,
        });
      }

      let queueItems = await db.sync_queue
        .where('status').equals('pending')
        .toArray();

      if (queueItems.length === 0) {
        console.log('Sync: No pending items to push');
        return;
      }

      // Pre-process: resolve _dexie_book_id to actual Supabase UUID for queued items
      for (const item of queueItems) {
        if (item.payload?._dexie_book_id && !item.payload?.book_id) {
          const supabaseBookId = await this._resolveBookId(item.payload._dexie_book_id);
          if (supabaseBookId) {
            item.payload.book_id = supabaseBookId;
            delete item.payload._dexie_book_id;
            // Update in Dexie so we don't re-resolve next time
            await db.sync_queue.update(item.id, { payload: item.payload });
          } else {
            // Book still not synced — skip this item for now
            console.warn(`Sync: Skipping ${item.tableName} — book not synced yet`);
            continue;
          }
        }
      }

      // Filter out items that still have unresolved book IDs
      queueItems = queueItems.filter(item => !item.payload?._dexie_book_id);

      if (queueItems.length === 0) {
        console.log('Sync: All pending items waiting for book sync');
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
                let localRecord = await db[tableName]
                  .where('local_id').equals(item.local_id)
                  .first()
                  .catch(() => null);

                // Fallback: try by supabaseId if local_id lookup fails
                if (!localRecord && item.record_id) {
                  const bySupabaseId = await db[tableName]
                    .where('supabaseId').equals(item.record_id)
                    .first()
                    .catch(() => null);
                  if (bySupabaseId) {
                    localRecord = bySupabaseId;
                  }
                }

                if (localRecord) {
                  await db[tableName].update(localRecord.id, {
                    supabaseId: item.record_id,
                    synced: true,
                  });
                }
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
              console.log(`Sync: Successfully pushed ${synced.length} items`);
            }
            if (failed.length > 0) {
              console.warn(`Sync: ${failed.length} items failed`, failed);
            }
          }
        } catch (batchError) {
          console.error(`Sync: Batch failed:`, batchError);
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
      } catch (cleanupErr) {
        console.warn('Sync queue cleanup failed:', cleanupErr);
      }
    } catch (error) {
      console.error('Push sync failed:', error);
    }
  },

  // Debounced flush trigger
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
    this.saveProgress = createDebounce(
      (bookId, progressData) => this._saveProgressDirect(bookId, progressData),
      1500
    );

    window.addEventListener('online', () => {
      console.log('Device online, flushing sync queue...');
      this.pushSync();
    });

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
          await this.pushSync();
          await this.pullAllUserData();
          
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
