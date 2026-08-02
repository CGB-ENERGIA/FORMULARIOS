import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import type { PodaCabecalho, PodaServico } from '../stores/poda';
import { servicoPreenchido } from '../stores/poda';
import { publicAsset } from './assets';
import { buildPodaExportFileName } from './export-helpers';
import { formatDistritalLabel } from './arrasto-helpers';
import { validatePodaCabecalho } from './poda-helpers';
import { savePdfWithWatermark } from './pdf-watermark';

const BANNER_URL = publicAsset('template/banner.png');

// ── Medidas portrait A4 (mm) ──────────────────────────────────────────────────
const PAGE_W   = 210;
const PAGE_H   = 297;
const MX       = 8;                        // margem horizontal
const CONT_W   = PAGE_W - MX * 2;          // 194 mm
const PHOTO_W  = (CONT_W - 4) / 2;        // ~95 mm por foto (gap 4 mm)
const PHOTO_H  = PHOTO_W * (9.6 / 12.8);  // ~71 mm — proporção do template
const SEC_H    = 6 + 6 + PHOTO_H + 4;     // altura de uma seção (≈ 87 mm)

// ── Cores ─────────────────────────────────────────────────────────────────────
const LBLUE: [number, number, number] = [189, 215, 238];
const DBLUE: [number, number, number] = [31,  73,  125];
const LGRAY: [number, number, number] = [242, 242, 242];
const GRAY:  [number, number, number] = [166, 166, 166];

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

