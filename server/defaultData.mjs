// Dados iniciais oficiais do Pitoco de Gente (Roupas de Bebê, Infantil & Enxovais)

export const initialStores = [
  {
    id: 'store-001',
    name: 'Loja Matriz — Centro',
    slug: 'matriz',
    address: 'Rua do Sol, 120 - Centro, Recife - PE',
    phone: '8132211000',
    whatsapp_number: '81996138924',
    is_active: true,
    business_hours: 'Seg a Sex: 08:30 às 18:30 | Sáb: 08:30 às 14:00',
    city: 'Recife - PE',
    manager_name: 'Juliana Matriz',
    monthly_revenue: 48500,
    active_chats: 6,
  },
  {
    id: 'store-002',
    name: 'Loja Ipojuca - Filial',
    slug: 'ipojuca',
    address: 'Rodovia PE-060, Centro, Ipojuca - PE',
    phone: '8135511000',
    whatsapp_number: '81996138924',
    is_active: true,
    business_hours: 'Seg a Sáb: 08:30 às 18:00',
    city: 'Ipojuca - PE',
    manager_name: 'Gerente Ipojuca',
    monthly_revenue: 62300,
    active_chats: 11,
  },
  {
    id: 'store-003',
    name: 'Atendimento Geral / E-commerce',
    slug: 'ecommerce',
    address: 'Centro de Distribuição Online - Av. Brasil, 1500',
    phone: '81996138924',
    whatsapp_number: '81996138924',
    is_active: true,
    business_hours: '24 horas (Automático) | Consultoras: 08h às 20h',
    city: 'Digital / Brasil',
    manager_name: 'Equipe Digital Pitoco',
    monthly_revenue: 95800,
    active_chats: 18,
  },
];

export const initialCategories = [
  { id: 'cat-001', name: 'Bodies & Roupinhas Básicas', slug: 'bodies-roupinhas', description: 'Bodies em algodão suedine 100% Pima, mijões e kits essenciais', sort_order: 1, is_active: true },
  { id: 'cat-002', name: 'Macacões com Zíper Duplo', slug: 'macacoes-ziper', description: 'Macacões práticos com duplo cursor que facilitam a troca de fraldas', sort_order: 2, is_active: true },
  { id: 'cat-003', name: 'Saídas de Maternidade', slug: 'saidas-maternidade', description: 'Conjuntos luxo em tricot antialérgico com manta coordenada', sort_order: 3, is_active: true },
  { id: 'cat-004', name: 'Kits de Berço & Quarto', slug: 'kits-berco', description: 'Kits de berço 400 fios, tranças, ninhos redutores e lençóis acetinados', sort_order: 4, is_active: true },
  { id: 'cat-005', name: 'Mala & Acessórios Maternidade', slug: 'malas-acessorios', description: 'Malas térmicas impermeáveis e kits organizadores de maternidade', sort_order: 5, is_active: true },
];

