import React from 'react';
import { NodeProps } from '@xyflow/react';
import { 
  GitBranch, 
  Clock, 
  Globe, 
  Webhook, 
  Sliders, 
  Sparkles, 
  Image as ImageIcon, 
  UserCheck,
  Calendar,
  CalendarDays,
  DollarSign,
  UserPlus,
  CheckCircle2,
  ListOrdered,
  OctagonX,
  Scissors,
  ListChecks,
  Layers,
  Users
} from 'lucide-react';
import { BaseNode } from './BaseNode';
import { FlowNodeData } from '../../../types';
import { VariableBadge } from '../ui/VariableBadge';

export const ConditionNode: React.FC<NodeProps> = ({ id, selected, data }) => {
  const nodeData = data as unknown as FlowNodeData;
  const config = nodeData.config || {};

  const outputs = [
    { id: 'true', label: 'SIM / Verdadeiro', color: '!bg-emerald-400' },
    { id: 'false', label: 'NÃO / Falso', color: '!bg-rose-400' },
  ];

  return (
    <BaseNode
      id={id}
      selected={selected}
      title={nodeData.label || 'Condição / IF'}
      subtitle="Desvio Condicional"
      icon={<GitBranch className="w-4 h-4" />}
      iconBg="bg-gradient-to-tr from-purple-600 to-indigo-600"
      accentColor="bg-purple-500"
      hasInput={true}
      hasOutput={false}
      customOutputs={outputs}
      isConfigured={Boolean(config.variable && config.operator)}
    >
      <div className="p-2.5 rounded-xl bg-dark-950/90 border border-purple-500/20 text-[11px] text-slate-300 font-mono flex items-center gap-1.5 flex-wrap">
        {config.variable ? (
          <>
            <span className="text-[10px] text-slate-400 font-sans">Se:</span>
            <VariableBadge name={config.variable} />
            <span className="text-purple-400 font-bold px-1 py-0.5 rounded bg-purple-950/80 border border-purple-800/60 text-[10px]">
              {config.operator || '=='}
            </span>
            <span className="text-slate-200 truncate font-sans font-semibold">"{config.value || ''}"</span>
          </>
        ) : (
          <span className="italic text-slate-500 font-sans text-[10.5px]">Clique para configurar a regra IF...</span>
        )}
      </div>
    </BaseNode>
  );
};

export const DelayNode: React.FC<NodeProps> = ({ id, selected, data }) => {
  const nodeData = data as unknown as FlowNodeData;
  const config = nodeData.config || {};

  return (
    <BaseNode
      id={id}
      selected={selected}
      title={nodeData.label || 'Aguardar / Espera'}
      subtitle="Pausa temporizada"
      icon={<Clock className="w-4 h-4" />}
      iconBg="bg-amber-600"
      accentColor="bg-amber-600"
      hasInput={true}
      hasOutput={true}
      isConfigured={Boolean(config.amount)}
    >
      <div className="p-2 rounded-lg bg-dark-950/70 border border-slate-800 text-[11px] text-slate-300 flex items-center justify-between">
        <span>Duração da pausa:</span>
        <span className="font-bold text-amber-400">
          {config.amount || 5} {config.unit || 'segundos'}
        </span>
      </div>
    </BaseNode>
  );
};

export const HttpRequestNode: React.FC<NodeProps> = ({ id, selected, data }) => {
  const nodeData = data as unknown as FlowNodeData;
  const config = nodeData.config || {};

  return (
    <BaseNode
      id={id}
      selected={selected}
      title={nodeData.label || 'Requisição HTTP / API'}
      subtitle="Integração externa"
      icon={<Globe className="w-4 h-4" />}
      iconBg="bg-blue-500"
      accentColor="bg-blue-500"
      hasInput={true}
      hasOutput={true}
      isConfigured={Boolean(config.url)}
    >
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-950 text-blue-300 border border-blue-800">
            {config.method || 'POST'}
          </span>
          <span className="text-[11px] text-slate-400 truncate flex-1 font-mono">
            {config.url || 'https://api.exemplo.com/v1'}
          </span>
        </div>
      </div>
    </BaseNode>
  );
};

