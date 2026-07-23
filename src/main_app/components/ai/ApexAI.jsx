import React, { useState, useRef, useEffect, useMemo } from 'react'
import { PaperPlaneRight, ArrowLeft, User, Sparkle, ArrowCounterClockwise, Trash, WarningCircle, Plus, ChatCircle, Sidebar, DotsThreeVertical, X, PencilSimpleLine, PencilSimple, BookOpen, Square, Highlighter, Copy, Check } from '@phosphor-icons/react'
import { useNavigate } from 'react-router-dom'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import useAIChat from '../../hooks/useAIChat'
import TypingIndicator from './TypingIndicator'
import Orb from '../ui/Orb'
import { cleanUserMessage, getChatTitle, extractContextAndQuestion } from '../../utils/aiUtils'
import { getSessions, getSessionMessages, renameSession } from '../../services/aiService'
import useAiStore from '../../store/useAiStore'
import ListItem from '../ui/ListItem'
import Card from '../ui/Card'
import db from '../../db/apex.db'

function ApexAI() {
    const navigate = useNavigate();
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
        stopGeneration,
        retry,
    } = useAIChat();

    const { currentSessionId, lastSessionUpdate, setCurrentSessionId, setCurrentSessionMessages } = useAiStore();
    const [sessionsList, setSessionsList] = useState([]);
    const [editingSessionId, setEditingSessionId] = useState(null);
    const [renameValue, setRenameValue] = useState('');

    const [inputValue, setInputValue] = useState('');
    const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);
    const [copiedId, setCopiedId] = useState(null);
    const chatEndRef = useRef(null);
    const inputRef = useRef(null);

    // Fetch sessions list on mount or sidebar open
    const loadSessions = async () => {
        try {
            const cached = await db.ai_chat_sessions.orderBy('updated_at').reverse().toArray();
            if (cached && cached.length > 0) {
                setSessionsList(cached);
            }
        } catch (e) {}

        try {
            const data = await getSessions();
            setSessionsList(data);
        } catch (err) {
            console.error('Failed to load AI sessions:', err);
        }
    };

    useEffect(() => {
        loadSessions();
    }, [sessionId, currentSessionId]);

    // Re-fetch sessions when a response completes (to pick up AI-generated header)
    useEffect(() => {
        if (lastSessionUpdate > 0) {
            loadSessions();
        }
    }, [lastSessionUpdate]);

    const [sessionLoading, setSessionLoading] = useState(false);

    const handleSelectSession = async (session) => {
        try {
            setSessionLoading(true);
            setCurrentSessionId(session.id);
            setCurrentSessionMessages([]); // Clear current chat immediately so old session disappears
            const rawMsgs = await getSessionMessages(session.id);
            const formatted = [];
            for (const r of rawMsgs) {
                formatted.push({
                    id: r.id,
                    role: 'user',
                    content: r.query_text,
                    query_text: r.query_text,
                    highlightContext: r.highlight_context,
                    highlight_context: r.highlight_context
                });
                formatted.push({
                    id: r.id + '-ai',
                    role: 'ai',
                    content: r.ai_response
                });
            }
            setCurrentSessionMessages(formatted);
            if (window.innerWidth < 768) {
                setSidebarOpen(false);
            }
            // Keep sessionLoading true until messages are flushed into React state
            requestAnimationFrame(() => {
                setSessionLoading(false);
            });
        } catch (err) {
            console.error('Failed to load session messages:', err);
            setSessionLoading(false);
        }
    };

    const handleRenameSubmit = async (session) => {
        const value = renameValue.trim();
        setEditingSessionId(null);
        if (!value || value === session.chat_header) return;

        console.log('[History] Rename submitted for session:', session.id, value);
        const oldHeader = session.chat_header;
        // Optimistic update in memory
        setSessionsList(prev => prev.map(s => s.id === session.id ? { ...s, chat_header: value } : s));
        // Persist immediately to Dexie cache so next load reflects the new name
        try { await db.ai_chat_sessions.update(session.id, { chat_header: value, updated_at: new Date().toISOString() }); } catch (_) {}

        try {
            await renameSession(session.id, value);
        } catch (err) {
            console.error('Failed to rename session:', err);
            setSessionsList(prev => prev.map(s => s.id === session.id ? { ...s, chat_header: oldHeader } : s));
            try { await db.ai_chat_sessions.update(session.id, { chat_header: oldHeader }); } catch (_) {}
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    const handleSend = (text) => {
        const content = text || inputValue.trim();
        if (!content || isStreaming) return;
        sendMessage(content);
        setInputValue('');
        if (inputRef.current) {
            inputRef.current.style.height = '48px';
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        handleSend();
    };

    const handleCopy = (id, content) => {
        navigator.clipboard.writeText(content);
        setCopiedId(id);
        setTimeout(() => {
            setCopiedId(null);
        }, 3000);
    };

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isStreaming]);

    // Format time for message timestamps
    const formatTime = (id) => {
        const date = new Date(id);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    // Group history by date
    const groupedHistory = useMemo(() => {
        const groups = {
            today: [],
            yesterday: [],
            previous: []
        };

        const today = new Date().setHours(0, 0, 0, 0);
        const yesterday = new Date(today - 86400000).getTime();

        chatHistory.forEach(chat => {
            const chatDate = new Date(chat.updatedAt).setHours(0, 0, 0, 0);
            if (chatDate === today) groups.today.push(chat);
            else if (chatDate === yesterday) groups.yesterday.push(chat);
            else groups.previous.push(chat);
        });

        return groups;
    }, [chatHistory]);

    const handleCreateNewChat = () => {
        createNewChat();
        if (window.innerWidth < 768) {
            setSidebarOpen(false);
        }
    };

    const handleSwitchChat = (item) => {
        switchChat(item);
        if (window.innerWidth < 768) {
            setSidebarOpen(false);
        }
    };

    return (
        <div className='flex h-screen max-h-screen bg-bg-base text-text-primary font-sans overflow-hidden'>

            {/* ── Main Chat Area ── */}
            <main className='flex-1 flex flex-col relative min-w-0 bg-bg-base dark:bg-bg-dark overflow-hidden'>
                {messages.length === 0 && !sessionLoading && (
                    <div className="absolute inset-0 z-0 opacity-50 pointer-events-none">
                        <Orb hoverIntensity={0.5} rotateOnHover={true} hue={280} forceHoverState={true} backgroundColor='transparent' />
                    </div>
                )}
                {/* Header */}
                <header className='flex items-center justify-between px-6 py-3 relative z-10 flex-shrink-0 gap-3'>
                    <div className="px-1 py-1 rounded-full bg-white/15 dark:bg-white/5 backdrop-blur-xl border border-white/25 dark:border-white/10 shadow-[0_2px_16px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)] flex-shrink-0">
                        <button
                            onClick={() => navigate(-1)}
                            className='p-2 hover:bg-white/20 dark:hover:bg-white/10 text-text-secondary rounded-full transition-all group flex items-center justify-center'
                            title="Back"
                        >
                            <ArrowLeft size={20} weight="bold" className="text-text-primary" />
                        </button>
                    </div>

                    <div className="px-5 py-2.5 rounded-[20px] bg-white/15 dark:bg-white/5 backdrop-blur-xl border border-white/25 dark:border-white/10 shadow-[0_2px_16px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)] flex-1 min-w-0 flex items-center justify-center gap-2">
                        <h1 className='text-sm font-bold tracking-tight text-slate-900 dark:text-white/80 truncate max-w-[200px] md:max-w-md flex items-center gap-2 justify-center'>
                            {(() => {
                                const activeSess = sessionsList.find(s => s.id === (currentSessionId || sessionId));
                                return (activeSess && activeSess.chat_header && activeSess.chat_header !== 'No chat title, try renaming') ? activeSess.chat_header : "Cleo";
                            })()}
                        </h1>
                    </div>

                    <div className="px-2 py-1.5 rounded-full bg-white/15 dark:bg-white/5 backdrop-blur-xl border border-white/25 dark:border-white/10 shadow-[0_2px_16px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)] flex items-center gap-2 flex-shrink-0">
                        <button
                            onClick={handleCreateNewChat}
                            className='p-2 hover:bg-white/20 dark:hover:bg-white/10 rounded-full transition-colors text-accent-primary'
                            title="New Chat"
                        >
                            <PencilSimpleLine size={20} weight="regular" />
                        </button>
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className='p-2 hover:bg-white/20 dark:hover:bg-white/10 rounded-full transition-colors text-text-tertiary'
                            title={sidebarOpen ? "Close history" : "Open history"}
                        >
                            <Sidebar size={20} weight="regular" />
                        </button>
                    </div>
                </header>

                {/* Chat Canvas */}
                <div data-lenis-prevent="true" className='flex-1 overflow-y-auto px-4 py-8 custom-scrollbar relative z-10'>
                    <div className='max-w-4xl mx-auto flex flex-col gap-8'>
                        {sessionLoading ? (
                            <div className="flex flex-col gap-6 py-8 animate-pulse max-w-3xl mx-auto w-full">
                                <div className="flex flex-col items-end gap-2">
                                    <div className="h-10 bg-black/10 dark:bg-white/10 rounded-2xl w-1/3"></div>
                                </div>
                                <div className="flex flex-col gap-3">
                                    <div className="h-4 bg-black/10 dark:bg-white/10 rounded w-full"></div>
                                    <div className="h-4 bg-black/10 dark:bg-white/10 rounded w-5/6"></div>
                                    <div className="h-4 bg-black/10 dark:bg-white/10 rounded w-4/6"></div>
                                </div>
                                <div className="flex flex-col items-end gap-2 mt-4">
                                    <div className="h-10 bg-black/10 dark:bg-white/10 rounded-2xl w-2/5"></div>
                                </div>
                                <div className="flex flex-col gap-3">
                                    <div className="h-4 bg-black/10 dark:bg-white/10 rounded w-full"></div>
                                    <div className="h-4 bg-black/10 dark:bg-white/10 rounded w-3/4"></div>
                                </div>
                            </div>
                        ) : messages.length === 0 ? (
                            <div className='flex flex-col items-center justify-center py-24 text-center animate-in fade-in zoom-in duration-700'>
                                <div className='w-20 h-20 bg-gradient-to-br from-purple-50 to-purple-100 text-accent-primary rounded-[2rem] flex items-center justify-center mb-6 shadow-xl shadow-accent-subtle ring-4 ring-bg-elevated'>
                                    <Sparkle size={40} weight="fill" />
                                </div>
                                <h2 className='text-3xl md:text-4xl font-extrabold mb-3 tracking-tight text-text-primary font-serif italic'>Ask Cleo</h2>
                                <p className='text-text-tertiary max-w-sm mx-auto text-base leading-relaxed'>Stay Focused. Learn Faster</p>

                                <div className='grid grid-cols-1 md:grid-cols-2 gap-3 mt-12 w-full max-w-2xl'>
                                    {[
                                        { text: "Explain photosynthesis simply", icon: "" },
                                        { text: "Help me with quadratic equations", icon: "" },
                                        { text: "Explain the concept of AI", icon: "" },
                                        { text: "What are Newton's laws?", icon: "" }
                                    ].map((suggestion, i) => (
                                        <button
                                            key={i}
                                            onClick={() => handleSend(suggestion.text)}
                                            className='flex items-center gap-3 px-5 py-4 rounded-2xl bg-bg-subtle dark:bg-bg-elevated border-t border-black/10 dark:border-white/10 shadow-sm text-sm text-text-secondary hover:shadow-md hover:border-t-accent-primary transition-all duration-300 text-left group'
                                        >
                                            <span className='text-xl grayscale group-hover:grayscale-0 transition-all'>{suggestion.icon}</span>
                                            <span className='font-medium'>{suggestion.text}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            (() => {
                                console.log('[Chat] Rendering session messages:', messages.length);
                                return messages.map((msg, index) => (
                                    <div
                                        key={msg.id || index}
                                        className={`flex flex-col gap-2 animate-in slide-in-from-bottom-2 duration-500 w-full ${msg.role === 'user' ? 'items-end' : 'items-center'}`}
                                    >
                                        {msg.role === 'ai' ? (
                                            /* ── AI message: no bubble, plain centered prose ── */
                                            <div className="w-full flex flex-col items-center">
                                                <div className="w-full max-w-[88%] md:max-w-[78%] px-2 py-2 text-[15px] leading-relaxed text-text-primary">
                                                    <div className='prose dark:prose-invert prose-p:text-text-primary prose-headings:text-text-primary prose-li:text-text-primary prose-strong:text-text-primary text-text-primary prose-base max-w-none prose-p:my-5 prose-headings:mt-8 prose-headings:mb-4 prose-li:my-3 prose-strong:text-inherit prose-code:text-accent-primary prose-pre:bg-bg-subtle prose-pre:border prose-pre:border-border-default prose-table:my-8 prose-table:border prose-table:border-border-default prose-th:bg-bg-subtle prose-th:p-4 prose-th:border prose-th:border-border-default prose-td:p-4 prose-td:border prose-td:border-border-default'>
                                                        {msg.content ? (
                                                            <Markdown remarkPlugins={[remarkGfm]}>{msg.content}</Markdown>
                                                        ) : (
                                                            isStreaming && <TypingIndicator />
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-center gap-4 mt-2 w-full max-w-[88%] md:max-w-[78%]">
                                                    <span className="text-[10px] text-text-tertiary font-medium tracking-wide opacity-60">
                                                        {msg.id ? formatTime(msg.id) : '--:--'}
                                                    </span>
                                                    {msg.content && !isStreaming && index === messages.length - 1 && (
                                                        <button onClick={retry} className="text-[10px] text-text-tertiary hover:text-accent-primary font-medium flex items-center gap-1 transition-colors" title="Regenerate response">
                                                            <ArrowCounterClockwise size={12} weight="bold" /> Retry
                                                        </button>
                                                    )}
                                                    {msg.content && !isStreaming && (
                                                        <button onClick={() => handleCopy(msg.id, msg.content)} className="text-[10px] text-text-tertiary hover:text-accent-primary font-medium flex items-center gap-1 transition-colors" title="Copy response">
                                                            {copiedId === msg.id ? <Check size={12} weight="bold" className="text-green-500" /> : <Copy size={12} weight="bold" />} 
                                                            <span className={copiedId === msg.id ? "text-green-500" : ""}>{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ) : (() => {
                                            /* ── User message: 1. Highlight Context card ON TOP 2. User bubble (clean) ── */
                                            const { context: parsedContext, question } = extractContextAndQuestion(msg.content || msg.query_text);
                                            const context = msg.highlightContext || msg.highlight_context || parsedContext;
                                            const userText = msg.query_text || question;
                                            return (
                                                <div className="flex flex-col gap-2 w-full max-w-[88%] md:max-w-[68%] items-end">
                                                    {context && (
                                                        <Card className="p-3.5 border-l-4 border-l-purple-600 dark:border-l-purple-500 text-text-secondary text-xs leading-relaxed w-full italic font-sans hover:scale-100">
                                                            <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[10px] mb-1.5 opacity-90 text-purple-600 dark:text-purple-400 not-italic">
                                                                <Highlighter size={12} weight="bold" className="text-purple-600 dark:text-purple-400" />
                                                                Highlight Context
                                                            </div>
                                                            <p className="line-clamp-4 leading-relaxed">"{context}"</p>
                                                        </Card>
                                                    )}
                                                    <div className="px-5 py-3.5 text-[15px] leading-relaxed bg-bg-subtle dark:bg-bg-elevated border-t border-black/10 dark:border-white/10 shadow-sm rounded-2xl text-text-primary text-left inline-block">
                                                        <p className='whitespace-pre-wrap'>{userText}</p>
                                                    </div>
                                                    <span className="text-[10px] text-text-tertiary mt-1 font-medium tracking-wide opacity-60">
                                                        {msg.id ? formatTime(msg.id) : '--:--'}
                                                    </span>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                ));
                            })()
                        )}

                        {/* Error state */}
                        {error && (
                            <div className='flex items-start gap-4 p-5 bg-red-50 border border-red-100 rounded-2xl animate-in fade-in slide-in-from-top-2 max-w-2xl mx-auto w-full'>
                                <div className='w-10 h-10 bg-red-100 text-red-600 rounded-xl flex items-center justify-center flex-shrink-0'>
                                    <WarningCircle size={24} weight="regular" />
                                </div>
                                <div className='flex-1'>
                                    <h4 className='text-sm font-bold text-red-900'>Session Error</h4>
                                    <p className='text-sm text-red-700 mt-1'>{error}</p>
                                    <button
                                        onClick={retry}
                                        className='mt-3 text-sm bg-bg-elevated border border-red-200 px-4 py-2 rounded-lg text-red-600 hover:bg-red-50 hover:border-red-300 font-semibold flex items-center gap-2 transition-all shadow-sm'
                                    >
                                        <ArrowCounterClockwise size={14} weight="bold" /> Reconnect Session
                                    </button>
                                </div>
                            </div>
                        )}

                        <div ref={chatEndRef} className='h-4' />
                    </div>
                </div>

                {/* Input Area */}
                <div className='p-6 relative z-10 flex-shrink-0'>
                    <form
                        onSubmit={handleSubmit}
                        className={`max-w-4xl mx-auto flex flex-col gap-2 transition-all duration-300 ${isStreaming ? 'opacity-60' : 'opacity-100'}`}
                    >
                        <div className={`relative flex items-end gap-3 bg-bg-subtle dark:bg-bg-dark-elevated border border-black/10 dark:border-white/10 p-2 pr-3 shadow-sm focus-within:border-accent-primary focus-within:ring-2 focus-within:ring-accent-primary/10 transition-all duration-300 ${inputValue.split('\n').length > 1 || (inputRef.current && inputRef.current.scrollHeight > 60) ? 'rounded-[28px]' : 'rounded-full'}`}>
                            <textarea
                                ref={inputRef}
                                value={inputValue}
                                onChange={(e) => {
                                    setInputValue(e.target.value);
                                    e.target.style.height = 'auto';
                                    e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSend();
                                    }
                                }}
                                placeholder={isStreaming ? 'AI is processing...' : 'Ask Cleo?'}
                                disabled={isStreaming}
                                rows={1}
                                className='flex-1 bg-transparent px-4 py-3 focus:outline-none text-[16px] text-text-primary resize-none max-h-52 custom-scrollbar placeholder:text-sm disabled:cursor-not-allowed leading-relaxed'
                                style={{ height: '48px' }}
                            />
                            <button
                                type={isStreaming ? 'button' : 'submit'}
                                disabled={!inputValue.trim() && !isStreaming}
                                onClick={isStreaming ? stopGeneration : undefined}
                                className={`p-3 rounded-full transition-all flex items-center justify-center flex-shrink-0 self-end mb-0.5 ${isStreaming
                                    ? 'bg-red-50 text-red-500 shadow-lg shadow-red-500/10 hover:bg-red-100 border border-red-200 hover:-translate-y-0.5 active:translate-y-0'
                                    : inputValue.trim()
                                    ? 'bg-accent-primary text-bg-elevated shadow-lg shadow-accent-primary/20 hover:bg-accent-hover hover:-translate-y-0.5 active:translate-y-0'
                                    : 'bg-bg-subtle text-text-placeholder cursor-not-allowed'
                                    }`}
                                title={isStreaming ? "Stop generation" : "PaperPlaneTilt message"}
                            >
                                {isStreaming ? <Square size={16} weight="fill" /> : <PaperPlaneRight size={22} weight="fill" />}
                            </button>
                        </div>
                    </form>
                </div>
            </main>

            {/* ── Sidebar (History) ── */}
            <aside className={`
                ${sidebarOpen ? 'w-72 translate-x-0' : 'w-0 translate-x-full md:w-0'} 
                flex-shrink-0 bg-bg-subtle/90 dark:bg-bg-elevated/95 backdrop-blur-xl border-l border-black/10 dark:border-white/10 flex flex-col transition-all duration-300 
                fixed lg:relative right-0 top-0 h-full lg:h-auto z-50 lg:z-20 overflow-hidden shadow-2xl lg:shadow-none
            `}>
                <div className='p-4 border-b border-black/10 dark:border-white/10 flex items-center justify-between relative'>
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className='md:hidden p-2 hover:bg-bg-subtle rounded-lg text-text-tertiary'
                    >
                        <X size={20} weight="bold" />
                    </button>

                    <h2 className='absolute left-1/2 -translate-x-1/2 text-sm font-bold text-text-primary pointer-events-none'>
                        Chat History
                    </h2>

                    <button
                        onClick={handleCreateNewChat}
                        className='p-2 hover:bg-accent-subtle text-accent-primary rounded-lg transition-all ml-auto'
                        title="New Chat"
                    >
                        <PencilSimpleLine size={18} weight="regular" className='md:hidden' />
                    </button>
                </div>

                <div data-lenis-prevent="true" className='flex-1 overflow-y-auto p-3 flex flex-col gap-2 custom-scrollbar'>
                    {sessionsList.map(session => {
                        const isUnnamed = session.chat_header === 'No chat title, try renaming';
                        const isEditing = editingSessionId === session.id;
                        const isSelected = (currentSessionId || sessionId) === session.id;

                        const editButton = (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingSessionId(session.id);
                                    setRenameValue(isUnnamed ? '' : session.chat_header);
                                }}
                                className="p-1 hover:bg-bg-subtle rounded-md text-text-tertiary hover:text-accent-primary transition-colors"
                                title="Rename chat"
                            >
                                <PencilSimple size={16} weight="bold" />
                            </button>
                        );

                        const labelContent = isEditing ? (
                            <input
                                type="text"
                                maxLength={60}
                                autoFocus
                                value={renameValue}
                                onChange={(e) => setRenameValue(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleRenameSubmit(session);
                                    if (e.key === 'Escape') setEditingSessionId(null);
                                }}
                                onBlur={() => handleRenameSubmit(session)}
                                placeholder="Name this chat..."
                                onClick={(e) => e.stopPropagation()}
                                className="text-xs font-semibold px-2 py-1 bg-white dark:bg-bg-dark border border-accent-primary rounded-md outline-none text-text-primary w-full max-w-[180px]"
                            />
                        ) : (
                            <span className={isUnnamed ? 'italic opacity-75' : ''}>
                                {session.chat_header}
                            </span>
                        );

                        return (
                            <ListItem
                                key={session.id}
                                icon={ChatCircle}
                                label={labelContent}
                                isActive={isSelected}
                                right={!isEditing ? editButton : null}
                                onClick={() => !isEditing && handleSelectSession(session)}
                            />
                        );
                    })}
                </div>

                <div className='p-4 border-t border-black/10 dark:border-white/10'>
                    <div className='flex items-center gap-3 p-2 rounded-xl bg-bg-elevated/50 text-text-secondary border border-black/10 dark:border-white/10'>
                        <div className='w-8 h-8 rounded-lg bg-accent-subtle flex items-center justify-center text-accent-primary'>
                            <User size={16} weight="fill" />
                        </div>
                        <span className='text-xs font-medium'>Study Account</span>
                    </div>
                </div>
            </aside>

            {/* Backdrop for mobile */}
            {sidebarOpen && (
                <div
                    className='lg:hidden fixed inset-0 bg-text-primary/20 backdrop-blur-sm z-40'
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <style dangerouslySetInnerHTML={{
                __html: `
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #e2e8f0;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #cbd5e1;
                }
            `}} />
        </div>
    )
}

export default ApexAI
