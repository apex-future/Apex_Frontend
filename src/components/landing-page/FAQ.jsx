import React, { useState } from "react"
import { Plus } from 'lucide-react'
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

function FAQ() {
    let accordionItems = [
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
        gsap.from(".FAQ-wrapper article", {
            scrollTrigger: {
                trigger: ".FAQ-wrapper",
                start: "top 85%",
                toggleActions: "play none none reverse"
            },
            y: 30,
            opacity: 0,
            duration: 0.6,
            stagger: 0.1,
            ease: "power2.out"
        });
    }, []);

    return (
        <section className='faq pt-14 md:pt-20 ' id="faq">
            <h2 className="FAQ-heading text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold font-display p-2 px-4  text-center">
                Frequently Asked Questions
            </h2>
            <div className="FAQ-wrapper w-[80%] mx-auto mt-5 grid grid-cols-1 gap-3">
                {accordionItems.map((item) => (
                    <article className='flex flex-col p-3 rounded-2xl divide-y divide-black/5 gap-3 bg-white/50 backdrop-blur-md shadow-xl border border-border-default/50 hover:bg-white/80 transition-all duration-300' key={item.id}>
                        <div className='flex justify-between items-center cursor-pointer' onClick={() => { toggleAccordion(item.id) }}>
                            <h5 className="FAQ-question font-display font-bold text-lg sm:text-xl text-text-primary">{item.question}</h5>
                            <button className="p-2 rounded-full hover:bg-neutral-100 transition-colors">
                                <Plus className={`transition-all duration-500 transform ${activeId === item.id ? "rotate-45 text-accent-primary" : "text-text-tertiary"}`} size={24} />
                            </button>
                        </div>
                        <div className={`FAQ-answer overflow-hidden transition-all duration-500 ease-in-out ${activeId === item.id ? "max-h-96 py-4 opacity-100" : "max-h-0 py-0 opacity-0"}`}>
                            <p className="text-base text-text-secondary leading-relaxed font-medium">{item.answer}</p>
                        </div>
                    </article>
                ))}
            </div>
        </section>
    )
}

export default FAQ