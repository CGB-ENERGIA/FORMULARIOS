<template>
  <q-page class="page-shell">
    <div class="page-shell__inner">
      <header class="page-header">
        <div class="page-header__eyebrow">
          <q-icon name="swap_horiz" size="14px" />
          Formulário operacional
        </div>
        <h1 class="page-header__title">Arrasto</h1>
        <p class="page-header__subtitle">
          Informe as quantidades na aba Materiais e acompanhe o peso calculado na Síntese.
        </p>
      </header>

      <div class="action-bar action-bar--top">
        <div class="action-bar__actions action-bar__actions--end">
          <q-btn
            outline
            color="negative"
            icon="restart_alt"
            label="LIMPAR"
            no-caps
            @click="handleReset"
          />
          <q-btn
            unelevated
            icon="download"
            label="EXCEL"
            class="action-btn--excel"
            no-caps
            @click="handleExport"
          />
          <q-btn
            unelevated
            icon="picture_as_pdf"
            label="PDF"
            class="action-btn--pdf"
            no-caps
            @click="handleExportPdf"
          />
        </div>
      </div>

      <q-card flat class="premium-card q-mb-md">
        <div class="arrasto-tabs">
          <button
            type="button"
            class="arrasto-tabs__btn"
            :class="{ 'arrasto-tabs__btn--active': abaAtiva === 'sintese' }"
            @click="abaAtiva = 'sintese'"
          >
            SÍNTESE
          </button>
          <button
            type="button"
            class="arrasto-tabs__btn"
            :class="{ 'arrasto-tabs__btn--active': abaAtiva === 'materiais' }"
            @click="abaAtiva = 'materiais'"
          >
            MATERIAIS
          </button>
        </div>

        <q-card-section v-if="abaAtiva === 'sintese'" class="premium-card__body field-grid">
          <div class="text-subtitle2 text-weight-bold q-mb-sm">Informações da Obra</div>
          <div class="row q-col-gutter-md">
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
              <q-select
                v-model="obra.distrital"
                :options="distritalOptions"
                label="Distrital *"
                outlined
                dense
                emit-value
                map-options
                hide-bottom-space
                :error="obraFieldHasError('distrital')"
                :error-message="obraFieldError('distrital') ?? undefined"
              />
            </div>
            <div class="col-12 col-md-4">
              <q-input v-model="obra.reserva" label="Reserva" outlined dense hide-bottom-space />
            </div>
            <div class="col-12 col-md-8">
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
                v-model="obra.cidade"
                label="Cidade *"
                outlined
                dense
                hide-bottom-space
                :error="obraFieldHasError('cidade')"
                :error-message="obraFieldError('cidade') ?? undefined"
              />
            </div>
          </div>

          <q-separator class="q-my-lg" />

          <div class="text-subtitle2 text-weight-bold q-mb-sm">Dados de Peso e Arrasto</div>
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-4">
              <q-input
                :model-value="formatNumeroBr(pesoEmKg)"
                label="Peso em KG"
                outlined
                dense
                readonly
                hide-bottom-space
              />
            </div>
            <div class="col-12 col-md-4">
              <q-input
                :model-value="formatNumeroBr(pesoEmT)"
                label="Peso em T"
                outlined
                dense
                readonly
                hide-bottom-space
              />
            </div>
            <div class="col-12 col-md-4">
              <q-input
                v-model.number="arrastoEmM"
                type="number"
                min="0"
                step="0.001"
                label="Arrasto em M *"
                outlined
                dense
                hide-bottom-space
                :error="arrastoEmMHasError"
                :error-message="arrastoEmMError ?? undefined"
              />
            </div>
            <div class="col-12 col-md-4">
              <q-input
                :model-value="formatNumeroBr(arrastoEmKm)"
                label="Arrasto em KM"
                outlined
                dense
                readonly
                hide-bottom-space
              />
            </div>
            <div class="col-12 col-md-4">
              <q-input
                v-model.number="precoUnitario"
                type="number"
                min="0"
                step="0.01"
                label="Preço Unit."
                outlined
                dense
                hide-bottom-space
              />
            </div>
            <div class="col-12 col-md-4">
              <q-input
                :model-value="formatNumeroBr(qtdACobrar)"
                label="Qtd a Cobrar"
                outlined
                dense
                readonly
                hide-bottom-space
              />
            </div>
            <div class="col-12 col-md-4">
              <q-input
                :model-value="formatNumeroBr(valorRs, 2)"
                label="Valor R$"
                outlined
                dense
                readonly
                hide-bottom-space
              />
            </div>
          </div>
        </q-card-section>

        <q-card-section v-else class="premium-card__body q-pa-none">
          <div class="arrasto-materiais-toolbar q-pa-md">
            <q-input
              v-model="filtroMateriais"
              dense
              outlined
              clearable
              placeholder="Buscar por família, tipo, material ou descrição"
              class="arrasto-materiais-toolbar__search"
            >
              <template #prepend>
                <q-icon name="search" />
              </template>
            </q-input>
            <div class="text-caption text-grey-7">
              {{ materiaisComQuantidade }} material(is) com quantidade informada
            </div>
          </div>

          <div class="table-shell">
            <q-table
              :rows="materiaisFiltrados"
              :columns="materiaisColumns"
              row-key="id"
              flat
              dense
              :rows-per-page-options="[0]"
              hide-pagination
              class="arrasto-materiais-table"
            >
              <template #header="props">
                <q-tr :props="props" class="arrasto-materiais-table__header-row">
                  <q-th v-for="col in props.cols" :key="col.name" :props="props" class="arrasto-materiais-table__header-cell">
                    {{ col.label }}
                  </q-th>
                </q-tr>
              </template>

              <template #body-cell-peso="props">
                <q-td :props="props">
                  {{ formatNumeroBr(props.row.peso) }}
                </q-td>
              </template>

              <template #body-cell-qtd="props">
                <q-td :props="props" class="arrasto-materiais-table__qtd-cell">
                  <q-input
                    :model-value="getQuantidadeInput(props.row.id)"
                    type="number"
                    min="0"
                    step="1"
                    dense
                    outlined
                    hide-bottom-space
                    class="arrasto-materiais-table__qtd-input"
                    @update:model-value="(val) => handleQuantidadeChange(props.row.id, val)"
                  />
                </q-td>
              </template>

              <template #body-cell-total="props">
                <q-td :props="props" class="text-weight-medium">
                  {{ formatNumeroBr(calcularTotalLinha(getQuantidade(props.row.id), props.row.peso)) }}
                </q-td>
              </template>
            </q-table>
          </div>
        </q-card-section>
      </q-card>

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
            <div v-for="(_, i) in evidencias" :key="i" class="col-12 col-md-6">
              <div class="text-caption text-grey-7 q-mb-xs">Evidência {{ i + 1 }}</div>

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

              <div
                v-else
                class="evidencia-zone evidencia-zone--empty flex flex-center column"
                :class="evidenciaZoneClass(i)"
                tabindex="0"
                title="Selecione o quadrado, cole com Ctrl+V ou solte uma imagem arrastada"
                @click="selectEvidencia(i, $event)"
                @paste="(e) => handleEvidenciaPaste(e, $event)"
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
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useQuasar } from 'quasar';
import type { QTableColumn } from 'quasar';
import { computed, onMounted, onUnmounted, ref } from 'vue';
import distritaisData from 'src/data/arrasto-distritais.json';
import materiaisData from 'src/data/arrasto-materiais.json';
import type { ArrastoObra } from 'src/stores/arrasto';
import { useArrastoStore } from 'src/stores/arrasto';
import { exportArrastoToExcel } from 'src/utils/arrasto-excel';
import { exportArrastoToPdf } from 'src/utils/arrasto-pdf';
import {
  calcularArrastoEmKm,
  calcularPesoEmKg,
  calcularPesoEmT,
  calcularQtdACobrar,
  calcularTotalLinha,
  calcularValorRs,
  formatDistritalLabel,
  formatNumeroBr,
  getArrastoArrastoEmMError,
  getArrastoObraFieldError,
  validateArrastoParaExportacao,
} from 'src/utils/arrasto-helpers';
import type { ArrastoMaterial } from 'src/utils/arrasto-types';

