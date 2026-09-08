import { 
  Menu, 
  Bell, 
  ExternalLink,
  QrCode,
  Palette
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { useAuth } from '../../contexts/AuthContext';
import { useWhatsApp } from '../../contexts/WhatsAppContext';
import { useTheme } from '../../contexts/ThemeContext';
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
  const { openThemeModal } = useTheme();

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

        {/* Botão de Personalização de Tema */}
        <button
          type="button"
          onClick={openThemeModal}
          title="Personalizar Tema (Brilho, Contraste e Cores)"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-white/10 hover:border-white/20 bg-white/[0.03] hover:bg-white/10 text-zinc-300 hover:text-white transition-all group shadow-sm"
        >
          <Palette className="w-4 h-4 text-zinc-400 group-hover:text-white transition-transform group-hover:rotate-12" />
          <span className="text-xs font-semibold hidden md:inline">
            Tema
          </span>
        </button>

        {/* User Info & Portal Pill */}
        <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-white/10">
          <div className="text-right">
            <span className="text-xs font-bold text-white block leading-tight">
              {user?.name || user?.username || 'Usuário'}
            </span>
            <span className="text-[10px] text-zinc-400 font-mono">
              @{user?.username || 'acesso'}
            </span>
          </div>

          {/* Seletor rápido de painéis se o usuário tiver mais de 1 painel liberado */}
          {user?.panels && user.panels.length > 1 ? (
            <div className="flex items-center gap-1 bg-[#141416] p-1 rounded-xl border border-white/10">
              {user.panels.includes('admin') && (
                <button
                  type="button"
                  onClick={() => onNavigate('/admin')}
                  title="Ir para Painel Administrador"
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all ${
                    window.location.pathname.startsWith('/admin')
                      ? 'bg-white text-black shadow-sm'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Admin
                </button>
              )}
              {user.panels.includes('gerente') && (
                <button
                  type="button"
                  onClick={() => onNavigate('/gerente')}
                  title="Ir para Painel Gestão"
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all ${
                    window.location.pathname.startsWith('/gerente')
                      ? 'bg-white text-black shadow-sm'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Gestão
                </button>
              )}
              {user.panels.includes('atendimento') && (
                <button
                  type="button"
                  onClick={() => onNavigate('/atendimento')}
                  title="Ir para Painel Atendimento"
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all ${
                    window.location.pathname.startsWith('/atendimento')
                      ? 'bg-white text-black shadow-sm'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Atendimento
                </button>
              )}
            </div>
          ) : (
            <span className="text-[10px] uppercase font-bold px-2.5 py-1 rounded-full bg-white/10 text-white border border-white/15">
              {user?.panels?.[0] === 'admin' ? '🛡️ Admin' : user?.panels?.[0] === 'gerente' ? '📊 Gestão' : '💬 Atendimento'}
            </span>
          )}
        </div>
      </div>
    </header>
  );
};
