import React from 'react';
import { Ghost } from '@phosphor-icons/react';

const EmptyState = ({ itemName = "items" }) => {
    return (
        <div className="flex flex-col items-center justify-center min-h-[300px] p-8 text-center animate-in fade-in duration-500">
             <div className="w-20 h-20 bg-accent-subtle dark:bg-accent-subtle-dark rounded-full flex items-center justify-center mb-4">
                <Ghost className="w-10 h-10 text-accent-primary dark:text-accent-primary-dark opacity-80" weight="fill" />
            </div>
            <p className="text-lg font-medium text-text-secondary dark:text-text-secondary-dark">No {itemName} saved</p>
            <p className="text-sm text-text-tertiary dark:text-text-tertiary-dark mt-1">Items will appear here once you create them.</p>
        </div>
    );
};

export default EmptyState;
