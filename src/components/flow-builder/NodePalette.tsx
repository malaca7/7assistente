import React, { useState, useRef, useEffect } from 'react';
import { 
  Zap, 
  MessageSquare, 
  ListChecks, 
  HelpCircle, 
  GitBranch, 
  Clock, 
  Globe, 
  Webhook, 
  Sliders, 
  Sparkles, 
  Image as ImageIcon, 
  UserCheck,
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  GripVertical,
  Calendar,
  DollarSign,
  Users
} from 'lucide-react';
import { NodeTypeEnum } from '../../types';
import { cn } from '../../lib/utils';

export interface NodeDefinition {
  type: NodeTypeEnum;
  label: string;
  category: 'Triggers' | 'Messages' | 'Logic' | 'Integrations' | 'AI & Tools';
  description: string;
  icon: React.ReactNode;
  iconBg: string;
  defaultConfig: Record<string, any>;
}

export const NODE_DEFINITIONS: NodeDefinition[] = [
  {
    type: 'trigger',
    label: 'Gatilho',
    category: 'Triggers',
    description: 'Inicia o fluxo ao receber mensagens ou eventos.',
    icon: <Zap className="w-4 h-4" />,
    iconBg: 'bg-emerald-500',
    defaultConfig: { eventType: 'any_message', keywords: '', matchType: 'contains' },
  },
  {
    type: 'message',
    label: 'Enviar Mensagem',
    category: 'Messages',
    description: 'Envia texto com suporte a variáveis dinâmicas.',
    icon: <MessageSquare className="w-4 h-4" />,
    iconBg: 'bg-brand-600',
    defaultConfig: { text: 'Olá! Como posso ajudar você hoje?', previewUrl: false },
  },
  {
    type: 'buttons',
    label: 'Botões Interativos WhatsApp',
    category: 'Messages',
    description: 'Envia menu de opções com ramificações individuais para cada botão.',
    icon: <ListChecks className="w-4 h-4" />,
    iconBg: 'bg-brand-600',
    defaultConfig: {
      bodyText: 'Escolha uma das opções abaixo para continuarmos:',
      footerText: '7 Assistente • Resposta Automática',
      buttons: [
        { id: 'btn_1', title: '1. Falar com Atendente' },
        { id: 'btn_2', title: '2. Consultar Preços' },
        { id: 'btn_3', title: '3. Dúvidas Frequentes' },
      ],
    },
  },
  {
    type: 'question',
    label: 'Pergunta & Resposta',
    category: 'Messages',
    description: 'Faz uma pergunta e armazena a resposta em variável.',
    icon: <HelpCircle className="w-4 h-4" />,
    iconBg: 'bg-cyan-500',
    defaultConfig: {
      questionText: 'Por favor, informe seu nome completo:',
      expectedType: 'text',
      variableName: 'nome_cliente',
    },
  },
  {
    type: 'services_catalog',
    label: 'Catálogo de Serviços & Preços',
    category: 'Messages',
    description: 'Exibe lista de serviços e valores cadastrados na Agenda com opções interativas.',
    icon: <DollarSign className="w-4 h-4" />,
    iconBg: 'bg-amber-600',
    defaultConfig: {
      displayFormat: 'buttons',
      introMessage: 'Conheça nossos serviços e valores:',
      footerText: 'Toque no serviço desejado para agendar:',
      serviceVarName: 'servico_selecionado',
      priceVarName: 'valor_servico',
      durationVarName: 'duracao_servico',
    },
  },
  {
    type: 'media',
    label: 'Enviar Mídia',
    category: 'Messages',
    description: 'Envia fotos, áudios, vídeos ou documentos PDF.',
    icon: <ImageIcon className="w-4 h-4" />,
    iconBg: 'bg-pink-500',
    defaultConfig: { mediaType: 'image', mediaUrl: '', caption: '' },
  },
  {
    type: 'check_contact',
    label: 'Verificar Contato (Novo vs Salvo)',
    category: 'Logic',
    description: 'Verifica se é o primeiro contato do cliente ou contato existente e cria variáveis.',
    icon: <Users className="w-4 h-4" />,
    iconBg: 'bg-indigo-600',
    defaultConfig: {},
  },
  {
    type: 'condition',
    label: 'Condição / IF',
    category: 'Logic',
    description: 'Ramifica o fluxo em TRUE e FALSE baseado em regras.',
    icon: <GitBranch className="w-4 h-4" />,
    iconBg: 'bg-purple-500',
    defaultConfig: { variable: 'status', operator: '==', value: 'ativo' },
  },
  {
    type: 'delay',
    label: 'Aguardar / Espera',
    category: 'Logic',
    description: 'Pausa a execução por um intervalo de tempo.',
    icon: <Clock className="w-4 h-4" />,
    iconBg: 'bg-amber-600',
    defaultConfig: { amount: 5, unit: 'segundos' },
  },
  {
    type: 'variable',
    label: 'Definir Variável',
    category: 'Logic',
    description: 'Cria ou atualiza variáveis de contexto.',
    icon: <Sliders className="w-4 h-4" />,
    iconBg: 'bg-violet-500',
    defaultConfig: { varName: 'etapa_funil', varValue: 'qualificado' },
  },
  {
    type: 'ai_agent',
    label: 'Agente de IA',
    category: 'AI & Tools',
    description: 'Executa prompts inteligentes com LLM e Persona.',
    icon: <Sparkles className="w-4 h-4" />,
    iconBg: 'bg-gradient-to-tr from-purple-600 to-indigo-500',
    defaultConfig: {
      model: 'gemini-1.5-pro',
      temperature: 0.4,
      persona: 'Assistente especialista da empresa',
      systemPrompt: 'Você é o 7 Assistente. Responda de forma clara e objetiva.',
    },
  },
  {
    type: 'human_handoff',
    label: 'Transferir para Humano',
    category: 'AI & Tools',
    description: 'Pausa o bot e notifica atendentes humanos.',
    icon: <UserCheck className="w-4 h-4" />,
    iconBg: 'bg-rose-500',
    defaultConfig: {
      department: 'Suporte N1',
      notifyMessage: 'Você foi transferido para nossa equipe de atendimento.',
    },
  },
  {
    type: 'schedule_contact',
    label: 'Agenda & Horários Livres',
    category: 'Integrations',
    description: 'Mostra horários disponíveis na agenda e confirma o agendamento no WhatsApp.',
    icon: <Calendar className="w-4 h-4" />,
    iconBg: 'bg-emerald-600',
    defaultConfig: {
      mode: 'show_slots',
      dateType: 'today',
      dateVariable: 'data_agendamento',
      serviceName: '',
      confirmMessage: '✅ Seu agendamento foi confirmado para {{data_agendamento}} às {{horario_agendamento}}!',
    },
  },
  {
    type: 'update_contact',
    label: 'Salvar / Vincular Dados',
    category: 'Logic',
    description: 'Salva nome, tags e campos personalizados direto no WhatsApp do cliente.',
    icon: <Sliders className="w-4 h-4" />,
    iconBg: 'bg-cyan-600',
    defaultConfig: {
      phoneVarName: 'telefone_whatsapp',
      contactName: 'nome_cliente',
      tags: 'Lead Qualificado, WhatsApp',
      customFieldKey: 'interesse_principal',
      customFieldValue: 'opcao_selecionada',
    },
  },
  {
    type: 'http_request',
    label: 'Requisição HTTP / API',
    category: 'Integrations',
    description: 'Dispara requisições GET/POST para APIs externas.',
    icon: <Globe className="w-4 h-4" />,
    iconBg: 'bg-blue-500',
    defaultConfig: { method: 'POST', url: 'https://api.exemplo.com/v1', headers: {}, body: '{}' },
  },
  {
    type: 'webhook',
    label: 'Disparo Webhook',
    category: 'Integrations',
    description: 'Gera endpoint único para receber eventos externos.',
    icon: <Webhook className="w-4 h-4" />,
    iconBg: 'bg-teal-500',
    defaultConfig: { endpoint: 'lead-incoming' },
  },
];

