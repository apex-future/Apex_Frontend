import React, { useState, useEffect } from 'react';
import { Download, X, Sparkles } from 'lucide-react';

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

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`[Apex] User response to install prompt: ${outcome}`);

    // We've used the prompt, and can't use it again, so hide the UI
    setIsVisible(false);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    // Remember dismissal for the session so it doesn't annoy the user
    sessionStorage.setItem('pwa_prompt_dismissed', 'true');
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-md animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="relative overflow-hidden bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-violet-500/20 p-5 group">
        {/* Decorative background glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-violet-600/10 blur-3xl rounded-full group-hover:bg-violet-600/20 transition-colors duration-500" />
        
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center text-violet-600 dark:text-violet-400 shadow-inner">
            <Download size={24} />
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-zinc-900 dark:text-zinc-100 font-bold text-lg leading-tight">Install Apex App</h3>
              <Sparkles size={14} className="text-amber-500 animate-pulse" />
            </div>
            <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed mb-4">
              Get the full experience. Faster access, offline reading, and better focus.
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={handleInstall}
                className="flex-1 py-2.5 px-4 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-semibold text-sm transition-all duration-300 shadow-lg shadow-violet-600/25 active:scale-95"
              >
                Install Now
              </button>
              <button
                onClick={handleDismiss}
                className="py-2.5 px-4 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 rounded-xl font-medium text-sm transition-all duration-300 active:scale-95"
              >
                Maybe later
              </button>
            </div>
          </div>

          <button 
            onClick={handleDismiss}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors p-1"
          >
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PWAPrompt;
