import React from 'react';
import { FlowNode, FlowEdge } from '../../types';
import { 
  MessageSquare, 
  ListTree, 
  HelpCircle, 
  Zap, 
  Clock, 
  UserCheck, 
  ChevronDown, 
  Plus, 
  ArrowDown, 
  Play, 
  CheckCircle2,
  FileText,
  Smartphone
} from 'lucide-react';
import { Button } from '../ui/Button';

interface FlowTimelineMobileProps {
  nodes: FlowNode[];
  edges: FlowEdge[];
  onSelectNode: (node: FlowNode) => void;
  onAddNode: (type: FlowNode['type']) => void;
  onOpenTestSimulator: () => void;
}

export const FlowTimelineMobile: React.FC<FlowTimelineMobileProps> = ({
  nodes,
  edges,
  onSelectNode,
  onAddNode,
  onOpenTestSimulator,
}) => {
  const getNodeColor = (type: string) => {
    switch (type) {
      case 'message': return 'border-primary-500/40 bg-primary-950/20 text-primary-400';
      case 'menu': return 'border-cyan-500/40 bg-cyan-950/20 text-cyan-400';
      case 'question': return 'border-amber-500/40 bg-amber-950/20 text-amber-400';
      case 'action': return 'border-emerald-500/40 bg-emerald-950/20 text-emerald-400';
      case 'delay': return 'border-purple-500/40 bg-purple-950/20 text-purple-400';
      case 'transfer': return 'border-rose-500/40 bg-rose-950/20 text-rose-400';
      default: return 'border-slate-700 bg-slate-900 text-slate-300';
    }
  };

  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'message': return <MessageSquare className="w-4 h-4" />;
      case 'menu': return <ListTree className="w-4 h-4" />;
      case 'question': return <HelpCircle className="w-4 h-4" />;
      case 'action': return <Zap className="w-4 h-4" />;
      case 'delay': return <Clock className="w-4 h-4" />;
      case 'transfer': return <UserCheck className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6 pb-24 animate-in fade-in duration-300">
      {/* Mobile Flow Quick Actions */}
      <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-dark-900 border border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-brand-400 animate-pulse" />
          <span className="text-xs font-bold text-white">Visualização de Etapas</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-bold">
            {nodes.length} nós
          </span>
        </div>

        <Button
          type="button"
          size="sm"
          variant="brand"
          onClick={onOpenTestSimulator}
          leftIcon={<Smartphone className="w-3.5 h-3.5" />}
        >
          Testar
        </Button>
      </div>

      {/* Nodes Vertical Flow Cards */}
      <div className="relative space-y-4">
        {/* Continuous Connecting Line */}
        <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-gradient-to-b from-primary-500 via-brand-500 to-slate-800 -z-0" />

        {nodes.map((node, index) => {
          const isFirst = index === 0;
          const nodeColor = getNodeColor(node.type);
          const icon = getNodeIcon(node.type);

          return (
            <div key={node.id} className="relative z-10 space-y-3">
              {/* Node Card */}
              <div
                onClick={() => onSelectNode(node)}
                className={`p-4 rounded-2xl bg-dark-900/95 backdrop-blur-xl border ${nodeColor} shadow-lg active:scale-[0.98] transition-all cursor-pointer space-y-3`}
              >
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`p-2 rounded-xl border ${nodeColor}`}>
                      {icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        {isFirst && (
                          <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-400 border border-brand-500/30">
                            INÍCIO
                          </span>
                        )}
                        <h4 className="text-sm font-bold text-white tracking-tight">
                          {node.data?.label || `Etapa #${index + 1}`}
                        </h4>
                      </div>
                      <span className="text-[10px] text-slate-400 capitalize font-medium">
                        Tipo: {node.type}
                      </span>
                    </div>
                  </div>

                  <span className="text-[10px] font-bold text-primary-400 bg-primary-950/60 px-2 py-1 rounded-lg border border-primary-800/40">
                    Toque p/ Editar
                  </span>
                </div>

                {/* Content Preview */}
                {(node.data?.content || node.data?.text) && (
                  <div className="p-3 rounded-xl bg-dark-950/80 border border-slate-800 text-xs text-slate-200 leading-relaxed font-sans line-clamp-3">
                    {node.data.content || node.data.text}
                  </div>
                )}

                {/* Options Preview for Menu Nodes */}
                {node.type === 'menu' && node.data?.options && node.data.options.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] font-bold text-cyan-300 uppercase tracking-wider">Opções do Menu:</span>
                    <div className="grid grid-cols-1 gap-1">
                      {node.data.options.map((opt: string, optIdx: number) => (
                        <div
                          key={optIdx}
                          className="px-2.5 py-1.5 rounded-lg bg-dark-950 border border-cyan-900/40 text-xs font-semibold text-cyan-200 truncate flex items-center gap-2"
                        >
                          <span className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                            {optIdx + 1}
                          </span>
                          <span className="truncate">{opt}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Step Flow Arrow Connector */}
              {index < nodes.length - 1 && (
                <div className="flex items-center justify-center py-1">
                  <div className="w-6 h-6 rounded-full bg-dark-850 border border-slate-700 flex items-center justify-center text-slate-400 shadow-md">
                    <ArrowDown className="w-3.5 h-3.5" />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
