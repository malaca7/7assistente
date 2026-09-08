import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Search, 
  Copy, 
  Check, 
  Braces, 
  Sparkles, 
  Building2, 
  User, 
  ShoppingBag, 
  Bot, 
  Sliders, 
  Plus, 
  Database,
  Layers,
  ArrowRight
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { StorageService } from '../../lib/storage';
import { useToast } from '../../contexts/ToastContext';
import { FlowNode } from '../../types';

export interface VariableItem {
  key: string;
  syntax: string;
  label: string;
  category: 'system' | 'client' | 'store' | 'ecommerce' | 'flow';
  description: string;
  exampleValue: string;
}

export interface FlowVariablesModalProps {
  isOpen: boolean;
  onClose: () => void;
  flowNodes?: FlowNode[];
  onSelectVariable?: (syntax: string) => void;
}

export const FlowVariablesModal: React.FC<FlowVariablesModalProps> = ({
  isOpen,
  onClose,
  flowNodes = [],
  onSelectVariable,
}) => {
  const { success } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Variáveis Customizadas cadastradas pelo Admin
  const [customVariables, setCustomVariables] = useState<Array<{ key: string; value: string; description?: string }>>([]);
  const [newVarKey, setNewVarKey] = useState('');
  const [newVarValue, setNewVarValue] = useState('');
  const [newVarDesc, setNewVarDesc] = useState('');
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Carregar dados de configurações do admin
  const [companySettings, setCompanySettings] = useState<any>(null);

  useEffect(() => {
    async function loadSystemData() {
      try {
        const [settings, customVars] = await Promise.all([
          StorageService.getSettings(),
          StorageService.getCustomVariables(),
        ]);
        setCompanySettings(settings);
        setCustomVariables(customVars || []);
      } catch (err) {
        console.error('Error loading system variables:', err);
      }
    }
    if (isOpen) {
      loadSystemData();
    }
  }, [isOpen]);

  // 1. Variáveis do Sistema & Empresa (Configuradas no Admin)
  const systemVariables: VariableItem[] = useMemo(() => {
    return [
      {
        key: 'nome_empresa',
        syntax: '{{nome_empresa}}',
        label: 'Nome Oficial da Empresa',
        category: 'system',
        description: 'Nome fantasia da rede configurado no painel.',
        exampleValue: companySettings?.company_name || 'Pitoco de Gente',
      },
      {
        key: 'whatsapp_oficial',
        syntax: '{{whatsapp_oficial}}',
        label: 'WhatsApp Oficial da Rede',
        category: 'system',
        description: 'Número unificado de WhatsApp conectado ao robô.',
        exampleValue: companySettings?.whatsapp_number || '81987300915',
      },
      {
        key: 'pix_chave',
        syntax: '{{pix_chave}}',
        label: 'Chave PIX Oficial',
        category: 'system',
        description: 'Chave PIX central da loja configurada para pagamentos.',
        exampleValue: companySettings?.pix_key || 'financeiro@pitocodegente.com.br',
      },
      {
        key: 'pix_beneficiario',
        syntax: '{{pix_beneficiario}}',
        label: 'Beneficiário do PIX',
        category: 'system',
        description: 'Razão social ou titular da chave PIX oficial.',
        exampleValue: companySettings?.pix_beneficiary || 'Pitoco de Gente Artigos Infantis Ltda',
      },
      {
        key: 'email_suporte',
        syntax: '{{email_suporte}}',
        label: 'E-mail de Suporte / SAC',
        category: 'system',
        description: 'Canal oficial de e-mail para atendimento a clientes.',
        exampleValue: companySettings?.support_email || 'contato@pitocodegente.com.br',
      },
      {
        key: 'horario_funcionamento',
        syntax: '{{horario_funcionamento}}',
        label: 'Horário Geral da Empresa',
        category: 'system',
        description: 'Horário de atendimento comercial padrão.',
        exampleValue: 'Seg a Sex: 08:00 às 18:00 | Sáb: 08:00 às 13:00',
      },
    ];
  }, [companySettings]);

  // 2. Variáveis de Cliente & CRM
  const clientVariables: VariableItem[] = [
    {
      key: 'nome_cliente',
      syntax: '{{nome_cliente}}',
      label: 'Nome do Cliente',
      category: 'client',
      description: 'Nome registrado no perfil do WhatsApp ou CRM.',
      exampleValue: 'Maria Luiza Silva',
    },
    {
      key: 'telefone_whatsapp',
      syntax: '{{telefone_whatsapp}}',
      label: 'Telefone do WhatsApp',
      category: 'client',
      description: 'Número de telefone do cliente no formato numérico limpo.',
      exampleValue: '5581987654321',
    },
    {
      key: 'nome_bebe',
      syntax: '{{nome_bebe}}',
      label: 'Nome do Bebê',
      category: 'client',
      description: 'Nome do bebê registrado na gestação ou ficha de enxoval.',
      exampleValue: 'Theo',
    },
    {
      key: 'data_parto',
      syntax: '{{data_parto}}',
      label: 'Data Prevista do Parto (DPP)',
      category: 'client',
      description: 'Mês ou data esperada do nascimento do bebê.',
      exampleValue: 'Novembro / 2026',
    },
    {
      key: 'tipo_cliente',
      syntax: '{{tipo_cliente}}',
      label: 'Tipo de Contato',
      category: 'client',
      description: 'Indica se o contato é "novo" (1ª vez) ou "recorrente".',
      exampleValue: 'recorrente',
    },
    {
      key: 'tags_cliente',
      syntax: '{{tags_cliente}}',
      label: 'Tags do Perfil',
      category: 'client',
      description: 'Etiquetas atribuídas ao cliente separadas por vírgula.',
      exampleValue: 'VIP, Enxoval Completo, Mala Maternidade',
    },
  ];

  // 3. Variáveis de Loja & Filiais
  const storeVariables: VariableItem[] = [
    {
      key: 'loja_selecionada',
      syntax: '{{loja_selecionada}}',
      label: 'Nome da Filial Escolhida',
      category: 'store',
      description: 'Nome da filial onde o cliente deseja atendimento ou retirada.',
      exampleValue: 'Loja Matriz Centro',
    },
    {
      key: 'loja_endereco',
      syntax: '{{loja_endereco}}',
      label: 'Endereço da Loja',
      category: 'store',
      description: 'Endereço físico completo da filial selecionada.',
      exampleValue: 'R. Vig. João Batista, 93 - Centro, Cabo de Santo Agostinho - PE',
    },
    {
      key: 'loja_horario',
      syntax: '{{loja_horario}}',
      label: 'Horário de Atendimento da Loja',
      category: 'store',
      description: 'Horário específico de funcionamento da filial.',
      exampleValue: 'Seg a Sáb: 08:00 às 18:00',
    },
    {
      key: 'gerente_loja',
      syntax: '{{gerente_loja}}',
      label: 'Gerente da Filial',
      category: 'store',
      description: 'Responsável pelo gerenciamento da filial.',
      exampleValue: 'Juliana Matriz',
    },
  ];

  // 4. Variáveis de E-commerce & Frete
  const ecommerceVariables: VariableItem[] = [
    {
      key: 'carrinho_total',
      syntax: '{{carrinho_total}}',
      label: 'Valor Total do Carrinho',
      category: 'ecommerce',
      description: 'Soma total dos itens selecionados com máscara monetária.',
      exampleValue: 'R$ 189,80',
    },
    {
      key: 'frete_tipo',
      syntax: '{{frete_tipo}}',
      label: 'Modalidade de Entrega',
      category: 'ecommerce',
      description: 'Motoboy Express, Sedex ou Retirada na Loja.',
      exampleValue: 'Motoboy Express',
    },
    {
      key: 'frete_valor',
      syntax: '{{frete_valor}}',
      label: 'Valor do Frete',
      category: 'ecommerce',
      description: 'Valor calculado da taxa de entrega.',
      exampleValue: 'R$ 15,00',
    },
    {
      key: 'codigo_pedido',
      syntax: '{{codigo_pedido}}',
      label: 'Código do Pedido',
      category: 'ecommerce',
      description: 'Identificador único do pedido gerado no bot.',
      exampleValue: '#PTC-9842',
    },
  ];

  // 5. Variáveis Detectadas no Fluxo Atual
  const flowVariables: VariableItem[] = useMemo(() => {
    const vars: VariableItem[] = [];
    const addedKeys = new Set<string>();

    flowNodes.forEach((node) => {
      const cfg = (node.data as any)?.config || {};
      const nodeType = (node.data as any)?.nodeType || node.type;

      // Question node variable
      if (cfg.variableName && !addedKeys.has(cfg.variableName)) {
        addedKeys.add(cfg.variableName);
        vars.push({
          key: cfg.variableName,
          syntax: `{{${cfg.variableName}}}`,
          label: `Resposta da Pergunta ("${node.data?.label || node.id}")`,
          category: 'flow',
          description: `Valor capturado na pergunta do nó ${node.data?.label || node.id}.`,
          exampleValue: 'Resposta do cliente',
        });
      }

      // Variable setter node
      if (cfg.varName && !addedKeys.has(cfg.varName)) {
        addedKeys.add(cfg.varName);
        vars.push({
          key: cfg.varName,
          syntax: `{{${cfg.varName}}}`,
          label: `Variável Definida ("${cfg.varName}")`,
          category: 'flow',
          description: `Valor atribuído no nó de variável: "${cfg.varValue ?? 'Personalizado'}"`,
          exampleValue: String(cfg.varValue || 'Ativo'),
        });
      }

      if (Array.isArray(cfg.assignments)) {
        cfg.assignments.forEach((ass: any) => {
          if (ass.varName && !addedKeys.has(ass.varName)) {
            addedKeys.add(ass.varName);
            vars.push({
              key: ass.varName,
              syntax: `{{${ass.varName}}}`,
              label: `Atribuição ("${ass.varName}")`,
              category: 'flow',
              description: `Operação ${ass.operation || 'set_value'}: "${ass.value ?? ''}"`,
              exampleValue: String(ass.value || 'Valor'),
            });
          }
        });
      }
    });

    return vars;
  }, [flowNodes]);

  // 6. Variáveis Personalizadas do Banco Admin
  const adminCustomVars: VariableItem[] = useMemo(() => {
    return customVariables.map((cv) => ({
      key: cv.key,
      syntax: `{{${cv.key}}}`,
      label: `Variável Admin: ${cv.key}`,
      category: 'system' as const,
      description: cv.description || 'Variável cadastrada nas configurações gerais do painel.',
      exampleValue: cv.value || '',
    }));
  }, [customVariables]);

  // Juntar todas
  const allVariables: VariableItem[] = useMemo(() => {
    return [
      ...systemVariables,
      ...adminCustomVars,
      ...clientVariables,
      ...storeVariables,
      ...ecommerceVariables,
      ...flowVariables,
    ];
  }, [systemVariables, adminCustomVars, clientVariables, storeVariables, ecommerceVariables, flowVariables]);

  // Filtragem
  const filteredVariables = useMemo(() => {
    return allVariables.filter((v) => {
      const matchesCat = selectedCategory === 'all' || v.category === selectedCategory;
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        v.key.toLowerCase().includes(term) ||
        v.label.toLowerCase().includes(term) ||
        v.description.toLowerCase().includes(term);
      return matchesCat && matchesSearch;
    });
  }, [allVariables, selectedCategory, searchTerm]);

  const handleCopy = (syntax: string, key: string) => {
    navigator.clipboard.writeText(syntax);
    setCopiedKey(key);
    success('Copiado!', `${syntax} pronto para colar em qualquer mensagem ou condição.`);
    setTimeout(() => setCopiedKey(null), 2000);
    if (onSelectVariable) {
      onSelectVariable(syntax);
    }
  };

  const handleSaveCustomVar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVarKey.trim()) return;
    const cleanKey = newVarKey.trim().replace(/\s+/g, '_').toLowerCase();

    const updated = [
      ...customVariables.filter((c) => c.key !== cleanKey),
      {
        key: cleanKey,
        value: newVarValue.trim(),
        description: newVarDesc.trim() || undefined,
      },
    ];

    await StorageService.saveCustomVariables(updated);
    setCustomVariables(updated);
    setNewVarKey('');
    setNewVarValue('');
    setNewVarDesc('');
    setIsAddingNew(false);
    success('Variável Salva!', `A variável {{${cleanKey}}} agora está disponível no robô.`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#0c0c0e] border border-white/10 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-dark-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-white">
              <Braces className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                Dicionário de Variáveis do Sistema & Fluxo
                <Badge variant="brand" className="text-[10px] bg-white/10 text-white border-white/20">
                  {allVariables.length} Variáveis
                </Badge>
              </h3>
              <p className="text-xs text-slate-400">
                Use a sintaxe <code className="text-zinc-200 font-mono bg-white/5 px-1 py-0.5 rounded">{'{{variavel}}'}</code> nas mensagens para substituição dinâmica em tempo real.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAddingNew(!isAddingNew)}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nova Variável</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Formulário de Adição Rápida de Nova Variável Global */}
        {isAddingNew && (
          <form onSubmit={handleSaveCustomVar} className="p-4 bg-dark-950 border-b border-white/10 space-y-3 animate-in slide-in-from-top-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-zinc-300" />
                Cadastrar Nova Variável Global no Painel Admin
              </h4>
              <button
                type="button"
                onClick={() => setIsAddingNew(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Cancelar
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <input
                type="text"
                placeholder="Nome da chave (ex: link_catalogo_pdf)"
                value={newVarKey}
                onChange={(e) => setNewVarKey(e.target.value)}
                required
                className="bg-dark-900 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-white/30"
              />
              <input
                type="text"
                placeholder="Valor (ex: https://pitocodegente.com.br/pdf)"
                value={newVarValue}
                onChange={(e) => setNewVarValue(e.target.value)}
                required
                className="bg-dark-900 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-white/30"
              />
              <input
                type="text"
                placeholder="Descrição (ex: Link do PDF de inverno)"
                value={newVarDesc}
                onChange={(e) => setNewVarDesc(e.target.value)}
                className="bg-dark-900 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-white/30"
              />
            </div>

            <div className="flex justify-end">
              <Button type="submit" size="sm" className="bg-white text-black hover:bg-zinc-200 text-xs font-bold">
                Salvar Variável no Painel
              </Button>
            </div>
          </form>
        )}

        {/* Busca e Filtros */}
        <div className="p-4 border-b border-white/10 space-y-3 bg-dark-900">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar variável por nome, sintaxe ou descrição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-dark-850 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-white/30"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {[
              { id: 'all', label: 'Todas as Variáveis', icon: Layers },
              { id: 'system', label: '🏢 Sistema & Empresa', icon: Building2 },
              { id: 'client', label: '👤 Cliente & CRM', icon: User },
              { id: 'store', label: '🏬 Filiais & Lojas', icon: ShoppingBag },
              { id: 'ecommerce', label: '🛒 E-commerce & Frete', icon: Sliders },
              { id: 'flow', label: '⚡ Fluxo Ativo', icon: Sparkles },
            ].map((tab) => {
              const Icon = tab.icon;
              const isSelected = selectedCategory === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedCategory(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 shrink-0 transition-all ${
                    isSelected
                      ? 'bg-white text-black font-bold'
                      : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Lista de Variáveis */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 divide-y divide-white/5">
          {filteredVariables.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              Nenhuma variável encontrada com os termos informados.
            </div>
          ) : (
            filteredVariables.map((v) => (
              <div
                key={v.key}
                className="pt-2.5 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl hover:bg-white/[0.02] transition-colors group"
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-white bg-white/10 px-2 py-0.5 rounded border border-white/15">
                      {v.syntax}
                    </span>
                    <span className="text-xs font-semibold text-zinc-300">{v.label}</span>
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-white/5 text-slate-400 border border-white/5">
                      {v.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{v.description}</p>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                    <span>Exemplo em tempo real:</span>
                    <span className="font-medium text-emerald-400 truncate max-w-xs sm:max-w-md">
                      "{v.exampleValue}"
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCopy(v.syntax, v.key)}
                    className="text-xs border-white/10 hover:bg-white/10 text-white h-8 px-3"
                  >
                    {copiedKey === v.key ? (
                      <>
                        <Check className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                        <span className="text-emerald-400 font-bold">Copiado</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 mr-1 text-slate-400 group-hover:text-white" />
                        <span>Copiar Sintaxe</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-white/10 bg-dark-900 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-zinc-400" />
            Variáveis são preenchidas automaticamente quando o cliente navega pelo robô no WhatsApp.
          </span>
          <Button
            size="sm"
            onClick={onClose}
            className="bg-white text-black hover:bg-zinc-200 font-semibold px-4"
          >
            Fechar
          </Button>
        </div>

      </div>
    </div>
  );
};
