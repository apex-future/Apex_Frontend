import React, { useContext, useState, useEffect } from 'react';
import useAuthStore from '../../store/authStore';
import { BookContext } from '../../context/BookContextInstance';
import useStudyStore from '../../store/studyStore';
import useThemeStore from '../../store/themeStore';
import useXpStore from '../../store/useXpStore';
import { computeLevel } from '../../../config/xpConfig';
import { Lightning, Fire, Sparkle, Hexagon, Scroll } from '@phosphor-icons/react';
import useGreeting from '../../hooks/useGreeting';
import Typewriter from '../ui/Typewriter';
import { useNavigate } from 'react-router-dom';

export default function Header() {
    const { user } = useAuthStore();
    const { books = [] } = useContext(BookContext) || {};
    const { streakCount = 0 } = useStudyStore() || {};
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

    const { estimatedXp, isMultiplierActive } = useXpStore();
    const levelData = computeLevel(estimatedXp);
    const multiplierActive = isMultiplierActive();

    // Theme-aware card classes
    const cardClasses = isDark
        ? "bg-bg-elevated border-t border-white/10 shadow-sm shadow-black/40"
        : "bg-bg-subtle border-t border-black/10 shadow-sm shadow-black/10";

    return (
        <div className={`w-full font-sans ${resolvedTheme}`}>
            <div className="px-4 sm:px-6 md:px-8 pt-2 pb-6 sm:pt-4 sm:pb-8 w-full max-w-5xl mx-auto">
                
                {/* Title Section */}
                <div className="flex flex-col gap-1 mb-6">
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
                    {/* Daily Streak Card */}
                    <div 
                        onClick={() => navigate('/streak')}
                        className={`${cardClasses} rounded-xl sm:rounded-2xl p-2.5 sm:p-4 md:p-5 flex flex-col items-center justify-center gap-1.5 sm:gap-2 cursor-pointer hover:scale-[1.02] transition-transform`}
                    >
                        <span className="text-text-tertiary text-[10px] sm:text-xs md:text-sm font-medium whitespace-nowrap">Daily Streak</span>
                        <div className="flex items-center gap-1 sm:gap-1.5">
                            <Fire className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500" weight="fill" />
                            <span className={`text-xl sm:text-2xl md:text-3xl font-bold ${isDark ? 'text-orange-400' : 'text-orange-500'}`}>{streakCount}</span>
                        </div>
                        <span className="text-text-tertiary text-[10px] sm:text-xs md:text-sm font-medium">days</span>
                    </div>

                    {/* XP Today Card */}
                    <div className={`${cardClasses} rounded-xl sm:rounded-2xl p-2.5 sm:p-4 md:p-5 flex flex-col items-center justify-center gap-1.5 sm:gap-2`}>
                        <span className="text-text-tertiary text-[10px] sm:text-xs md:text-sm font-medium whitespace-nowrap">
                            XP Today
                            {multiplierActive && (
                                <Lightning className="inline-block ml-1 w-3 h-3 text-amber-400" weight="fill" />
                            )}
                        </span>
                        <div className="flex items-center gap-1 sm:gap-1.5">
                            <Sparkle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" weight="fill" />
                            <span className={`text-xl sm:text-2xl md:text-3xl font-bold ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>{estimatedXp}</span>
                        </div>
                        <span className="text-text-tertiary text-[10px] sm:text-xs md:text-sm font-medium whitespace-nowrap">gained</span>
                    </div>

                    {/* Study Quest Card */}
                    <div className={`${cardClasses} rounded-xl sm:rounded-2xl p-2.5 sm:p-4 md:p-5 flex flex-col items-center justify-center gap-1.5 sm:gap-2`}>
                        <span className="text-text-tertiary text-[10px] sm:text-xs md:text-sm font-medium whitespace-nowrap">Study Quest</span>
                        <div className="flex items-center gap-1 sm:gap-1.5">
                            <Scroll className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" weight="fill" />
                            <span className={`text-xl sm:text-2xl md:text-3xl font-bold whitespace-nowrap ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>1</span>
                        </div>
                        <span className="text-text-tertiary text-[10px] sm:text-xs md:text-sm font-medium text-center whitespace-nowrap">/ 3 completed</span>
                    </div>
                </div>

                {/* Level Progress Card */}
                <div className={`${cardClasses} rounded-xl sm:rounded-2xl p-4 sm:p-5 flex items-center gap-3 sm:gap-5`}>
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
                </div>

            </div>
        </div>
    );
}
