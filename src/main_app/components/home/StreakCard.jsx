import React from 'react';
import { Flame } from 'lucide-react';
import useStudyStore from '../../store/studyStore';
import { useNavigate } from 'react-router-dom';

const StreakCard = () => {
    const days = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
    const currentDay = new Date().getDay(); // 0 for Sunday, 6 for Saturday
    const { streakCount, streakHistory } = useStudyStore();
    const navigate = useNavigate();
    const today = new Date().toLocaleDateString('en-CA'); // 'YYYY-MM-DD'

    // Get date string for each day of current week
    const getWeekDayDate = (dayIndex) => {
        const now = new Date();
        const currentDayOfWeek = now.getDay();
        const diff = dayIndex - currentDayOfWeek;
        const date = new Date(now);
        date.setDate(now.getDate() + diff);
        return date.toLocaleDateString('en-CA');
    };

    return (
        <div className="w-full">
            <h2 className='text-lg sm:text-xl px-2 font-semibold text-text-primary mb-4 tracking-tight'>Activity Streak</h2>
            <div 
                onClick={() => navigate('/streak')}
                className="bg-card-glass backdrop-blur-xl rounded-3xl p-6 md:p-8 border-2 border-border-default hover:border-orange-500/40 hover:shadow-md transition-all duration-500 group overflow-hidden shadow-md relative h-48 xs:h-60 sm:h-64 flex flex-col justify-center items-center cursor-pointer"
            >
                
                {/* Background Icon Asset - Matched with ExamReminder */}
                <div className="absolute bottom-2 -left-2 size-44 md:size-52 text-orange-500/10 rotate-12 group-hover:text-orange-500/20 group-hover:scale-100 group-hover:rotate-0 transition-all duration-1000 pointer-events-none ease-in-out">
                    <Flame size="100%" strokeWidth={1} />
                </div>

                {/* Top Section: Number + Text (Single Row) */}
                <div className="flex items-baseline gap-2 md:gap-3 mb-6 md:mb-8 relative z-10">
                    <span className="text-4xl md:text-6xl lg:text-8xl font-bold bg-gradient-to-br from-orange-50 to-orange-500 bg-clip-text text-transparent tracking-tighter tabular-nums text-center drop-shadow-sm">
                        {streakCount}
                    </span>
                    <span className="text-xs md:text-base lg:text-sm font-bold text-text-secondary uppercase tracking-[0.15em]">
                        day streak
                    </span>
                </div>

                {/* Bottom Section: Weekly Calendar */}
                <div className="flex justify-between w-full max-w-xs md:max-w-md gap-1 md:gap-2 relative z-10">
                    {days.map((day, index) => {
                        const dayDate = getWeekDayDate(index);
                        const isToday = index === currentDay;
                        const hasStreak = streakHistory.includes(dayDate);

                        return (
                            <div key={day} className="flex flex-col items-center gap-1.5 md:gap-2">
                                <span className={`text-[10px] md:text-xs font-bold uppercase tracking-wider ${index === currentDay ? 'text-orange-500' : 'text-text-tertiary'}`}>
                                    {day}
                                </span>
                                <div className={`size-7 md:size-9 lg:size-8 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
                                    hasStreak
                                        ? isToday
                                          ? 'bg-orange-500 border-orange-500 text-white shadow-[0_0_10px_rgba(249,115,22,0.4)] ring-2 ring-orange-500/30 ring-offset-2 dark:ring-offset-neutral-900 shadow-md scale-110'
                                          : 'bg-orange-500 border-orange-500 text-white shadow-[0_0_10px_rgba(249,115,22,0.4)]'
                                        : isToday
                                        ? 'bg-neutral-900 border-neutral-900 text-white shadow-sm dark:bg-white dark:border-white dark:text-neutral-900'
                                        : 'bg-bg-subtle border-border-default text-text-tertiary'
                                }`}>
                                    {isToday ? (
                                        <Flame size={14} className="fill-current md:size-18" />
                                    ) : hasStreak ? (
                                        <Flame size={12} className="fill-current" />
                                    ) : (
                                        <div className="size-1.5 md:size-2 bg-text-tertiary/20 rounded-full" />
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default StreakCard;
