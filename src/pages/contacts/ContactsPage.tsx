import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  Phone, 
  Tag, 
  Calendar, 
  MessageSquare,
  MoreVertical,
  Edit2,
  Trash2,
  CheckCircle2,
  Filter,
  Download,
  Upload,
  ExternalLink,
  MessageCircle
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../contexts/ToastContext';
import { StorageService } from '../../lib/storage';
import { Contact } from '../../types';
import { formatPhone, formatDate } from '../../lib/utils';

export interface ContactsPageProps {
  onNavigate: (path: string) => void;
}

export const ContactsPage: React.FC<ContactsPageProps> = ({ onNavigate }) => {
  const { success, error: toastError, info } = useToast();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [tags, setTags] = useState('');

  useEffect(() => {
    loadContacts();
    const interval = setInterval(loadContacts, 3500);
    return () => clearInterval(interval);
  }, []);

  const loadContacts = async () => {
    const data = await StorageService.getContacts();
    setContacts(data);
  };

  const handleOpenAdd = () => {
    setEditingContact(null);
    setName('');
    setPhone('');
    setTags('Lead, WhatsApp');
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (contact: Contact) => {
    setEditingContact(contact);
    setName(contact.name);
    setPhone(contact.phone);
    setTags((contact.tags || []).join(', '));
    setIsAddModalOpen(true);
  };

  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      toastError('Telefone inválido', 'Informe um número com DDD (ex: 81996138924).');
      return;
    }

    try {
      const tagsArray = tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const contactData: Contact = {
        id: editingContact?.id || `contact-${Date.now()}`,
        phone: cleanPhone,
        name: name.trim() || 'Contato WhatsApp',
        status: 'active',
        tags: tagsArray.length > 0 ? tagsArray : ['Lead'],
        metadata: editingContact?.metadata || {},
        created_at: editingContact?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      await StorageService.saveContact(contactData);
      await loadContacts();
      success(
        editingContact ? 'Contato Atualizado' : 'Contato Criado',
        `${contactData.name} foi salvo na sua base.`
      );
      setIsAddModalOpen(false);
    } catch (err: any) {
      toastError('Erro', err.message || 'Falha ao salvar contato.');
    }
  };

  const handleDeleteContact = async (contact: Contact) => {
    try {
      // 1. Optimistic UI update
      setContacts((prev) => prev.filter((c) => c.id !== contact.id && c.phone !== contact.phone));

      if (typeof StorageService.deleteContact === 'function') {
        await StorageService.deleteContact(contact.id, contact.phone);
      } else {
        // Direct local and server fallback
        const localContacts = (JSON.parse(localStorage.getItem('7assistente_contacts') || '[]') as Contact[]).filter(
          (c) => c.id !== contact.id && c.phone !== contact.phone
        );
        localStorage.setItem('7assistente_contacts', JSON.stringify(localContacts));
        const backendUrl = window.location.origin.includes('discloud') ? window.location.origin : 'https://talvanebarber.discloud.app';
        const cleanPhone = (contact.phone || contact.id).replace(/\D/g, '');
        fetch(`${backendUrl}/api/whatsapp/contacts/${cleanPhone || contact.id}?phone=${cleanPhone}`, { method: 'DELETE' }).catch(() => {});
      }

      await loadContacts();
      success('Contato Removido', `${contact.name} foi excluído da base.`);
    } catch (err: any) {
      toastError('Erro ao excluir', err.message || 'Falha ao remover contato.');
    }
  };

  const handleExportCSV = () => {
    if (contacts.length === 0) {
      info('Nenhum contato', 'Não há contatos para exportar.');
      return;
    }

    const headers = ['Nome', 'Telefone', 'Tags', 'Status', 'Data de Cadastro'];
    const rows = contacts.map((c) => [
      `"${c.name}"`,
      `"${c.phone}"`,
      `"${(c.tags || []).join('; ')}"`,
      `"${c.status}"`,
      `"${formatDate(c.created_at)}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `contatos-7assistente-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    success('Exportação Concluída', 'Arquivo CSV baixado com sucesso.');
  };

  const allTags = Array.from(new Set(contacts.flatMap((c) => c.tags || [])));

  const filteredContacts = contacts.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm.replace(/\D/g, ''));
    const matchesTag = selectedTag === 'all' || (c.tags && c.tags.includes(selectedTag));
    return matchesSearch && matchesTag;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300 select-none">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-display font-bold text-white tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-brand-400" />
            Base de Contatos & Segmentação
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Gerencie sua base de clientes, leads capturados pelos fluxos e tags de atendimento.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Download className="w-3.5 h-3.5" />}
            onClick={handleExportCSV}
          >
            Exportar CSV
          </Button>
          <Button
            variant="brand"
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={handleOpenAdd}
          >
            Novo Contato
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-3xl bg-dark-900 border border-white/5 space-y-3 shadow-xl">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar por nome ou telefone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-dark-850 border border-slate-800 rounded-2xl pl-10 pr-4 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto no-scrollbar">
            <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1 flex-shrink-0">
              <Filter className="w-3.5 h-3.5 text-brand-400" />
              Filtrar Tag:
            </span>
            <button
              onClick={() => setSelectedTag('all')}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold whitespace-nowrap transition-colors ${
                selectedTag === 'all'
                  ? 'bg-brand-500 text-white shadow-sm'
                  : 'bg-dark-800 text-slate-400 hover:text-white'
              }`}
            >
              Todas ({contacts.length})
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold whitespace-nowrap transition-colors ${
                  selectedTag === tag
                    ? 'bg-brand-500 text-white shadow-sm'
                    : 'bg-dark-800 text-slate-400 hover:text-white'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Contacts Table / Grid */}
      <div className="bg-dark-900 border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/5 bg-dark-950/60 text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                <th className="py-3.5 px-6">Contato</th>
                <th className="py-3.5 px-6">WhatsApp</th>
                <th className="py-3.5 px-6">Tags / Segmentos</th>
                <th className="py-3.5 px-6">Cadastrado em</th>
                <th className="py-3.5 px-6 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredContacts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    Nenhum contato encontrado com os filtros aplicados.
                  </td>
                </tr>
              ) : (
                filteredContacts.map((contact) => (
                  <tr key={contact.id} className="hover:bg-dark-850/50 transition-colors group">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        {contact.profile_picture_url ? (
                          <img
                            src={contact.profile_picture_url}
                            alt={contact.name}
                            className="w-9 h-9 rounded-xl object-cover border border-emerald-500/30 shadow-sm flex-shrink-0"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-brand-300 font-bold text-xs flex-shrink-0">
                            {contact.name.substring(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-white leading-tight">{contact.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">ID: {contact.id}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-6 font-mono text-slate-300">
                      {formatPhone(contact.phone)}
                    </td>

                    <td className="py-4 px-6">
                      <div className="flex flex-wrap gap-1.5">
                        {(contact.tags || []).map((t, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded-lg bg-dark-800 border border-white/5 text-[10px] font-medium text-slate-300 flex items-center gap-1"
                          >
                            <Tag className="w-2.5 h-2.5 text-brand-400" />
                            {t}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="py-4 px-6 text-slate-400 font-mono text-[11px]">
                      {formatDate(contact.created_at)}
                    </td>

                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onNavigate('/conversas')}
                          className="p-2 rounded-xl text-slate-400 hover:text-brand-400 hover:bg-brand-950/30 transition-colors"
                          title="Abrir Conversa no Painel"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(contact)}
                          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                          title="Editar Contato"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteContact(contact)}
                          className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                          title="Remover Contato"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Contact Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={editingContact ? 'Editar Contato' : 'Adicionar Novo Contato'}
        subtitle="Cadastre o número com DDD para envio de fluxos e mensagens"
      >
        <form onSubmit={handleSaveContact} className="space-y-4">
          <Input
            label="Nome Completo"
            placeholder="Ex: João da Silva"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <Input
            label="Telefone WhatsApp (com DDD)"
            placeholder="Ex: 81996138924"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            hint="Apenas números ou formato padrão com DDD."
            required
          />

          <Input
            label="Tags / Segmentos (separados por vírgula)"
            placeholder="Ex: Lead, VIP, Suporte"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => setIsAddModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="brand" type="submit">
              {editingContact ? 'Atualizar Contato' : 'Salvar Contato'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
