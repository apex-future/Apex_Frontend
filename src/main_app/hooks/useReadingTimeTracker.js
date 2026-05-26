import { useEffect, useRef } from 'react';
import db from '../db/apex.db';

const MIN_SESSION_SECONDS = 60; // discard fragments under 1 minute
const TICK_INTERVAL_MS = 60000; // 1 minute

/**
 * useReadingTimeTracker
 *
 * Accumulates reading time locally in Dexie (book_reading_time table) via a
 * minute-tick timer. When the session ends (visibility hide, beforeunload, or
 * unmount), the accumulated minutes are flushed to the sync queue for backend
 * persistence.
 *
 * - Visibility-aware: pauses tick when app is backgrounded.
 * - Idempotent flush: synced flag prevents double-counting; reset on each new minute.
 * - Fragments under 1 minute are discarded at flush time.
 */
export function useReadingTimeTracker({ bookId, supabaseBookId, isEnabled }) {
  const elapsedSecondsRef = useRef(0);
  const tickIntervalRef = useRef(null);
  const visibilityPausedRef = useRef(false);
  const sessionStartRef = useRef(null);

  function getTodayStr() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  async function incrementLocalMinute() {
    if (!bookId) return;
    const today = getTodayStr();
    try {
      const existing = await db.book_reading_time
        .where({ bookId, date: today }).first();
      if (existing) {
        await db.book_reading_time.update(existing.id, {
          minutes: existing.minutes + 1,
          synced: 0,
        });
      } else {
        await db.book_reading_time.add({
          bookId,
          supabaseBookId,
          date: today,
          minutes: 1,
          synced: 0,
        });
      }
      console.log('[ReadingTimeTracker] Local minute incremented for book', bookId);
    } catch (err) {
      console.error('[ReadingTimeTracker] Failed to increment local minute:', err);
    }
  }

  async function flushSessionToQueue() {
    if (!supabaseBookId) return;
    const today = getTodayStr();
    try {
      const record = await db.book_reading_time
        .where({ bookId, date: today }).first();
      if (!record || record.minutes < 1) {
        console.log('[ReadingTimeTracker] Nothing to flush — under 1 minute');
        return;
      }
      if (record.synced === 1) {
        console.log('[ReadingTimeTracker] Already synced for today — skipping flush');
        return;
      }
      await db.sync_queue.add({
        action: 'increment',
        tableName: 'book_reading_time',
        local_id: record.id,
        recordId: null,
        payload: {
          book_id: supabaseBookId,
          date: today,
          minutes: record.minutes,
        },
        createdAt: new Date().toISOString(),
        attempts: 0,
        status: 'pending',
      });
      await db.book_reading_time.update(record.id, { synced: 1 });
      console.log('[ReadingTimeTracker] Flushed', record.minutes, 'minutes to sync queue for book', supabaseBookId);
    } catch (err) {
      console.error('[ReadingTimeTracker] Flush failed:', err);
    }
  }

  function startTick() {
    if (tickIntervalRef.current) return;
    sessionStartRef.current = Date.now();
    tickIntervalRef.current = setInterval(() => {
      if (!visibilityPausedRef.current) {
        elapsedSecondsRef.current += 60;
        incrementLocalMinute();
      }
    }, TICK_INTERVAL_MS);
    console.log('[ReadingTimeTracker] Tick started for book', bookId);
  }

  function stopTick() {
    if (tickIntervalRef.current) {
      clearInterval(tickIntervalRef.current);
      tickIntervalRef.current = null;
      console.log('[ReadingTimeTracker] Tick stopped for book', bookId);
    }
  }

  useEffect(() => {
    if (!isEnabled || !bookId || !supabaseBookId) return;

    startTick();

    function handleVisibilityChange() {
      if (document.visibilityState === 'hidden') {
        visibilityPausedRef.current = true;
        console.log('[ReadingTimeTracker] Paused — app hidden');
        flushSessionToQueue();
      } else {
        visibilityPausedRef.current = false;
        console.log('[ReadingTimeTracker] Resumed — app visible');
      }
    }

    function handleBeforeUnload() {
      flushSessionToQueue();
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      stopTick();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // Session end — flush whatever accumulated
      flushSessionToQueue();
      console.log('[ReadingTimeTracker] Cleanup — session ended for book', bookId);
    };
  }, [bookId, supabaseBookId, isEnabled]);
}
