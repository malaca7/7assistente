export type ThemeMode = 
  | 'dark-abyss'    // 0. Super Blackout / Abismo OLED (#000000 Total)
  | 'dark-midnight' // 1. Escuro Ônix Puro (Midnight OLED)
  | 'dark-slate'    // 2. Escuro Carvão & Ardósia (Slate)
  | 'dark-violet'   // 3. Escuro Cyber Roxo (Deep Nebula)
  | 'light-minimal' // 4. Claro Neve Minimal (Clean White)
  | 'light-warm';   // 5. Claro Areia Quente (Warm Paper)

export type AccentColor = 
  | 'emerald' // Verde Pitoco (Oficial)
  | 'blue'    // Azul Safira
  | 'purple'  // Roxo Neon
  | 'pink'    // Rosa Chiclete
  | 'amber'   // Âmbar Sol
  | 'cyan'    // Ciano Elétrico
  | 'zinc';   // Monocromático / Minimalista

export interface UserThemeConfig {
  mode: ThemeMode;
  brightness: number; // 25 a 200 (padrão 100)
  contrast: number;   // 35 a 220 (padrão 100)
  accent: AccentColor;
  ultraDark?: boolean; // Modo Blackout Extremo / Super Escuro
  updatedAt?: string;
}

export interface ThemeOption {
  id: ThemeMode;
  name: string;
  category: 'dark' | 'light';
  description: string;
  badge: string;
  bgHex: string;
  cardHex: string;
  borderHex: string;
  textHex: string;
}

export interface AccentOption {
  id: AccentColor;
  name: string;
  hex: string;
  hoverHex: string;
  rgb: string;
}

export const THEME_OPTIONS: ThemeOption[] = [
  // 4 TEMAS ESCUROS
  {
    id: 'dark-abyss',
    name: 'Abismo Blackout',
    category: 'dark',
    description: 'Preto 100% puro absoluto (#000000), sem brilho reflexivo, para máximo descanso visual.',
    badge: 'Super Escuro',
    bgHex: '#000000',
    cardHex: '#040405',
    borderHex: '#141416',
    textHex: '#ffffff',
  },
  {
    id: 'dark-midnight',
    name: 'Ônix Midnight',
    category: 'dark',
    description: 'Preto puro absoluto (#000000), contraste ultra definido para telas OLED.',
    badge: 'OLED / Puro',
    bgHex: '#000000',
    cardHex: '#09090b',
    borderHex: '#27272a',
    textHex: '#ffffff',
  },
  {
    id: 'dark-slate',
    name: 'Carvão Slate',
    category: 'dark',
    description: 'Grafite e ardósia fria suave (#0f172a), corporativo e elegante.',
    badge: 'Ardósia / Grafite',
    bgHex: '#0b0f17',
    cardHex: '#111827',
    borderHex: '#1e293b',
    textHex: '#f1f5f9',
  },
  {
    id: 'dark-violet',
    name: 'Deep Nebula',
    category: 'dark',
    description: 'Fundo cósmico violeta escuro (#090514) com acentos futuristas sutis.',
    badge: 'Cyber / Cósmico',
    bgHex: '#090514',
    cardHex: '#130a24',
    borderHex: '#2e1065',
    textHex: '#faf5ff',
  },
  // 2 TEMAS CLAROS
  {
    id: 'light-minimal',
    name: 'Neve Clean',
    category: 'light',
    description: 'Branco neve com alto contraste (#f8fafc), estilo Stripe e Linear.',
    badge: 'Clean / Minimal',
    bgHex: '#f8fafc',
    cardHex: '#ffffff',
    borderHex: '#e2e8f0',
    textHex: '#0f172a',
  },
  {
    id: 'light-warm',
    name: 'Areia & Papel',
    category: 'light',
    description: 'Tons acolhedores de pergaminho e areia (#fbf9f4), repouso visual garantido.',
    badge: 'Anti-Fadiga / Suave',
    bgHex: '#fbf9f4',
    cardHex: '#ffffff',
    borderHex: '#e7e0d3',
    textHex: '#292524',
  },
];

export const ACCENT_OPTIONS: AccentOption[] = [
  {
    id: 'emerald',
    name: 'Verde Pitoco',
    hex: '#10b981',
    hoverHex: '#059669',
    rgb: '16, 185, 129',
  },
  {
    id: 'blue',
    name: 'Azul Safira',
    hex: '#3b82f6',
    hoverHex: '#2563eb',
    rgb: '59, 130, 246',
  },
  {
    id: 'purple',
    name: 'Roxo Neon',
    hex: '#a855f7',
    hoverHex: '#9333ea',
    rgb: '168, 85, 247',
  },
  {
    id: 'pink',
    name: 'Rosa Bebê',
    hex: '#f472b6',
    hoverHex: '#ec4899',
    rgb: '244, 114, 182',
  },
  {
    id: 'amber',
    name: 'Âmbar Dourado',
    hex: '#f59e0b',
    hoverHex: '#d97706',
    rgb: '245, 158, 11',
  },
  {
    id: 'cyan',
    name: 'Ciano Elétrico',
    hex: '#06b6d4',
    hoverHex: '#0891b2',
    rgb: '6, 182, 212',
  },
  {
    id: 'zinc',
    name: 'Zinco Neutro',
    hex: '#e4e4e7',
    hoverHex: '#d4d4d8',
    rgb: '228, 228, 231',
  },
];

export const DEFAULT_THEME_CONFIG: UserThemeConfig = {
  mode: 'dark-midnight',
  brightness: 100,
  contrast: 100,
  accent: 'emerald',
  ultraDark: false,
};
