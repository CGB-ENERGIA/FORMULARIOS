import { defineStore } from 'pinia';
import { ref, watch } from 'vue';
import { getProtectedDefault } from '../utils/protected-defaults';

export interface ArrastoObra {
  pep: string;
  nota: string;
  distrital: string;
  reserva: string;
  descricaoObra: string;
  cidade: string;
}

export const PRECO_UNITARIO_PADRAO = 3035.64;

const STORAGE_KEY = 'formularios-web:arrasto';

interface ArrastoPersistedState {
  obra: ArrastoObra;
  arrastoEmM: number | null;
  precoUnitario: number;
  quantidades: Record<number, number>;
  evidencias: (string | null)[];
}

function createDefaultObra(): ArrastoObra {
  return {
    pep: '',
    nota: '',
    distrital: '',
    reserva: '',
    descricaoObra: '',
    cidade: '',
  };
}

function loadPersistedState(): ArrastoPersistedState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<ArrastoPersistedState>;
    if (!parsed || typeof parsed !== 'object') return null;

    return {
      obra: { ...createDefaultObra(), ...parsed.obra },
      arrastoEmM:
        typeof parsed.arrastoEmM === 'number' && !Number.isNaN(parsed.arrastoEmM)
          ? parsed.arrastoEmM
          : null,
      precoUnitario:
        typeof parsed.precoUnitario === 'number' && !Number.isNaN(parsed.precoUnitario)
          ? parsed.precoUnitario
          : getProtectedDefault('arrasto', 'precoUnitario', PRECO_UNITARIO_PADRAO),
      quantidades: parsed.quantidades ?? {},
      evidencias: Array.isArray(parsed.evidencias)
        ? Array.from({ length: 8 }, (_, index) => parsed.evidencias?.[index] ?? null)
        : Array(8).fill(null),
    };
  } catch {
    return null;
  }
}

function savePersistedState(state: ArrastoPersistedState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignora falhas de quota do navegador.
  }
}

function clearPersistedState() {
  localStorage.removeItem(STORAGE_KEY);
}

export const useArrastoStore = defineStore('arrasto', () => {
  const persisted = loadPersistedState();

  const obra = ref<ArrastoObra>(persisted?.obra ?? createDefaultObra());
  const arrastoEmM = ref<number | null>(persisted?.arrastoEmM ?? null);
  const precoUnitario = ref(
    persisted?.precoUnitario ?? getProtectedDefault('arrasto', 'precoUnitario', PRECO_UNITARIO_PADRAO),
  );
  const quantidades = ref<Record<number, number>>(persisted?.quantidades ?? {});
  const evidencias = ref<(string | null)[]>(persisted?.evidencias ?? Array(8).fill(null));

  watch(
    [obra, arrastoEmM, precoUnitario, quantidades, evidencias],
    () => {
      savePersistedState({
        obra: obra.value,
        arrastoEmM: arrastoEmM.value,
        precoUnitario: precoUnitario.value,
        quantidades: quantidades.value,
        evidencias: evidencias.value,
      });
    },
    { deep: true },
  );

  function setQuantidade(materialId: number, quantidade: number | null) {
    if (quantidade === null || quantidade <= 0 || Number.isNaN(quantidade)) {
      const next = { ...quantidades.value };
      delete next[materialId];
      quantidades.value = next;
      return;
    }
    quantidades.value = { ...quantidades.value, [materialId]: quantidade };
  }

  function resetForm() {
    obra.value = createDefaultObra();
    arrastoEmM.value = null;
    precoUnitario.value = getProtectedDefault('arrasto', 'precoUnitario', PRECO_UNITARIO_PADRAO);
    quantidades.value = {};
    evidencias.value = Array(8).fill(null);
    clearPersistedState();
  }

  return {
    obra,
    arrastoEmM,
    precoUnitario,
    quantidades,
    evidencias,
    setQuantidade,
    resetForm,
  };
});
