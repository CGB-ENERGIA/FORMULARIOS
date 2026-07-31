const STORAGE_KEY = 'formularios-web:protected-defaults';

export type ProtectedDefaultSection = 'calcada' | 'arrasto' | 'desligamento';

interface ProtectedDefaultsStore {
  calcada?: { valorSap?: number };
  arrasto?: { precoUnitario?: number };
  desligamento?: {
    valorUnitarioSemProtocolo?: string;
    valorUnitarioComProtocolo?: string;
  };
}

function readStore(): ProtectedDefaultsStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as ProtectedDefaultsStore;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeStore(store: ProtectedDefaultsStore) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // Ignora falhas de quota do navegador.
  }
}

export function getProtectedDefault(
  section: 'calcada',
  field: 'valorSap',
  fallback: number,
): number;
export function getProtectedDefault(
  section: 'arrasto',
  field: 'precoUnitario',
  fallback: number,
): number;
export function getProtectedDefault(
  section: 'desligamento',
  field: 'valorUnitarioSemProtocolo' | 'valorUnitarioComProtocolo',
  fallback: string,
): string;
export function getProtectedDefault(
  section: ProtectedDefaultSection,
  field: string,
  fallback: number | string,
): number | string {
  const value = readStore()[section]?.[field as keyof ProtectedDefaultsStore[typeof section]];
  if (value === undefined || value === null || value === '') return fallback;
  return value as number | string;
}

export function setProtectedDefault(
  section: 'calcada',
  field: 'valorSap',
  value: number,
): void;
export function setProtectedDefault(
  section: 'arrasto',
  field: 'precoUnitario',
  value: number,
): void;
export function setProtectedDefault(
  section: 'desligamento',
  field: 'valorUnitarioSemProtocolo' | 'valorUnitarioComProtocolo',
  value: string,
): void;
export function setProtectedDefault(
  section: ProtectedDefaultSection,
  field: string,
  value: number | string,
): void {
  const store = readStore();
  store[section] = { ...store[section], [field]: value };
  writeStore(store);
}
