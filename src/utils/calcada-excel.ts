import ExcelJS from 'exceljs';
import type { CalcadaObra, CalcadaEvidencia } from '../stores/calcada';
import { evidenciaPreenchida } from '../stores/calcada';
import { calcularPepLimpo, calcularValorRs } from './calcada-helpers';
import { publicAsset } from './assets';
import { buildCalcadaExportFileName } from './export-helpers';

const TEMPLATE_URL = publicAsset('template/CONTROLE_REPARO_CALCADAS.xlsm');
const SHEET_ANEXO = 'GERAR ANEXO';
const SHEET_BANCO = 'BANCO';

/**
 * Posições dos 9 blocos de evidência no modelo (1-indexed).
 * pgRow = linha onde fica o nº da página (célula D{pgRow}).
 * first/last = primeira/última linha da área de foto.
 * ANTES ocupa colunas D-H, DEPOIS ocupa colunas J-N.
 */
const BLOCOS = [
  { pgRow: 17, first: 19, last: 30 },
  { pgRow: 32, first: 34, last: 45 },
  { pgRow: 47, first: 49, last: 60 },
  { pgRow: 62, first: 64, last: 75 },
  { pgRow: 79, first: 81, last: 92 },
  { pgRow: 94, first: 96, last: 107 },
  { pgRow: 109, first: 111, last: 122 },
  { pgRow: 124, first: 126, last: 137 },
  { pgRow: 139, first: 141, last: 152 },
];

export const MAX_BLOCOS_EXCEL = BLOCOS.length;

// Colunas (0-indexed) para anchors do ExcelJS
const COL_ANTES_TL = 3;   // D
const COL_ANTES_BR = 7.99; // até o fim de H
const COL_DEPOIS_TL = 9;   // J
const COL_DEPOIS_BR = 13.99; // até o fim de N

async function loadTemplate(): Promise<ArrayBuffer> {
  const response = await fetch(TEMPLATE_URL);
  if (!response.ok) {
    throw new Error('Modelo Excel de calçadas não encontrado.');
  }
  return response.arrayBuffer();
}

function downloadBuffer(buffer: ArrayBuffer, fileName: string) {
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

function getImageExtension(dataUrl: string): ExcelJS.ImageExtension {
  const match = dataUrl.match(/^data:image\/(\w+);base64,/);
  const ext = match?.[1]?.toLowerCase() ?? 'png';
  if (ext === 'jpg' || ext === 'jpeg') return 'jpeg';
  if (ext === 'gif') return 'gif';
  return 'png';
}

function fillObra(sheet: ExcelJS.Worksheet, obra: CalcadaObra) {
  const valorRs = calcularValorRs(obra.quantidade, obra.valorSap);

  // DADOS OBRA — substitui as fórmulas INDEX/MATCH por valores diretos
  sheet.getCell('D8').value = obra.pep;
  sheet.getCell('H8').value = obra.nota;
  sheet.getCell('K8').value = obra.distrital;
  sheet.getCell('E9').value = obra.descricaoObra;
  sheet.getCell('K9').value = obra.municipio;

  // DADOS REPARO DE CALÇADAS
  sheet.getCell('E13').value = obra.quantidade ?? 0;
  sheet.getCell('I13').value = obra.valorSap ?? 0;
  sheet.getCell('M13').value = { formula: 'I13*E13', result: valorRs };

  // Helper oculto: PEP sem pontuação
  sheet.getCell('Q8').value = calcularPepLimpo(obra.pep);
}

function insertEvidencia(
  workbook: ExcelJS.Workbook,
  sheet: ExcelJS.Worksheet,
  evidencia: CalcadaEvidencia,
  blocoIndex: number,
) {
  const bloco = BLOCOS[blocoIndex];
  if (!bloco) return;

  // PG
  if (evidencia.pg) {
    sheet.getCell(`D${bloco.pgRow}`).value = evidencia.pg;
  }

  const tlRow = bloco.first - 1; // 0-indexed
  const brRow = bloco.last - 0.01;

  if (evidencia.fotoAntes) {
    const imageId = workbook.addImage({
      base64: evidencia.fotoAntes.replace(/^data:image\/\w+;base64,/, ''),
      extension: getImageExtension(evidencia.fotoAntes),
    });
    sheet.addImage(imageId, {
      tl: { col: COL_ANTES_TL, row: tlRow } as ExcelJS.Anchor,
      br: { col: COL_ANTES_BR, row: brRow } as ExcelJS.Anchor,
      editAs: 'twoCell',
    });
  }

  if (evidencia.fotoDepois) {
    const imageId = workbook.addImage({
      base64: evidencia.fotoDepois.replace(/^data:image\/\w+;base64,/, ''),
      extension: getImageExtension(evidencia.fotoDepois),
    });
    sheet.addImage(imageId, {
      tl: { col: COL_DEPOIS_TL, row: tlRow } as ExcelJS.Anchor,
      br: { col: COL_DEPOIS_BR, row: brRow } as ExcelJS.Anchor,
      editAs: 'twoCell',
    });
  }
}

export interface CalcadaExcelResult {
  fileName: string;
  truncated: boolean; // true se havia mais blocos do que o modelo comporta
}

export async function exportCalcadaToExcel(
  obra: CalcadaObra,
  evidencias: CalcadaEvidencia[],
): Promise<CalcadaExcelResult> {
  const templateBuffer = await loadTemplate();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(templateBuffer);

  const anexo = workbook.getWorksheet(SHEET_ANEXO);
  if (!anexo) {
    throw new Error('Aba "GERAR ANEXO" não encontrada no modelo.');
  }

  fillObra(anexo, obra);

  const preenchidas = evidencias.filter(evidenciaPreenchida);
  const usadas = preenchidas.slice(0, MAX_BLOCOS_EXCEL);
  usadas.forEach((evidencia, i) => insertEvidencia(workbook, anexo, evidencia, i));

  // A aba BANCO é apenas o banco de dados de origem do modelo. Seus campos no
  // anexo já foram preenchidos com valores diretos, então ela é removida do
  // arquivo final — evita os #REF! que o ExcelJS gera ao reescrever a tabela.
  const banco = workbook.getWorksheet(SHEET_BANCO);
  if (banco) {
    workbook.removeWorksheet(banco.id);
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const fileName = buildCalcadaExportFileName(obra, 'xlsx');
  downloadBuffer(buffer, fileName);

  return { fileName, truncated: preenchidas.length > MAX_BLOCOS_EXCEL };
}
