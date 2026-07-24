import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

export type PadraoEntrada = '' | 'existente' | '5m' | '7m';

export type LigadaFase = '' | 'A' | 'AB' | 'ABC';

export interface CadastroForm {
  cc: string;
  pep: string;
  nome: string;
  endereco: string;
  padrao: PadraoEntrada;
  numComp: string;
  numPoste: string;
  medInst: string;
  medAnt: string;
  ligadaFase: LigadaFase;
  pot: string;
  numEquatorial: string;
  fabricante: string;
  dataFabr: string;
  numSerie: string;
  nomeResponsavel: string;
  dataExecucao: string;
  horaExecucao: string;
  empresa: string;
}

const STORAGE_KEY = 'formularios-web:cadastro';

export function createDefaultCadastroForm(): CadastroForm {
  return {
    cc: '',
    pep: '',
    nome: '',
    endereco: '',
    padrao: '',
    numComp: '',
    numPoste: '',
    medInst: '',
    medAnt: '',
    ligadaFase: '',
    pot: '',
    numEquatorial: '',
    fabricante: '',
    dataFabr: '',
    numSerie: '',
    nomeResponsavel: '',
    dataExecucao: '',
    horaExecucao: '',
    empresa: 'CGB ENERGIA',
  };
}

function normalizeLigadaFase(value: unknown): LigadaFase {
  if (value === 'A' || value === 'AB' || value === 'ABC') return value;
  if (value === 'B' || value === 'C') return 'A';
  return '';
}

function loadPersistedState(): CadastroForm | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CadastroForm>;
    if (!parsed || typeof parsed !== 'object') return null;
    return {
      ...createDefaultCadastroForm(),
      ...parsed,
      ligadaFase: normalizeLigadaFase(parsed.ligadaFase),
    };
  } catch {
    return null;
  }
}

function savePersistedState(form: CadastroForm) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
  } catch {
    // Ignora falhas de quota.
  }
}

function clearPersistedState() {
  localStorage.removeItem(STORAGE_KEY);
}

export const useCadastroStore = defineStore('cadastro', () => {
  const form = ref<CadastroForm>(loadPersistedState() ?? createDefaultCadastroForm());

  watch(form, () => savePersistedState(form.value), { deep: true });

  function resetForm() {
    form.value = createDefaultCadastroForm();
    clearPersistedState();
  }

  return { form, resetForm };
});
