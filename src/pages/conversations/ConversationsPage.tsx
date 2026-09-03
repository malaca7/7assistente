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
  Mic
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input, Textarea } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../contexts/ToastContext';
import { useWhatsApp } from '../../contexts/WhatsAppContext';
import { StorageService, getBackendUrl } from '../../lib/storage';
import { Conversation, Message, Contact, Flow } from '../../types';
import { formatPhone, formatTimeAgo, formatDate } from '../../lib/utils';

export const ConversationsPage: React.FC = () => {
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
  const [showRightDrawer, setShowRightDrawer] = useState(true);
  const [flows, setFlows] = useState<Flow[]>([]);
  
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

  // Delete Conversation Modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const selectedConvIdRef = useRef<string | null>(null);
  selectedConvIdRef.current = selectedConv?.id || null;

  // Load Data with silent real-time refresh
  const loadData = useCallback(async (silent = false) => {
    try {
      if (!silent) setIsLoading(true);
      const [convs, allFlows] = await Promise.all([
        StorageService.getConversations(),
        StorageService.getFlows(),
      ]);
      setConversations(convs);
      setFlows(allFlows);

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
    // Real-time polling every 2.5 seconds
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

    // Find full contact details
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

  // Send message
  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() || !selectedConv) return;

    const content = text.trim();
    setInputText('');
    setShowCannedMenu(false);
    setIsSending(true);

    try {
      const newMsg = await StorageService.sendMessage(selectedConv.id, content);
      setMessages((prev) => [...prev, newMsg]);

      // Real dispatch through WhatsApp Server
      const backendUrl = getBackendUrl();
      const targetPhone = (selectedConv.contact_phone || selectedConv.contact?.phone || selectedConv.id.replace('conv-', '')).replace(/\D/g, '');
      if (targetPhone) {
        await fetch(`${backendUrl}/api/whatsapp/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: targetPhone,
            text: content,
          }),
        }).catch((err) => console.warn('WhatsApp direct send warning:', err));
      }

      // Update preview
      setConversations((prev) =>
        prev.map((c) =>
          c.id === selectedConv.id
            ? { ...c, last_message: content, last_message_at: new Date().toISOString() }
            : c
        )
      );
    } catch (err: any) {
      toastError('Erro ao enviar mensagem', err.message || 'Falha no envio.');
    } finally {
      setIsSending(false);
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
        success('Atendimento Humano Assumido', 'O robô foi pausado para este cliente. Você está no controle do chat!');
      } else if (newStatus === 'bot') {
        info('Robô Reativado', 'A automação voltou a responder normalmente a este cliente.');
      } else if (newStatus === 'closed') {
        success('Atendimento Finalizado', 'Conversa arquivada como finalizada.');
      }
    } catch (err: any) {
      toastError('Erro ao alterar status', err.message);
    }
  };

  // Delete Conversation
  const handleDeleteConversation = async () => {
    if (!selectedConv) return;
    try {
      await StorageService.deleteConversation(selectedConv.id);
      const remaining = conversations.filter(c => c.id !== selectedConv.id);
      setConversations(remaining);
      setSelectedConv(remaining.length > 0 ? remaining[0] : null);
      setIsDeleteModalOpen(false);
      success('Conversa Excluída', 'O histórico de mensagens e atendimento foi removido.');
    } catch (err: any) {
      toastError('Erro ao excluir', err.message || 'Falha ao excluir a conversa.');
    }
  };

  // Tag Management in Live Chat
  const handleAddTag = async () => {
    if (!newTagInput.trim() || !contactData) return;
    const tagToAdd = newTagInput.trim();
    if ((contactData.tags || []).includes(tagToAdd)) {
      setNewTagInput('');
      return;
    }
    const updatedTags = [...(contactData.tags || []), tagToAdd];
    const updatedContact = { ...contactData, tags: updatedTags };
    setContactData(updatedContact);
    await StorageService.saveContact(updatedContact);
    setNewTagInput('');
    success('Tag Adicionada', `Tag "${tagToAdd}" vinculada ao cliente.`);
  };

  const handleRemoveTag = async (tagToRemove: string) => {
    if (!contactData) return;
    const updatedTags = (contactData.tags || []).filter((t) => t !== tagToRemove);
    const updatedContact = { ...contactData, tags: updatedTags };
    setContactData(updatedContact);
    await StorageService.saveContact(updatedContact);
    info('Tag Removida', `Tag "${tagToRemove}" desvinculada.`);
  };

  // Save Agent Private Notes
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
    success('Notas Salvas', 'Anotações internas gravadas com sucesso.');
  };

  // Trigger Flow Manually
  const handleTriggerFlow = async (flow: Flow) => {
    if (!selectedConv) return;
    const phone = selectedConv.contact_phone || selectedConv.contact?.phone;
    if (!phone) return;
    const backendUrl = getBackendUrl();

    try {
      await fetch(`${backendUrl}/api/whatsapp/sync-flows`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          flows: flows.map((f) => ({ ...f, status: f.id === flow.id ? 'published' : 'draft' })),
        }),
      });

      await handleSendMessage(`[Disparando Fluxo: *${flow.name}*]`);
      success('Fluxo Disparado', `O fluxo "${flow.name}" foi ativado para esta conversa.`);
    } catch (err: any) {
      toastError('Erro ao disparar fluxo', err.message);
    }
  };

  // Canned Replies list
  const cannedReplies = [
    { label: 'Boas-Vindas', cmd: '/ola', text: 'Olá! Seja bem-vindo à Talvane Barber. Como podemos te ajudar hoje?' },
    { label: 'Chave PIX', cmd: '/pix', text: 'Segue nossa chave PIX oficial: 81996138924 (Chave Telefone — Talvane Barber).' },
    { label: 'Serviços & Valores', cmd: '/servicos', text: 'Nossos principais serviços:\n• *Corte de Cabelo:* R$ 35,00\n• *Barba Terapia:* R$ 40,00\n• *Combo Cabelo + Barba:* R$ 70,00\n\nGostaria de agendar seu horário?' },
    { label: 'Agendamento', cmd: '/agendar', text: 'Perfeito! Para qual dia e horário você prefere agendar seu atendimento?' },
    { label: 'Atendente Humano', cmd: '/humano', text: 'Olá! Me chamo Talvane e sou o profissional responsável pelo seu atendimento. Como posso te auxiliar?' },
    { label: 'Agradecimento', cmd: '/obrigado', text: 'Muito obrigado pelo seu contato! Seu horário foi reservado com sucesso.' },
  ];

  const quickEmojis = ['👍', '👋', '😊', '🙏', '🚀', '✅', '📅', '💳', '⭐', '🔥', '✂️', '💈'];

  const filteredConversations = conversations.filter((c) => {
    const cName = c.contact?.name || c.contact_name || '';
    const cPhone = c.contact?.phone || c.contact_phone || '';
    const matchesSearch =
      cName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cPhone.includes(searchTerm);
    if (!matchesSearch) return false;
    if (filterStatus === 'all') return true;
    if (filterStatus === 'closed') return c.status === 'closed' || c.status === 'finished';
    return c.status === filterStatus;
  });

  return (
    <div className="h-[calc(100vh-7.5rem)] flex flex-col lg:flex-row gap-0 rounded-3xl overflow-hidden border border-white/10 bg-[#0c1317] shadow-2xl select-none animate-in fade-in duration-200">
      {/* 1. LEFT COLUMN: Chat List (WhatsApp Web Style) */}
      <div className="w-full lg:w-80 xl:w-96 bg-[#111b21] border-r border-white/5 flex flex-col flex-shrink-0">
        {/* Top Header */}
        <div className="p-3.5 bg-[#202c33] flex items-center justify-between border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-brand-500/20 border border-brand-500/40 flex items-center justify-center text-brand-400 font-bold text-xs">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-white tracking-tight">Atendimentos WhatsApp</h2>
              <p className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {isConnected ? 'WhatsApp Online' : 'Sincronizado'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => loadData(false)}
              className="p-2 rounded-full text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
              title="Atualizar Conversas"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="p-2.5 bg-[#111b21] border-b border-white/5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Pesquisar cliente ou telefone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#202c33] border-none rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          {/* Quick Filters */}
          <div className="flex gap-1.5 mt-2 overflow-x-auto pb-0.5 scrollbar-none">
            {[
              { id: 'all', label: 'Todas' },
              { id: 'bot', label: 'Robô' },
              { id: 'waiting_human', label: 'Aguardando' },
              { id: 'human', label: 'Atendente' },
              { id: 'closed', label: 'Finalizadas' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterStatus(tab.id)}
                className={`px-2.5 py-1 rounded-full text-[10px] font-semibold whitespace-nowrap transition-colors ${
                  filterStatus === tab.id
                    ? 'bg-[#00a884] text-white shadow-sm'
                    : 'bg-[#202c33] text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Conversation Items List */}
        <div className="flex-1 overflow-y-auto divide-y divide-white/5 custom-scrollbar">
          {isLoading ? (
            <div className="p-8 text-center text-xs text-slate-500 animate-pulse">
              Carregando conversas do WhatsApp...
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <MessageSquare className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-xs text-slate-400">Nenhuma conversa encontrada.</p>
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const isSelected = selectedConv?.id === conv.id;
              const contactName = conv.contact?.name || conv.contact_name || 'Cliente';
              const contactPhone = conv.contact?.phone || conv.contact_phone || '';

              return (
                <div
                  key={conv.id}
                  onClick={() => handleSelectConv(conv)}
                  className={`p-3.5 cursor-pointer transition-all flex items-start gap-3 relative ${
                    isSelected
                      ? 'bg-[#2a3942] border-l-4 border-l-[#00a884]'
                      : 'hover:bg-[#202c33]/60'
                  }`}
                >
                  <div className="w-11 h-11 rounded-full bg-[#374248] border border-white/10 flex items-center justify-center text-slate-200 font-bold text-xs flex-shrink-0 relative">
                    {contactName.substring(0, 2).toUpperCase()}
                    <span
                      className={`w-3 h-3 rounded-full absolute -bottom-0.5 -right-0.5 border-2 border-[#111b21] ${
                        conv.status === 'human'
                          ? 'bg-emerald-400'
                          : conv.status === 'waiting_human'
                          ? 'bg-amber-400 animate-ping'
                          : conv.status === 'closed'
                          ? 'bg-slate-500'
                          : 'bg-brand-500'
                      }`}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold text-white truncate">
                        {contactName}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono flex-shrink-0">
                        {formatTimeAgo(conv.last_message_at)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 mt-0.5">
                      <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb] flex-shrink-0" />
                      <p className="text-[11px] text-slate-400 truncate leading-tight">
                        {conv.last_message || 'Nenhuma mensagem recente'}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-1.5">
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider ${
                          conv.status === 'human'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : conv.status === 'waiting_human'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                            : conv.status === 'closed'
                            ? 'bg-slate-800 text-slate-400 border border-slate-700'
                            : 'bg-[#202c33] text-slate-300 border border-white/5'
                        }`}
                      >
                        {conv.status === 'human' ? 'Atendente' : conv.status === 'waiting_human' ? 'Aguardando' : conv.status === 'closed' ? 'Finalizada' : 'Robô'}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {formatPhone(contactPhone)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 2. CENTER COLUMN: Active Chat Panel (Authentic WhatsApp Theme) */}
      {selectedConv ? (
        <div className="flex-1 flex flex-col bg-[#0b141a] relative overflow-hidden">
          {/* WhatsApp Chat Top Header */}
          <div className="p-3 bg-[#202c33] border-b border-white/5 flex items-center justify-between z-10">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-[#374248] border border-white/10 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                {(selectedConv.contact?.name || selectedConv.contact_name || 'CL').substring(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-white flex items-center gap-2 truncate">
                  {selectedConv.contact?.name || selectedConv.contact_name || 'Cliente'}
                  <span className="text-[10px] text-slate-400 font-mono font-normal hidden sm:inline">
                    ({formatPhone(selectedConv.contact?.phone || selectedConv.contact_phone || '')})
                  </span>
                </h3>
                <p className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>online no WhatsApp</span>
                </p>
              </div>
            </div>

            {/* Quick Action Buttons in Top Header */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {selectedConv.status === 'human' ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-brand-500/20 text-brand-300 border-brand-500/30 hover:bg-brand-500/30 text-xs py-1 h-8"
                  leftIcon={<Bot className="w-3.5 h-3.5" />}
                  onClick={() => handleToggleTakeover('bot')}
                >
                  Reativar Robô
                </Button>
              ) : selectedConv.status === 'closed' ? (
                <Button
                  size="sm"
                  variant="brand"
                  className="text-xs py-1 h-8 bg-brand-600 hover:bg-brand-500"
                  leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                  onClick={() => handleToggleTakeover('human')}
                >
                  Reabrir Atendimento
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="brand"
                  className="text-xs py-1 h-8 bg-emerald-600 hover:bg-emerald-500"
                  leftIcon={<UserCheck className="w-3.5 h-3.5" />}
                  onClick={() => handleToggleTakeover('human')}
                >
                  Assumir Conversa
                </Button>
              )}

              {selectedConv.status !== 'closed' && (
                <button
                  onClick={() => handleToggleTakeover('closed')}
                  className="p-2 rounded-xl bg-dark-800 hover:bg-dark-750 text-slate-300 hover:text-white border border-white/10 text-xs flex items-center gap-1"
                  title="Finalizar e Arquivar Atendimento"
                >
                  <Archive className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">Finalizar</span>
                </button>
              )}

              <button
                onClick={() => setIsDeleteModalOpen(true)}
                className="p-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/40 text-xs"
                title="Excluir Histórico de Conversa"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setShowRightDrawer(!showRightDrawer)}
                className={`p-2 rounded-xl border transition-colors ${
                  showRightDrawer ? 'bg-[#00a884] text-white border-transparent' : 'bg-[#202c33] text-slate-400 border-white/10 hover:text-white'
                }`}
                title="Abrir Painel CRM & Gestão do Cliente"
              >
                <Sliders className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Chat Messages Body */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#0b141a] bg-opacity-95 custom-scrollbar">
            <div className="flex justify-center my-2">
              <div className="px-3 py-1 rounded-lg bg-[#182229] border border-white/5 text-[10px] text-amber-200/80 flex items-center gap-1.5 shadow-sm max-w-md text-center">
                <Lock className="w-3 h-3 text-amber-400 flex-shrink-0" />
                <span>As mensagens desta conversa são protegidas com criptografia de ponta a ponta pelo WhatsApp.</span>
              </div>
            </div>

            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-center p-8 text-xs text-slate-500">
                Inicie a conversa enviando uma mensagem abaixo ou selecione uma resposta rápida.
              </div>
            ) : (
              messages.map((msg, index) => {
                const isOutbound = msg.direction === 'outbound';
                const showAvatar =
                  index === 0 || messages[index - 1].direction !== msg.direction;

                return (
                  <div
                    key={msg.id || index}
                    className={`flex items-end gap-2 ${
                      isOutbound ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {!isOutbound && showAvatar && (
                      <div className="w-7 h-7 rounded-full bg-[#374248] flex items-center justify-center text-slate-200 font-bold text-[10px] flex-shrink-0">
                        {(selectedConv.contact?.name || selectedConv.contact_name || 'CL').substring(0, 1)}
                      </div>
                    )}
                    {!isOutbound && !showAvatar && <div className="w-7" />}

                    <div
                      className={`max-w-[75%] sm:max-w-[65%] rounded-2xl px-3.5 py-2 relative shadow-md text-xs leading-relaxed ${
                        isOutbound
                          ? 'bg-[#005c4b] text-white rounded-br-none'
                          : 'bg-[#202c33] text-slate-100 rounded-bl-none'
                      }`}
                    >
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
                  key={idx}
                  onClick={() => handleSendMessage(item.text)}
                  className="p-2 rounded-xl bg-[#111b21] hover:bg-[#2a3942] border border-white/5 text-left transition-colors space-y-0.5"
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
          <div className="p-3 bg-[#202c33] border-t border-white/5">
            {/* Quick Canned Suggestions Chips */}
            <div className="flex items-center gap-1.5 mb-2 overflow-x-auto scrollbar-none pb-0.5">
              <button
                onClick={() => setShowCannedMenu(!showCannedMenu)}
                className="px-2.5 py-1 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30 text-[10px] font-bold flex items-center gap-1 hover:bg-brand-500/30 whitespace-nowrap"
              >
                <Zap className="w-3 h-3" />
                Respostas Rápidas
              </button>
              {cannedReplies.slice(0, 4).map((reply, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(reply.text)}
                  className="px-2.5 py-1 rounded-full bg-[#111b21] text-slate-300 border border-white/5 text-[10px] hover:bg-[#2a3942] whitespace-nowrap"
                >
                  {reply.label}
                </button>
              ))}
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
                placeholder={
                  selectedConv.status === 'bot'
                    ? 'Digite sua mensagem no WhatsApp (Robô ativo)...'
                    : 'Digite sua mensagem no WhatsApp...'
                }
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="flex-1 bg-[#2a3942] border-none rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#00a884]"
              />

              <button
                type="submit"
                disabled={isSending || !inputText.trim()}
                className="p-2.5 rounded-full bg-[#00a884] hover:bg-[#009172] text-white disabled:opacity-50 transition-colors shadow-md"
                title="Enviar Mensagem"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#0b141a]">
          <div className="w-16 h-16 rounded-full bg-[#202c33] flex items-center justify-center text-slate-500 mb-4">
            <MessageSquare className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-white">Central de Atendimentos WhatsApp</h3>
          <p className="text-xs text-slate-400 max-w-sm mt-1">
            Selecione uma conversa à esquerda para atender clientes, gerenciar agendamentos e responder em tempo real.
          </p>
        </div>
      )}

      {/* 3. RIGHT COLUMN: Advanced CRM & Contact Management Panel (Toggleable) */}
      {selectedConv && showRightDrawer && (
        <div className="w-full lg:w-80 xl:w-88 bg-[#111b21] border-l border-white/5 flex flex-col flex-shrink-0 overflow-y-auto custom-scrollbar animate-in slide-in-from-right-3 duration-200">
          {/* Header */}
          <div className="p-3.5 bg-[#202c33] border-b border-white/5 flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <User className="w-4 h-4 text-emerald-400" />
              Dados do Cliente & CRM
            </span>
            <button
              onClick={() => setShowRightDrawer(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4 space-y-5">
            {/* Contact Profile Card */}
            <div className="text-center p-4 rounded-2xl bg-[#202c33] border border-white/5 space-y-2">
              <div className="w-14 h-14 rounded-full bg-[#374248] border-2 border-emerald-500/40 mx-auto flex items-center justify-center text-white font-bold text-base">
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

            {/* Internal Agent Notes (Private to operators) */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-white flex items-center gap-1.5">
                <Bookmark className="w-3.5 h-3.5 text-amber-400" />
                Notas Internas do Atendente:
              </label>
              <textarea
                value={agentNote}
                onChange={(e) => setAgentNote(e.target.value)}
                placeholder="Escreva observações internas sobre este cliente (invisível para ele)..."
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
    </div>
  );
};
