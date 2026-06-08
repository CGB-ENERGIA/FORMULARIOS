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

      <!-- Seletor de Distrital (obrigatório) -->
      <q-card flat class="premium-card q-mb-md">
        <div class="premium-card__header">
          <div class="premium-card__header-title">
            <div class="premium-card__header-icon">
              <q-icon name="location_city" size="22px" />
            </div>
            Distrital
          </div>
          <q-btn
            flat dense no-caps
            icon="history"
            label="Ver Histórico"
            color="primary"
            size="sm"
            @click="$router.push('/historico')"
          />
        </div>
        <q-card-section class="premium-card__body">
          <div class="row q-gutter-sm items-center">
            <q-btn
              v-for="d in DISTRITAIS"
              :key="d"
              :label="d"
              :color="distrital === d ? 'primary' : 'grey-7'"
              :unelevated="distrital === d"
              :outline="distrital !== d"
              no-caps
              class="distrital-btn"
              @click="distrital = d"
            />
          </div>
          <div v-if="!distrital" class="distrital-hint">
            <q-icon name="info" size="16px" color="warning" />
            Selecione uma distrital para habilitar o formulário
          </div>
        </q-card-section>
      </q-card>

      <!-- Formulário — só aparece após selecionar distrital -->
      <template v-if="distrital">

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
                label="Descrição da Obra *"
                outlined
                dense
                hide-bottom-space
                :error="obraFieldHasError('descricaoObra')"
                :error-message="obraFieldError('descricaoObra') ?? undefined"
              />
            </div>
            <div class="col-12 col-md-6">
              <q-input
                :model-value="FORNECEDOR_FIXO"
                label="Fornecedor *"
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
                label="Elemento PEP *"
                outlined
                dense
                hide-bottom-space
                :error="obraFieldHasError('elementoPep')"
                :error-message="obraFieldError('elementoPep') ?? undefined"
              />
            </div>
            <div class="col-12 col-md-6">
              <q-input
                :model-value="obra.dataConclusao"
                label="Data da Conclusão *"
                outlined
                dense
                mask="##/##/####"
                placeholder="DD/MM/AAAA"
                hide-bottom-space
                :error="obraFieldHasError('dataConclusao')"
                :error-message="obraFieldError('dataConclusao') ?? undefined"
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
                label="Data da Energização *"
                outlined
                dense
                mask="##/##/####"
                placeholder="DD/MM/AAAA"
                hide-bottom-space
                :error="obraFieldHasError('dataEnergizacao')"
                :error-message="obraFieldError('dataEnergizacao') ?? undefined"
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
                label="Téc da Obra *"
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
                label="Regional *"
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
                label="Localidade *"
                outlined
                dense
                hide-bottom-space
                :error="obraFieldHasError('localidade')"
                :error-message="obraFieldError('localidade') ?? undefined"
              />
            </div>
            <div class="col-12 col-md-6">
              <q-input
                v-model="obra.municipio"
                label="Município *"
                outlined
                dense
                hide-bottom-space
                :error="obraFieldHasError('municipio')"
                :error-message="obraFieldError('municipio') ?? undefined"
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
                    @update:model-value="onNumeroMedidorChange(props.row)"
                  />
                </q-td>

                <q-td v-for="tipo in tiposLigacao" :key="'tl-' + tipo.value" class="text-center">
                  <q-radio v-model="props.row.tipoLigacao" :val="tipo.value" dense color="primary" />
                </q-td>

                <q-td
                  v-for="(pad, padIdx) in padroes"
                  :key="'pd-' + pad.value"
                  class="text-center"
                  :class="padraoCellClass(props.row, padIdx)"
                >
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

      </template>
      <!-- /v-if distrital -->

    </div>
  </q-page>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useQuasar } from 'quasar';
import type { QTableColumn } from 'quasar';
import { computed, ref, watch } from 'vue';
import { useConsumidoresStore, FORNECEDOR_FIXO, REGIONAL_FIXA, TEC_OBRA_FIXO } from 'src/stores/consumidores';
import type { ObraInfo } from 'src/stores/consumidores';
import { consumidorPreenchido, exportToExcel } from 'src/utils/excel';
import { exportToPdf } from 'src/utils/pdf';
import {
  applyTipoLigacaoFromMedidor,
  getMedidorFieldError,
  validateConsumidoresParaExportacao,
  consumidorComDados,
} from 'src/utils/consumidor-helpers';
import { getObraFieldError, validateObraParaExportacao } from 'src/utils/obra-helpers';
import {
  DISTRITAIS,
  appendHistoricoEntry,
} from 'src/utils/historico-file';
import type { DistritalCode, HistoricoEntry } from 'src/utils/historico-file';

