import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  ShieldCheck, 
  ShieldAlert, 
  Scissors, 
  MessageSquare, 
  Phone, 
  Key, 
  Lock, 
  User, 
  Edit3, 
  Trash2, 
  Check, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw,
  Sparkles,
  ExternalLink,
  Shield,
  Briefcase,
  Sliders,
  Layers,
  ArrowRightLeft,
  Settings
} from 'lucide-react';
import { StorageService } from '../../lib/storage';
import { SystemUser, UserPermissions } from '../../types';
import { 
  SYSTEM_PERMISSION_CATEGORIES, 
  DEFAULT_ROLE_CONFIGS, 
  RoleConfig, 
  getMatchingRole, 
  cloneRolePermissions 
} from '../../lib/permissions';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';

const isSamePhone = (p1?: string, p2?: string): boolean => {
  if (!p1 || !p2) return false;
  const c1 = p1.replace(/\D/g, '');
  const c2 = p2.replace(/\D/g, '');
  if (!c1 || !c2) return false;
  if (c1 === c2) return true;
  const norm1 = c1.startsWith('55') && c1.length > 11 ? c1.slice(2) : c1;
  const norm2 = c2.startsWith('55') && c2.length > 11 ? c2.slice(2) : c2;
  if (norm1 === norm2) return true;
  if (c1.length >= 8 && c2.length >= 8) {
    if (c1.slice(-8) === c2.slice(-8)) return true;
  }
  return false;
};

