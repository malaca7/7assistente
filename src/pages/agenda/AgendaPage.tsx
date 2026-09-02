import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  Phone, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Plus, 
  Search, 
  Filter, 
  Settings as SettingsIcon, 
  MessageSquare, 
  Trash2, 
  Edit, 
  Save, 
  Sliders, 
  Sparkles, 
  RefreshCw, 
  Layers,
  Check,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  GripVertical,
  Move,
  LayoutGrid,
  List
} from 'lucide-react';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input, Textarea } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../contexts/ToastContext';
import { StorageService } from '../../lib/storage';
import { Appointment, AgendaSettings, AgendaServiceItem } from '../../types';
import { formatPhone, formatDate } from '../../lib/utils';

export interface AgendaPageProps {
  onNavigate: (path: string) => void;
}

export const AgendaPage: React.FC<AgendaPageProps> = ({ onNavigate }) => {
  const { success, error: toastError, info } = useToast();
  const [activeTab, setActiveTab] = useState<'appointments' | 'settings'>('appointments');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [settings, setSettings] = useState<AgendaSettings>({
    business_days: ['1', '2', '3', '4', '5'],
    start_time: '08:00',
    end_time: '18:00',
    slot_duration_minutes: 30,
    break_start_time: '12:00',
    break_end_time: '13:00',
    services: [
      { id: 'srv-1', name: 'Atendimento Especialista', duration_minutes: 30, price: 150 },
      { id: 'srv-2', name: 'Demonstração da Plataforma', duration_minutes: 45, price: 0 },
      { id: 'srv-3', name: 'Suporte & Configuração', duration_minutes: 30, price: 80 },
    ],
  });

  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [searchTerm, setSearchTerm] = useState('');

  // Drag & Drop State
  const [draggedAptId, setDraggedAptId] = useState<string | null>(null);
  const [dragOverSlot, setDragOverSlot] = useState<string | null>(null);

  // Modal State for Manual Appointment
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newService, setNewService] = useState('Atendimento Especialista');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newTime, setNewTime] = useState('09:00');
  const [newNotes, setNewNotes] = useState('');
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // New Service input state in settings tab
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceDuration, setNewServiceDuration] = useState(30);
  const [newServicePrice, setNewServicePrice] = useState(0);

  const loadData = async () => {
    try {
      const [apts, agendaConfig] = await Promise.all([
        StorageService.getAppointments(),
        StorageService.getAgendaSettings(),
      ]);
      setAppointments(apts);
      setSettings(agendaConfig);
    } catch (err) {
      console.error('Error loading agenda data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Generate All Time Slots for the Day
  const generateSlots = () => {
    const startHour = parseInt(settings.start_time.split(':')[0], 10) || 8;
    const startMin = parseInt(settings.start_time.split(':')[1] || '0', 10);
    const endHour = parseInt(settings.end_time.split(':')[0], 10) || 18;
    const endMin = parseInt(settings.end_time.split(':')[1] || '0', 10);
    const duration = settings.slot_duration_minutes || 30;

    const slots: string[] = [];
    let currentMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    while (currentMinutes + duration <= endMinutes) {
      const h = Math.floor(currentMinutes / 60);
      const m = currentMinutes % 60;
      slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
      currentMinutes += duration;
    }

    return slots.length > 0 ? slots : ['08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'];
  };

  const slots = generateSlots();

  // Date Navigation Helpers
  const handlePrevDay = () => {
    const d = new Date(selectedDate + 'T00:00:00');
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate + 'T00:00:00');
    d.setDate(d.getDate() + 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleToday = () => {
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  const formatDisplayDate = (dateStr: string) => {
    try {
      const parts = dateStr.split('-');
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      return d.toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  // Drag and Drop Logic
  const handleDragStart = (e: React.DragEvent, apt: Appointment) => {
    e.dataTransfer.setData('text/plain', apt.id);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedAptId(apt.id);
  };

  const handleDragEnd = () => {
    setDraggedAptId(null);
    setDragOverSlot(null);
  };

  const handleDropOnSlot = async (slotTime: string) => {
    if (!draggedAptId) return;

    const aptToMove = appointments.find((a) => a.id === draggedAptId);
    if (!aptToMove) return;

    if (aptToMove.appointment_time === slotTime && aptToMove.appointment_date === selectedDate) {
      setDraggedAptId(null);
      setDragOverSlot(null);
      return;
    }

    try {
      const updated: Appointment = {
        ...aptToMove,
        appointment_date: selectedDate,
        appointment_time: slotTime,
      };

      // Optimistic update
      setAppointments((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      await StorageService.saveAppointment(updated);
      success(
        'Horário Reagendado!',
        `${updated.contact_name} foi movido para ${selectedDate} às ${slotTime}.`
      );
    } catch (err: any) {
      toastError('Erro ao reagendar', err.message);
      await loadData();
    } finally {
      setDraggedAptId(null);
      setDragOverSlot(null);
    }
  };

  const handleOpenAddOnSlot = (slotTime: string) => {
    setNewDate(selectedDate);
    setNewTime(slotTime);
    setIsAddModalOpen(true);
  };

  const getServiceDuration = (serviceName: string, currentSettings: AgendaSettings, apt?: Appointment): number => {
    if (apt?.duration_minutes && apt.duration_minutes > 0) {
      return apt.duration_minutes;
    }
    if (!serviceName) return currentSettings.slot_duration_minutes || 15;

    const normalized = serviceName.trim().toLowerCase();
    const matched = (currentSettings.services || []).find((s) => {
      const sNorm = s.name.trim().toLowerCase();
      return sNorm === normalized || normalized.includes(sNorm) || sNorm.includes(normalized);
    });

    if (matched && matched.duration_minutes > 0) {
      return matched.duration_minutes;
    }

    const match = serviceName.match(/(\d+)\s*(?:min|m|minutos)/i);
    if (match) {
      return parseInt(match[1], 10);
    }

    if (normalized.includes('barba') && normalized.includes('corte')) {
      return 55;
    }

    return currentSettings.slot_duration_minutes || 15;
  };

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim() || !newClientPhone.trim()) {
      toastError('Campos obrigatórios', 'Informe o nome e WhatsApp do cliente.');
      return;
    }

    try {
      const srvObj = settings.services.find((s) => s.name === newService);
      const calculatedDur = srvObj?.duration_minutes || getServiceDuration(newService, settings);

      const newApt: Appointment = {
        id: `apt-${Date.now()}`,
        contact_name: newClientName.trim(),
        contact_phone: newClientPhone.replace(/\D/g, ''),
        service_name: newService,
        duration_minutes: calculatedDur,
        appointment_date: newDate,
        appointment_time: newTime,
        status: 'confirmed',
        notes: newNotes.trim() || undefined,
        created_at: new Date().toISOString(),
      };

      await StorageService.saveAppointment(newApt);
      await loadData();
      setIsAddModalOpen(false);
      setNewClientName('');
      setNewClientPhone('');
      setNewNotes('');
      success('Agendamento Confirmado', `Horário reservado para ${newApt.contact_name} em ${newApt.appointment_date} às ${newApt.appointment_time}.`);
    } catch (err: any) {
      toastError('Erro ao agendar', err.message);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: Appointment['status']) => {
    try {
      await StorageService.updateAppointmentStatus(id, newStatus);
      await loadData();
      success('Status Atualizado', `O agendamento agora está ${newStatus === 'confirmed' ? 'Confirmado' : newStatus === 'completed' ? 'Concluído' : 'Cancelado'}.`);
    } catch (err: any) {
      toastError('Erro ao atualizar status', err.message);
    }
  };

  const handleDeleteAppointment = async (id: string, clientName: string) => {
    try {
      await StorageService.deleteAppointment(id);
      await loadData();
      success('Agendamento Removido', `O agendamento de ${clientName} foi excluído.`);
    } catch (err: any) {
      toastError('Erro ao excluir', err.message);
    }
  };

  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    try {
      await StorageService.updateAgendaSettings(settings);
      success('Configurações da Agenda Salvas', 'Horários e regras sincronizados com o motor do WhatsApp.');
    } catch (err: any) {
      toastError('Erro ao salvar configurações', err.message);
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleAddService = () => {
    if (!newServiceName.trim()) return;
    const newSrv: AgendaServiceItem = {
      id: `srv-${Date.now()}`,
      name: newServiceName.trim(),
      duration_minutes: Number(newServiceDuration) || 30,
      price: Number(newServicePrice) || 0,
    };
    setSettings((prev) => ({
      ...prev,
      services: [...prev.services, newSrv],
    }));
    setNewServiceName('');
    setNewServicePrice(0);
    success('Serviço Adicionado', `"${newSrv.name}" adicionado à lista de serviços.`);
  };

  const handleRemoveService = (srvId: string) => {
    setSettings((prev) => ({
      ...prev,
      services: prev.services.filter((s) => s.id !== srvId),
    }));
  };

  const toggleDay = (dayKey: string) => {
    setSettings((prev) => {
      const days = prev.business_days.includes(dayKey)
        ? prev.business_days.filter((d) => d !== dayKey)
        : [...prev.business_days, dayKey];
      return { ...prev, business_days: days };
    });
  };

  const weekDays = [
    { key: '1', label: 'Segunda' },
    { key: '2', label: 'Terça' },
    { key: '3', label: 'Quarta' },
    { key: '4', label: 'Quinta' },
    { key: '5', label: 'Sexta' },
    { key: '6', label: 'Sábado' },
    { key: '0', label: 'Domingo' },
  ];

  // Appointments for the selected day in Grid View
  const dayAppointments = appointments.filter((a) => a.appointment_date === selectedDate);

  // Filtered appointments for List View
  const filteredAppointments = appointments.filter((apt) => {
    const matchesSearch =
      apt.contact_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.contact_phone.includes(searchTerm) ||
      apt.service_name.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;
    if (filterStatus !== 'all' && apt.status !== filterStatus) return false;
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300 select-none pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-display font-bold text-white tracking-tight flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-emerald-400" />
            Agenda & Grade de Horários
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Gerencie os horários marcados pelos clientes no WhatsApp e arraste os cards para reagendar.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex rounded-2xl bg-dark-900 border border-white/10 p-1">
            <button
              onClick={() => setActiveTab('appointments')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'appointments'
                  ? 'bg-emerald-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              Grade & Horários ({appointments.length})
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'settings'
                  ? 'bg-emerald-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <SettingsIcon className="w-3.5 h-3.5" />
              Configurar Horários
            </button>
          </div>

          {activeTab === 'appointments' && (
            <Button
              variant="brand"
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => {
                setNewDate(selectedDate);
                setIsAddModalOpen(true);
              }}
              className="bg-emerald-600 hover:bg-emerald-500"
            >
              Novo Agendamento
            </Button>
          )}
        </div>
      </div>

      {/* TAB 1: Appointments & Grid */}
      {activeTab === 'appointments' && (
        <div className="space-y-6">
          {/* Top Control Bar: Date Navigator & View Switcher */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-3xl bg-dark-900 border border-white/5 shadow-xl">
            {/* Date Navigator */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
              <div className="flex items-center gap-1">
                <button
                  onClick={handlePrevDay}
                  className="p-2 rounded-xl bg-dark-850 border border-white/5 text-slate-300 hover:text-white hover:border-white/20 transition-colors"
                  title="Dia Anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={handleToday}
                  className="px-3 py-1.5 rounded-xl bg-dark-850 border border-white/5 text-xs font-bold text-slate-300 hover:text-white hover:border-white/20 transition-colors"
                >
                  Hoje
                </button>
                <button
                  onClick={handleNextDay}
                  className="p-2 rounded-xl bg-dark-850 border border-white/5 text-slate-300 hover:text-white hover:border-white/20 transition-colors"
                  title="Próximo Dia"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-dark-850 border border-white/10 rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <span className="text-xs font-bold text-white capitalize hidden md:inline">
                  {formatDisplayDate(selectedDate)}
                </span>
              </div>
            </div>

            {/* View Mode & Drag Tip */}
            <div className="flex items-center gap-3">
              <div className="hidden lg:flex items-center gap-1.5 text-[11px] text-emerald-400/90 font-medium bg-emerald-950/40 border border-emerald-500/20 px-3 py-1 rounded-xl">
                <Move className="w-3.5 h-3.5" />
                <span>Arraste os cards (Drag & Drop) para trocar o horário</span>
              </div>

              <div className="flex rounded-xl bg-dark-850 border border-white/10 p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-lg text-xs transition-colors flex items-center gap-1 ${
                    viewMode === 'grid'
                      ? 'bg-emerald-500 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Grade por Horários"
                >
                  <LayoutGrid className="w-4 h-4" />
                  <span className="text-xs font-bold hidden sm:inline">Grade</span>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-lg text-xs transition-colors flex items-center gap-1 ${
                    viewMode === 'list'
                      ? 'bg-emerald-500 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Lista Completa"
                >
                  <List className="w-4 h-4" />
                  <span className="text-xs font-bold hidden sm:inline">Lista</span>
                </button>
              </div>
            </div>
          </div>

          {/* VIEW MODE 1: Interactive Drag & Drop Time Grid */}
          {viewMode === 'grid' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-3">
                {(() => {
                  const occupiedSlots = new Set<string>();
                  const slotOccupationMap = new Map<
                    string,
                    {
                      apt: Appointment;
                      slotsCount: number;
                      endHourStr: string;
                      dur: number;
                      coveredSlotTimes: string[];
                    }
                  >();

                  dayAppointments.forEach((apt) => {
                    const dur = getServiceDuration(apt.service_name, settings, apt);
                    const aptStart =
                      parseInt(apt.appointment_time.split(':')[0], 10) * 60 +
                      parseInt(apt.appointment_time.split(':')[1] || '0', 10);
                    const aptEnd = aptStart + dur;
                    const endHourStr = `${String(Math.floor(aptEnd / 60)).padStart(2, '0')}:${String(aptEnd % 60).padStart(2, '0')}`;

                    // Find all slots covered by this appointment
                    const covered = slots.filter((st) => {
                      const stMin =
                        parseInt(st.split(':')[0], 10) * 60 + parseInt(st.split(':')[1] || '0', 10);
                      return stMin >= aptStart && stMin < aptEnd;
                    });

                    if (covered.length > 0) {
                      const startSlot = covered[0];
                      slotOccupationMap.set(startSlot, {
                        apt,
                        slotsCount: covered.length,
                        endHourStr,
                        dur,
                        coveredSlotTimes: covered,
                      });

                      // Mark subsequent covered slots as occupied so they don't render duplicate cards
                      for (let i = 1; i < covered.length; i++) {
                        occupiedSlots.add(covered[i]);
                      }
                    }
                  });

                  return slots.map((slotTime) => {
                    // Skip rendering redundant slot rows that are already covered by the spanning card above
                    if (occupiedSlots.has(slotTime)) {
                      return null;
                    }

                    const occupation = slotOccupationMap.get(slotTime);
                    const isBreak =
                      settings.break_start_time &&
                      settings.break_end_time &&
                      slotTime >= settings.break_start_time &&
                      slotTime < settings.break_end_time;
                    const isDragOver = dragOverSlot === slotTime;

                    if (occupation) {
                      const { apt, endHourStr, dur, coveredSlotTimes } = occupation;
                      return (
                        <div
                          key={slotTime}
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.dataTransfer.dropEffect = 'move';
                            setDragOverSlot(slotTime);
                          }}
                          onDragLeave={() => {
                            if (dragOverSlot === slotTime) setDragOverSlot(null);
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            handleDropOnSlot(slotTime);
                          }}
                          className={`p-4 rounded-3xl border transition-all duration-200 flex flex-col md:flex-row items-start md:items-center gap-4 ${
                            isDragOver
                              ? 'bg-emerald-950/60 border-emerald-400 ring-2 ring-emerald-500 shadow-2xl scale-[1.01]'
                              : 'bg-dark-900/90 border-emerald-500/30 hover:border-emerald-500/50 shadow-xl'
                          }`}
                        >
                          {/* Time & Duration Column */}
                          <div className="flex flex-col justify-center md:w-40 flex-shrink-0 space-y-1">
                            <div className="flex items-center gap-2">
                              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400" />
                              <span className="font-mono text-base font-extrabold text-white tracking-tight">
                                {apt.appointment_time}
                              </span>
                              <span className="text-xs text-slate-400 font-mono">➔ {endHourStr}</span>
                            </div>
                            <span className="text-[10px] font-bold text-emerald-300 font-mono bg-emerald-500/15 px-2.5 py-0.5 rounded-lg border border-emerald-500/30 w-fit">
                              ⏱️ {dur} minutos
                            </span>
                          </div>

                          {/* Single Unified Multi-Slot Appointment Card */}
                          <div
                            draggable
                            onDragStart={(e) => handleDragStart(e, apt)}
                            onDragEnd={handleDragEnd}
                            className={`flex-1 w-full p-4 rounded-2xl border transition-all cursor-grab active:cursor-grabbing shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                              draggedAptId === apt.id
                                ? 'opacity-40 scale-95 border-dashed border-emerald-400 bg-emerald-950/40'
                                : apt.status === 'confirmed'
                                ? 'bg-gradient-to-r from-emerald-950/40 via-dark-850 to-dark-900 border-emerald-500/40 hover:border-emerald-400'
                                : apt.status === 'completed'
                                ? 'bg-gradient-to-r from-brand-950/40 via-dark-850 to-dark-900 border-brand-500/40 hover:border-brand-400'
                                : 'bg-gradient-to-r from-rose-950/40 via-dark-850 to-dark-900 border-rose-500/40 hover:border-rose-400'
                            }`}
                          >
                            <div className="flex items-start sm:items-center gap-3.5">
                              <div className="p-2 rounded-xl bg-white/5 text-slate-400 hover:text-white cursor-grab">
                                <GripVertical className="w-5 h-5" />
                              </div>
                              <div className="space-y-1.5">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h4 className="text-sm font-extrabold text-white tracking-tight">{apt.contact_name}</h4>
                                  <span
                                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                      apt.status === 'confirmed'
                                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                        : apt.status === 'completed'
                                        ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30'
                                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                    }`}
                                  >
                                    {apt.status === 'confirmed' ? 'Confirmado' : apt.status === 'completed' ? 'Concluído' : 'Cancelado'}
                                  </span>
                                </div>

                                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
                                  <span className="font-mono text-slate-400">{formatPhone(apt.contact_phone)}</span>
                                  <span>•</span>
                                  <span className="text-emerald-300 font-bold bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-500/20">
                                    {apt.service_name}
                                  </span>
                                </div>

                                {/* Multi-slot indicator */}
                                {coveredSlotTimes.length > 1 && (
                                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                    <span className="text-[10px] text-slate-400 font-medium">
                                      Ocupa {coveredSlotTimes.length} horários:
                                    </span>
                                    {coveredSlotTimes.map((st) => (
                                      <span
                                        key={st}
                                        className="px-2 py-0.5 rounded-md bg-dark-950 border border-emerald-500/30 text-[10px] font-mono font-bold text-amber-300 shadow-sm"
                                      >
                                        {st}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-1.5 self-end sm:self-center">
                              {apt.status === 'confirmed' && (
                                <button
                                  onClick={() => handleUpdateStatus(apt.id, 'completed')}
                                  className="p-2 rounded-xl text-slate-400 hover:text-emerald-400 hover:bg-white/5 transition-colors"
                                  title="Marcar como Concluído"
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => onNavigate('/conversas')}
                                className="p-2 rounded-xl text-slate-400 hover:text-brand-300 hover:bg-white/5 transition-colors"
                                title="Abrir Conversa no WhatsApp"
                              >
                                <MessageSquare className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteAppointment(apt.id, apt.contact_name)}
                                className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-white/5 transition-colors"
                                title="Excluir Agendamento"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    // Free Slot
                    return (
                      <div
                        key={slotTime}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.dataTransfer.dropEffect = 'move';
                          setDragOverSlot(slotTime);
                        }}
                        onDragLeave={() => {
                          if (dragOverSlot === slotTime) setDragOverSlot(null);
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          handleDropOnSlot(slotTime);
                        }}
                        className={`min-h-[64px] p-3 rounded-2xl border transition-all duration-150 flex flex-col md:flex-row md:items-center gap-3 ${
                          isDragOver
                            ? 'bg-emerald-950/50 border-emerald-400 ring-2 ring-emerald-500 shadow-xl'
                            : isBreak
                            ? 'bg-dark-950/40 border-dashed border-white/5 opacity-70'
                            : 'bg-dark-900/40 border-white/5 hover:border-white/15'
                        }`}
                      >
                        {/* Time Slot Label */}
                        <div className="flex items-center justify-between md:w-40 flex-shrink-0">
                          <div className="flex items-center gap-2">
                            <div className={`w-2.5 h-2.5 rounded-full ${isBreak ? 'bg-amber-400' : 'bg-slate-700'}`} />
                            <span className="font-mono text-sm font-bold text-slate-300 tracking-wider">
                              {slotTime}
                            </span>
                          </div>
                          {isBreak && (
                            <span className="text-[10px] text-amber-300 font-semibold px-2 py-0.5 bg-amber-500/10 rounded-md md:hidden">
                              Intervalo
                            </span>
                          )}
                        </div>

                        {/* Free Slot Button */}
                        <div className="flex-1 flex items-center min-h-[44px]">
                          <div
                            onClick={() => handleOpenAddOnSlot(slotTime)}
                            className="flex-1 h-full min-h-[44px] rounded-xl border border-dashed border-white/10 hover:border-emerald-500/40 hover:bg-emerald-500/5 cursor-pointer flex items-center justify-center text-xs text-slate-500 hover:text-emerald-300 transition-all group"
                          >
                            <span className="flex items-center gap-1.5 font-medium">
                              <Plus className="w-3.5 h-3.5 group-hover:scale-125 transition-transform" />
                              {isBreak ? 'Intervalo (Clique para agendar mesmo assim)' : 'Horário Livre — Clique ou Solte um card aqui'}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          )}

          {/* VIEW MODE 2: Full List of Appointments */}
          {viewMode === 'list' && (
            <div className="space-y-4">
              {/* Search & Filters */}
              <Card>
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-2">
                  <div className="relative flex-1 w-full">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Buscar por cliente, telefone ou serviço..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-dark-850 border border-white/5 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  {/* Status Filter */}
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full sm:w-auto">
                    {[
                      { id: 'all', label: 'Todos' },
                      { id: 'confirmed', label: 'Confirmados' },
                      { id: 'completed', label: 'Concluídos' },
                      { id: 'cancelled', label: 'Cancelados' },
                    ].map((st) => (
                      <button
                        key={st.id}
                        onClick={() => setFilterStatus(st.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                          filterStatus === st.id
                            ? 'bg-emerald-500 text-white'
                            : 'bg-dark-850 text-slate-400 hover:text-white'
                        }`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>
                </div>
              </Card>

              {/* Grid of Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredAppointments.map((apt) => (
                  <div
                    key={apt.id}
                    className="p-4 rounded-3xl bg-dark-900 border border-white/5 hover:border-emerald-500/30 transition-all space-y-3 shadow-xl relative group"
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          apt.status === 'confirmed'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : apt.status === 'completed'
                            ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        }`}
                      >
                        {apt.status === 'confirmed' ? 'Confirmado' : apt.status === 'completed' ? 'Concluído' : 'Cancelado'}
                      </span>
                      <span className="text-xs font-mono font-bold text-white flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-emerald-400" />
                        {apt.appointment_time}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <User className="w-4 h-4 text-slate-400" />
                        {apt.contact_name}
                      </h3>
                      <p className="text-xs text-slate-400 font-mono flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-500" />
                        {formatPhone(apt.contact_phone)}
                      </p>
                    </div>

                    <div className="p-2.5 rounded-2xl bg-dark-850 border border-white/5 space-y-1 text-xs">
                      <div className="flex items-center justify-between text-slate-300">
                        <span className="font-semibold text-emerald-400">Serviço:</span>
                        <span className="font-medium truncate">{apt.service_name}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-400 text-[11px]">
                        <span>Data:</span>
                        <span className="font-mono">{apt.appointment_date}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-white/5">
                      <div className="flex items-center gap-1">
                        {apt.status === 'confirmed' && (
                          <button
                            onClick={() => handleUpdateStatus(apt.id, 'completed')}
                            className="px-2 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[11px] font-semibold flex items-center gap-1 transition-colors"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Concluir
                          </button>
                        )}
                        {apt.status !== 'cancelled' && (
                          <button
                            onClick={() => handleUpdateStatus(apt.id, 'cancelled')}
                            className="px-2 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-[11px] font-semibold flex items-center gap-1 transition-colors"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            Cancelar
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onNavigate('/conversas')}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-white/5 transition-colors"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteAppointment(apt.id, apt.contact_name)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-white/5 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Agenda Settings & Business Rules */}
      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in">
          {/* Left Column: Business Hours & Rules (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Horários de Atendimento & Expediente</CardTitle>
                    <p className="text-xs text-slate-400">Defina os dias e intervalos em que o robô pode agendar clientes</p>
                  </div>
                </div>
              </CardHeader>

              <div className="space-y-5">
                {/* Working Days */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-white">Dias de Atendimento na Semana:</label>
                  <div className="flex flex-wrap gap-2">
                    {weekDays.map((day) => {
                      const isSelected = settings.business_days.includes(day.key);
                      return (
                        <button
                          key={day.key}
                          type="button"
                          onClick={() => toggleDay(day.key)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                            isSelected
                              ? 'bg-emerald-500 text-white border-emerald-400 shadow-md'
                              : 'bg-dark-850 text-slate-400 border-white/5 hover:text-white'
                          }`}
                        >
                          {day.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Operating Hours */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Horário de Abertura"
                    type="time"
                    value={settings.start_time}
                    onChange={(e) => setSettings({ ...settings, start_time: e.target.value })}
                  />
                  <Input
                    label="Horário de Fechamento"
                    type="time"
                    value={settings.end_time}
                    onChange={(e) => setSettings({ ...settings, end_time: e.target.value })}
                  />
                </div>

                {/* Duration & Break */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-slate-300">Duração por Slot</label>
                    <select
                      value={settings.slot_duration_minutes}
                      onChange={(e) => setSettings({ ...settings, slot_duration_minutes: Number(e.target.value) })}
                      className="w-full rounded-xl bg-dark-850 border border-slate-700/60 px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                    >
                      <option value={15}>15 minutos</option>
                      <option value={30}>30 minutos</option>
                      <option value={45}>45 minutos</option>
                      <option value={60}>60 minutos (1 hora)</option>
                    </select>
                  </div>

                  <Input
                    label="Início do Intervalo / Almoço"
                    type="time"
                    value={settings.break_start_time || '12:00'}
                    onChange={(e) => setSettings({ ...settings, break_start_time: e.target.value })}
                  />
                  <Input
                    label="Fim do Intervalo / Almoço"
                    type="time"
                    value={settings.break_end_time || '13:00'}
                    onChange={(e) => setSettings({ ...settings, break_end_time: e.target.value })}
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    variant="brand"
                    leftIcon={<Save className="w-4 h-4" />}
                    isLoading={isSavingSettings}
                    onClick={handleSaveSettings}
                    className="bg-emerald-600 hover:bg-emerald-500"
                  >
                    Salvar Horários da Agenda
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column: Services Catalog (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  <CardTitle className="text-sm">Catálogo de Serviços & Consultas</CardTitle>
                </div>
              </CardHeader>

              <div className="space-y-4">
                {/* Add Service Form */}
                <div className="p-3.5 rounded-2xl bg-dark-850 border border-white/5 space-y-3">
                  <Input
                    label="Nome do Serviço"
                    placeholder="Ex: Consulta Médica, Demonstração"
                    value={newServiceName}
                    onChange={(e) => setNewServiceName(e.target.value)}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      label="Duração (min)"
                      type="number"
                      value={newServiceDuration}
                      onChange={(e) => setNewServiceDuration(Number(e.target.value))}
                    />
                    <Input
                      label="Valor (R$)"
                      type="number"
                      value={newServicePrice}
                      onChange={(e) => setNewServicePrice(Number(e.target.value))}
                    />
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full text-xs"
                    onClick={handleAddService}
                    leftIcon={<Plus className="w-3.5 h-3.5" />}
                  >
                    Adicionar ao Catálogo
                  </Button>
                </div>

                {/* Services List */}
                <div className="space-y-2 max-h-72 overflow-y-auto custom-scrollbar">
                  {settings.services.map((srv) => (
                    <div
                      key={srv.id}
                      className="p-3 rounded-2xl bg-dark-850 border border-white/5 flex items-center justify-between"
                    >
                      <div>
                        <p className="text-xs font-bold text-white">{srv.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono">
                          {srv.duration_minutes} min • {srv.price ? `R$ ${srv.price},00` : 'Gratuito'}
                        </p>
                      </div>
                      <button
                        onClick={() => handleRemoveService(srv.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-white/5 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Manual Appointment Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Novo Agendamento Manual"
        subtitle="Reserve um horário na agenda para um cliente"
      >
        <form onSubmit={handleCreateAppointment} className="space-y-4">
          <Input
            label="Nome do Cliente"
            placeholder="Ex: Rogerio Silva"
            value={newClientName}
            onChange={(e) => setNewClientName(e.target.value)}
            required
          />

          <Input
            label="WhatsApp do Cliente (com DDD)"
            placeholder="Ex: 81996138924"
            value={newClientPhone}
            onChange={(e) => setNewClientPhone(e.target.value)}
            required
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-300">Serviço / Atendimento</label>
            <select
              value={newService}
              onChange={(e) => setNewService(e.target.value)}
              className="w-full rounded-xl bg-dark-850 border border-slate-700/60 px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {settings.services.map((s) => (
                <option key={s.id} value={s.name}>
                  {s.name} ({s.duration_minutes} min)
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Data"
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              required
            />
            <Input
              label="Horário"
              type="time"
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              required
            />
          </div>

          <Textarea
            label="Observações Internas (Opcional)"
            placeholder="Ex: Cliente prefere atendimento presencial."
            value={newNotes}
            onChange={(e) => setNewNotes(e.target.value)}
            rows={2}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="brand" className="bg-emerald-600 hover:bg-emerald-500">
              Confirmar Agendamento
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
