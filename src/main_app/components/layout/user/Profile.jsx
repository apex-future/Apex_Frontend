import { ArrowLeft, Gear, Fire, Book, BookOpen, Calendar, TrendUp, Lightning, Brain, Star } from '@phosphor-icons/react';
import useAuthStore from '../../../store/authStore'
import useStudyStore from '../../../store/studyStore'
import useQuizStore from '../../../store/quizStore'
import { BookContext } from '../../../context/BookContextInstance'
import React, { useContext, useMemo } from 'react'
import ProfileAvatarImg from "../../../../assets/Characters/Character1.png"
import { useNavigate } from 'react-router-dom'
import OnlineStatusBadge from '../OnlineStatusBadge'
import useThemeStore from '../../../store/themeStore'

function Profile() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { books = [] } = useContext(BookContext) || {};
  const streakCount = useStudyStore(state => state.streakCount);
  const getGlobalStats = useQuizStore(state => state.getGlobalStats);
  const globalQuizStats = getGlobalStats();
  const { resolvedTheme } = useThemeStore();
  const isDark = resolvedTheme === 'dark';

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
      streak: 0,
      highlightsCreated: books.reduce((acc, b) => acc + (b.metadata?.highlights?.length || 0), 0),
      notesTaken: books.reduce((acc, b) => acc + (b.metadata?.notes?.length || 0), 0),
      wordsSaved: books.reduce((acc, b) => acc + (b.metadata?.words?.length || 0), 0)
    };
  }, [books]);

  const formattedJoinDate = useMemo(() => {
    if (!user?.created_at) return 'Unknown';
    return new Date(user.created_at).toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric'
    });
  }, [user]);

  return (
    <div className='w-full min-h-screen flex flex-col bg-bg-primary font-sans'>
      {/* Header Section - World Class Black & Blue Aura */}
      <div className="top-wrapper relative flex-shrink-0 overflow-hidden bg-black rounded-b-[2.5rem] sm:rounded-b-[3rem] pb-8 pt-2 sm:pt-4 shadow-2xl">
        {/* Dynamic Blue Aura Background */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_100%_100%_at_50%_-20%,rgba(147,51,234,0.4),rgba(0,0,0,1))]"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_50%,rgba(168,85,247,0.15),transparent_50%)]"></div>
        <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_80%_80%,rgba(192,132,252,0.15),transparent_50%)]"></div>
        
        {/* Glassmorphic border effect at the bottom */}
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent"></div>

        {/* Navigation */}
        <div className="relative flex justify-between items-center p-4 sm:px-6">
          <button
            onClick={() => navigate(-1)}
            className="p-2 sm:p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-all backdrop-blur-md"
          >
            <ArrowLeft className='text-white' size={20} weight="bold" />
          </button>
          <h3 className='text-white text-lg font-bold tracking-widest uppercase text-white/90'>Profile</h3>
          <button onClick={() => navigate('/settings')} className="p-2 sm:p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-all backdrop-blur-md">
            <Gear className='text-white' size={20} weight="fill" />
          </button>
        </div>

        {/* Profile Info */}
        <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-5 px-6 sm:px-8 mt-4 sm:mt-6">
          {/* Avatar Area */}
          <div className="relative flex flex-col items-center gap-2 flex-shrink-0">
            {/* Glowing Ring */}
            <div className="absolute inset-0 rounded-full bg-purple-500/20 blur-xl scale-110 animate-pulse"></div>
            <div className="relative p-1 rounded-full bg-gradient-to-b from-purple-400 to-purple-900">
              <img
                src={ProfileAvatarImg}
                alt="Profile"
                className='relative size-24 sm:size-28 object-cover rounded-full border-4 border-black bg-zinc-900'
              />
            </div>
            <div className="-mt-3 z-10">
              <OnlineStatusBadge />
            </div>
          </div>

          {/* User Details */}
          <div className="flex-1 min-w-0 flex flex-col items-center sm:items-start text-center sm:text-left mt-2 sm:mt-4">
            <h1 className="text-white text-2xl sm:text-3xl font-black mb-1 truncate tracking-tight">{user?.full_name || 'User'}</h1>
            <p className="text-purple-200/70 text-sm sm:text-base font-medium mb-3 truncate">{user?.email || 'user@apex.com'}</p>
            <div className="flex flex-wrap justify-center sm:justify-start items-center gap-3">
              <span className="flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-white text-xs font-bold border border-white/10">
                <Calendar size={14} weight="bold" className="text-purple-400" />
                Joined {formattedJoinDate}
              </span>
              <span className="px-3 py-1 bg-gradient-to-r from-purple-600 to-purple-900 rounded-full text-white text-xs font-bold shadow-[0_0_15px_rgba(147,51,234,0.5)] border border-purple-400/50">
                PRO
              </span>
            </div>
          </div>

          {/* Premium Streak Badge */}
          <div className="flex flex-col items-center justify-center bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-4 min-w-[80px] shadow-[0_8px_32px_rgba(0,0,0,0.5)] mt-4 sm:mt-2 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-b from-orange-500/10 to-transparent"></div>
            <Fire className='text-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.8)] relative z-10 group-hover:scale-110 transition-transform duration-300' size={28} weight="fill" />
            <p className='text-white text-2xl font-black leading-none mt-2 relative z-10'>{streakCount}</p>
            <p className='text-white/50 text-[10px] uppercase tracking-widest font-bold mt-1 relative z-10'>Streak</p>
          </div>
        </div>
      </div>

      {/* Main Content - Black & White Premium Aesthetic */}
      <div className="flex-1 px-4 sm:px-6 md:px-8 py-8 pb-28 space-y-10 max-w-5xl mx-auto w-full">
        
        {/* Statistics Section */}
        <section>
          <div className="flex items-center justify-between mb-5 px-1">
            <h2 className="text-sm font-black text-text-primary dark:text-white uppercase tracking-[0.2em] flex items-center gap-3 border-l-4 border-purple-500 pl-3">
              Statistics
            </h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            <StatCard
              icon={<Book weight="duotone" />}
              label="Total Books"
              value={stats.totalBooks}
              highlight={true}
            />
            <StatCard
              icon={<BookOpen weight="duotone" />}
              label="Reading Now"
              value={stats.currentlyReading}
            />
            <StatCard
              icon={<Star weight="duotone" />}
              label="Completed"
              value={stats.completedBooks}
            />
            <StatCard
              icon={<TrendUp weight="duotone" />}
              label="Pages Read"
              value={stats.totalPagesRead}
            />
          </div>
        </section>

        {/* Interactions & Memory Section */}
        <section>
          <div className="flex items-center justify-between mb-5 px-1 mt-10">
            <h2 className="text-sm font-black text-text-primary dark:text-white uppercase tracking-[0.2em] flex items-center gap-3 border-l-4 border-purple-500 pl-3">
              Memory & Interactions
            </h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            <StatCard
              icon={<Lightning weight="duotone" />}
              label="Highlights"
              value={stats.highlightsCreated}
            />
            <StatCard
              icon={<BookOpen weight="duotone" />}
              label="Notes Taken"
              value={stats.notesTaken}
            />
            <StatCard
              icon={<Brain weight="duotone" />}
              label="Words Saved"
              value={stats.wordsSaved}
              highlight={true}
            />
            <StatCard
              icon={<TrendUp weight="duotone" />}
              label="Quizzes Done"
              value={globalQuizStats?.attemptsCount || 0}
            />
            <StatCard
              icon={<Star weight="duotone" />}
              label="Avg Score"
              value={globalQuizStats ? `${globalQuizStats.averageScore}%` : 'N/A'}
              highlight={globalQuizStats?.averageScore >= 80}
            />
          </div>
        </section>

      </div>
    </div>
  )
}

