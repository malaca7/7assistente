import React, { useState, useEffect, useMemo } from 'react';
import { 
  Clock, 
  Calendar, 
  Scissors, 
  MessageSquare, 
  CheckCircle2, 
  Search, 
  User, 
  Sparkles, 
  ChevronRight, 
  ShieldCheck, 
  ExternalLink,
  Phone,
  MapPin,
  Flame,
  AlertCircle,
  RefreshCw,
  Award,
  Zap
} from 'lucide-react';
import { StorageService } from '../../lib/storage';
import { Appointment, AgendaSettings, AgendaServiceItem } from '../../types';
import { Button } from '../../components/ui/Button';

interface ClientQueuePageProps {
  onNavigate: (path: string) => void;
}

export const ClientQueuePage: React.FC<ClientQueuePageProps> = ({ onNavigate }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [agendaSettings, setAgendaSettings] = useState<AgendaSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<Appointment | null | 'not_found'>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Live Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const loadData = async () => {
    try {
      const [aptsData, settingsData] = await Promise.all([
        StorageService.getAppointments(),
        StorageService.getAgendaSettings(),
      ]);
      setAppointments(aptsData || []);
      setAgendaSettings(settingsData);
    } catch (err) {
      console.error('Erro ao carregar dados da fila:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    loadData();
  };

  const todayStr = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  const todayDisplay = useMemo(() => {
    return new Date().toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  }, []);

  const todayAppointments = useMemo(() => {
    return appointments
      .filter((a) => a.appointment_date === todayStr && a.status !== 'cancelled')
      .sort((a, b) => a.appointment_time.localeCompare(b.appointment_time));
  }, [appointments, todayStr]);

  const currentInChair = useMemo(() => {
    const inProg = todayAppointments.find((a) => a.status === 'in_progress');
    if (inProg) return inProg;
    return null;
  }, [todayAppointments]);

  const upcomingQueue = useMemo(() => {
    return todayAppointments.filter((a) => a.status === 'confirmed' || a.status === 'pending');
  }, [todayAppointments]);

  const completedToday = useMemo(() => {
    return todayAppointments.filter((a) => a.status === 'completed');
  }, [todayAppointments]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim().toLowerCase().replace(/\D/g, '');
    const qText = searchQuery.trim().toLowerCase();

    if (!q && !qText) {
      setSearchResult(null);
      return;
    }

    const found = appointments.find((a) => {
      const phoneDigits = (a.contact_phone || '').replace(/\D/g, '');
      const name = (a.contact_name || '').toLowerCase();
      if (q && phoneDigits.includes(q)) return true;
      if (qText && name.includes(qText)) return true;
      return false;
    });

    setSearchResult(found || 'not_found');
  };

  const maskPhone = (phone: string) => {
    const digits = (phone || '').replace(/\D/g, '');
    if (digits.length >= 10) {
      const ddd = digits.slice(-11, -9) || digits.slice(0, 2);
      const last4 = digits.slice(-4);
      return `(${ddd}) 9****-${last4}`;
    }
    return '(**) ****-****';
  };

  const maskName = (name: string) => {
    if (!name) return 'Cliente';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0];
    return `${parts[0]} ${parts[1][0]}.`;
  };

  const botPhone = '5581996138924';
  const whatsappBookingUrl = `https://wa.me/${botPhone}?text=${encodeURIComponent('Olá! Gostaria de agendar um horário na Talvane Barber Shop.')}`;

  return (
    <div className="min-h-screen bg-dark-950 text-slate-100 flex flex-col selection:bg-brand-500 selection:text-white relative overflow-hidden">
      {/* Background Decorative Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-brand-500/10 blur-[130px] pointer-events-none rounded-full" />
      <div className="absolute bottom-10 right-0 w-96 h-96 bg-emerald-500/10 blur-[140px] pointer-events-none rounded-full" />

      {/* Top Bar / Header */}
      <header className="sticky top-0 z-40 bg-dark-900/80 backdrop-blur-xl border-b border-white/10 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-dark-950 font-black shadow-lg shadow-brand-500/20">
            <Scissors className="w-5 h-5 text-dark-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-1.5">
                Talvane Barber Shop
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Fila ao Vivo
              </span>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-1.5">
              <MapPin className="w-3 h-3 text-brand-400" />
              Atendimento por Ordem de Horário Marcado
            </p>
          </div>
        </div>

        {/* Real-time Clock & Refresh */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col items-end">
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-brand-300">
              <Clock className="w-3.5 h-3.5 text-brand-400" />
              <span>{currentTime || '--:--:--'}</span>
            </div>
            <span className="text-[11px] text-slate-400 capitalize">{todayDisplay}</span>
          </div>

          <button
            type="button"
            onClick={handleManualRefresh}
            title="Atualizar Fila"
            className={`p-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 transition-all ${
              isRefreshing ? 'animate-spin text-brand-400' : ''
            }`}
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <a
            href={whatsappBookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/25 transition-all"
          >
            <MessageSquare className="w-4 h-4 fill-current" />
            <span>Agendar pelo WhatsApp</span>
          </a>
        </div>
      </header>

      {/* Hero Banner with Status & Quick WhatsApp CTA */}
      <section className="relative px-4 sm:px-8 pt-8 pb-6 max-w-6xl mx-auto w-full">
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-dark-900/90 via-dark-850 to-dark-900/90 border border-white/10 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-3 max-w-xl text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-300 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Acompanhamento em Tempo Real</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
              Sua vez de renovar o visual na{' '}
              <span className="bg-gradient-to-r from-brand-300 via-brand-400 to-amber-200 bg-clip-text text-transparent">
                Talvane Barber Shop
              </span>
            </h2>
            <p className="text-sm text-slate-300">
              Acompanhe os clientes na cadeira, a ordem de atendimento de hoje ou agende seu corte agora mesmo através do nosso bot oficial no WhatsApp.
            </p>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2">
              <a
                href={whatsappBookingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-xl shadow-emerald-600/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <MessageSquare className="w-4 h-4 fill-current" />
                <span>Quero Agendar Meu Horário</span>
                <ChevronRight className="w-4 h-4" />
              </a>

              <a
                href="#consultar"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 font-semibold text-sm transition-all"
              >
                <Search className="w-4 h-4 text-brand-400" />
                <span>Ver Meu Agendamento</span>
              </a>
            </div>
          </div>

          {/* Status Quick Card */}
          <div className="w-full md:w-72 p-5 rounded-2xl bg-dark-950/80 border border-white/10 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Status da Barbearia</span>
              <span className="font-mono text-emerald-400 font-bold">{currentTime}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 shadow-[0_0_12px_#10b981] animate-pulse" />
              <div>
                <span className="text-sm font-bold text-white block">Atendimento Ativo</span>
                <span className="text-xs text-slate-400">Expediente normal</span>
              </div>
            </div>
            <div className="pt-2 border-t border-white/5 grid grid-cols-2 gap-2 text-center">
              <div className="p-2 rounded-xl bg-white/5">
                <span className="text-xs text-slate-400 block">Fila Hoje</span>
                <span className="text-lg font-black text-white">{todayAppointments.length}</span>
              </div>
              <div className="p-2 rounded-xl bg-white/5">
                <span className="text-xs text-slate-400 block">Realizados</span>
                <span className="text-lg font-black text-emerald-400">{completedToday.length}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="flex-1 px-4 sm:px-8 py-6 max-w-6xl mx-auto w-full space-y-8">
        {/* CURRENTLY SERVING (NA CADEIRA AGORA) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Flame className="w-5 h-5 text-amber-400" />
              <span>Na Cadeira Agora (Em Atendimento)</span>
            </h3>
            <span className="text-xs text-slate-400">Atualização instantânea</span>
          </div>

          {currentInChair ? (
            <div className="p-6 rounded-3xl bg-gradient-to-r from-brand-950/60 via-dark-900 to-brand-950/60 border-2 border-brand-500/50 shadow-2xl relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-brand-500/20 border border-brand-500/40 flex items-center justify-center text-brand-400 font-bold text-xl shadow-inner">
                  <Scissors className="w-7 h-7 text-brand-300 animate-bounce" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-brand-500 text-dark-950 uppercase tracking-wide">
                      Em Atendimento
                    </span>
                    <span className="text-xs font-mono text-brand-300 font-bold">
                      {(() => {
                        const [sh, sm] = (currentInChair.appointment_time || '09:00').split(':').map(Number);
                        const dur = Number(currentInChair.duration_minutes) || 30;
                        const endMin = (sh || 0) * 60 + (sm || 0) + dur;
                        const endH = Math.floor(endMin / 60);
                        const endM = endMin % 60;
                        const endTime = currentInChair.end_time || `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
                        return dur > 30 ? `${currentInChair.appointment_time} às ${endTime}` : currentInChair.appointment_time;
                      })()}
                    </span>
                  </div>
                  <h4 className="text-xl font-black text-white mt-1">
                    {maskName(currentInChair.contact_name)}
                  </h4>
                  <p className="text-xs text-slate-300 flex items-center gap-2">
                    <span>{currentInChair.service_name}</span>
                    <span>•</span>
                    <span className="text-slate-400">{maskPhone(currentInChair.contact_phone)}</span>
                    {Number(currentInChair.duration_minutes) > 30 && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-brand-500/20 text-brand-300 border border-brand-500/30">
                        {currentInChair.duration_minutes} min
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <div className="text-right sm:border-l border-white/10 sm:pl-6">
                <span className="text-xs text-slate-400 block">Profissional</span>
                <span className="text-sm font-bold text-white">Talvane Barber</span>
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-3xl bg-dark-900/60 border border-white/10 text-center space-y-2">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-white/5 flex items-center justify-center text-slate-400">
                <Scissors className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-white">Cadeira Livre no Momento</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Aguardando próximo cliente da fila ou novo agendamento.
              </p>
            </div>
          )}
        </div>

        {/* PRÓXIMOS ATENDIMENTOS DE HOJE (FILA DO DIA) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-brand-400" />
                <span>Próximos Horários de Hoje ({todayDisplay})</span>
              </h3>
              <p className="text-xs text-slate-400">Ordem cronológica dos agendamentos marcados</p>
            </div>
            <span className="text-xs font-bold text-brand-400 bg-brand-500/10 px-3 py-1 rounded-full border border-brand-500/20">
              {upcomingQueue.length} na fila
            </span>
          </div>

          {upcomingQueue.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcomingQueue.map((apt, index) => (
                <div
                  key={apt.id}
                  className="p-4 rounded-2xl bg-dark-900/70 border border-white/10 hover:border-brand-500/40 transition-all space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-white/5 border border-white/10 text-[11px] font-bold text-slate-300 flex items-center justify-center">
                        #{index + 1}
                      </span>
                      <span className="text-sm font-black font-mono text-brand-300">
                        {(() => {
                          const [sh, sm] = (apt.appointment_time || '09:00').split(':').map(Number);
                          const dur = Number(apt.duration_minutes) || 30;
                          const endMin = (sh || 0) * 60 + (sm || 0) + dur;
                          const endH = Math.floor(endMin / 60);
                          const endM = endMin % 60;
                          const endTime = apt.end_time || `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
                          return dur > 30 ? `${apt.appointment_time} às ${endTime}` : apt.appointment_time;
                        })()}
                      </span>
                    </div>
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      Confirmado
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-white">
                      {maskName(apt.contact_name)}
                    </h4>
                    <p className="text-xs text-slate-400 truncate">
                      {apt.service_name}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Telefone: {maskPhone(apt.contact_phone)}</span>
                    <span className="text-emerald-400 font-semibold">Hoje</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 rounded-3xl bg-dark-900/60 border border-white/10 text-center space-y-3">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
              <p className="text-sm font-bold text-white">Fila de espera livre para hoje!</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Ainda temos horários disponíveis hoje. Aproveite para agendar seu corte pelo WhatsApp.
              </p>
              <a
                href={whatsappBookingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20"
              >
                <MessageSquare className="w-4 h-4 fill-current" />
                <span>Agendar Horário Livre Agora</span>
              </a>
            </div>
          )}
        </div>

        {/* CONSULTAR MEU AGENDAMENTO */}
        <div id="consultar" className="p-6 sm:p-8 rounded-3xl bg-dark-900/80 border border-white/10 space-y-5">
          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Search className="w-5 h-5 text-brand-400" />
              <span>Consultar Meu Agendamento</span>
            </h3>
            <p className="text-xs text-slate-400">
              Digite seu número de WhatsApp (com DDD) ou seu nome para ver a confirmação e horário marcado.
            </p>
          </div>

          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ex: 81 99613-8924 ou seu nome..."
                className="w-full pl-11 pr-4 py-3 bg-dark-950 rounded-2xl border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-brand-500 transition-all"
              />
            </div>
            <Button
              type="submit"
              variant="brand"
              size="md"
              className="px-6 font-bold"
              leftIcon={<Search className="w-4 h-4" />}
            >
              Consultar
            </Button>
          </form>

          {/* Search Result Card */}
          {searchResult && searchResult !== 'not_found' && (
            <div className="p-5 rounded-2xl bg-emerald-950/30 border border-emerald-500/40 animate-in fade-in space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Agendamento Encontrado!
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold capitalize bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {searchResult.status === 'confirmed' ? 'Confirmado' : searchResult.status === 'in_progress' ? 'Na Cadeira Agora' : searchResult.status === 'completed' ? 'Concluído' : searchResult.status}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                <div>
                  <span className="text-xs text-slate-400 block">Cliente</span>
                  <span className="text-sm font-bold text-white">{searchResult.contact_name}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">Serviço Escolhido</span>
                  <span className="text-sm font-bold text-white">{searchResult.service_name}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">Data & Horário Marcado</span>
                  <span className="text-sm font-mono font-bold text-brand-300">
                    {searchResult.appointment_date} às {searchResult.appointment_time}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-emerald-500/20 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-300">
                <span>Dúvidas ou deseja remarcar? Fale diretamente com o assistente:</span>
                <a
                  href={`https://wa.me/${botPhone}?text=${encodeURIComponent(`Olá, sou ${searchResult.contact_name} e gostaria de falar sobre meu agendamento de ${searchResult.appointment_date} às ${searchResult.appointment_time}.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-emerald-400 hover:text-emerald-300 underline"
                >
                  Abrir WhatsApp do Estabelecimento →
                </a>
              </div>
            </div>
          )}

          {searchResult === 'not_found' && (
            <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/40 text-amber-300 text-xs flex items-center justify-between gap-3 animate-in fade-in">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>Nenhum agendamento ativo encontrado com estes dados.</span>
              </div>
              <a
                href={whatsappBookingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-white underline underline-offset-2"
              >
                Agendar Agora pelo WhatsApp →
              </a>
            </div>
          )}
        </div>

        {/* CATÁLOGO DE SERVIÇOS */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Scissors className="w-5 h-5 text-brand-400" />
              <span>Nossos Serviços Especializados</span>
            </h3>
            <span className="text-xs text-slate-400">Agende em poucos cliques</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(agendaSettings?.services || [
              { id: '1', name: 'Corte Tradicional', duration_minutes: 30, price: 35 },
              { id: '2', name: 'Barba Completa (Toalha Quente)', duration_minutes: 25, price: 25 },
              { id: '3', name: 'Combo Corte + Barba', duration_minutes: 55, price: 55 },
              { id: '4', name: 'Pezinho & Acabamento', duration_minutes: 15, price: 15 },
              { id: '5', name: 'Sobrancelha Navalhada', duration_minutes: 15, price: 10 },
              { id: '6', name: 'Corte Infantil Especial', duration_minutes: 30, price: 35 },
            ]).map((service) => (
              <div
                key={service.id}
                className="p-5 rounded-2xl bg-dark-900/60 border border-white/10 hover:border-brand-500/30 transition-all flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-white">{service.name}</h4>
                    <span className="text-sm font-black text-brand-400">
                      R$ {Number(service.price || 0).toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    ⏱️ Duração estimada: {service.duration_minutes} minutos
                  </p>
                </div>

                <a
                  href={`https://wa.me/${botPhone}?text=${encodeURIComponent(`Olá! Gostaria de agendar o serviço *${service.name}*.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2 px-3 rounded-xl bg-white/5 hover:bg-brand-500 hover:text-dark-950 text-slate-300 text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Agendar Este Serviço</span>
                </a>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-white/10 bg-dark-900/80 px-4 sm:px-8 py-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-brand-500 flex items-center justify-center text-dark-950 font-black">
              <Scissors className="w-3.5 h-3.5" />
            </div>
            <span>© {new Date().getFullYear()} Talvane Barber Shop. Todos os direitos reservados.</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => onNavigate('/barbeiro')}
              className="text-slate-400 hover:text-brand-300 transition-all flex items-center gap-1 font-semibold"
            >
              <span>Painel do Barbeiro</span>
              <ExternalLink className="w-3 h-3" />
            </button>
            <span className="text-white/20">•</span>
            <button
              type="button"
              onClick={() => onNavigate('/admin')}
              className="text-slate-400 hover:text-white transition-all flex items-center gap-1 font-semibold"
            >
              <span>Painel Administrativo</span>
              <ShieldCheck className="w-3 h-3" />
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
