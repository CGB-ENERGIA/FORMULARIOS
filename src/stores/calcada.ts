import { defineStore } from 'pinia';
import { ref, watch } from 'vue';
import { getProtectedDefault } from '../utils/protected-defaults';

export interface CalcadaObra {
  pep: string;
  nota: string;
  distrital: string;
  descricaoObra: string;
  municipio: string;
  quantidade: number | null; // m² de calçada para reparar
  valorSap: number | null;   // preço unitário (R$)
}

export interface CalcadaEvidencia {
  id: number;
  pg: string;          // nº da página / nota da evidência
  fotoAntes: string;   // base64 data URL ou ''
  fotoDepois: string;  // base64 data URL ou ''
}

/** Valor SAP padrão observado no modelo (R$ por m²). */
export const VALOR_SAP_PADRAO = 539.68;

const STORAGE_KEY = 'formularios-web:calcada';

interface CalcadaPersistedState {
  obra: CalcadaObra;
  evidencias: CalcadaEvidencia[];
}

function createDefaultObra(): CalcadaObra {
  return {
    pep: '',
    nota: '',
    distrital: '',
    descricaoObra: '',
    municipio: '',
    quantidade: null,
    valorSap: getProtectedDefault('calcada', 'valorSap', VALOR_SAP_PADRAO),
  };
}

function createEmptyEvidencia(id: number): CalcadaEvidencia {
  return { id, pg: '', fotoAntes: '', fotoDepois: '' };
}

export function evidenciaPreenchida(e: CalcadaEvidencia): boolean {
  return !!(e.pg || e.fotoAntes || e.fotoDepois);
}

function loadPersistedState(): CalcadaPersistedState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CalcadaPersistedState>;
    if (!parsed || typeof parsed !== 'object') return null;

    const evidencias = Array.isArray(parsed.evidencias) && parsed.evidencias.length > 0
      ? parsed.evidencias.map((e, i) => ({
          id: i + 1,
          pg: e?.pg ?? '',
          fotoAntes: e?.fotoAntes ?? '',
          fotoDepois: e?.fotoDepois ?? '',
        }))
      : Array.from({ length: 3 }, (_, i) => createEmptyEvidencia(i + 1));

    return {
      obra: { ...createDefaultObra(), ...parsed.obra },
      evidencias,
    };
  } catch {
    return null;
  }
}

function savePersistedState(state: CalcadaPersistedState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignora falhas de quota do navegador.
  }
}

function clearPersistedState() {
  localStorage.removeItem(STORAGE_KEY);
}

export const useCalcadaStore = defineStore('calcada', () => {
  const persisted = loadPersistedState();

  const obra = ref<CalcadaObra>(persisted?.obra ?? createDefaultObra());
  const evidencias = ref<CalcadaEvidencia[]>(
    persisted?.evidencias ?? Array.from({ length: 3 }, (_, i) => createEmptyEvidencia(i + 1)),
  );

  watch(
    [obra, evidencias],
    () => savePersistedState({ obra: obra.value, evidencias: evidencias.value }),
    { deep: true },
  );

  function addEvidencia() {
    evidencias.value.push(createEmptyEvidencia(evidencias.value.length + 1));
  }

  function removeEvidencia(index: number) {
    if (evidencias.value.length <= 1) return;
    evidencias.value.splice(index, 1);
    evidencias.value.forEach((e, i) => { e.id = i + 1; });
  }

  function resetForm() {
    obra.value = createDefaultObra();
    evidencias.value = Array.from({ length: 3 }, (_, i) => createEmptyEvidencia(i + 1));
    clearPersistedState();
  }

  return { obra, evidencias, addEvidencia, removeEvidencia, resetForm };
});
