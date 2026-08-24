import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useOnboardingStore = create(
  persist(
    (set) => ({
      hasSeenDashboardTour: false,
      hasSeenReaderTour: false,
      hasSeenDictionaryTour: false,

      dashboardTourStep: 0,
      readerTourStep: 0,

      completeTour: (tourName) => {
        set((state) => ({
          ...state,
          [`hasSeen${tourName}Tour`]: true,
        }));
      },

      setTourStep: (tourName, stepIndex) => {
        set((state) => ({
            ...state,
            [`${tourName.toLowerCase()}TourStep`]: stepIndex
        }));
      },
      
      resetTours: () => {
        set({
          hasSeenDashboardTour: false,
          hasSeenReaderTour: false,
          hasSeenDictionaryTour: false,
          dashboardTourStep: 0,
          readerTourStep: 0,
        })
      }
    }),
    {
      name: 'apex-onboarding-storage',
    }
  )
);

export default useOnboardingStore;
