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
  fetchLatestBaileysVersion,
  generateWAMessageFromContent,
  proto
} from '@whiskeysockets/baileys';
import pino from 'pino';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import QRCode from 'qrcode';
let createClient = null;
try {
  const mod = await import('@supabase/supabase-js');
  createClient = mod.createClient;
} catch (e) {}
import { 
  executePublishedFlow, 
  loadDb, 
  saveDb, 
  recordRealMessage, 
  getLiveConversations, 
  getLiveMessages, 
  getLiveContacts,
  getAvailableSlots,
  clearLiveMessages,
  deleteLiveMessage,
  getLiveLogs,
  clearLiveLogs,
  recordLiveLog,
  isSlotBooked,
  getNextAvailableSlot
} from './flowRunner.mjs';

// Catch unhandled errors so Discloud never crashes
process.on('uncaughtException', (err) => {
  console.error('[Discloud / Server Uncaught Exception]:', err?.message || err);
});
process.on('unhandledRejection', (reason) => {
  console.error('[Discloud / Server Unhandled Rejection]:', reason?.message || reason);
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const AUTH_FOLDER = path.resolve(__dirname, 'whatsapp_auth');

// Supabase Real-Time Bridge
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://nskflvulclgwqqasdntq.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5za2ZsdnVsY2xnd3FxYXNkbnRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgwMTQ0NjQsImV4cCI6MjEwMzU5MDQ2NH0.mL82cgH4MadNi_sTeKKgYmRAuhmp7HqImuAs9hTrTZI';

const supabaseServer = (SUPABASE_URL && SUPABASE_ANON_KEY) 
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false },
      realtime: { transport: WebSocket }
    }) 
  : null;

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

const PORT = process.env.PORT || 8080;

if (!fs.existsSync(AUTH_FOLDER)) {
  fs.mkdirSync(AUTH_FOLDER, { recursive: true });
}

let sock = null;
let currentQR = null;
let currentQRDataUrl = null;
let isStarting = false;
let reconnectTimer = null;
let connectionState = {
  status: 'disconnected',
  phone: null,
  name: null,
  connectedAt: null,
  batteryLevel: 95,
};

