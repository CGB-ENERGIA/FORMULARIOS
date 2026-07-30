<template>
  <q-page class="page-shell clientes-page">
    <div class="page-shell__inner clientes-page__inner">
      <h1 class="clientes-page__title">Clientes</h1>
      <p class="clientes-page__lead">
        Módulo isolado: preenchimento, pesquisa, arquivos gerados e controle de medidores.
      </p>

      <q-tabs
        v-model="tab"
        dense
        align="left"
        active-color="primary"
        indicator-color="primary"
        class="clientes-tabs q-mb-md"
        outside-arrows
        mobile-arrows
      >
        <q-tab name="consumidores" icon="groups" label="Consumidores" no-caps />
        <q-tab name="cadastro" icon="assignment_ind" label="Cadastro" no-caps />
        <q-tab name="consultar" icon="fact_check" label="Controle" no-caps />
      </q-tabs>

      <q-tab-panels
        v-model="tab"
        animated
        keep-alive
        class="clientes-panels"
      >
        <q-tab-panel name="consumidores" class="q-pa-none">
          <ConsumidoresPanel />
        </q-tab-panel>
        <q-tab-panel name="cadastro" class="q-pa-none">
          <CadastroPanel />
        </q-tab-panel>
        <q-tab-panel name="consultar" class="q-pa-none">
          <ConsultarPanel />
        </q-tab-panel>
      </q-tab-panels>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import ConsumidoresPanel from 'src/components/clientes/ConsumidoresPanel.vue';
import CadastroPanel from 'src/components/clientes/CadastroPanel.vue';
import ConsultarPanel from 'src/components/clientes/ConsultarPanel.vue';
import { useCadastroStore } from 'src/stores/cadastro';
import { useConsumidoresStore } from 'src/stores/consumidores';
import {
  syncCadastroIntoConsumidores,
  syncConsumidoresIntoCadastro,
} from 'src/utils/form-bridge';

export type ClientesTab = 'consumidores' | 'cadastro' | 'consultar';

const $q = useQuasar();
const route = useRoute();
const router = useRouter();
const consumidoresStore = useConsumidoresStore();
const cadastroStore = useCadastroStore();

const tab = ref<ClientesTab>(resolveTab(route.query.tab));

function resolveTab(value: unknown): ClientesTab {
  if (value === 'cadastro') return 'cadastro';
  if (value === 'consultar' || value === 'historico') return 'consultar';
  return 'consumidores';
}

function syncFromConsumidores() {
  const next = syncConsumidoresIntoCadastro(
    consumidoresStore.obra,
    consumidoresStore.consumidores,
    cadastroStore.clientes,
  );
  cadastroStore.replaceClientes(next);
}

function syncFromCadastro() {
  const { consumidores, pep, data } = syncCadastroIntoConsumidores(
    cadastroStore.clientes,
    consumidoresStore.consumidores,
  );
  consumidoresStore.replaceConsumidores(consumidores);

  if (pep) {
    consumidoresStore.obra.elementoPep = pep;
  }
  if (data) {
    consumidoresStore.syncDatas(data);
  }
}

watch(tab, (next, prev) => {
  if (prev && next !== prev) {
    if (prev === 'consumidores' && next === 'cadastro') {
      syncFromConsumidores();
      $q.notify({
        type: 'info',
        message: 'Dados de Consumidores sincronizados com Cadastro.',
        timeout: 2200,
      });
    } else if (prev === 'cadastro' && next === 'consumidores') {
      syncFromCadastro();
      $q.notify({
        type: 'info',
        message: 'Dados de Cadastro sincronizados com Consumidores.',
        timeout: 2200,
      });
    }
  }

  const queryTab =
    next === 'cadastro' || next === 'consultar' ? next : undefined;
  if ((route.query.tab as string | undefined) !== queryTab) {
    void router.replace({
      path: '/clientes',
      query: queryTab ? { tab: queryTab } : {},
    });
  }
});

watch(
  () => route.query.tab,
  (value) => {
    const next = resolveTab(value);
    if (tab.value !== next) {
      tab.value = next;
    }
  },
);

onMounted(() => {
  if (tab.value === 'cadastro') {
    syncFromConsumidores();
  }
});
</script>

<style scoped lang="scss">
.clientes-page__inner {
  padding-bottom: 32px;
}

.clientes-page__title {
  margin: 0 0 4px;
  font-family: var(--font-display, inherit);
  font-size: clamp(1.35rem, 2.5vw, 1.7rem);
  font-weight: 700;
  line-height: 1.2;
  color: var(--text);
}

.clientes-page__lead {
  margin: 0 0 14px;
  font-size: 13px;
  color: var(--text-secondary, #94a3b8);
}

.clientes-tabs {
  border-bottom: 1px solid var(--border);
}

.clientes-panels {
  background: transparent;
}

:deep(.clientes-panel .page-shell__inner) {
  padding-left: 0;
  padding-right: 0;
  max-width: none;
}
</style>
