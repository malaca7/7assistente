import React, { useState, useEffect, useRef } from 'react';
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
  Code2, 
  Check, 
  Copy, 
  Bell, 
  CreditCard, 
  Server, 
  Trash2, 
  Edit3, 
  Plus, 
  Palette,
  Upload,
  User,
  Info,
  X
} from 'lucide-react';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input, Textarea } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { QRCodeView } from '../../components/ui/QRCodeView';
import { WhatsappConnectView } from '../../components/WhatsappConnectView';
import { useToast } from '../../contexts/ToastContext';
import { useWhatsApp } from '../../contexts/WhatsAppContext';
import { useTheme } from '../../contexts/ThemeContext';
import { THEME_OPTIONS, ACCENT_OPTIONS } from '../../types/theme';
import { StorageService } from '../../lib/storage';
import { BotProfile, BotGender, BotTone, CustomVariable } from '../../types';
import { defaultBotProfile } from '../../lib/mockData';

// Preset avatar options enriquecidos com fotos profissionais, infantis e mascotes
const AVATAR_PRESETS = [
  // Femininos
  {
    gender: 'female',
    name: 'Sofia (Consultora)',
    category: 'Feminino',
    url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
  },
  {
    gender: 'female',
    name: 'Camila (Atendimento)',
    category: 'Feminino',
    url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80',
  },
  {
    gender: 'female',
    name: 'Ana (Especialista Enxoval)',
    category: 'Feminino',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
  },
  {
    gender: 'female',
    name: 'Clara (Recepção Kids)',
    category: 'Feminino',
    url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80',
  },
  {
    gender: 'female',
    name: 'Bia (Consultora Bebê)',
    category: 'Feminino',
    url: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=200&auto=format&fit=crop&q=80',
  },

  // Masculinos
  {
    gender: 'male',
    name: 'Lucas (Consultor)',
    category: 'Masculino',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
  },
  {
    gender: 'male',
    name: 'Gabriel (Especialista)',
    category: 'Masculino',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
  },
  {
    gender: 'male',
    name: 'Pedro (Atendimento)',
    category: 'Masculino',
    url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop&q=80',
  },
  {
    gender: 'male',
    name: 'André (Suporte Comercial)',
    category: 'Masculino',
    url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&auto=format&fit=crop&q=80',
  },

  // Mascotes / 3D / Neutros
  {
    gender: 'neutral',
    name: 'Pitoco Logo Oficial',
    category: 'Institucional',
    url: 'https://pitoco.malaca.com.br/logo.png',
  },
  {
    gender: 'neutral',
    name: 'Ursinho Pitoco 3D',
    category: 'Mascote',
    url: 'https://images.unsplash.com/photo-1559454403-b8fb88521f11?w=200&auto=format&fit=crop&q=80',
  },
  {
    gender: 'neutral',
    name: 'Robô Cyber IA',
    category: 'Tecnologia',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80',
  },
];

