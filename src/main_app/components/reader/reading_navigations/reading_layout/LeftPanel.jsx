import React, { useState } from 'react'
import { BookOpen, List, Bookmark, X, ChevronLeft, Heart } from 'lucide-react'
import BookmarksView from './BookmarksView'
import SidebarNotesView from './SidebarNotesView'

const NAV_ITEMS = [
  { id: 'toc', icon: List, label: 'Table of Contents' },
  { id: 'notes', icon: BookOpen, label: 'Notes' },
];

function LeftPanel({ setLeftPanel, readerControls, pdfControls }) {
  const [activeSection, setActiveSection] = useState(null);

  const {
    notes = [],
    addNote,
    updateNote,
    deleteNote,
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
              const count = isNotesItem ? notes.length : 0;

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
                  {/* Show notes count badge */}
                  {isNotesItem && count > 0 && (
                    <span className="text-[11px] font-black bg-accent-primary text-bg-elevated rounded-full px-2.5 py-0.5 tabular-nums shadow-sm">
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Table of contents — placeholder */}
        {activeSection === 'toc' && (
          <div className='flex flex-col items-center justify-center py-12 px-4 text-center'>
            <div className='w-12 h-12 rounded-2xl bg-bg-subtle flex items-center justify-center mb-3'>
              <List size={22} className='text-text-tertiary' strokeWidth={1.5} />
            </div>
            <p className='text-sm font-semibold text-text-secondary'>Table of Contents</p>
            <p className='text-xs text-text-tertiary mt-1'>Coming soon</p>
          </div>
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
      </div>
    </aside>
  )
}

export default LeftPanel
