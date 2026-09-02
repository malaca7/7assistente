-- ==============================================================================
-- 7 ASSISTENTE — SCRIPT DE CONFIGURAÇÃO DO BANCO DE DADOS SUPABASE
-- Execute este script no SQL Editor do seu projeto Supabase:
-- https://supabase.com/dashboard/project/nskflvulclgwqqasdntq/sql/new
-- ==============================================================================

-- 1. Extensões
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Tabela de Perfil do Administrador
CREATE TABLE IF NOT EXISTS public.admin_profiles (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    phone TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Configurações Globais & Identidade do Bot
CREATE TABLE IF NOT EXISTS public.settings (
    id TEXT PRIMARY KEY DEFAULT 'default',
    business_name TEXT DEFAULT 'Talvane Barber',
    whatsapp_phone_number_id TEXT,
    whatsapp_business_account_id TEXT,
    whatsapp_access_token_encrypted TEXT,
    webhook_verify_token TEXT DEFAULT '7assistente_verify_token_secure',
    bot_profile JSONB DEFAULT '{
      "name": "Talvane Barber Bot",
      "company_name": "Talvane Barber",
      "gender": "male",
      "tone": "Amigável e Profissional",
      "avatar_url": "",
      "company_segment": "Barbearia e Estética Masculina",
      "support_email": "contato@talvanebarber.com.br",
      "support_phone": "81996138924",
      "business_hours": "08:00 às 19:00",
      "website_url": "https://talvane.malaca.com.br",
      "welcome_message": "Olá! Seja bem-vindo à Talvane Barber. Como podemos te ajudar hoje?"
    }'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Tabela de Fluxos
CREATE TABLE IF NOT EXISTS public.flows (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'paused', 'archived')),
    version INTEGER NOT NULL DEFAULT 1,
    node_count INTEGER DEFAULT 0,
    trigger_type TEXT DEFAULT 'Mensagem recebida',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Nós do Fluxo (Flow Nodes)
