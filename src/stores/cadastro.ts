import { defineStore } from 'pinia';
import { computed, ref, watch } from 'vue';

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

interface CadastroPersistedState {
  clientes: CadastroForm[];
  ativo: number;
  /** null = ainda não respondeu; true = SIM; false = NÃO */
  possuiTransformador: boolean | null;
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

/** Duplica o formulário atual limpando os campos específicos do novo cliente. */
export function createClienteFromBase(base: CadastroForm): CadastroForm {
  return {
    cc: '',
    pep: base.pep,
    nome: '',
    endereco: base.endereco,
    padrao: '',
    numComp: base.numComp,
    numPoste: '',
    medInst: '',
    medAnt: base.medAnt,
    ligadaFase: base.ligadaFase,
    pot: base.pot,
    numEquatorial: base.numEquatorial,
    fabricante: base.fabricante,
    dataFabr: base.dataFabr,
    numSerie: base.numSerie,
    nomeResponsavel: base.nomeResponsavel,
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

function normalizeForm(raw: Partial<CadastroForm> | null | undefined): CadastroForm {
  return {
    ...createDefaultCadastroForm(),
    ...raw,
    ligadaFase: normalizeLigadaFase(raw?.ligadaFase),
    empresa: raw?.empresa?.trim() || 'CGB ENERGIA',
  };
}

function loadPersistedState(): CadastroPersistedState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CadastroPersistedState> & Partial<CadastroForm>;
    if (!parsed || typeof parsed !== 'object') return null;

    // Migração do formato antigo (formulário único).
    if (!Array.isArray(parsed.clientes)) {
      const legacy = normalizeForm(parsed as Partial<CadastroForm>);
      return { clientes: [legacy], ativo: 0, possuiTransformador: null };
    }

    const clientes = parsed.clientes.map((item) => normalizeForm(item));
    if (clientes.length === 0) clientes.push(createDefaultCadastroForm());

    const ativo = Math.min(
      Math.max(Number(parsed.ativo) || 0, 0),
      clientes.length - 1,
    );

    return {
      clientes,
      ativo,
      possuiTransformador:
        typeof parsed.possuiTransformador === 'boolean' ? parsed.possuiTransformador : null,
    };
  } catch {
    return null;
  }
}

function savePersistedState(state: CadastroPersistedState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignora falhas de quota.
  }
}

function clearPersistedState() {
  localStorage.removeItem(STORAGE_KEY);
}

export const useCadastroStore = defineStore('cadastro', () => {
  const persisted = loadPersistedState();
  const clientes = ref<CadastroForm[]>(persisted?.clientes ?? [createDefaultCadastroForm()]);
  const ativo = ref(persisted?.ativo ?? 0);
  const possuiTransformador = ref<boolean | null>(persisted?.possuiTransformador ?? null);

  const form = computed({
    get: () => clientes.value[ativo.value] ?? clientes.value[0]!,
    set: (value: CadastroForm) => {
      clientes.value[ativo.value] = value;
    },
  });

  watch(
    [clientes, ativo, possuiTransformador],
    () =>
      savePersistedState({
        clientes: clientes.value,
        ativo: ativo.value,
        possuiTransformador: possuiTransformador.value,
      }),
    { deep: true },
  );

  function selectCliente(index: number) {
    if (index < 0 || index >= clientes.value.length) return;
    ativo.value = index;
  }

  function addCliente() {
    const base = clientes.value[ativo.value] ?? createDefaultCadastroForm();
    clientes.value.push(createClienteFromBase(base));
    ativo.value = clientes.value.length - 1;
  }

  function removeCliente(index: number) {
    if (clientes.value.length <= 1) return;
    clientes.value.splice(index, 1);
    if (ativo.value >= clientes.value.length) {
      ativo.value = clientes.value.length - 1;
    } else if (ativo.value > index) {
      ativo.value -= 1;
    }
  }

  function setPossuiTransformador(value: boolean) {
    possuiTransformador.value = value;
    if (!value) {
      clientes.value = clientes.value.map((cliente) => ({
        ...cliente,
        pot: '',
        numEquatorial: '',
        fabricante: '',
        dataFabr: '',
        numSerie: '',
      }));
    }
  }

  function resetForm() {
    clientes.value = [createDefaultCadastroForm()];
    ativo.value = 0;
    possuiTransformador.value = null;
    clearPersistedState();
  }

  function syncNomeResponsavel(value: string) {
    clientes.value.forEach((c) => {
      c.nomeResponsavel = value;
    });
  }

  function replaceClientes(next: CadastroForm[]) {
    const list = next.length > 0 ? next.map((item) => normalizeForm(item)) : [createDefaultCadastroForm()];
    clientes.value = list;
    ativo.value = 0;
  }

  return {
    clientes,
    ativo,
    form,
    possuiTransformador,
    selectCliente,
    addCliente,
    removeCliente,
    resetForm,
    replaceClientes,
    setPossuiTransformador,
    syncNomeResponsavel,
  };
});
