import React from 'react';
import { 
  Menu, 
  Bell, 
  Plus, 
  ExternalLink,
  QrCode,
  Smartphone,
  AlertTriangle
} from 'lucide-react';
import { Button } from '../ui/Button';
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
    <header className="h-18 bg-dark-900/80 backdrop-blur-xl border-b border-white/5 px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Left side: Hamburger (mobile) + Page Title */}
      <div className="flex items-center gap-4">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            {title}
          </h1>
          {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
        </div>
      </div>

      {/* Right side: Real WhatsApp QR Code Status & actions */}
      <div className="flex items-center gap-3">
        {/* Dynamic WhatsApp Status Badge */}
        {isConnected ? (
          <div 
            onClick={() => onNavigate('/configuracoes')}
            className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-950/60 border border-brand-800/60 cursor-pointer hover:border-brand-500/60 transition-all group shadow-sm"
            title="Clique para gerenciar sessão do WhatsApp"
          >
            <span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse" />
            <span className="text-xs font-medium text-brand-300">
              WhatsApp Conectado {session.phone ? `(${formatPhone(session.phone)})` : ''}
            </span>
            <ExternalLink className="w-3 h-3 text-brand-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        ) : (
          <div 
            onClick={() => onNavigate('/configuracoes')}
            className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-950/60 border border-rose-800/60 cursor-pointer hover:border-rose-500/60 transition-all group animate-pulse"
            title="Clique para escanear o QR Code e conectar o WhatsApp"
          >
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span className="text-xs font-semibold text-rose-300 flex items-center gap-1.5">
              <QrCode className="w-3.5 h-3.5 text-rose-400" />
              WhatsApp Desconectado (Escanear QR)
            </span>
          </div>
        )}

        {/* Quick New Flow Action */}
        <Button
          size="sm"
          variant="primary"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => onNavigate('/fluxos')}
          className="hidden md:inline-flex"
        >
          Novo Fluxo
        </Button>

        {/* Notifications */}
        <div className="relative">
          <button
            className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors relative"
            title="Notificações do Sistema"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-brand-500 shadow-glow-brand" />
          </button>
        </div>

        {/* Admin Badge */}
        <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-white/5">
          <Badge variant="brand" dot>
            Admin Ativo
          </Badge>
        </div>
      </div>
    </header>
  );
};
