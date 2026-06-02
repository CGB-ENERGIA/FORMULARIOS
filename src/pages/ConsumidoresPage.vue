<template>
  <q-page class="page-shell">
    <div class="page-shell__inner">
      <header class="page-header">
        <div class="page-header__eyebrow">
          <q-icon name="groups" size="14px" />
          Formulário operacional
        </div>
        <h1 class="page-header__title">Relação de Consumidores Ligados na Obra</h1>
        <p class="page-header__subtitle">
          Preencha os dados da obra e cadastre os consumidores. Exporte para Excel no layout
          original ou gere PDF para envio.
        </p>
      </header>

      <q-card flat class="premium-card q-mb-md">
        <div class="premium-card__header">
          <div class="premium-card__header-title">
            <div class="premium-card__header-icon">
              <q-icon name="engineering" size="22px" />
            </div>
            Informações da Obra
          </div>
        </div>

        <q-card-section class="premium-card__body field-grid">
          <div class="row q-col-gutter-md">
            <div class="col-12">
              <q-input
                v-model="obra.descricaoObra"
                label="Descrição da Obra"
                outlined
                dense
                hide-bottom-space
              />
            </div>
            <div class="col-12 col-md-6">
              <q-input
                :model-value="FORNECEDOR_FIXO"
                label="Fornecedor"
                outlined
                dense
                readonly
                filled
                hide-bottom-space
              />
            </div>
            <div class="col-12 col-md-6">
              <q-input
                v-model="obra.elementoPep"
                label="Elemento PEP"
                outlined
                dense
                hide-bottom-space
              />
            </div>
            <div class="col-12 col-md-6">
              <q-input
                :model-value="obra.dataConclusao"
                label="Data da Conclusão"
                outlined
                dense
                mask="##/##/####"
                placeholder="DD/MM/AAAA"
                hide-bottom-space
                @update:model-value="onDataObraChange"
              >
                <template #append>
                  <q-icon name="event" class="cursor-pointer">
                    <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                      <q-date
                        :model-value="obra.dataConclusao"
                        mask="DD/MM/YYYY"
                        @update:model-value="onDataObraChange"
                      >
                        <div class="row items-center justify-end">
                          <q-btn v-close-popup label="Fechar" color="primary" flat no-caps />
                        </div>
                      </q-date>
                    </q-popup-proxy>
                  </q-icon>
                </template>
              </q-input>
            </div>
            <div class="col-12 col-md-6">
              <q-input
                :model-value="obra.dataEnergizacao"
                label="Data da Energização"
                outlined
                dense
                mask="##/##/####"
                placeholder="DD/MM/AAAA"
                hide-bottom-space
                @update:model-value="onDataObraChange"
              >
                <template #append>
                  <q-icon name="event" class="cursor-pointer">
                    <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                      <q-date
                        :model-value="obra.dataEnergizacao"
                        mask="DD/MM/YYYY"
                        @update:model-value="onDataObraChange"
                      >
                        <div class="row items-center justify-end">
                          <q-btn v-close-popup label="Fechar" color="primary" flat no-caps />
                        </div>
                      </q-date>
                    </q-popup-proxy>
                  </q-icon>
                </template>
              </q-input>
            </div>
            <div class="col-12 col-md-6">
              <q-input
                :model-value="TEC_OBRA_FIXO"
                label="Téc da Obra"
                outlined
                dense
                readonly
                filled
                hide-bottom-space
              />
            </div>
            <div class="col-12 col-md-6">
              <q-input
                :model-value="REGIONAL_FIXA"
                label="Regional"
                outlined
                dense
                readonly
                filled
                hide-bottom-space
              />
            </div>
            <div class="col-12 col-md-6">
              <q-input
                v-model="obra.localidade"
                label="Localidade"
                outlined
                dense
                hide-bottom-space
              />
            </div>
            <div class="col-12 col-md-6">
              <q-input
                v-model="obra.municipio"
                label="Município"
                outlined
                dense
                hide-bottom-space
              />
            </div>
          </div>
        </q-card-section>
      </q-card>

      <div class="action-bar">
        <div>
          <div class="action-bar__title">Consumidores</div>
          <div class="stat-chip q-mt-sm">
            <q-icon name="check_circle" size="18px" color="primary" />
            <strong>{{ preenchidosCount }}</strong>
            preenchido(s)
          </div>
        </div>

        <div class="action-bar__actions">
          <q-btn
            outline
            color="primary"
            icon="add"
            :label="$q.screen.gt.xs ? 'Adicionar linha' : undefined"
            no-caps
            @click="addConsumidor"
          />
          <q-btn
            unelevated
            icon="download"
            :label="$q.screen.gt.xs ? 'Exportar Excel' : undefined"
            class="action-btn--excel"
            no-caps
            @click="handleExport"
          />
          <q-btn
            unelevated
            icon="picture_as_pdf"
            :label="$q.screen.gt.xs ? 'Gerar PDF' : undefined"
            class="action-btn--pdf"
            no-caps
            @click="handleExportPdf"
          />
          <q-btn
            outline
            color="negative"
            icon="restart_alt"
            :label="$q.screen.gt.xs ? 'Limpar' : undefined"
            no-caps
            @click="handleReset"
          />
        </div>
      </div>

      <q-card flat class="premium-card table-shell">
        <div class="table-shell__hint">
          <q-icon name="swipe" size="16px" />
          Deslize horizontalmente para ver todas as colunas
        </div>
        <div class="table-shell__scroll">
          <q-table
            class="consumidores-table"
            flat
            :rows="consumidores"
            :columns="columns"
            row-key="id"
            :pagination="{ rowsPerPage: 0 }"
            hide-pagination
            virtual-scroll
            :virtual-scroll-item-size="56"
            style="max-height: 68vh"
          >
            <template #header="props">
              <q-tr :props="props">
                <q-th rowspan="2" auto-width>Nº</q-th>
                <q-th rowspan="2" style="min-width: 180px">NOME</q-th>
                <q-th rowspan="2" style="min-width: 130px">NÚMERO DO MEDIDOR</q-th>
                <q-th colspan="3">TIPO DE LIGAÇÃO</q-th>
                <q-th colspan="3">PADRÃO</q-th>
                <q-th rowspan="2" style="min-width: 140px">POSTE DE LIGAÇÃO</q-th>
                <q-th rowspan="2" style="min-width: 120px">DATA LIGAÇÃO</q-th>
                <q-th rowspan="2" auto-width></q-th>
              </q-tr>
              <q-tr>
                <q-th>MO</q-th>
                <q-th>BI</q-th>
                <q-th>TRI</q-th>
                <q-th>5M</q-th>
                <q-th>7M</q-th>
                <q-th>CPP</q-th>
              </q-tr>
            </template>

            <template #body="props">
              <q-tr :props="props">
                <q-td class="text-center">
                  <span class="row-index">{{ props.row.id }}</span>
                </q-td>
                <q-td>
                  <q-input v-model="props.row.nome" dense outlined hide-bottom-space />
                </q-td>
                <q-td>
                  <q-input
                    v-model="props.row.numeroMedidor"
                    dense
                    outlined
                    hide-bottom-space
                    :error="Boolean(medidorFieldError(props.row))"
                    :error-message="medidorFieldError(props.row) ?? undefined"
                  />
                </q-td>

                <q-td v-for="tipo in tiposLigacao" :key="'tl-' + tipo.value" class="text-center">
                  <q-radio v-model="props.row.tipoLigacao" :val="tipo.value" dense color="primary" />
                </q-td>

                <q-td v-for="pad in padroes" :key="'pd-' + pad.value" class="text-center">
                  <q-radio v-model="props.row.padrao" :val="pad.value" dense color="primary" />
                </q-td>

                <q-td>
                  <q-input
                    v-model="props.row.posteLigacao"
                    dense
                    outlined
                    hide-bottom-space
                    placeholder="PG ou coordenada"
                  />
                </q-td>
                <q-td>
                  <q-input
                    :model-value="props.row.dataLigacao"
                    dense
                    outlined
                    hide-bottom-space
                    readonly
                    filled
                  />
                </q-td>
                <q-td class="text-center">
                  <q-btn
                    flat
                    round
                    dense
                    color="negative"
                    icon="delete_outline"
                    @click="removeConsumidor(props.rowIndex)"
                  >
                    <q-tooltip>Remover linha</q-tooltip>
                  </q-btn>
                </q-td>
              </q-tr>
            </template>
          </q-table>
        </div>
      </q-card>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useQuasar } from 'quasar';
