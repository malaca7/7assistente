import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Phone, Lock, Eye, EyeOff, ShieldCheck, Sparkles, ArrowRight, MessageCircle } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { loginWithPhone, isLoading } = useAuth();
  const { error: toastError, success: toastSuccess } = useToast();

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!phone) {
      setErrorMessage('Por favor, informe o número de telefone.');
      return;
    }
    if (!password) {
      setErrorMessage('Por favor, informe a senha de acesso.');
      return;
    }

    const res = await loginWithPhone(phone, password);
    if (!res.success) {
      setErrorMessage(res.error || 'Erro na autenticação');
      toastError('Falha no Login', res.error || 'Credenciais inválidas.');
    } else {
      toastSuccess('Acesso Autorizado', 'Bem-vindo ao painel 7 Assistente!');
    }
  };

  return (
    <div className="min-h-screen bg-dark-950 flex flex-col justify-center items-center p-4 relative overflow-hidden selection:bg-primary-500 selection:text-white">
      {/* Dynamic Background Glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-brand-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-md z-10 space-y-8 animate-in fade-in zoom-in-95 duration-300">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary-600 via-primary-500 to-brand-500 p-0.5 shadow-glow-primary mb-2">
            <div className="w-full h-full bg-dark-950 rounded-[14px] flex items-center justify-center">
              <span className="font-display font-black text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-brand-400 text-3xl tracking-tighter">
                7
              </span>
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-white tracking-tight">
            7 Assistente
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xs mx-auto">
            Plataforma de Automação e Inteligência de Chatbots para WhatsApp Business
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-dark-900/90 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl shadow-black/60 space-y-6">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-white tracking-tight">Painel Administrativo</h2>
            <p className="text-xs text-slate-400">
              Acesse utilizando seu telefone administrativo e senha cadastrada.
            </p>
          </div>

          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-950/50 border border-rose-800/60 text-xs text-rose-300 flex items-start gap-2.5 animate-in fade-in">
              <ShieldCheck className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Telefone com DDD"
              placeholder="(11) 99999-8888"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              leftIcon={<Phone className="w-4 h-4" />}
              autoComplete="tel"
              required
            />

            <Input
              label="Senha de Acesso"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-slate-400 hover:text-slate-200 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
              autoComplete="current-password"
              required
            />

            <Button
              type="submit"
              variant="brand"
              size="lg"
              className="w-full font-bold"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Entrar na Plataforma
            </Button>
          </form>
        </div>

        {/* Security Footer Notice */}
        <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-brand-400" />
          <span>Sessão segura criptografada com Meta Cloud API Token Vault</span>
        </div>
      </div>
    </div>
  );
};
