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
  Sparkles,
  Bot,
  Truck,
  CreditCard,
  X,
  RefreshCw
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { RedeLojasView } from '../../components/RedeLojasView';
import { AtendimentoHumanoInbox } from '../../components/AtendimentoHumanoInbox';
import { WhatsappConnectView } from '../../components/WhatsappConnectView';
import { FlowBuilderView } from '../../components/FlowBuilderView';
import { AccessManagementView } from '../../components/AccessManagementView';
import { StorageService } from '../../lib/storage';
import { Product, Store, SupportTicket, VIPConsultation, DashboardKPIs, BotConfig } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

export default function AdminPage() {
  const { user, isCEO, logout } = useAuth();
  const { success, info, warning } = useToast();

  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'lojas' | 'produtos' | 'bot_config' | 'atendimento' | 'tickets' | 'agendamentos' | 'fluxos' | 'whatsapp' | 'acessos'
  >('dashboard');

  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [consultations, setConsultations] = useState<VIPConsultation[]>([]);
  const [botConfig, setBotConfig] = useState<BotConfig | null>(null);
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Modais de Produto
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form Fields de Produto
  const [prodName, setProdName] = useState('');
  const [prodPrice, setProdPrice] = useState('49.90');
  const [prodPromoPrice, setProdPromoPrice] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [prodMaterial, setProdMaterial] = useState('Algodão Suedine 100% Pima');
  const [prodStock, setProdStock] = useState('50');
  const [prodImageUrl, setProdImageUrl] = useState('');
  const [prodSizes, setProdSizes] = useState<string[]>(['RN', 'P', 'M', 'G', 'GG']);
  const [prodFeatured, setProdFeatured] = useState(false);
  const [prodActive, setProdActive] = useState(true);

  // Form Fields do Bot Config
  const [welcomeMsg, setWelcomeMsg] = useState('');
  const [pixKey, setPixKey] = useState('');
  const [pixName, setPixName] = useState('');
  const [pixCity, setPixCity] = useState('');
  const [shippingMotoboy, setShippingMotoboy] = useState('15.00');
  const [shippingCorreios, setShippingCorreios] = useState('24.90');
  const [freeShippingThreshold, setFreeShippingThreshold] = useState('250.00');
  const [botActive, setBotActive] = useState(true);
  const [isSavingBot, setIsSavingBot] = useState(false);

  useEffect(() => {
    async function loadData() {
      const [kpiData, prods, storesData, ticketsData, consData, botCfg] = await Promise.all([
        StorageService.getKPIs(selectedStoreId || undefined),
        StorageService.getProducts(selectedStoreId || undefined),
        StorageService.getStores(),
        StorageService.getSupportTickets(selectedStoreId || undefined),
        StorageService.getVIPConsultations(selectedStoreId || undefined),
        StorageService.getBotConfig(),
      ]);
      setKpis(kpiData);
      setProducts(prods);
      setStores(storesData);
      setTickets(ticketsData);
      setConsultations(consData);
      setBotConfig(botCfg);

      if (botCfg) {
        setWelcomeMsg(botCfg.welcome_message);
        setPixKey(botCfg.pix_key);
        setPixName(botCfg.pix_name);
        setPixCity(botCfg.pix_city);
        setShippingMotoboy(String(botCfg.shipping_motoboy_price || '15.00'));
        setShippingCorreios(String(botCfg.shipping_correios_price || '24.90'));
        setFreeShippingThreshold(String(botCfg.free_shipping_threshold || '250.00'));
        setBotActive(botCfg.is_active !== false);
      }
    }
    loadData();
  }, [selectedStoreId]);

  // Handler para abrir modal de criação
  const handleOpenCreateProduct = () => {
    setEditingProduct(null);
    setProdName('');
    setProdPrice('49.90');
    setProdPromoPrice('');
    setProdDesc('Confeccionado com toque suave e antialérgico para a pele delicada do bebê.');
    setProdMaterial('Algodão Suedine 100% Pima');
    setProdStock('50');
    setProdImageUrl('');
    setProdSizes(['RN', 'P', 'M', 'G', 'GG']);
    setProdFeatured(false);
    setProdActive(true);
    setIsProductModalOpen(true);
  };

  // Handler para abrir modal de edição
  const handleOpenEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    setProdName(prod.name);
    setProdPrice(String(prod.price));
    setProdPromoPrice(prod.promotional_price ? String(prod.promotional_price) : '');
    setProdDesc(prod.description);
    setProdMaterial(prod.material || 'Algodão Suedine 100% Pima');
    setProdStock(String(prod.stock_quantity ?? 50));
    setProdImageUrl(prod.image_url || '');
    setProdSizes(prod.sizes || ['RN', 'P', 'M']);
    setProdFeatured(Boolean(prod.is_featured));
    setProdActive(prod.is_active !== false);
    setIsProductModalOpen(true);
  };

  // Salvar Produto (Criação ou Edição)
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName.trim()) return;

    const payload: Partial<Product> = {
      id: editingProduct ? editingProduct.id : `prod-${Date.now()}`,
      name: prodName.trim(),
      price: parseFloat(prodPrice) || 49.90,
      promotional_price: prodPromoPrice ? parseFloat(prodPromoPrice) : undefined,
      description: prodDesc.trim(),
      material: prodMaterial.trim(),
      stock_quantity: parseInt(prodStock) || 50,
      image_url: prodImageUrl.trim() || undefined,
      sizes: prodSizes as any,
      is_featured: prodFeatured,
      is_active: prodActive,
      category_name: 'Roupas & Enxovais',
    };

    const saved = await StorageService.saveProduct(payload);

    setProducts(prev => {
      const idx = prev.findIndex(p => p.id === saved.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [saved, ...prev];
    });

    setIsProductModalOpen(false);
    success(
      editingProduct ? 'Produto atualizado com sucesso!' : 'Novo produto adicionado ao catálogo!',
      'Sincronizado com o banco de dados e disponível no bot WhatsApp imediatamente'
    );
  };

  // Excluir Produto
  const handleDeleteProduct = async (id: string, name: string) => {
    if (!window.confirm(`Tem certeza que deseja excluir o produto "${name}"?`)) return;
    await StorageService.deleteProduct(id);
    setProducts(prev => prev.filter(p => p.id !== id));
    info(`Produto "${name}" removido do catálogo`);
  };

  // Salvar Configurações do Bot WhatsApp
  const handleSaveBotConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingBot(true);
    try {
      const updated = await StorageService.saveBotConfig({
        welcome_message: welcomeMsg,
        pix_key: pixKey.trim(),
        pix_name: pixName.trim(),
        pix_city: pixCity.trim(),
        shipping_motoboy_price: parseFloat(shippingMotoboy) || 15.00,
        shipping_correios_price: parseFloat(shippingCorreios) || 24.90,
        free_shipping_threshold: parseFloat(freeShippingThreshold) || 250.00,
        is_active: botActive,
      });
      setBotConfig(updated);
      success(
        'Configurações do Robô salvas com sucesso!',
        'O bot no Discloud atualizou os textos, fretes e chave PIX em tempo real'
      );
    } catch (err: any) {
      warning('Erro ao salvar configurações do bot: ' + err.message);
    } finally {
      setIsSavingBot(false);
    }
  };

  // Alterar Status do Ticket
  const handleUpdateTicketStatus = async (ticket: SupportTicket, newStatus: SupportTicket['status']) => {
    const updated = await StorageService.saveSupportTicket({
      ...ticket,
      status: newStatus,
    });
    setTickets(prev => prev.map(t => t.id === ticket.id ? updated : t));
    success(`Ticket ${ticket.protocol} alterado para "${newStatus}"`);
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.material && p.material.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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
              Gestão Centralizada da Plataforma & Robô WhatsApp
            </p>
          </div>
        </div>

        {/* Links Rápidos de Navegação */}
        <div className="hidden lg:flex items-center gap-1 bg-dark-800 p-1 rounded-xl border border-white/5 text-xs">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
            { id: 'lojas', label: 'Rede de Lojas', icon: Building2 },
            { id: 'produtos', label: 'Catálogo', icon: ShoppingBag },
            { id: 'bot_config', label: 'Robô & PIX', icon: Bot },
            { id: 'atendimento', label: 'Inbox WhatsApp', icon: MessageSquare },
            { id: 'tickets', label: 'Tickets', icon: LifeBuoy },
            { id: 'agendamentos', label: 'Consultoria VIP', icon: Calendar },
            { id: 'fluxos', label: 'Fluxos Bot', icon: GitFork },
            { id: 'whatsapp', label: 'Conexão QR', icon: QrCode },
            { id: 'acessos', label: 'Acessos', icon: Users },
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
              {user?.role === 'ceo' ? 'Diretor Geral' : 'Gerente'}
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-4">
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
                    {products.length} itens (Criar, Editar e Apagar)
                  </p>
                </div>
              </Card>

              <Card 
                onClick={() => setActiveTab('bot_config')}
                className="p-5 bg-dark-900 border-white/10 hover:border-pitoco-blue cursor-pointer transition-all flex items-center gap-4"
              >
                <div className="p-3.5 rounded-xl bg-pitoco-blue/20 text-pitoco-blue border border-pitoco-blue/30">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Configurações do Robô</h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Chave PIX, Frete & Mensagens
                  </p>
                </div>
              </Card>

              <Card 
                onClick={() => setActiveTab('atendimento')}
                className="p-5 bg-dark-900 border-white/10 hover:border-amber-400 cursor-pointer transition-all flex items-center gap-4"
              >
                <div className="p-3.5 rounded-xl bg-amber-400/20 text-amber-400 border border-amber-400/30">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Inbox Humano</h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {kpis?.waitingHuman || 0} conversas aguardando
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
                    QR Code & Status Discloud
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

        {/* TAB 3: CATÁLOGO DE PRODUTOS COM CRUD COMPLETO */}
        {activeTab === 'produtos' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-pitoco-blue" />
                  Catálogo de Roupas & Enxovais ({filteredProducts.length})
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Tudo que você cadastrar, alterar ou excluir aqui é refletido no bot WhatsApp em tempo real.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder="Buscar produto ou tecido..."
                    className="bg-dark-800 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pitoco-blue w-60"
                  />
                </div>

                <Button
                  onClick={handleOpenCreateProduct}
                  className="bg-pitoco-blue text-slate-950 font-bold text-xs px-4 py-2 rounded-xl shadow-lg shadow-pitoco-blue/20 flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  Novo Produto
                </Button>
              </div>
            </div>

            {/* Grid de Produtos */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {filteredProducts.map(prod => (
                <Card key={prod.id} className="p-5 bg-dark-900 border-white/10 flex flex-col justify-between hover:border-white/20 transition-all">
                  <div>
                    {prod.image_url ? (
                      <img 
                        src={prod.image_url} 
                        alt={prod.name} 
                        className="w-full h-44 object-cover rounded-xl mb-3"
                      />
                    ) : (
                      <div className="w-full h-44 bg-dark-800 rounded-xl mb-3 flex items-center justify-center text-slate-500 text-xs">
                        Sem Foto Cadastrada
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-pitoco-blue font-bold uppercase tracking-wider block">
                        {prod.category_name || 'Roupas & Enxovais'}
                      </span>
                      {prod.is_featured && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-pitoco-pink/20 text-pitoco-pink font-semibold border border-pitoco-pink/30">
                          ★ Destaque
                        </span>
                      )}
                    </div>

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
                      📏 <strong>Tamanhos:</strong> {(prod.sizes || []).join(', ')}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                    <span className={`text-[11px] font-medium ${
                      prod.stock_quantity > 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {prod.stock_quantity > 0 ? `✓ ${prod.stock_quantity} em estoque` : '✗ Esgotado'}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditProduct(prod)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                        title="Editar produto"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(prod.id, prod.name)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="Excluir produto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: CONFIGURAÇÕES DO ROBÔ WHATSAPP & PIX */}
        {activeTab === 'bot_config' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Bot className="w-5 h-5 text-pitoco-blue" />
                  Gerenciamento do Robô WhatsApp & Pagamentos
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Configure a chave PIX, taxas de entrega e mensagens automáticas. O bot atualiza em tempo real.
                </p>
              </div>

              <span className={`px-3 py-1 rounded-full text-xs font-semibold border flex items-center gap-1.5 ${
                botActive
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
              }`}>
                <span className={`w-2 h-2 rounded-full ${botActive ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                {botActive ? 'Robô Operando Online' : 'Robô Pausado'}
              </span>
            </div>

            <form onSubmit={handleSaveBotConfig} className="space-y-6">
              {/* Card 1: Chave PIX Oficial */}
              <Card className="p-6 bg-dark-900 border-white/10 space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-white/10">
                  <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Chave PIX da Empresa</h3>
                    <p className="text-xs text-slate-400">
                      Utilizada para envio automático aos clientes que selecionarem a Opção 6 no WhatsApp.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">Chave PIX (E-mail, CNPJ ou Telefone):</label>
                    <input
                      type="text"
                      value={pixKey}
                      onChange={e => setPixKey(e.target.value)}
                      placeholder="financeiro@pitocodegente.com.br"
                      className="w-full bg-dark-800 border border-white/10 rounded-xl p-2.5 text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">Favorecido / Razão Social:</label>
                    <input
                      type="text"
                      value={pixName}
                      onChange={e => setPixName(e.target.value)}
                      placeholder="Pitoco de Gente Artigos Infantis LTDA"
                      className="w-full bg-dark-800 border border-white/10 rounded-xl p-2.5 text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">Cidade da Conta:</label>
                    <input
                      type="text"
                      value={pixCity}
                      onChange={e => setPixCity(e.target.value)}
                      placeholder="Recife"
                      className="w-full bg-dark-800 border border-white/10 rounded-xl p-2.5 text-white"
                      required
                    />
                  </div>
                </div>
              </Card>

              {/* Card 2: Políticas de Frete & Entrega */}
              <Card className="p-6 bg-dark-900 border-white/10 space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-white/10">
                  <div className="p-2.5 rounded-xl bg-pitoco-blue/20 text-pitoco-blue border border-pitoco-blue/30">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Taxas de Entrega & Frete</h3>
                    <p className="text-xs text-slate-400">
                      Valores apresentados na Opção 5 (Cálculo de Frete) do robô.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">Taxa Motoboy Express (R$):</label>
                    <input
                      type="number"
                      step="0.01"
                      value={shippingMotoboy}
                      onChange={e => setShippingMotoboy(e.target.value)}
                      className="w-full bg-dark-800 border border-white/10 rounded-xl p-2.5 text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">Taxa Correios SEDEX/PAC (R$):</label>
                    <input
                      type="number"
                      step="0.01"
                      value={shippingCorreios}
                      onChange={e => setShippingCorreios(e.target.value)}
                      className="w-full bg-dark-800 border border-white/10 rounded-xl p-2.5 text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">Valor Mínimo para Frete Grátis (R$):</label>
                    <input
                      type="number"
                      step="0.01"
                      value={freeShippingThreshold}
                      onChange={e => setFreeShippingThreshold(e.target.value)}
                      className="w-full bg-dark-800 border border-white/10 rounded-xl p-2.5 text-white"
                      required
                    />
                  </div>
                </div>
              </Card>

              {/* Card 3: Mensagem de Boas-Vindas */}
              <Card className="p-6 bg-dark-900 border-white/10 space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-white/10">
                  <div className="p-2.5 rounded-xl bg-pitoco-pink/20 text-pitoco-pink border border-pitoco-pink/30">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Mensagem de Boas-Vindas do WhatsApp</h3>
                    <p className="text-xs text-slate-400">
                      Texto exibido logo no início da conversa (use <code>{'{clientName}'}</code> para o nome da mamãe/cliente).
                    </p>
                  </div>
                </div>

                <div className="text-xs">
                  <textarea
                    rows={4}
                    value={welcomeMsg}
                    onChange={e => setWelcomeMsg(e.target.value)}
                    className="w-full bg-dark-800 border border-white/10 rounded-xl p-3 text-white leading-relaxed font-sans"
                    required
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="botActiveToggle"
                    checked={botActive}
                    onChange={e => setBotActive(e.target.checked)}
                    className="rounded bg-dark-800 border-white/10 text-pitoco-blue focus:ring-0"
                  />
                  <label htmlFor="botActiveToggle" className="text-slate-300 text-xs cursor-pointer font-medium">
                    Ativar atendimento automático do Robô (desmarque para deixar apenas atendimento humano)
                  </label>
                </div>
              </Card>

              {/* Botão de Salvar */}
              <div className="flex justify-end gap-3">
                <Button
                  type="submit"
                  disabled={isSavingBot}
                  className="bg-pitoco-blue text-slate-950 font-bold text-sm px-6 py-3 rounded-xl shadow-xl shadow-pitoco-blue/20 flex items-center gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${isSavingBot ? 'animate-spin' : ''}`} />
                  {isSavingBot ? 'Sincronizando com o Robô...' : 'Salvar e Sincronizar com o Robô WhatsApp'}
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 5: ATENDIMENTO HUMANO INBOX */}
        {activeTab === 'atendimento' && (
          <AtendimentoHumanoInbox initialStoreId={selectedStoreId} />
        )}

        {/* TAB 6: TICKETS DE ATENDIMENTO COM AÇÕES CEO */}
        {activeTab === 'tickets' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <LifeBuoy className="w-5 h-5 text-pitoco-blue" />
                  Tickets de Atendimento por Loja ({tickets.length})
                </h2>
                <p className="text-xs text-slate-400">
                  Gerencie chamados de clientes e transbordos humanos vindos do WhatsApp.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {tickets.length === 0 ? (
                <Card className="p-8 text-center text-slate-400 text-xs bg-dark-900 border-white/5">
                  Nenhum ticket pendente no momento. Todos os atendimentos estão em dia!
                </Card>
              ) : (
                tickets.map(ticket => (
                  <Card key={ticket.id} className="p-4 bg-dark-900 border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-pitoco-blue">{ticket.protocol}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                          ticket.status === 'open' 
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : ticket.status === 'in_progress'
                            ? 'bg-pitoco-blue/20 text-pitoco-blue border border-pitoco-blue/30'
                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}>
                          {ticket.status}
                        </span>
                        <span className="text-[11px] text-slate-400">{ticket.store_name || 'Loja'}</span>
                      </div>
                      <h4 className="text-sm font-semibold text-white mt-1">{ticket.subject}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">Cliente: {ticket.client_name} ({ticket.client_phone || 'WhatsApp'})</p>
                    </div>

                    <div className="flex items-center gap-2">
                      {ticket.status !== 'in_progress' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdateTicketStatus(ticket, 'in_progress')}
                          className="text-xs border-pitoco-blue/30 text-pitoco-blue hover:bg-pitoco-blue/10"
                        >
                          Atender
                        </Button>
                      )}
                      {ticket.status !== 'resolved' && (
                        <Button
                          size="sm"
                          onClick={() => handleUpdateTicketStatus(ticket, 'resolved')}
                          className="text-xs bg-emerald-500 text-slate-950 font-bold"
                        >
                          Resolver
                        </Button>
                      )}
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 7: AGENDAMENTOS VIP */}
        {activeTab === 'agendamentos' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-pitoco-pink" />
              Agendamentos de Consultoria VIP ({consultations.length})
            </h2>
            <div className="space-y-3">
              {consultations.map(cons => (
                <Card key={cons.id} className="p-4 bg-dark-900 border-white/10 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white">{cons.client_name}</h4>
                    <p className="text-xs text-slate-400">
                      Data: {cons.date} às {cons.time} | Loja: {cons.store_name} | Tipo: {cons.type === 'presencial' ? 'Presencial em Loja' : 'Online / Vídeo'}
                    </p>
                  </div>
                  <Badge variant="default" className="text-xs bg-pitoco-pink/20 text-pitoco-pink border border-pitoco-pink/30">
                    {cons.status.toUpperCase()}
                  </Badge>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* TAB 8: FLUXOS */}
        {activeTab === 'fluxos' && (
          <FlowBuilderView onNavigate={tab => setActiveTab(tab as any)} />
        )}

        {/* TAB 9: WHATSAPP QR */}
        {activeTab === 'whatsapp' && (
          <WhatsappConnectView onNavigate={tab => setActiveTab(tab as any)} />
        )}

        {/* TAB 10: GERENCIAMENTO DE ACESSOS */}
        {activeTab === 'acessos' && (
          <AccessManagementView />
        )}
      </main>

      {/* MODAL CRIAR / EDITAR PRODUTO */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-dark-900 border border-white/10 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-pitoco-blue" />
                {editingProduct ? 'Editar Produto do Catálogo' : 'Novo Produto no Catálogo'}
              </h3>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Nome do Produto:</label>
                <input
                  type="text"
                  value={prodName}
                  onChange={e => setProdName(e.target.value)}
                  placeholder="Ex: Macacão Canelado Zíper Duplo"
                  className="w-full bg-dark-800 border border-white/10 rounded-xl p-2.5 text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Preço Normal (R$):</label>
                  <input
                    type="number"
                    step="0.01"
                    value={prodPrice}
                    onChange={e => setProdPrice(e.target.value)}
                    className="w-full bg-dark-800 border border-white/10 rounded-xl p-2.5 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Preço Promocional (Opcional):</label>
                  <input
                    type="number"
                    step="0.01"
                    value={prodPromoPrice}
                    onChange={e => setProdPromoPrice(e.target.value)}
                    placeholder="Ex: 39.90"
                    className="w-full bg-dark-800 border border-white/10 rounded-xl p-2.5 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Tecido / Material:</label>
                  <input
                    type="text"
                    value={prodMaterial}
                    onChange={e => setProdMaterial(e.target.value)}
                    placeholder="Ex: Algodão Suedine 100% Pima"
                    className="w-full bg-dark-800 border border-white/10 rounded-xl p-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Estoque Inicial:</label>
                  <input
                    type="number"
                    value={prodStock}
                    onChange={e => setProdStock(e.target.value)}
                    className="w-full bg-dark-800 border border-white/10 rounded-xl p-2.5 text-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">URL da Imagem / Foto do Produto:</label>
                <input
                  type="url"
                  value={prodImageUrl}
                  onChange={e => setProdImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-dark-800 border border-white/10 rounded-xl p-2.5 text-white"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Descrição Detalhada:</label>
                <textarea
                  rows={3}
                  value={prodDesc}
                  onChange={e => setProdDesc(e.target.value)}
                  placeholder="Detalhes para a mamãe sobre o produto..."
                  className="w-full bg-dark-800 border border-white/10 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="flex items-center gap-6 pt-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="prodFeaturedCheck"
                    checked={prodFeatured}
                    onChange={e => setProdFeatured(e.target.checked)}
                    className="rounded bg-dark-800 border-white/10 text-pitoco-pink focus:ring-0"
                  />
                  <label htmlFor="prodFeaturedCheck" className="text-slate-300 cursor-pointer">
                    Produto em Destaque
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="prodActiveCheck"
                    checked={prodActive}
                    onChange={e => setProdActive(e.target.checked)}
                    className="rounded bg-dark-800 border-white/10 text-pitoco-blue focus:ring-0"
                  />
                  <label htmlFor="prodActiveCheck" className="text-slate-300 cursor-pointer">
                    Produto Ativo no Catálogo
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-white/10">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsProductModalOpen(false)}
                  className="text-xs text-slate-300"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="bg-pitoco-blue text-slate-950 font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg"
                >
                  {editingProduct ? 'Salvar Alterações' : 'Cadastrar Produto'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
