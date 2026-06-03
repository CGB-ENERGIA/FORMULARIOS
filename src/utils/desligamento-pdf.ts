import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import type { DesligamentoConsumidor, DesligamentoObra, DesligamentoSI } from '../stores/desligamento';
import { getConsumidoresDesligamentoPreenchidos, getTipoCliente, contarPorProtocolar } from './desligamento-helpers';
import { publicAsset } from './assets';

const BANNER_URL = publicAsset('template/banner.png');

// Cores (replicadas do modelo Excel)
const GRAY: [number, number, number] = [242, 242, 242]; // 0.949
const LBLUE: [number, number, number] = [220, 230, 241]; // label de valor
const DBLUE: [number, number, number] = [0, 32, 96]; // azul escuro
const RED: [number, number, number] = [192, 0, 0];
const BLACK: [number, number, number] = [0, 0, 0];
const WHITE: [number, number, number] = [255, 255, 255];

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

function timeOnly(dt: string): string {
  if (!dt) return '';
  const parts = dt.trim().split(' ');
  return parts.length === 2 && parts[0]!.includes('/') ? (parts[1] ?? dt) : dt;
}

interface CellOpts {
  fill?: [number, number, number];
  text?: string;
  color?: [number, number, number];
  bold?: boolean;
  align?: 'left' | 'center';
  size?: number;
  padLeft?: number;
}

function cell(doc: jsPDF, x0: number, y0: number, x1: number, y1: number, o: CellOpts = {}) {
  const w = x1 - x0;
  const h = y1 - y0;
  // fundo
  if (o.fill) {
    doc.setFillColor(...o.fill);
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.rect(x0, y0, w, h, 'FD');
  } else {
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.rect(x0, y0, w, h, 'D');
  }
  if (o.text) {
    const size = o.size ?? 7;
    doc.setFont('helvetica', o.bold ? 'bold' : 'normal');
    doc.setTextColor(...(o.color ?? BLACK));
    // reduz fonte até caber
    let fs = size;
    const padX = o.padLeft ?? 3;
    const maxW = w - padX - 2;
    doc.setFontSize(fs);
    while (doc.getTextWidth(o.text) > maxW && fs > 4.5) {
      fs -= 0.3;
      doc.setFontSize(fs);
    }
    const ty = y0 + h / 2 + fs * 0.35;
    if (o.align === 'center') {
      doc.text(o.text, x0 + w / 2, ty, { align: 'center' });
    } else {
      doc.text(o.text, x0 + padX, ty);
    }
  }
}

function sectionBar(doc: jsPDF, x0: number, y0: number, x1: number, y1: number, label: string) {
  cell(doc, x0, y0, x1, y1, { fill: GRAY, text: label, bold: true, align: 'center', size: 8 });
}

