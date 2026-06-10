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
          Preencha os dados da obra, adicione os serviços com fotos de início e fim e exporte para Excel ou PDF.
        </p>
      </header>

      <!-- ── Barra de ações ──────────────────────────────────────────────────── -->
      <div class="action-bar q-mb-md">
        <div>
          <div class="action-bar__title">Serviços</div>
          <div class="stat-chip q-mt-sm">
            <q-icon name="check_circle" size="18px" color="primary" />
            <strong>{{ preenchidosCount }}</strong> preenchido(s)
          </div>
        </div>
        <div class="action-bar__actions">
          <q-btn outline color="primary" icon="add" label="Adicionar linha" no-caps @click="addServico" />
          <q-btn unelevated icon="download" label="Exportar Excel" class="action-btn--excel" no-caps @click="handleExportExcel" />
          <q-btn unelevated icon="picture_as_pdf" label="Gerar PDF" class="action-btn--pdf" no-caps @click="handleExportPdf" />
          <q-btn outline color="negative" icon="restart_alt" no-caps @click="handleReset">
            <q-tooltip>Limpar formulário</q-tooltip>
          </q-btn>
        </div>
      </div>

      <!-- ── Tabela de serviços ──────────────────────────────────────────────── -->
      <q-card flat class="premium-card">
        <div class="premium-card__header">
          <div class="premium-card__header-title">
            <div class="premium-card__header-icon">
              <q-icon name="photo_library" size="22px" />
            </div>
            Serviços / Evidências Fotográficas
          </div>
        </div>
        <q-card-section class="q-pa-0">
          <div class="poda-table-wrap">
            <table class="poda-table">
              <thead>
                <tr>
                  <th class="poda-table__th poda-table__th--num">Nº</th>
                  <th class="poda-table__th poda-table__th--data">Data</th>
                  <th class="poda-table__th poda-table__th--ref">Referência</th>
                  <th class="poda-table__th poda-table__th--foto">Foto Início</th>
                  <th class="poda-table__th poda-table__th--foto">Foto Fim</th>
                  <th class="poda-table__th poda-table__th--actions"></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(servico, idx) in servicos" :key="servico.id" class="poda-table__row">

                  <!-- Nº -->
                  <td class="poda-table__td poda-table__td--num">{{ servico.id }}</td>

                  <!-- Data -->
                  <td class="poda-table__td">
                    <q-input
                      v-model="servico.data"
                      outlined dense hide-bottom-space
                      mask="##/##/####"
                      placeholder="DD/MM/AAAA"
                      class="poda-input"
                    >
                      <template #append>
                        <q-icon name="event" size="16px" class="cursor-pointer">
                          <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                            <q-date
                              :model-value="servico.data"
                              mask="DD/MM/YYYY"
                              @update:model-value="(v) => (servico.data = String(v ?? ''))"
                            >
                              <div class="row items-center justify-end">
                                <q-btn v-close-popup label="Fechar" color="primary" flat no-caps />
                              </div>
                            </q-date>
                          </q-popup-proxy>
                        </q-icon>
                      </template>
                    </q-input>
                  </td>

                  <!-- Referência -->
                  <td class="poda-table__td">
                    <q-input
                      v-model="servico.referencia"
                      outlined dense hide-bottom-space
                      placeholder="Ex: L65"
                      class="poda-input"
                    />
                  </td>

                  <!-- Foto Início -->
                  <td class="poda-table__td poda-table__td--foto">
                    <div class="foto-cell" @click="triggerFoto(idx, 'inicio')">
                      <img v-if="servico.fotoInicio" :src="servico.fotoInicio" class="foto-thumb" />
                      <div v-else class="foto-placeholder">
                        <q-icon name="add_photo_alternate" size="24px" color="grey-5" />
                        <span>Adicionar</span>
                      </div>
                      <q-btn
                        v-if="servico.fotoInicio"
                        flat round dense icon="close" size="xs" color="negative"
                        class="foto-remove"
                        @click.stop="servico.fotoInicio = ''"
                      />
                    </div>
                    <input
                      :ref="(el) => setFotoRef(el, idx, 'inicio')"
                      type="file"
                      accept="image/*"
                      style="display:none"
                      @change="(e) => handleFotoChange(e, servico, 'inicio')"
                    />
                  </td>

                  <!-- Foto Fim -->
                  <td class="poda-table__td poda-table__td--foto">
                    <div class="foto-cell" @click="triggerFoto(idx, 'fim')">
                      <img v-if="servico.fotoFim" :src="servico.fotoFim" class="foto-thumb" />
                      <div v-else class="foto-placeholder">
                        <q-icon name="add_photo_alternate" size="24px" color="grey-5" />
                        <span>Adicionar</span>
                      </div>
                      <q-btn
                        v-if="servico.fotoFim"
                        flat round dense icon="close" size="xs" color="negative"
                        class="foto-remove"
                        @click.stop="servico.fotoFim = ''"
                      />
                    </div>
                    <input
                      :ref="(el) => setFotoRef(el, idx, 'fim')"
                      type="file"
                      accept="image/*"
                      style="display:none"
                      @change="(e) => handleFotoChange(e, servico, 'fim')"
                    />
                  </td>

                  <!-- Ações -->
                  <td class="poda-table__td poda-table__td--actions">
                    <q-btn
                      flat round dense icon="delete_outline" color="negative" size="sm"
                      :disable="servicos.length <= 1"
                      @click="removeServico(idx)"
                    >
                      <q-tooltip>Remover linha</q-tooltip>
                    </q-btn>
                  </td>

                </tr>
              </tbody>
            </table>
          </div>
        </q-card-section>
      </q-card>

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

