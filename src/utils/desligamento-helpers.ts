import type {
  DesligamentoConsumidor,
  DesligamentoObra,
  DesligamentoSI,
  ProtocolarOpcao,
} from '../stores/desligamento';

const DATE_PATTERN = /^\d{2}\/\d{2}\/\d{4}$/;
const DATETIME_PATTERN = /^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/;

type DesligamentoObraField = keyof DesligamentoObra;
type DesligamentoSIField = keyof DesligamentoSI;

const OBRA_FIELD_LABELS: Record<DesligamentoObraField, string> = {
  nota: 'Nota',
  contrato: 'Contrato',
  pep: 'PEP',
  fornecedor: 'Fornecedor',
  descricaoObra: 'Descrição da Obra',
  cidade: 'Cidade',
  data: 'Data',
  siMes: 'Solicitação de Intervenção (SI) / Mês',
  protocolar: 'Protocolar',
};

const SI_REQUIRED_FIELDS = [
  'inicioDesligamento',
  'fimDesligamento',
  'numeroOperacional',
  'numeroBarramento',
] as const satisfies readonly DesligamentoSIField[];

const SI_FIELD_LABELS: Record<(typeof SI_REQUIRED_FIELDS)[number], string> = {
  inicioDesligamento: 'Início Desligamento',
  fimDesligamento: 'Fim Desligamento',
  numeroOperacional: 'Nº Componente',
  numeroBarramento: 'Nº Barramento',
};

function isDesligamentoObraFieldFilled(obra: DesligamentoObra, field: DesligamentoObraField): boolean {
  if (field === 'data') {
    return DATE_PATTERN.test(obra.data.trim());
  }
  if (field === 'protocolar') {
    return true;
  }
  return Boolean(obra[field].trim());
}

function isDesligamentoSIFieldFilled(solicitacao: DesligamentoSI, field: DesligamentoSIField): boolean {
  if (field === 'inicioDesligamento' || field === 'fimDesligamento') {
    return DATETIME_PATTERN.test(solicitacao[field].trim());
  }
  return Boolean(solicitacao[field].trim());
}

export function getDesligamentoObraFieldError(
  obra: DesligamentoObra,
  field: DesligamentoObraField,
): string | null {
  if (field === 'protocolar') return null;
  if (isDesligamentoObraFieldFilled(obra, field)) return null;
  return `${OBRA_FIELD_LABELS[field]} é obrigatório.`;
}

export function getDesligamentoSIFieldError(
  solicitacao: DesligamentoSI,
  field: (typeof SI_REQUIRED_FIELDS)[number],
): string | null {
  if (isDesligamentoSIFieldFilled(solicitacao, field)) return null;
  return `${SI_FIELD_LABELS[field]} é obrigatório.`;
}

export function validateDesligamentoObraParaExportacao(obra: DesligamentoObra): string[] {
  return (Object.keys(OBRA_FIELD_LABELS) as DesligamentoObraField[])
    .filter((field) => field !== 'protocolar')
    .map((field) => getDesligamentoObraFieldError(obra, field))
    .filter((error): error is string => error !== null);
}

export function validateDesligamentoSIParaExportacao(solicitacao: DesligamentoSI): string[] {
  return SI_REQUIRED_FIELDS.map((field) => getDesligamentoSIFieldError(solicitacao, field)).filter(
    (error): error is string => error !== null,
  );
}

export function consumidorDesligamentoComDados(consumidor: DesligamentoConsumidor) {
  return Boolean(
    consumidor.contaContrato ||
      consumidor.numeroMedidor ||
      consumidor.nomeCompleto ||
      consumidor.protocolar,
  );
}

export function getConsumidoresDesligamentoPreenchidos(consumidores: DesligamentoConsumidor[]) {
  return consumidores.filter(consumidorDesligamentoComDados);
}

export function getTipoCliente(protocolar: ProtocolarOpcao) {
  if (!protocolar) return '';
  return protocolar === 'NAO' ? 'PESSOA FISICA' : 'PESSOA JURIDICA';
}

export function contarPorProtocolar(
  consumidores: DesligamentoConsumidor[],
  protocolar: Exclude<ProtocolarOpcao, ''>,
) {
  return getConsumidoresDesligamentoPreenchidos(consumidores).filter(
    (consumidor) => consumidor.protocolar === protocolar,
  ).length;
}

export function validateDesligamentoConsumidoresParaExportacao(
  consumidores: DesligamentoConsumidor[],
): string[] {
  const preenchidos = getConsumidoresDesligamentoPreenchidos(consumidores);
  if (preenchidos.length === 0) {
    return ['Preencha ao menos um consumidor antes de exportar.'];
  }

  const errors: string[] = [];
  for (const consumidor of preenchidos) {
    if (!consumidor.protocolar) {
      errors.push(`Linha ${consumidor.id}: informe se é com ou sem protocolo.`);
    }
  }

  return errors;
}

export function validateDesligamentoParaExportacao(
  obra: DesligamentoObra,
  solicitacao: DesligamentoSI,
  consumidores: DesligamentoConsumidor[],
): string[] {
  return [
    ...validateDesligamentoObraParaExportacao(obra),
    ...validateDesligamentoSIParaExportacao(solicitacao),
    ...validateDesligamentoConsumidoresParaExportacao(consumidores),
  ];
}
