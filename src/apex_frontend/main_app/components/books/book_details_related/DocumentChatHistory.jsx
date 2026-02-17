import React from 'react'

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
    },
    {
      title: "Chat 7",
      message: "Hello, how are you?"
    },
    {
      title: "Chat 8",
      message: "Hello, how are you?"
    },
    {
      title: "Chat 9",
      message: "Hello, how are you?"
    },
    {
      title: "Chat 10",
      message: "Hello, how are you?"
    }
  ]
  return (
    <div className='grid grid-cols-1 gap-4'>
        {chatHistory.map((chat, index) => (
            <div key={index} className='flex flex-col gap-2 bg-neutral-300 p-2 rounded-lg'>
                <h2 className='text-text-primary font-semibold'>{chat.title}</h2>
                <p className='text-text-tertiary'>{chat.message}</p>
            </div>
        ))}
    </div>
  )
}

export default DocumentChatHistory