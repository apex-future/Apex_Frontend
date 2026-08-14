import React from 'react';
import Button from '../ui/Button';
import { ShareNetwork, CheckCircle } from '@phosphor-icons/react';
import StrokeText from '../ui/StrokeText';

const GRID_ITEMS = [
  { label: 'Course Coverage', key: 'courseCoverage' },
  { label: 'Time Spent', key: 'timeSpent' },
  { label: 'Quiz Performance', key: 'quizPerformance' },
  { label: 'Study Consistency', key: 'studyConsistency' },
];

export default function StudyWrapClosing({ image, wrapData, onClose }) {
  return (
    <div className="w-full min-h-full flex flex-col items-center justify-center px-4 py-4 study-wrap-card-enter relative z-10 select-none">
      {/* Gold Ambient Light Orb */}
      <div className="study-wrap-glow-orb bg-amber-500/35" />

      {/* Transparent Content Container */}
      <div className="relative z-10 w-full flex flex-col items-center text-center gap-2">
        {/* Large Hero Image (Fills 98% of container width) */}
        <div className="relative w-full flex items-center justify-center my-0.5">
          <img
            src={image}
            alt="Study Wrap Closing"
            className="w-[98%] mx-auto max-h-[190px] md:max-h-[215px] object-cover rounded-[20px] drop-shadow-[0_16px_36px_rgba(0,0,0,0.45)] transition-transform duration-500 hover:scale-105"
          />
        </div>

        {/* Non-Image Content Wrapper */}
        <div className="w-full px-3.5 pb-1 md:px-4 flex flex-col items-center text-center gap-2">
          <StrokeText
            text="That's not luck. That's work."
            strokeColor="#FBBF24"
            fillColor="#FFFFFF"
            strokeWidth={2}
            drawDuration={1.4}
            fillDelay={0.2}
            fontSize={38}
            fontWeight={900}
            letterSpacing={-1}
            trigger="mount"
            fillMode="wipe"
            className="w-full drop-shadow-lg"
          />

          {/* 2×2 Frosted Glass Summary Grid */}
          <div className="w-full grid grid-cols-2 gap-2 my-1">
            {GRID_ITEMS.map(({ label, key }) => (
              <div
                key={key}
                className="rounded-xl bg-white/10 p-2.5 flex flex-col justify-between text-left border border-white/15 transition-all hover:bg-white/20"
              >
                <p
                  className="text-[10px] font-black uppercase tracking-wider text-amber-200/90 flex items-center gap-1"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  <CheckCircle size={12} weight="fill" className="text-amber-300" />
                  <span>{label}</span>
                </p>
                <p
                  className="text-xs font-bold text-white mt-1 line-clamp-2 leading-snug"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  {wrapData?.[key]?.headline}
                </p>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="w-full flex flex-col gap-2 pt-1">
            <button
              onClick={() => console.log('[StudyWrap] Share full wrap tapped')}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 text-slate-950 font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg hover:brightness-110 active:scale-[0.98] transition-all"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              <ShareNetwork size={18} weight="bold" />
              <span>Share your Wrap</span>
            </button>

            <Button
              variant="ghost"
              fullWidth
              onClick={onClose}
              className="!text-white/90 hover:!text-white !border-white/25 hover:!bg-white/15 !py-2 !font-bold"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Save Wrap &amp; Exit
            </Button>
          </div>
        </div>
      </div>

    </div>
  );
}



