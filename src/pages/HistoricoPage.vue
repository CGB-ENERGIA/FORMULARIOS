<template>
  <q-page class="page-shell">
    <div class="page-shell__inner">
      <header class="page-header">
        <div class="page-header__eyebrow">
          <q-btn
            flat dense no-caps
            icon="arrow_back"
            label="Voltar"
            color="primary"
            size="sm"
            class="q-mr-sm"
            @click="$router.back()"
          />
          <q-icon name="history" size="14px" />
          Registros salvos
        </div>
        <h1 class="page-header__title">Histórico de Consumidores</h1>
        <p class="page-header__subtitle">
          Registros salvos automaticamente ao exportar, organizados por distrital.
        </p>
      </header>

      <!-- ───── VISUALIZADOR DE JSON IMPORTADO ───── -->
      <template v-if="importedEntries !== null">
        <q-card flat class="premium-card q-mb-md import-banner">
          <q-card-section class="import-banner__body">
            <div class="import-banner__info">
              <q-icon name="folder_open" size="20px" color="primary" />
              <div>
                <div class="import-banner__title">Visualizando: <strong>{{ importedFileName }}</strong></div>
                <div class="import-banner__sub">{{ importedEntries.length }} registro(s) — somente leitura, nada foi alterado no histórico salvo</div>
              </div>
            </div>
            <q-btn flat dense no-caps icon="close" label="Fechar" color="grey-6" @click="closeImport" />
          </q-card-section>
        </q-card>

        <!-- Busca nos importados -->
        <div class="action-bar q-mb-md">
          <div class="action-bar__title">
            <span class="text-primary">{{ filteredImportedEntries.length }}</span> de {{ importedEntries.length }} registro(s)
          </div>
          <div class="search-bar">
            <q-icon name="search" size="18px" class="search-bar__icon" />
            <input
              v-model="importSearchQuery"
              class="search-bar__input"
              type="text"
              placeholder="Buscar por obra, PEP, município..."
            />
            <q-btn
              v-if="importSearchQuery"
              flat round dense icon="close" size="xs"
              class="search-bar__clear"
              @click="importSearchQuery = ''"
            />
          </div>
        </div>

        <div v-if="filteredImportedEntries.length === 0" class="empty-state">
          <q-icon name="search_off" size="56px" color="grey-4" />
          <div class="text-subtitle1 text-grey-6">Nenhum registro encontrado.</div>
        </div>

        <div v-else class="q-gutter-md q-mb-xl">
          <q-card
            v-for="entry in filteredImportedEntries"
            :key="entry.id"
            flat
            class="premium-card historico-card"
          >
            <div class="historico-card__header" @click="toggleImportedEntry(entry.id)">
              <div class="historico-card__info">
                <div class="historico-card__title">
                  <q-icon name="groups" size="16px" color="primary" />
                  <strong>{{ entry.descricaoObra || '(sem descrição)' }}</strong>
                  <q-badge color="teal" label="importado" dense class="q-ml-xs" />
                </div>
                <div class="historico-card__meta">
                  <span><q-icon name="today" size="14px" /> {{ entry.dataConclusao }}</span>
                  <span><q-icon name="location_on" size="14px" /> {{ entry.municipio }}</span>
                  <span v-if="entry.localidade"><q-icon name="place" size="14px" /> {{ entry.localidade }}</span>
                  <span><q-icon name="tag" size="14px" /> {{ entry.elementoPep }}</span>
                  <q-badge color="primary" :label="`${entry.totalConsumidores} consumidores`" class="q-ml-xs" />
                </div>
                <div class="text-caption text-grey-5 q-mt-xs">
                  Salvo em {{ formatDate(entry.id) }}
                </div>
              </div>
              <q-icon
                :name="importedExpandedIds.has(entry.id) ? 'expand_less' : 'expand_more'"
                size="24px"
                color="grey-6"
              />
            </div>

            <q-slide-transition>
              <div v-if="importedExpandedIds.has(entry.id)">
                <q-separator />
                <q-card-section class="obra-details q-py-sm q-px-md">
                  <div class="obra-details__grid">
                    <div class="obra-details__item">
                      <span class="obra-details__label">Elemento PEP</span>
                      <span class="obra-details__value">{{ entry.elementoPep || '—' }}</span>
                    </div>
                    <div class="obra-details__item">
                      <span class="obra-details__label">Município</span>
                      <span class="obra-details__value">{{ entry.municipio || '—' }}</span>
                    </div>
                    <div class="obra-details__item">
                      <span class="obra-details__label">Localidade</span>
                      <span class="obra-details__value">{{ entry.localidade || '—' }}</span>
                    </div>
                    <div class="obra-details__item">
                      <span class="obra-details__label">Data Conclusão</span>
                      <span class="obra-details__value">{{ entry.dataConclusao || '—' }}</span>
                    </div>
                  </div>
                </q-card-section>
                <q-separator />
                <q-card-section class="q-pa-sm">
                  <q-table
                    flat dense
                    :rows="entry.consumidores"
                    :columns="consumidorColumns"
                    row-key="numeroMedidor"
                    :pagination="{ rowsPerPage: 0 }"
                    hide-pagination
                    virtual-scroll
                    :virtual-scroll-item-size="44"
                    style="max-height: 360px"
                  />
                </q-card-section>
              </div>
            </q-slide-transition>
          </q-card>
        </div>
      </template>

      <!-- ───── HISTÓRICO SALVO (IndexedDB) ───── -->
      <template v-else>

        <!-- Seletor de distrital -->
        <q-card flat class="premium-card q-mb-md">
          <div class="premium-card__header">
            <div class="premium-card__header-title">
              <div class="premium-card__header-icon">
                <q-icon name="location_city" size="22px" />
              </div>
              Distrital
            </div>
            <!-- Botão Importar JSON -->
            <q-btn
              outline
              color="primary"
              icon="upload_file"
              label="Importar JSON"
              no-caps
              size="sm"
              @click="triggerImport"
            />
            <input
              ref="fileInputRef"
              type="file"
              accept=".json"
              style="display: none"
              @change="handleImportJson"
            />
          </div>
          <q-card-section class="premium-card__body">
            <div class="row q-gutter-sm">
              <q-btn
                v-for="d in DISTRITAIS"
                :key="d"
                :label="d"
                :color="distritalSelecionada === d ? 'primary' : 'grey-7'"
                :unelevated="distritalSelecionada === d"
                :outline="distritalSelecionada !== d"
                no-caps
                class="distrital-btn"
                @click="selectDistrital(d)"
              />
            </div>
          </q-card-section>
        </q-card>

        <!-- Conteúdo do histórico -->
        <div v-if="distritalSelecionada">

          <!-- Barra de ações -->
          <div class="action-bar q-mb-md">
            <div>
              <div class="action-bar__title">
                {{ distritalSelecionada }} —
                <span class="text-primary">{{ entries.length }} registro(s)</span>
              </div>
            </div>
            <div class="search-bar">
              <q-icon name="search" size="18px" class="search-bar__icon" />
              <input
                v-model="searchQuery"
                class="search-bar__input"
                type="text"
                placeholder="Buscar por obra, PEP, município..."
              />
              <q-btn
                v-if="searchQuery"
                flat round dense icon="close" size="xs"
                class="search-bar__clear"
                @click="searchQuery = ''"
              />
            </div>
            <div class="action-bar__actions">
              <q-btn
                outline
                color="primary"
                icon="download"
                label="Exportar JSON"
                no-caps
                :disable="entries.length === 0"
                @click="handleExportJson"
              />
              <q-btn
                outline
                color="primary"
                icon="refresh"
                no-caps
                :loading="loading"
                @click="loadEntries"
              />
            </div>
          </div>

          <!-- Loading -->
          <div v-if="loading" class="flex flex-center q-py-xl">
            <q-spinner color="primary" size="48px" />
          </div>

          <!-- Sem registros -->
          <div v-else-if="filteredEntries.length === 0" class="empty-state">
            <q-icon name="inbox" size="56px" color="grey-4" />
            <div class="text-subtitle1 text-grey-6">
              {{ searchQuery ? 'Nenhum registro encontrado.' : 'Nenhum registro salvo para esta distrital.' }}
            </div>
            <div v-if="!searchQuery" class="text-caption text-grey-5">
              Os registros aparecem aqui ao exportar o formulário de Consumidores.
            </div>
          </div>

          <!-- Lista de registros -->
          <div v-else class="q-gutter-md">
            <q-card
              v-for="entry in filteredEntries"
              :key="entry.id"
              flat
              class="premium-card historico-card"
            >
              <div class="historico-card__header" @click="toggleEntry(entry.id)">
                <div class="historico-card__info">
                  <div class="historico-card__title">
                    <q-icon name="groups" size="16px" color="primary" />
                    <strong>{{ entry.descricaoObra || '(sem descrição)' }}</strong>
                  </div>
                  <div class="historico-card__meta">
                    <span><q-icon name="today" size="14px" /> {{ entry.dataConclusao }}</span>
                    <span><q-icon name="location_on" size="14px" /> {{ entry.municipio }}</span>
                    <span v-if="entry.localidade"><q-icon name="place" size="14px" /> {{ entry.localidade }}</span>
                    <span><q-icon name="tag" size="14px" /> {{ entry.elementoPep }}</span>
                    <q-badge color="primary" :label="`${entry.totalConsumidores} consumidores`" class="q-ml-xs" />
                  </div>
                  <div class="text-caption text-grey-5 q-mt-xs">
                    Salvo em {{ formatDate(entry.id) }}
                  </div>
                </div>
                <div class="row items-center q-gutter-xs">
                  <q-btn
                    flat round dense
                    icon="delete_outline"
                    color="negative"
                    size="sm"
                    @click.stop="handleDeleteEntry(entry)"
                  >
                    <q-tooltip>Remover registro</q-tooltip>
                  </q-btn>
                  <q-icon
                    :name="expandedIds.has(entry.id) ? 'expand_less' : 'expand_more'"
                    size="24px"
                    color="grey-6"
                  />
                </div>
              </div>

              <!-- Tabela expandida de consumidores -->
              <q-slide-transition>
                <div v-if="expandedIds.has(entry.id)">
                  <q-separator />
                  <!-- Detalhes da obra -->
                  <q-card-section class="obra-details q-py-sm q-px-md">
                    <div class="obra-details__grid">
                      <div class="obra-details__item">
                        <span class="obra-details__label">Elemento PEP</span>
                        <span class="obra-details__value">{{ entry.elementoPep || '—' }}</span>
                      </div>
                      <div class="obra-details__item">
                        <span class="obra-details__label">Município</span>
                        <span class="obra-details__value">{{ entry.municipio || '—' }}</span>
                      </div>
                      <div class="obra-details__item">
                        <span class="obra-details__label">Localidade</span>
                        <span class="obra-details__value">{{ entry.localidade || '—' }}</span>
                      </div>
                      <div class="obra-details__item">
                        <span class="obra-details__label">Data Conclusão</span>
                        <span class="obra-details__value">{{ entry.dataConclusao || '—' }}</span>
                      </div>
                    </div>
                  </q-card-section>
                  <q-separator />
                  <q-card-section class="q-pa-sm">
                    <q-table
                      flat
                      dense
                      :rows="entry.consumidores"
                      :columns="consumidorColumns"
                      row-key="numeroMedidor"
                      :pagination="{ rowsPerPage: 0 }"
                      hide-pagination
                      virtual-scroll
                      :virtual-scroll-item-size="44"
                      style="max-height: 360px"
                    />
                  </q-card-section>
                </div>
              </q-slide-transition>
            </q-card>
          </div>
        </div>

        <!-- Nenhuma distrital selecionada -->
        <div v-else class="empty-state q-mt-xl">
          <q-icon name="touch_app" size="56px" color="grey-4" />
          <div class="text-subtitle1 text-grey-6">Selecione uma distrital acima</div>
        </div>

      </template>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useQuasar } from 'quasar';
