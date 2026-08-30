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

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

const PORT = process.env.PORT || 3001;

if (!fs.existsSync(AUTH_FOLDER)) {
  fs.mkdirSync(AUTH_FOLDER, { recursive: true });
}

let sock = null;
let currentQR = null;
let currentQRDataUrl = null;
let connectionState = {
  status: 'disconnected',
  phone: null,
  name: null,
  connectedAt: null,
  batteryLevel: 95,
};

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
  try {
    const { state, saveCreds } = await useMultiFileAuthState(AUTH_FOLDER);
    const { version } = await fetchLatestBaileysVersion().catch(() => ({ version: [2, 3000, 1015901307] }));

    sock = makeWASocket({
      version,
      auth: state,
      printQRInTerminal: true,
      logger: pino({ level: 'silent' }),
      browser: ['7 Assistente', 'Chrome', '120.0.0'],
      syncFullHistory: false,
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        currentQR = qr;
        currentQRDataUrl = await QRCode.toDataURL(qr, { margin: 2, scale: 8 });
        connectionState.status = 'qrcode';
        console.log('[WhatsApp Server] Novo QR Code real gerado!');
      }

      if (connection === 'close') {
        const statusCode = (lastDisconnect?.error)?.output?.statusCode;
        const errorReason = lastDisconnect?.error?.message || lastDisconnect?.error?.output?.payload?.message || '';
        const isReplaced = statusCode === DisconnectReason.connectionReplaced || statusCode === 440;
        const isLoggedOut = statusCode === DisconnectReason.loggedOut || statusCode === 401;

        console.log(`[WhatsApp Server] Conexão encerrada (Status: ${statusCode || 'unknown'}, Motivo: ${errorReason || 'Nenhum'})`);
        
        connectionState.status = 'disconnected';
        currentQR = null;
        currentQRDataUrl = null;

        if (isLoggedOut) {
          console.log('[WhatsApp Server] ❌ Sessão deslogada do WhatsApp. Limpando credenciais...');
          try {
            if (fs.existsSync(AUTH_FOLDER)) {
              fs.rmSync(AUTH_FOLDER, { recursive: true, force: true });
            }
          } catch (e) {}
          setTimeout(startWhatsApp, 3000);
        } else if (isReplaced) {
          console.warn('[WhatsApp Server] ⚠️ AVISO: Sessão conectada em outra instância (ex: Discloud ou outro terminal). Aguardando 30s para evitar conflito de conexão.');
          setTimeout(startWhatsApp, 30000);
        } else {
          // Normal transient disconnect, reconnect in 5s
          setTimeout(startWhatsApp, 5000);
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
        console.log(`[WhatsApp Server] ✅ SUCESSO! WhatsApp Conectado e Executando Fluxos Publicados: ${phone} (${name})`);
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

// 1. Status & Live QR Code
app.get('/api/whatsapp/status', (req, res) => {
  res.json({
    ...connectionState,
    qr: currentQR,
    qrDataUrl: currentQRDataUrl,
  });
});

// 2. Start / Restart
app.post('/api/whatsapp/start', async (req, res) => {
  if (connectionState.status !== 'connected') {
    startWhatsApp();
  }
  res.json({ success: true, message: 'Serviço do WhatsApp iniciado' });
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
const distPath = path.resolve(ROOT_DIR, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.resolve(distPath, 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[WhatsApp Server] Servidor de Conexão e Motor de Fluxos rodando na porta ${PORT} (0.0.0.0)`);
  startWhatsApp();
});
