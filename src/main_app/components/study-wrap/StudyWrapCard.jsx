import React from 'react';
import { ShareNetwork, Trophy } from '@phosphor-icons/react';
import StrokeText from '../ui/StrokeText';

export default function StudyWrapCard({
  topicLabel,
  image,
  headline,
  achievementTitle,
  achievementWhy,
  supporting,
}) {
  const supportingEntries = supporting ? Object.entries(supporting) : [];

  return (
    <div className="w-full h-full flex flex-col items-center justify-center px-4 py-2 study-wrap-card-enter relative z-10 select-none">
      {/* Ambient Glow */}
      <div className="study-wrap-glow-orb bg-purple-400/35" />

      {/* Frosted Glass Overlay Container */}
      <div className="relative z-10 w-full study-wrap-glass-card rounded-[24px] p-2 flex flex-col items-center text-center gap-3.5 shadow-2xl border border-white/25">
        {/* Large Hero Image (Fills 98% of container width) */}
        <div className="relative w-full flex items-center justify-center my-0.5">
          <img
            src={image}
            alt={topicLabel}
            className="w-[98%] mx-auto max-h-[195px] md:max-h-[220px] object-cover rounded-[20px] drop-shadow-[0_16px_36px_rgba(0,0,0,0.45)] transition-transform duration-500 hover:scale-105"
          />
        </div>

        {/* Non-Image Content Wrapper (Retains original padding) */}
        <div className="w-full px-4 pb-2 md:px-5 flex flex-col items-center text-center gap-3.5">
          <StrokeText
            text={headline}
            strokeColor="#C084FC"
            fillColor="#FFFFFF"
            strokeWidth={1.8}
            drawDuration={1.3}
            fillDelay={0.15}
            fontSize={36}
            fontWeight={900}
            letterSpacing={-1}
            trigger="mount"
            fillMode="wipe"
            className="w-full drop-shadow-md"
          />

          {/* Achievement Badge Block */}
          {achievementTitle && (
            <div className="w-full rounded-xl bg-white/10 p-3.5 border border-white/15 flex flex-col items-center">
              <div
                className="flex items-center gap-1.5 text-amber-300 font-extrabold text-xs uppercase tracking-wider"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                <Trophy size={16} weight="fill" />
                <span>{achievementTitle}</span>
              </div>
              <p className="text-xs text-white/95 italic font-medium mt-1 leading-relaxed max-w-[275px]">
                &ldquo;{achievementWhy}&rdquo;
              </p>
            </div>
          )}

          {/* Supporting Stat Pills */}
          {supportingEntries.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-1.5">
              {supportingEntries.map(([key, value]) => (
                <div
                  key={key}
                  className="px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-xs text-white font-bold tracking-wide shadow-sm"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  {value}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}




