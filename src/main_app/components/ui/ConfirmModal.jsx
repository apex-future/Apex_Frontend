import React from 'react';
import { createPortal } from 'react-dom';

/**
 * ConfirmModal — Reusable confirmation modal
 * Props:
 *   isOpen: bool
 *   title: string
 *   message: string
 *   actions: Array of { label, onClick, variant }
 *     variant: 'primary' | 'danger' | 'ghost'
 *   onClose: fn
 */
export default function ConfirmModal({ isOpen, title, message, actions = [], onClose, hideOverlay = false }) {
  if (!isOpen) return null;

  const getButtonClasses = (variant) => {
    switch (variant) {
      case 'danger':
        return 'w-full py-3.5 rounded-xl bg-error text-white font-semibold text-sm active:scale-95 transition-all';
      case 'primary':
        return 'w-full py-3.5 rounded-xl bg-accent-primary text-white font-semibold text-sm active:scale-95 transition-all';
      case 'ghost':
      default:
        return 'w-full py-3.5 rounded-xl bg-transparent text-text-secondary font-semibold text-sm active:scale-95 transition-all border border-text-tertiary/40 hover:bg-text-tertiary/10';
    }
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className={`absolute inset-0 ${hideOverlay ? 'bg-transparent' : 'bg-black/60 backdrop-blur-sm'}`} />

      {/* Modal card */}
      <div
        className="relative bg-surface-sunken dark:bg-surface-raised border-t border-text-tertiary/30 rounded-[20px] p-6 w-full max-w-sm mx-4 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-text-primary font-bold text-lg font-display break-words">{title}</h2>
        {message && (
          <p className="text-text-tertiary text-sm mt-2 leading-relaxed break-words whitespace-pre-wrap">{message}</p>
        )}

        {/* Actions row */}
        <div className="flex flex-col gap-2 mt-6">
          {actions.map((action, index) => (
            <button
              key={index}
              className={getButtonClasses(action.variant)}
              onClick={action.onClick}
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
