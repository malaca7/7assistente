import { supabase, isSupabaseConfigured } from './supabase';
import { 
  AdminProfile, 
  Settings, 
  Flow, 
  Contact, 
  Conversation, 
  Message, 
  DashboardKPIs,
  FlowNode,
  FlowEdge,
  BotProfile,
  Appointment,
  AgendaSettings
} from '../types';
import { 
  initialAdminProfile, 
  initialSettings, 
  sampleFlows, 
  sampleContacts, 
  sampleConversations, 
  sampleMessages, 
  initialKPIs,
  initialFlowNodes,
  initialFlowEdges,
  defaultBotProfile
} from './mockData';

const STORAGE_KEYS = {
  ADMIN: '7assistente_admin_profile',
  SETTINGS: '7assistente_settings',
  FLOWS: '7assistente_flows',
  FLOW_NODES_PREFIX: '7assistente_nodes_',
  FLOW_EDGES_PREFIX: '7assistente_edges_',
  CONTACTS: '7assistente_contacts',
  CONVERSATIONS: '7assistente_conversations',
  MESSAGES_PREFIX: '7assistente_msgs_',
  AUTH_TOKEN: '7assistente_auth_session',
};

// Helper for localStorage
function getItem<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error('Failed to save to localStorage:', err);
  }
}

async function syncWithWhatsAppServer(): Promise<void> {
  try {
    let backendUrl = 'https://talvanebarber.discloud.app';
    if (typeof window !== 'undefined') {
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        backendUrl = `http://${window.location.hostname}:3001`;
      } else if (window.location.hostname.includes('discloud.app')) {
        backendUrl = window.location.origin;
      }
    }

    const flows = getItem<Flow[]>(STORAGE_KEYS.FLOWS, sampleFlows);
    const settings = getItem<Settings>(STORAGE_KEYS.SETTINGS, initialSettings);
    const nodesMap: Record<string, FlowNode[]> = {};
    const edgesMap: Record<string, FlowEdge[]> = {};

    for (const f of flows) {
      nodesMap[f.id] = getItem<FlowNode[]>(`${STORAGE_KEYS.FLOW_NODES_PREFIX}${f.id}`, f.id === 'flow-001' ? (initialFlowNodes as FlowNode[]) : []);
      edgesMap[f.id] = getItem<FlowEdge[]>(`${STORAGE_KEYS.FLOW_EDGES_PREFIX}${f.id}`, f.id === 'flow-001' ? (initialFlowEdges as FlowEdge[]) : []);
    }

    await fetch(`${backendUrl}/api/whatsapp/sync-flows`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        flows,
        nodes: nodesMap,
        edges: edgesMap,
        botProfile: settings.bot_profile,
      }),
    });
  } catch (e) {
    // Ignore if server is not reachable
  }
}

