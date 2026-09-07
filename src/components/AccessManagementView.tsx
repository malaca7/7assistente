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
  EyeOff
} from 'lucide-react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Modal } from './ui/Modal';
import { StorageService } from '../lib/storage';
import { SystemAccessUser, SystemRole, Store } from '../types';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';

export const AccessManagementView: React.FC = () => {
  const { user: currentAdmin } = useAuth();
  const { success, error: toastError, info } = useToast();

  const [users, setUsers] = useState<SystemAccessUser[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('all');
  const [selectedStoreFilter, setSelectedStoreFilter] = useState<string>('all');

  // Modal de Criação / Edição de Usuário
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<SystemAccessUser | null>(null);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<SystemRole>('attendant');
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

  // Abrir Modal de Criação
  const handleOpenCreateModal = () => {
    setEditingUser(null);
    setName('');
    setUsername('');
    setPassword('123456');
    setRole('attendant');
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
    setRole(u.role);
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

      const userPayload: Partial<SystemAccessUser> = {
        id: editingUser?.id,
        name: name.trim(),
        username: cleanUser,
        password: cleanPass,
        role,
        store_id: storeId === 'all' ? null : storeId,
        store_name: storeName,
        status,
        created_at: editingUser?.created_at,
      };

      await StorageService.saveAccessUser(userPayload);
      success(
        editingUser ? 'Usuário Atualizado!' : 'Novo Acesso Criado!',
        `Usuário @${cleanUser} configurado com sucesso.`
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
        u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.store_name || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchRole = selectedRoleFilter === 'all' || u.role === selectedRoleFilter;
      const matchStore = selectedStoreFilter === 'all' || 
        (selectedStoreFilter === 'global' ? !u.store_id : u.store_id === selectedStoreFilter);

      return matchSearch && matchRole && matchStore;
    });
  }, [users, searchTerm, selectedRoleFilter, selectedStoreFilter]);

  // Contadores Estatísticos
  const stats = useMemo(() => {
    const total = users.length;
    const ceoCount = users.filter(u => u.role === 'ceo' || u.role === 'admin').length;
    const mgrCount = users.filter(u => u.role === 'manager').length;
    const attCount = users.filter(u => u.role === 'attendant').length;
    const activeCount = users.filter(u => u.status === 'active').length;
    return { total, ceoCount, mgrCount, attCount, activeCount };
  }, [users]);

  const getRoleBadge = (r: SystemRole) => {
    switch (r) {
      case 'ceo':
        return (
          <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-pitoco-blue/15 text-pitoco-blue border border-pitoco-blue/30 flex items-center gap-1.5 inline-flex">
            <Crown className="w-3.5 h-3.5" />
            CEO Global
          </span>
        );
      case 'admin':
        return (
          <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30 flex items-center gap-1.5 inline-flex">
            <ShieldCheck className="w-3.5 h-3.5" />
            Administrador
          </span>
        );
      case 'manager':
        return (
          <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 inline-flex">
            <StoreIcon className="w-3.5 h-3.5" />
            Gerente Filial
          </span>
        );
      case 'attendant':
      default:
        return (
          <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-pitoco-pink/15 text-pitoco-pink border border-pitoco-pink/30 flex items-center gap-1.5 inline-flex">
            <Heart className="w-3.5 h-3.5" />
            Consultora VIP
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Informativo */}
      <div className="p-5 rounded-2xl bg-dark-900 border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-pitoco-blue/20 text-pitoco-blue border border-pitoco-blue/30 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              Gestão de Acessos & Painéis
            </span>
            <span className="text-xs text-slate-400">
              Novo Padrão de Autenticação Unificado
            </span>
          </div>
          <h2 className="text-xl font-bold text-white">
            Gerenciamento de Usuários e Permissões
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Regra do Sistema: <strong className="text-pitoco-blue font-bold">Usuário com apenas letras</strong> [a-z] e <strong className="text-emerald-400 font-bold">Senha com apenas números</strong> [0-9].
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
            className="bg-pitoco-blue text-slate-900 hover:bg-pitoco-blue/90 font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-2 shadow-glow-primary"
          >
            <Plus className="w-4 h-4" />
            Novo Usuário / Acesso
          </Button>
        </div>
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Card className="p-4 bg-dark-900 border-white/5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Total de Acessos</span>
            <Users className="w-4 h-4 text-pitoco-blue" />
          </div>
          <div className="text-2xl font-bold text-white mt-1">{stats.total}</div>
          <span className="text-[10px] text-slate-500">Usuários cadastrados</span>
        </Card>

        <Card className="p-4 bg-dark-900 border-white/5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">CEO & Diretoria</span>
            <Crown className="w-4 h-4 text-pitoco-blue" />
          </div>
          <div className="text-2xl font-bold text-white mt-1">{stats.ceoCount}</div>
          <span className="text-[10px] text-pitoco-blue">Acesso global à rede</span>
        </Card>

        <Card className="p-4 bg-dark-900 border-white/5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Gerentes Filial</span>
            <StoreIcon className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-1">{stats.mgrCount}</div>
          <span className="text-[10px] text-emerald-400">Por loja física</span>
        </Card>

        <Card className="p-4 bg-dark-900 border-white/5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Consultoras VIP</span>
            <Heart className="w-4 h-4 text-pitoco-pink" />
          </div>
          <div className="text-2xl font-bold text-white mt-1">{stats.attCount}</div>
          <span className="text-[10px] text-pitoco-pink">Atendimento WhatsApp</span>
        </Card>

        <Card className="p-4 bg-dark-900 border-white/5 col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Status Ativo</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">{stats.activeCount}</div>
          <span className="text-[10px] text-slate-500">Com login liberado</span>
        </Card>
      </div>

      {/* Barra de Filtros e Busca */}
      <Card className="p-4 bg-dark-900 border-white/10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Campo de Busca */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome ou @usuario..."
              className="w-full pl-9 pr-3 py-2 bg-dark-800 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pitoco-blue transition-colors"
            />
          </div>

          {/* Filtros de Papel e Loja */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <select
              value={selectedRoleFilter}
              onChange={e => setSelectedRoleFilter(e.target.value)}
              className="px-3 py-2 bg-dark-800 border border-white/10 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-pitoco-blue transition-colors"
            >
              <option value="all">Todos os Cargos</option>
              <option value="ceo">CEO Global</option>
              <option value="admin">Administrador</option>
              <option value="manager">Gerente Filial</option>
              <option value="attendant">Consultora VIP</option>
            </select>

            <select
              value={selectedStoreFilter}
              onChange={e => setSelectedStoreFilter(e.target.value)}
              className="px-3 py-2 bg-dark-800 border border-white/10 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-pitoco-blue transition-colors"
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
        {filteredUsers.map((user) => (
          <Card 
            key={user.id} 
            className={`p-5 bg-dark-900 border transition-all ${
              user.status === 'active' 
                ? 'border-white/10 hover:border-pitoco-blue/40' 
                : 'border-rose-500/20 opacity-75'
            }`}
          >
            {/* Header do Card */}
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-2xl bg-dark-800 border border-white/10 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {user.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-white truncate">
                    {user.name}
                  </h4>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="font-mono text-xs font-bold text-pitoco-blue bg-pitoco-blue/10 px-2 py-0.5 rounded border border-pitoco-blue/20">
                      @{user.username}
                    </span>
                    <span className="text-[10px] text-slate-500">• letras [a-z]</span>
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

            {/* Dados do Perfil */}
            <div className="space-y-2 py-3 border-y border-white/5 my-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Cargo / Função:</span>
                {getRoleBadge(user.role)}
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Unidade Vinculada:</span>
                <span className="text-slate-200 font-medium truncate max-w-[180px]">
                  {user.store_name || 'Toda a Rede'}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Senha Numérica:</span>
                <span className="font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 text-[11px] font-bold">
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
                  title="Editar Dados"
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
        ))}

        {filteredUsers.length === 0 && (
          <div className="col-span-full p-12 text-center rounded-2xl bg-dark-900 border border-white/5">
            <Users className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white">Nenhum usuário encontrado</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Nenhum acesso corresponde aos filtros aplicados. Clique em "Novo Usuário" para cadastrar.
            </p>
          </div>
        )}
      </div>

      {/* Modal: Criar ou Editar Usuário */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUser ? `Editar Acesso: @${editingUser.username}` : 'Criar Novo Acesso ao Sistema'}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSaveUser} className="space-y-4">
          <div className="p-3 rounded-xl bg-pitoco-blue/10 border border-pitoco-blue/20 text-xs text-pitoco-blue flex items-start gap-2">
            <Sparkles className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>
              <strong>Novo Modo de Acesso:</strong> O usuário deve conter <u>estritamente letras</u> e a senha <u>estritamente números</u>.
            </span>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Nome Completo da Colaboradora / Responsável:
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="ex: Juliana Paes de Alencar"
              className="w-full px-3 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pitoco-blue"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-300">
                  Nome de Usuário:
                </label>
                <span className="text-[10px] text-pitoco-blue font-bold">
                  Apenas Letras [a-z]
                </span>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-pitoco-blue font-mono">
                  @
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value.replace(/[^a-zA-Z]/g, '').toLowerCase())}
                  placeholder="ex: juliana"
                  className="w-full pl-7 pr-3 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pitoco-blue font-mono"
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
                  className="w-full pl-3 pr-9 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pitoco-blue font-mono tracking-widest"
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
                Apenas dígitos de 0 a 9.
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Cargo / Perfil de Acesso:
              </label>
              <select
                value={role}
                onChange={e => setRole(e.target.value as SystemRole)}
                className="w-full px-3 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-pitoco-blue"
              >
                <option value="ceo">CEO / Diretoria Global</option>
                <option value="admin">Administrador Geral</option>
                <option value="manager">Gerente de Filial</option>
                <option value="attendant">Consultora VIP / Atendente</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Unidade / Loja Vinculada:
              </label>
              <select
                value={storeId}
                onChange={e => setStoreId(e.target.value)}
                className="w-full px-3 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-pitoco-blue"
              >
                <option value="all">Toda a Rede (Global)</option>
                {stores.map(st => (
                  <option key={st.id} value={st.id}>{st.name}</option>
                ))}
              </select>
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
                className={`p-2.5 rounded-xl text-center text-xs font-bold border transition-all ${
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
                className={`p-2.5 rounded-xl text-center text-xs font-bold border transition-all ${
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
              className="bg-pitoco-blue text-slate-950 font-bold text-xs px-5 rounded-xl hover:bg-pitoco-blue/90"
            >
              {isSaving ? 'Salvando...' : editingUser ? 'Salvar Alterações' : 'Criar Acesso'}
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
          <p className="text-xs text-slate-400">
            Digite a nova senha numérica de acesso para <strong className="text-white">@{targetUserForPassword?.username}</strong> ({targetUserForPassword?.name}):
          </p>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-300">
                Nova Senha:
              </label>
              <span className="text-[10px] text-emerald-400 font-bold">
                Apenas Números [0-9]
              </span>
            </div>
            <input
              type="password"
              value={newPassword}
              inputMode="numeric"
              pattern="[0-9]*"
              onChange={e => setNewPassword(e.target.value.replace(/\D/g, ''))}
              placeholder="ex: 654321"
              className="w-full px-3 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pitoco-blue font-mono tracking-widest"
              required
              autoFocus
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsPasswordModalOpen(false)}
              className="text-xs border-white/10 text-slate-300"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-pitoco-blue text-slate-950 font-bold text-xs rounded-xl"
            >
              Confirmar Nova Senha
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal de Confirmação de Exclusão */}
      <Modal
        isOpen={Boolean(userToDelete)}
        onClose={() => setUserToDelete(null)}
        title="Confirmar Exclusão de Acesso"
        maxWidth="max-w-sm"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-300">
            Tem certeza que deseja excluir o acesso de <strong className="text-white">@{userToDelete?.username}</strong> ({userToDelete?.name})?
          </p>
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-[11px] text-rose-300">
            Esta ação revoga imediatamente a capacidade do colaborador de fazer login em qualquer painel.
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setUserToDelete(null)}
              className="text-xs border-white/10 text-slate-300"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmDelete}
              className="bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs rounded-xl"
            >
              Sim, Excluir Acesso
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
