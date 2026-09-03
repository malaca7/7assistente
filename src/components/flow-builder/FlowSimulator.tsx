import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Send, 
  Bot, 
  User, 
  Play, 
  RotateCcw, 
  Sparkles, 
  Check, 
  CheckCheck,
  Zap,
  SlidersHorizontal,
  ChevronRight,
  Calendar,
  DollarSign
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Flow, FlowNode, FlowEdge, BotProfile } from '../../types';
import { substituteVariables, executeAiNode } from '../../lib/flowEngine';
import { StorageService } from '../../lib/storage';

export interface FlowSimulatorProps {
  flow: Flow;
  nodes: FlowNode[];
  edges: FlowEdge[];
  onClose: () => void;
  onHighlightNode?: (nodeId: string | null) => void;
}

interface SimMessage {
  id: string;
  sender: 'bot' | 'user' | 'system';
  content: string;
  buttons?: Array<{ id: string; title: string }>;
  timestamp: string;
  nodeId?: string;
}

export const FlowSimulator: React.FC<FlowSimulatorProps> = ({
  flow,
  nodes,
  edges,
  onClose,
  onHighlightNode,
}) => {
  const [messages, setMessages] = useState<SimMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [botProfile, setBotProfile] = useState<BotProfile | null>(null);
  const [variables, setVariables] = useState<Record<string, any>>({
    nome_cliente: 'Cliente Teste',
    telefone_cliente: '81996138924',
    empresa: 'Talvane Barber',
    bot_nome: 'Talvane Barber Bot',
  });
  const [currentNodeId, setCurrentNodeId] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load bot profile and start flow simulation
  useEffect(() => {
    async function init() {
      const profile = await StorageService.getBotProfile();
      const botVars = await StorageService.getBotVariables();
      setBotProfile(profile);
      setVariables((prev) => ({ ...botVars, ...prev }));
      startFlow(profile, botVars);
    }
    init();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const startFlow = (profile?: BotProfile | null, botVars?: Record<string, any>) => {
    setMessages([]);
    const triggerNode = nodes.find((n) => n.type === 'trigger') || nodes[0];
    if (!triggerNode) {
      setMessages([
        {
          id: 'sys-0',
          sender: 'system',
          content: 'Nenhum nó de gatilho encontrado no fluxo.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      return;
    }

    setMessages([
      {
        id: 'sys-start',
        sender: 'system',
        content: `▶️ Simulação iniciada: "${triggerNode.data?.label || 'Gatilho'}"`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        nodeId: triggerNode.id,
      },
    ]);

    runNextFromNode(triggerNode.id, profile || botProfile, botVars || variables);
  };

  const runNextFromNode = async (
    startNodeId: string,
    currentProfile?: BotProfile | null,
    currentVars?: Record<string, any>
  ) => {
    setIsRunning(true);
    let currentId: string | undefined = startNodeId;
    let stepCount = 0;
    const activeVars = { ...variables, ...(currentVars || {}) };
    const p = currentProfile || botProfile;

    while (currentId && stepCount < 15) {
      stepCount++;
      const outgoing = edges.filter((e) => e.source === currentId);
      if (outgoing.length === 0) break;

      // Check current node type
      const startNode = nodes.find(n => n.id === currentId);
      const startNodeType = startNode?.data?.nodeType || startNode?.type;

      let targetEdge = outgoing[0];

      // Handle check_contact branching in simulator
      if (startNodeType === 'check_contact') {
        const isNew = !activeVars.is_existing_contact;
        const branchEdge = outgoing.find(e => e.sourceHandle === (isNew ? 'is_new' : 'is_existing')) || outgoing[0];
        targetEdge = branchEdge;
      }

      const nextNode = nodes.find((n) => n.id === targetEdge.target);
      if (!nextNode) break;

      currentId = nextNode.id;
      setCurrentNodeId(currentId);
      onHighlightNode?.(currentId);

      const type = nextNode.data?.nodeType || nextNode.type;
      const config = nextNode.data?.config || {};

      await new Promise((resolve) => setTimeout(resolve, 600));

      if (type === 'message') {
        const text = substituteVariables(config.text || 'Olá!', activeVars, p || undefined);
        setMessages((prev) => [
          ...prev,
          {
            id: `msg-${Date.now()}-${Math.random()}`,
            sender: 'bot',
            content: text,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            nodeId: nextNode.id,
          },
        ]);
      } else if (type === 'buttons') {
        const body = substituteVariables(config.bodyText || 'Escolha uma opção:', activeVars, p || undefined);
        setMessages((prev) => [
          ...prev,
          {
            id: `msg-${Date.now()}-${Math.random()}`,
            sender: 'bot',
            content: body,
            buttons: config.buttons || [{ id: 'b1', title: 'Opção 1' }, { id: 'b2', title: 'Opção 2' }],
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            nodeId: nextNode.id,
          },
        ]);
        break;
      } else if (type === 'question') {
        const qText = substituteVariables(config.questionText || 'Informe seus dados:', activeVars, p || undefined);
        setMessages((prev) => [
          ...prev,
          {
            id: `msg-${Date.now()}-${Math.random()}`,
            sender: 'bot',
            content: qText,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            nodeId: nextNode.id,
          },
        ]);
        break;
      } else if (type === 'ask_date') {
        const qText = substituteVariables(config.questionText || 'Para qual dia você deseja agendar?', activeVars, p || undefined);
        const todayStr = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        const tomDate = new Date();
        tomDate.setDate(tomDate.getDate() + 1);
        const tomStr = tomDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

        setMessages((prev) => [
          ...prev,
          {
            id: `msg-${Date.now()}-${Math.random()}`,
            sender: 'bot',
            content: `📅 *Escolha a Data:*\n${qText}`,
            buttons: [
              { id: 'date_today', title: `Hoje (${todayStr})` },
              { id: 'date_tomorrow', title: `Amanhã (${tomStr})` },
              { id: 'date_custom', title: 'Outra Data' },
            ],
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            nodeId: nextNode.id,
          },
        ]);
        break;
      } else if (type === 'services_catalog') {
        const intro = substituteVariables(config.introMessage || 'Qual serviço você deseja agendar?', activeVars, p || undefined);
        setMessages((prev) => [
          ...prev,
          {
            id: `msg-${Date.now()}-${Math.random()}`,
            sender: 'bot',
            content: `🏷️ *Catálogo de Serviços:*\n${intro}`,
            buttons: [
              { id: 'srv_1', title: 'Corte de Cabelo (R$ 35,00)' },
              { id: 'srv_2', title: 'Barba Terapia (R$ 40,00)' },
              { id: 'srv_3', title: 'Combo Cabelo + Barba (R$ 70,00)' },
            ],
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            nodeId: nextNode.id,
          },
        ]);
        break;
      } else if (type === 'schedule_contact') {
        const srv = activeVars.servico_selecionado || 'Corte de Cabelo';
        setMessages((prev) => [
          ...prev,
          {
            id: `msg-${Date.now()}-${Math.random()}`,
            sender: 'bot',
            content: `🕒 *Horários Livres da Agenda:*\nServiço selecionado: *${srv}*\nEscolha seu horário:`,
            buttons: [
              { id: 'slot_0900', title: '🕒 09:00' },
              { id: 'slot_1000', title: '🕒 10:00' },
              { id: 'slot_1400', title: '🕒 14:00' },
            ],
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            nodeId: nextNode.id,
          },
        ]);
        break;
      } else if (type === 'confirm_booking') {
        const clientName = activeVars.nome_cliente || 'Cliente';
        const srvName = activeVars.servico_selecionado || 'Corte de Cabelo';
        const dateVal = activeVars.data_agendamento || new Date().toLocaleDateString('pt-BR');
        const timeVal = activeVars.horario_agendamento || '09:00';
        const defaultConfirm = `✅ *Agendamento Confirmado com Sucesso!*\n\n• *Cliente:* ${clientName}\n• *Serviço:* ${srvName}\n• *Data:* ${dateVal}\n• *Horário:* ${timeVal}\n\nSeu horário foi reservado em nossa Agenda com sucesso!`;
        const confirmMsg = config.confirmMessage ? substituteVariables(config.confirmMessage, activeVars, p || undefined) : defaultConfirm;

        setMessages((prev) => [
          ...prev,
          {
            id: `msg-${Date.now()}-${Math.random()}`,
            sender: 'bot',
            content: confirmMsg,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            nodeId: nextNode.id,
          },
        ]);
      } else if (type === 'ai_agent') {
        setMessages((prev) => [
          ...prev,
          {
            id: `msg-${Date.now()}-${Math.random()}`,
            sender: 'bot',
            content: `✨ [Agente de IA]: Entendi sua solicitação. Como posso te auxiliar a encontrar o melhor horário?`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            nodeId: nextNode.id,
          },
        ]);
      } else if (type === 'human_handoff') {
        setMessages((prev) => [
          ...prev,
          {
            id: `msg-${Date.now()}-${Math.random()}`,
            sender: 'system',
            content: `👨‍💼 ${config.notifyMessage || 'Atendimento transferido para a equipe humana.'}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            nodeId: nextNode.id,
          },
        ]);
        break;
      }
    }

    setIsRunning(false);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userText = inputText.trim();
    setInputText('');

    setMessages((prev) => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        sender: 'user',
        content: userText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);

    // Save variable if answering a question
    const activeNode = nodes.find(n => n.id === currentNodeId);
    if (activeNode && (activeNode.data?.nodeType || activeNode.type) === 'question') {
      const varKey = activeNode.data?.config?.variableName || 'resposta_usuario';
      setVariables(prev => ({ ...prev, [varKey]: userText, nome_cliente: varKey.includes('nome') ? userText : prev.nome_cliente }));
    }

    if (currentNodeId) {
      runNextFromNode(currentNodeId);
    } else {
      const trigger = nodes.find((n) => n.type === 'trigger') || nodes[0];
      if (trigger) runNextFromNode(trigger.id);
    }
  };

  const handleButtonClick = (btnTitle: string, btnId?: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: `user-btn-${Date.now()}`,
        sender: 'user',
        content: btnTitle,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);

    // Store variables based on button type
    if (btnId?.startsWith('srv_') || btnTitle.includes('R$')) {
      const srvName = btnTitle.split('(')[0].trim();
      setVariables(prev => ({ ...prev, servico_selecionado: srvName, opcao_selecionada: srvName }));
    }
    if (btnId?.startsWith('slot_') || btnTitle.includes('🕒')) {
      const timeVal = btnTitle.replace('🕒', '').trim();
      setVariables(prev => ({ ...prev, horario_agendamento: timeVal }));
    }
    if (btnId?.startsWith('date_')) {
      const dateVal = btnId === 'date_tomorrow' ? 'Amanhã' : 'Hoje';
      setVariables(prev => ({ ...prev, data_agendamento: dateVal }));
    }

    if (currentNodeId) {
      const matchingEdge =
        edges.find((e) => e.source === currentNodeId && e.sourceHandle === btnId) ||
        edges.find((e) => e.source === currentNodeId);

      if (matchingEdge) {
        const nextNode = nodes.find((n) => n.id === matchingEdge.target);
        if (nextNode) {
          runNextFromNode(matchingEdge.target);
          return;
        }
      }
      runNextFromNode(currentNodeId);
    }
  };

  return (
    <div className="fixed inset-x-4 bottom-4 sm:inset-x-auto sm:right-6 sm:bottom-6 top-16 sm:top-20 w-auto sm:w-[420px] bg-dark-900/95 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl z-50 flex flex-col overflow-hidden select-none animate-in slide-in-from-bottom-5 duration-200">
      {/* Simulator Header */}
      <div className="p-4 border-b border-white/5 flex items-center justify-between bg-dark-950/70">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-brand-400">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
              Simulador Interativo
              <Badge variant="brand" className="text-[9px] py-0 px-1.5">Ao Vivo</Badge>
            </h3>
            <p className="text-[10px] text-slate-400 truncate">{flow.name}</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => startFlow()}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Reiniciar Simulação"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Message Stream */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3 custom-scrollbar">
        {messages.map((m) => {
          if (m.sender === 'system') {
            return (
              <div key={m.id} className="text-center my-2">
                <span className="text-[10px] bg-dark-950 text-slate-400 px-3 py-1 rounded-full border border-white/5 inline-block">
                  {m.content}
                </span>
              </div>
            );
          }

          const isUser = m.sender === 'user';
          return (
            <div key={m.id} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs shadow-md ${
                  isUser
                    ? 'bg-[#005c4b] text-white rounded-br-none border border-[#007a64]/40'
                    : 'bg-dark-850 text-slate-100 border border-white/5 rounded-bl-none'
                }`}
              >
                <p className="leading-relaxed whitespace-pre-wrap">{m.content}</p>

                {/* Interactive Buttons */}
                {m.buttons && m.buttons.length > 0 && (
                  <div className="pt-2 space-y-1.5">
                    {m.buttons.map((btn) => (
                      <button
                        key={btn.id}
                        onClick={() => handleButtonClick(btn.title, btn.id)}
                        className="w-full py-2 px-3 rounded-xl bg-dark-950 hover:bg-dark-800 border border-brand-500/40 text-brand-300 hover:text-white text-xs font-semibold text-center transition-all flex items-center justify-between gap-1 shadow-sm active:scale-[0.98]"
                      >
                        <span className="truncate">{btn.title}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-brand-400 flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                )}

                <div
                  className={`flex items-center justify-end gap-1 mt-1.5 text-[9px] ${
                    isUser ? 'text-emerald-300/70' : 'text-slate-500'
                  }`}
                >
                  <span>{m.timestamp}</span>
                  {isUser && <CheckCheck className="w-3 h-3 text-cyan-300" />}
                </div>
              </div>
            </div>
          );
        })}
        {isRunning && (
          <div className="flex items-center gap-2 text-xs text-brand-400 animate-pulse py-1">
            <span className="w-2 h-2 rounded-full bg-brand-400" />
            <span>Robô digitando resposta...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSend} className="p-3 bg-dark-950 border-t border-white/5 flex items-center gap-2">
        <input
          type="text"
          placeholder="Digite para responder na simulação..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          className="flex-1 bg-dark-850 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
        <Button
          type="submit"
          variant="brand"
          size="sm"
          disabled={!inputText.trim()}
          className="px-3 py-2 h-auto"
        >
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </div>
  );
};
