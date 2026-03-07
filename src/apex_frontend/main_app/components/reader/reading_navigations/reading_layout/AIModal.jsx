import React, { useState, useRef, useEffect, useMemo } from 'react'
import { X, Send, Sparkle, Info, RotateCcw, Trash2, AlertCircle, Highlighter, User, SquarePen, MessageSquare, History, ArrowLeft } from 'lucide-react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import useAIChat from '../../../../hooks/useAIChat'
import TypingIndicator from '../../../ai/TypingIndicator'

function AIModal({ setAiModal, selectedText, bookTitle }) {
  const {
    messages,
    isStreaming,
    error,
    sessionId,
    chatHistory,
    sendMessage,
    createNewChat,
    switchChat,
    deleteSession,
    retry,
  } = useAIChat({ autoLoad: true, persist: true, scope: bookTitle });

  const [inputValue, setInputValue] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const chatContainerRef = useRef(null);
  const inputRef = useRef(null);

  // Suggestions for the user
  const suggestions = [
    "Summarize this page",
    "Explain the key concept",
    "Give me examples",
    "Define technical terms"
  ];

  // State for active context
  const [activeContext, setActiveContext] = useState(selectedText);

  // Auto-scroll to bottom
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isStreaming, showHistory]);

  const handleSend = (input) => {
    if (input && typeof input !== 'string') input.preventDefault();
    
    const displayContent = typeof input === 'string' ? input : inputValue.trim();
    if (!displayContent || isStreaming) return;

    let fullPrompt = displayContent;
    if (activeContext) {
      fullPrompt = `I'm asking about this text: "${activeContext}"\n\nMy question: ${displayContent}`;
    }

    sendMessage(fullPrompt, bookTitle, displayContent);
    setInputValue('');
    if (inputRef.current) {
      inputRef.current.style.height = '44px';
    }
  };

  const handleSwitchChat = (chat) => {
    switchChat(chat);
    setShowHistory(false);
  };

  const handleNewChat = () => {
    createNewChat();
    setShowHistory(false);
  };

  // Format time for message timestamps
  const formatTime = (id) => {
    const date = new Date(id);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Group history by date (simplified for modal)
  const groupedHistory = useMemo(() => {
    const groups = { today: [], persistent: [] };
    const today = new Date().setHours(0, 0, 0, 0);
    chatHistory.forEach(chat => {
      const chatDate = new Date(chat.updatedAt).setHours(0, 0, 0, 0);
      if (chatDate === today) groups.today.push(chat);
      else groups.persistent.push(chat);
    });
    return groups;
  }, [chatHistory]);

  return (
    <aside
      className='flex flex-col absolute inset-0 z-[200] bg-slate-50 md:relative md:inset-auto md:w-96 md:h-full md:border-l border-slate-200 md:shrink-0 shadow-2xl md:shadow-none animate-in slide-in-from-right duration-300 font-sans'
      onClick={(e) => e.stopPropagation()}
    >
      {/* ── Header ── */}
      <div className='flex items-center justify-between px-4 py-4 border-b border-slate-200 bg-white z-10 flex-shrink-0'>
        <div className='flex items-center gap-2'>
          <button
            onClick={() => showHistory ? setShowHistory(false) : setAiModal(false)}
            className='p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500'
          >
            {showHistory ? <ArrowLeft size={18} /> : <X size={18} />}
          </button>
          {!showHistory && (
            <button
              onClick={() => setShowHistory(true)}
              className='p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500'
              title='Chat History'
            >
              <History size={18} />
            </button>
          )}
        </div>

        <h2 className='text-[11px] font-bold text-slate-900 uppercase tracking-[0.2em]'>
          {showHistory ? 'History' : 'Apex Intelligence'}
        </h2>

        <button
          onClick={handleNewChat}
          className='p-2 hover:bg-slate-100 rounded-lg transition-colors text-accent-primary'
          title='New Chat'
        >
          <SquarePen size={18} />
        </button>
      </div>

      {/* ── Main Area ── */}
      <div
        ref={chatContainerRef}
        className='flex-1 overflow-y-auto custom-scrollbar p-4 flex flex-col gap-6 relative'
      >
        {showHistory ? (
          /* ── History View ── */
          <div className='flex flex-col gap-6 animate-in fade-in duration-300'>
             {Object.entries(groupedHistory).map(([key, items]) => (
                items.length > 0 && (
                    <div key={key} className='flex flex-col gap-1'>
                        <h3 className='px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2'>
                            {key === 'today' ? 'Today' : 'Previous'}
                        </h3>
                        {items.map(item => (
                            <div 
                                key={item.id}
                                onClick={() => handleSwitchChat(item)}
                                className={`group relative flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer transition-all ${sessionId === item.id ? 'bg-blue-50 text-blue-700 font-medium' : 'hover:bg-white border border-transparent hover:border-slate-200 text-slate-600 shadow-sm'}`}
                            >
                                <MessageSquare size={14} className={sessionId === item.id ? 'text-accent-primary' : 'text-slate-400'} />
                                <span className='flex-1 truncate text-xs'>{item.title || 'New Chat'}</span>
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        deleteSession(item.id);
                                    }}
                                    className='p-1.5 hover:bg-red-50 rounded-lg transition-all text-slate-300 hover:text-red-500 md:opacity-0 group-hover:opacity-100'
                                    title="Delete chat"
                                >
                                    <Trash2 size={12} />
                                </button>
                            </div>
                        ))}
                    </div>
                )
             ))}
          </div>
        ) : (
          /* ── Messages View ── */
          <>
            {messages.length === 0 ? (
              <div className='flex flex-col items-center justify-center py-16 text-center animate-in fade-in zoom-in duration-700'>
                <div className='w-20 h-20 bg-gradient-to-br from-purple-50 to-purple-100 text-accent-primary rounded-[2rem] flex items-center justify-center mb-8 shadow-2xl shadow-purple-50/50 ring-4 ring-white animate-pulse'>
                    <Sparkle size={40} fill="currentColor" />
                </div>
                <h2 className='text-3xl font-extrabold mb-4 tracking-tight text-slate-900 font-serif italic'>Apex Intelligence</h2>
                <p className='text-slate-500 text-sm leading-relaxed max-w-[240px] mx-auto font-medium'>
                    Deep context analysis session for <span className='text-accent-primary'>"{bookTitle || 'this book'}"</span>.
                </p>

                <div className='grid grid-cols-1 gap-2.5 mt-12 w-full max-w-[280px]'>
                    {suggestions.map((text, i) => (
                        <button
                            key={i}
                            onClick={() => handleSend(text)}
                            className='w-full px-5 py-4 rounded-2xl bg-white border border-slate-200 text-xs text-slate-700 hover:border-accent-primary hover:text-accent-primary hover:bg-purple-50/50 transition-all duration-300 text-left font-bold shadow-sm hover:translate-x-1 group'
                        >
                            <span className='group-hover:mr-2 transition-all opacity-0 group-hover:opacity-100 text-accent-primary'>→</span>
                            {text}
                        </button>
                    ))}
                </div>
              </div>
            ) : (
              messages.map((msg, index) => (
                <div
                  key={msg.id || index}
                  className={`flex flex-col gap-2 animate-in slide-in-from-bottom-2 duration-500 w-full ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div className={`flex items-center gap-2 mb-1 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-sm border ${msg.role === 'user' ? 'bg-white border-slate-200 text-slate-600' : 'bg-accent-primary border-purple-500 text-white'}`}>
                      {msg.role === 'user' ? <User size={14} /> : <Sparkle size={14} fill="currentColor" />}
                    </div>
                    <span className='text-[10px] font-bold text-slate-400 uppercase tracking-widest'>
                      {msg.role === 'ai' ? 'Apex AI' : 'You'}
                    </span>
                  </div>

                  <div className={`flex flex-col w-full ${msg.role === 'user' ? 'items-end' : 'items-center'}`}>
                    <div className={`max-w-[95%] px-6 py-5 text-[15px] leading-relaxed ${msg.role === 'user'
                      ? 'bg-slate-900 text-white rounded-3xl rounded-tr-none shadow-sm ring-1 ring-slate-800'
                      : 'bg-white text-slate-800'
                    }`}>
                      {msg.role === 'ai' ? (
                        <div className='prose prose-sm max-w-none prose-p:my-4 prose-headings:mt-6 prose-headings:mb-3 prose-li:my-2 prose-strong:text-inherit prose-code:text-accent-primary prose-pre:bg-slate-50 prose-pre:border prose-pre:border-slate-100 prose-table:my-6 prose-table:w-full prose-table:border-collapse prose-table:border prose-table:border-slate-200 prose-th:bg-slate-50 prose-th:p-3 prose-th:border prose-th:border-slate-200 prose-td:p-3 prose-td:border prose-td:border-slate-100'>
                          {msg.content ? (
                            <Markdown remarkPlugins={[remarkGfm]}>{msg.content}</Markdown>
                          ) : (
                            isStreaming && <TypingIndicator />
                          )}
                        </div>
                      ) : (
                        <p className='whitespace-pre-wrap'>{msg.content}</p>
                      )}
                    </div>
                    {msg.role === 'ai' && (
                        <p className='text-[9px] text-slate-400 font-bold tracking-tight uppercase text-center mt-3 opacity-60'>
                            This is AI and can make mistake double-check your answers
                        </p>
                    )}
                    <span className={`text-[9px] text-slate-400 mt-2 font-medium tracking-wide px-2 ${msg.role === 'ai' ? 'text-center' : ''}`}>
                      {msg.id ? formatTime(msg.id) : '--:--'}
                    </span>
                  </div>
                </div>
              ))
            )}

            {error && (
              <div className='flex items-start gap-3 p-5 bg-red-50 border border-red-100 rounded-3xl animate-in fade-in'>
                <div className='w-10 h-10 bg-red-100 text-red-600 rounded-xl flex items-center justify-center flex-shrink-0'>
                  <AlertCircle size={20} />
                </div>
                <div className='flex-1'>
                  <p className='text-xs text-red-700 font-bold uppercase tracking-wider'>System Error</p>
                  <p className='text-[11px] text-red-600 mt-1'>{error}</p>
                  <button onClick={retry} className='mt-3 text-[10px] text-red-600 hover:text-red-800 font-extrabold flex items-center gap-1.5 uppercase tracking-widest bg-white px-3 py-1.5 rounded-lg border border-red-100 shadow-sm'>
                    <RotateCcw size={12} /> Reconnect
                  </button>
                </div>
              </div>
            )}
            <div className='h-8' />
          </>
        )}
      </div>

      {/* ── Selection Context Pin ── */}
      {!showHistory && activeContext && (
        <div className='px-4 pb-3 flex-shrink-0'>
           <div className='bg-white border-2 border-purple-50 rounded-2xl p-4 relative group shadow-xl shadow-purple-50/20 animate-in slide-in-from-bottom-2 duration-300'>
              <div className='flex items-center justify-between mb-3'>
                <span className='text-[10px] font-bold text-accent-primary uppercase tracking-[0.15em] flex items-center gap-2'>
                  <span className='w-1.5 h-1.5 rounded-full bg-accent-primary animate-pulse'></span>
                  Live Context
                </span>
                <button 
                  onClick={() => setActiveContext(null)}
                  className='p-1.5 hover:bg-slate-50 rounded-lg text-slate-300 hover:text-red-500 transition-all'
                >
                  <X size={14} />
                </button>
              </div>
              <p className='text-[12px] text-slate-600 leading-relaxed italic line-clamp-3 pl-3 border-l-2 border-blue-100'>
                "{activeContext}"
              </p>
           </div>
        </div>
      )}

        {/* ── Input ── */}
      {!showHistory && (
        <div className='p-4 relative flex-shrink-0'>
          <form
            onSubmit={handleSend}
            className={`flex flex-col gap-3 transition-all duration-300 ${isStreaming ? 'opacity-60' : 'opacity-100'}`}
          >
            <div className={`relative flex items-end gap-2 bg-slate-100 border-2 border-slate-100 p-2 pr-3 focus-within:border-accent-primary focus-within:bg-white focus-within:shadow-lg focus-within:shadow-purple-50 transition-all duration-300 ${inputValue.split('\n').length > 1 || (inputRef.current && inputRef.current.scrollHeight > 56) ? 'rounded-[28px]' : 'rounded-full'}`}>
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 150)}px`;
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder={isStreaming ? 'Generating insights...' : 'Ask about this book?'}
                disabled={isStreaming}
                rows={1}
                className='flex-1 bg-transparent px-4 py-3 focus:outline-none text-[15px] text-slate-800 placeholder-slate-400 resize-none max-h-40 custom-scrollbar leading-relaxed'
                style={{ height: '44px' }}
              />
              <button
                type='submit'
                disabled={!inputValue.trim() || isStreaming}
                className={`p-3 rounded-full transition-all duration-300 flex items-center justify-center flex-shrink-0 self-end mb-0.5 ${inputValue.trim() && !isStreaming
                  ? 'bg-accent-primary text-white shadow-xl shadow-purple-300 hover:scale-110 active:scale-95'
                  : 'bg-slate-300 text-slate-400 cursor-not-allowed'
                  }`}
              >
                <Send size={20} />
              </button>
            </div>
          </form>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
          .custom-scrollbar::-webkit-scrollbar {
              width: 4px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
              background: transparent;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
              background: #e2e8f0;
              border-radius: 10px;
          }
      `}} />
    </aside>
  )
}

export default AIModal
