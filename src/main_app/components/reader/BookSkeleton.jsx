import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from '@phosphor-icons/react';
import Button from '../ui/Button';

const BookSkeleton = ({ message = "Loading..." }) => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center w-full min-h-screen bg-bg-primary p-6 animate-in fade-in duration-700 relative">
      {/* Back Button */}
      <div className="absolute top-6 left-6 z-10">
          <Button
              onClick={() => navigate('/')}
              variant="ghost"
              className="w-auto group hover:text-accent-primary"
          >
              <ArrowLeft size={16} weight="bold" className="group-hover:-translate-x-1 transition-transform" /> Dashboard
          </Button>
      </div>

      {/* Skeleton Book Container */}
      <div className="w-[200px] h-[280px] bg-bg-subtle dark:bg-bg-elevated shadow-2xl rounded-sm p-5 relative overflow-hidden flex-shrink-0">
        
        {/* Shimmer/Pulse Effect Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 dark:via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />

        {/* Skeleton Lines - Representing Text/Writing */}
        <div className="space-y-4">
          {/* Header-like line */}
          <div className="h-2 w-1/3 bg-gray-200 dark:bg-black/40 rounded-full mb-6" />
          
          {/* Content lines */}
          <div className="space-y-2">
            <div className="h-1 w-full bg-gray-200 dark:bg-black/40 rounded-full" />
            <div className="h-1 w-full bg-gray-200 dark:bg-black/40 rounded-full" />
            <div className="h-1 w-4/5 bg-gray-200 dark:bg-black/40 rounded-full" />
            <div className="h-1 w-full bg-gray-200 dark:bg-black/40 rounded-full" />
            <div className="h-1 w-full bg-gray-200 dark:bg-black/40 rounded-full" />
            <div className="h-1 w-3/4 bg-gray-200 dark:bg-black/40 rounded-full" />
          </div>

          <div className="space-y-2 pt-4">
            <div className="h-1 w-full bg-gray-200 dark:bg-black/40 rounded-full" />
            <div className="h-1 w-full bg-gray-200 dark:bg-black/40 rounded-full" />
            <div className="h-1 w-5/6 bg-gray-200 dark:bg-black/40 rounded-full" />
            <div className="h-1 w-full bg-gray-200 dark:bg-black/40 rounded-full" />
            <div className="h-1 w-2/3 bg-gray-200 dark:bg-black/40 rounded-full" />
          </div>

          <div className="space-y-2 pt-4">
            <div className="h-1 w-full bg-gray-200 dark:bg-black/40 rounded-full" />
            <div className="h-1 w-4/5 bg-gray-200 dark:bg-black/40 rounded-full" />
            <div className="h-1 w-full bg-gray-200 dark:bg-black/40 rounded-full" />
          </div>
        </div>

        {/* Bottom Page Number Placeholder */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 h-1 w-4 bg-gray-200 dark:bg-black/40 rounded-full" />
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
