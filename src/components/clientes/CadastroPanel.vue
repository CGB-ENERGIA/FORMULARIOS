<template>
  <div class="page-shell clientes-panel">
    <div class="page-shell__inner">
      <q-banner
        v-if="possuiTransformador === null"
        class="bg-warning text-dark q-mb-md"
        rounded
        dense
      >
        Use <strong>CONTINUAR</strong> em Consumidores para informar se há transformador.
      </q-banner>

      <div class="action-bar action-bar--top q-mb-md">
        <div class="action-bar__actions action-bar__actions--end">
          <q-btn
            outline
            color="primary"
            icon="person_add"
            label="Adicionar cliente"
            no-caps
            @click="handleAddCliente"
          />
          <q-btn outline color="negative" icon="restart_alt" label="LIMPAR" no-caps @click="handleReset" />
          <q-btn
            outline
            color="positive"
            icon="table_view"
            label="Cadastro (Excel)"
            no-caps
            :disable="possuiTransformador === null"
            @click="handleExportCadastroExcel"
          />
          <q-btn
            unelevated
            icon="download"
            label="Exportar"
            class="action-btn--excel"
            no-caps
            :disable="possuiTransformador === null"
            @click="handleExport"
          />
        </div>
      </div>

      <div class="cliente-tabs q-mb-md">
        <q-btn
          v-for="(cliente, index) in clientes"
          :key="`cliente-tab-${index}`"
          :outline="ativo !== index"
          :unelevated="ativo === index"
          color="primary"
          no-caps
          dense
          class="cliente-tabs__btn"
          @click="selectCliente(index)"
        >
          <span class="cliente-tabs__label">{{ clienteTabLabel(cliente, index) }}</span>
          <q-icon
            v-if="clientes.length > 1"
            name="close"
            size="16px"
            class="q-ml-xs"
            @click.stop="handleRemoveCliente(index)"
          />
        </q-btn>
      </div>

      <q-card flat class="premium-card q-mb-md">
        <div class="premium-card__header">
          <div class="premium-card__header-title">
            <div class="premium-card__header-icon"><q-icon name="badge" size="22px" /></div>
            Dados do cliente
            <span class="text-caption text-grey-7 q-ml-sm">
              {{ ativo + 1 }} / {{ clientes.length }}
            </span>
          </div>
        </div>
        <q-card-section class="premium-card__body">
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-4">
              <q-input v-model="form.cc" label="CC" outlined dense hide-bottom-space />
            </div>
            <div class="col-12 col-md-4">
              <q-input
                v-model="form.pep"
                label="PEP *"
                outlined
                dense
                hide-bottom-space
                :error="validacaoAtiva && !form.pep.trim()"
                error-message="Informe o PEP"
              />
            </div>
            <div class="col-12 col-md-4">
              <q-input
                v-model="form.nome"
                label="Nome *"
                outlined
                dense
                hide-bottom-space
                :error="validacaoAtiva && !form.nome.trim()"
                error-message="Informe o nome"
              />
            </div>
            <div class="col-12">
              <q-input
                v-model="form.endereco"
                label="Endereço *"
                outlined
                dense
                hide-bottom-space
                :error="validacaoAtiva && !form.endereco.trim()"
                error-message="Informe o endereço"
              />
            </div>
            <div class="col-12">
              <div class="text-caption text-grey-7 q-mb-xs">Padrão</div>
              <q-option-group
                v-model="form.padrao"
                :options="padraoOptions"
                type="radio"
                color="primary"
                dense
              />
            </div>
          </div>
        </q-card-section>
      </q-card>

      <q-card flat class="premium-card q-mb-md">
        <div class="premium-card__header">
          <div class="premium-card__header-title">
            <div class="premium-card__header-icon"><q-icon name="speed" size="22px" /></div>
            Medidor
          </div>
        </div>
        <q-card-section class="premium-card__body">
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-3">
              <q-input v-model="form.numComp" label="Nº Comp" outlined dense hide-bottom-space />
            </div>
            <div class="col-12 col-md-3">
              <q-input v-model="form.numPoste" label="Nº Poste" outlined dense hide-bottom-space />
            </div>
            <div class="col-12 col-md-3">
              <q-input
                :model-value="form.medInst"
                label="Med Inst"
                outlined
                dense
                hide-bottom-space
                inputmode="numeric"
                @update:model-value="form.medInst = sanitizeDigits($event)"
              />
            </div>
            <div class="col-12 col-md-3">
              <q-input
                :model-value="form.medAnt"
                label="Medidor vizinho"
                outlined
                dense
                hide-bottom-space
                inputmode="numeric"
                @update:model-value="form.medAnt = sanitizeDigits($event)"
              />
            </div>
            <div class="col-12">
              <div class="text-caption text-grey-7 q-mb-xs">Ligada Fase</div>
              <q-option-group
                v-model="form.ligadaFase"
                :options="faseOptions"
                type="radio"
                color="primary"
                dense
                inline
              />
            </div>
          </div>
        </q-card-section>
      </q-card>

      <q-card v-if="possuiTransformador === true" flat class="premium-card q-mb-md">
        <div class="premium-card__header">
          <div class="premium-card__header-title">
            <div class="premium-card__header-icon"><q-icon name="bolt" size="22px" /></div>
            Transformador
          </div>
        </div>
        <q-card-section class="premium-card__body">
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-4">
              <q-input
                v-model="form.pot"
                label="POT *"
                outlined
                dense
                hide-bottom-space
                :error="validacaoAtiva && !form.pot.trim()"
                error-message="Informe a POT"
              />
            </div>
            <div class="col-12 col-md-4">
              <q-input
                v-model="form.numEquatorial"
                label="N° Equatorial *"
                outlined
                dense
                hide-bottom-space
                :error="validacaoAtiva && !form.numEquatorial.trim()"
                error-message="Informe o N° Equatorial"
              />
            </div>
            <div class="col-12 col-md-4">
              <q-input
                v-model="form.fabricante"
                label="Fabricante *"
                outlined
                dense
                hide-bottom-space
                :error="validacaoAtiva && !form.fabricante.trim()"
                error-message="Informe o fabricante"
              />
            </div>
            <div class="col-12 col-md-4">
              <q-input
                v-model="form.dataFabr"
                label="Data fabricação"
                outlined
                dense
                mask="##/##/####"
                placeholder="DD/MM/AAAA"
                hide-bottom-space
              >
                <template #append>
                  <q-icon name="event" class="cursor-pointer">
                    <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                      <q-date v-model="form.dataFabr" mask="DD/MM/YYYY">
                        <div class="row items-center justify-end">
                          <q-btn v-close-popup label="Fechar" color="primary" flat no-caps />
                        </div>
                      </q-date>
                    </q-popup-proxy>
                  </q-icon>
                </template>
              </q-input>
            </div>
            <div class="col-12 col-md-4">
              <q-input
                v-model="form.numSerie"
                label="Nº série *"
                outlined
                dense
                hide-bottom-space
                :error="validacaoAtiva && !form.numSerie.trim()"
                error-message="Informe o nº série"
              />
            </div>
          </div>
        </q-card-section>
      </q-card>

      <q-card flat class="premium-card q-mb-lg">
        <div class="premium-card__header">
          <div class="premium-card__header-title">
            <div class="premium-card__header-icon"><q-icon name="draw" size="22px" /></div>
            Responsável / Execução
            <q-badge
              v-if="possuiTransformador === false"
              color="primary"
              outline
              class="q-ml-sm"
              label="Obra sem transformador"
            />
          </div>
        </div>
        <q-card-section class="premium-card__body">
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-6">
              <q-input
                v-model="form.nomeResponsavel"
                label="Nome do encarregado *"
                outlined
                dense
                hide-bottom-space
                :error="validacaoAtiva && !form.nomeResponsavel.trim()"
                error-message="Informe o encarregado"
              />
            </div>
            <div class="col-12 col-md-3">
              <q-input
                v-model="form.dataExecucao"
                label="Data *"
                outlined
                dense
                mask="##/##/####"
                placeholder="DD/MM/AAAA"
                hide-bottom-space
                :error="validacaoAtiva && !form.dataExecucao.trim()"
                error-message="Informe a data"
              >
                <template #append>
                  <q-icon name="event" class="cursor-pointer">
                    <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                      <q-date v-model="form.dataExecucao" mask="DD/MM/YYYY">
                        <div class="row items-center justify-end">
                          <q-btn v-close-popup label="Fechar" color="primary" flat no-caps />
                        </div>
                      </q-date>
                    </q-popup-proxy>
                  </q-icon>
                </template>
              </q-input>
            </div>
            <div class="col-12 col-md-3">
              <q-input
                v-model="form.horaExecucao"
                label="Hora"
                outlined
                dense
                mask="##:##"
                placeholder="HH:MM"
                hide-bottom-space
              />
            </div>
            <div class="col-12 col-md-6">
              <q-input
                :model-value="form.empresa || 'CGB ENERGIA'"
                label="Empresa"
                outlined
                dense
                readonly
                filled
                hide-bottom-space
              />
            </div>
          </div>
        </q-card-section>
      </q-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useQuasar } from 'quasar';
