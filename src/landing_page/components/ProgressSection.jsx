import React, { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Flame, Trophy, ChartLineUp } from '@phosphor-icons/react';

gsap.registerPlugin(ScrollTrigger);

function ProgressSection() {
    const sectionRef = useRef(null);

    useGSAP(() => {
        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: sectionRef.current,
                start: "top 70%",
                toggleActions: "play none none reverse"
            }
        });

        tl.fromTo(".progress-header", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.8, ease: "apple" })
          .fromTo(".stat-card", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.15, ease: "apple" }, "-=0.4")
          .fromTo(".xp-fill-animate", { width: "0%" }, { width: "65%", duration: 1.5, ease: "spring" }, "-=0.2");
    }, { scope: sectionRef });

    return (
        <section ref={sectionRef} id="progress-section" className='w-full py-24 md:py-32 relative bg-surface-card border-y border-border-default/5'>
            <div className='max-w-[1200px] mx-auto px-6'>
                
                {/* Header */}
                <div className='progress-header text-center max-w-2xl mx-auto mb-16'>
                    <div className="aura-label mb-2">Analytics</div>
                    <h2 className='text-4xl md:text-5xl font-display font-bold leading-tight text-text-primary mb-6'>
                        See your learning compound.
                    </h2>
                    <p className='text-lg text-text-secondary leading-relaxed font-sans'>
                        Every page read, question answered, and concept mastered contributes to your overall progression. Build momentum that lasts.
                    </p>
                </div>

                {/* Dashboard Stats Mockup */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    
                    {/* Rank Card */}
                    <div className="stat-card aura-card p-6 md:p-8 bg-surface-base border border-border-default/5 shadow-aura-sm flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 rounded-full flex items-center justify-center bg-surface-raised mb-4 shadow-inner">
                            <Trophy size={32} className="text-[#60A5FA]" weight="fill" />
                        </div>
                        <span className="text-text-tertiary text-sm font-medium uppercase tracking-wider mb-1">Current Rank</span>
                        <h3 className="text-2xl font-display font-semibold text-text-primary mb-6">Sophomore</h3>
                        
                        <div className="w-full">
                            <div className="flex justify-between text-xs font-medium text-text-secondary mb-2">
                                <span>2,450 XP</span>
                                <span>Next: Junior</span>
                            </div>
                            <div className="aura-xp-track w-full bg-surface-raised h-2 rounded-full overflow-hidden">
                                <div className="xp-fill-animate h-full bg-[#60A5FA] rounded-full"></div>
                            </div>
                        </div>
                    </div>

                    {/* Streak Card */}
                    <div className="stat-card aura-card p-6 md:p-8 bg-surface-base border border-border-default/5 shadow-aura-sm flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 rounded-full flex items-center justify-center bg-surface-raised mb-4 shadow-inner">
                            <Flame size={32} className="text-[#F97316]" weight="fill" />
                        </div>
                        <span className="text-text-tertiary text-sm font-medium uppercase tracking-wider mb-1">Study Streak</span>
                        <h3 className="text-4xl font-display font-bold text-text-primary mb-2">14 <span className="text-2xl text-text-secondary font-medium">days</span></h3>
                        <p className="text-sm text-text-secondary">You're in the top 15% of active students this week.</p>
                    </div>

                    {/* Mastery Card */}
                    <div className="stat-card aura-card p-6 md:p-8 bg-surface-base border border-border-default/5 shadow-aura-sm flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 rounded-full flex items-center justify-center bg-surface-raised mb-4 shadow-inner">
                            <ChartLineUp size={32} className="text-brand-light" weight="fill" />
                        </div>
                        <span className="text-text-tertiary text-sm font-medium uppercase tracking-wider mb-1">Concepts Mastered</span>
                        <h3 className="text-4xl font-display font-bold text-text-primary mb-2">42</h3>
                        <p className="text-sm text-text-secondary">Across Biology, Psychology, and History.</p>
                    </div>

                </div>
            </div>
        </section>
    );
}

export default ProgressSection;
