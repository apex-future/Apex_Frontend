import React from 'react';
import { Fire, Snowflake } from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';
import Card from '../ui/Card';
import useStudyStore from '../../store/studyStore';

/**
 * WeeklyGoldenBar
 * Props:
 *   weeklyDays         — optional array of 7 day objects from /api/quests/stats
 *   goldenDaysThisWeek — number
 *   goldenDaysTotal    — number
 *   onClick            — optional click handler
 */
export default function WeeklyGoldenBar({ weeklyDays: customWeeklyDays, onClick }) {
  const navigate = useNavigate();
  const { streakHistory = [], frozenDays = [] } = useStudyStore();

  const getWeekDays = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const now = new Date();
    const currentDayOfWeek = now.getDay(); // 0 = Sunday, 6 = Saturday

    return days.map((label, index) => {
      const diff = index - currentDayOfWeek;
      const dateObj = new Date(now);
      dateObj.setDate(now.getDate() + diff);
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      const isToday = index === currentDayOfWeek;
      const hasStreak = streakHistory.includes(dateStr);
      const isFrozen = frozenDays.includes(dateStr);
      const isGolden = hasStreak || isFrozen;

      return {
        date: dateStr,
        label,
        has_streak: hasStreak,
        is_frozen: isFrozen,
        is_golden: isGolden,
        is_today: isToday,
      };
    });
  };

  const daysToRender = (customWeeklyDays && customWeeklyDays.length > 0)
    ? customWeeklyDays
    : getWeekDays();

  const handleClick = (e) => {
    if (onClick) {
      onClick(e);
    } else {
      navigate('/streak');
    }
  };

  return (
    <Card 
      onClick={handleClick}
      variant="interactive"
      className="p-3.5 px-5 relative w-full flex flex-col justify-center items-center overflow-hidden cursor-pointer transition-all duration-300"
    >
      {/* Background Icon Asset */}
      <div className="absolute bottom-2 -left-2 size-32 text-orange-500/5 rotate-12 pointer-events-none ease-in-out">
        <Fire size="100%" weight="thin" />
      </div>

      <div className="flex justify-between w-full max-w-xs md:max-w-md gap-1 md:gap-2 relative z-10">
        {daysToRender.map((day) => {
          const hasStreak = day.has_streak || day.is_golden;
          const isFrozen = day.is_frozen || (frozenDays && frozenDays.includes(day.date));
          const isToday = day.is_today;

          return (
            <div key={day.date || day.label} className="flex flex-col items-center gap-1.5 md:gap-2">
              <span className={`text-[10px] md:text-xs font-bold uppercase tracking-wider ${isToday ? (isFrozen ? 'text-sky-500' : 'text-orange-500') : 'text-text-tertiary'}`}>
                {day.label}
              </span>
              <div className={`size-7 md:size-9 lg:size-8 rounded-full flex items-center justify-center transition-all duration-500 ${
                isFrozen
                  ? isToday
                    ? 'bg-sky-500 border-2 border-sky-500 text-white shadow-[0_0_10px_rgba(14,165,233,0.4)] ring-2 ring-sky-500/30 ring-offset-2 dark:ring-offset-neutral-900 shadow-md scale-110'
                    : 'bg-sky-500 border-2 border-sky-500 text-white shadow-[0_0_10px_rgba(14,165,233,0.4)]'
                  : hasStreak
                  ? isToday
                    ? 'bg-orange-500 border-2 border-orange-500 text-white shadow-[0_0_10px_rgba(249,115,22,0.4)] ring-2 ring-orange-500/30 ring-offset-2 dark:ring-offset-neutral-900 shadow-md scale-110'
                    : 'bg-orange-500 border-2 border-orange-500 text-white shadow-[0_0_10px_rgba(249,115,22,0.4)]'
                  : isToday
                  ? 'bg-transparent border-2 border-orange-500 text-orange-500 shadow-sm ring-2 ring-offset-2 ring-orange-500/20 dark:ring-offset-neutral-900'
                  : 'bg-bg-primary text-text-tertiary'
              }`}>
                {isFrozen ? (
                  <Snowflake size={isToday ? 14 : 12} weight="fill" />
                ) : hasStreak ? (
                  <Fire size={isToday ? 14 : 12} weight="fill" />
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
    </Card>
  );
}

