import { Flow, Contact, Conversation, Message, Settings, AdminProfile, DashboardKPIs, BotProfile } from '../types';

export const initialAdminProfile: AdminProfile = {
  id: 'admin-001',
  phone: '81996138924',
  name: 'Administrador 7 Assistente',
  avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const defaultBotProfile: BotProfile = {
  name: 'Sofia',
  company_name: '7 Assistente Tech',
  gender: 'female',
  tone: 'friendly',
  avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
  company_segment: 'SaaS & Automação de WhatsApp',
  support_email: 'suporte@7assistente.com.br',
  support_phone: '+55 81 99613-8924',
  business_hours: 'Segunda a Sexta, das 08h às 18h',
  website_url: 'https://7assistente.com.br',
  welcome_message: 'Olá! Sou a Sofia, assistente virtual da 7 Assistente. Como posso te ajudar hoje?',
};

export const initialSettings: Settings = {
  id: 'settings-001',
  whatsapp_phone_number_id: '109876543210987',
  whatsapp_business_account_id: '209876543210987',
  whatsapp_access_token_encrypted: 'EAAO...7assistente_token_secret_vault',
  webhook_verify_token: '7assistente_meta_webhook_token_2026',
  bot_profile: defaultBotProfile,
  whatsapp_session: {
    status: 'disconnected',
    phone: '',
    name: '',
  },
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const initialKPIs: DashboardKPIs = {
  totalContacts: 1420,
  totalConversations: 3840,
  activeConversations: 42,
  activeFlows: 6,
  waitingHuman: 3,
  messagesSentToday: 1890,
};

export const sampleFlows: Flow[] = [
  {
    id: 'flow-001',
    name: 'Atendimento Inicial & Qualificação de Leads',
    description: 'Fluxo principal acionado ao receber qualquer mensagem inicial de novos clientes.',
    status: 'published',
    version: 3,
    node_count: 8,
    trigger_type: 'Mensagem recebida',
    created_at: '2026-08-20T10:00:00Z',
    updated_at: '2026-08-28T14:30:00Z',
  },
  {
    id: 'flow-002',
    name: 'Triagem com IA (Suporte & FAQ Inteligente)',
    description: 'Agente de IA que consulta a base de conhecimento e responde dúvidas técnicas 24/7.',
    status: 'published',
    version: 2,
    node_count: 6,
    trigger_type: 'Palavra-chave: #ajuda, #suporte',
    created_at: '2026-08-22T11:20:00Z',
    updated_at: '2026-08-27T09:15:00Z',
  },
  {
    id: 'flow-003',
    name: 'Agendamento de Demonstração / Reunião',
    description: 'Coleta preferências de horário e conecta com webhook para criar agendamento.',
    status: 'draft',
    version: 1,
    node_count: 5,
    trigger_type: 'Botão: Agendar Demo',
    created_at: '2026-08-26T16:40:00Z',
    updated_at: '2026-08-28T18:00:00Z',
  },
  {
    id: 'flow-004',
    name: 'Pesquisa de Satisfação (NPS)',
    description: 'Disparado 15 minutos após encerramento do atendimento humano.',
    status: 'paused',
    version: 1,
    node_count: 4,
    trigger_type: 'Evento: Atendimento Encerrado',
    created_at: '2026-08-15T08:00:00Z',
    updated_at: '2026-08-25T11:10:00Z',
  }
];

export const sampleContacts: Contact[] = [
  {
    id: 'contact-001',
    phone: '5511987654321',
    name: 'Mariana Silveira',
    profile_picture_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    status: 'active',
    tags: ['Lead Quente', 'SaaS', 'Empresarial'],
    metadata: { empresa: 'TechSoluções', cargo: 'Diretora Comercial' },
    created_at: '2026-08-28T09:00:00Z',
    updated_at: '2026-08-29T15:20:00Z',
  },
  {
    id: 'contact-002',
    phone: '5521976543210',
    name: 'Carlos Eduardo Ramos',
    profile_picture_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    status: 'active',
    tags: ['Suporte', 'Aguardando Humano'],
    metadata: { plano: 'Enterprise', ticketId: 'TCK-892' },
    created_at: '2026-08-27T14:15:00Z',
    updated_at: '2026-08-29T15:45:00Z',
  },
  {
    id: 'contact-003',
    phone: '5531998877665',
    name: 'Beatriz Vasconcelos',
    profile_picture_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    status: 'active',
    tags: ['Financeiro', 'Fatura'],
    metadata: { clienteDesde: '2025' },
    created_at: '2026-08-25T10:30:00Z',
    updated_at: '2026-08-29T12:10:00Z',
  },
  {
    id: 'contact-004',
    phone: '5541988776655',
    name: 'Roberto Fernandes',
    profile_picture_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    status: 'active',
    tags: ['Novo'],
    metadata: {},
    created_at: '2026-08-29T11:00:00Z',
    updated_at: '2026-08-29T11:05:00Z',
  }
];

export const sampleConversations: Conversation[] = [
  {
    id: 'conv-001',
    contact_id: 'contact-002',
    contact: sampleContacts[1],
    status: 'waiting_human',
    assigned_to: null,
    started_at: '2026-08-29T15:30:00Z',
    last_message_at: '2026-08-29T15:45:00Z',
    unread_count: 2,
    last_message: 'Preciso falar com alguém do suporte sobre a integração da API.',
    created_at: '2026-08-29T15:30:00Z',
    updated_at: '2026-08-29T15:45:00Z',
  },
  {
    id: 'conv-002',
    contact_id: 'contact-001',
    contact: sampleContacts[0],
    status: 'bot',
    assigned_to: null,
    started_at: '2026-08-29T15:10:00Z',
    last_message_at: '2026-08-29T15:20:00Z',
    unread_count: 0,
    last_message: 'Perfeito! Gostaria de receber a proposta comercial por e-mail.',
    created_at: '2026-08-29T15:10:00Z',
    updated_at: '2026-08-29T15:20:00Z',
  },
  {
    id: 'conv-003',
    contact_id: 'contact-003',
    contact: sampleContacts[2],
    status: 'human',
    assigned_to: 'Administrador 7 Assistente',
    started_at: '2026-08-29T11:45:00Z',
    last_message_at: '2026-08-29T12:10:00Z',
    unread_count: 0,
    last_message: 'Boleto enviado com sucesso. Muito obrigado!',
    created_at: '2026-08-29T11:45:00Z',
    updated_at: '2026-08-29T12:10:00Z',
  }
];

export const sampleMessages: Record<string, Message[]> = {
  'conv-001': [
    {
      id: 'msg-1',
      conversation_id: 'conv-001',
      direction: 'inbound',
      message_type: 'text',
      content: 'Olá, estou tentando configurar o webhook mas está retornando erro 403.',
      whatsapp_message_id: 'wamid.HBgLNTUxMTk4NzY1NDMyMQ==',
      status: 'read',
      created_at: '2026-08-29T15:30:00Z',
    },
    {
      id: 'msg-2',
      conversation_id: 'conv-001',
      direction: 'outbound',
      message_type: 'text',
      content: 'Olá Carlos! Sou o 7 Assistente virtual. Você já verificou se o token de verificação (Verify Token) no Meta Developers coincide com o configurado no painel?',
      status: 'delivered',
      created_at: '2026-08-29T15:30:10Z',
    },
    {
      id: 'msg-3',
      conversation_id: 'conv-001',
      direction: 'inbound',
      message_type: 'text',
      content: 'Sim, já conferi. Preciso falar com alguém do suporte sobre a integração da API.',
      whatsapp_message_id: 'wamid.HBgLNTUxMTk4NzY1NDMyMg==',
      status: 'read',
      created_at: '2026-08-29T15:45:00Z',
    }
  ]
};

// Initial nodes and edges for the demo flow
export const initialFlowNodes = [
  {
    id: 'node-trigger',
    type: 'trigger',
    position: { x: 80, y: 180 },
    data: {
      label: 'Mensagem Recebida',
      nodeType: 'trigger',
      description: 'Dispara quando um contato envia mensagem',
      isConfigured: true,
      config: {
        eventType: 'any_message',
        keywords: '',
        matchType: 'contains'
      }
    }
  },
  {
    id: 'node-message-welcome',
    type: 'message',
    position: { x: 420, y: 180 },
    data: {
      label: 'Boas-vindas',
      nodeType: 'message',
      description: 'Envia mensagem com saudação',
      isConfigured: true,
      config: {
        text: 'Olá! 👋 Bem-vindo ao *7 Assistente*. Como podemos te ajudar hoje?',
        previewUrl: true
      }
    }
  },
  {
    id: 'node-buttons-menu',
    type: 'buttons',
    position: { x: 760, y: 180 },
    data: {
      label: 'Menu de Opções',
      nodeType: 'buttons',
      description: 'Apresenta 3 botões interativos',
      isConfigured: true,
      config: {
        bodyText: 'Selecione uma das opções abaixo:',
        buttons: [
          { id: 'btn_1', title: '🚀 Conhecer Planos' },
          { id: 'btn_2', title: '🤖 Suporte com IA' },
          { id: 'btn_3', title: '👤 Falar com Humano' }
        ]
      }
    }
  },
  {
    id: 'node-ai-agent',
    type: 'ai_agent',
    position: { x: 1150, y: 100 },
    data: {
      label: 'Agente de IA',
      nodeType: 'ai_agent',
      description: 'Responde dúvidas com IA e Base de Conhecimento',
      isConfigured: true,
      config: {
        model: 'gemini-1.5-pro',
        temperature: 0.4,
        persona: 'Assistente consultivo especialista em produtos',
        systemPrompt: 'Você é o 7 Assistente. Responda de forma clara, educada e concisa.'
      }
    }
  },
  {
    id: 'node-handoff',
    type: 'human_handoff',
    position: { x: 1150, y: 340 },
    data: {
      label: 'Transferir para Humano',
      nodeType: 'human_handoff',
      description: 'Pausa a automação e notifica a equipe',
      isConfigured: true,
      config: {
        department: 'Suporte Geral',
        notifyMessage: 'Um atendente humano foi notificado e responderá em breve.'
      }
    }
  }
];

export const initialFlowEdges = [
  {
    id: 'e-trigger-welcome',
    source: 'node-trigger',
    target: 'node-message-welcome',
    animated: true,
  },
  {
    id: 'e-welcome-menu',
    source: 'node-message-welcome',
    target: 'node-buttons-menu',
    animated: true,
  },
  {
    id: 'e-menu-ai',
    source: 'node-buttons-menu',
    target: 'node-ai-agent',
    sourceHandle: 'btn_2',
    label: 'Suporte com IA',
    animated: true,
  },
  {
    id: 'e-menu-handoff',
    source: 'node-buttons-menu',
    target: 'node-handoff',
    sourceHandle: 'btn_3',
    label: 'Falar com Humano',
    animated: true,
  }
];
