import React from 'react';

/*
  Props:
    icon        — Phosphor icon component (optional, renders in left slot)
    label       — main text (required)
    right       — any node: badge, count, chevron, or null (optional)
    isActive    — bool, persists primary filled state (default false)
    onClick     — click handler (optional)
    className   — additional overrides (optional)
*/

export default function ListItem({
  icon: Icon,
  label,
  right,
  isActive = false,
  onClick,
  className = '',
  subComponent,
}) {
  console.log('[ListItem] label:', label, '| isActive:', isActive);

  const base = `
    w-full flex flex-col
    px-3 py-2.5
    rounded-xl
    text-sm font-semibold
    transition-all duration-150
    cursor-pointer
    select-none
  `;

  const states = isActive
    ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-bold border border-purple-200 dark:border-purple-800/50'
    : 'text-text-secondary hover:bg-accent-primary/5 hover:text-accent-primary';

  return (
    <button
      onClick={onClick}
      className={`${base} ${states} ${className}`}
    >
      {/* Main row */}
      <div className="w-full flex items-center gap-3">
        {/* Left slot — icon */}
        {Icon && (
          <Icon
            size={20}
            weight="bold"
            className="shrink-0"
          />
        )}

        {/* Label */}
        <span className="flex-1 text-left tracking-tight truncate">
          {label}
        </span>

        {/* Right slot — badge, count, chevron, or nothing */}
        {right && (
          <span className="shrink-0">
            {right}
          </span>
        )}
      </div>

      {/* Optional sub-component underneath */}
      {subComponent && (
        <div className="w-full mt-2">
          {subComponent}
        </div>
      )}
    </button>
  );
}
