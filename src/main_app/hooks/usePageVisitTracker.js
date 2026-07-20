import { useEffect, useRef, useCallback } from 'react';
import db from '../db/apex.db';
import useQuestStore from '../store/useQuestStore';

/**
 * usePageVisitTracker
 * 
 * Tracks page visits in the PDF reader. When a user stays on a page for ≥5
 * continuous foreground seconds, the page is recorded as "visited" in Dexie
 * and queued for backend sync.
 * 
 * - Visibility-aware: pauses timer when app is backgrounded, resumes on return.
 * - Deduplicates: same page + book + day is only recorded once.
 * - Cleanup: timer and listeners are torn down on unmount.
 */
export default function usePageVisitTracker({
  bookId,
  supabaseBookId,
  currentPage,
  totalPages,
  isEnabled,
  onVisitRecorded
}) {
  const timerRef = useRef(null);
  const elapsedRef = useRef(0);        // ms elapsed while visible
  const intervalStartRef = useRef(null); // Date.now() when last interval segment started
  const currentPageRef = useRef(currentPage);
  const onVisitRecordedRef = useRef(onVisitRecorded);

  useEffect(() => {
    onVisitRecordedRef.current = onVisitRecorded;
  }, [onVisitRecorded]);

  const VISIT_THRESHOLD_MS = 4000; // 4 seconds
  const TICK_INTERVAL_MS = 250;    // check every 250ms for precision

  // ── Record a visit to Dexie + sync queue ──
  const recordVisit = useCallback(async (pageNumber) => {
    if (!bookId || !pageNumber) return;

    try {
      // Deduplicate: check if this page+book was already recorded today
      const todayStr = new Date().toISOString().slice(0, 10); // "2025-06-01"
      const existing = await db.page_visits
        .where('bookId')
        .equals(bookId)
        .filter(v => v.pageNumber === pageNumber && v.visitedAt?.slice(0, 10) === todayStr)
        .first();

      if (existing) {
        console.log('[PageVisitTracker] Skipped page', pageNumber, '— already recorded today');
        return;
      }

      const localId = crypto.randomUUID();
      const visitedAt = new Date().toISOString();

      // Write to Dexie
      await db.page_visits.add({
        local_id: localId,
        bookId,
        supabaseBookId,
        pageNumber,
        visitedAt,
        synced: 0,
      });

      // Enqueue to sync_queue (matches existing pattern: action='upload')
      await db.sync_queue.add({
        action: 'upload',
        tableName: 'page_visits',
        local_id: localId,
        recordId: null,
        payload: {
          book_id: supabaseBookId,
          page_number: pageNumber,
          visited_at: visitedAt,
        },
        createdAt: new Date().toISOString(),
        attempts: 0,
        status: 'pending',
      });

      console.log('[PageVisitTracker] Recorded page', pageNumber, 'for book', bookId);

      // Wire quest action
      useQuestStore.getState().reportAction('pages_read', 1);
      console.log('[Quest Wire] pages_read reported');
    } catch (err) {
      console.error('[PageVisitTracker] Failed to record visit:', err);
    }
  }, [bookId, supabaseBookId]);

  // ── Timer lifecycle ──
  useEffect(() => {
    if (!isEnabled || !currentPage || !bookId) return;

    currentPageRef.current = currentPage;
    elapsedRef.current = 0;
    intervalStartRef.current = null;

    // Start ticking
    const startTicking = () => {
      if (timerRef.current) clearInterval(timerRef.current);
      intervalStartRef.current = Date.now();

      timerRef.current = setInterval(() => {
        if (!intervalStartRef.current) return;

        const now = Date.now();
        elapsedRef.current += now - intervalStartRef.current;
        intervalStartRef.current = now;

        if (elapsedRef.current >= VISIT_THRESHOLD_MS) {
          // Fire the visit and stop ticking for this page
          clearInterval(timerRef.current);
          timerRef.current = null;
          if (onVisitRecordedRef.current) {
            onVisitRecordedRef.current(currentPageRef.current);
          }
          recordVisit(currentPageRef.current);
        }
      }, TICK_INTERVAL_MS);
    };

    const stopTicking = () => {
      if (timerRef.current) {
        // Accumulate elapsed time before pausing
        if (intervalStartRef.current) {
          elapsedRef.current += Date.now() - intervalStartRef.current;
          intervalStartRef.current = null;
        }
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log('[PageVisitTracker] Timer paused — app hidden');
        stopTicking();
      } else {
        console.log('[PageVisitTracker] Timer resumed — app visible');
        // Only resume if we haven't already hit the threshold
        if (elapsedRef.current < VISIT_THRESHOLD_MS) {
          startTicking();
        }
      }
    };

    // Kick off
    if (!document.hidden) {
      startTicking();
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      stopTicking();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isEnabled, currentPage, bookId, recordVisit]);
}
