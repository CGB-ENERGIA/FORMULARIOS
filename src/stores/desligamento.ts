import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { DistritalCode } from 'src/utils/historico-file';

export type ProtocolarOpcao = 'SIM' | 'NAO' | '';

export interface DesligamentoObra {
  nota: string;
  contrato: string;
  pep: string;
  fornecedor: string;
  descricaoObra: string;
  cidade: string;
  data: string;
  siMes: string;
  protocolar: ProtocolarOpcao;
}

export interface DesligamentoSI {
  inicioDesligamento: string;
  fimDesligamento: string;
  numeroOperacional: string;
  numeroBarramento: string;
  valorUnitarioSemProtocolo: string;
  valorUnitarioComProtocolo: string;
}

export interface DesligamentoConsumidor {
  id: number;
  contaContrato: string;
  numeroMedidor: string;
  nomeCompleto: string;
  protocolar: ProtocolarOpcao;
}

function createEmptyConsumidor(id: number): DesligamentoConsumidor {
  return {
    id,
    contaContrato: '',
    numeroMedidor: '',
    nomeCompleto: '',
    protocolar: '',
  };
}

export const useDesligamentoStore = defineStore('desligamento', () => {
  const obra = ref<DesligamentoObra>({
    nota: '',
    contrato: '4600026661',
    pep: '',
    fornecedor: 'CGB ENERGIA',
    descricaoObra: '',
    cidade: '',
    data: '',
    siMes: '',
    protocolar: '',
  });

  const solicitacao = ref<DesligamentoSI>({
    inicioDesligamento: '',
    fimDesligamento: '',
    numeroOperacional: '',
    numeroBarramento: '',
    valorUnitarioSemProtocolo: '7,04',
    valorUnitarioComProtocolo: '8,24',
  });

  const consumidores = ref<DesligamentoConsumidor[]>(
    Array.from({ length: 20 }, (_, i) => createEmptyConsumidor(i + 1)),
  );

  // 8 slots de evidência (base64 data-URL ou null)
  const evidencias = ref<(string | null)[]>(Array(8).fill(null));

  // Distrital selecionada
  const distrital = ref<DistritalCode | ''>('');

  function addConsumidor() {
    consumidores.value.push(createEmptyConsumidor(consumidores.value.length + 1));
  }

  function removeConsumidor(index: number) {
    if (consumidores.value.length <= 1) return;
    consumidores.value.splice(index, 1);
    consumidores.value.forEach((consumidor, index) => {
      consumidor.id = index + 1;
    });
  }

  function resetForm(keepDistrital = true) {
    if (!keepDistrital) distrital.value = '';
    obra.value = {
      nota: '',
      contrato: '4600026661',
      pep: '',
      fornecedor: 'CGB ENERGIA',
      descricaoObra: '',
      cidade: '',
      data: '',
      siMes: '',
      protocolar: '',
    };
    solicitacao.value = {
      inicioDesligamento: '',
      fimDesligamento: '',
      numeroOperacional: '',
      numeroBarramento: '',
      valorUnitarioSemProtocolo: '7,04',
      valorUnitarioComProtocolo: '8,24',
    };
    consumidores.value = Array.from({ length: 20 }, (_, i) => createEmptyConsumidor(i + 1));
    evidencias.value = Array(8).fill(null);
  }

  return {
    obra,
    solicitacao,
    consumidores,
    evidencias,
    distrital,
    addConsumidor,
    removeConsumidor,
    resetForm,
  };
});
