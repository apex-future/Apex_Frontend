import React from 'react'
import physics from "../../../assets/book_covers/physics.jpeg";
import Allbooks from './Allbooks';

export default function Header() {
    const user = { name: "User" };
    const currentBook = {
        title: "Advanced Physics for Schools",
        author: "Albert Einstein",
        progress: 67,
        currentPage: 134,
        totalPages: 200,
    };

    return (
        <div className=" ">
            <div className=" w-full px-3">

                {/* Welcome */}
                <div className="welcome-message mb-6">
                    <h1 className="font-display text-3xl font-bold text-text-primary mb-1">
                        Hey, {user.name}
                    </h1>
                    <p>What's your pick today?</p>
                </div>


                {/* Continue Reading Card */}
                <h2 className='text-xl p-2 font-medium'>Last Read</h2>
                <div className="bg-gradient-to-br from-accent-primary/5 to-accent-subtle/30 rounded-2xl p-2 md:p-4 border border-accent-primary/20">
                    <div className="flex gap-3 md:gap-5">

                        {/* Book Cover */}
                        <div className="w-30 h-40 xs:w-32 xs:h-44 rounded-lg overflow-hidden shadow-lg flex-shrink-0 ">
                            <img src={physics} alt="Book cover" className="w-full h-full object-cover" />
                        </div>

                        {/* Info */}
                        <div className="flex-1 flex flex-col justify-between">

                            <div className=" mb-3">
                                <h2 className="font-display text-xl xs:text-2xl sm:text-3xl font-bold text-text-primary mb-1 ">
                                    {currentBook.title}
                                </h2>
                                <p className="text-sm text-black/50">by {currentBook.author}</p>
                            </div>


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
                                <div className="w-full bg-gray-200 rounded-full h-1">
                                    <div
                                        className="bg-accent-primary h-1 rounded-full"
                                        style={{ width: `${currentBook.progress}%` }}
                                    />
                                </div>
                            </div>

                            {/* Button */}
                            {/* <button className="bg-accent-primary hover:bg-accent-hover text-white font-semibold py-3 px-2 w-full rounded-full ">
                                
                                Continue Reading
                            </button> */}
                        </div>
                    </div>
                </div>

                <div className="border-b border-gray-200 overflow-x-auto">
                    <nav className="flex">
                        <ul className="flex flex-row gap-10 sm:gap-8 lg:gap-10 my-5 font-medium whitespace-nowrap">
                            <li className="relative group cursor-pointer">
                                <a href="#" className="group-hover:text-indigo-600 transition-colors duration-300">All</a>
                                <span className="absolute bottom-[-4px] left-0 w-0 h-0.5 bg-indigo-600 transition-all duration-300 group-hover:w-full"></span>
                            </li>
                            <li className="relative group cursor-pointer">
                                <a href="#" className="group-hover:text-indigo-600 transition-colors duration-300">Completed</a>
                                <span className="absolute bottom-[-4px] left-0 w-0 h-0.5 bg-indigo-600 transition-all duration-300 group-hover:w-full"></span>
                            </li>
                            <li className="relative group cursor-pointer">
                                <a href="#" className="group-hover:text-indigo-600 transition-colors duration-300">Uncompleted</a>
                                <span className="absolute bottom-[-4px] left-0 w-0 h-0.5 bg-indigo-600 transition-all duration-300 group-hover:w-full"></span>
                            </li>
                            <li className="relative group cursor-pointer">
                                <a href="#" className="group-hover:text-indigo-600 transition-colors duration-300">New</a>
                                <span className="absolute bottom-[-4px] left-0 w-0 h-0.5 bg-indigo-600 transition-all duration-300 group-hover:w-full"></span>
                            </li>
                        </ul>
                    </nav>
                </div>
                <div className='flex-1'>
                    <Allbooks />
                </div>

            </div>
        </div>
    )
}
