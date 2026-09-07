import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
    X as XIcon, 
    DownloadSimple, 
    Check, 
    Export, 
    Quotes,
    Sparkle,
    EnvelopeSimple
} from '@phosphor-icons/react';
import * as htmlToImage from 'html-to-image';
import html2canvas from 'html2canvas';
import useThemeStore from '../../../../store/themeStore';
import apiClient from '../../../../services/apiClient';
import { isValidAuthor } from '../../../../utils/documentMetadata';
import { showToastGlobal } from '../../../../hooks/useToast';
import logoLight from '../../../../../assets/logo/logo-light-removebg-preview.png';

// Platform icons as inline SVGs for maximum reliability
const TwitterXIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
);

const WhatsAppIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
);

const InstagramIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
    </svg>
);

const TelegramIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
    </svg>
);

// Gradient for Tab Share cards (elegant soft violet/slate tone to pure solid white)
const tabCardGradient = {
    background: 'linear-gradient(145deg, #ede9fe 0%, #f5f3ff 38%, #ffffff 100%)',
    backgroundColor: '#ffffff',
};

/**
 * TabShareModal
 * 
 * Props:
 *   isOpen – boolean
 *   onClose – () => void
 *   tab    – { id, text, context, type, pageNumber }
 *   book   – { id, title, author, supabaseId }
 */
