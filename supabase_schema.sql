-- ==============================================================================
-- 7 ASSISTENTE & TALVANE BARBER - SCHEMA COMPLETO SUPABASE
-- Execute este script no SQL Editor do seu projeto Supabase:
-- https://supabase.com/dashboard/project/nskflvulclgwqqasdntq/sql
-- ==============================================================================

-- 1. Tabela de Perfil do Administrador
CREATE TABLE IF NOT EXISTS public.admin_profiles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL DEFAULT 'Administrador 7 Assistente',
    phone TEXT NOT NULL DEFAULT '81996138924',
    email TEXT DEFAULT 'admin@7assistente.com.br',
    password_hash TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'admin',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabela de Configurações Globais e Sessão do WhatsApp
CREATE TABLE IF NOT EXISTS public.settings (
    id TEXT PRIMARY KEY DEFAULT 'default',
    bot_name TEXT DEFAULT 'Talvane Barber Bot',
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
    business_name TEXT DEFAULT 'Talvane Barber',
    welcome_message TEXT DEFAULT 'Olá! Seja bem-vindo à Talvane Barber.',
    default_fallback TEXT DEFAULT 'Desculpe, não entendi. Você pode escolher uma das opções do menu.',
    human_takeover_enabled BOOLEAN DEFAULT true,
    business_hours TEXT DEFAULT '08:00 às 19:00',
    backend_url TEXT DEFAULT 'https://talvanebarber.discloud.app',
    whatsapp_session JSONB DEFAULT '{
        "status": "disconnected",
        "phone": null,
        "name": null,
        "connectedAt": null,
        "batteryLevel": 95
    }'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabela de Fluxos do Bot
CREATE TABLE IF NOT EXISTS public.flows (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'published',
    trigger_type TEXT DEFAULT 'exact_match',
    trigger_keywords TEXT[] DEFAULT ARRAY[]::TEXT[],
    category TEXT DEFAULT 'Geral',
    execution_count INTEGER DEFAULT 0,
    is_default BOOLEAN DEFAULT false,
    nodes JSONB DEFAULT '[]'::jsonb,
    edges JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabela de Nós de Fluxos
CREATE TABLE IF NOT EXISTS public.flow_nodes (
    id TEXT PRIMARY KEY,
    flow_id TEXT,
    type TEXT NOT NULL,
    data JSONB DEFAULT '{}'::jsonb,
    position JSONB DEFAULT '{"x": 0, "y": 0}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Tabela de Conexões de Fluxos (Edges)
CREATE TABLE IF NOT EXISTS public.flow_edges (
    id TEXT PRIMARY KEY,
    flow_id TEXT,
    source TEXT NOT NULL,
    target TEXT NOT NULL,
    source_handle TEXT,
    target_handle TEXT,
    animated BOOLEAN DEFAULT true,
    style JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Tabela de Contatos / Clientes
CREATE TABLE IF NOT EXISTS public.contacts (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    email TEXT,
    status TEXT DEFAULT 'lead',
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    custom_fields JSONB DEFAULT '{}'::jsonb,
    last_interaction TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Tabela de Conversas de Atendimento
CREATE TABLE IF NOT EXISTS public.conversations (
    id TEXT PRIMARY KEY,
    contact_id TEXT,
    phone TEXT NOT NULL,
    contact_name TEXT,
    last_message TEXT,
    last_message_at TIMESTAMPTZ DEFAULT NOW(),
    status TEXT DEFAULT 'bot',
    unread_count INTEGER DEFAULT 0,
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    assigned_agent TEXT,
    flow_state JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Tabela de Mensagens do Chat
CREATE TABLE IF NOT EXISTS public.messages (
    id TEXT PRIMARY KEY,
    conversation_id TEXT,
    contact_id TEXT,
    phone TEXT,
    sender TEXT NOT NULL, -- 'bot', 'user', 'human'
    text TEXT,
    type TEXT DEFAULT 'text',
    media_url TEXT,
    status TEXT DEFAULT 'sent',
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Tabela de Agendamentos da Barbearia
CREATE TABLE IF NOT EXISTS public.appointments (
    id TEXT PRIMARY KEY,
    contact_id TEXT,
    contact_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    service_name TEXT NOT NULL,
    professional_name TEXT DEFAULT 'Talvane',
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    status TEXT DEFAULT 'confirmed',
    price NUMERIC DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Tabela de Configurações da Agenda
CREATE TABLE IF NOT EXISTS public.agenda_settings (
    id TEXT PRIMARY KEY DEFAULT 'default',
    working_days TEXT[] DEFAULT ARRAY['monday','tuesday','wednesday','thursday','friday','saturday']::TEXT[],
    start_time TEXT DEFAULT '08:00',
    end_time TEXT DEFAULT '19:00',
    slot_duration_minutes INTEGER DEFAULT 30,
    services JSONB DEFAULT '[
        {"id": "s1", "name": "Corte Tradicional", "price": 35, "duration": 30},
        {"id": "s2", "name": "Barba Completa", "price": 25, "duration": 30},
        {"id": "s3", "name": "Corte + Barba (Combo)", "price": 55, "duration": 60},
        {"id": "s4", "name": "Sobrancelha", "price": 15, "duration": 15},
        {"id": "s5", "name": "Pigmentação", "price": 25, "duration": 20}
    ]'::jsonb,
    professionals JSONB DEFAULT '[
        {"id": "p1", "name": "Talvane Barber", "phone": "81996138924", "active": true}
    ]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- PERMISSÕES E POLÍTICAS PÚBLICAS DE ACESSO (SEM RESTRIÇÕES DE LOGIN)
-- ==============================================================================

-- Habilitar RLS em todas as tabelas
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

-- Criar Políticas de Acesso Total (Select, Insert, Update, Delete) para anon e authenticated
DO $$ 
DECLARE
    tbl text;
BEGIN
    FOR tbl IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename IN (
            'admin_profiles', 'settings', 'flows', 'flow_nodes', 
            'flow_edges', 'contacts', 'conversations', 'messages', 
            'appointments', 'agenda_settings'
        )
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "Public access on %I" ON public.%I', tbl, tbl);
        EXECUTE format('CREATE POLICY "Public access on %I" ON public.%I FOR ALL TO anon, authenticated USING (true) WITH CHECK (true)', tbl, tbl);
    END LOOP;
END $$;

-- Inserir Perfil Padrão do Administrador
INSERT INTO public.admin_profiles (id, name, phone, email, role)
VALUES ('admin-01', 'Administrador Talvane', '81996138924', 'talvane@malaca.com.br', 'admin')
ON CONFLICT (id) DO NOTHING;

-- Inserir Configurações Iniciais
INSERT INTO public.settings (id, business_name, backend_url)
VALUES ('default', 'Talvane Barber', 'https://talvanebarber.discloud.app')
ON CONFLICT (id) DO NOTHING;

-- Inserir Configurações da Agenda
INSERT INTO public.agenda_settings (id)
VALUES ('default')
ON CONFLICT (id) DO NOTHING;

-- Habilitar Realtime para mensagens, contatos e configurações
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.contacts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.settings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;
