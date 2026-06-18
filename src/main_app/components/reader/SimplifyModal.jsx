import React from 'react';
import { X, Spinner, MagicWand, ArrowCounterClockwise, Sparkle } from '@phosphor-icons/react';

/**
 * SimplifyModal
 * A small centered popup that shows the simplified version of highlighted text.
 * Completely standalone — no connection to AIModal or Cleo chat.
 */
function SimplifyModal({ originalText, simplifiedText, loading, error, onRetry, onClose }) {
    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-[310] animate-in fade-in duration-200"
                onClick={onClose}
            />

            {/* Modal */}
            <div
                className="fixed z-[320] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] max-w-[92vw] animate-in fade-in zoom-in-95 duration-300"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="bg-bg-elevated border border-border-default shadow-2xl rounded-2xl overflow-hidden font-sans">
                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-4 border-b border-border-default/50">
                        <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
                                <MagicWand size={14} weight="fill" className="text-emerald-600" />
                            </div>
                            <h3 className="text-[11px] font-black text-text-tertiary uppercase tracking-[0.15em]">
                                Simplified
                            </h3>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1.5 hover:bg-bg-subtle rounded-lg transition-colors"
                        >
                            <X size={16} weight="bold" className="text-text-tertiary" />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="p-5">
                        {/* Original text — subtle quote */}
                        {originalText && (
                            <div className="mb-4 bg-bg-subtle/50 p-3 rounded-xl border border-border-default/30">
                                <p className="text-[10px] text-text-tertiary font-bold uppercase tracking-wider mb-1.5 opacity-50">
                                    Original
                                </p>
                                <p className="text-[13px] text-text-secondary leading-relaxed italic line-clamp-3">
                                    "{originalText}"
                                </p>
                            </div>
                        )}

                        {/* Loading state */}
                        {loading && (
                            <div className="flex flex-col items-center justify-center py-8 gap-3">
                                <div className="relative">
                                    <Spinner size={28} weight="bold" className="animate-spin text-emerald-500 opacity-60" />
                                    <Sparkle size={12} weight="fill" className="absolute -top-1 -right-1 text-emerald-400 animate-pulse" />
                                </div>
                                <p className="text-[11px] text-text-tertiary font-bold uppercase tracking-wider animate-pulse">
                                    Simplifying...
                                </p>
                            </div>
                        )}

                        {/* Error state */}
                        {error && !loading && (
                            <div className="flex flex-col items-center gap-3 py-6 text-center">
                                <p className="text-sm text-red-500 font-medium">
                                    Couldn't simplify this text.
                                </p>
                                {onRetry && (
                                    <button
                                        onClick={onRetry}
                                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 transition-all active:scale-95"
                                    >
                                        <ArrowCounterClockwise size={14} weight="bold" />
                                        Try Again
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Simplified result */}
                        {simplifiedText && !loading && !error && (
                            <div className="bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800/30 rounded-xl p-4 animate-in slide-in-from-bottom-2 duration-300">
                                <div className="flex items-center gap-2 mb-2.5">
                                    <Sparkle size={12} weight="fill" className="text-emerald-500" />
                                    <p className="text-[10px] text-emerald-600 font-black uppercase tracking-wider">
                                        In simpler terms
                                    </p>
                                </div>
                                <p className="text-[15px] text-text-primary leading-relaxed font-medium">
                                    {simplifiedText}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

export default SimplifyModal;
