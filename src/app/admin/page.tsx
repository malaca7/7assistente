'use client';

import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  ShoppingBag, 
  MessageSquare, 
  Users, 
  GitFork, 
  Settings as SettingsIcon, 
  Calendar, 
  QrCode, 
  TrendingUp, 
  Layers, 
  DollarSign, 
  LifeBuoy, 
  CheckCircle2, 
  Plus, 
  Trash2, 
  Edit3, 
  Search, 
  Store as StoreIcon, 
  ArrowRight,
  LogOut,
  Sparkles
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { RedeLojasView } from '../../components/RedeLojasView';
import { AtendimentoHumanoInbox } from '../../components/AtendimentoHumanoInbox';
import { WhatsappConnectView } from '../../components/WhatsappConnectView';
import { FlowBuilderView } from '../../components/FlowBuilderView';
import { StorageService } from '../../lib/storage';
import { Product, Store, SupportTicket, VIPConsultation, DashboardKPIs } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

export default function AdminPage() {
  const { user, isCEO, logout } = useAuth();
  const { success, info, warning } = useToast();

  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'lojas' | 'produtos' | 'atendimento' | 'tickets' | 'agendamentos' | 'fluxos' | 'whatsapp'
  >('dashboard');

  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [consultations, setConsultations] = useState<VIPConsultation[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);

  // New product form
  const [newProdName, setNewProdName] = useState('');
  const [newProdPrice, setNewProdPrice] = useState('49.90');
  const [newProdDesc, setNewProdDesc] = useState('');
  const [newProdMaterial, setNewProdMaterial] = useState('Algodão Suedine 100%');

  useEffect(() => {
    async function loadData() {
      const [kpiData, prods, storesData, ticketsData, consData] = await Promise.all([
        StorageService.getKPIs(selectedStoreId || undefined),
        StorageService.getProducts(selectedStoreId || undefined),
        StorageService.getStores(),
        StorageService.getSupportTickets(selectedStoreId || undefined),
        StorageService.getVIPConsultations(selectedStoreId || undefined),
      ]);
      setKpis(kpiData);
      setProducts(prods);
      setStores(storesData);
      setTickets(ticketsData);
      setConsultations(consData);
    }
    loadData();
  }, [selectedStoreId]);

  const handleSaveNewProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName.trim()) return;

    const saved = await StorageService.saveProduct({
      name: newProdName.trim(),
      price: parseFloat(newProdPrice) || 49.90,
      description: newProdDesc.trim() || 'Confeccionado com toque suave e antialérgico para o bebê.',
      material: newProdMaterial,
      sizes: ['RN', 'P', 'M', 'G', 'GG'],
      colors: ['Branco Puro', 'Azul Bebê', 'Rosa Seco', 'Verde Menta'],
      is_featured: true,
      is_active: true,
      stock_quantity: 40,
    });

    setProducts(prev => [saved, ...prev]);
    setIsCreatingProduct(false);
    setNewProdName('');
    success('Novo produto adicionado ao catálogo com sucesso!');
  };

  const handleDeleteProduct = async (id: string) => {
    await StorageService.deleteProduct(id);
    setProducts(prev => prev.filter(p => p.id !== id));
    info('Produto removido do catálogo');
  };

  return (
    <div className="min-h-screen bg-dark-950 text-slate-200 flex flex-col">
      {/* Top Navbar */}
      <header className="h-16 border-b border-white/10 bg-dark-900 px-6 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/10 shadow-md bg-dark-800/60 flex items-center justify-center p-0.5">
            <img src="/logo.png" alt="Logo Pitoco" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white flex items-center gap-2">
              Pitoco de Gente
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-pitoco-blue/20 text-pitoco-blue font-semibold border border-pitoco-blue/30">
                {isCEO ? 'PAINEL REDE CEO' : 'GESTÃO DE FILIAL'}
              </span>
            </h1>
            <p className="text-[11px] text-slate-400">
              Roupas de Bebê, Infantil & Enxovais
            </p>
          </div>
        </div>

        {/* Links Rápidos de Navegação */}
        <div className="hidden lg:flex items-center gap-1 bg-dark-800 p-1 rounded-xl border border-white/5 text-xs">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
            { id: 'lojas', label: 'Rede de Lojas', icon: Building2 },
            { id: 'produtos', label: 'Catálogo', icon: ShoppingBag },
            { id: 'atendimento', label: 'Inbox WhatsApp', icon: MessageSquare },
            { id: 'tickets', label: 'Tickets', icon: LifeBuoy },
            { id: 'agendamentos', label: 'Consultoria VIP', icon: Calendar },
            { id: 'fluxos', label: 'Fluxos Bot', icon: GitFork },
            { id: 'whatsapp', label: 'Conexão QR', icon: QrCode },
          ].map(tab => {
            const IconC = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
                  isActive
                    ? 'bg-pitoco-blue text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <IconC className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <span className="text-xs font-bold text-white block">
              {user?.name || 'Malaca CEO'}
            </span>
            <span className="text-[10px] text-slate-400 block">
              {user?.role === 'ceo' ? 'Diretor Geral' : user?.role === 'manager' ? 'Gerente' : 'Consultora VIP'}
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={logout}
            className="text-xs border-white/10 hover:bg-white/5 text-slate-300"
          >
            <LogOut className="w-3.5 h-3.5 mr-1" />
            Sair
          </Button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
        {/* TAB 1: DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <RedeLojasView
              onSelectStore={store => setSelectedStoreId(store ? store.id : null)}
            />

            {/* Ações Rápidas do Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
              <Card 
                onClick={() => setActiveTab('atendimento')}
                className="p-5 bg-dark-900 border-white/10 hover:border-pitoco-blue cursor-pointer transition-all flex items-center gap-4"
              >
                <div className="p-3.5 rounded-xl bg-pitoco-blue/20 text-pitoco-blue border border-pitoco-blue/30">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Inbox Humano</h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {kpis?.waitingHuman || 0} conversas aguardando consultora
                  </p>
                </div>
              </Card>

              <Card 
                onClick={() => setActiveTab('produtos')}
                className="p-5 bg-dark-900 border-white/10 hover:border-pitoco-pink cursor-pointer transition-all flex items-center gap-4"
              >
                <div className="p-3.5 rounded-xl bg-pitoco-pink/20 text-pitoco-pink border border-pitoco-pink/30">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Catálogo de Produtos</h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {products.length} itens cadastrados (Bodies, macacões, berço)
                  </p>
                </div>
              </Card>

              <Card 
                onClick={() => setActiveTab('whatsapp')}
                className="p-5 bg-dark-900 border-white/10 hover:border-emerald-500 cursor-pointer transition-all flex items-center gap-4"
              >
                <div className="p-3.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <QrCode className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Status WhatsApp Baileys</h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Gerar QR Code & testar disparo Discloud
                  </p>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* TAB 2: REDE DE LOJAS */}
        {activeTab === 'lojas' && (
          <RedeLojasView
            onSelectStore={store => setSelectedStoreId(store ? store.id : null)}
          />
        )}

        {/* TAB 3: CATÁLOGO DE PRODUTOS */}
        {activeTab === 'produtos' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-pitoco-blue" />
                  Catálogo de Roupas & Enxovais
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Bodies suedine 100%, macacões com zíper duplo, saídas de maternidade e kits de berço.
                </p>
              </div>

              <Button
                onClick={() => setIsCreatingProduct(!isCreatingProduct)}
                className="bg-pitoco-blue text-slate-950 font-bold text-xs px-4 py-2 rounded-xl"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                {isCreatingProduct ? 'Fechar Formulário' : 'Novo Produto'}
              </Button>
            </div>

            {/* Formulário de Novo Produto */}
            {isCreatingProduct && (
              <Card className="p-6 bg-dark-900 border-pitoco-blue">
                <h3 className="text-sm font-bold text-white mb-4">Adicionar Produto ao Catálogo</h3>
                <form onSubmit={handleSaveNewProduct} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Nome do Produto:</label>
                    <input
                      type="text"
                      value={newProdName}
                      onChange={e => setNewProdName(e.target.value)}
                      placeholder="Ex: Macacão Canelado Zíper Duplo"
                      className="w-full bg-dark-800 border border-white/10 rounded-lg p-2.5 text-xs text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Preço (R$):</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newProdPrice}
                      onChange={e => setNewProdPrice(e.target.value)}
                      className="w-full bg-dark-800 border border-white/10 rounded-lg p-2.5 text-xs text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Tecido / Material:</label>
                    <input
                      type="text"
                      value={newProdMaterial}
                      onChange={e => setNewProdMaterial(e.target.value)}
                      placeholder="Ex: Algodão Suedine 100% Pima"
                      className="w-full bg-dark-800 border border-white/10 rounded-lg p-2.5 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Descrição Curta:</label>
                    <input
                      type="text"
                      value={newProdDesc}
                      onChange={e => setNewProdDesc(e.target.value)}
                      placeholder="Ex: Toque macio com proteção interna no zíper."
                      className="w-full bg-dark-800 border border-white/10 rounded-lg p-2.5 text-xs text-white"
                    />
                  </div>

                  <div className="md:col-span-2 flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={() => setIsCreatingProduct(false)} className="text-xs">
                      Cancelar
                    </Button>
                    <Button type="submit" className="bg-pitoco-blue text-slate-950 font-bold text-xs">
                      Salvar Produto
                    </Button>
                  </div>
                </form>
              </Card>
            )}

            {/* Grid de Produtos */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {products.map(prod => (
                <Card key={prod.id} className="p-5 bg-dark-900 border-white/10 flex flex-col justify-between">
                  <div>
                    {prod.image_url && (
                      <img 
                        src={prod.image_url} 
                        alt={prod.name} 
                        className="w-full h-44 object-cover rounded-xl mb-3"
                      />
                    )}
                    <span className="text-[10px] text-pitoco-blue font-bold uppercase tracking-wider block">
                      {prod.category_name || 'Roupas & Enxovais'}
                    </span>
                    <h4 className="text-sm font-bold text-white mt-1">{prod.name}</h4>
                    <p className="text-xs text-slate-400 line-clamp-2 mt-1">{prod.description}</p>
                    
                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="text-lg font-bold text-white">
                        R$ {(prod.promotional_price || prod.price).toFixed(2).replace('.', ',')}
                      </span>
                      {prod.promotional_price && (
                        <span className="text-xs text-slate-500 line-through">
                          R$ {prod.price.toFixed(2).replace('.', ',')}
                        </span>
                      )}
                    </div>

                    <div className="mt-2 text-[11px] text-slate-400">
                      🧵 <strong>Material:</strong> {prod.material || 'Algodão'}
                    </div>
                    <div className="mt-1 text-[11px] text-slate-400">
                      📏 <strong>Tamanhos:</strong> {prod.sizes.join(', ')}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                    <span className="text-[11px] text-emerald-400 font-medium">
                      ✓ {prod.stock_quantity} em estoque
                    </span>
                    <button
                      onClick={() => handleDeleteProduct(prod.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Excluir produto"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: ATENDIMENTO HUMANO INBOX */}
        {activeTab === 'atendimento' && (
          <AtendimentoHumanoInbox initialStoreId={selectedStoreId} />
        )}

        {/* TAB 5: TICKETS DE ATENDIMENTO */}
        {activeTab === 'tickets' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <LifeBuoy className="w-5 h-5 text-pitoco-blue" />
                Tickets de Atendimento por Loja
              </h2>
            </div>
            <div className="divide-y divide-white/5 bg-dark-900 rounded-xl border border-white/10 overflow-hidden">
              {tickets.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">
                  Nenhum ticket de suporte aberto no momento.
                </div>
              ) : (
                tickets.map(tk => (
                  <div key={tk.id} className="p-4 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-mono text-pitoco-blue font-bold">{tk.protocol}</span>
                      <h4 className="text-sm font-bold text-white mt-0.5">{tk.subject}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Cliente: {tk.client_name} ({tk.client_phone}) • {tk.store_name || 'Matriz'}
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {tk.status === 'open' ? 'Aberto' : 'Resolvido'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 6: CONSULTORIAS VIP COM AGENDAMENTO */}
        {activeTab === 'agendamentos' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-pitoco-pink" />
              Agendamentos de Consultoria VIP de Enxoval
            </h2>
            <div className="divide-y divide-white/5 bg-dark-900 rounded-xl border border-white/10 overflow-hidden">
              {consultations.map(c => (
                <div key={c.id} className="p-4 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white">{c.client_name}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Telefone: {c.client_phone} • Data: {c.consultation_date} às {c.consultation_time}
                    </p>
                    <span className="text-[11px] text-pitoco-blue font-medium mt-1 block">
                      📍 Modalidade: {c.consultation_type === 'presencial_loja' ? 'Presencial na Loja' : 'Online via WhatsApp'}
                    </span>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400">
                    Confirmada
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 7: FLOW BUILDER VISUAL */}
        {activeTab === 'fluxos' && (
          <FlowBuilderView />
        )}

        {/* TAB 8: CONEXÃO WHATSAPP BAILEYS */}
        {activeTab === 'whatsapp' && (
          <WhatsappConnectView />
        )}
      </main>
    </div>
  );
}
