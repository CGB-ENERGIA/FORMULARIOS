<template>
  <q-layout view="lHh Lpr lFf" class="app-layout">
    <q-header class="app-header">
      <q-toolbar class="app-toolbar">
        <q-btn
          ref="menuBtnRef"
          flat
          dense
          round
          icon="menu"
          aria-label="Menu"
          class="app-menu-btn"
          @click.stop="leftDrawerOpen = !leftDrawerOpen"
        />

        <q-toolbar-title class="app-toolbar-title">
          <span class="app-toolbar-title__brand">{{ APP_NAME }}</span>
          <span v-if="pageTitle" class="app-toolbar-title__separator">/</span>
          <span v-if="pageTitle" class="app-toolbar-title__page">{{ pageTitle }}</span>
        </q-toolbar-title>
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="leftDrawerOpen"
      show-if-above
      :width="300"
      :breakpoint="1024"
      class="app-drawer"
    >
      <div class="app-drawer__shell">
        <div class="app-drawer__glow app-drawer__glow--primary" aria-hidden="true" />
        <div class="app-drawer__glow app-drawer__glow--accent" aria-hidden="true" />
        <div class="app-drawer__grid" aria-hidden="true" />

        <header class="app-drawer__brand">
          <div class="app-drawer__logo">
            <q-icon name="bolt" size="26px" />
          </div>

          <div class="app-drawer__brand-copy">
            <div class="app-drawer__brand-title">{{ APP_NAME }}</div>
            <div class="app-drawer__brand-caption">CGB Engenharia</div>
          </div>

          <div class="app-drawer__brand-chip">Pro</div>
        </header>

        <div class="app-drawer__divider" />

        <nav class="app-drawer__nav">
          <div class="app-drawer__section-label">Menu principal</div>

          <router-link
            v-for="item in navItems"
            :key="item.route"
            :to="item.route"
            class="app-drawer__link"
            :class="{ 'app-drawer__link--active': isNavActive(item.route) }"
          >
            <div class="app-drawer__link-icon">
              <q-icon :name="item.icon" size="20px" />
            </div>

            <div class="app-drawer__link-copy">
              <span class="app-drawer__link-title">{{ item.title }}</span>
              <span v-if="item.caption" class="app-drawer__link-caption">{{ item.caption }}</span>
            </div>

            <q-icon name="north_east" class="app-drawer__link-arrow" size="16px" />
          </router-link>
        </nav>

        <footer class="app-drawer__footer">
          <div class="app-drawer__footer-card">
            <div class="app-drawer__status">
              <span class="app-drawer__status-dot" />
              Plataforma ativa
            </div>
            <div class="app-drawer__footer-meta">
              Uso interno · {{ currentYear }}
            </div>
          </div>
        </footer>
      </div>
    </q-drawer>

    <q-page-container class="app-page-container">
      <router-view v-slot="{ Component }">
        <transition name="page-fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { APP_NAME, navItems } from 'src/config/navigation';

const route = useRoute();
const menuBtnRef = ref<{ $el: HTMLElement } | null>(null);
const leftDrawerOpen = ref(false);

const currentYear = new Date().getFullYear();

const pageTitle = computed(() => {
  const metaTitle = route.meta.title;
  return typeof metaTitle === 'string' ? metaTitle : '';
});

function isNavActive(navRoute: string) {
  if (navRoute === '/') return route.path === '/';
  return route.path === navRoute || route.path.startsWith(`${navRoute}/`);
}

function isClickInsideMenuButton(target: EventTarget | null) {
  if (!(target instanceof Node)) return false;
  return Boolean(menuBtnRef.value?.$el.contains(target));
}

function isClickInsideDrawer(target: EventTarget | null) {
  if (!(target instanceof Element)) return false;
  return Boolean(target.closest('.q-drawer'));
}

function closeDrawer() {
  if (leftDrawerOpen.value) {
    leftDrawerOpen.value = false;
  }
}

function handleDocumentClick(event: MouseEvent) {
  if (!leftDrawerOpen.value) return;
  if (isClickInsideDrawer(event.target) || isClickInsideMenuButton(event.target)) return;

  closeDrawer();
}

onMounted(() => {
  document.body.addEventListener('click', handleDocumentClick);
});

onUnmounted(() => {
  document.body.removeEventListener('click', handleDocumentClick);
});

watch(
  () => route.path,
  () => {
    closeDrawer();
  },
);
</script>
