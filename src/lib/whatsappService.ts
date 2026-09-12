// Official WhatsApp Service connecting Frontend to Meta WhatsApp Business Cloud API & Backend Microservice
export interface WhatsAppStatusResponse {
  status: 'disconnected' | 'connecting' | 'qrcode' | 'connected' | 'error';
  provider?: 'meta_cloud_api' | 'baileys' | 'none';
  configured?: boolean;
  connected?: boolean;
  phone?: string;
  name?: string;
  verified_name?: string;
  quality_rating?: string;
  code_verification_status?: string;
  messaging_limit?: string;
  phone_number_id?: string;
  waba_id?: string;
  webhook_url?: string;
  verify_token?: string;
  error?: string | null;
  batteryLevel?: number;
  connectedAt?: string;
  qr?: string;
  qrDataUrl?: string;
  qrExpiresAt?: string;
  message?: string;
}

export interface MetaWhatsAppConfigPayload {
  accessToken?: string;
  phoneNumberId?: string;
  wabaId?: string;
  verifyToken?: string;
}

export interface SendMessagePayload {
  phone: string;
  text: string;
  type?: 'text' | 'image' | 'video' | 'audio' | 'document';
  mediaUrl?: string;
  caption?: string;
}

export interface SendMessageResponse {
  success: boolean;
  messageId?: string;
  status?: string;
  error?: string;
}

const STORAGE_KEY_BACKEND = 'pitoco_custom_backend_url';
export const OFFICIAL_DISCLOUD_URL = 'https://pitoco.discloud.app';

export function getWhatsAppBackendUrl(): string {
  if (typeof window !== 'undefined') {
    try {
      const custom = localStorage.getItem(STORAGE_KEY_BACKEND);
      if (custom && custom.trim().length > 0) {
        return custom.trim().replace(/\/+$/, '');
      }
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        // In local development, check if developer set a local port or default to Discloud
        return 'http://localhost:8080';
      }
      if (window.location.hostname.includes('discloud.app')) {
        return window.location.origin;
      }
    } catch {}
  }
  return OFFICIAL_DISCLOUD_URL;
}

export function setWhatsAppBackendUrl(url: string): void {
  if (typeof window !== 'undefined') {
    if (!url || url.trim() === '' || url.includes('pitoco.discloud.app')) {
      localStorage.removeItem(STORAGE_KEY_BACKEND);
    } else {
      localStorage.setItem(STORAGE_KEY_BACKEND, url.trim().replace(/\/+$/, ''));
    }
  }
}

export const whatsappService = {
  getBackendUrl: getWhatsAppBackendUrl,
  setBackendUrl: setWhatsAppBackendUrl,

  // 1. GET /api/whatsapp/qr & /health
  async getStatus(): Promise<WhatsAppStatusResponse> {
    const base = getWhatsAppBackendUrl();
    try {
      const res = await fetch(`${base}/api/whatsapp/qr`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });
      if (res.ok) {
        return await res.json();
      }
      // Fallback endpoint if /api/whatsapp/status was configured
      const altRes = await fetch(`${base}/api/whatsapp/status`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });
      if (altRes.ok) {
        return await altRes.json();
      }
    } catch (err: any) {
      console.warn(`[whatsappService] Error reaching ${base}:`, err?.message || err);
      // If localhost fails, automatically try official Discloud
      if (base !== OFFICIAL_DISCLOUD_URL) {
        try {
          const fbRes = await fetch(`${OFFICIAL_DISCLOUD_URL}/api/whatsapp/qr`);
          if (fbRes.ok) return await fbRes.json();
        } catch {}
      }
    }
    return {
      status: 'disconnected',
      message: 'Backend WhatsApp offline ou conectando...',
    };
  },

  // 2. POST /api/whatsapp/qr (Trigger generation / reconnect)
  async generateQRCode(clearAuth: boolean = false): Promise<WhatsAppStatusResponse> {
    const base = getWhatsAppBackendUrl();
    try {
      const res = await fetch(`${base}/api/whatsapp/qr`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clearAuth }),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (err: any) {
      console.error('[whatsappService] Error generating QR:', err);
    }
    return { status: 'error', message: 'Falha ao solicitar QR Code ao servidor' };
  },

  // 3. POST /api/send-message (Send message via Baileys)
  async sendMessage(payload: SendMessagePayload): Promise<SendMessageResponse> {
    const base = getWhatsAppBackendUrl();
    const cleanPhone = String(payload.phone || '').replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 8) {
      return { success: false, error: 'Número de telefone inválido' };
    }

    try {
      const res = await fetch(`${base}/api/send-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: cleanPhone,
          text: payload.text,
          type: payload.type,
          mediaUrl: payload.mediaUrl,
          caption: payload.caption,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        return { success: true, messageId: data.messageId, status: data.status };
      }
      return { success: false, error: data.error || data.message || 'Falha no envio' };
    } catch (err: any) {
      console.error('[whatsappService] Send message network error:', err);
      return { success: false, error: err?.message || 'Erro de conexão com o backend' };
    }
  },

  // 4. GET /api/stores (List stores from Baileys microservice)
  async getStores(): Promise<any[]> {
    const base = getWhatsAppBackendUrl();
    try {
      const res = await fetch(`${base}/api/stores`);
      if (res.ok) {
        const data = await res.json();
        return Array.isArray(data) ? data : data.stores || [];
      }
    } catch (err) {
      console.warn('[whatsappService] Error getting stores from backend:', err);
    }
    return [
      { id: 'store-001', name: 'Loja Matriz — Centro', slug: 'matriz' },
      { id: 'store-002', name: 'Loja Ipojuca - Filial', slug: 'ipojuca' },
      { id: 'store-003', name: 'Atendimento Geral / E-commerce', slug: 'ecommerce' },
    ];
  },

  // 5. POST /api/whatsapp/disconnect
  async disconnect(provider?: 'baileys' | 'meta' | 'all'): Promise<boolean> {
    const base = getWhatsAppBackendUrl();
    try {
      const res = await fetch(`${base}/api/whatsapp/disconnect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider }),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  // 6. POST /api/whatsapp/config (Salvar credenciais da Meta Cloud API)
  async saveMetaConfig(config: MetaWhatsAppConfigPayload): Promise<any> {
    const base = getWhatsAppBackendUrl();
    try {
      const res = await fetch(`${base}/api/whatsapp/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      return await res.json();
    } catch (err: any) {
      console.error('[whatsappService] Error saving Meta config:', err);
      return { success: false, error: err?.message || 'Erro ao conectar ao servidor' };
    }
  },

  // 7. POST /api/whatsapp/test-connection (Testar conexão ao vivo com a Graph API da Meta)
  async testMetaConnection(): Promise<any> {
    const base = getWhatsAppBackendUrl();
    try {
      const res = await fetch(`${base}/api/whatsapp/test-connection`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      return await res.json();
    } catch (err: any) {
      console.error('[whatsappService] Error testing Meta connection:', err);
      return { success: false, error: err?.message || 'Erro ao testar com a Meta' };
    }
  },

  // 8. Test message helper
  async sendTestMessage(phone: string): Promise<SendMessageResponse> {
    return this.sendMessage({
      phone,
      text: '🍼 Olá! Esta é uma mensagem de teste oficial enviada pelo sistema Pitoco de Gente via Meta WhatsApp Business Cloud API! ✨🛍️',
    });
  },
};
