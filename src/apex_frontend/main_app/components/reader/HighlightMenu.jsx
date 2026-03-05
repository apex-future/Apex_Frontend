import React, { useState } from 'react';
import { Sparkles, Book, Highlighter, X, Loader2, Volume2, BookmarkPlus, Check } from 'lucide-react';

function HighlightMenu({ selection, position, onAskAI, bookId, onSaveWord }) {
    const [definition, setDefinition] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showDict, setShowDict] = useState(false);
    const [wordSaved, setWordSaved] = useState(false);

    const fetchDefinition = async (searchWord) => {
        if (!searchWord.trim()) return;
        setLoading(true);
        setError(null);
        setShowDict(true);
        setWordSaved(false);
        try {
            const cleanWord = searchWord.trim().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g,"");
            const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${cleanWord}`);
            if (!response.ok) throw new Error('Word not found');
            const data = await response.json();
            setDefinition(data[0]);
        } catch (err) {
            setError(err.message);
            setDefinition(null);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveWord = () => {
        if (!definition || !onSaveWord || !bookId) return;
        const firstMeaning = definition.meanings?.[0];
        const wordObj = {
            word: definition.word,
            definition: firstMeaning?.definitions?.[0]?.definition || '',
            partOfSpeech: firstMeaning?.partOfSpeech || '',
            phonetic: definition.phonetic || '',
        };
        onSaveWord(bookId, wordObj);
        setWordSaved(true);
    };

    const playAudio = (url) => {
        if (!url) return;
        const audio = new Audio(url);
        audio.play();
    };

    // On mobile (<640px) use a fixed bottom sheet; on desktop float near selection
    const isMobile = window.innerWidth < 640;

    const menuStyle = isMobile
        ? { left: 0, right: 0, bottom: 0 }
        : {
            top: `${Math.max(10, position.y - 120)}px`,
            left: `${Math.min(window.innerWidth - 300, Math.max(10, position.x - 100))}px`,
        };

    return (
        <div 
            className={`fixed z-[300] animate-in fade-in duration-200 pointer-events-auto ${isMobile ? 'zoom-in-95 slide-in-from-bottom-4 px-2 pb-[env(safe-area-inset-bottom,8px)]' : 'zoom-in'}`}
            style={menuStyle}
            onClick={(e) => e.stopPropagation()}
        >
            <div className="bg-white/90 backdrop-blur-xl border border-slate-200 shadow-2xl rounded-2xl overflow-hidden flex flex-col min-w-[200px] max-w-[320px]">
                {!showDict ? (
                    <div className="flex items-center p-1.5 gap-1">
                        <button 
                            onClick={() => fetchDefinition(selection)}
                            className="flex flex-col items-center justify-center p-3 hover:bg-slate-50 rounded-xl transition-all group flex-1"
                        >
                            <Book size={20} className="text-slate-600 group-hover:text-blue-600 transition-colors" />
                            <span className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">Define</span>
                        </button>
                        
                        <div className="w-[1px] h-8 bg-slate-100" />

                        <button 
                            onClick={onAskAI}
                            className="flex flex-col items-center justify-center p-3 hover:bg-slate-50 rounded-xl transition-all group flex-1"
                        >
                            <Sparkles size={20} className="text-slate-600 group-hover:text-purple-600 transition-colors" />
                            <span className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">Ask AI</span>
                        </button>

                        <div className="w-[1px] h-8 bg-slate-100" />

                        <div className="flex gap-1.5 px-3">
                            {['#fef08a', '#bbf7d0', '#bfdbfe'].map(color => (
                                <button 
                                    key={color}
                                    className="w-5 h-5 rounded-full border border-slate-200 hover:scale-110 transition-transform"
                                    style={{ backgroundColor: color }}
                                    title="Highlight"
                                />
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="p-4 animate-in slide-in-from-bottom-2 duration-300">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Dictionary</h3>
                            <button onClick={() => setShowDict(false)} className="p-1 hover:bg-slate-100 rounded-md">
                                <X size={14} className="text-slate-400" />
                            </button>
                        </div>

                        {loading ? (
                            <div className="flex items-center justify-center py-6">
                                <Loader2 size={24} className="animate-spin text-blue-500 opacity-50" />
                            </div>
                        ) : error ? (
                            <p className="text-xs text-red-500 py-4 font-medium">"{selection}" not found in dictionary.</p>
                        ) : definition && (
                            <div className="max-h-48 overflow-y-auto custom-scrollbar">
                                <div className="flex items-center justify-between gap-2 mb-2">
                                    <h2 className="text-lg font-bold text-slate-900 capitalize">{definition.word}</h2>
                                    {definition.phonetics?.find(p => p.audio) && (
                                        <button onClick={() => playAudio(definition.phonetics.find(p => p.audio).audio)} className="text-blue-500 hover:scale-110 transition-transform">
                                            <Volume2 size={16} />
                                        </button>
                                    )}
                                </div>
                                <p className="text-xs text-blue-600 italic mb-3">{definition.phonetic}</p>
                                
                                {definition.meanings.slice(0, 2).map((m, i) => (
                                    <div key={i} className="mb-3">
                                        <span className="text-[9px] font-black uppercase text-slate-300 tracking-tighter block mb-1">{m.partOfSpeech}</span>
                                        <p className="text-xs text-slate-600 leading-relaxed font-medium">
                                            {m.definitions[0].definition}
                                        </p>
                                    </div>
                                ))}
                                {onSaveWord && bookId && (
                                    <button
                                        onClick={handleSaveWord}
                                        disabled={wordSaved}
                                        className={`w-full mt-2 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                                            wordSaved
                                                ? 'bg-green-50 text-green-600 border border-green-200'
                                                : 'bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100'
                                        }`}
                                    >
                                        {wordSaved ? <Check size={14} /> : <BookmarkPlus size={14} />}
                                        {wordSaved ? 'Word Saved' : 'Save Word'}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
            
            {/* Arrow — only show on desktop where the menu floats near selection */}
            {!isMobile && (
                <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-white/90 mx-auto" />
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
        </div>
    );
}

export default HighlightMenu;
