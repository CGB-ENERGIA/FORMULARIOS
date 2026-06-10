import ExcelJS from 'exceljs';
import type { PodaServico } from '../stores/poda';
import { servicoPreenchido } from '../stores/poda';

export async function exportPodaToExcel(servicos: PodaServico[]): Promise<string> {
  const preenchidos = servicos.filter(servicoPreenchido);
  if (preenchidos.length === 0) {
    throw new Error('Preencha ao menos um serviço antes de exportar.');
  }

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('PODA');

  // ── Título ───────────────────────────────────────────────────────────────────
  ws.mergeCells('A1:E1');
  const title = ws.getCell('A1');
  title.value = 'RELATÓRIO DE EVIDÊNCIAS DOS SERVIÇOS EXECUTADOS — PODA';
  title.font = { bold: true, size: 13, color: { argb: 'FF1565C0' } };
  title.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(1).height = 24;

  // ── Cabeçalho da tabela ──────────────────────────────────────────────────────
  const colHeaders = ['Nº', 'Data', 'Referência', 'Foto Início', 'Foto Fim'];
  colHeaders.forEach((h, i) => {
    const cell = ws.getCell(3, i + 1);
    cell.value = h;
    cell.font = { bold: true, size: 9 };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDBEAFE' } };
    cell.border = {
      top: { style: 'thin' }, bottom: { style: 'thin' },
      left: { style: 'thin' }, right: { style: 'thin' },
    };
  });
  ws.getRow(3).height = 18;

  // ── Linhas de serviços ───────────────────────────────────────────────────────
  preenchidos.forEach((s, i) => {
    const r = 4 + i;
    const rowData = [
      s.id,
      s.data,
      s.referencia,
      s.fotoInicio ? '(foto anexada)' : '',
      s.fotoFim    ? '(foto anexada)' : '',
    ];
    rowData.forEach((val, col) => {
      const cell = ws.getCell(r, col + 1);
      cell.value = val;
      cell.font = { size: 9 };
      cell.alignment = { horizontal: col === 0 ? 'center' : 'left', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin' }, bottom: { style: 'thin' },
        left: { style: 'thin' }, right: { style: 'thin' },
      };
    });
    ws.getRow(r).height = 16;
  });

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
  const ts = new Date().toISOString().slice(0, 10);
  a.download = `PODA_${ts}.xlsx`;
  a.href = url;
  a.click();
  URL.revokeObjectURL(url);
  return a.download;
}
