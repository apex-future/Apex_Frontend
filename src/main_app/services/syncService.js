import db from '../db/apex.db';
import { saveChat, clearAllChats } from '../utils/db';
import apiClient from './apiClient';
import authService from './authService';
import useAuthStore from '../store/authStore';
import useSettingsStore from '../store/settingsStore';
import useSpaceStore from '../store/spaceStore';

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
      // Get total_pages from Dexie if already known (e.g. PDF was opened before upload)
      let totalPages = 0;
      try {
        const localBook = await db.books.get(dexieBookId);
        totalPages = localBook?.totalPages || 0;
      } catch (_) {}

      const formData = new FormData();
      formData.append('file', fileObject);
      formData.append('title', title);
      formData.append('author', author || 'Unknown');
      formData.append('local_id', dexieBookId.toString());
      if (totalPages > 1) formData.append('total_pages', totalPages.toString());

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
          tabs: new Date().toISOString(),
          book_notes: new Date().toISOString(),
          book_spaces: new Date().toISOString(),
          exam_reminders: new Date().toISOString(),
          server_time: new Date().toISOString(),
        };
        serverTime = new Date().toISOString();
      }

      // Step 2: Get last successful sync timestamp (server-generated, stored locally)
      const lastSyncedAt = await this._getLastSyncedAt();
      if (import.meta.env.DEV) console.log('[Apex Sync] Last synced at:', lastSyncedAt || 'never (first sync on this device)');

      // Step 3: Decide action per table — no client clock involved
      const tables = ['books', 'reading_progress', 'highlights', 'bookmarks', 'tabs', 'book_notes', 'book_spaces', 'exam_reminders'];
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

        // ── CROSS-DEVICE DELETE CLEANUP ──
        // If we pulled books, any local book with a supabaseId that ISN'T in the
        // pulled set was deleted on another device. Clean up its local records.
        // This runs AFTER db.books.clear() + bulkAdd, so the local DB already
        // reflects the cloud state. But related tables may still have orphans
        // if their pull was skipped (decision === 'skip').
        if (tablesToPull.includes('books') && pulledData.books) {
          const pulledSupabaseIds = new Set(pulledData.books.map(b => b.id));
          // Check for orphaned related records whose book no longer exists
          const currentLocalBooks = await db.books.toArray();
          const localBookIds = new Set(currentLocalBooks.map(b => b.id));
          const localSupabaseIds = new Set(currentLocalBooks.map(b => b.supabaseId).filter(Boolean));

          // Clean up related records for books that no longer exist locally
          const allTables = ['bookmarks', 'highlights', 'reading_progress', 'tabs', 'book_notes'];
          for (const table of allTables) {
            try {
              const records = await db[table].toArray();
              const orphanIds = records
                .filter(r => {
                  const bid = r.bookId;
                  // If bookId is an integer, check if it exists in local books
                  if (typeof bid === 'number') return !localBookIds.has(bid);
                  // If bookId is a UUID string, check if it exists in pulled books
                  if (typeof bid === 'string' && bid.includes('-')) return !pulledSupabaseIds.has(bid);
                  return false;
                })
                .map(r => r.id);
              if (orphanIds.length > 0) {
                await db[table].bulkDelete(orphanIds);
                if (import.meta.env.DEV) console.log(`[Apex Sync] Cleaned up ${orphanIds.length} orphaned ${table} records`);
              }
            } catch (err) {
              if (import.meta.env.DEV) console.warn(`[Apex Sync] Orphan cleanup failed for ${table}:`, err);
            }
          }
        }

        // ── READING PROGRESS ──
        if (tablesToPull.includes('reading_progress') && pulledData.reading_progress?.length > 0) {
          if (import.meta.env.DEV) console.log('[Apex Sync] Pulling reading_progress:', pulledData.reading_progress.length);

          // Build a UUID → Dexie integer id map from the freshly-pulled books
          const localBooks = await db.books.toArray();
          const uuidToDexieId = {};
          for (const b of localBooks) {
            if (b.supabaseId) uuidToDexieId[b.supabaseId] = b.id;
          }

          await db.reading_progress.clear();
          const mapped = pulledData.reading_progress.map(r => {
            const camel = mapSnakeToCamel(r);
            // Remap bookId from Supabase UUID to local Dexie integer id
            // This fixes the new-device mismatch where progress.bookId is a UUID
            // but books.id is an auto-increment integer
            const localBookId = uuidToDexieId[r.book_id];
            if (localBookId !== undefined) {
              camel.bookId = localBookId;
            }
            return {
              ...camel,
              supabaseId: r.id,
              synced: true,
            };
          });
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
        if (tablesToPull.includes('tabs') && pulledData.tabs?.length > 0) {
          if (import.meta.env.DEV) console.log('[Apex Sync] Pulling tabs:', pulledData.tabs.length);
          await db.tabs.clear();
          const mapped = pulledData.tabs.map(n => ({
            ...mapSnakeToCamel(n),
            supabaseId: n.id,
            synced: true,
          }));
          for (const m of mapped) { delete m.id; }
          await db.tabs.bulkAdd(mapped);
        }

        // ── BOOK NOTES ──
        if (tablesToPull.includes('book_notes') && pulledData.book_notes?.length > 0) {
          if (import.meta.env.DEV) console.log('[Apex Sync] Pulling book_notes:', pulledData.book_notes.length);
          await db.book_notes.clear();
          const mapped = pulledData.book_notes.map(n => ({
            ...mapSnakeToCamel(n),
            supabaseId: n.id,
            synced: true,
          }));
          for (const m of mapped) { delete m.id; }
          await db.book_notes.bulkAdd(mapped);
        }

        // ── BOOK SPACES ──
        if (pulledData.book_spaces?.length > 0) {
          console.log('[Apex Sync] Pulling book_spaces:', pulledData.book_spaces.length);
          await db.book_spaces.clear();
          const mappedSpaces = pulledData.book_spaces.map(s => ({
            local_id: s.local_id || s.id,
            supabaseId: s.id,
            name: s.name,
            cover_color: s.cover_color || '#8B5CF6',
            synced: true,
            createdAt: s.created_at,
            updatedAt: s.updated_at,
          }));
          await db.book_spaces.bulkAdd(mappedSpaces);

          // Rehydrate Zustand spaceStore — preserve system spaces
          const { spaces: currentSpaces } = useSpaceStore.getState();
          const systemSpaces = currentSpaces.filter(s => s.isSystem);
          const pulledUserSpaces = mappedSpaces.map(s => ({
            id: s.local_id,
            local_id: s.local_id,
            supabaseId: s.supabaseId,
            name: s.name,
            isSystem: false,
            bookIds: [],
            goals: [],
            activitySummaries: { timeSpent: 0, pagesRead: 0, quizzesTaken: 0, aiInteractions: 0 },
            synced: true,
          }));
          useSpaceStore.setState({ spaces: [...systemSpaces, ...pulledUserSpaces] });
          console.log('[Apex Sync] Zustand spaceStore rehydrated with', pulledUserSpaces.length, 'spaces');
        }

        // ── BOOK SPACE BOOKS ──
        if (pulledData.book_space_books?.length > 0) {
          console.log('[Apex Sync] Pulling book_space_books:', pulledData.book_space_books.length);
          await db.book_space_books.clear();
          const localBooks = await db.books.toArray();
          const supabaseIdToDexieId = {};
          for (const b of localBooks) { if (b.supabaseId) supabaseIdToDexieId[b.supabaseId] = b.id; }

          const mappedJoins = pulledData.book_space_books.map(r => ({
            local_id: r.id,
            supabaseId: r.id,
            spaceLocalId: r.book_space_id,
            spaceSupabaseId: r.book_space_id,
            bookSupabaseId: r.book_id,
            synced: true,
            addedAt: r.added_at,
          }));
          await db.book_space_books.bulkAdd(mappedJoins);

          // Rehydrate bookIds in Zustand spaceStore
          const spaceBookMap = {};
          for (const r of pulledData.book_space_books) {
            if (!spaceBookMap[r.book_space_id]) spaceBookMap[r.book_space_id] = [];
            const localBookId = supabaseIdToDexieId[r.book_id];
            if (localBookId !== undefined) spaceBookMap[r.book_space_id].push(localBookId);
          }
          const { spaces } = useSpaceStore.getState();
          useSpaceStore.setState({
            spaces: spaces.map(s => {
              if (s.isSystem) return s;
              const localBookIds = spaceBookMap[s.supabaseId] || [];
              return { ...s, bookIds: localBookIds };
            })
          });
          console.log('[Apex Sync] bookIds rehydrated into Zustand spaces');
        }

        // ── EXAM REMINDERS ──
        if (pulledData.exam_reminders?.length > 0) {
          console.log('[Apex Sync] Pulling exam_reminders:', pulledData.exam_reminders.length);
          await db.exam_reminders.clear();
          const mappedReminders = pulledData.exam_reminders.map(r => ({
            local_id: r.local_id || r.id,
            supabaseId: r.id,
            examName: r.exam_name,
            examDate: r.exam_date,
            isActive: r.is_active,
            bookSpaceSupabaseId: r.book_space_id || null,
            synced: true,
            createdAt: r.created_at,
            updatedAt: r.updated_at,
          }));
          await db.exam_reminders.bulkAdd(mappedReminders);

          // Rehydrate studyStore exams from pulled exam reminders
          const { default: useStudyStore } = await import('../store/studyStore');
          const examsMapped = mappedReminders.map(r => ({
            id: r.local_id,
            supabaseId: r.supabaseId,
            name: r.examName,
            date: r.examDate,
            isPaused: !r.isActive,
          }));
          useStudyStore.getState().setExams(examsMapped);
          console.log('[Apex Sync] studyStore exams rehydrated:', examsMapped.length);
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
        console.log('[Apex Sync] Blocking activity sync — book not yet synced, queuing');
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
  // DELETE BOOK — Direct API call (matches deleteHighlight/deleteBookmark pattern)
  // ============================================
  deleteBook: async function (supabaseId) {
    if (!supabaseId) return;

    if (navigator.onLine) {
      try {
        // The backend DELETE /api/books/{id} cascades to related tables
        // (reading_progress, highlights, bookmarks, tabs, storage file)
        await apiClient.delete(`/api/books/${supabaseId}`);
        if (import.meta.env.DEV) console.log('[Apex Sync] Book deleted from Supabase:', supabaseId);
      } catch (error) {
        if (import.meta.env.DEV) console.error('[Apex Sync] Failed to delete book from Supabase:', error);
        // Queue for retry when back online
        await this._queueForSync('delete', 'books', supabaseId, { record_id: supabaseId });
      }
    } else {
      // Offline — queue for later
      if (import.meta.env.DEV) console.log('[Apex Sync] Offline — queuing book delete for supabaseId:', supabaseId);
      await this._queueForSync('delete', 'books', supabaseId, { record_id: supabaseId });
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

    // Compute progress locally from current_page / total_pages
    const totalPages = progressData.total_pages || 1;
    const computedProgress = totalPages > 0
      ? Math.min(Math.round((progressData.current_page / totalPages) * 100), 100)
      : 0;

    // Save to Dexie — upsert by bookId
    const existing = await db.reading_progress.where('bookId').equals(bookId).first();
    const dexieData = {
      bookId,
      currentPage: progressData.current_page,
      scrollPosition: progressData.scroll_position || 0,
      progressPercentage: computedProgress,
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
          // NOTE: progress_percentage and total_time_read are NOT sent.
          // Server computes progress from current_page / books.total_pages.
          // total_time_read is only incremented via /progress/time endpoint.
          const response = await apiClient.post(`/api/books/${supabaseBookId}/progress`, {
            current_page: progressData.current_page,
            scroll_position: progressData.scroll_position || 0,
            total_pages: totalPages > 1 ? totalPages : undefined,
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
            last_read_at: now,
          });
        }
      } else {
        console.log('[Apex Sync] Blocking activity sync — book not yet synced, queuing');
        await this._queueForSync('upload', 'reading_progress', existing?.local_id || localId, {
          _dexie_book_id: bookId,
          current_page: progressData.current_page,
          scroll_position: progressData.scroll_position || 0,
          last_read_at: now,
        });
      }
    } else {
      await this._queueForSync('upload', 'reading_progress', existing?.local_id || localId, {
        _dexie_book_id: bookId,
        current_page: progressData.current_page,
        scroll_position: progressData.scroll_position || 0,
        last_read_at: now,
      });
    }
  },

  // Debounced version — called by BookContext
  saveProgress: null, // initialized in init()

  // ============================================
  // INCREMENT READING TIME — called by reading timer
  // Fire-and-forget: 1 minute passed → tell the backend
  // ============================================
  incrementReadingTime: async function(bookId) {
    console.log('[ReadingTime] 1 minute elapsed — incrementing reading time for bookId:', bookId);

    // Also increment in Dexie so local reads stay accurate
    try {
      const existing = await db.reading_progress.where('bookId').equals(bookId).first();
      if (existing) {
        const newTime = (existing.total_time_read || 0) + 1;
        await db.reading_progress.update(existing.id, { 
          total_time_read: newTime,
          lastReadAt: new Date().toISOString()
        });
        console.log('[ReadingTime] Dexie updated — total_time_read:', newTime);
      }
      // Note: if no Dexie row exists yet, the backend will create one
    } catch (err) {
      console.warn('[ReadingTime] Dexie increment failed (non-blocking):', err);
    }

    // Fire-and-forget to backend — do not await, never block the timer
    if (navigator.onLine) {
      const supabaseBookId = await this._resolveBookId(bookId).catch(() => null);
      if (supabaseBookId) {
        apiClient.post(`/api/books/${supabaseBookId}/progress/time`)
          .then(() => console.log('[ReadingTime] Backend increment confirmed'))
          .catch(err => console.warn('[ReadingTime] Backend increment failed (non-blocking):', err));
      } else {
        console.warn('[ReadingTime] Cannot increment — book not yet synced to Supabase');
      }
    } else {
      console.log('[ReadingTime] Offline — reading time increment will be lost (acceptable tradeoff)');
    }
  },

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
        console.log('[Apex Sync] Blocking activity sync — book not yet synced, queuing');
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
  // DIRECT SAVE — TABS (Category A)
  // ============================================
  saveTab: async function (bookId, tabData) {
    const localId = generateLocalId();
    const now = new Date().toISOString();

    // Build Dexie record
    const dexieRecord = {
      bookId,
      local_id: localId,
      text: tabData.text || '',
      context: tabData.context || null,
      noteType: tabData.type || tabData.noteType || 'manual_note',
      createdAt: now,
      updatedAt: now,
      synced: false,
      supabaseId: null,
    };

    // Step 1: Save to Dexie immediately
    const dexieId = await db.tabs.add(dexieRecord);
    if (import.meta.env.DEV) console.log('[Apex] Tab saved to Dexie:', dexieId);

    // Step 2: If online, resolve Supabase book UUID and save
    if (navigator.onLine) {
      const supabaseBookId = await this._resolveBookId(bookId, tabData._supabase_book_id);
      if (supabaseBookId) {
        try {
          const response = await apiClient.post(`/api/books/${supabaseBookId}/tabs`, {
            text: dexieRecord.text,
            context: dexieRecord.context,
            note_type: dexieRecord.noteType,
            local_id: localId,
          });
          await db.tabs.update(dexieId, {
            supabaseId: response.data.id,
            synced: true,
          });
          if (import.meta.env.DEV) console.log('[Apex] Tab saved to Supabase:', response.data.id);
          return { ...dexieRecord, id: dexieId, supabaseId: response.data.id };
        } catch (err) {
          if (import.meta.env.DEV) console.error('[Apex] Failed to save tab to Supabase:', err);
          await this._queueForSync('upload', 'tabs', localId, {
            book_id: supabaseBookId,
            text: dexieRecord.text,
            context: dexieRecord.context,
            note_type: dexieRecord.noteType,
          });
        }
      } else {
        // Book not synced yet — queue with dexie book id for later resolution
        console.log('[Apex Sync] Blocking activity sync — book not yet synced, queuing');
        await this._queueForSync('upload', 'tabs', localId, {
          _dexie_book_id: bookId,
          text: dexieRecord.text,
          context: dexieRecord.context,
          note_type: dexieRecord.noteType,
        });
      }
    } else {
      // Offline — queue for later
      if (import.meta.env.DEV) console.log('[Apex] Offline — tab queued for sync');
      await this._queueForSync('upload', 'tabs', localId, {
        _dexie_book_id: bookId,
        text: dexieRecord.text,
        context: dexieRecord.context,
        note_type: dexieRecord.noteType,
      });
    }

    return { ...dexieRecord, id: dexieId };
  },

  updateTab: async function (supabaseId, dexieId, text) {
    const now = new Date().toISOString();

    // Update Dexie immediately
    await db.tabs.update(dexieId, { text, updatedAt: now, synced: false });
    if (import.meta.env.DEV) console.log('[Apex] Tab updated in Dexie:', dexieId);

    // If online and synced, update Supabase
    if (navigator.onLine && supabaseId) {
      try {
        await apiClient.put(`/api/tabs/${supabaseId}`, { text, updated_at: now });
        await db.tabs.update(dexieId, { synced: true });
        if (import.meta.env.DEV) console.log('[Apex] Tab updated in Supabase:', supabaseId);
      } catch (err) {
        if (import.meta.env.DEV) console.error('[Apex] Failed to update tab in Supabase:', err);
      }
    }
  },

  deleteTab: async function (supabaseId, dexieId) {
    // Delete from Dexie immediately
    if (dexieId) {
      await db.tabs.delete(dexieId).catch(err =>
        { if (import.meta.env.DEV) console.error('[Apex] Failed to delete tab from Dexie:', err); }
      );
      if (import.meta.env.DEV) console.log('[Apex] Tab deleted from Dexie:', dexieId);
    }

    // If online and synced, delete from Supabase
    if (navigator.onLine && supabaseId) {
      try {
        await apiClient.delete(`/api/tabs/${supabaseId}`);
        if (import.meta.env.DEV) console.log('[Apex] Tab deleted from Supabase:', supabaseId);
      } catch (err) {
        if (import.meta.env.DEV) console.error('[Apex] Failed to delete tab from Supabase:', err);
      }
    }
  },

  // ============================================
  // DIRECT SAVE — BOOK NOTES (Category A)
  // ============================================
  saveBookNote: async function (bookId, noteData) {
    const localId = noteData.local_id || generateLocalId();
    const now = new Date().toISOString();

    // Build Dexie record
    const dexieRecord = {
      bookId,
      local_id: localId,
      title: noteData.title || 'Untitled',
      content: noteData.content || '',
      template: noteData.template || 'blank',
      word_count: noteData.word_count || 0,
      createdAt: noteData.createdAt || now,
      updatedAt: now,
      synced: false,
      supabaseId: noteData.supabaseId || null,
    };

    // Step 1: Upsert in Dexie
    const existing = await db.book_notes.where('local_id').equals(localId).first();
    let dexieId;
    if (existing) {
      dexieId = existing.id;
      await db.book_notes.update(dexieId, dexieRecord);
    } else {
      dexieId = await db.book_notes.add(dexieRecord);
    }
    if (import.meta.env.DEV) console.log('[Apex] Book note saved to Dexie:', dexieId);

    // Step 2: If online, resolve Supabase book UUID and save/update
    if (navigator.onLine) {
      const supabaseBookId = await this._resolveBookId(bookId, noteData._supabase_book_id);
      if (supabaseBookId) {
        try {
          let response;
          if (noteData.supabaseId) {
            // Update existing note on Supabase
            response = await apiClient.put(`/api/book-notes/${noteData.supabaseId}`, {
              title: dexieRecord.title,
              content: dexieRecord.content,
              template: dexieRecord.template,
              word_count: dexieRecord.word_count,
              updated_at: now,
            });
          } else {
            // Create new note on Supabase
            response = await apiClient.post(`/api/books/${supabaseBookId}/book-notes`, {
              title: dexieRecord.title,
              content: dexieRecord.content,
              template: dexieRecord.template,
              word_count: dexieRecord.word_count,
              local_id: localId,
            });
          }
          await db.book_notes.update(dexieId, {
            supabaseId: response.data.id,
            synced: true,
          });
          if (import.meta.env.DEV) console.log('[Apex] Book note saved to Supabase:', response.data.id);
          this._triggerDebouncedFlush();
          return { ...dexieRecord, id: dexieId, supabaseId: response.data.id };
        } catch (err) {
          if (import.meta.env.DEV) console.error('[Apex] Failed to save book note to Supabase:', err);
          await this._queueForSync('upload', 'book_notes', localId, {
            book_id: supabaseBookId,
            title: dexieRecord.title,
            content: dexieRecord.content,
            template: dexieRecord.template,
            word_count: dexieRecord.word_count,
          });
        }
      } else {
        // Book not synced yet — queue with dexie book id for later resolution
        console.log('[Apex Sync] Blocking activity sync — book not yet synced, queuing book note');
        await this._queueForSync('upload', 'book_notes', localId, {
          _dexie_book_id: bookId,
          title: dexieRecord.title,
          content: dexieRecord.content,
          template: dexieRecord.template,
          word_count: dexieRecord.word_count,
        });
      }
    } else {
      // Offline — queue for later
      if (import.meta.env.DEV) console.log('[Apex] Offline — book note queued for sync');
      await this._queueForSync('upload', 'book_notes', localId, {
        _dexie_book_id: bookId,
        title: dexieRecord.title,
        content: dexieRecord.content,
        template: dexieRecord.template,
        word_count: dexieRecord.word_count,
      });
    }

    return { ...dexieRecord, id: dexieId };
  },

  updateBookNote: async function (supabaseId, dexieId, updateData) {
    const now = new Date().toISOString();

    // Update Dexie immediately
    const dexieUpdate = {
      ...updateData,
      updatedAt: now,
      synced: false,
    };
    await db.book_notes.update(dexieId, dexieUpdate);
    if (import.meta.env.DEV) console.log('[Apex] Book note updated in Dexie:', dexieId);

    // If online and synced, update Supabase
    if (navigator.onLine && supabaseId) {
      try {
        await apiClient.put(`/api/book-notes/${supabaseId}`, {
          title: updateData.title,
          content: updateData.content,
          template: updateData.template,
          word_count: updateData.word_count,
          updated_at: now,
        });
        await db.book_notes.update(dexieId, { synced: true });
        if (import.meta.env.DEV) console.log('[Apex] Book note updated in Supabase:', supabaseId);
      } catch (err) {
        if (import.meta.env.DEV) console.error('[Apex] Failed to update book note in Supabase:', err);
      }
    }
  },

  deleteBookNote: async function (supabaseId, dexieId) {
    // Delete from Dexie immediately
    if (dexieId) {
      await db.book_notes.delete(dexieId).catch(err =>
        { if (import.meta.env.DEV) console.error('[Apex] Failed to delete book note from Dexie:', err); }
      );
      if (import.meta.env.DEV) console.log('[Apex] Book note deleted from Dexie:', dexieId);
    }

    // If online and synced, delete from Supabase
    if (navigator.onLine && supabaseId) {
      try {
        await apiClient.delete(`/api/book-notes/${supabaseId}`);
        if (import.meta.env.DEV) console.log('[Apex] Book note deleted from Supabase:', supabaseId);
      } catch (err) {
        if (import.meta.env.DEV) console.error('[Apex] Failed to delete book note from Supabase:', err);
      }
    }
  },

  // ============================================
  // EXAM REMINDERS — save & delete (called by studyStore)
  // ============================================
  saveExamReminder: async function (examData) {
    console.log('[ExamReminders] saveExamReminder called for:', examData.name, 'Payload:', examData);
    const localId = examData.id || generateLocalId();
    const now = new Date().toISOString();

    const dexieRecord = {
      local_id: localId,
      examName: examData.name,
      examDate: examData.date,
      isActive: !examData.isPaused,
      bookSpaceSupabaseId: examData.bookSpaceSupabaseId || null,
      synced: false,
      supabaseId: examData.supabaseId || null,
      updatedAt: now,
    };

    // Upsert in Dexie (local_id is unique index)
    const existing = await db.exam_reminders.where('local_id').equals(localId).first();
    let dexieId;
    if (existing) {
      await db.exam_reminders.update(existing.id, dexieRecord);
      dexieId = existing.id;
    } else {
      dexieRecord.createdAt = now;
      dexieId = await db.exam_reminders.add(dexieRecord);
    }

    if (navigator.onLine) {
      try {
        const payload = {
          exam_name: examData.name,
          exam_date: examData.date,
          is_active: !examData.isPaused,
          book_space_id: examData.bookSpaceSupabaseId || null,
          local_id: localId,
        };

        let response;
        if (examData.supabaseId) {
          console.log('[ExamReminders] Updating existing exam on Supabase:', examData.supabaseId);
          response = await apiClient.put(`/api/exam-reminders/${examData.supabaseId}`, payload);
        } else {
          console.log('[ExamReminders] Creating new exam on Supabase');
          response = await apiClient.post('/api/exam-reminders', payload);
        }

        await db.exam_reminders.update(dexieId, {
          supabaseId: response.data.id,
          synced: true,
        });
        return { ...dexieRecord, id: dexieId, supabaseId: response.data.id };
      } catch (err) {
        console.error('[ExamReminders] Failed to sync to Supabase:', err);
      }
    }

    return { ...dexieRecord, id: dexieId };
  },

  deleteExamReminder: async function (localId) {
    console.log('[ExamReminders] deleteExamReminder called for local_id:', localId);

    let supabaseId = null;
    try {
      const record = await db.exam_reminders.where('local_id').equals(localId).first();
      if (record) {
        supabaseId = record.supabaseId;
        await db.exam_reminders.delete(record.id);
      }
    } catch (err) {
      if (import.meta.env.DEV) console.error('[ExamReminders] Dexie delete failed:', err);
    }

    if (navigator.onLine && supabaseId) {
      try {
        await apiClient.delete(`/api/exam-reminders/${supabaseId}`);
      } catch (err) {
        if (import.meta.env.DEV) console.error('[ExamReminders] Failed to delete from Supabase:', err);
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
  // BOOK RETRY QUEUE — exponential backoff for failed uploads
  //
  // Lifecycle:
  //   Phase 1 (in-session):  3 timed retries at 30s → 2min → 5min
  //   Phase 2 (app re-entry): 2 more attempts, one per app open
  //   After 5 total retries (3 + 2) the book is permanently failed
  //
  // sync_retry_count is persisted in Dexie so reentry retries survive refresh.
  // _bookRetryQueue (in-memory Map) only tracks active timeoutHandles to
  // prevent duplicate concurrent timers — it is NOT the source of truth for
  // attempt counts.
  // ============================================

  // In-memory map: dexieBookId → timeoutHandle (for deduplication only)
  _bookRetryQueue: new Map(),

  /**
   * Schedule the next in-session backoff retry for a book.
   * Called once after the initial upload fails. The retry chain is
   * self-contained: each timeout callback either succeeds, schedules
   * the next retry, or marks the book as failed. No other code path
   * should call _scheduleBookRetry for the same book.
   */
  _scheduleBookRetry: async function(dexieBookId) {
    const BACKOFF_DELAYS = [30_000, 120_000, 300_000]; // 30s, 2min, 5min
    const MAX_IN_SESSION = 3;

    // Prevent duplicate timers for the same book
    const existingHandle = this._bookRetryQueue.get(dexieBookId);
    if (existingHandle) {
      console.log('[Apex Sync] Retry already scheduled for dexieId:', dexieBookId, '— skipping');
      return;
    }

    // Read persistent retry count from Dexie
    const book = await db.books.get(dexieBookId);
    if (!book) return;
    if (book.supabaseId) return; // already synced
    if (book.sync_status === 'failed') return; // already exhausted

    const retryCount = book.sync_retry_count || 0;

    if (retryCount >= MAX_IN_SESSION) {
      // In-session retries exhausted → mark as failed
      console.log('[Apex Sync] In-session retries exhausted (' + retryCount + '/' + MAX_IN_SESSION + ') for:', book.title);
      this._bookRetryQueue.delete(dexieBookId);
      await db.books.update(dexieBookId, { sync_status: 'failed', sync_retry_count: retryCount });
      return;
    }

    const delay = BACKOFF_DELAYS[retryCount];
    console.log('[Apex Sync] Scheduling book retry', (retryCount + 1), 'of', MAX_IN_SESSION, 'in', delay / 1000, 's for:', book.title);

    const timeoutHandle = setTimeout(async () => {
      // Timer fired — remove handle from dedup map immediately
      this._bookRetryQueue.delete(dexieBookId);

      if (!navigator.onLine) {
        console.log('[Apex Sync] Retry fired but offline — will retry when back online for:', book.title);
        // Don't reschedule — the online listener will pick it up
        return;
      }

      // Re-read book state (it may have changed while waiting)
      const freshBook = await db.books.get(dexieBookId);
      if (!freshBook) {
        console.log('[Apex Sync] Book deleted during retry wait — cancelling for dexieId:', dexieBookId);
        return;
      }
      if (freshBook.supabaseId) {
        console.log('[Apex Sync] Book already synced during retry wait — cancelling for:', freshBook.title);
        return;
      }
      if (freshBook.sync_status === 'failed') {
        console.log('[Apex Sync] Book already marked failed — cancelling retry for:', freshBook.title);
        return;
      }
      if (!freshBook.fileBlob) {
        console.log('[Apex Sync] No fileBlob — cannot retry upload for:', freshBook.title);
        await db.books.update(dexieBookId, { sync_status: 'failed' });
        return;
      }

      const currentRetry = (freshBook.sync_retry_count || 0) + 1;
      console.log('[Apex Sync] Retrying book upload, attempt', currentRetry, 'for:', freshBook.title);

      // Persist the incremented count BEFORE the attempt
      await db.books.update(dexieBookId, { sync_retry_count: currentRetry });

      const file = new File([freshBook.fileBlob], freshBook.title, { type: freshBook.fileType || 'application/pdf' });
      const result = await this.uploadBook(file, freshBook.title, freshBook.author || 'Unknown', dexieBookId);

      if (result) {
        console.log('[Apex Sync] Book retry succeeded for:', freshBook.title);
        await db.books.update(dexieBookId, { sync_status: 'synced', sync_retry_count: currentRetry });
      } else {
        console.log('[Apex Sync] Book retry', currentRetry, 'failed for:', freshBook.title);
        if (currentRetry >= MAX_IN_SESSION) {
          console.log('[Apex Sync] In-session retries exhausted — marking failed for:', freshBook.title);
          await db.books.update(dexieBookId, { sync_status: 'failed', sync_retry_count: currentRetry });
        } else {
          // Schedule the next backoff retry (recursive, but deduped by the Map check)
          await this._scheduleBookRetry(dexieBookId);
        }
      }
    }, delay);

    this._bookRetryQueue.set(dexieBookId, timeoutHandle);
  },

  /**
   * App-reentry retry: called once on init() for books that failed in a
   * previous session. Gives 2 extra attempts (sync_retry_count 3→4, 4→5).
   * After sync_retry_count reaches 5, the book is permanently abandoned.
   */
  _attemptReentryRetries: async function() {
    const MAX_TOTAL_RETRIES = 5; // 3 in-session + 2 reentry

    const failedBooks = await db.books
      .filter(b => b.sync_status === 'failed' && !b.supabaseId && !!b.fileBlob)
      .toArray();

    for (const book of failedBooks) {
      const retryCount = book.sync_retry_count || 0;

      if (retryCount >= MAX_TOTAL_RETRIES) {
        console.log('[Apex Sync] Reentry: book permanently failed (retry count:', retryCount, ') —', book.title);
        continue;
      }

      if (!navigator.onLine) {
        console.log('[Apex Sync] Reentry: offline — skipping retry for:', book.title);
        continue;
      }

      const nextRetry = retryCount + 1;
      console.log('[Apex Sync] Reentry retry', (nextRetry - 3), 'of 2 for:', book.title, '(total attempt', nextRetry, ')');

      // Mark as pending during this attempt
      await db.books.update(book.id, { sync_status: 'pending', sync_retry_count: nextRetry });

      const file = new File([book.fileBlob], book.title, { type: book.fileType || 'application/pdf' });
      const result = await this.uploadBook(file, book.title, book.author || 'Unknown', book.id);

      if (result) {
        console.log('[Apex Sync] Reentry retry succeeded for:', book.title);
        await db.books.update(book.id, { sync_status: 'synced', sync_retry_count: nextRetry });
      } else {
        console.log('[Apex Sync] Reentry retry failed for:', book.title, '— attempt', nextRetry, 'of', MAX_TOTAL_RETRIES);
        await db.books.update(book.id, { sync_status: 'failed', sync_retry_count: nextRetry });
      }
    }
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

      // Path 1a: Handle book DELETES first — these don't need fileBlob
      const bookDeletes = pendingBooks.filter(item => item.action === 'delete');
      for (const item of bookDeletes) {
        try {
          const deleteId = item.recordId || item.payload?.record_id || item.local_id;
          if (deleteId) {
            await apiClient.delete(`/api/books/${deleteId}`);
            if (import.meta.env.DEV) console.log('[Apex Sync] Book delete synced for:', deleteId);
          }
          await db.sync_queue.update(item.id, { status: 'synced' });
        } catch (err) {
          if (import.meta.env.DEV) console.error('[Apex Sync] Book delete sync failed:', err);
          await db.sync_queue.update(item.id, {
            attempts: (item.attempts || 0) + 1,
            status: (item.attempts || 0) >= 2 ? 'failed' : 'pending',
          });
        }
      }

      // Path 1b: Handle book UPLOADS — these need fileBlob
      const bookUploads = pendingBooks.filter(item => item.action !== 'delete');
      for (const item of bookUploads) {
        const localBook = await db.books
          .where('local_id').equals(item.local_id)
          .first();

        // Skip books that are already marked as failed — retry queue handles those
        if (localBook?.sync_status === 'failed') {
          if (import.meta.env.DEV) console.log('[Apex Sync] Skipping failed book in pushSync — retry queue owns this:', localBook.title);
          await db.sync_queue.update(item.id, { status: 'failed' });
          continue;
        }

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

        if (result) {
          await db.sync_queue.update(item.id, { status: 'synced' });
          await db.books.update(localBook.id, { sync_status: 'synced' });
        } else {
          await db.sync_queue.update(item.id, {
            status: 'pending',
            attempts: (item.attempts || 0) + 1,
          });
          // Schedule backoff retries — _scheduleBookRetry is the sole owner
          await this._scheduleBookRetry(localBook.id);
        }
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

    window.addEventListener('online', async () => {
      console.log('[Apex Sync] Back online — checking for pending book uploads');
      const pendingBooks = await db.books
        .filter(b => b.sync_status === 'pending' && !b.supabaseId)
        .toArray();
      for (const book of pendingBooks) {
        if (!this._bookRetryQueue.has(book.id)) {
          console.log('[Apex Sync] Scheduling retry for unqueued pending book:', book.title);
          await this._scheduleBookRetry(book.id);
        }
      }
    });

    this.triggerSync = () => this._triggerDebouncedFlush();

    // App-reentry retries: give failed books 2 more chances across app opens
    // Runs once per app load, after a small delay to let auth finish
    setTimeout(() => {
      if (navigator.onLine) {
        this._attemptReentryRetries();
      }
    }, 5000);
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
