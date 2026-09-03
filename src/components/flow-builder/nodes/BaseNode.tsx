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
        'w-72 sm:w-80 rounded-2xl bg-dark-900/95 backdrop-blur-xl border transition-all duration-200 shadow-2xl relative select-none',
        selected
          ? 'border-primary-400 ring-2 ring-primary-500/40 shadow-glow-primary scale-[1.02]'
          : 'border-white/10 hover:border-white/20'
      )}
    >
      {/* Top Accent Strip */}
      <div className={cn('h-1.5 w-full rounded-t-2xl', accentColor)} />

      {/* Target Handle (Input) - Larger touch area */}
      {hasInput && (
        <Handle
          type="target"
          position={Position.Left}
          className="w-4 h-4 !bg-sky-400 !border-2 !border-dark-950 shadow-md -left-2 hover:!scale-125 transition-transform"
          title="Entrada (Conectar aqui)"
        />
      )}

      {/* Node Header */}
      <div className="p-3.5 flex items-center justify-between gap-3 border-b border-white/5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={cn(
              'w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-sm flex-shrink-0',
              iconBg
            )}
          >
            {icon}
          </div>
          <div className="min-w-0">
            <h4 className="text-xs sm:text-sm font-bold text-white tracking-tight truncate">{title}</h4>
            {subtitle && <p className="text-[11px] text-slate-400 truncate">{subtitle}</p>}
          </div>
        </div>

        {/* Configuration status indicator */}
        <div className="flex items-center gap-1">
          {isConfigured ? (
            <span title="Configurado com sucesso">
              <CheckCircle2 className="w-4 h-4 text-brand-400" />
            </span>
          ) : (
            <span title="Configuração pendente" className="flex items-center gap-1">
              <AlertCircle className="w-4 h-4 text-amber-400 animate-pulse" />
            </span>
          )}
        </div>
      </div>

      {/* Node Body / Content preview */}
      {children && <div className="p-3.5 text-xs text-slate-300 space-y-2">{children}</div>}

      {/* Standard Source Handle (Output) - Larger touch area */}
      {hasOutput && !customOutputs && (
        <Handle
          type="source"
          position={Position.Right}
          className="w-4 h-4 !bg-primary-400 !border-2 !border-dark-950 shadow-md -right-2 hover:!scale-125 transition-transform"
          title="Saída (Arraste ou clique para ligar)"
        />
      )}

      {/* Custom Multiple Source Handles (e.g. Buttons or IF Condition branches) */}
      {customOutputs && customOutputs.length > 0 && (
        <div className="border-t border-white/5 py-2 px-3 space-y-2 bg-dark-950/50 rounded-b-2xl">
          {customOutputs.map((out) => (
            <div key={out.id} className="relative flex items-center justify-between text-[11px] text-slate-300 py-1">
              <span className="truncate pr-5 font-medium">{out.label}</span>
              <Handle
                id={out.id}
                type="source"
                position={Position.Right}
                className={cn(
                  'w-4 h-4 !border-2 !border-dark-950 shadow-md -right-2 hover:!scale-125 transition-transform',
                  out.color || '!bg-primary-400'
                )}
                title={`Saída: ${out.label}`}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
