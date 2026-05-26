import { useMemo } from 'react';
import useStudyStore from '../store/studyStore';
import { greetingMessages } from '../components/home/greetingMessages';

/**
 * useGreeting — selects a dynamic greeting based on the user's current context.
 *
 * Priority order (first match wins, one message at a time):
 *   1. Long absence (3+ days since last active)
 *   2. Exam close (≤ 7 days to nearest exam)
 *   3. Streak alive (> 3 days)
 *   4. Time of day (morning / afternoon / evening)
 *
 * Rotates within each bucket so repeat visits don't feel stale.
 * Uses sessionStorage to persist the index per signal for the current browser session.
 *
 * @param {string} firstName - User's first name
 * @returns {{ greeting: string, talk: string }}
 */
export default function useGreeting(firstName) {
  const { streakCount, lastActiveDate, exams } = useStudyStore();

  const result = useMemo(() => {
    const name = firstName || 'Scholar';
    const now = new Date();
    const hour = now.getHours();

    // 1. Check if we already have a session-locked greeting
    const sessionKey = 'apex-session-greeting-locked';
    try {
      const stored = sessionStorage.getItem(sessionKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Only return if it's the same user (or generic)
        if (parsed.firstName === firstName) {
          return parsed.data;
        }
      }
    } catch (e) {
      console.error("Failed to parse stored greeting", e);
    }

    // ── Helper: today as YYYY-MM-DD (local) ────────────────────────
    const todayStr = (() => {
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      const d = String(now.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    })();

    // ── Helper: days between today and a YYYY-MM-DD string ─────────
    const daysSince = (dateStr) => {
      if (!dateStr) return Infinity;
      const then = new Date(dateStr + 'T00:00:00');
      const today = new Date(todayStr + 'T00:00:00');
      return Math.round((today - then) / (1000 * 60 * 60 * 24));
    };

    const daysUntil = (dateStr) => {
      if (!dateStr) return Infinity;
      const target = new Date(dateStr + 'T00:00:00');
      const today = new Date(todayStr + 'T00:00:00');
      return Math.ceil((target - today) / (1000 * 60 * 60 * 24));
    };

    // ── Signal detection ───────────────────────────────────────────

    // 1. Long absence: 3+ days since last active
    const absenceDays = daysSince(lastActiveDate);
    const isLongAbsence = absenceDays >= 3;

    // 2. Exam close: nearest non-paused exam ≤ 7 days away
    let closestExamDays = Infinity;
    let closestExamName = '';
    if (exams && exams.length > 0) {
      for (const exam of exams) {
        if (exam.isPaused) continue;
        const d = daysUntil(exam.date);
        if (d > 0 && d < closestExamDays) {
          closestExamDays = d;
          closestExamName = exam.name || 'Your exam';
        }
      }
    }
    const isExamClose = closestExamDays <= 7;

    // 3. Streak alive: > 3 consecutive days AND user hasn't studied today yet
    // (streak messages are a nudge — irrelevant once they've already logged a session today)
    const isStreakAlive = streakCount > 3 && lastActiveDate !== todayStr;

    // 4. Time of day (always available as fallback)
    const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';

    // ── Pick the bucket (priority order) ───────────────────────────
    let bucket;
    let signalKey;
    let dynamicX = '';

    if (isLongAbsence) {
      bucket = greetingMessages.longAbsence;
      signalKey = 'longAbsence';
    } else if (isExamClose) {
      bucket = greetingMessages.examClose;
      signalKey = 'examClose';
      dynamicX = String(closestExamDays);
    } else if (isStreakAlive) {
      bucket = greetingMessages.streak;
      signalKey = 'streak';
      dynamicX = String(streakCount);
    } else {
      bucket = greetingMessages[timeOfDay];
      signalKey = timeOfDay;
    }

    // ── Pick one and stick with it for the session ──────────────────
    // We check if we already picked one for this signalKey in this session
    const rotationKey = `apex-greeting-idx-${signalKey}`;
    let index;
    try {
      const storedIdx = sessionStorage.getItem(rotationKey);
      if (storedIdx !== null) {
        index = parseInt(storedIdx, 10) % bucket.length;
      } else {
        index = Math.floor(Math.random() * bucket.length);
        sessionStorage.setItem(rotationKey, String(index));
      }
    } catch {
      index = Math.floor(Math.random() * bucket.length);
    }

    const selected = bucket[index];

    // ── Replace placeholders ───────────────────────────────────────
    const replacePlaceholders = (str) =>
      str
        .replace(/\{name\}/g, name)
        .replace(/\bX\b/g, dynamicX)
        .replace(/\bE\b/g, closestExamName);

    const finalResult = {
      greeting: replacePlaceholders(selected.greeting),
      talk: replacePlaceholders(selected.talk),
    };

    // Store for the rest of the session to avoid changes on route changes
    try {
      sessionStorage.setItem(sessionKey, JSON.stringify({
        firstName,
        data: finalResult
      }));
    } catch (e) {
      // ignore storage errors
    }

    return finalResult;
  }, [firstName, streakCount, lastActiveDate, exams]);

  return result;
}
