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
  Layers
} from 'lucide-react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Store } from '../types';
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
  const { success, info } = useToast();

  useEffect(() => {
    async function loadStores() {
      setIsLoading(true);
      try {
        const data = await StorageService.getStores();
        setStores(data);
      } catch (err) {
        console.error('Error loading stores:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadStores();
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
                3 Unidades Ativas
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
              Gestão Centralizada da Rede
            </h2>
            <p className="text-slate-400 text-sm mt-1 max-w-xl">
              Monitore o faturamento, status operacional e conversas ativas das lojas físicas e da central de e-commerce da Pitoco de Gente.
            </p>
          </div>

          {selectedStoreId && (
            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-xs text-slate-400">Filtrando por:</span>
                <p className="text-sm font-semibold text-pitoco-blue">
                  {stores.find(s => s.id === selectedStoreId)?.name}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearFilter}
                className="border-white/10 hover:bg-white/5 text-xs text-slate-300"
              >
                Ver Todas as Lojas
              </Button>
            </div>
          )}
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
              Filiais Operando
            </span>
            <p className="text-xl md:text-2xl font-bold text-white">3 de 3 lojas</p>
            <span className="text-[11px] text-emerald-400 font-medium">100% online</span>
          </div>
        </div>
      </div>

      {/* Grid das Lojas */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <StoreIcon className="w-5 h-5 text-pitoco-blue" />
            Filiais & Canais de Venda
          </h3>
          <span className="text-xs text-slate-400">
            Clique em "Entrar na Loja" para alternar o foco gerencial
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stores.map((store) => {
            const isSelected = selectedStoreId === store.id;
            return (
              <Card 
                key={store.id} 
                className={`relative transition-all duration-200 overflow-hidden flex flex-col justify-between ${
                  isSelected 
                    ? 'border-pitoco-blue shadow-glow-primary bg-dark-900/90 ring-1 ring-pitoco-blue' 
                    : 'hover:border-white/20 bg-dark-850'
                }`}
              >
                {/* Header do Card */}
                <div className="p-6">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <span className="text-[11px] font-semibold text-pitoco-blue tracking-wider uppercase">
                        {store.slug === 'ecommerce' ? 'Canal Digital' : 'Loja Física'}
                      </span>
                      <h4 className="text-lg font-bold text-white mt-0.5">
                        {store.name}
                      </h4>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      Aberta
                    </span>
                  </div>

                  <div className="space-y-2.5 text-xs text-slate-300 my-4">
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
                        <span>Gerente: *{store.manager_name}*</span>
                      </div>
                    )}
                  </div>

                  {/* Mini estatísticas da filial */}
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

                {/* Ações do Card */}
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
                        Loja Selecionada
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
    </div>
  );
};
