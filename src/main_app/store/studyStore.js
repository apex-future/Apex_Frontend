import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import apiClient from '../services/apiClient';

const useStudyStore = create(
  persist(
    (set, get) => ({
      streakCount: 0,
      longestStreak: 0,
      lastActiveDate: null,      // 'YYYY-MM-DD' string
      lastStreakUpdatedAt: null, // ISO datetime — server-generated, used for same-day tiebreaker
      streakHistory: [],         // Array of 'YYYY-MM-DD' strings — days user kept streak
      streakFreezesHeld: 0,      // Integer count of streak freezes held (max 2)
      frozenDays: [],            // Array of 'YYYY-MM-DD' strings — days saved by streak freeze

      // Exam state (reserved for version 2)
      examDate: null,
      examName: '',

      // Multi-exam state
      exams: [],

      addExam: async (exam) => {
        const newExam = { ...exam, id: exam.id || crypto.randomUUID(), createdAt: new Date().toISOString(), isPaused: false };
        set((state) => ({ exams: [...state.exams, newExam] }));
        try {
          const syncService = (await import('../services/syncService')).default;
          await syncService.saveExamReminder(newExam);
        } catch (err) {
          console.error('[StudyStore] Failed to save exam reminder to sync:', err);
        }
      },
      updateExam: async (id, updates) => {
        set((state) => ({ exams: state.exams.map(e => e.id === id ? { ...e, ...updates } : e) }));
        const updatedExam = get().exams.find(e => e.id === id);
        if (updatedExam) {
          try {
            const syncService = (await import('../services/syncService')).default;
            await syncService.saveExamReminder(updatedExam);
          } catch (err) {
            console.error('[StudyStore] Failed to update exam reminder in sync:', err);
          }
        }
      },
      deleteExam: async (id) => {
        const examToDelete = get().exams.find(e => e.id === id);
        set((state) => ({ exams: state.exams.filter(e => e.id !== id) }));
        if (examToDelete) {
          try {
            const syncService = (await import('../services/syncService')).default;
            await syncService.deleteExamReminder(examToDelete.id);
          } catch (err) {
            console.error('[StudyStore] Failed to delete exam reminder from sync:', err);
          }
        }
      },
      togglePauseExam: (id) => set((state) => ({ exams: state.exams.map(e => e.id === id ? { ...e, isPaused: !e.isPaused } : e) })),
      setExams: (exams) => set({ exams }),

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
       * isStreakFiredToday — returns true if today's streak was already earned/counted
       */
      isStreakFiredToday: () => {
        const today = get()._getTodayString();
        const lastActive = get().lastActiveDate;
        const history = get().streakHistory || [];
        return (get().streakCount || 0) > 0 && (lastActive === today || history.includes(today));
      },

      /**
       * updateStreak — called after user reads for 1 minute
       * Increments streak if consecutive day, resets if broken (unless protected by streak freeze)
       * Adds today to streakHistory if not already present
       */
      updateStreak: () => {
        const today = get()._getTodayString();
        const lastActive = get().lastActiveDate;
        const currentStreak = get().streakCount;
        const currentLongest = get().longestStreak;
        const history = get().streakHistory || [];
        let freezes = get().streakFreezesHeld || 0;
        let frozen = get().frozenDays || [];

        // Already counted today — do nothing
        if (lastActive === today) {
          if (import.meta.env.DEV) console.log('[Apex Streak] Already active today — skipping');
          return;
        }

        let newStreak = currentStreak;
        let updatedLastActive = lastActive;
        let newHistory = [...history];
        let newFrozen = [...frozen];

        if (!lastActive || currentStreak === 0) {
          // First ever streak or starting fresh after a reset
          newStreak = 1;
          updatedLastActive = today;
          if (import.meta.env.DEV) console.log('[Apex Streak] First streak day or starting fresh after reset!');
        } else {
          // Check difference between lastActive and today
          const last = new Date(lastActive + 'T00:00:00');
          const todayDate = new Date(today + 'T00:00:00');
          const diffMs = todayDate.getTime() - last.getTime();
          const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

          if (diffDays === 1) {
            // Consecutive day — increment
            newStreak = currentStreak + 1;
            updatedLastActive = today;
            if (import.meta.env.DEV) console.log('[Apex Streak] Consecutive day — streak:', newStreak);
          } else if (diffDays > 1) {
            // Missed day(s) — check if streak freeze can protect
            const missedCount = diffDays - 1;
            if (freezes >= missedCount && missedCount > 0) {
              // Apply streak freeze for each missed day
              let currTime = last.getTime() + 86400000;
              for (let i = 0; i < missedCount; i++) {
                const currDate = new Date(currTime);
                const y = currDate.getFullYear();
                const m = String(currDate.getMonth() + 1).padStart(2, '0');
                const d = String(currDate.getDate()).padStart(2, '0');
                const missedStr = `${y}-${m}-${d}`;
                if (!newHistory.includes(missedStr)) newHistory.push(missedStr);
                if (!newFrozen.includes(missedStr)) newFrozen.push(missedStr);
                newStreak += 1;
                currTime += 86400000;
              }
              freezes -= missedCount;
              // Now increment for today's reading session
              newStreak += 1;
              updatedLastActive = today;
              if (import.meta.env.DEV) console.log('[Apex Streak] Protected by Streak Freeze! New streak:', newStreak, 'Freezes left:', freezes);
            } else {
              // Not enough freezes — streak broken, start fresh at 1 for today's read
              newStreak = 1;
              updatedLastActive = today;
              if (import.meta.env.DEV) console.log('[Apex Streak] Streak broken after', diffDays, 'days — starting fresh at 1');
            }
          }
        }

        const newLongest = Math.max(newStreak, currentLongest);

        // Add today to history if not already there
        if (!newHistory.includes(today)) {
          newHistory.push(today);
        }

        set({
          streakCount: newStreak,
          longestStreak: newLongest,
          lastActiveDate: updatedLastActive,
          streakHistory: newHistory,
          streakFreezesHeld: freezes,
          frozenDays: newFrozen,
          lastStreakUpdatedAt: new Date().toISOString(),
        });

        if (import.meta.env.DEV) console.log('[Apex Streak] Updated:', { newStreak, newLongest, today });

        if (navigator.onLine) {
          get().syncStreakToSupabase();
        } else {
          localStorage.setItem('apex_streak_sync_pending', 'true');
          console.log('[Apex Streak] Offline — streak queued for sync on reconnect');
        }
      },

      /**
       * checkStreakIntegrity — called on app open AFTER seedFromSupabase
       * Detects if the streak is broken (lastActiveDate is not today or yesterday)
       * If user has streak freeze(s), applies streak freeze to protect & increment streak!
       * If no streak freeze, resets streakCount to 0 immediately.
       */
      checkStreakIntegrity: () => {
        const today = get()._getTodayString();
        const lastActive = get().lastActiveDate;
        const currentStreak = get().streakCount;
        let freezes = get().streakFreezesHeld || 0;
        let history = get().streakHistory || [];
        let frozen = get().frozenDays || [];

        // No streak to check
        if (!lastActive || currentStreak === 0) {
          if (import.meta.env.DEV) console.log('[Apex Streak] No active streak to validate');
          return;
        }

        // Already active today — streak is valid
        if (lastActive === today) {
          if (import.meta.env.DEV) console.log('[Apex Streak] Integrity check: active today — streak valid');
          return;
        }

        // Check difference from lastActive
        const last = new Date(lastActive + 'T00:00:00');
        const todayDate = new Date(today + 'T00:00:00');
        const diffMs = todayDate.getTime() - last.getTime();
        const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          // Yesterday — streak is still alive, user just hasn't read today yet
          if (import.meta.env.DEV) console.log('[Apex Streak] Integrity check: last active yesterday — streak alive, waiting for today\'s read');
          return;
        }

        // diffDays > 1 — Missed day(s)!
        const missedCount = diffDays - 1;

        if (freezes >= missedCount && missedCount > 0) {
          // Apply streak freeze to save the streak!
          let newStreak = currentStreak;
          let newHistory = [...history];
          let newFrozen = [...frozen];
          let lastSavedDate = lastActive;

          let currTime = last.getTime() + 86400000;
          for (let i = 0; i < missedCount; i++) {
            const currDate = new Date(currTime);
            const y = currDate.getFullYear();
            const m = String(currDate.getMonth() + 1).padStart(2, '0');
            const d = String(currDate.getDate()).padStart(2, '0');
            lastSavedDate = `${y}-${m}-${d}`;

            if (!newHistory.includes(lastSavedDate)) newHistory.push(lastSavedDate);
            if (!newFrozen.includes(lastSavedDate)) newFrozen.push(lastSavedDate);
            newStreak += 1;
            currTime += 86400000;
          }

          const newFreezes = freezes - missedCount;
          const newLongest = Math.max(newStreak, get().longestStreak || 0);

          set({
            streakCount: newStreak,
            longestStreak: newLongest,
            lastActiveDate: lastSavedDate,
            streakHistory: newHistory,
            streakFreezesHeld: newFreezes,
            frozenDays: newFrozen,
          });

          if (import.meta.env.DEV) console.log(`[Apex Streak] Integrity check: Applied ${missedCount} Streak Freeze(s)! Streak preserved & incremented to ${newStreak}. Freezes left: ${newFreezes}`);

          if (navigator.onLine) {
            get().syncStreakToSupabase();
          }
          return;
        }

        // No streak freeze available (or not enough) — streak is BROKEN
        if (import.meta.env.DEV) console.log('[Apex Streak] Integrity check: streak BROKEN (last active', diffDays, 'days ago, no freezes) — resetting to 0');
        set({ streakCount: 0, lastActiveDate: null });

        if (navigator.onLine) {
          get().syncStreakToSupabase();
        }
      },

      /**
       * syncStreakToSupabase — patches streak data to backend
       */
      syncStreakToSupabase: async () => {
        try {
          const { streakCount, longestStreak, lastActiveDate, streakHistory, lastStreakUpdatedAt, streakFreezesHeld, frozenDays } = get();
          const response = await apiClient.patch('/api/auth/streak', {
            current_streak: streakCount,
            longest_streak: longestStreak,
            last_active_date: lastActiveDate,
            streak_history: streakHistory,
            last_streak_updated_at: lastStreakUpdatedAt,
            streak_freezes_held: streakFreezesHeld,
            frozen_days: frozenDays,
          });

          if (response.data) {
            // Guard: don't let a stale server response overwrite a fresher local streak.
            // Check 1: If local lastActiveDate is newer than server, skip entirely.
            // Check 2: If dates match but local streakCount is higher, skip — local just incremented.
            const localActiveDate = get().lastActiveDate || '';
            const serverActiveDate = response.data.last_active_date || '';
            const localStreak = get().streakCount;
            const serverStreak = response.data.current_streak;

            if (localActiveDate > serverActiveDate ||
                (localActiveDate === serverActiveDate && localStreak > serverStreak)) {
              if (import.meta.env.DEV) console.log('[Apex Streak] Server response is stale — local:', localActiveDate, '/', localStreak, 'server:', serverActiveDate, '/', serverStreak, '— skipping merge');
              localStorage.removeItem('apex_streak_sync_pending');
            } else {
              set({
                streakCount: response.data.current_streak,
                longestStreak: response.data.longest_streak,
                lastActiveDate: response.data.last_active_date,
                streakHistory: response.data.streak_history ?? streakHistory,
                frozenDays: response.data.frozen_days ?? frozenDays,
                streakFreezesHeld: response.data.streak_freezes_held ?? streakFreezesHeld,
                lastStreakUpdatedAt: response.data.last_streak_updated_at,
              });
              localStorage.removeItem('apex_streak_sync_pending');
              if (import.meta.env.DEV) console.log('[Apex Streak] Server merge applied to local store');
            }
          }

          if (import.meta.env.DEV) console.log('[Apex Streak] Synced to Supabase successfully');
        } catch (err) {
          if (import.meta.env.DEV) console.error('[Apex Streak] Failed to sync to Supabase:', err);
        }
      },

      /**
       * seedFromSupabase — called on login/app load
       */
      seedFromSupabase: (supabaseData) => {
        if (!supabaseData) return;

        // Guard: if local lastActiveDate is TODAY, the user already earned a streak
        // in this session. Don't let stale cloud data clobber it.
        const today = get()._getTodayString();
        const localDate = get().lastActiveDate || '';
        if (localDate === today) {
          if (import.meta.env.DEV) console.log('[Apex Streak] seedFromSupabase skipped — local streak is from today, refusing to overwrite');
          return;
        }

        const {
          current_streak,
          longest_streak,
          last_active_date,
          streak_history,
          streak_freezes_held,
          frozen_days,
        } = supabaseData;

        const cloudDate = last_active_date || '';
        const localUpdatedAt = get().lastStreakUpdatedAt || '';
        const cloudUpdatedAt = supabaseData.last_streak_updated_at || '';

        let cloudWins;
        if (cloudDate > localDate) {
          cloudWins = true;
        } else if (cloudDate < localDate) {
          cloudWins = false;
        } else {
          cloudWins = cloudUpdatedAt > localUpdatedAt;
        }

        const mergedStreakCount = cloudWins ? (current_streak || 0) : (get().streakCount || 0);
        const mergedLongestStreak = Math.max(get().longestStreak || 0, longest_streak || 0);
        const mergedLastActiveDate = (cloudWins ? cloudDate : localDate) || null;
        const mergedStreakHistory = Array.from(new Set([...(get().streakHistory || []), ...(streak_history || [])])).sort();
        const mergedFrozenDays = Array.from(new Set([...(get().frozenDays || []), ...(frozen_days || [])])).sort();
        const mergedFreezesHeld = streak_freezes_held !== undefined && streak_freezes_held !== null
          ? streak_freezes_held
          : (get().streakFreezesHeld || 0);

        set({
          streakCount: mergedStreakCount,
          longestStreak: mergedLongestStreak,
          lastActiveDate: mergedLastActiveDate,
          streakHistory: mergedStreakHistory,
          frozenDays: mergedFrozenDays,
          streakFreezesHeld: Math.min(Math.max(0, mergedFreezesHeld), 2),
          lastStreakUpdatedAt: cloudWins
            ? (supabaseData.last_streak_updated_at || null)
            : (get().lastStreakUpdatedAt || null),
        });

        if (import.meta.env.DEV) console.log(
          '[Apex Streak] seedFromSupabase merged — streak:',
          mergedStreakCount, 'freezes:', mergedFreezesHeld,
          'history:', mergedStreakHistory.length, 'days'
        );
      },

      flushPendingStreakSync: async () => {
        const pending = localStorage.getItem('apex_streak_sync_pending');
        if (pending === 'true' && navigator.onLine) {
          console.log('[Apex Streak] Flushing pending offline streak sync');
          await get().syncStreakToSupabase();
        }
      },

      /**
       * updateFreezesHeld — updates the streak freeze count
       * directly from the game profile (sourced via useXpStore
       * seedFromServer). Bypasses the streak guard in
       * seedFromSupabase, which is only meant to protect
       * streak count data, not inventory data.
       */
      updateFreezesHeld: (count) => {
        const clamped = Math.min(Math.max(0, count), 2);
        set({ streakFreezesHeld: clamped });
        if (import.meta.env.DEV) {
          console.log(
            '[Study Store] streakFreezesHeld updated to:', clamped);
        }
      },

      setExamDate: (date) => set({ examDate: date }),
      setExamName: (name) => set({ examName: name }),
      resetStudyData: () => set({
        streakCount: 0,
        longestStreak: 0,
        lastActiveDate: null,
        lastStreakUpdatedAt: null,
        streakHistory: [],
        streakFreezesHeld: 0,
        frozenDays: [],
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
