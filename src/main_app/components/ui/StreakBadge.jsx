import React from 'react';
import { Flame } from 'lucide-react';
import useStudyStore from '../../store/studyStore';

const StreakBadge = () => {
    const streakCount = useStudyStore(state => state.streakCount);

    if (streakCount === 0) return null;

    return (
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500/10 dark:bg-orange-500/20 border border-orange-500/20 rounded-full group cursor-default transition-all duration-300 hover:bg-orange-500/20 dark:hover:bg-orange-500/30">
            <Flame 
                size={18} 
                className="text-orange-500 fill-orange-500 animate-pulse group-hover:scale-110 transition-transform" 
            />
            <span className="text-sm font-bold text-orange-600 dark:text-orange-400 tabular-nums">
                {streakCount}
            </span>
            <span className="hidden sm:inline text-[10px] font-bold text-orange-600/80 dark:text-orange-400/80 uppercase tracking-wider">
                Day{streakCount !== 1 ? 's' : ''}
            </span>
        </div>
    );
};

export default StreakBadge;
