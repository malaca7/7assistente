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
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Configurações da Meta WhatsApp Cloud API & Identidade do Bot
CREATE TABLE IF NOT EXISTS public.settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    whatsapp_phone_number_id TEXT,
    whatsapp_business_account_id TEXT,
    whatsapp_access_token_encrypted TEXT,
    webhook_verify_token TEXT DEFAULT '7assistente_verify_token_secure',
    bot_profile JSONB DEFAULT '{
      "name": "Sofia",
      "company_name": "7 Assistente Tech",
      "gender": "female",
      "tone": "friendly",
      "avatar_url": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80",
      "company_segment": "SaaS & Automação de WhatsApp",
      "support_email": "suporte@7assistente.com.br",
      "support_phone": "+55 81 99613-8924",
      "business_hours": "Segunda a Sexta, das 08h às 18h",
      "website_url": "https://7assistente.com.br",
      "welcome_message": "Olá! Sou a Sofia, assistente virtual da 7 Assistente. Como posso te ajudar hoje?"
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
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. Conversas
CREATE TABLE IF NOT EXISTS public.conversations (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    contact_id TEXT NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'bot' CHECK (status IN ('bot', 'waiting_human', 'human', 'closed')),
    assigned_to TEXT,
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_message_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. Mensagens
CREATE TABLE IF NOT EXISTS public.messages (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    conversation_id TEXT NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
    message_type TEXT NOT NULL DEFAULT 'text',
    content TEXT,
    media_url TEXT,
    whatsapp_message_id TEXT,
    status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'failed')),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. Tags
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
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

-- Liberar acesso para operações da plataforma
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow full access to admin_profiles') THEN
    CREATE POLICY "Allow full access to admin_profiles" ON public.admin_profiles FOR ALL USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow full access to settings') THEN
    CREATE POLICY "Allow full access to settings" ON public.settings FOR ALL USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow full access to flows') THEN
    CREATE POLICY "Allow full access to flows" ON public.flows FOR ALL USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow full access to flow_nodes') THEN
    CREATE POLICY "Allow full access to flow_nodes" ON public.flow_nodes FOR ALL USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow full access to flow_edges') THEN
    CREATE POLICY "Allow full access to flow_edges" ON public.flow_edges FOR ALL USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow full access to contacts') THEN
    CREATE POLICY "Allow full access to contacts" ON public.contacts FOR ALL USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow full access to conversations') THEN
    CREATE POLICY "Allow full access to conversations" ON public.conversations FOR ALL USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow full access to messages') THEN
    CREATE POLICY "Allow full access to messages" ON public.messages FOR ALL USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow full access to tags') THEN
    CREATE POLICY "Allow full access to tags" ON public.tags FOR ALL USING (true);
  END IF;
END $$;

-- ==============================================================================
-- CARGA INICIAL DE DADOS (SEEDS)
-- ==============================================================================

-- Inserir Administrador Inicial
INSERT INTO public.admin_profiles (phone, name)
VALUES ('81996138924', 'Administrador 7 Assistente')
ON CONFLICT (phone) DO UPDATE SET name = EXCLUDED.name;

-- Inserir Configuração Padrão
INSERT INTO public.settings (id, webhook_verify_token, bot_profile)
VALUES (
  'settings-001',
  '7assistente_verify_token_secure',
  '{
    "name": "Sofia",
    "company_name": "7 Assistente Tech",
    "gender": "female",
    "tone": "friendly",
    "avatar_url": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80",
    "company_segment": "SaaS & Automação de WhatsApp",
    "support_email": "suporte@7assistente.com.br",
    "support_phone": "+55 81 99613-8924",
    "business_hours": "Segunda a Sexta, das 08h às 18h",
    "website_url": "https://7assistente.com.br",
    "welcome_message": "Olá! Sou a Sofia, assistente virtual da 7 Assistente. Como posso te ajudar hoje?"
  }'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- Inserir Fluxo Inicial de Demonstração
INSERT INTO public.flows (id, name, description, status, version, node_count, trigger_type)
VALUES (
  'flow-001',
  'Atendimento Inicial & Qualificação de Leads',
  'Fluxo principal acionado ao receber qualquer mensagem inicial de novos clientes.',
  'published',
  3,
  5,
  'Mensagem recebida'
)
ON CONFLICT (id) DO NOTHING;
