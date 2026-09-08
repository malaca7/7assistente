'use client';

import React, { useState } from 'react';
import { 
  Lock, 
  ArrowRight, 
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

    if (!/^[a-zA-Z]+$/.test(username)) {
      toastError('Usuário Inválido', 'O usuário deve conter apenas letras (sem números ou símbolos).');
      return;
    }
    if (!/^[0-9]+$/.test(password)) {
      toastError('Senha Inválida', 'A senha deve conter apenas números.');
      return;
    }

    const res = await login(username, password);
    if (res.success) {
      success('Bem-vindo(a)!', 'Acessando o painel de controle...');
      if (typeof window !== 'undefined') {
        window.location.href = '/admin';
      }
    } else {
      toastError('Erro de Acesso', res.error || 'Credenciais não conferem');
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
    <div className="min-h-screen bg-black flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden select-none">
      {/* Subtle Background Glows (Neutral Deep Carbon, No Blue) */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-white/[0.02] rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-white/[0.02] rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Brand Header: Logo Grande e Sem Borda */}
        <div className="text-center">
          <img 
            src="https://pitoco.malaca.com.br/logo.png" 
            onError={(e) => {
              // Fallback gracioso local
              e.currentTarget.src = '/logo.png';
            }}
            alt="Pitoco de Gente" 
            className="w-56 sm:w-64 max-w-[88%] h-auto mx-auto object-contain drop-shadow-2xl transition-transform hover:scale-[1.02] duration-300" 
          />
        </div>

        {/* Login Card */}
        <Card className="p-6 sm:p-8 bg-[#0c0c0e] border border-white/10 rounded-2xl shadow-2xl backdrop-blur-xl">
          {/* Seletor Rápido de Papéis para Demonstração e Testes */}
          <div className="mb-6 pb-4 border-b border-white/[0.08]">
            <span className="text-[10px] font-semibold text-zinc-400 block mb-2.5 text-center uppercase tracking-widest">
              Perfil de Acesso:
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setRoleCredentials('ceo')}
                className={`p-2.5 rounded-xl text-center border transition-all ${
                  selectedRoleHint === 'ceo'
                    ? 'border-white bg-white/10 text-white font-semibold shadow-md'
                    : 'border-white/5 bg-[#141416] text-zinc-400 hover:text-white hover:bg-[#1a1a1e]'
                }`}
              >
                <Crown className="w-4 h-4 mx-auto mb-1 text-amber-400" />
                <span className="text-[11px] font-bold block">CEO</span>
                <span className="text-[8px] text-zinc-500 block">@ceo</span>
              </button>

              <button
                type="button"
                onClick={() => setRoleCredentials('manager')}
                className={`p-2.5 rounded-xl text-center border transition-all ${
                  selectedRoleHint === 'manager'
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 font-semibold shadow-md'
                    : 'border-white/5 bg-[#141416] text-zinc-400 hover:text-white hover:bg-[#1a1a1e]'
                }`}
              >
                <Store className="w-4 h-4 mx-auto mb-1 text-emerald-400" />
                <span className="text-[11px] font-bold block">Gerente</span>
                <span className="text-[8px] text-zinc-500 block">@gerente</span>
              </button>

              <button
                type="button"
                onClick={() => setRoleCredentials('attendant')}
                className={`p-2.5 rounded-xl text-center border transition-all ${
                  selectedRoleHint === 'attendant'
                    ? 'border-pink-500 bg-pink-500/10 text-pink-400 font-semibold shadow-md'
                    : 'border-white/5 bg-[#141416] text-zinc-400 hover:text-white hover:bg-[#1a1a1e]'
                }`}
              >
                <Heart className="w-4 h-4 mx-auto mb-1 text-pink-400" />
                <span className="text-[11px] font-bold block">Consultora</span>
                <span className="text-[8px] text-zinc-500 block">@consultora</span>
              </button>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-zinc-300 block mb-1.5">
                Usuário
              </label>
              <div className="relative">
                <Users className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value.replace(/[^a-zA-Z]/g, '').toLowerCase())}
                  placeholder="Seu usuário"
                  className="w-full pl-10 pr-3.5 py-3 bg-[#141416] border border-white/10 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-colors"
                  required
                  autoCapitalize="none"
                  autoCorrect="off"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-300 block mb-1.5">
                Senha
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  onChange={e => setPassword(e.target.value.replace(/\D/g, ''))}
                  placeholder="Sua senha numérica"
                  className="w-full pl-10 pr-3.5 py-3 bg-[#141416] border border-white/10 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-colors tracking-widest font-mono"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-white hover:bg-zinc-200 text-black font-bold text-sm py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 mt-2"
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
        </Card>
      </div>
    </div>
  );
}
