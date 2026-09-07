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

if (!fs.existsSync(AUTH_DIR)) {
  fs.mkdirSync(AUTH_DIR, { recursive: true });
}

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

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Servir arquivos estáticos do dist (Frontend compilado)
const distPath = path.resolve(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
}

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
// BAILEYS WHATSAPP CONNECTION ENGINE
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
        } catch (e) {
          console.error('Erro ao gerar dataURL do QR:', e);
        }
        console.log('📱 [Baileys] Novo QR Code gerado pronto para leitura!');
      }

      if (connection === 'close') {
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
        console.log(`⚠️ [Baileys] Conexão encerrada (código: ${statusCode}). Reconectar? ${shouldReconnect}`);
        
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

    // Handle Incoming Messages
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
      if (type !== 'notify') return;

      for (const msg of messages) {
        if (!msg.message || msg.key.fromMe) continue;

        const remoteJid = msg.key.remoteJid || '';
        if (remoteJid.includes('@g.us')) continue; // Ignore groups

        const clientPhone = remoteJid.replace('@s.whatsapp.net', '').replace(/\D/g, '');
        const clientName = msg.pushName || 'Cliente Pitoco';
        
        // Extract text
        const text = msg.message.conversation || 
                     msg.message.extendedTextMessage?.text || 
                     msg.message.buttonsResponseMessage?.selectedButtonId ||
                     msg.message.templateButtonReplyMessage?.selectedId ||
                     '';

        console.log(`📩 [WhatsApp Recebido] De: ${clientPhone} (${clientName}) -> "${text}"`);

        // Record message in Supabase
        await recordMessageInSupabase({
          phone: clientPhone,
          name: clientName,
          direction: 'inbound',
          content: text,
        });

        // Run Bot Logic
        await handleBotFlow(clientPhone, clientName, text, remoteJid);
      }
    });

  } catch (err) {
    console.error('❌ [Baileys] Erro crítico ao iniciar socket:', err);
    connectionStatus = 'error';
    setTimeout(startWhatsApp, 10000);
  }
}

// Bot logic & state machine
async function handleBotFlow(phone, clientName, incomingText, remoteJid) {
  const clean = incomingText.trim();
  const lower = clean.toLowerCase();

  let session = clientSessions.get(phone) || { step: 'IDLE' };

  if (clean === '0' || lower === 'menu' || lower === 'oi' || lower === 'olá' || session.step === 'IDLE') {
    session = { step: 'MAIN_MENU' };
    clientSessions.set(phone, session);

    const welcome = 
      `👶✨ *PITOCO DE GENTE — Roupas de Bebê & Enxovais*\n` +
      `Olá, *${clientName}*! Bem-vindo(a) à nossa loja oficial! Como podemos te ajudar hoje?\n\n` +
      `Digite o número da opção desejada:\n\n` +
      `1️⃣ *Ver Catálogo de Produtos* (Bodies, Macacões com Zíper Duplo, Saídas, Kits de Berço)\n` +
      `2️⃣ *Guia de Medidas* (Tamanhos RN a 3 anos com peso e altura)\n` +
      `3️⃣ *Checklist da Mala de Maternidade*\n` +
      `4️⃣ *Consultoria VIP de Enxoval* (Agendamento personalizado)\n` +
      `5️⃣ *Cálculo de Frete & Entrega* (Motoboy / Correios / Retirada)\n` +
      `6️⃣ *Pagamento via PIX* (Chave & QR Code Copia e Cola)\n` +
      `7️⃣ *Falar com Atendente Humana* (Escolha sua loja de preferência)\n\n` +
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
      const cat = 
        `🛍️ *DESTAQUES DO CATÁLOGO PITOCO DE GENTE*\n\n` +
        `1. *Body Manga Longa Suedine 100% Pima* — R$ 39,90\n` +
        `2. *Macacão Canelado com Zíper Duplo Soft* — R$ 69,90\n` +
        `3. *Saída de Maternidade Tricot Luxo Realeza (4 Peças)* — R$ 169,90\n` +
        `4. *Kit Berço Algodão 400 Fios Trança Nuvem* — R$ 259,90\n` +
        `5. *Mala Maternidade Térmica Master Impermeável* — R$ 199,90\n\n` +
        `_Digite o número do produto (1 a 5) para detalhes ou *0* para voltar ao Menu._`;
      await sendWhatsAppMessage(remoteJid, cat);
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
      const frete = 
        `🚚 *OPÇÕES DE ENTREGA & FRETE*\n\n` +
        `🛵 *Motoboy Express (Recife e Região)*: R$ 15,00 (Grátis acima de R$ 250)\n` +
        `📦 *Correios SEDEX / PAC (Todo o Brasil)*: R$ 24,90 (Grátis acima de R$ 299)\n` +
        `🏬 *Retirada Grátis em Loja*: Matriz Centro ou Shopping Boulevard\n\n` +
        `_Digite *0* para voltar ao Menu._`;
      await sendWhatsAppMessage(remoteJid, frete);
      return;
    } else if (clean === '6') {
      const pix = 
        `💳 *PAGAMENTO VIA PIX OFICIAL*\n\n` +
        `Chave PIX (E-mail): *financeiro@pitocodegente.com.br*\n` +
        `Favorecido: *Pitoco de Gente Artigos Infantis LTDA*\n` +
        `Banco: *Banco Inter / Efí*\n\n` +
        `📋 *Código Copia e Cola:*\n` +
        `\`\`\`00020126580014BR.GOV.BCB.PIX0136financeiro@pitocodegente.com.br5204000053039865802BR5925Pitoco de Gente Artigos6006Recife62070503***6304\`\`\`\n\n` +
        `_Após a transferência, envie o comprovante por aqui!_`;
      await sendWhatsAppMessage(remoteJid, pix);
      return;
    } else if (clean === '7') {
      session.step = 'HANDOFF_STORE';
      clientSessions.set(phone, session);
      const handoff = 
        `👩‍💼 *ATENDIMENTO HUMANO — ESCOLHA SUA LOJA*\n\n` +
        `1️⃣ *Loja Matriz — Centro* (Rua do Sol, 120)\n` +
        `2️⃣ *Loja Shopping Boulevard* (Piso L2, Loja 204)\n` +
        `3️⃣ *Atendimento Geral / E-commerce* (Digital)\n\n` +
        `_Digite 1, 2 ou 3:_`;
      await sendWhatsAppMessage(remoteJid, handoff);
      return;
    }
  }

  if (session.step === 'HANDOFF_STORE') {
    let chosenStore = null;
    if (clean === '1') chosenStore = STORES[0];
    else if (clean === '2') chosenStore = STORES[1];
    else if (clean === '3') chosenStore = STORES[2];

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
        `Uma consultora desta unidade já está com o seu atendimento em aberto e vai te responder aqui mesmo em alguns instantes! 💕`;

      await sendWhatsAppMessage(remoteJid, confirm);

      // Create support ticket & update conversation in Supabase
      await createTicketInSupabase({
        store_id: chosenStore.id,
        phone,
        client_name: clientName,
        protocol,
        subject: `Atendimento WhatsApp solicitado para ${chosenStore.name}`,
      });

      return;
    }
  }

  // Fallback
  await sendWhatsAppMessage(
    remoteJid, 
    `Opção não reconhecida. Digite *0* para ver o Menu Principal da Pitoco de Gente.`
  );
}

