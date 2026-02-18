import React from 'react'
import EmptyState from '../../layout/placeholders/EmptyState';

function DocumentChatHistory() {

  let chatHistory = [
    {
      title: "Chat 1",
      message: "Hello, how are you?"
    },
    {
      title: "Chat 2",
      message: "Hello, how are you?"
    },
    {
      title: "Chat 3",
      message: "Hello, how are you?"
    },
    {
      title: "Chat 4",
      message: "Hello, how are you?"
    },
    {
      title: "Chat 5",
      message: "Hello, how are you?"
    },
    {
      title: "Chat 6",
      message: "Hello, how are you?"
    }
  ]

  // Uncomment to test empty state
  // chatHistory = [];

  if (!chatHistory || chatHistory.length === 0) {
      return <EmptyState itemName="chat history" />;
  }

  return (
    <div className='grid grid-cols-1 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500'>
        {chatHistory.map((chat, index) => (
            <div key={index} className='flex flex-col gap-2 p-4 bg-white border  border-border-default rounded-xl hover:shadow-sm transition-all cursor-pointer group'>
                <h2 className='text-text-primary font-semibold group-hover:text-accent-primary transition-colors'>{chat.title}</h2>
                <p className='text-text-tertiary line-clamp-2'>{chat.message}</p>
            </div>
        ))}
    </div>
  )
}

export default DocumentChatHistory