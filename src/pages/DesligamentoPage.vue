<template>
  <q-page class="page-shell">
    <div class="page-shell__inner">
      <header class="page-header">
        <h1 class="page-header__title">Aviso de Desligamento</h1>
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
              <q-input
                v-model="obra.nota"
                label="Nota *"
                outlined
                dense
                hide-bottom-space
                :error="obraFieldHasError('nota')"
                :error-message="obraFieldError('nota') ?? undefined"
              />
            </div>
            <div class="col-12 col-md-4">
              <q-input v-model="obra.contrato" label="Contrato *" outlined dense hide-bottom-space readonly />
            </div>
            <div class="col-12 col-md-4">
              <q-input
                v-model="obra.pep"
                label="PEP *"
                outlined
                dense
                hide-bottom-space
                :error="obraFieldHasError('pep')"
                :error-message="obraFieldError('pep') ?? undefined"
              />
            </div>
            <div class="col-12 col-md-6">
              <q-input v-model="obra.fornecedor" label="Fornecedor *" outlined dense hide-bottom-space readonly />
            </div>
            <div class="col-12 col-md-6">
              <q-select
                v-model="obra.cidade"
                :options="municipioOptionsFiltered"
                label="Cidade *"
                outlined
                dense
                hide-bottom-space
                clearable
                use-input
                fill-input
                hide-selected
                input-debounce="0"
                :error="obraFieldHasError('cidade')"
                :error-message="obraFieldError('cidade') ?? undefined"
                @filter="filterMunicipios"
              />
            </div>
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
            <div class="col-12 col-md-4">
              <q-input
                v-model="obra.data"
                label="Data *"
                outlined
                dense
                mask="##/##/####"
                placeholder="DD/MM/AAAA"
                hide-bottom-space
                :error="obraFieldHasError('data')"
                :error-message="obraFieldError('data') ?? undefined"
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
                  label="Solicitação de Intervenção (SI) / Mês *"
                  outlined
                  dense
                  hide-bottom-space
                  class="col"
                  :error="obraFieldHasError('siMes')"
                  :error-message="obraFieldError('siMes') ?? undefined"
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
                label="Início Desligamento *"
                outlined
                dense
                mask="##/##/#### ##:##"
                placeholder="DD/MM/AAAA HH:MM"
                hide-bottom-space
                :error="siFieldHasError('inicioDesligamento')"
                :error-message="siFieldError('inicioDesligamento') ?? undefined"
              />
            </div>
            <div class="col-12 col-md-6">
              <q-input
                v-model="solicitacao.fimDesligamento"
                label="Fim Desligamento *"
                outlined
                dense
                mask="##/##/#### ##:##"
                placeholder="DD/MM/AAAA HH:MM"
                hide-bottom-space
                :error="siFieldHasError('fimDesligamento')"
                :error-message="siFieldError('fimDesligamento') ?? undefined"
              />
            </div>
            <div class="col-12 col-md-6">
              <q-input
                v-model="solicitacao.numeroOperacional"
                label="Nº Componente *"
                outlined
                dense
                hide-bottom-space
                :error="siFieldHasError('numeroOperacional')"
                :error-message="siFieldError('numeroOperacional') ?? undefined"
              />
            </div>
            <div class="col-12 col-md-6">
              <q-input
                v-model="solicitacao.numeroBarramento"
                label="Nº Barramento *"
                outlined
                dense
                hide-bottom-space
                :error="siFieldHasError('numeroBarramento')"
                :error-message="siFieldError('numeroBarramento') ?? undefined"
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
                :readonly="!valoresUnitariosLiberados"
                :filled="!valoresUnitariosLiberados"
                @focus="solicitarSenhaValoresUnitarios"
              >
                <template #append>
                  <q-icon
                    :name="valoresUnitariosLiberados ? 'lock_open' : 'lock'"
                    class="cursor-pointer"
                    @click="solicitarSenhaValoresUnitarios"
                  >
                    <q-tooltip>
                      {{
                        valoresUnitariosLiberados
                          ? 'Edição liberada'
                          : 'Bloqueado — informe a senha para editar'
                      }}
                    </q-tooltip>
                  </q-icon>
                </template>
              </q-input>
            </div>
            <div class="col-12 col-md-6">
              <q-input
                v-model="solicitacao.valorUnitarioComProtocolo"
                label="Valor unitário c/ protocolo (R$)"
                outlined
                dense
                hide-bottom-space
                placeholder="8,24"
                :readonly="!valoresUnitariosLiberados"
                :filled="!valoresUnitariosLiberados"
                @focus="solicitarSenhaValoresUnitarios"
              >
                <template #append>
                  <q-icon
                    :name="valoresUnitariosLiberados ? 'lock_open' : 'lock'"
                    class="cursor-pointer"
                    @click="solicitarSenhaValoresUnitarios"
                  >
                    <q-tooltip>
                      {{
                        valoresUnitariosLiberados
                          ? 'Edição liberada'
                          : 'Bloqueado — informe a senha para editar'
                      }}
                    </q-tooltip>
                  </q-icon>
                </template>
              </q-input>
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

        <div class="search-bar">
          <q-icon name="search" size="18px" class="search-bar__icon" />
          <input
            v-model="searchQuery"
            class="search-bar__input"
            type="text"
            placeholder="Buscar por nome, contrato ou nº medidor"
          />
          <q-btn
            v-if="searchQuery"
            flat
            round
            dense
            icon="close"
            size="xs"
            class="search-bar__clear"
            @click="searchQuery = ''"
          />
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
            icon="picture_as_pdf"
            :label="$q.screen.gt.xs ? 'Exportar PDF' : undefined"
            color="red-7"
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
                  <q-input
                    :model-value="props.row.numeroMedidor"
                    dense
                    outlined
                    hide-bottom-space
                    type="tel"
                    inputmode="numeric"
                    pattern="[0-9]*"
                    @update:model-value="props.row.numeroMedidor = sanitizeDigits($event)"
                  />
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
                class="evidencia-zone evidencia-zone--filled relative-position"
                :class="evidenciaZoneClass(i)"
                tabindex="0"
                title="Arraste a imagem para outro quadrado ou cole com Ctrl+V"
                @click="selectEvidencia(i, $event)"
                @paste="(e) => handleEvidenciaPaste(e, i)"
                @dragover="handleEvidenciaDragOver(i, $event)"
                @drop="handleEvidenciaDrop(i, $event)"
              >
                <img
                  :src="evidencias[i]!"
                  draggable="true"
                  class="evidencia-img evidencia-img--draggable"
                  style="width:100%; max-height:260px; object-fit:contain; border-radius:8px;"
                  @dragstart="handleEvidenciaDragStart(i, $event)"
                  @dragend="handleEvidenciaDragEnd"
                />
                <q-btn
                  icon="close"
                  round
                  dense
                  size="sm"
                  color="negative"
                  class="absolute-top-right q-ma-xs"
                  @click.stop="removeEvidencia(i)"
                />
              </div>

              <!-- Upload zone -->
              <div
                v-else
                class="evidencia-zone evidencia-zone--empty flex flex-center column"
                :class="evidenciaZoneClass(i)"
                tabindex="0"
                title="Selecione o quadrado, cole com Ctrl+V ou solte uma imagem arrastada"
                @click="selectEvidencia(i, $event)"
                @paste="(e) => handleEvidenciaPaste(e, i)"
                @keydown.enter="selectEvidencia(i, $event)"
                @dragover="handleEvidenciaDragOver(i, $event)"
                @drop="handleEvidenciaDrop(i, $event)"
              >
                <button
                  type="button"
                  class="evidencia-zone__upload-trigger"
                  aria-label="Anexar imagem"
                  @click.stop="triggerEvidenciaUpload(i)"
                >
                  <q-icon name="add_photo_alternate" size="40px" color="grey-5" />
                  <span class="text-grey-6 text-caption">Clique para anexar</span>
                </button>
                <span class="evidencia-zone__paste-hint text-grey-6 text-caption">
                  ou selecione, cole (Ctrl+V) ou arraste
                </span>
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
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useQuasar } from 'quasar';
import type { QTableColumn } from 'quasar';
import { computed, ref, onMounted, onUnmounted, watch } from 'vue';
import { useDesligamentoStore } from 'src/stores/desligamento';
import { parseSiMesFromPdf, parseConsumidoresFromPdf, parseDatesFromPdf } from 'src/utils/parse-si-pdf';
import type { DesligamentoObra, DesligamentoSI } from 'src/stores/desligamento';
import { sanitizeDigits } from 'src/utils/consumidor-helpers';
import {
  consumidorDesligamentoComDados,
  contarPorProtocolar,
  getDesligamentoObraFieldError,
  getDesligamentoSIFieldError,
  validateDesligamentoParaExportacao,
} from 'src/utils/desligamento-helpers';
import { exportDesligamentoToPdf } from 'src/utils/desligamento-pdf';
import municipiosMaranhaoData from 'src/data/municipios-maranhao.json';
import { setProtectedDefault } from 'src/utils/protected-defaults';

