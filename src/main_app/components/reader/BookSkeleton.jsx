import React from 'react';

const BookSkeleton = ({ message = "Loading..." }) => {
  return (
    <div className="flex flex-col items-center justify-center w-full min-h-screen bg-[#faf9f6] p-6 animate-in fade-in duration-700">
      {/* Skeleton Book Container */}
      <div className="w-full max-w-2xl bg-bg-elevated shadow-2xl rounded-sm p-8 md:p-12 relative overflow-hidden aspect-[1/1.4] border border-border-default">
        
        {/* Shimmer/Pulse Effect Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />

        {/* Skeleton Lines - Representing Text/Writing */}
        <div className="space-y-6">
          {/* Header-like line */}
          <div className="h-4 w-1/3 bg-bg-subtle rounded-full mb-12" />
          
          {/* Content lines */}
          <div className="space-y-4">
            <div className="h-2 w-full bg-bg-subtle rounded-full" />
            <div className="h-2 w-full bg-bg-subtle rounded-full" />
            <div className="h-2 w-4/5 bg-bg-subtle rounded-full" />
            <div className="h-2 w-full bg-bg-subtle rounded-full" />
            <div className="h-2 w-full bg-bg-subtle rounded-full" />
            <div className="h-2 w-3/4 bg-bg-subtle rounded-full" />
          </div>

          <div className="space-y-4 pt-8">
            <div className="h-2 w-full bg-bg-subtle rounded-full" />
            <div className="h-2 w-full bg-bg-subtle rounded-full" />
            <div className="h-2 w-5/6 bg-bg-subtle rounded-full" />
            <div className="h-2 w-full bg-bg-subtle rounded-full" />
            <div className="h-2 w-2/3 bg-bg-subtle rounded-full" />
          </div>

          <div className="space-y-4 pt-8">
            <div className="h-2 w-full bg-bg-subtle rounded-full" />
            <div className="h-2 w-4/5 bg-bg-subtle rounded-full" />
            <div className="h-2 w-full bg-bg-subtle rounded-full" />
          </div>
        </div>

        {/* Bottom Page Number Placeholder */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 h-2 w-8 bg-bg-subtle rounded-full" />
      </div>

      {/* Dynamic Loading Message */}
      <div className="mt-12 flex flex-col items-center gap-3">
        <div className="flex items-center gap-2">
           <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0s' }} />
           <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0.2s' }} />
           <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0.4s' }} />
        </div>
        <p className="text-text-tertiary font-sans text-sm font-medium tracking-widest uppercase animate-pulse">
            {message}
        </p>
      </div>

      <style>{`
        @keyframes shimmer {
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  );
};

export default BookSkeleton;
