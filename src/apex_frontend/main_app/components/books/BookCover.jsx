import React from 'react';

const PALETTES = [
    { bg: '#F8FAFC', accent: '#6366F1', secondary: '#818CF8' }, // Indigo
    { bg: '#FFF7ED', accent: '#F97316', secondary: '#FB923C' }, // Orange
    { bg: '#F0FDFA', accent: '#14B8A6', secondary: '#2DD4BF' }, // Teal
    { bg: '#FEF2F2', accent: '#EF4444', secondary: '#F87171' }, // Red
    { bg: '#F5F3FF', accent: '#8B5CF6', secondary: '#A78BFA' }, // Violet
    { bg: '#EFF6FF', accent: '#3B82F6', secondary: '#60A5FA' }, // Blue
];

export default function BookCover({ title, author, className = "" }) {
    // Generate a semi-stable "random" index based on title
    const hashCode = (str) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        return Math.abs(hash);
    };

    const hash = hashCode(title || "Unknown");
    const palette = PALETTES[hash % PALETTES.length];

    // Abstract shape logic
    const shapes = [
        <rect key="bg" x="0" y="0" width="100" height="150" fill={palette.bg} />,
        <circle key="accent" cx="20" cy="20" r="40" fill={palette.accent} fillOpacity="0.1" />,
        <path key="path" d="M0 150 L100 50 L100 150 Z" fill={palette.secondary} fillOpacity="0.05" />,
        <rect key="line" x="10" y="120" width="80" height="2" fill={palette.accent} fillOpacity="0.3" />,
    ];

    return (
        <div className={`relative overflow-hidden bg-white select-none ${className}`}>
            <svg
                viewBox="0 0 100 150"
                className="w-full h-full"
                preserveAspectRatio="xMidYMid slice"
            >
                {shapes}
            </svg>

            {/* Overlay Text */}
            <div className="absolute inset-0 p-4 flex flex-col justify-between z-10">
                <div className="flex flex-col gap-1">
                    <span className="w-6 h-0.5 bg-accent-primary mb-2 opacity-50" />
                    <h4 className="font-display font-bold text-[10px] leading-tight text-slate-900 line-clamp-3 uppercase tracking-wider">
                        {title}
                    </h4>
                </div>
                <div className="flex flex-col gap-0.5">
                    <p className="font-sans font-bold text-[6px] text-slate-500 uppercase tracking-[0.2em] line-clamp-1">
                        {author || "Uploaded by User"}
                    </p>
                    <div className="flex items-center gap-1 opacity-20">
                        <div className="w-1 h-1 rounded-full bg-slate-900" />
                        <div className="w-8 h-[1px] bg-slate-900" />
                    </div>
                </div>
            </div>

            {/* Premium Texture Overlay */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/notebook.png')] opacity-10 pointer-events-none" />
            <div className="absolute inset-0 shadow-[inset_0_0_40px_rgba(0,0,0,0.02)] pointer-events-none" />
        </div>
    );
}
