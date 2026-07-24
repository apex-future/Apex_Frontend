import { useState, useCallback, useRef, useEffect } from 'react';

// Global toast listeners set to handle app-wide toast broadcasts
const toastListeners = new Set();
let _idCounter = 0;

/**
 * Module-level function to show toasts from anywhere (e.g., flashcardService, syncService).
 * Works reliably across all components and background tasks.
 */
export function showToastGlobal(message, type = 'info', duration) {
  const id = ++_idCounter;
  const toastEvent = { id, message, type, duration };
  toastListeners.forEach(listener => listener(toastEvent));
}

export default function useToast() {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef({});

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
    if (timersRef.current[id]) {
      clearTimeout(timersRef.current[id]);
      delete timersRef.current[id];
    }
  }, []);

  const showToast = useCallback((message, type = 'info', duration) => {
    showToastGlobal(message, type, duration);
  }, []);

  // Listen for global toast broadcasts
  useEffect(() => {
    const handleToastBroadcast = ({ id, message, type = 'info', duration }) => {
      const effectiveDuration = duration !== undefined ? duration : (type === 'error' ? 6000 : 4000);

      setToasts(prev => {
        const filtered = prev.filter(t => !(t.message.includes('Uploading') && t.type === 'info'));
        return [...filtered, { id, message, type, exiting: false }];
      });

      if (duration !== 0) {
        timersRef.current[id] = setTimeout(() => {
          setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t));
          setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
            delete timersRef.current[id];
          }, 300);
        }, effectiveDuration);
      }
    };

    toastListeners.add(handleToastBroadcast);
    return () => {
      toastListeners.delete(handleToastBroadcast);
    };
  }, []);

  // Cleanup all timers on unmount
  useEffect(() => {
    return () => {
      Object.values(timersRef.current).forEach(clearTimeout);
    };
  }, []);

  return { toasts, showToast, removeToast };
}
