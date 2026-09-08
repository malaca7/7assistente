import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  ShieldCheck, 
  ShieldAlert, 
  Lock, 
  Key, 
  User, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Crown, 
  Store as StoreIcon, 
  Heart, 
  Sparkles, 
  Building2, 
  Check, 
  X,
  Eye,
  EyeOff,
  Layers,
  LayoutDashboard,
  MessageSquareText,
  ShoppingBag,
  LifeBuoy,
  GitFork,
  QrCode,
  Bot,
  Settings as SettingsIcon
} from 'lucide-react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Modal } from './ui/Modal';
import { StorageService } from '../lib/storage';
import { SystemAccessUser, SystemRole, Store } from '../types';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';

export interface PanelDefinition {
  id: 'admin' | 'gerente' | 'atendimento';
  label: string;
  path: string;
  desc: string;
  category: string;
  icon: any;
  color: string;
  badge: string;
}

export const SYSTEM_PANELS: PanelDefinition[] = [
  { 
    id: 'admin', 
    label: 'Painel Administrador (/admin)', 
    path: '/admin',
    desc: 'Acesso total: Studio de Fluxos, automações do robô WhatsApp, chaves PIX, configurações gerais, banco de dados, gestão de acessos e atendimento avançado (lixeira, apagar mensagem individual, notas confidenciais de admin e gerenciamento de setores).', 
    category: 'Diretoria & Sistema', 
    icon: ShieldCheck,
    color: 'from-amber-500/20 to-amber-600/5 text-amber-300 border-amber-500/40',
    badge: 'Acesso Total'
  },
  { 
    id: 'gerente', 
    label: 'Painel Gestão (/gerente)', 
    path: '/gerente',
    desc: 'Visão executiva de loja e rede: dashboard de vendas, faturamento, supervisão de conversas da equipe, acompanhamento de catálogo e clientes.', 
    category: 'Gerência & Supervisão', 
    icon: LayoutDashboard,
    color: 'from-emerald-500/20 to-emerald-600/5 text-emerald-300 border-emerald-500/40',
    badge: 'Supervisão'
  },
  { 
    id: 'atendimento', 
    label: 'Painel Atendimento (/atendimento)', 
    path: '/atendimento',
    desc: 'Inbox WhatsApp em tempo real: envio de catálogo de produtos com foto e detalhes direto no chat, troca de setor e auto-assumir ao responder. Sem botões de exclusão ou edição.', 
    category: 'Vendas & Operação', 
    icon: MessageSquareText,
    color: 'from-pink-500/20 to-pink-600/5 text-pink-300 border-pink-500/40',
    badge: 'Operação Direta'
  },
];

