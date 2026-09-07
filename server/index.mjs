import './websocketPolyfill.mjs';
import WebSocket from 'ws';

if (typeof globalThis !== 'undefined') {
  globalThis.WebSocket = WebSocket;
}
if (typeof global !== 'undefined') {
  global.WebSocket = WebSocket;
}

import express from 'express';
import cors from 'cors';
import { 
  makeWASocket, 
  useMultiFileAuthState, 
  DisconnectReason, 
  fetchLatestBaileysVersion 
} from '@whiskeysockets/baileys';
import pino from 'pino';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import QRCode from 'qrcode';
import { createClient } from '@supabase/supabase-js';
import { 
  executePublishedFlow, 
  loadDb, 
  saveDb, 
  getActiveFlowAndGraph,
  exportDatabase,
  importDatabase,
  getDatabaseStats
} from './flowRunner.mjs';
import { processAdminBotMessage } from './botEngine.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const AUTH_FOLDER = path.resolve(__dirname, 'whatsapp_auth');

if (!fs.existsSync(AUTH_FOLDER)) {
  fs.mkdirSync(AUTH_FOLDER, { recursive: true });
}

// Environment variables
const PORT = process.env.PORT || 8080;
const HOST = '0.0.0.0';
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://cbeiguyvoepbcafmxduy.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNiZWlndXl2b2VwYmNhZm14ZHV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3MzU5NzcsImV4cCI6MjEwNDMxMTk3N30.1XpWL6ns9NlPh4sQ3M8-OJTnKCPH-jf89iFspmBrKxM';

const supabaseServer = (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY)
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    })
  : null;

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Lojas oficiais Pitoco de Gente
const STORES = [
  {
    id: 'store-001',
    name: 'Loja Matriz — Centro',
    slug: 'matriz',
    address: 'Rua do Sol, 120 - Centro, Recife - PE',
    phone: '8132211000',
    whatsapp_number: '81996138924',
    is_active: true,
    business_hours: '08:30 às 18:30',
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
  },
];

const clientSessions = new Map();

let sock = null;
let currentQR = null;
let currentQRDataUrl = null;
let connectionStatus = 'disconnected';
let connectedPhone = null;
let connectedName = null;
let connectedAt = null;

async function startWhatsApp() {
  try {
    connectionStatus = 'connecting';
    console.log('🔄 [Server] Inicializando WhatsApp Baileys...');
    const { state, saveCreds } = await useMultiFileAuthState(AUTH_FOLDER);
    const { version, isLatest } = await fetchLatestBaileysVersion().catch(() => ({ version: [2, 3000, 1015901307], isLatest: false }));

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
        console.log('📱 [Server] Novo QR Code gerado.');
      }

      if (connection === 'close') {
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
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
        connectedName = sock.user?.name || 'Pitoco de Gente';
        console.log(`✅ [Server] WhatsApp Conectado: ${connectedPhone} (${connectedName})`);
      }
    });

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
      if (type !== 'notify') return;
      for (const msg of messages) {
        if (!msg.message || msg.key.fromMe) continue;
        const remoteJid = msg.key.remoteJid || '';
        if (remoteJid.includes('@g.us')) continue;

        const clientPhone = remoteJid.replace('@s.whatsapp.net', '').replace(/@lid$/, '').replace(/\D/g, '');
        const clientName = msg.pushName || 'Cliente Pitoco';
        const text = msg.message.conversation || 
                     msg.message.extendedTextMessage?.text || 
                     msg.message.buttonsResponseMessage?.selectedButtonId ||
                     msg.message.listResponseMessage?.singleSelectReply?.selectedRowId ||
                     '';

        console.log(`📩 [WhatsApp Recebido] ${clientPhone} (${clientName}) [${remoteJid}]: "${text}"`);
        await recordMessageLocallyAndSupabase(clientPhone, clientName, 'inbound', text);

        // Executar o fluxo publicado no Studio / Painel Admin
        try {
          console.log(`⚙️ [Flow Execution] Executando fluxo ativo no bot para ${clientPhone} (${clientName})...`);
          const replies = await executePublishedFlow(remoteJid, text, clientName, clientPhone);

          if (Array.isArray(replies) && replies.length > 0) {
            for (let i = 0; i < replies.length; i++) {
              const reply = replies[i];
              await sendBotReply(remoteJid, reply, msg);
              if (i < replies.length - 1) {
                await new Promise((r) => setTimeout(r, 600));
              }
            }
          } else {
            console.log(`ℹ️ [Flow Execution] Nenhum nó do fluxo respondeu, utilizando fallback padrão do painel`);
            const db = loadDb();
            const fallbackReply = await processAdminBotMessage(text, clientPhone, clientName, db);
            saveDb(db);
            if (fallbackReply) {
              await sendBotReply(remoteJid, fallbackReply, msg);
            }
          }
        } catch (botErr) {
          console.error(`❌ [Bot Engine Error] Erro ao processar mensagem para ${clientPhone}:`, botErr);
          try {
            const db = loadDb();
            const fallbackReply = await processAdminBotMessage(text, clientPhone, clientName, db);
            saveDb(db);
            if (fallbackReply) {
              await sendBotReply(remoteJid, fallbackReply, msg);
            }
          } catch (e2) {
            await sendBotReply(remoteJid, `Olá, *${clientName}*! Recebemos sua mensagem na *Pitoco de Gente*. Como podemos te ajudar? Digite *menu* para ver opções!`, msg);
          }
        }
      }
    });
  } catch (err) {
    console.error('❌ [Server] Erro ao iniciar Baileys:', err);
    connectionStatus = 'error';
  }
}

