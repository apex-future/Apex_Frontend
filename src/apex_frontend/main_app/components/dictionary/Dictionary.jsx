import React, { useState, useEffect } from 'react';
import { Search, Book, Volume2, ArrowLeft, Loader2, Sparkles, History } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function Dictionary() {
    const [word, setWord] = useState('');
    const [definition, setDefinition] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [history, setHistory] = useState([]);
    const navigate = useNavigate();

    // Load history from localStorage
    useEffect(() => {
        const savedHistory = localStorage.getItem('apex_dictionary_history');
        if (savedHistory) {
            setHistory(JSON.parse(savedHistory));
        }
    }, []);

    const saveToHistory = (newWord) => {
        const updatedHistory = [newWord, ...history.filter(w => w !== newWord)].slice(0, 10);
        setHistory(updatedHistory);
        localStorage.setItem('apex_dictionary_history', JSON.stringify(updatedHistory));
    };

    const fetchDefinition = async (searchWord) => {
        if (!searchWord.trim()) return;

        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${searchWord}`);
            if (!response.ok) throw new Error('Word not found');
            const data = await response.json();
            setDefinition(data[0]);
            saveToHistory(searchWord);
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

    return (
        <div className="w-full min-h-screen bg-bg-primary overflow-x-hidden">
            {/* Header - Glassmorphic with Subtle Gradient */}
            <div className="relative bg-white/40 backdrop-blur-md border-b border-border-default z-20">
                <div className="max-w-4xl mx-auto px-4 py-6 flex items-center justify-between">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-neutral-100 rounded-xl transition-all group"
                    >
                        <ArrowLeft size={20} className="text-text-secondary group-hover:-translate-x-1 transition-transform" />
                    </button>

                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-accent-primary/10 rounded-lg text-accent-primary">
                            <Book size={20} />
                        </div>
                        <h1 className="text-xl font-bold font-display text-text-primary">Dictionary</h1>
                    </div>

                    <div className="w-10"></div> {/* Spacer */}
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-8">
                {/* Search Bar - Premium Thick Border System */}
                <form onSubmit={handleSearch} className="mb-10">
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                            <Search className="text-text-tertiary group-focus-within:text-accent-primary transition-colors" size={20} />
                        </div>
                        <input
                            type="text"
                            value={word}
                            onChange={(e) => setWord(e.target.value)}
                            placeholder="Search for a word..."
                            className="w-full h-16 pl-14 pr-6 bg-white/80 backdrop-blur-sm border-2 border-border-default rounded-2xl text-lg font-medium text-text-primary focus:outline-none focus:border-accent-primary focus:ring-4 focus:ring-accent-primary/5 transition-all shadow-sm group-hover:border-text-tertiary"
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
                            <Sparkles size={28} />
                        </div>
                        <h3 className="text-lg font-bold text-red-900 mb-2">Word not found</h3>
                        <p className="text-red-700 font-medium">Sorry, we couldn't find a definition for "{word}". Please try another word.</p>
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
                                    className="px-4 py-2 bg-white border-2 border-border-default rounded-xl text-text-secondary hover:border-accent-primary hover:text-accent-primary transition-all font-medium"
                                >
                                    {prevWord}
                                </button>
                            ))}
                        </div>
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
                            {definition.meanings.map((meaning, idx) => (
                                <div key={idx} className="bg-white/60 backdrop-blur-md border-2 border-border-default rounded-3xl p-6 md:p-8 hover:border-text-tertiary transition-all">
                                    <div className="flex items-center gap-4 mb-6">
                                        <span className="text-sm font-bold uppercase tracking-[0.2em] text-accent-primary">
                                            {meaning.partOfSpeech}
                                        </span>
                                        <div className="h-[1px] flex-1 bg-border-default"></div>
                                    </div>

                                    <h4 className="text-xs font-bold text-text-tertiary uppercase tracking-widest mb-4">Definitions</h4>
                                    <ul className="space-y-6">
                                        {meaning.definitions.slice(0, 3).map((def, defIdx) => (
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
