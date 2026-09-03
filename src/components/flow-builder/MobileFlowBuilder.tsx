import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  ArrowLeft, 
  Play, 
  Pause, 
  Save, 
  Check, 
  Trash2, 
  Copy, 
  ChevronUp, 
  ChevronDown, 
  Edit3, 
  ArrowRight, 
  Sparkles, 
  Zap, 
  MessageSquare, 
  ListChecks, 
  HelpCircle, 
  Calendar, 
  DollarSign, 
  Users, 
  Clock, 
  GitBranch, 
  Bot, 
  Tag, 
  CheckCircle2, 
  Sliders, 
  Eye, 
  Layout, 
  X
} from 'lucide-react';
import { Flow, FlowNode, FlowEdge, NodeTypeEnum, FlowNodeData } from '../../types';
import { NODE_DEFINITIONS, NodeDefinition, CATEGORY_INFO } from './NodePalette';
import { NodeInspector } from './NodeInspector';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { useToast } from '../../contexts/ToastContext';

export interface MobileFlowBuilderProps {
  flow: Flow;
  nodes: FlowNode[];
  edges: FlowEdge[];
  onUpdateNodes: (nodes: FlowNode[]) => void;
  onUpdateEdges: (edges: FlowEdge[]) => void;
  onSave: () => Promise<void>;
  onToggleStatus: () => Promise<void>;
  isSaving: boolean;
  isDirty?: boolean;
  onOpenSimulator: () => void;
  onBack: () => void;
  onSwitchToCanvas: () => void;
}

