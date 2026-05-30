import { useEffect, useRef } from 'react';
import db from '../db/apex.db';

const MIN_SESSION_SECONDS = 60; // discard fragments under 1 minute
const TICK_INTERVAL_MS = 60000; // 1 minute
const HEARTBEAT_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

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
  // Refs for heartbeat and delta tracking
  const heartbeatRef = useRef(null);
  const lastFlushedMinutesRef = useRef(0);

  function getTodayStr() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  async function incrementLocalMinute() {
    if (!bookId) return;
    const today = getTodayStr();
    try {
      const existing = await db.book_reading_time
        .where('[bookId+date]').equals([bookId, today]).first();
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
        .where('[bookId+date]').equals([bookId, today]).first();
      if (!record || record.minutes < 1) {
        console.log('[ReadingTimeTracker] Nothing to flush — under 1 minute');
        return;
      }
      // Compute delta since last flush
      const delta = record.minutes - lastFlushedMinutesRef.current;
      if (delta <= 0) {
        console.log('[ReadingTimeTracker] No new minutes since last flush — skipping');
        return;
      }
      await db.sync_queue.add({
        action: 'increment',
        tableName: 'book_reading_time',
        // Use a UUID for local_id to avoid collisions
        local_id: crypto.randomUUID(),
        recordId: null,
        payload: {
          book_id: supabaseBookId,
          date: today,
          minutes: delta, // send only delta
        },
        createdAt: new Date().toISOString(),
        attempts: 0,
        status: 'pending',
      });
      // Update last flushed marker
      lastFlushedMinutesRef.current = record.minutes;
      console.log('[ReadingTimeTracker] Flushed delta of', delta, 'minutes (total today:', record.minutes, ') for book', supabaseBookId);
      // Keep synced flag for backward compatibility but set to 1
      await db.book_reading_time.update(record.id, { synced: 1 });
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

    // Seed lastFlushedMinutesRef from local Dexie record.
    // This ensures that if the user already accumulated minutes earlier today,
    // we don't re-send them as a new delta on the next heartbeat.
    async function seedLastFlushed() {
      try {
        const today = getTodayStr();
        const record = await db.book_reading_time
          .where('[bookId+date]').equals([bookId, today]).first();
        if (record && record.minutes > 0) {
          lastFlushedMinutesRef.current = record.minutes;
          console.log('[ReadingTimeTracker] Seeded lastFlushed from Dexie:', record.minutes);
        } else {
          lastFlushedMinutesRef.current = 0;
          console.log('[ReadingTimeTracker] No existing Dexie record for today — starting delta from 0');
        }
      } catch (err) {
        console.warn('[ReadingTimeTracker] Could not seed lastFlushed — defaulting to 0');
        lastFlushedMinutesRef.current = 0;
      }
    }

    seedLastFlushed();
    startTick();

    // Heartbeat flush — every 5 minutes during active reading
    heartbeatRef.current = setInterval(async () => {
      if (!visibilityPausedRef.current) {
        console.log('[ReadingTimeTracker] Heartbeat flush firing');
        await flushSessionToQueue();
      }
    }, HEARTBEAT_INTERVAL_MS);

    function handleVisibilityChange() {
      if (document.visibilityState === 'hidden') {
        visibilityPausedRef.current = true;
        console.log('[ReadingTimeTracker] Paused — app hidden');
        flushSessionToQueue();
      } else {
        visibilityPausedRef.current = false;
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
      // Cleanup heartbeat interval
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
        heartbeatRef.current = null;
      }
      // Session end — flush whatever accumulated
      flushSessionToQueue();
      console.log('[ReadingTimeTracker] Cleanup — session ended for book', bookId);
    };
  }, [bookId, supabaseBookId, isEnabled]);
}
