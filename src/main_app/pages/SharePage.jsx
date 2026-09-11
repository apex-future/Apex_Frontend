import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
    Book, 
    BookOpen, 
    Highlighter, 
    Note, 
    DownloadSimple, 
    ArrowRight, 
    Quotes, 
    Check, 
    Spinner, 
    WarningCircle, 
    ShieldCheck, 
    FileText,
    Sparkle,
    Lightning,
    Brain,
    House
} from '@phosphor-icons/react';
import useThemeStore from '../store/themeStore';
import db from '../db/apex.db';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Label from '../components/ui/Label';
import EmptyState from '../components/ui/EmptyState';
import BookCover from '../components/ui/BookCover';
import { isValidAuthor, cleanAuthor } from '../utils/documentMetadata';

import logoLight from '../../assets/logo/logo-light-removebg-preview.png';
import logoDark from '../../assets/logo/logo-dark-removebg-preview.png';

const SharePage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { resolvedTheme } = useThemeStore();

    const type = searchParams.get('type'); // 'book', 'highlight', 'note'
    const bookId = searchParams.get('id') || searchParams.get('bookId');
    const token = searchParams.get('token');
    const paramTitle = searchParams.get('title');
    const paramAuthor = searchParams.get('author');
    const text = searchParams.get('text');
    const note = searchParams.get('note');

    // State for book sharing
    const [bookMeta, setBookMeta] = useState(null);
    const [isLoadingMeta, setIsLoadingMeta] = useState(false);
    const [metaError, setMetaError] = useState(null);
    const [downloadState, setDownloadState] = useState('idle'); // idle | downloading | downloaded | error
    const [importState, setImportState] = useState('idle'); // idle | importing | error
    const [statusText, setStatusText] = useState('');

    const isLoggedIn = Boolean(localStorage.getItem('apex_token'));
    const apiBase = import.meta.env.VITE_API_BASE_URL || '';

    // Fetch shared book details when bookId and token are provided
    useEffect(() => {
        if (type === 'book' && bookId && token) {
            setIsLoadingMeta(true);
            setMetaError(null);
            const fetchUrl = `${apiBase}/api/books/shared/${bookId}?token=${encodeURIComponent(token)}`;
            
            fetch(fetchUrl)
                .then(async (res) => {
                    if (!res.ok) {
                        const data = await res.json().catch(() => ({}));
                        throw new Error(data.detail || `Server responded with ${res.status}`);
                    }
                    return res.json();
                })
                .then((data) => {
                    setBookMeta(data);
                    setIsLoadingMeta(false);
                })
                .catch((err) => {
                    console.warn('[Apex Share] Failed to fetch shared metadata:', err.message);
                    setMetaError(err.message);
                    setIsLoadingMeta(false);
                });
        }
    }, [type, bookId, token, apiBase]);

    // Handle physical file download
    const handleDownloadBook = async () => {
        if (!bookId || !token) return;
        try {
            setDownloadState('downloading');
            setStatusText('Connecting to secure file storage...');

            const fileApiUrl = `${apiBase}/api/books/shared/${bookId}/file?token=${encodeURIComponent(token)}`;
            const res = await fetch(fileApiUrl);
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.detail || 'Download request rejected');
            }

            const data = await res.json();
            if (!data.url) throw new Error('No download URL returned');

            setStatusText('Downloading book file...');
            const fileRes = await fetch(data.url);
            if (!fileRes.ok) throw new Error('Failed to retrieve file content');

            const blob = await fileRes.blob();
            const ext = (data.file_type === 'application/epub+zip' || (data.title || '').endsWith('.epub')) ? '.epub' : '.pdf';
            const rawTitle = data.title || paramTitle || 'Shared Book';
            const safeName = rawTitle.toLowerCase().endsWith(ext) ? rawTitle : `${rawTitle}${ext}`;

            // Trigger direct browser download
            const blobUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = safeName;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(blobUrl);
            document.body.removeChild(a);

            setDownloadState('downloaded');
            setStatusText('Download completed successfully!');
            setTimeout(() => {
                setDownloadState('idle');
                setStatusText('');
            }, 4000);
        } catch (err) {
            console.error('[Apex Share] Download failed:', err);
            setDownloadState('error');
            setStatusText(err.message || 'Download failed. Please try again.');
            setTimeout(() => {
                setDownloadState('idle');
                setStatusText('');
            }, 4000);
        }
    };

    // Handle importing book directly into recipient's Apex library
    const handleImportToApex = async () => {
        if (!bookId || !token) return;
        try {
            setImportState('importing');
            setStatusText('Downloading and saving to library...');

            const fileApiUrl = `${apiBase}/api/books/shared/${bookId}/file?token=${encodeURIComponent(token)}`;
            const res = await fetch(fileApiUrl);
            if (!res.ok) throw new Error('Failed to retrieve download link');

            const data = await res.json();
            const fileRes = await fetch(data.url);
            if (!fileRes.ok) throw new Error('Failed to download book content');

            const blob = await fileRes.blob();
            const arrayBuffer = await blob.arrayBuffer();

            const title = data.title || paramTitle || 'Shared Document';
            const fileType = data.file_type || blob.type || 'application/pdf';

            // Add to Dexie books
            const newLocalId = await db.books.add({
                title,
                author: data.author || paramAuthor || 'Unknown',
                fileType,
                fileSize: blob.size,
                fileBlob: arrayBuffer,
                coverImage: data.cover_image_url || null,
                totalPages: data.total_pages || 0,
                uploadedAt: new Date().toISOString(),
                lastReadAt: new Date().toISOString(),
                progress: 0,
                currentPage: 0,
                status: 'new',
                isLocal: true,
                metadata: { bookmarks: [], highlights: [], tabs: [] },
            });

            await db.books.update(newLocalId, { local_id: newLocalId.toString() });

            // Trigger sync if available
            import('../services/syncService').then(m => m.default.triggerSync?.()).catch(() => {});

            // Direct recipient to reader
            navigate(`/reader/${newLocalId}`);
        } catch (err) {
            console.error('[Apex Share] Import failed:', err);
            setImportState('error');
            setStatusText(err.message || 'Failed to import book to Apex.');
            setTimeout(() => {
                setImportState('idle');
                setStatusText('');
            }, 3500);
        }
    };

    // Missing type fallback
    if (!type) {
        return (
            <div className={`min-h-screen flex items-center justify-center p-4 bg-bg-primary text-text-primary ${resolvedTheme}`}>
                <div className="w-full max-w-md">
                    <EmptyState
                        icon={WarningCircle}
                        title="Invalid Share Link"
                        description="This share link is missing required parameters. Please check the URL or request a new link."
                        action={{
                            label: 'Go to Home',
                            onClick: () => navigate('/')
                        }}
                    />
                </div>
            </div>
        );
    }

    const renderContent = () => {
        if (type === 'book') {
            const displayTitle = bookMeta?.title || paramTitle || 'Untitled Book';
            const candidateAuthor = bookMeta?.author || paramAuthor;
            const validAuthor = isValidAuthor(candidateAuthor) ? cleanAuthor(candidateAuthor) : null;
            const fileType = bookMeta?.file_type || ((displayTitle.endsWith('.epub')) ? 'application/epub+zip' : 'application/pdf');
            const isEpub = fileType.includes('epub');
            const formatBadge = isEpub ? 'EPUB' : 'PDF';
            const fileSizeFormatted = bookMeta?.file_size 
                ? `${(bookMeta.file_size / (1024 * 1024)).toFixed(1)} MB` 
                : null;
            const pagesFormatted = bookMeta?.total_pages && bookMeta.total_pages > 0
                ? `${bookMeta.total_pages} pages`
                : null;

            const hasDownloadCapability = Boolean(bookId && token && !metaError);

            if (metaError) {
                return (
                    <div className="w-full max-w-lg mt-6">
                        <EmptyState
                            icon={WarningCircle}
                            title="Unable to Access Shared Book"
                            description="This share link has expired or the token is invalid. Please request an updated share link from the sender."
                            action={{
                                label: 'Go to Apex Home',
                                onClick: () => navigate('/')
                            }}
                        />
                    </div>
                );
            }

            return (
                <div className="w-full flex flex-col items-center gap-12 sm:gap-16 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Hero Book Presentation (Directly on background) */}
                    <div className="w-full flex flex-col md:flex-row gap-8 lg:gap-14 items-center md:items-start pt-2 sm:pt-6">
                            
                            {/* Left: 3D Physical Book Mockup */}
                            <div className="flex flex-col items-center flex-shrink-0">
                                <BookCover
                                    cover={bookMeta?.cover_image_url}
                                    title={displayTitle}
                                    author={validAuthor}
                                    size="lg"
                                    format={formatBadge}
                                    interactive={true}
                                />

                                {/* Security Badge */}
                                {hasDownloadCapability && (
                                    <div className="mt-3.5 flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                                        <ShieldCheck size={16} weight="fill" />
                                        <span>Verified Digital Copy</span>
                                    </div>
                                )}
                            </div>

                            {/* Right: Book Details & Action Hub */}
                            <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left min-w-0 w-full">
                                {/* Kicker */}
                                <div className="mb-2">
                                    <Label variant="neutral" size="sm" content="Shared Book Copy" />
                                </div>

                                {/* Title */}
                                <h1 className="font-display font-black text-2xl sm:text-3xl lg:text-4xl text-text-primary tracking-tight leading-tight mb-2 break-words max-w-full">
                                    {displayTitle}
                                </h1>

                                {/* Author - Only rendered when a genuine author is known */}
                                {validAuthor && (
                                    <p className="text-base text-text-secondary mb-5">
                                        by <span className="font-semibold text-text-primary">{validAuthor}</span>
                                    </p>
                                )}

                                {/* Metadata Badges */}
                                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-6">
                                    <Label variant="neutral" size="sm" content={`${formatBadge} Document`} />
                                    {pagesFormatted && <Label variant="neutral" size="sm" content={pagesFormatted} />}
                                    {fileSizeFormatted && <Label variant="neutral" size="sm" content={fileSizeFormatted} />}
                                </div>

                                {/* Recommendation Quote Box */}
                                <div className="w-full p-4 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] border border-black/5 dark:border-white/5 mb-6 text-left relative">
                                    <Quotes size={22} weight="fill" className="text-purple-500/40 mb-1" />
                                    <p className="text-sm text-text-secondary italic leading-relaxed">
                                        "I'm reading this book on Apex right now. Open it directly in Apex to read with AI study tools, or download a local copy!"
                                    </p>
                                </div>

                                {/* Action Controls */}
                                {hasDownloadCapability ? (
                                    <div className="w-full flex flex-col gap-3">
                                        <div className="w-full flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                                            {/* Primary: Open in Apex (Promoted focus) */}
                                            <div className="flex-1 w-full">
                                                {isLoggedIn ? (
                                                    <Button 
                                                        variant="primary" 
                                                        onClick={handleImportToApex}
                                                        disabled={importState === 'importing'}
                                                        className="!py-3.5 !text-sm !rounded-2xl shadow-lg shadow-purple-900/25"
                                                    >
                                                        {importState === 'importing' ? (
                                                            <>
                                                                <Spinner size={18} className="animate-spin" />
                                                                <span>Adding to Library...</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <BookOpen size={18} weight="bold" />
                                                                <span>Open in Apex Library</span>
                                                            </>
                                                        )}
                                                    </Button>
                                                ) : (
                                                    <Button 
                                                        variant="primary" 
                                                        onClick={() => navigate('/signup')}
                                                        className="!py-3.5 !text-sm !rounded-2xl shadow-lg shadow-purple-900/25"
                                                    >
                                                        <Sparkle size={18} weight="fill" />
                                                        <span>Read with AI on Apex</span>
                                                    </Button>
                                                )}
                                            </div>

                                            {/* Secondary: Download Physical Copy */}
                                            <div className="flex-1 w-full">
                                                <Button 
                                                    variant="ghost" 
                                                    onClick={handleDownloadBook}
                                                    disabled={downloadState === 'downloading'}
                                                    className="!py-3.5 !text-sm !rounded-2xl"
                                                >
                                                    {downloadState === 'downloading' ? (
                                                        <>
                                                            <Spinner size={18} className="animate-spin" />
                                                            <span>Downloading Book...</span>
                                                        </>
                                                    ) : downloadState === 'downloaded' ? (
                                                        <>
                                                            <Check size={18} weight="bold" className="text-emerald-500" />
                                                            <span>Download Complete!</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <DownloadSimple size={18} weight="bold" />
                                                            <span>Download Copy ({formatBadge})</span>
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                        </div>

                                        {statusText && (
                                            <p className={`text-xs text-center md:text-left font-medium mt-1 ${downloadState === 'error' || importState === 'error' ? 'text-red-500' : 'text-text-tertiary'}`}>
                                                {statusText}
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    <div className="w-full flex flex-col gap-3">
                                        <p className="text-xs text-amber-600 dark:text-amber-400 mb-2">
                                            Direct file download is enabled for links shared via Apex v2.2+. Ask the sender to re-share.
                                        </p>
                                        <Button variant="primary" onClick={() => navigate('/signup')} className="!py-3.5 !text-sm !rounded-2xl">
                                            <span>Get Apex Free</span>
                                            <ArrowRight size={16} weight="bold" />
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>

                    {/* Feature Strip (Why Apex) */}
                    <div className="w-full flex flex-col gap-4">
                        <div className="text-center">
                            <h3 className="font-display font-bold text-lg sm:text-xl text-text-primary">
                                Read Smarter with Apex
                            </h3>
                            <p className="text-xs sm:text-sm text-text-tertiary mt-1">
                                An intelligent reader built for deep focus, comprehension, and active recall.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <Card className="p-5 flex flex-col items-start gap-2.5">
                                <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                                    <Sparkle size={20} weight="fill" />
                                </div>
                                <h4 className="font-bold text-sm text-text-primary">AI Copilot & Explanations</h4>
                                <p className="text-xs text-text-tertiary leading-relaxed">
                                    Ask questions, explain complex ideas simply, and translate unfamiliar phrases right on the page.
                                </p>
                            </Card>

                            <Card className="p-5 flex flex-col items-start gap-2.5">
                                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                                    <Lightning size={20} weight="fill" />
                                </div>
                                <h4 className="font-bold text-sm text-text-primary">Active Recall & Flashcards</h4>
                                <p className="text-xs text-text-tertiary leading-relaxed">
                                    Turn your quotes and notes into spaced-repetition flashcards to remember what you read long-term.
                                </p>
                            </Card>

                            <Card className="p-5 flex flex-col items-start gap-2.5">
                                <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                                    <Brain size={20} weight="fill" />
                                </div>
                                <h4 className="font-bold text-sm text-text-primary">Study Quests & Streaks</h4>
                                <p className="text-xs text-text-tertiary leading-relaxed">
                                    Stay motivated with daily reading streaks, XP rewards, exam countdowns, and progress tracking.
                                </p>
                            </Card>
                        </div>
                    </div>
                </div>
            );
        }

        if (type === 'highlight') {
            return (
                <Card className="p-8 max-w-lg w-full mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-amber-300 via-orange-400 to-amber-500" />
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 rounded-xl flex items-center justify-center">
                            <Highlighter size={20} weight="fill" />
                        </div>
                        <div>
                            <Label variant="warning" size="sm" content="Highlighted Quote" />
                        </div>
                    </div>
                    
                    <div className="relative pl-6 mb-6">
                        <Quotes size={32} weight="fill" className="absolute -top-2 -left-2 text-amber-200 dark:text-amber-500/20" />
                        <p className="text-xl font-serif text-text-primary leading-relaxed relative z-10">
                            {text}
                        </p>
                    </div>

                    <Button variant="primary" onClick={() => navigate('/signup')}>
                        <span>Read on Apex</span>
                        <ArrowRight size={14} weight="bold" />
                    </Button>
                </Card>
            );
        }

        if (type === 'note') {
            return (
                <Card className="max-w-xl w-full mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-hidden">
                    <div className="p-6 bg-black/[0.02] dark:bg-white/[0.02] border-b border-black/5 dark:border-white/5">
                        <div className="flex items-center gap-2 mb-3">
                            <Highlighter size={18} className="text-text-tertiary" />
                            <span className="text-xs font-bold text-text-tertiary uppercase tracking-wider">Source Quote</span>
                        </div>
                        <p className="text-base font-serif text-text-secondary italic border-l-2 border-purple-500/40 pl-3">
                            "{text}"
                        </p>
                    </div>
                    
                    <div className="p-6">
                        <div className="flex items-center gap-2 mb-3">
                            <Note size={18} weight="fill" className="text-purple-500" />
                            <span className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">Personal Note</span>
                        </div>
                        <p className="text-lg text-text-primary leading-relaxed mb-6">
                            {note}
                        </p>

                        <Button variant="primary" onClick={() => navigate('/signup')}>
                            <span>Take Notes on Apex</span>
                            <ArrowRight size={14} weight="bold" />
                        </Button>
                    </div>
                </Card>
            );
        }

        return null;
    };

    return (
        <div className={`min-h-screen flex flex-col bg-bg-primary text-text-primary font-sans transition-colors duration-300 ${resolvedTheme}`}>
            {/* Top Navigation Bar */}
            <header className="w-full border-b border-black/5 dark:border-white/5 bg-bg-primary/80 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
                    {/* Brand / Logo */}
                    <div className="flex items-center gap-2.5 cursor-pointer select-none" onClick={() => navigate('/')}>
                        <img src={logoLight} alt="Apex Logo" className="h-7 w-auto object-contain dark:hidden" />
                        <img src={logoDark} alt="Apex Logo" className="h-7 w-auto object-contain hidden dark:block" />
                        <span className="font-display font-black text-xl tracking-tight text-text-primary">Apex</span>
                    </div>

                    {/* Right CTA */}
                    {!isLoggedIn && (
                        <div className="flex items-center gap-2.5">
                            <Button variant="ghost" fullWidth={false} onClick={() => navigate('/login')}>
                                Sign In
                            </Button>
                            <Button variant="primary" fullWidth={false} onClick={() => navigate('/signup')}>
                                Get Apex
                            </Button>
                        </div>
                    )}
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 flex flex-col items-center justify-center">
                {renderContent()}
            </main>

            {/* Footer */}
            <footer className="w-full border-t border-black/5 dark:border-white/5 py-6 text-center mt-auto">
                <p className="text-xs text-text-tertiary">
                    Shared via <span className="font-semibold text-text-secondary">Apex</span> &bull; Reach Your Apex
                </p>
            </footer>
        </div>
    );
};

export default SharePage;
