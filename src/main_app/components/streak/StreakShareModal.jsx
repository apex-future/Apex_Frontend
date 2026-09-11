import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
    X as XIcon, 
    DownloadSimple, 
    Check, 
    Export, 
    EnvelopeSimple
} from '@phosphor-icons/react';
import * as htmlToImage from 'html-to-image';
import html2canvas from 'html2canvas';
import useThemeStore from '../../store/themeStore';
import { showToastGlobal } from '../../hooks/useToast';
import logoLight from '../../../assets/logo/logo-light-removebg-preview.png';

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

/**
 * Custom vector Flame Icon matching the user reference graphic
 */
const StreakFlameSvg = ({ width = 180, height = 210, className = '' }) => {
    const idSuffix = React.useId().replace(/:/g, '');
    const gradId = `flameGrad_${idSuffix}`;

    return (
        <svg 
            width={width} 
            height={height} 
            viewBox="0 0 240 260" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <defs>
                <linearGradient id={gradId} x1="0.5" y1="0.05" x2="0.5" y2="0.95">
                    <stop offset="0%" stopColor="#ff382e" />
                    <stop offset="45%" stopColor="#ff5926" />
                    <stop offset="100%" stopColor="#ffa000" />
                </linearGradient>
            </defs>
            {/* Soft warm shadow pedestal */}
            <ellipse cx="120" cy="235" rx="56" ry="16" fill="#fdeca6" />
            
            {/* Outer Yellow Flame Body */}
            <path 
                d="M120 226
                   C75 226 50 190 48 150
                   C46 122 56 100 58 72
                   C58 67 63 65 67 68
                   C78 78 88 84 100 80
                   C110 76 121 34 128 24
                   C131 20 137 23 137 28
                   C141 55 160 84 178 108
                   C192 126 194 152 192 165
                   C188 202 165 226 120 226 Z" 
                fill="#ffc700" 
                stroke="#ffc700" 
                strokeWidth="14" 
                strokeLinejoin="round" 
                strokeLinecap="round"
            />

            {/* Inner Red-Orange Gradient Flame Body */}
            <path 
                d="M120 216
                   C82 216 62 184 60 152
                   C58 128 66 110 68 86
                   C78 95 87 100 99 96
                   C108 92 118 52 126 42
                   C132 66 148 93 164 116
                   C176 132 178 154 176 165
                   C172 196 154 216 120 216 Z" 
                fill={`url(#${gradId})`} 
                stroke={`url(#${gradId})`} 
                strokeWidth="8" 
                strokeLinejoin="round" 
                strokeLinecap="round"
            />

            {/* Teardrop Cutout (White) */}
            <path 
                d="M120 134 
                   C120 134 100 160 100 176 
                   C100 188 109 198 120 198 
                   C131 198 140 188 140 176 
                   C140 160 120 134 120 134 Z" 
                fill="#ffffff" 
            />
        </svg>
    );
};

// Formatter to combine user full name with @ prefix, joining without underscores
const formatUserHandle = (user) => {
    if (user?.full_name && user.full_name.trim()) {
        const cleaned = user.full_name.trim().replace(/\s+/g, '').toUpperCase();
        return `@${cleaned}`;
    }
    if (user?.username && user.username.trim()) {
        return `@${user.username.trim().replace(/\s+/g, '').toUpperCase()}`;
    }
    if (user?.email) {
        const prefix = user.email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
        return `@${prefix}`;
    }
    return '@APEXREADER';
};

/**
 * StreakShareModal
 * 
 * Props:
 *   isOpen      – boolean
 *   onClose     – () => void
 *   streakCount – number
 *   user        – { full_name, username, email, ... }
 */