export default function TabShareModal({ isOpen, onClose, tab, book }) {
    const { resolvedTheme } = useThemeStore();
    const backdropRef = useRef(null);
    const offscreenContainerRef = useRef(null);

    const [isGenerating, setIsGenerating] = useState(false);
    const [generatingStatus, setGeneratingStatus] = useState('');
    const [bookShareUrl, setBookShareUrl] = useState('');
    const [activeTargetFormat, setActiveTargetFormat] = useState('standard');

    const tabText = tab?.text || '';
    const tabContext = tab?.context || '';
    const pageNumber = tab?.pageNumber || null;
    const bookTitle = book?.title || 'Unknown Title';
    const bookAuthor = isValidAuthor(book?.author) ? book.author : '';

    // Lock body scroll while open
    useEffect(() => {
        if (isOpen) document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    // Resolve book share URL with download token
    useEffect(() => {
        if (!isOpen || !book) return;

        let active = true;
        const resolveShareUrl = async () => {
            let cloudId = book.supabaseId;
            const validAuthor = isValidAuthor(book.author) ? book.author : '';
            const authorParam = validAuthor ? `&author=${encodeURIComponent(validAuthor)}` : '';

            if (cloudId && navigator.onLine) {
                try {
                    const res = await apiClient.post(`/api/books/${cloudId}/share`);
                    const token = res.data?.share_token;
                    if (token && active) {
                        setBookShareUrl(`${window.location.origin}/share?type=book&id=${cloudId}&token=${token}&title=${encodeURIComponent(book.title || '')}${authorParam}`);
                        return;
                    }
                } catch (err) {
                    console.warn('[Apex Share] Failed to get share token:', err);
                }
            }

            if (active) {
                const fallbackUrl = `${window.location.origin}/share?type=book&title=${encodeURIComponent(book.title || '')}${authorParam}${cloudId ? `&id=${cloudId}` : ''}`;
                setBookShareUrl(fallbackUrl);
            }
        };

        resolveShareUrl();
        return () => { active = false; };
    }, [isOpen, book]);

    if (!isOpen || !tab) return null;

    // Generated caption text without tab text:
    // "My thoughts on this from {bookTitle}. Here is the book you can read on Apex: {bookShareUrl}"
    const finalShareUrl = bookShareUrl || window.location.origin;
    const shareMessage = bookTitle && bookTitle !== 'Unknown Title'
        ? `My thoughts on this from "${bookTitle}". Here is the book you can read on Apex: ${finalShareUrl}`
        : `My thoughts on this. Here is the book you can read on Apex: ${finalShareUrl}`;

    // Dimensions config for off-screen export (1080px base full-bleed)
    const formatConfigs = {
        standard: {
            width: 1080,
            height: 1350, // 4:5
            padding: '84px 80px',
            logoHeight: '48px',
            logoTextSize: '32px',
            contextFontSize: '32px',
            thoughtFontSize: tabText.length > 200 ? '36px' : tabText.length > 100 ? '42px' : '50px',
            footerPaddingTop: '32px',
            titleFontSize: '36px',
            metaFontSize: '24px',
        },
        whatsapp: {
            width: 1080,
            height: 1920, // 9:16
            padding: '110px 84px',
            logoHeight: '52px',
            logoTextSize: '34px',
            contextFontSize: '34px',
            thoughtFontSize: tabText.length > 200 ? '40px' : tabText.length > 100 ? '46px' : '56px',
            footerPaddingTop: '36px',
            titleFontSize: '38px',
            metaFontSize: '26px',
        },
        instagram: {
            width: 1080,
            height: 1080, // 1:1
            padding: '76px 72px',
            logoHeight: '44px',
            logoTextSize: '28px',
            contextFontSize: '28px',
            thoughtFontSize: tabText.length > 200 ? '32px' : tabText.length > 100 ? '38px' : '46px',
            footerPaddingTop: '26px',
            titleFontSize: '32px',
            metaFontSize: '22px',
        },
    };

    const currentConfig = formatConfigs[activeTargetFormat] || formatConfigs.standard;

    // Capture off-screen high-res card element as a PNG blob
    const generateCardBlob = async (targetFormat) => {
        setActiveTargetFormat(targetFormat);
        await new Promise((resolve) => setTimeout(resolve, 80));

        const el = offscreenContainerRef.current;
        if (!el) return null;

        const config = formatConfigs[targetFormat] || formatConfigs.standard;

        try {
            const blob = await htmlToImage.toBlob(el, {
                width: config.width,
                height: config.height,
                pixelRatio: 1,
                cacheBust: true,
                backgroundColor: '#ffffff',
            });
            if (blob) return blob;
        } catch (err) {
            console.warn('[Apex Share] html-to-image failed, trying html2canvas:', err);
        }

        try {
            const canvas = await html2canvas(el, {
                width: config.width,
                height: config.height,
                scale: 1,
                useCORS: true,
                backgroundColor: '#ffffff',
            });
            return await new Promise((res) => canvas.toBlob(res, 'image/png'));
        } catch (err) {
            console.error('[Apex Share] Card rendering failed:', err);
            return null;
        }
    };

    // Download Card
    const handleDownload = async (targetFormat = 'standard') => {
        setIsGenerating(true);
        setGeneratingStatus('Rendering card image...');
        try {
            const blob = await generateCardBlob(targetFormat);
            if (!blob) throw new Error('Could not render card image');

            await navigator.clipboard.writeText(shareMessage).catch(() => {});

            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const cleanTitle = bookTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase();
            a.download = `apex-thought-${cleanTitle}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            showToastGlobal('Card downloaded & book link copied!', 'success');
            onClose();
        } catch (err) {
            console.error('Download card failed:', err);
            showToastGlobal('Failed to generate card image', 'error');
        } finally {
            setIsGenerating(false);
            setGeneratingStatus('');
        }
    };

    // Quick Platform Share
    const handlePlatformShare = async (platform) => {
        setIsGenerating(true);
        const format = platform === 'whatsapp' ? 'whatsapp' : platform === 'instagram' ? 'instagram' : 'standard';
        setGeneratingStatus(`Preparing ${platform === 'whatsapp' ? 'WhatsApp' : platform === 'instagram' ? 'Instagram' : 'share'} card...`);

        try {
            const blob = await generateCardBlob(format);
            await navigator.clipboard.writeText(shareMessage).catch(() => {});

            if (platform === 'whatsapp') {
                if (navigator.share && blob) {
                    const file = new File([blob], `apex-thought-whatsapp.png`, { type: 'image/png' });
                    if (navigator.canShare && navigator.canShare({ files: [file] })) {
                        try {
                            await navigator.share({
                                title: `Thought on ${bookTitle}`,
                                text: shareMessage,
                                files: [file],
                            });
                            showToastGlobal('Shared successfully!', 'success');
                            onClose();
                            return;
                        } catch (e) {
                            if (e.name === 'AbortError') return;
                        }
                    }
                }

                // Desktop / web fallback
                if (blob) {
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `apex-thought-whatsapp.png`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                }

                window.open(`https://wa.me/?text=${encodeURIComponent(shareMessage)}`, '_blank');
                showToastGlobal('Card downloaded & message copied to WhatsApp!', 'success');
                onClose();
            } else if (platform === 'instagram') {
                if (navigator.share && blob) {
                    const file = new File([blob], `apex-thought-instagram.png`, { type: 'image/png' });
                    if (navigator.canShare && navigator.canShare({ files: [file] })) {
                        try {
                            await navigator.share({
                                title: `Thought on ${bookTitle}`,
                                text: shareMessage,
                                files: [file],
                            });
                            showToastGlobal('Shared successfully!', 'success');
                            onClose();
                            return;
                        } catch (e) {
                            if (e.name === 'AbortError') return;
                        }
                    }
                }

                if (blob) {
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `apex-thought-instagram.png`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                }

                showToastGlobal('Instagram card downloaded & caption copied!', 'success');
                onClose();
            } else if (platform === 'twitter') {
                window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessage)}`, '_blank', 'width=550,height=420');
                onClose();
            } else if (platform === 'telegram') {
                window.open(`https://t.me/share/url?url=${encodeURIComponent(finalShareUrl)}&text=${encodeURIComponent(shareMessage)}`, '_blank');
                onClose();
            } else if (platform === 'email') {
                window.location.href = `mailto:?subject=${encodeURIComponent(`Thought on ${bookTitle}`)}&body=${encodeURIComponent(shareMessage)}`;
                onClose();
            }
        } catch (err) {
            console.error('Platform share failed:', err);
            showToastGlobal('Failed to prepare share card', 'error');
        } finally {
            setIsGenerating(false);
            setGeneratingStatus('');
        }
    };

    // Native Web Share API
    const handleNativeShare = async (format = 'standard') => {
        if (!navigator.share) return;
        setIsGenerating(true);
        setGeneratingStatus('Preparing share card...');
        try {
            const blob = await generateCardBlob(format);
            await navigator.clipboard.writeText(shareMessage).catch(() => {});

            const shareData = {
                title: `Thought on ${bookTitle}`,
                text: shareMessage,
            };

            if (blob && navigator.canShare) {
                const file = new File([blob], `apex-thought-${format}.png`, { type: 'image/png' });
                if (navigator.canShare({ files: [file] })) {
                    shareData.files = [file];
                }
            }

            await navigator.share(shareData);
            onClose();
        } catch (err) {
            if (err.name !== 'AbortError') {
                console.error('Native share failed:', err);
            }
        } finally {
            setIsGenerating(false);
            setGeneratingStatus('');
        }
    };

    const platforms = [
        {
            name: 'WhatsApp',
            icon: <WhatsAppIcon />,
            color: 'bg-[#25D366] text-white',
            onClick: () => handlePlatformShare('whatsapp'),
        },
        {
            name: 'Instagram',
            icon: <InstagramIcon />,
            color: 'bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white',
            onClick: () => handlePlatformShare('instagram'),
        },
        {
            name: 'X',
            icon: <TwitterXIcon />,
            color: 'bg-black dark:bg-white dark:text-black text-white',
            onClick: () => handlePlatformShare('twitter'),
        },
        {
            name: 'Telegram',
            icon: <TelegramIcon />,
            color: 'bg-[#0088CC] text-white',
            onClick: () => handlePlatformShare('telegram'),
        },
        {
            name: 'Email',
            icon: <EnvelopeSimple size={20} weight="bold" />,
            color: 'bg-slate-600 text-white',
            onClick: () => handlePlatformShare('email'),
        },
    ];

    return createPortal(
        <div className={resolvedTheme}>
            {/* ── THE SHARE MODAL UI ── */}
            <div
                ref={backdropRef}
                className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-150"
                onClick={(e) => { if (e.target === backdropRef.current && !isGenerating) onClose(); }}
            >
                <div 
                    className="w-full max-w-md sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200 relative border border-border-default"
                    style={{ backgroundColor: 'rgb(var(--bg-elevated))' }}
                >
                    {/* Spinner Overlay when rendering */}
                    {isGenerating && (
                        <div className="absolute inset-0 bg-black/30 backdrop-blur-sm z-20 flex flex-col items-center justify-center">
                            <div className="w-8 h-8 border-4 border-accent-primary border-t-transparent rounded-full animate-spin mb-3"></div>
                            <span className="text-sm font-semibold text-white">{generatingStatus || 'Preparing card...'}</span>
                        </div>
                    )}

                    {/* Header */}
                    <div className="flex items-center justify-between px-5 pt-5 pb-3">
                        <div className="flex items-center gap-2">
                            <Sparkle size={16} weight="fill" className="text-accent-primary" />
                            <h2 className="text-base font-bold text-text-primary">Share Thought Card</h2>
                        </div>
                        <button 
                            onClick={onClose} 
                            disabled={isGenerating} 
                            className="p-1.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-colors"
                        >
                            <XIcon size={18} weight="bold" className="text-text-tertiary" />
                        </button>
                    </div>

                    {/* Preview Snippet */}
                    <div className="mx-5 mb-4 p-3.5 rounded-xl bg-bg-subtle flex flex-col gap-2">
                        {tabContext && (
                            <div className="border-l-2 border-accent-primary/40 pl-2.5 py-0.5">
                                <span className="text-[10px] font-bold text-accent-primary uppercase tracking-wider block">Passage</span>
                                <p className="text-xs text-text-tertiary line-clamp-2 italic font-serif leading-relaxed">
                                    "{tabContext}"
                                </p>
                            </div>
                        )}
                        <div className={tabContext ? "mt-1.5" : ""}>
                            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block mb-0.5">My Thought</span>
                            <p className="text-sm line-clamp-3 leading-relaxed text-text-primary font-medium">
                                {tabText}
                            </p>
                        </div>
                    </div>

                    {/* Platform Grid */}
                    <div className="px-5 pb-2 grid grid-cols-5 gap-3">
                        {platforms.map((p) => (
                            <button
                                key={p.name}
                                onClick={p.onClick}
                                disabled={isGenerating}
                                className="flex flex-col items-center gap-1.5 group"
                            >
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${p.color} transition-transform group-hover:scale-110 group-active:scale-95 shadow-sm`}>
                                    {p.icon}
                                </div>
                                <span className="text-[10px] font-semibold text-text-tertiary">{p.name}</span>
                            </button>
                        ))}
                    </div>

                    {/* Divider */}
                    <div className="mx-5 my-3 h-px bg-border-default" />

                    {/* Bottom Action: Download Card Button */}
                    <div className="px-5 pb-5 flex flex-col gap-2">
                        <button
                            onClick={() => handleDownload('standard')}
                            disabled={isGenerating}
                            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-colors hover:bg-black/5 dark:hover:bg-white/5 group"
                        >
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-bg-subtle text-text-primary group-hover:bg-accent-primary group-hover:text-white transition-colors">
                                <DownloadSimple size={18} weight="bold" />
                            </div>
                            <div className="flex flex-col text-left">
                                <span className="text-sm font-semibold text-text-primary">Download Card</span>
                                <span className="text-[11px] text-text-tertiary">Save high-res quote image</span>
                            </div>
                        </button>

                        {/* Native Share (mobile) */}
                        {typeof navigator !== 'undefined' && navigator.share && (
                            <button
                                onClick={() => handleNativeShare('standard')}
                                disabled={isGenerating}
                                className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                            >
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-bg-subtle text-text-secondary">
                                    <Export size={18} weight="bold" />
                                </div>
                                <span className="text-sm font-semibold text-text-secondary">
                                    More options…
                                </span>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* ── OFF-SCREEN HIGH-RES CARD RENDERER ── */}
            <div
                style={{
                    position: 'fixed',
                    left: '-9999px',
                    top: 0,
                    pointerEvents: 'none',
                    zIndex: -1,
                }}
            >
                <div
                    ref={offscreenContainerRef}
                    style={{
                        width: `${currentConfig.width}px`,
                        height: `${currentConfig.height}px`,
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        padding: currentConfig.padding,
                        boxSizing: 'border-box',
                        ...tabCardGradient,
                    }}
                >
                    {/* Top Row: Apex Logo + sleek "Apex" */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <img
                            src={logoLight}
                            alt="Apex"
                            style={{ 
                                height: currentConfig.logoHeight, 
                                width: 'auto', 
                                objectFit: 'contain',
                                mixBlendMode: 'multiply',
                            }}
                        />
                        <span
                            style={{
                                fontSize: currentConfig.logoTextSize,
                                fontWeight: 600,
                                color: '#334155',
                                fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                                letterSpacing: '-0.01em',
                            }}
                        >
                            Apex
                        </span>
                    </div>

                    {/* Center Section: Linked Context (if any) + User's Thought underneath */}
                    <div 
                        style={{ 
                            flex: 1, 
                            display: 'flex', 
                            flexDirection: 'column', 
                            justifyContent: 'center',
                            gap: '32px',
                            margin: '36px 0',
                            overflow: 'hidden',
                        }}
                    >
                        {/* Linked highlighted text on a distinguished background */}
                        {tabContext && (
                            <div
                                style={{
                                    backgroundColor: 'rgba(255, 255, 255, 0.75)',
                                    border: '1px solid rgba(99, 102, 241, 0.18)',
                                    borderLeft: '6px solid #6366f1',
                                    borderRadius: '24px',
                                    padding: '28px 34px',
                                    boxShadow: '0 4px 20px -2px rgba(99, 102, 241, 0.08)',
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                    <Quotes size={24} weight="fill" style={{ color: '#6366f1', opacity: 0.6 }} />
                                    <span style={{ 
                                        fontSize: '20px', 
                                        fontWeight: 800, 
                                        textTransform: 'uppercase', 
                                        letterSpacing: '0.12em', 
                                        color: '#6366f1' 
                                    }}>
                                        Passage from Book
                                    </span>
                                </div>
                                <p
                                    style={{
                                        fontFamily: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif',
                                        fontStyle: 'italic',
                                        color: '#334155',
                                        lineHeight: 1.5,
                                        fontSize: currentConfig.contextFontSize,
                                        margin: 0,
                                    }}
                                >
                                    "{tabContext}"
                                </p>
                            </div>
                        )}

                        {/* User's written thought */}
                        <div 
                            style={{ 
                                display: 'flex', 
                                flexDirection: 'column', 
                                gap: '14px',
                                marginTop: tabContext ? '18px' : 0,
                            }}
                        >
                            {/* Context badge showing user wrote this */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        backgroundColor: '#6366f1',
                                        color: '#ffffff',
                                        padding: '8px 18px',
                                        borderRadius: '9999px',
                                        fontSize: '20px',
                                        fontWeight: 800,
                                        letterSpacing: '0.08em',
                                        textTransform: 'uppercase',
                                    }}
                                >
                                    <Sparkle size={18} weight="fill" />
                                    <span>My Thought</span>
                                </div>
                            </div>

                            <p
                                style={{
                                    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                                    color: '#0f172a',
                                    lineHeight: 1.48,
                                    fontSize: currentConfig.thoughtFontSize,
                                    fontWeight: 600,
                                    margin: 0,
                                    whiteSpace: 'pre-wrap',
                                    wordBreak: 'break-word',
                                }}
                            >
                                {tabText}
                            </p>
                        </div>
                    </div>

                    {/* Bottom Left: Title, with Page and Author underneath */}
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            textAlign: 'left',
                            borderTop: '1px solid rgba(15, 23, 42, 0.08)',
                            paddingTop: currentConfig.footerPaddingTop,
                        }}
                    >
                        <p
                            style={{
                                fontSize: currentConfig.titleFontSize,
                                fontWeight: 700,
                                color: '#0f172a',
                                margin: 0,
                                lineHeight: 1.3,
                                fontFamily: 'system-ui, -apple-system, sans-serif',
                            }}
                        >
                            {bookTitle}
                        </p>
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                marginTop: '8px',
                                fontSize: currentConfig.metaFontSize,
                                color: '#64748b',
                                fontWeight: 500,
                                fontFamily: 'system-ui, -apple-system, sans-serif',
                            }}
                        >
                            {pageNumber > 0 && (
                                <span>Page {pageNumber}</span>
                            )}
                            {pageNumber > 0 && bookAuthor && <span>•</span>}
                            {bookAuthor && (
                                <span>{bookAuthor}</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}
