<template>
  <q-page class="portal-page">
    <section class="portal-hero" aria-labelledby="portal-hero-title">
      <div class="portal-hero__stage" aria-hidden="true">
        <div class="portal-hero__facet portal-hero__facet--a" />
        <div class="portal-hero__facet portal-hero__facet--b" />
        <div class="portal-hero__facet portal-hero__facet--c" />
      </div>

      <div class="portal-hero__inner">
        <img
          class="portal-hero__mark"
          src="/brand/cgb-mark.png"
          alt=""
          width="88"
          height="88"
        />
        <p class="portal-hero__brand">{{ APP_BRAND }}</p>
        <h1 id="portal-hero-title" class="portal-hero__title">
          Portal de Formulários
        </h1>
        <p class="portal-hero__subtitle">{{ APP_DESCRIPTION }}</p>
        <button type="button" class="portal-hero__cta" @click="scrollToCatalog">
          Ver formulários
          <q-icon name="south" size="18px" />
        </button>
      </div>
    </section>

    <section id="catalogo" class="portal-catalog" aria-labelledby="catalog-title">
      <div class="portal-catalog__inner">
        <header class="portal-catalog__header">
          <h2 id="catalog-title">Formulários</h2>
          <p>Selecione o documento necessário para o fluxo da obra.</p>
        </header>

        <div
          v-for="group in catalog"
          :key="group.key"
          class="portal-section"
        >
          <h3 class="portal-section__label">{{ group.label }}</h3>

          <ul class="portal-list">
            <li v-for="(item, index) in group.items" :key="item.route">
              <button
                type="button"
                class="portal-entry"
                :style="{ animationDelay: `${index * 0.05}s` }"
                @click="goTo(item.route!)"
              >
                <span class="portal-entry__index">{{ String(index + 1).padStart(2, '0') }}</span>
                <span class="portal-entry__text">
                  <span class="portal-entry__title">{{ item.title }}</span>
                  <span v-if="item.caption" class="portal-entry__caption">{{ item.caption }}</span>
                </span>
                <q-icon name="arrow_forward" size="18px" class="portal-entry__arrow" />
              </button>
            </li>
          </ul>
        </div>
      </div>
    </section>
  </q-page>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import {
  APP_BRAND,
  APP_DESCRIPTION,
  getFormCatalog,
} from 'src/config/navigation';

const router = useRouter();
const catalog = computed(() => getFormCatalog());

function goTo(route: string) {
  void router.push(route);
}

function scrollToCatalog() {
  document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
</script>
