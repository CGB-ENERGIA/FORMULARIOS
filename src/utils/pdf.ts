import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import type { Consumidor, ObraInfo } from '../stores/consumidores';
import { getConsumidoresPreenchidos } from './consumidor-helpers';
import { buildExportFileName } from './export-helpers';
import { buildPdfBlobWithWatermark, savePdfWithWatermark } from './pdf-watermark';

import { publicAsset } from './assets';

const BANNER_URL = publicAsset('template/banner.png');

async function loadBannerBase64(): Promise<string> {
  const response = await fetch(BANNER_URL);
  if (!response.ok) {
    throw new Error('Banner não encontrado.');
  }

  const buffer = await response.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }

  return `data:image/png;base64,${btoa(binary)}`;
}

const BANNER_X = 8;
const BANNER_Y = 6;
const BANNER_WIDTH = 281;
const BANNER_HEIGHT = 22;
const PAGE_WIDTH_MM = 297;

/** Mesma faixa horizontal do banner (x=8, largura=281). */
const TABLE_MARGIN = {
  left: BANNER_X,
  right: PAGE_WIDTH_MM - BANNER_X - BANNER_WIDTH,
};
const TABLE_WIDTH = BANNER_WIDTH;

const OBRA_COL_WIDTHS = {
  label: 46,
  value: 97,
  labelRight: 42,
  valueRight: 96,
} as const;

const CONSUMIDOR_FIXED_WIDTH =
  8 + 22 + 7 * 6 + 10 + 7 + 10 + 7 + 22 + 18;

const CONSUMIDOR_COL_WIDTHS = {
  numero: 8,
  nome: TABLE_WIDTH - CONSUMIDOR_FIXED_WIDTH,
  medidor: 22,
  checkbox: 7,
  ramalWide: 10,
  poste: 22,
  data: 18,
} as const;

const TABLE_STYLES = {
  lineColor: [189, 189, 189] as [number, number, number],
  lineWidth: 0.1,
};

function markCheckbox(active: boolean) {
  return active ? 'X' : '';
}

function buildConsumidorRow(c: Consumidor) {
  return [
    String(c.id),
    c.nome,
    c.numeroMedidor,
    markCheckbox(c.tipoLigacao === 'MO'),
    markCheckbox(c.tipoLigacao === 'BI'),
    markCheckbox(c.tipoLigacao === 'TRI'),
    markCheckbox(c.padrao === '5M'),
    markCheckbox(c.padrao === '7M'),
    markCheckbox(c.padrao === 'CPP'),
    markCheckbox(c.ramalDuplex === 'PADRAO'),
    markCheckbox(c.ramalDuplex === 'KIT'),
    markCheckbox(c.ramalTriplex === 'PADRAO'),
    markCheckbox(c.ramalTriplex === 'KIT'),
    c.posteLigacao,
    c.dataLigacao,
  ];
}

function buildObraTable(doc: jsPDF, obra: ObraInfo, startY: number) {
  autoTable(doc, {
    startY,
    theme: 'grid',
    tableWidth: TABLE_WIDTH,
    margin: TABLE_MARGIN,
    styles: {
      fontSize: 8,
      cellPadding: 2,
      lineColor: TABLE_STYLES.lineColor,
      lineWidth: TABLE_STYLES.lineWidth,
      valign: 'middle',
      overflow: 'linebreak',
    },
    columnStyles: {
      0: { cellWidth: OBRA_COL_WIDTHS.label, fontStyle: 'bold', halign: 'left' },
      1: { cellWidth: OBRA_COL_WIDTHS.value, halign: 'left' },
      2: { cellWidth: OBRA_COL_WIDTHS.labelRight, fontStyle: 'bold', halign: 'left' },
      3: { cellWidth: OBRA_COL_WIDTHS.valueRight, halign: 'left' },
    },
    body: [
      [
        'Descrição da Obra',
        { content: obra.descricaoObra || '—', colSpan: 3, styles: { fontStyle: 'normal' } },
      ],
      ['Fornecedor', obra.fornecedor, 'Téc da Obra', obra.tecObra],
      ['Elemento PEP', obra.elementoPep || '—', 'Regional', obra.regional],
      ['Data da Conclusão', obra.dataConclusao || '—', 'Localidade', obra.localidade || '—'],
      ['Data da Energização', obra.dataEnergizacao || '—', 'Município', obra.municipio || '—'],
    ],
  });
}

