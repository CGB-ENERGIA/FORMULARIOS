import ExcelJS from 'exceljs';
import type { Consumidor, ObraInfo } from '../stores/consumidores';
import { consumidorPreenchido } from './consumidor-helpers';
import { buildExportFileName } from './export-helpers';

export { consumidorPreenchido } from './consumidor-helpers';

import { publicAsset } from './assets';

const TEMPLATE_URL = publicAsset('template/CONSUMIDORES.xlsx');
const BANNER_URL = publicAsset('template/banner.png');
const SHEET_NAME = 'CONSUMIDORES#';
const FIRST_DATA_ROW = 30;
const LAST_DATA_ROW = 524;

const CHECKBOX_COLUMNS = ['J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S'];

async function loadTemplate(): Promise<ArrayBuffer> {
  const response = await fetch(TEMPLATE_URL);
  if (!response.ok) {
    throw new Error('Modelo Excel não encontrado.');
  }
  return response.arrayBuffer();
}

async function loadBanner(): Promise<ArrayBuffer> {
  const response = await fetch(BANNER_URL);
  if (!response.ok) {
    throw new Error('Banner não encontrado.');
  }
  return response.arrayBuffer();
}

function replaceBannerImage(workbook: ExcelJS.Workbook, sheet: ExcelJS.Worksheet, bannerBuffer: ArrayBuffer) {
  const images = sheet.getImages();
  if (images.length === 0) {
    return;
  }

  const imageId = images[0].imageId;
  const media = workbook.model.media?.[imageId];
  if (!media) {
    return;
  }

  workbook.model.media[imageId] = {
    ...media,
    buffer: new Uint8Array(bannerBuffer),
    extension: 'png',
  };
}

function clearConsumerRow(sheet: ExcelJS.Worksheet, row: number) {
  sheet.getCell(`C${row}`).value = null;
  sheet.getCell(`I${row}`).value = null;
  sheet.getCell(`U${row}`).value = null;
  sheet.getCell(`V${row}`).value = null;

  for (const col of CHECKBOX_COLUMNS) {
    sheet.getCell(`${col}${row}`).value = null;
  }
}

function markCheckbox(sheet: ExcelJS.Worksheet, row: number, col: string) {
  sheet.getCell(`${col}${row}`).value = 'X';
}

function fillObraInfo(sheet: ExcelJS.Worksheet, obra: ObraInfo) {
  sheet.getCell('E14').value = obra.descricaoObra;
  sheet.getCell('E15').value = obra.fornecedor;
  sheet.getCell('O15').value = obra.tecObra;
  sheet.getCell('E16').value = obra.elementoPep;
  sheet.getCell('O16').value = obra.regional;
  sheet.getCell('E17').value = obra.dataConclusao;
  sheet.getCell('O17').value = obra.localidade;
  sheet.getCell('E18').value = obra.dataEnergizacao;
  sheet.getCell('O18').value = obra.municipio;
}

function fillConsumidor(sheet: ExcelJS.Worksheet, row: number, consumidor: Consumidor, dataObra: string) {
  sheet.getCell(`B${row}`).value = consumidor.id;
  sheet.getCell(`C${row}`).value = consumidor.nome;
  sheet.getCell(`I${row}`).value = consumidor.numeroMedidor;

  if (consumidor.tipoLigacao === 'MO') markCheckbox(sheet, row, 'J');
  if (consumidor.tipoLigacao === 'BI') markCheckbox(sheet, row, 'K');
  if (consumidor.tipoLigacao === 'TRI') markCheckbox(sheet, row, 'L');

  if (consumidor.padrao === '5M') markCheckbox(sheet, row, 'M');
  if (consumidor.padrao === '7M') markCheckbox(sheet, row, 'N');
  if (consumidor.padrao === 'CPP') markCheckbox(sheet, row, 'O');
  if (consumidor.padrao === 'PADRAO') markCheckbox(sheet, row, 'P');
  if (consumidor.padrao === 'KIT') markCheckbox(sheet, row, 'Q');

  if (consumidor.ramalDuplex === 'PADRAO') markCheckbox(sheet, row, 'P');
  if (consumidor.ramalDuplex === 'KIT') markCheckbox(sheet, row, 'Q');
  if (consumidor.ramalTriplex === 'PADRAO') markCheckbox(sheet, row, 'R');
  if (consumidor.ramalTriplex === 'KIT') markCheckbox(sheet, row, 'S');

  sheet.getCell(`U${row}`).value = consumidor.posteLigacao;
  sheet.getCell(`V${row}`).value = consumidor.dataLigacao || dataObra;
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

export async function exportToExcel(obra: ObraInfo, consumidores: Consumidor[]) {
  const [templateBuffer, bannerBuffer] = await Promise.all([loadTemplate(), loadBanner()]);
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(templateBuffer);

  const sheet = workbook.getWorksheet(SHEET_NAME);
  if (!sheet) {
    throw new Error('Aba CONSUMIDORES# não encontrada no modelo.');
  }

  replaceBannerImage(workbook, sheet, bannerBuffer);
  fillObraInfo(sheet, obra);

  for (let row = FIRST_DATA_ROW; row <= LAST_DATA_ROW; row++) {
    clearConsumerRow(sheet, row);
  }

  const dataObra = obra.dataEnergizacao || obra.dataConclusao;

  consumidores.forEach((consumidor, index) => {
    fillConsumidor(sheet, FIRST_DATA_ROW + index, consumidor, dataObra);
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const fileName = buildExportFileName(obra, 'xlsx');

  downloadBuffer(buffer, fileName);
  return fileName;
}
