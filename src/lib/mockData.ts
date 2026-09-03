import { Flow, Contact, Conversation, Settings, AdminProfile, DashboardKPIs, BotProfile } from '../types';

export const initialAdminProfile: AdminProfile = {
  id: 'admin-001',
  phone: '81996138924',
  name: 'Talvane Barber',
  password: 'admin',
  avatar_url: '',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const defaultBotProfile: BotProfile = {
  name: 'Talvane Barber Bot',
  company_name: 'Talvane Barber',
  gender: 'male',
  tone: 'Amigável e Profissional',
  avatar_url: '',
  company_segment: 'Barbearia e Estética Masculina',
  support_email: 'contato@talvanebarber.com.br',
  support_phone: '81996138924',
  business_hours: '08:00 às 19:00',
  website_url: 'https://talvane.malaca.com.br',
  welcome_message: 'Olá! Seja bem-vindo à Talvane Barber. Como podemos te ajudar hoje?',
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
  activeFlows: 1,
  waitingHuman: 0,
  messagesSentToday: 1890,
};

export const sampleFlows: Flow[] = [
  {
    id: 'flow-1788033465058',
    name: 'Atendimento & Agendamento Talvane Barber',
    description: 'Fluxo oficial com verificação de cliente, catálogo de serviços e reserva automática de horários.',
    status: 'published',
    version: 7,
    node_count: 10,
    trigger_type: 'Mensagem recebida',
    created_at: '2026-08-29T19:57:45.058Z',
    updated_at: '2026-08-30T15:53:39.736Z',
  }
];

export const sampleContacts: Contact[] = [];

export const sampleConversations: Conversation[] = [];

export const sampleMessages: Record<string, any[]> = {};

// Initial nodes and edges for Talvane Barber flow
export const initialFlowNodes = [
  {
    id: 'node-trigger-1788033748050',
    type: 'trigger',
    position: { x: 80, y: 225 },
    data: {
      label: 'Gatilho',
      nodeType: 'trigger',
      description: 'Inicia o fluxo ao receber mensagens ou eventos.',
      isConfigured: true,
      config: {
        eventType: 'any_message',
        keywords: '',
        matchType: 'contains'
      }
    }
  },
  {
    id: 'node-check_contact-1788102919201',
    type: 'check_contact',
    position: { x: 470, y: 225 },
    data: {
      label: 'Verificar Contato (Novo vs Salvo)',
      nodeType: 'check_contact',
      description: 'Verifica se é o primeiro contato do cliente ou contato existente e cria variáveis.',
      isConfigured: true,
      config: {}
    }
  },
  {
    id: 'node-message-1788033773183',
    type: 'message',
    position: { x: 860, y: 120 },
    data: {
      label: 'Enviar Mensagem',
      nodeType: 'message',
      description: 'Envia texto com suporte a variáveis dinâmicas.',
      isConfigured: true,
      config: {
        text: 'Olá, me chamo *{{bot_nome}}*. e sou assistente de atendimento da *{{empresa}}*! e vou lhe auxiliar para ter um melhor atendimento',
        previewUrl: false
      }
    }
  },
  {
    id: 'node-question-1788033927695',
    type: 'question',
    position: { x: 1250, y: 120 },
    data: {
      label: 'Pergunta & Resposta',
      nodeType: 'question',
      description: 'Faz uma pergunta e armazena a resposta em variável.',
      isConfigured: true,
      config: {
        questionText: 'Por favor, informe seu nome:',
        expectedType: 'text',
        variableName: 'nome_cliente'
      }
    }
  },
  {
    id: 'node-update_contact-1788041687381',
    type: 'update_contact',
    position: { x: 1640, y: 120 },
    data: {
      label: 'Salvar / Vincular Dados',
      nodeType: 'update_contact',
      description: 'Salva nome, tags e campos personalizados direto no WhatsApp do cliente.',
      isConfigured: true,
      config: {
        contactName: 'nome_cliente',
        tags: 'Cliente',
        customFieldKey: 'interesse_principal',
        customFieldValue: 'opcao_selecionada'
      }
    }
  },
  {
    id: 'node-message-1788102948794',
    type: 'message',
    position: { x: 885, y: 450 },
    data: {
      label: 'Enviar Mensagem',
      nodeType: 'message',
      description: 'Envia texto com suporte a variáveis dinâmicas.',
      isConfigured: true,
      config: {
        text: 'Olá {{nome_cliente}}, me chamo *{{bot_nome}}*. e sou assistente de atendimento da *{{empresa}}*! e vou lhe auxiliar para ter um melhor atendimento',
        previewUrl: false
      }
    }
  },
  {
    id: 'node-ask_date-1788104674417',
    type: 'ask_date',
    position: { x: 2010, y: 360 },
    data: {
      label: '1. Escolher Dia do Agendamento',
      nodeType: 'ask_date',
      description: 'Oferece botões rápidos (Hoje, Amanhã) ou permite o cliente digitar uma data (ex: 25/08).',
      isConfigured: true,
      config: {
        questionText: '*{{nome_cliente}}*, para qual dia você gostaria de agendar seu atendimento?',
        dateVariable: 'data_agendamento',
        allowCustomDate: true
      }
    }
  },
  {
    id: 'node-services_catalog-1788105189425',
    type: 'services_catalog',
    position: { x: 2370, y: 165 },
    data: {
      label: '2. Catálogo de Serviços & Preços',
      nodeType: 'services_catalog',
      description: 'Puxa serviços e preços da Agenda e envia em botões interativos para escolha.',
      isConfigured: true,
      config: {
        displayFormat: 'buttons',
        introMessage: '*{{nome_cliente}}*, qual serviço você deseja?',
        footerText: 'Toque no serviço desejado para agendar:',
        serviceVarName: 'servico_selecionado',
        priceVarName: 'valor_servico',
        durationVarName: 'duracao_servico'
      }
    }
  },
  {
    id: 'node-schedule_contact-1788104743355',
    type: 'schedule_contact',
    position: { x: 2810, y: 120 },
    data: {
      label: '3. Horários Livres da Agenda',
      nodeType: 'schedule_contact',
      description: 'Calcula horários realmente livres para a data e serviço, enviando opções para o cliente.',
      isConfigured: true,
      config: {
        mode: 'show_slots',
        dateType: 'variable',
        dateVariable: 'data_agendamento',
        serviceName: '{{servico_selecionado}}',
        introMessage: 'Estes são os horários disponíveis para agendamento. Toque no seu horário preferido:'
      }
    }
  },
  {
    id: 'node-confirm_booking-1788104787175',
    type: 'confirm_booking',
    position: { x: 3200, y: 120 },
    data: {
      label: '4. Confirmar & Gravar Agendamento',
      nodeType: 'confirm_booking',
      description: 'Exibe resumo com serviço, valor, data e horário, grava na Agenda e adiciona tag Agendado.',
      isConfigured: true,
      config: {
        confirmMessage: '✅ Perfeito {{nome_cliente}}! Seu agendamento de *{{servico_selecionado}}* foi confirmado para o dia *{{data_agendamento}}* às *{{horario_agendamento}}*!'
      }
    }
  }
];

export const initialFlowEdges = [
  {
    id: 'xy-edge__node-trigger-1788033748050-node-check_contact-1788102919201',
    source: 'node-trigger-1788033748050',
    target: 'node-check_contact-1788102919201',
    type: 'smoothstep',
    animated: true,
    style: { stroke: '#06b6d4', strokeWidth: 2.5 }
  },
  {
    id: 'xy-edge__node-check_contact-1788102919201is_new-node-message-1788033773183',
    source: 'node-check_contact-1788102919201',
    sourceHandle: 'is_new',
    target: 'node-message-1788033773183',
    type: 'smoothstep',
    animated: true,
    style: { stroke: '#06b6d4', strokeWidth: 2.5 }
  },
  {
    id: 'xy-edge__node-check_contact-1788102919201is_existing-node-message-1788102948794',
    source: 'node-check_contact-1788102919201',
    sourceHandle: 'is_existing',
    target: 'node-message-1788102948794',
    type: 'smoothstep',
    animated: true,
    style: { stroke: '#06b6d4', strokeWidth: 2.5 }
  },
  {
    id: 'xy-edge__node-message-1788033773183-node-question-1788033927695',
    source: 'node-message-1788033773183',
    target: 'node-question-1788033927695',
    animated: true,
    style: { stroke: '#6366f1', strokeWidth: 2.5 }
  },
  {
    id: 'xy-edge__node-question-1788033927695-node-update_contact-1788041687381',
    source: 'node-question-1788033927695',
    target: 'node-update_contact-1788041687381',
    animated: true,
    style: { stroke: '#6366f1', strokeWidth: 2.5 }
  },
  {
    id: 'xy-edge__node-update_contact-1788041687381-node-ask_date-1788104674417',
    source: 'node-update_contact-1788041687381',
    target: 'node-ask_date-1788104674417',
    type: 'smoothstep',
    animated: true,
    style: { stroke: '#06b6d4', strokeWidth: 2.5 }
  },
  {
    id: 'xy-edge__node-message-1788102948794-node-ask_date-1788104674417',
    source: 'node-message-1788102948794',
    target: 'node-ask_date-1788104674417',
    type: 'smoothstep',
    animated: true,
    style: { stroke: '#06b6d4', strokeWidth: 2.5 }
  },
  {
    id: 'xy-edge__node-ask_date-1788104674417-node-services_catalog-1788105189425',
    source: 'node-ask_date-1788104674417',
    target: 'node-services_catalog-1788105189425',
    type: 'smoothstep',
    animated: true,
    style: { stroke: '#06b6d4', strokeWidth: 2.5 }
  },
  {
    id: 'xy-edge__node-services_catalog-1788105189425-node-schedule_contact-1788104743355',
    source: 'node-services_catalog-1788105189425',
    target: 'node-schedule_contact-1788104743355',
    type: 'smoothstep',
    animated: true,
    style: { stroke: '#06b6d4', strokeWidth: 2.5 }
  },
  {
    id: 'xy-edge__node-schedule_contact-1788104743355-node-confirm_booking-1788104787175',
    source: 'node-schedule_contact-1788104743355',
    target: 'node-confirm_booking-1788104787175',
    type: 'smoothstep',
    animated: true,
    style: { stroke: '#06b6d4', strokeWidth: 2.5 }
  }
];

export const initialAttendants: import('../types').Attendant[] = [
  {
    id: 'att-1',
    name: 'Talvane',
    email: 'talvane@barber.com',
    phone: '81996138924',
    password: '123',
    role: 'admin',
    department: 'Geral',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    status: 'online',
    metrics: {
      chats_assigned: 38,
      chats_resolved: 35,
      messages_sent: 142,
      avg_response_time_min: 1.8,
      rating: 4.9,
    },
    created_at: '2026-08-01T10:00:00.000Z',
  },
  {
    id: 'att-2',
    name: 'Sofia Atendimento',
    email: 'sofia@barber.com',
    phone: '81988887777',
    password: '123',
    role: 'attendant',
    department: 'Comercial & Vendas',
    avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    status: 'online',
    metrics: {
      chats_assigned: 29,
      chats_resolved: 27,
      messages_sent: 118,
      avg_response_time_min: 2.1,
      rating: 4.8,
    },
    created_at: '2026-08-10T10:00:00.000Z',
  },
  {
    id: 'att-3',
    name: 'Lucas Relacionamento',
    email: 'lucas@barber.com',
    phone: '81977776666',
    password: '123',
    role: 'attendant',
    department: 'Suporte & Recepção',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    status: 'busy',
    metrics: {
      chats_assigned: 21,
      chats_resolved: 19,
      messages_sent: 84,
      avg_response_time_min: 2.5,
      rating: 4.7,
    },
    created_at: '2026-08-15T10:00:00.000Z',
  },
];

export const defaultCannedReplies: import('../types').CannedReply[] = [
  { id: 'can-1', label: '👋 Boas-Vindas', cmd: '/oi', text: 'Olá! Como posso ajudar você hoje? Fique à vontade para tirar qualquer dúvida.', category: 'Geral' },
  { id: 'can-2', label: '📅 Agendamento', cmd: '/agenda', text: 'Você gostaria de reservar um horário hoje ou para outro dia? Temos vagas disponíveis!', category: 'Agendamento' },
  { id: 'can-3', label: '💳 Chave PIX', cmd: '/pix', text: 'Nossa chave PIX para pagamentos é: 81996138924 (Telefone - Talvane Barber). Ao realizar o pagamento, nos envie o comprovante!', category: 'Financeiro' },
  { id: 'can-4', label: '📍 Localização', cmd: '/onde', text: 'Estamos localizados na Rua Principal, 100 - Centro. Temos estacionamento no local!', category: 'Informações' },
  { id: 'can-5', label: '⏳ Aguarde um instante', cmd: '/aguarde', text: 'Estou verificando seu pedido em nosso sistema, só um momento por favor!', category: 'Atendimento' },
  { id: 'can-6', label: '✅ Finalizar com Agradecimento', cmd: '/obrigado', text: 'Foi um prazer te atender! Se precisar de mais alguma coisa, estamos à disposição. Um ótimo dia!', category: 'Fechamento' },
];
