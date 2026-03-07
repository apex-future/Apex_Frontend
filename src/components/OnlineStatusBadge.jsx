import React from 'react';
import useOnlineStatus from '../hooks/useOnlineStatus';

export default function OnlineStatusBadge() {
  const { isOnline } = useOnlineStatus();

  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-sm transition-all duration-500">
      <span
        className={`w-2 h-2 rounded-full transition-colors duration-500 ${
          isOnline ? 'bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.6)]' : 'bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.6)]'
        }`}
      />
      <span className="text-[11px] font-medium text-white/80 tracking-wide">
        {isOnline ? 'Synced' : 'Offline'}
      </span>
    </div>
  );
}
