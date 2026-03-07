import db from '../db/apex.db';
import apiClient from './apiClient';
import authService from './authService';
import useAuthStore from '../store/authStore';

// Helper: convert Supabase snake_case keys to Dexie camelCase keys
function mapSnakeToCamel(record) {
  const mapped = {};
  for (const [key, value] of Object.entries(record)) {
    // Convert snake_case to camelCase
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    mapped[camelKey] = value;
  }
  return mapped;
}

const syncService = {
  // --- Push Sync (Local -> Supabase) ---
  pushSync: async function() {
    try {
      // 1. Read all records from Dexie sync_queue where status = 'pending'
      const queueItems = await db.sync_queue
        .where('status').equals('pending')
        .toArray();

      // 2. If queue is empty, return early
      if (queueItems.length === 0) {
        console.log('Sync: No pending items to push');
        return;
      }

      console.log(`Sync: Pushing ${queueItems.length} pending items...`);

      // 3. POST to /api/sync with the queue payload
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

      // 4. On success response:
      if (response.data) {
        const { synced, failed } = response.data;

        // Process synced items
        for (const item of synced) {
          const tableName = item.tableName || 'books';
          // Update the matching Dexie record with the returned Supabase record_id
          try {
            await db[tableName].update(parseInt(item.local_id), {
              recordId: item.record_id
            });
          } catch (err) {
            console.warn(`Sync: Could not update local record for ${tableName}:`, err);
          }

          // Mark sync_queue item as 'synced'
          if (item.local_queue_id) {
            await db.sync_queue.update(item.local_queue_id, {
              status: 'synced'
            });
          }
        }

        // Process failed items
        for (const item of failed) {
          // Find the queue item by local_id
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

  // --- Pull Sync (Supabase -> Local) ---
  pullSync: async function() {
    try {
      // 1. Read last_synced_at from Dexie app_settings table
      const lastSyncedAtSetting = await db.app_settings.get({ key: 'last_synced_at' });
      const lastSyncedAt = lastSyncedAtSetting ? lastSyncedAtSetting.value : '1970-01-01T00:00:00Z';

      // 2. GET /api/sync/pull?last_synced_at={last_synced_at}  (query param, NOT path param)
      const response = await apiClient.get('/api/sync/pull', {
        params: { last_synced_at: lastSyncedAt }
      });

      // 3. For each returned record:
      if (response.data) {
        let totalPulled = 0;

        for (const [tableName, records] of Object.entries(response.data)) {
          for (const record of records) {
            // Map Supabase snake_case fields to Dexie camelCase
            const mappedRecord = mapSnakeToCamel(record);
            
            // The Supabase 'id' becomes 'recordId' in Dexie
            const supabaseId = record.id;
            
            // Check if record_id exists in Dexie
            const existing = await db[tableName].where('recordId').equals(supabaseId).first();

            const dexieData = {
              ...mappedRecord,
              recordId: supabaseId,
            };
            delete dexieData.id; // Don't overwrite Dexie's auto-increment id

            if (existing) {
              // If yes: update the Dexie record
              await db[tableName].update(existing.id, dexieData);
            } else {
              // If no: insert as new record
              await db[tableName].add(dexieData);
            }
            totalPulled++;
          }
        }

        // 4. Update last_synced_at in Dexie app_settings
        await db.app_settings.put({ key: 'last_synced_at', value: new Date().toISOString() });
        
        if (totalPulled > 0) {
          console.log(`Sync: Pulled ${totalPulled} records from server`);
        } else {
          console.log('Sync: No new records to pull');
        }
      }
    } catch (error) {
      console.error('Pull sync failed:', error);
    }
  },

  // --- Initialize Sync listeners and status ---
  init() {
    window.addEventListener('online', () => {
      console.log('Device online, triggering sync...');
      this.pushSync();
      this.pullSync();
    });

    // Debounced trigger helper
    let timeoutId;
    this.triggerSync = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        if (navigator.onLine) this.pushSync();
      }, 3000);
    };
  },

  // --- On app load sequence ---
  onAppLoad: async function() {
    const authStore = useAuthStore.getState();
    
    // 1. Check if user is authenticated (valid JWT in localStorage)
    if (authService.isAuthenticated()) {
      try {
        // 2. Call GET /api/auth/me to verify token still valid
        const user = await authService.me();
        authStore.setUser(user);

        // 3. If online: run pullSync() then pushSync()
        if (navigator.onLine) {
          await this.pullSync();
          await this.pushSync();
          // Safety: check for any orphaned local data that needs migrating
          await this.migrateLocalData();
        }
      } catch (error) {
        console.error('Auth verification failed:', error);
        authStore.clearUser();
      }
    } else {
      authStore.setLoading(false);
    }
  },
  // --- Migrate pre-account local data to Supabase ---
  // Called after a user signs up or logs in for the first time.
  // Scans Dexie for records that were created locally (no recordId)
  // and queues them all for sync to the new user's Supabase account.
  migrateLocalData: async function() {
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
        // Ensure the book has a local_id
        const localId = (book.local_id || book.id).toString();
        if (!book.local_id) {
          await db.books.update(book.id, { local_id: localId });
        }

        // Check if already in sync_queue to avoid duplicates
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

      // Migrate reading progress for those books
      const allProgress = await db.reading_progress.toArray();
      const unsyncedProgress = allProgress.filter(p => !p.recordId);

      for (const progress of unsyncedProgress) {
        const localId = (progress.local_id || progress.id).toString();
        if (!progress.local_id) {
          await db.reading_progress.update(progress.id, { local_id: localId });
        }

        const existingQueue = await db.sync_queue
          .where('local_id').equals(localId)
          .and(item => item.tableName === 'reading_progress' && item.status === 'pending')
          .first();

        if (!existingQueue) {
          await db.sync_queue.add({
            action: 'upload',
            tableName: 'reading_progress',
            local_id: localId,
            payload: {
              book_id: (progress.bookId || '').toString(),
              current_page: progress.currentPage || 0,
              scroll_position: progress.scrollPosition || 0,
              progress_percentage: progress.progressPercentage || 0,
              last_read_at: progress.lastReadAt || new Date().toISOString(),
            },
            createdAt: new Date().toISOString(),
            attempts: 0,
            status: 'pending'
          });
          queuedCount++;
        }
      }

      // Migrate highlights
      const allHighlights = await db.highlights.toArray();
      const unsyncedHighlights = allHighlights.filter(h => !h.recordId);

      for (const highlight of unsyncedHighlights) {
        const localId = (highlight.local_id || highlight.id).toString();
        if (!highlight.local_id) {
          await db.highlights.update(highlight.id, { local_id: localId });
        }

        const existingQueue = await db.sync_queue
          .where('local_id').equals(localId)
          .and(item => item.tableName === 'highlights' && item.status === 'pending')
          .first();

        if (!existingQueue) {
          await db.sync_queue.add({
            action: 'upload',
            tableName: 'highlights',
            local_id: localId,
            payload: {
              book_id: (highlight.bookId || '').toString(),
              highlighted_text: highlight.highlightedText || '',
              color: highlight.color || 'yellow',
              page_number: highlight.pageNumber || 0,
              text_position: highlight.textPosition || '',
              note: highlight.note || null,
              updated_at: highlight.updatedAt || highlight.createdAt || new Date().toISOString(),
            },
            createdAt: new Date().toISOString(),
            attempts: 0,
            status: 'pending'
          });
          queuedCount++;
        }
      }

      console.log(`Migration: Queued ${queuedCount} records for sync`);

      // Trigger immediate push sync
      if (queuedCount > 0 && navigator.onLine) {
        await this.pushSync();
      }
    } catch (error) {
      console.error('Migration failed:', error);
    }
  }
};

export default syncService;
