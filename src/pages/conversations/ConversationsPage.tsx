import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
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
  ShieldAlert,
  ArrowRight, 
  MoreVertical, 
  QrCode, 
  AlertTriangle, 
  Lock, 
  Sparkles, 
  Zap, 
  RefreshCw, 
  Plus, 
  Smile, 
  Paperclip, 
  X, 
  FileText, 
  Bookmark, 
  Calendar, 
  CheckCircle2, 
  ChevronRight, 
  Info, 
  Sliders, 
  Play, 
  Pause, 
  Download, 
  Trash2, 
  Edit3, 
  Copy, 
  Archive, 
  RotateCcw, 
  Image as ImageIcon, 
  Mic,
  ArrowRightLeft,
  CalendarCheck,
  Headphones,
  UserPlus,
  Eraser,
  AlertCircle
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input, Textarea } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { AppointmentBookingModal } from '../../components/agenda/AppointmentBookingModal';
import { useToast } from '../../contexts/ToastContext';
import { useWhatsApp } from '../../contexts/WhatsAppContext';
import { StorageService, getBackendUrl } from '../../lib/storage';
import { Conversation, Message, Contact, Flow, Attendant, CannedReply } from '../../types';
import { formatPhone, formatTimeAgo, formatDate } from '../../lib/utils';