const $q = useQuasar();
const store = useDesligamentoStore();
const { obra, solicitacao, consumidores, evidencias } = storeToRefs(store);
const { addConsumidor, removeConsumidor, resetForm } = store;

const municipioOptions = municipiosMaranhaoData as string[];
const municipioOptionsFiltered = ref(municipioOptions);

function normalizeSearch(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function filterMunicipios(
  val: string,
  update: (callback: () => void) => void,
) {
  update(() => {
    const needle = normalizeSearch(val);
    municipioOptionsFiltered.value = needle === ''
      ? municipioOptions
      : municipioOptions.filter((m) => normalizeSearch(m).includes(needle));
  });
}

const siPdfInput = ref<HTMLInputElement | null>(null);
const siDate = ref('');
const desligamentoValidacaoAtiva = ref(false);
const valoresUnitariosLiberados = ref(false);
const VALORES_UNITARIOS_SENHA = 'CGB123';

watch(
  () => solicitacao.value.valorUnitarioSemProtocolo,
  (valor) => {
    if (!valoresUnitariosLiberados.value || !valor.trim()) return;
    setProtectedDefault('desligamento', 'valorUnitarioSemProtocolo', valor.trim());
  },
);

watch(
  () => solicitacao.value.valorUnitarioComProtocolo,
  (valor) => {
    if (!valoresUnitariosLiberados.value || !valor.trim()) return;
    setProtectedDefault('desligamento', 'valorUnitarioComProtocolo', valor.trim());
  },
);

function solicitarSenhaValoresUnitarios() {
  if (valoresUnitariosLiberados.value) return;

  $q.dialog({
    title: 'Campos protegidos',
    message: 'Informe a senha para alterar os valores unitários.',
    prompt: {
      model: '',
      type: 'password',
      outlined: true,
      dense: true,
      label: 'Senha',
      isValid: (val) => val.length > 0,
    },
    cancel: { label: 'Cancelar', flat: true },
    ok: { label: 'Liberar', color: 'primary', unelevated: true },
    persistent: true,
  }).onOk((senha: string) => {
    if (senha === VALORES_UNITARIOS_SENHA) {
      valoresUnitariosLiberados.value = true;
      $q.notify({
        type: 'positive',
        message: 'Valores unitários liberados para edição.',
      });
      return;
    }

    $q.notify({
      type: 'negative',
      message: 'Senha incorreta.',
    });
  });
}

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
const selectedEvidenciaIndex = ref<number | null>(null);
const draggedEvidenciaIndex = ref<number | null>(null);
const dropTargetEvidenciaIndex = ref<number | null>(null);

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

function evidenciaZoneClass(index: number) {
  return {
    'evidencia-zone--selected': selectedEvidenciaIndex.value === index,
    'evidencia-zone--drop-target': dropTargetEvidenciaIndex.value === index,
    'evidencia-zone--dragging': draggedEvidenciaIndex.value === index,
  };
}

function selectEvidencia(index: number, event?: Event) {
  selectedEvidenciaIndex.value = index;
  const target = event?.currentTarget;
  if (target instanceof HTMLElement) {
    target.focus();
  }
}

function handleEvidenciaDragStart(index: number, event: DragEvent) {
  if (!evidencias.value[index]) return;

  draggedEvidenciaIndex.value = index;
  event.dataTransfer?.setData('application/x-evidencia-index', String(index));
  event.dataTransfer?.setData('text/plain', String(index));
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move';
  }
}

