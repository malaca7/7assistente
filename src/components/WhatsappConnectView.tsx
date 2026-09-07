import React, { useState } from 'react';
import { 
  QrCode, 
  Smartphone, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Send, 
  CheckCircle2, 
  AlertTriangle, 
  Server, 
  ShieldCheck, 
  Copy, 
  ExternalLink,
  Power
} from 'lucide-react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { useWhatsApp } from '../contexts/WhatsAppContext';
import { useToast } from '../contexts/ToastContext';
import { OFFICIAL_DISCLOUD_URL } from '../lib/whatsappService';

export const WhatsappConnectView: React.FC = () => {
  const { 
    session, 
    isConnected, 
    isConnecting, 
    qrDataUrl, 
    rawQR, 
    backendUrl, 
    generateQRCode, 
    disconnect, 
    refreshStatus, 
    setCustomBackendUrl,
    sendTestMessage
  } = useWhatsApp();

  const { success, warning, error: toastError, info } = useToast();
  const [testPhone, setTestPhone] = useState('81996138924');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [customUrlInput, setCustomUrlInput] = useState(backendUrl);
  const [isEditingUrl, setIsEditingUrl] = useState(false);

  const handleTestMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testPhone.trim()) return;

    setIsSendingTest(true);
    try {
      const res = await sendTestMessage(testPhone.trim());
      if (res.success) {
        success('Mensagem de teste enviada com sucesso para o WhatsApp!');
      }
    } catch (err: any) {
      toastError('Erro ao enviar mensagem', err?.message);
    } finally {
      setIsSendingTest(false);
    }
  };

  const handleSaveBackendUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    await setCustomBackendUrl(customUrlInput);
    setIsEditingUrl(false);
  };

  const handleSetOfficialDiscloud = async () => {
    setCustomUrlInput(OFFICIAL_DISCLOUD_URL);
    await setCustomBackendUrl(OFFICIAL_DISCLOUD_URL);
    setIsEditingUrl(false);
  };

  const handleSetLocalhost = async () => {
    const local = 'http://localhost:8080';
    setCustomUrlInput(local);
    await setCustomBackendUrl(local);
    setIsEditingUrl(false);
  };

  const copyQR = () => {
    if (rawQR) {
      navigator.clipboard.writeText(rawQR);
      info('Código do QR copiado para a área de transferência');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Banner Principal de Status */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-dark-900 to-dark-850 border border-white/10 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border shadow-lg ${
            isConnected
              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
              : session.status === 'qrcode'
              ? 'bg-pitoco-blue/20 text-pitoco-blue border-pitoco-blue/30 animate-pulse'
              : 'bg-dark-800 text-slate-400 border-white/10'
          }`}>
            {isConnected ? (
              <Wifi className="w-7 h-7 text-emerald-400" />
            ) : (
              <WifiOff className="w-7 h-7 text-slate-400" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white">
                Conexão WhatsApp Baileys
              </h2>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
                isConnected
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : session.status === 'qrcode'
                  ? 'bg-pitoco-blue/20 text-pitoco-blue border border-pitoco-blue/30'
                  : 'bg-slate-800 text-slate-400 border border-white/10'
              }`}>
                {isConnected ? 'Conectado' : session.status === 'qrcode' ? 'Aguardando Leitura' : 'Desconectado'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {isConnected
                ? `Dispositivo conectado: ${session.phone || '81996138924'} (${session.name || 'Pitoco de Gente'})`
                : 'Escaneie o QR Code abaixo com seu WhatsApp para ativar a automação e o inbox humano.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          {isConnected ? (
            <Button
              variant="outline"
              size="sm"
              onClick={disconnect}
              className="border-rose-500/30 text-rose-400 hover:bg-rose-500/10 text-xs w-full md:w-auto"
            >
              <Power className="w-3.5 h-3.5 mr-1.5" />
              Desconectar
            </Button>
          ) : (
            <Button
              size="sm"
              disabled={isConnecting}
              onClick={generateQRCode}
              className="bg-pitoco-blue text-slate-900 hover:bg-pitoco-blue/90 font-bold text-xs w-full md:w-auto"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isConnecting ? 'animate-spin' : ''}`} />
              Gerar Novo QR Code
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Card do QR Code (7 colunas) */}
        <Card className="md:col-span-7 p-6 bg-dark-900 border-white/10 flex flex-col items-center justify-center text-center">
          <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
            <QrCode className="w-4 h-4 text-pitoco-blue" />
            Escanear QR Code com WhatsApp
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mb-6">
            Abra o WhatsApp no seu celular → Toque em <strong>Aparelhos conectados</strong> → <strong>Conectar um aparelho</strong> e aponte a câmera:
          </p>

          <div className="p-4 rounded-2xl bg-white shadow-2xl flex items-center justify-center min-w-[240px] min-h-[240px] relative">
            {isConnected ? (
              <div className="text-center p-6 space-y-3">
                <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto" />
                <span className="block text-sm font-bold text-slate-900">
                  WhatsApp Conectado!
                </span>
                <span className="block text-xs text-slate-600">
                  Pronto para enviar e receber mensagens
                </span>
              </div>
            ) : qrDataUrl ? (
              <div className="space-y-2">
                <img 
                  src={qrDataUrl} 
                  alt="QR Code WhatsApp Baileys" 
                  className="w-56 h-56 object-contain mx-auto"
                />
                <span className="block text-[11px] text-slate-600 font-medium">
                  Atualiza automaticamente a cada 30 segundos
                </span>
              </div>
            ) : (
              <div className="text-center p-6 space-y-3 text-slate-600">
                <Smartphone className="w-12 h-12 text-slate-400 mx-auto animate-bounce" />
                <p className="text-xs">
                  {isConnecting ? 'Gerando QR Code...' : 'Clique no botão abaixo para gerar o QR Code'}
                </p>
                <Button
                  size="sm"
                  onClick={generateQRCode}
                  className="bg-pitoco-blue text-slate-900 font-bold text-xs"
                >
                  Carregar QR Code
                </Button>
              </div>
            )}
          </div>

          {rawQR && (
            <button
              onClick={copyQR}
              className="mt-4 text-[11px] text-pitoco-blue hover:underline flex items-center gap-1"
            >
              <Copy className="w-3 h-3" />
              Copiar código textual do QR
            </button>
          )}
        </Card>

        {/* Card de Configurações & Testes (5 colunas) */}
        <div className="md:col-span-5 space-y-6">
          {/* Seletor de Servidor Backend */}
          <Card className="p-5 bg-dark-900 border-white/10">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Server className="w-3.5 h-3.5 text-pitoco-pink" />
              Servidor Backend WhatsApp
            </h3>

            <div className="space-y-3 text-xs">
              <div className="p-2.5 rounded-lg bg-dark-800 border border-white/5">
                <span className="text-slate-400 block text-[10px]">Endpoint Atual:</span>
                <span className="font-mono text-pitoco-blue font-medium break-all">
                  {backendUrl}
                </span>
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSetOfficialDiscloud}
                  className="flex-1 text-[11px] border-white/10 hover:bg-white/5 text-slate-300 py-1.5"
                >
                  Discloud Oficial
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSetLocalhost}
                  className="flex-1 text-[11px] border-white/10 hover:bg-white/5 text-slate-300 py-1.5"
                >
                  Localhost (8080)
                </Button>
              </div>

              {isEditingUrl ? (
                <form onSubmit={handleSaveBackendUrl} className="space-y-2 pt-2">
                  <input
                    type="text"
                    value={customUrlInput}
                    onChange={e => setCustomUrlInput(e.target.value)}
                    placeholder="https://sua-url.discloud.app"
                    className="w-full bg-dark-800 border border-white/10 rounded-lg p-2 text-xs text-white"
                  />
                  <div className="flex gap-2">
                    <Button type="submit" size="sm" className="bg-pitoco-blue text-slate-900 font-bold text-xs flex-1">
                      Salvar URL
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => setIsEditingUrl(false)} className="text-xs">
                      Cancelar
                    </Button>
                  </div>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditingUrl(true)}
                  className="text-[11px] text-slate-400 hover:text-white underline block"
                >
                  Personalizar URL manual
                </button>
              )}
            </div>
          </Card>

          {/* Envio de Mensagem de Teste */}
          <Card className="p-5 bg-dark-900 border-white/10">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Send className="w-3.5 h-3.5 text-emerald-400" />
              Disparo de Mensagem de Teste
            </h3>

            <form onSubmit={handleTestMessage} className="space-y-3">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">
                  Número do WhatsApp (com DDD):
                </label>
                <input
                  type="text"
                  value={testPhone}
                  onChange={e => setTestPhone(e.target.value)}
                  placeholder="81996138924"
                  className="w-full bg-dark-800 border border-white/10 rounded-lg p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pitoco-blue"
                />
              </div>

              <Button
                type="submit"
                disabled={isSendingTest || !isConnected}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs py-2.5 rounded-xl transition-all"
              >
                <Send className="w-3.5 h-3.5 mr-2" />
                {isSendingTest ? 'Enviando...' : 'Enviar Teste Oficial Pitoco'}
              </Button>

              {!isConnected && (
                <span className="text-[10px] text-amber-400/80 block text-center">
                  * Conecte o WhatsApp via QR Code antes de enviar testes.
                </span>
              )}
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};
