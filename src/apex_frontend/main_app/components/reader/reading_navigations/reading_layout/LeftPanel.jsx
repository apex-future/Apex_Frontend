import React, { useState } from 'react'
import { BookOpen, List, Bookmark, X, ChevronLeft } from 'lucide-react'
import BookmarksView from './BookmarksView'

const NAV_ITEMS = [
  { id: 'toc', icon: List, label: 'Table of Contents' },
  { id: 'bookmarks', icon: Bookmark, label: 'Bookmarks' },
  { id: 'annotations', icon: BookOpen, label: 'Annotations' },
];

function LeftPanel({ setLeftPanel, readerControls, pdfControls }) {
  const [activeSection, setActiveSection] = useState(null);

  const {
    bookmarks = [],
    onRemoveBookmark,
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
      className='flex flex-col absolute inset-0 z-[200] bg-white/97 backdrop-blur-md md:relative md:inset-auto md:w-72 md:h-full md:border-r md:border-border-default md:shrink-0'
      onClick={(e) => e.stopPropagation()}
    >
      {/* ── Header ── */}
      <div className='flex items-center justify-between px-4 py-3 border-b border-border-default shrink-0'>
        {activeSection ? (
          /* Back to main nav when inside a section */
          <button
            onClick={() => setActiveSection(null)}
            className='flex items-center gap-1.5 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors'
          >
            <ChevronLeft size={16} strokeWidth={2} />
            {NAV_ITEMS.find(n => n.id === activeSection)?.label}
          </button>
        ) : (
          <h2 className='text-sm font-semibold text-gray-700 tracking-wide uppercase'>Contents</h2>
        )}
        <button
          onClick={() => setLeftPanel(false)}
          className='p-1.5 rounded-lg hover:bg-gray-100 transition-all text-gray-500'
        >
          <X size={16} strokeWidth={1.5} />
        </button>
      </div>

      {/* ── Body ── */}
      <div className='flex-1 overflow-y-auto'>
        {!activeSection && (
          /* Main nav list */
          <div className='p-3 flex flex-col gap-1'>
            {NAV_ITEMS.map(({ id, icon: Icon, label }) => {
              const isBookmarksItem = id === 'bookmarks';
              const count = isBookmarksItem ? bookmarks.length : 0;

              return (
                <button
                  key={id}
                  onClick={() => handleNavClick(id)}
                  className='flex items-center gap-3 p-2.5 rounded-xl text-sm text-gray-600 hover:bg-accent-primary/10 hover:text-accent-primary transition-all text-left w-full'
                >
                  <Icon size={16} strokeWidth={1.5} />
                  <span className='flex-1'>{label}</span>
                  {/* Show bookmark count badge */}
                  {isBookmarksItem && count > 0 && (
                    <span className='text-[10px] font-bold bg-accent-primary/15 text-accent-primary rounded-full px-2 py-0.5 tabular-nums'>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
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

        {/* Table of contents — placeholder */}
        {activeSection === 'toc' && (
          <div className='flex flex-col items-center justify-center py-12 px-4 text-center'>
            <div className='w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mb-3'>
              <List size={22} className='text-gray-400' strokeWidth={1.5} />
            </div>
            <p className='text-sm font-semibold text-gray-500'>Table of Contents</p>
            <p className='text-xs text-gray-400 mt-1'>Coming soon</p>
          </div>
        )}

        {/* Annotations — placeholder */}
        {activeSection === 'annotations' && (
          <div className='flex flex-col items-center justify-center py-12 px-4 text-center'>
            <div className='w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mb-3'>
              <BookOpen size={22} className='text-gray-400' strokeWidth={1.5} />
            </div>
            <p className='text-sm font-semibold text-gray-500'>Annotations</p>
            <p className='text-xs text-gray-400 mt-1'>Coming soon</p>
          </div>
        )}
      </div>
    </aside>
  )
}

export default LeftPanel
