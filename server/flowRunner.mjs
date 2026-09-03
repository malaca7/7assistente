import './websocketPolyfill.mjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
let createClient = null;
try {
  const mod = await import('@supabase/supabase-js');
  createClient = mod.createClient;
} catch (e) {}

const WebSocketClient = globalThis.WebSocket;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.resolve(__dirname, 'flows_db.json');

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://nskflvulclgwqqasdntq.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5za2ZsdnVsY2xnd3FxYXNkbnRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgwMTQ0NjQsImV4cCI6MjEwMzU5MDQ2NH0.mL82cgH4MadNi_sTeKKgYmRAuhmp7HqImuAs9hTrTZI';

export const supabaseClient = (createClient && SUPABASE_URL && SUPABASE_ANON_KEY) 
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false },
      realtime: WebSocketClient ? { transport: WebSocketClient } : undefined
    }) 
  : null;

// Async Supabase Sync Helpers
export async function syncContactToSupabase(contact) {
  if (!supabaseClient || !contact) return;
  try {
    const cleanPhone = String(contact.phone || '').replace(/\D/g, '');
    if (!cleanPhone) return;
    const payload = {
      id: contact.id || `contact-${cleanPhone}`,
      name: contact.name || 'Cliente WhatsApp',
      phone: cleanPhone,
      email: contact.email || null,
      status: contact.status || 'active',
      is_registered: contact.is_registered !== false,
      profile_picture_url: contact.profile_picture_url || null,
      tags: contact.tags || ['Cliente'],
      custom_fields: contact.custom_fields || contact.metadata || {},
      last_interaction: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    await supabaseClient.from('contacts').upsert(payload, { onConflict: 'phone' });
  } catch (err) {
    // Non-blocking
  }
}

export async function syncConversationToSupabase(conv) {
  if (!supabaseClient || !conv) return;
  try {
    const cleanPhone = String(conv.contact_phone || conv.phone || '').replace(/\D/g, '');
    const payload = {
      id: conv.id || `conv-${cleanPhone}`,
      contact_id: conv.contact_id || `contact-${cleanPhone}`,
      phone: cleanPhone,
      contact_name: conv.contact_name || 'Cliente',
      last_message: typeof conv.last_message === 'string' ? conv.last_message : (conv.last_message?.body || 'Mensagem'),
      last_message_at: conv.last_message_at || new Date().toISOString(),
      status: conv.status || 'bot',
      unread_count: conv.unread_count || 0,
      tags: conv.tags || ['WhatsApp'],
      updated_at: new Date().toISOString(),
    };
    await supabaseClient.from('conversations').upsert(payload, { onConflict: 'id' });
  } catch (err) {
    // Non-blocking
  }
}

export async function syncMessageToSupabase(msg, phone) {
  if (!supabaseClient || !msg) return;
  try {
    const cleanPhone = String(phone || '').replace(/\D/g, '');
    const payload = {
      id: msg.id,
      conversation_id: msg.conversation_id || `conv-${cleanPhone}`,
      contact_id: `contact-${cleanPhone}`,
      phone: cleanPhone,
      sender: msg.direction === 'inbound' ? 'user' : (msg.sender || 'bot'),
      text: typeof msg.content === 'string' ? msg.content : (msg.content?.body || 'Mensagem'),
      type: msg.message_type || 'text',
      status: msg.status || 'delivered',
      timestamp: msg.created_at || new Date().toISOString(),
      created_at: msg.created_at || new Date().toISOString(),
    };
    await supabaseClient.from('messages').upsert(payload, { onConflict: 'id' });
  } catch (err) {
    // Non-blocking
  }
}

export async function syncAppointmentToSupabase(apt) {
  if (!supabaseClient || !apt) return;
  try {
    const cleanPhone = String(apt.contact_phone || apt.phone || '').replace(/\D/g, '');
    const payload = {
      id: apt.id || `apt-${Date.now()}`,
      contact_id: apt.contact_id || `contact-${cleanPhone}`,
      contact_name: apt.contact_name || 'Cliente',
      phone: cleanPhone,
      service_name: apt.service_name || 'Atendimento Especialista',
      professional_name: apt.professional_name || 'Talvane',
      date: apt.appointment_date || apt.date || new Date().toISOString().split('T')[0],
      time: apt.appointment_time || apt.time || '08:00',
      duration_minutes: apt.duration_minutes || 30,
      price: apt.price || 0,
      status: apt.status || 'confirmed',
      notes: apt.notes || null,
      updated_at: new Date().toISOString(),
    };
    await supabaseClient.from('appointments').upsert(payload, { onConflict: 'id' });
  } catch (err) {
    // Non-blocking
  }
}


const DEFAULT_AGENDA_SETTINGS = {
  business_days: ['1', '2', '3', '4', '5'], // Monday to Friday
  start_time: '08:00',
  end_time: '18:00',
  slot_duration_minutes: 30,
  break_start_time: '12:00',
  break_end_time: '13:00',
  services: [
    { id: 'srv-1', name: 'Atendimento Especialista', duration_minutes: 30, price: 150 },
    { id: 'srv-2', name: 'Demonstração da Plataforma', duration_minutes: 45, price: 0 },
    { id: 'srv-3', name: 'Suporte & Configuração', duration_minutes: 30, price: 80 },
  ],
};

function migrateLidContacts(db) {
  if (!db || !db.contacts) return;
  const authDir = path.resolve(__dirname, 'whatsapp_auth');

  for (const key of Object.keys(db.contacts)) {
    if (key.length >= 14 && (key.startsWith('168') || key.startsWith('219'))) {
      const reverseFile = path.resolve(authDir, `lid-mapping-${key}_reverse.json`);
      if (fs.existsSync(reverseFile)) {
        try {
          const realPhone = String(JSON.parse(fs.readFileSync(reverseFile, 'utf8'))).replace(/\D/g, '');
          if (realPhone && realPhone.length >= 8) {
            const oldContact = db.contacts[key];
            db.contacts[realPhone] = {
              ...oldContact,
              id: `contact-${realPhone}`,
              phone: realPhone,
              updated_at: new Date().toISOString(),
            };
            delete db.contacts[key];

            if (db.conversations && db.conversations[`conv-${key}`]) {
              const oldConv = db.conversations[`conv-${key}`];
              db.conversations[`conv-${realPhone}`] = {
                ...oldConv,
                id: `conv-${realPhone}`,
                contact_id: `contact-${realPhone}`,
                contact_phone: realPhone,
              };
              delete db.conversations[`conv-${key}`];
            }

            if (db.messages && db.messages[`conv-${key}`]) {
              db.messages[`conv-${realPhone}`] = db.messages[`conv-${key}`].map((m) => ({
                ...m,
                conversation_id: `conv-${realPhone}`,
              }));
              delete db.messages[`conv-${key}`];
            }
            console.log(`[FlowRunner] 🔄 Contato migrado de LID ${key} para o número real: ${realPhone}`);
          }
        } catch (e) {}
      }
    }
  }
}

const AUTH_DIR = path.resolve(__dirname, 'whatsapp_auth');
const BACKUP_DB_PATH = path.resolve(AUTH_DIR, 'flows_db_backup.json');

export function loadDb() {
  let parsed = null;
  try {
    if (fs.existsSync(DB_PATH)) {
      const data = fs.readFileSync(DB_PATH, 'utf-8');
      parsed = JSON.parse(data);
    }
  } catch (err) {
    console.error('[FlowRunner] Erro ao ler flows_db.json:', err);
  }

  // Restore & Merge from Persistent WhatsApp Auth Backup (never deleted during deploys)
  try {
    if (fs.existsSync(BACKUP_DB_PATH)) {
      const backupData = JSON.parse(fs.readFileSync(BACKUP_DB_PATH, 'utf-8'));
      if (backupData) {
        if (!parsed) {
          parsed = backupData;
        } else {
          if (backupData.botProfile && Object.keys(backupData.botProfile).length > 0) {
            parsed.botProfile = { ...parsed.botProfile, ...backupData.botProfile };
          }
          if (backupData.settings && Object.keys(backupData.settings).length > 0) {
            parsed.settings = { ...parsed.settings, ...backupData.settings };
          }
          if (backupData.contacts && Object.keys(backupData.contacts).length > 0) {
            parsed.contacts = { ...backupData.contacts, ...parsed.contacts };
          }
          if (backupData.conversations && Object.keys(backupData.conversations).length > 0) {
            parsed.conversations = { ...backupData.conversations, ...parsed.conversations };
          }
          if (backupData.attendants && backupData.attendants.length > 0) {
            parsed.attendants = backupData.attendants;
          }
        }
      }
    }
  } catch (bErr) {
    // Ignore backup read error
  }

  if (parsed) {
    migrateLidContacts(parsed);
    return {
      flows: parsed.flows || [],
      nodes: parsed.nodes || {},
      edges: parsed.edges || {},
      botProfile: parsed.botProfile || {},
      settings: parsed.settings || {},
      sessions: parsed.sessions || {},
      appointments: parsed.appointments || [],
      contacts: parsed.contacts || {},
      conversations: parsed.conversations || {},
      messages: parsed.messages || {},
      attendants: parsed.attendants || [],
      agendaSettings: parsed.agendaSettings || DEFAULT_AGENDA_SETTINGS,
    };
  }

  return {
    flows: [],
    nodes: {},
    edges: {},
    botProfile: {},
    settings: {},
    sessions: {},
    appointments: [],
    contacts: {},
    conversations: {},
    messages: {},
    attendants: [],
    agendaSettings: DEFAULT_AGENDA_SETTINGS,
  };
}

export function saveDb(data) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
    if (!fs.existsSync(AUTH_DIR)) {
      fs.mkdirSync(AUTH_DIR, { recursive: true });
    }
    fs.writeFileSync(BACKUP_DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('[FlowRunner] Erro ao salvar flows_db.json:', err);
  }
}

