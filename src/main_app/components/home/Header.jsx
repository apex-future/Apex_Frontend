import React, { useContext, useState, useEffect } from 'react';
import useAuthStore from '../../store/authStore';
import { BookContext } from '../../context/BookContextInstance';
import useStudyStore from '../../store/studyStore';
import useThemeStore from '../../store/themeStore';
import useXpStore from '../../store/useXpStore';
import useQuestStore from '../../store/useQuestStore';
import { computeLevel } from '../../../config/xpConfig';
import { Fire, Sparkle, Hexagon, Scroll } from '@phosphor-icons/react';
import useGreeting from '../../hooks/useGreeting';
import Typewriter from '../ui/Typewriter';
import { useNavigate } from 'react-router-dom';
import Card from '../ui/Card';
import StatCard from '../ui/StatCard';
import ElectricBorder from '../ui/ElectricBorder';

export default function Header() {
    const { user } = useAuthStore();
    const { books = [] } = useContext(BookContext) || {};
    const { streakCount = 0, lastActiveDate, streakHistory = [] } = useStudyStore() || {};
    const navigate = useNavigate();
    const { resolvedTheme } = useThemeStore();
    const isDark = resolvedTheme === 'dark';
    
    // Capitalize first name and fallback to Isaac if missing
    let firstName = user?.full_name?.split(' ')[0];
    firstName = firstName ? firstName.charAt(0).toUpperCase() + firstName.slice(1) : "Isaac";

    const { greeting, talk } = useGreeting(firstName);

    const [skipAnimation] = useState(() => {
        return sessionStorage.getItem('greeting_animated') === 'true';
    });

    useEffect(() => {
        if (!skipAnimation) {
            sessionStorage.setItem('greeting_animated', 'true');
        }
    }, [skipAnimation]);

    const { estimatedXp, xpToday, isMultiplierActive, multiplierExpiresAt, lastMultiplierApplied } = useXpStore();
    const { quest_1, quest_2, quest_3 } = useQuestStore();
    
    const levelData = computeLevel(estimatedXp);
    const multiplierActive = isMultiplierActive();

    // Compute the current day-based multiplier to display (mirrors backend logic)
    const getDayMultiplier = () => {
        const now = new Date();
        const day = now.getDay(); // 3 = Wed, 6 = Sat
        const weekOfMonth = Math.min(Math.ceil(now.getDate() / 7), 4);
        const idx = weekOfMonth - 1;
        const WED  = [1.25, 1.35, 1.50, 1.60];
        const SAT  = [1.50, 1.60, 1.75, 2.00];
        if (day === 3) return WED[idx];
        if (day === 6) return SAT[idx];
        return null;
    };

    // Determine displayed multiplier: timed reward takes priority, then day-based
    const timedActive = multiplierExpiresAt && new Date(multiplierExpiresAt) > new Date();
    const activeMultiplier = multiplierActive
        ? (timedActive ? lastMultiplierApplied : getDayMultiplier())
        : null;
    const multiplierLabel = activeMultiplier
        ? (timedActive && timedCountdown
            ? `${activeMultiplier}× · ${timedCountdown} left`
            : `${activeMultiplier}× boost active`)
        : null;
    
    const questsCompletedCount = [quest_1, quest_2, quest_3].filter(q => q?.completed).length;

    // ── Live countdown for timed overflow multiplier ──────────────────
    const [timedCountdown, setTimedCountdown] = useState('');

    useEffect(() => {
      if (!timedActive) {
        setTimedCountdown('');
        return;
      }

      const computeLabel = () => {
        const now = new Date();
        const expires = new Date(multiplierExpiresAt);
        const remainMs = expires - now;
        if (remainMs <= 0) {
          setTimedCountdown('');
          return;
        }
        const totalSec = Math.ceil(remainMs / 1000);
        const mins = Math.floor(totalSec / 60);
        const secs = totalSec % 60;
        setTimedCountdown(
          `${mins}:${String(secs).padStart(2, '0')}`
        );
      };

      computeLabel();
      const interval = setInterval(computeLabel, 1000);
      return () => clearInterval(interval);
    }, [timedActive, multiplierExpiresAt]);

    // When timed multiplier expires, isMultiplierActive() re-check
    // happens on next render via the interval cleanup.

    // Check if the streak for today has been fired / earned
    const todayStr = (() => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    })();
    const isStreakFiredToday = streakCount > 0 && (lastActiveDate === todayStr || (Array.isArray(streakHistory) && streakHistory.includes(todayStr)));

    console.log('[Header] rendered | streakCount:', streakCount, '| isStreakFiredToday:', isStreakFiredToday);

    return (
        <div className={`w-full font-sans ${resolvedTheme}`}>
            <div className="px-4 sm:px-6 md:px-8 pt-2 pb-6 sm:pt-4 sm:pb-8 w-full max-w-5xl mx-auto">
                
                {/* Title Section */}
                <div id="tour-welcome" className="flex flex-col gap-1 mb-6">
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight min-h-[1.2em] text-text-primary">
                            <Typewriter text={greeting} speed={40} showCursor={false} skipAnimation={skipAnimation} />
                        </h1>
                    </div>
                    <p className="text-text-tertiary text-sm sm:text-base font-medium mt-1 min-h-[1.5em]">
                        <Typewriter text={talk} speed={30} delay={800} showCursor={false} skipAnimation={skipAnimation} />
                    </p>
                </div>

                {/* 3 Cards Section */}
                <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-6">
                    <StatCard
                        label="Daily Streak"
                        value={streakCount}
                        icon={Fire}
                        colorScheme={isStreakFiredToday ? "orange" : "gray"}
                        unit="days"
                        onClick={() => navigate('/streak')}
                    />

                    {multiplierActive ? (
                        <ElectricBorder
                            color="#7C3AED"
                            speed={timedActive ? 1.2 : 0.8}
                            chaos={timedActive ? 0.18 : 0.10}
                            borderRadius={14}
                            style={{ borderRadius: 14 }}
                        >
                            <StatCard
                                label="XP Today"
                                value={xpToday}
                                icon={Sparkle}
                                colorScheme="purple"
                                unit="gained"
                                sub={multiplierLabel}
                            />
                        </ElectricBorder>
                    ) : (
                        <StatCard
                            label="XP Today"
                            value={xpToday}
                            icon={Sparkle}
                            colorScheme="amber"
                            unit="gained"
                        />
                    )}

                    <StatCard
                        label="Study Quest"
                        value={questsCompletedCount}
                        icon={Scroll}
                        colorScheme="emerald"
                        unit="/ 3 completed"
                        onClick={() => navigate('/quest')}
                    />
                </div>

                {/* Level Progress Card */}
                <Card className="p-4 sm:p-5 flex items-center gap-3 sm:gap-5">
                    {/* Level Hexagon Icon - Left */}
                    <div className="relative flex items-center justify-center shrink-0 w-12 h-12 sm:w-14 sm:h-14">
                        {/* migrated from lucide: Hexagon -- decorative level icon */}
                        <Hexagon className="absolute inset-0 text-[#a855f7] w-full h-full" weight="thin" />
                        <span className="text-xl sm:text-2xl font-bold text-text-primary relative z-10">{levelData.level}</span>
                    </div>
                    
                    {/* Progress Center */}
                    <div className="flex-1 flex flex-col gap-1.5 sm:gap-2">
                        <div className="flex justify-between items-end">
                            <div>
                                <div className="text-sm sm:text-base font-medium text-text-primary">
                                    Level {levelData.level}
                                </div>
                                <div className="text-xs text-text-tertiary font-medium -mt-1">
                                    {levelData.displayTitle}
                                </div>
                            </div>
                            <div className="text-xs sm:text-sm text-text-tertiary font-medium">
                                {levelData.xpIntoLevel} / {levelData.xpForCurrentLevel} XP
                            </div>
                        </div>
                        <div className={`w-full h-1.5 sm:h-2 rounded-full relative overflow-visible ${isDark ? 'bg-white/5' : 'bg-black/5'}`}>
                            <div 
                                className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-purple-900 via-purple-600 to-[#c084fc] transition-all duration-1000 ease-out"
                                style={{ width: `${levelData.progressPercent}%` }}
                            >
                                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full shadow-[0_0_10px_3px_#c084fc]" />
                            </div>
                        </div>
                        <div className="text-xs sm:text-sm text-text-tertiary font-medium text-right">
                            {levelData.xpToNextLevel} XP to Level {levelData.level + 1}
                        </div>
                    </div>

                    {/* Level Hexagon Icon - Right */}
                    <div className="relative flex items-center justify-center shrink-0 w-10 h-10 sm:w-12 sm:h-12 opacity-50">
                        <Hexagon className="absolute inset-0 text-text-placeholder w-full h-full" weight="thin" />
                        <span className="text-lg sm:text-xl font-bold text-text-tertiary relative z-10">{levelData.level + 1}</span>
                    </div>
                </Card>

            </div>
        </div>
    );
}