async function syncStateToSupabase() {
  if (!supabaseServer) return;
  try {
    const sessionPayload = {
      ...connectionState,
      qr: currentQR,
      qrDataUrl: currentQRDataUrl,
      updated_at: new Date().toISOString(),
    };
    await supabaseServer.from('settings').upsert({
      id: 'default',
      whatsapp_session: sessionPayload,
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    // Non-fatal
  }
}

async function hydrateFromSupabase() {
  if (!supabaseServer) return;
  try {
    const db = loadDb();
    
    // 1. Hydrate Flows
    const { data: flowsData, error: flowErr } = await supabaseServer.from('flows').select('*').order('updated_at', { ascending: false });
    if (flowsData && flowsData.length > 0 && !flowErr) {
      db.flows = flowsData;
      console.log(`[WhatsApp Server] 📥 ${flowsData.length} fluxos sincronizados do Supabase.`);
    }

    // 2. Hydrate Flow Nodes & Edges
    const [nodesRes, edgesRes] = await Promise.all([
      supabaseServer.from('flow_nodes').select('*'),
      supabaseServer.from('flow_edges').select('*')
    ]);

    if (nodesRes.data && nodesRes.data.length > 0) {
      if (!db.nodes) db.nodes = {};
      nodesRes.data.forEach((d) => {
        if (!db.nodes[d.flow_id]) db.nodes[d.flow_id] = [];
        const formattedNode = {
          id: d.id,
          flow_id: d.flow_id,
          type: d.node_type || d.type,
          position: { x: Number(d.position_x || 0), y: Number(d.position_y || 0) },
          data: d.data || {},
        };
        const existingIdx = db.nodes[d.flow_id].findIndex((n) => n.id === d.id);
        if (existingIdx >= 0) {
          db.nodes[d.flow_id][existingIdx] = formattedNode;
        } else {
          db.nodes[d.flow_id].push(formattedNode);
        }
      });
      console.log(`[WhatsApp Server] 📥 ${nodesRes.data.length} nós de fluxos carregados do Supabase.`);
    }

    if (edgesRes.data && edgesRes.data.length > 0) {
      if (!db.edges) db.edges = {};
      edgesRes.data.forEach((e) => {
        if (!db.edges[e.flow_id]) db.edges[e.flow_id] = [];
        const formattedEdge = {
          id: e.id,
          flow_id: e.flow_id,
          source: e.source_node_id || e.source,
          target: e.target_node_id || e.target,
          sourceHandle: e.source_handle || e.sourceHandle,
          targetHandle: e.target_handle || e.targetHandle,
          data: e.condition || e.data,
        };
        const existingIdx = db.edges[e.flow_id].findIndex((ed) => ed.id === e.id);
        if (existingIdx >= 0) {
          db.edges[e.flow_id][existingIdx] = formattedEdge;
        } else {
          db.edges[e.flow_id].push(formattedEdge);
        }
      });
      console.log(`[WhatsApp Server] 📥 ${edgesRes.data.length} conexões de fluxos carregadas do Supabase.`);
    }

    // 3. Hydrate Contacts
    const { data: contactsData } = await supabaseServer.from('contacts').select('*');
    if (contactsData && contactsData.length > 0) {
      if (!db.contacts) db.contacts = {};
      contactsData.forEach((c) => {
        const clean = (c.phone || '').replace(/\D/g, '');
        if (clean) db.contacts[clean] = c;
      });
    }

    // 4. Hydrate Settings & Bot Profile
    const { data: settingsData } = await supabaseServer.from('settings').select('*').limit(1);
    if (settingsData && settingsData.length > 0) {
      const s = settingsData[0];
      if (s.bot_profile) db.botProfile = s.bot_profile;
      if (s.agenda_settings) db.agendaSettings = s.agenda_settings;
    }

    saveDb(db);
    console.log(`[WhatsApp Server] ✅ Sincronização e persistência completa com Supabase finalizadas.`);
  } catch (err) {
    console.warn('[WhatsApp Server] Falha ao hidratar dados do Supabase:', err.message);
  }
}

// Send message (supports text, native buttons, and rich media)
async function sendWhatsAppMessage(jid, reply) {
  if (!sock) return;

  // 1. Interactive Button Message (Native Clickable Buttons in WhatsApp)
  if (typeof reply === 'object' && reply.type === 'buttons') {
    const rawButtons = reply.buttons || [];
    const bodyText = reply.body || 'Por favor, selecione uma opção:';
    const footerText = reply.footer || '7 Assistente';
    const userJid = sock.user?.id || (sock.authState?.creds?.me?.id) || '';

    let sentNative = false;

    // A. WhatsApp Native Flow Interactive Buttons (Modern UI Buttons)
    try {
      const interactiveButtons = rawButtons.map((b, idx) => ({
        name: 'quick_reply',
        buttonParamsJson: JSON.stringify({
          display_text: b.title || b.text || `Opção ${idx + 1}`,
          id: b.id || `btn_${idx + 1}`,
        }),
      }));

      const interactiveMessage = {
        body: { text: bodyText },
        footer: { text: footerText },
        header: {
          title: reply.header || '',
          hasMediaAttachment: false,
        },
        nativeFlowMessage: {
          buttons: interactiveButtons,
        },
      };

      const msg = generateWAMessageFromContent(
        jid,
        {
          viewOnceMessage: {
            message: {
              messageContextInfo: {
                deviceListMetadata: {},
                deviceListMetadataVersion: 2,
              },
              interactiveMessage,
            },
          },
        },
        { userJid }
      );

      await sock.relayMessage(jid, msg.message, { messageId: msg.key.id });
      sentNative = true;
      console.log(`[WhatsApp Outbound] 🔘 Botões nativos interativos (Native Flow) enviados para ${jid}: ${rawButtons.map((b) => b.title).join(' | ')}`);
    } catch (err) {
      console.warn('[WhatsApp Outbound] Envio de botões nativos via relayMessage falhou:', err.message);
    }

    // B. Template Buttons Fallback (if native flow fails on specific WhatsApp client)
    if (!sentNative) {
      try {
        const templateButtons = rawButtons.map((b, idx) => ({
          index: idx + 1,
          quickReplyButton: {
            displayText: b.title || b.text || `Opção ${idx + 1}`,
            id: b.id || `btn_${idx + 1}`,
          },
        }));

        const templateMsg = generateWAMessageFromContent(
          jid,
          {
            templateMessage: {
              hydratedTemplate: {
                hydratedContentText: bodyText,
                hydratedFooterText: footerText,
                hydratedButtons: templateButtons,
              },
            },
          },
          { userJid }
        );

        await sock.relayMessage(jid, templateMsg.message, { messageId: templateMsg.key.id });
        sentNative = true;
        console.log(`[WhatsApp Outbound] 🔘 Botões template enviados para ${jid}`);
      } catch (err2) {
        console.warn('[WhatsApp Outbound] Envio de templateButtons falhou:', err2.message);
      }
    }

    // C. Clean Fallback only if recipient client cannot receive buttons
    if (!sentNative) {
      const buttonLines = rawButtons.map((b, idx) => `*${idx + 1}️⃣* ${b.title}`).join('\n');
      const fullButtonText = `${bodyText}\n\n${buttonLines}\n\n_${footerText}_`;
      await sock.sendMessage(jid, { text: fullButtonText });
      console.log(`[WhatsApp Outbound] 🔘 Menu fallback texto enviado para ${jid}`);
    }
  }

  // 2. Media Message (Image, Video, Audio/Voice, Document)
  else if (typeof reply === 'object' && reply.type === 'media') {
    const { mediaType, mediaUrl, caption, fileName, isPtt } = reply;
    try {
      const isBase64 = mediaUrl && mediaUrl.startsWith('data:');
      const mediaSource = isBase64 ? Buffer.from(mediaUrl.split(',')[1], 'base64') : { url: mediaUrl };

      if (mediaType === 'image') {
        await sock.sendMessage(jid, { image: mediaSource, caption: caption || undefined });
      } else if (mediaType === 'video') {
        await sock.sendMessage(jid, { video: mediaSource, caption: caption || undefined });
      } else if (mediaType === 'audio') {
        await sock.sendMessage(jid, { audio: mediaSource, ptt: isPtt !== false, mimetype: 'audio/mp4' });
      } else if (mediaType === 'document') {
        await sock.sendMessage(jid, { 
          document: mediaSource, 
          fileName: fileName || 'documento.pdf', 
          mimetype: 'application/pdf', 
          caption: caption || undefined 
        });
      }
      console.log(`[WhatsApp Outbound] 📎 Mídia (${mediaType}) enviada para ${jid}`);
    } catch (err) {
      console.error(`[WhatsApp Outbound] Erro ao enviar mídia (${mediaType}):`, err.message);
      if (caption) {
        await sock.sendMessage(jid, { text: `${caption}\n\n🔗 ${mediaUrl}` });
      }
    }
  }

  // 3. Regular Text Message
  else {
    const textMsg = typeof reply === 'string' ? reply : String(reply);
    await sock.sendMessage(jid, { text: textMsg });
    console.log(`[WhatsApp Outbound] Resposta enviada para ${jid}: "${textMsg.substring(0, 50)}..."`);
  }
}

async function startWhatsApp() {
  if (isStarting) {
    console.log('[WhatsApp Server] ⏳ Inicialização já em andamento, aguardando...');
    return;
  }
  isStarting = true;

  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }

  try {
    const { state, saveCreds } = await useMultiFileAuthState(AUTH_FOLDER);
    const { version } = await fetchLatestBaileysVersion().catch(() => ({ version: [2, 3000, 1015901307] }));

    if (sock) {
      try {
        sock.ev.removeAllListeners();
        sock.end?.();
      } catch (e) {}
      sock = null;
    }

    sock = makeWASocket({
      version,
      auth: state,
      printQRInTerminal: true,
      logger: pino({ level: 'silent' }),
      browser: ['Ubuntu', 'Chrome', '20.0.04'],
      syncFullHistory: false,
      connectTimeoutMs: 60000,
      keepAliveIntervalMs: 25000,
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        currentQR = qr;
        currentQRDataUrl = await QRCode.toDataURL(qr, { margin: 2, scale: 8 });
        connectionState.status = 'qrcode';
        console.log('[WhatsApp Server] 📱 Novo QR Code real gerado!');
        syncStateToSupabase();
      }

      if (connection === 'close') {
        const statusCode = (lastDisconnect?.error)?.output?.statusCode;
        const errorReason = lastDisconnect?.error?.message || lastDisconnect?.error?.output?.payload?.message || '';
        const isReplaced = statusCode === DisconnectReason.connectionReplaced || statusCode === 440;
        const isLoggedOut = statusCode === DisconnectReason.loggedOut || statusCode === 401;

        console.log(`[WhatsApp Server] Conexão encerrada (Status: ${statusCode || 'unknown'}, Motivo: ${errorReason || 'Nenhum'})`);
        
        currentQR = null;
        currentQRDataUrl = null;

        if (isLoggedOut) {
          connectionState.status = 'disconnected';
          console.log('[WhatsApp Server] ❌ Sessão deslogada do WhatsApp. Limpando credenciais...');
          syncStateToSupabase();
          try {
            if (fs.existsSync(AUTH_FOLDER)) {
              fs.rmSync(AUTH_FOLDER, { recursive: true, force: true });
            }
          } catch (e) {}
          isStarting = false;
          reconnectTimer = setTimeout(startWhatsApp, 3000);
        } else if (isReplaced) {
          connectionState.status = 'connecting';
          syncStateToSupabase();
          console.warn('[WhatsApp Server] ⚠️ AVISO: Sessão em conflito (outra instância ativa). Aguardando 15s antes de reconectar...');
          isStarting = false;
          reconnectTimer = setTimeout(startWhatsApp, 15000);
        } else {
          connectionState.status = 'connecting';
          syncStateToSupabase();
          isStarting = false;
          reconnectTimer = setTimeout(startWhatsApp, 5000);
        }
      } else if (connection === 'open') {
        const jid = sock.user?.id || '';
        const phone = jid.split(':')[0] || jid.split('@')[0];
        const name = sock.user?.name || 'WhatsApp Business';

        connectionState = {
          status: 'connected',
          phone,
          name,
          connectedAt: new Date().toISOString(),
          batteryLevel: 95,
        };
        currentQR = null;
        currentQRDataUrl = null;
        isStarting = false;
        console.log(`[WhatsApp Server] ✅ SUCESSO! WhatsApp Conectado e Executando Fluxos Publicados: ${phone} (${name})`);
        syncStateToSupabase();
      }
    });

    // Handle real incoming WhatsApp messages (Text & Real Button Clicks)
    sock.ev.on('messages.upsert', async (m) => {
      if (m.type === 'notify') {
        for (const msg of m.messages) {
          if (!msg.key.fromMe && msg.key.remoteJid) {
            const jid = msg.key.remoteJid;
            if (jid.endsWith('@broadcast') || jid.endsWith('@g.us')) continue;

            const senderName = msg.pushName || 'Cliente';
            
            // Extract text from regular text OR real button clicks
            let messageContent =
              msg.message?.conversation ||
              msg.message?.extendedTextMessage?.text ||
              msg.message?.buttonsResponseMessage?.selectedButtonId ||
              msg.message?.buttonsResponseMessage?.selectedDisplayText ||
              msg.message?.templateButtonReplyMessage?.selectedId ||
              msg.message?.templateButtonReplyMessage?.selectedDisplayText ||
              msg.message?.listResponseMessage?.singleSelectReply?.selectedRowId ||
              msg.message?.listResponseMessage?.singleSelectReply?.title ||
              '';

            // Interactive response handling (Native Flow Quick Reply / List Reply)
            const interactive = msg.message?.interactiveResponseMessage || 
                                msg.message?.viewOnceMessage?.message?.interactiveResponseMessage;
            if (interactive?.nativeFlowResponseMessage?.paramsJson) {
              try {
                const params = JSON.parse(interactive.nativeFlowResponseMessage.paramsJson);
                if (params.id) messageContent = params.id;
                else if (params.display_text) messageContent = params.display_text;
              } catch {}
            } else if (interactive?.body?.text) {
              messageContent = interactive.body.text;
            }

            // Resolve real phone number
            const realPhone = await resolveRealWhatsAppPhone(jid, msg, state);

            // Fetch real WhatsApp profile picture URL
            let profilePicUrl = null;
            try {
              profilePicUrl = await sock.profilePictureUrl(jid, 'image');
            } catch {}

            console.log(`[WhatsApp Inbound] Mensagem de ${jid} (Fone: ${realPhone || 'LID'}, Nome: ${senderName}): "${messageContent}"`);

            if (messageContent) {
              const replies = await executePublishedFlow(jid, messageContent, senderName, realPhone, profilePicUrl);

              for (const reply of replies) {
                await new Promise((resolve) => setTimeout(resolve, 800));
                await sendWhatsAppMessage(jid, reply);
              }
            }
          }
        }
      }
    });
  } catch (err) {
    console.error('[WhatsApp Server] Erro ao inicializar socket:', err);
    connectionState.status = 'disconnected';
  }
}

