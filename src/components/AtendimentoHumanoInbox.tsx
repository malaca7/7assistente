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
  Plus,
  Edit3,
  Lock,
  RotateCcw,
  Eye,
  Layers,
  FileText,
  DollarSign
} from 'lucide-react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Input, Textarea } from './ui/Input';
import { Conversation, Message, Contact, Store, SystemUser, Product } from '../types';
import { StorageService } from '../lib/storage';
import { whatsappService } from '../lib/whatsappService';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import * as SupabaseService from '../lib/supabaseClient';

interface AtendimentoHumanoInboxProps {
  initialStoreId?: string | null;
  onNavigate?: (path: string) => void;
  portalMode?: 'admin' | 'gerente' | 'atendimento';
}

// Utilitário de deduplicação estrita de mensagens para evitar clones visuais
const deduplicateMessages = (msgs: Message[]): Message[] => {
  const seenIds = new Set<string>();
  const result: Message[] = [];

  for (const m of msgs) {
    if (m.id && seenIds.has(m.id)) continue;

    // Verificar se já existe mensagem recente com mesmo conteúdo e mesma direção (dentro de 4 segundos)
    const isDuplicateRecent = result.some(prev => {
      if (prev.direction !== m.direction) return false;
      if ((prev.content || '').trim() !== (m.content || '').trim()) return false;
      const tPrev = new Date(prev.created_at || '').getTime();
      const tCurr = new Date(m.created_at || '').getTime();
      if (!isNaN(tPrev) && !isNaN(tCurr) && Math.abs(tCurr - tPrev) < 4000) {
        return true;
      }
      return false;
    });

    if (isDuplicateRecent) continue;

    if (m.id) seenIds.add(m.id);
    result.push(m);
  }
  return result;
};

