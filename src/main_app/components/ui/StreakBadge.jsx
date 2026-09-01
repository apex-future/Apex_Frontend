import React from 'react';
import { Fire } from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';
import useStudyStore from '../../store/studyStore';

const StreakBadge = () => {
  const { streakCount = 0, lastActiveDate, streakHistory = [] } = useStudyStore();
  const navigate = useNavigate();

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const isStreakFiredToday = streakCount > 0 && (lastActiveDate === todayStr || (Array.isArray(streakHistory) && streakHistory.includes(todayStr)));

  return (
    <button
      onClick={() => navigate('/streak')}
      className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-full group cursor-pointer transition-all duration-300 active:scale-95 ${
        isStreakFiredToday
          ? 'bg-orange-500/10 dark:bg-orange-500/20 border-orange-500/20 hover:bg-orange-500/20 dark:hover:bg-orange-500/30'
          : 'bg-neutral-500/10 dark:bg-neutral-500/20 border-neutral-500/20 hover:bg-neutral-500/20 dark:hover:bg-neutral-500/30'
      }`}
      aria-label="View streak"
    >
      <Fire
        size={18}
        weight="fill"
        className={`transition-transform group-hover:scale-110 ${
          isStreakFiredToday
            ? 'text-orange-500 fill-orange-500'
            : 'text-neutral-400 dark:text-neutral-500'
        }`}
      />
      <span className={`text-sm font-bold tabular-nums ${
        isStreakFiredToday
          ? 'text-orange-600 dark:text-orange-400'
          : 'text-neutral-400 dark:text-neutral-500'
      }`}>
        {streakCount}
      </span>
      <span className={`hidden sm:inline text-[10px] font-bold uppercase tracking-wider ${
        isStreakFiredToday
          ? 'text-orange-600/80 dark:text-orange-400/80'
          : 'text-neutral-400/70 dark:text-neutral-500/70'
        }`}>
        Day{streakCount !== 1 ? 's' : ''}
      </span>
    </button>
  );
};

export default StreakBadge;
