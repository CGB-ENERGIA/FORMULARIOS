<template>
  <q-page class="page-shell">
    <div class="page-shell__inner">
      <header class="page-header">
        <div class="page-header__eyebrow">
          <q-icon name="power_off" size="14px" />
          Formulário operacional
        </div>
        <h1 class="page-header__title">Aviso de Desligamento</h1>
        <p class="page-header__subtitle">
          Preencha os dados da obra, da solicitação de intervenção e os consumidores. Exporte no
          layout original da planilha.
        </p>
      </header>

      <q-card flat class="premium-card q-mb-md">
        <div class="premium-card__header">
          <div class="premium-card__header-title">
            <div class="premium-card__header-icon">
              <q-icon name="engineering" size="22px" />
            </div>
            Dados da Obra
          </div>
        </div>

        <q-card-section class="premium-card__body field-grid">
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-4">
              <q-input v-model="obra.nota" label="Nota" outlined dense hide-bottom-space />
            </div>
            <div class="col-12 col-md-4">
              <q-input v-model="obra.contrato" label="Contrato" outlined dense hide-bottom-space readonly />
            </div>
            <div class="col-12 col-md-4">
              <q-input v-model="obra.pep" label="PEP" outlined dense hide-bottom-space />
            </div>
            <div class="col-12 col-md-6">
              <q-input v-model="obra.fornecedor" label="Fornecedor" outlined dense hide-bottom-space readonly />
            </div>
            <div class="col-12 col-md-6">
              <q-input v-model="obra.cidade" label="Cidade" outlined dense hide-bottom-space />
            </div>
            <div class="col-12">
              <q-input
                v-model="obra.descricaoObra"
                label="Descrição da Obra"
                outlined
                dense
                hide-bottom-space
              />
            </div>
            <div class="col-12 col-md-4">
              <q-input
                v-model="obra.data"
                label="Data"
                outlined
                dense
                mask="##/##/####"
                placeholder="DD/MM/AAAA"
                hide-bottom-space
              >
                <template #append>
                  <q-icon name="event" class="cursor-pointer">
                    <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                      <q-date v-model="obra.data" mask="DD/MM/YYYY">
                        <div class="row items-center justify-end">
                          <q-btn v-close-popup label="Fechar" color="primary" flat no-caps />
                        </div>
                      </q-date>
                    </q-popup-proxy>
                  </q-icon>
                </template>
              </q-input>
            </div>
            <div class="col-12 col-md-4">
              <div class="row q-gutter-sm no-wrap items-center">
                <q-input
                  v-model="obra.siMes"
                  label="Solicitação de Intervenção (SI) / Mês"
                  outlined
                  dense
                  hide-bottom-space
                  class="col"
                />
                <q-btn
                  icon="picture_as_pdf"
                  flat
                  round
                  dense
                  color="primary"
                  title="Importar SI do PDF"
                  @click="triggerSiPdfUpload"
                />
                <q-btn icon="calendar_month" flat round dense color="primary" title="Selecionar mês">
                  <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                    <q-date
                      v-model="siDate"
                      minimal
                      @update:model-value="handleSiDateChange"
                    >
                      <div class="row items-center justify-end">
                        <q-btn v-close-popup label="Fechar" color="primary" flat no-caps />
                      </div>
                    </q-date>
                  </q-popup-proxy>
                </q-btn>
                <input
                  ref="siPdfInput"
                  type="file"
                  accept="application/pdf"
                  class="hidden"
                  @change="handleSiPdfChange"
                />
              </div>
            </div>
          </div>
        </q-card-section>
      </q-card>

      <q-card flat class="premium-card q-mb-md">
        <div class="premium-card__header">
          <div class="premium-card__header-title">
            <div class="premium-card__header-icon">
              <q-icon name="assignment" size="22px" />
            </div>
            Dados da Solicitação de Intervenção
          </div>
        </div>

        <q-card-section class="premium-card__body field-grid">
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-6">
              <q-input
                v-model="solicitacao.inicioDesligamento"
                label="Início Desligamento"
                outlined
                dense
                mask="##/##/#### ##:##"
                placeholder="DD/MM/AAAA HH:MM"
                hide-bottom-space
              />
            </div>
            <div class="col-12 col-md-6">
              <q-input
                v-model="solicitacao.fimDesligamento"
                label="Fim Desligamento"
                outlined
                dense
                mask="##/##/#### ##:##"
                placeholder="DD/MM/AAAA HH:MM"
                hide-bottom-space
              />
            </div>
            <div class="col-12 col-md-6">
              <q-input
                v-model="solicitacao.numeroOperacional"
                label="Nº Operacional"
                outlined
                dense
                hide-bottom-space
              />
            </div>
            <div class="col-12 col-md-6">
              <q-input
                v-model="solicitacao.numeroBarramento"
                label="Nº Barramento"
                outlined
                dense
                hide-bottom-space
              />
            </div>
            <div class="col-12 col-md-6">
              <q-input
                v-model="solicitacao.valorUnitarioSemProtocolo"
                label="Valor unitário s/ protocolo (R$)"
                outlined
                dense
                hide-bottom-space
                placeholder="7,04"
              />
            </div>
            <div class="col-12 col-md-6">
              <q-input
                v-model="solicitacao.valorUnitarioComProtocolo"
                label="Valor unitário c/ protocolo (R$)"
                outlined
                dense
                hide-bottom-space
                placeholder="8,24"
              />
            </div>
            <div class="col-12 col-md-6">
              <q-input
                :model-value="String(qtdSemProtocolo)"
                label="Qtd. s/ protocolo"
                outlined
                dense
                readonly
                filled
                hide-bottom-space
              />
            </div>
            <div class="col-12 col-md-6">
              <q-input
                :model-value="String(qtdComProtocolo)"
                label="Qtd. c/ protocolo"
                outlined
                dense
                readonly
                filled
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

        <q-input
          v-model="searchQuery"
          outlined
          dense
          placeholder="Buscar por nome, contrato ou medidor…"
          style="min-width: 260px"
          clearable
          hide-bottom-space
        >
          <template #prepend>
            <q-icon name="search" />
          </template>
        </q-input>

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
            icon="picture_as_pdf"
            :label="$q.screen.gt.xs ? 'Exportar PDF' : undefined"
            color="red-7"
            no-caps
            @click="handleExportPdf"
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
            class="consumidores-table desligamento-table"
            flat
            :rows="filteredConsumidores"
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
                <q-th auto-width>Nº</q-th>
                <q-th style="min-width: 140px">CONTA CONTRATO</q-th>
                <q-th style="min-width: 130px">Nº MEDIDOR</q-th>
                <q-th style="min-width: 220px">NOME COMPLETO</q-th>
                <q-th style="min-width: 180px">PROTOCOLAR</q-th>
                <q-th auto-width></q-th>
              </q-tr>
            </template>

            <template #body="props">
              <q-tr :props="props">
                <q-td class="text-center">
                  <span class="row-index">{{ props.row.id }}</span>
                </q-td>
                <q-td>
                  <q-input v-model="props.row.contaContrato" dense outlined hide-bottom-space />
                </q-td>
                <q-td>
                  <q-input v-model="props.row.numeroMedidor" dense outlined hide-bottom-space />
                </q-td>
                <q-td>
                  <q-input v-model="props.row.nomeCompleto" dense outlined hide-bottom-space />
                </q-td>
                <q-td>
                  <q-btn-toggle
                    v-model="props.row.protocolar"
                    spread
                    dense
                    no-caps
                    toggle-color="primary"
                    :options="protocolarOpcoes"
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

      <!-- Evidências -->
      <q-card flat class="premium-card q-mb-md">
        <div class="premium-card__header">
          <div class="premium-card__header-title">
            <div class="premium-card__header-icon">
              <q-icon name="photo_library" size="22px" />
            </div>
            Evidências
          </div>
        </div>

        <q-card-section class="premium-card__body">
          <div class="row q-col-gutter-md">
            <div
              v-for="(_, i) in evidencias"
              :key="i"
              class="col-12 col-md-6"
            >
              <div class="text-caption text-grey-7 q-mb-xs">{{ EVIDENCIA_LABELS[i] }}</div>

              <!-- Preview -->
              <div
                v-if="evidencias[i]"
                class="evidencia-preview relative-position"
              >
                <img
                  :src="evidencias[i]!"
                  class="evidencia-img"
                  style="width:100%; max-height:260px; object-fit:contain; border-radius:8px; border:1px solid #e0e0e0;"
                />
                <q-btn
                  icon="close"
                  round
                  dense
                  size="sm"
                  color="negative"
                  class="absolute-top-right q-ma-xs"
                  @click="removeEvidencia(i)"
                />
              </div>

              <!-- Upload zone -->
              <div
                v-else
                class="evidencia-upload-zone cursor-pointer flex flex-center column"
                style="border:2px dashed #bdbdbd; border-radius:8px; height:180px; gap:8px;"
                @click="triggerEvidenciaUpload(i)"
              >
                <q-icon name="add_photo_alternate" size="40px" color="grey-5" />
                <span class="text-grey-6 text-caption">Clique para adicionar foto</span>
              </div>

              <input
                :ref="(el) => { evidenciaInputs[i] = el as HTMLInputElement | null }"
                type="file"
                accept="image/*"
                class="hidden"
                @change="(e) => handleEvidenciaChange(e, i)"
              />
            </div>
          </div>
        </q-card-section>
      </q-card>

      <div class="row justify-end q-gutter-sm q-mb-lg">
        <q-btn
          unelevated
          icon="picture_as_pdf"
          label="Exportar PDF"
          color="red-7"
          no-caps
          size="md"
          @click="handleExportPdf"
        />
        <q-btn
          unelevated
          icon="download"
          label="Exportar Excel"
          class="action-btn--excel"
          no-caps
          size="md"
          @click="handleExport"
        />
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useQuasar } from 'quasar';
import type { QTableColumn } from 'quasar';
import { computed, ref } from 'vue';
import { useDesligamentoStore } from 'src/stores/desligamento';
import { parseSiMesFromPdf, parseConsumidoresFromPdf, parseDatesFromPdf } from 'src/utils/parse-si-pdf';
import {
  consumidorDesligamentoComDados,
  contarPorProtocolar,
  validateDesligamentoParaExportacao,
} from 'src/utils/desligamento-helpers';
import { exportDesligamentoToExcel } from 'src/utils/desligamento-excel';
import { exportDesligamentoToPdf } from 'src/utils/desligamento-pdf';

