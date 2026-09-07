import React, { useState, useEffect, useMemo } from 'react';
import { 
  GitFork, 
  Play, 
  Save, 
  Plus, 
  Sparkles, 
  Smartphone, 
  Layers, 
  CheckCircle2, 
  Store as StoreIcon, 
  ShoppingBag, 
  Calendar, 
  CreditCard, 
  Truck, 
  Users, 
  MessageSquare,
  ShieldCheck,
  Edit3,
  Trash2,
  Copy,
  Power,
  RefreshCw,
  Search,
  Check,
  X,
  ArrowRight,
  HelpCircle,
  Clock
} from 'lucide-react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Modal } from './ui/Modal';
import { useToast } from '../contexts/ToastContext';
import { FlowSimulator } from './flow-builder/FlowSimulator';
import { FlowEditorPage } from '../pages/flows/FlowEditorPage';
import { StorageService } from '../lib/storage';
import { Flow, FlowStep, NodeTypeEnum, Store } from '../types';

interface FlowBuilderViewProps {
  onNavigate?: (path: string) => void;
}

export const FlowBuilderView: React.FC<FlowBuilderViewProps> = ({ onNavigate }) => {
  const { success, error: toastError, info } = useToast();

  const [flows, setFlows] = useState<Flow[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);
  const [selectedFlowForSteps, setSelectedFlowForSteps] = useState<Flow | null>(null);

  // Modo de visualização: 'list' (gerenciador tradicional) ou 'studio' (Studio Visual N8N / BotGhost)
  const [viewMode, setViewMode] = useState<'list' | 'studio'>('list');
  const [studioFlowId, setStudioFlowId] = useState<string>('');

  // Modal de Criação / Edição de Fluxo
  const [isFlowModalOpen, setIsFlowModalOpen] = useState(false);
  const [editingFlow, setEditingFlow] = useState<Flow | null>(null);
  const [flowName, setFlowName] = useState('');
  const [flowDescription, setFlowDescription] = useState('');
  const [flowTrigger, setFlowTrigger] = useState('Qualquer Mensagem Recebida');
  const [flowStoreId, setFlowStoreId] = useState<string>('all');
  const [flowActive, setFlowActive] = useState(true);
  const [flowSteps, setFlowSteps] = useState<FlowStep[]>([]);
  const [isSavingFlow, setIsSavingFlow] = useState(false);

  // Modal de Confirmação de Exclusão
  const [flowToDelete, setFlowToDelete] = useState<Flow | null>(null);

  // Carregar dados
  const loadData = async () => {
    try {
      const [flowsData, storesData] = await Promise.all([
        StorageService.getFlows(),
        StorageService.getStores(),
      ]);
      setFlows(flowsData);
      setStores(storesData);
      if (!selectedFlowForSteps && flowsData.length > 0) {
        setSelectedFlowForSteps(flowsData[0]);
      }
    } catch (err) {
      console.error('Erro ao carregar fluxos:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadData();
  };

  // Abrir Modal de Criação
  const handleOpenCreateFlow = () => {
    setEditingFlow(null);
    setFlowName('');
    setFlowDescription('');
    setFlowTrigger('Qualquer Mensagem Recebida');
    setFlowStoreId('all');
    setFlowActive(true);
    setFlowSteps([
      { id: `step-${Date.now()}-1`, title: 'Gatilho de Mensagem Recebida', type: 'trigger', category: 'Início', description: 'Dispara quando o cliente envia qualquer texto.' },
      { id: `step-${Date.now()}-2`, title: 'Boas-Vindas Pitoco de Gente', type: 'message', category: 'Atendimento', description: 'Saudação com menu de opções de 1 a 7.' },
      { id: `step-${Date.now()}-3`, title: 'Catálogo de Bebês & Enxoval', type: 'show_catalog', category: 'Vendas', description: 'Exibe bodies, macacões e saídas de maternidade.' },
      { id: `step-${Date.now()}-4`, title: 'Transbordo Humano por Filial', type: 'human_handoff', category: 'Multi-Lojas', description: 'Direciona conversa para a equipe da loja física.' },
    ]);
    setIsFlowModalOpen(true);
  };

  // Abrir Modal de Edição
  const handleOpenEditFlow = (flow: Flow) => {
    setEditingFlow(flow);
    setFlowName(flow.name);
    setFlowDescription(flow.description);
    setFlowTrigger(flow.trigger_type || 'Qualquer Mensagem Recebida');
    setFlowStoreId(flow.store_id || 'all');
    setFlowActive(flow.is_active !== false);
    setFlowSteps(flow.steps && flow.steps.length > 0 ? [...flow.steps] : [
      { id: `step-1`, title: 'Gatilho Inicial', type: 'trigger', category: 'Início', description: 'Disparo do fluxo' },
      { id: `step-2`, title: 'Mensagem de Atendimento', type: 'message', category: 'Atendimento', description: 'Apresentação do menu' },
    ]);
    setIsFlowModalOpen(true);
  };

  // Salvar Fluxo (Criar ou Atualizar)
  const handleSaveFlow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!flowName.trim()) {
      toastError('Aviso', 'Informe o nome do fluxo.');
      return;
    }

    setIsSavingFlow(true);
    try {
      const assignedStore = stores.find(s => s.id === flowStoreId);
      const storeName = flowStoreId === 'all' ? 'Toda a Rede (Global)' : assignedStore?.name;

      const flowPayload: Partial<Flow> = {
        id: editingFlow?.id,
        name: flowName.trim(),
        description: flowDescription.trim(),
        trigger_type: flowTrigger,
        store_id: flowStoreId === 'all' ? null : flowStoreId,
        store_name: storeName,
        is_active: flowActive,
        status: flowActive ? 'published' : 'paused',
        version: editingFlow ? (editingFlow.version + 1) : 1,
        node_count: flowSteps.length,
        steps: flowSteps,
        created_at: editingFlow?.created_at,
      };

      const saved = await StorageService.saveFlow(flowPayload);
      success(
        editingFlow ? 'Fluxo Atualizado!' : 'Novo Fluxo Criado!',
        `O fluxo "${saved.name}" foi salvo e sincronizado.`
      );
      setIsFlowModalOpen(false);
      loadData();
    } catch (err: any) {
      toastError('Erro ao salvar fluxo', err.message);
    } finally {
      setIsSavingFlow(false);
    }
  };

  // Alternar Ativar / Desativar
  const handleToggleFlowStatus = async (flow: Flow) => {
    try {
      const updated = await StorageService.toggleFlowStatus(flow.id);
      if (updated) {
        const actionText = updated.is_active ? 'ativado e publicado' : 'pausado / desativado';
        success(`Fluxo "${updated.name}" ${actionText}!`);
        loadData();
      }
    } catch (err: any) {
      toastError('Erro ao alternar status do fluxo', err.message);
    }
  };

  // Duplicar Fluxo
  const handleDuplicateFlow = async (flow: Flow) => {
    try {
      const clonePayload: Partial<Flow> = {
        name: `${flow.name} (Cópia)`,
        description: flow.description,
        trigger_type: flow.trigger_type,
        store_id: flow.store_id,
        store_name: flow.store_name,
        is_active: false,
        status: 'draft',
        version: 1,
        node_count: flow.node_count || 4,
        steps: flow.steps ? JSON.parse(JSON.stringify(flow.steps)) : [],
      };
      await StorageService.saveFlow(clonePayload);
      success('Fluxo Duplicado!', 'Uma cópia em rascunho foi criada com sucesso.');
      loadData();
    } catch (err: any) {
      toastError('Erro ao duplicar fluxo', err.message);
    }
  };

  // Confirmar Exclusão
  const handleConfirmDelete = async () => {
    if (!flowToDelete) return;
    try {
      await StorageService.deleteFlow(flowToDelete.id);
      success('Fluxo Excluído', `O fluxo "${flowToDelete.name}" foi removido.`);
      setFlowToDelete(null);
      loadData();
    } catch (err: any) {
      toastError('Erro ao excluir fluxo', err.message);
    }
  };

  // Adicionar Passo ao Fluxo no Modal
  const handleAddStep = (type: NodeTypeEnum, title: string, category: string, desc: string) => {
    setFlowSteps(prev => [
      ...prev,
      {
        id: `step-${Date.now()}-${prev.length + 1}`,
        title,
        type,
        category,
        description: desc,
      }
    ]);
  };

  // Remover Passo do Fluxo no Modal
  const handleRemoveStep = (index: number) => {
    setFlowSteps(prev => prev.filter((_, i) => i !== index));
  };

  // Abrir Visual Studio N8N / BotGhost
  const handleOpenStudio = (flowId?: string) => {
    const targetId = flowId || selectedFlowForSteps?.id || flows[0]?.id || 'flow-principal-pitoco';
    setStudioFlowId(targetId);
    setViewMode('studio');
  };

  // Filtragem de Fluxos
  const filteredFlows = useMemo(() => {
    return flows.filter(f => {
      const matchSearch = 
        f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (f.trigger_type || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (f.store_name || '').toLowerCase().includes(searchTerm.toLowerCase());
      return matchSearch;
    });
  }, [flows, searchTerm]);

  // Contadores
  const activeFlowsCount = useMemo(() => flows.filter(f => f.is_active).length, [flows]);

  // Se o usuário estiver no modo Studio Visual N8N / BotGhost (Tela Cheia Imersiva)
  if (viewMode === 'studio') {
    return (
      <div className="fixed inset-0 z-50 w-screen h-screen bg-dark-950 flex flex-col overflow-hidden m-0 p-0">
        <FlowEditorPage
          flowId={studioFlowId || flows[0]?.id || 'flow-principal-pitoco'}
          onNavigate={(path) => {
            if (path === '/fluxos') {
              setViewMode('list');
              loadData();
            } else if (onNavigate) {
              onNavigate(path);
            }
          }}
          onBack={() => {
            setViewMode('list');
            loadData();
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-dark-900 border border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-pitoco-blue/20 text-pitoco-blue border border-pitoco-blue/30 flex items-center gap-1.5">
              <GitFork className="w-3.5 h-3.5" />
              Gestão de Fluxos do WhatsApp
            </span>
            <span className="text-xs text-emerald-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              {activeFlowsCount} Fluxo(s) Ativo(s) no Robô
            </span>
          </div>
          <h2 className="text-xl font-bold text-white">
            Árvores de Atendimento, Vendas & Encaminhamento
          </h2>
          <p className="text-xs text-slate-400">
            Crie, edite, ative/desative e gerencie as automações do bot com suporte a multi-lojas e transbordo humano.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="text-xs border-white/10 text-slate-300 hover:text-white flex items-center gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>

          <Button
            size="sm"
            onClick={() => setIsSimulating(!isSimulating)}
            className={`text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-2 ${
              isSimulating 
                ? 'bg-pitoco-pink text-slate-950' 
                : 'bg-white/10 hover:bg-white/15 text-white'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            {isSimulating ? 'Fechar Simulador' : 'Simular WhatsApp'}
          </Button>

          <Button
            size="sm"
            onClick={() => handleOpenStudio()}
            className="bg-gradient-to-r from-purple-600 via-indigo-600 to-pitoco-blue hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-2 shadow-glow-primary border border-purple-400/30"
          >
            <Sparkles className="w-4 h-4 text-white animate-pulse" />
            Studio N8N / BotGhost
          </Button>

          <Button
            size="sm"
            onClick={handleOpenCreateFlow}
            className="bg-pitoco-blue text-slate-900 hover:bg-pitoco-blue/90 font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-2 shadow-glow-primary"
          >
            <Plus className="w-4 h-4" />
            Novo Fluxo
          </Button>
        </div>
      </div>

      {/* Barra de Busca */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-xl bg-dark-900 border border-white/10">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome do fluxo, gatilho ou filial..."
            className="w-full pl-9 pr-3 py-2 bg-dark-800 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pitoco-blue"
          />
        </div>

        <span className="text-xs text-slate-400">
          Mostrando <strong className="text-white">{filteredFlows.length}</strong> fluxo(s) cadastrado(s)
        </span>
      </div>

      {/* Grid Principal: Fluxos e Simulador Opcional */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Lado Esquerdo: Lista de Fluxos */}
        <div className={isSimulating ? 'md:col-span-7 space-y-4' : 'md:col-span-12 space-y-4'}>
          {filteredFlows.map((flow) => {
            const isSelected = selectedFlowForSteps?.id === flow.id;
            return (
              <Card 
                key={flow.id} 
                className={`p-5 bg-dark-900 border transition-all ${
                  flow.is_active 
                    ? 'border-white/10 hover:border-pitoco-blue/40' 
                    : 'border-white/5 opacity-70 bg-dark-950/50'
                }`}
              >
                {/* Cabeçalho do Card */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/5">
                  <div className="flex items-center gap-2.5">
                    <div className={`p-2 rounded-xl border ${
                      flow.is_active 
                        ? 'bg-pitoco-blue/15 text-pitoco-blue border-pitoco-blue/30' 
                        : 'bg-dark-800 text-slate-500 border-white/5'
                    }`}>
                      <GitFork className="w-4 h-4" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-white">
                          {flow.name}
                        </h3>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/5 text-slate-400 border border-white/10">
                          v{flow.version || 1}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 block mt-0.5">
                        {flow.description}
                      </span>
                    </div>
                  </div>

                  {/* Ativar / Desativar Switch Button */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleFlowStatus(flow)}
                      title={flow.is_active ? 'Clique para desativar este fluxo' : 'Clique para ativar este fluxo'}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                        flow.is_active
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25 shadow-sm'
                          : 'bg-dark-800 text-slate-400 border border-white/10 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <Power className={`w-3.5 h-3.5 ${flow.is_active ? 'text-emerald-400' : 'text-slate-500'}`} />
                      {flow.is_active ? 'Fluxo Ativo' : 'Desativado'}
                    </button>
                  </div>
                </div>

                {/* Metadados: Gatilho, Loja Vinculada, Quantidade de Passos */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 my-3 py-2 text-xs bg-dark-950/40 rounded-xl p-3 border border-white/5">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-pitoco-blue" />
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase font-semibold">Gatilho</span>
                      <span className="text-slate-200 font-medium">{flow.trigger_type || 'Mensagem'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <StoreIcon className="w-3.5 h-3.5 text-emerald-400" />
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase font-semibold">Loja / Destino</span>
                      <span className="text-slate-200 font-medium">{flow.store_name || 'Toda a Rede'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5 text-pitoco-pink" />
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase font-semibold">Estrutura</span>
                      <span className="text-slate-200 font-medium">{flow.steps?.length || flow.node_count || 4} Nós / Passos</span>
                    </div>
                  </div>
                </div>

                {/* Lista Visual Resumida dos Passos do Fluxo */}
                {flow.steps && flow.steps.length > 0 && (
                  <div className="mb-4">
                    <span className="text-[10px] font-semibold text-slate-400 block mb-1.5 uppercase">
                      Jornada do Cliente no Fluxo:
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {flow.steps.map((step, idx) => (
                        <React.Fragment key={step.id}>
                          <span className="px-2 py-1 rounded-lg text-[10px] font-semibold bg-dark-800 border border-white/10 text-slate-300 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-pitoco-blue" />
                            {step.title}
                          </span>
                          {idx < flow.steps.length - 1 && (
                            <ArrowRight className="w-3 h-3 text-slate-600" />
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                )}

                {/* Botões de Ação do Card */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/5">
                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedFlowForSteps(flow)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-xl border flex items-center gap-1.5 ${
                        isSelected 
                          ? 'border-pitoco-blue bg-pitoco-blue/15 text-pitoco-blue' 
                          : 'border-white/10 text-slate-300 hover:text-white'
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5" />
                      Visualizar Passos
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDuplicateFlow(flow)}
                      className="text-xs font-semibold border-white/10 text-slate-300 hover:text-white px-2.5 py-1.5 rounded-xl flex items-center gap-1"
                      title="Duplicar Fluxo"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      Duplicar
                    </Button>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <Button
                      size="sm"
                      onClick={() => handleOpenStudio(flow.id)}
                      className="bg-gradient-to-r from-purple-600/20 via-indigo-600/20 to-pitoco-blue/20 hover:from-purple-600/35 hover:to-pitoco-blue/35 text-white font-bold text-xs px-3 py-1.5 rounded-xl border border-purple-500/40 flex items-center gap-1.5 shadow-sm transition-all"
                      title="Abrir e editar fluxo no Studio Visual estilo N8N e BotGhost"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-pitoco-blue animate-pulse" />
                      Visual Studio N8N
                    </Button>

                    <Button
                      size="sm"
                      onClick={() => handleOpenEditFlow(flow)}
                      className="bg-white/10 hover:bg-white/15 text-white font-bold text-xs px-3 py-1.5 rounded-xl flex items-center gap-1.5"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-pitoco-blue" />
                      Editar Fluxo
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setFlowToDelete(flow)}
                      className="p-2 border-white/10 text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/30 rounded-xl"
                      title="Apagar Fluxo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}

          {filteredFlows.length === 0 && (
            <div className="p-12 text-center rounded-2xl bg-dark-900 border border-white/5">
              <GitFork className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white">Nenhum fluxo encontrado</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Crie um novo fluxo de atendimento clicando no botão acima.
              </p>
            </div>
          )}
        </div>

        {/* Lado Direito: Simulador de WhatsApp Live */}
        {isSimulating && (
          <div className="md:col-span-5 sticky top-6">
            <Card className="p-4 bg-dark-900 border-white/10 flex flex-col items-center">
              <div className="w-full flex items-center justify-between pb-3 mb-3 border-b border-white/5">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-pitoco-blue" />
                  Simulador de Atendimento Live
                </span>
                <span className="text-[10px] text-emerald-400 font-medium">WhatsApp Online</span>
              </div>
              <FlowSimulator />
            </Card>
          </div>
        )}
      </div>

      {/* Modal: Criar ou Editar Fluxo */}
      <Modal
        isOpen={isFlowModalOpen}
        onClose={() => setIsFlowModalOpen(false)}
        title={editingFlow ? `Editar Fluxo: ${editingFlow.name}` : 'Criar Novo Fluxo de Atendimento'}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSaveFlow} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Nome do Fluxo:
            </label>
            <input
              type="text"
              value={flowName}
              onChange={e => setFlowName(e.target.value)}
              placeholder="ex: Atendimento Principal e Vendas de Enxoval"
              className="w-full px-3 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pitoco-blue"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Descrição do Fluxo & Objetivo:
            </label>
            <textarea
              value={flowDescription}
              onChange={e => setFlowDescription(e.target.value)}
              placeholder="Descreva o propósito deste fluxo e a jornada do cliente..."
              rows={2}
              className="w-full px-3 py-2 bg-dark-800 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pitoco-blue resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Gatilho de Disparo:
              </label>
              <select
                value={flowTrigger}
                onChange={e => setFlowTrigger(e.target.value)}
                className="w-full px-3 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-pitoco-blue"
              >
                <option value="Qualquer Mensagem Recebida">Qualquer Mensagem Recebida</option>
                <option value="Palavra-Chave / Menu (#enxoval, menu, etc.)">Palavra-Chave / Menu</option>
                <option value="Transbordo para Atendimento Humano">Transbordo Humano</option>
                <option value="Fora do Horário Comercial">Fora do Horário Comercial</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Loja / Unidade Vinculada:
              </label>
              <select
                value={flowStoreId}
                onChange={e => setFlowStoreId(e.target.value)}
                className="w-full px-3 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-pitoco-blue"
              >
                <option value="all">Toda a Rede (Global)</option>
                {stores.map(st => (
                  <option key={st.id} value={st.id}>{st.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Status Inicial */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Status do Fluxo:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFlowActive(true)}
                className={`p-2.5 rounded-xl text-center text-xs font-bold border transition-all ${
                  flowActive
                    ? 'border-emerald-500 bg-emerald-500/15 text-emerald-400'
                    : 'border-white/5 bg-dark-800 text-slate-400'
                }`}
              >
                Ativo no Robô WhatsApp
              </button>
              <button
                type="button"
                onClick={() => setFlowActive(false)}
                className={`p-2.5 rounded-xl text-center text-xs font-bold border transition-all ${
                  !flowActive
                    ? 'border-amber-500 bg-amber-500/15 text-amber-400'
                    : 'border-white/5 bg-dark-800 text-slate-400'
                }`}
              >
                Desativado / Rascunho
              </button>
            </div>
          </div>

          {/* Gerenciamento dos Passos do Fluxo */}
          <div className="pt-2 border-t border-white/5">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-pitoco-blue" />
                Passos & Ações do Fluxo ({flowSteps.length}):
              </label>
            </div>

            {/* Lista dos Passos Existentes */}
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {flowSteps.map((step, idx) => (
                <div 
                  key={step.id} 
                  className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-dark-800/80 border border-white/5 text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-5 h-5 rounded-full bg-dark-900 border border-white/10 flex items-center justify-center text-[10px] font-bold text-slate-400 flex-shrink-0">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <span className="font-bold text-white block truncate">{step.title}</span>
                      <span className="text-[10px] text-slate-400 block truncate">{step.description}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveStep(idx)}
                    className="p-1 text-slate-500 hover:text-rose-400 transition-colors flex-shrink-0"
                    title="Remover Passo"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Ações Rápidas para Adicionar Módulos ao Fluxo */}
            <div className="mt-3 pt-2 border-t border-white/5">
              <span className="text-[10px] text-slate-400 font-semibold block mb-1.5 uppercase">
                Adicionar Módulo à Árvore:
              </span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => handleAddStep('message', 'Boas-Vindas Pitoco', 'Atendimento', 'Saudação com menu oficial')}
                  className="px-2 py-1 rounded-lg bg-dark-800 hover:bg-dark-700 border border-white/10 text-[10px] text-slate-300 font-medium"
                >
                  + Boas-Vindas
                </button>
                <button
                  type="button"
                  onClick={() => handleAddStep('show_catalog', 'Catálogo de Produtos', 'Vendas', 'Bodies, macacões e saídas')}
                  className="px-2 py-1 rounded-lg bg-dark-800 hover:bg-dark-700 border border-white/10 text-[10px] text-emerald-400 font-medium"
                >
                  + Catálogo
                </button>
                <button
                  type="button"
                  onClick={() => handleAddStep('measure_guide', 'Guia de Medidas RN a 3 anos', 'Consultoria', 'Tabela de peso e altura')}
                  className="px-2 py-1 rounded-lg bg-dark-800 hover:bg-dark-700 border border-white/10 text-[10px] text-amber-400 font-medium"
                >
                  + Guia Medidas
                </button>
                <button
                  type="button"
                  onClick={() => handleAddStep('layette_checklist', 'Mala de Maternidade', 'Consultoria', 'Checklist essencial das 48h')}
                  className="px-2 py-1 rounded-lg bg-dark-800 hover:bg-dark-700 border border-white/10 text-[10px] text-purple-400 font-medium"
                >
                  + Checklist Mala
                </button>
                <button
                  type="button"
                  onClick={() => handleAddStep('vip_consultation', 'Consultoria VIP', 'Atendimento', 'Agendamento com especialista')}
                  className="px-2 py-1 rounded-lg bg-dark-800 hover:bg-dark-700 border border-white/10 text-[10px] text-pitoco-pink font-medium"
                >
                  + Consultoria VIP
                </button>
                <button
                  type="button"
                  onClick={() => handleAddStep('shipping_calculator', 'Cálculo de Frete', 'Logística', 'Motoboy e Correios')}
                  className="px-2 py-1 rounded-lg bg-dark-800 hover:bg-dark-700 border border-white/10 text-[10px] text-sky-400 font-medium"
                >
                  + Frete Express
                </button>
                <button
                  type="button"
                  onClick={() => handleAddStep('pix_payment', 'Pagamento PIX', 'Financeiro', 'Chave e Copia e Cola')}
                  className="px-2 py-1 rounded-lg bg-dark-800 hover:bg-dark-700 border border-white/10 text-[10px] text-emerald-400 font-medium"
                >
                  + PIX Oficial
                </button>
                <button
                  type="button"
                  onClick={() => handleAddStep('human_handoff', 'Transbordo Humano', 'Multi-Lojas', 'Transferência para equipe da loja')}
                  className="px-2 py-1 rounded-lg bg-dark-800 hover:bg-dark-700 border border-white/10 text-[10px] text-rose-400 font-medium"
                >
                  + Transbordo
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-white/5">
            <div>
              {editingFlow && (
                <Button
                  type="button"
                  onClick={() => {
                    setIsFlowModalOpen(false);
                    handleOpenStudio(editingFlow.id);
                  }}
                  className="bg-gradient-to-r from-purple-600 to-pitoco-blue hover:from-purple-500 hover:to-pitoco-blue text-white font-bold text-xs px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm"
                >
                  <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                  Abrir no Studio N8N
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsFlowModalOpen(false)}
                className="text-xs border-white/10 text-slate-300"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSavingFlow}
                className="bg-pitoco-blue text-slate-950 font-bold text-xs px-5 rounded-xl hover:bg-pitoco-blue/90"
              >
                {isSavingFlow ? 'Salvando...' : editingFlow ? 'Salvar Alterações' : 'Criar Fluxo'}
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Modal de Confirmação de Exclusão */}
      <Modal
        isOpen={Boolean(flowToDelete)}
        onClose={() => setFlowToDelete(null)}
        title="Confirmar Exclusão de Fluxo"
        maxWidth="max-w-sm"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-300">
            Tem certeza que deseja apagar o fluxo <strong className="text-white">"{flowToDelete?.name}"</strong>?
          </p>
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-[11px] text-rose-300">
            Esta automação deixará de responder às mensagens dos clientes no WhatsApp.
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setFlowToDelete(null)}
              className="text-xs border-white/10 text-slate-300"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmDelete}
              className="bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs rounded-xl"
            >
              Sim, Apagar Fluxo
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
