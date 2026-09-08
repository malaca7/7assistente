'use client';

import React, { useState } from 'react';
import { 
  Lock, 
  ArrowRight, 
  Store, 
  Users, 
  Shield, 
  Crown,
  Sparkles,
  Headphones,
  CheckCircle2
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

export default function LoginPage() {
  const { login, isLoading } = useAuth();
  const { success, error: toastError } = useToast();

  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('123456');
  const [selectedProfileHint, setSelectedProfileHint] = useState<'admin' | 'gerente' | 'atendimento'>('admin');

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
      const target = res.targetPath || '/admin';
      success('Acesso Autorizado!', `Redirecionando para ${target}...`);
      if (typeof window !== 'undefined') {
        window.history.pushState({}, '', target);
        window.location.href = target;
      }
    } else {
      toastError('Erro de Acesso', res.error || 'Credenciais inválidas. Verifique usuário e senha.');
    }
  };

  const setShortcutCredentials = (type: 'admin' | 'gerente' | 'atendimento') => {
    setSelectedProfileHint(type);
    if (type === 'admin') {
      setUsername('admin');
      setPassword('123456');
    } else if (type === 'gerente') {
      setUsername('gerente');
      setPassword('123456');
    } else {
      setUsername('atendente');
      setPassword('123456');
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden select-none">
      {/* Background Glows Premium */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-pitoco-blue/[0.04] rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-pitoco-pink/[0.04] rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <img 
            src="https://pitoco.malaca.com.br/logo.png" 
            onError={(e) => {
              e.currentTarget.src = '/logo.png';
            }}
            alt="Pitoco de Gente" 
            className="w-56 sm:w-64 max-w-[85%] h-auto mx-auto object-contain drop-shadow-2xl transition-transform hover:scale-[1.02] duration-300" 
          />
          <p className="text-xs text-zinc-400 font-medium">
            Plataforma Integrada de Gestão, Vendas & Atendimento WhatsApp
          </p>
        </div>

        {/* Login Card */}
        <Card className="p-6 sm:p-8 bg-[#0c0c0e] border border-white/10 rounded-2xl shadow-2xl backdrop-blur-xl space-y-5">
          {/* Seletor Rápido de Atalhos com Perfis Oficiais dos 3 Painéis */}
          <div className="pb-4 border-b border-white/[0.08]">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                Selecione o Painel para Acessar:
              </span>
              <span className="text-[9px] text-zinc-500 font-mono">Atalhos Rápidos</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {/* Atalho Admin */}
              <button
                type="button"
                onClick={() => setShortcutCredentials('admin')}
                className={`p-2.5 rounded-xl text-center border transition-all ${
                  selectedProfileHint === 'admin'
                    ? 'border-white bg-white/15 text-white font-semibold shadow-lg scale-[1.02]'
                    : 'border-white/5 bg-[#141416] text-zinc-400 hover:text-white hover:bg-[#1a1a1e]'
                }`}
              >
                <Crown className="w-4 h-4 mx-auto mb-1 text-amber-400" />
                <span className="text-[11px] font-bold block">Admin Geral</span>
                <span className="text-[8px] text-zinc-500 block">/admin</span>
              </button>

              {/* Atalho Gerente */}
              <button
                type="button"
                onClick={() => setShortcutCredentials('gerente')}
                className={`p-2.5 rounded-xl text-center border transition-all ${
                  selectedProfileHint === 'gerente'
                    ? 'border-emerald-500 bg-emerald-500/15 text-emerald-400 font-semibold shadow-lg scale-[1.02]'
                    : 'border-white/5 bg-[#141416] text-zinc-400 hover:text-white hover:bg-[#1a1a1e]'
                }`}
              >
                <Store className="w-4 h-4 mx-auto mb-1 text-emerald-400" />
                <span className="text-[11px] font-bold block">Painel Gestão</span>
                <span className="text-[8px] text-zinc-500 block">/gerente</span>
              </button>

              {/* Atalho Atendimento */}
              <button
                type="button"
                onClick={() => setShortcutCredentials('atendimento')}
                className={`p-2.5 rounded-xl text-center border transition-all ${
                  selectedProfileHint === 'atendimento'
                    ? 'border-pitoco-blue bg-pitoco-blue/15 text-pitoco-blue font-semibold shadow-lg scale-[1.02]'
                    : 'border-white/5 bg-[#141416] text-zinc-400 hover:text-white hover:bg-[#1a1a1e]'
                }`}
              >
                <Headphones className="w-4 h-4 mx-auto mb-1 text-pitoco-blue" />
                <span className="text-[11px] font-bold block">Atendimento</span>
                <span className="text-[8px] text-zinc-500 block">/atendimento</span>
              </button>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-zinc-300">
                  Usuário (Apenas Letras)
                </label>
                <span className="text-[10px] text-zinc-500 font-mono">Ex: admin, gerente, atendente</span>
              </div>
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
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-zinc-300">
                  Senha (Apenas Números)
                </label>
                <span className="text-[10px] text-zinc-500 font-mono">Padrão: 123456</span>
              </div>
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
              className="w-full bg-white hover:bg-zinc-200 text-black font-bold text-sm py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 mt-3"
            >
              {isLoading ? (
                <span>Validando Acessos...</span>
              ) : (
                <>
                  Entrar no Painel Autorizado
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>

          {/* Dica de Segurança e Permissões */}
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-[11px] text-zinc-400 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-zinc-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Redirecionamento Inteligente</span>
            </div>
            <p className="text-[10px] text-zinc-500 leading-relaxed">
              O sistema identifica automaticamente os painéis atribuídos ao seu usuário e direciona para a tela correspondente: Administrador (/admin), Gestão (/gerente) ou Atendimento (/atendimento).
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
