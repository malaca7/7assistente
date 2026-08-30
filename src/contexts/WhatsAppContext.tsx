import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { WhatsAppSession } from '../types';
import { StorageService } from '../lib/storage';
import { useToast } from './ToastContext';

interface WhatsAppContextType {
  session: WhatsAppSession;
  isConnected: boolean;
  isConnecting: boolean;
  qrDataUrl: string | null;
  rawQR: string | null;
  generateQRCode: () => Promise<string>;
  connectDevice: (phone?: string, name?: string) => Promise<void>;
  disconnect: () => Promise<void>;
  refreshStatus: () => Promise<void>;
}

const SERVER_URL = 'http://localhost:3001';

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

  // Fetch status from live WhatsApp Baileys server
  const fetchLiveStatus = useCallback(async () => {
    try {
      const res = await fetch(`${SERVER_URL}/api/whatsapp/status`);
      if (res.ok) {
        const data = await res.json();
        if (data.qr) {
          setRawQR(data.qr);
        }
        if (data.qrDataUrl) {
          setQrDataUrl(data.qrDataUrl);
        }

        if (data.status === 'connected') {
          const newSession: WhatsAppSession = {
            status: 'connected',
            phone: data.phone || '81996138924',
            name: data.name || 'WhatsApp Business',
            connectedAt: data.connectedAt || new Date().toISOString(),
            batteryLevel: data.batteryLevel || 95,
          };
          setSession(newSession);
          await StorageService.updateSettings({ whatsapp_session: newSession });

          if (prevStatusRef.current !== 'connected') {
            const now = Date.now();
            if (!initialLoadRef.current && now - lastToastTimeRef.current > 6000) {
              success('WhatsApp Conectado!', `Aparelho (+55 ${data.phone}) emparelhado com sucesso!`);
              lastToastTimeRef.current = now;
            }
            prevStatusRef.current = 'connected';
          }
        } else if (data.status === 'qrcode') {
          setSession((prev) => ({
            ...prev,
            status: 'qrcode',
            qrCode: data.qr,
          }));
          prevStatusRef.current = 'qrcode';
        } else if (data.status === 'disconnected') {
          if (prevStatusRef.current === 'connected') {
            const now = Date.now();
            if (!initialLoadRef.current && now - lastToastTimeRef.current > 6000) {
              warning('WhatsApp Desconectado', 'A sessão do WhatsApp foi encerrada ou conectada em outro dispositivo.');
              lastToastTimeRef.current = now;
            }
          }
          prevStatusRef.current = 'disconnected';
        }
        initialLoadRef.current = false;
      }
    } catch (err) {
      // Backend not reached, fallback to stored settings
      const settings = await StorageService.getSettings();
      if (settings.whatsapp_session) {
        setSession(settings.whatsapp_session);
      }
      initialLoadRef.current = false;
    }
  }, [success, warning]);

  // Polling for live status and QR updates
  useEffect(() => {
    fetchLiveStatus();
    const interval = setInterval(fetchLiveStatus, 2000);
    return () => clearInterval(interval);
  }, [fetchLiveStatus]);

  // Request new QR Code from server
  const generateQRCode = useCallback(async (): Promise<string> => {
    setIsConnecting(true);
    try {
      await fetch(`${SERVER_URL}/api/whatsapp/start`, { method: 'POST' });
      await fetchLiveStatus();
    } catch (err) {
      console.warn('Could not call start on WhatsApp server:', err);
    } finally {
      setIsConnecting(false);
    }
    return rawQR || '';
  }, [fetchLiveStatus, rawQR]);

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
      await fetch(`${SERVER_URL}/api/whatsapp/disconnect`, { method: 'POST' });
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
        generateQRCode,
        connectDevice,
        disconnect,
        refreshStatus: fetchLiveStatus,
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
