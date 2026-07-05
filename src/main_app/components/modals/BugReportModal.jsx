import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X, Bug, PaintBrush, BookOpen, Robot, ArrowsClockwise,
  Lightning, DotsThree, WarningCircle, Warning, Fire,
  PaperPlaneTilt, CheckCircle, SpinnerGap, CaretDown
} from '@phosphor-icons/react';
import { APP_VERSION } from '../../constants/version';
import { showToastGlobal } from '../../hooks/useToast';

// ─── Category definitions ───────────────────────────────────────
const CATEGORIES = [
  { id: 'ui',          label: 'UI / Design',   icon: PaintBrush },
  { id: 'reading',     label: 'Reading',       icon: BookOpen },
  { id: 'ai',          label: 'AI / Cleo',     icon: Robot },
  { id: 'sync',        label: 'Sync',          icon: ArrowsClockwise },
  { id: 'performance', label: 'Performance',   icon: Lightning },
  { id: 'other',       label: 'Other',         icon: DotsThree },
];

// ─── Severity definitions ───────────────────────────────────────
const SEVERITIES = [
  {
    id: 'low',
    label: 'Low',
    desc: 'Cosmetic issue',
    icon: WarningCircle,
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/40',
    activeBg: 'bg-amber-500/15',
  },
  {
    id: 'medium',
    label: 'Medium',
    desc: 'Feature is broken',
    icon: Warning,
    color: 'text-orange-500',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/40',
    activeBg: 'bg-orange-500/15',
  },
  {
    id: 'high',
    label: 'High',
    desc: 'Crash or data loss',
    icon: Fire,
    color: 'text-red-500',
    bg: 'bg-red-500/10',
    border: 'border-red-500/40',
    activeBg: 'bg-red-500/15',
  },
];