const $q = useQuasar();
const store = useArrastoStore();
const { obra, arrastoEmM, precoUnitario, quantidades, evidencias } = storeToRefs(store);
const { setQuantidade, resetForm } = store;

const abaAtiva = ref<'sintese' | 'materiais'>('materiais');
const filtroMateriais = ref('');
const validacaoAtiva = ref(false);
const materiais = materiaisData as ArrastoMaterial[];

const distritalOptions = (distritaisData as string[]).map((value) => ({
  label: formatDistritalLabel(value),
  value,
}));

const materiaisColumns: QTableColumn<ArrastoMaterial>[] = [
  { name: 'familia', label: 'Família', field: 'familia', align: 'left', sortable: true },
  { name: 'tipo', label: 'Tipo', field: 'tipo', align: 'left', sortable: true },
  { name: 'id', label: 'Material', field: 'id', align: 'left', sortable: true },
  { name: 'descricao', label: 'Descrição', field: 'descricao', align: 'left', style: 'min-width: 280px' },
  { name: 'umb', label: 'UMB', field: 'umb', align: 'center' },
  { name: 'peso', label: 'Peso', field: 'peso', align: 'right' },
  { name: 'qtd', label: 'QTD', field: 'qtd', align: 'center' },
  { name: 'total', label: 'Total', field: 'total', align: 'right' },
];

