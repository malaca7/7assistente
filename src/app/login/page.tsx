'use client';

import React, { useState } from 'react';
import { 
  Building2, 
  ShieldCheck, 
  Lock, 
  Phone, 
  ArrowRight, 
  Sparkles, 
  Store, 
  Users, 
  Heart,
  Crown
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

export default function LoginPage() {
  const { login, isLoading } = useAuth();
  const { success, error: toastError } = useToast();

  const [username, setUsername] = useState('ceo');
  const [password, setPassword] = useState('123456');
  const [selectedRoleHint, setSelectedRoleHint] = useState<'ceo' | 'manager' | 'attendant'>('ceo');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;

    // Validações
    if (!/^[a-zA-Z]+$/.test(username)) {
      toastError('Usuário Inválido', 'O usuário deve conter apenas letras (sem números, espaços ou símbolos).');
      return;
    }
    if (!/^[0-9]+$/.test(password)) {
      toastError('Senha Inválida', 'A senha deve conter apenas números (sem letras ou símbolos).');
      return;
    }

    const res = await login(username, password);
    if (res.success) {
      success('Login realizado com sucesso!', 'Redirecionando para o painel administrativo...');
      if (typeof window !== 'undefined') {
        window.location.href = '/admin';
      }
    } else {
      toastError('Erro no Login', res.error || 'Credenciais inválidas');
    }
  };

  const setRoleCredentials = (role: 'ceo' | 'manager' | 'attendant') => {
    setSelectedRoleHint(role);
    if (role === 'ceo') {
      setUsername('ceo');
      setPassword('123456');
    } else if (role === 'manager') {
      setUsername('gerente');
      setPassword('123456');
    } else {
      setUsername('consultora');
      setPassword('123456');
    }
  };

  return (
    <div className="min-h-screen bg-dark-950 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background Decorative Blur */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-pitoco-blue/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-pitoco-pink/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="w-24 h-24 mx-auto rounded-2xl overflow-hidden border-2 border-pitoco-blue/40 shadow-glow-primary p-1 bg-dark-900/60 flex items-center justify-center">
            <img 
              src="/logo.png" 
              alt="Logo Pitoco de Gente" 
              className="w-full h-full object-contain" 
            />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center justify-center gap-2">
              Pitoco de Gente
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Roupas de Bebê, Infantil e Enxovais • Portal Administrativo
            </p>
          </div>
        </div>

        {/* Login Card */}
        <Card className="p-6 md:p-8 bg-dark-900 border-white/10 shadow-2xl">
          {/* Seletor Rápido de Papéis para Demonstração e Testes */}
          <div className="mb-6 pb-4 border-b border-white/5">
            <span className="text-[11px] font-semibold text-slate-400 block mb-2 text-center uppercase tracking-wider">
              Selecione o Perfil de Acesso:
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setRoleCredentials('ceo')}
                className={`p-2 rounded-xl text-center border transition-all ${
                  selectedRoleHint === 'ceo'
                    ? 'border-pitoco-blue bg-pitoco-blue/15 text-pitoco-blue shadow-sm'
                    : 'border-white/5 bg-dark-800 text-slate-400 hover:text-white'
                }`}
              >
                <Crown className="w-4 h-4 mx-auto mb-1 text-pitoco-blue" />
                <span className="text-[10px] font-bold block">CEO</span>
                <span className="text-[8px] text-slate-500 block">@ceo</span>
              </button>

              <button
                type="button"
                onClick={() => setRoleCredentials('manager')}
                className={`p-2 rounded-xl text-center border transition-all ${
                  selectedRoleHint === 'manager'
                    ? 'border-emerald-500 bg-emerald-500/15 text-emerald-400 shadow-sm'
                    : 'border-white/5 bg-dark-800 text-slate-400 hover:text-white'
                }`}
              >
                <Store className="w-4 h-4 mx-auto mb-1 text-emerald-400" />
                <span className="text-[10px] font-bold block">Gerente</span>
                <span className="text-[8px] text-slate-500 block">@gerente</span>
              </button>

              <button
                type="button"
                onClick={() => setRoleCredentials('attendant')}
                className={`p-2 rounded-xl text-center border transition-all ${
                  selectedRoleHint === 'attendant'
                    ? 'border-pitoco-pink bg-pitoco-pink/15 text-pitoco-pink shadow-sm'
                    : 'border-white/5 bg-dark-800 text-slate-400 hover:text-white'
                }`}
              >
                <Heart className="w-4 h-4 mx-auto mb-1 text-pitoco-pink" />
                <span className="text-[10px] font-bold block">Consultora</span>
                <span className="text-[8px] text-slate-500 block">@consultora</span>
              </button>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Nome de Usuário:
                </label>
                <span className="text-[10px] text-pitoco-blue font-medium bg-pitoco-blue/10 px-2 py-0.5 rounded-full border border-pitoco-blue/20">
                  Apenas Letras [a-z]
                </span>
              </div>
              <div className="relative">
                <Users className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value.replace(/[^a-zA-Z]/g, '').toLowerCase())}
                  placeholder="ex: ceo, gerente, consultora"
                  className="w-full pl-9 pr-3 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pitoco-blue transition-colors font-mono"
                  required
                  autoCapitalize="none"
                  autoCorrect="off"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Senha de Acesso:
                </label>
                <span className="text-[10px] text-emerald-400 font-medium bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  Apenas Números [0-9]
                </span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  onChange={e => setPassword(e.target.value.replace(/\D/g, ''))}
                  placeholder="ex: 123456"
                  className="w-full pl-9 pr-3 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pitoco-blue transition-colors font-mono tracking-widest"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-pitoco-blue hover:bg-pitoco-blue/90 text-slate-950 font-bold text-xs py-3 rounded-xl transition-all shadow-glow-primary flex items-center justify-center gap-2 mt-2"
            >
              {isLoading ? (
                <span>Autenticando...</span>
              ) : (
                <>
                  Entrar no Painel
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t border-white/5 text-center">
            <span className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Acesso seguro com permissões RBAC no Supabase
            </span>
          </div>
        </Card>
      </div>
    </div>
  );
}