// Helper para obter variáveis de gênero e tratamento do assistente
export const getGenderVariables = (g: BotGender) => {
  if (g === 'female') {
    return {
      artigo: 'a',
      pronome: 'ela',
      tratamento: 'da',
      saudacao: 'bem-vinda',
      termo: 'assistente'
    };
  } else if (g === 'male') {
    return {
      artigo: 'o',
      pronome: 'ele',
      tratamento: 'do',
      saudacao: 'bem-vindo',
      termo: 'assistente'
    };
  } else {
    return {
      artigo: 'o(a)',
      pronome: 'ele(a)',
      tratamento: 'do(a)',
      saudacao: 'bem-vindo(a)',
      termo: 'assistente virtual'
    };
  }
};

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
    setCustomBackendUrl,
    refreshStatus
  } = useWhatsApp();

  const { 
    themeMode, 
    brightness, 
    contrast, 
    accentColor, 
    openThemeModal, 
    setThemeMode, 
    setAccentColor, 
    currentUserIdentifier 
  } = useTheme();

  // Aba inicial agora é 'profile' (Perfil do Assistente). WhatsApp Conexão será a última aba.
  const [activeTab, setActiveTab] = useState<string>('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [customServerInput, setCustomServerInput] = useState(backendUrl || 'https://pitoco.discloud.app');
  const [isTestingServer, setIsTestingServer] = useState(false);

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

  // Upload Avatar State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Company Details & Pix State
  const [companyAddress, setCompanyAddress] = useState('Rua Principal, 100 - Centro');
  const [pixKeyType, setPixKeyType] = useState('telefone');
  const [pixKey, setPixKey] = useState('81996138924');
  const [pixOwner, setPixOwner] = useState('Pitoco de Gente Artigos Infantis LTDA');

  // Notifications State
  const [notifyNewBookings, setNotifyNewBookings] = useState(true);
  const [notifyPhone, setNotifyPhone] = useState('81996138924');
  const [playAudioAlerts, setPlayAudioAlerts] = useState(true);

  // Custom Variables State
  const [customVariables, setCustomVariables] = useState<CustomVariable[]>([]);
  const [isVarModalOpen, setIsVarModalOpen] = useState(false);
  const [editingVar, setEditingVar] = useState<CustomVariable | null>(null);
  const [varNameInput, setVarNameInput] = useState('');
  const [varValueInput, setVarValueInput] = useState('');
  const [varDescInput, setVarDescInput] = useState('');

  // Sincroniza e cria as variáveis de tratamento do bot com base no gênero
  const syncGenderVariables = async (selectedGender: BotGender) => {
    const gVars = getGenderVariables(selectedGender);
    const varsToSync = [
      {
        key: 'artigo_assistente',
        name: '{{artigo_assistente}}',
        value: gVars.artigo,
        description: `Artigo do assistente (${selectedGender === 'female' ? 'feminino "a"' : selectedGender === 'male' ? 'masculino "o"' : 'neutro "o(a)"'})`
      },
      {
        key: 'pronome_assistente',
        name: '{{pronome_assistente}}',
        value: gVars.pronome,
        description: `Pronome do assistente (${selectedGender === 'female' ? 'ela' : selectedGender === 'male' ? 'ele' : 'ele(a)'})`
      },
      {
        key: 'tratamento_assistente',
        name: '{{tratamento_assistente}}',
        value: gVars.tratamento,
        description: `Artigo de tratamento (ex: "falar com a consultoria ${gVars.tratamento} Pitoco")`
      },
      {
        key: 'saudacao_assistente',
        name: '{{saudacao_assistente}}',
        value: gVars.saudacao,
        description: `Saudação do assistente (ex: "${gVars.saudacao}")`
      },
      {
        key: 'termo_assistente',
        name: '{{termo_assistente}}',
        value: gVars.termo,
        description: `Classificação do assistente (ex: "${gVars.termo}")`
      },
    ];

    for (const item of varsToSync) {
      try {
        await StorageService.saveCustomVariable({
          id: `var-${item.key}`,
          key: item.key,
          name: item.name,
          value: item.value,
          description: item.description,
        });
      } catch (e) {
        console.error('Erro ao salvar variável de gênero:', item.key, e);
      }
    }

    try {
      const vars = await StorageService.getCustomVariables();
      setCustomVariables(vars);
    } catch {}
  };

  // Load configuration data on mount
  useEffect(() => {
    const loadAllData = async () => {
      try {
        const [savedProfile, savedSettings, savedVars] = await Promise.all([
          StorageService.getBotProfile(),
          StorageService.getSettings(),
          StorageService.getCustomVariables(),
        ]);

        if (savedProfile) {
          setBotName(savedProfile.name || defaultBotProfile.name);
          setCompanyName(savedProfile.company_name || defaultBotProfile.company_name);
          const currentGender = (savedProfile.gender as BotGender) || defaultBotProfile.gender;
          setGender(currentGender);
          setTone(savedProfile.tone || defaultBotProfile.tone);
          setAvatarUrl(savedProfile.avatar_url || defaultBotProfile.avatar_url);
          setSupportPhone(savedProfile.support_phone || defaultBotProfile.support_phone);
          setSupportEmail(savedProfile.support_email || defaultBotProfile.support_email);
          setBusinessHours(savedProfile.business_hours || defaultBotProfile.business_hours);
          setWebsiteUrl(savedProfile.website_url || defaultBotProfile.website_url);
          if (savedProfile.company_address) setCompanyAddress(savedProfile.company_address);
          if (savedProfile.pix_key_type) setPixKeyType(savedProfile.pix_key_type);
          if (savedProfile.pix_key) setPixKey(savedProfile.pix_key);
          if (savedProfile.pix_owner) setPixOwner(savedProfile.pix_owner);
          if (typeof savedProfile.notify_new_bookings === 'boolean') setNotifyNewBookings(savedProfile.notify_new_bookings);
          if (savedProfile.notify_phone) setNotifyPhone(savedProfile.notify_phone);
          if (typeof savedProfile.play_audio_alerts === 'boolean') setPlayAudioAlerts(savedProfile.play_audio_alerts);

          // Inicializar variáveis de gênero caso ainda não existam
          syncGenderVariables(currentGender);
        }

        if (savedSettings) {
          if (savedSettings.backend_url) setCustomServerInput(savedSettings.backend_url);
        }

        if (savedVars) {
          setCustomVariables(savedVars);
        }
      } catch (e) {
        console.error('Error loading configuration data:', e);
      }
    };

    loadAllData();
  }, []);

  // Mudança de Gênero com atualização instantânea de variáveis
  const handleGenderChange = async (newGender: BotGender) => {
    setGender(newGender);
    await syncGenderVariables(newGender);
    info(
      'Gênero & Tratamento Atualizados',
      `Variáveis de tratamento configuradas para gênero ${newGender === 'female' ? 'feminino ("a", "ela", "da")' : newGender === 'male' ? 'masculino ("o", "ele", "do")' : 'neutro ("o(a)", "ele(a)", "do(a)")'}.`
    );
  };

  // Upload de Imagem do Avatar
  const handleAvatarFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toastError('Arquivo inválido', 'Selecione uma imagem válida (PNG, JPG, JPEG ou WebP).');
      return;
    }

    setIsUploadingAvatar(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        try {
          // Criar canvas 256x256 com crop centralizado quadrado
          const canvas = document.createElement('canvas');
          const size = 256;
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            const minDim = Math.min(img.width, img.height);
            const startX = (img.width - minDim) / 2;
            const startY = (img.height - minDim) / 2;
            ctx.drawImage(img, startX, startY, minDim, minDim, 0, 0, size, size);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
            setAvatarUrl(dataUrl);
            success('Foto Carregada com Sucesso', 'Avatar personalizado definido. Clique em "Salvar Alterações" para persistir no banco.');
          }
        } catch (err: any) {
          toastError('Erro ao processar imagem', err.message || 'Falha ao redimensionar.');
        } finally {
          setIsUploadingAvatar(false);
        }
      };
      img.onerror = () => {
        toastError('Erro ao ler imagem', 'Não foi possível carregar o arquivo selecionado.');
        setIsUploadingAvatar(false);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Save Bot Profile & Commercial Details
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
      await syncGenderVariables(gender);

      success('Perfil Atualizado com Sucesso', 'Identidade do assistente e variáveis de gênero gravadas no banco de dados.');
    } catch (err: any) {
      toastError('Erro ao salvar', err.message || 'Falha ao gravar configurações');
    } finally {
      setIsSaving(false);
    }
  };

  // Backend URL Handlers (Tab WhatsApp Conexão)
  const handleSaveBackendUrl = async () => {
    setIsTestingServer(true);
    try {
      setCustomBackendUrl(customServerInput);
      await StorageService.updateSettings({ backend_url: customServerInput });
      success('URL Salva no Banco de Dados', `Servidor configurado e gravado: ${customServerInput}`);
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
    } catch {
      toastError('Falha ao conectar no servidor', 'Verifique se a aplicação está online no Discloud.');
    } finally {
      setIsTestingServer(false);
    }
  };

  // Custom Variables Handlers
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

  const currentGenderVars = getGenderVariables(gender);

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
              <Badge variant="brand" className="text-[10px] py-0 px-2">Discloud & Banco Ativo</Badge>
            </h1>
            <p className="text-xs text-slate-400">
              Gerencie a identidade do robô, dados comerciais, tema, variáveis e a conexão WhatsApp
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

      {/* Tabs Bar: Reordenada com Conexão WhatsApp por ÚLTIMO */}
      <div className="flex items-center gap-1.5 p-1.5 bg-dark-900/80 rounded-2xl border border-white/5 overflow-x-auto">
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
          onClick={() => setActiveTab('theme')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
            activeTab === 'theme'
              ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Palette className="w-4 h-4" />
          <span>Tema & Aparência</span>
        </button>

        {/* Conexão WhatsApp Meta Cloud API & QR Code AGORA É A ÚLTIMA ABA */}
        <button
          onClick={() => setActiveTab('whatsapp_qr')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
            activeTab === 'whatsapp_qr'
              ? 'bg-emerald-500 text-slate-950 font-bold shadow-lg shadow-emerald-500/20'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Smartphone className="w-4 h-4 text-emerald-400" />
          <span>Conexão WhatsApp (QR Code & Meta)</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: BOT PROFILE & PERSONALITY */}
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
                  Configure o nome, avatar, tom de voz e artigos de tratamento salvos no banco de dados
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
                  placeholder="Ex: Pitoco Bot ou Sofia"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Nome da Empresa / Loja *</label>
                <Input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Ex: Pitoco de Gente"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Gênero do Personagem / Bot</label>
                <select
                  value={gender}
                  onChange={(e) => handleGenderChange(e.target.value as BotGender)}
                  className="w-full bg-dark-800 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-brand-500 focus:outline-none"
                >
                  <option value="female">Feminino (Ela / A assistente)</option>
                  <option value="male">Masculino (Ele / O assistente)</option>
                  <option value="neutral">Neutro / Institucional (O(a) assistente)</option>
                </select>
                <p className="text-[10px] text-slate-500 mt-1">
                  Define automaticamente as variáveis globais de artigo, pronome e tratamento.
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Tom de Voz</label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value as BotTone)}
                  className="w-full bg-dark-800 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-brand-500 focus:outline-none"
                >
                  <option value="Amigável e Acolhedor">Amigável e Acolhedor</option>
                  <option value="Profissional e Direto">Profissional e Direto</option>
                  <option value="Descontraído e Moderno">Descontraído e Moderno</option>
                  <option value="Consultor / Especialista">Consultor / Especialista</option>
                </select>
              </div>
            </div>

            {/* Caixa Informativa de Variáveis de Tratamento por Gênero */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-brand-950/40 via-indigo-950/30 to-dark-950/60 border border-brand-500/20 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-brand-300">
                  <Sparkles className="w-4 h-4 text-brand-400" />
                  <span>Variáveis Globais de Tratamento Ativas (Gênero: {gender === 'female' ? 'Feminino' : gender === 'male' ? 'Masculino' : 'Neutro'})</span>
                </div>
                <Badge variant="brand" className="text-[9px] py-0 px-2">Atualizado Automático</Badge>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Estas variáveis são atualizadas no banco de dados e podem ser inseridas em qualquer mensagem dos fluxos de atendimento:
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                <div 
                  onClick={() => handleCopy('{{artigo_assistente}}', 'artigo_assistente')}
                  className="p-2.5 rounded-xl bg-dark-900/80 border border-white/5 hover:border-brand-500/40 cursor-pointer transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Artigo</span>
                    {copiedField === 'artigo_assistente' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-500 group-hover:text-brand-300" />}
                  </div>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <code className="text-xs font-mono font-bold text-brand-300">"{currentGenderVars.artigo}"</code>
                    <span className="text-[10px] text-slate-400 font-mono">{'{{artigo_assistente}}'}</span>
                  </div>
                </div>

                <div 
                  onClick={() => handleCopy('{{pronome_assistente}}', 'pronome_assistente')}
                  className="p-2.5 rounded-xl bg-dark-900/80 border border-white/5 hover:border-brand-500/40 cursor-pointer transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Pronome</span>
                    {copiedField === 'pronome_assistente' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-500 group-hover:text-brand-300" />}
                  </div>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <code className="text-xs font-mono font-bold text-indigo-300">"{currentGenderVars.pronome}"</code>
                    <span className="text-[10px] text-slate-400 font-mono">{'{{pronome_assistente}}'}</span>
                  </div>
                </div>

                <div 
                  onClick={() => handleCopy('{{tratamento_assistente}}', 'tratamento_assistente')}
                  className="p-2.5 rounded-xl bg-dark-900/80 border border-white/5 hover:border-brand-500/40 cursor-pointer transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Tratamento</span>
                    {copiedField === 'tratamento_assistente' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-500 group-hover:text-brand-300" />}
                  </div>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <code className="text-xs font-mono font-bold text-amber-300">"{currentGenderVars.tratamento}"</code>
                    <span className="text-[10px] text-slate-400 font-mono">{'{{tratamento_assistente}}'}</span>
                  </div>
                </div>

                <div 
                  onClick={() => handleCopy('{{saudacao_assistente}}', 'saudacao_assistente')}
                  className="p-2.5 rounded-xl bg-dark-900/80 border border-white/5 hover:border-brand-500/40 cursor-pointer transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Saudação</span>
                    {copiedField === 'saudacao_assistente' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-500 group-hover:text-brand-300" />}
                  </div>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <code className="text-xs font-mono font-bold text-emerald-300">"{currentGenderVars.saudacao}"</code>
                    <span className="text-[10px] text-slate-400 font-mono">{'{{saudacao_assistente}}'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Avatar Selector & Upload de Imagem */}
            <div className="space-y-3 pt-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block">Avatar do Assistente</label>
                  <p className="text-[11px] text-slate-500">Escolha um dos modelos abaixo ou faça upload de sua própria foto</p>
                </div>

                {/* Botão de Upload Customizado */}
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleAvatarFileUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isUploadingAvatar}
                    onClick={() => fileInputRef.current?.click()}
                    leftIcon={<Upload className="w-3.5 h-3.5 text-brand-400" />}
                    className="text-xs font-semibold"
                  >
                    {isUploadingAvatar ? 'Processando foto...' : 'Fazer Upload de Foto'}
                  </Button>

                  {avatarUrl && !AVATAR_PRESETS.some(p => p.url === avatarUrl) && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setAvatarUrl(AVATAR_PRESETS[0].url)}
                      leftIcon={<X className="w-3.5 h-3.5 text-rose-400" />}
                      className="text-xs text-rose-400 hover:text-rose-300"
                    >
                      Remover Foto
                    </Button>
                  )}
                </div>
              </div>

              {/* Preview do Avatar Selecionado */}
              <div className="flex items-center gap-4 p-3 bg-dark-950/70 rounded-2xl border border-white/5">
                <div className="w-16 h-16 rounded-2xl overflow-hidden bg-brand-500/20 border-2 border-brand-500/40 p-0.5 shadow-lg shadow-brand-500/10 flex-shrink-0">
                  <img
                    src={avatarUrl || AVATAR_PRESETS[0].url}
                    alt="Avatar Atual"
                    className="w-full h-full object-cover rounded-[14px]"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = AVATAR_PRESETS[0].url;
                    }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">Avatar Ativo no Robô</span>
                    {!AVATAR_PRESETS.some(p => p.url === avatarUrl) ? (
                      <Badge variant="brand" className="text-[9px] py-0 px-2 bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
                        Foto Personalizada
                      </Badge>
                    ) : (
                      <Badge variant="brand" className="text-[9px] py-0 px-2">
                        {AVATAR_PRESETS.find(p => p.url === avatarUrl)?.category || 'Preset'}
                      </Badge>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">
                    {AVATAR_PRESETS.find(p => p.url === avatarUrl)?.name || 'Imagem carregada por você'}
                  </p>
                </div>
              </div>

              {/* Grid de Presets Expandidos */}
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 pt-1">
                {AVATAR_PRESETS.map((p, idx) => {
                  const isSelected = avatarUrl === p.url;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setAvatarUrl(p.url)}
                      className={`p-2.5 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 relative group ${
                        isSelected
                          ? 'border-brand-500 bg-brand-500/10 ring-2 ring-brand-500/30 shadow-glow-brand'
                          : 'border-white/5 bg-dark-950/60 hover:border-white/20 hover:bg-white/[0.02]'
                      }`}
                    >
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-dark-900 border border-white/5 relative">
                        <img src={p.url} alt={p.name} className="w-full h-full object-cover" />
                        {isSelected && (
                          <div className="absolute inset-0 bg-brand-500/20 flex items-center justify-center">
                            <Check className="w-4 h-4 text-white drop-shadow-md" />
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-300 font-medium truncate w-full text-center">
                        {p.name.split(' ')[0]}
                      </span>
                      <span className="text-[8px] text-slate-500 uppercase font-semibold">
                        {p.category}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Aviso Amigável: Mensagens Controladas via Studio de Fluxos */}
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-dark-950/80 border border-white/5 text-xs text-slate-400">
              <Info className="w-4 h-4 text-brand-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-semibold text-slate-300">
                  Fluxos de Mensagens & Respostas Automatizadas
                </p>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  As mensagens de boas-vindas, resposta, contingência e transbordo humano agora são controladas e editadas visualmente no <strong>Studio de Fluxos</strong>, oferecendo total liberdade e flexibilidade de automação.
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                variant="brand"
                type="submit"
                disabled={isSaving}
                leftIcon={<Save className="w-4 h-4" />}
                className="font-bold shadow-glow-brand"
              >
                {isSaving ? 'Salvando no Banco...' : 'Salvar Alterações no Banco'}
              </Button>
            </div>
          </Card>
        </form>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: COMPANY, PIX & NOTIFICATIONS */}
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
                placeholder="contato@pitocodegente.com.br"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Website Oficial / Link da Bio</label>
              <Input
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://pitoco.malaca.com.br"
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
                  className="w-full bg-dark-800 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
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
                  placeholder="Pitoco de Gente Artigos Infantis LTDA"
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
              className="font-bold shadow-glow-brand"
            >
              {isSaving ? 'Salvando no Banco...' : 'Salvar Dados Comerciais no Banco'}
            </Button>
          </div>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: GLOBAL & CUSTOM VARIABLES */}
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
                  Clique em "Nova Variável" para adicionar constantes como promoções, links ou avisos.
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
                { code: '{{artigo_assistente}}', desc: `Artigo do assistente (${currentGenderVars.artigo})` },
                { code: '{{pronome_assistente}}', desc: `Pronome do assistente (${currentGenderVars.pronome})` },
                { code: '{{tratamento_assistente}}', desc: `Tratamento do assistente (${currentGenderVars.tratamento})` },
                { code: '{{saudacao_assistente}}', desc: `Saudação de gênero (${currentGenderVars.saudacao})` },
                { code: '{{nome_cliente}}', desc: 'Nome informado pelo cliente ou contato' },
                { code: '{{telefone_cliente}}', desc: 'Número WhatsApp de quem está falando' },
                { code: '{{bot_nome}}', desc: 'Nome do seu assistente configurado' },
                { code: '{{empresa}}', desc: 'Nome da sua loja / Pitoco de Gente' },
                { code: '{{horario_atendimento}}', desc: 'Horário de funcionamento comercial' },
                { code: '{{suporte_telefone}}', desc: 'Telefone comercial de suporte' },
                { code: '{{suporte_email}}', desc: 'E-mail oficial de contato' },
                { code: '{{site_empresa}}', desc: 'Website oficial da empresa' },
                { code: '{{chave_pix}}', desc: 'Chave PIX configurada para pagamento' },
                { code: '{{data_formatada}}', desc: 'Data no padrão brasileiro (DD/MM/AAAA)' },
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
      {/* TAB 4: THEME & APARÊNCIA */}
      {/* ========================================================================= */}
      {activeTab === 'theme' && (
        <div className="space-y-6 animate-in fade-in">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center text-primary-400">
                    <Palette className="w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle>Tema & Personalização Visual do Painel</CardTitle>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Configurações salvas individualmente para <strong className="text-white">@{currentUserIdentifier}</strong>
                    </p>
                  </div>
                </div>

                <Button
                  variant="primary"
                  onClick={openThemeModal}
                  className="flex items-center gap-2 text-xs"
                >
                  <Palette className="w-4 h-4" />
                  Abrir Configurador Completo
                </Button>
              </div>
            </CardHeader>

            {/* Quick overview of active theme settings */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-2">
              <div className="bg-dark-950/60 p-4 rounded-xl border border-white/5">
                <span className="text-[11px] font-semibold text-slate-400 block uppercase">Tema Atual</span>
                <span className="text-base font-bold text-white mt-1 block">
                  {THEME_OPTIONS.find(t => t.id === themeMode)?.name || themeMode}
                </span>
                <span className="text-xs text-slate-500 mt-0.5 block">
                  {themeMode.startsWith('dark') ? '🌙 Opção Escura' : '☀️ Opção Clara'}
                </span>
              </div>

              <div className="bg-dark-950/60 p-4 rounded-xl border border-white/5">
                <span className="text-[11px] font-semibold text-slate-400 block uppercase">Cor de Destaque</span>
                <div className="flex items-center gap-2 mt-1">
                  <span 
                    className="w-3.5 h-3.5 rounded-full shadow-sm"
                    style={{ backgroundColor: ACCENT_OPTIONS.find(a => a.id === accentColor)?.hex }}
                  />
                  <span className="text-base font-bold text-white">
                    {ACCENT_OPTIONS.find(a => a.id === accentColor)?.name || accentColor}
                  </span>
                </div>
                <span className="text-xs text-slate-500 mt-0.5 block">Acentos, botões e badges</span>
              </div>

              <div className="bg-dark-950/60 p-4 rounded-xl border border-white/5">
                <span className="text-[11px] font-semibold text-slate-400 block uppercase">Brilho</span>
                <span className="text-base font-bold text-white mt-1 block font-mono">
                  {brightness}%
                </span>
                <span className="text-xs text-slate-500 mt-0.5 block">
                  {brightness === 100 ? 'Calibração normal' : brightness > 100 ? 'Mais iluminado' : 'Atenuado'}
                </span>
              </div>

              <div className="bg-dark-950/60 p-4 rounded-xl border border-white/5">
                <span className="text-[11px] font-semibold text-slate-400 block uppercase">Contraste</span>
                <span className="text-base font-bold text-white mt-1 block font-mono">
                  {contrast}%
                </span>
                <span className="text-xs text-slate-500 mt-0.5 block">
                  {contrast === 100 ? 'Contraste balanceado' : contrast > 100 ? 'Alto contraste' : 'Suave'}
                </span>
              </div>
            </div>

            {/* Quick switcher buttons */}
            <div className="mt-6 pt-6 border-t border-white/5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Seleção Rápida de Tema (3 Escuros e 2 Claros)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {THEME_OPTIONS.map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setThemeMode(opt.id)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      themeMode === opt.id
                        ? 'border-white bg-white/10 ring-1 ring-white/30 shadow-md'
                        : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/15'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-white">{opt.name}</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-zinc-300">
                        {opt.category === 'dark' ? '🌙' : '☀️'}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">
                      {opt.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Quick accent color picker */}
            <div className="mt-6 pt-6 border-t border-white/5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Paleta de Cores de Acento
              </h4>
              <div className="flex flex-wrap gap-2.5">
                {ACCENT_OPTIONS.map(acc => (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => setAccentColor(acc.id)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                      accentColor === acc.id
                        ? 'border-white bg-white/10 ring-2 ring-white/20'
                        : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.05]'
                    }`}
                  >
                    <span 
                      className="w-3.5 h-3.5 rounded-full shadow-sm"
                      style={{ backgroundColor: acc.hex }}
                    />
                    <span className="text-zinc-200">{acc.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: META WHATSAPP BUSINESS PLATFORM / CLOUD API (ÚLTIMA ABA DA PÁGINA) */}
      {/* ========================================================================= */}
      {activeTab === 'whatsapp_qr' && (
        <div className="animate-in fade-in space-y-6">
          <WhatsappConnectView />
        </div>
      )}

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
