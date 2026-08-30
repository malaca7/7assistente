import React from 'react';
import { cn } from '../../lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glass?: boolean;
  hoverEffect?: boolean;
}

export const Card: React.FC<CardProps> = ({
  className,
  glass = true,
  hoverEffect = false,
  children,
  ...props
}) => {
  return (
    <div
      className={cn(
        'rounded-2xl border p-6 transition-all duration-300',
        glass
          ? 'bg-dark-900/80 backdrop-blur-xl border-white/5 shadow-xl'
          : 'bg-dark-900 border-slate-800/80 shadow-lg',
        hoverEffect &&
          'hover:border-primary-500/30 hover:shadow-glow-primary/10 hover:-translate-y-0.5',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => {
  return (
    <div className={cn('flex items-center justify-between pb-4 mb-4 border-b border-white/5', className)} {...props}>
      {children}
    </div>
  );
};

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  className,
  children,
  ...props
}) => {
  return (
    <h3 className={cn('text-lg font-semibold text-white tracking-tight', className)} {...props}>
      {children}
    </h3>
  );
};