export default function StreakShareModal({ isOpen, onClose, streakCount = 1, user = null }) {
    const { resolvedTheme } = useThemeStore();
    const backdropRef = useRef(null);
    const offscreenContainerRef = useRef(null);

    const [isGenerating, setIsGenerating] = useState(false);
    const [generatingStatus, setGeneratingStatus] = useState('');

    const userHandle = formatUserHandle(user);
    const formattedDate = new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });

    // Lock body scroll while open
    useEffect(() => {
        if (isOpen) document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    if (!isOpen) return null;

    // Follow-up share message inviting others to read on Apex
    const apexUrl = window.location.origin;
    const shareMessage = `I'm on a ${streakCount}-day reading streak on Apex! 🔥 Build your daily reading habit and read with me on Apex: ${apexUrl}`;

    // Uniform 9:16 (1080 x 1920) configuration matching modern mobile standards & Duolingo reference
    const cardConfig = {
        width: 1080,
        height: 1920, // 9:16 Fullscreen Vertical
        padding: '120px 84px',
        logoHeight: '56px',
        logoTextSize: '36px',
        flameWidth: 500,
        flameHeight: 570,
        numberFontSize: '270px',
        labelFontSize: '72px',
        footerFontSize: '32px',
    };

    // Capture the off-screen high-res card element as a PNG blob
    const generateCardBlob = async () => {
        const el = offscreenContainerRef.current;
        if (!el) return null;

        try {
            const blob = await htmlToImage.toBlob(el, {
                width: cardConfig.width,
                height: cardConfig.height,
                pixelRatio: 1, // Already sized to 1080px native dimensions
                cacheBust: true,
                backgroundColor: '#ffffff',
            });
            if (blob) return blob;
        } catch (err) {
            console.warn('[Apex Share] html-to-image failed, trying html2canvas:', err);
        }

        try {
            const canvas = await html2canvas(el, {
                width: cardConfig.width,
                height: cardConfig.height,
                scale: 1,
                useCORS: true,
                backgroundColor: '#ffffff',
            });
            return await new Promise((res) => canvas.toBlob(res, 'image/png'));
        } catch (err) {
            console.error('[Apex Share] Streak card rendering failed:', err);
            return null;
        }
    };

    // Download Card (Uniform 9:16)
    const handleDownload = async () => {
        setIsGenerating(true);
        setGeneratingStatus('Rendering streak card...');
        try {
            const blob = await generateCardBlob();
            if (!blob) throw new Error('Could not render streak card image');

            // Copy invite text and link to clipboard
            await navigator.clipboard.writeText(shareMessage).catch(() => {});

            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `apex-streak-${streakCount}-days.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            showToastGlobal('Card downloaded & invite link copied!', 'success');
            onClose();
        } catch (err) {
            console.error('Download streak card failed:', err);
            showToastGlobal('Failed to generate streak card image', 'error');
        } finally {
            setIsGenerating(false);
            setGeneratingStatus('');
        }
    };

    // Handle Quick Platform Share
    const handlePlatformShare = async (platform) => {
        setIsGenerating(true);
        setGeneratingStatus(`Preparing ${platform === 'whatsapp' ? 'WhatsApp' : platform === 'instagram' ? 'Instagram' : 'share'} card...`);

        try {
            const blob = await generateCardBlob();
            // Copy caption & invite link to clipboard so it's guaranteed to be available
            await navigator.clipboard.writeText(shareMessage).catch(() => {});

            if (platform === 'whatsapp') {
                // Check if mobile native share with files is supported
                if (navigator.share && blob) {
                    const file = new File([blob], `apex-streak-${streakCount}-days.png`, { type: 'image/png' });
                    if (navigator.canShare && navigator.canShare({ files: [file] })) {
                        try {
                            await navigator.share({
                                title: `${streakCount} Day Streak on Apex`,
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

                // Fallback for desktop / web WhatsApp:
                if (blob) {
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `apex-streak-whatsapp.png`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                }

                window.open(`https://wa.me/?text=${encodeURIComponent(shareMessage)}`, '_blank');
                showToastGlobal('Card downloaded & message copied to WhatsApp!', 'success');
                onClose();
            } else if (platform === 'instagram') {
                // On mobile: Web Share sheet lets user send image directly to Instagram Stories / Feed
                if (navigator.share && blob) {
                    const file = new File([blob], `apex-streak-${streakCount}-days.png`, { type: 'image/png' });
                    if (navigator.canShare && navigator.canShare({ files: [file] })) {
                        try {
                            await navigator.share({
                                title: `${streakCount} Day Streak on Apex`,
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

                // Fallback: download Instagram Story (9:16) image and copy caption
                if (blob) {
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `apex-streak-instagram.png`;
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
                window.open(`https://t.me/share/url?url=${encodeURIComponent(apexUrl)}&text=${encodeURIComponent(shareMessage)}`, '_blank');
                onClose();
            } else if (platform === 'email') {
                window.location.href = `mailto:?subject=${encodeURIComponent(`I'm on a ${streakCount}-day reading streak on Apex!`)}&body=${encodeURIComponent(shareMessage)}`;
                onClose();
            }
        } catch (err) {
            console.error('Platform streak share failed:', err);
            showToastGlobal('Failed to prepare streak card', 'error');
        } finally {
            setIsGenerating(false);
            setGeneratingStatus('');
        }
    };

    // Native Web Share API
    const handleNativeShare = async () => {
        if (!navigator.share) return;
        setIsGenerating(true);
        setGeneratingStatus('Preparing streak card...');
        try {
            const blob = await generateCardBlob();
            await navigator.clipboard.writeText(shareMessage).catch(() => {});

            const shareData = {
                title: `${streakCount} Day Streak on Apex`,
                text: shareMessage,
            };

            if (blob && navigator.canShare) {
                const file = new File([blob], `apex-streak-${streakCount}-days.png`, { type: 'image/png' });
                if (navigator.canShare({ files: [file] })) {
                    shareData.files = [file];
                }
            }

            await navigator.share(shareData);
            onClose();
        } catch (err) {
            if (err.name !== 'AbortError') {
                console.error('Native streak share failed:', err);
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
            {/* ── SHARE MODAL UI ── */}
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
                            <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                            <span className="text-sm font-semibold text-white">{generatingStatus || 'Preparing streak card...'}</span>
                        </div>
                    )}

                    {/* Header */}
                    <div className="flex items-center justify-between px-5 pt-5 pb-3">
                        <h2 className="text-base font-bold text-text-primary">Share Streak to…</h2>
                        <button 
                            onClick={onClose} 
                            disabled={isGenerating} 
                            className="p-1.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-colors"
                        >
                            <XIcon size={18} weight="bold" className="text-text-tertiary" />
                        </button>
                    </div>

                    {/* Mini Streak Card Preview */}
                    <div className="mx-5 mb-4 p-5 rounded-2xl bg-white dark:bg-white border border-border-default shadow-sm flex flex-col items-center justify-center text-center">
                        <div className="w-full flex items-center justify-between mb-2">
                            <div className="flex items-center gap-1.5">
                                <img src={logoLight} alt="Apex" className="h-4 w-auto object-contain mix-blend-multiply" />
                                <span className="text-xs font-bold text-slate-700">Apex</span>
                            </div>
                        </div>
                        <StreakFlameSvg width={88} height={100} className="my-1.5" />
                        <span className="text-4xl sm:text-5xl font-black text-[#ff6438] leading-none my-1 tabular-nums tracking-tight">
                            {streakCount}
                        </span>
                        <span className="text-sm font-black text-[#ff6438] tracking-tight">
                            day streak
                        </span>
                        <div className="w-full flex items-center justify-between mt-4 pt-2.5 border-t border-slate-100 text-[11px] font-bold text-slate-500">
                            <span>{userHandle}</span>
                            <span>{formattedDate}</span>
                        </div>
                    </div>

                    {/* Platform Grid (5 quick targets) */}
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
                            onClick={handleDownload}
                            disabled={isGenerating}
                            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-colors hover:bg-black/5 dark:hover:bg-white/5 group"
                        >
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-bg-subtle text-text-primary group-hover:bg-orange-500 group-hover:text-white transition-colors">
                                <DownloadSimple size={18} weight="bold" />
                            </div>
                            <div className="flex flex-col text-left">
                                <span className="text-sm font-semibold text-text-primary">Download Card</span>
                                <span className="text-[11px] text-text-tertiary">Save high-res streak card (9:16)</span>
                            </div>
                        </button>

                        {/* Native Share (mobile) */}
                        {typeof navigator !== 'undefined' && navigator.share && (
                            <button
                                onClick={handleNativeShare}
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
            {/* Renders the pristine, export-grade card in exact target dimensions without modal DOM artifacts */}
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
                        width: `${cardConfig.width}px`,
                        height: `${cardConfig.height}px`,
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        padding: cardConfig.padding,
                        boxSizing: 'border-box',
                        backgroundColor: '#ffffff',
                        background: '#ffffff',
                        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    }}
                >
                    {/* Top Left: Apex Logo + sleek "Apex" title */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <img
                            src={logoLight}
                            alt="Apex"
                            style={{ 
                                height: cardConfig.logoHeight, 
                                width: 'auto', 
                                objectFit: 'contain',
                                mixBlendMode: 'multiply',
                            }}
                        />
                        <span
                            style={{
                                fontSize: cardConfig.logoTextSize,
                                fontWeight: 700,
                                color: '#334155',
                                letterSpacing: '-0.01em',
                            }}
                        >
                            Apex
                        </span>
                    </div>

                    {/* Center Section: Flame + Number + "day streak" */}
                    <div 
                        style={{ 
                            flex: 1, 
                            display: 'flex', 
                            flexDirection: 'column', 
                            justifyContent: 'center',
                            alignItems: 'center',
                            textAlign: 'center',
                        }}
                    >
                        {/* Flame Icon */}
                        <StreakFlameSvg 
                            width={cardConfig.flameWidth} 
                            height={cardConfig.flameHeight} 
                        />

                        {/* Huge Streak Number */}
                        <div
                            style={{
                                fontSize: cardConfig.numberFontSize,
                                fontWeight: 900,
                                color: '#ff6438',
                                lineHeight: 1.05,
                                marginTop: '16px',
                                letterSpacing: '-0.03em',
                                fontVariantNumeric: 'tabular-nums',
                            }}
                        >
                            {streakCount}
                        </div>

                        {/* "day streak" label */}
                        <div
                            style={{
                                fontSize: cardConfig.labelFontSize,
                                fontWeight: 800,
                                color: '#ff6438',
                                marginTop: '8px',
                                letterSpacing: '-0.01em',
                            }}
                        >
                            day streak
                        </div>
                    </div>

                    {/* Bottom Row: User Handle (Left) and Date (Right) */}
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            width: '100%',
                            fontSize: cardConfig.footerFontSize,
                            fontWeight: 800,
                            color: '#475569',
                            letterSpacing: '0.04em',
                            paddingBottom: '8px',
                        }}
                    >
                        <span>{userHandle}</span>
                        <span>{formattedDate}</span>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}
