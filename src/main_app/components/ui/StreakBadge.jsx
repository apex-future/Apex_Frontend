import React from 'react';
import { Flame } from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';
import useStudyStore from '../../store/studyStore';

const StreakBadge = () => {
  const streakCount = useStudyStore(state => state.streakCount);
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate('/streak')}
      className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500/10 dark:bg-orange-500/20 border border-orange-500/20 rounded-full group cursor-pointer transition-all duration-300 hover:bg-orange-500/20 dark:hover:bg-orange-500/30 active:scale-95"
      aria-label="View streak"
    >
      <Flame
        size={18}
        weight="fill"
        className={`transition-transform group-hover:scale-110 ${
          streakCount > 0
            ? 'text-orange-500 fill-orange-500'
            : 'text-orange-400/60'
        }`}
      />
      <span className={`text-sm font-bold tabular-nums ${
        streakCount > 0
          ? 'text-orange-600 dark:text-orange-400'
          : 'text-orange-400/60'
      }`}>
        {streakCount}
      </span>
      <span className={`hidden sm:inline text-[10px] font-bold uppercase tracking-wider ${
        streakCount > 0
          ? 'text-orange-600/80 dark:text-orange-400/80'
          : 'text-orange-400/50'
        }`}>
        Day{streakCount !== 1 ? 's' : ''}
      </span>
    </button>
  );
};

export default StreakBadge;
