import React, { useState, useMemo } from 'react';
import { HighlighterCircle, CaretRight, Trash, Funnel, SortAscending } from '@phosphor-icons/react';
import EmptyState from '../../../ui/EmptyState';

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

  const [filterColor, setFilterColor] = useState('all');
  const [sortOrder, setSortOrder] = useState('none');

  const ALL_COLORS = ['#d1d5db', '#fef08a', '#bbf7d0', '#bfdbfe', '#e9d5ff'];

  const displayedHighlights = useMemo(() => {
    let result = [...highlights];

    if (filterColor !== 'all') {
      result = result.filter(h => (h.color || '#fef08a') === filterColor);
    }

    if (sortOrder === 'page_asc') {
      result.sort((a, b) => (a.page || a.pageNumber || 0) - (b.page || b.pageNumber || 0));
    } else if (sortOrder === 'page_desc') {
      result.sort((a, b) => (b.page || b.pageNumber || 0) - (a.page || a.pageNumber || 0));
    } else if (sortOrder === 'time_desc') {
      result.sort((a, b) => new Date(b.addedAt || 0) - new Date(a.addedAt || 0));
    } else if (sortOrder === 'time_asc') {
      result.sort((a, b) => new Date(a.addedAt || 0) - new Date(b.addedAt || 0));
    }

    return result;
  }, [highlights, filterColor, sortOrder]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Controls */}
      <div className="flex flex-col gap-4 px-4 pt-3 pb-3 mb-2 border-b border-border-default/50 shrink-0">
        
        {/* Sort */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1.5 text-text-tertiary text-[10px] font-bold uppercase tracking-wider">
            <SortAscending size={14} weight="bold" />
            <span>Sort By</span>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto py-1.5 px-1 custom-scrollbar">
            {[
              { value: 'none', label: 'Default' },
              { value: 'page_asc', label: 'Page ↑' },
              { value: 'page_desc', label: 'Page ↓' },
              { value: 'time_desc', label: 'Newest' },
              { value: 'time_asc', label: 'Oldest' }
            ].map(opt => (
              <button
                key={opt.value}
                onClick={() => setSortOrder(opt.value)}
                className={`shrink-0 px-3 py-1 rounded-full text-[11px] font-bold transition-all border ${
                  sortOrder === opt.value
                    ? 'bg-accent-primary text-white border-accent-primary shadow-sm'
                    : 'bg-bg-subtle text-text-secondary border-border-default hover:bg-bg-elevated'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Filter Colors */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1.5 text-text-tertiary text-[10px] font-bold uppercase tracking-wider">
            <Funnel size={14} weight="bold" />
            <span>Filter Colour</span>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto py-1.5 px-1 custom-scrollbar">
            <button
              onClick={() => setFilterColor('all')}
              className={`shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-[9px] font-bold transition-all border ${
                filterColor === 'all' 
                  ? 'bg-text-primary text-bg-primary border-text-primary scale-[1.15] shadow-sm relative z-10' 
                  : 'bg-bg-subtle text-text-secondary border-border-default hover:bg-bg-elevated'
              }`}
            >
              All
            </button>
            {ALL_COLORS.map(color => (
              <button
                key={color}
                onClick={() => setFilterColor(color)}
                className={`shrink-0 w-6 h-6 rounded-full transition-all border border-black/10 ${
                  filterColor === color ? 'scale-[1.25] shadow-sm opacity-100 relative z-10' : 'opacity-60 hover:opacity-100'
                }`}
                style={{ backgroundColor: color }}
                title={`Filter by this color`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-1 px-2 pb-4 overflow-y-auto min-h-0 flex-1">
        {displayedHighlights.length === 0 ? (
          <div className="py-4">
            <EmptyState 
              icon={HighlighterCircle}
              title="No highlights found"
              description={filterColor === 'all' ? "Select text while reading and pick a color to highlight" : "No highlights found for this colour. Try selecting a different filter."}
            />
          </div>
        ) : (
          displayedHighlights.map((h) => {
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
      })
    )}
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        .custom-scrollbar::-webkit-scrollbar {
            height: 4px;
            width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 10px;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #475569;
        }
      `}} />
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
