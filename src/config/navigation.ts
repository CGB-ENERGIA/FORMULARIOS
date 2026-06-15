export interface NavItem {
  title: string;
  caption?: string;
  icon: string;
  route?: string;
  externalUrl?: string;
  locked?: boolean;
}

export const APP_NAME = 'Formulários';

/** URL do projeto externo — atualizar quando o link for definido. */
export const EXTERNAL_PROJECT_URL = 'https://eme-app.vercel.app/';

export function isExternalNavItem(item: NavItem): boolean {
  return item.externalUrl !== undefined;
}

export function getNavItemKey(item: NavItem): string {
  return item.route ?? item.externalUrl ?? item.title;
}

export const navItems: NavItem[] = [
  {
    title: 'Início',
    caption: 'Visão geral',
    icon: 'home',
    route: '/',
  },
  {
    title: 'CONSUMIDORES',
    caption: 'Relação na obra',
    icon: 'groups',
    route: '/consumidores',
  },
  {
    title: 'DESLIGAMENTO',
    caption: 'Relação de desligamento',
    icon: 'power_off',
    route: '/desligamento',
  },
  {
    title: 'ARRASTO',
    caption: 'Formulário de arrasto',
    icon: 'swap_horiz',
    route: '/arrasto',
  },
  {
    title: 'PODA',
    caption: 'Relatório de evidências',
    icon: 'forest',
    route: '/poda',
  },
  {
    title: 'CALÇADA',
    caption: 'Reparo de calçadas',
    icon: 'dashboard',
    route: '/calcada',
  },
  {
    title: 'EMERGENCIAL',
    caption: 'Acessar outro projeto',
    icon: 'open_in_new',
    externalUrl: EXTERNAL_PROJECT_URL,
    locked: true,
  },
];
