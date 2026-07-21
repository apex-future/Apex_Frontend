import React from 'react';

/**
 * Predefined Label UI Component
 * 
 * Props:
 *  - content / children: Label text or React nodes
 *  - variant: 'accent' | 'neutral' | 'subtle' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'ghost'
 *  - color: Custom color preset ('purple', 'emerald', 'amber', 'blue', 'red', 'indigo', etc.) or custom CSS/hex string
 *  - size: 'sm' | 'md' | 'lg' (default: 'md')
 *  - icon: Optional icon element to render alongside text
 *  - iconPosition: 'left' | 'right' (default: 'left')
 *  - dot: boolean (shows status dot indicator)
 *  - dotColor: string (custom dot color class)
 *  - className: Extra Tailwind CSS classes
 *  - style: Inline style object
 *  - onClick: Click handler (turns label into interactive button if provided)
 */

const variantStyles = {
  accent: 'bg-accent-subtle text-accent-pressed dark:text-accent-pressed border-black/10 dark:border-white/10 hover:border-black/20 dark:hover:border-white/20',
  primary: 'bg-accent-subtle text-accent-pressed dark:text-accent-pressed border-black/10 dark:border-white/10 hover:border-black/20 dark:hover:border-white/20',
  neutral: 'bg-bg-subtle dark:bg-bg-dark-elevated text-text-tertiary dark:text-text-tertiary-dark border-black/10 dark:border-white/10 hover:border-black/20 dark:hover:border-white/20',
  subtle: 'bg-bg-subtle dark:bg-bg-dark-elevated text-text-tertiary dark:text-text-tertiary-dark border-black/10 dark:border-white/10 hover:border-black/20 dark:hover:border-white/20',
  success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:border-emerald-500/40',
  warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 hover:border-amber-500/40',
  danger: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20 hover:border-red-500/40',
  info: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 hover:border-blue-500/40',
  ghost: 'bg-transparent text-text-tertiary dark:text-text-tertiary-dark border-black/10 dark:border-white/10 hover:border-black/20 dark:hover:border-white/20',
};

const colorPresetMap = {
  accent: variantStyles.accent,
  purple: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20 hover:border-purple-500/40',
  blue: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 hover:border-blue-500/40',
  green: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:border-emerald-500/40',
  emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:border-emerald-500/40',
  red: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20 hover:border-red-500/40',
  amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 hover:border-amber-500/40',
  yellow: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 hover:border-amber-500/40',
  indigo: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20 hover:border-indigo-500/40',
  pink: 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20 hover:border-pink-500/40',
  gray: variantStyles.neutral,
  neutral: variantStyles.neutral,
};

const sizeStyles = {
  sm: 'px-3 py-1 text-[11px]',
  md: 'px-4 py-1.5 text-xs',
  lg: 'px-5 py-2 text-sm',
};

export default function Label({
  children,
  content,
  variant = 'neutral',
  color,
  size = 'md',
  icon,
  iconPosition = 'left',
  dot = false,
  dotColor,
  className = '',
  style = {},
  onClick,
  ...props
}) {
  const labelContent = content !== undefined ? content : children;

  let resolvedColorStyle = '';
  let customInlineStyle = { ...style };

  if (color) {
    if (colorPresetMap[color.toLowerCase()]) {
      resolvedColorStyle = colorPresetMap[color.toLowerCase()];
    } else if (typeof color === 'string' && (color.startsWith('#') || color.startsWith('rgb') || color.startsWith('hsl'))) {
      customInlineStyle = {
        backgroundColor: `${color}18`,
        color: color,
        borderColor: `${color}35`,
        ...customInlineStyle,
      };
      resolvedColorStyle = 'border hover:opacity-90';
    } else {
      resolvedColorStyle = color;
    }
  } else {
    resolvedColorStyle = variantStyles[variant] || variantStyles.neutral;
  }

  const baseStyles = `
    inline-flex items-center justify-center gap-2
    font-semibold rounded-full tracking-widest
    border transition-all duration-200
    ${sizeStyles[size] || sizeStyles.md}
    ${resolvedColorStyle}
    ${onClick ? 'cursor-pointer active:scale-95 hover:shadow-sm' : ''}
    ${className}
  `.replace(/\s+/g, ' ').trim();

  const Component = onClick ? 'button' : 'span';

  return (
    <Component
      className={baseStyles}
      style={customInlineStyle}
      onClick={onClick}
      {...(onClick ? { type: 'button' } : {})}
      {...props}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
            dotColor || 'bg-current opacity-80'
          }`}
        />
      )}
      {icon && iconPosition === 'left' && (
        <span className="flex items-center justify-center flex-shrink-0">{icon}</span>
      )}
      {labelContent && <span>{labelContent}</span>}
      {icon && iconPosition === 'right' && (
        <span className="flex items-center justify-center flex-shrink-0">{icon}</span>
      )}
    </Component>
  );
}
