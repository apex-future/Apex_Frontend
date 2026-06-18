import React from 'react';
import { BookmarkSimple, CaretRight, Trash } from '@phosphor-icons/react';

/**
 * BookmarksView
 * Lists all bookmarks for the current book.
 * Props:
 *   bookmarks  – [{ page, label, addedAt }]
 *   onJumpTo   – (page) => void
 *   onRemove   – (page) => void
 */
function BookmarksView({ bookmarks = [], onJumpTo, onRemove }) {
  return (
    <div className="flex flex-col gap-1 px-2 py-1">
      {bookmarks.map((bm) => (
        <div
          key={bm.page}
          className="group flex items-center gap-2 p-2.5 rounded-xl hover:bg-accent-primary/8 transition-all cursor-pointer"
          onClick={() => onJumpTo?.(bm.page)}
        >
          {/* Bookmark ribbon indicator */}
          <div className="shrink-0 w-7 h-7 rounded-lg bg-accent-primary/15 flex items-center justify-center">
            <BookmarkSimple
              size={14}
              weight="fill"
              className="text-accent-primary"
            />
          </div>

          {/* Label + timestamp */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-text-primary truncate">{bm.label}</p>
            <p className="text-[10px] text-text-tertiary mt-0.5 font-medium">
              {formatDate(bm.addedAt)}
            </p>
          </div>

          {/* Jump arrow (always) + remove (on hover) */}
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => { e.stopPropagation(); onRemove?.(bm.page); }}
              className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-bg-subtle text-text-placeholder hover:text-red-500 transition-all"
              title="Remove bookmark"
            >
              <Trash size={13} weight="bold" />
            </button>
            <CaretRight size={14} weight="bold" className="text-text-placeholder shrink-0" />
          </div>
        </div>
      ))}
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

export default BookmarksView;