const materiaisFiltrados = computed(() => {
  const termo = filtroMateriais.value.trim().toLowerCase();
  if (!termo) return materiais;

  return materiais.filter((material) => {
    return (
      material.familia.toLowerCase().includes(termo) ||
      material.tipo.toLowerCase().includes(termo) ||
      material.descricao.toLowerCase().includes(termo) ||
      String(material.id).includes(termo)
    );
  });
});

const pesoEmKg = computed(() => calcularPesoEmKg(quantidades.value, materiais));
const pesoEmT = computed(() => calcularPesoEmT(pesoEmKg.value));
const arrastoEmKm = computed(() => {
  if (!arrastoEmM.value || arrastoEmM.value <= 0) return 0;
  return calcularArrastoEmKm(arrastoEmM.value);
});
const qtdACobrar = computed(() => calcularQtdACobrar(pesoEmT.value, arrastoEmKm.value));
const valorRs = computed(() => calcularValorRs(qtdACobrar.value, precoUnitario.value));

const materiaisComQuantidade = computed(() => {
  return Object.values(quantidades.value).filter((quantidade) => quantidade > 0).length;
});

function obraFieldError(field: keyof ArrastoObra) {
  return getArrastoObraFieldError(obra.value, field);
}

function obraFieldHasError(field: keyof ArrastoObra) {
  return validacaoAtiva.value && obraFieldError(field) !== null;
}

const arrastoEmMError = computed(() => getArrastoArrastoEmMError(arrastoEmM.value));
const arrastoEmMHasError = computed(() => validacaoAtiva.value && arrastoEmMError.value !== null);

function getQuantidade(materialId: number) {
  return quantidades.value[materialId] ?? 0;
}

function getQuantidadeInput(materialId: number) {
  const quantidade = getQuantidade(materialId);
  return quantidade > 0 ? quantidade : null;
}

function handleQuantidadeChange(materialId: number, value: string | number | null) {
  if (value === null || value === '') {
    setQuantidade(materialId, null);
    return;
  }

  const quantidade = Number(value);
  setQuantidade(materialId, Number.isNaN(quantidade) ? null : quantidade);
}

