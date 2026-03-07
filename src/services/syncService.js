import db from '../db/apex.db';
import apiClient from './apiClient';
import authService from './authService';
import useAuthStore from '../store/authStore';

const syncService = {
  // --- Push Sync (Local -> Supabase) ---
  async pushSync() {
    try {
      // 1. Read all records from Dexie sync_queue where status = 'pending'
      const queueItems = await db.sync_queue
        .where('status').equals('pending')
        .toArray();

      // 2. If queue is empty, return early
      if (queueItems.length === 0) return;

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
          await db[tableName].update(parseInt(item.local_id), {
            recordId: item.record_id
          });

          // Mark sync_queue item as 'synced'
          await db.sync_queue.update(item.local_queue_id, {
            status: 'synced'
          });
        }

        // Process failed items
        for (const item of failed) {
          const queueItem = await db.sync_queue.get(item.local_id);
          if (queueItem) {
            const attempts = (queueItem.attempts || 0) + 1;
            await db.sync_queue.update(item.local_id, {
              attempts,
              status: attempts > 3 ? 'failed' : 'pending'
            });
          }
        }
        
        // Update UI (simplified, assuming an OnlineStatusBadge exists)
        console.log('Sync completed');
      }
    } catch (error) {
      console.error('Push sync failed:', error);
    }
  },

  // --- Pull Sync (Supabase -> Local) ---
  async pullSync() {
    try {
      // 1. Read last_synced_at from Dexie app_settings table
      const lastSyncedAtSetting = await db.app_settings.get({ key: 'last_synced_at' });
      const lastSyncedAt = lastSyncedAtSetting ? lastSyncedAtSetting.value : '1970-01-01T00:00:00Z';

      // 2. GET /api/sync/pull?last_synced_at={last_synced_at}
      const response = await apiClient.get(`/api/sync/pull`, {
        params: { last_synced_at: lastSyncedAt }
      });

      // 3. For each returned record:
      if (response.data) {
        for (const [tableName, records] of Object.entries(response.data)) {
          for (const record of records) {
            // Check if record_id exists in Dexie (record_id is the primary key from Supabase)
            const existing = await db[tableName].where('recordId').equals(record.id).first();

            const dexieData = {
              ...record,
              recordId: record.id,
              // Map other fields if necessary
            };
            delete dexieData.id; // Don't overwrite Dexie's auto-increment id

            if (existing) {
              // If yes: update the Dexie record
              await db[tableName].update(existing.id, dexieData);
            } else {
              // If no: insert as new record
              await db[tableName].add(dexieData);
            }
          }
        }

        // 4. Update last_synced_at in Dexie app_settings
        await db.app_settings.put({ key: 'last_synced_at', value: new Date().toISOString() });
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
  async onAppLoad() {
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
        }
      } catch (error) {
        console.error('Auth verification failed:', error);
        authStore.clearUser();
      }
    } else {
      authStore.setLoading(false);
    }
  }
};

export default syncService;
