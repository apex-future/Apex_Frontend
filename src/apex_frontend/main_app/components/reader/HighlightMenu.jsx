import React, { useState } from 'react';
import { Sparkles, Book, Highlighter, X, Loader2, Volume2, BookmarkPlus, Check } from 'lucide-react';

function HighlightMenu({ selection, position, onAskAI, bookId, onSaveWord, onHighlight, onDictToggle }) {
    const [definition, setDefinition] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showDict, setShowDict] = useState(false);
    const [wordSaved, setWordSaved] = useState(false);

    const toggleDict = (val) => {
        setShowDict(val);
        onDictToggle?.(val);
    };

    const fetchDefinition = async (searchWord) => {
        if (!searchWord.trim()) return;
        setLoading(true);
        setError(null);
        toggleDict(true);
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

    // On mobile (<640px) float near or use a more centered bottom sheet
    // User wants "pop up close to the area of highlight"
    const isMobile = window.innerWidth < 640;

    const menuStyle = isMobile
        ? { 
            top: `${Math.max(80, position.y - 100)}px`, 
            left: `${Math.min(window.innerWidth - 310, Math.max(10, position.x - 150))}px`,
            width: '300px'
          }
        : {
            top: `${Math.max(10, position.y - 120)}px`,
            left: `${Math.min(window.innerWidth - 300, Math.max(10, position.x - 100))}px`,
        };

    return (
        <div 
            className={`fixed z-[300] animate-in fade-in duration-200 pointer-events-auto ${isMobile ? 'zoom-in-95' : 'zoom-in'}`}
            style={menuStyle}
            onClick={(e) => e.stopPropagation()}
        >
            <div className="bg-white border border-slate-200 shadow-2xl rounded-2xl overflow-hidden flex flex-col min-w-[200px] w-full max-w-[400px]">
                {!showDict ? (
                    <div className="flex items-center p-1.5 gap-1">
                        <button 
                            onClick={() => fetchDefinition(selection)}
                            className="flex flex-col items-center justify-center p-3 hover:bg-slate-50 rounded-xl transition-all group flex-1"
                        >
                            <Book size={20} className="text-slate-600 group-hover:text-blue-600 transition-colors" />
                            <span className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tighter font-sans">Define</span>
                        </button>
                        
                        <div className="w-[1px] h-8 bg-slate-100" />

                        <button 
                            onClick={onAskAI}
                            className="flex flex-col items-center justify-center p-3 hover:bg-slate-50 rounded-xl transition-all group flex-1"
                        >
                            <Sparkles size={20} className="text-slate-600 group-hover:text-purple-600 transition-colors" />
                            <span className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tighter font-sans">Ask AI</span>
                        </button>

                        <div className="w-[1px] h-8 bg-slate-100" />

                        <div className="flex gap-1.5 px-3">
                            {['#fef08a', '#bbf7d0', '#bfdbfe'].map(color => (
                                <button 
                                    key={color}
                                    onClick={() => onHighlight?.(color)}
                                    className="w-5 h-5 rounded-full border border-slate-200 hover:scale-110 transition-transform"
                                    style={{ backgroundColor: color }}
                                    title="Highlight"
                                />
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="p-5 animate-in slide-in-from-bottom-2 duration-300 font-sans">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] font-sans">Dictionary</h3>
                            <button onClick={() => toggleDict(false)} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
                                <X size={16} className="text-slate-400" />
                            </button>
                        </div>

                        {loading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 size={28} className="animate-spin text-blue-500 opacity-60" />
                            </div>
                        ) : error ? (
                            <p className="text-sm text-red-500 py-6 font-medium font-sans italic">"{selection}" not found.</p>
                        ) : definition && (
                            <div className="max-h-64 overflow-y-auto custom-scrollbar pr-1">
                                <div className="flex items-center justify-between gap-3 mb-3">
                                    <h2 className="text-2xl font-black text-slate-900 capitalize font-sans tracking-tight">{definition.word}</h2>
                                    {definition.phonetics?.find(p => p.audio) && (
                                        <button 
                                            onClick={() => playAudio(definition.phonetics.find(p => p.audio).audio)} 
                                            className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 hover:bg-blue-100 transition-all hover:scale-110"
                                        >
                                            <Volume2 size={18} />
                                        </button>
                                    )}
                                </div>
                                <p className="text-sm text-blue-600 font-bold mb-5 font-sans bg-blue-50/50 px-2 py-1 rounded-md inline-block">{definition.phonetic}</p>
                                
                                {definition.meanings.slice(0, 3).map((m, i) => (
                                    <div key={i} className="mb-5 last:mb-2">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-[10px] font-black uppercase text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded tracking-wider">{m.partOfSpeech}</span>
                                            <div className="h-px flex-1 bg-slate-100" />
                                        </div>
                                        <p className="text-[15px] text-slate-700 leading-relaxed font-medium font-sans">
                                            {m.definitions[0].definition}
                                        </p>
                                        {m.definitions[0].example && (
                                            <p className="text-[13px] text-slate-400 mt-2 font-sans italic border-l-2 border-slate-100 pl-3">
                                                "{m.definitions[0].example}"
                                            </p>
                                        )}
                                    </div>
                                ))}
                                {onSaveWord && bookId && (
                                    <button
                                        onClick={handleSaveWord}
                                        disabled={wordSaved}
                                        className={`w-full mt-4 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-all shadow-sm ${
                                            wordSaved
                                                ? 'bg-green-50 text-green-600 border border-green-200'
                                                : 'bg-slate-900 text-white hover:bg-black active:scale-[0.98]'
                                        }`}
                                    >
                                        {wordSaved ? <Check size={18} /> : <BookmarkPlus size={18} />}
                                        {wordSaved ? 'Word Saved' : 'Save to Vocabulary'}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
            
            {/* Arrow — hide on mobile as it might not align well with dynamic float */}
            {!isMobile && (
                <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-white mx-auto" />
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
