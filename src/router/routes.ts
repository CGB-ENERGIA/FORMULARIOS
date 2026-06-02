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
    ],
  },
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
];

export default routes;