export default function BugReportModal({ isOpen, onClose }) {
  // ─── Form state ─────────────────────────────────────────────
  const [category, setCategory] = useState('');
  const [severity, setSeverity] = useState('medium');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [steps, setSteps] = useState('');
  const [showSteps, setShowSteps] = useState(false);

  // ─── Submission state ───────────────────────────────────────
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // ─── Validation ─────────────────────────────────────────────
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!category) e.category = true;
    if (!title.trim()) e.title = true;
    if (!description.trim()) e.description = true;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ─── Reset form ─────────────────────────────────────────────
  const resetForm = () => {
    setCategory('');
    setSeverity('medium');
    setTitle('');
    setDescription('');
    setSteps('');
    setShowSteps(false);
    setSubmitting(false);
    setSubmitted(false);
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // ─── Submit handler (frontend-only for now) ─────────────────
  const handleSubmit = async () => {
    if (!validate()) return;

    setSubmitting(true);

    // Build the report payload (ready for API when backend is wired)
    const reportPayload = {
      category,
      title: title.trim(),
      description: description.trim(),
      steps_to_reproduce: steps.trim() || null,
      severity,
      app_version: APP_VERSION,
      user_agent: navigator.userAgent,
    };

    try {
      // TODO: Replace with actual API call when backend is ready
      // await apiClient.post('/api/bug-reports', reportPayload);
      console.log('[Apex] Bug report payload:', reportPayload);

      // Simulate network delay for the UX
      await new Promise((resolve) => setTimeout(resolve, 1200));

      setSubmitted(true);

      // Auto-close after showing success
      setTimeout(() => {
        handleClose();
        showToastGlobal('Bug report submitted — thank you! 🐛', 'success');
      }, 1800);
    } catch (err) {
      console.error('[Apex] Failed to submit bug report:', err);
      showToastGlobal('Failed to submit report. Please try again.', 'error');
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  // ─── Success state ────────────────────────────────────────────
  if (submitted) {
    return createPortal(
      <div
        className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center"
        onClick={handleClose}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        <div
          className="relative bg-bg-elevated border border-border-default rounded-card p-8 w-full max-w-sm mx-4 shadow-2xl animate-in fade-in zoom-in-95 duration-300 flex flex-col items-center text-center"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-16 h-16 rounded-full bg-emerald-500/15 flex items-center justify-center mb-4 animate-in zoom-in-50 duration-500">
            <CheckCircle size={36} weight="fill" className="text-emerald-500" />
          </div>
          <h2 className="text-text-primary font-bold text-lg font-display">Report Sent!</h2>
          <p className="text-text-tertiary text-sm mt-2 leading-relaxed">
            Thanks for helping us improve Apex.<br />We'll look into this soon.
          </p>
        </div>
      </div>,
      document.body
    );
  }

  // ─── Main form ────────────────────────────────────────────────
  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center sm:p-4"
      onClick={handleClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-md animate-in fade-in duration-300" />

      {/* Modal card */}
      <div
        className="relative bg-surface border border-border-default rounded-t-[2rem] sm:rounded-card p-6 w-full sm:max-w-[420px] mx-0 max-h-[88dvh] flex flex-col shadow-aura-lg animate-in fade-in slide-in-from-bottom-8 sm:zoom-in-95 duration-300 apple"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ─────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-6 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-brand-subtle">
              <Bug size={22} weight="fill" className="text-brand" />
            </div>
            <div>
              <h2 className="text-text-primary font-bold text-lg font-display tracking-tight">Report a Bug</h2>
              <p className="text-text-secondary text-xs mt-0.5 font-medium">Help us make Apex better</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2.5 rounded-full hover:bg-surface-sunken transition-colors text-text-tertiary hover:text-text-primary active:scale-95"
          >
            <X size={18} weight="bold" />
          </button>
        </div>

        {/* ── Category Pills ─────────────────────────────────── */}
        <div className="mb-5 shrink-0">
          <label className="text-xs font-semibold text-text-secondary mb-2 block uppercase tracking-wider">
            Category {errors.category && <span className="text-red-500 ml-1 normal-case tracking-normal">— required</span>}
          </label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isActive = category === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => { setCategory(cat.id); setErrors((e) => ({ ...e, category: false })); }}
                  className={`
                    flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold
                    transition-all duration-200 border
                    ${isActive
                      ? 'bg-brand-subtle text-brand border-brand/30 shadow-sm scale-[1.02]'
                      : 'bg-surface-sunken text-text-secondary border-transparent hover:bg-surface-raised hover:border-border-default'
                    }
                  `}
                >
                  <Icon size={16} weight={isActive ? 'fill' : 'bold'} />
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Scrollable Form Content ─────────────────────────── */}
        <div className="overflow-y-auto custom-scrollbar pr-2 -mr-2 flex-1 space-y-5">
          {/* ── Title ───────────────────────────────────────────── */}
          <div>
            <label className="text-xs font-semibold text-text-secondary mb-2 block uppercase tracking-wider">
              Issue Summary {errors.title && <span className="text-red-500 ml-1 normal-case tracking-normal">— required</span>}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => { setTitle(e.target.value); setErrors((prev) => ({ ...prev, title: false })); }}
              placeholder="e.g. Page doesn't load after login"
              maxLength={120}
              className={`
                w-full px-4 py-3 rounded-xl text-sm font-medium text-text-primary placeholder:text-text-placeholder
                bg-surface-sunken border transition-all duration-200 outline-none
                focus:ring-2 focus:ring-brand/30 focus:border-brand/60
                ${errors.title ? 'border-red-500' : 'border-border-default hover:border-border-subtle'}
              `}
            />
          </div>

          {/* ── Description ─────────────────────────────────────── */}
          <div>
            <label className="text-xs font-semibold text-text-secondary mb-2 block uppercase tracking-wider">
              Description {errors.description && <span className="text-red-500 ml-1 normal-case tracking-normal">— required</span>}
            </label>
            <textarea
              value={description}
              onChange={(e) => { setDescription(e.target.value); setErrors((prev) => ({ ...prev, description: false })); }}
              placeholder="What happened? What did you expect instead?"
              rows={3}
              maxLength={1000}
              className={`
                w-full px-4 py-3 rounded-xl text-sm font-medium text-text-primary placeholder:text-text-placeholder
                bg-surface-sunken border transition-all duration-200 outline-none resize-none
                focus:ring-2 focus:ring-brand/30 focus:border-brand/60
                ${errors.description ? 'border-red-500' : 'border-border-default hover:border-border-subtle'}
              `}
            />
          </div>

          {/* ── Steps to Reproduce (collapsible) ────────────────── */}
          <div>
            <button
              onClick={() => setShowSteps(!showSteps)}
              className="flex items-center gap-1.5 text-xs font-bold text-text-tertiary hover:text-text-secondary transition-colors"
            >
              <CaretDown
                size={14}
                weight="bold"
                className={`transition-transform duration-200 ${showSteps ? 'rotate-180' : ''}`}
              />
              Steps to reproduce
              <span className="text-[10px] font-medium opacity-60 ml-1">(optional)</span>
            </button>
            {showSteps && (
              <div className="mt-3 animate-in fade-in slide-in-from-top-2 duration-300 apple">
                <textarea
                  value={steps}
                  onChange={(e) => setSteps(e.target.value)}
                  placeholder={"1. Go to...\n2. Click on...\n3. See error..."}
                  rows={3}
                  maxLength={1000}
                  className="
                    w-full px-4 py-3 rounded-xl text-sm font-medium text-text-primary placeholder:text-text-placeholder
                    bg-surface-sunken border border-border-default hover:border-border-subtle
                    transition-all duration-200 outline-none resize-none
                    focus:ring-2 focus:ring-brand/30 focus:border-brand/60
                  "
                />
              </div>
            )}
          </div>

          {/* ── Severity Selector ───────────────────────────────── */}
          <div>
            <label className="text-xs font-semibold text-text-secondary mb-2 block uppercase tracking-wider">Severity</label>
            <div className="grid grid-cols-3 gap-2.5">
              {SEVERITIES.map((sev) => {
                const Icon = sev.icon;
                const isActive = severity === sev.id;
                return (
                  <button
                    key={sev.id}
                    onClick={() => setSeverity(sev.id)}
                    className={`
                      flex flex-col items-center gap-1.5 p-3 rounded-[1rem] border-2 transition-all duration-200
                      ${isActive
                        ? `${sev.activeBg} ${sev.border} ${sev.color} shadow-sm scale-[1.02]`
                        : 'border-border-default bg-surface text-text-tertiary hover:border-border-subtle hover:bg-surface-raised'
                      }
                    `}
                  >
                    <Icon size={20} weight={isActive ? 'fill' : 'duotone'} />
                    <span className="text-xs font-bold">{sev.label}</span>
                    <span className={`text-[10px] font-medium leading-tight text-center px-1 ${isActive ? 'opacity-90' : 'opacity-60'}`}>{sev.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Metadata & Submit (Sticky Bottom) ───────────────── */}
        <div className="shrink-0 mt-5 pt-5 border-t border-border-default flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-[10px] font-medium text-text-tertiary bg-surface-sunken border border-border-default px-2.5 py-1.5 rounded-lg">
              <span>v{APP_VERSION}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-medium text-text-tertiary bg-surface-sunken border border-border-default px-2.5 py-1.5 rounded-lg truncate max-w-[200px]">
              <span className="truncate">{navigator.userAgent.includes('Mobile') ? 'Mobile' : 'Desktop'} • {/Chrome|Firefox|Safari|Edge/.exec(navigator.userAgent)?.[0] || 'Browser'}</span>
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className={`
              w-full py-3.5 rounded-[1rem] font-bold text-sm transition-all duration-300 apple
              flex items-center justify-center gap-2
              ${submitting
                ? 'bg-brand/50 text-white/80 cursor-not-allowed'
                : 'bg-brand text-white hover:brightness-110 active:scale-95 shadow-aura-md shadow-brand/20'
              }
            `}
          >
            {submitting ? (
              <>
                <SpinnerGap size={20} weight="bold" className="animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <PaperPlaneTilt size={20} weight="fill" />
                Submit Bug Report
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
