import atomicHabits from "../../../assets/book_covers/Atomic-habits.jpeg";
import biology from "../../../assets/book_covers/biology.jpeg";
import accounting from "../../../assets/book_covers/accounts.jpeg";

export default function Allbooks() {
    const allBooks = [
        { id: 1, title: 'Atomic Habits', author: 'James Clear', progress: 50, cover: atomicHabits, status: 'uncompleted' },
        { id: 2, title: 'Biology', author: 'Thomas D. Polad', progress: 75, cover: biology, status: 'uncompleted' },
        { id: 3, title: 'Accounting', author: 'Greg Shields', progress: 25, cover: accounting, status: 'new' },
    ];

    const statusStyles = {
        completed: 'bg-green-100 text-green-700',
        uncompleted: 'bg-yellow-100 text-yellow-700',
        new: 'bg-indigo-100 text-indigo-700',
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-3">
            {allBooks.map((book) => (
                <div key={book.id} className="group relative flex flex-col bg-white p-4 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-100">
                    <button className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100 z-10">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1" /><circle cx="12" cy="5" r="1" /><circle cx="12" cy="19" r="1" /></svg>
                    </button>

                    <div className="flex flex-row gap-4 mb-4">
                        {/* Cover - Left Side */}
                        <div className="relative w-24 h-36 flex-shrink-0 rounded-lg overflow-hidden shadow-sm">
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
                        <div className="flex-1 flex flex-col justify-center">
                            <h3 className="font-semibold text-base text-text-primary line-clamp-2 mb-1">{book.title}</h3>
                            <p className="text-sm text-black/50 mb-3">{book.author}</p>

                            {/* Progress Bar */}
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                                <div
                                    className="bg-indigo-600 h-1.5 rounded-full transition-all duration-500"
                                    style={{ width: `${book.progress}%` }}
                                />
                            </div>
                            <p className="text-xs text-black/50 mt-1">{book.progress}% complete</p>
                        </div>
                    </div>

                    {/* Icon Footer */}
                    <div className="flex justify-end gap-3 pt-2 border-t border-gray-100 mt-auto">
                        <button className="text-gray-400 hover:text-red-500 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" /></svg>
                        </button>
                        <button className="text-gray-400 hover:text-indigo-600 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" x2="15.42" y1="13.51" y2="17.49" /><line x1="15.41" x2="8.59" y1="6.51" y2="10.49" /></svg>
                        </button>
                        <button className="text-gray-400 hover:text-indigo-600 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" /></svg>
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}