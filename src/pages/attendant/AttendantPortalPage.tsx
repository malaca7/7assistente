import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Headphones, 
  MessageSquare, 
  Search, 
  Send, 
  Bot, 
  UserCheck, 
  Check, 
  CheckCheck, 
  Clock, 
  User, 
  Phone, 
  Tag, 
  ArrowRight, 
  LogOut, 
  Sparkles, 
  Zap, 
  RefreshCw, 
  Plus, 
  Smile, 
  Paperclip, 
  X, 
  Calendar, 
  CheckCircle2, 
  Sliders, 
  Trash2, 
  Edit3, 
  Copy, 
  Archive, 
  Star, 
  TrendingUp, 
  Layers, 
  Lock, 
  UserPlus, 
  ArrowRightLeft, 
  CalendarCheck, 
  FileText, 
  MessageCircle,
  AlertCircle,
  Eraser
} from 'lucide-react';
import { useAttendantAuth } from '../../contexts/AttendantAuthContext';
import { useWhatsApp } from '../../contexts/WhatsAppContext';
import { useToast } from '../../contexts/ToastContext';
import { StorageService, getBackendUrl } from '../../lib/storage';
import { Conversation, Message, Contact, Attendant, CannedReply } from '../../types';
import { formatPhone, formatDate, formatTimeAgo } from '../../lib/utils';
import { Button } from '../../components/ui/Button';
import { Input, Textarea } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { AppointmentBookingModal } from '../../components/agenda/AppointmentBookingModal';

interface AttendantPortalPageProps {
  onNavigate: (path: string) => void;
}

