import { Flow, FlowNode, FlowEdge, Contact, Conversation, Message, BotProfile } from '../types';
import { StorageService } from './storage';

export interface FlowExecutionContext {
  flowId: string;
  contact: Contact;
  conversation: Conversation;
  variables: Record<string, any>;
  currentNodeId: string | null;
  history: string[];
  waitingForInput?: {
    nodeId: string;
    variableName: string;
    expectedType?: string;
  };
}

export interface FlowExecutionResult {
  replies: Array<{
    type: 'text' | 'buttons' | 'media';
    content: string;
    buttons?: Array<{ id: string; title: string }>;
    mediaUrl?: string;
  }>;
  handoffToHuman?: boolean;
  ended?: boolean;
  nextContext: FlowExecutionContext;
}

// Replace global {{variables}} in text strings
export function substituteVariables(
  text: string,
  variables: Record<string, any>,
  botProfile?: Partial<BotProfile>
): string {
  if (!text) return '';

  let result = text;

  // Bot variables
  if (botProfile) {
    result = result.replace(/\{\{bot_nome\}\}/gi, botProfile.name || '7 Assistente');
    result = result.replace(/\{\{empresa\}\}/gi, botProfile.company_name || 'Minha Empresa');
    result = result.replace(/\{\{bot_genero\}\}/gi, botProfile.gender === 'female' ? 'Feminino' : 'Masculino');
    result = result.replace(/\{\{bot_tom\}\}/gi, botProfile.tone || 'Amigável');
    result = result.replace(/\{\{suporte_email\}\}/gi, botProfile.support_email || 'suporte@empresa.com');
    result = result.replace(/\{\{suporte_telefone\}\}/gi, botProfile.support_phone || '+55 (81) 99613-8924');
    result = result.replace(/\{\{horario_atendimento\}\}/gi, botProfile.business_hours || '08h às 18h');
    result = result.replace(/\{\{site_empresa\}\}/gi, botProfile.website_url || 'https://7assistente.com.br');
    result = result.replace(/\{\{mensagem_boas_vindas\}\}/gi, botProfile.welcome_message || '');
  }

  // Dynamic context variables
  Object.keys(variables).forEach((key) => {
    const val = variables[key];
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'gi');
    result = result.replace(regex, String(val ?? ''));
  });

  return result;
}

// Intelligent AI fallback response generator (when AI Agent node is executed)
export async function executeAiNode(
  systemPrompt: string,
  userMessage: string,
  persona: string,
  variables: Record<string, any>
): Promise<string> {
  const cleanMessage = userMessage.toLowerCase().trim();

  if (cleanMessage.includes('preço') || cleanMessage.includes('valor') || cleanMessage.includes('plano')) {
    return `Nossos planos do 7 Assistente começam a partir de R$ 97/mês com fluxos ilimitados, WhatsApp conectado e suporte completo! Posso te enviar o link para contratação?`;
  }

  if (cleanMessage.includes('atendente') || cleanMessage.includes('humano') || cleanMessage.includes('falar com')) {
    return `Com certeza! Já estou transferindo seu atendimento para nossa equipe humana. Um instante por favor.`;
  }

  if (cleanMessage.includes('horário') || cleanMessage.includes('funciona')) {
    return `Nosso atendimento humano funciona de segunda a sexta, das 08h às 18h. Já nossos robôs inteligentes e fluxos atendem 24 horas por dia, 7 dias por semana!`;
  }

  // General helpful response with persona context
  return `Olá! Sou o assistente virtual da ${variables.empresa || 'nossa empresa'}. Entendi sua dúvida sobre "${userMessage}". Como posso te ajudar a avançar hoje? Escolha uma das opções ou me diga o que procura!`;
}

