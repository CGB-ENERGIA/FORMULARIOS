<template>
  <q-layout view="lHh Lpr lFf" class="app-layout">
    <q-header elevated class="app-header">
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

        <div class="app-header__brand" @click="goHome">
          <img
            class="app-header__mark"
            src="/brand/cgb-mark.png"
            alt=""
            width="28"
            height="28"
          />
          <div class="app-header__copy">
            <span class="app-header__name">{{ APP_BRAND }}</span>
            <span class="app-header__product">{{ APP_TAGLINE }}</span>
          </div>
        </div>

        <q-space />

        <span v-if="pageTitle" class="app-header__page">{{ pageTitle }}</span>
        <ThemeToggle />
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="leftDrawerOpen"
      show-if-above
      :width="276"
      :breakpoint="1024"
      no-mini-animation
      class="app-drawer"
    >
      <div class="app-drawer__shell">
        <header class="app-drawer__brand">
          <img
            class="app-drawer__mark"
            src="/brand/cgb-mark.png"
            alt="CGB Engenharia"
            width="56"
            height="56"
          />
          <div class="app-drawer__brand-text">
            <div class="app-drawer__brand-name">{{ APP_BRAND }}</div>
            <div class="app-drawer__brand-product">Portal de Formulários</div>
          </div>
        </header>

        <nav class="app-drawer__nav" aria-label="Navegação principal">
          <router-link
            to="/"
            class="app-drawer__item"
            :class="{ 'app-drawer__item--active': isNavActive('/') }"
          >
            <q-icon name="home" size="18px" />
            <span>Início</span>
          </router-link>

          <template v-for="group in navGroups" :key="group.key">
            <p class="app-drawer__group">{{ group.label }}</p>

            <template v-for="item in group.items" :key="getNavItemKey(item)">
              <div
                v-if="isExternalNavItem(item) && item.locked"
                class="app-drawer__item app-drawer__item--locked"
                aria-disabled="true"
                title="Acesso indisponível"
              >
                <q-icon :name="item.icon" size="18px" />
                <span>{{ item.title }}</span>
                <q-icon name="lock" size="14px" class="app-drawer__lock" />
              </div>

              <a
                v-else-if="isExternalNavItem(item)"
                href="#"
                class="app-drawer__item"
                @click.prevent="handleExternalNav(item)"
              >
                <q-icon :name="item.icon" size="18px" />
                <span>{{ item.title }}</span>
              </a>

              <router-link
                v-else
                :to="item.route!"
                class="app-drawer__item"
                :class="{ 'app-drawer__item--active': isNavActive(item.route!) }"
              >
                <q-icon :name="item.icon" size="18px" />
                <span>{{ item.title }}</span>
              </router-link>
            </template>
          </template>
        </nav>
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
import { useRoute, useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import ThemeToggle from 'src/components/ThemeToggle.vue';
import {
  APP_BRAND,
  APP_TAGLINE,
  getNavGroups,
  getNavItemKey,
  isExternalNavItem,
  type NavItem,
} from 'src/config/navigation';

const $q = useQuasar();
const route = useRoute();
const router = useRouter();
const menuBtnRef = ref<{ $el: HTMLElement } | null>(null);
const leftDrawerOpen = ref(false);
const navGroups = getNavGroups();

const pageTitle = computed(() => {
  const metaTitle = route.meta.title;
  return typeof metaTitle === 'string' ? metaTitle : '';
});

function goHome() {
  void router.push('/');
}

function isNavActive(navRoute: string) {
  if (navRoute === '/') return route.path === '/';
  return route.path === navRoute || route.path.startsWith(`${navRoute}/`);
}

function handleExternalNav(item: NavItem) {
  if (item.locked) return;

  const url = item.externalUrl?.trim();
  if (!url) {
    $q.notify({
      type: 'info',
      message: 'Link do projeto externo em breve.',
    });
    return;
  }

  window.open(url, '_blank', 'noopener,noreferrer');
  closeDrawer();
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
