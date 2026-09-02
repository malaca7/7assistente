import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Bot, 
  Cpu, 
  Sliders, 
  Save, 
  Play, 
  MessageSquare, 
  ShieldCheck, 
  Check, 
  Copy, 
  Zap, 
  RotateCcw,
  BookOpen,
  CheckCircle2,
  Layers
} from 'lucide-react';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input, Textarea } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { useToast } from '../../contexts/ToastContext';
import { executeAiNode } from '../../lib/flowEngine';
import { StorageService } from '../../lib/storage';

export const AiAgentsPage: React.FC = () => {
  const { success, error: toastError } = useToast();
  const [model, setModel] = useState('gemini-1.5-pro');
  const [temperature, setTemperature] = useState(0.4);
  const [personaName, setPersonaName] = useState('Sofia — Consultora Comercial');
  const [systemPrompt, setSystemPrompt] = useState(
    `Você é a Sofia, consultora virtual especialista do 7 Assistente. Seu objetivo é atender clientes no WhatsApp de forma amigável, clara e objetiva, esclarecendo dúvidas sobre automação de WhatsApp, planos e transferindo para atendentes humanos quando solicitado.`
  );
  const [knowledgeBase, setKnowledgeBase] = useState(
    `• Produto: 7 Assistente — Plataforma SaaS de Chatbot & Automação para WhatsApp\n• Planos: Start (R$ 97/mês), Pro (R$ 197/mês), Enterprise (R$ 397/mês)\n• Suporte: Segunda a Sexta das 08h às 18h\n• Diferenciais: Construtor visual estilo n8n, IA integrada, Conexão WhatsApp por QR Code direta.`
  );

  // Live Test Playground
  const [testInput, setTestInput] = useState('');
  const [testOutput, setTestOutput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      const settings = await StorageService.getSettings();
      if (settings.bot_profile) {
        setPersonaName(settings.bot_profile.name ? `${settings.bot_profile.name} — Atendente Inteligente` : 'Sofia — Consultora Comercial');
      }
    }
    loadSettings();
  }, []);

  const templates = [
    {
      name: 'Sofia — Vendas & Qualificação',
      prompt: 'Você é a Sofia, especialista comercial focada em entender as necessidades do cliente, qualificar leads e apresentar soluções de forma persuasiva e acolhedora.',
      kb: '• Foco: Apresentar planos e tirar dúvidas sobre implantação.\n• Benefício principal: Aumentar vendas no WhatsApp em até 3x no primeiro mês.',
    },
    {
      name: 'Lucas — Suporte Técnico & SAC',
      prompt: 'Você é o Lucas, analista de suporte técnico. Seu tom é paciente, claro e instrutivo, resolvendo problemas rápidos e transferindo chamados complexos para o time humano.',
      kb: '• Horário de atendimento humano: Segunda a Sexta das 08h às 18h.\n• Dúvidas comuns: Configuração de QR Code, sincronização de contatos e criação de fluxos.',
    },
    {
      name: 'Dra. Camila — Agendamentos & Clínicas',
      prompt: 'Você é a Dra. Camila, assistente virtual de agendamentos para consultórios. Seja muito atenciosa, cordial e organizada para coletar dia e horário de preferência.',
      kb: '• Especialidades: Consultas gerais, retornos e procedimentos.\n• Política: Confirmação com 24h de antecedência.',
    },
  ];

  const handleApplyTemplate = (tmpl: typeof templates[0]) => {
    setPersonaName(tmpl.name);
    setSystemPrompt(tmpl.prompt);
    setKnowledgeBase(tmpl.kb);
    success('Modelo Aplicado', `As diretrizes de "${tmpl.name}" foram carregadas.`);
  };

  const handleTestAi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testInput.trim()) return;
    setIsGenerating(true);
    try {
      const resp = await executeAiNode(
        `${systemPrompt}\n\nBase de Conhecimento:\n${knowledgeBase}`,
        testInput,
        personaName,
        { empresa: '7 Assistente Tech' }
      );
      setTestOutput(resp);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveConfig = async () => {
    setIsSaving(true);
    try {
      await StorageService.updateSettings({
        ai_enabled: true,
        ai_model: model,
        ai_temperature: temperature,
        ai_system_prompt: systemPrompt,
      });

      // Sync to live WhatsApp server
      await fetch('http://localhost:3001/api/whatsapp/sync-flows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          botProfile: {
            name: personaName.split('—')[0].trim(),
            system_prompt: systemPrompt,
            knowledge_base: knowledgeBase,
          },
        }),
      }).catch((e) => console.warn('Sync warning:', e));

      success('Configuração de IA Salva', 'O Agente de IA está atualizado para todos os nós dos fluxos e WhatsApp.');
    } catch (err: any) {
      toastError('Erro ao salvar', err.message || 'Falha ao gravar configurações.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto animate-in fade-in duration-300 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-display font-bold text-white tracking-tight flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-brand-400" />
            Agentes de Inteligência Artificial
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Configure personas inteligentes, instruções de sistema (prompts) e base de conhecimento para seus robôs.
          </p>
        </div>

        <Badge variant="brand" dot>
          Motor Gemini & OpenAI Ativo
        </Badge>
      </div>

      {/* Pre-made Templates Bar */}
      <div className="p-4 rounded-3xl bg-dark-900 border border-white/5 shadow-xl space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-white">
          <Layers className="w-4 h-4 text-brand-400" />
          <span>Modelos Prontos de Personas (Templates):</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {templates.map((tmpl, idx) => (
            <div
              key={idx}
              onClick={() => handleApplyTemplate(tmpl)}
              className="p-3 rounded-2xl bg-dark-850 hover:bg-dark-800 border border-white/5 hover:border-brand-500/40 cursor-pointer transition-all space-y-1 group shadow-sm"
            >
              <p className="text-xs font-bold text-white group-hover:text-brand-300 transition-colors">
                {tmpl.name}
              </p>
              <p className="text-[11px] text-slate-400 line-clamp-2 leading-tight">
                {tmpl.prompt}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: AI Configuration (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-brand-400">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <CardTitle className="text-base">Persona & Diretrizes do Agente</CardTitle>
                  <p className="text-xs text-slate-400">Como o robô deve pensar e se comunicar no WhatsApp</p>
                </div>
              </div>
            </CardHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Nome da Persona"
                  value={personaName}
                  onChange={(e) => setPersonaName(e.target.value)}
                  placeholder="Ex: Sofia — Especialista Comercial"
                />

                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-slate-300">Modelo de Linguagem (LLM)</label>
                  <select
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="w-full rounded-xl bg-dark-850 border border-slate-700/60 px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
                  >
                    <option value="gemini-1.5-pro">Google Gemini 1.5 Pro (Ultra Rápido & Preciso)</option>
                    <option value="gemini-1.5-flash">Google Gemini 1.5 Flash (Menor Latência)</option>
                    <option value="gpt-4o">OpenAI GPT-4o Omni</option>
                  </select>
                </div>
              </div>

              {/* Temperature Slider */}
              <div className="space-y-2 p-3.5 rounded-2xl bg-dark-850 border border-white/5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-medium">Temperatura / Criatividade</span>
                  <span className="font-mono text-brand-400 font-bold">{temperature}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full accent-brand-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>0.0 (Exato & Direto)</span>
                  <span>1.0 (Muito Criativo)</span>
                </div>
              </div>

              {/* System Prompt */}
              <Textarea
                label="Prompt de Sistema (Instruções Principais)"
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                rows={5}
                hint="Diretrizes fixas que o robô sempre seguirá em todas as conversas."
              />

              {/* Knowledge Base */}
              <Textarea
                label="Base de Conhecimento da Empresa (RAG / Contexto)"
                value={knowledgeBase}
                onChange={(e) => setKnowledgeBase(e.target.value)}
                rows={4}
                hint="Informações, tabelas de preços, regras de negócio e diferenciais."
              />

              <div className="flex justify-end pt-2">
                <Button
                  variant="brand"
                  leftIcon={<Save className="w-4 h-4" />}
                  isLoading={isSaving}
                  onClick={handleSaveConfig}
                >
                  Salvar Configuração do Agente
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Live Interactive Playground (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="border-brand-500/30 bg-dark-900 shadow-2xl">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-brand-400" />
                <CardTitle className="text-sm">Testar Respostas da IA em Tempo Real</CardTitle>
              </div>
            </CardHeader>

            <div className="space-y-4">
              <form onSubmit={handleTestAi} className="space-y-3">
                <Input
                  label="Mensagem do Cliente (Teste)"
                  placeholder="Ex: Quais são os valores dos planos?"
                  value={testInput}
                  onChange={(e) => setTestInput(e.target.value)}
                />
                <Button
                  type="submit"
                  variant="brand"
                  size="sm"
                  className="w-full"
                  isLoading={isGenerating}
                  leftIcon={<Play className="w-3.5 h-3.5" />}
                >
                  Gerar Resposta com o Agente
                </Button>
              </form>

              {/* Result Preview Box */}
              {testOutput && (
                <div className="p-4 rounded-2xl bg-dark-950 border border-brand-500/30 space-y-2 animate-in fade-in">
                  <div className="flex items-center justify-between text-[11px] text-brand-400 font-semibold">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      Resposta da {personaName}:
                    </span>
                    <Badge variant="brand">OK</Badge>
                  </div>
                  <div className="p-3 rounded-xl bg-[#005c4b] text-white text-xs leading-relaxed whitespace-pre-wrap shadow-md">
                    {testOutput}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
