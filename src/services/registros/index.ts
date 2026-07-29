import type { DistritalCode, HistoricoEntry, HistoricoExportacaoLegado } from 'src/utils/historico-file';
import {
  appendHistoricoEntry,
  deleteHistoricoEntry,
  exportHistoricoAsJson,
  loadHistoricoEntries,
  DISTRITAIS,
} from 'src/utils/historico-file';
import {
  deleteArquivosByRegistro,
  getArquivoById,
  listArquivosByRegistro,
  putArquivo,
} from './arquivos-store';
import { consolidateByPep, duplicateIdsToRemove } from './consolidate-pep';
import type {
  ArquivoRegistro,
  FormRegistro,
  HistoricoExportacao,
  RegistroConsumidor,
  RegistrosRepository,
  RelatorioGerado,
} from './types';
import { normalizePep } from './types';

function fromHistoricoRelatorio(
  r: HistoricoExportacaoLegado['relatorios'][number],
  exportedAt: string,
): RelatorioGerado {
  const formato = r.formato === 'excel' ? 'excel' : 'pdf';
  return {
    id: r.id ?? '',
    formato,
    nome_arquivo: r.nomeArquivo,
    mime_type: r.mimeType ?? '',
    tamanho_bytes: r.tamanhoBytes ?? 0,
    armazenado: Boolean(r.armazenado && r.id),
    exported_at: exportedAt,
  };
}

function toHistoricoRelatorio(r: RelatorioGerado): HistoricoExportacaoLegado['relatorios'][number] {
  return {
    id: r.id,
    formato: r.formato,
    nomeArquivo: r.nome_arquivo,
    mimeType: r.mime_type,
    tamanhoBytes: r.tamanho_bytes,
    armazenado: r.armazenado,
  };
}

function fromHistoricoExportacao(h: HistoricoExportacaoLegado): HistoricoExportacao {
  return {
    id: h.id,
    exported_at: h.exportedAt,
    total_consumidores: h.totalConsumidores,
    descricao_obra: h.descricaoObra,
    relatorios: (h.relatorios ?? []).map((r) => fromHistoricoRelatorio(r, h.exportedAt)),
  };
}

function toHistoricoExportacao(h: HistoricoExportacao): HistoricoExportacaoLegado {
  return {
    id: h.id,
    exportedAt: h.exported_at,
    totalConsumidores: h.total_consumidores,
    descricaoObra: h.descricao_obra,
    relatorios: h.relatorios.map(toHistoricoRelatorio),
  };
}

/** Converte o formato legado (IndexedDB atual) para o modelo do módulo Clientes. */
export function fromHistoricoEntry(entry: HistoricoEntry): FormRegistro {
  const historico = (entry.historicoExportacoes ?? []).map(fromHistoricoExportacao);
  return {
    id: entry.id,
    created_at: entry.id,
    updated_at: entry.updatedAt ?? entry.id,
    distrital: entry.distrital,
    formulario: 'clientes',
    relatorios: [],
    historico_exportacoes: historico,
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
        medidor_baixado: Boolean(c.medidorBaixado),
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
    updatedAt: registro.updated_at,
    historicoExportacoes: registro.historico_exportacoes.map(toHistoricoExportacao),
    consumidores: registro.consumidores.map((c) => ({
      nome: c.nome,
      numeroMedidor: c.numero_medidor,
      tipoLigacao: c.tipo_ligacao,
      padrao: c.padrao,
      posteLigacao: c.poste_ligacao,
      dataLigacao: c.data_ligacao,
      medidorBaixado: c.medidor_baixado,
    })),
  };
}

const RELATORIOS_KEY = 'formularios-web:registros-relatorios';

type RelatoriosMap = Record<string, RelatorioGerado[]>;

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

async function persistRelatoriosMeta(registro: FormRegistro) {
  const map = readRelatoriosMap();
  map[relatorioKey(registro.distrital, registro.id)] = registro.relatorios;
  writeRelatoriosMap(map);
}

async function removeRelatoriosMeta(distrital: DistritalCode, id: string) {
  const map = readRelatoriosMap();
  delete map[relatorioKey(distrital, id)];
  writeRelatoriosMap(map);
}

export function attachRelatorios(registro: FormRegistro): FormRegistro {
  const map = readRelatoriosMap();
  const relatorios = map[relatorioKey(registro.distrital, registro.id)];
  if (!relatorios?.length) {
    // Fallback: arquivos da exportação mais recente no histórico.
    const latest = registro.historico_exportacoes[0];
    if (latest?.relatorios?.length) {
      return { ...registro, relatorios: latest.relatorios };
    }
    return registro;
  }
  return { ...registro, relatorios };
}

