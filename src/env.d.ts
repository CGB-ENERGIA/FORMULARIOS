/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<object, object, unknown>;
  export default component;
}

declare module '#q-app/wrappers' {
  export * from '@quasar/app-vite/wrappers';
}

declare module '#q-app/bex/wrappers' {
  export * from '@quasar/app-vite/wrappers';
}

declare module '#q-app' {
  export * from '@quasar/app-vite';
}

declare module '#q-app/bex' {
  export * from '@quasar/app-vite';
}

declare module 'quasar/wrappers' {
  export * from '@quasar/app-vite/wrappers';
}

declare module 'layouts/*';
declare module 'pages/*';
declare module 'components/*';
declare module 'boot/*';
declare module 'stores/*';
declare module 'src/*';
declare module 'app/*';
declare module 'components/*';
declare module 'layouts/*';
declare module 'pages/*';
declare module 'assets/*';
declare module 'boot/*';
declare module 'stores/*';
