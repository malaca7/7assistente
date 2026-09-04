import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl';
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl';
  className?: string;
  contentClassName?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  subtitle,
  children,
  footer,
  maxWidth,
  size,
  className,
  contentClassName,
}) => {
  // ESC key listener & body scroll locking
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const effectiveSize = size || maxWidth || 'md';

  const maxWidths = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto overflow-x-hidden p-2.5 sm:p-4 md:p-6 flex items-center justify-center animate-in fade-in duration-200">
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Responsive Dialog box constrained strictly within viewport */}
      <div
        className={cn(
          'relative w-full my-auto flex flex-col max-h-[calc(100dvh-1.25rem)] sm:max-h-[calc(100dvh-2.5rem)] bg-dark-900 border border-slate-700/80 rounded-2xl sm:rounded-3xl shadow-2xl shadow-black/80 overflow-hidden z-10 animate-in zoom-in-95 duration-200',
          maxWidths[effectiveSize],
          className
        )}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Fixed Header */}
        <div className="flex-shrink-0 flex items-start justify-between px-5 py-4 sm:px-6 sm:py-5 border-b border-white/10 bg-dark-900/95 backdrop-blur-md sticky top-0 z-20">
          <div className="pr-4 min-w-0">
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight leading-snug">
              {title}
            </h3>
            {(subtitle || description) && (
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                {subtitle || description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-white/10 active:scale-95 transition-all flex-shrink-0"
            title="Fechar (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className={cn('flex-1 overflow-y-auto overscroll-contain px-5 py-4 sm:px-6 sm:py-5', contentClassName)}>
          {children}
        </div>

        {/* Fixed / Sticky Footer (Optional) */}
        {footer && (
          <div className="flex-shrink-0 flex items-center justify-end gap-2.5 px-5 py-3.5 sm:px-6 sm:py-4 bg-dark-850/95 backdrop-blur-md border-t border-white/10 sticky bottom-0 z-20">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
