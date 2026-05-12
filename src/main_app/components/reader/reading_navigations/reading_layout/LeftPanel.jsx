import React, { useState } from 'react'
import { BookOpen, List, Bookmark, X, ChevronLeft, ChevronDown, Highlighter, Wand2 } from 'lucide-react'
import BookmarksView from './BookmarksView'
import SidebarNotesView from './SidebarNotesView'
import HighlightsView from './HighlightsView'
import SimplifiedView from './SimplifiedView'

const NAV_ITEMS = [
  { id: 'toc', icon: List, label: 'Table of Contents' },
  { id: 'bookmarks', icon: Bookmark, label: 'Bookmarks' },
  { id: 'highlights', icon: Highlighter, label: 'Highlights' },
  { id: 'notes', icon: BookOpen, label: 'Notes' },
  { id: 'simplified', icon: Wand2, label: 'Simplified' },
];

function TocItems({ items, onJump, depth = 0 }) {
  const [collapsed, setCollapsed] = useState({});

  const toggle = (idx) =>
    setCollapsed(prev => ({ ...prev, [idx]: !prev[idx] }));

  return (
    <>
      {items.map((item, idx) => {
        const hasChildren = item.children && item.children.length > 0;
        const isCollapsed = collapsed[idx] ?? false;

        return (
          <React.Fragment key={idx}>
            <button
              onClick={() => {
                if (hasChildren) {
                  toggle(idx);
                } else if (item.pageNumber) {
                  onJump(item.pageNumber);
                }
              }}
              disabled={!hasChildren && !item.pageNumber}
              className={`
                w-full text-left py-2.5 flex items-center gap-2
                text-text-secondary hover:text-accent-primary hover:bg-accent-primary/5
                transition-colors disabled:opacity-40 disabled:cursor-default
                ${depth === 0 ? 'text-[13px] font-semibold border-b border-border-default/30' : 'text-[12px] font-medium'}
              `}
              style={{ paddingLeft: `${20 + depth * 16}px`, paddingRight: '16px' }}
            >
              {/* Chevron for collapsible parents */}
              {hasChildren && (
                <ChevronDown
                  size={13}
                  strokeWidth={2.5}
                  className={`shrink-0 text-text-tertiary transition-transform duration-200 ${
                    isCollapsed ? '-rotate-90' : 'rotate-0'
                  }`}
                />
              )}

              <span className='flex-1 truncate'>{item.title}</span>

              {/* Page number — always jumps, stops propagation when inside a toggle row */}
              {item.pageNumber && (
                <span
                  onClick={(e) => {
                    if (hasChildren) e.stopPropagation();
                    onJump(item.pageNumber);
                  }}
                  className='text-[11px] text-text-tertiary tabular-nums shrink-0 hover:text-accent-primary cursor-pointer'
                >
                  {item.pageNumber}
                </span>
              )}
            </button>

            {/* Children — animated collapse */}
            {hasChildren && (
              <div
                className='overflow-hidden transition-all duration-200 ease-in-out'
                style={{ maxHeight: isCollapsed ? 0 : '9999px', opacity: isCollapsed ? 0 : 1 }}
              >
                <TocItems items={item.children} onJump={onJump} depth={depth + 1} />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </>
  );
}

function LeftPanel({ setLeftPanel, readerControls, pdfControls, tocOutline }) {
  const [activeSection, setActiveSection] = useState(null);

  const {
    notes = [],
    addNote,
    updateNote,
    deleteNote,
    bookmarks = [],
    onRemoveBookmark,
    highlights = [],
    removeHighlight,
    onJumpToHighlight,
    simplifications = [],
    removeSimplification,
    onViewSimplification,
  } = readerControls || {};

  function handleNavClick(id) {
    setActiveSection(prev => (prev === id ? null : id));
  }

  function handleJumpTo(page) {
    pdfControls?.goToPage?.(page);
    setLeftPanel(false); // close panel after jumping
  }

  return (
    <aside
      className="flex flex-col absolute inset-0 z-[200] bg-bg-elevated md:relative md:inset-auto md:w-80 md:h-full md:border-r md:border-border-default md:shrink-0 font-sans shadow-2xl md:shadow-none"
      onClick={(e) => e.stopPropagation()}
    >
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-5 py-5 border-b border-border-default shrink-0">
        {activeSection ? (
          /* Back to main nav when inside a section */
          <button
            onClick={() => setActiveSection(null)}
            className="flex items-center gap-2 text-base font-bold text-text-primary hover:text-accent-primary transition-colors"
          >
            <ChevronLeft size={18} strokeWidth={2.5} />
            {NAV_ITEMS.find(n => n.id === activeSection)?.label}
          </button>
        ) : (
          <h2 className="text-xs font-black text-text-tertiary tracking-[0.2em] uppercase">Contents</h2>
        )}
        <button
          onClick={() => setLeftPanel(false)}
          className="p-2 rounded-full bg-bg-subtle hover:bg-bg-subtle transition-all text-text-tertiary hover:text-text-secondary"
        >
          <X size={18} strokeWidth={2} />
        </button>
      </div>

      {/* ── Body ── */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {!activeSection && (
          /* Main nav list */
          <div className="p-4 flex flex-col gap-4">
            {NAV_ITEMS.map((item) => {
              const { id, label, icon: ItemIcon } = item;
              const isNotesItem = id === 'notes';
              const isBookmarksItem = id === 'bookmarks';
              const isHighlightsItem = id === 'highlights';
              const isSimplifiedItem = id === 'simplified';

              let count = 0;
              if (isNotesItem) count = notes.length;
              if (isBookmarksItem) count = bookmarks.length;
              if (isHighlightsItem) count = highlights.length;
              if (isSimplifiedItem) count = simplifications.length;

              return (
                <button
                  key={id}
                  onClick={() => handleNavClick(id)}
                  className="flex items-center gap-4 p-2 rounded-2xl text-[15px] font-bold text-text-secondary bg-bg-subtle/50 hover:bg-accent-primary/5 hover:text-accent-primary transition-all text-left w-full border border-transparent hover:border-accent-primary/10 group"
                >
                  <div className="w-10 h-10 rounded-full bg-bg-elevated shadow-sm flex items-center justify-center text-text-tertiary group-hover:text-accent-primary transition-colors">
                    <ItemIcon size={20} strokeWidth={2} />
                  </div>
                  <span className="flex-1 tracking-tight">{label}</span>
                  {/* Show count badge */}
                  {(isNotesItem || isBookmarksItem || isHighlightsItem || isSimplifiedItem) && count > 0 && (
                    <span className="text-[11px] font-black bg-accent-primary text-bg-elevated rounded-full px-2.5 py-0.5 tabular-nums shadow-sm">
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {activeSection === 'toc' && (
          <div className='flex flex-col py-2'>
            {/* No outline available */}
            {(!tocOutline || tocOutline.length === 0) && (
              <div className='flex flex-col items-center justify-center py-12 px-4 text-center'>
                <div className='w-12 h-12 rounded-2xl bg-bg-subtle flex items-center justify-center mb-3'>
                  <List size={22} className='text-text-tertiary' strokeWidth={1.5} />
                </div>
                <p className='text-sm font-semibold text-text-secondary'>No Table of Contents</p>
                <p className='text-xs text-text-tertiary mt-1 max-w-[200px]'>
                  This book doesn't have an embedded table of contents.
                </p>
              </div>
            )}

            {/* Outline available */}
            {tocOutline && tocOutline.length > 0 && (
              <TocItems items={tocOutline} onJump={handleJumpTo} />
            )}
          </div>
        )}

        {/* Bookmarks section */}
        {activeSection === 'bookmarks' && (
          <BookmarksView
            bookmarks={bookmarks}
            onJumpTo={handleJumpTo}
            onRemove={onRemoveBookmark}
          />
        )}

        {/* Notes section */}
        {activeSection === 'notes' && (
          <SidebarNotesView
            notes={notes}
            addNote={addNote}
            updateNote={updateNote}
            deleteNote={deleteNote}
          />
        )}

        {/* Highlights section */}
        {activeSection === 'highlights' && (
          <HighlightsView
            highlights={highlights}
            onJumpTo={(page) => {
              onJumpToHighlight?.(page);
              pdfControls?.goToPage?.(page);
              setLeftPanel(false);
            }}
            onRemove={removeHighlight}
          />
        )}

        {/* Simplified section */}
        {activeSection === 'simplified' && (
          <SimplifiedView
            simplifications={simplifications}
            onJumpTo={(page) => {
              pdfControls?.goToPage?.(page);
              setLeftPanel(false);
            }}
            onRemove={removeSimplification}
            onViewSimplification={(s) => {
              onViewSimplification?.(s);
              setLeftPanel(false);
            }}
          />
        )}
      </div>
    </aside>
  )
}

export default LeftPanel