import { ref } from 'vue';
import { useCadastroStore } from 'src/stores/cadastro';
import { useConsumidoresStore } from 'src/stores/consumidores';
import {
  clienteTabLabel,
  FASE_OPTIONS,
  getCadastroSolicitacaoPdfErrors,
  PADRAO_OPTIONS,
} from 'src/utils/cadastro-helpers';
import { exportClientesPadrao, exportSomenteCadastroExcel } from 'src/utils/clientes-export';
import { sanitizeDigits, validateConsumidoresParaExportacao } from 'src/utils/consumidor-helpers';
import { validateObraParaExportacao } from 'src/utils/obra-helpers';
import { salvarRegistroClientes } from 'src/services/registros/save-clientes';
import type { DistritalCode } from 'src/utils/historico-file';

const $q = useQuasar();
const store = useCadastroStore();
const consumidoresStore = useConsumidoresStore();
const { form, clientes, ativo, possuiTransformador } = storeToRefs(store);
const { selectCliente, addCliente, removeCliente, resetForm } = store;

const validacaoAtiva = ref(false);

const padraoOptions = PADRAO_OPTIONS.map((opt) => ({
  label: opt.label,
  value: opt.value,
}));

const faseOptions = FASE_OPTIONS.map((opt) => ({
  label: opt.label,
  value: opt.value,
}));