export const WebhookNode: React.FC<NodeProps> = ({ id, selected, data }) => {
  const nodeData = data as unknown as FlowNodeData;
  const config = nodeData.config || {};

  return (
    <BaseNode
      id={id}
      selected={selected}
      title={nodeData.label || 'Disparo Webhook'}
      subtitle="Gatilho ou Notificação"
      icon={<Webhook className="w-4 h-4" />}
      iconBg="bg-teal-500"
      accentColor="bg-teal-500"
      hasInput={true}
      hasOutput={true}
      isConfigured={true}
    >
      <div className="p-2 rounded-lg bg-dark-950/70 border border-slate-800 text-[11px] text-slate-300 truncate font-mono">
        {config.endpoint ? `/api/wh/${config.endpoint}` : 'Mapeamento de payload ativo'}
      </div>
    </BaseNode>
  );
};

export const VariableNode: React.FC<NodeProps> = ({ id, selected, data }) => {
  const nodeData = data as unknown as FlowNodeData;
  const config = nodeData.config || {};

  const assignments = Array.isArray(config.assignments) && config.assignments.length > 0
    ? config.assignments
    : config.varName
      ? [{
          varName: config.varName,
          operation: config.operation || 'set_value',
          value: config.varValue !== undefined ? config.varValue : '',
          contactField: config.contactField || 'first_name',
          sourceVar: config.sourceVar || '',
          mathAmount: config.mathAmount ?? 1,
        }]
      : [];

  const isConfigured = assignments.length > 0 && assignments.some((a: any) => Boolean(a.varName));

  const formatOperationPreview = (item: any) => {
    const op = item.operation || 'set_value';
    switch (op) {
      case 'set_value':
        return <span className="truncate max-w-[90px] text-slate-200">"{String(item.value ?? '')}"</span>;
      case 'set_number':
        return <span className="text-emerald-400 font-bold">{String(item.value ?? 0)}</span>;
      case 'set_boolean':
        return (
          <span className={item.value === true || item.value === 'true' ? 'text-emerald-400' : 'text-rose-400'}>
            {item.value === true || item.value === 'true' ? 'true' : 'false'}
          </span>
        );
      case 'copy_var':
        return <span className="text-violet-300">← {'{{' + (item.sourceVar || item.value || 'origem') + '}}'}</span>;
      case 'contact_field':
        return <span className="text-cyan-300">👤 {item.contactField || 'nome'}</span>;
      case 'math_increment':
        return <span className="text-amber-300 font-bold">+{item.mathAmount ?? 1}</span>;
      case 'math_decrement':
        return <span className="text-amber-300 font-bold">-{item.mathAmount ?? 1}</span>;
      case 'math_add':
        return <span className="text-amber-300 font-bold">+{item.mathAmount ?? item.value ?? 0}</span>;
      case 'math_subtract':
        return <span className="text-amber-300 font-bold">-{item.mathAmount ?? item.value ?? 0}</span>;
      case 'math_multiply':
        return <span className="text-amber-300 font-bold">*{item.mathAmount ?? item.value ?? 1}</span>;
      case 'math_divide':
        return <span className="text-amber-300 font-bold">/{item.mathAmount ?? item.value ?? 1}</span>;
      case 'text_first_name':
        return <span className="text-indigo-300">🔤 1º nome</span>;
      case 'text_uppercase':
        return <span className="text-indigo-300">🔤 MAIÚSC.</span>;
      case 'text_lowercase':
        return <span className="text-indigo-300">🔤 minúsc.</span>;
      case 'text_capitalize':
        return <span className="text-indigo-300">🔤 Capitalize</span>;
      case 'text_numbers_only':
        return <span className="text-indigo-300">🔢 123</span>;
      case 'text_trim':
        return <span className="text-indigo-300">✂ Trim</span>;
      case 'date_today_br':
        return <span className="text-emerald-300">📅 Hoje (BR)</span>;
      case 'date_today_iso':
        return <span className="text-emerald-300">📅 Hoje (ISO)</span>;
      case 'date_tomorrow_br':
        return <span className="text-emerald-300">📅 Amanhã</span>;
      case 'time_now':
        return <span className="text-emerald-300">⏰ Hora Atual</span>;
      case 'datetime_now':
        return <span className="text-emerald-300">📅⏰ Data/Hora</span>;
      case 'timestamp_now':
        return <span className="text-emerald-300">⚡ Timestamp</span>;
      case 'clear_var':
        return <span className="text-rose-400">🗑️ Limpar</span>;
      default:
        return <span className="truncate max-w-[90px] text-slate-200">{String(item.value ?? '')}</span>;
    }
  };

  return (
    <BaseNode
      id={id}
      selected={selected}
      title={nodeData.label || 'Definir Variável'}
      subtitle={
        assignments.length > 1
          ? `${assignments.length} variáveis`
          : assignments[0]?.varName
            ? `{{${assignments[0].varName}}}`
            : 'Armazenar estado'
      }
      icon={<Sliders className="w-4 h-4" />}
      iconBg="bg-violet-600"
      accentColor="bg-violet-500"
      hasInput={true}
      hasOutput={true}
      isConfigured={isConfigured}
    >
      {assignments.length > 0 ? (
        <div className="space-y-1.5">
          {assignments.slice(0, 3).map((item: any, idx: number) => (
            <div
              key={idx}
              className="p-1.5 rounded-lg bg-dark-950/70 border border-slate-800/80 text-[11px] text-slate-300 flex items-center justify-between font-mono gap-1.5"
            >
              <VariableBadge name={item.varName || 'variavel'} />
              <span className="text-slate-500 text-[10px]">=</span>
              <div className="text-[10px]">{formatOperationPreview(item)}</div>
            </div>
          ))}
          {assignments.length > 3 && (
            <p className="text-[9px] text-slate-400 text-center font-medium">
              +{assignments.length - 3} mais variável(is)
            </p>
          )}
        </div>
      ) : (
        <div className="p-2 rounded-lg bg-dark-950/40 border border-dashed border-slate-800 text-[10px] text-slate-400 text-center">
          Clique para configurar variáveis
        </div>
      )}
    </BaseNode>
  );
};

