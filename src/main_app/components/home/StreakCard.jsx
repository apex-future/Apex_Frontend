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
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    return (
        <div className="w-full h-full flex flex-col">
            <h2 className='text-xs font-bold uppercase tracking-wider text-text-tertiary px-2 mb-2'>Activity Streak</h2>
            <div 
                onClick={() => navigate('/streak')}
                className="bg-card-glass backdrop-blur-xl rounded-card p-4 px-6 border-2 border-border-default hover:border-orange-500/40 hover:shadow-xl hover:shadow-black/5 transition-all duration-500 group overflow-hidden shadow-xl shadow-black/5 relative min-h-[14rem] flex-1 flex flex-col justify-center items-center cursor-pointer"
            >
                
                {/* Background Icon Asset - Matched with ExamReminder */}
                <div className="absolute bottom-2 -left-2 size-44 md:size-52 text-orange-500/10 rotate-12 group-hover:text-orange-500/20 group-hover:scale-100 group-hover:rotate-0 transition-all duration-1000 pointer-events-none ease-in-out">
                    <Flame size="100%" strokeWidth={1} />
                </div>

                {/* Top Section: Number + Text (Centered like ExamReminder) */}
                <div className="flex flex-col items-center justify-center relative z-10 mb-6 md:mb-8">
                    <span className="text-6xl lg:text-7xl font-black text-text-primary tabular-nums tracking-tighter leading-none">
                        {streakCount}
                    </span>
                    <span className="text-[10px] font-black text-text-tertiary uppercase tracking-[0.2em] mt-1">
                        days streak
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
                                        ? 'bg-transparent border-orange-500 text-orange-500 shadow-sm ring-2 ring-offset-2 ring-orange-500/20 dark:ring-offset-neutral-900'
                                        : 'bg-bg-subtle border-border-default text-text-tertiary'
                                }`}>
                                    {hasStreak ? (
                                        <Flame size={isToday ? 14 : 12} className="fill-current" />
                                    ) : isToday ? (
                                        <div className="size-1 md:size-1.5 bg-orange-500 rounded-full" />
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
