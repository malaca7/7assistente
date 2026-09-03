import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Calendar, 
  Clock, 
  Scissors, 
  User, 
  Phone, 
  Sparkles, 
  AlertTriangle, 
  Check, 
  Plus, 
  MessageSquare, 
  DollarSign, 
  AlertCircle, 
  CalendarCheck,
  CheckCircle2,
  ChevronDown
} from 'lucide-react';
import { StorageService } from '../../lib/storage';
import { 
  Appointment, 
  AgendaSettings, 
  AgendaServiceItem, 
  DayScheduleConfig, 
  SlotSuggestion,
  SystemUser
} from '../../types';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useToast } from '../../contexts/ToastContext';

export interface AppointmentBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultClientName?: string;
  defaultClientPhone?: string;
  onSuccess?: (appointment: Appointment, confirmMessage: string) => Promise<void> | void;
}

const weekDaysNames: Record<string, string> = {
  '0': 'Domingo',
  '1': 'Segunda-feira',
  '2': 'Terça-feira',
  '3': 'Quarta-feira',
  '4': 'Quinta-feira',
  '5': 'Sexta-feira',
  '6': 'Sábado',
};

const getDayOfWeekIndex = (dateStr: string): string => {
  if (!dateStr) return '1';
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d, 12, 0, 0);
  return String(dt.getDay());
};

const formatBrDate = (dateStr: string): string => {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
};

