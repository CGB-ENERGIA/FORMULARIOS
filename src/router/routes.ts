import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        component: () => import('pages/HomePage.vue'),
        meta: { title: 'Início' },
      },
      {
        path: 'clientes',
        component: () => import('pages/ClientesPage.vue'),
        meta: { title: 'CLIENTES' },
      },
      {
        path: 'consumidores',
        component: () => import('pages/ConsumidoresPage.vue'),
        meta: { title: 'CONSUMIDORES' },
      },
      {
        path: 'desligamento',
        component: () => import('pages/DesligamentoPage.vue'),
        meta: { title: 'DESLIGAMENTO' },
      },
      {
        path: 'arrasto',
        component: () => import('pages/ArrastoPage.vue'),
        meta: { title: 'ARRASTO' },
      },
      {
        path: 'cadastro',
        component: () => import('pages/CadastroPage.vue'),
        meta: { title: 'CADASTRO' },
      },
      {
        path: 'historico',
        redirect: { path: '/clientes', query: { tab: 'consultar' } },
      },
      {
        path: 'poda',
        component: () => import('pages/PodaPage.vue'),
        meta: { title: 'PODA' },
      },
      {
        path: 'calcada',
        component: () => import('pages/CalcadaPage.vue'),
        meta: { title: 'CALÇADA' },
      },
    ],
  },
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
];

export default routes;