export const StorageService = {
  // Admin Profile
  async getAdminProfile(): Promise<AdminProfile> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('admin_profiles').select('*').limit(1).maybeSingle();
        if (data && !error) return data as AdminProfile;
      } catch (e) {
        console.warn('Supabase admin_profiles fetch fallback:', e);
      }
    }
    return getItem<AdminProfile>(STORAGE_KEYS.ADMIN, initialAdminProfile);
  },

  async updateAdminProfile(profile: Partial<AdminProfile>): Promise<AdminProfile> {
    const current = await this.getAdminProfile();
    const updated = { ...current, ...profile, updated_at: new Date().toISOString() };
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('admin_profiles').upsert(updated);
      } catch (e) {
        console.warn('Supabase admin_profiles upsert fallback:', e);
      }
    }
    setItem(STORAGE_KEYS.ADMIN, updated);
    return updated;
  },

  // Settings & Bot Profile
  async getSettings(): Promise<Settings> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('settings').select('*').limit(1).maybeSingle();
        if (data && !error) {
          return {
            ...data,
            bot_profile: data.bot_profile || defaultBotProfile
          } as Settings;
        }
      } catch (e) {
        console.warn('Supabase settings fetch fallback:', e);
      }
    }
    return getItem<Settings>(STORAGE_KEYS.SETTINGS, initialSettings);
  },

  async updateSettings(settings: Partial<Settings>): Promise<Settings> {
    const current = await this.getSettings();
    const updated = { ...current, ...settings, updated_at: new Date().toISOString() };
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('settings').upsert(updated);
      } catch (e) {
        console.warn('Supabase settings upsert fallback:', e);
      }
    }
    setItem(STORAGE_KEYS.SETTINGS, updated);
    return updated;
  },

  async getBotProfile(): Promise<BotProfile> {
    const settings = await this.getSettings();
    return settings.bot_profile || defaultBotProfile;
  },

  async updateBotProfile(botProfile: Partial<BotProfile>): Promise<Settings> {
    const settings = await this.getSettings();
    const updatedSettings = {
      ...settings,
      bot_profile: { ...(settings.bot_profile || defaultBotProfile), ...botProfile },
    };
    return this.updateSettings(updatedSettings);
  },

  async getBotVariables(): Promise<Record<string, string>> {
    const profile = await this.getBotProfile();
    return {
      'bot_nome': profile.name || '7 Assistente',
      'empresa': profile.company_name || 'Minha Empresa',
      'bot_genero': profile.gender === 'female' ? 'Feminino' : profile.gender === 'male' ? 'Masculino' : 'Neutro',
      'bot_tom': profile.tone || 'Amigável',
      'bot_foto': profile.avatar_url || '',
      'ramo_empresa': profile.company_segment || '',
      'suporte_email': profile.support_email || '',
      'suporte_telefone': profile.support_phone || '',
      'horario_atendimento': profile.business_hours || '08h às 18h',
      'site_empresa': profile.website_url || '',
      'mensagem_boas_vindas': profile.welcome_message || '',
    };
  },

  // Dashboard KPIs
  async getKPIs(): Promise<DashboardKPIs> {
    const flows = await this.getFlows();
    const contacts = await this.getContacts();
    const conversations = await this.getConversations();

    const activeFlows = flows.filter(f => f.status === 'published').length;
    const waitingHuman = conversations.filter(c => c.status === 'waiting_human').length;
    const activeConversations = conversations.filter(c => c.status === 'bot' || c.status === 'human').length;
    const messagesCount = conversations.length;

    return {
      totalContacts: contacts.length,
      totalConversations: conversations.length,
      activeConversations: activeConversations,
      activeFlows: activeFlows,
      waitingHuman: waitingHuman,
      messagesSentToday: messagesCount,
    };
  },

  // Flows
  async getFlows(): Promise<Flow[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('flows').select('*').order('updated_at', { ascending: false });
        if (data && data.length > 0 && !error) return data as Flow[];
      } catch (e) {
        console.warn('Supabase flows fetch fallback:', e);
      }
    }
    return getItem<Flow[]>(STORAGE_KEYS.FLOWS, sampleFlows);
  },

  async getFlowById(id: string): Promise<Flow | null> {
    const flows = await this.getFlows();
    return flows.find(f => f.id === id) || null;
  },

  async saveFlow(flow: Flow): Promise<Flow> {
    const flows = await this.getFlows();
    const index = flows.findIndex(f => f.id === flow.id);
    const updated = { ...flow, updated_at: new Date().toISOString() };
    
    if (index >= 0) {
      flows[index] = updated;
    } else {
      flows.unshift(updated);
    }

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('flows').upsert(updated);
      } catch (e) {
        console.warn('Supabase flow upsert fallback:', e);
      }
    }
    setItem(STORAGE_KEYS.FLOWS, flows);
    syncWithWhatsAppServer();
    return updated;
  },

  async deleteFlow(id: string): Promise<void> {
    const flows = await this.getFlows();
    const filtered = flows.filter(f => f.id !== id);
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('flows').delete().eq('id', id);
      } catch (e) {
        console.warn('Supabase flow delete fallback:', e);
      }
    }
    setItem(STORAGE_KEYS.FLOWS, filtered);
    localStorage.removeItem(`${STORAGE_KEYS.FLOW_NODES_PREFIX}${id}`);
    localStorage.removeItem(`${STORAGE_KEYS.FLOW_EDGES_PREFIX}${id}`);
    syncWithWhatsAppServer();
  },

  async duplicateFlow(id: string): Promise<Flow> {
    const flow = await this.getFlowById(id);
    if (!flow) throw new Error('Fluxo não encontrado');
    
    const newId = `flow-${Date.now()}`;
    const newFlow: Flow = {
      ...flow,
      id: newId,
      name: `${flow.name} (Cópia)`,
      status: 'draft',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const nodes = await this.getFlowNodes(id);
    const edges = await this.getFlowEdges(id);

    await this.saveFlow(newFlow);
    await this.saveFlowGraph(newId, nodes, edges);
    return newFlow;
  },

  // Flow Nodes & Edges
  async getFlowNodes(flowId: string): Promise<FlowNode[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('flow_nodes').select('*').eq('flow_id', flowId);
        if (data && data.length > 0 && !error) {
          return data.map(d => ({
            id: d.id,
            flow_id: d.flow_id,
            type: d.node_type,
            position: { x: Number(d.position_x), y: Number(d.position_y) },
            data: d.data,
          })) as FlowNode[];
        }
      } catch (e) {
        console.warn('Supabase flow_nodes fetch fallback:', e);
      }
    }
    if (flowId === 'flow-001') {
      const stored = getItem<FlowNode[] | null>(`${STORAGE_KEYS.FLOW_NODES_PREFIX}${flowId}`, null);
      return stored || initialFlowNodes as FlowNode[];
    }
    return getItem<FlowNode[]>(`${STORAGE_KEYS.FLOW_NODES_PREFIX}${flowId}`, []);
  },

  async getFlowEdges(flowId: string): Promise<FlowEdge[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('flow_edges').select('*').eq('flow_id', flowId);
        if (data && data.length > 0 && !error) {
          return data.map(e => ({
            id: e.id,
            flow_id: e.flow_id,
            source: e.source_node_id,
            target: e.target_node_id,
            sourceHandle: e.source_handle,
            targetHandle: e.target_handle,
            data: e.condition,
          })) as FlowEdge[];
        }
      } catch (e) {
        console.warn('Supabase flow_edges fetch fallback:', e);
      }
    }
    if (flowId === 'flow-001') {
      const stored = getItem<FlowEdge[] | null>(`${STORAGE_KEYS.FLOW_EDGES_PREFIX}${flowId}`, null);
      return stored || initialFlowEdges as FlowEdge[];
    }
    return getItem<FlowEdge[]>(`${STORAGE_KEYS.FLOW_EDGES_PREFIX}${flowId}`, []);
  },

  async saveFlowGraph(flowId: string, nodes: FlowNode[], edges: FlowEdge[]): Promise<void> {
    setItem(`${STORAGE_KEYS.FLOW_NODES_PREFIX}${flowId}`, nodes);
    setItem(`${STORAGE_KEYS.FLOW_EDGES_PREFIX}${flowId}`, edges);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('flow_nodes').delete().eq('flow_id', flowId);
        if (nodes.length > 0) {
          await supabase.from('flow_nodes').insert(
            nodes.map(n => ({
              flow_id: flowId,
              node_type: n.data?.nodeType || n.type,
              position_x: n.position.x,
              position_y: n.position.y,
              data: n.data,
            }))
          );
        }

        await supabase.from('flow_edges').delete().eq('flow_id', flowId);
        if (edges.length > 0) {
          await supabase.from('flow_edges').insert(
            edges.map(e => ({
              flow_id: flowId,
              source_node_id: e.source,
              target_node_id: e.target,
              source_handle: e.sourceHandle,
              target_handle: e.targetHandle,
              condition: e.data,
            }))
          );
        }
      } catch (e) {
        console.warn('Supabase graph save fallback:', e);
      }
    }
    syncWithWhatsAppServer();
  },

  // Contacts
  async getContacts(): Promise<Contact[]> {
    let serverContacts: Contact[] = [];
    try {
      const res = await fetch('http://localhost:3001/api/whatsapp/contacts');
      if (res.ok) {
        serverContacts = await res.json();
      }
    } catch {
      // Ignore if server is not reachable
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('contacts').select('*').order('created_at', { ascending: false });
        if (data && data.length > 0 && !error) {
          const combined = [...serverContacts, ...data as Contact[]];
          const unique = Array.from(new Map(combined.map(item => [item.phone, item])).values());
          return unique;
        }
      } catch (e) {
        console.warn('Supabase contacts fetch fallback:', e);
      }
    }

    const localContacts = getItem<Contact[]>(STORAGE_KEYS.CONTACTS, []);
    const combined = [...serverContacts, ...localContacts];
    const unique = Array.from(new Map(combined.map(item => [item.phone, item])).values());
    return unique;
  },

  async saveContact(contact: Contact): Promise<Contact> {
    const contacts = await this.getContacts();
    const index = contacts.findIndex(c => c.id === contact.id || c.phone === contact.phone);
    const updated = { ...contact, updated_at: new Date().toISOString() };
    
    if (index >= 0) {
      contacts[index] = updated;
    } else {
      contacts.unshift(updated);
    }

    // Sync to live WhatsApp server
    try {
      await fetch('http://localhost:3001/api/whatsapp/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
    } catch {
      // Ignore
    }

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('contacts').upsert(updated);
      } catch (e) {
        console.warn('Supabase contact upsert fallback:', e);
      }
    }
    setItem(STORAGE_KEYS.CONTACTS, contacts);
    return updated;
  },

  async deleteContact(id: string, phone?: string): Promise<void> {
    const cleanId = id.replace('contact-', '');
    const cleanDigits = (phone || id).replace(/\D/g, '');

    // 1. Delete on server
    try {
      const url = `http://localhost:3001/api/whatsapp/contacts/${encodeURIComponent(id)}?phone=${encodeURIComponent(phone || cleanDigits)}`;
      await fetch(url, { method: 'DELETE' });
    } catch {
      // Ignore
    }

    // 2. Delete in local storage
    const currentList = getItem<Contact[]>(STORAGE_KEYS.CONTACTS, []);
    const filtered = currentList.filter(
      (c) => c.id !== id && c.id !== cleanId && c.phone !== id && c.phone !== cleanDigits && c.phone !== phone
    );
    setItem(STORAGE_KEYS.CONTACTS, filtered);

    // 3. Delete in Supabase
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('contacts').delete().or(`id.eq.${id},phone.eq.${cleanDigits || id}`);
      } catch (e) {
        console.warn('Supabase contact delete fallback:', e);
      }
    }
  },

  // Conversations
  async getConversations(): Promise<Conversation[]> {
    let serverConvs: Conversation[] = [];
    try {
      const res = await fetch('http://localhost:3001/api/whatsapp/conversations');
      if (res.ok) {
        serverConvs = await res.json();
      }
    } catch {
      // Ignore
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('conversations').select('*, contacts(*)').order('last_message_at', { ascending: false });
        if (data && data.length > 0 && !error) {
          const dbConvs = data.map(d => ({
            ...d,
            contact_name: d.contacts?.name || 'Cliente',
            contact_phone: d.contacts?.phone || '',
            contact: d.contacts
          })) as Conversation[];
          const combined = [...serverConvs, ...dbConvs];
          const unique = Array.from(new Map(combined.map(item => [item.id, item])).values());
          unique.sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime());
          return unique;
        }
      } catch (e) {
        console.warn('Supabase conversations fetch fallback:', e);
      }
    }

    const localConvs = getItem<Conversation[]>(STORAGE_KEYS.CONVERSATIONS, []);
    const combined = [...serverConvs, ...localConvs];
    const unique = Array.from(new Map(combined.map(item => [item.id, item])).values());
    unique.sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime());
    return unique;
  },

  async saveConversation(conv: Conversation): Promise<Conversation> {
    const convs = await this.getConversations();
    const index = convs.findIndex((c) => c.id === conv.id);
    const updated = { ...conv, updated_at: new Date().toISOString() };
    if (index >= 0) {
      convs[index] = updated;
    } else {
      convs.unshift(updated);
    }
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('conversations').upsert(updated);
      } catch (e) {
        console.warn('Supabase conversation upsert fallback:', e);
      }
    }
    setItem(STORAGE_KEYS.CONVERSATIONS, convs);
    return updated;
  },

  async deleteConversation(id: string): Promise<void> {
    try {
      await fetch(`http://localhost:3001/api/whatsapp/conversations/${id}`, {
        method: 'DELETE',
      });
    } catch {
      // Ignore
    }

    const currentConvs = getItem<Conversation[]>(STORAGE_KEYS.CONVERSATIONS, []);
    const filtered = currentConvs.filter((c) => c.id !== id);
    setItem(STORAGE_KEYS.CONVERSATIONS, filtered);
  },

  async getMessages(conversationId: string): Promise<Message[]> {
    try {
      const res = await fetch(`http://localhost:3001/api/whatsapp/messages/${conversationId}`);
      if (res.ok) {
        const serverMsgs = await res.json();
        if (serverMsgs && serverMsgs.length > 0) {
          return serverMsgs;
        }
      }
    } catch {
      // Ignore
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('messages').select('*').eq('conversation_id', conversationId).order('created_at', { ascending: true });
        if (data && data.length > 0 && !error) return data as Message[];
      } catch (e) {
        console.warn('Supabase messages fetch fallback:', e);
      }
    }
    const key = `${STORAGE_KEYS.MESSAGES_PREFIX}${conversationId}`;
    return getItem<Message[]>(key, []);
  },

  async sendMessage(conversationId: string, content: string): Promise<Message> {
    const messages = await this.getMessages(conversationId);
    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      conversation_id: conversationId,
      direction: 'outbound',
      message_type: 'text',
      content,
      status: 'sent',
      created_at: new Date().toISOString(),
    };
    messages.push(newMessage);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('messages').insert(newMessage);
        await supabase.from('conversations').update({
          last_message_at: new Date().toISOString(),
        }).eq('id', conversationId);
      } catch (e) {
        console.warn('Supabase message insert fallback:', e);
      }
    }

    setItem(`${STORAGE_KEYS.MESSAGES_PREFIX}${conversationId}`, messages);
    return newMessage;
  },

  // Agenda & Appointments
  async getAgendaSettings(): Promise<AgendaSettings> {
    try {
      const res = await fetch('http://localhost:3001/api/whatsapp/agenda/settings');
      if (res.ok) {
        return await res.json();
      }
    } catch {}
    return getItem<AgendaSettings>('7assistente_agenda_settings', {
      business_days: ['1', '2', '3', '4', '5'],
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
    });
  },

  async updateAgendaSettings(settings: Partial<AgendaSettings>): Promise<AgendaSettings> {
    const current = await this.getAgendaSettings();
    const updated = { ...current, ...settings };
    try {
      await fetch('http://localhost:3001/api/whatsapp/agenda/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
    } catch {}
    setItem('7assistente_agenda_settings', updated);
    return updated;
  },

  async getAppointments(): Promise<Appointment[]> {
    let serverApts: Appointment[] = [];
    try {
      const res = await fetch('http://localhost:3001/api/whatsapp/agenda/appointments');
      if (res.ok) {
        serverApts = await res.json();
      }
    } catch {}

    const localApts = getItem<Appointment[]>('7assistente_appointments', []);
    const combined = [...serverApts, ...localApts];
    const unique = Array.from(new Map(combined.map((item) => [item.id, item])).values());
    unique.sort((a, b) => new Date(`${b.appointment_date}T${b.appointment_time || '00:00'}`).getTime() - new Date(`${a.appointment_date}T${a.appointment_time || '00:00'}`).getTime());
    return unique;
  },

  async saveAppointment(appointment: Appointment): Promise<Appointment> {
    const apts = await this.getAppointments();
    const index = apts.findIndex((a) => a.id === appointment.id);
    const updated = { ...appointment, created_at: appointment.created_at || new Date().toISOString() };
    if (index >= 0) {
      apts[index] = updated;
    } else {
      apts.unshift(updated);
    }
    try {
      await fetch('http://localhost:3001/api/whatsapp/agenda/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
    } catch {}
    setItem('7assistente_appointments', apts);
    return updated;
  },

  async updateAppointmentStatus(id: string, status: Appointment['status']): Promise<void> {
    try {
      await fetch(`http://localhost:3001/api/whatsapp/agenda/appointments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
    } catch {}
    const apts = await this.getAppointments();
    const idx = apts.findIndex((a) => a.id === id);
    if (idx >= 0) {
      apts[idx].status = status;
      setItem('7assistente_appointments', apts);
    }
  },

  async deleteAppointment(id: string): Promise<void> {
    try {
      await fetch(`http://localhost:3001/api/whatsapp/agenda/appointments/${id}`, {
        method: 'DELETE',
      });
    } catch {}
    const apts = await this.getAppointments();
    const filtered = apts.filter((a) => a.id !== id);
    setItem('7assistente_appointments', filtered);
  },

  async getAvailableSlots(dateStr: string): Promise<string[]> {
    try {
      const res = await fetch(`http://localhost:3001/api/whatsapp/agenda/available-slots?date=${dateStr}`);
      if (res.ok) {
        const data = await res.json();
        return data.available_slots || [];
      }
    } catch {}
    return ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'];
  },

  // Session
  getSession(): { authenticated: boolean; phone?: string } {
    return getItem(STORAGE_KEYS.AUTH_TOKEN, { authenticated: false });
  },

  setSession(session: { authenticated: boolean; phone?: string }): void {
    setItem(STORAGE_KEYS.AUTH_TOKEN, session);
  },

  clearSession(): void {
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
  }
};
