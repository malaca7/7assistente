import React from 'react';
import { 
  LayoutDashboard, 
  MessageSquareText, 
  Users,
  Building2,
  ShoppingBag,
  Store,
  Menu
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export interface BottomNavigationProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  unreadCount?: number;
  onOpenMenu?: () => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  currentPath,
  onNavigate,
  unreadCount = 0,
  onOpenMenu,
}) => {
  const { isCEO, isManager, isAttendant, hasAdminAccess, hasManagerAccess } = useAuth();

  // Construir abas ideais de acordo com o perfil do usuário (máximo 5 itens para ergonomia mobile)
  const getNavItems = () => {
    if (hasAdminAccess) {
      return [
        {
          id: 'dashboard',
          label: 'Início',
          path: '/admin',
          icon: LayoutDashboard,
          isActive: currentPath === '/admin' || currentPath === '/' || currentPath.startsWith('/admin'),
        },
        {
          id: 'atendimento',
          label: 'Atendimento',
          path: '/atendimento',
          icon: MessageSquareText,
          isActive: currentPath.startsWith('/atendimento') || currentPath.startsWith('/conversas'),
          badge: unreadCount > 0 ? unreadCount : undefined,
        },
        {
          id: 'clientes',
          label: 'Clientes',
          path: '/clientes',
          icon: Users,
          isActive: currentPath.startsWith('/clientes') || currentPath.startsWith('/crm'),
        },
        {
          id: 'lojas',
          label: 'Lojas',
          path: '/lojas',
          icon: Building2,
          isActive: currentPath.startsWith('/lojas') || currentPath.startsWith('/rede'),
        },
        {
          id: 'menu',
          label: 'Menu',
          isAction: true,
          action: onOpenMenu,
          icon: Menu,
          isActive: false,
        },
      ];
    }

    if (hasManagerAccess) {
      return [
        {
          id: 'gerente',
          label: 'Filial',
          path: '/gerente',
          icon: Store,
          isActive: currentPath.startsWith('/gerente') || currentPath.startsWith('/gestao'),
        },
        {
          id: 'atendimento',
          label: 'Atendimento',
          path: '/atendimento',
          icon: MessageSquareText,
          isActive: currentPath.startsWith('/atendimento') || currentPath.startsWith('/conversas'),
          badge: unreadCount > 0 ? unreadCount : undefined,
        },
        {
          id: 'clientes',
          label: 'Clientes',
          path: '/clientes',
          icon: Users,
          isActive: currentPath.startsWith('/clientes') || currentPath.startsWith('/crm'),
        },
        {
          id: 'catalogo',
          label: 'Catálogo',
          path: '/catalogo',
          icon: ShoppingBag,
          isActive: currentPath.startsWith('/catalogo') || currentPath.startsWith('/produtos'),
        },
        {
          id: 'menu',
          label: 'Menu',
          isAction: true,
          action: onOpenMenu,
          icon: Menu,
          isActive: false,
        },
      ];
    }

    // Atendente
    return [
      {
        id: 'atendimento',
        label: 'Atendimento',
        path: '/atendimento',
        icon: MessageSquareText,
        isActive: currentPath.startsWith('/atendimento') || currentPath.startsWith('/conversas') || currentPath === '/',
        badge: unreadCount > 0 ? unreadCount : undefined,
      },
      {
        id: 'clientes',
        label: 'Clientes',
        path: '/clientes',
        icon: Users,
        isActive: currentPath.startsWith('/clientes') || currentPath.startsWith('/crm'),
      },
      {
        id: 'catalogo',
        label: 'Catálogo',
        path: '/catalogo',
        icon: ShoppingBag,
        isActive: currentPath.startsWith('/catalogo') || currentPath.startsWith('/produtos'),
      },
      {
        id: 'menu',
        label: 'Menu',
        isAction: true,
        action: onOpenMenu,
        icon: Menu,
        isActive: false,
      },
    ];
  };

  const navItems = getNavItems();

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#09090b]/92 backdrop-blur-2xl border-t border-white/[0.08] shadow-[0_-8px_30px_rgba(0,0,0,0.7)] select-none"
      style={{ paddingBottom: 'max(0.6rem, env(safe-area-inset-bottom, 0px))' }}
    >
      <div className="flex items-center justify-around h-15 px-2 max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = item.isActive;

          const handleClick = () => {
            if (item.isAction && item.action) {
              item.action();
            } else if (item.path) {
              onNavigate(item.path);
            }
          };

          return (
            <button
              key={item.id}
              type="button"
              onClick={handleClick}
              className={`relative flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-2xl transition-all duration-150 active:scale-90 ${
                active
                  ? 'text-white font-bold'
                  : 'text-zinc-400 hover:text-zinc-200 font-medium'
              }`}
            >
              {/* Active Pill Highlight */}
              <div
                className={`relative flex items-center justify-center w-11 h-7 rounded-full transition-all duration-200 ${
                  active ? 'bg-white/15 shadow-sm ring-1 ring-white/20' : 'bg-transparent'
                }`}
              >
                <Icon className={`w-5 h-5 ${active ? 'text-white stroke-[2.5]' : 'text-zinc-400 stroke-[1.8]'}`} />
                
                {/* Notification Badge */}
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-emerald-500 text-slate-950 text-[9px] font-black flex items-center justify-center border border-black shadow-sm animate-pulse">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>

              {/* Label */}
              <span className={`text-[10px] tracking-tight mt-0.5 leading-tight ${active ? 'text-white font-semibold' : 'text-zinc-400'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