// Enviar resposta gerada pelo motor de fluxo (texto, botões ou mídia)
async function sendBotReply(remoteJid, reply, quotedMsg = null) {
  if (!sock || connectionStatus !== 'connected') {
    console.warn(`[SendReply] ⚠️ Baileys não conectado, não foi possível responder para ${remoteJid}`);
    return false;
  }

  const cleanPhone = remoteJid.replace('@s.whatsapp.net', '').replace(/@lid$/, '').replace(/\D/g, '');
  const sendOpts = quotedMsg ? { quoted: quotedMsg } : {};

  const trySendMessage = async (payload) => {
    try {
      await sock.sendMessage(remoteJid, payload, sendOpts);
      return true;
    } catch (err1) {
      console.warn(`[SendReply] Envio com quoted falhou (${err1?.message}), tentando sem quoted...`);
      try {
        await sock.sendMessage(remoteJid, payload);
        return true;
      } catch (err2) {
        console.error(`❌ [SendReply] Falha ao enviar para ${remoteJid}:`, err2?.message || err2);
        if (remoteJid.includes('@lid') && cleanPhone.length >= 10 && cleanPhone.length <= 13) {
          try {
            const fallbackJid = `${cleanPhone}@s.whatsapp.net`;
            await sock.sendMessage(fallbackJid, payload);
            console.log(`✅ [SendReply] Sucesso via fallback JID: ${fallbackJid}`);
            return true;
          } catch (err3) {
            console.error(`❌ [SendReply] Fallback JID falhou:`, err3?.message || err3);
          }
        }
        return false;
      }
    }
  };

  try {
    // 1. Resposta em Texto Puro
    if (typeof reply === 'string') {
      const ok = await trySendMessage({ text: reply });
      if (ok) {
        console.log(`✅ [WhatsApp Enviado] Texto para ${remoteJid}: "${reply.slice(0, 50).replace(/\n/g, ' ')}..."`);
        await recordMessageLocallyAndSupabase(cleanPhone, 'Pitoco Bot', 'outbound', reply);
      }
      return ok;
    }

    // 2. Resposta com Botões / Opções Interativas (com fallback amigável numerado)
    if (reply && reply.type === 'buttons') {
      const body = reply.body || 'Escolha uma das opções abaixo:';
      const footer = reply.footer || 'Pitoco de Gente • Atendimento Oficial';
      const buttons = reply.buttons || [];

      let formatted = `${body}\n\n`;
      buttons.forEach((btn, idx) => {
        const numEmoji = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'][idx] || `*${idx + 1}.*`;
        const title = btn.title || btn.id;
        formatted += `${numEmoji} ${title}\n`;
      });
      if (footer) {
        formatted += `\n_${footer}_\n_👉 Digite o número ou o nome da opção desejada._`;
      }

      const ok = await trySendMessage({ text: formatted });
      if (ok) {
        console.log(`✅ [WhatsApp Enviado] Menu (${buttons.length} opções) para ${remoteJid}`);
        await recordMessageLocallyAndSupabase(cleanPhone, 'Pitoco Bot', 'outbound', formatted);
      }
      return ok;
    }

    // 3. Resposta com Mídia (Imagem, Vídeo, Documento, Áudio)
    if (reply && reply.type === 'media') {
      const mediaType = reply.mediaType || 'image';
      const mediaUrl = reply.mediaUrl;
      const caption = reply.caption || '';
      let payload;

      if (mediaType === 'image') {
        payload = { image: { url: mediaUrl }, caption };
      } else if (mediaType === 'video') {
        payload = { video: { url: mediaUrl }, caption };
      } else if (mediaType === 'audio') {
        payload = { audio: { url: mediaUrl }, mimetype: 'audio/mp4', ptt: reply.isPtt !== false };
      } else {
        payload = { document: { url: mediaUrl }, mimetype: 'application/pdf', fileName: reply.fileName || 'documento.pdf', caption };
      }

      const ok = await trySendMessage(payload);
      if (ok) {
        console.log(`✅ [WhatsApp Enviado] Mídia (${mediaType}) para ${remoteJid}`);
        await recordMessageLocallyAndSupabase(cleanPhone, 'Pitoco Bot', 'outbound', caption || `[Arquivo ${mediaType}]`);
      }
      return ok;
    }

    return false;
  } catch (err) {
    console.error(`❌ [SendReply] Erro geral ao enviar resposta para ${remoteJid}:`, err);
    return false;
  }
}

async function sendWhatsAppMessage(jid, text, quotedMsg = null) {
  return sendBotReply(jid, text, quotedMsg);
}

async function recordMessageLocallyAndSupabase(phone, name, direction, content) {
  const cleanPhone = String(phone).replace(/\D/g, '');
  const convId = `conv-${cleanPhone}`;

  try {
    const db = loadDb();
    if (!db.conversations) db.conversations = {};
    if (!db.messages) db.messages = {};

    db.conversations[convId] = {
      id: convId,
      contact_name: name || 'Cliente WhatsApp',
      contact_phone: cleanPhone,
      phone: cleanPhone,
      last_message: content,
      last_message_at: new Date().toISOString(),
      status: db.conversations[convId]?.status || 'active',
      store_name: db.conversations[convId]?.store_name || 'Pitoco de Gente',
    };

    if (!db.messages[convId]) db.messages[convId] = [];
    db.messages[convId].push({
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      conversation_id: convId,
      direction,
      content,
      sender: direction === 'inbound' ? 'user' : 'bot',
      author_name: direction === 'inbound' ? (name || 'Cliente') : 'Pitoco Bot',
      created_at: new Date().toISOString(),
    });

    saveDb(db);
  } catch (err) {
    console.warn('[Storage] Erro ao salvar mensagem no db local:', err.message);
  }

  // Gravar no Supabase se configurado
  recordMessageInSupabase(cleanPhone, name, direction, content);
}

