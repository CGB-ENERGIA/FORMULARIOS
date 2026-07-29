import { consumidorPreenchido } from 'src/utils/excel';
import type { Consumidor, ObraInfo } from 'src/stores/consumidores';
import type { DistritalCode } from 'src/utils/historico-file';
import {
  createFormRegistroId,
  getRegistrosRepository,
} from 'src/services/registros';
import type { FormRegistro, RelatorioGerado } from 'src/services/registros/types';

export async function salvarRegistroClientes(params: {
  distrital: DistritalCode;
  obra: ObraInfo;
  consumidores: Consumidor[];
  relatorios?: RelatorioGerado[];
}): Promise<FormRegistro> {
  const preenchidos = params.consumidores.filter(consumidorPreenchido);
  const createdAt = createFormRegistroId();

  const registro: FormRegistro = {
    id: createdAt,
    created_at: createdAt,
    distrital: params.distrital,
    formulario: 'clientes',
    relatorios: params.relatorios ?? [],
    descricao_obra: params.obra.descricaoObra,
    elemento_pep: params.obra.elementoPep,
    data_conclusao: params.obra.dataConclusao,
    municipio: params.obra.municipio,
    localidade: params.obra.localidade,
    total_consumidores: preenchidos.length,
    consumidores: preenchidos.map((c) => ({
      nome: c.nome,
      numero_medidor: c.numeroMedidor,
      tipo_ligacao: c.tipoLigacao,
      padrao: c.padrao,
      poste_ligacao: c.posteLigacao,
      data_ligacao: c.dataLigacao,
    })),
  };

  await getRegistrosRepository().save(registro);
  return registro;
}
