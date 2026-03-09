import { useState, useCallback, useRef, useEffect } from 'react';

let _globalShowToast = null;

/**
 * Module-level function to show toasts from anywhere (non-React code like syncService).
 * Only works after a ToastContainer has mounted.
 */
export function showToastGlobal(message, type = 'info', duration) {
  if (_globalShowToast) {
    _globalShowToast(message, type, duration);
  } else {
    console.warn('[Toast] ToastContainer not mounted yet, cannot show toast:', message);
  }
}

let _idCounter = 0;

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
    const id = ++_idCounter;
    const effectiveDuration = duration || (type === 'error' ? 6000 : 4000);

    setToasts(prev => [...prev, { id, message, type, exiting: false }]);

    timersRef.current[id] = setTimeout(() => {
      // Start exit animation
      setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t));
      // Remove after animation
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
        delete timersRef.current[id];
      }, 300);
    }, effectiveDuration);

    return id;
  }, []);

  // Register global handler on mount
  useEffect(() => {
    _globalShowToast = showToast;
    return () => {
      _globalShowToast = null;
    };
  }, [showToast]);

  // Cleanup all timers on unmount
  useEffect(() => {
    return () => {
      Object.values(timersRef.current).forEach(clearTimeout);
    };
  }, []);

  return { toasts, showToast, removeToast };
}