/** Monta o PDF de consumidores (paisagem) sem salvar. */
export async function buildConsumidoresPdfDocument(
  obra: ObraInfo,
  consumidores: Consumidor[],
): Promise<jsPDF> {
  const preenchidos = getConsumidoresPreenchidos(consumidores);
  if (preenchidos.length === 0) {
    throw new Error('Nenhum consumidor preenchido para gerar o PDF.');
  }

  const banner = await loadBannerBase64();
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  doc.addImage(banner, 'PNG', BANNER_X, BANNER_Y, BANNER_WIDTH, BANNER_HEIGHT);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(21, 101, 192);
  doc.text('Relação de Consumidores Ligados na Obra', 148.5, 36, { align: 'center' });

  buildObraTable(doc, obra, 40);

  const obraTableEnd = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 70;

  autoTable(doc, {
    startY: obraTableEnd + 4,
    theme: 'grid',
    tableWidth: TABLE_WIDTH,
    margin: TABLE_MARGIN,
    styles: {
      fontSize: 6,
      cellPadding: 1,
      lineColor: TABLE_STYLES.lineColor,
      lineWidth: TABLE_STYLES.lineWidth,
      valign: 'middle',
    },
    headStyles: {
      fillColor: [219, 234, 254],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      halign: 'center',
    },
    head: [
      [
        { content: 'Nº', rowSpan: 2 },
        { content: 'NOME', rowSpan: 2 },
        { content: 'NÚMERO DO MEDIDOR', rowSpan: 2 },
        { content: 'TIPO DE LIGAÇÃO', colSpan: 3 },
        { content: 'PADRÃO', colSpan: 3 },
        { content: 'RAMAL DUPLEX (M)', colSpan: 2 },
        { content: 'RAMAL TRIPLEX (M)', colSpan: 2 },
        { content: 'POSTE DE LIGAÇÃO', rowSpan: 2 },
        { content: 'DATA LIGAÇÃO', rowSpan: 2 },
      ],
      ['MO', 'BI', 'TRI', '5M', '7M', 'CPP', 'PADRÃO', 'KIT', 'PADRÃO', 'KIT'],
    ],
    body: preenchidos.map((consumidor) => buildConsumidorRow(consumidor)),
    columnStyles: {
      0: { halign: 'center', cellWidth: CONSUMIDOR_COL_WIDTHS.numero },
      1: { halign: 'left', cellWidth: CONSUMIDOR_COL_WIDTHS.nome },
      2: { halign: 'center', cellWidth: CONSUMIDOR_COL_WIDTHS.medidor },
      3: { halign: 'center', cellWidth: CONSUMIDOR_COL_WIDTHS.checkbox },
      4: { halign: 'center', cellWidth: CONSUMIDOR_COL_WIDTHS.checkbox },
      5: { halign: 'center', cellWidth: CONSUMIDOR_COL_WIDTHS.checkbox },
      6: { halign: 'center', cellWidth: CONSUMIDOR_COL_WIDTHS.checkbox },
      7: { halign: 'center', cellWidth: CONSUMIDOR_COL_WIDTHS.checkbox },
      8: { halign: 'center', cellWidth: CONSUMIDOR_COL_WIDTHS.checkbox },
      9: { halign: 'center', cellWidth: CONSUMIDOR_COL_WIDTHS.ramalWide },
      10: { halign: 'center', cellWidth: CONSUMIDOR_COL_WIDTHS.checkbox },
      11: { halign: 'center', cellWidth: CONSUMIDOR_COL_WIDTHS.ramalWide },
      12: { halign: 'center', cellWidth: CONSUMIDOR_COL_WIDTHS.checkbox },
      13: { halign: 'center', cellWidth: CONSUMIDOR_COL_WIDTHS.poste },
      14: { halign: 'center', cellWidth: CONSUMIDOR_COL_WIDTHS.data },
    },
  });

  drawFotoPages(doc, preenchidos);

  return doc;
}

