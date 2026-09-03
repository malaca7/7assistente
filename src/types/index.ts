// Types for 7 Assistente

export interface AdminProfile {
  id: string;
  phone: string;
  name: string;
  password?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export type BotGender = 'female' | 'male' | 'neutral';
export type BotTone = 'friendly' | 'formal' | 'casual' | 'technical' | 'empathic';

export interface BotProfile {
  name: string;
  company_name: string;
  gender: BotGender;
  tone: BotTone;
  avatar_url: string;
  company_segment?: string;
  support_email?: string;
  support_phone?: string;
  business_hours?: string;
  website_url?: string;
  welcome_message?: string;
}

export type WhatsAppConnectionState = 'disconnected' | 'connecting' | 'qrcode' | 'connected' | 'error';

export interface WhatsAppSession {
  status: WhatsAppConnectionState;
  phone?: string;
  name?: string;
  batteryLevel?: number;
  connectedAt?: string;
  qrCode?: string;
  qrExpiresAt?: string;
}

export interface Settings {
  id: string;
  whatsapp_phone_number_id?: string;
  whatsapp_business_account_id?: string;
  whatsapp_access_token_encrypted?: string;
  webhook_verify_token?: string;
  bot_profile?: BotProfile;
  whatsapp_session?: WhatsAppSession;
  ai_enabled?: boolean;
  ai_model?: string;
  ai_temperature?: number;
  ai_system_prompt?: string;
  created_at: string;
  updated_at: string;
}

export type FlowStatus = 'draft' | 'published' | 'paused' | 'archived';

export interface Flow {
  id: string;
  name: string;
  description: string;
  status: FlowStatus;
  version: number;
  node_count?: number;
  trigger_type?: string;
  created_at: string;
  updated_at: string;
}

export type NodeTypeEnum =
  | 'trigger'
  | 'message'
  | 'buttons'
  | 'question'
  | 'condition'
  | 'delay'
  | 'http_request'
  | 'webhook'
  | 'variable'
  | 'ai_agent'
  | 'media'
  | 'human_handoff'
  | 'ask_date'
  | 'services_catalog'
  | 'schedule_contact'
  | 'confirm_booking'
  | 'update_contact'
  | 'check_contact';

export interface Appointment {
  id: string;
  contact_phone: string;
  contact_name: string;
  service_name: string;
  duration_minutes?: number;
  appointment_date: string;
  appointment_time: string;
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
  notes?: string;
  created_at: string;
}

export interface AgendaServiceItem {
  id: string;
  name: string;
  duration_minutes: number;
  price?: number;
  description?: string;
  category?: string;
  active?: boolean;
}

export interface AgendaSettings {
  business_days: string[]; // ['1', '2', '3', '4', '5', '6', '0'] (1=Seg, 2=Ter, ..., 6=Sáb, 0=Dom)
  start_time: string; // '08:00'
  end_time: string; // '19:00'
  slot_duration_minutes: number; // 30, 45, 60
  break_start_time?: string; // '12:00'
  break_end_time?: string; // '13:00'
  buffer_minutes?: number; // 5, 10
  out_of_hours_message?: string;
  services: AgendaServiceItem[];
}

export interface FlowNodeData {
  label: string;
  nodeType: NodeTypeEnum;
  description?: string;
  isConfigured?: boolean;
  config: Record<string, any>;
  [key: string]: any;
}

export interface FlowNode {
  id: string;
  flow_id?: string;
  type: string;
  position: { x: number; y: number };
  data: FlowNodeData;
}

export interface FlowEdge {
  id: string;
  flow_id?: string;
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
  label?: string;
  animated?: boolean;
  data?: {
    condition?: any;
  };
}

export interface Contact {
  id: string;
  phone: string;
  name: string;
  profile_picture_url?: string;
  status: 'active' | 'blocked' | 'archived';
  tags: string[];
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export type ConversationStatus = 'bot' | 'waiting_human' | 'human' | 'closed';

export interface Conversation {
  id: string;
  contact_id: string;
  contact_name?: string;
  contact_phone?: string;
  contact?: Contact;
  status: ConversationStatus;
  assigned_to?: string | null;
  started_at: string;
  last_message_at: string;
  unread_count?: number;
  last_message?: string;
  created_at: string;
  updated_at: string;
}

export type MessageDirection = 'inbound' | 'outbound';
export type MessageStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
export type MessageType = 'text' | 'image' | 'audio' | 'video' | 'document' | 'button' | 'interactive';

export interface Message {
  id: string;
  conversation_id: string;
  direction: MessageDirection;
  message_type: MessageType;
  content: string;
  media_url?: string;
  whatsapp_message_id?: string;
  status: MessageStatus;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface DashboardKPIs {
  totalContacts: number;
  totalConversations: number;
  activeConversations: number;
  activeFlows: number;
  waitingHuman: number;
  messagesSentToday: number;
}