async function recordMessageInSupabase(phone, name, direction, content) {
  if (!supabaseServer) return;
  try {
    const cleanPhone = String(phone).replace(/\D/g, '');
    const convId = `conv-${cleanPhone}`;

    await supabaseServer.from('clients').upsert({
      id: `client-${cleanPhone}`,
      name: name || 'Cliente WhatsApp',
      phone: cleanPhone,
      last_interaction: new Date().toISOString(),
    }, { onConflict: 'phone' }).catch(() => {});

    await supabaseServer.from('conversations').upsert({
      id: convId,
      phone: cleanPhone,
      client_name: name || 'Cliente WhatsApp',
      last_message: content,
      last_message_at: new Date().toISOString(),
    }, { onConflict: 'id' }).catch(() => {});

    await supabaseServer.from('chat_messages').insert([{
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      conversation_id: convId,
      direction,
      content,
      author_name: direction === 'inbound' ? name : 'Pitoco Bot',
      created_at: new Date().toISOString(),
    }]).catch(() => {});
  } catch (e) {}
}

// Static files from dist if exists
const DIST_PATH = path.join(ROOT_DIR, 'dist');
if (fs.existsSync(DIST_PATH)) {
  app.use(express.static(DIST_PATH));
}

// REST Endpoints
app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

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

app.get('/api/whatsapp/status', (req, res) => {
  res.json({
    status: connectionStatus,
    phone: connectedPhone,
    name: connectedName,
    connectedAt,
    qr: currentQR,
    qrDataUrl: currentQRDataUrl,
  });
});