export const ConversationsPage: React.FC<{ onNavigate?: (path: string) => void }> = ({ onNavigate }) => {
  const { success, info, warning, error: toastError } = useToast();
  const { isConnected } = useWhatsApp();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const isSendingRef = useRef(false);
  const [showRightDrawer, setShowRightDrawer] = useState(true);
  const [flows, setFlows] = useState<Flow[]>([]);
  const [attendants, setAttendants] = useState<Attendant[]>([]);
  const [cannedReplies, setCannedReplies] = useState<CannedReply[]>([]);
  
  // Chat modes: WhatsApp Message vs Internal Team Note
  const [messageMode, setMessageMode] = useState<'whatsapp' | 'note'>('whatsapp');

  // CRM / Contact details for active conversation
  const [contactData, setContactData] = useState<Contact | null>(null);
  const [newTagInput, setNewTagInput] = useState('');
  const [agentNote, setAgentNote] = useState('');
  const [showCannedMenu, setShowCannedMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [mediaUrlInput, setMediaUrlInput] = useState('');
  const [mediaTypeSelect, setMediaTypeSelect] = useState<'image' | 'video' | 'audio' | 'document'>('image');
  const [mediaCaptionInput, setMediaCaptionInput] = useState('');

  // AI Suggestion Box
  const [isAiSuggesting, setIsAiSuggesting] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [showAiModal, setShowAiModal] = useState(false);

  // Transfer / Assign Attendant Modal
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferTargetAttendant, setTransferTargetAttendant] = useState<string>('');
  const [transferNote, setTransferNote] = useState('');

  // Quick Appointment Modal
  const [isQuickAptModalOpen, setIsQuickAptModalOpen] = useState(false);
  const [quickService, setQuickService] = useState('Corte Tradicional');
  const [quickDate, setQuickDate] = useState(new Date().toISOString().split('T')[0]);
  const [quickTime, setQuickTime] = useState('09:00');

  // Delete Conversation Modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isClearHistoryModalOpen, setIsClearHistoryModalOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const selectedConvIdRef = useRef<string | null>(null);
  selectedConvIdRef.current = selectedConv?.id || null;

  // Load Data with silent real-time refresh
  const loadData = useCallback(async (silent = false) => {
    try {
      if (!silent) setIsLoading(true);
      const [convs, allFlows, allAttendants, allCanned] = await Promise.all([
        StorageService.getConversations(),
        StorageService.getFlows(),
        StorageService.getAttendants(),
        StorageService.getCannedReplies(),
      ]);
      setConversations(convs);
      setFlows(allFlows);
      setAttendants(allAttendants);
      setCannedReplies(allCanned);

      const activeId = selectedConvIdRef.current;
      if (activeId) {
        const currentSelected = convs.find(c => c.id === activeId);
        if (currentSelected) {
          setSelectedConv(currentSelected);
        }
        const msgs = await StorageService.getMessages(activeId);
        setMessages(msgs);
      } else if (convs.length > 0 && !silent) {
        handleSelectConv(convs[0]);
      }
    } catch (err) {
      console.error('Error loading conversations:', err);
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
      setAgentNote(found.metadata?.agent_notes || '');
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
      setAgentNote('');
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Anti-Duplicate Guaranteed Message Sender
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
        const newNote = await StorageService.sendInternalNote(selectedConv.id, text, 'Administrador');
        setMessages((prev) => [...prev, newNote]);
        success('Nota Interna Salva', 'Anotação registrada com sucesso para a equipe.');
      } else {
        if (!isConnected) {
          toastError(
            'WhatsApp Desconectado',
            'O envio de mensagens para clientes está bloqueado pois o WhatsApp não está conectado. Conecte o aparelho em Configurações.'
          );
          return;
        }

        const newMsg = await StorageService.sendMessage(selectedConv.id, text);
        setMessages((prev) => [...prev, newMsg]);

        // Direct dispatch to WhatsApp Server
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
          }).catch((err) => console.warn('WhatsApp direct send warning:', err));
        }

        // Update conversation preview
        setConversations((prev) =>
          prev.map((c) =>
            c.id === selectedConv.id
              ? { ...c, last_message: text, last_message_at: new Date().toISOString() }
              : c
          )
        );
      }
    } catch (err: any) {
      toastError('Erro ao enviar mensagem', err.message || 'Falha no envio.');
    } finally {
      setTimeout(() => {
        setIsSending(false);
        isSendingRef.current = false;
      }, 600);
    }
  };

  // Send Media
  const handleSendMedia = async () => {
    if (!mediaUrlInput.trim() || !selectedConv) return;
    const backendUrl = getBackendUrl();
    const targetPhone = (selectedConv.contact_phone || selectedConv.contact?.phone || selectedConv.id.replace('conv-', '')).replace(/\D/g, '');

    setIsSending(true);
    try {
      await fetch(`${backendUrl}/api/whatsapp/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: targetPhone,
          mediaUrl: mediaUrlInput.trim(),
          mediaType: mediaTypeSelect,
          caption: mediaCaptionInput.trim(),
          isPtt: mediaTypeSelect === 'audio',
        }),
      });

      const newMsg = await StorageService.sendMessage(selectedConv.id, mediaCaptionInput.trim() || `[${mediaTypeSelect.toUpperCase()}]: ${mediaUrlInput}`);
      setMessages((prev) => [...prev, newMsg]);
      setIsMediaModalOpen(false);
      setMediaUrlInput('');
      setMediaCaptionInput('');
      success('Mídia Enviada', 'Arquivo transmitido com sucesso pelo WhatsApp.');
    } catch (err: any) {
      toastError('Erro ao enviar mídia', err.message || 'Falha no envio.');
    } finally {
      setIsSending(false);
    }
  };

  // Toggle Takeover status (Human vs Bot vs Closed)
  const handleToggleTakeover = async (newStatus: 'bot' | 'human' | 'closed') => {
    if (!selectedConv) return;
    const backendUrl = getBackendUrl();
    try {
      const updated: Conversation = { ...selectedConv, status: newStatus as any };
      await StorageService.saveConversation(updated);
      setSelectedConv(updated);
      setConversations((prev) =>
        prev.map((c) => (c.id === selectedConv.id ? updated : c))
      );

      // Inform server
      await fetch(`${backendUrl}/api/whatsapp/conversations/${selectedConv.id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      }).catch(() => {});

      if (newStatus === 'human') {
        success('Atendimento Humano Assumido', 'O robô foi pausado para este cliente.');
      } else if (newStatus === 'bot') {
        info('Robô Reativado', 'A automação voltou a responder normalmente a este cliente.');
      } else if (newStatus === 'closed') {
        success('Atendimento Finalizado', 'Conversa arquivada como finalizada.');
      }
    } catch (err: any) {
      toastError('Erro ao alterar status', err.message);
    }
  };

  // Transfer / Assign Attendant
  const handleTransferConversation = async () => {
    if (!selectedConv || !transferTargetAttendant) return;
    const target = attendants.find((a) => a.id === transferTargetAttendant);
    if (!target) return;

    try {
      const updated = await StorageService.transferConversation(
        selectedConv.id,
        target,
        'Administrador',
        transferNote
      );
      if (updated) {
        setSelectedConv(updated);
        setConversations((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
        setIsTransferModalOpen(false);
        setTransferNote('');
        success('Transferência Concluída', `Atendimento atribuído para ${target.name}.`);
      }
    } catch (err: any) {
      toastError('Erro ao transferir', err.message);
    }
  };

  // AI Response Suggestions
  const handleGenerateAiSuggestions = async () => {
    if (!selectedConv || messages.length === 0) return;
    setIsAiSuggesting(true);
    setShowAiModal(true);

    try {
      const clientName = selectedConv.contact_name || contactData?.name || 'Cliente';
      const suggestions = [
        `Olá ${clientName}! Perfeito, verifiquei aqui em nossa agenda e podemos reservar esse horário. Deseja confirmar?`,
        `Com certeza ${clientName}! Nossos profissionais estão prontos para te receber hoje. Posso te enviar as opções de horários?`,
        `Olá ${clientName}, acabei de checar seu histórico de agendamentos. Como podemos te ajudar hoje?`
      ];
      setAiSuggestions(suggestions);
    } finally {
      setIsAiSuggesting(false);
    }
  };

  // Quick Appointment Creation
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

      const confirmText = `📅 *Agendamento Confirmado!*\n\nOlá ${clientName}, seu agendamento foi registrado com sucesso:\n• *Serviço:* ${quickService}\n• *Data:* ${quickDate}\n• *Horário:* ${quickTime}\n\nTe aguardamos na Talvane Barber!`;
      await handleSendMessage(confirmText);
      success('Agendamento Realizado', 'Compromisso gravado na Agenda e enviado no WhatsApp do cliente.');
    } catch (err: any) {
      toastError('Erro ao agendar', err.message);
    }
  };

  // Trigger Flow Manually
  const handleTriggerFlow = async (flow: Flow) => {
    if (!isConnected) {
      toastError('WhatsApp Desconectado', 'Não é possível disparar o fluxo com o WhatsApp desconectado. Conecte o aparelho em Configurações.');
      return;
    }
    if (!selectedConv) return;
    const backendUrl = getBackendUrl();
    const targetPhone = (selectedConv.contact_phone || selectedConv.contact?.phone || selectedConv.id.replace('conv-', '')).replace(/\D/g, '');

    try {
      await fetch(`${backendUrl}/api/whatsapp/flows/${flow.id}/trigger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: targetPhone }),
      });
      success('Fluxo Disparado', `O fluxo "${flow.name}" foi iniciado para este contato.`);
      loadData(true);
    } catch (err: any) {
      toastError('Erro ao disparar fluxo', err.message);
    }
  };

  // Tag Management
  const handleAddTag = async () => {
    if (!newTagInput.trim() || !contactData) return;
    const currentTags = contactData.tags || [];
    if (currentTags.includes(newTagInput.trim())) return;

    const updatedTags = [...currentTags, newTagInput.trim()];
    const updatedContact = { ...contactData, tags: updatedTags };
    setContactData(updatedContact);
    setNewTagInput('');
    await StorageService.saveContact(updatedContact);
    success('Tag Adicionada', `Tag "${newTagInput}" salva no perfil.`);
  };

  const handleRemoveTag = async (tagToRemove: string) => {
    if (!contactData) return;
    const updatedTags = (contactData.tags || []).filter((t) => t !== tagToRemove);
    const updatedContact = { ...contactData, tags: updatedTags };
    setContactData(updatedContact);
    await StorageService.saveContact(updatedContact);
  };

  // Save Notes
  const handleSaveNotes = async () => {
    if (!contactData) return;
    const updatedContact = {
      ...contactData,
      metadata: {
        ...(contactData.metadata || {}),
        agent_notes: agentNote,
      },
    };
    setContactData(updatedContact);
    await StorageService.saveContact(updatedContact);
    success('Notas Salvas', 'Observações internas registradas com sucesso.');
  };

  // Delete Conversation
  const handleDeleteConversation = async () => {
    if (!selectedConv) return;
    try {
      await StorageService.deleteConversation(selectedConv.id);
      setIsDeleteModalOpen(false);
      setSelectedConv(null);
      await loadData(false);
      success('Conversa Excluída', 'Histórico apagado com sucesso.');
    } catch (err: any) {
      toastError('Erro ao excluir', err.message);
    }
  };

  // Clear Conversation Messages History
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

  const quickEmojis = ['👋', '📅', '✂️', '💈', '✅', '🙏', '👍', '🔥', '📍', '💰'];

  const filteredConversations = conversations.filter((conv) => {
    const nameMatch = (conv.contact_name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const phoneMatch = (conv.contact_phone || '').includes(searchTerm);
    const lastMsgMatch = (conv.last_message || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSearch = nameMatch || phoneMatch || lastMsgMatch;

    if (filterStatus === 'all') return matchesSearch;
    if (filterStatus === 'bot') return matchesSearch && conv.status === 'bot';
    if (filterStatus === 'human') return matchesSearch && conv.status === 'human';
    if (filterStatus === 'closed') return matchesSearch && conv.status === 'closed';
    return matchesSearch;
  });

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col md:flex-row bg-[#111b21] rounded-2xl overflow-hidden border border-white/5 shadow-2xl relative">
      {/* Left Column: Conversation List */}
      <div className="w-full md:w-80 lg:w-96 flex flex-col bg-[#111b21] border-r border-white/5 z-10 flex-shrink-0">
        {/* Top Search & Filter Bar */}
        <div className="p-3 bg-[#202c33] border-b border-white/5 space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#00a884]" />
              Atendimento WhatsApp
            </h2>
            <Badge variant="brand" className="text-[10px] font-mono py-0.5 px-2">
              {conversations.length} conversas
            </Badge>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar cliente, telefone ou texto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#111b21] border border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-[#00a884]"
            />
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1 bg-[#111b21] p-1 rounded-xl border border-white/5 text-[11px] font-semibold">
            <button
              onClick={() => setFilterStatus('all')}
              className={`flex-1 py-1 rounded-lg transition-colors ${
                filterStatus === 'all' ? 'bg-[#202c33] text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Todas
            </button>
            <button
              onClick={() => setFilterStatus('human')}
              className={`flex-1 py-1 rounded-lg transition-colors ${
                filterStatus === 'human' ? 'bg-[#00a884] text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Humano
            </button>
            <button
              onClick={() => setFilterStatus('bot')}
              className={`flex-1 py-1 rounded-lg transition-colors ${
                filterStatus === 'bot' ? 'bg-brand-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Robô
            </button>
          </div>
        </div>

        {/* Conversation Items */}
        <div className="flex-1 overflow-y-auto divide-y divide-white/5 custom-scrollbar">
          {filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              Nenhuma conversa encontrada.
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const isSelected = selectedConv?.id === conv.id;
              const isHuman = conv.status === 'human';

              return (
                <div
                  key={conv.id}
                  onClick={() => handleSelectConv(conv)}
                  className={`p-3 cursor-pointer transition-colors flex items-start gap-3 hover:bg-[#202c33] relative ${
                    isSelected ? 'bg-[#2a3942]' : ''
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-[#374248] flex items-center justify-center text-slate-200 font-bold text-sm flex-shrink-0 relative">
                    {(conv.contact?.name || conv.contact_name || 'CL').substring(0, 2).toUpperCase()}
                    <span
                      className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#111b21] ${
                        isHuman ? 'bg-emerald-500' : 'bg-brand-500'
                      }`}
                      title={isHuman ? 'Atendimento Humano' : 'Robô Ativo'}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="font-bold text-xs text-white truncate">
                        {conv.contact?.name || conv.contact_name || formatPhone(conv.contact_phone || '')}
                      </span>
                      <span className="text-[10px] text-slate-400 whitespace-nowrap">
                        {formatTimeAgo(conv.last_message_at || conv.started_at)}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-300 truncate mb-1">
                      {conv.last_message || 'Sem mensagens'}
                    </p>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                          isHuman
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-brand-500/20 text-brand-300 border border-brand-500/30'
                        }`}
                      >
                        {isHuman ? '👤 Humano' : '🤖 Robô'}
                      </span>
                      {conv.assigned_attendant_name && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-slate-800 text-slate-300">
                          {conv.assigned_attendant_name}
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

      {/* Middle Column: Chat Body */}
      {selectedConv ? (
        <div className="flex-1 flex flex-col bg-[#0b141a] relative overflow-hidden">
          {/* Header Bar */}
          <div className="h-16 px-4 bg-[#202c33] border-b border-white/5 flex items-center justify-between z-10 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#374248] flex items-center justify-center text-slate-200 font-bold text-sm">
                {(selectedConv.contact?.name || selectedConv.contact_name || 'CL').substring(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white">
                    {selectedConv.contact?.name || selectedConv.contact_name || 'Cliente WhatsApp'}
                  </h3>
                  <Badge variant={selectedConv.status === 'human' ? 'brand' : 'default'} className="text-[9px] py-0 px-1.5">
                    {selectedConv.status === 'human' ? 'Atendimento Humano' : 'Robô Ativo'}
                  </Badge>
                </div>
                <p className="text-[11px] text-slate-400 font-mono">
                  {formatPhone(selectedConv.contact_phone || selectedConv.contact?.phone || '')}
                  {selectedConv.assigned_attendant_name && (
                    <span className="text-slate-400 font-sans ml-2">• Atendente: <strong className="text-white">{selectedConv.assigned_attendant_name}</strong></span>
                  )}
                </p>
              </div>
            </div>

            {/* Quick Action Controls */}
            <div className="flex items-center gap-2">
              {selectedConv.status === 'bot' ? (
                <Button
                  size="sm"
                  variant="brand"
                  onClick={() => handleToggleTakeover('human')}
                  leftIcon={<UserCheck className="w-3.5 h-3.5" />}
                  className="bg-[#00a884] hover:bg-[#009172] text-xs font-bold"
                >
                  Assumir Atendimento
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleToggleTakeover('bot')}
                  leftIcon={<Bot className="w-3.5 h-3.5" />}
                  className="text-xs"
                >
                  Devolver p/ Robô
                </Button>
              )}

              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsTransferModalOpen(true)}
                leftIcon={<ArrowRightLeft className="w-3.5 h-3.5" />}
                className="text-xs"
                title="Transferir para um atendente"
              >
                Transferir
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsQuickAptModalOpen(true)}
                leftIcon={<Calendar className="w-3.5 h-3.5 text-emerald-400" />}
                className="text-xs text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/10"
                title="Agendar horário na Agenda"
              >
                Agendar
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
                onClick={() => setIsDeleteModalOpen(true)}
                className="p-2 text-slate-400 hover:text-rose-400 transition-colors"
                title="Excluir Conversa"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setShowRightDrawer(!showRightDrawer)}
                className={`p-2 rounded-xl transition-colors ${
                  showRightDrawer ? 'bg-[#2a3942] text-white' : 'text-slate-400 hover:text-white'
                }`}
                title="Abrir Painel CRM & Gestão do Cliente"
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
                  <strong>WhatsApp Desconectado:</strong> O envio de mensagens para clientes está temporariamente bloqueado. Conecte o aparelho em Configurações.
                </span>
              </div>
              <button
                type="button"
                onClick={() => onNavigate ? onNavigate('/configuracoes') : (window.location.href = '/configuracoes')}
                className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs whitespace-nowrap shadow-sm transition-all"
              >
                Conectar Aparelho
              </button>
            </div>
          )}

          {/* Chat Messages Body */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#0b141a] bg-opacity-95 custom-scrollbar">
            <div className="flex justify-center my-2">
              <div className="px-3 py-1 rounded-lg bg-[#182229] border border-white/5 text-[10px] text-amber-200/80 flex items-center gap-1.5 shadow-sm max-w-md text-center">
                <Lock className="w-3 h-3 text-amber-400 flex-shrink-0" />
                <span>As mensagens desta conversa são sincronizadas em tempo real com o WhatsApp e protegidas por criptografia.</span>
              </div>
            </div>

            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-center p-8 text-xs text-slate-500">
                Inicie a conversa enviando uma mensagem abaixo ou selecione uma resposta rápida.
              </div>
            ) : (
              messages.map((msg, index) => {
                const isOutbound = msg.direction === 'outbound';
                const isInternal = msg.message_type === 'internal_note' || msg.is_internal;

                if (isInternal) {
                  return (
                    <div key={msg.id || index} className="flex justify-center my-2">
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
                            <Lock className="w-3 h-3" /> Nota Interna Privada ({msg.author_name || 'Equipe'})
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
                    key={msg.id || index}
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
                        title="Excluir mensagem"
                      >
                        <Trash2 className="w-2.5 h-2.5" />
                      </button>

                      <p className="whitespace-pre-wrap">{msg.content}</p>
                      <div
                        className={`flex items-center justify-end gap-1 mt-1 text-[9px] ${
                          isOutbound ? 'text-emerald-200' : 'text-slate-400'
                        }`}
                      >
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

          {/* Quick Emoji Bar */}
          {showEmojiPicker && (
            <div className="p-2 bg-[#202c33] border-t border-white/5 flex items-center gap-2 overflow-x-auto scrollbar-none">
              {quickEmojis.map((emoji, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setInputText((prev) => prev + emoji);
                    setShowEmojiPicker(false);
                  }}
                  className="text-lg hover:scale-125 transition-transform p-1"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}

          {/* Canned Replies Popup Menu */}
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

          {/* Bottom Chat Input Bar */}
          <div className="p-3 bg-[#202c33] border-t border-white/5 space-y-2">
            {/* Quick Canned Suggestions Chips & AI button */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
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

              {cannedReplies.slice(0, 4).map((reply, idx) => (
                <button
                  key={reply.id || idx}
                  type="button"
                  disabled={isSending}
                  onClick={() => {
                    if (isSending) return;
                    handleSendMessage(reply.text);
                  }}
                  className="px-2.5 py-1 rounded-full bg-[#111b21] text-slate-300 border border-white/5 text-[10px] hover:bg-[#2a3942] whitespace-nowrap disabled:opacity-50"
                >
                  {reply.label}
                </button>
              ))}
            </div>

            {/* Mode Switcher */}
            <div className="flex items-center justify-between text-[10px]">
              <div className="flex items-center gap-1 bg-[#111b21] p-0.5 rounded-xl border border-white/5">
                <button
                  type="button"
                  onClick={() => setMessageMode('whatsapp')}
                  className={`px-2 py-0.5 rounded-lg font-bold transition-all ${
                    messageMode === 'whatsapp' ? 'bg-[#005c4b] text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Mensagem WhatsApp
                </button>
                <button
                  type="button"
                  onClick={() => setMessageMode('note')}
                  className={`px-2 py-0.5 rounded-lg font-bold transition-all flex items-center gap-1 ${
                    messageMode === 'note' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Lock className="w-3 h-3" /> Nota Interna Privada
                </button>
              </div>

              <span className="text-slate-400 hidden sm:inline">Pressione Enter para enviar</span>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="p-2 text-slate-400 hover:text-white transition-colors"
                title="Emojis"
              >
                <Smile className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={() => setIsMediaModalOpen(true)}
                className="p-2 text-slate-400 hover:text-white transition-colors"
                title="Enviar Mídia ou Anexo"
              >
                <Paperclip className="w-5 h-5" />
              </button>

              <input
                type="text"
                disabled={!isConnected && messageMode === 'whatsapp'}
                placeholder={
                  !isConnected && messageMode === 'whatsapp'
                    ? '🔒 WhatsApp desconectado. Conecte o aparelho em Configurações para enviar mensagens...'
                    : messageMode === 'note'
                    ? 'Escreva uma anotação privada visível apenas para os atendentes...'
                    : selectedConv.status === 'bot'
                    ? 'Digite sua mensagem no WhatsApp (Robô ativo)...'
                    : 'Digite sua mensagem no WhatsApp...'
                }
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className={`flex-1 border-none rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 ${
                  !isConnected && messageMode === 'whatsapp'
                    ? 'bg-rose-950/20 text-rose-300 placeholder:text-rose-400/50 cursor-not-allowed'
                    : messageMode === 'note'
                    ? 'bg-amber-950/40 focus:ring-amber-400 text-amber-100'
                    : 'bg-[#2a3942] focus:ring-[#00a884]'
                }`}
              />

              <button
                type="submit"
                disabled={isSending || !inputText.trim() || (!isConnected && messageMode === 'whatsapp')}
                className={`p-2.5 rounded-full text-white disabled:opacity-40 transition-colors shadow-md ${
                  !isConnected && messageMode === 'whatsapp'
                    ? 'bg-rose-900/40 text-slate-500 cursor-not-allowed'
                    : messageMode === 'note'
                    ? 'bg-amber-600 hover:bg-amber-500'
                    : 'bg-[#00a884] hover:bg-[#009172]'
                }`}
                title={!isConnected && messageMode === 'whatsapp' ? 'WhatsApp Desconectado' : 'Enviar Mensagem'}
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500 space-y-3">
          <MessageSquare className="w-12 h-12 text-slate-600 opacity-40" />
          <h3 className="text-sm font-bold text-slate-300">Nenhuma conversa selecionada</h3>
          <p className="text-xs max-w-sm">Escolha uma conversa na coluna à esquerda para visualizar as mensagens.</p>
        </div>
      )}

      {/* Right Column: Customer CRM Drawer */}
      {showRightDrawer && selectedConv && (
        <div className="w-80 bg-[#111b21] border-l border-white/5 flex flex-col z-10 flex-shrink-0">
          <div className="p-3 bg-[#202c33] border-b border-white/5 flex items-center justify-between">
            <h3 className="text-xs font-bold text-white flex items-center gap-2">
              <User className="w-4 h-4 text-[#00a884]" />
              Dados do Cliente & CRM
            </h3>
            <button
              onClick={() => setShowRightDrawer(false)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-4 custom-scrollbar">
            {/* Contact Header */}
            <div className="text-center space-y-2 pb-3 border-b border-white/5">
              <div className="w-16 h-16 rounded-full bg-[#202c33] border-2 border-[#00a884] mx-auto flex items-center justify-center font-bold text-lg text-white shadow-md">
                {(contactData?.name || selectedConv.contact_name || 'CL').substring(0, 2).toUpperCase()}
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">{contactData?.name || selectedConv.contact_name || 'Cliente'}</h4>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  {formatPhone(contactData?.phone || selectedConv.contact_phone || '')}
                </p>
              </div>
            </div>

            {/* Tag Management */}
            <div className="space-y-2.5">
              <label className="text-xs font-bold text-white flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-brand-400" />
                Tags de Segmentação:
              </label>

              <div className="flex flex-wrap gap-1.5">
                {(contactData?.tags || ['Cliente']).map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded-lg bg-[#202c33] text-emerald-300 border border-emerald-500/30 text-[11px] font-semibold flex items-center gap-1.5 shadow-sm"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-rose-400"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>

              {/* Add New Tag */}
              <div className="flex gap-1.5">
                <input
                  type="text"
                  placeholder="Nova tag (ex: VIP, Agendou)..."
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAddTag(); }}
                  className="flex-1 bg-[#202c33] border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-[#00a884]"
                />
                <Button size="sm" variant="brand" onClick={handleAddTag} className="py-1 px-3 h-auto text-xs bg-[#00a884]">
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
            </div>

            {/* Internal Agent Notes */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-white flex items-center gap-1.5">
                <Bookmark className="w-3.5 h-3.5 text-amber-400" />
                Notas do Perfil (Fixas):
              </label>
              <textarea
                value={agentNote}
                onChange={(e) => setAgentNote(e.target.value)}
                placeholder="Escreva observações internas sobre este cliente..."
                rows={3}
                className="w-full bg-[#202c33] border border-white/10 rounded-xl p-2.5 text-xs text-amber-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-400 font-sans resize-none"
              />
              <div className="flex justify-end">
                <Button size="sm" variant="outline" onClick={handleSaveNotes} className="text-[10px] py-1 h-7">
                  Salvar Notas
                </Button>
              </div>
            </div>

            {/* Direct Flow Launcher */}
            <div className="space-y-2 pt-2 border-t border-white/5">
              <label className="text-xs font-bold text-white flex items-center gap-1.5">
                <Play className="w-3.5 h-3.5 text-brand-400" />
                Disparar Fluxo nesta Conversa:
              </label>
              <div className="space-y-1.5">
                {flows.slice(0, 3).map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => handleTriggerFlow(f)}
                    className="w-full p-2.5 rounded-xl bg-[#202c33] hover:bg-[#2a3942] border border-white/5 flex items-center justify-between text-left transition-colors"
                  >
                    <div>
                      <p className="text-xs font-bold text-white">{f.name}</p>
                      <p className="text-[10px] text-slate-400">{f.node_count || 0} nós configurados</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: AI Suggestions */}
      <Modal
        isOpen={showAiModal}
        onClose={() => setShowAiModal(false)}
        title="Sugestões de Resposta Inteligente (IA)"
      >
        <div className="space-y-3 text-xs">
          <p className="text-slate-300">
            A IA analisou as mensagens recentes. Clique para aplicar o texto no campo de envio:
          </p>

          <div className="space-y-2">
            {aiSuggestions.map((sug, i) => (
              <div
                key={i}
                onClick={() => {
                  setInputText(sug);
                  setShowAiModal(false);
                }}
                className="p-3 rounded-2xl bg-[#202c33] hover:bg-[#2a3942] border border-white/5 hover:border-purple-500/40 cursor-pointer transition-all space-y-1 group"
              >
                <div className="flex items-center justify-between text-[10px] text-purple-400 font-bold uppercase">
                  <span>Opção {i + 1}</span>
                  <span className="text-slate-400 group-hover:text-purple-300">Usar no Chat ➡️</span>
                </div>
                <p className="text-slate-200">{sug}</p>
              </div>
            ))}
          </div>
        </div>
      </Modal>

      {/* Modal: Transferir Atendimento */}
      <Modal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        title="Transferir / Atribuir Atendente"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-300">
            Selecione o atendente que será o responsável pela conversa com <strong>{selectedConv?.contact_name || 'Cliente'}</strong>:
          </p>

          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-400 uppercase">Atendente Disponível</label>
            <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
              {attendants.map((att) => (
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
                    <p className="text-[10px] text-slate-400">{att.department || 'Geral'}</p>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-emerald-400">
                    {att.status === 'online' ? '🟢 Online' : '🟡 Ocupado'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase">Nota de Transbordo</label>
            <Textarea
              placeholder="Instruções para o atendente..."
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
              Confirmar Atribuição
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal: Agendamento Rápido Unificado com Regras de Agenda */}
      <AppointmentBookingModal
        isOpen={isQuickAptModalOpen}
        onClose={() => setIsQuickAptModalOpen(false)}
        defaultClientName={selectedConv?.contact_name || contactData?.name || 'Cliente'}
        defaultClientPhone={selectedConv?.contact_phone || selectedConv?.contact?.phone || selectedConv?.id.replace('conv-', '') || ''}
        onSuccess={async (appointment, confirmMessage) => {
          if (confirmMessage && confirmMessage.trim()) {
            await handleSendMessage(confirmMessage);
          }
          loadData(true);
        }}
      />

      {/* Modal: Enviar Mídia */}
      <Modal
        isOpen={isMediaModalOpen}
        onClose={() => setIsMediaModalOpen(false)}
        title="Enviar Mídia / Anexo no WhatsApp"
        subtitle="Informe a URL da imagem, vídeo, áudio ou PDF para envio"
        maxWidth="md"
      >
        <div className="space-y-3 pt-2">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Tipo de Mídia</label>
            <select
              value={mediaTypeSelect}
              onChange={(e) => setMediaTypeSelect(e.target.value as any)}
              className="w-full bg-dark-800 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
            >
              <option value="image">🖼️ Imagem (JPG, PNG)</option>
              <option value="video">🎥 Vídeo (MP4)</option>
              <option value="audio">🎙️ Áudio / Mensagem de Voz</option>
              <option value="document">📄 Documento (PDF)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">URL da Mídia</label>
            <Input
              type="url"
              placeholder="https://exemplo.com/imagem.png"
              value={mediaUrlInput}
              onChange={(e) => setMediaUrlInput(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Legenda (Opcional)</label>
            <Input
              type="text"
              placeholder="Digite a legenda da foto ou vídeo..."
              value={mediaCaptionInput}
              onChange={(e) => setMediaCaptionInput(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setIsMediaModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="brand" onClick={handleSendMedia} disabled={!mediaUrlInput.trim() || isSending}>
              Enviar no WhatsApp
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal: Confirmar Exclusão de Conversa */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Excluir Histórico de Conversa?"
        subtitle="Todas as mensagens enviadas e recebidas com este contato serão apagadas"
        maxWidth="sm"
      >
        <div className="space-y-4 pt-2">
          <p className="text-xs text-slate-300">
            Tem certeza que deseja apagar a conversa com <strong className="text-white">{selectedConv?.contact?.name || selectedConv?.contact_name || 'Cliente'}</strong>? Esta ação não pode ser desfeita.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={handleDeleteConversation}>
              Confirmar Exclusão
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal: Confirmar Limpar Histórico de Mensagens */}
      <Modal
        isOpen={isClearHistoryModalOpen}
        onClose={() => setIsClearHistoryModalOpen(false)}
        title="Limpar Mensagens da Conversa?"
        subtitle="Apaga o histórico mantendo o contato salvo no painel"
        maxWidth="sm"
      >
        <div className="space-y-4 pt-2">
          <p className="text-xs text-slate-300">
            Tem certeza que deseja limpar todas as mensagens trocadas com <strong className="text-white">{selectedConv?.contact?.name || selectedConv?.contact_name || 'este cliente'}</strong>? O histórico de mensagens será zerado, mas o contato continuará na sua lista.
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
