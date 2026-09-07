import React from 'react';
import { 
  LayoutDashboard, 
  GitFork, 
  Users, 
  MessageSquareText, 
  Sparkles, 
  Settings as SettingsIcon, 
  LogOut, 
  ChevronLeft, 
  ChevronRight,
  Store,
  QrCode,
  ShoppingBag,
  ExternalLink,
  ShieldCheck,
  Building2,
  Calendar,
  Layers,
  Heart
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useWhatsApp } from '../../contexts/WhatsAppContext';
import { cn, formatPhone } from '../../lib/utils';

export interface SidebarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPath,
  onNavigate,
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
}) => {
  const { user, logout } = useAuth();
  const { isConnected, session } = useWhatsApp();

  const navigationItems = [
    {
      id: 'dashboard',
      label: 'Dashboard Central',
      path: '/admin',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'stores',
      label: 'Rede de Lojas',
      path: '/lojas',
      icon: Building2,
      badge: '3 LOJAS',
      badgeColor: 'bg-pitoco-blue/20 text-pitoco-blue border-pitoco-blue/30',
    },
    {
      id: 'conversations',
      label: 'Inbox Atendimento',
      path: '/atendimento',
      icon: MessageSquareText,
      badge: 'LIVE',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    },
    {
      id: 'flows',
      label: 'Fluxos do Robô',
      path: '/fluxos',
      icon: GitFork,
      badge: null,
    },
    {
      id: 'whatsapp',
      label: 'Conexão WhatsApp',
      path: '/whatsapp',
      icon: QrCode,
      badge: isConnected ? 'ON' : 'OFF',
      badgeColor: isConnected 
        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
        : 'bg-rose-500/20 text-rose-400 border-rose-500/30',
    },
    {
      id: 'users',
      label: 'Gestão de Acessos',
      path: '/acessos',
      icon: Users,
      badge: null,
    },
    {
      id: 'logs',
      label: 'Logs & Auditoria',
      path: '/logs',
      icon: Sparkles,
      badge: null,
    },
    {
      id: 'settings',
      label: 'Configurações',
      path: '/configuracoes',
      icon: SettingsIcon,
      badge: null,
    },
  ];

  const handleItemClick = (path: string) => {
    onNavigate(path);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 lg:hidden animate-in fade-in"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          'fixed top-0 left-0 bottom-0 z-40 bg-dark-900 border-r border-white/5 flex flex-col transition-all duration-300 ease-in-out',
          collapsed ? 'w-20' : 'w-64',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Header / Brand */}
        <div className="h-18 px-4 flex items-center justify-between border-b border-white/5">
          <div 
            onClick={() => handleItemClick('/')}
            className="flex items-center gap-3 cursor-pointer select-none group overflow-hidden"
          >
            <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/10 p-0.5 bg-dark-900/60 shadow-glow-primary flex-shrink-0 group-hover:scale-105 transition-transform flex items-center justify-center">
              <img src="/logo.png" alt="Logo Pitoco" className="w-full h-full object-contain" />
            </div>

            {!collapsed && (
              <div className="flex flex-col min-w-0 transition-opacity duration-200">
                <span className="font-display font-bold text-sm tracking-tight text-white flex items-center gap-1.5">
                  Pitoco de Gente
                </span>
                <span className="text-[10px] text-pitoco-blue font-semibold truncate">
                  Bebê & Enxovais
                </span>
              </div>
            )}
          </div>

          {/* Desktop Toggle Collapse */}
          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title={collapsed ? 'Expandir Menu' : 'Recolher Menu'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {!collapsed && (
            <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Menu Administrativo
            </div>
          )}

          {navigationItems.map((item) => {
            const isActive = currentPath === item.path || (item.path !== '/' && currentPath.startsWith(item.path));
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.path)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all relative group',
                  isActive
                    ? 'bg-pitoco-blue/15 text-pitoco-blue border border-pitoco-blue/30 shadow-sm font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                )}
                title={collapsed ? item.label : undefined}
              >
                <Icon
                  className={cn(
                    'w-4 h-4 shrink-0 transition-transform duration-200',
                    isActive ? 'text-pitoco-blue scale-110' : 'text-slate-400 group-hover:text-slate-200 group-hover:scale-105'
                  )}
                />

                {!collapsed && (
                  <div className="flex items-center justify-between flex-1 min-w-0">
                    <span className="truncate">{item.label}</span>
                    {item.badge && (
                      <span
                        className={cn(
                          'text-[9px] font-bold px-1.5 py-0.5 rounded-md border tracking-wider uppercase',
                          item.badgeColor
                        )}
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}

                {/* Active Indicator Strip */}
                {isActive && (
                  <div className="absolute left-0 top-2 bottom-2 w-1 bg-pitoco-blue rounded-r-full" />
                )}
              </button>
            );
          })}
        </div>

        {/* Quick Portal Shortcuts */}
        {!collapsed && (
          <div className="px-3 pb-2 space-y-1">
            <button
              type="button"
              onClick={() => onNavigate('/')}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-semibold transition-all group"
            >
              <span className="flex items-center gap-2">
                <ShoppingBag className="w-3.5 h-3.5 text-pitoco-blue" />
                <span>Vitrine da Loja (Público)</span>
              </span>
              <span className="text-[10px] text-slate-500 group-hover:text-pitoco-blue">/</span>
            </button>
          </div>
        )}

        {/* System Status Banner */}
        {!collapsed && (
          <div 
            onClick={() => handleItemClick('/whatsapp')}
            className={`p-3 mx-3 mb-3 rounded-xl border transition-all cursor-pointer space-y-1.5 ${
              isConnected
                ? 'bg-gradient-to-b from-emerald-950/30 to-dark-850 border-emerald-500/30 hover:border-emerald-500/60'
                : 'bg-gradient-to-b from-rose-950/30 to-dark-850 border-rose-500/30 hover:border-rose-500/60 animate-pulse'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'
                  }`}
                />
                <span className="text-xs font-semibold text-white">
                  {isConnected ? 'WhatsApp Ativo' : 'WhatsApp Desconectado'}
                </span>
              </div>
              <span className="text-[10px] text-pitoco-blue font-mono font-bold">
                {isConnected ? 'Baileys OK' : 'Ler QR'}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 truncate">
              {isConnected ? session.phone : 'Discloud Microservice'}
            </p>
          </div>
        )}

        {/* User Footer */}
        <div className="p-3 border-t border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-pitoco-blue to-pitoco-pink flex items-center justify-center text-slate-950 font-bold text-xs">
              {(user?.name || 'M')[0]}
            </div>
            {!collapsed && (
              <div className="truncate">
                <span className="text-xs font-bold text-white block truncate">
                  {user?.name || 'Malaca CEO'}
                </span>
                <span className="text-[10px] text-slate-400 block truncate">
                  {user?.role === 'ceo' ? 'Diretor Geral' : 'Gestão'}
                </span>
              </div>
            )}
          </div>
          {!collapsed && (
            <button
              onClick={logout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              title="Sair da Conta"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </aside>
    </>
  );
};
