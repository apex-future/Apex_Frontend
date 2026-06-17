import React, { useState, useEffect } from 'react';
import { Search, Book, Volume2, ArrowLeft, Loader2, Sparkles, History, WifiOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import dictionaryService from '../../services/dictionaryService';

function Dictionary() {
    const [word, setWord] = useState('');
    const [definition, setDefinition] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [history, setHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(true);
    const navigate = useNavigate();

    const [offlineReady, setOfflineReady] = useState(false);
    const [downloadingOffline, setDownloadingOffline] = useState(false);
    const [downloadProgress, setDownloadProgress] = useState(0);
    const [offlineError, setOfflineError] = useState(null);

    useEffect(() => {
        dictionaryService.checkOfflineDictionaryStatus().then(setOfflineReady);
    }, []);

    // Load history from backend on mount (Category B — online only)
    useEffect(() => {
        const loadHistory = async () => {
            setHistoryLoading(true);
            try {
                const entries = await dictionaryService.getHistory('general', null);
                // Extract unique words from history entries
                const uniqueWords = [];
                const seen = new Set();
                for (const entry of entries) {
                    if (!seen.has(entry.word)) {
                        seen.add(entry.word);
                        uniqueWords.push(entry.word);
                    }
                }
                setHistory(uniqueWords.slice(0, 10));
            } catch (err) {
                console.warn('Failed to load dictionary history:', err);
            } finally {
                setHistoryLoading(false);
            }
        };
        loadHistory();
    }, []);

    const fetchDefinition = async (searchWord) => {
        if (!searchWord.trim()) return;

        setLoading(true);
        setError(null);
        try {
            const result = await dictionaryService.lookupWord(searchWord.trim(), 'general', null);
            // dictionaryService returns the raw API response (array or object)
            const defData = Array.isArray(result) ? result[0] : result;
            setDefinition(defData);
            // Update local history display
            setHistory(prev => [searchWord.trim(), ...prev.filter(w => w !== searchWord.trim())].slice(0, 10));
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

    return (
        <div className="w-full min-h-screen bg-bg-primary overflow-x-hidden">
            {/* Header - Glassmorphic with Dark Adaptation */}
            <div className="sticky top-0 z-50 w-full px-4 md:px-8 py-3">
                <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
                    <div className="px-1 py-1 rounded-full bg-white/15 dark:bg-white/5 backdrop-blur-xl border border-white/25 dark:border-white/10 shadow-[0_2px_16px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2 hover:bg-white/20 dark:hover:bg-white/10 text-text-secondary rounded-full transition-all group flex items-center justify-center"
                        >
                            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform text-text-primary" />
                        </button>
                    </div>

                    <div className="px-5 py-2.5 rounded-full bg-white/15 dark:bg-white/5 backdrop-blur-xl border border-white/25 dark:border-white/10 shadow-[0_2px_16px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
                        <h1 className="text-base md:text-lg font-bold font-display text-text-primary">Dictionary</h1>
                    </div>

                    <div className="w-[42px]" /> {/* Spacer */}
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-8">
                {/* Search Bar - Premium Thick Border System */}
                <form onSubmit={handleSearch} className="mb-10">
                    <div className="relative group">
                        <input
                            type="text"
                            value={word}
                            onChange={(e) => setWord(e.target.value)}
                            placeholder="Search for a word..."
                            className="w-full h-16 pl-6 pr-6 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl text-lg font-medium text-text-primary focus:outline-none focus:border-accent-primary focus:ring-4 focus:ring-accent-primary/5 transition-all shadow-sm placeholder:text-sm group-hover:border-accent-primary/30"
                        />
                        <button
                            type="submit"
                            disabled={loading}
                            className="absolute right-3 top-1/2 -translate-y-1/2 px-6 py-2.5 bg-accent-primary hover:bg-accent-hover text-white rounded-xl font-bold transition-all active:scale-95 shadow-lg shadow-accent-primary/20 disabled:opacity-50"
                        >
                            {loading ? <Loader2 size={20} className="animate-spin" /> : 'Search'}
                        </button>
                    </div>
                </form>

                {loading && (
                    <div className="flex flex-col items-center justify-center py-20 text-text-tertiary animate-in fade-in zoom-in duration-500">
                        <Loader2 size={48} className="animate-spin mb-4 text-accent-primary/40" />
                        <p className="font-medium">Discovering definition...</p>
                    </div>
                )}

                {error && !loading && (
                    <div className="bg-red-50/50 border-2 border-red-100 rounded-2xl p-8 text-center animate-in slide-in-from-top-4 duration-500">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                            {error.includes('internet') ? <WifiOff size={28} /> : <Sparkles size={28} />}
                        </div>
                        <h3 className="text-lg font-bold text-red-900 mb-2">
                            {error.includes('internet') ? 'You\'re offline' : 'Word not found'}
                        </h3>
                        <p className="text-red-700 font-medium mb-4">
                            {error.includes('internet')
                                ? 'Connect to the internet to look up new words. Previously looked up words are available offline.'
                                : `Sorry, we couldn't find a definition for "${word}". Please try another word.`
                            }
                        </p>
                        {!error.includes('internet') && (
                            <button
                                onClick={() => navigate('/ai', { state: { initialPrompt: `Can you define the word "${word}" for me?` } })}
                                className="inline-flex items-center gap-2 px-6 py-3 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-xl transition-all font-bold text-sm shadow-sm"
                            >
                                <Sparkles size={18} className="text-purple-600" />
                                Ask Cleo instead
                            </button>
                        )}
                    </div>
                )}

                {!word && !definition && !loading && history.length > 0 && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex items-center gap-2 mb-6 text-text-tertiary">
                            <History size={18} />
                            <h3 className="text-sm font-bold uppercase tracking-widest">Recent Searches</h3>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {history.map((prevWord, i) => (
                                <button
                                    key={i}
                                    onClick={() => {
                                        setWord(prevWord);
                                        fetchDefinition(prevWord);
                                    }}
                                    className="px-4 py-2 bg-white dark:bg-bg-dark-elevated border border-black/10 dark:border-white/10 rounded-xl text-text-secondary hover:border-accent-primary hover:text-accent-primary transition-all font-medium"
                                >
                                    {prevWord}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Offline Dictionary Settings */}
                {!loading && (
                    <div className="mt-10 p-6 bg-bg-subtle/80 dark:bg-bg-elevated/80 backdrop-blur-md border-t border-black/10 dark:border-white/10 rounded-3xl shadow-sm hover:shadow-md transition-all animate-in fade-in slide-in-from-bottom-2">
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="text-base font-bold text-text-primary flex items-center gap-2">
                                <WifiOff size={18} className="text-accent-primary" />
                                Offline Dictionary Support
                            </h4>
                            {offlineReady ? (
                                <span className="text-xs font-bold text-green-600 bg-green-100 px-3 py-1 rounded-xl uppercase tracking-wider">Ready</span>
                            ) : (
                                <span className="text-xs font-bold text-slate-500 bg-slate-200 dark:bg-slate-800 px-3 py-1 rounded-xl uppercase tracking-wider">Not Downloaded</span>
                            )}
                        </div>
                        <p className="text-sm text-text-secondary mb-5 leading-relaxed font-medium">
                            Download the offline dictionary (~6MB) to look up definitions without an internet connection. Previously looked up words are cached, but downloading this package ensures complete dictionary support. Note: Audio pronunciations are not available offline.
                        </p>
                        
                        {!downloadingOffline && (
                            <button 
                                onClick={handleDownloadOfflineDictionary}
                                className="px-6 py-3 bg-accent-primary hover:bg-accent-hover text-white text-sm font-bold rounded-xl transition-all shadow-md shadow-accent-primary/20 active:scale-95"
                            >
                                {offlineReady ? 'Update Offline Package' : 'Download Offline Package'}
                            </button>
                        )}
                        
                        {downloadingOffline && (
                            <div className="space-y-3">
                                <div className="h-3 w-full bg-border-default rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-accent-primary transition-all duration-300" 
                                        style={{ width: `${downloadProgress}%` }}
                                    />
                                </div>
                                <p className="text-xs text-center text-text-tertiary font-bold uppercase tracking-wider">
                                    Downloading... {downloadProgress}%
                                </p>
                            </div>
                        )}

                        {offlineError && (
                            <p className="text-sm text-red-500 mt-3 font-medium">{offlineError}</p>
                        )}
                    </div>
                )}

                {definition && !loading && (
                    <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
                        {/* Word and Phonetics */}
                        <div className="flex items-center justify-between mb-8 pb-8 border-b border-border-default">
                            <div>
                                <h2 className="text-5xl font-bold font-display text-text-primary mb-3 tracking-tightest">
                                    {definition.word}
                                </h2>
                                <p className="text-xl text-accent-primary font-medium italic">
                                    {definition.phonetic || definition.phonetics?.[0]?.text}
                                </p>
                            </div>
                            {definition.phonetics?.find(p => p.audio) && (
                                <button
                                    onClick={() => playAudio(definition.phonetics.find(p => p.audio).audio)}
                                    className="w-14 h-14 bg-accent-primary/10 text-accent-primary rounded-2xl flex items-center justify-center hover:bg-accent-primary hover:text-white transition-all active:scale-95 group"
                                >
                                    <Volume2 size={24} className="group-hover:scale-110 transition-transform" />
                                </button>
                            )}
                        </div>

                        {/* Meanings */}
                        <div className="space-y-8">
                            {(definition.meanings || []).slice(0, 3).map((meaning, idx) => (
                                <div key={idx} className="bg-bg-subtle/80 dark:bg-bg-elevated/80 backdrop-blur-md border-t border-black/10 dark:border-white/10 rounded-3xl p-6 md:p-8 hover:shadow-md transition-all shadow-sm">
                                    <div className="flex items-center gap-4 mb-6">
                                        <span className="text-sm font-bold uppercase tracking-[0.2em] text-accent-primary">
                                            {meaning.partOfSpeech}
                                        </span>
                                        <div className="h-[1px] flex-1 bg-border-default"></div>
                                    </div>

                                    <h4 className="text-xs font-bold text-text-tertiary uppercase tracking-widest mb-4">Definitions</h4>
                                    <ul className="space-y-6">
                                        {(meaning.definitions || []).slice(0, 3).map((def, defIdx) => (
                                            <li key={defIdx} className="group">
                                                <div className="flex gap-4">
                                                    <span className="text-accent-primary font-bold opacity-30 mt-1">{defIdx + 1}.</span>
                                                    <div className="space-y-3">
                                                        <p className="text-base md:text-lg text-text-primary leading-premium-snug font-medium">
                                                            {def.definition}
                                                        </p>
                                                        {def.example && (
                                                            <p className="text-sm text-text-tertiary italic pl-4 border-l-2 border-accent-primary/20">
                                                                "{def.example}"
                                                            </p>
                                                        )}
                                                        {def.synonyms?.length > 0 && (
                                                            <div className="flex flex-wrap gap-2 mt-1">
                                                                {def.synonyms.slice(0, 6).map((syn, synIdx) => (
                                                                    <span key={synIdx} className="px-2.5 py-1 bg-accent-primary/5 text-accent-primary text-xs font-semibold rounded-lg">
                                                                        {syn}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>

                                    {(meaning.synonyms?.length > 0) && (
                                        <div className="mt-8 pt-8 border-t border-border-default">
                                            <div className="flex items-center gap-2 mb-4">
                                                <Sparkles size={14} className="text-accent-primary" />
                                                <h4 className="text-xs font-bold text-text-tertiary uppercase tracking-widest">Synonyms</h4>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {meaning.synonyms.slice(0, 5).map((syn, synIdx) => (
                                                    <span key={synIdx} className="px-3 py-1.5 bg-accent-primary/5 text-accent-primary text-sm font-semibold rounded-lg">
                                                        {syn}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Source */}
                        {definition.sourceUrls?.[0] && (
                            <div className="mt-12 text-center">
                                <p className="text-xs text-text-tertiary uppercase tracking-widest mb-2">Sources</p>
                                <a
                                    href={definition.sourceUrls[0]}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm font-medium text-text-tertiary hover:text-accent-primary underline underline-offset-4 decoration-current transition-colors"
                                >
                                    {definition.sourceUrls[0]}
                                </a>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default Dictionary;
