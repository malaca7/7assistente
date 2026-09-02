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
import { createClient } from '@supabase/supabase-js';
import { 
  executePublishedFlow, 
  loadDb, 
  saveDb, 
  recordRealMessage, 
  getLiveConversations, 
  getLiveMessages, 
  getLiveContacts,
  getAvailableSlots
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

const supabaseServer = (SUPABASE_URL && SUPABASE_ANON_KEY) ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

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

// Send message (supports text, native buttons, and rich media)
async function sendWhatsAppMessage(jid, reply) {
  if (!sock) return;

  // 1. Interactive Button Message
  if (typeof reply === 'object' && reply.type === 'buttons') {
    const rawButtons = reply.buttons || [];
    const buttonLines = rawButtons.map((b, idx) => `*${idx + 1}️⃣* ${b.title}`).join('\n');
    const footerText = reply.footer ? `\n\n_${reply.footer}_` : '';
    const fullButtonText = `${reply.body}\n\n${buttonLines}${footerText}\n\n_👉 Toque no botão ou digite o número correspondente._`;

    let sentNative = false;

    // Try sending native Baileys template/quick-reply buttons
    try {
      await sock.sendMessage(jid, {
        text: `${reply.body}\n\n${buttonLines}${footerText}`,
        footer: reply.footer || '7 Assistente',
        buttons: rawButtons.map((b, idx) => ({
          buttonId: b.id || `btn_${idx + 1}`,
          buttonText: { displayText: b.title },
          type: 1,
        })),
        headerType: 1,
      });
      sentNative = true;
      console.log(`[WhatsApp Outbound] 🔘 Botões enviados para ${jid}: ${rawButtons.map((b) => b.title).join(' | ')}`);
    } catch (err) {
      console.warn('[WhatsApp Outbound] Envio de botões nativos falhou:', err.message);
    }

    // If native buttons fail, send the rich formatted button message
    if (!sentNative) {
      await sock.sendMessage(jid, { text: fullButtonText });
      console.log(`[WhatsApp Outbound] 🔘 Menu de opções enviado com sucesso para ${jid}`);
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

            // Native flow interactive response
            if (msg.message?.interactiveResponseMessage?.nativeFlowResponseMessage?.paramsJson) {
              try {
                const params = JSON.parse(msg.message.interactiveResponseMessage.nativeFlowResponseMessage.paramsJson);
                if (params.id) messageContent = params.id;
              } catch {}
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

// 4. Send Message from Web Frontend
app.post('/api/whatsapp/send', async (req, res) => {
  try {
    const { phone, text } = req.body;
    if (!sock || connectionState.status !== 'connected') {
      return res.status(400).json({ error: 'WhatsApp não está conectado' });
    }
    const cleanPhone = phone.replace(/\D/g, '');
    const jid = cleanPhone.includes('@') ? cleanPhone : `${cleanPhone}@s.whatsapp.net`;
    const result = await sock.sendMessage(jid, { text });

    // Record outbound human message to DB
    recordRealMessage(cleanPhone, 'Admin', 'outbound', text);

    res.json({ success: true, result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Get Real Live Conversations
app.get('/api/whatsapp/conversations', (req, res) => {
  const convs = getLiveConversations();
  res.json(convs);
});

// 6. Get Real Live Messages for Conversation
app.get('/api/whatsapp/messages/:convId', (req, res) => {
  const { convId } = req.params;
  const msgs = getLiveMessages(convId);
  res.json(msgs);
});

// 7. Get Real Registered Contacts
app.get('/api/whatsapp/contacts', (req, res) => {
  const contacts = getLiveContacts();
  res.json(contacts);
});

// 8. Save / Update / Delete Contact
app.post('/api/whatsapp/contacts', (req, res) => {
  const contact = req.body;
  const db = loadDb();
  if (!db.contacts) db.contacts = {};
  const cleanPhone = (contact.phone || '').replace(/\D/g, '');
  if (cleanPhone) {
    db.contacts[cleanPhone] = {
      ...contact,
      phone: cleanPhone,
      updated_at: new Date().toISOString(),
    };
    saveDb(db);
  }
  res.json({ success: true, contact: db.contacts[cleanPhone] });
});

app.delete('/api/whatsapp/contacts/:id', (req, res) => {
  const { id } = req.params;
  const phoneQuery = req.query.phone || '';
  const db = loadDb();

  if (db.contacts) {
    const targets = [
      String(id),
      String(id).replace('contact-', ''),
      String(id).replace(/\D/g, ''),
      String(phoneQuery),
      String(phoneQuery).replace(/\D/g, ''),
    ].filter(Boolean);

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
  const newApt = {
    ...appointment,
    id: appointment.id || `apt-${Date.now()}`,
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
      db.appointments[idx] = { ...db.appointments[idx], ...updates };
      saveDb(db);
      return res.json({ success: true, appointment: db.appointments[idx] });
    }
  }
  res.status(404).json({ error: 'Agendamento não encontrado' });
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
  const db = loadDb();
  const slots = getAvailableSlots(dateStr, db);
  res.json({ date: dateStr, available_slots: slots });
});

// 10. Sync Flows
app.post('/api/whatsapp/sync-flows', (req, res) => {
  try {
    const { flows, nodes, edges, botProfile } = req.body;
    const db = loadDb();

    if (flows) db.flows = flows;
    if (nodes) db.nodes = { ...db.nodes, ...nodes };
    if (edges) db.edges = { ...db.edges, ...edges };
    if (botProfile) db.botProfile = { ...db.botProfile, ...botProfile };

    saveDb(db);
    console.log('[WhatsApp Server] ✅ Fluxos e nós sincronizados com sucesso do Painel Administrativo!');
    res.json({ success: true, message: 'Fluxos atualizados no motor do WhatsApp' });
  } catch (err) {
    console.error('[WhatsApp Server] Erro ao sincronizar fluxos:', err);
    res.status(500).json({ error: err.message });
  }
});

// 11. Serve Frontend Production Build (Discloud / Cloud Hosting)
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
  startWhatsApp().catch((err) => {
    console.error('[WhatsApp Server] Erro capturado ao iniciar WhatsApp:', err?.message || err);
  });
});

