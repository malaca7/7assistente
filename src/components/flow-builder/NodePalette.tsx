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
  Users,
  CheckCircle2,
  CalendarCheck,
  Tag,
  Layers,
  ChevronDown
} from 'lucide-react';
import { NodeTypeEnum } from '../../types';
import { cn } from '../../lib/utils';

export type NodeCategory = 'Triggers' | 'Messages' | 'Agenda' | 'CRM & Logic' | 'AI & Support' | 'Integrations';

export interface NodeDefinition {
  type: NodeTypeEnum;
  label: string;
  category: NodeCategory;
  description: string;
  icon: React.ReactNode;
  iconBg: string;
  accentColor: string;
  badge?: string;
  outputVars?: string[];
  defaultConfig: Record<string, any>;
}

export const CATEGORY_INFO: Record<NodeCategory, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  'Triggers': {
    label: 'Gatilhos',
    icon: <Zap className="w-3.5 h-3.5" />,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10 border-amber-500/20',
  },
  'Messages': {
    label: 'Mensagens & Menus',
    icon: <MessageSquare className="w-3.5 h-3.5" />,
    color: 'text-primary-400',
    bg: 'bg-primary-500/10 border-primary-500/20',
  },
  'Agenda': {
    label: 'Agenda & Serviços',
    icon: <Calendar className="w-3.5 h-3.5" />,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/20',
  },
  'CRM & Logic': {
    label: 'Lógica & Contatos',
    icon: <GitBranch className="w-3.5 h-3.5" />,
    color: 'text-purple-400',
    bg: 'bg-purple-500/10 border-purple-500/20',
  },
  'AI & Support': {
    label: 'IA & Atendimento',
    icon: <Sparkles className="w-3.5 h-3.5" />,
    color: 'text-pink-400',
    bg: 'bg-pink-500/10 border-pink-500/20',
  },
  'Integrations': {
    label: 'Integrações & APIs',
    icon: <Globe className="w-3.5 h-3.5" />,
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10 border-cyan-500/20',
  },
};

