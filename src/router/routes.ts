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
        path: 'historico',
        component: () => import('pages/HistoricoPage.vue'),
        meta: { title: 'HISTÓRICO' },
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
