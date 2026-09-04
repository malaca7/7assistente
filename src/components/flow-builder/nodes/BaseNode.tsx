import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { cn } from '../../../lib/utils';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export interface BaseNodeProps {
  id: string;
  selected?: boolean;
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  iconBg: string;
  accentColor: string;
  hasInput?: boolean;
  hasOutput?: boolean;
  isConfigured?: boolean;
  children?: React.ReactNode;
  customOutputs?: Array<{ id: string; label: string; color?: string }>;
}

export const BaseNode: React.FC<BaseNodeProps> = ({
  selected,
  title,
  subtitle,
  icon,
  iconBg,
  accentColor,
  hasInput = true,
  hasOutput = true,
  isConfigured = true,
  children,
  customOutputs,
}) => {
  return (
    <div
      className={cn(
        'w-[310px] sm:w-[330px] rounded-2xl bg-gradient-to-b from-dark-900/95 to-dark-950/95 backdrop-blur-xl border transition-all duration-200 shadow-2xl relative select-none group/node',
        selected
          ? 'border-primary-400 ring-2 ring-primary-500/40 shadow-glow-primary scale-[1.01]'
          : 'border-white/10 hover:border-white/25 hover:shadow-cyan-950/30'
      )}
    >
      {/* Top Accent Strip */}
      <div className={cn('h-1.5 w-full rounded-t-2xl', accentColor)} />

      {/* Target Handle (Input) at Top - Centralized for Top-to-Bottom Flow */}
      {hasInput && (
        <Handle
          type="target"
          position={Position.Top}
          className="w-4 h-4 !bg-sky-400 !border-2 !border-dark-950 shadow-md -top-2 hover:!scale-125 transition-transform left-1/2 -translate-x-1/2 cursor-crosshair z-20"
          title="Entrada (Conectar fluxo aqui)"
        />
      )}

      {/* Node Header */}
      <div className="p-3.5 flex items-center justify-between gap-3 border-b border-white/5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={cn(
              'w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-md flex-shrink-0 transition-transform group-hover/node:scale-105',
              iconBg
            )}
          >
            {icon}
          </div>
          <div className="min-w-0">
            <h4 className="text-xs sm:text-sm font-bold text-white tracking-tight truncate">{title}</h4>
            {subtitle && <p className="text-[10.5px] text-slate-400 truncate">{subtitle}</p>}
          </div>
        </div>

        {/* Configuration status indicator */}
        <div className="flex items-center">
          {isConfigured ? (
            <span 
              title="Configurado e pronto" 
              className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-[9px] font-semibold text-emerald-400 shadow-sm"
            >
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>Pronto</span>
            </span>
          ) : (
            <span 
              title="Configuração pendente" 
              className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-950/60 border border-amber-500/30 text-[9px] font-semibold text-amber-400 shadow-sm animate-pulse"
            >
              <AlertCircle className="w-3 h-3 text-amber-400" />
              <span>Pendente</span>
            </span>
          )}
        </div>
      </div>

      {/* Node Body / Content preview */}
      {children && <div className="p-3 text-xs text-slate-300 space-y-2">{children}</div>}

      {/* Standard Source Handle (Output) at Bottom - Centralized for Top-to-Bottom Flow */}
      {hasOutput && !customOutputs && (
        <Handle
          type="source"
          position={Position.Bottom}
          className="w-4 h-4 !bg-primary-400 !border-2 !border-dark-950 shadow-md -bottom-2 hover:!scale-125 transition-transform left-1/2 -translate-x-1/2 cursor-crosshair z-20"
          title="Saída (Arraste para ligar ao próximo nó)"
        />
      )}

      {/* Custom Multiple Source Handles at Bottom (e.g. Buttons, IF Condition True/False, or Contact Status) */}
      {customOutputs && customOutputs.length > 0 && (
        <div className="border-t border-white/5 p-2 bg-dark-950/70 rounded-b-2xl">
          <div className={cn(
            'grid gap-1.5',
            customOutputs.length === 2 ? 'grid-cols-2' : customOutputs.length === 3 ? 'grid-cols-3' : 'grid-cols-1'
          )}>
            {customOutputs.map((out, index) => (
              <div 
                key={out.id} 
                className="relative flex flex-col items-center justify-center py-1.5 px-2 rounded-xl bg-dark-900/90 border border-white/10 hover:border-white/25 transition-all text-center group/btn"
              >
                <span className="text-[10px] font-semibold text-slate-200 truncate w-full px-0.5">
                  {out.label}
                </span>
                <span className="text-[8.5px] text-slate-500 font-mono">
                  Saída #{index + 1}
                </span>
                <Handle
                  id={out.id}
                  type="source"
                  position={Position.Bottom}
                  className={cn(
                    'w-3.5 h-3.5 !border-2 !border-dark-950 shadow-md -bottom-2 hover:!scale-125 transition-transform left-1/2 -translate-x-1/2 cursor-crosshair z-20',
                    out.color || '!bg-primary-400'
                  )}
                  title={`Saída: ${out.label} (Arraste para ligar)`}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

