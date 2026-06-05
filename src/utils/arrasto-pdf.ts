import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import type { ArrastoObra } from '../stores/arrasto';
import {
  calcularArrastoEmKm,
  calcularPesoEmKg,
  calcularPesoEmT,
  calcularQtdACobrar,
  calcularTotalLinha,
  calcularValorRs,
  formatDistritalLabel,
  formatNumeroBr,
} from './arrasto-helpers';
import type { ArrastoMaterial } from './arrasto-types';
import { publicAsset } from './assets';
import { buildArrastoExportFileName } from './export-helpers';

const BANNER_URL = publicAsset('template/banner.png');

const GRAY: [number, number, number] = [242, 242, 242];
const LBLUE: [number, number, number] = [220, 230, 241];
const RED: [number, number, number] = [192, 0, 0];
const BLACK: [number, number, number] = [0, 0, 0];
const WHITE: [number, number, number] = [255, 255, 255];

const ORIG_X0 = 58;
const ORIG_X1 = 491;
const NEW_X0 = 15;
const NEW_X1 = 580;
const ORIG_Y0 = 83;
const NEW_Y0 = 10;

const xScale = (NEW_X1 - NEW_X0) / (ORIG_X1 - ORIG_X0);
const yOff = NEW_Y0 - ORIG_Y0;

const tx = (x: number) => NEW_X0 + (x - ORIG_X0) * xScale;
const ty = (y: number) => y + yOff;

const EV_START = ty(205);
const PAGE_BOTTOM = 830;
const EV_ROWS = 4;
const EV_H = Math.floor((PAGE_BOTTOM - EV_START) / EV_ROWS);

type DocEx = jsPDF & { lastAutoTable?: { finalY: number } };

interface CellOpts {
  fill?: [number, number, number];
  text?: string;
  color?: [number, number, number];
  bold?: boolean;
  align?: 'left' | 'center';
  size?: number;
}

async function loadBannerBase64(): Promise<string> {
  const res = await fetch(BANNER_URL);
  if (!res.ok) throw new Error('Banner não encontrado.');
  const buf = await res.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]!);
  return `data:image/png;base64,${btoa(bin)}`;
}

function drawCell(
  doc: jsPDF,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  o: CellOpts = {},
) {
  const w = x1 - x0;
  const h = y1 - y0;
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.4);
  if (o.fill) {
    doc.setFillColor(...o.fill);
    doc.rect(x0, y0, w, h, 'FD');
  } else {
    doc.rect(x0, y0, w, h, 'D');
  }

  if (o.text) {
    let fs = o.size ?? 7;
    doc.setFont('helvetica', o.bold ? 'bold' : 'normal');
    doc.setTextColor(...(o.color ?? BLACK));
    doc.setFontSize(fs);
    while (doc.getTextWidth(o.text) > w - 5 && fs > 4) {
      fs -= 0.25;
      doc.setFontSize(fs);
    }
    const textY = y0 + h / 2 + fs * 0.35;
    if (o.align === 'center') doc.text(o.text, x0 + w / 2, textY, { align: 'center' });
    else doc.text(o.text, x0 + 3, textY);
  }
}

function sectionBar(doc: jsPDF, y0: number, y1: number, label: string) {
  drawCell(doc, NEW_X0, y0, NEW_X1, y1, {
    fill: GRAY,
    text: label,
    bold: true,
    align: 'center',
    size: 8,
  });
}

function vertLabel(doc: jsPDF, x0: number, y0: number, x1: number, y1: number, text: string) {
  drawCell(doc, x0, y0, x1, y1, { fill: GRAY });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...BLACK);
  const chars = text.split('');
  const lh = 8.5;
  let cy = y0 + (y1 - y0 - chars.length * lh) / 2 + 7;
  const cx = x0 + (x1 - x0) / 2;
  for (const ch of chars) {
    doc.text(ch, cx, cy, { align: 'center' });
    cy += lh;
  }
}

function drawEvidImg(
  doc: jsPDF,
  src: string | null | undefined,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
) {
  if (!src) return;
  try {
    doc.addImage(src, x0 + 1, y0 + 1, x1 - x0 - 2, y1 - y0 - 2);
  } catch {
    /* ignore invalid image */
  }
}

function formatMoeda(value: number): string {
  return `R$ ${formatNumeroBr(value, 2)}`;
}

