import db from '../db/apex.db';
import { saveChat, clearAllChats } from '../utils/db';
import apiClient from './apiClient';
import authService from './authService';
import useAuthStore from '../store/authStore';
import useSettingsStore from '../store/settingsStore';

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
  // CLOCK-AGNOSTIC SYNC HELPERS
  // Server anchor replaces client clock entirely
  // ============================================

  /**
   * _getLastSyncedAt
   * Returns the server-generated timestamp of the last successful sync.
   * This is the anchor — NOT the client clock.
   * Returns null if never synced (first time on this device).
   */
  _getLastSyncedAt: async function() {
    try {
      const setting = await db.app_settings
        .where('key').equals('last_synced_at')
        .first();
      return setting?.value || null;
    } catch (err) {
      if (import.meta.env.DEV) console.warn('[Apex Sync] Failed to read last_synced_at:', err);
      return null;
    }
  },

  /**
   * _setLastSyncedAt
   * Stores the SERVER-provided sync time after a successful sync.
   * NEVER uses new Date() — always uses the timestamp returned by the server.
   * This prevents client clock drift from affecting future sync decisions.
   */
  _setLastSyncedAt: async function(serverTime) {
    try {
      const existing = await db.app_settings
        .where('key').equals('last_synced_at')
        .first();
      if (existing) {
        await db.app_settings.update(existing.id, { value: serverTime });
      } else {
        await db.app_settings.add({ key: 'last_synced_at', value: serverTime });
      }
      if (import.meta.env.DEV) console.log('[Apex Sync] Last synced at updated to server time:', serverTime);
    } catch (err) {
      if (import.meta.env.DEV) console.warn('[Apex Sync] Failed to set last_synced_at:', err);
    }
  },

  /**
   * _hasLocalChanges
   * Checks if there are any pending items in the sync queue for a given table.
   * This is how we know "local is ahead" — pending unsynced changes exist.
   * No clock comparison involved.
   */
  _hasLocalChanges: async function(tableName) {
    try {
      const count = await db.sync_queue
        .where('status').equals('pending')
        .filter(item => item.tableName === tableName)
        .count();
      return count > 0;
    } catch (err) {
      if (import.meta.env.DEV) console.warn(`[Apex Sync] Failed to check local changes for ${tableName}:`, err);
      return false;
    }
  },

  /**
   * _tableNeedsSync
   * Core sync decision function — clock agnostic.
   *
   * Logic:
   *   cloudUpdatedAt > lastSyncedAt → cloud has new data since our last sync → pull
   *   hasPendingItems → we have local changes not yet pushed → push
   *   both → push first (preserve local), then pull
   *   neither → skip
   *
   * Returns: 'pull' | 'push' | 'both' | 'skip'
   */
  _tableNeedsSync: async function(tableName, cloudUpdatedAt, lastSyncedAt) {
    const hasPending = await this._hasLocalChanges(tableName);

    // Cloud has data newer than our last sync
    const cloudIsAhead = cloudUpdatedAt && lastSyncedAt
      ? new Date(cloudUpdatedAt) > new Date(lastSyncedAt)
      : cloudUpdatedAt !== null; // If never synced, cloud always wins

    if (import.meta.env.DEV) console.log(`[Apex Sync] "${tableName}": cloudUpdatedAt=${cloudUpdatedAt} lastSyncedAt=${lastSyncedAt} cloudIsAhead=${cloudIsAhead} hasPending=${hasPending}`);

    if (cloudIsAhead && hasPending) return 'both';
    if (cloudIsAhead) return 'pull';
    if (hasPending) return 'push';
    return 'skip';
  },

  // ============================================
  // HELPER: Resolve a Dexie book ID to Supabase UUID
  // ============================================
  _resolveBookId: async function (bookId, supabaseIdHint) {
    // If a supabaseId hint was passed directly, use it immediately
    if (supabaseIdHint) return supabaseIdHint;

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
      // After pull sync, Dexie IDs change but the supabaseId is preserved.
      // Scan all books to find one whose supabaseId matches — last resort.
      if (!book) {
        const allBooks = await db.books.toArray();
        for (const b of allBooks) {
          if (b.supabaseId && (b.localId === bookId.toString() || b.local_id === bookId.toString())) {
            return b.supabaseId;
          }
        }
        // If the book was found by integer ID but had no supabaseId, check if
        // any book has this integer as part of its history
        if (allBooks.length > 0 && allBooks[0].supabaseId) {
          // At least one book is synced — the bookId might be stale
          if (import.meta.env.DEV) console.warn('[Apex Sync] _resolveBookId: Dexie ID', bookId, 'not found. Books may have been re-IDed after pull sync.');
        }
      }
    } catch (err) {
      if (import.meta.env.DEV) console.warn('Failed to resolve book ID:', err);
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
        if (import.meta.env.DEV) console.log('Book uploaded to Supabase:', response.data.id);
        return response.data;
      }
    } catch (error) {
      if (import.meta.env.DEV) console.error('Failed to upload book to Supabase:', error);
    }
    return null;
  },

  // ============================================
  // DOWNLOAD BOOK FILE (lazy load missing blob)
  // ============================================
  downloadBookFile: async function (supabaseBookId, dexieBookId) {
    if (!navigator.onLine) {
      if (import.meta.env.DEV) console.error('[Apex Sync] Cannot download book file — device is offline');
      return null;
    }

    try {
      // 1. Get signed URL from backend
      const response = await apiClient.get(`/api/books/${supabaseBookId}/file`);
      if (!response.data || !response.data.url) {
        if (import.meta.env.DEV) console.error('[Apex Sync] Signed URL fetch returned empty for book:', supabaseBookId);
        return null;
      }

      // 2. Fetch the actual file blob
      const fileResponse = await fetch(response.data.url);
      if (!fileResponse.ok) {
        if (import.meta.env.DEV) console.error('[Apex Sync] File download failed with status', fileResponse.status, 'for book:', supabaseBookId);
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
        if (import.meta.env.DEV) console.error('[Apex Sync] Dexie update returned 0 — book record may not exist for id:', dexieBookId);
      } else {
        if (import.meta.env.DEV) console.log(`[Apex Sync] Downloaded and cached file for book ${supabaseBookId}`);
      }
      return blob;
    } catch (error) {
      if (import.meta.env.DEV) console.error('[Apex Sync] Failed to download book file:', { supabaseBookId, dexieBookId, error });
    }
    return null;
  },

  // ============================================
  // SMART PULL — Per-table timestamp conflict resolution
  // ============================================
  pullAllUserData: async function () {
    try {
      if (import.meta.env.DEV) console.log('[Apex Sync] Starting clock-agnostic sync...');

      // Step 1: Get cloud timestamps AND server time from backend
      // Server time is the anchor — we never use client clock
      let cloudTimestamps = {};
      let serverTime = null;

      try {
        const tsResponse = await apiClient.get('/api/sync/timestamps');
        cloudTimestamps = tsResponse.data;
        serverTime = tsResponse.data.server_time;
        if (import.meta.env.DEV) console.log('[Apex Sync] Cloud timestamps received:', cloudTimestamps);
        if (import.meta.env.DEV) console.log('[Apex Sync] Server time anchor:', serverTime);
      } catch (err) {
        if (import.meta.env.DEV) console.error('[Apex Sync] Failed to fetch timestamps — doing full pull:', err);
        // Fallback: pull everything if timestamp endpoint fails
        cloudTimestamps = {
          books: new Date().toISOString(),
          reading_progress: new Date().toISOString(),
          highlights: new Date().toISOString(),
          bookmarks: new Date().toISOString(),
          notes: new Date().toISOString(),
          server_time: new Date().toISOString(),
        };
        serverTime = new Date().toISOString();
      }

      // Step 2: Get last successful sync timestamp (server-generated, stored locally)
      const lastSyncedAt = await this._getLastSyncedAt();
      if (import.meta.env.DEV) console.log('[Apex Sync] Last synced at:', lastSyncedAt || 'never (first sync on this device)');

      // Step 3: Decide action per table — no client clock involved
      const tables = ['books', 'reading_progress', 'highlights', 'bookmarks', 'notes'];
      const decisions = {};

      for (const table of tables) {
        decisions[table] = await this._tableNeedsSync(
          table,
          cloudTimestamps[table],
          lastSyncedAt
        );
      }

      if (import.meta.env.DEV) console.log('[Apex Sync] Sync decisions:', decisions);

      // Step 4: Push local changes FIRST for tables that need it
      // This preserves local work before cloud data overwrites anything
      const tablesNeedingPush = tables.filter(t =>
        decisions[t] === 'push' || decisions[t] === 'both'
      );

      if (tablesNeedingPush.length > 0) {
        if (import.meta.env.DEV) console.log('[Apex Sync] Pushing local changes first for:', tablesNeedingPush);
        await this.pushSync();
      }

      // Step 5: Pull tables that need it from cloud
      const tablesToPull = tables.filter(t =>
        decisions[t] === 'pull' || decisions[t] === 'both'
      );

      if (tablesToPull.length === 0 && !decisions.ai_conversations) {
        if (import.meta.env.DEV) console.log('[Apex Sync] All tables in sync — nothing to pull');
      } else {
        // Fetch full data from Supabase
        const response = await apiClient.get('/api/sync/pull/all');
        if (!response.data) return;

        const pulledData = response.data;

        // Store user in auth store
        if (pulledData.user) {
          useAuthStore.getState().setUser(pulledData.user);
        }

        // ── BOOKS ──
        if (tablesToPull.includes('books') && pulledData.books?.length > 0) {
          if (import.meta.env.DEV) console.log('[Apex Sync] Pulling books:', pulledData.books.length);
          const existingBooks = await db.books.toArray();

          // Always preserve file blobs — they never come from Supabase
          const existingBlobMap = {};
          for (const eb of existingBooks) {
            if (eb.fileBlob) {
              if (eb.supabaseId) existingBlobMap[eb.supabaseId] = eb.fileBlob;
              if (eb.local_id) existingBlobMap[eb.local_id] = eb.fileBlob;
            }
          }

          await db.books.clear();
          const mappedBooks = pulledData.books.map(b => {
            const mapped = {
              ...mapSnakeToCamel(b),
              supabaseId: b.id,
              synced: true,
            };
            delete mapped.id;
            if (existingBlobMap[b.id]) mapped.fileBlob = existingBlobMap[b.id];
            else if (existingBlobMap[b.local_id]) mapped.fileBlob = existingBlobMap[b.local_id];
            return mapped;
          });

          const newDexieIds = await db.books.bulkAdd(mappedBooks, { allKeys: true });
          for (const newId of newDexieIds) {
            await db.books.update(newId, { local_id: newId.toString() });
          }
          if (import.meta.env.DEV) console.log('[Apex Sync] Books pulled and stored:', newDexieIds.length);
        }

        // ── READING PROGRESS ──
        if (tablesToPull.includes('reading_progress') && pulledData.reading_progress?.length > 0) {
          if (import.meta.env.DEV) console.log('[Apex Sync] Pulling reading_progress:', pulledData.reading_progress.length);
          await db.reading_progress.clear();
          const mapped = pulledData.reading_progress.map(r => ({
            ...mapSnakeToCamel(r),
            supabaseId: r.id,
            synced: true,
          }));
          for (const m of mapped) { delete m.id; }
          await db.reading_progress.bulkAdd(mapped);
        }

        // ── HIGHLIGHTS ──
        if (tablesToPull.includes('highlights') && pulledData.highlights?.length > 0) {
          if (import.meta.env.DEV) console.log('[Apex Sync] Pulling highlights:', pulledData.highlights.length);
          await db.highlights.clear();
          const mapped = pulledData.highlights.map(h => ({
            ...mapSnakeToCamel(h),
            supabaseId: h.id,
            synced: true,
          }));
          for (const m of mapped) { delete m.id; }
          await db.highlights.bulkAdd(mapped);
        }

        // ── BOOKMARKS ──
        if (tablesToPull.includes('bookmarks') && pulledData.bookmarks?.length > 0) {
          if (import.meta.env.DEV) console.log('[Apex Sync] Pulling bookmarks:', pulledData.bookmarks.length);
          await db.bookmarks.clear();
          const mapped = pulledData.bookmarks.map(b => ({
            ...mapSnakeToCamel(b),
            supabaseId: b.id,
            synced: true,
          }));
          for (const m of mapped) { delete m.id; }
          await db.bookmarks.bulkAdd(mapped);
        }

        // ── NOTES ──
        if (tablesToPull.includes('notes') && pulledData.notes?.length > 0) {
          if (import.meta.env.DEV) console.log('[Apex Sync] Pulling notes:', pulledData.notes.length);
          await db.notes.clear();
          const mapped = pulledData.notes.map(n => ({
            ...mapSnakeToCamel(n),
            supabaseId: n.id,
            synced: true,
          }));
          for (const m of mapped) { delete m.id; }
          await db.notes.bulkAdd(mapped);
        }

        // ── AI CONVERSATIONS (Category B — always pull, no conflict resolution) ──
        if (pulledData.ai_conversations?.length > 0) {
          await clearAllChats();
          const bookTitles = {};
          const localBooks = await db.books.toArray();
          for (const b of localBooks) {
            const supabaseId = b.supabaseId || (b.synced ? b.id?.toString() : null);
            if (supabaseId) bookTitles[supabaseId] = b.title;
          }
          for (const row of pulledData.ai_conversations) {
            const timeMs = new Date(row.created_at).getTime();
            const groupId = row.chat_type === 'general' ? 'general' : row.book_id;
            if (!groupId) continue;
            const title = row.query_text
              ? (row.query_text.slice(0, 40) + (row.query_text.length > 40 ? '...' : ''))
              : 'Sync Chat';
            const scope = groupId === 'general' ? 'general' : (bookTitles[groupId] || 'Unknown Book');
            await saveChat({
              id: timeMs,
              title,
              scope,
              updatedAt: new Date(timeMs).toISOString(),
              messages: [
                { id: timeMs, role: 'user', content: row.query_text },
                { id: timeMs + 1, role: 'ai', content: row.ai_response }
              ]
            });
          }
        }
      }

      // Step 6: Store SERVER time as last_synced_at anchor
      // CRITICAL — use serverTime from the response, NEVER new Date()
      // This is what makes the algorithm clock-agnostic
      if (serverTime) {
        await this._setLastSyncedAt(serverTime);
      }

      if (import.meta.env.DEV) console.log('[Apex Sync] Sync complete. Decisions were:', decisions);

    } catch (error) {
      if (import.meta.env.DEV) console.error('[Apex Sync] pullAllUserData failed:', error);
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
      const supabaseBookId = await this._resolveBookId(bookId, highlightData._supabase_book_id);
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
          if (import.meta.env.DEV) console.error('Failed to save highlight to Supabase:', error);
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
        if (import.meta.env.DEV) console.warn('Book not synced to Supabase yet, queuing highlight');
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
        if (import.meta.env.DEV) console.error('Failed to update highlight on Supabase:', error);
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
        if (import.meta.env.DEV) console.error('Failed to delete highlight from Supabase:', error);
      }
    }
  },

  // ============================================
  // DIRECT SAVE — READING PROGRESS (Category A, debounced)
  // ============================================
  _saveProgressDirect: async function (bookId, progressData) {
    if (import.meta.env.DEV) console.log('[Apex Sync] _saveProgressDirect called:', {
      bookId,
      current_page: progressData.current_page,
      scroll_position: progressData.scroll_position,
      progress_percentage: progressData.progress_percentage,
      _supabase_book_id: progressData._supabase_book_id,
    });
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
    // Check autoSaveProgress setting — skip cloud sync if disabled
    const { autoSaveProgress } = useSettingsStore.getState();
    if (!autoSaveProgress) {
      if (import.meta.env.DEV) console.log('[Apex Sync] autoSaveProgress disabled — skipping Supabase sync for progress');
      return;
    }
    if (navigator.onLine) {
      // Use the supabaseId hint passed from BookContext (React state) first.
      // After pull sync, Dexie book IDs change but React state keeps old IDs,
      // so _resolveBookId(oldDexieId) fails. The hint bypasses that broken lookup.
      const supabaseBookId = progressData._supabase_book_id || await this._resolveBookId(bookId);
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
          if (import.meta.env.DEV) console.error('Failed to save progress to Supabase:', error);
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
      const supabaseBookId = await this._resolveBookId(bookId, bookmarkData._supabase_book_id);
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
          if (import.meta.env.DEV) console.error('Failed to save bookmark to Supabase:', error);
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
        if (import.meta.env.DEV) console.error('Failed to delete bookmark from Supabase:', error);
      }
    }
  },

  // ============================================
  // DIRECT SAVE — NOTES (Category A)
  // ============================================
  saveNote: async function (bookId, noteData) {
    const localId = generateLocalId();
    const now = new Date().toISOString();

    // Build Dexie record
    const dexieRecord = {
      bookId,
      local_id: localId,
      text: noteData.text || '',
      context: noteData.context || null,
      noteType: noteData.type || noteData.noteType || 'manual_note',
      createdAt: now,
      updatedAt: now,
      synced: false,
      supabaseId: null,
    };

    // Step 1: Save to Dexie immediately
    const dexieId = await db.notes.add(dexieRecord);
    if (import.meta.env.DEV) console.log('[Apex] Note saved to Dexie:', dexieId);

    // Step 2: If online, resolve Supabase book UUID and save
    if (navigator.onLine) {
      const supabaseBookId = await this._resolveBookId(bookId, noteData._supabase_book_id);
      if (supabaseBookId) {
        try {
          const response = await apiClient.post(`/api/books/${supabaseBookId}/notes`, {
            text: dexieRecord.text,
            context: dexieRecord.context,
            note_type: dexieRecord.noteType,
            local_id: localId,
          });
          await db.notes.update(dexieId, {
            supabaseId: response.data.id,
            synced: true,
          });
          if (import.meta.env.DEV) console.log('[Apex] Note saved to Supabase:', response.data.id);
          return { ...dexieRecord, id: dexieId, supabaseId: response.data.id };
        } catch (err) {
          if (import.meta.env.DEV) console.error('[Apex] Failed to save note to Supabase:', err);
          await this._queueForSync('upload', 'notes', localId, {
            book_id: supabaseBookId,
            text: dexieRecord.text,
            context: dexieRecord.context,
            note_type: dexieRecord.noteType,
          });
        }
      } else {
        // Book not synced yet — queue with dexie book id for later resolution
        if (import.meta.env.DEV) console.warn('[Apex] Book not synced yet — queuing note');
        await this._queueForSync('upload', 'notes', localId, {
          _dexie_book_id: bookId,
          text: dexieRecord.text,
          context: dexieRecord.context,
          note_type: dexieRecord.noteType,
        });
      }
    } else {
      // Offline — queue for later
      if (import.meta.env.DEV) console.log('[Apex] Offline — note queued for sync');
      await this._queueForSync('upload', 'notes', localId, {
        _dexie_book_id: bookId,
        text: dexieRecord.text,
        context: dexieRecord.context,
        note_type: dexieRecord.noteType,
      });
    }

    return { ...dexieRecord, id: dexieId };
  },

  updateNote: async function (supabaseId, dexieId, text) {
    const now = new Date().toISOString();

    // Update Dexie immediately
    await db.notes.update(dexieId, { text, updatedAt: now, synced: false });
    if (import.meta.env.DEV) console.log('[Apex] Note updated in Dexie:', dexieId);

    // If online and synced, update Supabase
    if (navigator.onLine && supabaseId) {
      try {
        await apiClient.put(`/api/notes/${supabaseId}`, { text, updated_at: now });
        await db.notes.update(dexieId, { synced: true });
        if (import.meta.env.DEV) console.log('[Apex] Note updated in Supabase:', supabaseId);
      } catch (err) {
        if (import.meta.env.DEV) console.error('[Apex] Failed to update note in Supabase:', err);
      }
    }
  },

  deleteNote: async function (supabaseId, dexieId) {
    // Delete from Dexie immediately
    if (dexieId) {
      await db.notes.delete(dexieId).catch(err =>
        { if (import.meta.env.DEV) console.error('[Apex] Failed to delete note from Dexie:', err); }
      );
      if (import.meta.env.DEV) console.log('[Apex] Note deleted from Dexie:', dexieId);
    }

    // If online and synced, delete from Supabase
    if (navigator.onLine && supabaseId) {
      try {
        await apiClient.delete(`/api/notes/${supabaseId}`);
        if (import.meta.env.DEV) console.log('[Apex] Note deleted from Supabase:', supabaseId);
      } catch (err) {
        if (import.meta.env.DEV) console.error('[Apex] Failed to delete note from Supabase:', err);
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

        if (import.meta.env.DEV) console.log('[Apex Sync] Processing offline book upload:', {
          local_id: item.local_id,
          title: localBook?.title,
          hasBlob: !!localBook?.fileBlob,
          attempts: item.attempts,
        });

        if (!localBook?.fileBlob) {
          if (import.meta.env.DEV) console.warn('[Apex Sync] Skipping book — no fileBlob found for local_id:', item.local_id);
          // Mark as failed after 3 attempts — blob is gone, can't recover
          await db.sync_queue.update(item.id, {
            attempts: (item.attempts || 0) + 1,
            status: (item.attempts || 0) >= 2 ? 'failed' : 'pending',
          });
          continue;
        }

        const file = new File(
          [localBook.fileBlob],
          localBook.title,
          { type: localBook.fileType || 'application/pdf' }
        );

        if (import.meta.env.DEV) console.log('[Apex Sync] Uploading offline book to Supabase:', localBook.title);
        const result = await this.uploadBook(file, localBook.title, localBook.author || 'Unknown', localBook.id);

        if (import.meta.env.DEV) console.log('[Apex Sync] Book upload result:', {
          title: localBook.title,
          success: !!result,
          supabaseId: result?.id,
          filePath: result?.file_path,
        });

        await db.sync_queue.update(item.id, {
          status: result ? 'synced' : 'pending',
          attempts: result ? item.attempts : (item.attempts || 0) + 1,
        });
      }

      // CRITICAL: Books are handled exclusively via uploadBook() above (Path 1)
      // They must NEVER fall through to the generic /api/sync endpoint (Path 2)
      // because /api/sync has no file upload capability — it would save file_path as null
      // Filter out ALL book items from the queue before Path 2 runs
      if (import.meta.env.DEV) console.log('[Apex Sync] Book uploads processed via Path 1 — filtering from generic queue');

      // Path 2: generic sync queue — explicitly excludes books
      // Books are handled exclusively in Path 1 via uploadBook() with actual file upload
      // Sending books through this path would result in file_path = null in Supabase
      let queueItems = await db.sync_queue
        .where('status').equals('pending')
        .filter(item => item.tableName !== 'books') // ← CRITICAL: never process books here
        .toArray();

      if (import.meta.env.DEV) console.log('[Apex Sync] Generic queue items to process:', queueItems.length, '(books excluded)');

      if (queueItems.length === 0) {
        if (import.meta.env.DEV) console.log('Sync: No pending items to push');
        return;
      }

      // Pre-process: resolve _dexie_book_id to actual Supabase UUID for queued items
      for (const item of queueItems) {
        if (item.payload?._dexie_book_id && !item.payload?.book_id) {
          let supabaseBookId = await this._resolveBookId(item.payload._dexie_book_id);

          if (supabaseBookId) {
            item.payload.book_id = supabaseBookId;
            delete item.payload._dexie_book_id;
            // Update in Dexie so we don't re-resolve next time
            await db.sync_queue.update(item.id, { payload: item.payload });
          } else {
            // Check if this Dexie ID is definitively gone (not just unsynced)
            const bookExists = await db.books.get(item.payload._dexie_book_id);
            if (!bookExists) {
              // Book ID doesn't exist in Dexie at all — this is a stale item from before
              // pull sync re-IDed all books. The data it contains was already pulled from
              // Supabase, so this queue entry is safe to discard immediately.
              if (import.meta.env.DEV) console.log(`[Apex Sync] Cleaning stale ${item.tableName} queue item — Dexie ID ${item.payload._dexie_book_id} no longer exists`);
              await db.sync_queue.update(item.id, { status: 'failed' });
            } else {
              // Book exists but has no supabaseId — genuinely not synced yet, retry later
              if (import.meta.env.DEV) console.warn(`Sync: Skipping ${item.tableName} — book not synced yet`);
            }
            continue;
          }
        }
      }

      // Filter out items that still have unresolved book IDs
      queueItems = queueItems.filter(item => !item.payload?._dexie_book_id);

      if (queueItems.length === 0) {
        if (import.meta.env.DEV) console.log('Sync: All pending items waiting for book sync');
        return;
      }

      if (import.meta.env.DEV) console.log(`Sync: Pushing ${queueItems.length} pending items...`);

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
                if (import.meta.env.DEV) console.warn(`Sync: Could not update local record for ${tableName}:`, err);
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
              if (import.meta.env.DEV) console.log(`Sync: Successfully pushed ${synced.length} items`);
            }
            if (failed.length > 0) {
              if (import.meta.env.DEV) console.warn(`Sync: ${failed.length} items failed`, failed);
            }
          }
        } catch (batchError) {
          if (import.meta.env.DEV) console.error(`Sync: Batch failed:`, batchError);
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
        if (import.meta.env.DEV) console.warn('Sync queue cleanup failed:', cleanupErr);
      }
    } catch (error) {
      if (import.meta.env.DEV) console.error('Push sync failed:', error);
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
      if (import.meta.env.DEV) console.log('Device online, flushing sync queue...');
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
        if (import.meta.env.DEV) console.error('Auth verification failed:', error);
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
        if (import.meta.env.DEV) console.log('Migration: No local data to migrate');
        return;
      }

      if (import.meta.env.DEV) console.log(`Migration: Found ${unsyncedBooks.length} local books to migrate`);
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

      if (import.meta.env.DEV) console.log(`Migration: Queued ${queuedCount} records for sync`);

      if (queuedCount > 0 && navigator.onLine) {
        await this.pushSync();
      }
    } catch (error) {
      if (import.meta.env.DEV) console.error('Migration failed:', error);
    }
  }
};

export default syncService;
