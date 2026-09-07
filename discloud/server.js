import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import QRCode from 'qrcode';
import pino from 'pino';
import { 
  makeWASocket, 
  useMultiFileAuthState, 
  DisconnectReason, 
  fetchLatestBaileysVersion 
} from '@whiskeysockets/baileys';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const AUTH_DIR = path.resolve(__dirname, 'whatsapp_auth');
const DATA_DIR = path.resolve(__dirname, 'data');
const DB_FILE = path.resolve(DATA_DIR, 'pitoco_db.json');

if (!fs.existsSync(AUTH_DIR)) fs.mkdirSync(AUTH_DIR, { recursive: true });
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// Environment variables
const PORT = process.env.PORT || 8080;
const HOST = '0.0.0.0';
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://cbeiguyvoepbcafmxduy.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNiZWlndXl2b2VwYmNhZm14ZHV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3MzU5NzcsImV4cCI6MjEwNDMxMTk3N30.1XpWL6ns9NlPh4sQ3M8-OJTnKCPH-jf89iFspmBrKxM';

// Supabase backend client
const supabase = (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY)
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    })
  : null;

// ==============================================================================
// 1. BANCO DE DADOS PERSISTENTE & SINCRONIZAÇÃO EM TEMPO REAL
// ==============================================================================
const defaultDb = {
  botConfig: {
    welcome_message: '👶✨ *PITOCO DE GENTE — Roupas de Bebê & Enxovais*\nOlá, *{clientName}*! Bem-vindo(a) à nossa loja oficial! Como podemos te ajudar hoje?',
    pix_key: 'financeiro@pitocodegente.com.br',
    pix_name: 'Pitoco de Gente Artigos Infantis LTDA',
    pix_city: 'Recife',
    shipping_motoboy_price: 15.00,
    shipping_correios_price: 24.90,
    free_shipping_threshold: 250.00,
    is_active: true,
  },
  stores: [
    {
      id: 'store-001',
      name: 'Loja Matriz — Centro',
      slug: 'matriz',
      address: 'Rua do Sol, 120 - Centro, Recife - PE',
      phone: '8132211000',
      whatsapp_number: '81996138924',
      is_active: true,
      business_hours: '08:30 às 18:30',
      city: 'Recife - PE',
      monthly_revenue: 125400.00,
      active_chats: 42,
    },
    {
      id: 'store-002',
      name: 'Loja Shopping Boulevard',
      slug: 'boulevard',
      address: 'Av. Principal, 500 - Piso L2, Loja 204',
      phone: '8134422000',
      whatsapp_number: '81996138924',
      is_active: true,
      business_hours: '10:00 às 22:00',
      city: 'Recife - PE',
      monthly_revenue: 98200.00,
      active_chats: 31,
    },
    {
      id: 'store-003',
      name: 'Atendimento Geral / E-commerce',
      slug: 'ecommerce',
      address: 'Central Digital / E-commerce Brasil',
      phone: '81996138924',
      whatsapp_number: '81996138924',
      is_active: true,
      business_hours: '24h Online',
      city: 'Brasil',
      monthly_revenue: 184500.00,
      active_chats: 88,
    },
  ],
  products: [
    {
      id: 'prod-001',
      name: 'Body Manga Longa Suedine 100% Pima',
      price: 39.90,
      promotional_price: 34.90,
      description: 'Toque aveludado, antialérgico, com gola transpassada americana para vestir fácil.',
      material: 'Algodão Suedine 100% Pima',
      sizes: ['RN', 'P', 'M', 'G'],
      colors: ['Branco', 'Azul Bebê', 'Rosa Seco'],
      stock_quantity: 65,
      is_featured: true,
      is_active: true,
      image_url: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&q=80&w=600',
    },
    {
      id: 'prod-002',
      name: 'Macacão Canelado com Zíper Duplo Soft',
      price: 69.90,
      promotional_price: 59.90,
      description: 'Zíper de abertura nos dois sentidos facilita troca de fralda sem despir o bebê.',
      material: 'Ribana Canelada Premium com Elastano',
      sizes: ['RN', 'P', 'M', 'G', 'GG'],
      colors: ['Verde Menta', 'Caramelo', 'Off-White'],
      stock_quantity: 48,
      is_featured: true,
      is_active: true,
      image_url: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&q=80&w=600',
    },
    {
      id: 'prod-003',
      name: 'Saída de Maternidade Tricot Luxo Realeza (4 Peças)',
      price: 169.90,
      description: 'Acompanha macacão em tricot trançado, manta coordenada, body bordado e par de luvas.',
      material: 'Tricot Antialérgico Fio Soft',
      sizes: ['RN', 'P'],
      colors: ['Vermelho Proteção', 'Azul Sereno', 'Branco Paz'],
      stock_quantity: 25,
      is_featured: true,
      is_active: true,
      image_url: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&q=80&w=600',
    },
    {
      id: 'prod-004',
      name: 'Kit Berço Algodão 400 Fios Trança Nuvem',
      price: 259.90,
      description: 'Protetores laterais em trança escandinava, lençol com elástico e fronha envelope.',
      material: 'Percal 400 Fios Acetinado',
      sizes: ['Padrão Americano'],
      colors: ['Cinza & Branco', 'Rosa Bebê & Branco'],
      stock_quantity: 18,
      is_featured: true,
      is_active: true,
      image_url: 'https://images.unsplash.com/photo-1584839617966-22442db34b9d?auto=format&fit=crop&q=80&w=600',
    },
    {
      id: 'prod-005',
      name: 'Mala Maternidade Térmica Master Impermeável',
      price: 199.90,
      description: 'Espaço amplo com divisórias inteligentes, bolso frontal térmico para mamadeiras e alça tiracolo.',
      material: 'Couro Ecológico Impermeável',
      sizes: ['Grande 45x35x18cm'],
      colors: ['Azul Marinho', 'Rosa Blush', 'Nude'],
      stock_quantity: 30,
      is_featured: true,
      is_active: true,
      image_url: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=600',
    },
  ],
  tickets: [],
  flows: [
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
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'flow-pitoco-002',
      name: 'Consultoria VIP de Enxoval & Agendamento Exclusivo',
      description: 'Fluxo especializado para captação e reserva de consultorias personalizadas com consultora de bebês.',
      status: 'published',
      is_active: true,
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
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  ],
  users: [
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
      username: 'admin', // APENAS LETRAS
      password: '123456', // APENAS NÚMEROS
      role: 'admin',
      store_id: null,
      store_name: 'Toda a Rede (Global)',
      status: 'active',
      created_at: new Date().toISOString(),
    },
    {
      id: 'user-mgr-1',
      name: 'Juliana Paes (Gerente Matriz)',
      username: 'gerente', // APENAS LETRAS
      password: '123456', // APENAS NÚMEROS
      role: 'manager',
      store_id: 'store-001',
      store_name: 'Loja Matriz — Centro',
      status: 'active',
      created_at: new Date().toISOString(),
    },
    {
      id: 'user-att-1',
      name: 'Sofia Alencar (Consultora VIP)',
      username: 'consultora', // APENAS LETRAS
      password: '123456', // APENAS NÚMEROS
      role: 'attendant',
      store_id: 'store-001',
      store_name: 'Loja Matriz — Centro',
      status: 'active',
      created_at: new Date().toISOString(),
    },
  ],
};

