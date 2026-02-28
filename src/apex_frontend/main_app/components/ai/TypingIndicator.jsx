import React from 'react'

/**
 * TypingIndicator — Three-dot animated loader shown while AI is preparing a response.
 */
function TypingIndicator() {
  return (
    <div className='flex items-start gap-3'>
      <div className='w-8 h-8 rounded-lg bg-accent-primary flex items-center justify-center shadow-lg shadow-accent-primary/20 flex-shrink-0'>
        <span className='text-white text-xs font-bold'>A</span>
      </div>
      <div className='px-4 py-3 rounded-2xl rounded-bl-none bg-white border border-border-default shadow-sm'>
        <div className='flex items-center gap-1.5'>
          <span className='w-2 h-2 bg-accent-primary/60 rounded-full animate-bounce' style={{ animationDelay: '0ms' }}></span>
          <span className='w-2 h-2 bg-accent-primary/60 rounded-full animate-bounce' style={{ animationDelay: '150ms' }}></span>
          <span className='w-2 h-2 bg-accent-primary/60 rounded-full animate-bounce' style={{ animationDelay: '300ms' }}></span>
        </div>
      </div>
    </div>
  )
}

export default TypingIndicator
