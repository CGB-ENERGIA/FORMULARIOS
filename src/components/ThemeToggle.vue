<template>
  <button
    type="button"
    class="theme-toggle"
    :class="{ 'theme-toggle--dark': isDark }"
    :aria-label="isDark ? 'Ativar modo claro' : 'Ativar modo escuro'"
    :title="isDark ? 'Modo escuro' : 'Modo claro'"
    @click="themeStore.toggle()"
  >
    <span class="theme-toggle__track" aria-hidden="true">
      <span class="theme-toggle__glow" />
      <span class="theme-toggle__stars">
        <span v-for="star in stars" :key="star" class="theme-toggle__star" :style="starStyle(star)" />
      </span>
      <span class="theme-toggle__cloud theme-toggle__cloud--1" />
      <span class="theme-toggle__cloud theme-toggle__cloud--2" />
      <span class="theme-toggle__thumb">
        <q-icon
          class="theme-toggle__icon theme-toggle__icon--sun"
          name="wb_sunny"
          size="16px"
        />
        <q-icon
          class="theme-toggle__icon theme-toggle__icon--moon"
          name="dark_mode"
          size="16px"
        />
      </span>
    </span>
    <span class="theme-toggle__label">{{ isDark ? 'Escuro' : 'Claro' }}</span>
  </button>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useThemeStore } from 'src/stores/theme';

const themeStore = useThemeStore();
const { isDark } = storeToRefs(themeStore);

const stars = [1, 2, 3, 4, 5];

function starStyle(index: number) {
  const positions = [
    { top: '18%', left: '22%', delay: '0s', size: '3px' },
    { top: '58%', left: '16%', delay: '0.15s', size: '2px' },
    { top: '28%', left: '48%', delay: '0.3s', size: '2px' },
    { top: '62%', left: '42%', delay: '0.45s', size: '3px' },
    { top: '38%', left: '34%', delay: '0.6s', size: '2px' },
  ];

  const pos = positions[index - 1];
  return {
    top: pos.top,
    left: pos.left,
    width: pos.size,
    height: pos.size,
    animationDelay: pos.delay,
  };
}
</script>

<style scoped>
.theme-toggle {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 4px;
  border: none;
  background: transparent;
  cursor: pointer;
  color: inherit;
  font: inherit;
}

.theme-toggle__track {
  position: relative;
  width: 62px;
  height: 32px;
  border-radius: 999px;
  background: linear-gradient(135deg, #f0d5a8 0%, #e8b86d 45%, #d4a574 100%);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.45),
    0 8px 20px rgba(180, 120, 60, 0.22);
  overflow: hidden;
  transition:
    background 0.45s cubic-bezier(0.4, 0, 0.2, 1),
    box-shadow 0.45s cubic-bezier(0.4, 0, 0.2, 1);
}

.theme-toggle--dark .theme-toggle__track {
  background: linear-gradient(135deg, #1a1216 0%, #2a1520 55%, #3d1628 100%);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.08),
    0 8px 22px rgba(90, 22, 48, 0.45);
}

.theme-toggle__glow {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.35), transparent 55%);
  opacity: 1;
  transition: opacity 0.45s ease;
}

.theme-toggle--dark .theme-toggle__glow {
  opacity: 0;
}

.theme-toggle__stars {
  position: absolute;
  inset: 0;
  opacity: 0;
  transition: opacity 0.35s ease 0.08s;
}

.theme-toggle--dark .theme-toggle__stars {
  opacity: 1;
}

.theme-toggle__star {
  position: absolute;
  border-radius: 999px;
  background: #fef08a;
  box-shadow: 0 0 6px rgba(254, 240, 138, 0.8);
  animation: theme-star-twinkle 2.4s ease-in-out infinite;
}

.theme-toggle__cloud {
  position: absolute;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.92);
  transition:
    opacity 0.35s ease,
    transform 0.45s cubic-bezier(0.4, 0, 0.2, 1);
}

.theme-toggle__cloud--1 {
  width: 14px;
  height: 8px;
  top: 58%;
  left: 18%;
}

.theme-toggle__cloud--2 {
  width: 10px;
  height: 6px;
  top: 42%;
  left: 34%;
}

.theme-toggle--dark .theme-toggle__cloud {
  opacity: 0;
  transform: translateY(6px) scale(0.8);
}

.theme-toggle__thumb {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 26px;
  height: 26px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  background: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%);
  box-shadow:
    0 4px 12px rgba(15, 23, 42, 0.18),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
  transition:
    transform 0.45s cubic-bezier(0.34, 1.45, 0.64, 1),
    background 0.45s ease,
    box-shadow 0.45s ease;
}

.theme-toggle--dark .theme-toggle__thumb {
  transform: translateX(30px);
  background: linear-gradient(145deg, #5a1630 0%, #2a1520 100%);
  box-shadow:
    0 4px 14px rgba(15, 23, 42, 0.45),
    0 0 16px rgba(196, 30, 92, 0.3);
}

.theme-toggle__icon {
  position: absolute;
  transition:
    opacity 0.3s ease,
    transform 0.45s cubic-bezier(0.34, 1.45, 0.64, 1);
}

.theme-toggle__icon--sun {
  color: #f59e0b;
  opacity: 1;
  transform: rotate(0deg) scale(1);
}

.theme-toggle__icon--moon {
  color: #e0e7ff;
  opacity: 0;
  transform: rotate(-40deg) scale(0.6);
}

.theme-toggle--dark .theme-toggle__icon--sun {
  opacity: 0;
  transform: rotate(40deg) scale(0.6);
}

.theme-toggle--dark .theme-toggle__icon--moon {
  opacity: 1;
  transform: rotate(0deg) scale(1);
}

.theme-toggle__label {
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--text-secondary);
  min-width: 44px;
  text-align: left;
  transition: color 0.3s ease;
}

.theme-toggle:hover .theme-toggle__track {
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.45),
    0 10px 26px rgba(180, 120, 60, 0.3);
}

.theme-toggle--dark:hover .theme-toggle__track {
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.08),
    0 10px 28px rgba(90, 22, 48, 0.55);
}

.theme-toggle:active .theme-toggle__thumb {
  transform: scale(0.94);
}

.theme-toggle--dark:active .theme-toggle__thumb {
  transform: translateX(30px) scale(0.94);
}

@keyframes theme-star-twinkle {
  0%,
  100% {
    opacity: 0.45;
    transform: scale(0.85);
  }
  50% {
    opacity: 1;
    transform: scale(1.1);
  }
}

@media (max-width: 599px) {
  .theme-toggle__label {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .theme-toggle__track,
  .theme-toggle__thumb,
  .theme-toggle__icon,
  .theme-toggle__cloud,
  .theme-toggle__stars {
    transition: none;
  }

  .theme-toggle__star {
    animation: none;
  }
}
</style>
