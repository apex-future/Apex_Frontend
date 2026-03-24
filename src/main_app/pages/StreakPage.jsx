import React, { useState } from 'react';
import { ArrowLeft, Flame, ChevronLeft, ChevronRight, Trophy, Calendar, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useStudyStore from '../store/studyStore';

function StreakPage() {
  const navigate = useNavigate();
  const { streakCount, longestStreak, streakHistory } = useStudyStore();
  const [calendarDate, setCalendarDate] = useState(new Date());

  const today = new Date().toLocaleDateString('en-CA'); // 'YYYY-MM-DD'

  const getMotivation = (count) => {
    if (count === 0) return "Start your streak today";
    if (count <= 3) return "Great start, keep going!";
    if (count <= 7) return "Knowledge Ninja, keep going!";
    if (count <= 14) return "You're on fire!";
    if (count <= 30) return "Unstoppable reader!";
    return "Apex Scholar. Legendary.";
  };

  // Calendar navigation
  const prevMonth = () => {
    setCalendarDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCalendarDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  // Generate calendar days
  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = calendarDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Build calendar grid
  const calendarCells = [];
  // Leading empty cells
  for (let i = 0; i < firstDay; i++) {
    calendarCells.push(null);
  }
  // Day cells
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    calendarCells.push({ day: d, dateStr });
  }

  const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <div className="min-h-screen bg-bg-primary pb-24">
      {/* Header - Glassmorphic matching Dictionary style */}
      <div className="sticky top-0 z-50 bg-card-glass/80 backdrop-blur-xl border-b border-border-default">
        <div className="max-w-4xl mx-auto px-4 py-6 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-neutral-100 dark:hover:bg-white/5 rounded-xl transition-all group"
          >
            <ArrowLeft size={20} className="text-text-secondary group-hover:-translate-x-1 transition-transform" />
          </button>

          <h1 className="text-xl font-bold font-display text-text-primary">Streak</h1>

          <div className="w-10"></div> {/* Spacer to center title */}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 pt-6 pb-12 space-y-6">

        {/* Top Desktop Row: Hero (Left) & Stats (Right) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">

          {/* Hero Section */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-950/30 dark:to-orange-900/20 border-2 border-orange-200/50 dark:border-orange-500/20 p-6 md:p-8 flex flex-col items-center justify-center text-center h-full min-h-[250px] md:min-h-[320px]">
            {/* Background glow */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_40%,rgba(249,115,22,0.15),transparent)] pointer-events-none" />

            {/* Fire and Number Side-by-Side */}
            <div className="flex items-center justify-center gap-2 sm:gap-4 relative mb-2">
              <div className="relative flex items-center justify-center">
                <div className="absolute inset-0 blur-xl bg-orange-400/40 rounded-full scale-[2]" />
                <Flame
                  size={56}
                  className="relative text-orange-500 fill-orange-500 drop-shadow-md sm:w-[72px] sm:h-[72px]"
                />
              </div>
              <span className="relative text-7xl sm:text-[100px] font-black bg-gradient-to-br from-orange-400 to-orange-600 bg-clip-text text-transparent tracking-tighter tabular-nums leading-none">
                {streakCount}
              </span>
            </div>

            <h2 className="relative text-xl font-bold text-orange-900/80 dark:text-orange-200 mt-2 mb-1">
              Day{streakCount !== 1 ? 's' : ''} Streak
            </h2>

            <p className="relative text-sm font-medium text-orange-700/70 dark:text-orange-300/60 mt-0.5">
              {getMotivation(streakCount)}
            </p>
          </div>

          {/* Stats Column (Side-by-side on mobile, stacked on desktop) */}
          <div className="grid grid-cols-3 md:flex md:flex-col gap-2 md:gap-5 h-full">

            {/* Current Streak Stat Box */}
            <div className="relative overflow-hidden bg-card-glass backdrop-blur-xl rounded-2xl border-2 border-border-default p-2 sm:p-3 md:p-5 flex flex-col justify-center flex-1 hover:border-orange-500/30 transition-all group">
              <div className="absolute top-1/2 -translate-y-1/2 -left-4 md:-left-4 size-16 sm:size-20 md:size-28 text-orange-500/10 rotate-12 group-hover:text-orange-500/20 group-hover:scale-110 group-hover:rotate-0 transition-all duration-700 pointer-events-none ease-in-out">
                <Flame size="100%" strokeWidth={1} />
              </div>
              <div className="relative z-10 flex flex-col items-center md:items-end text-center md:text-right">
                <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-text-primary tabular-nums tracking-tight mb-0.5">{streakCount}</div>
                <div className="text-[8px] sm:text-[10px] md:text-[11px] lg:text-xs uppercase tracking-wider text-text-tertiary font-bold leading-none sm:leading-tight">Current<br className="md:hidden" /> Streak</div>
              </div>
            </div>

            {/* Longest Streak Stat Box */}
            <div className="relative overflow-hidden bg-card-glass backdrop-blur-xl rounded-2xl border-2 border-border-default p-2 sm:p-3 md:p-5 flex flex-col justify-center flex-1 hover:border-amber-500/30 transition-all group">
              <div className="absolute top-1/2 -translate-y-1/2 -left-4 md:-left-4 size-16 sm:size-20 md:size-28 text-amber-500/10 rotate-12 group-hover:text-amber-500/20 group-hover:scale-110 group-hover:rotate-0 transition-all duration-700 pointer-events-none ease-in-out">
                <Trophy size="100%" strokeWidth={1} />
              </div>
              <div className="relative z-10 flex flex-col items-center md:items-end text-center md:text-right">
                <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-text-primary tabular-nums tracking-tight mb-0.5">{longestStreak}</div>
                <div className="text-[8px] sm:text-[10px] md:text-[11px] lg:text-xs uppercase tracking-wider text-text-tertiary font-bold leading-none sm:leading-tight">Longest<br className="md:hidden" /> Streak</div>
              </div>
            </div>

            {/* Days Tracked Stat Box */}
            <div className="relative overflow-hidden bg-card-glass backdrop-blur-xl rounded-2xl border-2 border-border-default p-2 sm:p-3 md:p-5 flex flex-col justify-center flex-1 hover:border-blue-500/30 transition-all group">
              <div className="absolute top-1/2 -translate-y-1/2 -left-4 md:-left-4 size-16 sm:size-20 md:size-28 text-blue-500/10 rotate-12 group-hover:text-blue-500/20 group-hover:scale-110 group-hover:rotate-0 transition-all duration-700 pointer-events-none ease-in-out">
                <Calendar size="100%" strokeWidth={1} />
              </div>
              <div className="relative z-10 flex flex-col items-center md:items-end text-center md:text-right">
                <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-text-primary tabular-nums tracking-tight mb-0.5">{streakHistory.length}</div>
                <div className="text-[8px] sm:text-[10px] md:text-[11px] lg:text-xs uppercase tracking-wider text-text-tertiary font-bold leading-none sm:leading-tight">Days<br className="md:hidden" /> Tracked</div>
              </div>
            </div>

          </div>
        </div>

        {/* Calendar Section (Centered, max-w-550px) */}
        <div className="max-w-[550px] mx-auto w-full">
          <div className="bg-card-glass backdrop-blur-xl rounded-3xl border-2 border-border-default p-5 sm:p-6 shadow-sm">
            {/* Month header with navigation */}
            <div className="flex items-center justify-between mb-5">
              <button
                onClick={prevMonth}
                className="p-2 hover:bg-bg-subtle rounded-xl transition-all active:scale-90"
              >
                <ChevronLeft size={20} className="text-text-secondary" />
              </button>
              <h3 className="text-base font-bold text-text-primary tracking-tight">
                {monthName}
              </h3>
              <button
                onClick={nextMonth}
                className="p-2 hover:bg-bg-subtle rounded-xl transition-all active:scale-90"
              >
                <ChevronRight size={20} className="text-text-secondary" />
              </button>
            </div>

            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {weekDays.map((day, i) => (
                <div key={i} className="text-center text-[10px] sm:text-[11px] font-bold text-text-tertiary uppercase tracking-wider py-1">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
              {calendarCells.map((cell, i) => {
                if (!cell) {
                  return <div key={`empty-${i}`} className="aspect-square" />;
                }

                const isToday = cell.dateStr === today;
                const hasStreak = streakHistory.includes(cell.dateStr);
                const isFuture = cell.dateStr > today;

                return (
                  <div
                    key={cell.dateStr}
                    className={`aspect-square rounded-xl flex items-center justify-center text-[13px] sm:text-sm font-semibold transition-all duration-300 ${hasStreak
                        ? isToday
                          ? 'bg-orange-500 text-white shadow-[0_0_8px_rgba(249,115,22,0.4)] ring-2 ring-offset-2 ring-orange-400 dark:ring-offset-neutral-900'
                          : 'bg-orange-500 text-white shadow-[0_0_8px_rgba(249,115,22,0.4)]'
                        : isToday
                          ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-md'
                          : isFuture
                            ? 'text-text-tertiary/40'
                            : 'text-text-tertiary'
                      }`}
                  >
                    {cell.day}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default StreakPage;
