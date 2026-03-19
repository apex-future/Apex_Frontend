import React, { useState, useRef, useEffect } from 'react';
import { useSwipeable } from 'react-swipeable';
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
        const index = Math.round(scrollLeft / clientWidth);
        setCurrentIndex(index);
    };

    const handlers = useSwipeable({
        onSwipedLeft: () => {
            if (currentIndex < slides.length - 1) {
                scrollRef.current.scrollTo({
                    left: (currentIndex + 1) * scrollRef.current.clientWidth,
                    behavior: 'smooth'
                });
            }
        },
        onSwipedRight: () => {
            if (currentIndex > 0) {
                scrollRef.current.scrollTo({
                    left: (currentIndex - 1) * scrollRef.current.clientWidth,
                    behavior: 'smooth'
                });
            }
        },
        preventDefaultTouchmoveEvent: true,
        trackMouse: true
    });

    return (
        <div className="w-full relative px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16" {...handlers}>
            <div 
                ref={scrollRef}
                onScroll={handleScroll}
                className="w-full flex overflow-x-auto snap-x snap-mandatory no-scrollbar scroll-smooth gap-4 h-full"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {slides.map((slide, index) => (
                    <div 
                        key={slide.id} 
                        className="w-full flex-shrink-0 snap-center"
                    >
                        {slide.id === 'exam' ? (
                            /* Wrap ExamReminder to remove its default padding and make it look consistent */
                            <div className="w-full">
                                {slide.component}
                            </div>
                        ) : (
                            <div className="w-full">
                                {slide.component}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Navigation Dots */}
            {slides.length > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                    {slides.map((_, i) => (
                        <div 
                            key={i}
                            className={`h-1.5 rounded-full transition-all duration-300 ${
                                i === currentIndex ? 'w-6 bg-accent-primary' : 'w-1.5 bg-border-default'
                            }`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default FeaturedSlider;
