import React, { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Sparkle } from '@phosphor-icons/react';

gsap.registerPlugin(ScrollTrigger);

function CleoSection() {
    const sectionRef = useRef(null);

    useGSAP(() => {
        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: sectionRef.current,
                start: "top 75%",
                toggleActions: "play none none reverse"
            }
        });

        tl.fromTo(".cleo-header", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.8, ease: "apple" })
          .fromTo(".chat-bubble-user", { opacity: 0, scale: 0.95, x: 20 }, { opacity: 1, scale: 1, x: 0, duration: 0.6, ease: "apple" }, "-=0.4")
          .fromTo(".cleo-typing", { opacity: 0 }, { opacity: 1, duration: 0.4 }, "+=0.2")
          .to(".cleo-typing", { opacity: 0, duration: 0.2, delay: 0.6 })
          .fromTo(".chat-bubble-cleo", { opacity: 0, scale: 0.95, x: -20 }, { opacity: 1, scale: 1, x: 0, duration: 0.6, ease: "apple" }, "-=0.1")
          .fromTo(".chat-context", { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.6, ease: "apple" }, "-=0.2");

    }, { scope: sectionRef });

    return (
        <section ref={sectionRef} id="cleo-section" className='w-full py-24 md:py-32 relative bg-surface-card overflow-hidden border-t border-border-default/5'>
            {/* Ambient background for Cleo */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-subtle rounded-full blur-[100px] opacity-30 pointer-events-none" aria-hidden="true" />

            <div className='max-w-[1000px] mx-auto px-6 relative z-10'>
                <div className='cleo-header text-center mb-16 md:mb-24 flex flex-col items-center'>
                    <div className="inline-flex items-center justify-center p-4 bg-surface-raised rounded-full mb-6 shadow-aura-sm border border-border-default/5">
                        <Sparkle size={32} className="text-brand-light" weight="fill" />
                    </div>
                    <h2 className='text-4xl md:text-5xl lg:text-6xl font-display font-bold leading-tight text-text-primary mb-6'>
                        Meet Cleo.
                    </h2>
                    <p className='text-lg md:text-xl text-text-secondary leading-relaxed max-w-2xl mx-auto font-sans'>
                        An AI study companion that actually understands what you're studying. No more copy-pasting paragraphs.
                    </p>
                </div>

                {/* Simulated Chat UI */}
                <div className='max-w-[700px] mx-auto flex flex-col gap-6 font-sans'>
                    
                    {/* User Message */}
                    <div className='chat-bubble-user self-end max-w-[85%] sm:max-w-[70%] bg-brand text-white p-5 rounded-2xl rounded-tr-sm shadow-aura-sm'>
                        <p className="text-[15px] sm:text-base leading-relaxed">
                            Can you explain this concept of "Action Potentials" simply? I don't get the depolarization part.
                        </p>
                    </div>

                    {/* Typing Indicator */}
                    <div className='cleo-typing self-start flex gap-1.5 p-4 bg-surface-raised rounded-2xl rounded-tl-sm w-fit'>
                        <div className="w-2 h-2 rounded-full bg-text-tertiary animate-bounce"></div>
                        <div className="w-2 h-2 rounded-full bg-text-tertiary animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 rounded-full bg-text-tertiary animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>

                    {/* Cleo Response */}
                    <div className='chat-bubble-cleo self-start max-w-[90%] sm:max-w-[80%] flex flex-col gap-3'>
                        <div className='bg-surface-raised border border-border-default/5 text-text-primary p-5 sm:p-6 rounded-2xl rounded-tl-sm shadow-aura-sm'>
                            <p className="text-[15px] sm:text-base leading-relaxed mb-4">
                                Think of the neuron's membrane like a dam holding back water. 
                            </p>
                            <p className="text-[15px] sm:text-base leading-relaxed mb-4">
                                Right now, in paragraph 3 of your text, it mentions the "resting potential" is -70mV. That's the dam holding back the positive sodium ions (Na+).
                            </p>
                            <p className="text-[15px] sm:text-base leading-relaxed">
                                <strong>Depolarization</strong> happens when the dam gates open. The positive sodium ions rush in, and the inside of the cell suddenly becomes positive (+40mV). It's the spark that fires the signal.
                            </p>
                        </div>
                        
                        {/* Context indicator */}
                        <div className='chat-context flex items-center gap-2 px-2 text-xs font-medium text-text-tertiary uppercase tracking-wider'>
                            <div className="w-1.5 h-1.5 rounded-full bg-brand-light"></div>
                            Referencing: Chapter 4, Page 112
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
}

export default CleoSection;