function verticalLabel(doc: jsPDF, x0: number, y0: number, x1: number, y1: number, texto: string) {
  cell(doc, x0, y0, x1, y1, { fill: GRAY });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...BLACK);
  const chars = texto.split('');
  const lineH = 8.5;
  const blockH = chars.length * lineH;
  let cy = y0 + (y1 - y0 - blockH) / 2 + 6;
  const cx = x0 + (x1 - x0) / 2;
  for (const ch of chars) {
    doc.text(ch, cx, cy, { align: 'center' });
    cy += lineH;
  }
}

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
  // unidade em pontos para copiar as coordenadas exatas do modelo
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' }) as DocEx;

  // ── Cabeçalho: logo + título ────────────────────────────────────────────────
  // caixa logo: 58-164, título: 164-491, altura 83-106
  cell(doc, 58, 83, 164, 106, {});
  cell(doc, 164, 83, 491, 106, { text: 'AVISO DE DESLIGAMENTO', bold: true, align: 'center', size: 11 });
  // logo dentro da caixa
  try {
    doc.addImage(banner, 'PNG', 60, 86, 100, 17);
  } catch {
    /* ignore */
  }

  // (Versão Planilha V1)
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7);
  doc.setTextColor(...RED);
  doc.text('(Versão Planilha V1)', 491, 80, { align: 'right' });

  // ── DADOS OBRA ──────────────────────────────────────────────────────────────
  sectionBar(doc, 58, 108, 491, 116, 'DADOS OBRA');

  const L = { color: BLACK, bold: true } as const;
  const V = { color: RED } as const;

  // Row 1 (119-127): NOTA | PEP | FORNECEDOR | CONTRATO
  cell(doc, 58, 119, 91, 127, { fill: GRAY, text: 'NOTA:', ...L, size: 6.5 });
  cell(doc, 91, 119, 164, 127, { text: obra.nota, ...V });
  cell(doc, 164, 119, 188, 127, { fill: GRAY, text: 'PEP:', ...L, size: 6.5 });
  cell(doc, 188, 119, 294, 127, { text: obra.pep, ...V });
  cell(doc, 294, 119, 337, 127, { fill: GRAY, text: 'FORNECEDOR:', ...L, size: 6 });
  cell(doc, 337, 119, 388, 127, { fill: LBLUE, text: obra.fornecedor, align: 'center', bold: true, size: 6.5 });
  cell(doc, 388, 119, 451, 127, { fill: GRAY, text: 'CONTRATO:', ...L, size: 6.5 });
  cell(doc, 451, 119, 491, 127, { text: obra.contrato, ...V, size: 6.5 });

  // Row 2 (127-135): DESCRIÇÃO OBRA | CIDADE
  cell(doc, 58, 127, 135, 135, { fill: GRAY, text: 'DESCRIÇÃO OBRA:', ...L, size: 6.5 });
  cell(doc, 135, 127, 294, 135, { text: obra.descricaoObra, ...V });
  cell(doc, 294, 127, 337, 135, { fill: GRAY, text: 'CIDADE:', ...L, size: 6.5 });
  cell(doc, 337, 127, 491, 135, { text: obra.cidade, ...V });

  // Row 3 (135-143): DATA | SI/MÊS
  cell(doc, 58, 135, 135, 143, { fill: GRAY, text: 'DATA:', ...L, size: 6.5 });
  cell(doc, 135, 135, 210, 143, { text: obra.data, ...V });
  cell(doc, 210, 135, 363, 143, { fill: GRAY, text: 'SOLICITAÇÃO DE INTERVENÇÃO (SI) / MÊS:', ...L, size: 6 });
  cell(doc, 363, 135, 491, 143, { text: obra.siMes, ...V });

  // ── DADOS DA SOLICITAÇÃO DE INTERVENÇÃO ─────────────────────────────────────
  sectionBar(doc, 58, 146, 491, 154, 'DADOS DA SOLICITAÇÃO DE INTERVENÇÃO');

  // Row A (157-165): INICIO | Nº OPERACIONAL | QTD S/ PROTOCOLO
  cell(doc, 58, 157, 135, 165, { fill: GRAY, text: 'INICIO DESLIGAMENTO:', ...L, size: 6 });
  cell(doc, 135, 157, 261, 165, { text: timeOnly(solicitacao.inicioDesligamento), ...V });
  cell(doc, 261, 157, 337, 165, { fill: GRAY, text: 'Nº OPERACIONAL:', ...L, size: 6 });
  cell(doc, 337, 157, 388, 165, { text: solicitacao.numeroOperacional, ...V });
  cell(doc, 388, 157, 451, 165, { fill: GRAY, text: 'QTD. S/ PROTOCOLO:', ...L, size: 5.5 });
  cell(doc, 451, 157, 491, 165, { text: String(qtdSem), ...V });

  // Row B (165-173): FIM | Nº BARRAMENTO | QTD C/ PROTOCOLO
  cell(doc, 58, 165, 135, 173, { fill: GRAY, text: 'FIM DESLIGAMENTO:', ...L, size: 6 });
  cell(doc, 135, 165, 261, 173, { text: timeOnly(solicitacao.fimDesligamento), ...V });
  cell(doc, 261, 165, 337, 173, { fill: GRAY, text: 'Nº BARRAMENTO:', ...L, size: 6 });
  cell(doc, 337, 165, 388, 173, { text: solicitacao.numeroBarramento, ...V });
  cell(doc, 388, 165, 451, 173, { fill: GRAY, text: 'QTD. C/ PROTOCOLO:', ...L, size: 5.5 });
  cell(doc, 451, 165, 491, 173, { text: String(qtdCom), ...V });

  // ── Linhas de protocolo / valor (azul escuro) ───────────────────────────────
  // Row 176-184: S/ PROTOCOLO | R$ | VALOR R$ | R$
  cell(doc, 58, 176, 164, 184, { fill: DBLUE, text: 'S/ PROTOCOLO', color: WHITE, bold: true, align: 'center', size: 7 });
  cell(doc, 164, 176, 210, 184, { fill: LBLUE });
  cell(doc, 210, 176, 261, 184, { fill: DBLUE, text: 'VALOR R$', color: WHITE, bold: true, align: 'center', size: 7 });
  cell(doc, 261, 176, 337, 184, { fill: LBLUE });
  // Row 184-192: C/ PROTOCOLO | R$ | VALOR R$ | R$
  cell(doc, 58, 184, 164, 192, { fill: DBLUE, text: 'C/ PROTOCOLO', color: WHITE, bold: true, align: 'center', size: 7 });
  cell(doc, 164, 184, 210, 192, { fill: LBLUE });
  cell(doc, 210, 184, 261, 192, { fill: DBLUE, text: 'VALOR R$', color: WHITE, bold: true, align: 'center', size: 7 });
  cell(doc, 261, 184, 337, 192, { fill: LBLUE });

  // ── EVIDENCIAS ──────────────────────────────────────────────────────────────
  sectionBar(doc, 58, 195, 491, 203, 'EVIDENCIAS');

  const evRows = [205, 306, 407, 507];
  const evH = 98;
  evRows.forEach((top, r) => {
    const bottom = top + evH;
    const idxL = r * 2;
    const idxR = r * 2 + 1;

    // Label esquerda + imagem esquerda
    verticalLabel(doc, 58, top, 91, bottom, `EVIDÊNCIA${idxL + 1}`);
    cell(doc, 91, top, 261, bottom, {});
    drawEvidencia(doc, evidencias[idxL], 91, top, 261, bottom, idxL);

    // Label direita + imagem direita
    verticalLabel(doc, 261, top, 294, bottom, `EVIDÊNCIA${idxR + 1}`);
    cell(doc, 294, top, 491, bottom, {});
    drawEvidencia(doc, evidencias[idxR], 294, top, 491, bottom, idxR);
  });

  // ── PÁGINA 2: CONSUMIDORES ──────────────────────────────────────────────────
  doc.addPage();
  autoTable(doc, {
    startY: 60,
    margin: { left: 60, right: 75 },
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 3,
      lineColor: [0, 0, 0],
      lineWidth: 0.5,
      halign: 'center',
      valign: 'middle',
      fontStyle: 'bold',
    },
    headStyles: { fillColor: DBLUE, textColor: WHITE, fontStyle: 'bold', halign: 'center' },
    head: [['TIPO DE CLIENTE', 'CONTA CONTRATO', 'Nº MEDIDOR', 'NOME COMPLETO']],
    body: preenchidos.map((c) => [
      getTipoCliente(c.protocolar),
      c.contaContrato,
      c.numeroMedidor,
      c.nomeCompleto,
    ]),
    columnStyles: {
      0: { cellWidth: 88 },
      1: { cellWidth: 61 },
      2: { cellWidth: 59 },
      3: { halign: 'center' },
    },
  });

  const referencia = obra.nota || obra.contrato || 'desligamento';
  const fileName = `DESLIGAMENTO_${referencia}_${new Date().toISOString().slice(0, 10)}.pdf`.replace(/\s+/g, '_');
  doc.save(fileName);
  return fileName;
}

function drawEvidencia(
  doc: jsPDF,
  src: string | null | undefined,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  idx: number,
) {
  if (src) {
    try {
      doc.addImage(src, x0 + 1, y0 + 1, x1 - x0 - 2, y1 - y0 - 2);
      return;
    } catch {
      /* imagem inválida */
    }
  }
  // Evidência 2 (idx 1): aviso obrigatório
  if (idx === 1) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(...RED);
    doc.text('OBRIGATÓRIO SER A TELA DA SI NO PROSIS', (x0 + x1) / 2, y0 + 14, {
      align: 'center',
      maxWidth: x1 - x0 - 6,
    });
  }
}
