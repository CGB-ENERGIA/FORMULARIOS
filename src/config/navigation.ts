export interface NavItem {
  title: string;
  caption?: string;
  icon: string;
  route: string;
}

export const APP_NAME = 'Formulários';

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
];
