import React, { useState, useEffect } from 'react';
import { 
  Save, 
  Play, 
  Pause, 
  ArrowLeft, 
  RotateCcw, 
  RotateCw, 
  CheckCircle2, 
  AlertCircle,
  Keyboard,
  Settings,
  Clock,
  Sparkles,
  GitCommit,
  Check,
  ChevronDown,
  Smartphone,
  List,
  Maximize2,
  Minimize2,
  Braces
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Flow } from '../../types';

export interface FlowToolbarProps {
  flow: Flow;
  onBack: () => void;
  onSave: () => void;
  onToggleStatus: () => void;
  onTestFlow?: () => void;
  onSwitchToMobileMode?: () => void;
  onOpenVariables?: () => void;
  isSaving: boolean;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  isValid: boolean;
  validationError?: string | null;
  isConnectedWhatsApp?: boolean;
  autoSaveMode: 'instant' | 'interval' | 'manual';
  autoSaveIntervalSec: number;
  onUpdateAutoSaveConfig: (mode: 'instant' | 'interval' | 'manual', interval: number) => void;
  lastSavedTime?: Date | null;
  isDirty?: boolean;
  edgeType: 'smoothstep' | 'default' | 'straight' | 'step';
  onChangeEdgeType: (type: 'smoothstep' | 'default' | 'straight' | 'step') => void;
  onOpenShortcuts: () => void;
  onAutoLayout?: () => void;
}

