<template>
  <div class="page-shell clientes-panel">
    <div class="page-shell__inner">
      <DistritalPicker
        :model-value="distrital || null"
        class="q-mb-md"
        :hint="distrital ? '' : 'Selecione uma distrital para habilitar o formulário'"
        @update:model-value="onDistritalPicked"
      />

      <!-- Formulário — só aparece após selecionar distrital -->
      <template v-if="distrital">

      <q-card flat class="premium-card q-mb-md">
        <div class="premium-card__header">
          <div class="premium-card__header-title">
            <div class="premium-card__header-icon">
              <q-icon name="engineering" size="22px" />
            </div>
            Informações da Obra
          </div>
        </div>

        <q-card-section class="premium-card__body field-grid">
          <div class="row q-col-gutter-md">
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
            <div class="col-12 col-md-6">
              <q-input
                :model-value="FORNECEDOR_FIXO"
                label="Fornecedor *"
                outlined
                dense
                readonly
                filled
                hide-bottom-space
              />
            </div>
            <div class="col-12 col-md-6">
              <q-input
                v-model="obra.elementoPep"
                label="Elemento PEP *"
                outlined
                dense
                hide-bottom-space
                :error="obraFieldHasError('elementoPep')"
                :error-message="obraFieldError('elementoPep') ?? undefined"
              />
            </div>
            <div class="col-12 col-md-6">
              <q-input
                :model-value="obra.dataConclusao"
                label="Data da Conclusão *"
                outlined
                dense
                mask="##/##/####"
                placeholder="DD/MM/AAAA"
                hide-bottom-space
                :error="obraFieldHasError('dataConclusao')"
                :error-message="obraFieldError('dataConclusao') ?? undefined"
                @update:model-value="onDataObraChange"
              >
                <template #append>
                  <q-icon name="event" class="cursor-pointer">
                    <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                      <q-date
                        :model-value="obra.dataConclusao"
                        mask="DD/MM/YYYY"
                        @update:model-value="onDataObraChange"
                      >
                        <div class="row items-center justify-end">
                          <q-btn v-close-popup label="Fechar" color="primary" flat no-caps />
                        </div>
                      </q-date>
                    </q-popup-proxy>
                  </q-icon>
                </template>
              </q-input>
            </div>
            <div class="col-12 col-md-6">
              <q-input
                :model-value="obra.dataEnergizacao"
                label="Data da Energização *"
                outlined
                dense
                mask="##/##/####"
                placeholder="DD/MM/AAAA"
                hide-bottom-space
                :error="obraFieldHasError('dataEnergizacao')"
                :error-message="obraFieldError('dataEnergizacao') ?? undefined"
                @update:model-value="onDataObraChange"
              >
                <template #append>
                  <q-icon name="event" class="cursor-pointer">
                    <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                      <q-date
                        :model-value="obra.dataEnergizacao"
                        mask="DD/MM/YYYY"
                        @update:model-value="onDataObraChange"
                      >
                        <div class="row items-center justify-end">
                          <q-btn v-close-popup label="Fechar" color="primary" flat no-caps />
                        </div>
                      </q-date>
                    </q-popup-proxy>
                  </q-icon>
                </template>
              </q-input>
            </div>
            <div class="col-12 col-md-6">
              <q-input
                :model-value="TEC_OBRA_FIXO"
                label="Téc da Obra *"
                outlined
                dense
                readonly
                filled
                hide-bottom-space
              />
            </div>
            <div class="col-12 col-md-6">
              <q-input
                :model-value="REGIONAL_FIXA"
                label="Regional *"
                outlined
                dense
                readonly
                filled
                hide-bottom-space
              />
            </div>
            <div class="col-12 col-md-6">
              <q-input
                v-model="obra.localidade"
                label="Localidade *"
                outlined
                dense
                hide-bottom-space
                :error="obraFieldHasError('localidade')"
                :error-message="obraFieldError('localidade') ?? undefined"
              />
            </div>
            <div class="col-12 col-md-6">
              <q-select
                v-model="obra.municipio"
                :options="municipioOptionsFiltered"
                label="Município *"
                outlined
                dense
                hide-bottom-space
                clearable
                use-input
                fill-input
                hide-selected
                input-debounce="0"
                :error="obraFieldHasError('municipio')"
                :error-message="obraFieldError('municipio') ?? undefined"
                @filter="filterMunicipios"
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
            outline
            color="primary"
            icon="picture_as_pdf"
            label="Consumidores (PDF)"
            no-caps
            @click="handleExportConsumidoresPdf"
          />
          <q-btn
            unelevated
            color="primary"
            icon="arrow_forward"
            :label="$q.screen.gt.xs ? 'CONTINUAR' : undefined"
            no-caps
            class="continuar-btn"
            :disable="!podeContinuar"
            @click="handleContinuar"
          >
            <q-tooltip v-if="!podeContinuar">
              Preencha a obra, os consumidores e anexe as fotos para continuar
            </q-tooltip>
          </q-btn>
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
            class="consumidores-table"
            flat
            :rows="consumidores"
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
                <q-th rowspan="2" auto-width>Nº</q-th>
                <q-th rowspan="2" style="min-width: 180px">NOME</q-th>
                <q-th rowspan="2" style="min-width: 130px">NÚMERO DO MEDIDOR *</q-th>
                <q-th colspan="3">TIPO DE LIGAÇÃO</q-th>
                <q-th colspan="3">PADRÃO</q-th>
                <q-th rowspan="2" style="min-width: 140px">POSTE DE LIGAÇÃO *</q-th>
                <q-th rowspan="2" style="min-width: 120px">DATA LIGAÇÃO</q-th>
                <q-th rowspan="2" style="min-width: 88px">FOTO DA FACHADA *</q-th>
                <q-th rowspan="2" style="min-width: 88px">FOTO DO MEDIDOR *</q-th>
                <q-th rowspan="2" auto-width></q-th>
              </q-tr>
              <q-tr>
                <q-th>MO</q-th>
                <q-th>BI</q-th>
                <q-th>TRI</q-th>
                <q-th>5M</q-th>
                <q-th>7M</q-th>
                <q-th>CPP</q-th>
              </q-tr>
            </template>

            <template #body="props">
              <q-tr :props="props">
                <q-td class="text-center">
                  <span class="row-index">{{ props.row.id }}</span>
                </q-td>
                <q-td>
                  <q-input v-model="props.row.nome" dense outlined hide-bottom-space />
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
                    :error="Boolean(medidorFieldError(props.row)) || medidorObrigatorioPendente(props.row)"
                    :error-message="
                      medidorFieldError(props.row)
                        ?? (medidorObrigatorioPendente(props.row) ? 'Campo obrigatório' : undefined)
                    "
                    @update:model-value="onNumeroMedidorInput(props.row, $event)"
                  />
                </q-td>

                <q-td v-for="tipo in tiposLigacao" :key="'tl-' + tipo.value" class="text-center">
                  <q-radio v-model="props.row.tipoLigacao" :val="tipo.value" dense color="primary" />
                </q-td>

                <q-td
                  v-for="(pad, padIdx) in padroes"
                  :key="'pd-' + pad.value"
                  class="text-center"
                  :class="padraoCellClass(props.row, padIdx)"
                >
                  <q-radio v-model="props.row.padrao" :val="pad.value" dense color="primary" />
                </q-td>

                <q-td>
                  <q-input
                    v-model="props.row.posteLigacao"
                    dense
                    outlined
                    hide-bottom-space
                    placeholder="PG ou coordenada"
                    :error="posteLigacaoPendente(props.row)"
                    :error-message="posteLigacaoPendente(props.row) ? 'Campo obrigatório' : undefined"
                  />
                </q-td>
                <q-td>
                  <q-input
                    :model-value="props.row.dataLigacao"
                    dense
                    outlined
                    hide-bottom-space
                    readonly
                    filled
                  />
                </q-td>
                <q-td class="text-center">
                  <div
                    class="foto-cell"
                    :class="{
                      'foto-cell--filled': props.row.fotoPadrao,
                      'foto-cell--empty': !props.row.fotoPadrao,
                      'foto-cell--error': fotoPadraoPendente(props.row),
                    }"
                    role="button"
                    tabindex="0"
                    :title="props.row.fotoPadrao ? 'Clique para visualizar' : 'Clique para anexar foto da fachada'"
                    @click="onFotoCellClick(props.row, props.rowIndex, 'padrao')"
                    @keydown.enter.prevent="onFotoCellClick(props.row, props.rowIndex, 'padrao')"
                    @keydown.space.prevent="onFotoCellClick(props.row, props.rowIndex, 'padrao')"
                  >
                    <img
                      v-if="props.row.fotoPadrao"
                      :src="props.row.fotoPadrao"
                      alt="Foto da fachada"
                      class="foto-cell__thumb"
                    />
                    <q-icon
                      v-else
                      name="photo_camera"
                      color="primary"
                      size="22px"
                      class="foto-cell__icon"
                    />
                    <q-btn
                      v-if="props.row.fotoPadrao"
                      flat
                      round
                      dense
                      size="xs"
                      icon="close"
                      color="negative"
                      class="foto-cell__clear"
                      @click.stop="props.row.fotoPadrao = ''"
                    >
                      <q-tooltip>Remover</q-tooltip>
                    </q-btn>
                    <input
                      :ref="(el) => setFotoRef(el, props.rowIndex, 'padrao')"
                      type="file"
                      accept="image/*"
                      class="hidden-input"
                      @change="onFotoSelected($event, props.row, 'padrao')"
                    />
                  </div>
                </q-td>
                <q-td class="text-center">
                  <div
                    class="foto-cell"
                    :class="{
                      'foto-cell--filled': props.row.fotoMedidor,
                      'foto-cell--empty': !props.row.fotoMedidor,
                      'foto-cell--error': fotoMedidorPendente(props.row),
                    }"
                    role="button"
                    tabindex="0"
                    :title="props.row.fotoMedidor ? 'Clique para visualizar' : 'Clique para anexar foto do medidor'"
                    @click="onFotoCellClick(props.row, props.rowIndex, 'medidor')"
                    @keydown.enter.prevent="onFotoCellClick(props.row, props.rowIndex, 'medidor')"
                    @keydown.space.prevent="onFotoCellClick(props.row, props.rowIndex, 'medidor')"
                  >
                    <img
                      v-if="props.row.fotoMedidor"
                      :src="props.row.fotoMedidor"
                      alt="Foto do medidor"
                      class="foto-cell__thumb"
                    />
                    <q-icon
                      v-else
                      name="photo_camera"
                      color="primary"
                      size="22px"
                      class="foto-cell__icon"
                    />
                    <q-btn
                      v-if="props.row.fotoMedidor"
                      flat
                      round
                      dense
                      size="xs"
                      icon="close"
                      color="negative"
                      class="foto-cell__clear"
                      @click.stop="props.row.fotoMedidor = ''"
                    >
                      <q-tooltip>Remover</q-tooltip>
                    </q-btn>
                    <input
                      :ref="(el) => setFotoRef(el, props.rowIndex, 'medidor')"
                      type="file"
                      accept="image/*"
                      class="hidden-input"
                      @change="onFotoSelected($event, props.row, 'medidor')"
                    />
                  </div>
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

      </template>
      <!-- /v-if distrital -->

    </div>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useQuasar } from 'quasar';
