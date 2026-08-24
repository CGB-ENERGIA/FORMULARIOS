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
const SEC_H = 6 + 6 + PHOTO_H + 4;

const LBLUE: [number, number, number] = [189, 215, 238];
const DBLUE: [number, number, number] = [31, 73, 125];
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

  // Barra cinza centralizada: ATIVIDADE: [texto]   QUANTIDADE: [valor]
  const atividade = servico.atividade?.trim() || '—';
  const qtd = servico.quantidade?.trim() || '—';
  const barText = `ATIVIDADE: ${atividade}     QUANTIDADE: ${qtd}`;

  doc.setFillColor(...LGRAY);
  doc.rect(MX, y, CONT_W, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...DBLUE);
  doc.text(barText, MX + CONT_W / 2, y + 4.5, { align: 'center' });
  y += 7;

  // Labels simplificados acima das fotos
  doc.setFillColor(220, 230, 241);
  doc.rect(MX, y, PHOTO_W, 5, 'F');
  doc.rect(xR, y, PHOTO_W, 5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6);
  doc.setTextColor(...DBLUE);
  doc.text(`${regL}  INÍCIO`, MX + 2, y + 3.3);
  doc.text(`${regR}  FINAL`, xR + 2, y + 3.3);
  y += 5;

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

  // Evidências fotográficas por serviço
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
