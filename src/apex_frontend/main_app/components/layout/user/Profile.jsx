import { ArrowLeft, Settings, Flame, Book, BookOpen, Calendar, TrendingUp } from 'lucide-react'
import dummyProfileImg from "../../../../../assets/user_imgs/user_img_1.jpg"
import { useNavigate } from 'react-router-dom'

function Profile() {
  const navigate = useNavigate();
  // Mock data - replace with actual user data from context/state
  const user = {
    name: 'User',
    email: 'user@apex.com',
    memberSince: 'Jan 2025',
    plan: 'Free',
    stats: {
      totalBooks: 12,
      currentlyReading: 3,
      completedBooks: 5,
      streak: 7,
      totalPagesRead: 1247,
      highlightsCreated: 127
    },
    recentBooks: [
      { id: 1, title: 'Physics Textbook', cover: dummyProfileImg, progress: 45 },
      { id: 2, title: 'Chemistry Notes', cover: dummyProfileImg, progress: 78 },
      { id: 3, title: 'Mathematics', cover: dummyProfileImg, progress: 100 }
    ]
  };

  return (
    <div className='w-full min-h-screen bg-bg-primary'>
      {/* Header Section - Glassmorphic Purple Gradient */}
      <div className="top-wrapper relative overflow-hidden bg-neutral-950 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))] rounded-b-[2rem] pb-8">
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
          <h3 className='text-white text-lg font-semibold'>Profile</h3>
          <button onClick={() => navigate('/settings')} className="p-2 hover:bg-white/10 rounded-lg transition-all">
            <Settings className='text-white' size={20} />
          </button>
        </div>

        {/* Profile Info */}
        <div className="relative flex items-center gap-4 px-4 mt-4">
          {/* Avatar with glassmorphic ring */}
          <div className="relative">
            <div className="absolute inset-0 bg-white/20 rounded-full blur-md"></div>
            <img
              src={dummyProfileImg}
              alt="Profile"
              className='relative size-20 object-cover rounded-full ring-4 ring-white/30'
            />
          </div>

          {/* User Details */}
          <div className="flex-1">
            <h1 className="text-white text-2xl font-bold mb-1">{user.name}</h1>
            <p className="text-purple-100 text-sm mb-2">{user.email}</p>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-purple-100 text-xs">
                <Calendar size={12} />
                {user.memberSince}
              </span>
              <span className="px-2 py-0.5 bg-white/20 backdrop-blur-sm rounded-full text-white text-xs font-medium">
                {user.plan}
              </span>
            </div>
          </div>

          {/* Streak Badge - Glassmorphic with THICK BORDER */}
          <div className="flex flex-col items-center justify-center bg-white/10 backdrop-blur-md border-2 border-white/20 rounded-2xl p-3 min-w-[70px]">
            <Flame className='text-orange-400' size={24} />
            <p className='text-white text-xl font-bold'>{user.stats.streak}</p>
            <p className='text-purple-100 text-[10px]'>days</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 py-6 space-y-6">

        {/* Stats Grid - Minimalistic Monochrome with THICK BORDERS */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            icon={<Book size={18} />}
            label="Total Books"
            value={user.stats.totalBooks}
            iconBg="bg-icon-900"
          />
          <StatCard
            icon={<BookOpen size={18} />}
            label="Reading Now"
            value={user.stats.currentlyReading}
            iconBg="bg-icon-800"
          />
          <StatCard
            icon={<Book size={18} />}
            label="Completed"
            value={user.stats.completedBooks}
            iconBg="bg-icon-700"
          />
          <StatCard
            icon={<TrendingUp size={18} />}
            label="Pages Read"
            value={user.stats.totalPagesRead}
            iconBg="bg-icon-600"
          />
        </div>

        {/* Reading Activity Card - THICK BORDER */}
        {/* <div className="bg-white/60 backdrop-blur-md border-2 border-border-default rounded-2xl p-5 hover:border-text-tertiary transition-all">
          <h2 className="text-base font-semibold mb-4 text-text-primary">Reading Activity</h2>
          <div className="space-y-3">
            <ActivityRow label="Total Pages Read" value={user.stats.totalPagesRead.toLocaleString()} />
            <ActivityRow label="Highlights Created" value={user.stats.highlightsCreated} />
            <ActivityRow label="Current Streak" value={`${user.stats.streak} days`} />
            <ActivityRow label="Avg. Session" value="32 min" />
          </div>
        </div> */}

        {/* Continue Reading Card - THICK BORDER */}
        {/* <div className="bg-white/60 backdrop-blur-md border-2 border-border-default rounded-2xl p-5 hover:border-text-tertiary transition-all">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-base font-semibold text-text-primary">Continue Reading</h2>
            <button className="text-accent-primary text-sm font-medium hover:text-accent-pressed transition-colors">
              View All
            </button>
          </div>
          <div className="space-y-3">
            {user.recentBooks.map(book => (
              <BookRow key={book.id} book={book} />
            ))}
          </div>
        </div> */}

        {/* Upgrade CTA - Glassmorphic Gradient Card (no border - it's an accent piece) */}
        {user.plan === 'Free' && (
          <div className="relative overflow-hidden bg-gradient-to-br from-accent-primary to-accent-pressed rounded-2xl p-5">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(255,255,255,0.15),rgba(255,255,255,0))]"></div>
            <div className="relative">
              <h3 className="text-white font-bold text-lg mb-1">Unlock Premium</h3>
              <p className="text-purple-100 text-sm mb-4">Unlimited books, AI explanations & more</p>
              <button className="w-full bg-white text-accent-primary font-semibold py-2.5 rounded-xl hover:bg-purple-50 transition-all">
                Upgrade for $4.99/mo
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Stat Card Component with THICK BORDER SYSTEM
const StatCard = ({ icon, label, value, iconBg }) => (
  <div className="relative overflow-hidden bg-gradient-to-br from-neutral-100/80 to-neutral-50/40 backdrop-blur-md border-2 border-border-default rounded-2xl p-4 hover:scale-[1.02] hover:border-text-tertiary transition-all">
    <div className={`w-9 h-9 ${iconBg} rounded-xl flex items-center justify-center text-white mb-3`}>
      {icon}
    </div>
    <div className="text-2xl font-bold text-text-primary mb-0.5">{value}</div>
    <div className="text-xs text-text-tertiary font-medium">{label}</div>
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
  <div className="flex items-center gap-3 p-3 hover:bg-white/50 rounded-xl transition-all cursor-pointer">
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
