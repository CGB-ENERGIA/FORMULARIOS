<template>
  <q-page class="page-shell">
    <div class="page-shell__inner">
      <header class="page-header">
        <div class="page-header__eyebrow">
          <q-icon name="forest" size="14px" />
          Formulário operacional
        </div>
        <h1 class="page-header__title">Relatório de Poda</h1>
        <p class="page-header__subtitle">
          Registre as evidências fotográficas de início e fim de cada serviço e exporte para Excel ou PDF.
        </p>
      </header>

      <!-- ── Barra de ações ──────────────────────────────────────────────────── -->
      <div class="action-bar q-mb-lg">
        <div class="stat-chip">
          <q-icon name="check_circle" size="18px" color="primary" />
          <strong>{{ preenchidosCount }}</strong> serviço(s) com foto
        </div>
        <div class="action-bar__actions">
          <q-btn unelevated icon="download" label="Exportar Excel" class="action-btn--excel" no-caps @click="handleExportExcel" />
          <q-btn unelevated icon="picture_as_pdf" label="Gerar PDF" class="action-btn--pdf" no-caps @click="handleExportPdf" />
          <q-btn outline color="negative" icon="restart_alt" no-caps @click="handleReset">
            <q-tooltip>Limpar formulário</q-tooltip>
          </q-btn>
        </div>
      </div>

      <!-- ── Grid de serviços ───────────────────────────────────────────────── -->
      <div class="servicos-grid">

        <div
          v-for="(servico, idx) in servicos"
          :key="servico.id"
          class="servico-card"
          :class="{ 'servico-card--ok': servicoPreenchido(servico) }"
        >
          <!-- Cabeçalho do card -->
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

          <!-- Área de fotos -->
          <div class="servico-card__fotos">

            <!-- Foto Início -->
            <div class="foto-slot">
              <div class="foto-slot__label">
                <q-icon name="play_circle_outline" size="14px" />
                Registro Início dos Trabalhos
              </div>
              <div
                class="foto-cell"
                tabindex="0"
                @click="triggerFoto(idx, 'inicio')"
                @paste.stop="(e) => handlePaste(e, servico, 'inicio')"
              >
                <img v-if="servico.fotoInicio" :src="servico.fotoInicio" class="foto-thumb" />
                <div v-else class="foto-placeholder">
                  <q-icon name="add_photo_alternate" size="36px" color="grey-5" />
                  <span class="foto-placeholder__text">Clique para adicionar</span>
                  <span class="foto-placeholder__hint">ou pressione Ctrl+V para colar</span>
                </div>
                <q-btn
                  v-if="servico.fotoInicio"
                  flat round dense icon="close" size="xs" color="white"
                  class="foto-remove"
                  @click.stop="servico.fotoInicio = ''"
                />
              </div>
              <input
                :ref="(el) => setFotoRef(el, idx, 'inicio')"
                type="file" accept="image/*" style="display:none"
                @change="(e) => handleFotoChange(e, servico, 'inicio')"
              />
            </div>

            <!-- Divisor -->
            <div class="foto-slot__divider" />

            <!-- Foto Fim -->
            <div class="foto-slot">
              <div class="foto-slot__label">
                <q-icon name="stop_circle" size="14px" />
                Registro do Fim dos Trabalhos
              </div>
              <div
                class="foto-cell"
                tabindex="0"
                @click="triggerFoto(idx, 'fim')"
                @paste.stop="(e) => handlePaste(e, servico, 'fim')"
              >
                <img v-if="servico.fotoFim" :src="servico.fotoFim" class="foto-thumb" />
                <div v-else class="foto-placeholder">
                  <q-icon name="add_photo_alternate" size="36px" color="grey-5" />
                  <span class="foto-placeholder__text">Clique para adicionar</span>
                  <span class="foto-placeholder__hint">ou pressione Ctrl+V para colar</span>
                </div>
                <q-btn
                  v-if="servico.fotoFim"
                  flat round dense icon="close" size="xs" color="white"
                  class="foto-remove"
                  @click.stop="servico.fotoFim = ''"
                />
              </div>
              <input
                :ref="(el) => setFotoRef(el, idx, 'fim')"
                type="file" accept="image/*" style="display:none"
                @change="(e) => handleFotoChange(e, servico, 'fim')"
              />
            </div>

          </div>
        </div>

        <!-- Botão adicionar serviço -->
        <button class="servicos-add-btn" @click="addServico">
          <q-icon name="add_circle_outline" size="20px" />
          Adicionar serviço
        </button>

      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useQuasar } from 'quasar';
import { storeToRefs } from 'pinia';
import { usePodaStore, servicoPreenchido } from 'src/stores/poda';
import type { PodaServico } from 'src/stores/poda';
import { exportPodaToExcel } from 'src/utils/poda-excel';
import { exportPodaToPdf } from 'src/utils/poda-pdf';

