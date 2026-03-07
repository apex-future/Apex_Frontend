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
          payload: item.payload
        }))
      };

      const response = await apiClient.post('/api/sync', payload);

      // 4. On success response:
      if (response.data) {
        const { synced, failed } = response.data;

        // Process synced items
        for (const item of synced) {
          // Update the matching Dexie record with the returned Supabase record_id
          await db[item.local_id_table || 'books'].update(item.local_id, {
            recordId: item.record_id
          });

          // Mark sync_queue item as 'synced'
          await db.sync_queue.update(item.local_id, {
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

      // 2. GET /api/sync/pull/{last_synced_at}
      const response = await apiClient.get(`/api/sync/pull/${encodeURIComponent(lastSyncedAt)}`);

      // 3. For each returned record:
      if (response.data) {
        for (const [tableName, records] of Object.entries(response.data)) {
          for (const record of records) {
            // Check if local_id exists in Dexie
            let existing = null;
            if (record.local_id) {
              existing = await db[tableName].where('local_id').equals(record.local_id).first();
            }

            if (existing) {
              // If yes: update the Dexie record
              await db[tableName].update(existing.id, record);
            } else {
              // If no: insert as new record
              await db[tableName].add({
                ...record,
                // Ensure we don't conflict with Dexie auto-increments if necessary
                // recordId is for Supabase, id is for Dexie
              });
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
