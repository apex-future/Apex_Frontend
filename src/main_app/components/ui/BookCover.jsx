import React from 'react';
import { isValidAuthor } from '../../utils/documentMetadata';

const PALETTES = [
  { bg: '#F8FAFC', accent: '#6366F1', secondary: '#818CF8' }, // Indigo
  { bg: '#FFF7ED', accent: '#F97316', secondary: '#FB923C' }, // Orange
  { bg: '#F0FDFA', accent: '#14B8A6', secondary: '#2DD4BF' }, // Teal
  { bg: '#FEF2F2', accent: '#EF4444', secondary: '#F87171' }, // Red
  { bg: '#F5F3FF', accent: '#8B5CF6', secondary: '#A78BFA' }, // Violet
  { bg: '#EFF6FF', accent: '#3B82F6', secondary: '#60A5FA' }, // Blue
];

/**
 * Procedural geometric cover fallback when no cover image is available.
 */
function ProceduralCover({ title, author, className = '' }) {
  const hashCode = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash);
  };

  const hash = hashCode(title || 'Unknown');
  const palette = PALETTES[hash % PALETTES.length];

  const shapes = [
    <rect key="bg" x="0" y="0" width="100" height="150" fill={palette.bg} />,
    <circle key="accent" cx="20" cy="20" r="40" fill={palette.accent} fillOpacity="0.1" />,
    <path key="path" d="M0 150 L100 50 L100 150 Z" fill={palette.secondary} fillOpacity="0.05" />,
    <rect key="line" x="10" y="120" width="80" height="2" fill={palette.accent} fillOpacity="0.3" />,
  ];

  return (
    <div className={`relative w-full h-full overflow-hidden bg-white select-none ${className}`}>
      <svg
        viewBox="0 0 100 150"
        className="w-full h-full"
        preserveAspectRatio="xMidYMid slice"
      >
        {shapes}
      </svg>

      {/* Overlay Text */}
      <div className="absolute inset-0 p-3.5 sm:p-4 flex flex-col justify-between z-10">
        <div className="flex flex-col gap-1">
          <span className="w-6 h-0.5 bg-accent-primary mb-1.5 sm:mb-2 opacity-50" />
          <h4 className="font-display font-bold text-[10px] sm:text-[11px] leading-tight text-slate-900 line-clamp-3 uppercase tracking-wider">
            {title}
          </h4>
        </div>
        {isValidAuthor(author) ? (
          <div className="flex flex-col gap-0.5">
            <p className="font-sans font-bold text-[6px] sm:text-[7px] text-slate-500 uppercase tracking-[0.2em] line-clamp-1">
              {author}
            </p>
            <div className="flex items-center gap-1 opacity-20">
              <div className="w-1 h-1 rounded-full bg-slate-900" />
              <div className="w-8 h-[1px] bg-slate-900" />
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-1 opacity-20">
            <div className="w-1 h-1 rounded-full bg-slate-900" />
            <div className="w-8 h-[1px] bg-slate-900" />
          </div>
        )}
      </div>

      {/* Texture Overlays */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/notebook.png')] opacity-10 pointer-events-none" />
      <div className="absolute inset-0 shadow-[inset_0_0_40px_rgba(0,0,0,0.02)] pointer-events-none" />
    </div>
  );
}

const SIZE_MAP = {
  xs: 'w-12 h-16 rounded-[3px]',
  sm: 'w-20 h-28 rounded-[5px]',
  md: 'w-28 h-40 rounded-[6px]',
  lg: 'w-48 h-72 sm:w-52 sm:h-80 md:w-56 md:h-88 rounded-[8px] sm:rounded-[10px]',
  full: 'w-full h-full rounded-[6px]',
  custom: '',
};

/**
 * Predefined BookCover UI component with realistic 3D physical book styling:
 * - Subtle spine junction shadow gradient along left edge
 * - Subtle page thickness shadow
 * - Seamless support for custom covers or procedural artwork
 */
export default function BookCover({
  book,
  cover,
  title,
  author,
  format,
  badge,
  size = 'md',
  showSpine = true,
  interactive = false,
  className = '',
  imgClassName = '',
  onClick,
  style,
  ...rest
}) {
  // Extract fields from book object if provided
  const resolvedCover = cover || book?.cover_url || book?.cover || null;
  const resolvedTitle = title || book?.title || 'Untitled';
  const rawAuthor = author !== undefined ? author : book?.author;
  const resolvedAuthor = isValidAuthor(rawAuthor) ? rawAuthor : null;

  const sizeClasses = SIZE_MAP[size] ?? SIZE_MAP.md;
  const interactiveClasses = interactive ? 'transform hover:scale-[1.02] active:scale-[0.98] transition-transform duration-300 cursor-pointer' : '';

  return (
    <div
      onClick={onClick}
      style={style}
      className={`relative overflow-hidden bg-white dark:bg-neutral-900 shadow-sm shadow-black/5 dark:shadow-black/25 border border-black/10 dark:border-white/10 select-none ${sizeClasses} ${interactiveClasses} ${className}`}
      {...rest}
    >
      {/* 3D Realistic Spine / Cover Junction Gradient (Soft & Clean) */}
      {showSpine && (
        <div className="absolute inset-y-0 left-0 w-[6%] min-w-[5px] max-w-[12px] bg-gradient-to-r from-black/10 via-black/3 to-transparent pointer-events-none z-20" />
      )}

      {/* Subtle Right Edge Page Thickness */}
      <div className="absolute inset-y-0 right-0 w-[1.5px] bg-gradient-to-l from-black/10 to-transparent pointer-events-none z-20" />

      {/* Subtle Specular Sheen */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 pointer-events-none z-10" />

      {/* Custom Floating Badge */}
      {badge && (
        <div className="absolute z-20 top-2 right-2">
          {badge}
        </div>
      )}

      {/* Book Artwork */}
      {resolvedCover ? (
        <img
          src={resolvedCover}
          alt={resolvedTitle}
          className={`w-full h-full object-cover ${imgClassName}`}
          loading="lazy"
        />
      ) : (
        <ProceduralCover
          title={resolvedTitle}
          author={resolvedAuthor}
          className={imgClassName}
        />
      )}
    </div>
  );
}

export { ProceduralCover };
