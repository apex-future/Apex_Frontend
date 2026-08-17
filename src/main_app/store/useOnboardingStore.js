import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useOnboardingStore = create(
  persist(
    (set) => ({
      hasSeenDashboardTour: false,
      hasSeenReaderTour: false,
      hasSeenDictionaryTour: false,

      completeTour: (tourName) => {
        set((state) => ({
          ...state,
          [`hasSeen${tourName}Tour`]: true,
        }));
      },
      
      resetTours: () => {
        set({
          hasSeenDashboardTour: false,
          hasSeenReaderTour: false,
          hasSeenDictionaryTour: false,
        })
      }
    }),
    {
      name: 'apex-onboarding-storage',
    }
  )
);

export default useOnboardingStore;