// Generate available time slots for a given date based on Agenda Settings and Booked Appointments
// Generate available time slots for a given date based on Agenda Settings and Booked Appointments
// Supports multi-slot services, ensuring all consecutive slots required by the service are joined as 1.
export function getAvailableSlots(dateStr, db, requiredDuration = null) {
  const settings = db.agendaSettings || DEFAULT_AGENDA_SETTINGS;
  const startHour = parseInt(settings.start_time.split(':')[0], 10);
  const startMin = parseInt(settings.start_time.split(':')[1] || '0', 10);
  const endHour = parseInt(settings.end_time.split(':')[0], 10);
  const endMin = parseInt(settings.end_time.split(':')[1] || '0', 10);
  const baseSlotDuration = settings.slot_duration_minutes || 30;
  const neededDuration = Number(requiredDuration) || baseSlotDuration;

  const breakStart = settings.break_start_time || '12:00';
  const breakEnd = settings.break_end_time || '13:00';

  const bookedRanges = (db.appointments || [])
    .filter((a) => a.appointment_date === dateStr && a.status !== 'cancelled' && a.status !== 'no_show')
    .map((a) => {
      const sHour = parseInt(a.appointment_time.split(':')[0], 10) || 0;
      const sMin = parseInt(a.appointment_time.split(':')[1] || '0', 10) || 0;
      const srvName = a.service_name || '';
      const srv = (settings.services || []).find(
        (s) =>
          s.name?.trim().toLowerCase() === srvName.trim().toLowerCase() ||
          srvName.toLowerCase().includes(s.name?.toLowerCase()) ||
          s.name?.toLowerCase().includes(srvName.toLowerCase())
      );
      const srvDuration = Number(a.duration_minutes) || srv?.duration_minutes || (srvName.toLowerCase().includes('barba') ? 55 : baseSlotDuration);
      const startM = sHour * 60 + sMin;
      const endM = startM + srvDuration;
      return { startM, endM };
    });

  const slots = [];
  let currentMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;

  const breakStartMin = parseInt(breakStart.split(':')[0], 10) * 60 + parseInt(breakStart.split(':')[1] || '0', 10);
  const breakEndMin = parseInt(breakEnd.split(':')[0], 10) * 60 + parseInt(breakEnd.split(':')[1] || '0', 10);

  while (currentMinutes + neededDuration <= endMinutes) {
    const slotStart = currentMinutes;
    const slotEnd = currentMinutes + neededDuration;

    // Check if slot collides with lunch/break interval
    const overlapsBreak = (slotStart < breakEndMin && slotEnd > breakStartMin);

    // Check if overlapping with any existing appointment range
    const isOverlapping = overlapsBreak || bookedRanges.some((r) => slotStart < r.endM && slotEnd > r.startM);

    if (!isOverlapping) {
      const h = Math.floor(slotStart / 60);
      const m = slotStart % 60;
      const timeFormatted = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      slots.push(timeFormatted);
    }

    currentMinutes += baseSlotDuration;
  }

  return slots;
}

export function isSlotBooked(dateStr, timeStr, durationMinutes = 30, db) {
  if (!db || !db.appointments) return false;
  const sHour = parseInt(timeStr.split(':')[0], 10) || 0;
  const sMin = parseInt(timeStr.split(':')[1] || '0', 10) || 0;
  const targetStart = sHour * 60 + sMin;
  const targetEnd = targetStart + durationMinutes;

  return db.appointments.some((a) => {
    if (a.appointment_date !== dateStr) return false;
    if (a.status === 'cancelled' || a.status === 'no_show') return false;

    const aHour = parseInt(a.appointment_time.split(':')[0], 10) || 0;
    const aMin = parseInt(a.appointment_time.split(':')[1] || '0', 10) || 0;
    const aDur = Number(a.duration_minutes) || 30;
    const aStart = aHour * 60 + aMin;
    const aEnd = aStart + aDur;

    return targetStart < aEnd && targetEnd > aStart;
  });
}

export function getNextAvailableSlot(dateStr, requestedTime, db, duration = 30) {
  const slots = getAvailableSlots(dateStr, db, duration);
  if (slots.length === 0) return null;
  const rHour = parseInt(requestedTime.split(':')[0], 10) || 0;
  const rMin = parseInt(requestedTime.split(':')[1] || '0', 10) || 0;
  const reqMinutes = rHour * 60 + rMin;

  const nextSlot = slots.find((slot) => {
    const timeStr = typeof slot === 'string' ? slot : slot.time;
    const h = parseInt(timeStr.split(':')[0], 10) || 0;
    const m = parseInt(timeStr.split(':')[1] || '0', 10) || 0;
    return h * 60 + m > reqMinutes;
  });

  return nextSlot || slots[0];
}

// Substitute template variables {{var_name}}
export function replaceVars(text, vars = {}, botProfile = {}) {
  if (!text) return '';
  let res = text;

  res = res.replace(/\{\{bot_nome\}\}/gi, botProfile.name || 'Talvane Barber Bot');
  res = res.replace(/\{\{empresa\}\}/gi, botProfile.company_name || 'Talvane Barber');
  res = res.replace(/\{\{bot_genero\}\}/gi, botProfile.gender === 'female' ? 'Feminino' : 'Masculino');
  res = res.replace(/\{\{bot_tom\}\}/gi, botProfile.tone || 'Amigável e Profissional');
  res = res.replace(/\{\{suporte_telefone\}\}/gi, botProfile.support_phone || '81996138924');
  res = res.replace(/\{\{suporte_email\}\}/gi, botProfile.support_email || 'contato@talvanebarber.com.br');
  res = res.replace(/\{\{horario_atendimento\}\}/gi, botProfile.business_hours || '08:00 às 19:00');
  res = res.replace(/\{\{site_empresa\}\}/gi, botProfile.website_url || 'https://talvane.malaca.com.br');
  res = res.replace(/\{\{mensagem_boas_vindas\}\}/gi, botProfile.welcome_message || 'Olá! Seja bem-vindo à Talvane Barber.');

  Object.keys(vars).forEach((key) => {
    const val = vars[key];
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'gi');
    res = res.replace(regex, String(val ?? ''));
  });

  return res;
}

// Record an incoming or outgoing message into real database
export function recordRealMessage(phone, senderName, direction, content, explicitTags = null, profilePicUrl = null) {
  const db = loadDb();
  const cleanPhone = phone.replace(/\D/g, '');
  const convId = `conv-${cleanPhone}`;
  const now = new Date().toISOString();

  // 1. Upsert Contact
  if (!db.contacts) db.contacts = {};
  const existingContact = db.contacts[cleanPhone] || {
    id: `contact-${cleanPhone}`,
    phone: cleanPhone,
    name: (senderName && senderName !== 'Cliente') ? senderName : 'Cliente WhatsApp',
    whatsapp_pushname: senderName || undefined,
    profile_picture_url: profilePicUrl || undefined,
    status: 'lead',
    tags: explicitTags || ['Lead'],
    is_registered: false,
    metadata: {},
    created_at: now,
  };

  if (senderName && senderName !== 'Cliente') {
    existingContact.whatsapp_pushname = senderName;
    if (!existingContact.name || existingContact.name === 'Cliente WhatsApp' || existingContact.name === 'Cliente') {
      existingContact.name = senderName;
    }
  }
  if (profilePicUrl && !existingContact.profile_picture_url) {
    existingContact.profile_picture_url = profilePicUrl;
  }
  if (explicitTags && Array.isArray(explicitTags)) {
    existingContact.tags = explicitTags;
  }

  existingContact.updated_at = now;
  db.contacts[cleanPhone] = existingContact;

  // 2. Upsert Conversation
  if (!db.conversations) db.conversations = {};
  const existingConv = db.conversations[convId] || {
    id: convId,
    contact_id: existingContact.id,
    contact_name: existingContact.name,
    contact_phone: cleanPhone,
    status: 'bot',
    started_at: now,
    unread_count: 0,
    created_at: now,
  };
  existingConv.contact_name = existingContact.name;
  existingConv.last_message = typeof content === 'string' ? content : content.body || 'Mensagem Interativa';
  existingConv.last_message_at = now;
  existingConv.updated_at = now;
  db.conversations[convId] = existingConv;

  // 3. Append to Messages
  if (!db.messages) db.messages = {};
  if (!db.messages[convId]) db.messages[convId] = [];
  const msgObj = {
    id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    conversation_id: convId,
    direction: direction,
    message_type: typeof content === 'string' ? 'text' : 'button',
    content: typeof content === 'string' ? content : content.body || 'Opções Interativas',
    status: 'delivered',
    created_at: now,
  };
  db.messages[convId].push(msgObj);

  saveDb(db);

  // Real-time sync to Supabase Database
  syncContactToSupabase(existingContact);
  syncConversationToSupabase(existingConv);
  syncMessageToSupabase(msgObj, cleanPhone);

  recordLiveLog(
    direction === 'inbound' ? 'message_inbound' : 'message_outbound',
    direction === 'inbound' ? `Mensagem de ${senderName}` : `Resposta para ${senderName}`,
    typeof content === 'string' ? (content.length > 90 ? content.substring(0, 90) + '...' : content) : 'Mensagem Interativa',
    cleanPhone,
    senderName,
    { direction, messageId: msgObj.id }
  );

  return { contact: existingContact, conversation: existingConv, message: msgObj };
}

