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
      examName: '',

      // Multi-exam state
      exams: [],

      addExam: (exam) => set((state) => ({ exams: [...state.exams, { ...exam, id: crypto.randomUUID(), createdAt: new Date().toISOString(), isPaused: false }] })),
      updateExam: (id, updates) => set((state) => ({ exams: state.exams.map(e => e.id === id ? { ...e, ...updates } : e) })),
      deleteExam: (id) => set((state) => ({ exams: state.exams.filter(e => e.id !== id) })),
      togglePauseExam: (id) => set((state) => ({ exams: state.exams.map(e => e.id === id ? { ...e, isPaused: !e.isPaused } : e) })),

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
          if (import.meta.env.DEV) console.log('[Apex Streak] Already active today — skipping');
          return;
        }

        let newStreak;

        if (!lastActive) {
          // First ever streak
          newStreak = 1;
          if (import.meta.env.DEV) console.log('[Apex Streak] First streak day!');
        } else {
          // Check if yesterday
          const last = new Date(lastActive);
          const todayDate = new Date(today);
          const diffMs = todayDate.getTime() - last.getTime();
          const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

          if (diffDays === 1) {
            // Consecutive day — increment
            newStreak = currentStreak + 1;
            if (import.meta.env.DEV) console.log('[Apex Streak] Consecutive day — streak:', newStreak);
          } else {
            // Streak broken — reset to 1
            newStreak = 1;
            if (import.meta.env.DEV) console.log('[Apex Streak] Streak broken after', diffDays, 'days — resetting to 1');
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

        if (import.meta.env.DEV) console.log('[Apex Streak] Updated:', { newStreak, newLongest, today });

        // Sync to Supabase if online
        if (navigator.onLine) {
          get().syncStreakToSupabase();
        }
        // If offline — persisted locally via zustand/persist, syncs on next online
      },

      /**
       * checkStreakIntegrity — called on app open AFTER seedFromSupabase
       * Detects if the streak is broken (lastActiveDate is not today or yesterday)
       * Resets streakCount to 0 immediately so the UI reflects the break
       * Does NOT touch longestStreak or streakHistory — those are historical records
       */
      checkStreakIntegrity: () => {
        const today = get()._getTodayString();
        const lastActive = get().lastActiveDate;
        const currentStreak = get().streakCount;

        // No streak to check
        if (!lastActive || currentStreak === 0) {
          if (import.meta.env.DEV) console.log('[Apex Streak] No active streak to validate');
          return;
        }

        // Already read today — streak is valid
        if (lastActive === today) {
          if (import.meta.env.DEV) console.log('[Apex Streak] Integrity check: active today — streak valid');
          return;
        }

        // Check if lastActive was yesterday
        const last = new Date(lastActive + 'T00:00:00');
        const todayDate = new Date(today + 'T00:00:00');
        const diffMs = todayDate.getTime() - last.getTime();
        const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          // Yesterday — streak is still alive, user just hasn't read today yet
          if (import.meta.env.DEV) console.log('[Apex Streak] Integrity check: last active yesterday — streak alive, waiting for today\'s read');
          return;
        }

        // Streak is broken — reset to 0 (not 1, because user hasn't read today)
        if (import.meta.env.DEV) console.log('[Apex Streak] Integrity check: streak BROKEN (last active', diffDays, 'days ago) — resetting to 0');
        set({ streakCount: 0 });

        // Sync the reset to Supabase
        if (navigator.onLine) {
          get().syncStreakToSupabase();
        }
      },

      /**
       * syncStreakToSupabase — patches streak data to backend
       * Called after updateStreak if online
       * Also called by online event listener in App.jsx
       */
      syncStreakToSupabase: async () => {
        try {
          const { streakCount, longestStreak, lastActiveDate, streakHistory } = get();
          const response = await apiClient.patch('/api/auth/streak', {
            current_streak: streakCount,
            longest_streak: longestStreak,
            last_active_date: lastActiveDate,
            streak_history: streakHistory,
          });

          // Server returns its validated date — correct local store if it was wrong
          if (response.data?.last_active_date &&
              response.data.last_active_date !== lastActiveDate) {
            if (import.meta.env.DEV) console.log('[Apex Streak] Server corrected last_active_date:',
              lastActiveDate, '→', response.data.last_active_date);
            set({ lastActiveDate: response.data.last_active_date });
          }

          // Also correct any future dates from streak_history using server_date
          if (response.data?.server_date && streakHistory.length > 0) {
            const serverDate = new Date(response.data.server_date);
            const sanitized = streakHistory.filter(entry => {
              const entryDate = new Date(entry);
              const daysAhead = (entryDate - serverDate) / (1000 * 60 * 60 * 24);
              return daysAhead <= 1; // Remove anything more than 1 day in the future
            });
            if (sanitized.length !== streakHistory.length) {
              if (import.meta.env.DEV) console.log('[Apex Streak] Removed', streakHistory.length - sanitized.length,
                'future dates from local streak history');
              set({ streakHistory: sanitized });
            }
          }

          if (import.meta.env.DEV) console.log('[Apex Streak] Synced to Supabase successfully');
        } catch (err) {
          if (import.meta.env.DEV) console.error('[Apex Streak] Failed to sync to Supabase:', err);
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
        const localStreak = get().streakCount;
        const supabaseLastActive = last_active_date;
        const supabaseStreak = current_streak || 0;

        // Only seed if Supabase data is more recent than local
        // This prevents overwriting a streak earned offline
        if (supabaseStreak > localStreak || (supabaseLastActive && supabaseLastActive > (localLastActive || ''))) {
          if (import.meta.env.DEV) console.log('[Apex Streak] Seeding from Supabase — more recent data found');
          set({
            streakCount: supabaseStreak,
            longestStreak: longest_streak || 0,
            lastActiveDate: last_active_date || null,
            streakHistory: streak_history || [],
          });
        } else {
          if (import.meta.env.DEV) console.log('[Apex Streak] Local streak data is more recent — keeping local');
        }
      },

      setExamDate: (date) => set({ examDate: date }),
      setExamName: (name) => set({ examName: name }),
      resetStudyData: () => set({
        streakCount: 0,
        longestStreak: 0,
        lastActiveDate: null,
        streakHistory: [],
        examDate: null,
        examName: '',
      }),
    }),
    {
      name: 'apex-study-storage',
    }
  )
);

export default useStudyStore;
