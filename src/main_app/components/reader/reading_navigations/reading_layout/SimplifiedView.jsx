import React from 'react';
import { MagicWand, CaretRight, Trash, Sparkle } from '@phosphor-icons/react';

/**
 * SimplifiedView
 * Lists all simplified texts for the current book in the LeftPanel.
 * Props:
 *   simplifications  – [{ id, originalText, simplifiedText, page, addedAt }]
 *   onJumpTo         – (page) => void
 *   onRemove         – (simplificationId) => void
 *   onViewSimplification – (simplification) => void — reopens the SimplifyModal with cached result
 */
function SimplifiedView({ simplifications = [], onJumpTo, onRemove, onViewSimplification }) {
  if (simplifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center mb-3">
          <MagicWand size={22} weight="bold" className="text-emerald-500" />
        </div>
        <p className="text-sm font-semibold text-text-secondary">No simplifications yet</p>
        <p className="text-xs text-text-tertiary mt-1">
          Select text while reading and tap "Simplify" to get a simpler version
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1 px-2 py-1">
      {simplifications.map((s) => {
        const page = s.page || 0;
        const original = s.originalText || '';
        const simplified = s.simplifiedText || '';
        const displayOriginal = original.length > 60 ? original.slice(0, 60) + '…' : original;
        const displaySimplified = simplified.length > 80 ? simplified.slice(0, 80) + '…' : simplified;

        return (
          <div
            key={s.id || `${original}-${page}`}
            className="group flex flex-col gap-2 p-3 rounded-xl hover:bg-accent-primary/5 transition-all cursor-pointer border border-transparent hover:border-border-default/50"
            onClick={() => {
              onViewSimplification?.(s);
            }}
          >
            {/* Original text */}
            <div className="flex items-start gap-2.5">
              <div className="shrink-0 w-6 h-6 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center mt-0.5">
                <Sparkle size={12} weight="fill" className="text-emerald-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-text-tertiary font-bold uppercase tracking-wider mb-0.5 opacity-50">
                  Original
                </p>
                <p className="text-xs text-text-secondary italic line-clamp-2 leading-snug">
                  "{displayOriginal}"
                </p>
              </div>
            </div>

            {/* Simplified text */}
            <div className="ml-8.5 pl-0 ml-[34px]">
              <p className="text-[11px] text-emerald-600 font-bold uppercase tracking-wider mb-0.5">
                Simplified
              </p>
              <p className="text-sm text-text-primary font-medium leading-snug line-clamp-2">
                {displaySimplified}
              </p>
            </div>

            {/* Meta + actions */}
            <div className="flex items-center justify-between ml-[34px]">
              <div className="flex items-center gap-2">
                {page > 0 && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onJumpTo?.(page); }}
                    className="text-[10px] font-bold text-text-tertiary bg-bg-subtle px-1.5 py-0.5 rounded hover:bg-accent-subtle hover:text-accent-primary transition-colors"
                  >
                    Page {page}
                  </button>
                )}
                <span className="text-[10px] text-text-tertiary font-medium">
                  {formatDate(s.addedAt)}
                </span>
              </div>
              <div className="flex items-center gap-1">
                {onRemove && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onRemove?.(s.id); }}
                    className="p-1 rounded-lg hover:bg-bg-subtle text-text-placeholder hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                    title="Remove simplification"
                  >
                    <Trash size={13} weight="bold" />
                  </button>
                )}
                <CaretRight size={14} weight="bold" className="text-text-placeholder shrink-0 opacity-0 group-hover:opacity-100" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function formatDate(isoString) {
  if (!isoString) return '';
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

export default SimplifiedView;
