import React from 'react';
import { CheckCircle, WarningDiamond, Warning, Info, X } from '@phosphor-icons/react';

const ICONS = {
  success: <CheckCircle size={20} weight="fill" className="shrink-0" />,
  error:   <WarningDiamond size={20} weight="fill" className="shrink-0" />,
  warning: <Warning size={20} weight="fill" className="shrink-0 text-yellow-200" />,
  info:    <Info size={20} weight="fill" className="shrink-0" />,
};

const TYPE_STYLES = {
  success: 'bg-emerald-600/90 text-white border-emerald-500/50',
  error: 'bg-red-600/90 text-white border-red-500/50',
  warning: 'bg-amber-600/90 text-white border-amber-500/50',
  info: 'bg-purple-600/90 text-white border-purple-500/50',
};

function ToastItem({ toast, onDismiss }) {
  const { id, message, type = 'info', exiting } = toast;

  return (
    <div
      className={`
        flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg backdrop-blur-sm
        w-[70vw] max-w-[350px]
        transition-all duration-300 ease-out
        ${exiting ? 'opacity-0 translate-y-2 scale-95' : 'opacity-100 translate-y-0 scale-100'}
        ${TYPE_STYLES[type] || TYPE_STYLES.info}
      `}
      role="alert"
    >
      {ICONS[type]}
      <p className="text-sm font-medium flex-1 leading-snug">{message}</p>
      <button
        onClick={() => onDismiss(id)}
        className="shrink-0 p-1 rounded-lg hover:bg-white/20 transition-colors"
        aria-label="Dismiss"
      >
        <X size={16} weight="bold" />
      </button>
    </div>
  );
}

export default function ToastContainer({ toasts, removeToast }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <>
      {/* Mobile: bottom-center */}
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[9999] flex flex-col-reverse gap-2 sm:hidden pointer-events-none">
        {toasts.map(toast => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastItem toast={toast} onDismiss={removeToast} />
          </div>
        ))}
      </div>
      {/* Desktop: top-right */}
      <div className="fixed top-6 right-6 z-[9999] hidden sm:flex flex-col gap-2 pointer-events-none">
        {toasts.map(toast => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastItem toast={toast} onDismiss={removeToast} />
          </div>
        ))}
      </div>
    </>
  );
}