export const AiAgentNode: React.FC<NodeProps> = ({ id, selected, data }) => {
  const nodeData = data as unknown as FlowNodeData;
  const config = nodeData.config || {};

  return (
    <BaseNode
      id={id}
      selected={selected}
      title={nodeData.label || 'Agente de IA'}
      subtitle="LLM & Base de Conhecimento"
      icon={<Sparkles className="w-4 h-4" />}
      iconBg="bg-gradient-to-tr from-purple-600 to-indigo-500"
      accentColor="bg-gradient-to-r from-purple-500 to-indigo-500"
      hasInput={true}
      hasOutput={true}
      isConfigured={Boolean(config.persona || config.model)}
    >
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-purple-300 font-semibold">{config.model || 'Gemini 1.5 Pro'}</span>
          <span className="text-slate-400">Temp: {config.temperature || 0.4}</span>
        </div>
        <p className="text-[11px] text-slate-300 p-2 rounded-lg bg-dark-950/70 border border-slate-800 line-clamp-2">
          {config.persona || 'Assistente com persona inteligente e contextual'}
        </p>
      </div>
    </BaseNode>
  );
};

export const MediaNode: React.FC<NodeProps> = ({ id, selected, data }) => {
  const nodeData = data as unknown as FlowNodeData;
  const config = nodeData.config || {};
  const mediaType = config.mediaType || 'image';

  return (
    <BaseNode
      id={id}
      selected={selected}
      title={nodeData.label || 'Enviar Mídia'}
      subtitle={
        mediaType === 'image'
          ? 'Imagem (Foto / Banner)'
          : mediaType === 'video'
          ? 'Vídeo (MP4)'
          : mediaType === 'audio'
          ? 'Áudio / Voz (PTT)'
          : 'Documento / PDF'
      }
      icon={<ImageIcon className="w-4 h-4" />}
      iconBg="bg-pink-500"
      accentColor="bg-pink-500"
      hasInput={true}
      hasOutput={true}
      isConfigured={Boolean(config.mediaUrl)}
    >
      <div className="space-y-2">
        {config.mediaUrl ? (
          <div className="space-y-1.5">
            {mediaType === 'image' && (
              <img
                src={config.mediaUrl}
                alt="Preview"
                className="w-full h-24 object-cover rounded-lg border border-white/10"
              />
            )}
            {mediaType === 'video' && (
              <div className="h-20 rounded-lg bg-pink-950/40 border border-pink-500/30 flex flex-col items-center justify-center text-pink-300 gap-1 text-xs font-semibold">
                <span>🎥 Vídeo Anexado</span>
              </div>
            )}
            {mediaType === 'audio' && (
              <div className="h-16 rounded-lg bg-pink-950/40 border border-pink-500/30 flex items-center justify-center text-pink-300 gap-2 text-xs font-semibold">
                <span>🎙️ Mensagem de Voz (PTT)</span>
              </div>
            )}
            {mediaType === 'document' && (
              <div className="p-2 rounded-lg bg-dark-950 border border-white/10 flex items-center gap-2 text-[11px] text-white">
                <span>📄</span>
                <span className="truncate font-mono">{config.fileName || 'documento.pdf'}</span>
              </div>
            )}
            {config.caption && (
              <p className="text-[10px] text-slate-300 line-clamp-1 italic">
                "{config.caption}"
              </p>
            )}
          </div>
        ) : (
          <div className="p-2.5 rounded-lg bg-dark-950/70 border border-slate-800 text-[11px] text-slate-500 italic text-center">
            Clique para configurar mídia ou upload
          </div>
        )}
      </div>
    </BaseNode>
  );
};

