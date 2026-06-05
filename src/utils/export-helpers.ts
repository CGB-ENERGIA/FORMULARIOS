import type { ObraInfo } from '../stores/consumidores';
import type { ArrastoObra } from '../stores/arrasto';
import type { DesligamentoObra } from '../stores/desligamento';

export function sanitizeFileNamePart(value: string): string {
  return value.trim().replace(/[<>:"/\\|?*]/g, '').replace(/\s+/g, ' ');
}

export function buildExportFileName(obra: ObraInfo, extension: 'xlsx' | 'pdf'): string {
  const pep = sanitizeFileNamePart(obra.elementoPep) || 'obra';
  return `CONSUMIDORES - ${pep}.${extension}`;
}

export function buildDesligamentoExportFileName(
  obra: DesligamentoObra,
  extension: 'xlsx' | 'pdf',
): string {
  const pep = sanitizeFileNamePart(obra.pep) || 'desligamento';
  return `AVISO DE DESLIGAMENTO - ${pep}.${extension}`;
}

export function buildArrastoExportFileName(obra: ArrastoObra, extension: 'xlsm' | 'pdf' = 'xlsm'): string {
  const pep = sanitizeFileNamePart(obra.pep) || 'arrasto';
  return `MEMÓRIA DE CÁLCULO ARRASTO - ${pep}.${extension}`;
}