export function getLiveConversations() {
  const db = loadDb();
  const convs = Object.values(db.conversations || {});
  convs.sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime());
  return convs;
}

export function getLiveMessages(convId) {
  const db = loadDb();
  const cleanPhone = (convId || '').replace('conv-', '').replace(/\D/g, '');
  return db.messages?.[convId] || db.messages?.[`conv-${cleanPhone}`] || db.messages?.[cleanPhone] || [];
}

export function clearLiveMessages(convId) {
  const db = loadDb();
  const cleanPhone = (convId || '').replace('conv-', '').replace(/\D/g, '');
  if (db.messages) {
    delete db.messages[convId];
    if (cleanPhone) {
      delete db.messages[`conv-${cleanPhone}`];
      delete db.messages[cleanPhone];
    }
  }
  const convKey = db.conversations?.[convId] ? convId : (db.conversations?.[`conv-${cleanPhone}`] ? `conv-${cleanPhone}` : null);
  if (convKey && db.conversations[convKey]) {
    db.conversations[convKey].last_message = '';
    db.conversations[convKey].updated_at = new Date().toISOString();
  }
  saveDb(db);
  return true;
}

export function deleteLiveMessage(convId, messageId) {
  const db = loadDb();
  const cleanPhone = (convId || '').replace('conv-', '').replace(/\D/g, '');
  const targets = [convId, `conv-${cleanPhone}`, cleanPhone].filter(Boolean);

  let deleted = false;
  if (db.messages) {
    for (const key of Object.keys(db.messages)) {
      if (!convId || targets.includes(key)) {
        const initialLen = db.messages[key].length;
        db.messages[key] = db.messages[key].filter(m => m.id !== messageId);
        if (db.messages[key].length < initialLen) {
          deleted = true;
        }
      }
    }
  }
  if (deleted) {
    saveDb(db);
  }
  return deleted;
}

// 7. Audit & Event Logs System
export function recordLiveLog(type, title, description, contactPhone = null, contactName = null, details = null) {
  try {
    const db = loadDb();
    if (!db.logs) db.logs = [];

    const newLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      type, // 'appointment_created' | 'appointment_status' | 'bot_flow' | 'message_inbound' | 'message_outbound' | 'system'
      title,
      description,
      contact_phone: contactPhone || '',
      contact_name: contactName || '',
      details: details || {},
      created_at: new Date().toISOString(),
    };

    db.logs.unshift(newLog);
    if (db.logs.length > 500) {
      db.logs = db.logs.slice(0, 500);
    }
    saveDb(db);

    if (supabaseClient) {
      supabaseClient.from('audit_logs').insert(newLog).catch(() => {});
    }

    return newLog;
  } catch (e) {
    console.warn('[FlowRunner] Erro ao registrar log:', e?.message || e);
    return null;
  }
}

export function getLiveLogs() {
  const db = loadDb();
  let logs = db.logs || [];

  if (logs.length === 0) {
    const synthesized = [];
    (db.appointments || []).forEach((apt) => {
      synthesized.push({
        id: `synth-apt-${apt.id}`,
        type: apt.status === 'completed' || apt.status === 'in_progress' ? 'appointment_status' : 'appointment_created',
        title: `Agendamento: ${apt.service_name || 'Serviço'}`,
        description: `Cliente ${apt.contact_name || apt.contact_phone} para ${apt.appointment_date} às ${apt.appointment_time} (Status: ${apt.status})`,
        contact_phone: apt.contact_phone,
        contact_name: apt.contact_name,
        details: apt,
        created_at: apt.created_at || new Date().toISOString(),
      });
    });

    Object.keys(db.messages || {}).forEach((key) => {
      const msgs = db.messages[key] || [];
      const recent = msgs.slice(-5);
      recent.forEach((m) => {
        synthesized.push({
          id: `synth-msg-${m.id}`,
          type: m.direction === 'inbound' ? 'message_inbound' : 'message_outbound',
          title: m.direction === 'inbound' ? 'Mensagem Recebida do Cliente' : 'Resposta Enviada pelo WhatsApp',
          description: m.content ? (m.content.length > 80 ? m.content.substring(0, 80) + '...' : m.content) : 'Mídia / Interativa',
          contact_phone: m.sender_phone || key,
          contact_name: m.sender_name || 'Cliente',
          details: { messageId: m.id, status: m.status },
          created_at: m.created_at || m.timestamp || new Date().toISOString(),
        });
      });
    });

    synthesized.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return synthesized.slice(0, 200);
  }

  return logs;
}

export function clearLiveLogs() {
  const db = loadDb();
  db.logs = [];
  saveDb(db);
  return true;
}

export function getLiveContacts() {
  const db = loadDb();
  const contacts = Object.values(db.contacts || {});
  contacts.sort((a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime());
  return contacts;
}

// Function to find if a contact is already registered (in Supabase or Local DB)
export async function findRegisteredContact(cleanPhone, senderName, db) {
  const digitsOnly = (cleanPhone || '').replace(/\D/g, '');
  if (!digitsOnly) return { isRegistered: false, contact: null };

  // Generate phone variations: with 55, without 55, with/without 9th digit
  const variations = new Set();
  variations.add(digitsOnly);

  let withoutDdi = digitsOnly;
  if (digitsOnly.startsWith('55') && digitsOnly.length >= 12) {
    withoutDdi = digitsOnly.substring(2);
    variations.add(withoutDdi);
  } else if (digitsOnly.length === 10 || digitsOnly.length === 11) {
    variations.add(`55${digitsOnly}`);
  }

  // 9th digit variations for Brazilian numbers (e.g. 81 99613-8924 vs 81 9613-8924)
  if (withoutDdi.length === 11 && withoutDdi[2] === '9') {
    const without9 = withoutDdi.substring(0, 2) + withoutDdi.substring(3);
    variations.add(without9);
    variations.add(`55${without9}`);
  } else if (withoutDdi.length === 10) {
    const with9 = withoutDdi.substring(0, 2) + '9' + withoutDdi.substring(2);
    variations.add(with9);
    variations.add(`55${with9}`);
  }

  // Helper to determine if contact has verified client status
  const isVerifiedClient = (c) => {
    if (!c) return false;
    if (c.is_registered === true || c.is_verified === true) return true;
    const tagList = (c.tags || []).map((t) => String(t).toLowerCase().trim());
    if (tagList.includes('cliente') || tagList.includes('vip') || tagList.includes('recorrente') || tagList.includes('mensalista') || tagList.includes('agendado')) {
      return true;
    }
    const cleanName = String(c.name || '').trim();
    if (cleanName && cleanName !== 'Cliente' && cleanName !== 'Cliente WhatsApp' && cleanName !== 'nome_cliente' && cleanName !== 'undefined') {
      if (c.status === 'active' || (c.custom_fields && Object.keys(c.custom_fields).length > 0)) {
        return true;
      }
    }
    return false;
  };

  // 1. Search in memory / db.contacts
  const contactsList = Object.values(db.contacts || {});
  for (const c of contactsList) {
    const cDigits = (c.phone || c.id || '').replace(/\D/g, '');
    for (const v of variations) {
      if (cDigits && (cDigits === v || cDigits.endsWith(v) || v.endsWith(cDigits))) {
        if (isVerifiedClient(c)) {
          return { isRegistered: true, contact: c, hasRealName: true };
        }
      }
    }
  }

  // 2. Search in Supabase Cloud Database (Single Source of Truth)
  if (supabaseClient) {
    try {
      for (const v of variations) {
        const { data, error } = await supabaseClient
          .from('contacts')
          .select('*')
          .or(`phone.eq.${v},phone.ilike.%${v}%`)
          .limit(1)
          .maybeSingle();

        if (data && !error && isVerifiedClient(data)) {
          if (!db.contacts) db.contacts = {};
          db.contacts[cleanPhone] = data;
          db.contacts[data.phone] = data;
          saveDb(db);
          return { isRegistered: true, contact: data, hasRealName: true };
        }
      }
    } catch (e) {
      console.warn('[FlowRunner] Erro ao consultar contato no Supabase:', e.message);
    }
  }

  // 3. Search in Appointments (Historic bookings)
  const apts = db.appointments || [];
  const aptMatch = apts.find((a) => {
    const aDigits = (a.contact_phone || a.phone || '').replace(/\D/g, '');
    for (const v of variations) {
      if (aDigits && (aDigits === v || aDigits.endsWith(v) || v.endsWith(aDigits))) return true;
    }
    return false;
  });

  if (aptMatch && aptMatch.contact_name && aptMatch.contact_name.toLowerCase() !== 'cliente') {
    return {
      isRegistered: true,
      contact: { name: aptMatch.contact_name, phone: cleanPhone, is_registered: true },
      hasRealName: true,
    };
  }

  return { isRegistered: false, contact: null, hasRealName: false };
}

// Function to fetch latest flow, nodes, and edges dynamically with Supabase priority
export async function getActiveFlowAndGraph(db) {
  let flows = db.flows || [];
  
  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient.from('flows').select('*').order('updated_at', { ascending: false });
      if (data && Array.isArray(data) && data.length > 0 && !error) {
        db.flows = data;
        flows = data;
        saveDb(db);
      }
    } catch (e) {
      console.warn('[FlowRunner] Supabase flows fetch fallback:', e?.message || e);
    }
  }

  // Filter only published/active flows (exclude draft and inactive)
  const publishedFlows = (flows || []).filter((f) => f.status === 'published');
  
  if (publishedFlows.length === 0 && flows.length === 0) {
    return { publishedFlow: null, nodes: [], edges: [] };
  }

  // Try each published flow in order (newest first), looking for one with actual nodes
  const candidateFlows = publishedFlows.length > 0 ? publishedFlows : [flows[0]];
  
  for (const candidateFlow of candidateFlows) {
    const flowId = candidateFlow.id;
    let nodes = db.nodes?.[flowId] || [];
    let edges = db.edges?.[flowId] || [];

    // Try Supabase for nodes/edges
    if (supabaseClient) {
      try {
        const [nodesRes, edgesRes] = await Promise.all([
          supabaseClient.from('flow_nodes').select('*').eq('flow_id', flowId),
          supabaseClient.from('flow_edges').select('*').eq('flow_id', flowId)
        ]);

        if (nodesRes.data && nodesRes.data.length > 0) {
          nodes = nodesRes.data.map((d) => ({
            id: d.id,
            flow_id: d.flow_id,
            type: d.node_type || d.type,
            position: { x: Number(d.position_x || 0), y: Number(d.position_y || 0) },
            data: d.data || {},
          }));
          if (!db.nodes) db.nodes = {};
          db.nodes[flowId] = nodes;
        }

        if (edgesRes.data && edgesRes.data.length > 0) {
          edges = edgesRes.data.map((e) => ({
            id: e.id,
            flow_id: e.flow_id,
            source: e.source_node_id || e.source,
            target: e.target_node_id || e.target,
            sourceHandle: e.source_handle || e.sourceHandle,
            targetHandle: e.target_handle || e.targetHandle,
            data: e.condition || e.data,
          }));
          if (!db.edges) db.edges = {};
          db.edges[flowId] = edges;
        }

        if (nodes.length > 0) {
          saveDb(db);
        }
      } catch (e) {
        console.warn('[FlowRunner] Falha ao carregar nós do Supabase:', e?.message || e);
      }
    }

    // If this flow has nodes, use it!
    if (nodes.length > 0) {
      console.log(`[FlowRunner] ✅ Usando fluxo ativo: "${candidateFlow.name}" (${flowId}) com ${nodes.length} nós`);
      return { publishedFlow: candidateFlow, nodes, edges };
    }

    console.warn(`[FlowRunner] ⚠️ Fluxo "${candidateFlow.name}" (${flowId}) publicado mas sem nós, tentando próximo...`);
  }

  // If candidate flows had no nodes, find ANY flow in db that HAS nodes
  const flowWithNodes = (flows || []).find((f) => (db.nodes?.[f.id] || []).length > 0);
  if (flowWithNodes) {
    const fallbackNodes = db.nodes[flowWithNodes.id];
    const fallbackEdges = db.edges?.[flowWithNodes.id] || [];
    console.log(`[FlowRunner] 🔄 Reutilizando grafo de "${flowWithNodes.name}" (${fallbackNodes.length} nós) para fluxo ativo`);
    return { publishedFlow: publishedFlows[0] || flowWithNodes, nodes: fallbackNodes, edges: fallbackEdges };
  }

  // Check if db.nodes has any entries at all
  const anyKey = Object.keys(db.nodes || {}).find((k) => (db.nodes[k] || []).length > 0);
  if (anyKey) {
    const fallbackNodes = db.nodes[anyKey];
    const fallbackEdges = db.edges?.[anyKey] || [];
    return { publishedFlow: publishedFlows[0] || flows[0] || { name: 'Atendimento' }, nodes: fallbackNodes, edges: fallbackEdges };
  }

  // Last resort: return first published flow even without nodes
  const fallback = publishedFlows[0] || flows[0];
  return { publishedFlow: fallback || null, nodes: db.nodes?.[fallback?.id] || [], edges: db.edges?.[fallback?.id] || [] };
}