export async function exportToPdf(obra: ObraInfo, consumidores: Consumidor[]) {
  const doc = await buildConsumidoresPdfDocument(obra, consumidores);
  const fileName = buildExportFileName(obra, 'pdf');
  return savePdfWithWatermark(doc, fileName);
}

/** Gera PDF + blob sem download (para persistir no módulo Clientes). */
export async function buildConsumidoresPdfBlob(
  obra: ObraInfo,
  consumidores: Consumidor[],
): Promise<{ blob: Blob; fileName: string }> {
  const doc = await buildConsumidoresPdfDocument(obra, consumidores);
  const fileName = buildExportFileName(obra, 'pdf');
  return buildPdfBlobWithWatermark(doc, fileName);
}

interface FotoSlot {
  label: string;
  cliente: string;
  numero: number;
  dataUrl: string;
}

const FOTOS_POR_PAGINA = 4;
const PAGE_HEIGHT_MM = 210;

function collectFotoSlots(consumidores: Consumidor[]): FotoSlot[] {
  const slots: FotoSlot[] = [];
  for (const c of consumidores) {
    const nome = c.nome.trim() || `Cliente ${c.id}`;
    if (c.fotoPadrao) {
      slots.push({
        label: 'FOTO DA FACHADA',
        cliente: nome,
        numero: c.id,
        dataUrl: c.fotoPadrao,
      });
    }
    if (c.fotoMedidor) {
      slots.push({
        label: 'FOTO DO MEDIDOR',
        cliente: nome,
        numero: c.id,
        dataUrl: c.fotoMedidor,
      });
    }
  }
  return slots;
}

function imageFormat(dataUrl: string): 'PNG' | 'JPEG' {
  return dataUrl.startsWith('data:image/png') ? 'PNG' : 'JPEG';
}

function drawFotoCell(
  doc: jsPDF,
  slot: FotoSlot,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const headerH = 10;
  const pad = 2;

  doc.setDrawColor(189, 189, 189);
  doc.setLineWidth(0.2);
  doc.setFillColor(242, 246, 252);
  doc.rect(x, y, w, headerH, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(21, 101, 192);
  doc.text(slot.label, x + pad, y + 4.2);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(80, 80, 80);
  doc.text(`Nº ${slot.numero} · ${slot.cliente}`, x + pad, y + 8, {
    maxWidth: w - pad * 2,
  });

  const imgX = x + pad;
  const imgY = y + headerH + pad;
  const imgW = w - pad * 2;
  const imgH = h - headerH - pad * 2;

  doc.setDrawColor(189, 189, 189);
  doc.setFillColor(255, 255, 255);
  doc.rect(x, y + headerH, w, h - headerH, 'S');

  try {
    doc.addImage(slot.dataUrl, imageFormat(slot.dataUrl), imgX, imgY, imgW, imgH);
  } catch {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('Imagem indisponível', x + w / 2, y + h / 2, { align: 'center' });
  }
}

function drawFotoPages(doc: jsPDF, consumidores: Consumidor[]) {
  const slots = collectFotoSlots(consumidores);
  if (slots.length === 0) return;

  const marginX = BANNER_X;
  const marginTop = 12;
  const marginBottom = 14;
  const gap = 4;
  const cols = 2;
  const rows = 2;
  const contentW = BANNER_WIDTH;
  const contentH = PAGE_HEIGHT_MM - marginTop - marginBottom;
  const cellW = (contentW - gap) / cols;
  const cellH = (contentH - gap) / rows;

  for (let i = 0; i < slots.length; i += FOTOS_POR_PAGINA) {
    doc.addPage('a4', 'landscape');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(21, 101, 192);
    doc.text('Evidências Fotográficas', PAGE_WIDTH_MM / 2, 8, { align: 'center' });

    const pageSlots = slots.slice(i, i + FOTOS_POR_PAGINA);
    pageSlots.forEach((slot, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const x = marginX + col * (cellW + gap);
      const y = marginTop + row * (cellH + gap);
      drawFotoCell(doc, slot, x, y, cellW, cellH);
    });
  }
}
