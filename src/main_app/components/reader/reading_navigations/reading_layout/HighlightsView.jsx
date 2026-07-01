import React from 'react';
import { HighlighterCircle, CaretRight, Trash } from '@phosphor-icons/react';

/**
 * HighlightsView
 * Lists all highlights for the current book.
 * Props:
 *   highlights    – [{ id, text, highlightedText, color, page, pageNumber, addedAt }]
 *   onJumpTo      – (page) => void
 *   onRemove      – (highlightId) => void
 */
function HighlightsView({ highlights = [], onJumpTo, onRemove }) {
  if (highlights.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="w-12 h-12 rounded-2xl bg-bg-subtle flex items-center justify-center mb-3">
          <HighlighterCircle size={22} weight="bold" className="text-text-tertiary" />
        </div>
        <p className="text-sm font-semibold text-text-secondary">No highlights yet</p>
        <p className="text-xs text-text-tertiary mt-1">Select text while reading and pick a color to highlight</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1 px-2 py-1">
      {highlights.map((h) => {
        const page = h.page || h.pageNumber;
        const text = h.text || h.highlightedText || '';
        const displayText = text.length > 80 ? text.slice(0, 80) + '…' : text;
        const color = h.color || '#fef08a';

        return (
          <div
            key={h.id || `${text}-${page}`}
            className="group flex items-start gap-3 p-2.5 rounded-xl hover:bg-accent-primary/8 transition-all cursor-pointer"
            onClick={() => onJumpTo?.(page)}
          >
            {/* Color indicator */}
            <div className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center mt-0.5"
              style={{ backgroundColor: color + '40' }}
            >
              <div
                className="w-3 h-3 rounded-full border border-black/10"
                style={{ backgroundColor: color }}
              />
            </div>

            {/* Text snippet + meta */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary line-clamp-2 leading-snug">
                "{displayText}"
              </p>
              <div className="flex items-center gap-2 mt-1">
                {page > 0 && (
                  <span className="text-[10px] font-bold text-text-tertiary bg-bg-subtle px-1.5 py-0.5 rounded">
                    Page {page}
                  </span>
                )}
                <span className="text-[10px] text-text-tertiary font-medium">
                  {formatDate(h.addedAt)}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 shrink-0">
              {onRemove && (
                <button
                  onClick={(e) => { e.stopPropagation(); onRemove?.(h.id || h.dexieId); }}
                  className="p-1 rounded-lg hover:bg-bg-subtle text-text-placeholder hover:text-red-500 transition-all"
                  title="Remove highlight"
                >
                  <Trash size={13} weight="bold" />
                </button>
              )}
              <CaretRight size={14} weight="bold" className="text-text-placeholder shrink-0" />
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

export default HighlightsView;
