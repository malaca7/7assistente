import { UserPermissions } from '../types';

export interface PermissionOption {
  key: keyof UserPermissions;
  label: string;
  description: string;
  portal?: string;
}

export interface PermissionCategory {
  id: string;
  title: string;
  description: string;
  iconName: string;
  options: PermissionOption[];
}

export interface RoleConfig {
  id: 'admin' | 'barber' | 'attendant' | 'manager' | 'custom';
  name: string;
  badgeLabel: string;
  description: string;
  color: string;
  bgLight: string;
  borderColor: string;
  permissions: UserPermissions;
}

// 1. Catálogo unificado de todas as permissões do sistema (sincronizado entre Usuários e Cargos)
export const SYSTEM_PERMISSION_CATEGORIES: PermissionCategory[] = [
  {
    id: 'portals',
    title: 'Portais de Acesso',
    description: 'Controla quais painéis e interfaces o usuário/cargo pode acessar',
    iconName: 'ShieldCheck',
    options: [
      {
        key: 'can_access_admin',
        label: 'Painel Administrativo (/admin)',
        description: 'Acesso às telas de gestão geral, fluxos, catálogo e relatórios da barbearia',
        portal: 'Admin',
      },
      {
        key: 'can_access_atendimento',
        label: 'Painel de Atendimento (/atendente)',
        description: 'Acesso ao chat em tempo real do WhatsApp para atendimento humano',
        portal: 'Atendente',
      },
      {
        key: 'can_access_barbeiro',
        label: 'Portal do Barbeiro (/barbeiro)',
        description: 'Acesso à cadeira de corte, visualização de fila e gestão de horários',
        portal: 'Barbeiro',
      },
    ],
  },
  {
    id: 'management',
    title: 'Módulos de Gestão',
    description: 'Permissões específicas para módulos centrais da plataforma',
    iconName: 'Sliders',
    options: [
      {
        key: 'can_manage_agenda',
        label: 'Agendamentos & Expediente',
        description: 'Visualizar agenda, criar e reagendar horários e gerenciar catálogo de serviços',
      },
      {
        key: 'can_manage_clients',
        label: 'Gestão de Clientes',
        description: 'Consultar fichas de clientes, histórico de cortes, contatos e preferências',
      },
      {
        key: 'can_manage_conversations',
        label: 'Conversas & Chat WhatsApp',
        description: 'Assumir conversas, responder clientes, transferir e pausar automação',
      },
      {
        key: 'can_manage_flows',
        label: 'Fluxos do Robô',
        description: 'Criar, editar e publicar fluxos de nós e automações do assistente',
      },
      {
        key: 'can_manage_users',
        label: 'Usuários & Permissões',
        description: 'Gerenciar equipe, criar novos usuários e definir permissões de cargos',
      },
      {
        key: 'can_manage_settings',
        label: 'Configurações do Sistema',
        description: 'Conexão QR Code WhatsApp, dados da empresa, chaves PIX e inteligência artificial',
      },
      {
        key: 'can_view_logs',
        label: 'Logs & Auditoria',
        description: 'Consultar logs de auditoria, eventos de agendamento e execuções do robô',
      },
    ],
  },
  {
    id: 'actions',
    title: 'Ações Operacionais',
    description: 'Regras de execução para atendimentos e mensagens',
    iconName: 'Sparkles',
    options: [
      {
        key: 'can_create_appointments',
        label: 'Criar Novos Agendamentos',
        description: 'Inserir agendamentos manuais diretamente na grade de horários',
      },
      {
        key: 'can_cancel_appointments',
        label: 'Cancelar / Excluir Agendamentos',
        description: 'Permite cancelar compromissos marcados ou remover horários da agenda',
      },
      {
        key: 'can_send_whatsapp_messages',
        label: 'Disparar Mensagens WhatsApp',
        description: 'Enviar mensagens ativas para clientes pelo número conectado',
      },
    ],
  },
];

