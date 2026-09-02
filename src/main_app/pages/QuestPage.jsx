import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Scroll, Trophy, Target, ArrowLeft, Clock, ArrowsClockwise } from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/apiClient';
import useXpStore from '../store/useXpStore';
import useAuthStore from '../store/authStore';
import db from '../db/apex.db';
import WeeklyGoldenBar from '../components/quests/WeeklyGoldenBar';
import QuestCard from '../components/quests/QuestCard';
import QuestCompleteModal from '../components/quests/QuestCompleteModal';
import QuestTour from '../components/quests/QuestTour';
import EmptyState from '../components/ui/EmptyState';
import Card from '../components/ui/Card';
import useQuestStore from '../store/useQuestStore';
import useOnboardingStore from '../store/useOnboardingStore';
import { showToastGlobal } from '../hooks/useToast';

// ─── Skeleton loader ──────────────────────────────────────────────────────────
const SKELETON_SHIMMER_STYLE_ID = 'quest-page-skeleton-shimmer';
if (typeof document !== 'undefined' && !document.getElementById(SKELETON_SHIMMER_STYLE_ID)) {
  const style = document.createElement('style');
  style.id = SKELETON_SHIMMER_STYLE_ID;
  style.innerHTML = `
    @keyframes quest-slow-shimmer {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(100%); }
    }
    @keyframes quest-pulse-slow {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.45; }
    }
    .quest-skeleton-shimmer {
      position: relative;
      overflow: hidden;
      animation: quest-pulse-slow 2.8s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }
    .quest-skeleton-shimmer::after {
      content: '';
      position: absolute;
      inset: 0;
      transform: translateX(-100%);
      background: linear-gradient(
        90deg,
        transparent 0%,
        rgba(255, 255, 255, 0.15) 50%,
        transparent 100%
      );
      animation: quest-slow-shimmer 2.5s infinite ease-in-out;
    }
  `;
  document.head.appendChild(style);
}

function QuestListSkeleton() {
  return (
    <Card className="w-full flex flex-col p-4 gap-5 sm:p-5 sm:gap-6 quest-skeleton-shimmer">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="w-full flex flex-col gap-2">
          <div className="w-full flex items-center gap-3">
            <div className="w-5 h-5 rounded-full bg-black/10 dark:bg-white/10 shrink-0" />
            <div className="h-4 bg-black/10 dark:bg-white/10 rounded w-2/3" />
          </div>
          <div className="w-full h-5 rounded-full bg-black/5 dark:bg-white/5 mt-1" />
        </div>
      ))}
    </Card>
  );
}