// ── Cabeçalho (primeira página apenas) ───────────────────────────────────────
function drawHeader(doc: DocEx, banner: string, cabecalho: PodaCabecalho, y: number): number {
  doc.addImage(banner, 'PNG', MX, y, CONT_W, 18);
  y += 20;

  doc.setFillColor(...DBLUE);
  doc.rect(MX, y, CONT_W, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text('RELATÓRIO DE EVIDÊNCIAS DOS SERVIÇOS EXECUTADOS', PAGE_W / 2, y + 5.5, { align: 'center' });
  y += 10;

  autoTable(doc, {
    startY: y,
    margin: { left: MX, right: MX },
    tableWidth: CONT_W,
    theme: 'grid',
    styles: { fontSize: 6.5, cellPadding: 2, valign: 'middle', lineColor: GRAY, lineWidth: 0.2 },
    headStyles: {
      fillColor: LBLUE,
      textColor: DBLUE,
      fontStyle: 'bold',
      halign: 'center',
      fontSize: 7,
    },
    columnStyles: {
      0: { cellWidth: CONT_W / 3 },
      1: { cellWidth: CONT_W / 3 },
      2: { cellWidth: CONT_W / 3 },
    },
    head: [['PEP', 'BASE', 'CIDADE']],
    body: [[
      cabecalho.pep,
      formatDistritalLabel(cabecalho.base),
      cabecalho.cidade,
    ]],
  });

  y = (doc.lastAutoTable?.finalY ?? y + 8) + 0.5;

  autoTable(doc, {
    startY: y,
    margin: { left: MX, right: MX },
    tableWidth: CONT_W,
    theme: 'grid',
    styles: { fontSize: 6.5, cellPadding: 2, valign: 'top', lineColor: GRAY, lineWidth: 0.2 },
    headStyles: {
      fillColor: LBLUE,
      textColor: DBLUE,
      fontStyle: 'bold',
      halign: 'center',
      fontSize: 7,
    },
    head: [['DESCRIÇÃO DA OBRA']],
    body: [[cabecalho.descricaoObra]],
  });

  y = (doc.lastAutoTable?.finalY ?? y + 12) + 3;

  autoTable(doc, {
    startY: y,
    margin: { left: MX, right: MX },
    tableWidth: CONT_W,
    theme: 'grid',
    styles: { fontSize: 6.5, cellPadding: 2, valign: 'top', lineColor: GRAY, lineWidth: 0.2 },
    headStyles: {
      fillColor: LBLUE,
      textColor: DBLUE,
      fontStyle: 'bold',
      halign: 'center',
      fontSize: 7,
    },
    columnStyles: {
      0: { cellWidth: CONT_W / 2 },
      1: { cellWidth: CONT_W / 2 },
    },
    head: [['OBJETIVO', 'REGISTRO FOTOGRÁFICO']],
    body: [[
      'Comprovar a execução dos serviços prestados, bem como subsidiar a validação pela empresa contratante - EQTL MA da medição (atividade/quantidade) e a qualidade dos referidos serviços.',
      'Registro do cenário antes da execução dos serviços e depois para comprovação da execução. Fazer o registro de forma a se obter uma comparação do cenário antes e depois dos serviços prestados referentes à poda.',
    ]],
  });

  y = (doc.lastAutoTable?.finalY ?? y + 20) + 3;
  return y;
}

// ── Seção de evidência fotográfica (um par início/fim) ─────────────────────────
function drawEvidencia(
  doc: jsPDF,
  servico: PodaServico,
  regInicio: number,
  regFim: number,
  y: number,
): number {
  const xR = MX + PHOTO_W + 4; // x da coluna direita

  // "EVIDÊNCIAS FOTOGRÁFICAS:"
  doc.setFillColor(...LBLUE);
  doc.rect(MX, y, CONT_W, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...DBLUE);
  doc.text('EVIDÊNCIAS FOTOGRÁFICAS:', MX + 2, y + 4);
  y += 6;

  // Linha REG.NNN + rótulo
  const regL = `REG.${String(regInicio).padStart(3, '0')}`;
  const regR = `REG.${String(regFim).padStart(3, '0')}`;

  doc.setFillColor(...LGRAY);
  doc.rect(MX, y, PHOTO_W, 6, 'F');
  doc.rect(xR, y, PHOTO_W, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...DBLUE);
  doc.text(`${regL}  REGISTRO INÍCIO DOS TRABALHOS`, MX + 2, y + 4);
  doc.text(`${regR}  REGISTRO DO FIM DOS TRABALHOS`, xR + 2, y + 4);
  y += 6;

  // Área das fotos
  doc.setDrawColor(...GRAY);
  doc.rect(MX, y, PHOTO_W, PHOTO_H);
  doc.rect(xR, y, PHOTO_W, PHOTO_H);

  // Foto início
  if (servico.fotoInicio) {
    const fmt = servico.fotoInicio.startsWith('data:image/png') ? 'PNG' : 'JPEG';
    try { doc.addImage(servico.fotoInicio, fmt, MX + 0.5, y + 0.5, PHOTO_W - 1, PHOTO_H - 1); }
    catch { drawPlaceholder(doc, MX, y); }
  } else {
    drawPlaceholder(doc, MX, y);
  }

  // Foto fim
  if (servico.fotoFim) {
    const fmt = servico.fotoFim.startsWith('data:image/png') ? 'PNG' : 'JPEG';
    try { doc.addImage(servico.fotoFim, fmt, xR + 0.5, y + 0.5, PHOTO_W - 1, PHOTO_H - 1); }
    catch { drawPlaceholder(doc, xR, y); }
  } else {
    drawPlaceholder(doc, xR, y);
  }

  y += PHOTO_H + 4;
  return y;
}

function drawPlaceholder(doc: jsPDF, x: number, y: number) {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(180, 180, 180);
  doc.text('Sem foto', x + PHOTO_W / 2, y + PHOTO_H / 2, { align: 'center' });
  doc.setTextColor(0, 0, 0);
}

// ── Export principal ──────────────────────────────────────────────────────────
export async function exportPodaToPdf(
  cabecalho: PodaCabecalho,
  servicos: PodaServico[],
): Promise<string> {
  const cabecalhoErrors = validatePodaCabecalho(cabecalho);
  if (cabecalhoErrors.length > 0) {
    throw new Error(cabecalhoErrors[0]);
  }

  const preenchidos = servicos.filter(servicoPreenchido);
  if (preenchidos.length === 0) {
    throw new Error('Preencha ao menos um serviço antes de exportar.');
  }

  const banner = await loadBannerBase64();
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' }) as DocEx;

  let y = MX;
  let reg = 1;

  y = drawHeader(doc, banner, cabecalho, y);

  for (let i = 0; i < preenchidos.length; i++) {
    const s = preenchidos[i]!;

    // Nova página se não couber a seção inteira
    if (y + SEC_H > PAGE_H - MX) {
      doc.addPage();
      y = MX;
    }

    y = drawEvidencia(doc, s, reg, reg + 1, y);
    reg += 2;
  }

  // Rodapé e marca d'água aplicados em savePdfWithWatermark.

  const fileName = buildPodaExportFileName(cabecalho, 'pdf');
  return savePdfWithWatermark(doc, fileName);
}
