export interface NavItem {
  title: string;
  caption?: string;
  icon: string;
  route?: string;
  externalUrl?: string;
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
    title: 'EMERGENCIAL',
    caption: 'Acessar outro projeto',
    icon: 'open_in_new',
    externalUrl: EXTERNAL_PROJECT_URL,
  },
];
