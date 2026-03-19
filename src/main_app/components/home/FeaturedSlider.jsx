import React, { useState, useRef, useEffect } from 'react';
import { useSwipeable } from 'react-swipeable';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ExamReminder from './ExamReminder';
import LastReadCard from './LastReadCard';

const FeaturedSlider = ({ lastReadBook }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const scrollRef = useRef(null);

    const slides = [
        { id: 'lastRead', component: <LastReadCard book={lastReadBook} /> },
        { id: 'exam', component: <ExamReminder /> }
    ].filter(s => (s.id === 'lastRead' && lastReadBook) || (s.id === 'exam'));

    const handleScroll = (e) => {
        const { scrollLeft, clientWidth } = e.target;
        if (clientWidth > 0) {
            const index = Math.round(scrollLeft / clientWidth);
            if (index !== currentIndex) {
                setCurrentIndex(index);
            }
        }
    };

    const scrollToSlide = (index) => {
        if (scrollRef.current) {
            const gap = 16; // gap-4 is 1rem (16px)
            const slideWidth = scrollRef.current.clientWidth;
            scrollRef.current.scrollTo({
                left: index * (slideWidth + gap),
                behavior: 'smooth'
            });
        }
    };

    const handlers = useSwipeable({
        onSwipedLeft: () => {
            if (currentIndex < slides.length - 1) {
                scrollToSlide(currentIndex + 1);
            }
        },
        onSwipedRight: () => {
            if (currentIndex > 0) {
                scrollToSlide(currentIndex - 1);
            }
        },
        preventDefaultTouchmoveEvent: true,
        trackMouse: false
    });

    return (
        <div className="w-full relative px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 group/slider" {...handlers}>
            {/* Desktop Navigation Arrows */}
            {slides.length > 1 && (
                <>
                    <button 
                        onClick={() => scrollToSlide(currentIndex - 1)}
                        className={`absolute left-0 lg:left-4 top-1/2 -translate-y-1/2 z-[100] p-2.5 rounded-full bg-bg-elevated border border-border-default text-text-primary shadow-2xl opacity-40 hover:opacity-100 transition-all duration-300 hover:bg-accent-primary hover:text-white hover:scale-110 hidden md:flex items-center justify-center ${currentIndex === 0 ? 'pointer-events-none !opacity-0' : ''}`}
                    >
                        <ChevronLeft size={20} strokeWidth={3} />
                    </button>
                    <button 
                        onClick={() => scrollToSlide(currentIndex + 1)}
                        className={`absolute right-0 lg:right-4 top-1/2 -translate-y-1/2 z-[100] p-2.5 rounded-full bg-bg-elevated border border-border-default text-text-primary shadow-2xl opacity-40 hover:opacity-100 transition-all duration-300 hover:bg-accent-primary hover:text-white hover:scale-110 hidden md:flex items-center justify-center ${currentIndex === slides.length - 1 ? 'pointer-events-none !opacity-0' : ''}`}
                    >
                        <ChevronRight size={20} strokeWidth={3} />
                    </button>
                </>
            )}

            <div 
                ref={scrollRef}
                onScroll={handleScroll}
                className="w-full flex overflow-x-auto snap-x snap-mandatory no-scrollbar scroll-smooth gap-4 h-full"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {slides.map((slide) => (
                    <div 
                        key={slide.id} 
                        className="w-full flex-shrink-0 snap-center"
                    >
                        <div className="w-full">
                            {slide.component}
                        </div>
                    </div>
                ))}
            </div>

            {/* Navigation Dots */}
            {slides.length > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                    {slides.map((_, i) => (
                        <button 
                            key={i}
                            onClick={() => scrollToSlide(i)}
                            className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                                i === currentIndex ? 'w-6 bg-accent-primary' : 'w-1.5 bg-border-default hover:bg-text-tertiary'
                            }`}
                            aria-label={`Go to slide ${i + 1}`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default FeaturedSlider;


