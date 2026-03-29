import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Default system spaces (these can't be deleted)
const SYSTEM_SPACES = [
  { id: 'active-reading', name: 'Active Reading', isSystem: true, bookIds: [], examDate: null, goals: [], activitySummaries: { timeSpent: 0, pagesRead: 0 } },
  { id: 'favorites', name: 'Favorites', isSystem: true, bookIds: [], examDate: null, goals: [], activitySummaries: { timeSpent: 0, pagesRead: 0 } },
  { id: 'bookmarks', name: 'Bookmarks', isSystem: true, bookIds: [], examDate: null, goals: [], activitySummaries: { timeSpent: 0, pagesRead: 0 } },
];

const useSpaceStore = create(
  persist(
    (set, get) => ({
      spaces: [...SYSTEM_SPACES],
      activeSpaceId: null,

      createSpace: (name, description = '', examDate = null) => {
        const newSpace = {
          id: `space_${Date.now()}`,
          name,
          description,
          examDate,
          isSystem: false,
          bookIds: [],
          goals: [],
          activitySummaries: { timeSpent: 0, pagesRead: 0, quizzesTaken: 0, aiInteractions: 0 }
        };
        set({ spaces: [...get().spaces, newSpace] });
        return newSpace.id;
      },

      updateSpace: (id, updates) => set({
        spaces: get().spaces.map(s => s.id === id ? { ...s, ...updates } : s)
      }),

      deleteSpace: (id) => set({
        spaces: get().spaces.filter(s => s.id !== id || s.isSystem) // Prevent deleting system spaces
      }),

      addBookToSpace: (spaceId, bookId) => set({
        spaces: get().spaces.map(s => {
          if (s.id === spaceId && !s.bookIds.includes(bookId)) {
            return { ...s, bookIds: [...s.bookIds, bookId] };
          }
          return s;
        })
      }),

      removeBookFromSpace: (spaceId, bookId) => set({
        spaces: get().spaces.map(s => {
          if (s.id === spaceId) {
            return { ...s, bookIds: s.bookIds.filter(id => id !== bookId) };
          }
          return s;
        })
      }),

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
    }),
    {
      name: 'apex-space-storage',
    }
  )
);

export default useSpaceStore;