// Execute published flow
export async function executePublishedFlow(senderJid, messageText, pushName, realPhoneNumber = null, profilePicUrl = null) {
  const db = loadDb();
  const rawId = senderJid.split('@')[0].split(':')[0];
  const cleanPhone = (realPhoneNumber || rawId).replace(/\D/g, '');
  const senderName = pushName || 'Cliente';
  const cleanInput = (messageText || '').trim();

  // Record incoming message in real database
  recordRealMessage(cleanPhone, senderName, 'inbound', cleanInput, null, profilePicUrl);

  // Dynamically resolve published flow, nodes, and edges
  const { publishedFlow, nodes, edges } = await getActiveFlowAndGraph(db);

  if (!publishedFlow) {
    const defaultReply = `Olá, *${senderName}*! Recebi sua mensagem: "${cleanInput}".\n\nNo momento, não há nenhum fluxo ativo publicado no painel administrativo.`;
    recordRealMessage(cleanPhone, senderName, 'outbound', defaultReply);
    return [defaultReply];
  }

  const flowId = publishedFlow.id;

  if (!nodes || nodes.length === 0) {
    const noNodesReply = `Olá! O fluxo *${publishedFlow.name}* está publicado, mas ainda não possui nós configurados.`;
    recordRealMessage(cleanPhone, senderName, 'outbound', noNodesReply);
    return [noNodesReply];
  }

  let session = db.sessions?.[cleanPhone] || db.sessions?.[rawId] || {
    flowId,
    currentNodeId: null,
    variables: {},
  };

  if (session.flowId !== flowId || (session.currentNodeId && !nodes.some(n => n.id === session.currentNodeId))) {
    session.flowId = flowId;
    session.currentNodeId = null;
  }

  session.variables = {
    ...session.variables,
    whatsapp_pushname: senderName || '',
    telefone_cliente: cleanPhone,
    telefone_whatsapp: cleanPhone,
    ultima_mensagem: cleanInput,
  };
  if (!session.variables.nome_cliente) {
    session.variables.nome_cliente = '';
  }

  const botProfile = db.botProfile || {};
  const replies = [];

function parseCustomDateString(input) {
  const clean = (input || '').toLowerCase().trim();
  const today = new Date();
  
  if (clean === 'hoje' || clean === '1' || clean.includes('hoje') || clean === 'date_today') {
    return today.toISOString().split('T')[0];
  }
  if (clean === 'amanha' || clean === 'amanhã' || clean === '2' || clean.includes('amanh') || clean === 'date_tomorrow') {
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }
  
  // Format DD/MM or DD/MM/YYYY
  const ddmmyyyy = clean.match(/(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?/);
  if (ddmmyyyy) {
    const day = ddmmyyyy[1].padStart(2, '0');
    const month = ddmmyyyy[2].padStart(2, '0');
    const year = ddmmyyyy[3] ? (ddmmyyyy[3].length === 2 ? `20${ddmmyyyy[3]}` : ddmmyyyy[3]) : today.getFullYear();
    return `${year}-${month}-${day}`;
  }
  
  // Format YYYY-MM-DD
  const yyyymmdd = clean.match(/(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
  if (yyyymmdd) {
    return `${yyyymmdd[1]}-${yyyymmdd[2].padStart(2, '0')}-${yyyymmdd[3].padStart(2, '0')}`;
  }

  return today.toISOString().split('T')[0];
}

  const isExplicitReset =
    cleanInput.toLowerCase() === 'menu' ||
    cleanInput.toLowerCase() === 'inicio' ||
    cleanInput.toLowerCase() === 'início' ||
    cleanInput.toLowerCase() === 'reiniciar' ||
    cleanInput.toLowerCase() === 'cancelar' ||
    cleanInput.toLowerCase() === 'voltar' ||
    cleanInput.toLowerCase() === 'comecar' ||
    cleanInput.toLowerCase() === 'começar' ||
    cleanInput.toLowerCase() === 'start';

  const isGreeting =
    cleanInput.toLowerCase() === 'oi' ||
    cleanInput.toLowerCase() === 'olá' ||
    cleanInput.toLowerCase() === 'ola' ||
    cleanInput.toLowerCase() === 'bom dia' ||
    cleanInput.toLowerCase() === 'boa tarde' ||
    cleanInput.toLowerCase() === 'boa noite';

  const isWaitingForInput = Boolean(
    session.waitingForVar ||
    (session.currentNodeId && nodes.some((n) => n.id === session.currentNodeId && (n.type === 'question' || n.data?.nodeType === 'question')))
  );

  const isReset = isExplicitReset || (!isWaitingForInput && (isGreeting || !session.currentNodeId));

  let currentNode = null;

  if (isReset) {
    currentNode = nodes.find((n) => (n.data?.nodeType || n.type) === 'trigger') || nodes[0];
    session.currentNodeId = currentNode.id;
  } else {
    const prevNode = nodes.find((n) => n.id === session.currentNodeId);
    const prevType = prevNode?.data?.nodeType || prevNode?.type;

    // 1. Question response
    if ((prevNode && prevType === 'question') || session.waitingForVar) {
      const activeQuestionNode = (prevNode && prevType === 'question') ? prevNode : nodes.find((n) => (n.data?.nodeType || n.type) === 'question');
      const qConfig = activeQuestionNode?.data?.config || {};
      let varKey = qConfig.variableName || session.waitingForVar || 'resposta_usuario';
      varKey = varKey.replace(/[{}]/g, '').trim();

      // Clean up conversational prefixes if user typed "Me chamo Carlos" or "Meu nome é Carlos"
      let extractedName = cleanInput;
      const lowerInput = cleanInput.toLowerCase().trim();
      if (lowerInput.startsWith('me chamo ')) {
        extractedName = cleanInput.substring(9).trim();
      } else if (lowerInput.startsWith('meu nome é ') || lowerInput.startsWith('meu nome e ')) {
        extractedName = cleanInput.substring(11).trim();
      } else if (lowerInput.startsWith('sou o ') || lowerInput.startsWith('sou a ')) {
        extractedName = cleanInput.substring(6).trim();
      }

      const isNameVar = varKey.toLowerCase().includes('nome') || varKey === 'name' || varKey === 'cliente' || qConfig.expectedType === 'text';
      const finalVal = isNameVar ? extractedName : cleanInput;

      session.variables[varKey] = finalVal;
      session.variables[`{{${varKey}}}`] = finalVal;
      session.variables['resposta_usuario'] = finalVal;
      session.waitingForVar = null;
      if (isNameVar && extractedName) {
        session.variables.nome_cliente = extractedName;
        session.variables.cliente_nome = extractedName;
        session.variables.nome = extractedName;

        if (!db.contacts) db.contacts = {};
        if (!db.contacts[cleanPhone]) {
          db.contacts[cleanPhone] = {
            id: `contact-${cleanPhone}`,
            phone: cleanPhone,
            name: extractedName,
            status: 'active',
            tags: ['Cliente'],
            is_registered: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
        } else {
          db.contacts[cleanPhone].name = extractedName;
          db.contacts[cleanPhone].status = 'active';
          db.contacts[cleanPhone].is_registered = true;
          if (!db.contacts[cleanPhone].tags) db.contacts[cleanPhone].tags = [];
          if (!db.contacts[cleanPhone].tags.includes('Cliente')) {
            db.contacts[cleanPhone].tags.push('Cliente');
          }
          db.contacts[cleanPhone].updated_at = new Date().toISOString();
        }

        if (db.conversations && db.conversations[`conv-${cleanPhone}`]) {
          db.conversations[`conv-${cleanPhone}`].contact_name = extractedName;
        }

        syncContactToSupabase(db.contacts[cleanPhone]);
        console.log(`[FlowRunner] 👤 Nome do cliente gravado da resposta da pergunta: "${extractedName}" para ${cleanPhone}`);
      }

      if (varKey.toLowerCase().includes('email')) {
        session.variables.email_cliente = cleanInput;
        if (db.contacts && db.contacts[cleanPhone]) {
          db.contacts[cleanPhone].email = cleanInput;
          syncContactToSupabase(db.contacts[cleanPhone]);
        }
      }

      if (db.contacts && db.contacts[cleanPhone]) {
        if (!db.contacts[cleanPhone].custom_fields) db.contacts[cleanPhone].custom_fields = {};
        db.contacts[cleanPhone].custom_fields[varKey] = cleanInput;
        syncContactToSupabase(db.contacts[cleanPhone]);
      }

      saveDb(db);

      const effectiveQuestionNode = activeQuestionNode || prevNode;
      const nextEdge = effectiveQuestionNode ? edges.find((e) => e.source === effectiveQuestionNode.id) : null;
      if (nextEdge) {
        currentNode = nodes.find((n) => n.id === nextEdge.target);
        session.currentNodeId = currentNode?.id || null;
      }
    }

    // 1.1 Ask Date response
    else if (prevNode && prevType === 'ask_date') {
      const parsedDate = parseCustomDateString(cleanInput);
      session.variables['data_agendamento'] = parsedDate;
      const parts = parsedDate.split('-');
      session.variables['data_formatada'] = `${parts[2]}/${parts[1]}/${parts[0]}`;
      console.log(`[FlowRunner] 📅 Data de agendamento selecionada: ${parsedDate} (${session.variables['data_formatada']})`);

      const nextEdge = edges.find((e) => e.source === prevNode.id);
      if (nextEdge) {
        currentNode = nodes.find((n) => n.id === nextEdge.target);
        session.currentNodeId = currentNode?.id || null;
      }
    }

    // 2. Buttons / Available slots / Services Catalog / Date selection
    else if (
      prevNode &&
      (prevType === 'buttons' ||
        prevType === 'select_service' ||
        prevType === 'services_catalog' ||
        prevType === 'select_date' ||
        prevType === 'ask_date' ||
        prevType === 'select_time_slot' ||
        prevType === 'schedule_contact')
    ) {
      const btnConfig = prevNode.data?.config || {};
      const buttons = session.activeButtons || btnConfig.buttons || [];
      let matchedBtnIndex = -1;

      const numMatch = parseInt(cleanInput, 10);
      if (!isNaN(numMatch) && numMatch >= 1 && numMatch <= buttons.length) {
        matchedBtnIndex = numMatch - 1;
      } else {
        matchedBtnIndex = buttons.findIndex(
          (b) =>
            b.id === cleanInput ||
            b.title?.toLowerCase().trim() === cleanInput.toLowerCase() ||
            cleanInput.toLowerCase().includes(b.title?.toLowerCase().trim())
        );
      }

      // Date input typing (if user typed DD/MM or a custom date on a date node)
      if (matchedBtnIndex === -1 && (prevType === 'select_date' || prevType === 'ask_date')) {
        const parsedDate = parseCustomDateString(cleanInput);
        session.variables['data_agendamento'] = parsedDate;
        session.variables['data_formatada'] = parsedDate.split('-').reverse().join('/');
        console.log(`[FlowRunner] 📅 Data digitada pelo cliente: ${parsedDate}`);

        const nextEdge = edges.find((e) => e.source === prevNode.id);
        if (nextEdge) {
          currentNode = nodes.find((n) => n.id === nextEdge.target);
          session.currentNodeId = currentNode?.id || null;
        }
      } else if (matchedBtnIndex >= 0) {
        const matchedBtn = buttons[matchedBtnIndex];
        session.variables['opcao_selecionada'] = matchedBtn.title;
        session.variables['botao_id'] = matchedBtn.id;

        // If from date button selection (Hoje / Amanhã)
        if (prevType === 'select_date' || prevType === 'ask_date') {
          let chosenDate = '';
          if (matchedBtn.id === 'date_tomorrow' || matchedBtn.title.toLowerCase().includes('amanh')) {
            const tm = new Date();
            tm.setDate(tm.getDate() + 1);
            chosenDate = tm.toISOString().split('T')[0];
          } else {
            chosenDate = new Date().toISOString().split('T')[0];
          }
          session.variables['data_agendamento'] = chosenDate;
          session.variables['data_formatada'] = chosenDate.split('-').reverse().join('/');
          console.log(`[FlowRunner] 📅 Data selecionada via botão: ${chosenDate}`);
        }

        // If from schedule slot selection
        if ((prevType === 'select_time_slot' || prevType === 'schedule_contact') && (matchedBtn.id.startsWith('slot_') || matchedBtn.slotTime)) {
          const selectedTime = matchedBtn.slotTime || matchedBtn.title.replace('🕒', '').trim();
          session.variables['horario_agendamento'] = selectedTime;
          session.variables['horario_escolhido'] = selectedTime;
          console.log(`[FlowRunner] 🕒 Horário selecionado pelo cliente: "${selectedTime}"`);
        }

        // If from select_service / services_catalog button selection
        if (prevType === 'select_service' || prevType === 'services_catalog') {
          const srv =
            matchedBtn.fullService ||
            (db.agendaSettings?.services || []).find(
              (s) =>
                s.id === matchedBtn.id.replace('srv_', '') ||
                s.name?.toLowerCase().trim() === (matchedBtn.serviceName || '').toLowerCase().trim()
            ) || {
              name: matchedBtn.serviceName || matchedBtn.title.split('(')[0].trim(),
              price: matchedBtn.price || 0,
              duration_minutes: matchedBtn.duration_minutes || 30,
            };

          const srvName = srv.name || matchedBtn.serviceName || matchedBtn.title.split('(')[0].trim();
          const srvPrice = srv.price ? `R$ ${Number(srv.price).toFixed(2).replace('.', ',')}` : '';
          const srvDur = srv.duration_minutes || 30;

          session.variables['servico_selecionado'] = srvName;
          session.variables['valor_servico'] = srvPrice;
          session.variables['duracao_servico'] = `${srvDur} min`;
          session.variables['duracao_minutos'] = srvDur;
          session.variables['opcao_selecionada'] = srvName;
          console.log(`[FlowRunner] 🏷️ Serviço selecionado pelo cliente: "${srvName}" (${srvPrice}, ${srvDur} min)`);
        }

        const targetEdge =
          edges.find(
            (e) =>
              e.source === prevNode.id &&
              (e.sourceHandle === matchedBtn.id ||
                e.sourceHandle === `btn_${matchedBtnIndex + 1}` ||
                e.sourceHandle === `btn_${matchedBtnIndex}`)
          ) || edges.find((e) => e.source === prevNode.id);

        if (targetEdge) {
          currentNode = nodes.find((n) => n.id === targetEdge.target);
          session.currentNodeId = currentNode?.id || null;
        }
      } else {
        // If user typed something unrelated while on buttons node
        const retryButtons = buttons.map((b, i) => `*${i + 1}️⃣* ${b.title}`).join('\n');
        replies.push(`Opção não reconhecida. Por favor, escolha uma das opções abaixo:\n\n${retryButtons}`);
        session.currentNodeId = prevNode.id;
        session.activeButtons = buttons;
        
        // Save session & return
        if (!db.sessions) db.sessions = {};
        db.sessions[cleanPhone] = session;
        db.sessions[rawId] = session;
        saveDb(db);
        for (const rep of replies) {
          recordRealMessage(cleanPhone, senderName, 'outbound', rep);
        }
        return replies;
      }
    }

    if (!currentNode) {
      currentNode = prevNode || nodes.find((n) => (n.data?.nodeType || n.type) === 'trigger') || nodes[0];
      session.currentNodeId = currentNode?.id || null;
    }
  }

  let stepLimit = 15;

  while (currentNode && stepLimit > 0) {
    stepLimit--;
    const nodeType = currentNode.data?.nodeType || currentNode.type;
    const config = currentNode.data?.config || {};

    // 0. Trigger Node
    if (nodeType === 'trigger') {
      const outgoing = edges.find((e) => e.source === currentNode.id);
      if (outgoing) {
        currentNode = nodes.find((n) => n.id === outgoing.target);
        if (currentNode) {
          session.currentNodeId = currentNode.id;
          continue;
        }
      }
      break;
    }

    // 1. Message Node
    else if (nodeType === 'message') {
      const text = replaceVars(config.text || 'Olá!', session.variables, botProfile);
      replies.push(text);
    }

    // 2. Buttons Node (Native Interactive Buttons)
    else if (nodeType === 'buttons') {
      const body = replaceVars(config.bodyText || 'Escolha uma opção:', session.variables, botProfile);
      const rawButtons = config.buttons || [
        { id: 'btn_1', title: 'Opção 1' },
        { id: 'btn_2', title: 'Opção 2' },
      ];
      const footer = config.footerText ? replaceVars(config.footerText, session.variables, botProfile) : '';

      session.activeButtons = rawButtons;
      session.currentNodeId = currentNode.id;

      replies.push({
        type: 'buttons',
        body,
        footer,
        buttons: rawButtons,
      });
      break;
    }

    // 3. Question Node
    else if (nodeType === 'question') {
      const qText = replaceVars(config.questionText || 'Por favor, informe seu dado:', session.variables, botProfile);
      replies.push(qText);
      session.currentNodeId = currentNode.id;
      session.waitingForVar = config.variableName || 'resposta_usuario';
      break;
    }

    // 4. Check Contact Node (Primeiro Contato vs Contato Salvo / Recorrente)
    else if (nodeType === 'check_contact') {
      const contactInfo = await findRegisteredContact(cleanPhone, senderName, db);
      const isNew = !contactInfo.isRegistered;
      const contact = contactInfo.contact;

      // Populate rich context variables
      session.variables['is_primeiro_contato'] = isNew;
      session.variables['is_novo_contato'] = isNew;
      session.variables['tipo_cliente'] = isNew ? 'novo' : 'recorrente';
      session.variables['telefone_whatsapp'] = cleanPhone;

      if (contact?.custom_fields) {
        Object.assign(session.variables, contact.custom_fields);
      }
      if (!isNew && contact?.name) {
        session.variables['nome_cliente'] = contact.name;
        session.variables['cliente_nome'] = contact.name;
        session.variables['nome'] = contact.name;
      }
      if (contact?.tags) {
        session.variables['tags_contato'] = (contact.tags || []).join(', ');
      }

      console.log(`[FlowRunner] 👥 [Check Contact] Verificação para ${cleanPhone}: ${isNew ? '🆕 NOVO CONTATO (1ª Vez)' : `✅ CONTATO JÁ CADASTRADO ("${contact?.name || 'Cliente'}")`}`);

      // Follow edge from 'is_new' or 'is_existing' handle
      const targetHandle = isNew ? 'is_new' : 'is_existing';
      let branchEdge = edges.find((e) => e.source === currentNode.id && e.sourceHandle === targetHandle);

      if (!branchEdge) {
        branchEdge = edges.find(
          (e) =>
            e.source === currentNode.id &&
            (isNew
              ? e.sourceHandle?.includes('new') || e.sourceHandle?.includes('novo')
              : e.sourceHandle?.includes('exist') || e.sourceHandle?.includes('salvo') || e.sourceHandle?.includes('recorrente'))
        );
      }

      if (!branchEdge) {
        const nodeEdges = edges.filter((e) => e.source === currentNode.id);
        if (nodeEdges.length >= 2) {
          branchEdge = isNew ? nodeEdges[0] : nodeEdges[1];
        } else {
          branchEdge = nodeEdges[0];
        }
      }

      if (branchEdge) {
        currentNode = nodes.find((n) => n.id === branchEdge.target);
        if (currentNode) {
          session.currentNodeId = currentNode.id;
          continue;
        }
      }
      break;
    }

    // 5. Show Services Node (Apenas Exibição / Leitura do Catálogo)
    else if (nodeType === 'show_services') {
      const services = (db.agendaSettings?.services && db.agendaSettings.services.length > 0) ? db.agendaSettings.services : [
        { id: 'srv-1', name: 'Corte de Cabelo', duration_minutes: 30, price: 35 },
        { id: 'srv-2', name: 'Barba Terapia', duration_minutes: 45, price: 40 },
        { id: 'srv-3', name: 'Combo Cabelo + Barba', duration_minutes: 60, price: 70 },
      ];

      const header = replaceVars(config.headerText || '💈 *Catálogo de Serviços & Preços*', session.variables, botProfile);
      const footer = config.footerText ? `\n\n_${replaceVars(config.footerText, session.variables, botProfile)}_` : '';

      const serviceLines = services
        .map((s, idx) => `*${idx + 1}️⃣* *${s.name}*\n   💰 R$ ${Number(s.price || 0).toFixed(2).replace('.', ',')} • ⏱️ ${s.duration_minutes || 30} min`)
        .join('\n\n');

      const fullCatalogText = `${header}\n\n${serviceLines}${footer}`;
      session.variables['catalogo_servicos_texto'] = fullCatalogText;
      replies.push(fullCatalogText);

      // Continues straight to the next connected node
      const outgoing = edges.find((e) => e.source === currentNode.id);
      if (outgoing) {
        currentNode = nodes.find((n) => n.id === outgoing.target);
        if (currentNode) {
          session.currentNodeId = currentNode.id;
          continue;
        }
      }
      break;
    }

    // 5.2 Select Service Node (Escolha de Serviço via Botões Interativos)
    else if (nodeType === 'select_service' || nodeType === 'services_catalog') {
      const services = (db.agendaSettings?.services && db.agendaSettings.services.length > 0) ? db.agendaSettings.services : [
        { id: 'srv-1', name: 'Corte de Cabelo', duration_minutes: 30, price: 35 },
        { id: 'srv-2', name: 'Barba Terapia', duration_minutes: 45, price: 40 },
        { id: 'srv-3', name: 'Combo Cabelo + Barba', duration_minutes: 60, price: 70 },
      ];

      const intro = replaceVars(config.introMessage || 'Qual serviço você deseja agendar hoje?', session.variables, botProfile);
      const footer = config.footerText ? replaceVars(config.footerText, session.variables, botProfile) : 'Toque no serviço desejado:';

      const serviceButtons = services.map((s, idx) => ({
        id: `srv_${s.id || idx + 1}`,
        title: `${s.name} (R$ ${Number(s.price || 0).toFixed(2).replace('.', ',')})`,
        serviceName: s.name,
        price: Number(s.price || 0),
        duration_minutes: s.duration_minutes || 30,
        fullService: s,
      }));

      session.activeButtons = serviceButtons;
      session.currentNodeId = currentNode.id;

      if (services.length <= 3) {
        replies.push({
          type: 'buttons',
          body: `✂️ *Escolha o Serviço:*\n\n${intro}`,
          footer,
          buttons: serviceButtons.map((b) => ({
            id: b.id,
            title: b.title.length > 20 ? b.title.substring(0, 20) : b.title,
          })),
        });
      } else {
        const listLines = services
          .map((s, idx) => `*${idx + 1}️⃣* *${s.name}*\n   💰 R$ ${Number(s.price || 0).toFixed(2).replace('.', ',')} • ⏱️ ${s.duration_minutes || 30} min`)
          .join('\n\n');

        replies.push({
          type: 'buttons',
          body: `✂️ *Escolha o Serviço:*\n\n${intro}\n\n${listLines}`,
          footer: '👉 Toque no botão ou digite o número correspondente:',
          buttons: serviceButtons.slice(0, 3).map((b) => ({
            id: b.id,
            title: b.title.length > 20 ? b.title.substring(0, 20) : b.title,
          })),
        });
      }
      break;
    }

    // 6. Select Date Node (Escolha de Data do Agendamento)
    else if (nodeType === 'select_date' || nodeType === 'ask_date') {
      const qText = config.questionText ? replaceVars(config.questionText, session.variables, botProfile) : 'Para qual dia você gostaria de agendar?';
      const todayStr = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      const tomDate = new Date();
      tomDate.setDate(tomDate.getDate() + 1);
      const tomStr = tomDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

      const dateButtons = [
        { id: 'date_today', title: `Hoje (${todayStr})` },
        { id: 'date_tomorrow', title: `Amanhã (${tomStr})` },
        { id: 'date_custom', title: 'Outra Data' },
      ];

      session.activeButtons = dateButtons;
      session.currentNodeId = currentNode.id;

      replies.push({
        type: 'buttons',
        body: `📅 *Escolha a Data do Agendamento*\n\n${qText}`,
        footer: 'Toque em uma das opções ou digite a data desejada (ex: 25/08):',
        buttons: dateButtons,
      });
      break;
    }

    // 6.2 Select Time Slot Node (Escolha de Horário Disponível na Data)
    else if (nodeType === 'select_time_slot' || nodeType === 'schedule_contact') {
      const dateVar = config.dateVariable || 'data_agendamento';
      const dateVal = session.variables[dateVar] || session.variables['data_agendamento'] || new Date().toISOString().split('T')[0];
      const srvName = config.serviceName ? replaceVars(config.serviceName, session.variables, botProfile) : (session.variables['servico_selecionado'] || 'Atendimento Especializado');

      const srvObj = (db.agendaSettings?.services || []).find((s) => 
        s.name?.trim().toLowerCase() === srvName.trim().toLowerCase() ||
        srvName.toLowerCase().includes(s.name?.toLowerCase()) ||
        s.name?.toLowerCase().includes(srvName.toLowerCase())
      );
      const baseSlotDur = db.agendaSettings?.slot_duration_minutes || 30;
      const srvDuration = Number(srvObj?.duration_minutes) || Number(session.variables['duracao_minutos']) || (srvName.toLowerCase().includes('barba') ? 55 : baseSlotDur);

      const slots = getAvailableSlots(dateVal, db, srvDuration);

      if (slots.length === 0) {
        replies.push(`📅 *Agenda Completa para ${dateVal}*\n\nNão encontramos horários livres disponíveis com tempo contínuo para este serviço (${srvDuration} min). Por favor, envie outra data para agendar.`);
        session.currentNodeId = currentNode.id;
        break;
      }

      const slotsCount = Math.max(1, Math.ceil(srvDuration / baseSlotDur));

      // Present available slots as Clickable Buttons (showing unified range if multi-slot)
      const slotButtons = slots.slice(0, 3).map((slot) => {
        const timeStr = typeof slot === 'string' ? slot : slot.time;
        const [sh, sm] = timeStr.split(':').map(Number);
        const endMin = sh * 60 + sm + srvDuration;
        const endH = Math.floor(endMin / 60);
        const endM = endMin % 60;
        const endTimeFormatted = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

        const titleStr = slotsCount > 1 ? `🕒 ${timeStr}-${endTimeFormatted}` : `🕒 ${timeStr}`;

        return {
          id: `slot_${timeStr}`,
          title: titleStr.length > 20 ? titleStr.substring(0, 20) : titleStr,
          slotTime: timeStr,
          endTime: endTimeFormatted,
          duration: srvDuration,
          slotsCount
        };
      });

      session.activeButtons = slotButtons;
      session.variables['data_agendamento'] = dateVal;
      session.variables['servico_selecionado'] = srvName;
      session.variables['duracao_minutos'] = srvDuration;
      session.currentNodeId = currentNode.id;

      const slotNotice = slotsCount > 1 ? `\n• Duração: *${srvDuration} min* (${slotsCount} slots unidos como 1 só)` : `\n• Duração: *${srvDuration} min*`;
      const intro = config.introMessage ? replaceVars(config.introMessage, session.variables, botProfile) : 'Estes são os horários livres com tempo completo disponível para seu atendimento. Toque no seu horário preferido:';

      replies.push({
        type: 'buttons',
        body: `🕒 *Horários Livres na Agenda (${dateVal}):*\n\n• Serviço: *${srvName}*${slotNotice}\n\n${intro}`,
        footer: 'Toque no horário desejado para agendar:',
        buttons: slotButtons,
      });
      break;
    }

    // 4.4 Confirm Booking Node
    else if (nodeType === 'confirm_booking') {
      const srvName = session.variables['servico_selecionado'] || config.serviceName || 'Atendimento Geral';
      const srvPrice = session.variables['valor_servico'] || '';
      const dateVal = session.variables['data_agendamento'] || new Date().toISOString().split('T')[0];
      const timeVal = session.variables['horario_agendamento'] || session.variables['horario_escolhido'] || '09:00';
      const clientName = session.variables.nome_cliente || senderName;

      const srvObj = (db.agendaSettings?.services || []).find((s) => s.name?.toLowerCase().trim() === srvName.toLowerCase().trim());
      const baseSlotDur = db.agendaSettings?.slot_duration_minutes || 30;
      const srvDur = srvObj?.duration_minutes || session.variables['duracao_minutos'] || (srvName.toLowerCase().includes('barba') ? 55 : baseSlotDur);
      const slotsCount = Math.max(1, Math.ceil(srvDur / baseSlotDur));

      // Calculate endTime
      const [sh, sm] = timeVal.split(':').map(Number);
      const endMin = (sh || 0) * 60 + (sm || 0) + srvDur;
      const endH = Math.floor(endMin / 60);
      const endM = endMin % 60;
      const endTimeVal = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

      // Check for slot collision: do not allow booking if slot is already occupied!
      const isOccupied = isSlotBooked(dateVal, timeVal, srvDur, db);
      if (isOccupied) {
        const nextSlot = getNextAvailableSlot(dateVal, timeVal, db, srvDur);
        const freeSlots = getAvailableSlots(dateVal, db, srvDur);
        const suggestedSlots = freeSlots.slice(0, 3).map((slot) => {
          const slotTime = typeof slot === 'string' ? slot : slot.time;
          return {
            id: `slot_${slotTime}`,
            title: `🕒 ${slotTime}`,
            slotTime: slotTime,
          };
        });

        session.activeButtons = suggestedSlots;
        session.variables['data_agendamento'] = dateVal;
        session.currentNodeId = currentNode.id;

        recordLiveLog(
          'appointment_status',
          `Conflito Evitado: ${timeVal}`,
          `Cliente ${clientName} tentou agendar ${timeVal} que já estava ocupado. Sugerido: ${nextSlot || 'outro dia'}.`,
          cleanPhone,
          clientName,
          { attemptedTime: timeVal, date: dateVal, suggestedSlot: nextSlot }
        );

        if (suggestedSlots.length > 0) {
          replies.push({
            type: 'buttons',
            body: `⚠️ *Horário das ${timeVal} já está Ocupado!*\n\nOlá *${clientName}*, o horário das *${timeVal}* no dia *${dateVal}* já foi reservado por outro cliente.\n\n👉 *Sugerimos o próximo horário livre disponível com tempo suficiente (${srvDur} min):* *${nextSlot || suggestedSlots[0].slotTime}*`,
            footer: 'Toque em um dos horários livres abaixo para agendar:',
            buttons: suggestedSlots,
          });
        } else {
          replies.push(`⚠️ *Agenda Lotada para ${dateVal}*\n\nOlá *${clientName}*, o horário das *${timeVal}* já foi reservado e não há outros horários com ${srvDur} min disponíveis nesta data. Por favor, digite outra data para agendamento.`);
        }
        break;
      }

      const newApt = {
        id: `apt-${Date.now()}`,
        contact_phone: cleanPhone,
        contact_name: clientName,
        service_name: srvName,
        duration_minutes: srvDur,
        appointment_date: dateVal,
        appointment_time: timeVal,
        end_time: endTimeVal,
        slots_count: slotsCount,
        status: 'confirmed',
        created_at: new Date().toISOString(),
      };

      if (!db.appointments) db.appointments = [];
      db.appointments.push(newApt);

      recordLiveLog(
        'appointment_created',
        `Agendamento Confirmado: ${srvName}`,
        `${clientName} agendou para ${dateVal} às ${timeVal}`,
        cleanPhone,
        clientName,
        newApt
      );

      if (db.contacts[cleanPhone]) {
        const curTags = db.contacts[cleanPhone].tags || [];
        if (!curTags.includes('Agendado')) db.contacts[cleanPhone].tags = [...curTags, 'Agendado'];
      }

      session.variables['data_agendamento'] = dateVal;
      session.variables['horario_agendamento'] = timeVal;
      session.variables['servico_agendado'] = srvName;

      const defaultConfirm = `✅ *Agendamento Confirmado com Sucesso!*\n\n• *Cliente:* ${clientName}\n• *Serviço:* ${srvName}${srvPrice ? ` (${srvPrice})` : ''}\n• *Data:* ${dateVal}\n• *Horário:* ${timeVal}\n\nSeu horário foi reservado em nossa Agenda com sucesso!`;
      const confirmText = config.confirmMessage ? replaceVars(config.confirmMessage, session.variables, botProfile) : defaultConfirm;
      replies.push(confirmText);
    }

    // 5. Update Contact Profile Node (Salvar / Vincular Dados no Perfil do Cliente)
    else if (nodeType === 'update_contact') {
      if (!db.contacts) db.contacts = {};
      if (!db.contacts[cleanPhone]) {
        db.contacts[cleanPhone] = {
          id: `contact-${cleanPhone}`,
          phone: cleanPhone,
          name: senderName || 'Cliente',
          profile_picture_url: profilePicUrl || undefined,
          status: 'active',
          tags: ['Cliente'],
          is_registered: true,
          custom_fields: {},
          metadata: {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      }

      // 1. Profile Picture
      if (profilePicUrl) {
        db.contacts[cleanPhone].profile_picture_url = profilePicUrl;
      }

      // 2. Client Name Resolution
      let resolvedName = '';
      if (config.contactName) {
        const cleanNameKey = config.contactName.replace(/[{}]/g, '').trim();
        resolvedName =
          session.variables[cleanNameKey] ||
          session.variables['nome_cliente'] ||
          session.variables['nome'] ||
          session.variables['cliente_nome'];
        if (!resolvedName && config.contactName.includes('{{')) {
          resolvedName = replaceVars(config.contactName, session.variables, botProfile);
        }
      } else {
        resolvedName =
          session.variables.nome_cliente ||
          session.variables.nome ||
          session.variables.cliente_nome ||
          session.variables.resposta_usuario ||
          senderName;
      }

      resolvedName = String(resolvedName || '').trim();
      // Guard against saving literal variable placeholder names as the contact name
      if (
        resolvedName === 'nome_cliente' ||
        resolvedName === 'nome' ||
        resolvedName === 'cliente_nome' ||
        resolvedName === 'undefined' ||
        resolvedName === 'null'
      ) {
        resolvedName =
          session.variables.nome_cliente ||
          session.variables.nome ||
          session.variables.resposta_usuario ||
          senderName ||
          'Cliente';
      }

      if (resolvedName && resolvedName !== 'Cliente' && resolvedName !== 'Cliente WhatsApp' && resolvedName !== 'nome_cliente') {
        session.variables.nome_cliente = resolvedName;
        session.variables.cliente_nome = resolvedName;
        session.variables.nome = resolvedName;
        db.contacts[cleanPhone].name = resolvedName;
        if (db.conversations && db.conversations[`conv-${cleanPhone}`]) {
          db.conversations[`conv-${cleanPhone}`].contact_name = resolvedName;
          syncConversationToSupabase(db.conversations[`conv-${cleanPhone}`]);
        }
      }

      // 3. WhatsApp Phone Number & Variable Creation
      const phoneVarKey = (config.phoneVarName || 'telefone_whatsapp').replace(/[{}]/g, '').trim();
      session.variables[phoneVarKey] = cleanPhone;
      session.variables['telefone_cliente'] = cleanPhone;
      session.variables['telefone_whatsapp'] = cleanPhone;

      if (config.phoneVariable) {
        const cleanPhoneVar = config.phoneVariable.replace(/[{}]/g, '').trim();
        const customPhone = session.variables[cleanPhoneVar] || session.variables[config.phoneVariable];
        if (customPhone) {
          const cleanExtracted = String(customPhone).replace(/\D/g, '');
          if (cleanExtracted.length >= 8) {
            db.contacts[cleanPhone].phone = cleanExtracted;
            session.variables[phoneVarKey] = cleanExtracted;
            session.variables['telefone_cliente'] = cleanExtracted;
          }
        }
      }

      // 4. Tags
      const existingTags = db.contacts[cleanPhone].tags || [];
      const configuredTags = (config.tags || 'Cliente')
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
      db.contacts[cleanPhone].tags = Array.from(new Set([...existingTags, ...configuredTags, 'Cliente']));

      // 5. Custom Metadata / Custom Fields
      if (config.customFieldKey) {
        const fieldKey = config.customFieldKey.replace(/[{}]/g, '').trim();
        let fieldVal = config.customFieldValue || '';
        const cleanValKey = fieldVal.replace(/[{}]/g, '').trim();
        fieldVal = session.variables[cleanValKey] || session.variables[fieldVal] || replaceVars(fieldVal, session.variables, botProfile);

        if (!db.contacts[cleanPhone].custom_fields) db.contacts[cleanPhone].custom_fields = {};
        db.contacts[cleanPhone].custom_fields[fieldKey] = fieldVal;
        session.variables[fieldKey] = fieldVal;
      }

      db.contacts[cleanPhone].is_registered = true;
      db.contacts[cleanPhone].status = 'active';
      db.contacts[cleanPhone].updated_at = new Date().toISOString();

      // Persist directly to Supabase
      syncContactToSupabase(db.contacts[cleanPhone]);
      saveDb(db);
      console.log(`[FlowRunner] 💾 [Salvar Dados] Contato ${cleanPhone} salvo no Supabase com Nome: "${db.contacts[cleanPhone].name}" e Tags: [${(db.contacts[cleanPhone].tags || []).join(', ')}]`);

      // Advance to next node
      const outgoing = edges.find((e) => e.source === currentNode.id);
      if (outgoing) {
        currentNode = nodes.find((n) => n.id === outgoing.target);
        if (currentNode) {
          session.currentNodeId = currentNode.id;
          continue;
        }
      }
      break;
    }

    // 6. Condition Node
    else if (nodeType === 'condition') {
      const varVal = String(session.variables[config.variable] || '').toLowerCase();
      const targetVal = String(config.value || '').toLowerCase();
      const op = config.operator || '==';
      let isTrue = false;

      if (op === '==' || op === 'equals') isTrue = varVal === targetVal;
      else if (op === '!=' || op === 'not_equals') isTrue = varVal !== targetVal;
      else if (op === 'contains') isTrue = varVal.includes(targetVal);

      const conditionEdge =
        edges.find((e) => e.source === currentNode.id && e.sourceHandle === (isTrue ? 'true' : 'false')) ||
        edges.find((e) => e.source === currentNode.id);

      if (conditionEdge) {
        currentNode = nodes.find((n) => n.id === conditionEdge.target);
        continue;
      }
      break;
    }

    // 6.5 Delay / Pause Node
    else if (nodeType === 'delay') {
      const waitSeconds = Math.min(Math.max(Number(config.amount || config.seconds || 2), 1), 10);
      console.log(`[FlowRunner] ⏳ Pausa / Delay de ${waitSeconds}s no fluxo...`);
      await new Promise((r) => setTimeout(r, waitSeconds * 1000));
    }

    // 7. AI Agent Node
    else if (nodeType === 'ai_agent') {
      const pName = botProfile.name || 'Talvane Barber Bot';
      const company = botProfile.company_name || 'Talvane Barber';
      const customReply = config.systemPrompt ? replaceVars(config.systemPrompt, session.variables, botProfile) : null;
      const responseText = customReply || `✨ *${pName} (${company}):*\nRecebi sua mensagem: "${cleanInput}". Como posso te auxiliar a escolher o melhor horário para seu atendimento?`;
      replies.push(responseText);
    }

    // 7.2 HTTP Request / Webhook Node
    else if (nodeType === 'http_request' || nodeType === 'webhook') {
      const targetUrl = replaceVars(config.url || config.webhookUrl || '', session.variables, botProfile);
      if (targetUrl && targetUrl.startsWith('http')) {
        try {
          const method = (config.method || 'POST').toUpperCase();
          const reqHeaders = { 'Content-Type': 'application/json', ...(config.headers || {}) };
          const reqBody = (method !== 'GET' && method !== 'HEAD') ? JSON.stringify({
            phone: cleanPhone,
            variables: session.variables,
            input: cleanInput,
            ...(config.payload || {}),
          }) : undefined;

          console.log(`[FlowRunner] 🌐 Disparando ${method} para: ${targetUrl}`);
          const apiResp = await fetch(targetUrl, { method, headers: reqHeaders, body: reqBody });
          if (apiResp.ok) {
            const jsonResp = await apiResp.json().catch(() => ({}));
            if (config.responseVariable && typeof jsonResp === 'object') {
              session.variables[config.responseVariable] = JSON.stringify(jsonResp);
            }
          }
        } catch (apiErr) {
          console.warn('[FlowRunner] Falha ao disparar HTTP/Webhook:', apiErr.message);
        }
      }
    }

    // 7.5 Media Node (Image, Video, Audio/PTT, Document)
    else if (nodeType === 'media') {
      if (config.mediaUrl) {
        replies.push({
          type: 'media',
          mediaType: config.mediaType || 'image',
          mediaUrl: config.mediaUrl,
          caption: replaceVars(config.caption || '', session.variables, botProfile),
          fileName: config.fileName || 'documento.pdf',
          isPtt: config.isPtt !== false,
        });
      }
    }

    // 8. Human Handoff Node
    else if (nodeType === 'human_handoff') {
      const handoffText = config.notifyMessage ? replaceVars(config.notifyMessage, session.variables, botProfile) : '👨‍💼 *Atendimento Humano:*\n\nVocê foi transferido para nossa equipe de atendimento. Um consultor responderá em breve!';
      replies.push(handoffText);
      if (db.conversations[`conv-${cleanPhone}`]) {
        db.conversations[`conv-${cleanPhone}`].status = 'waiting_human';
      }
      session.currentNodeId = null;
      break;
    }

    // 9. Variable Setter Node
    else if (nodeType === 'variable') {
      if (config.varName) {
        session.variables[config.varName] = config.varValue;
      }
    }

    // 10. End Flow Node (Finalizar Fluxo / Conclusão de Atendimento)
    else if (nodeType === 'end_flow' || nodeType === 'finish_flow' || nodeType === 'end') {
      const defaultMsg = '🏁 *Atendimento finalizado com sucesso!*\n\nSe precisar de algo mais, basta nos enviar uma nova mensagem. Até logo!';
      const finalMsg = config.message !== undefined 
        ? (config.message ? replaceVars(config.message, session.variables, botProfile) : '') 
        : defaultMsg;

      if (finalMsg) {
        replies.push(finalMsg);
      }

      session.currentNodeId = null;
      session.activeButtons = null;
      session.waitingForVar = null;

      if (config.clearVariables !== false) {
        session.variables = {
          whatsapp_pushname: senderName || '',
          telefone_cliente: cleanPhone,
          telefone_whatsapp: cleanPhone,
        };
      }

      if (config.closeConversation !== false && db.conversations && db.conversations[`conv-${cleanPhone}`]) {
        db.conversations[`conv-${cleanPhone}`].status = 'closed';
        db.conversations[`conv-${cleanPhone}`].updated_at = new Date().toISOString();
        syncConversationToSupabase(db.conversations[`conv-${cleanPhone}`]);
      }

      console.log(`[FlowRunner] 🏁 [Finalizar Fluxo] Atendimento concluído e sessão resetada para ${cleanPhone}.`);
      break;
    }

    // Move to next connected node
    const outgoing = edges.find((e) => e.source === currentNode.id);
    if (outgoing) {
      currentNode = nodes.find((n) => n.id === outgoing.target);
      if (currentNode) {
        session.currentNodeId = currentNode.id;
        continue;
      }
    }

    break;
  }

  // Save session in DB
  if (!db.sessions) db.sessions = {};
  db.sessions[cleanPhone] = session;
  db.sessions[rawId] = session;
  saveDb(db);

  // Record all outbound replies
  for (const rep of replies) {
    recordRealMessage(cleanPhone, senderName, 'outbound', rep);
  }

  return replies.length > 0 ? replies : [`Mensagem processada pelo fluxo *${publishedFlow.name}*!`];
}
