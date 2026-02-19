import React from 'react'
import { X, Send } from 'lucide-react'

function AIModal({ setAiModal }) {
  return (
    <aside
      className='flex flex-col absolute inset-0 z-[200] bg-white/95 backdrop-blur-md md:relative md:inset-auto md:w-80 md:h-full md:border-l md:border-border-default md:shrink-0'
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className='flex items-center justify-between p-4 border-b border-border-default'>
        <div className='flex items-center gap-2'>
          <span className='text-accent-primary'>✦</span>
          <h2 className='text-sm font-semibold text-gray-800 tracking-wide'>Ask AI</h2>
        </div>
        <button
          onClick={() => setAiModal(false)}
          className='p-1.5 rounded-lg hover:bg-gray-100 transition-all text-gray-500'
        >
          <X size={18} strokeWidth={1.5} />
        </button>
      </div>

      {/* Body / chat area */}
      <div className='flex-1 overflow-y-auto p-4 flex flex-col gap-3'>
        <p className='text-sm text-gray-400 text-center mt-4'>Ask anything about this book…</p>
      </div>

      {/* Input */}
      <div className='p-3 border-t border-border-default'>
        <form
          className='flex items-center gap-2'
          onSubmit={(e) => e.preventDefault()}
        >
          <input
            type='text'
            placeholder='Ask AI…'
            className='flex-1 px-3 py-2 text-sm rounded-xl border border-border-default bg-white focus:outline-none focus:ring-2 focus:ring-accent-primary/30'
          />
          <button
            type='submit'
            className='p-2 rounded-xl bg-accent-primary text-white hover:bg-accent-hover transition-all active:scale-95'
          >
            <Send size={16} strokeWidth={1.5} />
          </button>
        </form>
      </div>
    </aside>
  )
}

export default AIModal