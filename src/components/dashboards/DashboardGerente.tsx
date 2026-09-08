import React from 'react';
import { 
  Store as StoreIcon, 
  ShoppingBag, 
  MessageSquare, 
  Users, 
  Calendar, 
  TrendingUp, 
  LifeBuoy, 
  AlertTriangle,
  ArrowRight,
  Clock,
  DollarSign
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Store, Product, VIPConsultation, DashboardKPIs } from '../../types';
import { formatCurrency } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';

interface DashboardGerenteProps {
  stores: Store[];
  products: Product[];
  tickets?: any[];
  consultations: VIPConsultation[];
  onNavigateTab: (tab: any) => void;
  selectedStoreId: string | null;
  onSelectStore: (id: string | null) => void;
}

export const DashboardGerente: React.FC<DashboardGerenteProps> = ({
  stores,
  products,
  consultations,
  onNavigateTab,
  selectedStoreId,
  onSelectStore,
}) => {
  const { user } = useAuth();
  
  // Loja do gerente ou primeira loja ativa
  const currentStore = stores.find(s => s.id === (selectedStoreId || user?.store_id)) || stores[0] || null;
  const storeProducts = products.filter(p => !p.store_id || p.store_id === currentStore?.id);
  const lowStockProducts = storeProducts.filter(p => p.stock_quantity <= 15);
  const storeConsultations = consultations.filter(c => !c.store_id || c.store_id === currentStore?.id);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Gerente Store Header */}
      <div className="p-6 rounded-2xl bg-[#0c0c0e] border border-white/10 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
              PAINEL DE GESTÃO DA FILIAL
            </span>
            <span className="text-xs text-zinc-400 font-medium">
              Operação de Loja & Atendimento
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <StoreIcon className="w-5 h-5 text-emerald-400" />
            {currentStore ? currentStore.name : 'Loja Vinculada'}
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            {currentStore?.city} • Horário: {currentStore?.business_hours || '09:00 às 19:00'} • Gerente: {user?.name || currentStore?.manager_name}
          </p>
        </div>

        {/* Seletor de Filial caso o usuário tenha acesso a mais lojas */}
        {stores.length > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400">Filial:</span>
            <select
              value={currentStore?.id || ''}
              onChange={e => onSelectStore(e.target.value)}
              className="px-3 py-2 bg-[#141416] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-white"
            >
              {stores.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Gerente KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 sm:p-5 bg-[#0c0c0e] border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400">Faturamento da Loja</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl sm:text-2xl font-black text-white block">
              {formatCurrency(currentStore?.monthly_revenue || 68400)}
            </span>
            <span className="text-[10px] text-emerald-400 font-medium mt-1 block">
              Mês corrente
            </span>
          </div>
        </Card>

        <Card className="p-4 sm:p-5 bg-[#0c0c0e] border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400">Chats na Loja</span>
            <div className="p-2 rounded-xl bg-white/5 text-white border border-white/10">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl sm:text-2xl font-black text-white block">
              {currentStore?.active_chats || 42}
            </span>
            <span className="text-[10px] text-zinc-400 font-medium mt-1 block">
              Atendimentos ativos hoje
            </span>
          </div>
        </Card>

        <Card 
          onClick={() => onNavigateTab('clientes')}
          className="p-4 sm:p-5 bg-[#0c0c0e] border-white/10 cursor-pointer hover:border-white/25 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400">Clientes da Filial</span>
            <div className="p-2 rounded-xl bg-white/5 text-white border border-white/10">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl sm:text-2xl font-black text-white block">
              {currentStore?.active_chats ? currentStore.active_chats * 4 : 142}
            </span>
            <span className="text-[10px] text-zinc-400 font-medium mt-1 block">
              Contatos vinculados à unidade
            </span>
          </div>
        </Card>

        <Card className="p-4 sm:p-5 bg-[#0c0c0e] border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400">Alerta de Estoque</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl sm:text-2xl font-black text-white block">
              {lowStockProducts.length}
            </span>
            <span className="text-[10px] text-amber-400 font-medium mt-1 block">
              Itens com estoque baixo
            </span>
          </div>
        </Card>
      </div>

      {/* Consultorias Agendadas & Estoque Crítico */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Próximas Consultorias */}
        <Card className="p-5 bg-[#0c0c0e] border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-400" />
              Próximos Agendamentos na Loja
            </h3>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onNavigateTab('agendamentos')}
              className="text-xs border-white/10 hover:bg-white/5 text-zinc-300"
            >
              Ver Agenda
            </Button>
          </div>

          <div className="space-y-3">
            {storeConsultations.slice(0, 4).map(c => (
              <div key={c.id} className="p-3 rounded-xl bg-[#141416] border border-white/5 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white block">{c.client_name}</span>
                  <span className="text-[11px] text-zinc-400 flex items-center gap-1.5 mt-0.5">
                    <Clock className="w-3 h-3 text-zinc-500" />
                    {c.consultation_date} às {c.consultation_time} • {c.consultation_type === 'presencial_loja' ? 'Presencial na Loja' : 'WhatsApp Online'}
                  </span>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  c.status === 'confirmed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-zinc-800 text-zinc-400'
                }`}>
                  {c.status === 'confirmed' ? 'Confirmado' : c.status}
                </span>
              </div>
            ))}
            {storeConsultations.length === 0 && (
              <p className="text-xs text-zinc-500 text-center py-6">Nenhum agendamento pendente nesta filial.</p>
            )}
          </div>
        </Card>

        {/* Alertas de Estoque Crítico */}
        <Card className="p-5 bg-[#0c0c0e] border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Estoque com Reposição Urgente
            </h3>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onNavigateTab('produtos')}
              className="text-xs border-white/10 hover:bg-white/5 text-zinc-300"
            >
              Catálogo
            </Button>
          </div>

          <div className="space-y-3">
            {lowStockProducts.slice(0, 4).map(p => (
              <div key={p.id} className="p-3 rounded-xl bg-[#141416] border border-white/5 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white block">{p.name}</span>
                  <span className="text-[11px] text-zinc-400 mt-0.5 block">{formatCurrency(p.price)} • {p.material}</span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-amber-400 block">{p.stock_quantity} un</span>
                  <span className="text-[9px] text-zinc-500">restantes</span>
                </div>
              </div>
            ))}
            {lowStockProducts.length === 0 && (
              <p className="text-xs text-zinc-500 text-center py-6">Estoque da filial em níveis adequados.</p>
            )}
          </div>
        </Card>
      </div>

      {/* Ações Rápidas do Gerente */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card
          onClick={() => onNavigateTab('atendimento')}
          className="p-4 bg-[#0c0c0e] border-white/10 hover:border-white/20 transition-all cursor-pointer flex items-center gap-3.5"
        >
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Central de Atendimentos</h4>
            <p className="text-xs text-zinc-400">Atender e transferir clientes</p>
          </div>
        </Card>

        <Card
          onClick={() => onNavigateTab('produtos')}
          className="p-4 bg-[#0c0c0e] border-white/10 hover:border-white/20 transition-all cursor-pointer flex items-center gap-3.5"
        >
          <div className="p-3 rounded-xl bg-white/5 text-white border border-white/10">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Catálogo de Produtos</h4>
            <p className="text-xs text-zinc-400">Ajustar estoque e detalhes</p>
          </div>
        </Card>

        <Card
          onClick={() => onNavigateTab('clientes')}
          className="p-4 bg-[#0c0c0e] border-white/10 hover:border-white/20 transition-all cursor-pointer flex items-center gap-3.5"
        >
          <div className="p-3 rounded-xl bg-white/5 text-white border border-white/10">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Gestão de Clientes</h4>
            <p className="text-xs text-zinc-400">Carteira da loja e CRM</p>
          </div>
        </Card>
      </div>
    </div>
  );
};
