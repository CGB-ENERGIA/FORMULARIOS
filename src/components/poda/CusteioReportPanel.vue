<template>
  <div class="custeio-report-panel">
    <div class="action-bar q-mb-lg">
      <div class="stat-chip">
        <q-icon name="check_circle" size="18px" color="primary" />
        <strong>{{ preenchidosCount }}</strong> serviço(s) com foto
      </div>
      <div class="action-bar__actions">
        <q-btn unelevated icon="picture_as_pdf" label="Gerar PDF" class="action-btn--pdf" no-caps @click="handleExportPdf" />
        <q-btn outline color="negative" icon="restart_alt" no-caps @click="handleReset">
          <q-tooltip>Limpar formulário</q-tooltip>
        </q-btn>
      </div>
    </div>

    <q-card flat class="premium-card q-mb-md">
      <div class="premium-card__header">
        <div class="premium-card__header-title">
          <div class="premium-card__header-icon"><q-icon name="description" size="22px" /></div>
          Relatório de Evidências dos Serviços Executados
        </div>
      </div>
      <q-card-section class="premium-card__body">
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-3">
            <q-select
              v-model="cabecalho.base"
              :options="baseOptions"
              label="Base *"
              outlined
              dense
              emit-value
              map-options
              hide-bottom-space
              :error="validacaoAtiva && !cabecalho.base"
              error-message="Informe a base"
            />
          </div>
          <div class="col-12 col-md-3">
            <q-select
              v-model="cabecalho.municipio"
              :options="municipioOptionsFiltered"
              label="Município *"
              outlined
              dense
              hide-bottom-space
              use-input
              fill-input
              hide-selected
              input-debounce="0"
              :error="validacaoAtiva && !cabecalho.municipio.trim()"
              error-message="Informe o município"
              @filter="filterMunicipios"
            />
          </div>
          <div class="col-12 col-md-3">
            <q-input
              v-model="cabecalho.ordemNumero"
              label="Ordem / Incidente *"
              outlined
              dense
              hide-bottom-space
              :error="validacaoAtiva && !cabecalho.ordemNumero.trim()"
              error-message="Informe o número"
            >
              <template #prepend>
                <q-btn
                  flat no-caps dense padding="xs sm" size="sm"
                  :color="cabecalho.tipoOrdem === 'ordem' ? 'primary' : 'grey'"
                  :class="{ 'text-weight-bold': cabecalho.tipoOrdem === 'ordem' }"
                  label="CP"
                  @click="cabecalho.tipoOrdem = 'ordem'"
                />
                <q-btn
                  flat no-caps dense padding="xs sm" size="sm"
                  :color="cabecalho.tipoOrdem === 'incidente' ? 'primary' : 'grey'"
                  :class="{ 'text-weight-bold': cabecalho.tipoOrdem === 'incidente' }"
                  label="INC"
                  @click="cabecalho.tipoOrdem = 'incidente'"
                />
                <q-separator vertical class="q-mx-xs" />
              </template>
            </q-input>
          </div>
          <div class="col-12 col-md-3">
            <q-input
              v-model="cabecalho.componenteOuPg"
              label="Componente ou PG *"
              outlined
              dense
              hide-bottom-space
              :error="validacaoAtiva && !cabecalho.componenteOuPg.trim()"
              error-message="Informe o componente ou PG"
            />
          </div>
          <div class="col-12 col-md-4">
            <q-input
              v-model="cabecalho.prefixoEquipe"
              label="Prefixo da equipe *"
              outlined
              dense
              hide-bottom-space
              :error="validacaoAtiva && !cabecalho.prefixoEquipe.trim()"
              error-message="Informe o prefixo da equipe"
            />
          </div>
          <div class="col-12 col-md-3">
            <q-input
              v-model="cabecalho.dataExecucao"
              label="Data de execução *"
              outlined
              dense
              mask="##/##/####"
              placeholder="DD/MM/AAAA"
              hide-bottom-space
              :error="validacaoAtiva && !cabecalho.dataExecucao.trim()"
              error-message="Informe a data de execução"
            >
              <template #append>
                <q-icon name="event" class="cursor-pointer">
                  <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                    <q-date v-model="cabecalho.dataExecucao" mask="DD/MM/YYYY">
                      <div class="row items-center justify-end">
                        <q-btn v-close-popup label="Fechar" color="primary" flat no-caps />
                      </div>
                    </q-date>
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>
          </div>
          <div class="col-12">
            <q-input
              v-model="cabecalho.observacao"
              label="Observação"
              outlined
              dense
              hide-bottom-space
              type="textarea"
              autogrow
            />
          </div>
        </div>
      </q-card-section>
    </q-card>

    <div class="servicos-grid">
      <div
        v-for="(servico, idx) in servicos"
        :key="servico.id"
        class="servico-card"
        :class="{ 'servico-card--ok': servicoPreenchido(servico) }"
      >
        <div class="servico-card__header">
          <div class="servico-card__header-left">
            <span class="servico-card__badge">{{ servico.id }}</span>
            <span class="servico-card__title">Serviço {{ servico.id }}</span>
            <q-icon
              v-if="servicoPreenchido(servico)"
              name="check_circle"
              size="16px"
              color="positive"
              class="q-ml-xs"
            />
          </div>
          <q-btn
            flat round dense icon="delete_outline" color="negative" size="sm"
            :disable="servicos.length <= 1"
            @click="removeServico(idx)"
          >
            <q-tooltip>Remover serviço</q-tooltip>
          </q-btn>
        </div>

        <div class="servico-card__fotos">
          <div class="foto-slot">
            <div class="foto-slot__label">
              <q-icon name="play_circle_outline" size="14px" />
              Registro Início dos Trabalhos
            </div>

            <div
              v-if="servico.fotoInicio"
              class="evidencia-zone evidencia-zone--filled relative-position"
              :class="cellClass(servico, 'inicio')"
              tabindex="0"
              title="Arraste para outro campo ou cole com Ctrl+V"
              @click="selectCell(servico, 'inicio', $event)"
              @paste="(e) => handleZonePaste(e, servico, 'inicio')"
              @dragover="handleDragOver(servico, 'inicio', $event)"
              @drop="handleDrop(servico, 'inicio', $event)"
            >
              <img
                :src="servico.fotoInicio"
                draggable="true"
                class="evidencia-img evidencia-img--draggable"
                style="width:100%; max-height:260px; object-fit:contain; border-radius:8px;"
                @dragstart="handleDragStart(servico, 'inicio', $event)"
                @dragend="handleDragEnd"
              />
              <q-btn
                icon="close" round dense size="sm" color="negative"
                class="absolute-top-right q-ma-xs"
                @click.stop="servico.fotoInicio = ''"
              />
            </div>

            <div
              v-else
              class="evidencia-zone evidencia-zone--empty flex flex-center column"
              :class="cellClass(servico, 'inicio')"
              tabindex="0"
              title="Selecione, cole com Ctrl+V ou solte uma imagem arrastada"
              @click="selectCell(servico, 'inicio', $event)"
              @paste="(e) => handleZonePaste(e, servico, 'inicio')"
              @keydown.enter="triggerFoto(idx, 'inicio')"
              @dragover="handleDragOver(servico, 'inicio', $event)"
              @drop="handleDrop(servico, 'inicio', $event)"
            >
              <button
                type="button"
                class="evidencia-zone__upload-trigger"
                aria-label="Anexar imagem"
                @click.stop="triggerFoto(idx, 'inicio')"
              >
                <q-icon name="add_photo_alternate" size="40px" color="grey-5" />
                <span class="text-grey-6 text-caption">Clique para anexar</span>
              </button>
              <span class="evidencia-zone__paste-hint text-grey-6 text-caption">
                ou selecione, cole (Ctrl+V) ou arraste
              </span>
            </div>

            <input
              :ref="(el) => setFotoRef(el, idx, 'inicio')"
              type="file" accept="image/*" style="display:none"
              @change="(e) => handleFotoChange(e, servico, 'inicio')"
            />
          </div>

          <div class="foto-slot__divider" />

          <div class="foto-slot">
            <div class="foto-slot__label">
              <q-icon name="stop_circle" size="14px" />
              Registro do Fim dos Trabalhos
            </div>

            <div
              v-if="servico.fotoFim"
              class="evidencia-zone evidencia-zone--filled relative-position"
              :class="cellClass(servico, 'fim')"
              tabindex="0"
              title="Arraste para outro campo ou cole com Ctrl+V"
              @click="selectCell(servico, 'fim', $event)"
              @paste="(e) => handleZonePaste(e, servico, 'fim')"
              @dragover="handleDragOver(servico, 'fim', $event)"
              @drop="handleDrop(servico, 'fim', $event)"
            >
              <img
                :src="servico.fotoFim"
                draggable="true"
                class="evidencia-img evidencia-img--draggable"
                style="width:100%; max-height:260px; object-fit:contain; border-radius:8px;"
                @dragstart="handleDragStart(servico, 'fim', $event)"
                @dragend="handleDragEnd"
              />
              <q-btn
                icon="close" round dense size="sm" color="negative"
                class="absolute-top-right q-ma-xs"
                @click.stop="servico.fotoFim = ''"
              />
            </div>

            <div
              v-else
              class="evidencia-zone evidencia-zone--empty flex flex-center column"
              :class="cellClass(servico, 'fim')"
              tabindex="0"
              title="Selecione, cole com Ctrl+V ou solte uma imagem arrastada"
              @click="selectCell(servico, 'fim', $event)"
              @paste="(e) => handleZonePaste(e, servico, 'fim')"
              @keydown.enter="triggerFoto(idx, 'fim')"
              @dragover="handleDragOver(servico, 'fim', $event)"
              @drop="handleDrop(servico, 'fim', $event)"
            >
              <button
                type="button"
                class="evidencia-zone__upload-trigger"
                aria-label="Anexar imagem"
                @click.stop="triggerFoto(idx, 'fim')"
              >
                <q-icon name="add_photo_alternate" size="40px" color="grey-5" />
                <span class="text-grey-6 text-caption">Clique para anexar</span>
              </button>
              <span class="evidencia-zone__paste-hint text-grey-6 text-caption">
                ou selecione, cole (Ctrl+V) ou arraste
              </span>
            </div>

            <input
              :ref="(el) => setFotoRef(el, idx, 'fim')"
              type="file" accept="image/*" style="display:none"
              @change="(e) => handleFotoChange(e, servico, 'fim')"
            />
          </div>
        </div>
      </div>

      <button class="servicos-add-btn" @click="addServico">
        <q-icon name="add_circle_outline" size="20px" />
        Adicionar serviço
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onActivated, onDeactivated } from 'vue';
import { useQuasar } from 'quasar';
import { storeToRefs } from 'pinia';
import { useCusteioStore, servicoPreenchido } from 'src/stores/custeio';
import type { CusteioServico } from 'src/stores/custeio';
import { exportCusteioToPdf } from 'src/utils/custeio-pdf';
import { validateCusteioCabecalho } from 'src/utils/custeio-helpers';
import { formatDistritalLabel } from 'src/utils/arrasto-helpers';
import distritaisData from 'src/data/arrasto-distritais.json';
import municipiosMaranhaoData from 'src/data/municipios-maranhao.json';

