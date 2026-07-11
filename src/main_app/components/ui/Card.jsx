import React from 'react';

export default function Card({ children, className = '', onClick, variant = 'default', style, ...rest }) {
 const base = `
 bg-bg-subtle dark:bg-bg-elevated
 border-t border-black/10 dark:border-white/10
 shadow-sm shadow-black/10 dark:shadow-black/40
 rounded-xl sm:rounded-2xl
 hover:scale-[1.02] transition-transform duration-400
 `;

 const variants = {
 default: '',
 interactive: 'cursor-pointer active:scale-[0.99]',
 sunken: '!bg-black/5 dark:!bg-white/5 !shadow-none !border-t-0',
 };

 return (
 <div
 onClick={onClick}
 className={`${base} ${variants[variant]} ${className}`}
 style={style}
 {...rest}
 >
 {children}
 </div>
 );
}