import type { QTableColumn } from 'quasar';
import {
  DISTRITAIS,
  loadHistoricoEntries,
  deleteHistoricoEntry,
  exportHistoricoAsJson,
} from 'src/utils/historico-file';
import type { DistritalCode, HistoricoEntry } from 'src/utils/historico-file';

const $q = useQuasar();

// ─── Estado: histórico do IndexedDB ──────────────────────────────────────────
const distritalSelecionada = ref<DistritalCode | null>(null);
const entries = ref<HistoricoEntry[]>([]);
const loading = ref(false);
const searchQuery = ref('');
const expandedIds = ref<Set<string>>(new Set());

// ─── Estado: JSON importado ───────────────────────────────────────────────────
const fileInputRef = ref<HTMLInputElement | null>(null);
const importedEntries = ref<HistoricoEntry[] | null>(null);
const importedFileName = ref('');
const importSearchQuery = ref('');
const importedExpandedIds = ref<Set<string>>(new Set());

// ─── Computed ─────────────────────────────────────────────────────────────────
const filteredEntries = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  if (!q) return entries.value;
  return entries.value.filter(
    (e) =>
      e.descricaoObra.toLowerCase().includes(q) ||
      e.elementoPep.toLowerCase().includes(q) ||
      e.municipio.toLowerCase().includes(q) ||
      e.localidade.toLowerCase().includes(q) ||
      e.dataConclusao.includes(q),
  );
});