const $q = useQuasar();
const store = useDesligamentoStore();
const { obra, solicitacao, consumidores, evidencias } = storeToRefs(store);
const { addConsumidor, removeConsumidor, resetForm } = store;

const siPdfInput = ref<HTMLInputElement | null>(null);
const siDate = ref('');

function handleSiDateChange(val: string) {
  // QDate retorna YYYY/MM/DD — extraímos só o mês
  const month = val.split('/')[1];
  const siNum = obra.value.siMes.split('/')[0] ?? obra.value.siMes;
  obra.value.siMes = `${siNum}/${month}`;
}

function triggerSiPdfUpload() {
  siPdfInput.value?.click();
}

async function handleSiPdfChange(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;

  try {
    const [si, consumidoresPdf, dates] = await Promise.all([
      parseSiMesFromPdf(file),
      parseConsumidoresFromPdf(file),
      parseDatesFromPdf(file),
    ]);

    obra.value.siMes = si;
    obra.value.data = dates.data;
    solicitacao.value.inicioDesligamento = dates.inicioDesligamento;
    solicitacao.value.fimDesligamento = dates.fimDesligamento;

    if (consumidoresPdf.length > 0) {
      consumidores.value = consumidoresPdf.map((c, i) => ({
        id: i + 1,
        contaContrato: c.contaContrato,
        numeroMedidor: c.numeroMedidor,
        nomeCompleto: c.nomeCompleto,
        protocolar: 'NAO' as const,
      }));
    }

    $q.notify({
      type: 'positive',
      message: `PDF importado: SI ${si} · ${consumidoresPdf.length} consumidor(es) encontrado(s).`,
    });
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Erro ao ler o PDF.',
    });
  } finally {
    (event.target as HTMLInputElement).value = '';
  }
}

