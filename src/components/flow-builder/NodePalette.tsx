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
  CalendarDays,
  DollarSign,
  Users,
  CheckCircle2,
  CalendarCheck,
  Tag,
  Layers,
  ChevronDown,
  OctagonX,
  Scissors,
  Store,
  ShoppingBag,
  ShoppingCart,
  Truck,
  CreditCard,
  Ruler,
  Luggage,
  Package,
  BadgePercent,
  HeartHandshake
} from 'lucide-react';
import { NodeTypeEnum } from '../../types';
import { cn } from '../../lib/utils';

export type NodeCategory = 'Triggers' | 'Messages' | 'Ecommerce' | 'CRM & Logic' | 'AI & Support' | 'Integrations';

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
  'Ecommerce': {
    label: 'Loja & E-commerce',
    icon: <ShoppingBag className="w-3.5 h-3.5" />,
    color: 'text-pink-400',
    bg: 'bg-pink-500/10 border-pink-500/20',
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
      bodyText: 'Como podemos te ajudar hoje? Escolha uma das opções:',
      footerText: 'Pitoco de Gente • Atendimento Oficial',
      buttons: [
        { id: 'btn_1', title: '1. Ver Catálogo Bebê' },
        { id: 'btn_2', title: '2. Consultoria Enxoval' },
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

  // 3. Loja Virtual & E-commerce (Pitoco de Gente)
  {
    type: 'store_selector',
    label: 'Escolha de Loja / Filial',
    category: 'Ecommerce',
    description: 'Apresenta as lojas físicas e online (Matriz, Shopping Boulevard, E-commerce) com 3 saídas.',
    icon: <Store className="w-4 h-4" />,
    iconBg: 'bg-amber-600',
    accentColor: 'border-amber-500/40',
    badge: 'Multi-Loja',
    outputVars: ['loja_escolhida', 'loja_id', 'loja_whatsapp'],
    defaultConfig: {
      introMessage: '🏬 *PITOCO DE GENTE — Escolha sua Loja de Preferência:*\n\nQual de nossas lojas você deseja falar hoje?',
      footerText: 'Toque na loja desejada:',
    },
  },
  {
    type: 'show_catalog',
    label: 'Vitrine da Loja Virtual',
    category: 'Ecommerce',
    description: 'Envia vitrine de roupas de bebê e enxovais com categorias, fotos, tamanhos e valores.',
    icon: <ShoppingBag className="w-4 h-4" />,
    iconBg: 'bg-pink-600',
    accentColor: 'border-pink-500/40',
    badge: 'Vitrine',
    outputVars: ['catalogo_produtos_texto'],
    defaultConfig: {
      categoryFilter: 'all',
      headerText: '🍼 *PITOCO DE GENTE — Moda Bebê & Enxovais*\nConfira nossos destaques mais amados:',
      footerText: 'Para pedir ou verificar tamanhos (RN a 3 anos), basta nos chamar!',
    },
  },
  {
    type: 'select_product',
    label: 'Selecionar Produto do Catálogo',
    category: 'Ecommerce',
    description: 'Apresenta produtos como botões interativos para a mamãe escolher a peça e tamanho.',
    icon: <ShoppingCart className="w-4 h-4" />,
    iconBg: 'bg-emerald-600',
    accentColor: 'border-emerald-500/40',
    badge: 'Escolha',
    outputVars: ['produto_selecionado', 'valor_produto', 'tamanho_escolhido'],
    defaultConfig: {
      introMessage: 'Qual peça linda você deseja encomendar para o seu bebê hoje?',
      footerText: 'Toque no produto desejado:',
    },
  },
  {
    type: 'shipping_calculator',
    label: 'Calculadora de Frete & Entrega',
    category: 'Ecommerce',
    description: 'Oferece Motoboy Express (mesmo dia), Correios (SEDEX/PAC) ou Retirada Grátis em Loja.',
    icon: <Truck className="w-4 h-4" />,
    iconBg: 'bg-zinc-800 border border-zinc-700',
    accentColor: 'border-zinc-700',
    badge: 'Logística',
    outputVars: ['tipo_frete', 'valor_frete', 'prazo_entrega'],
    defaultConfig: {
      motoboyPrice: 15.00,
      correiosPrice: 24.90,
      freeShippingThreshold: 250.00,
      introMessage: 'Como você prefere receber seu pedido?',
    },
  },
  {
    type: 'pix_payment',
    label: 'Cobrança PIX Automática',
    category: 'Ecommerce',
    description: 'Gera chave PIX da loja e código Copia e Cola instantâneo para pagamento no WhatsApp.',
    icon: <CreditCard className="w-4 h-4" />,
    iconBg: 'bg-emerald-600',
    accentColor: 'border-emerald-500/40',
    badge: 'Pagamento',
    outputVars: ['pix_copia_cola', 'valor_total', 'status_pagamento'],
    defaultConfig: {
      pixKey: 'financeiro@pitocodegente.com.br',
      pixName: 'Pitoco de Gente Artigos Infantis LTDA',
      pixCity: 'Recife',
      instructionsMessage: 'Copie a chave PIX acima ou o código Copia e Cola para pagar no seu app bancário.',
    },
  },
  {
    type: 'cart_order',
    label: 'Criar Pedido de Venda',
    category: 'Ecommerce',
    description: 'Gera protocolo oficial (PED-XXXXXX), calcula valor final e salva no banco de dados.',
    icon: <Package className="w-4 h-4" />,
    iconBg: 'bg-purple-600',
    accentColor: 'border-purple-500/40',
    badge: 'Pedido',
    outputVars: ['numero_pedido', 'total_pedido', 'status_pedido'],
    defaultConfig: {
      prefix: 'PED',
      confirmMessage: '🎉 *Pedido Registrado com Sucesso!*\n\nNúmero: *{{numero_pedido}}*\nTotal: *{{total_pedido}}*\n\nNossa equipe já está separando com todo o carinho!',
    },
  },
  {
    type: 'measure_guide',
    label: 'Guia de Medidas (RN a 3 Anos)',
    category: 'Ecommerce',
    description: 'Envia a tabela oficial de medidas com peso (kg), altura (cm) e idade para orientar o tamanho correto.',
    icon: <Ruler className="w-4 h-4" />,
    iconBg: 'bg-cyan-600',
    accentColor: 'border-cyan-500/40',
    badge: 'Tamanhos',
    defaultConfig: {
      title: '📏 *GUIA DE MEDIDAS OFICIAL — PITOCO DE GENTE*',
    },
  },
  {
    type: 'layette_checklist',
    label: 'Checklist Mala de Maternidade',
    category: 'Ecommerce',
    description: 'Envia lista pronta e carinhosa com os 10 itens essenciais para a mala do bebê no hospital.',
    icon: <Luggage className="w-4 h-4" />,
    iconBg: 'bg-amber-600',
    accentColor: 'border-amber-500/40',
    badge: 'Mala Bebê',
    defaultConfig: {
      title: '🧳 *CHECKLIST MALA DE MATERNIDADE — PITOCO DE GENTE*',
    },
  },
  {
    type: 'vip_consultation',
    label: 'Agendar Consultoria de Enxoval',
    category: 'Ecommerce',
    description: 'Permite à mamãe agendar consultoria exclusiva online (vídeo/WhatsApp) ou presencial na loja.',
    icon: <HeartHandshake className="w-4 h-4" />,
    iconBg: 'bg-pink-600',
    accentColor: 'border-pink-500/40',
    badge: 'VIP',
    outputVars: ['tipo_consultoria', 'data_consultoria', 'dpp_bebe'],
    defaultConfig: {
      introMessage: 'Como você deseja realizar sua Consultoria VIP de Enxoval?',
    },
  },
  {
    type: 'order_tracking',
    label: 'Rastreamento de Pedido',
    category: 'Ecommerce',
    description: 'Localiza pedidos do cliente pelo WhatsApp e informa status de separação e envio.',
    icon: <Package className="w-4 h-4" />,
    iconBg: 'bg-emerald-600',
    accentColor: 'border-emerald-500/40',
    badge: 'Rastreio',
    outputVars: ['status_rastreio', 'codigo_rastreio'],
    defaultConfig: {
      notFoundMessage: 'Não localizamos nenhum pedido pendente para este número. Digite *0* para falar com uma consultora.',
    },
  },
  {
    type: 'promotional_coupon',
    label: 'Aplicar Cupom de Desconto',
    category: 'Ecommerce',
    description: 'Valida cupom promocional digitado (ex: BEMVINDO10) e aplica desconto na compra.',
    icon: <BadgePercent className="w-4 h-4" />,
    iconBg: 'bg-yellow-600',
    accentColor: 'border-yellow-500/40',
    badge: 'Cupom',
    outputVars: ['cupom_aplicado', 'desconto_valor', 'total_com_desconto'],
    defaultConfig: {
      couponCode: 'BEMVINDO10',
      discountPercentage: 10,
    },
  },

  // 4. CRM & Logic
  {
    type: 'client_lookup',
    label: 'Consultar Cliente (CRM)',
    category: 'CRM & Logic',
    description: 'Busca o cliente na base pelo número do WhatsApp e extrai nome, bebê, DPP e tags.',
    icon: <UserCheck className="w-4 h-4" />,
    iconBg: 'bg-emerald-600',
    accentColor: 'border-emerald-500/40',
    badge: 'CRM',
    outputVars: ['cliente_encontrado', 'cliente_nome', 'cliente_telefone', 'cliente_bebe', 'cliente_dpp', 'cliente_tags'],
    defaultConfig: {
      phoneVar: 'telefone_whatsapp',
    },
  },
  {
    type: 'client_upsert',
    label: 'Cadastrar / Atualizar Cliente',
    category: 'CRM & Logic',
    description: 'Registra ou atualiza o cliente no painel admin e Supabase com nome, bebê, tags e telefone.',
    icon: <Users className="w-4 h-4" />,
    iconBg: 'bg-indigo-600',
    accentColor: 'border-indigo-500/40',
    badge: 'Salvar',
    outputVars: ['cliente_salvo', 'cliente_id'],
    defaultConfig: {
      nameField: '{{nome_cliente}}',
      phoneField: '{{telefone_whatsapp}}',
      babyNameField: '{{nome_bebe}}',
      dueDateField: '{{data_parto}}',
      tagsField: 'Cliente WhatsApp, Bot',
      notesField: 'Cadastrado automaticamente pelo fluxo do bot',
    },
  },
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
    description: 'Armazena valores, cálculos, dados de contato ou datas em variáveis.',
    icon: <Sliders className="w-4 h-4" />,
    iconBg: 'bg-violet-600',
    accentColor: 'border-violet-500/40',
    defaultConfig: {
      varName: 'etapa_funil',
      varValue: 'agendamento_iniciado',
      assignments: [
        {
          varName: 'etapa_funil',
          operation: 'set_value',
          value: 'agendamento_iniciado',
        },
      ],
    },
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
  {
    type: 'end_flow',
    label: 'Finalizar Fluxo',
    category: 'AI & Support',
    description: 'Encerra o atendimento atual, reseta o estado da sessão e envia mensagem de conclusão.',
    icon: <OctagonX className="w-4 h-4" />,
    iconBg: 'bg-rose-600',
    accentColor: 'border-rose-500/40',
    badge: 'Fim',
    defaultConfig: {
      message: '🏁 *Atendimento finalizado com sucesso!*\n\nSe precisar de algo mais, basta nos enviar uma nova mensagem. Até logo!',
      closeConversation: true,
      clearVariables: true,
    },
  },

  // 6. Integrations
  {
    type: 'http_request',
    label: 'Requisição HTTP / API',
    category: 'Integrations',
    description: 'Dispara requisições GET ou POST para APIs, CRMs ou Webhooks externos.',
    icon: <Globe className="w-4 h-4" />,
    iconBg: 'bg-zinc-800 border border-zinc-700',
    accentColor: 'border-zinc-700',
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

  // Densidade explícita dos cartões de nós: 'mini' | 'normal' | 'amplo'
  const [densityMode, setDensityMode] = useState<'mini' | 'normal' | 'amplo'>(() => {
    try {
      const saved = localStorage.getItem('pitoco_palette_density');
      if (saved === 'mini' || saved === 'normal' || saved === 'amplo') return saved;
    } catch {}
    return 'normal';
  });

  const handleSelectDensity = (density: 'mini' | 'normal' | 'amplo') => {
    setDensityMode(density);
    try {
      localStorage.setItem('pitoco_palette_density', density);
    } catch {}
    if (density === 'mini') onWidthChange(210);
    else if (density === 'normal') onWidthChange(280);
    else if (density === 'amplo') onWidthChange(380);
  };

  const categories: Array<{ id: string; label: string; icon?: React.ReactNode }> = [
    { id: 'all', label: 'Todos', icon: <Layers className="w-3 h-3" /> },
    { id: 'Triggers', label: 'Gatilhos', icon: <Zap className="w-3 h-3 text-amber-400" /> },
    { id: 'Messages', label: 'Mensagens', icon: <MessageSquare className="w-3 h-3 text-primary-400" /> },
    { id: 'Ecommerce', label: 'Loja & E-commerce', icon: <ShoppingBag className="w-3 h-3 text-pink-400" /> },
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
      const newWidth = Math.min(Math.max(startWidthRef.current + delta, 160), 520);
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
          title="Abrir Funções de Fluxo"
        >
          <div className="p-1 rounded-lg bg-primary-600/20 text-primary-400 border border-primary-500/30 group-hover:scale-110 transition-transform">
            <Plus className="w-4 h-4" />
          </div>
          <span className="[writing-mode:vertical-rl] text-xs font-bold tracking-wider text-slate-400 group-hover:text-slate-200">
            Funções de Fluxo
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
          <div className="p-2.5 sm:p-3 border-b border-white/10 space-y-2 bg-dark-950/40">
            <div className="flex items-center justify-between gap-1">
              <h3 className="text-xs font-bold text-white tracking-tight flex items-center gap-1.5 truncate">
                <div className="w-5 h-5 rounded-lg bg-primary-600/25 text-primary-400 border border-primary-500/40 flex items-center justify-center shadow-sm flex-shrink-0">
                  <Plus className="w-3 h-3" />
                </div>
                <span className="truncate">{width < 210 ? 'Funções' : 'Funções de Fluxo'}</span>
              </h3>
              
              <div className="flex items-center gap-1 flex-shrink-0">
                {/* Botões de Densidade das Funções (Mini, Normal, Amplo) */}
                <div className="flex items-center bg-dark-850 p-0.5 rounded-lg border border-white/10 text-[9.5px]">
                  <button
                    type="button"
                    onClick={() => handleSelectDensity('mini')}
                    className={cn(
                      "px-1.5 py-0.5 rounded transition-all font-bold",
                      densityMode === 'mini' ? "bg-white text-black shadow-xs" : "text-slate-400 hover:text-white"
                    )}
                    title="Exibição Mini (compacta, ideal para visualizar muitas funções)"
                  >
                    Mini
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectDensity('normal')}
                    className={cn(
                      "px-1.5 py-0.5 rounded transition-all font-bold",
                      densityMode === 'normal' ? "bg-white text-black shadow-xs" : "text-slate-400 hover:text-white"
                    )}
                    title="Exibição Normal (equilibrada com título e resumo)"
                  >
                    Normal
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectDensity('amplo')}
                    className={cn(
                      "px-1.5 py-0.5 rounded transition-all font-bold",
                      densityMode === 'amplo' ? "bg-white text-black shadow-xs" : "text-slate-400 hover:text-white"
                    )}
                    title="Exibição Ampla (detalhada com preview e descrição completa)"
                  >
                    Amplo
                  </button>
                </div>

                <button
                  onClick={onToggleOpen}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  title="Recolher painel de funções"
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
                placeholder="Buscar função por nome ou tipo..."
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
                          densityMode === 'mini' 
                            ? 'p-1.5 rounded-lg gap-2' 
                            : densityMode === 'amplo'
                            ? 'p-3 rounded-xl gap-3'
                            : 'p-2 rounded-xl gap-2.5',
                          'bg-dark-850/80 hover:bg-dark-800/95 border border-white/5 hover:border-white/20 cursor-grab active:cursor-grabbing transition-all duration-150 flex items-center group relative hover:shadow-lg hover:shadow-primary-500/5 hover:-translate-y-0.5'
                        )}
                        title={`${nodeDef.label}: ${nodeDef.description}`}
                      >
                        {/* Drag Handle Accent */}
                        {densityMode !== 'mini' && (
                          <div className="absolute top-2.5 right-2 opacity-0 group-hover:opacity-60 text-slate-400 transition-opacity">
                            <GripVertical className="w-3.5 h-3.5" />
                          </div>
                        )}

                        <div
                          className={cn(
                            densityMode === 'mini' ? 'w-6 h-6 rounded-md' : densityMode === 'amplo' ? 'w-8 h-8 rounded-xl' : 'w-7 h-7 rounded-lg',
                            'flex items-center justify-center text-white shadow-sm flex-shrink-0 group-hover:scale-110 transition-transform',
                            nodeDef.iconBg
                          )}
                        >
                          {nodeDef.icon}
                        </div>

                        <div className="flex-1 min-w-0 pr-1">
                          <div className="flex items-center gap-1">
                            <span className={cn(
                              densityMode === 'mini' ? "text-[11px]" : densityMode === 'amplo' ? "text-xs font-black" : "text-xs font-bold", 
                              "text-white group-hover:text-primary-300 transition-colors truncate"
                            )}>
                              {nodeDef.label}
                            </span>
                            {densityMode !== 'mini' && nodeDef.badge && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded-md font-mono font-bold bg-white/10 text-zinc-300 border border-white/10">
                                {nodeDef.badge}
                              </span>
                            )}
                          </div>

                          {densityMode === 'normal' && (
                            <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5 leading-tight">
                              {nodeDef.description}
                            </p>
                          )}
                          {densityMode === 'amplo' && (
                            <p className="text-[11px] text-slate-300 line-clamp-2 mt-1 leading-snug">
                              {nodeDef.description}
                            </p>
                          )}

                          {/* Variable Preview Tags if any (in Amplo mode) */}
                          {densityMode === 'amplo' && nodeDef.outputVars && nodeDef.outputVars.length > 0 && (
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
                Nenhuma função encontrada para "<strong>{searchTerm}</strong>".
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

