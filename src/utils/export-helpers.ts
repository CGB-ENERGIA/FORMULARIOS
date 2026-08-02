import type { ObraInfo } from '../stores/consumidores';
import type { ArrastoObra } from '../stores/arrasto';
import type { DesligamentoObra } from '../stores/desligamento';
import type { CalcadaObra } from '../stores/calcada';
import type { CadastroForm } from '../stores/cadastro';

export function sanitizeFileNamePart(value: string): string {
  return value.trim().replace(/[<>:"/\\|?*]/g, '').replace(/\s+/g, ' ');
}

export function sanitizePepForFileName(value: string): string {
  return value.trim().replace(/[^a-zA-Z0-9]/g, '');
}

export function buildExportFileName(obra: ObraInfo, extension: 'xlsx' | 'pdf'): string {
  const pep = sanitizePepForFileName(obra.elementoPep) || 'obra';
  return `RELAÇÃO DE CONSUMIDORES - ${pep}.${extension}`;
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

export function buildCalcadaExportFileName(obra: CalcadaObra, extension: 'xlsx' | 'pdf'): string {
  const pep = sanitizePepForFileName(obra.pep) || 'calcada';
  return `ANEXO REPARO DE CALÇADA - ${pep}.${extension}`;
}

export function buildCusteioExportFileName(cabecalho: { componenteOuPg?: string; municipio?: string }, extension: 'xlsx' | 'pdf'): string {
  const ref = sanitizeFileNamePart(cabecalho.componenteOuPg || cabecalho.municipio || '') || 'custeio';
  return `RELATORIO_CUSTEIO - ${ref}.${extension}`;
}

export function buildCadastroExportFileName(form: CadastroForm, extension: 'xlsx' | 'pdf' = 'xlsx'): string {
  const pep = sanitizePepForFileName(form.pep) || sanitizePepForFileName(form.nome) || 'cadastro';
  return `CADASTRO CONSUMIDORES - ${pep}.${extension}`;
}
