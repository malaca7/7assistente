import React, { useState, useEffect } from 'react';
import { 
  Store as StoreIcon, 
  ShoppingBag, 
  MessageSquare, 
  Users, 
  TrendingUp, 
  DollarSign, 
  AlertTriangle,
  ArrowRight,
  Clock,
  ShieldCheck,
  Search,
  Building2,
  Calendar,
  Layers,
  ChevronRight,
  Eye,
  CheckCircle2
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { AtendimentoHumanoInbox } from '../../components/AtendimentoHumanoInbox';
import { StorageService } from '../../lib/storage';
import { formatCurrency } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';
import { Store, Product, Contact, VIPConsultation } from '../../types';

interface ManagerPortalPageProps {
  onNavigate?: (path: string) => void;
}

export const ManagerPortalPage: React.FC<ManagerPortalPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'atendimento' | 'produtos' | 'clientes'>('overview');
  
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [consultations, setConsultations] = useState<VIPConsultation[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const [storesData, prodsData, contactsData] = await Promise.all([
          StorageService.getStores(),
          StorageService.getProducts(),
          StorageService.getContacts(),
        ]);
        setStores(storesData);
        setProducts(prodsData);
        setContacts(contactsData);

        // Se o usuário já tiver uma loja vinculada, seleciona ela
        if (user?.store_id) {
          setSelectedStoreId(user.store_id);
        } else if (storesData.length > 0) {
          setSelectedStoreId(storesData[0].id);
        }
      } catch (err) {
        console.error('Erro ao carregar dados da gerência:', err);
      }
    }
    loadData();
  }, [user]);

  const currentStore = stores.find(s => s.id === selectedStoreId) || stores[0] || null;
  const storeProducts = products.filter(p => !p.store_id || p.store_id === currentStore?.id);
  const lowStockProducts = storeProducts.filter(p => p.stock_quantity <= 15);
  const storeContacts = contacts.filter(c => !c.store_id || c.store_id === currentStore?.id);

  return (
    <div className="space-y-6 text-zinc-100 animate-fadeIn">
      {/* Header do Painel Gestão */}
      <div className="p-6 rounded-2xl bg-dark-900 border border-white/10 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
              PORTAL DE GESTÃO EXECUTIVA
            </span>
            <span className="text-xs text-zinc-400 font-medium">
              Supervisão Operacional & Vendas
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <StoreIcon className="w-6 h-6 text-emerald-400" />
            {currentStore ? currentStore.name : 'Loja Vinculada'}
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            {currentStore?.city || 'Recife - PE'} • Horário: {currentStore?.business_hours || '09:00 às 19:00'} • Gerente Responsável: <strong>{user?.name || 'Juliana Paes'}</strong>
          </p>
        </div>

        {/* Seletor de Loja & Navegação de Abas do Gerente */}
        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3">
          {stores.length > 1 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-400">Filial:</span>
              <select
                value={currentStore?.id || ''}
                onChange={e => setSelectedStoreId(e.target.value)}
                className="px-3 py-1.5 bg-dark-800 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-pitoco-blue"
              >
                {stores.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center bg-dark-800 p-1 rounded-xl border border-white/10">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'overview'
                  ? 'bg-white text-black shadow'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Visão Geral
            </button>
            <button
              onClick={() => setActiveTab('atendimento')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'atendimento'
                  ? 'bg-white text-black shadow'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Atendimento
            </button>
            <button
              onClick={() => setActiveTab('produtos')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'produtos'
                  ? 'bg-white text-black shadow'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Catálogo ({storeProducts.length})
            </button>
            <button
              onClick={() => setActiveTab('clientes')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'clientes'
                  ? 'bg-white text-black shadow'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Clientes ({storeContacts.length})
            </button>
          </div>
        </div>
      </div>

      {/* ABA 1: VISÃO GERAL / DASHBOARD DA FILIAL */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-5 bg-dark-900 border-white/10">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-400">Faturamento da Loja</span>
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-black text-white block">
                  {formatCurrency(currentStore?.monthly_revenue || 68400)}
                </span>
                <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1 mt-1">
                  <TrendingUp className="w-3 h-3" /> +14.2% em relação ao mês anterior
                </span>
              </div>
            </Card>

            <Card className="p-5 bg-dark-900 border-white/10">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-400">Ticket Médio (Enxovais)</span>
                <div className="p-2 rounded-xl bg-pitoco-blue/10 text-pitoco-blue border border-pitoco-blue/20">
                  <ShoppingBag className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-black text-white block">
                  R$ 412,50
                </span>
                <span className="text-[11px] text-zinc-400 block mt-1">
                  Média por pedido concluído
                </span>
              </div>
            </Card>

            <Card className="p-5 bg-dark-900 border-white/10">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-400">Conversas Ativas</span>
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  <MessageSquare className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-black text-white block">
                  {currentStore?.active_chats || 18}
                </span>
                <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1 mt-1">
                  Tempo médio de resposta: 2m 45s
                </span>
              </div>
            </Card>

            <Card className="p-5 bg-dark-900 border-white/10">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-400">Alertas de Estoque</span>
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-black text-white block">
                  {lowStockProducts.length}
                </span>
                <span className="text-[11px] text-amber-400 font-medium block mt-1">
                  {lowStockProducts.length > 0 ? 'Peças com estoque reduzido' : 'Estoque regularizado'}
                </span>
              </div>
            </Card>
          </div>

          {/* Grid de Supervisão Rápida */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Alertas de Estoque Baixo */}
            <Card className="p-6 bg-dark-900 border-white/10">
              <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-bold text-white">Peças em Atenção de Estoque (≤ 15 un.)</h3>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setActiveTab('produtos')}
                  className="text-xs border-white/10 text-zinc-300"
                >
                  Ver Catálogo
                </Button>
              </div>

              <div className="space-y-3">
                {lowStockProducts.slice(0, 4).map(prod => (
                  <div key={prod.id} className="flex items-center justify-between p-3 rounded-xl bg-dark-850 border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-dark-900 border border-white/10 overflow-hidden flex items-center justify-center text-xs font-bold text-white shrink-0">
                        {prod.image_url ? (
                          <img src={prod.image_url} alt={prod.name} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} />
                        ) : (
                          prod.name[0]
                        )}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white">{prod.name}</h4>
                        <p className="text-[11px] text-zinc-400">R$ {prod.price.toFixed(2)} • {prod.material || 'Algodão Pima'}</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {prod.stock_quantity} un. restantes
                    </span>
                  </div>
                ))}
                {lowStockProducts.length === 0 && (
                  <p className="text-xs text-zinc-500 py-6 text-center">Nenhum produto com estoque crítico no momento.</p>
                )}
              </div>
            </Card>

            {/* Ações de Supervisão & Consultoras */}
            <Card className="p-6 bg-dark-900 border-white/10">
              <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-4">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-pitoco-blue" />
                  <h3 className="text-sm font-bold text-white">Equipe de Atendimento da Loja</h3>
                </div>
                <Button
                  size="sm"
                  onClick={() => setActiveTab('atendimento')}
                  className="text-xs bg-white text-black font-bold"
                >
                  Abrir Atendimento
                </Button>
              </div>

              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-dark-850 border border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-pitoco-blue/20 text-pitoco-blue flex items-center justify-center font-bold text-xs">
                      S
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">Sofia Alencar</h4>
                      <p className="text-[11px] text-zinc-400">Consultora VIP de Enxovais</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                    Online • 4 chats ativos
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-dark-850 border border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-xs">
                      M
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">Mariana Costa</h4>
                      <p className="text-[11px] text-zinc-400">Atendimento Geral & WhatsApp</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                    Online • 6 chats ativos
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-dark-850 border border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-zinc-800 text-zinc-400 flex items-center justify-center font-bold text-xs">
                      🤖
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">Robô Pitoco Automático</h4>
                      <p className="text-[11px] text-zinc-400">Filtragem inicial e PIX</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-800 text-zinc-300">
                    8 conversas em triagem
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ABA 2: ATENDIMENTO HUMANO DA FILIAL */}
      {activeTab === 'atendimento' && (
        <div className="space-y-4">
          <AtendimentoHumanoInbox 
            portalMode="gerente" 
            initialStoreId={currentStore?.id} 
            onNavigate={onNavigate}
          />
        </div>
      )}

      {/* ABA 3: CATÁLOGO DE PRODUTOS (MODO GERENCIAL / SUPERVISÃO) */}
      {activeTab === 'produtos' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-dark-900 border border-white/10">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-pitoco-pink" />
                Catálogo de Peças da Filial ({storeProducts.length})
              </h2>
              <p className="text-xs text-zinc-400">
                Supervisão de peças, tamanhos, preços e disponibilidade de estoque
              </p>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar peça no estoque..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-dark-800 border border-white/10 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-pitoco-pink"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {storeProducts
              .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || (p.description || '').toLowerCase().includes(searchTerm.toLowerCase()))
              .map(prod => (
                <Card key={prod.id} className="p-4 bg-dark-900 border-white/10 flex flex-col justify-between">
                  <div>
                    <div className="w-full h-44 rounded-xl bg-dark-850 border border-white/10 overflow-hidden flex items-center justify-center mb-3">
                      {prod.image_url ? (
                        <img src={prod.image_url} alt={prod.name} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} />
                      ) : (
                        <ShoppingBag className="w-10 h-10 text-zinc-600" />
                      )}
                    </div>
                    <h3 className="text-sm font-bold text-white line-clamp-1">{prod.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm font-black text-emerald-400">R$ {prod.price.toFixed(2)}</span>
                      {prod.promotional_price && (
                        <span className="text-xs text-zinc-500 line-through">R$ {prod.promotional_price.toFixed(2)}</span>
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-1 line-clamp-2">{prod.description}</p>
                    <div className="mt-2 text-[10px] text-zinc-400">
                      Tamanhos: {(prod.sizes || []).join(', ') || 'Único'}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                    <span className={`text-xs font-bold ${prod.stock_quantity > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {prod.stock_quantity > 0 ? `✓ ${prod.stock_quantity} em estoque` : '✗ Esgotado'}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-zinc-300">
                      Filial: {currentStore?.slug || 'Matriz'}
                    </span>
                  </div>
                </Card>
              ))}
          </div>
        </div>
      )}

      {/* ABA 4: CLIENTES & CRM DA FILIAL */}
      {activeTab === 'clientes' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-dark-900 border border-white/10">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-pitoco-blue" />
                Carteira de Clientes da Loja ({storeContacts.length})
              </h2>
              <p className="text-xs text-zinc-400">
                Mamães, papais e contatos atendidos na filial com registro de bebê e data do parto
              </p>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por nome, bebê ou WhatsApp..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-dark-800 border border-white/10 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-pitoco-blue"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {storeContacts
              .filter(c => (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || (c.phone || '').includes(searchTerm) || (c.baby_name || '').toLowerCase().includes(searchTerm.toLowerCase()))
              .map(c => (
                <Card key={c.id} className="p-4 bg-dark-900 border-white/10 flex flex-col justify-between gap-3">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center font-bold text-white text-xs">
                          {(c.name || 'C')[0]}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-white">{c.name}</h4>
                          <span className="text-[11px] text-zinc-400">{c.phone}</span>
                        </div>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-pitoco-blue/20 text-pitoco-blue font-semibold">
                        {currentStore?.slug || 'Matriz'}
                      </span>
                    </div>

                    <div className="mt-3 p-2.5 rounded-lg bg-dark-850 border border-white/5 space-y-1 text-xs">
                      <div className="flex items-center justify-between text-zinc-300">
                        <span>Bebê:</span>
                        <strong className="text-white">{c.baby_name || 'Não informado'}</strong>
                      </div>
                      <div className="flex items-center justify-between text-zinc-300">
                        <span>Parto Previsto (DPP):</span>
                        <span className="text-zinc-300">{c.due_date || 'Não informada'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1 pt-1 border-t border-white/5">
                    {(c.tags || ['Cliente Loja']).map((t, idx) => (
                      <span key={idx} className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-zinc-400 border border-white/5">
                        {t}
                      </span>
                    ))}
                  </div>
                </Card>
              ))}
            {storeContacts.length === 0 && (
              <div className="col-span-3 text-center py-12 text-zinc-500 text-xs">
                Nenhum cliente registrado para esta loja ainda.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
