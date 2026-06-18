import React, { useState, useEffect } from 'react';
import { Download, X, Sparkle } from '@phosphor-icons/react';

const PWAPrompt = ({ deferredPrompt }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (deferredPrompt) {
      // Small delay for better UX on load
      const timer = setTimeout(() => {
        // Check if user has already dismissed it in this session
        const isDismissed = sessionStorage.getItem('pwa_prompt_dismissed');
        if (!isDismissed) {
          setIsVisible(true);
        }
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [deferredPrompt]);

  const handleInstall = async (e) => {
    if (e) e.stopPropagation();
    if (!deferredPrompt) return;

    // We've used the prompt, and can't use it again, so hide the UI immediately
    setIsVisible(false);

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt (background)
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`[Apex] User response to install prompt: ${outcome}`);
  };

  const handleDismiss = (e) => {
    if (e) e.stopPropagation();
    setIsVisible(false);
    // Remember dismissal for the session so it doesn't annoy the user
    sessionStorage.setItem('pwa_prompt_dismissed', 'true');
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] w-[95%] max-w-sm md:max-w-md animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="relative overflow-hidden bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border border-violet-500/20 p-6 group">
        {/* Decorative background glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-violet-600/10 blur-3xl rounded-full" />
        
        {/* Row 1: Icons */}
        <div className="flex items-center justify-between mb-5 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center text-violet-600 dark:text-violet-400 shadow-inner">
            <Download size={24} weight="bold" />
          </div>
          <button 
            type="button"
            onClick={handleDismiss}
            className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-all"
          >
            <X size={20} weight="bold" />
          </button>
        </div>

        {/* Content Section: Header and Paragraph on their own rows */}
        <div className="space-y-2 mb-6 relative z-10">
          <div className="flex items-center gap-2">
            <h3 className="text-zinc-900 dark:text-zinc-100 font-bold text-xl leading-tight">Install Apex App</h3>
            <Sparkle size={16} weight="fill" className="text-amber-500 animate-pulse" />
          </div>
          <p className="text-zinc-600 dark:text-zinc-400 text-sm md:text-base leading-relaxed">
            Get the full experience. Faster access, offline reading, and better focus.
          </p>
        </div>
        
        {/* Bottom Row: Buttons stacking on mobile, side-by-side on md+ */}
        <div className="flex flex-col md:flex-row gap-3 relative z-10">
          <button
            type="button"
            onClick={handleInstall}
            className="w-full md:flex-1 py-3.5 px-6 bg-violet-600 hover:bg-violet-700 text-white rounded-2xl font-bold text-sm transition-all duration-300 shadow-lg shadow-violet-600/25 active:scale-95"
          >
            Install Now
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            className="w-full md:flex-1 py-3.5 px-6 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 rounded-2xl font-bold text-sm transition-all duration-300 active:scale-95"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
};

export default PWAPrompt;
