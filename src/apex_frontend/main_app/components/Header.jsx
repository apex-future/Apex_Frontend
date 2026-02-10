import React from 'react'
import { BookOpen } from 'lucide-react';
import physics from "../../../assets/book_covers/physics.jpeg";

export default function Header() {
    const user = { name: "User" };
    const currentBook = {
        title: "Advanced Physics for Schools",
        progress: 67,
        currentPage: 134,
        totalPages: 200,
    };

    return (
        <div className="bg-bg-elevated border-b border-border-default">
            <div className=" w-full px-3">
                
                {/* Welcome */}
                <h1 className="font-display text-3xl font-bold text-text-primary mb-6">
                    Hey, {user.name} 
                </h1>

                {/* Continue Reading Card */}
                <div className="bg-gradient-to-br from-accent-primary/5 to-accent-subtle/30 rounded-2xl p-2 border border-accent-primary/20">
                    <div className="flex gap-3">
                        
                        {/* Book Cover */}
                        <div className="w-32 h-44 rounded-lg overflow-hidden shadow-lg flex-shrink-0">
                            <img src={physics} alt="Book cover" className="w-full h-full object-cover" />
                        </div>

                        {/* Info */}
                        <div className="flex-1">
                            <p className="text-xs text-text-tertiary font-medium mb-1">CONTINUE READING</p>
                            <h2 className="font-display text-2xl font-bold text-text-primary mb-3">
                                {currentBook.title}
                            </h2>
                            
                            {/* Progress */}
                            <div className="mb-4">
                                <div className="flex justify-between mb-2">
                                    <span className="text-sm text-text-secondary">
                                        Page {currentBook.currentPage} of {currentBook.totalPages}
                                    </span>
                                    <span className="text-sm font-semibold text-accent-primary">
                                        {currentBook.progress}%
                                    </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div 
                                        className="bg-accent-primary h-2 rounded-full"
                                        style={{ width: `${currentBook.progress}%` }}
                                    />
                                </div>
                            </div>

                            {/* Button */}
                            <button className="bg-accent-primary hover:bg-accent-hover text-white font-semibold py-3 px-2 w-full rounded-full ">
                                
                                Continue Reading
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    )
}
