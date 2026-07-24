import ExcelJS from 'exceljs';
import type { CadastroForm, PadraoEntrada } from '../stores/cadastro';
import { publicAsset } from './assets';
import { checkboxLabel, withLabel } from './cadastro-helpers';
import { buildCadastroExportFileName } from './export-helpers';

const TEMPLATE_URL = publicAsset('template/CADASTRO.xlsx');
const SHEET_NAME = 'CADASTRO';

async function loadTemplate(): Promise<ArrayBuffer> {
  const response = await fetch(TEMPLATE_URL);
  if (!response.ok) {
    throw new Error('Modelo Excel de cadastro não encontrado.');
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

function setCell(sheet: ExcelJS.Worksheet, ref: string, value: string | null) {
  sheet.getCell(ref).value = value === null || value === '' ? null : value;
}

function setLabeled(sheet: ExcelJS.Worksheet, ref: string, label: string, value: string) {
  sheet.getCell(ref).value = withLabel(label, value);
}

function setPadrao(sheet: ExcelJS.Worksheet, padrao: PadraoEntrada) {
  sheet.getCell('G6').value = checkboxLabel(
    padrao === 'existente',
    '(   )  PADRÃO EXISTENTE',
    '( X )  PADRÃO EXISTENTE',
  );
  sheet.getCell('G7').value = checkboxLabel(
    padrao === '5m',
    '(   )  PADRÃO 5M',
    '( X )  PADRÃO 5M',
  );
  sheet.getCell('G8').value = checkboxLabel(
    padrao === '7m',
    '(  )  PADRÃO 7M',
    '( X )  PADRÃO 7M',
  );
}

function fillForm(sheet: ExcelJS.Worksheet, form: CadastroForm) {
  // D3 = rótulo "CC"; valor vai ao lado (E3)
  setCell(sheet, 'E3', form.cc.trim() || null);
  setCell(sheet, 'B4', form.pep.trim() || null);
  setCell(sheet, 'B5', form.nome.trim() || null);
  setCell(sheet, 'B6', form.endereco.trim() || null);
  setPadrao(sheet, form.padrao);

  setLabeled(sheet, 'A21', 'Nº Comp: ', form.numComp);
  setLabeled(sheet, 'A22', 'Nº Poste: ', form.numPoste);
  setLabeled(sheet, 'A23', 'Med Inst: ', form.medInst);
  setLabeled(sheet, 'A24', 'Med Ant: ', form.medAnt);
  setLabeled(sheet, 'A26', 'Ligada Fase: ', form.ligadaFase);

  setLabeled(sheet, 'A30', 'POT: ', form.pot);
  setLabeled(sheet, 'A31', 'N° EQUATORIAL: ', form.numEquatorial);
  setLabeled(sheet, 'A36', 'FABRICANTE: ', form.fabricante);
  setLabeled(sheet, 'A37', 'DATA FABR: ', form.dataFabr);
  setLabeled(sheet, 'A38', 'Nº SÉRIE: ', form.numSerie);

  // C46 = rótulo; nome vai na linha de baixo (C47)
  setCell(sheet, 'C47', form.nomeResponsavel.trim() || null);

  setCell(sheet, 'A49', form.dataExecucao.trim() || null);
  setCell(sheet, 'C49', form.horaExecucao.trim() || null);
  setCell(sheet, 'E49', form.empresa.trim() || null);
}

export async function exportCadastroToExcel(form: CadastroForm) {
  const templateBuffer = await loadTemplate();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(templateBuffer);

  const sheet = workbook.getWorksheet(SHEET_NAME);
  if (!sheet) {
    throw new Error('Aba CADASTRO não encontrada no modelo.');
  }

  fillForm(sheet, form);

  const buffer = await workbook.xlsx.writeBuffer();
  const fileName = buildCadastroExportFileName(form);
  downloadBuffer(buffer as ArrayBuffer, fileName);
  return fileName;
}
