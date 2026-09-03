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
  ExternalLink
} from 'lucide-react';
import { StorageService } from '../../lib/storage';
import { SystemUser, UserPermissions } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../contexts/ToastContext';

import { useAuth } from '../../contexts/AuthContext';

export const UsersPage: React.FC = () => {
  const { user: currentAdmin } = useAuth();
  const { success, error: toastError, info } = useToast();
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Check if current user is admin
  const session = StorageService.getSession();
  const currentPhone = (currentAdmin?.phone || session?.phone || '81996138924').replace(/\D/g, '');
  const currentUserObj = users.find(u => (u.phone || '').replace(/\D/g, '') === currentPhone);
  const isCurrentUserAdmin =
    currentPhone === '81996138924' ||
    currentUserObj?.role === 'admin' ||
    currentUserObj?.permissions?.can_access_admin === true ||
    currentAdmin?.role === 'admin' ||
    !session || !session.phone;

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null);
  const [userName, setUserName] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [userRole, setUserRole] = useState<'admin' | 'barber' | 'attendant' | 'custom'>('custom');
  const [permAdmin, setPermAdmin] = useState(false);
  const [permAtendimento, setPermAtendimento] = useState(false);
  const [permBarbeiro, setPermBarbeiro] = useState(true);
  const [userStatus, setUserStatus] = useState<'active' | 'inactive'>('active');
  const [isSaving, setIsSaving] = useState(false);

  const fetchUsers = async () => {
    try {
      const data = await StorageService.getSystemUsers();
      setUsers(data || []);
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

  const openCreateModal = () => {
    if (!isCurrentUserAdmin) {
      toastError('Acesso Restrito', 'Apenas usuários com perfil Administrador podem cadastrar novos usuários.');
      return;
    }
    setEditingUser(null);
    setUserName('');
    setUserPhone('');
    setUserPassword('123');
    setUserRole('barber');
    setPermAdmin(false);
    setPermAtendimento(false);
    setPermBarbeiro(true);
    setUserStatus('active');
    setIsModalOpen(true);
  };

  const openEditModal = (user: SystemUser) => {
    if (!isCurrentUserAdmin) {
      toastError('Acesso Restrito', 'Apenas usuários com perfil Administrador podem editar usuários.');
      return;
    }
    setEditingUser(user);
    setUserName(user.name);
    setUserPhone(user.phone);
    setUserPassword(user.password || '');
    setUserRole(user.role || 'custom');
    setPermAdmin(user.permissions?.can_access_admin || false);
    setPermAtendimento(user.permissions?.can_access_atendimento || false);
    setPermBarbeiro(user.permissions?.can_access_barbeiro || false);
    setUserStatus(user.status || 'active');
    setIsModalOpen(true);
  };

  const handleRoleQuickSelect = (role: 'admin' | 'barber' | 'attendant' | 'custom') => {
    setUserRole(role);
    if (role === 'admin') {
      setPermAdmin(true);
      setPermAtendimento(true);
      setPermBarbeiro(true);
    } else if (role === 'barber') {
      setPermAdmin(false);
      setPermAtendimento(false);
      setPermBarbeiro(true);
    } else if (role === 'attendant') {
      setPermAdmin(false);
      setPermAtendimento(true);
      setPermBarbeiro(false);
    }
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isCurrentUserAdmin) {
      toastError('Acesso Restrito', 'Apenas usuários com perfil Administrador podem salvar alterações de usuários.');
      return;
    }
    const cleanPhone = userPhone.replace(/\D/g, '');
    if (!userName.trim()) {
      toastError('Aviso', 'Informe o nome do usuário.');
      return;
    }
    if (cleanPhone.length < 8) {
      toastError('Aviso', 'Informe um número de telefone válido com DDD (ex: 81996138924).');
      return;
    }
    if (!userPassword.trim()) {
      toastError('Aviso', 'Informe uma senha ou PIN de acesso.');
      return;
    }

    setIsSaving(true);
    try {
      const newUser: SystemUser = {
        id: editingUser ? editingUser.id : `user-${Date.now()}`,
        name: userName.trim(),
        phone: cleanPhone,
        password: userPassword.trim(),
        pin: userPassword.trim().slice(0, 6),
        role: userRole,
        permissions: {
          can_access_admin: permAdmin,
          can_access_atendimento: permAtendimento,
          can_access_barbeiro: permBarbeiro,
        },
        status: userStatus,
        created_at: editingUser?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      await StorageService.saveSystemUser(newUser);
      await fetchUsers();
      setIsModalOpen(false);
      success('Usuário Salvo', `Permissões de ${newUser.name} atualizadas com sucesso!`);
    } catch (err) {
      toastError('Erro', 'Falha ao salvar usuário.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteUser = async (user: SystemUser) => {
    if (!isCurrentUserAdmin) {
      toastError('Acesso Restrito', 'Apenas usuários com perfil Administrador podem excluir usuários.');
      return;
    }
    if (user.phone.replace(/\D/g, '') === '81996138924' && users.length === 1) {
      toastError('Ação Bloqueada', 'O administrador principal não pode ser excluído.');
      return;
    }
    if (!window.confirm(`Tem certeza de que deseja excluir o acesso de "${user.name}"?`)) return;

    try {
      await StorageService.deleteSystemUser(user.id);
      await fetchUsers();
      success('Usuário Removido', `O acesso de ${user.name} foi revogado.`);
    } catch (err) {
      toastError('Erro', 'Falha ao excluir usuário.');
    }
  };

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

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Read-only notice if not admin */}
      {!isCurrentUserAdmin && (
        <div className="p-3.5 rounded-2xl bg-amber-950/40 border border-amber-500/30 text-xs text-amber-300 flex items-center gap-2.5 shadow-sm">
          <Lock className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <span>
            <strong>Modo Somente Leitura:</strong> Apenas usuários com perfil <strong>Administrador</strong> têm permissão para criar, editar ou excluir acessos no sistema.
          </span>
        </div>
      )}

      {/* Top Banner / Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-brand-400" />
            <span>Gestão de Usuários & Acessos</span>
          </h2>
          <p className="text-xs text-slate-400">
            Gerencie quais números de telefone têm permissão para acessar os painéis Admin, Atendimento e Barbeiro
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

          <Button
            variant="brand"
            size="sm"
            onClick={openCreateModal}
            disabled={!isCurrentUserAdmin}
            leftIcon={<Plus className="w-4 h-4" />}
            className={`font-bold shadow-glow-brand ${!isCurrentUserAdmin ? 'opacity-40 cursor-not-allowed' : ''}`}
            title={!isCurrentUserAdmin ? 'Apenas administradores podem criar usuários' : 'Novo Usuário'}
          >
            Novo Usuário
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5 rounded-2xl bg-dark-900/70 border-white/10 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 block">Acesso Admin</span>
            <span className="text-2xl font-black text-white">
              {users.filter((u) => u.permissions?.can_access_admin && u.status === 'active').length}
            </span>
            <span className="text-[11px] text-emerald-400 font-semibold block">Acesso total</span>
          </div>
        </Card>

        <Card className="p-5 rounded-2xl bg-dark-900/70 border-white/10 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-brand-400">
            <Scissors className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 block">Painel do Barbeiro</span>
            <span className="text-2xl font-black text-brand-400">
              {users.filter((u) => u.permissions?.can_access_barbeiro && u.status === 'active').length}
            </span>
            <span className="text-[11px] text-slate-400 block">Gestão da cadeira e agenda</span>
          </div>
        </Card>

        <Card className="p-5 rounded-2xl bg-dark-900/70 border-white/10 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 block">Painel de Atendimento</span>
            <span className="text-2xl font-black text-blue-400">
              {users.filter((u) => u.permissions?.can_access_atendimento && u.status === 'active').length}
            </span>
            <span className="text-[11px] text-slate-400 block">Chat e suporte ao cliente</span>
          </div>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 rounded-2xl bg-dark-900/70 border-white/10 flex items-center justify-between gap-4">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome, telefone ou perfil..."
            className="w-full pl-10 pr-3.5 py-2 bg-dark-950 rounded-xl border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-brand-500"
          />
        </div>
        <span className="text-xs text-slate-400 whitespace-nowrap">
          Total: {filteredUsers.length} usuário(s)
        </span>
      </Card>

      {/* Users Table */}
      <Card className="rounded-2xl bg-dark-900/70 border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02] text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="p-4">Usuário</th>
                <th className="p-4">WhatsApp / Telefone</th>
                <th className="p-4">Permissões de Painel</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-300 font-bold flex items-center justify-center text-sm">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="font-bold text-white block">{user.name}</span>
                          <span className="text-[11px] text-slate-400 capitalize">
                            Perfil: {user.role === 'admin' ? 'Administrador' : user.role === 'barber' ? 'Barbeiro' : user.role === 'attendant' ? 'Atendente' : 'Personalizado'}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="flex items-center gap-1.5 font-mono text-slate-300">
                        <Phone className="w-3.5 h-3.5 text-slate-500" />
                        <span>{user.phone}</span>
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {user.permissions?.can_access_admin && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" />
                            Admin
                          </span>
                        )}
                        {user.permissions?.can_access_barbeiro && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-brand-500/20 text-brand-300 border border-brand-500/30 flex items-center gap-1">
                            <Scissors className="w-3 h-3" />
                            Barbeiro
                          </span>
                        )}
                        {user.permissions?.can_access_atendimento && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" />
                            Atendimento
                          </span>
                        )}
                        {!user.permissions?.can_access_admin &&
                          !user.permissions?.can_access_barbeiro &&
                          !user.permissions?.can_access_atendimento && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-500/20 text-slate-400 border border-slate-500/30">
                              Sem Acessos
                            </span>
                          )}
                      </div>
                    </td>

                    <td className="p-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                          user.status === 'active'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-red-500/20 text-red-300 border border-red-500/30'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'active' ? 'bg-emerald-400' : 'bg-red-400'}`} />
                        {user.status === 'active' ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>

                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(user)}
                          disabled={!isCurrentUserAdmin}
                          className={`p-1.5 rounded-lg transition-all ${
                            isCurrentUserAdmin
                              ? 'bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white'
                              : 'opacity-30 cursor-not-allowed text-slate-500'
                          }`}
                          title={!isCurrentUserAdmin ? 'Apenas administradores podem editar' : 'Editar Usuário'}
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteUser(user)}
                          disabled={!isCurrentUserAdmin}
                          className={`p-1.5 rounded-lg transition-all ${
                            isCurrentUserAdmin
                              ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300'
                              : 'opacity-30 cursor-not-allowed text-slate-500'
                          }`}
                          title={!isCurrentUserAdmin ? 'Apenas administradores podem excluir' : 'Excluir Usuário'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    Nenhum usuário encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* CREATE / EDIT USER MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUser ? 'Editar Usuário & Permissões' : 'Cadastrar Novo Usuário'}
        size="md"
      >
        <form onSubmit={handleSaveUser} className="space-y-4 pt-2">
          {/* Quick Profile Select */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">Perfil Pré-configurado:</label>
            <div className="grid grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => handleRoleQuickSelect('barber')}
                className={`py-2 px-2 text-[11px] font-bold rounded-xl border transition-all text-center ${
                  userRole === 'barber'
                    ? 'bg-brand-500/20 border-brand-500 text-brand-300'
                    : 'bg-dark-950 border-white/10 text-slate-400 hover:text-white'
                }`}
              >
                ✂️ Barbeiro
              </button>
              <button
                type="button"
                onClick={() => handleRoleQuickSelect('attendant')}
                className={`py-2 px-2 text-[11px] font-bold rounded-xl border transition-all text-center ${
                  userRole === 'attendant'
                    ? 'bg-blue-500/20 border-blue-500 text-blue-300'
                    : 'bg-dark-950 border-white/10 text-slate-400 hover:text-white'
                }`}
              >
                💬 Atendente
              </button>
              <button
                type="button"
                onClick={() => handleRoleQuickSelect('admin')}
                className={`py-2 px-2 text-[11px] font-bold rounded-xl border transition-all text-center ${
                  userRole === 'admin'
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                    : 'bg-dark-950 border-white/10 text-slate-400 hover:text-white'
                }`}
              >
                🛡️ Admin
              </button>
              <button
                type="button"
                onClick={() => setUserRole('custom')}
                className={`py-2 px-2 text-[11px] font-bold rounded-xl border transition-all text-center ${
                  userRole === 'custom'
                    ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                    : 'bg-dark-950 border-white/10 text-slate-400 hover:text-white'
                }`}
              >
                ⚙️ Custom
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">Nome do Usuário *</label>
            <input
              type="text"
              required
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Ex: Carlos Barbeiro"
              className="w-full px-3.5 py-2.5 rounded-xl bg-dark-950 border border-white/10 text-white text-sm focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Telefone com DDD *</label>
              <input
                type="text"
                required
                value={userPhone}
                onChange={(e) => setUserPhone(e.target.value)}
                placeholder="Ex: 81996138924"
                className="w-full px-3.5 py-2.5 rounded-xl bg-dark-950 border border-white/10 text-white text-sm font-mono focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Senha / PIN de Acesso *</label>
              <input
                type="text"
                required
                value={userPassword}
                onChange={(e) => setUserPassword(e.target.value)}
                placeholder="Ex: 1234"
                className="w-full px-3.5 py-2.5 rounded-xl bg-dark-950 border border-white/10 text-white text-sm font-mono focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          {/* PERMISSIONS CHECKBOXES */}
          <div className="space-y-2 pt-2 border-t border-white/10">
            <label className="text-xs font-bold text-white block">
              Permissões de Acesso aos Painéis:
            </label>

            <div className="space-y-2 bg-dark-950 p-3.5 rounded-xl border border-white/10">
              <label className="flex items-center gap-3 cursor-pointer hover:text-white transition-colors">
                <input
                  type="checkbox"
                  checked={permBarbeiro}
                  onChange={(e) => setPermBarbeiro(e.target.checked)}
                  className="w-4 h-4 rounded text-brand-500 focus:ring-brand-500 bg-dark-900 border-white/20"
                />
                <div className="flex items-center gap-2 text-xs">
                  <Scissors className="w-4 h-4 text-brand-400" />
                  <span className="font-bold text-slate-200">Painel do Barbeiro (/barbeiro)</span>
                  <span className="text-[10px] text-slate-400">- Gerenciar agenda e cadeira</span>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer hover:text-white transition-colors">
                <input
                  type="checkbox"
                  checked={permAtendimento}
                  onChange={(e) => setPermAtendimento(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-500 focus:ring-blue-500 bg-dark-900 border-white/20"
                />
                <div className="flex items-center gap-2 text-xs">
                  <MessageSquare className="w-4 h-4 text-blue-400" />
                  <span className="font-bold text-slate-200">Painel de Atendimento (/atendente)</span>
                  <span className="text-[10px] text-slate-400">- Conversas do WhatsApp</span>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer hover:text-white transition-colors">
                <input
                  type="checkbox"
                  checked={permAdmin}
                  onChange={(e) => setPermAdmin(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500 bg-dark-900 border-white/20"
                />
                <div className="flex items-center gap-2 text-xs">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold text-slate-200">Painel Administrativo (/admin)</span>
                  <span className="text-[10px] text-slate-400">- Controle total da barbearia</span>
                </div>
              </label>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">Status do Usuário</label>
            <select
              value={userStatus}
              onChange={(e) => setUserStatus(e.target.value as any)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-dark-950 border border-white/10 text-white text-sm focus:outline-none focus:border-brand-500"
            >
              <option value="active">Ativo (Permitir Login)</option>
              <option value="inactive">Inativo (Bloquear Login)</option>
            </select>
          </div>

          <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="brand"
              size="sm"
              isLoading={isSaving}
              className="font-bold shadow-glow-brand"
            >
              Salvar Usuário
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
