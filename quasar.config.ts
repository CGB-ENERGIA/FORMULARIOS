import { configure } from 'quasar/wrappers';

const publicPath = process.env.QUASAR_PUBLIC_PATH || '/';

export default configure(() => ({
  boot: ['pinia', 'theme'],
  css: ['app.scss'],
  extras: ['roboto-font', 'material-icons'],
  build: {
    publicPath,
    target: {
      browser: ['es2022', 'firefox115', 'chrome115', 'safari14'],
      node: 'node20',
    },
    vueRouterMode: 'hash',
    typescript: {
      strict: true,
      vueShim: true,
    },
    extendViteConf(viteConf) {
      viteConf.optimizeDeps = {
        ...viteConf.optimizeDeps,
        include: [...(viteConf.optimizeDeps?.include ?? []), 'jspdf', 'jspdf-autotable'],
      };
    },
  },
  devServer: {
    open: true,
  },
  framework: {
    config: {
      brand: {
        primary: '#2563eb',
        secondary: '#7c3aed',
        accent: '#06b6d4',
        positive: '#10b981',
        negative: '#ef4444',
        info: '#3b82f6',
        warning: '#f59e0b',
      },
    },
    plugins: ['Notify', 'Dialog'],
  },
}));
