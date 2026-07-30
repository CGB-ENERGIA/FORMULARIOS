import ExcelJS from 'exceljs';
import type { CusteioCabecalho, CusteioServico } from '../stores/custeio';
import { servicoPreenchido } from '../stores/custeio';
import { publicAsset } from './assets';
import { buildCusteioExportFileName } from './export-helpers';
import { formatDistritalLabel } from './arrasto-helpers';

const TEMPLATE_URL = publicAsset('template/RELATORIO_DE_PODAS.xlsx');

const INSERTED_HEADER_ROWS = 3;
const FIRST_BANNER_ROW_EXCEL = 6 + INSERTED_HEADER_ROWS;
const BLOCK_SIZE = 25;
const PHOTO_OFFSET = 5;
const PHOTO_ROWS = 20;

function photoRows(n: number): { tl: number; br: number } {
  const tl = (FIRST_BANNER_ROW_EXCEL - 1) + PHOTO_OFFSET + (n - 1) * BLOCK_SIZE;
  return { tl, br: tl + PHOTO_ROWS };
}

function parseDataUrl(
  dataUrl: string,
): { base64: string; extension: 'jpeg' | 'png' } | null {
  const m = dataUrl.match(/^data:image\/(jpeg|jpg|png);base64,(.+)$/);
  if (!m || !m[2]) return null;
  return {
    extension: m[1] === 'jpg' ? 'jpeg' : (m[1] as 'jpeg' | 'png'),
    base64: m[2],
  };
}

function fillCabecalho(ws: ExcelJS.Worksheet, cabecalho: CusteioCabecalho) {
  ws.spliceRows(4, 0, [], [], []);

  ws.mergeCells('B4:E4');
  ws.mergeCells('F4:I4');
  ws.mergeCells('J4:M4');
  ws.mergeCells('N4:Q4');
  ws.mergeCells('B5:E5');
  ws.mergeCells('F5:Q5');

  const labelStyle: Partial<ExcelJS.Style> = {
    font: { bold: true, size: 9, color: { argb: 'FF1F497D' } },
    alignment: { vertical: 'middle', horizontal: 'center', wrapText: true },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFBDD7EE' } },
    border: {
      top: { style: 'thin' }, left: { style: 'thin' },
      bottom: { style: 'thin' }, right: { style: 'thin' },
    },
  };

  const valueStyle: Partial<ExcelJS.Style> = {
    font: { size: 9 },
    alignment: { vertical: 'middle', horizontal: 'left', wrapText: true },
    border: {
      top: { style: 'thin' }, left: { style: 'thin' },
      bottom: { style: 'thin' }, right: { style: 'thin' },
    },
  };

  const setCell = (addr: string, value: string, style: Partial<ExcelJS.Style>) => {
    const cell = ws.getCell(addr);
    cell.value = value;
    Object.assign(cell, { style: { ...cell.style, ...style } });
  };

  setCell('B4', 'BASE', labelStyle);
  setCell('F4', 'MUNICÍPIO', labelStyle);
  setCell('J4', 'ORDEM/INCIDENTE', labelStyle);
  setCell('N4', 'COMPONENTE OU PG', labelStyle);

  ws.mergeCells('B5:E5');
  ws.mergeCells('F5:I5');
  ws.mergeCells('J5:M5');
  ws.mergeCells('N5:Q5');

  setCell('B5', formatDistritalLabel(cabecalho.base), valueStyle);
  setCell('F5', cabecalho.municipio, valueStyle);
  setCell('J5', cabecalho.ordemIncidente, valueStyle);
  setCell('N5', cabecalho.componenteOuPg, valueStyle);

  ws.mergeCells('B6:C6');
  ws.mergeCells('D6:Q6');
  setCell('B6', 'OBSERVAÇÃO', labelStyle);
  setCell('D6', cabecalho.observacao, valueStyle);
}

export async function exportCusteioToExcel(
  cabecalho: CusteioCabecalho,
  servicos: CusteioServico[],
): Promise<string> {
  const preenchidos = servicos.filter(servicoPreenchido);
  if (preenchidos.length === 0) {
    throw new Error('Preencha ao menos um serviço antes de exportar.');
  }

  const res = await fetch(TEMPLATE_URL);
  if (!res.ok) throw new Error(`Template não encontrado (${res.status}).`);
  const templateBuffer = await res.arrayBuffer();

  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(templateBuffer);

  const ws =
    wb.worksheets.find((s) => s.name.toUpperCase().includes('EVID')) ??
    wb.worksheets[1];
  if (!ws) throw new Error('Aba EVIDÊNCIAS não encontrada no template.');

  fillCabecalho(ws, cabecalho);

  preenchidos.forEach((s, i) => {
    const { tl, br } = photoRows(i + 1);

    if (s.fotoInicio) {
      const parsed = parseDataUrl(s.fotoInicio);
      if (parsed) {
        const imgId = wb.addImage({ base64: parsed.base64, extension: parsed.extension });
        ws.addImage(imgId, {
          tl: { col: 1, row: tl },
          br: { col: 9, row: br },
          editAs: 'twoCell',
        } as ExcelJS.ImageRange);
      }
    }

    if (s.fotoFim) {
      const parsed = parseDataUrl(s.fotoFim);
      if (parsed) {
        const imgId = wb.addImage({ base64: parsed.base64, extension: parsed.extension });
        ws.addImage(imgId, {
          tl: { col: 9, row: tl },
          br: { col: 17, row: br },
          editAs: 'twoCell',
        } as ExcelJS.ImageRange);
      }
    }
  });

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const fileName = buildCusteioExportFileName(cabecalho, 'xlsx');
  a.download = fileName;
  a.href = url;
  a.click();
  URL.revokeObjectURL(url);
  return fileName;
}
