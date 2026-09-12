import React from 'react';
import { 
  X, 
  Palette, 
  Sun, 
  Contrast, 
  RotateCcw, 
  Check, 
  Sparkles, 
  Moon, 
  Sliders, 
  ShieldCheck,
  Zap,
  Eye
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { THEME_OPTIONS, ACCENT_OPTIONS, ThemeMode, AccentColor } from '../../types/theme';

export const ThemeSettingsModal: React.FC = () => {
  const {
    isThemeModalOpen,
    closeThemeModal,
    themeMode,
    brightness,
    contrast,
    accentColor,
    ultraDark,
    setThemeMode,
    setBrightness,
    setContrast,
    setAccentColor,
    setUltraDark,
    resetTheme,
    currentUserIdentifier,
  } = useTheme();

  if (!isThemeModalOpen) return null;

  const darkThemes = THEME_OPTIONS.filter(t => t.category === 'dark');
  const lightThemes = THEME_OPTIONS.filter(t => t.category === 'light');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 animate-fade-in">
      {/* Backdrop */}
      <div 
        onClick={closeThemeModal}
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-[#0c0c0e] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-10 text-zinc-100">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-white/[0.04] to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/10 border border-white/15 text-white shadow-inner">
              <Palette className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Personalização Visual do Painel
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-white/10 text-zinc-300 border border-white/10">
                  Ao Vivo
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Preferências exclusivas de <span className="font-semibold text-white">@{currentUserIdentifier}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={resetTheme}
              title="Restaurar valores padrão"
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors flex items-center gap-1.5 text-xs px-2.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Padrão</span>
            </button>
            <button
              onClick={closeThemeModal}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          
          {/* Seção 1: Temas Escuros (3 Opções) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                <Moon className="w-3.5 h-3.5 text-indigo-400" />
                3 Opções de Tema Escuro
              </label>
              <span className="text-[11px] text-zinc-500">Imersão & economia de tela</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {darkThemes.map(theme => {
                const isSelected = themeMode === theme.id;
                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => setThemeMode(theme.id)}
                    className={`relative text-left p-3 rounded-xl border transition-all flex flex-col justify-between group ${
                      isSelected
                        ? 'border-white bg-white/10 shadow-lg ring-1 ring-white/30'
                        : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/20'
                    }`}
                  >
                    {/* Miniatura Ilustrativa do Tema */}
                    <div 
                      className="w-full h-16 rounded-lg p-1.5 mb-2.5 flex gap-1.5 border overflow-hidden relative"
                      style={{ backgroundColor: theme.bgHex, borderColor: theme.borderHex }}
                    >
                      {/* Mini sidebar */}
                      <div 
                        className="w-1/4 h-full rounded-md border flex flex-col gap-1 p-1"
                        style={{ backgroundColor: theme.cardHex, borderColor: theme.borderHex }}
                      >
                        <div className="w-full h-1.5 rounded-full bg-white/30" />
                        <div className="w-3/4 h-1 rounded-full bg-white/20" />
                        <div className="w-2/3 h-1 rounded-full bg-white/20" />
                      </div>
                      {/* Mini content */}
                      <div className="flex-1 h-full flex flex-col gap-1">
                        <div 
                          className="w-full h-3 rounded border px-1 flex items-center justify-between"
                          style={{ backgroundColor: theme.cardHex, borderColor: theme.borderHex }}
                        >
                          <div className="w-1/2 h-1 rounded-full bg-white/40" />
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: theme.textHex }} />
                        </div>
                        <div className="grid grid-cols-2 gap-1 flex-1">
                          <div 
                            className="rounded border" 
                            style={{ backgroundColor: theme.cardHex, borderColor: theme.borderHex }}
                          />
                          <div 
                            className="rounded border" 
                            style={{ backgroundColor: theme.cardHex, borderColor: theme.borderHex }}
                          />
                        </div>
                      </div>

                      {isSelected && (
                        <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-white text-black flex items-center justify-center shadow-md">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-xs font-bold text-white leading-tight">
                          {theme.name}
                        </span>
                        <span className="text-[9px] font-medium px-1.5 py-0.2 rounded bg-white/10 text-zinc-300">
                          {theme.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 leading-snug line-clamp-2">
                        {theme.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Seção 2: Temas Claros (2 Opções) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                2 Opções de Tema Claro
              </label>
              <span className="text-[11px] text-zinc-500">Visibilidade diurna e clareza</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {lightThemes.map(theme => {
                const isSelected = themeMode === theme.id;
                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => setThemeMode(theme.id)}
                    className={`relative text-left p-3 rounded-xl border transition-all flex flex-col justify-between group ${
                      isSelected
                        ? 'border-white bg-white/10 shadow-lg ring-1 ring-white/30'
                        : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/20'
                    }`}
                  >
                    {/* Miniatura Ilustrativa */}
                    <div 
                      className="w-full h-16 rounded-lg p-1.5 mb-2.5 flex gap-1.5 border overflow-hidden relative shadow-inner"
                      style={{ backgroundColor: theme.bgHex, borderColor: theme.borderHex }}
                    >
                      {/* Mini sidebar */}
                      <div 
                        className="w-1/4 h-full rounded-md border flex flex-col gap-1 p-1"
                        style={{ backgroundColor: theme.cardHex, borderColor: theme.borderHex }}
                      >
                        <div className="w-full h-1.5 rounded-full bg-slate-900/40" />
                        <div className="w-3/4 h-1 rounded-full bg-slate-900/20" />
                        <div className="w-2/3 h-1 rounded-full bg-slate-900/20" />
                      </div>
                      {/* Mini content */}
                      <div className="flex-1 h-full flex flex-col gap-1">
                        <div 
                          className="w-full h-3 rounded border px-1 flex items-center justify-between shadow-sm"
                          style={{ backgroundColor: theme.cardHex, borderColor: theme.borderHex }}
                        >
                          <div className="w-1/2 h-1 rounded-full bg-slate-900/50" />
                          <div className="w-2 h-2 rounded-full bg-slate-800" />
                        </div>
                        <div className="grid grid-cols-2 gap-1 flex-1">
                          <div 
                            className="rounded border shadow-sm" 
                            style={{ backgroundColor: theme.cardHex, borderColor: theme.borderHex }}
                          />
                          <div 
                            className="rounded border shadow-sm" 
                            style={{ backgroundColor: theme.cardHex, borderColor: theme.borderHex }}
                          />
                        </div>
                      </div>

                      {isSelected && (
                        <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-white text-black flex items-center justify-center shadow-md">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-xs font-bold text-white leading-tight">
                          {theme.name}
                        </span>
                        <span className="text-[9px] font-medium px-1.5 py-0.2 rounded bg-white/10 text-zinc-300">
                          {theme.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 leading-snug">
                        {theme.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Seção 3: Cores de Destaque / Acentos */}
          <div className="space-y-3 pt-2 border-t border-white/10">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-pink-400" />
                Cor de Destaque (Acentos & Botões)
              </label>
              <span className="text-[11px] font-semibold text-zinc-300">
                {ACCENT_OPTIONS.find(a => a.id === accentColor)?.name}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
              {ACCENT_OPTIONS.map(acc => {
                const isSelected = accentColor === acc.id;
                return (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => setAccentColor(acc.id)}
                    className={`p-2.5 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                      isSelected
                        ? 'border-white bg-white/15 shadow-md ring-2 ring-white/40'
                        : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/20'
                    }`}
                  >
                    <div 
                      className="w-7 h-7 rounded-full flex items-center justify-center shadow-md transition-transform hover:scale-110"
                      style={{ backgroundColor: acc.hex }}
                    >
                      {isSelected && <Check className="w-4 h-4 text-white drop-shadow stroke-[3]" />}
                    </div>
                    <span className="text-[10px] font-medium text-zinc-300 text-center leading-tight">
                      {acc.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Seção 4: Modo Super Escuro & Ajuste Óptico de Brilho e Contraste */}
          <div className="space-y-4 pt-2 border-t border-white/10">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                Ajuste Óptico Avançado (Brilho & Contraste Extremo)
              </label>
              <span className="text-[11px] text-zinc-500">Controle completo de iluminação para qualquer ambiente</span>
            </div>

            {/* Banner / Opção de Modo Super Escuro Blackout */}
            <div className={`p-3.5 rounded-xl border transition-all ${
              ultraDark 
                ? 'bg-amber-500/10 border-amber-500/40 shadow-lg ring-1 ring-amber-500/30' 
                : 'bg-white/[0.02] border-white/10 hover:border-white/20'
            } flex items-center justify-between gap-3`}>
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  ultraDark 
                    ? 'bg-amber-500 text-dark-950 font-bold shadow-md' 
                    : 'bg-white/5 text-zinc-400 border border-white/5'
                }`}>
                  <Moon className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">Modo Super Escuro (Blackout Total)</span>
                    <span className={`text-[9px] px-2 py-0.2 rounded-full font-bold uppercase ${
                      ultraDark ? 'bg-amber-500/20 text-amber-300' : 'bg-white/10 text-zinc-400'
                    }`}>
                      {ultraDark ? 'Ativado' : 'Opcional'}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Força fundo 100% preto puro (#000000) e atenua brilho de painéis e bordas para máximo descanso ocular.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setUltraDark(!ultraDark)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border shrink-0 ${
                  ultraDark
                    ? 'bg-amber-500 text-dark-950 border-amber-400 shadow-md hover:bg-amber-400'
                    : 'bg-white/5 text-zinc-300 border-white/10 hover:bg-white/10 hover:text-white'
                }`}
              >
                {ultraDark ? '✓ Super Escuro Ativo' : 'Deixar Muito Mais Escuro'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white/[0.02] p-4 rounded-xl border border-white/10">
              {/* Slider de Brilho Extremo (20% a 200%) */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-300 flex items-center gap-1.5 font-medium">
                    <Sun className="w-3.5 h-3.5 text-amber-400" />
                    Brilho da Tela
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-white text-xs bg-white/10 px-2 py-0.5 rounded">
                      {brightness}%
                    </span>
                    {brightness !== 100 && (
                      <button
                        type="button"
                        onClick={() => setBrightness(100)}
                        className="text-[10px] text-zinc-400 hover:text-white underline"
                      >
                        Reset 100%
                      </button>
                    )}
                  </div>
                </div>

                <input
                  type="range"
                  min="20"
                  max="200"
                  step="1"
                  value={brightness}
                  onChange={(e) => setBrightness(Number(e.target.value))}
                  className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-white"
                />

                <div className="flex justify-between text-[9.5px] text-zinc-500 font-mono">
                  <span>20% (Mínimo)</span>
                  <span>100% (Padrão)</span>
                  <span>200% (Máximo)</span>
                </div>

                {/* Presets Rápidos de Brilho */}
                <div className="flex items-center gap-1 pt-1">
                  {[
                    { label: '25% Noturno', val: 25 },
                    { label: '50% Suave', val: 50 },
                    { label: '100% Padrão', val: 100 },
                    { label: '150% Claro', val: 150 },
                    { label: '200% Máx', val: 200 },
                  ].map((b) => (
                    <button
                      key={b.val}
                      type="button"
                      onClick={() => setBrightness(b.val)}
                      className={`flex-1 py-1 rounded text-[9.5px] font-semibold transition-all border ${
                        brightness === b.val
                          ? 'bg-white/20 text-white border-white/40 font-bold'
                          : 'bg-white/5 text-zinc-400 border-white/5 hover:bg-white/10 hover:text-zinc-200'
                      }`}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Slider de Contraste Extremo (30% a 220%) */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-300 flex items-center gap-1.5 font-medium">
                    <Contrast className="w-3.5 h-3.5 text-blue-400" />
                    Contraste Geral
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-white text-xs bg-white/10 px-2 py-0.5 rounded">
                      {contrast}%
                    </span>
                    {contrast !== 100 && (
                      <button
                        type="button"
                        onClick={() => setContrast(100)}
                        className="text-[10px] text-zinc-400 hover:text-white underline"
                      >
                        Reset 100%
                      </button>
                    )}
                  </div>
                </div>

                <input
                  type="range"
                  min="30"
                  max="220"
                  step="1"
                  value={contrast}
                  onChange={(e) => setContrast(Number(e.target.value))}
                  className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-white"
                />

                <div className="flex justify-between text-[9.5px] text-zinc-500 font-mono">
                  <span>30% (Baixo)</span>
                  <span>100% (Padrão)</span>
                  <span>220% (Ultra Alto)</span>
                </div>

                {/* Presets Rápidos de Contraste */}
                <div className="flex items-center gap-1 pt-1">
                  {[
                    { label: '35% Fosco', val: 35 },
                    { label: '70% Suave', val: 70 },
                    { label: '100% Padrão', val: 100 },
                    { label: '150% Alto', val: 150 },
                    { label: '200% Ultra', val: 200 },
                  ].map((c) => (
                    <button
                      key={c.val}
                      type="button"
                      onClick={() => setContrast(c.val)}
                      className={`flex-1 py-1 rounded text-[9.5px] font-semibold transition-all border ${
                        contrast === c.val
                          ? 'bg-white/20 text-white border-white/40 font-bold'
                          : 'bg-white/5 text-zinc-400 border-white/5 hover:bg-white/10 hover:text-zinc-200'
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Seção 5: Prévia Interativa dos Elementos */}
          <div className="pt-2 border-t border-white/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                <Eye className="w-3.5 h-3.5 text-emerald-400" />
                Amostra de Elementos com o Tema Atual
              </span>
            </div>

            <div className="p-3.5 rounded-xl border border-white/10 bg-white/[0.03] flex flex-wrap items-center gap-3">
              {/* Botão Primário com Acento */}
              <button
                type="button"
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white shadow-md transition-transform active:scale-95"
                style={{
                  backgroundColor: ACCENT_OPTIONS.find(a => a.id === accentColor)?.hex,
                }}
              >
                Botão Primário
              </button>

              {/* Badge com Acento */}
              <span 
                className="text-xs font-bold px-3 py-1 rounded-full border flex items-center gap-1.5"
                style={{
                  color: ACCENT_OPTIONS.find(a => a.id === accentColor)?.hex,
                  borderColor: `${ACCENT_OPTIONS.find(a => a.id === accentColor)?.hex}40`,
                  backgroundColor: `${ACCENT_OPTIONS.find(a => a.id === accentColor)?.hex}15`,
                }}
              >
                <Zap className="w-3 h-3" />
                Badge Ativa
              </span>

              {/* Card sutil */}
              <div className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-xs text-zinc-300">
                Cartão de Superfície
              </div>

              <div className="ml-auto text-xs text-zinc-400 font-mono hidden sm:block">
                Tema: <span className="text-white font-bold">{THEME_OPTIONS.find(t => t.id === themeMode)?.name}</span>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-white/10 flex items-center justify-between bg-black/40">
          <div className="flex items-center gap-2 text-xs text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
            <span>Salvo automaticamente para <strong>@{currentUserIdentifier}</strong></span>
          </div>

          <button
            type="button"
            onClick={closeThemeModal}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-white text-black hover:bg-zinc-200 transition-colors shadow-lg shadow-white/10"
          >
            Concluir
          </button>
        </div>

      </div>
    </div>
  );
};
