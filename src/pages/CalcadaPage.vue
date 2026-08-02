<template>
  <q-page class="page-shell">
    <div class="page-shell__inner">
      <header class="page-header">
        <div class="page-header__eyebrow">
          <q-icon name="dashboard" size="14px" />
          Formulário operacional
        </div>
        <h1 class="page-header__title">Reparo de Calçada</h1>
        <p class="page-header__subtitle">
          Informe os dados da obra e registre as evidências antes/depois de cada reparo.
        </p>
      </header>

      <!-- ── Barra de ações ──────────────────────────────────────────────────── -->
      <div class="action-bar action-bar--top q-mb-md">
        <div class="action-bar__actions action-bar__actions--end">
          <q-btn outline color="negative" icon="restart_alt" label="LIMPAR" no-caps @click="handleReset" />
          <q-btn unelevated icon="picture_as_pdf" label="PDF" class="action-btn--pdf" no-caps @click="handleExportPdf" />
        </div>
      </div>

      <!-- ── Dados da obra ───────────────────────────────────────────────────── -->
      <q-card flat class="premium-card q-mb-md">
        <div class="premium-card__header">
          <div class="premium-card__header-title">
            <div class="premium-card__header-icon"><q-icon name="business" size="22px" /></div>
            Dados da Obra
          </div>
        </div>
        <q-card-section class="premium-card__body">
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-4">
              <q-input v-model="obra.pep" label="PEP *" outlined dense hide-bottom-space
                :error="validacaoAtiva && !obra.pep.trim()" error-message="Informe o PEP" />
            </div>
            <div class="col-12 col-md-4">
              <q-input v-model="obra.nota" label="Nota *" outlined dense hide-bottom-space
                :error="validacaoAtiva && !obra.nota.trim()" error-message="Informe a nota" />
            </div>
            <div class="col-12 col-md-4">
              <q-select v-model="obra.distrital" :options="distritalOptions" label="Distrital *"
                outlined dense emit-value map-options hide-bottom-space
                :error="validacaoAtiva && !obra.distrital" error-message="Informe o distrital" />
            </div>
            <div class="col-12 col-md-8">
              <q-input v-model="obra.descricaoObra" label="Descrição da Obra *" outlined dense hide-bottom-space
                :error="validacaoAtiva && !obra.descricaoObra.trim()" error-message="Informe a descrição" />
            </div>
            <div class="col-12 col-md-4">
              <q-input v-model="obra.municipio" label="Município *" outlined dense hide-bottom-space
                :error="validacaoAtiva && !obra.municipio.trim()" error-message="Informe o município" />
            </div>
          </div>

          <!-- Campos calculados -->
          <div class="row q-col-gutter-md q-mt-xs items-center">
            <div class="col-6 col-md-2">
              <div class="calc-field" :class="{ 'calc-field--error': validacaoAtiva && !pi }">
                <span class="calc-field__label">PI *</span>
                <span class="calc-field__value">{{ pi || '—' }}</span>
                <span v-if="validacaoAtiva && !pi" class="calc-field__error">PEP inválido</span>
              </div>
            </div>
            <div class="col-6 col-md-2">
              <div class="calc-field" :class="{ 'calc-field--error': validacaoAtiva && !setor }">
                <span class="calc-field__label">Setor *</span>
                <span class="calc-field__value">{{ setor || '—' }}</span>
                <span v-if="validacaoAtiva && !setor" class="calc-field__error">PEP inválido</span>
              </div>
            </div>
          </div>
        </q-card-section>
      </q-card>

      <!-- ── Dados do reparo ─────────────────────────────────────────────────── -->
      <q-card flat class="premium-card q-mb-md">
        <div class="premium-card__header">
          <div class="premium-card__header-title">
            <div class="premium-card__header-icon"><q-icon name="straighten" size="22px" /></div>
            Dados Reparo de Calçadas
          </div>
        </div>
        <q-card-section class="premium-card__body">
          <div class="row q-col-gutter-md items-center">
            <div class="col-12 col-md-4">
              <q-input v-model.number="obra.quantidade" type="number" min="1" step="1"
                label="Quantidade *" outlined dense hide-bottom-space
                hint="Define quantas evidências (PG + fotos Antes/Depois) são obrigatórias"
                :error="validacaoAtiva && (obra.quantidade == null || obra.quantidade <= 0)"
                error-message="Informe a quantidade de reparos" />
            </div>
            <div class="col-12 col-md-4">
              <q-input v-model.number="obra.valorSap" type="number" min="0" step="0.01"
                label="Valor SAP (R$)" outlined dense hide-bottom-space prefix="R$"
                :readonly="!valorSapLiberado"
                :filled="!valorSapLiberado"
                @focus="solicitarSenhaValorSap">
                <template #append>
                  <q-icon
                    :name="valorSapLiberado ? 'lock_open' : 'lock'"
                    class="cursor-pointer"
                    @click="solicitarSenhaValorSap"
                  >
                    <q-tooltip>
                      {{
                        valorSapLiberado
                          ? 'Edição liberada'
                          : 'Bloqueado — informe a senha para editar'
                      }}
                    </q-tooltip>
                  </q-icon>
                </template>
              </q-input>
            </div>
            <div class="col-12 col-md-4">
              <div class="calc-field calc-field--highlight">
                <span class="calc-field__label">Valor R$ (calculado)</span>
                <span class="calc-field__value">{{ valorRsFmt }}</span>
              </div>
            </div>
          </div>
        </q-card-section>
      </q-card>

      <!-- ── Evidências ──────────────────────────────────────────────────────── -->
      <div class="action-bar q-mb-md">
        <div class="stat-chip">
          <q-icon name="check_circle" size="18px" color="primary" />
          <strong>{{ completasCount }}</strong> de <strong>{{ evidenciasRequeridas }}</strong> evidência(s) completa(s)
        </div>
        <div class="text-caption text-grey-7 q-ml-sm">
          Cada evidência exige PG, foto Antes e foto Depois.
        </div>
      </div>

      <div class="servicos-grid">
        <div
          v-for="(ev, idx) in evidencias"
          :key="ev.id"
          class="servico-card"
          :class="{
            'servico-card--ok': evidenciaCompleta(ev),
            'servico-card--invalid': evidenciaInvalida(ev, idx),
          }"
        >
          <div class="servico-card__header">
            <div class="servico-card__header-left">
              <span class="servico-card__badge">{{ ev.id }}</span>
              <span class="servico-card__title">Evidência {{ ev.id }}</span>
              <q-icon v-if="evidenciaCompleta(ev)" name="check_circle" size="16px" color="positive" class="q-ml-xs" />
            </div>
            <div class="row items-center q-gutter-sm">
              <q-input
                v-model="ev.pg"
                label="PG *"
                dense
                outlined
                hide-bottom-space
                class="pg-input"
                :error="evidenciaInvalida(ev, idx) && !ev.pg.trim()"
                error-message="Obrigatório"
              />
              <q-btn
                flat
                round
                dense
                icon="delete_outline"
                color="negative"
                size="sm"
                :disable="!podeRemoverEvidencia(idx)"
                @click="removeEvidencia(idx)"
              >
                <q-tooltip>
                  {{ podeRemoverEvidencia(idx) ? 'Remover evidência' : 'Quantidade exige esta evidência' }}
                </q-tooltip>
              </q-btn>
            </div>
          </div>

          <div class="servico-card__fotos">
            <!-- ANTES -->
            <div class="foto-slot">
              <div class="foto-slot__label">
                <q-icon name="history" size="14px" /> Antes
              </div>

              <div
                v-if="ev.fotoAntes"
                class="evidencia-zone evidencia-zone--filled relative-position"
                :class="cellClass(ev, 'antes')"
                tabindex="0"
                title="Arraste a imagem para outro quadrado ou cole com Ctrl+V"
                @click="selectCell(ev, 'antes', $event)"
                @paste="handleZonePaste($event, ev, 'antes')"
                @dragover="handleDragOver(ev, 'antes', $event)"
                @drop="handleDrop(ev, 'antes', $event)"
              >
                <img
                  :src="ev.fotoAntes"
                  draggable="true"
                  class="evidencia-img evidencia-img--draggable"
                  style="width:100%; max-height:260px; object-fit:contain; border-radius:8px;"
                  @dragstart="handleDragStart(ev, 'antes', $event)"
                  @dragend="handleDragEnd"
                />
                <q-btn
                  icon="close"
                  round
                  dense
                  size="sm"
                  color="negative"
                  class="foto-slot__clear-btn absolute-top-right q-ma-xs"
                  @click.stop="ev.fotoAntes = ''"
                >
                  <q-tooltip>Apagar foto</q-tooltip>
                </q-btn>
              </div>

              <div
                v-else
                class="evidencia-zone evidencia-zone--empty flex flex-center column"
                :class="cellClass(ev, 'antes')"
                tabindex="0"
                title="Selecione o quadrado, cole com Ctrl+V ou solte uma imagem arrastada"
                @click="selectCell(ev, 'antes', $event)"
                @paste="handleZonePaste($event, ev, 'antes')"
                @keydown.enter="triggerFoto(idx, 'antes')"
                @dragover="handleDragOver(ev, 'antes', $event)"
                @drop="handleDrop(ev, 'antes', $event)"
              >
                <button
                  type="button"
                  class="evidencia-zone__upload-trigger"
                  aria-label="Anexar imagem"
                  @click.stop="triggerFoto(idx, 'antes')"
                >
                  <q-icon name="add_photo_alternate" size="40px" color="grey-5" />
                  <span class="text-grey-6 text-caption">Clique para anexar</span>
                </button>
                <span class="evidencia-zone__paste-hint text-grey-6 text-caption">
                  ou selecione, cole (Ctrl+V) ou arraste
                </span>
              </div>

              <input
                :ref="(el) => setFotoRef(el, idx, 'antes')"
                type="file"
                accept="image/*"
                style="display:none"
                @change="(e) => handleFotoChange(e, ev, 'antes')"
              />
            </div>

            <div class="foto-slot__divider" />

            <!-- DEPOIS -->
            <div class="foto-slot">
              <div class="foto-slot__label">
                <q-icon name="update" size="14px" /> Depois
              </div>

              <div
                v-if="ev.fotoDepois"
                class="evidencia-zone evidencia-zone--filled relative-position"
                :class="cellClass(ev, 'depois')"
                tabindex="0"
                title="Arraste a imagem para outro quadrado ou cole com Ctrl+V"
                @click="selectCell(ev, 'depois', $event)"
                @paste="handleZonePaste($event, ev, 'depois')"
                @dragover="handleDragOver(ev, 'depois', $event)"
                @drop="handleDrop(ev, 'depois', $event)"
              >
                <img
                  :src="ev.fotoDepois"
                  draggable="true"
                  class="evidencia-img evidencia-img--draggable"
                  style="width:100%; max-height:260px; object-fit:contain; border-radius:8px;"
                  @dragstart="handleDragStart(ev, 'depois', $event)"
                  @dragend="handleDragEnd"
                />
                <q-btn
                  icon="close"
                  round
                  dense
                  size="sm"
                  color="negative"
                  class="foto-slot__clear-btn absolute-top-right q-ma-xs"
                  @click.stop="ev.fotoDepois = ''"
                >
                  <q-tooltip>Apagar foto</q-tooltip>
                </q-btn>
              </div>

              <div
                v-else
                class="evidencia-zone evidencia-zone--empty flex flex-center column"
                :class="cellClass(ev, 'depois')"
                tabindex="0"
                title="Selecione o quadrado, cole com Ctrl+V ou solte uma imagem arrastada"
                @click="selectCell(ev, 'depois', $event)"
                @paste="handleZonePaste($event, ev, 'depois')"
                @keydown.enter="triggerFoto(idx, 'depois')"
                @dragover="handleDragOver(ev, 'depois', $event)"
                @drop="handleDrop(ev, 'depois', $event)"
              >
                <button
                  type="button"
                  class="evidencia-zone__upload-trigger"
                  aria-label="Anexar imagem"
                  @click.stop="triggerFoto(idx, 'depois')"
                >
                  <q-icon name="add_photo_alternate" size="40px" color="grey-5" />
                  <span class="text-grey-6 text-caption">Clique para anexar</span>
                </button>
                <span class="evidencia-zone__paste-hint text-grey-6 text-caption">
                  ou selecione, cole (Ctrl+V) ou arraste
                </span>
              </div>

              <input
                :ref="(el) => setFotoRef(el, idx, 'depois')"
                type="file"
                accept="image/*"
                style="display:none"
                @change="(e) => handleFotoChange(e, ev, 'depois')"
              />
            </div>
          </div>
        </div>

      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useQuasar } from 'quasar';
