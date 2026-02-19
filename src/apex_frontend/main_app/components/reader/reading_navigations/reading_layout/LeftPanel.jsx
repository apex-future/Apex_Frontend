import React from 'react'
import { BookOpen, List, Bookmark, X } from 'lucide-react'

function LeftPanel({ setLeftPanel }) {
  return (
    <aside
      className='flex flex-col absolute inset-0 z-[200] bg-white/95 backdrop-blur-md md:relative md:inset-auto md:w-64 md:h-full md:border-r md:border-border-default md:shrink-0'
      onClick={(e) => e.stopPropagation()}
    >
      <div className='flex items-center justify-between p-4 border-b border-border-default'>
        <h2 className='text-sm font-semibold text-gray-700 tracking-wide uppercase'>Contents</h2>
        <button
          onClick={() => setLeftPanel(false)}
          className='p-1.5 rounded-lg hover:bg-gray-100 transition-all text-gray-500'
        >
          <X size={16} strokeWidth={1.5} />
        </button>
      </div>
      <div className='flex-1 overflow-y-auto p-3 flex flex-col gap-1'>
        {[
          { icon: List, label: 'Table of Contents' },
          { icon: Bookmark, label: 'Bookmarks' },
          { icon: BookOpen, label: 'Annotations' },
        ].map(({ icon: Icon, label }) => (
          <button
            key={label}
            className='flex items-center gap-3 p-2.5 rounded-xl text-sm text-gray-600 hover:bg-accent-primary/10 hover:text-accent-primary transition-all text-left w-full'
          >
            <Icon size={16} strokeWidth={1.5} />
            {label}
          </button>
        ))}
      </div>
    </aside>
  )
}

export default LeftPanel
