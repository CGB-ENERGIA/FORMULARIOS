import type { ObraInfo } from '../stores/consumidores';
import type { ArrastoObra } from '../stores/arrasto';
import type { DesligamentoObra } from '../stores/desligamento';
import type { CalcadaObra } from '../stores/calcada';
import type { CadastroForm } from '../stores/cadastro';

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

export function buildCalcadaExportFileName(obra: CalcadaObra, extension: 'xlsx' | 'pdf'): string {
  const pep = sanitizeFileNamePart(obra.pep) || 'calcada';
  return `ANEXO REPARO DE CALÇADA - ${pep}.${extension}`;
}

export function buildCusteioExportFileName(cabecalho: { componenteOuPg?: string; municipio?: string }, extension: 'xlsx' | 'pdf'): string {
  const ref = sanitizeFileNamePart(cabecalho.componenteOuPg || cabecalho.municipio || '') || 'custeio';
  return `RELATORIO_CUSTEIO - ${ref}.${extension}`;
}

export function buildCadastroExportFileName(form: CadastroForm, extension: 'xlsx' | 'pdf' = 'xlsx'): string {
  const pep = sanitizeFileNamePart(form.pep) || sanitizeFileNamePart(form.nome) || 'cadastro';
  return `CADASTRO - ${pep}.${extension}`;
}