import type { QTableColumn } from 'quasar';
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import DistritalPicker from 'src/components/clientes/DistritalPicker.vue';
import { useCadastroStore } from 'src/stores/cadastro';
import { useConsumidoresStore, FORNECEDOR_FIXO, REGIONAL_FIXA, TEC_OBRA_FIXO } from 'src/stores/consumidores';
import type { Consumidor, ObraInfo } from 'src/stores/consumidores';
import { consumidorPreenchido } from 'src/utils/excel';
import {
  getMedidorFieldError,
  sanitizeDigits,
  validateConsumidoresParaExportacao,
  consumidorComDados,
} from 'src/utils/consumidor-helpers';
import { getObraFieldError, isObraCompleta, validateObraParaExportacao } from 'src/utils/obra-helpers';
import type { DistritalCode } from 'src/utils/historico-file';
import municipiosMaranhaoData from 'src/data/municipios-maranhao.json';
import { exportSomenteConsumidoresPdf } from 'src/utils/clientes-export';

type FotoTipo = 'padrao' | 'medidor';

const $q = useQuasar();
const router = useRouter();
const store = useConsumidoresStore();
const cadastroStore = useCadastroStore();
const { obra, consumidores, distrital } = storeToRefs(store);

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

function onDistritalPicked(value: DistritalCode | null) {
  distrital.value = value ?? '';
}

