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
  Bot,
  Zap,
  PhoneCall,
  Calendar as CalendarIcon,
  Scissors,
  UserCog
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
      label: 'Dashboard',
      path: '/admin',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'flows',
      label: 'Fluxos',
      path: '/fluxos',
      icon: GitFork,
      badge: 'PRO',
      badgeColor: 'bg-brand-500/20 text-brand-300 border-brand-500/30',
    },
    {
      id: 'conversations',
      label: 'Atendimento',
      path: '/conversas',
      icon: MessageSquareText,
      badge: null,
    },
    {
      id: 'clients',
      label: 'Clientes',
      path: '/clientes',
      icon: Users,
      badge: null,
    },
    {
      id: 'agenda',
      label: 'Agendamentos',
      path: '/agenda',
      icon: CalendarIcon,
      badge: null,
    },
    {
      id: 'logs',
      label: 'Logs & Auditoria',
      path: '/logs',
      icon: Sparkles,
      badge: 'NOVO',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    },
    {
      id: 'users',
      label: 'Usuários',
      path: '/usuarios',
      icon: UserCog,
      badge: 'NOVO',
      badgeColor: 'bg-brand-500/20 text-brand-300 border-brand-500/30',
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
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 via-brand-500 to-emerald-400 p-0.5 shadow-glow-brand flex-shrink-0 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-dark-950 rounded-[10px] flex items-center justify-center">
                <span className="font-display font-black text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-emerald-300 text-xl tracking-tighter">
                  7
                </span>
              </div>
            </div>

            {!collapsed && (
              <div className="flex flex-col min-w-0 transition-opacity duration-200">
                <span className="font-display font-bold text-base tracking-tight text-white flex items-center gap-1.5">
                  7 Assistente
                  <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20">
                    SaaS
                  </span>
                </span>
                <span className="text-[11px] text-slate-400 truncate">WhatsApp Cloud API</span>
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
        <div className="flex-1 py-5 px-3 space-y-1.5 overflow-y-auto">
          {!collapsed && (
            <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Menu Principal
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
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative',
                  isActive
                    ? 'bg-primary-600/15 text-primary-400 border border-primary-500/30 shadow-inner'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                )}
                title={collapsed ? item.label : undefined}
              >
                <Icon
                  className={cn(
                    'w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110',
                    isActive ? 'text-primary-400' : 'text-slate-400 group-hover:text-slate-200'
                  )}
                />

                {!collapsed && (
                  <div className="flex-1 flex items-center justify-between min-w-0 text-left">
                    <span className="truncate">{item.label}</span>
                    {item.badge && (
                      <span
                        className={cn(
                          'text-[10px] font-bold px-1.5 py-0.5 rounded-md border tracking-wider uppercase',
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
                  <div className="absolute left-0 top-2 bottom-2 w-1 bg-primary-500 rounded-r-full" />
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
                <Scissors className="w-3.5 h-3.5 text-brand-400" />
                <span>Fila de Clientes (Público)</span>
              </span>
              <span className="text-[10px] text-slate-500 group-hover:text-brand-300">/</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('/barbeiro')}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-brand-500/10 hover:bg-brand-500/20 text-brand-300 hover:text-brand-200 text-xs font-bold transition-all border border-brand-500/20 group"
            >
              <span className="flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-brand-400" />
                <span>Painel do Barbeiro</span>
              </span>
              <span className="text-[10px] text-brand-400">/barbeiro</span>
            </button>
          </div>
        )}

        {/* System Status Banner (Expanded only) */}
        {!collapsed && (
          <div 
            onClick={() => handleItemClick('/configuracoes')}
            className={`p-3 mx-3 mb-3 rounded-xl border transition-all cursor-pointer space-y-2 ${
              isConnected
                ? 'bg-gradient-to-b from-brand-950/40 to-dark-850 border-brand-500/30 hover:border-brand-500/60'
                : 'bg-gradient-to-b from-rose-950/40 to-dark-850 border-rose-500/30 hover:border-rose-500/60 animate-pulse'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isConnected ? 'bg-brand-400 animate-pulse' : 'bg-rose-500'
                  }`}
                />
                <span className="text-xs font-semibold text-white">
                  {isConnected ? 'WhatsApp Conectado' : 'WhatsApp Desconectado'}
                </span>
              </div>
              <span
                className={`text-[10px] font-mono ${
                  isConnected ? 'text-brand-400' : 'text-rose-400 font-bold'
                }`}
              >
                {isConnected ? 'Sessão Ativa' : 'Escanear QR'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">
              {isConnected
                ? `Aparelho emparelhado (${session.phone ? formatPhone(session.phone) : 'Pronto'}). Automações ativas.`
                : 'Clique para escanear o QR Code e habilitar envio de mensagens e fluxos.'}
            </p>
          </div>
        )}

        {/* User Profile & Logout */}
        <div className="p-3 border-t border-white/5 bg-dark-950/50">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-dark-850 border border-brand-500/30 flex items-center justify-center text-brand-400 font-bold flex-shrink-0 text-sm shadow-sm">
                7A
              </div>
              {!collapsed && (
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-semibold text-slate-200 truncate">
                    {user?.name || 'Administrador'}
                  </span>
                  <span className="text-[10px] text-slate-500 truncate font-mono">
                    {user?.phone ? formatPhone(user.phone) : 'Admin Principal'}
                  </span>
                </div>
              )}
            </div>

            <button
              onClick={() => logout()}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
              title="Sair da Plataforma"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