const $q = useQuasar();
const store = useConsumidoresStore();
const { obra, consumidores, distrital } = storeToRefs(store);
const { addConsumidor, removeConsumidor, resetForm, syncDatas, touchConsumidor } = store;
const obraValidacaoAtiva = ref(false);

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

function onNumeroMedidorChange(consumidor: (typeof consumidores.value)[number]) {
  applyTipoLigacaoFromMedidor(consumidor);
}

function obraFieldError(field: keyof ObraInfo) {
  if (!obraValidacaoAtiva.value) return null;
  return getObraFieldError(obra.value, field);
}

function obraFieldHasError(field: keyof ObraInfo) {
  return Boolean(obraFieldError(field));
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

function padraoPendente(row: (typeof consumidores.value)[number]): boolean {
  return obraValidacaoAtiva.value && consumidorComDados(row) && !row.padrao;
}

function padraoCellClass(row: (typeof consumidores.value)[number], idx: number) {
  if (!padraoPendente(row)) return '';
  return [
    'padrao-error',
    idx === 0 ? 'padrao-error--first' : '',
    idx === padroes.length - 1 ? 'padrao-error--last' : '',
  ];
}

const columns: QTableColumn[] = [{ name: 'id', label: 'Nº', field: 'id' }];

function notifyExportValidationErrors(errors: string[]) {
  $q.notify({
    type: 'negative',
    message: 'Não foi possível exportar. Corrija os campos:',
    caption: errors.join(' · '),
    multiLine: errors.length > 1,
    timeout: 8000,
  });
}

function ensureExportavel(): boolean {
  obraValidacaoAtiva.value = true;
  const errors = [
    ...validateObraParaExportacao(obra.value),
    ...validateConsumidoresParaExportacao(consumidores.value),
  ];
  if (errors.length > 0) {
    notifyExportValidationErrors(errors);
    return false;
  }
  return true;
}

async function salvarHistorico(): Promise<void> {
  if (!distrital.value) return;

  const preenchidos = consumidores.value.filter(consumidorPreenchido);

  const entry: HistoricoEntry = {
    id: new Date().toISOString(),
    distrital: distrital.value as DistritalCode,
    descricaoObra: obra.value.descricaoObra,
    elementoPep: obra.value.elementoPep,
    dataConclusao: obra.value.dataConclusao,
    municipio: obra.value.municipio,
    localidade: obra.value.localidade,
    totalConsumidores: preenchidos.length,
    consumidores: preenchidos.map((c) => ({
      nome: c.nome,
      numeroMedidor: c.numeroMedidor,
      tipoLigacao: c.tipoLigacao,
      padrao: c.padrao,
      posteLigacao: c.posteLigacao,
      dataLigacao: c.dataLigacao,
    })),
  };

  try {
    await appendHistoricoEntry(entry);
  } catch (error) {
    console.error('Erro ao salvar histórico:', error);
  }
}

async function handleExport() {
  if (!ensureExportavel()) return;

  try {
    const fileName = await exportToExcel(obra.value, consumidores.value);
    $q.notify({
      type: 'positive',
      message: `Arquivo ${fileName} gerado com sucesso.`,
    });
    await salvarHistorico();
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
    await salvarHistorico();
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
    obraValidacaoAtiva.value = false;
    $q.notify({ type: 'info', message: 'Formulário limpo.' });
  });
}
</script>

<style scoped>
.distrital-btn {
  font-weight: 600;
  letter-spacing: 0.5px;
  min-width: 72px;
}

.distrital-hint {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 12px;
  font-size: 13px;
  color: var(--q-color-warning, #f59e0b);
}

/* Destaque vermelho nas células de PADRÃO sem preenchimento */
.padrao-error {
  background: rgba(220, 38, 38, 0.07) !important;
  border-top: 1.5px solid rgba(220, 38, 38, 0.55) !important;
  border-bottom: 1.5px solid rgba(220, 38, 38, 0.55) !important;
}

.padrao-error--first {
  border-left: 1.5px solid rgba(220, 38, 38, 0.55) !important;
}

.padrao-error--last {
  border-right: 1.5px solid rgba(220, 38, 38, 0.55) !important;
}
</style>