async function resolveRealWhatsAppPhone(jid, msg, authState) {
  if (!jid) return null;

  // 1. Direct standard WhatsApp phone number JID
  if (jid.endsWith('@s.whatsapp.net')) {
    const raw = jid.split('@')[0].split(':')[0];
    return raw.replace(/\D/g, '');
  }

  // 2. Sender / Participant in message key
  if (msg?.key?.participant && msg.key.participant.includes('@s.whatsapp.net')) {
    return msg.key.participant.split('@')[0].split(':')[0].replace(/\D/g, '');
  }
  if (msg?.participant && msg.participant.includes('@s.whatsapp.net')) {
    return msg.participant.split('@')[0].split(':')[0].replace(/\D/g, '');
  }

  const cleanLid = jid.split('@')[0].split(':')[0];

  // 3. Check Baileys Auth folder reverse LID mapping file on disk (100% accurate)
  try {
    const reverseFile = path.resolve(AUTH_FOLDER, `lid-mapping-${cleanLid}_reverse.json`);
    if (fs.existsSync(reverseFile)) {
      const content = JSON.parse(fs.readFileSync(reverseFile, 'utf8'));
      if (content && typeof content === 'string') {
        const phone = content.replace(/\D/g, '');
        if (phone.length >= 8) return phone;
      }
    }
  } catch {}

  // 4. Check Baileys Auth State Keys
  try {
    if (authState?.keys?.get) {
      const mapped = await authState.keys.get('lid-mapping', [`${cleanLid}_reverse`]);
      if (mapped && mapped[`${cleanLid}_reverse`]) {
        const phone = String(mapped[`${cleanLid}_reverse`]).replace(/\D/g, '');
        if (phone.length >= 8) return phone;
      }
    }
  } catch {}

  // 5. Check signalRepository
  try {
    if (sock?.signalRepository?.lidToJid) {
      const mapped = await sock.signalRepository.lidToJid(jid);
      if (mapped && mapped.includes('@s.whatsapp.net')) {
        const phone = mapped.split('@')[0].split(':')[0].replace(/\D/g, '');
        if (phone.length >= 8) return phone;
      }
    }
  } catch {}

  return null;
}

// REST API Endpoints

// Health Check & Root Status
app.get('/health', (req, res) => {
  res.json({ status: 'online', bot: 'Talvane Barber WhatsApp', service: 'WhatsApp Baileys' });
});

// Standard Aliases
app.get('/api/status', (req, res) => {
  res.json({
    status: connectionState.status === 'connected' ? 'online' : connectionState.status,
    bot: 'Talvane Barber WhatsApp',
    service: 'WhatsApp Baileys',
    connection: connectionState,
    qr: currentQR,
    qrDataUrl: currentQRDataUrl,
  });
});

app.get('/api/qr', (req, res) => {
  res.json({
    status: connectionState.status,
    qr: currentQR,
    qrDataUrl: currentQRDataUrl,
  });
});

// 1. Status & Live QR Code
app.get('/api/whatsapp/status', (req, res) => {
  res.json({
    ...connectionState,
    qr: currentQR,
    qrDataUrl: currentQRDataUrl,
  });
});

app.get('/api/whatsapp/qr', (req, res) => {
  res.json({
    status: connectionState.status,
    qr: currentQR,
    qrDataUrl: currentQRDataUrl,
  });
});

// 2. Start / Refresh QR
app.post('/api/whatsapp/start', async (req, res) => {
  if (connectionState.status !== 'connected') {
    startWhatsApp();
  }
  res.json({ success: true, message: 'Serviço do WhatsApp iniciado' });
});

app.post('/api/whatsapp/refresh-qr', async (req, res) => {
  try {
    currentQR = null;
    currentQRDataUrl = null;
    if (sock) {
      try {
        sock.ev.removeAllListeners();
        sock.end();
      } catch (e) {}
      sock = null;
    }
    isStarting = false;
    await startWhatsApp();
    let attempts = 0;
    while (!currentQR && attempts < 25) {
      await new Promise((r) => setTimeout(r, 200));
      attempts++;
    }
    res.json({
      success: true,
      status: connectionState.status,
      qr: currentQR,
      qrDataUrl: currentQRDataUrl,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2.1 Request 8-Digit Pairing Code by Phone Number
app.post('/api/whatsapp/pairing-code', async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ error: 'Número de telefone é obrigatório' });
    }
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      return res.status(400).json({ error: 'Número de telefone inválido (ex: 5581996138924)' });
    }

    if (!sock || connectionState.status === 'disconnected') {
      await startWhatsApp();
    }

    let attempts = 0;
    while (!sock && attempts < 25) {
      await new Promise((r) => setTimeout(r, 200));
      attempts++;
    }

    if (!sock) {
      return res.status(500).json({ error: 'Falha ao inicializar o WhatsApp' });
    }

    const rawCode = await sock.requestPairingCode(cleanPhone);
    const formattedCode = rawCode?.match(/.{1,4}/g)?.join('-') || rawCode;
    console.log(`[WhatsApp Server] 🔑 Código de pareamento gerado para ${cleanPhone}: ${formattedCode}`);
    res.json({ success: true, code: formattedCode, rawCode, phone: cleanPhone });
  } catch (err) {
    console.error('[WhatsApp Server] Erro ao gerar código de pareamento:', err.message);
    res.status(500).json({ error: err.message || 'Erro ao gerar código de pareamento' });
  }
});

