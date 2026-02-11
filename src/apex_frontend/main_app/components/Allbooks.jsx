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
                <div key={book.id} className="group cursor-pointer">
                    {/* Cover */}
                    <div className="relative w-32 h-44 mx-auto rounded-xl overflow-hidden shadow-md group-hover:shadow-lg transition-shadow duration-300">
                        <img
                            src={book.cover}
                            alt={book.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {/* Status Badge */}
                        <span className={`absolute top-2 left-2 text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${statusStyles[book.status]}`}>
                            {book.status}
                        </span>
                    </div>

                    {/* Info */}
                    <div className="mt-3 px-1">
                        <h3 className="font-semibold text-base text-text-primary truncate">{book.title}</h3>
                        <p className="text-sm text-black/50 mb-2">{book.author}</p>

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
            ))}
        </div>
    );
}