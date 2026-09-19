import React, { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { CheckCircle, Circle } from '@phosphor-icons/react';

gsap.registerPlugin(ScrollTrigger);

function PracticeSection() {
    const sectionRef = useRef(null);

    useGSAP(() => {
        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: sectionRef.current,
                start: "top 70%",
                toggleActions: "play none none reverse"
            }
        });

        tl.fromTo(".practice-header", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.8, ease: "apple" })
          .fromTo(".quiz-ui", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.8, ease: "spring" }, "-=0.4")
          .fromTo(".quiz-option", { opacity: 0, x: -10 }, { opacity: 1, x: 0, duration: 0.4, stagger: 0.1, ease: "apple" }, "-=0.2");
    }, { scope: sectionRef });

    return (
        <section ref={sectionRef} id="practice-section" className='w-full py-24 md:py-32 relative bg-surface-base'>
            <div className='max-w-[1200px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center'>
                
                {/* Left Side: Text */}
                <div className='practice-header flex flex-col gap-6'>
                    <div className="aura-label mb-2">Active Recall</div>
                    <h2 className='text-4xl md:text-5xl font-display font-bold leading-tight text-text-primary'>
                        Understanding is <br/>only half the job.
                    </h2>
                    <p className='text-lg text-text-secondary leading-relaxed font-sans max-w-md'>
                        Reading makes you feel like you know it. Answering questions proves it. Apex generates practice quizzes directly from the chapters you just read.
                    </p>
                    
                    <div className="flex items-center gap-3 mt-4 text-sm font-medium uppercase tracking-widest text-text-tertiary">
                        <span>Read</span>
                        <span className="text-brand">→</span>
                        <span>Understand</span>
                        <span className="text-brand">→</span>
                        <span className="text-text-primary">Practice</span>
                    </div>
                </div>

                {/* Right Side: Quiz UI Mockup */}
                <div className='quiz-ui w-full'>
                    <div className="aura-card p-6 md:p-8 bg-surface-card border border-border-default/5 shadow-aura-md rounded-[2rem]">
                        
                        {/* Quiz Header */}
                        <div className="flex justify-between items-center mb-8 border-b border-border-default/5 pb-4">
                            <span className="text-sm font-medium text-text-tertiary uppercase tracking-wider">Question 3 of 10</span>
                            <span className="text-sm font-medium text-brand bg-brand/10 px-3 py-1 rounded-full">Chapter 4 Review</span>
                        </div>

                        {/* Question */}
                        <h3 className="text-xl md:text-2xl font-medium text-text-primary mb-8 leading-snug">
                            Which of the following best describes the role of the myelin sheath in the nervous system?
                        </h3>

                        {/* Options */}
                        <div className="flex flex-col gap-4">
                            <div className="quiz-option p-4 rounded-xl border border-border-default/10 bg-surface-base flex items-start gap-4 opacity-50 cursor-not-allowed">
                                <Circle size={24} className="text-text-placeholder shrink-0 mt-0.5" />
                                <span className="text-text-secondary">It produces neurotransmitters for synaptic transmission.</span>
                            </div>
                            
                            {/* Correct/Selected Option */}
                            <div className="quiz-option p-4 rounded-xl border-2 border-brand bg-brand/5 flex items-start gap-4">
                                <CheckCircle size={24} className="text-brand shrink-0 mt-0.5" weight="fill" />
                                <span className="text-text-primary font-medium">It insulates the axon and increases the speed of neural impulses.</span>
                            </div>

                            <div className="quiz-option p-4 rounded-xl border border-border-default/10 bg-surface-base flex items-start gap-4 opacity-50 cursor-not-allowed">
                                <Circle size={24} className="text-text-placeholder shrink-0 mt-0.5" />
                                <span className="text-text-secondary">It receives incoming signals from other neurons.</span>
                            </div>
                        </div>

                        {/* Explanation (simulating post-answer state) */}
                        <div className="mt-8 p-5 rounded-xl bg-surface-sunken border border-border-default/5">
                            <h4 className="text-sm font-display font-semibold text-text-primary mb-2">Why this is correct</h4>
                            <p className="text-sm text-text-secondary leading-relaxed">
                                As covered on page 114, myelin acts as an electrical insulator, allowing action potentials to "jump" along the nodes of Ranvier, significantly speeding up transmission.
                            </p>
                        </div>

                    </div>
                </div>

            </div>
        </section>
    );
}

export default PracticeSection;
