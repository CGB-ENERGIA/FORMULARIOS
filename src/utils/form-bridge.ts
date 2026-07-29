import type { CadastroForm, LigadaFase, PadraoEntrada } from 'src/stores/cadastro';
import { createDefaultCadastroForm } from 'src/stores/cadastro';
import type { Consumidor, ObraInfo, PadraoTipo, TipoLigacao } from 'src/stores/consumidores';
import { getConsumidoresPreenchidos } from './consumidor-helpers';

function mapPadraoConsumidorToCadastro(padrao: PadraoTipo): PadraoEntrada {
  if (padrao === '5M') return '5m';
  if (padrao === '7M') return '7m';
  if (padrao === 'CPP') return 'existente';
  return '';
}

function mapPadraoCadastroToConsumidor(padrao: PadraoEntrada): PadraoTipo {
  if (padrao === '5m') return '5M';
  if (padrao === '7m') return '7M';
  if (padrao === 'existente') return 'CPP';
  return '';
}

function mapTipoLigacaoToFase(tipo: TipoLigacao): LigadaFase {
  if (tipo === 'MO') return 'A';
  if (tipo === 'BI') return 'AB';
  if (tipo === 'TRI') return 'ABC';
  return '';
}

function mapFaseToTipoLigacao(fase: LigadaFase): TipoLigacao {
  if (fase === 'A') return 'MO';
  if (fase === 'AB') return 'BI';
  if (fase === 'ABC') return 'TRI';
  return '';
}

function buildEnderecoFromObra(obra: ObraInfo): string {
  return [obra.localidade, obra.municipio].filter(Boolean).join(' - ');
}

function pickExclusiveCadastro(prev: CadastroForm | undefined, next: CadastroForm): CadastroForm {
  if (!prev) return next;
  return {
    ...next,
    cc: prev.cc || next.cc,
    endereco: next.endereco || prev.endereco,
    numComp: prev.numComp || next.numComp,
    medAnt: prev.medAnt || next.medAnt,
    pot: prev.pot || next.pot,
    numEquatorial: prev.numEquatorial || next.numEquatorial,
    fabricante: prev.fabricante || next.fabricante,
    dataFabr: prev.dataFabr || next.dataFabr,
    numSerie: prev.numSerie || next.numSerie,
    nomeResponsavel: prev.nomeResponsavel || next.nomeResponsavel,
    dataExecucao: prev.dataExecucao || next.dataExecucao,
    horaExecucao: prev.horaExecucao || next.horaExecucao,
    empresa: prev.empresa?.trim() || next.empresa?.trim() || 'CGB ENERGIA',
  };
}

function pickExclusiveConsumidor(prev: Consumidor | undefined, next: Consumidor): Consumidor {
  if (!prev) return next;
  return {
    ...next,
    ramalDuplex: prev.ramalDuplex || next.ramalDuplex,
    ramalTriplex: prev.ramalTriplex || next.ramalTriplex,
    fotoPadrao: prev.fotoPadrao || next.fotoPadrao,
    fotoMedidor: prev.fotoMedidor || next.fotoMedidor,
    dataLigacao: next.dataLigacao || prev.dataLigacao,
  };
}

export function consumidorToCadastroForm(
  consumidor: Consumidor,
  obra: ObraInfo,
  base?: CadastroForm,
): CadastroForm {
  const template = base ? { ...base } : createDefaultCadastroForm();

  return {
    ...template,
    pep: obra.elementoPep || template.pep,
    nome: consumidor.nome.trim(),
    endereco: template.endereco || buildEnderecoFromObra(obra),
    padrao: mapPadraoConsumidorToCadastro(consumidor.padrao) || template.padrao,
    numPoste: consumidor.posteLigacao.trim() || template.numPoste,
    medInst: consumidor.numeroMedidor.trim() || template.medInst,
    ligadaFase: mapTipoLigacaoToFase(consumidor.tipoLigacao) || template.ligadaFase,
    // Responsável / Execução não vem da Relação — usuário preenche (exceto empresa).
    nomeResponsavel: '',
    dataExecucao: '',
    horaExecucao: '',
    empresa: 'CGB ENERGIA',
  };
}

