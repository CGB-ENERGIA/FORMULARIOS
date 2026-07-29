<template>
  <div class="page-shell clientes-panel">
    <div class="page-shell__inner">
      <header class="controle-header">
        <div>
          <h2 class="controle-header__title">Controle de obras</h2>
          <p class="controle-header__subtitle">
            Pesquisa, arquivos gerados (PDF/Excel) e status de medidores baixados.
          </p>
        </div>
      </header>

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
          <span v-if="medidorStats.total" class="consultar-toolbar__meters">
            · {{ medidorStats.baixados }}/{{ medidorStats.total }} medidores baixados
          </span>
        </div>
        <div class="search-bar">
          <q-icon name="search" size="18px" class="search-bar__icon" />
          <input
            v-model="searchQuery"
            class="search-bar__input"
            type="text"
            placeholder="Buscar por obra, PEP, município, cliente ou medidor..."
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
        <div class="medidor-filter">
          <q-btn
            v-for="opt in medidorFiltroOptions"
            :key="opt.value"
            dense
            unelevated
            no-caps
            size="sm"
            :color="medidorFiltro === opt.value ? 'primary' : undefined"
            :outline="medidorFiltro !== opt.value"
            :label="opt.label"
            @click="medidorFiltro = opt.value"
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
          {{ searchQuery || medidorFiltro !== 'todos' ? 'Nenhum registro encontrado.' : 'Nenhum registro salvo.' }}
        </div>
        <div v-if="!searchQuery && medidorFiltro === 'todos'" class="text-caption text-grey-5">
          Os registros e arquivos aparecem ao exportar na Solicitação de serviço.
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
                  :key="`${entry.id}-${rel.id || rel.nome_arquivo}`"
                  :color="rel.armazenado ? 'teal' : 'grey'"
                  :label="rel.formato.toUpperCase()"
                  class="q-ml-xs"
                >
                  <q-tooltip>
                    {{ rel.nome_arquivo }}
                    <template v-if="rel.armazenado"> · armazenado</template>
                    <template v-else> · só metadado</template>
                  </q-tooltip>
                </q-badge>
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
                <q-badge
                  :color="entryMedidorStats(entry).pendentes ? 'orange' : 'positive'"
                  outline
                  :label="`${entryMedidorStats(entry).baixados}/${entry.consumidores.length} baixados`"
                  class="q-ml-xs"
                />
              </div>
              <div class="text-caption text-grey-5 q-mt-xs">
                Atualizado em {{ formatDate(entry.updated_at || entry.created_at) }}
                <template v-if="entry.historico_exportacoes.length > 1">
                  · {{ entry.historico_exportacoes.length }} exportações
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
                <q-tooltip>Remover registro e arquivos</q-tooltip>
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
                </div>
              </q-card-section>

              <q-separator />
              <q-card-section class="q-pa-md">
                <div class="arquivos-block__title">Arquivos gerados (atual)</div>
                <div v-if="!entry.relatorios.length" class="text-caption text-grey-5">
                  Nenhum arquivo vinculado a este registro.
                </div>
                <div v-else class="arquivos-list">
                  <div
                    v-for="rel in entry.relatorios"
                    :key="rel.id || rel.nome_arquivo"
                    class="arquivo-row"
                  >
                    <div class="arquivo-row__info">
                      <q-icon
                        :name="rel.formato === 'pdf' ? 'picture_as_pdf' : 'table_view'"
                        :color="rel.formato === 'pdf' ? 'negative' : 'positive'"
                        size="20px"
                      />
                      <div>
                        <div class="arquivo-row__name">{{ rel.nome_arquivo }}</div>
                        <div class="text-caption text-grey-5">
                          {{ rel.formato.toUpperCase() }}
                          <template v-if="rel.tamanho_bytes">
                            · {{ formatBytes(rel.tamanho_bytes) }}
                          </template>
                          · {{ rel.armazenado ? 'disponível para baixar' : 'metadado apenas' }}
                        </div>
                      </div>
                    </div>
                    <q-btn
                      dense
                      unelevated
                      no-caps
                      color="primary"
                      icon="download"
                      label="Baixar"
                      :disable="!rel.armazenado || !rel.id"
                      :loading="downloadingId === rel.id"
                      @click="handleDownloadArquivo(rel)"
                    />
                  </div>
                </div>
              </q-card-section>

              <q-separator />
              <q-card-section class="q-pa-md">
                <div class="arquivos-block__title">
                  Histórico do PEP
                  <span v-if="entry.elemento_pep" class="arquivos-block__pep">
                    {{ entry.elemento_pep }}
                  </span>
                </div>
                <div v-if="entry.historico_exportacoes.length === 0" class="text-caption text-grey-5">
                  Nenhuma exportação registrada.
                </div>
                <div v-else class="historico-list">
                  <div
                    v-for="(evento, idx) in entry.historico_exportacoes"
                    :key="evento.id"
                    class="historico-evento"
                  >
                    <div class="historico-evento__head">
                      <div>
                        <strong>{{ formatDate(evento.exported_at) }}</strong>
                        <q-badge
                          v-if="idx === 0"
                          color="primary"
                          label="Atual"
                          class="q-ml-sm"
                          outline
                        />
                      </div>
                      <span class="text-caption text-grey-5">
                        {{ evento.total_consumidores }} consumidor(es)
                      </span>
                    </div>
                    <div v-if="evento.descricao_obra" class="text-caption q-mb-sm">
                      {{ evento.descricao_obra }}
                    </div>
                    <div class="arquivos-list">
                      <div
                        v-for="rel in evento.relatorios"
                        :key="`${evento.id}-${rel.id || rel.nome_arquivo}`"
                        class="arquivo-row arquivo-row--compact"
                      >
                        <div class="arquivo-row__info">
                          <q-icon
                            :name="rel.formato === 'pdf' ? 'picture_as_pdf' : 'table_view'"
                            :color="rel.formato === 'pdf' ? 'negative' : 'positive'"
                            size="18px"
                          />
                          <span class="arquivo-row__name">{{ rel.nome_arquivo }}</span>
                        </div>
                        <q-btn
                          dense
                          flat
                          round
                          color="primary"
                          icon="download"
                          size="sm"
                          :disable="!rel.armazenado || !rel.id"
                          :loading="downloadingId === rel.id"
                          @click="handleDownloadArquivo(rel)"
                        >
                          <q-tooltip>Baixar</q-tooltip>
                        </q-btn>
                      </div>
                    </div>
                  </div>
                </div>
              </q-card-section>

              <q-separator />
              <q-card-section class="q-pa-sm">
                <div class="arquivos-block__title q-px-sm q-pb-sm">Medidores</div>
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
                >
                  <template #body-cell-medidor_baixado="props">
                    <q-td :props="props">
                      <q-toggle
                        dense
                        color="positive"
                        :model-value="props.row.medidor_baixado"
                        :label="props.row.medidor_baixado ? 'Baixado' : 'Pendente'"
                        @update:model-value="(v: boolean) => toggleMedidor(entry, props.row.numero_medidor, v)"
                      />
                    </q-td>
                  </template>
                </q-table>
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
  downloadBlob,
  formatBytes,
  getRegistrosRepository,
} from 'src/services/registros';
import type {
  FormRegistro,
  MedidorFiltro,
  RegistroConsumidor,
  RelatorioGerado,
} from 'src/services/registros/types';

