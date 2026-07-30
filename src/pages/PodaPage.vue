<template>
  <q-page class="page-shell poda-page">
    <div class="page-shell__inner">
      <q-tabs
        v-model="relatorio"
        dense
        align="left"
        active-color="primary"
        indicator-color="primary"
        class="poda-tabs q-mb-md"
        outside-arrows
        mobile-arrows
      >
        <q-tab name="poda" icon="forest" label="PODA" no-caps />
        <q-tab name="custeio" icon="payments" label="CUSTEIO" no-caps />
      </q-tabs>

      <q-tab-panels
        v-model="relatorio"
        animated
        keep-alive
        class="poda-panels"
      >
        <q-tab-panel name="poda" class="q-pa-none">
          <PodaReportPanel />
        </q-tab-panel>
        <q-tab-panel name="custeio" class="q-pa-none">
          <CusteioReportPanel />
        </q-tab-panel>
      </q-tab-panels>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import PodaReportPanel from 'src/components/poda/PodaReportPanel.vue';
import CusteioReportPanel from 'src/components/poda/CusteioReportPanel.vue';

export type PodaRelatorio = 'poda' | 'custeio';

const route = useRoute();
const router = useRouter();

const relatorio = ref<PodaRelatorio>(
  route.query.relatorio === 'custeio' ? 'custeio' : 'poda',
);

watch(relatorio, (value) => {
  const query = { ...route.query };
  if (value === 'poda') {
    delete query.relatorio;
  } else {
    query.relatorio = value;
  }
  void router.replace({ query });
});
</script>

<style scoped>
.poda-tabs :deep(.q-tab) {
  min-height: 42px;
  font-weight: 600;
}

.poda-panels {
  background: transparent;
}
</style>
