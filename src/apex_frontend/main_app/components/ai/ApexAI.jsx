import React, { useState, useRef, useEffect } from 'react'
import { Send, ArrowLeft, Bot, User, Sparkle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

function ApexAI() {
    const navigate = useNavigate();
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const chatEndRef = useRef(null);
    const inputRef = useRef(null);

    const handleSend = (text) => {
        const content = text || inputValue.trim();
        if (!content) return;

        const userMsg = { id: Date.now(), role: 'user', content };
        setMessages(prev => [...prev, userMsg]);
        setInputValue('');
        setIsTyping(true);

        // Simulate AI response
        setTimeout(() => {
            setIsTyping(false);
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                role: 'ai',
                content: "I'm here to help. This is a simplified interface designed for clarity and focus. What can I assist you with today?",
            }]);
        }, 1000);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        handleSend();
    };

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);

    return (
        <div className='flex flex-col h-screen bg-white text-slate-900 font-sans'>

            {/* ── Header ── */}
            <header className='flex items-center px-6 py-4 border-b border-slate-100 bg-white sticky top-0 z-10'>
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
                    <h1 className='text-lg font-semibold tracking-tight'>Apex AI</h1>
                </div>
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
                                        {msg.content}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}

                    {isTyping && (
                        <div className='flex gap-4 animate-in fade-in duration-300'>
                            <div className='w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center animate-pulse'>
                                <Sparkle size={18} fill="currentColor" />
                            </div>
                            <div className='px-5 py-3.5 rounded-2xl bg-slate-50 border border-slate-100'>
                                <div className='flex gap-1'>
                                    <span className='w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce'></span>
                                    <span className='w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce delay-75'></span>
                                    <span className='w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce delay-150'></span>
                                </div>
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
                        placeholder='Message Apex AI...'
                        rows={1}
                        className='flex-1 bg-transparent px-3 py-2.5 focus:outline-none text-[15px] text-slate-800 resize-none max-h-48 scrollbar-hide'
                        style={{ minHeight: '44px' }}
                    />
                    <button
                        type='submit'
                        disabled={!inputValue.trim()}
                        className={`p-2.5 rounded-xl transition-all ${inputValue.trim()
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
