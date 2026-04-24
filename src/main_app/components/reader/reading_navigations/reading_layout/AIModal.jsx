import React, { useState, useRef, useEffect, useMemo } from 'react'
import { X, Send, Sparkle, Info, RotateCcw, Trash2, AlertCircle, Highlighter, User, SquarePen, MessageSquare, History, ArrowLeft, BookOpen } from 'lucide-react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import useAIChat from '../../../../hooks/useAIChat'
import useStudyStore from '../../../../store/studyStore'
import apiClient from '../../../../services/apiClient'
import TypingIndicator from '../../../ai/TypingIndicator'
import Orb from '../../../ui/Orb'

function AIModal({ setAiModal, selectedText, bookTitle, bookId, currentPage, numPages, examName }) {
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
  } = useAIChat({ autoLoad: true, persist: true, scope: bookTitle, bookId });

  // Cleo context state
  const examNameFromStore = useStudyStore(state => state.examName);
  const resolvedExamName = examName || examNameFromStore || 'your exam';
  const [chips, setChips] = useState([
      "Explain this concept",
      "How does this relate to my exam?",
      "Break this down simply"
  ]);
  const [chipsLoading, setChipsLoading] = useState(false);
  const chipsCache = useRef({});
  const pageTextRef = useRef('');

  const [inputValue, setInputValue] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const chatContainerRef = useRef(null);
  const inputRef = useRef(null);

  // State for active context
  const [activeContext, setActiveContext] = useState(selectedText);

  // Extract current page text from PDF text layer and generate chips after 3s
  useEffect(() => {
      if (!currentPage) return;
      const cacheKey = `${bookId}-${currentPage}`;

      // Use cached chips if available
      if (chipsCache.current[cacheKey]) {
          setChips(chipsCache.current[cacheKey]);
          return;
      }

      // Extract visible page text from DOM
      const extractPageText = () => {
          const pageWrappers = document.querySelectorAll('.pdf-page-wrapper');
          let text = '';
          pageWrappers.forEach(wrapper => {
              const pageIdx = parseInt(wrapper.dataset.pageIndex, 10);
              if (pageIdx === currentPage) {
                  const textLayer = wrapper.querySelector('.react-pdf__Page__textContent');
                  if (textLayer) text = textLayer.innerText || textLayer.textContent || '';
              }
          });
          return text.slice(0, 1500);
      };

      const timer = setTimeout(async () => {
          const pageText = extractPageText();
          if (!pageText || pageText.length < 50) return;
          pageTextRef.current = pageText;

          setChipsLoading(true);
          try {
              const response = await apiClient.post('/api/ai/chips', {
                  page_text: pageText,
                  book_title: bookTitle,
                  exam_type: resolvedExamName,
              });
              const newChips = response.data?.chips || chips;
              chipsCache.current[cacheKey] = newChips;
              setChips(newChips);
              if (import.meta.env.DEV) console.log('[Apex Cleo] Chips generated for page', currentPage, newChips);
          } catch (err) {
              if (import.meta.env.DEV) console.error('[Apex Cleo] Chips generation failed:', err);
              // Keep fallback chips — do not show error to user
          } finally {
              setChipsLoading(false);
          }
      }, 3000);

      return () => clearTimeout(timer);
  }, [currentPage, bookId]);

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

    // Inject page context if available
    const pageContext = pageTextRef.current
        ? `\n\nCurrent page content:\n<page>\n${pageTextRef.current}\n</page>`
        : '';

    // Inject exam type
    const examContext = resolvedExamName !== 'your exam'
        ? `\n\nStudent is preparing for: ${resolvedExamName}`
        : '';

    if (activeContext) {
      const sanitizedContext = activeContext.replace(/<\/context>/g, '&lt;/context&gt;');
      fullPrompt = `I am asking about the following highlighted text:\n\n<context>\n${sanitizedContext}\n</context>${pageContext}${examContext}\n\nMy Question: ${displayContent}`;
    } else {
      fullPrompt = `${displayContent}${pageContext}${examContext}`;
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

  const cleoHeaders = useMemo(() => [
      `Ready to dig into "${bookTitle}"?`,
      `"${bookTitle}" — let's get into it.`,
      `Got questions about "${bookTitle}"? I'm here.`,
      `I've got "${bookTitle}" open. What do you need?`,
      `Let's make sense of "${bookTitle}" together.`,
      `"${bookTitle}" is a good one. What's on your mind?`,
      `Working through "${bookTitle}"? Ask me anything.`,
      `I'm with you on "${bookTitle}". Where do you want to start?`,
  ], [bookTitle]);

  const cleoHeader = useMemo(() => {
      const seed = (bookId || '').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
      return cleoHeaders[seed % cleoHeaders.length];
  }, [bookId, cleoHeaders]);

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
    <>
      <div className="fixed inset-0 bg-black/40 z-[190] md:hidden animate-in fade-in" onClick={() => setAiModal(false)} />
      <aside
        className='flex flex-col fixed bottom-0 left-0 right-0 z-[200] bg-bg-subtle rounded-t-3xl h-[85vh] md:relative md:rounded-none md:inset-auto md:w-96 md:h-full md:border-l border-border-default md:shrink-0 shadow-[0_-10px_40px_rgba(0,0,0,0.2)] md:shadow-none animate-in slide-in-from-bottom md:slide-in-from-right duration-300 font-sans overflow-hidden'
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute inset-0 z-0 opacity-40 pointer-events-none mix-blend-multiply dark:mix-blend-screen">
          <Orb hoverIntensity={0.5} rotateOnHover={true} hue={280} forceHoverState={true} />
        </div>
      {/* ── Header ── */}
      <div className='flex items-center justify-between px-4 py-4 border-b border-border-default bg-bg-elevated relative z-10 flex-shrink-0'>
        <div className='flex items-center gap-2'>
          <button
            onClick={() => showHistory ? setShowHistory(false) : setAiModal(false)}
            className='p-2 hover:bg-bg-subtle rounded-lg transition-colors text-text-tertiary'
          >
            {showHistory ? <ArrowLeft size={18} /> : <X size={18} />}
          </button>
          {!showHistory && (
            <button
              onClick={() => setShowHistory(true)}
              className='p-2 hover:bg-bg-subtle rounded-lg transition-colors text-text-tertiary'
              title='Chat History'
            >
              <History size={18} />
            </button>
          )}
        </div>

        <h2 className='text-[11px] flex items-center gap-1.5 font-bold text-text-primary uppercase tracking-[0.2em]'>
          {showHistory ? 'History' : 'Cleo'}

        </h2>

        <button
          onClick={handleNewChat}
          className='p-2 hover:bg-bg-subtle rounded-lg transition-colors text-accent-primary'
          title='New Chat'
        >
          <SquarePen size={18} />
        </button>
      </div>

      {/* ── Main Area ── */}
      <div
        ref={chatContainerRef}
        className='flex-1 overflow-y-auto custom-scrollbar p-4 flex flex-col gap-6 relative z-10'
      >
        {showHistory ? (
          /* ── History View ── */
          <div className='flex flex-col gap-6 animate-in fade-in duration-300'>
             {Object.entries(groupedHistory).map(([key, items]) => (
                items.length > 0 && (
                    <div key={key} className='flex flex-col gap-1'>
                        <h3 className='px-3 text-[10px] font-bold text-text-tertiary uppercase tracking-widest mb-2'>
                            {key === 'today' ? 'Today' : 'Previous'}
                        </h3>
                        {items.map(item => (
                            <div 
                                key={item.id}
                                onClick={() => handleSwitchChat(item)}
                                className={`group relative flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer transition-all ${sessionId === item.id ? 'bg-accent-subtle text-accent-primary font-medium' : 'hover:bg-bg-elevated border border-transparent hover:border-border-default text-text-secondary shadow-sm'}`}
                            >
                                <div className={`p-1.5 rounded-lg ${sessionId === item.id ? 'bg-accent-subtle text-accent-primary' : 'bg-bg-subtle text-text-tertiary group-hover:bg-bg-subtle/80 group-hover:text-text-secondary'}`}>
                                    <BookOpen size={14} />
                                </div>
                                <div className="flex-1 min-w-0 flex flex-col">
                                    <span className='truncate text-xs font-medium leading-tight'>{item.title || 'New Chat'}</span>
                                    {item.scope && item.scope !== 'general' && (
                                        <span className='text-[9px] text-text-tertiary truncate mt-0.5 flex items-center gap-1'>
                                            {item.scope}
                                        </span>
                                    )}
                                </div>
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        deleteSession(item.id);
                                    }}
                                    className='p-1.5 hover:bg-red-50 rounded-lg transition-all text-text-placeholder hover:text-red-500 md:opacity-0 group-hover:opacity-100'
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
              <div className='flex flex-col items-center justify-center py-8 text-center animate-in fade-in zoom-in duration-700'>
             
                <h2 className='text-2xl font-extrabold mb-6 tracking-tight text-text-primary font-serif italic'>
                    {cleoHeader}
                </h2>

                {/* Context Card */}
                {resolvedExamName !== 'your exam' && (
                    <div className='w-full max-w-[300px] bg-bg-elevated border border-border-default rounded-2xl p-4 mb-6 text-left shadow-sm'>
                        <p className='text-[9px] font-black text-accent-primary uppercase tracking-[0.2em] mb-3'>Cleo knows</p>
                        <div className='flex flex-col gap-2'>
                            <div className='flex items-center gap-2 text-[11px] text-text-secondary'>
                                <span className='text-accent-primary flex-shrink-0 text-[10px] font-black'>🎯</span>
                                <span className='font-medium truncate'>{resolvedExamName}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Chips */}
                <div className='flex flex-col gap-2 w-full max-w-[300px]'>
                    <p className='text-[9px] font-black text-text-tertiary uppercase tracking-[0.2em] text-left mb-1'>
                        {chipsLoading ? 'Reading this page...' : 'Ask Cleo'}
                    </p>
                    {chips.map((chip, i) => (
                        <button
                            key={i}
                            onClick={() => handleSend(chip)}
                            disabled={chipsLoading}
                            className='w-full px-4 py-3 rounded-2xl bg-bg-elevated border border-border-default text-xs text-text-secondary hover:border-accent-primary hover:text-accent-primary hover:bg-accent-subtle/50 transition-all duration-300 text-left font-bold shadow-sm hover:translate-x-1 group disabled:opacity-40 disabled:cursor-not-allowed'
                        >
                            <span className='group-hover:mr-2 transition-all opacity-0 group-hover:opacity-100 text-accent-primary'>→</span>
                            {chipsLoading ? <span className='animate-pulse'>Generating...</span> : chip}
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
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-sm border ${msg.role === 'user' ? 'bg-bg-elevated border-border-default text-text-secondary' : 'bg-accent-primary border-purple-500 text-bg-elevated'}`}>
                      {msg.role === 'user' ? <User size={14} /> : <Sparkle size={14} fill="currentColor" />}
                    </div>
                    <span className='text-[10px] font-bold text-text-tertiary uppercase tracking-widest'>
                      {msg.role === 'ai' ? 'Cleo' : 'You'}
                    </span>
                  </div>

                  <div className={`flex flex-col w-full ${msg.role === 'user' ? 'items-end' : 'items-center'}`}>
                    <div className={`max-w-[95%] px-6 py-5 text-[15px] leading-relaxed ${msg.role === 'user'
                      ? 'bg-text-primary text-bg-elevated rounded-3xl rounded-tr-none shadow-sm ring-1 ring-border-default'
                      : 'bg-bg-elevated text-text-primary'
                      }`}>
                      {msg.role === 'ai' ? (
                        <div className='prose dark:prose-invert prose-p:text-text-primary prose-headings:text-text-primary prose-li:text-text-primary prose-strong:text-text-primary text-text-primary prose-sm max-w-none prose-p:my-4 prose-headings:mt-6 prose-headings:mb-3 prose-li:my-2 prose-strong:text-inherit prose-code:text-accent-primary prose-pre:bg-bg-subtle prose-pre:border prose-pre:border-border-default prose-table:my-6 prose-table:w-full prose-table:border-collapse prose-table:border prose-table:border-border-default prose-th:bg-bg-subtle prose-th:p-3 prose-th:border prose-th:border-border-default prose-td:p-3 prose-td:border prose-td:border-border-default'>
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
                      <p className='text-[9px] text-text-tertiary font-bold tracking-tight uppercase text-center mt-3 opacity-60'>
                        This is AI and can make mistake double-check your answers
                      </p>
                    )}
                    <span className={`text-[9px] text-text-tertiary mt-2 font-medium tracking-wide px-2 ${msg.role === 'ai' ? 'text-center' : ''}`}>
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
                  <button onClick={retry} className='mt-3 text-[10px] text-red-600 hover:text-red-800 font-extrabold flex items-center gap-1.5 uppercase tracking-widest bg-bg-elevated px-3 py-1.5 rounded-lg border border-red-100 shadow-sm'>
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
          <div className='bg-bg-elevated border-2 border-purple-50 rounded-2xl p-4 relative group shadow-xl shadow-accent-subtle/20 animate-in slide-in-from-bottom-2 duration-300'>
            <div className='flex items-center justify-between mb-3'>
              <span className='text-[10px] font-bold text-accent-primary uppercase tracking-[0.15em] flex items-center gap-2'>
                <span className='w-1.5 h-1.5 rounded-full bg-accent-primary animate-pulse'></span>
                Live Context
              </span>
              <button
                onClick={() => setActiveContext(null)}
                className='p-1.5 hover:bg-bg-subtle rounded-lg text-text-placeholder hover:text-red-500 transition-all'
              >
                <X size={14} />
              </button>
            </div>
            <p className='text-[12px] text-text-secondary leading-relaxed italic line-clamp-3 pl-3 border-l-2 border-blue-100'>
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
            <div className={`relative flex items-end gap-2 bg-bg-subtle border-2 border-border-default p-2 pr-3 focus-within:border-accent-primary focus-within:bg-bg-elevated focus-within:shadow-lg focus-within:shadow-accent-subtle transition-all duration-300 ${inputValue.split('\n').length > 1 || (inputRef.current && inputRef.current.scrollHeight > 56) ? 'rounded-[28px]' : 'rounded-full'}`}>
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
                placeholder={isStreaming ? 'Cleo is thinking...' : currentPage ? `Ask about page ${currentPage}...` : 'Ask Cleo anything...'}
                disabled={isStreaming}
                rows={1}
                className='flex-1 bg-transparent px-4 py-3 focus:outline-none text-[15px] text-text-primary placeholder-slate-400 resize-none max-h-40 custom-scrollbar leading-relaxed'
                style={{ height: '44px' }}
              />
              <button
                type='submit'
                disabled={!inputValue.trim() || isStreaming}
                className={`p-3 rounded-full transition-all duration-300 flex items-center justify-center flex-shrink-0 self-end mb-0.5 ${inputValue.trim() && !isStreaming
                  ? 'bg-accent-primary text-bg-elevated shadow-xl shadow-accent-primary/20 hover:scale-110 active:scale-95'
                  : 'bg-slate-300 text-text-tertiary cursor-not-allowed'
                  }`}
              >
                <Send size={20} />
              </button>
            </div>
          </form>
        </div>
      )}

      <style dangerouslySetInnerHTML={{
        __html: `
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
    </>
  )
}

export default AIModal