class DbManager {
  constructor() {
    this.data = this.load();
    this.syncFromSupabase();
  }

  load() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf8');
        const parsed = JSON.parse(raw);
        return {
          botConfig: { ...defaultDb.botConfig, ...(parsed.botConfig || {}) },
          stores: Array.isArray(parsed.stores) && parsed.stores.length > 0 ? parsed.stores : defaultDb.stores,
          products: Array.isArray(parsed.products) && parsed.products.length > 0 ? parsed.products : defaultDb.products,
          tickets: Array.isArray(parsed.tickets) ? parsed.tickets : defaultDb.tickets,
          flows: Array.isArray(parsed.flows) && parsed.flows.length > 0 ? parsed.flows : defaultDb.flows,
          users: Array.isArray(parsed.users) && parsed.users.length > 0 ? parsed.users : defaultDb.users,
        };
      }
    } catch (e) {
      console.warn('Erro ao carregar DB local, usando padrão:', e.message);
    }
    this.save(defaultDb);
    return JSON.parse(JSON.stringify(defaultDb));
  }

  save(newData = null) {
    try {
      if (newData) this.data = newData;
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (e) {
      console.error('Erro ao salvar DB local:', e);
    }
  }

  async syncFromSupabase() {
    if (!supabase) return;
    try {
      const { data: dbStores } = await supabase.from('stores').select('*');
      if (dbStores && dbStores.length > 0) {
        this.data.stores = dbStores;
      }
      const { data: dbProds } = await supabase.from('products').select('*');
      if (dbProds && dbProds.length > 0) {
        this.data.products = dbProds;
      }
      const { data: dbConfig } = await supabase.from('bot_config').select('*').maybeSingle();
      if (dbConfig) {
        this.data.botConfig = { ...this.data.botConfig, ...dbConfig };
      }
      this.save();
      console.log('🔄 [DB] Sincronização com Supabase concluída!');
    } catch (e) {
      // Non-blocking fallback
    }
  }

  getStores() { return this.data.stores || []; }
  saveStore(store) {
    const stores = this.getStores();
    const idx = stores.findIndex(s => s.id === store.id || s.slug === store.slug);
    const updated = {
      id: store.id || `store-${Date.now()}`,
      slug: store.slug || `loja-${Date.now()}`,
      name: store.name || 'Nova Loja',
      address: store.address || '',
      phone: store.phone || '',
      whatsapp_number: store.whatsapp_number || store.phone || '',
      is_active: store.is_active !== false,
      business_hours: store.business_hours || '09:00 às 19:00',
      city: store.city || 'Recife - PE',
      monthly_revenue: store.monthly_revenue || 0,
      active_chats: store.active_chats || 0,
      ...store,
    };
    if (idx >= 0) stores[idx] = updated;
    else stores.push(updated);
    this.save();

    if (supabase) {
      supabase.from('stores').upsert([updated]).catch(() => {});
    }
    return updated;
  }
  deleteStore(id) {
    this.data.stores = this.getStores().filter(s => s.id !== id && s.slug !== id);
    this.save();
    if (supabase) {
      supabase.from('stores').delete().eq('id', id).catch(() => {});
    }
    return true;
  }

  getProducts() { return this.data.products || []; }
  saveProduct(prod) {
    const products = this.getProducts();
    const idx = products.findIndex(p => p.id === prod.id);
    const updated = {
      id: prod.id || `prod-${Date.now()}`,
      name: prod.name || 'Novo Produto',
      price: parseFloat(prod.price) || 49.90,
      promotional_price: prod.promotional_price ? parseFloat(prod.promotional_price) : null,
      description: prod.description || '',
      material: prod.material || 'Algodão Suedine 100%',
      sizes: prod.sizes || ['RN', 'P', 'M', 'G', 'GG'],
      colors: prod.colors || ['Branco Puro', 'Azul Bebê'],
      stock_quantity: parseInt(prod.stock_quantity ?? 50),
      is_featured: Boolean(prod.is_featured),
      is_active: prod.is_active !== false,
      image_url: prod.image_url || '',
      category_name: prod.category_name || 'Roupas & Enxovais',
      ...prod,
    };
    if (idx >= 0) products[idx] = updated;
    else products.unshift(updated);
    this.save();

    if (supabase) {
      supabase.from('products').upsert([{
        id: updated.id,
        name: updated.name,
        description: updated.description,
        price: updated.price,
        promotional_price: updated.promotional_price,
        sizes: updated.sizes,
        colors: updated.colors,
        stock_quantity: updated.stock_quantity,
        is_featured: updated.is_featured,
        is_active: updated.is_active,
        material: updated.material,
        image_url: updated.image_url,
      }]).catch(() => {});
    }
    return updated;
  }
  deleteProduct(id) {
    this.data.products = this.getProducts().filter(p => p.id !== id);
    this.save();
    if (supabase) {
      supabase.from('products').delete().eq('id', id).catch(() => {});
    }
    return true;
  }

  getBotConfig() { return this.data.botConfig || defaultDb.botConfig; }
  saveBotConfig(newConfig) {
    this.data.botConfig = { ...this.getBotConfig(), ...newConfig };
    this.save();
    if (supabase) {
      supabase.from('bot_config').upsert([{
        id: 'default',
        ...this.data.botConfig,
        updated_at: new Date().toISOString(),
      }]).catch(() => {});
    }
    return this.data.botConfig;
  }

  getTickets() { return this.data.tickets || []; }
  saveTicket(ticket) {
    const tickets = this.getTickets();
    const idx = tickets.findIndex(t => t.id === ticket.id || t.protocol === ticket.protocol);
    const updated = {
      id: ticket.id || `ticket-${Date.now()}`,
      protocol: ticket.protocol || `PTC-${Date.now().toString().slice(-6)}`,
      created_at: ticket.created_at || new Date().toISOString(),
      status: ticket.status || 'open',
      priority: ticket.priority || 'high',
      ...ticket,
    };
    if (idx >= 0) tickets[idx] = updated;
    else tickets.unshift(updated);
    this.save();

    if (supabase) {
      supabase.from('support_tickets').upsert([updated]).catch(() => {});
    }
    return updated;
  }

  // FLOWS
  getFlows() { return this.data.flows || defaultDb.flows; }
  saveFlow(flow) {
    const flows = this.getFlows();
    const idx = flows.findIndex(f => f.id === flow.id);
    const updated = {
      id: flow.id || `flow-${Date.now()}`,
      name: flow.name || 'Novo Fluxo',
      description: flow.description || '',
      status: flow.status || 'published',
      is_active: flow.is_active !== undefined ? flow.is_active : true,
      version: flow.version || 1,
      node_count: flow.steps ? flow.steps.length : (flow.node_count || 4),
      trigger_type: flow.trigger_type || 'Qualquer Mensagem Recebida',
      store_id: flow.store_id || null,
      store_name: flow.store_name || (flow.store_id ? 'Filial Vinculada' : 'Toda a Rede'),
      steps: flow.steps || [],
      created_at: flow.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...flow,
    };
    if (idx >= 0) flows[idx] = updated;
    else flows.unshift(updated);
    this.save();
    return updated;
  }
  deleteFlow(id) {
    this.data.flows = this.getFlows().filter(f => f.id !== id);
    this.save();
    return true;
  }
  toggleFlowStatus(id) {
    const flows = this.getFlows();
    const target = flows.find(f => f.id === id);
    if (target) {
      target.is_active = !target.is_active;
      target.status = target.is_active ? 'published' : 'paused';
      target.updated_at = new Date().toISOString();
      this.save();
      return target;
    }
    return null;
  }

  // ACESSO / USUÁRIOS (REGRA: Usuário APENAS LETRAS / Senha APENAS NÚMEROS)
  getUsers() { return this.data.users || defaultDb.users; }
  saveUser(user) {
    const cleanUsername = (user.username || '').trim().toLowerCase();
    if (!cleanUsername || !/^[a-zA-Z]+$/.test(cleanUsername)) {
      throw new Error('O nome de usuário deve conter exclusivamente letras (sem números, espaços ou símbolos).');
    }
    let cleanPass = user.password;
    if (cleanPass !== undefined && cleanPass !== '') {
      cleanPass = String(cleanPass).trim();
      if (!/^[0-9]+$/.test(cleanPass)) {
        throw new Error('A senha de acesso deve conter exclusivamente dígitos numéricos (sem letras ou símbolos).');
      }
    }
    const users = this.getUsers();
    const idx = users.findIndex(u => u.id === user.id || u.username.toLowerCase() === cleanUsername);
    const updated = {
      id: user.id || `user-${Date.now()}`,
      name: user.name || cleanUsername,
      username: cleanUsername,
      password: cleanPass || (idx >= 0 ? users[idx].password : '123456'),
      role: user.role || 'attendant',
      store_id: user.store_id || null,
      store_name: user.store_name || (user.store_id ? 'Filial Vinculada' : 'Toda a Rede (Global)'),
      status: user.status || 'active',
      created_at: user.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    if (idx >= 0) users[idx] = updated;
    else users.push(updated);
    this.save();
    return updated;
  }
  deleteUser(id) {
    this.data.users = this.getUsers().filter(u => u.id !== id && u.username !== id);
    this.save();
    return true;
  }
  toggleUserStatus(id) {
    const users = this.getUsers();
    const target = users.find(u => u.id === id || u.username === id);
    if (target) {
      target.status = target.status === 'active' ? 'inactive' : 'active';
      target.updated_at = new Date().toISOString();
      this.save();
      return target;
    }
    return null;
  }
  authenticate(username, password) {
    const cleanUser = String(username || '').trim().toLowerCase();
    const cleanPass = String(password || '').trim();

    if (!cleanUser || !/^[a-zA-Z]+$/.test(cleanUser)) {
      return { success: false, error: 'Usuário deve conter apenas letras.' };
    }
    if (!cleanPass || !/^[0-9]+$/.test(cleanPass)) {
      return { success: false, error: 'Senha deve conter apenas números.' };
    }

    const users = this.getUsers();
    const matched = users.find(u => u.username.toLowerCase() === cleanUser);
    if (matched) {
      if (matched.status === 'inactive') {
        return { success: false, error: 'Acesso bloqueado ou inativo.' };
      }
      if (matched.password === cleanPass) {
        return { success: true, user: matched };
      }
      return { success: false, error: 'Senha incorreta.' };
    }

    // Default Fallbacks
    if ((cleanUser === 'ceo' || cleanUser === 'malaca') && (cleanPass === '123456' || cleanPass === '199425')) {
      return { success: true, user: { id: 'user-ceo', username: cleanUser, name: 'Malaca CEO', role: 'ceo' } };
    }
    if (cleanUser === 'admin' && (cleanPass === '123456' || cleanPass === '1234')) {
      return { success: true, user: { id: 'user-admin', username: 'admin', name: 'Administrador Geral', role: 'admin' } };
    }
    if (cleanUser === 'gerente' && (cleanPass === '123456' || cleanPass === '1234')) {
      return { success: true, user: { id: 'user-mgr-1', username: 'gerente', name: 'Juliana Gerente', role: 'manager' } };
    }
    if ((cleanUser === 'consultora' || cleanUser === 'sofia') && (cleanPass === '123456' || cleanPass === '1234')) {
      return { success: true, user: { id: 'user-att-1', username: cleanUser, name: 'Sofia Consultora', role: 'attendant' } };
    }

    return { success: false, error: 'Usuário ou senha inválidos.' };
  }
}

const db = new DbManager();

// ==============================================================================
// 2. EXPRESS SETUP & ENDPOINTS
// ==============================================================================
const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Servir arquivos estáticos do dist (Frontend compilado)
const distPath = path.resolve(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
}

// In-memory bot sessions per phone
const clientSessions = new Map();

// WhatsApp state
let sock = null;
let currentQR = null;
let currentQRDataUrl = null;
let connectionStatus = 'disconnected'; // 'disconnected' | 'connecting' | 'qrcode' | 'connected'
let connectedPhone = null;
let connectedName = null;
let connectedAt = null;

// ==============================================================================
// 3. BAILEYS WHATSAPP ENGINE
// ==============================================================================
async function startWhatsApp() {
  try {
    connectionStatus = 'connecting';
    console.log('🔄 [Baileys] Inicializando cliente WhatsApp para Pitoco de Gente...');
    
    const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
    const { version, isLatest } = await fetchLatestBaileysVersion().catch(() => ({ version: [2, 3000, 1015901307], isLatest: false }));
    console.log(`📡 [Baileys] Versão: ${version.join('.')} (Última: ${isLatest})`);

    sock = makeWASocket({
      version,
      auth: state,
      printQRInTerminal: true,
      logger: pino({ level: 'silent' }),
      browser: ['Pitoco de Gente', 'Chrome', '120.0.0'],
      syncFullHistory: false,
      connectTimeoutMs: 60000,
      keepAliveIntervalMs: 30000,
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        currentQR = qr;
        connectionStatus = 'qrcode';
        try {
          currentQRDataUrl = await QRCode.toDataURL(qr, { margin: 2, scale: 8 });
        } catch (e) {}
        console.log('📱 [Baileys] Novo QR Code gerado pronto para leitura!');
      }

      if (connection === 'close') {
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
        console.log(`⚠️ [Baileys] Conexão encerrada (${statusCode}). Reconectar? ${shouldReconnect}`);
        
        connectionStatus = 'disconnected';
        currentQR = null;
        currentQRDataUrl = null;

        if (shouldReconnect) {
          setTimeout(startWhatsApp, 5000);
        }
      } else if (connection === 'open') {
        connectionStatus = 'connected';
        currentQR = null;
        currentQRDataUrl = null;
        connectedAt = new Date().toISOString();
        
        const rawId = sock.user?.id || '';
        connectedPhone = rawId.split(':')[0] || rawId.split('@')[0] || '';
        connectedName = sock.user?.name || 'Pitoco de Gente WhatsApp';
        console.log(`✅ [Baileys] Conectado com sucesso! WhatsApp: ${connectedPhone} (${connectedName})`);
      }
    });

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
      if (type !== 'notify') return;

      for (const msg of messages) {
        if (!msg.message || msg.key.fromMe) continue;

        const remoteJid = msg.key.remoteJid || '';
        if (remoteJid.includes('@g.us')) continue; // Ignore groups

        const clientPhone = remoteJid.replace('@s.whatsapp.net', '').replace(/\D/g, '');
        const clientName = msg.pushName || 'Cliente Pitoco';
        
        const text = msg.message.conversation || 
                     msg.message.extendedTextMessage?.text || 
                     msg.message.buttonsResponseMessage?.selectedButtonId ||
                     msg.message.templateButtonReplyMessage?.selectedId ||
                     '';

        console.log(`📩 [WhatsApp Recebido] De: ${clientPhone} (${clientName}) -> "${text}"`);

        await recordMessageInSupabase({
          phone: clientPhone,
          name: clientName,
          direction: 'inbound',
          content: text,
        });

        await handleBotFlow(clientPhone, clientName, text, remoteJid);
      }
    });

  } catch (err) {
    console.error('❌ [Baileys] Erro ao iniciar socket:', err);
    connectionStatus = 'error';
    setTimeout(startWhatsApp, 10000);
  }
}

