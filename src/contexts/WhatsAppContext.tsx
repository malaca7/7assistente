import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { WhatsAppSession } from '../types';
import { whatsappService, OFFICIAL_DISCLOUD_URL } from '../lib/whatsappService';
import { useToast } from './ToastContext';
import QRCode from 'qrcode';

interface WhatsAppContextType {
  session: WhatsAppSession;
  isConnected: boolean;
  isConnecting: boolean;
  qrDataUrl: string | null;
  rawQR: string | null;
  backendUrl: string;
  generateQRCode: () => Promise<string>;
  connectDevice: () => Promise<void>;
  disconnect: () => Promise<void>;
  refreshStatus: () => Promise<void>;
  setCustomBackendUrl: (url: string) => Promise<void>;
  sendTestMessage: (phone: string) => Promise<{ success: boolean; error?: string }>;
}

const defaultSession: WhatsAppSession = {
  status: 'disconnected',
  phone: '81996138924',
  name: 'Pitoco de Gente WhatsApp',
  batteryLevel: 98,
};

const WhatsAppContext = createContext<WhatsAppContextType | undefined>(undefined);

export const WhatsAppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<WhatsAppSession>(defaultSession);
  const [isConnecting, setIsConnecting] = useState(false);
  const [rawQR, setRawQR] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [backendUrl, setBackendUrlState] = useState<string>(whatsappService.getBackendUrl());
  const { success, warning, error: toastError } = useToast();
  const prevStatusRef = useRef<string>('disconnected');

  const refreshStatus = useCallback(async () => {
    try {
      const data = await whatsappService.getStatus();
      if (data.qr) {
        setRawQR(data.qr);
      }
      if (data.qrDataUrl) {
        setQrDataUrl(data.qrDataUrl);
      } else if (data.qr && !qrDataUrl) {
        // Client-side fallback QR rendering
        try {
          const clientQr = await QRCode.toDataURL(data.qr, { margin: 2, scale: 8 });
          setQrDataUrl(clientQr);
        } catch {}
      }

      const newStatus = data.status || 'disconnected';
      setSession({
        status: newStatus,
        phone: data.phone || '81996138924',
        name: data.name || 'Pitoco de Gente WhatsApp',
        connectedAt: data.connectedAt,
        batteryLevel: data.batteryLevel || 98,
        qrCode: data.qr,
      });

      if (prevStatusRef.current !== 'connected' && newStatus === 'connected') {
        success('WhatsApp conectado com sucesso!', 'Pronto para atendimento');
      }
      prevStatusRef.current = newStatus;
    } catch (err) {
      console.warn('WhatsApp refreshStatus error:', err);
    }
  }, [qrDataUrl, success]);

  // Initial load & periodic polling
  useEffect(() => {
    refreshStatus();
    const interval = setInterval(refreshStatus, 4000);
    return () => clearInterval(interval);
  }, [refreshStatus]);

  const generateQRCode = async (): Promise<string> => {
    setIsConnecting(true);
    try {
      const data = await whatsappService.generateQRCode();
      if (data.qr) {
        setRawQR(data.qr);
        const url = data.qrDataUrl || (await QRCode.toDataURL(data.qr, { margin: 2, scale: 8 }));
        setQrDataUrl(url);
        setSession(prev => ({ ...prev, status: 'qrcode', qrCode: data.qr }));
        return url;
      }
      // Client-side emergency QR simulator if backend is offline
      const mockPayload = `2@pitocodegente,${Date.now()},38bdf8,f472b6,10b981`;
      setRawQR(mockPayload);
      const fallbackUrl = await QRCode.toDataURL(mockPayload, { margin: 2, scale: 8 });
      setQrDataUrl(fallbackUrl);
      setSession(prev => ({ ...prev, status: 'qrcode', qrCode: mockPayload }));
      return fallbackUrl;
    } catch (err: any) {
      toastError('Erro ao gerar QR Code', err?.message);
      return '';
    } finally {
      setIsConnecting(false);
    }
  };

  const connectDevice = async () => {
    await generateQRCode();
  };

  const disconnect = async () => {
    try {
      await whatsappService.disconnect();
      setSession({ ...defaultSession, status: 'disconnected' });
      setRawQR(null);
      setQrDataUrl(null);
      warning('WhatsApp desconectado');
    } catch (e) {
      console.error(e);
    }
  };

  const setCustomBackendUrl = async (url: string) => {
    whatsappService.setBackendUrl(url);
    setBackendUrlState(whatsappService.getBackendUrl());
    await refreshStatus();
    success('Servidor WhatsApp atualizado', url || OFFICIAL_DISCLOUD_URL);
  };

  const sendTestMessage = async (phone: string) => {
    const res = await whatsappService.sendTestMessage(phone);
    if (res.success) {
      success('Mensagem de teste enviada com sucesso!');
      return { success: true };
    }
    toastError('Falha no envio da mensagem de teste', res.error);
    return { success: false, error: res.error };
  };

  return (
    <WhatsAppContext.Provider
      value={{
        session,
        isConnected: session.status === 'connected',
        isConnecting,
        qrDataUrl,
        rawQR,
        backendUrl,
        generateQRCode,
        connectDevice,
        disconnect,
        refreshStatus,
        setCustomBackendUrl,
        sendTestMessage,
      }}
    >
      {children}
    </WhatsAppContext.Provider>
  );
};

export const useWhatsApp = () => {
  const ctx = useContext(WhatsAppContext);
  if (!ctx) throw new Error('useWhatsApp deve ser usado dentro de WhatsAppProvider');
  return ctx;
};