function handleAddCliente() {
  addCliente();
  validacaoAtiva.value = false;
  $q.notify({
    type: 'positive',
    message: `Cliente ${clientes.value.length} adicionado. CC, Nome, Padrão, Nº Poste e Med Inst foram limpos.`,
  });
}

function handleRemoveCliente(index: number) {
  if (clientes.value.length <= 1) return;

  $q.dialog({
    title: 'Remover cliente',
    message: `Deseja remover ${clienteTabLabel(clientes.value[index]!, index)}?`,
    cancel: true,
    persistent: true,
  }).onOk(() => {
    removeCliente(index);
    validacaoAtiva.value = false;
    $q.notify({ type: 'info', message: 'Cliente removido.' });
  });
}

function handleReset() {
  $q.dialog({
    title: 'Limpar formulário',
    message: 'Deseja apagar todos os clientes e dados preenchidos?',
    cancel: true,
    persistent: true,
  }).onOk(() => {
    resetForm();
    validacaoAtiva.value = false;
    $q.notify({ type: 'info', message: 'Formulário limpo.' });
  });
}

async function handleExportCadastroExcel() {
  validacaoAtiva.value = true;

  const errors = getCadastroSolicitacaoPdfErrors(clientes.value, possuiTransformador.value);

  if (errors.length > 0) {
    $q.notify({
      type: 'negative',
      message: 'Não foi possível exportar. Corrija os campos:',
      caption: errors.slice(0, 4).join(' · '),
      multiLine: true,
      timeout: 8000,
    });
    return;
  }

  const dismiss = $q.notify({ type: 'ongoing', message: 'Gerando Cadastro (Excel)…', timeout: 0 });

  try {
    const { cadastroFileName } = await exportSomenteCadastroExcel(clientes.value);
    dismiss();
    $q.notify({ type: 'positive', message: 'Excel gerado com sucesso.', caption: cadastroFileName, timeout: 6000 });
  } catch (error) {
    dismiss();
    $q.notify({ type: 'negative', message: error instanceof Error ? error.message : 'Erro ao exportar.' });
  }
}

async function handleExport() {
  validacaoAtiva.value = true;

  const errors = [
    ...validateObraParaExportacao(consumidoresStore.obra),
    ...validateConsumidoresParaExportacao(consumidoresStore.consumidores),
    ...getCadastroSolicitacaoPdfErrors(clientes.value, possuiTransformador.value),
  ];

  if (errors.length > 0) {
    $q.notify({
      type: 'negative',
      message: 'Não foi possível exportar. Corrija os campos:',
      caption: errors.slice(0, 4).join(' · '),
      multiLine: true,
      timeout: 8000,
    });
    return;
  }

  const dismiss = $q.notify({
    type: 'ongoing',
    message: 'Gerando Consumidores (PDF) e Cadastro (Excel)…',
    timeout: 0,
  });

  try {
    const { consumidoresFileName, cadastroFileName, pdfBlob, excelBlob } =
      await exportClientesPadrao(
        consumidoresStore.obra,
        consumidoresStore.consumidores,
        clientes.value,
      );
    dismiss();
    $q.notify({
      type: 'positive',
      message: 'Arquivos gerados com sucesso.',
      caption: `${consumidoresFileName} · ${cadastroFileName}`,
      timeout: 6000,
    });

    if (consumidoresStore.distrital) {
      try {
        await salvarRegistroClientes({
          distrital: consumidoresStore.distrital as DistritalCode,
          obra: consumidoresStore.obra,
          consumidores: consumidoresStore.consumidores,
          arquivos: [
            { formato: 'pdf', nome_arquivo: consumidoresFileName, blob: pdfBlob },
            { formato: 'excel', nome_arquivo: cadastroFileName, blob: excelBlob },
          ],
        });
        $q.notify({
          type: 'info',
          icon: 'manage_search',
          message: 'Registro atualizado no Controle (mesmo PEP).',
          timeout: 2200,
        });
      } catch (error) {
        console.error('Erro ao salvar registro:', error);
      }
    }
  } catch (error) {
    dismiss();
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Erro ao exportar.',
    });
  }
}
</script>

<style scoped lang="scss">
.action-bar--top {
  margin-top: 0;
}

.action-bar__actions--end {
  width: 100%;
  justify-content: flex-end;
}

.cliente-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.cliente-tabs__btn {
  max-width: 100%;
}

.cliente-tabs__label {
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