// 2. Perfis padrão de Cargos
export const DEFAULT_ROLE_CONFIGS: Record<string, RoleConfig> = {
  admin: {
    id: 'admin',
    name: 'Administrador',
    badgeLabel: 'Admin Total',
    description: 'Acesso irrestrito a todos os painéis, módulos, configurações e financeiro.',
    color: 'emerald',
    bgLight: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    borderColor: 'border-emerald-500/40',
    permissions: {
      can_access_admin: true,
      can_access_atendimento: true,
      can_access_barbeiro: true,
      can_manage_agenda: true,
      can_manage_clients: true,
      can_manage_conversations: true,
      can_manage_flows: true,
      can_manage_users: true,
      can_manage_settings: true,
      can_view_logs: true,
      can_create_appointments: true,
      can_cancel_appointments: true,
      can_send_whatsapp_messages: true,
    },
  },
  manager: {
    id: 'manager',
    name: 'Gerente / Supervisor',
    badgeLabel: 'Gerência',
    description: 'Acesso administrativo e operacional, com exceção de configurações críticas de sistema.',
    color: 'purple',
    bgLight: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    borderColor: 'border-purple-500/40',
    permissions: {
      can_access_admin: true,
      can_access_atendimento: true,
      can_access_barbeiro: true,
      can_manage_agenda: true,
      can_manage_clients: true,
      can_manage_conversations: true,
      can_manage_flows: false,
      can_manage_users: false,
      can_manage_settings: false,
      can_view_logs: true,
      can_create_appointments: true,
      can_cancel_appointments: true,
      can_send_whatsapp_messages: true,
    },
  },
  barber: {
    id: 'barber',
    name: 'Barbeiro / Profissional',
    badgeLabel: 'Barbeiro',
    description: 'Acesso focado na cadeira de corte, visualização de horários e lista de clientes.',
    color: 'amber',
    bgLight: 'bg-brand-500/10 text-brand-400 border-brand-500/30',
    borderColor: 'border-brand-500/40',
    permissions: {
      can_access_admin: false,
      can_access_atendimento: false,
      can_access_barbeiro: true,
      can_manage_agenda: true,
      can_manage_clients: true,
      can_manage_conversations: false,
      can_manage_flows: false,
      can_manage_users: false,
      can_manage_settings: false,
      can_view_logs: false,
      can_create_appointments: true,
      can_cancel_appointments: false,
      can_send_whatsapp_messages: false,
    },
  },
  attendant: {
    id: 'attendant',
    name: 'Atendente / Recepção',
    badgeLabel: 'Atendimento',
    description: 'Acesso ao chat em tempo real do WhatsApp e marcação de horários na agenda.',
    color: 'blue',
    bgLight: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    borderColor: 'border-blue-500/40',
    permissions: {
      can_access_admin: false,
      can_access_atendimento: true,
      can_access_barbeiro: false,
      can_manage_agenda: true,
      can_manage_clients: true,
      can_manage_conversations: true,
      can_manage_flows: false,
      can_manage_users: false,
      can_manage_settings: false,
      can_view_logs: false,
      can_create_appointments: true,
      can_cancel_appointments: true,
      can_send_whatsapp_messages: true,
    },
  },
  custom: {
    id: 'custom',
    name: 'Personalizado',
    badgeLabel: 'Custom',
    description: 'Permissões sob medida definidas individualmente para este usuário.',
    color: 'slate',
    bgLight: 'bg-slate-500/10 text-slate-300 border-slate-500/30',
    borderColor: 'border-slate-500/40',
    permissions: {
      can_access_admin: false,
      can_access_atendimento: false,
      can_access_barbeiro: false,
      can_manage_agenda: false,
      can_manage_clients: false,
      can_manage_conversations: false,
      can_manage_flows: false,
      can_manage_users: false,
      can_manage_settings: false,
      can_view_logs: false,
      can_create_appointments: false,
      can_cancel_appointments: false,
      can_send_whatsapp_messages: false,
    },
  },
};

// 3. Verifica se as permissões de um usuário correspondem exatamente a um cargo existente
export function getMatchingRole(
  perms: UserPermissions,
  roleConfigs: Record<string, RoleConfig> = DEFAULT_ROLE_CONFIGS
): 'admin' | 'barber' | 'attendant' | 'manager' | 'custom' {
  const roles: Array<'admin' | 'barber' | 'attendant' | 'manager'> = ['admin', 'manager', 'barber', 'attendant'];

  for (const roleId of roles) {
    const roleConfig = roleConfigs[roleId];
    if (!roleConfig) continue;

    let matches = true;
    for (const cat of SYSTEM_PERMISSION_CATEGORIES) {
      for (const opt of cat.options) {
        const userVal = Boolean(perms[opt.key]);
        const roleVal = Boolean(roleConfig.permissions[opt.key]);
        if (userVal !== roleVal) {
          matches = false;
          break;
        }
      }
      if (!matches) break;
    }

    if (matches) return roleId;
  }

  return 'custom';
}

// 4. Copia permissões de um cargo
export function cloneRolePermissions(
  roleId: string,
  roleConfigs: Record<string, RoleConfig> = DEFAULT_ROLE_CONFIGS
): UserPermissions {
  const cfg = roleConfigs[roleId] || DEFAULT_ROLE_CONFIGS[roleId] || DEFAULT_ROLE_CONFIGS.barber;
  return { ...cfg.permissions };
}
