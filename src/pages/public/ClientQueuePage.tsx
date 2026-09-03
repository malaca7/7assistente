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
  Zap, 
  Ticket, 
  Star, 
  Compass, 
  Share2, 
  Check, 
  Wifi, 
  ChevronDown,
  Info
} from 'lucide-react';
import { StorageService } from '../../lib/storage';
import { Appointment, AgendaSettings } from '../../types';

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
  const [activeTab, setActiveTab] = useState<'fila' | 'horarios' | 'servicos' | 'ticket'>('fila');

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
    const interval = setInterval(loadData, 10000);
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
      month: 'short',
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

  // Generate All Day Timeline Slots
  const dayTimeline = useMemo(() => {
    const baseDuration = agendaSettings?.slot_duration_minutes || 30;
    const startH = parseInt((agendaSettings?.start_time || '08:00').split(':')[0], 10);
    const startM = parseInt((agendaSettings?.start_time || '08:00').split(':')[1] || '0', 10);
    const endH = parseInt((agendaSettings?.end_time || '19:00').split(':')[0], 10);
    const endM = parseInt((agendaSettings?.end_time || '19:00').split(':')[1] || '0', 10);
    const breakStartM = 12 * 60;
    const breakEndM = 13 * 60;

    let current = startH * 60 + startM;
    const endTotal = endH * 60 + endM;
    const slots: Array<{
      time: string;
      endTime: string;
      isBreak: boolean;
      appointment?: Appointment;
      isOccupied: boolean;
    }> = [];

    const processedTimes = new Set<string>();

    while (current + baseDuration <= endTotal) {
      const isLunch = current >= breakStartM && current < breakEndM;
      const sh = Math.floor(current / 60);
      const sm = current % 60;
      const timeStr = `${String(sh).padStart(2, '0')}:${String(sm).padStart(2, '0')}`;

      if (processedTimes.has(timeStr)) {
        current += baseDuration;
        continue;
      }

      if (isLunch) {
        slots.push({
          time: timeStr,
          endTime: '13:00',
          isBreak: true,
          isOccupied: true,
        });
        current = breakEndM;
        continue;
      }

      // Check if starting an appointment
      const aptStarting = todayAppointments.find(
        (a) => a.appointment_time === timeStr && a.status !== 'cancelled' && a.status !== 'no_show'
      );

      if (aptStarting) {
        const dur = Number(aptStarting.duration_minutes) || baseDuration;
        const endTotalM = current + dur;
        const eh = Math.floor(endTotalM / 60);
        const em = endTotalM % 60;
        const endTimeStr = aptStarting.end_time || `${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}`;

        // Mark absorbed base slots
        for (let t = current; t < endTotalM; t += baseDuration) {
          const th = Math.floor(t / 60);
          const tm = t % 60;
          processedTimes.add(`${String(th).padStart(2, '0')}:${String(tm).padStart(2, '0')}`);
        }

        slots.push({
          time: timeStr,
          endTime: endTimeStr,
          isBreak: false,
          appointment: aptStarting,
          isOccupied: true,
        });
      } else {
        // Check if inside an ongoing appointment
        const ongoing = todayAppointments.find((a) => {
          if (a.status === 'cancelled' || a.status === 'no_show') return false;
          const [ah, am] = a.appointment_time.split(':').map(Number);
          const aStartM = ah * 60 + am;
          const aDur = Number(a.duration_minutes) || baseDuration;
          return current >= aStartM && current < aStartM + aDur;
        });

        if (ongoing) {
          processedTimes.add(timeStr);
          current += baseDuration;
          continue;
        }

        const eh = Math.floor((current + baseDuration) / 60);
        const em = (current + baseDuration) % 60;
        const endTimeStr = `${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}`;

        slots.push({
          time: timeStr,
          endTime: endTimeStr,
          isBreak: false,
          isOccupied: false,
        });
        processedTimes.add(timeStr);
      }

      current += baseDuration;
    }

    return slots;
  }, [agendaSettings, todayAppointments]);

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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-brand-500 selection:text-dark-950 relative overflow-x-hidden">
      {/* Dynamic Ambient Background Aura */}
      <div className="fixed -top-32 left-1/2 -translate-x-1/2 w-full max-w-lg h-96 bg-gradient-to-b from-brand-500/20 via-primary-600/10 to-transparent blur-3xl pointer-events-none rounded-full" />
      <div className="fixed bottom-0 right-0 w-80 h-80 bg-emerald-500/10 blur-3xl pointer-events-none rounded-full" />

      {/* MOBILE APP CONTAINER SHELL */}
      <div className="w-full max-w-md mx-auto flex-1 flex flex-col min-h-screen relative pb-28 sm:border-x border-white/5 sm:shadow-2xl sm:shadow-black">
        
        {/* NATIVE STATUS BAR */}
        <div className="px-5 pt-3 pb-1 flex items-center justify-between text-[11px] text-slate-400 font-mono select-none">
          <div className="flex items-center gap-1.5 text-white font-bold tracking-tight">
            <span>{currentTime.slice(0, 5) || '09:41'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Sincronizado
            </span>
            <Wifi className="w-3.5 h-3.5 text-slate-400" />
          </div>
        </div>

        {/* NATIVE APP HEADER */}
        <header className="px-5 py-3 flex items-center justify-between sticky top-0 z-30 bg-slate-950/85 backdrop-blur-xl border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-brand-500 via-brand-400 to-amber-300 p-0.5 shadow-lg shadow-brand-500/25">
                <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                  <Scissors className="w-5 h-5 text-brand-400" />
                </div>
              </div>
              <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-950 flex items-center justify-center text-[9px] font-bold text-white shadow-sm">
                ✓
              </span>
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-base font-black tracking-tight text-white">
                  Talvane Barber
                </h1>
                <span className="px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider bg-brand-500 text-slate-950 rounded-md">
                  VIP
                </span>
              </div>
              <p className="text-[11px] text-slate-400 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-brand-400" />
                Fila & Agenda em Tempo Real
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleManualRefresh}
              title="Atualizar ao vivo"
              className={`p-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white transition-all active:scale-95 ${
                isRefreshing ? 'animate-spin text-brand-400' : ''
              }`}
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* NATIVE TOP APP PILLS SELECTOR */}
        <div className="px-5 pt-3 pb-1 flex items-center gap-2 overflow-x-auto no-scrollbar select-none">
          <button
            type="button"
            onClick={() => setActiveTab('fila')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap active:scale-95 ${
              activeTab === 'fila'
                ? 'bg-gradient-to-r from-brand-500 to-amber-400 text-slate-950 shadow-lg shadow-brand-500/25 font-black'
                : 'bg-white/5 text-slate-400 hover:text-white border border-white/5'
            }`}
          >
            <Flame className={`w-3.5 h-3.5 ${activeTab === 'fila' ? 'text-slate-950' : 'text-amber-400'}`} />
            <span>Fila ao Vivo</span>
            {upcomingQueue.length > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${activeTab === 'fila' ? 'bg-slate-950 text-brand-300' : 'bg-brand-500/20 text-brand-400'}`}>
                {upcomingQueue.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('horarios')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap active:scale-95 ${
              activeTab === 'horarios'
                ? 'bg-gradient-to-r from-brand-500 to-amber-400 text-slate-950 shadow-lg shadow-brand-500/25 font-black'
                : 'bg-white/5 text-slate-400 hover:text-white border border-white/5'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Horários</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('servicos')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap active:scale-95 ${
              activeTab === 'servicos'
                ? 'bg-gradient-to-r from-brand-500 to-amber-400 text-slate-950 shadow-lg shadow-brand-500/25 font-black'
                : 'bg-white/5 text-slate-400 hover:text-white border border-white/5'
            }`}
          >
            <Scissors className="w-3.5 h-3.5" />
            <span>Serviços</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ticket')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap active:scale-95 ${
              activeTab === 'ticket'
                ? 'bg-gradient-to-r from-brand-500 to-amber-400 text-slate-950 shadow-lg shadow-brand-500/25 font-black'
                : 'bg-white/5 text-slate-400 hover:text-white border border-white/5'
            }`}
          >
            <Ticket className="w-3.5 h-3.5" />
            <span>Meu Ticket</span>
          </button>
        </div>

        {/* MAIN BODY BASED ON TAB */}
        <main className="px-5 pt-3 space-y-4 flex-1">

          {/* ======================================================== */}
          {/* TAB 1: FILA AO VIVO                                      */}
          {/* ======================================================== */}
          {activeTab === 'fila' && (
            <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
              
              {/* HERO CARD: NA CADEIRA AGORA */}
              <div className="relative rounded-3xl p-0.5 bg-gradient-to-br from-brand-400 via-amber-500 to-primary-600 shadow-xl shadow-brand-500/20 overflow-hidden">
                {/* Moving Shimmer Bar */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_3s_infinite]" />
                
                <div className="rounded-[23px] bg-slate-950/95 p-4 sm:p-5 space-y-3.5 relative backdrop-blur-xl">
                  {/* Subtle Barber Pole Stripe Line */}
                  <div className="h-1 w-full rounded-full barber-ribbon opacity-80" />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="flex h-2.5 w-2.5 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                      </span>
                      <span className="text-[11px] font-black uppercase tracking-wider text-emerald-400">
                        Na Cadeira Agora
                      </span>
                    </div>

                    <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30">
                      Cadeira 01 • Talvane
                    </span>
                  </div>

                  {currentInChair ? (
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <h2 className="text-xl font-black text-white tracking-tight">
                            {maskName(currentInChair.contact_name)}
                          </h2>
                          <p className="text-xs text-brand-300 font-semibold flex items-center gap-1.5">
                            <Scissors className="w-3.5 h-3.5" />
                            <span>{currentInChair.service_name}</span>
                          </p>
                          <p className="text-[11px] text-slate-400 font-mono">
                            {maskPhone(currentInChair.contact_phone)}
                          </p>
                        </div>

                        <div className="p-3 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-center min-w-[80px]">
                          <span className="text-xs font-black font-mono text-brand-400 block">
                            {currentInChair.appointment_time}
                          </span>
                          {currentInChair.end_time && (
                            <span className="text-[10px] text-slate-400 font-mono block">
                              até {currentInChair.end_time}
                            </span>
                          )}
                          <span className="text-[9px] font-bold uppercase text-emerald-400 tracking-wider block mt-0.5">
                            Em Corte
                          </span>
                        </div>
                      </div>

                      {/* Service Progress Indicator */}
                      <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span>Duração prevista do serviço</span>
                          <span className="font-bold text-white font-mono">
                            {currentInChair.duration_minutes || 30} min
                          </span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-brand-500 to-emerald-400 rounded-full w-2/3 animate-pulse" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="py-4 text-center space-y-2">
                      <div className="w-12 h-12 mx-auto rounded-2xl bg-white/5 flex items-center justify-center text-slate-400 border border-white/10">
                        <Scissors className="w-6 h-6 text-brand-400" />
                      </div>
                      <p className="text-sm font-bold text-white">Cadeira Pronta & Disponível</p>
                      <p className="text-xs text-slate-400 max-w-xs mx-auto">
                        O próximo da fila pode entrar ou agende seu horário agora mesmo!
                      </p>
                      <a
                        href={whatsappBookingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20"
                      >
                        <MessageSquare className="w-3.5 h-3.5 fill-current" />
                        <span>Agendar Agora no WhatsApp</span>
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* STATS STRIP */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-3 rounded-2xl bg-slate-900/80 border border-white/5 space-y-0.5">
                  <span className="text-[10px] text-slate-400 font-semibold block">Na Espera</span>
                  <span className="text-xl font-black text-brand-400">{upcomingQueue.length}</span>
                  <span className="text-[9px] text-slate-500 block">clientes</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-900/80 border border-white/5 space-y-0.5">
                  <span className="text-[10px] text-slate-400 font-semibold block">Concluídos</span>
                  <span className="text-xl font-black text-emerald-400">{completedToday.length}</span>
                  <span className="text-[9px] text-slate-500 block">hoje</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-900/80 border border-white/5 space-y-0.5">
                  <span className="text-[10px] text-slate-400 font-semibold block">Espera Média</span>
                  <span className="text-xl font-black text-blue-400 font-mono">
                    ~{Math.min(upcomingQueue.length * 25, 90)}m
                  </span>
                  <span className="text-[9px] text-slate-500 block">estimado</span>
                </div>
              </div>

              {/* UPCOMING QUEUE (LISTA NATIVA) */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-brand-400" />
                    <span>Fila de Espera de Hoje</span>
                  </h3>
                  <span className="text-xs text-slate-400 font-mono">
                    {todayAppointments.length} no total
                  </span>
                </div>

                {upcomingQueue.length > 0 ? (
                  <div className="space-y-2">
                    {upcomingQueue.map((apt, idx) => {
                      const isNext = idx === 0;
                      const [sh, sm] = (apt.appointment_time || '09:00').split(':').map(Number);
                      const dur = Number(apt.duration_minutes) || 30;
                      const endMin = (sh || 0) * 60 + (sm || 0) + dur;
                      const endH = Math.floor(endMin / 60);
                      const endM = endMin % 60;
                      const endTime = apt.end_time || `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
                      const timeDisplay = dur > 30 ? `${apt.appointment_time} às ${endTime}` : apt.appointment_time;

                      return (
                        <div
                          key={apt.id}
                          className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                            isNext
                              ? 'bg-gradient-to-r from-brand-950/40 via-slate-900 to-brand-950/30 border-brand-500/40 shadow-md shadow-brand-500/10 ring-1 ring-brand-500/20'
                              : 'bg-slate-900/70 border-white/5 hover:border-white/10'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs ${
                                isNext
                                  ? 'bg-brand-500 text-slate-950 shadow-md shadow-brand-500/30'
                                  : 'bg-white/5 border border-white/10 text-slate-300'
                              }`}
                            >
                              #{idx + 1}
                            </div>

                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1.5">
                                <h4 className="text-sm font-bold text-white">
                                  {maskName(apt.contact_name)}
                                </h4>
                                {isNext && (
                                  <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-brand-500 text-slate-950">
                                    Próximo
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-400">
                                {apt.service_name}
                              </p>
                            </div>
                          </div>

                          <div className="text-right space-y-0.5">
                            <span className="text-xs font-mono font-black text-brand-300 block">
                              {timeDisplay}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono block">
                              {maskPhone(apt.contact_phone)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-6 rounded-2xl bg-slate-900/50 border border-white/5 text-center space-y-2">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                    <p className="text-sm font-bold text-white">Fila livre no momento</p>
                    <p className="text-xs text-slate-400">
                      Não há outros clientes esperando. Agende agora e seja atendido de imediato!
                    </p>
                  </div>
                )}
              </div>

              {/* INSTANT CTA BANNER */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/60 to-slate-900 border border-emerald-500/30 flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-emerald-300 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    Agende pelo WhatsApp
                  </span>
                  <p className="text-[11px] text-slate-400">
                    Escolha seu serviço e receba confirmação automática
                  </p>
                </div>
                <a
                  href={whatsappBookingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 whitespace-nowrap active:scale-95 transition-transform"
                >
                  Agendar
                </a>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: GRADE DE HORÁRIOS DO DIA                          */}
          {/* ======================================================== */}
          {activeTab === 'horarios' && (
            <div className="space-y-3.5 animate-in fade-in zoom-in-95 duration-200">
              <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-white/5 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-brand-400" />
                    <span>Grade de Horários ({todayDisplay})</span>
                  </h3>
                  <p className="text-[11px] text-slate-400">Consulte vagas livres e horários ocupados</p>
                </div>
                <span className="text-xs font-bold text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  {dayTimeline.filter(s => !s.isOccupied).length} livres
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {dayTimeline.map((slot, i) => {
                  const isFree = !slot.isOccupied && !slot.isBreak;
                  const isCurrent = slot.appointment?.status === 'in_progress';
                  const bookingSlotUrl = `https://wa.me/${botPhone}?text=${encodeURIComponent(`Olá! Gostaria de reservar o horário das ${slot.time} hoje na Talvane Barber.`)}`;

                  return (
                    <div
                      key={i}
                      className={`p-3 rounded-2xl border transition-all flex flex-col justify-between min-h-[85px] ${
                        slot.isBreak
                          ? 'bg-slate-900/30 border-white/5 opacity-60'
                          : isCurrent
                          ? 'bg-brand-950/40 border-brand-500/50 shadow-md shadow-brand-500/10'
                          : isFree
                          ? 'bg-emerald-950/20 border-emerald-500/20 hover:border-emerald-500/40'
                          : 'bg-slate-900/70 border-white/5 opacity-75'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-mono font-black ${isFree ? 'text-emerald-400' : 'text-slate-300'}`}>
                          {slot.time}
                        </span>
                        <span
                          className={`px-1.5 py-0.2 rounded-md text-[9px] font-bold uppercase tracking-wider ${
                            slot.isBreak
                              ? 'bg-slate-800 text-slate-400'
                              : isCurrent
                              ? 'bg-brand-500 text-slate-950'
                              : isFree
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-red-500/20 text-red-300 border border-red-500/30'
                          }`}
                        >
                          {slot.isBreak ? 'Intervalo' : isCurrent ? 'Na Cadeira' : isFree ? 'Livre' : 'Ocupado'}
                        </span>
                      </div>

                      {isFree ? (
                        <a
                          href={bookingSlotUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full py-1.5 text-center text-[10px] font-bold rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 transition-colors mt-2"
                        >
                          Reservar vaga →
                        </a>
                      ) : (
                        <div className="mt-2 text-[10px] text-slate-400 truncate">
                          {slot.appointment ? maskName(slot.appointment.contact_name) : 'Horário reservado'}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 3: CATÁLOGO DE SERVIÇOS                              */}
          {/* ======================================================== */}
          {activeTab === 'servicos' && (
            <div className="space-y-3.5 animate-in fade-in zoom-in-95 duration-200">
              <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-white/5">
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Scissors className="w-4 h-4 text-brand-400" />
                  <span>Catálogo de Cortes & Tratamentos</span>
                </h3>
                <p className="text-[11px] text-slate-400">Serviços executados pelo profissional Talvane</p>
              </div>

              <div className="space-y-2.5">
                {(agendaSettings?.services || [
                  { id: '1', name: 'Corte Tradicional', duration_minutes: 30, price: 35, description: 'Corte clássico ou moderno com tesoura e máquina.' },
                  { id: '2', name: 'Barba Terapia Completa', duration_minutes: 25, price: 25, description: 'Toalha quente, hidratação e alinhamento do desenho.' },
                  { id: '3', name: 'Combo Cabelo + Barba', duration_minutes: 55, price: 55, description: 'Experiência completa com cabelo e barba alinhados.' },
                  { id: '4', name: 'Sobrancelha Navalhada', duration_minutes: 15, price: 15, description: 'Design e limpeza simétrica da sobrancelha.' },
                ]).map((service) => {
                  const bookSrvUrl = `https://wa.me/${botPhone}?text=${encodeURIComponent(`Olá! Gostaria de agendar o serviço "${service.name}" na Talvane Barber.`)}`;

                  return (
                    <div
                      key={service.id}
                      className="p-4 rounded-2xl bg-slate-900/70 border border-white/5 hover:border-brand-500/30 transition-all flex items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white">{service.name}</h4>
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-white/5 text-slate-400 font-mono">
                            {service.duration_minutes || 30}m
                          </span>
                        </div>
                        {service.description && (
                          <p className="text-[11px] text-slate-400 line-clamp-2">
                            {service.description}
                          </p>
                        )}
                        <span className="text-xs font-black text-amber-400 block pt-0.5">
                          R$ {Number(service.price || 35).toFixed(2).replace('.', ',')}
                        </span>
                      </div>

                      <a
                        href={bookSrvUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-brand-500 to-amber-400 hover:from-brand-400 hover:to-amber-300 text-slate-950 font-black text-xs shadow-md shadow-brand-500/20 whitespace-nowrap active:scale-95 transition-transform"
                      >
                        Agendar
                      </a>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 4: MEU TICKET / CONSULTAR AGENDAMENTO                 */}
          {/* ======================================================== */}
          {activeTab === 'ticket' && (
            <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/5 space-y-3">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <Search className="w-4 h-4 text-brand-400" />
                    <span>Localizar Meu Horário</span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Digite seu telefone com DDD ou seu nome para visualizar seu ticket digital
                  </p>
                </div>

                <form onSubmit={handleSearch} className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Ex: 81 99613-8924 ou Nome"
                      className="w-full pl-9 pr-3 py-2 bg-slate-950 rounded-xl border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-brand-500"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-brand-500 hover:bg-brand-400 text-slate-950 font-black text-xs rounded-xl shadow-md active:scale-95 transition-transform"
                  >
                    Buscar
                  </button>
                </form>
              </div>

              {/* TICKET DIGITAL STYLE (APPLE WALLET / VIP PASS) */}
              {searchResult && searchResult !== 'not_found' && (
                <div className="relative rounded-3xl p-0.5 bg-gradient-to-b from-brand-400 to-amber-500 shadow-2xl animate-in zoom-in-95">
                  <div className="rounded-[23px] bg-slate-950 p-5 space-y-4 relative overflow-hidden">
                    
                    {/* Ticket Header */}
                    <div className="flex items-center justify-between pb-3 border-b border-white/10">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-brand-500 flex items-center justify-center text-slate-950 font-black">
                          <Scissors className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-xs font-black text-white block">Talvane Barber Pass</span>
                          <span className="text-[10px] text-emerald-400 font-bold">Agendamento Ativo</span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase">
                        Confirmado
                      </span>
                    </div>

                    {/* Ticket Details */}
                    <div className="space-y-2.5">
                      <div className="flex justify-between">
                        <span className="text-xs text-slate-400">Cliente</span>
                        <span className="text-xs font-bold text-white">{searchResult.contact_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-slate-400">Serviço</span>
                        <span className="text-xs font-bold text-brand-300">{searchResult.service_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-slate-400">Data & Horário</span>
                        <span className="text-xs font-mono font-black text-white">
                          {searchResult.appointment_date} às {searchResult.appointment_time}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-slate-400">Barbeiro</span>
                        <span className="text-xs font-bold text-white">Talvane</span>
                      </div>
                    </div>

                    {/* Perforated Divider */}
                    <div className="relative py-2">
                      <div className="border-b-2 border-dashed border-white/10" />
                      <div className="absolute -left-7 top-1 w-4 h-4 rounded-full bg-slate-950" />
                      <div className="absolute -right-7 top-1 w-4 h-4 rounded-full bg-slate-950" />
                    </div>

                    {/* Barcode Mockup */}
                    <div className="text-center space-y-1 pt-1">
                      <div className="h-9 w-44 mx-auto bg-gradient-to-r from-white via-slate-400 to-white opacity-40 rounded flex items-center justify-center font-mono text-[9px] text-slate-950 tracking-widest">
                        ||| | |||| | || |||
                      </div>
                      <span className="text-[9px] font-mono text-slate-500">ID: {searchResult.id}</span>
                    </div>

                    <a
                      href={`https://wa.me/${botPhone}?text=${encodeURIComponent(`Olá, sou ${searchResult.contact_name} e estou confirmando meu horário de ${searchResult.appointment_date} às ${searchResult.appointment_time}.`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Falar no WhatsApp sobre este horário</span>
                    </a>
                  </div>
                </div>
              )}

              {searchResult === 'not_found' && (
                <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/30 text-center space-y-2 animate-in zoom-in-95">
                  <AlertCircle className="w-6 h-6 text-amber-400 mx-auto" />
                  <p className="text-xs font-bold text-white">Nenhum agendamento ativo encontrado</p>
                  <p className="text-[11px] text-slate-400">
                    Verifique se digitou o número com DDD corretamente ou agende agora seu horário:
                  </p>
                  <a
                    href={whatsappBookingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-500 text-slate-950 text-xs font-bold"
                  >
                    Agendar pelo WhatsApp
                  </a>
                </div>
              )}
            </div>
          )}

        </main>

        {/* NATIVE BOTTOM APP DOCK (FIXED BAR) */}
        <nav className="fixed bottom-3 left-1/2 -translate-x-1/2 w-[calc(100%-1.5rem)] max-w-md bg-slate-900/90 backdrop-blur-2xl border border-white/10 rounded-3xl p-1.5 shadow-2xl shadow-black z-40 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setActiveTab('fila')}
            className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all ${
              activeTab === 'fila' ? 'text-brand-400 bg-white/5 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Flame className="w-4 h-4" />
            <span className="text-[10px] mt-0.5">Fila</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('horarios')}
            className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all ${
              activeTab === 'horarios' ? 'text-brand-400 bg-white/5 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span className="text-[10px] mt-0.5">Horários</span>
          </button>

          {/* Center WhatsApp Booking Action Pill */}
          <a
            href={whatsappBookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Agendar pelo WhatsApp"
            className="flex flex-col items-center justify-center p-2 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 font-black shadow-lg shadow-emerald-500/30 -translate-y-2 hover:-translate-y-3 active:scale-95 transition-all"
          >
            <MessageSquare className="w-5 h-5 fill-current" />
            <span className="text-[9px] font-black uppercase tracking-tight">Agendar</span>
          </a>

          <button
            type="button"
            onClick={() => setActiveTab('servicos')}
            className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all ${
              activeTab === 'servicos' ? 'text-brand-400 bg-white/5 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Scissors className="w-4 h-4" />
            <span className="text-[10px] mt-0.5">Serviços</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ticket')}
            className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all ${
              activeTab === 'ticket' ? 'text-brand-400 bg-white/5 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Ticket className="w-4 h-4" />
            <span className="text-[10px] mt-0.5">Ticket</span>
          </button>
        </nav>

        {/* DISCREET FOOTER ACCESS LINKS */}
        <footer className="px-5 py-4 mt-auto text-center space-y-1.5 text-[11px] text-slate-500 border-t border-white/5">
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate('/barbeiro')}
              className="hover:text-brand-400 transition-colors"
            >
              Portal do Barbeiro
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => onNavigate('/admin')}
              className="hover:text-white transition-colors"
            >
              Painel Admin
            </button>
          </div>
          <p className="text-[10px]">Talvane Barber Shop • Atendimento com Hora Marcada</p>
        </footer>

      </div>
    </div>
  );
};
