import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

export interface SupressaoForm {
  responsavel: string;
  municipio: string;
  notaProjeto: string;
  data: string;
  // Seção 1 — Ponto de Derivação
  latDerivacao: string;
  lngDerivacao: string;
  fotosDerivacao: string[];
  // Seção 2 — Percurso 1
  latPercurso1: string;
  lngPercurso1: string;
  fotosPercurso1: string[];
  // Seção 3 — Percurso 2
  latPercurso2: string;
  lngPercurso2: string;
  fotosPercurso2: string[];
  // Seção 4 — Ponto Final
  latFinal: string;
  lngFinal: string;
  fotosFinal: string[];
}

export type SupressaoTipo = 'sem' | 'com';

export interface SupressaoMaxFotos {
  derivacao: number;
  percurso1: number;
  percurso2: number;
  final: number;
}

/** Limites de fotos por seção — replicam os relatórios oficiais Equatorial Energia. */
export const SUPRESSAO_MAX_FOTOS: Record<SupressaoTipo, SupressaoMaxFotos> = {
  sem: { derivacao: 4, percurso1: 6, percurso2: 6, final: 4 },
  com: { derivacao: 4, percurso1: 9, percurso2: 9, final: 9 },
};

const STORAGE_KEY_SEM = 'formularios-web:supressao:sem';
const STORAGE_KEY_COM = 'formularios-web:supressao:com';

function createDefaultForm(max: SupressaoMaxFotos): SupressaoForm {
  return {
    responsavel: '',
    municipio: '',
    notaProjeto: '',
    data: '',
    latDerivacao: '',
    lngDerivacao: '',
    fotosDerivacao: Array(max.derivacao).fill(''),
    latPercurso1: '',
    lngPercurso1: '',
    fotosPercurso1: Array(max.percurso1).fill(''),
    latPercurso2: '',
    lngPercurso2: '',
    fotosPercurso2: Array(max.percurso2).fill(''),
    latFinal: '',
    lngFinal: '',
    fotosFinal: Array(max.final).fill(''),
  };
}

function normalizeFotos(value: unknown, size: number): string[] {
  const arr = Array.isArray(value) ? (value as string[]) : [];
  const result = arr.slice(0, size);
  while (result.length < size) result.push('');
  return result;
}

function loadState(key: string, max: SupressaoMaxFotos): SupressaoForm {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return createDefaultForm(max);
    const parsed = JSON.parse(raw) as Partial<SupressaoForm>;
    const def = createDefaultForm(max);
    return {
      ...def,
      ...parsed,
      fotosDerivacao: normalizeFotos(parsed.fotosDerivacao, max.derivacao),
      fotosPercurso1: normalizeFotos(parsed.fotosPercurso1, max.percurso1),
      fotosPercurso2: normalizeFotos(parsed.fotosPercurso2, max.percurso2),
      fotosFinal: normalizeFotos(parsed.fotosFinal, max.final),
    };
  } catch {
    return createDefaultForm(max);
  }
}

function makeStore(id: string, storageKey: string, max: SupressaoMaxFotos) {
  return defineStore(id, () => {
    const form = ref<SupressaoForm>(loadState(storageKey, max));

    watch(
      form,
      (v) => {
        try { localStorage.setItem(storageKey, JSON.stringify(v)); } catch { /* quota */ }
      },
      { deep: true },
    );

    function resetForm() {
      form.value = createDefaultForm(max);
      localStorage.removeItem(storageKey);
    }

    return { form, resetForm };
  });
}

export const useSupressaoSemStore = makeStore('supressao-sem', STORAGE_KEY_SEM, SUPRESSAO_MAX_FOTOS.sem);
export const useSupressaoComStore = makeStore('supressao-com', STORAGE_KEY_COM, SUPRESSAO_MAX_FOTOS.com);