const filteredImportedEntries = computed(() => {
  const q = importSearchQuery.value.trim().toLowerCase();
  if (!q) return importedEntries.value ?? [];
  return (importedEntries.value ?? []).filter(
    (e) =>
      e.descricaoObra.toLowerCase().includes(q) ||
      e.elementoPep.toLowerCase().includes(q) ||
      e.municipio.toLowerCase().includes(q) ||
      e.localidade.toLowerCase().includes(q) ||
      e.dataConclusao.includes(q),
  );
});

// ─── Colunas da tabela ────────────────────────────────────────────────────────
const consumidorColumns: QTableColumn[] = [
  { name: 'nome', label: 'NOME', field: 'nome', align: 'left', sortable: true },
  { name: 'numeroMedidor', label: 'Nº MEDIDOR', field: 'numeroMedidor', align: 'left' },
  { name: 'tipoLigacao', label: 'TIPO', field: 'tipoLigacao', align: 'center' },
  { name: 'padrao', label: 'PADRÃO', field: 'padrao', align: 'center' },
  { name: 'posteLigacao', label: 'POSTE', field: 'posteLigacao', align: 'left' },
  { name: 'dataLigacao', label: 'DATA LIGAÇÃO', field: 'dataLigacao', align: 'center' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString('pt-BR');
  } catch {
    return iso;
  }
}