// Bot logic & state machine utilizando o DB em tempo real
async function handleBotFlow(phone, clientName, incomingText, remoteJid) {
  const clean = incomingText.trim();
  const lower = clean.toLowerCase();
  const config = db.getBotConfig();
  const activeProducts = db.getProducts().filter(p => p.is_active !== false);
  const activeStores = db.getStores().filter(s => s.is_active !== false);

  let session = clientSessions.get(phone) || { step: 'IDLE' };

  if (clean === '0' || lower === 'menu' || lower === 'oi' || lower === 'olá' || session.step === 'IDLE') {
    session = { step: 'MAIN_MENU' };
    clientSessions.set(phone, session);

    const welcomeHeader = config.welcome_message.replace('{clientName}', clientName);
    const welcome = 
      `${welcomeHeader}\n\n` +
      `Digite o número da opção desejada:\n\n` +
      `1️⃣ *Ver Catálogo de Produtos* (${activeProducts.length} itens disponíveis)\n` +
      `2️⃣ *Guia de Medidas* (Tamanhos RN a 3 anos com peso e altura)\n` +
      `3️⃣ *Checklist da Mala de Maternidade*\n` +
      `4️⃣ *Consultoria VIP de Enxoval* (Agendamento personalizado)\n` +
      `5️⃣ *Cálculo de Frete & Entrega* (Motoboy / Correios / Retirada)\n` +
      `6️⃣ *Pagamento via PIX* (Chave & QR Code Copia e Cola)\n` +
      `7️⃣ *Falar com Atendente Humana* (${activeStores.length} lojas disponíveis)\n\n` +
      `_Responda apenas com o número de 1 a 7._`;

    await sendWhatsAppMessage(remoteJid, welcome);
    return;
  }

  // If conversation is already waiting for human, don't interrupt
  if (session.step === 'WAITING_HUMAN') {
    return;
  }

  if (session.step === 'MAIN_MENU') {
    if (clean === '1') {
      session.step = 'CATALOG';
      clientSessions.set(phone, session);

      let catText = `🛍️ *CATÁLOGO OFICIAL PITOCO DE GENTE*\n_Produtos atualizados em tempo real do nosso acervo:_\n\n`;
      activeProducts.slice(0, 8).forEach((p, idx) => {
        const preco = (p.promotional_price || p.price).toFixed(2).replace('.', ',');
        catText += `${idx + 1}. *${p.name}* — R$ ${preco}\n`;
      });
      catText += `\n_Digite o número de um produto para ver fotos e detalhes, ou digite *0* para voltar ao Menu._`;

      await sendWhatsAppMessage(remoteJid, catText);
      return;
    } else if (clean === '2') {
      const med = 
        `📏 *GUIA DE MEDIDAS OFICIAL PITOCO DE GENTE*\n\n` +
        `▫️ *RN*: 0 a 1 mês | 2,5 a 4 kg | até 52 cm\n` +
        `▫️ *P*: 1 a 3 meses | 4 a 6 kg | 52 a 62 cm\n` +
        `▫️ *M*: 3 a 6 meses | 6 a 8 kg | 62 a 67 cm\n` +
        `▫️ *G*: 6 a 9 meses | 8 a 9,5 kg | 67 a 72 cm\n` +
        `▫️ *GG*: 9 a 12 meses | 9,5 a 11 kg | 72 a 77 cm\n` +
        `▫️ *1 ano*: 12 a 18 meses | 11 a 12,5 kg | 77 a 82 cm\n` +
        `▫️ *2 anos*: 18 a 24 meses | 12,5 a 14 kg | 82 a 88 cm\n` +
        `▫️ *3 anos*: 2 a 3 anos | 14 a 16 kg | 88 a 98 cm\n\n` +
        `_Digite *0* para voltar ao Menu._`;
      await sendWhatsAppMessage(remoteJid, med);
      return;
    } else if (clean === '3') {
      const mala = 
        `🧳 *CHECKLIST ESSENCIAL DA MALA DE MATERNIDADE*\n\n` +
        `Para o hospital (organize na 32ª semana):\n` +
        `✅ 6 Bodies em suedine 100%\n` +
        `✅ 6 Macacões com zíper duplo frontal\n` +
        `✅ 2 Saídas de Maternidade em tricot luxo\n` +
        `✅ 6 Paninhos de boca atoalhados bordados\n` +
        `✅ 3 Pares de meias e luvinhas\n` +
        `✅ 2 Touquinhas macias\n` +
        `✅ 1 Manta quentinha antialérgica\n\n` +
        `_Digite *0* para voltar ao Menu._`;
      await sendWhatsAppMessage(remoteJid, mala);
      return;
    } else if (clean === '4') {
      session.step = 'CONSULTORIA';
      clientSessions.set(phone, session);
      const cons = 
        `👑 *CONSULTORIA VIP DE ENXOVAL*\n\n` +
        `Nossa especialista prepara o enxoval completo do seu bebê!\n` +
        `Como deseja ser atendida?\n\n` +
        `1️⃣ Online (Vídeo / WhatsApp)\n` +
        `2️⃣ Presencial na Loja Física\n\n` +
        `_Digite 1 ou 2, ou *0* para voltar._`;
      await sendWhatsAppMessage(remoteJid, cons);
      return;
    } else if (clean === '5') {
      const motoboy = (config.shipping_motoboy_price || 15).toFixed(2).replace('.', ',');
      const correios = (config.shipping_correios_price || 24.90).toFixed(2).replace('.', ',');
      const freeLimit = (config.free_shipping_threshold || 250).toFixed(2).replace('.', ',');
      const frete = 
        `🚚 *OPÇÕES DE ENTREGA & FRETE PITOCO DE GENTE*\n\n` +
        `🛵 *Motoboy Express*: R$ ${motoboy} (Grátis acima de R$ ${freeLimit})\n` +
        `📦 *Correios SEDEX / PAC*: R$ ${correios}\n` +
        `🏬 *Retirada Grátis em Loja*: Em qualquer uma das nossas filiais físicas!\n\n` +
        `_Digite *0* para voltar ao Menu._`;
      await sendWhatsAppMessage(remoteJid, frete);
      return;
    } else if (clean === '6') {
      const pixKey = config.pix_key || 'financeiro@pitocodegente.com.br';
      const pixName = config.pix_name || 'Pitoco de Gente Artigos Infantis LTDA';
      const pix = 
        `💳 *PAGAMENTO VIA PIX OFICIAL*\n\n` +
        `Chave PIX: *${pixKey}*\n` +
        `Favorecido: *${pixName}*\n` +
        `Cidade: *${config.pix_city || 'Recife'}*\n\n` +
        `📋 *Código Copia e Cola:*\n` +
        `\`\`\`00020126580014BR.GOV.BCB.PIX0136${pixKey}5204000053039865802BR5925Pitoco de Gente Artigos6006Recife62070503***6304\`\`\`\n\n` +
        `_Após a transferência, envie o comprovante por aqui!_`;
      await sendWhatsAppMessage(remoteJid, pix);
      return;
    } else if (clean === '7') {
      session.step = 'HANDOFF_STORE';
      clientSessions.set(phone, session);

      let handoff = `👩‍💼 *ATENDIMENTO HUMANO — ESCOLHA SUA LOJA*\n\n`;
      activeStores.forEach((st, idx) => {
        handoff += `${idx + 1}️⃣ *${st.name}* (${st.address || st.business_hours})\n`;
      });
      handoff += `\n_Digite o número correspondente à filial desejada:_`;

      await sendWhatsAppMessage(remoteJid, handoff);
      return;
    }
  }

  // Sub-menu Catálogo: Detalhes de um produto
  if (session.step === 'CATALOG') {
    const prodIdx = parseInt(clean) - 1;
    if (!isNaN(prodIdx) && activeProducts[prodIdx]) {
      const p = activeProducts[prodIdx];
      const preco = (p.promotional_price || p.price).toFixed(2).replace('.', ',');
      const desc = 
        `✨ *${p.name.toUpperCase()}*\n\n` +
        `💰 *Preço:* R$ ${preco}\n` +
        `🧵 *Tecido:* ${p.material || 'Algodão Nobre'}\n` +
        `📏 *Tamanhos:* ${(p.sizes || []).join(', ')}\n` +
        `🎨 *Cores:* ${(p.colors || []).join(', ')}\n` +
        `📦 *Estoque:* ${p.stock_quantity || 'Disponível'}\n\n` +
        `📝 ${p.description}\n\n` +
        `_Digite *1* para voltar ao Catálogo ou *0* para o Menu Principal._`;
      await sendWhatsAppMessage(remoteJid, desc);
      return;
    }
  }

  // Sub-menu Consultoria VIP
  if (session.step === 'CONSULTORIA') {
    if (clean === '1' || clean === '2') {
      const tipo = clean === '1' ? 'Online (Vídeo / WhatsApp)' : 'Presencial em Loja';
      session.step = 'WAITING_HUMAN';
      clientSessions.set(phone, session);

      const protocol = `VIP-${Date.now().toString().slice(-6)}`;
      const confirm = 
        `👑 *CONSULTORIA VIP SOLICITADA!*\n\n` +
        `Modalidade: *${tipo}*\n` +
        `Protocolo: *${protocol}*\n\n` +
        `Nossa consultora especialista em enxoval vai entrar em contato para agendar o melhor dia e horário para você! 💕`;
      await sendWhatsAppMessage(remoteJid, confirm);

      db.saveTicket({
        store_id: activeStores[0]?.id || 'store-001',
        phone,
        client_name: clientName,
        protocol,
        subject: `Consultoria VIP solicitada: ${tipo}`,
        status: 'open',
        priority: 'urgent',
      });
      return;
    }
  }

  // Sub-menu Handoff Loja
  if (session.step === 'HANDOFF_STORE') {
    const storeIdx = parseInt(clean) - 1;
    const chosenStore = (!isNaN(storeIdx) && activeStores[storeIdx]) ? activeStores[storeIdx] : null;

    if (chosenStore) {
      session.step = 'WAITING_HUMAN';
      session.storeId = chosenStore.id;
      session.storeName = chosenStore.name;
      clientSessions.set(phone, session);

      const protocol = `PTC-${Date.now().toString().slice(-6)}`;
      const confirm = 
        `✅ *TRANSFERÊNCIA REALIZADA!*\n\n` +
        `🏬 Loja Vinculada: *${chosenStore.name}*\n` +
        `📋 Protocolo: *${protocol}*\n\n` +
        `Uma consultora desta unidade já está com o seu atendimento em aberto e vai te responder aqui mesmo em instantes! 💕`;

      await sendWhatsAppMessage(remoteJid, confirm);

      db.saveTicket({
        store_id: chosenStore.id,
        phone,
        client_name: clientName,
        protocol,
        subject: `Atendimento WhatsApp solicitado para ${chosenStore.name}`,
        status: 'open',
        priority: 'high',
      });
      return;
    }
  }

  // Fallback
  await sendWhatsAppMessage(
    remoteJid, 
    `Opção não identificada. Digite *0* a qualquer momento para ver o Menu de opções.`
  );
}

