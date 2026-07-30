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
        meta: { title: 'PODA & CUSTEIO' },
      },
      {
        path: 'calcada',
        component: () => import('pages/CalcadaPage.vue'),
        meta: { title: 'CALÇADA' },
      },
      {
        path: 'secionamento-cerca',
        component: () => import('pages/BlockedFormPage.vue'),
        meta: {
          title: 'SECCIONAMENTO DE CERCA',
          subtitle: 'Formulário de secionamento de cerca.',
          icon: 'fence',
        },
      },
      {
        path: 'base-concretada',
        component: () => import('pages/BlockedFormPage.vue'),
        meta: {
          title: 'BASE CONCRETADA',
          subtitle: 'Formulário de base concretada.',
          icon: 'foundation',
        },
      },
    ],
  },
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
];

export default routes;
