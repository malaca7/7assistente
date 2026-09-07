import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { 
  Store, 
  Category, 
  Product, 
  Client, 
  SupportTicket, 
  Message, 
  Conversation, 
  BotConfig 
} from '../types';

const SUPABASE_URL = 
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_URL) ||
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
  'https://cbeiguyvoepbcafmxduy.supabase.co';

const SUPABASE_ANON_KEY = 
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY) ||
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNiZWlndXl2b2VwYmNhZm14ZHV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3MzU5NzcsImV4cCI6MjEwNDMxMTk3N30.1XpWL6ns9NlPh4sQ3M8-OJTnKCPH-jf89iFspmBrKxM';

export const isSupabaseReady = Boolean(
  SUPABASE_URL && 
  SUPABASE_ANON_KEY && 
  SUPABASE_URL.includes('supabase.co')
);

export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// ==========================================
// 1. STORES CRUD & QUERIES
// ==========================================
export async function getStores(): Promise<Store[]> {
  try {
    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .order('slug', { ascending: true });
    
    if (error) throw error;
    if (data && data.length > 0) return data as Store[];
  } catch (err) {
    console.warn('[Supabase] getStores fallback:', err);
  }
  return [];
}

export async function getStoreById(id: string): Promise<Store | null> {
  try {
    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    
    if (error) throw error;
    return data as Store | null;
  } catch (err) {
    console.warn('[Supabase] getStoreById fallback:', err);
    return null;
  }
}

export async function updateStore(id: string, updates: Partial<Store>): Promise<Store | null> {
  try {
    const { data, error } = await supabase
      .from('stores')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .maybeSingle();
    
    if (error) throw error;
    return data as Store | null;
  } catch (err) {
    console.warn('[Supabase] updateStore error:', err);
    return null;
  }
}

// ==========================================
// 2. CATEGORIES CRUD
// ==========================================
export async function getCategories(storeId?: string): Promise<Category[]> {
  try {
    let query = supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });
    
    if (storeId) {
      query = query.or(`store_id.is.null,store_id.eq.${storeId}`);
    }

    const { data, error } = await query;
    if (error) throw error;
    if (data && data.length > 0) return data as Category[];
  } catch (err) {
    console.warn('[Supabase] getCategories fallback:', err);
  }
  return [];
}

export async function createCategory(cat: Omit<Category, 'id'>): Promise<Category | null> {
  try {
    const { data, error } = await supabase
      .from('categories')
      .insert([cat])
      .select()
      .single();
    if (error) throw error;
    return data as Category;
  } catch (err) {
    console.warn('[Supabase] createCategory error:', err);
    return null;
  }
}

// ==========================================
// 3. PRODUCTS CRUD
// ==========================================
export async function getProducts(storeId?: string, categoryId?: string): Promise<Product[]> {
  try {
    let query = supabase
      .from('products')
      .select('*, categories(name)')
      .eq('is_active', true)
      .order('name', { ascending: true });
    
    if (storeId) {
      query = query.or(`store_id.is.null,store_id.eq.${storeId}`);
    }
    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    const { data, error } = await query;
    if (error) throw error;
    if (data && data.length > 0) {
      return data.map((p: any) => ({
        ...p,
        category_name: p.categories?.name || p.category_name,
      })) as Product[];
    }
  } catch (err) {
    console.warn('[Supabase] getProducts fallback:', err);
  }
  return [];
}

export async function getProductById(id: string): Promise<Product | null> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data as Product | null;
  } catch (err) {
    console.warn('[Supabase] getProductById error:', err);
    return null;
  }
}

export async function saveProduct(prod: Partial<Product>): Promise<Product | null> {
  try {
    const payload = {
      ...prod,
      updated_at: new Date().toISOString(),
    };
    const { data, error } = await supabase
      .from('products')
      .upsert(payload)
      .select()
      .single();
    if (error) throw error;
    return data as Product;
  } catch (err) {
    console.warn('[Supabase] saveProduct error:', err);
    return null;
  }
}

export async function deleteProduct(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);
    return !error;
  } catch (err) {
    console.warn('[Supabase] deleteProduct error:', err);
    return false;
  }
}

// ==========================================
// 4. CLIENTS & CRM
// ==========================================
export async function getClients(storeId?: string): Promise<Client[]> {
  try {
    let query = supabase
      .from('clients')
      .select('*')
      .order('last_interaction', { ascending: false });
    
    if (storeId) {
      query = query.eq('store_id', storeId);
    }

    const { data, error } = await query;
    if (error) throw error;
    if (data) return data as Client[];
  } catch (err) {
    console.warn('[Supabase] getClients fallback:', err);
  }
  return [];
}

export async function upsertClient(client: Partial<Client>): Promise<Client | null> {
  try {
    const cleanPhone = String(client.phone || '').replace(/\D/g, '');
    const payload = {
      ...client,
      phone: cleanPhone,
      updated_at: new Date().toISOString(),
    };
    const { data, error } = await supabase
      .from('clients')
      .upsert(payload, { onConflict: 'phone' })
      .select()
      .single();
    if (error) throw error;
    return data as Client;
  } catch (err) {
    console.warn('[Supabase] upsertClient error:', err);
    return null;
  }
}

