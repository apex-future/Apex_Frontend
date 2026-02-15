import React from 'react'
import BookCover from '../books/BookCover';
import { useNavigate } from 'react-router-dom';

export default function Header({ activeTab = 'All', setActiveTab = () => { }, lastReadBook }) {
    const user = { name: "User" };
    const navigate = useNavigate();

    const currentBook = lastReadBook || {
        title: "Welcome to Apex!",
        author: "Start your first book",
        progress: 0,
        currentPage: 0,
        totalPages: 0,
        cover: null
    };

    const tabs = ['All', 'Completed', 'Uncompleted', 'New'];

    return (
        <div className="">
            <div className="w-full px-3">
                <div className="welcome-message mb-6">
                    <h1 className="font-display text-3xl font-bold text-text-primary mb-1">
                        Hey, {user.name}
                    </h1>
                    <p>What's your pick today?</p>
                </div>

                <h2 className='text-xl p-2 font-medium'>Last Read</h2>
                <div
                    onClick={() => lastReadBook && navigate(`/reader/${lastReadBook.id}`)}
                    className={`bg-gradient-to-br from-accent-primary/5 to-accent-subtle/30 rounded-2xl p-2 md:p-4 border border-accent-primary/20 backdrop-blur-md ${lastReadBook ? 'cursor-pointer hover:bg-accent-primary/10 transition-colors' : ''}`}
                >
                    <div className="flex gap-3 md:gap-5">
                        <div className="w-30 h-40 xs:w-32 xs:h-44 rounded-lg overflow-hidden shadow-lg flex-shrink-0 bg-white">
                            {currentBook.cover ? (
                                <img src={currentBook.cover} alt="Book cover" className="w-full h-full object-cover" />
                            ) : (
                                <BookCover title={currentBook.title} author={currentBook.author} className="w-full h-full" />
                            )}
                        </div>

                        <div className="flex-1 flex flex-col justify-between">
                            <div className="mb-3">
                                <h2 className="font-display text-xl xs:text-2xl sm:text-3xl font-bold text-text-primary mb-1 line-clamp-2">
                                    {currentBook.title}
                                </h2>
                                <p className="text-sm text-black/50 line-clamp-1">by {currentBook.author}</p>
                            </div>

                            <div className="mb-4">
                                <div className="flex justify-between mb-2">
                                    <span className="text-sm text-text-secondary">
                                        {currentBook.progress > 0 ? `Page ${currentBook.currentPage || '?'} of ${currentBook.totalPages || '?'}` : 'Not started'}
                                    </span>
                                    <span className="text-sm font-semibold text-accent-primary">
                                        {currentBook.progress}%
                                    </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-1">
                                    <div
                                        className="bg-accent-primary h-1 rounded-full transition-all duration-500"
                                        style={{ width: `${currentBook.progress}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <nav className="flex">
                        <ul className="flex flex-row gap-10 sm:gap-8 lg:gap-10 my-5 font-medium whitespace-nowrap">
                            {tabs.map((tab) => (
                                <li key={tab}
                                    className={`relative group cursor-pointer ${activeTab === tab ? 'text-indigo-600' : ''}`}
                                    onClick={() => setActiveTab(tab)}
                                >
                                    <a href="#" className="group-hover:text-indigo-600 transition-colors duration-300" onClick={(e) => e.preventDefault()}>
                                        {tab}
                                    </a>
                                    <span className={`absolute bottom-[-4px] left-0 h-0.5 bg-indigo-600 transition-all duration-300 ${activeTab === tab ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
                                </li>
                            ))}
                        </ul>
                    </nav>
                </div>
            </div>
        </div>
    )
}
