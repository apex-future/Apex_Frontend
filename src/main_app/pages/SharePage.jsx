import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Book, Highlighter, Note, DownloadSimple, ArrowRight, Quotes } from '@phosphor-icons/react';
import useThemeStore from '../store/themeStore';

const SharePage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { resolvedTheme } = useThemeStore();

    const type = searchParams.get('type'); // 'book', 'highlight', 'note'
    const title = searchParams.get('title');
    const author = searchParams.get('author');
    const text = searchParams.get('text');
    const note = searchParams.get('note');

    // Default values if no params
    if (!type) {
        return (
            <div className={`min-h-screen flex items-center justify-center bg-gray-50 dark:bg-neutral-900 ${resolvedTheme}`}>
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">Invalid Share Link</h1>
                    <button onClick={() => navigate('/')} className="text-blue-600 hover:underline">Go Home</button>
                </div>
            </div>
        );
    }

    const renderContent = () => {
        if (type === 'book') {
            return (
                <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-xl border border-gray-100 dark:border-neutral-700 p-8 max-w-lg w-full text-center mt-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="w-16 h-16 bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <Book size={32} weight="fill" />
                    </div>
                    <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">Book Recommendation</h2>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2">{title}</h1>
                    <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">by {author}</p>
                    
                    <div className="p-4 bg-gray-50 dark:bg-neutral-900 rounded-xl mb-8">
                        <p className="text-gray-600 dark:text-gray-400 italic">"I'm reading this on Apex right now, you should check it out!"</p>
                    </div>
                </div>
            );
        }

        if (type === 'highlight') {
            return (
                <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-xl border border-gray-100 dark:border-neutral-700 p-8 max-w-lg w-full mt-12 animate-in fade-in slide-in-from-bottom-4 duration-500 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-amber-300 to-orange-400" />
                    <div className="w-12 h-12 bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 rounded-xl flex items-center justify-center mb-6">
                        <Highlighter size={24} weight="fill" />
                    </div>
                    <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-4">Highlighted Quote</h2>
                    
                    <div className="relative pl-6">
                        <Quotes size={32} weight="fill" className="absolute -top-2 -left-2 text-amber-200 dark:text-amber-500/20" />
                        <p className="text-xl md:text-2xl font-serif text-gray-800 dark:text-gray-200 leading-relaxed relative z-10">
                            {text}
                        </p>
                    </div>
                </div>
            );
        }

        if (type === 'note') {
            return (
                <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-xl border border-gray-100 dark:border-neutral-700 max-w-xl w-full mt-12 animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col overflow-hidden">
                    <div className="p-6 md:p-8 bg-gray-50 dark:bg-neutral-900/50 border-b border-gray-100 dark:border-neutral-800">
                        <div className="flex items-center gap-3 mb-4">
                            <Highlighter size={20} className="text-gray-400" />
                            <h2 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Source Quote</h2>
                        </div>
                        <p className="text-lg font-serif text-gray-600 dark:text-gray-400 italic border-l-4 border-gray-300 dark:border-gray-600 pl-4">
                            "{text}"
                        </p>
                    </div>
                    
                    <div className="p-6 md:p-8 relative">
                        <div className="absolute top-0 right-8 -mt-5 w-10 h-10 bg-accent-primary text-white rounded-full flex items-center justify-center shadow-lg shadow-accent-primary/30">
                            <Note size={20} weight="fill" />
                        </div>
                        <h2 className="text-xs font-bold text-accent-primary uppercase tracking-widest mb-4 mt-2">Personal Note</h2>
                        <p className="text-lg md:text-xl text-gray-900 dark:text-white leading-relaxed">
                            {note}
                        </p>
                    </div>
                </div>
            );
        }

        return null;
    };

    return (
        <div className={`min-h-screen bg-gray-50 dark:bg-neutral-900 flex flex-col items-center p-4 md:p-8 font-sans ${resolvedTheme}`}>
            {/* Header */}
            <div className="w-full max-w-5xl flex justify-between items-center py-4">
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2L2 22H22L12 2Z" fill="white"/>
                        </svg>
                    </div>
                    <span className="font-display font-black text-xl tracking-tight text-gray-900 dark:text-white">Apex</span>
                </div>
                
                <button 
                    onClick={() => navigate('/signup')}
                    className="px-4 py-2 bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 dark:text-gray-900 text-white text-sm font-bold rounded-full transition-colors flex items-center gap-2 shadow-sm"
                >
                    Get Apex <ArrowRight size={14} weight="bold" />
                </button>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col items-center justify-center w-full max-w-5xl">
                {renderContent()}

                {/* Call to action */}
                <div className="mt-16 text-center max-w-md mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Read better with Apex</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-6">
                        Apex is a modern reader that helps you focus, understand, and remember what you read.
                    </p>
                    <button 
                        onClick={() => navigate('/signup')}
                        className="px-8 py-3.5 bg-accent-primary hover:bg-indigo-600 text-white font-bold rounded-xl transition-all hover:scale-105 active:scale-95 shadow-xl shadow-accent-primary/20 flex items-center justify-center gap-2 mx-auto"
                    >
                        <DownloadSimple size={20} weight="bold" />
                        Start reading for free
                    </button>
                </div>
            </div>
            
            {/* Footer */}
            <div className="w-full text-center py-8 mt-auto">
                <p className="text-sm text-gray-400 dark:text-gray-500 font-medium">Shared via Apex Reader</p>
            </div>
        </div>
    );
};

export default SharePage;