export const initialProducts = [
  {
    id: 'prod-001',
    category_id: 'cat-001',
    category_name: 'Bodies & Roupinhas Básicas',
    name: 'Body Manga Longa Algodão Suedine 100% Pima',
    description: 'Puro algodão suedine 100% egípcio com toque sedoso e gola envelope que não aperta a cabeça do bebê.',
    price: 49.90,
    promotional_price: 39.90,
    sizes: ['RN', 'P', 'M', 'G', 'GG'],
    colors: ['Branco Puro', 'Azul Bebê', 'Rosa Seco', 'Verde Menta', 'Bege Neutro'],
    stock_quantity: 120,
    is_featured: true,
    is_active: true,
    material: 'Algodão Suedine 100% Pima',
    image_url: 'https://images.unsplash.com/photo-1522771930-78848d9293e8?w=500&auto=format&fit=crop',
  },
  {
    id: 'prod-002',
    category_id: 'cat-002',
    category_name: 'Macacões com Zíper Duplo',
    name: 'Macacão Canelado com Zíper Duplo Soft',
    description: 'Possui zíper com cursor duplo que abre por cima e por baixo, proteção interna de zíper e pezinho reversível.',
    price: 79.90,
    promotional_price: 69.90,
    sizes: ['RN', 'P', 'M', 'G', '1 ano'],
    colors: ['Azul Bebê', 'Rosa Seco', 'Verde Menta', 'Bege Neutro'],
    stock_quantity: 85,
    is_featured: true,
    is_active: true,
    material: 'Algodão Canelado Premium',
    image_url: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=500&auto=format&fit=crop',
  },
  {
    id: 'prod-003',
    category_id: 'cat-003',
    category_name: 'Saídas de Maternidade',
    name: 'Saída de Maternidade Tricot Luxo Realeza 4 Peças',
    description: 'Conjunto completo para o grande dia: Macacão bordado, manta aconchegante coordenada, touquinha e luvinhas.',
    price: 189.90,
    promotional_price: 169.90,
    sizes: ['RN', 'P'],
    colors: ['Branco Puro', 'Rosa Seco', 'Azul Bebê', 'Amarelo Manteiga'],
    stock_quantity: 45,
    is_featured: true,
    is_active: true,
    material: 'Tricot Luxo 50% Algodão 50% Acrílico Antialérgico',
    image_url: 'https://images.unsplash.com/photo-1596870230751-ebdfce98ec42?w=500&auto=format&fit=crop',
  },
  {
    id: 'prod-004',
    category_id: 'cat-004',
    category_name: 'Kits de Berço & Quarto',
    name: 'Kit Berço Algodão 400 Fios Trança Nuvem',
    description: 'Lateral em trança macia, cabeceira nuvem, lençol com elástico 400 fios e fronha delicada antissufocante.',
    price: 289.90,
    promotional_price: 259.90,
    sizes: ['RN', 'P', 'M', 'G'],
    colors: ['Branco Puro', 'Verde Menta', 'Bege Neutro'],
    stock_quantity: 30,
    is_featured: true,
    is_active: true,
    material: 'Algodão Percal 400 Fios Acetinado',
    image_url: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=500&auto=format&fit=crop',
  },
  {
    id: 'prod-005',
    category_id: 'cat-005',
    category_name: 'Mala & Acessórios Maternidade',
    name: 'Mala Maternidade Térmica Master Impermeável',
    description: 'Compartimento amplo com divisórias para as roupinhas das primeiras 48h, forro térmico fácil de limpar e bolsos externos.',
    price: 219.90,
    promotional_price: 199.90,
    sizes: ['G', 'GG'],
    colors: ['Bege Neutro', 'Rosa Seco', 'Azul Bebê'],
    stock_quantity: 40,
    is_featured: false,
    is_active: true,
    material: 'Couro Ecológico Impermeável Soft',
    image_url: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=500&auto=format&fit=crop',
  },
];

