import { useEffect, useRef } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import useOnboardingStore from '../store/useOnboardingStore';

/**
 * Hook to initialize and manage a driver.js tour.
 * @param {string} tourName - Name of the tour (e.g., 'Dashboard', 'Dictionary'). Must match the store key.
 * @param {Array} steps - Array of driver.js steps
 * @param {boolean} autoStart - Whether to start automatically if not seen
 */
export default function useTour(tourName, steps, autoStart = true) {
  const { [`hasSeen${tourName}Tour`]: hasSeen, completeTour } = useOnboardingStore();
  const driverObj = useRef(null);

  useEffect(() => {
    driverObj.current = driver({
      showProgress: true,
      animate: true,
      allowClose: true,
      overlayColor: 'rgba(0, 0, 0, 0.6)',
      doneBtnText: 'Got it',
      nextBtnText: 'Next &rarr;',
      prevBtnText: '&larr; Prev',
      steps: steps,
      onDestroyStarted: () => {
        if (!hasSeen && driverObj.current.hasNextStep() === false) {
             completeTour(tourName);
             driverObj.current.destroy();
        } else if (!hasSeen) {
            // User skipped early, still mark as completed so it doesn't annoy them
            completeTour(tourName);
            driverObj.current.destroy();
        } else {
             driverObj.current.destroy();
        }
      },
    });

    if (autoStart && !hasSeen && steps && steps.length > 0) {
        // slight delay to ensure UI is fully rendered
        const timer = setTimeout(() => {
            driverObj.current.drive();
        }, 500);
        return () => clearTimeout(timer);
    }
  }, [hasSeen, tourName, steps, autoStart, completeTour]);

  const startTour = () => {
    if (driverObj.current) {
      driverObj.current.drive();
    }
  };

  return { startTour };
}
