<template>
  <q-page class="page-shell">
    <div class="page-shell__inner">
      <header class="page-header">
        <div class="page-header__eyebrow">
          <q-icon name="history" size="14px" />
          Registros salvos
        </div>
        <h1 class="page-header__title">Histórico de Consumidores</h1>
        <p class="page-header__subtitle">
          Registros salvos automaticamente ao exportar, organizados por distrital.
        </p>
      </header>

      <!-- Seletor de distrital -->
      <q-card flat class="premium-card q-mb-md">
        <div class="premium-card__header">
          <div class="premium-card__header-title">
            <div class="premium-card__header-icon">
              <q-icon name="location_city" size="22px" />
            </div>
            Distrital
          </div>
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
                  <span><q-icon name="tag" size="14px" /> PEP: {{ entry.elementoPep }}</span>
                  <span v-if="entry.nota"><q-icon name="receipt_long" size="14px" /> Nota: {{ entry.nota }}</span>
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

const distritalSelecionada = ref<DistritalCode | null>(null);
const entries = ref<HistoricoEntry[]>([]);
const loading = ref(false);
const searchQuery = ref('');
const expandedIds = ref<Set<string>>(new Set());

const filteredEntries = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  if (!q) return entries.value;
  return entries.value.filter(
    (e) =>
      e.descricaoObra.toLowerCase().includes(q) ||
      e.elementoPep.toLowerCase().includes(q) ||
      (e.nota ?? '').toLowerCase().includes(q) ||
      e.municipio.toLowerCase().includes(q) ||
      e.localidade.toLowerCase().includes(q) ||
      e.dataConclusao.includes(q),
  );
});

const consumidorColumns: QTableColumn[] = [
  { name: 'nome', label: 'NOME', field: 'nome', align: 'left', sortable: true },
  { name: 'numeroMedidor', label: 'Nº MEDIDOR', field: 'numeroMedidor', align: 'left' },
  { name: 'tipoLigacao', label: 'TIPO', field: 'tipoLigacao', align: 'center' },
  { name: 'padrao', label: 'PADRÃO', field: 'padrao', align: 'center' },
  { name: 'posteLigacao', label: 'POSTE', field: 'posteLigacao', align: 'left' },
  { name: 'dataLigacao', label: 'DATA LIGAÇÃO', field: 'dataLigacao', align: 'center' },
];

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString('pt-BR');
  } catch {
    return iso;
  }
}

function toggleEntry(id: string) {
  if (expandedIds.value.has(id)) {
    expandedIds.value.delete(id);
  } else {
    expandedIds.value.add(id);
  }
}

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
</style>