import { storeToRefs } from 'pinia';
import { useCalcadaStore } from 'src/stores/calcada';
import type { CalcadaEvidencia } from 'src/stores/calcada';
import { calcularPi, calcularSetor, calcularValorRs, formatBRL, evidenciaCompleta, quantidadeEvidenciasRequeridas, validateCalcadaEvidencias, validateCalcadaObra } from 'src/utils/calcada-helpers';
import { exportCalcadaToPdf } from 'src/utils/calcada-pdf';
import { formatDistritalLabel } from 'src/utils/arrasto-helpers';
import distritaisData from 'src/data/arrasto-distritais.json';
import { setProtectedDefault } from 'src/utils/protected-defaults';

const $q = useQuasar();
const store = useCalcadaStore();
const { obra, evidencias } = storeToRefs(store);
const { removeEvidencia, resetForm, syncEvidenciasComQuantidade } = store;

const validacaoAtiva = ref(false);
const valorSapLiberado = ref(false);

const VALOR_SAP_SENHA = 'CGB123';

watch(
  () => obra.value.valorSap,
  (valor) => {
    if (!valorSapLiberado.value || valor == null || Number.isNaN(valor)) return;
    setProtectedDefault('calcada', 'valorSap', valor);
  },
);

watch(
  () => obra.value.quantidade,
  () => {
    syncEvidenciasComQuantidade();
  },
);

