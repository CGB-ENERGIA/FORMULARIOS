<template>
  <div class="page-shell clientes-panel">
    <div class="page-shell__inner">
      <DistritalPicker
        v-model="distritalSelecionada"
        allow-all
        class="q-mb-md"
        @update:model-value="onDistritalChange"
      />

      <div class="consultar-toolbar">
        <div class="consultar-toolbar__count">
          <template v-if="distritalSelecionada">{{ distritalSelecionada }} · </template>
          <strong>{{ filteredEntries.length }}</strong> registro(s)
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
            flat
            round
            dense
            icon="close"
            size="xs"
            class="search-bar__clear"
            @click="searchQuery = ''"
          />
        </div>
        <q-btn
          flat
          round
          dense
          color="primary"
          icon="refresh"
          class="consultar-toolbar__refresh"
          :loading="loading"
          @click="loadEntries"
        >
          <q-tooltip>Atualizar</q-tooltip>
        </q-btn>
      </div>

      <div v-if="loading" class="consultar-results flex flex-center q-py-xl">
        <q-spinner color="primary" size="48px" />
      </div>

      <div v-else-if="filteredEntries.length === 0" class="consultar-results empty-state">
        <q-icon name="inbox" size="56px" color="grey-4" />
        <div class="text-subtitle1 text-grey-6">
          {{ searchQuery ? 'Nenhum registro encontrado.' : 'Nenhum registro salvo.' }}
        </div>
        <div v-if="!searchQuery" class="text-caption text-grey-5">
          Os registros aparecem ao exportar na Solicitação de serviço.
        </div>
      </div>

      <div v-else class="consultar-results q-gutter-md">
        <q-card
          v-for="entry in filteredEntries"
          :key="`${entry.distrital}-${entry.id}`"
          flat
          class="premium-card historico-card"
        >
          <div class="historico-card__header" @click="toggleEntry(entry.id)">
            <div class="historico-card__info">
              <div class="historico-card__title">
                <q-icon name="description" size="16px" color="primary" />
                <strong>{{ entry.descricao_obra || '(sem descrição)' }}</strong>
                <q-badge color="primary" outline :label="entry.distrital" class="q-ml-xs" />
                <q-badge
                  v-for="rel in entry.relatorios"
                  :key="`${entry.id}-${rel.nome_arquivo}`"
                  color="teal"
                  :label="rel.formato.toUpperCase()"
                  class="q-ml-xs"
                />
              </div>
              <div class="historico-card__meta">
                <span><q-icon name="today" size="14px" /> {{ entry.data_conclusao || '—' }}</span>
                <span><q-icon name="location_on" size="14px" /> {{ entry.municipio || '—' }}</span>
                <span v-if="entry.localidade"><q-icon name="place" size="14px" /> {{ entry.localidade }}</span>
                <span><q-icon name="tag" size="14px" /> {{ entry.elemento_pep || '—' }}</span>
                <q-badge
                  color="primary"
                  :label="`${entry.total_consumidores} consumidores`"
                  class="q-ml-xs"
                />
              </div>
              <div class="text-caption text-grey-5 q-mt-xs">
                Salvo em {{ formatDate(entry.created_at) }}
                <template v-if="entry.relatorios.length">
                  ·
                  {{ entry.relatorios.map((r) => r.nome_arquivo).join(' · ') }}
                </template>
              </div>
            </div>
            <div class="row items-center q-gutter-xs">
              <q-btn
                flat
                round
                dense
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

          <q-slide-transition>
            <div v-if="expandedIds.has(entry.id)">
              <q-separator />
              <q-card-section class="obra-details q-py-sm q-px-md">
                <div class="obra-details__grid">
                  <div class="obra-details__item">
                    <span class="obra-details__label">Elemento PEP</span>
                    <span class="obra-details__value">{{ entry.elemento_pep || '—' }}</span>
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
                    <span class="obra-details__value">{{ entry.data_conclusao || '—' }}</span>
                  </div>
                  <div class="obra-details__item">
                    <span class="obra-details__label">Formulário</span>
                    <span class="obra-details__value">{{ entry.formulario }}</span>
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
                  row-key="numero_medidor"
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
  </div>
</template>

