import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X as XIcon, Copy, Check, Link, Export } from '@phosphor-icons/react';
import useThemeStore from '../../store/themeStore';

// Platform icons as inline SVGs for reliability
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

const FacebookIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
);

const TelegramIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
    </svg>
);

const EmailIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="20" height="16" x="2" y="4" rx="2"/>
        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
    </svg>
);

const generateShareImage = async (text, title) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1080;
    const ctx = canvas.getContext('2d');

    // Draw background
    const gradient = ctx.createLinearGradient(0, 0, 1080, 1080);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(1, '#16213e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1080, 1080);

    // Draw App Name / Logo
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 60px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(title || 'Apex', 540, 150);

    // Draw text (with wrapping)
    ctx.font = '40px sans-serif';
    ctx.fillStyle = '#e0e0e0';
    
    // Simple text wrapping logic
    const wrapText = (context, text, x, y, maxWidth, lineHeight) => {
        const words = text.split(' ');
        let line = '';
        let currentY = y;

        for(let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' ';
            const metrics = context.measureText(testLine);
            const testWidth = metrics.width;
            
            if (testWidth > maxWidth && n > 0) {
                context.fillText(line, x, currentY);
                line = words[n] + ' ';
                currentY += lineHeight;
            } else {
                line = testLine;
            }
        }
        context.fillText(line, x, currentY);
    };

    wrapText(ctx, text, 540, 350, 880, 60);

    // Draw bottom branding
    ctx.font = '30px sans-serif';
    ctx.fillStyle = '#888888';
    ctx.fillText('Shared from Apex App', 540, 980);

    // Return blob
    return new Promise((resolve) => {
        canvas.toBlob((blob) => {
            resolve(blob);
        }, 'image/png');
    });
};

/**
 * ShareModal — a platform-aware share chooser.
 * 
 * Props:
 *   isOpen       – boolean
 *   onClose      – () => void
 *   shareText    – the quote / message body
 *   shareUrl     – the full /share?... link
 *   shareTitle   – short title for the share
 */
