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
  const pep = sanitizePepForFileName(obra.pep) || 'desligamento';
  return `FORMULÁRIO AVISO DE DESLIGAMENTO - ${pep}.${extension}`;
}

export function buildArrastoExportFileName(obra: ArrastoObra, extension: 'xlsm' | 'pdf' = 'xlsm'): string {
  const pep = sanitizePepForFileName(obra.pep) || 'arrasto';
  return `MEMÓRIA DE CÁLCULO ARRASTO DE MATERIAIS - ${pep}.${extension}`;
}

export function buildCalcadaExportFileName(obra: CalcadaObra, extension: 'xlsx' | 'pdf'): string {
  const pep = sanitizePepForFileName(obra.pep) || 'calcada';
  return `FORMULÁRIO REPARO DE CALÇADA - ${pep}.${extension}`;
}

function formatDataDiaMes(data: string): string {
  // DD/MM/YYYY → DD-MM
  const parts = data.trim().split('/');
  if (parts.length >= 2 && parts[0] && parts[1]) return `${parts[0]}-${parts[1]}`;
  return sanitizeFileNamePart(data) || 'DATA';
}

export function buildCusteioExportFileName(
  cabecalho: {
    prefixoEquipe?: string;
    dataExecucao?: string;
    tipoOrdem?: 'ordem' | 'incidente';
    numeroIncidente?: string;
    componenteOuPg?: string;
  },
  extension: 'xlsx' | 'pdf',
): string {
  const equipe = sanitizeFileNamePart(cabecalho.prefixoEquipe || '') || 'EQUIPE';
  const data = cabecalho.dataExecucao ? formatDataDiaMes(cabecalho.dataExecucao) : 'DATA';
  const ref = cabecalho.tipoOrdem === 'incidente'
    ? `INC ${sanitizeFileNamePart(cabecalho.numeroIncidente || '')}`
    : `CP-${sanitizeFileNamePart(cabecalho.componenteOuPg || '')}`;
  return `RELATÓRIO CUSTEIO - ${equipe} - ${data} ${ref}.${extension}`;
}

export function buildPodaExportFileName(cabecalho: { pep?: string }, extension: 'pdf' = 'pdf'): string {
  const pep = sanitizePepForFileName(cabecalho.pep ?? '') || 'poda';
  return `RELATÓRIO DE PODAS - ${pep}.${extension}`;
}

export function buildCadastroExportFileName(form: CadastroForm, extension: 'xlsx' | 'pdf' = 'xlsx'): string {
  const pep = sanitizePepForFileName(form.pep) || sanitizePepForFileName(form.nome) || 'cadastro';
  return `CADASTRO CONSUMIDORES - ${pep}.${extension}`;
}
