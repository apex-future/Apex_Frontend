import React, { useState, useRef, useEffect, useMemo } from 'react'
import { Send, ArrowLeft, User, Sparkle, RotateCcw, Trash2, AlertCircle, Plus, MessageSquare, PanelRightOpen, PanelRightClose, MoreVertical, X, SquarePen } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import useAIChat from '../../hooks/useAIChat'
import TypingIndicator from './TypingIndicator'

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
        retry,
    } = useAIChat();

    const [inputValue, setInputValue] = useState('');
    const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);
    const chatEndRef = useRef(null);
    const inputRef = useRef(null);

    const handleSend = (text) => {
        const content = text || inputValue.trim();
        if (!content || isStreaming) return;
        sendMessage(content);
        setInputValue('');
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        handleSend();
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
        <div className='flex h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden'>
            
            {/* ── Main Chat Area ── */}
            <main className='flex-1 flex flex-col relative min-w-0 bg-white'>
                {/* Header */}
                <header className='flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-10'>
                    <div className='flex items-center gap-4 flex-1 min-w-0'>
                        <button 
                            onClick={() => navigate(-1)}
                            className='p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500 flex-shrink-0'
                            title="Back"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        
                        <h1 className='text-sm font-bold tracking-tight text-slate-900 truncate max-w-[200px] md:max-w-md'>
                            {chatHistory.find(c => c.id === sessionId)?.title || "Apex AI Companion"}
                        </h1>
                    </div>

                    <div className='flex items-center gap-2'>
                        <button 
                            onClick={handleCreateNewChat}
                            className='p-2 hover:bg-slate-100 rounded-lg transition-colors text-blue-600'
                            title="New Chat"
                        >
                            <SquarePen size={20} />
                        </button>
                        <button 
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className='p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500'
                            title={sidebarOpen ? "Close history" : "Open history"}
                        >
                            {sidebarOpen ? <PanelRightClose size={20} /> : <PanelRightOpen size={20} />}
                        </button>
                    </div>
                </header>

                {/* Chat Canvas */}
                <div className='flex-1 overflow-y-auto px-4 py-8 custom-scrollbar bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:24px_24px]'>
                    <div className='max-w-4xl mx-auto flex flex-col gap-8'>
                        {messages.length === 0 ? (
                            <div className='flex flex-col items-center justify-center py-24 text-center animate-in fade-in zoom-in duration-700'>
                                <div className='w-20 h-20 bg-gradient-to-br from-blue-50 to-blue-100 text-blue-600 rounded-[2rem] flex items-center justify-center mb-6 shadow-xl shadow-blue-50 ring-4 ring-white'>
                                    <Sparkle size={40} fill="currentColor" />
                                </div>
                                <h2 className='text-3xl md:text-4xl font-extrabold mb-3 tracking-tight text-slate-900 font-serif'>Welcome to Apex AI</h2>
                                <p className='text-slate-500 max-w-sm mx-auto text-base leading-relaxed'>Your personal academic breakthrough engine. What are we mastering today?</p>

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
                                            className='flex items-center gap-3 px-5 py-4 rounded-2xl bg-white border border-slate-200 text-sm text-slate-700 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/50 hover:shadow-lg hover:shadow-blue-50 transition-all duration-300 text-left group'
                                        >
                                            <span className='text-xl grayscale group-hover:grayscale-0 transition-all'>{suggestion.icon}</span>
                                            <span className='font-medium'>{suggestion.text}</span>
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
                                    {/* Header Info (Avatar + Name) - Aligned to side */}
                                    <div className={`flex items-center gap-2 mb-1 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-sm border ${msg.role === 'user' ? 'bg-white border-slate-200 text-slate-600' : 'bg-blue-600 border-blue-500 text-white'}`}>
                                            {msg.role === 'user' ? <User size={16} /> : <Sparkle size={16} fill="currentColor" />}
                                        </div>
                                        <span className='text-[11px] font-bold text-slate-400 uppercase tracking-widest'>
                                            {msg.role === 'ai' ? 'Apex AI' : 'You'}
                                        </span>
                                    </div>

                                    {/* Message Bubble - Centered for AI, right-aligned for User */}
                                    <div className={`flex flex-col w-full ${msg.role === 'user' ? 'items-end' : 'items-center'}`}>
                                        <div className={`max-w-[95%] md:max-w-[85%] px-6 py-4 rounded-3xl text-[15px] leading-relaxed shadow-sm ring-1 ${msg.role === 'user'
                                                ? 'bg-slate-900 text-white ring-slate-800 rounded-tr-none'
                                                : 'bg-white text-slate-800 ring-slate-200 rounded-2xl'
                                            }`}>
                                            {msg.role === 'ai' ? (
                                                <div className='prose prose-base max-w-none prose-p:my-6 prose-headings:mt-8 prose-headings:mb-4 prose-li:my-3 prose-strong:text-inherit prose-code:text-blue-600 prose-pre:bg-slate-50 prose-pre:border prose-pre:border-slate-100 prose-table:my-8 prose-table:border prose-table:border-slate-200 prose-th:bg-slate-50 prose-th:p-4 prose-th:border prose-th:border-slate-200 prose-td:p-4 prose-td:border prose-td:border-slate-200'>
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
                                        <span className={`text-[10px] text-slate-400 mt-2 font-medium tracking-wide px-2 ${msg.role === 'ai' ? 'text-center' : ''}`}>
                                            {msg.id ? formatTime(msg.id) : '--:--'}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                        
                        {/* Error state */}
                        {error && (
                            <div className='flex items-start gap-4 p-5 bg-red-50 border border-red-100 rounded-2xl animate-in fade-in slide-in-from-top-2 max-w-2xl mx-auto w-full'>
                                <div className='w-10 h-10 bg-red-100 text-red-600 rounded-xl flex items-center justify-center flex-shrink-0'>
                                    <AlertCircle size={24} />
                                </div>
                                <div className='flex-1'>
                                    <h4 className='text-sm font-bold text-red-900'>Session Error</h4>
                                    <p className='text-sm text-red-700 mt-1'>{error}</p>
                                    <button
                                        onClick={retry}
                                        className='mt-3 text-sm bg-white border border-red-200 px-4 py-2 rounded-lg text-red-600 hover:bg-red-50 hover:border-red-300 font-semibold flex items-center gap-2 transition-all shadow-sm'
                                    >
                                        <RotateCcw size={14} /> Reconnect Session
                                    </button>
                                </div>
                            </div>
                        )}

                        <div ref={chatEndRef} className='h-32' />
                    </div>
                </div>

                {/* Input Area */}
                <div className='p-6 bg-white border-t border-slate-100 relative z-10'>
                    <form
                        onSubmit={handleSubmit}
                        className={`max-w-4xl mx-auto flex flex-col gap-2 transition-all duration-300 ${isStreaming ? 'opacity-60' : 'opacity-100'}`}
                    >
                        <div className='relative flex items-center gap-3 bg-white border-2 border-slate-100 rounded-full p-2 pr-3 shadow-xl shadow-slate-200/50 focus-within:border-blue-500 focus-within:shadow-blue-100 transition-all'>
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
                                placeholder={isStreaming ? 'AI is processing...' : 'Ask Apex Intelligence?'}
                                disabled={isStreaming}
                                rows={1}
                                className='flex-1 bg-transparent px-4 py-3 focus:outline-none text-[16px] text-slate-800 resize-none max-h-52 custom-scrollbar placeholder:text-sm disabled:cursor-not-allowed leading-relaxed self-center'
                                style={{ height: '48px' }}
                            />
                            <button
                                type='submit'
                                disabled={!inputValue.trim() || isStreaming}
                                className={`p-3 rounded-full transition-all flex items-center justify-center ${inputValue.trim() && !isStreaming
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-300 hover:bg-blue-700 hover:-translate-y-0.5 active:translate-y-0'
                                        : 'bg-slate-100 text-slate-300 cursor-not-allowed'
                                    }`}
                            >
                                <Send size={22} />
                            </button>
                        </div>
                        <div className='flex items-center justify-between px-4'>
                            <p className='text-[10px] text-slate-400 font-medium tracking-tight'>
                                This is AI and can make mistake double-check your answers • Research Mode Enabled
                            </p>
                            <span className='text-[10px] text-slate-300 font-bold uppercase tracking-widest'>Apex 2.0</span>
                        </div>
                    </form>
                </div>
            </main>

            {/* ── Sidebar (History) ── */}
            <aside className={`
                ${sidebarOpen ? 'w-72 translate-x-0' : 'w-0 translate-x-full md:w-0'} 
                flex-shrink-0 bg-white border-l border-slate-200 flex flex-col transition-all duration-300 
                fixed md:relative right-0 top-0 h-full md:h-auto z-50 md:z-20 overflow-hidden shadow-2xl md:shadow-none
            `}>
                <div className='p-4 border-b border-slate-100 flex items-center justify-between relative'>
                    <button 
                        onClick={() => setSidebarOpen(false)}
                        className='md:hidden p-2 hover:bg-slate-100 rounded-lg text-slate-500'
                    >
                        <X size={20} />
                    </button>
                    
                    <h2 className='absolute left-1/2 -translate-x-1/2 text-sm font-bold text-slate-800 pointer-events-none'>
                        Chat History
                    </h2>

                    <button 
                        onClick={handleCreateNewChat}
                        className='p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-all ml-auto'
                        title="New Chat"
                    >
                        <SquarePen size={18} className='md:hidden' />
                    </button>
                </div>

                <div className='flex-1 overflow-y-auto p-3 flex flex-col gap-6 custom-scrollbar'>
                    {Object.entries(groupedHistory).map(([key, items]) => (
                        items.length > 0 && (
                            <div key={key} className='flex flex-col gap-1'>
                                <h3 className='px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1'>
                                    {key === 'today' ? 'Today' : key === 'yesterday' ? 'Yesterday' : 'Previous Chat History'}
                                </h3>
                                {items.map(item => (
                                    <div 
                                        key={item.id}
                                        onClick={() => handleSwitchChat(item)}
                                        className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all ${sessionId === item.id ? 'bg-blue-50 text-blue-700 font-medium' : 'hover:bg-slate-50 text-slate-600'}`}
                                    >
                                        <MessageSquare size={16} className={sessionId === item.id ? 'text-blue-600' : 'text-slate-400'} />
                                        <span className='flex-1 truncate text-sm'>{item.title || 'New Chat'}</span>
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                deleteSession(item.id);
                                            }}
                                            className='p-1.5 hover:bg-slate-200 rounded-lg transition-all text-slate-400 hover:text-red-500'
                                            title="Delete chat"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )
                    ))}
                </div>

                <div className='p-4 border-t border-slate-100'>
                    <div className='flex items-center gap-3 p-2 rounded-xl bg-slate-50 text-slate-600 border border-slate-200 shadow-inner'>
                        <div className='w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600'>
                            <User size={16} />
                        </div>
                        <span className='text-xs font-medium'>Study Account</span>
                    </div>
                </div>
            </aside>

            {/* Backdrop for mobile */}
            {sidebarOpen && (
                <div 
                    className='md:hidden fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40'
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <style dangerouslySetInnerHTML={{ __html: `
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
