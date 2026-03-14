import React, { useState } from 'react'
import { X, ChevronLeft, ArrowUpDown, ArrowLeftRight, Settings, Sliders } from 'lucide-react'

function PageSettings({ setPageSettings, readerControls }) {
  const [activeSection, setActiveSection] = useState(null);
  const [scrollOrientation, setScrollOrientation] = useState('vertical'); // 'vertical' or 'horizontal'

  const sections = [
    { id: 'orientation', label: 'Scroll Orientation', icon: Sliders }
  ];

  return (
    <aside
      className="flex flex-col absolute inset-0 z-[200] bg-bg-elevated md:relative md:inset-auto md:w-80 md:h-full md:border-r md:border-border-default md:shrink-0 font-sans shadow-2xl md:shadow-none animate-in slide-in-from-left duration-300"
      onClick={(e) => e.stopPropagation()}
    >
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-5 py-5 border-b border-border-default shrink-0">
        {activeSection ? (
          <button
            onClick={() => setActiveSection(null)}
            className="flex items-center gap-2 text-base font-bold text-text-primary hover:text-accent-primary transition-colors"
          >
            <ChevronLeft size={18} strokeWidth={2.5} />
            {activeSection === 'orientation' ? 'Scroll Orientation' : 'Settings'}
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <Settings size={18} className="text-text-tertiary" />
            <h2 className="text-xs font-black text-text-tertiary tracking-[0.2em] uppercase">Settings</h2>
          </div>
        )}
        <button
          onClick={() => setPageSettings(false)}
          className="p-2 rounded-full bg-bg-subtle hover:bg-bg-subtle transition-all text-text-tertiary hover:text-text-secondary"
        >
          <X size={18} strokeWidth={2} />
        </button>
      </div>

      {/* ── Body ── */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
          <div className="flex flex-col gap-6">
            {/* Scroll Orientation Section */}
            <div className="space-y-4">
              <h3 className="text-[11px] font-black text-text-tertiary uppercase tracking-widest px-1">Scroll Orientation</h3>
              
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setScrollOrientation('vertical')}
                  className={`flex flex-col items-center justify-center gap-3 p-4 rounded-2xl border-2 transition-all group ${
                    scrollOrientation === 'vertical'
                      ? 'border-accent-primary bg-accent-primary/5 text-accent-primary shadow-sm'
                      : 'border-border-default bg-bg-subtle/50 text-text-tertiary hover:border-text-tertiary/20 hover:bg-bg-subtle'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                    scrollOrientation === 'vertical' ? 'bg-accent-primary text-bg-elevated' : 'bg-bg-elevated text-text-tertiary group-hover:text-text-secondary'
                  }`}>
                    <ArrowUpDown size={20} strokeWidth={2.5} />
                  </div>
                  <span className="text-xs font-bold tracking-tight">Up & Down</span>
                </button>

                <button
                  onClick={() => setScrollOrientation('horizontal')}
                  className={`flex flex-col items-center justify-center gap-3 p-4 rounded-2xl border-2 transition-all group ${
                    scrollOrientation === 'horizontal'
                      ? 'border-accent-primary bg-accent-primary/5 text-accent-primary shadow-sm'
                      : 'border-border-default bg-bg-subtle/50 text-text-tertiary hover:border-text-tertiary/20 hover:bg-bg-subtle'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                    scrollOrientation === 'horizontal' ? 'bg-accent-primary text-bg-elevated' : 'bg-bg-elevated text-text-tertiary group-hover:text-text-secondary'
                  }`}>
                    <ArrowLeftRight size={20} strokeWidth={2.5} />
                  </div>
                  <span className="text-xs font-bold tracking-tight">Left & Right</span>
                </button>
              </div>
            </div>

            {/* Placeholder for more settings can be added here */}
          </div>
      </div>
    </aside>
  )
}

export default PageSettings
