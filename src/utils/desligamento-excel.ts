import ExcelJS from 'exceljs';
import type {
  DesligamentoConsumidor,
  DesligamentoObra,
  DesligamentoSI,
} from '../stores/desligamento';
import {
  contarPorProtocolar,
  getConsumidoresDesligamentoPreenchidos,
  getTipoCliente,
} from './desligamento-helpers';
import { publicAsset } from './assets';
import { buildDesligamentoExportFileName } from './export-helpers';

const TEMPLATE_URL = publicAsset('template/DESLIGAMENTO.xlsm');
const SHEET_SINTESE = 'SINTESE';
const SHEET_CONSUMIDORES = 'Consumidores';
const FIRST_DATA_ROW = 4;
const LAST_DATA_ROW = 126;

async function loadTemplate(): Promise<ArrayBuffer> {
  const response = await fetch(TEMPLATE_URL);
  if (!response.ok) {
    throw new Error('Modelo Excel de desligamento não encontrado.');
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

function fillSintese(
  sheet: ExcelJS.Worksheet,
  obra: DesligamentoObra,
  solicitacao: DesligamentoSI,
  consumidores: DesligamentoConsumidor[],
) {
  sheet.getCell('D8').value = obra.nota;
  sheet.getCell('N8').value = obra.contrato;
  sheet.getCell('G8').value = obra.pep;
  sheet.getCell('K8').value = obra.fornecedor;
  sheet.getCell('E9').value = obra.descricaoObra;
  sheet.getCell('K9').value = obra.cidade;
  sheet.getCell('E10').value = obra.data;
  sheet.getCell('L10').value = obra.siMes;

  sheet.getCell('E14').value = solicitacao.inicioDesligamento;
  sheet.getCell('K14').value = solicitacao.numeroOperacional;
  sheet.getCell('N14').value = contarPorProtocolar(consumidores, 'NAO');

  sheet.getCell('E15').value = solicitacao.fimDesligamento;
  sheet.getCell('K15').value = solicitacao.numeroBarramento;
  sheet.getCell('N15').value = contarPorProtocolar(consumidores, 'SIM');
}

function clearConsumidorRow(sheet: ExcelJS.Worksheet, row: number) {
  sheet.getCell(`C${row}`).value = null;
  sheet.getCell(`D${row}`).value = null;
  sheet.getCell(`E${row}`).value = null;
  sheet.getCell(`F${row}`).value = null;
  sheet.getCell(`G${row}`).value = null;
}

function fillConsumidor(sheet: ExcelJS.Worksheet, row: number, consumidor: DesligamentoConsumidor) {
  sheet.getCell(`C${row}`).value = getTipoCliente(consumidor.protocolar);
  sheet.getCell(`D${row}`).value = consumidor.contaContrato;
  sheet.getCell(`E${row}`).value = consumidor.numeroMedidor;
  sheet.getCell(`F${row}`).value = consumidor.nomeCompleto;
  sheet.getCell(`G${row}`).value = consumidor.protocolar;
}

// Posições (0-indexed) de cada evidência na aba SINTESE
// Cada slot: coluna esquerda C=2, coluna direita I=8; linhas conforme o template
const EVIDENCIA_POSITIONS = [
  { tl: { col: 2, row: 21 }, br: { col: 7.99, row: 32.99 } }, // 1
  { tl: { col: 8, row: 21 }, br: { col: 13.99, row: 32.99 } }, // 2
  { tl: { col: 2, row: 34 }, br: { col: 7.99, row: 45.99 } }, // 3
  { tl: { col: 8, row: 34 }, br: { col: 13.99, row: 45.99 } }, // 4
  { tl: { col: 2, row: 47 }, br: { col: 7.99, row: 58.99 } }, // 5
  { tl: { col: 8, row: 47 }, br: { col: 13.99, row: 58.99 } }, // 6
  { tl: { col: 2, row: 60 }, br: { col: 7.99, row: 71.99 } }, // 7
  { tl: { col: 8, row: 60 }, br: { col: 13.99, row: 71.99 } }, // 8
];

function clearEvidenciaLabels(sheet: ExcelJS.Worksheet, index: number) {
  const pos = EVIDENCIA_POSITIONS[index];
  if (!pos) return;
  const startRow = pos.tl.row + 1; // converte de 0-indexed para 1-indexed
  const endRow = Math.floor(pos.br.row);
  const startCol = pos.tl.col + 1;
  const endCol = Math.floor(pos.br.col) + 1;
  for (let r = startRow; r <= endRow; r++) {
    for (let c = startCol; c <= endCol; c++) {
      sheet.getCell(r, c).value = null;
    }
  }
}

function getImageExtension(dataUrl: string): ExcelJS.ImageExtension {
  const match = dataUrl.match(/^data:image\/(\w+);base64,/);
  const ext = match?.[1]?.toLowerCase() ?? 'png';
  if (ext === 'jpg' || ext === 'jpeg') return 'jpeg';
  if (ext === 'gif') return 'gif';
  return 'png';
}

function insertEvidencias(
  workbook: ExcelJS.Workbook,
  sheet: ExcelJS.Worksheet,
  evidencias: (string | null)[],
) {
  evidencias.forEach((dataUrl, i) => {
    if (!dataUrl) return;
    const pos = EVIDENCIA_POSITIONS[i];
    if (!pos) return;

    clearEvidenciaLabels(sheet, i);

    const base64 = dataUrl.replace(/^data:image\/\w+;base64,/, '');
    const extension = getImageExtension(dataUrl);
    const imageId = workbook.addImage({ base64, extension });
    sheet.addImage(imageId, {
      tl: pos.tl as ExcelJS.Anchor,
      br: pos.br as ExcelJS.Anchor,
      editAs: 'twoCell',
    });
  });
}

export async function exportDesligamentoToExcel(
  obra: DesligamentoObra,
  solicitacao: DesligamentoSI,
  consumidores: DesligamentoConsumidor[],
  evidencias: (string | null)[] = [],
) {
  const templateBuffer = await loadTemplate();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(templateBuffer);

  const sintese = workbook.getWorksheet(SHEET_SINTESE);
  const consumidoresSheet = workbook.getWorksheet(SHEET_CONSUMIDORES);

  if (!sintese || !consumidoresSheet) {
    throw new Error('Abas do modelo de desligamento não encontradas.');
  }

  fillSintese(sintese, obra, solicitacao, consumidores);
  insertEvidencias(workbook, sintese, evidencias);

  for (let row = FIRST_DATA_ROW; row <= LAST_DATA_ROW; row++) {
    clearConsumidorRow(consumidoresSheet, row);
  }

  getConsumidoresDesligamentoPreenchidos(consumidores).forEach((consumidor, index) => {
    fillConsumidor(consumidoresSheet, FIRST_DATA_ROW + index, consumidor);
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const fileName = buildDesligamentoExportFileName(obra, 'xlsx');
  downloadBuffer(buffer, fileName);
  return fileName;
}