// Disparo de mensagem no socket
async function sendWhatsAppMessage(jid, text) {
  try {
    if (!sock || connectionStatus !== 'connected') {
      console.warn('⚠️ WhatsApp não está conectado no momento. Mensagem guardada.');
      return false;
    }
    await sock.sendMessage(jid, { text });
    console.log(`📤 [WhatsApp Enviado] Para: ${jid} -> "${text.slice(0, 40)}..."`);
    return true;
  } catch (err) {
    console.error('❌ Falha ao enviar mensagem WhatsApp:', err);
    return false;
  }
}

// Salva histórico no Supabase
async function recordMessageInSupabase({ phone, name, direction, content }) {
  if (!supabase) return;
  try {
    const cleanPhone = String(phone).replace(/\D/g, '');
    const convId = `conv-${cleanPhone}`;

    await supabase.from('conversations').upsert([{
      id: convId,
      phone: cleanPhone,
      client_name: name,
      last_message: content,
      last_message_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }], { onConflict: 'id' }).catch(() => {});

    await supabase.from('chat_messages').insert([{
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      conversation_id: convId,
      direction,
      content,
      author_name: direction === 'inbound' ? name : 'Pitoco Bot',
      created_at: new Date().toISOString(),
    }]).catch(() => {});
  } catch (e) {}
}

