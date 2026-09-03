import React, { useState, useEffect, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  RefreshCw, 
  KeyRound, 
  Copy, 
  Check, 
  QrCode as QrCodeIcon,
  AlertCircle,
  Smartphone,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { Button } from './Button';
import { useWhatsApp } from '../../contexts/WhatsAppContext';

export interface QRCodeViewProps {
  value?: string;
  qrDataUrl?: string | null;
  onRefresh?: () => void;
  onConnect?: (phone?: string) => Promise<void>;
  onRequestPairingCode?: (phone: string) => Promise<{ success: boolean; code?: string; error?: string }>;
  isLoading?: boolean;
  adminPhone?: string;
}

export const QRCodeView: React.FC<QRCodeViewProps> = ({
  value,
  qrDataUrl,
  onRefresh,
  onRequestPairingCode,
  isLoading = false,
  adminPhone = '81996138924',
}) => {
  let whatsAppCtx: any = null;
  try {
    whatsAppCtx = useWhatsApp();
  } catch {}

  const effectiveValue = value ?? (whatsAppCtx?.rawQR || whatsAppCtx?.session?.qrCode || '');
  const effectiveQrDataUrl = qrDataUrl !== undefined ? qrDataUrl : (whatsAppCtx?.qrDataUrl || null);
  const effectiveLoading = isLoading || whatsAppCtx?.isConnecting || false;
  const effectiveOnRefresh = onRefresh || (() => whatsAppCtx?.generateQRCode?.());
  const effectivePairingCodeReq = onRequestPairingCode || ((phone: string) => whatsAppCtx?.requestPairingCode?.(phone) || Promise.resolve({ success: false, error: 'Contexto não disponível' }));

  const [activeMode, setActiveMode] = useState<'qr' | 'code'>('qr');
  const [timeLeft, setTimeLeft] = useState(45);
  const [pairingPhone, setPairingPhone] = useState(adminPhone);
  const [pairingCode, setPairingCode] = useState('');
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [pairingError, setPairingError] = useState<string | null>(null);

  // Check if we have an authentic QR Code received from the active Baileys server
  const isAuthenticServerQR = Boolean(
    effectiveQrDataUrl?.startsWith('data:image/') ||
    (effectiveValue && effectiveValue.length > 15 && !effectiveValue.includes('7assistente_') && !effectiveValue.includes('pairing_v2026'))
  );

  const refreshQR = useCallback(() => {
    setTimeLeft(45);
    effectiveOnRefresh();
  }, [effectiveOnRefresh]);

  // Auto-refresh once on mount if QR is missing
  useEffect(() => {
    if (!isAuthenticServerQR && effectiveOnRefresh) {
      effectiveOnRefresh();
    }
  }, []);

  // Expiration countdown
  useEffect(() => {
    if (!isAuthenticServerQR) return;
    setTimeLeft(45);
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [value, qrDataUrl, isAuthenticServerQR]);

  const isExpired = isAuthenticServerQR && timeLeft === 0;

  const handleGeneratePairingCode = async () => {
    const cleanPhone = pairingPhone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setPairingError('Informe o DDD e o número completo (ex: 5581996138924)');
      return;
    }
    setPairingError(null);
    setIsGeneratingCode(true);

    if (effectivePairingCodeReq) {
      const res = await effectivePairingCodeReq(cleanPhone);
      if (res.success && res.code) {
        setPairingCode(res.code);
      } else {
        setPairingError(res.error || 'Servidor WhatsApp não está respondendo. Inicie o bot na Discloud ou localmente.');
      }
    }
    setIsGeneratingCode(false);
  };

  const handleCopyCode = () => {
    if (!pairingCode) return;
    navigator.clipboard.writeText(pairingCode.replace('-', ''));
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 sm:p-6 space-y-6">
      {/* Mode Switcher: QR Code vs Código de Pareamento */}
      <div className="flex rounded-xl bg-dark-950 p-1 border border-slate-800 text-xs w-full max-w-sm">
        <button
          type="button"
          onClick={() => setActiveMode('qr')}
          className={`flex-1 py-2 px-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2 ${
            activeMode === 'qr'
              ? 'bg-primary-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <QrCodeIcon className="w-3.5 h-3.5" />
          <span>Escanear QR Code</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveMode('code')}
          className={`flex-1 py-2 px-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2 ${
            activeMode === 'code'
              ? 'bg-primary-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <KeyRound className="w-3.5 h-3.5" />
          <span>Código de Pareamento</span>
        </button>
      </div>

      {/* MODE 1: Official WhatsApp QR Code */}
      {activeMode === 'qr' && (
        <div className="flex flex-col items-center space-y-5">
          {/* WhatsApp QR Box */}
          <div className="relative p-5 bg-white rounded-3xl shadow-2xl border-4 border-emerald-500/40 group">
            {/* Corner Decorative Marks */}
            <div className="absolute -top-1.5 -left-1.5 w-7 h-7 border-t-4 border-l-4 border-emerald-500 rounded-tl-2xl" />
            <div className="absolute -top-1.5 -right-1.5 w-7 h-7 border-t-4 border-r-4 border-emerald-500 rounded-tr-2xl" />
            <div className="absolute -bottom-1.5 -left-1.5 w-7 h-7 border-b-4 border-l-4 border-emerald-500 rounded-bl-2xl" />
            <div className="absolute -bottom-1.5 -right-1.5 w-7 h-7 border-b-4 border-r-4 border-emerald-500 rounded-br-2xl" />

            <div className="w-60 h-60 sm:w-68 sm:h-68 bg-white flex items-center justify-center relative rounded-2xl overflow-hidden p-2">
              {isAuthenticServerQR ? (
                effectiveQrDataUrl ? (
                  <img
                    src={effectiveQrDataUrl}
                    alt="WhatsApp QR Code Oficial"
                    className={`w-full h-full object-contain transition-all duration-300 ${
                      isExpired || effectiveLoading ? 'opacity-15 blur-[2px]' : 'opacity-100'
                    }`}
                  />
                ) : (
                  <QRCodeSVG
                    value={effectiveValue}
                    size={240}
                    level="M"
                    includeMargin={false}
                    className={`transition-all duration-300 ${
                      isExpired || effectiveLoading ? 'opacity-15 blur-[2px]' : 'opacity-100'
                    }`}
                    imageSettings={{
                      src: 'https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg',
                      x: undefined,
                      y: undefined,
                      height: 44,
                      width: 44,
                      excavate: true,
                    }}
                  />
                )
              ) : (
                <div className="flex flex-col items-center justify-center p-4 text-center space-y-3 bg-dark-950 rounded-2xl w-full h-full text-slate-200">
                  <div className="w-10 h-10 rounded-full border-3 border-emerald-500 border-t-transparent animate-spin flex items-center justify-center">
                    <Smartphone className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div className="space-y-1">
                    <h5 className="text-xs font-bold text-white">Gerando QR Code Oficial</h5>
                    <p className="text-[11px] text-slate-300 leading-tight">
                      Aguardando chave criptográfica do WhatsApp.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveMode('code')}
                    className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 underline underline-offset-2"
                  >
                    Ou usar Código de Pareamento
                  </button>
                </div>
              )}

              {/* Scanning Laser Line */}
              {isAuthenticServerQR && !isExpired && !isLoading && (
                <div className="absolute left-2 right-2 h-1 bg-emerald-500 shadow-[0_0_12px_#10b981] animate-[pulse_2s_ease-in-out_infinite]" />
              )}

              {/* Expired Overlay */}
              {isExpired && (
                <div className="absolute inset-0 bg-dark-950/85 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center space-y-3">
                  <span className="text-sm font-bold text-white">QR Code Expirou</span>
                  <p className="text-xs text-slate-300">Clique abaixo para gerar um novo código oficial.</p>
                  <Button
                    size="sm"
                    variant="brand"
                    leftIcon={<RefreshCw className="w-4 h-4" />}
                    onClick={refreshQR}
                  >
                    Gerar Novo QR Code
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Timer & Refresh Action Button */}
          <div className="text-center space-y-3 w-full max-w-xs">
            {isAuthenticServerQR && !isExpired && (
              <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
                <span>Expira em:</span>
                <span className="font-mono font-bold text-emerald-400 text-sm">{timeLeft}s</span>
              </div>
            )}

            <div className="w-full">
              <Button
                variant="brand"
                size="md"
                className="w-full font-bold shadow-glow-brand"
                leftIcon={<RefreshCw className="w-4 h-4" />}
                onClick={refreshQR}
                isLoading={isLoading}
              >
                Gerar / Atualizar QR Code
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODE 2: 8-Digit Pairing Code (Alternative to QR Code) */}
      {activeMode === 'code' && (
        <div className="w-full max-w-md p-5 rounded-2xl bg-dark-850 border border-slate-800 space-y-5 animate-in fade-in duration-200">
          <div className="space-y-1 text-center">
            <h4 className="text-sm font-bold text-white flex items-center justify-center gap-2">
              <KeyRound className="w-4 h-4 text-emerald-400" />
              Conectar com Número de Telefone
            </h4>
            <p className="text-xs text-slate-400">
              Receba um código de 8 dígitos para conectar diretamente no WhatsApp sem precisar de câmera.
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Seu Número com DDD (ex: 5581996138924)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={pairingPhone}
                  onChange={(e) => setPairingPhone(e.target.value)}
                  placeholder="Ex: 5581996138924"
                  className="flex-1 rounded-xl bg-dark-950 border border-slate-700 px-3.5 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                />
                <Button
                  size="sm"
                  variant="brand"
                  onClick={handleGeneratePairingCode}
                  isLoading={isGeneratingCode}
                >
                  Gerar Código
                </Button>
              </div>
              {pairingError && (
                <p className="text-[11px] text-amber-400 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {pairingError}
                </p>
              )}
            </div>

            {/* Generated Code Display Box */}
            {pairingCode && (
              <div className="p-4 rounded-xl bg-dark-950 border-2 border-emerald-500/40 flex flex-col items-center justify-center space-y-2 animate-in zoom-in-95">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                  Código de Pareamento de 8 Dígitos
                </span>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-2xl sm:text-3xl font-extrabold text-emerald-400 tracking-widest select-all">
                    {pairingCode}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="p-2 rounded-lg bg-dark-850 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
                    title="Copiar código"
                  >
                    {codeCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 text-center">
                  👉 No seu celular: Abra o <strong>WhatsApp</strong> &gt; <strong>Aparelhos Conectados</strong> &gt; <strong>Conectar com número de telefone</strong> e insira o código acima.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
