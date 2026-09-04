import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Send, 
  Bot, 
  User, 
  RotateCcw, 
  SlidersHorizontal,
  ChevronRight,
  Phone,
  UserCheck,
  UserPlus,
  Calendar,
  Sparkles,
  CheckCheck
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Flow, FlowNode, FlowEdge, BotProfile, AgendaServiceItem, Contact } from '../../types';
import { substituteVariables, executeVariableAssignment } from '../../lib/flowEngine';
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
  // Setup & Configuration Screen state
  const [isConfiguring, setIsConfiguring] = useState(true);
  const [simName, setSimName] = useState('Carlos Silva');
  const [simPhone, setSimPhone] = useState('81999998888');
  const [simMode, setSimMode] = useState<'new' | 'existing'>('new');
  const [availableContacts, setAvailableContacts] = useState<Contact[]>([]);

  // Simulation execution state
  const [messages, setMessages] = useState<SimMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [botProfile, setBotProfile] = useState<BotProfile | null>(null);
  const [agendaServices, setAgendaServices] = useState<AgendaServiceItem[]>([]);
  const [variables, setVariables] = useState<Record<string, any>>({});
  const [currentNodeId, setCurrentNodeId] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load bot profile, services and registered contacts
  useEffect(() => {
    async function loadInitialData() {
      try {
        const [profile, botVars, contactsList] = await Promise.all([
          StorageService.getBotProfile(),
          StorageService.getBotVariables(),
          StorageService.getContacts(),
        ]);
        setBotProfile(profile);
        setVariables(botVars || {});
        setAvailableContacts((contactsList || []).filter(c => !StorageService.isContactDeleted(c)));

        try {
          const agenda = await StorageService.getAgendaSettings();
          if (agenda?.services && Array.isArray(agenda.services)) {
            const activeServices = agenda.services.filter((s: any) => s.active !== false && s.is_active !== false);
            setAgendaServices(activeServices);
          }
        } catch (e) {
          console.warn('Error loading agenda services for simulator:', e);
        }
      } catch (err) {
        console.warn('Error initializing simulator data:', err);
      }
    }
    loadInitialData();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Start or Restart Flow Execution
  const handleStartSimulation = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanPhone = (simPhone || '').replace(/\D/g, '') || '81999998888';
    const isNew = simMode === 'new';
    const clientName = simName.trim() || (isNew ? '' : 'Cliente Cadastrado');

    const initialVars: Record<string, any> = {
      ...variables,
      whatsapp_pushname: clientName || 'Cliente',
      telefone_cliente: cleanPhone,
      telefone_whatsapp: cleanPhone,
      telefone: cleanPhone,
      is_novo_contato: isNew,
      is_primeiro_contato: isNew,
      is_existing_contact: !isNew,
      tipo_cliente: isNew ? 'novo' : 'recorrente',
      nome_cliente: isNew ? '' : clientName,
      cliente_nome: isNew ? '' : clientName,
      nome: isNew ? '' : clientName,
      empresa: botProfile?.company_name || 'Talvane Barber',
      bot_nome: botProfile?.name || 'Talvane Barber Bot',
    };

    setVariables(initialVars);
    setIsConfiguring(false);
    startFlow(botProfile, initialVars);
  };

  const startFlow = (profile?: BotProfile | null, initialVars?: Record<string, any>) => {
    setMessages([]);
    const triggerNode = nodes.find((n) => (n.data?.nodeType || n.type) === 'trigger') || nodes[0];
    if (!triggerNode) {
      setMessages([
        {
          id: 'sys-0',
          sender: 'system',
          content: 'Nenhum nó de gatilho inicial encontrado no fluxo.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      return;
    }

    const modeLabel = initialVars?.is_novo_contato ? 'Novo Contato' : 'Cliente Já Cadastrado';
    const nameLabel = initialVars?.nome_cliente || initialVars?.whatsapp_pushname || 'Cliente';

    setMessages([
      {
        id: 'sys-start',
        sender: 'system',
        content: `▶️ Simulação iniciada: ${nameLabel} (${modeLabel})`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        nodeId: triggerNode.id,
      },
    ]);

    runNextFromNode(triggerNode.id, profile || botProfile, initialVars || variables, false);
  };

  const runNextFromNode = async (
    startNodeId: string,
    currentProfile?: BotProfile | null,
    currentVars?: Record<string, any>,
    executeStartNode = false
  ) => {
    setIsRunning(true);
    let currentId: string | undefined = startNodeId;
    let stepCount = 0;
    const activeVars = { ...variables, ...(currentVars || {}) };
    const p = currentProfile || botProfile;
    const currentServices = agendaServices.length > 0 ? agendaServices : [
      { id: 'srv-1', name: 'Corte Cabelo', duration_minutes: 45, price: 30 },
      { id: 'srv-2', name: 'Barba', duration_minutes: 20, price: 20 },
      { id: 'srv-3', name: 'Corte Cabelo + Barba (Promoção)', duration_minutes: 50, price: 45 },
      { id: 'srv-4', name: 'Sobrancelha', duration_minutes: 12, price: 10 },
      { id: 'srv-5', name: 'Corte Cabelo + Barba + Sobrancelha (Promoção)', duration_minutes: 10, price: 60 },
    ];

    let isFirstStep = executeStartNode;

    while (currentId && stepCount < 25) {
      stepCount++;
      let nextNode: FlowNode | undefined;

      if (isFirstStep) {
        nextNode = nodes.find((n) => n.id === currentId);
        isFirstStep = false;
      } else {
        const outgoing = edges.filter((e) => e.source === currentId);
        if (outgoing.length === 0) break;

        const startNode = nodes.find(n => n.id === currentId);
        const startNodeType = startNode?.data?.nodeType || startNode?.type;

        let targetEdge = outgoing[0];

        // Handle check_contact branching identically to the real WhatsApp bot
        if (startNodeType === 'check_contact') {
          const isNew = Boolean(activeVars.is_novo_contato || !activeVars.is_existing_contact);
          const targetHandle = isNew ? 'is_new' : 'is_existing';
          const branchEdge =
            outgoing.find(e => e.sourceHandle === targetHandle) ||
            outgoing.find(e => isNew 
              ? (e.sourceHandle?.includes('new') || e.sourceHandle?.includes('novo'))
              : (e.sourceHandle?.includes('exist') || e.sourceHandle?.includes('salvo') || e.sourceHandle?.includes('recorrente'))
            ) ||
            outgoing[0];
          targetEdge = branchEdge;
        }

        nextNode = nodes.find((n) => n.id === targetEdge.target);
      }

      if (!nextNode) break;

      currentId = nextNode.id;
      setCurrentNodeId(currentId);
      onHighlightNode?.(currentId);

      const type = nextNode.data?.nodeType || nextNode.type;
      const config = nextNode.data?.config || {};

      // 0. Trigger Node
      if (type === 'trigger') {
        const outgoing = edges.find(e => e.source === nextNode.id);
        if (outgoing) {
          currentId = outgoing.target;
          isFirstStep = true;
          continue;
        }
        break;
      }

      await new Promise((resolve) => setTimeout(resolve, 550));

      // 1. Message Node
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
      } 
      // 2. Buttons Node
      else if (type === 'buttons') {
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
      } 
      // 3. Question Node (Waits for input)
      else if (type === 'question') {
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
      } 
      // 4. Check Contact Node
      else if (type === 'check_contact') {
        const isNew = Boolean(activeVars.is_novo_contato || !activeVars.is_existing_contact);
        activeVars.is_primeiro_contato = isNew;
        activeVars.is_novo_contato = isNew;
        activeVars.is_existing_contact = !isNew;
        activeVars.tipo_cliente = isNew ? 'novo' : 'recorrente';

        const targetHandle = isNew ? 'is_new' : 'is_existing';
        const branchEdge =
          edges.find((e) => e.source === nextNode.id && e.sourceHandle === targetHandle) ||
          edges.find((e) => e.source === nextNode.id && (isNew 
            ? (e.sourceHandle?.includes('new') || e.sourceHandle?.includes('novo')) 
            : (e.sourceHandle?.includes('exist') || e.sourceHandle?.includes('salvo') || e.sourceHandle?.includes('recorrente'))
          )) ||
          edges.find((e) => e.source === nextNode.id);

        if (branchEdge) {
          currentId = branchEdge.target;
          isFirstStep = true;
          continue;
        }
        break;
      }
      // 5. Variable / Set Variable Node
      else if (type === 'variable' || type === 'set_variable') {
        const assignments = config.assignments || (config.varName ? [config] : []);
        const cleanPhone = activeVars.telefone_cliente || '81999998888';
        for (const a of assignments) {
          executeVariableAssignment(a, activeVars, { id: `sim-${cleanPhone}`, name: activeVars.nome_cliente, phone: cleanPhone } as any, p || undefined);
        }
        setVariables({ ...activeVars });
        const outgoing = edges.find(e => e.source === nextNode.id);
        if (outgoing) {
          currentId = outgoing.target;
          isFirstStep = true;
          continue;
        }
        break;
      }
      // 6. Update Contact Node
      else if (type === 'update_contact') {
        const resolvedName = config.contactName
          ? (activeVars[config.contactName.replace(/[{}]/g, '').trim()] || activeVars[config.contactName] || activeVars.nome_cliente)
          : (activeVars.nome_cliente || activeVars.whatsapp_pushname || 'Cliente');
        if (resolvedName) {
          activeVars.nome_cliente = resolvedName;
          activeVars.cliente_nome = resolvedName;
          activeVars.nome = resolvedName;
        }
        if (config.customFieldKey && config.customFieldValue) {
          const fieldKey = config.customFieldKey.replace(/[{}]/g, '').trim();
          const cleanVal = config.customFieldValue.replace(/[{}]/g, '').trim();
          const finalVal = activeVars[cleanVal] || config.customFieldValue;
          activeVars[fieldKey] = finalVal;
        }
        setVariables({ ...activeVars });
        const outgoing = edges.find(e => e.source === nextNode.id);
        if (outgoing) {
          currentId = outgoing.target;
          isFirstStep = true;
          continue;
        }
        break;
      }
      // 7. Show Services Node
      else if (type === 'show_services' || (type === 'services_catalog' && config.displayFormat !== 'buttons')) {
        const header = substituteVariables(config.headerText || '💈 *Catálogo de Serviços & Preços*', activeVars, p || undefined);
        const footer = config.footerText ? `\n\n_${substituteVariables(config.footerText, activeVars, p || undefined)}_` : '';

        const serviceLines = currentServices
          .map((s, idx) => {
            const priceFormatted = Number(s.price || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            const desc = s.description ? `\n   _${s.description}_` : '';
            return `*${idx + 1}️⃣* *${s.name}*\n   💰 ${priceFormatted} • ⏱️ ${s.duration_minutes || 30} min${desc}`;
          })
          .join('\n\n');

        const fullMsg = `${header}\n\n${serviceLines}${footer}`;
        activeVars.catalogo_servicos_texto = fullMsg;
        activeVars.catalogo_servicos = fullMsg;
        setVariables((prev) => ({ ...prev, catalogo_servicos_texto: fullMsg, catalogo_servicos: fullMsg }));

        setMessages((prev) => [
          ...prev,
          {
            id: `msg-${Date.now()}-${Math.random()}`,
            sender: 'bot',
            content: fullMsg,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            nodeId: nextNode.id,
          },
        ]);
        // Continuous flow
      } 
      // 8. Select Service Node
      else if (type === 'select_service' || (type === 'services_catalog' && config.displayFormat === 'buttons')) {
        const intro = substituteVariables(config.introMessage || 'Qual serviço você deseja agendar hoje?', activeVars, p || undefined);
        const buttons = currentServices.slice(0, 3).map((s, idx) => ({
          id: `srv_${s.id || idx + 1}`,
          title: `${s.name} (R$ ${Number(s.price || 0).toFixed(0)})`,
        }));

        let content = `✂️ *Escolha o Serviço:*\n${intro}`;
        if (currentServices.length > 3) {
          const listLines = currentServices
            .map((s, idx) => `*${idx + 1}️⃣* *${s.name}* (R$ ${Number(s.price || 0).toFixed(2).replace('.', ',')})`)
            .join('\n');
          content += `\n\n${listLines}`;
        }

        setMessages((prev) => [
          ...prev,
          {
            id: `msg-${Date.now()}-${Math.random()}`,
            sender: 'bot',
            content,
            buttons,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            nodeId: nextNode.id,
          },
        ]);
        break;
      } 
      // 9. Delay Node
      else if (type === 'delay') {
        const waitSec = Math.min(Math.max(Number(config.amount || config.seconds || 1.5), 1), 3);
        await new Promise((resolve) => setTimeout(resolve, waitSec * 500));
        // Continuous flow
      } 
      // 10. Date Selection Node
      else if (type === 'select_date' || type === 'ask_date') {
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
      } 
      // 11. Time Slot Selection Node
      else if (type === 'select_time_slot' || type === 'schedule_contact') {
        const srv = activeVars.servico_selecionado || 'Corte de Cabelo';
        const dateStr = activeVars.data_agendamento || 'Hoje';
        const intro = substituteVariables(config.introMessage || 'Estes são os horários livres para agendamento. Toque no seu horário preferido:', activeVars, p || undefined);
        setMessages((prev) => [
          ...prev,
          {
            id: `msg-${Date.now()}-${Math.random()}`,
            sender: 'bot',
            content: `🕒 *Horários Livres da Agenda (${dateStr}):*\n• Serviço: *${srv}*\n\n${intro}`,
            buttons: [
              { id: 'slot_0900', title: '🕒 09:00' },
              { id: 'slot_1000', title: '🕒 10:00' },
              { id: 'slot_1400', title: '🕒 14:00' },
              { id: 'slot_1600', title: '🕒 16:00' },
            ],
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            nodeId: nextNode.id,
          },
        ]);
        break;
      } 
      // 12. Confirm Booking Node
      else if (type === 'confirm_booking') {
        const clientName = activeVars.nome_cliente || activeVars.whatsapp_pushname || 'Cliente';
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
      } 
      // 13. AI Agent Node
      else if (type === 'ai_agent') {
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
      } 
      // 14. Human Handoff Node
      else if (type === 'human_handoff') {
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
      // 15. End Flow Node
      else if (type === 'end_flow' || type === 'finish_flow' || type === 'end') {
        const finalMsg = config.message
          ? substituteVariables(config.message, activeVars, p || undefined)
          : '🏁 *Atendimento finalizado com sucesso!*';
        setMessages((prev) => [
          ...prev,
          {
            id: `msg-${Date.now()}-${Math.random()}`,
            sender: 'bot',
            content: finalMsg,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            nodeId: nextNode.id,
          },
          {
            id: `msg-end-${Date.now()}`,
            sender: 'system',
            content: '🔒 Fluxo finalizado e concluído.',
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
    const updatedVars = { ...variables };
    const activeNode = nodes.find(n => n.id === currentNodeId);
    if (activeNode && (activeNode.data?.nodeType || activeNode.type) === 'question') {
      const rawVarKey = activeNode.data?.config?.variableName || 'resposta_usuario';
      const cleanKey = rawVarKey.replace(/[{}]/g, '').trim();
      updatedVars[cleanKey] = userText;
      updatedVars[rawVarKey] = userText;
      if (cleanKey.includes('nome')) {
        updatedVars.nome_cliente = userText;
        updatedVars.cliente_nome = userText;
        updatedVars.nome = userText;
      }
      setVariables(updatedVars);
    }

    if (currentNodeId) {
      runNextFromNode(currentNodeId, undefined, updatedVars, false);
    } else {
      const trigger = nodes.find((n) => (n.data?.nodeType || n.type) === 'trigger') || nodes[0];
      if (trigger) runNextFromNode(trigger.id, undefined, updatedVars, false);
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

    const updatedVars = { ...variables };

    // Store variables based on button type
    if (btnId?.startsWith('srv_') || btnTitle.includes('R$')) {
      const srvName = btnTitle.split('(')[0].trim();
      const matched = agendaServices.find(s => s.name?.toLowerCase().trim() === srvName.toLowerCase().trim());
      const srvPrice = matched?.price ? `R$ ${Number(matched.price).toFixed(2).replace('.', ',')}` : '';
      const srvDur = matched?.duration_minutes || 30;

      updatedVars.servico_selecionado = srvName;
      updatedVars.opcao_selecionada = srvName;
      updatedVars.valor_servico = srvPrice;
      updatedVars.duracao_minutos = srvDur;
      updatedVars.duracao_servico = `${srvDur} min`;
    }
    if (btnId?.startsWith('slot_') || btnTitle.includes('🕒')) {
      const timeVal = btnTitle.replace('🕒', '').trim();
      updatedVars.horario_agendamento = timeVal;
    }
    if (btnId?.startsWith('date_')) {
      const dateVal = btnId === 'date_tomorrow' ? 'Amanhã' : 'Hoje';
      updatedVars.data_agendamento = dateVal;
    }

    setVariables(updatedVars);

    if (currentNodeId) {
      const matchingEdge =
        edges.find((e) => e.source === currentNodeId && e.sourceHandle === btnId) ||
        edges.find((e) => e.source === currentNodeId);

      if (matchingEdge) {
        const nextNode = nodes.find((n) => n.id === matchingEdge.target);
        if (nextNode) {
          runNextFromNode(matchingEdge.target, undefined, updatedVars, true);
          return;
        }
      }
      runNextFromNode(currentNodeId, undefined, updatedVars, false);
    }
  };

  const handleSelectExistingContact = (contact: Contact) => {
    setSimName(contact.name || 'Cliente Cadastrado');
    setSimPhone(contact.phone || '');
    setSimMode('existing');
  };

  return (
    <div className="fixed inset-x-4 bottom-4 sm:inset-x-auto sm:right-6 sm:bottom-6 top-16 sm:top-20 w-auto sm:w-[440px] bg-dark-900/95 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl z-50 flex flex-col overflow-hidden select-none animate-in slide-in-from-bottom-5 duration-200">
      {/* 1. SETUP / PRE-SIMULATION SCREEN */}
      {isConfiguring ? (
        <div className="flex-1 flex flex-col p-5 overflow-y-auto custom-scrollbar bg-dark-950/80">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/5">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-brand-500/20 border border-brand-500/40 flex items-center justify-center text-brand-400 shadow-inner">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  Configurar Simulação
                  <Badge variant="brand" className="text-[9px] py-0 px-1.5">WhatsApp Real</Badge>
                </h3>
                <p className="text-[11px] text-slate-400">Informe os dados antes de iniciar o teste</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleStartSimulation} className="mt-4 space-y-4 flex-1 flex flex-col">
            {/* Field: Client Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-brand-400" />
                Nome do Cliente
              </label>
              <input
                type="text"
                value={simName}
                onChange={(e) => setSimName(e.target.value)}
                placeholder="Ex: Carlos Silva ou Rogerio"
                className="w-full bg-dark-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                required
              />
            </div>

            {/* Field: WhatsApp Number */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                Número do WhatsApp
              </label>
              <input
                type="text"
                value={simPhone}
                onChange={(e) => setSimPhone(e.target.value)}
                placeholder="Ex: (81) 99613-8924 ou 81999998888"
                className="w-full bg-dark-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                required
              />
            </div>

            {/* Scenario Selection Cards */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Cenário de Atendimento:
              </label>
              <div className="grid grid-cols-1 gap-2.5">
                {/* Option 1: Novo Contato */}
                <div
                  onClick={() => setSimMode('new')}
                  className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                    simMode === 'new'
                      ? 'bg-brand-500/10 border-brand-500/50 shadow-sm ring-1 ring-brand-500/30'
                      : 'bg-dark-900/60 border-white/5 hover:border-white/15'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <UserPlus className="w-4 h-4 text-cyan-400" />
                      1. Novo Contato (1ª Mensagem)
                    </span>
                    <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                      simMode === 'new' ? 'border-brand-400 bg-brand-500' : 'border-slate-600'
                    }`}>
                      {simMode === 'new' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    Testa a rota de cadastro (<strong className="text-slate-200">is_new</strong>). O robô verifica que o contato não existe na agenda, pergunta o nome do cliente e salva o perfil.
                  </p>
                </div>

                {/* Option 2: Cliente Cadastrado */}
                <div
                  onClick={() => setSimMode('existing')}
                  className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                    simMode === 'existing'
                      ? 'bg-brand-500/10 border-brand-500/50 shadow-sm ring-1 ring-brand-500/30'
                      : 'bg-dark-900/60 border-white/5 hover:border-white/15'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4 text-emerald-400" />
                      2. Cliente Já Cadastrado na Agenda
                    </span>
                    <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                      simMode === 'existing' ? 'border-brand-400 bg-brand-500' : 'border-slate-600'
                    }`}>
                      {simMode === 'existing' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    Testa a rota recorrente (<strong className="text-slate-200">is_existing</strong>). O robô identifica o cliente pelo WhatsApp e preenche <strong className="text-slate-200">&#123;&#123;nome_cliente&#125;&#125;</strong> de imediato.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick-Pick Registered Contact (Optional) */}
            {availableContacts.length > 0 && (
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Ou preencher com cliente salvo na base:
                </label>
                <select
                  onChange={(e) => {
                    const c = availableContacts.find(item => item.id === e.target.value);
                    if (c) handleSelectExistingContact(c);
                  }}
                  defaultValue=""
                  className="w-full bg-dark-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-brand-500"
                >
                  <option value="" disabled>Selecionar cliente existente...</option>
                  {availableContacts.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.phone})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-3 border-t border-white/5 flex items-center gap-2 mt-auto">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClose}
                className="flex-1 text-xs border-white/10"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="brand"
                size="sm"
                className="flex-1 text-xs bg-emerald-600 hover:bg-emerald-500 font-semibold"
              >
                ▶️ Iniciar Simulação
              </Button>
            </div>
          </form>
        </div>
      ) : (
        /* 2. ACTIVE CHAT SIMULATION SCREEN */
        <>
          {/* Simulator Header */}
          <div className="p-3.5 border-b border-white/5 flex items-center justify-between bg-dark-950/90">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-brand-400 flex-shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-bold text-white truncate">
                    {simName || 'Cliente'}
                  </h3>
                  <Badge 
                    variant={simMode === 'new' ? 'secondary' : 'brand'} 
                    className="text-[9px] py-0 px-1.5 uppercase font-medium"
                  >
                    {simMode === 'new' ? 'Novo Contato' : 'Cadastrado'}
                  </Badge>
                </div>
                <p className="text-[10px] text-slate-400 truncate flex items-center gap-1">
                  <span>{simPhone}</span>
                  <span>•</span>
                  <span className="truncate">{flow.name}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={() => setIsConfiguring(true)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Trocar Contato / Cenário"
              >
                <SlidersHorizontal className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleStartSimulation()}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Reiniciar Conversa"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Fechar Simulador"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Message Stream */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 custom-scrollbar bg-dark-950/40">
            {messages.map((m) => {
              if (m.sender === 'system') {
                return (
                  <div key={m.id} className="text-center my-1.5">
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
                      <div className="pt-2.5 space-y-1.5">
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
              className="px-3 py-2 h-auto bg-emerald-600 hover:bg-emerald-500"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </>
      )}
    </div>
  );
};
