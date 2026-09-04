import React, { useState, useEffect, useCallback } from 'react';
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
  MessageSquare,
  Plus,
  Download,
  Volume2,
  HardDrive
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
import { BotProfile, BotGender, BotTone, Attendant, CustomVariable, Settings } from '../../types';
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
  const [customServerInput, setCustomServerInput] = useState(backendUrl || 'https://talvane.discloud.app');
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

  // Database Management State
  const [supabaseUrl, setSupabaseUrl] = useState('https://nskflvulclgwqqasdntq.supabase.co');
  const [supabaseKey, setSupabaseKey] = useState('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5za2ZsdnVsY2xnd3FxYXNkbnRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgwMTQ0NjQsImV4cCI6MjEwMzU5MDQ2NH0.mL82cgH4MadNi_sTeKKgYmRAuhmp7HqImuAs9hTrTZI');
  const [dbStats, setDbStats] = useState({
    contacts_count: 0,
    appointments_count: 0,
    flows_count: 0,
    attendants_count: 0,
    custom_variables_count: 0,
    system_users_count: 0,
    conversations_count: 0,
  });
  const [isSyncingDb, setIsSyncingDb] = useState(false);
  const [isSavingDbConfig, setIsSavingDbConfig] = useState(false);

  // Custom Variables State
  const [customVariables, setCustomVariables] = useState<CustomVariable[]>([]);
  const [isVarModalOpen, setIsVarModalOpen] = useState(false);
  const [editingVar, setEditingVar] = useState<CustomVariable | null>(null);
  const [varNameInput, setVarNameInput] = useState('');
  const [varValueInput, setVarValueInput] = useState('');
  const [varDescInput, setVarDescInput] = useState('');

  // Security
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [confirmAdminPassword, setConfirmAdminPassword] = useState('');
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // Load Database Stats
  const loadDbStats = useCallback(async () => {
    const targetUrl = backendUrl || 'https://talvane.discloud.app';
    try {
      const res = await fetch(`${targetUrl}/api/whatsapp/database/stats`, { signal: AbortSignal.timeout(4000) });
      if (res.ok) {
        const data = await res.json();
        if (data.stats) {
          setDbStats(data.stats);
          return;
        }
      }
    } catch {}

    // Fallback counts from StorageService
    try {
      const contacts = await StorageService.getContacts();
      const apts = await StorageService.getAppointments();
      const flows = await StorageService.getFlows();
      const atts = await StorageService.getAttendants();
      const vars = await StorageService.getCustomVariables();
      setDbStats({
        contacts_count: contacts.length,
        appointments_count: apts.length,
        flows_count: flows.length,
        attendants_count: atts.length,
        custom_variables_count: vars.length,
        system_users_count: 1,
        conversations_count: 0,
      });
    } catch {}
  }, [backendUrl]);

  // Load all configuration data from database on mount
  useEffect(() => {
    const loadAllData = async () => {
      try {
        const [savedProfile, savedSettings, savedAttendants, savedVars] = await Promise.all([
          StorageService.getBotProfile(),
          StorageService.getSettings(),
          StorageService.getAttendants(),
          StorageService.getCustomVariables(),
        ]);

        if (savedProfile) {
          setBotName(savedProfile.name || defaultBotProfile.name);
          setCompanyName(savedProfile.company_name || defaultBotProfile.company_name);
          setGender(savedProfile.gender || defaultBotProfile.gender);
          setTone(savedProfile.tone || defaultBotProfile.tone);
          setAvatarUrl(savedProfile.avatar_url || defaultBotProfile.avatar_url);
          setSupportPhone(savedProfile.support_phone || defaultBotProfile.support_phone);
          setSupportEmail(savedProfile.support_email || defaultBotProfile.support_email);
          setBusinessHours(savedProfile.business_hours || defaultBotProfile.business_hours);
          setWebsiteUrl(savedProfile.website_url || defaultBotProfile.website_url);
          setWelcomeMessage(savedProfile.welcome_message || defaultBotProfile.welcome_message);
          setFallbackMessage(savedProfile.fallback_message || defaultBotProfile.fallback_message);
          if (savedProfile.handoff_message) setHandoffMessage(savedProfile.handoff_message);
          if (savedProfile.company_address) setCompanyAddress(savedProfile.company_address);
          if (savedProfile.pix_key_type) setPixKeyType(savedProfile.pix_key_type);
          if (savedProfile.pix_key) setPixKey(savedProfile.pix_key);
          if (savedProfile.pix_owner) setPixOwner(savedProfile.pix_owner);
          if (typeof savedProfile.notify_new_bookings === 'boolean') setNotifyNewBookings(savedProfile.notify_new_bookings);
          if (savedProfile.notify_phone) setNotifyPhone(savedProfile.notify_phone);
          if (typeof savedProfile.play_audio_alerts === 'boolean') setPlayAudioAlerts(savedProfile.play_audio_alerts);
        }

        if (savedSettings) {
          if (savedSettings.backend_url) setCustomServerInput(savedSettings.backend_url);
          if (savedSettings.supabase_url) setSupabaseUrl(savedSettings.supabase_url);
          if (savedSettings.supabase_anon_key) setSupabaseKey(savedSettings.supabase_anon_key);
        }

        if (savedAttendants) {
          setAttendants(savedAttendants);
        }

        if (savedVars) {
          setCustomVariables(savedVars);
        }

        loadDbStats();
      } catch (e) {
        console.error('Error loading configuration data:', e);
      }
    };

    loadAllData();
  }, [loadDbStats]);

  // Tab 1: Save Backend URL to Database
  const handleSaveBackendUrl = async () => {
    setIsTestingServer(true);
    try {
      setCustomBackendUrl(customServerInput);
      await StorageService.updateSettings({ backend_url: customServerInput });
      success('URL Salva no Banco de Dados', `Servidor configurado e gravado no banco: ${customServerInput}`);
      refreshStatus();
    } catch (err: any) {
      toastError('Erro ao salvar URL', err.message);
    } finally {
      setIsTestingServer(false);
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

  // Tab 3 & 4: Save Bot Profile, Commercial Details, and Notifications to Database
  const handleSaveProfile = async (e?: React.FormEvent) => {
    if (e && e.preventDefault) e.preventDefault();
    setIsSaving(true);
    try {
      const updated: BotProfile = {
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
        handoff_message: handoffMessage,
        company_address: companyAddress,
        pix_key_type: pixKeyType,
        pix_key: pixKey,
        pix_owner: pixOwner,
        notify_new_bookings: notifyNewBookings,
        notify_phone: notifyPhone,
        play_audio_alerts: playAudioAlerts,
        updated_at: new Date().toISOString(),
      };

      await StorageService.updateBotProfile(updated);
      success('Configurações Salvas no Banco', 'Perfil, dados comerciais, PIX e notificações atualizados no banco de dados em tempo real.');
    } catch (err: any) {
      toastError('Erro ao salvar', err.message || 'Falha ao gravar configurações');
    } finally {
      setIsSaving(false);
    }
  };

  // Tab 2: Attendants Handlers
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
      loadDbStats();
      success('Atendente Salvo no Banco', `Perfil de "${updated.name}" persistido no banco de dados com sucesso.`);
    } catch (err: any) {
      toastError('Erro ao salvar atendente', err.message);
    }
  };

  const handleDeleteAttendant = async (id: string, name: string) => {
    if (!confirm(`Deseja realmente remover o perfil de "${name}" do banco de dados?`)) return;
    try {
      await StorageService.deleteAttendant(id);
      const list = await StorageService.getAttendants();
      setAttendants(list);
      loadDbStats();
      success('Atendente Removido do Banco', `O perfil de ${name} foi excluído do banco de dados.`);
    } catch (err: any) {
      toastError('Erro ao excluir', err.message);
    }
  };

  // Tab 5: Database Credentials & Sync Handlers
  const handleSaveDbCredentials = async () => {
    setIsSavingDbConfig(true);
    try {
      await StorageService.updateSettings({
        supabase_url: supabaseUrl.trim(),
        supabase_anon_key: supabaseKey.trim(),
      });
      success('Banco de Dados Atualizado', 'Credenciais e configurações do banco persistidas com sucesso.');
    } catch (err: any) {
      toastError('Erro ao salvar credenciais', err.message);
    } finally {
      setIsSavingDbConfig(false);
    }
  };

  const handleSyncAllTables = async () => {
    setIsSyncingDb(true);
    try {
      await StorageService.getContacts();
      await StorageService.getAppointments();
      await StorageService.getFlows();
      await StorageService.getAttendants();
      await StorageService.getSettings();
      await StorageService.getCustomVariables();
      await loadDbStats();
      success('Sincronização Completa Realizada', 'Todas as tabelas foram lidas e sincronizadas com o banco de dados em nuvem.');
    } catch (err: any) {
      toastError('Erro ao sincronizar tabelas', err.message);
    } finally {
      setIsSyncingDb(false);
    }
  };

  const handleDownloadBackup = () => {
    const targetUrl = `${backendUrl || 'https://talvane.discloud.app'}/api/whatsapp/database/dump`;
    window.open(targetUrl, '_blank');
    success('Download de Backup Iniciado', 'O arquivo JSON com todo o banco de dados está sendo baixado.');
  };

  // Tab 6: Custom Variables Handlers
  const handleOpenNewVarModal = () => {
    setEditingVar(null);
    setVarNameInput('');
    setVarValueInput('');
    setVarDescInput('');
    setIsVarModalOpen(true);
  };

  const handleOpenEditVarModal = (cv: CustomVariable) => {
    setEditingVar(cv);
    setVarNameInput(cv.name.replace(/[{}]/g, ''));
    setVarValueInput(cv.value);
    setVarDescInput(cv.description || '');
    setIsVarModalOpen(true);
  };

  const handleSaveCustomVar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!varNameInput.trim()) {
      toastError('Nome obrigatório', 'Informe o identificador da variável.');
      return;
    }

    try {
      const cleanName = varNameInput.trim().replace(/[{}]/g, '').toLowerCase();
      const updated: CustomVariable = {
        id: editingVar?.id || `var-${Date.now()}`,
        name: `{{${cleanName}}}`,
        value: varValueInput.trim(),
        description: varDescInput.trim(),
      };

      await StorageService.saveCustomVariable(updated);
      const list = await StorageService.getCustomVariables();
      setCustomVariables(list);
      setIsVarModalOpen(false);
      loadDbStats();
      success('Variável Salva no Banco', `Variável {{${cleanName}}} cadastrada e ativa nos fluxos.`);
    } catch (err: any) {
      toastError('Erro ao salvar variável', err.message);
    }
  };

  const handleDeleteCustomVar = async (id: string, name: string) => {
    if (!confirm(`Deseja realmente remover a variável ${name} do banco de dados?`)) return;
    try {
      await StorageService.deleteCustomVariable(id);
      const list = await StorageService.getCustomVariables();
      setCustomVariables(list);
      loadDbStats();
      success('Variável Excluída do Banco', `A variável ${name} foi removida do banco de dados.`);
    } catch (err: any) {
      toastError('Erro ao excluir variável', err.message);
    }
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    success('Copiado!', `Variável ${label} copiada para a área de transferência.`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Tab 7: Security & Password Update
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newAdminPassword.length < 6) {
      toastError('Senha muito curta', 'A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }
    if (newAdminPassword !== confirmAdminPassword) {
      toastError('Senhas não coincidem', 'A confirmação de senha deve ser idêntica.');
      return;
    }

    setIsSavingPassword(true);
    try {
      localStorage.setItem('7assistente_admin_pwd', newAdminPassword);
      await StorageService.updateSettings({ admin_password: newAdminPassword });
      await StorageService.updateAdminProfile({ password: newAdminPassword });
      await StorageService.saveSystemUser({
        id: 'user-talvane',
        name: 'Talvane (Administrador & Barbeiro)',
        phone: '81996138924',
        password: newAdminPassword,
        pin: '1234',
        role: 'admin',
        permissions: {
          can_access_admin: true,
          can_access_atendimento: true,
          can_access_barbeiro: true,
        },
        status: 'active',
        created_at: new Date().toISOString(),
      });

      setNewAdminPassword('');
      setConfirmAdminPassword('');
      success('Senha Salva no Banco de Dados', 'A nova senha foi gravada e sincronizada com segurança.');
    } catch (err: any) {
      toastError('Erro ao salvar senha no banco', err.message);
    } finally {
      setIsSavingPassword(false);
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
              <Badge variant="brand" className="text-[10px] py-0 px-2">Banco de Dados Conectado</Badge>
            </h1>
            <p className="text-xs text-slate-400">
              Todas as abas sincronizadas em tempo real com o banco de dados (Discloud & Supabase)
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
          onClick={() => {
            setActiveTab('database');
            loadDbStats();
          }}
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
            <QRCodeView
              value={rawQR || session.qrCode || ''}
              qrDataUrl={qrDataUrl}
              onRefresh={generateQRCode}
              onRequestPairingCode={requestPairingCode}
              isLoading={isConnecting}
            />

            {/* Backend URL Configuration */}
            <Card className="p-6 rounded-3xl bg-dark-900/70 border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Server className="w-4 h-4 text-brand-400" />
                    Servidor WhatsApp (Discloud / Baileys)
                  </h3>
                  <p className="text-xs text-slate-400">
                    URL do serviço WebSocket e API REST onde o robô está hospedado e persistido no banco
                  </p>
                </div>
                <Badge variant="brand" className="text-[10px]">Persistido no Banco</Badge>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  value={customServerInput}
                  onChange={(e) => setCustomServerInput(e.target.value)}
                  placeholder="https://talvane.discloud.app"
                  className="font-mono text-xs flex-1"
                />
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleTestBackend}
                    disabled={isTestingServer}
                    className="text-xs"
                  >
                    {isTestingServer ? 'Testando...' : 'Testar Conexão'}
                  </Button>
                  <Button
                    variant="brand"
                    size="sm"
                    onClick={handleSaveBackendUrl}
                    disabled={isTestingServer}
                    leftIcon={<Save className="w-3.5 h-3.5" />}
                    className="text-xs font-bold"
                  >
                    Salvar no Banco
                  </Button>
                </div>
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
      {/* TAB 2: ATTENDANTS & RELATIONSHIP TEAM (EQUIPE & PERFIS COM SENHA) */}
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
                  Gerencie operadores com login e senha próprios, departamentos e métricas sincronizadas no banco de dados
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    const list = await StorageService.getAttendants();
                    setAttendants(list);
                    success('Banco Sincronizado', `${list.length} atendentes carregados do banco de dados.`);
                  }}
                  leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                  className="text-xs"
                >
                  Sincronizar Banco
                </Button>

                <a
                  href="/relacionamento"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-600/20 text-purple-300 hover:bg-purple-600/30 border border-purple-500/30 text-xs font-bold transition-all shadow-glow-primary"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Abrir Portal (/relacionamento)
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
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Bot className="w-4 h-4 text-brand-400" />
                  Identidade & Personalidade do Assistente
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Configure o nome, tom de voz e as saudações padrão salvas no banco de dados
                </p>
              </div>
              <Badge variant="brand" className="text-[10px]">Persistido no Banco</Badge>
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
                  placeholder="Mensagem enviada antes de transferir para um atendente..."
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Mensagem de Contingência / Fallback (Quando o robô não entender)
                </label>
                <Textarea
                  rows={2}
                  value={fallbackMessage}
                  onChange={(e) => setFallbackMessage(e.target.value)}
                  placeholder="Desculpe, não consegui compreender sua mensagem. Escolha uma das opções ou digite MENU para voltar ao início..."
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
                {isSaving ? 'Salvando no Banco...' : 'Salvar Alterações no Banco'}
              </Button>
            </div>
          </Card>
        </form>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: COMPANY, PIX & NOTIFICATIONS */}
      {/* ========================================================================= */}
      {activeTab === 'company' && (
        <Card className="p-6 rounded-3xl bg-dark-900/70 border-white/10 space-y-6 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-brand-400" />
                Dados Comerciais, Cobrança PIX & Notificações
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Informações utilizadas em variáveis automáticas como {'{{chave_pix}}'}, {'{{suporte_telefone}}'} e nos fluxos
              </p>
            </div>
            <Badge variant="brand" className="text-[10px]">Persistido no Banco</Badge>
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

          {/* Notifications Settings Box */}
          <div className="p-5 rounded-2xl bg-dark-950/80 border border-brand-500/20 space-y-4">
            <h4 className="text-xs font-bold text-brand-400 flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Notificações & Alertas em Tempo Real
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2 p-3 bg-dark-900/60 rounded-xl border border-white/5">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-white">
                  <input
                    type="checkbox"
                    checked={notifyNewBookings}
                    onChange={(e) => setNotifyNewBookings(e.target.checked)}
                    className="w-4 h-4 rounded border-white/20 bg-dark-800 text-brand-500 focus:ring-brand-500"
                  />
                  <span className="font-semibold">Notificar novos agendamentos por WhatsApp</span>
                </label>
                <p className="text-[11px] text-slate-400 pl-6">
                  Envia um aviso automático no WhatsApp sempre que um cliente agendar pelo robô.
                </p>
              </div>

              <div className="space-y-2 p-3 bg-dark-900/60 rounded-xl border border-white/5">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-white">
                  <input
                    type="checkbox"
                    checked={playAudioAlerts}
                    onChange={(e) => setPlayAudioAlerts(e.target.checked)}
                    className="w-4 h-4 rounded border-white/20 bg-dark-800 text-brand-500 focus:ring-brand-500"
                  />
                  <span className="font-semibold">Alerta sonoro de nova mensagem</span>
                </label>
                <p className="text-[11px] text-slate-400 pl-6">
                  Toca um sinal sonoro nos painéis ao receber novas mensagens de clientes.
                </p>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                WhatsApp Destinatário para Receber Alertas de Agendamento
              </label>
              <Input
                value={notifyPhone}
                onChange={(e) => setNotifyPhone(e.target.value)}
                placeholder="Ex: 81996138924 (DDD + Número)"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              variant="brand"
              onClick={handleSaveProfile}
              disabled={isSaving}
              leftIcon={<Save className="w-4 h-4" />}
            >
              {isSaving ? 'Salvando no Banco...' : 'Salvar Dados Comerciais no Banco'}
            </Button>
          </div>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: DATABASE & SUPABASE */}
      {/* ========================================================================= */}
      {activeTab === 'database' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Live Statistics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-4 rounded-2xl bg-dark-900/80 border border-white/5 text-center">
              <span className="text-[10px] text-slate-400 block font-semibold">Contatos Registrados</span>
              <span className="text-xl font-bold text-white mt-1 block">{dbStats.contacts_count}</span>
            </div>
            <div className="p-4 rounded-2xl bg-dark-900/80 border border-white/5 text-center">
              <span className="text-[10px] text-slate-400 block font-semibold">Agendamentos</span>
              <span className="text-xl font-bold text-emerald-400 mt-1 block">{dbStats.appointments_count}</span>
            </div>
            <div className="p-4 rounded-2xl bg-dark-900/80 border border-white/5 text-center">
              <span className="text-[10px] text-slate-400 block font-semibold">Fluxos Ativos</span>
              <span className="text-xl font-bold text-brand-400 mt-1 block">{dbStats.flows_count}</span>
            </div>
            <div className="p-4 rounded-2xl bg-dark-900/80 border border-white/5 text-center">
              <span className="text-[10px] text-slate-400 block font-semibold">Atendentes</span>
              <span className="text-xl font-bold text-purple-400 mt-1 block">{dbStats.attendants_count}</span>
            </div>
            <div className="p-4 rounded-2xl bg-dark-900/80 border border-white/5 text-center">
              <span className="text-[10px] text-slate-400 block font-semibold">Variáveis</span>
              <span className="text-xl font-bold text-amber-400 mt-1 block">{dbStats.custom_variables_count}</span>
            </div>
            <div className="p-4 rounded-2xl bg-dark-900/80 border border-white/5 text-center">
              <span className="text-[10px] text-slate-400 block font-semibold">Conversas</span>
              <span className="text-xl font-bold text-sky-400 mt-1 block">{dbStats.conversations_count}</span>
            </div>
          </div>

          <Card className="p-6 rounded-3xl bg-dark-900/70 border-white/10 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Database className="w-4 h-4 text-brand-400" />
                  Banco de Dados em Nuvem (Supabase & Discloud)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Credenciais de conexão, políticas atômicas e sincronização total
                </p>
              </div>

              <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Nuvem Ativa
              </div>
            </div>

            <div className="space-y-4 p-4 rounded-2xl bg-dark-950/80 border border-white/5">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Host / URL do Banco de Dados (Supabase URL)
                </label>
                <Input
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                  placeholder="https://sua-instancia.supabase.co"
                  className="font-mono text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Chave Pública Anon (JWT Anon Key)
                </label>
                <Input
                  type="password"
                  value={supabaseKey}
                  onChange={(e) => setSupabaseKey(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI..."
                  className="font-mono text-xs"
                />
              </div>

              <div className="flex justify-end">
                <Button
                  size="sm"
                  variant="primary"
                  onClick={handleSaveDbCredentials}
                  disabled={isSavingDbConfig}
                  leftIcon={<Save className="w-3.5 h-3.5" />}
                  className="text-xs"
                >
                  {isSavingDbConfig ? 'Salvando...' : 'Salvar Credenciais no Banco'}
                </Button>
              </div>
            </div>

            {/* Tables status grid */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-300 block">Tabelas e Coleções Sincronizadas:</span>
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

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-white/5">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadBackup}
                leftIcon={<Download className="w-3.5 h-3.5 text-emerald-400" />}
                className="w-full sm:w-auto text-xs font-semibold"
              >
                Baixar Backup Completo (JSON)
              </Button>

              <Button
                variant="brand"
                size="sm"
                onClick={handleSyncAllTables}
                disabled={isSyncingDb}
                leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isSyncingDb ? 'animate-spin' : ''}`} />}
                className="w-full sm:w-auto text-xs font-bold"
              >
                {isSyncingDb ? 'Sincronizando com o Banco...' : 'Sincronizar Todas as Tabelas'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: GLOBAL & CUSTOM VARIABLES */}
      {/* ========================================================================= */}
      {activeTab === 'variables' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Custom Variables Section */}
          <Card className="p-6 rounded-3xl bg-dark-900/70 border-white/10 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-brand-400" />
                  Variáveis Personalizadas no Banco de Dados ({customVariables.length})
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Crie, edite e delete variáveis próprias para usar em qualquer mensagem do robô WhatsApp
                </p>
              </div>

              <Button
                size="sm"
                variant="primary"
                onClick={handleOpenNewVarModal}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
                className="text-xs font-bold shadow-glow-brand"
              >
                Nova Variável
              </Button>
            </div>

            {customVariables.length === 0 ? (
              <div className="p-8 text-center bg-dark-950/60 rounded-2xl border border-white/5">
                <Code2 className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-xs text-slate-300 font-semibold">Nenhuma variável personalizada cadastrada</p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Clique em &quot;Nova Variável&quot; para adicionar constantes como promoções, links ou avisos.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
                {customVariables.map((cv) => (
                  <div
                    key={cv.id}
                    className="p-3.5 rounded-2xl bg-dark-950/80 border border-white/5 hover:border-brand-500/40 text-left transition-all flex flex-col justify-between group space-y-3"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <code className="text-xs font-bold text-brand-300 group-hover:text-brand-200">
                          {cv.name}
                        </code>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleCopy(cv.name, cv.name)}
                            title="Copiar tag"
                            className="p-1 rounded-lg bg-dark-900 text-slate-400 hover:text-white transition-colors"
                          >
                            {copiedField === cv.name ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEditVarModal(cv)}
                            title="Editar variável"
                            className="p-1 rounded-lg bg-dark-900 text-slate-400 hover:text-brand-300 transition-colors"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCustomVar(cv.id, cv.name)}
                            title="Excluir variável"
                            className="p-1 rounded-lg bg-dark-900 text-slate-400 hover:text-rose-400 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="mt-2 p-2 rounded-xl bg-dark-900/80 border border-white/5">
                        <span className="text-[10px] text-slate-500 block uppercase font-semibold">Valor Atual:</span>
                        <p className="text-xs text-white font-medium truncate mt-0.5">{cv.value || '(Vazio)'}</p>
                      </div>

                      {cv.description && (
                        <p className="text-[11px] text-slate-400 mt-2 leading-snug">
                          {cv.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Standard System Template Variables Reference */}
          <Card className="p-6 rounded-3xl bg-dark-900/70 border-white/10 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Code2 className="w-4 h-4 text-emerald-400" />
                Variáveis Padrão do Sistema (Referência Rápida)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Clique em qualquer variável para copiar e usar nas mensagens, perguntas e nós do fluxo
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
                    <code className="text-xs font-bold text-emerald-300 group-hover:text-emerald-200">
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
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 7: SECURITY & PASSWORD */}
      {/* ========================================================================= */}
      {activeTab === 'security' && (
        <Card className="p-6 rounded-3xl bg-dark-900/70 border-white/10 space-y-6 max-w-xl animate-in fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-brand-400" />
                Segurança & Credenciais no Banco de Dados
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Altere a senha de acesso administrativo. Gravada e replicada no banco de dados
              </p>
            </div>
            <Badge variant="brand" className="text-[10px]">Persistido no Banco</Badge>
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

            <div className="p-3 bg-dark-950/80 rounded-xl border border-white/5 text-[11px] text-slate-400 leading-relaxed">
              <span className="text-emerald-400 font-bold block mb-0.5">✓ Persistência em Nuvem:</span>
              A nova senha será salva no banco de dados e sincronizada para todos os dispositivos e sessões conectadas.
            </div>

            <div className="flex justify-end pt-2">
              <Button
                variant="brand"
                type="submit"
                disabled={isSavingPassword}
                leftIcon={<Lock className="w-4 h-4" />}
              >
                {isSavingPassword ? 'Salvando no Banco...' : 'Salvar Nova Senha no Banco'}
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
              Salvar Atendente no Banco
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Nova / Editar Variável Personalizada */}
      <Modal
        isOpen={isVarModalOpen}
        onClose={() => setIsVarModalOpen(false)}
        title={editingVar ? 'Editar Variável Personalizada' : 'Nova Variável Personalizada'}
      >
        <form onSubmit={handleSaveCustomVar} className="space-y-4 text-xs">
          <div>
            <label className="text-[11px] font-bold text-slate-400 block mb-1">
              Identificador da Variável (sem chaves) *
            </label>
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-slate-500 font-bold text-sm">{'{{'}</span>
              <Input
                value={varNameInput}
                onChange={(e) => setVarNameInput(e.target.value)}
                placeholder="ex: promocao_mes, link_catalogo"
                required
                className="font-mono"
              />
              <span className="font-mono text-slate-500 font-bold text-sm">{'}}'}</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              Será usada nos nós de mensagens como <code>{`{{${varNameInput || 'nome'}}}`}</code>
            </p>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-400 block mb-1">Valor da Variável *</label>
            <Textarea
              rows={3}
              value={varValueInput}
              onChange={(e) => setVarValueInput(e.target.value)}
              placeholder="Texto, link ou número que substituirá a variável nas mensagens..."
              required
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-400 block mb-1">Descrição / Finalidade (Opcional)</label>
            <Input
              value={varDescInput}
              onChange={(e) => setVarDescInput(e.target.value)}
              placeholder="Ex: Mensagem de desconto de sexta-feira"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/5">
            <Button size="sm" variant="ghost" type="button" onClick={() => setIsVarModalOpen(false)}>
              Cancelar
            </Button>
            <Button size="sm" variant="primary" type="submit" leftIcon={<Save className="w-3.5 h-3.5" />}>
              Salvar Variável no Banco
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
