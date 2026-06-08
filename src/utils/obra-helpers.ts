import type { ObraInfo } from '../stores/consumidores';
import { FORNECEDOR_FIXO, REGIONAL_FIXA, TEC_OBRA_FIXO } from '../stores/consumidores';

const DATE_PATTERN = /^\d{2}\/\d{2}\/\d{4}$/;

type ObraField = keyof ObraInfo;

const FIELD_LABELS: Record<ObraField, string> = {
  descricaoObra: 'Descrição da Obra',
  fornecedor: 'Fornecedor',
  elementoPep: 'Elemento PEP',
  nota: 'Nota',
  dataConclusao: 'Data da Conclusão',
  dataEnergizacao: 'Data da Energização',
  tecObra: 'Téc da Obra',
  regional: 'Regional',
  localidade: 'Localidade',
  municipio: 'Município',
};

function isObraFieldFilled(obra: ObraInfo, field: ObraField): boolean {
  switch (field) {
    case 'fornecedor':
      return Boolean(obra.fornecedor?.trim() || FORNECEDOR_FIXO);
    case 'tecObra':
      return Boolean(obra.tecObra?.trim() || TEC_OBRA_FIXO);
    case 'regional':
      return Boolean(obra.regional?.trim() || REGIONAL_FIXA);
    case 'dataConclusao':
    case 'dataEnergizacao':
      return DATE_PATTERN.test(obra[field].trim());
    default:
      return Boolean(obra[field].trim());
  }
}

export function getObraFieldError(obra: ObraInfo, field: ObraField): string | null {
  if (isObraFieldFilled(obra, field)) return null;
  return `${FIELD_LABELS[field]} é obrigatório.`;
}

export function validateObraParaExportacao(obra: ObraInfo): string[] {
  return (Object.keys(FIELD_LABELS) as ObraField[])
    .map((field) => getObraFieldError(obra, field))
    .filter((error): error is string => error !== null);
}
