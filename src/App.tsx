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

const normalizePath = (rawPath: string) => {
  let clean = rawPath.replace(/^\/pitocodegente\/?/, '/').replace(/^\/7assistente\/?/, '/');
  if (!clean.startsWith('/')) clean = `/${clean}`;
  return clean;
};

export const App: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [currentPath, setCurrentPath] = useState<string>(() => {
    return normalizePath(window.location.pathname || '/');
  });

  useEffect(() => {
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
      <div className="min-h-screen bg-dark-950 flex flex-col items-center justify-center text-slate-400 space-y-3">
        <div className="w-10 h-10 rounded-xl border-2 border-pitoco-blue border-t-transparent animate-spin" />
        <span className="text-xs font-semibold tracking-wider text-slate-300">
          Carregando Pitoco de Gente...
        </span>
      </div>
    );
  }

  // 1. Redirecionamento oficial: /ceo -> /admin
  if (currentPath === '/ceo') {
    navigate('/admin');
    return <AdminPage />;
  }

  // 2. Vitrine Pública (Root /, /catalogo, /enxoval, /medidas)
  if (currentPath === '/' || currentPath === '/catalogo' || currentPath === '/enxoval' || currentPath === '/fila') {
    return <StorefrontPage />;
  }

  // 3. Login direto
  if (currentPath === '/login') {
    if (isAuthenticated) {
      navigate('/admin');
      return <AdminPage />;
    }
    return <LoginPage />;
  }

  // 4. Se não estiver autenticado e tentar acessar rotas internas -> Login
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // 5. Painel Admin Unificado (/admin)
  if (currentPath === '/admin' || currentPath === '/dashboard') {
    return <AdminPage />;
  }

  // 6. Sub-páginas internas dentro do AdminLayout
  let title = 'Painel Administrativo';
  let subtitle = 'Gestão centralizada da rede Pitoco de Gente';
  let pageContent = <AdminPage />;

  if (currentPath === '/atendimento' || currentPath === '/conversas') {
    title = 'Inbox de Atendimento Humano';
    subtitle = 'Atendimento em tempo real com direcionamento por loja e transbordo';
    pageContent = <AtendimentoHumanoInbox onNavigate={navigate} />;
  } else if (currentPath === '/lojas' || currentPath === '/rede') {
    title = 'Rede de Lojas';
    subtitle = 'Gestão centralizada das unidades Centro, Shopping Boulevard e E-commerce';
    pageContent = <RedeLojasView onNavigate={navigate} />;
  } else if (currentPath === '/fluxos') {
    title = 'Fluxos de Atendimento';
    subtitle = 'Árvores de automação e vendas da Pitoco de Gente no WhatsApp';
    pageContent = <FlowBuilderView onNavigate={navigate} />;
  } else if (currentPath === '/whatsapp' || currentPath === '/qrcode') {
    title = 'Conexão WhatsApp Baileys';
    subtitle = 'Gerenciamento de sessão, QR Code e status do microsserviço Discloud';
    pageContent = <WhatsappConnectView />;
  } else if (currentPath === '/usuarios') {
    title = 'Usuários & Permissões';
    subtitle = 'Acesso por papéis: CEO (global), Gerentes (por filial) e Consultoras';
    pageContent = <UsersPage />;
  } else if (currentPath === '/logs') {
    title = 'Logs & Auditoria';
    subtitle = 'Histórico de eventos, transbordos e mensagens do sistema';
    pageContent = <LogsPage />;
  } else if (currentPath === '/configuracoes') {
    title = 'Configurações';
    subtitle = 'Perfil da empresa, integrações Supabase e preferências';
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