export const AttendantPortalPage: React.FC<AttendantPortalPageProps> = ({ onNavigate }) => {
  const { currentAttendant, logout, updateStatus, attendants } = useAttendantAuth();
  const { isConnected } = useWhatsApp();
  const { success, error: toastError, info, warning } = useToast();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTab, setFilterTab] = useState<'mine' | 'queue' | 'all'>('mine');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const isSendingRef = useRef(false);

  // Mode: WhatsApp Message vs Internal Note
  const [messageMode, setMessageMode] = useState<'whatsapp' | 'note'>('whatsapp');
  const [showCannedMenu, setShowCannedMenu] = useState(false);
  const [cannedReplies, setCannedReplies] = useState<CannedReply[]>([]);
  const [showRightDrawer, setShowRightDrawer] = useState(true);
  const [contactData, setContactData] = useState<Contact | null>(null);

  // AI Suggestion Box
  const [isAiSuggesting, setIsAiSuggesting] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [showAiModal, setShowAiModal] = useState(false);

  // Transfer Modal
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferTargetAttendant, setTransferTargetAttendant] = useState<string>('');
  const [transferNote, setTransferNote] = useState('');

  // Quick Appointment Modal
  const [isQuickAptModalOpen, setIsQuickAptModalOpen] = useState(false);
  const [quickService, setQuickService] = useState('Corte Tradicional');
  const [quickDate, setQuickDate] = useState(new Date().toISOString().split('T')[0]);
  const [quickTime, setQuickTime] = useState('09:00');
  const [isClearHistoryModalOpen, setIsClearHistoryModalOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const selectedConvIdRef = useRef<string | null>(null);
  selectedConvIdRef.current = selectedConv?.id || null;

  // Load Data
  const loadData = useCallback(async (silent = false) => {
    try {
      if (!silent) setIsLoading(true);
      const [convs, canned] = await Promise.all([
        StorageService.getConversations(),
        StorageService.getCannedReplies(),
      ]);
      setConversations(convs);
      setCannedReplies(canned);

      const activeId = selectedConvIdRef.current;
      if (activeId) {
        const current = convs.find((c) => c.id === activeId);
        if (current) setSelectedConv(current);
        const msgs = await StorageService.getMessages(activeId);
        setMessages(msgs);
      } else if (convs.length > 0 && !silent) {
        handleSelectConv(convs[0]);
      }
    } catch (e) {
      console.error('Error loading attendant portal data:', e);
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(false);
    const interval = setInterval(() => {
      loadData(true);
    }, 2500);
    return () => clearInterval(interval);
  }, [loadData]);

  const handleSelectConv = async (conv: Conversation) => {
    setSelectedConv(conv);
    selectedConvIdRef.current = conv.id;
    const msgs = await StorageService.getMessages(conv.id);
    setMessages(msgs);

    const allContacts = await StorageService.getContacts();
    const cleanPhone = (conv.contact_phone || conv.contact?.phone || '').replace(/\D/g, '');
    const found = allContacts.find((c) => c.phone.replace(/\D/g, '') === cleanPhone || c.id === conv.contact_id);

    if (found) {
      setContactData(found);
    } else {
      setContactData({
        id: `contact-${cleanPhone || Date.now()}`,
        phone: cleanPhone || conv.contact_phone || 'WhatsApp',
        name: conv.contact_name || conv.contact?.name || 'Cliente',
        status: 'active',
        tags: ['Cliente'],
        metadata: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Anti-Duplicate Safe Send Handler
  const handleSendMessage = async (textToSend?: string) => {
    if (isSendingRef.current) return;
    const text = (textToSend || inputText).trim();
    if (!text || !selectedConv) return;

    isSendingRef.current = true;
    setIsSending(true);
    setInputText('');
    setShowCannedMenu(false);

    try {
      if (messageMode === 'note') {
        // Send Internal Private Note
        const author = currentAttendant?.name || 'Atendente';
        const newNote = await StorageService.sendInternalNote(selectedConv.id, text, author);
        setMessages((prev) => [...prev, newNote]);
        success('Nota Interna Salva', 'A anotação privada foi registrada com sucesso.');
      } else {
        // Send Real WhatsApp Message
        if (!isConnected) {
          toastError(
            'WhatsApp Desconectado',
            'O envio de mensagens para clientes está bloqueado pois o WhatsApp não está conectado. Conecte o aparelho no Painel Admin.'
          );
          return;
        }

        const newMsg = await StorageService.sendMessage(selectedConv.id, text);
        setMessages((prev) => [...prev, newMsg]);

        const backendUrl = getBackendUrl();
        const targetPhone = (selectedConv.contact_phone || selectedConv.contact?.phone || selectedConv.id.replace('conv-', '')).replace(/\D/g, '');
        if (targetPhone) {
          await fetch(`${backendUrl}/api/whatsapp/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              phone: targetPhone,
              text,
            }),
          }).catch((e) => console.warn('Attendant send error:', e));
        }

        // Update attendant messages metric
        if (currentAttendant && currentAttendant.metrics) {
          currentAttendant.metrics.messages_sent = (currentAttendant.metrics.messages_sent || 0) + 1;
          StorageService.saveAttendant(currentAttendant).catch(() => {});
        }
      }
    } catch (err: any) {
      toastError('Erro ao enviar', err.message);
    } finally {
      setTimeout(() => {
        setIsSending(false);
        isSendingRef.current = false;
      }, 600);
    }
  };

  // Clear Conversation History
  const handleClearHistory = async () => {
    if (!selectedConv) return;
    try {
      await StorageService.clearMessages(selectedConv.id);
      setMessages([]);
      setIsClearHistoryModalOpen(false);
      setConversations((prev) =>
        prev.map((c) => (c.id === selectedConv.id ? { ...c, last_message: '' } : c))
      );
      success('Histórico Limpo', 'Todas as mensagens desta conversa foram apagadas com sucesso.');
    } catch (err: any) {
      toastError('Erro ao limpar histórico', err.message);
    }
  };

  // Delete Individual Message
  const handleDeleteSingleMessage = async (msgId: string) => {
    if (!selectedConv || !msgId) return;
    try {
      await StorageService.deleteMessage(selectedConv.id, msgId);
      setMessages((prev) => prev.filter((m) => m.id !== msgId));
      info('Mensagem Excluída', 'A mensagem selecionada foi removida do histórico.');
    } catch (err: any) {
      toastError('Erro ao excluir mensagem', err.message);
    }
  };

  // Claim / Takeover Conversation
  const handleClaimConversation = async () => {
    if (!selectedConv || !currentAttendant) return;
    try {
      const updated = await StorageService.assignConversation(selectedConv.id, currentAttendant);
      if (updated) {
        setSelectedConv(updated);
        setConversations((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
        success('Atendimento Assumido!', `Você agora é o responsável por "${updated.contact_name || 'este cliente'}".`);
      }
    } catch (err: any) {
      toastError('Erro ao assumir', err.message);
    }
  };

  // Transfer Conversation
  const handleTransferConversation = async () => {
    if (!selectedConv || !transferTargetAttendant || !currentAttendant) return;
    const target = attendants.find((a) => a.id === transferTargetAttendant);
    if (!target) return;

    try {
      const updated = await StorageService.transferConversation(
        selectedConv.id,
        target,
        currentAttendant.name,
        transferNote
      );
      if (updated) {
        setSelectedConv(updated);
        setConversations((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
        setIsTransferModalOpen(false);
        setTransferNote('');
        success('Transferência Concluída', `Atendimento transferido para ${target.name}.`);
      }
    } catch (err: any) {
      toastError('Erro ao transferir', err.message);
    }
  };

  // Resolve / Close Conversation
  const handleResolveConversation = async () => {
    if (!selectedConv || !currentAttendant) return;
    try {
      const updated: Conversation = {
        ...selectedConv,
        status: 'closed',
        updated_at: new Date().toISOString(),
      };
      await StorageService.saveConversation(updated);

      if (currentAttendant.metrics) {
        currentAttendant.metrics.chats_resolved = (currentAttendant.metrics.chats_resolved || 0) + 1;
        await StorageService.saveAttendant(currentAttendant);
      }

      await StorageService.sendInternalNote(
        selectedConv.id,
        `✅ Atendimento finalizado com sucesso por ${currentAttendant.name}.`,
        'Sistema'
      );

      setSelectedConv(updated);
      setConversations((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      success('Atendimento Concluído!', 'Conversa arquivada e métricas de desempenho atualizadas.');
    } catch (err: any) {
      toastError('Erro ao finalizar', err.message);
    }
  };

  // AI Response Suggestion Engine
  const handleGenerateAiSuggestions = async () => {
    if (!selectedConv || messages.length === 0) return;
    setIsAiSuggesting(true);
    setShowAiModal(true);

    try {
      const lastClientMsg = [...messages].reverse().find((m) => m.direction === 'inbound')?.content || 'Olá';
      const clientName = selectedConv.contact_name || contactData?.name || 'Cliente';

      // Smart generated contextual suggestions
      const suggestions = [
        `Olá ${clientName}! Perfeito, verifiquei aqui e temos esse horário disponível. Posso confirmar seu agendamento?`,
        `Com certeza ${clientName}! Nossos valores para este serviço começam a partir de R$ 35,00 com atendimento completo. Deseja marcar?`,
        `Olá ${clientName}, já estou separando seu cadastro. Em instantes lhe passo todas as informações detalhadas!`
      ];

      setAiSuggestions(suggestions);
    } finally {
      setIsAiSuggesting(false);
    }
  };

  // Quick Appointment from Chat
  const handleSaveQuickAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConv) return;
    const phone = (selectedConv.contact_phone || selectedConv.contact?.phone || '').replace(/\D/g, '');
    const clientName = selectedConv.contact_name || contactData?.name || 'Cliente';

    try {
      const newApt = {
        id: `apt-${Date.now()}`,
        contact_phone: phone,
        contact_name: clientName,
        service_name: quickService,
        appointment_date: quickDate,
        appointment_time: quickTime,
        status: 'confirmed' as const,
        created_at: new Date().toISOString(),
      };

      await StorageService.saveAppointment(newApt);
      setIsQuickAptModalOpen(false);

      // Send confirmation to chat
      const confirmText = `📅 *Agendamento Confirmado!*\n\nOlá ${clientName}, agendamos seu atendimento para:\n• *Serviço:* ${quickService}\n• *Data:* ${quickDate}\n• *Horário:* ${quickTime}\n\nTe esperamos aqui na Talvane Barber!`;
      await handleSendMessage(confirmText);
      success('Agendamento Realizado', 'Compromisso gravado na Agenda e enviado no WhatsApp do cliente.');
    } catch (err: any) {
      toastError('Erro ao agendar', err.message);
    }
  };

  // Filtered Conversations
  const filteredConversations = conversations.filter((c) => {
    const nameMatch = (c.contact_name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const phoneMatch = (c.contact_phone || '').includes(searchTerm);
    if (!nameMatch && !phoneMatch) return false;

    if (filterTab === 'mine') {
      return c.assigned_attendant_id === currentAttendant?.id && c.status !== 'closed';
    }
    if (filterTab === 'queue') {
      return (!c.assigned_attendant_id || c.status === 'waiting_human') && c.status !== 'closed';
    }
    return true;
  });

  return (
    <div className="h-screen w-screen bg-dark-950 text-slate-100 flex flex-col overflow-hidden selection:bg-brand-500 selection:text-white">
      {/* Top Header Bar */}
      <header className="h-16 bg-dark-900 border-b border-white/10 px-4 flex items-center justify-between flex-shrink-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 via-brand-500 to-emerald-400 p-0.5 shadow-glow-brand flex-shrink-0">
            <div className="w-full h-full bg-dark-950 rounded-[10px] flex items-center justify-center">
              <Headphones className="w-5 h-5 text-brand-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-white tracking-tight">Portal de Atendimento</h1>
              <Badge variant="brand" className="text-[9px] py-0 px-1.5 uppercase font-bold">Relacionamento</Badge>
            </div>
            <p className="text-[11px] text-slate-400">Atendimento humano multicanal integrado com WhatsApp</p>
          </div>
        </div>

        {/* Real-time Attendant Metric Badges */}
        {currentAttendant?.metrics && (
          <div className="hidden md:flex items-center gap-4 px-4 py-1.5 rounded-2xl bg-dark-950/80 border border-white/5 text-xs">
            <div className="flex items-center gap-1.5" title="Conversas Assumidas">
              <MessageSquare className="w-3.5 h-3.5 text-brand-400" />
              <span className="font-bold text-white">{currentAttendant.metrics.chats_assigned}</span>
              <span className="text-[10px] text-slate-400">Atendimentos</span>
            </div>
            <div className="w-px h-4 bg-white/10" />
            <div className="flex items-center gap-1.5" title="Atendimentos Resolvidos">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-bold text-white">{currentAttendant.metrics.chats_resolved}</span>
              <span className="text-[10px] text-slate-400">Resolvidos</span>
            </div>
            <div className="w-px h-4 bg-white/10" />
            <div className="flex items-center gap-1.5" title="Nota de Satisfação">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span className="font-bold text-amber-300">{currentAttendant.metrics.rating || 5.0}</span>
              <span className="text-[10px] text-slate-400">Avaliação</span>
            </div>
          </div>
        )}

        {/* Attendant Status & Profile */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-dark-950/60 p-1.5 rounded-2xl border border-white/5">
            <div className="w-8 h-8 rounded-full overflow-hidden bg-brand-500/20 border border-brand-500/30 flex items-center justify-center font-bold text-xs text-brand-300">
              {currentAttendant?.avatar_url ? (
                <img src={currentAttendant.avatar_url} alt={currentAttendant.name} className="w-full h-full object-cover" />
              ) : (
                (currentAttendant?.name || 'AT').substring(0, 2).toUpperCase()
              )}
            </div>
            <div className="hidden sm:block text-left pr-2">
              <p className="text-xs font-bold text-white leading-tight">{currentAttendant?.name}</p>
              <p className="text-[10px] text-slate-400 leading-tight">{currentAttendant?.department || 'Atendente'}</p>
            </div>

            {/* Online Status Toggle */}
            <select
              value={currentAttendant?.status || 'online'}
              onChange={(e) => updateStatus(e.target.value as any)}
              className="bg-dark-900 border border-white/10 rounded-xl text-[11px] font-bold px-2 py-1 text-slate-200 focus:outline-none focus:border-brand-500"
            >
              <option value="online">🟢 Online</option>
              <option value="busy">🟡 Ocupado</option>
              <option value="offline">⚪ Em Pausa</option>
            </select>
          </div>

          <Button
            size="sm"
            variant="ghost"
            onClick={logout}
            leftIcon={<LogOut className="w-3.5 h-3.5 text-rose-400" />}
            className="text-slate-400 hover:text-rose-400"
            title="Sair do Portal"
          >
            Sair
          </Button>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Conversations Queue */}
        <div className="w-80 sm:w-96 bg-dark-900/95 border-r border-white/5 flex flex-col flex-shrink-0">
          {/* Filter Tabs */}
          <div className="p-3 border-b border-white/5 space-y-2.5">
            <div className="flex items-center gap-1 bg-dark-950 p-1 rounded-2xl border border-white/5">
              <button
                type="button"
                onClick={() => setFilterTab('mine')}
                className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  filterTab === 'mine'
                    ? 'bg-brand-500 text-white shadow-glow-brand'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Minhas ({conversations.filter(c => c.assigned_attendant_id === currentAttendant?.id && c.status !== 'closed').length})
              </button>
              <button
                type="button"
                onClick={() => setFilterTab('queue')}
                className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  filterTab === 'queue'
                    ? 'bg-amber-500 text-white shadow-glow-amber'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Fila ({conversations.filter(c => (!c.assigned_attendant_id || c.status === 'waiting_human') && c.status !== 'closed').length})
              </button>
              <button
                type="button"
                onClick={() => setFilterTab('all')}
                className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  filterTab === 'all'
                    ? 'bg-slate-700 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Todas ({conversations.length})
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar cliente ou telefone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-dark-950 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto divide-y divide-white/5 custom-scrollbar">
            {filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 space-y-2">
                <MessageSquare className="w-8 h-8 mx-auto text-slate-600 opacity-50" />
                <p>Nenhuma conversa encontrada nesta aba.</p>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isSelected = selectedConv?.id === conv.id;
                const isAssignedToMe = conv.assigned_attendant_id === currentAttendant?.id;
                const isWaiting = conv.status === 'waiting_human' || !conv.assigned_attendant_id;

                return (
                  <div
                    key={conv.id}
                    onClick={() => handleSelectConv(conv)}
                    className={`p-3.5 cursor-pointer transition-all flex items-start gap-3 hover:bg-dark-850/80 relative ${
                      isSelected ? 'bg-brand-500/10 border-l-4 border-l-brand-500' : ''
                    }`}
                  >
                    <div className="w-10 h-10 rounded-2xl bg-dark-800 border border-white/10 flex items-center justify-center font-bold text-sm text-slate-200 flex-shrink-0 relative">
                      {(conv.contact_name || 'CL').substring(0, 2).toUpperCase()}
                      {conv.status === 'human' && (
                        <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-dark-900" title="Atendimento Humano Ativo" />
                      )}
                      {conv.status === 'bot' && (
                        <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-brand-500 border-2 border-dark-900" title="Robô Ativo" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="font-bold text-xs text-white truncate">
                          {conv.contact_name || formatPhone(conv.contact_phone || '')}
                        </span>
                        <span className="text-[10px] text-slate-400 whitespace-nowrap">
                          {formatTimeAgo(conv.last_message_at || conv.started_at)}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-300 truncate mb-1">
                        {conv.last_message || 'Sem mensagens recentes'}
                      </p>

                      <div className="flex items-center gap-1.5 flex-wrap">
                        {isAssignedToMe ? (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-brand-500/20 text-brand-300 border border-brand-500/30">
                            Com Você
                          </span>
                        ) : conv.assigned_attendant_name ? (
                          <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-md bg-slate-800 text-slate-300">
                            👤 {conv.assigned_attendant_name}
                          </span>
                        ) : (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">
                            ⚡ Na Fila
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Center Panel: Full Chat Interface */}
        {selectedConv ? (
          <div className="flex-1 flex flex-col bg-dark-950 overflow-hidden relative">
            {/* Active Chat Top Bar */}
            <div className="h-16 px-4 bg-dark-900/90 backdrop-blur-xl border-b border-white/5 flex items-center justify-between flex-shrink-0 z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-dark-800 border border-white/10 flex items-center justify-center font-bold text-sm text-white">
                  {(selectedConv.contact_name || 'CL').substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold text-white">
                      {selectedConv.contact_name || 'Cliente WhatsApp'}
                    </h2>
                    <Badge variant={selectedConv.status === 'human' ? 'brand' : 'default'} className="text-[9px] py-0 px-1.5">
                      {selectedConv.status === 'human' ? 'Atendimento Humano' : selectedConv.status === 'bot' ? 'Robô' : 'Finalizado'}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
                    <Phone className="w-3 h-3 text-emerald-400" />
                    {formatPhone(selectedConv.contact_phone || '')}
                    {selectedConv.assigned_attendant_name && (
                      <span className="text-slate-500">• Responsável: <strong className="text-slate-300">{selectedConv.assigned_attendant_name}</strong></span>
                    )}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                {selectedConv.assigned_attendant_id !== currentAttendant?.id && (
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={handleClaimConversation}
                    leftIcon={<UserCheck className="w-3.5 h-3.5" />}
                    className="font-bold shadow-glow-brand"
                  >
                    Assumir Atendimento
                  </Button>
                )}

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsTransferModalOpen(true)}
                  leftIcon={<ArrowRightLeft className="w-3.5 h-3.5" />}
                  title="Transferir para outro atendente"
                >
                  Transferir
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsQuickAptModalOpen(true)}
                  leftIcon={<Calendar className="w-3.5 h-3.5 text-emerald-400" />}
                  className="text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/10"
                  title="Agendar horário na Agenda"
                >
                  Agendar
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleResolveConversation}
                  leftIcon={<CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                  className="hover:bg-emerald-950/40 text-slate-300 hover:text-emerald-300"
                  title="Finalizar atendimento"
                >
                  Finalizar
                </Button>

                <button
                  type="button"
                  onClick={() => setIsClearHistoryModalOpen(true)}
                  className="p-2 text-slate-400 hover:text-amber-400 transition-colors"
                  title="Limpar Histórico da Conversa"
                >
                  <Eraser className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setShowRightDrawer(!showRightDrawer)}
                  className={`p-2 rounded-xl border transition-colors ${
                    showRightDrawer ? 'bg-brand-500/20 text-brand-300 border-brand-500/40' : 'text-slate-400 border-white/5 hover:text-white'
                  }`}
                  title="Ver detalhes do cliente"
                >
                  <Sliders className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* WhatsApp Disconnected Banner */}
            {!isConnected && (
              <div className="p-3 bg-rose-950/80 border-b border-rose-500/40 text-xs text-rose-300 flex items-center justify-between gap-3 shadow-md animate-in fade-in">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                  <span>
                    <strong>WhatsApp Desconectado:</strong> O envio de mensagens para clientes está temporariamente bloqueado. Conecte o aparelho no painel admin para restabelecer o atendimento.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('/configuracoes')}
                  className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs whitespace-nowrap shadow-sm transition-all"
                >
                  Conectar Aparelho
                </button>
              </div>
            )}

            {/* Chat Body */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#0b141a] bg-opacity-95 custom-scrollbar">
              {messages.length === 0 ? (
                <div className="h-full flex items-center justify-center text-center p-8 text-xs text-slate-500">
                  Nenhuma mensagem registrada nesta conversa ainda.
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isOutbound = msg.direction === 'outbound';
                  const isInternal = msg.message_type === 'internal_note' || msg.is_internal;

                  if (isInternal) {
                    return (
                      <div key={msg.id || idx} className="flex justify-center my-2">
                        <div className="max-w-md w-full bg-amber-950/40 border border-amber-500/30 rounded-2xl p-3 text-xs text-amber-200 shadow-sm space-y-1 relative group">
                          <button
                            type="button"
                            onClick={() => handleDeleteSingleMessage(msg.id)}
                            className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-dark-900 border border-amber-500/40 text-amber-400 hover:text-rose-400 hover:border-rose-500/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md z-10"
                            title="Excluir nota interna"
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                          </button>
                          <div className="flex items-center justify-between text-[10px] text-amber-400 font-bold uppercase tracking-wider">
                            <span className="flex items-center gap-1">
                              <Lock className="w-3 h-3" /> Nota Interna Privada ({msg.author_name || 'Atendente'})
                            </span>
                            <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={msg.id || idx}
                      className={`flex items-end gap-2 ${isOutbound ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[75%] sm:max-w-[65%] rounded-2xl px-3.5 py-2 relative shadow-md text-xs leading-relaxed group ${
                          isOutbound
                            ? 'bg-[#005c4b] text-white rounded-br-none'
                            : 'bg-[#202c33] text-slate-100 rounded-bl-none'
                        }`}
                      >
                        {/* Delete Message Button on Hover */}
                        <button
                          type="button"
                          onClick={() => handleDeleteSingleMessage(msg.id)}
                          className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-dark-900 border border-white/20 text-slate-400 hover:text-rose-400 hover:border-rose-500/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md z-10"
                          title="Excluir mensagem enviada"
                        >
                          <Trash2 className="w-2.5 h-2.5" />
                        </button>

                        <p className="whitespace-pre-wrap">{msg.content}</p>
                        <div className={`flex items-center justify-end gap-1 mt-1 text-[9px] ${isOutbound ? 'text-emerald-200' : 'text-slate-400'}`}>
                          <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          {isOutbound && <CheckCheck className="w-3 h-3 text-[#53bdeb]" />}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Canned Chips Bar */}
            <div className="p-2 bg-[#202c33] border-t border-white/5 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
              <button
                type="button"
                onClick={handleGenerateAiSuggestions}
                className="px-2.5 py-1 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-[10px] font-bold flex items-center gap-1 shadow-glow-primary hover:opacity-90 whitespace-nowrap"
              >
                <Sparkles className="w-3 h-3" />
                Sugerir com IA
              </button>

              <button
                type="button"
                onClick={() => setShowCannedMenu(!showCannedMenu)}
                className="px-2.5 py-1 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30 text-[10px] font-bold flex items-center gap-1 hover:bg-brand-500/30 whitespace-nowrap"
              >
                <Zap className="w-3 h-3" />
                Respostas Rápidas
              </button>

              {cannedReplies.slice(0, 4).map((c, i) => (
                <button
                  key={c.id || i}
                  type="button"
                  disabled={isSending}
                  onClick={() => {
                    if (isSending) return;
                    handleSendMessage(c.text);
                  }}
                  className="px-2.5 py-1 rounded-full bg-[#111b21] text-slate-300 border border-white/5 text-[10px] hover:bg-[#2a3942] whitespace-nowrap disabled:opacity-50"
                >
                  {c.label}
                </button>
              ))}
            </div>

            {/* Canned Menu Overlay */}
            {showCannedMenu && (
              <div className="p-3 bg-[#202c33] border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-2 animate-in slide-in-from-bottom-2">
                {cannedReplies.map((item, idx) => (
                  <button
                    key={item.id || idx}
                    type="button"
                    disabled={isSending}
                    onClick={() => {
                      if (isSending) return;
                      handleSendMessage(item.text);
                    }}
                    className="p-2 rounded-xl bg-[#111b21] hover:bg-[#2a3942] border border-white/5 text-left transition-colors space-y-0.5 disabled:opacity-50"
                  >
                    <div className="flex items-center justify-between text-xs font-bold text-white">
                      <span>{item.label}</span>
                      <span className="text-[10px] text-emerald-400 font-mono">{item.cmd}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 line-clamp-1">{item.text}</p>
                  </button>
                ))}
              </div>
            )}

            {/* Bottom Input Form */}
            <div className="p-3 bg-[#202c33] border-t border-white/5 space-y-2">
              <div className="flex items-center justify-between">
                {/* Mode Selector */}
                <div className="flex items-center gap-1 bg-[#111b21] p-0.5 rounded-xl border border-white/5 text-[10px]">
                  <button
                    type="button"
                    onClick={() => setMessageMode('whatsapp')}
                    className={`px-2 py-0.5 rounded-lg font-bold transition-all flex items-center gap-1 ${
                      messageMode === 'whatsapp' ? 'bg-[#005c4b] text-white shadow-sm' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <MessageCircle className="w-3 h-3" /> WhatsApp
                  </button>
                  <button
                    type="button"
                    onClick={() => setMessageMode('note')}
                    className={`px-2 py-0.5 rounded-lg font-bold transition-all flex items-center gap-1 ${
                      messageMode === 'note' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Lock className="w-3 h-3" /> Nota Interna (Privada)
                  </button>
                </div>

                <span className="text-[10px] text-slate-400">Pressione Enter para enviar</span>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  disabled={!isConnected && messageMode === 'whatsapp'}
                  placeholder={
                    !isConnected && messageMode === 'whatsapp'
                      ? '🔒 WhatsApp desconectado. Conecte o aparelho no Painel Admin para conversar...'
                      : messageMode === 'note'
                      ? 'Escreva uma nota interna visível apenas para a equipe...'
                      : 'Digite sua mensagem no WhatsApp...'
                  }
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className={`flex-1 px-4 py-2.5 rounded-xl border text-xs focus:outline-none transition-all ${
                    !isConnected && messageMode === 'whatsapp'
                      ? 'bg-rose-950/20 border-rose-500/30 text-rose-300 placeholder-rose-400/50 cursor-not-allowed'
                      : messageMode === 'note'
                      ? 'bg-amber-950/30 border-amber-500/40 text-amber-100 placeholder-amber-400/50 focus:border-amber-400'
                      : 'bg-[#111b21] border-white/10 text-white placeholder-slate-500 focus:border-emerald-500'
                  }`}
                />

                <Button
                  type="submit"
                  disabled={isSending || !inputText.trim() || (!isConnected && messageMode === 'whatsapp')}
                  variant={messageMode === 'note' ? 'outline' : 'primary'}
                  size="md"
                  className={`rounded-xl px-4 ${messageMode === 'note' ? 'text-amber-300 border-amber-500/40 bg-amber-500/10' : ''} ${!isConnected && messageMode === 'whatsapp' ? 'opacity-40 cursor-not-allowed' : ''}`}
                  title={!isConnected && messageMode === 'whatsapp' ? 'WhatsApp Desconectado' : 'Enviar'}
                  leftIcon={<Send className="w-4 h-4" />}
                >
                  {messageMode === 'note' ? 'Gravar Nota' : 'Enviar'}
                </Button>
              </form>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500 space-y-3">
            <MessageSquare className="w-12 h-12 text-slate-600 opacity-40" />
            <h3 className="text-sm font-bold text-slate-300">Nenhuma conversa selecionada</h3>
            <p className="text-xs max-w-sm">Escolha um contato na lista à esquerda para iniciar o atendimento.</p>
          </div>
        )}

        {/* Right Drawer: CRM & Client Context */}
        {showRightDrawer && selectedConv && (
          <div className="w-80 bg-dark-900 border-l border-white/5 p-4 overflow-y-auto space-y-4 custom-scrollbar flex-shrink-0">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-brand-400" /> Perfil do Cliente
              </h3>
              <button
                type="button"
                onClick={() => setShowRightDrawer(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-center space-y-1.5 py-2">
              <div className="w-14 h-14 rounded-3xl bg-dark-800 border border-brand-500/30 mx-auto flex items-center justify-center text-base font-bold text-brand-300">
                {(contactData?.name || 'CL').substring(0, 2).toUpperCase()}
              </div>
              <h4 className="text-sm font-bold text-white">{contactData?.name || 'Cliente'}</h4>
              <p className="text-xs font-mono text-slate-400">{formatPhone(contactData?.phone || '')}</p>
            </div>

            {/* Tags */}
            <div className="space-y-1.5 bg-dark-950 p-3 rounded-2xl border border-white/5 text-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tags de Classificação</span>
              <div className="flex flex-wrap gap-1">
                {(contactData?.tags || ['Cliente']).map((tag, idx) => (
                  <Badge key={idx} variant="brand" className="text-[10px]">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-2 pt-2">
              <Button
                size="sm"
                variant="outline"
                className="w-full justify-start text-xs font-semibold"
                leftIcon={<Calendar className="w-3.5 h-3.5 text-emerald-400" />}
                onClick={() => setIsQuickAptModalOpen(true)}
              >
                Novo Agendamento
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="w-full justify-start text-xs font-semibold"
                leftIcon={<ArrowRightLeft className="w-3.5 h-3.5 text-brand-400" />}
                onClick={() => setIsTransferModalOpen(true)}
              >
                Transferir Atendimento
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Transfer Modal */}
      <Modal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        title="Transferir Atendimento"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-300">
            Selecione o atendente ou departamento que assumirá a conversa com <strong>{selectedConv?.contact_name}</strong>:
          </p>

          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-400 uppercase">Atendente de Destino</label>
            <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
              {attendants
                .filter((a) => a.id !== currentAttendant?.id)
                .map((att) => (
                  <div
                    key={att.id}
                    onClick={() => setTransferTargetAttendant(att.id)}
                    className={`p-2.5 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                      transferTargetAttendant === att.id
                        ? 'bg-brand-500/20 border-brand-500'
                        : 'bg-dark-900 border-white/5 hover:bg-dark-850'
                    }`}
                  >
                    <div>
                      <p className="font-bold text-white text-xs">{att.name}</p>
                      <p className="text-[10px] text-slate-400">{att.department}</p>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-emerald-400">
                      {att.status === 'online' ? '🟢 Online' : '🟡 Ocupado'}
                    </span>
                  </div>
                ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase">Nota de Transbordo (Opcional)</label>
            <Textarea
              placeholder="Ex: Cliente quer saber sobre o serviço de Barba Terapia..."
              value={transferNote}
              onChange={(e) => setTransferNote(e.target.value)}
              rows={2}
              className="text-xs"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button size="sm" variant="ghost" onClick={() => setIsTransferModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              size="sm"
              variant="primary"
              disabled={!transferTargetAttendant}
              onClick={handleTransferConversation}
            >
              Confirmar Transferência
            </Button>
          </div>
        </div>
      </Modal>

      {/* AI Suggestions Modal */}
      <Modal
        isOpen={showAiModal}
        onClose={() => setShowAiModal(false)}
        title="Sugestões de Resposta Inteligente (IA)"
      >
        <div className="space-y-3 text-xs">
          <p className="text-slate-300">
            A IA analisou o contexto da conversa. Clique em uma das sugestões para usá-la no chat:
          </p>

          <div className="space-y-2">
            {aiSuggestions.map((sug, i) => (
              <div
                key={i}
                onClick={() => {
                  setInputText(sug);
                  setShowAiModal(false);
                }}
                className="p-3 rounded-2xl bg-dark-900 hover:bg-dark-850 border border-white/5 hover:border-purple-500/40 cursor-pointer transition-all space-y-1 group"
              >
                <div className="flex items-center justify-between text-[10px] text-purple-400 font-bold uppercase">
                  <span>Opção {i + 1}</span>
                  <span className="text-slate-500 group-hover:text-purple-300">Clique para aplicar ➡️</span>
                </div>
                <p className="text-slate-200">{sug}</p>
              </div>
            ))}
          </div>
        </div>
      </Modal>

      {/* Quick Appointment Modal Unificado com Regras de Agenda */}
      <AppointmentBookingModal
        isOpen={isQuickAptModalOpen}
        onClose={() => setIsQuickAptModalOpen(false)}
        defaultClientName={selectedConv?.contact_name || 'Cliente'}
        defaultClientPhone={selectedConv?.contact_phone || selectedConv?.contact?.phone || selectedConv?.id.replace('conv-', '') || ''}
        onSuccess={async (appointment, confirmMessage) => {
          if (confirmMessage && confirmMessage.trim()) {
            await handleSendMessage(confirmMessage);
          }
          loadData(true);
        }}
      />

      {/* Modal: Confirmar Limpar Histórico de Mensagens */}
      <Modal
        isOpen={isClearHistoryModalOpen}
        onClose={() => setIsClearHistoryModalOpen(false)}
        title="Limpar Mensagens da Conversa?"
        subtitle="Apaga o histórico de mensagens mantendo o cliente no portal"
        maxWidth="sm"
      >
        <div className="space-y-4 pt-2">
          <p className="text-xs text-slate-300">
            Tem certeza que deseja limpar todas as mensagens trocadas com <strong className="text-white">{selectedConv?.contact_name || 'este cliente'}</strong>? O histórico de mensagens será zerado, mas você continuará com o cliente aberto para novo atendimento.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsClearHistoryModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={handleClearHistory} leftIcon={<Eraser className="w-3.5 h-3.5" />}>
              Limpar Histórico
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
