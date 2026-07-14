import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Scroll, Trophy, Target, ArrowLeft } from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/apiClient';
import useXpStore from '../store/useXpStore';
import WeeklyGoldenBar from '../components/quests/WeeklyGoldenBar';
import QuestCard from '../components/quests/QuestCard';
import QuestCompleteModal from '../components/quests/QuestCompleteModal';
import StatCard from '../components/ui/StatCard';
import EmptyState from '../components/ui/EmptyState';
import Card from '../components/ui/Card';

// ─── Skeleton loader ──────────────────────────────────────────────────────────
function QuestListSkeleton() {
  return (
    <Card className="w-full flex flex-col p-4 gap-5 sm:p-5 sm:gap-6 animate-pulse">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="w-full flex flex-col gap-2">
          <div className="w-full flex items-center gap-3">
            <div className="w-5 h-5 rounded-full bg-bg-subtle shrink-0" />
            <div className="h-4 bg-bg-subtle rounded w-2/3" />
          </div>
          <div className="w-full h-5 rounded-full bg-bg-subtle/50 mt-1" />
        </div>
      ))}
    </Card>
  );
}

function WeeklyBarSkeleton() {
  return (
    <Card className="p-4 px-6 relative w-full flex flex-col justify-center items-center overflow-hidden animate-pulse">
      <div className="flex justify-between w-full max-w-xs md:max-w-md gap-1 md:gap-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-1.5 md:gap-2">
            <div className="h-3 w-4 bg-bg-subtle rounded" />
            <div className="size-7 md:size-9 lg:size-8 rounded-full bg-bg-subtle opacity-40" />
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

  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState({
    questCopy: '',
    xpAwarded: 20,
    reward: null,
    allCompleted: false,
  });

  const awardXpOptimistic = useXpStore((s) => s.awardXpOptimistic);

  // ─── Data fetching ──────────────────────────────────────────────────────────
  const fetchQuests = useCallback(async () => {
    try {
      const res = await apiClient.get('/api/quests/today');
      setQuests(res.data);
      console.log('[Quest Page] Fetched today quests:', res.data);
    } catch (err) {
      console.error('[Quest Page] Failed to fetch quests:', err);
      setError('Could not load your quests. Please try again.');
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const res = await apiClient.get('/api/quests/stats');
      setStats(res.data);
      console.log('[Quest Page] Fetched stats:', res.data);
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
        const questCopy = (['quest_1', 'quest_2', 'quest_3']
          .map((k) => quests?.[k])
          .find((q) => q?.id === questId)?.copy) || '';

        setModalData({ questCopy, xpAwarded: xp_awarded, reward, allCompleted: all_completed });
        setShowModal(true);

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
  }, [quests, fetchStats, awardXpOptimistic]);

  // ─── Date display ───────────────────────────────────────────────────────────
  const todayLabel = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

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
        <div className="pt-2">
          <p
            className="text-text-tertiary uppercase tracking-widest"
            style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 11 }}
          >
            Today's Quests
          </p>
        </div>

        {/* SECTION 4 — Quest cards */}
        <div className="flex flex-col gap-3 -mt-4">
          {loading ? (
            <QuestListSkeleton />
          ) : quests ? (
            <Card className="w-full flex flex-col p-4 gap-5 sm:p-5 sm:gap-6">
              {quests.quest_1 && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: 0.1 }}
                >
                  <QuestCard
                    quest={quests.quest_1}
                    onProgressUpdate={handleProgressUpdate}
                  />
                </motion.div>
              )}
              {quests.quest_2 && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: 0.18 }}
                >
                  <QuestCard
                    quest={quests.quest_2}
                    onProgressUpdate={handleProgressUpdate}
                  />
                </motion.div>
              )}
              {quests.quest_3 && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: 0.26 }}
                >
                  <QuestCard
                    quest={quests.quest_3}
                    onProgressUpdate={handleProgressUpdate}
                  />
                </motion.div>
              )}
            </Card>
          ) : null}
        </div>

        {/* SECTION 5 — Lifetime stats row */}
        {!loading && stats && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.35 }}
            className="grid grid-cols-2 gap-3 pt-2"
          >
            <StatCard
              label="Total Quests"
              value={stats.lifetime_quests_completed ?? 0}
              icon={Trophy}
              colorScheme="amber"
            />
            <StatCard
              label="Reading Goal"
              value={stats.current_progressive_target ?? 5}
              icon={Target}
              colorScheme="purple"
              unit="min"
            />
          </motion.div>
        )}
      </div>

      {/* SECTION 6 — Quest complete modal */}
      <QuestCompleteModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        questCopy={modalData.questCopy}
        xpAwarded={modalData.xpAwarded}
        reward={modalData.reward}
        allCompleted={modalData.allCompleted}
      />
    </div>
  );
}
