import React from 'react';

/*
  Variants:
    ghost   — transparent bg, all-round grey border, grey fill on hover
    primary — purple gradient fill, no border, slight opacity reduction on hover
    danger  — red fill, no border, slight opacity reduction on hover

  Size: md only for now
*/

const styles = {
  base: `
    inline-flex items-center justify-center gap-2
    px-5 py-2
    rounded-xl
    text-xs font-bold
    transition-all duration-150
    active:scale-95
    disabled:opacity-40 disabled:pointer-events-none
    whitespace-nowrap
  `,

  variants: {
    ghost: `
      bg-transparent
      border border-black/15 dark:border-white/15
      text-text-secondary
      hover:bg-black/5 dark:hover:bg-white/[0.08]
    `,
    primary: `
      bg-gradient-to-r from-purple-600 via-purple-500 to-[#c084fc]
      text-white
      border-none
      hover:opacity-90
      shadow-sm shadow-purple-900/30
    `,
    danger: `
      bg-red-500 dark:bg-red-600
      text-white
      border-none
      hover:opacity-90
      shadow-sm shadow-red-500/20
    `,
  },
};

export default function Button({
  children,
  variant = 'ghost',
  fullWidth = true,
  onClick,
  disabled = false,
  className = '',
  type = 'button',
  id,
  ...rest
}) {
  const widthClass = fullWidth ? 'w-full' : 'w-auto';

  return (
    <button
      id={id}
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${styles.base} ${widthClass} ${styles.variants[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