function handleEvidenciaDragEnd() {
  draggedEvidenciaIndex.value = null;
  dropTargetEvidenciaIndex.value = null;
}

function handleEvidenciaDragOver(index: number, event: DragEvent) {
  if (draggedEvidenciaIndex.value === null || draggedEvidenciaIndex.value === index) return;

  event.preventDefault();
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move';
  }
  dropTargetEvidenciaIndex.value = index;
}

function handleEvidenciaDrop(index: number, event: DragEvent) {
  event.preventDefault();

  let fromIndex = draggedEvidenciaIndex.value;
  const fromRaw = event.dataTransfer?.getData('application/x-evidencia-index');
  if (fromRaw) {
    const parsed = Number(fromRaw);
    if (!Number.isNaN(parsed)) {
      fromIndex = parsed;
    }
  }

  if (fromIndex === null || fromIndex === index) {
    handleEvidenciaDragEnd();
    return;
  }

  moveEvidencia(fromIndex, index);
  handleEvidenciaDragEnd();
}

function moveEvidencia(fromIndex: number, toIndex: number) {
  const sourceImage = evidencias.value[fromIndex];
  if (!sourceImage) return;

  const targetImage = evidencias.value[toIndex];
  evidencias.value[toIndex] = sourceImage;
  evidencias.value[fromIndex] = targetImage ?? null;
  selectedEvidenciaIndex.value = toIndex;

  $q.notify({
    type: 'positive',
    message: targetImage
      ? `Evidências ${fromIndex + 1} e ${toIndex + 1} trocadas.`
      : `Imagem movida para Evidência ${toIndex + 1}.`,
  });
}

