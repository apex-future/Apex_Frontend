import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Fire, Sparkle, X } from '@phosphor-icons/react';
import confetti from 'canvas-confetti';

const StreakCelebration = ({ streakCount, streakHistory, onClose }) => {
    const [isAlertEnabled, setIsAlertEnabled] = React.useState(true);
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
        // Fire confetti
        const duration = 2.5 * 1000;
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

        // Auto close after 5 seconds (2.5s confetti + 2.5s viewing time)
        const timer = setTimeout(onClose, 5000);

        return () => {
            clearInterval(interval);
            clearTimeout(timer);
        };
    }, [onClose]);

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
                <div className="bg-card-glass backdrop-blur-lg rounded-card p-6 border-t border-b border-white/50 shadow-md relative overflow-hidden group">
                    
                    {/* Background Ambient Glow */}
                    {/* <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-orange-500/20 transition-all duration-1000" />
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-orange-500/5 rounded-full blur-2xl -ml-12 -mb-12 group-hover:bg-orange-500/10 transition-all duration-1000" /> */}

                    <div className="relative z-10 flex flex-col items-center gap-4">
                        {/* Top Control Row */}
                        <div className="flex justify-between items-center w-[calc(100%+1rem)] -mx-2 px-3 py-1.5 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl mb-2">
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={() => setIsAlertEnabled(!isAlertEnabled)}
                                    className={`group relative w-7 h-4 rounded-full transition-all duration-300 ${isAlertEnabled ? 'bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.4)]' : 'bg-text-tertiary/20'}`}
                                >
                                    <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-all duration-300 ${isAlertEnabled ? 'translate-x-3' : 'translate-x-0'}`} />
                                </button>
                                <span className={`text-[7px] font-black uppercase tracking-[0.2em] transition-colors ${isAlertEnabled ? 'text-orange-500' : 'text-text-tertiary'}`}>
                                    {isAlertEnabled ? 'Alerts On' : 'Alerts Off'}
                                </span>
                            </div>
                            <button 
                                onClick={onClose}
                                className="p-1.5 rounded-lg hover:bg-white/10 transition-all text-text-secondary active:scale-90"
                            >
                                <X size={14} weight="bold" />
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
                                    {streakCount}
                                </span>
                                <span className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] mt-2">
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
                                        <span className={`text-[8px] font-bold uppercase tracking-wider ${isToday ? 'text-orange-500' : 'text-text-primary/60'}`}>
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
                                                <Fire size={10} weight="fill" className="fill-current" />
                                            ) : isToday ? (
                                                <div className="size-1 bg-orange-500 rounded-full" />
                                            ) : null}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default StreakCelebration;
