import React, { useState, useEffect } from 'react';
import { useAuth } from './contexts/AuthContext';
import LoginPage from './app/login/page';
import AdminPage from './app/admin/page';
import StorefrontPage from './app/page';
import { AdminLayout } from './components/layout/AdminLayout';
import { RedeLojasView } from './components/RedeLojasView';
import { AtendimentoHumanoInbox } from './components/AtendimentoHumanoInbox';
import { FlowBuilderView } from './components/FlowBuilderView';
import { WhatsappConnectView } from './components/WhatsappConnectView';
import { SettingsPage } from './pages/settings/SettingsPage';
import { LogsPage } from './pages/logs/LogsPage';
import { UsersPage } from './pages/users/UsersPage';
import { ClientsPage } from './pages/clients/ClientsPage';

import { StorageService } from './lib/storage';

const normalizePath = (rawPath: string) => {
  let clean = rawPath.replace(/^\/pitocodegente\/?/, '/').replace(/^\/7assistente\/?/, '/');
  if (!clean.startsWith('/')) clean = `/${clean}`;
  if (clean.length > 1 && clean.endsWith('/')) clean = clean.slice(0, -1);
  return clean;
};

export const App: React.FC = () => {
  const { isAuthenticated, isLoading, isCEO, isManager, isAttendant } = useAuth();
  const [currentPath, setCurrentPath] = useState<string>(() => {
    return normalizePath(window.location.pathname || '/');
  });

  useEffect(() => {
    StorageService.syncAllFromBackend().catch(() => {});
    const handlePopState = () => {
      setCurrentPath(normalizePath(window.location.pathname || '/'));
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path: string) => {
    const clean = normalizePath(path);
    window.history.pushState({}, '', clean);
    setCurrentPath(clean);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-zinc-400 space-y-3">
        <div className="w-10 h-10 rounded-xl border-2 border-white border-t-transparent animate-spin" />
        <span className="text-xs font-semibold tracking-wider text-zinc-300">
          Carregando Pitoco de Gente...
        </span>
      </div>
    );
  }

  // 1. Redirecionamento oficial: /ceo -> /admin
  if (currentPath === '/ceo') {
    navigate('/admin');
  }

  // 2. Vitrine Pública (Root /, /enxoval, /medidas, /fila) - apenas quando não autenticado em admin
  if (currentPath === '/' || currentPath === '/enxoval' || currentPath === '/medidas' || currentPath === '/fila') {
    return <StorefrontPage />;
  }

  // 3. Login direto
  if (currentPath === '/login') {
    if (isAuthenticated) {
      navigate('/admin');
    } else {
      return <LoginPage />;
    }
  }

  // 4. Se não estiver autenticado e tentar acessar rotas internas -> Login
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // 5. Roteamento Interno Protegido — Todas as telas envoltas no AdminLayout (Barra Lateral Resizable)
  let title = 'Painel Administrativo';
  let subtitle = 'Gestão centralizada da rede Pitoco de Gente';
  let pageContent = <AdminPage onNavigate={navigate} activeTabProp="dashboard" />;

  if (currentPath === '/admin' || currentPath === '/dashboard') {
    title = isCEO ? 'Painel Executivo CEO' : isManager ? 'Painel de Gestão da Filial' : 'Painel de Atendimento VIP';
    subtitle = isCEO ? 'Métricas consolidadas da rede, robô e faturamento' : isManager ? 'Operação de loja, consultorias e estoque' : 'Conversas ativas, fila e catálogo rápido';
    pageContent = <AdminPage onNavigate={navigate} activeTabProp="dashboard" />;
  } else if (currentPath === '/catalogo' || currentPath === '/produtos') {
    title = 'Catálogo de Produtos & Estoque';
    subtitle = 'Gerenciamento completo de peças, tamanhos e preços';
    pageContent = <AdminPage onNavigate={navigate} activeTabProp="produtos" />;
  } else if (currentPath === '/bot_config' || currentPath === '/robo') {
    title = 'Parâmetros do Robô & PIX';
    subtitle = 'Chave PIX, fretes e mensagens automáticas do WhatsApp';
    pageContent = <AdminPage onNavigate={navigate} activeTabProp="bot_config" />;
  } else if (currentPath === '/tickets') {
    title = 'Tickets de Suporte & Protocolos';
    subtitle = 'Acompanhamento de solicitações e suporte a clientes';
    pageContent = <AdminPage onNavigate={navigate} activeTabProp="tickets" />;
  } else if (currentPath === '/clientes' || currentPath === '/crm' || currentPath === '/agendamentos' || currentPath === '/consultorias') {
    title = 'Gestão de Clientes & CRM';
    subtitle = 'Cadastro, histórico, tags e gerenciamento de contatos da rede';
    pageContent = <ClientsPage onNavigate={navigate} />;
  } else if (currentPath === '/atendimento' || currentPath === '/conversas') {
    title = 'Inbox de Atendimento Humano';
    subtitle = 'Atendimento em tempo real com direcionamento por loja e transbordo';
    pageContent = <AtendimentoHumanoInbox onNavigate={navigate} />;
  } else if (currentPath === '/lojas' || currentPath === '/rede') {
    title = 'Rede de Lojas';
    subtitle = 'Gestão centralizada das unidades Centro, Shopping Boulevard e E-commerce';
    pageContent = <RedeLojasView onNavigate={navigate} />;
  } else if (currentPath.startsWith('/fluxos')) {
    title = 'Studio de Fluxos de Atendimento';
    subtitle = 'Árvores de automação e nós de atendimento no WhatsApp';
    pageContent = <FlowBuilderView onNavigate={navigate} />;
  } else if (currentPath === '/whatsapp' || currentPath === '/qrcode') {
    title = 'Conexão WhatsApp Baileys';
    subtitle = 'Gerenciamento de sessão, QR Code e status do microsserviço Discloud';
    pageContent = <WhatsappConnectView />;
  } else if (currentPath === '/acessos' || currentPath === '/usuarios') {
    title = 'Gestão de Acessos & Usuários';
    subtitle = 'Controle de credenciais: CEO, Gerentes e Consultoras';
    pageContent = <UsersPage />;
  } else if (currentPath === '/logs') {
    title = 'Logs & Auditoria';
    subtitle = 'Histórico de eventos, transbordos e mensagens do sistema';
    pageContent = <LogsPage />;
  } else if (currentPath === '/configuracoes') {
    title = 'Configurações & Banco Supabase';
    subtitle = 'Perfil da empresa, status de sincronização e credenciais';
    pageContent = <SettingsPage />;
  }

  return (
    <AdminLayout
      title={title}
      subtitle={subtitle}
      currentPath={currentPath}
      onNavigate={navigate}
    >
      {pageContent}
    </AdminLayout>
  );
};
