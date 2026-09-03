import React, { useState, useEffect, useMemo } from 'react';
import { 
  Activity, 
  Search, 
  Filter, 
  Download, 
  Trash2, 
  RefreshCw, 
  Calendar, 
  MessageSquare, 
  Scissors, 
  Bot, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  User, 
  Phone, 
  FileText, 
  Eye, 
  ChevronRight,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownLeft,
  Server,
  Zap,
  Check
} from 'lucide-react';
import { StorageService } from '../../lib/storage';
import { AuditLog } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../contexts/ToastContext';

export const LogsPage: React.FC = () => {
  const { success, error: toastError, info } = useToast();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Filters
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Selected Log for Inspection Modal
  const [inspectingLog, setInspectingLog] = useState<AuditLog | null>(null);

  const fetchLogs = async () => {
    try {
      const data = await StorageService.getLogs();
      setLogs(data || []);
    } catch (err) {
      console.error('Erro ao buscar logs:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    fetchLogs();
  };

  const handleClearLogs = async () => {
    if (!window.confirm('Tem certeza de que deseja limpar todos os registros de log?')) return;
    try {
      await StorageService.clearLogs();
      setLogs([]);
      success('Logs Limpos', 'O histórico de logs foi limpo com sucesso.');
    } catch (err) {
      toastError('Erro', 'Falha ao limpar histórico de logs.');
    }
  };

  const handleExportLogs = () => {
    if (logs.length === 0) {
      info('Aviso', 'Nenhum log disponível para exportação.');
      return;
    }

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `auditoria_talvane_logs_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    success('Exportação Concluída', 'Arquivo JSON baixado com sucesso.');
  };

  // Filtered logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // Type Filter
      if (selectedType !== 'all') {
        if (selectedType === 'appointment' && !log.type.startsWith('appointment')) return false;
        if (selectedType === 'message' && !log.type.startsWith('message')) return false;
        if (selectedType === 'bot' && log.type !== 'bot_flow') return false;
        if (selectedType === 'system' && log.type !== 'system') return false;
      }

      // Period Filter
      if (selectedPeriod !== 'all') {
        const logDate = new Date(log.created_at);
        const now = new Date();
        const diffHours = (now.getTime() - logDate.getTime()) / (1000 * 3600);

        if (selectedPeriod === 'today' && diffHours > 24) return false;
        if (selectedPeriod === 'week' && diffHours > 168) return false;
      }

      // Search
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const phone = (log.contact_phone || '').toLowerCase();
        const name = (log.contact_name || '').toLowerCase();
        const title = (log.title || '').toLowerCase();
        const desc = (log.description || '').toLowerCase();

        if (
          !phone.includes(term) &&
          !name.includes(term) &&
          !title.includes(term) &&
          !desc.includes(term)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [logs, selectedType, selectedPeriod, searchTerm]);

  // Statistics
  const stats = useMemo(() => {
    const total = logs.length;
    const appointments = logs.filter((l) => l.type.startsWith('appointment')).length;
    const messages = logs.filter((l) => l.type.startsWith('message')).length;
    const system = logs.filter((l) => l.type === 'system').length;

    return { total, appointments, messages, system };
  }, [logs]);

  const getLogIcon = (type: AuditLog['type']) => {
    switch (type) {
      case 'appointment_created':
        return <Calendar className="w-4 h-4 text-emerald-400" />;
      case 'appointment_status':
        return <Scissors className="w-4 h-4 text-brand-400" />;
      case 'message_inbound':
        return <ArrowDownLeft className="w-4 h-4 text-blue-400" />;
      case 'message_outbound':
        return <ArrowUpRight className="w-4 h-4 text-purple-400" />;
      case 'bot_flow':
        return <Bot className="w-4 h-4 text-brand-300" />;
      case 'system':
      default:
        return <Activity className="w-4 h-4 text-amber-400" />;
    }
  };

  const getLogBadge = (type: AuditLog['type']) => {
    switch (type) {
      case 'appointment_created':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            Novo Agendamento
          </span>
        );
      case 'appointment_status':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-500/20 text-brand-300 border border-brand-500/30">
            Status Agendamento
          </span>
        );
      case 'message_inbound':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
            Cliente → WhatsApp
          </span>
        );
      case 'message_outbound':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
            WhatsApp → Cliente
          </span>
        );
      case 'bot_flow':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            Fluxo do Robô
          </span>
        );
      case 'system':
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/20 text-slate-300 border border-slate-500/30">
            Sistema / Conexão
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 rounded-2xl bg-dark-900/70 border-white/10 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Total de Registros</span>
            <Activity className="w-4 h-4 text-brand-400" />
          </div>
          <p className="text-2xl font-black text-white">{stats.total}</p>
          <p className="text-xs text-slate-400">Monitoramento contínuo</p>
        </Card>

        <Card className="p-5 rounded-2xl bg-dark-900/70 border-white/10 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Eventos de Agenda</span>
            <Calendar className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-400">{stats.appointments}</p>
          <p className="text-xs text-slate-400">Criações e atualizações</p>
        </Card>

        <Card className="p-5 rounded-2xl bg-dark-900/70 border-white/10 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Mensagens no WhatsApp</span>
            <MessageSquare className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-black text-blue-400">{stats.messages}</p>
          <p className="text-xs text-slate-400">Entradas e saídas</p>
        </Card>

        <Card className="p-5 rounded-2xl bg-dark-900/70 border-white/10 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Eventos de Sistema</span>
            <Server className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-amber-400">{stats.system}</p>
          <p className="text-xs text-slate-400">Conexões e robô</p>
        </Card>
      </div>

      {/* Control Bar: Filters, Search, Refresh, Export, Clear */}
      <Card className="p-5 rounded-2xl bg-dark-900/70 border-white/10 space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por cliente, telefone ou texto..."
              className="w-full pl-10 pr-3.5 py-2 bg-dark-950 rounded-xl border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-brand-500"
            />
          </div>

          {/* Type and Period Dropdowns */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-2 bg-dark-950 rounded-xl border border-white/10 text-white text-xs focus:outline-none focus:border-brand-500"
            >
              <option value="all">Todos os Tipos</option>
              <option value="appointment">Agendamentos</option>
              <option value="message">Mensagens WhatsApp</option>
              <option value="bot">Fluxo do Robô</option>
              <option value="system">Sistema / Conexão</option>
            </select>

            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-3 py-2 bg-dark-950 rounded-xl border border-white/10 text-white text-xs focus:outline-none focus:border-brand-500"
            >
              <option value="all">Todo o Período</option>
              <option value="today">Últimas 24 Horas</option>
              <option value="week">Últimos 7 Dias</option>
            </select>

            <Button
              variant="outline"
              size="sm"
              onClick={handleManualRefresh}
              leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-brand-400' : ''}`} />}
            >
              Atualizar
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleExportLogs}
              leftIcon={<Download className="w-3.5 h-3.5" />}
            >
              Exportar
            </Button>

            <Button
              variant="danger"
              size="sm"
              onClick={handleClearLogs}
              leftIcon={<Trash2 className="w-3.5 h-3.5" />}
            >
              Limpar
            </Button>
          </div>
        </div>
      </Card>

      {/* Logs Table / Stream */}
      <Card className="rounded-2xl bg-dark-900/70 border-white/10 overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-brand-400" />
            <h3 className="text-sm font-bold text-white">Stream de Auditoria em Tempo Real</h3>
          </div>
          <span className="text-xs text-slate-400">
            Exibindo {filteredLogs.length} de {logs.length} eventos
          </span>
        </div>

        {filteredLogs.length > 0 ? (
          <div className="divide-y divide-white/5">
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className="p-4 hover:bg-white/[0.02] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    {getLogIcon(log.type)}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-white">{log.title}</span>
                      {getLogBadge(log.type)}
                      {log.contact_name && (
                        <span className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                          <User className="w-3 h-3 text-slate-400" />
                          {log.contact_name}
                        </span>
                      )}
                      {log.contact_phone && (
                        <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-500" />
                          {log.contact_phone}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-300 line-clamp-2">{log.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 sm:flex-shrink-0 self-end sm:self-center">
                  <span className="text-[11px] font-mono text-slate-400">
                    {new Date(log.created_at).toLocaleString('pt-BR')}
                  </span>

                  <button
                    type="button"
                    onClick={() => setInspectingLog(log)}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-brand-300 transition-all flex items-center gap-1 text-xs font-semibold"
                    title="Inspecionar Detalhes"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Detalhes</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center space-y-3">
            <Activity className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-sm font-bold text-white">Nenhum registro de log encontrado.</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Tente alterar os filtros acima ou aguarde novas interações no WhatsApp e no fluxo de agendamento.
            </p>
          </div>
        )}
      </Card>

      {/* INSPECTION MODAL */}
      <Modal
        isOpen={Boolean(inspectingLog)}
        onClose={() => setInspectingLog(null)}
        title="Detalhes do Evento de Auditoria"
        size="lg"
      >
        {inspectingLog && (
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div>
                <h4 className="text-base font-bold text-white">{inspectingLog.title}</h4>
                <p className="text-xs text-slate-400 font-mono">ID: {inspectingLog.id}</p>
              </div>
              {getLogBadge(inspectingLog.type)}
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-dark-950 border border-white/10">
                <span className="text-slate-400 block mb-0.5">Data e Hora</span>
                <span className="font-mono text-white font-bold">
                  {new Date(inspectingLog.created_at).toLocaleString('pt-BR')}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-dark-950 border border-white/10">
                <span className="text-slate-400 block mb-0.5">Cliente Relacionado</span>
                <span className="text-white font-bold">
                  {inspectingLog.contact_name || inspectingLog.contact_phone || 'Sistema / Geral'}
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-bold text-slate-300">Descrição do Evento:</span>
              <div className="p-3 rounded-xl bg-dark-950 border border-white/10 text-xs text-slate-200">
                {inspectingLog.description}
              </div>
            </div>

            {inspectingLog.details && Object.keys(inspectingLog.details).length > 0 && (
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-slate-300">Payload & Variáveis do Evento:</span>
                <pre className="p-3 rounded-xl bg-dark-950 border border-white/10 text-[11px] font-mono text-emerald-400 overflow-x-auto max-h-60">
                  {JSON.stringify(inspectingLog.details, null, 2)}
                </pre>
              </div>
            )}

            <div className="pt-3 border-t border-white/10 flex justify-end">
              <Button
                variant="brand"
                size="sm"
                onClick={() => setInspectingLog(null)}
              >
                Fechar
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
