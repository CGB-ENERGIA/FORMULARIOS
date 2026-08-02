import { jsPDF } from 'jspdf';
import type { CalcadaObra, CalcadaEvidencia } from '../stores/calcada';
import { quantidadeEvidenciasRequeridas, validateCalcadaEvidencias } from './calcada-helpers';
import { calcularValorRs, formatBRL } from './calcada-helpers';
import { buildCalcadaExportFileName } from './export-helpers';
import { savePdfWithWatermark } from './pdf-watermark';
import { publicAsset } from './assets';

const LOGO_URL = publicAsset('template/calcada-logo.png');

// ── Layout em pontos — A4 paisagem (fotos maiores) ───────────────────────────
const GRAY: [number, number, number] = [242, 242, 242];
const BLACK: [number, number, number] = [0, 0, 0];

const X0 = 37;   // margem esquerda
const X1 = 805;  // margem direita (A4 paisagem ≈ 842 pt)
const CX = (X0 + X1) / 2;

// Colunas das fotos ANTES / DEPOIS
const LABEL_W = 42;
const ANTES_LBL_R = X0 + LABEL_W;
const ANTES_PH_R = CX;
const DEPOIS_LBL_R = CX + LABEL_W;

// 1 evidência por página — fotos ocupam quase toda a largura e altura útil
const BLOCKS_PER_PAGE = 1;
const BLOCK_PITCH = 430;
const FIRST_PG_TOP_CALCADA = 130;
const FIRST_PG_TOP_CUSTEIO = 105;
const PHOTO_OFFSET = 12;
const PHOTO_H = 408;

const LINE_W = 0.5;
const LOGO_DIV_X = 223;

type DocPt = jsPDF & { internal: { getNumberOfPages(): number } };

async function loadLogoBase64(): Promise<string> {
  const res = await fetch(LOGO_URL);
  if (!res.ok) throw new Error('Logo do anexo não encontrado.');
  const buf = await res.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]!);
  return `data:image/png;base64,${btoa(bin)}`;
}

function box(doc: jsPDF, x: number, y: number, w: number, h: number, fill: boolean) {
  doc.setDrawColor(...BLACK);
  doc.setLineWidth(LINE_W);
  if (fill) {
    doc.setFillColor(...GRAY);
    doc.rect(x, y, w, h, 'FD');
  } else {
    doc.rect(x, y, w, h, 'D');
  }
}

/** Célula com rótulo (fundo cinza) + valor (fundo branco), valor centralizado. */
function field(
  doc: jsPDF,
  label: string,
  value: string,
  lblX0: number, lblX1: number,
  valX0: number, valX1: number,
  top: number, bottom: number,
) {
  const h = bottom - top;
  const baseline = top + h - 2.4;
  // Rótulo (cinza)
  box(doc, lblX0, top, lblX1 - lblX0, h, true);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.2);
  doc.setTextColor(...BLACK);
  doc.text(label, lblX0 + 2, baseline);
  // Valor (branco, centralizado)
  box(doc, valX0, top, valX1 - valX0, h, false);
  doc.setFont('helvetica', 'normal');
  doc.text(value, (valX0 + valX1) / 2, baseline, { align: 'center', maxWidth: valX1 - valX0 - 3 });
}

/** Barra de seção cinza com título centralizado. */
function sectionBar(doc: jsPDF, title: string, top: number, bottom: number) {
  const h = bottom - top;
  box(doc, X0, top, X1 - X0, h, true);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.2);
  doc.setTextColor(...BLACK);
  doc.text(title, CX, top + h - 2.4, { align: 'center' });
}

