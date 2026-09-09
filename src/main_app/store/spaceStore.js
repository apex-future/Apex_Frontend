import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import db from '../db/apex.db';
import apiClient from '../services/apiClient';

// Default system spaces (these can't be deleted)
const SYSTEM_SPACES = [
  { id: 'active-reading', name: 'Active Reading', isSystem: true, bookIds: [], examDate: null, goals: [], activitySummaries: { timeSpent: 0, pagesRead: 0 } },
  { id: 'favorites', name: 'Favorites', isSystem: true, bookIds: [], examDate: null, goals: [], activitySummaries: { timeSpent: 0, pagesRead: 0 } },
];

const useSpaceStore = create(
  persist(
    (set, get) => ({
      spaces: [...SYSTEM_SPACES],
      activeSpaceId: null,

      createSpace: async (name) => {
        const local_id = Date.now().toString(36) + Math.random().toString(36).substr(2, 9);

        const newSpace = {
          id: local_id,
          name,
          isSystem: false,
          bookIds: [],
          goals: [],
          activitySummaries: { timeSpent: 0, pagesRead: 0, quizzesTaken: 0, aiInteractions: 0 },
          local_id,
          supabaseId: null,
          synced: false,
          createdAt: new Date().toISOString(),
        };

        set({ spaces: [...get().spaces, newSpace] });

        // Write to Dexie
        await db.book_spaces.add({
          local_id,
          name,
          cover_color: '#8B5CF6',
          synced: false,
          supabaseId: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        let supabaseId = null;

        // If online, sync to Supabase immediately
        if (navigator.onLine) {
          try {
            const response = await apiClient.post('/api/spaces', { name, cover_color: '#8B5CF6', local_id });
            supabaseId = response.data.id;

            // Update Dexie
            const dexieRecord = await db.book_spaces.where('local_id').equals(local_id).first();
            if (dexieRecord) {
              await db.book_spaces.update(dexieRecord.id, { supabaseId, synced: true });
            }

            // Update Zustand
            set({
              spaces: get().spaces.map(s => s.id === local_id ? { ...s, supabaseId, synced: true } : s)
            });
          } catch (err) {
            console.error('[SpaceStore] Failed to sync space to Supabase:', err);
          }
        }

        console.log('[SpaceStore] Space created — local_id:', local_id, 'supabaseId:', supabaseId || 'pending');
        return local_id;
      },

      updateSpace: async (id, updates) => {
        // Guard: skip Dexie/API ops for system spaces
        const space = get().spaces.find(s => s.id === id);
        if (space?.isSystem) {
          set({ spaces: get().spaces.map(s => s.id === id ? { ...s, ...updates } : s) });
          return;
        }

        // Update Zustand
        set({ spaces: get().spaces.map(s => s.id === id ? { ...s, ...updates } : s) });

        // Update Dexie
        try {
          const dexieRecord = await db.book_spaces.where('local_id').equals(id).first();
          if (dexieRecord) {
            await db.book_spaces.update(dexieRecord.id, {
              ...updates,
              updatedAt: new Date().toISOString(),
              synced: false,
            });

            // If online and has supabaseId, sync to Supabase
            if (navigator.onLine && dexieRecord.supabaseId) {
              try {
                await apiClient.put(`/api/spaces/${dexieRecord.supabaseId}`, {
                  name: updates.name !== undefined ? updates.name : dexieRecord.name,
                  cover_color: updates.cover_color !== undefined ? updates.cover_color : dexieRecord.cover_color,
                });
                await db.book_spaces.update(dexieRecord.id, { synced: true });
              } catch (err) {
                console.error('[SpaceStore] Failed to update space on Supabase:', err);
              }
            }
          }
        } catch (err) {
          console.error('[SpaceStore] Dexie update failed:', err);
        }
      },

      deleteSpace: async (id) => {
        // Guard: never delete system spaces
        const space = get().spaces.find(s => s.id === id);
        if (space?.isSystem) return;

        // Update Zustand
        set({ spaces: get().spaces.filter(s => s.id !== id || s.isSystem) });

        // Look up Dexie record
        let supabaseId = null;
        try {
          const dexieRecord = await db.book_spaces.where('local_id').equals(id).first();
          if (dexieRecord) {
            supabaseId = dexieRecord.supabaseId;
            await db.book_spaces.delete(dexieRecord.id);
          }

          // Delete all associated book_space_books records
          const joinRecords = await db.book_space_books.where('spaceLocalId').equals(id).toArray();
          for (const jr of joinRecords) {
            await db.book_space_books.delete(jr.id);
          }
        } catch (err) {
          console.error('[SpaceStore] Dexie delete failed:', err);
        }

        // If online and has supabaseId, delete from Supabase (backend cascades)
        if (navigator.onLine && supabaseId) {
          try {
            await apiClient.delete(`/api/spaces/${supabaseId}`);
          } catch (err) {
            console.error('[SpaceStore] Failed to delete space from Supabase:', err);
          }
        }

        console.log('[SpaceStore] deleteSpace — local_id:', id, 'supabaseId:', supabaseId || 'none');
      },

      addBookToSpace: async (spaceId, bookId) => {
        // Guard: skip Dexie/API ops for system spaces
        const space = get().spaces.find(s => s.id === spaceId);
        if (space?.isSystem) {
          set({
            spaces: get().spaces.map(s => {
              if (s.id === spaceId && !s.bookIds.includes(bookId)) {
                return { ...s, bookIds: [...s.bookIds, bookId] };
              }
              return s;
            })
          });
          return;
        }

        // Update Zustand
        set({
          spaces: get().spaces.map(s => {
            if (s.id === spaceId && !s.bookIds.includes(bookId)) {
              return { ...s, bookIds: [...s.bookIds, bookId] };
            }
            return s;
          })
        });

        // Resolve bookSupabaseId
        let bookSupabaseId = null;
        try {
          const book = await db.books.get(bookId);
          bookSupabaseId = book?.supabaseId || null;
        } catch (err) {
          console.error('[SpaceStore] Failed to resolve bookSupabaseId:', err);
        }

        // Generate local_id for join record
        const joinLocalId = Date.now().toString(36) + Math.random().toString(36).substr(2, 9);

        // Write to Dexie
        let dexieJoinId = null;
        try {
          dexieJoinId = await db.book_space_books.add({
            local_id: joinLocalId,
            spaceLocalId: spaceId,
            spaceSupabaseId: null,
            bookSupabaseId,
            synced: false,
            addedAt: new Date().toISOString(),
          });
        } catch (err) {
          console.error('[SpaceStore] Failed to write join record to Dexie:', err);
        }

        // If online, try to sync
        if (navigator.onLine && dexieJoinId) {
          try {
            const spaceRecord = await db.book_spaces.where('local_id').equals(spaceId).first();
            const spaceSupabaseId = spaceRecord?.supabaseId;

            if (spaceSupabaseId && bookSupabaseId) {
              const response = await apiClient.post(`/api/spaces/${spaceSupabaseId}/books`, {
                book_id: bookSupabaseId,
                local_id: joinLocalId,
              });

              await db.book_space_books.update(dexieJoinId, {
                supabaseId: response.data.id,
                spaceSupabaseId,
                synced: true,
              });
            }
          } catch (err) {
            console.error('[SpaceStore] Failed to sync book-space join to Supabase:', err);
          }
        }

        console.log('[SpaceStore] addBookToSpace — spaceId:', spaceId, 'bookId:', bookId, 'bookSupabaseId:', bookSupabaseId || 'unsynced');
      },

      removeBookFromSpace: async (spaceId, bookId) => {
        // Guard: skip Dexie/API ops for system spaces
        const space = get().spaces.find(s => s.id === spaceId);
        if (space?.isSystem) {
          set({
            spaces: get().spaces.map(s => {
              if (s.id === spaceId) {
                return { ...s, bookIds: s.bookIds.filter(id => id !== bookId) };
              }
              return s;
            })
          });
          return;
        }

        // Update Zustand
        set({
          spaces: get().spaces.map(s => {
            if (s.id === spaceId) {
              return { ...s, bookIds: s.bookIds.filter(id => id !== bookId) };
            }
            return s;
          })
        });

        // Resolve bookSupabaseId
        let bookSupabaseId = null;
        try {
          const book = await db.books.get(bookId);
          bookSupabaseId = book?.supabaseId || null;
        } catch (err) {
          console.error('[SpaceStore] Failed to resolve bookSupabaseId for remove:', err);
        }

        // Find and delete the join record from Dexie
        let joinSupabaseId = null;
        let spaceSupabaseId = null;
        try {
          const joinRecord = await db.book_space_books
            .where('spaceLocalId').equals(spaceId)
            .filter(r => r.bookSupabaseId === bookSupabaseId)
            .first();

          if (joinRecord) {
            joinSupabaseId = joinRecord.supabaseId;
            spaceSupabaseId = joinRecord.spaceSupabaseId;
            await db.book_space_books.delete(joinRecord.id);
          }

          // Also look up spaceSupabaseId from book_spaces if not on join record
          if (!spaceSupabaseId) {
            const spaceRecord = await db.book_spaces.where('local_id').equals(spaceId).first();
            spaceSupabaseId = spaceRecord?.supabaseId;
          }
        } catch (err) {
          console.error('[SpaceStore] Failed to delete join record from Dexie:', err);
        }

        // If online and join record had a supabaseId, delete from Supabase
        if (navigator.onLine && joinSupabaseId && spaceSupabaseId) {
          try {
            await apiClient.delete(`/api/spaces/${spaceSupabaseId}/books/${joinSupabaseId}`);
          } catch (err) {
            console.error('[SpaceStore] Failed to remove book from space on Supabase:', err);
          }
        }

        console.log('[SpaceStore] removeBookFromSpace — spaceId:', spaceId, 'bookId:', bookId);
      },

      setActiveSpace: (spaceId) => set({
        activeSpaceId: spaceId
      }),

      logSpaceActivity: (spaceId, activityType, amount = 1) => {
        if (!spaceId) return;
        set({
          spaces: get().spaces.map(s => {
            if (s.id === spaceId) {
              const summaries = { ...s.activitySummaries };
              summaries[activityType] = (summaries[activityType] || 0) + amount;
              return { ...s, activitySummaries: summaries };
            }
            return s;
          })
        });
      },

      syncExamReminders: async () => {
        try {
          const allReminders = await db.exam_reminders.toArray();
          const { setExams } = await import('./studyStore').then(m => m.default.getState());
          const mapped = allReminders.map(record => ({
            id: record.local_id,
            supabaseId: record.supabaseId,
            name: record.examName,
            date: record.examDate,
            current_stage: record.currentStage || null,
            isPaused: !record.isActive,
          }));
          setExams(mapped);
          console.log('[SpaceStore] syncExamReminders — rehydrated', mapped.length, 'exams');
        } catch (err) {
          console.error('[SpaceStore] syncExamReminders failed:', err);
        }
      },
    }),
    {
      name: 'apex-space-storage',
      merge: (persistedState, currentState) => {
        if (persistedState && Array.isArray(persistedState.spaces)) {
          persistedState.spaces = persistedState.spaces.filter(s => s.id !== 'bookmarks');
        }
        return {
          ...currentState,
          ...persistedState,
        };
      }
    }
  )
);

export default useSpaceStore;
