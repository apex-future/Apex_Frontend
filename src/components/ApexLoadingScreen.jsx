import { useState, useEffect } from 'react';
import apexLogo from '../assets/logo/logo-light-removebg-preview.png';

function ApexLoadingScreen() {
  const [showSlowMessage, setShowSlowMessage] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSlowMessage(true);
    }, 8000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] bg-[#08090C] flex flex-col items-center justify-center gap-8">
      {/* Pulsing Apex Logo */}
      <div className="animate-pulse">
        <img
          src={apexLogo}
          alt="Apex"
          className="w-24 h-24 md:w-32 md:h-32 object-contain drop-shadow-2xl"
        />
      </div>

      {/* Status Text */}
      <div className="flex flex-col items-center gap-3">
        <p className="text-white/70 text-sm font-medium tracking-wide">
          Setting up your workspace...
        </p>

        {/* Slow message */}
        {showSlowMessage && (
          <p className="text-white/40 text-xs font-medium animate-in fade-in duration-500">
            Taking longer than usual... hang tight
          </p>
        )}
      </div>

      {/* Subtle loading bar */}
      <div className="w-48 h-0.5 bg-white/10 rounded-full overflow-hidden">
        <div className="h-full bg-purple-500/60 rounded-full animate-loading-bar" />
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes loading-bar {
          0% { width: 0%; }
          50% { width: 70%; }
          100% { width: 100%; }
        }
        .animate-loading-bar {
          animation: loading-bar 3s ease-in-out infinite;
        }
      `}} />
    </div>
  );
}

export default ApexLoadingScreen;
