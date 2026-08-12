import React, { useState, useEffect } from 'react';
import './studyWrap.css';

const LOADER_MESSAGES = [
  "Gathering your story...",
  "Reading your sessions...",
  "Crunching the numbers...",
  "Polishing your wrap...",
  "Almost ready...",
];

export default function StudyWrapLoader() {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    console.log('[StudyWrap] Loader mounted');
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % LOADER_MESSAGES.length);
    }, 1800);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center relative z-10 bg-transparent">
      {/* Pulsing circles */}
      <div className="flex items-center gap-3 mb-8">
        <div
          className="study-wrap-pulse-1 rounded-full shadow-lg"
          style={{ width: 14, height: 14, backgroundColor: '#F59E0B' }}
        />
        <div
          className="study-wrap-pulse-2 rounded-full shadow-lg"
          style={{ width: 14, height: 14, backgroundColor: '#A78BFA' }}
        />
        <div
          className="study-wrap-pulse-3 rounded-full shadow-lg"
          style={{ width: 14, height: 14, backgroundColor: '#38BDF8' }}
        />
      </div>


      {/* Cycling message */}
      <p
        className="study-wrap-text-cycle text-base font-bold text-white tracking-wide"
        style={{
          fontFamily: "'Space Grotesk', sans-serif",
        }}
      >
        {LOADER_MESSAGES[messageIndex]}
      </p>

      {/* Apex wordmark at bottom */}
      <div
        className="absolute bottom-8 left-0 right-0 text-center font-black uppercase text-xs tracking-[0.25em] text-white/70"
        style={{
          fontFamily: "'Space Grotesk', sans-serif",
        }}
      >
        Apex Wrap
      </div>
    </div>
  );
}