const distritalOptions = (distritaisData as string[]).map((value) => ({
  label: formatDistritalLabel(value),
  value,
}));

const pi = computed(() => calcularPi(obra.value.pep));
const setor = computed(() => calcularSetor(obra.value.pep));
const valorRsFmt = computed(() => formatBRL(calcularValorRs(obra.value.quantidade, obra.value.valorSap)));
const evidenciasRequeridas = computed(() => quantidadeEvidenciasRequeridas(obra.value.quantidade));
const completasCount = computed(() => evidencias.value.filter(evidenciaCompleta).length);

function evidenciaObrigatoria(idx: number) {
  return idx < evidenciasRequeridas.value;
}

function evidenciaInvalida(ev: CalcadaEvidencia, idx: number) {
  return validacaoAtiva.value && evidenciaObrigatoria(idx) && !evidenciaCompleta(ev);
}

function podeRemoverEvidencia(idx: number) {
  if (evidencias.value.length <= evidenciasRequeridas.value) return false;
  return idx >= evidenciasRequeridas.value;
}

// ── Chave de célula ───────────────────────────────────────────────────────────
type Tipo = 'antes' | 'depois';
interface CellKey { id: number; tipo: Tipo }

const selectedKey = ref<CellKey | null>(null);
const draggedKey = ref<CellKey | null>(null);
const dropTargetKey = ref<CellKey | null>(null);

