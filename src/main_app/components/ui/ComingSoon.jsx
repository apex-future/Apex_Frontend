import React from 'react';
import { 
  Sparkle, 
  HourglassHigh 
} from '@phosphor-icons/react';
import Card from './Card';

/**
 * ComingSoon Component
 * 
 * Reusable, prebuilt view/section for features currently under development.
 * Designed according to Apex Aura UI standards with clean typography,
 * consistent cards, and subtle micro-interactions.
 * 
 * @param {React.ElementType} icon - Main Phosphor icon component
 * @param {string} badge - Top pill badge text (default: 'Coming Soon')
 * @param {React.ElementType} badgeIcon - Optional icon for pill badge
 * @param {string} eta - Optional status/timeline text
 * @param {string} title - Primary title headline
 * @param {string} description - Descriptive subtitle copy
 * @param {Array<{icon?: React.ElementType, title: string, description: string}>} highlights - Feature preview cards
 * @param {boolean} fullPage - If true, wraps in min-h-screen layout
 * @param {React.ReactNode} children - Additional custom JSX slots
 * @param {string} className - Optional container styling override
 */
export default function ComingSoon({
  icon: Icon = Sparkle,
  badge = 'Coming Soon',
  badgeIcon: BadgeIcon = HourglassHigh,
  eta = null,
  title = 'Something Exciting is in the Works',
  description = "We're building an incredible new experience for you. Check back soon as we craft this feature.",
  highlights = [],
  fullPage = true,
  children,
  className = '',
}) {
  const content = (
    <div className={`w-full max-w-4xl mx-auto flex flex-col items-center text-center relative z-10 ${className}`}>
      {/* Top Status Pill */}
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/10 dark:bg-purple-500/15 border border-purple-500/20 text-purple-600 dark:text-purple-400 text-xs font-semibold tracking-wide mb-6 shadow-sm animate-in fade-in zoom-in duration-300">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500" />
        </span>
        {BadgeIcon && <BadgeIcon size={14} weight="bold" className="text-purple-600 dark:text-purple-400" />}
        <span>{badge}</span>
        {eta && (
          <>
            <span className="w-1 h-1 rounded-full bg-purple-400/40" />
            <span className="text-text-tertiary dark:text-neutral-400 font-normal">{eta}</span>
          </>
        )}
      </div>

      {/* Hero Icon */}
      <div className="relative mb-6">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-purple-500/10 dark:bg-purple-400/10 border border-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400 shadow-sm transition-transform duration-300 hover:scale-105">
          <Icon size={38} weight="duotone" />
        </div>
      </div>

      {/* Title & Description */}
      <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-text-primary mb-4 max-w-2xl leading-[1.15]">
        {title}
      </h1>
      <p className="text-sm sm:text-base text-text-secondary max-w-xl mx-auto leading-relaxed mb-8">
        {description}
      </p>

      {/* Feature Highlights Grid */}
      {highlights && highlights.length > 0 && (
        <div className="w-full text-left mb-6">
          <h2 className="text-xs font-bold uppercase tracking-wider text-text-tertiary mb-4 text-center">
            What to Expect
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4 max-w-3xl mx-auto">
            {highlights.map((item, idx) => {
              const ItemIcon = item.icon || Sparkle;
              return (
                <Card 
                  key={item.title || idx} 
                  className="p-4 sm:p-5 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2.5 mb-2.5">
                      <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                        <ItemIcon size={20} weight="duotone" />
                      </div>
                      <h3 className="font-bold text-sm text-text-primary">
                        {item.title}
                      </h3>
                    </div>
                    <p className="text-xs text-text-secondary leading-relaxed pl-0.5">
                      {item.description}
                    </p>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Custom Children Slot */}
      {children && <div className="w-full">{children}</div>}
    </div>
  );

  if (!fullPage) {
    return content;
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center px-4 py-12 md:py-16 pb-24 md:pb-16 relative bg-bg-primary text-text-primary overflow-x-hidden">
      {content}
    </div>
  );
}
