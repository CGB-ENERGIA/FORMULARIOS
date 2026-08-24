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
const MX = 8;
const CONT_W = PAGE_W - MX * 2;

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

  y = (doc.lastAutoTable?.finalY ?? y + 8) + 3;

  return (doc.lastAutoTable?.finalY ?? y + 8) + 3;
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

  autoTable(doc, {
    startY: y,
    margin: { left: MX, right: MX },
    tableWidth: CONT_W,
    theme: 'grid',
    styles: { fontSize: 7, cellPadding: 2.5, valign: 'middle', halign: 'center', lineColor: GRAY, lineWidth: 0.2 },
    headStyles: { fillColor: LBLUE, textColor: DBLUE, fontStyle: 'bold', halign: 'center', fontSize: 7.5 },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center' },
      1: { cellWidth: CONT_W - 12 - 28, halign: 'left' },
      2: { cellWidth: 28, halign: 'center' },
    },
    head: [['Nº', 'ATIVIDADE', 'QUANTIDADE']],
    body: preenchidos.map((s) => [
      String(s.id),
      s.atividade || '—',
      s.quantidade || '—',
    ]),
  });

  const fileName = buildCusteioExportFileName(cabecalho, 'pdf');
  return savePdfWithWatermark(doc, fileName);
}
