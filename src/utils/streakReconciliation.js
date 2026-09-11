import db from '../main_app/db/apex.db';

/**
 * reconcileDailyStreak
 *
 * Runs on app mount. Reads today's cumulative reading seconds from Dexie
 * and determines whether the user earned a streak that was not recorded.
 *
 * @param {number} streakThresholdMinutes - Daily reading goal in minutes
 * @param {object} studyStore - Zustand store instance (e.g. useStudyStore)
 */
async function reconcileDailyStreak(streakThresholdMinutes, studyStore) {
  const today = new Date().toLocaleDateString('en-CA');
  const { streakHistory, updateStreak } = studyStore.getState();
  const currentHistory = streakHistory || [];

  // CHECK 1: Already in history — nothing to do
  if (currentHistory.includes(today)) {
    console.log('[Streak Reconcile] Today already in history — no action needed.');
    return;
  }

  // CHECK 2: Read cumulative seconds from Dexie
  const todayProgress = await db.user_daily_streak_progress
    .where('date').equals(today).first();
  const totalSecondsToday = todayProgress?.seconds_read || 0;
  const thresholdSeconds = Math.max(2, streakThresholdMinutes || 2) * 60;

  console.log('[Streak Reconcile] Seconds read today:', totalSecondsToday, '/ Threshold:', thresholdSeconds);

  if (totalSecondsToday >= thresholdSeconds) {
    // User earned the streak — credit it once
    console.log('[Streak Reconcile] Threshold met but not in history — crediting streak now.');
    updateStreak();
    return;
  }

  // CHECK 3: Seconds below threshold — clear any ghost flag
  const ghostFlag = localStorage.getItem('apex_streak_fired_today');
  if (ghostFlag === today) {
    console.log('[Streak Reconcile] Ghost flag detected with insufficient reading time. Clearing flag. Seconds read:', totalSecondsToday);
    localStorage.removeItem('apex_streak_fired_today');
  }
}

export default reconcileDailyStreak;
