import { Plus, Minus } from '@phosphor-icons/react';
import { useState, useRef } from "react";
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

function FAQ() {
    const accordionItems = [
        { id: 0, question: "Why isn't Apex just another AI app?", answer: "Because Apex isn't about more tools. It's about fewer distractions. We use AI not to do the work for you, but to clarify the material so you can understand it deeply." },
        { id: 1, question: "What is Apex?", answer: "Apex is a focused learning platform that keeps everything you need in one place—instant explanations, dictionary lookups, and active recall practice. No more tab switching, just studying." },
        { id: 2, question: "Is Apex free to use?", answer: "Yes. Apex offers a free plan with core reading features. We also have premium plans for advanced AI interactions, unlimited quizzes, and deeper analytics." },
        { id: 3, question: "What file formats can I upload?", answer: "Currently, you can upload PDFs and paste text directly into Apex. Support for ePub and Word documents is coming soon." },
        { id: 4, question: "Does the AI require internet?", answer: "Yes, our contextual AI requires an active internet connection to process complex explanations. However, you can read your uploaded documents and review highlights offline." },
        { id: 5, question: "Can I use Apex for exam preparation?", answer: "Absolutely. Apex is designed for ambitious students preparing for university exams, WAEC, JAMB, and more. It helps you digest dense material faster." }
    ];

    const [activeId, setActiveId] = useState(null);
    const sectionRef = useRef(null);

    const toggleAccordion = (id) => {
        setActiveId((currentId) => currentId === id ? null : id);
    };

    useGSAP(() => {
        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: sectionRef.current,
                start: "top 75%",
                toggleActions: "play none none reverse"
            }
        });

        tl.fromTo(".faq-heading", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.8, ease: "apple" })
          .fromTo(".faq-item", { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: "apple" }, "-=0.4");
    }, { scope: sectionRef });

    return (
        <section ref={sectionRef} className='w-full py-24 md:py-32 relative bg-surface-base border-t border-border-default/5' id="faq" aria-labelledby="faq-heading">
            <div className='max-w-[800px] mx-auto px-6'>
                <div className="text-center mb-16 md:mb-24">
                    <div className="aura-label mb-2">Details</div>
                    <h2 id="faq-heading" className="faq-heading text-4xl md:text-5xl font-display font-bold leading-tight text-text-primary">
                        Frequently Asked Questions
                    </h2>
                </div>
                
                <div className="flex flex-col border-t border-border-default/10">
                    {accordionItems.map((item) => (
                        <article className='faq-item border-b border-border-default/10' key={item.id}>
                            <button 
                                className='w-full flex justify-between items-center py-6 md:py-8 text-left group focus:outline-none' 
                                onClick={() => toggleAccordion(item.id)}
                                aria-expanded={activeId === item.id}
                                aria-controls={`faq-answer-${item.id}`}
                            >
                                <h3 className="font-display font-medium text-lg md:text-xl text-text-primary group-hover:text-brand transition-colors duration-300 pr-8">
                                    {item.question}
                                </h3>
                                <div className="shrink-0 text-text-tertiary group-hover:text-brand transition-colors duration-300">
                                    {activeId === item.id ? (
                                        <Minus size={24} weight="regular" />
                                    ) : (
                                        <Plus size={24} weight="regular" />
                                    )}
                                </div>
                            </button>
                            
                            <div 
                                id={`faq-answer-${item.id}`}
                                className={`overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${activeId === item.id ? "max-h-[500px] opacity-100 pb-8" : "max-h-0 opacity-0 pb-0"}`}
                                role="region"
                                aria-labelledby={`faq-question-${item.id}`}
                            >
                                <p className="text-lg text-text-secondary leading-relaxed font-sans max-w-[90%]">
                                    {item.answer}
                                </p>
                            </div>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
}

export default FAQ;