function triggerEvidenciaUpload(index: number) {
  selectEvidencia(index);
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

function readImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function handleEvidenciaPaste(event: ClipboardEvent, index: number) {
  const items = event.clipboardData?.items;
  if (!items) return;
  for (const item of Array.from(items)) {
    if (item.type.startsWith('image/')) {
      const file = item.getAsFile();
      if (!file) continue;
      event.preventDefault();
      try {
        evidencias.value[index] = await readImageFile(file);
        selectedEvidenciaIndex.value = index;
        $q.notify({ type: 'positive', message: `Evidência ${index + 1} colada com sucesso.` });
      } catch {
        $q.notify({ type: 'negative', message: 'Erro ao colar imagem.' });
      }
      return;
    }
  }
}

// Listener global: Ctrl+V cola na evidência selecionada ou na primeira vazia
async function handleGlobalPaste(event: ClipboardEvent) {
  // Só atua se o foco NÃO estiver dentro de uma zona de evidência
  // (essas já têm seu próprio handler)
  const active = document.activeElement;
  if (active?.closest('.evidencia-zone')) return;

  const items = event.clipboardData?.items;
  if (!items) return;
  for (const item of Array.from(items)) {
    if (item.type.startsWith('image/')) {
      const file = item.getAsFile();
      if (!file) continue;

      let targetIdx = selectedEvidenciaIndex.value;
      if (targetIdx === null) {
        targetIdx = evidencias.value.findIndex((v) => v === null);
      }
      if (targetIdx === -1) {
        $q.notify({ type: 'warning', message: 'Selecione uma evidência ou libere um slot vazio.' });
        return;
      }

      event.preventDefault();
      try {
        evidencias.value[targetIdx] = await readImageFile(file);
        selectedEvidenciaIndex.value = targetIdx;
        $q.notify({ type: 'positive', message: `Print colado na Evidência ${targetIdx + 1}.` });
      } catch {
        $q.notify({ type: 'negative', message: 'Erro ao colar imagem.' });
      }
      return;
    }
  }
}

onMounted(() => document.addEventListener('paste', handleGlobalPaste));
onUnmounted(() => document.removeEventListener('paste', handleGlobalPaste));

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

function obraFieldError(field: keyof DesligamentoObra) {
  if (!desligamentoValidacaoAtiva.value) return null;
  return getDesligamentoObraFieldError(obra.value, field);
}

function obraFieldHasError(field: keyof DesligamentoObra) {
  return Boolean(obraFieldError(field));
}

function siFieldError(field: keyof DesligamentoSI) {
  if (!desligamentoValidacaoAtiva.value) return null;
  return getDesligamentoSIFieldError(solicitacao.value, field);
}

function siFieldHasError(field: keyof DesligamentoSI) {
  return Boolean(siFieldError(field));
}

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
  desligamentoValidacaoAtiva.value = true;
  const errors = validateDesligamentoParaExportacao(
    obra.value,
    solicitacao.value,
    consumidores.value,
  );
  if (errors.length > 0) {
    notifyExportValidationErrors(errors);
    return false;
  }
  const temFoto = evidencias.value.some((e) => e !== null);
  if (!temFoto) {
    $q.notify({
      type: 'negative',
      icon: 'photo_camera',
      message: 'Adicione pelo menos 1 foto de evidência antes de exportar.',
      timeout: 5000,
    });
    return false;
  }
  return true;
}

async function handleExportPdf() {
  if (!ensureExportavel()) return;

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
    desligamentoValidacaoAtiva.value = false;
    valoresUnitariosLiberados.value = false;
    $q.notify({ type: 'info', message: 'Formulário limpo.' });
  });
}
</script>

<style scoped>
.desligamento-table {
  min-width: 900px;
}

</style>
