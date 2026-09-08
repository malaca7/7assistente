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
  id: string;
  name: string;
  badgeLabel: string;
  description: string;
  color: string;
  bgLight: string;
  borderColor: string;
  permissions: UserPermissions;
}

export const SYSTEM_PERMISSION_CATEGORIES: PermissionCategory[] = [
  {
    id: 'portals',
    title: 'Portais de Acesso',
    description: 'Controla quais painéis e interfaces o usuário pode acessar',
    iconName: 'ShieldCheck',
    options: [
      {
        key: 'can_access_admin',
        label: 'Painel Central (/admin)',
        description: 'Acesso à gestão geral da rede Pitoco de Gente e catálogo',
        portal: 'Admin',
      },
      {
        key: 'can_access_atendimento',
        label: 'Inbox Atendimento (/atendente)',
        description: 'Acesso ao chat em tempo real do WhatsApp para atendimento humano',
        portal: 'Atendente',
      },
      {
        key: 'can_access_loja',
        label: 'Gestão da Loja Física (/lojas)',
        description: 'Acesso ao gerenciamento da filial e pedidos locais',
        portal: 'Loja',
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
        key: 'can_manage_products',
        label: 'Catálogo de Produtos',
        description: 'Cadastrar, editar e excluir bodies, macacões, saídas e enxovais',
      },
      {
        key: 'can_manage_stores',
        label: 'Gestão da Rede de Lojas',
        description: 'Gerenciar filiais (Centro, Boulevard e E-commerce)',
      },
      {
        key: 'can_manage_clients',
        label: 'CRM de Clientes & Mamães',
        description: 'Consultar fichas de clientes, histórico de enxoval e compras',
      },
      {
        key: 'can_manage_conversations',
        label: 'Conversas & Chat WhatsApp',
        description: 'Assumir conversas, responder clientes e gerenciar transbordo',
      },
      {
        key: 'can_manage_flows',
        label: 'Fluxos do Robô',
        description: 'Criar e editar árvores de nós de atendimento e vendas',
      },
      {
        key: 'can_manage_users',
        label: 'Usuários & Permissões',
        description: 'Gerenciar consultoras, gerentes e permissões da equipe',
      },
      {
        key: 'can_manage_settings',
        label: 'Configurações do Sistema',
        description: 'Conexão QR Code WhatsApp, dados da empresa e chaves PIX',
      },
      {
        key: 'can_view_logs',
        label: 'Logs & Auditoria',
        description: 'Consultar logs de auditoria e execuções do robô',
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
        key: 'can_schedule_consultation',
        label: 'Agendar Consultoria VIP',
        description: 'Inserir agendamentos de consultoria de enxoval',
      },
      {
        key: 'can_send_whatsapp_messages',
        label: 'Disparar Mensagens WhatsApp',
        description: 'Enviar mensagens ativas para clientes pelo número conectado',
      },
      {
        key: 'can_manage_tickets',
        label: 'Gerenciar Tickets',
        description: 'Criar e resolver tickets de suporte ao cliente',
      },
    ],
  },
];

