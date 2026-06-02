import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import type { Consumidor, ObraInfo } from '../stores/consumidores';
import { getConsumidoresPreenchidos } from './consumidor-helpers';
import { buildExportFileName } from './export-helpers';

const BANNER_URL = '/template/banner.png';

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

function markCheckbox(active: boolean) {
  return active ? 'X' : '';
}

function buildConsumidorRow(c: Consumidor, dataObra: string) {
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
    c.dataLigacao || dataObra,
  ];
}

function buildObraTable(doc: jsPDF, obra: ObraInfo, startY: number) {
  autoTable(doc, {
    startY,
    theme: 'grid',
    tableWidth: 'auto',
    margin: { left: 18, right: 18 },
    styles: {
      fontSize: 8,
      cellPadding: 2,
      lineColor: [189, 189, 189],
      lineWidth: 0.1,
      valign: 'middle',
      overflow: 'linebreak',
    },
    columnStyles: {
      0: { cellWidth: 42, fontStyle: 'bold', halign: 'left' },
      1: { cellWidth: 88, halign: 'left' },
      2: { cellWidth: 38, fontStyle: 'bold', halign: 'left' },
      3: { cellWidth: 88, halign: 'left' },
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

export async function exportToPdf(obra: ObraInfo, consumidores: Consumidor[]) {
  const preenchidos = getConsumidoresPreenchidos(consumidores);
  if (preenchidos.length === 0) {
    throw new Error('Nenhum consumidor preenchido para gerar o PDF.');
  }

  const banner = await loadBannerBase64();
  const fileName = buildExportFileName(obra, 'pdf');
  const dataObra = obra.dataEnergizacao || obra.dataConclusao;
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  doc.addImage(banner, 'PNG', 8, 6, 281, 22);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(21, 101, 192);
  doc.text('Relação de Consumidores Ligados na Obra', 148.5, 36, { align: 'center' });

  buildObraTable(doc, obra, 40);

  const obraTableEnd = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 70;

  autoTable(doc, {
    startY: obraTableEnd + 4,
    theme: 'grid',
    styles: {
      fontSize: 6,
      cellPadding: 1,
      lineColor: [189, 189, 189],
      lineWidth: 0.1,
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
    body: preenchidos.map((consumidor) => buildConsumidorRow(consumidor, dataObra)),
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      2: { halign: 'center', cellWidth: 22 },
      3: { halign: 'center', cellWidth: 7 },
      4: { halign: 'center', cellWidth: 7 },
      5: { halign: 'center', cellWidth: 7 },
      6: { halign: 'center', cellWidth: 7 },
      7: { halign: 'center', cellWidth: 7 },
      8: { halign: 'center', cellWidth: 7 },
      9: { halign: 'center', cellWidth: 10 },
      10: { halign: 'center', cellWidth: 7 },
      11: { halign: 'center', cellWidth: 10 },
      12: { halign: 'center', cellWidth: 7 },
      13: { halign: 'center', cellWidth: 22 },
      14: { halign: 'center', cellWidth: 18 },
    },
  });

  doc.save(fileName);
  return fileName;
}
