import React from 'react';

export default function Card({ children, className = '', onClick, variant = 'default' }) {
  const base = `
    bg-bg-subtle dark:bg-bg-elevated
    border-t border-black/10 dark:border-white/10
    shadow-sm shadow-black/10 dark:shadow-black/40
    rounded-xl sm:rounded-2xl
  `;

  const variants = {
    default: '',
    interactive: 'cursor-pointer hover:scale-[1.02] active:scale-[0.99] transition-transform',
    sunken: '!bg-black/5 dark:!bg-white/5 !shadow-none !border-t-0',
  };

  console.log('[Card] variant:', variant);

  return (
    <div
      onClick={onClick}
      className={`${base} ${variants[variant]} ${className}`}
    >
      {children}
    </div>
  );
}
