import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  ThemeMode, 
  AccentColor, 
  UserThemeConfig, 
  DEFAULT_THEME_CONFIG,
  ACCENT_OPTIONS,
  THEME_OPTIONS 
} from '../types/theme';
import { useAuth } from './AuthContext';

interface ThemeContextType {
  themeConfig: UserThemeConfig;
  themeMode: ThemeMode;
  brightness: number;
  contrast: number;
  accentColor: AccentColor;
  setThemeMode: (mode: ThemeMode) => void;
  setBrightness: (val: number) => void;
  setContrast: (val: number) => void;
  setAccentColor: (accent: AccentColor) => void;
  resetTheme: () => void;
  isThemeModalOpen: boolean;
  openThemeModal: () => void;
  closeThemeModal: () => void;
  currentUserIdentifier: string;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function getStorageKeyForUser(username?: string | null): string {
  if (username && username.trim().length > 0) {
    return `pitoco_theme_user_${username.trim().toLowerCase()}`;
  }
  return 'pitoco_theme_user_guest';
}

function loadConfigFromStorage(storageKey: string): UserThemeConfig {
  if (typeof window === 'undefined') return DEFAULT_THEME_CONFIG;
  try {
    const raw = localStorage.getItem(storageKey) || localStorage.getItem('pitoco_active_theme');
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        mode: parsed.mode || DEFAULT_THEME_CONFIG.mode,
        brightness: typeof parsed.brightness === 'number' ? parsed.brightness : DEFAULT_THEME_CONFIG.brightness,
        contrast: typeof parsed.contrast === 'number' ? parsed.contrast : DEFAULT_THEME_CONFIG.contrast,
        accent: parsed.accent || DEFAULT_THEME_CONFIG.accent,
      };
    }
  } catch (err) {
    console.warn('[ThemeContext] Erro ao carregar config:', err);
  }
  return DEFAULT_THEME_CONFIG;
}

function applyThemeToDOM(config: UserThemeConfig) {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;

  // 1. Data attributes
  root.setAttribute('data-theme', config.mode);
  root.setAttribute('data-accent', config.accent);

  // 2. Brightness & Contrast via CSS variables
  const bVal = (config.brightness / 100).toFixed(2);
  const cVal = (config.contrast / 100).toFixed(2);
  root.style.setProperty('--theme-brightness', bVal);
  root.style.setProperty('--theme-contrast', cVal);

  // 3. Accent variables
  const accent = ACCENT_OPTIONS.find(a => a.id === config.accent) || ACCENT_OPTIONS[0];
  root.style.setProperty('--theme-accent', accent.hex);
  root.style.setProperty('--theme-accent-hover', accent.hoverHex);
  root.style.setProperty('--theme-accent-rgb', accent.rgb);

  // 4. Dark vs Light classes on html
  if (config.mode.startsWith('light')) {
    root.classList.remove('dark');
    root.classList.add('light');
  } else {
    root.classList.remove('light');
    root.classList.add('dark');
  }
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const username = user?.username || user?.name;
  const userStorageKey = getStorageKeyForUser(username);

  const [themeConfig, setThemeConfig] = useState<UserThemeConfig>(() => {
    return loadConfigFromStorage(userStorageKey);
  });

  const [isThemeModalOpen, setIsThemeModalOpen] = useState<boolean>(false);

  // Quando o usuário muda (login/logout), carregar a configuração daquele usuário específico
  useEffect(() => {
    const userConfig = loadConfigFromStorage(userStorageKey);
    setThemeConfig(userConfig);
    applyThemeToDOM(userConfig);
  }, [userStorageKey]);

  // Aplicar sempre que a configuração mudar e persistir
  const persistConfig = useCallback((newConfig: UserThemeConfig) => {
    setThemeConfig(newConfig);
    applyThemeToDOM(newConfig);
    if (typeof window !== 'undefined') {
      try {
        const json = JSON.stringify({ ...newConfig, updatedAt: new Date().toISOString() });
        localStorage.setItem(userStorageKey, json);
        localStorage.setItem('pitoco_active_theme', json);
      } catch (e) {
        console.warn('[ThemeContext] Erro ao persistir config:', e);
      }
    }
  }, [userStorageKey]);

  const setThemeMode = useCallback((mode: ThemeMode) => {
    persistConfig({ ...themeConfig, mode });
  }, [persistConfig, themeConfig]);

  const setBrightness = useCallback((val: number) => {
    const clamped = Math.min(130, Math.max(70, Math.round(val)));
    persistConfig({ ...themeConfig, brightness: clamped });
  }, [persistConfig, themeConfig]);

  const setContrast = useCallback((val: number) => {
    const clamped = Math.min(140, Math.max(80, Math.round(val)));
    persistConfig({ ...themeConfig, contrast: clamped });
  }, [persistConfig, themeConfig]);

  const setAccentColor = useCallback((accent: AccentColor) => {
    persistConfig({ ...themeConfig, accent });
  }, [persistConfig, themeConfig]);

  const resetTheme = useCallback(() => {
    persistConfig(DEFAULT_THEME_CONFIG);
  }, [persistConfig]);

  const openThemeModal = useCallback(() => setIsThemeModalOpen(true), []);
  const closeThemeModal = useCallback(() => setIsThemeModalOpen(false), []);

  return (
    <ThemeContext.Provider
      value={{
        themeConfig,
        themeMode: themeConfig.mode,
        brightness: themeConfig.brightness,
        contrast: themeConfig.contrast,
        accentColor: themeConfig.accent,
        setThemeMode,
        setBrightness,
        setContrast,
        setAccentColor,
        resetTheme,
        isThemeModalOpen,
        openThemeModal,
        closeThemeModal,
        currentUserIdentifier: username || 'Usuário Atual',
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme deve ser usado dentro de um ThemeProvider');
  }
  return context;
};