// ==============================================================================
// 4. REST API ENDPOINTS — GERENCIAMENTO COMPLETO CEO / ADMIN & BOT
// ==============================================================================

// 1. GET / & GET /health
app.get('/', (req, res) => {
  res.json({
    app: 'Pitoco de Gente WhatsApp Bot API',
    version: '2.1.0',
    status: 'online',
    whatsapp: {
      status: connectionStatus,
      phone: connectedPhone,
      name: connectedName,
      connectedAt,
    },
    storesCount: db.getStores().length,
    productsCount: db.getProducts().length,
    docs: 'https://pitoco.malaca.com.br',
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    whatsapp_status: connectionStatus,
    storesCount: db.getStores().length,
    productsCount: db.getProducts().length,
  });
});

// 2. GET /api/data (Snapshot completo para o painel Admin)
app.get('/api/data', (req, res) => {
  res.json({
    success: true,
    stores: db.getStores(),
    products: db.getProducts(),
    botConfig: db.getBotConfig(),
    tickets: db.getTickets(),
    flows: db.getFlows(),
    users: db.getUsers(),
    whatsapp: {
      status: connectionStatus,
      phone: connectedPhone,
      name: connectedName,
    },
  });
});

// 3. PRODUTOS CRUD
app.get('/api/products', (req, res) => {
  res.json(db.getProducts());
});

