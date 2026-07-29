import { consumidorPreenchido } from 'src/utils/excel';
import type { Consumidor, ObraInfo } from 'src/stores/consumidores';
import type { DistritalCode } from 'src/utils/historico-file';
import {
  buildHistoricoEvent,
  createArquivoId,
  createFormRegistroId,
  getRegistrosRepository,
  mergeConsumidores,
  normalizePep,
} from 'src/services/registros';
import type { FormRegistro, RelatorioGerado, RelatorioFormato } from 'src/services/registros/types';

const MIME_BY_FORMATO: Record<RelatorioFormato, string> = {
  pdf: 'application/pdf',
  excel: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};

export interface ArquivoExportado {
  formato: RelatorioFormato;
  nome_arquivo: string;
  blob: Blob;
}

export async function salvarRegistroClientes(params: {
  distrital: DistritalCode;
  obra: ObraInfo;
  consumidores: Consumidor[];
  arquivos?: ArquivoExportado[];
  /** @deprecated use arquivos — mantido para compatibilidade de metadados sem blob */
  relatorios?: RelatorioGerado[];
}): Promise<FormRegistro> {
  const preenchidos = params.consumidores.filter(consumidorPreenchido);
  const exportedAt = createFormRegistroId();
  const repo = getRegistrosRepository();
  const pep = normalizePep(params.obra.elementoPep);

  const existing = pep ? await repo.findByPep(params.distrital, pep) : null;
  const registroId = existing?.id ?? exportedAt;

  const relatorios: RelatorioGerado[] = [];

  if (params.arquivos?.length) {
    for (const arquivo of params.arquivos) {
      const id = createArquivoId(registroId, arquivo.formato);
      const mime = MIME_BY_FORMATO[arquivo.formato];
      await repo.saveArquivo({
        id,
        registro_id: registroId,
        distrital: params.distrital,
        formato: arquivo.formato,
        nome_arquivo: arquivo.nome_arquivo,
        mime_type: mime,
        blob: arquivo.blob,
        created_at: exportedAt,
      });
      relatorios.push({
        id,
        formato: arquivo.formato,
        nome_arquivo: arquivo.nome_arquivo,
        mime_type: mime,
        tamanho_bytes: arquivo.blob.size,
        armazenado: true,
        exported_at: exportedAt,
      });
    }
  } else if (params.relatorios?.length) {
    relatorios.push(
      ...params.relatorios.map((r) => ({
        ...r,
        exported_at: r.exported_at ?? exportedAt,
      })),
    );
  }

  const incomingConsumidores = preenchidos.map((c) => ({
    nome: c.nome,
    numero_medidor: c.numeroMedidor,
    tipo_ligacao: c.tipoLigacao,
    padrao: c.padrao,
    poste_ligacao: c.posteLigacao,
    data_ligacao: c.dataLigacao,
    medidor_baixado: false,
  }));

  const consumidores = existing
    ? mergeConsumidores(existing.consumidores, incomingConsumidores)
    : incomingConsumidores;

  const historicoEvent = buildHistoricoEvent({
    exportedAt,
    totalConsumidores: preenchidos.length,
    descricaoObra: params.obra.descricaoObra,
    relatorios,
  });

  const historico_exportacoes = [
    historicoEvent,
    ...(existing?.historico_exportacoes ?? []),
  ];

  const registro: FormRegistro = {
    id: registroId,
    created_at: existing?.created_at ?? exportedAt,
    updated_at: exportedAt,
    distrital: params.distrital,
    formulario: 'clientes',
    relatorios,
    historico_exportacoes,
    descricao_obra: params.obra.descricaoObra,
    elemento_pep: params.obra.elementoPep.trim(),
    data_conclusao: params.obra.dataConclusao,
    municipio: params.obra.municipio,
    localidade: params.obra.localidade,
    total_consumidores: consumidores.length,
    consumidores,
  };

  await repo.save(registro);
  return registro;
}
