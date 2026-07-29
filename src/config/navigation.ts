export type NavCategory = 'home' | 'operacao' | 'campo' | 'externo';

export interface NavItem {
  title: string;
  caption?: string;
  icon: string;
  route?: string;
  externalUrl?: string;
  locked?: boolean;
  category?: NavCategory;
}

export const APP_BRAND = 'CGB Engenharia';
export const APP_NAME = 'Portal';
export const APP_TAGLINE = 'Portal de Formulários';
export const APP_DESCRIPTION =
  'Ambiente único para preencher, exportar e enviar os formulários operacionais da obra.';

/** URL do projeto externo — atualizar quando o link for definido. */
export const EXTERNAL_PROJECT_URL = 'https://eme-app.vercel.app/';

export const NAV_CATEGORY_LABELS: Record<Exclude<NavCategory, 'home'>, string> = {
  operacao: 'Operação',
  campo: 'Campo',
  externo: 'Bloqueado',
};

export const NAV_CATEGORY_ORDER: Array<Exclude<NavCategory, 'home'>> = [
  'operacao',
  'campo',
  'externo',
];

export function isExternalNavItem(item: NavItem): boolean {
  return item.externalUrl !== undefined;
}

export function getNavItemKey(item: NavItem): string {
  return item.route ?? item.externalUrl ?? item.title;
}

export function isFormNavItem(item: NavItem): boolean {
  return Boolean(item.route && item.route !== '/' && !isExternalNavItem(item));
}

export const navItems: NavItem[] = [
  {
    title: 'Início',
    caption: 'Portal',
    icon: 'home',
    route: '/',
    category: 'home',
  },
  {
    title: 'CLIENTES',
    caption: 'Relação, cadastro e controle',
    icon: 'groups',
    route: '/clientes',
    category: 'operacao',
  },
  {
    title: 'DESLIGAMENTO',
    caption: 'Relação de desligamento',
    icon: 'power_off',
    route: '/desligamento',
    category: 'operacao',
  },
  {
    title: 'ARRASTO',
    caption: 'Formulário de arrasto',
    icon: 'swap_horiz',
    route: '/arrasto',
    category: 'campo',
  },
  {
    title: 'PODA',
    caption: 'Relatório de evidências',
    icon: 'forest',
    route: '/poda',
    category: 'campo',
  },
  {
    title: 'CALÇADA',
    caption: 'Reparo de calçadas',
    icon: 'grid_view',
    route: '/calcada',
    category: 'campo',
  },
  {
    title: 'EMERGENCIAL',
    caption: 'Acesso externo',
    icon: 'open_in_new',
    externalUrl: EXTERNAL_PROJECT_URL,
    locked: true,
    category: 'externo',
  },
];

export function getNavGroups(): Array<{
  key: Exclude<NavCategory, 'home'>;
  label: string;
  items: NavItem[];
}> {
  return NAV_CATEGORY_ORDER.map((key) => ({
    key,
    label: NAV_CATEGORY_LABELS[key],
    items: navItems.filter((item) => item.category === key),
  })).filter((group) => group.items.length > 0);
}

export function getFormCatalog(): Array<{
  key: Exclude<NavCategory, 'home' | 'externo'>;
  label: string;
  items: NavItem[];
}> {
  return (['operacao', 'campo'] as const)
    .map((key) => ({
      key,
      label: NAV_CATEGORY_LABELS[key],
      items: navItems.filter((item) => item.category === key && isFormNavItem(item)),
    }))
    .filter((group) => group.items.length > 0);
}
