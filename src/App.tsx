import React, { useState, useEffect } from 'react';
import { useAuth } from './contexts/AuthContext';
import { LoginPage } from './pages/auth/LoginPage';
import { AdminLayout } from './components/layout/AdminLayout';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { FlowListPage } from './pages/flows/FlowListPage';
import { FlowEditorPage } from './pages/flows/FlowEditorPage';
import { ClientsPage } from './pages/clients/ClientsPage';
import { ConversationsPage } from './pages/conversations/ConversationsPage';
import { SettingsPage } from './pages/settings/SettingsPage';
import { AiAgentsPage } from './pages/ai-agents/AiAgentsPage';
import { AgendaPage } from './pages/agenda/AgendaPage';
import { ServicesAndHoursPage } from './pages/services-hours/ServicesAndHoursPage';

import { useAttendantAuth } from './contexts/AttendantAuthContext';
import { AttendantLoginPage } from './pages/attendant/AttendantLoginPage';
import { AttendantPortalPage } from './pages/attendant/AttendantPortalPage';

// New Public Client Queue, Barber Portal & Audit Logs Pages
import { ClientQueuePage } from './pages/public/ClientQueuePage';
import { BarberPortalPage } from './pages/barber/BarberPortalPage';
import { LogsPage } from './pages/logs/LogsPage';
import { UsersPage } from './pages/users/UsersPage';

const normalizePath = (rawPath: string) => {
  let clean = rawPath.replace(/^\/7assistente\/?/, '/');
  if (!clean.startsWith('/')) clean = `/${clean}`;
  return clean;
};

export const App: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const attendantAuth = useAttendantAuth();
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

  if (isLoading || attendantAuth.isLoading) {
    return (
      <div className="min-h-screen bg-dark-950 flex flex-col items-center justify-center text-slate-400 space-y-3">
        <div className="w-10 h-10 rounded-xl border-2 border-primary-500 border-t-transparent animate-spin" />
        <span className="text-xs font-semibold tracking-wider text-slate-300">
          Carregando 7 Assistente...
        </span>
      </div>
    );
  }

  // 1. External Public Queue & Client Live Schedule Page (Root /)
  if (currentPath === '/' || currentPath === '/fila' || currentPath === '/horarios') {
    return <ClientQueuePage onNavigate={navigate} />;
  }

  // 2. Dedicated Barber Portal (/barbeiro)
  if (currentPath === '/barbeiro' || currentPath.startsWith('/barbeiro/')) {
    return <BarberPortalPage onNavigate={navigate} />;
  }

  // 3. Attendant Portal Routes (/relacionamento or /atendente)
  if (
    currentPath === '/relacionamento' ||
    currentPath === '/atendente' ||
    currentPath === '/atendimento-equipe' ||
    currentPath.startsWith('/relacionamento/') ||
    currentPath.startsWith('/atendente/')
  ) {
    if (!attendantAuth.isAuthenticated) {
      return <AttendantLoginPage onNavigate={navigate} />;
    }
    return <AttendantPortalPage onNavigate={navigate} />;
  }

  // 4. Admin Not authenticated -> show Admin Login
  if (!isAuthenticated) {
    return <LoginPage onNavigate={navigate} />;
  }

  // 5. Flow editor route (e.g. /fluxos/flow-001)
  const flowEditorMatch = currentPath.match(/^\/fluxos\/(.+)$/);
  if (flowEditorMatch) {
    const flowId = flowEditorMatch[1];
    return <FlowEditorPage flowId={flowId} onNavigate={navigate} />;
  }

  // 6. Admin Layout Pages (/admin, /fluxos, /conversas, /clientes, /agenda, /configuracoes, /logs)
  let title = 'Dashboard';
  let subtitle = 'Visão geral da plataforma de atendimento e automação';
  let pageContent = <DashboardPage onNavigate={navigate} />;

  if (currentPath === '/fluxos') {
    title = 'Fluxos';
    subtitle = 'Gerencie e edite árvores de nós de automação';
    pageContent = <FlowListPage onNavigate={navigate} />;
  } else if (currentPath === '/conversas' || currentPath === '/atendimento') {
    title = 'Atendimento';
    subtitle = 'Histórico de mensagens e atendimento em tempo real no WhatsApp';
    pageContent = <ConversationsPage />;
  } else if (currentPath === '/clientes' || currentPath === '/contatos') {
    title = 'Clientes';
    subtitle = 'Histórico completo de atendimentos, agendamentos realizados, serviços e preferências';
    pageContent = <ClientsPage onNavigate={navigate} />;
  } else if (currentPath === '/agenda' || currentPath === '/agendamentos' || currentPath === '/servicos' || currentPath === '/expediente') {
    title = 'Agendamentos';
    subtitle = 'Gestão completa de horários marcados, catálogo de serviços e expediente de funcionamento';
    pageContent = <AgendaPage onNavigate={navigate} />;
  } else if (currentPath === '/logs' || currentPath === '/auditoria' || currentPath === '/revisao') {
    title = 'Logs & Auditoria';
    subtitle = 'Monitoramento em tempo real de mensagens, agendamentos e execuções do robô';
    pageContent = <LogsPage />;
  } else if (currentPath === '/usuarios' || currentPath === '/users') {
    title = 'Usuários & Permissões';
    subtitle = 'Gerenciamento de acessos aos painéis Admin, Atendimento e Barbeiro';
    pageContent = <UsersPage />;
  } else if (currentPath === '/configuracoes') {
    title = 'Configurações';
    subtitle = 'Perfil do assistente, integrações, banco de dados Supabase e preferências da plataforma';
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