export const HumanHandoffNode: React.FC<NodeProps> = ({ id, selected, data }) => {
  const nodeData = data as unknown as FlowNodeData;
  const config = nodeData.config || {};

  return (
    <BaseNode
      id={id}
      selected={selected}
      title={nodeData.label || 'Transferir para Humano'}
      subtitle="Pausa automação e notifica"
      icon={<UserCheck className="w-4 h-4" />}
      iconBg="bg-rose-500"
      accentColor="bg-rose-500"
      hasInput={true}
      hasOutput={false}
      isConfigured={true}
    >
      <div className="p-2 rounded-lg bg-rose-950/40 border border-rose-800/40 text-[11px] text-rose-300">
        <span className="font-semibold">Fila: </span>
        {config.department || 'Atendimento Humano Geral'}
      </div>
    </BaseNode>
  );
};

// 1. Exibir Catálogo de Serviços (Apenas Exibição / Leitura)
export const ShowServicesNode: React.FC<NodeProps> = ({ id, selected, data }) => {
  const nodeData = data as unknown as FlowNodeData;
  const config = nodeData.config || {};

  return (
    <BaseNode
      id={id}
      selected={selected}
      title={nodeData.label || 'Exibir Catálogo de Serviços'}
      subtitle="Lista serviços, durações e preços"
      icon={<Layers className="w-4 h-4" />}
      iconBg="bg-amber-600"
      accentColor="bg-amber-500"
      hasInput={true}
      hasOutput={true}
      isConfigured={true}
    >
      <div className="space-y-1.5 p-2.5 rounded-xl bg-dark-950/90 border border-amber-500/20 text-[11px]">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30">
            📋 Apenas Exibição
          </span>
          <span className="text-[10px] text-slate-400 font-mono">Texto Formatado</span>
        </div>
        <p className="text-[10.5px] text-slate-300 leading-snug">
          Envia uma mensagem com todos os serviços e preços cadastrados no painel e prossegue o fluxo.
        </p>
      </div>
    </BaseNode>
  );
};

// 2. Selecionar Serviço (Botões Interativos no WhatsApp)
export const SelectServiceNode: React.FC<NodeProps> = ({ id, selected, data }) => {
  const nodeData = data as unknown as FlowNodeData;
  const config = nodeData.config || {};

  return (
    <BaseNode
      id={id}
      selected={selected}
      title={nodeData.label || 'Selecionar Serviço'}
      subtitle="Botões de escolha no WhatsApp"
      icon={<Scissors className="w-4 h-4" />}
      iconBg="bg-emerald-600"
      accentColor="bg-emerald-500"
      hasInput={true}
      hasOutput={true}
      isConfigured={true}
    >
      <div className="space-y-2 p-2.5 rounded-xl bg-dark-950/90 border border-emerald-500/20 text-[11px]">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            🔘 Botões de Escolha
          </span>
          <span className="text-[10px] text-slate-400 font-mono">Interativo</span>
        </div>
        <p className="text-[10.5px] text-slate-300 leading-snug">
          Apresenta os serviços como botões clicáveis no WhatsApp e aguarda a seleção do cliente.
        </p>
        <div className="border-t border-white/5 pt-1.5 space-y-1">
          <span className="text-[10px] font-semibold text-emerald-400 block">Salva nas variáveis:</span>
          <div className="flex items-center gap-1.5 flex-wrap">
            <VariableBadge name="servico_selecionado" />
            <VariableBadge name="valor_servico" />
            <VariableBadge name="duracao_minutos" />
          </div>
        </div>
      </div>
    </BaseNode>
  );
};

export const ServicesCatalogNode = SelectServiceNode;

