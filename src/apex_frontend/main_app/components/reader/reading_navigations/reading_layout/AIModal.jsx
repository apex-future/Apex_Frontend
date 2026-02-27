import React, { useState, useRef, useEffect } from 'react'
import { X, Send, Sparkles, Info } from 'lucide-react'

function AIModal({ setAiModal }) {
  const [messages, setMessages] = useState([
    { id: 1, role: 'ai', content: "Hello! I'm your Apex Assistant. I've analyzed this book—ask me anything about its themes, characters, or specific chapters." }
  ]);
  const [inputValue, setInputValue] = useState('');
  const chatContainerRef = useRef(null);

  // Suggestions for the user
  const suggestions = [
    "Summarize this page",
    "Explain the key concept",
    "List main characters",
    "Define technical terms"
  ];

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    // Add user message
    const newMessage = { id: Date.now(), role: 'user', content: inputValue };
    setMessages(prev => [...prev, newMessage]);
    setInputValue('');

    // Simulate AI response
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'ai',
        content: "That's a great question. Based on the current page, the author emphasizes the importance of focus and environment in deep work. Would you like a more detailed breakdown?"
      }]);
    }, 1000);
  };

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <aside
      className='flex flex-col absolute inset-0 z-[200] bg-white md:relative md:inset-auto md:w-96 md:h-full md:border-l md:border-border-default md:shrink-0 shadow-2xl md:shadow-none'
      onClick={(e) => e.stopPropagation()}
    >
      {/* ── Premium Header ── */}
      <div className='flex items-center justify-between p-5 border-b border-border-default/60 bg-gradient-to-r from-accent-subtle/30 to-white'>
        <div className='flex items-center gap-3'>
          <div className='w-8 h-8 rounded-lg bg-accent-primary flex items-center justify-center shadow-lg shadow-accent-primary/20'>
            <Sparkles size={18} className='text-white' />
          </div>
          <div>
            <h2 className='text-sm font-bold text-gray-900 tracking-tight'>Apex AI</h2>
            <div className='flex items-center gap-1.5'>
              <span className='w-1.5 h-1.5 rounded-full bg-success animate-pulse'></span>
              <span className='text-[10px] font-medium text-text-tertiary uppercase tracking-wider'>Always Learning</span>
            </div>
          </div>
        </div>
        <button
          onClick={() => setAiModal(false)}
          className='p-2 rounded-xl hover:bg-gray-100 transition-all text-gray-400 hover:text-gray-600'
        >
          <X size={20} strokeWidth={1.5} />
        </button>
      </div>

      {/* ── Chat Content area ── */}
      <div
        ref={chatContainerRef}
        className='flex-1 overflow-y-auto p-5 flex flex-col gap-5 bg-neutral-50/30'
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div className={`
              max-w-[85%] px-4 py-3 rounded-2xl text-[13px] leading-relaxed shadow-sm
              ${msg.role === 'user'
                ? 'bg-accent-primary text-white rounded-br-none font-medium'
                : 'bg-white text-gray-800 border border-border-default rounded-bl-none'}
            `}>
              {msg.content}
            </div>
          </div>
        ))}
      </div>

      {/* ── Suggested Actions (Only show if no user messages yet or as a tray) ── */}
      {messages.length === 1 && (
        <div className='px-5 py-3 flex flex-wrap gap-2 animate-in fade-in slide-in-from-bottom-2 duration-700'>
          {suggestions.map((text, i) => (
            <button
              key={i}
              onClick={() => setInputValue(text)}
              className='px-3 py-1.5 rounded-full bg-white border border-border-default text-xs text-text-secondary hover:border-accent-primary hover:text-accent-primary hover:bg-accent-subtle/20 transition-all duration-300 shadow-sm'
            >
              {text}
            </button>
          ))}
        </div>
      )}

      {/* ── Input Group ── */}
      <div className='p-4 pt-2 border-t border-border-default/60 bg-white'>
        <form
          className='relative flex items-center gap-2 group'
          onSubmit={handleSend}
        >
          <div className='relative flex-1 group'>
            <input
              type='text'
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder='Ask anything...'
              className='w-full pl-4 pr-12 py-3.5 text-sm rounded-2xl border border-border-default bg-neutral-50/50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-accent-primary/10 focus:border-accent-primary transition-all pr-14'
            />
            <button
              type='submit'
              disabled={!inputValue.trim()}
              className={`
                    absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-xl transition-all duration-300
                    ${inputValue.trim()
                  ? 'bg-accent-primary text-white shadow-lg shadow-accent-primary/30 scale-100'
                  : 'bg-neutral-200 text-neutral-400 scale-90 opacity-50 cursor-not-allowed'}
                `}
            >
              <Send size={18} strokeWidth={2} />
            </button>
          </div>
        </form>
        <p className='text-[10px] text-center text-text-tertiary mt-3 flex items-center justify-center gap-1.5'>
          <Info size={10} />
          Insights powered by Apex Intelligence
        </p>
      </div>
    </aside>
  )
}

export default AIModal