const $q = useQuasar();
const store = useCusteioStore();
const { cabecalho, servicos } = storeToRefs(store);
const { addServico, removeServico, resetForm } = store;

const baseOptions = (distritaisData as string[]).map((value) => ({
  label: formatDistritalLabel(value),
  value,
}));

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

const validacaoAtiva = ref(false);
const preenchidosCount = computed(() => servicos.value.filter(servicoPreenchido).length);

type Tipo = 'inicio' | 'fim';
interface CellKey { id: number; tipo: Tipo }

const selectedKey = ref<CellKey | null>(null);
const draggedKey = ref<CellKey | null>(null);
const dropTargetKey = ref<CellKey | null>(null);

function keysEqual(a: CellKey | null, b: CellKey | null) {
  return !!a && !!b && a.id === b.id && a.tipo === b.tipo;
}

function cellClass(s: CusteioServico, tipo: Tipo) {
  const k = { id: s.id, tipo };
  return {
    'evidencia-zone--selected': keysEqual(selectedKey.value, k),
    'evidencia-zone--drop-target': keysEqual(dropTargetKey.value, k),
    'evidencia-zone--dragging': keysEqual(draggedKey.value, k),
  };
}

function getPhoto(s: CusteioServico, tipo: Tipo) {
  return tipo === 'inicio' ? s.fotoInicio : s.fotoFim;
}

