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

        if (navigator.onLine) {
          get().syncStreakToSupabase();
        } else {
          // Queue the streak fire for when we reconnect
          // Store as a flag — we just need to know a sync is needed, not the full payload
          // The store already persists the updated state via zustand/persist
          localStorage.setItem('apex_streak_sync_pending', 'true');
          console.log('[Apex Streak] Offline — streak queued for sync on reconnect');
        }
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

          if (response.data) {
            set({
              streakCount: response.data.current_streak,
              longestStreak: response.data.longest_streak,
              lastActiveDate: response.data.last_active_date,
              streakHistory: response.data.streak_history,
            });
            localStorage.removeItem('apex_streak_sync_pending');
            if (import.meta.env.DEV) console.log('[Apex Streak] Server merge applied to local store');
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

        const localDate = get().lastActiveDate || '';
        const cloudDate = last_active_date || '';
        const cloudWins = cloudDate > localDate;

        // Streak count comes from whichever side has the more recent date —
        // it is live state, not a lifetime record. Only longest_streak uses max().
        const mergedStreakCount = cloudWins ? (current_streak || 0) : (get().streakCount || 0);
        const mergedLongestStreak = Math.max(get().longestStreak || 0, longest_streak || 0);
        const mergedLastActiveDate = (cloudWins ? cloudDate : localDate) || null;
        const mergedStreakHistory = Array.from(new Set([...get().streakHistory || [], ...(streak_history || [])])).sort();

        set({
          streakCount: mergedStreakCount,
          longestStreak: mergedLongestStreak,
          lastActiveDate: mergedLastActiveDate,
          streakHistory: mergedStreakHistory,
        });

        if (import.meta.env.DEV) console.log(
          '[Apex Streak] seedFromSupabase merged — streak:',
          cloudWins ? current_streak : get().streakCount,
          'history:', mergedStreakHistory.length, 'days',
          'authority:', cloudWins ? 'cloud' : 'local'
        );
      },

      flushPendingStreakSync: async () => {
        const pending = localStorage.getItem('apex_streak_sync_pending');
        if (pending === 'true' && navigator.onLine) {
          console.log('[Apex Streak] Flushing pending offline streak sync');
          await get().syncStreakToSupabase();
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
