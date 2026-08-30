import React, { useState, useEffect } from 'react';
import { 
  Users, 
  MessageSquare, 
  GitFork, 
  UserCheck, 
  TrendingUp, 
  ArrowUpRight, 
  Sparkles, 
  ExternalLink, 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  Send, 
  Zap, 
  Plus,
  QrCode,
  AlertTriangle,
  Smartphone
} from 'lucide-react';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { StorageService } from '../../lib/storage';
import { useWhatsApp } from '../../contexts/WhatsAppContext';
import { DashboardKPIs, Conversation, Flow } from '../../types';
import { formatTimeAgo, formatPhone } from '../../lib/utils';

export interface DashboardPageProps {
  onNavigate: (path: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const { isConnected, session } = useWhatsApp();
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [flows, setFlows] = useState<Flow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [kpiData, convs, flowsData] = await Promise.all([
          StorageService.getKPIs(),
          StorageService.getConversations(),
          StorageService.getFlows(),
        ]);
        setKpis(kpiData);
        setConversations(convs);
        setFlows(flowsData);
      } catch (err) {
        console.error('Error loading dashboard data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  const kpiCards = [
    {
      title: 'Total de Contatos',
      value: (kpis?.totalContacts || 0).toLocaleString('pt-BR'),
      change: 'Cadastrados no CRM',
      icon: Users,
      iconBg: 'bg-dark-800 text-slate-200 border-white/10',
      accentColor: 'from-white/10 to-transparent',
      action: () => onNavigate('/contatos'),
    },
    {
      title: 'Conversas Registradas',
      value: (kpis?.totalConversations || 0).toString(),
      change: `${kpis?.activeConversations || 0} ativas no momento`,
      icon: MessageSquare,
      iconBg: 'bg-brand-500/20 text-brand-400 border-brand-500/30',
      accentColor: 'from-brand-500/20 to-transparent',
      action: () => onNavigate('/conversas'),
    },
    {
      title: 'Fluxos Publicados',
      value: (kpis?.activeFlows || 0).toString(),
      change: `De ${flows.length} fluxos criados`,
      icon: GitFork,
      iconBg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      accentColor: 'from-emerald-500/20 to-transparent',
      action: () => onNavigate('/fluxos'),
    },
    {
      title: 'Aguardando Atendente',
      value: (kpis?.waitingHuman || 0).toString(),
      change: (kpis?.waitingHuman || 0) > 0 ? 'Requer atenção imediata' : 'Nenhum contato na fila',
      icon: UserCheck,
      iconBg: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      accentColor: 'from-amber-500/20 to-transparent',
      urgent: (kpis?.waitingHuman || 0) > 0,
      action: () => onNavigate('/conversas'),
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Welcome Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-dark-900 via-dark-900 to-dark-850 border border-white/10 p-6 sm:p-8 overflow-hidden shadow-2xl">
        <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-gradient-to-l from-brand-500/10 to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/30 text-xs font-semibold text-brand-300">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Plataforma 7 Assistente Operacional</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-display font-bold text-white tracking-tight">
              Visão Geral de Automação & Atendimento
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Monitore fluxos automatizados, conversas em tempo real e transferências de atendimento para a equipe humana via WhatsApp Business Cloud API.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="brand"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => onNavigate('/fluxos')}
            >
              Criar Novo Fluxo
            </Button>
            <Button
              variant="secondary"
              leftIcon={<ExternalLink className="w-4 h-4" />}
              onClick={() => onNavigate('/configuracoes')}
            >
              Configurações do Bot
            </Button>
          </div>
        </div>
      </div>

      {/* Disconnected Warning Banner */}
      {!isConnected && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-rose-950/80 via-dark-900 to-dark-900 border border-rose-500/40 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 flex-shrink-0">
              <QrCode className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                Aparelho WhatsApp Não Conectado
                <Badge variant="danger" dot>Ação Necessária</Badge>
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Para que os fluxos automáticos enviem mensagens e o chat ao vivo funcione, escaneie o QR Code no seu WhatsApp.
              </p>
            </div>
          </div>

          <Button
            variant="brand"
            size="sm"
            className="font-bold whitespace-nowrap shadow-glow-brand flex-shrink-0"
            leftIcon={<Smartphone className="w-4 h-4" />}
            onClick={() => onNavigate('/configuracoes')}
          >
            Conectar por QR Code
          </Button>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {kpiCards.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <Card
              key={idx}
              hoverEffect
              onClick={kpi.action}
              className="cursor-pointer relative overflow-hidden group"
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${kpi.accentColor} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
              />
              <div className="relative z-10 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-400">{kpi.title}</span>
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center border ${kpi.iconBg} group-hover:scale-110 transition-transform`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl sm:text-3xl font-display font-extrabold text-white tracking-tight">
                      {kpi.value}
                    </span>
                    {kpi.urgent && (
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                    )}
                  </div>
                  <p className="text-xs text-slate-400 flex items-center gap-1">
                    {kpi.change}
                  </p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Main Content Grid: Recent Conversations & Active Flows */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Conversations (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Conversas Recentes no WhatsApp</CardTitle>
                <p className="text-xs text-slate-400 mt-0.5">Atendimentos em andamento e histórico recente</p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                rightIcon={<ArrowUpRight className="w-4 h-4" />}
                onClick={() => onNavigate('/conversas')}
              >
                Ver Todas
              </Button>
            </CardHeader>

            <div className="divide-y divide-white/5">
              {conversations.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  Nenhuma conversa recente registrada.
                </div>
              ) : (
                conversations.slice(0, 5).map((conv) => (
                  <div
                    key={conv.id}
                    onClick={() => onNavigate('/conversas')}
                    className="py-3.5 px-3 flex items-center justify-between gap-4 hover:bg-white/5 rounded-2xl cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative flex-shrink-0">
                        <div className="w-10 h-10 rounded-2xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-brand-300 font-bold text-xs">
                          {(conv.contact_name || 'CO').substring(0, 2).toUpperCase()}
                        </div>
                        {conv.status === 'waiting_human' && (
                          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-amber-500 rounded-full border-2 border-dark-900 animate-pulse" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white truncate">
                            {conv.contact_name || formatPhone(conv.contact_phone || '')}
                          </span>
                          <Badge
                            variant={
                              conv.status === 'waiting_human'
                                ? 'warning'
                                : conv.status === 'human'
                                ? 'primary'
                                : 'brand'
                            }
                          >
                            {conv.status === 'waiting_human'
                              ? 'Aguardando'
                              : conv.status === 'human'
                              ? 'Humano'
                              : 'Robô'}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-400 truncate mt-0.5 max-w-md">
                          {conv.last_message || 'Iniciou conversa'}
                        </p>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <span className="text-[11px] text-slate-500 font-mono">
                        {formatTimeAgo(conv.last_message_at)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Active Flows Summary & Quick Status (1 col) */}
        <div className="space-y-6">
          {/* Active Flows Card */}
          <Card>
            <CardHeader className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Fluxos de Automação</CardTitle>
                <p className="text-xs text-slate-400 mt-0.5">Status de execução dos robôs</p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                rightIcon={<ArrowUpRight className="w-4 h-4" />}
                onClick={() => onNavigate('/fluxos')}
              >
                Gerenciar
              </Button>
            </CardHeader>

            <div className="space-y-3">
              {flows.slice(0, 3).map((f) => (
                <div
                  key={f.id}
                  onClick={() => onNavigate(`/fluxos/${f.id}`)}
                  className="p-3 rounded-xl bg-dark-850/70 border border-slate-800/80 hover:border-primary-500/40 cursor-pointer transition-all space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white truncate max-w-[180px]">
                      {f.name}
                    </span>
                    <Badge variant={f.status === 'published' ? 'brand' : 'neutral'}>
                      {f.status === 'published' ? 'Publicado' : 'Rascunho'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>{f.node_count || 5} nós conectados</span>
                    <span>v{f.version || 1}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* WhatsApp Connection Health Card */}
          <Card
            className={`border transition-all ${
              isConnected
                ? 'bg-gradient-to-br from-dark-900 to-dark-850 border-brand-500/30'
                : 'bg-gradient-to-br from-rose-950/40 via-dark-900 to-dark-850 border-rose-500/40'
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center border ${
                      isConnected
                        ? 'bg-brand-500/20 border-brand-500/30 text-brand-400'
                        : 'bg-rose-500/20 border-rose-500/30 text-rose-400'
                    }`}
                  >
                    {isConnected ? <CheckCircle2 className="w-4 h-4" /> : <QrCode className="w-4 h-4" />}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Status da Conexão</h4>
                    <p
                      className={`text-[10px] font-mono ${
                        isConnected ? 'text-brand-400' : 'text-rose-400 font-bold'
                      }`}
                    >
                      {isConnected ? `Online (${formatPhone(session.phone || '')})` : 'Desconectado'}
                    </p>
                  </div>
                </div>
                <Badge variant={isConnected ? 'brand' : 'danger'} dot>
                  {isConnected ? 'Ativo' : 'Pendente'}
                </Badge>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                {isConnected
                  ? 'Sessão pareada via QR Code. Mensagens e automações operando normalmente.'
                  : 'Seu WhatsApp ainda não foi conectado. Escaneie o QR Code para ativar o robô.'}
              </p>

              <Button
                size="sm"
                variant={isConnected ? 'outline' : 'brand'}
                className="w-full text-xs font-bold"
                leftIcon={isConnected ? <Smartphone className="w-4 h-4" /> : <QrCode className="w-4 h-4" />}
                onClick={() => onNavigate('/configuracoes')}
              >
                {isConnected ? 'Gerenciar Aparelho' : 'Escanear QR Code Agora'}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