function eq(a: CellKey | null, b: CellKey) { return !!a && a.id === b.id && a.tipo === b.tipo; }

function cellClass(e: CalcadaEvidencia, t: Tipo) {
  const k = { id: e.id, tipo: t };
  return {
    'evidencia-zone--selected': eq(selectedKey.value, k),
    'evidencia-zone--drop-target': eq(dropTargetKey.value, k),
    'evidencia-zone--dragging': eq(draggedKey.value, k),
  };
}

function getPhoto(e: CalcadaEvidencia, t: Tipo) { return t === 'antes' ? e.fotoAntes : e.fotoDepois; }
function setPhoto(e: CalcadaEvidencia, t: Tipo, v: string) {
  if (t === 'antes') e.fotoAntes = v; else e.fotoDepois = v;
}

function selectCell(e: CalcadaEvidencia, t: Tipo, event?: Event) {
  selectedKey.value = { id: e.id, tipo: t };
  const el = event?.currentTarget;
  if (el instanceof HTMLElement) el.focus();
}

// ── File inputs ───────────────────────────────────────────────────────────────
const fotoRefs: Record<string, HTMLInputElement | null> = {};
function setFotoRef(el: unknown, idx: number, t: Tipo) { fotoRefs[`${idx}-${t}`] = el as HTMLInputElement | null; }
function triggerFoto(idx: number, t: Tipo) { fotoRefs[`${idx}-${t}`]?.click(); }

function readFileAsync(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = (e) => resolve(e.target?.result as string);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

function handleFotoChange(event: Event, e: CalcadaEvidencia, t: Tipo) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;
  void readFileAsync(file).then((v) => setPhoto(e, t, v));
  (event.target as HTMLInputElement).value = '';
}