export const sampleFlows = [
  {
    id: 'flow-pitoco-001',
    name: 'Atendimento & Vendas Principal (WhatsApp Geral)',
    description: 'Fluxo oficial com catálogo de bebês, guia de medidas, mala de maternidade, frete, PIX e transbordo por loja.',
    status: 'published',
    is_active: true,
    version: 3,
    node_count: 8,
    trigger_type: 'Qualquer Mensagem Recebida',
    store_id: null,
    store_name: 'Toda a Rede',
    steps: [
      { id: 'step-1', title: 'Gatilho de Mensagem', type: 'trigger', category: 'Início', description: 'Dispara quando o cliente envia qualquer texto.' },
      { id: 'step-2', title: 'Boas-Vindas Pitoco de Gente', type: 'message', category: 'Atendimento', description: 'Saudação com menu de opções de 1 a 7.' },
      { id: 'step-3', title: 'Catálogo de Produtos & Enxovais', type: 'show_catalog', category: 'Vendas', description: 'Exibe bodies, macacões e saídas de maternidade.' },
      { id: 'step-4', title: 'Guia de Medidas (RN a 3 anos)', type: 'measure_guide', category: 'Consultoria', description: 'Tabela de peso, altura e tamanho ideal.' },
      { id: 'step-5', title: 'Checklist Mala de Maternidade', type: 'layette_checklist', category: 'Consultoria', description: 'Checklist completo das primeiras 48h no hospital.' },
      { id: 'step-6', title: 'Consultoria VIP com Agendamento', type: 'vip_consultation', category: 'Atendimento', description: 'Agendamento com especialista (online ou presencial).' },
      { id: 'step-7', title: 'Cálculo de Frete & Entrega', type: 'shipping_calculator', category: 'Logística', description: 'Motoboy, Correios e Retirada Grátis em loja.' },
      { id: 'step-8', title: 'Pagamento PIX Copia e Cola', type: 'pix_payment', category: 'Financeiro', description: 'Chave oficial, QR Code e Copia e Cola.' },
    ],
    created_at: '2026-08-25T10:00:00.000Z',
    updated_at: new Date().toISOString(),
  },
  {
    id: 'flow-pitoco-002',
    name: 'Consultoria VIP de Enxoval & Agendamento Exclusivo',
    description: 'Fluxo especializado para captação e reserva de consultorias personalizadas com consultora de bebês.',
    status: 'draft',
    is_active: false,
    version: 2,
    node_count: 5,
    trigger_type: 'Palavra-Chave / Menu 4',
    store_id: null,
    store_name: 'Toda a Rede',
    steps: [
      { id: 'step-vip-1', title: 'Gatilho de Consultoria', type: 'trigger', category: 'Início', description: 'Disparado ao selecionar opção 4 ou digitar "enxoval".' },
      { id: 'step-vip-2', title: 'Apresentação da Especialista', type: 'message', category: 'Atendimento', description: 'Explicação dos benefícios do atendimento VIP de enxoval.' },
      { id: 'step-vip-3', title: 'Seleção do Formato', type: 'question', category: 'Atendimento', description: 'Cliente escolhe entre Online (WhatsApp) ou Presencial em loja.' },
      { id: 'step-vip-4', title: 'Coleta de DPP & Sexo do Bebê', type: 'variable', category: 'CRM', description: 'Salva a data provável do parto e nome do bebê.' },
      { id: 'step-vip-5', title: 'Confirmação & Transbordo', type: 'human_handoff', category: 'Multi-Lojas', description: 'Cria ticket de atendimento prioritário no CRM.' },
    ],
    created_at: '2026-08-28T10:00:00.000Z',
    updated_at: new Date().toISOString(),
  }
];

export const initialFlowNodes = [
  {
    id: 'node-trigger-1',
    type: 'trigger',
    position: { x: 300, y: 50 },
    data: {
      label: 'Mensagem Recebida',
      nodeType: 'trigger',
      description: 'Dispara quando o cliente manda qualquer mensagem no WhatsApp',
      isConfigured: true,
      config: { eventType: 'any_message' }
    }
  },
  {
    id: 'node-welcome-2',
    type: 'message',
    position: { x: 300, y: 180 },
    data: {
      label: 'Boas-vindas Pitoco de Gente',
      nodeType: 'message',
      description: 'Envia a saudação oficial com menu de 1 a 7',
      isConfigured: true,
      config: {
        message: 'Olá! Seja muito bem-vindo(a) à Pitoco de Gente — Roupas de Bebê, Infantil e Enxovais! 👶✨'
      }
    }
  },
  {
    id: 'node-catalog-3',
    type: 'show_catalog',
    position: { x: 100, y: 320 },
    data: {
      label: 'Catálogo Interativo',
      nodeType: 'show_catalog',
      description: 'Bodies 100% suedine, macacões zíper duplo, saídas de maternidade e kits de berço',
      isConfigured: true,
      config: {}
    }
  },
  {
    id: 'node-handoff-4',
    type: 'human_handoff',
    position: { x: 500, y: 320 },
    data: {
      label: 'Transbordo por Loja',
      nodeType: 'human_handoff',
      description: 'Cliente escolhe entre Matriz Centro, Loja Ipojuca ou E-commerce',
      isConfigured: true,
      config: { multiStore: true }
    }
  }
];

export const initialFlowEdges = [
  { id: 'edge-1-2', source: 'node-trigger-1', target: 'node-welcome-2', animated: true },
  { id: 'edge-2-3', source: 'node-welcome-2', target: 'node-catalog-3' },
  { id: 'edge-2-4', source: 'node-welcome-2', target: 'node-handoff-4' },
];