const { addConsumidor, removeConsumidor, resetForm, syncDatas, touchConsumidor } = store;
const obraValidacaoAtiva = ref(false);
const fotoRefs: Record<string, HTMLInputElement | null> = {};

const preenchidosCount = computed(
  () => consumidores.value.filter(consumidorPreenchido).length,
);

const obraCompleta = computed(() => isObraCompleta(obra.value));

const consumidoresCompletos = computed(
  () => validateConsumidoresParaExportacao(consumidores.value).length === 0,
);

const podeContinuar = computed(() => obraCompleta.value && consumidoresCompletos.value);

watch(
  consumidores,
  (rows) => {
    rows.forEach((consumidor) => touchConsumidor(consumidor));
  },
  { deep: true },
);

function setFotoRef(el: unknown, rowIndex: number, tipo: FotoTipo) {
  fotoRefs[`${rowIndex}-${tipo}`] = el as HTMLInputElement | null;
}

function triggerFoto(rowIndex: number, tipo: FotoTipo) {
  fotoRefs[`${rowIndex}-${tipo}`]?.click();
}

function onFotoCellClick(consumidor: Consumidor, rowIndex: number, tipo: FotoTipo) {
  const foto = tipo === 'padrao' ? consumidor.fotoPadrao : consumidor.fotoMedidor;
  if (foto) {
    openFotoPreview(foto, tipo === 'padrao' ? 'FOTO DA FACHADA' : 'FOTO DO MEDIDOR');
    return;
  }
  triggerFoto(rowIndex, tipo);
}

function readImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function onFotoSelected(
  event: Event,
  consumidor: Consumidor,
  tipo: FotoTipo,
) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    $q.notify({ type: 'negative', message: 'Selecione um arquivo de imagem.' });
    input.value = '';
    return;
  }

  try {
    const dataUrl = await readImageFile(file);
    if (tipo === 'padrao') consumidor.fotoPadrao = dataUrl;
    else consumidor.fotoMedidor = dataUrl;
  } catch {
    $q.notify({ type: 'negative', message: 'Erro ao carregar a imagem.' });
  } finally {
    input.value = '';
  }
}

function openFotoPreview(src: string, title: string) {
  $q.dialog({
    title,
    message: `<div style="text-align:center"><img src="${src}" alt="${title}" style="max-width:100%;max-height:70vh;border-radius:8px" /></div>`,
    html: true,
    ok: { label: 'Fechar', flat: true, color: 'primary' },
  });
}

function fotoPadraoPendente(row: Consumidor): boolean {
  return obraValidacaoAtiva.value && consumidorComDados(row) && !row.fotoPadrao;
}

function fotoMedidorPendente(row: Consumidor): boolean {
  return obraValidacaoAtiva.value && consumidorComDados(row) && !row.fotoMedidor;
}

function posteLigacaoPendente(row: Consumidor): boolean {
  return obraValidacaoAtiva.value && consumidorComDados(row) && !row.posteLigacao?.trim();
}

function medidorFieldError(consumidor: (typeof consumidores.value)[number]) {
  return getMedidorFieldError(consumidor);
}

function medidorObrigatorioPendente(row: Consumidor): boolean {
  return (
    obraValidacaoAtiva.value &&
    Boolean(row.nome?.trim()) &&
    !row.numeroMedidor?.trim()
  );
}

function onNumeroMedidorInput(consumidor: Consumidor, value: string | number | null) {
  consumidor.numeroMedidor = sanitizeDigits(value);
}

function obraFieldError(field: keyof ObraInfo) {
  if (!obraValidacaoAtiva.value) return null;
  return getObraFieldError(obra.value, field);
}

function obraFieldHasError(field: keyof ObraInfo) {
  return Boolean(obraFieldError(field));
}

function onDataObraChange(value: string | number | null) {
  syncDatas(String(value ?? ''));
}

const tiposLigacao = [
  { label: 'MO', value: 'MO' as const },
  { label: 'BI', value: 'BI' as const },
  { label: 'TRI', value: 'TRI' as const },
];

const padroes = [
  { label: '5M', value: '5M' as const },
  { label: '7M', value: '7M' as const },
  { label: 'CPP', value: 'CPP' as const },
];

function padraoPendente(row: (typeof consumidores.value)[number]): boolean {
  return obraValidacaoAtiva.value && consumidorComDados(row) && !row.padrao;
}

function padraoCellClass(row: (typeof consumidores.value)[number], idx: number) {
  if (!padraoPendente(row)) return '';
  return [
    'padrao-error',
    idx === 0 ? 'padrao-error--first' : '',
    idx === padroes.length - 1 ? 'padrao-error--last' : '',
  ];
}

