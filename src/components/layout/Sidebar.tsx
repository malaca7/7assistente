import React, { useState } from 'react';
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
  Building2,
  Calendar,
  LifeBuoy,
  Bot,
  PanelLeftClose,
  PanelLeftOpen,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useWhatsApp } from '../../contexts/WhatsAppContext';
import { cn } from '../../lib/utils';

export interface SidebarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  widthMode?: 'compact' | 'normal' | 'wide';
  onCycleWidth?: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPath,
  onNavigate,
  collapsed,
  onToggleCollapse,
  widthMode = 'normal',
  onCycleWidth,
  mobileOpen,
  onCloseMobile,
}) => {
  const { user, isCEO, isManager, isAttendant, logout } = useAuth();
  const { isConnected } = useWhatsApp();

  // Todos os itens de navegação
  const allNavigationGroups = [
    {
      title: 'Visão Geral',
      items: [
        {
          id: 'dashboard',
          label: isCEO ? 'Painel CEO' : isManager ? 'Painel Gestão' : 'Painel Atendimento',
          path: '/admin',
          icon: LayoutDashboard,
          roles: ['ceo', 'admin', 'manager', 'attendant'],
        },
      ],
    },
    {
      title: 'Operação & Vendas',
      items: [
        {
          id: 'atendimento',
          label: 'Inbox WhatsApp',
          path: '/atendimento',
          icon: MessageSquareText,
          badge: 'LIVE',
          badgeColor: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
          roles: ['ceo', 'admin', 'manager', 'attendant'],
        },
        {
          id: 'produtos',
          label: 'Catálogo & Estoque',
          path: '/catalogo',
          icon: ShoppingBag,
          roles: ['ceo', 'admin', 'manager', 'attendant'],
        },
        {
          id: 'lojas',
          label: 'Rede de Lojas',
          path: '/lojas',
          icon: Building2,
          badge: 'REDE',
          badgeColor: 'bg-white/10 text-zinc-300 border border-white/20',
          roles: ['ceo', 'admin', 'manager'],
        },
      ],
    },
    {
      title: 'Clientes & Suporte',
      items: [
        {
          id: 'clientes',
          label: 'Gestão de Clientes',
          path: '/clientes',
          icon: Users,
          roles: ['ceo', 'admin', 'manager', 'attendant'],
        },
        {
          id: 'tickets',
          label: 'Tickets de Suporte',
          path: '/tickets',
          icon: LifeBuoy,
          roles: ['ceo', 'admin', 'manager', 'attendant'],
        },
      ],
    },
    {
      title: 'Automação & Robô',
      items: [
        {
          id: 'fluxos',
          label: 'Studio de Fluxos',
          path: '/fluxos',
          icon: GitFork,
          roles: ['ceo', 'admin'],
        },
        {
          id: 'whatsapp',
          label: 'Conexão WhatsApp',
          path: '/whatsapp',
          icon: QrCode,
          badge: isConnected ? 'ON' : 'OFF',
          badgeColor: isConnected 
            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
          roles: ['ceo', 'admin'],
        },
        {
          id: 'bot_config',
          label: 'Parâmetros do Robô',
          path: '/bot_config',
          icon: Bot,
          roles: ['ceo', 'admin'],
        },
      ],
    },
    {
      title: 'Gestão & Sistema',
      items: [
        {
          id: 'acessos',
          label: 'Gestão de Acessos',
          path: '/acessos',
          icon: Users,
          roles: ['ceo', 'admin', 'manager'],
        },
        {
          id: 'configuracoes',
          label: 'Configurações & Banco',
          path: '/configuracoes',
          icon: SettingsIcon,
          roles: ['ceo', 'admin'],
        },
        {
          id: 'logs',
          label: 'Logs & Auditoria',
          path: '/logs',
          icon: Sparkles,
          roles: ['ceo', 'admin'],
        },
      ],
    },
  ];

  // Filtrar de acordo com o papel atual
  const currentRole = user?.role || 'ceo';
  const filteredGroups = allNavigationGroups.map(group => ({
    ...group,
    items: group.items.filter(item => item.roles.includes(currentRole)),
  })).filter(group => group.items.length > 0);

  const handleItemClick = (path: string) => {
    onNavigate(path);
    onCloseMobile();
  };

  // Larguras baseadas no modo
  const getSidebarWidthClass = () => {
    if (collapsed) return 'w-[72px]';
    if (widthMode === 'wide') return 'w-80';
    return 'w-64';
  };

  return (
    <>
      {/* Backdrop Mobile */}
      {mobileOpen && (
        <div 
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 lg:hidden animate-fadeIn"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          'fixed top-0 bottom-0 left-0 z-50 bg-[#09090b] border-r border-white/10 flex flex-col transition-all duration-300 ease-in-out select-none',
          getSidebarWidthClass(),
          mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Top Header: Logo e Controles de Tamanho */}
        <div className="h-20 px-4 border-b border-white/[0.08] flex items-center justify-between gap-2 shrink-0">
          {!collapsed ? (
            <div 
              onClick={() => onNavigate('/admin')}
              className="flex items-center gap-3 cursor-pointer overflow-hidden group"
            >
              <img 
                src="https://pitoco.malaca.com.br/logopitoconova.png" 
                onError={(e) => { e.currentTarget.src = '/logopitoconova.png'; }}
                alt="Pitoco de Gente" 
                className="h-9 w-auto object-contain transition-transform group-hover:scale-105" 
              />
              <div className="leading-tight overflow-hidden">
                <span className="text-xs font-bold text-white tracking-tight block truncate">
                  Pitoco de Gente
                </span>
                <span className="text-[10px] text-zinc-400 block truncate">
                  {isCEO ? 'Portal CEO' : isManager ? 'Portal Gerente' : 'Atendimento'}
                </span>
              </div>
            </div>
          ) : (
            <div 
              onClick={() => onNavigate('/admin')}
              className="mx-auto cursor-pointer p-1"
              title="Pitoco de Gente"
            >
              <img 
                src="https://pitoco.malaca.com.br/logopitoconova.png" 
                onError={(e) => { e.currentTarget.src = '/logopitoconova.png'; }}
                alt="Pitoco" 
                className="w-8 h-8 object-contain" 
              />
            </div>
          )}

          {/* Botões de Ação: Abrir/Fechar & Aumentar/Diminuir */}
          <div className="flex items-center gap-1">
            {!collapsed && onCycleWidth && (
              <button
                onClick={onCycleWidth}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors hidden sm:flex"
                title={widthMode === 'wide' ? 'Reduzir para largura normal' : 'Aumentar largura'}
              >
                {widthMode === 'wide' ? (
                  <Minimize2 className="w-3.5 h-3.5" />
                ) : (
                  <Maximize2 className="w-3.5 h-3.5" />
                )}
              </button>
            )}

            <button
              onClick={onToggleCollapse}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors hidden lg:flex"
              title={collapsed ? 'Abrir menu lateral' : 'Recolher menu lateral'}
            >
              {collapsed ? (
                <PanelLeftOpen className="w-4 h-4 text-zinc-300" />
              ) : (
                <PanelLeftClose className="w-4 h-4 text-zinc-300" />
              )}
            </button>
          </div>
        </div>

        {/* User Role Profile Badge */}
        {!collapsed && user && (
          <div className="p-3 mx-3 my-2 rounded-xl bg-[#141416] border border-white/5 flex items-center justify-between">
            <div className="overflow-hidden">
              <span className="text-xs font-bold text-white block truncate">
                {user.name}
              </span>
              <span className="text-[10px] text-zinc-400 flex items-center gap-1.5 mt-0.5">
                <span className={cn(
                  'w-1.5 h-1.5 rounded-full',
                  isCEO ? 'bg-amber-400' : isManager ? 'bg-emerald-400' : 'bg-pink-400'
                )} />
                {isCEO ? 'Diretor CEO' : isManager ? 'Gerente da Filial' : 'Consultora VIP'}
              </span>
            </div>
            <span className={cn(
              'text-[9px] font-bold uppercase px-2 py-0.5 rounded-full font-mono shrink-0',
              isCEO ? 'bg-amber-400/10 text-amber-300 border border-amber-400/20' :
              isManager ? 'bg-emerald-400/10 text-emerald-300 border border-emerald-400/20' :
              'bg-pink-400/10 text-pink-300 border border-pink-400/20'
            )}>
              {user.role}
            </span>
          </div>
        )}

        {/* Navigation Items (Scrollable) */}
        <div className="flex-1 overflow-y-auto py-3 px-2.5 space-y-4">
          {filteredGroups.map(group => (
            <div key={group.title} className="space-y-1">
              {!collapsed && (
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider px-3 py-1 block">
                  {group.title}
                </span>
              )}

              {group.items.map(item => {
                const Icon = item.icon;
                const isActive = 
                  currentPath === item.path || 
                  (item.path !== '/admin' && currentPath.startsWith(item.path));

                return (
                  <button
                    key={item.id}
                    onClick={() => handleItemClick(item.path)}
                    title={collapsed ? item.label : undefined}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs transition-all duration-150',
                      isActive
                        ? 'bg-white text-black font-bold shadow-md'
                        : 'text-zinc-400 hover:text-white hover:bg-white/[0.06] font-medium'
                    )}
                  >
                    <Icon className={cn('w-4 h-4 shrink-0', isActive ? 'text-black' : 'text-zinc-400')} />
                    
                    {!collapsed && (
                      <span className="truncate flex-1 text-left">
                        {item.label}
                      </span>
                    )}

                    {!collapsed && item.badge && (
                      <span className={cn('text-[9px] font-semibold px-2 py-0.5 rounded-full ml-auto', item.badgeColor)}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer Controls: WhatsApp Status & Logout */}
        <div className="p-3 border-t border-white/[0.08] space-y-2 bg-[#0c0c0e]/80 shrink-0">
          {!collapsed ? (
            <div className="flex items-center justify-between px-2 py-1 text-xs">
              <span className="text-[11px] text-zinc-400 flex items-center gap-1.5">
                <span className={cn(
                  'w-2 h-2 rounded-full animate-pulse',
                  isConnected ? 'bg-emerald-400' : 'bg-rose-500'
                )} />
                {isConnected ? 'WhatsApp Online' : 'WhatsApp Offline'}
              </span>

              <button
                onClick={logout}
                className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
                title="Sair do painel"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sair
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <span 
                className={cn(
                  'w-2.5 h-2.5 rounded-full',
                  isConnected ? 'bg-emerald-400' : 'bg-rose-500'
                )} 
                title={isConnected ? 'WhatsApp Online' : 'WhatsApp Offline'}
              />
              <button
                onClick={logout}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
                title="Sair"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
