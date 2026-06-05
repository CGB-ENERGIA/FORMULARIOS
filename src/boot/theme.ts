import { defineBoot } from '#q-app/wrappers';
import { useThemeStore } from 'src/stores/theme';

export default defineBoot(() => {
  useThemeStore().init();
});