<script setup lang="ts">
import { computed, onActivated, onMounted, ref } from 'vue';
import { useQuasar } from 'quasar';
import type { QTableColumn } from 'quasar';
import DistritalPicker from 'src/components/clientes/DistritalPicker.vue';
import type { DistritalCode } from 'src/utils/historico-file';
import {
  attachRelatorios,
  getRegistrosRepository,
} from 'src/services/registros';
import type { FormRegistro } from 'src/services/registros/types';

const $q = useQuasar();
const repo = getRegistrosRepository();

const distritalSelecionada = ref<DistritalCode | null>(null);
const entries = ref<FormRegistro[]>([]);
const loading = ref(false);
const searchQuery = ref('');
const expandedIds = ref<Set<string>>(new Set());

const consumidorColumns: QTableColumn[] = [
  { name: 'nome', label: 'NOME', field: 'nome', align: 'left' },
  { name: 'numero_medidor', label: 'MEDIDOR', field: 'numero_medidor', align: 'left' },
  { name: 'tipo_ligacao', label: 'LIGAÇÃO', field: 'tipo_ligacao', align: 'center' },
  { name: 'padrao', label: 'PADRÃO', field: 'padrao', align: 'center' },
  { name: 'poste_ligacao', label: 'POSTE', field: 'poste_ligacao', align: 'left' },
  { name: 'data_ligacao', label: 'DATA', field: 'data_ligacao', align: 'center' },
];

const filteredEntries = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  if (!q) return entries.value;
  return entries.value.filter((entry) =>
    [
      entry.descricao_obra,
      entry.elemento_pep,
      entry.municipio,
      entry.localidade,
      entry.distrital,
      ...entry.relatorios.map((r) => r.nome_arquivo),
    ]
      .join(' ')
      .toLowerCase()
      .includes(q),
  );
});

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString('pt-BR');
}

function toggleEntry(id: string) {
  const next = new Set(expandedIds.value);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  expandedIds.value = next;
}

async function loadEntries() {
  loading.value = true;
  try {
    const list = await repo.list(distritalSelecionada.value);
    entries.value = list.map(attachRelatorios);
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Erro ao carregar registros.',
    });
  } finally {
    loading.value = false;
  }
}

function onDistritalChange(value: DistritalCode | null) {
  distritalSelecionada.value = value;
  expandedIds.value = new Set();
  void loadEntries();
}

function handleDeleteEntry(entry: FormRegistro) {
  $q.dialog({
    title: 'Remover registro',
    message: `Remover o registro de "${entry.descricao_obra || entry.elemento_pep || entry.id}"?`,
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    try {
      await repo.remove(entry.distrital, entry.id);
      await loadEntries();
      $q.notify({ type: 'info', message: 'Registro removido.' });
    } catch (error) {
      $q.notify({
        type: 'negative',
        message: error instanceof Error ? error.message : 'Erro ao remover.',
      });
    }
  });
}

onMounted(() => {
  void loadEntries();
});

onActivated(() => {
  void loadEntries();
});
</script>

<style scoped lang="scss">
.consultar-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}

.consultar-results {
  margin-top: 20px;
}

.consultar-toolbar__count {
  min-width: 110px;
  font-size: 13px;
  color: var(--text-secondary);

  strong {
    color: var(--text-primary);
  }
}

.consultar-toolbar__refresh {
  border: 1px solid var(--border);
  background: var(--surface);
}

.search-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1 1 220px;
  min-width: min(260px, 100%);
  padding: 6px 10px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--surface);
}

.search-bar:focus-within {
  border-color: var(--primary);
}

.search-bar__icon {
  color: var(--text-muted);
}

.search-bar__input {
  flex: 1;
  border: 0;
  outline: 0;
  background: transparent;
  color: inherit;
  font-size: 13px;
}

.historico-card {
  overflow: hidden;
  transition: transform var(--transition), box-shadow var(--transition);
}

.historico-card:hover {
  box-shadow: var(--shadow-md);
}

.historico-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
  cursor: pointer;
}

.historico-card__header:hover {
  background: rgba(155, 27, 70, 0.06);
}

.historico-card__title {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
}

.historico-card__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  font-size: 12px;
  color: var(--text-muted, #94a3b8);
}

.historico-card__meta .q-icon {
  margin-right: 2px;
}

.obra-details__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 10px;
}

.obra-details__label {
  display: block;
  font-size: 11px;
  color: var(--text-muted, #94a3b8);
}

.obra-details__value {
  font-size: 13px;
  font-weight: 600;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 48px 16px;
  text-align: center;
}
</style>