function handleFotoChange(event: Event, servico: PodaServico, tipo: 'inicio' | 'fim') {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    const result = e.target?.result as string;
    if (tipo === 'inicio') servico.fotoInicio = result;
    else servico.fotoFim = result;
  };
  reader.readAsDataURL(file);
  (event.target as HTMLInputElement).value = '';
}

function ensureExportavel(): boolean {
  validacaoAtiva.value = true;
  if (preenchidosCount.value === 0) {
    $q.notify({
      type: 'negative',
      icon: 'warning',
      message: 'Preencha ao menos um serviço antes de exportar.',
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
    message: 'Deseja apagar todos os dados e fotos preenchidos?',
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
/* ── Tabela ──────────────────────────────────────────────────────────────── */
.poda-table-wrap {
  overflow-x: auto;
}

.poda-table {
  width: 100%;
  border-collapse: collapse;
}

.poda-table__th {
  padding: 10px 8px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  text-align: left;
  border-bottom: 2px solid rgba(0, 0, 0, 0.08);
  background: rgba(0, 0, 0, 0.02);
  white-space: nowrap;
}

.body--dark .poda-table__th {
  border-color: rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.03);
}

.poda-table__th--num     { width: 40px; text-align: center; }
.poda-table__th--data    { width: 148px; }
.poda-table__th--ref     { width: 120px; }
.poda-table__th--foto    { width: 140px; text-align: center; }
.poda-table__th--actions { width: 44px; }

.poda-table__row:not(:last-child) .poda-table__td {
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.body--dark .poda-table__row:not(:last-child) .poda-table__td {
  border-color: rgba(255, 255, 255, 0.06);
}

.poda-table__td {
  padding: 6px 8px;
  vertical-align: middle;
}

.poda-table__td--num {
  text-align: center;
  font-size: 12px;
  font-weight: 600;
  color: var(--q-primary);
}

.poda-table__td--foto {
  padding: 6px;
}

.poda-table__td--actions {
  text-align: center;
}

/* ── Input inline ────────────────────────────────────────────────────────── */
.poda-input :deep(.q-field__control) {
  min-height: 34px;
  height: 34px;
}

/* ── Célula de foto ──────────────────────────────────────────────────────── */
.foto-cell {
  position: relative;
  width: 120px;
  height: 90px;
  border: 1.5px dashed rgba(0, 0, 0, 0.18);
  border-radius: 6px;
  cursor: pointer;
  overflow: hidden;
  transition: border-color 0.15s, background 0.15s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.foto-cell:hover {
  border-color: var(--q-primary);
  background: rgba(var(--q-primary-rgb, 25, 118, 210), 0.04);
}

.body--dark .foto-cell {
  border-color: rgba(255, 255, 255, 0.18);
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
  gap: 4px;
  color: var(--q-color-grey-5, #9e9e9e);
  font-size: 10px;
  user-select: none;
}

.foto-remove {
  position: absolute !important;
  top: 3px;
  right: 3px;
  background: rgba(255, 255, 255, 0.85) !important;
}

.body--dark .foto-remove {
  background: rgba(30, 30, 30, 0.85) !important;
}
</style>
