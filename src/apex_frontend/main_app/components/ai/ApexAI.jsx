import React, { useState, useRef, useEffect } from 'react'
import { Send, ArrowLeft, User, Sparkle, RotateCcw, Trash2, AlertCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Markdown from 'react-markdown'
import useAIChat from '../../hooks/useAIChat'
import TypingIndicator from './TypingIndicator'

function ApexAI() {
    const navigate = useNavigate();
    const {
        messages,
        isStreaming,
        error,
        sendMessage,
        clearConversation,
        retry,
    } = useAIChat();

    const [inputValue, setInputValue] = useState('');
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

    return (
        <div className='flex flex-col h-screen bg-white text-slate-900 font-sans'>

            {/* ── Header ── */}
            <header className='flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white sticky top-0 z-10'>
                <div className='flex items-center'>
                    <button
                        onClick={() => navigate(-1)}
                        className='mr-4 p-2 hover:bg-slate-50 rounded-lg transition-colors text-slate-500'
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div className='flex items-center gap-2'>
                        <div className='p-1.5 bg-blue-600 rounded-lg'>
                            <Sparkle size={18} className='text-white' fill="currentColor" />
                        </div>
                        <div>
                            <h1 className='text-lg font-semibold tracking-tight'>Apex AI</h1>
                            <span className='text-[10px] text-slate-400'>
                                {isStreaming ? 'Thinking...' : 'Your study companion'}
                            </span>
                        </div>
                    </div>
                </div>
                {messages.length > 0 && (
                    <button
                        onClick={clearConversation}
                        className='p-2 hover:bg-slate-50 rounded-lg transition-colors text-slate-400 hover:text-slate-600'
                        title='New conversation'
                    >
                        <Trash2 size={18} />
                    </button>
                )}
            </header>

            {/* ── Chat Canvas ── */}
            <div className='flex-1 overflow-y-auto px-4 py-8 md:px-0'>
                <div className='max-w-3xl mx-auto flex flex-col gap-8'>
                    {messages.length === 0 ? (
                        <div className='flex flex-col items-center justify-center py-20 text-center animate-in fade-in duration-500'>
                            <div className='w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6'>
                                <Sparkle size={32} fill="currentColor" />
                            </div>
                            <h2 className='text-2xl font-bold mb-2'>How can I help you?</h2>
                            <p className='text-slate-500 max-w-sm'>Ask anything about your books, notes, or any topic you're exploring.</p>

                            {/* Quick suggestions */}
                            <div className='flex flex-wrap justify-center gap-2 mt-8'>
                                {[
                                    "Explain photosynthesis simply",
                                    "Help me with quadratic equations",
                                    "Summarize the causes of World War I",
                                    "What are Newton's laws?"
                                ].map((suggestion, i) => (
                                    <button
                                        key={i}
                                        onClick={() => handleSend(suggestion)}
                                        className='px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-600 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all duration-300'
                                    >
                                        {suggestion}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex gap-4 animate-in fade-in duration-300 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                            >
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-slate-100 text-slate-600' : 'bg-blue-600 text-white'}`}>
                                    {msg.role === 'user' ? <User size={18} /> : <Sparkle size={18} fill="currentColor" />}
                                </div>
                                <div className={`flex flex-col max-w-[85%] ${msg.role === 'user' ? 'items-end' : ''}`}>
                                    <div className={`px-5 py-3.5 rounded-2xl text-[15px] leading-relaxed shadow-sm border ${msg.role === 'user'
                                            ? 'bg-white border-slate-200 text-slate-800'
                                            : 'bg-blue-50 border-blue-100 text-slate-800'
                                        }`}>
                                        {msg.role === 'ai' ? (
                                            <div className='prose prose-sm max-w-none prose-p:my-1.5 prose-ul:my-1.5 prose-li:my-0.5 prose-headings:my-2 prose-strong:text-slate-900'>
                                                {msg.content ? (
                                                    <Markdown>{msg.content}</Markdown>
                                                ) : (
                                                    isStreaming && <span className='text-slate-400 text-sm'>Thinking...</span>
                                                )}
                                            </div>
                                        ) : (
                                            msg.content
                                        )}
                                    </div>
                                    <span className='text-[10px] text-slate-400 mt-1.5 px-1'>
                                        {formatTime(msg.id)}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}

                    {/* Typing indicator */}
                    {isStreaming && messages.length > 0 && messages[messages.length - 1]?.role === 'ai' && messages[messages.length - 1]?.content === '' && (
                        <div className='flex gap-4 animate-in fade-in duration-300'>
                            <div className='w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center animate-pulse'>
                                <Sparkle size={18} fill="currentColor" />
                            </div>
                            <div className='px-5 py-3.5 rounded-2xl bg-slate-50 border border-slate-100'>
                                <div className='flex gap-1.5'>
                                    <span className='w-2 h-2 bg-blue-400 rounded-full animate-bounce' style={{ animationDelay: '0ms' }}></span>
                                    <span className='w-2 h-2 bg-blue-400 rounded-full animate-bounce' style={{ animationDelay: '150ms' }}></span>
                                    <span className='w-2 h-2 bg-blue-400 rounded-full animate-bounce' style={{ animationDelay: '300ms' }}></span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Error state */}
                    {error && (
                        <div className='flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl animate-in fade-in max-w-md'>
                            <AlertCircle size={18} className='text-red-500 mt-0.5 flex-shrink-0' />
                            <div className='flex-1'>
                                <p className='text-sm text-red-700'>Hmm, something went wrong. Please try again.</p>
                                <button
                                    onClick={retry}
                                    className='mt-2 text-sm text-red-600 hover:text-red-800 font-medium flex items-center gap-1.5'
                                >
                                    <RotateCcw size={14} /> Retry
                                </button>
                            </div>
                        </div>
                    )}

                    <div ref={chatEndRef} />
                </div>
            </div>

            {/* ── Input Area ── */}
            <div className='p-4 border-t border-slate-100 bg-white'>
                <form
                    onSubmit={handleSubmit}
                    className='max-w-3xl mx-auto flex items-end gap-3 bg-slate-50 border border-slate-200 rounded-2xl p-2 focus-within:border-blue-500 transition-all'
                >
                    <textarea
                        ref={inputRef}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                        placeholder={isStreaming ? 'AI is responding...' : 'Message Apex AI...'}
                        disabled={isStreaming}
                        rows={1}
                        className='flex-1 bg-transparent px-3 py-2.5 focus:outline-none text-[15px] text-slate-800 resize-none max-h-48 scrollbar-hide disabled:opacity-50 disabled:cursor-not-allowed'
                        style={{ minHeight: '44px' }}
                    />
                    <button
                        type='submit'
                        disabled={!inputValue.trim() || isStreaming}
                        className={`p-2.5 rounded-xl transition-all ${inputValue.trim() && !isStreaming
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                            }`}
                    >
                        <Send size={18} />
                    </button>
                </form>
                <p className='text-center text-[11px] text-slate-400 mt-3'>
                    Apex AI can provide information but should not be your sole source of truth.
                </p>
            </div>
        </div>
    )
}

export default ApexAI
