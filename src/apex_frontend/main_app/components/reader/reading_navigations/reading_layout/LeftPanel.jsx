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
      className="flex flex-col absolute inset-0 z-[200] bg-white md:relative md:inset-auto md:w-80 md:h-full md:border-r md:border-slate-100 md:shrink-0 font-sans shadow-2xl md:shadow-none"
      onClick={(e) => e.stopPropagation()}
    >
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-5 py-5 border-b border-slate-50 shrink-0">
        {activeSection ? (
          /* Back to main nav when inside a section */
          <button
            onClick={() => setActiveSection(null)}
            className="flex items-center gap-2 text-base font-bold text-slate-800 hover:text-accent-primary transition-colors"
          >
            <ChevronLeft size={18} strokeWidth={2.5} />
            {NAV_ITEMS.find(n => n.id === activeSection)?.label}
          </button>
        ) : (
          <h2 className="text-xs font-black text-slate-400 tracking-[0.2em] uppercase">Contents</h2>
        )}
        <button
          onClick={() => setLeftPanel(false)}
          className="p-2 rounded-full bg-slate-50 hover:bg-slate-100 transition-all text-slate-400 hover:text-slate-600"
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
              const isBookmarksItem = id === 'bookmarks';
              const count = isBookmarksItem ? bookmarks.length : 0;

              return (
                <button
                  key={id}
                  onClick={() => handleNavClick(id)}
                  className="flex items-center gap-4 p-2 rounded-2xl text-[15px] font-bold text-slate-700 bg-slate-50/50 hover:bg-accent-primary/5 hover:text-accent-primary transition-all text-left w-full border border-transparent hover:border-accent-primary/10 group"
                >
                  <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-400 group-hover:text-accent-primary transition-colors">
                    <ItemIcon size={20} strokeWidth={2} />
                  </div>
                  <span className="flex-1 tracking-tight">{label}</span>
                  {/* Show bookmark count badge */}
                  {isBookmarksItem && count > 0 && (
                    <span className="text-[11px] font-black bg-accent-primary text-white rounded-full px-2.5 py-0.5 tabular-nums shadow-sm">
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
