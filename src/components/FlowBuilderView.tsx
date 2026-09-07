import React, { useState } from 'react';
import { 
  GitFork, 
  Play, 
  Save, 
  Plus, 
  Sparkles, 
  Smartphone, 
  Layers, 
  CheckCircle2, 
  Store, 
  ShoppingBag, 
  Calendar, 
  CreditCard, 
  Truck, 
  Users, 
  MessageSquare,
  ShieldCheck
} from 'lucide-react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { useToast } from '../contexts/ToastContext';
import { FlowSimulator } from './flow-builder/FlowSimulator';
import { initialFlowNodes, initialFlowEdges } from '../lib/mockData';

interface FlowBuilderViewProps {
  onNavigate?: (path: string) => void;
}

export const FlowBuilderView: React.FC<FlowBuilderViewProps> = ({ onNavigate }) => {
  const { success, info } = useToast();
  const [isSimulating, setIsSimulating] = useState(false);
  const [activeTab, setActiveTab] = useState<'canvas' | 'nodes' | 'settings'>('canvas');

  const pitocoNodes = [
    {
      id: 'node-trigger',
      title: 'Gatilho de Mensagem Recebida',
      type: 'trigger',
      category: 'Início',
      color: 'border-pitoco-blue bg-pitoco-blue/10',
      description: 'Dispara o fluxo imediatamente quando qualquer cliente envia mensagem para o WhatsApp.',
      icon: MessageSquare,
    },
    {
      id: 'node-welcome',
      title: 'Boas-Vindas Pitoco de Gente',
      type: 'message',
      category: 'Atendimento',
      color: 'border-pitoco-pink bg-pitoco-pink/10',
      description: 'Envia a saudação calorosa e apresenta o menu de 1 a 7 para autoatendimento.',
      icon: Sparkles,
    },
    {
      id: 'node-catalog',
      title: 'Catálogo de Produtos & Enxoval',
      type: 'show_catalog',
      category: 'Vendas',
      color: 'border-emerald-500 bg-emerald-500/10',
      description: 'Exibe bodies 100% suedine, macacões com zíper duplo, saídas de maternidade e kits de berço.',
      icon: ShoppingBag,
    },
    {
      id: 'node-measures',
      title: 'Guia de Medidas (RN ao 3 anos)',
      type: 'measure_guide',
      category: 'Consultoria',
      color: 'border-amber-500 bg-amber-500/10',
      description: 'Informa peso, altura recomendada e mês a mês para ajudar as mamães na escolha exata do tamanho.',
      icon: Layers,
    },
    {
      id: 'node-maternity',
      title: 'Checklist Mala de Maternidade',
      type: 'layette_checklist',
      category: 'Consultoria',
      color: 'border-purple-500 bg-purple-500/10',
      description: 'Checklist essencial com itens recomendados para as 48 horas de hospital.',
      icon: Calendar,
    },
    {
      id: 'node-vip',
      title: 'Consultoria VIP com Agendamento',
      type: 'vip_consultation',
      category: 'Atendimento',
      color: 'border-pitoco-blue bg-pitoco-blue/10',
      description: 'Agenda horário exclusivo com consultora especialista (Online via WhatsApp ou Presencial).',
      icon: Users,
    },
    {
      id: 'node-frete',
      title: 'Cálculo de Frete & Entrega Express',
      type: 'shipping_calculator',
      category: 'Logística',
      color: 'border-sky-500 bg-sky-500/10',
      description: 'Opções de entrega: Motoboy no mesmo dia, Correios para todo o Brasil e Retirada Grátis em Loja.',
      icon: Truck,
    },
    {
      id: 'node-pix',
      title: 'Pagamento PIX Copia e Cola',
      type: 'pix_payment',
      category: 'Financeiro',
      color: 'border-emerald-500 bg-emerald-500/10',
      description: 'Gera chave oficial, código Copia e Cola e QR Code para pagamento instantâneo do pedido.',
      icon: CreditCard,
    },
    {
      id: 'node-handoff',
      title: 'Transbordo Humano por Filial',
      type: 'human_handoff',
      category: 'Multi-Lojas',
      color: 'border-rose-500 bg-rose-500/10',
      description: 'Direciona a conversa para a Loja Matriz Centro, Shopping Boulevard ou E-commerce.',
      icon: Store,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-dark-900 border border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-pitoco-blue/20 text-pitoco-blue border border-pitoco-blue/30 flex items-center gap-1.5">
              <GitFork className="w-3.5 h-3.5" />
              Flow Studio 2.0
            </span>
            <span className="text-xs text-emerald-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Fluxo Ativo no WhatsApp
            </span>
          </div>
          <h2 className="text-xl font-bold text-white">
            Automação & Árvore de Vendas Pitoco de Gente
          </h2>
          <p className="text-xs text-slate-400">
            Gerencie visualmente a jornada completa do cliente desde a recepção até a conversão e transbordo por loja.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => setIsSimulating(!isSimulating)}
            className={`text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-2 ${
              isSimulating 
                ? 'bg-pitoco-pink text-slate-950' 
                : 'bg-white/10 hover:bg-white/15 text-white'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            {isSimulating ? 'Fechar Simulador' : 'Testar no Celular'}
          </Button>
          <Button
            size="sm"
            onClick={() => success('Fluxo oficial salvo e sincronizado com o robô da Discloud!')}
            className="bg-pitoco-blue text-slate-900 hover:bg-pitoco-blue/90 font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Publicar Alterações
          </Button>
        </div>
      </div>

      {/* Grid Principal */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Lado Esquerdo: Canvas e Nós Visuais */}
        <div className={isSimulating ? 'md:col-span-8' : 'md:col-span-12'}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {pitocoNodes.map((node, index) => {
              const IconComp = node.icon;
              return (
                <Card 
                  key={node.id} 
                  className={`p-4 bg-dark-900 border transition-all hover:scale-[1.01] hover:shadow-lg ${node.color}`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-dark-950/80 border border-white/5 text-white">
                        <IconComp className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                          Passo {index + 1} • {node.category}
                        </span>
                        <h4 className="text-xs font-bold text-white">
                          {node.title}
                        </h4>
                      </div>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-300 line-clamp-2 mt-2">
                    {node.description}
                  </p>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Lado Direito: Simulador de WhatsApp Live */}
        {isSimulating && (
          <div className="md:col-span-4 sticky top-6">
            <Card className="p-4 bg-dark-900 border-white/10 flex flex-col items-center">
              <div className="w-full flex items-center justify-between pb-3 mb-3 border-b border-white/5">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-pitoco-blue" />
                  Simulador de Mensagens
                </span>
                <span className="text-[10px] text-emerald-400 font-medium">WhatsApp Web</span>
              </div>
              <FlowSimulator />
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};