const $q = useQuasar();
const store = usePodaStore();
const { servicos } = storeToRefs(store);
const { addServico, removeServico, resetForm } = store;

const validacaoAtiva = ref(false);

const preenchidosCount = computed(() => servicos.value.filter(servicoPreenchido).length);

// ── Refs dinâmicos para file inputs ──────────────────────────────────────────
const fotoRefs: Record<string, HTMLInputElement | null> = {};

function setFotoRef(el: unknown, idx: number, tipo: 'inicio' | 'fim') {
  fotoRefs[`${idx}-${tipo}`] = el as HTMLInputElement | null;
}

function triggerFoto(idx: number, tipo: 'inicio' | 'fim') {
  fotoRefs[`${idx}-${tipo}`]?.click();
}

function readFileAsDataUrl(file: File, servico: PodaServico, tipo: 'inicio' | 'fim') {
  const reader = new FileReader();
  reader.onload = (e) => {
    const result = e.target?.result as string;
    if (tipo === 'inicio') servico.fotoInicio = result;
    else servico.fotoFim = result;
  };
  reader.readAsDataURL(file);
}

function handleFotoChange(event: Event, servico: PodaServico, tipo: 'inicio' | 'fim') {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;
  readFileAsDataUrl(file, servico, tipo);
  (event.target as HTMLInputElement).value = '';
}

function handlePaste(event: ClipboardEvent, servico: PodaServico, tipo: 'inicio' | 'fim') {
  const items = event.clipboardData?.items;
  if (!items) return;
  for (const item of Array.from(items)) {
    if (item.type.startsWith('image/')) {
      event.preventDefault();
      const file = item.getAsFile();
      if (file) readFileAsDataUrl(file, servico, tipo);
      break;
    }
  }
}

function ensureExportavel(): boolean {
  validacaoAtiva.value = true;
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

// ── Exportações ───────────────────────────────────────────────────────────────
async function handleExportExcel() {
  if (!ensureExportavel()) return;
  const dismiss = $q.notify({ type: 'ongoing', message: 'Gerando Excel…', timeout: 0 });
  try {
    const fileName = await exportPodaToExcel(servicos.value);
    dismiss();
    $q.notify({ type: 'positive', message: `Arquivo ${fileName} gerado com sucesso.` });
  } catch (error) {
    dismiss();
    $q.notify({ type: 'negative', message: error instanceof Error ? error.message : 'Erro ao gerar Excel.' });
  }
}

async function handleExportPdf() {
  if (!ensureExportavel()) return;
  const dismiss = $q.notify({ type: 'ongoing', message: 'Gerando PDF…', timeout: 0 });
  try {
    const fileName = await exportPodaToPdf(servicos.value);
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
    message: 'Deseja apagar todos os serviços e fotos preenchidos?',
    cancel: true,
    persistent: true,
  }).onOk(() => {
    resetForm();
    validacaoAtiva.value = false;
    $q.notify({ type: 'info', message: 'Formulário limpo.' });
  });
}
</script>

<style scoped>
/* ── Grid de serviços ────────────────────────────────────────────────────── */
.servicos-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* ── Card de serviço ─────────────────────────────────────────────────────── */
.servico-card {
  border: 1px solid rgba(0, 0, 0, 0.09);
  border-radius: 12px;
  overflow: hidden;
  background: var(--q-color-surface, #fff);
  transition: box-shadow 0.2s, border-color 0.2s;
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

/* Cabeçalho do card */
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

/* Área de fotos */
.servico-card__fotos {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  padding: 14px;
  gap: 0;
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

/* ── Célula de foto ──────────────────────────────────────────────────────── */
.foto-cell {
  position: relative;
  width: 100%;
  height: 200px;
  border: 1.5px dashed rgba(0, 0, 0, 0.15);
  border-radius: 8px;
  cursor: pointer;
  overflow: hidden;
  transition: border-color 0.15s, background 0.15s;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.015);
}

.body--dark .foto-cell {
  border-color: rgba(255, 255, 255, 0.15);
  background: rgba(255, 255, 255, 0.02);
}

.foto-cell:hover,
.foto-cell:focus {
  border-color: var(--q-primary);
  background: rgba(var(--q-primary-rgb, 25, 118, 210), 0.04);
  outline: none;
}

.foto-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.foto-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  pointer-events: none;
  user-select: none;
}

.foto-placeholder__text {
  font-size: 12px;
  font-weight: 500;
  opacity: 0.5;
}

.foto-placeholder__hint {
  font-size: 10.5px;
  opacity: 0.35;
}

.foto-remove {
  position: absolute !important;
  top: 6px;
  right: 6px;
  background: rgba(0, 0, 0, 0.5) !important;
  backdrop-filter: blur(4px);
}

/* ── Botão adicionar serviço ─────────────────────────────────────────────── */
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