export const DEFAULT_ROLE_CONFIGS: Record<string, RoleConfig> = {
  ceo: {
    id: 'ceo',
    name: 'CEO / Diretoria da Rede',
    badgeLabel: 'CEO GLOBAL',
    description: 'Acesso completo a todas as lojas da rede, faturamento consolidado e relatórios.',
    color: 'emerald',
    bgLight: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    borderColor: 'border-emerald-500/40',
    permissions: {
      can_access_admin: true,
      can_access_atendimento: true,
      can_access_loja: true,
      can_view_all_stores: true,
      can_manage_products: true,
      can_manage_stores: true,
      can_manage_clients: true,
      can_manage_conversations: true,
      can_manage_flows: true,
      can_manage_users: true,
      can_manage_settings: true,
      can_view_logs: true,
      can_schedule_consultation: true,
      can_send_whatsapp_messages: true,
      can_manage_tickets: true,
      can_access_barbeiro: false,
      can_manage_agenda: true,
      can_create_appointments: true,
      can_cancel_appointments: true,
    },
  },
  admin: {
    id: 'admin',
    name: 'Administrador do Sistema',
    badgeLabel: 'ADMIN',
    description: 'Acesso irrestrito a todos os painéis, módulos, configurações e financeiro.',
    color: 'emerald',
    bgLight: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    borderColor: 'border-emerald-500/40',
    permissions: {
      can_access_admin: true,
      can_access_atendimento: true,
      can_access_loja: true,
      can_view_all_stores: true,
      can_manage_products: true,
      can_manage_stores: true,
      can_manage_clients: true,
      can_manage_conversations: true,
      can_manage_flows: true,
      can_manage_users: true,
      can_manage_settings: true,
      can_view_logs: true,
      can_schedule_consultation: true,
      can_send_whatsapp_messages: true,
      can_manage_tickets: true,
      can_access_barbeiro: false,
      can_manage_agenda: true,
      can_create_appointments: true,
      can_cancel_appointments: true,
    },
  },
  manager: {
    id: 'manager',
    name: 'Gerente de Filial',
    badgeLabel: 'GERÊNCIA',
    description: 'Acesso focado na gestão da sua unidade física (Centro ou Shopping Boulevard) e consultoras.',
    color: 'purple',
    bgLight: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    borderColor: 'border-purple-500/40',
    permissions: {
      can_access_admin: true,
      can_access_atendimento: true,
      can_access_loja: true,
      can_view_all_stores: false,
      can_manage_products: true,
      can_manage_stores: false,
      can_manage_clients: true,
      can_manage_conversations: true,
      can_manage_flows: false,
      can_manage_users: false,
      can_manage_settings: false,
      can_view_logs: true,
      can_schedule_consultation: true,
      can_send_whatsapp_messages: true,
      can_manage_tickets: true,
      can_access_barbeiro: false,
      can_manage_agenda: true,
      can_create_appointments: true,
      can_cancel_appointments: true,
    },
  },
  attendant: {
    id: 'attendant',
    name: 'Consultora VIP / Atendimento',
    badgeLabel: 'CONSULTORA',
    description: 'Acesso ao chat em tempo real do WhatsApp e consultorias VIP de enxoval.',
    color: 'zinc',
    bgLight: 'bg-zinc-800/70 text-zinc-200 border-zinc-700/60',
    borderColor: 'border-zinc-700/60',
    permissions: {
      can_access_admin: false,
      can_access_atendimento: true,
      can_access_loja: false,
      can_view_all_stores: false,
      can_manage_products: false,
      can_manage_stores: false,
      can_manage_clients: true,
      can_manage_conversations: true,
      can_manage_flows: false,
      can_manage_users: false,
      can_manage_settings: false,
      can_view_logs: false,
      can_schedule_consultation: true,
      can_send_whatsapp_messages: true,
      can_manage_tickets: true,
      can_access_barbeiro: false,
      can_manage_agenda: true,
      can_create_appointments: true,
      can_cancel_appointments: false,
    },
  },
  barber: {
    id: 'barber',
    name: 'Consultora Especialista',
    badgeLabel: 'ESPECIALISTA',
    description: 'Atendimento e consultoria personalizada de enxovais.',
    color: 'amber',
    bgLight: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    borderColor: 'border-amber-500/40',
    permissions: {
      can_access_admin: false,
      can_access_atendimento: true,
      can_access_loja: false,
      can_view_all_stores: false,
      can_manage_products: false,
      can_manage_stores: false,
      can_manage_clients: true,
      can_manage_conversations: true,
      can_manage_flows: false,
      can_manage_users: false,
      can_manage_settings: false,
      can_view_logs: false,
      can_schedule_consultation: true,
      can_send_whatsapp_messages: true,
      can_manage_tickets: true,
      can_access_barbeiro: false,
      can_manage_agenda: true,
      can_create_appointments: true,
      can_cancel_appointments: false,
    },
  },
  custom: {
    id: 'custom',
    name: 'Personalizado',
    badgeLabel: 'CUSTOM',
    description: 'Permissões sob medida definidas individualmente.',
    color: 'slate',
    bgLight: 'bg-slate-500/10 text-slate-300 border-slate-500/30',
    borderColor: 'border-slate-500/40',
    permissions: {
      can_access_admin: false,
      can_access_atendimento: false,
      can_access_loja: false,
      can_manage_products: false,
      can_manage_stores: false,
      can_manage_clients: false,
      can_manage_conversations: false,
      can_manage_flows: false,
      can_manage_users: false,
      can_manage_settings: false,
      can_view_logs: false,
      can_schedule_consultation: false,
      can_send_whatsapp_messages: false,
      can_manage_tickets: false,
    },
  },
};

export function getMatchingRole(
  perms: UserPermissions,
  roleConfigs: Record<string, RoleConfig> = DEFAULT_ROLE_CONFIGS
): string {
  const roles = ['ceo', 'admin', 'manager', 'attendant', 'barber'];

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

export function cloneRolePermissions(
  roleId: string,
  roleConfigs: Record<string, RoleConfig> = DEFAULT_ROLE_CONFIGS
): UserPermissions {
  const cfg = roleConfigs[roleId] || DEFAULT_ROLE_CONFIGS[roleId] || DEFAULT_ROLE_CONFIGS.attendant;
  return { ...cfg.permissions };
}

export function hasPermission(
  userPermissions: UserPermissions | undefined,
  permissionKey: keyof UserPermissions
): boolean {
  if (!userPermissions) return false;
  return Boolean(userPermissions[permissionKey]);
}
