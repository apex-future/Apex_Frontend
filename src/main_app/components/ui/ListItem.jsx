import React from 'react';

/*
  Props:
    icon        — Phosphor icon component (optional, renders in left slot)
    label       — main text (required)
    right       — any node: badge, count, chevron, or null (optional)
    isActive    — bool, persists primary filled state (default false)
    onClick     — click handler (optional)
    className   — additional overrides (optional)
    as          — custom wrapper element (default 'div')
*/

export default function ListItem({
  icon: Icon,
  label,
  right,
  isActive = false,
  onClick,
  className = '',
  subComponent,
  as: Component = 'div',
  ...rest
}) {
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

  const handleKeyDown = (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && onClick) {
      if (e.target !== e.currentTarget && ['BUTTON', 'INPUT', 'TEXTAREA'].includes(e.target.tagName)) {
        return;
      }
      e.preventDefault();
      onClick(e);
    }
  };

  return (
    <Component
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      className={`${base} ${states} ${className}`}
      {...rest}
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
        {label && (
          <span className="flex-1 text-left tracking-tight truncate">
            {label}
          </span>
        )}

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
    </Component>
  );
}
