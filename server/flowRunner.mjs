import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.resolve(__dirname, 'flows_db.json');

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

export function loadDb() {
  try {
    if (fs.existsSync(DB_PATH)) {
      const data = fs.readFileSync(DB_PATH, 'utf-8');
      const parsed = JSON.parse(data);
      migrateLidContacts(parsed);
      return {
        flows: parsed.flows || [],
        nodes: parsed.nodes || {},
        edges: parsed.edges || {},
        botProfile: parsed.botProfile || {},
        sessions: parsed.sessions || {},
        appointments: parsed.appointments || [],
        contacts: parsed.contacts || {},
        conversations: parsed.conversations || {},
        messages: parsed.messages || {},
        agendaSettings: parsed.agendaSettings || DEFAULT_AGENDA_SETTINGS,
      };
    }
  } catch (err) {
    console.error('[FlowRunner] Erro ao ler flows_db.json:', err);
  }
  return {
    flows: [],
    nodes: {},
    edges: {},
    botProfile: {},
    sessions: {},
    appointments: [],
    contacts: {},
    conversations: {},
    messages: {},
    agendaSettings: DEFAULT_AGENDA_SETTINGS,
  };
}

export function saveDb(data) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('[FlowRunner] Erro ao salvar flows_db.json:', err);
  }
}

// Generate available time slots for a given date based on Agenda Settings and Booked Appointments
export function getAvailableSlots(dateStr, db) {
  const settings = db.agendaSettings || DEFAULT_AGENDA_SETTINGS;
  const startHour = parseInt(settings.start_time.split(':')[0], 10);
  const startMin = parseInt(settings.start_time.split(':')[1] || '0', 10);
  const endHour = parseInt(settings.end_time.split(':')[0], 10);
  const endMin = parseInt(settings.end_time.split(':')[1] || '0', 10);
  const duration = settings.slot_duration_minutes || 30;

  const breakStart = settings.break_start_time || '12:00';
  const breakEnd = settings.break_end_time || '13:00';

  const bookedRanges = (db.appointments || [])
    .filter((a) => a.appointment_date === dateStr && a.status !== 'cancelled')
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
      const srvDuration = a.duration_minutes || srv?.duration_minutes || (srvName.toLowerCase().includes('barba') ? 55 : duration);
      const startM = sHour * 60 + sMin;
      const endM = startM + srvDuration;
      return { startM, endM };
    });

  const slots = [];
  let currentMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;

  const breakStartMin = parseInt(breakStart.split(':')[0], 10) * 60 + parseInt(breakStart.split(':')[1] || '0', 10);
  const breakEndMin = parseInt(breakEnd.split(':')[0], 10) * 60 + parseInt(breakEnd.split(':')[1] || '0', 10);

  while (currentMinutes + duration <= endMinutes) {
    // Check if within break time
    if (currentMinutes >= breakStartMin && currentMinutes < breakEndMin) {
      currentMinutes = breakEndMin;
      continue;
    }

    const slotStart = currentMinutes;
    const slotEnd = currentMinutes + duration;

    // Check if overlapping with any existing appointment range
    const isOverlapping = bookedRanges.some((r) => slotStart < r.endM && slotEnd > r.startM);

    if (!isOverlapping) {
      const h = Math.floor(slotStart / 60);
      const m = slotStart % 60;
      const timeFormatted = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      slots.push(timeFormatted);
    }

    currentMinutes += duration;
  }

  return slots;
}

// Substitute template variables {{var_name}}
export function replaceVars(text, vars = {}, botProfile = {}) {
  if (!text) return '';
  let res = text;

  res = res.replace(/\{\{bot_nome\}\}/gi, botProfile.name || '7 Assistente');
  res = res.replace(/\{\{empresa\}\}/gi, botProfile.company_name || 'Minha Empresa');
  res = res.replace(/\{\{bot_genero\}\}/gi, botProfile.gender === 'female' ? 'Feminino' : 'Masculino');
  res = res.replace(/\{\{bot_tom\}\}/gi, botProfile.tone || 'Amigável');
  res = res.replace(/\{\{suporte_telefone\}\}/gi, botProfile.support_phone || '+55 81 99613-8924');
  res = res.replace(/\{\{suporte_email\}\}/gi, botProfile.support_email || 'suporte@empresa.com');
  res = res.replace(/\{\{horario_atendimento\}\}/gi, botProfile.business_hours || '08h às 18h');
  res = res.replace(/\{\{site_empresa\}\}/gi, botProfile.website_url || 'https://7assistente.com.br');
  res = res.replace(/\{\{mensagem_boas_vindas\}\}/gi, botProfile.welcome_message || '');

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
    name: senderName || 'Cliente WhatsApp',
    profile_picture_url: profilePicUrl || undefined,
    status: 'active',
    tags: explicitTags || ['WhatsApp'],
    metadata: {},
    created_at: now,
  };

  if (senderName && (!existingContact.name || existingContact.name === 'Cliente WhatsApp' || existingContact.name === 'Cliente')) {
    existingContact.name = senderName;
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
  return db.messages?.[convId] || [];
}