async function handleZonePaste(event: Event, e: CalcadaEvidencia, t: Tipo) {
  const ce = event as ClipboardEvent;
  const items = ce.clipboardData?.items;
  if (!items) return;
  for (const item of Array.from(items)) {
    if (item.type.startsWith('image/')) {
      const file = item.getAsFile();
      if (!file) continue;
      ce.preventDefault();
      try {
        setPhoto(e, t, await readFileAsync(file));
        selectedKey.value = { id: e.id, tipo: t };
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

    let target: CalcadaEvidencia | null = null;
    let tipo: Tipo = 'antes';
    if (selectedKey.value) {
      const found = evidencias.value.find((e) => e.id === selectedKey.value!.id);
      if (found) { target = found; tipo = selectedKey.value.tipo; }
    }
    if (!target) {
      outer: for (const e of evidencias.value) {
        for (const t of ['antes', 'depois'] as Tipo[]) {
          if (!getPhoto(e, t)) { target = e; tipo = t; break outer; }
        }
      }
    }
    if (!target) { $q.notify({ type: 'warning', message: 'Selecione uma célula ou libere espaço.' }); return; }

    event.preventDefault();
    try {
      setPhoto(target, tipo, await readFileAsync(file));
      selectedKey.value = { id: target.id, tipo };
      $q.notify({ type: 'positive', message: 'Print colado com sucesso.' });
    } catch {
      $q.notify({ type: 'negative', message: 'Erro ao colar imagem.' });
    }
    return;
  }
}

onMounted(() => {
  document.addEventListener('paste', handleGlobalPaste);
  syncEvidenciasComQuantidade();
});
onUnmounted(() => document.removeEventListener('paste', handleGlobalPaste));

// ── Drag & drop ───────────────────────────────────────────────────────────────
function handleDragStart(e: CalcadaEvidencia, t: Tipo, event: Event) {
  const de = event as DragEvent;
  if (!getPhoto(e, t)) return;
  draggedKey.value = { id: e.id, tipo: t };
  de.dataTransfer?.setData('application/x-calcada-cell', JSON.stringify({ id: e.id, tipo: t }));
  if (de.dataTransfer) de.dataTransfer.effectAllowed = 'move';
}

function handleDragEnd() { draggedKey.value = null; dropTargetKey.value = null; }

function handleDragOver(e: CalcadaEvidencia, t: Tipo, event: Event) {
  const de = event as DragEvent;
  const from = draggedKey.value;
  if (!from || eq(from, { id: e.id, tipo: t })) return;
  de.preventDefault();
  if (de.dataTransfer) de.dataTransfer.dropEffect = 'move';
  dropTargetKey.value = { id: e.id, tipo: t };
}

function handleDrop(e: CalcadaEvidencia, t: Tipo, event: Event) {
  const de = event as DragEvent;
  de.preventDefault();
  let fromKey = draggedKey.value;
  const raw = de.dataTransfer?.getData('application/x-calcada-cell');
  if (raw) { try { fromKey = JSON.parse(raw) as CellKey; } catch { /* noop */ } }
  if (!fromKey || eq(fromKey, { id: e.id, tipo: t })) { handleDragEnd(); return; }

  const fromE = evidencias.value.find((x) => x.id === fromKey!.id);
  if (!fromE) { handleDragEnd(); return; }

  const fromPhoto = getPhoto(fromE, fromKey.tipo);
  const toPhoto = getPhoto(e, t);
  setPhoto(fromE, fromKey.tipo, toPhoto);
  setPhoto(e, t, fromPhoto);
  selectedKey.value = { id: e.id, tipo: t };
  $q.notify({ type: 'positive', message: toPhoto ? 'Fotos trocadas.' : 'Foto movida.' });
  handleDragEnd();
}

// ── Validação e exportação ────────────────────────────────────────────────────
function ensureExportavel(): boolean {
  validacaoAtiva.value = true;
  syncEvidenciasComQuantidade();

  const obraErrors = validateCalcadaObra(obra.value);
  if (obraErrors.length > 0) {
    $q.notify({ type: 'negative', icon: 'warning', message: obraErrors[0] });
    return false;
  }

  const evidenciaErrors = validateCalcadaEvidencias(obra.value, evidencias.value);
  if (evidenciaErrors.length > 0) {
    $q.notify({ type: 'negative', icon: 'photo_camera', message: evidenciaErrors[0] });
    return false;
  }

  return true;
}

async function handleExportPdf() {
  if (!ensureExportavel()) return;
  const dismiss = $q.notify({ type: 'ongoing', message: 'Gerando PDF…', timeout: 0 });
  try {
    const fileName = await exportCalcadaToPdf(obra.value, evidencias.value);
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
    message: 'Deseja apagar todos os dados da obra e evidências?',
    cancel: true, persistent: true,
  }).onOk(() => {
    resetForm();
    selectedKey.value = null;
    validacaoAtiva.value = false;
    valorSapLiberado.value = false;
    $q.notify({ type: 'info', message: 'Formulário limpo.' });
  });
}

function solicitarSenhaValorSap() {
  if (valorSapLiberado.value) return;

  $q.dialog({
    title: 'Campo protegido',
    message: 'Informe a senha para alterar o Valor SAP.',
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
    if (senha === VALOR_SAP_SENHA) {
      valorSapLiberado.value = true;
      $q.notify({
        type: 'positive',
        message: 'Valor SAP liberado para edição.',
      });
      return;
    }

    $q.notify({
      type: 'negative',
      message: 'Senha incorreta.',
    });
  });
}
</script>

<style scoped>
/* ── Campos calculados ───────────────────────────────────────────────────── */
.calc-field {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 6px 12px;
  border: 1px dashed rgba(0, 0, 0, 0.15);
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.02);
}

