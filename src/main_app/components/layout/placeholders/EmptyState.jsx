import React from 'react';
import { Ghost, FileQuestion } from 'lucide-react';

const EmptyState = ({ itemName = "items" }) => {
    return (
        <div className="flex flex-col items-center justify-center min-h-[300px] p-8 text-center animate-in fade-in duration-500">
             <div className="w-20 h-20 bg-neutral-100 rounded-full flex items-center justify-center mb-4">
                <FileQuestion className="w-10 h-10 text-text-tertiary/50" />
            </div>
            <p className="text-lg font-medium text-text-secondary">No {itemName} saved</p>
            <p className="text-sm text-text-tertiary mt-1">Items will appear here once you create them.</p>
        </div>
    );
};

export default EmptyState;
