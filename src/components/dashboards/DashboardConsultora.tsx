import React, { useState } from 'react';
import { 
  MessageSquare, 
  Heart, 
  ShoppingBag, 
  Calendar, 
  Clock, 
  ArrowRight, 
  Copy, 
  Check, 
  Search, 
  ExternalLink,
  Sparkles,
  LifeBuoy
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Product, VIPConsultation } from '../../types';
import { formatCurrency } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

interface DashboardConsultoraProps {
  products: Product[];
  consultations: VIPConsultation[];
  onNavigateTab: (tab: any) => void;
}

export const DashboardConsultora: React.FC<DashboardConsultoraProps> = ({
  products,
  consultations,
  onNavigateTab,
}) => {
  const { user } = useAuth();
  const { success } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.material && p.material.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleCopyProductInfo = (product: Product) => {
    const text = `🍼 *${product.name}*\n💰 Preço: ${formatCurrency(product.price)}\n✨ Tecido: ${product.material || '100% Algodão'}\n📏 Tamanhos: ${product.sizes.join(', ')}\n\n_Qualquer dúvida estou à disposição para separar para você!_`;
    navigator.clipboard.writeText(text);
    setCopiedId(product.id);
    success('Copiado para o WhatsApp!', 'Texto pronto para colar na conversa com a mamãe.');
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Consultora Greeting Banner */}
      <div className="p-6 rounded-2xl bg-[#0c0c0e] border border-white/10 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-pink-500/10 text-pink-400 border border-pink-500/20 font-mono">
              PAINEL DE ATENDIMENTO VIP
            </span>
            <span className="text-xs text-zinc-400 font-medium">
              Vendas Humanizadas & Consultoria de Enxoval
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Heart className="w-5 h-5 text-pink-400" />
            Olá, {user?.name || 'Sofia (Consultora VIP)'}!
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Seu espaço de atendimento ágil: converse com as mamães no WhatsApp e consulte peças do catálogo.
          </p>
        </div>

        <Button
          onClick={() => onNavigateTab('atendimento')}
          className="bg-white hover:bg-zinc-200 text-black font-bold text-xs py-2.5 px-5 shadow-md flex items-center gap-2"
        >
          <MessageSquare className="w-4 h-4" />
          Abrir Inbox de Atendimento
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Consultora KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card className="p-4 sm:p-5 bg-[#0c0c0e] border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400">Minhas Conversas</span>
            <div className="p-2 rounded-xl bg-pink-500/10 text-pink-400 border border-pink-500/20">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl sm:text-2xl font-black text-white block">Ativas</span>
            <span className="text-[10px] text-zinc-400 font-medium mt-1 block">
              Atendimento em tempo real
            </span>
          </div>
        </Card>

        <Card className="p-4 sm:p-5 bg-[#0c0c0e] border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400">Consultorias de Hoje</span>
            <div className="p-2 rounded-xl bg-white/5 text-white border border-white/10">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl sm:text-2xl font-black text-white block">
              {consultations.length}
            </span>
            <span className="text-[10px] text-zinc-400 font-medium mt-1 block">
              Agendamentos confirmados
            </span>
          </div>
        </Card>

        <Card className="p-4 sm:p-5 bg-[#0c0c0e] border-white/10 col-span-2 md:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400">Peças no Catálogo</span>
            <div className="p-2 rounded-xl bg-white/5 text-white border border-white/10">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl sm:text-2xl font-black text-white block">
              {products.length}
            </span>
            <span className="text-[10px] text-zinc-400 font-medium mt-1 block">
              Prontas para envio no chat
            </span>
          </div>
        </Card>
      </div>

      {/* Consultora Quick Catalog Workbench */}
      <Card className="p-5 sm:p-6 bg-[#0c0c0e] border-white/10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-pink-400" />
              Catálogo Rápido para Envio no Chat
            </h3>
            <p className="text-xs text-zinc-400">
              Copie informações completas das peças para enviar para a cliente com 1 clique
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome ou tecido..."
              className="w-full pl-9 pr-3 py-2 bg-[#141416] border border-white/10 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredProducts.slice(0, 6).map(prod => (
            <div key={prod.id} className="p-3.5 rounded-xl bg-[#141416] border border-white/5 hover:border-white/15 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <span className="text-xs font-bold text-white line-clamp-1">{prod.name}</span>
                  <span className="text-xs font-bold text-emerald-400 shrink-0">
                    {formatCurrency(prod.price)}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 line-clamp-1 mb-2">
                  {prod.material || 'Algodão Suedine'} • Tam: {prod.sizes.join(', ')}
                </p>
              </div>

              <Button
                size="sm"
                variant="outline"
                onClick={() => handleCopyProductInfo(prod)}
                className="w-full text-[11px] border-white/10 hover:bg-white/5 text-zinc-200 mt-2 flex items-center justify-center gap-1.5"
              >
                {copiedId === prod.id ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-semibold">Copiado para o Chat!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copiar Detalhes
                  </>
                )}
              </Button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
