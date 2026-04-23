import React from 'react';
import { ArrowLeft, Keyboard, ZoomIn, ZoomOut, Maximize, RotateCw, Settings, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function AccessibilityPage() {
    const navigate = useNavigate();

    const shortcuts = [
        { key: 'ArrowRight / PageDown', action: 'Next Page', icon: <ArrowLeft className="rotate-180" size={20} /> },
        { key: 'ArrowLeft / PageUp', action: 'Previous Page', icon: <ArrowLeft size={20} /> },
        { key: '+ / =', action: 'Zoom In', icon: <ZoomIn size={20} /> },
        { key: '-', action: 'Zoom Out', icon: <ZoomOut size={20} /> },
        { key: '0', action: 'Reset Zoom (Fit Page)', icon: <Maximize size={20} /> },
        { key: 'R', action: 'Rotate Document', icon: <RotateCw size={20} /> },
        { key: 'F', action: 'Toggle Full Navigation', icon: <Settings size={20} /> },
        { key: 'D', action: 'Toggle Dictionary', icon: <BookOpen size={20} /> },
        { key: 'Escape', action: 'Close all Menus/Dialogs', icon: <Keyboard size={20} /> },
    ];

    return (
        <div className="min-h-screen bg-slate-50 font-sans p-8 flex flex-col items-center">
            <div className="w-full max-w-3xl flex flex-col gap-8">
                <button
                    onClick={() => navigate(-1)}
                    className="self-start p-3 bg-white rounded-xl shadow-sm border border-slate-200 text-slate-700 hover:text-accent-primary transition-all font-bold text-sm tracking-wide flex items-center gap-2 group"
                >
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    Back
                </button>

                <div className="bg-white rounded-3xl p-8 md:p-12 shadow-xl border border-slate-100 flex flex-col gap-8">
                    <div className="flex flex-col gap-4 text-center items-center">
                        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-2">
                            <Keyboard size={32} />
                        </div>
                        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">
                            Accessibility Hot Keys
                        </h1>
                        <p className="text-slate-500 text-lg leading-relaxed max-w-xl">
                            Navigate the Apex e-reader with ease. We've optimized the reading experience for users who prefer or require keyboard navigation and screen-reader friendliness.
                        </p>
                    </div>

                    <div className="flex flex-col gap-4 mt-4">
                        <h2 className="text-xl font-bold text-slate-800 border-b pb-2 mb-2">E-Reader Commands</h2>
                        {shortcuts.map((sc, i) => (
                            <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:shadow-md transition-shadow">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-white rounded-xl shadow-sm text-slate-700">
                                        {sc.icon}
                                    </div>
                                    <span className="font-bold text-slate-700 text-lg">{sc.action}</span>
                                </div>
                                <div className="flex gap-2">
                                    {sc.key.split(' / ').map((k, j) => (
                                        <div key={j} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-lg font-mono font-bold shadow-inner text-sm relative group overflow-hidden">
                                           {k}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 p-6 bg-blue-50/50 rounded-2xl border border-blue-100 text-center">
                        <h3 className="font-bold text-blue-900 mb-2">Screen Reader Compatibility</h3>
                        <p className="text-blue-800/80 leading-relaxed max-w-lg mx-auto">
                            Apex uses ARIA labels and native semantic HTML structure to ensure deep compatibility with popular screen readers like JAWS, NVDA, and VoiceOver. Documents are rendered with fully selectable, structured text layers.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AccessibilityPage;