function setPhoto(s: CusteioServico, tipo: Tipo, v: string) {
  if (tipo === 'inicio') s.fotoInicio = v;
  else s.fotoFim = v;
}

function selectCell(s: CusteioServico, tipo: Tipo, event?: Event) {
  selectedKey.value = { id: s.id, tipo };
  const t = event?.currentTarget;
  if (t instanceof HTMLElement) t.focus();
}

const fotoRefs: Record<string, HTMLInputElement | null> = {};

function setFotoRef(el: unknown, idx: number, tipo: Tipo) {
  fotoRefs[`${idx}-${tipo}`] = el as HTMLInputElement | null;
}

function triggerFoto(idx: number, tipo: Tipo) {
  fotoRefs[`${idx}-${tipo}`]?.click();
}

function readFileAsync(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = (e) => resolve(e.target?.result as string);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

function handleFotoChange(event: Event, s: CusteioServico, tipo: Tipo) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;
  void readFileAsync(file).then((v) => setPhoto(s, tipo, v));
  (event.target as HTMLInputElement).value = '';
}

async function handleZonePaste(event: ClipboardEvent, s: CusteioServico, tipo: Tipo) {
  const items = event.clipboardData?.items;
  if (!items) return;
  for (const item of Array.from(items)) {
    if (item.type.startsWith('image/')) {
      const file = item.getAsFile();
      if (!file) continue;
      event.preventDefault();
      try {
        setPhoto(s, tipo, await readFileAsync(file));
        selectedKey.value = { id: s.id, tipo };
        $q.notify({ type: 'positive', message: 'Imagem colada com sucesso.' });
      } catch {
        $q.notify({ type: 'negative', message: 'Erro ao colar imagem.' });
      }
      return;
    }
  }
}