app.post('/api/whatsapp/qr', async (req, res) => {
  if (connectionStatus !== 'connected') startWhatsApp();
  res.json({ success: true, status: connectionStatus, qr: currentQR, qrDataUrl: currentQRDataUrl });
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

// ==============================================================================
// 1. CONFIGURAÇÕES & BOT PROFILE
// ==============================================================================
app.get('/api/bot-config', (req, res) => {
  try {
    const db = loadDb();
    res.json(db.botProfile || {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/bot-config', (req, res) => {
  try {
    const db = loadDb();
    db.botProfile = { ...(db.botProfile || {}), ...req.body };
    saveDb(db);
    res.json({ success: true, botProfile: db.botProfile });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/bot-config', (req, res) => {
  try {
    const db = loadDb();
    db.botProfile = { ...(db.botProfile || {}), ...req.body };
    saveDb(db);
    res.json({ success: true, botProfile: db.botProfile });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/settings', (req, res) => {
  try {
    const db = loadDb();
    res.json(db.settings || {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/settings', (req, res) => {
  try {
    const db = loadDb();
    db.settings = { ...(db.settings || {}), ...req.body, updated_at: new Date().toISOString() };
    saveDb(db);
    res.json({ success: true, settings: db.settings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/settings', (req, res) => {
  try {
    const db = loadDb();
    db.settings = { ...(db.settings || {}), ...req.body, updated_at: new Date().toISOString() };
    saveDb(db);
    res.json({ success: true, settings: db.settings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==============================================================================
// 2. MULTI-LOJAS CRUD
// ==============================================================================
app.get('/api/stores', (req, res) => {
  try {
    const db = loadDb();
    res.json(db.stores || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/stores/:id', (req, res) => {
  try {
    const db = loadDb();
    const id = req.params.id;
    const store = (db.stores || []).find(s => s.id === id || s.slug === id);
    if (!store) return res.status(404).json({ error: 'Loja não encontrada' });
    res.json(store);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/stores', (req, res) => {
  try {
    const db = loadDb();
    if (!db.stores) db.stores = [];
    const storeData = req.body;
    if (!storeData || (!storeData.id && !storeData.name)) {
      return res.status(400).json({ error: 'Dados da loja inválidos' });
    }

    const newStore = {
      id: storeData.id || `store-${Date.now()}`,
      slug: storeData.slug || `loja-${Date.now()}`,
      name: storeData.name || 'Nova Loja',
      address: storeData.address || '',
      phone: storeData.phone || '',
      whatsapp_number: storeData.whatsapp_number || storeData.phone || '',
      is_active: storeData.is_active !== false,
      business_hours: storeData.business_hours || '08:30 às 18:30',
      city: storeData.city || 'Recife - PE',
      monthly_revenue: Number(storeData.monthly_revenue) || 0,
      active_chats: Number(storeData.active_chats) || 0,
      manager_name: storeData.manager_name || 'Gerente',
      created_at: storeData.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...storeData,
    };

    const idx = db.stores.findIndex(s => s.id === newStore.id || s.slug === newStore.slug);
    if (idx >= 0) {
      db.stores[idx] = { ...db.stores[idx], ...newStore, updated_at: new Date().toISOString() };
    } else {
      db.stores.push(newStore);
    }

    saveDb(db);
    console.log(`[Stores API] 🏬 Loja salva: "${newStore.name}" (${newStore.id})`);
    res.json({ success: true, store: newStore });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/stores/:id', (req, res) => {
  try {
    const db = loadDb();
    const id = req.params.id;
    if (db.stores) {
      db.stores = db.stores.filter(s => s.id !== id && s.slug !== id);
    }
    saveDb(db);
    console.log(`[Stores API] 🗑️ Loja removida: ${id}`);
    res.json({ success: true, message: `Loja ${id} removida` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==============================================================================
// 3. CATEGORIAS DO CATÁLOGO CRUD
// ==============================================================================
app.get('/api/categories', (req, res) => {
  try {
    const db = loadDb();
    let categories = db.categories || [];
    if (req.query.store_id) {
      categories = categories.filter(c => !c.store_id || c.store_id === req.query.store_id);
    }
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/categories', (req, res) => {
  try {
    const db = loadDb();
    if (!db.categories) db.categories = [];
    const catData = req.body;
    const newCat = {
      id: catData.id || `cat-${Date.now()}`,
      name: catData.name || 'Nova Categoria',
      slug: catData.slug || `categoria-${Date.now()}`,
      description: catData.description || '',
      icon: catData.icon || 'tag',
      sort_order: Number(catData.sort_order) || db.categories.length + 1,
      is_active: catData.is_active !== false,
      created_at: catData.created_at || new Date().toISOString(),
      ...catData,
    };

    const idx = db.categories.findIndex(c => c.id === newCat.id || c.slug === newCat.slug);
    if (idx >= 0) {
      db.categories[idx] = { ...db.categories[idx], ...newCat };
    } else {
      db.categories.push(newCat);
    }

    saveDb(db);
    res.json({ success: true, category: newCat });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/categories/:id', (req, res) => {
  try {
    const db = loadDb();
    const id = req.params.id;
    if (db.categories) {
      db.categories = db.categories.filter(c => c.id !== id && c.slug !== id);
    }
    saveDb(db);
    res.json({ success: true, message: `Categoria ${id} removida` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==============================================================================
// 4. PRODUTOS DO CATÁLOGO DE BEBÊ CRUD
// ==============================================================================
app.get('/api/products', (req, res) => {
  try {
    const db = loadDb();
    let prods = db.products || [];
    const { store_id, category_id } = req.query;
    if (store_id) {
      prods = prods.filter(p => !p.store_id || p.store_id === store_id);
    }
    if (category_id) {
      prods = prods.filter(p => p.category_id === category_id);
    }
    res.json(prods);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/products/:id', (req, res) => {
  try {
    const db = loadDb();
    const prod = (db.products || []).find(p => p.id === req.params.id);
    if (!prod) return res.status(404).json({ error: 'Produto não encontrado' });
    res.json(prod);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/products', (req, res) => {
  try {
    const db = loadDb();
    if (!db.products) db.products = [];
    const prodData = req.body;
    if (!prodData || (!prodData.id && !prodData.name)) {
      return res.status(400).json({ error: 'Dados do produto inválidos' });
    }

    const newProd = {
      id: prodData.id || `prod-${Date.now()}`,
      category_id: prodData.category_id || 'cat-001',
      category_name: prodData.category_name || 'Roupas & Enxovais',
      name: prodData.name || 'Novo Produto',
      description: prodData.description || '',
      price: Number(prodData.price) || 49.90,
      promotional_price: prodData.promotional_price ? Number(prodData.promotional_price) : undefined,
      sizes: Array.isArray(prodData.sizes) ? prodData.sizes : ['RN', 'P', 'M'],
      colors: Array.isArray(prodData.colors) ? prodData.colors : ['Branco Puro', 'Azul Bebê'],
      stock_quantity: prodData.stock_quantity !== undefined ? Number(prodData.stock_quantity) : 50,
      is_featured: Boolean(prodData.is_featured),
      is_active: prodData.is_active !== false,
      material: prodData.material || 'Algodão Suedine 100%',
      image_url: prodData.image_url || '',
      store_id: prodData.store_id || null,
      created_at: prodData.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...prodData,
    };

    const idx = db.products.findIndex(p => p.id === newProd.id);
    if (idx >= 0) {
      db.products[idx] = { ...db.products[idx], ...newProd, updated_at: new Date().toISOString() };
    } else {
      db.products.unshift(newProd);
    }

    saveDb(db);
    console.log(`[Products API] 👶 Produto salvo: "${newProd.name}" (${newProd.id}) - R$ ${newProd.price}`);
    res.json({ success: true, product: newProd });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/products/:id', (req, res) => {
  try {
    const db = loadDb();
    const id = req.params.id;
    if (db.products) {
      db.products = db.products.filter(p => p.id !== id);
    }
    saveDb(db);
    console.log(`[Products API] 🗑️ Produto removido: ${id}`);
    res.json({ success: true, message: `Produto ${id} removido` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==============================================================================
// 5. CRM & CONTATOS DE CLIENTES CRUD
// ==============================================================================
app.get('/api/contacts', (req, res) => {
  try {
    const db = loadDb();
    let contacts = Object.values(db.contacts || {});
    if (req.query.store_id) {
      contacts = contacts.filter(c => !c.store_id || c.store_id === req.query.store_id);
    }
    res.json(contacts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/contacts', (req, res) => {
  try {
    const db = loadDb();
    if (!db.contacts) db.contacts = {};
    const contactData = req.body;
    const cleanPhone = String(contactData.phone || '').replace(/\D/g, '');
    if (!cleanPhone) {
      return res.status(400).json({ error: 'Telefone do contato é obrigatório' });
    }

    const newContact = {
      id: contactData.id || `client-${cleanPhone}`,
      phone: cleanPhone,
      name: contactData.name || 'Cliente WhatsApp',
      email: contactData.email || null,
      store_id: contactData.store_id || null,
      store_name: contactData.store_name || null,
      baby_name: contactData.baby_name || null,
      due_date: contactData.due_date || null,
      status: contactData.status || 'active',
      tags: Array.isArray(contactData.tags) ? contactData.tags : ['Cliente'],
      total_orders: Number(contactData.total_orders) || 0,
      total_spent: Number(contactData.total_spent) || 0,
      created_at: contactData.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...contactData,
    };

    db.contacts[cleanPhone] = newContact;
    saveDb(db);
    res.json({ success: true, contact: newContact });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/contacts/:id', (req, res) => {
  try {
    const db = loadDb();
    const id = req.params.id;
    const cleanPhone = id.replace(/\D/g, '');
    if (db.contacts && (db.contacts[id] || db.contacts[cleanPhone])) {
      delete db.contacts[id];
      delete db.contacts[cleanPhone];
    }
    saveDb(db);
    res.json({ success: true, message: `Contato ${id} removido` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==============================================================================
// 6. CONVERSAS & MENSAGENS DO ATENDIMENTO CRUD
// ==============================================================================
app.get('/api/conversations', (req, res) => {
  try {
    const db = loadDb();
    let convs = Object.values(db.conversations || {});
    if (req.query.store_id) {
      convs = convs.filter(c => !c.store_id || c.store_id === req.query.store_id);
    }
    res.json(convs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/conversations', (req, res) => {
  try {
    const db = loadDb();
    if (!db.conversations) db.conversations = {};
    const convData = req.body;
    const id = convData.id || `conv-${Date.now()}`;
    const newConv = {
      id,
      contact_name: convData.contact_name || 'Cliente',
      contact_phone: convData.contact_phone || '',
      phone: convData.phone || convData.contact_phone || '',
      status: convData.status || 'bot',
      unread_count: Number(convData.unread_count) || 0,
      created_at: convData.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...convData,
    };
    db.conversations[id] = newConv;
    saveDb(db);
    res.json({ success: true, conversation: newConv });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/conversations/:id', (req, res) => {
  try {
    const db = loadDb();
    const id = req.params.id;
    if (db.conversations && db.conversations[id]) {
      delete db.conversations[id];
    }
    if (db.messages && db.messages[id]) {
      delete db.messages[id];
    }
    saveDb(db);
    res.json({ success: true, message: `Conversa ${id} removida` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/conversations/:id/assign', (req, res) => {
  try {
    const db = loadDb();
    const id = req.params.id;
    if (!db.conversations || !db.conversations[id]) {
      return res.status(404).json({ error: 'Conversa não encontrada' });
    }
    const { attendant_id, attendant_name } = req.body;
    db.conversations[id].assigned_to = attendant_name;
    db.conversations[id].assigned_attendant_id = attendant_id;
    db.conversations[id].assigned_attendant_name = attendant_name;
    db.conversations[id].status = 'human';
    db.conversations[id].updated_at = new Date().toISOString();
    saveDb(db);
    res.json({ success: true, conversation: db.conversations[id] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/conversations/:id/transfer', (req, res) => {
  try {
    const db = loadDb();
    const id = req.params.id;
    if (!db.conversations || !db.conversations[id]) {
      return res.status(404).json({ error: 'Conversa não encontrada' });
    }
    const { store_id, store_name, attendant_id, attendant_name } = req.body;
    if (store_id) db.conversations[id].store_id = store_id;
    if (store_name) db.conversations[id].store_name = store_name;
    if (attendant_id) db.conversations[id].assigned_attendant_id = attendant_id;
    if (attendant_name) db.conversations[id].assigned_to = attendant_name;
    db.conversations[id].status = 'waiting_human';
    db.conversations[id].updated_at = new Date().toISOString();
    saveDb(db);
    res.json({ success: true, conversation: db.conversations[id] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/conversations/:id/messages', (req, res) => {
  try {
    const db = loadDb();
    const msgs = db.messages?.[req.params.id] || [];
    res.json(msgs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/conversations/:id/messages', (req, res) => {
  try {
    const db = loadDb();
    const convId = req.params.id;
    if (!db.messages) db.messages = {};
    if (!db.messages[convId]) db.messages[convId] = [];

    const msgData = req.body;
    const newMsg = {
      id: msgData.id || `msg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      conversation_id: convId,
      direction: msgData.direction || 'outbound',
      message_type: msgData.message_type || 'text',
      content: msgData.content || '',
      media_url: msgData.media_url,
      author_name: msgData.author_name || 'Atendente',
      status: msgData.status || 'delivered',
      created_at: msgData.created_at || new Date().toISOString(),
      ...msgData,
    };

    db.messages[convId].push(newMsg);
    if (db.conversations && db.conversations[convId]) {
      db.conversations[convId].last_message = newMsg.content;
      db.conversations[convId].last_message_at = newMsg.created_at;
      db.conversations[convId].updated_at = new Date().toISOString();
    }

    saveDb(db);
    res.json({ success: true, message: newMsg });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/conversations/:id/messages/:msgId', (req, res) => {
  try {
    const db = loadDb();
    const { id, msgId } = req.params;
    if (db.messages && db.messages[id]) {
      db.messages[id] = db.messages[id].filter(m => m.id !== msgId);
      saveDb(db);
    }
    res.json({ success: true, message: `Mensagem ${msgId} removida` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==============================================================================
// 7. TICKETS DE ATENDIMENTO DAS LOJAS CRUD
// ==============================================================================
app.get('/api/tickets', (req, res) => {
  try {
    const db = loadDb();
    let tickets = db.tickets || [];
    if (req.query.store_id) {
      tickets = tickets.filter(t => !t.store_id || t.store_id === req.query.store_id);
    }
    res.json(tickets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/tickets', (req, res) => {
  try {
    const db = loadDb();
    if (!db.tickets) db.tickets = [];
    const newTkt = {
      id: req.body.id || `tkt-${Date.now()}`,
      protocol: req.body.protocol || `PTC-${Date.now().toString().slice(-6)}`,
      status: 'open',
      priority: 'high',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...req.body,
    };
    db.tickets.unshift(newTkt);
    saveDb(db);
    res.json({ success: true, ticket: newTkt });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/tickets/:id', (req, res) => {
  try {
    const db = loadDb();
    if (!db.tickets) db.tickets = [];
    const idx = db.tickets.findIndex(t => t.id === req.params.id);
    if (idx >= 0) {
      db.tickets[idx] = { ...db.tickets[idx], ...req.body, updated_at: new Date().toISOString() };
      saveDb(db);
      return res.json({ success: true, ticket: db.tickets[idx] });
    }
    res.status(404).json({ error: 'Ticket não encontrado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/tickets/:id', (req, res) => {
  try {
    const db = loadDb();
    if (db.tickets) {
      db.tickets = db.tickets.filter(t => t.id !== req.params.id);
      saveDb(db);
    }
    res.json({ success: true, message: `Ticket ${req.params.id} removido` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==============================================================================
// 8. CONSULTORIAS VIP & AGENDAMENTOS CRUD
// ==============================================================================
app.get('/api/consultations', (req, res) => {
  try {
    const db = loadDb();
    let list = db.appointments || [];
    if (req.query.store_id) {
      list = list.filter(a => !a.store_id || a.store_id === req.query.store_id);
    }
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/consultations', (req, res) => {
  try {
    const db = loadDb();
    if (!db.appointments) db.appointments = [];
    const newCons = {
      id: req.body.id || `cons-${Date.now()}`,
      store_id: req.body.store_id || 'store-001',
      store_name: req.body.store_name || 'Loja Matriz — Centro',
      client_name: req.body.client_name || 'Cliente',
      client_phone: req.body.client_phone || '',
      consultation_type: req.body.consultation_type || 'online_whatsapp',
      consultation_date: req.body.consultation_date || new Date().toISOString().split('T')[0],
      consultation_time: req.body.consultation_time || '14:00',
      status: req.body.status || 'confirmed',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...req.body,
    };
    db.appointments.unshift(newCons);
    saveDb(db);
    res.json({ success: true, consultation: newCons });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/consultations/:id', (req, res) => {
  try {
    const db = loadDb();
    if (!db.appointments) db.appointments = [];
    const idx = db.appointments.findIndex(a => a.id === req.params.id);
    if (idx >= 0) {
      db.appointments[idx] = { ...db.appointments[idx], ...req.body, updated_at: new Date().toISOString() };
      saveDb(db);
      return res.json({ success: true, consultation: db.appointments[idx] });
    }
    res.status(404).json({ error: 'Consultoria não encontrada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/consultations/:id', (req, res) => {
  try {
    const db = loadDb();
    if (db.appointments) {
      db.appointments = db.appointments.filter(a => a.id !== req.params.id);
      saveDb(db);
    }
    res.json({ success: true, message: `Consultoria ${req.params.id} removida` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Alias appointments
app.get('/api/appointments', (req, res) => res.redirect('/api/consultations'));
app.post('/api/appointments', (req, res) => res.redirect(307, '/api/consultations'));

// ==============================================================================
// 9. AGENDA SETTINGS & SERVIÇOS
// ==============================================================================
app.get('/api/agenda-settings', (req, res) => {
  try {
    const db = loadDb();
    res.json(db.agendaSettings || {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/agenda-settings', (req, res) => {
  try {
    const db = loadDb();
    db.agendaSettings = { ...(db.agendaSettings || {}), ...req.body, updated_at: new Date().toISOString() };
    saveDb(db);
    res.json({ success: true, agendaSettings: db.agendaSettings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==============================================================================
// 10. GESTÃO E SINCRONIZAÇÃO DINÂMICA DE FLUXOS NO BOT
// ==============================================================================
app.get('/api/flows', (req, res) => {
  try {
    const db = loadDb();
    res.json(db.flows || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/flows/active/current', async (req, res) => {
  try {
    const db = loadDb();
    const { publishedFlow, nodes, edges } = await getActiveFlowAndGraph(db);
    res.json({
      activeFlow: publishedFlow,
      nodesCount: nodes ? nodes.length : 0,
      edgesCount: edges ? edges.length : 0,
      nodes: nodes || [],
      edges: edges || [],
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/flows/test-execution', async (req, res) => {
  try {
    const { phone, message, name } = req.body;
    const testPhone = String(phone || '558199999999').replace(/\D/g, '');
    const testName = name || 'Cliente Teste';
    const testText = message || 'oi';

    const replies = await executePublishedFlow(`${testPhone}@s.whatsapp.net`, testText, testName, testPhone);
    res.json({ success: true, input: testText, phone: testPhone, replies });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/flows/:id', (req, res) => {
  try {
    const db = loadDb();
    const flow = (db.flows || []).find(f => f.id === req.params.id);
    if (!flow) return res.status(404).json({ error: 'Fluxo não encontrado' });
    res.json(flow);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/flows', (req, res) => {
  try {
    const db = loadDb();
    if (!db.flows) db.flows = [];
    const flowData = req.body;
    if (!flowData || !flowData.id) {
      return res.status(400).json({ error: 'Dados do fluxo inválidos ou id ausente' });
    }

    const isPublishing = flowData.status === 'published' || flowData.is_active === true;
    if (isPublishing) {
      db.flows.forEach(f => {
        if (f.id !== flowData.id) {
          f.status = 'draft';
          f.is_active = false;
        }
      });
      flowData.status = 'published';
      flowData.is_active = true;
    }

    const idx = db.flows.findIndex(f => f.id === flowData.id);
    if (idx >= 0) {
      db.flows[idx] = { ...db.flows[idx], ...flowData, updated_at: new Date().toISOString() };
    } else {
      db.flows.unshift({ ...flowData, created_at: flowData.created_at || new Date().toISOString(), updated_at: new Date().toISOString() });
    }

    saveDb(db);
    console.log(`[Flows API] 💾 Fluxo salvo: "${flowData.name}" (${flowData.id}) - Status: ${flowData.status}`);
    res.json({ success: true, flow: flowData });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/flows/:id', (req, res) => {
  try {
    const db = loadDb();
    const id = req.params.id;
    if (db.flows) {
      db.flows = db.flows.filter(f => f.id !== id);
    }
    if (db.nodes && db.nodes[id]) {
      delete db.nodes[id];
    }
    if (db.edges && db.edges[id]) {
      delete db.edges[id];
    }
    saveDb(db);
    res.json({ success: true, message: `Fluxo ${id} removido` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/flows/:id/toggle', (req, res) => {
  try {
    const db = loadDb();
    const id = req.params.id;
    const flow = (db.flows || []).find(f => f.id === id);
    if (!flow) return res.status(404).json({ error: 'Fluxo não encontrado' });

    const newActive = !flow.is_active && flow.status !== 'published';
    if (newActive) {
      (db.flows || []).forEach(f => {
        if (f.id !== id) {
          f.status = 'draft';
          f.is_active = false;
        }
      });
      flow.status = 'published';
      flow.is_active = true;
    } else {
      flow.status = 'draft';
      flow.is_active = false;
    }
    flow.updated_at = new Date().toISOString();
    saveDb(db);
    console.log(`[Flows API] 🔄 Status alternado: "${flow.name}" (${id}) -> ${flow.status}`);
    res.json({ success: true, flow });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/whatsapp/flows/:id/publish', (req, res) => {
  try {
    const db = loadDb();
    const id = req.params.id;
    const flow = (db.flows || []).find(f => f.id === id);
    if (!flow) return res.status(404).json({ error: 'Fluxo não encontrado' });

    (db.flows || []).forEach(f => {
      if (f.id !== id) {
        f.status = 'draft';
        f.is_active = false;
      }
    });
    flow.status = 'published';
    flow.is_active = true;
    flow.updated_at = new Date().toISOString();
    saveDb(db);
    console.log(`[Flows API] 🚀 Fluxo publicado oficialmente no bot: "${flow.name}" (${id})`);
    res.json({ success: true, message: `Fluxo ${flow.name} publicado com sucesso no bot WhatsApp`, flow });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/whatsapp/sync-flows', (req, res) => {
  try {
    const db = loadDb();
    const { flows } = req.body;
    if (Array.isArray(flows) && flows.length > 0) {
      db.flows = flows;
      saveDb(db);
    }
    res.json({ success: true, count: db.flows?.length || 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/flows/:id/graph', (req, res) => {
  try {
    const db = loadDb();
    const id = req.params.id;
    const nodes = db.nodes?.[id] || [];
    const edges = db.edges?.[id] || [];
    res.json({ nodes, edges });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/flows/:id/graph', (req, res) => {
  try {
    const db = loadDb();
    const id = req.params.id;
    const { nodes, edges } = req.body;

    if (!db.nodes) db.nodes = {};
    if (!db.edges) db.edges = {};

    if (Array.isArray(nodes)) {
      db.nodes[id] = nodes;
    }
    if (Array.isArray(edges)) {
      db.edges[id] = edges;
    }

    if (db.flows) {
      const targetFlow = db.flows.find(f => f.id === id);
      if (targetFlow && Array.isArray(nodes)) {
        targetFlow.node_count = nodes.length;
        targetFlow.updated_at = new Date().toISOString();
      }
    }

    saveDb(db);
    console.log(`[Flows API] 🎨 Grafo gravado com sucesso para "${id}": ${nodes?.length || 0} nós, ${edges?.length || 0} edges`);
    res.json({ success: true, id, nodesCount: nodes?.length || 0, edgesCount: edges?.length || 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==============================================================================
// 11. GESTÃO DE ACESSOS & USUÁRIOS
// ==============================================================================
app.get('/api/users', (req, res) => {
  try {
    const db = loadDb();
    res.json(db.systemUsers || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/users', (req, res) => {
  try {
    const db = loadDb();
    if (!db.systemUsers) db.systemUsers = [];
    const userData = req.body;
    const rawUsername = (userData.username || '').trim().toLowerCase();

    const idx = db.systemUsers.findIndex(u => u.id === userData.id || u.username?.toLowerCase() === rawUsername);
    const updatedUser = {
      id: userData.id || `user-${Date.now()}`,
      name: userData.name || rawUsername,
      username: rawUsername,
      password: userData.password || (idx >= 0 ? db.systemUsers[idx].password : '123456'),
      role: userData.role || 'attendant',
      store_id: userData.store_id || null,
      store_name: userData.store_name || (userData.store_id ? 'Filial Vinculada' : 'Toda a Rede (Global)'),
      status: userData.status || 'active',
      created_at: userData.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...userData,
    };

    if (idx >= 0) {
      db.systemUsers[idx] = updatedUser;
    } else {
      db.systemUsers.push(updatedUser);
    }

    saveDb(db);
    res.json({ success: true, user: updatedUser });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/users/:id', (req, res) => {
  try {
    const db = loadDb();
    const id = req.params.id;
    if (db.systemUsers) {
      db.systemUsers = db.systemUsers.filter(u => u.id !== id && u.username !== id);
      saveDb(db);
    }
    res.json({ success: true, message: `Usuário ${id} removido` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/users/:id/toggle', (req, res) => {
  try {
    const db = loadDb();
    const id = req.params.id;
    const user = (db.systemUsers || []).find(u => u.id === id || u.username === id);
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });

    user.status = user.status === 'active' ? 'inactive' : 'active';
    user.updated_at = new Date().toISOString();
    saveDb(db);
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/login', (req, res) => {
  try {
    const { username, password } = req.body;
    const cleanUser = String(username || '').toLowerCase().trim();
    const cleanPass = String(password || '').trim();

    const db = loadDb();
    const users = db.systemUsers || [];
    const found = users.find(u => (u.username?.toLowerCase() === cleanUser) && (String(u.password) === cleanPass || String(u.pin) === cleanPass));
    
    // Master emergency logins
    if (found) {
      if (found.status === 'inactive') {
        return res.status(403).json({ success: false, error: 'Usuário inativo no momento.' });
      }
      return res.json({ success: true, user: found });
    }

    if ((cleanUser === 'admin' || cleanUser === 'ceo' || cleanUser === 'malaca') && (cleanPass === '1234' || cleanPass === '123456' || cleanPass === '199425')) {
      const userObj = { id: `user-${cleanUser}`, name: cleanUser.toUpperCase(), role: cleanUser === 'admin' ? 'admin' : 'ceo', username: cleanUser };
      return res.json({ success: true, user: userObj });
    }

    return res.status(401).json({ success: false, error: 'Usuário ou senha inválidos' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==============================================================================
// 12. ATENDENTES & RESPOSTAS RÁPIDAS
// ==============================================================================
app.get('/api/attendants', (req, res) => {
  try {
    const db = loadDb();
    res.json(db.attendants || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/attendants', (req, res) => {
  try {
    const db = loadDb();
    if (!db.attendants) db.attendants = [];
    const attData = req.body;
    const newAtt = {
      id: attData.id || `att-${Date.now()}`,
      created_at: new Date().toISOString(),
      ...attData,
    };
    const idx = db.attendants.findIndex(a => a.id === newAtt.id);
    if (idx >= 0) {
      db.attendants[idx] = { ...db.attendants[idx], ...newAtt };
    } else {
      db.attendants.push(newAtt);
    }
    saveDb(db);
    res.json({ success: true, attendant: newAtt });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/attendants/:id', (req, res) => {
  try {
    const db = loadDb();
    if (db.attendants) {
      db.attendants = db.attendants.filter(a => a.id !== req.params.id);
      saveDb(db);
    }
    res.json({ success: true, message: `Atendente ${req.params.id} removido` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/canned-replies', (req, res) => {
  try {
    const db = loadDb();
    res.json(db.cannedReplies || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/canned-replies', (req, res) => {
  try {
    const db = loadDb();
    if (!db.cannedReplies) db.cannedReplies = [];
    const replyData = req.body;
    const newReply = {
      id: replyData.id || `canned-${Date.now()}`,
      ...replyData,
    };
    const idx = db.cannedReplies.findIndex(r => r.id === newReply.id);
    if (idx >= 0) {
      db.cannedReplies[idx] = { ...db.cannedReplies[idx], ...newReply };
    } else {
      db.cannedReplies.push(newReply);
    }
    saveDb(db);
    res.json({ success: true, cannedReply: newReply });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/canned-replies/:id', (req, res) => {
  try {
    const db = loadDb();
    if (db.cannedReplies) {
      db.cannedReplies = db.cannedReplies.filter(r => r.id !== req.params.id);
      saveDb(db);
    }
    res.json({ success: true, message: `Resposta rápida ${req.params.id} removida` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==============================================================================
// 13. VARIÁVEIS CUSTOMIZADAS
// ==============================================================================
app.get('/api/custom-variables', (req, res) => {
  try {
    const db = loadDb();
    res.json(db.customVariables || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/custom-variables', (req, res) => {
  try {
    const db = loadDb();
    if (!db.customVariables) db.customVariables = [];
    const vData = req.body;
    const newV = {
      id: vData.id || `var-${Date.now()}`,
      ...vData,
    };
    const idx = db.customVariables.findIndex(item => item.id === newV.id || item.key === newV.key);
    if (idx >= 0) {
      db.customVariables[idx] = { ...db.customVariables[idx], ...newV };
    } else {
      db.customVariables.push(newV);
    }
    saveDb(db);
    res.json({ success: true, variable: newV });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/custom-variables/:id', (req, res) => {
  try {
    const db = loadDb();
    if (db.customVariables) {
      db.customVariables = db.customVariables.filter(v => v.id !== req.params.id);
      saveDb(db);
    }
    res.json({ success: true, message: `Variável ${req.params.id} removida` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==============================================================================
// 14. ENVIO DE MENSAGENS WHATSAPP
// ==============================================================================
app.post('/api/send-message', async (req, res) => {
  const { phone, text, message } = req.body;
  const bodyText = text || message;
  if (!phone || !bodyText) return res.status(400).json({ success: false, error: 'phone e text são obrigatórios' });
  const cleanPhone = String(phone).replace(/\D/g, '');
  const success = await sendWhatsAppMessage(`${cleanPhone}@s.whatsapp.net`, bodyText);
  if (success) {
    res.json({ success: true, messageId: `msg-${Date.now()}`, status: 'sent' });
  } else {
    res.status(500).json({ success: false, error: 'Falha no envio via Baileys', status: connectionStatus });
  }
});

// ==============================================================================
// 15. BACKUP, RESTAURAÇÃO E ESTATÍSTICAS DO BANCO CENTRAL
// ==============================================================================
app.get('/api/db/export', (req, res) => {
  try {
    const data = exportDatabase();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="pitoco_backup_${new Date().toISOString().slice(0, 10)}.json"`);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/db/import', (req, res) => {
  try {
    const imported = importDatabase(req.body);
    res.json({ success: true, stats: getDatabaseStats() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/db/stats', (req, res) => {
  try {
    res.json(getDatabaseStats());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/db/sync', (req, res) => {
  try {
    const current = loadDb();
    const incoming = req.body || {};
    const merged = {
      ...current,
      ...incoming,
      updated_at: new Date().toISOString(),
    };
    saveDb(merged);
    res.json({ success: true, message: 'Sincronização concluída com sucesso', stats: getDatabaseStats() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Single Page App fallback for non-API routes
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  const indexPath = path.join(DIST_PATH, 'index.html');
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  res.json({
    app: 'Pitoco de Gente WhatsApp Bot API',
    status: 'online',
    version: '2.0.0',
    whatsapp: connectionStatus,
  });
});

app.listen(PORT, HOST, () => {
  console.log(`🚀 [Pitoco Server] Rodando em http://${HOST}:${PORT}`);
  startWhatsApp();
});