.body--dark .calc-field {
  border-color: rgba(255, 255, 255, 0.15);
  background: rgba(255, 255, 255, 0.03);
}

.calc-field--highlight {
  border-style: solid;
  border-color: var(--q-primary);
  background: rgba(var(--q-primary-rgb, 25, 118, 210), 0.06);
}

.calc-field--error {
  border-color: var(--q-negative) !important;
  background: rgba(239, 68, 68, 0.06);
}

.calc-field__error {
  font-size: 10px;
  color: var(--q-negative);
  font-weight: 600;
}

.calc-field__label {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  opacity: 0.55;
}

.calc-field__value {
  font-size: 15px;
  font-weight: 700;
}

/* ── Grid / cards de evidência ───────────────────────────────────────────── */
.servicos-grid { display: flex; flex-direction: column; gap: 12px; }

.servico-card {
  border: 1px solid rgba(0, 0, 0, 0.09);
  border-radius: 12px;
  overflow: hidden;
  background: var(--q-color-surface, #fff);
  transition: border-color 0.2s;
}

.body--dark .servico-card { border-color: rgba(255, 255, 255, 0.08); background: rgba(255, 255, 255, 0.03); }
.servico-card--ok { border-color: rgba(76, 175, 80, 0.35); }
.servico-card--invalid { border-color: rgba(239, 68, 68, 0.45); }

.servico-card__header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 14px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  background: rgba(0, 0, 0, 0.02);
}

.body--dark .servico-card__header { border-color: rgba(255, 255, 255, 0.06); background: rgba(255, 255, 255, 0.025); }

.servico-card__header-left { display: flex; align-items: center; gap: 8px; }

.servico-card__badge {
  display: inline-flex; align-items: center; justify-content: center;
  width: 24px; height: 24px; border-radius: 50%;
  background: var(--q-primary); color: #fff;
  font-size: 11px; font-weight: 700; flex-shrink: 0;
}

.servico-card__title { font-size: 13px; font-weight: 600; opacity: 0.8; }

.pg-input { width: 110px; }

.servico-card__fotos { display: grid; grid-template-columns: 1fr auto 1fr; padding: 14px; }

.foto-slot { display: flex; flex-direction: column; gap: 6px; min-width: 0; }

.foto-slot__divider { width: 1px; margin: 0 14px; background: rgba(0, 0, 0, 0.07); align-self: stretch; }
.body--dark .foto-slot__divider { background: rgba(255, 255, 255, 0.07); }

.foto-slot__label {
  display: flex; align-items: center; gap: 5px;
  font-size: 10.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; opacity: 0.55;
}

:deep(.evidencia-zone--empty) { height: 260px; }

.foto-slot__clear-btn {
  z-index: 1;
}

.servicos-add-btn {
  display: flex; align-items: center; justify-content: center; gap: 6px;
  width: 100%; padding: 12px;
  border: 1.5px dashed rgba(0, 0, 0, 0.15); border-radius: 12px;
  background: transparent; color: var(--q-primary);
  font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit;
  transition: background 0.15s, border-color 0.15s;
}

.servicos-add-btn:hover { background: rgba(var(--q-primary-rgb, 25, 118, 210), 0.06); border-color: var(--q-primary); }
.body--dark .servicos-add-btn { border-color: rgba(255, 255, 255, 0.15); }
</style>
