import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

const StreakCelebration = ({ streakCount, streakHistory, onClose }) => {
    const days = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
    const currentDay = new Date().getDay();

    const getWeekDayDate = (dayIndex) => {
        const now = new Date();
        const currentDayOfWeek = now.getDay();
        const diff = dayIndex - currentDayOfWeek;
        const date = new Date(now);
        date.setDate(now.getDate() + diff);
        return date.toLocaleDateString('en-CA');
    };

    useEffect(() => {
        // Fire confetti
        const duration = 3 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

        const randomInRange = (min, max) => Math.random() * (max - min) + min;

        const interval = setInterval(function() {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);
            // since particles fall down, start a bit higher than random
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
        }, 250);

        // Auto close after 6 seconds (3s confetti + 3s viewing time)
        const timer = setTimeout(onClose, 6000);

        return () => {
            clearInterval(interval);
            clearTimeout(timer);
        };
    }, [onClose]);

    return (
        <motion.div
            initial={{ y: -100, opacity: 0, scale: 0.8 }}
            animate={{ y: 20, opacity: 1, scale: 1 }}
            exit={{ y: -100, opacity: 0, scale: 0.8 }}
            transition={{ 
                type: "spring", 
                damping: 15, 
                stiffness: 100,
                duration: 0.6
            }}
            className="fixed top-0 left-1/2 -translate-x-1/2 z-[250] w-[90%] max-w-[320px] pointer-events-auto"
        >
            <div className="bg-card-glass backdrop-blur-2xl rounded-[2rem] p-6 border-2 border-orange-500/30 shadow-[0_20px_50px_rgba(249,115,22,0.2)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] relative overflow-hidden group">
                
                {/* Background Ambient Glow */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-orange-500/20 transition-all duration-1000" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-orange-500/5 rounded-full blur-2xl -ml-12 -mb-12 group-hover:bg-orange-500/10 transition-all duration-1000" />

                <div className="relative z-10 flex flex-col items-center gap-4">
                    {/* Header */}
                    <div className="flex flex-col items-center">
                        <div className="flex items-center gap-2 mb-1">
                            <Sparkles size={16} className="text-orange-500 animate-pulse" />
                            <span className="text-[10px] font-black text-orange-500 uppercase tracking-[0.3em]">Streak Unlocked!</span>
                            <Sparkles size={16} className="text-orange-500 animate-pulse" />
                        </div>
                        
                        <div className="flex flex-col items-center mt-1">
                            <span className="text-5xl font-black text-text-primary tabular-nums tracking-tighter leading-none">
                                {streakCount}
                            </span>
                            <span className="text-[10px] font-black text-text-tertiary uppercase tracking-[0.2em] mt-1">
                                days streak
                            </span>
                        </div>
                    </div>

                    {/* Small Weekly Calendar (Cropped) */}
                    <div className="flex justify-between w-full gap-1 pt-4 border-t border-border-default/50">
                        {days.map((day, index) => {
                            const dayDate = getWeekDayDate(index);
                            const isToday = index === currentDay;
                            const hasStreak = streakHistory.includes(dayDate);

                            return (
                                <div key={day} className="flex flex-col items-center gap-1.5">
                                    <span className={`text-[8px] font-bold uppercase tracking-wider ${isToday ? 'text-orange-500' : 'text-text-tertiary/60'}`}>
                                        {day}
                                    </span>
                                    <div className={`size-6 rounded-full flex items-center justify-center border transition-all duration-500 ${
                                        hasStreak
                                            ? isToday
                                              ? 'bg-orange-500 border-orange-500 text-white shadow-[0_0_8px_rgba(249,115,22,0.4)] scale-110'
                                              : 'bg-orange-500 border-orange-500 text-white opacity-80'
                                            : isToday
                                            ? 'bg-transparent border-orange-500 text-orange-500'
                                            : 'bg-bg-subtle/50 border-border-default/50 text-text-tertiary/30'
                                    }`}>
                                        {hasStreak ? (
                                            <Flame size={10} className="fill-current" />
                                        ) : isToday ? (
                                            <div className="size-1 bg-orange-500 rounded-full" />
                                        ) : null}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Close handle (Subtle) */}
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 text-text-tertiary/40 hover:text-text-primary transition-colors"
                >
                    <X size={16} />
                </button>
            </div>
        </motion.div>
    );
};

export default StreakCelebration;