function WeeklyBarSkeleton() {
  return (
    <Card className="p-4 px-6 relative w-full flex flex-col justify-center items-center overflow-hidden quest-skeleton-shimmer">
      <div className="flex justify-between w-full max-w-xs md:max-w-md gap-1 md:gap-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-1.5 md:gap-2">
            <div className="h-3 w-4 bg-black/10 dark:bg-white/10 rounded" />
            <div className="size-7 md:size-9 lg:size-8 rounded-full bg-black/10 dark:bg-white/10 opacity-40" />
          </div>
        ))}
      </div>
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function QuestPage() {
  const navigate = useNavigate();
  const [quests, setQuests] = useState(null);    // { date, quest_1, quest_2, quest_3, all_completed }
  const [stats, setStats] = useState(null);      // { weekly_days, golden_days_this_week, ... }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshingKey, setRefreshingKey] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState({
    questCopy: '',
    xpAwarded: 20,
    reward: null,
    allCompleted: false,
  });
  
  const lastCompletedData = useRef({});
  const questStore = useQuestStore();
  const { hasSeenQuestTour, tourTextSelected } = useOnboardingStore();

  const [replayChestsClaimed, setReplayChestsClaimed] = useState({
    quest_1: false,
    quest_2: false,
    quest_3: false,
  });

  const awardXpOptimistic = useXpStore((s) => s.awardXpOptimistic);

  const isRealOnboarding = Boolean(
    quests?.quest_1?.is_onboarding || quests?.quest_2?.is_onboarding
  );

  // Whenever a tour is replayed, reset the replay chests state so all chests start closed
  useEffect(() => {
    if (!hasSeenQuestTour && !isRealOnboarding) {
      setReplayChestsClaimed({
        quest_1: false,
        quest_2: false,
        quest_3: false,
      });
    }
  }, [hasSeenQuestTour, isRealOnboarding]);

  // During tour replay for existing users, temporarily display the preset onboarding quests
  // Once the tour completes (or is dismissed), activeQuests reverts to the user's real quests
  const activeQuests = React.useMemo(() => {
    if (!quests) return null;
    if (!hasSeenQuestTour && !isRealOnboarding) {
      return {
        date: quests.date,
        quest_1: {
          id: 'onboarding_upload_book',
          copy: 'Add your first book to your library',
          action: 'book_uploaded',
          target: 1,
          unit: 'books',
          type: 'onboarding',
          subcategory: 'reading',
          progress: 1,
          completed: true,
          forced_reward: 'streak_freeze',
          is_onboarding: true,
        },
        quest_2: {
          id: 'onboarding_select_text',
          copy: 'Select text in any book',
          action: 'text_selected',
          target: 1,
          unit: 'selections',
          type: 'onboarding',
          subcategory: 'annotation',
          progress: tourTextSelected ? 1 : 0,
          completed: tourTextSelected,
          forced_reward: 'refresh_token',
          is_onboarding: true,
        },
        quest_3: {
          id: 'lookup_3',
          copy: 'Look up 3 words in the dictionary today',
          action: 'dictionary_lookup',
          target: 3,
          unit: 'words',
          type: 'onboarding',
          subcategory: 'dictionary',
          progress: 0,
          completed: false,
          is_onboarding: true,
        },
        all_completed: false,
        refresh_tokens: questStore.refreshTokens ?? 2,
        refreshed_today: false,
      };
    }
    return quests;
  }, [quests, hasSeenQuestTour, isRealOnboarding, tourTextSelected, questStore.refreshTokens]);

  // Auto-detect if user already has books in Dexie for onboarding book upload quest
  useEffect(() => {
    const checkInitialBookUpload = async () => {
      if (quests?.quest_1?.action === 'book_uploaded' && !quests.quest_1.completed) {
        try {
          const bookCount = await db.books.count();
          if (bookCount > 0) {
            useQuestStore.getState().reportAction('book_uploaded', 1);
            setQuests((prev) =>
              prev
                ? {
                    ...prev,
                    quest_1: { ...prev.quest_1, progress: 1, completed: true },
                  }
                : prev
            );
          }
        } catch (err) {
          console.error('[Quest Page] Failed to check book count:', err);
        }
      }
    };
    checkInitialBookUpload();
  }, [quests?.quest_1?.action, quests?.quest_1?.completed]);

  // ─── Data fetching ──────────────────────────────────────────────────────────
  const fetchQuests = useCallback(async () => {
    const userId = useAuthStore.getState().user?.id;
    const store = useQuestStore.getState();

    // Step 1: Check Dexie cache
    const cached = await store.loadQuestsFromCache(userId);

    if (cached) {
      console.log('[Quest Page] Cache hit — rendering from Dexie immediately');

      // Zustand persist may have offline completions ahead of the Dexie snapshot.
      // If Zustand already holds today's data, prefer its state for progress/completed.
      // Otherwise seed from the Dexie cache (e.g. new device or first open today).
      const zustandHasToday = store.todayDate === cached.quest_date;

      const questsToRender = {
        date: cached.quest_date,
        quest_1: zustandHasToday && store.quest_1 ? store.quest_1 : cached.quest_1,
        quest_2: zustandHasToday && store.quest_2 ? store.quest_2 : cached.quest_2,
        quest_3: zustandHasToday && store.quest_3 ? store.quest_3 : cached.quest_3,
        all_completed: zustandHasToday ? store.all_completed : cached.all_completed,
      };

      setQuests(questsToRender);

      if (!zustandHasToday) {
        store.seedQuests(questsToRender);
      }

      // Step 2: Background sync — silent, no loading state change
      if (navigator.onLine) {
        console.log('[Quest Page] Background sync running');
        apiClient.get('/api/quests/today')
          .then(async (res) => {
            store.resetIfNewDay();
            
            // Background sync returned server data — CASA merge before setting state
            const serverData = res.data;
            const currentState = useQuestStore.getState();

            // seedQuests already does Math.max progress and OR for reward_claimed
            store.seedQuests(serverData);

            // Read back merged state to render (Zustand is now source of truth)
            const merged = {
              date: serverData.date,
              quest_1: useQuestStore.getState().quest_1,
              quest_2: useQuestStore.getState().quest_2,
              quest_3: useQuestStore.getState().quest_3,
              all_completed: useQuestStore.getState().all_completed,
            };
            setQuests(merged);
            await store.saveQuestsToCache(userId, merged);
            console.log('[Quest Page] Background sync complete — CASA merge applied:', merged.date);
          })
          .catch((err) => {
            console.warn('[Quest Page] Background sync failed — keeping cached data:', err);
          });
      }
      return;
    }

    // Step 3: No valid cache
    if (!navigator.onLine) {
      console.log('[Quest Page] Offline with no cache');
      setError('You are offline. Open this page once while connected to cache your quests.');
      return;
    }

    // Step 4: Online, no cache — fetch (spinner is already showing from useEffect)
    try {
      store.resetIfNewDay();
      const res = await apiClient.get('/api/quests/today');
      setQuests(res.data);
      store.seedQuests(res.data);
      await store.saveQuestsToCache(userId, res.data);
      console.log('[Quest Page] Fetched and cached:', res.data.date);
    } catch (err) {
      console.error('[Quest Page] Failed to fetch quests:', err);
      setError('Could not load your quests. Please try again.');
    }
  }, []);

  const fetchStats = useCallback(async () => {
    const userId = useAuthStore.getState().user?.id;
    const store = useQuestStore.getState();

    // Check cache first
    const cachedStats = await store.loadStatsFromCache(userId);
    if (cachedStats) {
      console.log('[Quest Page] Stats cache hit');
      setStats(cachedStats);
      // Background refresh
      if (navigator.onLine) {
        apiClient.get('/api/quests/stats')
          .then(async (res) => {
            setStats(res.data);
            await store.saveStatsToCache(userId, res.data);
          })
          .catch((err) => {
            console.warn('[Quest Page] Stats background sync failed:', err);
          });
      }
      return;
    }

    if (!navigator.onLine) {
      console.log('[Quest Page] Offline — no stats cache, skipping');
      return;
    }

    try {
      const res = await apiClient.get('/api/quests/stats');
      setStats(res.data);
      await store.saveStatsToCache(userId, res.data);
      console.log('[Quest Page] Stats fetched and cached');
    } catch (err) {
      console.error('[Quest Page] Failed to fetch stats:', err);
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchQuests(), fetchStats()]);
      setLoading(false);
    };
    load();
  }, [fetchQuests, fetchStats]);

  // ─── Progress update handler ────────────────────────────────────────────────
  const handleProgressUpdate = useCallback(async (questId, action, increment) => {
    try {
      const res = await apiClient.post('/api/quests/progress', {
        quest_id: questId,
        action,
        increment,
      });

      const {
        new_progress,
        completed,
        just_completed,
        all_completed,
        xp_awarded,
        reward,
      } = res.data;

      // Update local quest state
      setQuests((prev) => {
        if (!prev) return prev;
        const updated = { ...prev, all_completed };
        for (const key of ['quest_1', 'quest_2', 'quest_3']) {
          if (prev[key]?.id === questId) {
            updated[key] = {
              ...prev[key],
              progress: new_progress,
              completed,
            };
          }
        }
        return updated;
      });

      // Trigger modal and XP update on completion
      if (just_completed) {
        lastCompletedData.current[questId] = res.data;
        
        // Optimistic XP update in header
        if (xp_awarded > 0 && typeof awardXpOptimistic === 'function') {
          awardXpOptimistic('quest_completion', { quest_id: questId }, xp_awarded);
        }

        // Refresh stats
        fetchStats();
      }
    } catch (err) {
      console.error('[Quest Page] Progress update failed:', err);
    }
  }, [fetchStats, awardXpOptimistic]);

  // ─── Refresh quest handler ──────────────────────────────────────────────────
  const handleRefreshQuest = useCallback(async (questKey) => {
    if (!navigator.onLine) {
      showToastGlobal("You're offline, cant refresh quest", 'warning');
      return;
    }

    const store = useQuestStore.getState();
    if (store.refreshedToday) {
      showToastGlobal("You've refreshed a quest today, wait till tomorrow", 'info');
      return;
    }

    if ((store.refreshTokens ?? 2) <= 0) {
      showToastGlobal("You're out of refresh tokens, gain rewards to get more", 'error');
      return;
    }

    const targetQuest = quests?.[questKey];
    if (targetQuest?.completed) {
      showToastGlobal("Completed quests cannot be refreshed", 'info');
      return;
    }

    setRefreshingKey(questKey);
    try {
      const res = await apiClient.post('/api/quests/refresh', { quest_key: questKey });
      if (res.data?.success) {
        const { new_quest, refresh_tokens, refreshed_today } = res.data;
        setQuests((prev) => prev ? { ...prev, [questKey]: new_quest } : prev);
        store.updateQuestProgress(questKey, 0, false);
        store.setRefreshTokens(refresh_tokens);
        store.setRefreshedToday(refreshed_today);
        showToastGlobal('Quest refreshed!', 'success');
      }
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (detail === 'no_tokens') {
        showToastGlobal("You're out of refresh tokens, gain rewards to get more", 'error');
      } else if (detail === 'already_refreshed_today') {
        store.setRefreshedToday(true);
        showToastGlobal("You've refreshed a quest today, wait till tomorrow", 'info');
      } else if (detail === 'already_completed') {
        showToastGlobal("Completed quests cannot be refreshed", 'info');
      } else {
        showToastGlobal('Failed to refresh quest. Please try again.', 'error');
      }
    } finally {
      setRefreshingKey(null);
    }
  }, [quests]);

  const handleChestClick = useCallback((questKey) => {
    const targetQuest = activeQuests?.[questKey];
    if (!targetQuest) return;

    const questId = targetQuest.id;
    const questCopy = targetQuest.copy || '';
    const forcedItem = targetQuest.forced_reward;
    const isReplay = !hasSeenQuestTour && !isRealOnboarding;

    const onboardingStore = useOnboardingStore.getState();
    const isAlreadyClaimedTourReward =
      isReplay ||
      (forcedItem === 'streak_freeze' && onboardingStore.hasClaimedQuestTourStreakFreeze) ||
      (forcedItem === 'refresh_token' && onboardingStore.hasClaimedQuestTourRefreshToken);

    let reward = null;
    if (forcedItem === 'streak_freeze') {
      reward = {
        item: 'streak_freeze',
        label: isAlreadyClaimedTourReward ? 'Streak Freeze' : '1 Streak Freeze',
        alreadyClaimed: isAlreadyClaimedTourReward,
        tag: isAlreadyClaimedTourReward ? 'Tour Reward Already Claimed' : null,
      };
    } else if (forcedItem === 'refresh_token') {
      reward = {
        item: 'refresh_token',
        label: isAlreadyClaimedTourReward ? 'Refresh Token' : '1 Refresh Token',
        alreadyClaimed: isAlreadyClaimedTourReward,
        tag: isAlreadyClaimedTourReward ? 'Tour Reward Already Claimed' : null,
      };
    } else {
      const data = lastCompletedData.current[questId];
      reward = data?.reward || null;
    }

    const xpAwarded = isReplay ? 0 : (lastCompletedData.current[questId]?.xp_awarded ?? 20);
    const allCompleted = activeQuests?.all_completed ?? false;

    setModalData({ questCopy, xpAwarded, reward, allCompleted });
    setShowModal(true);

    lastCompletedData.current.activeChestQuestKey = questKey;
    lastCompletedData.current.activeForcedItem = forcedItem;
    lastCompletedData.current.activeIsReplay = isReplay;
    lastCompletedData.current.activeAlreadyClaimed = isAlreadyClaimedTourReward;
  }, [activeQuests, hasSeenQuestTour, isRealOnboarding]);

  const handleModalClose = useCallback(async () => {
    setShowModal(false);
    const activeKey = lastCompletedData.current.activeChestQuestKey;
    const forcedItem = lastCompletedData.current.activeForcedItem;
    const isReplay = lastCompletedData.current.activeIsReplay;
    const alreadyClaimed = lastCompletedData.current.activeAlreadyClaimed;

    lastCompletedData.current.activeChestQuestKey = null;
    lastCompletedData.current.activeForcedItem = null;
    lastCompletedData.current.activeIsReplay = null;
    lastCompletedData.current.activeAlreadyClaimed = null;

    if (!activeKey) return;

    // If this was an onboarding reward claim and not already claimed, mark it claimed in store
    if (forcedItem && !alreadyClaimed) {
      useOnboardingStore.getState().markQuestTourRewardClaimed(forcedItem);
    }

    // If replaying tour, mark it claimed in the replay session so it opens in the preview, without touching real chest states
    if (isReplay) {
      setReplayChestsClaimed((prev) => ({ ...prev, [activeKey]: true }));
      return;
    }

    useQuestStore.getState().claimChest(activeKey);

    if (navigator.onLine) {
      try {
        await apiClient.post('/api/quests/claim', { quest_key: activeKey });

        // Update Dexie cache to reflect claim so other devices see it on next cache read
        const userId = useAuthStore.getState().user?.id;
        const store = useQuestStore.getState();
        const cached = await store.loadQuestsFromCache(userId);
        if (cached && cached[activeKey]) {
          cached[activeKey] = { ...cached[activeKey], reward_claimed: true };
          await store.saveQuestsToCache(userId, cached);
        }
        console.log('[Quest] Claim synced to server:', activeKey);
      } catch (err) {
        console.warn('[Quest] Claim sync failed — chest_X_claimed stays true in Zustand:', err);
        // Zustand persist already holds chest_X_claimed: true.
        // On next background sync, seedQuests CASA resolveChestClaimed will keep it true.
      }
    } else {
      // Offline — queue the claim for flush when online
      try {
        await db.sync_queue.add({
          action: 'quest_claim',
          tableName: 'daily_quest_state',
          local_id: `claim_${activeKey}_${Date.now()}`,
          payload: { quest_key: activeKey },
          status: 'pending',
          attempts: 0,
          createdAt: new Date().toISOString(),
        });
        console.log('[Quest] Offline claim queued:', activeKey);
      } catch (err) {
        console.warn('[Quest] Failed to queue offline claim:', err);
      }
    }
  }, []);

  // ─── Date display ───────────────────────────────────────────────────────────
  const todayLabel = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const isReplay = !hasSeenQuestTour && !isRealOnboarding;

  // ─── Render ─────────────────────────────────────────────────────────────────
  if (error && !quests) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center pb-24">
        <EmptyState
          icon={Scroll}
          title="Couldn't load quests"
          message={error}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary pb-28">
      <div className="sticky top-0 z-50 w-full px-4 md:px-8 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <div className="px-1 py-1 rounded-full bg-white/15 dark:bg-white/5 backdrop-blur-xl border border-white/25 dark:border-white/10 shadow-[0_2px_16px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-white/20 dark:hover:bg-white/10 text-text-secondary rounded-full transition-all group flex items-center justify-center"
            >
              <ArrowLeft size={20} weight="bold" className="group-hover:-translate-x-1 transition-transform text-text-primary" />
            </button>
          </div>

          <div className="px-5 py-2.5 rounded-[20px] bg-white/15 dark:bg-white/5 backdrop-blur-xl border border-white/25 dark:border-white/10 shadow-[0_2px_16px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)] text-center flex flex-col items-center">
            <h3 className='text-base font-bold text-text-primary' style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Daily Quests</h3>
            <p className="text-xs text-text-tertiary font-medium mt-0.5">
              {todayLabel}
            </p>
          </div>
          
          <div className="w-[42px]" />
        </div>
      </div>

      <div className="max-w-[640px] mx-auto px-4 py-6 space-y-6">

        {/* SECTION 2 — Weekly golden bar */}
        {loading ? (
          <WeeklyBarSkeleton />
        ) : stats ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
          >
            <WeeklyGoldenBar
              weeklyDays={stats.weekly_days}
              goldenDaysThisWeek={stats.golden_days_this_week}
              goldenDaysTotal={stats.golden_days_total}
            />
          </motion.div>
        ) : null}

        {/* SECTION 3 — Today's quests heading */}
        <div className="pt-2 flex items-center justify-between gap-2 flex-wrap">
          <p
            className="text-text-tertiary uppercase tracking-widest"
            style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 11 }}
          >
            Today's Quests
          </p>
          <div className="flex items-center gap-2">
            <div id="quest-refresh-token-badge" className="flex items-center gap-1.5 text-text-tertiary text-xs font-medium bg-black/5 dark:bg-white/5 px-2.5 py-1 rounded-full border border-black/5 dark:border-white/5">
              <ArrowsClockwise size={13} weight="bold" className="text-purple-600 dark:text-purple-400" />
              <span>Refresh Tokens: <strong className="text-text-primary font-bold">{questStore.refreshTokens ?? 2}</strong></span>
            </div>
            <div className="flex items-center gap-1.5 text-text-tertiary text-xs font-medium bg-black/5 dark:bg-white/5 px-2.5 py-1 rounded-full">
              <Clock size={14} weight="fill" />
              <span>
                {Math.max(1, Math.ceil((new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() + 1, 0, 0, 0) - new Date()) / (1000 * 60 * 60)))} hours left
              </span>
            </div>
          </div>
        </div>

        {/* SECTION 4 — Quest cards */}
        <div className="flex flex-col gap-3 -mt-4">
          {loading ? (
            <QuestListSkeleton />
          ) : activeQuests ? (
            <Card className="w-full flex flex-col p-4 gap-5 sm:p-5 sm:gap-6">
              {activeQuests.quest_1 && (
                <motion.div
                  id="quest-card-1"
                  data-quest-key="quest_1"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: 0.1 }}
                >
                  <QuestCard
                    quest={activeQuests.quest_1}
                    chestClaimed={isReplay ? replayChestsClaimed.quest_1 : questStore.chest_1_claimed}
                    onChestClick={() => handleChestClick('quest_1')}
                    onProgressUpdate={handleProgressUpdate}
                    isRefreshing={refreshingKey === 'quest_1'}
                  />
                </motion.div>
              )}
              {activeQuests.quest_2 && (
                <motion.div
                  id="quest-card-2"
                  data-quest-key="quest_2"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: 0.18 }}
                >
                  <QuestCard
                    quest={activeQuests.quest_2}
                    chestClaimed={isReplay ? replayChestsClaimed.quest_2 : questStore.chest_2_claimed}
                    onChestClick={() => handleChestClick('quest_2')}
                    onProgressUpdate={handleProgressUpdate}
                    onRefreshQuest={() => handleRefreshQuest('quest_2')}
                    isRefreshing={refreshingKey === 'quest_2'}
                  />
                </motion.div>
              )}
              {activeQuests.quest_3 && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: 0.26 }}
                >
                  <QuestCard
                    quest={activeQuests.quest_3}
                    chestClaimed={isReplay ? replayChestsClaimed.quest_3 : questStore.chest_3_claimed}
                    onChestClick={() => handleChestClick('quest_3')}
                    onProgressUpdate={handleProgressUpdate}
                    onRefreshQuest={() => handleRefreshQuest('quest_3')}
                    isRefreshing={refreshingKey === 'quest_3'}
                  />
                </motion.div>
              )}
            </Card>
          ) : null}
        </div>


      </div>

      {/* SECTION 6 — Quest complete modal */}
      <QuestCompleteModal
        isOpen={showModal}
        onClose={handleModalClose}
        questCopy={modalData.questCopy}
        xpAwarded={modalData.xpAwarded}
        reward={modalData.reward}
        allCompleted={modalData.allCompleted}
      />

      <QuestTour quests={activeQuests} />
    </div>
  );
}
