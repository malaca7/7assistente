import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Scissors, 
  Plus, 
  Search, 
  Filter, 
  Edit2, 
  Trash2, 
  Copy, 
  CheckCircle2, 
  AlertCircle, 
  Save, 
  Sparkles, 
  RefreshCw, 
  DollarSign, 
  Tag, 
  Calendar, 
  ChevronRight, 
  Layers, 
  Check, 
  Sliders, 
  Eye, 
  HelpCircle,
  Briefcase,
  ToggleLeft,
  ToggleRight,
  Info,
  CalendarCheck
} from 'lucide-react';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input, Textarea } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../contexts/ToastContext';
import { StorageService, getBackendUrl } from '../../lib/storage';
import { AgendaSettings, AgendaServiceItem } from '../../types';

export interface ServicesAndHoursPageProps {
  onNavigate?: (path: string) => void;
}

export const ServicesAndHoursPage: React.FC<ServicesAndHoursPageProps> = ({ onNavigate }) => {
  const { success, error: toastError, info, warning } = useToast();
  const [activeTab, setActiveTab] = useState<'services' | 'hours'>('services');
  const [settings, setSettings] = useState<AgendaSettings>({
    business_days: ['1', '2', '3', '4', '5', '6'],
    start_time: '08:00',
    end_time: '19:00',
    slot_duration_minutes: 30,
    break_start_time: '12:00',
    break_end_time: '13:00',
    buffer_minutes: 5,
    out_of_hours_message: 'Olá! Nosso horário de expediente é de Segunda a Sábado das 08:00 às 19:00. Deixe sua mensagem ou escolha um horário que responderemos com prioridade!',
    services: [],
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Service Modal State
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [serviceName, setServiceName] = useState('');
  const [serviceDuration, setServiceDuration] = useState(30);
  const [servicePrice, setServicePrice] = useState<number | ''>(35);
  const [serviceCategory, setServiceCategory] = useState('Cabelo');
  const [serviceDescription, setServiceDescription] = useState('');
  const [serviceActive, setServiceActive] = useState(true);

  // Delete Service Modal
  const [serviceToDelete, setServiceToDelete] = useState<AgendaServiceItem | null>(null);

  // Day simulation
  const [testSimDate, setTestSimDate] = useState(new Date().toISOString().split('T')[0]);
  const [simulatedSlots, setSimulatedSlots] = useState<string[]>([]);

  const loadSettingsData = async (silent = false) => {
    try {
      if (!silent) setIsLoading(true);
      const data = await StorageService.getAgendaSettings();
      setSettings(data);
    } catch (err) {
      console.error('Error loading services & hours settings:', err);
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSettingsData(false);
    const interval = setInterval(() => {
      loadSettingsData(true);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Update Simulated Slots when hours or date change
  useEffect(() => {
    const slots: string[] = [];
    const [startH, startM] = settings.start_time.split(':').map(Number);
    const [endH, endM] = settings.end_time.split(':').map(Number);
    const [breakStartH, breakStartM] = (settings.break_start_time || '12:00').split(':').map(Number);
    const [breakEndH, breakEndM] = (settings.break_end_time || '13:00').split(':').map(Number);

    let currentMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    const breakStart = breakStartH * 60 + breakStartM;
    const breakEnd = breakEndH * 60 + breakEndM;
    const slotDuration = Number(settings.slot_duration_minutes) || 30;

    // Check if testSimDate is a business day
    const simDayOfWeek = String(new Date(testSimDate + 'T12:00:00').getDay());
    const isBusinessDay = settings.business_days.includes(simDayOfWeek);

    if (isBusinessDay) {
      while (currentMinutes + slotDuration <= endMinutes) {
        if (!(currentMinutes >= breakStart && currentMinutes < breakEnd)) {
          const h = String(Math.floor(currentMinutes / 60)).padStart(2, '0');
          const m = String(currentMinutes % 60).padStart(2, '0');
          slots.push(`${h}:${m}`);
        }
        currentMinutes += slotDuration;
      }
    }

    setSimulatedSlots(slots);
  }, [settings, testSimDate]);

  // Open Add Service Modal
  const handleOpenAddService = () => {
    setEditingServiceId(null);
    setServiceName('');
    setServiceDuration(30);
    setServicePrice(35);
    setServiceCategory('Cabelo');
    setServiceDescription('');
    setServiceActive(true);
    setIsServiceModalOpen(true);
  };

  // Open Edit Service Modal
  const handleOpenEditService = (srv: AgendaServiceItem) => {
    setEditingServiceId(srv.id);
    setServiceName(srv.name);
    setServiceDuration(srv.duration_minutes || 30);
    setServicePrice(srv.price !== undefined ? srv.price : 0);
    setServiceCategory(srv.category || 'Cabelo');
    setServiceDescription(srv.description || '');
    setServiceActive(srv.active !== false);
    setIsServiceModalOpen(true);
  };

  // Duplicate Service
  const handleDuplicateService = async (srv: AgendaServiceItem) => {
    try {
      const duplicated: AgendaServiceItem = {
        ...srv,
        id: `srv-${Date.now()}`,
        name: `${srv.name} (Cópia)`,
      };
      const updated = await StorageService.saveAgendaServiceItem(duplicated);
      setSettings(updated);
      success('Serviço Duplicado', `Cópia criada: "${duplicated.name}".`);
    } catch (err: any) {
      toastError('Erro ao duplicar', err.message);
    }
  };

  // Save Service
  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceName.trim()) {
      toastError('Nome obrigatório', 'Informe o nome do serviço.');
      return;
    }

    const priceNum = Number(servicePrice) || 0;
    const srvItem: AgendaServiceItem = {
      id: editingServiceId || `srv-${Date.now()}`,
      name: serviceName.trim(),
      duration_minutes: Number(serviceDuration) || 30,
      price: priceNum,
      category: serviceCategory.trim() || 'Geral',
      description: serviceDescription.trim(),
      active: serviceActive,
    };

    try {
      const updated = await StorageService.saveAgendaServiceItem(srvItem);
      setSettings(updated);
      setIsServiceModalOpen(false);
      success(
        editingServiceId ? 'Serviço Atualizado' : 'Serviço Cadastrado',
        `"${srvItem.name}" salvo no banco de dados e sincronizado no WhatsApp.`
      );
    } catch (err: any) {
      toastError('Erro ao salvar serviço', err.message);
    }
  };

  // Toggle Service Active/Inactive
  const handleToggleServiceActive = async (srv: AgendaServiceItem) => {
    try {
      const updatedItem: AgendaServiceItem = { ...srv, active: srv.active === false ? true : false };
      const updated = await StorageService.saveAgendaServiceItem(updatedItem);
      setSettings(updated);
      info(
        updatedItem.active ? 'Serviço Ativado' : 'Serviço Desativado',
        `"${srv.name}" foi ${updatedItem.active ? 'ativado' : 'pausado'}.`
      );
    } catch (err: any) {
      toastError('Erro', err.message);
    }
  };

  // Delete Service
  const handleConfirmDeleteService = async () => {
    if (!serviceToDelete) return;
    try {
      const updated = await StorageService.deleteAgendaServiceItem(serviceToDelete.id);
      setSettings(updated);
      setServiceToDelete(null);
      success('Serviço Excluído', `"${serviceToDelete.name}" foi removido do catálogo.`);
    } catch (err: any) {
      toastError('Erro ao excluir', err.message);
    }
  };

  // Save Hours Settings
  const handleSaveHoursSettings = async () => {
    setIsSaving(true);
    try {
      const updated = await StorageService.updateAgendaSettings(settings);
      setSettings(updated);
      success('Expediente Gravado', 'Horários e regras de atendimento sincronizados no Supabase e WhatsApp.');
    } catch (err: any) {
      toastError('Erro ao gravar expediente', err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle Day
  const handleToggleDay = (dayKey: string) => {
    const currentDays = [...(settings.business_days || [])];
    const index = currentDays.indexOf(dayKey);
    if (index >= 0) {
      if (currentDays.length === 1) {
        warning('Atenção', 'Selecione pelo menos 1 dia útil de funcionamento.');
        return;
      }
      currentDays.splice(index, 1);
    } else {
      currentDays.push(dayKey);
    }
    setSettings(prev => ({ ...prev, business_days: currentDays }));
  };

  const daysOfWeek = [
    { key: '1', label: 'Segunda-feira', short: 'SEG' },
    { key: '2', label: 'Terça-feira', short: 'TER' },
    { key: '3', label: 'Quarta-feira', short: 'QUA' },
    { key: '4', label: 'Quinta-feira', short: 'QUI' },
    { key: '5', label: 'Sexta-feira', short: 'SEX' },
    { key: '6', label: 'Sábado', short: 'SÁB' },
    { key: '0', label: 'Domingo', short: 'DOM' },
  ];

  const categories = ['all', ...Array.from(new Set((settings.services || []).map(s => s.category || 'Geral')))];

  const filteredServices = (settings.services || []).filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || (s.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;
    if (selectedCategory === 'all') return true;
    return (s.category || 'Geral') === selectedCategory;
  });

  // Calculate Metrics
  const totalServices = settings.services?.length || 0;
  const activeServices = settings.services?.filter(s => s.active !== false).length || 0;
  const avgPrice = totalServices > 0 ? (settings.services?.reduce((acc, s) => acc + (s.price || 0), 0) || 0) / totalServices : 0;
  const avgDuration = totalServices > 0 ? (settings.services?.reduce((acc, s) => acc + (s.duration_minutes || 30), 0) || 0) / totalServices : 30;

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Top Header & Segmented Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-dark-900/60 p-4 rounded-3xl border border-white/5 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-cyan-500 p-0.5 shadow-lg shadow-brand-500/20 flex items-center justify-center">
            <div className="w-full h-full bg-dark-950 rounded-[14px] flex items-center justify-center text-brand-400">
              <Scissors className="w-6 h-6" />
            </div>
          </div>
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              Serviços & Expediente
              <Badge variant="brand" className="text-[10px] py-0 px-2">Banco de Dados Ativo</Badge>
            </h1>
            <p className="text-xs text-slate-400">
              Gerencie o catálogo de serviços, preços, dias de funcionamento e horários de atendimento do bot
            </p>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex bg-dark-950 p-1 rounded-2xl border border-white/10 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('services')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'services'
                ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Scissors className="w-3.5 h-3.5" />
            Catálogo de Serviços ({totalServices})
          </button>
          <button
            onClick={() => setActiveTab('hours')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'hours'
                ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Horários & Expediente
          </button>
        </div>
      </div>

      {/* KPI Metrics Summary Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <Card className="p-4 border-white/5 bg-dark-900/50 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Serviços Cadastrados</span>
            <Scissors className="w-4 h-4 text-brand-400" />
          </div>
          <p className="text-2xl font-bold text-white mt-1.5">{totalServices}</p>
          <span className="text-[10px] text-emerald-400 flex items-center gap-1 mt-1 font-mono">
            <CheckCircle2 className="w-3 h-3" /> {activeServices} disponíveis no bot
          </span>
        </Card>

        <Card className="p-4 border-white/5 bg-dark-900/50 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Ticket Médio</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-emerald-400 mt-1.5">R$ {avgPrice.toFixed(2).replace('.', ',')}</p>
          <span className="text-[10px] text-slate-400 mt-1 font-mono">Valor médio por atendimento</span>
        </Card>

        <Card className="p-4 border-white/5 bg-dark-900/50 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Duração Média</span>
            <Clock className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-2xl font-bold text-white mt-1.5">{Math.round(avgDuration)} min</p>
          <span className="text-[10px] text-slate-400 mt-1 font-mono">Tempo reservado por vaga</span>
        </Card>

        <Card className="p-4 border-white/5 bg-dark-900/50 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Expediente Semanal</span>
            <CalendarCheck className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-white mt-1.5">{settings.business_days?.length || 0} dias</p>
          <span className="text-[10px] text-amber-300/80 mt-1 font-mono">{settings.start_time} às {settings.end_time}</span>
        </Card>
      </div>

      {/* 1. TAB: SERVICES CATALOG */}
      {activeTab === 'services' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Search, Filter and Actions Toolbar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-dark-900/40 p-3.5 rounded-2xl border border-white/5">
            <div className="flex flex-1 items-center gap-2.5 w-full sm:w-auto">
              <div className="relative flex-1 sm:max-w-md">
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Pesquisar serviço por nome ou descrição..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-dark-950 border border-white/10 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              {/* Category Filter Chips */}
              <div className="hidden md:flex items-center gap-1.5 overflow-x-auto">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                      selectedCategory === cat
                        ? 'bg-brand-500/20 text-brand-300 border border-brand-500/40'
                        : 'bg-dark-950 text-slate-400 border border-white/5 hover:text-white'
                    }`}
                  >
                    {cat === 'all' ? 'Todas Categorias' : cat}
                  </button>
                ))}
              </div>
            </div>

            <Button
              variant="brand"
              onClick={handleOpenAddService}
              leftIcon={<Plus className="w-4 h-4" />}
              className="w-full sm:w-auto shadow-lg shadow-brand-500/20"
            >
              Novo Serviço / Consulta
            </Button>
          </div>

          {/* Services Grid */}
          {filteredServices.length === 0 ? (
            <Card className="p-12 text-center space-y-3 bg-dark-900/40 border-white/5">
              <Scissors className="w-12 h-12 text-slate-600 mx-auto" />
              <h3 className="text-sm font-bold text-white">Nenhum serviço encontrado</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Cadastre seus serviços e procedimentos com preços e durações para que o bot no WhatsApp ofereça o catálogo e agende automaticamente.
              </p>
              <Button variant="brand" size="sm" onClick={handleOpenAddService} className="mt-2">
                Cadastrar Primeiro Serviço
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredServices.map((srv) => {
                const isActive = srv.active !== false;
                return (
                  <Card
                    key={srv.id}
                    className={`p-5 rounded-3xl border transition-all duration-200 relative overflow-hidden group ${
                      isActive
                        ? 'bg-dark-900/80 border-white/10 hover:border-brand-500/40 hover:shadow-xl hover:shadow-brand-500/5'
                        : 'bg-dark-950/60 border-white/5 opacity-60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-lg bg-brand-500/10 text-brand-300 border border-brand-500/20 text-[10px] font-bold uppercase tracking-wider">
                            {srv.category || 'Geral'}
                          </span>
                          {!isActive && (
                            <span className="px-2 py-0.5 rounded-lg bg-slate-800 text-slate-400 border border-white/5 text-[10px] font-bold">
                              Pausado
                            </span>
                          )}
                        </div>
                        <h3 className="text-base font-bold text-white group-hover:text-brand-300 transition-colors">
                          {srv.name}
                        </h3>
                      </div>

                      {/* Toggle Active Button */}
                      <button
                        onClick={() => handleToggleServiceActive(srv)}
                        title={isActive ? 'Desativar Serviço' : 'Ativar Serviço'}
                        className="text-slate-400 hover:text-white transition-colors"
                      >
                        {isActive ? (
                          <ToggleRight className="w-6 h-6 text-emerald-400" />
                        ) : (
                          <ToggleLeft className="w-6 h-6 text-slate-600" />
                        )}
                      </button>
                    </div>

                    <p className="text-xs text-slate-400 line-clamp-2 mt-2 leading-relaxed min-h-[36px]">
                      {srv.description || 'Sem descrição cadastrada.'}
                    </p>

                    <div className="flex items-center justify-between pt-4 mt-4 border-t border-white/5">
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Investimento</span>
                        <p className="text-lg font-bold text-emerald-400">
                          {srv.price && srv.price > 0
                            ? `R$ ${Number(srv.price).toFixed(2).replace('.', ',')}`
                            : 'Gratuito / Sob Consulta'}
                        </p>
                      </div>

                      <div className="text-right space-y-0.5">
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Duração</span>
                        <p className="text-xs font-bold text-slate-200 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-cyan-400" />
                          {srv.duration_minutes || 30} minutos
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-end gap-1.5 pt-3 mt-3 border-t border-white/5">
                      <button
                        onClick={() => handleDuplicateService(srv)}
                        className="p-1.5 rounded-lg bg-dark-950 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors text-xs flex items-center gap-1"
                        title="Duplicar Serviço"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleOpenEditService(srv)}
                        className="p-1.5 rounded-lg bg-dark-950 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors text-xs flex items-center gap-1"
                        title="Editar Serviço"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span className="text-[11px] font-semibold">Editar</span>
                      </button>
                      <button
                        onClick={() => setServiceToDelete(srv)}
                        className="p-1.5 rounded-lg bg-rose-950/30 text-rose-300 hover:bg-rose-900/50 transition-colors text-xs"
                        title="Excluir Serviço"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 2. TAB: BUSINESS HOURS & SCHEDULING RULES */}
      {activeTab === 'hours' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Rules & Hours Form */}
            <div className="lg:col-span-8 space-y-6">
              {/* Working Days Selector */}
              <Card className="p-5 bg-dark-900/70 border-white/5 rounded-3xl space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-brand-400" />
                    Dias de Atendimento e Funcionamento
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Selecione quais dias da semana sua empresa atende para agendamento no WhatsApp
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                  {daysOfWeek.map((day) => {
                    const isSelected = settings.business_days.includes(day.key);
                    return (
                      <button
                        key={day.key}
                        type="button"
                        onClick={() => handleToggleDay(day.key)}
                        className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-1 ${
                          isSelected
                            ? 'bg-brand-500/20 border-brand-500/40 text-white shadow-md shadow-brand-500/10'
                            : 'bg-dark-950 border-white/5 text-slate-500 hover:text-slate-300 hover:border-white/10'
                        }`}
                      >
                        <span className="text-xs font-bold tracking-wider">{day.short}</span>
                        <span className="text-[10px] text-slate-400">{isSelected ? 'Aberto' : 'Fechado'}</span>
                        {isSelected && <Check className="w-3 h-3 text-brand-400 mt-0.5" />}
                      </button>
                    );
                  })}
                </div>
              </Card>

              {/* Operating Hours & Intervals */}
              <Card className="p-5 bg-dark-900/70 border-white/5 rounded-3xl space-y-5">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Clock className="w-4 h-4 text-cyan-400" />
                    Horário de Expediente & Intervalos
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Configure os horários em que os clientes podem marcar compromissos
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                      Horário de Abertura / Início
                    </label>
                    <Input
                      type="time"
                      value={settings.start_time}
                      onChange={(e) => setSettings({ ...settings, start_time: e.target.value })}
                      className="bg-dark-950 text-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                      Horário de Encerramento / Fim
                    </label>
                    <Input
                      type="time"
                      value={settings.end_time}
                      onChange={(e) => setSettings({ ...settings, end_time: e.target.value })}
                      className="bg-dark-950 text-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                      Início da Pausa / Almoço
                    </label>
                    <Input
                      type="time"
                      value={settings.break_start_time || '12:00'}
                      onChange={(e) => setSettings({ ...settings, break_start_time: e.target.value })}
                      className="bg-dark-950 text-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                      Fim da Pausa / Almoço
                    </label>
                    <Input
                      type="time"
                      value={settings.break_end_time || '13:00'}
                      onChange={(e) => setSettings({ ...settings, break_end_time: e.target.value })}
                      className="bg-dark-950 text-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                      Duração Padrão dos Slots de Atendimento
                    </label>
                    <select
                      value={settings.slot_duration_minutes}
                      onChange={(e) => setSettings({ ...settings, slot_duration_minutes: Number(e.target.value) })}
                      className="w-full bg-dark-950 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                    >
                      <option value={15}>15 minutos</option>
                      <option value={20}>20 minutos</option>
                      <option value={30}>30 minutos (Padrão)</option>
                      <option value={45}>45 minutos</option>
                      <option value={60}>60 minutos (1 hora)</option>
                      <option value={90}>90 minutos (1h30)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                      Tolerância / Intervalo entre Atendimentos (Buffer)
                    </label>
                    <select
                      value={settings.buffer_minutes || 5}
                      onChange={(e) => setSettings({ ...settings, buffer_minutes: Number(e.target.value) })}
                      className="w-full bg-dark-950 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                    >
                      <option value={0}>Sem intervalo (0 min)</option>
                      <option value={5}>5 minutos de intervalo</option>
                      <option value={10}>10 minutos de intervalo</option>
                      <option value={15}>15 minutos de intervalo</option>
                    </select>
                  </div>
                </div>

                {/* Out of Hours Automated Message */}
                <div className="pt-3 border-t border-white/5 space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-amber-400" />
                    Mensagem de Aviso Fora do Expediente:
                  </label>
                  <Textarea
                    rows={2}
                    value={settings.out_of_hours_message || ''}
                    onChange={(e) => setSettings({ ...settings, out_of_hours_message: e.target.value })}
                    placeholder="Mensagem enviada automaticamente caso o cliente envie mensagem fora dos dias/horários de atendimento..."
                    className="bg-dark-950 text-xs"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    variant="brand"
                    onClick={handleSaveHoursSettings}
                    disabled={isSaving}
                    leftIcon={<Save className="w-4 h-4" />}
                    className="shadow-lg shadow-brand-500/20"
                  >
                    {isSaving ? 'Gravando no Banco...' : 'Salvar Regras de Expediente'}
                  </Button>
                </div>
              </Card>
            </div>

            {/* Right Column: Live Simulator of Generated WhatsApp Slots */}
            <div className="lg:col-span-4 space-y-4">
              <Card className="p-5 bg-dark-900/80 border-white/5 rounded-3xl space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      Simulador de Vagas
                    </h3>
                    <p className="text-[10px] text-slate-400">Como o bot gerará os botões de horários no WhatsApp</p>
                  </div>
                  <Badge variant="brand" className="text-[9px] py-0 px-1.5">Em Tempo Real</Badge>
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-slate-400 block mb-1">Data para Teste:</label>
                  <Input
                    type="date"
                    value={testSimDate}
                    onChange={(e) => setTestSimDate(e.target.value)}
                    className="bg-dark-950 text-xs"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Vagas Geradas ({simulatedSlots.length}):</span>
                    <span className="font-mono text-emerald-400">{simulatedSlots.length > 0 ? 'Disponível' : 'Fechado'}</span>
                  </div>

                  {simulatedSlots.length === 0 ? (
                    <div className="p-6 text-center text-xs text-rose-300 bg-rose-950/20 border border-rose-900/40 rounded-2xl">
                      Estabelecimento Fechado nesta data (Não há expediente no dia selecionado).
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-1.5 max-h-60 overflow-y-auto custom-scrollbar p-1">
                      {simulatedSlots.map((slot) => (
                        <div
                          key={slot}
                          className="p-2 rounded-xl bg-dark-950 border border-white/10 text-center font-mono text-xs text-brand-300 hover:border-brand-500/40 transition-colors shadow-sm"
                        >
                          🕒 {slot}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="p-3 rounded-2xl bg-dark-950/60 border border-white/5 text-[11px] text-slate-400 space-y-1">
                  <p className="font-bold text-slate-300 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Sincronização Ativa:
                  </p>
                  <p className="text-[10px]">
                    Qualquer alteração salva aqui é repassada imediatamente para os nós <code>services_catalog</code> e <code>schedule_contact</code> no WhatsApp.
                  </p>
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Criar / Editar Serviço */}
      <Modal
        isOpen={isServiceModalOpen}
        onClose={() => setIsServiceModalOpen(false)}
        title={editingServiceId ? 'Editar Serviço / Consulta' : 'Novo Serviço / Consulta'}
        subtitle="Informe os detalhes do atendimento para exibição no catálogo do WhatsApp"
        maxWidth="md"
      >
        <form onSubmit={handleSaveService} className="space-y-4 pt-2">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Nome do Serviço *</label>
            <Input
              type="text"
              placeholder="Ex: Corte Tradicional, Barboterapia, Consulta..."
              value={serviceName}
              onChange={(e) => setServiceName(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Preço em Reais (R$)</label>
              <Input
                type="number"
                step="0.50"
                min="0"
                placeholder="Ex: 35.00"
                value={servicePrice}
                onChange={(e) => setServicePrice(e.target.value === '' ? '' : Number(e.target.value))}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Duração (Minutos)</label>
              <select
                value={serviceDuration}
                onChange={(e) => setServiceDuration(Number(e.target.value))}
                className="w-full bg-dark-800 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
              >
                <option value={15}>15 minutos</option>
                <option value={20}>20 minutos</option>
                <option value={30}>30 minutos (Padrão)</option>
                <option value={45}>45 minutos</option>
                <option value={60}>60 minutos (1 hora)</option>
                <option value={90}>90 minutos (1h30)</option>
                <option value={120}>120 minutos (2 horas)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Categoria / Tag</label>
            <Input
              type="text"
              placeholder="Ex: Cabelo, Barba, Estética, Consulta, Combo..."
              value={serviceCategory}
              onChange={(e) => setServiceCategory(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Descrição do Serviço (Opcional)</label>
            <Textarea
              rows={2}
              placeholder="Breve resumo do que está incluso neste atendimento..."
              value={serviceDescription}
              onChange={(e) => setServiceDescription(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="serviceActiveCheck"
              checked={serviceActive}
              onChange={(e) => setServiceActive(e.target.checked)}
              className="w-4 h-4 rounded bg-dark-800 border-white/10 text-brand-500 focus:ring-0"
            />
            <label htmlFor="serviceActiveCheck" className="text-xs text-slate-300 cursor-pointer font-medium">
              Serviço ativo e disponível para escolha no WhatsApp
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-white/5 sticky bottom-0 bg-dark-900/95 backdrop-blur-md pb-1 -mx-5 sm:-mx-6 px-5 sm:px-6 z-10">
            <Button variant="outline" type="button" onClick={() => setIsServiceModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="brand" type="submit">
              {editingServiceId ? 'Salvar Alterações' : 'Cadastrar Serviço'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Confirmar Exclusão de Serviço */}
      <Modal
        isOpen={!!serviceToDelete}
        onClose={() => setServiceToDelete(null)}
        title="Excluir Serviço?"
        subtitle="Confirme a remoção deste item do catálogo"
        maxWidth="sm"
      >
        <div className="space-y-4 pt-2">
          <p className="text-xs text-slate-300">
            Tem certeza que deseja remover o serviço <strong className="text-white">"{serviceToDelete?.name}"</strong>? Ele deixará de ser ofertado no robô WhatsApp.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setServiceToDelete(null)}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={handleConfirmDeleteService}>
              Confirmar Exclusão
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
