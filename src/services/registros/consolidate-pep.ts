import type {
  FormRegistro,
  HistoricoExportacao,
  RegistroConsumidor,
  RelatorioGerado,
} from './types';
import { normalizePep } from './types';

export function normalizeMedidor(value: string): string {
  return value.trim();
}

/** Preserva status de medidor baixado ao atualizar a lista de consumidores. */
export function mergeConsumidores(
  existing: RegistroConsumidor[],
  incoming: RegistroConsumidor[],
): RegistroConsumidor[] {
  const byMedidor = new Map<string, RegistroConsumidor>();

  for (const c of existing) {
    const key = normalizeMedidor(c.numero_medidor);
    if (key) byMedidor.set(key, c);
  }

  for (const c of incoming) {
    const key = normalizeMedidor(c.numero_medidor);
    if (!key) continue;
    const prev = byMedidor.get(key);
    byMedidor.set(key, {
      ...c,
      medidor_baixado: prev?.medidor_baixado ?? c.medidor_baixado,
    });
  }

  return Array.from(byMedidor.values());
}

export function pepGroupKey(distrital: string, pep: string): string | null {
  const normalized = normalizePep(pep);
  if (!normalized) return null;
  return `${distrital}::${normalized}`;
}

function sortHistoricoDesc(items: HistoricoExportacao[]): HistoricoExportacao[] {
  return [...items].sort((a, b) => b.exported_at.localeCompare(a.exported_at));
}

function uniqueHistorico(items: HistoricoExportacao[]): HistoricoExportacao[] {
  const seen = new Set<string>();
  const out: HistoricoExportacao[] = [];
  for (const item of sortHistoricoDesc(items)) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    out.push(item);
  }
  return out;
}

function entryAsHistorico(entry: FormRegistro): HistoricoExportacao {
  const exportedAt = entry.updated_at || entry.created_at || entry.id;
  return {
    id: exportedAt,
    exported_at: exportedAt,
    total_consumidores: entry.total_consumidores,
    descricao_obra: entry.descricao_obra,
    relatorios: entry.relatorios.map((r) => ({
      ...r,
      exported_at: r.exported_at ?? exportedAt,
    })),
  };
}

function ensureHistorico(entry: FormRegistro): HistoricoExportacao[] {
  if (entry.historico_exportacoes?.length) {
    return uniqueHistorico(entry.historico_exportacoes);
  }
  if (entry.relatorios.length) {
    return [entryAsHistorico(entry)];
  }
  return [];
}

/**
 * Junta registros duplicados do mesmo PEP (distrital) em um único card.
 * Mantém o id mais antigo como canônico e monta o histórico de exportações.
 */
export function consolidateByPep(registros: FormRegistro[]): FormRegistro[] {
  const groups = new Map<string, FormRegistro[]>();
  const orphans: FormRegistro[] = [];

  for (const entry of registros) {
    const key = pepGroupKey(entry.distrital, entry.elemento_pep);
    if (!key) {
      orphans.push({
        ...entry,
        updated_at: entry.updated_at || entry.created_at,
        historico_exportacoes: ensureHistorico(entry),
      });
      continue;
    }
    const list = groups.get(key) ?? [];
    list.push(entry);
    groups.set(key, list);
  }

  const consolidated: FormRegistro[] = [];

  for (const group of groups.values()) {
    if (group.length === 1) {
      const only = group[0]!;
      consolidated.push({
        ...only,
        updated_at: only.updated_at || only.created_at,
        historico_exportacoes: ensureHistorico(only),
      });
      continue;
    }

    const sortedAsc = [...group].sort((a, b) => a.created_at.localeCompare(b.created_at));
    const latest = [...sortedAsc].reverse()[0]!;
    const keeper = sortedAsc[0]!;

    const historico = uniqueHistorico([
      ...group.flatMap((g) => ensureHistorico(g)),
    ]);

    let consumidores = keeper.consumidores;
    for (const g of sortedAsc) {
      consumidores = mergeConsumidores(consumidores, g.consumidores);
    }

    consolidated.push({
      ...latest,
      id: keeper.id,
      created_at: keeper.created_at,
      updated_at: latest.updated_at || latest.created_at,
      historico_exportacoes: historico,
      relatorios: latest.relatorios.length
        ? latest.relatorios
        : historico[0]?.relatorios ?? [],
      consumidores,
      total_consumidores: consumidores.length,
    });
  }

  return [...consolidated, ...orphans].sort((a, b) =>
    (b.updated_at || b.created_at).localeCompare(a.updated_at || a.created_at),
  );
}

export function buildHistoricoEvent(params: {
  exportedAt: string;
  totalConsumidores: number;
  descricaoObra: string;
  relatorios: RelatorioGerado[];
}): HistoricoExportacao {
  return {
    id: params.exportedAt,
    exported_at: params.exportedAt,
    total_consumidores: params.totalConsumidores,
    descricao_obra: params.descricaoObra,
    relatorios: params.relatorios.map((r) => ({
      ...r,
      exported_at: r.exported_at ?? params.exportedAt,
    })),
  };
}

/** Ids duplicados (mesmo PEP) que devem ser removidos após consolidar no keeper. */
export function duplicateIdsToRemove(
  registros: FormRegistro[],
  keeper: FormRegistro,
): string[] {
  const key = pepGroupKey(keeper.distrital, keeper.elemento_pep);
  if (!key) return [];
  return registros
    .filter(
      (r) =>
        r.id !== keeper.id &&
        pepGroupKey(r.distrital, r.elemento_pep) === key,
    )
    .map((r) => r.id);
}