async function handleGlobalPaste(event: ClipboardEvent) {
  if (document.activeElement?.closest('.evidencia-zone')) return;

  const items = event.clipboardData?.items;
  if (!items) return;
  for (const item of Array.from(items)) {
    if (!item.type.startsWith('image/')) continue;
    const file = item.getAsFile();
    if (!file) continue;

    let targetS: CusteioServico | null = null;
    let targetT: Tipo = 'inicio';

    if (selectedKey.value) {
      const found = servicos.value.find((s) => s.id === selectedKey.value!.id);
      if (found) { targetS = found; targetT = selectedKey.value.tipo; }
    }
    if (!targetS) {
      outer: for (const s of servicos.value) {
        for (const t of ['inicio', 'fim'] as Tipo[]) {
          if (!getPhoto(s, t)) { targetS = s; targetT = t; break outer; }
        }
      }
    }
    if (!targetS) {
      $q.notify({ type: 'warning', message: 'Selecione uma célula ou libere espaço.' });
      return;
    }

    event.preventDefault();
    try {
      setPhoto(targetS, targetT, await readFileAsync(file));
      selectedKey.value = { id: targetS.id, tipo: targetT };
      $q.notify({ type: 'positive', message: 'Print colado com sucesso.' });
    } catch {
      $q.notify({ type: 'negative', message: 'Erro ao colar imagem.' });
    }
    return;
  }
}

onActivated(() => document.addEventListener('paste', handleGlobalPaste));
onDeactivated(() => document.removeEventListener('paste', handleGlobalPaste));

function handleDragStart(s: CusteioServico, tipo: Tipo, event: DragEvent) {
  if (!getPhoto(s, tipo)) return;
  draggedKey.value = { id: s.id, tipo };
  event.dataTransfer?.setData('application/x-custeio-cell', JSON.stringify({ id: s.id, tipo }));
  if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
}

function handleDragEnd() {
  draggedKey.value = null;
  dropTargetKey.value = null;
}

function handleDragOver(s: CusteioServico, tipo: Tipo, event: DragEvent) {
  const from = draggedKey.value;
  if (!from) return;
  if (keysEqual(from, { id: s.id, tipo })) return;
  event.preventDefault();
  if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
  dropTargetKey.value = { id: s.id, tipo };
}