export function cadastroFormToConsumidor(form: CadastroForm, id: number): Consumidor {
  return {
    id,
    nome: form.nome.trim(),
    numeroMedidor: (form.medInst || form.medAnt).trim(),
    tipoLigacao: mapFaseToTipoLigacao(form.ligadaFase),
    padrao: mapPadraoCadastroToConsumidor(form.padrao),
    ramalDuplex: '',
    ramalTriplex: '',
    posteLigacao: form.numPoste.trim(),
    dataLigacao: '',
    fotoPadrao: '',
    fotoMedidor: '',
  };
}

export function isCadastroClienteImportavel(form: CadastroForm): boolean {
  return Boolean(
    form.nome.trim() ||
      form.medInst.trim() ||
      form.medAnt.trim() ||
      form.numPoste.trim() ||
      form.cc.trim(),
  );
}

/** Converte consumidores preenchidos em clientes de Cadastro. */
export function buildCadastroFromConsumidores(
  obra: ObraInfo,
  consumidores: Consumidor[],
  baseCliente?: CadastroForm,
): CadastroForm[] {
  const preenchidos = getConsumidoresPreenchidos(consumidores);
  return preenchidos.map((consumidor) =>
    consumidorToCadastroForm(consumidor, obra, baseCliente),
  );
}

/** Converte clientes de Cadastro em linhas de Consumidores. */
export function buildConsumidoresFromCadastro(
  clientes: CadastroForm[],
): { consumidores: Consumidor[]; pep: string; data: string } {
  const importaveis = clientes.filter(isCadastroClienteImportavel);
  const consumidores = importaveis.map((form, index) =>
    cadastroFormToConsumidor(form, index + 1),
  );

  const pep = importaveis.find((c) => c.pep.trim())?.pep.trim() ?? '';

  return { consumidores, pep, data: '' };
}

/**
 * Sincroniza Consumidores → Cadastro preservando campos exclusivos do Cadastro.
 * Usado na troca de aba (preenchimento bilateral).
 */
export function syncConsumidoresIntoCadastro(
  obra: ObraInfo,
  consumidores: Consumidor[],
  clientesAtuais: CadastroForm[],
): CadastroForm[] {
  const preenchidos = getConsumidoresPreenchidos(consumidores);
  if (preenchidos.length === 0) {
    return clientesAtuais.length > 0 ? clientesAtuais : [createDefaultCadastroForm()];
  }

  const base = clientesAtuais[0] ?? createDefaultCadastroForm();
  return preenchidos.map((consumidor, index) => {
    const mapped = consumidorToCadastroForm(consumidor, obra, base);
    return pickExclusiveCadastro(clientesAtuais[index], mapped);
  });
}

/**
 * Sincroniza Cadastro → Consumidores preservando fotos e ramais.
 */
export function syncCadastroIntoConsumidores(
  clientes: CadastroForm[],
  consumidoresAtuais: Consumidor[],
): { consumidores: Consumidor[]; pep: string; data: string } {
  const importaveis = clientes.filter(isCadastroClienteImportavel);
  if (importaveis.length === 0) {
    return {
      consumidores: consumidoresAtuais,
      pep: '',
      data: '',
    };
  }

  const preenchidosAtuais = getConsumidoresPreenchidos(consumidoresAtuais);
  const consumidores = importaveis.map((form, index) => {
    const mapped = cadastroFormToConsumidor(form, index + 1);
    return pickExclusiveConsumidor(preenchidosAtuais[index], mapped);
  });

  const pep = importaveis.find((c) => c.pep.trim())?.pep.trim() ?? '';

  return { consumidores, pep, data: '' };
}

export function describeBridgeFields(): string {
  return 'Nome, medidor, padrão, poste, tipo de ligação/fase e PEP';
}
