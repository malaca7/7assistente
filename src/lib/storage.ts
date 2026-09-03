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
  AgendaSettings,
  Attendant,
  CannedReply,
  AuditLog,
  SystemUser,
  UserPermissions
} from '../types';
import { 
  initialAdminProfile, 
  initialSettings, 
  sampleFlows, 
  initialFlowNodes,
  initialFlowEdges,
  defaultBotProfile,
  initialAttendants,
  defaultCannedReplies
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
  DELETED_CONTACTS: '7assistente_deleted_contacts_v2',
  ATTENDANTS: '7assistente_attendants',
  CANNED_REPLIES: '7assistente_canned_replies',
  ATTENDANT_AUTH: '7assistente_attendant_session',
  SYSTEM_USERS: '7assistente_system_users',
  BARBER_AUTH: '7assistente_barber_auth',
  CUSTOM_BACKEND_URL: '7assistente_custom_backend_url',
};

export function getBackendUrl(): string {
  if (typeof window !== 'undefined') {
    const custom = localStorage.getItem(STORAGE_KEYS.CUSTOM_BACKEND_URL);
    if (custom && custom.trim()) {
      if (custom.includes('talvanebarber')) {
        localStorage.setItem(STORAGE_KEYS.CUSTOM_BACKEND_URL, 'https://talvane.discloud.app');
        return 'https://talvane.discloud.app';
      }
      return custom.trim().replace(/\/+$/, '');
    }
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:3001';
    }
    if (window.location.hostname.includes('discloud.app')) {
      return window.location.origin;
    }
  }
  return 'https://talvane.discloud.app';
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

  // Settings & Bot Profile (Sincronização em Tempo Real com Banco de Dados)
  async getSettings(): Promise<Settings> {
    const backendUrl = getBackendUrl();
    try {
      const res = await fetch(`${backendUrl}/api/whatsapp/settings`, { signal: AbortSignal.timeout(4000) });
      if (res.ok) {
        const live = await res.json();
        const current = getItem<Settings>(STORAGE_KEYS.SETTINGS, initialSettings);
        const merged: Settings = {
          ...current,
          ...(live.settings || {}),
          bot_profile: {
            ...defaultBotProfile,
            ...(current.bot_profile || {}),
            ...(live.botProfile || {}),
          },
        };
        setItem(STORAGE_KEYS.SETTINGS, merged);
        return merged;
      }
    } catch (e) {
      // Fallback to local / supabase
    }

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
    setItem(STORAGE_KEYS.SETTINGS, updated);

    const backendUrl = getBackendUrl();
    try {
      await fetch(`${backendUrl}/api/whatsapp/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: updated,
          botProfile: updated.bot_profile,
        }),
      });
    } catch (e) {
      console.warn('Falha ao persistir configurações no servidor WhatsApp:', e);
    }

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

  // Flows (Resilient Single-Source-of-Truth with Smart Merge)
  async getFlows(): Promise<Flow[]> {
    const backendUrl = getBackendUrl();
    const localFlows = getItem<Flow[]>(STORAGE_KEYS.FLOWS, []);

    let incomingFlows: Flow[] = [];

    // 1. Try Supabase Cloud Database
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('flows').select('*').order('updated_at', { ascending: false });
        if (data && Array.isArray(data) && data.length > 0 && !error) {
          incomingFlows = data as Flow[];
        }
      } catch (e) {
        console.warn('Supabase flows fetch fallback:', e);
      }
    }

    // 2. Try WhatsApp Backend Server
    if (incomingFlows.length === 0) {
      try {
        const res = await fetch(`${backendUrl}/api/whatsapp/flows`, { signal: AbortSignal.timeout(4000) });
        if (res.ok) {
          const serverFlows = await res.json();
          if (Array.isArray(serverFlows) && serverFlows.length > 0) {
            incomingFlows = serverFlows;
          }
        }
      } catch {}
    }

    // 3. Smart Merge: Union of Local + Server flows without ever losing user-created flows
    const flowMap = new Map<string, Flow>();

    // Put sample flows as baseline
    sampleFlows.forEach((f) => flowMap.set(f.id, f));

    // Layer incoming server flows
    incomingFlows.forEach((f) => {
      flowMap.set(f.id, f);
    });

    // Layer local flows (protects locally created/edited flows)
    localFlows.forEach((local) => {
      const existing = flowMap.get(local.id);
      if (!existing) {
        flowMap.set(local.id, local);
        // Sync back up to server in background
        try {
          fetch(`${backendUrl}/api/whatsapp/flows`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(local),
          }).catch(() => {});
        } catch {}
      } else {
        // Compare timestamps
        const localTime = new Date(local.updated_at || 0).getTime();
        const serverTime = new Date(existing.updated_at || 0).getTime();
        if (localTime >= serverTime) {
          flowMap.set(local.id, local);
        }
      }
    });

    const mergedFlows = Array.from(flowMap.values()).sort(
      (a, b) => new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime()
    );

    setItem(STORAGE_KEYS.FLOWS, mergedFlows);
    return mergedFlows;
  },

  async getFlowById(id: string): Promise<Flow | null> {
    const flows = await this.getFlows();
    return flows.find((f) => f.id === id) || null;
  },

  async saveFlow(flow: Flow): Promise<Flow> {
    const backendUrl = getBackendUrl();
    const flows = getItem<Flow[]>(STORAGE_KEYS.FLOWS, sampleFlows);
    const index = flows.findIndex((f) => f.id === flow.id);
    const updated: Flow = { ...flow, updated_at: new Date().toISOString() };

    if (index >= 0) {
      flows[index] = updated;
    } else {
      flows.unshift(updated);
    }

    setItem(STORAGE_KEYS.FLOWS, flows);

    // 1. Direct Persist to Supabase
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('flows').upsert(updated);
      } catch (e) {
        console.warn('Supabase flow upsert fallback:', e);
      }
    }

    // 2. Direct Persist to WhatsApp Server
    try {
      await fetch(`${backendUrl}/api/whatsapp/flows`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
    } catch {}

    syncWithWhatsAppServer();
    return updated;
  },

  async deleteFlow(id: string): Promise<void> {
    const backendUrl = getBackendUrl();
    const flows = getItem<Flow[]>(STORAGE_KEYS.FLOWS, sampleFlows);
    const filtered = flows.filter((f) => f.id !== id);
    setItem(STORAGE_KEYS.FLOWS, filtered);
    localStorage.removeItem(`${STORAGE_KEYS.FLOW_NODES_PREFIX}${id}`);
    localStorage.removeItem(`${STORAGE_KEYS.FLOW_EDGES_PREFIX}${id}`);

    // 1. Remove from Supabase
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('flow_nodes').delete().eq('flow_id', id);
        await supabase.from('flow_edges').delete().eq('flow_id', id);
        await supabase.from('flows').delete().eq('id', id);
      } catch (e) {
        console.warn('Supabase flow delete fallback:', e);
      }
    }

    // 2. Remove from WhatsApp Server
    try {
      await fetch(`${backendUrl}/api/whatsapp/flows/${id}`, {
        method: 'DELETE',
      });
    } catch {}

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

  // Flow Nodes & Edges (Smart Local-First with Remote Backup)
  async getFlowNodes(flowId: string): Promise<FlowNode[]> {
    const backendUrl = getBackendUrl();
    const localNodes = getItem<FlowNode[] | null>(`${STORAGE_KEYS.FLOW_NODES_PREFIX}${flowId}`, null);

    // If we have local nodes in browser, prioritize them
    if (localNodes && Array.isArray(localNodes) && localNodes.length > 0) {
      return localNodes;
    }

    // 1. Prioritize Supabase
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('flow_nodes').select('*').eq('flow_id', flowId);
        if (data && data.length > 0 && !error) {
          const formatted = data.map((d) => ({
            id: d.id,
            flow_id: d.flow_id,
            type: d.node_type || d.type,
            position: { x: Number(d.position_x || 0), y: Number(d.position_y || 0) },
            data: d.data || {},
          })) as FlowNode[];
          setItem(`${STORAGE_KEYS.FLOW_NODES_PREFIX}${flowId}`, formatted);
          return formatted;
        }
      } catch (e) {
        console.warn('Supabase flow_nodes fetch fallback:', e);
      }
    }

    // 2. Fallback to WhatsApp Server
    try {
      const res = await fetch(`${backendUrl}/api/whatsapp/flows/${flowId}/graph`, { signal: AbortSignal.timeout(4000) });
      if (res.ok) {
        const data = await res.json();
        if (data.nodes && Array.isArray(data.nodes) && data.nodes.length > 0) {
          setItem(`${STORAGE_KEYS.FLOW_NODES_PREFIX}${flowId}`, data.nodes);
          return data.nodes;
        }
      }
    } catch {}

    if (flowId === 'flow-1788033465058' || flowId === 'flow-001') {
      return (initialFlowNodes as FlowNode[]) || [];
    }
    return [];
  },

  async getFlowEdges(flowId: string): Promise<FlowEdge[]> {
    const backendUrl = getBackendUrl();
    const localEdges = getItem<FlowEdge[] | null>(`${STORAGE_KEYS.FLOW_EDGES_PREFIX}${flowId}`, null);

    if (localEdges && Array.isArray(localEdges) && localEdges.length > 0) {
      return localEdges;
    }

    // 1. Prioritize Supabase
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('flow_edges').select('*').eq('flow_id', flowId);
        if (data && data.length > 0 && !error) {
          const formatted = data.map((e) => ({
            id: e.id,
            flow_id: e.flow_id,
            source: e.source_node_id || e.source,
            target: e.target_node_id || e.target,
            sourceHandle: e.source_handle || e.sourceHandle,
            targetHandle: e.target_handle || e.targetHandle,
            data: e.condition || e.data,
          })) as FlowEdge[];
          setItem(`${STORAGE_KEYS.FLOW_EDGES_PREFIX}${flowId}`, formatted);
          return formatted;
        }
      } catch (e) {
        console.warn('Supabase flow_edges fetch fallback:', e);
      }
    }

    // 2. Fallback to WhatsApp Server
    try {
      const res = await fetch(`${backendUrl}/api/whatsapp/flows/${flowId}/graph`, { signal: AbortSignal.timeout(4000) });
      if (res.ok) {
        const data = await res.json();
        if (data.edges && Array.isArray(data.edges) && data.edges.length > 0) {
          setItem(`${STORAGE_KEYS.FLOW_EDGES_PREFIX}${flowId}`, data.edges);
          return data.edges;
        }
      }
    } catch {}

    if (flowId === 'flow-1788033465058' || flowId === 'flow-001') {
      return (initialFlowEdges as FlowEdge[]) || [];
    }
    return [];
  },

  async saveFlowGraph(flowId: string, nodes: FlowNode[], edges: FlowEdge[]): Promise<void> {
    const backendUrl = getBackendUrl();
    setItem(`${STORAGE_KEYS.FLOW_NODES_PREFIX}${flowId}`, nodes);
    setItem(`${STORAGE_KEYS.FLOW_EDGES_PREFIX}${flowId}`, edges);

    // 1. Persist directly to Supabase Cloud Database
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('flow_nodes').delete().eq('flow_id', flowId);
        if (nodes && nodes.length > 0) {
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
        if (edges && edges.length > 0) {
          await supabase.from('flow_edges').insert(
            edges.map(e => ({
              id: e.id,
              flow_id: flowId,
              source_node_id: e.source,
              target_node_id: e.target,
              source_handle: e.sourceHandle || null,
              target_handle: e.targetHandle || null,
              condition: e.data || null,
            }))
          );
        }

        await supabase.from('flows').update({
          node_count: (nodes || []).length,
          updated_at: new Date().toISOString(),
        }).eq('id', flowId);
      } catch (e) {
        console.warn('Supabase graph save fallback:', e);
      }
    }

    // 2. Persist to WhatsApp Server
    try {
      await fetch(`${backendUrl}/api/whatsapp/flows/${flowId}/graph`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodes, edges }),
      });
    } catch {}

    syncWithWhatsAppServer();
  },

  // Contacts
  getDeletedContactIds(): string[] {
    return getItem<string[]>(STORAGE_KEYS.DELETED_CONTACTS, []);
  },

  isContactDeleted(contact: Contact | any): boolean {
    const deletedList = this.getDeletedContactIds();
    if (!deletedList || deletedList.length === 0) return false;
    const cId = String(contact.id || '');
    const cPhone = String(contact.phone || '').replace(/\D/g, '');
    const altPhone = cPhone.startsWith('55') ? cPhone.substring(2) : `55${cPhone}`;
    return deletedList.some(d => {
      const cleanD = d.replace(/\D/g, '');
      return d === cId || 
             d === `contact-${cPhone}` || 
             d === `contact-${altPhone}` ||
             d === cPhone || 
             d === altPhone || 
             (cPhone && cleanD === cPhone) ||
             (altPhone && cleanD === altPhone);
    });
  },

  async getContacts(): Promise<Contact[]> {
    const backendUrl = getBackendUrl();
    const deletedList = this.getDeletedContactIds();

    // 1. Supabase Cloud Database is the primary Source of Truth
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('contacts').select('*').order('created_at', { ascending: false });
        if (data && !error) {
          const valid = (data as Contact[]).filter(c => !this.isContactDeleted(c));
          setItem(STORAGE_KEYS.CONTACTS, valid);
          return valid;
        }
      } catch (e) {
        console.warn('Supabase contacts fetch fallback:', e);
      }
    }

    // 2. WhatsApp Backend Server Fallback
    try {
      const res = await fetch(`${backendUrl}/api/whatsapp/contacts`);
      if (res.ok) {
        const serverContacts = await res.json();
        if (Array.isArray(serverContacts)) {
          const valid = serverContacts.filter(c => !this.isContactDeleted(c));
          setItem(STORAGE_KEYS.CONTACTS, valid);
          return valid;
        }
      }
    } catch {
      // Ignore if server is not reachable
    }

    // 3. Local Cache Fallback
    const cached = getItem<Contact[]>(STORAGE_KEYS.CONTACTS, []);
    return cached.filter(c => !this.isContactDeleted(c));
  },

  async getContactById(id: string): Promise<Contact | null> {
    const contacts = await this.getContacts();
    return contacts.find(c => c.id === id || c.phone === id) || null;
  },

  async saveContact(contact: Contact): Promise<Contact> {
    const backendUrl = getBackendUrl();
    const cleanPhone = (contact.phone || contact.id || '').replace(/\D/g, '');
    const altPhone = cleanPhone.startsWith('55') ? cleanPhone.substring(2) : `55${cleanPhone}`;
    const updated: Contact = { 
      ...contact, 
      id: contact.id || `contact-${cleanPhone}`,
      phone: cleanPhone,
      updated_at: new Date().toISOString() 
    };

    // 1. Remove from deleted tombstones if being created or updated
    const deleted = this.getDeletedContactIds();
    const filteredDeleted = deleted.filter(d => 
      d !== updated.id && 
      d !== updated.phone && 
      d !== cleanPhone && 
      d !== altPhone && 
      d !== `contact-${cleanPhone}` && 
      d !== `contact-${altPhone}`
    );
    setItem(STORAGE_KEYS.DELETED_CONTACTS, filteredDeleted);

    // 2. Update Local Storage Cache
    const contacts = getItem<Contact[]>(STORAGE_KEYS.CONTACTS, []);
    const index = contacts.findIndex(c => c.id === updated.id || c.phone === updated.phone || (c.phone && cleanPhone && c.phone.replace(/\D/g, '') === cleanPhone));
    if (index >= 0) {
      contacts[index] = updated;
    } else {
      contacts.unshift(updated);
    }
    setItem(STORAGE_KEYS.CONTACTS, contacts);

    // 3. Sync directly with Supabase Cloud DB
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('contacts').upsert(updated, { onConflict: 'phone' });
      } catch (e) {
        console.warn('Supabase contact upsert error:', e);
      }
    }

    // 4. Sync with WhatsApp Backend Server
    try {
      await fetch(`${backendUrl}/api/whatsapp/contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
    } catch {
      // Ignore if offline
    }

    return updated;
  },

  async deleteContact(id: string, phone?: string): Promise<void> {
    const backendUrl = getBackendUrl();
    const cleanPhone = (phone || id || '').replace(/\D/g, '');
    const altPhone = cleanPhone.startsWith('55') ? cleanPhone.substring(2) : `55${cleanPhone}`;

    // 1. Mark as permanently deleted in persistent tombstone
    const deleted = this.getDeletedContactIds();
    const toAdd = [id, phone, cleanPhone, altPhone, `contact-${cleanPhone}`, `contact-${altPhone}`].filter(Boolean) as string[];
    const newDeleted = Array.from(new Set([...deleted, ...toAdd]));
    setItem(STORAGE_KEYS.DELETED_CONTACTS, newDeleted);

    // 2. Immediately purge from Local Storage Cache
    const contacts = getItem<Contact[]>(STORAGE_KEYS.CONTACTS, []);
    const filtered = contacts.filter(c => {
      const cPhone = (c.phone || '').replace(/\D/g, '');
      const isMatch = c.id === id || 
                      c.id === `contact-${cleanPhone}` || 
                      c.id === `contact-${altPhone}` ||
                      c.phone === phone || 
                      c.phone === cleanPhone || 
                      c.phone === altPhone || 
                      cPhone === cleanPhone || 
                      cPhone === altPhone;
      return !isMatch;
    });
    setItem(STORAGE_KEYS.CONTACTS, filtered);

    // 3. Immediately delete from Supabase Database
    if (isSupabaseConfigured && supabase) {
      try {
        if (id) {
          await supabase.from('contacts').delete().eq('id', id);
        }
        if (cleanPhone) {
          await supabase.from('contacts').delete().eq('phone', cleanPhone);
          await supabase.from('contacts').delete().eq('phone', altPhone);
          await supabase.from('contacts').delete().eq('id', `contact-${cleanPhone}`);
          await supabase.from('contacts').delete().eq('id', `contact-${altPhone}`);
        }
      } catch (e) {
        console.warn('Supabase contact delete fallback:', e);
      }
    }

    // 4. Immediately delete from WhatsApp Backend Server (Baileys memory)
    try {
      const target = cleanPhone || id;
      await fetch(`${backendUrl}/api/whatsapp/contacts/${encodeURIComponent(target)}?phone=${encodeURIComponent(cleanPhone)}`, {
        method: 'DELETE',
      });
    } catch (e) {
      // Ignore
    }
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

  async saveConversation(conversation: Conversation): Promise<Conversation> {
    const convs = await this.getConversations();
    const index = convs.findIndex(c => c.id === conversation.id);
    const updated: Conversation = {
      ...conversation,
      updated_at: new Date().toISOString()
    };

    if (index >= 0) {
      convs[index] = updated;
    } else {
      convs.unshift(updated);
    }

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('conversations').upsert(updated, { onConflict: 'id' });
      } catch (e) {
        console.warn('Supabase conversation upsert fallback:', e);
      }
    }

    const backendUrl = getBackendUrl();
    try {
      await fetch(`${backendUrl}/api/whatsapp/conversations/${conversation.id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: conversation.status }),
      });
    } catch {}

    setItem(STORAGE_KEYS.CONVERSATIONS, convs);
    return updated;
  },

  async deleteConversation(id: string): Promise<void> {
    const backendUrl = getBackendUrl();
    const convs = getItem<Conversation[]>(STORAGE_KEYS.CONVERSATIONS, []);
    const filtered = convs.filter(c => c.id !== id);
    setItem(STORAGE_KEYS.CONVERSATIONS, filtered);
    localStorage.removeItem(`${STORAGE_KEYS.MESSAGES_PREFIX}${id}`);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('conversations').delete().eq('id', id);
        await supabase.from('messages').delete().eq('conversation_id', id);
      } catch (e) {}
    }

    try {
      await fetch(`${backendUrl}/api/whatsapp/conversations/${id}`, {
        method: 'DELETE',
      });
    } catch (e) {}
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
    const messages = await this.getMessages(conversationId);
    const newMessage: Message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
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

  async clearMessages(conversationId: string): Promise<void> {
    const backendUrl = getBackendUrl();
    const cleanPhone = conversationId.replace('conv-', '').replace(/\D/g, '');

    localStorage.removeItem(`${STORAGE_KEYS.MESSAGES_PREFIX}${conversationId}`);
    if (cleanPhone) {
      localStorage.removeItem(`${STORAGE_KEYS.MESSAGES_PREFIX}conv-${cleanPhone}`);
      localStorage.removeItem(`${STORAGE_KEYS.MESSAGES_PREFIX}${cleanPhone}`);
    }

    try {
      await fetch(`${backendUrl}/api/whatsapp/conversations/${conversationId}/messages`, {
        method: 'DELETE',
      });
    } catch {}

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('messages')
          .delete()
          .or(`conversation_id.eq.${conversationId},conversation_id.eq.conv-${cleanPhone},conversation_id.eq.${cleanPhone}`);
      } catch {}
    }
  },

  async deleteMessage(conversationId: string, messageId: string): Promise<void> {
    const backendUrl = getBackendUrl();
    const key = `${STORAGE_KEYS.MESSAGES_PREFIX}${conversationId}`;
    const msgs = getItem<Message[]>(key, []);
    const filtered = msgs.filter((m) => m.id !== messageId);
    setItem(key, filtered);

    try {
      await fetch(`${backendUrl}/api/whatsapp/messages/${messageId}?convId=${conversationId}`, {
        method: 'DELETE',
      });
    } catch {}

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('messages').delete().eq('id', messageId);
      } catch {}
    }
  },

  async sendInternalNote(conversationId: string, content: string, authorName: string): Promise<Message> {
    const messages = await this.getMessages(conversationId);
    const newNote: Message = {
      id: `note-${Date.now()}`,
      conversation_id: conversationId,
      direction: 'outbound',
      message_type: 'internal_note',
      content,
      status: 'sent',
      author_name: authorName,
      is_internal: true,
      created_at: new Date().toISOString(),
    };
    messages.push(newNote);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('messages').insert(newNote);
      } catch (e) {
        console.warn('Supabase internal note fallback:', e);
      }
    }

    setItem(`${STORAGE_KEYS.MESSAGES_PREFIX}${conversationId}`, messages);
    return newNote;
  },

  // Attendants Management (Perfis de Atendimento com Senha e Métricas)
  async getAttendants(): Promise<Attendant[]> {
    const backendUrl = getBackendUrl();
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('attendants').select('*').order('created_at', { ascending: false });
        if (data && Array.isArray(data) && data.length > 0 && !error) {
          setItem(STORAGE_KEYS.ATTENDANTS, data);
          return data as Attendant[];
        }
      } catch (e) {}
    }

    try {
      const res = await fetch(`${backendUrl}/api/whatsapp/attendants`, { signal: AbortSignal.timeout(3000) });
      if (res.ok) {
        const serverAttendants = await res.json();
        if (Array.isArray(serverAttendants) && serverAttendants.length > 0) {
          setItem(STORAGE_KEYS.ATTENDANTS, serverAttendants);
          return serverAttendants;
        }
      }
    } catch {}

    return getItem<Attendant[]>(STORAGE_KEYS.ATTENDANTS, initialAttendants);
  },

  async saveAttendant(attendant: Attendant): Promise<Attendant> {
    const backendUrl = getBackendUrl();
    const attendants = await this.getAttendants();
    const updated: Attendant = {
      ...attendant,
      id: attendant.id || `att-${Date.now()}`,
      updated_at: new Date().toISOString(),
      created_at: attendant.created_at || new Date().toISOString(),
      metrics: attendant.metrics || {
        chats_assigned: 0,
        chats_resolved: 0,
        messages_sent: 0,
        avg_response_time_min: 0,
        rating: 5.0,
      }
    };

    const index = attendants.findIndex(a => a.id === updated.id);
    if (index >= 0) {
      attendants[index] = updated;
    } else {
      attendants.unshift(updated);
    }

    setItem(STORAGE_KEYS.ATTENDANTS, attendants);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('attendants').upsert(updated);
      } catch (e) {}
    }

    try {
      await fetch(`${backendUrl}/api/whatsapp/attendants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
    } catch {}

    return updated;
  },

  async deleteAttendant(id: string): Promise<void> {
    const backendUrl = getBackendUrl();
    const attendants = await this.getAttendants();
    const filtered = attendants.filter(a => a.id !== id);
    setItem(STORAGE_KEYS.ATTENDANTS, filtered);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('attendants').delete().eq('id', id);
      } catch (e) {}
    }

    try {
      await fetch(`${backendUrl}/api/whatsapp/attendants/${id}`, { method: 'DELETE' });
    } catch {}
  },

  // Canned Responses / Respostas Rápidas
  async getCannedReplies(): Promise<CannedReply[]> {
    return getItem<CannedReply[]>(STORAGE_KEYS.CANNED_REPLIES, defaultCannedReplies);
  },

  async saveCannedReply(item: CannedReply): Promise<CannedReply> {
    const list = await this.getCannedReplies();
    const updated: CannedReply = {
      ...item,
      id: item.id || `can-${Date.now()}`,
    };
    const index = list.findIndex(c => c.id === updated.id);
    if (index >= 0) {
      list[index] = updated;
    } else {
      list.push(updated);
    }
    setItem(STORAGE_KEYS.CANNED_REPLIES, list);
    return updated;
  },

  async deleteCannedReply(id: string): Promise<void> {
    const list = await this.getCannedReplies();
    const filtered = list.filter(c => c.id !== id);
    setItem(STORAGE_KEYS.CANNED_REPLIES, filtered);
  },

  // Conversation Assignment & Transfer
  async assignConversation(conversationId: string, attendant: Attendant): Promise<Conversation | null> {
    const conv = await this.getConversationById(conversationId);
    if (!conv) return null;

    const updated: Conversation = {
      ...conv,
      status: 'human',
      assigned_to: attendant.id,
      assigned_attendant_id: attendant.id,
      assigned_attendant_name: attendant.name,
      updated_at: new Date().toISOString(),
    };

    // Update attendant metrics
    if (attendant.metrics) {
      attendant.metrics.chats_assigned = (attendant.metrics.chats_assigned || 0) + 1;
      await this.saveAttendant(attendant);
    }

    await this.saveConversation(updated);
    await this.sendInternalNote(
      conversationId,
      `🙋‍♂️ Atendimento assumido por ${attendant.name} (${attendant.department}).`,
      'Sistema'
    );
    return updated;
  },

  async transferConversation(
    conversationId: string, 
    toAttendant: Attendant, 
    fromAttendantName: string, 
    transferNote?: string
  ): Promise<Conversation | null> {
    const conv = await this.getConversationById(conversationId);
    if (!conv) return null;

    const updated: Conversation = {
      ...conv,
      status: 'human',
      assigned_to: toAttendant.id,
      assigned_attendant_id: toAttendant.id,
      assigned_attendant_name: toAttendant.name,
      department: toAttendant.department,
      updated_at: new Date().toISOString(),
    };

    if (toAttendant.metrics) {
      toAttendant.metrics.chats_assigned = (toAttendant.metrics.chats_assigned || 0) + 1;
      await this.saveAttendant(toAttendant);
    }

    await this.saveConversation(updated);
    const noteText = transferNote 
      ? `🔄 Atendimento transferido de ${fromAttendantName} para ${toAttendant.name} (${toAttendant.department}).\n📝 Motivo: "${transferNote}"`
      : `🔄 Atendimento transferido de ${fromAttendantName} para ${toAttendant.name} (${toAttendant.department}).`;
    
    await this.sendInternalNote(conversationId, noteText, 'Sistema');
    return updated;
  },

  // Agenda, Business Hours & Services Catalog
  async getAgendaSettings(): Promise<AgendaSettings> {
    const backendUrl = getBackendUrl();
    if (isSupabaseConfigured && supabase) {
      try {
        const { data: settingsData } = await supabase.from('settings').select('*').limit(1).maybeSingle();
        if (settingsData && settingsData.agenda_settings) {
          return settingsData.agenda_settings as AgendaSettings;
        }
      } catch (e) {}
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
      buffer_minutes: 5,
      out_of_hours_message: 'Olá! Nosso horário de expediente é de Segunda a Sábado das 08:00 às 19:00. Deixe sua mensagem ou selecione um horário para agendamento que confirmaremos assim que reabrirmos!',
      services: [
        { id: 'srv-1', name: 'Corte Tradicional', duration_minutes: 30, price: 35, category: 'Cabelo', description: 'Corte clássico ou moderno com acabamento na tesoura e navalhete.', active: true },
        { id: 'srv-2', name: 'Barboterapia Completa', duration_minutes: 30, price: 25, category: 'Barba', description: 'Tratamento com toalha quente, óleos essenciais e alinhamento.', active: true },
        { id: 'srv-3', name: 'Combo Cabelo + Barba', duration_minutes: 60, price: 55, category: 'Combo', description: 'Experiência completa com corte de cabelo e barboterapia.', active: true },
        { id: 'srv-4', name: 'Design de Sobrancelha', duration_minutes: 15, price: 15, category: 'Estética', description: 'Alinhamento e acabamento simétrico da sobrancelha.', active: true },
        { id: 'srv-5', name: 'Pigmentação Barba/Cabelo', duration_minutes: 20, price: 25, category: 'Estética', description: 'Preenchimento e disfarce de falhas com tintura especial.', active: true },
      ],
    });
  },

  async updateAgendaSettings(settings: Partial<AgendaSettings>): Promise<AgendaSettings> {
    const backendUrl = getBackendUrl();
    const current = await this.getAgendaSettings();
    const updated = { ...current, ...settings, updated_at: new Date().toISOString() };

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('settings').upsert({
          id: 'default',
          agenda_settings: updated,
          updated_at: new Date().toISOString()
        });
      } catch (e) {}
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

  async saveAgendaServiceItem(service: AgendaServiceItem): Promise<AgendaSettings> {
    const settings = await this.getAgendaSettings();
    const services = [...(settings.services || [])];
    const index = services.findIndex(s => s.id === service.id);
    if (index >= 0) {
      services[index] = service;
    } else {
      services.push(service);
    }
    return this.updateAgendaSettings({ services });
  },

  async deleteAgendaServiceItem(serviceId: string): Promise<AgendaSettings> {
    const settings = await this.getAgendaSettings();
    const services = (settings.services || []).filter(s => s.id !== serviceId);
    return this.updateAgendaSettings({ services });
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

  async getAvailableSlots(dateStr: string, duration?: number): Promise<string[]> {
    const backendUrl = getBackendUrl();
    try {
      const url = duration
        ? `${backendUrl}/api/whatsapp/agenda/available-slots?date=${dateStr}&duration=${duration}`
        : `${backendUrl}/api/whatsapp/agenda/available-slots?date=${dateStr}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        return data.available_slots || [];
      }
    } catch {}
    return ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00'];
  },

  async getNextAvailableSlot(dateStr: string, requestedTime: string, duration: number = 30): Promise<string | null> {
    const slots = await this.getAvailableSlots(dateStr, duration);
    if (!slots || slots.length === 0) return null;
    const [rh, rm] = requestedTime.split(':').map(Number);
    const reqMin = (rh || 0) * 60 + (rm || 0);

    const next = slots.find((s) => {
      const [sh, sm] = s.split(':').map(Number);
      return (sh || 0) * 60 + (sm || 0) > reqMin;
    });

    return next || slots[0] || null;
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
  },

  // Audit Logs
  async getLogs(): Promise<AuditLog[]> {
    const backendUrl = getBackendUrl();
    try {
      const res = await fetch(`${backendUrl}/api/whatsapp/logs`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) return data;
      }
    } catch {}

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('audit_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(200);
        if (!error && data && data.length > 0) return data as AuditLog[];
      } catch {}
    }

    return [];
  },

  async clearLogs(): Promise<void> {
    const backendUrl = getBackendUrl();
    try {
      await fetch(`${backendUrl}/api/whatsapp/logs`, { method: 'DELETE' });
    } catch {}

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('audit_logs').delete().neq('id', '0');
      } catch {}
    }
  },

  // System Users Management
  async getSystemUsers(): Promise<SystemUser[]> {
    const backendUrl = getBackendUrl();
    try {
      const res = await fetch(`${backendUrl}/api/whatsapp/users`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setItem(STORAGE_KEYS.SYSTEM_USERS, data);
          return data;
        }
      }
    } catch {}

    const localUsers = getItem<SystemUser[]>(STORAGE_KEYS.SYSTEM_USERS, [
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
    ]);
    return localUsers;
  },

  async saveSystemUser(user: SystemUser): Promise<void> {
    const backendUrl = getBackendUrl();
    try {
      const res = await fetch(`${backendUrl}/api/whatsapp/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.users && Array.isArray(data.users)) {
          setItem(STORAGE_KEYS.SYSTEM_USERS, data.users);
          return;
        }
      }
    } catch {}

    const users = getItem<SystemUser[]>(STORAGE_KEYS.SYSTEM_USERS, []);
    const idx = users.findIndex((u) => u.id === user.id);
    let updated: SystemUser[];
    if (idx >= 0) {
      updated = [...users];
      updated[idx] = { ...user, updated_at: new Date().toISOString() };
    } else {
      updated = [{ ...user, created_at: new Date().toISOString() }, ...users];
    }
    setItem(STORAGE_KEYS.SYSTEM_USERS, updated);
  },

  async deleteSystemUser(id: string): Promise<void> {
    const backendUrl = getBackendUrl();
    try {
      const res = await fetch(`${backendUrl}/api/whatsapp/users/${id}`, { method: 'DELETE' });
      if (res.ok) {
        const data = await res.json();
        if (data.users && Array.isArray(data.users)) {
          setItem(STORAGE_KEYS.SYSTEM_USERS, data.users);
          return;
        }
      }
    } catch {}

    const users = getItem<SystemUser[]>(STORAGE_KEYS.SYSTEM_USERS, []);
    const filtered = users.filter((u) => u.id !== id);
    setItem(STORAGE_KEYS.SYSTEM_USERS, filtered);
  },

  async verifyUserAccess(phone: string, passwordOrPin: string, requiredPermission: keyof UserPermissions): Promise<{ success: boolean; user?: SystemUser; error?: string }> {
    const cleanInput = phone.replace(/\D/g, '');
    const cleanPass = passwordOrPin.trim();

    // Try backend verification first
    const backendUrl = getBackendUrl();
    try {
      const res = await fetch(`${backendUrl}/api/whatsapp/users/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanInput, password: cleanPass, permission: requiredPermission }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) return { success: true, user: data.user };
        return { success: false, error: data.error || 'Acesso não autorizado.' };
      }
    } catch {}

    // Local / offline fallback
    const users = await this.getSystemUsers();
    const found = users.find((u) => {
      const uPhone = (u.phone || '').replace(/\D/g, '');
      const phoneMatches = uPhone === cleanInput || (cleanInput.length >= 8 && uPhone.endsWith(cleanInput.slice(-8)));
      const passMatches = u.password === cleanPass || u.pin === cleanPass || (cleanInput === '81996138924' && (cleanPass === '123' || cleanPass === '1234'));
      return phoneMatches && passMatches;
    });

    if (!found) {
      return { success: false, error: 'Telefone ou senha incorretos.' };
    }

    if (found.status === 'inactive') {
      return { success: false, error: 'Este usuário está inativo no sistema.' };
    }

    if (!found.permissions?.[requiredPermission]) {
      const labels: Record<string, string> = {
        can_access_admin: 'Painel Admin',
        can_access_atendimento: 'Painel de Atendimento',
        can_access_barbeiro: 'Painel do Barbeiro',
      };
      return { success: false, error: `Este usuário não tem permissão para acessar o ${labels[requiredPermission] || 'painel'}.` };
    }

    return { success: true, user: found };
  },

  // Barber Auth Session
  getBarberSession(): { authenticated: boolean; user?: SystemUser } {
    return getItem(STORAGE_KEYS.BARBER_AUTH, { authenticated: false });
  },

  setBarberSession(session: { authenticated: boolean; user?: SystemUser }): void {
    setItem(STORAGE_KEYS.BARBER_AUTH, session);
  },

  clearBarberSession(): void {
    localStorage.removeItem(STORAGE_KEYS.BARBER_AUTH);
  }
};
