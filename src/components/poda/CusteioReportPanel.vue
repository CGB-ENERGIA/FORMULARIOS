<template>
  <div class="custeio-report-panel">
    <div class="action-bar q-mb-lg">
      <div class="stat-chip">
        <q-icon name="check_circle" size="18px" color="primary" />
        <strong>{{ preenchidosCount }}</strong> serviço(s) preenchido(s)
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
              :label="cabecalho.tipoOrdem === 'incidente' ? 'Nº do Incidente *' : 'Nº da Ordem (opcional)'"
              outlined
              dense
              hide-bottom-space
              :error="validacaoAtiva && cabecalho.tipoOrdem === 'incidente' && !cabecalho.ordemNumero.trim()"
              error-message="Informe o número do incidente"
            >
              <template #prepend>
                <q-btn
                  flat no-caps dense padding="xs sm" size="sm"
                  :color="cabecalho.tipoOrdem === 'ordem' ? 'primary' : 'grey'"
                  :class="{ 'text-weight-bold': cabecalho.tipoOrdem === 'ordem' }"
                  label="ORDEM"
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
            <q-select
              v-model="cabecalho.prefixoEquipe"
              :options="equipeOptionsFiltered"
              label="Prefixo da equipe *"
              outlined
              dense
              hide-bottom-space
              use-input
              fill-input
              hide-selected
              input-debounce="0"
              :error="validacaoAtiva && !cabecalho.prefixoEquipe.trim()"
              error-message="Informe o prefixo da equipe"
              @filter="filterEquipes"
              @update:model-value="onEquipeSelecionada"
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

        <div class="servico-card__body">
          <div class="col-grow">
            <q-input
              v-model="servico.atividade"
              label="Atividade"
              outlined
              dense
              hide-bottom-space
            />
          </div>
          <div class="servico-card__qtd">
            <q-input
              v-model="servico.quantidade"
              label="Quantidade"
              outlined
              dense
              hide-bottom-space
              type="number"
              min="0"
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
import { ref, computed } from 'vue';
import { useQuasar } from 'quasar';
import { storeToRefs } from 'pinia';
import { useCusteioStore, servicoPreenchido } from 'src/stores/custeio';
import { exportCusteioToPdf } from 'src/utils/custeio-pdf';
import { validateCusteioCabecalho } from 'src/utils/custeio-helpers';
import { formatDistritalLabel } from 'src/utils/arrasto-helpers';
import distritaisData from 'src/data/arrasto-distritais.json';
import municipiosMaranhaoData from 'src/data/municipios-maranhao.json';
import custeioEquipesData from 'src/data/custeio-equipes.json';

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

const equipeMap = custeioEquipesData as Record<string, string>;
const equipeOptions = Object.keys(equipeMap);
const equipeOptionsFiltered = ref(equipeOptions);

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

function filterEquipes(val: string, update: (callback: () => void) => void) {
  update(() => {
    const needle = normalizeSearch(val);
    equipeOptionsFiltered.value = needle === ''
      ? equipeOptions
      : equipeOptions.filter((e) => normalizeSearch(e).includes(needle));
  });
}

function onEquipeSelecionada(prefixo: string | null) {
  if (!prefixo) return;
  const base = equipeMap[prefixo];
  if (base) cabecalho.value.base = base;
}

const validacaoAtiva = ref(false);
const preenchidosCount = computed(() => servicos.value.filter(servicoPreenchido).length);

function ensureExportavel(): boolean {
  validacaoAtiva.value = true;

  const cabecalhoErrors = validateCusteioCabecalho(cabecalho.value);
  if (cabecalhoErrors.length > 0) {
    $q.notify({ type: 'negative', icon: 'warning', message: cabecalhoErrors[0], timeout: 5000 });
    return false;
  }

  if (preenchidosCount.value === 0) {
    $q.notify({
      type: 'negative',
      icon: 'edit',
      message: 'Preencha ao menos 1 atividade antes de exportar.',
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
    message: 'Deseja apagar o cabeçalho e os serviços preenchidos?',
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

.servico-card__body {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px;
}

.col-grow {
  flex: 1;
  min-width: 0;
}

.servico-card__qtd {
  width: 130px;
  flex-shrink: 0;
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
