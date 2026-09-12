import React, { useState, useEffect, useCallback } from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  Server, 
  ShieldCheck, 
  Copy, 
  ExternalLink,
  Power, 
  Key, 
  Smartphone, 
  Globe, 
  Send, 
  RefreshCw, 
  Eye, 
  EyeOff, 
  Check, 
  Zap, 
  Info, 
  Layers, 
  Sparkles, 
  Lock, 
  MessageSquare,
  QrCode,
  Clock,
  SmartphoneCharging,
  Radio
} from 'lucide-react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
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
    generateQRCode,
    backendUrl, 
    disconnect, 
    refreshStatus, 
    saveMetaConfig,
    testMetaConnection,
    sendTestMessage
  } = useWhatsApp();

  const { success, warning, error: toastError, info } = useToast();

  // Abas: 'qrcode' (WhatsApp Business App) | 'credentials' | 'webhook' | 'test'
  const [activeTab, setActiveTab] = useState<'qrcode' | 'credentials' | 'webhook' | 'test'>('qrcode');

  // Estados do formulário de credenciais da Meta
  const [accessToken, setAccessToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [phoneNumberId, setPhoneNumberId] = useState(session.phone_number_id || '');
  const [wabaId, setWabaId] = useState(session.waba_id || '');
  const [verifyToken, setVerifyToken] = useState(session.verify_token || 'M4l@qu14s');
  
  const [isSaving, setIsSaving] = useState(false);
  const [isTestingConn, setIsTestingConn] = useState(false);
  const [isRefreshingQR, setIsRefreshingQR] = useState(false);

  // Teste de disparo
  const [testPhone, setTestPhone] = useState('81996138924');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Carregar QR Code automaticamente ao entrar na aba se não estiver conectado
  useEffect(() => {
    if (activeTab === 'qrcode' && !isConnected && !qrDataUrl) {
      generateQRCode(false).catch(() => {});
    }
  }, [activeTab, isConnected, qrDataUrl, generateQRCode]);

  // Sincronizar dados da sessão
  useEffect(() => {
    if (session.phone_number_id) setPhoneNumberId(session.phone_number_id);
    if (session.waba_id) setWabaId(session.waba_id);
    if (session.verify_token) setVerifyToken(session.verify_token);
  }, [session.phone_number_id, session.waba_id, session.verify_token]);

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    info(`${fieldName} copiado para a área de transferência!`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleGenerateQR = async (clearAuth: boolean = false) => {
    setIsRefreshingQR(true);
    try {
      info('Gerando QR Code atualizado para o WhatsApp Business...');
      const url = await generateQRCode(clearAuth);
      if (url) {
        success('Novo QR Code gerado!', 'Aponte a câmera do WhatsApp Business em Aparelhos Conectados.');
      } else {
        warning('Aguardando geração do QR Code...', 'O servidor está preparando a sessão.');
      }
    } catch (err: any) {
      toastError('Erro ao gerar QR Code', err?.message || 'Falha de comunicação com o servidor');
    } finally {
      setIsRefreshingQR(false);
    }
  };

  const handleDisconnect = async (provider?: 'baileys' | 'meta' | 'all') => {
    try {
      await disconnect(provider);
      success('WhatsApp desconectado', 'A sessão anterior foi encerrada.');
      if (activeTab === 'qrcode') {
        setTimeout(() => handleGenerateQR(true), 1500);
      }
    } catch (err: any) {
      toastError('Erro ao desconectar', err?.message);
    }
  };

  const handleSaveMeta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumberId.trim()) {
      toastError('Campo obrigatório', 'O Phone Number ID é necessário para a Meta Cloud API.');
      return;
    }

    setIsSaving(true);
    try {
      const payload: any = {
        phoneNumberId: phoneNumberId.trim(),
        wabaId: wabaId.trim(),
        verifyToken: verifyToken.trim() || 'M4l@qu14s',
      };
      if (accessToken.trim()) {
        payload.accessToken = accessToken.trim();
      }

      const res = await saveMetaConfig(payload);
      if (res.success) {
        success('Configuração da Meta Cloud API salva com sucesso!');
        await handleTestConnection();
      }
    } catch (err: any) {
      toastError('Erro ao salvar', err?.message || 'Falha na requisição');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setIsTestingConn(true);
    try {
      const res = await testMetaConnection();
      if (res.connected) {
        success('Conexão Oficial Validada com a Meta!', `Número: ${res.display_phone_number} • Qualidade: ${res.quality_rating}`);
      } else {
        toastError('Validação com a Meta falhou', res.error || 'Verifique se o Access Token e o Phone Number ID estão corretos.');
      }
    } catch (err: any) {
      toastError('Erro ao testar', err?.message || 'Falha de comunicação');
    } finally {
      setIsTestingConn(false);
    }
  };

  const handleSendTestMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testPhone.trim()) {
      toastError('Número inválido', 'Informe um número para envio.');
      return;
    }

    setIsSendingTest(true);
    try {
      const res = await sendTestMessage(testPhone.trim());
      if (res.success) {
        success('Mensagem de teste enviada com sucesso no WhatsApp!');
      }
    } catch (err: any) {
      toastError('Erro no envio', err?.message);
    } finally {
      setIsSendingTest(false);
    }
  };

  const webhookUrl = `${OFFICIAL_DISCLOUD_URL}/api/webhook`;
  const isBaileysActive = session.status === 'connected' && session.provider === 'baileys';
  const isMetaActive = session.status === 'connected' && session.provider === 'meta_cloud_api';

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Banner Principal de Status */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-dark-900 via-dark-850 to-emerald-950/40 border border-emerald-500/20 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border shadow-lg ${
            isConnected
              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-emerald-500/10'
              : 'bg-dark-800 text-slate-400 border-white/10'
          }`}>
            {isBaileysActive ? (
              <Smartphone className="w-8 h-8 text-emerald-400 animate-pulse" />
            ) : isMetaActive ? (
              <ShieldCheck className="w-8 h-8 text-emerald-400" />
            ) : (
              <QrCode className="w-8 h-8 text-slate-400" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                Conexão WhatsApp (QR Code & Meta Oficial)
              </h2>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                isConnected
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              }`}>
                {isBaileysActive
                  ? 'QR Code Ativo (WhatsApp Business)'
                  : isMetaActive
                    ? 'Meta Cloud API Oficial'
                    : 'Aguardando Conexão'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {isConnected
                ? `Operando ativamente no número ${session.phone || 'da loja'} (${session.name || 'WhatsApp'}).`
                : 'Conecte facilmente lendo o QR Code com o aplicativo WhatsApp Business ou configure as chaves da Meta.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isConnected && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDisconnect(session.provider as any)}
              className="border-rose-500/30 text-rose-400 hover:bg-rose-500/10 text-xs flex items-center gap-1.5"
            >
              <Power className="w-3.5 h-3.5" />
              Desconectar
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => refreshStatus()}
            className="border-white/10 text-slate-300 hover:text-white text-xs flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Sincronizar
          </Button>
        </div>
      </div>

      {/* Cards de Métricas e Status Ativo */}
      {isConnected && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-dark-850 border border-white/10 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Número Conectado</span>
              <p className="text-sm font-bold text-emerald-400">
                {session.phone || 'Número Ativo'}
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-dark-850 border border-white/10 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Modo de Operação</span>
              <p className="text-sm font-bold text-white">
                {isBaileysActive ? 'Aparelho Conectado (Web)' : 'Meta Cloud API (Nuvem)'}
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-dark-850 border border-white/10 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Anti-Ban & Blindagem</span>
              <p className="text-sm font-bold text-purple-300">Ativo e Protegido</p>
            </div>
          </div>
        </div>
      )}

      {/* Navegação por Abas */}
      <div className="flex border-b border-white/10 gap-2 overflow-x-auto pb-px">
        <button
          onClick={() => setActiveTab('qrcode')}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'qrcode'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <QrCode className="w-4 h-4" />
          Conectar via QR Code (WhatsApp Business)
        </button>

        <button
          onClick={() => setActiveTab('credentials')}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'credentials'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Key className="w-4 h-4" />
          Credenciais Meta Cloud API
        </button>

        <button
          onClick={() => setActiveTab('webhook')}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'webhook'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Globe className="w-4 h-4" />
          Webhook & Meta Developers
        </button>

        <button
          onClick={() => setActiveTab('test')}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'test'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Send className="w-4 h-4" />
          Teste de Envio
        </button>
      </div>

      {/* ========================================================================= */}
      {/* ABA 1: CONEXÃO VIA QR CODE (WHATSAPP BUSINESS) */}
      {/* ========================================================================= */}
      {activeTab === 'qrcode' && (
        <div className="space-y-6">
          {isBaileysActive ? (
            <Card className="p-8 bg-dark-850 border-emerald-500/30 text-center space-y-6">
              <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-xl shadow-emerald-500/10">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div className="space-y-2 max-w-md mx-auto">
                <h3 className="text-xl font-bold text-white">
                  WhatsApp Business Conectado com Sucesso!
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  O robô está pareado diretamente ao aplicativo WhatsApp Business do seu celular. Todas as mensagens recebidas acionam automaticamente os fluxos ativos do bot.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-dark-900 border border-white/10 max-w-md mx-auto flex items-center justify-around text-left">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Número Pareado</span>
                  <p className="text-sm font-bold text-white font-mono">{session.phone || 'Número Ativo'}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Nome do Perfil</span>
                  <p className="text-sm font-bold text-emerald-400">{session.name || 'WhatsApp Business'}</p>
                </div>
              </div>

              <div className="pt-2 flex justify-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => handleDisconnect('baileys')}
                  className="border-rose-500/30 text-rose-400 hover:bg-rose-500/10 text-xs py-2 px-4 rounded-xl flex items-center gap-2"
                >
                  <Power className="w-4 h-4" />
                  Desconectar / Trocar de Celular
                </Button>
                <Button
                  onClick={() => setActiveTab('test')}
                  className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs py-2 px-4 rounded-xl flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Testar Envio de Mensagem
                </Button>
              </div>
            </Card>
          ) : (
            <Card className="p-6 bg-dark-850 border-white/10 space-y-6">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <QrCode className="w-4 h-4 text-emerald-400" />
                  Conectar Aparelho pelo WhatsApp Business
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Não é necessário configurar nada na Meta. Basta escanear o QR Code abaixo com a câmera do seu celular em <strong>Aparelhos Conectados</strong>.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                {/* Visualizador do QR Code */}
                <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-dark-900 border border-white/10 text-center space-y-4">
                  {qrDataUrl ? (
                    <div className="relative group">
                      <div className="p-3 bg-white rounded-2xl shadow-2xl inline-block border-4 border-emerald-500/30 transition-transform group-hover:scale-[1.02]">
                        <img 
                          src={qrDataUrl} 
                          alt="QR Code WhatsApp Business" 
                          className="w-64 h-64 mx-auto object-contain rounded-lg"
                        />
                      </div>
                      <div className="absolute inset-x-0 bottom-6 flex justify-center pointer-events-none">
                        <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-dark-950/90 text-emerald-400 border border-emerald-500/40 shadow-lg backdrop-blur-sm flex items-center gap-1.5">
                          <Radio className="w-3 h-3 animate-pulse text-emerald-400" />
                          Aguardando leitura do celular...
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="w-64 h-64 rounded-2xl bg-dark-950 border border-white/10 flex flex-col items-center justify-center p-6 text-center space-y-3">
                      {isRefreshingQR || isConnecting ? (
                        <>
                          <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
                          <p className="text-xs text-slate-300 font-medium">Gerando novo QR Code...</p>
                        </>
                      ) : (
                        <>
                          <QrCode className="w-12 h-12 text-slate-600" />
                          <p className="text-xs text-slate-400">Clique abaixo para carregar o QR Code de pareamento.</p>
                        </>
                      )}
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-2 w-full max-w-xs">
                    <Button
                      onClick={() => handleGenerateQR(true)}
                      disabled={isRefreshingQR}
                      className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs py-2.5 rounded-xl shadow-glow-primary flex items-center justify-center gap-2"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingQR ? 'animate-spin' : ''}`} />
                      {qrDataUrl ? 'Gerar Novo QR Code' : 'Gerar QR Code'}
                    </Button>
                  </div>
                </div>

                {/* Passo a Passo de Conexão no Celular */}
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-start gap-3">
                    <Sparkles className="w-5 h-5 flex-shrink-0 text-emerald-400 mt-0.5" />
                    <div>
                      <strong className="text-white block font-bold mb-0.5">Conexão Instantânea e Descomplicada</strong>
                      Utiliza o mesmo método do WhatsApp Web. Seu número continua com todos os contatos e conversas normais.
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <Layers className="w-4 h-4 text-emerald-400" />
                      Como escanear no seu celular:
                    </h4>

                    <ol className="space-y-3 text-xs text-slate-300">
                      <li className="flex items-start gap-3 p-3 rounded-xl bg-dark-900 border border-white/5">
                        <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center flex-shrink-0">1</span>
                        <span>Abra o aplicativo <strong>WhatsApp Business</strong> no celular da loja.</span>
                      </li>
                      <li className="flex items-start gap-3 p-3 rounded-xl bg-dark-900 border border-white/5">
                        <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center flex-shrink-0">2</span>
                        <span>Toque nos <strong>três pontinhos (⋮)</strong> no canto superior direito (Android) ou em <strong>Configurações</strong> (iPhone).</span>
                      </li>
                      <li className="flex items-start gap-3 p-3 rounded-xl bg-dark-900 border border-white/5">
                        <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center flex-shrink-0">3</span>
                        <span>Selecione <strong>Aparelhos Conectados</strong> e toque no botão <strong>Conectar um aparelho</strong>.</span>
                      </li>
                      <li className="flex items-start gap-3 p-3 rounded-xl bg-dark-900 border border-white/5">
                        <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center flex-shrink-0">4</span>
                        <span>Aponte a câmera para o QR Code ao lado. A conexão será confirmada automaticamente!</span>
                      </li>
                    </ol>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 2: CREDENCIAIS META CLOUD API */}
      {/* ========================================================================= */}
      {activeTab === 'credentials' && (
        <Card className="p-6 bg-dark-850 border-white/10 space-y-6">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-400" />
              Configurar Chaves da Meta WhatsApp Cloud API
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Insira o Token de Acesso permanente e os IDs gerados no portal <strong>developers.facebook.com</strong>.
            </p>
          </div>

          <form onSubmit={handleSaveMeta} className="space-y-4">
            {/* Access Token */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>Access Token (Token de Acesso da Meta) *</span>
                <span className="text-[11px] text-slate-500 font-normal">
                  (System User Token permanente ou temporário de teste)
                </span>
              </label>
              <div className="relative">
                <input
                  type={showToken ? 'text' : 'password'}
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                  placeholder="EAAOhEL8WlWM..."
                  className="w-full bg-dark-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 pr-10 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                >
                  {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-500">
                Se já configurado anteriormente, deixe em branco para manter o token existente.
              </p>
            </div>

            {/* Phone Number ID & WABA ID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Phone Number ID (Identificador do Telefone) *
                </label>
                <input
                  type="text"
                  value={phoneNumberId}
                  onChange={(e) => setPhoneNumberId(e.target.value)}
                  placeholder="Ex: 1384810418038901"
                  className="w-full bg-dark-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-mono"
                  required
                />
                <p className="text-[11px] text-slate-500">Encontrado na página "Começar / Introdução" do WhatsApp no Meta Developers.</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  WhatsApp Business Account ID (WABA ID)
                </label>
                <input
                  type="text"
                  value={wabaId}
                  onChange={(e) => setWabaId(e.target.value)}
                  placeholder="Ex: 2595629594210377"
                  className="w-full bg-dark-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-mono"
                />
                <p className="text-[11px] text-slate-500">Identificador da sua conta comercial do WhatsApp Business.</p>
              </div>
            </div>

            {/* Verify Token */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Token de Verificação do Webhook (Verify Token)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={verifyToken}
                  onChange={(e) => setVerifyToken(e.target.value)}
                  placeholder="M4l@qu14s"
                  className="flex-1 bg-dark-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-mono"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(verifyToken, 'Verify Token')}
                  className="border-white/10 text-slate-300 text-xs flex items-center gap-1"
                >
                  {copiedField === 'Verify Token' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  Copiar
                </Button>
              </div>
              <p className="text-[11px] text-slate-500">
                Este token deve ser exatamente o mesmo preenchido no painel de Webhooks da Meta.
              </p>
            </div>

            {/* Ações */}
            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <Button
                type="submit"
                disabled={isSaving}
                className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs py-2.5 px-5 rounded-xl shadow-glow-primary flex items-center justify-center gap-2"
              >
                {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Salvar Credenciais da Meta
              </Button>

              <Button
                type="button"
                variant="outline"
                disabled={isTestingConn}
                onClick={handleTestConnection}
                className="border-white/10 text-slate-200 hover:bg-white/5 text-xs py-2.5 px-5 rounded-xl flex items-center justify-center gap-2"
              >
                {isTestingConn ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 text-emerald-400" />}
                Testar Conexão com a Graph API
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* ABA 3: WEBHOOK & INSTRUÇÕES DA META */}
      {/* ========================================================================= */}
      {activeTab === 'webhook' && (
        <Card className="p-6 bg-dark-850 border-white/10 space-y-6">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-400" />
              Configurar Webhook no Meta for Developers
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Copie os dados abaixo e cole na configuração de Webhooks do WhatsApp dentro do portal da Meta.
            </p>
          </div>

          <div className="space-y-4">
            {/* Callback URL */}
            <div className="p-4 rounded-xl bg-dark-900 border border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Callback URL (URL do Webhook):</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  HTTPS Ativo
                </span>
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 p-2.5 rounded-lg bg-dark-950 border border-white/10 text-xs font-mono text-emerald-400 select-all overflow-x-auto">
                  {webhookUrl}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(webhookUrl, 'URL do Webhook')}
                  className="border-white/10 text-slate-300 text-xs flex items-center gap-1.5"
                >
                  {copiedField === 'URL do Webhook' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  Copiar URL
                </Button>
              </div>
            </div>

            {/* Verify Token */}
            <div className="p-4 rounded-xl bg-dark-900 border border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Token de Verificação (Verify Token):</span>
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 p-2.5 rounded-lg bg-dark-950 border border-white/10 text-xs font-mono text-blue-400 select-all">
                  {verifyToken}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(verifyToken, 'Token de Verificação')}
                  className="border-white/10 text-slate-300 text-xs flex items-center gap-1.5"
                >
                  {copiedField === 'Token de Verificação' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  Copiar Token
                </Button>
              </div>
            </div>

            {/* Passo a Passo Ilustrado */}
            <div className="p-5 rounded-2xl bg-dark-900/80 border border-white/10 space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-400" />
                Passo a Passo de Configuração na Meta:
              </h4>
              <ol className="text-xs text-slate-300 space-y-2.5 list-decimal list-inside leading-relaxed">
                <li>
                  Acesse o painel do <a href="https://developers.facebook.com/apps" target="_blank" rel="noreferrer" className="text-emerald-400 hover:underline inline-flex items-center gap-1">Meta for Developers <ExternalLink className="w-3 h-3" /></a> e selecione seu App.
                </li>
                <li>
                  No menu lateral esquerdo, vá em <strong>WhatsApp &gt; Configuração</strong>.
                </li>
                <li>
                  Localize a seção <strong>Webhook</strong> e clique no botão <strong>Editar</strong>.
                </li>
                <li>
                  Cole a <strong>Callback URL</strong> e o <strong>Verify Token</strong> copiados acima e clique em <strong>Verificar e Salvar</strong>.
                </li>
                <li>
                  Na tabela de <strong>Campos do Webhook</strong>, clique em <strong>Gerenciar</strong> e ative a caixa de seleção do campo <code className="text-emerald-400 bg-dark-950 px-1.5 py-0.5 rounded">messages</code>.
                </li>
              </ol>
            </div>
          </div>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* ABA 4: TESTE DE DISPARO */}
      {/* ========================================================================= */}
      {activeTab === 'test' && (
        <Card className="p-6 bg-dark-850 border-white/10 space-y-6">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Send className="w-4 h-4 text-emerald-400" />
              Disparar Mensagem de Teste no WhatsApp
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Envie uma mensagem real para validar a entrega instantânea no seu celular (utiliza a conexão ativa: QR Code ou Meta API).
            </p>
          </div>

          <form onSubmit={handleSendTestMessage} className="space-y-4 max-w-md">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Número do WhatsApp com DDD (apenas números):
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  placeholder="81996138924"
                  className="w-full bg-dark-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-mono"
                  required
                />
              </div>
              <p className="text-[11px] text-slate-500">
                Exemplo: 81996138924 (o sistema formata automaticamente para +55 81 99613-8924).
              </p>
            </div>

            <Button
              type="submit"
              disabled={isSendingTest || !isConnected}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs py-3 rounded-xl shadow-glow-primary flex items-center justify-center gap-2"
            >
              {isSendingTest ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {isConnected ? 'Enviar Mensagem de Teste Agora' : 'Conecte o WhatsApp para Habilitar Teste'}
            </Button>
          </form>
        </Card>
      )}

      {/* Card de Informações Comparativas */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-950/20 to-purple-950/20 border border-white/10 flex items-start gap-4">
        <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 mt-0.5">
          <Info className="w-5 h-5" />
        </div>
        <div className="space-y-1 text-xs leading-relaxed text-slate-300">
          <h4 className="font-bold text-white">Qual método devo usar?</h4>
          <p>
            • <strong>📱 QR Code (WhatsApp Business):</strong> Método mais rápido e prático. Só apontar a câmera do celular em Aparelhos Conectados e o bot começa a responder imediatamente.<br />
            • <strong>🌐 Meta Cloud API Oficial:</strong> Método 100% em nuvem sem necessidade de celular ligado ou bateria, ideal para altos volumes com token oficial do Facebook Developers.
          </p>
        </div>
      </div>
    </div>
  );
};
