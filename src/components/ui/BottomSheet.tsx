import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  maxHeight?: string;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxHeight = 'max-h-[85vh]',
}) => {
  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
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

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Sheet content */}
      <div
        className={`relative z-10 w-full bg-dark-900 border-t border-slate-700/80 rounded-t-3xl shadow-2xl flex flex-col ${maxHeight} animate-in slide-in-from-bottom duration-300`}
        style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
      >
        {/* Drag Handle indicator */}
        <div className="w-full flex items-center justify-center pt-3 pb-1 cursor-grab" onClick={onClose}>
          <div className="w-12 h-1.5 rounded-full bg-slate-600/60" />
        </div>

        {/* Header */}
        {(title || subtitle) && (
          <div className="px-5 py-3 border-b border-slate-800/80 flex items-center justify-between">
            <div>
              {title && <h3 className="text-base font-bold text-white tracking-tight">{title}</h3>}
              {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 active:scale-95 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-5 space-y-4">
          {children}
        </div>
      </div>
    </div>
  );
};
