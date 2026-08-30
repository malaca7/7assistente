import React, { useState } from 'react';
import { 
  Sparkles, 
  Plus, 
  Brain, 
  Sliders, 
  Layers, 
  CheckCircle2, 
  BookOpen,
  MessageSquare,
  Bot
} from 'lucide-react';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input, Textarea } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../contexts/ToastContext';

export const AiAgentsPage: React.FC = () => {
  const { success } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [agents, setAgents] = useState([
    {
      id: 'agent-1',
      name: 'Especialista em Vendas SaaS',
      description: 'Qualifica leads, apresenta planos, tira dúvidas comerciais e direciona para checkout.',
      model: 'Gemini 1.5 Pro',
      temperature: 0.4,
      persona: 'Consultor de vendas experiente e empático',
      status: 'active',
      documentsCount: 4,
    },
    {
      id: 'agent-2',
      name: 'Assistente de Suporte Técnico N1',
      description: 'Responde dúvidas comuns de configuração da plataforma e resolve problemas com base no FAQ.',
      model: 'Gemini 1.5 Flash',
      temperature: 0.2,
      persona: 'Engenheiro de suporte atencioso e analítico',
      status: 'active',
      documentsCount: 8,
    }
  ]);

  const [newName, setNewName] = useState('');
  const [newPersona, setNewPersona] = useState('');
  const [newPrompt, setNewPrompt] = useState('');
  const [newModel, setNewModel] = useState('Gemini 1.5 Pro');

  const handleCreateAgent = (e: React.FormEvent) => {
    e.preventDefault();
    const newAgent = {
      id: `agent-${Date.now()}`,
      name: newName,
      description: newPersona,
      model: newModel,
      temperature: 0.4,
      persona: newPersona,
      status: 'active',
      documentsCount: 0,
    };
    setAgents([...agents, newAgent]);
    success('Agente de IA Criado', `O agente "${newName}" foi configurado com sucesso.`);
    setIsModalOpen(false);
    setNewName('');
    setNewPersona('');
    setNewPrompt('');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-display font-bold text-white tracking-tight flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            Agentes de IA & Base de Conhecimento
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Configure personas inteligentes, instruções de sistema e documentos para alimentar os nós de IA dos fluxos.
          </p>
        </div>

        <Button
          variant="brand"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => setIsModalOpen(true)}
        >
          Novo Agente de IA
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {agents.map((agent) => (
          <Card key={agent.id} hoverEffect className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white shadow-lg">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">{agent.name}</h3>
                  <span className="text-[11px] text-purple-300 font-semibold">{agent.model}</span>
                </div>
              </div>
              <Badge variant="brand" dot>
                Ativo
              </Badge>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">{agent.description}</p>

            <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                {agent.documentsCount} documentos na Base
              </span>
              <span className="text-primary-400 font-medium">Temp: {agent.temperature}</span>
            </div>
          </Card>
        ))}
      </div>

      {/* Modal create agent */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Configurar Novo Agente de IA"
        description="Defina as instruções de persona e o modelo para integrar aos fluxos do WhatsApp."
      >
        <form onSubmit={handleCreateAgent} className="space-y-4">
          <Input
            label="Nome do Agente"
            placeholder="Ex: Consultor Financeiro 7A"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            required
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-300">Modelo de Linguagem (LLM)</label>
            <select
              value={newModel}
              onChange={(e) => setNewModel(e.target.value)}
              className="w-full rounded-xl bg-dark-850 border border-slate-700/60 px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="Gemini 1.5 Pro">Google Gemini 1.5 Pro</option>
              <option value="Gemini 1.5 Flash">Google Gemini 1.5 Flash</option>
              <option value="GPT-4o">OpenAI GPT-4o</option>
              <option value="Claude 3.5 Sonnet">Claude 3.5 Sonnet</option>
            </select>
          </div>

          <Input
            label="Persona"
            placeholder="Ex: Especialista cortês em negociações e pagamentos"
            value={newPersona}
            onChange={(e) => setNewPersona(e.target.value)}
            required
          />

          <Textarea
            label="Instruções de Sistema (Prompt)"
            placeholder="Você é o 7 Assistente. Auxilie os clientes com respostas precisas..."
            value={newPrompt}
            onChange={(e) => setNewPrompt(e.target.value)}
            rows={3}
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="brand">
              Criar Agente
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