function toggleEntry(id: string) {
  if (expandedIds.value.has(id)) expandedIds.value.delete(id);
  else expandedIds.value.add(id);
}

function toggleImportedEntry(id: string) {
  if (importedExpandedIds.value.has(id)) importedExpandedIds.value.delete(id);
  else importedExpandedIds.value.add(id);
}

// ─── IndexedDB ────────────────────────────────────────────────────────────────
async function loadEntries() {
  if (!distritalSelecionada.value) return;
  loading.value = true;
  try {
    entries.value = await loadHistoricoEntries(distritalSelecionada.value);
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Erro ao carregar histórico.',
    });
  } finally {
    loading.value = false;
  }
}

async function selectDistrital(d: DistritalCode) {
  distritalSelecionada.value = d;
  expandedIds.value.clear();
  searchQuery.value = '';
  await loadEntries();
}

async function handleExportJson() {
  if (!distritalSelecionada.value) return;
  try {
    await exportHistoricoAsJson(distritalSelecionada.value);
    $q.notify({ type: 'positive', message: `Backup de ${distritalSelecionada.value} baixado.` });
  } catch (error) {
    $q.notify({ type: 'negative', message: 'Erro ao exportar backup.' });
    console.error(error);
  }
}

function handleDeleteEntry(entry: HistoricoEntry) {
  $q.dialog({
    title: 'Remover registro',
    message: `Remover o registro "${entry.descricaoObra}" (${entry.dataConclusao})?`,
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    if (!distritalSelecionada.value) return;
    try {
      await deleteHistoricoEntry(distritalSelecionada.value, entry.id);
      await loadEntries();
      $q.notify({ type: 'positive', message: 'Registro removido.' });
    } catch (error) {
      $q.notify({
        type: 'negative',
        message: error instanceof Error ? error.message : 'Erro ao remover registro.',
      });
    }
  });
}

