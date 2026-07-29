import type { DistritalCode, HistoricoEntry } from 'src/utils/historico-file';
import {
  appendHistoricoEntry,
  deleteHistoricoEntry,
  exportHistoricoAsJson,
  loadHistoricoEntries,
  DISTRITAIS,
} from 'src/utils/historico-file';
import type { FormRegistro, RegistroConsumidor, RegistrosRepository } from './types';

/** Converte o formato legado (IndexedDB atual) para o modelo pronto ao Supabase. */
export function fromHistoricoEntry(entry: HistoricoEntry): FormRegistro {
  return {
    id: entry.id,
    created_at: entry.id,
    distrital: entry.distrital,
    formulario: 'clientes',
    relatorios: [],
    descricao_obra: entry.descricaoObra,
    elemento_pep: entry.elementoPep,
    data_conclusao: entry.dataConclusao,
    municipio: entry.municipio,
    localidade: entry.localidade,
    total_consumidores: entry.totalConsumidores,
    consumidores: entry.consumidores.map(
      (c): RegistroConsumidor => ({
        nome: c.nome,
        numero_medidor: c.numeroMedidor,
        tipo_ligacao: c.tipoLigacao,
        padrao: c.padrao,
        poste_ligacao: c.posteLigacao,
        data_ligacao: c.dataLigacao,
      }),
    ),
  };
}

export function toHistoricoEntry(registro: FormRegistro): HistoricoEntry {
  return {
    id: registro.id,
    distrital: registro.distrital,
    descricaoObra: registro.descricao_obra,
    elementoPep: registro.elemento_pep,
    dataConclusao: registro.data_conclusao,
    municipio: registro.municipio,
    localidade: registro.localidade,
    totalConsumidores: registro.total_consumidores,
    consumidores: registro.consumidores.map((c) => ({
      nome: c.nome,
      numeroMedidor: c.numero_medidor,
      tipoLigacao: c.tipo_ligacao,
      padrao: c.padrao,
      posteLigacao: c.poste_ligacao,
      dataLigacao: c.data_ligacao,
    })),
  };
}

/**
 * Repositório local (IndexedDB) — implementação atual.
 * Trocar por createSupabaseRegistrosRepository() quando VITE_SUPABASE_URL estiver configurado.
 */
export function createIndexedDbRegistrosRepository(): RegistrosRepository {
  return {
    async list(distrital) {
      if (distrital) {
        const entries = await loadHistoricoEntries(distrital);
        return entries.map(fromHistoricoEntry);
      }

      const all = await Promise.all(DISTRITAIS.map((d) => loadHistoricoEntries(d)));
      return all
        .flat()
        .map(fromHistoricoEntry)
        .sort((a, b) => b.created_at.localeCompare(a.created_at));
    },

    async save(registro) {
      const entry = toHistoricoEntry(registro);
      // Preserva relatórios no metadata do histórico via put direto se necessário.
      // Por enquanto serializamos no próprio fluxo IndexedDB legado + metadata localStorage bridge.
      await appendHistoricoEntry(entry);
      await persistRelatorios(registro);
    },

    async remove(distrital, id) {
      await deleteHistoricoEntry(distrital, id);
      await removeRelatorios(distrital, id);
    },

    async exportJson(distrital) {
      await exportHistoricoAsJson(distrital);
    },
  };
}

const RELATORIOS_KEY = 'formularios-web:registros-relatorios';

type RelatoriosMap = Record<string, FormRegistro['relatorios']>;

function relatorioKey(distrital: DistritalCode, id: string) {
  return `${distrital}::${id}`;
}

function readRelatoriosMap(): RelatoriosMap {
  try {
    const raw = localStorage.getItem(RELATORIOS_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as RelatoriosMap;
  } catch {
    return {};
  }
}

function writeRelatoriosMap(map: RelatoriosMap) {
  localStorage.setItem(RELATORIOS_KEY, JSON.stringify(map));
}

async function persistRelatorios(registro: FormRegistro) {
  if (!registro.relatorios.length) return;
  const map = readRelatoriosMap();
  map[relatorioKey(registro.distrital, registro.id)] = registro.relatorios;
  writeRelatoriosMap(map);
}

async function removeRelatorios(distrital: DistritalCode, id: string) {
  const map = readRelatoriosMap();
  delete map[relatorioKey(distrital, id)];
  writeRelatoriosMap(map);
}

export function attachRelatorios(registro: FormRegistro): FormRegistro {
  const map = readRelatoriosMap();
  const relatorios = map[relatorioKey(registro.distrital, registro.id)];
  if (!relatorios?.length) return registro;
  return { ...registro, relatorios };
}

/**
 * Stub Supabase — ativar quando as envs estiverem disponíveis.
 * Mantém a mesma interface do repositório local.
 */
export function createSupabaseRegistrosRepository(): RegistrosRepository {
  return {
    async list() {
      throw new Error('Supabase ainda não configurado. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.');
    },
    async save() {
      throw new Error('Supabase ainda não configurado.');
    },
    async remove() {
      throw new Error('Supabase ainda não configurado.');
    },
    async exportJson() {
      throw new Error('Supabase ainda não configurado.');
    },
  };
}

export function getRegistrosRepository(): RegistrosRepository {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  if (supabaseUrl) {
    return createSupabaseRegistrosRepository();
  }
  return createIndexedDbRegistrosRepository();
}

export function createFormRegistroId(date = new Date()): string {
  return date.toISOString();
}