export const AppointmentBookingModal: React.FC<AppointmentBookingModalProps> = ({
  isOpen,
  onClose,
  defaultClientName = '',
  defaultClientPhone = '',
  onSuccess,
}) => {
  const { success, error: toastError, info } = useToast();

  const todayStr = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }, []);

  // Form State
  const [clientName, setClientName] = useState(defaultClientName);
  const [clientPhone, setClientPhone] = useState(defaultClientPhone);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [appointmentDate, setAppointmentDate] = useState(todayStr);
  const [appointmentTime, setAppointmentTime] = useState('09:00');
  const [selectedBarberId, setSelectedBarberId] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [sendWhatsAppConfirmation, setSendWhatsAppConfirmation] = useState(true);

  // Settings and External Data
  const [settings, setSettings] = useState<AgendaSettings | null>(null);
  const [barbers, setBarbers] = useState<SystemUser[]>([]);
  const [existingAppointments, setExistingAppointments] = useState<Appointment[]>([]);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Suggestion State when slot is booked
  const [suggestedSlot, setSuggestedSlot] = useState<SlotSuggestion | null>(null);

  // Sync default client info when modal opens
  useEffect(() => {
    if (isOpen) {
      setClientName(defaultClientName);
      setClientPhone(defaultClientPhone);
      setAppointmentDate(todayStr);
      setAppointmentTime('09:00');
      setSuggestedSlot(null);
      setNotes('');
    }
  }, [isOpen, defaultClientName, defaultClientPhone, todayStr]);

  // Load Agenda Settings, Barbers & Existing Appointments
  const loadData = useCallback(async () => {
    try {
      const [agendaConfig, systemUsers, apts] = await Promise.all([
        StorageService.getAgendaSettings(),
        StorageService.getSystemUsers(),
        StorageService.getAppointments(),
      ]);

      setSettings(agendaConfig);
      setExistingAppointments(apts || []);

      const activeBarbers = (systemUsers || []).filter(
        (u) => u.permissions?.can_access_barbeiro && u.status === 'active'
      );
      setBarbers(activeBarbers);

      // Default service selection
      if (agendaConfig?.services && agendaConfig.services.length > 0) {
        setSelectedServiceIds([agendaConfig.services[0].id]);
      }
    } catch (err) {
      console.error('Erro ao carregar dados de agenda:', err);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, loadData]);

  // Selected Services calculations
  const selectedServicesList = useMemo(() => {
    if (!settings?.services) return [];
    const list = settings.services.filter((s) => selectedServiceIds.includes(s.id));
    return list.length > 0 ? list : (settings.services.length > 0 ? [settings.services[0]] : []);
  }, [settings?.services, selectedServiceIds]);

  const totalDuration = useMemo(() => {
    return selectedServicesList.reduce((acc, s) => acc + (Number(s.duration_minutes) || 30), 0) || 30;
  }, [selectedServicesList]);

  const totalPrice = useMemo(() => {
    return selectedServicesList.reduce((acc, s) => acc + (Number(s.price) || 0), 0);
  }, [selectedServicesList]);

  const combinedServiceName = useMemo(() => {
    if (selectedServicesList.length === 0) return 'Atendimento Geral';
    return selectedServicesList.map((s) => s.name).join(' + ');
  }, [selectedServicesList]);

  const handleToggleSelectService = (serviceId: string) => {
    setSelectedServiceIds((prev) => {
      const exists = prev.includes(serviceId);
      if (exists) {
        if (prev.length === 1) return prev; // Keep at least one
        return prev.filter((id) => id !== serviceId);
      } else {
        return [...prev, serviceId];
      }
    });
    setSuggestedSlot(null);
  };

  // Day Schedule validation for selected date
  const dayOfWeekIndex = useMemo(() => getDayOfWeekIndex(appointmentDate), [appointmentDate]);
  const daySchedule = useMemo<DayScheduleConfig>(() => {
    if (settings?.day_schedules && settings.day_schedules[dayOfWeekIndex]) {
      return settings.day_schedules[dayOfWeekIndex];
    }
    const isEnabled = settings?.business_days ? settings.business_days.includes(dayOfWeekIndex) : dayOfWeekIndex !== '0';
    return {
      enabled: isEnabled,
      start_time: settings?.start_time || '08:00',
      end_time: settings?.end_time || (dayOfWeekIndex === '6' ? '18:00' : '19:00'),
      has_break: Boolean(settings?.break_start_time && settings?.break_end_time),
      break_start_time: settings?.break_start_time || '12:00',
      break_end_time: settings?.break_end_time || '13:00',
    };
  }, [settings, dayOfWeekIndex]);

  // Load available slots for the date & duration
  useEffect(() => {
    if (!isOpen || !appointmentDate) return;
    let cancelled = false;

    const fetchSlots = async () => {
      setIsLoadingSlots(true);
      try {
        const slots = await StorageService.getAvailableSlots(appointmentDate, totalDuration);
        if (!cancelled) {
          setAvailableSlots(slots || []);
        }
      } catch (e) {
        if (!cancelled) setAvailableSlots([]);
      } finally {
        if (!cancelled) setIsLoadingSlots(false);
      }
    };

    fetchSlots();
    return () => {
      cancelled = true;
    };
  }, [isOpen, appointmentDate, totalDuration]);

  // Calculate End Time based on start time & duration
  const endTimeStr = useMemo(() => {
    if (!appointmentTime) return '';
    const [h, m] = appointmentTime.split(':').map(Number);
    const totalMin = (h || 0) * 60 + (m || 0) + totalDuration;
    const endH = Math.floor(totalMin / 60);
    const endM = totalMin % 60;
    return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
  }, [appointmentTime, totalDuration]);

  // Confirmation message preview
  const formattedConfirmMessage = useMemo(() => {
    const barberObj = barbers.find((b) => b.id === selectedBarberId);
    const barberLine = barberObj ? `• *Profissional:* ${barberObj.name}\n` : '';
    const notesLine = notes.trim() ? `• *Observações:* ${notes.trim()}\n` : '';
    const dayName = weekDaysNames[dayOfWeekIndex] || '';

    return (
      `📅 *Agendamento Confirmado!*\n\n` +
      `Olá ${clientName.trim() || 'Cliente'}, seu horário foi registrado com sucesso:\n` +
      `• *Serviço:* ${combinedServiceName}\n` +
      `• *Data:* ${formatBrDate(appointmentDate)} (${dayName})\n` +
      `• *Horário:* ${appointmentTime} às ${endTimeStr}\n` +
      `• *Duração:* ${totalDuration} min\n` +
      `• *Valor Total:* R$ ${totalPrice.toFixed(2).replace('.', ',')}\n` +
      barberLine +
      notesLine +
      `\nTe aguardamos na barbearia!`
    );
  }, [
    clientName,
    combinedServiceName,
    appointmentDate,
    dayOfWeekIndex,
    appointmentTime,
    endTimeStr,
    totalDuration,
    totalPrice,
    selectedBarberId,
    barbers,
    notes,
  ]);

  // Submit and Validation
  const handleSaveAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim()) {
      toastError('Aviso', 'Informe o nome do cliente.');
      return;
    }
    const cleanPhone = clientPhone.replace(/\D/g, '');
    if (cleanPhone.length < 8) {
      toastError('Aviso', 'Informe um telefone/WhatsApp válido com DDD.');
      return;
    }
    if (!appointmentDate) {
      toastError('Aviso', 'Selecione a data do agendamento.');
      return;
    }
    if (!appointmentTime) {
      toastError('Aviso', 'Selecione o horário do agendamento.');
      return;
    }

    // 1. Day of week working status check
    if (!daySchedule.enabled) {
      toastError(
        'Estabelecimento Fechado',
        `A barbearia não realiza atendimentos aos ${weekDaysNames[dayOfWeekIndex] || 'dias selecionados'}. Escolha outra data.`
      );
      return;
    }

    // 2. Working hours bounds check
    const [sh, sm] = appointmentTime.split(':').map(Number);
    const startMin = (sh || 0) * 60 + (sm || 0);
    const endMin = startMin + totalDuration;

    const [openH, openM] = (daySchedule.start_time || '08:00').split(':').map(Number);
    const [closeH, closeM] = (daySchedule.end_time || '19:00').split(':').map(Number);
    const openMin = (openH || 0) * 60 + (openM || 0);
    const closeMin = (closeH || 0) * 60 + (closeM || 0);

    if (startMin < openMin || endMin > closeMin) {
      toastError(
        'Fora do Expediente',
        `O horário selecionado está fora do horário de funcionamento de ${weekDaysNames[dayOfWeekIndex]} (${daySchedule.start_time} às ${daySchedule.end_time}).`
      );
      const nextSlot = await StorageService.getNextAvailableSlot(appointmentDate, appointmentTime, totalDuration);
      if (nextSlot) setSuggestedSlot(nextSlot);
      return;
    }

    // 3. Break / lunch check
    if (daySchedule.has_break && daySchedule.break_start_time && daySchedule.break_end_time) {
      const [bsh, bsm] = daySchedule.break_start_time.split(':').map(Number);
      const [beh, bem] = daySchedule.break_end_time.split(':').map(Number);
      const breakStartMin = (bsh || 0) * 60 + (bsm || 0);
      const breakEndMin = (beh || 0) * 60 + (bem || 0);

      if (startMin < breakEndMin && endMin > breakStartMin) {
        toastError(
          'Horário de Pausa',
          `O atendimento coincide com o intervalo de almoço/pausa (${daySchedule.break_start_time} às ${daySchedule.break_end_time}).`
        );
        const nextSlot = await StorageService.getNextAvailableSlot(appointmentDate, appointmentTime, totalDuration);
        if (nextSlot) setSuggestedSlot(nextSlot);
        return;
      }
    }

    // 4. Conflicts & simultaneous capacity check
    const maxCapacity = Number(settings?.simultaneous_barbers) || 1;
    const activeAppointments = existingAppointments.filter(
      (a) => a.appointment_date === appointmentDate && a.status !== 'cancelled' && a.status !== 'no_show'
    );

    const conflictingAppointments = activeAppointments.filter((a) => {
      const [ah, am] = a.appointment_time.split(':').map(Number);
      const aStart = (ah || 0) * 60 + (am || 0);
      const aDur = Number(a.duration_minutes) || 30;
      const aEnd = aStart + aDur;
      return startMin < aEnd && endMin > aStart;
    });

    if (conflictingAppointments.length >= maxCapacity) {
      const nextSlot = await StorageService.getNextAvailableSlot(appointmentDate, appointmentTime, totalDuration);
      if (nextSlot) {
        toastError(
          'Horário Ocupado!',
          `As ${maxCapacity} cadeira(s) da barbearia já estão ocupadas às ${appointmentTime}. Próxima vaga livre para ${totalDuration} min: ${nextSlot.displayFull}.`
        );
        setSuggestedSlot(nextSlot);
      } else {
        toastError('Agenda Lotada', `Não há horários disponíveis para ${totalDuration} min nesta data. Selecione outro dia.`);
      }
      return;
    }

    setIsSaving(true);
    try {
      const baseSlot = settings?.slot_duration_minutes || 30;
      const slotsCount = Math.max(1, Math.ceil(totalDuration / baseSlot));
      const barberObj = barbers.find((b) => b.id === selectedBarberId);

      const newApt: Appointment = {
        id: `apt-${Date.now()}`,
        contact_name: clientName.trim(),
        contact_phone: cleanPhone,
        service_name: combinedServiceName,
        duration_minutes: totalDuration,
        end_time: endTimeStr,
        slots_count: slotsCount,
        price: totalPrice,
        appointment_date: appointmentDate,
        appointment_time: appointmentTime,
        status: 'confirmed',
        notes: [
          barberObj ? `Profissional: ${barberObj.name}` : null,
          notes.trim() ? notes.trim() : null,
        ]
          .filter(Boolean)
          .join(' | ') || undefined,
        created_at: new Date().toISOString(),
      };

      await StorageService.saveAppointment(newApt);

      if (onSuccess) {
        await onSuccess(newApt, sendWhatsAppConfirmation ? formattedConfirmMessage : '');
      }

      success(
        'Agendamento Confirmado!',
        `Horário reservado para ${newApt.contact_name} em ${formatBrDate(appointmentDate)} às ${appointmentTime} (${totalDuration} min).`
      );

      onClose();
    } catch (err: any) {
      console.error('Erro ao salvar agendamento:', err);
      toastError('Erro ao agendar', err.message || 'Falha ao gravar compromisso.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Novo Agendamento"
      subtitle="Regras sincronizadas com a grade de horários, expediente e capacidade"
      maxWidth="md"
    >
      <form onSubmit={handleSaveAppointment} className="space-y-4 pt-1 text-xs">
        {/* Client Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-slate-300 font-bold block">Nome do Cliente *</label>
            <div className="relative">
              <User className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Ex: Carlos Oliveira"
                className="w-full pl-9 pr-3 py-2 bg-dark-950 rounded-xl border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-slate-300 font-bold block">WhatsApp com DDD *</label>
            <div className="relative">
              <Phone className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                placeholder="Ex: 81996138924"
                className="w-full pl-9 pr-3 py-2 bg-dark-950 rounded-xl border border-white/10 text-white placeholder-slate-500 font-mono text-xs focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>
        </div>

        {/* Dynamic Services Selector (Multi-Service Support) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-slate-300 font-bold flex items-center gap-1.5">
              <Scissors className="w-3.5 h-3.5 text-brand-400" />
              <span>Serviços do Catálogo * (Clique para combinar)</span>
            </label>
            <span className="text-[11px] font-mono text-brand-300 font-bold">
              {selectedServicesList.length} selecionado(s)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 rounded-xl bg-dark-950 border border-white/10">
            {(settings?.services || []).map((s) => {
              const isSelected = selectedServiceIds.includes(s.id);
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => handleToggleSelectService(s.id)}
                  className={`p-2 rounded-xl border text-left transition-all flex items-start justify-between gap-2 ${
                    isSelected
                      ? 'bg-brand-500/20 border-brand-500/60 text-white shadow-sm ring-1 ring-brand-500/30'
                      : 'bg-dark-900/60 border-white/5 text-slate-400 hover:border-white/15'
                  }`}
                >
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold block text-white line-clamp-1">{s.name}</span>
                    <span className="text-[10px] text-slate-400 block font-mono">
                      ⏱️ {s.duration_minutes || 30} min • R$ {Number(s.price || 0).toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                  <div
                    className={`w-4 h-4 rounded-md flex items-center justify-center text-[10px] font-bold border transition-colors mt-0.5 ${
                      isSelected ? 'bg-brand-500 text-slate-950 border-brand-400' : 'border-white/20 bg-dark-950'
                    }`}
                  >
                    {isSelected ? '✓' : ''}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Combined Services Banner */}
          <div className="p-2.5 rounded-xl bg-brand-950/40 border border-brand-500/30 flex items-center justify-between text-xs">
            <div className="space-y-0.5 min-w-0 pr-2">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Combo Selecionado:</span>
              <span className="font-bold text-white truncate block">{combinedServiceName}</span>
            </div>
            <div className="text-right space-y-0.5 whitespace-nowrap flex-shrink-0">
              <span className="text-brand-300 font-mono font-bold block">
                ⏱️ {totalDuration} min
              </span>
              <span className="text-emerald-400 font-mono font-bold block">
                R$ {totalPrice.toFixed(2).replace('.', ',')}
              </span>
            </div>
          </div>
        </div>

        {/* Date & Time Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-slate-300 font-bold block">Data do Atendimento *</label>
              <span className="text-[10px] text-slate-400 font-semibold">
                {weekDaysNames[dayOfWeekIndex] || ''}
              </span>
            </div>
            <div className="relative">
              <Calendar className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="date"
                required
                value={appointmentDate}
                min={todayStr}
                onChange={(e) => {
                  setAppointmentDate(e.target.value);
                  setSuggestedSlot(null);
                }}
                className="w-full pl-9 pr-3 py-2 bg-dark-950 rounded-xl border border-white/10 text-white text-xs focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-slate-300 font-bold block">Horário de Início *</label>
              <span className="text-[10px] text-brand-300 font-mono">
                Término: {endTimeStr || '--:--'}
              </span>
            </div>
            <div className="relative">
              <Clock className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="time"
                required
                value={appointmentTime}
                onChange={(e) => {
                  setAppointmentTime(e.target.value);
                  setSuggestedSlot(null);
                }}
                className="w-full pl-9 pr-3 py-2 bg-dark-950 rounded-xl border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>
        </div>

        {/* Day Schedule Notice if Closed or Special */}
        {!daySchedule.enabled && (
          <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-xs text-rose-300 flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>
              <strong>Fechado:</strong> A barbearia não realiza atendimentos aos <strong>{weekDaysNames[dayOfWeekIndex]}s</strong>. Escolha outra data.
            </span>
          </div>
        )}

        {/* Quick Free Slots Chips */}
        {daySchedule.enabled && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-brand-400" />
                <span>Horários Livres Recomendados ({formatBrDate(appointmentDate)}):</span>
              </label>
              <span className="text-[10px] text-slate-400 font-mono">
                {isLoadingSlots ? 'Carregando vagas...' : `${availableSlots.length} vaga(s)`}
              </span>
            </div>

            {isLoadingSlots ? (
              <div className="flex items-center justify-center p-3 text-slate-500 text-[11px]">
                <Clock className="w-3.5 h-3.5 animate-spin mr-1.5 text-brand-400" />
                Calculando vagas livres com tempo suficiente ({totalDuration} min)...
              </div>
            ) : availableSlots.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2 rounded-xl bg-dark-950 border border-white/10">
                {availableSlots.map((slot) => {
                  const isCurrent = appointmentTime === slot;
                  return (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => {
                        setAppointmentTime(slot);
                        setSuggestedSlot(null);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                        isCurrent
                          ? 'bg-brand-500 text-dark-950 shadow-glow-brand ring-1 ring-white'
                          : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white border border-white/5'
                      }`}
                    >
                      {slot}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-[11px] text-amber-300/80 p-2 rounded-xl bg-amber-950/20 border border-amber-500/20">
                Nenhum horário livre restante com {totalDuration} min para esta data. Selecione outro dia.
              </p>
            )}
          </div>
        )}

        {/* Barber / Professional Selection (Optional) */}
        {barbers.length > 0 && (
          <div className="space-y-1">
            <label className="text-slate-300 font-bold block">Profissional / Barbeiro (Opcional)</label>
            <select
              value={selectedBarberId}
              onChange={(e) => setSelectedBarberId(e.target.value)}
              className="w-full px-3 py-2 bg-dark-950 rounded-xl border border-white/10 text-white text-xs focus:outline-none focus:border-brand-500"
            >
              <option value="">Qualquer Barbeiro / Sem preferência</option>
              {barbers.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.phone})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Notes */}
        <div className="space-y-1">
          <label className="text-slate-300 font-bold block">Observações do Atendimento</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ex: Prefere corte com tesoura, cliente novo..."
            className="w-full px-3 py-2 bg-dark-950 rounded-xl border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-brand-500"
          />
        </div>

        {/* Conflict Slot Suggestion Banner */}
        {suggestedSlot && (
          <div className="p-3.5 rounded-2xl bg-amber-950/50 border border-amber-500/40 text-xs text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in shadow-lg">
            <div className="space-y-1">
              <span className="font-bold flex items-center gap-1.5 text-amber-400">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                Horário ocupado! Sugestão disponível:
              </span>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Próximo horário com tempo suficiente ({totalDuration} min):{' '}
                <strong className="text-amber-300 font-bold underline decoration-amber-500/50">
                  {suggestedSlot.displayFull}
                </strong>
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                if (suggestedSlot.date) {
                  setAppointmentDate(suggestedSlot.date);
                }
                setAppointmentTime(suggestedSlot.time);
                setSuggestedSlot(null);
              }}
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-dark-950 font-black text-xs whitespace-nowrap active:scale-95 transition-all shadow-md flex items-center justify-center gap-1.5 self-start sm:self-center"
            >
              Usar {suggestedSlot.displayShort}
            </button>
          </div>
        )}

        {/* WhatsApp Notification Checkbox */}
        <div className="pt-2 border-t border-white/10">
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={sendWhatsAppConfirmation}
              onChange={(e) => setSendWhatsAppConfirmation(e.target.checked)}
              className="w-4 h-4 rounded text-brand-500 focus:ring-brand-500 bg-dark-900 border-white/20"
            />
            <span className="text-xs text-slate-300 font-semibold flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
              Enviar mensagem de confirmação no WhatsApp do cliente após salvar
            </span>
          </label>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSaving}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="brand"
            size="sm"
            isLoading={isSaving}
            disabled={!daySchedule.enabled}
            leftIcon={<CalendarCheck className="w-4 h-4" />}
            className="font-bold shadow-glow-brand"
          >
            Confirmar Agendamento
          </Button>
        </div>
      </form>
    </Modal>
  );
};
