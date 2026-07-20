import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import apiClient from '../services/apiClient';

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
      lastFetchedAt: null,

      seedQuests: (questData) => {
        set((state) => {
          const isNewDay = state.todayDate !== questData.date;
          console.log('[Quest Store] Seeded:', questData.date, 'quests loaded');
          return {
            todayDate: questData.date,
            quest_1: questData.quest_1,
            quest_2: questData.quest_2,
            quest_3: questData.quest_3,
            all_completed: questData.all_completed,
            lastFetchedAt: new Date().toISOString(),
            ...(isNewDay && {
              chest_1_claimed: false,
              chest_2_claimed: false,
              chest_3_claimed: false,
            }),
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

        let matchedQuestId = null;
        let responseData = null;

        for (const quest of quests) {
          if (quest.data && quest.data.action === action && !quest.data.completed) {
            matchedQuestId = quest.data.id;
            try {
              const res = await apiClient.post('/api/quests/progress', {
                quest_id: quest.data.id,
                action,
                increment,
              });
              
              responseData = res.data;
              get().updateQuestProgress(quest.key, res.data.new_progress, res.data.completed);

              // We do not auto-open the modal here anymore.
              // just_completed means it's ready for chest claim.
              
              console.log('[Quest Store] reportAction:', action, increment, '→ matched:', matchedQuestId);
              return responseData;
            } catch (err) {
              console.error('[Quest Store] reportAction failed for', action, err);
            }
          }
        }
        
        return null; // Return null silently if no match
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
            lastFetchedAt: null,
          });
        }
      },
    }),
    {
      name: 'apex-quest-storage',
    }
  )
);

export default useQuestStore;
