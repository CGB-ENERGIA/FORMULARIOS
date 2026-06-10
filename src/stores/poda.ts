import { defineStore } from 'pinia';
import { ref } from 'vue';

export const REGIONAIS = ['NORTE', 'NOROESTE', 'LESTE', 'SUL', 'CENTRO'] as const;
export const CONTRATOS = ['4600024693', '4600025394', '4600024692', '4600018167'] as const;
export const FORNECEDORES = ['CGB ENERGIA LTDA', 'D P L CONSTRUCOES LTDA'] as const;
export const DISTRIBUIDORAS = ['EQTL PA', 'EQTL PI', 'EQTL MA', 'EQTL AL', 'EQTL RS', 'EQTL AP', 'EQTL GO'] as const;
export const EQUIPES = ['Linha Viva RD', 'Linha Morta', 'Equipe Poda'] as const;
export const PERIODOS_MEDICAO = [
  '01.12.2024 - 31.12.2024',
  '01.01.2025 - 31.01.2025',
  '01.02.2025 - 28.02.2025',
  '01.03.2025 - 31.03.2025',
  '01.04.2025 - 30.04.2025',
  '01.05.2025 - 31.05.2025',
  '01.06.2025 - 30.06.2025',
  '01.07.2025 - 31.07.2025',
  '01.08.2025 - 31.08.2025',
  '01.09.2025 - 30.09.2025',
  '01.10.2025 - 31.10.2025',
  '01.11.2025 - 30.11.2025',
  '01.12.2025 - 31.12.2025',
] as const;

export interface PodaObra {
  regional: string;
  contrato: string;
  fornecedor: string;
  distribuidora: string;
  periodoMedicao: string;
  equipe: string;
  elementoPep: string;
}

export interface PodaServico {
  id: number;
  data: string;
  referencia: string;
  fotoInicio: string; // base64 data URL ou ''
  fotoFim: string;    // base64 data URL ou ''
}

function createEmptyServico(id: number): PodaServico {
  return { id, data: '', referencia: '', fotoInicio: '', fotoFim: '' };
}

export function servicoPreenchido(s: PodaServico): boolean {
  return !!(s.data || s.referencia || s.fotoInicio || s.fotoFim);
}

export const usePodaStore = defineStore('poda', () => {
  const obra = ref<PodaObra>({
    regional: '',
    contrato: '',
    fornecedor: 'CGB ENERGIA LTDA',
    distribuidora: '',
    periodoMedicao: '',
    equipe: '',
    elementoPep: '',
  });

  const servicos = ref<PodaServico[]>(
    Array.from({ length: 5 }, (_, i) => createEmptyServico(i + 1)),
  );

  function addServico() {
    servicos.value.push(createEmptyServico(servicos.value.length + 1));
  }

  function removeServico(index: number) {
    if (servicos.value.length <= 1) return;
    servicos.value.splice(index, 1);
    servicos.value.forEach((s, i) => { s.id = i + 1; });
  }

  function resetForm() {
    obra.value = {
      regional: '',
      contrato: '',
      fornecedor: 'CGB ENERGIA LTDA',
      distribuidora: '',
      periodoMedicao: '',
      equipe: '',
      elementoPep: '',
    };
    servicos.value = Array.from({ length: 5 }, (_, i) => createEmptyServico(i + 1));
  }

  return { obra, servicos, addServico, removeServico, resetForm };
});
