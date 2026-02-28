import React, { useState, useRef, useEffect } from 'react'
import { X, Send, Sparkles, Info, RotateCcw, Trash2, AlertCircle } from 'lucide-react'
import Markdown from 'react-markdown'
import useAIChat from '../../../../hooks/useAIChat'
import TypingIndicator from '../../../ai/TypingIndicator'

function AIModal({ setAiModal, selectedText, bookTitle }) {
  const {
    messages,
    isStreaming,
    error,
    sendMessage,
    sendExplain,
    clearConversation,
    retry,
  } = useAIChat();

  const [inputValue, setInputValue] = useState('');
  const chatContainerRef = useRef(null);
  const hasTriggeredExplain = useRef(false);

  // Suggestions for the user
  const suggestions = [
    "Summarize this page",
    "Explain the key concept",
    "Give me examples",
    "Define technical terms"
  ];

  // Auto-trigger explain when component mounts with selectedText
  useEffect(() => {
    if (selectedText && !hasTriggeredExplain.current) {
      hasTriggeredExplain.current = true;
      sendExplain(selectedText, null, bookTitle);
    }
  }, [selectedText, bookTitle, sendExplain]);

  // Auto-scroll to bottom as new content streams in
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isStreaming]);

  const handleSend = (e) => {
    e?.preventDefault();
    if (!inputValue.trim() || isStreaming) return;
    sendMessage(inputValue.trim(), bookTitle);
    setInputValue('');
  };

  const handleSuggestionClick = (text) => {
    if (isStreaming) return;
    sendMessage(text, bookTitle);
  };

  // Format time for message timestamps
  const formatTime = (id) => {
    const date = new Date(id);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <aside
      className='flex flex-col absolute inset-0 z-[200] bg-white md:relative md:inset-auto md:w-96 md:h-full md:border-l md:border-border-default md:shrink-0 shadow-2xl md:shadow-none animate-in slide-in-from-right duration-300'
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
              <span className='text-[10px] font-medium text-text-tertiary uppercase tracking-wider'>
                {isStreaming ? 'Thinking...' : 'Always Learning'}
              </span>
            </div>
          </div>
        </div>
        <div className='flex items-center gap-1'>
          {messages.length > 0 && (
            <button
              onClick={clearConversation}
              className='p-2 rounded-xl hover:bg-gray-100 transition-all text-gray-400 hover:text-gray-600'
              title='New conversation'
            >
              <Trash2 size={16} strokeWidth={1.5} />
            </button>
          )}
          <button
            onClick={() => setAiModal(false)}
            className='p-2 rounded-xl hover:bg-gray-100 transition-all text-gray-400 hover:text-gray-600'
          >
            <X size={20} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* ── Chat Content area ── */}
      <div
        ref={chatContainerRef}
        className='flex-1 overflow-y-auto p-5 flex flex-col gap-4 bg-neutral-50/30'
      >
        {/* Highlighted text quote block */}
        {selectedText && (
          <div className='bg-accent-subtle/20 border border-accent-primary/20 rounded-xl p-4 mb-2 animate-in fade-in duration-500'>
            <p className='text-[11px] font-semibold text-accent-primary uppercase tracking-wider mb-2 flex items-center gap-1.5'>
              💬 You highlighted:
            </p>
            <p className='text-[13px] text-gray-700 leading-relaxed italic'>
              "{selectedText}"
            </p>
          </div>
        )}

        {/* Messages */}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-end gap-2.5 animate-in fade-in duration-300 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            {/* Avatar for AI messages */}
            {msg.role === 'ai' && (
              <div className='w-7 h-7 rounded-lg bg-accent-primary flex items-center justify-center flex-shrink-0 shadow-sm'>
                <span className='text-white text-[10px] font-bold'>A</span>
              </div>
            )}

            <div className='flex flex-col max-w-[85%]'>
              <div className={`
                px-4 py-3 rounded-2xl text-[13px] leading-relaxed shadow-sm
                ${msg.role === 'user'
                  ? 'bg-accent-primary text-white rounded-br-none font-medium'
                  : 'bg-white text-gray-800 border border-border-default rounded-bl-none'}
              `}>
                {msg.role === 'ai' ? (
                  <div className='prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0.5 prose-headings:my-2 prose-strong:text-gray-900'>
                    {msg.content ? (
                      <Markdown>{msg.content}</Markdown>
                    ) : (
                      isStreaming && <span className='text-gray-400 text-xs'>Thinking...</span>
                    )}
                  </div>
                ) : (
                  msg.content
                )}
              </div>
              <span className='text-[10px] text-text-tertiary mt-1 px-1'>
                {formatTime(msg.id)}
              </span>
            </div>
          </div>
        ))}

        {/* Typing indicator when streaming starts but no content yet */}
        {isStreaming && messages.length > 0 && messages[messages.length - 1]?.role === 'ai' && messages[messages.length - 1]?.content === '' && (
          <TypingIndicator />
        )}

        {/* Error state */}
        {error && (
          <div className='flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl animate-in fade-in'>
            <AlertCircle size={16} className='text-red-500 mt-0.5 flex-shrink-0' />
            <div className='flex-1'>
              <p className='text-xs text-red-700'>Hmm, something went wrong. Please try again.</p>
              <button
                onClick={retry}
                className='mt-2 text-xs text-red-600 hover:text-red-800 font-medium flex items-center gap-1'
              >
                <RotateCcw size={12} /> Retry
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Suggested Actions ── */}
      {messages.length === 0 && !selectedText && (
        <div className='px-5 py-3 flex flex-wrap gap-2 animate-in fade-in slide-in-from-bottom-2 duration-700'>
          {suggestions.map((text, i) => (
            <button
              key={i}
              onClick={() => handleSuggestionClick(text)}
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
              placeholder={isStreaming ? 'AI is responding...' : 'Ask a follow-up...'}
              disabled={isStreaming}
              className='w-full pl-4 pr-12 py-3.5 text-sm rounded-2xl border border-border-default bg-neutral-50/50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-accent-primary/10 focus:border-accent-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed'
            />
            <button
              type='submit'
              disabled={!inputValue.trim() || isStreaming}
              className={`
                    absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-xl transition-all duration-300
                    ${inputValue.trim() && !isStreaming
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
