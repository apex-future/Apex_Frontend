import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from '@phosphor-icons/react';
import Button from './Button';

/**
 * Modal — Reusable modal with graceful, smooth entrance and exit animations.
 * Props:
 *   isOpen: bool
 *   title: string | ReactNode
 *   message: string
 *   actions: Array of { label, onClick, variant, disabled, className, id, type }
 *     variant: 'primary' | 'danger' | 'ghost'
 *   onClose: fn
 *   hideOverlay: bool
 *   showCloseButton: bool
 *   maxWidth: string (default 'max-w-sm')
 *   className: string
 */
export default function Modal({
  isOpen,
  title,
  message,
  children,
  actions = [],
  onClose,
  hideOverlay = false,
  showCloseButton = false,
  maxWidth = 'max-w-sm',
  className = ''
}) {
  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-auto">
          {/* Backdrop Blur Overlay */}
          {!hideOverlay && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={onClose}
            />
          )}

          {/* Modal Card with Graceful Spring / Ease Entrance */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{
              duration: 0.28,
              ease: [0.16, 1, 0.3, 1], // Fluid cubic-bezier ease
            }}
            className={`relative z-10 bg-bg-subtle dark:bg-bg-elevated border-t border-white/10 rounded-[20px] p-6 w-full ${maxWidth} mx-4 shadow-2xl shadow-black/30 dark:shadow-black/60 flex flex-col max-h-[90vh] ${className}`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Optional Close Button */}
            {showCloseButton && onClose && (
              <button
                type="button"
                onClick={onClose}
                className="absolute top-5 right-5 p-1.5 rounded-xl text-text-tertiary hover:text-text-primary hover:bg-black/5 dark:hover:bg-white/10 transition-colors z-20 active:scale-95"
                aria-label="Close"
              >
                <X size={18} weight="bold" />
              </button>
            )}

            {typeof title === 'string' ? (
              <h2 className="text-text-primary font-bold text-lg font-display break-words shrink-0 pr-8">{title}</h2>
            ) : (
              <div className="shrink-0 w-full">{title}</div>
            )}
            {message && (
              <p className="text-text-tertiary text-sm mt-2 leading-relaxed break-words whitespace-pre-wrap shrink-0">{message}</p>
            )}

            {children && (
              <div className="mt-4 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden min-h-0 -mx-2 px-2">
                {children}
              </div>
            )}

            {/* Actions row */}
            {actions && actions.length > 0 && (
              <div className="flex flex-col gap-2 mt-6 w-full shrink-0">
                {actions.map((action, index) => (
                  <Button
                    key={index}
                    id={action.id}
                    type={action.type || 'button'}
                    variant={action.variant || 'ghost'}
                    onClick={action.onClick}
                    disabled={action.disabled}
                    className={`w-full !max-w-none py-3.5 text-sm font-semibold font-display ${action.className || ''}`}
                  >
                    {action.label}
                  </Button>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
