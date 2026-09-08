import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  TrendingUp, 
  ShoppingBag, 
  MessageSquare, 
  Users, 
  ArrowRight, 
  MapPin, 
  Phone, 
  Clock, 
  CheckCircle2, 
  Filter, 
  ChevronRight, 
  DollarSign, 
  Sparkles,
  Store as StoreIcon,
  Layers,
  Plus,
  Edit3,
  Trash2,
  X
} from 'lucide-react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Store, SystemUser } from '../types';
import { StorageService } from '../lib/storage';
import { useToast } from '../contexts/ToastContext';

interface RedeLojasViewProps {
  onSelectStore?: (store: Store | null) => void;
  onNavigate?: (path: string) => void;
}

export const RedeLojasView: React.FC<RedeLojasViewProps> = ({ onSelectStore, onNavigate }) => {
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(() => {
    return StorageService.getActiveStoreFilter();
  });
  const [isLoading, setIsLoading] = useState(true);
  const { success, info, warning } = useToast();

  // Modal State for Store Form
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<Store | null>(null);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [systemUsers, setSystemUsers] = useState<SystemUser[]>([]);
  const [formSlug, setFormSlug] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formHours, setFormHours] = useState('Seg a Sex: 08:00 às 18:00 | Sáb: 08:00 às 13:00');
  const [formCity, setFormCity] = useState('');
  const [formManager, setFormManager] = useState('');
  const [formActive, setFormActive] = useState(true);

  const HOURS_PRESETS = [
    { label: 'Comércio de Rua', value: 'Seg a Sex: 08:00 às 18:00 | Sáb: 08:00 às 13:00' },
    { label: 'Comercial Padrão', value: 'Seg a Sáb: 09:00 às 19:00' },
    { label: 'Shopping Center', value: 'Seg a Sáb: 10:00 às 22:00 | Dom: 12:00 às 21:00' },
    { label: '24h Online', value: '24h Online / E-commerce' },
  ];

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [storesData, usersData] = await Promise.all([
          StorageService.getStores(),
          StorageService.getSystemUsers(),
        ]);
        setStores(storesData);
        setSystemUsers(usersData);
      } catch (err) {
        console.error('Error loading stores:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const totalRevenue = stores.reduce((acc, s) => acc + (s.monthly_revenue || 0), 0);
  const totalActiveChats = stores.reduce((acc, s) => acc + (s.active_chats || 0), 0);

  const handleEnterStore = (store: Store) => {
    setSelectedStoreId(store.id);
    StorageService.setActiveStoreFilter(store.id);
    if (onSelectStore) {
      onSelectStore(store);
    }
    success(`Entrando na ${store.name}`, 'Visão gerencial aplicada a esta filial');
  };

  const handleClearFilter = () => {
    setSelectedStoreId(null);
    StorageService.setActiveStoreFilter(null);
    if (onSelectStore) {
      onSelectStore(null);
    }
    info('Visão Geral da Rede Restaurada', 'Exibindo dados consolidados de todas as filiais');
  };

  const handleOpenCreateModal = () => {
    setEditingStore(null);
    setFormName('');
    setFormSlug('');
    setFormAddress('');
    setFormPhone('8132211000');
    setFormHours('Seg a Sex: 08:00 às 18:00 | Sáb: 08:00 às 13:00');
    setFormCity('Recife - PE');
    setFormManager('');
    setFormActive(true);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (store: Store, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingStore(store);
    setFormName(store.name);
    setFormSlug(store.slug);
    setFormAddress(store.address);
    setFormPhone(store.phone);
    setFormHours(store.business_hours || 'Seg a Sex: 08:00 às 18:00 | Sáb: 08:00 às 13:00');
    setFormCity(store.city || 'Recife - PE');
    setFormManager(store.manager_name || '');
    setFormActive(store.is_active);
    setIsModalOpen(true);
  };

  const handleDeleteStore = async (storeId: string, storeName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Tem certeza que deseja excluir a filial "${storeName}" da rede?`)) return;

    await StorageService.deleteStore(storeId);
    setStores(prev => prev.filter(s => s.id !== storeId));
    if (selectedStoreId === storeId) {
      handleClearFilter();
    }
    success(`Filial "${storeName}" removida com sucesso!`);
  };

  const handleSaveStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const payload: Partial<Store> = {
      id: editingStore ? editingStore.id : `store-${Date.now()}`,
      name: formName.trim(),
      slug: formSlug.trim() || formName.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      address: formAddress.trim(),
      phone: formPhone.trim(),
      whatsapp_number: editingStore?.whatsapp_number || '81996138924',
      business_hours: formHours.trim() || 'Seg a Sex: 08:00 às 18:00 | Sáb: 08:00 às 13:00',
      city: formCity.trim(),
      manager_name: formManager.trim() || undefined,
      is_active: formActive,
    };

    const saved = await StorageService.saveStore(payload);

    setStores(prev => {
      const idx = prev.findIndex(s => s.id === saved.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [...prev, saved];
    });

    setIsModalOpen(false);
    success(
      editingStore ? 'Filial atualizada com sucesso!' : 'Nova filial adicionada à rede!',
      'As alterações foram sincronizadas com o banco e o bot em tempo real'
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Visão Consolidada da Rede */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-dark-900 via-dark-850 to-dark-900 border border-white/10 p-6 md:p-8 shadow-xl">
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-pitoco-blue/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-pitoco-pink/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-pitoco-blue/20 text-pitoco-blue border border-pitoco-blue/30 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" />
                Rede Pitoco de Gente
              </span>
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                {stores.filter(s => s.is_active).length} Unidades Ativas
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
              Gestão Centralizada da Rede
            </h2>
            <p className="text-slate-400 text-sm mt-1 max-w-xl">
              Monitore e gerencie filiais físicas e canal e-commerce. Todas as alterações refletem no bot WhatsApp e no banco de dados em tempo real.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={handleOpenCreateModal}
              className="bg-pitoco-blue text-slate-950 font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-pitoco-blue/20 flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Nova Filial
            </Button>

            {selectedStoreId && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearFilter}
                className="border-white/10 hover:bg-white/5 text-xs text-slate-300"
              >
                Ver Todas as Lojas
              </Button>
            )}
          </div>
        </div>

        {/* Métricas Consolidadas da Rede */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/5">
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
            <span className="text-xs text-slate-400 flex items-center gap-1.5 mb-1">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              Faturamento Consolidado
            </span>
            <p className="text-xl md:text-2xl font-bold text-white">
              R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <span className="text-[11px] text-emerald-400 font-medium">↑ +14.2% este mês</span>
          </div>

          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
            <span className="text-xs text-slate-400 flex items-center gap-1.5 mb-1">
              <ShoppingBag className="w-3.5 h-3.5 text-pitoco-blue" />
              Pedidos da Rede
            </span>
            <p className="text-xl md:text-2xl font-bold text-white">680 pedidos</p>
            <span className="text-[11px] text-slate-400">Ticket médio: R$ 303,80</span>
          </div>

          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
            <span className="text-xs text-slate-400 flex items-center gap-1.5 mb-1">
              <MessageSquare className="w-3.5 h-3.5 text-pitoco-pink" />
              Atendimentos em Aberto
            </span>
            <p className="text-xl md:text-2xl font-bold text-white">{totalActiveChats} conversas</p>
            <span className="text-[11px] text-pitoco-pink">Distribuídas por filial</span>
          </div>

          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
            <span className="text-xs text-slate-400 flex items-center gap-1.5 mb-1">
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              Filiais Cadastradas
            </span>
            <p className="text-xl md:text-2xl font-bold text-white">{stores.length} lojas</p>
            <span className="text-[11px] text-emerald-400 font-medium">Sincronizadas com o Bot</span>
          </div>
        </div>
      </div>

      {/* Grid das Lojas */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <StoreIcon className="w-5 h-5 text-pitoco-blue" />
            Filiais & Canais de Venda ({stores.length})
          </h3>
          <span className="text-xs text-slate-400">
            Gerencie filiais, altere dados ou selecione para filtrar o dashboard
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stores.map((store) => {
            const isSelected = selectedStoreId === store.id;
            return (
              <Card
                key={store.id}
                className={`overflow-hidden transition-all duration-300 border flex flex-col justify-between ${
                  isSelected
                    ? 'border-pitoco-blue bg-dark-900/90 shadow-xl shadow-pitoco-blue/10 ring-1 ring-pitoco-blue/50'
                    : 'border-white/10 bg-dark-900/50 hover:border-white/20'
                }`}
              >
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider block">
                        ID: {store.slug}
                      </span>
                      <h4 className="text-base font-bold text-white mt-0.5">{store.name}</h4>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={(e) => handleOpenEditModal(store, e)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                        title="Editar filial"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteStore(store.id, store.name, e)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="Excluir filial"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium border flex items-center gap-1 ${
                        store.is_active 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${store.is_active ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                        {store.is_active ? 'Ativa' : 'Pausada'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs text-slate-300 my-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{store.address}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{store.business_hours || '08:30 às 18:30'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>WhatsApp: {store.whatsapp_number}</span>
                    </div>
                    {store.manager_name && (
                      <div className="flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Gerente: <strong>{store.manager_name}</strong></span>
                      </div>
                    )}
                  </div>

                  {/* Estatísticas da filial */}
                  <div className="grid grid-cols-2 gap-2 pt-3 border-t border-white/5">
                    <div className="bg-dark-900/60 p-2.5 rounded-lg border border-white/5">
                      <span className="text-[10px] text-slate-400">Faturamento Mês</span>
                      <p className="text-sm font-bold text-emerald-400">
                        R$ {(store.monthly_revenue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div className="bg-dark-900/60 p-2.5 rounded-lg border border-white/5">
                      <span className="text-[10px] text-slate-400">Chats Ativos</span>
                      <p className="text-sm font-bold text-pitoco-blue">
                        {store.active_chats || 0} conversas
                      </p>
                    </div>
                  </div>
                </div>

                {/* Ação: Selecionar Loja */}
                <div className="p-4 bg-dark-950/40 border-t border-white/5 flex items-center justify-between gap-3">
                  <Button
                    onClick={() => handleEnterStore(store)}
                    className={`w-full text-xs font-semibold py-2.5 flex items-center justify-center gap-2 rounded-xl transition-all ${
                      isSelected
                        ? 'bg-pitoco-blue text-slate-900 shadow-md font-bold'
                        : 'bg-white/10 hover:bg-white/15 text-white'
                    }`}
                  >
                    {isSelected ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        Filial Selecionada
                      </>
                    ) : (
                      <>
                        Entrar na Loja
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Modal Criar / Editar Filial */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-dark-900 border border-white/10 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <StoreIcon className="w-5 h-5 text-white" />
                {editingStore ? 'Editar Filial / Canal' : 'Cadastrar Nova Filial'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStore} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Nome da Filial:</label>
                <input
                  type="text"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  placeholder="Ex: Loja Shopping Tacaruna"
                  className="w-full bg-dark-800 border border-white/10 rounded-xl p-2.5 text-white text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Identificador (Slug):</label>
                  <input
                    type="text"
                    value={formSlug}
                    onChange={e => setFormSlug(e.target.value)}
                    placeholder="Ex: tacaruna"
                    className="w-full bg-dark-800 border border-white/10 rounded-xl p-2.5 text-white text-xs"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Cidade / Região:</label>
                  <input
                    type="text"
                    value={formCity}
                    onChange={e => setFormCity(e.target.value)}
                    placeholder="Ex: Olinda - PE"
                    className="w-full bg-dark-800 border border-white/10 rounded-xl p-2.5 text-white text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Endereço Completo:</label>
                <input
                  type="text"
                  value={formAddress}
                  onChange={e => setFormAddress(e.target.value)}
                  placeholder="Ex: Av. Governador Agamenon Magalhães, 153 - Piso L1"
                  className="w-full bg-dark-800 border border-white/10 rounded-xl p-2.5 text-white text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-300 font-semibold block mb-1">Telefone Fixo / Contato:</label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={e => setFormPhone(e.target.value)}
                    placeholder="8132211000"
                    className="w-full bg-[#18181b] border border-white/10 rounded-xl p-2.5 text-white text-xs focus:outline-none focus:border-white/30"
                  />
                </div>
                <div>
                  <label className="text-zinc-300 font-semibold block mb-1">Gerente da Filial:</label>
                  <select
                    value={formManager}
                    onChange={e => setFormManager(e.target.value)}
                    className="w-full bg-[#18181b] border border-white/10 rounded-xl p-2.5 text-white text-xs focus:outline-none focus:border-white/30"
                  >
                    <option value="">-- Sem Gerente Designado --</option>
                    {formManager && !systemUsers.some(u => (u.name || u.username) === formManager) && (
                      <option value={formManager}>{formManager}</option>
                    )}
                    {systemUsers.map(u => (
                      <option key={u.id} value={u.name || u.username}>
                        {u.name || u.username} ({u.role === 'admin' ? 'CEO / Admin' : u.role === 'manager' ? 'Gerente' : 'Consultora'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Horário de Atendimento Profissional */}
              <div className="space-y-1.5">
                <label className="text-zinc-300 font-semibold block">Horário de Atendimento:</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {HOURS_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setFormHours(preset.value)}
                      className={`text-[10px] px-2.5 py-1.5 rounded-lg border text-left truncate transition-all ${
                        formHours === preset.value
                          ? 'bg-white text-black font-bold border-white'
                          : 'bg-[#18181b] text-zinc-400 border-white/10 hover:border-white/30 hover:text-white'
                      }`}
                      title={preset.value}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={formHours}
                  onChange={e => setFormHours(e.target.value)}
                  placeholder="Ex: Seg a Sex: 08:00 às 18:00 | Sáb: 08:00 às 13:00"
                  className="w-full bg-[#18181b] border border-white/10 rounded-xl p-2.5 text-white text-xs focus:outline-none focus:border-white/30 font-mono"
                  required
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="storeActiveCheck"
                  checked={formActive}
                  onChange={e => setFormActive(e.target.checked)}
                  className="rounded bg-[#18181b] border-white/10 text-white focus:ring-0"
                />
                <label htmlFor="storeActiveCheck" className="text-zinc-300 cursor-pointer text-xs">
                  Filial ativa e disponível no bot WhatsApp (número central da rede)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-white/10">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  className="text-xs text-zinc-300 border-white/10 hover:bg-white/5"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="bg-white text-black hover:bg-zinc-200 font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg transition-all"
                >
                  {editingStore ? 'Salvar Modificações' : 'Cadastrar Filial'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