// Helpers for WhatsApp Sending & Supabase Sync
async function sendWhatsAppMessage(jid, text) {
  if (!sock || connectionStatus !== 'connected') {
    console.warn(`[Baileys] Socket não conectado para enviar a ${jid}`);
    return false;
  }
  try {
    await sock.sendMessage(jid, { text });
    await recordMessageInSupabase({
      phone: jid.replace('@s.whatsapp.net', ''),
      direction: 'outbound',
      content: text,
      author_name: 'Pitoco Bot',
    });
    return true;
  } catch (err) {
    console.error(`[Baileys] Erro ao enviar mensagem para ${jid}:`, err);
    return false;
  }
}

async function recordMessageInSupabase({ phone, name, direction, content, author_name }) {
  if (!supabase) return;
  try {
    const cleanPhone = String(phone).replace(/\D/g, '');
    const convId = `conv-${cleanPhone}`;

    // Upsert client
    await supabase.from('clients').upsert({
      id: `client-${cleanPhone}`,
      name: name || 'Cliente WhatsApp',
      phone: cleanPhone,
      last_interaction: new Date().toISOString(),
    }, { onConflict: 'phone' }).catch(() => {});

    // Upsert conversation
    await supabase.from('conversations').upsert({
      id: convId,
      phone: cleanPhone,
      client_name: name || 'Cliente WhatsApp',
      last_message: content,
      last_message_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' }).catch(() => {});

    // Insert chat message
    await supabase.from('chat_messages').insert([{
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      conversation_id: convId,
      direction,
      content,
      author_name: author_name || (direction === 'inbound' ? name : 'Pitoco Bot'),
      created_at: new Date().toISOString(),
    }]).catch(() => {});
  } catch (e) {
    // Non-blocking
  }
}

async function createTicketInSupabase({ store_id, phone, client_name, protocol, subject }) {
  if (!supabase) return;
  try {
    const cleanPhone = String(phone).replace(/\D/g, '');
    await supabase.from('support_tickets').insert([{
      id: `ticket-${Date.now()}`,
      store_id,
      client_id: `client-${cleanPhone}`,
      conversation_id: `conv-${cleanPhone}`,
      protocol,
      subject,
      status: 'open',
      priority: 'high',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }]).catch(() => {});

    await supabase.from('conversations').update({
      status: 'waiting_human',
      store_id,
      updated_at: new Date().toISOString(),
    }).eq('id', `conv-${cleanPhone}`).catch(() => {});
  } catch (e) {}
}

// ==============================================================================
// REST API ENDPOINTS
// ==============================================================================

// 1. GET /
app.get('/', (req, res) => {
  res.json({
    app: 'Pitoco de Gente WhatsApp Bot API',
    version: '2.0.0',
    status: 'online',
    whatsapp: {
      status: connectionStatus,
      phone: connectedPhone,
      name: connectedName,
      connectedAt,
    },
    stores: STORES.map(s => ({ id: s.id, name: s.name, slug: s.slug })),
    docs: 'https://pitoco.malaca.com.br',
  });
});

// 2. GET /health
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    whatsapp_status: connectionStatus,
  });
});

// 3. GET /api/whatsapp/qr
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

// Backward compatibility alias: GET /api/whatsapp/status
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

// 4. POST /api/whatsapp/qr (Trigger reconnection / QR regeneration)
app.post('/api/whatsapp/qr', async (req, res) => {
  try {
    if (connectionStatus !== 'connected') {
      startWhatsApp();
    }
    res.json({
      success: true,
      message: 'Processo de geração de QR Code iniciado',
      status: connectionStatus,
      qr: currentQR,
      qrDataUrl: currentQRDataUrl,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err?.message || err });
  }
});

// 5. POST /api/send-message
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

// 6. GET /api/stores
app.get('/api/stores', (req, res) => {
  res.json(STORES);
});

// 7. POST /api/whatsapp/disconnect
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

// Start listening on 0.0.0.0:8080
app.listen(PORT, HOST, () => {
  console.log(`🚀 [Pitoco Backend] Servidor rodando em http://${HOST}:${PORT}`);
  startWhatsApp();
});
