import ExcelJS from 'exceljs';
import type { PodaObra, PodaServico } from '../stores/poda';
import { servicoPreenchido } from '../stores/poda';

function labelCell(ws: ExcelJS.Worksheet, addr: string, value: string) {
  const cell = ws.getCell(addr);
  cell.value = value;
  cell.font = { bold: true, size: 9 };
  cell.alignment = { vertical: 'middle' };
}

function valueCell(ws: ExcelJS.Worksheet, addr: string, value: string) {
  const cell = ws.getCell(addr);
  cell.value = value;
  cell.font = { size: 9 };
  cell.alignment = { vertical: 'middle' };
}

export async function exportPodaToExcel(obra: PodaObra, servicos: PodaServico[]): Promise<string> {
  const preenchidos = servicos.filter(servicoPreenchido);
  if (preenchidos.length === 0) {
    throw new Error('Preencha ao menos um serviço antes de exportar.');
  }

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('PODA');

  // ── Título ───────────────────────────────────────────────────────────────────
  ws.mergeCells('A1:F1');
  const title = ws.getCell('A1');
  title.value = 'RELATÓRIO DE EVIDÊNCIAS DOS SERVIÇOS EXECUTADOS — PODA';
  title.font = { bold: true, size: 13, color: { argb: 'FF1565C0' } };
  title.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(1).height = 24;

  // ── Cabeçalho da obra ────────────────────────────────────────────────────────
  const headerRows: [string, string, string, string][] = [
    ['Regional:', obra.regional,        'Distribuidora:',      obra.distribuidora],
    ['Contrato:', obra.contrato,         'Período de Medição:', obra.periodoMedicao],
    ['Fornecedor:', obra.fornecedor,     'Equipe:',             obra.equipe],
    ['Elemento PEP:', obra.elementoPep,  '',                    ''],
  ];

  let r = 3;
  for (const [l1, v1, l2, v2] of headerRows) {
    labelCell(ws, `A${r}`, l1);
    valueCell(ws, `B${r}`, v1);
    ws.mergeCells(`B${r}:C${r}`);
    labelCell(ws, `D${r}`, l2);
    valueCell(ws, `E${r}`, v2);
    ws.mergeCells(`E${r}:F${r}`);
    ws.getRow(r).height = 16;
    r++;
  }

  // ── Cabeçalho da tabela ──────────────────────────────────────────────────────
  r += 1;
  const colHeaders = ['Nº', 'Data', 'Referência', 'Foto Início', 'Foto Fim'];
  colHeaders.forEach((h, i) => {
    const cell = ws.getCell(r, i + 1);
    cell.value = h;
    cell.font = { bold: true, size: 9 };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDBEAFE' } };
    cell.border = {
      top: { style: 'thin' }, bottom: { style: 'thin' },
      left: { style: 'thin' }, right: { style: 'thin' },
    };
  });
  ws.getRow(r).height = 18;
  r++;

  // ── Linhas de serviços ───────────────────────────────────────────────────────
  for (const s of preenchidos) {
    const rowData = [
      s.id,
      s.data,
      s.referencia,
      s.fotoInicio ? '(foto anexada)' : '',
      s.fotoFim    ? '(foto anexada)' : '',
    ];
    rowData.forEach((val, i) => {
      const cell = ws.getCell(r, i + 1);
      cell.value = val;
      cell.font = { size: 9 };
      cell.alignment = { horizontal: i === 0 ? 'center' : 'left', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin' }, bottom: { style: 'thin' },
        left: { style: 'thin' }, right: { style: 'thin' },
      };
    });
    ws.getRow(r).height = 16;
    r++;
  }

  // ── Largura das colunas ──────────────────────────────────────────────────────
  ws.columns = [
    { width: 6 }, { width: 14 }, { width: 20 }, { width: 18 }, { width: 18 },
  ];

  // ── Download ─────────────────────────────────────────────────────────────────
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const pep = (obra.elementoPep || 'PODA').replace(/\s+/g, '_');
  const period = (obra.periodoMedicao || 'export').replace(/\./g, '').replace(/\s/g, '');
  a.download = `PODA_${pep}_${period}.xlsx`;
  a.href = url;
  a.click();
  URL.revokeObjectURL(url);
  return a.download;
}