const $q = useQuasar();
const repo = getRegistrosRepository();

const distritalSelecionada = ref<DistritalCode | null>(null);
const entries = ref<FormRegistro[]>([]);
const loading = ref(false);
const searchQuery = ref('');
const medidorFiltro = ref<MedidorFiltro>('todos');
const expandedIds = ref<Set<string>>(new Set());
const downloadingId = ref<string | null>(null);

const medidorFiltroOptions: Array<{ value: MedidorFiltro; label: string }> = [
  { value: 'todos', label: 'Todos' },
  { value: 'pendentes', label: 'Pendentes' },
  { value: 'baixados', label: 'Baixados' },
];

const consumidorColumns: QTableColumn[] = [
  { name: 'nome', label: 'NOME', field: 'nome', align: 'left' },
  { name: 'numero_medidor', label: 'MEDIDOR', field: 'numero_medidor', align: 'left' },
  { name: 'tipo_ligacao', label: 'LIGAÇÃO', field: 'tipo_ligacao', align: 'center' },
  { name: 'padrao', label: 'PADRÃO', field: 'padrao', align: 'center' },
  { name: 'poste_ligacao', label: 'POSTE', field: 'poste_ligacao', align: 'left' },
  { name: 'data_ligacao', label: 'DATA', field: 'data_ligacao', align: 'center' },
  {
    name: 'medidor_baixado',
    label: 'STATUS',
    field: 'medidor_baixado',
    align: 'center',
  },
];

function entryMedidorStats(entry: FormRegistro) {
  const baixados = entry.consumidores.filter((c) => c.medidor_baixado).length;
  return {
    baixados,
    pendentes: entry.consumidores.length - baixados,
  };
}

const medidorStats = computed(() => {
  const all = entries.value.flatMap((e) => e.consumidores);
  const baixados = all.filter((c) => c.medidor_baixado).length;
  return { total: all.length, baixados };
});

