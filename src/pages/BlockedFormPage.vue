<template>
  <q-page class="page-shell">
    <div class="page-shell__inner">
      <header class="page-header">
        <div class="page-header__eyebrow">
          <q-icon :name="pageIcon" size="14px" />
          Formulário operacional
        </div>
        <h1 class="page-header__title">{{ pageTitle }}</h1>
        <p class="page-header__subtitle">{{ pageSubtitle }}</p>
      </header>

      <q-card flat class="premium-card blocked-form-card">
        <q-card-section class="blocked-form-card__body">
          <q-icon name="lock" size="52px" color="grey-6" />
          <h2 class="blocked-form-card__title">Módulo bloqueado</h2>
          <p class="blocked-form-card__text">
            Este formulário ainda não está disponível para preenchimento.
          </p>
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();

const pageTitle = computed(() => String(route.meta.title ?? 'Formulário'));
const pageSubtitle = computed(() =>
  String(route.meta.subtitle ?? 'Em breve no portal de formulários.'),
);
const pageIcon = computed(() => String(route.meta.icon ?? 'description'));
</script>

<style scoped lang="scss">
.blocked-form-card__body {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 56px 24px;
  text-align: center;
}

.blocked-form-card__title {
  margin: 8px 0 0;
  font-size: 1.2rem;
  font-weight: 900;
  font-style: italic;
}

.blocked-form-card__text {
  margin: 0;
  max-width: 28rem;
  color: var(--text-secondary);
  font-size: 0.95rem;
  font-style: italic;
}
</style>
