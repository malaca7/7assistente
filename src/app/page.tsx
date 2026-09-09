'use client';

import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  Sparkles, 
  MessageSquare, 
  Calendar, 
  Heart, 
  ShieldCheck, 
  Truck, 
  Check, 
  ChevronRight, 
  Star, 
  Phone, 
  MapPin, 
  Layers,
  ArrowRight,
  CreditCard,
  Building2,
  ExternalLink
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { StorageService } from '../lib/storage';
import { Product, Store, MeasureGuideItem } from '../types';
import { PITOCO_MEASURE_GUIDE, getLayetteChecklistText } from '../lib/botEngine';
import { useToast } from '../contexts/ToastContext';

export default function StorefrontPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [activeTab, setActiveTab] = useState<'catalogo' | 'medidas' | 'mala' | 'consultoria' | 'lojas'>('catalogo');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>('RN');
  const [selectedColor, setSelectedColor] = useState<string>('Azul Bebê');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const { success, info } = useToast();

  // Consultoria VIP form state
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [preferredStore, setPreferredStore] = useState('store-001');

  useEffect(() => {
    async function load() {
      const [p, s] = await Promise.all([
        StorageService.getProducts(),
        StorageService.getStores(),
      ]);
      setProducts(p);
      setStores(s);
    }
    load();
  }, []);

  const filteredProducts = selectedCategory === 'all'
    ? products
    : products.filter(p => p.category_id === selectedCategory);

  const handleBookConsultation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !clientPhone.trim()) return;

    await StorageService.saveVIPConsultation({
      client_name: clientName,
      client_phone: clientPhone,
      due_date: dueDate,
      store_id: preferredStore,
      consultation_type: 'online_whatsapp',
      consultation_date: new Date().toISOString().split('T')[0],
      consultation_time: '15:00',
    });

    success('Consultoria VIP Agendada com Sucesso!', 'Nossa consultora entrará em contato via WhatsApp');
    setClientName('');
    setClientPhone('');
    setDueDate('');
  };

  const openWhatsAppDirect = () => {
    const text = encodeURIComponent('Olá! Gostaria de conhecer o catálogo e agendar uma consultoria na Pitoco de Gente! 👶💕');
    window.open(`https://wa.me/5581996138924?text=${text}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-dark-950 text-slate-200 flex flex-col font-sans">
      {/* Top Notification Bar */}
      <div className="bg-gradient-to-r from-pitoco-blue via-pitoco-pink to-pitoco-mint py-2 px-4 text-center text-xs font-bold text-slate-950">
        ✨ FRETE GRÁTIS EM COMPRAS ACIMA DE R$ 250 • RETIRADA EM 2H NAS LOJAS FÍSICAS • PARCELAMENTO EM ATÉ 6X SEM JUROS
      </div>

      {/* Main Header */}
      <header className="h-20 border-b border-white/10 bg-dark-900/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl overflow-hidden border border-white/10 shadow-glow-primary p-0.5 bg-dark-900/60 flex items-center justify-center">
            <img 
              src="https://pitoco.malaca.com.br/logo.png" 
              onError={(e) => { e.currentTarget.src = '/logo.png'; }}
              alt="Logo Pitoco de Gente" 
              className="w-full h-full object-contain" 
            />
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
              Pitoco de Gente
            </h1>
            <p className="text-xs text-slate-400">
              Roupas de Bebê, Infantil e Enxovais
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 bg-dark-800 p-1.5 rounded-xl border border-white/5 text-xs font-semibold">
          {[
            { id: 'catalogo', label: 'Catálogo de Produtos' },
            { id: 'medidas', label: 'Guia de Medidas (RN ao 3)' },
            { id: 'mala', label: 'Mala de Maternidade' },
            { id: 'consultoria', label: 'Consultoria VIP' },
            { id: 'lojas', label: 'Nossas Lojas' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-lg transition-all ${
                activeTab === tab.id
                  ? 'bg-pitoco-blue text-slate-950 font-bold shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Button
            onClick={openWhatsAppDirect}
            className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-lg"
          >
            <MessageSquare className="w-4 h-4" />
            <span className="hidden sm:inline">Comprar no WhatsApp</span>
          </Button>
          <a
            href="/admin"
            className="text-xs text-slate-400 hover:text-white px-2 py-1 underline font-medium"
          >
            Acesso Lojista / Admin
          </a>
        </div>
      </header>

      {/* Hero Banner */}
      <section className="relative overflow-hidden py-12 px-6 border-b border-white/5 bg-gradient-to-b from-dark-900 to-dark-950">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-pitoco-blue/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-pitoco-pink/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center space-y-4 relative z-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-pitoco-pink/20 text-pitoco-pink border border-pitoco-pink/30">
            <Heart className="w-3.5 h-3.5 fill-current" />
            Amor, Delicadeza & Conforto nos Primeiros Dias
          </span>
          <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight">
            O Enxoval dos Sonhos para o seu Maior Amor.
          </h2>
          <p className="text-sm md:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Bodies em puro algodão suedine 100% Pima, macacões práticos com zíper duplo frontal, saídas de maternidade luxo em tricot antialérgico e kits de berço premium.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Button
              onClick={() => setActiveTab('consultoria')}
              className="bg-pitoco-blue hover:bg-pitoco-blue/90 text-slate-950 font-bold text-xs px-6 py-3 rounded-xl shadow-glow-primary flex items-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              Agendar Consultoria VIP Gratuita
            </Button>
            <Button
              variant="outline"
              onClick={() => setActiveTab('medidas')}
              className="border-white/10 hover:bg-white/5 text-white text-xs px-6 py-3 rounded-xl"
            >
              <Layers className="w-4 h-4 mr-1.5" />
              Consultar Guia de Medidas
            </Button>
          </div>
        </div>
      </section>

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-6 space-y-10">
        
        {/* ABA: CATÁLOGO */}
        {activeTab === 'catalogo' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-pitoco-blue" />
                  Coleção & Peças Essenciais
                </h3>
                <p className="text-xs text-slate-400">
                  Selecione os itens para ver detalhes, tamanhos e pedir diretamente pelo WhatsApp.
                </p>
              </div>

              {/* Category Filter */}
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                {[
                  { id: 'all', label: 'Todos os Produtos' },
                  { id: 'cat-001', label: 'Bodies Suedine 100%' },
                  { id: 'cat-002', label: 'Macacões Zíper Duplo' },
                  { id: 'cat-003', label: 'Saídas de Maternidade' },
                  { id: 'cat-004', label: 'Kits de Berço' },
                  { id: 'cat-005', label: 'Malas Térmicas' },
                ].map(c => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCategory(c.id)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-colors ${
                      selectedCategory === c.id
                        ? 'bg-pitoco-blue text-slate-950 font-bold'
                        : 'bg-dark-900 border border-white/5 text-slate-300 hover:text-white'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Product Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map(prod => (
                <Card 
                  key={prod.id} 
                  className="bg-dark-900 border-white/10 hover:border-pitoco-blue/60 transition-all flex flex-col justify-between overflow-hidden group shadow-lg"
                >
                  <div className="relative">
                    {prod.image_url && (
                      <div className="w-full h-56 overflow-hidden bg-dark-950">
                        <img 
                          src={prod.image_url} 
                          alt={prod.name} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    {prod.promotional_price && (
                      <span className="absolute top-3 right-3 px-2 py-0.5 rounded-md text-[10px] font-bold bg-pitoco-pink text-slate-950 shadow-md">
                        OFERTA ESPECIAL
                      </span>
                    )}
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] text-pitoco-blue font-bold uppercase tracking-wider block">
                        {prod.material || 'Algodão Suedine 100%'}
                      </span>
                      <h4 className="text-sm font-bold text-white mt-1 group-hover:text-pitoco-blue transition-colors">
                        {prod.name}
                      </h4>
                      <p className="text-xs text-slate-400 line-clamp-2 mt-1">
                        {prod.description}
                      </p>

                      <div className="mt-3 flex items-baseline gap-2">
                        <span className="text-xl font-bold text-white">
                          R$ {(prod.promotional_price || prod.price).toFixed(2).replace('.', ',')}
                        </span>
                        {prod.promotional_price && (
                          <span className="text-xs text-slate-500 line-through">
                            R$ {prod.price.toFixed(2).replace('.', ',')}
                          </span>
                        )}
                      </div>

                      {/* Sizes badges */}
                      <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] text-slate-500">Tamanhos:</span>
                        {prod.sizes.map((s, idx) => (
                          <span 
                            key={idx}
                            className="px-2 py-0.5 rounded text-[10px] bg-dark-800 text-slate-300 border border-white/5"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-white/5 flex items-center gap-2">
                      <Button
                        onClick={() => {
                          const text = encodeURIComponent(`Olá! Tenho interesse no produto: *${prod.name}* (R$ ${(prod.promotional_price || prod.price).toFixed(2).replace('.', ',')}). Poderiam me passar os detalhes?`);
                          window.open(`https://wa.me/5581996138924?text=${text}`, '_blank');
                        }}
                        className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs py-2 rounded-xl flex items-center justify-center gap-1.5"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        Comprar no WhatsApp
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* ABA: GUIA DE MEDIDAS */}
        {activeTab === 'medidas' && (
          <div className="space-y-6 max-w-4xl mx-auto">
            <div className="text-center space-y-2">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-pitoco-blue/20 text-pitoco-blue border border-pitoco-blue/30">
                Tabela Oficial de Medidas
              </span>
              <h3 className="text-2xl font-bold text-white">
                Como escolher o tamanho perfeito para o seu bebê?
              </h3>
              <p className="text-xs text-slate-400 max-w-xl mx-auto">
                Bebês crescem muito rápido nas primeiras semanas. Acompanhe a estimativa de peso e altura recomendada para cada faixa etária:
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {PITOCO_MEASURE_GUIDE.map((m, idx) => (
                <Card key={idx} className="p-5 bg-dark-900 border-white/10 hover:border-pitoco-blue transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-lg font-black text-pitoco-blue">
                      {m.size}
                    </span>
                    <span className="text-xs font-medium text-slate-400">
                      {m.ageRange}
                    </span>
                  </div>
                  <div className="space-y-1.5 text-xs text-slate-300 border-t border-white/5 pt-2">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Peso ideal:</span>
                      <strong className="text-white">{m.weightRange}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Altura:</span>
                      <strong className="text-white">{m.heightRange}</strong>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-2 italic">
                      💡 {m.description}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* ABA: MALA DE MATERNIDADE */}
        {activeTab === 'mala' && (
          <div className="max-w-3xl mx-auto space-y-6">
            <Card className="p-6 md:p-8 bg-dark-900 border-white/10 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-pitoco-pink/20 text-pitoco-pink border border-pitoco-pink/30">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Checklist da Mala de Maternidade</h3>
                  <p className="text-xs text-slate-400">Tudo o que você precisa levar para o hospital para 48h a 72h</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-4 text-xs text-slate-300">
                {[
                  '6 Bodies manga longa em algodão suedine 100% Pima',
                  '6 Macacões com zíper duplo frontal e pezinho reversível',
                  '6 Calças mijão em malha macia',
                  '2 Saídas de maternidade completas em tricot luxo antialérgico',
                  '6 Paninhos de boca atoalhados bordados',
                  '3 Fraldas de ombro em tecido duplo',
                  '3 Pares de luvinhas e meinhas sem costura interna',
                  '2 Touquinhas em suedine',
                  '1 Manta quentinha antialérgica extra',
                  '1 Pacote de fraldas descartáveis RN',
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-dark-800 border border-white/5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-white/5 flex justify-end">
                <Button
                  onClick={openWhatsAppDirect}
                  className="bg-pitoco-blue text-slate-950 font-bold text-xs px-5 py-2.5 rounded-xl"
                >
                  Montar Mala com Consultora no WhatsApp
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* ABA: CONSULTORIA VIP */}
        {activeTab === 'consultoria' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <Card className="p-6 md:p-8 bg-dark-900 border-white/10 space-y-6">
              <div className="text-center space-y-2">
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-pitoco-blue/20 text-pitoco-blue border border-pitoco-blue/30">
                  Atendimento Especializado
                </span>
                <h3 className="text-2xl font-bold text-white">
                  Consultoria VIP de Enxoval
                </h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Agende um horário exclusivo com uma de nossas consultoras para montar o enxoval perfeito sem desperdícios, seja online ou presencialmente em uma de nossas lojas.
                </p>
              </div>

              <form onSubmit={handleBookConsultation} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Seu Nome Completo:</label>
                  <input
                    type="text"
                    value={clientName}
                    onChange={e => setClientName(e.target.value)}
                    placeholder="Ex: Mariana Silva"
                    className="w-full bg-dark-800 border border-white/10 rounded-xl p-2.5 text-xs text-white"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">WhatsApp para Contato:</label>
                  <input
                    type="text"
                    value={clientPhone}
                    onChange={e => setClientPhone(e.target.value)}
                    placeholder="81996138924"
                    className="w-full bg-dark-800 border border-white/10 rounded-xl p-2.5 text-xs text-white"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Data Prevista do Parto (DPP):</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    className="w-full bg-dark-800 border border-white/10 rounded-xl p-2.5 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Unidade de Preferência:</label>
                  <select
                    value={preferredStore}
                    onChange={e => setPreferredStore(e.target.value)}
                    className="w-full bg-dark-800 border border-white/10 rounded-xl p-2.5 text-xs text-white"
                  >
                    <option value="store-001">Loja Matriz — Centro (Rua do Sol, 120)</option>
                    <option value="store-002">Loja Ipojuca - Filial (Rodovia PE-060, Centro)</option>
                    <option value="store-003">Online via Vídeo Chamada WhatsApp</option>
                  </select>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-pitoco-blue hover:bg-pitoco-blue/90 text-slate-950 font-bold text-xs py-3 rounded-xl shadow-glow-primary flex items-center justify-center gap-2"
                >
                  <Calendar className="w-4 h-4" />
                  Confirmar Agendamento de Consultoria
                </Button>
              </form>
            </Card>
          </div>
        )}

        {/* ABA: NOSSAS LOJAS */}
        {activeTab === 'lojas' && (
          <div className="space-y-6">
            <div className="text-center space-y-1">
              <h3 className="text-2xl font-bold text-white">Nossas Unidades Físicas & Canais</h3>
              <p className="text-xs text-slate-400">Venha nos visitar ou retire seus pedidos com toda comodidade</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {stores.map(s => (
                <Card key={s.id} className="p-6 bg-dark-900 border-white/10 space-y-3">
                  <span className="text-[10px] text-pitoco-blue font-bold uppercase tracking-wider">
                    {s.slug === 'ecommerce' ? 'E-commerce Brasil' : 'Loja Física'}
                  </span>
                  <h4 className="text-lg font-bold text-white">{s.name}</h4>
                  <p className="text-xs text-slate-300 flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                    <span>{s.address}</span>
                  </p>
                  <p className="text-xs text-slate-300 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-slate-500 shrink-0" />
                    <span>WhatsApp: {s.whatsapp_number}</span>
                  </p>
                  <Button
                    onClick={openWhatsAppDirect}
                    variant="outline"
                    className="w-full text-xs border-white/10 hover:bg-white/5 text-slate-300 mt-2"
                  >
                    Falar com a Equipe desta Loja
                  </Button>
                </Card>
              ))}
            </div>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-dark-900 py-8 px-6 text-center text-xs text-slate-500">
        <p>© 2026 Pitoco de Gente Artigos Infantis LTDA. Todos os direitos reservados.</p>
        <p className="mt-1">Recife - PE • CNPJ: 45.123.456/0001-89 • pitoco.malaca.com.br</p>
      </footer>
    </div>
  );
}
