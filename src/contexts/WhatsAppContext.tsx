import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { WhatsAppSession } from '../types';
import { StorageService } from '../lib/storage';
import { useToast } from './ToastContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface WhatsAppContextType {
  session: WhatsAppSession;
  isConnected: boolean;
  isConnecting: boolean;
  qrDataUrl: string | null;
  rawQR: string | null;
  backendUrl: string;
  generateQRCode: () => Promise<string>;
  requestPairingCode: (phone: string) => Promise<{ success: boolean; code?: string; error?: string }>;
  connectDevice: (phone?: string, name?: string) => Promise<void>;
  disconnect: () => Promise<void>;
  refreshStatus: () => Promise<void>;
  setCustomBackendUrl: (url: string) => Promise<void>;
}

const getBackendUrl = (): string => {
  if (typeof window === 'undefined') return 'http://localhost:3001';
  if (import.meta.env.VITE_BACKEND_URL) return import.meta.env.VITE_BACKEND_URL;
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return `http://${window.location.hostname}:3001`;
  }
  if (window.location.hostname.includes('discloud.app')) {
    return window.location.origin;
  }
  try {
    const raw = localStorage.getItem('7assistente_settings');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.backend_url) return parsed.backend_url;
    }
  } catch {}
  return 'https://talvane.discloud.app';
};

const defaultSession: WhatsAppSession = {
  status: 'disconnected',
  phone: '',
  name: '',
  batteryLevel: 94,
};

const WhatsAppContext = createContext<WhatsAppContextType | undefined>(undefined);