export const NODE_DEFINITIONS: NodeDefinition[] = [
  // 1. Triggers
  {
    type: 'trigger',
    label: 'Gatilho Inicial',
    category: 'Triggers',
    description: 'Inicia o fluxo ao receber mensagens de texto ou palavras-chave no WhatsApp.',
    icon: <Zap className="w-4 h-4" />,
    iconBg: 'bg-amber-500',
    accentColor: 'border-amber-500/40',
    badge: 'Início',
    defaultConfig: { eventType: 'any_message', keywords: '', matchType: 'contains' },
  },

  // 2. Messages & Interactions
  {
    type: 'message',
    label: 'Enviar Mensagem',
    category: 'Messages',
    description: 'Envia texto formatado no WhatsApp com variáveis dinâmicas (ex: {{nome_cliente}}).',
    icon: <MessageSquare className="w-4 h-4" />,
    iconBg: 'bg-primary-600',
    accentColor: 'border-primary-500/40',
    defaultConfig: { text: 'Olá! Como posso ajudar você hoje?', previewUrl: false },
  },
  {
    type: 'buttons',
    label: 'Botões Interativos WhatsApp',
    category: 'Messages',
    description: 'Envia menu com opções clicáveis com saídas individuais para cada botão.',
    icon: <ListChecks className="w-4 h-4" />,
    iconBg: 'bg-primary-600',
    accentColor: 'border-primary-500/40',
    badge: 'Interativo',
    defaultConfig: {
      bodyText: 'Escolha uma das opções abaixo para continuarmos:',
      footerText: '7 Assistente • Resposta Automática',
      buttons: [
        { id: 'btn_1', title: '1. Agendar Horário' },
        { id: 'btn_2', title: '2. Consultar Preços' },
        { id: 'btn_3', title: '3. Falar com Atendente' },
      ],
    },
  },
  {
    type: 'question',
    label: 'Pergunta & Resposta',
    category: 'Messages',
    description: 'Faz uma pergunta ao cliente e salva o texto digitado em uma variável.',
    icon: <HelpCircle className="w-4 h-4" />,
    iconBg: 'bg-cyan-600',
    accentColor: 'border-cyan-500/40',
    outputVars: ['nome_cliente'],
    defaultConfig: {
      questionText: 'Por favor, informe seu nome completo:',
      expectedType: 'text',
      variableName: 'nome_cliente',
    },
  },
  {
    type: 'media',
    label: 'Enviar Mídia',
    category: 'Messages',
    description: 'Envia fotos, áudios de voz (PTT), vídeos ou documentos PDF.',
    icon: <ImageIcon className="w-4 h-4" />,
    iconBg: 'bg-pink-600',
    accentColor: 'border-pink-500/40',
    defaultConfig: { mediaType: 'image', mediaUrl: '', caption: '' },
  },

  // 3. Agenda & Agendamentos (Fluxo Completo)
  {
    type: 'ask_date',
    label: '1. Escolher Dia do Agendamento',
    category: 'Agenda',
    description: 'Oferece botões rápidos (Hoje, Amanhã) ou permite o cliente digitar uma data (ex: 25/08).',
    icon: <Calendar className="w-4 h-4" />,
    iconBg: 'bg-teal-600',
    accentColor: 'border-teal-500/40',
    badge: 'Etapa 1',
    outputVars: ['data_agendamento', 'data_formatada'],
    defaultConfig: {
      questionText: 'Para qual dia você gostaria de agendar seu atendimento?',
      dateVariable: 'data_agendamento',
      allowCustomDate: true,
    },
  },
  {
    type: 'services_catalog',
    label: '2. Catálogo de Serviços & Preços',
    category: 'Agenda',
    description: 'Puxa serviços e preços da Agenda e envia em botões interativos para escolha.',
    icon: <DollarSign className="w-4 h-4" />,
    iconBg: 'bg-amber-600',
    accentColor: 'border-amber-500/40',
    badge: 'Etapa 2',
    outputVars: ['servico_selecionado', 'valor_servico', 'duracao_servico'],
    defaultConfig: {
      displayFormat: 'buttons',
      introMessage: 'Conheça nossos serviços e valores disponíveis:',
      footerText: 'Toque no serviço desejado para agendar:',
      serviceVarName: 'servico_selecionado',
      priceVarName: 'valor_servico',
      durationVarName: 'duracao_servico',
    },
  },
  {
    type: 'schedule_contact',
    label: '3. Horários Livres da Agenda',
    category: 'Agenda',
    description: 'Calcula horários realmente livres para a data e serviço, enviando opções para o cliente.',
    icon: <Clock className="w-4 h-4" />,
    iconBg: 'bg-emerald-600',
    accentColor: 'border-emerald-500/40',
    badge: 'Etapa 3',
    outputVars: ['horario_agendamento'],
    defaultConfig: {
      mode: 'show_slots',
      dateType: 'variable',
      dateVariable: 'data_agendamento',
      serviceName: '{{servico_selecionado}}',
      introMessage: 'Estes são os horários disponíveis para agendamento. Toque no seu horário preferido:',
    },
  },
  {
    type: 'confirm_booking',
    label: '4. Confirmar & Gravar Agendamento',
    category: 'Agenda',
    description: 'Exibe resumo com serviço, valor, data e horário, grava na Agenda e adiciona tag Agendado.',
    icon: <CheckCircle2 className="w-4 h-4" />,
    iconBg: 'bg-emerald-600',
    accentColor: 'border-emerald-500/40',
    badge: 'Etapa 4',
    defaultConfig: {
      confirmMessage: '✅ Perfeito {{nome_cliente}}! Seu agendamento de *{{servico_selecionado}}* foi confirmado para o dia *{{data_agendamento}}* às *{{horario_agendamento}}*!',
    },
  },

  // 4. CRM & Logic
  {
    type: 'check_contact',
    label: 'Verificar Contato (Novo vs Salvo)',
    category: 'CRM & Logic',
    description: 'Bifurca o fluxo entre Primeiro Contato (1ª Vez) e Contato Salvo (Recorrente).',
    icon: <Users className="w-4 h-4" />,
    iconBg: 'bg-indigo-600',
    accentColor: 'border-indigo-500/40',
    badge: 'Decisão',
    outputVars: ['is_primeiro_contato', 'nome_cliente', 'telefone_whatsapp'],
    defaultConfig: {},
  },
  {
    type: 'update_contact',
    label: 'Salvar / Vincular Dados',
    category: 'CRM & Logic',
    description: 'Salva nome, foto oficial, tags e campos customizados direto no perfil do WhatsApp.',
    icon: <Sliders className="w-4 h-4" />,
    iconBg: 'bg-cyan-600',
    accentColor: 'border-cyan-500/40',
    defaultConfig: {
      phoneVarName: 'telefone_whatsapp',
      contactName: 'nome_cliente',
      tags: 'Lead WhatsApp',
      customFieldKey: 'interesse_principal',
      customFieldValue: 'servico_selecionado',
    },
  },
  {
    type: 'condition',
    label: 'Condição / IF',
    category: 'CRM & Logic',
    description: 'Ramifica o fluxo em Verdadeiro (TRUE) e Falso (FALSE) baseado em comparações.',
    icon: <GitBranch className="w-4 h-4" />,
    iconBg: 'bg-purple-600',
    accentColor: 'border-purple-500/40',
    defaultConfig: { variable: 'status', operator: '==', value: 'ativo' },
  },
  {
    type: 'variable',
    label: 'Definir Variável',
    category: 'CRM & Logic',
    description: 'Armazena valores ou dados calculados em variáveis de contexto.',
    icon: <Sliders className="w-4 h-4" />,
    iconBg: 'bg-violet-600',
    accentColor: 'border-violet-500/40',
    defaultConfig: { varName: 'etapa_funil', varValue: 'agendamento_iniciado' },
  },
  {
    type: 'delay',
    label: 'Aguardar / Espera',
    category: 'CRM & Logic',
    description: 'Pausa a execução do fluxo por alguns segundos para simular digitação humana.',
    icon: <Clock className="w-4 h-4" />,
    iconBg: 'bg-amber-600',
    accentColor: 'border-amber-500/40',
    defaultConfig: { amount: 3, unit: 'segundos' },
  },

  // 5. AI & Support
  {
    type: 'ai_agent',
    label: 'Agente de IA',
    category: 'AI & Support',
    description: 'Responde dúvidas dos clientes de forma inteligente usando IA (Gemini).',
    icon: <Sparkles className="w-4 h-4" />,
    iconBg: 'bg-gradient-to-tr from-purple-600 to-indigo-500',
    accentColor: 'border-purple-500/40',
    badge: 'IA',
    defaultConfig: {
      model: 'gemini-1.5-pro',
      temperature: 0.4,
      persona: 'Assistente de Atendimento Especialista',
      systemPrompt: 'Você é o 7 Assistente. Atenda o cliente de forma educada e tire dúvidas sobre os serviços.',
    },
  },
  {
    type: 'human_handoff',
    label: 'Transferir para Humano',
    category: 'AI & Support',
    description: 'Pausa as respostas automáticas do bot e notifica um atendente humano.',
    icon: <UserCheck className="w-4 h-4" />,
    iconBg: 'bg-rose-600',
    accentColor: 'border-rose-500/40',
    badge: 'Pausa Bot',
    defaultConfig: {
      department: 'Atendimento Geral',
      notifyMessage: 'Você foi transferido para um de nossos atendentes humanos.',
    },
  },

  // 6. Integrations
  {
    type: 'http_request',
    label: 'Requisição HTTP / API',
    category: 'Integrations',
    description: 'Dispara requisições GET ou POST para APIs, CRMs ou Webhooks externos.',
    icon: <Globe className="w-4 h-4" />,
    iconBg: 'bg-blue-600',
    accentColor: 'border-blue-500/40',
    defaultConfig: { method: 'POST', url: 'https://api.exemplo.com/v1', headers: {}, body: '{}' },
  },
  {
    type: 'webhook',
    label: 'Disparo Webhook',
    category: 'Integrations',
    description: 'Cria um endpoint para receber eventos ou disparar alertas externos.',
    icon: <Webhook className="w-4 h-4" />,
    iconBg: 'bg-teal-600',
    accentColor: 'border-teal-500/40',
    defaultConfig: { endpoint: 'agendamento-novo' },
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

  const categories: Array<{ id: string; label: string; icon?: React.ReactNode }> = [
    { id: 'all', label: 'Todos', icon: <Layers className="w-3 h-3" /> },
    { id: 'Triggers', label: 'Gatilhos', icon: <Zap className="w-3 h-3 text-amber-400" /> },
    { id: 'Messages', label: 'Mensagens', icon: <MessageSquare className="w-3 h-3 text-primary-400" /> },
    { id: 'Agenda', label: 'Agenda & Serviços', icon: <Calendar className="w-3 h-3 text-emerald-400" /> },
    { id: 'CRM & Logic', label: 'Lógica & CRM', icon: <GitBranch className="w-3 h-3 text-purple-400" /> },
    { id: 'AI & Support', label: 'IA & Atendimento', icon: <Sparkles className="w-3 h-3 text-pink-400" /> },
    { id: 'Integrations', label: 'Integrações', icon: <Globe className="w-3 h-3 text-cyan-400" /> },
  ];

  const filtered = NODE_DEFINITIONS.filter((item) => {
    const matchesSearch =
      item.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  // Group nodes by category
  const groupedCategories = (Object.keys(CATEGORY_INFO) as NodeCategory[]).filter((cat) => {
    if (selectedCategory !== 'all' && selectedCategory !== cat) return false;
    return filtered.some((item) => item.category === cat);
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
      const newWidth = Math.min(Math.max(startWidthRef.current + delta, 260), 520);
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
          className="bg-dark-900/95 backdrop-blur-xl border-r border-white/10 flex flex-col h-full shadow-2xl relative transition-all duration-75"
        >
          {/* Header */}
          <div className="p-3.5 border-b border-white/10 space-y-2.5 bg-dark-950/40">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white tracking-tight flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-primary-600/25 text-primary-400 border border-primary-500/40 flex items-center justify-center shadow-sm">
                  <Plus className="w-3.5 h-3.5" />
                </div>
                Paleta de Nós
              </h3>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono text-slate-400 bg-white/5 px-2 py-0.5 rounded-full border border-white/10">
                  {filtered.length} nós
                </span>
                <button
                  onClick={onToggleOpen}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  title="Recolher painel de nós"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar nó por nome ou função..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-dark-950/90 border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
              />
            </div>

            {/* Categories pills filter */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={cn(
                    'flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10.5px] font-semibold whitespace-nowrap transition-all duration-150 border',
                    selectedCategory === cat.id
                      ? 'bg-primary-600 text-white border-primary-400 shadow-sm shadow-primary-600/30'
                      : 'bg-dark-850/80 text-slate-400 hover:text-slate-200 border-white/5 hover:border-white/15'
                  )}
                >
                  {cat.icon}
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Categorized Nodes list */}
          <div className="flex-1 p-3 overflow-y-auto space-y-4">
            {groupedCategories.map((cat) => {
              const catNodes = filtered.filter((n) => n.category === cat);
              const info = CATEGORY_INFO[cat];

              return (
                <div key={cat} className="space-y-2">
                  {/* Category Section Header */}
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-1.5">
                      <div className={cn('p-1 rounded-md border text-xs', info.bg, info.color)}>
                        {info.icon}
                      </div>
                      <span className="text-[11px] font-bold tracking-wider uppercase text-slate-300">
                        {info.label}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500 font-semibold">
                      {catNodes.length}
                    </span>
                  </div>

                  {/* Nodes in this category */}
                  <div className="space-y-1.5">
                    {catNodes.map((nodeDef) => (
                      <div
                        key={nodeDef.type}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('application/reactflow', JSON.stringify(nodeDef));
                          e.dataTransfer.effectAllowed = 'move';
                        }}
                        onClick={() => onAddNode(nodeDef)}
                        className={cn(
                          'p-2.5 rounded-xl bg-dark-850/80 hover:bg-dark-800/95 border border-white/5 hover:border-white/20 cursor-grab active:cursor-grabbing transition-all duration-150 flex items-start gap-2.5 group relative hover:shadow-lg hover:shadow-primary-500/5 hover:-translate-y-0.5'
                        )}
                        title="Arraste para onde quiser na tela ou clique para adicionar no centro da visão"
                      >
                        {/* Drag Handle Accent */}
                        <div className="absolute top-2.5 right-2 opacity-0 group-hover:opacity-60 text-slate-400 transition-opacity">
                          <GripVertical className="w-3.5 h-3.5" />
                        </div>

                        <div
                          className={cn(
                            'w-7 h-7 rounded-lg flex items-center justify-center text-white shadow-sm flex-shrink-0 group-hover:scale-110 transition-transform mt-0.5',
                            nodeDef.iconBg
                          )}
                        >
                          {nodeDef.icon}
                        </div>

                        <div className="flex-1 min-w-0 pr-3">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-white group-hover:text-primary-300 transition-colors truncate">
                              {nodeDef.label}
                            </span>
                            {nodeDef.badge && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded-md font-mono font-bold bg-primary-500/20 text-primary-300 border border-primary-500/30">
                                {nodeDef.badge}
                              </span>
                            )}
                          </div>

                          <p className="text-[10px] text-slate-400 line-clamp-2 mt-0.5 leading-tight">
                            {nodeDef.description}
                          </p>

                          {/* Variable Preview Tags if any */}
                          {nodeDef.outputVars && nodeDef.outputVars.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {nodeDef.outputVars.map((v) => (
                                <span
                                  key={v}
                                  className="text-[9px] font-mono px-1 py-0.2 rounded bg-dark-950/80 text-cyan-300 border border-cyan-500/20"
                                >
                                  {`{{${v}}}`}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {filtered.length === 0 && (
              <div className="p-6 text-center text-slate-500 text-xs">
                Nenhum nó encontrado para "<strong>{searchTerm}</strong>".
              </div>
            )}
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

