<template>
  <q-page class="home-page">
    <div class="home-page__inner">
      <section class="home-hero">
        <div class="home-hero__content">
          <div class="home-hero__badge">
            <q-icon name="bolt" size="16px" />
            Plataforma CGB
          </div>
          <h1 class="home-hero__title">{{ APP_NAME }}</h1>
          <p class="home-hero__subtitle">
            Centralize o preenchimento, exportação e geração de relatórios dos formulários
            operacionais em um único ambiente moderno e responsivo.
          </p>

          <div class="home-hero__stats">
            <div class="home-stat">
              <div class="home-stat__value">{{ formCards.length }}</div>
              <div class="home-stat__label">Formulários ativos</div>
            </div>
            <div class="home-stat">
              <div class="home-stat__value">Excel</div>
              <div class="home-stat__label">Exportação com layout original</div>
            </div>
            <div class="home-stat">
              <div class="home-stat__value">PDF</div>
              <div class="home-stat__label">Relatórios prontos para envio</div>
            </div>
          </div>
        </div>
      </section>

      <div class="home-page__content">
        <div class="section-label q-mb-md">
          <q-icon name="dashboard" size="18px" />
          Formulários disponíveis
        </div>

        <div class="row q-col-gutter-lg">
        <div
          v-for="(item, index) in formCards"
          :key="item.route"
          class="col-12 col-sm-6 col-lg-4"
        >
          <q-card
            flat
            class="form-card cursor-pointer"
            :style="{ animationDelay: `${index * 0.08}s` }"
            @click="goTo(item.route)"
          >
            <q-card-section class="row items-start no-wrap q-gutter-md">
              <div class="form-card__icon-wrap">
                <q-icon :name="item.icon" size="28px" />
              </div>
              <div>
                <div class="form-card__title q-mb-xs">{{ item.title }}</div>
                <div v-if="item.caption" class="form-card__caption text-body2">
                  {{ item.caption }}
                </div>
              </div>
            </q-card-section>
            <q-separator />
            <q-card-actions align="right" class="form-card__footer q-pa-md">
              <q-btn
                unelevated
                color="primary"
                label="Abrir formulário"
                icon-right="arrow_forward"
                no-caps
              />
            </q-card-actions>
          </q-card>
        </div>
      </div>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { APP_NAME, isExternalNavItem, navItems } from 'src/config/navigation';

const router = useRouter();

const formCards = computed(() =>
  navItems.filter((item) => item.route && item.route !== '/' && !isExternalNavItem(item)),
);

function goTo(route: string) {
  void router.push(route);
}
</script>
