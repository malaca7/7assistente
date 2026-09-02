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
  AGENDA_SETTINGS: '7assistente_agenda_settings',
  APPOINTMENTS: '7assistente_appointments',
};

export function getBackendUrl(): string {
  if (typeof window !== 'undefined') {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:3001';
    }
    if (window.location.hostname.includes('discloud.app')) {
      return window.location.origin;
    }
  }
  return 'https://talvanebarber.discloud.app';
}

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

export async function syncWithWhatsAppServer(): Promise<void> {
  try {
    const backendUrl = getBackendUrl();
    const flows = getItem<Flow[]>(STORAGE_KEYS.FLOWS, sampleFlows);
    const settings = getItem<Settings>(STORAGE_KEYS.SETTINGS, initialSettings);
    const agendaSettings = getItem<AgendaSettings>(STORAGE_KEYS.AGENDA_SETTINGS, {
      business_days: ['1', '2', '3', '4', '5', '6'],
      start_time: '08:00',
      end_time: '19:00',
      slot_duration_minutes: 30,
      break_start_time: '12:00',
      break_end_time: '13:00',
      services: [
        { id: 'srv-1', name: 'Corte Tradicional', duration_minutes: 30, price: 35 },
        { id: 'srv-2', name: 'Barba Completa', duration_minutes: 30, price: 25 },
        { id: 'srv-3', name: 'Corte + Barba (Combo)', duration_minutes: 60, price: 55 },
        { id: 'srv-4', name: 'Sobrancelha', duration_minutes: 15, price: 15 },
        { id: 'srv-5', name: 'Pigmentação', duration_minutes: 20, price: 25 },
      ],
    });

    const nodesMap: Record<string, FlowNode[]> = {};
    const edgesMap: Record<string, FlowEdge[]> = {};

    for (const f of flows) {
      nodesMap[f.id] = getItem<FlowNode[]>(`${STORAGE_KEYS.FLOW_NODES_PREFIX}${f.id}`, (f.id === 'flow-1788033465058') ? (initialFlowNodes as FlowNode[]) : []);
      edgesMap[f.id] = getItem<FlowEdge[]>(`${STORAGE_KEYS.FLOW_EDGES_PREFIX}${f.id}`, (f.id === 'flow-1788033465058') ? (initialFlowEdges as FlowEdge[]) : []);
    }

    await fetch(`${backendUrl}/api/whatsapp/sync-flows`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        flows,
        nodes: nodesMap,
        edges: edgesMap,
        botProfile: settings.bot_profile,
        agendaSettings,
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
        await supabase.from('settings').upsert({
          id: updated.id || 'default',
          ...updated,
        });
      } catch (e) {
        console.warn('Supabase settings upsert fallback:', e);
      }
    }
    setItem(STORAGE_KEYS.SETTINGS, updated);
    syncWithWhatsAppServer();
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
      'bot_nome': profile.name || 'Talvane Barber Bot',
      'empresa': profile.company_name || 'Talvane Barber',
      'bot_genero': profile.gender === 'female' ? 'Feminino' : profile.gender === 'male' ? 'Masculino' : 'Neutro',
      'bot_tom': profile.tone || 'Amigável',
      'bot_foto': profile.avatar_url || '',
      'ramo_empresa': profile.company_segment || 'Barbearia e Estética Masculina',
      'suporte_email': profile.support_email || 'contato@talvanebarber.com.br',
      'suporte_telefone': profile.support_phone || '81996138924',
      'horario_atendimento': profile.business_hours || '08:00 às 19:00',
      'site_empresa': profile.website_url || 'https://talvane.malaca.com.br',
      'mensagem_boas_vindas': profile.welcome_message || 'Olá! Seja bem-vindo à Talvane Barber.',
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

    return {
      totalContacts: contacts.length,
      totalConversations: conversations.length,
      activeConversations: activeConversations,
      activeFlows: activeFlows,
      waitingHuman: waitingHuman,
      messagesSentToday: conversations.length,
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
            type: d.node_type || d.type,
            position: { x: Number(d.position_x || 0), y: Number(d.position_y || 0) },
            data: d.data || {},
          })) as FlowNode[];
        }
      } catch (e) {
        console.warn('Supabase flow_nodes fetch fallback:', e);
      }
    }
    if (flowId === 'flow-1788033465058' || flowId === 'flow-001') {
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
            source: e.source_node_id || e.source,
            target: e.target_node_id || e.target,
            sourceHandle: e.source_handle || e.sourceHandle,
            targetHandle: e.target_handle || e.targetHandle,
            data: e.condition || e.data,
          })) as FlowEdge[];
        }
      } catch (e) {
        console.warn('Supabase flow_edges fetch fallback:', e);
      }
    }
    if (flowId === 'flow-1788033465058' || flowId === 'flow-001') {
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
              id: n.id,
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
              id: e.id,
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
    const backendUrl = getBackendUrl();
    let serverContacts: Contact[] = [];
    try {
      const res = await fetch(`${backendUrl}/api/whatsapp/contacts`);
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
          const combined = [...data, ...serverContacts];
          return Array.from(new Map(combined.map(c => [c.phone, c])).values()) as Contact[];
        }
      } catch (e) {
        console.warn('Supabase contacts fetch fallback:', e);
      }
    }

    const localContacts = getItem<Contact[]>(STORAGE_KEYS.CONTACTS, []);
    const combined = [...serverContacts, ...localContacts];
    return Array.from(new Map(combined.map(c => [c.phone, c])).values()) as Contact[];
  },

  async getContactById(id: string): Promise<Contact | null> {
    const contacts = await this.getContacts();
    return contacts.find(c => c.id === id || c.phone === id) || null;
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

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('contacts').upsert(updated, { onConflict: 'phone' });
      } catch (e) {
        console.warn('Supabase contact upsert fallback:', e);
      }
    }

    setItem(STORAGE_KEYS.CONTACTS, contacts);
    return updated;
  },

  // Conversations
  async getConversations(): Promise<Conversation[]> {
    const backendUrl = getBackendUrl();
    let serverConvs: Conversation[] = [];
    try {
      const res = await fetch(`${backendUrl}/api/whatsapp/conversations`);
      if (res.ok) {
        serverConvs = await res.json();
      }
    } catch {}

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('conversations').select('*').order('last_message_at', { ascending: false });
        if (data && data.length > 0 && !error) {
          const combined = [...data, ...serverConvs];
          return Array.from(new Map(combined.map(c => [c.id, c])).values()) as Conversation[];
        }
      } catch (e) {
        console.warn('Supabase conversations fetch fallback:', e);
      }
    }

    const localConvs = getItem<Conversation[]>(STORAGE_KEYS.CONVERSATIONS, []);
    const combined = [...serverConvs, ...localConvs];
    return Array.from(new Map(combined.map(c => [c.id, c])).values()) as Conversation[];
  },

  async getConversationById(id: string): Promise<Conversation | null> {
    const convs = await this.getConversations();
    return convs.find(c => c.id === id) || null;
  },

  async updateConversationStatus(id: string, status: Conversation['status']): Promise<Conversation | null> {
    const convs = await this.getConversations();
    const index = convs.findIndex(c => c.id === id);
    if (index === -1) return null;

    const updated = {
      ...convs[index],
      status,
      updated_at: new Date().toISOString()
    };
    convs[index] = updated;

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('conversations').update({ status, updated_at: updated.updated_at }).eq('id', id);
      } catch (e) {
        console.warn('Supabase conversation update fallback:', e);
      }
    }

    setItem(STORAGE_KEYS.CONVERSATIONS, convs);
    return updated;
  },

  // Messages
  async getMessages(conversationId: string): Promise<Message[]> {
    const backendUrl = getBackendUrl();
    let serverMsgs: Message[] = [];
    try {
      const res = await fetch(`${backendUrl}/api/whatsapp/conversations/${conversationId}/messages`);
      if (res.ok) {
        serverMsgs = await res.json();
      }
    } catch {
      // Ignore
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('messages').select('*').eq('conversation_id', conversationId).order('created_at', { ascending: true });
        if (data && data.length > 0 && !error) {
          const combined = [...serverMsgs, ...data];
          return Array.from(new Map(combined.map(m => [m.id, m])).values()) as Message[];
        }
      } catch (e) {
        console.warn('Supabase messages fetch fallback:', e);
      }
    }
    const key = `${STORAGE_KEYS.MESSAGES_PREFIX}${conversationId}`;
    const localMsgs = getItem<Message[]>(key, []);
    const combined = [...serverMsgs, ...localMsgs];
    return Array.from(new Map(combined.map(m => [m.id, m])).values()) as Message[];
  },

  async sendMessage(conversationId: string, content: string): Promise<Message> {
    const backendUrl = getBackendUrl();
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

    // Send directly via backend WhatsApp API if conversation has phone
    try {
      const conv = await this.getConversationById(conversationId);
      const cleanPhone = conv?.contact_phone || conv?.phone || conversationId.replace('conv-', '');
      if (cleanPhone) {
        await fetch(`${backendUrl}/api/whatsapp/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: cleanPhone, message: content }),
        });
      }
    } catch {}

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('messages').insert(newMessage);
        await supabase.from('conversations').update({
          last_message: content,
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
    const backendUrl = getBackendUrl();
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('agenda_settings').select('*').limit(1).maybeSingle();
        if (data && !error) return data as AgendaSettings;
      } catch (e) {}
    }

    try {
      const res = await fetch(`${backendUrl}/api/whatsapp/agenda/settings`);
      if (res.ok) {
        return await res.json();
      }
    } catch {}

    return getItem<AgendaSettings>(STORAGE_KEYS.AGENDA_SETTINGS, {
      business_days: ['1', '2', '3', '4', '5', '6'],
      start_time: '08:00',
      end_time: '19:00',
      slot_duration_minutes: 30,
      break_start_time: '12:00',
      break_end_time: '13:00',
      services: [
        { id: 'srv-1', name: 'Corte Tradicional', duration_minutes: 30, price: 35 },
        { id: 'srv-2', name: 'Barba Completa', duration_minutes: 30, price: 25 },
        { id: 'srv-3', name: 'Corte + Barba (Combo)', duration_minutes: 60, price: 55 },
        { id: 'srv-4', name: 'Sobrancelha', duration_minutes: 15, price: 15 },
        { id: 'srv-5', name: 'Pigmentação', duration_minutes: 20, price: 25 },
      ],
    });
  },

  async updateAgendaSettings(settings: Partial<AgendaSettings>): Promise<AgendaSettings> {
    const backendUrl = getBackendUrl();
    const current = await this.getAgendaSettings();
    const updated = { ...current, ...settings, updated_at: new Date().toISOString() };

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('agenda_settings').upsert({ id: 'default', ...updated });
      } catch (e) {}
    }

    try {
      await fetch(`${backendUrl}/api/whatsapp/agenda/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
    } catch {}

    setItem(STORAGE_KEYS.AGENDA_SETTINGS, updated);
    syncWithWhatsAppServer();
    return updated;
  },

  async getAppointments(): Promise<Appointment[]> {
    const backendUrl = getBackendUrl();
    let serverApts: Appointment[] = [];
    try {
      const res = await fetch(`${backendUrl}/api/whatsapp/agenda/appointments`);
      if (res.ok) {
        serverApts = await res.json();
      }
    } catch {}

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('appointments').select('*').order('created_at', { ascending: false });
        if (data && data.length > 0 && !error) {
          const combined = [...serverApts, ...data];
          const unique = Array.from(new Map(combined.map((item) => [item.id, item])).values());
          unique.sort((a, b) => new Date(`${b.appointment_date || b.date}T${b.appointment_time || b.time || '00:00'}`).getTime() - new Date(`${a.appointment_date || a.date}T${a.appointment_time || a.time || '00:00'}`).getTime());
          return unique;
        }
      } catch (e) {}
    }

    const localApts = getItem<Appointment[]>(STORAGE_KEYS.APPOINTMENTS, []);
    const combined = [...serverApts, ...localApts];
    const unique = Array.from(new Map(combined.map((item) => [item.id, item])).values());
    unique.sort((a, b) => new Date(`${b.appointment_date || b.date}T${b.appointment_time || b.time || '00:00'}`).getTime() - new Date(`${a.appointment_date || a.date}T${a.appointment_time || a.time || '00:00'}`).getTime());
    return unique;
  },

  async saveAppointment(appointment: Appointment): Promise<Appointment> {
    const backendUrl = getBackendUrl();
    const apts = await this.getAppointments();
    const index = apts.findIndex((a) => a.id === appointment.id);
    const updated = { ...appointment, created_at: appointment.created_at || new Date().toISOString() };
    if (index >= 0) {
      apts[index] = updated;
    } else {
      apts.unshift(updated);
    }

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('appointments').upsert(updated);
      } catch (e) {}
    }

    try {
      await fetch(`${backendUrl}/api/whatsapp/agenda/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
    } catch {}

    setItem(STORAGE_KEYS.APPOINTMENTS, apts);
    return updated;
  },

  async updateAppointmentStatus(id: string, status: Appointment['status']): Promise<void> {
    const backendUrl = getBackendUrl();
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('appointments').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
      } catch (e) {}
    }

    try {
      await fetch(`${backendUrl}/api/whatsapp/agenda/appointments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
    } catch {}

    const apts = await this.getAppointments();
    const idx = apts.findIndex((a) => a.id === id);
    if (idx >= 0) {
      apts[idx].status = status;
      setItem(STORAGE_KEYS.APPOINTMENTS, apts);
    }
  },

  async deleteAppointment(id: string): Promise<void> {
    const backendUrl = getBackendUrl();
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('appointments').delete().eq('id', id);
      } catch (e) {}
    }

    try {
      await fetch(`${backendUrl}/api/whatsapp/agenda/appointments/${id}`, {
        method: 'DELETE',
      });
    } catch {}

    const apts = await this.getAppointments();
    const filtered = apts.filter((a) => a.id !== id);
    setItem(STORAGE_KEYS.APPOINTMENTS, filtered);
  },

  async getAvailableSlots(dateStr: string): Promise<string[]> {
    const backendUrl = getBackendUrl();
    try {
      const res = await fetch(`${backendUrl}/api/whatsapp/agenda/available-slots?date=${dateStr}`);
      if (res.ok) {
        const data = await res.json();
        return data.available_slots || [];
      }
    } catch {}
    return ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00'];
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