export const WhatsAppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<WhatsAppSession>(defaultSession);
  const [isConnecting, setIsConnecting] = useState(false);
  const [rawQR, setRawQR] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const { success, warning, info } = useToast();
  const prevStatusRef = useRef<string>('disconnected');
  const lastToastTimeRef = useRef<number>(0);
  const initialLoadRef = useRef<boolean>(true);

  // Fetch status from live WhatsApp Baileys server & Supabase Real-Time Bridge
  const fetchLiveStatus = useCallback(async () => {
    let gotData = false;

    // 1. Try Direct Backend URL or Localhost
    const backend = getBackendUrl() || (typeof window !== 'undefined' && window.location.hostname === 'localhost' ? 'http://localhost:3001' : '');
    if (backend) {
      try {
        const res = await fetch(`${backend}/api/whatsapp/status`);
        if (res.ok) {
          const data = await res.json();
          if (data.qr) setRawQR(data.qr);
          if (data.qrDataUrl) setQrDataUrl(data.qrDataUrl);

          if (data.status === 'connected') {
            const newSession: WhatsAppSession = {
              status: 'connected',
              phone: data.phone || '81996138924',
              name: data.name || 'WhatsApp Business',
              connectedAt: data.connectedAt || new Date().toISOString(),
              batteryLevel: data.batteryLevel || 95,
            };
            setSession(newSession);
            prevStatusRef.current = 'connected';
          } else if (data.status === 'qrcode') {
            setSession((prev) => ({ ...prev, status: 'qrcode', qrCode: data.qr }));
            prevStatusRef.current = 'qrcode';
          } else if (data.status === 'connecting') {
            setSession((prev) => ({ ...prev, status: 'connecting' }));
            prevStatusRef.current = 'connecting';
          } else if (data.status === 'disconnected') {
            setSession((prev) => ({ ...prev, status: 'disconnected' }));
            prevStatusRef.current = 'disconnected';
          }
          gotData = true;
        }
      } catch (e) {
        // Direct fetch failed
      }
    }

    // 2. Try Supabase Real-Time Bridge (Works universally on custom domains & GitHub Pages)
    if (isSupabaseConfigured && supabase) {
      try {
        const { data } = await supabase.from('settings').select('whatsapp_session').limit(1).maybeSingle();
        if (data?.whatsapp_session) {
          const ws = data.whatsapp_session;
          if (ws.qr) setRawQR(ws.qr);
          if (ws.qrDataUrl) setQrDataUrl(ws.qrDataUrl);

          if (ws.status === 'connected') {
            setSession({
              status: 'connected',
              phone: ws.phone || '81996138924',
              name: ws.name || 'WhatsApp Business',
              connectedAt: ws.connectedAt || new Date().toISOString(),
              batteryLevel: ws.batteryLevel || 95,
            });
          } else if (ws.status === 'qrcode') {
            setSession((prev) => ({ ...prev, status: 'qrcode', qrCode: ws.qr }));
          } else if (ws.status === 'connecting') {
            setSession((prev) => ({ ...prev, status: 'connecting' }));
          } else if (ws.status === 'disconnected') {
            setSession((prev) => ({ ...prev, status: 'disconnected' }));
          }
          gotData = true;
        }
      } catch (err) {
        // Supabase fetch fallback
      }
    }

    // 3. LocalStorage Fallback
    if (!gotData) {
      const settings = await StorageService.getSettings();
      if (settings.whatsapp_session) {
        setSession(settings.whatsapp_session);
      }
    }
    initialLoadRef.current = false;
  }, []);

  // Real-Time Listener via Supabase + Polling Interval
  useEffect(() => {
    fetchLiveStatus();
    const interval = setInterval(fetchLiveStatus, 3000);

    let channel: any = null;
    if (isSupabaseConfigured && supabase) {
      try {
        channel = supabase
          .channel('realtime_whatsapp_settings')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'settings' },
            (payload: any) => {
              const ws = payload?.new?.whatsapp_session;
              if (ws) {
                if (ws.qr) setRawQR(ws.qr);
                if (ws.qrDataUrl) setQrDataUrl(ws.qrDataUrl);
                if (ws.status) setSession((prev) => ({ ...prev, ...ws }));
              }
            }
          )
          .subscribe();
      } catch (e) {}
    }

    return () => {
      clearInterval(interval);
      if (channel && supabase) {
        supabase.removeChannel(channel);
      }
    };
  }, [fetchLiveStatus]);

  // Request new QR Code from server
  const generateQRCode = useCallback(async (): Promise<string> => {
    setIsConnecting(true);
    const backend = getBackendUrl() || (typeof window !== 'undefined' && window.location.hostname === 'localhost' ? 'http://localhost:3001' : '');
    if (backend) {
      try {
        const res = await fetch(`${backend}/api/whatsapp/refresh-qr`, { method: 'POST' });
        if (res.ok) {
          const data = await res.json();
          if (data.qr) setRawQR(data.qr);
          if (data.qrDataUrl) setQrDataUrl(data.qrDataUrl);
          if (data.status) setSession((prev) => ({ ...prev, status: data.status }));
          setIsConnecting(false);
          return data.qr || '';
        }
      } catch (err) {
        console.warn('Could not call refresh-qr on WhatsApp server:', err);
      }
    }
    await fetchLiveStatus();
    setIsConnecting(false);
    return rawQR || '';
  }, [fetchLiveStatus, rawQR]);

  // Request real 8-digit WhatsApp Pairing Code by phone number
  const requestPairingCode = useCallback(async (phone: string): Promise<{ success: boolean; code?: string; error?: string }> => {
    setIsConnecting(true);
    try {
      const url = getBackendUrl();
      if (!url) {
        return { success: false, error: 'Configure a URL do servidor backend primeiro.' };
      }
      const res = await fetch(`${url}/api/whatsapp/pairing-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Erro ao gerar código de pareamento.' };
      }
      return { success: true, code: data.code };
    } catch (err: any) {
      console.error('Pairing code request error:', err);
      return { success: false, error: err?.message || 'Servidor backend inacessível.' };
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const setCustomBackendUrl = useCallback(async (url: string) => {
    const clean = url.trim().replace(/\/+$/, '');
    await StorageService.updateSettings({ backend_url: clean } as any);
    success('Servidor Atualizado', `Backend configurado para: ${clean || 'Padrão'}`);
    fetchLiveStatus();
  }, [fetchLiveStatus, success]);

  // Connect / Pair Fallback Manual
  const connectDevice = useCallback(async (customPhone?: string, customName?: string) => {
    setIsConnecting(true);
    try {
      const connectedPhone = (customPhone || '81996138924').replace(/\D/g, '');
      const connectedName = customName || 'WhatsApp Empresa 7A';

      const newSession: WhatsAppSession = {
        status: 'connected',
        phone: connectedPhone,
        name: connectedName,
        connectedAt: new Date().toISOString(),
        batteryLevel: 94,
      };

      setSession(newSession);
      await StorageService.updateSettings({ whatsapp_session: newSession });
      success('WhatsApp Conectado!', `Aparelho (+55 ${connectedPhone}) conectado com sucesso.`);
    } catch (err) {
      console.error('Error connecting device:', err);
    } finally {
      setIsConnecting(false);
    }
  }, [success]);

  // Disconnect device
  const disconnect = useCallback(async () => {
    try {
      await fetch(`${getBackendUrl()}/api/whatsapp/disconnect`, { method: 'POST' });
    } catch (err) {
      console.warn('Disconnect endpoint error:', err);
    }
    const disconnectedSession: WhatsAppSession = {
      status: 'disconnected',
      phone: '',
      name: '',
    };
    setSession(disconnectedSession);
    setRawQR(null);
    setQrDataUrl(null);
    prevStatusRef.current = 'disconnected';
    await StorageService.updateSettings({ whatsapp_session: disconnectedSession });
    warning('WhatsApp Desconectado', 'O aparelho foi desconectado.');
  }, [warning]);

  const isConnected = session.status === 'connected';

  return (
    <WhatsAppContext.Provider
      value={{
        session,
        isConnected,
        isConnecting,
        rawQR,
        qrDataUrl,
        backendUrl: getBackendUrl(),
        generateQRCode,
        requestPairingCode,
        connectDevice,
        disconnect,
        refreshStatus: fetchLiveStatus,
        setCustomBackendUrl,
      }}
    >
      {children}
    </WhatsAppContext.Provider>
  );
};

export const useWhatsApp = () => {
  const context = useContext(WhatsAppContext);
  if (!context) {
    throw new Error('useWhatsApp must be used within a WhatsAppProvider');
  }
  return context;
};
