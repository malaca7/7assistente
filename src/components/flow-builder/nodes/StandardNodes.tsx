import React from 'react';
import { NodeProps } from '@xyflow/react';
import { Zap, MessageSquare, ListChecks, HelpCircle } from 'lucide-react';
import { BaseNode } from './BaseNode';
import { FlowNodeData } from '../../../types';

export const TriggerNode: React.FC<NodeProps> = ({ id, selected, data }) => {
  const nodeData = data as unknown as FlowNodeData;
  const config = nodeData.config || {};

  return (
    <BaseNode
      id={id}
      selected={selected}
      title={nodeData.label || 'Gatilho Inicial'}
      subtitle={config.eventType === 'keyword' ? `Palavra: ${config.keywords || '...'}` : 'Mensagem Recebida'}
      icon={<Zap className="w-4 h-4" />}
      iconBg="bg-amber-500"
      accentColor="bg-amber-500"
      hasInput={false}
      hasOutput={true}
      isConfigured={Boolean(config.eventType || true)}
    >
      <div className="p-2 rounded-lg bg-dark-950/70 border border-slate-800 text-[11px] text-slate-300">
        <span className="font-semibold text-amber-400">Evento: </span>
        {config.eventType === 'keyword' ? `Contém "${config.keywords || 'palavra-chave'}"` : 'Qualquer mensagem recebida'}
      </div>
    </BaseNode>
  );
};

export const MessageNode: React.FC<NodeProps> = ({ id, selected, data }) => {
  const nodeData = data as unknown as FlowNodeData;
  const config = nodeData.config || {};

  return (
    <BaseNode
      id={id}
      selected={selected}
      title={nodeData.label || 'Enviar Mensagem'}
      subtitle="Texto / Variáveis"
      icon={<MessageSquare className="w-4 h-4" />}
      iconBg="bg-primary-500"
      accentColor="bg-primary-500"
      hasInput={true}
      hasOutput={true}
      isConfigured={Boolean(config.text)}
    >
      <div className="p-2.5 rounded-lg bg-dark-950/70 border border-slate-800 text-[11px] text-slate-300 line-clamp-3">
        {config.text || <span className="italic text-slate-500">Clique para escrever a mensagem...</span>}
      </div>
    </BaseNode>
  );
};

export const ButtonsNode: React.FC<NodeProps> = ({ id, selected, data }) => {
  const nodeData = data as unknown as FlowNodeData;
  const config = nodeData.config || {};
  const buttons = (config.buttons as Array<{ id: string; title: string }>) || [
    { id: 'btn_1', title: 'Opção 1' },
    { id: 'btn_2', title: 'Opção 2' },
  ];

  const outputs = buttons.map((b, i) => ({
    id: b.id || `btn_${i + 1}`,
    label: `${i + 1}. ${b.title || `Botão ${i + 1}`}`,
    color: '!bg-brand-400',
  }));

  return (
    <BaseNode
      id={id}
      selected={selected}
      title={nodeData.label || 'Botões Interativos WhatsApp'}
      subtitle="Botões de Resposta Rápida"
      icon={<ListChecks className="w-4 h-4" />}
      iconBg="bg-brand-600"
      accentColor="bg-brand-500"
      hasInput={true}
      hasOutput={false}
      customOutputs={outputs}
      isConfigured={buttons.length > 0}
    >
      <div className="space-y-2">
        <div className="p-2.5 rounded-xl bg-dark-950/80 border border-white/5 text-[11px] text-slate-200">
          <p className="font-medium leading-tight text-white mb-1">
            {config.bodyText || 'Escolha uma das opções abaixo:'}
          </p>
          {config.footerText && (
            <p className="text-[9px] text-slate-400 italic">
              {config.footerText}
            </p>
          )}
        </div>

        <div className="space-y-1">
          {buttons.map((b, i) => (
            <div
              key={b.id || i}
              className="py-1 px-2.5 rounded-lg bg-dark-850 border border-brand-500/30 text-brand-300 text-[10px] font-semibold flex items-center justify-between shadow-sm"
            >
              <span>{b.title || `Botão ${i + 1}`}</span>
              <span className="text-[9px] text-slate-400 font-mono">Saída #{i + 1}</span>
            </div>
          ))}
        </div>
      </div>
    </BaseNode>
  );
};

export const QuestionNode: React.FC<NodeProps> = ({ id, selected, data }) => {
  const nodeData = data as unknown as FlowNodeData;
  const config = nodeData.config || {};

  return (
    <BaseNode
      id={id}
      selected={selected}
      title={nodeData.label || 'Fazer Pergunta'}
      subtitle={`Salva em: {{${config.variableName || 'resposta'}}}`}
      icon={<HelpCircle className="w-4 h-4" />}
      iconBg="bg-cyan-500"
      accentColor="bg-cyan-500"
      hasInput={true}
      hasOutput={true}
      isConfigured={Boolean(config.questionText)}
    >
      <div className="space-y-1.5">
        <div className="p-2 rounded-lg bg-dark-950/70 border border-slate-800 text-[11px] text-slate-300 line-clamp-2">
          {config.questionText || <span className="italic text-slate-500">Qual pergunta deseja fazer?</span>}
        </div>
        <div className="flex items-center justify-between text-[10px] text-slate-400">
          <span>Tipo: {config.expectedType || 'Texto livre'}</span>
          <span className="font-mono text-cyan-400">{`{{${config.variableName || 'resposta'}}}`}</span>
        </div>
      </div>
    </BaseNode>
  );
};
