import React from 'react';
import { 
  Menu, 
  Bell, 
  ExternalLink,
  QrCode
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { useAuth } from '../../contexts/AuthContext';
import { useWhatsApp } from '../../contexts/WhatsAppContext';
import { formatPhone } from '../../lib/utils';

export interface TopbarProps {
  title: string;
  subtitle?: string;
  onOpenMobileMenu: () => void;
  onNavigate: (path: string) => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  title,
  subtitle,
  onOpenMobileMenu,
  onNavigate,
}) => {
  const { user } = useAuth();
  const { isConnected, session } = useWhatsApp();

  return (
    <header className="h-16 bg-[#09090b]/90 backdrop-blur-xl border-b border-white/10 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Left side: Hamburger (mobile) + Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
          title="Abrir Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
            {title}
          </h1>
          {subtitle && <p className="text-xs text-zinc-400 hidden sm:block">{subtitle}</p>}
        </div>
      </div>

      {/* Right side: WhatsApp Status & Role info */}
      <div className="flex items-center gap-3">
        {/* Dynamic WhatsApp Status Badge */}
        {isConnected ? (
          <div 
            onClick={() => onNavigate('/whatsapp')}
            className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 cursor-pointer hover:border-emerald-500/40 transition-all group"
            title="Clique para gerenciar sessão do WhatsApp"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold text-emerald-400">
              WhatsApp Conectado {session.phone ? `(${formatPhone(session.phone)})` : ''}
            </span>
            <ExternalLink className="w-3 h-3 text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        ) : (
          <div 
            onClick={() => onNavigate('/whatsapp')}
            className="flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 cursor-pointer hover:border-rose-500/40 transition-all group animate-pulse"
            title="Clique para escanear o QR Code e conectar o WhatsApp"
          >
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span className="text-xs font-semibold text-rose-400 flex items-center gap-1.5">
              <QrCode className="w-3.5 h-3.5 text-rose-400" />
              Desconectado (QR)
            </span>
          </div>
        )}

        {/* User Role Pill */}
        <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-white/10">
          <span className="text-xs font-bold text-zinc-300">
            {user?.name}
          </span>
          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-white/10 text-white font-semibold border border-white/15">
            {user?.role || 'admin'}
          </span>
        </div>
      </div>
    </header>
  );
};
