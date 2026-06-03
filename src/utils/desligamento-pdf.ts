import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import type { DesligamentoConsumidor, DesligamentoObra, DesligamentoSI } from '../stores/desligamento';
import {
  getConsumidoresDesligamentoPreenchidos,
  getTipoCliente,
  contarPorProtocolar,
} from './desligamento-helpers';
import { publicAsset } from './assets';

const BANNER_URL = publicAsset('template/banner.png');

// ── Cores ──────────────────────────────────────────────────────────────────────
const GRAY: [number, number, number] = [242, 242, 242];
const LBLUE: [number, number, number] = [220, 230, 241];
const DBLUE: [number, number, number] = [0, 32, 96];
const RED: [number, number, number] = [192, 0, 0];
const BLACK: [number, number, number] = [0, 0, 0];
const WHITE: [number, number, number] = [255, 255, 255];

// ── Sistema de coordenadas ──────────────────────────────────────────────────────
// O modelo original usa x ∈ [58, 491] em página A4 (595pt).
// Vamos expandir para x ∈ [15, 580] mantendo as proporções internas.
const ORIG_X0 = 58,  ORIG_X1 = 491; // limites originais
const NEW_X0  = 15,  NEW_X1  = 580; // novos limites (usa quase toda a largura)
const ORIG_Y0 = 83;                  // onde o conteúdo começa no modelo
const NEW_Y0  = 10;                  // começamos mais alto na página

const xScale = (NEW_X1 - NEW_X0) / (ORIG_X1 - ORIG_X0); // ≈ 1.305
const yOff   = NEW_Y0 - ORIG_Y0;                          // -73

const tx = (x: number) => NEW_X0 + (x - ORIG_X0) * xScale;
const ty = (y: number) => y + yOff;

// Após as linhas de protocolo (orig y=192) as evidências preenchem o resto da página
const EV_START   = ty(205);
const PAGE_BOTTOM = 830;
const EV_ROWS     = 4;
const EV_H        = Math.floor((PAGE_BOTTOM - EV_START) / EV_ROWS); // ≈173

type DocEx = jsPDF & { lastAutoTable?: { finalY: number } };

// ── Utilitários ─────────────────────────────────────────────────────────────────
async function loadBannerBase64(): Promise<string> {
  const res = await fetch(BANNER_URL);
  if (!res.ok) throw new Error('Banner não encontrado.');
  const buf = await res.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]!);
  return `data:image/png;base64,${btoa(bin)}`;
}

function parseBR(v: string): number {
  return parseFloat(v.replace('.', '').replace(',', '.')) || 0;
}

function formatBR(n: number): string {
  return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function timeOnly(dt: string): string {
  if (!dt) return '';
  const p = dt.trim().split(' ');
  return p.length === 2 && p[0]!.includes('/') ? (p[1] ?? dt) : dt;
}

interface CellOpts {
  fill?: [number, number, number];
  text?: string;
  color?: [number, number, number];
  bold?: boolean;
  align?: 'left' | 'center';
  size?: number;
}

function drawCell(
  doc: jsPDF,
  x0: number, y0: number, x1: number, y1: number,
  o: CellOpts = {},
) {
  const w = x1 - x0, h = y1 - y0;
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.4);
  if (o.fill) { doc.setFillColor(...o.fill); doc.rect(x0, y0, w, h, 'FD'); }
  else          { doc.rect(x0, y0, w, h, 'D'); }

  if (o.text) {
    let fs = o.size ?? 7;
    doc.setFont('helvetica', o.bold ? 'bold' : 'normal');
    doc.setTextColor(...(o.color ?? BLACK));
    doc.setFontSize(fs);
    while (doc.getTextWidth(o.text) > w - 5 && fs > 4) { fs -= 0.25; doc.setFontSize(fs); }
    const ty2 = y0 + h / 2 + fs * 0.35;
    if (o.align === 'center') doc.text(o.text, x0 + w / 2, ty2, { align: 'center' });
    else                      doc.text(o.text, x0 + 3,     ty2);
  }
}

