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
  Building2, 
  Filter, 
  RefreshCw, 
  Smile, 
  Paperclip, 
  X, 
  Sparkles, 
  ShieldAlert, 
  ExternalLink,
  ChevronRight,
  ShoppingBag,
  Calendar,
  AlertCircle,
  HelpCircle,
  ArrowRightLeft,
  Trash2,
  Download,
  Eraser,
  UserPlus,
  Plus
} from 'lucide-react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Input, Textarea } from './ui/Input';
import { Conversation, Message, Contact, Store, SystemUser } from '../types';
import { StorageService } from '../lib/storage';
import { whatsappService } from '../lib/whatsappService';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import * as SupabaseService from '../lib/supabaseClient';

interface AtendimentoHumanoInboxProps {
  initialStoreId?: string | null;
  onNavigate?: (path: string) => void;
}

export const AtendimentoHumanoInbox: React.FC<AtendimentoHumanoInboxProps> = ({ 
  initialStoreId,
  onNavigate 
}) => {
  const { user } = useAuth();
  const { success, warning, error: toastError, info } = useToast();

  const [stores, setStores] = useState<Store[]>([]);
  const [attendants, setAttendants] = useState<SystemUser[]>([]);
  const [selectedStoreFilter, setSelectedStoreFilter] = useState<string>(initialStoreId || 'all');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [contactInfo, setContactInfo] = useState<Contact | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferTargetAttendant, setTransferTargetAttendant] = useState('');
  const [newTagInput, setNewTagInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Carregar lojas e atendentes cadastrados
  useEffect(() => {
    async function loadInitialData() {
      try {
        const [storesData, usersData] = await Promise.all([
          StorageService.getStores(),
          StorageService.getSystemUsers(),
        ]);
        setStores(storesData);
        setAttendants(usersData.filter(u => u.status !== 'inactive'));
      } catch (e) {
        console.error('Error loading initial inbox data:', e);
      }
    }
    loadInitialData();
  }, []);

  // Carregar conversas com filtro de loja
  const fetchConversations = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const filter = selectedStoreFilter === 'all' ? undefined : selectedStoreFilter;
      const data = await StorageService.getConversations(filter);
      setConversations(data);
      if (!activeConv && data.length > 0) {
        setActiveConv(data[0]);
      }
    } catch (err) {
      console.error('Error fetching conversations:', err);
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [selectedStoreFilter, activeConv]);

  useEffect(() => {
    fetchConversations(false);
    const interval = setInterval(() => fetchConversations(true), 4000);
    return () => clearInterval(interval);
  }, [fetchConversations]);

  // Carregar mensagens e contato da conversa selecionada
  useEffect(() => {
    if (!activeConv) {
      setMessages([]);
      setContactInfo(null);
      return;
    }

    let isMounted = true;
    async function loadConvData() {
      const [msgs, contacts] = await Promise.all([
        StorageService.getMessages(activeConv.id),
        StorageService.getContacts(),
      ]);
      if (isMounted) {
        setMessages(msgs);
        const contact = contacts.find(
          c => c.phone.replace(/\D/g, '') === (activeConv.contact_phone || activeConv.phone || '').replace(/\D/g, '')
        );
        setContactInfo(contact || null);
      }
    }
    loadConvData();

    // Supabase Realtime subscription para a conversa ativa
    const unsubscribe = SupabaseService.subscribeToMessages(activeConv.id, (newMsg) => {
      if (isMounted) {
        setMessages(prev => [...prev, newMsg]);
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [activeConv]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Enviar resposta pelo painel para o WhatsApp do cliente
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !activeConv || isSending) return;

    const textToSend = inputText.trim();
    setInputText('');
    setIsSending(true);

    const targetPhone = activeConv.contact_phone || activeConv.phone || '';
    const authorName = user?.name || 'Sofia Consultora VIP';

    // 1. Enviar mensagem de saída via WhatsApp microservice
    const sendResult = await whatsappService.sendMessage({
      phone: targetPhone,
      text: textToSend,
    });

    // 2. Persistir no banco de dados e estado local
    const newMsg = await StorageService.addMessage({
      conversation_id: activeConv.id,
      store_id: activeConv.store_id || null,
      direction: 'outbound',
      content: textToSend,
      author_name: authorName,
      status: sendResult.success ? 'delivered' : 'pending',
    });

    setMessages(prev => [...prev, newMsg]);

    // Se a conversa estava com o robô ou aguardando, assume como atendimento humano
    if (activeConv.status !== 'human') {
      await StorageService.updateConversationStatus(activeConv.id, 'human', activeConv.store_id || undefined);
      await StorageService.assignAttendant(activeConv.id, authorName);
      setActiveConv(prev => prev ? { ...prev, status: 'human', assigned_to: authorName } : null);
    }

    setIsSending(false);
    if (!sendResult.success) {
      warning('Mensagem salva no painel, mas o envio direto ao WhatsApp falhou. Verifique o QR Code.');
    }
  };

  // Transbordo: Devolver para o Robô
  const handleTransferToBot = async () => {
    if (!activeConv) return;
    await StorageService.updateConversationStatus(activeConv.id, 'bot');
    setActiveConv(prev => prev ? { ...prev, status: 'bot', assigned_to: null } : null);
    info('Conversa transferida de volta para o Robô Pitoco');
  };

  // Atribuir para mim (Consultora/Atendente)
  const handleAssumeConversation = async () => {
    if (!activeConv) return;
    const authorName = user?.name || 'Sofia Consultora VIP';
    await StorageService.updateConversationStatus(activeConv.id, 'human', activeConv.store_id || undefined);
    await StorageService.assignAttendant(activeConv.id, authorName);
    setActiveConv(prev => prev ? { ...prev, status: 'human', assigned_to: authorName } : null);
    success('Você assumiu este atendimento humano!', `Loja: ${activeConv.store_name || 'Rede Pitoco'}`);
  };

  // 1. Apagar Mensagem Individual
  const handleDeleteMessage = async (msgId: string) => {
    if (!activeConv) return;
    await StorageService.deleteMessage(activeConv.id, msgId);
    setMessages(prev => prev.filter(m => m.id !== msgId));
    info('Mensagem removida da conversa');
  };

  // 2. Limpar Histórico da Conversa
  const handleClearHistory = async () => {
    if (!activeConv) return;
    if (!window.confirm(`Tem certeza que deseja limpar todo o histórico com ${activeConv.contact_name || activeConv.phone}?`)) return;
    await StorageService.clearMessages(activeConv.id);
    setMessages([]);
    success('Histórico de mensagens limpo com sucesso');
  };

  // 3. Excluir Conversa Completa
  const handleDeleteConversation = async () => {
    if (!activeConv) return;
    if (!window.confirm(`Tem certeza que deseja excluir esta conversa com ${activeConv.contact_name || activeConv.phone}? Esta ação removerá a conversa da fila.`)) return;
    const convId = activeConv.id;
    await StorageService.deleteConversation(convId);
    setConversations(prev => prev.filter(c => c.id !== convId));
    setActiveConv(null);
    setMessages([]);
    success('Conversa excluída do painel');
  };

  // 4. Transferir Atendimento para Atendente / Filial
  const handleTransferConversation = async () => {
    if (!activeConv || !transferTargetAttendant) {
      warning('Selecione um atendente para transferir a conversa.');
      return;
    }
    const attendant = attendants.find(a => a.id === transferTargetAttendant || (a.name || a.username) === transferTargetAttendant);
    const attendantName = attendant ? (attendant.name || attendant.username) : transferTargetAttendant;

    await StorageService.transferConversation(
      activeConv.id,
      attendant?.id || `att-${Date.now()}`,
      attendantName,
      activeConv.store_id || undefined,
      activeConv.store_name
    );

    setActiveConv(prev => prev ? {
      ...prev,
      assigned_to: attendantName,
      assigned_attendant_name: attendantName,
      status: 'waiting_human',
    } : null);

    setConversations(prev => prev.map(c => c.id === activeConv.id ? {
      ...c,
      assigned_to: attendantName,
      assigned_attendant_name: attendantName,
      status: 'waiting_human',
    } : c));

    setIsTransferModalOpen(false);
    success(`Conversa transferida com sucesso para ${attendantName}`);
  };

  // 5. Salvar / Exportar Transcrição (.txt)
  const handleExportTranscript = () => {
    if (!activeConv) return;
    const lines = [
      '====================================================================',
      'PITOCO DE GENTE — TRANSCRIÇÃO OFICIAL DE ATENDIMENTO WHATSAPP',
      `Cliente: ${activeConv.contact_name || 'Desconhecido'} (${activeConv.contact_phone || activeConv.phone})`,
      `Filial: ${activeConv.store_name || 'Rede Geral'}`,
      `Status: ${activeConv.status}`,
      `Atendente Responsável: ${activeConv.assigned_to || activeConv.assigned_attendant_name || 'Robô Pitoco'}`,
      `Data do Export: ${new Date().toLocaleString('pt-BR')}`,
      '====================================================================\n',
    ];

    messages.forEach(m => {
      const time = m.created_at ? new Date(m.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '00:00';
      const sender = m.direction === 'inbound' 
        ? (activeConv.contact_name || 'Cliente') 
        : (m.author_name || 'Atendente');
      lines.push(`[${time}] [${sender}]: ${m.content}`);
    });

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcript_${(activeConv.contact_name || activeConv.phone || 'conversa').replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    success('Transcrição da conversa baixada com sucesso!');
  };

  // 6. Tags do Cliente: Adicionar e Remover
  const handleAddTag = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newTagInput.trim() && activeConv) {
      e.preventDefault();
      const currentTags = contactInfo?.tags || [];
      const tagClean = newTagInput.trim();
      if (!currentTags.includes(tagClean)) {
        const updatedTags = [...currentTags, tagClean];
        const updatedContact = await StorageService.saveContact({
          id: contactInfo?.id,
          phone: activeConv.contact_phone || activeConv.phone,
          name: activeConv.contact_name,
          tags: updatedTags,
        });
        setContactInfo(updatedContact);
        success(`Tag "${tagClean}" vinculada ao cliente`);
      }
      setNewTagInput('');
    }
  };

  const handleRemoveTag = async (tagToRemove: string) => {
    if (!activeConv || !contactInfo) return;
    const updatedTags = (contactInfo.tags || []).filter(t => t !== tagToRemove);
    const updatedContact = await StorageService.saveContact({
      ...contactInfo,
      tags: updatedTags,
    });
    setContactInfo(updatedContact);
    info(`Tag "${tagToRemove}" removida`);
  };

  // Filtragem de conversas
  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = 
      (conv.contact_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (conv.contact_phone || conv.phone || '').includes(searchTerm) ||
      (conv.last_message || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || conv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col gap-4">
      {/* Header & Filtros Globais de Loja */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-dark-900 border border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-pitoco-blue/20 border border-pitoco-blue/30 flex items-center justify-center text-pitoco-blue">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              Inbox de Atendimento Humano
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-normal">
                Tempo Real
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Transbordo de conversas do WhatsApp com direcionamento por filial
            </p>
          </div>
        </div>

        {/* Filtro por Loja */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 hidden sm:inline">Filtrar por Loja:</span>
          <div className="flex items-center bg-dark-800 rounded-lg p-1 border border-white/5">
            <button
              onClick={() => setSelectedStoreFilter('all')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                selectedStoreFilter === 'all'
                  ? 'bg-pitoco-blue text-slate-900'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Todas as Lojas
            </button>
            {stores.map(s => (
              <button
                key={s.id}
                onClick={() => setSelectedStoreFilter(s.id)}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                  selectedStoreFilter === s.id
                    ? 'bg-pitoco-blue text-slate-900'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {s.slug === 'matriz' ? 'Matriz Centro' : s.slug === 'boulevard' ? 'Boulevard' : 'E-commerce'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Split Layout: Chats List + Active Chat + CRM Sidebar */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-4 min-h-0">
        
        {/* Coluna Esquerda: Lista de Conversas (4 colunas) */}
        <Card className="md:col-span-4 flex flex-col h-full bg-dark-900 border-white/10 overflow-hidden">
          {/* Busca & Filtro de Status */}
          <div className="p-3 border-b border-white/5 space-y-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar cliente ou mensagem..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-dark-800 border border-white/5 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pitoco-blue"
              />
            </div>

            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pt-1">
              {[
                { id: 'all', label: 'Todos' },
                { id: 'waiting_human', label: 'Aguardando ⏳' },
                { id: 'human', label: 'Em Atendimento 👩‍💼' },
                { id: 'bot', label: 'Robô 🤖' },
              ].map(st => (
                <button
                  key={st.id}
                  onClick={() => setStatusFilter(st.id)}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded-full shrink-0 transition-colors ${
                    statusFilter === st.id
                      ? 'bg-white/15 text-white border border-white/20'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* Lista Rolável */}
          <div className="flex-1 overflow-y-auto divide-y divide-white/5">
            {filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                Nenhuma conversa encontrada neste filtro.
              </div>
            ) : (
              filteredConversations.map(conv => {
                const isActive = activeConv?.id === conv.id;
                const isWaiting = conv.status === 'waiting_human';
                return (
                  <div
                    key={conv.id}
                    onClick={() => setActiveConv(conv)}
                    className={`p-3.5 cursor-pointer transition-colors relative ${
                      isActive 
                        ? 'bg-white/[0.06] border-l-2 border-pitoco-blue' 
                        : 'hover:bg-white/[0.02]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-pitoco-blue/30 to-pitoco-pink/30 flex items-center justify-center text-white text-xs font-bold border border-white/10">
                          {(conv.contact_name || 'C')[0]}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-white truncate max-w-[140px]">
                            {conv.contact_name || 'Cliente WhatsApp'}
                          </h4>
                          <span className="text-[10px] text-slate-400">
                            {conv.contact_phone || conv.phone}
                          </span>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div>
                        {isWaiting && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">
                            Aguardando
                          </span>
                        )}
                        {conv.status === 'human' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/20 text-emerald-300">
                            Humano
                          </span>
                        )}
                        {conv.status === 'bot' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-zinc-800 text-zinc-300 border border-zinc-700/60">
                            Robô
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-300 truncate mt-1 line-clamp-1">
                      {conv.last_message || 'Início da conversa'}
                    </p>

                    <div className="flex items-center justify-between mt-2 pt-1 border-t border-white/[0.03] text-[10px] text-slate-500">
                      <span className="text-pitoco-blue font-medium truncate max-w-[150px]">
                        📍 {conv.store_name || 'Rede Geral'}
                      </span>
                      <span>Hoje</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>

        {/* Coluna Central: Chat em Tempo Real (5 colunas) */}
        <Card className="md:col-span-5 flex flex-col h-full bg-dark-900 border-white/10 overflow-hidden">
          {activeConv ? (
            <>
              {/* Header do Chat com Ações Avançadas */}
              <div className="p-3.5 border-b border-white/5 bg-dark-850 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-white/20 to-white/5 flex items-center justify-center text-white text-sm font-bold border border-white/10 shrink-0">
                    {(activeConv.contact_name || 'C')[0]}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2 truncate">
                      <span className="truncate">{activeConv.contact_name || 'Cliente WhatsApp'}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-dark-800 text-zinc-300 border border-white/5 font-normal shrink-0">
                        {activeConv.store_name || 'Rede Geral'}
                      </span>
                    </h3>
                    <span className="text-[11px] text-slate-400 block truncate">
                      {activeConv.contact_phone || activeConv.phone} • {activeConv.assigned_to ? `Atendente: ${activeConv.assigned_to}` : 'Robô Automático'}
                    </span>
                  </div>
                </div>

                {/* Toolbar de Ações do Admin / Atendimento */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {activeConv.status === 'human' ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleTransferToBot}
                      className="text-xs border-white/10 hover:bg-white/5 text-slate-300 h-8 px-2.5"
                      title="Devolver controle para o Robô Pitoco"
                    >
                      <Bot className="w-3.5 h-3.5 mr-1 text-zinc-300" />
                      Robô
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={handleAssumeConversation}
                      className="text-xs bg-white text-black font-semibold hover:bg-zinc-200 h-8 px-2.5"
                    >
                      <UserCheck className="w-3.5 h-3.5 mr-1" />
                      Assumir
                    </Button>
                  )}

                  {/* Transferir para outro Atendente */}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsTransferModalOpen(true)}
                    className="text-xs border-white/10 hover:bg-white/5 text-slate-300 h-8 px-2.5"
                    title="Transferir conversa para outro atendente"
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5 mr-1 text-zinc-400" />
                    Transferir
                  </Button>

                  {/* Baixar Transcrição (.txt) */}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleExportTranscript}
                    className="text-xs border-white/10 hover:bg-white/5 text-slate-300 h-8 px-2.5"
                    title="Salvar transcrição da conversa (.txt)"
                  >
                    <Download className="w-3.5 h-3.5 mr-1 text-zinc-400" />
                    Transcrição
                  </Button>

                  {/* Limpar Histórico */}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleClearHistory}
                    className="text-xs border-white/10 hover:bg-amber-500/10 text-amber-400 border-amber-500/20 h-8 px-2"
                    title="Limpar todas as mensagens desta conversa"
                  >
                    <Eraser className="w-3.5 h-3.5" />
                  </Button>

                  {/* Excluir Conversa */}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleDeleteConversation}
                    className="text-xs border-red-500/30 hover:bg-red-500/10 text-red-400 h-8 px-2"
                    title="Excluir esta conversa definitivamente"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              {/* Histórico de Mensagens com opção de apagar mensagem individual */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-dark-950/60">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs gap-2">
                    <MessageSquare className="w-8 h-8 text-slate-600" />
                    <span>Nenhuma mensagem nesta conversa ainda.</span>
                  </div>
                ) : (
                  messages.map(msg => {
                    const isOutbound = msg.direction === 'outbound';
                    return (
                      <div
                        key={msg.id}
                        className={`group flex flex-col ${isOutbound ? 'items-end' : 'items-start'} relative`}
                      >
                        <div
                          className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs shadow-md relative group/msg ${
                            isOutbound
                              ? 'bg-zinc-800 text-white rounded-br-none font-medium border border-zinc-700/60'
                              : 'bg-dark-800 text-slate-200 border border-white/5 rounded-bl-none'
                          }`}
                        >
                          {/* Botão de apagar mensagem individual no hover */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm('Deseja apagar esta mensagem individual?')) {
                                handleDeleteMessage(msg.id);
                              }
                            }}
                            title="Apagar esta mensagem"
                            className="absolute -top-2 -right-2 p-1 rounded-full bg-dark-900 border border-red-500/40 text-red-400 opacity-0 group-hover/msg:opacity-100 hover:bg-red-500/20 transition-all shadow-md z-10"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>

                          {!isOutbound && (
                            <span className="block text-[10px] text-zinc-400 font-bold mb-1">
                              {msg.author_name || 'Cliente'}
                            </span>
                          )}
                          <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                          <span
                            className={`block text-[9px] mt-1 text-right ${
                              isOutbound ? 'text-zinc-400' : 'text-slate-500'
                            }`}
                          >
                            {msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Agora'}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Caixa de Entrada de Texto (sem respostas rápidas, conforme solicitado) */}
              <form onSubmit={handleSendMessage} className="p-3 bg-dark-850 border-t border-white/5 flex items-center gap-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  placeholder="Digite sua resposta para o WhatsApp do cliente..."
                  className="flex-1 bg-dark-900 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-white/30"
                />
                <Button
                  type="submit"
                  disabled={!inputText.trim() || isSending}
                  className="bg-white text-black hover:bg-zinc-200 px-4 py-2.5 rounded-xl font-bold text-xs shrink-0"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs">
              Selecione uma conversa para iniciar o atendimento humano.
            </div>
          )}
        </Card>

        {/* Coluna Direita: Detalhes do Cliente CRM & Enxoval (3 colunas) */}
        <Card className="md:col-span-3 flex flex-col h-full bg-dark-900 border-white/10 overflow-hidden p-4">
          <div className="border-b border-white/5 pb-3 mb-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-white" />
              Perfil & CRM do Cliente
            </h3>
          </div>

          {activeConv ? (
            <div className="space-y-4 text-xs overflow-y-auto">
              {/* Card Resumo */}
              <div className="p-3 rounded-xl bg-dark-850 border border-white/5 text-center">
                <div className="w-14 h-14 rounded-full mx-auto bg-zinc-800 border border-white/10 flex items-center justify-center text-white font-black text-xl mb-2">
                  {(activeConv.contact_name || 'C')[0]}
                </div>
                <h4 className="font-bold text-white text-sm">
                  {activeConv.contact_name || 'Cliente WhatsApp'}
                </h4>
                <p className="text-slate-400 text-xs mt-0.5">
                  {activeConv.contact_phone || activeConv.phone}
                </p>
                <div className="mt-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/10 text-zinc-300 border border-white/10">
                    {activeConv.store_name || 'Loja Matriz Centro'}
                  </span>
                </div>
              </div>

              {/* Informações do Cliente */}
              <div className="p-3 rounded-xl bg-dark-850 border border-white/5 space-y-2">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">
                  Informações Adicionais
                </span>
                <div className="flex items-center justify-between text-slate-300">
                  <span>Nome do Bebê:</span>
                  <span className="font-bold text-white">{contactInfo?.baby_name || 'Theo'}</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>Data Prevista (DPP):</span>
                  <span className="font-medium text-zinc-300">{contactInfo?.due_date || 'Novembro / 2026'}</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>Status do Atendimento:</span>
                  <span className="font-bold text-emerald-400 capitalize">{activeConv.status}</span>
                </div>
              </div>

              {/* Gerenciamento de Tags Dinâmicas */}
              <div className="p-3 rounded-xl bg-dark-850 border border-white/5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">
                    Tags do Cliente
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {contactInfo?.tags?.length || 0} tag(s)
                  </span>
                </div>

                {/* Lista de Tags com botão de remover */}
                <div className="flex flex-wrap gap-1.5 min-h-[30px]">
                  {(contactInfo?.tags || ['Enxoval Completo', 'VIP', 'Mala Maternidade']).map((tag, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] bg-white/5 text-slate-300 border border-white/10 hover:border-white/20 transition-all"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="text-slate-500 hover:text-red-400 transition-colors ml-0.5"
                        title={`Remover tag "${tag}"`}
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </span>
                  ))}
                </div>

                {/* Adicionar Nova Tag */}
                <div className="flex items-center gap-1.5 pt-1">
                  <input
                    type="text"
                    placeholder="Nova tag..."
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    className="flex-1 bg-dark-900 border border-white/10 rounded-lg px-2.5 py-1 text-[11px] text-white placeholder-slate-500 focus:outline-none focus:border-white/30"
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                    title="Adicionar tag ao cliente"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-slate-500 text-xs py-8">
              Nenhum contato selecionado.
            </div>
          )}
        </Card>

      </div>

      {/* Modal de Transferência de Atendimento */}
      {isTransferModalOpen && activeConv && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-dark-900 border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-white/10 text-white">
                  <ArrowRightLeft className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Transferir Atendimento</h3>
                  <p className="text-xs text-slate-400">Direcionar conversa para outro atendente ou filial</p>
                </div>
              </div>
              <button 
                onClick={() => setIsTransferModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Cliente:</label>
                <div className="p-2.5 rounded-lg bg-dark-850 border border-white/5 text-white font-medium">
                  {activeConv.contact_name || 'Cliente WhatsApp'} ({activeConv.contact_phone || activeConv.phone})
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Atendente / Responsável Destino:</label>
                <select
                  value={transferTargetAttendant}
                  onChange={(e) => setTransferTargetAttendant(e.target.value)}
                  className="w-full bg-dark-850 border border-white/10 rounded-lg px-3 py-2.5 text-white text-xs focus:outline-none focus:border-white/30"
                >
                  <option value="">Selecione um atendente cadastrado...</option>
                  {attendants.map((att) => (
                    <option key={att.id} value={att.name || att.username}>
                      {att.name || att.username} ({att.role.toUpperCase()})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  A conversa será movida para a fila do atendente selecionado com notificação de espera.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsTransferModalOpen(false)}
                className="border-white/10 hover:bg-white/5 text-slate-300 text-xs"
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={handleTransferConversation}
                disabled={!transferTargetAttendant}
                className="bg-white text-black hover:bg-zinc-200 font-bold text-xs"
              >
                Confirmar Transferência
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
