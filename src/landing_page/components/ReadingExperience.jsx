import React, { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { BookOpenText, CursorText, Translate, Brain } from '@phosphor-icons/react';

// Using the provided assets
import highlightingImg from "../../assets/reading-highlight-v2.png";
import dictionaryImg from "../../assets/dictionary.jpg";
import askAiImg from "../../assets/ask-apex-ai.jpg";

gsap.registerPlugin(ScrollTrigger);

function ReadingExperience() {
    const containerRef = useRef(null);

    useGSAP(() => {
        // Fade in features as they scroll into view
        const features = gsap.utils.toArray('.feature-block');
        features.forEach((feature) => {
            gsap.fromTo(feature, 
                { opacity: 0, y: 30 },
                { 
                    opacity: 1, 
                    y: 0, 
                    duration: 0.8, 
                    ease: "apple",
                    scrollTrigger: {
                        trigger: feature,
                        start: "top 80%",
                        toggleActions: "play none none reverse"
                    }
                }
            );
        });
    }, { scope: containerRef });

    return (
        <section ref={containerRef} id="reading-experience" className='w-full py-24 md:py-32 relative bg-surface-base'>
            <div className='max-w-[1200px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-24 items-start'>
                
                {/* Left Column: Sticky Narrative */}
                <div className='lg:col-span-5 lg:sticky lg:top-32 flex flex-col gap-6 z-10'>
                    <div className="aura-label mb-2">The Core Experience</div>
                    <h2 className='text-4xl md:text-5xl lg:text-6xl font-display font-bold leading-tight text-text-primary tracking-tight'>
                        Your book, finally built for understanding.
                    </h2>
                    <p className='text-lg text-text-secondary leading-relaxed font-sans max-w-md'>
                        We didn't just build an AI tool. We rebuilt the reading experience itself. Everything you need to comprehend complex material is built directly into the text.
                    </p>
                </div>

                {/* Right Column: Features / UI Scroller */}
                <div className='lg:col-span-7 flex flex-col gap-24 mt-12 lg:mt-0'>
                    
                    {/* Feature 1: Highlighting & Notes */}
                    <div className='feature-block flex flex-col gap-6'>
                        <div className="flex items-center gap-4 text-text-primary">
                            <div className="p-3 bg-surface-raised rounded-xl">
                                <CursorText size={24} className="text-brand-light" weight="duotone" />
                            </div>
                            <h3 className="text-2xl font-display font-semibold">Highlight & Capture</h3>
                        </div>
                        <div className="aura-card p-2 overflow-hidden bg-surface-card border-border-default/5">
                            <img src={highlightingImg} alt="Highlighting text in Apex" className="w-full rounded-xl object-cover shadow-aura-sm border border-border-default/10" />
                        </div>
                        <p className="text-text-secondary">
                            Select any text to instantly save it. Build your personal study guide organically as you read, without breaking your flow to type in another app.
                        </p>
                    </div>

                    {/* Feature 2: Contextual Explanations / AI */}
                    <div className='feature-block flex flex-col gap-6'>
                        <div className="flex items-center gap-4 text-text-primary">
                            <div className="p-3 bg-surface-raised rounded-xl">
                                <Brain size={24} className="text-brand-light" weight="duotone" />
                            </div>
                            <h3 className="text-2xl font-display font-semibold">Understand instantly</h3>
                        </div>
                        <div className="aura-card p-2 overflow-hidden bg-surface-card border-border-default/5">
                            <img src={askAiImg} alt="Asking Apex AI for an explanation" className="w-full rounded-xl object-cover shadow-aura-sm border border-border-default/10" />
                        </div>
                        <p className="text-text-secondary">
                            Stuck on a paragraph? Ask for a breakdown. Apex reads exactly what you're reading and explains it in context, keeping you immersed in the material.
                        </p>
                    </div>

                    {/* Feature 3: Dictionary */}
                    <div className='feature-block flex flex-col gap-6'>
                        <div className="flex items-center gap-4 text-text-primary">
                            <div className="p-3 bg-surface-raised rounded-xl">
                                <Translate size={24} className="text-brand-light" weight="duotone" />
                            </div>
                            <h3 className="text-2xl font-display font-semibold">Built-in Dictionary</h3>
                        </div>
                        <div className="aura-card p-2 overflow-hidden bg-surface-card border-border-default/5">
                            <img src={dictionaryImg} alt="Using the built-in dictionary in Apex" className="w-full rounded-xl object-cover shadow-aura-sm border border-border-default/10" />
                        </div>
                        <p className="text-text-secondary">
                            Look up definitions instantly. No app switching, no new tabs, no breaking your concentration. Just seamless understanding.
                        </p>
                    </div>

                </div>

            </div>
        </section>
    );
}

export default ReadingExperience;
