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
  DollarSign,
  UserPlus,
  Users,
  CheckCircle2,
  ListOrdered
} from 'lucide-react';
import { BaseNode } from './BaseNode';
import { FlowNodeData } from '../../../types';

export const ConditionNode: React.FC<NodeProps> = ({ id, selected, data }) => {
  const nodeData = data as unknown as FlowNodeData;
  const config = nodeData.config || {};

  const outputs = [
    { id: 'true', label: 'Verdadeiro (TRUE)', color: '!bg-brand-400' },
    { id: 'false', label: 'Falso (FALSE)', color: '!bg-rose-400' },
  ];

  return (
    <BaseNode
      id={id}
      selected={selected}
      title={nodeData.label || 'Condição / IF'}
      subtitle="Desvio condicional"
      icon={<GitBranch className="w-4 h-4" />}
      iconBg="bg-purple-500"
      accentColor="bg-purple-500"
      hasInput={true}
      hasOutput={false}
      customOutputs={outputs}
      isConfigured={Boolean(config.variable && config.operator)}
    >
      <div className="p-2 rounded-lg bg-dark-950/70 border border-slate-800 text-[11px] text-slate-300 font-mono">
        {config.variable ? (
          <span>
            {`{{${config.variable}}}`} <span className="text-purple-400">{config.operator || '=='}</span> "{config.value || ''}"
          </span>
        ) : (
          <span className="italic text-slate-500 font-sans">Configure a regra de condição...</span>
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

  return (
    <BaseNode
      id={id}
      selected={selected}
      title={nodeData.label || 'Definir Variável'}
      subtitle="Armazenar estado"
      icon={<Sliders className="w-4 h-4" />}
      iconBg="bg-violet-500"
      accentColor="bg-violet-500"
      hasInput={true}
      hasOutput={true}
      isConfigured={Boolean(config.varName)}
    >
      <div className="p-2 rounded-lg bg-dark-950/70 border border-slate-800 text-[11px] text-slate-300 flex items-center justify-between font-mono">
        <span className="text-violet-400">{`{{${config.varName || 'variavel'}}}`}</span>
        <span className="text-slate-500">=</span>
        <span className="truncate max-w-[100px] text-slate-200">{config.varValue || 'valor'}</span>
      </div>
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

export const ScheduleContactNode: React.FC<NodeProps> = ({ id, selected, data }) => {
  const nodeData = data as unknown as FlowNodeData;
  const config = nodeData.config || {};
  const isShowSlotsMode = config.mode === 'show_slots';

  return (
    <BaseNode
      id={id}
      selected={selected}
      title={nodeData.label || (isShowSlotsMode ? 'Ver Horários Livres' : 'Agendar na Agenda')}
      subtitle={isShowSlotsMode ? 'Consulta & Envia Horários Disponíveis' : 'Confirma e Bloqueia Horário'}
      icon={<Calendar className="w-4 h-4" />}
      iconBg="bg-emerald-600"
      accentColor="bg-emerald-500"
      hasInput={true}
      hasOutput={true}
      isConfigured={Boolean(config.serviceName || config.dateVariable || config.mode)}
    >
      <div className="space-y-1.5 p-2.5 rounded-xl bg-dark-950/90 border border-emerald-500/20 text-[11px]">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            {isShowSlotsMode ? '🔍 Consultar Horários' : '✅ Confirmar Reserva'}
          </span>
          <span className="text-[10px] font-mono text-slate-400">
            {config.dateType === 'tomorrow' ? 'Amanhã' : config.dateType === 'variable' ? `{{${config.dateVariable || 'data'}}}` : 'Hoje'}
          </span>
        </div>
        <div className="flex items-center justify-between text-slate-200 pt-0.5">
          <span className="font-semibold text-emerald-400">Serviço:</span>
          <span className="truncate max-w-[130px] font-medium text-white">
            {config.serviceName ? config.serviceName : '{{servico_selecionado}}'}
          </span>
        </div>
      </div>
    </BaseNode>
  );
};

export const ServicesCatalogNode: React.FC<NodeProps> = ({ id, selected, data }) => {
  const nodeData = data as unknown as FlowNodeData;
  const config = nodeData.config || {};
  const isButtonsFormat = config.displayFormat !== 'text_list';

  return (
    <BaseNode
      id={id}
      selected={selected}
      title={nodeData.label || 'Catálogo de Serviços & Preços'}
      subtitle="Puxa serviços e valores do painel"
      icon={<DollarSign className="w-4 h-4" />}
      iconBg="bg-amber-600"
      accentColor="bg-amber-500"
      hasInput={true}
      hasOutput={true}
      isConfigured={true}
    >
      <div className="space-y-1.5 p-2.5 rounded-xl bg-dark-950/90 border border-amber-500/20 text-[11px]">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30">
            {isButtonsFormat ? '🔘 Menu Interativo' : '📋 Lista de Preços'}
          </span>
          <span className="text-[10px] text-slate-400 font-mono">Painel Admin</span>
        </div>
        <div className="text-[10px] text-slate-300 font-medium pt-0.5">
          Salva variáveis: <span className="font-mono text-amber-300">servico_selecionado, valor_servico</span>
        </div>
      </div>
    </BaseNode>
  );
};

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
      <div className="p-2.5 rounded-xl bg-dark-950/90 border border-indigo-500/20 text-[10px] text-slate-300 space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-indigo-400 font-bold">Variáveis Geradas:</span>
          <span className="text-emerald-400 font-mono">Automático</span>
        </div>
        <p className="font-mono text-[9.5px] text-slate-400 leading-tight">
          nome_cliente, telefone_whatsapp, is_primeiro_contato, total_agendamentos
        </p>
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
          <div className="truncate">
            <span className="text-cyan-400 font-semibold">Nome: </span>
            <span className="font-mono">{`{{${config.contactName}}}`}</span>
          </div>
        )}
        {config.tags && (
          <div className="truncate">
            <span className="text-cyan-400 font-semibold">Tags: </span>
            <span className="text-[10px] bg-cyan-950/80 text-cyan-300 px-1.5 py-0.5 rounded border border-cyan-800/60">
              {config.tags}
            </span>
          </div>
        )}
        {config.customFieldKey && (
          <div className="truncate text-[10px] font-mono text-slate-400">
            {config.customFieldKey} = {`{{${config.customFieldValue || 'valor'}}}`}
          </div>
        )}
        {!config.contactName && !config.tags && !config.customFieldKey && (
          <span className="italic text-slate-500 text-[10px]">Clique para configurar os dados a vincular</span>
        )}
      </div>
    </BaseNode>
  );
};
