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
  ArrowRightLeft
} from 'lucide-react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Input, Textarea } from './ui/Input';
import { Conversation, Message, Contact, Store } from '../types';
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Carregar lojas
  useEffect(() => {
    async function loadStores() {
      const data = await StorageService.getStores();
      setStores(data);
    }
    loadStores();
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
              {/* Header do Chat */}
              <div className="p-3.5 border-b border-white/5 bg-dark-850 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-pitoco-blue/40 to-pitoco-pink/40 flex items-center justify-center text-white text-sm font-bold border border-white/10">
                    {(activeConv.contact_name || 'C')[0]}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      {activeConv.contact_name || 'Cliente WhatsApp'}
                      <span className="text-[10px] px-2 py-0.5 rounded bg-dark-800 text-pitoco-blue border border-white/5 font-normal">
                        {activeConv.store_name || 'Rede Geral'}
                      </span>
                    </h3>
                    <span className="text-[11px] text-slate-400">
                      {activeConv.contact_phone || activeConv.phone} • {activeConv.assigned_to ? `Atendido por: ${activeConv.assigned_to}` : 'Atendimento Automático'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {activeConv.status === 'human' ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleTransferToBot}
                      className="text-xs border-white/10 hover:bg-white/5 text-slate-300"
                    >
                      <Bot className="w-3.5 h-3.5 mr-1 text-pitoco-blue" />
                      Devolver ao Robô
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={handleAssumeConversation}
                      className="text-xs bg-pitoco-blue text-slate-900 font-bold hover:bg-pitoco-blue/90"
                    >
                      <UserCheck className="w-3.5 h-3.5 mr-1" />
                      Assumir Atendimento
                    </Button>
                  )}
                </div>
              </div>

              {/* Histórico de Mensagens */}
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
                        className={`flex flex-col ${isOutbound ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs shadow-md ${
                            isOutbound
                              ? 'bg-pitoco-blue text-slate-950 rounded-br-none font-medium'
                              : 'bg-dark-800 text-slate-200 border border-white/5 rounded-bl-none'
                          }`}
                        >
                          {!isOutbound && (
                            <span className="block text-[10px] text-pitoco-blue font-bold mb-1">
                              {msg.author_name || 'Cliente'}
                            </span>
                          )}
                          <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                          <span
                            className={`block text-[9px] mt-1 text-right ${
                              isOutbound ? 'text-slate-800' : 'text-slate-500'
                            }`}
                          >
                            Agora
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Atalhos Rápidos (Canned Replies) */}
              <div className="px-3 py-1.5 bg-dark-850/80 border-t border-white/5 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                <span className="text-[10px] text-slate-500 uppercase font-semibold shrink-0">
                  Respostas Rápidas:
                </span>
                {[
                  { label: '👋 Boas-vindas', text: 'Olá, mamãe! Como posso te ajudar a montar o enxoval perfeito hoje?' },
                  { label: '📏 Tamanhos RN/P', text: 'O tamanho RN veste até 4kg e o tamanho P veste de 4 a 6kg com muito conforto!' },
                  { label: '💳 Dados PIX', text: 'Chave PIX oficial: financeiro@pitocodegente.com.br (Pitoco de Gente Artigos Infantis)' },
                  { label: '🏬 Retirada Pronta', text: 'Seu pedido já foi separado e está prontinho para retirada na loja selecionada! 💕' },
                ].map((canned, i) => (
                  <button
                    key={i}
                    onClick={() => setInputText(canned.text)}
                    className="px-2.5 py-0.5 rounded-full text-[10px] bg-dark-800 hover:bg-white/10 text-slate-300 border border-white/5 shrink-0 transition-colors"
                  >
                    {canned.label}
                  </button>
                ))}
              </div>

              {/* Caixa de Entrada de Texto */}
              <form onSubmit={handleSendMessage} className="p-3 bg-dark-850 border-t border-white/5 flex items-center gap-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  placeholder="Digite sua resposta para o WhatsApp do cliente..."
                  className="flex-1 bg-dark-900 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pitoco-blue"
                />
                <Button
                  type="submit"
                  disabled={!inputText.trim() || isSending}
                  className="bg-pitoco-blue text-slate-900 hover:bg-pitoco-blue/90 px-4 py-2.5 rounded-xl font-bold text-xs shrink-0"
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
              <User className="w-3.5 h-3.5 text-pitoco-blue" />
              Perfil & Enxoval do Cliente
            </h3>
          </div>

          {activeConv ? (
            <div className="space-y-4 text-xs overflow-y-auto">
              {/* Card Resumo */}
              <div className="p-3 rounded-xl bg-dark-850 border border-white/5 text-center">
                <div className="w-14 h-14 rounded-full mx-auto bg-gradient-to-tr from-pitoco-blue to-pitoco-pink flex items-center justify-center text-slate-950 font-black text-xl mb-2">
                  {(activeConv.contact_name || 'C')[0]}
                </div>
                <h4 className="font-bold text-white text-sm">
                  {activeConv.contact_name || 'Cliente WhatsApp'}
                </h4>
                <p className="text-slate-400 text-xs mt-0.5">
                  {activeConv.contact_phone || activeConv.phone}
                </p>
                <div className="mt-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-pitoco-blue/20 text-pitoco-blue border border-pitoco-blue/30">
                    {activeConv.store_name || 'Loja Matriz Centro'}
                  </span>
                </div>
              </div>

              {/* Informações da Gestação & Bebê */}
              <div className="p-3 rounded-xl bg-dark-850 border border-white/5 space-y-2">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">
                  Informações da Mamãe
                </span>
                <div className="flex items-center justify-between text-slate-300">
                  <span>Nome do Bebê:</span>
                  <span className="font-bold text-white">{contactInfo?.baby_name || 'Theo'}</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>Data do Parto (DPP):</span>
                  <span className="font-medium text-pitoco-pink">{contactInfo?.due_date || 'Novembro / 2026'}</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>Compras Realizadas:</span>
                  <span className="font-bold text-emerald-400">{contactInfo?.total_orders || 3} pedidos</span>
                </div>
              </div>

              {/* Tags de CRM */}
              <div className="p-3 rounded-xl bg-dark-850 border border-white/5 space-y-2">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">
                  Tags & Preferências
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {(contactInfo?.tags || ['Enxoval Completo', 'VIP', 'Mala Maternidade']).map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-md text-[10px] bg-white/5 text-slate-300 border border-white/5"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Ações Rápidas */}
              <div className="pt-2 space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs border-white/10 hover:bg-white/5 text-slate-300 justify-center"
                  onClick={() => info('Ficha completa de CRM aberta')}
                >
                  <Calendar className="w-3.5 h-3.5 mr-1.5 text-pitoco-blue" />
                  Agendar Consultoria VIP
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center text-slate-500 text-xs py-8">
              Nenhum contato selecionado.
            </div>
          )}
        </Card>

      </div>
    </div>
  );
};