export const CheckContactNode: React.FC<NodeProps> = ({ id, selected, data }) => {
  const nodeData = data as unknown as FlowNodeData;

  const outputs = [
    { id: 'is_new', label: 'Novo Contato (1ª Vez)', color: '!bg-emerald-400' },
    { id: 'is_existing', label: 'Contato Salvo (Recorrente)', color: '!bg-cyan-400' },
  ];

  return (
    <BaseNode
      id={id}
      selected={selected}
      title={nodeData.label || 'Verificar Contato'}
      subtitle="Primeiro Contato vs Contato Salvo"
      icon={<Users className="w-4 h-4" />}
      iconBg="bg-indigo-600"
      accentColor="bg-indigo-500"
      hasInput={true}
      hasOutput={false}
      customOutputs={outputs}
      isConfigured={true}
    >
      <div className="p-2.5 rounded-xl bg-dark-950/90 border border-indigo-500/20 text-[10px] text-slate-300 space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-indigo-400 font-bold">Variáveis Geradas:</span>
          <span className="text-emerald-400 font-mono text-[9px]">1-Clique Copiar</span>
        </div>
        <div className="flex flex-wrap gap-1 pt-0.5">
          <VariableBadge name="nome_cliente" />
          <VariableBadge name="telefone_whatsapp" />
          <VariableBadge name="is_primeiro_contato" />
          <VariableBadge name="total_agendamentos" />
        </div>
      </div>
    </BaseNode>
  );
};

// 3. Escolher Data do Agendamento
export const SelectDateNode: React.FC<NodeProps> = ({ id, selected, data }) => {
  const nodeData = data as unknown as FlowNodeData;
  const config = nodeData.config || {};

  return (
    <BaseNode
      id={id}
      selected={selected}
      title={nodeData.label || 'Escolher Data'}
      subtitle="Seleciona o dia do agendamento"
      icon={<CalendarDays className="w-4 h-4" />}
      iconBg="bg-teal-600"
      accentColor="bg-teal-500"
      hasInput={true}
      hasOutput={true}
      isConfigured={true}
    >
      <div className="space-y-2 p-2.5 rounded-xl bg-dark-950/90 border border-teal-500/20 text-[11px]">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-teal-500/15 text-teal-300 border border-teal-500/30">
            📅 Opções de Data
          </span>
          <span className="text-[10px] text-slate-400 font-mono">Hoje / Amanhã</span>
        </div>
        <p className="text-[10.5px] text-slate-300 leading-snug">
          Envia botões rápidos de datas e processa respostas do cliente.
        </p>
        <div className="text-[10px] text-slate-300 flex items-center justify-between pt-1 border-t border-white/5">
          <span>Variável salva:</span>
          <VariableBadge name={config.dateVariable || 'data_agendamento'} />
        </div>
      </div>
    </BaseNode>
  );
};

export const AskDateNode = SelectDateNode;

// 4. Escolher Horário Disponível na Data
export const SelectTimeSlotNode: React.FC<NodeProps> = ({ id, selected, data }) => {
  const nodeData = data as unknown as FlowNodeData;
  const config = nodeData.config || {};

  return (
    <BaseNode
      id={id}
      selected={selected}
      title={nodeData.label || 'Escolher Horário Disponível'}
      subtitle="Vagas calculadas em tempo real"
      icon={<Clock className="w-4 h-4" />}
      iconBg="bg-emerald-600"
      accentColor="bg-emerald-500"
      hasInput={true}
      hasOutput={true}
      isConfigured={true}
    >
      <div className="space-y-2 p-2.5 rounded-xl bg-dark-950/90 border border-emerald-500/20 text-[11px]">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            🕒 Vagas em Tempo Real
          </span>
          <span className="text-[10px] text-slate-400 font-mono">
            <VariableBadge name={config.dateVariable || 'data_agendamento'} />
          </span>
        </div>
        <p className="text-[10.5px] text-slate-300 leading-snug">
          Calcula os horários livres na data selecionada e envia como botões no WhatsApp.
        </p>
        <div className="text-[10px] text-slate-300 flex items-center justify-between pt-1 border-t border-white/5">
          <span>Variável salva:</span>
          <VariableBadge name="horario_agendamento" />
        </div>
      </div>
    </BaseNode>
  );
};

export const ScheduleContactNode = SelectTimeSlotNode;