export interface NodePaletteProps {
  onAddNode: (def: NodeDefinition) => void;
  isOpen: boolean;
  onToggleOpen: () => void;
  width: number;
  onWidthChange: (newWidth: number) => void;
}

export const NodePalette: React.FC<NodePaletteProps> = ({
  onAddNode,
  isOpen,
  onToggleOpen,
  width,
  onWidthChange,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isResizing, setIsResizing] = useState(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(width);

  const categories = ['all', 'Triggers', 'Messages', 'Logic', 'Integrations', 'AI & Tools'];

  const filtered = NODE_DEFINITIONS.filter((item) => {
    const matchesSearch =
      item.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  // Handle Drag Resize on Right Border
  const startResizing = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    startXRef.current = e.clientX;
    startWidthRef.current = width;
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const delta = e.clientX - startXRef.current;
      const newWidth = Math.min(Math.max(startWidthRef.current + delta, 240), 480);
      onWidthChange(newWidth);
    };

    const handleMouseUp = () => {
      if (isResizing) {
        setIsResizing(false);
      }
    };

    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, onWidthChange]);

  return (
    <div className="relative flex h-full z-20 select-none">
      {/* Collapsed State Strip / Opener */}
      {!isOpen ? (
        <button
          onClick={onToggleOpen}
          className="h-full w-9 bg-dark-900 border-r border-white/10 hover:bg-dark-850 flex flex-col items-center justify-center gap-3 text-slate-400 hover:text-white transition-colors group shadow-2xl"
          title="Abrir Adicionar Nós"
        >
          <div className="p-1 rounded-lg bg-primary-600/20 text-primary-400 border border-primary-500/30 group-hover:scale-110 transition-transform">
            <Plus className="w-4 h-4" />
          </div>
          <span className="[writing-mode:vertical-rl] text-xs font-bold tracking-wider text-slate-400 group-hover:text-slate-200">
            Adicionar Nós
          </span>
          <ChevronRight className="w-4 h-4 text-primary-400" />
        </button>
      ) : (
        /* Expanded Sidebar Panel */
        <aside
          style={{ width: `${width}px` }}
          className="bg-dark-900 border-r border-white/5 flex flex-col h-full shadow-2xl relative transition-all duration-75"
        >
          {/* Header */}
          <div className="p-3.5 border-b border-white/5 space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white tracking-tight flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-primary-600/20 text-primary-400 border border-primary-500/30 flex items-center justify-center">
                  <Plus className="w-3.5 h-3.5" />
                </div>
                Adicionar Nó ao Fluxo
              </h3>
              <button
                onClick={onToggleOpen}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Recolher painel de nós"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar nós (ex: IA, Mensagem)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-dark-950/80 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Categories pills */}
            <div className="flex gap-1 overflow-x-auto pb-1 no-scrollbar">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    'px-2 py-0.5 rounded-lg text-[10px] font-medium whitespace-nowrap transition-colors',
                    selectedCategory === cat
                      ? 'bg-primary-600 text-white'
                      : 'bg-dark-800 text-slate-400 hover:text-slate-200'
                  )}
                >
                  {cat === 'all' ? 'Todos' : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Nodes list */}
          <div className="flex-1 p-2.5 overflow-y-auto space-y-1.5">
            {filtered.map((nodeDef) => (
              <div
                key={nodeDef.type}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('application/reactflow', JSON.stringify(nodeDef));
                  e.dataTransfer.effectAllowed = 'move';
                }}
                onClick={() => onAddNode(nodeDef)}
                className="p-2.5 rounded-xl bg-dark-850/60 hover:bg-dark-800/90 border border-slate-800/80 hover:border-primary-500/40 cursor-grab active:cursor-grabbing transition-all duration-150 flex items-start gap-2.5 group hover:shadow-lg hover:shadow-primary-500/5 hover:-translate-y-0.5"
                title="Clique para adicionar no centro da tela ou arraste para qualquer lugar no fluxo"
              >
                <div
                  className={cn(
                    'w-7 h-7 rounded-lg flex items-center justify-center text-white shadow-sm flex-shrink-0 group-hover:scale-105 transition-transform mt-0.5',
                    nodeDef.iconBg
                  )}
                >
                  {nodeDef.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white group-hover:text-primary-300 transition-colors truncate">
                      {nodeDef.label}
                    </span>
                    <span className="text-[9px] text-slate-500 font-mono uppercase">{nodeDef.category}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 line-clamp-2 mt-0.5 leading-tight">
                    {nodeDef.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Draggable Resizer Handle on Right Border */}
          <div
            onMouseDown={startResizing}
            className={cn(
              'absolute top-0 right-0 bottom-0 w-2 cursor-col-resize hover:bg-primary-500/50 transition-colors z-30 flex items-center justify-center group',
              isResizing && 'bg-primary-500'
            )}
            title="Arraste para redimensionar painel"
          >
            <div className="w-0.5 h-8 bg-slate-600 group-hover:bg-white rounded-full opacity-60 group-hover:opacity-100" />
          </div>
        </aside>
      )}
    </div>
  );
};
