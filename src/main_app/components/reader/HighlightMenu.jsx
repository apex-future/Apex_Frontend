import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Sparkle, Book, Highlighter, X, Spinner, SpeakerHigh, Check, WifiSlash, Note, MagicWand, Trash, Quotes, Copy, ShareNetwork } from '@phosphor-icons/react';
import dictionaryService from '../../services/dictionaryService';
import useThemeStore from '../../store/themeStore';
import useXpStore from '../../store/useXpStore';
import useQuestStore from '../../store/useQuestStore';
import Card from '../ui/Card';
import ShareModal from '../ui/ShareModal';

function HighlightMenu({ selection, position, onAskAI, onSimplify, bookId, onSaveWord, onHighlight, onDictToggle, onAddNote, onUpdateNote, onDeleteNote, onClose, onGenerateFlashcards, cachedDefinition, cachedTab }) {
    const { resolvedTheme } = useThemeStore();
    const isDark = resolvedTheme === 'dark';

    const [definition, setDefinition] = useState(cachedDefinition ? {
        word: cachedDefinition.word,
        phonetic: cachedDefinition.phonetic,
        meanings: [{
            partOfSpeech: cachedDefinition.partOfSpeech,
            definitions: [{ definition: cachedDefinition.definition }]
        }]
    } : null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showDict, setShowDict] = useState(!!cachedDefinition);
    const [showTab, setShowTab] = useState(!!cachedTab);
    const [tabText, setTabText] = useState(cachedTab ? cachedTab.text : '');
    const [tabSaved, setTabSaved] = useState(!!cachedTab);
    const [wordSaved, setWordSaved] = useState(!!cachedDefinition);

    const [savedTabId, setSavedTabId] = useState(cachedTab ? (cachedTab.id || cachedTab.dexieId || cachedTab.supabaseId) : null);
    const savedTabIdRef = useRef(cachedTab ? (cachedTab.id || cachedTab.dexieId || cachedTab.supabaseId) : null);

    const [copied, setCopied] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [shareModalData, setShareModalData] = useState({ title: '', text: '', url: '' });
    const draftKey = bookId && (position?.startOffset || position?.startOffset === 0) ? `draft_tab_${bookId}_${position.startOffset}` : null;

    // Refs for auto-save cleanup — always hold the latest values
    const tabTextRef = useRef(tabText);
    const explicitActionRef = useRef(false);
    const onAddNoteRef = useRef(onAddNote);
    const onUpdateNoteRef = useRef(onUpdateNote);
    const selectionRef = useRef(selection);
    const positionRef = useRef(position);
    const draftKeyRef = useRef(draftKey);

    // Keep all refs in sync
    useEffect(() => { tabTextRef.current = tabText; }, [tabText]);
    useEffect(() => { onAddNoteRef.current = onAddNote; }, [onAddNote]);
    useEffect(() => { onUpdateNoteRef.current = onUpdateNote; }, [onUpdateNote]);
    useEffect(() => { selectionRef.current = selection; }, [selection]);
    useEffect(() => { positionRef.current = position; }, [position]);
    useEffect(() => { draftKeyRef.current = draftKey; }, [draftKey]);

    // Auto-save: when tab closes (showTab→false OR unmount) without explicit save/trash
    useEffect(() => {
        if (showTab) {
            // Tab just opened — reset the flag
            explicitActionRef.current = false;
            return;
        }
        // showTab is false, nothing to clean up
    }, [showTab]);

    useEffect(() => {
        if (!showTab) return; // Only set up cleanup when tab is actually open

        return () => {
            // Fires when showTab flips false OR component unmounts
            if (explicitActionRef.current) return; // User clicked ✓ or 🗑 — skip

            const text = tabTextRef.current?.trim();
            if (!text) return; // Nothing typed — skip

            // Perform the real save (creates marker + persists note)
            if (savedTabIdRef.current) {
                onUpdateNoteRef.current?.(savedTabIdRef.current, text);
            } else {
                onAddNoteRef.current?.({
                    text,
                    context: selectionRef.current,
                    type: 'highlight_note',
                    startOffset: positionRef.current?.startOffset,
                    pageNumber: positionRef.current?.pageNumber
                });
            }

            // Award XP
            try {
                useXpStore.getState().awardXpOptimistic('tab_added', {}, 5);
            } catch (e) { /* silently ignore */ }

            // Clean up localStorage draft
            if (draftKeyRef.current) localStorage.removeItem(draftKeyRef.current);
        };
    }, [showTab]);

    // Restore draft from localStorage (crash recovery)
    useEffect(() => {
        if (!cachedTab && draftKey) {
            const draft = localStorage.getItem(draftKey);
            if (draft && !tabText) {
                setTabText(draft);
            }
        }
    }, [draftKey, cachedTab]);

    const handleTextChange = (e) => {
        const val = e.target.value;
        setTabText(val);
        setTabSaved(false);
        if (draftKey) {
            localStorage.setItem(draftKey, val);
        }
    };

    // When tab is open (new or editing), keep the menu alive (same mechanism as dict)
    // so that clicking elsewhere doesn't immediately close it.
    useEffect(() => {
        if (showTab) {
            onDictToggle?.(true);
        }
    }, [showTab]);

    const toggleDict = (val) => {
        setShowDict(val);
        setShowTab(false);
        onDictToggle?.(val);
    };

    const toggleTab = (val) => {
        setShowTab(val);
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

            // Automatically save the word
            if (defData && onSaveWord && bookId) {
                const firstMeaning = defData.meanings?.[0];
                const wordObj = {
                    word: defData.word,
                    definition: firstMeaning?.definitions?.[0]?.definition || '',
                    partOfSpeech: firstMeaning?.partOfSpeech || '',
                    phonetic: defData.phonetic || '',
                    startOffset: position.startOffset,
                    pageNumber: position.pageNumber
                };
                onSaveWord(bookId, wordObj);
                setWordSaved(true);
            }
            
            // Wire quest action
            useQuestStore.getState().reportAction('dictionary_lookup', 1);
            console.log('[Quest Wire] dictionary_lookup reported');

        } catch (err) {
            setError(err.message);
            setDefinition(null);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveTab = () => {
        if (!tabText.trim()) return;

        // Mark as explicit so the auto-save cleanup won't double-fire
        explicitActionRef.current = true;

        // Fire-and-forget — optimistic update in BookContext fires synchronously,
        // so the marker appears immediately. Modal closes without waiting for DB.
        if (savedTabIdRef.current) {
            // Existing tab — just update text, no new marker
            if (onUpdateNote) onUpdateNote(savedTabIdRef.current, tabText.trim());
        } else {
            // New tab — create it now
            if (onAddNote) {
                onAddNote({
                    text: tabText.trim(),
                    context: selection,
                    type: 'highlight_note',
                    startOffset: position?.startOffset,
                    pageNumber: position?.pageNumber
                });
            }
        }

        try {
            const { awardXpOptimistic } = useXpStore.getState();
            awardXpOptimistic('tab_added', {}, 5);
        } catch (xpErr) {
            console.error('[XP Wire] tab_added XP failed silently:', xpErr);
        }

        useQuestStore.getState().reportAction('tab_added', 1);
        console.log('[Quest Wire] tab_added reported');

        if (draftKey) localStorage.removeItem(draftKey);

        onDictToggle?.(false);
        toggleTab(false);
        setTabSaved(false);
        setTabText('');
        setSavedTabId(null);
        savedTabIdRef.current = null;
        handleCloseModal();
    };

    const handleCancelTab = async () => {
        // Mark as explicit so the auto-save cleanup won't fire
        explicitActionRef.current = true;

        if (savedTabIdRef.current && onDeleteNote) {
            await onDeleteNote(savedTabIdRef.current);
        }
        if (draftKey) localStorage.removeItem(draftKey);
        
        onDictToggle?.(false);
        setTabText('');
        setSavedTabId(null);
        savedTabIdRef.current = null;
        handleCloseModal();
    };

    const handleCopy = () => {
        if (!tabText) return;
        navigator.clipboard.writeText(tabText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleShareHighlight = () => {
        setShareModalData({
            title: 'Shared Highlight from Apex',
            text: `"${selection}"`,
            url: `${window.location.origin}/share?type=highlight&text=${encodeURIComponent(selection)}`
        });
        setShowShareModal(true);
    };

    const handleShareTab = () => {
        setShareModalData({
            title: 'Shared Note from Apex',
            text: `"${selection}"\n\nMy Note: ${tabText}`,
            url: `${window.location.origin}/share?type=note&text=${encodeURIComponent(selection)}&note=${encodeURIComponent(tabText)}`
        });
        setShowShareModal(true);
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
    let showBelow = false;

    if (showDict || showTab) {
        menuStyle = {
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: isMobile ? '340px' : '400px',
            maxWidth: '90vw',
            maxHeight: '85vh' // avoid covering edges on small screens
        };
    } else {
        const spaceAbove = position.y;
        const spaceBelow = window.innerHeight - (position.bottom || position.y);
        
        // Smart repositioning: move highlight menu to the part with more space
        showBelow = spaceBelow > spaceAbove;

        const leftPos = isMobile
            ? Math.min(window.innerWidth - 320, Math.max(10, position.x - 150))
            : Math.min(window.innerWidth - 300, Math.max(10, position.x - 100));

        menuStyle = isMobile
            ? {
                left: `${leftPos}px`,
                width: '300px'
            }
            : {
                left: `${leftPos}px`,
            };

        if (showBelow) {
            menuStyle.top = `${(position.bottom || position.y) + 25}px`;
        } else {
            menuStyle.bottom = `${window.innerHeight - position.y + 25}px`;
        }
    }

    return (
        <>
        <div
            className={`highlight-menu-container fixed z-[300] animate-in fade-in duration-200 pointer-events-auto ${isMobile ? 'zoom-in-95' : 'zoom-in'}`}
            style={menuStyle}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Text action menu"
        >
            {/* Arrow when menu is placed below the text (pointing up) */}
            {!isMobile && !showDict && !showTab && showBelow && (
                <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[8px] border-b-white mx-auto" />
            )}

            <Card
                variant="default"
                className={`flex flex-col min-w-[200px] w-full max-w-[400px] hover:!scale-100 ${
                    showTab
                        ? 'shadow-sm overflow-visible relative'
                        : 'overflow-hidden'
                }`}
                style={showTab ? {
                    borderRadius: '5px',
                    transform: 'rotate(-2deg)',
                } : undefined}
            >
                {showTab && (
                    <div style={{
                        position: 'absolute',
                        top: '-10px',
                        left: '12px',
                        width: '55px',
                        height: '16px',
                        background: 'rgba(120, 120, 120, 0.25)',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                        backdropFilter: 'blur(1px)',
                        transform: 'rotate(-15deg)',
                        zIndex: 50,
                        pointerEvents: 'none',
                        borderLeft: '1.5px dashed rgba(0,0,0,0.15)',
                        borderRight: '1.5px dashed rgba(0,0,0,0.15)',
                    }} />
                )}
                {!showDict && !showTab ? (
                    <div className="flex flex-col">
                        <div className="flex items-center p-1.5 gap-1">
                            <button
                                onClick={() => fetchDefinition(selection)}
                                className="flex flex-col items-center justify-center p-3 hover:bg-bg-subtle rounded-xl transition-all group flex-1"
                            >
                                <Book size={20} weight="fill" className="text-text-secondary group-hover:text-blue-600 transition-colors" />
                                <span className="text-[10px] font-bold text-text-tertiary mt-1 uppercase tracking-tighter font-sans">Define</span>
                            </button>

                            <div className="w-[1px] h-8 bg-border-default/50 dark:bg-white/10" />

                            <button
                                onClick={onAskAI}
                                className="flex flex-col items-center justify-center p-3 hover:bg-bg-subtle rounded-xl transition-all group flex-1"
                            >
                                <Sparkle size={20} weight="fill" className="text-text-secondary group-hover:text-purple-600 transition-colors" />
                                <span className="text-[10px] font-bold text-text-tertiary mt-1 uppercase tracking-tighter font-sans">Ask</span>
                            </button>

                            <div className="w-[1px] h-8 bg-border-default/50 dark:bg-white/10" />

                            <button
                                onClick={() => toggleTab(true)}
                                className="flex flex-col items-center justify-center p-3 hover:bg-bg-subtle rounded-xl transition-all group flex-1"
                            >
                                <Note size={20} weight="fill" className="text-text-secondary group-hover:text-amber-600 transition-colors" />
                                <span className="text-[10px] font-bold text-text-tertiary mt-1 uppercase tracking-tighter font-sans">Tab</span>
                            </button>

                            <div className="w-[1px] h-8 bg-border-default/50 dark:bg-white/10" />

                            <button
                                onClick={() => onSimplify?.()}
                                className="flex flex-col items-center justify-center p-3 hover:bg-bg-subtle rounded-xl transition-all group flex-1"
                            >
                                <MagicWand size={20} weight="fill" className="text-text-secondary group-hover:text-emerald-600 transition-colors" />
                                <span className="text-[10px] font-bold text-text-tertiary mt-1 uppercase tracking-tighter font-sans">Simplify</span>
                            </button>

                            <div className="w-[1px] h-8 bg-border-default/50 dark:bg-white/10" />

                            <button
                                onClick={handleShareHighlight}
                                className="flex flex-col items-center justify-center p-3 hover:bg-bg-subtle rounded-xl transition-all group flex-1"
                            >
                                <ShareNetwork size={20} weight="fill" className="text-text-secondary group-hover:text-blue-500 transition-colors" />
                                <span className="text-[10px] font-bold text-text-tertiary mt-1 uppercase tracking-tighter font-sans">Share</span>
                            </button>
                        </div>

                        <div className="flex items-center justify-center gap-4 p-3 bg-bg-subtle/50 border-t border-gray-200 dark:border-neutral-800/80">
                            {['#d1d5db', '#fef08a', '#bbf7d0', '#bfdbfe', '#e9d5ff'].map(color => (
                                <button
                                    key={color}
                                    onClick={() => onHighlight?.(color)}
                                    className="w-6 h-6 rounded-full border-2 border-white shadow-sm hover:scale-125 hover:shadow-md transition-all duration-200 active:scale-95"
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
                                <X size={16} weight="bold" className="text-text-tertiary" />
                            </button>
                        </div>

                        {loading ? (
                            <div className="flex items-center justify-center py-8">
                                <Spinner size={28} weight="bold" className="animate-spin text-blue-500 opacity-60" />
                            </div>
                        ) : error ? (
                            <div className="py-6">
                                {error.includes('internet') ? (
                                    <div className="flex flex-col items-center gap-2 text-center">
                                        <WifiSlash size={24} weight="bold" className="text-amber-500" />
                                        <p className="text-sm text-amber-700 font-medium font-sans">
                                            {error}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-4 text-center mt-2">
                                        <p className="text-sm text-red-500 font-medium font-sans italic">"{selection}" not found in standard dictionary.</p>
                                        <button
                                            onClick={() => {
                                                setShowDict(false);
                                                if (onAskAI) onAskAI();
                                            }}
                                            className="flex items-center gap-2 px-4 py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl transition-all border border-purple-200 shadow-sm font-bold text-sm"
                                        >
                                            <Sparkle size={16} weight="fill" className="text-purple-600" />
                                            Ask Cleo to define it
                                        </button>
                                    </div>
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
                                            <SpeakerHigh size={18} weight="fill" />
                                        </button>
                                    )}
                                </div>
                                <p className="text-sm text-blue-600 font-bold mb-5 font-sans bg-accent-subtle/50 px-2 py-1 rounded-md inline-block">{definition.phonetic}</p>

                                {(definition.meanings || []).slice(0, 3).map((m, i) => (
                                    <div key={i} className="mb-5 last:mb-2">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-[10px] font-black uppercase text-text-tertiary bg-bg-subtle px-1.5 py-0.5 rounded tracking-wider">{m.partOfSpeech}</span>
                                            <div className="h-px flex-1 bg-bg-subtle" />
                                        </div>
                                        <ul className="space-y-3">
                                            {(m.definitions || []).slice(0, 3).map((def, defIdx) => (
                                                <li key={defIdx} className="flex gap-3">
                                                    <span className="text-accent-primary font-bold opacity-40 text-sm mt-0.5">{defIdx + 1}.</span>
                                                    <div>
                                                        <p className="text-[15px] text-text-secondary leading-relaxed font-medium font-sans">
                                                            {def.definition}
                                                        </p>
                                                        {def.example && (
                                                            <p className="text-[13px] text-text-tertiary mt-1 font-sans italic border-l-2 border-border-default pl-3">
                                                                "{def.example}"
                                                            </p>
                                                        )}
                                                        {def.synonyms?.length > 0 && (
                                                            <div className="flex flex-wrap gap-1 mt-1.5">
                                                                {def.synonyms.slice(0, 4).map((syn, synIdx) => (
                                                                    <span key={synIdx} className="text-[11px] font-semibold text-accent-primary bg-accent-primary/10 px-1.5 py-0.5 rounded">
                                                                        {syn}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : showTab ? (
                    <div
                        className="animate-in slide-in-from-bottom-2 duration-300 font-sans flex flex-col relative w-full"
                        style={{
                            minHeight: '220px',
                            transform: 'rotate(2deg)',
                        }}
                    >
                        {/* Context Header */}
                        <div
                            className="px-4 pt-3 pb-2.5 flex items-start gap-2 select-none bg-bg-subtle"
                            style={{
                                borderRadius: '5px 5px 0 0',
                            }}
                        >
                            <Quotes size={15} weight="fill" className="text-accent-primary flex-shrink-0 mt-0.5" />
                            <p className="text-[12px] italic leading-relaxed line-clamp-2 text-text-secondary">
                                {selection}
                            </p>
                        </div>

                        {/* Text Area */}
                        <textarea
                            value={tabText}
                            onChange={handleTextChange}
                            placeholder="Write your tab here..."
                            className="flex-1 w-full p-4 text-[14px] leading-relaxed resize-none focus:outline-none text-text-primary bg-transparent"
                            autoFocus
                        />

                        {/* Footer */}
                        <div className="flex items-center justify-between px-4 py-2 border-t border-border-default">
                            <span className="text-[10px] text-text-tertiary">
                                {tabText.trim().split(/\s+/).filter(Boolean).length} words
                            </span>

                            <div className="flex items-center gap-1">
                                <button
                                    onClick={handleSaveTab}
                                    disabled={tabSaved || !tabText.trim()}
                                    className={`p-1.5 rounded-lg transition-all hover:bg-black/10 ${tabSaved || !tabText.trim() ? 'text-text-placeholder' : 'text-accent-primary'}`}
                                    title="Save & Close"
                                >
                                    <Check size={16} weight="bold" />
                                </button>

                                {/* Copy Button */}
                                <button
                                    onClick={handleCopy}
                                    disabled={!tabText.trim()}
                                    className={`p-1.5 rounded-lg transition-all hover:bg-blue-500/10 ${!tabText.trim() ? 'text-text-placeholder' : 'text-blue-500'}`}
                                    title="Copy to Clipboard"
                                >
                                    {copied ? <Check size={16} weight="bold" /> : <Copy size={16} weight="bold" />}
                                </button>

                                {/* Share Button */}
                                <button
                                    onClick={handleShareTab}
                                    disabled={!tabText.trim()}
                                    className={`p-1.5 rounded-lg transition-all hover:bg-blue-500/10 ${!tabText.trim() ? 'text-text-placeholder' : 'text-blue-500'}`}
                                    title="Share"
                                >
                                    <ShareNetwork size={16} weight="bold" />
                                </button>

                                {/* Bin - Close without saving */}
                                <button
                                    onClick={handleCancelTab}
                                    className="p-1.5 rounded-lg transition-all hover:bg-red-500/10 text-text-tertiary hover:text-red-500"
                                    title="Delete / Cancel"
                                >
                                    <Trash size={16} weight="bold" />
                                </button>
                            </div>
                        </div>
                    </div>
                ) : null}
            </Card>

            {/* Arrow when menu is placed above the text (pointing down) */}
            {!isMobile && !showDict && !showTab && !showBelow && (
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

        {/* Share Modal */}
        <ShareModal
            isOpen={showShareModal}
            onClose={() => setShowShareModal(false)}
            shareTitle={shareModalData.title}
            shareText={shareModalData.text}
            shareUrl={shareModalData.url}
        />
        </>
    );
}

export default HighlightMenu;
