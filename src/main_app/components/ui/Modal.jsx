import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Button from './Button';

/**
 * Modal — Reusable modal with graceful, smooth entrance and exit animations.
 * Props:
 *   isOpen: bool
 *   title: string | ReactNode
 *   message: string
 *   actions: Array of { label, onClick, variant }
 *     variant: 'primary' | 'danger' | 'ghost'
 *   onClose: fn
 *   hideOverlay: bool
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
            className={`relative z-10 bg-bg-subtle dark:bg-bg-elevated border-t border-white/10 rounded-[20px] p-6 w-full max-w-sm mx-4 shadow-2xl shadow-black/30 dark:shadow-black/60 flex flex-col max-h-[90vh] ${className}`}
            onClick={(e) => e.stopPropagation()}
          >
            {typeof title === 'string' ? (
              <h2 className="text-text-primary font-bold text-lg font-display break-words shrink-0">{title}</h2>
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
            <div className="flex flex-col gap-2 mt-6 w-full">
              {actions.map((action, index) => (
                <Button
                  key={index}
                  variant={action.variant || 'ghost'}
                  onClick={action.onClick}
                  className="w-full !max-w-none py-3.5 text-sm font-semibold font-display"
                >
                  {action.label}
                </Button>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