function handleDrop(s: CusteioServico, tipo: Tipo, event: DragEvent) {
  event.preventDefault();

  let fromKey = draggedKey.value;
  const raw = event.dataTransfer?.getData('application/x-custeio-cell');
  if (raw) {
    try { fromKey = JSON.parse(raw) as CellKey; } catch { /* noop */ }
  }
  if (!fromKey || keysEqual(fromKey, { id: s.id, tipo })) {
    handleDragEnd();
    return;
  }

  const fromS = servicos.value.find((x) => x.id === fromKey!.id);
  if (!fromS) { handleDragEnd(); return; }

  const fromPhoto = getPhoto(fromS, fromKey.tipo);
  const toPhoto = getPhoto(s, tipo);
  setPhoto(fromS, fromKey.tipo, toPhoto);
  setPhoto(s, tipo, fromPhoto);
  selectedKey.value = { id: s.id, tipo };

  $q.notify({
    type: 'positive',
    message: toPhoto ? 'Fotos trocadas.' : 'Foto movida.',
  });
  handleDragEnd();
}

function ensureExportavel(): boolean {
  validacaoAtiva.value = true;

  const cabecalhoErrors = validateCusteioCabecalho(cabecalho.value);
  if (cabecalhoErrors.length > 0) {
    $q.notify({
      type: 'negative',
      icon: 'warning',
      message: cabecalhoErrors[0],
      timeout: 5000,
    });
    return false;
  }

  if (preenchidosCount.value === 0) {
    $q.notify({
      type: 'negative',
      icon: 'photo_camera',
      message: 'Adicione pelo menos 1 foto antes de exportar.',
      timeout: 5000,
    });
    return false;
  }
  return true;
}

async function handleExportPdf() {
  if (!ensureExportavel()) return;
  const dismiss = $q.notify({ type: 'ongoing', message: 'Gerando PDF…', timeout: 0 });
  try {
    const fileName = await exportCusteioToPdf(cabecalho.value, servicos.value);
    dismiss();
    $q.notify({ type: 'positive', message: `Arquivo ${fileName} gerado com sucesso.` });
  } catch (error) {
    dismiss();
    $q.notify({ type: 'negative', message: error instanceof Error ? error.message : 'Erro ao gerar PDF.' });
  }
}

function handleReset() {
  $q.dialog({
    title: 'Limpar formulário',
    message: 'Deseja apagar o cabeçalho, serviços e fotos preenchidos?',
    cancel: true,
    persistent: true,
  }).onOk(() => {
    resetForm();
    selectedKey.value = null;
    validacaoAtiva.value = false;
    $q.notify({ type: 'info', message: 'Formulário limpo.' });
  });
}
</script>

<style scoped>
.servicos-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.servico-card {
  border: 1px solid rgba(0, 0, 0, 0.09);
  border-radius: 12px;
  overflow: hidden;
  background: var(--q-color-surface, #fff);
  transition: border-color 0.2s;
}

.body--dark .servico-card {
  border-color: rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.03);
}

.servico-card--ok {
  border-color: rgba(76, 175, 80, 0.35);
}

.body--dark .servico-card--ok {
  border-color: rgba(76, 175, 80, 0.3);
}

.servico-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  background: rgba(0, 0, 0, 0.02);
}

.body--dark .servico-card__header {
  border-color: rgba(255, 255, 255, 0.06);
  background: rgba(255, 255, 255, 0.025);
}

.servico-card__header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.servico-card__badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--q-primary);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  flex-shrink: 0;
}

.servico-card__title {
  font-size: 13px;
  font-weight: 600;
  opacity: 0.8;
}

.servico-card__fotos {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  padding: 14px;
}

.foto-slot {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.foto-slot__divider {
  width: 1px;
  margin: 0 14px;
  background: rgba(0, 0, 0, 0.07);
  align-self: stretch;
}

.body--dark .foto-slot__divider {
  background: rgba(255, 255, 255, 0.07);
}

.foto-slot__label {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 10.5px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  opacity: 0.55;
}

.servicos-add-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  padding: 12px;
  border: 1.5px dashed rgba(0, 0, 0, 0.15);
  border-radius: 12px;
  background: transparent;
  color: var(--q-primary);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
  font-family: inherit;
}

.servicos-add-btn:hover {
  background: rgba(var(--q-primary-rgb, 25, 118, 210), 0.06);
  border-color: var(--q-primary);
}

.body--dark .servicos-add-btn {
  border-color: rgba(255, 255, 255, 0.15);
}

.body--dark .servicos-add-btn:hover {
  border-color: var(--q-primary);
}
</style>
