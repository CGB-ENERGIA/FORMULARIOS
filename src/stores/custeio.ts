import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

export interface CusteioCabecalho {
  base: string;
  municipio: string;
  tipoOrdem: 'ordem' | 'incidente';
  ordemNumero: string;
  componenteOuPg: string;
  prefixoEquipe: string;
  dataExecucao: string;
  observacao: string;
}

export interface CusteioServico {
  id: number;
  atividade: string;
  quantidade: string;
  fotoInicio: string;
  fotoFim: string;
}

const STORAGE_KEY = 'formularios-web:custeio';

interface CusteioPersistedState {
  cabecalho: CusteioCabecalho;
  servicos: CusteioServico[];
}

function createDefaultCabecalho(): CusteioCabecalho {
  return {
    base: '',
    municipio: '',
    tipoOrdem: 'ordem',
    ordemNumero: '',
    componenteOuPg: '',
    prefixoEquipe: '',
    dataExecucao: '',
    observacao: '',
  };
}

function createEmptyServico(id: number): CusteioServico {
  return { id, atividade: '', quantidade: '', fotoInicio: '', fotoFim: '' };
}

export function servicoPreenchido(s: CusteioServico): boolean {
  return !!(s.atividade.trim() || s.quantidade.trim() || s.fotoInicio || s.fotoFim);
}

function migrateLegacyState(parsed: Record<string, unknown>): CusteioPersistedState | null {
  const evidencias = parsed.evidencias;
  if (!Array.isArray(evidencias)) return null;

  const obra = parsed.obra as Record<string, string> | undefined;
  const servicos = evidencias.map((_item, i) => createEmptyServico(i + 1));

  return {
    cabecalho: {
      ...createDefaultCabecalho(),
      municipio: obra?.municipio ?? '',
      componenteOuPg: (evidencias[0] as Record<string, string> | undefined)?.pg ?? '',
    },
    servicos: servicos.length > 0
      ? servicos
      : Array.from({ length: 5 }, (_, i) => createEmptyServico(i + 1)),
  };
}

function loadPersistedState(): CusteioPersistedState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CusteioPersistedState> & { evidencias?: unknown[] };
    if (!parsed || typeof parsed !== 'object') return null;

    if (Array.isArray(parsed.evidencias)) {
      return migrateLegacyState(parsed as Record<string, unknown>);
    }

    const servicos = Array.isArray(parsed.servicos) && parsed.servicos.length > 0
      ? parsed.servicos.map((s, i) => ({
          id: i + 1,
          atividade: s?.atividade ?? '',
          quantidade: s?.quantidade ?? '',
          fotoInicio: s?.fotoInicio ?? '',
          fotoFim: s?.fotoFim ?? '',
        }))
      : Array.from({ length: 5 }, (_, i) => createEmptyServico(i + 1));

    return {
      cabecalho: { ...createDefaultCabecalho(), ...parsed.cabecalho },
      servicos,
    };
  } catch {
    return null;
  }
}

function savePersistedState(state: CusteioPersistedState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignora falhas de quota do navegador.
  }
}

function clearPersistedState() {
  localStorage.removeItem(STORAGE_KEY);
}

export const useCusteioStore = defineStore('custeio', () => {
  const persisted = loadPersistedState();

  const cabecalho = ref<CusteioCabecalho>(persisted?.cabecalho ?? createDefaultCabecalho());
  const servicos = ref<CusteioServico[]>(
    persisted?.servicos ?? Array.from({ length: 5 }, (_, i) => createEmptyServico(i + 1)),
  );

  watch(
    [cabecalho, servicos],
    () => savePersistedState({ cabecalho: cabecalho.value, servicos: servicos.value }),
    { deep: true },
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
    cabecalho.value = createDefaultCabecalho();
    servicos.value = Array.from({ length: 5 }, (_, i) => createEmptyServico(i + 1));
    clearPersistedState();
  }

  return { cabecalho, servicos, addServico, removeServico, resetForm };
});
