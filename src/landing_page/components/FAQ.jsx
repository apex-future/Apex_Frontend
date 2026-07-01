import { Plus } from '@phosphor-icons/react'
import { useState } from "react"
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

function FAQ() {
    let accordionItems = [
        { id: 0, question: "Why isn’t Apex just another AI app?", answer: "Because Apex isn’t about more tools. It’s about fewer distractions." },
        { id: 1, question: "What Is Apex?", answer: " Apex is an AI-powered reading platform that keeps everything you need in one place—instant explanations, dictionary lookups, and curated videos. No more tab switching, just focused studying." },
        { id: 2, question: "Is Apex free to use?", answer: "Yes! Apex offers a free plan with core features. We also have premium plans with advanced tools like extra credits etc." },
        { id: 3, question: "What file formats can I upload?", answer: "You can upload PDFs and paste text directly into Apex. We're working on adding support for more formats like ePub and Word documents soon." },
        { id: 4, question: "Does the AI explanation feature require internet?", answer: "Yes, AI explanations need an internet connection. However, you can read your uploaded documents and access saved highlights offline." },
        { id: 5, question: "Can I use Apex for exam preparation?", answer: "Absolutely! Apex is designed for students preparing for JAMB, WAEC, university exams, and more. You can read materials, get AI help, and (coming soon) practice with real exam questions." }]

    let [activeId, setActiveId] = useState(null);
    let toggleAccordion = (id) => {
        setActiveId((currentId) => currentId === id ? null : id)
    }

    useGSAP(() => {
        gsap.fromTo(".FAQ-wrapper article", 
            {
                x: (i) => i % 2 === 0 ? -100 : 100, // More dramatic side entry
                y: 20, // Add slight vertical movement for better "arrival" feel
                opacity: 0,
            },
            {
                scrollTrigger: {
                    trigger: ".FAQ-wrapper",
                    start: "top 90%", // Trigger slightly later for better visibility
                    toggleActions: "play none none reverse",
                },
                x: 0,
                y: 0,
                opacity: 1,
                duration: 1, // Slower duration for more premium feel
                stagger: {
                    amount: 0.8, // Total time for all items to start
                    from: "start"
                },
                ease: "back.out(1.2)", // Slightly less extreme bounce for elegance
                immediateRender: false
            }
        );
    }, []);

    return (
        <section className='faq pt-16 md:pt-24 ' id="faq" aria-labelledby="faq-heading">
            <h2 id="faq-heading" className="FAQ-heading text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold font-display p-2 px-4  text-center">
                Frequently Asked Questions
            </h2>
            <div className="FAQ-wrapper w-[80%] mx-auto mt-8 grid grid-cols-1 gap-4">
                {accordionItems.map((item) => (
                    <article className='flex flex-col p-4 rounded-2xl divide-y divide-black/5 gap-4 bg-white/50 backdrop-blur-md shadow-sm border border-border-default/50 hover:bg-white/80 transition-all duration-300' key={item.id}>
                        <div 
                            className='flex justify-between items-center cursor-pointer group' 
                            onClick={() => { toggleAccordion(item.id) }}
                            role="button"
                            aria-expanded={activeId === item.id}
                            aria-controls={`faq-answer-${item.id}`}
                            tabIndex={0}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    toggleAccordion(item.id);
                                }
                            }}
                        >
                            <h3 className="FAQ-question font-display font-bold text-lg sm:text-xl text-text-primary">{item.question}</h3>
                            <div className="p-2 rounded-full hover:bg-neutral-100 transition-colors" aria-hidden="true">
                                <Plus className={`transition-all duration-500 transform ${activeId === item.id ? "rotate-45 text-accent-primary" : "text-text-tertiary"}`} size={24} weight="bold" />
                            </div>
                        </div>
                        <div 
                            id={`faq-answer-${item.id}`}
                            className={`FAQ-answer overflow-hidden transition-all duration-500 ease-in-out ${activeId === item.id ? "max-h-96 py-4 opacity-100" : "max-h-0 py-0 opacity-0"}`}
                            role="region"
                            aria-labelledby={`faq-question-${item.id}`}
                        >
                            <p className="text-base text-text-secondary leading-relaxed font-medium">
                                {item.answer}
                            </p>
                        </div>
                    </article>
                ))}
            </div>
        </section>
    )
}

export default FAQ