export const initialAccessUsers = [
  {
    id: 'user-ceo-1',
    name: 'Malaca CEO',
    username: 'ceo', // APENAS LETRAS
    password: '123456', // APENAS NÚMEROS
    role: 'ceo',
    store_id: null,
    store_name: 'Toda a Rede (Global)',
    status: 'active',
    created_at: new Date().toISOString(),
  },
  {
    id: 'user-adm-1',
    name: 'Administrador Geral',
    username: 'admin',
    password: '123456',
    role: 'admin',
    store_id: null,
    store_name: 'Toda a Rede (Global)',
    status: 'active',
    created_at: new Date().toISOString(),
  },
  {
    id: 'user-mgr-1',
    name: 'Juliana Paes (Gerente Matriz)',
    username: 'gerente',
    password: '123456',
    role: 'manager',
    store_id: 'store-001',
    store_name: 'Loja Matriz — Centro',
    status: 'active',
    created_at: new Date().toISOString(),
  },
  {
    id: 'user-att-1',
    name: 'Sofia Alencar (Consultora VIP)',
    username: 'consultora',
    password: '123456',
    role: 'attendant',
    store_id: 'store-001',
    store_name: 'Loja Matriz — Centro',
    status: 'active',
    created_at: new Date().toISOString(),
  },
];

export const defaultBotProfile = {
  name: 'Pitoco Bot',
  company_name: 'Pitoco de Gente',
  gender: 'neutral',
  tone: 'friendly',
  avatar_url: '/logo.png',
  company_segment: 'Moda Bebê, Infantil e Enxovais',
  support_email: 'contato@pitocodegente.com.br',
  support_phone: '81996138924',
  business_hours: 'Seg a Sáb: 08:30 às 20:00',
  website_url: 'https://pitoco.malaca.com.br',
  welcome_message: 'Olá! Seja bem-vindo(a) à Pitoco de Gente — Roupas de Bebê, Infantil e Enxovais! 👶✨ Como podemos te ajudar hoje?',
  company_address: 'Rua do Sol, 120 - Centro, Recife - PE',
  pix_key: 'financeiro@pitocodegente.com.br',
  pix_owner: 'Pitoco de Gente Artigos Infantis LTDA',
  shipping_motoboy: 15.00,
  shipping_correios: 24.90,
  free_shipping_min: 250.00,
  flow_cooldown_minutes: 60,
};

