import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import type { CusteioCabecalho, CusteioServico } from '../stores/custeio';
import { servicoPreenchido } from '../stores/custeio';
import { publicAsset } from './assets';
import { buildCusteioExportFileName } from './export-helpers';
import { formatDistritalLabel } from './arrasto-helpers';
import { savePdfWithWatermark } from './pdf-watermark';

const BANNER_URL = publicAsset('template/banner.png');

const PAGE_W = 210;
const PAGE_H = 297;
const MX = 8;
const CONT_W = PAGE_W - MX * 2;
const PHOTO_W = (CONT_W - 4) / 2;
const PHOTO_H = PHOTO_W * (9.6 / 12.8);
const HEADER_H = 10;
const REG_H = 5;
const SEC_H = HEADER_H + REG_H + PHOTO_H + 4;

const LBLUE: [number, number, number] = [189, 215, 238];
const DBLUE: [number, number, number] = [31, 73, 125];
const GRAY: [number, number, number] = [166, 166, 166];
const LBLUE_LIGHT: [number, number, number] = [238, 245, 251];
const MID_BLUE: [number, number, number] = [93, 130, 168];
const PILL_BLUE: [number, number, number] = [55, 96, 146];

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

function drawHeader(doc: DocEx, banner: string, cabecalho: CusteioCabecalho, y: number): number {
  doc.addImage(banner, 'PNG', MX, y, CONT_W, 18);
  y += 20;

  doc.setFillColor(...DBLUE);
  doc.rect(MX, y, CONT_W, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text('RELATÓRIO DE EVIDÊNCIAS DOS SERVIÇOS EXECUTADOS', PAGE_W / 2, y + 5.5, { align: 'center' });
  y += 10;

  // Linha 1: BASE | MUNICÍPIO | ORDEM/INCIDENTE | COMPONENTE OU PG
  autoTable(doc, {
    startY: y,
    margin: { left: MX, right: MX },
    tableWidth: CONT_W,
    theme: 'grid',
    styles: { fontSize: 6.5, cellPadding: 2, valign: 'middle', halign: 'center', lineColor: GRAY, lineWidth: 0.2 },
    headStyles: { fillColor: LBLUE, textColor: DBLUE, fontStyle: 'bold', halign: 'center', fontSize: 7 },
    columnStyles: {
      0: { cellWidth: CONT_W * 0.25 },
      1: { cellWidth: CONT_W * 0.25 },
      2: { cellWidth: CONT_W * 0.25 },
      3: { cellWidth: CONT_W * 0.25 },
    },
    head: [['BASE', 'MUNICÍPIO', 'ORDEM/INCIDENTE', 'COMPONENTE OU PG']],
    body: [[
      formatDistritalLabel(cabecalho.base),
      cabecalho.municipio,
      cabecalho.tipoOrdem === 'incidente'
        ? `INC ${cabecalho.ordemNumero || '—'}`
        : cabecalho.ordemNumero || cabecalho.componenteOuPg || '—',
      cabecalho.componenteOuPg || '—',
    ]],
  });

  y = (doc.lastAutoTable?.finalY ?? y + 8) + 0.5;

  // Linha 2: PREFIXO DA EQUIPE | DATA DE EXECUÇÃO | OBSERVAÇÃO
  autoTable(doc, {
    startY: y,
    margin: { left: MX, right: MX },
    tableWidth: CONT_W,
    theme: 'grid',
    styles: { fontSize: 6.5, cellPadding: 2, valign: 'middle', halign: 'center', lineColor: GRAY, lineWidth: 0.2 },
    headStyles: { fillColor: LBLUE, textColor: DBLUE, fontStyle: 'bold', halign: 'center', fontSize: 7 },
    columnStyles: {
      0: { cellWidth: CONT_W * 0.35 },
      1: { cellWidth: CONT_W * 0.15 },
      2: { cellWidth: CONT_W * 0.50 },
    },
    head: [['PREFIXO DA EQUIPE', 'DATA DE EXECUÇÃO', 'OBSERVAÇÃO']],
    body: [[
      cabecalho.prefixoEquipe || '—',
      cabecalho.dataExecucao || '—',
      cabecalho.observacao || '—',
    ]],
  });

  return (doc.lastAutoTable?.finalY ?? y + 8) + 3;
}

function drawEvidencia(
  doc: jsPDF,
  servico: CusteioServico,
  regInicio: number,
  regFim: number,
  y: number,
): number {
  const xR = MX + PHOTO_W + 4;
  const regL = `REG.${String(regInicio).padStart(3, '0')}`;
  const regR = `REG.${String(regFim).padStart(3, '0')}`;
  const atividade = servico.atividade?.trim() || '—';
  const qtd = servico.quantidade?.trim() || '—';

  // ── Header azul escuro ──────────────────────────────────
  doc.setFillColor(...DBLUE);
  doc.rect(MX, y, CONT_W, HEADER_H, 'F');

  // Label "ATIVIDADE" pequeno em azul claro
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.5);
  doc.setTextColor(...LBLUE);
  doc.text('ATIVIDADE', MX + 3, y + 3.5);

  // Valor da atividade em branco
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text(atividade, MX + 3, y + 7.8);

  // Pill de quantidade à direita
  const QTD_W = 24;
  const QTD_X = MX + CONT_W - QTD_W - 3;
  doc.setFillColor(...PILL_BLUE);
  doc.setDrawColor(...LBLUE);
  doc.setLineWidth(0.3);
  doc.rect(QTD_X, y + 1.5, QTD_W, HEADER_H - 3, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.5);
  doc.setTextColor(...LBLUE);
  doc.text('QTD', QTD_X + QTD_W / 2, y + 4, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text(qtd, QTD_X + QTD_W / 2, y + 7.5, { align: 'center' });

  y += HEADER_H;

  // ── Linha de labels REG (azul claro) ───────────────────
  doc.setFillColor(...LBLUE_LIGHT);
  doc.rect(MX, y, CONT_W, REG_H, 'F');

  const SEP_X = MX + PHOTO_W + 2;
  doc.setDrawColor(...LBLUE);
  doc.setLineWidth(0.3);
  doc.line(SEP_X, y, SEP_X, y + REG_H);

  // REG.001 + INÍCIO
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6);
  doc.setTextColor(...DBLUE);
  doc.text(regL, MX + 2, y + 3.3);
  const wL = doc.getTextWidth(regL);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...MID_BLUE);
  doc.text(' INÍCIO', MX + 2 + wL, y + 3.3);

  // REG.002 + FINAL
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6);
  doc.setTextColor(...DBLUE);
  doc.text(regR, xR + 2, y + 3.3);
  const wR = doc.getTextWidth(regR);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...MID_BLUE);
  doc.text(' FINAL', xR + 2 + wR, y + 3.3);

  y += REG_H;

  // ── Fotos ──────────────────────────────────────────────
  doc.setDrawColor(...GRAY);
  doc.rect(MX, y, PHOTO_W, PHOTO_H);
  doc.rect(xR, y, PHOTO_W, PHOTO_H);

  if (servico.fotoInicio) {
    const fmt = servico.fotoInicio.startsWith('data:image/png') ? 'PNG' : 'JPEG';
    try { doc.addImage(servico.fotoInicio, fmt, MX + 0.5, y + 0.5, PHOTO_W - 1, PHOTO_H - 1); }
    catch { drawPlaceholder(doc, MX, y); }
  } else {
    drawPlaceholder(doc, MX, y);
  }

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

export async function exportCusteioToPdf(
  cabecalho: CusteioCabecalho,
  servicos: CusteioServico[],
): Promise<string> {
  const preenchidos = servicos.filter(servicoPreenchido);
  if (preenchidos.length === 0) {
    throw new Error('Preencha ao menos um serviço antes de exportar.');
  }

  const banner = await loadBannerBase64();
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' }) as DocEx;

  let y = MX;
  y = drawHeader(doc, banner, cabecalho, y);

  let reg = 1;
  for (const s of preenchidos) {
    if (y + SEC_H > PAGE_H - MX) {
      doc.addPage();
      y = MX;
    }
    y = drawEvidencia(doc, s, reg, reg + 1, y);
    reg += 2;
  }

  const fileName = buildCusteioExportFileName(cabecalho, 'pdf');
  return savePdfWithWatermark(doc, fileName);
}
