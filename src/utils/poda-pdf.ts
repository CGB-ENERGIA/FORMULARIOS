import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import type { PodaObra, PodaServico } from '../stores/poda';
import { servicoPreenchido } from '../stores/poda';
import { publicAsset } from './assets';

const BANNER_URL = publicAsset('template/banner.png');

// ── Medidas (mm) ─────────────────────────────────────────────────────────────
const PAGE_W = 297;
const PAGE_H = 210;
const MARGIN = 10;
const CONTENT_W = PAGE_W - MARGIN * 2;
const PHOTO_W = (CONTENT_W - 6) / 2;   // duas fotos lado a lado com 6mm de gap
const PHOTO_H = PHOTO_W * (9.6 / 12.8); // proporção original do template

// ── Cores ─────────────────────────────────────────────────────────────────────
const BLUE: [number, number, number] = [21, 101, 192];
const LBLUE: [number, number, number] = [219, 234, 254];
const GRAY: [number, number, number] = [200, 200, 200];

type DocEx = jsPDF & { lastAutoTable?: { finalY: number } };

async function loadBannerBase64(): Promise<string> {
  const res = await fetch(BANNER_URL);
  if (!res.ok) throw new Error('Banner não encontrado.');
  const buf = await res.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]!);
  return `data:image/png;base64,${btoa(bin)}`;
}

function drawBanner(doc: jsPDF, banner: string, y: number): number {
  const bh = 18;
  doc.addImage(banner, 'PNG', MARGIN, y, CONTENT_W, bh);
  return y + bh + 3;
}

function drawObraTable(doc: DocEx, obra: PodaObra, y: number): number {
  autoTable(doc, {
    startY: y,
    theme: 'grid',
    margin: { left: MARGIN, right: MARGIN },
    tableWidth: CONTENT_W,
    styles: { fontSize: 7.5, cellPadding: 1.5, valign: 'middle', lineColor: GRAY, lineWidth: 0.2 },
    columnStyles: {
      0: { cellWidth: 28, fontStyle: 'bold' },
      1: { cellWidth: 60 },
      2: { cellWidth: 36, fontStyle: 'bold' },
      3: { cellWidth: 60 },
      4: { cellWidth: 26, fontStyle: 'bold' },
      5: { cellWidth: 67 },
    },
    body: [
      ['Regional', obra.regional || '—', 'Distribuidora', obra.distribuidora || '—', 'Equipe', obra.equipe || '—'],
      ['Contrato', obra.contrato || '—', 'Período', obra.periodoMedicao || '—', 'PEP', obra.elementoPep || '—'],
      ['Fornecedor', { content: obra.fornecedor || '—', colSpan: 5 }],
    ],
  });
  return (doc.lastAutoTable?.finalY ?? y + 18) + 4;
}

function drawPhotoBlock(
  doc: jsPDF,
  label: string,
  sublabel: string,
  foto: string,
  x: number,
  y: number,
) {
  // Cabeçalho do bloco
  doc.setFillColor(...LBLUE);
  doc.rect(x, y, PHOTO_W, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...BLUE);
  doc.text(label, x + PHOTO_W / 2, y + 4.5, { align: 'center' });

  // Sub-label (referência + data)
  const subY = y + 7;
  doc.setFillColor(245, 245, 245);
  doc.rect(x, subY, PHOTO_W, 5, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(80, 80, 80);
  doc.text(sublabel, x + PHOTO_W / 2, subY + 3.5, { align: 'center' });

  // Área da foto
  const fotoY = subY + 5;
  doc.setDrawColor(...GRAY);
  doc.rect(x, fotoY, PHOTO_W, PHOTO_H);

  if (foto) {
    const fmt = foto.startsWith('data:image/png') ? 'PNG' : 'JPEG';
    try {
      doc.addImage(foto, fmt, x + 0.5, fotoY + 0.5, PHOTO_W - 1, PHOTO_H - 1);
    } catch {
      drawPhotoPlaceholder(doc, x, fotoY);
    }
  } else {
    drawPhotoPlaceholder(doc, x, fotoY);
  }
}

function drawPhotoPlaceholder(doc: jsPDF, x: number, y: number) {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(180, 180, 180);
  doc.text('Sem foto', x + PHOTO_W / 2, y + PHOTO_H / 2, { align: 'center' });
  doc.setTextColor(0, 0, 0);
}

function drawServico(
  doc: jsPDF,
  servico: PodaServico,
  y: number,
) {
  const xLeft  = MARGIN;
  const xRight = MARGIN + PHOTO_W + 6;
  const sublabel = `Ref: ${servico.referencia || '—'}   |   Data: ${servico.data || '—'}`;

  drawPhotoBlock(doc, 'REGISTRO INÍCIO DOS TRABALHOS', sublabel, servico.fotoInicio, xLeft, y);
  drawPhotoBlock(doc, 'REGISTRO FIM DOS TRABALHOS',   sublabel, servico.fotoFim,    xRight, y);

  return y + 7 + 5 + PHOTO_H; // header + sublabel + photo
}

export async function exportPodaToPdf(obra: PodaObra, servicos: PodaServico[]): Promise<string> {
  const preenchidos = servicos.filter(servicoPreenchido);
  if (preenchidos.length === 0) {
    throw new Error('Preencha ao menos um serviço antes de exportar.');
  }

  const banner = await loadBannerBase64();
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' }) as DocEx;

  // ── Primeira página: banner + obra + primeiros serviços ───────────────────────
  let y = MARGIN;
  y = drawBanner(doc, banner, y);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...BLUE);
  doc.text('Relatório de Evidências dos Serviços Executados — PODA', PAGE_W / 2, y + 4, { align: 'center' });
  y += 8;

  y = drawObraTable(doc, obra, y);

  // Altura disponível para serviços nesta página
  const blockH = 7 + 5 + PHOTO_H + 5; // header + sub + foto + gap

  for (let i = 0; i < preenchidos.length; i++) {
    const s = preenchidos[i]!;

    // Nova página se não couber
    if (y + blockH > PAGE_H - MARGIN) {
      doc.addPage();
      y = MARGIN;
    }

    // Número do serviço
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(60, 60, 60);
    doc.text(`Serviço ${s.id}`, MARGIN, y + 3.5);
    y += 5;

    y = drawServico(doc, s, y);
    y += 5; // gap entre serviços
  }

  // ── Rodapé em todas as páginas ────────────────────────────────────────────────
  const totalPages = (doc as jsPDF & { internal: { getNumberOfPages(): number } }).internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Página ${p} / ${totalPages}   —   ${obra.elementoPep || 'PODA'}   —   ${obra.periodoMedicao || ''}`,
      PAGE_W / 2,
      PAGE_H - 4,
      { align: 'center' },
    );
  }

  // ── Download ──────────────────────────────────────────────────────────────────
  const pep = (obra.elementoPep || 'PODA').replace(/\s+/g, '_');
  const period = (obra.periodoMedicao || 'export').replace(/\./g, '').replace(/\s/g, '');
  const fileName = `PODA_${pep}_${period}.pdf`;
  doc.save(fileName);
  return fileName;
}
