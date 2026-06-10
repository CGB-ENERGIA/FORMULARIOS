import ExcelJS from 'exceljs';
import type { PodaServico } from '../stores/poda';
import { servicoPreenchido } from '../stores/poda';
import { publicAsset } from './assets';

const TEMPLATE_URL = publicAsset('template/RELATORIO_DE_PODAS.xlsx');

// ── Layout do template EVIDÊNCIAS ─────────────────────────────────────────────
// Bloco 1: linhas Excel 6-30  → fotos em B11:I30 / J11:Q30
// Bloco 2: linhas Excel 31-55 → fotos em B36:I55 / J36:Q55
// Padrão: cada bloco = 25 linhas; foto começa 5 linhas após o banner do bloco.
//
// ExcelJS usa índices 0-based para col/row:
//   col B (Excel 2) → 1   col I (Excel 9) → 8  (exclusive: 9)
//   col J (Excel 10)→ 9   col Q (Excel 17)→ 16 (exclusive: 17)
const FIRST_BANNER_ROW_EXCEL = 6;  // linha 1-based da primeira "EVIDÊNCIAS FOTOGRÁFICAS:"
const BLOCK_SIZE              = 25; // linhas por bloco
const PHOTO_OFFSET            = 5;  // linhas do banner até a área de foto (dentro do bloco)
const PHOTO_ROWS              = 20; // linhas que a área de foto ocupa

/** Retorna os índices 0-based ExcelJS (tl/br) para o bloco N (1-based). */
function photoRows(n: number): { tl: number; br: number } {
  // tl (0-based) = (banner_1based - 1) + offset + (n-1)*blockSize
  const tl = (FIRST_BANNER_ROW_EXCEL - 1) + PHOTO_OFFSET + (n - 1) * BLOCK_SIZE;
  return { tl, br: tl + PHOTO_ROWS };
}

/** Extrai base64 puro + extensão de um data URL. */
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

export async function exportPodaToExcel(servicos: PodaServico[]): Promise<string> {
  const preenchidos = servicos.filter(servicoPreenchido);
  if (preenchidos.length === 0) {
    throw new Error('Preencha ao menos um serviço antes de exportar.');
  }

  // ── Carrega o template ────────────────────────────────────────────────────────
  const res = await fetch(TEMPLATE_URL);
  if (!res.ok) throw new Error(`Template não encontrado (${res.status}).`);
  const templateBuffer = await res.arrayBuffer();

  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(templateBuffer);

  // Localiza a aba EVIDÊNCIAS (segunda aba, nome contém "EVID")
  const ws =
    wb.worksheets.find((s) => s.name.toUpperCase().includes('EVID')) ??
    wb.worksheets[1];
  if (!ws) throw new Error('Aba EVIDÊNCIAS não encontrada no template.');

  // ── Injeta fotos em cada bloco ────────────────────────────────────────────────
  preenchidos.forEach((s, i) => {
    const { tl, br } = photoRows(i + 1);

    // Foto Início → colunas B-I (0-based: 1 a 9)
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

    // Foto Fim → colunas J-Q (0-based: 9 a 17)
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

  // ── Download ──────────────────────────────────────────────────────────────────
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const ts = new Date().toISOString().slice(0, 10);
  a.download = `RELATORIO_DE_PODAS_${ts}.xlsx`;
  a.href = url;
  a.click();
  URL.revokeObjectURL(url);
  return a.download;
}
