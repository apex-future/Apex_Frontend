import React, { useState, useEffect } from 'react';
import { MagnifyingGlass, X, SpeakerHigh, Spinner, Book, WifiSlash } from '@phosphor-icons/react';
import dictionaryService from '../../../../services/dictionaryService';

function ReaderDictionary({ isOpen, onClose, bookId, initialWord }) {
    const [word, setWord] = useState('');
    const [definition, setDefinition] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [offlineReady, setOfflineReady] = useState(false);
    const [downloadingOffline, setDownloadingOffline] = useState(false);
    const [downloadProgress, setDownloadProgress] = useState(0);
    const [offlineError, setOfflineError] = useState(null);

    useEffect(() => {
        dictionaryService.checkOfflineDictionaryStatus().then(setOfflineReady);
    }, [isOpen]);

    useEffect(() => {
        if (isOpen && initialWord?.trim()) {
            setWord(initialWord.trim());
            // User requested to cut the automatic search trigger
            // fetchDefinition(initialWord.trim());
        }
    }, [isOpen, initialWord]);

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

    const handleDownloadOfflineDictionary = async () => {
        setDownloadingOffline(true);
        setOfflineError(null);
        setDownloadProgress(0);
        try {
            await dictionaryService.downloadOfflineDictionary(setDownloadProgress);
            setOfflineReady(true);
        } catch (err) {
            setOfflineError(err.message);
        } finally {
            setDownloadingOffline(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={onClose}
        >
            <div 
                className="aura-card-raised w-full max-w-lg transition-shadow overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 flex flex-col max-h-[80vh]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-6 border-b border-border-default flex items-center justify-between bg-bg-elevated/50 backdrop-blur-md sticky top-0 z-10">
                    <div className="flex items-center gap-3">
                        <div className="size-10 rounded-xl bg-accent-primary/10 flex items-center justify-center text-accent-primary">
                            <Book size={20} weight="bold" />
                        </div>
                        <h2 className="text-xl font-bold font-display text-text-primary tracking-tight">Quick Dictionary</h2>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 hover:bg-bg-subtle rounded-xl text-text-tertiary transition-colors"
                    >
                        <X size={20} weight="bold" />
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                    {/* MagnifyingGlass Input */}
                    <form onSubmit={handleSearch} className="mb-6">
                        <div className="relative group">
                            <MagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary group-focus-within:text-accent-primary transition-colors" size={18} weight="bold" />
                            <input
                                type="text"
                                value={word}
                                onChange={(e) => setWord(e.target.value)}
                                className="w-full h-14 pl-12 pr-6 bg-surface-sunken rounded-2xl text-base font-medium text-text-primary focus:outline-none transition-all placeholder:text-sm font-sans"
                            />
                        </div>
                    </form>

                    {loading && (
                        <div className="flex flex-col items-center justify-center py-12 text-text-tertiary">
                            <Spinner size={32} weight="bold" className="animate-spin mb-3 text-accent-primary" />
                            <p className="text-sm font-medium font-sans">Looking up definition...</p>
                        </div>
                    )}

                    {error && (
                        <div className="py-8 text-center bg-red-50/50 rounded-2xl border border-red-100 p-6">
                            <div className="text-red-500 mb-3 flex justify-center">
                                {error.includes('internet') ? <WifiSlash size={28} weight="bold" /> : <X size={28} weight="bold" />}
                            </div>
                            <p className="text-sm text-red-700 font-medium font-sans">
                                {error.includes('internet') 
                                    ? 'Internet connection required for new words.' 
                                    : `Couldn't find definition for "${word}".`
                                }
                            </p>
                        </div>
                    )}

                    {definition && !loading && (
                        <div className="animate-in fade-in duration-500">
                            <div className="flex items-center justify-between mb-6 pb-6">
                                <div>
                                    <h3 className="text-3xl font-black font-display text-text-primary capitalize tracking-tight mb-1">{definition.word}</h3>
                                    <p className="text-accent-primary font-bold italic text-base">
                                        {definition.phonetic || definition.phonetics?.[0]?.text}
                                    </p>
                                </div>
                                {definition.phonetics?.find(p => p.audio) && (
                                    <button
                                        onClick={() => playAudio(definition.phonetics.find(p => p.audio).audio)}
                                        className="size-12 bg-accent-primary/10 text-accent-primary rounded-xl flex items-center justify-center hover:bg-accent-primary hover:text-white transition-all active:scale-95"
                                    >
                                        <SpeakerHigh size={24} weight="fill" />
                                    </button>
                                )}
                            </div>

                            <div className="space-y-6">
                                {definition.meanings.slice(0, 3).map((meaning, idx) => (
                                    <div key={idx} className="space-y-3">
                                        <div className="flex items-center gap-3">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-accent-primary bg-accent-primary/10 px-2 py-0.5 rounded">
                                                {meaning.partOfSpeech}
                                            </span>
                                            <div className="h-px flex-1"></div>
                                        </div>
                                        <ul className="space-y-4">
                                            {(meaning.definitions || []).slice(0, 3).map((def, defIdx) => (
                                                <li key={defIdx} className="flex gap-3">
                                                    <span className="text-accent-primary font-bold opacity-40 text-sm mt-0.5">{defIdx + 1}.</span>
                                                    <div>
                                                        <p className="text-base text-text-secondary leading-relaxed font-medium font-sans">
                                                            {def.definition}
                                                        </p>
                                                        {def.example && (
                                                            <p className="text-sm text-text-tertiary italic pl-4 font-sans mt-2">
                                                                "{def.example}"
                                                            </p>
                                                        )}
                                                        {def.synonyms?.length > 0 && (
                                                            <div className="flex flex-wrap gap-1.5 mt-2">
                                                                {def.synonyms.slice(0, 5).map((syn, synIdx) => (
                                                                    <span key={synIdx} className="text-xs font-semibold text-accent-primary bg-accent-primary/10 px-2 py-0.5 rounded-md">
                                                                        {syn}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                        {meaning.synonyms?.length > 0 && (
                                            <div className="pt-3">
                                                <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider mb-2">Synonyms</p>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {meaning.synonyms.slice(0, 5).map((syn, synIdx) => (
                                                        <span key={synIdx} className="text-xs font-semibold text-accent-primary bg-accent-primary/10 px-2 py-0.5 rounded-md">
                                                            {syn}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {!word && !definition && !loading && (
                        <div className="py-12 text-center opacity-40">
                            <Book size={48} weight="regular" className="mx-auto mb-4" />
                            <p className="text-sm font-medium font-sans">Enter a word to see its definition.</p>
                        </div>
                    )}

                    {/* Offline Dictionary Gear */}
                    {!loading && (
                        <div className="mt-8 p-4 bg-bg-subtle rounded-2xl animate-in fade-in slide-in-from-bottom-2">
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="text-sm font-bold text-text-primary flex items-center gap-2">
                                    <WifiSlash size={16} weight="bold" className="text-accent-primary" />
                                    Offline Dictionary
                                </h4>
                                {offlineReady ? (
                                    <span className="text-[10px] font-bold text-green-600 bg-green-100 px-2 py-1 rounded-lg uppercase tracking-wider">Ready</span>
                                ) : (
                                    <span className="text-[10px] font-bold text-slate-500 bg-slate-200 dark:bg-slate-800 px-2 py-1 rounded-lg uppercase tracking-wider">Not Downloaded</span>
                                )}
                            </div>
                            <p className="text-xs text-text-secondary mb-4 leading-relaxed font-medium">
                                Download the offline dictionary (~6MB) to look up words without an internet connection. Note: Audio pronunciations are not available offline.
                            </p>
                            
                            {!downloadingOffline && (
                                <button 
                                    onClick={handleDownloadOfflineDictionary}
                                    className="w-full py-2.5 bg-surface-sunken hover:bg-bg-elevated hover:text-accent-primary text-text-secondary text-sm font-bold rounded-xl transition-all"
                                >
                                    {offlineReady ? 'Update Dictionary' : 'DownloadSimple Dictionary'}
                                </button>
                            )}
                            
                            {downloadingOffline && (
                                <div className="space-y-2">
                                    <div className="h-2 w-full bg-border-default rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-accent-primary transition-all duration-300" 
                                            style={{ width: `${downloadProgress}%` }}
                                        />
                                    </div>
                                    <p className="text-[10px] text-center text-text-tertiary font-bold uppercase tracking-wider">
                                        Downloading... {downloadProgress}%
                                    </p>
                                </div>
                            )}

                            {offlineError && (
                                <p className="text-xs text-red-500 mt-2 font-medium">{offlineError}</p>
                            )}
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
