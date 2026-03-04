import React from 'react';
import { Construction, PartyPopper } from 'lucide-react';

const FeaturePlaceholder = ({ title = "Coming Soon", message = "We're working hard to bring you this feature." }) => {
    return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center animate-in fade-in zoom-in duration-500">
            <div className="w-24 h-24 bg-accent-subtle rounded-full flex items-center justify-center mb-6 shadow-sm">
                <Construction className="w-12 h-12 text-accent-primary opacity-80" />
            </div>
            <h3 className="text-2xl font-bold text-text-primary mb-3 font-display tracking-tight">{title}</h3>
            <p className="text-text-tertiary max-w-md text-lg leading-relaxed">{message}</p>
        </div>
    );
};

export default FeaturePlaceholder;
