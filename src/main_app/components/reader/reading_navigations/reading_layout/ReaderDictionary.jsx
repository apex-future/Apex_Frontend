import React, { useState, useEffect } from 'react';
import { Search, X, Volume2, Loader2, Book, WifiOff } from 'lucide-react';
import dictionaryService from '../../../../services/dictionaryService';

function ReaderDictionary({ isOpen, onClose, bookId }) {
    const [word, setWord] = useState('');
    const [definition, setDefinition] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchDefinition = async (searchWord) => {
        if (!searchWord.trim()) return;

        setLoading(true);
        setError(null);
        try {
            const result = await dictionaryService.lookupWord(searchWord.trim(), 'in_reader', bookId);
            const defData = Array.isArray(result) ? result[0] : result;
            setDefinition(defData);
        } catch (err) {
            setError(err.message);
            setDefinition(null);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchDefinition(word);
    };

    const playAudio = (url) => {
        if (!url) return;
        const audio = new Audio(url);
        audio.play();
    };

    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={onClose}
        >
            <div 
                className="bg-bg-elevated w-full max-w-lg rounded-3xl shadow-2xl border border-border-default overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 flex flex-col max-h-[80vh]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-6 border-b border-border-default flex items-center justify-between bg-bg-elevated/50 backdrop-blur-md sticky top-0 z-10">
                    <div className="flex items-center gap-3">
                        <div className="size-10 rounded-xl bg-accent-primary/10 flex items-center justify-center text-accent-primary">
                            <Book size={20} />
                        </div>
                        <h2 className="text-xl font-bold text-text-primary tracking-tight">Quick Dictionary</h2>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 hover:bg-bg-subtle rounded-xl text-text-tertiary transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                    {/* Search Input */}
                    <form onSubmit={handleSearch} className="mb-6">
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary group-focus-within:text-accent-primary transition-colors" size={18} />
                            <input
                                type="text"
                                value={word}
                                onChange={(e) => setWord(e.target.value)}
                                placeholder="Search for a word..."
                                className="w-full h-14 pl-12 pr-6 bg-bg-subtle border-2 border-border-default rounded-2xl text-base font-medium text-text-primary focus:outline-none focus:border-accent-primary transition-all placeholder:text-sm"
                                autoFocus
                            />
                        </div>
                    </form>

                    {loading && (
                        <div className="flex flex-col items-center justify-center py-12 text-text-tertiary">
                            <Loader2 size={32} className="animate-spin mb-3 text-accent-primary" />
                            <p className="text-sm font-medium">Looking up definition...</p>
                        </div>
                    )}

                    {error && (
                        <div className="py-8 text-center bg-red-50/50 rounded-2xl border border-red-100 p-6">
                            <div className="text-red-500 mb-3 flex justify-center">
                                {error.includes('internet') ? <WifiOff size={28} /> : <X size={28} />}
                            </div>
                            <p className="text-sm text-red-700 font-medium">
                                {error.includes('internet') 
                                    ? 'Internet connection required for new words.' 
                                    : `Couldn't find definition for "${word}".`
                                }
                            </p>
                        </div>
                    )}

                    {definition && !loading && (
                        <div className="animate-in fade-in duration-500">
                            <div className="flex items-center justify-between mb-6 pb-6 border-b border-border-default">
                                <div>
                                    <h3 className="text-3xl font-black text-text-primary capitalize tracking-tight mb-1">{definition.word}</h3>
                                    <p className="text-accent-primary font-bold italic text-base">
                                        {definition.phonetic || definition.phonetics?.[0]?.text}
                                    </p>
                                </div>
                                {definition.phonetics?.find(p => p.audio) && (
                                    <button
                                        onClick={() => playAudio(definition.phonetics.find(p => p.audio).audio)}
                                        className="size-12 bg-accent-primary/10 text-accent-primary rounded-xl flex items-center justify-center hover:bg-accent-primary hover:text-white transition-all active:scale-95"
                                    >
                                        <Volume2 size={24} />
                                    </button>
                                )}
                            </div>

                            <div className="space-y-6">
                                {definition.meanings.slice(0, 2).map((meaning, idx) => (
                                    <div key={idx} className="space-y-3">
                                        <div className="flex items-center gap-3">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-accent-primary bg-accent-primary/10 px-2 py-0.5 rounded">
                                                {meaning.partOfSpeech}
                                            </span>
                                            <div className="h-px flex-1 bg-border-default"></div>
                                        </div>
                                        <p className="text-base text-text-secondary leading-relaxed font-medium">
                                            {meaning.definitions[0].definition}
                                        </p>
                                        {meaning.definitions[0].example && (
                                            <p className="text-sm text-text-tertiary italic pl-4 border-l-2 border-border-default">
                                                "{meaning.definitions[0].example}"
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {!word && !definition && !loading && (
                        <div className="py-12 text-center opacity-40">
                            <Book size={48} className="mx-auto mb-4" strokeWidth={1} />
                            <p className="text-sm font-medium">Enter a word to see its definition.</p>
                        </div>
                    )}
                </div>

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
        </div>
    );
}

export default ReaderDictionary;
