
import React, { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw, Loader2 } from 'lucide-react';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Configure worker for Vite
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

const PDFReader = ({ fileUrl, initialPage = 1, onPageChange }) => {
    const [numPages, setNumPages] = useState(null);
    const [pageNumber, setPageNumber] = useState(initialPage);
    const [scale, setScale] = useState(1.0);
    const [rotation, setRotation] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setPageNumber(initialPage);
    }, [initialPage]);

    function onDocumentLoadSuccess({ numPages }) {
        setNumPages(numPages);
        setIsLoading(false);
        onPageChange?.(pageNumber, numPages); // Notify parent of initial state if needed
    }

    function onDocumentLoadError(error) {
        console.error('Error loading PDF:', error);
        setIsLoading(false);
    }

    function changePage(offset) {
        setPageNumber(prevPageNumber => {
            const newPage = Math.min(Math.max(1, prevPageNumber + offset), numPages || 1);
            onPageChange?.(newPage, numPages);
            return newPage;
        });
    }

    function previousPage() {
        changePage(-1);
    }

    function nextPage() {
        changePage(1);
    }

    function zoomIn() {
        setScale(prev => Math.min(prev + 0.1, 2.5));
    }

    function zoomOut() {
        setScale(prev => Math.max(prev - 0.1, 0.5));
    }

    function rotate() {
        setRotation(prev => (prev + 90) % 360);
    }

    return (
        <div className="flex flex-col h-full w-full bg-gray-100/50 rounded-3xl overflow-hidden shadow-inner border border-white/20 backdrop-blur-sm">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 py-2 bg-white/80 border-b border-gray-200/50 backdrop-blur-md sticky top-0 z-10">
                <div className="flex items-center gap-2">
                    <button 
                        onClick={previousPage} 
                        disabled={pageNumber <= 1}
                        className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                        title="Previous Page"
                    >
                        <ChevronLeft size={20} className="text-gray-700" />
                    </button>
                    <span className="text-xs font-sans font-bold text-gray-600 tabular-nums">
                        {pageNumber} / {numPages || '--'}
                    </span>
                    <button 
                        onClick={nextPage} 
                        disabled={pageNumber >= numPages}
                        className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                        title="Next Page"
                    >
                        <ChevronRight size={20} className="text-gray-700" />
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
                        <button onClick={zoomOut} className="p-1.5 rounded-md hover:bg-white shadow-sm transition-all" title="Zoom Out">
                            <ZoomOut size={16} className="text-gray-600" />
                        </button>
                        <span className="text-[10px] font-bold text-gray-500 w-12 text-center tabular-nums">
                            {Math.round(scale * 100)}%
                        </span>
                        <button onClick={zoomIn} className="p-1.5 rounded-md hover:bg-white shadow-sm transition-all" title="Zoom In">
                            <ZoomIn size={16} className="text-gray-600" />
                        </button>
                    </div>
                    <button onClick={rotate} className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors" title="Rotate">
                        <RotateCw size={18} />
                    </button>
                </div>
            </div>

            {/* Document Container */}
            <div className="flex-1 overflow-auto flex justify-center p-4 relative" id="pdf-container">
                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center z-0">
                        <Loader2 className="w-8 h-8 animate-spin text-accent-primary opacity-50" />
                    </div>
                )}
                
                <Document
                    file={fileUrl}
                    onLoadSuccess={onDocumentLoadSuccess}
                    onLoadError={onDocumentLoadError}
                    loading={
                        <div className="flex items-center justify-center h-full w-full">
                           <Loader2 className="w-8 h-8 animate-spin text-accent-primary" />
                        </div>
                    }
                    className="flex flex-col items-center"
                >
                    <div className="shadow-2xl rounded-sm overflow-hidden transition-transform duration-200 ease-out" style={{ transform: `scale(${scale})`, transformOrigin: 'top center' }}>
                        <Page 
                            pageNumber={pageNumber} 
                            rotate={rotation}
                            scale={1} // We use CSS transform for smoother scaling, or we can use prop
                            renderTextLayer={true}
                            renderAnnotationLayer={true}
                            className="bg-white"
                            width={window.innerWidth > 800 ? 800 : window.innerWidth - 40} // Responsive width estimate
                        />
                    </div>
                </Document>
            </div>
        </div>
    );
};

export default PDFReader;
