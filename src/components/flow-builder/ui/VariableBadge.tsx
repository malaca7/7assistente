import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { cn } from '../../../lib/utils';

export interface VariableBadgeProps {
  name: string;
  className?: string;
  showBrackets?: boolean;
}

export const VariableBadge: React.FC<VariableBadgeProps> = ({
  name,
  className,
  showBrackets = true,
}) => {
  const [copied, setCopied] = useState(false);
  const cleanName = name.replace(/^\{\{|\}\}$/g, '').trim();
  const fullVar = `{{${cleanName}}}`;

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      navigator.clipboard.writeText(fullVar);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error('Error copying variable:', err);
    }
  };

  return (
    <span
      onClick={handleCopy}
      title={`Clique para copiar ${fullVar}`}
      className={cn(
        'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md font-mono text-[10px] font-medium transition-all duration-150 cursor-pointer select-none group',
        copied
          ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/50 shadow-sm shadow-emerald-500/20'
          : 'bg-dark-950/80 text-cyan-300 border border-cyan-500/30 hover:border-cyan-400 hover:bg-cyan-950/60 hover:text-white',
        className
      )}
    >
      <span>{showBrackets ? fullVar : cleanName}</span>
      {copied ? (
        <Check className="w-3 h-3 text-emerald-400 animate-in zoom-in" />
      ) : (
        <Copy className="w-2.5 h-2.5 text-slate-400 group-hover:text-cyan-300 opacity-60 group-hover:opacity-100 transition-opacity" />
      )}
    </span>
  );
};
