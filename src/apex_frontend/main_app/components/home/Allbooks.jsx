import atomicHabits from "../../../../assets/book_covers/Atomic-habits.jpeg";
import biology from "../../../../assets/book_covers/biology.jpeg";
import accounting from "../../../../assets/book_covers/accounts.jpeg";
import { Heart, Share2, Bookmark } from "lucide-react";

export default function Allbooks() {
    const allBooks = [
        { id: 1, title: 'Atomic Habits', author: 'James Clear', progress: 50, cover: atomicHabits, status: 'Literature' },
        { id: 2, title: 'Biology', author: 'Thomas D. Polad', progress: 75, cover: biology, status: 'Science' },
        { id: 3, title: 'Accounting', author: 'Greg Shields', progress: 25, cover: accounting, status: 'Commerce' },
    ];

    const statusStyles = {
        Literature: 'bg-white text-black border border-gray-200',
        Science: 'bg-black text-white',
        Commerce: 'bg-black text-white',
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-0 p-3 divide-y-2 divide-border-default">
            {allBooks.map((book) => (
                <div key={book.id} className="group relative flex flex-col  p-1 pt-5  transition-shadow duration-300 ">
                    {/* <div className="top-icon">
                              <button className="justify-end text-gray-400 hover:text-gray-600 transition-colors p-1 bg-transparent rounded-full hover:bg-gray-100 z-10">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1" /><circle cx="12" cy="5" r="1" /><circle cx="12" cy="19" r="1" /></svg>
                    </button>
                    </div> */}
                  
                    <div className="flex flex-row gap-4 ">
                        {/* Cover - Left Side */}
                        <div className="relative w-28 h-40 flex-shrink-0 rounded-lg overflow-hidden shadow-sm">
                            <img
                                src={book.cover}
                                alt={book.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            {/* Status Badge */}
                            <span className={`absolute top-1 left-1 text-[8px] font-semibold px-1.5 py-0.5 rounded-full capitalize ${statusStyles[book.status]}`}>
                                {book.status}
                            </span>
                        </div>

                        {/* Info - Right Side */}
                        <div className="flex-1 flex-col flex justify-between">
                            <div className="book-content flex flex-col">
                                    <h3 className="font-semibold text-xl font-display text-text-primary line-clamp-2 mb-1">{book.title}</h3>
                            <p className="text-sm text-black/50 mb-3">{book.author}</p>

                            {/* Progress Bar */}
                            <div className="w-full bg-gray-200 rounded-full h-1">
                                <div
                                    className="bg-accent-primary h-1 rounded-full transition-all duration-500"
                                    style={{ width: `${book.progress}%` }}
                                />
                            </div>
                            <p className="text-xs text-black/50 mt-1">{book.progress}% complete</p>
                            </div>
                            
                            <div className="icon">
                                <div className="flex justify-end gap-3 pt-2  mt-auto">
                        <button className="text-gray-400 hover:text-red-500 transition-colors">
                            <Heart size={18} />
                        </button>
                        <button className="text-gray-400 hover:text-indigo-600 transition-colors">
                            <Share2 size={18} />
                        </button>
                        <button className="text-gray-400 hover:text-indigo-600 transition-colors">
                            <Bookmark size={18} />
                        </button>
                    </div>
                            </div>
                        </div>
                    </div>

                    {/* Icon Footer */}
         
                </div>
            ))}
        </div>
    );
}