import type { QTableColumn } from 'quasar';
import { computed, watch } from 'vue';
import { useConsumidoresStore, FORNECEDOR_FIXO, REGIONAL_FIXA, TEC_OBRA_FIXO } from 'src/stores/consumidores';
import { consumidorPreenchido, exportToExcel } from 'src/utils/excel';
import { exportToPdf } from 'src/utils/pdf';
import {
  getMedidorFieldError,
  validateConsumidoresParaExportacao,
} from 'src/utils/consumidor-helpers';

const $q = useQuasar();
const store = useConsumidoresStore();
const { obra, consumidores } = storeToRefs(store);
const { addConsumidor, removeConsumidor, resetForm, syncDatas, touchConsumidor } = store;

const preenchidosCount = computed(
  () => consumidores.value.filter(consumidorPreenchido).length,
);

watch(
  consumidores,
  (rows) => {
    rows.forEach((consumidor) => touchConsumidor(consumidor));
  },
  { deep: true },
);

function medidorFieldError(consumidor: (typeof consumidores.value)[number]) {
  return getMedidorFieldError(consumidor);
}

function onDataObraChange(value: string | number | null) {
  syncDatas(String(value ?? ''));
}

const tiposLigacao = [
  { label: 'MO', value: 'MO' as const },
  { label: 'BI', value: 'BI' as const },
  { label: 'TRI', value: 'TRI' as const },
];

