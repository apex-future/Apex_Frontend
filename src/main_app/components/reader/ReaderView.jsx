import React, { useEffect, useState, useRef, useMemo, useContext, useCallback } from 'react';
import useStudyStore from '../../store/studyStore';
import useAuthStore from '../../store/authStore';
import useQuestStore from '../../store/useQuestStore';
import StreakCelebration from './StreakCelebration';
import { AnimatePresence } from 'framer-motion';
import useSpaceStore from '../../store/spaceStore';
import useSettingsStore from '../../store/settingsStore';
import { useParams, useNavigate } from 'react-router-dom';
import { BookContext } from '../../context/BookContextInstance';
import db from '../../db/apex.db';
import DOMPurify from 'dompurify';
import PDFReader from './PDFReader';
import ReaderNavBar from './ReaderNavBar';
import SessionSummaryModal from './SessionSummaryModal';
import QuestSummaryModal from '../quests/QuestSummaryModal';
import useXpStore from '../../store/useXpStore';
import AIModal from './reading_navigations/reading_layout/AIModal';
import QuizPanel from './reading_navigations/reading_layout/QuizPanel';
import QuizView from './QuizView';
import useFlashcardStore from '../../store/useFlashcardStore';
import apiClient from '../../services/apiClient';
import syncService from '../../services/syncService';
import useToast from '../../hooks/useToast';
import usePageVisitTracker from '../../hooks/usePageVisitTracker';
import { useReadingTimeTracker } from '../../hooks/useReadingTimeTracker';
import HighlightMenu from './HighlightMenu';
import SimplifyModal from './SimplifyModal';
import LeftPanel from './reading_navigations/reading_layout/LeftPanel';
import PageSettings from './reading_navigations/reading_layout/PageSettings';
import BookSkeleton from './BookSkeleton';
import PageStrip from './PageStrip';
import ReaderDictionary from './reading_navigations/reading_layout/ReaderDictionary';
import { CaretLeft, CaretRight, Plus, List, ArrowLeft, ArrowRight, WarningCircle, ArrowUp, ArrowDown } from '@phosphor-icons/react';
import ReaderNotebookPanel from './reading_navigations/reading_layout/ReaderNotebookPanel';
import ReaderNoteEditor from './reading_navigations/reading_layout/ReaderNoteEditor';

const ScrollOrientationOverlay = ({ visible, orientation }) => {
    if (!visible) return null;
    const isVertical = orientation === 'vertical';
    return (
        <div className="fixed inset-x-0 bottom-32 z-[100] flex items-center justify-center pointer-events-none lg:hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center gap-6 px-6 py-3 rounded-full bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 shadow-md text-text-primary">
                {isVertical ? <ArrowUp size={18} weight="bold" className="opacity-70" /> : <ArrowLeft size={18} weight="bold" className="opacity-70" />}
                <span className="text-[10px] font-black uppercase tracking-[0.2em] whitespace-nowrap">
                    Swipe {isVertical ? 'up or down' : 'left or right'}
                </span>
                {isVertical ? <ArrowDown size={18} weight="bold" className="opacity-70" /> : <ArrowRight size={18} weight="bold" className="opacity-70" />}
            </div>
        </div>
    );
};

const getSessionXpBreakdown = (actions, readingXp) => {
    const counts = {};
    actions.forEach(a => {
        counts[a.action] = (counts[a.action] || 0) + a.estimatedXp;
    });

    const breakdown = [];
    if (readingXp > 0) {
        breakdown.push({ label: 'Reading Time', xp: readingXp });
    }

    const actionLabels = {
        highlight_created: 'Highlights Created',
        note_added: 'Notes Added',
        dictionary_lookup: 'Dictionary Lookups',
        tab_added: 'Sticky Tabs Saved',
        simplify: 'Text Simplifications',
        ai_explanation: 'AI Clarification',
        quiz: 'Quizzes Completed'
    };

    Object.keys(counts).forEach(action => {
        if (counts[action] > 0) {
            const label = actionLabels[action] || action.replace(/_/g, ' ');
            breakdown.push({ label, xp: counts[action] });
        }
    });

    return breakdown;
};

