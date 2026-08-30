import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  Bot, 
  Building2, 
  QrCode, 
  Smartphone, 
  CheckCircle2, 
  Save, 
  Sparkles, 
  Phone, 
  Mail, 
  Clock, 
  Globe, 
  Code2, 
  Image as ImageIcon,
  Check,
  Unplug,
  BatteryCharging,
  Wifi,
  ShieldCheck,
  AlertTriangle,
  Copy
} from 'lucide-react';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input, Textarea } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Tabs } from '../../components/ui/Tabs';
import { QRCodeView } from '../../components/ui/QRCodeView';
import { useToast } from '../../contexts/ToastContext';
import { useWhatsApp } from '../../contexts/WhatsAppContext';
import { StorageService } from '../../lib/storage';
import { BotProfile, BotGender, BotTone } from '../../types';
import { defaultBotProfile } from '../../lib/mockData';
import { formatPhone, formatDate } from '../../lib/utils';

// Preset avatar options
const AVATAR_PRESETS = [
  {
    gender: 'female',
    name: 'Sofia (Feminino)',
    url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
  },
  {
    gender: 'female',
    name: 'Camila (Feminino)',
    url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80',
  },
  {
    gender: 'male',
    name: 'Lucas (Masculino)',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
  },
  {
    gender: 'male',
    name: 'Gabriel (Masculino)',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
  },
  {
    gender: 'neutral',
    name: 'Robô Cyber (Neutro)',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80',
  },
  {
    gender: 'neutral',
    name: '7 Assistente Ícone',
    url: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=200&auto=format&fit=crop&q=80',
  },
];

