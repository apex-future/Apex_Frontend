import useAuthStore from '../../store/authStore';
import { useNavigate } from 'react-router-dom';
import BookCover from '../books/BookCover';

export default function Header({ lastReadBook }) {
    const { user } = useAuthStore();
    const firstName = user?.full_name?.split(' ')[0] || "User";
    const navigate = useNavigate();

    const currentBook = lastReadBook || {
        title: "Welcome to Apex!",
        author: "Start your first book",
        progress: 0,
        currentPage: 0,
        totalPages: 0,
        cover: null
    };

    return (
        <div className="w-full">
            <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 pt-0 pb-2">
                <div className="welcome-message mb-8">
                    <h1 className="font-display text-3xl sm:text-4xl font-bold text-text-primary mb-2 tracking-tightest leading-premium-tight">
                        Hey, {firstName}
                    </h1>
                    <p className="text-text-secondary font-medium tracking-tight">What's your pick today?</p>
                </div>

                <h2 className='text-lg sm:text-xl px-2 font-semibold text-text-primary mb-4 tracking-tight'>Last Read</h2>
                <div
                    onClick={() => lastReadBook && navigate(`/reader/${lastReadBook.id}`)}
                    className={`bg-card-glass backdrop-blur-xl rounded-3xl p-6 md:p-8 border-2 border-border-default hover:border-text-tertiary hover:shadow-md transition-all duration-500 group overflow-hidden ${lastReadBook ? 'cursor-pointer' : ''} shadow-md relative`}
                >
                    <div className="flex gap-4 md:gap-8 w-full overflow-hidden">
                        <div className="w-24 h-36 xs:w-32 xs:h-44 rounded-md overflow-hidden shadow-md flex-shrink-0 bg-bg-subtle border border-border-subtle group-hover:scale-[1.02] transition-transform duration-300">
                            {currentBook.cover ? (
                                <img src={currentBook.cover} alt="Book cover" className="w-full h-full object-cover" />
                            ) : (
                                <BookCover title={currentBook.title} author={currentBook.author} className="w-full h-full" />
                            )}
                        </div>

                        <div className="flex-1 flex flex-col justify-between py-1 min-w-0">
                            <div className="mb-4 min-w-0">
                                <h2 className="font-display text-lg xs:text-2xl sm:text-3xl font-bold text-text-primary mb-2 line-clamp-2 tracking-tighter leading-premium-tight break-words">
                                    {currentBook.title}
                                </h2>
                                <p className="text-xs sm:text-base text-text-tertiary font-medium line-clamp-1 italic tracking-tight truncate">by {currentBook.author}</p>
                            </div>

                            <div className="mb-2 w-full">
                                <div className="flex justify-between items-end mb-3 gap-2">
                                    <span className="text-[10px] sm:text-sm font-medium text-text-tertiary tracking-wide uppercase truncate">
                                        {currentBook.progress > 0 ? `Page ${currentBook.currentPage || '?'} of ${currentBook.totalPages || '?'}` : 'Not started'}
                                    </span>
                                    <span className="text-xs sm:text-base font-bold text-accent-primary tabular-nums shrink-0">
                                        {currentBook.progress}%
                                    </span>
                                </div>
                                <div className="w-full bg-border-default rounded-full h-1 overflow-hidden">
                                    <div
                                        className="bg-accent-primary h-full rounded-full transition-all duration-700 ease-out"
                                        style={{ width: `${currentBook.progress}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
