import { Dark } from 'quasar';
import { defineStore } from 'pinia';
import { ref } from 'vue';

const STORAGE_KEY = 'forms-theme';

function readStoredTheme(): boolean | null {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === 'dark') return true;
  if (saved === 'light') return false;
  return null;
}

export const useThemeStore = defineStore('theme', () => {
  const isDark = ref(Dark.isActive);

  function applyTheme(dark: boolean) {
    isDark.value = dark;
    Dark.set(dark);
    localStorage.setItem(STORAGE_KEY, dark ? 'dark' : 'light');
  }

  function toggle() {
    applyTheme(!isDark.value);
  }

  function init() {
    const stored = readStoredTheme();
    if (stored !== null) {
      applyTheme(stored);
      return;
    }

    applyTheme(window.matchMedia('(prefers-color-scheme: dark)').matches);
  }

  return { isDark, applyTheme, toggle, init };
});
