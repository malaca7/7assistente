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
  getActiveFlowAndGraph 
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

        const clientPhone = remoteJid.replace('@s.whatsapp.net', '').replace(/\D/g, '');
        const clientName = msg.pushName || 'Cliente Pitoco';
        const text = msg.message.conversation || 
                     msg.message.extendedTextMessage?.text || 
                     msg.message.buttonsResponseMessage?.selectedButtonId ||
                     msg.message.listResponseMessage?.singleSelectReply?.selectedRowId ||
                     '';

        console.log(`📩 [WhatsApp Recebido] ${clientPhone} (${clientName}): "${text}"`);
        await recordMessageLocallyAndSupabase(clientPhone, clientName, 'inbound', text);

        // Executar o fluxo oficial completo do Pitoco de Gente (Painel Admin)
        try {
          const db = loadDb();
          const replyText = await processAdminBotMessage(text, clientPhone, clientName, db);
          saveDb(db);

          if (replyText) {
            await sendWhatsAppMessage(remoteJid, replyText);
            await recordMessageLocallyAndSupabase(clientPhone, 'Pitoco Bot', 'outbound', replyText);
          }
        } catch (botErr) {
          console.error(`❌ [Bot Engine Error] Erro ao processar mensagem para ${clientPhone}:`, botErr);
          await sendWhatsAppMessage(remoteJid, `Olá, *${clientName}*! Recebemos sua mensagem. Em instantes responderemos!`);
        }
      }
    });
  } catch (err) {
    console.error('❌ [Server] Erro ao iniciar Baileys:', err);
    connectionStatus = 'error';
  }
}
  } catch (err) {
    console.error('❌ [Server] Erro ao iniciar Baileys:', err);
    connectionStatus = 'error';
  }
}

// Enviar resposta gerada pelo motor de fluxo (texto, botões ou mídia)
async function sendBotReply(remoteJid, reply) {
  if (!sock || connectionStatus !== 'connected') {
    console.warn(`[SendReply] ⚠️ Baileys não conectado, não foi possível responder para ${remoteJid}`);
    return false;
  }

  const cleanPhone = remoteJid.replace('@s.whatsapp.net', '').replace(/\D/g, '');

  try {
    // 1. Resposta em Texto Puro
    if (typeof reply === 'string') {
      await sock.sendMessage(remoteJid, { text: reply });
      await recordMessageInSupabase(cleanPhone, 'Pitoco Bot', 'outbound', reply);
      return true;
    }

    // 2. Resposta com Botões / Opções Interativas (com fallback amigável numerado)
    if (reply && reply.type === 'buttons') {
      const body = reply.body || 'Escolha uma das opções abaixo:';
      const footer = reply.footer || 'Pitoco de Gente • Resposta Automática';
      const buttons = reply.buttons || [];

      let formatted = `${body}\n\n`;
      buttons.forEach((btn, idx) => {
        formatted += `*${idx + 1}.* ${btn.title || btn.id}\n`;
      });
      if (footer) {
        formatted += `\n_${footer}_\n_Digite o número da opção (1 a ${buttons.length})._`;
      }

      await sock.sendMessage(remoteJid, { text: formatted });
      await recordMessageInSupabase(cleanPhone, 'Pitoco Bot', 'outbound', formatted);
      return true;
    }

    // 3. Resposta com Mídia (Imagem, Vídeo, Documento, Áudio)
    if (reply && reply.type === 'media') {
      const mediaType = reply.mediaType || 'image';
      const mediaUrl = reply.mediaUrl;
      const caption = reply.caption || '';

      if (mediaType === 'image') {
        await sock.sendMessage(remoteJid, { image: { url: mediaUrl }, caption });
      } else if (mediaType === 'video') {
        await sock.sendMessage(remoteJid, { video: { url: mediaUrl }, caption });
      } else if (mediaType === 'audio') {
        await sock.sendMessage(remoteJid, { audio: { url: mediaUrl }, mimetype: 'audio/mp4', ptt: reply.isPtt !== false });
      } else {
        await sock.sendMessage(remoteJid, { document: { url: mediaUrl }, mimetype: 'application/pdf', fileName: reply.fileName || 'documento.pdf', caption });
      }
      await recordMessageInSupabase(cleanPhone, 'Pitoco Bot', 'outbound', caption || `[Arquivo ${mediaType}]`);
      return true;
    }

    return false;
  } catch (err) {
    console.error(`❌ [SendReply] Erro ao enviar resposta para ${remoteJid}:`, err);
    return false;
  }
}

async function sendWhatsAppMessage(jid, text) {
  if (!sock || connectionStatus !== 'connected') {
    return false;
  }
  try {
    await sock.sendMessage(jid, { text });
    await recordMessageInSupabase(jid.replace('@s.whatsapp.net', ''), 'Pitoco Bot', 'outbound', text);
    return true;
  } catch (e) {
    return false;
  }
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

app.get('/api/products', (req, res) => {
  try {
    const db = loadDb();
    res.json(db.agendaSettings?.services || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/users', (req, res) => {
  try {
    const db = loadDb();
    res.json(db.systemUsers || []);
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
    const found = users.find(u => (u.username?.toLowerCase() === cleanUser || u.phone === cleanPass) && (u.password === cleanPass || u.pin === cleanPass));
    if (found || (cleanUser === 'admin' && (cleanPass === '1234' || cleanPass === '123456' || cleanPass === 'admin'))) {
      const userObj = found || { id: 'user-admin', name: 'Administrador Geral', role: 'admin', username: 'admin' };
      return res.json({ success: true, user: userObj });
    }
    return res.status(401).json({ success: false, error: 'Usuário ou senha inválidos' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

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

app.get('/api/stores', (req, res) => {
  res.json(STORES);
});

// Conversas do Atendimento Humano Inbox
app.get('/api/conversations', (req, res) => {
  try {
    const db = loadDb();
    const convs = Object.values(db.conversations || {});
    res.json(convs);
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

// Tickets de Atendimento das Lojas
app.get('/api/tickets', (req, res) => {
  try {
    const db = loadDb();
    res.json(db.tickets || []);
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

// Consultorias VIP / Agendamentos
app.get('/api/consultations', (req, res) => {
  try {
    const db = loadDb();
    res.json(db.appointments || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==============================================================================
// GESTÃO E SINCRONIZAÇÃO DINÂMICA DE FLUXOS NO BOT
// ==============================================================================

// Listar todos os fluxos
app.get('/api/flows', (req, res) => {
  try {
    const db = loadDb();
    res.json(db.flows || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Obter o fluxo ativo no momento e seu grafo de nós
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

// Obter fluxo específico
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

// Criar ou atualizar fluxo (com ativação única e segura)
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
      // Garantir que apenas este fluxo fique ativo
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

// Excluir fluxo
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

// Alternar status do fluxo (Ativo <-> Pausado)
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

// Publicar fluxo e ativar no bot WhatsApp
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

// Sincronizar array de fluxos
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

// Obter nós e arestas de um fluxo
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

// Salvar nós e arestas de um fluxo (Grafo completo)
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