export function getLiveContacts() {
  const db = loadDb();
  const contacts = Object.values(db.contacts || {});
  contacts.sort((a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime());
  return contacts;
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

  // Find published flow
  const publishedFlows = (db.flows || []).filter((f) => f.status === 'published');
  const publishedFlow = publishedFlows[0] || db.flows?.[0];

  if (!publishedFlow) {
    const defaultReply = `Olá, *${senderName}*! Recebi sua mensagem: "${cleanInput}".\n\nNo momento, não há nenhum fluxo ativo publicado no painel administrativo.`;
    recordRealMessage(cleanPhone, senderName, 'outbound', defaultReply);
    return [defaultReply];
  }

  const flowId = publishedFlow.id;
  const nodes = db.nodes?.[flowId] || [];
  const edges = db.edges?.[flowId] || [];

  if (nodes.length === 0) {
    const noNodesReply = `Olá! O fluxo *${publishedFlow.name}* está publicado, mas ainda não possui nós configurados.`;
    recordRealMessage(cleanPhone, senderName, 'outbound', noNodesReply);
    return [noNodesReply];
  }

  let session = db.sessions?.[cleanPhone] || db.sessions?.[rawId] || {
    flowId,
    currentNodeId: null,
    variables: {},
  };

  if (session.flowId !== flowId) {
    session.flowId = flowId;
    session.currentNodeId = null;
  }

  session.variables = {
    ...session.variables,
    nome_cliente: session.variables.nome_cliente || senderName,
    telefone_cliente: cleanPhone,
    ultima_mensagem: cleanInput,
  };

  const botProfile = db.botProfile || {};
  const replies = [];

  const isReset =
    cleanInput.toLowerCase() === 'menu' ||
    cleanInput.toLowerCase() === 'inicio' ||
    cleanInput.toLowerCase() === 'reiniciar' ||
    cleanInput.toLowerCase() === 'oi' ||
    cleanInput.toLowerCase() === 'olá' ||
    cleanInput.toLowerCase() === 'ola' ||
    !session.currentNodeId;

  let currentNode = null;

  if (isReset) {
    currentNode = nodes.find((n) => (n.data?.nodeType || n.type) === 'trigger') || nodes[0];
    session.currentNodeId = currentNode.id;
  } else {
    const prevNode = nodes.find((n) => n.id === session.currentNodeId);
    const prevType = prevNode?.data?.nodeType || prevNode?.type;

    // 1. Question response
    if (prevNode && prevType === 'question') {
      const qConfig = prevNode.data?.config || {};
      const varKey = qConfig.variableName || session.waitingForVar || 'resposta_usuario';
      session.variables[varKey] = cleanInput;
      session.waitingForVar = null;

      if (varKey.includes('nome')) {
        session.variables.nome_cliente = cleanInput;
        if (db.contacts[cleanPhone]) db.contacts[cleanPhone].name = cleanInput;
        if (db.conversations[`conv-${cleanPhone}`]) db.conversations[`conv-${cleanPhone}`].contact_name = cleanInput;
      }

      const nextEdge = edges.find((e) => e.source === prevNode.id);
      if (nextEdge) {
        currentNode = nodes.find((n) => n.id === nextEdge.target);
        session.currentNodeId = currentNode?.id || null;
      }
    }

    // 2. Buttons / Available slots selection
    else if (prevNode && (prevType === 'buttons' || prevType === 'schedule_contact')) {
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

      if (matchedBtnIndex >= 0) {
        const matchedBtn = buttons[matchedBtnIndex];
        session.variables['opcao_selecionada'] = matchedBtn.title;
        session.variables['botao_id'] = matchedBtn.id;

        // If from schedule slot selection
        if (prevType === 'schedule_contact' && matchedBtn.id.startsWith('slot_')) {
          const selectedTime = matchedBtn.slotTime || matchedBtn.title.replace('🕒', '').trim();
          const selectedDate = session.variables['data_agendamento'] || new Date().toISOString().split('T')[0];
          const srvName = prevNode.data?.config?.serviceName || session.variables['servico_selecionado'] || 'Atendimento Especialista';

          const srv = (db.agendaSettings?.services || []).find((s) => s.name?.toLowerCase().trim() === srvName.toLowerCase().trim());
          const srvDur = srv?.duration_minutes || session.variables['duracao_minutos'] || (srvName.toLowerCase().includes('barba') ? 55 : 30);

          const newApt = {
            id: `apt-${Date.now()}`,
            contact_phone: cleanPhone,
            contact_name: session.variables.nome_cliente || senderName,
            service_name: srvName,
            duration_minutes: srvDur,
            appointment_date: selectedDate,
            appointment_time: selectedTime,
            status: 'confirmed',
            created_at: new Date().toISOString(),
          };
          if (!db.appointments) db.appointments = [];
          db.appointments.push(newApt);

          // Add tag
          if (db.contacts[cleanPhone]) {
            const curTags = db.contacts[cleanPhone].tags || [];
            if (!curTags.includes('Agendado')) db.contacts[cleanPhone].tags = [...curTags, 'Agendado'];
          }

          session.variables['data_agendamento'] = selectedDate;
          session.variables['horario_agendamento'] = selectedTime;
          session.variables['servico_agendado'] = srvName;

          const defaultMsg = `✅ *Agendamento Confirmado com Sucesso!*\n\n• *Serviço:* ${srvName}\n• *Data:* ${selectedDate}\n• *Horário:* ${selectedTime}\n\nSeu horário foi reservado em nossa Agenda.`;
          const confirmMsg = prevNode.data?.config?.confirmMessage ? replaceVars(prevNode.data.config.confirmMessage, session.variables, botProfile) : defaultMsg;
          replies.push(confirmMsg);
        }

        // If from services_catalog button selection
        if (prevType === 'services_catalog' && matchedBtn.id.startsWith('srv_')) {
          const srvId = matchedBtn.id.replace('srv_', '');
          const services = db.agendaSettings?.services || [];
          const matchedService = services.find((s) => s.id === srvId) || matchedBtn.fullService;
          const srvName = matchedService?.name || matchedBtn.title;
          const srvPrice = matchedService ? `R$ ${matchedService.price.toFixed(2).replace('.', ',')}` : '';
          const srvDur = matchedService?.duration_minutes || 30;

          session.variables['servico_selecionado'] = srvName;
          session.variables['valor_servico'] = srvPrice;
          session.variables['duracao_servico'] = srvDur;
          session.variables['duracao_minutos'] = srvDur;
          console.log(`[FlowRunner] 🏷️ Serviço selecionado pelo cliente: ${srvName} (${srvPrice}, ${srvDur} min)`);
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

    // 1. Message Node
    if (nodeType === 'message') {
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

    // 4. Check Contact Node (Primeiro Contato vs Contato Salvo)
    else if (nodeType === 'check_contact') {
      const existingContact = db.contacts && db.contacts[cleanPhone];
      const hasPriorMessages = db.messages && db.messages[`conv-${cleanPhone}`] && db.messages[`conv-${cleanPhone}`].length > 1;
      const aptsCount = (db.appointments || []).filter((a) => a.contact_phone === cleanPhone).length;
      
      const isExisting = Boolean(existingContact && (existingContact.name || existingContact.tags?.length > 0 || hasPriorMessages || aptsCount > 0));
      const isNew = !isExisting;

      // Populate rich context variables
      session.variables['is_primeiro_contato'] = isNew;
      session.variables['is_novo_contato'] = isNew;
      session.variables['tipo_cliente'] = isNew ? 'novo' : 'recorrente';
      session.variables['telefone_whatsapp'] = cleanPhone;
      session.variables['nome_cliente'] = existingContact?.name || senderName;
      session.variables['tags_contato'] = (existingContact?.tags || []).join(', ');
      session.variables['total_agendamentos'] = aptsCount;

      console.log(`[FlowRunner] 👥 Verificação de Contato para ${cleanPhone}: ${isNew ? 'NOVO CONTATO (1ª Vez)' : 'CONTATO JÁ SALVO'}`);

      // Follow edge from 'is_new' or 'is_existing' handle
      const targetHandle = isNew ? 'is_new' : 'is_existing';
      const branchEdge = edges.find((e) => e.source === currentNode.id && e.sourceHandle === targetHandle) ||
        edges.find((e) => e.source === currentNode.id);

      if (branchEdge) {
        currentNode = nodes.find((n) => n.id === branchEdge.target);
        if (currentNode) {
          session.currentNodeId = currentNode.id;
          continue;
        }
      }
      break;
    }

    // 5. Services Catalog Node (Serviços e Valores da Agenda)
    else if (nodeType === 'services_catalog') {
      const services = (db.agendaSettings?.services && db.agendaSettings.services.length > 0) ? db.agendaSettings.services : [
        { id: 'srv-1', name: 'Atendimento Especialista', duration_minutes: 30, price: 150 },
        { id: 'srv-2', name: 'Demonstração da Plataforma', duration_minutes: 45, price: 0 },
        { id: 'srv-3', name: 'Suporte & Configuração', duration_minutes: 30, price: 80 },
      ];

      const isTextList = config.displayFormat === 'text_list';

      if (isTextList) {
        const intro = replaceVars(config.introMessage || 'Conheça nossos serviços e valores disponíveis:', session.variables, botProfile);
        const listLines = services.map((s, idx) => `*${idx + 1}.* 🏷️ *${s.name}*\n   💰 R$ ${s.price.toFixed(2).replace('.', ',')} • ⏱️ ${s.duration_minutes} min`).join('\n\n');
        replies.push(`${intro}\n\n${listLines}`);
      } else {
        const intro = replaceVars(config.introMessage || 'Conheça nossos serviços e valores:', session.variables, botProfile);
        const footer = config.footerText ? replaceVars(config.footerText, session.variables, botProfile) : 'Toque no serviço desejado para agendar:';

        const serviceButtons = services.slice(0, 3).map((s, idx) => ({
          id: `srv_${s.id}`,
          title: `${s.name.substring(0, 15)} (R$${s.price})`,
          fullService: s,
        }));

        session.activeButtons = serviceButtons;
        session.currentNodeId = currentNode.id;

        replies.push({
          type: 'buttons',
          body: intro,
          footer,
          buttons: serviceButtons,
        });
        break;
      }
    }

    // 6. Schedule Contact & Available Slots Node (Agenda Integrada)
    else if (nodeType === 'schedule_contact') {
      const mode = config.mode || 'show_slots';

      // Date resolution
      let dateVal = '';
      if (config.dateType === 'tomorrow') {
        const tm = new Date();
        tm.setDate(tm.getDate() + 1);
        dateVal = tm.toISOString().split('T')[0];
      } else if (config.dateType === 'variable' && config.dateVariable) {
        dateVal = session.variables[config.dateVariable] || new Date().toISOString().split('T')[0];
      } else {
        dateVal = new Date().toISOString().split('T')[0];
      }

      const srvName = config.serviceName ? replaceVars(config.serviceName, session.variables, botProfile) : (session.variables['servico_selecionado'] || 'Atendimento Especializado');

      if (mode === 'confirm_booking') {
        const timeVal = session.variables[config.timeVariable || 'horario_agendamento'] || session.variables['horario_escolhido'] || '09:00';
        const srvObj = (db.agendaSettings?.services || []).find((s) => s.name?.toLowerCase().trim() === srvName.toLowerCase().trim());
        const srvDur = srvObj?.duration_minutes || session.variables['duracao_minutos'] || (srvName.toLowerCase().includes('barba') ? 55 : 30);

        const newApt = {
          id: `apt-${Date.now()}`,
          contact_phone: cleanPhone,
          contact_name: session.variables.nome_cliente || senderName,
          service_name: srvName,
          duration_minutes: srvDur,
          appointment_date: dateVal,
          appointment_time: timeVal,
          status: 'confirmed',
          created_at: new Date().toISOString(),
        };

        if (!db.appointments) db.appointments = [];
        db.appointments.push(newApt);

        if (db.contacts[cleanPhone]) {
          const curTags = db.contacts[cleanPhone].tags || [];
          if (!curTags.includes('Agendado')) db.contacts[cleanPhone].tags = [...curTags, 'Agendado'];
        }

        session.variables['data_agendamento'] = dateVal;
        session.variables['horario_agendamento'] = timeVal;
        session.variables['servico_agendado'] = srvName;

        const defaultConfirm = `✅ *Agendamento Confirmado com Sucesso!*\n\n• *Serviço:* ${srvName}\n• *Data:* ${dateVal}\n• *Horário:* ${timeVal}\n\nSeu horário foi reservado em nossa Agenda.`;
        const confirmText = config.confirmMessage ? replaceVars(config.confirmMessage, session.variables, botProfile) : defaultConfirm;
        replies.push(confirmText);
      } else {
        // Mode 'show_slots': Check available slots
        const slots = getAvailableSlots(dateVal, db);

        if (slots.length === 0) {
          replies.push(`📅 *Agenda Lotada para ${dateVal}*\n\nInfelizmente não temos mais horários disponíveis para esta data. Por favor, digite outra data.`);
          session.currentNodeId = currentNode.id;
          break;
        }

        // Present top 3 available slots as Native Clickable Buttons
        const slotButtons = slots.slice(0, 3).map((slot) => ({
          id: `slot_${slot}`,
          title: `🕒 ${slot}`,
          slotTime: slot,
        }));

        session.activeButtons = slotButtons;
        session.variables['data_agendamento'] = dateVal;
        session.variables['servico_selecionado'] = srvName;
        session.currentNodeId = currentNode.id;

        replies.push({
          type: 'buttons',
          body: `📅 *Horários Disponíveis na Agenda (${dateVal}):*\n\nServiço: *${srvName}*\n\nEscolha o melhor horário:`,
          footer: 'Toque no horário desejado para confirmar:',
          buttons: slotButtons,
        });
        break;
      }
    }

    // 5. Update Contact Profile Node
    else if (nodeType === 'update_contact') {
      if (!db.contacts[cleanPhone]) {
        db.contacts[cleanPhone] = {
          id: `contact-${cleanPhone}`,
          phone: cleanPhone,
          name: senderName,
          profile_picture_url: profilePicUrl || undefined,
          status: 'active',
          tags: [],
          metadata: {},
          created_at: new Date().toISOString(),
        };
      }

      // 1. Profile Picture
      if (profilePicUrl) {
        db.contacts[cleanPhone].profile_picture_url = profilePicUrl;
      }

      // 2. Client Name
      if (config.contactName && session.variables[config.contactName]) {
        const newName = String(session.variables[config.contactName]).trim();
        session.variables.nome_cliente = newName;
        db.contacts[cleanPhone].name = newName;
        if (db.conversations[`conv-${cleanPhone}`]) {
          db.conversations[`conv-${cleanPhone}`].contact_name = newName;
        }
      } else if (senderName && (!db.contacts[cleanPhone].name || db.contacts[cleanPhone].name === 'Cliente')) {
        db.contacts[cleanPhone].name = senderName;
      }

      // 3. WhatsApp Phone Number & Variable Creation
      const phoneVarKey = (config.phoneVarName || 'telefone_whatsapp').trim();
      session.variables[phoneVarKey] = cleanPhone;
      session.variables['telefone_cliente'] = cleanPhone;

      if (config.phoneVariable && session.variables[config.phoneVariable]) {
        const cleanExtracted = String(session.variables[config.phoneVariable]).replace(/\D/g, '');
        if (cleanExtracted.length >= 8) {
          db.contacts[cleanPhone].phone = cleanExtracted;
          session.variables[phoneVarKey] = cleanExtracted;
          session.variables['telefone_cliente'] = cleanExtracted;
        }
      } else {
        db.contacts[cleanPhone].phone = cleanPhone;
      }

      // 4. Tags
      if (config.tags) {
        const configuredTags = config.tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean);
        if (configuredTags.length > 0) {
          db.contacts[cleanPhone].tags = configuredTags;
        }
      }

      // 5. Custom Metadata
      if (config.customFieldKey) {
        const val = session.variables[config.customFieldValue] || config.customFieldValue || '';
        if (!db.contacts[cleanPhone].metadata) db.contacts[cleanPhone].metadata = {};
        db.contacts[cleanPhone].metadata[config.customFieldKey] = val;
      }

      db.contacts[cleanPhone].updated_at = new Date().toISOString();
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

    // 7. AI Agent Node
    else if (nodeType === 'ai_agent') {
      const pName = botProfile.name || 'Sofia';
      replies.push(`✨ *${pName}:* Entendi sua mensagem sobre "${cleanInput}". Como posso te ajudar a avançar?`);
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
      replies.push(`👨‍💼 *Atendimento Humano:*\n\n${config.notifyMessage || 'Você foi transferido para nossa equipe de atendimento. Um consultor responderá em breve!'}`);
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
