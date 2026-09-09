import React, { useState, useEffect } from 'react';
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
  MessageSquare
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
    backendUrl, 
    disconnect, 
    refreshStatus, 
    saveMetaConfig,
    testMetaConnection,
    sendTestMessage
  } = useWhatsApp();

  const { success, warning, error: toastError, info } = useToast();

  // Estados do formulário de credenciais da Meta
  const [accessToken, setAccessToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [phoneNumberId, setPhoneNumberId] = useState(session.phone_number_id || '');
  const [wabaId, setWabaId] = useState(session.waba_id || '');
  const [verifyToken, setVerifyToken] = useState(session.verify_token || 'pitoco_meta_token_2026');
  
  const [isSaving, setIsSaving] = useState(false);
  const [isTestingConn, setIsTestingConn] = useState(false);
  const [activeTab, setActiveTab] = useState<'credentials' | 'webhook' | 'test'>('credentials');

  // Teste de disparo
  const [testPhone, setTestPhone] = useState('81996138924');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

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
        verifyToken: verifyToken.trim() || 'pitoco_meta_token_2026',
      };
      if (accessToken.trim()) {
        payload.accessToken = accessToken.trim();
      }

      const res = await saveMetaConfig(payload);
      if (res.success) {
        success('Configuração da Meta Cloud API salva com sucesso!');
        // Testar conexão automaticamente após salvar
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
    if (!testPhone.trim()) return;

    setIsSendingTest(true);
    try {
      const res = await sendTestMessage(testPhone.trim());
      if (res.success) {
        success('Mensagem oficial da Meta Cloud API enviada com sucesso!');
      }
    } catch (err: any) {
      toastError('Erro no envio', err?.message);
    } finally {
      setIsSendingTest(false);
    }
  };

  const webhookUrl = `${OFFICIAL_DISCLOUD_URL}/api/webhook`;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Banner Principal de Status Oficial da Meta */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-dark-900 via-dark-850 to-emerald-950/40 border border-emerald-500/20 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border shadow-lg ${
            isConnected
              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-emerald-500/10'
              : 'bg-dark-800 text-slate-400 border-white/10'
          }`}>
            <ShieldCheck className={`w-8 h-8 ${isConnected ? 'text-emerald-400' : 'text-slate-400'}`} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                Meta WhatsApp Business Platform
              </h2>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                isConnected
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              }`}>
                {isConnected ? 'API Oficial Ativa' : 'Aguardando Credenciais'}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-blue-400" /> Cloud API v20.0
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1.5 flex items-center gap-2">
              {isConnected ? (
                <>
                  <span className="text-emerald-400 font-semibold">Conta Verificada:</span> {session.name || 'Pitoco de Gente'} • 
                  <span className="text-slate-400 font-mono">{session.phone || '81996138924'}</span>
                </>
              ) : (
                'Conecte a API Oficial da Meta para garantir 100% de estabilidade e imunidade a banimentos.'
              )}
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
              disabled={isTestingConn}
              onClick={handleTestConnection}
              className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs w-full md:w-auto shadow-glow-primary"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isTestingConn ? 'animate-spin' : ''}`} />
              Verificar Conexão
            </Button>
          )}
        </div>
      </div>

      {/* Indicadores de Qualidade e Segurança da Meta */}
      {isConnected && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-dark-850 border border-white/10 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Qualidade da Conta</span>
              <p className="text-sm font-bold text-emerald-400">
                {session.quality_rating === 'GREEN' ? 'Alta (Excelente)' : session.quality_rating || 'Qualidade Alta'}
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-dark-850 border border-white/10 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Limite de Mensagens</span>
              <p className="text-sm font-bold text-white">
                {session.messaging_limit === 'TIER_1K' ? '1.000 clientes / 24h' : session.messaging_limit || 'Padrão Oficial'}
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-dark-850 border border-white/10 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Proteção Anti-Ban</span>
              <p className="text-sm font-bold text-purple-300">100% Blindado (Oficial)</p>
            </div>
          </div>
        </div>
      )}

      {/* Navegação por Abas */}
      <div className="flex border-b border-white/10 gap-2">
        <button
          onClick={() => setActiveTab('credentials')}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'credentials'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Key className="w-4 h-4" />
          Credenciais da Meta
        </button>

        <button
          onClick={() => setActiveTab('webhook')}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'webhook'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Globe className="w-4 h-4" />
          Webhook & Integração Meta
        </button>

        <button
          onClick={() => setActiveTab('test')}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'test'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Send className="w-4 h-4" />
          Teste de Envio Oficial
        </button>
      </div>

      {/* ABA 1: CREDENCIAIS */}
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
                  placeholder={session.provider === 'meta_cloud_api' ? '••••••••••••••••••••••••••••••••••••••••••••••••' : 'EAAG...'}
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
                  placeholder="Ex: 109876543210987"
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
                  placeholder="Ex: 987654321098765"
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
                  placeholder="pitoco_meta_token_2026"
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

      {/* ABA 2: WEBHOOK & INSTRUÇÕES DA META */}
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

      {/* ABA 3: TESTE DE DISPARO */}
      {activeTab === 'test' && (
        <Card className="p-6 bg-dark-850 border-white/10 space-y-6">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Send className="w-4 h-4 text-emerald-400" />
              Disparar Mensagem de Teste Oficial
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Envie uma mensagem real utilizando a API oficial da Meta para validar a entrega instantânea no seu celular.
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
              {isConnected ? 'Enviar Mensagem de Teste Oficial' : 'Configure a Meta para Habilitar Teste'}
            </Button>
          </form>
        </Card>
      )}

      {/* Card de Vantagens da Meta Cloud API */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-950/20 to-purple-950/20 border border-white/10 flex items-start gap-4">
        <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 mt-0.5">
          <Info className="w-5 h-5" />
        </div>
        <div className="space-y-1 text-xs leading-relaxed text-slate-300">
          <h4 className="font-bold text-white">Por que a Meta WhatsApp Cloud API é a melhor escolha?</h4>
          <p>
            • <strong>Zero risco de banimento:</strong> Trata-se da API oficial autorizada pelo WhatsApp/Meta.<br />
            • <strong>Totalmente na nuvem:</strong> Não depende de aparelho celular ligado à tomada ou conexão Wi-Fi.<br />
            • <strong>Botões e Listas Interativas:</strong> Envia opções clicáveis nativas sem quebrar formatação.<br />
            • <strong>Atendimento Humano em Tempo Real:</strong> Suas consultoras e o robô operam simultaneamente com rapidez.
          </p>
        </div>
      </div>
    </div>
  );
};
