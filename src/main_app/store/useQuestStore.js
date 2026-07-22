import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import apiClient from '../services/apiClient';
import db from '../db/apex.db';

const useQuestStore = create(
  persist(
    (set, get) => ({
      todayDate: null,
      quest_1: null,
      quest_2: null,
      quest_3: null,
      all_completed: false,
      chest_1_claimed: false,
      chest_2_claimed: false,
      chest_3_claimed: false,
      refreshTokens: 2,
      refreshedToday: false,
      lastFetchedAt: null,

      seedQuests: (questData) => {
        set((state) => {
          const isNewDay = state.todayDate !== questData.date;
          console.log('[Quest Store] Seeded:', questData.date, 'isNewDay:', isNewDay);

          // CASA for reward_claimed: if server says claimed OR local says claimed → claimed.
          // A chest that was opened can never be un-opened.
          const resolveChestClaimed = (questKey, chestKey) => {
            const serverClaimed = questData[questKey]?.reward_claimed ?? false;
            const localClaimed = isNewDay ? false : (state[chestKey] ?? false);
            return serverClaimed || localClaimed;
          };

          // CASA for progress: Math.max(local, server) — progress never decrements.
          // Only applies when NOT a new day (new day wipes and starts fresh).
          const resolveQuest = (questKey) => {
            const serverQuest = questData[questKey];
            if (!serverQuest) return serverQuest;
            if (isNewDay) return serverQuest;

            const localQuest = state[questKey];
            if (!localQuest || localQuest.id !== serverQuest.id) return serverQuest;

            return {
              ...serverQuest,
              progress: Math.max(localQuest.progress ?? 0, serverQuest.progress ?? 0),
              completed: localQuest.completed || serverQuest.completed,
            };
          };

          return {
            todayDate: questData.date,
            quest_1: resolveQuest('quest_1'),
            quest_2: resolveQuest('quest_2'),
            quest_3: resolveQuest('quest_3'),
            all_completed: isNewDay
              ? (questData.all_completed ?? false)
              : (state.all_completed || questData.all_completed),
            refreshTokens: questData.refresh_tokens ?? state.refreshTokens ?? 2,
            refreshedToday: isNewDay ? false : (questData.refreshed_today ?? state.refreshedToday ?? false),
            lastFetchedAt: new Date().toISOString(),
            chest_1_claimed: isNewDay ? false : resolveChestClaimed('quest_1', 'chest_1_claimed'),
            chest_2_claimed: isNewDay ? false : resolveChestClaimed('quest_2', 'chest_2_claimed'),
            chest_3_claimed: isNewDay ? false : resolveChestClaimed('quest_3', 'chest_3_claimed'),
          };
        });
      },

      reportAction: async (action, increment) => {
        const state = get();
        const quests = [
          { key: 'quest_1', data: state.quest_1 },
          { key: 'quest_2', data: state.quest_2 },
          { key: 'quest_3', data: state.quest_3 },
        ];

        for (const quest of quests) {
          if (quest.data && quest.data.action === action && !quest.data.completed) {
            const questId = quest.data.id;

            if (navigator.onLine) {
              // Online path — unchanged behaviour
              try {
                const res = await apiClient.post('/api/quests/progress', {
                  quest_id: questId,
                  action,
                  increment,
                });
                get().updateQuestProgress(quest.key, res.data.new_progress, res.data.completed);
                console.log('[Quest Store] reportAction online:', action, '→', questId);
                return res.data;
              } catch (err) {
                console.error('[Quest Store] reportAction failed for', action, err);
              }
            } else {
              // Offline path — optimistic update + CASA-ready queue entry
              const oldProgress = quest.data.progress || 0;
              const newProgress = oldProgress + increment;
              const target = quest.data.target || 1;
              const completed = newProgress >= target;
              const snapshotAt = new Date().toISOString();

              console.log('[Quest Store] reportAction OFFLINE — optimistic update:', action, '+', increment);
              get().updateQuestProgress(quest.key, newProgress, completed);

              // Store absolute_progress (not just increment) for CASA comparison on flush
              try {
                await db.sync_queue.add({
                  action: 'quest_progress',
                  tableName: 'daily_quest_state',
                  local_id: `quest_${questId}_${Date.now()}`,
                  payload: {
                    quest_id: questId,
                    action,
                    increment,
                    absolute_progress: newProgress,   // CASA key: Math.max(server, this) on flush
                    local_updated_at: snapshotAt,      // CASA key: compared against server updated_at
                  },
                  status: 'pending',
                  attempts: 0,
                  createdAt: snapshotAt,
                });
                console.log('[Quest Store] Offline quest progress queued with snapshot:', newProgress, 'at', snapshotAt);
              } catch (err) {
                console.warn('[Quest Store] Failed to queue offline quest progress:', err);
              }

              return {
                quest_id: questId,
                new_progress: newProgress,
                completed,
                just_completed: completed,
                all_completed: false,
                xp_awarded: completed ? 20 : 0,
                reward: null,
              };
            }
          }
        }

        return null;
      },

      updateQuestProgress: (questKey, newProgress, completed) => {
        set((state) => {
          if (!state[questKey]) return state;
          return {
            [questKey]: {
              ...state[questKey],
              progress: newProgress,
              completed,
            },
          };
        });
      },

      claimChest: (questKey) => {
        set((state) => {
          const chestKey = questKey.replace('quest_', 'chest_') + '_claimed';
          console.log('[Quest Store] Chest claimed:', questKey);
          return {
            [chestKey]: true,
          };
        });
      },

      setRefreshTokens: (tokens) => set({ refreshTokens: tokens }),
      setRefreshedToday: (val) => set({ refreshedToday: val }),

      resetIfNewDay: () => {
        // Simple WAT time zone check since WAT is UTC+1. Alternatively, we can just use local string.
        // The original code was fine, but let's make sure it handles generic date strings properly.
        // 'en-CA' outputs YYYY-MM-DD
        const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Lagos' }); 
        const state = get();
        if (state.todayDate && state.todayDate !== today) {
          console.log('[Quest Store] New day detected, resetting quest state');
          set({
            todayDate: null,
            quest_1: null,
            quest_2: null,
            quest_3: null,
            all_completed: false,
            chest_1_claimed: false,
            chest_2_claimed: false,
            chest_3_claimed: false,
            refreshedToday: false,
            lastFetchedAt: null,
          });
        }
      },

      saveQuestsToCache: async (userId, questData) => {
        if (!userId) return;
        try {
          await db.quest_state.put({
            user_id: userId,
            quest_date: questData.date,
            quest_1: questData.quest_1,
            quest_2: questData.quest_2,
            quest_3: questData.quest_3,
            all_completed: questData.all_completed ?? false,
            progressive_target: questData.progressive_target ?? 5,
            reset_at: questData.reset_at ?? null,
            cached_at: new Date().toISOString(),
          });
          console.log('[Quest Cache] Saved to Dexie for date:', questData.date);
        } catch (err) {
          console.warn('[Quest Cache] Failed to save to Dexie:', err);
        }
      },

      loadQuestsFromCache: async (userId) => {
        if (!userId) return null;
        try {
          const cached = await db.quest_state.get(userId);
          if (!cached) {
            console.log('[Quest Cache] No cache found');
            return null;
          }
          const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Lagos' });
          if (cached.quest_date !== today) {
            console.log('[Quest Cache] Stale — cached date:', cached.quest_date, 'today:', today);
            return null;
          }
          console.log('[Quest Cache] Valid cache hit for date:', cached.quest_date);
          return cached;
        } catch (err) {
          console.warn('[Quest Cache] Failed to read from Dexie:', err);
          return null;
        }
      },

      saveStatsToCache: async (userId, statsData) => {
        if (!userId) return;
        try {
          const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Lagos' });
          await db.quest_stats_cache.put({
            user_id: userId,
            stats_date: today,
            ...statsData,
            cached_at: new Date().toISOString(),
          });
          console.log('[Quest Cache] Stats saved to Dexie');
        } catch (err) {
          console.warn('[Quest Cache] Failed to save stats to Dexie:', err);
        }
      },

      loadStatsFromCache: async (userId) => {
        if (!userId) return null;
        try {
          const cached = await db.quest_stats_cache.get(userId);
          if (!cached) return null;
          const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Lagos' });
          if (cached.stats_date !== today) {
            console.log('[Quest Cache] Stats cache stale:', cached.stats_date, 'vs today:', today);
            return null;
          }
          console.log('[Quest Cache] Stats cache hit');
          return cached;
        } catch (err) {
          console.warn('[Quest Cache] Failed to read stats from Dexie:', err);
          return null;
        }
      },
    }),
    {
      name: 'apex-quest-storage',
    }
  )
);

export default useQuestStore;