// Ultra Premium Stat Card
const StatCard = ({ icon, label, value, highlight = false }) => {
  const { resolvedTheme } = useThemeStore();
  const isDark = resolvedTheme === 'dark';

  return (
    <div className={`relative overflow-hidden 
      ${highlight 
        ? 'bg-gradient-to-br from-purple-600 to-purple-900 border-transparent shadow-[0_8px_30px_rgba(147,51,234,0.3)]' 
        : 'bg-white dark:bg-zinc-900 border-black/5 dark:border-white/10 shadow-sm'} 
      border rounded-[1.5rem] p-5 sm:p-6 transition-all duration-500 hover:-translate-y-1 hover:shadow-xl group flex flex-col justify-end min-h-[120px]`}
    >
      {/* Background Icon */}
      <div className={`absolute -right-4 -bottom-4 transition-all duration-700 transform group-hover:rotate-12 group-hover:scale-110 
        ${highlight ? 'text-white/10' : 'text-black/5 dark:text-white/5'} 
      `}>
        {React.cloneElement(icon, { size: 100 })}
      </div>
      
      {/* Glow Effect for Highlighted Cards */}
      {highlight && (
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      )}

      {/* Content */}
      <div className="relative z-10 flex flex-col gap-1">
        <div className={`text-2xl sm:text-3xl lg:text-4xl font-black tracking-tighter
          ${highlight ? 'text-white drop-shadow-md' : 'text-text-primary dark:text-white'}
        `}>
          {value}
        </div>
        <div className={`text-[10px] sm:text-xs font-bold uppercase tracking-[0.15em]
          ${highlight ? 'text-purple-100' : 'text-text-tertiary dark:text-zinc-500'}
        `}>
          {label}
        </div>
      </div>
    </div>
  );
};

export default Profile