export const MobileFlowBuilder: React.FC<MobileFlowBuilderProps> = ({
  flow,
  nodes,
  edges,
  onUpdateNodes,
  onUpdateEdges,
  onSave,
  onToggleStatus,
  isSaving,
  isDirty,
  onOpenSimulator,
  onBack,
  onSwitchToCanvas,
}) => {
  const { success, info } = useToast();
  const [selectedNode, setSelectedNode] = useState<FlowNode | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [insertAfterNodeId, setInsertAfterNodeId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const isPublished = flow.status === 'published';

  // Sort nodes in logical execution sequence starting from Trigger
  const orderedNodes = useMemo(() => {
    if (!nodes || nodes.length === 0) return [];
    
    const trigger = nodes.find(n => (n.data?.nodeType || n.type) === 'trigger') || nodes[0];
    const ordered: FlowNode[] = [];
    const visited = new Set<string>();

    function traverse(nodeId: string) {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);
      const node = nodes.find(n => n.id === nodeId);
      if (node) {
        ordered.push(node);
        const outgoing = edges.filter(e => e.source === nodeId);
        outgoing.forEach(e => traverse(e.target));
      }
    }

    if (trigger) traverse(trigger.id);

    // Append any unlinked nodes
    nodes.forEach(n => {
      if (!visited.has(n.id)) {
        ordered.push(n);
      }
    });

    return ordered;
  }, [nodes, edges]);

  // Helper to get node icon & details
  const getNodeMeta = (node: FlowNode) => {
    const type = (node.data?.nodeType || node.type) as NodeTypeEnum;
    const def = NODE_DEFINITIONS.find(d => d.type === type);
    return def || {
      label: node.data?.label || 'Etapa',
      icon: <MessageSquare className="w-4 h-4" />,
      iconBg: 'bg-primary-600',
      description: 'Ação do fluxo',
    };
  };

  // Helper to re-layout coordinates after list modifications
  const recomputePositionsAndSync = (newNodes: FlowNode[], newEdges: FlowEdge[]) => {
    const START_X = 80;
    const START_Y = 120;
    const HORIZONTAL_STEP = 380;
    
    const layouted = newNodes.map((n, idx) => ({
      ...n,
      position: { x: START_X + idx * HORIZONTAL_STEP, y: START_Y },
    }));

    onUpdateNodes(layouted);
    onUpdateEdges(newEdges);
  };

  // 1. Add Node
  const handleSelectNodeTypeToAdd = (def: NodeDefinition) => {
    const newNodeId = `node-${def.type}-${Date.now()}`;
    const newNode: FlowNode = {
      id: newNodeId,
      type: def.type,
      position: { x: 0, y: 0 },
      data: {
        label: def.label,
        nodeType: def.type,
        description: def.description,
        isConfigured: true,
        config: { ...def.defaultConfig },
      } as FlowNodeData,
    };

    let nextNodes = [...nodes, newNode];
    let nextEdges = [...edges];

    if (insertAfterNodeId) {
      // Find existing edge from insertAfterNodeId
      const oldEdgeIndex = nextEdges.findIndex(e => e.source === insertAfterNodeId);
      if (oldEdgeIndex >= 0) {
        const targetOfOld = nextEdges[oldEdgeIndex].target;
        // Point previous node to new node
        nextEdges[oldEdgeIndex] = {
          ...nextEdges[oldEdgeIndex],
          target: newNodeId,
        };
        // Point new node to old target
        nextEdges.push({
          id: `xy-edge__${newNodeId}-${targetOfOld}`,
          source: newNodeId,
          target: targetOfOld,
        });
      } else {
        // Just link previous to new
        nextEdges.push({
          id: `xy-edge__${insertAfterNodeId}-${newNodeId}`,
          source: insertAfterNodeId,
          target: newNodeId,
        });
      }
    } else if (nodes.length > 0) {
      // Link last node to new node
      const lastNode = nodes[nodes.length - 1];
      nextEdges.push({
        id: `xy-edge__${lastNode.id}-${newNodeId}`,
        source: lastNode.id,
        target: newNodeId,
      });
    }

    recomputePositionsAndSync(nextNodes, nextEdges);
    setIsAddModalOpen(false);
    setInsertAfterNodeId(null);
    setSelectedNode(newNode);
    success('Etapa Adicionada', `"${def.label}" foi inserido no fluxo.`);
  };

  // 2. Delete Node
  const handleDeleteNode = (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    const prevEdge = edges.find(e => e.target === nodeId);
    const nextEdge = edges.find(e => e.source === nodeId);

    let nextEdges = edges.filter(e => e.source !== nodeId && e.target !== nodeId);

    // Bypass connection (re-stitch previous to next)
    if (prevEdge && nextEdge) {
      nextEdges.push({
        id: `xy-edge__${prevEdge.source}-${nextEdge.target}`,
        source: prevEdge.source,
        target: nextEdge.target,
        sourceHandle: prevEdge.sourceHandle,
      });
    }

    const nextNodes = nodes.filter(n => n.id !== nodeId);
    recomputePositionsAndSync(nextNodes, nextEdges);
    setSelectedNode(null);
    info('Etapa Removida', `"${node?.data?.label || 'Etapa'}" foi excluída.`);
  };

  // 3. Duplicate Node
  const handleDuplicateNode = (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    const newNodeId = `node-${node.type}-${Date.now()}`;
    const duplicated: FlowNode = {
      id: newNodeId,
      type: node.type,
      position: { x: node.position.x + 50, y: node.position.y + 50 },
      data: {
        ...node.data,
        label: `${node.data.label} (Cópia)`,
      },
    };

    const nextNodes = [...nodes, duplicated];
    recomputePositionsAndSync(nextNodes, edges);
    setSelectedNode(duplicated);
    success('Etapa Duplicada', `Cópia criada: "${duplicated.data.label}".`);
  };

  // 4. Move Step Up / Down
  const handleMoveStep = (nodeId: string, direction: 'up' | 'down') => {
    const currentIndex = orderedNodes.findIndex(n => n.id === nodeId);
    if (currentIndex === -1) return;
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= orderedNodes.length) return;

    const newOrdered = [...orderedNodes];
    const [moved] = newOrdered.splice(currentIndex, 1);
    newOrdered.splice(targetIndex, 0, moved);

    // Re-link sequential edges
    const newEdges: FlowEdge[] = [];
    for (let i = 0; i < newOrdered.length - 1; i++) {
      const source = newOrdered[i];
      const target = newOrdered[i + 1];
      newEdges.push({
        id: `xy-edge__${source.id}-${target.id}`,
        source: source.id,
        target: target.id,
      });
    }

    recomputePositionsAndSync(newOrdered, newEdges);
  };

  // 5. Connect step to specific target node
  const handleSetTargetNode = (sourceId: string, targetId: string, handleKey?: string) => {
    let nextEdges = edges.filter(e => !(e.source === sourceId && (handleKey ? e.sourceHandle === handleKey : !e.sourceHandle)));
    if (targetId && targetId !== 'none') {
      nextEdges.push({
        id: `xy-edge__${sourceId}${handleKey ? '-' + handleKey : ''}-${targetId}`,
        source: sourceId,
        target: targetId,
        sourceHandle: handleKey || undefined,
      });
    }
    onUpdateEdges(nextEdges);
    success('Conexão Atualizada', 'Destino do passo configurado com sucesso.');
  };

  // 6. Update Node Config
  const handleUpdateConfig = (nodeId: string, label: string, config: Record<string, any>) => {
    const nextNodes = nodes.map(n => {
      if (n.id === nodeId) {
        return {
          ...n,
          data: {
            ...n.data,
            label,
            config,
            isConfigured: true,
          },
        };
      }
      return n;
    });
    onUpdateNodes(nextNodes);
    setSelectedNode(prev => (prev && prev.id === nodeId ? { ...prev, data: { ...prev.data, label, config } } : prev));
  };

  return (
    <div className="min-h-screen bg-dark-950 text-white flex flex-col select-none pb-24">
      {/* Mobile Sticky Header */}
      <header className="sticky top-0 z-30 bg-dark-900/95 backdrop-blur-xl border-b border-white/10 px-4 py-3 shadow-lg">
        <div className="flex items-center justify-between gap-2">
          {/* Back & Flow Info */}
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              onClick={onBack}
              className="p-2 rounded-xl bg-dark-800 text-slate-300 hover:text-white border border-white/5 active:scale-95 transition-transform"
              title="Voltar"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold text-white truncate">{flow.name}</h1>
                <Badge variant={isPublished ? 'brand' : 'warning'} dot>
                  {isPublished ? 'Ativo' : 'Pausado'}
                </Badge>
              </div>
              <p className="text-[10px] text-slate-400">Modo Mobile Simplificado • {nodes.length} Etapas</p>
            </div>
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={onSwitchToCanvas}
              className="p-2 rounded-xl bg-dark-800 border border-white/10 text-cyan-400 hover:text-cyan-300 text-xs flex items-center gap-1 active:scale-95 transition-transform"
              title="Alternar para Tela Gráfica Completa"
            >
              <Layout className="w-3.5 h-3.5" />
              <span className="hidden xs:inline text-[11px] font-medium">Tela</span>
            </button>

            <Button
              size="sm"
              variant={isDirty ? 'primary' : 'outline'}
              leftIcon={!isDirty ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Save className="w-3.5 h-3.5" />}
              isLoading={isSaving}
              disabled={!isDirty || isSaving}
              onClick={onSave}
              className="px-2.5 py-1.5 text-xs h-8"
            >
              {isDirty ? 'Salvar' : 'Salvo'}
            </Button>

            <Button
              size="sm"
              variant={isPublished ? 'secondary' : 'brand'}
              leftIcon={isPublished ? <Pause className="w-3.5 h-3.5 text-amber-400" /> : <Play className="w-3.5 h-3.5" />}
              onClick={onToggleStatus}
              className="px-2.5 py-1.5 text-xs h-8 font-bold"
            >
              {isPublished ? 'Pausar' : 'Publicar'}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Step-by-Step Card Flow */}
      <main className="flex-1 max-w-xl w-full mx-auto p-4 space-y-3">
        {orderedNodes.length === 0 ? (
          <div className="p-8 text-center bg-dark-900/60 rounded-3xl border border-white/10 space-y-4 my-8">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
              <Zap className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Nenhum passo no fluxo ainda</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                Adicione a primeira etapa para começar o atendimento automatizado no WhatsApp.
              </p>
            </div>
            <Button
              variant="brand"
              size="md"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => {
                setInsertAfterNodeId(null);
                setIsAddModalOpen(true);
              }}
            >
              Criar 1º Passo (Gatilho)
            </Button>
          </div>
        ) : (
          orderedNodes.map((node, index) => {
            const meta = getNodeMeta(node);
            const outgoingEdges = edges.filter(e => e.source === node.id);
            const defaultTargetId = outgoingEdges.find(e => !e.sourceHandle)?.target || '';
            const nodeType = (node.data?.nodeType || node.type) as string;

            return (
              <React.Fragment key={node.id}>
                {/* Step Card */}
                <div
                  onClick={() => setSelectedNode(node)}
                  className="bg-dark-900/90 border border-white/10 rounded-2xl p-4 shadow-xl active:border-brand-500/50 transition-all space-y-3 relative overflow-hidden group cursor-pointer hover:border-white/20"
                >
                  {/* Card Header: Step Index + Icon + Label + Actions */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-6 h-6 rounded-full bg-dark-800 border border-white/10 text-[11px] font-mono font-bold text-slate-400 flex items-center justify-center flex-shrink-0">
                        {index + 1}
                      </span>
                      <div className={`p-2 rounded-xl text-white ${meta.iconBg} shadow-sm flex-shrink-0`}>
                        {meta.icon}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-white tracking-tight truncate">
                          {node.data?.label || meta.label}
                        </h4>
                        <span className="text-[10px] text-slate-400 block truncate">
                          {meta.description}
                        </span>
                      </div>
                    </div>

                    {/* Quick Move & Action buttons */}
                    <div className="flex items-center gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => handleMoveStep(node.id, 'up')}
                        disabled={index === 0}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white disabled:opacity-20 hover:bg-dark-800 transition-colors"
                        title="Mover para Cima"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleMoveStep(node.id, 'down')}
                        disabled={index === orderedNodes.length - 1}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white disabled:opacity-20 hover:bg-dark-800 transition-colors"
                        title="Mover para Baixo"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDuplicateNode(node.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-dark-800 transition-colors"
                        title="Duplicar"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteNode(node.id)}
                        className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Node Content Preview */}
                  <div className="p-2.5 rounded-xl bg-dark-950/60 border border-white/5 text-xs text-slate-300 space-y-1">
                    {nodeType === 'message' && (
                      <p className="line-clamp-2 italic font-mono text-[11px] text-slate-300">
                        "{node.data?.config?.text || 'Sem mensagem configurada'}"
                      </p>
                    )}
                    {nodeType === 'question' && (
                      <div>
                        <p className="font-semibold text-primary-300 text-[11px]">
                          Pergunta: "{node.data?.config?.questionText || 'Qual o seu dado?'}"
                        </p>
                        <span className="text-[10px] text-slate-400">
                          Salva na variável: <code className="text-brand-300">{'{{' + (node.data?.config?.variableName || 'resposta') + '}}'}</code>
                        </span>
                      </div>
                    )}
                    {nodeType === 'check_contact' && (
                      <p className="text-[11px] text-purple-300 font-medium">
                        Verifica se o cliente já existe na base ou se é o primeiro contato.
                      </p>
                    )}
                    {nodeType === 'ask_date' && (
                      <p className="text-[11px] text-emerald-300 font-medium">
                        Envia botões automáticos com opções de datas (Hoje, Amanhã, Outro dia).
                      </p>
                    )}
                    {nodeType === 'services_catalog' && (
                      <p className="text-[11px] text-emerald-300 font-medium">
                        Apresenta o catálogo de serviços e valores configurados na agenda.
                      </p>
                    )}
                    {nodeType === 'schedule_contact' && (
                      <p className="text-[11px] text-brand-300 font-medium">
                        Calcula os horários livres da agenda e envia botões de agendamento.
                      </p>
                    )}
                    {nodeType === 'confirm_booking' && (
                      <p className="text-[11px] text-emerald-400 font-medium">
                        Confirma e salva o agendamento no banco de dados e notifica o cliente.
                      </p>
                    )}
                    {nodeType === 'trigger' && (
                      <p className="text-[11px] text-amber-300 font-medium">
                        Dispara ao receber qualquer mensagem no WhatsApp.
                      </p>
                    )}
                    {nodeType === 'update_contact' && (
                      <p className="text-[11px] text-cyan-300 font-medium">
                        Salva o nome informado pelo cliente na base oficial de contatos.
                      </p>
                    )}
                  </div>

                  {/* Target Connection Controls (Where does this step go?) */}
                  <div className="pt-1 border-t border-white/5 space-y-2" onClick={e => e.stopPropagation()}>
                    {nodeType === 'check_contact' ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {/* Branch 1: Is New */}
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                            🟢 Se for Novo Cliente:
                          </span>
                          <select
                            value={outgoingEdges.find(e => e.sourceHandle === 'is_new')?.target || ''}
                            onChange={e => handleSetTargetNode(node.id, e.target.value, 'is_new')}
                            className="w-full bg-dark-800 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
                          >
                            <option value="">-- Escolher Próximo Passo --</option>
                            {nodes.filter(n => n.id !== node.id).map(n => (
                              <option key={n.id} value={n.id}>
                                ➡️ {n.data?.label || n.id}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Branch 2: Is Existing */}
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1">
                            🔵 Se for Cliente Já Salvo:
                          </span>
                          <select
                            value={outgoingEdges.find(e => e.sourceHandle === 'is_existing')?.target || ''}
                            onChange={e => handleSetTargetNode(node.id, e.target.value, 'is_existing')}
                            className="w-full bg-dark-800 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
                          >
                            <option value="">-- Escolher Próximo Passo --</option>
                            {nodes.filter(n => n.id !== node.id).map(n => (
                              <option key={n.id} value={n.id}>
                                ➡️ {n.data?.label || n.id}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1 flex-shrink-0">
                          <ArrowRight className="w-3.5 h-3.5 text-brand-400" />
                          Próximo Passo:
                        </span>
                        <select
                          value={defaultTargetId}
                          onChange={e => handleSetTargetNode(node.id, e.target.value)}
                          className="flex-1 bg-dark-800 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
                        >
                          <option value="">-- Finalizar fluxo aqui --</option>
                          {nodes.filter(n => n.id !== node.id).map(n => (
                            <option key={n.id} value={n.id}>
                              ➡️ {n.data?.label || n.id}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Add Step Button Between Cards */}
                <div className="flex justify-center py-1">
                  <button
                    onClick={() => {
                      setInsertAfterNodeId(node.id);
                      setIsAddModalOpen(true);
                    }}
                    className="p-1.5 px-3 rounded-full bg-dark-850 hover:bg-dark-800 border border-white/10 hover:border-brand-500/40 text-slate-400 hover:text-brand-300 text-[11px] font-medium flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5 text-brand-400" />
                    <span>Adicionar Etapa Aqui</span>
                  </button>
                </div>
              </React.Fragment>
            );
          })
        )}
      </main>

      {/* Mobile Floating Bottom Bar */}
      <div className="fixed bottom-0 inset-x-0 bg-dark-900/95 backdrop-blur-2xl border-t border-white/10 p-3 z-30 shadow-2xl">
        <div className="max-w-xl mx-auto flex items-center justify-between gap-2">
          <Button
            variant="secondary"
            size="md"
            leftIcon={<Play className="w-4 h-4 text-brand-400" />}
            onClick={onOpenSimulator}
            className="flex-1 text-xs font-semibold"
          >
            Testar Fluxo
          </Button>

          <Button
            variant="brand"
            size="md"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => {
              setInsertAfterNodeId(orderedNodes.length > 0 ? orderedNodes[orderedNodes.length - 1].id : null);
              setIsAddModalOpen(true);
            }}
            className="flex-1 text-xs font-bold shadow-glow-primary"
          >
            Adicionar Passo
          </Button>
        </div>
      </div>

      {/* Modal: Add Node Palette Selection */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setInsertAfterNodeId(null);
        }}
        title="Escolha a Próxima Etapa"
        subtitle="Selecione o tipo de ação que o bot executará no WhatsApp"
        maxWidth="lg"
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold flex-shrink-0 transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-brand-500 text-white shadow-sm'
                  : 'bg-dark-800 text-slate-400 hover:text-white border border-white/5'
              }`}
            >
              Todos ({NODE_DEFINITIONS.length})
            </button>
            {(Object.keys(CATEGORY_INFO) as Array<keyof typeof CATEGORY_INFO>).map(catKey => {
              const cat = CATEGORY_INFO[catKey];
              const isSelected = selectedCategory === catKey;
              return (
                <button
                  key={catKey}
                  onClick={() => setSelectedCategory(catKey)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium flex-shrink-0 flex items-center gap-1.5 transition-colors ${
                    isSelected
                      ? 'bg-brand-500 text-white shadow-sm'
                      : 'bg-dark-800 text-slate-400 hover:text-white border border-white/5'
                  }`}
                >
                  {cat.icon}
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Node Types Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {NODE_DEFINITIONS.filter(def => selectedCategory === 'all' || def.category === selectedCategory).map(def => (
              <button
                key={def.type}
                onClick={() => handleSelectNodeTypeToAdd(def)}
                className="p-3.5 rounded-2xl bg-dark-850 hover:bg-dark-800 border border-white/5 hover:border-brand-500/40 text-left transition-all active:scale-[0.98] flex items-start gap-3 group"
              >
                <div className={`p-2.5 rounded-xl text-white ${def.iconBg} shadow-sm flex-shrink-0 group-hover:scale-105 transition-transform`}>
                  {def.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <h4 className="text-xs font-bold text-white group-hover:text-brand-300 transition-colors">
                      {def.label}
                    </h4>
                    {def.badge && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-brand-500/20 text-brand-300 border border-brand-500/30">
                        {def.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">
                    {def.description}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </Modal>

      {/* Modal: Edit Step Content (Mobile Inspector Drawer) */}
      {selectedNode && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col justify-end sm:justify-center sm:items-center p-0 sm:p-4 animate-in fade-in">
          <div className="bg-dark-900 border-t sm:border border-white/10 rounded-t-3xl sm:rounded-3xl w-full sm:max-w-2xl max-h-[88vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom-6">
            {/* Modal Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-dark-850">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-brand-500 text-white">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Configurar: {selectedNode.data?.label || selectedNode.id}
                  </h3>
                  <p className="text-[10px] text-slate-400">Edite textos, perguntas e parâmetros da etapa</p>
                </div>
              </div>

              <button
                onClick={() => setSelectedNode(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-dark-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Inspector Body */}
            <div className="flex-1 overflow-y-auto p-4">
              <NodeInspector
                node={selectedNode}
                onUpdateConfig={handleUpdateConfig}
                onDeleteNode={handleDeleteNode}
                onDuplicateNode={handleDuplicateNode}
                onClose={() => setSelectedNode(null)}
                width={600}
              />
            </div>

            {/* Bottom Save & Close */}
            <div className="p-3 bg-dark-850 border-t border-white/10 flex justify-end gap-2">
              <Button variant="brand" onClick={() => setSelectedNode(null)} className="w-full sm:w-auto font-bold">
                Concluir Edição
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
