import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useStudyStore = create(
  persist(
    (set, get) => ({
      streakCount: 0,
      lastActiveDate: null, // ISO string
      examDate: null, // ISO string
      
      updateStreak: () => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        const lastActive = get().lastActiveDate;

        if (!lastActive) {
          set({ streakCount: 1, lastActiveDate: today });
          return;
        }

        const lastDate = new Date(lastActive);
        const diffTime = now.getTime() - lastDate.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
          // Already active today
          return;
        } else if (diffDays === 1) {
          // Consecutive day
          set((state) => ({ streakCount: state.streakCount + 1, lastActiveDate: today }));
        } else {
          // Streak broken
          set({ streakCount: 1, lastActiveDate: today });
        }
      },

      setExamDate: (date) => set({ examDate: date }),
      
      resetStudyData: () => set({ streakCount: 0, lastActiveDate: null, examDate: null }),
    }),
    {
      name: 'apex-study-storage',
    }
  )
);

export default useStudyStore;