CREATE TABLE IF NOT EXISTS public.flow_nodes (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    flow_id TEXT NOT NULL REFERENCES public.flows(id) ON DELETE CASCADE,
    node_type TEXT NOT NULL,
    position_x NUMERIC NOT NULL DEFAULT 0,
    position_y NUMERIC NOT NULL DEFAULT 0,
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Conexões entre Nós (Flow Edges)
CREATE TABLE IF NOT EXISTS public.flow_edges (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    flow_id TEXT NOT NULL REFERENCES public.flows(id) ON DELETE CASCADE,
    source_node_id TEXT NOT NULL,
    target_node_id TEXT NOT NULL,
    source_handle TEXT,
    target_handle TEXT,
    condition JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Contatos do WhatsApp
CREATE TABLE IF NOT EXISTS public.contacts (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    phone TEXT NOT NULL UNIQUE,
    name TEXT,
    profile_picture_url TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'blocked', 'archived')),
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    metadata JSONB DEFAULT '{}'::jsonb,
    last_interaction TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. Conversas
CREATE TABLE IF NOT EXISTS public.conversations (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    contact_id TEXT NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
    contact_name TEXT,
    contact_phone TEXT,
    phone TEXT,
    status TEXT NOT NULL DEFAULT 'bot' CHECK (status IN ('bot', 'waiting_human', 'human', 'closed')),
    assigned_to TEXT,
    last_message TEXT,
    unread_count INTEGER DEFAULT 0,
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_message_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. Mensagens
CREATE TABLE IF NOT EXISTS public.messages (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    conversation_id TEXT NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    contact_id TEXT,
    phone TEXT,
    direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
    sender TEXT DEFAULT 'user',
    message_type TEXT NOT NULL DEFAULT 'text',
    content TEXT,
    text TEXT,
    media_url TEXT,
    whatsapp_message_id TEXT,
    status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'failed')),
    metadata JSONB DEFAULT '{}'::jsonb,
    timestamp TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. Agendamentos & Agenda
CREATE TABLE IF NOT EXISTS public.appointments (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    contact_id TEXT,
    contact_name TEXT NOT NULL,
    contact_phone TEXT NOT NULL,
    phone TEXT,
    service_name TEXT NOT NULL,
    professional_name TEXT DEFAULT 'Talvane',
    appointment_date TEXT NOT NULL,
    date TEXT,
    appointment_time TEXT NOT NULL,
    time TEXT,
    duration_minutes INTEGER DEFAULT 30,
    price NUMERIC DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 11. Configurações da Agenda
CREATE TABLE IF NOT EXISTS public.agenda_settings (
    id TEXT PRIMARY KEY DEFAULT 'default',
    business_days TEXT[] DEFAULT ARRAY['1', '2', '3', '4', '5', '6']::TEXT[],
    start_time TEXT DEFAULT '08:00',
    end_time TEXT DEFAULT '19:00',
    slot_duration_minutes INTEGER DEFAULT 30,
    break_start_time TEXT DEFAULT '12:00',
    break_end_time TEXT DEFAULT '13:00',
    services JSONB DEFAULT '[
      {"id": "srv-1", "name": "Corte Tradicional", "duration_minutes": 30, "price": 35},
      {"id": "srv-2", "name": "Barba Completa", "duration_minutes": 30, "price": 25},
      {"id": "srv-3", "name": "Corte + Barba (Combo)", "duration_minutes": 60, "price": 55},
      {"id": "srv-4", "name": "Sobrancelha", "duration_minutes": 15, "price": 15},
      {"id": "srv-5", "name": "Pigmentação", "duration_minutes": 20, "price": 25}
    ]'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 12. Tags
CREATE TABLE IF NOT EXISTS public.tags (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL UNIQUE,
    color TEXT NOT NULL DEFAULT '#6366f1',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- POLÍTICAS DE ROW LEVEL SECURITY (RLS)
-- ==============================================================================
ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flow_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flow_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agenda_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  CREATE POLICY "Allow all on admin_profiles" ON public.admin_profiles FOR ALL USING (true) WITH CHECK (true);
  CREATE POLICY "Allow all on settings" ON public.settings FOR ALL USING (true) WITH CHECK (true);
  CREATE POLICY "Allow all on flows" ON public.flows FOR ALL USING (true) WITH CHECK (true);
  CREATE POLICY "Allow all on flow_nodes" ON public.flow_nodes FOR ALL USING (true) WITH CHECK (true);
  CREATE POLICY "Allow all on flow_edges" ON public.flow_edges FOR ALL USING (true) WITH CHECK (true);
  CREATE POLICY "Allow all on contacts" ON public.contacts FOR ALL USING (true) WITH CHECK (true);
  CREATE POLICY "Allow all on conversations" ON public.conversations FOR ALL USING (true) WITH CHECK (true);
  CREATE POLICY "Allow all on messages" ON public.messages FOR ALL USING (true) WITH CHECK (true);
  CREATE POLICY "Allow all on appointments" ON public.appointments FOR ALL USING (true) WITH CHECK (true);
  CREATE POLICY "Allow all on agenda_settings" ON public.agenda_settings FOR ALL USING (true) WITH CHECK (true);
  CREATE POLICY "Allow all on tags" ON public.tags FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Inserir Configuração Padrão Talvane Barber
INSERT INTO public.settings (id, business_name, bot_profile)
VALUES (
  'default',
  'Talvane Barber',
  '{
    "name": "Talvane Barber Bot",
    "company_name": "Talvane Barber",
    "gender": "male",
    "tone": "Amigável e Profissional",
    "support_phone": "81996138924",
    "business_hours": "08:00 às 19:00",
    "welcome_message": "Olá! Seja bem-vindo à Talvane Barber. Como podemos te ajudar hoje?",
    "avatar_url": "",
    "company_segment": "Barbearia e Estética Masculina",
    "support_email": "contato@talvanebarber.com.br",
    "website_url": "https://talvane.malaca.com.br"
  }'::jsonb
)
ON CONFLICT (id) DO UPDATE SET 
  business_name = EXCLUDED.business_name,
  bot_profile = EXCLUDED.bot_profile;

-- Inserir Agenda Padrão Talvane Barber
INSERT INTO public.agenda_settings (id, business_days, start_time, end_time, slot_duration_minutes, break_start_time, break_end_time, services)
VALUES (
  'default',
  ARRAY['1', '2', '3', '4', '5', '6']::TEXT[],
  '08:00',
  '19:00',
  30,
  '12:00',
  '13:00',
  '[
    {"id": "srv-1", "name": "Corte Tradicional", "duration_minutes": 30, "price": 35},
    {"id": "srv-2", "name": "Barba Completa", "duration_minutes": 30, "price": 25},
    {"id": "srv-3", "name": "Corte + Barba (Combo)", "duration_minutes": 60, "price": 55},
    {"id": "srv-4", "name": "Sobrancelha", "duration_minutes": 15, "price": 15},
    {"id": "srv-5", "name": "Pigmentação", "duration_minutes": 20, "price": 25}
  ]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET 
  services = EXCLUDED.services,
  business_days = EXCLUDED.business_days,
  start_time = EXCLUDED.start_time,
  end_time = EXCLUDED.end_time;

-- Inserir Fluxo Oficial Talvane Barber
INSERT INTO public.flows (id, name, description, status, version, node_count, trigger_type)
VALUES (
  'flow-1788033465058',
  'Atendimento',
  'Fluxo de Atendimento e Agendamento Talvane Barber',
  'published',
  7,
  10,
  'Mensagem recebida'
)
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  status = EXCLUDED.status,
  version = EXCLUDED.version,
  node_count = EXCLUDED.node_count;

-- Nós do Fluxo
INSERT INTO public.flow_nodes (id, flow_id, node_type, position_x, position_y, data) VALUES
('node-trigger-1788033748050', 'flow-1788033465058', 'trigger', 80, 225, '{"label":"Gatilho","nodeType":"trigger","isConfigured":true,"config":{"eventType":"any_message"}}'::jsonb),
('node-check_contact-1788102919201', 'flow-1788033465058', 'check_contact', 470, 225, '{"label":"Verificar Contato (Novo vs Salvo)","nodeType":"check_contact","isConfigured":true,"config":{}}'::jsonb),
('node-message-1788033773183', 'flow-1788033465058', 'message', 860, 120, '{"label":"Enviar Mensagem","nodeType":"message","isConfigured":true,"config":{"text":"Olá, me chamo *{{bot_nome}}*. e sou assistente de atendimento da *{{empresa}}*! e vou lhe auxiliar para ter um melhor atendimento"}}'::jsonb),
('node-message-1788102948794', 'flow-1788033465058', 'message', 885, 450, '{"label":"Enviar Mensagem","nodeType":"message","isConfigured":true,"config":{"text":"Olá {{nome_cliente}}, me chamo *{{bot_nome}}*. e sou assistente de atendimento da *{{empresa}}*! e vou lhe auxiliar para ter um melhor atendimento"}}'::jsonb),
('node-question-1788033927695', 'flow-1788033465058', 'question', 1250, 120, '{"label":"Pergunta & Resposta","nodeType":"question","isConfigured":true,"config":{"questionText":"Por favor, informe seu nome:","expectedType":"text","variableName":"nome_cliente"}}'::jsonb),
('node-update_contact-1788041687381', 'flow-1788033465058', 'update_contact', 1640, 120, '{"label":"Salvar / Vincular Dados","nodeType":"update_contact","isConfigured":true,"config":{"contactName":"nome_cliente","tags":"Cliente"}}'::jsonb),
('node-ask_date-1788104674417', 'flow-1788033465058', 'ask_date', 2010, 360, '{"label":"1. Escolher Dia do Agendamento","nodeType":"ask_date","isConfigured":true,"config":{"questionText":"*{{nome_cliente}}*, para qual dia você gostaria de agendar seu atendimento?","dateVariable":"data_agendamento","allowCustomDate":true}}'::jsonb),
('node-services_catalog-1788105189425', 'flow-1788033465058', 'services_catalog', 2370, 165, '{"label":"2. Catálogo de Serviços & Preços","nodeType":"services_catalog","isConfigured":true,"config":{"displayFormat":"buttons","introMessage":"*{{nome_cliente}}*, qual serviço você deseja?","footerText":"Toque no serviço desejado para agendar:","serviceVarName":"servico_selecionado","priceVarName":"valor_servico","durationVarName":"duracao_servico"}}'::jsonb),
('node-schedule_contact-1788104743355', 'flow-1788033465058', 'schedule_contact', 2810, 120, '{"label":"3. Horários Livres da Agenda","nodeType":"schedule_contact","isConfigured":true,"config":{"mode":"show_slots","dateType":"variable","dateVariable":"data_agendamento","serviceName":"{{servico_selecionado}}","introMessage":"Estes são os horários disponíveis para agendamento. Toque no seu horário preferido:"}}'::jsonb),
('node-confirm_booking-1788104787175', 'flow-1788033465058', 'confirm_booking', 3200, 120, '{"label":"4. Confirmar & Gravar Agendamento","nodeType":"confirm_booking","isConfigured":true,"config":{"confirmMessage":"✅ Perfeito {{nome_cliente}}! Seu agendamento de *{{servico_selecionado}}* foi confirmado para o dia *{{data_agendamento}}* às *{{horario_agendamento}}*!"}}'::jsonb)
ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, position_x = EXCLUDED.position_x, position_y = EXCLUDED.position_y;

-- Conexões do Fluxo
INSERT INTO public.flow_edges (id, flow_id, source_node_id, target_node_id, source_handle, target_handle) VALUES
('xy-edge__node-trigger-1788033748050-node-check_contact-1788102919201', 'flow-1788033465058', 'node-trigger-1788033748050', 'node-check_contact-1788102919201', null, null),
('xy-edge__node-check_contact-1788102919201is_new-node-message-1788033773183', 'flow-1788033465058', 'node-check_contact-1788102919201', 'node-message-1788033773183', 'is_new', null),
('xy-edge__node-check_contact-1788102919201is_existing-node-message-1788102948794', 'flow-1788033465058', 'node-check_contact-1788102919201', 'node-message-1788102948794', 'is_existing', null),
('xy-edge__node-message-1788033773183-node-question-1788033927695', 'flow-1788033465058', 'node-message-1788033773183', 'node-question-1788033927695', null, null),
('xy-edge__node-question-1788033927695-node-update_contact-1788041687381', 'flow-1788033465058', 'node-question-1788033927695', 'node-update_contact-1788041687381', null, null),
('xy-edge__node-update_contact-1788041687381-node-ask_date-1788104674417', 'flow-1788033465058', 'node-update_contact-1788041687381', 'node-ask_date-1788104674417', null, null),
('xy-edge__node-message-1788102948794-node-ask_date-1788104674417', 'flow-1788033465058', 'node-message-1788102948794', 'node-ask_date-1788104674417', null, null),
('xy-edge__node-ask_date-1788104674417-node-services_catalog-1788105189425', 'flow-1788033465058', 'node-ask_date-1788104674417', 'node-services_catalog-1788105189425', null, null),
('xy-edge__node-services_catalog-1788105189425-node-schedule_contact-1788104743355', 'flow-1788033465058', 'node-services_catalog-1788105189425', 'node-schedule_contact-1788104743355', null, null),
('xy-edge__node-schedule_contact-1788104743355-node-confirm_booking-1788104787175', 'flow-1788033465058', 'node-schedule_contact-1788104743355', 'node-confirm_booking-1788104787175', null, null)
ON CONFLICT (id) DO NOTHING;
