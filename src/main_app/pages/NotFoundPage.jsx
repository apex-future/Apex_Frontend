import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Compass, 
  House, 
  ArrowLeft, 
  Sparkle, 
  Books, 
  Robot, 
  Cards, 
  Target, 
  Gear,
  Question,
  BookOpen
} from '@phosphor-icons/react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import logoLight from '../../assets/logo/logo-light.jpg';

function NotFoundPage({ isLoggedIn = false }) {
  const navigate = useNavigate();

  const quickLinks = isLoggedIn ? [
    { label: 'Library Home', path: '/', icon: House, description: 'Return to your workspace & recent books' },
    { label: 'Apex AI Assistant', path: '/ai', icon: Robot, description: 'Ask questions & generate study materials' },
    { label: 'Books & Spaces', path: '/spaces', icon: Books, description: 'Browse your organized collections' },
    { label: 'Flashcards', path: '/flashcards', icon: Cards, description: 'Review your study cards' },
    { label: 'Quests & Streak', path: '/quest', icon: Target, description: 'Track your reading milestones' },
    { label: 'Settings', path: '/settings', icon: Gear, description: 'Manage preferences & account' },
  ] : [
    { label: 'Apex Home', path: '/', icon: House, description: 'Discover Apex reading platform' },
    { label: 'Sign In', path: '/login', icon: BookOpen, description: 'Access your account' },
    { label: 'Create Account', path: '/signup', icon: Sparkle, description: 'Start your study journey' },
    { label: 'Privacy Policy', path: '/privacy', icon: Question, description: 'Read terms & privacy' },
  ];

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center px-4 py-12 md:py-16 relative bg-bg-primary text-text-primary">
      {/* Background ambient glowing gradient - Purple themed */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] md:w-[500px] h-[320px] md:h-[500px] bg-gradient-to-tr from-purple-600/15 via-purple-500/10 to-indigo-500/15 rounded-full blur-[100px] pointer-events-none -z-0" />

      <div className="w-full max-w-3xl mx-auto flex flex-col items-center text-center relative z-10">
        
        {/* Header Branding for logged out users */}
        {!isLoggedIn && (
          <div className="mb-6">
            <Link to="/" className="inline-flex items-center gap-2 group">
              <img src={logoLight} alt="Apex Logo" className="w-10 h-10 rounded-xl object-cover shadow-sm group-hover:scale-105 transition-transform" />
              <span className="text-xl font-bold tracking-tight text-text-primary">APEX</span>
            </Link>
          </div>
        )}

        {/* 404 Hero Visual & Icon */}
        <div className="relative mb-6">
          <div className="relative flex flex-col items-center">
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-purple-500/10 dark:bg-purple-400/10 border border-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400 mb-3 shadow-sm">
              <Compass size={48} weight="duotone" className="animate-spin-slow" />
            </div>
            <span className="text-6xl md:text-8xl font-extrabold tracking-tighter text-purple-600 dark:text-purple-400 select-none">
              404
            </span>
          </div>
        </div>

        {/* Text Heading */}
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-2 text-text-primary">
          Page Not Found
        </h1>
        <p className="text-sm md:text-base text-text-secondary max-w-md mb-8 leading-relaxed">
          The page you are looking for doesn't exist, has been moved, or is no longer accessible on Apex.
        </p>

        {/* Action Buttons using predefined Button component */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-12 w-full max-w-md">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="!w-auto flex-1"
          >
            <ArrowLeft size={16} />
            Go Back
          </Button>

          <Button
            variant="primary"
            onClick={() => navigate('/')}
            className="!w-auto flex-1"
          >
            <House size={16} weight="bold" />
            Back to Apex Home
          </Button>
        </div>

        {/* Popular Destinations using predefined Card component */}
        <div className="w-full text-left">
          <h2 className="text-xs font-bold uppercase tracking-wider text-text-tertiary mb-3 text-center md:text-left">
            Popular Destinations
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {quickLinks.map((link) => {
              const IconComponent = link.icon;
              return (
                <Card
                  key={link.path}
                  variant="interactive"
                  onClick={() => navigate(link.path)}
                  className="p-4 flex flex-col justify-between"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                      <IconComponent size={20} weight="duotone" />
                    </div>
                    <span className="font-bold text-sm text-text-primary">
                      {link.label}
                    </span>
                  </div>
                  <p className="text-xs text-text-tertiary line-clamp-2">
                    {link.description}
                  </p>
                </Card>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}

export default NotFoundPage;