function drawHeader(doc: jsPDF, logo: string, obra: CalcadaObra | CusteioObra, includeReparo = true) {
  const title = includeReparo ? 'EVIDÊNCIA REPARO DE CALÇADA' : 'EVIDÊNCIA CUSTEIO';

  box(doc, X0, 30, X1 - X0, 26, false);
  doc.line(LOGO_DIV_X, 30, LOGO_DIV_X, 56);
  doc.addImage(logo, 'PNG', 54, 32, 80, 21);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...BLACK);
  doc.text(title, (LOGO_DIV_X + X1) / 2, 47, { align: 'center' });

  sectionBar(doc, 'DADOS OBRA', 59, 68);
  field(doc, 'PEP:', obra.pep, 37, 90, 90, 260, 71, 81);
  field(doc, 'NOTA:', obra.nota, 260, 310, 310, 480, 71, 81);
  field(doc, 'DISTRITAL:', obra.distrital, 480, 540, 540, X1, 71, 81);
  field(doc, 'DESCRIÇÃO OBRA:', obra.descricaoObra, 37, 130, 130, 540, 81, 90);
  field(doc, 'CIDADE:', obra.municipio, 540, 600, 600, X1, 81, 90);

  if (includeReparo && 'quantidade' in obra) {
    sectionBar(doc, 'DADOS REPARO DE CALÇADAS', 93, 103);
    const valorSap = obra.valorSap ?? 0;
    const valorRs = calcularValorRs(obra.quantidade, obra.valorSap);
    const qtdTxt = obra.quantidade != null ? String(obra.quantidade) : '';
    field(doc, 'QUANTIDADE:', qtdTxt, 37, 130, 130, 280, 105, 115);
    field(doc, 'VALOR SAP:', formatBRL(valorSap), 280, 380, 380, 520, 105, 115);
    field(doc, 'VALOR R$:', formatBRL(valorRs), 520, 620, 620, X1, 105, 115);
    sectionBar(doc, 'EVIDENCIAS', 118, 128);
  } else {
    sectionBar(doc, 'EVIDENCIAS', 93, 103);
  }
}

function verticalLabel(doc: jsPDF, text: string, centerX: number, boxTop: number) {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.2);
  doc.setTextColor(...BLACK);
  const letters = text.split('');
  const step = 9.2;
  const startY = boxTop + PHOTO_H / 2 - (letters.length - 1) * step / 2 + 2;
  letters.forEach((ch, i) => {
    doc.text(ch, centerX, startY + i * step, { align: 'center' });
  });
}

function drawPhoto(doc: jsPDF, dataUrl: string, x0: number, x1: number, top: number) {
  doc.setDrawColor(...BLACK);
  doc.setLineWidth(LINE_W);
  doc.rect(x0, top, x1 - x0, PHOTO_H, 'D');
  if (dataUrl) {
    const fmt = dataUrl.startsWith('data:image/png') ? 'PNG' : 'JPEG';
    try {
      doc.addImage(dataUrl, fmt, x0 + 1, top + 1, x1 - x0 - 2, PHOTO_H - 2);
    } catch {
      // imagem inválida — deixa o quadro vazio
    }
  }
}

/** Desenha um bloco de evidência no slot indicado (0..3) da página. */
function drawBlock(
  doc: jsPDF,
  ev: CalcadaEvidencia | CusteioEvidencia,
  slot: number,
  firstPgTop: number,
) {
  const pgTop = firstPgTop + slot * BLOCK_PITCH;
  const photoTop = pgTop + PHOTO_OFFSET;

  // Linha PG (largura total)
  box(doc, X0, pgTop, X1 - X0, 10, false);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.2);
  doc.setTextColor(...BLACK);
  doc.text('PG:', X0 + 2, pgTop + 8);
  if (ev.pg) {
    doc.text(ev.pg, X0 + 28, pgTop + 8);
  }

  // Coluna rótulo ANTES (cinza) + foto ANTES
  box(doc, X0, photoTop, ANTES_LBL_R - X0, PHOTO_H, true);
  verticalLabel(doc, 'ANTES', (X0 + ANTES_LBL_R) / 2, photoTop);
  drawPhoto(doc, ev.fotoAntes, ANTES_LBL_R, ANTES_PH_R, photoTop);

  // Coluna rótulo DEPOIS (cinza) + foto DEPOIS
  box(doc, ANTES_PH_R, photoTop, DEPOIS_LBL_R - ANTES_PH_R, PHOTO_H, true);
  verticalLabel(doc, 'DEPOIS', (ANTES_PH_R + DEPOIS_LBL_R) / 2, photoTop);
  drawPhoto(doc, ev.fotoDepois, DEPOIS_LBL_R, X1, photoTop);
}

export async function exportCalcadaToPdf(
  obra: CalcadaObra,
  evidencias: CalcadaEvidencia[],
): Promise<string> {
  const errors = validateCalcadaEvidencias(obra, evidencias);
  if (errors.length > 0) {
    throw new Error(errors[0]);
  }

  const required = evidencias.slice(0, quantidadeEvidenciasRequeridas(obra.quantidade));

  const logo = await loadLogoBase64();
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' }) as DocPt;

  for (let i = 0; i < required.length; i++) {
    const slot = i % BLOCKS_PER_PAGE;
    if (i > 0 && slot === 0) {
      doc.addPage();
    }
    if (slot === 0) {
      drawHeader(doc, logo, obra, true);
    }
    drawBlock(doc, required[i]!, slot, FIRST_PG_TOP_CALCADA);
  }

  const fileName = buildCalcadaExportFileName(obra, 'pdf');
  return savePdfWithWatermark(doc, fileName);
}
