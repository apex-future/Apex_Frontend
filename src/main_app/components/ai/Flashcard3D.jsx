import React, { useState } from 'react';
import { ArrowUUpLeft } from '@phosphor-icons/react';
import useThemeStore from '../../store/themeStore';

const Flashcard3D = ({ question, answer, isFlipped, setIsFlipped }) => {
  const { resolvedTheme } = useThemeStore();
  const isDark = resolvedTheme === 'dark';

  return (
    <div 
      className="relative w-full max-w-sm aspect-[3/4] cursor-pointer group perspective-[1500px]"
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <div 
        className={`w-full h-full relative transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] preserve-3d shadow-xl rounded-3xl ${isFlipped ? 'rotate-y-180' : ''}`}
      >
        
        {/* Front of Card (Question) */}
        <div className={`absolute inset-0 w-full h-full backface-hidden rounded-3xl border border-border-default p-8 flex flex-col justify-center items-center text-center ${isDark ? 'bg-zinc-800' : 'bg-white'}`}>
          <div className="absolute top-6 left-1/2 -translate-x-1/2 flex gap-1">
            <span className="w-2 h-2 rounded-full bg-accent-primary opacity-20"></span>
            <span className="w-2 h-2 rounded-full bg-accent-primary opacity-50"></span>
            <span className="w-2 h-2 rounded-full bg-accent-primary"></span>
          </div>
          <h3 className="text-xl font-bold text-text-primary leading-tight font-sans">
            {question}
          </h3>
          <div className="absolute bottom-6 flex items-center gap-2 text-text-secondary opacity-50 font-medium text-sm">
            <p>Tap to flip</p>
          </div>
        </div>

        {/* Back of Card (Answer) */}
        <div 
          className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 rounded-3xl p-8 flex flex-col justify-center items-center text-center overflow-y-auto"
          style={{
            background: isDark 
              ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(30, 30, 30, 1) 100%)' 
              : 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(255, 255, 255, 1) 100%)',
            border: isDark ? '1px solid rgba(139, 92, 246, 0.3)' : '1px solid rgba(139, 92, 246, 0.2)'
          }}
        >
          <div className="absolute top-6 left-6 text-accent-primary opacity-50">
            <ArrowUUpLeft size={24} weight="bold" />
          </div>
          <p className="text-lg font-medium text-text-primary leading-relaxed mt-4">
            {answer}
          </p>
        </div>

      </div>
    </div>
  );
};

export default Flashcard3D;