export default function ShareModal({ isOpen, onClose, shareText, shareUrl, shareTitle }) {
    const { resolvedTheme } = useThemeStore();
    const [copied, setCopied] = React.useState(false);
    const [isGenerating, setIsGenerating] = React.useState(false);
    const [shareFile, setShareFile] = React.useState(null);
    const backdropRef = useRef(null);

    // Lock body scroll while open
    useEffect(() => {
        if (isOpen) document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    // Pre-generate image to avoid async rejection on iOS Safari
    useEffect(() => {
        if (isOpen && shareText) {
            setIsGenerating(true);
            generateShareImage(shareText, shareTitle).then(blob => {
                setShareFile(new File([blob], 'apex-share.png', { type: 'image/png' }));
                setIsGenerating(false);
            }).catch(err => {
                console.error("Failed to pre-generate share image", err);
                setIsGenerating(false);
            });
        } else {
            setShareFile(null);
            setIsGenerating(false);
        }
    }, [isOpen, shareText, shareTitle]);

    if (!isOpen) return null;

    const encodedText = encodeURIComponent(shareText);
    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedTitle = encodeURIComponent(shareTitle || 'Shared from Apex');

    const platforms = [
        {
            name: 'X (Twitter)',
            icon: <TwitterXIcon />,
            color: 'bg-black dark:bg-white dark:text-black text-white',
            onClick: () => {
                window.open(`https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`, '_blank', 'width=550,height=420');
                onClose();
            }
        },
        {
            name: 'WhatsApp',
            icon: <WhatsAppIcon />,
            color: 'bg-[#25D366] text-white',
            onClick: () => {
                window.open(`https://wa.me/?text=${encodedText}%0A%0A${encodedUrl}`, '_blank');
                onClose();
            }
        },
        {
            name: 'Facebook',
            icon: <FacebookIcon />,
            color: 'bg-[#1877F2] text-white',
            onClick: () => {
                window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`, '_blank', 'width=550,height=420');
                onClose();
            }
        },
        {
            name: 'Telegram',
            icon: <TelegramIcon />,
            color: 'bg-[#0088CC] text-white',
            onClick: () => {
                window.open(`https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`, '_blank');
                onClose();
            }
        },
        {
            name: 'Email',
            icon: <EmailIcon />,
            color: 'bg-gray-500 text-white',
            onClick: () => {
                window.location.href = `mailto:?subject=${encodedTitle}&body=${encodedText}%0A%0A${encodedUrl}`;
                onClose();
            }
        },
    ];

    const handleCopyLink = () => {
        navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => {
            setCopied(false);
            onClose();
        }, 1200);
    };

    const handleNativeShare = async () => {
        if (navigator.share) {
            try {
                const textWithUrl = `${shareText}\n\n${shareUrl}`;
                if (shareFile && navigator.canShare && navigator.canShare({ files: [shareFile] })) {
                    await navigator.share({
                        title: shareTitle,
                        text: textWithUrl,
                        files: [shareFile]
                    });
                } else {
                    await navigator.share({ title: shareTitle, text: textWithUrl });
                }
            } catch (error) { 
                console.error('Share failed:', error);
            } finally {
                onClose();
            }
        }
    };

    return createPortal(
        <div className={resolvedTheme}>
            <div
                ref={backdropRef}
                className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-150"
                onClick={(e) => { if (e.target === backdropRef.current && !isGenerating) onClose(); }}
            >
                <div className="w-full max-w-md sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200 relative"
                    style={{ backgroundColor: 'rgb(var(--bg-elevated))', border: '1px solid rgb(var(--border-default))' }}
                >
                    {isGenerating && (
                        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
                            <div className="w-8 h-8 border-4 border-accent-primary border-t-transparent rounded-full animate-spin mb-3"></div>
                            <span className="text-sm font-semibold" style={{ color: 'rgb(var(--text-primary))' }}>Generating Image...</span>
                        </div>
                    )}
                    {/* Header */}
                    <div className="flex items-center justify-between px-5 pt-5 pb-3">
                        <h2 className="text-base font-bold" style={{ color: 'rgb(var(--text-primary))' }}>Share to…</h2>
                        <button onClick={onClose} disabled={isGenerating} className="p-1.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-colors">
                            <XIcon size={18} weight="bold" style={{ color: 'rgb(var(--text-tertiary))' }} />
                        </button>
                    </div>

                    {/* Preview snippet */}
                    <div className="mx-5 mb-4 p-3 rounded-xl" style={{ backgroundColor: 'rgb(var(--bg-subtle))' }}>
                        <p className="text-sm line-clamp-3 leading-relaxed" style={{ color: 'rgb(var(--text-secondary))' }}>
                            {shareText}
                        </p>
                    </div>

                    {/* Platform grid */}
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
                                <span className="text-[10px] font-semibold" style={{ color: 'rgb(var(--text-tertiary))' }}>{p.name}</span>
                            </button>
                        ))}
                    </div>

                    {/* Divider */}
                    <div className="mx-5 my-3 h-px" style={{ backgroundColor: 'rgb(var(--border-default))' }} />

                    {/* Bottom actions */}
                    <div className="px-5 pb-5 flex flex-col gap-2">
                        {/* Copy Link */}
                        <button
                            onClick={handleCopyLink}
                            disabled={isGenerating}
                            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                        >
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgb(var(--bg-subtle))' }}>
                                {copied ? <Check size={18} weight="bold" className="text-green-500" /> : <Link size={18} weight="bold" style={{ color: 'rgb(var(--text-secondary))' }} />}
                            </div>
                            <span className="text-sm font-semibold" style={{ color: copied ? 'rgb(var(--text-primary))' : 'rgb(var(--text-secondary))' }}>
                                {copied ? 'Link copied!' : 'Copy link'}
                            </span>
                        </button>

                        {/* Native share (mobile) */}
                        {typeof navigator !== 'undefined' && navigator.share && (
                            <button
                                onClick={handleNativeShare}
                                disabled={isGenerating}
                                className="flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                            >
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgb(var(--bg-subtle))' }}>
                                    <Export size={18} weight="bold" style={{ color: 'rgb(var(--text-secondary))' }} />
                                </div>
                                <span className="text-sm font-semibold" style={{ color: 'rgb(var(--text-secondary))' }}>
                                    More options…
                                </span>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}