const padroes = [
  { label: '5M', value: '5M' as const },
  { label: '7M', value: '7M' as const },
  { label: 'CPP', value: 'CPP' as const },
];

const columns: QTableColumn[] = [{ name: 'id', label: 'Nº', field: 'id' }];

function notifyExportValidationErrors(errors: string[]) {
  $q.notify({
    type: 'negative',
    message: 'Não foi possível exportar. Corrija os medidores:',
    caption: errors.join(' · '),
    multiLine: errors.length > 1,
    timeout: 8000,
  });
}

function ensureExportavel(): boolean {
  const errors = validateConsumidoresParaExportacao(consumidores.value);
  if (errors.length > 0) {
    notifyExportValidationErrors(errors);
    return false;
  }
  return true;
}

async function handleExport() {
  if (!ensureExportavel()) return;

  try {
    const fileName = await exportToExcel(obra.value, consumidores.value);
    $q.notify({
      type: 'positive',
      message: `Arquivo ${fileName} gerado com sucesso.`,
    });
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: 'Erro ao exportar Excel.',
    });
    console.error(error);
  }
}

async function handleExportPdf() {
  if (!ensureExportavel()) return;

  const dismiss = $q.notify({
    type: 'ongoing',
    message: 'Gerando PDF...',
    timeout: 0,
  });

  try {
    const fileName = await exportToPdf(obra.value, consumidores.value);
    dismiss();
    $q.notify({
      type: 'positive',
      message: `Arquivo ${fileName} gerado com sucesso.`,
    });
  } catch (error) {
    dismiss();
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Erro ao gerar PDF.',
    });
    console.error(error);
  }
}

function handleReset() {
  $q.dialog({
    title: 'Limpar formulário',
    message: 'Deseja apagar todos os dados preenchidos?',
    cancel: true,
    persistent: true,
  }).onOk(() => {
    resetForm();
    $q.notify({ type: 'info', message: 'Formulário limpo.' });
  });
}
</script>
