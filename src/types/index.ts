// Types for Pitoco de Gente — Roupas de Bebê, Infantil e Enxovais

export type SystemRole = 'ceo' | 'manager' | 'attendant' | 'admin';

export interface AdminProfile {
  id: string;
  phone: string;
  name: string;
  email?: string;
  password?: string;
  role: SystemRole;
  store_id?: string | null; // null = Rede inteira (CEO)
  store_name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export type BabySize = 'RN' | 'P' | 'M' | 'G' | 'GG' | '1 ano' | '2 anos' | '3 anos';
export type ProductColor = 
  | 'Rosa Seco' 
  | 'Azul Bebê' 
  | 'Verde Menta' 
  | 'Branco Puro' 
  | 'Bege Neutro' 
  | 'Amarelo Manteiga' 
  | 'Lavanda';

export interface Store {
  id: string;
  name: string; // 1. Loja Matriz — Centro, 2. Loja Shopping Boulevard, 3. Atendimento Geral / E-commerce
  slug: 'matriz' | 'boulevard' | 'ecommerce';
  address: string;
  phone: string;
  whatsapp_number: string;
  is_active: boolean;
  business_hours?: string;
  city?: string;
  manager_name?: string;
  monthly_revenue?: number;
  active_chats?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Category {
  id: string;
  store_id?: string | null;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  sort_order?: number;
  is_active: boolean;
  created_at?: string;
}

export interface Product {
  id: string;
  store_id?: string | null; // Global se nulo ou específico de loja
  category_id: string;
  category_name?: string;
  name: string;
  description: string;
  price: number;
  promotional_price?: number;
  sizes: BabySize[];
  colors: ProductColor[];
  image_url?: string;
  stock_quantity: number;
  sku?: string;
  is_featured?: boolean;
  is_active: boolean;
  material?: string; // ex: 'Algodão Suedine 100% Pima', 'Tricot Luxo Antialérgico'
  created_at?: string;
  updated_at?: string;
}

export interface LayetteItem {
  id: string;
  category: 'roupinhas' | 'higiene' | 'quarto' | 'acessorios' | 'maternidade';
  name: string;
  quantity: number;
  recommendedSize?: string;
  notes?: string;
  checked?: boolean;
}

export interface MeasureGuideItem {
  size: BabySize;
  ageRange: string;
  weightRange: string;
  heightRange: string;
  description: string;
}

export interface VIPConsultation {
  id: string;
  store_id: string;
  store_name?: string;
  client_name: string;
  client_phone: string;
  consultation_type: 'online_whatsapp' | 'presencial_loja';
  consultation_date: string;
  consultation_time: string;
  due_date?: string; // DPP - Data provável do parto
  baby_gender?: 'menino' | 'menina' | 'gemeos' | 'surpresa';
  status: 'confirmed' | 'pending' | 'completed' | 'cancelled';
  consultant_name?: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
}

// Alias Appointment for backward compatibility
export type Appointment = VIPConsultation;

export interface Client {
  id: string;
  name: string;
  phone: string;
  email?: string;
  store_id?: string;
  store_name?: string;
  address?: string;
  city?: string;
  cep?: string;
  notes?: string;
  baby_name?: string;
  due_date?: string;
  total_orders?: number;
  total_spent?: number;
  last_interaction?: string;
  tags?: string[];
  created_at: string;
  updated_at?: string;
}

// Alias Contact for backward compatibility
export interface Contact extends Client {
  profile_picture_url?: string;
  status: 'active' | 'blocked' | 'archived';
  custom_fields?: Record<string, any>;
  metadata?: Record<string, any>;
}

export type TicketStatus = 'open' | 'in_progress' | 'transferred' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface SupportTicket {
  id: string;
  store_id: string;
  store_name?: string;
  client_id: string;
  client_name: string;
  client_phone: string;
  conversation_id?: string;
  protocol: string;
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;
  attendant_name?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface BotConfig {
  id: string;
  bot_name: string;
  store_name: string;
  welcome_message: string;
  handoff_message: string;
  fallback_message: string;
  pix_key: string;
  pix_name: string;
  pix_city: string;
  shipping_motoboy_price: number;
  shipping_correios_price: number;
  free_shipping_threshold: number;
  vip_consultation_enabled: boolean;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
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
  fallback_message?: string;
  company_address?: string;
  pix_key_type?: string;
  pix_key?: string;
  pix_owner?: string;
  shipping_motoboy?: number;
  shipping_correios?: number;
  free_shipping_min?: number;
  notify_new_orders?: boolean;
  notify_phone?: string;
  play_audio_alerts?: boolean;
  handoff_message?: string;
  [key: string]: any;
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

export interface CustomVariable {
  id: string;
  name: string;
  value: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
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
  backend_url?: string;
  supabase_url?: string;
  supabase_anon_key?: string;
  admin_password?: string;
  custom_variables?: CustomVariable[];
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
  | 'show_catalog'
  | 'select_product'
  | 'measure_guide'
  | 'layette_checklist'
  | 'shipping_calculator'
  | 'pix_payment'
  | 'vip_consultation'
  | 'store_selector'
  | 'check_contact'
  | 'end_flow'
  // Backward compatibility alias
  | 'show_services'
  | 'select_service'
  | 'select_date'
  | 'select_time_slot'
  | 'ask_date'
  | 'services_catalog'
  | 'schedule_contact'
  | 'confirm_booking'
  | 'update_contact';

export interface AuditLog {
  id: string;
  type: 'order_created' | 'consultation_created' | 'ticket_status' | 'bot_flow' | 'message_inbound' | 'message_outbound' | 'system' | 'appointment_created' | 'appointment_status';
  title: string;
  description: string;
  contact_phone?: string;
  contact_name?: string;
  store_id?: string;
  details?: Record<string, any>;
  created_at: string;
}

export interface UserPermissions {
  // Portais de Acesso
  can_access_admin: boolean;
  can_access_atendimento: boolean;
  can_access_loja: boolean;
  can_view_all_stores?: boolean; // CEO

  // Módulos do Sistema
  can_manage_products?: boolean;
  can_manage_stores?: boolean;
  can_manage_clients?: boolean;
  can_manage_conversations?: boolean;
  can_manage_flows?: boolean;
  can_manage_users?: boolean;
  can_manage_settings?: boolean;
  can_view_logs?: boolean;

  // Ações Operacionais
  can_schedule_consultation?: boolean;
  can_send_whatsapp_messages?: boolean;
  can_manage_tickets?: boolean;

  // Backward compatibility
  can_access_barbeiro?: boolean;
  can_manage_agenda?: boolean;
  can_create_appointments?: boolean;
  can_cancel_appointments?: boolean;
}

export interface SystemUser {
  id: string;
  name: string;
  phone: string;
  email?: string;
  password?: string;
  pin?: string;
  role: SystemRole;
  store_id?: string | null; // null = CEO (all stores)
  store_name?: string;
  permissions: UserPermissions;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at?: string;
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

export type ConversationStatus = 'bot' | 'waiting_human' | 'human' | 'closed';

export interface AttendantMetrics {
  chats_assigned: number;
  chats_resolved: number;
  messages_sent: number;
  avg_response_time_min: number;
  rating: number;
}

export interface Attendant {
  id: string;
  name: string;
  email: string;
  phone?: string;
  password: string;
  role: 'admin' | 'attendant' | 'supervisor' | 'consultant';
  department: string;
  store_id?: string | null;
  store_name?: string;
  avatar_url?: string;
  status: 'online' | 'busy' | 'offline';
  metrics?: AttendantMetrics;
  created_at: string;
  updated_at?: string;
}

export interface CannedReply {
  id: string;
  label: string;
  cmd: string;
  text: string;
  category?: string;
}

export type ConversationPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface Conversation {
  id: string;
  contact_id: string;
  contact_name?: string;
  contact_phone?: string;
  contact?: Contact;
  store_id?: string | null;
  store_name?: string;
  status: ConversationStatus;
  priority?: ConversationPriority;
  department?: string;
  assigned_to?: string | null;
  assigned_attendant_id?: string | null;
  assigned_attendant_name?: string | null;
  started_at: string;
  last_message_at: string;
  unread_count?: number;
  last_message?: string;
  internal_notes?: Array<{
    id: string;
    text: string;
    author: string;
    created_at: string;
  }>;
  created_at: string;
  updated_at: string;
}

export type MessageDirection = 'inbound' | 'outbound';
export type MessageStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
export type MessageType = 'text' | 'image' | 'audio' | 'video' | 'document' | 'button' | 'interactive' | 'internal_note' | 'catalog' | 'pix';

export interface Message {
  id: string;
  conversation_id: string;
  store_id?: string | null;
  direction: MessageDirection;
  message_type: MessageType;
  content: string;
  media_url?: string;
  whatsapp_message_id?: string;
  status: MessageStatus;
  author_name?: string;
  is_internal?: boolean;
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
  totalProducts?: number;
  totalStores?: number;
  monthRevenue?: number;
  totalOrders?: number;
}

export interface SlotSuggestion {
  date: string;
  time: string;
  formattedDate: string;
  dayOfWeek: string;
  displayFull: string;
  displayShort: string;
  isSameDate: boolean;
}

// AgendaSettings fallback for VIP Consultation scheduler
export interface AgendaSettings {
  business_days: string[];
  start_time: string;
  end_time: string;
  slot_duration_minutes: number;
  break_start_time?: string;
  break_end_time?: string;
  buffer_minutes?: number;
  services?: any[];
}
