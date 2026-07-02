import React, { useState } from 'react'
import { X, CaretLeft, ArrowsVertical, ArrowsHorizontal, Gear, SlidersHorizontal } from '@phosphor-icons/react';
import useSettingsStore from '../../../../store/settingsStore';

function PageSettings({ setPageSettings, readerControls }) {
  const [activeSection, setActiveSection] = useState(null);
  const { scrollOrientation = 'vertical', setScrollOrientation } = readerControls || {};

  const {
    pageAnimations,
    scrollAnimation,
    updateSetting,
  } = useSettingsStore();

  const handleOrientationChange = (orientation) => {
    readerControls?.setScrollOrientation?.(orientation);
    updateSetting('scrollOrientation', orientation);
  };

  const sections = [
    { id: 'orientation', label: 'Scroll Orientation', icon: SlidersHorizontal }
  ];

  return (
    <aside
      className="flex flex-col absolute inset-0 z-[200] bg-white md:relative md:inset-auto md:w-80 md:h-full md:border-0 md:shrink-0 font-sans shadow-sm hover:shadow-md transition-shadow animate-in slide-in-from-left duration-300"
      onClick={(e) => e.stopPropagation()}
    >
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-5 py-5 shrink-0">
        {activeSection ? (
          <button
            onClick={() => setActiveSection(null)}
            className="flex items-center gap-2 text-base font-bold text-text-primary hover:text-accent-primary transition-colors"
          >
            <CaretLeft size={18} weight="bold" />
            {activeSection === 'orientation' ? 'Scroll Orientation' : 'Gear'}
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <Gear size={18} weight="bold" className="text-text-tertiary" />
            <h2 className="text-xs font-black text-text-tertiary tracking-[0.2em] uppercase">Settings</h2>
          </div>
        )}
        <button
          onClick={() => setPageSettings(false)}
          className="p-2 rounded-full bg-bg-subtle hover:bg-bg-subtle transition-all text-text-tertiary hover:text-text-secondary"
        >
          <X size={18} weight="bold" />
        </button>
      </div>

      {/* ── Body ── */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
          <div className="flex flex-col gap-6">

            {/* Page Animation Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-[11px] font-black text-text-tertiary uppercase tracking-widest">
                  Page Animation
                </h3>
                {/* Toggle */}
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={pageAnimations}
                    onChange={(e) => updateSetting('pageAnimations', e.target.checked)}
                  />
                  <div className="w-9 h-5 bg-gray-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-accent-primary" />
                </label>
              </div>

              {/* Animation choice boxes — only when pageAnimations is ON */}
              {pageAnimations && (
                <div className="grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
                  <button
                    onClick={() => updateSetting('scrollAnimation', 'slide')}
                    className={`flex flex-col items-center justify-center gap-2 p-3 rounded-2xl border transition-all group ${
                      scrollAnimation === 'slide'
                        ? 'border-accent-primary bg-accent-primary/5 text-accent-primary'
                        : 'border-black/10 dark:border-white/10 bg-bg-subtle/50 text-text-tertiary hover:border-text-tertiary/20'
                    }`}
                  >
                    {/* Slide icon */}
                    <div className="relative w-8 h-6 overflow-hidden rounded">
                      <div className="absolute inset-0 bg-bg-elevated rounded border border-border-default" />
                      <div className="absolute inset-0 translate-x-1 bg-accent-primary/20 rounded border border-accent-primary/40" />
                    </div>
                    <span className="text-[10px] font-bold tracking-tight">Smooth Slide</span>
                  </button>

                  <button
                    onClick={() => updateSetting('scrollAnimation', 'fade')}
                    className={`flex flex-col items-center justify-center gap-2 p-3 rounded-2xl border transition-all group ${
                      scrollAnimation === 'fade'
                        ? 'border-accent-primary bg-accent-primary/5 text-accent-primary'
                        : 'border-black/10 dark:border-white/10 bg-bg-subtle/50 text-text-tertiary hover:border-text-tertiary/20'
                    }`}
                  >
                    {/* Fade icon */}
                    <div className="relative w-8 h-6">
                      <div className="absolute inset-0 bg-bg-elevated rounded border border-border-default opacity-40" />
                      <div className="absolute inset-0 bg-accent-primary/20 rounded border border-accent-primary/40 opacity-80" />
                    </div>
                    <span className="text-[10px] font-bold tracking-tight">Fade Through</span>
                  </button>
                </div>
              )}
            </div>

            {/* Scroll Orientation Section */}
            <div className="space-y-4">
              <h3 className="text-[11px] font-black text-text-tertiary uppercase tracking-widest px-1">Scroll Orientation</h3>
              
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleOrientationChange('vertical')}
                  className={`flex flex-col items-center justify-center gap-3 p-4 rounded-2xl border transition-all group ${
                    scrollOrientation === 'vertical'
                      ? 'border-accent-primary bg-accent-primary/5 text-accent-primary shadow-sm'
                      : 'border-black/10 dark:border-white/10 bg-bg-subtle/50 text-text-tertiary hover:border-text-tertiary/20 hover:bg-bg-subtle'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                    scrollOrientation === 'vertical' ? 'bg-accent-primary text-bg-elevated' : 'bg-bg-elevated text-text-tertiary group-hover:text-text-secondary'
                  }`}>
                    <ArrowsVertical size={20} weight="bold" />
                  </div>
                  <span className="text-xs font-bold tracking-tight">Up & Down</span>
                </button>

                <button
                  onClick={() => handleOrientationChange('horizontal')}
                  className={`flex flex-col items-center justify-center gap-3 p-4 rounded-2xl border transition-all group ${
                    scrollOrientation === 'horizontal'
                      ? 'border-accent-primary bg-accent-primary/5 text-accent-primary shadow-sm'
                      : 'border-black/10 dark:border-white/10 bg-bg-subtle/50 text-text-tertiary hover:border-text-tertiary/20 hover:bg-bg-subtle'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                    scrollOrientation === 'horizontal' ? 'bg-accent-primary text-bg-elevated' : 'bg-bg-elevated text-text-tertiary group-hover:text-text-secondary'
                  }`}>
                    <ArrowsHorizontal size={20} weight="bold" />
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