export const UsersPage: React.FC = () => {
  const { user: currentAdmin, isAuthenticated } = useAuth();
  const { success, error: toastError, info } = useToast();

  // Active View Tab: 'users' (Permissões de Usuários) | 'roles' (Permissões de Cargos)
  const [activeTab, setActiveTab] = useState<'users' | 'roles'>('users');

  const [users, setUsers] = useState<SystemUser[]>([]);
  const [roleConfigs, setRoleConfigs] = useState<Record<string, RoleConfig>>(() => {
    return StorageService.getRolePermissions();
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Check if current user is admin
  const session = StorageService.getSession();
  const currentPhone = (currentAdmin?.phone || session?.phone || '81996138924').replace(/\D/g, '');
  const currentUserObj = users.find((u) => isSamePhone(u.phone, currentPhone));

  const isCurrentUserAdmin = useMemo(() => {
    if (isAuthenticated) return true;
    if (isSamePhone(currentPhone, '81996138924')) return true;
    if (currentUserObj?.role === 'admin') return true;
    if (currentUserObj?.permissions?.can_access_admin === true) return true;
    if (session?.authenticated) return true;
    return false;
  }, [isAuthenticated, currentPhone, currentUserObj, session]);

  // Modal State for User Create / Edit
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null);
  const [userName, setUserName] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<'admin' | 'barber' | 'attendant' | 'manager' | 'custom'>('barber');
  const [currentPermissions, setCurrentPermissions] = useState<UserPermissions>(() => {
    return cloneRolePermissions('barber', roleConfigs);
  });
  const [userStatus, setUserStatus] = useState<'active' | 'inactive'>('active');
  const [isSavingUser, setIsSavingUser] = useState(false);

  // Modal State for Role Permissions Edit
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [editingRolePermissions, setEditingRolePermissions] = useState<UserPermissions>(() => ({
    can_access_admin: false,
    can_access_atendimento: false,
    can_access_barbeiro: false,
  }));
  const [syncUsersWithRole, setSyncUsersWithRole] = useState(true);
  const [isSavingRole, setIsSavingRole] = useState(false);

  // Delete Confirmation Modal State
  const [userToDelete, setUserToDelete] = useState<SystemUser | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchUsers = async () => {
    try {
      const data = await StorageService.getSystemUsers();
      if (Array.isArray(data) && data.length > 0) {
        setUsers(data);
      }
      const roles = StorageService.getRolePermissions();
      setRoleConfigs(roles);
    } catch (err) {
      console.error('Erro ao buscar usuários:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    fetchUsers();
  };

  // Open User Create Modal
  const openCreateUserModal = () => {
    if (!isCurrentUserAdmin) {
      toastError('Acesso Restrito', 'Apenas administradores podem cadastrar novos usuários.');
      return;
    }
    const defaultPerms = cloneRolePermissions('barber', roleConfigs);
    setEditingUser(null);
    setUserName('');
    setUserPhone('');
    setUserPassword('123');
    setSelectedRole('barber');
    setCurrentPermissions(defaultPerms);
    setUserStatus('active');
    setIsUserModalOpen(true);
  };

  // Open User Edit Modal
  const openEditUserModal = (u: SystemUser) => {
    if (!isCurrentUserAdmin) {
      toastError('Acesso Restrito', 'Apenas administradores podem editar usuários.');
      return;
    }
    const isMaster = isSamePhone(u.phone, '81996138924');
    setEditingUser(u);
    setUserName(u.name);
    setUserPhone(u.phone);
    setUserPassword(u.password || '');
    
    // Determine role matching current permissions
    const userRole = isMaster ? 'admin' : (u.role || getMatchingRole(u.permissions, roleConfigs));
    setSelectedRole(userRole);
    
    if (isMaster) {
      setCurrentPermissions(cloneRolePermissions('admin', roleConfigs));
    } else {
      setCurrentPermissions({ ...u.permissions });
    }
    setUserStatus(u.status || 'active');
    setIsUserModalOpen(true);
  };

  // Handle Role selection when editing/creating a user (Synchronizes permissions immediately)
  const handleSelectRoleForUser = (roleId: 'admin' | 'barber' | 'attendant' | 'manager' | 'custom') => {
    setSelectedRole(roleId);
    if (roleId !== 'custom') {
      const perms = cloneRolePermissions(roleId, roleConfigs);
      setCurrentPermissions(perms);
    }
  };

  // Handle individual permission toggle for a user
  const handleToggleUserPermission = (key: keyof UserPermissions) => {
    setCurrentPermissions((prev) => {
      const next: UserPermissions = {
        ...prev,
        [key]: !prev[key],
      };
      // Check if newly altered permissions still match a predefined role
      const matched = getMatchingRole(next, roleConfigs);
      setSelectedRole(matched);
      return next;
    });
  };

  // Check if current permissions match the selected role
  const isUserPermsMatchingRole = useMemo(() => {
    if (selectedRole === 'custom') return false;
    const roleCfg = roleConfigs[selectedRole];
    if (!roleCfg) return false;

    for (const cat of SYSTEM_PERMISSION_CATEGORIES) {
      for (const opt of cat.options) {
        if (Boolean(currentPermissions[opt.key]) !== Boolean(roleCfg.permissions[opt.key])) {
          return false;
        }
      }
    }
    return true;
  }, [selectedRole, currentPermissions, roleConfigs]);

  // Save User
  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isCurrentUserAdmin) {
      toastError('Acesso Restrito', 'Apenas administradores podem salvar usuários.');
      return;
    }
    let cleanPhone = userPhone.replace(/\D/g, '');
    if (cleanPhone.startsWith('55') && cleanPhone.length > 11) {
      cleanPhone = cleanPhone.slice(2);
    }
    if (!userName.trim()) {
      toastError('Aviso', 'Informe o nome do usuário.');
      return;
    }
    if (cleanPhone.length < 8) {
      toastError('Aviso', 'Informe um telefone com DDD válido.');
      return;
    }
    if (!userPassword.trim()) {
      toastError('Aviso', 'Informe uma senha ou PIN.');
      return;
    }

    setIsSavingUser(true);
    try {
      const isMaster = isSamePhone(cleanPhone, '81996138924');
      const finalPerms: UserPermissions = isMaster
        ? cloneRolePermissions('admin', roleConfigs)
        : { ...currentPermissions };

      const finalRole = isMaster ? 'admin' : selectedRole;

      const newUser: SystemUser = {
        id: editingUser ? editingUser.id : `user-${Date.now()}`,
        name: userName.trim(),
        phone: cleanPhone,
        password: userPassword.trim(),
        pin: userPassword.trim().slice(0, 6),
        role: finalRole,
        permissions: finalPerms,
        status: userStatus,
        created_at: editingUser?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Optimistic update
      setUsers((prev) => {
        const idx = prev.findIndex((u) => u.id === newUser.id || isSamePhone(u.phone, newUser.phone));
        if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = newUser;
          return copy;
        }
        return [newUser, ...prev];
      });

      await StorageService.saveSystemUser(newUser);
      setIsUserModalOpen(false);
      success('Usuário Salvo', `Usuário ${newUser.name} foi atualizado com sucesso.`);

      // Sync from backend
      try {
        const refreshed = await StorageService.getSystemUsers();
        if (Array.isArray(refreshed) && refreshed.length > 0) setUsers(refreshed);
      } catch {}
    } catch (err: any) {
      toastError('Erro', err.message || 'Falha ao salvar usuário.');
    } finally {
      setIsSavingUser(false);
    }
  };

  // Open Role Permissions Modal
  const openEditRoleModal = (roleId: string) => {
    if (!isCurrentUserAdmin) {
      toastError('Acesso Restrito', 'Apenas administradores podem configurar permissões de cargos.');
      return;
    }
    const roleCfg = roleConfigs[roleId];
    if (!roleCfg) return;

    setEditingRoleId(roleId);
    setEditingRolePermissions({ ...roleCfg.permissions });
    setSyncUsersWithRole(true);
    setIsRoleModalOpen(true);
  };

  // Toggle permission in role modal
  const handleToggleRolePermission = (key: keyof UserPermissions) => {
    setEditingRolePermissions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Set all / Clear all permissions for a role
  const handleBulkSetRolePermissions = (enableAll: boolean) => {
    const updated: UserPermissions = {
      can_access_admin: enableAll,
      can_access_atendimento: enableAll,
      can_access_barbeiro: enableAll,
    };
    SYSTEM_PERMISSION_CATEGORIES.forEach((cat) => {
      cat.options.forEach((opt) => {
        (updated as any)[opt.key] = enableAll;
      });
    });
    setEditingRolePermissions(updated);
  };

  // Save Role Permissions
  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRoleId || !isCurrentUserAdmin) return;

    setIsSavingRole(true);
    try {
      const updatedConfigs = await StorageService.saveRolePermissions(editingRoleId, editingRolePermissions);
      setRoleConfigs(updatedConfigs);

      // If user requested to synchronize with all existing users who have this role
      if (syncUsersWithRole) {
        let syncCount = 0;
        const updatedUsersList = users.map((u) => {
          if (u.role === editingRoleId && !isSamePhone(u.phone, '81996138924')) {
            syncCount++;
            return {
              ...u,
              permissions: { ...editingRolePermissions },
              updated_at: new Date().toISOString(),
            };
          }
          return u;
        });

        if (syncCount > 0) {
          setUsers(updatedUsersList);
          for (const u of updatedUsersList) {
            if (u.role === editingRoleId && !isSamePhone(u.phone, '81996138924')) {
              await StorageService.saveSystemUser(u);
            }
          }
        }
      }

      setIsRoleModalOpen(false);
      success(
        'Cargo Atualizado',
        `Permissões do cargo ${roleConfigs[editingRoleId]?.name || editingRoleId} salvas com sucesso!`
      );
    } catch (err: any) {
      toastError('Erro ao salvar cargo', err.message || 'Falha ao salvar permissões do cargo.');
    } finally {
      setIsSavingRole(false);
    }
  };

  // Delete User Confirmation
  const requestDeleteUser = (user: SystemUser) => {
    if (!isCurrentUserAdmin) {
      toastError('Acesso Restrito', 'Apenas administradores podem excluir usuários.');
      return;
    }
    if (isSamePhone(user.phone, '81996138924')) {
      toastError('Ação Bloqueada', 'O administrador principal (Talvane) não pode ser excluído.');
      return;
    }
    setUserToDelete(user);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    const target = userToDelete;
    setIsDeleting(true);
    try {
      setUsers((prev) => prev.filter((u) => u.id !== target.id && !isSamePhone(u.phone, target.phone)));
      await StorageService.deleteSystemUser(target.id);
      success('Usuário Removido', `O acesso de ${target.name} foi revogado.`);
      setUserToDelete(null);
    } catch (err: any) {
      toastError('Erro', err.message || 'Falha ao excluir usuário.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      return (
        u.name.toLowerCase().includes(term) ||
        u.phone.includes(term) ||
        (u.role || '').toLowerCase().includes(term)
      );
    });
  }, [users, searchTerm]);

  // Count active permissions for any permissions object
  const countActivePerms = (perms?: UserPermissions) => {
    if (!perms) return 0;
    let count = 0;
    SYSTEM_PERMISSION_CATEGORIES.forEach((cat) => {
      cat.options.forEach((opt) => {
        if (perms[opt.key]) count++;
      });
    });
    return count;
  };

  const totalPossiblePerms = useMemo(() => {
    return SYSTEM_PERMISSION_CATEGORIES.reduce((acc, cat) => acc + cat.options.length, 0);
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in pb-12">
      {/* Read-only notice if not admin */}
      {!isCurrentUserAdmin && (
        <div className="p-3.5 rounded-2xl bg-amber-950/40 border border-amber-500/30 text-xs text-amber-300 flex items-center gap-2.5 shadow-sm">
          <Lock className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <span>
            <strong>Modo Somente Leitura:</strong> Apenas usuários com perfil <strong>Administrador</strong> têm permissão para criar, editar ou excluir acessos e cargos.
          </span>
        </div>
      )}

      {/* Top Banner / Navigation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-brand-400" />
            <span>Gestão de Usuários & Permissões de Cargos</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Gerencie os acessos individuais da equipe e mantenha os perfis de cargos sempre 100% sincronizados
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleManualRefresh}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-brand-400' : ''}`} />}
          >
            Atualizar
          </Button>

          {activeTab === 'users' && (
            <Button
              variant="brand"
              size="sm"
              onClick={openCreateUserModal}
              disabled={!isCurrentUserAdmin}
              leftIcon={<Plus className="w-4 h-4" />}
              className="font-bold shadow-glow-brand"
            >
              Novo Usuário
            </Button>
          )}
        </div>
      </div>

      {/* Synchronized Tabs: Permissões de Usuários vs Permissões de Cargos */}
      <div className="flex items-center gap-2 p-1 bg-dark-900/80 rounded-2xl border border-white/5 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'users'
              ? 'bg-brand-500 text-dark-950 shadow-glow-brand'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Permissões de Usuários ({users.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('roles')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'roles'
              ? 'bg-brand-500 text-dark-950 shadow-glow-brand'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Permissões de Cargos & Padrões (4 Cargos)</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: PERMISSÕES DE USUÁRIOS */}
      {/* ========================================================================= */}
      {activeTab === 'users' && (
        <div className="space-y-4 animate-in fade-in">
          {/* Overview KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <Card className="p-4 rounded-2xl bg-dark-900/70 border-white/10 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block">Administradores</span>
                <span className="text-xl font-black text-white">
                  {users.filter((u) => u.permissions?.can_access_admin && u.status === 'active').length}
                </span>
                <span className="text-[10px] text-emerald-400 block font-semibold">Acesso total</span>
              </div>
            </Card>

            <Card className="p-4 rounded-2xl bg-dark-900/70 border-white/10 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-brand-400">
                <Scissors className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block">Barbeiros</span>
                <span className="text-xl font-black text-brand-400">
                  {users.filter((u) => (u.role === 'barber' || u.permissions?.can_access_barbeiro) && u.status === 'active').length}
                </span>
                <span className="text-[10px] text-slate-400 block">Cadeira & Agenda</span>
              </div>
            </Card>

            <Card className="p-4 rounded-2xl bg-dark-900/70 border-white/10 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block">Atendentes</span>
                <span className="text-xl font-black text-blue-400">
                  {users.filter((u) => (u.role === 'attendant' || u.permissions?.can_access_atendimento) && u.status === 'active').length}
                </span>
                <span className="text-[10px] text-slate-400 block">Chat WhatsApp</span>
              </div>
            </Card>

            <Card className="p-4 rounded-2xl bg-dark-900/70 border-white/10 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block">Cargos Sincronizados</span>
                <span className="text-xl font-black text-purple-400">
                  {Object.keys(roleConfigs).length}
                </span>
                <span className="text-[10px] text-slate-400 block">Padrões ativos</span>
              </div>
            </Card>
          </div>

          {/* Search Bar */}
          <Card className="p-3.5 rounded-2xl bg-dark-900/70 border-white/10 flex items-center justify-between gap-4">
            <div className="relative w-full max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nome, telefone ou cargo..."
                className="w-full pl-10 pr-3.5 py-2 bg-dark-950 rounded-xl border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-brand-500"
              />
            </div>
            <span className="text-xs text-slate-400 whitespace-nowrap">
              {filteredUsers.length} usuário(s) encontrado(s)
            </span>
          </Card>

          {/* Users Table */}
          <Card className="rounded-2xl bg-dark-900/70 border-white/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.02] text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="p-4">Usuário</th>
                    <th className="p-4">Telefone / Login</th>
                    <th className="p-4">Cargo / Perfil</th>
                    <th className="p-4">Permissões Habilitadas</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs">
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((u) => {
                      const roleKey = u.role || 'custom';
                      const roleConfig = roleConfigs[roleKey] || DEFAULT_ROLE_CONFIGS[roleKey] || DEFAULT_ROLE_CONFIGS.custom;
                      const activeCount = countActivePerms(u.permissions);

                      return (
                        <tr key={u.id} className="hover:bg-white/[0.02] transition-colors group">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-300 font-bold flex items-center justify-center text-sm">
                                {u.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <span className="font-bold text-white block">{u.name}</span>
                                <span className="text-[11px] text-slate-400">
                                  ID: {u.id}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="p-4 font-mono text-slate-300">
                            <div className="flex items-center gap-1.5">
                              <Phone className="w-3.5 h-3.5 text-slate-500" />
                              <span>{u.phone}</span>
                            </div>
                          </td>

                          <td className="p-4">
                            <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border inline-flex items-center gap-1.5 ${roleConfig.bgLight}`}>
                              <span>{roleConfig.name}</span>
                            </span>
                          </td>

                          <td className="p-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] font-mono font-bold text-white">
                                  {activeCount} de {totalPossiblePerms} opções
                                </span>
                                <div className="w-20 h-1.5 bg-dark-950 rounded-full overflow-hidden border border-white/10">
                                  <div
                                    className="h-full bg-brand-500 rounded-full"
                                    style={{ width: `${Math.min(100, Math.round((activeCount / totalPossiblePerms) * 100))}%` }}
                                  />
                                </div>
                              </div>
                              <div className="flex flex-wrap items-center gap-1">
                                {u.permissions?.can_access_admin && (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                    Admin
                                  </span>
                                )}
                                {u.permissions?.can_access_barbeiro && (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-brand-500/20 text-brand-300 border border-brand-500/30">
                                    Barbeiro
                                  </span>
                                )}
                                {u.permissions?.can_access_atendimento && (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                    Atendimento
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="p-4">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                                u.status === 'active'
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : 'bg-red-500/20 text-red-300 border border-red-500/30'
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${u.status === 'active' ? 'bg-emerald-400' : 'bg-red-400'}`} />
                              {u.status === 'active' ? 'Ativo' : 'Inativo'}
                            </span>
                          </td>

                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => openEditUserModal(u)}
                                disabled={!isCurrentUserAdmin}
                                className={`p-1.5 rounded-lg transition-all ${
                                  isCurrentUserAdmin
                                    ? 'bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white'
                                    : 'opacity-30 cursor-not-allowed text-slate-500'
                                }`}
                                title="Editar Usuário & Permissões"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => requestDeleteUser(u)}
                                disabled={!isCurrentUserAdmin || isSamePhone(u.phone, '81996138924')}
                                className={`p-1.5 rounded-lg transition-all ${
                                  isCurrentUserAdmin && !isSamePhone(u.phone, '81996138924')
                                    ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300'
                                    : 'opacity-30 cursor-not-allowed text-slate-500'
                                }`}
                                title="Excluir Usuário"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">
                        Nenhum usuário encontrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: PERMISSÕES DE CARGOS (Sincronização Padrão) */}
      {/* ========================================================================= */}
      {activeTab === 'roles' && (
        <div className="space-y-6 animate-in fade-in">
          <Card className="p-5 rounded-2xl bg-dark-900/70 border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-brand-400" />
                Matriz de Permissões por Cargo
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Defina as permissões padrão para cada cargo. Ao cadastrar um usuário ou sincronizá-lo, estas serão as regras aplicadas.
              </p>
            </div>
          </Card>

          {/* Roles Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(['admin', 'manager', 'barber', 'attendant'] as const).map((roleId) => {
              const roleCfg = roleConfigs[roleId] || DEFAULT_ROLE_CONFIGS[roleId];
              const activeCount = countActivePerms(roleCfg.permissions);
              const assignedUsersCount = users.filter((u) => u.role === roleId).length;

              return (
                <Card
                  key={roleId}
                  className={`p-5 rounded-3xl bg-dark-900/80 border transition-all space-y-4 ${roleCfg.borderColor}`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-bold text-white">{roleCfg.name}</span>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${roleCfg.bgLight}`}>
                          {roleCfg.badgeLabel}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        {roleCfg.description}
                      </p>
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEditRoleModal(roleId)}
                      disabled={!isCurrentUserAdmin}
                      leftIcon={<Edit3 className="w-3.5 h-3.5" />}
                      className="text-xs font-bold whitespace-nowrap"
                    >
                      Configurar Permissões
                    </Button>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-slate-500" />
                      <strong>{assignedUsersCount}</strong> usuário(s) com este cargo
                    </span>
                    <span className="font-mono text-brand-300 font-bold">
                      {activeCount} de {totalPossiblePerms} permissões ativas
                    </span>
                  </div>

                  {/* Summary of Active Permissions */}
                  <div className="space-y-2 pt-2 border-t border-white/5">
                    <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                      Acessos e Funções Liberadas:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {SYSTEM_PERMISSION_CATEGORIES.map((cat) =>
                        cat.options
                          .filter((opt) => roleCfg.permissions[opt.key])
                          .map((opt) => (
                            <span
                              key={opt.key}
                              className="px-2 py-1 rounded-lg text-[10px] font-semibold bg-dark-950 border border-white/10 text-slate-200 flex items-center gap-1"
                            >
                              <Check className="w-3 h-3 text-emerald-400" />
                              {opt.label}
                            </span>
                          ))
                      )}
                      {activeCount === 0 && (
                        <span className="text-xs text-slate-500 italic">Nenhuma permissão liberada.</span>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: CRIAR / EDITAR USUÁRIO & SINCRONIZAR COM CARGO */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        title={editingUser ? 'Editar Usuário & Permissões' : 'Cadastrar Novo Usuário'}
        subtitle="As permissões abaixo seguem exatamente as mesmas regras e opções dos cargos"
        maxWidth="lg"
      >
        <form onSubmit={handleSaveUser} className="space-y-4 pt-1 text-xs">
          {/* User Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-slate-300 font-bold block">Nome Completo *</label>
              <input
                type="text"
                required
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Ex: Carlos Oliveira"
                className="w-full px-3.5 py-2.5 rounded-xl bg-dark-950 border border-white/10 text-white text-xs focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-300 font-bold block">WhatsApp com DDD *</label>
              <input
                type="text"
                required
                value={userPhone}
                onChange={(e) => setUserPhone(e.target.value)}
                placeholder="Ex: 81996138924"
                className="w-full px-3.5 py-2.5 rounded-xl bg-dark-950 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-slate-300 font-bold block">Senha / PIN de Acesso *</label>
              <input
                type="text"
                required
                value={userPassword}
                onChange={(e) => setUserPassword(e.target.value)}
                placeholder="Ex: 1234"
                className="w-full px-3.5 py-2.5 rounded-xl bg-dark-950 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-300 font-bold block">Status do Usuário</label>
              <select
                value={userStatus}
                onChange={(e) => setUserStatus(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-dark-950 border border-white/10 text-white text-xs focus:outline-none focus:border-brand-500"
              >
                <option value="active">Ativo (Permitir Login)</option>
                <option value="inactive">Inativo (Bloquear Login)</option>
              </select>
            </div>
          </div>

          {/* Quick Cargo Selector with Auto-Synchronization */}
          <div className="space-y-2 pt-2 border-t border-white/10">
            <div className="flex items-center justify-between">
              <label className="text-slate-300 font-bold block">
                Cargo / Perfil Atribuído:
              </label>
              {isUserPermsMatchingRole ? (
                <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Sincronizado com o cargo padrão
                </span>
              ) : (
                <span className="text-[10px] text-amber-400 font-semibold flex items-center gap-1">
                  <Sliders className="w-3 h-3" /> Permissões customizadas individualmente
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              <button
                type="button"
                onClick={() => handleSelectRoleForUser('barber')}
                className={`p-2 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-0.5 ${
                  selectedRole === 'barber'
                    ? 'bg-brand-500 text-dark-950 border-brand-400 font-bold shadow-glow-brand'
                    : 'bg-dark-950 border-white/10 text-slate-300 hover:text-white'
                }`}
              >
                <Scissors className="w-3.5 h-3.5" />
                <span className="text-[11px]">Barbeiro</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectRoleForUser('attendant')}
                className={`p-2 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-0.5 ${
                  selectedRole === 'attendant'
                    ? 'bg-blue-500 text-white border-blue-400 font-bold shadow-glow-primary'
                    : 'bg-dark-950 border-white/10 text-slate-300 hover:text-white'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span className="text-[11px]">Atendente</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectRoleForUser('manager')}
                className={`p-2 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-0.5 ${
                  selectedRole === 'manager'
                    ? 'bg-purple-600 text-white border-purple-400 font-bold shadow-glow-primary'
                    : 'bg-dark-950 border-white/10 text-slate-300 hover:text-white'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span className="text-[11px]">Gerente</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectRoleForUser('admin')}
                className={`p-2 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-0.5 ${
                  selectedRole === 'admin'
                    ? 'bg-emerald-500 text-dark-950 border-emerald-400 font-bold shadow-glow-brand'
                    : 'bg-dark-950 border-white/10 text-slate-300 hover:text-white'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span className="text-[11px]">Admin Total</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedRole('custom')}
                className={`p-2 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-0.5 ${
                  selectedRole === 'custom'
                    ? 'bg-slate-700 text-white border-slate-500 font-bold'
                    : 'bg-dark-950 border-white/10 text-slate-400 hover:text-white'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span className="text-[11px]">Custom</span>
              </button>
            </div>
          </div>

          {/* Unified System Permissions Checkboxes (Identical to Role Permissions) */}
          <div className="space-y-4 pt-2 border-t border-white/10 max-h-72 overflow-y-auto pr-1 custom-scrollbar">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white block">
                Permissões Detalhadas do Usuário:
              </label>
              {selectedRole !== 'custom' && !isUserPermsMatchingRole && (
                <button
                  type="button"
                  onClick={() => handleSelectRoleForUser(selectedRole)}
                  className="text-[10px] text-brand-400 hover:underline flex items-center gap-1 font-bold"
                >
                  <RefreshCw className="w-3 h-3" /> Sincronizar com cargo {roleConfigs[selectedRole]?.name}
                </button>
              )}
            </div>

            {SYSTEM_PERMISSION_CATEGORIES.map((cat) => (
              <div key={cat.id} className="p-3.5 rounded-2xl bg-dark-950/80 border border-white/10 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200 text-xs">{cat.title}</span>
                  <span className="text-[10px] text-slate-400">{cat.description}</span>
                </div>

                <div className="space-y-2">
                  {cat.options.map((opt) => {
                    const isChecked = Boolean(currentPermissions[opt.key]);
                    return (
                      <label
                        key={opt.key}
                        className="flex items-start gap-3 cursor-pointer p-2 rounded-xl hover:bg-white/[0.02] transition-colors border border-transparent hover:border-white/5"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleUserPermission(opt.key)}
                          className="w-4 h-4 rounded text-brand-500 focus:ring-brand-500 bg-dark-900 border-white/20 mt-0.5 cursor-pointer"
                        />
                        <div className="flex-1 min-w-0">
                          <span className="font-bold text-slate-200 block text-xs">
                            {opt.label}
                          </span>
                          <span className="text-[11px] text-slate-400 leading-tight block">
                            {opt.description}
                          </span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsUserModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="brand"
              size="sm"
              isLoading={isSavingUser}
              className="font-bold shadow-glow-brand"
            >
              Salvar Usuário
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 2: CONFIGURAR PERMISSÕES DO CARGO (Sincronização com o Sistema) */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        title={`Configurar Permissões do Cargo: ${editingRoleId ? roleConfigs[editingRoleId]?.name : ''}`}
        subtitle="Estas permissões definem o padrão para qualquer usuário atribuído a este cargo"
        maxWidth="lg"
      >
        <form onSubmit={handleSaveRole} className="space-y-4 pt-1 text-xs">
          {/* Quick Bulk Select / Deselect */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-dark-950 border border-white/10">
            <span className="text-xs font-bold text-slate-300">Ações Rápidas do Cargo:</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleBulkSetRolePermissions(true)}
                className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 text-[11px] font-bold border border-emerald-500/30 transition-all"
              >
                Marcar Todas
              </button>
              <button
                type="button"
                onClick={() => handleBulkSetRolePermissions(false)}
                className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 text-[11px] font-bold border border-rose-500/30 transition-all"
              >
                Desmarcar Todas
              </button>
            </div>
          </div>

          {/* Unified System Permissions Checkboxes */}
          <div className="space-y-4 max-h-80 overflow-y-auto pr-1 custom-scrollbar">
            {SYSTEM_PERMISSION_CATEGORIES.map((cat) => (
              <div key={cat.id} className="p-3.5 rounded-2xl bg-dark-950/80 border border-white/10 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200 text-xs">{cat.title}</span>
                  <span className="text-[10px] text-slate-400">{cat.description}</span>
                </div>

                <div className="space-y-2">
                  {cat.options.map((opt) => {
                    const isChecked = Boolean(editingRolePermissions[opt.key]);
                    return (
                      <label
                        key={opt.key}
                        className="flex items-start gap-3 cursor-pointer p-2 rounded-xl hover:bg-white/[0.02] transition-colors border border-transparent hover:border-white/5"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleRolePermission(opt.key)}
                          className="w-4 h-4 rounded text-brand-500 focus:ring-brand-500 bg-dark-900 border-white/20 mt-0.5 cursor-pointer"
                        />
                        <div className="flex-1 min-w-0">
                          <span className="font-bold text-slate-200 block text-xs">
                            {opt.label}
                          </span>
                          <span className="text-[11px] text-slate-400 leading-tight block">
                            {opt.description}
                          </span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Synchronize Users with this Role Checkbox */}
          <div className="p-3 rounded-xl bg-brand-950/30 border border-brand-500/30 text-xs text-brand-200 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="font-bold block text-white">Sincronizar Usuários Imediatamente</span>
              <span className="text-[10px] text-slate-300 block">
                Aplicar automaticamente estas alterações a todos os usuários cadastrados com este cargo.
              </span>
            </div>
            <input
              type="checkbox"
              checked={syncUsersWithRole}
              onChange={(e) => setSyncUsersWithRole(e.target.checked)}
              className="w-4 h-4 rounded text-brand-500 focus:ring-brand-500 bg-dark-900 border-white/20 cursor-pointer"
            />
          </div>

          <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsRoleModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="brand"
              size="sm"
              isLoading={isSavingRole}
              className="font-bold shadow-glow-brand"
            >
              Salvar Permissões do Cargo
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* DELETE CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      <Modal
        isOpen={Boolean(userToDelete)}
        onClose={() => setUserToDelete(null)}
        title="Confirmar Exclusão de Acesso"
        maxWidth="sm"
      >
        <div className="space-y-4 pt-2">
          <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-500/30 text-xs text-rose-300 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-white text-sm">
                Excluir acesso de {userToDelete?.name}?
              </p>
              <p className="mt-1 text-slate-300">
                Telefone: <span className="font-mono text-white font-bold">{userToDelete?.phone}</span>
              </p>
              <p className="mt-1 text-slate-400">
                Esta ação revogará permanentemente as permissões de acesso deste usuário a todos os painéis.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setUserToDelete(null)}
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={confirmDeleteUser}
              isLoading={isDeleting}
              leftIcon={<Trash2 className="w-4 h-4" />}
              className="font-bold"
            >
              Confirmar Exclusão
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
