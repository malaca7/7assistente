import React, { useState } from 'react';
import { 
  Scissors, 
  Lock, 
  Phone, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles, 
  ExternalLink,
  Clock,
  Eye,
  EyeOff
} from 'lucide-react';
import { StorageService } from '../../lib/storage';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../contexts/ToastContext';
import { SystemUser } from '../../types';

interface BarberLoginPageProps {
  onSuccess: (user: SystemUser) => void;
  onNavigate: (path: string) => void;
}

export const BarberLoginPage: React.FC<BarberLoginPageProps> = ({ onSuccess, onNavigate }) => {
  const { success, error: toastError } = useToast();
  const [phone, setPhone] = useState('81996138924');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!phone.trim()) {
      setErrorMessage('Informe seu número de telefone cadastrado.');
      return;
    }
    if (!password.trim()) {
      setErrorMessage('Informe sua senha ou PIN de acesso.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await StorageService.verifyUserAccess(phone, password, 'can_access_barbeiro');
      if (res.success && res.user) {
        StorageService.setBarberSession({ authenticated: true, user: res.user });
        success('Bem-vindo!', `Acesso liberado para ${res.user.name}`);
        onSuccess(res.user);
      } else {
        setErrorMessage(res.error || 'Acesso não autorizado para o painel do barbeiro.');
        toastError('Acesso Negado', res.error || 'Credenciais inválidas.');
      }
    } catch (err) {
      setErrorMessage('Erro ao conectar ao servidor de autenticação.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-950 flex flex-col justify-center items-center p-4 relative overflow-hidden selection:bg-brand-500 selection:text-white">
      {/* Background Decorative Glows */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-brand-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md z-10 space-y-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 p-0.5 shadow-xl shadow-brand-500/20 mb-2">
            <div className="w-full h-full bg-dark-950 rounded-[14px] flex items-center justify-center">
              <Scissors className="w-8 h-8 text-brand-400" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Painel do Barbeiro
          </h1>
          <p className="text-xs text-slate-400">
            Acesso restrito para barbeiros e profissionais autorizados
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-dark-900/90 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5">
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-white">Identificação do Profissional</h2>
            <p className="text-xs text-slate-400">
              Digite seu número de WhatsApp e sua senha/PIN cadastrados no sistema.
            </p>
          </div>

          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-950/50 border border-rose-800/60 text-xs text-rose-300 flex items-start gap-2.5 animate-in fade-in">
              <ShieldCheck className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Telefone com DDD</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(81) 99613-8924"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-dark-950 rounded-xl border border-white/10 text-white placeholder-slate-500 text-sm font-mono focus:outline-none focus:border-brand-500 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Senha ou PIN</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-dark-950 rounded-xl border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-brand-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              variant="brand"
              size="lg"
              className="w-full font-bold shadow-glow-brand"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Acessar Painel da Cadeira
            </Button>
          </form>

          <div className="pt-2 border-t border-white/5 flex flex-col gap-2 text-center text-xs">
            <button
              type="button"
              onClick={() => onNavigate('/')}
              className="text-slate-400 hover:text-brand-300 transition-colors"
            >
              ← Voltar para a Fila de Clientes
            </button>

            <button
              type="button"
              onClick={() => onNavigate('/admin')}
              className="text-slate-500 hover:text-slate-300 transition-colors text-[11px]"
            >
              Acesso ao Painel Administrativo Geral
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