const filteredEntries = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  return entries.value.filter((entry) => {
    if (medidorFiltro.value === 'pendentes') {
      if (!entry.consumidores.some((c) => !c.medidor_baixado)) return false;
    } else if (medidorFiltro.value === 'baixados') {
      if (!entry.consumidores.some((c) => c.medidor_baixado)) return false;
    }

    if (!q) return true;
    return [
      entry.descricao_obra,
      entry.elemento_pep,
      entry.municipio,
      entry.localidade,
      entry.distrital,
      ...entry.relatorios.map((r) => r.nome_arquivo),
      ...entry.consumidores.flatMap((c) => [c.nome, c.numero_medidor]),
    ]
      .join(' ')
      .toLowerCase()
      .includes(q);
  });
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

function normalizeRelatorio(rel: RelatorioGerado): RelatorioGerado {
  return {
    id: rel.id ?? '',
    formato: rel.formato === 'excel' ? 'excel' : 'pdf',
    nome_arquivo: rel.nome_arquivo,
    mime_type: rel.mime_type ?? '',
    tamanho_bytes: rel.tamanho_bytes ?? 0,
    armazenado: Boolean(rel.armazenado && rel.id),
  };
}

async function loadEntries() {
  loading.value = true;
  try {
    const list = await repo.list(distritalSelecionada.value);
    entries.value = list.map((entry) => ({
      ...entry,
      updated_at: entry.updated_at || entry.created_at,
      historico_exportacoes: entry.historico_exportacoes ?? [],
      relatorios: entry.relatorios.map(normalizeRelatorio),
      consumidores: entry.consumidores.map(
        (c): RegistroConsumidor => ({
          ...c,
          medidor_baixado: Boolean(c.medidor_baixado),
        }),
      ),
    }));
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

async function handleDownloadArquivo(rel: RelatorioGerado) {
  if (!rel.id || !rel.armazenado) {
    $q.notify({ type: 'warning', message: 'Arquivo não está armazenado neste dispositivo.' });
    return;
  }
  downloadingId.value = rel.id;
  try {
    const arquivo = await repo.getArquivo(rel.id);
    if (!arquivo) {
      $q.notify({ type: 'negative', message: 'Arquivo não encontrado no armazenamento local.' });
      return;
    }
    downloadBlob(arquivo.blob, arquivo.nome_arquivo);
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Erro ao baixar arquivo.',
    });
  } finally {
    downloadingId.value = null;
  }
}

async function toggleMedidor(
  entry: FormRegistro,
  numeroMedidor: string,
  medidorBaixado: boolean,
) {
  try {
    await repo.updateConsumidorMedidor(
      entry.distrital,
      entry.id,
      numeroMedidor,
      medidorBaixado,
    );
    const target = entries.value.find((e) => e.id === entry.id);
    if (target) {
      target.consumidores = target.consumidores.map((c) =>
        c.numero_medidor === numeroMedidor
          ? { ...c, medidor_baixado: medidorBaixado }
          : c,
      );
    }
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Erro ao atualizar medidor.',
    });
  }
}

function handleDeleteEntry(entry: FormRegistro) {
  $q.dialog({
    title: 'Remover registro',
    message: `Remover o registro e os arquivos de "${entry.descricao_obra || entry.elemento_pep || entry.id}"?`,
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    try {
      await repo.remove(entry.distrital, entry.id);
      await loadEntries();
      $q.notify({ type: 'info', message: 'Registro e arquivos removidos.' });
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
.controle-header {
  margin-bottom: 16px;
}

.controle-header__title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--text);
}

.controle-header__subtitle {
  margin: 4px 0 0;
  font-size: 13px;
  color: var(--text-secondary, #94a3b8);
}

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

.consultar-toolbar__meters {
  color: var(--text-muted, #94a3b8);
}

.consultar-toolbar__refresh {
  border: 1px solid var(--border);
  background: var(--surface);
}

.medidor-filter {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
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

.arquivos-block__title {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--text-muted, #94a3b8);
  margin-bottom: 10px;
}

.arquivos-block__pep {
  margin-left: 8px;
  text-transform: none;
  letter-spacing: 0;
  font-weight: 600;
  color: var(--primary);
}

.arquivos-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.arquivo-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--surface);
}

.arquivo-row--compact {
  padding: 6px 10px;
}

.arquivo-row__info {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.arquivo-row__name {
  font-size: 13px;
  font-weight: 600;
  word-break: break-word;
}

.historico-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.historico-evento {
  padding: 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--surface);
}

.historico-evento__head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 6px;
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