const columns: QTableColumn[] = [{ name: 'id', label: 'Nº', field: 'id' }];

function notifyExportValidationErrors(errors: string[]) {
  $q.notify({
    type: 'negative',
    message: 'Não foi possível continuar. Corrija os campos:',
    caption: errors.join(' · '),
    multiLine: errors.length > 1,
    timeout: 8000,
  });
}

function ensureExportavel(): boolean {
  obraValidacaoAtiva.value = true;
  const errors = [
    ...validateObraParaExportacao(obra.value),
    ...validateConsumidoresParaExportacao(consumidores.value),
  ];
  if (errors.length > 0) {
    notifyExportValidationErrors(errors);
    return false;
  }
  return true;
}

function handleContinuar() {
  if (!ensureExportavel()) return;

  $q.dialog({
    title: 'A OBRA POSSUI TRANSFORMADOR?',
    message: 'Se a obra tiver transformador, você preencherá Transformador e Responsável. Caso contrário, apenas Responsável / Execução.',
    options: {
      type: 'radio',
      model: 'sim',
      items: [
        { label: 'SIM', value: 'sim' },
        { label: 'NÃO', value: 'nao' },
      ],
    },
    cancel: { label: 'Cancelar', flat: true, color: 'grey-7' },
    ok: { label: 'Continuar', color: 'primary', unelevated: true },
    persistent: true,
  }).onOk((value: string) => {
    cadastroStore.setPossuiTransformador(value === 'sim');
    void router.push({ path: '/clientes', query: { tab: 'cadastro' } });
  });
}

async function handleExportConsumidoresPdf() {
  obraValidacaoAtiva.value = true;
  const errors = [
    ...validateObraParaExportacao(obra.value),
    ...validateConsumidoresParaExportacao(consumidores.value),
  ];
  if (errors.length > 0) {
    notifyExportValidationErrors(errors);
    return;
  }

  const dismiss = $q.notify({ type: 'ongoing', message: 'Gerando Consumidores (PDF)…', timeout: 0 });
  try {
    const { consumidoresFileName } = await exportSomenteConsumidoresPdf(obra.value, consumidores.value);
    dismiss();
    $q.notify({ type: 'positive', message: 'PDF gerado com sucesso.', caption: consumidoresFileName, timeout: 6000 });
  } catch (error) {
    dismiss();
    $q.notify({ type: 'negative', message: error instanceof Error ? error.message : 'Erro ao exportar.' });
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
    cadastroStore.resetForm();
    obraValidacaoAtiva.value = false;
    $q.notify({ type: 'info', message: 'Formulário limpo.' });
  });
}
</script>

<style scoped>
.distrital-hint {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 12px;
  font-size: 13px;
  color: var(--q-color-warning, #f59e0b);
}

/* Destaque vermelho nas células de PADRÃO sem preenchimento */
.padrao-error {
  background: rgba(220, 38, 38, 0.07) !important;
  border-top: 1.5px solid rgba(220, 38, 38, 0.55) !important;
  border-bottom: 1.5px solid rgba(220, 38, 38, 0.55) !important;
}

.padrao-error--first {
  border-left: 1.5px solid rgba(220, 38, 38, 0.55) !important;
}

.padrao-error--last {
  border-right: 1.5px solid rgba(220, 38, 38, 0.55) !important;
}

.hidden-input {
  display: none;
}

.foto-cell {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 48px;
  border-radius: 8px;
  border: 1px dashed rgba(148, 163, 184, 0.55);
  background: rgba(148, 163, 184, 0.08);
  user-select: none;
}

.foto-cell--empty {
  cursor: pointer;
}

.foto-cell--empty:hover {
  border-color: var(--primary);
  background: var(--primary-soft);
}

.foto-cell--filled {
  border-style: solid;
  border-color: rgba(155, 27, 70, 0.35);
  padding: 2px;
  cursor: zoom-in;
}

.foto-cell--error {
  border-color: rgba(220, 38, 38, 0.7);
  background: rgba(220, 38, 38, 0.08);
}

.foto-cell__thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 6px;
  pointer-events: none;
}

.foto-cell__icon {
  pointer-events: none;
}

.foto-cell__clear {
  position: absolute;
  top: -8px;
  right: -8px;
  background: var(--surface, #fff) !important;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.18);
  cursor: pointer;
}

.continuar-btn {
  font-weight: 700;
  letter-spacing: 0.04em;
  min-width: 140px;
}
</style>
