import { ArrowLeft, Settings, Flame, Book, BookOpen, Calendar, TrendingUp } from 'lucide-react'
import useAuthStore from '../../../store/authStore'
import useStudyStore from '../../../store/studyStore'
import useQuizStore from '../../../store/quizStore'
import { BookContext } from '../../../context/BookContextInstance'
import React, { useContext, useMemo } from 'react'
import dummyProfileImg from "../../../../assets/user_imgs/user_img_1.jpg"
import { useNavigate } from 'react-router-dom'
import OnlineStatusBadge from '../OnlineStatusBadge'

function Profile() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { books } = useContext(BookContext);
  const streakCount = useStudyStore(state => state.streakCount);
  const getGlobalStats = useQuizStore(state => state.getGlobalStats);
  const globalQuizStats = getGlobalStats();

  const stats = useMemo(() => {
    const totalBooks = books.length;
    const currentlyReading = books.filter(b => b.progress > 0 && b.progress < 100).length;
    const completedBooks = books.filter(b => b.progress === 100).length;
    const totalPagesRead = books.reduce((acc, b) => acc + (b.currentPage || 0), 0);
    
    return {
      totalBooks,
      currentlyReading,
      completedBooks,
      totalPagesRead,
      streak: 0, // Streak calculation would require historic data
      highlightsCreated: books.reduce((acc, b) => acc + (b.metadata?.highlights?.length || 0), 0),
      notesTaken: books.reduce((acc, b) => acc + (b.metadata?.notes?.length || 0), 0),
      wordsSaved: books.reduce((acc, b) => acc + (b.metadata?.words?.length || 0), 0)
    };
  }, [books]);

  const recentBooks = useMemo(() => {
    return [...books]
      .sort((a, b) => new Date(b.lastAccessed || 0) - new Date(a.lastAccessed || 0))
      .slice(0, 3);
  }, [books]);

  const formattedJoinDate = useMemo(() => {
    if (!user?.created_at) return 'Unknown';
    return new Date(user.created_at).toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric'
    });
  }, [user]);

  return (
    <div className='w-full min-h-screen flex flex-col bg-bg-primary'>
      {/* Header Section - Glassmorphic Purple Gradient */}
      <div className="top-wrapper relative flex-shrink-0 overflow-hidden bg-neutral-950 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))] rounded-b-[2.5rem] pb-6">
        {/* Glassmorphic overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(255,255,255,0.1),rgba(255,255,255,0))]"></div>

        {/* Navigation */}
        <div className="relative flex justify-between items-center p-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-white/10 rounded-lg transition-all"
          >
            <ArrowLeft className='text-white' size={20} />
          </button>
          <h3 className='text-white text-lg font-semibold font-display'>Profile</h3>
          <button onClick={() => navigate('/settings')} className="p-2 hover:bg-white/10 rounded-lg transition-all">
            <Settings className='text-white' size={20} />
          </button>
        </div>

        {/* Profile Info - MORE COMPACT ON MOBILE */}
        <div className="relative flex items-center gap-4 px-6 mt-2">
          {/* Avatar with glassmorphic ring */}
          <div className="relative flex flex-col items-center gap-1.5 flex-shrink-0">
            <div className="absolute inset-0 bg-white/20 rounded-full blur-md"></div>
            <img
              src={dummyProfileImg}
              alt="Profile"
              className='relative size-16 sm:size-20 object-cover rounded-full ring-4 ring-white/30'
            />
            <OnlineStatusBadge />
          </div>

          {/* User Details */}
          <div className="flex-1 min-w-0">
            <h1 className="text-white text-xl sm:text-2xl font-bold mb-0.5 truncate">{user?.full_name || 'User'}</h1>
            <p className="text-purple-100/80 text-xs sm:text-sm mb-2 truncate">{user?.email || 'user@apex.com'}</p>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-purple-100 text-[10px] sm:text-xs">
                <Calendar size={12} />
                {formattedJoinDate}
              </span>
              <span className="px-2 py-0.5 bg-white/20 backdrop-blur-sm rounded-full text-white text-[10px] sm:text-xs font-medium border border-white/10">
                Free
              </span>
            </div>
          </div>

          {/* Streak Badge - MORE FLUID */}
          <div className="flex flex-col items-center justify-center bg-white/10 backdrop-blur-md border border-white/20 rounded-card p-2 sm:p-3 min-w-[64px] sm:min-w-[70px]">
            <Flame className='text-orange-400' size={20} />
            <p className='text-white text-lg sm:text-xl font-bold leading-none mt-1'>{streakCount}</p>
            <p className='text-purple-100 text-[9px] sm:text-[10px] uppercase tracking-wider font-medium'>days</p>
          </div>
        </div>
      </div>

      {/* Main Content - SCROLLABLE AREA */}
      <div className="flex-1 px-4 py-6 pb-28 space-y-8">
        
        {/* Stats Grid - FLUID AND COMPACT */}
        <section>
          <div className="flex items-center justify-between mb-4 px-1">
            <h2 className="text-sm font-bold text-text-tertiary uppercase tracking-widest flex items-center gap-2">
              <TrendingUp size={14} />
              Statistics
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <StatCard
              icon={<Book />}
              label="Total Books"
              value={stats.totalBooks}
            />
            <StatCard
              icon={<BookOpen />}
              label="Reading Now"
              value={stats.currentlyReading}
            />
            <StatCard
              icon={<Book />}
              label="Completed"
              value={stats.completedBooks}
            />
            <StatCard
              icon={<TrendingUp />}
              label="Pages Read"
              value={stats.totalPagesRead}
            />
          </div>

          <div className="flex items-center justify-between mt-8 mb-4 px-1">
            <h2 className="text-sm font-bold text-text-tertiary uppercase tracking-widest flex items-center gap-2">
              <Flame size={14} />
              Interactions & Memory
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <StatCard
              icon={<TrendingUp />}
              label="Total Highlights"
              value={stats.highlightsCreated}
            />
            <StatCard
              icon={<BookOpen />}
              label="Notes Taken"
              value={stats.notesTaken}
            />
            <StatCard
              icon={<Book />}
              label="Words Saved"
              value={stats.wordsSaved}
            />
            <StatCard
              icon={<TrendingUp />}
              label="Quizzes Done"
              value={globalQuizStats?.attemptsCount || 0}
            />
            <StatCard
              icon={<TrendingUp />}
              label="Avg Quiz Score"
              value={globalQuizStats ? `${globalQuizStats.averageScore}%` : 'N/A'}
            />
          </div>
        </section>

        {/* Placeholder for Recent Activity if needed later */}
        <div className="h-px bg-border-default/50 mx-4" />
      </div>
    </div>

  )
}

