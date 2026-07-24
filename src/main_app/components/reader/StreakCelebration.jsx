import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Fire, Sparkle, X } from '@phosphor-icons/react';
import confetti from 'canvas-confetti';
import Card from '../ui/Card';
import useSettingsStore from '../../store/settingsStore';

const StreakCelebration = ({ streakCount, streakHistory = [], onClose, previewStyle }) => {
    const { streakCelebrationStyle = 'full' } = useSettingsStore();
    const effectiveStyle = previewStyle || streakCelebrationStyle;
    const isSubtle = effectiveStyle === 'subtle';
    const isPreview = !!previewStyle;

    const displayStreakCount = isPreview ? (streakCount || 7) : (streakCount || 0);

    const days = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
    const currentDay = new Date().getDay();

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

    useEffect(() => {
        if (!isSubtle) {
            // Fire confetti only for full-blown mode
            const duration = 2.5 * 1000;
            const animationEnd = Date.now() + duration;
            const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };
            const randomInRange = (min, max) => Math.random() * (max - min) + min;

            const interval = setInterval(function() {
                const timeLeft = animationEnd - Date.now();
                if (timeLeft <= 0) return clearInterval(interval);
                const particleCount = 50 * (timeLeft / duration);
                confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
                confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
            }, 250);

            // Auto close after 5 seconds (2.5s confetti + 2.5s viewing time)
            const timer = setTimeout(onClose, 5000);
            return () => {
                clearInterval(interval);
                clearTimeout(timer);
            };
        } else {
            // Subtle mode: no confetti, auto close after 5 seconds
            const timer = setTimeout(onClose, 5000);
            return () => clearTimeout(timer);
        }
    }, [isSubtle, onClose]);

    // ── Subtle Mode Pill Pop-Up ──
    if (isSubtle) {
        return (
            <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[250] pointer-events-none w-full px-4 sm:w-auto flex justify-center">
                <motion.div
                    initial={{ y: -60, opacity: 0, scale: 0.9 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    exit={{ y: -60, opacity: 0, scale: 0.9 }}
                    transition={{ type: "spring", damping: 20, stiffness: 200 }}
                    className="pointer-events-auto w-[88vw] max-w-sm sm:w-[320px]"
                >
                    <Card className="!rounded-full px-6 py-3 flex items-center justify-between gap-4 shadow-xl border border-black/10 dark:border-white/10 w-full">
                        {/* Fire Icon on Far Left */}
                        <div className="p-2 rounded-full bg-orange-500/10 text-orange-500 flex items-center justify-center shrink-0">
                            <Fire size={22} weight="fill" className="text-orange-500 fill-orange-500 animate-pulse" />
                        </div>

                        {/* Centered Text in between Fire and Dismiss Icon */}
                        <div className="flex-1 flex flex-col items-center justify-center text-center font-sans">
                            <div className="flex items-center justify-center gap-1.5 text-sm font-bold text-text-primary leading-tight">
                                <span className="text-orange-500 font-extrabold tabular-nums">{displayStreakCount}</span>
                                <span>{displayStreakCount === 1 ? 'Day Streak!' : 'Days Streak!'}</span>
                            </div>
                            <span className="text-[11px] text-text-tertiary font-normal leading-tight mt-0.5">Keep the Streak Burning</span>
                        </div>

                        {/* Cancel / Dismiss Icon on Far Right */}
                        <button
                            onClick={onClose}
                            className="p-1.5 rounded-full text-text-tertiary hover:text-text-primary hover:bg-black/5 dark:hover:bg-white/10 transition-colors shrink-0"
                            title="Dismiss"
                        >
                            <X size={16} weight="bold" />
                        </button>
                    </Card>
                </motion.div>
            </div>
        );
    }

    // ── Full-Blown Celebration Modal (Card UI) ──
    return (
        <div className="fixed inset-0 z-[250] flex justify-center pointer-events-none">
            <motion.div
                initial={{ y: -100, opacity: 0, scale: 0.8 }}
                animate={{ y: 100, opacity: 1, scale: 1 }}
                exit={{ y: -100, opacity: 0, scale: 0.8 }}
                transition={{ 
                    type: "spring", 
                    damping: 15, 
                    stiffness: 100,
                    duration: 0.6
                }}
                className="w-[90%] max-w-[320px] pointer-events-auto h-fit font-sans"
            >
                <Card className="p-6 relative overflow-hidden group shadow-2xl">
                    <div className="relative z-10 flex flex-col items-center gap-4">
                        {/* Top Close Button */}
                        <div className="flex justify-end w-full">
                            <button 
                                onClick={onClose}
                                className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-all text-text-secondary active:scale-90"
                            >
                                <X size={16} weight="bold" />
                            </button>
                        </div>

                        {/* Header */}
                        <div className="flex flex-col items-center">
                            <div className="flex items-center gap-2 mb-1">
                                <Sparkle size={16} weight="fill" className="text-orange-400 animate-pulse" />
                                <span className="text-sm font-bold text-orange-400 tracking-[0.3em] font-display">Streak Unlocked!</span>
                                <Sparkle size={16} weight="fill" className="text-orange-400 animate-pulse" />
                            </div>
                            
                            <div className="flex flex-col items-center mt-1">
                                <span className="text-5xl font-black text-text-primary tabular-nums tracking-tighter leading-none font-display">
                                    {displayStreakCount}
                                </span>
                                <span className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] mt-2">
                                    {displayStreakCount === 1 ? 'day streak' : 'days streak'}
                                </span>
                            </div>
                        </div>

                        {/* Small Weekly Calendar */}
                        <div className="flex justify-between w-full gap-1 pt-4 border-t border-black/10 dark:border-white/10">
                            {days.map((day, index) => {
                                const dayDate = getWeekDayDate(index);
                                // For preview state, mark all days as streak and put the today marker on the 7th day (index 6)
                                const isTodayMarker = isPreview ? (index === 6) : (index === currentDay);
                                const hasStreak = isPreview ? true : streakHistory.includes(dayDate);

                                return (
                                    <div key={day} className="flex flex-col items-center gap-1.5">
                                        <span className={`text-[8px] font-black uppercase tracking-wider ${isTodayMarker ? 'text-orange-500' : 'text-text-tertiary'}`}>
                                            {day}
                                        </span>
                                        <div className={`size-6 rounded-full flex items-center justify-center border transition-all duration-500 ${
                                            isTodayMarker 
                                                ? 'ring-2 ring-orange-500 ring-offset-2 ring-offset-bg-primary dark:ring-offset-bg-elevated scale-110 z-10' 
                                                : ''
                                        } ${
                                            hasStreak
                                                ? 'bg-orange-500 border-orange-500 text-white shadow-sm'
                                                : isTodayMarker
                                                ? 'bg-transparent border-orange-500 text-orange-500'
                                                : 'bg-bg-subtle/50 border-black/10 dark:border-white/10 text-text-tertiary/30'
                                        }`}>
                                            {hasStreak ? (
                                                <Fire size={10} weight="fill" className="fill-current" />
                                            ) : isTodayMarker ? (
                                                <div className="size-1 bg-orange-500 rounded-full" />
                                            ) : null}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </Card>
            </motion.div>
        </div>
    );
};

export default StreakCelebration;