export const SettingsPage: React.FC = () => {
  const { success, error: toastError } = useToast();
  const { 
    session, 
    isConnected, 
    isConnecting, 
    rawQR, 
    qrDataUrl, 
    backendUrl,
    generateQRCode, 
    requestPairingCode,
    connectDevice, 
    disconnect,
    setCustomBackendUrl,
    refreshStatus
  } = useWhatsApp();

  const [activeTab, setActiveTab] = useState<string>('whatsapp_qr');
  const [isSaving, setIsSaving] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [customServerInput, setCustomServerInput] = useState(backendUrl || '');
  const [isTestingServer, setIsTestingServer] = useState(false);

  // Bot Profile form state
  const [botName, setBotName] = useState(defaultBotProfile.name);
  const [companyName, setCompanyName] = useState(defaultBotProfile.company_name);
  const [gender, setGender] = useState<BotGender>(defaultBotProfile.gender);
  const [tone, setTone] = useState<BotTone>(defaultBotProfile.tone);
  const [avatarUrl, setAvatarUrl] = useState(defaultBotProfile.avatar_url);
  const [companySegment, setCompanySegment] = useState(defaultBotProfile.company_segment || '');
  const [supportEmail, setSupportEmail] = useState(defaultBotProfile.support_email || '');
  const [supportPhone, setSupportPhone] = useState(defaultBotProfile.support_phone || '');
  const [businessHours, setBusinessHours] = useState(defaultBotProfile.business_hours || '');
  const [websiteUrl, setWebsiteUrl] = useState(defaultBotProfile.website_url || '');
  const [welcomeMessage, setWelcomeMessage] = useState(defaultBotProfile.welcome_message || '');

  useEffect(() => {
    async function loadSettings() {
      const data = await StorageService.getSettings();
      if (data.bot_profile) {
        const bp = data.bot_profile;
        setBotName(bp.name || defaultBotProfile.name);
        setCompanyName(bp.company_name || defaultBotProfile.company_name);
        setGender(bp.gender || 'female');
        setTone(bp.tone || 'friendly');
        setAvatarUrl(bp.avatar_url || defaultBotProfile.avatar_url);
        setCompanySegment(bp.company_segment || '');
        setSupportEmail(bp.support_email || '');
        setSupportPhone(bp.support_phone || '');
        setBusinessHours(bp.business_hours || '');
        setWebsiteUrl(bp.website_url || '');
        setWelcomeMessage(bp.welcome_message || '');
      }
    }
    loadSettings();
  }, []);

  const handleRefreshQR = async () => {
    await generateQRCode();
  };

  const handleConnectSimulated = async () => {
    await connectDevice(supportPhone || '81996138924', `${botName} (${companyName})`);
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    success('Copiado!', `Tag ${label} copiada.`);
    setTimeout(() => setCopiedField(null), 2500);
  };

  const handleSaveBotProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const botProfileData: BotProfile = {
        name: botName.trim(),
        company_name: companyName.trim(),
        gender,
        tone,
        avatar_url: avatarUrl.trim(),
        company_segment: companySegment.trim(),
        support_email: supportEmail.trim(),
        support_phone: supportPhone.trim(),
        business_hours: businessHours.trim(),
        website_url: websiteUrl.trim(),
        welcome_message: welcomeMessage.trim(),
      };

      await StorageService.updateBotProfile(botProfileData);
      success('Perfil do Bot Salvo', 'As informações e variáveis foram atualizadas.');
    } catch (err: any) {
      toastError('Erro ao salvar', err.message || 'Falha ao gravar configurações.');
    } finally {
      setIsSaving(false);
    }
  };

  // Variables list for quick copy
  const botVariablesList = [
    { key: '{{bot_nome}}', label: 'Nome do Bot', value: botName, desc: 'Nome configurado do assistente virtual' },
    { key: '{{empresa}}', label: 'Nome da Empresa', value: companyName, desc: 'Razão social ou nome fantasia da empresa' },
    { key: '{{bot_genero}}', label: 'Gênero do Bot', value: gender === 'female' ? 'Feminino' : gender === 'male' ? 'Masculino' : 'Neutro', desc: 'Identidade de gênero para concordância verbal' },
    { key: '{{bot_tom}}', label: 'Tom de Voz', value: tone, desc: 'Diretriz de estilo de comunicação' },
    { key: '{{suporte_email}}', label: 'E-mail de Suporte', value: supportEmail, desc: 'E-mail oficial para contato de clientes' },
    { key: '{{suporte_telefone}}', label: 'Telefone de Suporte', value: supportPhone, desc: 'Telefone / WhatsApp de atendimento' },
    { key: '{{horario_atendimento}}', label: 'Horário de Atendimento', value: businessHours, desc: 'Horário comercial da empresa' },
    { key: '{{site_empresa}}', label: 'Site da Empresa', value: websiteUrl, desc: 'Link do portal ou landing page' },
    { key: '{{ramo_empresa}}', label: 'Segmento de Atuação', value: companySegment, desc: 'Ramo de negócio da empresa' },
    { key: '{{mensagem_boas_vindas}}', label: 'Mensagem Inicial', value: welcomeMessage, desc: 'Saudação padrão do bot' },
  ];

  return (
    <div className="space-y-8 max-w-6xl mx-auto animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-display font-bold text-white tracking-tight flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-primary-400" />
            Configurações da Plataforma
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Conecte seu WhatsApp por QR Code, configure o assistente e gerencie variáveis dos fluxos.
          </p>
        </div>

        <Badge variant={isConnected ? 'brand' : 'danger'} dot>
          {isConnected ? 'WhatsApp Conectado' : 'WhatsApp Desconectado'}
        </Badge>
      </div>

      {/* Tabs Navigation */}
      <Tabs
        tabs={[
          { 
            id: 'whatsapp_qr', 
            label: 'Conexão WhatsApp (QR Code)', 
            icon: <QrCode className="w-4 h-4" />,
            badge: isConnected ? 'Conectado' : 'Desconectado'
          },
          { id: 'bot_profile', label: 'Identidade & Perfil do Bot', icon: <Bot className="w-4 h-4" /> },
          { id: 'bot_variables', label: 'Variáveis nos Fluxos', icon: <Code2 className="w-4 h-4" />, badge: botVariablesList.length },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* TAB 1: WhatsApp QR Code Connection */}
      {activeTab === 'whatsapp_qr' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main QR Card / Status */}
          <div className="lg:col-span-7 space-y-6">
            <Card className="relative overflow-hidden">
              <CardHeader>
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
                      isConnected
                        ? 'bg-brand-500/20 text-brand-400 border-brand-500/30'
                        : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                    }`}
                  >
                    {isConnected ? <CheckCircle2 className="w-5 h-5" /> : <QrCode className="w-5 h-5" />}
                  </div>
                  <div>
                    <CardTitle className="text-base">
                      {isConnected ? 'WhatsApp Conectado com Sucesso' : 'Escanear QR Code do WhatsApp'}
                    </CardTitle>
                    <p className="text-xs text-slate-400">
                      {isConnected
                        ? 'Sua sessão está ativa e processando fluxos em tempo real'
                        : 'Aponte a câmera do seu WhatsApp para conectar seu aparelho'}
                    </p>
                  </div>
                </div>
              </CardHeader>

              {/* Connected State View */}
              {isConnected ? (
                <div className="p-6 rounded-2xl bg-gradient-to-b from-dark-850 to-dark-900 border border-brand-500/30 space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-brand-950/40 border border-brand-800/40">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-brand-500/20 border-2 border-brand-500 flex items-center justify-center text-brand-300">
                        <Smartphone className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white">
                            {session.name || 'Aparelho Principal'}
                          </h4>
                          <Badge variant="brand" dot>Ativo</Badge>
                        </div>
                        <p className="text-xs font-mono text-brand-300 mt-0.5">
                          {session.phone ? formatPhone(session.phone) : '+55 (81) 99613-8924'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-400">
                      <div className="flex items-center gap-1.5" title="Nível de bateria do aparelho">
                        <BatteryCharging className="w-4 h-4 text-brand-400" />
                        <span>{session.batteryLevel || 95}%</span>
                      </div>
                      <div className="flex items-center gap-1.5" title="Qualidade do sinal">
                        <Wifi className="w-4 h-4 text-brand-400" />
                        <span>Excelente</span>
                      </div>
                    </div>
                  </div>

                  {/* Session Metrics */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-dark-950 border border-slate-800 space-y-1">
                      <span className="text-slate-500 block text-[10px]">Status da Sessão</span>
                      <strong className="text-brand-400 font-semibold block">Conectado (Online)</strong>
                    </div>
                    <div className="p-3 rounded-xl bg-dark-950 border border-slate-800 space-y-1">
                      <span className="text-slate-500 block text-[10px]">Conectado desde</span>
                      <strong className="text-slate-200 font-semibold block">
                        {session.connectedAt ? formatDate(session.connectedAt) : 'Hoje'}
                      </strong>
                    </div>
                    <div className="p-3 rounded-xl bg-dark-950 border border-slate-800 space-y-1 col-span-2 sm:col-span-1">
                      <span className="text-slate-500 block text-[10px]">Permissões</span>
                      <strong className="text-slate-200 font-semibold block">Envio & Recepção</strong>
                    </div>
                  </div>

                  {/* Disconnect Action */}
                  <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                    <span className="text-xs text-slate-400">Deseja desconectar este número?</span>
                    <Button
                      variant="danger"
                      size="sm"
                      leftIcon={<Unplug className="w-4 h-4" />}
                      onClick={disconnect}
                    >
                      Desconectar WhatsApp
                    </Button>
                  </div>
                </div>
              ) : (
                /* Disconnected / QR Code View */
                <div className="space-y-4">
                  <QRCodeView
                    value={rawQR || ''}
                    qrDataUrl={qrDataUrl}
                    onRefresh={handleRefreshQR}
                    onRequestPairingCode={requestPairingCode}
                    onConnect={(customPhone) =>
                      connectDevice(
                        customPhone || supportPhone || '81996138924',
                        `${botName} (${companyName})`
                      )
                    }
                    adminPhone={supportPhone || '81996138924'}
                    isLoading={isConnecting}
                  />
                </div>
              )}
            </Card>

            {/* Backend Server Configuration Card */}
            <Card className="border-slate-800 bg-dark-900">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Code2 className="w-4 h-4 text-emerald-400" />
                    <CardTitle className="text-sm">Endereço do Servidor do Bot (Backend)</CardTitle>
                  </div>
                  <Badge variant={rawQR || isConnected ? 'brand' : 'neutral'} dot>
                    {isConnected ? 'Conectado' : rawQR ? 'Online (Aguardando Pareamento)' : 'Local / Nuvem'}
                  </Badge>
                </div>
                <p className="text-xs text-slate-400">
                  Configure a URL onde o seu bot Baileys está rodando (Discloud, servidor próprio ou localhost).
                </p>
              </CardHeader>

              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={customServerInput}
                    onChange={(e) => setCustomServerInput(e.target.value)}
                    placeholder="http://localhost:3001 ou https://7assistente.discloud.app"
                    className="flex-1 rounded-xl bg-dark-950 border border-slate-700/60 px-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <Button
                    size="sm"
                    variant="brand"
                    onClick={async () => {
                      setIsTestingServer(true);
                      await setCustomBackendUrl(customServerInput);
                      setIsTestingServer(false);
                    }}
                    isLoading={isTestingServer}
                  >
                    Salvar & Testar
                  </Button>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  💡 Quando hospedado no Discloud, preencha com a URL do seu bot. Em execução local no seu computador, o sistema usa automaticamente <code className="text-emerald-400 font-mono">http://localhost:3001</code>.
                </p>
              </div>
            </Card>
          </div>

          {/* Connection Instructions (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <Card className="border-primary-500/20 bg-dark-900">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-primary-400" />
                  <CardTitle className="text-sm">Passo a Passo para Conectar</CardTitle>
                </div>
              </CardHeader>

              <div className="space-y-4 text-xs text-slate-300">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-dark-850 border border-slate-800">
                  <div className="w-6 h-6 rounded-full bg-primary-600/30 text-primary-300 font-bold flex items-center justify-center flex-shrink-0 text-xs">
                    1
                  </div>
                  <p className="leading-relaxed">
                    Abra o <strong>WhatsApp</strong> no seu smartphone (Android ou iPhone).
                  </p>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-dark-850 border border-slate-800">
                  <div className="w-6 h-6 rounded-full bg-primary-600/30 text-primary-300 font-bold flex items-center justify-center flex-shrink-0 text-xs">
                    2
                  </div>
                  <p className="leading-relaxed">
                    Toque em <strong>Configurações</strong> (ou <strong>3 pontinhos</strong>) &gt; <strong>Aparelhos Conectados</strong>.
                  </p>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-dark-850 border border-slate-800">
                  <div className="w-6 h-6 rounded-full bg-primary-600/30 text-primary-300 font-bold flex items-center justify-center flex-shrink-0 text-xs">
                    3
                  </div>
                  <p className="leading-relaxed">
                    Toque em <strong>Conectar um Aparelho</strong> e aponte a câmera para o <strong>QR Code</strong> ao lado, ou use a aba <strong>Código de Pareamento</strong> digitando seu número.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-primary-950/40 border border-primary-800/40 flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-primary-400 flex-shrink-0 mt-0.5" />
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    A conexão é segura e criptografada de ponta a ponta oficial do Baileys / WhatsApp.
                  </p>
                </div>
              </div>
            </Card>

            {/* Lock Notice */}
            {!isConnected && (
              <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-800/40 space-y-2">
                <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Funcionalidades Bloqueadas enquanto desconectado:</span>
                </div>
                <ul className="text-[11px] text-slate-300 space-y-1 list-disc list-inside">
                  <li>Envio e recebimento de mensagens na tela de Conversas.</li>
                  <li>Publicação e execução de fluxos automáticos ao vivo.</li>
                  <li>Disparo de mensagens dos robôs para clientes.</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: Bot Profile & Identity */}
      {activeTab === 'bot_profile' && (
        <form onSubmit={handleSaveBotProfile} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Form (2 cols) */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-primary-600/20 border border-primary-500/30 flex items-center justify-center text-primary-400">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Identidade do Assistente Virtual</CardTitle>
                      <p className="text-xs text-slate-400">Defina o nome, gênero e tom de comunicação do robô</p>
                    </div>
                  </div>
                </CardHeader>

                <div className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Nome do Bot"
                      placeholder="Ex: Sofia, Lucas, Max"
                      value={botName}
                      onChange={(e) => setBotName(e.target.value)}
                      hint="Nome pelo qual o bot se apresentará aos clientes."
                      required
                    />

                    <Input
                      label="Nome da Empresa"
                      placeholder="Ex: 7 Assistente Tech"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      hint="Nome da sua marca ou organização."
                      required
                    />
                  </div>

                  {/* Gender Selector */}
                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-slate-300">
                      Gênero do Bot (para concordância e persona)
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { id: 'female', label: 'Mulher (Feminino)', desc: 'Assistente consultora' },
                        { id: 'male', label: 'Homem (Masculino)', desc: 'Assistente consultor' },
                        { id: 'neutral', label: 'Neutro / Robô', desc: 'Assistente institucional' },
                      ].map((g) => (
                        <div
                          key={g.id}
                          onClick={() => setGender(g.id as BotGender)}
                          className={`p-3 rounded-xl border cursor-pointer transition-all text-center space-y-1 ${
                            gender === g.id
                              ? 'bg-primary-600/15 border-primary-500 text-white shadow-lg shadow-primary-500/10'
                              : 'bg-dark-850 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                          }`}
                        >
                          <span className="text-xs font-bold block">{g.label}</span>
                          <span className="text-[10px] text-slate-500 block">{g.desc}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tone of Voice */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-slate-300">Tom de Voz & Personalidade</label>
                    <select
                      value={tone}
                      onChange={(e) => setTone(e.target.value as BotTone)}
                      className="w-full rounded-xl bg-dark-850 border border-slate-700/60 px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="friendly">Amigável & Empático (Recomendado para WhatsApp)</option>
                      <option value="formal">Formal & Corporativo</option>
                      <option value="casual">Descontraído & Moderno</option>
                      <option value="technical">Técnico & Direto</option>
                    </select>
                  </div>

                  {/* Avatar Selector */}
                  <div className="space-y-3">
                    <label className="block text-xs font-medium text-slate-300">
                      Foto de Perfil do Bot (Avatar)
                    </label>
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
                      {AVATAR_PRESETS.map((preset, idx) => (
                        <div
                          key={idx}
                          onClick={() => setAvatarUrl(preset.url)}
                          className={`relative rounded-xl p-1 border cursor-pointer flex-shrink-0 transition-all ${
                            avatarUrl === preset.url
                              ? 'border-primary-500 bg-primary-500/20 scale-105 shadow-glow-primary'
                              : 'border-slate-800 hover:border-slate-700 bg-dark-850'
                          }`}
                          title={preset.name}
                        >
                          <img
                            src={preset.url}
                            alt={preset.name}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                          {avatarUrl === preset.url && (
                            <div className="absolute top-1 right-1 bg-primary-600 rounded-full p-0.5 text-white">
                              <Check className="w-3 h-3" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    <Input
                      label="Ou insira a URL direta da foto/avatar"
                      placeholder="https://suaempresa.com/avatar.jpg"
                      value={avatarUrl}
                      onChange={(e) => setAvatarUrl(e.target.value)}
                      leftIcon={<ImageIcon className="w-4 h-4" />}
                    />
                  </div>
                </div>
              </Card>

              {/* Company & Support Information */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-brand-400">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Informações da Empresa & Atendimento</CardTitle>
                      <p className="text-xs text-slate-400">Substituídas automaticamente nas mensagens e nós dos fluxos</p>
                    </div>
                  </div>
                </CardHeader>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Segmento de Atuação"
                      placeholder="Ex: SaaS, E-commerce, Advocacia"
                      value={companySegment}
                      onChange={(e) => setCompanySegment(e.target.value)}
                    />

                    <Input
                      label="Horário de Atendimento"
                      placeholder="Ex: Segunda a Sexta, 08h às 18h"
                      value={businessHours}
                      onChange={(e) => setBusinessHours(e.target.value)}
                      leftIcon={<Clock className="w-4 h-4" />}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="E-mail de Suporte"
                      type="email"
                      placeholder="contato@empresa.com"
                      value={supportEmail}
                      onChange={(e) => setSupportEmail(e.target.value)}
                      leftIcon={<Mail className="w-4 h-4" />}
                    />

                    <Input
                      label="Telefone / WhatsApp Oficial"
                      placeholder="+55 (81) 99613-8924"
                      value={supportPhone}
                      onChange={(e) => setSupportPhone(e.target.value)}
                      leftIcon={<Phone className="w-4 h-4" />}
                    />
                  </div>

                  <Input
                    label="Site / Landing Page"
                    placeholder="https://minhaempresa.com.br"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    leftIcon={<Globe className="w-4 h-4" />}
                  />

                  <Textarea
                    label="Frase de Saudação Padrão"
                    placeholder="Olá! Sou a Sofia, assistente virtual da 7 Assistente. Como posso te ajudar hoje?"
                    value={welcomeMessage}
                    onChange={(e) => setWelcomeMessage(e.target.value)}
                    rows={3}
                  />
                </div>
              </Card>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  variant="brand"
                  size="lg"
                  isLoading={isSaving}
                  leftIcon={<Save className="w-4 h-4" />}
                >
                  Salvar Perfil do Bot
                </Button>
              </div>
            </div>

            {/* Right Preview Card (1 col) */}
            <div className="space-y-6">
              <Card className="sticky top-24 border-primary-500/30 bg-gradient-to-b from-dark-900 to-dark-850">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary-400" />
                    <CardTitle className="text-sm">Prévia no WhatsApp</CardTitle>
                  </div>
                </CardHeader>

                <div className="space-y-4">
                  {/* WhatsApp Contact Header Simulation */}
                  <div className="p-3.5 rounded-2xl bg-dark-950/80 border border-slate-800 flex items-center gap-3">
                    <div className="relative">
                      <img
                        src={avatarUrl || defaultBotProfile.avatar_url}
                        alt={botName}
                        className="w-12 h-12 rounded-full object-cover border-2 border-brand-500/60 shadow-lg"
                      />
                      <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-brand-500 rounded-full border-2 border-dark-950" />
                    </div>

                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                        {botName || 'Sofia'}
                        <Badge variant="brand" className="text-[9px] py-0 px-1">BOT</Badge>
                      </h4>
                      <p className="text-[11px] text-slate-400 truncate">{companyName || '7 Assistente'}</p>
                      <p className="text-[10px] text-brand-400">online no WhatsApp</p>
                    </div>
                  </div>

                  {/* Message Bubble Simulation */}
                  <div className="space-y-2">
                    <div className="bg-[#128C7E]/20 border border-[#128C7E]/30 rounded-2xl rounded-tl-none p-3.5 text-xs text-slate-100 shadow-md">
                      <p className="leading-relaxed whitespace-pre-wrap">
                        {welcomeMessage || `Olá! Sou a ${botName}, assistente da ${companyName}. Como posso te ajudar hoje?`}
                      </p>
                      <span className="block text-right text-[9px] text-emerald-300/60 mt-1">10:00 ✓✓</span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </form>
      )}

      {/* TAB 3: Bot Variables Available in Flows */}
      {activeTab === 'bot_variables' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <Code2 className="w-4 h-4" />
                </div>
                <div>
                  <CardTitle className="text-base">Variáveis Globais do Bot para os Fluxos</CardTitle>
                  <p className="text-xs text-slate-400">
                    Insira qualquer uma dessas variáveis nos nós dos fluxos para personalização dinâmica.
                  </p>
                </div>
              </div>
            </CardHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {botVariablesList.map((item) => (
                <div
                  key={item.key}
                  className="p-4 rounded-xl bg-dark-850 border border-slate-800 hover:border-primary-500/40 transition-all flex items-start justify-between gap-3 group"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-primary-300 bg-primary-950/80 px-2 py-0.5 rounded border border-primary-800/60">
                        {item.key}
                      </span>
                      <span className="text-xs font-semibold text-white truncate">{item.label}</span>
                    </div>
                    <p className="text-[11px] text-slate-400">{item.desc}</p>
                    <div className="text-[11px] text-brand-300 font-medium truncate pt-1">
                      Valor atual: <span className="text-slate-200">"{item.value || '(não definido)'}"</span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => handleCopy(item.key, item.label)}
                    leftIcon={copiedField === item.label ? <Check className="w-3.5 h-3.5 text-brand-400" /> : <Copy className="w-3.5 h-3.5" />}
                  >
                    {copiedField === item.label ? 'Copiado' : 'Copiar'}
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
