import React, { useState, useRef, useEffect } from 'react';
import { FlowNode } from '../../types';
import { Input, Textarea } from '../ui/Input';
import { Button } from '../ui/Button';
import { Trash2, Copy, SlidersHorizontal, Sparkles, X, Plus, Check, Calendar, DollarSign, Users, CheckCircle2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { VariableBadge } from './ui/VariableBadge';

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
  const startXRef = useRef(0);
  const startWidthRef = useRef(localWidth);

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
      style={{ width: `${currentWidth}px` }}
      className="bg-dark-900 border-l border-white/5 flex flex-col h-full z-20 shadow-2xl relative transition-all duration-75 select-none"
    >
      {/* Draggable Resizer Handle on Left Border */}
      <div
        onMouseDown={startResizing}
        className={cn(
          'absolute top-0 left-0 bottom-0 w-2 cursor-col-resize hover:bg-primary-500/50 transition-colors z-30 flex items-center justify-center group',
          isResizing && 'bg-primary-500'
        )}
        title="Arraste para redimensionar painel de propriedades"
      >
        <div className="w-0.5 h-8 bg-slate-600 group-hover:bg-white rounded-full opacity-60 group-hover:opacity-100" />
      </div>

      {/* Header */}
      <div className="p-4 border-b border-white/5 flex items-center justify-between pl-5">
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
        {/* 10. Ask / Select Date */}
        {nodeType === 'ask_date' && (
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
              value={config.questionText || ''}
              onChange={(e) => handleConfigChange('questionText', e.target.value)}
              placeholder="Ex: Para qual dia você gostaria de agendar seu atendimento?"
              rows={2}
            />

            <Input
              label="Nome da Variável para Salvar a Data"
              value={config.dateVariable || 'data_agendamento'}
              onChange={(e) => handleConfigChange('dateVariable', e.target.value)}
              placeholder="data_agendamento"
              hint="Salva a data selecionada/digitada no formato AAAA-MM-DD para consultar horários."
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

        {/* 11. Schedule Contact (Horários Livres da Agenda) */}
        {nodeType === 'schedule_contact' && (
          <div className="space-y-4">
            <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-200 space-y-1">
              <span className="font-bold flex items-center gap-1.5 text-emerald-300">
                <Calendar className="w-3.5 h-3.5" />
                Consulta de Horários Disponíveis:
              </span>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Busca os horários livres na <strong>Agenda</strong> para o dia informado e a duração do serviço escolhido, enviando botões interativos para o cliente selecionar.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-300">Data da Consulta</label>
              <select
                value={config.dateType || 'variable'}
                onChange={(e) => handleConfigChange('dateType', e.target.value)}
                className="w-full rounded-xl bg-dark-850 border border-slate-700/60 px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="variable">Data informada em Variável ({'{{data_agendamento}}'})</option>
                <option value="today">Hoje (Data Atual)</option>
                <option value="tomorrow">Amanhã (+1 dia)</option>
              </select>
            </div>

            {config.dateType === 'variable' && (
              <Input
                label="Nome da Variável com a Data"
                value={config.dateVariable || 'data_agendamento'}
                onChange={(e) => handleConfigChange('dateVariable', e.target.value)}
                placeholder="data_agendamento"
              />
            )}

            <Input
              label="Serviço ou Variável de Duração"
              value={config.serviceName || ''}
              onChange={(e) => handleConfigChange('serviceName', e.target.value)}
              placeholder="Ex: {{servico_selecionado}}"
              hint="Se vazio, usa {{servico_selecionado}} para calcular o tempo do atendimento."
            />

            <Textarea
              label="Texto de Apresentação dos Horários"
              value={config.introMessage || ''}
              onChange={(e) => handleConfigChange('introMessage', e.target.value)}
              placeholder="Ex: Estes são os horários livres disponíveis para esta data. Toque no seu horário desejado:"
              rows={2}
            />

            <div className="p-3 rounded-xl bg-dark-950/80 border border-white/5 space-y-2">
              <span className="text-xs font-semibold text-emerald-400 block">
                Variável Gerada ao Tocar no Horário:
              </span>
              <div className="flex items-center gap-2">
                <VariableBadge name="horario_agendamento" />
                <span className="text-[11px] text-slate-400 font-mono">(ex: 14:30)</span>
              </div>
            </div>
          </div>
        )}

        {/* 12. Confirm Booking (Confirmar & Gravar na Agenda) */}
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

        {/* 11. Services Catalog */}
        {nodeType === 'services_catalog' && (
          <div className="space-y-4">
            <div className="p-3 rounded-2xl bg-amber-950/40 border border-amber-500/30 text-xs text-amber-200 space-y-1">
              <span className="font-bold flex items-center gap-1.5 text-amber-300">
                <DollarSign className="w-3.5 h-3.5" />
                Catálogo Dinâmico da Agenda:
              </span>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Puxa automaticamente os <strong>serviços, preços e durações</strong> cadastrados na aba <strong>Agenda</strong> do painel.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-300">Formato de Exibição no WhatsApp</label>
              <select
                value={config.displayFormat || 'buttons'}
                onChange={(e) => handleConfigChange('displayFormat', e.target.value)}
                className="w-full rounded-xl bg-dark-850 border border-slate-700/60 px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="buttons">🔘 Menu de Opções / Botões Interativos (com Nome e Preço)</option>
                <option value="text_list">📋 Lista de Preços e Serviços em Texto</option>
              </select>
            </div>

            <Textarea
              label="Mensagem de Introdução"
              value={config.introMessage || ''}
              onChange={(e) => handleConfigChange('introMessage', e.target.value)}
              placeholder="Ex: Conheça nossos serviços e valores disponíveis:"
              rows={2}
            />

            <Input
              label="Texto de Rodapé (Opcional)"
              value={config.footerText || ''}
              onChange={(e) => handleConfigChange('footerText', e.target.value)}
              placeholder="Ex: Toque no serviço desejado para agendar:"
            />

            <div className="p-3 rounded-xl bg-dark-950/80 border border-white/5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-amber-400">
                  Variáveis Criadas na Escolha:
                </span>
                <span className="text-[10px] text-emerald-400 font-mono">1-Clique Copiar</span>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                <VariableBadge name="servico_selecionado" />
                <VariableBadge name="valor_servico" />
                <VariableBadge name="duracao_servico" />
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
