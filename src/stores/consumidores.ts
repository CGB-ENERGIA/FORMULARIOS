import { defineStore } from 'pinia';
import { ref } from 'vue';
import { consumidorComDados } from '../utils/consumidor-helpers';
import type { DistritalCode } from 'src/utils/historico-file';

export const FORNECEDOR_FIXO = 'CGB ENGENHARIA' as const;
export const REGIONAL_FIXA = 'CENTRO' as const;
export const TEC_OBRA_FIXO = 'ZOZIMO MENDES' as const;

export interface ObraInfo {
  descricaoObra: string;
  fornecedor: typeof FORNECEDOR_FIXO;
  elementoPep: string;
  dataConclusao: string;
  dataEnergizacao: string;
  tecObra: typeof TEC_OBRA_FIXO;
  regional: typeof REGIONAL_FIXA;
  localidade: string;
  municipio: string;
}

export type TipoLigacao = 'MO' | 'BI' | 'TRI' | '';
export type PadraoTipo = '5M' | '7M' | 'CPP' | 'PADRAO' | 'KIT' | '';
export type RamalOpcao = 'PADRAO' | 'KIT' | '';

export interface Consumidor {
  id: number;
  nome: string;
  numeroMedidor: string;
  tipoLigacao: TipoLigacao;
  padrao: PadraoTipo;
  ramalDuplex: RamalOpcao;
  ramalTriplex: RamalOpcao;
  posteLigacao: string;
  dataLigacao: string;
  /** Base64 data URL da foto do padrão (obrigatória na exportação). */
  fotoPadrao: string;
  /** Base64 data URL da foto do medidor (obrigatória na exportação). */
  fotoMedidor: string;
}

function createEmptyConsumidor(id: number): Consumidor {
  return {
    id,
    nome: '',
    numeroMedidor: '',
    tipoLigacao: '',
    padrao: '',
    ramalDuplex: '',
    ramalTriplex: '',
    posteLigacao: '',
    dataLigacao: '',
    fotoPadrao: '',
    fotoMedidor: '',
  };
}

export const useConsumidoresStore = defineStore('consumidores', () => {
  const obra = ref<ObraInfo>({
    descricaoObra: '',
    fornecedor: FORNECEDOR_FIXO,
    elementoPep: '',
    dataConclusao: '',
    dataEnergizacao: '',
    tecObra: TEC_OBRA_FIXO,
    regional: REGIONAL_FIXA,
    localidade: '',
    municipio: '',
  });

  const consumidores = ref<Consumidor[]>(
    Array.from({ length: 20 }, (_, i) => createEmptyConsumidor(i + 1)),
  );

  const distrital = ref<DistritalCode | ''>('');

  function syncDatas(data: string) {
    obra.value.dataConclusao = data;
    obra.value.dataEnergizacao = data;
    consumidores.value.forEach((consumidor) => {
      if (consumidorComDados(consumidor)) {
        consumidor.dataLigacao = data;
      }
    });
  }

  function touchConsumidor(consumidor: Consumidor) {
    const dataObra = obra.value.dataEnergizacao || obra.value.dataConclusao;
    if (consumidorComDados(consumidor) && dataObra) {
      consumidor.dataLigacao = dataObra;
      return;
    }
    consumidor.dataLigacao = '';
  }

  function addConsumidor() {
    consumidores.value.push(createEmptyConsumidor(consumidores.value.length + 1));
  }

  function removeConsumidor(index: number) {
    if (consumidores.value.length <= 1) return;
    consumidores.value.splice(index, 1);
    consumidores.value.forEach((c, i) => {
      c.id = i + 1;
    });
  }

  function resetForm() {
    obra.value = {
      descricaoObra: '',
      fornecedor: FORNECEDOR_FIXO,
      elementoPep: '',
      dataConclusao: '',
      dataEnergizacao: '',
      tecObra: TEC_OBRA_FIXO,
      regional: REGIONAL_FIXA,
      localidade: '',
      municipio: '',
    };
    consumidores.value = Array.from({ length: 20 }, (_, i) => createEmptyConsumidor(i + 1));
  }

  function replaceConsumidores(next: Consumidor[]) {
    if (next.length === 0) {
      consumidores.value = Array.from({ length: 20 }, (_, i) => createEmptyConsumidor(i + 1));
      return;
    }

    const padded = next.map((item, index) => ({
      ...createEmptyConsumidor(index + 1),
      ...item,
      id: index + 1,
    }));

    while (padded.length < 20) {
      padded.push(createEmptyConsumidor(padded.length + 1));
    }

    consumidores.value = padded;
  }

  return {
    obra,
    consumidores,
    distrital,
    addConsumidor,
    removeConsumidor,
    resetForm,
    syncDatas,
    touchConsumidor,
    replaceConsumidores,
  };
});
