import React, { useState, useEffect } from 'react';
import { useAuth } from './contexts/AuthContext';
import { LoginPage } from './pages/auth/LoginPage';
import { AdminLayout } from './components/layout/AdminLayout';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { FlowListPage } from './pages/flows/FlowListPage';
import { FlowEditorPage } from './pages/flows/FlowEditorPage';
import { ContactsPage } from './pages/contacts/ContactsPage';
import { ConversationsPage } from './pages/conversations/ConversationsPage';
import { SettingsPage } from './pages/settings/SettingsPage';
import { AiAgentsPage } from './pages/ai-agents/AiAgentsPage';
import { AgendaPage } from './pages/agenda/AgendaPage';

const normalizePath = (rawPath: string) => {
  let clean = rawPath.replace(/^\/7assistente\/?/, '/');
  if (!clean.startsWith('/')) clean = `/${clean}`;
  return clean;
};

export const App: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [currentPath, setCurrentPath] = useState<string>(() => {
    return normalizePath(window.location.pathname || '/');
  });

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(normalizePath(window.location.pathname || '/'));
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path: string) => {
    const isGitHubPages = window.location.pathname.startsWith('/7assistente');
    const targetUrl = isGitHubPages ? `/7assistente${path === '/' ? '' : path}` : path;
    window.history.pushState({}, '', targetUrl);
    setCurrentPath(normalizePath(path));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-950 flex flex-col items-center justify-center text-slate-400 space-y-3">
        <div className="w-10 h-10 rounded-xl border-2 border-primary-500 border-t-transparent animate-spin" />
        <span className="text-xs font-semibold tracking-wider text-slate-300">
          Carregando 7 Assistente...
        </span>
      </div>
    );
  }

  // Not authenticated -> show Login
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // Check if viewing flow editor (e.g. /fluxos/flow-001)
  const flowEditorMatch = currentPath.match(/^\/fluxos\/(.+)$/);
  if (flowEditorMatch) {
    const flowId = flowEditorMatch[1];
    return <FlowEditorPage flowId={flowId} onNavigate={navigate} />;
  }

  // Get current page details for AdminLayout
  let title = 'Dashboard';
  let subtitle = 'Visão geral da plataforma de atendimento e automação';
  let pageContent = <DashboardPage onNavigate={navigate} />;

  if (currentPath === '/fluxos') {
    title = 'Construtor de Fluxos';
    subtitle = 'Gerencie e edite árvores de nós de automação';
    pageContent = <FlowListPage onNavigate={navigate} />;
  } else if (currentPath === '/conversas') {
    title = 'Conversas & Atendimento';
    subtitle = 'Histórico e transferências de atendimento no WhatsApp';
    pageContent = <ConversationsPage />;
  } else if (currentPath === '/contatos') {
    title = 'Contatos & Segmentos';
    subtitle = 'Base unificada de contatos e tags';
    pageContent = <ContactsPage onNavigate={navigate} />;
  } else if (currentPath === '/agenda') {
    title = 'Agenda & Compromissos';
    subtitle = 'Gerenciador de horários marcados e regras de atendimento';
    pageContent = <AgendaPage onNavigate={navigate} />;
  } else if (currentPath === '/agentes-ia') {
    title = 'Agentes de IA';
    subtitle = 'Configuração de inteligência artificial e bases de conhecimento';
    pageContent = <AiAgentsPage />;
  } else if (currentPath === '/configuracoes') {
    title = 'Configurações';
    subtitle = 'Perfil e identidade do bot, variáveis globais e Meta WhatsApp API';
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
