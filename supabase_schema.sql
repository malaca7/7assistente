-- ==============================================================================
-- PITOCO DE GENTE — SCHEMA OFICIAL SUPABASE & SEED INICIAL
-- Executar no SQL Editor do Supabase:
-- https://supabase.com/dashboard/project/cbeiguyvoepbcafmxduy/sql/new
-- ==============================================================================

-- 1. Extensões
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. TABELA: STORES (MULTI-LOJAS CENTRALIZADO)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.stores (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    address TEXT NOT NULL,
    phone TEXT NOT NULL,
    whatsapp_number TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    business_hours TEXT DEFAULT 'Seg a Sáb: 09:00 às 19:00',
    city TEXT DEFAULT 'Recife - PE',
    manager_name TEXT,
    monthly_revenue NUMERIC(12,2) DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 3. TABELA: CATEGORIES (CATEGORIAS DO CATÁLOGO INFANTIL)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.categories (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    store_id TEXT REFERENCES public.stores(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    icon TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 4. TABELA: PRODUCTS (PRODUTOS, TAMANHOS, CORES E VARIAÇÕES)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    store_id TEXT REFERENCES public.stores(id) ON DELETE SET NULL,
    category_id TEXT NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    price NUMERIC(10,2) NOT NULL,
    promotional_price NUMERIC(10,2),
    sizes TEXT[] NOT NULL DEFAULT ARRAY['RN', 'P', 'M', 'G', 'GG']::TEXT[],
    colors TEXT[] NOT NULL DEFAULT ARRAY['Branco Puro', 'Azul Bebê', 'Rosa Seco']::TEXT[],
    image_url TEXT,
    stock_quantity INTEGER NOT NULL DEFAULT 50,
    sku TEXT,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    material TEXT DEFAULT 'Algodão Suedine 100% Pima',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 5. TABELA: CLIENTS (CRM & HISTÓRICO DAS MAMÃES E BEBÊS)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.clients (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    store_id TEXT REFERENCES public.stores(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    email TEXT,
    address TEXT,
    city TEXT,
    cep TEXT,
    notes TEXT,
    baby_name TEXT,
    due_date DATE,
    total_orders INTEGER NOT NULL DEFAULT 0,
    total_spent NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    tags TEXT[] DEFAULT ARRAY['Cliente WhatsApp']::TEXT[],
    last_interaction TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 6. TABELA: CONVERSATIONS (CONVERSAS MULTI-LOJAS & STATUS)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.conversations (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    client_id TEXT REFERENCES public.clients(id) ON DELETE SET NULL,
    store_id TEXT REFERENCES public.stores(id) ON DELETE SET NULL,
    phone TEXT NOT NULL,
    client_name TEXT,
    status TEXT NOT NULL DEFAULT 'bot' CHECK (status IN ('bot', 'waiting_human', 'human', 'closed')),
    assigned_to TEXT,
    last_message TEXT,
    unread_count INTEGER DEFAULT 0,
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_message_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 7. TABELA: CHAT_MESSAGES (MENSAGENS EM TEMPO REAL)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    conversation_id TEXT NOT NULL,
    client_id TEXT,
    store_id TEXT REFERENCES public.stores(id) ON DELETE SET NULL,
    direction TEXT NOT NULL DEFAULT 'inbound' CHECK (direction IN ('inbound', 'outbound')),
    message_type TEXT NOT NULL DEFAULT 'text',
    content TEXT NOT NULL,
    media_url TEXT,
    status TEXT NOT NULL DEFAULT 'delivered',
    author_name TEXT,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 8. TABELA: SUPPORT_TICKETS (TICKETS DE ATENDIMENTO HUMANO)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.support_tickets (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    store_id TEXT NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    client_id TEXT REFERENCES public.clients(id) ON DELETE SET NULL,
    conversation_id TEXT,
    protocol TEXT NOT NULL UNIQUE,
    subject TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'transferred', 'resolved', 'closed')),
    priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    attendant_name TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 9. TABELA: BOT_CONFIG (CONFIGURAÇÕES GLOBAIS DO BOT PITOCO)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.bot_config (
    id TEXT PRIMARY KEY DEFAULT 'default',
    bot_name TEXT NOT NULL DEFAULT 'Pitoco Bot',
    store_name TEXT NOT NULL DEFAULT 'Pitoco de Gente',
    welcome_message TEXT NOT NULL DEFAULT 'Olá! Bem-vindo(a) à Pitoco de Gente — Roupas de Bebê, Infantil e Enxovais! 👶✨ Como podemos te encantar hoje?',
    handoff_message TEXT NOT NULL DEFAULT 'Transferindo para uma de nossas consultoras especializadas...',
    fallback_message TEXT NOT NULL DEFAULT 'Não entendi essa opção. Por favor, escolha um dos números do menu abaixo:',
    pix_key TEXT NOT NULL DEFAULT 'financeiro@pitocodegente.com.br',
    pix_name TEXT NOT NULL DEFAULT 'Pitoco de Gente Artigos Infantis LTDA',
    pix_city TEXT NOT NULL DEFAULT 'Recife',
    shipping_motoboy_price NUMERIC(10,2) NOT NULL DEFAULT 15.00,
    shipping_correios_price NUMERIC(10,2) NOT NULL DEFAULT 24.90,
    free_shipping_threshold NUMERIC(10,2) NOT NULL DEFAULT 250.00,
    vip_consultation_enabled BOOLEAN NOT NULL DEFAULT true,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 10. TABELA: SYSTEM_USERS (USUÁRIOS, PAPÉIS & PERMISSÕES: CEO, GERENTE, ATENDENTE)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.system_users (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    store_id TEXT REFERENCES public.stores(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    email TEXT,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'attendant' CHECK (role IN ('ceo', 'manager', 'attendant', 'admin')),
    permissions JSONB NOT NULL DEFAULT '{
      "can_access_admin": true,
      "can_access_atendimento": true,
      "can_access_loja": true
    }'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 11. TABELA: APPOINTMENTS (CONSULTORIAS VIP DE ENXOVAL)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.appointments (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    store_id TEXT REFERENCES public.stores(id) ON DELETE SET NULL,
    client_name TEXT NOT NULL,
    client_phone TEXT NOT NULL,
    consultation_type TEXT NOT NULL DEFAULT 'online_whatsapp' CHECK (consultation_type IN ('online_whatsapp', 'presencial_loja')),
    consultation_date DATE NOT NULL,
    consultation_time TEXT NOT NULL,
    due_date DATE,
    baby_gender TEXT DEFAULT 'surpresa',
    status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'pending', 'completed', 'cancelled')),
    consultant_name TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- ÍNDICES PARA ALTA PERFORMANCE
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_store ON public.products(store_id);
CREATE INDEX IF NOT EXISTS idx_clients_phone ON public.clients(phone);
CREATE INDEX IF NOT EXISTS idx_chat_messages_conv ON public.chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON public.chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_store ON public.conversations(store_id);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON public.conversations(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_store ON public.support_tickets(store_id);

-- ==============================================================================
-- HABILITAR ROW LEVEL SECURITY (RLS)
-- ==============================================================================
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bot_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- POLICIES PERMISSIVAS PARA ANON E AUTHENTICATED
CREATE POLICY "Permitir leitura pública de lojas" ON public.stores FOR SELECT USING (true);
CREATE POLICY "Permitir leitura pública de categorias" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Permitir leitura pública de produtos" ON public.products FOR SELECT USING (true);
CREATE POLICY "Permitir leitura pública de config do bot" ON public.bot_config FOR SELECT USING (true);

CREATE POLICY "Permitir gerenciamento anon de clientes" ON public.clients FOR ALL USING (true);
CREATE POLICY "Permitir gerenciamento anon de mensagens" ON public.chat_messages FOR ALL USING (true);
CREATE POLICY "Permitir gerenciamento anon de conversas" ON public.conversations FOR ALL USING (true);
CREATE POLICY "Permitir gerenciamento anon de tickets" ON public.support_tickets FOR ALL USING (true);
CREATE POLICY "Permitir gerenciamento anon de consultorias" ON public.appointments FOR ALL USING (true);
CREATE POLICY "Permitir gerenciamento admin de produtos" ON public.products FOR ALL USING (true);
CREATE POLICY "Permitir gerenciamento admin de categorias" ON public.categories FOR ALL USING (true);
CREATE POLICY "Permitir gerenciamento admin de lojas" ON public.stores FOR ALL USING (true);
CREATE POLICY "Permitir gerenciamento admin de config" ON public.bot_config FOR ALL USING (true);
CREATE POLICY "Permitir gerenciamento admin de usuarios" ON public.system_users FOR ALL USING (true);

-- Habilitar Realtime para Chat e Conversas
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_tickets;

-- ==============================================================================
-- SEED INICIAL: LOJAS, CATEGORIAS, PRODUTOS E BOT
-- ==============================================================================
INSERT INTO public.stores (id, name, slug, address, phone, whatsapp_number, is_active, business_hours, city, manager_name, monthly_revenue)
VALUES
  ('store-001', 'Loja Matriz — Centro', 'matriz', 'Rua do Sol, 120 - Centro', '8132211000', '81996138924', true, 'Seg a Sex: 08:30 às 18:30 | Sáb: 08:30 às 14:00', 'Recife - PE', 'Juliana Matriz', 48500.00),
  ('store-002', 'Loja Shopping Boulevard', 'boulevard', 'Av. Principal, 500 - Piso L2, Loja 204', '8134422000', '81996138924', true, 'Seg a Sáb: 10:00 às 22:00 | Dom: 13:00 às 21:00', 'Recife - PE', 'Carla Boulevard', 62300.00),
  ('store-003', 'Atendimento Geral / E-commerce', 'ecommerce', 'Centro de Distribuição Online - Av. Brasil, 1500', '81996138924', '81996138924', true, '24 horas (Automático) | Atendentes: 08:00 às 20:00', 'Digital / Brasil', 'Equipe Digital Pitoco', 95800.00)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  address = EXCLUDED.address,
  phone = EXCLUDED.phone,
  whatsapp_number = EXCLUDED.whatsapp_number;

INSERT INTO public.categories (id, name, slug, description, sort_order, is_active)
VALUES
  ('cat-001', 'Bodies & Roupinhas Básicas', 'bodies-roupinhas', 'Bodies em algodão suedine 100% Pima, mijões e kits essenciais de toque macio', 1, true),
  ('cat-002', 'Macacões com Zíper Duplo', 'macacoes-ziper', 'Macacões práticos com zíper duplo frontal que facilitam a troca de fraldas', 2, true),
  ('cat-003', 'Saídas de Maternidade', 'saidas-maternidade', 'Conjuntos luxo em tricot antialérgico, mantas coordenadas e acabamento realeza', 3, true),
  ('cat-004', 'Kits de Berço & Quarto', 'kits-berco', 'Kits de berço 400 fios, tranças protetoras, ninhos redutores e lençóis premium', 4, true),
  ('cat-005', 'Mala & Acessórios Maternidade', 'malas-acessorios', 'Malas térmicas, bolsas de passeio impermeáveis e organizadores de troca', 5, true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (id, category_id, name, description, price, promotional_price, sizes, colors, stock_quantity, is_featured, material, image_url)
VALUES
  (
    'prod-001',
    'cat-001',
    'Body Manga Longa Algodão Suedine 100% Pima',
    'Confeccionado em puro algodão suedine 100% egípcio com toque sedoso e gola envelope que não aperta a cabeça do bebê. Proteção térmica ideal para os primeiros meses.',
    49.90,
    39.90,
    ARRAY['RN', 'P', 'M', 'G', 'GG'],
    ARRAY['Branco Puro', 'Azul Bebê', 'Rosa Seco', 'Verde Menta', 'Bege Neutro'],
    120,
    true,
    'Algodão Suedine 100% Pima',
    'https://images.unsplash.com/photo-1522771930-78848d9293e8?w=500&auto=format&fit=crop'
  ),
  (
    'prod-002',
    'cat-002',
    'Macacão Canelado com Zíper Duplo Soft',
    'O queridinho das mamães! Possui zíper com cursor duplo que abre por cima e por baixo, proteção interna de zíper para não tocar na pele do bebê e pezinho reversível.',
    79.90,
    69.90,
    ARRAY['RN', 'P', 'M', 'G', '1 ano'],
    ARRAY['Azul Bebê', 'Rosa Seco', 'Verde Menta', 'Bege Neutro'],
    85,
    true,
    'Algodão Canelado Premium',
    'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=500&auto=format&fit=crop'
  ),
  (
    'prod-003',
    'cat-003',
    'Saída de Maternidade Tricot Luxo Realeza 4 Peças',
    'Conjunto completo para o momento mais especial: Macacão bordado, manta aconchegante coordenada, touquinha e par de luvinhas. Confeccionado em tricot térmico antialérgico.',
    189.90,
    169.90,
    ARRAY['RN', 'P'],
    ARRAY['Branco Puro', 'Rosa Seco', 'Azul Bebê', 'Amarelo Manteiga'],
    45,
    true,
    'Tricot Luxo 50% Algodão 50% Acrílico Antialérgico',
    'https://images.unsplash.com/photo-1596870230751-ebdfce98ec42?w=500&auto=format&fit=crop'
  ),
  (
    'prod-004',
    'cat-004',
    'Kit Berço Algodão 400 Fios Trança Nuvem',
    'Kit com lateral em trança fofinha, cabeceira nuvem bordada, lençol com elástico 400 fios e fronha delicada. Segurança e aconchego máximo para o quartinho do bebê.',
    289.90,
    259.90,
    ARRAY['RN', 'P', 'M', 'G'],
    ARRAY['Branco Puro', 'Verde Menta', 'Bege Neutro'],
    30,
    true,
    'Algodão Percal 400 Fios Acetinado',
    'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=500&auto=format&fit=crop'
  ),
  (
    'prod-005',
    'cat-005',
    'Mala Maternidade Térmica Master Impermeável',
    'Compartimento amplo com divisórias para as roupinhas das primeiras 48h, forro térmico impermeável fácil de higienizar e bolsos laterais para mamadeiras e fraldas.',
    219.90,
    199.90,
    ARRAY['G', 'GG'],
    ARRAY['Bege Neutro', 'Rosa Seco', 'Azul Bebê'],
    40,
    false,
    'Couro Ecológico Impermeável Soft',
    'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=500&auto=format&fit=crop'
  ),
  (
    'prod-006',
    'cat-001',
    'Kit 3 Paninhos de Boca Fralda Luxo Bordada',
    'Fralda dupla atoalhada 100% algodão com acabamento em crochê e bordado exclusivo. Indispensável para o dia a dia e passeios.',
    39.90,
    29.90,
    ARRAY['RN'],
    ARRAY['Branco Puro', 'Rosa Seco', 'Azul Bebê'],
    150,
    false,
    'Fralda Dupla 100% Algodão',
    'https://images.unsplash.com/photo-1544816155-12df9643f363?w=500&auto=format&fit=crop'
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.bot_config (
    id, bot_name, store_name, welcome_message, handoff_message, fallback_message,
    pix_key, pix_name, pix_city, shipping_motoboy_price, shipping_correios_price, free_shipping_threshold, vip_consultation_enabled, is_active
) VALUES (
    'default',
    'Pitoco Bot',
    'Pitoco de Gente',
    'Olá! Seja bem-vindo(a) à Pitoco de Gente — Roupas de Bebê, Infantil e Enxovais! 👶💖 Como posso ajudar você hoje?',
    'Transferindo para uma de nossas consultoras especializadas...',
    'Por favor, digite o número da opção desejada no menu:',
    'financeiro@pitocodegente.com.br',
    'Pitoco de Gente Artigos Infantis LTDA',
    'Recife',
    15.00,
    24.90,
    250.00,
    true,
    true
) ON CONFLICT (id) DO UPDATE SET
    bot_name = EXCLUDED.bot_name,
    store_name = EXCLUDED.store_name,
    welcome_message = EXCLUDED.welcome_message,
    pix_key = EXCLUDED.pix_key;

INSERT INTO public.system_users (id, store_id, name, phone, email, password_hash, role)
VALUES
  ('user-ceo', null, 'Malaca CEO', '81996138924', 'ceo@pitocodegente.com.br', 'admin', 'ceo'),
  ('user-mgr-matriz', 'store-001', 'Gerente Matriz Centro', '81999990001', 'gerente.centro@pitocodegente.com.br', '1234', 'manager'),
  ('user-mgr-boulevard', 'store-002', 'Gerente Shopping Boulevard', '81999990002', 'gerente.boulevard@pitocodegente.com.br', '1234', 'manager'),
  ('user-att-sofia', 'store-001', 'Sofia Consultora VIP', '81999990003', 'sofia@pitocodegente.com.br', '1234', 'attendant')
ON CONFLICT (phone) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role;
