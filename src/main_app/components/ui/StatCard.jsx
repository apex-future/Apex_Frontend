import React from 'react';
import Card from './Card';

const colorMap = {
 orange: {
 icon: 'text-orange-500',
 value: 'text-orange-500 dark:text-orange-400',
 },
 amber: {
 icon: 'text-amber-500',
 value: 'text-amber-600 dark:text-amber-400',
 },
 emerald: {
 icon: 'text-emerald-500',
 value: 'text-emerald-600 dark:text-emerald-400',
 },
 purple: {
 icon: 'text-purple-500',
 value: 'text-purple-600 dark:text-purple-400',
 },
 gray: {
 icon: 'text-neutral-400 dark:text-neutral-500',
 value: 'text-neutral-500 dark:text-neutral-400',
 },
 grey: {
 icon: 'text-neutral-400 dark:text-neutral-500',
 value: 'text-neutral-500 dark:text-neutral-400',
 },
};

export default function StatCard({
 label,
 value,
 icon: Icon,
 colorScheme = 'purple',
 unit,
 onClick,
 badge, // slot for inline icons next to label (e.g. Lightning on XP card)
 sub, // small label rendered below unit (e.g. "1.25x boost")
}) {
 const colors = colorMap[colorScheme] || colorMap.purple;

 console.log('[StatCard] label:', label, '| value:', value, '| colorScheme:', colorScheme);

 return (
 <Card variant={onClick ? 'interactive' : 'default'} onClick={onClick}>
 <div className="p-2.5 sm:p-4 md:p-5 flex flex-col items-center justify-center gap-1.5 sm:gap-2">

 {/* Label row */}
 <div className="flex items-center gap-1">
 <span className="text-text-tertiary text-[10px] sm:text-xs md:text-sm font-medium whitespace-nowrap">
 {label}
 </span>
 {badge && badge}
 </div>

 {/* Value row */}
 <div className="flex items-center gap-1 sm:gap-1.5">
 {Icon && (
 <Icon className={`w-4 h-4 sm:w-5 sm:h-5 transition-colors duration-300 ${colors.icon}`} weight="fill" />
 )}
 <span className={`text-xl sm:text-2xl md:text-3xl font-bold whitespace-nowrap transition-colors duration-300 ${colors.value}`}>
 {value}
 </span>
 </div>

 {/* Unit */}
 {unit && (
 <span className="text-text-tertiary text-[10px] sm:text-xs md:text-sm font-medium text-center whitespace-nowrap">
 {unit}
 </span>
 )}

 {/* Sub label — small muted text below unit (e.g. multiplier info) */}
 {sub && (
 <span className="text-[9px] sm:text-[10px] font-semibold tracking-wide text-center whitespace-nowrap text-purple-500 dark:text-purple-400 opacity-90">
 {sub}
 </span>
 )}

 </div>
 </Card>
 );
}
