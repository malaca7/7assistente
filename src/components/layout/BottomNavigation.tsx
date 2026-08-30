import React from 'react';
import { 
  LayoutDashboard, 
  GitBranch, 
  MessageSquare, 
  Calendar, 
  Settings as SettingsIcon 
} from 'lucide-react';

interface BottomNavigationProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  unreadCount?: number;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  currentPath,
  onNavigate,
  unreadCount = 0,
}) => {
  const navItems = [
    {
      id: 'dashboard',
      label: 'Início',
      path: '/',
      icon: LayoutDashboard,
      isActive: currentPath === '/' || currentPath === '',
    },
    {
      id: 'flows',
      label: 'Fluxos',
      path: '/fluxos',
      icon: GitBranch,
      isActive: currentPath.startsWith('/fluxos'),
    },
    {
      id: 'conversations',
      label: 'Chat Ao Vivo',
      path: '/conversas',
      icon: MessageSquare,
      isActive: currentPath === '/conversas',
      badge: unreadCount > 0 ? unreadCount : undefined,
    },
    {
      id: 'agenda',
      label: 'Agenda',
      path: '/agenda',
      icon: Calendar,
      isActive: currentPath === '/agenda',
    },
    {
      id: 'settings',
      label: 'Config',
      path: '/configuracoes',
      icon: SettingsIcon,
      isActive: currentPath === '/configuracoes',
    },
  ];

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-dark-900/90 backdrop-blur-xl border-t border-slate-800/80 px-2 shadow-[0_-8px_25px_rgba(0,0,0,0.6)]"
      style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
    >
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = item.isActive;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.path)}
              className={`relative flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-2xl transition-all duration-200 active:scale-90 ${
                active
                  ? 'text-primary-400 font-bold'
                  : 'text-slate-400 hover:text-slate-200 font-medium'
              }`}
            >
              {/* Active Pill Highlight */}
              <div
                className={`relative flex items-center justify-center w-10 h-7 rounded-full transition-all duration-200 ${
                  active ? 'bg-primary-500/20 shadow-glow-primary' : 'bg-transparent'
                }`}
              >
                <Icon className={`w-5 h-5 ${active ? 'text-primary-400 stroke-[2.5]' : 'stroke-[1.75]'}`} />
                
                {/* Notification Badge */}
                {item.badge && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center border border-dark-900 animate-pulse">
                    {item.badge}
                  </span>
                )}
              </div>

              {/* Label */}
              <span className={`text-[10px] tracking-tight mt-0.5 ${active ? 'text-white' : 'text-slate-400'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
