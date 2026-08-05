import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

export interface PodaCabecalho {
  pep: string;
  nota: string;
  base: string;
  cidade: string;
  descricaoObra: string;
}

export interface PodaServico {
  id: number;
  fotoInicio: string;
  fotoFim: string;
}

const STORAGE_KEY = 'formularios-web:poda';

interface PodaPersistedState {
  cabecalho: PodaCabecalho;
  servicos: PodaServico[];
}

function createDefaultCabecalho(): PodaCabecalho {
  return {
    pep: '',
    nota: '',
    base: '',
    cidade: '',
    descricaoObra: '',
  };
}

function createEmptyServico(id: number): PodaServico {
  return { id, fotoInicio: '', fotoFim: '' };
}

export function servicoPreenchido(s: PodaServico): boolean {
  return !!(s.fotoInicio || s.fotoFim);
}

function loadPersistedState(): PodaPersistedState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PodaPersistedState>;
    if (!parsed || typeof parsed !== 'object') return null;

    const servicos = Array.isArray(parsed.servicos) && parsed.servicos.length > 0
      ? parsed.servicos.map((s, i) => ({
          id: i + 1,
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

function savePersistedState(state: PodaPersistedState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignora falhas de quota do navegador.
  }
}

function clearPersistedState() {
  localStorage.removeItem(STORAGE_KEY);
}

export const usePodaStore = defineStore('poda', () => {
  const persisted = loadPersistedState();

  const cabecalho = ref<PodaCabecalho>(persisted?.cabecalho ?? createDefaultCabecalho());
  const servicos = ref<PodaServico[]>(
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
