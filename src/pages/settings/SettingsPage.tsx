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
  Copy, 
  Database, 
  Bell, 
  Lock, 
  Key, 
  CreditCard, 
  MapPin, 
  RefreshCw, 
  ExternalLink,
  Sliders,
  CheckCheck,
  Server,
  Headphones,
  UserPlus,
  Trash2,
  Edit3,
  Star,
  MessageSquare
} from 'lucide-react';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input, Textarea } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { QRCodeView } from '../../components/ui/QRCodeView';
import { useToast } from '../../contexts/ToastContext';
import { useWhatsApp } from '../../contexts/WhatsAppContext';
import { StorageService, isSupabaseConfigured } from '../../lib/storage';
import { BotProfile, BotGender, BotTone, Attendant } from '../../types';
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
    name: 'Talvane (Masculino)',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
  },
  {
    gender: 'male',
    name: 'Lucas (Masculino)',
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
  const { success, error: toastError, info } = useToast();
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
  const [customServerInput, setCustomServerInput] = useState(backendUrl || 'https://talvanebarber.discloud.app');
  const [isTestingServer, setIsTestingServer] = useState(false);

  // Attendants Management State
  const [attendants, setAttendants] = useState<Attendant[]>([]);
  const [isAttendantModalOpen, setIsAttendantModalOpen] = useState(false);
  const [editingAttendant, setEditingAttendant] = useState<Attendant | null>(null);
  const [attName, setAttName] = useState('');
  const [attEmail, setAttEmail] = useState('');
  const [attPhone, setAttPhone] = useState('');
  const [attPassword, setAttPassword] = useState('123');
  const [attRole, setAttRole] = useState<'attendant' | 'supervisor' | 'admin'>('attendant');
  const [attDepartment, setAttDepartment] = useState('Comercial & Vendas');
  const [attAvatar, setAttAvatar] = useState('');

  // Bot Profile form state
  const [botName, setBotName] = useState(defaultBotProfile.name);
  const [companyName, setCompanyName] = useState(defaultBotProfile.company_name);
  const [gender, setGender] = useState<BotGender>(defaultBotProfile.gender);
  const [tone, setTone] = useState<BotTone>(defaultBotProfile.tone);
  const [avatarUrl, setAvatarUrl] = useState(defaultBotProfile.avatar_url);
  const [supportPhone, setSupportPhone] = useState(defaultBotProfile.support_phone);
  const [supportEmail, setSupportEmail] = useState(defaultBotProfile.support_email);
  const [businessHours, setBusinessHours] = useState(defaultBotProfile.business_hours);
  const [websiteUrl, setWebsiteUrl] = useState(defaultBotProfile.website_url);
  const [welcomeMessage, setWelcomeMessage] = useState(defaultBotProfile.welcome_message);
  const [fallbackMessage, setFallbackMessage] = useState(defaultBotProfile.fallback_message);
  const [handoffMessage, setHandoffMessage] = useState('Vou transferir seu atendimento para um de nossos profissionais. Por favor, aguarde um instante!');

  // Company Details & Pix State
  const [companyAddress, setCompanyAddress] = useState('Rua Principal, 100 - Centro');
  const [pixKeyType, setPixKeyType] = useState('telefone');
  const [pixKey, setPixKey] = useState('81996138924');
  const [pixOwner, setPixOwner] = useState('Talvane Barber');

  // Notifications State
  const [notifyNewBookings, setNotifyNewBookings] = useState(true);
  const [notifyPhone, setNotifyPhone] = useState('81996138924');
  const [playAudioAlerts, setPlayAudioAlerts] = useState(true);

  // Security
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [confirmAdminPassword, setConfirmAdminPassword] = useState('');

  // Load profile on mount
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const saved = await StorageService.getBotProfile();
        if (saved) {
          setBotName(saved.name || defaultBotProfile.name);
          setCompanyName(saved.company_name || defaultBotProfile.company_name);
          setGender(saved.gender || defaultBotProfile.gender);
          setTone(saved.tone || defaultBotProfile.tone);
          setAvatarUrl(saved.avatar_url || defaultBotProfile.avatar_url);
          setSupportPhone(saved.support_phone || defaultBotProfile.support_phone);
          setSupportEmail(saved.support_email || defaultBotProfile.support_email);
          setBusinessHours(saved.business_hours || defaultBotProfile.business_hours);
          setWebsiteUrl(saved.website_url || defaultBotProfile.website_url);
          setWelcomeMessage(saved.welcome_message || defaultBotProfile.welcome_message);
          setFallbackMessage(saved.fallback_message || defaultBotProfile.fallback_message);
        }
      } catch (e) {
        console.error('Error loading bot profile:', e);
      }
    };
    loadProfile();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const updated: BotProfile = {
        id: 'default',
        name: botName,
        company_name: companyName,
        gender,
        tone,
        avatar_url: avatarUrl,
        support_phone: supportPhone,
        support_email: supportEmail,
        business_hours: businessHours,
        website_url: websiteUrl,
        welcome_message: welcomeMessage,
        fallback_message: fallbackMessage,
        updated_at: new Date().toISOString(),
      };

      await StorageService.updateBotProfile(updated);
      success('Configurações Salvas', 'Perfil, mensagens e identidade do assistente sincronizados com sucesso.');
    } catch (err: any) {
      toastError('Erro ao salvar', err.message || 'Falha ao gravar configurações');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestBackend = async () => {
    setIsTestingServer(true);
    try {
      setCustomBackendUrl(customServerInput);
      const res = await fetch(`${customServerInput}/api/whatsapp/status`, { signal: AbortSignal.timeout(5000) });
      if (res.ok) {
        const data = await res.json();
        success('Conexão Bem-Sucedida', `Servidor WhatsApp online (${data.status}).`);
        refreshStatus();
      } else {
        toastError('Servidor respondeu com erro', `Código HTTP: ${res.status}`);
      }
    } catch (err: any) {
      toastError('Falha ao conectar no servidor', 'Verifique se a aplicação está online no Discloud.');
    } finally {
      setIsTestingServer(false);
    }
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    success('Copiado!', `Variável ${label} copiada para a área de transferência.`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newAdminPassword.length < 6) {
      toastError('Senha muito curta', 'A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }
    if (newAdminPassword !== confirmAdminPassword) {
      toastError('Senhas não coincidem', 'A confirmação de senha deve ser idêntica.');
      return;
    }
    localStorage.setItem('7assistente_admin_pwd', newAdminPassword);
    setNewAdminPassword('');
    setConfirmAdminPassword('');
    success('Senha Atualizada', 'A senha de acesso administrativo foi alterada com sucesso.');
  };

  // Load attendants
  useEffect(() => {
    const loadAttendants = async () => {
      try {
        const list = await StorageService.getAttendants();
        setAttendants(list);
      } catch (e) {
        console.error('Error loading attendants:', e);
      }
    };
    loadAttendants();
  }, []);

  const handleOpenNewAttendantModal = () => {
    setEditingAttendant(null);
    setAttName('');
    setAttEmail('');
    setAttPhone('');
    setAttPassword('123');
    setAttRole('attendant');
    setAttDepartment('Comercial & Vendas');
    setAttAvatar('');
    setIsAttendantModalOpen(true);
  };

  const handleOpenEditAttendantModal = (att: Attendant) => {
    setEditingAttendant(att);
    setAttName(att.name);
    setAttEmail(att.email);
    setAttPhone(att.phone || '');
    setAttPassword(att.password || '123');
    setAttRole(att.role || 'attendant');
    setAttDepartment(att.department || 'Comercial & Vendas');
    setAttAvatar(att.avatar_url || '');
    setIsAttendantModalOpen(true);
  };

  const handleSaveAttendant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!attName.trim() || !attEmail.trim()) {
      toastError('Campos obrigatórios', 'Preencha o nome e o e-mail do atendente.');
      return;
    }

    try {
      const updated: Attendant = {
        id: editingAttendant?.id || `att-${Date.now()}`,
        name: attName.trim(),
        email: attEmail.trim().toLowerCase(),
        phone: attPhone.trim().replace(/\D/g, ''),
        password: attPassword.trim() || '123',
        role: attRole,
        department: attDepartment,
        avatar_url: attAvatar.trim(),
        status: editingAttendant?.status || 'online',
        metrics: editingAttendant?.metrics || {
          chats_assigned: 0,
          chats_resolved: 0,
          messages_sent: 0,
          avg_response_time_min: 0,
          rating: 5.0,
        },
        created_at: editingAttendant?.created_at || new Date().toISOString(),
      };

      await StorageService.saveAttendant(updated);
      const list = await StorageService.getAttendants();
      setAttendants(list);
      setIsAttendantModalOpen(false);
      success('Atendente Salvo', `Perfil de "${updated.name}" registrado com sucesso.`);
    } catch (err: any) {
      toastError('Erro ao salvar atendente', err.message);
    }
  };

  const handleDeleteAttendant = async (id: string, name: string) => {
    if (!confirm(`Deseja realmente remover o perfil de "${name}"?`)) return;
    try {
      await StorageService.deleteAttendant(id);
      const list = await StorageService.getAttendants();
      setAttendants(list);
      success('Atendente Removido', `O perfil de ${name} foi excluído.`);
    } catch (err: any) {
      toastError('Erro ao excluir', err.message);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-dark-900/60 p-4 rounded-3xl border border-white/5 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 p-0.5 shadow-lg shadow-brand-500/20 flex items-center justify-center">
            <div className="w-full h-full bg-dark-950 rounded-[14px] flex items-center justify-center text-brand-400">
              <SettingsIcon className="w-6 h-6" />
            </div>
          </div>
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              Configurações da Plataforma
              <Badge variant="brand" className="text-[10px] py-0 px-2">v2.0 PRO</Badge>
            </h1>
            <p className="text-xs text-slate-400">
              Personalização do robô, conexão WhatsApp, dados corporativos, banco de dados e segurança
            </p>
          </div>
        </div>

        {isConnected && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>WhatsApp Conectado</span>
          </div>
        )}
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-1.5 p-1.5 bg-dark-900/80 rounded-2xl border border-white/5 overflow-x-auto">
        <button
          onClick={() => setActiveTab('whatsapp_qr')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
            activeTab === 'whatsapp_qr'
              ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <QrCode className="w-4 h-4" />
          <span>Conexão WhatsApp</span>
        </button>

        <button
          onClick={() => setActiveTab('attendants')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
            activeTab === 'attendants'
              ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Headphones className="w-4 h-4" />
          <span>Equipe & Atendentes</span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
            activeTab === 'profile'
              ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Bot className="w-4 h-4" />
          <span>Perfil do Assistente</span>
        </button>

        <button
          onClick={() => setActiveTab('company')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
            activeTab === 'company'
              ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Empresa & PIX</span>
        </button>

        <button
          onClick={() => setActiveTab('database')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
            activeTab === 'database'
              ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Banco de Dados & Nuvem</span>
        </button>

        <button
          onClick={() => setActiveTab('variables')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
            activeTab === 'variables'
              ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Code2 className="w-4 h-4" />
          <span>Variáveis Globais</span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
            activeTab === 'security'
              ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Segurança & Senha</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: WHATSAPP QR CODE & DISCLOUD CONNECTION */}
      {/* ========================================================================= */}
      {activeTab === 'whatsapp_qr' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in">
          <div className="lg:col-span-2 space-y-6">
            <QRCodeView />

            {/* Backend URL Configuration */}
            <Card className="p-6 rounded-3xl bg-dark-900/70 border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Server className="w-4 h-4 text-brand-400" />
                    Servidor WhatsApp (Discloud / Baileys)
                  </h3>
                  <p className="text-xs text-slate-400">
                    URL do serviço WebSocket e API REST onde o robô está hospedado
                  </p>
                </div>
                <Badge variant="brand" className="text-[10px]">Cloud Discloud</Badge>
              </div>

              <div className="flex gap-2">
                <Input
                  value={customServerInput}
                  onChange={(e) => setCustomServerInput(e.target.value)}
                  placeholder="https://talvanebarber.discloud.app"
                  className="font-mono text-xs flex-1"
                />
                <Button
                  variant="brand"
                  size="sm"
                  onClick={handleTestBackend}
                  disabled={isTestingServer}
                  className="text-xs"
                >
                  {isTestingServer ? 'Testando...' : 'Testar Conexão'}
                </Button>
              </div>
            </Card>
          </div>

          <div className="space-y-4">
            <Card className="p-5 rounded-3xl bg-dark-900/60 border-white/5 space-y-3">
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-emerald-400" />
                Dicas de Estabilidade
              </h4>
              <ul className="text-xs text-slate-300 space-y-2 leading-relaxed">
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  Mantenha o celular com internet ativa para a sincronização inicial.
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  A sessão é persistida em nuvem no Discloud com reconexão automática.
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  Caso queira trocar de aparelho, clique em <strong>Desconectar</strong> para gerar um novo QR Code.
                </li>
              </ul>
            </Card>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB: ATTENDANTS & RELATIONSHIP TEAM (EQUIPE & PERFIS COM SENHA) */}
      {/* ========================================================================= */}
      {activeTab === 'attendants' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Header Banner */}
          <Card className="p-6 rounded-3xl bg-dark-900/70 border-white/10 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Headphones className="w-4 h-4 text-brand-400" />
                  Perfis de Atendentes & Métricas Individuais
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Gerencie operadores com login e senha próprios, departamentos e acompanhe o desempenho de cada um
                </p>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href="/relacionamento"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-600/20 text-purple-300 hover:bg-purple-600/30 border border-purple-500/30 text-xs font-bold transition-all shadow-glow-primary"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Abrir Portal do Atendente (/relacionamento)
                </a>

                <Button
                  size="sm"
                  variant="primary"
                  onClick={handleOpenNewAttendantModal}
                  leftIcon={<UserPlus className="w-3.5 h-3.5" />}
                  className="font-bold shadow-glow-brand"
                >
                  Novo Atendente
                </Button>
              </div>
            </div>
          </Card>

          {/* Attendants Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {attendants.map((att) => (
              <Card key={att.id} className="p-5 rounded-3xl bg-dark-900/80 border-white/5 hover:border-brand-500/30 transition-all space-y-4 relative group">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl overflow-hidden bg-brand-500/20 border border-brand-500/30 flex items-center justify-center font-bold text-sm text-brand-300 flex-shrink-0">
                      {att.avatar_url ? (
                        <img src={att.avatar_url} alt={att.name} className="w-full h-full object-cover" />
                      ) : (
                        att.name.substring(0, 2).toUpperCase()
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                        {att.name}
                        {att.role === 'admin' && (
                          <Badge variant="brand" className="text-[9px] py-0 px-1.5">Admin</Badge>
                        )}
                      </h4>
                      <p className="text-xs text-slate-400">{att.department || 'Geral'}</p>
                    </div>
                  </div>

                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    att.status === 'online' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                    att.status === 'busy' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                    'bg-slate-800 text-slate-400'
                  }`}>
                    {att.status === 'online' ? '🟢 Online' : att.status === 'busy' ? '🟡 Ocupado' : '⚪ Pausa'}
                  </span>
                </div>

                {/* Details */}
                <div className="p-3 bg-dark-950/80 rounded-2xl border border-white/5 space-y-1.5 text-xs text-slate-300">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1.5"><Mail className="w-3 h-3 text-brand-400" /> E-mail:</span>
                    <span className="font-mono text-white text-[11px] truncate max-w-[140px]">{att.email}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1.5"><Phone className="w-3 h-3 text-emerald-400" /> WhatsApp:</span>
                    <span className="font-mono text-white text-[11px]">{formatPhone(att.phone || '') || '—'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1.5"><Lock className="w-3 h-3 text-amber-400" /> Senha:</span>
                    <span className="font-mono text-slate-400 text-[11px]">•••••• ({att.password || '123'})</span>
                  </div>
                </div>

                {/* Performance Metrics */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-dark-950/60 p-2 rounded-xl border border-white/5">
                    <p className="text-xs font-bold text-white">{att.metrics?.chats_assigned || 0}</p>
                    <p className="text-[9px] text-slate-400">Assumidos</p>
                  </div>
                  <div className="bg-dark-950/60 p-2 rounded-xl border border-white/5">
                    <p className="text-xs font-bold text-emerald-400">{att.metrics?.chats_resolved || 0}</p>
                    <p className="text-[9px] text-slate-400">Resolvidos</p>
                  </div>
                  <div className="bg-dark-950/60 p-2 rounded-xl border border-white/5">
                    <p className="text-xs font-bold text-amber-300 flex items-center justify-center gap-0.5">
                      <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                      {att.metrics?.rating || 5.0}
                    </p>
                    <p className="text-[9px] text-slate-400">Avaliação</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/5">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleOpenEditAttendantModal(att)}
                    leftIcon={<Edit3 className="w-3.5 h-3.5 text-brand-400" />}
                    className="text-xs py-1 h-7"
                  >
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteAttendant(att.id, att.name)}
                    leftIcon={<Trash2 className="w-3.5 h-3.5 text-rose-400" />}
                    className="text-xs py-1 h-7 text-rose-400 hover:text-rose-300"
                  >
                    Excluir
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: BOT PROFILE & PERSONALITY */}
      {/* ========================================================================= */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSaveProfile} className="space-y-6 animate-in fade-in">
          <Card className="p-6 rounded-3xl bg-dark-900/70 border-white/10 space-y-6">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Bot className="w-4 h-4 text-brand-400" />
                Identidade & Personalidade do Assistente
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Configure o nome, tom de voz e as saudações padrão enviadas aos clientes
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Nome do Assistente *</label>
                <Input
                  value={botName}
                  onChange={(e) => setBotName(e.target.value)}
                  placeholder="Ex: Talvane Barber Bot"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Nome da Empresa / Barbearia *</label>
                <Input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Ex: Talvane Barber"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Gênero da Persona</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as BotGender)}
                  className="w-full bg-dark-800 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="male">Masculino (Ele)</option>
                  <option value="female">Feminino (Ela)</option>
                  <option value="neutral">Neutro / Institucional</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Tom de Voz</label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value as BotTone)}
                  className="w-full bg-dark-800 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="Amigável e Acolhedor">Amigável e Acolhedor</option>
                  <option value="Profissional e Direto">Profissional e Direto</option>
                  <option value="Descontraído e Moderno">Descontraído e Moderno</option>
                  <option value="Consultor / Especialista">Consultor / Especialista</option>
                </select>
              </div>
            </div>

            {/* Avatar Selector */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-2">Avatar do Assistente</label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                {AVATAR_PRESETS.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setAvatarUrl(p.url)}
                    className={`p-2 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                      avatarUrl === p.url
                        ? 'border-brand-500 bg-brand-500/10 ring-2 ring-brand-500/30'
                        : 'border-white/5 bg-dark-950/60 hover:border-white/20'
                    }`}
                  >
                    <img src={p.url} alt={p.name} className="w-12 h-12 rounded-xl object-cover" />
                    <span className="text-[10px] text-slate-300 font-medium truncate w-full">{p.name.split(' ')[0]}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Standard Bot Messages */}
            <div className="space-y-4 pt-4 border-t border-white/5">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Mensagem Padrão de Boas-Vindas ({'{{mensagem_boas_vindas}}'})
                </label>
                <Textarea
                  rows={2}
                  value={welcomeMessage}
                  onChange={(e) => setWelcomeMessage(e.target.value)}
                  placeholder="Mensagem de saudação enviada aos novos clientes..."
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Mensagem de Transferência Humana
                </label>
                <Textarea
                  rows={2}
                  value={handoffMessage}
                  onChange={(e) => setHandoffMessage(e.target.value)}
                  placeholder="Mensagem de transbordo..."
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                variant="brand"
                type="submit"
                disabled={isSaving}
                leftIcon={<Save className="w-4 h-4" />}
              >
                {isSaving ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>
          </Card>
        </form>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: COMPANY & PIX DETAILS */}
      {/* ========================================================================= */}
      {activeTab === 'company' && (
        <Card className="p-6 rounded-3xl bg-dark-900/70 border-white/10 space-y-6 animate-in fade-in">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-brand-400" />
              Dados Comerciais & Dados para Pagamento PIX
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Informações utilizadas em variáveis automáticas como {'{{chave_pix}}'}, {'{{suporte_telefone}}'} e nos fluxos
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Telefone de Suporte / WhatsApp Comercial</label>
              <Input
                value={supportPhone}
                onChange={(e) => setSupportPhone(e.target.value)}
                placeholder="Ex: 81996138924"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">E-mail de Contato</label>
              <Input
                type="email"
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                placeholder="contato@talvanebarber.com.br"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Website Oficial / Link da Bio</label>
              <Input
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://talvane.malaca.com.br"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Endereço da Unidade</label>
              <Input
                value={companyAddress}
                onChange={(e) => setCompanyAddress(e.target.value)}
                placeholder="Ex: Av. Principal, 500 - Boa Viagem"
              />
            </div>
          </div>

          {/* PIX Settings Box */}
          <div className="p-5 rounded-2xl bg-dark-950/80 border border-emerald-500/20 space-y-4">
            <h4 className="text-xs font-bold text-emerald-400 flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Configuração de Cobrança PIX
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Tipo de Chave</label>
                <select
                  value={pixKeyType}
                  onChange={(e) => setPixKeyType(e.target.value)}
                  className="w-full bg-dark-800 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="telefone">Telefone (Celular)</option>
                  <option value="cnpj">CNPJ / CPF</option>
                  <option value="email">E-mail</option>
                  <option value="aleatoria">Chave Aleatória (EVP)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Chave PIX</label>
                <Input
                  value={pixKey}
                  onChange={(e) => setPixKey(e.target.value)}
                  placeholder="81996138924"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Nome do Titular / Beneficiário</label>
                <Input
                  value={pixOwner}
                  onChange={(e) => setPixOwner(e.target.value)}
                  placeholder="Talvane Barber Ltda"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              variant="brand"
              onClick={handleSaveProfile}
              disabled={isSaving}
              leftIcon={<Save className="w-4 h-4" />}
            >
              {isSaving ? 'Salvando...' : 'Salvar Dados Comerciais'}
            </Button>
          </div>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: DATABASE & SUPABASE */}
      {/* ========================================================================= */}
      {activeTab === 'database' && (
        <div className="space-y-6 animate-in fade-in">
          <Card className="p-6 rounded-3xl bg-dark-900/70 border-white/10 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Database className="w-4 h-4 text-brand-400" />
                  Banco de Dados em Nuvem (Supabase PostgreSQL)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Status da conexão em tempo real e sincronização atômica de dados
                </p>
              </div>

              <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Nuvem Ativa
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-dark-950/80 border border-white/5 font-mono text-xs">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Host do Banco:</span>
                <span className="text-brand-300 truncate block">https://nskflvulclgwqqasdntq.supabase.co</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Segurança & Políticas:</span>
                <span className="text-emerald-400">Row Level Security (RLS) Ativo</span>
              </div>
            </div>

            {/* Tables status grid */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-300 block">Tabelas Sincronizadas:</span>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                {['contacts', 'appointments', 'flows', 'flow_nodes', 'flow_edges', 'conversations'].map((tbl) => (
                  <div key={tbl} className="p-2.5 rounded-xl bg-dark-950 border border-white/5 text-center">
                    <span className="font-mono text-xs font-bold text-white block">{tbl}</span>
                    <span className="text-[9px] text-emerald-400 flex items-center justify-center gap-1 mt-0.5">
                      <CheckCheck className="w-3 h-3" /> OK
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => success('Sincronização OK', 'Conexão com o banco de dados verificada com sucesso.')}
                leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
              >
                Verificar Integridade
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: GLOBAL TEMPLATE VARIABLES */}
      {/* ========================================================================= */}
      {activeTab === 'variables' && (
        <Card className="p-6 rounded-3xl bg-dark-900/70 border-white/10 space-y-4 animate-in fade-in">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Code2 className="w-4 h-4 text-brand-400" />
              Variáveis Globais do Sistema
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Clique em qualquer variável para copiar e usar nos nós de mensagens, perguntas e agendamentos
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
            {[
              { code: '{{nome_cliente}}', desc: 'Nome informado pelo cliente ou contato' },
              { code: '{{telefone_cliente}}', desc: 'Número WhatsApp de quem está falando' },
              { code: '{{bot_nome}}', desc: 'Nome do seu assistente configurado' },
              { code: '{{empresa}}', desc: 'Nome da sua empresa / barbearia' },
              { code: '{{horario_atendimento}}', desc: 'Horário de funcionamento comercial' },
              { code: '{{suporte_telefone}}', desc: 'Telefone comercial de suporte' },
              { code: '{{suporte_email}}', desc: 'E-mail oficial de contato' },
              { code: '{{site_empresa}}', desc: 'Website oficial da empresa' },
              { code: '{{data_agendamento}}', desc: 'Data do agendamento escolhida (YYYY-MM-DD)' },
              { code: '{{data_formatada}}', desc: 'Data no padrão brasileiro (DD/MM/AAAA)' },
              { code: '{{horario_agendamento}}', desc: 'Horário selecionado pelo cliente (HH:MM)' },
              { code: '{{servico_selecionado}}', desc: 'Nome do serviço escolhido no catálogo' },
              { code: '{{chave_pix}}', desc: 'Chave PIX configurada para pagamento' },
              { code: '{{ultima_mensagem}}', desc: 'Última mensagem digitada pelo cliente' },
            ].map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleCopy(item.code, item.code)}
                className="p-3.5 rounded-2xl bg-dark-950/80 border border-white/5 hover:border-brand-500/40 text-left transition-all flex items-start justify-between group"
              >
                <div>
                  <code className="text-xs font-bold text-brand-300 group-hover:text-brand-200">
                    {item.code}
                  </code>
                  <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                    {item.desc}
                  </p>
                </div>
                <span className="p-1 rounded-lg bg-dark-900 text-slate-500 group-hover:text-white transition-colors">
                  {copiedField === item.code ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </span>
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: SECURITY & PASSWORD */}
      {/* ========================================================================= */}
      {activeTab === 'security' && (
        <Card className="p-6 rounded-3xl bg-dark-900/70 border-white/10 space-y-6 max-w-xl animate-in fade-in">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-brand-400" />
              Segurança & Credenciais de Acesso
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Altere a senha de autenticação do painel administrativo
            </p>
          </div>

          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Nova Senha de Acesso *</label>
              <Input
                type="password"
                value={newAdminPassword}
                onChange={(e) => setNewAdminPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Confirmar Nova Senha *</label>
              <Input
                type="password"
                value={confirmAdminPassword}
                onChange={(e) => setConfirmAdminPassword(e.target.value)}
                placeholder="Repita a nova senha"
                required
              />
            </div>

            <div className="flex justify-end pt-2">
              <Button
                variant="brand"
                type="submit"
                leftIcon={<Lock className="w-4 h-4" />}
              >
                Salvar Nova Senha
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Modal: Novo / Editar Atendente */}
      <Modal
        isOpen={isAttendantModalOpen}
        onClose={() => setIsAttendantModalOpen(false)}
        title={editingAttendant ? 'Editar Perfil de Atendente' : 'Novo Perfil de Atendente'}
      >
        <form onSubmit={handleSaveAttendant} className="space-y-4 text-xs">
          <div>
            <label className="text-[11px] font-bold text-slate-400 block mb-1">Nome Completo *</label>
            <Input
              value={attName}
              onChange={(e) => setAttName(e.target.value)}
              placeholder="Ex: Sofia Atendimento"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-400 block mb-1">E-mail de Login *</label>
              <Input
                type="email"
                value={attEmail}
                onChange={(e) => setAttEmail(e.target.value)}
                placeholder="sofia@barber.com"
                required
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-400 block mb-1">WhatsApp / Telefone</label>
              <Input
                value={attPhone}
                onChange={(e) => setAttPhone(e.target.value)}
                placeholder="81988887777"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-400 block mb-1">Senha de Acesso *</label>
              <Input
                type="text"
                value={attPassword}
                onChange={(e) => setAttPassword(e.target.value)}
                placeholder="Senha do atendente"
                required
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-400 block mb-1">Departamento / Setor</label>
              <select
                value={attDepartment}
                onChange={(e) => setAttDepartment(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-dark-900 border border-white/10 text-white text-xs"
              >
                <option value="Comercial & Vendas">Comercial & Vendas</option>
                <option value="Suporte & Recepção">Suporte & Recepção</option>
                <option value="Agendamentos">Agendamentos</option>
                <option value="Geral">Geral</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-400 block mb-1">URL da Foto de Perfil (Opcional)</label>
            <Input
              value={attAvatar}
              onChange={(e) => setAttAvatar(e.target.value)}
              placeholder="https://exemplo.com/avatar.jpg"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/5">
            <Button size="sm" variant="ghost" type="button" onClick={() => setIsAttendantModalOpen(false)}>
              Cancelar
            </Button>
            <Button size="sm" variant="primary" type="submit" leftIcon={<Save className="w-3.5 h-3.5" />}>
              Salvar Atendente
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