// Stat Card Component with PREMIUM BACKGROUND-ICON DESIGN
const StatCard = ({ icon, label, value }) => (
  <div className="relative overflow-hidden bg-bg-subtle dark:bg-bg-elevated border-t border-black/10 dark:border-white/10 rounded-card p-5 sm:p-6 hover:border-accent-primary/50 transition-all duration-300 shadow-sm hover:shadow-md group flex flex-col justify-end min-h-[110px]">
    {/* Background Icon - LEFT POSITIONED, ROTATED */}
    <div className="absolute -left-2 -top-2 text-text-primary/10 dark:text-white/10 transition-all duration-500 transform rotate-12 group-hover:rotate-0 group-hover:scale-110 group-hover:text-accent-primary/20">
      {React.cloneElement(icon, { size: 80 })}
    </div>
    
    {/* Content - Positioned relative to background icon */}
    <div className="relative z-10">
      <div className="text-2xl sm:text-3xl font-bold text-text-primary dark:text-white mb-0.5 tracking-tight">{value}</div>
      <div className="text-[10px] sm:text-xs text-text-tertiary dark:text-zinc-400 font-bold uppercase tracking-widest">{label}</div>
    </div>
  </div>
);

// Activity Row Component
const ActivityRow = ({ label, value }) => (
  <div className="flex justify-between items-center">
    <span className="text-sm text-text-secondary">{label}</span>
    <span className="font-semibold text-sm text-text-primary">{value}</span>
  </div>
);

// Book Row Component with Progress Bar
const BookRow = ({ book }) => (
  <div className="flex items-center gap-3 p-3 hover:bg-bg-subtle/50 rounded-xl transition-all cursor-pointer">
    <div className="w-10 h-14 bg-border-default rounded-lg overflow-hidden flex-shrink-0">
      <img src={book.cover} alt={book.title} className="w-full h-full object-cover" />
    </div>
    <div className="flex-1 min-w-0">
      <h3 className="font-medium text-sm text-text-primary truncate mb-1.5">{book.title}</h3>
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-border-default rounded-full overflow-hidden">
          <div
            className="h-full bg-accent-primary rounded-full transition-all"
            style={{ width: `${book.progress}%` }}
          />
        </div>
        <span className="text-[10px] text-text-tertiary font-semibold min-w-[35px] text-right">{book.progress}%</span>
      </div>
    </div>
  </div>
);

export default Profile
