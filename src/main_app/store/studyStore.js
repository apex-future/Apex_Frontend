import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import apiClient from '../services/apiClient';

const useStudyStore = create(
  persist(
    (set, get) => ({
      // Streak state
      streakCount: 0,
      longestStreak: 0,
      lastActiveDate: null,      // 'YYYY-MM-DD' string
      streakHistory: [],         // Array of 'YYYY-MM-DD' strings — days user kept streak

      // Exam state (reserved for version 2)
      examDate: null,

      /**
       * getTodayString — returns today as 'YYYY-MM-DD'
       * Uses local date to avoid timezone issues
       */
      _getTodayString: () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      },

      /**
       * updateStreak — called after user reads for 1 minute
       * Increments streak if consecutive day, resets if broken
       * Adds today to streakHistory if not already present
       */
      updateStreak: () => {
        const today = get()._getTodayString();
        const lastActive = get().lastActiveDate;
        const currentStreak = get().streakCount;
        const currentLongest = get().longestStreak;
        const history = get().streakHistory || [];

        // Already counted today — do nothing
        if (lastActive === today) {
          console.log('[Apex Streak] Already active today — skipping');
          return;
        }

        let newStreak;

        if (!lastActive) {
          // First ever streak
          newStreak = 1;
          console.log('[Apex Streak] First streak day!');
        } else {
          // Check if yesterday
          const last = new Date(lastActive);
          const todayDate = new Date(today);
          const diffMs = todayDate.getTime() - last.getTime();
          const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

          if (diffDays === 1) {
            // Consecutive day — increment
            newStreak = currentStreak + 1;
            console.log('[Apex Streak] Consecutive day — streak:', newStreak);
          } else {
            // Streak broken — reset to 1
            newStreak = 1;
            console.log('[Apex Streak] Streak broken after', diffDays, 'days — resetting to 1');
          }
        }

        const newLongest = Math.max(newStreak, currentLongest);

        // Add today to history if not already there
        const newHistory = history.includes(today)
          ? history
          : [...history, today];

        set({
          streakCount: newStreak,
          longestStreak: newLongest,
          lastActiveDate: today,
          streakHistory: newHistory,
        });

        console.log('[Apex Streak] Updated:', { newStreak, newLongest, today });

        // Sync to Supabase if online
        if (navigator.onLine) {
          get().syncStreakToSupabase();
        }
        // If offline — persisted locally via zustand/persist, syncs on next online
      },

      /**
       * syncStreakToSupabase — patches streak data to backend
       * Called after updateStreak if online
       * Also called by online event listener in App.jsx
       */
      syncStreakToSupabase: async () => {
        try {
          const { streakCount, longestStreak, lastActiveDate, streakHistory } = get();
          await apiClient.patch('/api/auth/streak', {
            current_streak: streakCount,
            longest_streak: longestStreak,
            last_active_date: lastActiveDate,
            streak_history: streakHistory,
          });
          console.log('[Apex Streak] Synced to Supabase successfully');
        } catch (err) {
          console.error('[Apex Streak] Failed to sync to Supabase:', err);
          // Fail silently — local data is preserved, will retry next time
        }
      },

      /**
       * seedFromSupabase — called on login/app load
       * Seeds local store from Supabase data if Supabase has more recent data
       */
      seedFromSupabase: (supabaseData) => {
        const {
          current_streak,
          longest_streak,
          last_active_date,
          streak_history,
        } = supabaseData;

        const localLastActive = get().lastActiveDate;
        const supabaseLastActive = last_active_date;

        // Only seed if Supabase data is more recent than local
        // This prevents overwriting a streak earned offline
        if (supabaseStreak > localStreak || (supabaseLastActive && supabaseLastActive > (localLastActive || ''))) {
          console.log('[Apex Streak] Seeding from Supabase — more recent data found');
          set({
            streakCount: current_streak || 0,
            longestStreak: longest_streak || 0,
            lastActiveDate: last_active_date || null,
            streakHistory: streak_history || [],
          });
        } else {
          console.log('[Apex Streak] Local streak data is more recent — keeping local');
        }
      },

      setExamDate: (date) => set({ examDate: date }),
      resetStudyData: () => set({
        streakCount: 0,
        longestStreak: 0,
        lastActiveDate: null,
        streakHistory: [],
        examDate: null,
      }),
    }),
    {
      name: 'apex-study-storage',
    }
  )
);

export default useStudyStore;
