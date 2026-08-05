import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Document, Page } from 'react-pdf';
import { gsap } from 'gsap';
import { CaretLeft, CaretRight } from '@phosphor-icons/react';

const PageStrip = ({ fileUrl, isPdf, numPages, pageNumber, goToPage, onClose }) => {
    const stripRef = useRef(null);
    const scrollContainerRef = useRef(null);
    const [visiblePages, setVisiblePages] = useState(new Set());
    const isClosingRef = useRef(false);
    const [isEditingPage, setIsEditingPage] = useState(false);
    const [pageInput, setPageInput] = useState('');
    const pageInputRef = useRef(null);

    useEffect(() => {
        if (isEditingPage && pageInputRef.current) {
            pageInputRef.current.focus();
        }
    }, [isEditingPage]);

    const handlePageSubmit = (e) => {
        if (e) e.preventDefault();
        const targetPage = parseInt(pageInput, 10);
        if (!isNaN(targetPage) && targetPage >= 1 && targetPage <= numPages) {
            goToPage(targetPage);
            handleClose();
        }
        setIsEditingPage(false);
    };

    // Entrance animation
    useEffect(() => {
        if (stripRef.current) {
            gsap.fromTo(
                stripRef.current,
                { y: '100%' },
                { 
                    y: '0%', 
                    duration: 0.6, 
                    ease: 'back.out(1.7)',
                    onComplete: () => {
                        // After animation, scroll to center current page
                        centerCurrentPage();
                    }
                }
            );
        }
    }, []);

    const handleClose = useCallback(() => {
        if (isClosingRef.current) return;
        isClosingRef.current = true;
        
        if (stripRef.current) {
            gsap.to(stripRef.current, {
                y: '100%',
                duration: 0.4,
                ease: 'power2.in',
                onComplete: onClose
            });
        } else {
            onClose();
        }
    }, [onClose]);

    const centerCurrentPage = useCallback(() => {
        if (!scrollContainerRef.current) return;
        
        const container = scrollContainerRef.current;
        const targetThumbnail = container.querySelector(`[data-page="${pageNumber}"]`);
        
        if (targetThumbnail) {
            const containerWidth = container.offsetWidth;
            const thumbnailLeft = targetThumbnail.offsetLeft;
            const thumbnailWidth = targetThumbnail.offsetWidth;
            
            // Calculate scroll position to center the thumbnail
            const scrollLeft = thumbnailLeft - (containerWidth / 2) + (thumbnailWidth / 2);
            
            container.scrollTo({
                left: scrollLeft,
                behavior: 'smooth'
            });
        }
    }, [pageNumber]);

    const scrollByChunk = useCallback((direction) => {
        if (!scrollContainerRef.current) return;
        const container = scrollContainerRef.current;
        const scrollAmount = container.offsetWidth * 0.8;
        container.scrollBy({
            left: direction === 'left' ? -scrollAmount : scrollAmount,
            behavior: 'smooth'
        });
    }, []);

    // Intersection Observer for lazy rendering
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const pageNum = parseInt(entry.target.getAttribute('data-page'), 10);
                        setVisiblePages((prev) => {
                            if (prev.has(pageNum)) return prev;
                            const next = new Set(prev);
                            next.add(pageNum);
                            return next;
                        });
                    }
                });
            },
            {
                root: scrollContainerRef.current,
                rootMargin: '200px', // Pre-load ahead
                threshold: 0.1
            }
        );

        const currentContainer = scrollContainerRef.current;
        if (currentContainer) {
            const items = currentContainer.querySelectorAll('.thumbnail-container');
            items.forEach((item) => observer.observe(item));
        }

        return () => {
            if (currentContainer) {
                const items = currentContainer.querySelectorAll('.thumbnail-container');
                items.forEach((item) => observer.unobserve(item));
            }
        };
    }, [numPages]);

    const renderThumbnail = (i) => {
        const isCurrent = i === pageNumber;
        const isVisible = visiblePages.has(i);

        return (
            <div
                key={i}
                data-page={i}
                className="thumbnail-container flex flex-col items-center flex-shrink-0 w-[100px]"
                onClick={(e) => {
                    e.stopPropagation();
                    goToPage(i);
                    handleClose();
                }}
            >
                <div 
                    className={`rounded-card overflow-hidden border-2 transition-all duration-300 w-[100px] h-[150px] flex items-center justify-center cursor-pointer ${
                        isCurrent ? 'border-accent-primary shadow-lg scale-105' : 'border-transparent hover:border-border-default bg-surface-sunken'
                    }`}
                >
                    {isPdf && fileUrl ? (
                        <>
                            {isVisible ? (
                                <Page 
                                    pageNumber={i} 
                                    width={72} 
                                    renderTextLayer={false} 
                                    renderAnnotationLayer={false}
                                    className="pointer-events-none"
                                    loading={null}
                                />
                            ) : (
                                <div className="w-[100px] h-[150px] bg-surface-sunken rounded-card" />
                            )}
                        </>
                    ) : (
                        <div className="w-[100px] h-[150px] bg-surface-sunken rounded-card flex items-center justify-center">
                            <span className="text-xl font-black text-text-tertiary">{i}</span>
                        </div>
                    )}
                </div>
                <span className={`text-sm font-bold mt-1.5 transition-colors ${
                    isCurrent ? '' : 'text-text-tertiary'
                }`}>
                    {i}
                </span>
            </div>
        );
    };

    const thumbnails = useMemo(() => {
        const result = [];
        for (let i = 1; i <= numPages; i++) {
            result.push(renderThumbnail(i));
        }
        return result;
    }, [numPages, pageNumber, visiblePages, isPdf, fileUrl]);

    return (
        <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 55 }}>
            {/* Backdrop - Invisible but catches clicks */}
            <div 
                className="absolute inset-0 z-[55] pointer-events-auto" 
                onClick={handleClose}
            />
            
            {/* Strip Panel */}
            <div
                ref={stripRef}
                className="absolute bottom-0 left-0 right-0 z-[56] pointer-events-auto bg-bg-primary rounded-t-card safe-area-pb shadow-lg border-t border-border-default"
            >
                <div className="pt-3 pb-6 px-4 max-w-7xl mx-auto relative">
                    {/* Drag handle */}
                    <div className="w-10 h-1 rounded-full bg-border-default mx-auto mb-3 opacity-50" />
                    
                    {/* Header/Label Row */}
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-text-tertiary px-2">
                            Jump to page
                        </span>
                        <div 
                            className="text-sm font-bold text-text-tertiary px-2 py-0.5 rounded-full cursor-pointer hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsEditingPage(true);
                                setPageInput(pageNumber.toString());
                            }}
                        >
                            {isEditingPage ? (
                                <form 
                                    onSubmit={handlePageSubmit}
                                    className="inline-flex items-center m-0"
                                >
                                    <span className="mr-1">Page</span>
                                    <input
                                        ref={pageInputRef}
                                        type="number"
                                        value={pageInput}
                                        onChange={(e) => setPageInput(e.target.value)}
                                        onBlur={handlePageSubmit}
                                        className="w-10 bg-transparent text-center text-text-primary outline-none border-b border-accent-primary"
                                        min={1}
                                        max={numPages}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Escape') {
                                                setIsEditingPage(false);
                                            }
                                        }}
                                    />
                                    <span className="ml-1">of {numPages}</span>
                                </form>
                            ) : (
                                <span>Page {pageNumber} of {numPages}</span>
                            )}
                        </div>
                    </div>

                    {/* NavigationArrow Buttons (Desktop Only) */}
                    <button 
                        onClick={() => scrollByChunk('left')}
                        className="hidden md:flex absolute -left-5 top-1/2 -translate-y-1/2 z-10 w-10 h-24 items-center justify-center hover:text-accent-primary rounded-full text-text-secondary transition-all"
                    >
                        <CaretLeft size={24} weight="bold" />
                    </button>
                    
                    <button 
                        onClick={() => scrollByChunk('right')}
                        className="hidden md:flex absolute -right-5 top-1/2 -translate-y-1/2 z-10 w-10 h-24 items-center justify-center hover:text-accent-primary rounded-full text-text-secondary transition-all"
                    >
                        <CaretRight size={24} weight="bold" />
                    </button>

                    {/* Thumbnail Row */}
                    <div 
                        ref={scrollContainerRef}
                        className="flex flex-row gap-3 overflow-x-auto py-3 px-2 scroll-smooth hide-scrollbar pb-4"
                    >
                        
                        {isPdf && fileUrl ? (
                            <Document file={fileUrl} loading={null}>
                                <div className="flex flex-row gap-3">
                                    {thumbnails}
                                </div>
                            </Document>
                        ) : (
                            thumbnails
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PageStrip;