const L = { color: BLACK as [number, number, number], bold: true } as const;
const V = { color: RED as [number, number, number] } as const;

export async function exportArrastoToPdf(
  obra: ArrastoObra,
  arrastoEmM: number,
  precoUnitario: number,
  quantidades: Record<number, number>,
  materiais: ArrastoMaterial[],
  evidencias: (string | null)[],
) {
  const pesoEmKg = calcularPesoEmKg(quantidades, materiais);
  const pesoEmT = calcularPesoEmT(pesoEmKg);
  const arrastoEmKm = calcularArrastoEmKm(arrastoEmM);
  const qtdACobrar = calcularQtdACobrar(pesoEmT, arrastoEmKm);
  const valorRs = calcularValorRs(qtdACobrar, precoUnitario);
  const banner = await loadBannerBase64();

  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' }) as DocEx;

  const hTop = ty(83);
  const hBot = ty(106);
  const logoW = tx(164) - NEW_X0;
  drawCell(doc, NEW_X0, hTop, tx(164), hBot, {});
  drawCell(doc, tx(164), hTop, NEW_X1, hBot, {
    text: 'MEMÓRIA DE CÁLCULO ARRASTO DE MATERIAIS',
    bold: true,
    align: 'center',
    size: 10,
  });
  try {
    doc.addImage(banner, 'PNG', NEW_X0 + 2, hTop + 2, logoW - 4, hBot - hTop - 4);
  } catch {
    /* ignore */
  }

  sectionBar(doc, ty(108), ty(116), 'DADOS OBRA');

  const r1t = ty(119);
  const r1b = ty(127);
  drawCell(doc, tx(58), r1t, tx(91), r1b, { fill: GRAY, text: 'PEP:', ...L, size: 6.5 });
  drawCell(doc, tx(91), r1t, tx(164), r1b, { text: obra.pep, ...V });
  drawCell(doc, tx(164), r1t, tx(188), r1b, { fill: GRAY, text: 'NOTA:', ...L, size: 6.5 });
  drawCell(doc, tx(188), r1t, tx(261), r1b, { text: obra.nota, ...V });
  drawCell(doc, tx(261), r1t, tx(337), r1b, { fill: GRAY, text: 'DISTRITAL:', ...L, size: 6.5 });
  drawCell(doc, tx(337), r1t, tx(451), r1b, {
    text: formatDistritalLabel(obra.distrital),
    ...V,
    size: 6.5,
  });
  drawCell(doc, tx(451), r1t, tx(491), r1b, { fill: GRAY, text: 'Reserva:', ...L, size: 6.5 });
  drawCell(doc, tx(491), r1t, NEW_X1, r1b, { text: obra.reserva, ...V, size: 6.5 });

  const r2t = ty(127);
  const r2b = ty(135);
  drawCell(doc, tx(58), r2t, tx(135), r2b, { fill: GRAY, text: 'DESCRIÇÃO OBRA:', ...L, size: 6.5 });
  drawCell(doc, tx(135), r2t, tx(388), r2b, { text: obra.descricaoObra, ...V });
  drawCell(doc, tx(388), r2t, tx(451), r2b, { fill: GRAY, text: 'CIDADE:', ...L, size: 6.5 });
  drawCell(doc, tx(451), r2t, NEW_X1, r2b, { text: obra.cidade, ...V });

  sectionBar(doc, ty(138), ty(146), 'DADOS PESO MATERIAIS E ARRASTO');

  const r3t = ty(149);
  const r3b = ty(157);
  drawCell(doc, tx(58), r3t, tx(135), r3b, { fill: GRAY, text: 'PESO EM KG', ...L, size: 6.5 });
  drawCell(doc, tx(135), r3t, tx(210), r3b, { text: formatNumeroBr(pesoEmKg), ...V });
  drawCell(doc, tx(210), r3t, tx(261), r3b, { fill: GRAY, text: 'PESO EM T', ...L, size: 6.5 });
  drawCell(doc, tx(261), r3t, tx(337), r3b, { text: formatNumeroBr(pesoEmT), ...V });
  drawCell(doc, tx(337), r3t, tx(451), r3b, { fill: GRAY, text: 'ARRASTO EM M', ...L, size: 6.5 });
  drawCell(doc, tx(451), r3t, NEW_X1, r3b, { text: formatNumeroBr(arrastoEmM), ...V });

  const r4t = ty(157);
  const r4b = ty(165);
  drawCell(doc, tx(58), r4t, tx(135), r4b, { fill: GRAY, text: 'ARRASTO EM KM', ...L, size: 6.5 });
  drawCell(doc, tx(135), r4t, tx(210), r4b, { text: formatNumeroBr(arrastoEmKm), ...V });
  drawCell(doc, tx(210), r4t, tx(261), r4b, { fill: GRAY, text: 'PREÇO UNIT', ...L, size: 6.5 });
  drawCell(doc, tx(261), r4t, tx(337), r4b, { text: formatMoeda(precoUnitario), ...V });
  drawCell(doc, tx(337), r4t, tx(451), r4b, { fill: GRAY, text: 'QTD A COBRAR', ...L, size: 6.5 });
  drawCell(doc, tx(451), r4t, tx(491), r4b, { text: formatNumeroBr(qtdACobrar), ...V });
  drawCell(doc, tx(491), r4t, tx(521), r4b, { fill: GRAY, text: 'VALOR R$', ...L, size: 6.5 });
  drawCell(doc, tx(521), r4t, NEW_X1, r4b, {
    fill: LBLUE,
    text: valorRs > 0 ? formatMoeda(valorRs) : 'R$ -',
    align: 'center',
    bold: true,
    color: RED,
    size: 7,
  });

  sectionBar(doc, ty(168), ty(176), 'EVIDENCIAS');

  const lblL_X0 = NEW_X0;
  const lblL_X1 = tx(91);
  const imgL_X1 = tx(261);
  const lblR_X0 = tx(261);
  const lblR_X1 = tx(294);
  const imgR_X0 = tx(294);

  const labels = [
    'EVIDÊNCIA1',
    'EVIDÊNCIA2',
    'EVIDÊNCIA3',
    'EVIDÊNCIA4',
    'EVIDÊNCIA5',
    'EVIDÊNCIA6',
    'EVIDÊNCIA7',
    'EVIDÊNCIA8',
  ];

  for (let row = 0; row < EV_ROWS; row++) {
    const y0 = EV_START + row * EV_H;
    const y1 = y0 + EV_H;
    const idxL = row * 2;
    const idxR = row * 2 + 1;

    vertLabel(doc, lblL_X0, y0, lblL_X1, y1, labels[idxL]!);
    drawCell(doc, lblL_X1, y0, imgL_X1, y1, {});
    drawEvidImg(doc, evidencias[idxL], lblL_X1, y0, imgL_X1, y1);

    vertLabel(doc, lblR_X0, y0, lblR_X1, y1, labels[idxR]!);
    drawCell(doc, imgR_X0, y0, NEW_X1, y1, {});
    drawEvidImg(doc, evidencias[idxR], imgR_X0, y0, NEW_X1, y1);
  }

  const materiaisPreenchidos = materiais
    .map((material) => {
      const quantidade = quantidades[material.id] ?? 0;
      if (quantidade <= 0) return null;
      return {
        material,
        quantidade,
        total: calcularTotalLinha(quantidade, material.peso),
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  if (materiaisPreenchidos.length > 0) {
    doc.addPage();
    autoTable(doc, {
      startY: 40,
      margin: { left: 40, right: 40 },
      theme: 'grid',
      styles: {
        fontSize: 7.5,
        cellPadding: 3,
        lineColor: BLACK,
        lineWidth: 0.4,
        halign: 'center',
        valign: 'middle',
      },
      headStyles: {
        fillColor: [107, 31, 63],
        textColor: WHITE,
        fontStyle: 'bold',
        halign: 'center',
        fontSize: 7.5,
      },
      head: [['MATERIAL', 'DESCRIÇÃO', 'FAMÍLIA', 'TIPO', 'QTD', 'PESO', 'TOTAL']],
      body: materiaisPreenchidos.map(({ material, quantidade, total }) => [
        String(material.id),
        material.descricao,
        material.familia,
        material.tipo,
        String(quantidade),
        formatNumeroBr(material.peso),
        formatNumeroBr(total),
      ]),
      columnStyles: {
        0: { cellWidth: 52 },
        1: { halign: 'left' },
        4: { cellWidth: 32 },
        5: { cellWidth: 38 },
        6: { cellWidth: 42 },
      },
    });
  }

  const fileName = buildArrastoExportFileName(obra, 'pdf');
  doc.save(fileName);
  return fileName;
}
