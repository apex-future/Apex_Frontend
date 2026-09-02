import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useOnboardingStore = create(
  persist(
    (set) => ({
      hasSeenDashboardTour: false,
      hasSeenReaderTour: false,
      hasSeenDictionaryTour: false,
      hasSeenQuestTour: false,

      hasClaimedQuestTourStreakFreeze: false,
      hasClaimedQuestTourRefreshToken: false,

      tourTextSelected: false,
      setTourTextSelected: (val = true) => {
        set({ tourTextSelected: val });
      },

      dashboardTourStep: 0,
      readerTourStep: 0,

      completeTour: (tourName) => {
        set((state) => ({
          ...state,
          [`hasSeen${tourName}Tour`]: true,
        }));
      },

      markQuestTourRewardClaimed: (item) => {
        set((state) => ({
          ...state,
          hasClaimedQuestTourStreakFreeze:
            item === 'streak_freeze' ? true : state.hasClaimedQuestTourStreakFreeze,
          hasClaimedQuestTourRefreshToken:
            item === 'refresh_token' ? true : state.hasClaimedQuestTourRefreshToken,
        }));
      },

      setTourStep: (tourName, stepIndex) => {
        set((state) => ({
            ...state,
            [`${tourName.toLowerCase()}TourStep`]: stepIndex
        }));
      },
      
      resetTours: () => {
        set((state) => ({
          hasSeenDashboardTour: false,
          hasSeenReaderTour: false,
          hasSeenDictionaryTour: false,
          hasSeenQuestTour: false,
          tourTextSelected: false,
          dashboardTourStep: 0,
          readerTourStep: 0,
          // Note: hasClaimedQuestTourStreakFreeze and hasClaimedQuestTourRefreshToken are intentionally preserved
        }));
      }
    }),
    {
      name: 'apex-onboarding-storage',
    }
  )
);

export default useOnboardingStore;
