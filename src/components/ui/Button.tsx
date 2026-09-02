import React from 'react';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'brand' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-950 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]';

    const variants = {
      primary:
        'bg-primary-600 hover:bg-primary-500 text-white shadow-md shadow-black/60 focus:ring-primary-500 border border-primary-500/20',
      brand:
        'bg-brand-600 hover:bg-brand-500 text-white font-medium shadow-md shadow-black/60 focus:ring-brand-500 border border-brand-400/20',
      secondary:
        'bg-dark-800 hover:bg-dark-750 text-slate-200 border border-white/5 shadow-sm focus:ring-slate-600',
      outline:
        'bg-transparent hover:bg-dark-800 text-slate-300 hover:text-white border border-white/10 focus:ring-slate-600',
      ghost:
        'bg-transparent hover:bg-dark-800 text-slate-300 hover:text-white focus:ring-slate-600',
      danger:
        'bg-rose-700 hover:bg-rose-600 text-white shadow-md shadow-black/60 focus:ring-rose-500 border border-rose-500/20',
    };

    const sizes = {
      sm: 'text-xs px-3 py-1.5 gap-1.5',
      md: 'text-sm px-4 py-2.5 gap-2',
      lg: 'text-base px-6 py-3.5 gap-2.5',
      icon: 'p-2.5 aspect-square',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          leftIcon && <span className="flex-shrink-0">{leftIcon}</span>
        )}
        {children}
        {!isLoading && rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