async function loadRawList(distrital?: DistritalCode | null): Promise<FormRegistro[]> {
  if (distrital) {
    const entries = await loadHistoricoEntries(distrital);
    return entries.map(fromHistoricoEntry).map(attachRelatorios);
  }
  const all = await Promise.all(DISTRITAIS.map((d) => loadHistoricoEntries(d)));
  return all
    .flat()
    .map(fromHistoricoEntry)
    .map(attachRelatorios)
    .sort((a, b) => (b.updated_at || b.created_at).localeCompare(a.updated_at || a.created_at));
}

/**
 * Persiste consolidação: salva keeper e remove duplicados do mesmo PEP.
 */
async function persistConsolidated(keeper: FormRegistro, raw: FormRegistro[]): Promise<void> {
  await appendHistoricoEntry(toHistoricoEntry(keeper));
  await persistRelatoriosMeta(keeper);

  const toRemove = duplicateIdsToRemove(raw, keeper);
  for (const id of toRemove) {
    await deleteHistoricoEntry(keeper.distrital, id);
    await removeRelatoriosMeta(keeper.distrital, id);
    // Não apaga blobs dos duplicados — ainda referenciados no histórico.
  }
}

/**
 * Repositório local — metadados no histórico + binários no store de arquivos.
 * Um registro por Elemento PEP (dentro da distrital), com histórico de exportações.
 */
export function createIndexedDbRegistrosRepository(): RegistrosRepository {
  return {
    async list(distrital) {
      const raw = await loadRawList(distrital);
      const consolidated = consolidateByPep(raw);

      // Persistência lazy: grava consolidação quando havia duplicados.
      for (const keeper of consolidated) {
        const key = normalizePep(keeper.elemento_pep);
        if (!key) continue;
        const siblings = raw.filter(
          (r) =>
            r.distrital === keeper.distrital &&
            normalizePep(r.elemento_pep) === key,
        );
        if (siblings.length > 1) {
          await persistConsolidated(keeper, raw);
        } else if (
          !siblings[0]?.historico_exportacoes?.length &&
          keeper.historico_exportacoes.length
        ) {
          await appendHistoricoEntry(toHistoricoEntry(keeper));
          await persistRelatoriosMeta(keeper);
        }
      }

      return consolidated;
    },

    async findByPep(distrital, elementoPep) {
      const pep = normalizePep(elementoPep);
      if (!pep) return null;
      const list = await this.list(distrital);
      return list.find((r) => normalizePep(r.elemento_pep) === pep) ?? null;
    },

    async save(registro) {
      const raw = await loadRawList(registro.distrital);
      await persistConsolidated(registro, [...raw.filter((r) => r.id !== registro.id), registro]);
    },

    async remove(distrital, id) {
      await deleteHistoricoEntry(distrital, id);
      await removeRelatoriosMeta(distrital, id);
      await deleteArquivosByRegistro(id);
    },

    async updateConsumidorMedidor(distrital, registroId, numeroMedidor, medidorBaixado) {
      const entries = await loadHistoricoEntries(distrital);
      const entry = entries.find((e) => e.id === registroId);
      if (!entry) throw new Error('Registro não encontrado.');

      const consumidores = entry.consumidores.map((c) =>
        c.numeroMedidor === numeroMedidor
          ? { ...c, medidorBaixado }
          : c,
      );

      await appendHistoricoEntry({ ...entry, consumidores });
    },

    async saveArquivo(arquivo) {
      const full: ArquivoRegistro = {
        ...arquivo,
        created_at: arquivo.created_at ?? new Date().toISOString(),
      };
      await putArquivo(full);
    },

    async getArquivo(arquivoId) {
      return getArquivoById(arquivoId);
    },

    async listArquivos(registroId) {
      return listArquivosByRegistro(registroId);
    },

    async exportJson(distrital) {
      await exportHistoricoAsJson(distrital);
    },
  };
}

/**
 * Stub Supabase — ativar quando as envs estiverem disponíveis.
 */
export function createSupabaseRegistrosRepository(): RegistrosRepository {
  const notReady = () => {
    throw new Error('Supabase ainda não configurado. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.');
  };
  return {
    list: notReady,
    findByPep: notReady,
    save: notReady,
    remove: notReady,
    updateConsumidorMedidor: notReady,
    saveArquivo: notReady,
    getArquivo: notReady,
    listArquivos: notReady,
    exportJson: notReady,
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

export {
  createArquivoId,
  downloadBlob,
  formatBytes,
} from './arquivos-store';

export { consolidateByPep, mergeConsumidores, buildHistoricoEvent } from './consolidate-pep';
export { normalizePep } from './types';
