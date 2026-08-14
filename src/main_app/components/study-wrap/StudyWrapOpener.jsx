import React from 'react';
import StrokeText from '../ui/StrokeText';

export default function StudyWrapOpener({ userName, examName, image }) {
  return (
    <div className="w-full min-h-full flex flex-col items-center justify-center px-4 py-4 study-wrap-card-enter relative z-10 select-none">
      {/* Ambient Glow */}
      <div className="study-wrap-glow-orb bg-indigo-500/40" />

      {/* Transparent Content Container */}
      <div className="relative z-10 w-full flex flex-col items-center text-center gap-2">
        {/* Large Hero Image (Fills 98% of container width) */}
        <div className="relative w-full flex items-center justify-center my-0.5">
          <img
            src={image}
            alt="Study Wrap Opener"
            className="w-[98%] mx-auto max-h-[210px] md:max-h-[240px] object-cover rounded-[20px] drop-shadow-[0_16px_36px_rgba(0,0,0,0.45)] transition-transform duration-500 hover:scale-105"
          />
        </div>

        {/* Non-Image Content Wrapper */}
        <div className="w-full px-4 pb-1 md:px-5 flex flex-col items-center text-center gap-2">
          <StrokeText
            text={`You put in the work, ${userName}.`}
            strokeColor="#F59E0B"
            fillColor="#FFFFFF"
            strokeWidth={1.8}
            drawDuration={1.4}
            fillDelay={0.2}
            fontSize={40}
            fontWeight={900}
            letterSpacing={-1}
            trigger="mount"
            fillMode="wipe"
            className="w-full drop-shadow-lg"
          />

          <p
            className="text-sm md:text-base text-purple-100/90 font-medium tracking-wide"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Here&apos;s a look back at your journey.
          </p>

          {/* Exam Pill */}
          <div
            className="px-5 py-2 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-xs font-extrabold text-white uppercase tracking-widest shadow-xl"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            {examName}
          </div>
        </div>
      </div>

    </div>
  );
}





