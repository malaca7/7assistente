import React, { useState, useEffect } from 'react';
import { 
  GitFork, 
  Plus, 
  Search, 
  Play, 
  Pause, 
  Copy, 
  Trash2, 
  Edit3, 
  MoreVertical,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Filter,
  Calendar,
  Layers,
  Bot,
  Zap,
  Check,
  Eye,
  Settings2,
  Clock,
  GripVertical
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input, Textarea } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../contexts/ToastContext';
import { StorageService, getBackendUrl } from '../../lib/storage';
import { Flow, FlowStatus } from '../../types';
import { formatDate } from '../../lib/utils';

export interface FlowListPageProps {
  onNavigate: (path: string) => void;
}

export const FlowListPage: React.FC<FlowListPageProps> = ({ onNavigate }) => {
  const { success, error: toastError, info } = useToast();
  const [flows, setFlows] = useState<Flow[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  // Drag and Drop State para reordenação dos cards
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Create Flow Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newFlowName, setNewFlowName] = useState('');
  const [newFlowDescription, setNewFlowDescription] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('blank');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Metadata Modal state
  const [editingFlow, setEditingFlow] = useState<Flow | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');

  // Delete modal state
  const [flowToDelete, setFlowToDelete] = useState<Flow | null>(null);

  useEffect(() => {
    loadFlows();
  }, []);

  const loadFlows = async () => {
    setIsLoading(true);
    try {
      const data = await StorageService.getFlows();
      
      // Carregar ordem fixa salva (localStorage ou order_index estável)
      let savedOrder: string[] = [];
      try {
        const raw = localStorage.getItem('pitoco_flows_order');
        if (raw) savedOrder = JSON.parse(raw);
      } catch {}

      const sorted = [...data].sort((a, b) => {
        if (savedOrder.length > 0) {
          const idxA = savedOrder.indexOf(a.id);
          const idxB = savedOrder.indexOf(b.id);
          if (idxA !== -1 && idxB !== -1) return idxA - idxB;
          if (idxA !== -1) return -1;
          if (idxB !== -1) return 1;
        }
        const oA = typeof a.order_index === 'number' ? a.order_index : 9999;
        const oB = typeof b.order_index === 'number' ? b.order_index : 9999;
        if (oA !== oB) return oA - oB;
        return (a.name || '').localeCompare(b.name || '');
      });

      setFlows(sorted);
    } catch (err) {
      console.error('Error fetching flows:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const templates = [
    {
      id: 'blank',
      title: 'Fluxo em Branco',
      desc: 'Comece com uma tela limpa e monte a estrutura do zero.',
      icon: GitFork,
      color: 'text-primary-400 bg-primary-500/10 border-primary-500/20',
    },
    {
      id: 'sales',
      title: 'Vendas & Qualificação',
      desc: 'Boas-vindas, captura de nome, menu de planos e vínculo de tags.',
      icon: Sparkles,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    },
    {
      id: 'agenda',
      title: 'Agendamento de Horários',
      desc: 'Consulta vagas na Agenda e envia botões de horários disponíveis.',
      icon: Calendar,
      color: 'text-brand-400 bg-brand-500/10 border-brand-500/20',
    },
    {
      id: 'ai_support',
      title: 'Atendente Virtual com IA',
      desc: 'IA inteligente respondendo dúvidas com transbordo humano.',
      icon: Bot,
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    },
  ];

  const handleCreateFlow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFlowName.trim()) {
      toastError('Nome obrigatório', 'Por favor, informe um nome para o fluxo.');
      return;
    }

    setIsSubmitting(true);
    try {
      const newFlowId = `flow-${Date.now()}`;
      const newFlow: Flow = {
        id: newFlowId,
        name: newFlowName.trim(),
        description: newFlowDescription.trim() || 'Fluxo de atendimento automatizado',
        status: 'draft',
        version: 1,
        node_count: selectedTemplate === 'blank' ? 2 : 4,
        trigger_type: 'Mensagem recebida',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Create template initial nodes if chosen or blank
      const initialNodes = selectedTemplate === 'sales' ? [
        {
          id: `node-trigger-${Date.now()}`,
          type: 'trigger',
          position: { x: 430, y: 80 },
          data: { label: 'Gatilho Inicial', nodeType: 'trigger', isConfigured: true, config: { eventType: 'any_message' } }
        },
        {
          id: `node-msg-${Date.now()}`,
          type: 'message',
          position: { x: 430, y: 380 },
          data: { label: 'Boas-Vindas', nodeType: 'message', isConfigured: true, config: { text: 'Olá! Seja muito bem-vindo(a) à {{empresa}}. Me chamo {{bot_nome}}!' } }
        },
        {
          id: `node-btn-${Date.now()}`,
          type: 'buttons',
          position: { x: 430, y: 730 },
          data: {
            label: 'Menu Comercial',
            nodeType: 'buttons',
            isConfigured: true,
            config: {
              bodyText: 'Como posso te ajudar hoje?',
              buttons: [
                { id: 'btn_1', title: 'Conhecer Planos' },
                { id: 'btn_2', title: 'Falar com Especialista' }
              ]
            }
          }
        }
      ] : [
        {
          id: `node-trigger-${Date.now()}`,
          type: 'trigger',
          position: { x: 430, y: 80 },
          data: { label: 'Gatilho Inicial', nodeType: 'trigger', isConfigured: true, config: { eventType: 'any_message' } }
        },
        {
          id: `node-msg-${Date.now()}`,
          type: 'message',
          position: { x: 430, y: 380 },
          data: { label: 'Boas-Vindas', nodeType: 'message', isConfigured: true, config: { text: 'Olá! Seja muito bem-vindo(a) à {{empresa}}!' } }
        }
      ];

      const initialEdges = selectedTemplate === 'sales' ? [
        { id: `edge-1`, source: initialNodes[0].id, target: initialNodes[1].id, animated: true },
        { id: `edge-2`, source: initialNodes[1].id, target: initialNodes[2].id, animated: true }
      ] : [
        { id: `edge-1`, source: initialNodes[0].id, target: initialNodes[1].id, animated: true }
      ];

      await StorageService.saveFlowGraph(newFlowId, initialNodes as any, initialEdges as any);
      newFlow.node_count = initialNodes.length;

      await StorageService.saveFlow(newFlow);
      success('Fluxo Criado', `O fluxo "${newFlow.name}" foi criado com sucesso.`);
      setIsCreateModalOpen(false);
      setNewFlowName('');
      setNewFlowDescription('');
      
      // Navigate directly into studio editor
      onNavigate(`/fluxos/${newFlow.id}`);
    } catch (err: any) {
      toastError('Erro ao criar', err.message || 'Não foi possível salvar o fluxo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEdit = (flow: Flow, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingFlow(flow);
    setEditName(flow.name);
    setEditDescription(flow.description);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFlow || !editName.trim()) return;

    try {
      const updated: Flow = {
        ...editingFlow,
        name: editName.trim(),
        description: editDescription.trim(),
        updated_at: new Date().toISOString(),
      };
      await StorageService.saveFlow(updated);
      setFlows((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
      success('Fluxo Atualizado', `As alterações de "${updated.name}" foram gravadas.`);
      setEditingFlow(null);
    } catch (err: any) {
      toastError('Erro ao salvar', err.message);
    }
  };

  const handleToggleStatus = async (flow: Flow, e: React.MouseEvent) => {
    e.stopPropagation();
    // Toggle: published <-> draft. Suporta múltiplos fluxos ativos simultaneamente!
    const newStatus: FlowStatus = flow.status === 'published' ? 'draft' : 'published';
    const updated: Flow = {
      ...flow,
      status: newStatus,
      is_active: newStatus === 'published',
      updated_at: new Date().toISOString(),
    };

    // Atualizar no estado local preservando rigorosamente a posição do card
    setFlows((prev) => prev.map((f) => (f.id === flow.id ? updated : f)));

    await StorageService.saveFlow(updated);
    
    // Notificar backend do WhatsApp
    const backendUrl = getBackendUrl();
    try {
      if (newStatus === 'published') {
        await fetch(`${backendUrl}/api/whatsapp/flows/${flow.id}/publish`, { method: 'POST' });
      }
      await fetch(`${backendUrl}/api/whatsapp/sync-flows`, { method: 'POST' });
    } catch {}

    success(
      newStatus === 'published' ? '🟢 Fluxo Ativado no Bot' : '⚪ Fluxo Desativado',
      newStatus === 'published'
        ? `O fluxo "${flow.name}" agora está ATIVO e rodando no WhatsApp simultaneamente com os outros fluxos ativos.`
        : `O fluxo "${flow.name}" foi pausado.`
    );
  };

  // ==============================================================================
  // DRAG & DROP NATIVO (REORDENAÇÃO PERMANENTE DOS CARDS)
  // ==============================================================================
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDrop = async (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const reordered = [...flows];
    const [movedItem] = reordered.splice(draggedIndex, 1);
    reordered.splice(targetIndex, 0, movedItem);

    // Atribuir novos order_index em sequência
    const finalized = reordered.map((f, idx) => ({ ...f, order_index: idx }));
    setFlows(finalized);
    setDraggedIndex(null);
    setDragOverIndex(null);

    await StorageService.saveFlowsOrder(finalized);
    success('Ordem Salva!', `A nova ordem dos cards de fluxos foi salva com sucesso.`);
  };

  const handleDuplicate = async (flow: Flow, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const duplicated = await StorageService.duplicateFlow(flow.id);
      setFlows((prev) => [duplicated, ...prev]);
      success('Fluxo Duplicado', `Cópia criada: "${duplicated.name}".`);
    } catch (err: any) {
      toastError('Erro', err.message || 'Falha ao duplicar o fluxo.');
    }
  };

  const handleDelete = async () => {
    if (!flowToDelete) return;
    try {
      const id = flowToDelete.id;
      setFlows((prev) => prev.filter((f) => f.id !== id));
      await StorageService.deleteFlow(id);
      success('Fluxo Excluído', `O fluxo "${flowToDelete.name}" foi removido com sucesso.`);
      setFlowToDelete(null);
    } catch (err: any) {
      toastError('Erro', err.message || 'Falha ao excluir o fluxo.');
    }
  };

  const filteredFlows = flows.filter((f) => {
    const matchesSearch =
      f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === 'all' ||
      f.status === filterStatus ||
      (filterStatus === 'draft' && (f.status === 'draft' || f.status === 'paused'));
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-7xl mx-auto select-none pb-12">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="text-xl font-display font-bold text-white tracking-tight flex items-center gap-2">
              <GitFork className="w-5 h-5 text-brand-400" />
              Fluxos de Automação & Robôs
            </h2>
            {flows.filter(f => f.status === 'published' || f.is_active).length > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                {flows.filter(f => f.status === 'published' || f.is_active).length}{' '}
                {flows.filter(f => f.status === 'published' || f.is_active).length === 1 ? 'Fluxo Ativo no WhatsApp' : 'Fluxos Ativos Simultâneos'}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Crie e gerencie fluxos de atendimento. Arraste e solte (Drag & Drop) os cards para definir a ordem desejada.
          </p>
        </div>

        <Button
          variant="brand"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => setIsCreateModalOpen(true)}
          className="shadow-lg shadow-brand-500/20"
        >
          Criar Novo Fluxo
        </Button>
      </div>

      {/* Search & Filter Tabs */}
      <Card>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-2">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
            <input
              type="text"
              placeholder="Pesquisar por nome ou descrição de fluxo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-dark-850 border border-white/5 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full sm:w-auto">
            {[
              { id: 'all', label: 'Todos os Fluxos' },
              { id: 'published', label: '🟢 Ativos no Bot' },
              { id: 'draft', label: '⚪ Inativos' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterStatus(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                  filterStatus === tab.id
                    ? 'bg-brand-500 text-white shadow-md'
                    : 'bg-dark-850 text-slate-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Flows Grid com suporte a Drag & Drop */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {isLoading ? (
          <div className="col-span-full p-12 text-center text-xs text-slate-500 animate-pulse">
            Carregando fluxos de automação...
          </div>
        ) : filteredFlows.length === 0 ? (
          <div className="col-span-full p-12 text-center rounded-3xl bg-dark-900 border border-white/5 space-y-3">
            <GitFork className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-white">Nenhum fluxo encontrado</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Crie seu primeiro fluxo de automação para começar a atender clientes de forma automática no WhatsApp.
            </p>
            <Button
              variant="brand"
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => setIsCreateModalOpen(true)}
            >
              Criar Meu Primeiro Fluxo
            </Button>
          </div>
        ) : (
          filteredFlows.map((flow, index) => (
            <div
              key={flow.id}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              onDrop={(e) => handleDrop(e, index)}
              onClick={() => onNavigate(`/fluxos/${flow.id}`)}
              className={`p-5 rounded-3xl bg-dark-900 border cursor-pointer transition-all duration-200 space-y-4 shadow-xl hover:shadow-2xl relative group flex flex-col justify-between select-none ${
                draggedIndex === index
                  ? 'opacity-40 scale-95 border-dashed border-brand-400 ring-2 ring-brand-500/40'
                  : dragOverIndex === index
                  ? 'ring-2 ring-brand-400 shadow-2xl scale-[1.02] border-brand-400'
                  : flow.status === 'published'
                  ? 'border-emerald-500/40 ring-1 ring-emerald-500/20'
                  : 'border-white/5 hover:border-brand-500/40'
              }`}
            >
              <div className="space-y-3">
                {/* Top: Drag Handle + Toggle Switch & Quick Actions */}
                <div className="flex items-center justify-between">
                  {/* Alça de Arraste + Active/Inactive Toggle */}
                  <div className="flex items-center gap-2">
                    <div 
                      className="cursor-grab active:cursor-grabbing p-1 rounded text-slate-500 hover:text-white hover:bg-white/10 transition-colors"
                      title="Clique e arraste para reordenar este card de fluxo"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <GripVertical className="w-4 h-4" />
                    </div>

                    <div
                      onClick={(e) => handleToggleStatus(flow, e)}
                      className="flex items-center gap-2 cursor-pointer select-none"
                      title={flow.status === 'published' ? 'Clique para DESATIVAR este fluxo no bot' : 'Clique para ATIVAR este fluxo no bot'}
                    >
                      {/* Toggle Switch */}
                      <div className={`relative w-9 h-5 rounded-full transition-colors duration-200 ${
                        flow.status === 'published'
                          ? 'bg-emerald-500 shadow-md shadow-emerald-500/30'
                          : 'bg-dark-700 border border-white/10'
                      }`}>
                        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                          flow.status === 'published' ? 'translate-x-[18px]' : 'translate-x-0.5'
                        }`} />
                      </div>
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${
                        flow.status === 'published'
                          ? 'text-emerald-300'
                          : 'text-slate-500'
                      }`}>
                        {flow.status === 'published' ? '🟢 Ativo' : '⚪ Inativo'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => handleOpenEdit(flow, e)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      title="Editar Informações / Renomear"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => handleDuplicate(flow, e)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-brand-300 hover:bg-slate-800 transition-colors"
                      title="Duplicar Fluxo"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setFlowToDelete(flow);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                      title="Excluir Fluxo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Title & Description */}
                <div>
                  <h3 className="text-sm font-bold text-white group-hover:text-brand-300 transition-colors line-clamp-1">
                    {flow.name}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                    {flow.description || 'Sem descrição informada.'}
                  </p>

                  {/* Palavras-chave do Fluxo */}
                  {Boolean((flow as any).keywords || (flow as any).trigger_keywords) && (
                    <div className="flex items-center gap-1.5 pt-2">
                      <span className="text-[10px] uppercase font-bold text-amber-400">Palavras-chave:</span>
                      <span className="text-amber-300 font-mono text-[11px] font-semibold truncate bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                        {String((flow as any).keywords || (flow as any).trigger_keywords)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom: Info Bar & Open Studio Button */}
              <div className="space-y-3 pt-3 border-t border-white/5">
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span className="flex items-center gap-1 font-bold text-brand-400">
                    <Layers className="w-3.5 h-3.5 text-brand-400" />
                    {typeof flow.node_count === 'number' && flow.node_count > 0 ? flow.node_count : 2} Funções (Nós)
                  </span>
                  <span>v{flow.version || 1}</span>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  className="w-full text-xs justify-between group-hover:bg-brand-500 group-hover:text-white group-hover:border-transparent transition-all"
                >
                  <span>Abrir no Studio</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* CREATE FLOW MODAL */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Criar Novo Fluxo de Automação"
        subtitle="Escolha um modelo pronto ou comece do zero"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateFlow} className="space-y-4">
          <Input
            label="Nome do Fluxo"
            placeholder="Ex: Atendimento Comercial, Agendamento de Consultas..."
            value={newFlowName}
            onChange={(e) => setNewFlowName(e.target.value)}
            required
            autoFocus
          />

          <Textarea
            label="Descrição do Objetivo"
            placeholder="Ex: Realiza a triagem inicial, qualifica o lead e agenda horário no WhatsApp..."
            value={newFlowDescription}
            onChange={(e) => setNewFlowDescription(e.target.value)}
            rows={2}
          />

          {/* Template Picker */}
          <div className="space-y-2 pt-1">
            <label className="block text-xs font-bold text-white">Escolha um Modelo Inicial:</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {templates.map((tmpl) => {
                const Icon = tmpl.icon;
                const isSelected = selectedTemplate === tmpl.id;

                return (
                  <div
                    key={tmpl.id}
                    onClick={() => setSelectedTemplate(tmpl.id)}
                    className={`p-3 rounded-2xl border cursor-pointer transition-all space-y-1.5 ${
                      isSelected
                        ? 'bg-dark-800 border-brand-500 shadow-md ring-1 ring-brand-500'
                        : 'bg-dark-850 border-white/5 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-xl border ${tmpl.color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-bold text-white">{tmpl.title}</span>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-brand-400" />}
                    </div>
                    <p className="text-[11px] text-slate-400 leading-tight">{tmpl.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/5">
            <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="brand" isLoading={isSubmitting}>
              Criar & Abrir no Studio
            </Button>
          </div>
        </form>
      </Modal>

      {/* EDIT METADATA MODAL */}
      <Modal
        isOpen={Boolean(editingFlow)}
        onClose={() => setEditingFlow(null)}
        title="Editar Informações do Fluxo"
        subtitle="Altere o nome e a descrição da automação"
      >
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <Input
            label="Nome do Fluxo"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            required
          />

          <Textarea
            label="Descrição"
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            rows={3}
          />

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/5">
            <Button type="button" variant="outline" onClick={() => setEditingFlow(null)}>
              Cancelar
            </Button>
            <Button type="submit" variant="brand">
              Salvar Alterações
            </Button>
          </div>
        </form>
      </Modal>

      {/* DELETE CONFIRMATION MODAL */}
      <Modal
        isOpen={Boolean(flowToDelete)}
        onClose={() => setFlowToDelete(null)}
        title="Excluir Fluxo de Automação"
        subtitle="Esta ação removerá todas as funções e conexões deste fluxo"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-300 leading-relaxed">
            Tem certeza que deseja excluir o fluxo <strong className="text-white">"{flowToDelete?.name}"</strong>?
          </p>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/5">
            <Button variant="outline" onClick={() => setFlowToDelete(null)}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              Excluir Definitivamente
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
