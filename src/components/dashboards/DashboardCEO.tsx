import React from 'react';
import { 
  Building2, 
  ShoppingBag, 
  Bot, 
  Users, 
  GitFork, 
  Calendar, 
  TrendingUp, 
  MessageSquare, 
  LifeBuoy, 
  CheckCircle2, 
  ArrowRight,
  ShieldCheck,
  QrCode,
  DollarSign
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Store, Product, VIPConsultation, DashboardKPIs } from '../../types';
import { formatCurrency } from '../../lib/utils';

interface DashboardCEOProps {
  kpis: DashboardKPIs | null;
  stores: Store[];
  products: Product[];
  tickets?: any[];
  consultations: VIPConsultation[];
  onNavigateTab: (tab: any) => void;
  onSelectStore: (storeId: string | null) => void;
}

export const DashboardCEO: React.FC<DashboardCEOProps> = ({
  kpis,
  stores,
  products,
  consultations,
  onNavigateTab,
  onSelectStore,
}) => {
  const totalRevenue = stores.reduce((acc, s) => acc + (s.monthly_revenue || 0), 0) || kpis?.monthRevenue || 206600;
  const upcomingConsultations = consultations.filter(c => c.status === 'confirmed').length;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* CEO Executive Banner */}
      <div className="p-6 rounded-2xl bg-[#0c0c0e] border border-white/10 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white text-black font-mono">
              PAINEL EXECUTIVO CEO
            </span>
            <span className="text-xs text-zinc-400 font-medium">
              Visão Panorâmica da Rede Pitoco de Gente
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Controle Geral da Operação, Robô & Vendas
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Métricas consolidadas de {stores.length} lojas, microsserviço de WhatsApp Baileys e catálogo completo.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            onClick={() => onNavigateTab('fluxos')}
            className="bg-white hover:bg-zinc-200 text-black font-bold text-xs"
          >
            <GitFork className="w-3.5 h-3.5 mr-1.5" />
            Studio de Fluxos
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onNavigateTab('whatsapp')}
            className="border-white/10 hover:bg-white/5 text-zinc-200 text-xs"
          >
            <QrCode className="w-3.5 h-3.5 mr-1.5" />
            Sessão WhatsApp
          </Button>
        </div>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 sm:p-5 bg-[#0c0c0e] border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400">Faturamento da Rede</span>
            <div className="p-2 rounded-xl bg-white/5 text-white border border-white/10">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl sm:text-2xl font-black text-white block">
              {formatCurrency(totalRevenue)}
            </span>
            <span className="text-[10px] text-emerald-400 font-medium mt-1 inline-flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              Meta mensal 94% atingida
            </span>
          </div>
        </Card>

        <Card className="p-4 sm:p-5 bg-[#0c0c0e] border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400">Atendimentos do Bot</span>
            <div className="p-2 rounded-xl bg-white/5 text-white border border-white/10">
              <Bot className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl sm:text-2xl font-black text-white block">
              {kpis?.messagesSentToday || 2490}
            </span>
            <span className="text-[10px] text-zinc-400 font-medium mt-1 block">
              Mensagens hoje via Baileys
            </span>
          </div>
        </Card>

        <Card className="p-4 sm:p-5 bg-[#0c0c0e] border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400">Transbordo Humano</span>
            <div className="p-2 rounded-xl bg-white/5 text-white border border-white/10">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl sm:text-2xl font-black text-white block">
              {kpis?.waitingHuman || 3}
            </span>
            <span className="text-[10px] text-amber-400 font-medium mt-1 block">
              Clientes aguardando consultora
            </span>
          </div>
        </Card>

        <Card 
          onClick={() => onNavigateTab('clientes')}
          className="p-4 sm:p-5 bg-[#0c0c0e] border-white/10 cursor-pointer hover:border-white/25 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400">Base de Clientes</span>
            <div className="p-2 rounded-xl bg-white/5 text-white border border-white/10">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl sm:text-2xl font-black text-white block">
              {kpis?.totalContacts || 1240}
            </span>
            <span className="text-[10px] text-zinc-400 font-medium mt-1 block">
              Contatos ativos no CRM
            </span>
          </div>
        </Card>
      </div>

      {/* Rede de Lojas Summary for CEO */}
      <Card className="p-6 bg-[#0c0c0e] border-white/10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-white" />
              Desempenho da Rede de Filiais
            </h3>
            <p className="text-xs text-zinc-400">
              Acompanhamento de vendas e atendimentos em cada unidade física e online
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onNavigateTab('lojas')}
            className="border-white/10 hover:bg-white/5 text-xs text-zinc-300"
          >
            Gerenciar Lojas
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {stores.map(store => (
            <div
              key={store.id}
              onClick={() => {
                onSelectStore(store.id);
                onNavigateTab('lojas');
              }}
              className="p-4 rounded-xl bg-[#141416] border border-white/5 hover:border-white/20 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-white group-hover:text-zinc-200 transition-colors">
                  {store.name}
                </span>
                <span className={`text-[9px] px-2 py-0.5 rounded-full font-semibold ${
                  store.is_active ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-zinc-800 text-zinc-400'
                }`}>
                  {store.is_active ? 'Ativa' : 'Inativa'}
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 mb-3">{store.city || store.address}</p>

              <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
                <span className="text-zinc-400">Faturamento:</span>
                <span className="font-bold text-white">
                  {formatCurrency(store.monthly_revenue || 0)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Quick Access Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card
          onClick={() => onNavigateTab('produtos')}
          className="p-4 bg-[#0c0c0e] border-white/10 hover:border-white/20 transition-all cursor-pointer flex items-center gap-3.5"
        >
          <div className="p-3 rounded-xl bg-white/5 text-white border border-white/10">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Catálogo de Produtos</h4>
            <p className="text-xs text-zinc-400">{products.length} itens cadastrados</p>
          </div>
        </Card>

        <Card
          onClick={() => onNavigateTab('bot_config')}
          className="p-4 bg-[#0c0c0e] border-white/10 hover:border-white/20 transition-all cursor-pointer flex items-center gap-3.5"
        >
          <div className="p-3 rounded-xl bg-white/5 text-white border border-white/10">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Bot</h4>
            <p className="text-xs text-zinc-400">PIX, fretes e mensagens</p>
          </div>
        </Card>

        <Card
          onClick={() => onNavigateTab('atendimento')}
          className="p-4 bg-[#0c0c0e] border-white/10 hover:border-white/20 transition-all cursor-pointer flex items-center gap-3.5"
        >
          <div className="p-3 rounded-xl bg-white/5 text-white border border-white/10">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Central de Atendimentos</h4>
            <p className="text-xs text-zinc-400">Atendimento ao vivo</p>
          </div>
        </Card>

        <Card
          onClick={() => onNavigateTab('acessos')}
          className="p-4 bg-[#0c0c0e] border-white/10 hover:border-white/20 transition-all cursor-pointer flex items-center gap-3.5"
        >
          <div className="p-3 rounded-xl bg-white/5 text-white border border-white/10">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Gestão de Acessos</h4>
            <p className="text-xs text-zinc-400">Gerentes e consultoras</p>
          </div>
        </Card>
      </div>
    </div>
  );
};
