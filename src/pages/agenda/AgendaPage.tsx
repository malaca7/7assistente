import React, { useState, useEffect, useMemo } from 'react';
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
  Edit2,
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
  List,
  Scissors,
  Copy,
  Briefcase,
  ToggleLeft,
  ToggleRight,
  Info,
  CalendarCheck,
  CalendarDays,
  TrendingUp,
  AlertTriangle,
  History,
  Coffee,
  Bell,
  Users
} from 'lucide-react';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input, Textarea } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../contexts/ToastContext';
import { StorageService, getBackendUrl } from '../../lib/storage';
import { Appointment, AgendaSettings, AgendaServiceItem, SlotSuggestion, DayScheduleConfig } from '../../types';
import { formatPhone, formatDate, getLocalDateStr } from '../../lib/utils';
import { QuickDateButtons } from '../../components/agenda/QuickDateButtons';

export interface AgendaPageProps {
  onNavigate: (path: string) => void;
}

export const AgendaPage: React.FC<AgendaPageProps> = ({ onNavigate }) => {
  const { success, error: toastError, info, warning } = useToast();
  
  // Tabs: 'appointments' | 'services' | 'hours' | 'simulator'
  const [activeTab, setActiveTab] = useState<'appointments' | 'services' | 'hours' | 'simulator'>('appointments');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [settings, setSettings] = useState<AgendaSettings>({
    business_days: ['1', '2', '3', '4', '5', '6'],
    start_time: '08:00',
    end_time: '19:00',
    slot_duration_minutes: 30,
    break_start_time: '12:00',
    break_end_time: '13:00',
    buffer_minutes: 5,
    out_of_hours_message: 'Olá! Nosso horário de expediente é de Segunda a Sábado das 08:00 às 19:00. Deixe sua mensagem ou escolha um horário que responderemos com prioridade!',
    services: [
      { id: 'srv-1', name: 'Corte Tradicional', duration_minutes: 30, price: 35, category: 'Cabelo', is_active: true },
      { id: 'srv-2', name: 'Barba Terapia & Modelagem', duration_minutes: 25, price: 25, category: 'Barba', is_active: true },
      { id: 'srv-3', name: 'Combo Cabelo + Barba', duration_minutes: 55, price: 55, category: 'Combos', is_active: true },
      { id: 'srv-4', name: 'Sobrancelha & Acabamento', duration_minutes: 15, price: 15, category: 'Estética', is_active: true },
    ],
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const todayStr = useMemo(() => getLocalDateStr(), []);
  const [selectedDate, setSelectedDate] = useState<string>(() => getLocalDateStr());
  const [searchTerm, setSearchTerm] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [showFloatingButton, setShowFloatingButton] = useState(false);

  // Monitor page scroll to activate floating action button
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY || document.documentElement.scrollTop || 0;
      setShowFloatingButton(scrollY > 150);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Drag & Drop State
  const [draggedAptId, setDraggedAptId] = useState<string | null>(null);
  const [dragOverSlot, setDragOverSlot] = useState<string | null>(null);

  // Modal State for Manual Appointment
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>(['srv-1']);
  const [newDate, setNewDate] = useState(() => getLocalDateStr());
  const [newTime, setNewTime] = useState('09:00');
  const [newPrice, setNewPrice] = useState<number | ''>('');
  const [newNotes, setNewNotes] = useState('');
  const [suggestedSlot, setSuggestedSlot] = useState<SlotSuggestion | null>(null);

  const selectedServicesList = useMemo(() => {
    const list = (settings.services || []).filter(s => selectedServiceIds.includes(s.id));
    return list.length > 0 ? list : (settings.services && settings.services.length > 0 ? [settings.services[0]] : []);
  }, [settings.services, selectedServiceIds]);

  const totalCalculatedDuration = useMemo(() => {
    return selectedServicesList.reduce((acc, s) => acc + (Number(s.duration_minutes) || 30), 0);
  }, [selectedServicesList]);

  const totalCalculatedPrice = useMemo(() => {
    return selectedServicesList.reduce((acc, s) => acc + (Number(s.price) || 0), 0);
  }, [selectedServicesList]);

  const combinedServiceName = useMemo(() => {
    return selectedServicesList.map(s => s.name).join(' + ');
  }, [selectedServicesList]);

  const handleToggleSelectService = (srvId: string) => {
    setSelectedServiceIds(prev => {
      const exists = prev.includes(srvId);
      if (exists) {
        if (prev.length === 1) return prev;
        return prev.filter(id => id !== srvId);
      } else {
        return [...prev, srvId];
      }
    });
  };

  // Service Modal State (Catálogo)
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [serviceName, setServiceName] = useState('');
  const [serviceDuration, setServiceDuration] = useState(30);
  const [servicePrice, setServicePrice] = useState<number | ''>(35);
  const [serviceCategory, setServiceCategory] = useState('Cabelo');
  const [serviceDescription, setServiceDescription] = useState('');
  const [serviceIsActive, setServiceIsActive] = useState(true);
  const [serviceSearchTerm, setServiceSearchTerm] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');

  // Simulator State
  const [simDate, setSimDate] = useState(() => getLocalDateStr());

  // Load Data
  const loadData = async (silent = false) => {
    try {
      if (!silent) setIsLoading(true);
      const [aptsData, settingsData] = await Promise.all([
        StorageService.getAppointments(),
        StorageService.getAgendaSettings(),
      ]);
      setAppointments(aptsData);
      if (settingsData) {
        setSettings(prev => ({
          ...prev,
          ...settingsData,
          services: (settingsData.services && settingsData.services.length > 0) ? settingsData.services : prev.services,
        }));
      }
    } catch (e) {
      console.error('Error loading agenda data:', e);
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData(false);
    const interval = setInterval(() => {
      loadData(true);
    }, 4000);

    const handleFocus = () => {
      if (document.visibilityState === 'visible') {
        loadData(true);
      }
    };
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, []);

  // Save General Agenda Settings (Expediente)
  const handleSaveHoursSettings = async () => {
    try {
      setIsSavingSettings(true);
      await StorageService.updateAgendaSettings(settings);
      success('Configurações Salvas', 'Expediente e horários foram atualizados no banco de dados e no WhatsApp bot.');
    } catch (err: any) {
      toastError('Erro ao salvar', err.message);
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Toggle Business Day
  const handleToggleDay = (dayIndex: string) => {
    const current = [...settings.business_days];
    const exists = current.includes(dayIndex);
    const updated = exists ? current.filter(d => d !== dayIndex) : [...current, dayIndex];
    setSettings(prev => ({ ...prev, business_days: updated }));
  };

  // --- DAY-BY-DAY WORKING HOURS METHODS ---
  const getDaySchedule = (dayId: string): DayScheduleConfig => {
    if (settings.day_schedules && settings.day_schedules[dayId]) {
      return settings.day_schedules[dayId];
    }
    const isEnabled = settings.business_days ? settings.business_days.includes(dayId) : dayId !== '0';
    return {
      enabled: isEnabled,
      start_time: settings.start_time || '08:00',
      end_time: settings.end_time || (dayId === '6' ? '18:00' : '19:00'),
      has_break: Boolean(settings.break_start_time && settings.break_end_time),
      break_start_time: settings.break_start_time || '12:00',
      break_end_time: settings.break_end_time || '13:00',
    };
  };

  const handleUpdateDaySchedule = (dayId: string, updates: Partial<DayScheduleConfig>) => {
    const current = getDaySchedule(dayId);
    const updatedDay: DayScheduleConfig = { ...current, ...updates };

    let updatedBusinessDays = [...(settings.business_days || [])];
    if (updatedDay.enabled && !updatedBusinessDays.includes(dayId)) {
      updatedBusinessDays.push(dayId);
    } else if (!updatedDay.enabled && updatedBusinessDays.includes(dayId)) {
      updatedBusinessDays = updatedBusinessDays.filter((d) => d !== dayId);
    }

    const newSchedules = {
      ...(settings.day_schedules || {}),
      [dayId]: updatedDay,
    };

    setSettings((prev) => ({
      ...prev,
      business_days: updatedBusinessDays,
      day_schedules: newSchedules,
    }));
  };

  const handleApplyToAllDays = (sourceDayId: string) => {
    const source = getDaySchedule(sourceDayId);
    const newSchedules: Record<string, DayScheduleConfig> = {};
    const newBusinessDays: string[] = [];

    weekDaysLabels.forEach((d) => {
      const isEnabled = d.id === '0' ? false : source.enabled;
      newSchedules[d.id] = {
        ...source,
        enabled: isEnabled,
      };
      if (isEnabled) newBusinessDays.push(d.id);
    });

    setSettings((prev) => ({
      ...prev,
      business_days: newBusinessDays,
      day_schedules: newSchedules,
    }));
    const dayName = weekDaysLabels.find((w) => w.id === sourceDayId)?.full || 'do dia';
    success('Horários Replicados', `A grade de ${dayName} (${source.start_time} às ${source.end_time}) foi aplicada para os demais dias.`);
  };

  // --- SERVICE CATALOG METHODS ---
  const handleOpenNewService = () => {
    setEditingServiceId(null);
    setServiceName('');
    setServiceDuration(30);
    setServicePrice(35);
    setServiceCategory('Cabelo');
    setServiceDescription('');
    setServiceIsActive(true);
    setIsServiceModalOpen(true);
  };

  const handleOpenEditService = (item: AgendaServiceItem) => {
    setEditingServiceId(item.id);
    setServiceName(item.name);
    setServiceDuration(item.duration_minutes || 30);
    setServicePrice(item.price ?? 35);
    setServiceCategory(item.category || 'Cabelo');
    setServiceDescription(item.description || '');
    setServiceIsActive(item.is_active !== false);
    setIsServiceModalOpen(true);
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceName.trim()) {
      toastError('Nome obrigatório', 'Informe o nome do serviço.');
      return;
    }

    const serviceItem: AgendaServiceItem = {
      id: editingServiceId || `srv-${Date.now()}`,
      name: serviceName.trim(),
      duration_minutes: Number(serviceDuration) || 30,
      price: servicePrice === '' ? 0 : Number(servicePrice),
      category: serviceCategory.trim() || 'Geral',
      description: serviceDescription.trim() || undefined,
      is_active: serviceIsActive,
    };

    try {
      await StorageService.saveAgendaServiceItem(serviceItem);
      const currentServices = [...(settings.services || [])];
      const idx = currentServices.findIndex(s => s.id === serviceItem.id);
      if (idx >= 0) currentServices[idx] = serviceItem;
      else currentServices.push(serviceItem);
      
      setSettings(prev => ({ ...prev, services: currentServices }));
      setIsServiceModalOpen(false);
      success('Serviço Salvo', `"${serviceItem.name}" sincronizado com sucesso.`);
    } catch (err: any) {
      toastError('Erro ao salvar serviço', err.message);
    }
  };

  const handleDeleteService = async (id: string, name: string) => {
    if (!confirm(`Tem certeza que deseja remover o serviço "${name}"?`)) return;
    try {
      await StorageService.deleteAgendaServiceItem(id);
      const updated = (settings.services || []).filter(s => s.id !== id);
      setSettings(prev => ({ ...prev, services: updated }));
      success('Serviço Removido', `O serviço "${name}" foi excluído.`);
    } catch (err: any) {
      toastError('Erro ao excluir', err.message);
    }
  };

  const handleToggleServiceStatus = async (item: AgendaServiceItem) => {
    const updated: AgendaServiceItem = { ...item, is_active: !item.is_active };
    try {
      await StorageService.saveAgendaServiceItem(updated);
      const currentServices = [...(settings.services || [])];
      const idx = currentServices.findIndex(s => s.id === item.id);
      if (idx >= 0) currentServices[idx] = updated;
      setSettings(prev => ({ ...prev, services: currentServices }));
      info('Status Atualizado', `Serviço "${item.name}" agora está ${updated.is_active ? 'ATIVO' : 'INATIVO'}.`);
    } catch (err: any) {
      toastError('Erro ao atualizar', err.message);
    }
  };

  // --- APPOINTMENTS METHODS ---
  const handleSaveAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim() || !newClientPhone.trim()) {
      toastError('Dados incompletos', 'Informe o nome e WhatsApp do cliente.');
      return;
    }

    try {
      const duration = totalCalculatedDuration || 30;
      const price = newPrice === '' ? totalCalculatedPrice : Number(newPrice);
      const serviceNameCombined = combinedServiceName || 'Atendimento Geral';

      const [sh, sm] = newTime.split(':').map(Number);
      const startMin = (sh || 0) * 60 + (sm || 0);
      const endMin = startMin + duration;
      const endH = Math.floor(endMin / 60);
      const endM = endMin % 60;
      const endTimeStr = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
      const baseSlot = settings.slot_duration_minutes || 30;
      const slotsCount = Math.max(1, Math.ceil(duration / baseSlot));

      // Enforce at least 1 hour ahead for today
      const now = new Date();
      const todayFormatted = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const isToday = newDate === todayFormatted;
      const minAdvanceMinutes = now.getHours() * 60 + now.getMinutes() + 60; // 1 hour ahead

      if (isToday && startMin < minAdvanceMinutes) {
        const minH = Math.floor(minAdvanceMinutes / 60);
        const minM = minAdvanceMinutes % 60;
        const minFormatted = `${String(minH).padStart(2, '0')}:${String(minM).padStart(2, '0')}`;
        toastError(
          'Antecedência Mínima',
          `Para agendamentos no dia de hoje, escolha um horário com no mínimo 1 hora de antecedência da hora atual (a partir de ${minFormatted}).`
        );
        return;
      }

      // Conflict detection: verify if requested time collides with existing appointments
      const conflict = appointments.find((a) => {
        if (a.appointment_date !== newDate) return false;
        if (a.status === 'cancelled' || a.status === 'no_show') return false;
        const [ah, am] = a.appointment_time.split(':').map(Number);
        const aStart = (ah || 0) * 60 + (am || 0);
        const aDur = Number(a.duration_minutes) || 30;
        const aEnd = aStart + aDur;
        return startMin < aEnd && endMin > aStart;
      });

      if (conflict) {
        // Find next slot that can accommodate this exact duration
        const nextSlot = await StorageService.getNextAvailableSlot(newDate, newTime, duration);
        if (nextSlot) {
          toastError(
            'Horário Ocupado!',
            `O horário das ${newTime} já está ocupado por ${conflict.contact_name}. Próximo horário livre disponível para ${duration} min: ${nextSlot.displayFull}.`
          );
          setSuggestedSlot(nextSlot);
        } else {
          toastError('Agenda Lotada', `Não há outros horários com ${duration} min livres nesta data. Escolha outro dia.`);
        }
        return;
      }

      const newApt: Appointment = {
        id: `apt-${Date.now()}`,
        contact_name: newClientName.trim(),
        contact_phone: newClientPhone.replace(/\D/g, ''),
        service_name: serviceNameCombined,
        duration_minutes: duration,
        end_time: endTimeStr,
        slots_count: slotsCount,
        price,
        appointment_date: newDate,
        appointment_time: newTime,
        status: 'confirmed',
        notes: newNotes.trim() || undefined,
        created_at: new Date().toISOString(),
      };

      await StorageService.saveAppointment(newApt);
      await loadData();
      setIsAddModalOpen(false);
      success('Agendamento Confirmado', `Horário reservado para ${newApt.contact_name} em ${formatDate(newDate)} às ${newTime} (${duration} min - ${slotsCount} slots unidos).`);
    } catch (err: any) {
      toastError('Erro ao agendar', err.message);
    }
  };

  const handleUpdateStatus = async (aptId: string, newStatus: Appointment['status']) => {
    try {
      await StorageService.updateAppointmentStatus(aptId, newStatus);
      await loadData();
      success('Status Atualizado', `O agendamento agora está como ${
        newStatus === 'completed' ? 'Realizado' :
        newStatus === 'confirmed' ? 'Confirmado' :
        newStatus === 'cancelled' ? 'Cancelado' :
        newStatus === 'no_show' ? 'Não Compareceu' : 'Pendente'
      }.`);
    } catch (err: any) {
      toastError('Erro ao atualizar status', err.message);
    }
  };

  const handleDeleteAppointment = async (aptId: string) => {
    if (!confirm('Deseja realmente remover este agendamento?')) return;
    try {
      await StorageService.deleteAppointment(aptId);
      await loadData();
      success('Agendamento Excluído', 'O registro foi removido com sucesso.');
    } catch (err: any) {
      toastError('Erro ao excluir', err.message);
    }
  };

  // Drag and Drop Slot Reassignment
  const handleDragStart = (aptId: string) => {
    setDraggedAptId(aptId);
  };

  const handleDragOver = (e: React.DragEvent, timeSlot: string) => {
    e.preventDefault();
    setDragOverSlot(timeSlot);
  };

  const handleDrop = async (timeSlot: string) => {
    if (!draggedAptId) return;
    const targetApt = appointments.find(a => a.id === draggedAptId);
    if (!targetApt) return;

    try {
      const updated = { ...targetApt, appointment_time: timeSlot, appointment_date: selectedDate };
      await StorageService.saveAppointment(updated);
      await loadData();
      success('Horário Remarcado', `Agendamento de ${targetApt.contact_name} movido para ${timeSlot}.`);
    } catch (err: any) {
      toastError('Erro ao mover', err.message);
    } finally {
      setDraggedAptId(null);
      setDragOverSlot(null);
    }
  };

  // Generate Available Time Slots calculation
  const generateSlots = (dateString: string) => {
    const slots: string[] = [];
    const targetDate = new Date(`${dateString}T12:00:00`);
    const dayOfWeek = String(targetDate.getDay());

    const dayConfig = (settings.day_schedules && settings.day_schedules[dayOfWeek])
      ? settings.day_schedules[dayOfWeek]
      : {
          enabled: settings.business_days ? settings.business_days.includes(dayOfWeek) : true,
          start_time: settings.start_time || '08:00',
          end_time: settings.end_time || '19:00',
          has_break: Boolean(settings.break_start_time && settings.break_end_time),
          break_start_time: settings.break_start_time || '12:00',
          break_end_time: settings.break_end_time || '13:00',
        };

    if (!dayConfig.enabled) {
      return [];
    }

    const [startH, startM] = (dayConfig.start_time || settings.start_time || '08:00').split(':').map(Number);
    const [endH, endM] = (dayConfig.end_time || settings.end_time || '19:00').split(':').map(Number);
    const [breakStartH, breakStartM] = (dayConfig.break_start_time || '12:00').split(':').map(Number);
    const [breakEndH, breakEndM] = (dayConfig.break_end_time || '13:00').split(':').map(Number);

    const startTotal = startH * 60 + startM;
    const endTotal = endH * 60 + endM;
    const breakStartTotal = breakStartH * 60 + breakStartM;
    const breakEndTotal = breakEndH * 60 + breakEndM;
    const duration = settings.slot_duration_minutes || 30;
    const hasBreak = dayConfig.has_break !== false;

    let current = startTotal;
    while (current + duration <= endTotal) {
      const isLunch = hasBreak && current >= breakStartTotal && current < breakEndTotal;
      if (!isLunch) {
        const h = Math.floor(current / 60);
        const m = current % 60;
        slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
      }
      current += duration;
    }
    return slots;
  };

  // Filtered Appointments
  const filteredAppointments = useMemo(() => {
    return appointments.filter(apt => {
      const matchesDate = apt.appointment_date === selectedDate;
      const matchesStatus = filterStatus === 'all' || apt.status === filterStatus;
      const search = searchTerm.toLowerCase();
      const matchesSearch = 
        (apt.contact_name || '').toLowerCase().includes(search) ||
        (apt.contact_phone || '').includes(search) ||
        (apt.service_name || '').toLowerCase().includes(search);
      return matchesDate && matchesStatus && matchesSearch;
    });
  }, [appointments, selectedDate, filterStatus, searchTerm]);

  // Filtered Services in Catalog Tab
  const serviceCategories = useMemo(() => {
    const set = new Set<string>();
    (settings.services || []).forEach(s => s.category && set.add(s.category.trim()));
    return ['all', ...Array.from(set)];
  }, [settings.services]);

  const filteredServices = useMemo(() => {
    return (settings.services || []).filter(s => {
      const matchesCategory = selectedCategoryFilter === 'all' || s.category === selectedCategoryFilter;
      const matchesSearch = s.name.toLowerCase().includes(serviceSearchTerm.toLowerCase()) || 
        (s.description || '').toLowerCase().includes(serviceSearchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [settings.services, selectedCategoryFilter, serviceSearchTerm]);

  const slotsForSelectedDate = useMemo(() => generateSlots(selectedDate), [selectedDate, settings]);
  const simulatedSlots = useMemo(() => generateSlots(simDate), [simDate, settings]);

  // Unified schedule combining consecutive slots for multi-slot services
  const unifiedSchedule = useMemo(() => {
    const baseDuration = settings.slot_duration_minutes || 30;
    const result: Array<{
      id: string;
      startTime: string;
      endTime: string;
      durationMinutes: number;
      slotsCount: number;
      isBooked: boolean;
      appointment?: Appointment;
    }> = [];

    const processedTimes = new Set<string>();

    slotsForSelectedDate.forEach((timeSlot) => {
      if (processedTimes.has(timeSlot)) return;

      const [sh, sm] = timeSlot.split(':').map(Number);
      const slotStartMin = sh * 60 + sm;

      // Find appointment that STARTS at this slot
      const startingApt = filteredAppointments.find(
        (a) => a.appointment_time === timeSlot && a.status !== 'cancelled' && a.status !== 'no_show'
      );

      if (startingApt) {
        const dur = Number(startingApt.duration_minutes) || baseDuration;
        const slotEndMin = slotStartMin + dur;
        const endH = Math.floor(slotEndMin / 60);
        const endM = slotEndMin % 60;
        const endTimeStr = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
        const count = Math.max(1, Math.ceil(dur / baseDuration));

        // Mark all base slots covered by this appointment as processed/unified
        slotsForSelectedDate.forEach((bs) => {
          const [bh, bm] = bs.split(':').map(Number);
          const bMin = bh * 60 + bm;
          if (bMin >= slotStartMin && bMin < slotEndMin) {
            processedTimes.add(bs);
          }
        });

        result.push({
          id: startingApt.id,
          startTime: timeSlot,
          endTime: endTimeStr,
          durationMinutes: dur,
          slotsCount: count,
          isBooked: true,
          appointment: startingApt,
        });
      } else {
        // Check if covered by an ongoing appointment that started earlier
        const ongoingApt = filteredAppointments.find((a) => {
          if (a.status === 'cancelled' || a.status === 'no_show') return false;
          const [ah, am] = a.appointment_time.split(':').map(Number);
          const aStartMin = ah * 60 + am;
          const aDur = Number(a.duration_minutes) || baseDuration;
          return slotStartMin >= aStartMin && slotStartMin < aStartMin + aDur;
        });

        if (ongoingApt) {
          processedTimes.add(timeSlot);
          return;
        }

        // Single free slot
        const slotEndMin = slotStartMin + baseDuration;
        const endH = Math.floor(slotEndMin / 60);
        const endM = slotEndMin % 60;
        const endTimeStr = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

        result.push({
          id: `free-${timeSlot}`,
          startTime: timeSlot,
          endTime: endTimeStr,
          durationMinutes: baseDuration,
          slotsCount: 1,
          isBooked: false,
        });
        processedTimes.add(timeSlot);
      }
    });

    return result;
  }, [slotsForSelectedDate, filteredAppointments, settings.slot_duration_minutes]);

  // Split schedule into past vs upcoming slots
  // Regra: horários anteriores são EXCLUSIVAMENTE os horários do dia de HOJE que já passaram da hora atual!
  // Datas e horas depois da data e hora atual mostram normalmente!
  const { pastSlots, upcomingSlots } = useMemo(() => {
    const now = new Date();
    const currentMin = now.getHours() * 60 + now.getMinutes();
    const past: typeof unifiedSchedule = [];
    const upcoming: typeof unifiedSchedule = [];

    unifiedSchedule.forEach((slot) => {
      const [sh, sm] = slot.startTime.split(':').map(Number);
      const startMin = (sh || 0) * 60 + (sm || 0);
      const endMin = startMin + slot.durationMinutes;

      // Horários anteriores são APENAS os horários do dia de HOJE que já terminaram
      const isPastOnToday = selectedDate === todayStr && endMin <= currentMin;

      // Keep active appointment if in progress
      if (slot.appointment?.status === 'in_progress') {
        upcoming.push(slot);
      } else if (isPastOnToday) {
        past.push(slot);
      } else {
        // Datas futuras (selectedDate > todayStr) e horários atuais/futuros de hoje mostram normalmente!
        upcoming.push(slot);
      }
    });

    return { pastSlots: past, upcomingSlots: upcoming };
  }, [unifiedSchedule, selectedDate, todayStr]);

  const visibleSchedule = useMemo(() => {
    // Se a data selecionada não for o dia de hoje (ex: datas futuras ou passadas), mostra tudo normalmente!
    if (selectedDate !== todayStr) return unifiedSchedule;
    if (showHistory) return unifiedSchedule;
    return upcomingSlots;
  }, [showHistory, unifiedSchedule, upcomingSlots, selectedDate, todayStr]);

  const { pastAppointmentsCount, visibleAppointmentsList } = useMemo(() => {
    const now = new Date();
    const currentMin = now.getHours() * 60 + now.getMinutes();

    let pastCount = 0;
    const list: Appointment[] = [];

    filteredAppointments.forEach((apt) => {
      const [sh, sm] = (apt.appointment_time || '09:00').split(':').map(Number);
      const dur = Number(apt.duration_minutes) || 30;
      const endMin = (sh || 0) * 60 + (sm || 0) + dur;
      const isPastOnToday = selectedDate === todayStr && endMin <= currentMin;

      if (apt.status === 'in_progress') {
        list.push(apt);
      } else if (isPastOnToday) {
        pastCount++;
        if (showHistory) list.push(apt);
      } else {
        list.push(apt);
      }
    });

    return { pastAppointmentsCount: pastCount, visibleAppointmentsList: list };
  }, [filteredAppointments, showHistory, selectedDate, todayStr]);

  const weekDaysLabels = [
    { id: '0', label: 'Dom', full: 'Domingo' },
    { id: '1', label: 'Seg', full: 'Segunda-feira' },
    { id: '2', label: 'Ter', full: 'Terça-feira' },
    { id: '3', label: 'Qua', full: 'Quarta-feira' },
    { id: '4', label: 'Qui', full: 'Quinta-feira' },
    { id: '5', label: 'Sex', full: 'Sexta-feira' },
    { id: '6', label: 'Sáb', full: 'Sábado' },
  ];

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-dark-900/60 p-4 rounded-3xl border border-white/5 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 p-0.5 shadow-lg shadow-brand-500/20 flex items-center justify-center">
            <div className="w-full h-full bg-dark-950 rounded-[14px] flex items-center justify-center text-brand-400">
              <CalendarIcon className="w-6 h-6" />
            </div>
          </div>
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              Central de Agendamentos & Serviços
              <Badge variant="brand" className="text-[10px] py-0 px-2">Sincronizado</Badge>
            </h1>
            <p className="text-xs text-slate-400">
              Agenda do WhatsApp, catálogo de serviços, expediente comercial e vagas
            </p>
          </div>
        </div>

        {/* Action Button depending on tab */}
        <div className="flex items-center gap-2">
          {activeTab === 'appointments' && (
            <Button
              variant="brand"
              size="sm"
              onClick={() => setIsAddModalOpen(true)}
              leftIcon={<Plus className="w-4 h-4" />}
              className="text-xs shadow-lg shadow-brand-500/20"
            >
              Novo Agendamento
            </Button>
          )}

          {activeTab === 'services' && (
            <Button
              variant="brand"
              size="sm"
              onClick={handleOpenNewService}
              leftIcon={<Plus className="w-4 h-4" />}
              className="text-xs shadow-lg shadow-brand-500/20"
            >
              Novo Serviço
            </Button>
          )}

          {activeTab === 'hours' && (
            <Button
              variant="brand"
              size="sm"
              onClick={handleSaveHoursSettings}
              disabled={isSavingSettings}
              leftIcon={<Save className="w-4 h-4" />}
              className="text-xs bg-emerald-600 hover:bg-emerald-500"
            >
              {isSavingSettings ? 'Salvando...' : 'Salvar Expediente'}
            </Button>
          )}
        </div>
      </div>

      {/* Main Tabs Navigation Bar */}
      <div className="flex items-center gap-1.5 p-1.5 bg-dark-900/80 rounded-2xl border border-white/5 overflow-x-auto">
        <button
          onClick={() => setActiveTab('appointments')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
            activeTab === 'appointments'
              ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <CalendarIcon className="w-4 h-4" />
          <span>Agenda & Compromissos</span>
          <Badge variant="neutral" className="text-[10px] ml-1 bg-dark-950/60">{appointments.length}</Badge>
        </button>

        <button
          onClick={() => setActiveTab('services')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
            activeTab === 'services'
              ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Scissors className="w-4 h-4" />
          <span>Catálogo de Serviços</span>
          <Badge variant="neutral" className="text-[10px] ml-1 bg-dark-950/60">{(settings.services || []).length}</Badge>
        </button>

        <button
          onClick={() => setActiveTab('hours')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
            activeTab === 'hours'
              ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Horários & Expediente</span>
        </button>

        <button
          onClick={() => setActiveTab('simulator')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
            activeTab === 'simulator'
              ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Simulador de Vagas</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: AGENDA & COMPROMISSOS */}
      {/* ========================================================================= */}
      {activeTab === 'appointments' && (
        <div className="space-y-4 animate-in fade-in">
          {/* Calendar Toolbar (Date Selector, Quick Date Buttons, Filters, Search) */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 bg-dark-900/50 p-3.5 rounded-2xl border border-white/5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5 w-full lg:w-auto">
              <QuickDateButtons
                selectedDate={selectedDate}
                onSelectDate={(d) => setSelectedDate(d)}
                showCustomInput={true}
              />

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-dark-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-brand-500 w-full sm:w-auto"
              >
                <option value="all">Todos os Status</option>
                <option value="confirmed">Confirmados</option>
                <option value="completed">Realizados / Concluídos</option>
                <option value="no_show">Não Compareceu</option>
                <option value="cancelled">Cancelados</option>
              </select>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Buscar cliente ou serviço..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-dark-950 border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <div className="flex items-center gap-1 bg-dark-950 p-1 rounded-xl border border-white/10">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-brand-500 text-white' : 'text-slate-400 hover:text-white'}`}
                  title="Visão em Grade de Horários"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-brand-500 text-white' : 'text-slate-400 hover:text-white'}`}
                  title="Visão em Lista"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* History Toggle Bar ONLY for TODAY if there are past slots */}
          {selectedDate === todayStr && pastSlots.length > 0 && (
            <div className="flex items-center justify-between p-3 rounded-2xl bg-dark-900/60 border border-white/5 shadow-sm">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <History className="w-4 h-4 text-brand-400" />
                <span>
                  {showHistory
                    ? `Exibindo histórico de hoje (${pastSlots.length} horários anteriores)`
                    : `${pastSlots.length} horário(s) anterior(es) de hoje oculto(s)`}
                </span>
              </div>
              <Button
                variant={showHistory ? 'outline' : 'brand'}
                size="sm"
                onClick={() => setShowHistory(!showHistory)}
                className="text-xs h-8 flex items-center gap-1.5"
              >
                <History className="w-3.5 h-3.5" />
                <span>{showHistory ? 'Ocultar Histórico' : `Ver Horários Anteriores (${pastSlots.length})`}</span>
              </Button>
            </div>
          )}

          {/* Appointments Grid or List View */}
          {slotsForSelectedDate.length === 0 ? (
            <Card className="p-12 text-center space-y-2 bg-dark-900/40 border-white/5">
              <Clock className="w-10 h-10 text-slate-600 mx-auto" />
              <h3 className="text-sm font-bold text-white">Dia Sem Expediente</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Este dia não está marcado como dia útil nas configurações de expediente comercial.
              </p>
            </Card>
          ) : viewMode === 'grid' ? (
            visibleSchedule.length === 0 ? (
              <Card className="p-8 text-center space-y-3 bg-dark-900/40 border-white/5 rounded-3xl">
                <Clock className="w-8 h-8 text-slate-600 mx-auto" />
                <h3 className="text-sm font-bold text-white">Sem horários futuros restantes para hoje</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Os horários anteriores foram ocultados para manter sua visão limpa. Clique abaixo para ver o histórico.
                </p>
                {pastSlots.length > 0 && (
                  <Button
                    variant="brand"
                    size="sm"
                    onClick={() => setShowHistory(true)}
                    className="text-xs mx-auto"
                    leftIcon={<History className="w-3.5 h-3.5" />}
                  >
                    Ver Histórico ({pastSlots.length} horários)
                  </Button>
                )}
              </Card>
            ) : (
              <div className="flex flex-col space-y-3">
                {visibleSchedule.map((slot) => {
                  const timeSlot = slot.startTime;
                  const aptForSlot = slot.appointment;
                  const isOver = dragOverSlot === timeSlot;
                  const isMultiSlot = slot.slotsCount > 1;
                  const totalDuration = aptForSlot?.duration_minutes || slot.durationMinutes;

                return (
                  <div
                    key={slot.id}
                    onDragOver={(e) => handleDragOver(e, timeSlot)}
                    onDrop={() => handleDrop(timeSlot)}
                    className={`w-full p-4 rounded-2xl border transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                      isOver
                        ? 'border-brand-400 bg-brand-950/40 ring-2 ring-brand-500/30'
                        : aptForSlot
                        ? aptForSlot.status === 'completed'
                          ? 'bg-emerald-950/20 border-emerald-500/30 shadow-sm'
                          : aptForSlot.status === 'cancelled'
                          ? 'bg-rose-950/20 border-rose-500/20 opacity-70'
                          : aptForSlot.status === 'no_show'
                          ? 'bg-amber-950/20 border-amber-500/30'
                          : isMultiSlot
                          ? 'bg-dark-900/95 border-brand-500/50 shadow-md shadow-brand-500/10 ring-1 ring-brand-500/20'
                          : 'bg-dark-900/90 border-white/10 shadow-sm'
                        : 'bg-dark-900/40 border-white/5 hover:border-white/15'
                    }`}
                  >
                    {/* Left: Time & Total Duration Always Visible */}
                    <div className="flex items-center gap-3.5 min-w-[260px]">
                      <div className="p-2.5 rounded-xl bg-dark-950 border border-white/10 flex flex-col items-center justify-center min-w-[100px] text-center">
                        <span className="text-xs font-mono font-black text-brand-300 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-brand-400" />
                          {isMultiSlot || aptForSlot?.end_time ? `${slot.startTime} às ${slot.endTime || aptForSlot?.end_time}` : slot.startTime}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono mt-0.5">
                          {aptForSlot ? 'Horário Marcado' : 'Horário Livre'}
                        </span>
                      </div>

                      {/* Always show Total Service Time */}
                      <div className="flex flex-col gap-1">
                        {aptForSlot ? (
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-brand-500/20 text-brand-300 border border-brand-500/30 flex items-center gap-1.5 shadow-sm whitespace-nowrap">
                              <Clock className="w-3.5 h-3.5 text-brand-400" />
                              <span>Tempo Total: <strong>{totalDuration} min</strong></span>
                            </span>
                            {isMultiSlot && (
                              <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20 whitespace-nowrap">
                                {slot.slotsCount} slots unidos
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse" />
                            Slot de {slot.durationMinutes} min disponível
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Middle: Client, Service, Price & Status */}
                    <div className="flex-1 min-w-0">
                      {aptForSlot ? (
                        <div
                          draggable
                          onDragStart={() => handleDragStart(aptForSlot.id)}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-grab active:cursor-grabbing p-2 rounded-xl hover:bg-white/[0.02]"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <GripVertical className="w-4 h-4 text-slate-500 flex-shrink-0" />
                              <h4 className="text-sm font-bold text-white">
                                {aptForSlot.contact_name}
                              </h4>
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                                aptForSlot.status === 'completed' ? 'bg-emerald-500/20 text-emerald-300' :
                                aptForSlot.status === 'cancelled' ? 'bg-rose-500/20 text-rose-300' :
                                aptForSlot.status === 'no_show' ? 'bg-amber-500/20 text-amber-300' :
                                'bg-brand-500/20 text-brand-300'
                              }`}>
                                {aptForSlot.status === 'completed' ? 'Realizado' :
                                 aptForSlot.status === 'cancelled' ? 'Cancelado' :
                                 aptForSlot.status === 'no_show' ? 'Faltou' : 'Confirmado'}
                              </span>
                            </div>

                            <p className="text-xs text-slate-300 flex items-center gap-2 pl-6 flex-wrap">
                              <span className="font-semibold text-brand-300">✂️ {aptForSlot.service_name}</span>
                              {aptForSlot.price ? (
                                <span className="text-amber-400 font-bold">
                                  (R$ {Number(aptForSlot.price).toFixed(2).replace('.', ',')})
                                </span>
                              ) : null}
                              <span>•</span>
                              <span className="text-slate-400 font-mono">
                                📱 {formatPhone(aptForSlot.contact_phone)}
                              </span>
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between py-1 text-slate-500 text-xs">
                          <span>Nenhum agendamento marcado para esta faixa de horário.</span>
                        </div>
                      )}
                    </div>

                    {/* Right: Quick Action Buttons */}
                    <div className="flex items-center justify-end gap-1.5 pt-2 md:pt-0 border-t md:border-t-0 border-white/5">
                      {aptForSlot ? (
                        <>
                          {aptForSlot.status !== 'completed' && (
                            <button
                              onClick={() => handleUpdateStatus(aptForSlot.id, 'completed')}
                              className="px-3 py-1.5 rounded-xl bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                              title="Marcar como Concluído / Realizado"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Concluir</span>
                            </button>
                          )}
                          {aptForSlot.status !== 'no_show' && aptForSlot.status !== 'completed' && (
                            <button
                              onClick={() => handleUpdateStatus(aptForSlot.id, 'no_show')}
                              className="px-3 py-1.5 rounded-xl bg-amber-950/70 hover:bg-amber-900 border border-amber-500/30 text-amber-400 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                              title="Marcar como Não Compareceu"
                            >
                              <AlertTriangle className="w-3.5 h-3.5" />
                              <span>Faltou</span>
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteAppointment(aptForSlot.id)}
                            className="p-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 text-rose-400 transition-colors"
                            title="Remover Agendamento"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => {
                            setNewDate(selectedDate);
                            setNewTime(timeSlot);
                            setIsAddModalOpen(true);
                          }}
                          className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 flex items-center gap-1.5 transition-all"
                        >
                          <Plus className="w-3.5 h-3.5 text-brand-400" />
                          <span>Agendar neste Horário</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )) : (
            <Card className="bg-dark-900/70 border-white/5 overflow-hidden rounded-3xl">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-dark-950 text-[11px] text-slate-400 font-semibold border-b border-white/5 uppercase">
                  <tr>
                    <th className="p-4">Horário</th>
                    <th className="p-4">Tempo Total</th>
                    <th className="p-4">Cliente</th>
                    <th className="p-4">WhatsApp</th>
                    <th className="p-4">Serviço</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {visibleAppointmentsList.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-500">
                        {pastAppointmentsCount > 0 && !showHistory ? (
                          <div className="space-y-2">
                            <p className="text-slate-400">Os {pastAppointmentsCount} agendamento(s) anterior(es) de hoje estão oculto(s).</p>
                            <Button
                              variant="brand"
                              size="sm"
                              onClick={() => setShowHistory(true)}
                              className="text-xs mx-auto"
                              leftIcon={<History className="w-3.5 h-3.5" />}
                            >
                              Ver Histórico ({pastAppointmentsCount} anteriores)
                            </Button>
                          </div>
                        ) : (
                          'Nenhum agendamento encontrado para a data e filtros selecionados.'
                        )}
                      </td>
                    </tr>
                  ) : (
                    visibleAppointmentsList.map(apt => (
                      <tr key={apt.id} className="hover:bg-white/[0.02]">
                        <td className="p-4 font-mono font-bold text-brand-400">
                          {apt.appointment_time}{apt.end_time ? ` às ${apt.end_time}` : ''}
                        </td>
                        <td className="p-4 font-mono">
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-brand-500/20 text-brand-300 border border-brand-500/30">
                            ⏱️ {apt.duration_minutes || 30} min
                          </span>
                        </td>
                        <td className="p-4 font-bold text-white">{apt.contact_name}</td>
                        <td className="p-4 font-mono text-slate-400">{formatPhone(apt.contact_phone)}</td>
                        <td className="p-4">
                          <span className="font-semibold text-slate-200">{apt.service_name}</span>
                          {apt.price && <span className="text-emerald-400 font-mono ml-2">R$ {Number(apt.price).toFixed(2).replace('.', ',')}</span>}
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            apt.status === 'completed' ? 'bg-emerald-500/20 text-emerald-300' :
                            apt.status === 'cancelled' ? 'bg-rose-500/20 text-rose-300' :
                            apt.status === 'no_show' ? 'bg-amber-500/20 text-amber-300' :
                            'bg-brand-500/20 text-brand-300'
                          }`}>
                            {apt.status === 'completed' ? 'Realizado' :
                             apt.status === 'cancelled' ? 'Cancelado' :
                             apt.status === 'no_show' ? 'Não Compareceu' : 'Confirmado'}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {apt.status !== 'completed' && (
                              <button
                                onClick={() => handleUpdateStatus(apt.id, 'completed')}
                                className="p-1.5 rounded-lg bg-emerald-950 text-emerald-400 hover:bg-emerald-900"
                                title="Concluir Atendimento"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteAppointment(apt.id)}
                              className="p-1.5 rounded-lg bg-rose-950/40 text-rose-400 hover:bg-rose-900"
                              title="Excluir"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </Card>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: CATÁLOGO DE SERVIÇOS */}
      {/* ========================================================================= */}
      {activeTab === 'services' && (
        <div className="space-y-4 animate-in fade-in">
          {/* Catalog Toolbar */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-dark-900/50 p-3.5 rounded-2xl border border-white/5">
            <div className="relative flex-1 w-full md:max-w-md">
              <Search className="w-3.5 h-3.5 absolute left-3.5 top-3 text-slate-500" />
              <input
                type="text"
                placeholder="Buscar serviços por nome ou descrição..."
                value={serviceSearchTerm}
                onChange={(e) => setServiceSearchTerm(e.target.value)}
                className="w-full bg-dark-950 border border-white/10 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <select
                value={selectedCategoryFilter}
                onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                className="bg-dark-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-brand-500"
              >
                <option value="all">Todas as Categorias</option>
                {serviceCategories.filter(c => c !== 'all').map(c => (
                  <option key={c} value={c}>Categoria: {c}</option>
                ))}
              </select>

              <Button
                variant="brand"
                size="sm"
                onClick={handleOpenNewService}
                leftIcon={<Plus className="w-4 h-4" />}
                className="text-xs"
              >
                Cadastrar Serviço
              </Button>
            </div>
          </div>

          {/* Services Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredServices.map((service) => (
              <Card
                key={service.id}
                className={`p-5 rounded-3xl border transition-all duration-200 flex flex-col justify-between ${
                  service.is_active !== false
                    ? 'bg-dark-900/80 border-white/10 hover:border-brand-500/40'
                    : 'bg-dark-950/40 border-white/5 opacity-60'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-dark-950 text-slate-400 border border-white/5">
                        {service.category || 'Geral'}
                      </span>
                      <h3 className="text-sm font-bold text-white mt-1.5">{service.name}</h3>
                    </div>

                    <button
                      onClick={() => handleToggleServiceStatus(service)}
                      className={`p-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors ${
                        service.is_active !== false
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/20'
                          : 'bg-dark-950 text-slate-500 border border-white/5'
                      }`}
                      title="Ativar/Desativar Serviço"
                    >
                      {service.is_active !== false ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                    </button>
                  </div>

                  {service.description && (
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {service.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs">
                    <span className="text-slate-400 font-mono flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-brand-400" />
                      {service.duration_minutes || 30} minutos
                    </span>

                    <span className="text-emerald-400 font-mono font-bold text-sm">
                      R$ {Number(service.price || 0).toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-1.5 pt-4 mt-4 border-t border-white/5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenEditService(service)}
                    leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                    className="text-xs h-8"
                  >
                    Editar
                  </Button>

                  <button
                    onClick={() => handleDeleteService(service.id, service.name)}
                    className="p-2 rounded-xl bg-rose-950/30 text-rose-400 hover:bg-rose-900/50 transition-colors"
                    title="Excluir Serviço"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ========================================================================= */}
      {/* TAB 3: HORÁRIOS & EXPEDIENTE */}
      {/* ========================================================================= */}
      {activeTab === 'hours' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Top Banner Alert / Info */}
          <div className="p-4 rounded-3xl bg-gradient-to-r from-brand-950/60 via-dark-900 to-brand-950/40 border border-brand-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-brand-500/10 border border-brand-500/30 flex items-center justify-center text-brand-400">
                <CalendarDays className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  Configuração de Expediente por Dia da Semana
                  <Badge variant="brand" className="text-[10px] py-0">Multidias Ativo</Badge>
                </h3>
                <p className="text-xs text-slate-300">
                  Configure abertura, fechamento e intervalos de forma independente para cada dia (ex: Sábado com horário reduzido).
                </p>
              </div>
            </div>
            <Button
              variant="brand"
              size="sm"
              onClick={handleSaveHoursSettings}
              disabled={isSavingSettings}
              leftIcon={<Save className="w-4 h-4" />}
              className="bg-emerald-600 hover:bg-emerald-500 font-bold shadow-glow-brand whitespace-nowrap"
            >
              {isSavingSettings ? 'Salvando...' : 'Salvar Alterações de Expediente'}
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Column: Day-by-Day Cards + Advanced Options */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-brand-400" />
                  Grade de Expediente Diário ({weekDaysLabels.length} Dias)
                </h3>
                <span className="text-[11px] text-slate-400">
                  {settings.business_days.length} de 7 dias com atendimento ativo
                </span>
              </div>

              {/* Day Cards List */}
              <div className="space-y-3">
                {weekDaysLabels.map((day) => {
                  const dayConfig = getDaySchedule(day.id);
                  const isEnabled = dayConfig.enabled;
                  const [sh, sm] = (dayConfig.start_time || '08:00').split(':').map(Number);
                  const [eh, em] = (dayConfig.end_time || '19:00').split(':').map(Number);
                  const totalDayMinutes = Math.max(0, (eh * 60 + em) - (sh * 60 + sm));
                  const hoursCount = (totalDayMinutes / 60).toFixed(1).replace('.0', '');

                  return (
                    <Card
                      key={day.id}
                      className={`p-4.5 rounded-3xl border transition-all ${
                        isEnabled
                          ? 'bg-dark-900/80 border-white/10 hover:border-brand-500/30'
                          : 'bg-dark-950/40 border-white/5 opacity-70'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/5">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => handleUpdateDaySchedule(day.id, { enabled: !isEnabled })}
                            className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                              isEnabled
                                ? 'bg-emerald-500 text-dark-950 font-black shadow-sm'
                                : 'bg-dark-900 border border-white/20 text-transparent hover:border-white/40'
                            }`}
                          >
                            ✓
                          </button>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-white">{day.full}</span>
                              <Badge
                                variant={isEnabled ? 'success' : 'neutral'}
                                className="text-[10px] py-0 px-2 font-mono"
                              >
                                {isEnabled ? 'Aberto' : 'Fechado (Folga)'}
                              </Badge>
                            </div>
                            {isEnabled ? (
                              <span className="text-[11px] text-slate-400 font-mono">
                                {hoursCount}h de atendimento • {dayConfig.start_time} às {dayConfig.end_time}
                                {dayConfig.has_break && dayConfig.break_start_time ? ` (Almoço ${dayConfig.break_start_time} às ${dayConfig.break_end_time})` : ' (Sem intervalo)'}
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-500">Sem agendamentos no WhatsApp neste dia</span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center">
                          {isEnabled && (
                            <button
                              type="button"
                              onClick={() => handleApplyToAllDays(day.id)}
                              className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-[11px] font-semibold flex items-center gap-1.5 transition-colors"
                              title="Replicar estes horários para os outros dias"
                            >
                              <Copy className="w-3 h-3 text-brand-400" />
                              <span>Copiar p/ Todos</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleUpdateDaySchedule(day.id, { enabled: !isEnabled })}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                              isEnabled
                                ? 'bg-rose-950/40 text-rose-300 hover:bg-rose-900/60 border border-rose-500/20'
                                : 'bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/60 border border-emerald-500/20'
                            }`}
                          >
                            {isEnabled ? 'Desativar' : 'Ativar Dia'}
                          </button>
                        </div>
                      </div>

                      {isEnabled ? (
                        <div className="pt-3.5 space-y-3.5">
                          {/* Shift Inputs */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                                Início do Atendimento
                              </label>
                              <Input
                                type="time"
                                value={dayConfig.start_time || '08:00'}
                                onChange={(e) => handleUpdateDaySchedule(day.id, { start_time: e.target.value })}
                                className="h-9 text-xs"
                              />
                            </div>

                            <div>
                              <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                                Fim do Atendimento
                              </label>
                              <Input
                                type="time"
                                value={dayConfig.end_time || '19:00'}
                                onChange={(e) => handleUpdateDaySchedule(day.id, { end_time: e.target.value })}
                                className="h-9 text-xs"
                              />
                            </div>
                          </div>

                          {/* Break Toggle & Inputs */}
                          <div className="p-3 rounded-2xl bg-dark-950/60 border border-white/5 space-y-2.5">
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={dayConfig.has_break !== false}
                                onChange={(e) => handleUpdateDaySchedule(day.id, { has_break: e.target.checked })}
                                className="w-4 h-4 rounded text-brand-500 focus:ring-brand-500 bg-dark-900 border-white/20"
                              />
                              <span className="text-xs font-semibold text-slate-200">
                                Pausa / Intervalo de Almoço neste dia
                              </span>
                            </label>

                            {dayConfig.has_break !== false && (
                              <div className="grid grid-cols-2 gap-3 pt-1.5 animate-in fade-in">
                                <div>
                                  <label className="text-[10px] text-slate-400 block mb-1">Início da Pausa</label>
                                  <Input
                                    type="time"
                                    value={dayConfig.break_start_time || '12:00'}
                                    onChange={(e) => handleUpdateDaySchedule(day.id, { break_start_time: e.target.value })}
                                    className="h-8 text-xs bg-dark-900"
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] text-slate-400 block mb-1">Fim da Pausa</label>
                                  <Input
                                    type="time"
                                    value={dayConfig.break_end_time || '13:00'}
                                    onChange={(e) => handleUpdateDaySchedule(day.id, { break_end_time: e.target.value })}
                                    className="h-8 text-xs bg-dark-900"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="pt-2 text-center py-2 text-xs text-slate-500 font-mono">
                          Dia desativado para agendamentos.
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>

              {/* NEW SECTION: Regras Avançadas de Agendamento */}
              <Card className="p-6 rounded-3xl bg-dark-900/80 border-white/10 space-y-5">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-brand-400" />
                    Regras Avançadas de Agendamento & Automação
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Controle antecedência mínima, limite futuro, cancelamentos e lembretes automáticos no WhatsApp
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Antecedência Mínima */}
                  <div className="p-3.5 rounded-2xl bg-dark-950/60 border border-white/5 space-y-1.5">
                    <label className="text-xs font-semibold text-slate-200 block">
                      Antecedência Mínima para Agendar
                    </label>
                    <select
                      value={settings.min_advance_booking_minutes ?? 30}
                      onChange={(e) => setSettings({ ...settings, min_advance_booking_minutes: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl bg-dark-900 border border-white/10 text-white text-xs focus:outline-none focus:border-brand-500"
                    >
                      <option value={0}>Sem limite (permite agendar na hora)</option>
                      <option value={15}>15 minutos de antecedência</option>
                      <option value={30}>30 minutos de antecedência (Recomendado)</option>
                      <option value={60}>1 hora de antecedência</option>
                      <option value={120}>2 horas de antecedência</option>
                      <option value={240}>4 horas de antecedência</option>
                    </select>
                    <span className="text-[10px] text-slate-400 block">
                      Evita agendamentos de última hora sem aviso prévio.
                    </span>
                  </div>

                  {/* Antecedência Máxima */}
                  <div className="p-3.5 rounded-2xl bg-dark-950/60 border border-white/5 space-y-1.5">
                    <label className="text-xs font-semibold text-slate-200 block">
                      Antecedência Máxima (Janela Futura)
                    </label>
                    <select
                      value={settings.max_advance_booking_days ?? 30}
                      onChange={(e) => setSettings({ ...settings, max_advance_booking_days: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl bg-dark-900 border border-white/10 text-white text-xs focus:outline-none focus:border-brand-500"
                    >
                      <option value={7}>Até 7 dias no futuro (1 semana)</option>
                      <option value={15}>Até 15 dias no futuro</option>
                      <option value={30}>Até 30 dias no futuro (1 mês - Recomendado)</option>
                      <option value={60}>Até 60 dias no futuro (2 meses)</option>
                      <option value={90}>Até 90 dias no futuro (3 meses)</option>
                    </select>
                    <span className="text-[10px] text-slate-400 block">
                      Define até qual data futura o bot libera agendamentos.
                    </span>
                  </div>

                  {/* Tolerância de Cancelamento */}
                  <div className="p-3.5 rounded-2xl bg-dark-950/60 border border-white/5 space-y-1.5">
                    <label className="text-xs font-semibold text-slate-200 block">
                      Prazo Limite para Cancelamento pelo WhatsApp
                    </label>
                    <select
                      value={settings.cancellation_notice_hours ?? 2}
                      onChange={(e) => setSettings({ ...settings, cancellation_notice_hours: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl bg-dark-900 border border-white/10 text-white text-xs focus:outline-none focus:border-brand-500"
                    >
                      <option value={1}>Até 1 hora antes do atendimento</option>
                      <option value={2}>Até 2 horas antes (Recomendado)</option>
                      <option value={4}>Até 4 horas antes</option>
                      <option value={24}>Até 24 horas antes (1 dia)</option>
                      <option value={0}>Bloquear cancelamento automático via WhatsApp</option>
                    </select>
                    <span className="text-[10px] text-slate-400 block">
                      Clientes só podem desmarcar dentro deste prazo.
                    </span>
                  </div>

                  {/* Lembrete Automático */}
                  <div className="p-3.5 rounded-2xl bg-dark-950/60 border border-white/5 space-y-1.5">
                    <label className="text-xs font-semibold text-slate-200 block">
                      Lembrete Automático no WhatsApp
                    </label>
                    <select
                      value={settings.auto_reminder_hours ?? 2}
                      onChange={(e) => setSettings({ ...settings, auto_reminder_hours: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl bg-dark-900 border border-white/10 text-white text-xs focus:outline-none focus:border-brand-500"
                    >
                      <option value={0}>Desativado</option>
                      <option value={1}>Disparar 1 hora antes</option>
                      <option value={2}>Disparar 2 horas antes (Recomendado)</option>
                      <option value={4}>Disparar 4 horas antes</option>
                      <option value={24}>Disparar 1 dia antes (24h)</option>
                    </select>
                    <span className="text-[10px] text-slate-400 block">
                      Notifica o cliente antes do corte para confirmação.
                    </span>
                  </div>

                  {/* Cadeiras Simultâneas */}
                  <div className="p-3.5 rounded-2xl bg-dark-950/60 border border-white/5 space-y-1.5">
                    <label className="text-xs font-semibold text-slate-200 block">
                      Capacidade Simultânea (Cadeiras / Barbeiros)
                    </label>
                    <select
                      value={settings.simultaneous_barbers ?? 1}
                      onChange={(e) => setSettings({ ...settings, simultaneous_barbers: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl bg-dark-900 border border-white/10 text-white text-xs focus:outline-none focus:border-brand-500"
                    >
                      <option value={1}>1 Cadeira (Atendimento Individual)</option>
                      <option value={2}>2 Cadeiras em Paralelo (2 Clientes)</option>
                      <option value={3}>3 Cadeiras em Paralelo (3 Clientes)</option>
                      <option value={4}>4 Cadeiras em Paralelo (4 Clientes)</option>
                    </select>
                    <span className="text-[10px] text-slate-400 block">
                      Permite múltiplos agendamentos no mesmo horário.
                    </span>
                  </div>

                  {/* Fila de Espera */}
                  <div className="p-3.5 rounded-2xl bg-dark-950/60 border border-white/5 flex flex-col justify-between">
                    <div>
                      <label className="text-xs font-semibold text-slate-200 block mb-1">
                        Fila de Espera / Encaixe Automático
                      </label>
                      <span className="text-[10px] text-slate-400 block leading-relaxed">
                        Se o dia estiver lotado, o bot pergunta se o cliente deseja entrar na fila de espera.
                      </span>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer mt-2">
                      <input
                        type="checkbox"
                        checked={settings.allow_waiting_list !== false}
                        onChange={(e) => setSettings({ ...settings, allow_waiting_list: e.target.checked })}
                        className="w-4 h-4 rounded text-brand-500 focus:ring-brand-500 bg-dark-900 border-white/20"
                      />
                      <span className="text-xs font-bold text-white">Ativar Lista de Espera</span>
                    </label>
                  </div>
                </div>

                {/* Parâmetros de Intervalo e Buffer */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-white/5">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Duração Base das Vagas (Minutos)
                    </label>
                    <select
                      value={settings.slot_duration_minutes ?? 30}
                      onChange={(e) => setSettings({ ...settings, slot_duration_minutes: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl bg-dark-950 border border-white/10 text-white text-xs focus:outline-none focus:border-brand-500"
                    >
                      <option value={15}>15 minutos por vaga</option>
                      <option value={20}>20 minutos por vaga</option>
                      <option value={30}>30 minutos por vaga (Padrão)</option>
                      <option value={45}>45 minutos por vaga</option>
                      <option value={60}>60 minutos por vaga</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Tempo de Tolerância / Higienização entre Clientes (Buffer)
                    </label>
                    <select
                      value={settings.buffer_minutes ?? 5}
                      onChange={(e) => setSettings({ ...settings, buffer_minutes: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl bg-dark-950 border border-white/10 text-white text-xs focus:outline-none focus:border-brand-500"
                    >
                      <option value={0}>Sem intervalo (0 min)</option>
                      <option value={5}>5 minutos de intervalo</option>
                      <option value={10}>10 minutos de intervalo</option>
                      <option value={15}>15 minutos de intervalo</option>
                    </select>
                  </div>
                </div>

                {/* Mensagem Fora de Expediente */}
                <div className="pt-3 border-t border-white/5">
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Mensagem Automática Fora do Horário de Expediente
                  </label>
                  <Textarea
                    rows={3}
                    value={settings.out_of_hours_message || ''}
                    onChange={(e) => setSettings({ ...settings, out_of_hours_message: e.target.value })}
                    placeholder="Olá! Nosso horário de atendimento é de Segunda a Sábado. Deixe sua mensagem que responderemos assim que abrirmos!"
                    className="text-xs"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Tags disponíveis: {'{{empresa}}'}, {'{{horarios_semana}}'}, {'{{suporte_telefone}}'}
                  </span>
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    variant="brand"
                    onClick={handleSaveHoursSettings}
                    disabled={isSavingSettings}
                    leftIcon={<Save className="w-4 h-4" />}
                    className="bg-emerald-600 hover:bg-emerald-500 font-bold shadow-glow-brand"
                  >
                    {isSavingSettings ? 'Salvando...' : 'Salvar Todas as Configurações'}
                  </Button>
                </div>
              </Card>
            </div>

            {/* Sidebar Column: Live Operational Summary */}
            <div className="space-y-4">
              <Card className="p-5 rounded-3xl bg-dark-900/80 border-white/10 space-y-4 sticky top-4">
                <div className="flex items-center justify-between pb-3 border-b border-white/5">
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-cyan-400" />
                    Resumo Semanal
                  </h4>
                  <Badge variant="brand" className="text-[10px] py-0">Tempo Real</Badge>
                </div>

                {/* Detailed Day List */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Horário de Cada Dia
                  </span>
                  <div className="space-y-1.5 font-mono text-[11px]">
                    {weekDaysLabels.map((d) => {
                      const cfg = getDaySchedule(d.id);
                      return (
                        <div
                          key={d.id}
                          className={`flex items-center justify-between p-2 rounded-xl transition-colors ${
                            cfg.enabled
                              ? 'bg-dark-950/60 text-slate-200 border border-white/5'
                              : 'bg-dark-950/20 text-slate-600 border border-transparent'
                          }`}
                        >
                          <span className="font-bold">{d.full.substring(0, 3)}:</span>
                          {cfg.enabled ? (
                            <span className="text-emerald-400">
                              {cfg.start_time} - {cfg.end_time}
                            </span>
                          ) : (
                            <span className="text-slate-500">Fechado</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Additional KPI Summary */}
                <div className="pt-3 border-t border-white/5 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">Capacidade Cadeiras:</span>
                    <span className="font-bold text-white">{settings.simultaneous_barbers || 1} cadeira(s)</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">Antecedência Mínima:</span>
                    <span className="font-bold text-white">{settings.min_advance_booking_minutes ? `${settings.min_advance_booking_minutes} min` : 'Livre'}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">Cancelamento:</span>
                    <span className="font-bold text-white">{settings.cancellation_notice_hours ? `Até ${settings.cancellation_notice_hours}h antes` : 'Bloqueado'}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">Lembrete WhatsApp:</span>
                    <span className="font-bold text-white">{settings.auto_reminder_hours ? `${settings.auto_reminder_hours}h antes` : 'Desativado'}</span>
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => setActiveTab('simulator')}
                  >
                    <Sparkles className="w-3.5 h-3.5 mr-1.5 text-brand-400" />
                    Testar no Simulador
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: SIMULADOR DE VAGAS */}
      {/* ========================================================================= */}
      {activeTab === 'simulator' && (
        <div className="space-y-4 animate-in fade-in">
          <Card className="p-6 rounded-3xl bg-dark-900/80 border-white/10 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-brand-400" />
                  Simulador de Horários em Tempo Real
                </h3>
                <p className="text-xs text-slate-400">
                  Teste e veja exatamente como o bot WhatsApp calculará os horários para cada data
                </p>
              </div>

              <input
                type="date"
                value={simDate}
                onChange={(e) => setSimDate(e.target.value)}
                className="bg-dark-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>

            <div className="pt-3 border-t border-white/5">
              <span className="text-xs text-slate-400 block mb-3">
                Grade de horários gerada ({simulatedSlots.length} horários disponíveis):
              </span>

              {simulatedSlots.length === 0 ? (
                <div className="p-6 text-center bg-dark-950 rounded-2xl border border-white/5 text-xs text-slate-500">
                  Data sem atendimento comercial conforme as regras de expediente.
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {simulatedSlots.map(slot => (
                    <span
                      key={slot}
                      className="px-3 py-1.5 rounded-xl bg-dark-950 border border-brand-500/20 text-brand-300 font-mono text-xs font-bold shadow-sm"
                    >
                      {slot}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* MODAL: Novo Agendamento Manual */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Novo Agendamento"
        subtitle="Reserve um horário diretamente na agenda"
        maxWidth="md"
      >
        <form onSubmit={handleSaveAppointment} className="space-y-4 pt-2">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Nome do Cliente *</label>
            <Input
              type="text"
              placeholder="Ex: Carlos Santos"
              value={newClientName}
              onChange={(e) => setNewClientName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">WhatsApp do Cliente *</label>
            <Input
              type="text"
              placeholder="Ex: 81 99613-8924"
              value={newClientPhone}
              onChange={(e) => setNewClientPhone(e.target.value)}
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Selecione os Serviços * (Você pode marcar múltiplos serviços)
              </label>
              <span className="text-[11px] font-mono text-brand-300 font-bold">
                {selectedServicesList.length} selecionado(s)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 rounded-xl bg-dark-950 border border-white/10">
              {(settings.services || []).map((s) => {
                const isSelected = selectedServiceIds.includes(s.id);
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleToggleSelectService(s.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all flex items-start justify-between gap-2 ${
                      isSelected
                        ? 'bg-brand-500/20 border-brand-500/60 text-white shadow-sm ring-1 ring-brand-500/30'
                        : 'bg-dark-900/60 border-white/5 text-slate-400 hover:border-white/15'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold block text-white">{s.name}</span>
                      <span className="text-[10px] text-slate-400 block font-mono">
                        ⏱️ {s.duration_minutes || 30} min • R$ {Number(s.price || 0).toFixed(2).replace('.', ',')}
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

            {/* Total Duration and Price Summary Banner */}
            <div className="mt-2.5 p-3 rounded-xl bg-gradient-to-r from-brand-950/50 via-dark-900 to-brand-950/50 border border-brand-500/30 flex items-center justify-between text-xs">
              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Serviços Selecionados:</span>
                <span className="font-semibold text-white line-clamp-1">{combinedServiceName}</span>
              </div>
              <div className="text-right space-y-0.5 min-w-[120px]">
                <span className="text-brand-300 font-mono font-bold block">
                  ⏱️ Tempo Total: {totalCalculatedDuration} min
                </span>
                <span className="text-emerald-400 font-mono font-bold block">
                  Valor Total: R$ {totalCalculatedPrice.toFixed(2).replace('.', ',')}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Date Selection Buttons in Modal */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 block">Atalhos de Data:</label>
              {newDate === todayStr && (
                <span className="text-[10px] text-amber-400 font-bold flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Horários com +1h de antecedência
                </span>
              )}
            </div>
            <QuickDateButtons
              selectedDate={newDate}
              onSelectDate={(d) => {
                setNewDate(d);
                setSuggestedSlot(null);
              }}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Data Selecionada *</label>
              <Input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-300 block">Horário *</label>
                {newDate === todayStr && (
                  <span className="text-[10px] text-amber-400 font-bold">(Mínimo 1h à frente)</span>
                )}
              </div>
              <Input
                type="time"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Observações</label>
            <Textarea
              rows={2}
              placeholder="Observações do atendimento..."
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
            />
          </div>

          {suggestedSlot && (
            <div className="p-3.5 rounded-2xl bg-amber-950/50 border border-amber-500/40 text-xs text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in shadow-lg">
              <div className="space-y-1">
                <span className="font-bold flex items-center gap-1.5 text-amber-400">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  Horário ocupado! Sugestão disponível:
                </span>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Próximo horário livre com tempo suficiente ({totalCalculatedDuration} min):{' '}
                  <strong className="text-amber-300 font-bold underline decoration-amber-500/50">{suggestedSlot.displayFull}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (suggestedSlot.date) {
                    setNewDate(suggestedSlot.date);
                  }
                  setNewTime(suggestedSlot.time);
                  setSuggestedSlot(null);
                }}
                className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-dark-950 font-black text-xs whitespace-nowrap active:scale-95 transition-all shadow-md flex items-center justify-center gap-1.5 self-start sm:self-center"
              >
                Usar {suggestedSlot.displayShort}
              </button>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-white/5">
            <Button variant="outline" type="button" onClick={() => setIsAddModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="brand" type="submit">
              Confirmar Agendamento
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Novo / Editar Serviço do Catálogo */}
      <Modal
        isOpen={isServiceModalOpen}
        onClose={() => setIsServiceModalOpen(false)}
        title={editingServiceId ? 'Editar Serviço' : 'Novo Serviço no Catálogo'}
        subtitle="Configure os detalhes, duração e valores disponíveis no WhatsApp"
        maxWidth="md"
      >
        <form onSubmit={handleSaveService} className="space-y-4 pt-2">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Nome do Serviço *</label>
            <Input
              type="text"
              placeholder="Ex: Corte Degradê Navalhado"
              value={serviceName}
              onChange={(e) => setServiceName(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Preço (R$) *</label>
              <Input
                type="number"
                step="0.5"
                placeholder="35.00"
                value={servicePrice}
                onChange={(e) => setServicePrice(e.target.value === '' ? '' : Number(e.target.value))}
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Duração (Minutos) *</label>
              <Input
                type="number"
                placeholder="30"
                value={serviceDuration}
                onChange={(e) => setServiceDuration(Number(e.target.value))}
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Categoria</label>
            <Input
              type="text"
              placeholder="Ex: Cabelo, Barba, Combos, Estética"
              value={serviceCategory}
              onChange={(e) => setServiceCategory(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Descrição / Detalhes</label>
            <Textarea
              rows={2}
              placeholder="Descrição do serviço que pode ser enviada ao cliente..."
              value={serviceDescription}
              onChange={(e) => setServiceDescription(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="serviceIsActive"
              checked={serviceIsActive}
              onChange={(e) => setServiceIsActive(e.target.checked)}
              className="rounded bg-dark-950 border-white/10 text-brand-500 focus:ring-0"
            />
            <label htmlFor="serviceIsActive" className="text-xs text-slate-300 cursor-pointer">
              Serviço Ativo e Disponível para Agendamento no WhatsApp
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-white/5">
            <Button variant="outline" type="button" onClick={() => setIsServiceModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="brand" type="submit">
              {editingServiceId ? 'Salvar Alterações' : 'Cadastrar Serviço'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Botão Flutuante (FAB) de Novo Agendamento ao rolar a página */}
      {activeTab === 'appointments' && (
        <div
          className={`fixed bottom-6 right-6 z-40 transition-all duration-300 transform ${
            showFloatingButton
              ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto'
              : 'opacity-0 translate-y-8 scale-90 pointer-events-none'
          }`}
        >
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2.5 px-5 py-3 rounded-full bg-gradient-to-r from-brand-600 via-brand-500 to-emerald-500 text-white font-black text-xs shadow-2xl shadow-brand-500/40 border border-white/20 hover:scale-105 active:scale-95 transition-all group backdrop-blur-md"
            title="Novo Agendamento"
          >
            <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center group-hover:rotate-90 transition-transform duration-300">
              <Plus className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="tracking-wide uppercase font-extrabold drop-shadow-sm">
              Novo Agendamento
            </span>
          </button>
        </div>
      )}
    </div>
  );
};
