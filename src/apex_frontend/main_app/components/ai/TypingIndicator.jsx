import React from 'react'

/**
 * TypingIndicator — Three-dot animated loader shown while AI is preparing a response.
 */
function TypingIndicator({ small = false }) {
  if (small) {
    return (
      <div className='flex items-center gap-1.5 ml-1'>
        <span className='w-1 h-1 bg-current rounded-full animate-bounce' style={{ animationDelay: '0ms' }}></span>
        <span className='w-1 h-1 bg-current rounded-full animate-bounce' style={{ animationDelay: '150ms' }}></span>
        <span className='w-1 h-1 bg-current rounded-full animate-bounce' style={{ animationDelay: '300ms' }}></span>
      </div>
    );
  }

  return (
    <div className='flex gap-1.5 py-1'>
      <span className='w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce' style={{ animationDelay: '0ms' }}></span>
      <span className='w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce' style={{ animationDelay: '150ms' }}></span>
      <span className='w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce' style={{ animationDelay: '300ms' }}></span>
    </div>
  )
}


export default TypingIndicator
