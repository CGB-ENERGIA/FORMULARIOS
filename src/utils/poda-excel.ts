import ExcelJS from 'exceljs';
import type { PodaServico } from '../stores/poda';
import { servicoPreenchido } from '../stores/poda';

/** Extrai base64 puro + extensão de um data URL */
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

const THIN: Partial<ExcelJS.Border> = { style: 'thin' };
const BORDER = { top: THIN, bottom: THIN, left: THIN, right: THIN };

// Altura da linha de foto em "pontos" Excel (1 pt ≈ 1.33 px)
const PHOTO_ROW_H = 170; // ~227 px

export async function exportPodaToExcel(servicos: PodaServico[]): Promise<string> {
  const preenchidos = servicos.filter(servicoPreenchido);
  if (preenchidos.length === 0) {
    throw new Error('Preencha ao menos um serviço antes de exportar.');
  }

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('PODA');

  // ── Larguras das colunas ──────────────────────────────────────────────────────
  ws.columns = [
    { width: 6  }, // A: Nº
    { width: 32 }, // B: Foto Início
    { width: 32 }, // C: Foto Fim
  ];

  // ── Título ────────────────────────────────────────────────────────────────────
  ws.mergeCells('A1:C1');
  const title = ws.getCell('A1');
  title.value = 'RELATÓRIO DE EVIDÊNCIAS DOS SERVIÇOS EXECUTADOS';
  title.font = { bold: true, size: 13, color: { argb: 'FF1F497D' } };
  title.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(1).height = 26;

  // ── Cabeçalhos (linha 3) ──────────────────────────────────────────────────────
  (['Nº', 'Foto Início', 'Foto Fim'] as const).forEach((h, i) => {
    const cell = ws.getCell(3, i + 1);
    cell.value = h;
    cell.font = { bold: true, size: 9 };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFBDD7EE' } };
    cell.border = BORDER;
  });
  ws.getRow(3).height = 18;

  // ── Linhas de serviço (fotos embutidas) ───────────────────────────────────────
  preenchidos.forEach((s, i) => {
    const rowNum = 4 + i;       // 1-based Excel row
    const rowIdx = rowNum - 1;  // 0-based para addImage

    // Célula Nº
    const numCell = ws.getCell(rowNum, 1);
    numCell.value = s.id;
    numCell.font = { size: 9, bold: true };
    numCell.alignment = { horizontal: 'center', vertical: 'middle' };
    numCell.border = BORDER;

    // Bordas das células de foto (sem texto)
    ws.getCell(rowNum, 2).border = BORDER;
    ws.getCell(rowNum, 3).border = BORDER;

    ws.getRow(rowNum).height = PHOTO_ROW_H;

    // ── Foto Início ──────────────────────────────────────────────────────────────
    if (s.fotoInicio) {
      const parsed = parseDataUrl(s.fotoInicio);
      if (parsed) {
        const imgId = wb.addImage({ base64: parsed.base64, extension: parsed.extension });
        ws.addImage(imgId, {
          tl: { col: 1, row: rowIdx },
          br: { col: 2, row: rowIdx + 1 },
          editAs: 'twoCell',
        } as ExcelJS.ImageRange);
      }
    }

    // ── Foto Fim ─────────────────────────────────────────────────────────────────
    if (s.fotoFim) {
      const parsed = parseDataUrl(s.fotoFim);
      if (parsed) {
        const imgId = wb.addImage({ base64: parsed.base64, extension: parsed.extension });
        ws.addImage(imgId, {
          tl: { col: 2, row: rowIdx },
          br: { col: 3, row: rowIdx + 1 },
          editAs: 'twoCell',
        } as ExcelJS.ImageRange);
      }
    }
  });

  // ── Download ──────────────────────────────────────────────────────────────────
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