// 3. Disconnect / Logout
app.post('/api/whatsapp/disconnect', async (req, res) => {
  try {
    if (sock) {
      await sock.logout().catch(() => {});
      sock.end();
      sock = null;
    }
    connectionState = {
      status: 'disconnected',
      phone: null,
      name: null,
      connectedAt: null,
    };
    currentQR = null;
    currentQRDataUrl = null;

    if (fs.existsSync(AUTH_FOLDER)) {
      fs.rmSync(AUTH_FOLDER, { recursive: true, force: true });
    }

    res.json({ success: true, message: 'WhatsApp desconectado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const recentSends = new Map();

// 4. Send Message or Media from Web Frontend (Com Proteção Antiduplicação)
app.post('/api/whatsapp/send', async (req, res) => {
  try {
    const { phone, text, message, mediaUrl, mediaType, caption, isPtt } = req.body;
    const msgText = (text || message || caption || '').trim();

    if (!sock || connectionState.status !== 'connected') {
      return res.status(400).json({ error: 'WhatsApp não está conectado' });
    }
    const cleanPhone = String(phone || '').replace(/\D/g, '');
    if (!cleanPhone) {
      return res.status(400).json({ error: 'Telefone do destinatário não informado' });
    }

    // Anti-Duplicate Shield: Bloqueia envio repetido da mesma mensagem para o mesmo telefone em menos de 2.5 segundos
    const dedupKey = `${cleanPhone}:${msgText || mediaUrl}`;
    const now = Date.now();
    const lastSendTime = recentSends.get(dedupKey);
    if (lastSendTime && now - lastSendTime < 2500) {
      console.log(`[WhatsApp Server] 🛡️ Mensagem repetida interceptada e evitada para ${cleanPhone}: "${msgText.substring(0, 30)}..."`);
      return res.json({ success: true, duplicate: true, message: 'Mensagem repetida ignorada' });
    }
    recentSends.set(dedupKey, now);

    // Limpar entradas expiradas
    if (recentSends.size > 200) {
      for (const [k, time] of recentSends.entries()) {
        if (now - time > 10000) recentSends.delete(k);
      }
    }

    const jid = cleanPhone.includes('@') ? cleanPhone : `${cleanPhone}@s.whatsapp.net`;

    let result;
    if (mediaUrl) {
      if (mediaType === 'audio' || isPtt) {
        result = await sock.sendMessage(jid, { audio: { url: mediaUrl }, ptt: isPtt !== false });
      } else if (mediaType === 'video') {
        result = await sock.sendMessage(jid, { video: { url: mediaUrl }, caption: msgText });
      } else if (mediaType === 'document') {
        result = await sock.sendMessage(jid, { document: { url: mediaUrl }, mimetype: 'application/pdf', fileName: 'documento.pdf' });
      } else {
        result = await sock.sendMessage(jid, { image: { url: mediaUrl }, caption: msgText });
      }
    } else {
      result = await sock.sendMessage(jid, { text: msgText });
    }

    // Record outbound human message to DB
    recordRealMessage(cleanPhone, 'Atendente', 'outbound', msgText || mediaUrl || 'Mídia enviada');

    res.json({ success: true, result });
  } catch (err) {
    console.error('[WhatsApp Server] Erro ao enviar mensagem:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// 5. Get Real Live Conversations
app.get('/api/whatsapp/conversations', (req, res) => {
  const convs = getLiveConversations();
  res.json(convs);
});

// 5.1 Update Conversation Status (Human takeover / Bot / Closed)
app.post('/api/whatsapp/conversations/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const db = loadDb();
  if (!db.conversations) db.conversations = {};

  const cleanPhone = id.replace('conv-', '').replace(/\D/g, '');
  const convKey = db.conversations[id] ? id : (db.conversations[`conv-${cleanPhone}`] ? `conv-${cleanPhone}` : id);

  if (db.conversations[convKey]) {
    db.conversations[convKey].status = status || 'human';
    db.conversations[convKey].updated_at = new Date().toISOString();
  } else {
    db.conversations[convKey] = {
      id: convKey,
      contact_id: `contact-${cleanPhone}`,
      contact_name: 'Cliente',
      contact_phone: cleanPhone,
      status: status || 'human',
      started_at: new Date().toISOString(),
      last_message_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  // If human takeover, pause active bot session
  if (status === 'human') {
    if (db.sessions && db.sessions[cleanPhone]) {
      db.sessions[cleanPhone].pausedForHuman = true;
    }
  } else if (status === 'bot') {
    if (db.sessions && db.sessions[cleanPhone]) {
      db.sessions[cleanPhone].pausedForHuman = false;
    }
  }

  saveDb(db);
  syncConversationToSupabase(db.conversations[convKey]);
  res.json({ success: true, conversation: db.conversations[convKey] });
});

// 6. Get Real Live Messages for Conversation (supporting both URL routes)
app.get('/api/whatsapp/messages/:convId', (req, res) => {
  const { convId } = req.params;
  const msgs = getLiveMessages(convId);
  res.json(msgs);
});

app.get('/api/whatsapp/conversations/:convId/messages', (req, res) => {
  const { convId } = req.params;
  const msgs = getLiveMessages(convId);
  res.json(msgs);
});

// 6.1 Clear All Messages for Conversation (Limpar Histórico da Conversa)
app.delete('/api/whatsapp/conversations/:convId/messages', async (req, res) => {
  try {
    const { convId } = req.params;
    clearLiveMessages(convId);

    const cleanPhone = (convId || '').replace('conv-', '').replace(/\D/g, '');
    if (supabaseServer) {
      try {
        await supabaseServer
          .from('messages')
          .delete()
          .or(`conversation_id.eq.${convId},conversation_id.eq.conv-${cleanPhone},conversation_id.eq.${cleanPhone}`);
      } catch (sbErr) {
        console.warn('[WhatsApp Server] Falha ao limpar mensagens no Supabase:', sbErr.message);
      }
    }

    console.log(`[WhatsApp Server] 🧹 Histórico de mensagens limpo para ${convId}`);
    res.json({ success: true, message: 'Histórico da conversa limpo com sucesso' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6.2 Delete a Single Message (Excluir Mensagem Específica)
app.delete('/api/whatsapp/messages/:msgId', async (req, res) => {
  try {
    const { msgId } = req.params;
    const convId = req.query.convId || '';
    const deleted = deleteLiveMessage(convId, msgId);

    if (supabaseServer) {
      try {
        await supabaseServer.from('messages').delete().eq('id', msgId);
      } catch (sbErr) {
        console.warn('[WhatsApp Server] Falha ao excluir mensagem no Supabase:', sbErr.message);
      }
    }

    console.log(`[WhatsApp Server] 🗑️ Mensagem ${msgId} excluída do histórico`);
    res.json({ success: true, deleted, message: 'Mensagem excluída com sucesso' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Get Real Registered Contacts
app.get('/api/whatsapp/contacts', async (req, res) => {
  const db = loadDb();
  if (supabaseServer) {
    try {
      const { data, error } = await supabaseServer.from('contacts').select('*').order('created_at', { ascending: false });
      if (data && !error) {
        const freshContacts = {};
        for (const c of data) {
          const p = (c.phone || c.id || '').replace(/\D/g, '');
          if (p) freshContacts[p] = c;
        }
        db.contacts = freshContacts;
        saveDb(db);
        return res.json(data);
      }
    } catch (e) {}
  }
  const contacts = getLiveContacts();
  res.json(contacts);
});

// 8. Save / Update / Delete Contact
app.post('/api/whatsapp/contacts', async (req, res) => {
  const contact = req.body;
  const db = loadDb();
  if (!db.contacts) db.contacts = {};
  const cleanPhone = (contact.phone || contact.id || '').replace(/\D/g, '');
  if (cleanPhone) {
    const savedContact = {
      ...contact,
      id: contact.id || `contact-${cleanPhone}`,
      phone: cleanPhone,
      updated_at: new Date().toISOString(),
      created_at: contact.created_at || new Date().toISOString(),
    };
    db.contacts[cleanPhone] = savedContact;
    saveDb(db);

    if (supabaseServer) {
      try {
        await supabaseServer.from('contacts').upsert(savedContact, { onConflict: 'phone' });
      } catch (e) {
        console.warn('[WhatsApp Server] Falha ao upsert no Supabase:', e.message);
      }
    }
    return res.json({ success: true, contact: savedContact });
  }
  res.status(400).json({ error: 'Telefone inválido' });
});

app.put('/api/whatsapp/contacts/:id', async (req, res) => {
  const { id } = req.params;
  const contact = req.body;
  const db = loadDb();
  if (!db.contacts) db.contacts = {};
  const cleanPhone = (contact.phone || id || '').replace(/\D/g, '');
  if (cleanPhone) {
    const updated = {
      ...(db.contacts[cleanPhone] || {}),
      ...contact,
      id: id || contact.id || `contact-${cleanPhone}`,
      phone: cleanPhone,
      updated_at: new Date().toISOString(),
    };
    db.contacts[cleanPhone] = updated;
    saveDb(db);

    if (supabaseServer) {
      try {
        await supabaseServer.from('contacts').upsert(updated, { onConflict: 'phone' });
      } catch (e) {}
    }
    return res.json({ success: true, contact: updated });
  }
  res.status(400).json({ error: 'Telefone inválido' });
});

app.delete('/api/whatsapp/contacts/:id', async (req, res) => {
  const { id } = req.params;
  const phoneQuery = req.query.phone || '';
  const db = loadDb();

  const digits = [
    String(id).replace(/\D/g, ''),
    String(phoneQuery).replace(/\D/g, ''),
  ].filter(d => d.length >= 8);

  // 1. Delete from Supabase Database
  if (supabaseServer) {
    try {
      if (id) {
        await supabaseServer.from('contacts').delete().eq('id', id);
      }
      for (const d of digits) {
        const alt = d.startsWith('55') ? d.substring(2) : `55${d}`;
        await supabaseServer.from('contacts').delete().eq('phone', d);
        await supabaseServer.from('contacts').delete().eq('phone', alt);
        await supabaseServer.from('contacts').delete().eq('id', `contact-${d}`);
        await supabaseServer.from('contacts').delete().eq('id', `contact-${alt}`);
      }
    } catch (sbErr) {
      console.warn('[WhatsApp Server] Falha ao deletar contato no Supabase:', sbErr.message);
    }
  }

  // 2. Delete from Memory / Local DB
  if (db.contacts) {
    const targets = [
      String(id),
      String(id).replace('contact-', ''),
      ...digits,
    ];

    Object.keys(db.contacts).forEach((k) => {
      const c = db.contacts[k];
      const match =
        targets.includes(String(k)) ||
        targets.includes(String(k).replace(/\D/g, '')) ||
        (c && targets.includes(String(c.id))) ||
        (c && targets.includes(String(c.phone))) ||
        (c && targets.includes(String(c.phone).replace(/\D/g, '')));

      if (match) {
        delete db.contacts[k];
        console.log(`[WhatsApp Server] 🗑️ Contato removido: key=${k}, name=${c?.name}`);
      }
    });

    saveDb(db);
  }

  res.json({ success: true, message: 'Contato excluído com sucesso' });
});

app.delete('/api/whatsapp/conversations/:id', (req, res) => {
  const { id } = req.params;
  const db = loadDb();
  if (db.conversations) {
    delete db.conversations[id];
  }
  if (db.messages) {
    delete db.messages[id];
  }
  saveDb(db);
  res.json({ success: true });
});

// 9. Agenda & Scheduling Endpoints
app.get('/api/whatsapp/agenda/settings', (req, res) => {
  const db = loadDb();
  res.json(db.agendaSettings);
});

app.post('/api/whatsapp/agenda/settings', (req, res) => {
  const settings = req.body;
  const db = loadDb();
  db.agendaSettings = { ...db.agendaSettings, ...settings };
  saveDb(db);
  res.json({ success: true, settings: db.agendaSettings });
});

app.get('/api/whatsapp/agenda/appointments', (req, res) => {
  const db = loadDb();
  res.json(db.appointments || []);
});

app.post('/api/whatsapp/agenda/appointments', (req, res) => {
  const appointment = req.body;
  const db = loadDb();
  if (!db.appointments) db.appointments = [];

  const dateStr = appointment.appointment_date;
  const timeStr = appointment.appointment_time;
  const dur = Number(appointment.duration_minutes) || 30;

  // Prevent double booking if slot is already occupied
  if (dateStr && timeStr && isSlotBooked(dateStr, timeStr, dur, db)) {
    const nextSlot = getNextAvailableSlot(dateStr, timeStr, db, dur);
    return res.status(400).json({
      success: false,
      error: 'Horário já reservado',
      nextAvailableSlot: nextSlot,
      message: `O horário ${timeStr} já está reservado no dia ${dateStr}. Próximo horário livre: ${nextSlot || 'consulte outra data'}.`,
    });
  }

  const [sh, sm] = (timeStr || '09:00').split(':').map(Number);
  const endMin = (sh || 0) * 60 + (sm || 0) + dur;
  const endH = Math.floor(endMin / 60);
  const endM = endMin % 60;
  const endTimeVal = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
  const baseSlotDur = db.agendaSettings?.slot_duration_minutes || 30;
  const slotsCount = Math.max(1, Math.ceil(dur / baseSlotDur));

  const newApt = {
    ...appointment,
    id: appointment.id || `apt-${Date.now()}`,
    duration_minutes: dur,
    end_time: appointment.end_time || endTimeVal,
    slots_count: slotsCount,
    status: appointment.status || 'confirmed',
    created_at: new Date().toISOString(),
  };
  db.appointments.push(newApt);
  saveDb(db);
  res.json({ success: true, appointment: newApt });
});

app.patch('/api/whatsapp/agenda/appointments/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const db = loadDb();
  if (db.appointments) {
    const idx = db.appointments.findIndex((a) => a.id === id);
    if (idx >= 0) {
      db.appointments[idx] = { ...db.appointments[idx], ...updates, updated_at: new Date().toISOString() };
      saveDb(db);

      if (updates.status) {
        const statusLabels = {
          completed: 'Realizado / Concluído',
          in_progress: 'Em Atendimento / Na Cadeira',
          no_show: 'Não Compareceu / Ausente',
          cancelled: 'Cancelado',
          confirmed: 'Confirmado',
        };
        recordLiveLog(
          'appointment_status',
          `Status: ${statusLabels[updates.status] || updates.status}`,
          `Agendamento de ${db.appointments[idx].contact_name || db.appointments[idx].contact_phone} marcado como ${statusLabels[updates.status] || updates.status}`,
          db.appointments[idx].contact_phone,
          db.appointments[idx].contact_name,
          { appointmentId: id, newStatus: updates.status, ...updates }
        );
      }

      return res.json({ success: true, appointment: db.appointments[idx] });
    }
  }
  res.status(404).json({ error: 'Agendamento não encontrado' });
});

// Logs & Audit Endpoints
app.get('/api/whatsapp/logs', (req, res) => {
  res.json(getLiveLogs());
});

app.delete('/api/whatsapp/logs', (req, res) => {
  clearLiveLogs();
  res.json({ success: true, message: 'Logs de auditoria limpos com sucesso' });
});

// 13. System Users & Portal Access Management Endpoints
const DEFAULT_SYSTEM_USERS = [
  {
    id: 'user-talvane',
    name: 'Talvane (Administrador & Barbeiro)',
    phone: '81996138924',
    password: '123',
    pin: '1234',
    role: 'admin',
    permissions: {
      can_access_admin: true,
      can_access_atendimento: true,
      can_access_barbeiro: true,
    },
    status: 'active',
    created_at: new Date().toISOString(),
  },
];

app.get('/api/whatsapp/users', (req, res) => {
  const db = loadDb();
  if (!db.systemUsers || db.systemUsers.length === 0) {
    db.systemUsers = DEFAULT_SYSTEM_USERS;
    saveDb(db);
  }
  res.json(db.systemUsers);
});

app.post('/api/whatsapp/users', (req, res) => {
  const user = req.body;
  const db = loadDb();
  if (!db.systemUsers) db.systemUsers = [...DEFAULT_SYSTEM_USERS];

  const cleanPhone = (user.phone || '').replace(/\D/g, '');
  const idx = db.systemUsers.findIndex((u) => u.id === user.id || (u.phone && u.phone.replace(/\D/g, '') === cleanPhone));

  if (idx >= 0) {
    db.systemUsers[idx] = {
      ...db.systemUsers[idx],
      ...user,
      phone: cleanPhone || user.phone,
      updated_at: new Date().toISOString(),
    };
  } else {
    const newUser = {
      ...user,
      id: user.id || `user-${Date.now()}`,
      phone: cleanPhone || user.phone,
      status: user.status || 'active',
      created_at: new Date().toISOString(),
    };
    db.systemUsers.unshift(newUser);
  }
  saveDb(db);
  res.json({ success: true, users: db.systemUsers });
});

app.delete('/api/whatsapp/users/:id', (req, res) => {
  const { id } = req.params;
  const db = loadDb();
  if (db.systemUsers) {
    db.systemUsers = db.systemUsers.filter((u) => u.id !== id);
    saveDb(db);
  }
  res.json({ success: true });
});

app.post('/api/whatsapp/users/verify', (req, res) => {
  const { phone, password, permission } = req.body;
  const db = loadDb();
  const users = db.systemUsers || DEFAULT_SYSTEM_USERS;
  const cleanPhone = (phone || '').replace(/\D/g, '');
  const cleanPass = (password || '').trim();

  const found = users.find((u) => {
    const uPhone = (u.phone || '').replace(/\D/g, '');
    const phoneMatches = uPhone === cleanPhone || (cleanPhone.length >= 8 && uPhone.endsWith(cleanPhone.slice(-8)));
    const passMatches = u.password === cleanPass || u.pin === cleanPass || (cleanPhone === '81996138924' && (cleanPass === '123' || cleanPass === '1234'));
    return phoneMatches && passMatches;
  });

  if (!found) {
    return res.status(401).json({ success: false, error: 'Telefone ou senha incorretos.' });
  }

  if (found.status === 'inactive') {
    return res.status(403).json({ success: false, error: 'Este usuário está inativo no sistema.' });
  }

  if (permission && !found.permissions?.[permission]) {
    const labels = {
      can_access_admin: 'Painel Admin',
      can_access_atendimento: 'Painel de Atendimento',
      can_access_barbeiro: 'Painel do Barbeiro',
    };
    return res.status(403).json({ success: false, error: `Este usuário não tem permissão para acessar o ${labels[permission] || 'painel'}.` });
  }

  res.json({ success: true, user: found });
});

app.delete('/api/whatsapp/agenda/appointments/:id', (req, res) => {
  const { id } = req.params;
  const db = loadDb();
  if (db.appointments) {
    db.appointments = db.appointments.filter((a) => a.id !== id);
    saveDb(db);
  }
  res.json({ success: true });
});

app.get('/api/whatsapp/agenda/available-slots', (req, res) => {
  const dateStr = req.query.date || new Date().toISOString().split('T')[0];
  const duration = Number(req.query.duration) || null;
  const db = loadDb();
  const slots = getAvailableSlots(dateStr, db, duration);
  res.json({ date: dateStr, available_slots: slots });
});

// 10. Flow Management REST Endpoints (Supabase Single-Source-of-Truth)
app.get('/api/whatsapp/flows', async (req, res) => {
  const db = loadDb();
  if (supabaseServer) {
    try {
      const { data: flowsData } = await supabaseServer.from('flows').select('*').order('updated_at', { ascending: false });
      if (flowsData && flowsData.length > 0) {
        db.flows = flowsData;
        saveDb(db);
        return res.json(flowsData);
      }
    } catch (e) {
      console.warn('[WhatsApp Server] Falha ao listar fluxos do Supabase:', e.message);
    }
  }
  res.json(db.flows || []);
});

app.post('/api/whatsapp/flows', async (req, res) => {
  try {
    const flow = req.body;
    const db = loadDb();
    if (!db.flows) db.flows = [];
    const updatedFlow = { ...flow, updated_at: new Date().toISOString() };
    const idx = db.flows.findIndex((f) => f.id === flow.id);
    if (idx >= 0) {
      db.flows[idx] = updatedFlow;
    } else {
      db.flows.unshift(updatedFlow);
    }
    saveDb(db);

    // Persist to Supabase
    if (supabaseServer) {
      try {
        await supabaseServer.from('flows').upsert(updatedFlow);
      } catch (sbErr) {
        console.warn('[WhatsApp Server] Falha ao salvar fluxo no Supabase:', sbErr.message);
      }
    }

    res.json({ success: true, flow: updatedFlow });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/whatsapp/flows/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = loadDb();
    if (db.flows) {
      db.flows = db.flows.filter((f) => f.id !== id);
    }
    if (db.nodes && db.nodes[id]) delete db.nodes[id];
    if (db.edges && db.edges[id]) delete db.edges[id];
    saveDb(db);

    if (supabaseServer) {
      try {
        await supabaseServer.from('flow_nodes').delete().eq('flow_id', id);
        await supabaseServer.from('flow_edges').delete().eq('flow_id', id);
        await supabaseServer.from('flows').delete().eq('id', id);
        console.log(`[WhatsApp Server] 🗑️ Fluxo ${id} removido do Supabase com sucesso.`);
      } catch (sbErr) {
        console.warn('[WhatsApp Server] Falha ao excluir fluxo do Supabase:', sbErr.message);
      }
    }

    res.json({ success: true, message: 'Fluxo excluído com sucesso' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/whatsapp/flows/:id/graph', async (req, res) => {
  const { id } = req.params;
  const db = loadDb();

  if (supabaseServer) {
    try {
      const [nodesRes, edgesRes] = await Promise.all([
        supabaseServer.from('flow_nodes').select('*').eq('flow_id', id),
        supabaseServer.from('flow_edges').select('*').eq('flow_id', id),
      ]);

      if (nodesRes.data && nodesRes.data.length > 0) {
        const nodes = nodesRes.data.map((d) => ({
          id: d.id,
          flow_id: d.flow_id,
          type: d.node_type || d.type,
          position: { x: Number(d.position_x || 0), y: Number(d.position_y || 0) },
          data: d.data || {},
        }));
        const edges = (edgesRes.data || []).map((e) => ({
          id: e.id,
          flow_id: e.flow_id,
          source: e.source_node_id || e.source,
          target: e.target_node_id || e.target,
          sourceHandle: e.source_handle || e.sourceHandle,
          targetHandle: e.target_handle || e.targetHandle,
          data: e.condition || e.data,
        }));

        if (!db.nodes) db.nodes = {};
        if (!db.edges) db.edges = {};
        db.nodes[id] = nodes;
        db.edges[id] = edges;
        saveDb(db);
        return res.json({ nodes, edges });
      }
    } catch (e) {
      console.warn('[WhatsApp Server] Falha ao carregar grafo do Supabase:', e.message);
    }
  }

  const nodes = db.nodes?.[id] || [];
  const edges = db.edges?.[id] || [];
  res.json({ nodes, edges });
});

app.post('/api/whatsapp/flows/:id/graph', async (req, res) => {
  try {
    const { id } = req.params;
    const { nodes, edges } = req.body;
    const db = loadDb();
    if (!db.nodes) db.nodes = {};
    if (!db.edges) db.edges = {};
    if (nodes) db.nodes[id] = nodes;
    if (edges) db.edges[id] = edges;

    // Reset active sessions so subsequent WhatsApp messages immediately run the updated graph
    db.sessions = {};
    saveDb(db);

    if (supabaseServer) {
      try {
        await supabaseServer.from('flow_nodes').delete().eq('flow_id', id);
        if (nodes && nodes.length > 0) {
          const insertNodes = nodes.map((n) => ({
            id: n.id,
            flow_id: id,
            node_type: n.data?.nodeType || n.type,
            position_x: n.position.x,
            position_y: n.position.y,
            data: n.data,
          }));
          await supabaseServer.from('flow_nodes').insert(insertNodes);
        }

        await supabaseServer.from('flow_edges').delete().eq('flow_id', id);
        if (edges && edges.length > 0) {
          const insertEdges = edges.map((e) => ({
            id: e.id,
            flow_id: id,
            source_node_id: e.source,
            target_node_id: e.target,
            source_handle: e.sourceHandle || null,
            target_handle: e.targetHandle || null,
            condition: e.data || null,
          }));
          await supabaseServer.from('flow_edges').insert(insertEdges);
        }

        await supabaseServer.from('flows').update({
          node_count: (nodes || []).length,
          updated_at: new Date().toISOString(),
        }).eq('id', id);
        console.log(`[WhatsApp Server] 💾 Grafo do fluxo ${id} salvo no Supabase com ${nodes?.length || 0} nós e ${edges?.length || 0} conexões.`);
      } catch (sbErr) {
        console.warn('[WhatsApp Server] Falha ao persistir grafo no Supabase:', sbErr.message);
      }
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/whatsapp/flows/:id/publish', async (req, res) => {
  try {
    const { id } = req.params;
    const db = loadDb();
    if (!db.flows) db.flows = [];
    
    let target = db.flows.find((f) => f.id === id);
    if (!target) {
      target = { id, name: 'Fluxo Ativo', status: 'published', updated_at: new Date().toISOString() };
      db.flows.unshift(target);
    }

    db.flows.forEach((f) => {
      if (f.id === id) {
        f.status = 'published';
      } else {
        f.status = 'paused';
      }
    });

    if (!db.nodes) db.nodes = {};
    if (!db.edges) db.edges = {};
    if (!db.nodes[id] || db.nodes[id].length === 0) {
      const sourceKey = Object.keys(db.nodes).find((k) => k !== id && (db.nodes[k] || []).length > 0);
      if (sourceKey) {
        db.nodes[id] = JSON.parse(JSON.stringify(db.nodes[sourceKey]));
        db.edges[id] = JSON.parse(JSON.stringify(db.edges[sourceKey] || []));
        console.log(`[WhatsApp Server] 🔄 Grafo herdado de ${sourceKey} para o fluxo ${id} (${db.nodes[id].length} nós).`);
      }
    }

    db.sessions = {};
    saveDb(db);

    if (supabaseServer) {
      try {
        await supabaseServer.from('flows').update({ status: 'paused', updated_at: new Date().toISOString() }).neq('id', id);
        await supabaseServer.from('flows').update({ status: 'published', updated_at: new Date().toISOString() }).eq('id', id);
        console.log(`[WhatsApp Server] 🚀 Fluxo ${id} gravado como PUBLICADO no Supabase!`);
      } catch (sbErr) {
        console.warn('[WhatsApp Server] Falha ao publicar fluxo no Supabase:', sbErr.message);
      }
    }

    console.log(`[WhatsApp Server] 🚀 Fluxo ${id} definido como PUBLICADO (ATIVO) no WhatsApp!`);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 10. Settings & Bot Profile Management (Sincronização em Tempo Real)
app.get('/api/whatsapp/settings', (req, res) => {
  const db = loadDb();
  res.json({
    settings: db.settings || {},
    botProfile: db.botProfile || {},
    agendaSettings: db.agendaSettings || {},
    attendants: db.attendants || [],
  });
});

app.post('/api/whatsapp/settings', async (req, res) => {
  try {
    const { settings, botProfile, agendaSettings } = req.body;
    const db = loadDb();

    if (settings) db.settings = { ...db.settings, ...settings };
    if (botProfile) db.botProfile = { ...db.botProfile, ...botProfile };
    if (agendaSettings) db.agendaSettings = { ...db.agendaSettings, ...agendaSettings };

    saveDb(db);
    console.log('[WhatsApp Server] ⚙️ Configurações e Perfil do Robô salvos com sucesso no banco de dados!');
    res.json({
      success: true,
      settings: db.settings,
      botProfile: db.botProfile,
      agendaSettings: db.agendaSettings,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/whatsapp/profile', (req, res) => {
  const db = loadDb();
  res.json(db.botProfile || {});
});

app.post('/api/whatsapp/profile', (req, res) => {
  try {
    const profile = req.body;
    const db = loadDb();
    db.botProfile = { ...(db.botProfile || {}), ...profile };
    saveDb(db);
    console.log('[WhatsApp Server] 🤖 Perfil do Robô atualizado no banco de dados:', db.botProfile.name || 'Assistente');
    res.json({ success: true, botProfile: db.botProfile });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 11. Sync Flows
app.post('/api/whatsapp/sync-flows', async (req, res) => {
  try {
    const { flows, nodes, edges, botProfile, agendaSettings } = req.body;
    const db = loadDb();

    if (flows) db.flows = flows;
    if (nodes) db.nodes = { ...db.nodes, ...nodes };
    if (edges) db.edges = { ...db.edges, ...edges };
    if (botProfile) db.botProfile = { ...db.botProfile, ...botProfile };
    if (agendaSettings) db.agendaSettings = { ...db.agendaSettings, ...agendaSettings };

    db.sessions = {};
    saveDb(db);

    if (supabaseServer) {
      try {
        if (flows && flows.length > 0) {
          for (const f of flows) {
            await supabaseServer.from('flows').upsert({ ...f, updated_at: new Date().toISOString() });
          }
        }
        if (botProfile) {
          await supabaseServer.from('settings').upsert({
            id: 'default',
            bot_profile: botProfile,
            agenda_settings: agendaSettings || db.agendaSettings,
            business_name: botProfile.company_name || 'Talvane Barber',
            updated_at: new Date().toISOString(),
          });
        }
      } catch (sbErr) {
        console.warn('[WhatsApp Server] Falha ao sincronizar fluxos no Supabase:', sbErr.message);
      }
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 12. Attendants Management (Central de Atendimento & Métricas)
app.get('/api/whatsapp/attendants', (req, res) => {
  const db = loadDb();
  res.json(db.attendants || []);
});

app.post('/api/whatsapp/attendants', (req, res) => {
  try {
    const attendant = req.body;
    if (!attendant || !attendant.id) {
      return res.status(400).json({ error: 'Dados de atendente inválidos' });
    }
    const db = loadDb();
    if (!db.attendants) db.attendants = [];
    const index = db.attendants.findIndex((a) => a.id === attendant.id);
    if (index >= 0) {
      db.attendants[index] = { ...db.attendants[index], ...attendant, updated_at: new Date().toISOString() };
    } else {
      db.attendants.unshift({ ...attendant, created_at: new Date().toISOString() });
    }
    saveDb(db);
    res.json({ success: true, attendant });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/whatsapp/attendants/:id', (req, res) => {
  try {
    const { id } = req.params;
    const db = loadDb();
    if (db.attendants) {
      db.attendants = db.attendants.filter((a) => a.id !== id);
      saveDb(db);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 13. Serve Frontend Production Build (Discloud / Cloud Hosting)
function healFlatExtractedFiles(baseDir) {
  try {
    if (!fs.existsSync(baseDir)) return;
    const entries = fs.readdirSync(baseDir);
    const backslashFiles = entries.filter((name) => name.startsWith('dist\\') || name.startsWith('dist/'));
    if (backslashFiles.length > 0) {
      const targetDist = path.resolve(baseDir, 'dist');
      if (!fs.existsSync(targetDist)) fs.mkdirSync(targetDist, { recursive: true });
      for (const rawName of backslashFiles) {
        const relativeName = rawName.replace(/^dist[\\\/]/, '').replace(/\\/g, '/');
        const targetFilePath = path.resolve(targetDist, relativeName);
        const targetFileDir = path.dirname(targetFilePath);
        if (!fs.existsSync(targetFileDir)) fs.mkdirSync(targetFileDir, { recursive: true });
        const sourcePath = path.resolve(baseDir, rawName);
        if (fs.existsSync(sourcePath) && !fs.existsSync(targetFilePath)) {
          fs.copyFileSync(sourcePath, targetFilePath);
        }
      }
      console.log(`[WhatsApp Server] 🛠️ Auto-recuperação da pasta dist realizada com ${backslashFiles.length} arquivos.`);
    }
  } catch (err) {
    console.warn('[WhatsApp Server] Aviso ao verificar auto-recuperação da pasta dist:', err?.message || err);
  }
}

healFlatExtractedFiles(ROOT_DIR);
healFlatExtractedFiles(process.cwd());

const possibleDistPaths = [
  path.resolve(ROOT_DIR, 'dist'),
  path.resolve(process.cwd(), 'dist'),
  path.resolve(__dirname, 'dist'),
  path.resolve(__dirname, '../dist')
];

const validDistPath = possibleDistPaths.find((p) => {
  try {
    return fs.existsSync(p) && fs.existsSync(path.join(p, 'index.html'));
  } catch {
    return false;
  }
});

if (validDistPath) {
  const indexHtmlFile = path.resolve(validDistPath, 'index.html');
  console.log(`[WhatsApp Server] 🌐 Servindo painel admin estático a partir de: ${validDistPath}`);
  
  app.use(express.static(validDistPath, {
    index: false,
    maxAge: '1h'
  }));

  // Serve SPA index.html for all non-API GET routes
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    if (fs.existsSync(indexHtmlFile)) {
      res.sendFile(indexHtmlFile, (err) => {
        if (err) {
          console.error('[WhatsApp Server] Erro ao enviar index.html:', err?.message || err);
          if (!res.headersSent) res.status(500).send('Erro ao carregar o painel administrativo.');
        }
      });
    } else {
      next();
    }
  });
} else {
  console.warn('[WhatsApp Server] ⚠️ Pasta dist com index.html não encontrada! Ativando página de contingência.');
  
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.send(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <title>7 Assistente — Painel WhatsApp</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { background: #0b0f19; color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
    .card { background: #111827; border: 1px solid #374151; border-radius: 16px; padding: 32px; max-width: 500px; width: 100%; text-align: center; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5); }
    h1 { font-size: 22px; color: #60a5fa; margin-bottom: 10px; }
    p { color: #9ca3af; font-size: 14px; line-height: 1.6; margin-bottom: 24px; }
    .btn { display: inline-block; background: #2563eb; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; transition: background 0.2s; }
    .btn:hover { background: #1d4ed8; }
    .badge { display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px; background: rgba(16, 185, 129, 0.1); border: 1px solid #059669; border-radius: 9999px; color: #10b981; font-size: 12px; font-weight: 600; margin-bottom: 20px; }
    .dot { width: 8px; height: 8px; border-radius: 50%; background: #10b981; }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge"><span class="dot"></span> Backend WhatsApp Ativo</div>
    <h1>🤖 7 Assistente WhatsApp</h1>
    <p>O servidor backend do bot está conectado e processando mensagens com sucesso na nuvem.</p>
    <a href="https://talvane.malaca.com.br" class="btn">Acessar Painel Administrativo</a>
  </div>
</body>
</html>`);
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[WhatsApp Server] Servidor de Conexão e Motor de Fluxos rodando na porta ${PORT} (0.0.0.0)`);
  hydrateFromSupabase();
  startWhatsApp().catch((err) => {
    console.error('[WhatsApp Server] Erro capturado ao iniciar WhatsApp:', err?.message || err);
  });
});

