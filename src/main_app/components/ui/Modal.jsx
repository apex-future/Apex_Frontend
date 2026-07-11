import React from 'react';
import { createPortal } from 'react-dom';
import Button from './Button';

/**
 * Modal — Reusable modal
 * Props:
 *   isOpen: bool
 *   title: string
 *   message: string
 *   actions: Array of { label, onClick, variant }
 *     variant: 'primary' | 'danger' | 'ghost'
 *   onClose: fn
 */
export default function Modal({ isOpen, title, message, children, actions = [], onClose, hideOverlay = false }) {
  if (!isOpen) return null;

  console.log('[Modal] open | actions:', actions.length);

  const modalContent = (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center ${hideOverlay ? '' : 'bg-black/60 backdrop-blur-sm'}`}
      onClick={onClose}
    >
      {/* Modal card */}
      <div
        className="relative z-10 bg-bg-subtle dark:bg-bg-elevated border-t border-white/10 rounded-[20px] p-6 w-full max-w-sm mx-4 animate-in fade-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-text-primary font-bold text-lg font-display break-words shrink-0">{title}</h2>
        {message && (
          <p className="text-text-tertiary text-sm mt-2 leading-relaxed break-words whitespace-pre-wrap shrink-0">{message}</p>
        )}

        {children && (
          <div className="mt-4 overflow-y-auto custom-scrollbar min-h-0 -mx-2 px-2">
            {children}
          </div>
        )}

        {/* Actions row */}
        <div className="flex flex-col gap-2 mt-6 w-full">
          {actions.map((action, index) => (
            <Button
              key={index}
              variant={action.variant || 'ghost'}
              onClick={action.onClick}
              className="w-full !max-w-none py-3.5 text-sm font-semibold"
            >
              {action.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
