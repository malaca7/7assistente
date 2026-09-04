import React, { useState, useRef, useEffect } from 'react';
import { FlowNode, AgendaServiceItem } from '../../types';
import { Input, Textarea } from '../ui/Input';
import { Button } from '../ui/Button';
import { 
  Trash2, 
  Copy, 
  SlidersHorizontal, 
  Sparkles, 
  X, 
  Plus, 
  Check, 
  Calendar, 
  DollarSign, 
  Users, 
  CheckCircle2,
  Sliders,
  Hash,
  Type,
  Clock,
  CalendarDays,
  Calculator,
  RotateCcw,
  FileText,
  Wand2,
  Tag,
  Scissors
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { VariableBadge } from './ui/VariableBadge';
import { StorageService } from '../../lib/storage';

const SYSTEM_VARIABLES_LIST = [
  { key: 'etapa_funil', label: 'etapa_funil (Funil CRM)', category: 'Funil' },
  { key: 'interesse', label: 'interesse (Serviço/Produto)', category: 'CRM' },
  { key: 'nome_cliente', label: 'nome_cliente (Nome Completo)', category: 'Contato' },
  { key: 'primeiro_nome', label: 'primeiro_nome (1º Nome)', category: 'Contato' },
  { key: 'telefone_cliente', label: 'telefone_cliente (WhatsApp)', category: 'Contato' },
  { key: 'status', label: 'status (Status Geral)', category: 'Status' },
  { key: 'data_agendamento', label: 'data_agendamento (Data da Reserva)', category: 'Agenda' },
  { key: 'horario_agendamento', label: 'horario_agendamento (Horário da Reserva)', category: 'Agenda' },
  { key: 'servico_selecionado', label: 'servico_selecionado (Serviço)', category: 'Agenda' },
  { key: 'valor_total', label: 'valor_total (Financeiro)', category: 'Financeiro' },
  { key: 'tentativas_contato', label: 'tentativas_contato (Contador)', category: 'Controle' },
  { key: 'observacoes', label: 'observacoes (Notas do Lead)', category: 'CRM' },
  { key: 'atendente_responsavel', label: 'atendente_responsavel (Equipe)', category: 'Equipe' },
  { key: 'origem_lead', label: 'origem_lead (Canal de Entrada)', category: 'Marketing' },
  { key: 'nota_avaliacao', label: 'nota_avaliacao (NPS)', category: 'Avaliação' },
];


export interface NodeInspectorProps {
  node: FlowNode | null;
  onUpdateConfig: (nodeId: string, label: string, config: Record<string, any>) => void;
  onDeleteNode: (nodeId: string) => void;
  onDuplicateNode: (nodeId: string) => void;
  onClose: () => void;
  width?: number;
  onWidthChange?: (newWidth: number) => void;
}

export const NodeInspector: React.FC<NodeInspectorProps> = ({
  node,
  onUpdateConfig,
  onDeleteNode,
  onDuplicateNode,
  onClose,
  width = 360,
  onWidthChange,
}) => {
  const [localWidth, setLocalWidth] = useState(width);
  const [isResizing, setIsResizing] = useState(false);
  const [agendaServices, setAgendaServices] = useState<AgendaServiceItem[]>([]);
  const startXRef = useRef(0);
  const startWidthRef = useRef(localWidth);

  useEffect(() => {
    StorageService.getAgendaSettings().then((res) => {
      if (res?.services && Array.isArray(res.services)) {
        setAgendaServices(res.services.filter((s: any) => s.active !== false && s.is_active !== false));
      }
    }).catch(() => {});
  }, []);

  const currentWidth = onWidthChange ? width : localWidth;

  const startResizing = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    startXRef.current = e.clientX;
    startWidthRef.current = currentWidth;
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      // Dragging left increases width, dragging right decreases width
      const delta = startXRef.current - e.clientX;
      const newWidth = Math.min(Math.max(startWidthRef.current + delta, 280), 650);
      if (onWidthChange) {
        onWidthChange(newWidth);
      } else {
        setLocalWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      if (isResizing) {
        setIsResizing(false);
      }
    };

    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, onWidthChange, currentWidth]);

  const inspectorRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = inspectorRef.current;
    if (!el) return;

    const stopKeyBubbling = (e: KeyboardEvent) => {
      // Prevents canvas listeners from catching Space, Delete, Backspace, or Ctrl shortcuts from within the inspector
      e.stopPropagation();
    };

    el.addEventListener('keydown', stopKeyBubbling);
    el.addEventListener('keyup', stopKeyBubbling);
    el.addEventListener('keypress', stopKeyBubbling);

    return () => {
      el.removeEventListener('keydown', stopKeyBubbling);
      el.removeEventListener('keyup', stopKeyBubbling);
      el.removeEventListener('keypress', stopKeyBubbling);
    };
  }, []);

  if (!node) return null;

  const { data } = node;
  const config = data.config || {};
  const nodeType = data.nodeType || node.type;

  const handleLabelChange = (newLabel: string) => {
    onUpdateConfig(node.id, newLabel, config);
  };

  const handleConfigChange = (key: string, value: any) => {
    onUpdateConfig(node.id, data.label, { ...config, [key]: value });
  };

  return (
    <aside
      ref={inspectorRef}
      style={{ width: `${currentWidth}px` }}
      className="bg-dark-900 border-l border-white/5 flex flex-col h-full z-20 shadow-2xl relative transition-all duration-75 select-text nowheel nopan nodrag"
      onKeyDown={(e) => e.stopPropagation()}
      onKeyUp={(e) => e.stopPropagation()}
    >
      {/* Draggable Resizer Handle on Left Border */}
      <div
        onMouseDown={startResizing}
        className={cn(
          'absolute top-0 left-0 bottom-0 w-2 cursor-col-resize hover:bg-primary-500/50 transition-colors z-30 flex items-center justify-center group select-none',
          isResizing && 'bg-primary-500'
        )}
        title="Arraste para redimensionar painel de propriedades"
      >
        <div className="w-0.5 h-8 bg-slate-600 group-hover:bg-white rounded-full opacity-60 group-hover:opacity-100" />
      </div>

      {/* Header */}
      <div className="p-4 border-b border-white/5 flex items-center justify-between pl-5 select-none">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-primary-400" />
          <h3 className="text-sm font-bold text-white tracking-tight">Propriedades do Nó</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body / Config fields */}
      <div className="flex-1 p-5 overflow-y-auto space-y-5">
        {/* Node Name */}
        <Input
          label="Título do Nó"
          value={data.label || ''}
          onChange={(e) => handleLabelChange(e.target.value)}
          placeholder="Ex: Mensagem de Boas-Vindas"
        />

        {/* Dynamic fields based on node type */}
        {/* 1. Trigger */}
        {nodeType === 'trigger' && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-300">Tipo de Gatilho</label>
              <select
                value={config.eventType || 'any_message'}
                onChange={(e) => handleConfigChange('eventType', e.target.value)}
                className="w-full rounded-xl bg-dark-850 border border-slate-700/60 px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="any_message">Qualquer mensagem recebida</option>
                <option value="keyword">Palavra-chave específica</option>
                <option value="new_contact">Primeiro contato do usuário</option>
                <option value="webhook_event">Evento via Webhook / Meta API</option>
              </select>
            </div>

            {config.eventType === 'keyword' && (
              <Input
                label="Palavras-chave (separadas por vírgula)"
                value={config.keywords || ''}
                onChange={(e) => handleConfigChange('keywords', e.target.value)}
                placeholder="Ex: preco, planos, ajuda, suporte"
              />
            )}
          </div>
        )}

        {/* 2. Message */}
        {nodeType === 'message' && (
          <div className="space-y-4">
            <Textarea
              label="Conteúdo da Mensagem"
              value={config.text || ''}
              onChange={(e) => handleConfigChange('text', e.target.value)}
              placeholder="Digite sua mensagem. Ex: Olá {{nome}}, sou a {{bot_nome}} da {{empresa}}..."
              rows={5}
            />
            
            {/* Variables Panel */}
            <div className="p-3 rounded-xl bg-dark-950/80 border border-slate-800 text-[11px] text-slate-400 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-300">Variáveis do Bot & Contato:</span>
                <span className="text-[10px] text-primary-400">Clique para inserir</span>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {[
                  { tag: '{{bot_nome}}', label: 'Nome do Bot' },
                  { tag: '{{empresa}}', label: 'Empresa' },
                  { tag: '{{nome}}', label: 'Nome do Cliente' },
                  { tag: '{{telefone}}', label: 'Telefone' },
                  { tag: '{{horario_atendimento}}', label: 'Horário' },
                  { tag: '{{suporte_telefone}}', label: 'Telefone Suporte' },
                  { tag: '{{suporte_email}}', label: 'E-mail' },
                  { tag: '{{site_empresa}}', label: 'Site' },
                ].map((item) => (
                  <button
                    key={item.tag}
                    type="button"
                    title={item.label}
                    onClick={() => handleConfigChange('text', `${config.text || ''} ${item.tag}`)}
                    className="px-2 py-0.5 rounded bg-dark-850 hover:bg-primary-950/80 text-primary-300 hover:text-primary-200 border border-slate-700/80 hover:border-primary-500/60 transition-colors font-mono text-[10px] flex items-center gap-1"
                  >
                    <span>+</span> {item.tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 3. Buttons */}
        {nodeType === 'buttons' && (
          <div className="space-y-4">
            <Textarea
              label="Texto do Corpo da Mensagem (Body)"
              value={config.bodyText || ''}
              onChange={(e) => handleConfigChange('bodyText', e.target.value)}
              placeholder="Ex: Escolha uma das opções abaixo para continuarmos:"
              rows={3}
            />

            <Input
              label="Texto de Rodapé (Footer - Opcional)"
              value={config.footerText || ''}
              onChange={(e) => handleConfigChange('footerText', e.target.value)}
              placeholder="Ex: 7 Assistente • Atendimento 24h"
            />

            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-200">
                  Botões Interativos ({ (config.buttons || []).length }/3)
                </label>
                <span className="text-[10px] text-brand-400">Cada botão cria 1 saída no nó</span>
              </div>

              {(config.buttons || []).map((btn: any, index: number) => (
                <div key={index} className="flex items-center gap-2 p-2 rounded-xl bg-dark-950/70 border border-white/5">
                  <div className="w-5 h-5 rounded-md bg-brand-500/20 text-brand-400 font-mono text-[10px] flex items-center justify-center font-bold flex-shrink-0">
                    {index + 1}
                  </div>
                  <Input
                    value={btn.title || ''}
                    onChange={(e) => {
                      const updated = [...(config.buttons || [])];
                      updated[index] = { ...btn, title: e.target.value };
                      handleConfigChange('buttons', updated);
                    }}
                    placeholder={`Texto do Botão ${index + 1}`}
                  />
                  {(config.buttons || []).length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        const updated = (config.buttons || []).filter((_: any, i: number) => i !== index);
                        handleConfigChange('buttons', updated);
                      }}
                      className="p-2 rounded-lg text-rose-400 hover:bg-rose-950/40"
                      title="Excluir este botão"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}

              {(config.buttons || []).length < 3 && (
                <Button
                  size="sm"
                  variant="outline"
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                  onClick={() => {
                    const nextIdx = (config.buttons || []).length + 1;
                    const updated = [
                      ...(config.buttons || []),
                      { id: `btn_${nextIdx}`, title: `Opção ${nextIdx}` },
                    ];
                    handleConfigChange('buttons', updated);
                  }}
                  className="w-full"
                >
                  Adicionar Novo Botão
                </Button>
              )}
            </div>
          </div>
        )}

        {/* 4. Question */}
        {nodeType === 'question' && (
          <div className="space-y-4">
            <Textarea
              label="Pergunta a enviar"
              value={config.questionText || ''}
              onChange={(e) => handleConfigChange('questionText', e.target.value)}
              placeholder="Ex: Qual é o seu e-mail corporativo?"
              rows={3}
            />
            <Input
              label="Nome da Variável para salvar a resposta"
              value={config.variableName || ''}
              onChange={(e) => handleConfigChange('variableName', e.target.value)}
              placeholder="Ex: email_cliente"
            />
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-300">Validação Esperada</label>
              <select
                value={config.expectedType || 'text'}
                onChange={(e) => handleConfigChange('expectedType', e.target.value)}
                className="w-full rounded-xl bg-dark-850 border border-slate-700/60 px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="text">Texto Livre</option>
                <option value="email">E-mail válido</option>
                <option value="phone">Telefone / WhatsApp</option>
                <option value="cpf">CPF / CNPJ</option>
                <option value="number">Número</option>
              </select>
            </div>
          </div>
        )}

        {/* 5. Condition */}
        {nodeType === 'condition' && (
          <div className="space-y-4">
            <Input
              label="Nome da Variável a testar"
              value={config.variable || ''}
              onChange={(e) => handleConfigChange('variable', e.target.value)}
              placeholder="Ex: status ou tipo_interesse"
            />
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-300">Operador</label>
              <select
                value={config.operator || '=='}
                onChange={(e) => handleConfigChange('operator', e.target.value)}
                className="w-full rounded-xl bg-dark-850 border border-slate-700/60 px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono"
              >
                <option value="==">Igual a (==)</option>
                <option value="!=">Diferente de (!=)</option>
                <option value="contains">Contém texto</option>
                <option value=">">Maior que (&gt;)</option>
                <option value="<">Menor que (&lt;)</option>
              </select>
            </div>
            <Input
              label="Valor de Comparação"
              value={config.value || ''}
              onChange={(e) => handleConfigChange('value', e.target.value)}
              placeholder="Ex: sim ou enterprise"
            />
          </div>
        )}

        {/* 5.1 Variable Setter (Definir Variável) */}
        {nodeType === 'variable' && (() => {
          const rawAssignments = Array.isArray(config.assignments) && config.assignments.length > 0
            ? config.assignments
            : [{
                varName: config.varName || 'etapa_funil',
                operation: config.operation || 'set_value',
                value: config.varValue !== undefined ? config.varValue : 'agendamento_iniciado',
                contactField: config.contactField || 'first_name',
                sourceVar: config.sourceVar || '',
                mathAmount: config.mathAmount ?? 1,
              }];

          const updateAssignmentsList = (newAssignments: any[]) => {
            const first = newAssignments[0] || {};
            onUpdateConfig(node.id, data.label, {
              ...config,
              assignments: newAssignments,
              varName: first.varName || '',
              varValue: first.value !== undefined ? first.value : '',
              operation: first.operation || 'set_value',
            });
          };

          const handleUpdateItem = (index: number, updatedFields: Record<string, any>) => {
            const next = rawAssignments.map((item: any, i: number) => {
              if (i !== index) return item;
              return { ...item, ...updatedFields };
            });
            updateAssignmentsList(next);
          };

          const handleAddItem = () => {
            const next = [
              ...rawAssignments,
              {
                varName: '',
                operation: 'set_value',
                value: '',
                contactField: 'first_name',
                sourceVar: '',
                mathAmount: 1,
              }
            ];
            updateAssignmentsList(next);
          };

          const handleRemoveItem = (index: number) => {
            if (rawAssignments.length <= 1) return;
            const next = rawAssignments.filter((_: any, i: number) => i !== index);
            updateAssignmentsList(next);
          };

          const handleApplyTemplate = (preset: any[]) => {
            updateAssignmentsList(preset);
          };

          return (
            <div className="space-y-4">
              {/* Quick Templates Header */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                    <Wand2 className="w-3.5 h-3.5 text-violet-400" />
                    Modelos Rápidos (1-Clique)
                  </label>
                  <span className="text-[10px] text-slate-500">Auto-preencher</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleApplyTemplate([
                      { varName: 'etapa_funil', operation: 'set_value', value: 'agendamento_iniciado' }
                    ])}
                    className="px-2 py-1 rounded-lg bg-dark-850 hover:bg-violet-950/70 border border-slate-700/80 hover:border-violet-500/50 text-[10px] font-medium text-violet-300 transition-colors flex items-center gap-1"
                  >
                    🎯 Etapa Funil
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyTemplate([
                      { varName: 'primeiro_nome', operation: 'contact_field', contactField: 'first_name' }
                    ])}
                    className="px-2 py-1 rounded-lg bg-dark-850 hover:bg-cyan-950/70 border border-slate-700/80 hover:border-cyan-500/50 text-[10px] font-medium text-cyan-300 transition-colors flex items-center gap-1"
                  >
                    👤 1º Nome
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyTemplate([
                      { varName: 'data_registro', operation: 'date_today_br' }
                    ])}
                    className="px-2 py-1 rounded-lg bg-dark-850 hover:bg-emerald-950/70 border border-slate-700/80 hover:border-emerald-500/50 text-[10px] font-medium text-emerald-300 transition-colors flex items-center gap-1"
                  >
                    📅 Data Hoje
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyTemplate([
                      { varName: 'tentativas_contato', operation: 'math_increment', mathAmount: 1 }
                    ])}
                    className="px-2 py-1 rounded-lg bg-dark-850 hover:bg-amber-950/70 border border-slate-700/80 hover:border-amber-500/50 text-[10px] font-medium text-amber-300 transition-colors flex items-center gap-1"
                  >
                    ➕ Contador (+1)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyTemplate([
                      { varName: 'interesse', operation: 'set_value', value: 'corte_e_barba' }
                    ])}
                    className="px-2 py-1 rounded-lg bg-dark-850 hover:bg-pink-950/70 border border-slate-700/80 hover:border-pink-500/50 text-[10px] font-medium text-pink-300 transition-colors flex items-center gap-1"
                  >
                    🏷️ Interesse
                  </button>
                </div>
              </div>

              {/* Assignments List */}
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-violet-400" />
                    Variáveis a Definir ({rawAssignments.length})
                  </label>
                  <span className="text-[10px] text-slate-400">Executadas em ordem</span>
                </div>

                {rawAssignments.map((assignment: any, index: number) => {
                  const op = assignment.operation || 'set_value';

                  return (
                    <div 
                      key={index} 
                      className="p-3 rounded-xl bg-dark-950/80 border border-slate-800/80 hover:border-violet-500/40 transition-all space-y-3"
                    >
                      {/* Item Header */}
                      <div className="flex items-center justify-between border-b border-white/5 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-violet-600/30 border border-violet-500/40 text-[10px] font-bold text-violet-300 flex items-center justify-center">
                            #{index + 1}
                          </span>
                          <span className="text-xs font-semibold text-slate-200">
                            {assignment.varName ? (
                              <code className="text-violet-300">{'{{' + assignment.varName + '}}'}</code>
                            ) : (
                              <span className="text-slate-500 italic">Variável sem nome</span>
                            )}
                          </span>
                        </div>
                        {rawAssignments.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(index)}
                            className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-red-950/40 transition-colors"
                            title="Remover esta variável"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Variable Name Selection */}
                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-medium text-slate-300">Nome da Variável</label>
                        <div className="grid grid-cols-1 gap-1.5">
                          <select
                            value={SYSTEM_VARIABLES_LIST.some(v => v.key === assignment.varName) ? assignment.varName : '__custom__'}
                            onChange={(e) => {
                              if (e.target.value !== '__custom__') {
                                handleUpdateItem(index, { varName: e.target.value });
                              }
                            }}
                            className="w-full rounded-xl bg-dark-850 border border-slate-700/60 px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500"
                          >
                            <option value="__custom__">-- Digitar nome personalizado --</option>
                            {SYSTEM_VARIABLES_LIST.map((sv) => (
                              <option key={sv.key} value={sv.key}>
                                {sv.label}
                              </option>
                            ))}
                          </select>
                          <Input
                            value={assignment.varName || ''}
                            onChange={(e) => {
                              const cleaned = e.target.value.replace(/[\s{{}}]/g, '_').toLowerCase();
                              handleUpdateItem(index, { varName: cleaned });
                            }}
                            placeholder="Ex: status_lead, interesse_plano..."
                            className="font-mono text-xs"
                          />
                        </div>
                      </div>

                      {/* Operation Type Selector */}
                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-medium text-slate-300">Modo de Atribuição / Operação</label>
                        <select
                          value={op}
                          onChange={(e) => handleUpdateItem(index, { operation: e.target.value })}
                          className="w-full rounded-xl bg-dark-850 border border-slate-700/60 px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
                        >
                          <optgroup label="📝 Valores & Textos">
                            <option value="set_value">Texto / Valor Fixo (com variáveis)</option>
                            <option value="set_number">Número Fixo</option>
                            <option value="set_boolean">Booleano (Verdadeiro / Falso)</option>
                            <option value="copy_var">Copiar de Outra Variável</option>
                          </optgroup>
                          <optgroup label="👤 Dados do Contato">
                            <option value="contact_field">Extrair Campo do Contato</option>
                          </optgroup>
                          <optgroup label="🧮 Cálculos Matemáticos">
                            <option value="math_increment">Incrementar (+1 ou +N)</option>
                            <option value="math_decrement">Decrementar (-1 ou -N)</option>
                            <option value="math_add">Somar (+ N)</option>
                            <option value="math_subtract">Subtrair (- N)</option>
                            <option value="math_multiply">Multiplicar (* N)</option>
                            <option value="math_divide">Dividir (/ N)</option>
                          </optgroup>
                          <optgroup label="🔤 Transformações de Texto">
                            <option value="text_first_name">Apenas Primeiro Nome</option>
                            <option value="text_uppercase">Converter para MAIÚSCULAS</option>
                            <option value="text_lowercase">Converter para minúsculas</option>
                            <option value="text_capitalize">Primeira Letra Maiúscula (Aa)</option>
                            <option value="text_numbers_only">Apenas Dígitos / Números</option>
                            <option value="text_trim">Remover Espaços Extras (Trim)</option>
                          </optgroup>
                          <optgroup label="📅 Data & Hora Dinâmica">
                            <option value="date_today_br">Data de Hoje (DD/MM/AAAA)</option>
                            <option value="date_today_iso">Data de Hoje (AAAA-MM-DD)</option>
                            <option value="date_tomorrow_br">Data de Amanhã (DD/MM/AAAA)</option>
                            <option value="time_now">Hora Atual (HH:mm)</option>
                            <option value="datetime_now">Data e Hora Atual (DD/MM/AAAA HH:mm)</option>
                            <option value="timestamp_now">Timestamp Atual (Milissegundos)</option>
                          </optgroup>
                          <optgroup label="🗑️ Limpeza">
                            <option value="clear_var">Limpar / Esvaziar Variável</option>
                          </optgroup>
                        </select>
                      </div>

                      {/* Dynamic Inputs based on Operation */}
                      {op === 'set_value' && (
                        <div className="space-y-2">
                          <Input
                            label="Valor a Atribuir"
                            value={assignment.value !== undefined ? assignment.value : ''}
                            onChange={(e) => handleUpdateItem(index, { value: e.target.value })}
                            placeholder="Ex: agendamento_confirmado ou Olá {{nome_cliente}}"
                          />
                          {/* Variables Quick Tags Panel */}
                          <div className="p-2 rounded-lg bg-dark-900/90 border border-slate-800 text-[10px] text-slate-400 space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-slate-300">Inserir tag dinâmica:</span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {[
                                '{{bot_nome}}',
                                '{{empresa}}',
                                '{{nome_cliente}}',
                                '{{primeiro_nome}}',
                                '{{telefone}}',
                                '{{data_agendamento}}',
                                '{{horario_agendamento}}',
                                '{{servico_selecionado}}',
                                '{{valor_total}}'
                              ].map((tag) => (
                                <button
                                  key={tag}
                                  type="button"
                                  onClick={() => {
                                    const curr = assignment.value !== undefined ? String(assignment.value) : '';
                                    handleUpdateItem(index, { value: curr ? `${curr} ${tag}` : tag });
                                  }}
                                  className="px-1.5 py-0.5 rounded bg-dark-850 hover:bg-violet-950 text-violet-300 border border-slate-700/70 hover:border-violet-500/50 font-mono text-[9px] transition-colors"
                                >
                                  +{tag}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {op === 'set_number' && (
                        <Input
                          label="Valor Numérico"
                          type="number"
                          step="any"
                          value={assignment.value !== undefined ? assignment.value : 0}
                          onChange={(e) => handleUpdateItem(index, { value: Number(e.target.value) })}
                          placeholder="Ex: 100 ou 49.90"
                        />
                      )}

                      {op === 'set_boolean' && (
                        <div className="space-y-1.5">
                          <label className="block text-[11px] font-medium text-slate-300">Valor Booleano</label>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => handleUpdateItem(index, { value: true })}
                              className={cn(
                                'py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all',
                                assignment.value === true || assignment.value === 'true'
                                  ? 'bg-emerald-600/30 border-emerald-500 text-emerald-300 shadow-sm'
                                  : 'bg-dark-850 border-slate-800 text-slate-400 hover:text-slate-200'
                              )}
                            >
                              <Check className="w-3.5 h-3.5" />
                              Verdadeiro (true)
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateItem(index, { value: false })}
                              className={cn(
                                'py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all',
                                assignment.value === false || assignment.value === 'false'
                                  ? 'bg-rose-600/30 border-rose-500 text-rose-300 shadow-sm'
                                  : 'bg-dark-850 border-slate-800 text-slate-400 hover:text-slate-200'
                              )}
                            >
                              <X className="w-3.5 h-3.5" />
                              Falso (false)
                            </button>
                          </div>
                        </div>
                      )}

                      {op === 'copy_var' && (
                        <div className="space-y-1.5">
                          <Input
                            label="Variável de Origem para Copiar"
                            value={assignment.sourceVar || assignment.value || ''}
                            onChange={(e) => {
                              const cleaned = e.target.value.replace(/[\s{{}}]/g, '');
                              handleUpdateItem(index, { sourceVar: cleaned, value: cleaned });
                            }}
                            placeholder="Ex: servico_selecionado ou resposta_usuario"
                            className="font-mono text-xs"
                          />
                          <span className="text-[10px] text-slate-400">
                            O conteúdo de <code className="text-violet-300">{'{{' + (assignment.sourceVar || 'origem') + '}}'}</code> será copiado para esta variável.
                          </span>
                        </div>
                      )}

                      {op === 'contact_field' && (
                        <div className="space-y-1.5">
                          <label className="block text-[11px] font-medium text-slate-300">Campo do Contato</label>
                          <select
                            value={assignment.contactField || 'first_name'}
                            onChange={(e) => handleUpdateItem(index, { contactField: e.target.value })}
                            className="w-full rounded-xl bg-dark-850 border border-slate-700/60 px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
                          >
                            <option value="first_name">Primeiro Nome (Ex: Carlos)</option>
                            <option value="name">Nome Completo / Pushname WhatsApp</option>
                            <option value="phone">Telefone / WhatsApp (Apenas números)</option>
                            <option value="email">E-mail Cadastrado</option>
                            <option value="tags">Tags do Contato</option>
                            <option value="id">ID do Contato</option>
                          </select>
                        </div>
                      )}

                      {(op === 'math_increment' || op === 'math_decrement') && (
                        <Input
                          label="Quantidade do Passo"
                          type="number"
                          min="1"
                          value={assignment.mathAmount ?? 1}
                          onChange={(e) => handleUpdateItem(index, { mathAmount: Number(e.target.value) })}
                          placeholder="Padrão: 1"
                        />
                      )}

                      {(op === 'math_add' || op === 'math_subtract' || op === 'math_multiply' || op === 'math_divide') && (
                        <Input
                          label="Valor da Operação Numérica"
                          type="number"
                          step="any"
                          value={assignment.mathAmount !== undefined ? assignment.mathAmount : (assignment.value || 0)}
                          onChange={(e) => handleUpdateItem(index, { mathAmount: Number(e.target.value), value: Number(e.target.value) })}
                          placeholder="Ex: 10 ou 2.5"
                        />
                      )}

                      {(op.startsWith('text_')) && (
                        <div className="space-y-1.5">
                          <Input
                            label="Variável de Texto de Origem (Opcional)"
                            value={assignment.sourceVar || ''}
                            onChange={(e) => {
                              const cleaned = e.target.value.replace(/[\s{{}}]/g, '');
                              handleUpdateItem(index, { sourceVar: cleaned });
                            }}
                            placeholder="Deixe em branco para usar o próprio nome do contato ou da variável"
                            className="font-mono text-xs"
                          />
                          <span className="text-[10px] text-slate-400">
                            {op === 'text_first_name' && 'Extrai apenas a primeira palavra/nome do cliente.'}
                            {op === 'text_uppercase' && 'Converte todo o texto para MAIÚSCULAS.'}
                            {op === 'text_lowercase' && 'Converte todo o texto para minúsculas.'}
                            {op === 'text_capitalize' && 'Deixa apenas a primeira letra em maiúscula.'}
                            {op === 'text_numbers_only' && 'Remove letras e símbolos, mantendo somente números.'}
                            {op === 'text_trim' && 'Remove espaços em branco sobrando no início e fim.'}
                          </span>
                        </div>
                      )}

                      {(op.startsWith('date_') || op.startsWith('time_') || op === 'timestamp_now') && (
                        <div className="p-2.5 rounded-xl bg-violet-950/30 border border-violet-800/40 text-[11px] text-violet-300 flex items-center gap-2">
                          <Clock className="w-4 h-4 text-violet-400 shrink-0" />
                          <span>
                            Gera automaticamente o valor temporal dinâmico no exato momento da execução do nó.
                          </span>
                        </div>
                      )}

                      {op === 'clear_var' && (
                        <div className="p-2.5 rounded-xl bg-rose-950/30 border border-rose-800/40 text-[11px] text-rose-300 flex items-center gap-2">
                          <Trash2 className="w-4 h-4 text-rose-400 shrink-0" />
                          <span>
                            Esta variável será resetada (esvaziada) da memória do cliente durante a conversa.
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Add Variable Button */}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddItem}
                  className="w-full border-dashed border-slate-700/80 hover:border-violet-500/60 hover:bg-violet-950/30 text-violet-300 flex items-center justify-center gap-2 py-2"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Adicionar Outra Variável neste Nó
                </Button>
              </div>
            </div>
          );
        })()}

        {/* 6. Delay */}
        {nodeType === 'delay' && (
          <div className="space-y-4">
            <Input
              label="Quantidade de Tempo"
              type="number"
              min="1"
              value={config.amount || 5}
              onChange={(e) => handleConfigChange('amount', Number(e.target.value))}
            />
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-300">Unidade</label>
              <select
                value={config.unit || 'segundos'}
                onChange={(e) => handleConfigChange('unit', e.target.value)}
                className="w-full rounded-xl bg-dark-850 border border-slate-700/60 px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="segundos">Segundos</option>
                <option value="minutos">Minutos</option>
                <option value="horas">Horas</option>
              </select>
            </div>
          </div>
        )}

        {/* 7. AI Agent */}
        {nodeType === 'ai_agent' && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-300">Modelo de IA</label>
              <select
                value={config.model || 'gemini-1.5-pro'}
                onChange={(e) => handleConfigChange('model', e.target.value)}
                className="w-full rounded-xl bg-dark-850 border border-slate-700/60 px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="gemini-1.5-pro">Google Gemini 1.5 Pro (Recomendado)</option>
                <option value="gemini-1.5-flash">Google Gemini 1.5 Flash (Ultra rápido)</option>
                <option value="gpt-4o">OpenAI GPT-4o</option>
                <option value="claude-3-5-sonnet">Claude 3.5 Sonnet</option>
              </select>
            </div>

            <Input
              label="Persona / Função do Agente"
              value={config.persona || ''}
              onChange={(e) => handleConfigChange('persona', e.target.value)}
              placeholder="Ex: Consultor de Vendas Especialista em SaaS"
            />

            <Textarea
              label="Prompt do Sistema & Instruções"
              value={config.systemPrompt || ''}
              onChange={(e) => handleConfigChange('systemPrompt', e.target.value)}
              placeholder="Instrua o modelo. Ex: Você é a {{bot_nome}}, assistente virtual da empresa {{empresa}}..."
              rows={4}
            />

            {/* Quick Bot Variables for AI */}
            <div className="p-2.5 rounded-xl bg-dark-950/70 border border-slate-800 space-y-1.5">
              <span className="text-[10px] text-slate-400 font-semibold block">Inserir variáveis no Prompt de IA:</span>
              <div className="flex flex-wrap gap-1">
                {['{{bot_nome}}', '{{empresa}}', '{{bot_genero}}', '{{bot_tom}}', '{{horario_atendimento}}'].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => handleConfigChange('systemPrompt', `${config.systemPrompt || ''} ${v}`)}
                    className="px-2 py-0.5 rounded bg-dark-850 hover:bg-purple-950/80 text-purple-300 border border-slate-700/80 text-[10px] font-mono"
                  >
                    + {v}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span>Temperatura (Criatividade):</span>
                <span className="font-mono text-primary-400">{config.temperature ?? 0.4}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={config.temperature ?? 0.4}
                onChange={(e) => handleConfigChange('temperature', parseFloat(e.target.value))}
                className="w-full accent-primary-500 cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* 8. Human Handoff */}
        {nodeType === 'human_handoff' && (
          <div className="space-y-4">
            <Input
              label="Fila / Departamento"
              value={config.department || ''}
              onChange={(e) => handleConfigChange('department', e.target.value)}
              placeholder="Ex: Vendas, Suporte Técnico, Financeiro"
            />
            <Textarea
              label="Mensagem de Transferência ao Cliente"
              value={config.notifyMessage || ''}
              onChange={(e) => handleConfigChange('notifyMessage', e.target.value)}
              placeholder="Aguarde um instante, um atendente já vai te responder..."
              rows={3}
            />
          </div>
        )}

        {/* 8.5 Media Node (Image, Video, Audio/Voice, Document) */}
        {nodeType === 'media' && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-300">Tipo de Mídia</label>
              <select
                value={config.mediaType || 'image'}
                onChange={(e) => handleConfigChange('mediaType', e.target.value)}
                className="w-full rounded-xl bg-dark-850 border border-slate-700/60 px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-pink-500"
              >
                <option value="image">📸 Imagem (JPG, PNG, WebP)</option>
                <option value="video">🎥 Vídeo (MP4)</option>
                <option value="audio">🎙️ Áudio / Mensagem de Voz (PTT)</option>
                <option value="document">📄 Documento / PDF / Catálogo</option>
              </select>
            </div>

            <Input
              label="URL Direta do Arquivo / Mídia"
              value={config.mediaUrl || ''}
              onChange={(e) => handleConfigChange('mediaUrl', e.target.value)}
              placeholder="https://exemplo.com/imagem.png ou link do arquivo"
              hint="Cole o link direto da imagem, vídeo, áudio ou documento."
            />

            {/* Local File Upload Button */}
            <div className="space-y-1">
              <label className="block text-[11px] font-medium text-slate-400">Ou envie um arquivo do seu computador:</label>
              <input
                type="file"
                accept={
                  config.mediaType === 'video'
                    ? 'video/*'
                    : config.mediaType === 'audio'
                    ? 'audio/*'
                    : config.mediaType === 'document'
                    ? '.pdf,.doc,.docx,.xls,.xlsx,.zip'
                    : 'image/*'
                }
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = () => {
                      handleConfigChange('mediaUrl', reader.result as string);
                      if (config.mediaType === 'document' && !config.fileName) {
                        handleConfigChange('fileName', file.name);
                      }
                    };
                    reader.readAsDataURL(file);
                  }
                }}
                className="w-full text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-pink-500/20 file:text-pink-300 hover:file:bg-pink-500/30 cursor-pointer"
              />
            </div>

            {config.mediaType === 'document' && (
              <Input
                label="Nome do Arquivo (Exibido no WhatsApp)"
                value={config.fileName || ''}
                onChange={(e) => handleConfigChange('fileName', e.target.value)}
                placeholder="Ex: Catalogo-Empresa-2026.pdf"
              />
            )}

            {config.mediaType === 'audio' && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-dark-950/70 border border-white/5">
                <input
                  type="checkbox"
                  id="isPtt"
                  checked={config.isPtt !== false}
                  onChange={(e) => handleConfigChange('isPtt', e.target.checked)}
                  className="rounded border-slate-700 text-pink-500 focus:ring-pink-500"
                />
                <label htmlFor="isPtt" className="text-xs text-slate-300 cursor-pointer">
                  Enviar como <strong>Mensagem de Voz Gravada (PTT)</strong> com onda sonora
                </label>
              </div>
            )}

            {config.mediaType !== 'audio' && (
              <Textarea
                label="Legenda da Mídia (Caption)"
                value={config.caption || ''}
                onChange={(e) => handleConfigChange('caption', e.target.value)}
                placeholder="Ex: Olá {{nome_cliente}}! Veja nosso catálogo de produtos acima."
                rows={3}
                hint="Suporta variáveis como {{nome_cliente}}, {{empresa}}, etc."
              />
            )}

            {/* Media Preview Box */}
            {config.mediaUrl && (
              <div className="p-3 rounded-2xl bg-dark-950/80 border border-white/5 space-y-2">
                <span className="text-[10px] font-bold text-pink-400 uppercase tracking-wider block">
                  Pré-visualização:
                </span>
                {config.mediaType === 'image' && (
                  <img
                    src={config.mediaUrl}
                    alt="Preview"
                    className="w-full h-36 object-cover rounded-xl border border-white/10"
                  />
                )}
                {config.mediaType === 'video' && (
                  <video
                    src={config.mediaUrl}
                    controls
                    className="w-full h-36 rounded-xl border border-white/10"
                  />
                )}
                {config.mediaType === 'audio' && (
                  <audio src={config.mediaUrl} controls className="w-full" />
                )}
                {config.mediaType === 'document' && (
                  <div className="p-3 rounded-xl bg-dark-850 border border-white/5 flex items-center gap-2 text-xs text-slate-300">
                    <span>📄</span>
                    <span className="font-mono font-bold text-white truncate">
                      {config.fileName || 'documento.pdf'}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 10. Schedule Contact (Agenda & Horários Livres) */}
        {/* 10. Show Services (Exibir Catálogo de Serviços) */}
        {nodeType === 'show_services' && (
          <div className="space-y-4">
            <div className="p-3 rounded-2xl bg-amber-950/40 border border-amber-500/30 text-xs text-amber-200 space-y-1">
              <span className="font-bold flex items-center gap-1.5 text-amber-300">
                <Sparkles className="w-3.5 h-3.5" />
                Exibição do Catálogo de Serviços:
              </span>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Gera e envia automaticamente uma mensagem com todos os <strong>serviços ativos, durações e preços</strong> da Agenda. Não bloqueia a conversa e avança para o próximo nó.
              </p>
            </div>

            <Input
              label="Título do Catálogo"
              value={config.headerText || '💈 *Catálogo de Serviços & Preços*'}
              onChange={(e) => handleConfigChange('headerText', e.target.value)}
              placeholder="Ex: 💈 *Nossos Serviços e Valores:*"
            />

            <Input
              label="Texto de Rodapé (Opcional)"
              value={config.footerText || ''}
              onChange={(e) => handleConfigChange('footerText', e.target.value)}
              placeholder="Ex: _Valores sujeitos a alteração sem aviso prévio._"
            />

            {/* Live Services Preview */}
            <div className="p-3 rounded-xl bg-dark-950/80 border border-amber-500/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1.5">
                  <Scissors className="w-3.5 h-3.5 text-amber-400" />
                  Serviços Ativos na Agenda:
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/30">
                  {agendaServices.length} ativo{agendaServices.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                {agendaServices.length > 0 ? (
                  agendaServices.map((srv, i) => (
                    <div
                      key={srv.id || i}
                      className="p-2 rounded-lg bg-dark-900/90 border border-white/5 text-[11px] flex items-center justify-between hover:border-amber-500/30 transition-colors"
                    >
                      <div className="min-w-0 pr-2">
                        <span className="font-semibold text-white truncate block">{srv.name}</span>
                        <span className="text-[10px] text-slate-400">⏱️ {srv.duration_minutes || 30} min</span>
                      </div>
                      <span className="text-emerald-400 font-bold text-[11px] flex-shrink-0">
                        R$ {Number(srv.price || 0).toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-[10.5px] text-slate-400 italic py-1">
                    Carregando serviços ou nenhum serviço ativo cadastrado na Agenda.
                  </p>
                )}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-dark-950/80 border border-white/5 space-y-2">
              <span className="text-xs font-semibold text-amber-400 block">
                Variável Gerada no Contexto:
              </span>
              <div className="flex items-center gap-2">
                <VariableBadge name="catalogo_servicos_texto" />
              </div>
            </div>
          </div>
        )}

        {/* 11. Select Service (Selecionar Serviço) */}
        {(nodeType === 'select_service' || nodeType === 'services_catalog') && (
          <div className="space-y-4">
            <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-200 space-y-1">
              <span className="font-bold flex items-center gap-1.5 text-emerald-300">
                <Scissors className="w-3.5 h-3.5" />
                Seleção Interativa de Serviço:
              </span>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Puxa os serviços cadastrados na <strong>Agenda</strong> e apresenta como <strong>botões clicáveis no WhatsApp</strong> para o cliente escolher.
              </p>
            </div>

            <Textarea
              label="Mensagem de Escolha"
              value={config.introMessage || 'Qual serviço você deseja agendar hoje?'}
              onChange={(e) => handleConfigChange('introMessage', e.target.value)}
              placeholder="Ex: Qual serviço você gostaria de realizar hoje?"
              rows={2}
            />

            <Input
              label="Texto de Rodapé dos Botões"
              value={config.footerText || 'Toque no serviço desejado:'}
              onChange={(e) => handleConfigChange('footerText', e.target.value)}
              placeholder="Ex: Toque no serviço desejado:"
            />

            <div className="p-3 rounded-xl bg-dark-950/80 border border-white/5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-400">
                  Variáveis Salvas na Escolha:
                </span>
                <span className="text-[10px] text-emerald-400 font-mono">1-Clique Copiar</span>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                <VariableBadge name="servico_selecionado" />
                <VariableBadge name="valor_servico" />
                <VariableBadge name="duracao_minutos" />
              </div>
            </div>
          </div>
        )}

        {/* 12. Select Date (Escolher Data do Agendamento) */}
        {(nodeType === 'select_date' || nodeType === 'ask_date') && (
          <div className="space-y-4">
            <div className="p-3 rounded-2xl bg-teal-950/40 border border-teal-500/30 text-xs text-teal-200 space-y-1">
              <span className="font-bold flex items-center gap-1.5 text-teal-300">
                <Calendar className="w-3.5 h-3.5" />
                Escolha da Data pelo Cliente:
              </span>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Envia opções interativas para o cliente escolher o dia (ex: <strong>Hoje</strong>, <strong>Amanhã</strong> ou <strong>Digitar Outra Data</strong>). Converte datas digitadas (ex: 25/08) para formato ISO e salva na variável.
              </p>
            </div>

            <Textarea
              label="Mensagem da Pergunta de Data"
              value={config.questionText || 'Para qual dia você gostaria de agendar?'}
              onChange={(e) => handleConfigChange('questionText', e.target.value)}
              placeholder="Ex: Para qual dia você gostaria de agendar seu atendimento?"
              rows={2}
            />

            <Input
              label="Nome da Variável para Salvar a Data"
              value={config.dateVariable || 'data_agendamento'}
              onChange={(e) => handleConfigChange('dateVariable', e.target.value)}
              placeholder="data_agendamento"
              hint="Salva a data selecionada no formato AAAA-MM-DD para consultar horários livres."
            />

            <div className="p-3 rounded-xl bg-dark-950/80 border border-white/5 space-y-2">
              <span className="text-xs font-semibold text-teal-400 block">
                Variável Gerada:
              </span>
              <div className="flex items-center gap-2">
                <VariableBadge name={config.dateVariable || 'data_agendamento'} />
                <span className="text-[11px] text-slate-400 font-mono">(ex: 2026-08-30)</span>
              </div>
            </div>
          </div>
        )}

        {/* 13. Select Time Slot (Escolher Horário Disponível) */}
        {(nodeType === 'select_time_slot' || nodeType === 'schedule_contact') && (
          <div className="space-y-4">
            <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-200 space-y-1">
              <span className="font-bold flex items-center gap-1.5 text-emerald-300">
                <Clock className="w-3.5 h-3.5" />
                Consulta & Escolha de Horários Livres:
              </span>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Calcula os horários livres na <strong>Agenda</strong> para a data selecionada e a duração do serviço, enviando como botões interativos no WhatsApp para o cliente escolher.
              </p>
            </div>

            <Input
              label="Nome da Variável com a Data"
              value={config.dateVariable || 'data_agendamento'}
              onChange={(e) => handleConfigChange('dateVariable', e.target.value)}
              placeholder="data_agendamento"
              hint="Variável que contém a data escolhida na etapa anterior."
            />

            <Input
              label="Serviço ou Duração"
              value={config.serviceName || ''}
              onChange={(e) => handleConfigChange('serviceName', e.target.value)}
              placeholder="Ex: {{servico_selecionado}}"
              hint="Se vazio, usa {{servico_selecionado}} para calcular o tempo do atendimento."
            />

            <Textarea
              label="Texto de Apresentação dos Horários"
              value={config.introMessage || 'Estes são os horários livres para agendamento. Toque no seu horário preferido:'}
              onChange={(e) => handleConfigChange('introMessage', e.target.value)}
              placeholder="Ex: Estes são os horários livres disponíveis para esta data. Toque no seu horário desejado:"
              rows={2}
            />

            <div className="p-3 rounded-xl bg-dark-950/80 border border-white/5 space-y-2">
              <span className="text-xs font-semibold text-emerald-400 block">
                Variável Salva ao Clicar no Horário:
              </span>
              <div className="flex items-center gap-2">
                <VariableBadge name="horario_agendamento" />
                <span className="text-[11px] text-slate-400 font-mono">(ex: 14:30)</span>
              </div>
            </div>
          </div>
        )}

        {/* 14. Confirm Booking (Confirmar & Gravar na Agenda) */}
        {nodeType === 'confirm_booking' && (
          <div className="space-y-4">
            <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-200 space-y-1">
              <span className="font-bold flex items-center gap-1.5 text-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Confirmação & Gravação na Agenda:
              </span>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Apresenta o resumo completo de todos os dados do agendamento, bloqueia o horário na Agenda e adiciona a tag <strong>Agendado</strong> ao cliente no CRM.
              </p>
            </div>

            <Textarea
              label="Mensagem de Confirmação Final"
              value={config.confirmMessage || ''}
              onChange={(e) => handleConfigChange('confirmMessage', e.target.value)}
              placeholder="Ex: ✅ Perfeito {{nome_cliente}}! Seu agendamento de *{{servico_selecionado}}* está confirmado para o dia *{{data_agendamento}}* às *{{horario_agendamento}}*."
              rows={3}
            />

            <div className="p-3 rounded-xl bg-dark-950/80 border border-white/5 space-y-2">
              <span className="text-xs font-semibold text-emerald-400 block">
                Resumo de Variáveis Utilizadas:
              </span>
              <div className="flex flex-wrap gap-1.5">
                <VariableBadge name="nome_cliente" />
                <VariableBadge name="servico_selecionado" />
                <VariableBadge name="valor_servico" />
                <VariableBadge name="data_agendamento" />
                <VariableBadge name="horario_agendamento" />
              </div>
            </div>
          </div>
        )}

        {/* 12. Check Contact (Primeiro Contato vs Contato Salvo) */}
        {nodeType === 'check_contact' && (
          <div className="space-y-4">
            <div className="p-3 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 text-xs text-indigo-200 space-y-1">
              <span className="font-bold flex items-center gap-1.5 text-indigo-300">
                <Users className="w-3.5 h-3.5" />
                Detecção Inteligente de Cliente:
              </span>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Este nó verifica se o número do WhatsApp é um <strong>Primeiro Contato (Novo Cliente)</strong> ou um <strong>Contato Já Salvo (Cliente Recorrente)</strong>.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-dark-950/80 border border-white/5 space-y-2.5">
              <span className="text-xs font-semibold text-indigo-400 block">
                Saídas de Ramificação no Fluxo:
              </span>
              <div className="flex items-center gap-2 text-xs text-slate-200">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span><strong>Saída 1 (Verde):</strong> Novo Contato (1ª vez que fala no WhatsApp)</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-200">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                <span><strong>Saída 2 (Azul):</strong> Contato Já Salvo (Cliente cadastrado)</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-dark-950/80 border border-white/5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-indigo-400">
                  Variáveis Geradas Automaticamente:
                </span>
                <span className="text-[10px] text-emerald-400 font-mono">1-Clique Copiar</span>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                <VariableBadge name="is_primeiro_contato" />
                <VariableBadge name="tipo_cliente" />
                <VariableBadge name="nome_cliente" />
                <VariableBadge name="telefone_whatsapp" />
                <VariableBadge name="total_agendamentos" />
                <VariableBadge name="tags_contato" />
              </div>
            </div>
          </div>
        )}

        {/* 13. Update Contact Profile */}
        {nodeType === 'update_contact' && (
          <div className="space-y-4">
            <div className="p-3 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 text-xs text-cyan-200 space-y-1">
              <span className="font-bold flex items-center gap-1.5 text-cyan-300">
                <Sparkles className="w-3.5 h-3.5" />
                Sincronização Completa de Contato:
              </span>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Este nó salva a <strong>Foto Oficial do WhatsApp</strong>, <strong>Nome</strong> e <strong>Número de Telefone</strong> automaticamente no perfil do cliente.
              </p>
            </div>

            <Input
              label="Nome da Variável para Salvar o WhatsApp"
              value={config.phoneVarName || 'telefone_whatsapp'}
              onChange={(e) => handleConfigChange('phoneVarName', e.target.value)}
              placeholder="telefone_whatsapp"
              hint="Cria esta variável com o número de quem está falando para você usar em mensagens (ex: {{telefone_whatsapp}})."
            />

            <Input
              label="Variável com o Nome do Cliente (Opcional)"
              value={config.contactName || ''}
              onChange={(e) => handleConfigChange('contactName', e.target.value)}
              placeholder="Ex: nome_cliente"
              hint="Atualiza o nome do contato com o dado informado pelo cliente."
            />

            <Input
              label="Sobrescrever Telefone com outra Variável (Opcional)"
              value={config.phoneVariable || ''}
              onChange={(e) => handleConfigChange('phoneVariable', e.target.value)}
              placeholder="Ex: outro_telefone"
              hint="Se o cliente digitou outro número e você deseja cadastrar esse novo telefone."
            />

            <Input
              label="Tags a Vincular (separadas por vírgula)"
              value={config.tags || ''}
              onChange={(e) => handleConfigChange('tags', e.target.value)}
              placeholder="Ex: Cliente, VIP, Agendou"
              hint="Define as tags exatas que o cliente receberá."
            />

            <div className="p-3 rounded-xl bg-dark-950/80 border border-white/5 space-y-3">
              <span className="text-xs font-semibold text-cyan-400 block">
                Campo Personalizado Adicional:
              </span>
              <Input
                label="Nome do Campo"
                value={config.customFieldKey || ''}
                onChange={(e) => handleConfigChange('customFieldKey', e.target.value)}
                placeholder="Ex: interesse_produto, cpf, cidade"
              />
              <Input
                label="Valor ou Variável a Gravar"
                value={config.customFieldValue || ''}
                onChange={(e) => handleConfigChange('customFieldValue', e.target.value)}
                placeholder="Ex: opcao_selecionada ou valor fixo"
              />
            </div>
          </div>
        )}

        {/* 14. End Flow Node */}
        {(nodeType === 'end_flow' || nodeType === 'finish_flow' || nodeType === 'end') && (
          <div className="space-y-4">
            <div className="p-3 rounded-2xl bg-rose-950/40 border border-rose-500/30 text-xs text-rose-200 space-y-1">
              <span className="font-bold flex items-center gap-1.5 text-rose-300">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Encerramento do Fluxo:
              </span>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Este nó é o <strong>ponto terminal</strong> da automação. Ele encerra a conversa, reseta a sessão do WhatsApp e envia a mensagem final de conclusão ao cliente.
              </p>
            </div>

            <Textarea
              label="Mensagem de Encerramento (Opcional)"
              value={config.message ?? '🏁 *Atendimento finalizado com sucesso!*\n\nSe precisar de algo mais, basta nos enviar uma nova mensagem. Até logo!'}
              onChange={(e) => handleConfigChange('message', e.target.value)}
              rows={4}
              placeholder="Mensagem de agradecimento / despedida..."
              hint="Suporta variáveis como {{nome_cliente}}, {{empresa}}, {{chave_pix}}, etc."
            />

            <div className="p-3 rounded-xl bg-dark-950/80 border border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-white block">Encerrar Conversa no Painel</span>
                  <span className="text-[10px] text-slate-400">Marca o atendimento como fechado</span>
                </div>
                <input
                  type="checkbox"
                  checked={config.closeConversation !== false}
                  onChange={(e) => handleConfigChange('closeConversation', e.target.checked)}
                  className="rounded bg-dark-900 border-white/10 text-brand-500"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-white/5">
                <div>
                  <span className="text-xs font-semibold text-white block">Resetar Variáveis Temporárias</span>
                  <span className="text-[10px] text-slate-400">Limpa variáveis de etapas para o próximo contato</span>
                </div>
                <input
                  type="checkbox"
                  checked={config.clearVariables !== false}
                  onChange={(e) => handleConfigChange('clearVariables', e.target.checked)}
                  className="rounded bg-dark-900 border-white/10 text-brand-500"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions (Duplicate / Delete) */}
      <div className="p-4 border-t border-white/5 bg-dark-950/80 flex items-center justify-between gap-2">
        <Button
          size="sm"
          variant="secondary"
          leftIcon={<Copy className="w-3.5 h-3.5" />}
          onClick={() => onDuplicateNode(node.id)}
        >
          Duplicar
        </Button>
        <Button
          size="sm"
          variant="danger"
          leftIcon={<Trash2 className="w-3.5 h-3.5" />}
          onClick={() => onDeleteNode(node.id)}
        >
          Excluir Nó
        </Button>
      </div>
    </aside>
  );
};