app.post('/api/products', (req, res) => {
  try {
    const product = db.saveProduct(req.body);
    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/products/:id', (req, res) => {
  try {
    const product = db.saveProduct({ ...req.body, id: req.params.id });
    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/products/:id', (req, res) => {
  try {
    db.deleteProduct(req.params.id);
    res.json({ success: true, message: 'Produto excluído com sucesso' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. LOJAS CRUD
app.get('/api/stores', (req, res) => {
  res.json(db.getStores());
});

app.post('/api/stores', (req, res) => {
  try {
    const store = db.saveStore(req.body);
    res.json({ success: true, store });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/stores/:id', (req, res) => {
  try {
    const store = db.saveStore({ ...req.body, id: req.params.id });
    res.json({ success: true, store });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/stores/:id', (req, res) => {
  try {
    db.deleteStore(req.params.id);
    res.json({ success: true, message: 'Loja excluída com sucesso' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. BOT CONFIGURATION
app.get('/api/bot-config', (req, res) => {
  res.json({ success: true, config: db.getBotConfig() });
});

app.put('/api/bot-config', (req, res) => {
  try {
    const config = db.saveBotConfig(req.body);
    res.json({ success: true, config });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. TICKETS & ATENDIMENTO
app.get('/api/tickets', (req, res) => {
  res.json(db.getTickets());
});

app.post('/api/tickets', (req, res) => {
  try {
    const ticket = db.saveTicket(req.body);
    res.json({ success: true, ticket });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/tickets/:id', (req, res) => {
  try {
    const ticket = db.saveTicket({ ...req.body, id: req.params.id });
    res.json({ success: true, ticket });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7. FLUXOS DE ATENDIMENTO CRUD & TOGGLE
app.get('/api/flows', (req, res) => {
  res.json(db.getFlows());
});

app.post('/api/flows', (req, res) => {
  try {
    const flow = db.saveFlow(req.body);
    res.json({ success: true, flow });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/flows/:id', (req, res) => {
  try {
    const flow = db.saveFlow({ ...req.body, id: req.params.id });
    res.json({ success: true, flow });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.patch('/api/flows/:id/toggle', (req, res) => {
  try {
    const flow = db.toggleFlowStatus(req.params.id);
    if (!flow) return res.status(404).json({ success: false, error: 'Fluxo não encontrado' });
    res.json({ success: true, flow });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/flows/:id', (req, res) => {
  try {
    db.deleteFlow(req.params.id);
    res.json({ success: true, message: 'Fluxo excluído com sucesso' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 8. GERENCIAMENTO DE ACESSOS / USUÁRIOS (APENAS LETRAS / APENAS NÚMEROS)
app.get('/api/users', (req, res) => {
  res.json(db.getUsers());
});

app.post('/api/users', (req, res) => {
  try {
    const user = db.saveUser(req.body);
    res.json({ success: true, user });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.put('/api/users/:id', (req, res) => {
  try {
    const user = db.saveUser({ ...req.body, id: req.params.id });
    res.json({ success: true, user });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.patch('/api/users/:id/toggle', (req, res) => {
  try {
    const user = db.toggleUserStatus(req.params.id);
    if (!user) return res.status(404).json({ success: false, error: 'Usuário não encontrado' });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/users/:id', (req, res) => {
  try {
    db.deleteUser(req.params.id);
    res.json({ success: true, message: 'Usuário excluído com sucesso' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Autenticação Unificada por Usuário (letras) e Senha (números)
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  const result = db.authenticate(username, password);
  if (result.success) {
    res.json({ success: true, user: result.user });
  } else {
    res.status(401).json({ success: false, error: result.error });
  }
});

// 9. WHATSAPP BAILEYS CONTROLS
app.get('/api/whatsapp/qr', (req, res) => {
  res.json({
    status: connectionStatus,
    phone: connectedPhone,
    name: connectedName,
    connectedAt,
    qr: currentQR,
    qrDataUrl: currentQRDataUrl,
  });
});

app.post('/api/whatsapp/disconnect', async (req, res) => {
  try {
    if (sock) {
      await sock.logout().catch(() => {});
      sock = null;
    }
    connectionStatus = 'disconnected';
    currentQR = null;
    currentQRDataUrl = null;
    connectedPhone = null;
    res.json({ success: true, message: 'WhatsApp desconectado com sucesso' });
  } catch (err) {
    res.status(500).json({ success: false, error: err?.message || err });
  }
});

app.post('/api/send-message', async (req, res) => {
  const { phone, text, message } = req.body;
  const bodyText = text || message;

  if (!phone || !bodyText) {
    return res.status(400).json({ success: false, error: 'Campos phone e text são obrigatórios' });
  }

  const cleanPhone = String(phone).replace(/\D/g, '');
  const jid = `${cleanPhone}@s.whatsapp.net`;

  const success = await sendWhatsAppMessage(jid, bodyText);
  if (success) {
    return res.json({
      success: true,
      messageId: `msg-${Date.now()}`,
      status: 'sent',
      phone: cleanPhone,
    });
  } else {
    return res.status(500).json({
      success: false,
      error: 'Falha ao enviar mensagem. Verifique se o WhatsApp está conectado via QR Code.',
      whatsapp_status: connectionStatus,
    });
  }
});

// Inicia o servidor HTTP
app.listen(PORT, HOST, () => {
  console.log(`🚀 [Pitoco Backend] Servidor rodando em http://${HOST}:${PORT}`);
  startWhatsApp();
});