// ==========================================
// 5. CHAT MESSAGES & REALTIME
// ==========================================
export async function getChatMessages(conversationId: string): Promise<Message[]> {
  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    if (data) return data as Message[];
  } catch (err) {
    console.warn('[Supabase] getChatMessages fallback:', err);
  }
  return [];
}

export async function insertChatMessage(msg: Partial<Message>): Promise<Message | null> {
  try {
    const payload = {
      id: msg.id || `msg-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      conversation_id: msg.conversation_id,
      store_id: msg.store_id || null,
      direction: msg.direction || 'outbound',
      message_type: msg.message_type || 'text',
      content: msg.content,
      media_url: msg.media_url || null,
      status: msg.status || 'delivered',
      author_name: msg.author_name || 'Pitoco Atendente',
      created_at: msg.created_at || new Date().toISOString(),
    };
    const { data, error } = await supabase
      .from('chat_messages')
      .insert([payload])
      .select()
      .single();
    if (error) throw error;
    return data as Message;
  } catch (err) {
    console.warn('[Supabase] insertChatMessage error:', err);
    return null;
  }
}

export function subscribeToMessages(conversationId: string, onMessage: (msg: Message) => void) {
  const channel = supabase
    .channel(`messages:${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        if (payload.new) {
          onMessage(payload.new as Message);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

// ==========================================
// 6. SUPPORT TICKETS
// ==========================================
export async function getSupportTickets(storeId?: string): Promise<SupportTicket[]> {
  try {
    let query = supabase
      .from('support_tickets')
      .select('*, stores(name), clients(name, phone)')
      .order('created_at', { ascending: false });
    
    if (storeId) {
      query = query.eq('store_id', storeId);
    }
    const { data, error } = await query;
    if (error) throw error;
    if (data) {
      return data.map((t: any) => ({
        ...t,
        store_name: t.stores?.name || t.store_name,
        client_name: t.clients?.name || t.client_name,
        client_phone: t.clients?.phone || t.client_phone,
      })) as SupportTicket[];
    }
  } catch (err) {
    console.warn('[Supabase] getSupportTickets fallback:', err);
  }
  return [];
}

export async function createSupportTicket(ticket: Partial<SupportTicket>): Promise<SupportTicket | null> {
  try {
    const protocol = ticket.protocol || `PTC-${Date.now().toString().slice(-6)}`;
    const payload = {
      ...ticket,
      protocol,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const { data, error } = await supabase
      .from('support_tickets')
      .insert([payload])
      .select()
      .single();
    if (error) throw error;
    return data as SupportTicket;
  } catch (err) {
    console.warn('[Supabase] createSupportTicket error:', err);
    return null;
  }
}

export async function updateSupportTicketStatus(
  id: string, 
  status: SupportTicket['status'], 
  notes?: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('support_tickets')
      .update({
        status,
        ...(notes ? { notes } : {}),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);
    return !error;
  } catch (err) {
    console.warn('[Supabase] updateSupportTicketStatus error:', err);
    return false;
  }
}

// ==========================================
// 7. BOT CONFIG
// ==========================================
export async function getBotConfig(): Promise<BotConfig | null> {
  try {
    const { data, error } = await supabase
      .from('bot_config')
      .select('*')
      .eq('id', 'default')
      .maybeSingle();
    if (error) throw error;
    return data as BotConfig | null;
  } catch (err) {
    console.warn('[Supabase] getBotConfig fallback:', err);
    return null;
  }
}

export async function saveBotConfig(config: Partial<BotConfig>): Promise<BotConfig | null> {
  try {
    const payload = {
      id: 'default',
      ...config,
      updated_at: new Date().toISOString(),
    };
    const { data, error } = await supabase
      .from('bot_config')
      .upsert(payload, { onConflict: 'id' })
      .select()
      .single();
    if (error) throw error;
    return data as BotConfig;
  } catch (err) {
    console.warn('[Supabase] saveBotConfig error:', err);
    return null;
  }
}

// ==========================================
// 8. CONVERSATIONS & MULTI-STORE REALTIME
// ==========================================
export async function getConversations(storeId?: string): Promise<Conversation[]> {
  try {
    let query = supabase
      .from('conversations')
      .select('*, stores(name)')
      .order('last_message_at', { ascending: false });
    
    if (storeId) {
      query = query.eq('store_id', storeId);
    }
    const { data, error } = await query;
    if (error) throw error;
    if (data) {
      return data.map((c: any) => ({
        ...c,
        store_name: c.stores?.name || c.store_name,
      })) as Conversation[];
    }
  } catch (err) {
    console.warn('[Supabase] getConversations fallback:', err);
  }
  return [];
}

export async function updateConversationStatus(
  id: string, 
  status: Conversation['status'], 
  storeId?: string
): Promise<boolean> {
  try {
    const updates: any = {
      status,
      updated_at: new Date().toISOString(),
    };
    if (storeId) updates.store_id = storeId;

    const { error } = await supabase
      .from('conversations')
      .update(updates)
      .eq('id', id);
    return !error;
  } catch (err) {
    console.warn('[Supabase] updateConversationStatus error:', err);
    return false;
  }
}

export function subscribeToConversations(onUpdate: (conv: Conversation) => void) {
  const channel = supabase
    .channel('all_conversations')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'conversations',
      },
      (payload) => {
        if (payload.new) {
          onUpdate(payload.new as Conversation);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
