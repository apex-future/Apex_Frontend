import React, { useState } from 'react';
import { Sparkles, Book, Highlighter, X, Loader2, Volume2, BookmarkPlus, Check, WifiOff, StickyNote, Save } from 'lucide-react';
import dictionaryService from '../../services/dictionaryService';

function HighlightMenu({ selection, position, onAskAI, bookId, onSaveWord, onHighlight, onDictToggle, onAddNote, onClose }) {
    const [definition, setDefinition] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showDict, setShowDict] = useState(false);
    const [showNote, setShowNote] = useState(false);
    const [noteText, setNoteText] = useState('');
    const [noteSaved, setNoteSaved] = useState(false);
    const [wordSaved, setWordSaved] = useState(false);

    const toggleDict = (val) => {
        setShowDict(val);
        setShowNote(false);
        onDictToggle?.(val);
    };

    const toggleNote = (val) => {
        setShowNote(val);
        setShowDict(false);
        onDictToggle?.(val);
    };

    const handleCloseModal = () => {
        // Always close the entire menu and clear selection when dismissing a sub-modal
        window.getSelection()?.removeAllRanges();
        onClose?.();
    };

    const fetchDefinition = async (searchWord) => {
        if (!searchWord.trim()) return;
        setLoading(true);
        setError(null);
        toggleDict(true);
        setWordSaved(false);
        try {
            const cleanWord = searchWord.trim().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "");
            // Use dictionaryService with in_reader context
            const result = await dictionaryService.lookupWord(cleanWord, 'in_reader', bookId);
            // dictionaryService returns the raw API response (array or object)
            const defData = Array.isArray(result) ? result[0] : result;
            setDefinition(defData);
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

    const handleSaveNote = () => {
        if (!noteText.trim() || !onAddNote) return;
        onAddNote({
            text: noteText.trim(),
            context: selection,
            type: 'highlight_note'
        });
        setNoteSaved(true);
        setTimeout(() => {
            toggleNote(false);
            setNoteSaved(false);
            setNoteText('');
        }, 1500);
    };

    const playAudio = (url) => {
        if (!url) return;
        const audio = new Audio(url);
        audio.play();
    };

    // On mobile (<640px) float near or use a more centered bottom sheet
    // User wants "pop up close to the area of highlight"
    const isMobile = window.innerWidth < 640;

    let menuStyle = {};

    if (showDict || showNote) {
        menuStyle = {
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: isMobile ? '340px' : '400px',
            maxWidth: '90vw',
            maxHeight: '85vh' // avoid covering edges on small screens
        };
    } else {
        menuStyle = isMobile
            ? {
                top: `${Math.max(80, position.y - 100)}px`,
                left: `${Math.min(window.innerWidth - 310, Math.max(10, position.x - 150))}px`,
                width: '300px'
            }
            : {
                top: `${Math.max(10, position.y - 120)}px`,
                left: `${Math.min(window.innerWidth - 300, Math.max(10, position.x - 100))}px`,
            };
    }

    return (
        <div
            className={`fixed z-[300] animate-in fade-in duration-200 pointer-events-auto ${isMobile ? 'zoom-in-95' : 'zoom-in'}`}
            style={menuStyle}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Text action menu"
        >
            <div className="bg-bg-elevated border border-border-default shadow-2xl rounded-2xl overflow-hidden flex flex-col min-w-[200px] w-full max-w-[400px]">
                {!showDict && !showNote ? (
                    <div className="flex items-center p-1.5 gap-1">
                        <button
                            onClick={() => fetchDefinition(selection)}
                            className="flex flex-col items-center justify-center p-3 hover:bg-bg-subtle rounded-xl transition-all group flex-1"
                        >
                            <Book size={20} className="text-text-secondary group-hover:text-blue-600 transition-colors" />
                            <span className="text-[10px] font-bold text-text-tertiary mt-1 uppercase tracking-tighter font-sans">Define</span>
                        </button>

                        <div className="w-[1px] h-8 bg-bg-subtle" />

                        <button
                            onClick={onAskAI}
                            className="flex flex-col items-center justify-center p-3 hover:bg-bg-subtle rounded-xl transition-all group flex-1"
                        >
                            <Sparkles size={20} className="text-text-secondary group-hover:text-purple-600 transition-colors" />
                            <span className="text-[10px] font-bold text-text-tertiary mt-1 uppercase tracking-tighter font-sans">Ask</span>
                        </button>

                        <div className="w-[1px] h-8 bg-bg-subtle" />

                        <button
                            onClick={() => toggleNote(true)}
                            className="flex flex-col items-center justify-center p-3 hover:bg-bg-subtle rounded-xl transition-all group flex-1"
                        >
                            <StickyNote size={20} className="text-text-secondary group-hover:text-amber-600 transition-colors" />
                            <span className="text-[10px] font-bold text-text-tertiary mt-1 uppercase tracking-tighter font-sans">Note</span>
                        </button>

                        <div className="w-[1px] h-8 bg-bg-subtle" />

                        <div className="flex gap-1.5 px-3">
                            {['#fef08a', '#bbf7d0', '#bfdbfe'].map(color => (
                                <button
                                    key={color}
                                    onClick={() => onHighlight?.(color)}
                                    className="w-5 h-5 rounded-full border border-border-default hover:scale-110 transition-transform"
                                    style={{ backgroundColor: color }}
                                    title="Highlight"
                                />
                            ))}
                        </div>
                    </div>
                ) : showDict ? (
                    <div className="p-5 animate-in slide-in-from-bottom-2 duration-300 font-sans">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-[10px] font-black text-text-tertiary uppercase tracking-[0.2em] font-sans">Dictionary</h3>
                            <button onClick={handleCloseModal} className="p-1.5 hover:bg-bg-subtle rounded-lg transition-colors">
                                <X size={16} className="text-text-tertiary" />
                            </button>
                        </div>

                        {loading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 size={28} className="animate-spin text-blue-500 opacity-60" />
                            </div>
                        ) : error ? (
                            <div className="py-6">
                                {error.includes('internet') ? (
                                    <div className="flex flex-col items-center gap-2 text-center">
                                        <WifiOff size={24} className="text-amber-500" />
                                        <p className="text-sm text-amber-700 font-medium font-sans">
                                            Connect to internet to look up new words
                                        </p>
                                    </div>
                                ) : (
                                    <p className="text-sm text-red-500 font-medium font-sans italic">"{selection}" not found.</p>
                                )}
                            </div>
                        ) : definition && (
                            <div className="max-h-64 overflow-y-auto custom-scrollbar pr-1">
                                <div className="flex items-center justify-between gap-3 mb-3">
                                    <h2 className="text-2xl font-black text-text-primary capitalize font-sans tracking-tight">{definition.word}</h2>
                                    {definition.phonetics?.find(p => p.audio) && (
                                        <button
                                            onClick={() => playAudio(definition.phonetics.find(p => p.audio).audio)}
                                            className="w-8 h-8 rounded-full bg-accent-subtle flex items-center justify-center text-blue-500 hover:bg-accent-subtle transition-all hover:scale-110"
                                        >
                                            <Volume2 size={18} />
                                        </button>
                                    )}
                                </div>
                                <p className="text-sm text-blue-600 font-bold mb-5 font-sans bg-accent-subtle/50 px-2 py-1 rounded-md inline-block">{definition.phonetic}</p>

                                {definition.meanings.slice(0, 3).map((m, i) => (
                                    <div key={i} className="mb-5 last:mb-2">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-[10px] font-black uppercase text-text-tertiary bg-bg-subtle px-1.5 py-0.5 rounded tracking-wider">{m.partOfSpeech}</span>
                                            <div className="h-px flex-1 bg-bg-subtle" />
                                        </div>
                                        <p className="text-[15px] text-text-secondary leading-relaxed font-medium font-sans">
                                            {m.definitions[0].definition}
                                        </p>
                                        {m.definitions[0].example && (
                                            <p className="text-[13px] text-text-tertiary mt-2 font-sans italic border-l-2 border-border-default pl-3">
                                                "{m.definitions[0].example}"
                                            </p>
                                        )}
                                    </div>
                                ))}
                                {onSaveWord && bookId && (
                                    <button
                                        onClick={handleSaveWord}
                                        disabled={wordSaved}
                                        className={`w-full mt-4 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-all shadow-sm ${wordSaved
                                            ? 'bg-green-50 text-green-600 border border-green-200'
                                            : 'bg-text-primary text-bg-elevated hover:bg-black active:scale-[0.98]'
                                            }`}
                                    >
                                        {wordSaved ? <Check size={18} /> : <BookmarkPlus size={18} />}
                                        {wordSaved ? 'Word Saved' : 'Save to Vocabulary'}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="p-5 animate-in slide-in-from-bottom-2 duration-300 font-sans">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-[10px] font-black text-text-tertiary uppercase tracking-[0.2em] font-sans">Add Note</h3>
                            <button onClick={handleCloseModal} className="p-1.5 hover:bg-bg-subtle rounded-lg transition-colors">
                                <X size={16} className="text-text-tertiary" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="bg-bg-subtle/50 p-3 rounded-xl border border-border-default/50 mb-3">
                                <p className="text-[11px] text-text-tertiary font-bold uppercase tracking-wider mb-1 opacity-50">Selected Text</p>
                                <p className="text-sm text-text-secondary line-clamp-2 italic">"{selection}"</p>
                            </div>

                            <textarea
                                value={noteText}
                                onChange={(e) => setNoteText(e.target.value)}
                                placeholder="Write your note here..."
                                className="w-full h-32 bg-bg-subtle border border-border-default rounded-xl p-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/20 resize-none font-sans"
                                autoFocus
                            />

                            <button
                                onClick={handleSaveNote}
                                disabled={noteSaved || !noteText.trim()}
                                className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-all shadow-sm ${noteSaved
                                    ? 'bg-green-50 text-green-600 border border-green-200'
                                    : 'bg-accent-primary text-white hover:bg-accent-primary/90 active:scale-[0.98] disabled:opacity-50'
                                    }`}
                            >
                                {noteSaved ? <Check size={18} /> : <Save size={18} />}
                                {noteSaved ? 'Note Saved' : 'Save Note'}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Arrow — hide on mobile as it might not align well with dynamic float, and hide when centered */}
            {!isMobile && !showDict && !showNote && (
                <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-white mx-auto" />
            )}

            <style dangerouslySetInnerHTML={{
                __html: `
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
