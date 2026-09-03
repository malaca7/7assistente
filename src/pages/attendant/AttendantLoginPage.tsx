import React, { useState } from 'react';
import { 
  UserCheck, 
  Lock, 
  Mail, 
  ArrowRight, 
  Sparkles, 
  Shield, 
  Headphones, 
  CheckCircle2, 
  ChevronRight,
  LogIn,
  LayoutDashboard
} from 'lucide-react';
import { useAttendantAuth } from '../../contexts/AttendantAuthContext';
import { useToast } from '../../contexts/ToastContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Attendant } from '../../types';

interface AttendantLoginPageProps {
  onNavigate: (path: string) => void;
}

export const AttendantLoginPage: React.FC<AttendantLoginPageProps> = ({ onNavigate }) => {
  const { login, attendants } = useAttendantAuth();
  const { success, error: toastError } = useToast();
  
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [selectedAttendant, setSelectedAttendant] = useState<Attendant | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSelectQuickAttendant = (att: Attendant) => {
    setSelectedAttendant(att);
    setIdentifier(att.email);
    setPassword(att.password || '123');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      toastError('Identificação obrigatória', 'Informe seu e-mail ou telefone cadastrado.');
      return;
    }
    if (!password) {
      toastError('Senha obrigatória', 'Digite sua senha de acesso.');
      return;
    }

    setIsSubmitting(true);
    try {
      const ok = await login(identifier, password);
      if (ok) {
        success('Bem-vindo(a)!', 'Acesso liberado à central de relacionamento e atendimento.');
      } else {
        toastError('Credenciais inválidas', 'Verifique o e-mail/telefone e a senha digitada.');
      }
    } catch (err: any) {
      toastError('Erro de autenticação', err.message || 'Falha no login.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-950 text-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden selection:bg-brand-500 selection:text-white">
      {/* Dynamic Background Glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-brand-600/20 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-emerald-600/20 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-600/10 rounded-full blur-[160px] pointer-events-none" />

      <div className="w-full max-w-md z-10 space-y-6 animate-in fade-in zoom-in-95 duration-300">
        {/* Header / Logo */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-brand-600 via-brand-500 to-emerald-400 shadow-glow-brand mb-2">
            <Headphones className="w-8 h-8 text-white stroke-[2.5]" />
          </div>
          <h1 className="text-2xl font-display font-black text-white tracking-tight flex items-center justify-center gap-2">
            Portal de Atendimento
            <Badge variant="brand" className="text-[10px] py-0 px-2 uppercase font-bold">Relacionamento</Badge>
          </h1>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            Acesso exclusivo para atendentes e operadores. Assuma e responda conversas no WhatsApp em tempo real.
          </p>
        </div>

        {/* Quick Profile Selectors */}
        {attendants.length > 0 && (
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block text-center">
              Selecione seu Perfil de Atendente
            </label>
            <div className="grid grid-cols-3 gap-2">
              {attendants.map((att) => {
                const isSelected = selectedAttendant?.id === att.id || identifier.toLowerCase() === att.email.toLowerCase();
                return (
                  <button
                    key={att.id}
                    type="button"
                    onClick={() => handleSelectQuickAttendant(att)}
                    className={`p-2.5 rounded-2xl border transition-all text-center flex flex-col items-center gap-1.5 group ${
                      isSelected
                        ? 'bg-brand-500/20 border-brand-500 shadow-glow-brand ring-2 ring-brand-500/30'
                        : 'bg-dark-900/80 border-white/5 hover:border-white/20 hover:bg-dark-850'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full overflow-hidden border border-brand-500/30 bg-dark-800 flex items-center justify-center text-xs font-bold text-brand-300 flex-shrink-0">
                      {att.avatar_url ? (
                        <img src={att.avatar_url} alt={att.name} className="w-full h-full object-cover" />
                      ) : (
                        att.name.substring(0, 2).toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0 w-full">
                      <p className="text-xs font-bold text-white truncate group-hover:text-brand-300">{att.name}</p>
                      <p className="text-[9px] text-slate-400 truncate">{att.department || 'Atendimento'}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Login Form */}
        <div className="bg-dark-900/90 backdrop-blur-2xl p-6 rounded-3xl border border-white/10 shadow-2xl space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-brand-400" />
                E-mail ou Telefone do Atendente
              </label>
              <Input
                type="text"
                placeholder="Ex: sofia@barber.com ou 81988887777"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                className="bg-dark-950/80 border-white/10 focus:border-brand-500 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-brand-400" />
                Senha de Acesso
              </label>
              <Input
                type="password"
                placeholder="Digite sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-dark-950/80 border-white/10 focus:border-brand-500 text-sm"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full font-bold shadow-glow-brand"
              isLoading={isSubmitting}
              rightIcon={<LogIn className="w-4 h-4" />}
            >
              Entrar no Atendimento
            </Button>
          </form>
        </div>

        {/* Switch to Admin */}
        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => onNavigate('/')}
            className="text-xs text-slate-400 hover:text-white inline-flex items-center gap-1.5 py-1 px-3 rounded-full hover:bg-dark-900 transition-colors"
          >
            <LayoutDashboard className="w-3.5 h-3.5 text-brand-400" />
            É administrador? Acessar Painel Principal
          </button>
        </div>
      </div>
    </div>
  );
};
