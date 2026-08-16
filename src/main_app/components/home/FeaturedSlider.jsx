import React, { useState, useRef, useEffect } from 'react';
import ExamReminder from './ExamReminder';
import LastReadCard from './LastReadCard';

const FeaturedSlider = ({ lastReadBook, isLoading }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLarge, setIsLarge] = useState(window.innerWidth >= 1024);
  const scrollRef = useRef(null);

  // Watch for window resize to handle the grouping switch
  useEffect(() => {
    const handleResize = () => setIsLarge(window.innerWidth >= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Slide definition based on screen size (60/40 ratio on desktop)
  const slides = isLarge
    ? [
        {
          id: 'combined',
          component: (
            <div className="grid grid-cols-5 gap-4 md:gap-6 w-full items-stretch">
              <div className="col-span-3 w-full h-full flex flex-col min-w-0"><LastReadCard book={lastReadBook} isLoading={isLoading} /></div>
              <div className="col-span-2 w-full h-full flex flex-col min-w-0"><ExamReminder /></div>
            </div>
          )
        }
      ]
    : [
        { id: 'lastRead', component: <LastReadCard book={lastReadBook} isLoading={isLoading} /> },
        { id: 'exam', component: <ExamReminder /> }
      ];

  const handleScroll = (e) => {
    const { scrollLeft, clientWidth } = e.target;
    if (clientWidth > 0) {
      const gap = 16;
      const index = Math.round(scrollLeft / (clientWidth + gap));
      if (index !== currentIndex) {
        setCurrentIndex(index);
      }
    }
  };

  const scrollToSlide = (index) => {
    if (scrollRef.current) {
      const gap = 16; 
      const slideWidth = scrollRef.current.clientWidth;
      scrollRef.current.scrollTo({
        left: index * (slideWidth + gap),
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="w-full relative px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 group/slider flex flex-col gap-6">
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar scroll-smooth gap-4 h-full py-4 px-4 -mx-4"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {slides.map((slide) => (
          <div 
            key={slide.id} 
            className="w-full flex-shrink-0 snap-center snap-always"
          >
            <div className="w-full h-full">
              {slide.component}
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Indicators */}
      {slides.length > 1 && (
        <div className="flex justify-center gap-3">
          {slides.map((_, i) => (
            <button 
              key={i}
              onClick={() => scrollToSlide(i)}
              className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                i === currentIndex 
                  ? 'w-12 bg-accent-primary animate-pulse-subtle' 
                  : 'w-8 bg-black/5 dark:bg-white/5 hover:bg-text-tertiary hover:w-16'
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



