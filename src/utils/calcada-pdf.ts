import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import type { CalcadaObra, CalcadaEvidencia } from '../stores/calcada';
import { evidenciaPreenchida } from '../stores/calcada';
import { calcularValorRs, formatBRL } from './calcada-helpers';
import { buildCalcadaExportFileName } from './export-helpers';
import { publicAsset } from './assets';

const BANNER_URL = publicAsset('template/banner.png');

// ── Medidas retrato A4 (mm) ───────────────────────────────────────────────────
const PAGE_W = 210;
const PAGE_H = 297;
const MX = 8;
const CONT_W = PAGE_W - MX * 2;       // 194
const PHOTO_W = (CONT_W - 4) / 2;     // ~95
const PHOTO_H = PHOTO_W * (9.6 / 12.8); // ~71
const BLOCO_H = 6 + PHOTO_H + 4;       // banner do bloco + foto + margem

// ── Cores ─────────────────────────────────────────────────────────────────────
const DBLUE: [number, number, number] = [31, 73, 125];
const LBLUE: [number, number, number] = [189, 215, 238];
const LGRAY: [number, number, number] = [242, 242, 242];
const GRAY: [number, number, number] = [166, 166, 166];

type DocEx = jsPDF & {
  lastAutoTable?: { finalY: number };
  internal: { getNumberOfPages(): number };
};

async function loadBannerBase64(): Promise<string> {
  const res = await fetch(BANNER_URL);
  if (!res.ok) throw new Error('Banner não encontrado.');
  const buf = await res.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]!);
  return `data:image/png;base64,${btoa(bin)}`;
}

function drawHeader(doc: DocEx, banner: string, obra: CalcadaObra, y: number): number {
  // Banner
  doc.addImage(banner, 'PNG', MX, y, CONT_W, 18);
  y += 20;

  // Título
  doc.setFillColor(...DBLUE);
  doc.rect(MX, y, CONT_W, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text('RELATÓRIO DE EVIDÊNCIAS — REPARO DE CALÇADA', PAGE_W / 2, y + 5.5, { align: 'center' });
  y += 10;

  const valorRs = calcularValorRs(obra.quantidade, obra.valorSap);

  // DADOS OBRA + DADOS REPARO em tabela
  autoTable(doc, {
    startY: y,
    margin: { left: MX, right: MX },
    tableWidth: CONT_W,
    theme: 'grid',
    styles: { fontSize: 7, cellPadding: 1.6, valign: 'middle', lineColor: GRAY, lineWidth: 0.2 },
    columnStyles: {
      0: { cellWidth: 28, fontStyle: 'bold', fillColor: LGRAY, textColor: DBLUE },
      1: { cellWidth: CONT_W / 2 - 28 },
      2: { cellWidth: 28, fontStyle: 'bold', fillColor: LGRAY, textColor: DBLUE },
      3: { cellWidth: CONT_W / 2 - 28 },
    },
    body: [
      ['PEP:', obra.pep || '—', 'NOTA:', obra.nota || '—'],
      ['DISTRITAL:', obra.distrital || '—', 'CIDADE:', obra.municipio || '—'],
      ['DESCRIÇÃO:', { content: obra.descricaoObra || '—', colSpan: 3 } as never],
      [
        'QUANTIDADE:', obra.quantidade != null ? `${obra.quantidade} m²` : '—',
        'VALOR SAP:', obra.valorSap != null ? formatBRL(obra.valorSap) : '—',
      ],
      ['VALOR R$:', { content: formatBRL(valorRs), colSpan: 3, styles: { fontStyle: 'bold' } } as never],
    ],
  });

  y = (doc.lastAutoTable?.finalY ?? y + 30) + 4;

  // Faixa EVIDÊNCIAS
  doc.setFillColor(...DBLUE);
  doc.rect(MX, y, CONT_W, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text('EVIDÊNCIAS FOTOGRÁFICAS', PAGE_W / 2, y + 4.1, { align: 'center' });
  y += 9;

  return y;
}

function drawPlaceholder(doc: jsPDF, x: number, y: number) {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(180, 180, 180);
  doc.text('Sem foto', x + PHOTO_W / 2, y + PHOTO_H / 2, { align: 'center' });
  doc.setTextColor(0, 0, 0);
}

function drawBloco(doc: jsPDF, evidencia: CalcadaEvidencia, y: number): number {
  const xR = MX + PHOTO_W + 4;

  // Linha PG + rótulos ANTES / DEPOIS
  doc.setFillColor(...LBLUE);
  doc.rect(MX, y, PHOTO_W, 6, 'F');
  doc.rect(xR, y, PHOTO_W, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...DBLUE);
  const pgTxt = evidencia.pg ? `  (PG: ${evidencia.pg})` : '';
  doc.text(`ANTES${pgTxt}`, MX + 2, y + 4);
  doc.text(`DEPOIS${pgTxt}`, xR + 2, y + 4);
  y += 6;

  // Áreas de foto
  doc.setDrawColor(...GRAY);
  doc.rect(MX, y, PHOTO_W, PHOTO_H);
  doc.rect(xR, y, PHOTO_W, PHOTO_H);

  if (evidencia.fotoAntes) {
    const fmt = evidencia.fotoAntes.startsWith('data:image/png') ? 'PNG' : 'JPEG';
    try { doc.addImage(evidencia.fotoAntes, fmt, MX + 0.5, y + 0.5, PHOTO_W - 1, PHOTO_H - 1); }
    catch { drawPlaceholder(doc, MX, y); }
  } else {
    drawPlaceholder(doc, MX, y);
  }

  if (evidencia.fotoDepois) {
    const fmt = evidencia.fotoDepois.startsWith('data:image/png') ? 'PNG' : 'JPEG';
    try { doc.addImage(evidencia.fotoDepois, fmt, xR + 0.5, y + 0.5, PHOTO_W - 1, PHOTO_H - 1); }
    catch { drawPlaceholder(doc, xR, y); }
  } else {
    drawPlaceholder(doc, xR, y);
  }

  y += PHOTO_H + 4;
  return y;
}

export async function exportCalcadaToPdf(
  obra: CalcadaObra,
  evidencias: CalcadaEvidencia[],
): Promise<string> {
  const preenchidas = evidencias.filter(evidenciaPreenchida);
  if (preenchidas.length === 0) {
    throw new Error('Adicione ao menos uma evidência antes de exportar.');
  }

  const banner = await loadBannerBase64();
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' }) as DocEx;

  let y = MX;
  y = drawHeader(doc, banner, obra, y);

  for (const evidencia of preenchidas) {
    if (y + BLOCO_H > PAGE_H - MX) {
      doc.addPage();
      y = MX;
    }
    y = drawBloco(doc, evidencia, y);
  }

  // Rodapé numerado
  const totalPages = doc.internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(150, 150, 150);
    doc.text(`Página ${p} / ${totalPages}`, PAGE_W / 2, PAGE_H - 4, { align: 'center' });
  }

  const fileName = buildCalcadaExportFileName(obra, 'pdf');
  doc.save(fileName);
  return fileName;
}
