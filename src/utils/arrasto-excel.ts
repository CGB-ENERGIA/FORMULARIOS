import type { ArrastoMaterial } from './arrasto-types';
import type { ArrastoObra } from '../stores/arrasto';
import {
  calcularArrastoEmKm,
  calcularPesoEmKg,
  calcularPesoEmT,
  calcularQtdACobrar,
  calcularValorRs,
} from './arrasto-helpers';
import { publicAsset } from './assets';
import { buildArrastoExportFileName } from './export-helpers';
import {
  loadSharedStringTable,
  loadWorkbookZip,
  patchWorksheet,
  removeArrastoToolbarButtons,
  removeCalcChain,
  setFormulaCellCachedValue,
  setNumberCell,
  setSharedStringCell,
  writeWorkbookZip,
  type SharedStringTable,
} from './xlsx-zip-patcher';

const TEMPLATE_URL = publicAsset('template/ARRASTO.xlsm');
const SHEET_SINTESE = 'xl/worksheets/sheet1.xml';
const SHEET_MATERIAIS = 'xl/worksheets/sheet3.xml';
const FIRST_MATERIAL_ROW = 6;
const LAST_MATERIAL_ROW = 111;

async function loadTemplate(): Promise<ArrayBuffer> {
  const response = await fetch(TEMPLATE_URL);
  if (!response.ok) {
    throw new Error('Modelo Excel de arrasto não encontrado.');
  }
  return response.arrayBuffer();
}

function downloadBuffer(buffer: ArrayBuffer, fileName: string) {
  const blob = new Blob([buffer], {
    type: 'application/vnd.ms-excel.sheet.macroEnabled.12',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

function setObraTextCell(
  xml: string,
  sharedStrings: SharedStringTable,
  ref: string,
  value: string,
) {
  const trimmed = value.trim();
  const index = trimmed ? sharedStrings.getOrAdd(trimmed) : null;
  return setSharedStringCell(xml, ref, value, index);
}

function patchSintese(
  xml: string,
  sharedStrings: SharedStringTable,
  obra: ArrastoObra,
  arrastoEmM: number,
  precoUnitario: number,
  pesoEmKg: number,
  pesoEmT: number,
  arrastoEmKm: number,
  qtdACobrar: number,
  valorRs: number,
) {
  let next = xml;
  next = setObraTextCell(next, sharedStrings, 'D8', obra.pep);
  next = setObraTextCell(next, sharedStrings, 'H8', obra.nota);
  next = setObraTextCell(next, sharedStrings, 'K8', obra.distrital);
  next = setObraTextCell(next, sharedStrings, 'N8', obra.reserva);
  next = setObraTextCell(next, sharedStrings, 'E9', obra.descricaoObra);
  next = setObraTextCell(next, sharedStrings, 'K9', obra.cidade);
  next = setNumberCell(next, 'K13', arrastoEmM);
  next = setNumberCell(next, 'F17', precoUnitario);
  next = setFormulaCellCachedValue(next, 'E13', pesoEmKg);
  next = setFormulaCellCachedValue(next, 'E15', pesoEmT);
  next = setFormulaCellCachedValue(next, 'K15', arrastoEmKm);
  next = setFormulaCellCachedValue(next, 'K17', qtdACobrar);
  next = setFormulaCellCachedValue(next, 'M17', valorRs);
  return next;
}

function patchMateriais(
  xml: string,
  quantidades: Record<number, number>,
  materiais: ArrastoMaterial[],
) {
  let next = xml;

  for (let row = FIRST_MATERIAL_ROW; row <= LAST_MATERIAL_ROW; row++) {
    next = setNumberCell(next, `H${row}`, null);
  }

  materiais.forEach((material) => {
    const quantidade = quantidades[material.id];
    if (!quantidade || quantidade <= 0) return;
    next = setNumberCell(next, `H${material.excelRow}`, quantidade);
  });

  return next;
}

export async function exportArrastoToExcel(
  obra: ArrastoObra,
  arrastoEmM: number,
  precoUnitario: number,
  quantidades: Record<number, number>,
  materiais: ArrastoMaterial[],
  _evidencias: (string | null)[] = [],
) {
  const templateBuffer = await loadTemplate();
  const zip = await loadWorkbookZip(templateBuffer);
  const sharedStrings = await loadSharedStringTable(zip);

  const pesoEmKg = calcularPesoEmKg(quantidades, materiais);
  const pesoEmT = calcularPesoEmT(pesoEmKg);
  const arrastoEmKm = calcularArrastoEmKm(arrastoEmM);
  const qtdACobrar = calcularQtdACobrar(pesoEmT, arrastoEmKm);
  const valorRs = calcularValorRs(qtdACobrar, precoUnitario);

  await patchWorksheet(zip, SHEET_SINTESE, (xml) =>
    patchSintese(
      xml,
      sharedStrings,
      obra,
      arrastoEmM,
      precoUnitario,
      pesoEmKg,
      pesoEmT,
      arrastoEmKm,
      qtdACobrar,
      valorRs,
    ),
  );
  zip.file('xl/sharedStrings.xml', sharedStrings.toXml());
  await patchWorksheet(zip, SHEET_MATERIAIS, (xml) => patchMateriais(xml, quantidades, materiais));
  await removeArrastoToolbarButtons(zip);
  await removeCalcChain(zip);

  const buffer = await writeWorkbookZip(zip);
  const fileName = buildArrastoExportFileName(obra);
  downloadBuffer(buffer, fileName);
  return fileName;
}
