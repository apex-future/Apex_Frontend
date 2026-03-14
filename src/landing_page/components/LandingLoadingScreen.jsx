import { useState, useEffect } from 'react';
import apexLogo from '../../assets/logo/logo-dark-removebg-preview.png';

function LandingLoadingScreen() {
  const [showSlowMessage, setShowSlowMessage] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSlowMessage(true);
    }, 8000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] bg-[#08090C] flex flex-col items-center justify-center gap-8">
      {/* Pulsing Apex Logo - for visual effect*/}
      <div className="animate-pulse">
        <img
          src={apexLogo}
          alt="Apex"
          className="w-24 h-24 md:w-32 md:h-32 object-contain drop-shadow-2xl"
        />
      </div>

      {/* Status Text */}
      <div className="flex flex-col items-center gap-3">
        {/* Slow message - if it takes longer than 8 seconds */}
        {showSlowMessage && (
          <p className="text-white/40 text-xs font-medium animate-in fade-in duration-500">
            Taking longer than usual... hang tight
          </p>
        )}
      </div>

      {/* Spinner */}
      <div className="w-10 h-10 border-2 border-white/5 border-t-purple-500/80 rounded-full animate-spin-slow" />

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin 1s linear infinite;
        }
      `}} />
    </div>
  );
}

export default LandingLoadingScreen;