export const initialSettings = {
  id: 'settings-001',
  whatsapp_phone_number_id: 'pitoco-wa-01',
  whatsapp_business_account_id: 'pitoco-waba-01',
  webhook_verify_token: 'pitoco_webhook_secure_2026',
  bot_profile: defaultBotProfile,
  whatsapp_session: {
    status: 'disconnected',
    phone: '81996138924',
    name: 'Pitoco de Gente WhatsApp',
  },
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const initialAttendants = [
  {
    id: 'att-001',
    name: 'Sofia Consultora VIP',
    email: 'sofia@pitocodegente.com.br',
    phone: '81999990003',
    role: 'consultant',
    department: 'Consultoria Enxoval & VIP',
    store_id: 'store-001',
    store_name: 'Loja Matriz — Centro',
    status: 'online',
    metrics: { chats_assigned: 42, chats_resolved: 38, messages_sent: 512, avg_response_time_min: 2.1, rating: 4.9 },
    created_at: new Date().toISOString(),
  },
  {
    id: 'att-002',
    name: 'Beatriz Atendimento Digital',
    email: 'beatriz@pitocodegente.com.br',
    phone: '81999990004',
    role: 'attendant',
    department: 'E-commerce & WhatsApp',
    store_id: 'store-003',
    store_name: 'Atendimento Geral / E-commerce',
    status: 'online',
    metrics: { chats_assigned: 65, chats_resolved: 59, messages_sent: 890, avg_response_time_min: 1.8, rating: 4.8 },
    created_at: new Date().toISOString(),
  }
];

export const defaultCannedReplies = [
  { id: 'canned-1', label: 'Boas-vindas Consultoria', cmd: '/bemvindo', text: 'Olá, mamãe! É uma alegria enorme poder te ajudar a escolher o enxoval mais especial para o seu bebê! 💕', category: 'Atendimento' },
  { id: 'canned-2', label: 'Tamanhos RN vs P', cmd: '/tamanhos', text: 'O tamanho RN veste bebês de até 4kg (ideal para os primeiros 20 a 30 dias). O tamanho P veste de 4 a 6kg (de 1 a 3 meses com folguinha). Recomendamos ter pelo menos 4 a 6 peças RN e 6 a 8 peças P!', category: 'Dúvidas' },
  { id: 'canned-3', label: 'Dados PIX', cmd: '/pix', text: 'Nossa chave PIX oficial é financeiro@pitocodegente.com.br (Banco Inter / Pitoco de Gente Artigos Infantis LTDA). Ao efetuar o pagamento, basta nos enviar o comprovante!', category: 'Pagamento' },
  { id: 'canned-4', label: 'Retirada em Loja', cmd: '/retirada', text: 'Seu pedido já foi separado com muito carinho e está pronto para retirada no balcão da loja selecionada! Basta informar seu nome e número de telefone.', category: 'Entrega' },
];

export const DEFAULT_AGENDA_SETTINGS = {
  business_days: ['1', '2', '3', '4', '5', '6'],
  start_time: '08:00',
  end_time: '19:00',
  slot_duration_minutes: 30,
  break_start_time: '12:00',
  break_end_time: '13:00',
  buffer_minutes: 5,
  out_of_hours_message: 'Olá! Nosso horário de atendimento é de Segunda a Sábado das 08:00 às 19:00. Deixe sua mensagem que te responderemos logo!',
  services: [
    {
      id: 'srv-1',
      name: 'Consultoria VIP de Enxoval',
      duration_minutes: 45,
      price: 0,
      category: 'Consultoria',
      description: 'Atendimento personalizado com especialista em montagem de enxoval de bebê completo.',
      is_active: true,
      active: true,
    },
    {
      id: 'srv-2',
      name: 'Guia de Medidas & Escolha de Tamanho',
      duration_minutes: 20,
      price: 0,
      category: 'Atendimento',
      description: 'Ajuda para acertar o tamanho ideal RN a 3 anos (tabela de peso e altura).',
      is_active: true,
      active: true,
    },
    {
      id: 'srv-3',
      name: 'Separação de Pedido para Retirada na Loja',
      duration_minutes: 15,
      price: 0,
      category: 'Retirada',
      description: 'Agendamento de retirada expressa no balcão da filial selecionada.',
      is_active: true,
      active: true,
    }
  ],
  day_schedules: {
    '1': { enabled: true, start_time: '08:00', end_time: '19:00', break_start_time: '12:00', break_end_time: '13:00' },
    '2': { enabled: true, start_time: '08:00', end_time: '19:00', break_start_time: '12:00', break_end_time: '13:00' },
    '3': { enabled: true, start_time: '08:00', end_time: '19:00', break_start_time: '12:00', break_end_time: '13:00' },
    '4': { enabled: true, start_time: '08:00', end_time: '19:00', break_start_time: '12:00', break_end_time: '13:00' },
    '5': { enabled: true, start_time: '08:00', end_time: '19:00', break_start_time: '12:00', break_end_time: '13:00' },
    '6': { enabled: true, start_time: '08:00', end_time: '18:00', break_start_time: '12:00', break_end_time: '13:00' },
    '0': { enabled: false, start_time: '09:00', end_time: '14:00' },
  }
};

export const defaultCustomVariables = [
  { id: 'var-1', name: 'nome_loja', key: 'nome_loja', value: 'Pitoco de Gente', description: 'Nome fantasia da marca' },
  { id: 'var-2', name: 'cidade_matriz', key: 'cidade_matriz', value: 'Recife/PE', description: 'Sede da matriz' },
  { id: 'var-3', name: 'chave_pix', key: 'chave_pix', value: 'financeiro@pitocodegente.com.br', description: 'Chave PIX oficial' },
  { id: 'var-4', name: 'frete_gratis_valor', key: 'frete_gratis_valor', value: '250.00', description: 'Valor mínimo frete grátis' },
];

export const sampleContacts = [];

export const sampleConversations = [];

export const initialTickets = [];