export const FlowToolbar: React.FC<FlowToolbarProps> = ({
  flow,
  onBack,
  onSave,
  onToggleStatus,
  onTestFlow,
  onSwitchToMobileMode,
  onOpenVariables,
  isSaving,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  isValid,
  validationError,
  isConnectedWhatsApp = true,
  autoSaveMode,
  autoSaveIntervalSec,
  onUpdateAutoSaveConfig,
  lastSavedTime,
  isDirty,
  edgeType,
  onChangeEdgeType,
  onOpenShortcuts,
  onAutoLayout,
}) => {
  const [isAutoSaveMenuOpen, setIsAutoSaveMenuOpen] = useState(false);
  const [isLinesMenuOpen, setIsLinesMenuOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const isPublished = flow.status === 'published';

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  const formattedSavedTime = lastSavedTime
    ? new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(lastSavedTime)
    : null;

  return (
    <div className="h-16 bg-dark-900 border-b border-white/5 px-4 flex items-center justify-between z-20 flex-shrink-0 relative">
      {/* Left: Back button + Flow Name + Status */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-dark-850 border border-white/10 hover:border-white/20 text-slate-300 hover:text-white transition-all text-xs font-semibold shadow-sm"
          title="Sair do Studio e voltar para a Lista de Fluxos"
        >
          <ArrowLeft className="w-4 h-4 text-slate-400 group-hover:text-white" />
          <span>Sair do Studio</span>
        </button>

        <div className="hidden sm:block">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-white tracking-tight">{flow.name}</h2>
            <Badge
              variant={isPublished ? 'brand' : flow.status === 'paused' ? 'warning' : 'neutral'}
              dot
            >
              {isPublished ? 'Publicado (Ativo)' : flow.status === 'paused' ? 'Pausado' : 'Rascunho'}
            </Badge>
          </div>
          <p className="text-[11px] text-slate-400">Versão {flow.version || 1} • Studio Visual Tela Cheia</p>
        </div>
      </div>

      {/* Center: Live Auto-save & Validation status */}
      <div className="hidden md:flex items-center gap-3">
        {/* Auto-save Status Indicator with Real-Time Feedback */}
        <div className="relative">
          <button
            onClick={() => setIsAutoSaveMenuOpen(!isAutoSaveMenuOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-dark-850/90 border border-white/10 hover:border-white/20 text-xs transition-colors shadow-sm"
            title="Clique para alterar modo de salvamento automático"
          >
            {isSaving ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-brand-300 font-bold">Salvando alterações...</span>
              </>
            ) : isDirty ? (
              <>
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-amber-300 font-semibold">Gravando em tempo real...</span>
              </>
            ) : (
              <>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-500/50" />
                <span className="text-emerald-300 font-bold">Auto-salve Ativo</span>
                {formattedSavedTime && (
                  <span className="text-slate-400 text-[11px] font-mono hidden lg:inline">
                    ({formattedSavedTime})
                  </span>
                )}
              </>
            )}
            <ChevronDown className="w-3 h-3 text-slate-400 ml-0.5" />
          </button>

          {/* Auto-save Options Dropdown */}
          {isAutoSaveMenuOpen && (
            <div className="absolute top-full mt-2 left-0 w-64 p-3 rounded-2xl bg-dark-900 border border-white/10 shadow-2xl space-y-2 z-50 animate-in fade-in">
              <span className="text-[11px] font-bold text-white uppercase tracking-wider block">
                Configurações de Salvamento
              </span>

              <div className="space-y-1">
                <button
                  onClick={() => {
                    onUpdateAutoSaveConfig('instant', 30);
                    setIsAutoSaveMenuOpen(false);
                  }}
                  className={`w-full p-2 rounded-xl text-left text-xs flex items-center justify-between transition-colors ${
                    autoSaveMode === 'instant'
                      ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30'
                      : 'text-slate-300 hover:bg-dark-850'
                  }`}
                >
                  <div>
                    <p className="font-bold">A Cada Alteração (Tempo Real)</p>
                    <p className="text-[10px] text-slate-400">Salva instantaneamente ao mover ou editar nós</p>
                  </div>
                  {autoSaveMode === 'instant' && <Check className="w-4 h-4 text-brand-400 flex-shrink-0" />}
                </button>

                <button
                  onClick={() => {
                    onUpdateAutoSaveConfig('interval', 30);
                    setIsAutoSaveMenuOpen(false);
                  }}
                  className={`w-full p-2 rounded-xl text-left text-xs flex items-center justify-between transition-colors ${
                    autoSaveMode === 'interval'
                      ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30'
                      : 'text-slate-300 hover:bg-dark-850'
                  }`}
                >
                  <div>
                    <p className="font-bold">Por Intervalo (A cada 30s)</p>
                    <p className="text-[10px] text-slate-400">Salva periodicamente no segundo plano</p>
                  </div>
                  {autoSaveMode === 'interval' && <Check className="w-4 h-4 text-brand-400 flex-shrink-0" />}
                </button>

                <button
                  onClick={() => {
                    onUpdateAutoSaveConfig('manual', 0);
                    setIsAutoSaveMenuOpen(false);
                  }}
                  className={`w-full p-2 rounded-xl text-left text-xs flex items-center justify-between transition-colors ${
                    autoSaveMode === 'manual'
                      ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30'
                      : 'text-slate-300 hover:bg-dark-850'
                  }`}
                >
                  <div>
                    <p className="font-bold">Apenas Manual (Ctrl + S)</p>
                    <p className="text-[10px] text-slate-400">Salva apenas quando você clicar em Salvar</p>
                  </div>
                  {autoSaveMode === 'manual' && <Check className="w-4 h-4 text-brand-400 flex-shrink-0" />}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Validation badge */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-dark-850 border border-slate-800 text-xs">
          {isValid ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-brand-400" />
              <span className="text-slate-300">
                {isConnectedWhatsApp
                  ? 'Pronto para execução'
                  : 'Validado • Conecte o WhatsApp'}
              </span>
            </>
          ) : (
            <>
              <AlertCircle className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span className="text-amber-300">{validationError || 'Atenção nos nós'}</span>
            </>
          )}
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Style of connecting lines */}
        <div className="relative">
          <button
            onClick={() => setIsLinesMenuOpen(!isLinesMenuOpen)}
            className="px-2.5 py-1.5 rounded-xl bg-dark-850 border border-white/5 hover:border-white/15 text-xs text-slate-300 flex items-center gap-1.5 transition-colors"
            title="Estilo das Linhas de Conexão"
          >
            <GitCommit className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline font-medium capitalize">Linhas: {edgeType}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {isLinesMenuOpen && (
            <div className="absolute top-full mt-2 right-0 w-48 p-2 rounded-2xl bg-dark-900 border border-white/10 shadow-2xl space-y-1 z-50 animate-in fade-in">
              <span className="text-[10px] font-bold text-white uppercase px-2 py-1 block">
                Estilo das Linhas
              </span>
              {[
                { id: 'smoothstep', label: 'Curvas Suaves (SmoothStep)' },
                { id: 'default', label: 'Curvas Bézier' },
                { id: 'straight', label: 'Linhas Retas' },
                { id: 'step', label: 'Linhas em Ângulo Reto' },
              ].map((style) => (
                <button
                  key={style.id}
                  onClick={() => {
                    onChangeEdgeType(style.id as any);
                    setIsLinesMenuOpen(false);
                  }}
                  className={`w-full p-2 rounded-xl text-left text-xs flex items-center justify-between transition-colors ${
                    edgeType === style.id
                      ? 'bg-cyan-500/20 text-cyan-300 font-bold'
                      : 'text-slate-300 hover:bg-dark-850'
                  }`}
                >
                  <span>{style.label}</span>
                  {edgeType === style.id && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Switch to Mobile Step Mode Button */}
        {onSwitchToMobileMode && (
          <button
            onClick={onSwitchToMobileMode}
            className="p-2 rounded-xl bg-dark-850 border border-brand-500/20 hover:border-brand-500/50 text-brand-300 hover:text-brand-200 transition-colors flex items-center gap-1.5 text-xs shadow-sm"
            title="Alternar para Modo Lista Passo a Passo (Otimizado para Celular / Mobile)"
          >
            <Smartphone className="w-4 h-4 text-brand-400" />
            <span className="hidden lg:inline font-medium">Modo Lista</span>
          </button>
        )}

        {/* Auto-Organize Flow Button - Destaque Visual Máximo */}
        {onAutoLayout && (
          <button
            type="button"
            onClick={onAutoLayout}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600/30 to-teal-600/30 hover:from-emerald-500/40 hover:to-teal-500/40 border border-emerald-500/40 hover:border-emerald-400 text-emerald-300 hover:text-emerald-100 transition-all flex items-center gap-1.5 text-xs font-bold shadow-sm active:scale-95"
            title="Auto-Organizar nós e conexões de cima para baixo sem sobreposição (Atalho: Alt+O)"
          >
            <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span className="hidden sm:inline font-bold">Auto-Organizar</span>
            <span className="hidden xl:inline text-[9.5px] font-mono px-1 py-0.2 rounded bg-dark-900/80 text-emerald-400 border border-emerald-500/30">Alt+O</span>
          </button>
        )}

        {/* Dicionário de Variáveis do Sistema & Fluxo */}
        {onOpenVariables && (
          <button
            type="button"
            onClick={onOpenVariables}
            className="px-3 py-1.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-300 hover:text-purple-100 transition-all flex items-center gap-1.5 text-xs font-bold shadow-sm active:scale-95"
            title="Abrir painel popup com todas as variáveis do sistema e deste fluxo"
          >
            <Braces className="w-4 h-4 text-purple-400" />
            <span className="hidden sm:inline font-bold">Variáveis</span>
          </button>
        )}

        {/* Fullscreen Toggle Button */}
        <button
          onClick={handleToggleFullscreen}
          className="p-2 rounded-xl bg-dark-850 border border-white/5 hover:border-white/20 text-slate-300 hover:text-white transition-colors flex items-center gap-1.5 text-xs"
          title={isFullscreen ? "Sair da Tela Cheia do Navegador" : "Expandir em Tela Cheia Nativa"}
        >
          {isFullscreen ? (
            <>
              <Minimize2 className="w-4 h-4 text-cyan-400" />
              <span className="hidden xl:inline font-medium">Restaurar</span>
            </>
          ) : (
            <>
              <Maximize2 className="w-4 h-4 text-cyan-400" />
              <span className="hidden xl:inline font-medium">Tela Cheia</span>
            </>
          )}
        </button>

        {/* Keyboard Shortcuts Button */}
        <button
          onClick={onOpenShortcuts}
          className="p-2 rounded-xl bg-dark-850 border border-white/5 hover:border-white/15 text-slate-300 hover:text-white transition-colors flex items-center gap-1 text-xs"
          title="Ver Atalhos de Teclado (F1 ou ?)"
        >
          <Keyboard className="w-4 h-4 text-brand-400" />
          <span className="hidden md:inline font-medium">Atalhos</span>
        </button>

        {/* Undo / Redo */}
        <div className="hidden sm:flex items-center gap-1 pr-2 border-r border-white/5">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
            title="Desfazer (Ctrl+Z)"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
            title="Refazer (Ctrl+Y)"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>

        {/* Test Simulator */}
        {onTestFlow && (
          <Button
            size="sm"
            variant="secondary"
            leftIcon={<Play className="w-3.5 h-3.5 text-brand-400" />}
            onClick={onTestFlow}
          >
            Testar
          </Button>
        )}

        {/* Save Flow */}
        <Button
          size="sm"
          variant={isDirty ? 'primary' : 'outline'}
          leftIcon={!isDirty ? <Check className="w-4 h-4 text-emerald-400" /> : <Save className="w-4 h-4" />}
          isLoading={isSaving}
          disabled={!isDirty || isSaving}
          onClick={onSave}
          title={isDirty ? 'Salvar Alterações (Ctrl+S)' : 'Nenhuma alteração pendente (Tudo Salvo)'}
          className={!isDirty ? 'opacity-50 cursor-not-allowed border-white/5 text-slate-400 hover:bg-transparent hover:text-slate-400' : 'border-primary-500/60 shadow-sm shadow-primary-500/20'}
        >
          {isDirty ? 'Salvar' : 'Salvo'}
        </Button>

        {/* Publish / Activate Toggle */}
        <Button
          size="sm"
          variant={isPublished ? 'secondary' : isConnectedWhatsApp ? 'brand' : 'outline'}
          leftIcon={isPublished ? <Pause className="w-4 h-4 text-amber-400" /> : <Play className="w-4 h-4" />}
          onClick={onToggleStatus}
        >
          {isPublished ? 'Pausar' : 'Publicar'}
        </Button>
      </div>
    </div>
  );
};
