import { 
  Flow, 
  Contact, 
  Conversation, 
  Settings, 
  AdminProfile, 
  DashboardKPIs, 
  BotProfile, 
  Store, 
  Product, 
  Category, 
  SupportTicket, 
  Attendant 
} from '../types';

export const initialStores: Store[] = [
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
    name: 'Loja Shopping Boulevard',
    slug: 'boulevard',
    address: 'Av. Principal, 500 - Piso L2, Loja 204',
    phone: '8134422000',
    whatsapp_number: '81996138924',
    is_active: true,
    business_hours: 'Seg a Sáb: 10:00 às 22:00 | Dom: 13:00 às 21:00',
    city: 'Recife - PE',
    manager_name: 'Carla Boulevard',
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

export const initialCategories: Category[] = [
  { id: 'cat-001', name: 'Bodies & Roupinhas Básicas', slug: 'bodies-roupinhas', description: 'Bodies em algodão suedine 100% Pima, mijões e kits essenciais', sort_order: 1, is_active: true },
  { id: 'cat-002', name: 'Macacões com Zíper Duplo', slug: 'macacoes-ziper', description: 'Macacões práticos com duplo cursor que facilitam a troca de fraldas', sort_order: 2, is_active: true },
  { id: 'cat-003', name: 'Saídas de Maternidade', slug: 'saidas-maternidade', description: 'Conjuntos luxo em tricot antialérgico com manta coordenada', sort_order: 3, is_active: true },
  { id: 'cat-004', name: 'Kits de Berço & Quarto', slug: 'kits-berco', description: 'Kits de berço 400 fios, tranças, ninhos redutores e lençóis acetinados', sort_order: 4, is_active: true },
  { id: 'cat-005', name: 'Mala & Acessórios Maternidade', slug: 'malas-acessorios', description: 'Malas térmicas impermeáveis e kits organizadores de maternidade', sort_order: 5, is_active: true },
];

export const initialProducts: Product[] = [
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
  {
    id: 'prod-006',
    category_id: 'cat-001',
    category_name: 'Bodies & Roupinhas Básicas',
    name: 'Kit 3 Paninhos de Boca Fralda Luxo Bordada',
    description: 'Fralda dupla atoalhada 100% algodão com acabamento em crochê delicado e bordado exclusivo.',
    price: 39.90,
    promotional_price: 29.90,
    sizes: ['RN'],
    colors: ['Branco Puro', 'Rosa Seco', 'Azul Bebê'],
    stock_quantity: 150,
    is_featured: false,
    is_active: true,
    material: 'Fralda Dupla 100% Algodão',
    image_url: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=500&auto=format&fit=crop',
  }
];

export const initialAdminProfile: AdminProfile = {
  id: 'admin-001',
  phone: '81996138924',
  name: 'Malaca CEO',
  email: 'ceo@pitocodegente.com.br',
  role: 'ceo',
  store_id: null,
  store_name: 'Rede Pitoco de Gente (Todas as Lojas)',
  avatar_url: '',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const defaultBotProfile: BotProfile = {
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
};

export const initialSettings: Settings = {
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

export const initialKPIs: DashboardKPIs = {
  totalContacts: 2840,
  totalConversations: 6150,
  activeConversations: 35,
  activeFlows: 3,
  waitingHuman: 4,
  messagesSentToday: 2490,
  totalProducts: 48,
  totalStores: 3,
  monthRevenue: 206600,
  totalOrders: 680,
};

export const sampleFlows: Flow[] = [
  {
    id: 'flow-pitoco-001',
    name: 'Atendimento & Vendas Pitoco de Gente',
    description: 'Fluxo oficial com catálogo de bebês, guia de medidas, mala de maternidade, frete, PIX e transbordo por loja.',
    status: 'published',
    version: 3,
    node_count: 8,
    trigger_type: 'Mensagem recebida',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
];

export const sampleContacts: Contact[] = [
  {
    id: 'client-81991234567',
    phone: '81991234567',
    name: 'Mariana Silva (Mamãe do Theo)',
    email: 'mariana.silva@gmail.com',
    store_id: 'store-001',
    store_name: 'Loja Matriz — Centro',
    address: 'Rua das Flores, 45 - Boa Viagem, Recife - PE',
    baby_name: 'Theo',
    due_date: '2026-11-15',
    status: 'active',
    total_orders: 3,
    total_spent: 680.00,
    tags: ['Enxoval Completo', 'VIP', 'Matriz'],
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'client-81998765432',
    phone: '81998765432',
    name: 'Camila Fernandes (Mamãe da Laura)',
    email: 'camila.fernandes@outlook.com',
    store_id: 'store-002',
    store_name: 'Loja Shopping Boulevard',
    baby_name: 'Laura',
    due_date: '2026-10-02',
    status: 'active',
    total_orders: 1,
    total_spent: 249.90,
    tags: ['Saída Maternidade', 'Boulevard'],
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date().toISOString(),
  }
];

export const sampleConversations: Conversation[] = [
  {
    id: 'conv-81991234567',
    contact_id: 'client-81991234567',
    contact_name: 'Mariana Silva (Mamãe do Theo)',
    contact_phone: '81991234567',
    store_id: 'store-001',
    store_name: 'Loja Matriz — Centro',
    status: 'waiting_human',
    last_message: 'Olá! Queria confirmar se a Saída Maternidade Tricot Realeza na cor Azul Bebê está disponível para retirada na Matriz?',
    unread_count: 1,
    started_at: new Date(Date.now() - 3600000).toISOString(),
    last_message_at: new Date(Date.now() - 300000).toISOString(),
    created_at: new Date(Date.now() - 3600000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'conv-81998765432',
    contact_id: 'client-81998765432',
    contact_name: 'Camila Fernandes (Mamãe da Laura)',
    contact_phone: '81998765432',
    store_id: 'store-002',
    store_name: 'Loja Shopping Boulevard',
    status: 'human',
    assigned_to: 'Sofia Consultora VIP',
    last_message: 'Perfeito, Camila! Separei o Macacão Zíper Duplo Rosa Seco tamanho RN para você ver no Shopping Boulevard!',
    unread_count: 0,
    started_at: new Date(Date.now() - 7200000).toISOString(),
    last_message_at: new Date(Date.now() - 600000).toISOString(),
    created_at: new Date(Date.now() - 7200000).toISOString(),
    updated_at: new Date().toISOString(),
  }
];

export const initialAttendants: Attendant[] = [
  {
    id: 'att-001',
    name: 'Sofia Consultora VIP',
    email: 'sofia@pitocodegente.com.br',
    phone: '81999990003',
    password: 'admin',
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
    password: 'admin',
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
      description: 'Cliente escolhe entre Matriz Centro, Shopping Boulevard ou E-commerce',
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