function ReaderView() {
    const { books = [], updateBookProgress, toggleBookmark, addSavedWord, addHighlight, removeHighlight, downloadMissingFile, addTab, updateTab, deleteTab, toggleFavorite, toggleBookmarkedBook, addSimplification, removeSimplification } = useContext(BookContext) || {};
    const { bookId } = useParams();
    const navigate = useNavigate();

    const [fileUrl, setFileUrl] = useState(null);
    const [textContent, setTextContent] = useState("");
    const [htmlContent, setHtmlContent] = useState("");

    // Find the book and determine type
    const book = useMemo(() => books.find(b => b.id.toString() === bookId), [books, bookId]);
    const isPdf = useMemo(() => book?.file?.type === 'application/pdf' || book?.file?.name.toLowerCase().endsWith('.pdf'), [book]);
    const isDocx = useMemo(() => book?.file?.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || book?.file?.name.toLowerCase().endsWith('.docx'), [book]);
    const isDoc = useMemo(() => book?.file?.type === 'application/msword' || book?.file?.name.toLowerCase().endsWith('.doc'), [book]);

    // --- Lifted PDF Controls State ---
    const [pageNumber, setPageNumber] = useState(book?.currentPage || 1);
    const [numPages, setNumPages] = useState(null);
    const [scale, setScale] = useState(1.0);
    const [rotation, setRotation] = useState(0);
    const [tocOutline, setTocOutline] = useState(null);

    // Session Summary State
    const [showSessionSummary, setShowSessionSummary] = useState(false);
    const showSessionSummaryRef = useRef(false);
    useEffect(() => { showSessionSummaryRef.current = showSessionSummary; }, [showSessionSummary]);
    const [sessionStats, setSessionStats] = useState({ xpGained: 0, pagesRead: 0, timeSpentSeconds: 0, totalXp: 0, breakdown: [] });
    const [showQuestSummary, setShowQuestSummary] = useState(false);
    const quizFromSessionRef = useRef(false);
    const sessionActiveSeconds = useRef(0);
    const sessionStartTime = useRef(Date.now()); // null when tab is hidden
    const visitedPages = useRef(new Set());

    // ── Visibility-aware session wall-clock tracker ──────────────────────────
    // Mirrors how useReadingTimeTracker pauses on tab hide.
    // When the tab is hidden: flush the current chunk into sessionActiveSeconds
    // and null sessionStartTime so no wall-clock time leaks while backgrounded.
    // When the tab becomes visible: restart sessionStartTime.
    useEffect(() => {
        const handleSessionVisibility = () => {
            if (document.hidden) {
                // Pause — accumulate elapsed seconds so far
                if (sessionStartTime.current !== null) {
                    sessionActiveSeconds.current += Math.floor((Date.now() - sessionStartTime.current) / 1000);
                    sessionStartTime.current = null;
                }
                console.log('[Apex Session] Tab hidden — session timer paused, accumulated:', sessionActiveSeconds.current, 's');
            } else {
                // Resume — restart the chunk clock
                sessionStartTime.current = Date.now();
                console.log('[Apex Session] Tab visible — session timer resumed');
            }
        };

        document.addEventListener('visibilitychange', handleSessionVisibility);
        return () => document.removeEventListener('visibilitychange', handleSessionVisibility);
    }, []);
    // ────────────────────────────────────────────────────────────────────────

    // removed immediate page visit tracking

    useEffect(() => {
        // Start tracking XP actions for this session
        useXpStore.getState().startSessionTracker();
    }, [bookId]);

    const handleExitReader = async (fromPopState = false) => {
        // 1. Stop the XP timer immediately — no more minutes accumulate
        stopTick();

        // 2. Flush the active chunk into sessionActiveSeconds (if tab is currently visible)
        if (sessionStartTime.current !== null) {
            sessionActiveSeconds.current += Math.floor((Date.now() - sessionStartTime.current) / 1000);
            sessionStartTime.current = null; // closed
        }

        // 3. Compute XP from actual session minutes (does NOT flush or award yet)
        const readingXp = await computeSessionXp();
        const pagesRead = visitedPages.current.size;
        const timeSpentSeconds = sessionActiveSeconds.current;
        const timeSpentMinutes = Math.floor(timeSpentSeconds / 60);

        // Fetch session XP actions
        const sessionXpActions = useXpStore.getState().sessionXpActions || [];
        const activityXp = sessionXpActions.reduce((sum, act) => sum + act.estimatedXp, 0);
        const totalXp = readingXp + activityXp;

        console.log('[Apex Session] Exit — active reading time:', timeSpentSeconds, 's');

        if (totalXp > 0 || pagesRead > 1 || timeSpentMinutes >= 1) {
            if (fromPopState === true) {
                window.history.pushState(null, '', window.location.href);
            }
            setSessionStats({ 
                xpGained: Math.max(0, readingXp), 
                pagesRead, 
                timeSpentSeconds,
                totalXp: Math.max(0, totalXp),
                breakdown: getSessionXpBreakdown(sessionXpActions, readingXp)
            });
            setShowSessionSummary(true);
        } else {
            if (fromPopState === true) {
                navigate(-1);
            } else {
                navigate('/');
            }
        }
    };

    const handleExitReaderRef = useRef(handleExitReader);
    useEffect(() => { handleExitReaderRef.current = handleExitReader; }, [handleExitReader]);

    useEffect(() => {
        // Push dummy state to intercept hardware back button
        window.history.pushState(null, '', window.location.href);
        const handlePopState = () => {
            if (handleExitReaderRef.current) {
                handleExitReaderRef.current(true);
            }
        };
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, []);

    // Progress state
    const [localProgress, setLocalProgress] = useState(book?.progress || 0);
    const [localPages, setLocalPages] = useState({
        current: book?.currentPage || 1,
        total: book?.totalPages || 1
    });

    // Navigation Visibility State
    const [navState, setNavState] = useState('none');
    const [locked, setLocked] = useState(false);
    const [aiModal, setAiModal] = useState(false);
    const [quizModal, setQuizModal] = useState(false);
    const [activeQuizSession, setActiveQuizSession] = useState(null);
    const { showToast } = useToast();
    const { user: authUser } = useAuthStore();
    const [leftPanel, setLeftPanel] = useState(false);
    const [pageSettings, setPageSettings] = useState(false);
    const { scrollOrientation: savedOrientation, updateSetting, streakThresholdMinutes } = useSettingsStore();
    const [scrollOrientation, setScrollOrientation] = useState(savedOrientation || 'vertical'); // 'vertical' or 'horizontal'

    // Deep loading state
    const [isLoading, setIsLoading] = useState(true);
    const [loadingMessage, setLoadingMessage] = useState("Setting up file");
    const [downloadError, setDownloadError] = useState(false);

    const selectionRef = useRef({ text: '', x: 0, y: 0 });
    const [selectionData, setSelectionData] = useState({ text: '', x: 0, y: 0, startOffset: null });
    const [showHighlightMenu, setShowHighlightMenu] = useState(false);
    const [isDictOpen, setIsDictOpen] = useState(false);
    const [isReaderDictOpen, setIsReaderDictOpen] = useState(false);
    const [showPageStrip, setShowPageStrip] = useState(false);
    const [showStreakCelebration, setShowStreakCelebration] = useState(false);

    // Simplify feature state
    const [showSimplifyModal, setShowSimplifyModal] = useState(false);
    const [activeSimplification, setActiveSimplification] = useState({ originalText: '', simplifiedText: '', loading: false, error: null });

    // Notebook and Note Editor state
    const [notebookPanel, setNotebookPanel] = useState(false);
    const [noteEditor, setNoteEditor] = useState(null); // stores noteId or 'new'
    
    // Flashcard feature state
    const [activeFlashcardSession, setActiveFlashcardSession] = useState(null); // { selection, count }

    const openPageStrip = useCallback(() => {
        setNavState('none');
        setShowPageStrip(true);
    }, []);

    const closePageStrip = useCallback(() => {
        setShowPageStrip(false);
        setNavState('first');
    }, []);

    const toggleNav = useCallback(() => {
        // If text is selected, don't toggle nav — let the highlight menu handle it
        if (window.getSelection().toString().trim()) return;
        
        setNavState(prev => (prev === 'first' || prev === 'second') ? 'none' : 'first');
        // Close overlay modals
        setAiModal(false);
        setQuizModal(false);
    }, []);

    // ============================================
    // PAGE VISIT TRACKER — 4s foreground visit recording
    // ============================================
    usePageVisitTracker({
        bookId: book?.id,
        supabaseBookId: book?.supabaseId,
        currentPage: pageNumber,
        totalPages: numPages || book?.totalPages,
        isEnabled: !!book?.supabaseId,
        onVisitRecorded: (page) => visitedPages.current.add(page)
    });

    // ============================================
    // READING TIME TRACKER — minute-tick accumulation
    // ============================================
    const { flushSessionToQueue, stopTick, startTick, computeSessionXp } = useReadingTimeTracker({
        bookId: book?.id,
        supabaseBookId: book?.supabaseId,
        isEnabled: !!book?.supabaseId,
    });

    // ============================================
    // 1-MINUTE READING TIMER — Streak & Space Tracking
    // ============================================
    const { activeSpaceId, logSpaceActivity } = useSpaceStore();
    const { updateStreak } = useStudyStore();
    const streakCount = useStudyStore(s => s.streakCount);
    const streakHistory = useStudyStore(s => s.streakHistory);

    // Authoritative snapshot for the celebration modal — set AFTER updateStreak() mutates the store
    const [celebrationData, setCelebrationData] = useState(null);
    const updateStreakRef = useRef(updateStreak);
    const logSpaceActivityRef = useRef(logSpaceActivity);
    useEffect(() => { updateStreakRef.current = updateStreak; }, [updateStreak]);
    useEffect(() => { logSpaceActivityRef.current = logSpaceActivity; }, [logSpaceActivity]);
    const streakTimerRef = useRef(null);
    const streakFiredTodayRef = useRef(false);

    // Track elapsed time so visibility changes don't reset the full 60s
    const streakElapsedRef = useRef(0);
    const streakStartTimeRef = useRef(null);

    useEffect(() => {
        if (isLoading || !bookId) return;

        const today = new Date().toLocaleDateString('en-CA');
        let isCancelled = false;

        // Streak timer reads threshold from user settings — default 5 minutes
        const STREAK_DURATION = Math.max(5, streakThresholdMinutes) * 60 * 1000;
        const MINUTE_DURATION = 60 * 1000;
        console.log(`[Apex Streak] Threshold set to ${streakThresholdMinutes} minutes (${STREAK_DURATION / 1000}s)`);

        // Load today's accumulated progress from Dexie IndexedDB
        db.user_daily_streak_progress
            .where('date').equals(today)
            .first()
            .then((todayProgress) => {
                if (isCancelled) return;

                const initialSeconds = todayProgress?.seconds_read || 0;
                const wasFired = !!todayProgress?.streak_fired;

                streakElapsedRef.current = initialSeconds * 1000;
                if (wasFired || localStorage.getItem('apex_streak_fired_today') === today) {
                    streakFiredTodayRef.current = true;
                }

                console.log(`[Apex Streak] Loaded accumulated today progress: ${initialSeconds}s (fired=${streakFiredTodayRef.current})`);

                streakStartTimeRef.current = Date.now();
                runInterval();
            })
            .catch((err) => {
                console.error('[Apex Streak] Failed to load daily progress:', err);
                if (!isCancelled) runInterval();
            });

        const runInterval = () => {
            if (streakTimerRef.current) clearInterval(streakTimerRef.current);
            streakTimerRef.current = setInterval(() => {
                if (showSessionSummaryRef.current) return; // skip if modal is open

                streakElapsedRef.current += 1000;
                const currentSeconds = Math.floor(streakElapsedRef.current / 1000);

                // Log space activity every 60 seconds
                if (streakElapsedRef.current % MINUTE_DURATION === 0) {
                    console.log('[Apex Reader] 60 seconds passed - logging activity');
                    if (activeSpaceId) {
                        logSpaceActivityRef.current(activeSpaceId, 'timeSpent', 1);
                    }
                }

                // Persist daily progress to Dexie & queue sync every 10 seconds
                if (streakElapsedRef.current % 10000 === 0) {
                    syncService.saveDailyStreakProgress(today, currentSeconds, streakFiredTodayRef.current);
                }

                // Streak triggers when accumulated time hits the threshold
                if (streakElapsedRef.current >= STREAK_DURATION && !streakFiredTodayRef.current) {
                    const lastFired = localStorage.getItem('apex_streak_fired_today');
                    
                    if (lastFired !== today) {
                        updateStreakRef.current();
                        streakFiredTodayRef.current = true;
                        localStorage.setItem('apex_streak_fired_today', today);

                        // Read AFTER the synchronous store mutation — authoritative snapshot
                        const store = useStudyStore.getState();
                        const { streakCelebrationEnabled = true } = useSettingsStore.getState();
                        setCelebrationData({ streakCount: store.streakCount, streakHistory: store.streakHistory });
                        if (streakCelebrationEnabled) {
                            setShowStreakCelebration(true);
                        }

                        // Persist streak fired status
                        syncService.saveDailyStreakProgress(today, currentSeconds, true);
                    }
                }
            }, 1000); // 1-second ticks for accurate pausing
        };

        const handleVisibilityChange = () => {
            const currentSeconds = Math.floor(streakElapsedRef.current / 1000);
            if (document.hidden) {
                console.log('[Apex Reader] Tab hidden — pausing timer & saving progress');
                clearInterval(streakTimerRef.current);
                syncService.saveDailyStreakProgress(today, currentSeconds, streakFiredTodayRef.current);
            } else {
                console.log('[Apex Reader] Tab visible — resuming timer');
                runInterval();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            isCancelled = true;
            clearInterval(streakTimerRef.current);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            const finalSeconds = Math.floor(streakElapsedRef.current / 1000);
            syncService.saveDailyStreakProgress(today, finalSeconds, streakFiredTodayRef.current);
            console.log(`[Apex Reader] Timer cleaned up — final saved progress: ${finalSeconds}s`);
        };
    }, [isLoading, bookId, streakThresholdMinutes]);

    const handleHighlight = (color) => {
        if (!book || !selectionRef.current.text) return;

        addHighlight(book.id, {
            text: selectionRef.current.text.replace(/\s+/g, ' ').trim(),
            color,
            page: pageNumber,
            startOffset: selectionRef.current.startOffset,
            addedAt: new Date().toISOString()
        });
        setShowHighlightMenu(false);
        // Clear browser selection
        window.getSelection().removeAllRanges();
    };

    const simplifications = book?.metadata?.simplifications || [];

    const handleSimplify = async () => {
        const text = selectionRef.current.text?.replace(/\s+/g, ' ').trim();
        if (!text || !book) return;

        setShowHighlightMenu(false);
        setIsDictOpen(false);
        window.getSelection()?.removeAllRanges();

        // Check cache — if already simplified, show cached result
        const cached = simplifications.find(s => s.originalText?.toLowerCase() === text.toLowerCase());
        if (cached) {
            setActiveSimplification({ originalText: cached.originalText, simplifiedText: cached.simplifiedText, loading: false, error: null });
            setShowSimplifyModal(true);
            return;
        }

        // Show modal with loading state
        setActiveSimplification({ originalText: text, simplifiedText: '', loading: true, error: null });
        setShowSimplifyModal(true);

        try {
            const response = await apiClient.post('/api/ai/simplify', {
                text,
                book_title: book?.title || book?.file?.name || '',
            });
            const simplified = response.data?.simplified || '';

            setActiveSimplification({ originalText: text, simplifiedText: simplified, loading: false, error: null });

            // Persist the simplification + auto-highlight with soft indigo color
            addSimplification(book.id, {
                originalText: text,
                simplifiedText: simplified,
                page: pageNumber,
                startOffset: selectionRef.current.startOffset,
                color: '#a78bfa',  // subtle purple (matches underline)
                addedAt: new Date().toISOString(),
            });

            // Also add a highlight with underline style to mark simplified text
            addHighlight(book.id, {
                text,
                color: '#a78bfa',  // subtle purple for underline
                page: pageNumber,
                startOffset: selectionRef.current.startOffset,
                addedAt: new Date().toISOString(),
                isSimplified: true,
            });

            // Award XP for simplification
            try {
                useXpStore.getState().awardXpOptimistic('simplify', {}, 5);
                console.log('[XP Wire] simplify optimistic award fired');
            } catch (xpErr) {
                console.error('[XP Wire] simplify XP failed silently:', xpErr);
            }

            useQuestStore.getState().reportAction('simplify', 1);
            console.log('[Quest Wire] simplify reported');
        } catch (err) {
            console.error('[Apex Simplify] Failed:', err);
            setActiveSimplification(prev => ({ ...prev, loading: false, error: err.message || 'Failed to simplify' }));
        }
    };

    const handleRetrySimplify = () => {
        if (!activeSimplification.originalText) return;
        // Re-trigger with the same text
        selectionRef.current.text = activeSimplification.originalText;
        setShowSimplifyModal(false);
        handleSimplify();
    };

    const handleSparkleClick = (simplification) => {
        setActiveSimplification({
            originalText: simplification.originalText,
            simplifiedText: simplification.simplifiedText,
            loading: false,
            error: null,
        });
        setShowSimplifyModal(true);
    };

    // --- PDF Control Handlers ---
    const nextPage = useCallback(() => {
        setPageNumber(prev => {
            const next = Math.min(prev + 1, numPages || prev);
            syncProgress(next, numPages);
            return next;
        });
    }, [numPages]);

    const previousPage = useCallback(() => {
        setPageNumber(prev => {
            const next = Math.max(prev - 1, 1);
            syncProgress(next, numPages);
            return next;
        });
    }, [numPages]);

    const zoomIn = useCallback(() => {
        setScale(prev => Math.min(prev + 0.1, 2.5));
    }, []);

    const zoomOut = useCallback(() => {
        setScale(prev => Math.max(prev - 0.1, 0.5));
    }, []);

    const rotate = useCallback(() => {
        setRotation(prev => (prev + 90) % 360);
    }, []);

    const resetZoom = useCallback(() => {
        setScale(1.0);
    }, []);

    const pdfDocumentRef = useRef(null);

    async function handleDocumentLoad(pdf) {
        pdfDocumentRef.current = pdf;
        const total = pdf.numPages;
        setNumPages(total);

        if (book?.id && total > 1) {
            db.books.update(book.id, { totalPages: total })
                .catch(err => console.error('[Apex TOC] Failed to persist totalPages:', err));

            const supabaseId = book.supabaseId || book.recordId;
            if (supabaseId && navigator.onLine) {
                apiClient.put(`/api/books/${supabaseId}`, { total_pages: total })
                    .catch(err => {
                        if (import.meta.env.DEV) console.warn('[Apex TOC] Failed to update totalPages in Supabase:', err);
                    });
            }
        }

        Promise.resolve().then(() => syncProgress(pageNumber, total));

        // --- Outline extraction ---
        // Check Dexie cache first
        const cached = await db.books.get(book?.id);
        if (cached?.outline) {
            console.log('[Apex TOC] Loaded outline from Dexie cache:', cached.outline.length, 'items');
            setTocOutline(cached.outline);
            return;
        }

        // Extract from pdfjs
        try {
            const rawOutline = await pdf.getOutline();
            if (!rawOutline || rawOutline.length === 0) {
                console.log('[Apex TOC] No outline found in this PDF');
                setTocOutline([]);
                return;
            }

            // Resolve dest → page number recursively
            const resolveItem = async (item, level = 0) => {
                let pageNumber = null;
                try {
                    if (item.dest) {
                        const dest = typeof item.dest === 'string'
                            ? await pdf.getDestination(item.dest)
                            : item.dest;
                        if (dest) {
                            const pageIndex = await pdf.getPageIndex(dest[0]);
                            pageNumber = pageIndex + 1; // pdfjs is 0-based
                        }
                    }
                } catch (e) {
                    console.warn('[Apex TOC] Failed to resolve dest for:', item.title, e);
                }

                const resolved = { title: item.title, pageNumber, level };

                if (item.items && item.items.length > 0) {
                    resolved.children = await Promise.all(
                        item.items.map(child => resolveItem(child, level + 1))
                    );
                }

                return resolved;
            };

            const resolved = await Promise.all(rawOutline.map(item => resolveItem(item, 0)));
            console.log('[Apex TOC] Outline extracted:', resolved.length, 'top-level items');
            setTocOutline(resolved);

            // Cache to Dexie — fire and forget
            if (book?.id) {
                db.books.update(book.id, { outline: resolved })
                    .then(() => console.log('[Apex TOC] Outline cached to Dexie'))
                    .catch(err => console.error('[Apex TOC] Failed to cache outline:', err));
            }
        } catch (err) {
            console.error('[Apex TOC] Outline extraction failed:', err);
            setTocOutline([]);
        }
    }

    function syncProgress(page, total) {
        const effectiveTotal = total || numPages || book?.totalPages || localPages.total;
        if (!book || !effectiveTotal) return;
        
        const progress = Math.min(Math.round((page / effectiveTotal) * 100), 100);
        setLocalProgress(progress);
        setLocalPages({ current: page, total: effectiveTotal });
        updateBookProgress(book.id, progress, page, effectiveTotal, 0);
    }

    function goToPage(n) {
        const total = numPages || book?.totalPages || localPages.total;
        const page = Math.min(Math.max(1, n), total || n);
        setPageNumber(page);
        syncProgress(page, total);
    }

    // Bookmarks — loaded from book context instead of manually from Dexie to prevent async UI lag
    const bookmarks = book?.metadata?.bookmarks || [];
    const highlights = book?.metadata?.highlights || [];
    const dictionaryWords = book?.metadata?.words || [];
    const tabs = book?.metadata?.tabs || [];
    
    const stableHighlights = useMemo(() => {
        const dictHighlights = dictionaryWords.filter(w => w.startOffset != null && w.pageNumber != null).map(w => ({
            id: `dict-${w.word}-${w.startOffset}`,
            text: w.word,
            color: 'gray',
            page: w.pageNumber,
            startOffset: w.startOffset,
            isDictionaryWord: true,
            wordObj: w
        }));

        const tabHighlights = tabs.filter(t => t.startOffset != null && t.pageNumber != null).map(t => ({
            id: `tab-${t.id}`,
            text: t.context || '', // context contains the highlighted text
            color: 'rgba(128, 128, 128, 0.3)', // grey highlight
            page: t.pageNumber,
            startOffset: t.startOffset,
            isTab: true,
            tabObj: t
        }));

        return [...highlights, ...dictHighlights, ...tabHighlights];
    }, [highlights, dictionaryWords, tabs]);

    const isCurrentPageBookmarked = bookmarks.some(
        bm => bm.pageNumber === pageNumber || bm.page === pageNumber
    );

    // Dictionary click listener
    useEffect(() => {
        const handleDictClick = (e) => {
            const { wordObj, rect } = e.detail;
            
            // Set up selection as if user highlighted the word
            const mockSelection = {
                text: wordObj.word,
                x: rect.left + rect.width / 2,
                y: rect.top,
                startOffset: wordObj.startOffset,
                bottom: rect.bottom,
                pageNumber: wordObj.pageNumber,
                cachedDefinition: wordObj
            };
            
            selectionRef.current = mockSelection;
            setSelectionData(mockSelection);
            setShowHighlightMenu(true);
            
            setIsDictOpen(true);
        };
        
        window.addEventListener('apex-dict-click', handleDictClick);
        return () => window.removeEventListener('apex-dict-click', handleDictClick);
    }, []);

    // Simplify click listener
    const handleSimplifyRef = useRef();
    // Keep ref updated without triggering re-renders
    useEffect(() => {
        handleSimplifyRef.current = handleSimplify;
    });

    useEffect(() => {
        const handleSimplifyClick = (e) => {
            const { text } = e.detail;
            selectionRef.current = { text };
            if (handleSimplifyRef.current) {
                handleSimplifyRef.current();
            }
        };
        window.addEventListener('apex-simplify-click', handleSimplifyClick);
        return () => window.removeEventListener('apex-simplify-click', handleSimplifyClick);
    }, []);

    // Tab click listener
    useEffect(() => {
        const handleTabClick = (e) => {
            const { tabObj, rect } = e.detail;

            const mockSelection = {
                text: tabObj.context || '',
                x: rect.left + rect.width / 2,
                y: rect.top,
                startOffset: tabObj.startOffset,
                bottom: rect.bottom,
                pageNumber: tabObj.pageNumber,
                cachedTab: tabObj
            };
            
            selectionRef.current = mockSelection;
            setSelectionData(mockSelection);
            // Keep the menu alive past selectionchange (same guard as dict click)
            setIsDictOpen(true);
            setShowHighlightMenu(true);
        };
        window.addEventListener('apex-tab-click', handleTabClick);
        return () => window.removeEventListener('apex-tab-click', handleTabClick);
    }, []);

    // Ref-stable callback — identity never changes, so PDFReader never re-renders due to this prop
    const syncProgressRef = useRef(syncProgress);
    useEffect(() => { syncProgressRef.current = syncProgress; }, [syncProgress]);

    const stableOnPageChange = useCallback((n) => {
        setPageNumber(n);
        syncProgressRef.current(n, numPages);
    }, []);

    // Expose pdfControls object
    const pdfControls = isPdf
        ? { pageNumber, numPages, scale, rotation, nextPage, previousPage, zoomIn, zoomOut, rotate, goToPage }
        : null;

    // Reader UI controls passed to FirstLayerNavBar
    const readerControls = {
        locked,
        onToggleLock: () => setLocked(prev => !prev),
        onResetZoom: resetZoom,
        progress: localProgress,
        pages: localPages,
        // Bookmarks
        isBookmarked: isCurrentPageBookmarked,
        onToggleBookmark: async () => toggleBookmark(book.id, pageNumber),
        bookmarks,
        onJumpToBookmark: goToPage,
        onRemoveBookmark: async (page) => toggleBookmark(book.id, page),
        // Highlights
        highlights,
        removeHighlight: (highlightId) => removeHighlight(book.id, highlightId),
        onJumpToHighlight: goToPage,
        // Notes
        tabs: book?.metadata?.tabs || [],
        addTab: (text) => addTab(book.id, text),
        updateTab: (tabId, text) => updateTab(book.id, tabId, text),
        deleteTab: (tabId) => deleteTab(book.id, tabId),
        // Simplifications
        simplifications,
        removeSimplification: (simplificationId) => removeSimplification(book.id, simplificationId),
        onViewSimplification: handleSparkleClick,
        // Favorites & Bookmarked Status (Book Level)
        isFavorite: book?.isFavorite,
        onToggleFavorite: () => toggleFavorite(book.id),
        isBookmarkedBook: book?.isBookmarked,
        onToggleBookmarkedBook: () => toggleBookmarkedBook(book.id),
        onProgressBarClick: openPageStrip,
        onGenerateFlashcards: async (startPage, endPage) => {
            if (!pdfDocumentRef.current) return;
            const pdf = pdfDocumentRef.current;
            const pageTexts = [];
            
            showToast('Extracting text from pages...', 'info');
            
            for (let i = startPage; i <= endPage; i++) {
                try {
                    const page = await pdf.getPage(i);
                    const tc = await page.getTextContent();
                    const text = tc.items.map(item => item.str).join(' ');
                    pageTexts.push({ page: i, text });
                } catch (err) {
                    console.error('[Flashcards] Failed to extract text for page', i, err);
                }
            }
            
            if (pageTexts.length === 0) {
                showToast('Could not extract any text from those pages.', 'error');
                return;
            }
            
            // Open modal ONCE with the real data
            useFlashcardStore.getState().openFlashcardModal({
                sourceType: 'book_pages',
                textContent: pageTexts.map(pt => `[Page ${pt.page}]\n${pt.text}`).join('\n\n'),
                pageTexts,
                numCards: 10
            });
        },
        pageSettings,
        setPageSettings: (val) => {
            if (val) setLeftPanel(false); // Close left panel if settings open
            setPageSettings(val);
        },
        scrollOrientation,
        setScrollOrientation: (val) => {
          setScrollOrientation(val);
          updateSetting('scrollOrientation', val);
        },
        onToggleDictionary: () => setIsReaderDictOpen(prev => !prev),
    };

    // --- Accessibility Keyboard Shortcuts ---
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return;
            
            switch (e.key) {
                case 'ArrowRight':
                case 'PageDown':
                    e.preventDefault();
                    nextPage();
                    break;
                case 'ArrowLeft':
                case 'PageUp':
                    e.preventDefault();
                    previousPage();
                    break;
                case '=':
                case '+':
                    e.preventDefault();
                    zoomIn();
                    break;
                case '-':
                    e.preventDefault();
                    zoomOut();
                    break;
                case '0':
                    e.preventDefault();
                    resetZoom();
                    break;
                case 'r':
                case 'R':
                    e.preventDefault();
                    rotate();
                    break;
                case 'f':
                case 'F':
                    e.preventDefault();
                    setNavState(prev => prev === 'none' ? 'first' : 'none');
                    break;
                case 'd':
                case 'D':
                    e.preventDefault();
                    setIsReaderDictOpen(prev => {
                        if (!prev) {
                            setAiModal(false);
                            setPageSettings(false);
                            setQuizModal(false);
                            setLeftPanel(false);
                        }
                        return !prev;
                    });
                    break;
                case 'a':
                case 'A':
                    e.preventDefault();
                    setAiModal(prev => {
                        if (!prev) {
                            setPageSettings(false);
                            setQuizModal(false);
                            setIsReaderDictOpen(false);
                            setLeftPanel(false);
                        }
                        return !prev;
                    });
                    break;
                case 's':
                case 'S':
                    e.preventDefault();
                    setPageSettings(prev => {
                        if (!prev) {
                            setAiModal(false);
                            setQuizModal(false);
                            setIsReaderDictOpen(false);
                            setLeftPanel(false);
                        }
                        return !prev;
                    });
                    break;
                case 'q':
                case 'Q':
                    e.preventDefault();
                    setQuizModal(prev => {
                        if (!prev) {
                            setAiModal(false);
                            setPageSettings(false);
                            setIsReaderDictOpen(false);
                            setLeftPanel(false);
                        }
                        return !prev;
                    });
                    break;
                case 'Escape':
                    e.preventDefault();
                    setNavState('none');
                    setPageSettings(false);
                    setLeftPanel(false);
                    setIsReaderDictOpen(false);
                    setShowHighlightMenu(false);
                    setAiModal(false);
                    setQuizModal(false);
                    setShowSimplifyModal(false);
                    break;
                default:
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [nextPage, previousPage, zoomIn, zoomOut, rotate, resetZoom]);

    // Screen handlers


    const closeNav = useCallback(() => {
        // Don't close nav if user just finished selecting text — prevents re-render flicker
        if (window.getSelection().toString().trim()) return;
        setNavState('none');
    }, []);

    // Override native context menu on mobile so our HighlightMenu is used instead
    useEffect(() => {
        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        if (!isTouchDevice) return;

        const handleContextMenu = (e) => {
            // Only suppress when inside the reader and there's a text selection
            const sel = window.getSelection();
            if (sel && sel.toString().trim().length > 0) {
                e.preventDefault();
            }
        };

        document.addEventListener('contextmenu', handleContextMenu, { passive: false });
        return () => document.removeEventListener('contextmenu', handleContextMenu);
    }, []);

    // Helper to get selection bounding box
    const getSelectionRect = useCallback((sel) => {
        try {
            if (sel.rangeCount > 0) {
                const range = sel.getRangeAt(0);
                return range.getBoundingClientRect();
            }
        } catch (e) {
            console.warn("Failed to get selection rect", e);
        }
        return null;
    }, []);

    // Touch Gesture State
    const touchState = useRef({
        initialDist: 0,
        initialScale: 1.0,
        isPinching: false
    });
    // Ref to track current scale without re-running the touch/selection effect
    const scaleRef = useRef(scale);
    useEffect(() => { scaleRef.current = scale; }, [scale]);

    // Track last selected text to avoid unnecessary position jitter
    const lastSelTextRef = useRef('');
    const selDebounceRef = useRef(null);
    const showHighlightMenuRef = useRef(showHighlightMenu);
    useEffect(() => { showHighlightMenuRef.current = showHighlightMenu; }, [showHighlightMenu]);
    const isSelectingRef = useRef(false);
    const [selectionLock, setSelectionLock] = useState(false);
    const selectionLockRef = useRef(false);
    const ignoreSelectionChangeRef = useRef(false);

    // Selection monitoring logic
    useEffect(() => {
        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

        const getDistance = (touches) => {
            return Math.hypot(
                touches[0].pageX - touches[1].pageX,
                touches[0].pageY - touches[1].pageY
            );
        };

        const handleTouchStart = (e) => {
            if (e.touches.length === 2) {
                e.preventDefault();
                touchState.current.isPinching = true;
                touchState.current.initialDist = getDistance(e.touches);
                touchState.current.initialScale = scaleRef.current;
            }
        };

        const handleTouchMove = (e) => {
            if (e.touches.length === 2 && touchState.current.isPinching) {
                e.preventDefault();
                const currentDist = getDistance(e.touches);
                const ratio = currentDist / touchState.current.initialDist;
                const newScale = Math.min(Math.max(touchState.current.initialScale * ratio, 0.5), 2.5);
                setScale(newScale);
            }
        };

        const handleTouchEnd = (e) => {
            if (e.touches.length < 2) {
                touchState.current.isPinching = false;
            }
        };

        // Core selection handler — called directly on desktop, debounced on mobile
        const processSelection = () => {
            const activeSel = window.getSelection();
            const text = activeSel?.toString().trim() || '';

            // Track active selection state — used to suppress scroll/swipe during selection
            isSelectingRef.current = text.length > 0;

            if (text && text.length > 0) {
                const rect = getSelectionRect(activeSel);
                if (rect) {
                    // Only update position if text content changed or menu isn't shown yet
                    const textChanged = text !== lastSelTextRef.current;
                    lastSelTextRef.current = text;

                    let foundOffset = -1;
                    try {
                        const pageWrapper = activeSel.anchorNode?.parentElement?.closest('.pdf-page-wrapper');
                        if (pageWrapper) {
                            const textLayer = pageWrapper.querySelector('.react-pdf__Page__textContent');
                            if (textLayer) {
                                const walker = document.createTreeWalker(textLayer, NodeFilter.SHOW_TEXT, null);
                                let node;
                                let fullText = '';
                                while ((node = walker.nextNode())) {
                                    if (fullText.length > 0 && !fullText.endsWith(' ') && !node.textContent.startsWith(' ')) fullText += ' ';
                                    if (node === activeSel.anchorNode || node.parentNode === activeSel.anchorNode) {
                                        foundOffset = fullText.length + activeSel.anchorOffset;
                                        break;
                                    }
                                    fullText += node.textContent;
                                }
                            }
                        }
                    } catch (e) {}

                    if (textChanged || !showHighlightMenuRef.current) {
                        const newData = {
                            text,
                            x: rect.left + rect.width / 2,
                            y: rect.top,
                            startOffset: foundOffset !== -1 ? foundOffset : null,
                            bottom: rect.bottom,
                            pageNumber: pageNumber
                        };
                        selectionRef.current = newData;
                        setSelectionData(newData);
                        console.log('[Apex Performance] Selection captured via State');
                    }
                    setShowHighlightMenu(true);
                }
            } else {
                lastSelTextRef.current = '';
                // Only hide if dictionary isn't open
                if (!isDictOpen) {
                    setShowHighlightMenu(false);
                }
            }
        };

        // Hide the menu immediately when user starts interacting (dragging/highlighting) again
        const handleInteractionStart = (e) => {
            if (e.target.closest('.highlight-menu-container')) return;
            // Don't close if tapping a highlight overlay (dict/simplified/tab marker).
            // Also suppress selectionchange for the next 200ms so the handler
            // (which fires before onclick on mobile) cannot close the modal.
            if (e.target.classList.contains('apex-hl-overlay')) {
                ignoreSelectionChangeRef.current = true;
                setTimeout(() => { ignoreSelectionChangeRef.current = false; }, 200);
                return;
            }
            setShowHighlightMenu(false);
        };

        // Debounced handler to prevent menu from popping up while user is actively highlighting
        const handleSelectionUpdate = () => {
            if (ignoreSelectionChangeRef.current) return;
            clearTimeout(selDebounceRef.current);

            const activeSel = window.getSelection();
            const text = activeSel?.toString().trim() || '';

            if (text !== lastSelTextRef.current) {
                if (text === '') {
                    // Selection cleared. Only hide if dict/note is not open.
                    if (!isDictOpen) {
                        setShowHighlightMenu(false);
                    }
                } else {
                    // User is actively highlighting new text or dragging handles.
                    // Always hide the menu (and close dict/note if they were open to revert to highlight menu).
                    if (isDictOpen) {
                        setIsDictOpen(false);
                    }
                    setShowHighlightMenu(false);
                }
            }

            selDebounceRef.current = setTimeout(processSelection, 400);
        };

        const handleSelectionChangeRaw = () => {
            const hasSelection = window.getSelection()?.toString().trim().length > 0;
            if (hasSelection && !selectionLockRef.current) {
                selectionLockRef.current = true;
                setSelectionLock(true);
            } else if (!hasSelection && selectionLockRef.current) {
                // Sticky delay: prevent trailing touchend tap from triggering a swipe navigation
                setTimeout(() => {
                    selectionLockRef.current = false;
                    setSelectionLock(false);
                }, 200);
            }
        };

        document.addEventListener('selectionchange', handleSelectionChangeRaw);
        document.addEventListener('selectionchange', handleSelectionUpdate);
        document.addEventListener('touchstart', handleTouchStart, { passive: false });
        document.addEventListener('touchmove', handleTouchMove, { passive: false });
        document.addEventListener('touchend', handleTouchEnd);
        document.addEventListener('mousedown', handleInteractionStart);
        document.addEventListener('touchstart', handleInteractionStart);

        return () => {
            clearTimeout(selDebounceRef.current);
            document.removeEventListener('selectionchange', handleSelectionChangeRaw);
            document.removeEventListener('selectionchange', handleSelectionUpdate);
            document.removeEventListener('touchstart', handleTouchStart);
            document.removeEventListener('touchmove', handleTouchMove);
            document.removeEventListener('touchend', handleTouchEnd);
            document.removeEventListener('mousedown', handleInteractionStart);
            document.removeEventListener('touchstart', handleInteractionStart);
        };
    }, [isDictOpen, getSelectionRect]);

    // Refs for stability
    const updateProgressRef = useRef(updateBookProgress);
    const currentBookRef = useRef(book);
    useEffect(() => { updateProgressRef.current = updateBookProgress; }, [updateBookProgress]);
    useEffect(() => { currentBookRef.current = book; }, [book]);

    useEffect(() => {
        if (!book && bookId) {
            navigate('/');
            return;
        }

        // Handle cloud download if file is missing locally
        if (book && !book.file && (book.supabaseId || book.recordId)) {
            setLoadingMessage("Downloading from cloud...");
            downloadMissingFile(book.id).then(downloadedFile => {
                if (!downloadedFile) {
                    setLoadingMessage(navigator.onLine
                        ? "Failed to load book from the cloud."
                        : "Connect to internet to download this book.");
                    setDownloadError(true);
                    setIsLoading(false);
                }
            });
            return;
        }

        const file = book?.file;
        if (file) {
            const isTypePdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
            const isTypeImage = file.type.startsWith('image/') || /\.(jpg|jpeg|png|webp)$/i.test(file.name);
            const isTypeText = file.type === 'text/plain' || file.name.toLowerCase().endsWith('.txt');

            if (isTypePdf || isTypeImage) {
                const url = URL.createObjectURL(file);
                Promise.resolve().then(() => {
                    setFileUrl(url);
                    setTextContent("");
                    setHtmlContent("");
                });
                return () => URL.revokeObjectURL(url);
            } else if (isTypeText) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    setTextContent(e.target.result);
                    setFileUrl(null);
                    setHtmlContent("");
                };
                reader.readAsText(file);
            } else if (isDocx || isDoc) {
                const reader = new FileReader();
                reader.onload = async (e) => {
                    const arrayBuffer = e.target.result;
                    try {
                        // Use mammoth from CDN for DOCX conversion
                        const mammoth = await import('https://esm.sh/mammoth@1.8.0');
                        const result = await mammoth.convertToHtml({ arrayBuffer });
                        setHtmlContent(DOMPurify.sanitize(result.value));
                        setTextContent("");
                        setFileUrl(null);
                    } catch (err) {
                        console.error("Failed to convert docx:", err);
                        // Fallback to text if possible
                        const textResult = await mammoth.extractRawText({ arrayBuffer });
                        setTextContent(textResult.value);
                    }
                };
                reader.readAsArrayBuffer(file);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [bookId, book?.file, navigate, isDocx, isDoc]);

    // Loading Sequence Animation
    const [showMenuBriefly, setShowMenuBriefly] = useState(false);
    const [showScrollOverlay, setShowScrollOverlay] = useState(false);

    useEffect(() => {
        if (!isLoading) return;

        const messages = ["Setting up file", "Loading all pages", "Finalizing load", "Rendering"];
        let currentIndex = 0;

        const interval = setInterval(() => {
            if (currentIndex < messages.length - 1) {
                currentIndex++;
                setLoadingMessage(messages[currentIndex]);
            }
        }, 800);

        // Completion logic - wait for bit after "Rendering"
        const finalTimer = setTimeout(() => {
            if (book?.file) {
                setIsLoading(false);
                // Trigger UX effects - Slide menu out and show overlay
                setShowMenuBriefly(true);
                setShowScrollOverlay(true);

                // Retract menu after 3 seconds
                setTimeout(() => setShowMenuBriefly(false), 3000);
                // Hide overlay after 3 seconds
                setTimeout(() => setShowScrollOverlay(false), 3000);
            }
        }, messages.length * 800 + 400);

        return () => {
            clearInterval(interval);
            clearTimeout(finalTimer);
        };
    }, [isLoading, book?.file]);


    const lastBookIdRef = useRef(null);
    useEffect(() => {
        if (!bookId || !book || lastBookIdRef.current === bookId) return;
        lastBookIdRef.current = bookId;
        // For non-PDF books, restore saved scroll position; for PDFs, page number handles it
        if (!isPdf && book.scrollPosition > 0) {
            // Delay to let content render before scrolling
            setTimeout(() => window.scrollTo(0, book.scrollPosition), 300);
        } else {
            window.scrollTo(0, 0);
        }
        Promise.resolve().then(() => {
            setLocalProgress(book.progress || 0);
            setLocalPages({ current: book.currentPage || 1, total: book.totalPages || 1 });
            setPageNumber(book.currentPage || 1);
        });
    }, [bookId, book]);

    const lastUpdateRef = useRef(0);
    useEffect(() => {
        if (isPdf) return;

        const handleScroll = () => {
            const b = currentBookRef.current;
            if (!b) return;

            const scrollY = window.scrollY;
            const docHeight = document.documentElement.scrollHeight;
            const scrollableHeight = docHeight - window.innerHeight;

            const progress = scrollableHeight > 0
                ? Math.min(100, Math.max(0, Math.round((scrollY / scrollableHeight) * 100)))
                : 100;

            const totalPages = Math.max(1, Math.ceil(docHeight / 1000));
            const currentPage = Math.min(totalPages, Math.floor(scrollY / 1000) + 1);

            setLocalProgress(progress);
            setLocalPages({ current: currentPage, total: totalPages });

            const now = Date.now();
            if (now - lastUpdateRef.current > 300) {
                const hasChanged = progress !== b.progress || currentPage !== b.currentPage || totalPages !== b.totalPages;
                if (hasChanged || progress === 100) {
                    updateProgressRef.current(b.id, progress, currentPage, totalPages, scrollY);
                    lastUpdateRef.current = now;
                }
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        const timer = setTimeout(handleScroll, 500);

        return () => {
            window.removeEventListener('scroll', handleScroll);
            clearTimeout(timer);
        };
    }, [bookId, textContent, fileUrl, isPdf]);

    if (downloadError) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[100dvh] bg-slate-50 relative p-8 font-sans">
                <div className="absolute top-6 left-6 z-10">
                    <button
                        onClick={handleExitReader}
                        className="p-3 bg-white rounded-xl shadow-md border border-slate-200 text-slate-700 hover:text-accent-primary hover:border-purple-200 transition-all font-bold text-sm tracking-wide flex items-center gap-2 group"
                    >
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Library
                    </button>
                </div>
                <div className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 max-w-sm w-full text-center flex flex-col items-center gap-6 animate-in slide-in-from-bottom-6 fade-in duration-500">
                    <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center">
                        <WarningCircle size={32} />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">Download Error</h2>
                        <p className="text-sm font-medium text-slate-500">{loadingMessage}</p>
                    </div>
                    <button
                        onClick={() => window.location.reload()}
                        className="w-full py-4 rounded-xl bg-accent-primary hover:bg-purple-700 text-white font-bold transition-all shadow-lg shadow-purple-500/20 active:scale-95 flex items-center justify-center gap-2"
                    >
                        <List size={18} /> Try Again
                    </button>
                </div>
            </div>
        );
    }

    if (!book) return null;

    if (isLoading) {
        return <BookSkeleton message={loadingMessage} />;
    }

    return (
        <div
            className="h-[100dvh] max-h-[100dvh] w-screen bg-bg-primary text-text-primary font-serif selection:bg-blue-200/50 relative overflow-hidden"
            onClick={closeNav}
            data-lenis-prevent="true"
        >
            <ScrollOrientationOverlay visible={showScrollOverlay} orientation={scrollOrientation} />
            <div className="flex h-full max-h-full overflow-hidden relative">
                {/* Far-left panel */}
                {leftPanel && <LeftPanel 
                    setLeftPanel={setLeftPanel} 
                    readerControls={readerControls} 
                    pdfControls={pdfControls}
                    tocOutline={tocOutline}
                />}
                
                {/* Gear panel */}
                {pageSettings && <PageSettings 
                    setPageSettings={setPageSettings}
                    readerControls={readerControls}
                />}

                {/* Notebook panels */}
                {notebookPanel && <ReaderNotebookPanel
                    setNotebookPanel={setNotebookPanel}
                    bookId={bookId}
                    onAddNote={(id) => {
                        setLeftPanel(false);
                        setPageSettings(false);
                        setAiModal(false);
                        setNoteEditor(id);
                    }}
                    readerControls={readerControls}
                />}
                {noteEditor && <ReaderNoteEditor
                    bookId={bookId}
                    noteId={noteEditor}
                    onClose={() => {
                        setNoteEditor(null);
                        setNotebookPanel(true);
                    }}
                />}

                {/* Highlight List */}
                {showHighlightMenu && (
                    <HighlightMenu
                        selection={selectionRef.current.text}
                        position={{ 
                            x: selectionRef.current.x, 
                            y: selectionRef.current.y,
                            bottom: selectionRef.current.bottom,
                            startOffset: selectionRef.current.startOffset,
                            pageNumber: selectionRef.current.pageNumber
                        }}
                        cachedDefinition={selectionRef.current.cachedDefinition}
                        cachedTab={selectionRef.current.cachedTab}
                        onAskAI={() => {
                            window.getSelection()?.removeAllRanges();
                            setAiModal(true);
                            setShowHighlightMenu(false);
                            setIsDictOpen(false);
                        }}
                        onClose={() => {
                            setShowHighlightMenu(false);
                            setIsDictOpen(false);
                        }}
                        bookId={book?.id}
                        onSaveWord={addSavedWord}
                        onHighlight={handleHighlight}
                        onSimplify={handleSimplify}
                        onDictToggle={(val) => {
                            setIsDictOpen(val);
                            if (val) {
                                ignoreSelectionChangeRef.current = true;
                                window.getSelection()?.removeAllRanges();
                                setTimeout(() => {
                                    ignoreSelectionChangeRef.current = false;
                                }, 50);
                            }
                        }}
                        onAddNote={readerControls.addTab}
                        onUpdateNote={readerControls.updateTab}
                        onDeleteNote={readerControls.deleteTab}
                        onGenerateFlashcards={(selection, count) => {
                            setShowHighlightMenu(false);
                            useFlashcardStore.getState().openFlashcardModal({
                                sourceType: 'highlight',
                                textContent: selection,
                                numCards: count
                            });
                        }}
                    />
                )}

                {/* Simplify Modal */}
                {showSimplifyModal && (
                    <SimplifyModal
                        originalText={activeSimplification.originalText}
                        simplifiedText={activeSimplification.simplifiedText}
                        loading={activeSimplification.loading}
                        error={activeSimplification.error}
                        onRetry={handleRetrySimplify}
                        onClose={() => setShowSimplifyModal(false)}
                    />
                )}

                {/* Main reading area */}
                <div className="flex-1 relative min-w-0 flex flex-col h-full max-h-full overflow-hidden">
                    {/* Subtle List Trigger - Persistent at top, now relative to content area */}
                    <div className={`absolute top-0 left-1/2 -translate-x-1/2 z-[60] flex flex-col items-center transition-all duration-500 ease-in-out ${navState !== 'none' ? '-translate-y-full opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'}`}>
                        <button
                            onClick={(e) => { e.stopPropagation(); toggleNav(); }}
                            className="group bg-white/15 dark:bg-white/5 hover:bg-white/25 dark:hover:bg-white/10 backdrop-blur-xl shadow-sm border-0 border-t border-white/25 dark:border-white/10 px-3 py-1.5 rounded-b-xl transition-all duration-300 flex items-center gap-1.5"
                        >
                            <div className={`w-1 h-1 rounded-full transition-colors ${navState !== 'none' ? 'bg-accent-primary' : 'bg-slate-300 group-hover:bg-accent-primary'}`} />
                            <span className={`text-[10px] font-bold uppercase tracking-widest transition-colors ${navState !== 'none' ? 'text-text-primary' : 'text-text-tertiary group-hover:text-text-primary'}`}>Menu</span>
                            <List size={12} className={`transition-colors ${navState !== 'none' ? 'text-text-primary' : 'text-text-tertiary group-hover:text-text-primary'}`} />
                        </button>
                    </div>


                    <ReaderNavBar
                        book={book}
                        navigate={handleExitReader}
                        navState={navState}
                        setNavState={setNavState}
                        setPageSettings={(val) => {
                            if (val) {
                                setLeftPanel(false);
                                setNotebookPanel(false);
                                setNoteEditor(null);
                            }
                            setPageSettings(val);
                        }}
                        aiModal={aiModal}
                        setAiModal={setAiModal}
                        quizModal={quizModal}
                        setQuizModal={setQuizModal}
                        leftPanel={leftPanel}
                        setLeftPanel={(val) => {
                            if (val) {
                                setPageSettings(false);
                                setNotebookPanel(false);
                                setNoteEditor(null);
                            }
                            setLeftPanel(val);
                        }}
                        pdfControls={pdfControls}
                        readerControls={readerControls}
                        showPageStrip={showPageStrip}
                        closePageStrip={closePageStrip}
                        fileUrl={fileUrl}
                        isPdf={isPdf}
                        scrollOrientation={scrollOrientation}
                        onNotebookClick={() => {
                            setNavState('none');
                            setNotebookPanel(prev => {
                                const next = !prev;
                                if (next) {
                                    setLeftPanel(false);
                                    setPageSettings(false);
                                    setAiModal(false);
                                }
                                return next;
                            });
                            setNoteEditor(null);
                        }}
                    />

                    {/* PDF Content */}
                    {fileUrl && isPdf && (
                        <div className="flex-1 flex overflow-hidden relative">
                            <PDFReader
                                fileUrl={fileUrl}
                                pageNumber={pageNumber}
                                scale={scale}
                                rotation={rotation}
                                onDocumentLoad={handleDocumentLoad}
                                onNextPage={nextPage}
                                onPrevPage={previousPage}
                                numPages={numPages}
                                goToPage={goToPage}
                                highlights={stableHighlights}
                                locked={locked}
                                swipeLocked={selectionLock || isDictOpen || isReaderDictOpen}
                                scrollOrientation={scrollOrientation}
                                onPageChange={stableOnPageChange}
                            />

                            {scrollOrientation !== 'vertical' && (
                                <>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); previousPage(); }}
                                        disabled={pageNumber <= 1}
                                        className="md:flex hidden absolute left-2 md:left-6 top-1/2 -translate-y-1/2 z-[80] items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-full bg-white hover:bg-gray-50 text-text-secondary hover:text-blue-600 transition-all duration-300 active:scale-90 disabled:opacity-0 disabled:pointer-events-none shadow-[0_8px_30px_rgb(0,0,0,0.12)]"
                                        title="Previous page"
                                    >
                                        <CaretLeft size={28} strokeWidth={2.5} className="-ml-1" />
                                    </button>

                                    <button
                                        onClick={(e) => { e.stopPropagation(); nextPage(); }}
                                        disabled={pageNumber >= (numPages || 1)}
                                        className="md:flex hidden absolute right-2 md:right-6 top-1/2 -translate-y-1/2 z-[80] items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-full bg-white hover:bg-gray-50 text-text-secondary hover:text-blue-600 transition-all duration-300 active:scale-90 disabled:opacity-0 disabled:pointer-events-none shadow-[0_8px_30px_rgb(0,0,0,0.12)]"
                                        title="Next page"
                                    >
                                        <CaretRight size={28} strokeWidth={2.5} className="ml-1" />
                                    </button>
                                </>
                            )}
                        </div>
                    )}

                    {/* Image content */}
                    {fileUrl && !isPdf && (
                        <div className="flex-1 flex flex-col items-center justify-center lg:justify-start overflow-auto p-4 sm:p-8">
                            <img src={fileUrl} alt="content" className="max-w-full max-h-[90vh] object-contain rounded-sm bg-bg-elevated" />
                        </div>
                    )}

                    {/* Text content */}
                    {!fileUrl && (
                        <div className="flex-1 overflow-auto h-full touch-auto flex flex-col items-center justify-center lg:justify-start">
                            <div
                                className="max-w-3xl w-full mx-auto px-8 sm:px-12 py-12 lg:py-24 leading-[1.8] text-xl sm:text-2xl text-text-primary antialiased"
                                style={{
                                    transform: `scale(${scale})`,
                                    transformOrigin: 'top center',
                                    transition: 'transform 0.2s ease-out'
                                }}
                            >
                                {htmlContent ? (
                                    <div className="docx-content animate-in fade-in duration-1000" dangerouslySetInnerHTML={{ __html: htmlContent }} />
                                ) : textContent ? (
                                    <div className="whitespace-pre-wrap animate-in fade-in duration-1000">{textContent}</div>
                                ) : book?.file ? (
                                    <div className="text-center py-40 flex flex-col items-center">
                                        <div className="w-12 h-12 rounded-full border-t-2 border-accent-primary animate-spin mb-4" />
                                        <p className="opacity-50 text-sm font-sans tracking-wide">Initializing view...</p>
                                    </div>
                                ) : (
                                    <div className="text-center py-40 flex flex-col items-center gap-4">
                                        <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center">
                                            <Plus className="rotate-45" size={32} />
                                        </div>
                                        <h3 className="text-2xl font-bold">No File Content</h3>
                                        <p className="text-base opacity-60 font-sans max-w-sm">This book entry was found, but the actual file data is missing or couldn't be loaded.</p>
                                        <button onClick={() => navigate('/')} className="mt-4 px-6 py-2 bg-accent-primary text-bg-elevated rounded-full font-sans text-sm font-semibold">Return Home</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* AI panel */}
                {aiModal && (
                    <AIModal
                        setAiModal={setAiModal}
                        bookTitle={book?.title || book?.file?.name}
                        selectedText={selectionData.text}
                        bookId={book?.id?.toString()}
                        currentPage={pageNumber}
                        numPages={numPages}
                        examName={book?.examName || ''}
                    />
                )}

                {/* Quiz panel */}
                {quizModal && (
                    <QuizPanel
                        onClose={() => {
                            setQuizModal(false);
                            // If user came from SessionSummary and dismissed quiz panel without starting,
                            // return them to SessionSummaryModal
                            if (quizFromSessionRef.current) {
                                quizFromSessionRef.current = false;
                                // Recompute stats with updated sessionXpActions (quiz may have been saved)
                                const updatedActions = useXpStore.getState().sessionXpActions || [];
                                const readingXp = sessionStats.xpGained;
                                const activityXp = updatedActions.reduce((sum, act) => sum + act.estimatedXp, 0);
                                setSessionStats(prev => ({
                                    ...prev,
                                    totalXp: Math.max(0, readingXp + activityXp),
                                    breakdown: getSessionXpBreakdown(updatedActions, readingXp),
                                }));
                                setShowSessionSummary(true);
                            }
                        }}
                        bookId={book?.id}
                        supabaseBookId={book?.supabaseId || book?.recordId}
                        bookTitle={book?.title || book?.file?.name}
                        fileUrl={fileUrl}
                        isPdf={isPdf}
                        numPages={numPages || (isPdf ? 0 : localPages.total)}
                        userId={authUser?.id}
                        onQuizStart={(session) => {
                            console.log('[ReaderView] QuizPanel onQuizStart — launching QuizView', session);
                            setQuizModal(false);
                            setActiveQuizSession(session);
                        }}
                    />
                )}

                {/* Quiz View — full screen, always on top */}
                {activeQuizSession && (
                    <QuizView
                        quizSession={activeQuizSession}
                        bookId={book?.id}
                        supabaseBookId={book?.supabaseId || book?.recordId}
                        userId={authUser?.id}
                        onClose={() => {
                            console.log('[ReaderView] QuizView closed');
                            setActiveQuizSession(null);
                            // If user came from SessionSummary, return there with updated stats
                            if (quizFromSessionRef.current) {
                                quizFromSessionRef.current = false;
                                const updatedActions = useXpStore.getState().sessionXpActions || [];
                                const readingXp = sessionStats.xpGained;
                                const activityXp = updatedActions.reduce((sum, act) => sum + act.estimatedXp, 0);
                                setSessionStats(prev => ({
                                    ...prev,
                                    totalXp: Math.max(0, readingXp + activityXp),
                                    breakdown: getSessionXpBreakdown(updatedActions, readingXp),
                                }));
                                setShowSessionSummary(true);
                            }
                        }}
                    />
                )}
            </div>

            {/* Page Strip Overlay */}
            {((showPageStrip && isPdf && fileUrl) || (showPageStrip && !isPdf)) && (
                <PageStrip
                    fileUrl={fileUrl}
                    isPdf={isPdf}
                    numPages={numPages || (isPdf ? 0 : localPages.total)}
                    pageNumber={pageNumber}
                    goToPage={goToPage}
                    onClose={closePageStrip}
                />
            )}
            <ReaderDictionary isOpen={isReaderDictOpen} onClose={() => setIsReaderDictOpen(false)} bookId={book?.id} initialWord={selectionData.text} />
            
            <AnimatePresence>
                {showStreakCelebration && celebrationData && (
                    <StreakCelebration 
                        streakCount={celebrationData.streakCount} 
                        streakHistory={celebrationData.streakHistory} 
                        onClose={() => setShowStreakCelebration(false)} 
                    />
                )}
            </AnimatePresence>
            <AnimatePresence>
                {showSessionSummary && (
                    <SessionSummaryModal
                        xpGained={sessionStats.totalXp}
                        pagesRead={sessionStats.pagesRead}
                        timeSpentSeconds={sessionStats.timeSpentSeconds}
                        breakdown={sessionStats.breakdown}
                        onClose={() => {
                            // User confirmed exit — flush reading time + award XP now (fire and forget)
                            flushSessionToQueue();

                            const minutesRead = Math.floor(sessionStats.timeSpentSeconds / 60);
                            if (minutesRead > 0) {
                                useQuestStore.getState().reportAction('reading', minutesRead);
                            }

                            if (sessionStats.xpGained > 0) {
                                const xpStore = useXpStore.getState();
                                const minutes = Math.round(sessionStats.xpGained / 2);
                                xpStore.awardXpOptimistic('reading', { minutes }, sessionStats.xpGained);
                                xpStore.flushPendingXp();
                            }
                            // Check if any quest is still incomplete — show Quest Modal if so
                            const questState = useQuestStore.getState();
                            const hasIncomplete = [questState.quest_1, questState.quest_2, questState.quest_3]
                                .filter(Boolean)
                                .some(q => !q.completed);

                            setShowSessionSummary(false);

                            if (hasIncomplete) {
                                setShowQuestSummary(true);
                            } else {
                                // All quests done (or none loaded) — skip quest modal, go to dashboard
                                useXpStore.getState().startSessionTracker();
                                navigate('/', { replace: true });
                            }
                        }}
                        onCancel={() => {
                            // User clicked X — cancel exit, resume timer
                            setShowSessionSummary(false);
                            sessionStartTime.current = Date.now();
                            startTick();
                        }}
                        onStartQuiz={() => {
                            setShowSessionSummary(false);
                            quizFromSessionRef.current = true;
                            setNavState('first');
                            setTimeout(() => {
                                setQuizModal(true);
                            }, 300);
                        }}
                    />
                )}
            </AnimatePresence>
            {showQuestSummary && (
                <QuestSummaryModal
                    onDone={() => {
                        useXpStore.getState().startSessionTracker();
                        navigate('/', { replace: true });
                    }}
                />
            )}
        </div>
    );
}

export default ReaderView;