export const AtendimentoHumanoInbox: React.FC<AtendimentoHumanoInboxProps> = ({ 
  initialStoreId,
  onNavigate,
  portalMode = 'admin',
}) => {
  const { user, isCEO, isManager, hasAdminAccess } = useAuth();
  const { success, warning, error: toastError, info } = useToast();

  // Controle de permissões estrito para os 3 painéis
  const isAttendantMode = portalMode === 'atendimento' || (!hasAdminAccess && !isCEO && !isManager && user?.role === 'attendant');
  const isAdmin = portalMode === 'admin' || isCEO || user?.role === 'admin' || user?.panels?.includes('admin');
  const canAdminDestructive = !isAttendantMode && (isCEO || isManager || isAdmin);
  const canEditClient = !isAttendantMode && canAdminDestructive;

  const [stores, setStores] = useState<Store[]>([]);
  const [attendants, setAttendants] = useState<SystemUser[]>([]);
  const [sectors, setSectors] = useState<string[]>([]);
  const [selectedStoreFilter, setSelectedStoreFilter] = useState<string>(initialStoreId || 'all');
  const [selectedSectorFilter, setSelectedSectorFilter] = useState<string>('all');
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

  // Modal do Catálogo de Peças / Envio no WhatsApp
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
  const [catalogProducts, setCatalogProducts] = useState<Product[]>([]);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [selectedCatalogCategory, setSelectedCatalogCategory] = useState('all');
  const [isSendingProduct, setIsSendingProduct] = useState(false);

  // Notas Internas (Atendimento vs Confidencial Admin)
  const [newNoteText, setNewNoteText] = useState('');
  const [newNoteVisibility, setNewNoteVisibility] = useState<'all' | 'admin_only'>('all');
  
  // Modal de Edição de Dados do Cliente CRM
  const [isEditClientModalOpen, setIsEditClientModalOpen] = useState(false);
  const [clientForm, setClientForm] = useState({
    name: '',
    phone: '',
    baby_name: '',
    due_date: '',
    store_id: '',
    email: '',
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Carregar lojas, atendentes e setores cadastrados
  useEffect(() => {
    async function loadInitialData() {
      try {
        const [storesData, usersData] = await Promise.all([
          StorageService.getStores(),
          StorageService.getSystemUsers(),
        ]);
        setStores(storesData);
        setAttendants(usersData.filter(u => u.status !== 'inactive'));
        setSectors(StorageService.getSectors());
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
        // Encontrar a primeira conversa válida (não deletada por padrão)
        const firstValid = data.find(c => !c.is_deleted) || data[0];
        setActiveConv(firstValid);
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
        setMessages(deduplicateMessages(msgs));
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
        setMessages(prev => deduplicateMessages([...prev, newMsg]));
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
    const authorName = user?.name || (isAttendantMode ? 'Atendente Pitoco' : 'Sofia Consultora VIP');

    // 1. Enviar mensagem de saída via WhatsApp microservice
    const sendResult = await whatsappService.sendMessage({
      phone: targetPhone,
      text: textToSend,
    });

    // 2. Persistir no banco de dados e estado local oficial
    const newMsg = await StorageService.addMessage({
      conversation_id: activeConv.id,
      store_id: activeConv.store_id || null,
      direction: 'outbound',
      content: textToSend,
      author_name: authorName,
      status: sendResult.success ? 'delivered' : 'pending',
    });

    setMessages(prev => deduplicateMessages([...prev, newMsg]));

    // 3. Auto-assumir o atendimento humano se não estiver atribuído
    await StorageService.updateConversationStatus(activeConv.id, 'human', activeConv.store_id || undefined);
    await StorageService.assignAttendant(activeConv.id, authorName);
    setActiveConv(prev => prev ? { ...prev, status: 'human', assigned_to: authorName } : null);
    setConversations(prev => prev.map(c => c.id === activeConv.id ? { ...c, status: 'human', assigned_to: authorName } : c));

    setIsSending(false);
    if (!sendResult.success) {
      warning('Mensagem salva no painel, mas o envio direto ao WhatsApp falhou. Verifique o QR Code.');
    }
  };

  // Abrir modal do catálogo de peças
  const handleOpenCatalog = async () => {
    setIsCatalogModalOpen(true);
    try {
      const prods = await StorageService.getProducts(activeConv?.store_id || undefined);
      setCatalogProducts(prods.filter(p => p.is_active));
    } catch (e) {
      console.error('Error loading catalog products:', e);
    }
  };

  // Enviar peça do catálogo com foto e detalhes para a conversa do cliente
  const handleSendProductToChat = async (product: Product) => {
    if (!activeConv || isSendingProduct) return;
    setIsSendingProduct(true);
    const targetPhone = activeConv.contact_phone || activeConv.phone || '';
    const authorName = user?.name || (isAttendantMode ? 'Atendente Pitoco' : 'Consultora Pitoco');

    const formattedText = `🛍️ *${product.name}*\n` +
      `💰 *Preço:* R$ ${product.price.toFixed(2)}${product.promotional_price ? ` (Promoção: R$ ${product.promotional_price.toFixed(2)})` : ''}\n` +
      `📏 *Tamanhos disponíveis:* ${(product.sizes || []).join(', ') || 'Sob consulta'}\n` +
      (product.material ? `🧵 *Material:* ${product.material}\n` : '') +
      (product.description ? `📝 *Detalhes:* ${product.description}\n` : '') +
      (product.image_url ? `🖼️ *Foto da peça:* ${product.image_url}` : '');

    try {
      // 1. Enviar via Baileys WhatsApp
      const sendResult = await whatsappService.sendMessage({
        phone: targetPhone,
        text: formattedText,
        mediaUrl: product.image_url,
        caption: `🛍️ *${product.name}* - R$ ${product.price.toFixed(2)}`,
      });

      // 2. Persistir mensagem na conversa
      const newMsg = await StorageService.addMessage({
        conversation_id: activeConv.id,
        store_id: activeConv.store_id || null,
        direction: 'outbound',
        content: formattedText,
        media_url: product.image_url,
        author_name: authorName,
        status: sendResult.success ? 'delivered' : 'pending',
      });

      setMessages(prev => deduplicateMessages([...prev, newMsg]));

      // 3. Auto-assumir o atendimento
      await StorageService.updateConversationStatus(activeConv.id, 'human', activeConv.store_id || undefined);
      await StorageService.assignAttendant(activeConv.id, authorName);
      setActiveConv(prev => prev ? { ...prev, status: 'human', assigned_to: authorName } : null);
      setConversations(prev => prev.map(c => c.id === activeConv.id ? { ...c, status: 'human', assigned_to: authorName } : c));

      setIsCatalogModalOpen(false);
      success('Peça enviada com sucesso!', `"${product.name}" enviada para o WhatsApp de ${activeConv.contact_name || activeConv.phone}.`);
    } catch (err: any) {
      toastError('Erro ao enviar peça', err?.message || 'Falha ao enviar produto.');
    } finally {
      setIsSendingProduct(false);
    }
  };

  // Alterar Setor de Atendimento
  const handleSectorChange = async (newSector: string) => {
    if (!activeConv) return;
    await StorageService.updateConversationSector(activeConv.id, newSector);
    setActiveConv(prev => prev ? { ...prev, sector: newSector } : null);
    setConversations(prev => prev.map(c => c.id === activeConv.id ? { ...c, sector: newSector } : c));
    success('Setor Atualizado', `Conversa direcionada para o setor "${newSector}".`);
  };

  // Transbordo: Devolver para o Robô
  const handleTransferToBot = async () => {
    if (!activeConv) return;
    await StorageService.updateConversationStatus(activeConv.id, 'bot', activeConv.store_id || undefined, null);
    const updated: Conversation = { 
      ...activeConv, 
      status: 'bot', 
      assigned_to: null, 
      assigned_attendant_name: null, 
      assigned_attendant_id: null,
      updated_at: new Date().toISOString() 
    };
    setActiveConv(updated);
    setConversations(prev => prev.map(c => c.id === activeConv.id ? updated : c));
    info('Conversa transferida de volta para o Robô Pitoco');
  };

  // Atribuir para mim (Consultora/Atendente/Gerente/Admin)
  const handleAssumeConversation = async (targetConv?: Conversation) => {
    const conv = targetConv || activeConv;
    if (!conv) return;
    const authorName = user?.name || (isCEO ? 'Malaca CEO' : isAdmin ? 'Administrador Geral' : isManager ? 'Gerente' : 'Sofia Consultora VIP');
    const authorId = user?.id || `user-${user?.username || 'attendant'}`;

    await StorageService.updateConversationStatus(conv.id, 'human', conv.store_id || undefined, authorName);
    await StorageService.assignAttendant(conv.id, authorName, authorId);

    const updated: Conversation = { 
      ...conv, 
      status: 'human', 
      assigned_to: authorName, 
      assigned_attendant_name: authorName,
      assigned_attendant_id: authorId,
      updated_at: new Date().toISOString()
    };

    if (!activeConv || activeConv.id === conv.id) {
      setActiveConv(updated);
    }
    setConversations(prev => prev.map(c => c.id === conv.id ? updated : c));
    success('Você assumiu este atendimento humano!', `Operador responsável: ${authorName}`);
  };

  // 1. Apagar Mensagem Individual (Restrito a Admin/Gerente)
  const handleDeleteMessage = async (msgId: string) => {
    if (!activeConv) return;
    if (!canAdminDestructive) {
      warning('Ação Restrita', 'O painel de atendimento não tem permissão para apagar mensagens.');
      return;
    }
    await StorageService.deleteMessage(activeConv.id, msgId);
    setMessages(prev => prev.filter(m => m.id !== msgId));
    info('Mensagem removida da conversa');
  };

  // 2. Limpar Histórico da Conversa (Restrito a Admin/Gerente)
  const handleClearHistory = async () => {
    if (!activeConv) return;
    if (!canAdminDestructive) {
      warning('Ação Restrita', 'O painel de atendimento não tem permissão para limpar o histórico.');
      return;
    }
    if (!window.confirm(`Tem certeza que deseja limpar todo o histórico com ${activeConv.contact_name || activeConv.phone}?`)) return;
    await StorageService.clearMessages(activeConv.id);
    setMessages([]);
    success('Histórico de mensagens limpo com sucesso');
  };

  // 3. Mover Conversa para a Lixeira (Apenas Admin/Gerente)
  const handleDeleteConversation = async () => {
    if (!activeConv) return;
    if (!canAdminDestructive) {
      warning('Ação Restrita', 'O painel de atendimento não tem permissão para apagar conversas.');
      return;
    }
    if (!window.confirm(`Deseja mover a conversa com ${activeConv.contact_name || activeConv.phone} para a Lixeira?`)) return;
    const convId = activeConv.id;
    await StorageService.deleteConversation(convId);
    setConversations(prev => prev.map(c => c.id === convId ? { ...c, is_deleted: true, deleted_at: new Date().toISOString() } : c));
    setActiveConv(prev => prev ? { ...prev, is_deleted: true, deleted_at: new Date().toISOString() } : null);
    success('Conversa movida para a Lixeira');
  };

  // 4. Restaurar Conversa da Lixeira (Apenas Admin)
  const handleRestoreConversation = async (convId: string) => {
    if (!canAdminDestructive) return;
    await StorageService.restoreConversation(convId);
    setConversations(prev => prev.map(c => c.id === convId ? { ...c, is_deleted: false, deleted_at: undefined } : c));
    if (activeConv?.id === convId) {
      setActiveConv(prev => prev ? { ...prev, is_deleted: false, deleted_at: undefined } : null);
    }
    success('Conversa restaurada da Lixeira!');
  };

  // 5. Excluir Definitivamente da Lixeira (Apenas Admin)
  const handlePurgeConversation = async (convId: string) => {
    if (!canAdminDestructive) return;
    if (!window.confirm('Atenção: Esta ação é definitiva e removerá permanentemente todos os dados desta conversa. Continuar?')) return;
    await StorageService.purgeConversation(convId);
    setConversations(prev => prev.filter(c => c.id !== convId));
    if (activeConv?.id === convId) {
      setActiveConv(null);
      setMessages([]);
    }
    success('Conversa excluída permanentemente.');
  };

  // 6. Transferir Atendimento para Atendente / Filial
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

    const updated = {
      ...activeConv,
      assigned_to: attendantName,
      assigned_attendant_name: attendantName,
      status: 'waiting_human' as const,
    };

    setActiveConv(updated);
    setConversations(prev => prev.map(c => c.id === activeConv.id ? updated : c));
    setIsTransferModalOpen(false);
    success(`Conversa transferida com sucesso para ${attendantName}`);
  };

  // 7. Salvar / Exportar Transcrição (.txt)
  const handleExportTranscript = () => {
    if (!activeConv) return;
    const lines = [
      '====================================================================',
      'PITOCO DE GENTE — TRANSCRIÇÃO OFICIAL DE ATENDIMENTO WHATSAPP',
      `Cliente: ${activeConv.contact_name || 'Desconhecido'} (${activeConv.contact_phone || activeConv.phone})`,
      `Filial: ${activeConv.store_name || 'Rede Geral'}`,
      `Setor: ${activeConv.sector || 'Vendas & Enxoval'}`,
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

  // 8. Tags do Cliente (Apenas Admin/Gerente podem editar)
  const handleAddTag = async (e?: React.KeyboardEvent | React.MouseEvent) => {
    if (e && 'key' in e && e.key !== 'Enter') return;
    if (e && 'preventDefault' in e) e.preventDefault();
    if (!canEditClient) {
      warning('Ação Restrita', 'O painel de atendimento não tem permissão para gerenciar tags.');
      return;
    }

    const tagClean = newTagInput.trim();
    if (!tagClean || !activeConv) return;

    const currentTags = contactInfo?.tags || [];
    if (!currentTags.includes(tagClean)) {
      const updatedTags = [...currentTags, tagClean];
      try {
        const updatedContact = await StorageService.saveContact({
          id: contactInfo?.id,
          phone: activeConv.contact_phone || activeConv.phone,
          name: activeConv.contact_name || 'Cliente WhatsApp',
          tags: updatedTags,
          store_id: activeConv.store_id,
          store_name: activeConv.store_name,
        });
        setContactInfo(updatedContact);
        success(`Tag "${tagClean}" vinculada ao cliente`);
      } catch (err) {
        console.error('Erro ao salvar tag:', err);
      }
    }
    setNewTagInput('');
  };

  const handleRemoveTag = async (tagToRemove: string) => {
    if (!activeConv || !canEditClient) return;
    const currentTags = contactInfo?.tags || [];
    const updatedTags = currentTags.filter(t => t !== tagToRemove);
    try {
      const updatedContact = await StorageService.saveContact({
        id: contactInfo?.id,
        phone: activeConv.contact_phone || activeConv.phone,
        name: activeConv.contact_name || 'Cliente WhatsApp',
        tags: updatedTags,
        store_id: activeConv.store_id,
        store_name: activeConv.store_name,
      });
      setContactInfo(updatedContact);
      info(`Tag "${tagToRemove}" removida`);
    } catch (err) {
      console.error('Erro ao remover tag:', err);
    }
  };

  // 9. Notas Internas da Conversa
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim() || !activeConv) return;
    const text = newNoteText.trim();
    const visibility = (!isAdmin) ? 'all' : newNoteVisibility;
    const authorName = user?.name || (isAttendantMode ? 'Atendente Pitoco' : 'Equipe Pitoco');

    await StorageService.addConversationNote(activeConv.id, text, authorName, visibility);
    const updatedNote = {
      id: `note-${Date.now()}`,
      text,
      author: authorName,
      created_at: new Date().toISOString(),
      visibility,
    };

    const updatedNotes = [...(activeConv.internal_notes || []), updatedNote];
    setActiveConv(prev => prev ? { ...prev, internal_notes: updatedNotes } : null);
    setConversations(prev => prev.map(c => c.id === activeConv.id ? { ...c, internal_notes: updatedNotes } : c));
    setNewNoteText('');
    success(visibility === 'admin_only' ? 'Nota Confidencial Admin salva!' : 'Nota de Atendimento adicionada!');
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!activeConv || !isAdmin) return;
    await StorageService.deleteConversationNote(activeConv.id, noteId);
    const updatedNotes = (activeConv.internal_notes || []).filter(n => n.id !== noteId);
    setActiveConv(prev => prev ? { ...prev, internal_notes: updatedNotes } : null);
    setConversations(prev => prev.map(c => c.id === activeConv.id ? { ...c, internal_notes: updatedNotes } : c));
    info('Nota interna removida');
  };

  // 10. Modal de Edição de Dados do Cliente CRM (Apenas Admin/Gerente)
  const handleOpenEditClient = () => {
    if (!activeConv) return;
    if (!canEditClient) {
      warning('Ação Restrita', 'O painel de atendimento é apenas para visualização e não pode alterar o cadastro do cliente.');
      return;
    }
    setClientForm({
      name: activeConv.contact_name || contactInfo?.name || '',
      phone: activeConv.contact_phone || activeConv.phone || contactInfo?.phone || '',
      baby_name: contactInfo?.baby_name || '',
      due_date: contactInfo?.due_date || '',
      store_id: activeConv.store_id || contactInfo?.store_id || '',
      email: contactInfo?.email || '',
    });
    setIsEditClientModalOpen(true);
  };

  const handleSaveClientData = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConv || !canEditClient) return;

    const cleanPhone = clientForm.phone.replace(/\D/g, '');
    const selectedStore = stores.find(s => s.id === clientForm.store_id);
    const storeName = selectedStore ? selectedStore.name : activeConv.store_name;

    try {
      const updatedContact = await StorageService.saveContact({
        id: contactInfo?.id,
        name: clientForm.name.trim() || 'Cliente WhatsApp',
        phone: cleanPhone || activeConv.contact_phone || activeConv.phone,
        baby_name: clientForm.baby_name.trim(),
        due_date: clientForm.due_date.trim(),
        store_id: clientForm.store_id || null,
        store_name: storeName,
        email: clientForm.email.trim(),
        tags: contactInfo?.tags || ['Cliente WhatsApp'],
      });

      setContactInfo(updatedContact);

      const updatedConv: Conversation = {
        ...activeConv,
        contact_name: clientForm.name.trim() || activeConv.contact_name,
        contact_phone: cleanPhone || activeConv.contact_phone,
        store_id: clientForm.store_id || activeConv.store_id,
        store_name: storeName || activeConv.store_name,
      };
      setActiveConv(updatedConv);
      setConversations(prev => prev.map(c => c.id === activeConv.id ? updatedConv : c));

      setIsEditClientModalOpen(false);
      success('Dados Atualizados', 'Perfil e CRM do cliente salvos com sucesso.');
    } catch (err: any) {
      toastError('Erro ao salvar', err?.message || 'Falha ao salvar dados do cliente.');
    }
  };

  // Filtragem estrita de conversas
  const filteredConversations = conversations.filter(conv => {
    // 1. Filtro de Lixeira
    if (statusFilter === 'trash') {
      if (!conv.is_deleted) return false;
    } else {
      if (conv.is_deleted) return false;
    }

    // 2. Busca por texto
    const matchesSearch = 
      (conv.contact_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (conv.contact_phone || conv.phone || '').includes(searchTerm) ||
      (conv.last_message || '').toLowerCase().includes(searchTerm.toLowerCase());

    // 3. Status
    const matchesStatus = statusFilter === 'all' || statusFilter === 'trash' || conv.status === statusFilter;

    // 4. Setor
    const matchesSector = selectedSectorFilter === 'all' || (conv.sector || 'Vendas & Enxoval') === selectedSectorFilter;

    return matchesSearch && matchesStatus && matchesSector;
  });

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col gap-4">
      {/* Header & Filtros Globais */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-dark-900 border border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-pitoco-blue/20 border border-pitoco-blue/30 flex items-center justify-center text-pitoco-blue">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              {isAttendantMode ? 'Central de Atendimento Operacional' : 'Inbox de Atendimento Humano'}
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-normal">
                Tempo Real
              </span>
              {isAttendantMode && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-pitoco-blue/20 text-pitoco-blue border border-pitoco-blue/30">
                  Operador Atendente
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-400">
              {isAttendantMode 
                ? 'Converse diretamente com os clientes, envie peças do catálogo e direcione por setor' 
                : 'Supervisão de conversas, transbordo do WhatsApp e gestão completa de filas'}
            </p>
          </div>
        </div>

        {/* Filtro por Loja e Setor */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Filtro de Setor */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-400">Setor:</span>
            <select
              value={selectedSectorFilter}
              onChange={(e) => setSelectedSectorFilter(e.target.value)}
              className="bg-dark-800 border border-white/10 text-xs text-white rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-pitoco-blue"
            >
              <option value="all">Todos os Setores</option>
              {sectors.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Filtro por Loja */}
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
                ...(isAdmin ? [{ id: 'trash', label: 'Lixeira 🗑️' }] : []),
              ].map(st => (
                <button
                  key={st.id}
                  onClick={() => setStatusFilter(st.id)}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded-full shrink-0 transition-colors ${
                    statusFilter === st.id
                      ? st.id === 'trash'
                        ? 'bg-red-500/20 text-red-300 border border-red-500/40 font-bold'
                        : 'bg-white/15 text-white border border-white/20 font-bold'
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
                {statusFilter === 'trash' 
                  ? 'A lixeira está vazia.' 
                  : 'Nenhuma conversa encontrada neste filtro.'}
              </div>
            ) : (
              filteredConversations.map(conv => {
                const isActive = activeConv?.id === conv.id;
                const isWaiting = conv.status === 'waiting_human';
                const isDeleted = conv.is_deleted;
                return (
                  <div
                    key={conv.id}
                    onClick={() => setActiveConv(conv)}
                    className={`p-3.5 cursor-pointer transition-colors relative ${
                      isActive 
                        ? 'bg-white/[0.06] border-l-2 border-pitoco-blue' 
                        : 'hover:bg-white/[0.02]'
                    } ${isDeleted ? 'opacity-70 bg-red-950/10' : ''}`}
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
                        {isDeleted ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                            Lixeira
                          </span>
                        ) : isWaiting ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">
                            Aguardando
                          </span>
                        ) : conv.status === 'human' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/20 text-emerald-300">
                            Humano
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-zinc-800 text-zinc-300 border border-zinc-700/60">
                            Robô
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-300 truncate mt-1 line-clamp-1">
                      {conv.last_message || 'Início da conversa'}
                    </p>

                    <div className="flex items-center justify-between mt-2 pt-1 border-t border-white/[0.03] text-[10px] text-slate-500 gap-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-pitoco-blue font-medium truncate max-w-[100px]" title={conv.store_name || 'Rede Geral'}>
                          📍 {conv.store_name ? conv.store_name.replace('Loja ', '') : 'Rede'}
                        </span>
                        {conv.assigned_to && (
                          <span className="text-emerald-400 font-medium truncate max-w-[80px]" title={`Atribuído a ${conv.assigned_to}`}>
                            👤 {conv.assigned_to.split(' ')[0]}
                          </span>
                        )}
                      </div>

                      {/* Botão Rápido de Assumir para conversas aguardando ou não atribuídas a mim */}
                      {!isDeleted && conv.assigned_to !== (user?.name || (isCEO ? 'Malaca CEO' : isAdmin ? 'Administrador Geral' : isManager ? 'Gerente' : 'Sofia Consultora VIP')) && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAssumeConversation(conv);
                          }}
                          className="px-2 py-0.5 rounded text-[9.5px] font-bold bg-emerald-500/15 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 transition-all shrink-0 flex items-center gap-1 hover:scale-105 active:scale-95"
                          title="Assumir este cliente com 1 clique"
                        >
                          <UserCheck className="w-2.5 h-2.5" />
                          Assumir
                        </button>
                      )}
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
              {/* Header do Chat com Ações Avançadas e Troca de Setor */}
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
                    
                    {/* Seletor de Setor no Header */}
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-slate-400 font-medium">Setor:</span>
                      <select
                        value={activeConv.sector || 'Vendas & Enxoval'}
                        onChange={(e) => handleSectorChange(e.target.value)}
                        className="bg-dark-900 border border-white/15 text-[11px] text-pitoco-blue rounded px-2 py-0.5 font-bold focus:outline-none focus:border-pitoco-blue"
                      >
                        {sectors.map(sec => (
                          <option key={sec} value={sec}>{sec}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Toolbar de Ações do Chat */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {/* Se estiver na Lixeira: Opções de Restaurar e Excluir Definitivamente */}
                  {activeConv.is_deleted ? (
                    <div className="flex items-center gap-1.5 bg-red-950/30 border border-red-500/30 p-1 rounded-lg">
                      <span className="text-[10px] text-red-400 font-semibold px-1">Lixeira</span>
                      {canAdminDestructive && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleRestoreConversation(activeConv.id)}
                            className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white h-7 px-2"
                            title="Restaurar conversa da lixeira"
                          >
                            <RotateCcw className="w-3 h-3 mr-1" />
                            Restaurar
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handlePurgeConversation(activeConv.id)}
                            className="text-xs bg-red-600 hover:bg-red-500 text-white h-7 px-2"
                            title="Excluir permanentemente"
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            Expurgar
                          </Button>
                        </>
                      )}
                    </div>
                  ) : (
                    <>
                      {/* Botão de Enviar Produto do Catálogo */}
                      <Button
                        size="sm"
                        onClick={handleOpenCatalog}
                        className="text-xs bg-pitoco-pink/20 hover:bg-pitoco-pink/30 text-pitoco-pink border border-pitoco-pink/30 h-8 px-2.5 font-semibold"
                        title="Enviar produto do catálogo com foto e preço"
                      >
                        <ShoppingBag className="w-3.5 h-3.5 mr-1" />
                        Catálogo
                      </Button>

                      {/* Botão Assumir Atendimento ou Status de Atribuído */}
                      {activeConv.status === 'human' && activeConv.assigned_to === (user?.name || (isCEO ? 'Malaca CEO' : isAdmin ? 'Administrador Geral' : isManager ? 'Gerente' : 'Sofia Consultora VIP')) ? (
                        <div className="flex items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                            Assumido por você
                          </span>
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
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <Button
                            size="sm"
                            onClick={() => handleAssumeConversation()}
                            className="text-xs bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold h-8 px-3 shadow-md shadow-emerald-950/40 transition-all hover:scale-105"
                            title={activeConv.assigned_to ? `Atualmente com ${activeConv.assigned_to}. Clique para assumir você mesmo.` : 'Assumir atendimento deste cliente'}
                          >
                            <UserCheck className="w-3.5 h-3.5 mr-1.5" />
                            {activeConv.assigned_to ? `Assumir (De: ${activeConv.assigned_to.split(' ')[0]})` : 'Assumir Atendimento'}
                          </Button>
                          {activeConv.status === 'human' && (
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
                          )}
                        </div>
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

                      {/* Ações Destrutivas: Limpar Histórico e Mover para Lixeira (Apenas Admin/Gerente) */}
                      {canAdminDestructive && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleClearHistory}
                            className="text-xs border-white/10 hover:bg-amber-500/10 text-amber-400 border-amber-500/20 h-8 px-2"
                            title="Limpar todas as mensagens desta conversa (Apenas Administrador)"
                          >
                            <Eraser className="w-3.5 h-3.5" />
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleDeleteConversation}
                            className="text-xs border-red-500/30 hover:bg-red-500/10 text-red-400 h-8 px-2"
                            title="Mover conversa para a Lixeira (Apenas Administrador)"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Histórico de Mensagens com opção de apagar mensagem individual (Admin/Gerente) */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-dark-950/60">
                {activeConv.is_deleted && (
                  <div className="p-3 rounded-lg bg-red-950/40 border border-red-500/30 text-xs text-red-300 flex items-center justify-between">
                    <span>⚠️ Esta conversa está na <strong>Lixeira</strong>. Restaure para enviar novas mensagens.</span>
                    {canAdminDestructive && (
                      <Button
                        size="sm"
                        onClick={() => handleRestoreConversation(activeConv.id)}
                        className="text-xs bg-red-800 hover:bg-red-700 text-white h-6 px-2"
                      >
                        Restaurar
                      </Button>
                    )}
                  </div>
                )}

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
                          {/* Botão de apagar mensagem individual no hover (apenas admin/gerente) */}
                          {canAdminDestructive && !activeConv.is_deleted && (
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
                          )}

                          {!isOutbound && (
                            <span className="block text-[10px] text-zinc-400 font-bold mb-1">
                              {msg.author_name || 'Cliente'}
                            </span>
                          )}

                          {/* Foto de produto anexa se existir */}
                          {msg.media_url && (
                            <div className="mb-2 rounded-lg overflow-hidden border border-white/10 max-w-[200px]">
                              <img 
                                src={msg.media_url} 
                                alt="Produto" 
                                className="w-full h-auto object-cover max-h-40" 
                                onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                              />
                            </div>
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

              {/* Caixa de Entrada de Texto com botão rápido de catálogo */}
              <form onSubmit={handleSendMessage} className="p-3 bg-dark-850 border-t border-white/5 flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleOpenCatalog}
                  disabled={activeConv.is_deleted}
                  className="border-pitoco-pink/30 text-pitoco-pink hover:bg-pitoco-pink/10 h-10 px-3 text-xs shrink-0 font-medium"
                  title="Abrir catálogo para enviar fotos e dados de peças"
                >
                  <ShoppingBag className="w-4 h-4 mr-1" />
                  Peças
                </Button>

                <input
                  type="text"
                  value={inputText}
                  disabled={activeConv.is_deleted}
                  onChange={e => setInputText(e.target.value)}
                  placeholder={activeConv.is_deleted ? 'Conversa na lixeira. Restaure para responder.' : 'Digite sua resposta para o WhatsApp do cliente...'}
                  className="flex-1 bg-dark-900 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-white/30 disabled:opacity-50"
                />
                <Button
                  type="submit"
                  disabled={!inputText.trim() || isSending || activeConv.is_deleted}
                  className="bg-white text-black hover:bg-zinc-200 px-4 py-2.5 rounded-xl font-bold text-xs shrink-0"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs">
              Selecione uma conversa para iniciar o atendimento.
            </div>
          )}
        </Card>

        {/* Coluna Direita: Detalhes do Cliente CRM, Tags e Notas Internas (3 colunas) */}
        <Card className="md:col-span-3 flex flex-col h-full bg-dark-900 border-white/10 overflow-hidden p-4">
          <div className="border-b border-white/5 pb-3 mb-4 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-white" />
              Perfil & CRM
            </h3>
            {activeConv && (
              canEditClient ? (
                <button
                  type="button"
                  onClick={handleOpenEditClient}
                  className="flex items-center gap-1 text-[11px] font-semibold text-zinc-300 hover:text-white px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
                  title="Editar dados e CRM deste cliente"
                >
                  <Edit3 className="w-3 h-3 text-white" />
                  Editar Dados
                </button>
              ) : (
                <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-slate-400 border border-white/5">
                  Visualização
                </span>
              )
            )}
          </div>

          {activeConv ? (
            <div className="space-y-4 text-xs overflow-y-auto pr-1">
              {/* Card Resumo do Cliente */}
              <div className="p-3 rounded-xl bg-dark-850 border border-white/5 text-center relative group">
                <div className="w-14 h-14 rounded-full mx-auto bg-zinc-800 border border-white/10 flex items-center justify-center text-white font-black text-xl mb-2">
                  {(activeConv.contact_name || 'C')[0]}
                </div>
                <h4 className="font-bold text-white text-sm">
                  {activeConv.contact_name || 'Cliente WhatsApp'}
                </h4>
                <p className="text-slate-400 text-xs mt-0.5">
                  {activeConv.contact_phone || activeConv.phone}
                </p>
                <div className="mt-2 flex items-center justify-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/10 text-zinc-300 border border-white/10">
                    {activeConv.store_name || 'Loja Matriz Centro'}
                  </span>
                </div>
              </div>

              {/* Informações CRM do Bebê e Parto */}
              <div className="p-3 rounded-xl bg-dark-850 border border-white/5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">
                    Dados do Enxoval
                  </span>
                  {canEditClient && (
                    <button
                      type="button"
                      onClick={handleOpenEditClient}
                      className="text-[10px] text-zinc-400 hover:text-white transition-colors"
                    >
                      Editar
                    </button>
                  )}
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>Nome do Bebê:</span>
                  <span className="font-bold text-white">{contactInfo?.baby_name || 'Não informado'}</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>Data Prevista (DPP):</span>
                  <span className="font-medium text-zinc-300">{contactInfo?.due_date || 'Não informada'}</span>
                </div>
                {contactInfo?.email && (
                  <div className="flex items-center justify-between text-slate-300">
                    <span>E-mail:</span>
                    <span className="font-medium text-zinc-300 truncate max-w-[140px]">{contactInfo.email}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-slate-300">
                  <span>Setor Atual:</span>
                  <span className="font-bold text-pitoco-blue">{activeConv.sector || 'Vendas & Enxoval'}</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>Atendente:</span>
                  <span className="font-medium text-white">{activeConv.assigned_to || 'Robô Automático'}</span>
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

                {/* Lista de Tags */}
                <div className="flex flex-wrap gap-1.5 min-h-[30px] items-center">
                  {(contactInfo?.tags && contactInfo.tags.length > 0) ? (
                    contactInfo.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] bg-white/5 text-slate-300 border border-white/10"
                      >
                        {tag}
                        {canEditClient && (
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(tag)}
                            className="text-slate-500 hover:text-red-400 transition-colors ml-0.5"
                            title={`Remover tag "${tag}"`}
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        )}
                      </span>
                    ))
                  ) : (
                    <span className="text-[10px] text-slate-500 italic">Nenhuma tag vinculada</span>
                  )}
                </div>

                {/* Input de Adicionar Tag (Apenas Admin/Gerente) */}
                {canEditClient && (
                  <div className="flex items-center gap-1.5 pt-1">
                    <input
                      type="text"
                      placeholder="Nova tag..."
                      value={newTagInput}
                      onChange={(e) => setNewTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTag(e);
                        }
                      }}
                      className="flex-1 bg-dark-900 border border-white/10 rounded-lg px-2.5 py-1 text-[11px] text-white placeholder-slate-500 focus:outline-none focus:border-white/30"
                    />
                    <button
                      type="button"
                      onClick={(e) => handleAddTag(e)}
                      className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                      title="Adicionar tag ao cliente"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Seção de Notas Internas (Atendimento vs Confidencial Admin) */}
              <div className="p-3 rounded-xl bg-dark-850 border border-white/5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1">
                    <FileText className="w-3 h-3 text-pitoco-blue" />
                    Notas Internas
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {(activeConv.internal_notes || []).filter(n => isAdmin || n.visibility !== 'admin_only').length} nota(s)
                  </span>
                </div>

                {/* Lista de Notas */}
                <div className="space-y-2 max-h-44 overflow-y-auto">
                  {(activeConv.internal_notes || [])
                    .filter(n => isAdmin || n.visibility !== 'admin_only')
                    .map(note => {
                      const isConfidential = note.visibility === 'admin_only';
                      return (
                        <div 
                          key={note.id} 
                          className={`p-2 rounded-lg border text-[11px] space-y-1 ${
                            isConfidential 
                              ? 'bg-amber-500/10 border-amber-500/30 text-amber-200' 
                              : 'bg-dark-900 border-white/5 text-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[9px] text-slate-400">
                            <span className="flex items-center gap-1 font-semibold text-white">
                              {isConfidential ? <Lock className="w-2.5 h-2.5 text-amber-400" /> : null}
                              {note.author}
                            </span>
                            <div className="flex items-center gap-1">
                              <span>{new Date(note.created_at).toLocaleDateString([], { day: '2-digit', month: '2-digit' })}</span>
                              {isAdmin && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteNote(note.id)}
                                  className="text-slate-500 hover:text-red-400 transition-colors ml-1"
                                  title="Remover nota"
                                >
                                  <X className="w-2.5 h-2.5" />
                                </button>
                              )}
                            </div>
                          </div>
                          <p className="whitespace-pre-wrap leading-tight">{note.text}</p>
                          {isConfidential && (
                            <span className="inline-block text-[8px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/20 px-1 rounded">
                              Confidencial Admin
                            </span>
                          )}
                        </div>
                      );
                    })}
                  {(activeConv.internal_notes || []).filter(n => isAdmin || n.visibility !== 'admin_only').length === 0 && (
                    <p className="text-[10px] text-slate-500 italic">Nenhuma anotação nesta conversa.</p>
                  )}
                </div>

                {/* Adicionar Nova Nota */}
                <form onSubmit={handleAddNote} className="space-y-1.5 pt-1 border-t border-white/5">
                  <textarea
                    rows={2}
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    placeholder="Adicionar nota interna..."
                    className="w-full bg-dark-900 border border-white/10 rounded-lg p-2 text-[11px] text-white placeholder-slate-500 focus:outline-none focus:border-white/30 resize-none"
                  />
                  
                  <div className="flex items-center justify-between gap-1">
                    {isAdmin ? (
                      <select
                        value={newNoteVisibility}
                        onChange={(e) => setNewNoteVisibility(e.target.value as any)}
                        className="bg-dark-900 border border-white/10 rounded px-2 py-1 text-[10px] text-slate-300 focus:outline-none"
                      >
                        <option value="all">Nota Geral (Equipe)</option>
                        <option value="admin_only">🔒 Confidencial Admin</option>
                      </select>
                    ) : (
                      <span className="text-[10px] text-slate-400">Nota para a Equipe</span>
                    )}

                    <Button
                      type="submit"
                      size="sm"
                      disabled={!newNoteText.trim()}
                      className="bg-white text-black hover:bg-zinc-200 text-[10px] font-bold h-7 px-2.5"
                    >
                      Salvar Nota
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          ) : (
            <div className="text-center text-slate-500 text-xs py-8">
              Nenhum contato selecionado.
            </div>
          )}
        </Card>

      </div>

      {/* Modal do Catálogo de Peças (Envio no WhatsApp com foto e dados) */}
      {isCatalogModalOpen && activeConv && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-dark-900 border border-white/10 rounded-2xl w-full max-w-2xl p-6 shadow-2xl flex flex-col max-h-[85vh] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-pitoco-pink/20 text-pitoco-pink">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Catálogo de Produtos & Enxovais</h3>
                  <p className="text-xs text-slate-400">Selecione uma peça para enviar diretamente na conversa de {activeConv.contact_name || activeConv.phone}</p>
                </div>
              </div>
              <button 
                onClick={() => setIsCatalogModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Busca e Filtro de Categoria no Catálogo */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar peça por nome ou referência..."
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-dark-800 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pitoco-pink"
                />
              </div>
            </div>

            {/* Grid Rolável de Peças */}
            <div className="flex-1 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-3 pr-1">
              {catalogProducts
                .filter(prod => {
                  const matchesSearch = prod.name.toLowerCase().includes(catalogSearch.toLowerCase()) || 
                                       (prod.description || '').toLowerCase().includes(catalogSearch.toLowerCase());
                  return matchesSearch;
                })
                .map(prod => (
                  <div 
                    key={prod.id} 
                    className="p-3 rounded-xl bg-dark-850 border border-white/5 hover:border-pitoco-pink/40 transition-all flex flex-col justify-between gap-2.5"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-16 h-16 rounded-lg bg-dark-900 border border-white/10 shrink-0 overflow-hidden flex items-center justify-center">
                        {prod.image_url ? (
                          <img 
                            src={prod.image_url} 
                            alt={prod.name} 
                            className="w-full h-full object-cover"
                            onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                          />
                        ) : (
                          <ShoppingBag className="w-6 h-6 text-slate-600" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-bold text-white truncate" title={prod.name}>
                          {prod.name}
                        </h4>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-xs font-black text-emerald-400">
                            R$ {prod.price.toFixed(2)}
                          </span>
                          {prod.promotional_price && (
                            <span className="text-[10px] text-slate-400 line-through">
                              R$ {prod.promotional_price.toFixed(2)}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                          Tamanhos: {(prod.sizes || []).join(', ') || 'Único'}
                        </p>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      disabled={isSendingProduct}
                      onClick={() => handleSendProductToChat(prod)}
                      className="w-full bg-white text-black hover:bg-zinc-200 text-xs font-bold h-8 flex items-center justify-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Enviar no WhatsApp
                    </Button>
                  </div>
                ))}
              {catalogProducts.length === 0 && (
                <div className="col-span-2 text-center py-12 text-slate-500 text-xs">
                  Nenhum produto cadastrado no catálogo.
                </div>
              )}
            </div>

            <div className="flex items-center justify-end pt-3 border-t border-white/10">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCatalogModalOpen(false)}
                className="border-white/10 text-slate-300 text-xs"
              >
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Edição de Dados do Cliente CRM (Apenas Admin/Gerente) */}
      {isEditClientModalOpen && activeConv && canEditClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-dark-900 border border-white/10 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-white/10 text-white">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Editar Dados do Cliente & CRM</h3>
                  <p className="text-xs text-slate-400">Atualizar nome, loja, bebê e data prevista de parto</p>
                </div>
              </div>
              <button 
                onClick={() => setIsEditClientModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveClientData} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Nome Completo:</label>
                  <input
                    type="text"
                    required
                    value={clientForm.name}
                    onChange={(e) => setClientForm({ ...clientForm, name: e.target.value })}
                    placeholder="Ex: Mariana Silva"
                    className="w-full bg-dark-850 border border-white/10 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-white/30"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">WhatsApp / Telefone:</label>
                  <input
                    type="text"
                    required
                    value={clientForm.phone}
                    onChange={(e) => setClientForm({ ...clientForm, phone: e.target.value })}
                    placeholder="5581999999999"
                    className="w-full bg-dark-850 border border-white/10 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-white/30 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Nome do Bebê:</label>
                  <input
                    type="text"
                    value={clientForm.baby_name}
                    onChange={(e) => setClientForm({ ...clientForm, baby_name: e.target.value })}
                    placeholder="Ex: Theo / Sofia"
                    className="w-full bg-dark-850 border border-white/10 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-white/30"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Data Prevista (DPP):</label>
                  <input
                    type="text"
                    value={clientForm.due_date}
                    onChange={(e) => setClientForm({ ...clientForm, due_date: e.target.value })}
                    placeholder="Ex: Novembro / 2026"
                    className="w-full bg-dark-850 border border-white/10 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-white/30"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Filial / Loja Vinculada:</label>
                  <select
                    value={clientForm.store_id}
                    onChange={(e) => setClientForm({ ...clientForm, store_id: e.target.value })}
                    className="w-full bg-dark-850 border border-white/10 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-white/30"
                  >
                    <option value="">Selecione uma filial...</option>
                    {stores.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">E-mail (opcional):</label>
                  <input
                    type="email"
                    value={clientForm.email}
                    onChange={(e) => setClientForm({ ...clientForm, email: e.target.value })}
                    placeholder="cliente@email.com"
                    className="w-full bg-dark-850 border border-white/10 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-white/30"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditClientModalOpen(false)}
                  className="border-white/10 hover:bg-white/5 text-slate-300 text-xs"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="bg-white text-black hover:bg-zinc-200 font-bold text-xs"
                >
                  Salvar Alterações
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

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
