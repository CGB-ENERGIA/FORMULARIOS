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

async function buildCadastroExcelBuffer(clientes: CadastroForm[]): Promise<{
  buffer: ArrayBuffer;
  fileName: string;
}> {
  if (clientes.length === 0) {
    throw new Error('Nenhum cliente para exportar.');
  }

  const templateBuffer = await loadTemplate();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(templateBuffer);

  const firstSheet = workbook.getWorksheet(SHEET_NAME);
  if (!firstSheet) {
    throw new Error('Aba CADASTRO não encontrada no modelo.');
  }

  const sheetNames = uniqueSheetNames(clientes);
  firstSheet.name = sheetNames[0]!;
  fillForm(firstSheet, clientes[0]!);

  for (let index = 1; index < clientes.length; index++) {
    const sheet = await createFilledSheetClone(workbook, templateBuffer, sheetNames[index]!);
    fillForm(sheet, clientes[index]!);
  }

  const buffer = (await workbook.xlsx.writeBuffer()) as ArrayBuffer;
  const fileName = buildCadastroExportFileName(clientes[0]!);
  return { buffer, fileName };
}

export async function exportCadastroToExcel(clientes: CadastroForm[]) {
  const { buffer, fileName } = await buildCadastroExcelBuffer(clientes);
  downloadBuffer(buffer, fileName);
  return fileName;
}

/** Gera Excel + blob sem download (para persistir no módulo Clientes). */
export async function buildCadastroExcelBlob(
  clientes: CadastroForm[],
): Promise<{ blob: Blob; fileName: string }> {
  const { buffer, fileName } = await buildCadastroExcelBuffer(clientes);
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  return { blob, fileName };
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

  setCell(sheet, 'C47', form.nomeResponsavel.trim() || null);

  setCell(sheet, 'A49', form.dataExecucao.trim() || null);
  setCell(sheet, 'C49', form.horaExecucao.trim() || null);
  setCell(sheet, 'E49', form.empresa.trim() || null);
}

function sanitizeSheetName(value: string): string {
  return value.replace(/[:\\/?*\[\]]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 31);
}

function uniqueSheetNames(clientes: CadastroForm[]): string[] {
  const used = new Set<string>();

  return clientes.map((form, index) => {
    const base =
      sanitizeSheetName(form.nome) ||
      sanitizeSheetName(form.cc ? `CC ${form.cc}` : '') ||
      `Cliente ${index + 1}`;

    let name = base.slice(0, 31);
    let suffix = 2;
    while (used.has(name.toLowerCase())) {
      const tag = ` ${suffix}`;
      name = `${base.slice(0, Math.max(1, 31 - tag.length))}${tag}`;
      suffix += 1;
    }

    used.add(name.toLowerCase());
    return name;
  });
}

function copyWorksheet(source: ExcelJS.Worksheet, target: ExcelJS.Worksheet) {
  target.properties = { ...source.properties };
  target.pageSetup = JSON.parse(JSON.stringify(source.pageSetup ?? {}));
  target.views = source.views ? JSON.parse(JSON.stringify(source.views)) : [];

  source.columns.forEach((col, index) => {
    const targetCol = target.getColumn(index + 1);
    if (col.width != null) targetCol.width = col.width;
    if (col.hidden != null) targetCol.hidden = col.hidden;
  });

  source.eachRow({ includeEmpty: true }, (row, rowNumber) => {
    const targetRow = target.getRow(rowNumber);
    if (row.height != null) targetRow.height = row.height;
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      const targetCell = targetRow.getCell(colNumber);
      targetCell.value = cell.value;
      targetCell.style = JSON.parse(JSON.stringify(cell.style ?? {}));
      if (cell.numFmt) targetCell.numFmt = cell.numFmt;
    });
    targetRow.commit();
  });

  const merges = (source.model?.merges ?? []) as string[];
  merges.forEach((range) => {
    try {
      target.mergeCells(range);
    } catch {
      // Ignora merges já existentes.
    }
  });
}

async function createFilledSheetClone(
  workbook: ExcelJS.Workbook,
  templateBuffer: ArrayBuffer,
  sheetName: string,
): Promise<ExcelJS.Worksheet> {
  const tempWorkbook = new ExcelJS.Workbook();
  await tempWorkbook.xlsx.load(templateBuffer);
  const source = tempWorkbook.getWorksheet(SHEET_NAME);
  if (!source) {
    throw new Error('Aba CADASTRO não encontrada no modelo.');
  }

  const target = workbook.addWorksheet(sheetName);
  copyWorksheet(source, target);
  return target;
}
