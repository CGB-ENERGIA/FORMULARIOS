import { configure } from 'quasar/wrappers';

const publicPath = process.env.QUASAR_PUBLIC_PATH || '/';

export default configure(() => ({
  boot: ['pinia'],
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
    config: {},
    plugins: ['Notify', 'Dialog'],
  },
}));
