import React from 'react';
import { motion } from 'framer-motion';
import { Fire } from '@phosphor-icons/react';
import Card from '../ui/Card';

/**
 * WeeklyGoldenBar
 * Props:
 *   weeklyDays         — array of 7 day objects from /api/quests/stats
 *   goldenDaysThisWeek — number
 *   goldenDaysTotal    — number
 */
export default function WeeklyGoldenBar({ weeklyDays = [] }) {
  return (
    <Card className="p-4 px-6 relative w-full flex flex-col justify-center items-center overflow-hidden">
      {/* Background Icon Asset */}
      <div className="absolute bottom-2 -left-2 size-32 text-orange-500/5 rotate-12 pointer-events-none ease-in-out">
        <Fire size="100%" weight="thin" />
      </div>

      <div className="flex justify-between w-full max-w-xs md:max-w-md gap-1 md:gap-2 relative z-10">
        {weeklyDays.map((day) => {
          // If we want golden days to use the same logic as streak in StreakCard
          const hasStreak = day.has_streak || day.is_golden;
          const isToday = day.is_today;

          return (
            <div key={day.date} className="flex flex-col items-center gap-1.5 md:gap-2">
              <span className={`text-[10px] md:text-xs font-bold uppercase tracking-wider ${isToday ? 'text-orange-500' : 'text-text-tertiary'}`}>
                {day.label}
              </span>
              <div className={`size-7 md:size-9 lg:size-8 rounded-full flex items-center justify-center transition-all duration-500 ${
                hasStreak
                  ? isToday
                    ? 'bg-orange-500 border-2 border-orange-500 text-white shadow-[0_0_10px_rgba(249,115,22,0.4)] ring-2 ring-orange-500/30 ring-offset-2 dark:ring-offset-neutral-900 shadow-md scale-110'
                    : 'bg-orange-500 border-2 border-orange-500 text-white shadow-[0_0_10px_rgba(249,115,22,0.4)]'
                  : isToday
                  ? 'bg-transparent border-2 border-orange-500 text-orange-500 shadow-sm ring-2 ring-offset-2 ring-orange-500/20 dark:ring-offset-neutral-900'
                  : 'bg-bg-primary text-text-tertiary'
              }`}>
                {hasStreak ? (
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
