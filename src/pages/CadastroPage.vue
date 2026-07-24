<template>
  <q-page class="page-shell">
    <div class="page-shell__inner">
      <header class="page-header">
        <div class="page-header__eyebrow">
          <q-icon name="assignment_ind" size="14px" />
          Formulário operacional
        </div>
        <h1 class="page-header__title">Cadastro</h1>
        <p class="page-header__subtitle">
          Preencha os campos da solicitação de serviço e exporte no layout original.
          Cada cliente vira uma aba separada no Excel.
        </p>
      </header>

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
            unelevated
            icon="download"
            label="EXCEL"
            class="action-btn--excel"
            no-caps
            @click="handleExportExcel"
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
              <q-input v-model="form.medInst" label="Med Inst" outlined dense hide-bottom-space />
            </div>
            <div class="col-12 col-md-3">
              <q-input v-model="form.medAnt" label="Med Ant" outlined dense hide-bottom-space />
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

      <q-card flat class="premium-card q-mb-md">
        <div class="premium-card__header">
          <div class="premium-card__header-title">
            <div class="premium-card__header-icon"><q-icon name="bolt" size="22px" /></div>
            Transformador
          </div>
        </div>
        <q-card-section class="premium-card__body">
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-4">
              <q-input v-model="form.pot" label="POT" outlined dense hide-bottom-space />
            </div>
            <div class="col-12 col-md-4">
              <q-input v-model="form.numEquatorial" label="N° Equatorial" outlined dense hide-bottom-space />
            </div>
            <div class="col-12 col-md-4">
              <q-input v-model="form.fabricante" label="Fabricante" outlined dense hide-bottom-space />
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
              <q-input v-model="form.numSerie" label="Nº série" outlined dense hide-bottom-space />
            </div>
          </div>
        </q-card-section>
      </q-card>

      <q-card flat class="premium-card q-mb-lg">
        <div class="premium-card__header">
          <div class="premium-card__header-title">
            <div class="premium-card__header-icon"><q-icon name="draw" size="22px" /></div>
            Responsável / Execução
          </div>
        </div>
        <q-card-section class="premium-card__body">
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-6">
              <q-input v-model="form.nomeResponsavel" label="Nome do responsável" outlined dense hide-bottom-space />
            </div>
            <div class="col-12 col-md-3">
              <q-input
                v-model="form.dataExecucao"
                label="Data"
                outlined
                dense
                mask="##/##/####"
                placeholder="DD/MM/AAAA"
                hide-bottom-space
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
              <q-input v-model="form.empresa" label="Empresa" outlined dense hide-bottom-space />
            </div>
          </div>
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useQuasar } from 'quasar';
import { ref } from 'vue';
import { useCadastroStore } from 'src/stores/cadastro';
import { exportCadastroToExcel } from 'src/utils/cadastro-excel';
import {
  clienteTabLabel,
  FASE_OPTIONS,
  getCadastroClientesExportErrors,
  PADRAO_OPTIONS,
} from 'src/utils/cadastro-helpers';

const $q = useQuasar();
const store = useCadastroStore();
const { form, clientes, ativo } = storeToRefs(store);
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

async function handleExportExcel() {
  validacaoAtiva.value = true;
  const errors = getCadastroClientesExportErrors(clientes.value);
  if (errors.length > 0) {
    $q.notify({ type: 'negative', message: errors[0] });
    return;
  }

  const dismiss = $q.notify({ type: 'ongoing', message: 'Gerando Excel…', timeout: 0 });
  try {
    const fileName = await exportCadastroToExcel(clientes.value);
    dismiss();
    $q.notify({
      type: 'positive',
      message: `Arquivo ${fileName} exportado com ${clientes.value.length} aba(s).`,
    });
  } catch (error) {
    dismiss();
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Erro ao exportar o Excel.',
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