const evidenciaInputs = ref<(HTMLInputElement | null)[]>(Array(8).fill(null));

const EVIDENCIA_LABELS = [
  'Evidência 1',
  'Evidência 2 — Tela da SI no PROSIS (obrigatório)',
  'Evidência 3',
  'Evidência 4',
  'Evidência 5',
  'Evidência 6',
  'Evidência 7',
  'Evidência 8',
];

function triggerEvidenciaUpload(index: number) {
  evidenciaInputs.value[index]?.click();
}

function handleEvidenciaChange(event: Event, index: number) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    evidencias.value[index] = e.target?.result as string;
  };
  reader.readAsDataURL(file);
  (event.target as HTMLInputElement).value = '';
}

function removeEvidencia(index: number) {
  evidencias.value[index] = null;
}

const protocolarOpcoes = [
  { label: 'Sim', value: 'SIM' as const },
  { label: 'Não', value: 'NAO' as const },
];

const columns: QTableColumn[] = [{ name: 'id', label: 'Nº', field: 'id' }];

const searchQuery = ref('');

const filteredConsumidores = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  if (!q) return consumidores.value;
  return consumidores.value.filter(
    (c) =>
      c.nomeCompleto.toLowerCase().includes(q) ||
      c.contaContrato.toLowerCase().includes(q) ||
      c.numeroMedidor.toLowerCase().includes(q),
  );
});

const preenchidosCount = computed(
  () => consumidores.value.filter(consumidorDesligamentoComDados).length,
);

const qtdSemProtocolo = computed(() => contarPorProtocolar(consumidores.value, 'NAO'));
const qtdComProtocolo = computed(() => contarPorProtocolar(consumidores.value, 'SIM'));

async function handleExport() {
  const errors = validateDesligamentoParaExportacao(consumidores.value);
  if (errors.length > 0) {
    $q.notify({
      type: 'negative',
      message: 'Não foi possível exportar.',
      caption: errors.join(' · '),
      multiLine: errors.length > 1,
      timeout: 8000,
    });
    return;
  }

  try {
    const fileName = await exportDesligamentoToExcel(
      obra.value,
      solicitacao.value,
      consumidores.value,
      evidencias.value,
    );
    $q.notify({
      type: 'positive',
      message: `Arquivo ${fileName} gerado com sucesso.`,
    });
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Erro ao exportar Excel.',
    });
    console.error(error);
  }
}

async function handleExportPdf() {
  try {
    const fileName = await exportDesligamentoToPdf(
      obra.value,
      solicitacao.value,
      consumidores.value,
      evidencias.value,
    );
    $q.notify({ type: 'positive', message: `Arquivo ${fileName} gerado com sucesso.` });
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Erro ao exportar PDF.',
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

<style scoped>
.desligamento-table {
  min-width: 900px;
}
</style>