// ─── Importar JSON ────────────────────────────────────────────────────────────
function triggerImport() {
  fileInputRef.value?.click();
}

function handleImportJson(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target?.result as string) as unknown;
      if (!Array.isArray(data)) throw new Error('O arquivo não contém uma lista de registros.');

      importedEntries.value = data as HistoricoEntry[];
      importedFileName.value = file.name;
      importedExpandedIds.value.clear();
      importSearchQuery.value = '';

      $q.notify({
        type: 'positive',
        icon: 'folder_open',
        message: `${importedEntries.value.length} registro(s) carregado(s) de "${file.name}".`,
      });
    } catch (err) {
      $q.notify({
        type: 'negative',
        message: err instanceof Error ? err.message : 'Arquivo JSON inválido.',
      });
    } finally {
      // Reset input para permitir importar o mesmo arquivo novamente
      (event.target as HTMLInputElement).value = '';
    }
  };
  reader.readAsText(file);
}

function closeImport() {
  importedEntries.value = null;
  importedFileName.value = '';
  importSearchQuery.value = '';
  importedExpandedIds.value.clear();
}
</script>

<style scoped>
.distrital-btn {
  font-weight: 600;
  letter-spacing: 0.5px;
  min-width: 72px;
}

.historico-card {
  border: 1px solid rgba(0, 0, 0, 0.08);
}

.body--dark .historico-card {
  border-color: rgba(255, 255, 255, 0.08);
}

.historico-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 16px;
  cursor: pointer;
  border-radius: 8px;
  transition: background 0.15s;
}

.historico-card__header:hover {
  background: rgba(0, 0, 0, 0.03);
}

.body--dark .historico-card__header:hover {
  background: rgba(255, 255, 255, 0.04);
}

.historico-card__title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 16px;
  margin-bottom: 4px;
}

.historico-card__meta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
  color: var(--q-color-grey-7, #616161);
  flex-wrap: wrap;
}

.historico-card__meta .q-icon {
  vertical-align: middle;
  margin-right: 2px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 64px 0;
  text-align: center;
}

.obra-details {
  background: rgba(0, 0, 0, 0.02);
}

.body--dark .obra-details {
  background: rgba(255, 255, 255, 0.03);
}

.obra-details__grid {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
}

.obra-details__item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.obra-details__label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  color: var(--q-primary);
  opacity: 0.8;
}

.obra-details__value {
  font-size: 13px;
  font-weight: 500;
}

/* Banner de importação */
.import-banner {
  border: 1px solid rgba(var(--q-primary-rgb, 25, 118, 210), 0.3) !important;
  background: rgba(var(--q-primary-rgb, 25, 118, 210), 0.04) !important;
}

.import-banner__body {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px !important;
}

.import-banner__info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.import-banner__title {
  font-size: 14px;
}

.import-banner__sub {
  font-size: 12px;
  color: var(--q-color-grey-6, #757575);
}
</style>