// Flow Engine
export const FlowEngine = {
  // Execute a flow from a given input
  async processIncomingMessage(
    incomingText: string,
    contact: Contact,
    conversation: Conversation
  ): Promise<FlowExecutionResult> {
    const flows = await StorageService.getFlows();
    const publishedFlow = flows.find((f) => f.status === 'published') || flows[0];

    const botProfile = await StorageService.getBotProfile();
    const globalVars = await StorageService.getBotVariables();

    const variables: Record<string, any> = {
      ...globalVars,
      nome_cliente: contact.name || 'Cliente',
      telefone_cliente: contact.phone,
      mensagem_recebida: incomingText,
    };

    if (!publishedFlow) {
      return {
        replies: [
          {
            type: 'text',
            content: `Olá! Sou ${botProfile.name || '7 Assistente'}. Recebi sua mensagem: "${incomingText}". Como posso te ajudar hoje?`,
          },
        ],
        nextContext: {
          flowId: 'none',
          contact,
          conversation,
          variables,
          currentNodeId: null,
          history: [],
        },
      };
    }

    const nodes = await StorageService.getFlowNodes(publishedFlow.id);
    const edges = await StorageService.getFlowEdges(publishedFlow.id);

    // Find starting trigger node
    const triggerNode = nodes.find((n) => n.type === 'trigger') || nodes[0];
    if (!triggerNode) {
      return {
        replies: [{ type: 'text', content: 'Fluxo sem nó de gatilho configurado.' }],
        nextContext: { flowId: publishedFlow.id, contact, conversation, variables, currentNodeId: null, history: [] },
      };
    }

    const replies: FlowExecutionResult['replies'] = [];
    let handoffToHuman = false;
    let currentNode: FlowNode | undefined = triggerNode;
    const history: string[] = [triggerNode.id];
    let maxSteps = 10; // Prevent infinite loops

    while (currentNode && maxSteps > 0) {
      maxSteps--;
      const nodeType = currentNode.data.nodeType || currentNode.type;
      const config = currentNode.data.config || {};

      // 1. Message Node
      if (nodeType === 'message') {
        const text = substituteVariables(config.text || 'Olá!', variables, botProfile);
        replies.push({ type: 'text', content: text });
      }

      // 2. Buttons Node
      else if (nodeType === 'buttons') {
        const body = substituteVariables(config.bodyText || 'Escolha uma opção:', variables, botProfile);
        replies.push({
          type: 'buttons',
          content: body,
          buttons: config.buttons || [
            { id: 'btn_1', title: 'Opção 1' },
            { id: 'btn_2', title: 'Falar com Atendente' },
          ],
        });
      }

      // 3. Question Node
      else if (nodeType === 'question') {
        const qText = substituteVariables(config.questionText || 'Por favor, informe seu dado:', variables, botProfile);
        replies.push({ type: 'text', content: qText });
      }

      // 4. Media Node
      else if (nodeType === 'media') {
        replies.push({
          type: 'media',
          content: config.caption || 'Mídia enviada',
          mediaUrl: config.mediaUrl || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400',
        });
      }

      // 5. AI Agent Node
      else if (nodeType === 'ai_agent') {
        const aiResponse = await executeAiNode(
          config.systemPrompt || 'Você é um assistente especialista.',
          incomingText,
          config.persona || 'Assistente',
          variables
        );
        replies.push({ type: 'text', content: aiResponse });
      }

      // 6. Human Handoff Node
      else if (nodeType === 'human_handoff') {
        handoffToHuman = true;
        replies.push({
          type: 'text',
          content: config.notifyMessage || 'Transferindo você para um atendente humano...',
        });
      }

      // 7. Schedule Contact Node
      else if (nodeType === 'schedule_contact') {
        const srvName = config.serviceName || 'Atendimento Geral';
        const dateVal = variables[config.dateVariable] || 'Hoje';
        const timeVal = variables[config.timeVariable] || 'Horário Comercial';
        const defaultConfirm = `📅 Agendamento Confirmado!\n• Serviço: ${srvName}\n• Data: ${dateVal}\n• Horário: ${timeVal}\n\nVinculado com sucesso ao WhatsApp!`;
        const confirmText = substituteVariables(config.confirmMessage || defaultConfirm, variables, botProfile);
        replies.push({ type: 'text', content: confirmText });
      }

      // 8. Update Contact Profile Node
      else if (nodeType === 'update_contact') {
        if (config.contactName && variables[config.contactName]) {
          variables.nome_cliente = variables[config.contactName];
        }
        if (config.customFieldKey) {
          variables[config.customFieldKey] = variables[config.customFieldValue] || config.customFieldValue;
        }
      }

      // 9. Variable Setter Node
      else if (nodeType === 'variable') {
        if (config.varName) {
          variables[config.varName] = config.varValue;
        }
      }

      // Find next connected node
      const outgoingEdge = edges.find((e) => e.source === currentNode?.id);
      if (outgoingEdge) {
        const nextNode = nodes.find((n) => n.id === outgoingEdge.target);
        if (nextNode) {
          history.push(nextNode.id);
          currentNode = nextNode;
          continue;
        }
      }

      // If no outgoing edge, stop
      break;
    }

    return {
      replies: replies.length > 0 ? replies : [{ type: 'text', content: 'Mensagem processada pelo fluxo.' }],
      handoffToHuman,
      ended: true,
      nextContext: {
        flowId: publishedFlow.id,
        contact,
        conversation,
        variables,
        currentNodeId: currentNode?.id || null,
        history,
      },
    };
  },
};