export const ConfirmBookingNode: React.FC<NodeProps> = ({ id, selected, data }) => {
  const nodeData = data as unknown as FlowNodeData;
  const config = nodeData.config || {};

  return (
    <BaseNode
      id={id}
      selected={selected}
      title={nodeData.label || 'Confirmar Agendamento'}
      subtitle="Exibe resumo e grava na Agenda"
      icon={<CheckCircle2 className="w-4 h-4" />}
      iconBg="bg-emerald-600"
      accentColor="bg-emerald-500"
      hasInput={true}
      hasOutput={true}
      isConfigured={true}
    >
      <div className="space-y-1.5 p-2.5 rounded-xl bg-dark-950/90 border border-emerald-500/20 text-[10px]">
        <div className="flex items-center justify-between border-b border-white/5 pb-1">
          <span className="font-bold text-emerald-400">Resumo do Agendamento:</span>
          <span className="text-[9px] font-mono text-slate-400">Automático</span>
        </div>
        <div className="space-y-1 pt-0.5">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">🏷️ Serviço:</span>
            <VariableBadge name="servico_selecionado" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">📅 Data:</span>
            <VariableBadge name="data_agendamento" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">🕒 Horário:</span>
            <VariableBadge name="horario_agendamento" />
          </div>
        </div>
      </div>
    </BaseNode>
  );
};

export const UpdateContactNode: React.FC<NodeProps> = ({ id, selected, data }) => {
  const nodeData = data as unknown as FlowNodeData;
  const config = nodeData.config || {};

  return (
    <BaseNode
      id={id}
      selected={selected}
      title={nodeData.label || 'Salvar / Vincular Dados'}
      subtitle="Grava campos no perfil do WhatsApp"
      icon={<Sliders className="w-4 h-4" />}
      iconBg="bg-cyan-600"
      accentColor="bg-cyan-500"
      hasInput={true}
      hasOutput={true}
      isConfigured={Boolean(config.contactName || config.tags || config.customField)}
    >
      <div className="space-y-1 p-2 rounded-xl bg-dark-950/80 border border-cyan-500/20 text-[11px] text-slate-300">
        {config.contactName && (
          <div className="flex items-center gap-1.5">
            <span className="text-cyan-400 font-semibold text-[10px]">Nome: </span>
            <VariableBadge name={config.contactName} />
          </div>
        )}
        {config.tags && (
          <div className="truncate">
            <span className="text-cyan-400 font-semibold text-[10px]">Tags: </span>
            <span className="text-[10px] bg-cyan-950/80 text-cyan-300 px-1.5 py-0.5 rounded border border-cyan-800/60 font-sans">
              {config.tags}
            </span>
          </div>
        )}
        {config.customFieldKey && (
          <div className="flex items-center gap-1.5 text-[10px]">
            <span className="font-mono text-slate-400">{config.customFieldKey} =</span>
            <VariableBadge name={config.customFieldValue || 'valor'} />
          </div>
        )}
        {!config.contactName && !config.tags && !config.customFieldKey && (
          <span className="italic text-slate-500 text-[10px]">Clique para configurar os dados a vincular</span>
        )}
      </div>
    </BaseNode>
  );
};

export const EndFlowNode: React.FC<NodeProps> = ({ id, selected, data }) => {
  const nodeData = data as unknown as FlowNodeData;
  const config = nodeData.config || {};

  return (
    <BaseNode
      id={id}
      selected={selected}
      title={nodeData.label || 'Finalizar Fluxo'}
      subtitle="Fim do atendimento"
      icon={<OctagonX className="w-4 h-4" />}
      iconBg="bg-rose-600"
      accentColor="bg-rose-500"
      hasInput={true}
      hasOutput={false}
      isConfigured={true}
    >
      <div className="space-y-1.5 p-2 rounded-xl bg-dark-950/80 border border-rose-500/20 text-[11px] text-slate-300">
        <div className="flex items-center gap-1 text-[10px] text-rose-300 font-semibold">
          <OctagonX className="w-3 h-3 text-rose-400" />
          <span>Encerramento do Fluxo</span>
        </div>
        <p className="text-[10px] text-slate-400 line-clamp-2 italic">
          {config.message || 'Atendimento finalizado com sucesso!'}
        </p>
        <div className="flex items-center gap-1 pt-1 border-t border-white/5">
          <span className="px-1.5 py-0.5 rounded bg-rose-950/60 border border-rose-800/40 text-[9px] text-rose-300 font-mono">
            Sessão Concluída
          </span>
        </div>
      </div>
    </BaseNode>
  );
};


