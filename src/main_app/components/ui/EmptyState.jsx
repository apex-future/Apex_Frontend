import React from 'react';
import { Ghost } from '@phosphor-icons/react';
import Button from './Button';

/*
  Props:
    icon        — any Phosphor icon component (defaults to Ghost)
    title       — main message (required)
    description — subtext (optional)
    action      — { label, onClick } for optional ghost CTA button (optional)
    className   — for size/spacing overrides from parent (optional)
*/

export default function EmptyState({
  icon: Icon = Ghost,
  title,
  description,
  action,
  className = '',
}) {
  console.log('[EmptyState] title:', title, '| hasAction:', !!action);

  return (
    <div
      className={`
        relative flex flex-col items-center justify-center
        p-10 text-center
        rounded-xl sm:rounded-2xl
        animate-in fade-in zoom-in duration-300
        ${className}
      `}
    >
      {/* Custom precise dashed border */}
      <svg 
        className="absolute inset-0 w-full h-full pointer-events-none text-black/20 dark:text-white/20"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect
          x="1"
          y="1"
          width="calc(100% - 2px)"
          height="calc(100% - 2px)"
          fill="none"
          className="[rx:11px] sm:[rx:15px]"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeDasharray="6 4"
        />
      </svg>

      {/* Icon */}
      <div className="mb-5">
        <Icon
          className="w-10 h-10 text-text-tertiary"
          weight="regular"
        />
      </div>

      {/* Title */}
      <h3 className="text-base font-display font-bold text-text-primary mb-1.5 tracking-tight">
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p className="text-sm text-text-tertiary max-w-xs mx-auto leading-relaxed">
          {description}
        </p>
      )}

      {/* Optional CTA */}
      {action && (
        <div className="mt-6">
          <Button variant="ghost" onClick={action.onClick}>
            {action.label}
          </Button>
        </div>
      )}
    </div>
  );
}