const evidenciaInputs = ref<(HTMLInputElement | null)[]>(Array(8).fill(null));
const selectedEvidenciaIndex = ref<number | null>(null);
const draggedEvidenciaIndex = ref<number | null>(null);
const dropTargetEvidenciaIndex = ref<number | null>(null);

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

  for (const item of items) {
    if (!item.type.startsWith('image/')) continue;
    event.preventDefault();
    const file = item.getAsFile();
    if (!file) continue;
    evidencias.value[index] = await readImageFile(file);
    selectedEvidenciaIndex.value = index;
    return;
  }
}

function handleGlobalPaste(event: ClipboardEvent) {
  if (selectedEvidenciaIndex.value === null) return;
  void handleEvidenciaPaste(event, selectedEvidenciaIndex.value);
}

function handleReset() {
  $q.dialog({
    title: 'Limpar formulário',
    message: 'Deseja apagar todos os dados preenchidos?',
    cancel: true,
    persistent: true,
  }).onOk(() => {
    resetForm();
    validacaoAtiva.value = false;
    filtroMateriais.value = '';
    $q.notify({ type: 'info', message: 'Formulário limpo.' });
  });
}

function getExportErrors(): string[] {
  validacaoAtiva.value = true;
  return validateArrastoParaExportacao(obra.value, arrastoEmM.value);
}

async function handleExport() {
  const errors = getExportErrors();
  if (errors.length > 0) {
    $q.notify({ type: 'negative', message: errors[0] });
    return;
  }

  try {
    const fileName = await exportArrastoToExcel(
      obra.value,
      arrastoEmM.value!,
      precoUnitario.value,
      quantidades.value,
      materiais,
      evidencias.value,
    );

    $q.notify({
      type: 'positive',
      message: `Arquivo ${fileName} exportado com sucesso.`,
    });
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Erro ao exportar o Excel.',
    });
  }
}

async function handleExportPdf() {
  const errors = getExportErrors();
  if (errors.length > 0) {
    $q.notify({ type: 'negative', message: errors[0] });
    return;
  }

  try {
    const fileName = await exportArrastoToPdf(
      obra.value,
      arrastoEmM.value!,
      precoUnitario.value,
      quantidades.value,
      materiais,
      evidencias.value,
    );

    $q.notify({
      type: 'positive',
      message: `Arquivo ${fileName} exportado com sucesso.`,
    });
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Erro ao exportar o PDF.',
    });
  }
}

onMounted(() => {
  window.addEventListener('paste', handleGlobalPaste);
});

onUnmounted(() => {
  window.removeEventListener('paste', handleGlobalPaste);
});
</script>

<style scoped lang="scss">
.action-bar--top {
  margin-top: 0;
}

.action-bar__actions--end {
  width: 100%;
  justify-content: flex-end;
}

.arrasto-tabs {
  display: flex;
  gap: 8px;
  padding: 16px 20px 0;
}

.arrasto-tabs__btn {
  border: none;
  background: transparent;
  color: var(--text-primary);
  font-weight: 800;
  font-size: 0.82rem;
  letter-spacing: 0.04em;
  padding: 10px 18px;
  border-radius: 10px;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.arrasto-tabs__btn--active {
  background: #e8edf3;
}

body.body--dark .arrasto-tabs__btn--active {
  background: rgba(148, 163, 184, 0.18);
}

.arrasto-materiais-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.arrasto-materiais-toolbar__search {
  flex: 1 1 320px;
  max-width: 520px;
}

.arrasto-materiais-table__header-row {
  background: #6b1f3f;
}

.arrasto-materiais-table__header-cell {
  color: #fff !important;
  font-weight: 700;
  font-size: 0.72rem;
  letter-spacing: 0.03em;
}

.arrasto-materiais-table__qtd-cell {
  width: 110px;
}

.arrasto-materiais-table__qtd-input {
  width: 90px;
}
</style>
