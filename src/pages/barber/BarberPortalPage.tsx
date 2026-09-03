import React, { useState, useEffect, useMemo } from 'react';
import { 
  Scissors, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  UserX, 
  Plus, 
  Phone, 
  MessageSquare, 
  DollarSign, 
  User, 
  RefreshCw, 
  ChevronRight, 
  ChevronLeft,
  Flame,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Check,
  TrendingUp,
  Tag,
  LogOut
} from 'lucide-react';
import { StorageService } from '../../lib/storage';
import { Appointment, AgendaSettings, SystemUser } from '../../types';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../contexts/ToastContext';
import { BarberLoginPage } from './BarberLoginPage';

interface BarberPortalPageProps {
  onNavigate: (path: string) => void;
}

export const BarberPortalPage: React.FC<BarberPortalPageProps> = ({ onNavigate }) => {
  const { success, error: toastError, info } = useToast();
  
  // Barber Authentication State
  const [loggedBarber, setLoggedBarber] = useState<SystemUser | null>(() => {
    const session = StorageService.getBarberSession();
    return session.authenticated && session.user ? session.user : null;
  });

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [agendaSettings, setAgendaSettings] = useState<AgendaSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });

  // Modal Novo Encaixe
  const [isWalkInModalOpen, setIsWalkInModalOpen] = useState(false);
  const [walkInName, setWalkInName] = useState('');
  const [walkInPhone, setWalkInPhone] = useState('');
  const [selectedWalkInServiceIds, setSelectedWalkInServiceIds] = useState<string[]>(['srv-1']);
  const [walkInTime, setWalkInTime] = useState('14:00');
  const [isSavingWalkIn, setIsSavingWalkIn] = useState(false);

  const walkInServicesList = useMemo(() => {
    const services = agendaSettings?.services || [
      { id: 'srv-1', name: 'Corte Tradicional', duration_minutes: 30, price: 35 },
      { id: 'srv-2', name: 'Barba Completa (Toalha Quente)', duration_minutes: 25, price: 25 },
      { id: 'srv-3', name: 'Combo Corte + Barba', duration_minutes: 55, price: 55 },
      { id: 'srv-4', name: 'Sobrancelha', duration_minutes: 15, price: 15 },
    ];
    const list = services.filter((s) => selectedWalkInServiceIds.includes(s.id));
    return list.length > 0 ? list : [services[0]];
  }, [agendaSettings, selectedWalkInServiceIds]);

  const walkInTotalDuration = useMemo(() => {
    return walkInServicesList.reduce((acc, s) => acc + (Number(s.duration_minutes) || 30), 0);
  }, [walkInServicesList]);

  const walkInTotalPrice = useMemo(() => {
    return walkInServicesList.reduce((acc, s) => acc + (Number(s.price) || 0), 0);
  }, [walkInServicesList]);

  const walkInCombinedName = useMemo(() => {
    return walkInServicesList.map((s) => s.name).join(' + ');
  }, [walkInServicesList]);

  const handleToggleWalkInService = (srvId: string) => {
    setSelectedWalkInServiceIds((prev) => {
      const exists = prev.includes(srvId);
      if (exists) {
        if (prev.length === 1) return prev;
        return prev.filter((id) => id !== srvId);
      } else {
        return [...prev, srvId];
      }
    });
  };

  const loadData = async () => {
    try {
      const [aptsData, settingsData] = await Promise.all([
        StorageService.getAppointments(),
        StorageService.getAgendaSettings(),
      ]);
      setAppointments(aptsData || []);
      setAgendaSettings(settingsData);
    } catch (err) {
      console.error('Erro ao carregar agenda do barbeiro:', err);
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

  // Quick date change helpers
  const todayStr = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  const tomorrowStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  // Filter appointments for the selected date
  const filteredAppointments = useMemo(() => {
    return appointments
      .filter((a) => a.appointment_date === selectedDate)
      .sort((a, b) => a.appointment_time.localeCompare(b.appointment_time));
  }, [appointments, selectedDate]);

  // Daily statistics
  const stats = useMemo(() => {
    const total = filteredAppointments.length;
    const completed = filteredAppointments.filter((a) => a.status === 'completed').length;
    const inProgress = filteredAppointments.filter((a) => a.status === 'in_progress').length;
    const pending = filteredAppointments.filter((a) => a.status === 'confirmed' || a.status === 'pending').length;
    const noShow = filteredAppointments.filter((a) => a.status === 'no_show').length;
    const cancelled = filteredAppointments.filter((a) => a.status === 'cancelled').length;

    const estimatedRevenue = filteredAppointments
      .filter((a) => a.status === 'completed' || a.status === 'in_progress' || a.status === 'confirmed')
      .reduce((sum, a) => sum + (Number(a.price) || 35), 0);

    const actualRevenue = filteredAppointments
      .filter((a) => a.status === 'completed')
      .reduce((sum, a) => sum + (Number(a.price) || 35), 0);

    return { total, completed, inProgress, pending, noShow, cancelled, estimatedRevenue, actualRevenue };
  }, [filteredAppointments]);

  // Update appointment status in 1 click
  const handleUpdateStatus = async (aptId: string, newStatus: Appointment['status']) => {
    try {
      await StorageService.updateAppointmentStatus(aptId, newStatus);
      setAppointments((prev) =>
        prev.map((a) => (a.id === aptId ? { ...a, status: newStatus, updated_at: new Date().toISOString() } : a))
      );

      const statusMessages: Record<string, string> = {
        in_progress: '✂️ Cliente colocado na cadeira (Em Atendimento)!',
        completed: '✅ Serviço marcado como Concluído / Realizado!',
        no_show: '❌ Marcado como Não Compareceu / Ausente.',
        cancelled: '🚫 Agendamento cancelado.',
        confirmed: '⏳ Agendamento marcado como Confirmado.',
      };

      success('Status Atualizado', statusMessages[newStatus] || 'Status atualizado com sucesso.');
    } catch (err) {
      toastError('Erro', 'Não foi possível atualizar o status do agendamento.');
    }
  };

  // Save new walk-in appointment
  const handleCreateWalkIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walkInName.trim()) {
      toastError('Aviso', 'Informe o nome do cliente.');
      return;
    }

    const duration = walkInTotalDuration || 30;
    const price = walkInTotalPrice || 35;
    const srvName = walkInCombinedName || 'Atendimento Geral';

    // Calculate end time
    const [sh, sm] = walkInTime.split(':').map(Number);
    const endMin = (sh || 0) * 60 + (sm || 0) + duration;
    const endH = Math.floor(endMin / 60);
    const endM = endMin % 60;
    const endTimeStr = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
    const baseSlot = agendaSettings?.slot_duration_minutes || 30;
    const slotsCount = Math.max(1, Math.ceil(duration / baseSlot));

    // Check if slot is already taken (with full duration overlap)
    const conflict = appointments.find((a) => {
      if (a.appointment_date !== selectedDate) return false;
      if (a.status === 'cancelled' || a.status === 'no_show') return false;
      const [ah, am] = a.appointment_time.split(':').map(Number);
      const aStart = (ah || 0) * 60 + (am || 0);
      const aDur = Number(a.duration_minutes) || 30;
      const aEnd = aStart + aDur;
      return ((sh || 0) * 60 + (sm || 0)) < aEnd && endMin > aStart;
    });

    if (conflict) {
      const nextSlot = await StorageService.getNextAvailableSlot(selectedDate, walkInTime, duration);
      if (nextSlot) {
        toastError(
          'Horário Ocupado',
          `Já existe agendamento às ${walkInTime} (${conflict.contact_name}). Sugerido próximo horário com tempo suficiente (${duration} min): ${nextSlot}.`
        );
        setWalkInTime(nextSlot);
      } else {
        toastError('Agenda Lotada', `Já existe agendamento às ${walkInTime} e não há outros horários com ${duration} min livres hoje.`);
      }
      return;
    }

    setIsSavingWalkIn(true);
    try {
      const cleanPhone = walkInPhone.replace(/\D/g, '') || '5581999999999';
      const newApt: Appointment = {
        id: `walkin-${Date.now()}`,
        contact_name: walkInName.trim(),
        contact_phone: cleanPhone,
        service_name: srvName,
        price,
        duration_minutes: duration,
        end_time: endTimeStr,
        slots_count: slotsCount,
        appointment_date: selectedDate,
        appointment_time: walkInTime,
        status: 'in_progress', // starts in chair immediately
        created_at: new Date().toISOString(),
      };

      await StorageService.saveAppointment(newApt);
      setAppointments((prev) => [newApt, ...prev]);
      setIsWalkInModalOpen(false);
      setWalkInName('');
      setWalkInPhone('');
      success('Encaixe Criado!', `${newApt.contact_name} adicionado à cadeira às ${newApt.appointment_time} (${duration} min - ${slotsCount} slots unidos).`);
    } catch (err) {
      toastError('Erro', 'Falha ao registrar encaixe.');
    } finally {
      setIsSavingWalkIn(false);
    }
  };

  const getStatusBadge = (status: Appointment['status']) => {
    switch (status) {
      case 'in_progress':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-brand-500 text-dark-950 flex items-center gap-1 shadow-glow-brand animate-pulse">
            <Scissors className="w-3.5 h-3.5" />
            Na Cadeira
          </span>
        );
      case 'completed':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Realizado
          </span>
        );
      case 'no_show':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-500/20 text-red-300 border border-red-500/30 flex items-center gap-1">
            <UserX className="w-3.5 h-3.5" />
            Não Compareceu
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-500/20 text-slate-400 border border-slate-500/30 flex items-center gap-1">
            <XCircle className="w-3.5 h-3.5" />
            Cancelado
          </span>
        );
      case 'confirmed':
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            Aguardando
          </span>
        );
    }
  };

  // If not logged in as a barber, show the Barber Login screen
  if (!loggedBarber) {
    return (
      <BarberLoginPage
        onSuccess={(user) => setLoggedBarber(user)}
        onNavigate={onNavigate}
      />
    );
  }

  const handleLogout = () => {
    StorageService.clearBarberSession();
    setLoggedBarber(null);
  };

  return (
    <div className="min-h-screen bg-dark-950 text-slate-100 flex flex-col relative pb-20">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-dark-900/90 backdrop-blur-xl border-b border-white/10 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-dark-950 font-black shadow-lg shadow-brand-500/20">
            <Scissors className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              Painel do Barbeiro
              <span className="px-2 py-0.5 text-[10px] font-bold bg-brand-500/20 text-brand-300 border border-brand-500/30 rounded-full">
                {loggedBarber?.name || 'Barbeiro'}
              </span>
            </h1>
            <p className="text-xs text-slate-400">Controle de cadeira e atendimentos em tempo real</p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={handleManualRefresh}
            title="Atualizar Agenda"
            className={`p-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white transition-all ${
              isRefreshing ? 'animate-spin text-brand-400' : ''
            }`}
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <Button
            variant="brand"
            size="sm"
            onClick={() => setIsWalkInModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
            className="font-bold shadow-glow-brand"
          >
            <span className="hidden sm:inline">Novo</span> Encaixe
          </Button>

          <button
            type="button"
            onClick={() => onNavigate('/')}
            title="Ver Fila Pública"
            className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-brand-300 transition-all"
          >
            <ExternalLink className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleLogout}
            title="Sair / Trocar Barbeiro"
            className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-rose-400 hover:border-rose-500/30 transition-all text-xs font-semibold flex items-center gap-1.5"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-8 py-6 space-y-6">
        {/* DATE SELECTOR BAR */}
        <div className="p-3 bg-dark-900/80 rounded-2xl border border-white/10 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedDate(todayStr)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedDate === todayStr
                  ? 'bg-brand-500 text-dark-950 shadow-md shadow-brand-500/30'
                  : 'bg-white/5 text-slate-400 hover:text-white'
              }`}
            >
              Hoje
            </button>
            <button
              type="button"
              onClick={() => setSelectedDate(tomorrowStr)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedDate === tomorrowStr
                  ? 'bg-brand-500 text-dark-950 shadow-md shadow-brand-500/30'
                  : 'bg-white/5 text-slate-400 hover:text-white'
              }`}
            >
              Amanhã
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-brand-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-1.5 bg-dark-950 rounded-xl border border-white/10 text-xs font-mono font-bold text-white focus:outline-none focus:border-brand-500"
            />
          </div>
        </div>

        {/* QUICK STATS CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 rounded-2xl bg-dark-900/70 border border-white/10 space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Agendados</span>
              <Calendar className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <p className="text-2xl font-black text-white">{stats.total}</p>
            <p className="text-[11px] text-slate-400">{stats.pending} na espera</p>
          </div>

          <div className="p-4 rounded-2xl bg-dark-900/70 border border-white/10 space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Na Cadeira</span>
              <Scissors className="w-3.5 h-3.5 text-brand-400" />
            </div>
            <p className="text-2xl font-black text-brand-400">{stats.inProgress}</p>
            <p className="text-[11px] text-slate-400">Em atendimento</p>
          </div>

          <div className="p-4 rounded-2xl bg-dark-900/70 border border-white/10 space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Realizados</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <p className="text-2xl font-black text-emerald-400">{stats.completed}</p>
            <p className="text-[11px] text-slate-400">Concluídos com sucesso</p>
          </div>

          <div className="p-4 rounded-2xl bg-dark-900/70 border border-white/10 space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Faturamento</span>
              <DollarSign className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <p className="text-2xl font-black text-amber-300">
              R$ {stats.actualRevenue.toFixed(2).replace('.', ',')}
            </p>
            <p className="text-[11px] text-slate-400">
              Previsto: R$ {stats.estimatedRevenue.toFixed(2).replace('.', ',')}
            </p>
          </div>
        </div>

        {/* TIMELINE / APPOINTMENT CARDS */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-brand-400" />
              <span>Atendimentos do Dia ({selectedDate})</span>
            </h2>
            <span className="text-xs text-slate-400">
              {filteredAppointments.length} agendamento(s)
            </span>
          </div>

          {filteredAppointments.length > 0 ? (
            <div className="space-y-3">
              {filteredAppointments.map((apt) => {
                const isCurrent = apt.status === 'in_progress';
                const isDone = apt.status === 'completed';
                const isMissed = apt.status === 'no_show';
                const cleanPhone = (apt.contact_phone || '').replace(/\D/g, '');

                return (
                  <div
                    key={apt.id}
                    className={`p-4 sm:p-5 rounded-2xl transition-all border ${
                      isCurrent
                        ? 'bg-brand-950/40 border-brand-500/60 shadow-xl shadow-brand-500/10'
                        : isDone
                        ? 'bg-emerald-950/20 border-emerald-500/30 opacity-80'
                        : isMissed
                        ? 'bg-red-950/20 border-red-500/30 opacity-70'
                        : 'bg-dark-900/70 border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      {/* Left: Time & Client Info */}
                      <div className="flex items-start gap-3.5">
                        {(() => {
                          const [sh, sm] = (apt.appointment_time || '09:00').split(':').map(Number);
                          const dur = Number(apt.duration_minutes) || 30;
                          const endMin = (sh || 0) * 60 + (sm || 0) + dur;
                          const endH = Math.floor(endMin / 60);
                          const endM = endMin % 60;
                          const endTime = apt.end_time || `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
                          const slotsCount = apt.slots_count || Math.max(1, Math.ceil(dur / 30));

                          return (
                            <div className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-white/5 border border-white/10 text-center min-w-[80px]">
                              <span className="text-xs sm:text-sm font-black font-mono text-brand-300">
                                {apt.appointment_time}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                até {endTime}
                              </span>
                              {slotsCount > 1 ? (
                                <span className="text-[9px] font-bold text-brand-400 mt-0.5">
                                  {dur}m ({slotsCount} slots)
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-500">
                                  {dur}m
                                </span>
                              )}
                            </div>
                          );
                        })()}

                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-base font-bold text-white">
                              {apt.contact_name || 'Cliente'}
                            </h3>
                            {getStatusBadge(apt.status)}
                          </div>
                          <p className="text-xs text-slate-300 flex items-center gap-2">
                            <span className="font-semibold text-brand-300">{apt.service_name}</span>
                            <span>•</span>
                            <span className="text-amber-400 font-bold">
                              R$ {Number(apt.price || 35).toFixed(2).replace('.', ',')}
                            </span>
                          </p>
                          <p className="text-xs text-slate-400 flex items-center gap-1.5">
                            <Phone className="w-3 h-3 text-slate-500" />
                            <span>{apt.contact_phone}</span>
                          </p>
                        </div>
                      </div>

                      {/* Right: 1-Click Action Buttons */}
                      <div className="flex flex-wrap items-center gap-2 sm:justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5">
                        {/* WhatsApp Trigger */}
                        {cleanPhone && (
                          <a
                            href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(`Olá ${apt.contact_name}! Estou aguardando você aqui na Talvane Barber Shop para seu atendimento das ${apt.appointment_time}.`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 transition-all text-xs font-bold flex items-center gap-1"
                            title="Chamar no WhatsApp"
                          >
                            <MessageSquare className="w-4 h-4 fill-current" />
                            <span className="hidden sm:inline">WhatsApp</span>
                          </a>
                        )}

                        {/* Status Change Buttons */}
                        {apt.status !== 'in_progress' && apt.status !== 'completed' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(apt.id, 'in_progress')}
                            className="px-3 py-2 rounded-xl bg-brand-500 hover:bg-brand-400 text-dark-950 font-black text-xs transition-all flex items-center gap-1.5 shadow-md shadow-brand-500/20"
                          >
                            <Scissors className="w-3.5 h-3.5" />
                            <span>Na Cadeira</span>
                          </button>
                        )}

                        {apt.status !== 'completed' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(apt.id, 'completed')}
                            className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Realizado</span>
                          </button>
                        )}

                        {apt.status !== 'no_show' && apt.status !== 'completed' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(apt.id, 'no_show')}
                            className="px-2.5 py-2 rounded-xl bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/30 font-bold text-xs transition-all flex items-center gap-1"
                            title="Marcar como Não Compareceu"
                          >
                            <UserX className="w-3.5 h-3.5" />
                            <span className="hidden md:inline">Faltou</span>
                          </button>
                        )}

                        {apt.status !== 'cancelled' && apt.status !== 'completed' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(apt.id, 'cancelled')}
                            className="px-2.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 font-bold text-xs transition-all"
                            title="Cancelar Agendamento"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {isDone && (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(apt.id, 'confirmed')}
                            className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 text-xs font-semibold"
                          >
                            Reabrir
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 rounded-3xl bg-dark-900/60 border border-white/10 text-center space-y-3">
              <Calendar className="w-8 h-8 text-slate-500 mx-auto" />
              <p className="text-sm font-bold text-white">Nenhum agendamento para esta data.</p>
              <p className="text-xs text-slate-400">
                Adicione um novo cliente que chegou direto no balcão usando o botão abaixo:
              </p>
              <Button
                variant="brand"
                size="sm"
                onClick={() => setIsWalkInModalOpen(true)}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Cadastrar Encaixe
              </Button>
            </div>
          )}
        </div>
      </main>

      {/* MODAL: NOVO ENCAIXE / BALCÃO */}
      <Modal
        isOpen={isWalkInModalOpen}
        onClose={() => setIsWalkInModalOpen(false)}
        title="Novo Encaixe / Atendimento de Balcão"
        size="md"
      >
        <form onSubmit={handleCreateWalkIn} className="space-y-4 pt-2">
          <p className="text-xs text-slate-400">
            Adicione um cliente que chegou diretamente na barbearia para colocá-lo na cadeira ou na fila de hoje ({selectedDate}).
          </p>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">Nome do Cliente *</label>
            <input
              type="text"
              required
              value={walkInName}
              onChange={(e) => setWalkInName(e.target.value)}
              placeholder="Ex: Carlos Oliveira"
              className="w-full px-3.5 py-2.5 rounded-xl bg-dark-950 border border-white/10 text-white text-sm focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">WhatsApp / Telefone</label>
            <input
              type="text"
              value={walkInPhone}
              onChange={(e) => setWalkInPhone(e.target.value)}
              placeholder="Ex: 81 99613-8924"
              className="w-full px-3.5 py-2.5 rounded-xl bg-dark-950 border border-white/10 text-white text-sm focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300">
                Serviços * (Selecione 1 ou mais serviços)
              </label>
              <span className="text-[11px] font-mono text-brand-300 font-bold">
                {walkInServicesList.length} selecionado(s)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-44 overflow-y-auto p-1.5 rounded-xl bg-dark-950 border border-white/10">
              {(agendaSettings?.services || [
                { id: 'srv-1', name: 'Corte Tradicional', duration_minutes: 30, price: 35 },
                { id: 'srv-2', name: 'Barba Completa (Toalha Quente)', duration_minutes: 25, price: 25 },
                { id: 'srv-3', name: 'Combo Corte + Barba', duration_minutes: 55, price: 55 },
                { id: 'srv-4', name: 'Sobrancelha', duration_minutes: 15, price: 15 },
              ]).map((s) => {
                const isSelected = selectedWalkInServiceIds.includes(s.id);
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleToggleWalkInService(s.id)}
                    className={`p-2 rounded-xl border text-left transition-all flex items-start justify-between gap-2 ${
                      isSelected
                        ? 'bg-brand-500/20 border-brand-500/60 text-white shadow-sm ring-1 ring-brand-500/30'
                        : 'bg-dark-900/60 border-white/5 text-slate-400 hover:border-white/15'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold block text-white">{s.name}</span>
                      <span className="text-[10px] text-slate-400 block font-mono">
                        ⏱️ {s.duration_minutes || 30}m • R$ {Number(s.price || 0).toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                    <div className={`w-4 h-4 rounded-md flex items-center justify-center text-[10px] font-bold border transition-colors mt-0.5 ${
                      isSelected ? 'bg-brand-500 text-slate-950 border-brand-400' : 'border-white/20 bg-dark-950'
                    }`}>
                      {isSelected ? '✓' : ''}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Total Duration and Price Summary */}
            <div className="mt-2 p-2.5 rounded-xl bg-dark-950 border border-brand-500/30 flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block">Total do Atendimento:</span>
                <span className="font-semibold text-white line-clamp-1">{walkInCombinedName}</span>
              </div>
              <div className="text-right">
                <span className="text-brand-300 font-mono font-bold block">
                  ⏱️ {walkInTotalDuration} min
                </span>
                <span className="text-emerald-400 font-mono font-bold block">
                  R$ {walkInTotalPrice.toFixed(2).replace('.', ',')}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">Horário</label>
            <input
              type="time"
              value={walkInTime}
              onChange={(e) => setWalkInTime(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-dark-950 border border-white/10 text-white text-sm font-mono focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsWalkInModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="brand"
              size="sm"
              isLoading={isSavingWalkIn}
              className="font-bold shadow-glow-brand"
            >
              Iniciar Atendimento Agora
            </Button>
          </div>
        </form>
      </Modal>

      {/* Bottom Sticky Mobile Bar with Quick Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-dark-900/90 backdrop-blur-xl border-t border-white/10 px-6 py-2.5 flex items-center justify-around text-xs">
        <button
          type="button"
          onClick={() => onNavigate('/')}
          className="flex flex-col items-center gap-1 text-slate-400 hover:text-brand-300"
        >
          <Scissors className="w-4 h-4" />
          <span className="text-[10px]">Fila Pública</span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedDate(todayStr)}
          className="flex flex-col items-center gap-1 text-brand-400 font-bold"
        >
          <Clock className="w-4 h-4" />
          <span className="text-[10px]">Hoje</span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('/admin')}
          className="flex flex-col items-center gap-1 text-slate-400 hover:text-white"
        >
          <ShieldCheck className="w-4 h-4" />
          <span className="text-[10px]">Admin</span>
        </button>
      </nav>
    </div>
  );
};