export const AccessManagementView: React.FC = () => {
  const { user: currentAdmin } = useAuth();
  const { success, error: toastError, info } = useToast();

  const [users, setUsers] = useState<SystemAccessUser[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPanelFilter, setSelectedPanelFilter] = useState<string>('all');
  const [selectedStoreFilter, setSelectedStoreFilter] = useState<string>('all');

  // Modal de Criação / Edição de Usuário
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<SystemAccessUser | null>(null);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [selectedPanels, setSelectedPanels] = useState<string[]>([]);
  const [storeId, setStoreId] = useState<string>('all');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Modal de Troca Rápida de Senha
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [targetUserForPassword, setTargetUserForPassword] = useState<SystemAccessUser | null>(null);
  const [newPassword, setNewPassword] = useState('');

  // Modal de Confirmação de Exclusão
  const [userToDelete, setUserToDelete] = useState<SystemAccessUser | null>(null);

  const loadData = async () => {
    try {
      const [usersData, storesData] = await Promise.all([
        StorageService.getAccessUsers(),
        StorageService.getStores(),
      ]);
      setUsers(usersData);
      setStores(storesData);
    } catch (err) {
      console.error('Erro ao carregar dados de acesso:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadData();
  };

  // Alternar seleção de um painel individual
  const handleTogglePanel = (panelId: string) => {
    setSelectedPanels(prev => 
      prev.includes(panelId) 
        ? prev.filter(id => id !== panelId) 
        : [...prev, panelId]
    );
  };

  // Marcar todos os painéis
  const handleSelectAllPanels = () => {
    setSelectedPanels(SYSTEM_PANELS.map(p => p.id));
  };

  // Desmarcar todos os painéis
  const handleDeselectAllPanels = () => {
    setSelectedPanels([]);
  };

  // Presets rápidos
  const handleSetPreset = (presetType: 'atendimento' | 'gerente' | 'total') => {
    if (presetType === 'atendimento') {
      setSelectedPanels(['atendimento']);
    } else if (presetType === 'gerente') {
      setSelectedPanels(['gerente', 'atendimento']);
    } else if (presetType === 'total') {
      setSelectedPanels(['admin', 'gerente', 'atendimento']);
    }
  };

  // Abrir Modal de Criação
  const handleOpenCreateModal = () => {
    setEditingUser(null);
    setName('');
    setUsername('');
    setPassword('123456');
    setSelectedPanels(['atendimento']); // default útil
    setStoreId('all');
    setStatus('active');
    setIsModalOpen(true);
  };

  // Abrir Modal de Edição
  const handleOpenEditModal = (u: SystemAccessUser) => {
    setEditingUser(u);
    setName(u.name);
    setUsername(u.username);
    setPassword(u.password || '');

    // Se o usuário tiver panels ou allowed_panels definidos, carrega eles; caso contrário infere pelos legados
    if (Array.isArray(u.panels) && u.panels.length > 0) {
      setSelectedPanels(u.panels);
    } else if (Array.isArray(u.allowed_panels) && u.allowed_panels.length > 0) {
      const valid = u.allowed_panels.filter(p => ['admin', 'gerente', 'atendimento'].includes(p));
      setSelectedPanels(valid.length > 0 ? valid : ['atendimento']);
    } else if (u.role === 'ceo' || u.role === 'admin') {
      setSelectedPanels(['admin', 'gerente', 'atendimento']);
    } else if (u.role === 'manager') {
      setSelectedPanels(['gerente']);
    } else {
      setSelectedPanels(['atendimento']);
    }

    setStoreId(u.store_id || 'all');
    setStatus(u.status);
    setIsModalOpen(true);
  };

  // Abrir Modal de Troca de Senha
  const handleOpenPasswordModal = (u: SystemAccessUser) => {
    setTargetUserForPassword(u);
    setNewPassword('');
    setIsPasswordModalOpen(true);
  };

  // Salvar Usuário (Criar ou Atualizar)
  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanUser = username.trim().toLowerCase();
    const cleanPass = password.trim();

    // 1. Validação Estrita: Usuário APENAS LETRAS
    if (!cleanUser || !/^[a-zA-Z]+$/.test(cleanUser)) {
      toastError('Usuário Inválido', 'O nome de usuário deve conter exclusivamente letras (sem números, espaços ou símbolos).');
      return;
    }

    // 2. Validação Estrita: Senha APENAS NÚMEROS
    if (!cleanPass || !/^[0-9]+$/.test(cleanPass)) {
      toastError('Senha Inválida', 'A senha de acesso deve conter exclusivamente dígitos numéricos (sem letras ou símbolos).');
      return;
    }

    if (!name.trim()) {
      toastError('Campo Obrigatório', 'Informe o nome completo do usuário.');
      return;
    }

    if (selectedPanels.length === 0) {
      toastError('Selecione os Painéis', 'Marque pelo menos um painel que este usuário terá permissão para acessar.');
      return;
    }

    // Verificar unicidade de usuário se novo
    if (!editingUser) {
      const exists = users.some(u => u.username.toLowerCase() === cleanUser);
      if (exists) {
        toastError('Usuário Já Existe', `O usuário @${cleanUser} já está cadastrado no sistema.`);
        return;
      }
    }

    setIsSaving(true);
    try {
      const assignedStore = stores.find(s => s.id === storeId);
      const storeName = storeId === 'all' ? 'Toda a Rede (Global)' : assignedStore?.name;

      const derivedRole: SystemRole = selectedPanels.includes('admin')
        ? 'admin'
        : selectedPanels.includes('gerente')
          ? 'manager'
          : 'attendant';

      const userPayload: Partial<SystemAccessUser> = {
        id: editingUser?.id,
        name: name.trim(),
        username: cleanUser,
        password: cleanPass,
        role: derivedRole,
        panels: selectedPanels as any,
        allowed_panels: selectedPanels,
        store_id: storeId === 'all' ? null : storeId,
        store_name: storeName,
        status,
        created_at: editingUser?.created_at,
      };

      await StorageService.saveAccessUser(userPayload);
      success(
        editingUser ? 'Acesso Atualizado!' : 'Novo Acesso Criado!',
        `Usuário @${cleanUser} configurado com ${selectedPanels.length} painel(is) permitido(s).`
      );
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      toastError('Erro ao Salvar', err.message || 'Falha ao processar dados do usuário.');
    } finally {
      setIsSaving(false);
    }
  };

  // Salvar Nova Senha Numérica
  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUserForPassword) return;

    const cleanPass = newPassword.trim();
    if (!cleanPass || !/^[0-9]+$/.test(cleanPass)) {
      toastError('Senha Inválida', 'A senha de acesso deve conter apenas números (sem letras ou símbolos).');
      return;
    }

    try {
      await StorageService.saveAccessUser({
        ...targetUserForPassword,
        password: cleanPass,
      });
      success('Senha Redefinida!', `A nova senha numérica para @${targetUserForPassword.username} foi salva com sucesso.`);
      setIsPasswordModalOpen(false);
      setTargetUserForPassword(null);
      loadData();
    } catch (err: any) {
      toastError('Erro ao Redefinir Senha', err.message);
    }
  };

  // Alternar Status Ativo / Inativo
  const handleToggleStatus = async (user: SystemAccessUser) => {
    try {
      await StorageService.toggleAccessUserStatus(user.id);
      const nextStatus = user.status === 'active' ? 'desativado' : 'ativado';
      success(`Usuário @${user.username} ${nextStatus}!`);
      loadData();
    } catch (err: any) {
      toastError('Erro ao alternar status', err.message);
    }
  };

  // Excluir Usuário
  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    try {
      await StorageService.deleteAccessUser(userToDelete.id);
      success('Usuário Removido', `O acesso de @${userToDelete.username} foi excluído.`);
      setUserToDelete(null);
      loadData();
    } catch (err: any) {
      toastError('Erro ao excluir usuário', err.message);
    }
  };

  // Filtragem de Usuários
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchSearch = 
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.username.toLowerCase().includes(searchTerm.toLowerCase());

      const userPanels: string[] = Array.isArray(u.panels) && u.panels.length > 0
        ? u.panels
        : Array.isArray(u.allowed_panels) && u.allowed_panels.length > 0
        ? u.allowed_panels.filter(p => ['admin', 'gerente', 'atendimento'].includes(p))
        : u.role === 'ceo' || u.role === 'admin'
          ? ['admin', 'gerente', 'atendimento']
          : u.role === 'manager'
            ? ['gerente']
            : ['atendimento'];

      const matchPanel = 
        selectedPanelFilter === 'all' 
          ? true 
          : userPanels.includes(selectedPanelFilter);

      const matchStore = 
        selectedStoreFilter === 'all' 
          ? true 
          : selectedStoreFilter === 'global' 
            ? !u.store_id 
            : u.store_id === selectedStoreFilter;

      return matchSearch && matchPanel && matchStore;
    });
  }, [users, searchTerm, selectedPanelFilter, selectedStoreFilter]);

  // Contadores Estatísticos
  const stats = useMemo(() => {
    const total = users.length;
    const activeCount = users.filter(u => u.status === 'active').length;
    const adminCount = users.filter(u => (u.panels || u.allowed_panels || []).includes('admin') || u.role === 'ceo' || u.role === 'admin').length;
    const attendantCount = users.filter(u => (u.panels || u.allowed_panels || []).includes('atendimento') || u.role === 'attendant').length;
    return { total, activeCount, adminCount, attendantCount };
  }, [users]);

  // Helper para obter o label de um painel
  const getPanelLabel = (panelId: string) => {
    const found = SYSTEM_PANELS.find(p => p.id === panelId);
    return found ? found.label.split('&')[0].trim() : panelId;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Informativo */}
      <div className="p-5 rounded-2xl bg-dark-900 border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/10 text-white border border-white/20 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5" />
              Gestão de Acessos & Painéis
            </span>
            <span className="text-xs text-slate-400">
              Controle sem Cargos Fixos
            </span>
          </div>
          <h2 className="text-xl font-bold text-white">
            Usuários e Painéis Permitidos
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Defina exatamente quais painéis cada usuário pode acessar (<strong className="text-white">Admin /admin</strong>, <strong className="text-white">Gestão /gerente</strong> ou <strong className="text-white">Atendimento /atendimento</strong>). Usuário apenas com letras [a-z] e senha apenas com números [0-9].
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="text-xs font-medium border-white/10 text-slate-300 hover:text-white flex items-center gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button
            size="sm"
            onClick={handleOpenCreateModal}
            className="bg-white text-black hover:bg-zinc-200 font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Novo Usuário / Acesso
          </Button>
        </div>
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-4 bg-dark-900 border-white/5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Total de Acessos</span>
            <Users className="w-4 h-4 text-white" />
          </div>
          <div className="text-2xl font-bold text-white mt-1">{stats.total}</div>
          <span className="text-[10px] text-slate-500">Usuários cadastrados</span>
        </Card>

        <Card className="p-4 bg-dark-900 border-white/5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Acessos Ativos</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">{stats.activeCount}</div>
          <span className="text-[10px] text-slate-500">Habilitados para login</span>
        </Card>

        <Card className="p-4 bg-dark-900 border-white/5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Com Acesso Admin</span>
            <Crown className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400 mt-1">{stats.adminCount}</div>
          <span className="text-[10px] text-slate-500">Painel /admin</span>
        </Card>

        <Card className="p-4 bg-dark-900 border-white/5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Com Atendimento</span>
            <MessageSquareText className="w-4 h-4 text-pink-400" />
          </div>
          <div className="text-2xl font-bold text-pink-400 mt-1">{stats.attendantCount}</div>
          <span className="text-[10px] text-slate-500">Painel /atendimento</span>
        </Card>
      </div>

      {/* Barra de Busca e Filtros */}
      <Card className="p-4 bg-dark-900 border-white/5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por nome ou @usuario..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-dark-800 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-white/30 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Filtro por Painel */}
            <select
              value={selectedPanelFilter}
              onChange={e => setSelectedPanelFilter(e.target.value)}
              className="px-3 py-2 bg-dark-800 border border-white/10 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-white/30 transition-colors"
            >
              <option value="all">Todos os Painéis</option>
              <option value="admin">🛡️ Painel Admin (/admin)</option>
              <option value="gerente">📊 Painel Gestão (/gerente)</option>
              <option value="atendimento">💬 Painel Atendimento (/atendimento)</option>
            </select>

            {/* Filtro por Loja */}
            <select
              value={selectedStoreFilter}
              onChange={e => setSelectedStoreFilter(e.target.value)}
              className="px-3 py-2 bg-dark-800 border border-white/10 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-white/30 transition-colors"
            >
              <option value="all">Todas as Lojas</option>
              <option value="global">Rede Inteira (Global)</option>
              {stores.map(st => (
                <option key={st.id} value={st.id}>{st.name}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Lista de Usuários */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredUsers.map((user) => {
          const userPanels: string[] = Array.isArray(user.panels) && user.panels.length > 0
            ? user.panels
            : Array.isArray(user.allowed_panels) && user.allowed_panels.length > 0
            ? user.allowed_panels.filter(p => ['admin', 'gerente', 'atendimento'].includes(p))
            : user.role === 'ceo' || user.role === 'admin'
              ? ['admin', 'gerente', 'atendimento']
              : user.role === 'manager'
                ? ['gerente']
                : ['atendimento'];

          return (
            <Card 
              key={user.id} 
              className={`p-5 bg-dark-900 border transition-all ${
                user.status === 'active' 
                  ? 'border-white/10 hover:border-white/30' 
                  : 'border-rose-500/20 opacity-75'
              }`}
            >
              {/* Header do Card */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-2xl bg-zinc-800 border border-white/10 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {user.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-white truncate">
                      {user.name}
                    </h4>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="font-mono text-xs font-bold text-white bg-white/10 px-2 py-0.5 rounded border border-white/15">
                        @{user.username}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status Switch Badge */}
                <button
                  type="button"
                  onClick={() => handleToggleStatus(user)}
                  title={user.status === 'active' ? 'Clique para desativar acesso' : 'Clique para ativar acesso'}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 transition-all ${
                    user.status === 'active'
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25'
                      : 'bg-rose-500/15 text-rose-400 border border-rose-500/30 hover:bg-rose-500/25'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'active' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                  {user.status === 'active' ? 'Ativo' : 'Bloqueado'}
                </button>
              </div>

              {/* Dados do Perfil e Painéis */}
              <div className="space-y-2.5 py-3 border-y border-white/5 my-3">
                <div className="space-y-1.5 text-xs">
                  <span className="text-slate-400 font-medium block">Painéis Permitidos:</span>
                  <div className="flex flex-col gap-1.5">
                    {userPanels.includes('admin') && (
                      <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        🛡️ Painel Admin (/admin)
                      </span>
                    )}
                    {userPanels.includes('gerente') && (
                      <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                        <LayoutDashboard className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        📊 Painel Gestão (/gerente)
                      </span>
                    )}
                    {userPanels.includes('atendimento') && (
                      <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-pink-500/15 text-pink-300 border border-pink-500/30 flex items-center gap-1.5">
                        <MessageSquareText className="w-3.5 h-3.5 text-pink-400 shrink-0" />
                        💬 Painel Atendimento (/atendimento)
                      </span>
                    )}
                    {userPanels.length === 0 && (
                      <span className="text-xs text-rose-400 italic">Nenhum painel liberado</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1 border-t border-white/[0.03]">
                  <span className="text-slate-400">Unidade Vinculada:</span>
                  <span className="text-slate-200 font-medium truncate max-w-[180px]">
                    {user.store_name || 'Toda a Rede'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Senha Numérica:</span>
                  <span className="font-mono text-white bg-white/10 px-2 py-0.5 rounded border border-white/10 text-[11px] font-bold">
                    •••••• [0-9]
                  </span>
                </div>
              </div>

              {/* Ações */}
              <div className="flex items-center justify-between gap-2 pt-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleOpenPasswordModal(user)}
                  className="text-[11px] font-semibold border-white/10 text-slate-300 hover:text-white px-2.5 py-1.5 rounded-xl flex items-center gap-1.5"
                >
                  <Key className="w-3.5 h-3.5 text-amber-400" />
                  Trocar Senha
                </Button>

                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpenEditModal(user)}
                    className="p-2 border-white/10 text-slate-300 hover:text-white rounded-xl"
                    title="Editar Acesso e Painéis"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setUserToDelete(user)}
                    className="p-2 border-white/10 text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/30 rounded-xl"
                    title="Excluir Usuário"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}

        {filteredUsers.length === 0 && (
          <div className="col-span-full p-12 text-center rounded-2xl bg-dark-900 border border-white/5">
            <Users className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white">Nenhum usuário encontrado</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Nenhum acesso corresponde aos filtros aplicados. Clique em "Novo Usuário / Acesso" para cadastrar.
            </p>
          </div>
        )}
      </div>

      {/* Modal: Criar ou Editar Usuário (com Seleção Multi-Painel, Sem Cargos Fixos) */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUser ? `Editar Acesso: @${editingUser.username}` : 'Criar Novo Acesso ao Sistema'}
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSaveUser} className="space-y-4">
          <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-zinc-300 flex items-start gap-2">
            <Sparkles className="w-4 h-4 flex-shrink-0 mt-0.5 text-white" />
            <span>
              <strong>Permissões por Painel:</strong> Selecione abaixo quais telas e módulos este acesso poderá visualizar no menu lateral e operar na plataforma.
            </span>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Nome Completo do Colaborador:
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="ex: Juliana Paes de Alencar"
              className="w-full px-3 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-white/30"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-300">
                  Nome de Usuário:
                </label>
                <span className="text-[10px] text-zinc-400 font-bold">
                  Apenas Letras [a-z]
                </span>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-white font-mono">
                  @
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value.replace(/[^a-zA-Z]/g, '').toLowerCase())}
                  placeholder="ex: juliana"
                  className="w-full pl-7 pr-3 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-white/30 font-mono"
                  required
                />
              </div>
              <span className="text-[10px] text-slate-500 block mt-1">
                Sem números, sem espaços, sem símbolos.
              </span>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-300">
                  Senha Numérica:
                </label>
                <span className="text-[10px] text-emerald-400 font-bold">
                  Apenas Números [0-9]
                </span>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  onChange={e => setPassword(e.target.value.replace(/\D/g, ''))}
                  placeholder="ex: 123456"
                  className="w-full pl-3 pr-9 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-white/30 font-mono tracking-widest"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              <span className="text-[10px] text-slate-500 block mt-1">
                Apenas dígitos numéricos de 0 a 9.
              </span>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Unidade / Loja Vinculada:
            </label>
            <select
              value={storeId}
              onChange={e => setStoreId(e.target.value)}
              className="w-full px-3 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-white/30"
            >
              <option value="all">Toda a Rede (Global)</option>
              {stores.map(st => (
                <option key={st.id} value={st.id}>{st.name}</option>
              ))}
            </select>
          </div>

          {/* SELEÇÃO MULTI-PAINEL (CONSEGUIR MARCAR MAIS DE UM PAINEL) */}
          <div className="space-y-2.5 pt-2 border-t border-white/10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <label className="text-xs font-bold text-white block">
                  Painéis que o Usuário Pode Acessar:
                </label>
                <span className="text-[11px] text-slate-400">
                  Marque os painéis liberados ({selectedPanels.length} de {SYSTEM_PANELS.length} marcados).
                </span>
              </div>

              {/* Botões Rápidos */}
              <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleSetPreset('atendimento')}
                  className="px-2 py-0.5 text-[10px] font-medium rounded-md bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 border border-white/10 transition-colors"
                >
                  Atendimento
                </button>
                <button
                  type="button"
                  onClick={() => handleSetPreset('gerente')}
                  className="px-2 py-0.5 text-[10px] font-medium rounded-md bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 border border-white/10 transition-colors"
                >
                  Gestão
                </button>
                <button
                  type="button"
                  onClick={() => handleSetPreset('total')}
                  className="px-2 py-0.5 text-[10px] font-semibold rounded-md bg-white/10 text-white hover:bg-white/20 border border-white/15 transition-colors"
                >
                  Todos os Painéis
                </button>
              </div>
            </div>

            {/* Cards dos 3 Painéis do Sistema */}
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {SYSTEM_PANELS.map((panel) => {
                const isChecked = selectedPanels.includes(panel.id);
                const IconComponent = panel.icon;
                return (
                  <div
                    key={panel.id}
                    onClick={() => handleTogglePanel(panel.id)}
                    className={`p-3 rounded-2xl border text-left cursor-pointer transition-all flex items-start gap-3 select-none ${
                      isChecked
                        ? 'bg-white/10 border-white/30 text-white shadow-md'
                        : 'bg-dark-850 border-white/5 text-slate-400 hover:border-white/15'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}} // tratado no onClick do container
                      className="mt-1 rounded border-white/20 bg-dark-900 text-white focus:ring-0 cursor-pointer w-4 h-4"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className={`text-xs font-bold flex items-center gap-1.5 ${isChecked ? 'text-white' : 'text-slate-200'}`}>
                          <IconComponent className="w-4 h-4 shrink-0 text-white" />
                          <span>{panel.label}</span>
                        </span>
                        <span className="text-[9px] uppercase font-bold px-2 py-0.5 rounded-full bg-white/10 text-white border border-white/15 shrink-0">
                          {panel.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed mt-1">
                        {panel.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Status da Conta:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setStatus('active')}
                className={`p-2 rounded-xl text-center text-xs font-bold border transition-all ${
                  status === 'active'
                    ? 'border-emerald-500 bg-emerald-500/15 text-emerald-400'
                    : 'border-white/5 bg-dark-800 text-slate-400'
                }`}
              >
                Ativo / Liberado
              </button>
              <button
                type="button"
                onClick={() => setStatus('inactive')}
                className={`p-2 rounded-xl text-center text-xs font-bold border transition-all ${
                  status === 'inactive'
                    ? 'border-rose-500 bg-rose-500/15 text-rose-400'
                    : 'border-white/5 bg-dark-800 text-slate-400'
                }`}
              >
                Bloqueado / Inativo
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-white/5">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              className="text-xs border-white/10 text-slate-300 hover:text-white"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              className="bg-white text-black hover:bg-zinc-200 font-bold text-xs px-5 rounded-xl"
            >
              {isSaving ? 'Salvando...' : editingUser ? 'Salvar Modificações' : 'Criar Acesso'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Troca Rápida de Senha Numérica */}
      <Modal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        title={`Redefinir Senha: @${targetUserForPassword?.username}`}
        maxWidth="max-w-sm"
      >
        <form onSubmit={handleSavePassword} className="space-y-4">
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start gap-2">
            <Key className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>
              Digite a nova senha de <strong>apenas números</strong> para o usuário <strong>@{targetUserForPassword?.username}</strong>.
            </span>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Nova Senha Numérica [0-9]:
            </label>
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value.replace(/\D/g, ''))}
              placeholder="ex: 123456"
              className="w-full px-3 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-white/30 font-mono tracking-widest text-center text-sm"
              required
              autoFocus
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsPasswordModalOpen(false)}
              className="text-xs border-white/10 text-slate-300 hover:text-white"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              className="bg-white text-black hover:bg-zinc-200 font-bold text-xs px-4 rounded-xl"
            >
              Salvar Senha
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Confirmação de Exclusão */}
      <Modal
        isOpen={Boolean(userToDelete)}
        onClose={() => setUserToDelete(null)}
        title="Excluir Acesso do Usuário"
        maxWidth="max-w-sm"
      >
        <div className="space-y-4">
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>
              Tem certeza que deseja excluir o acesso de <strong>@{userToDelete?.username}</strong> ({userToDelete?.name})? Esta ação não pode ser desfeita.
            </span>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setUserToDelete(null)}
              className="text-xs border-white/10 text-slate-300 hover:text-white"
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleConfirmDelete}
              className="bg-rose-600 text-white hover:bg-rose-500 font-bold text-xs px-4 rounded-xl"
            >
              Excluir Definitivamente
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