function sectionBar(doc: jsPDF, y0: number, y1: number, label: string) {
  drawCell(doc, NEW_X0, y0, NEW_X1, y1, { fill: GRAY, text: label, bold: true, align: 'center', size: 8 });
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
  for (const ch of chars) { doc.text(ch, cx, cy, { align: 'center' }); cy += lh; }
}

const L = { color: BLACK as [number,number,number], bold: true } as const;
const V = { color: RED   as [number,number,number] }              as const;

// ── Export principal ────────────────────────────────────────────────────────────
export async function exportDesligamentoToPdf(
  obra: DesligamentoObra,
  solicitacao: DesligamentoSI,
  consumidores: DesligamentoConsumidor[],
  evidencias: (string | null)[],
) {
  const preenchidos = getConsumidoresDesligamentoPreenchidos(consumidores);
  const qtdSem = contarPorProtocolar(consumidores, 'NAO');
  const qtdCom = contarPorProtocolar(consumidores, 'SIM');
  const banner = await loadBannerBase64();

  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' }) as DocEx;

  // ── Cabeçalho ─────────────────────────────────────────────────────────────
  const hTop = ty(83), hBot = ty(106);
  const logoW = tx(164) - NEW_X0;
  drawCell(doc, NEW_X0, hTop, tx(164), hBot, {});
  drawCell(doc, tx(164), hTop, NEW_X1, hBot, { text: 'AVISO DE DESLIGAMENTO', bold: true, align: 'center', size: 12 });
  try { doc.addImage(banner, 'PNG', NEW_X0 + 2, hTop + 2, logoW - 4, hBot - hTop - 4); } catch { /* */ }

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7);
  doc.setTextColor(...RED);
  doc.text('(Versão Planilha V1)', NEW_X1, hTop - 3, { align: 'right' });

  // ── DADOS OBRA ─────────────────────────────────────────────────────────────
  const ob1 = ty(108), ob2 = ty(116);
  sectionBar(doc, ob1, ob2, 'DADOS OBRA');

  // row1: NOTA | PEP | FORNECEDOR | CONTRATO
  const r1t = ty(119), r1b = ty(127);
  drawCell(doc, tx(58),  r1t, tx(91),  r1b, { fill: GRAY, text: 'NOTA:',        ...L, size: 6.5 });
  drawCell(doc, tx(91),  r1t, tx(164), r1b, { text: obra.nota,                  ...V });
  drawCell(doc, tx(164), r1t, tx(188), r1b, { fill: GRAY, text: 'PEP:',         ...L, size: 6.5 });
  drawCell(doc, tx(188), r1t, tx(294), r1b, { text: obra.pep,                   ...V });
  drawCell(doc, tx(294), r1t, tx(337), r1b, { fill: GRAY, text: 'FORNECEDOR:',  ...L, size: 6 });
  drawCell(doc, tx(337), r1t, tx(388), r1b, { fill: LBLUE, text: obra.fornecedor, align: 'center', bold: true, size: 6.5 });
  drawCell(doc, tx(388), r1t, tx(451), r1b, { fill: GRAY, text: 'CONTRATO:',    ...L, size: 6.5 });
  drawCell(doc, tx(451), r1t, NEW_X1,  r1b, { text: obra.contrato,              ...V, size: 6.5 });

  // row2: DESCRIÇÃO OBRA | CIDADE
  const r2t = ty(127), r2b = ty(135);
  drawCell(doc, tx(58),  r2t, tx(135), r2b, { fill: GRAY, text: 'DESCRIÇÃO OBRA:', ...L, size: 6.5 });
  drawCell(doc, tx(135), r2t, tx(294), r2b, { text: obra.descricaoObra,            ...V });
  drawCell(doc, tx(294), r2t, tx(337), r2b, { fill: GRAY, text: 'CIDADE:',         ...L, size: 6.5 });
  drawCell(doc, tx(337), r2t, NEW_X1,  r2b, { text: obra.cidade,                   ...V });

  // row3: DATA | SI/MÊS
  const r3t = ty(135), r3b = ty(143);
  drawCell(doc, tx(58),  r3t, tx(135), r3b, { fill: GRAY, text: 'DATA:', ...L, size: 6.5 });
  drawCell(doc, tx(135), r3t, tx(210), r3b, { text: obra.data,           ...V });
  drawCell(doc, tx(210), r3t, tx(363), r3b, { fill: GRAY, text: 'SOLICITAÇÃO DE INTERVENÇÃO (SI) / MÊS:', ...L, size: 5.8 });
  drawCell(doc, tx(363), r3t, NEW_X1,  r3b, { text: obra.siMes,          ...V });

  // ── DADOS DA SOLICITAÇÃO ───────────────────────────────────────────────────
  const si1 = ty(146), si2 = ty(154);
  sectionBar(doc, si1, si2, 'DADOS DA SOLICITAÇÃO DE INTERVENÇÃO');

  // rowA: INICIO | OPERACIONAL | QTD S/
  const rAt = ty(157), rAb = ty(165);
  drawCell(doc, tx(58),  rAt, tx(135), rAb, { fill: GRAY, text: 'INICIO DESLIGAMENTO:', ...L, size: 6 });
  drawCell(doc, tx(135), rAt, tx(261), rAb, { text: timeOnly(solicitacao.inicioDesligamento), ...V });
  drawCell(doc, tx(261), rAt, tx(337), rAb, { fill: GRAY, text: 'Nº OPERACIONAL:', ...L, size: 6 });
  drawCell(doc, tx(337), rAt, tx(388), rAb, { text: solicitacao.numeroOperacional,  ...V });
  drawCell(doc, tx(388), rAt, tx(451), rAb, { fill: GRAY, text: 'QTD. S/ PROTOCOLO:', ...L, size: 5.5 });
  drawCell(doc, tx(451), rAt, NEW_X1,  rAb, { text: String(qtdSem),                ...V });

  // rowB: FIM | BARRAMENTO | QTD C/
  const rBt = ty(165), rBb = ty(173);
  drawCell(doc, tx(58),  rBt, tx(135), rBb, { fill: GRAY, text: 'FIM DESLIGAMENTO:', ...L, size: 6 });
  drawCell(doc, tx(135), rBt, tx(261), rBb, { text: timeOnly(solicitacao.fimDesligamento), ...V });
  drawCell(doc, tx(261), rBt, tx(337), rBb, { fill: GRAY, text: 'Nº BARRAMENTO:', ...L, size: 6 });
  drawCell(doc, tx(337), rBt, tx(388), rBb, { text: solicitacao.numeroBarramento,  ...V });
  drawCell(doc, tx(388), rBt, tx(451), rBb, { fill: GRAY, text: 'QTD. C/ PROTOCOLO:', ...L, size: 5.5 });
  drawCell(doc, tx(451), rBt, NEW_X1,  rBb, { text: String(qtdCom),                ...V });

  // Protocolo / Valor (faixa azul escura)
  const pAt = ty(176), pAb = ty(184), pBt = ty(184), pBb = ty(192);
  const vUnit1 = parseBR(solicitacao.valorUnitarioSemProtocolo);
  const vUnit2 = parseBR(solicitacao.valorUnitarioComProtocolo);
  const vTotal1 = vUnit1 * qtdSem;
  const vTotal2 = vUnit2 * qtdCom;

  drawCell(doc, tx(58),  pAt, tx(164), pAb, { fill: DBLUE, text: 'S/ PROTOCOLO', color: WHITE, bold: true, align: 'center', size: 7 });
  drawCell(doc, tx(164), pAt, tx(210), pAb, { fill: LBLUE, text: `R$ ${formatBR(vUnit1)}`, align: 'center', bold: true, size: 7 });
  drawCell(doc, tx(210), pAt, tx(261), pAb, { fill: DBLUE, text: 'VALOR R$', color: WHITE, bold: true, align: 'center', size: 7 });
  drawCell(doc, tx(261), pAt, tx(337), pAb, { fill: LBLUE, text: `R$ ${formatBR(vTotal1)}`, align: 'center', bold: true, size: 7 });
  drawCell(doc, tx(58),  pBt, tx(164), pBb, { fill: DBLUE, text: 'C/ PROTOCOLO', color: WHITE, bold: true, align: 'center', size: 7 });
  drawCell(doc, tx(164), pBt, tx(210), pBb, { fill: LBLUE, text: `R$ ${formatBR(vUnit2)}`, align: 'center', bold: true, size: 7 });
  drawCell(doc, tx(210), pBt, tx(261), pBb, { fill: DBLUE, text: 'VALOR R$', color: WHITE, bold: true, align: 'center', size: 7 });
  drawCell(doc, tx(261), pBt, tx(337), pBb, { fill: LBLUE, text: `R$ ${formatBR(vTotal2)}`, align: 'center', bold: true, size: 7 });

  // ── EVIDÊNCIAS ─────────────────────────────────────────────────────────────
  const evBar1 = ty(195), evBar2 = ty(203);
  sectionBar(doc, evBar1, evBar2, 'EVIDENCIAS');

  // Coluna de rótulo vertical: tx(58→91) à esquerda, tx(261→294) à direita
  const lblW_L = tx(91),          imgL_X1 = tx(261);
  const lblL_X0 = NEW_X0,         lblL_X1 = tx(91);
  const lblR_X0 = tx(261),        lblR_X1 = tx(294);
  const imgR_X0 = tx(294);

  const LABELS = [
    'EVIDÊNCIA1', 'EVIDÊNCIA2',
    'EVIDÊNCIA3', 'EVIDÊNCIA4',
    'EVIDÊNCIA5', 'EVIDÊNCIA6',
    'EVIDÊNCIA7', 'EVIDÊNCIA8',
  ];

  for (let row = 0; row < EV_ROWS; row++) {
    const y0 = EV_START + row * EV_H;
    const y1 = y0 + EV_H;
    const idxL = row * 2, idxR = row * 2 + 1;

    vertLabel(doc, lblL_X0, y0, lblL_X1, y1, LABELS[idxL]!);
    drawCell(doc, lblL_X1, y0, imgL_X1, y1, {});
    drawEvidImg(doc, evidencias[idxL], lblL_X1, y0, imgL_X1, y1);

    vertLabel(doc, lblR_X0, y0, lblR_X1, y1, LABELS[idxR]!);
    drawCell(doc, imgR_X0, y0, NEW_X1, y1, {});
    drawEvidImg(doc, evidencias[idxR], imgR_X0, y0, NEW_X1, y1, idxR === 1);
  }

  void lblW_L; // usado implicitamente nas constantes acima

  // ── Página 2: Consumidores ─────────────────────────────────────────────────
  doc.addPage();
  autoTable(doc, {
    startY: 40,
    margin: { left: 40, right: 40 },
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 3,
      lineColor: BLACK,
      lineWidth: 0.4,
      halign: 'center',
      valign: 'middle',
      fontStyle: 'bold',
    },
    headStyles: { fillColor: DBLUE, textColor: WHITE, fontStyle: 'bold', halign: 'center', fontSize: 8 },
    head: [['TIPO DE CLIENTE', 'CONTA CONTRATO', 'Nº MEDIDOR', 'NOME COMPLETO']],
    body: preenchidos.map((c) => [
      getTipoCliente(c.protocolar),
      c.contaContrato,
      c.numeroMedidor,
      c.nomeCompleto,
    ]),
    columnStyles: {
      0: { cellWidth: 95 },
      1: { cellWidth: 70 },
      2: { cellWidth: 75 },
      3: { halign: 'center' },
    },
  });

  const ref = obra.nota || obra.contrato || 'desligamento';
  const fileName = `DESLIGAMENTO_${ref}_${new Date().toISOString().slice(0, 10)}.pdf`.replace(/\s+/g, '_');
  doc.save(fileName);
  return fileName;
}

function drawEvidImg(
  doc: jsPDF,
  src: string | null | undefined,
  x0: number, y0: number, x1: number, y1: number,
  showObrig = false,
) {
  if (src) {
    try { doc.addImage(src, x0 + 1, y0 + 1, x1 - x0 - 2, y1 - y0 - 2); return; } catch { /* */ }
  }
  if (showObrig) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(192, 0, 0);
    doc.text('OBRIGATÓRIO SER A TELA DA SI NO PROSIS', (x0 + x1) / 2, y0 + 16, {
      align: 'center',
      maxWidth: x1 - x0 - 8,
    });
  }
}
