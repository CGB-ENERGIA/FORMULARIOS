import type { jsPDF } from 'jspdf';
import { APP_BRAND, APP_TAGLINE } from 'src/config/navigation';
import { publicAsset } from './assets';

/** Identificador embutido no PDF (metadados) para rastrear origem do portal. */
export const PDF_WATERMARK_ID = 'CGB-PORTAL-FORMULARIOS';

const LOGO_URL = publicAsset('brand/cgb-mark.png');

let cachedLogo: string | null | undefined;

function formatGeneratedAt(date: Date): string {
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function buildDocumentRef(date: Date): string {
  const stamp = date
    .toISOString()
    .replace(/[-:TZ.]/g, '')
    .slice(0, 14);
  return `CGB-${stamp}`;
}

async function loadLogoBase64(): Promise<string | null> {
  if (cachedLogo !== undefined) return cachedLogo;

  try {
    const response = await fetch(LOGO_URL);
    if (!response.ok) {
      cachedLogo = null;
      return null;
    }

    const buffer = await response.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]!);
    }
    cachedLogo = `data:image/png;base64,${btoa(binary)}`;
  } catch {
    cachedLogo = null;
  }

  return cachedLogo;
}

function drawFooterStamp(
  doc: jsPDF,
  pageWidth: number,
  pageHeight: number,
  page: number,
  totalPages: number,
  generatedAt: string,
  documentRef: string,
  logo: string | null,
) {
  const marginX = pageWidth * 0.04;
  const bandHeight = pageHeight * 0.022;
  const footerY = pageHeight - marginX * 0.55;
  const lineY = footerY - bandHeight;
  const fontSize = Math.max(6, pageHeight * 0.008);

  doc.setDrawColor(210, 180, 192);
  doc.setLineWidth(Math.max(0.2, pageHeight * 0.0004));
  doc.line(marginX, lineY, pageWidth - marginX, lineY);

  let textX = marginX;
  const logoSize = bandHeight * 0.85;

  if (logo) {
    try {
      doc.addImage(
        logo,
        'PNG',
        marginX,
        lineY + (bandHeight - logoSize) / 2,
        logoSize,
        logoSize,
        undefined,
        'FAST',
      );
      textX = marginX + logoSize + pageWidth * 0.012;
    } catch {
      // Logo opcional.
    }
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(fontSize);
  doc.setTextColor(155, 27, 70);
  doc.text(`Documento gerado pelo ${APP_TAGLINE} · ${APP_BRAND}`, textX, footerY);

  const pageLabel = totalPages > 1 ? ` · Pág. ${page}/${totalPages}` : '';
  doc.setTextColor(120, 100, 108);
  doc.text(
    `${generatedAt} · Ref. ${documentRef}${pageLabel}`,
    pageWidth - marginX,
    footerY,
    { align: 'right' },
  );
}

function setPdfMetadata(doc: jsPDF, documentRef: string, generatedAt: string) {
  doc.setProperties({
    creator: `${APP_BRAND} · ${APP_TAGLINE}`,
    subject: `Documento gerado automaticamente pelo portal (${documentRef})`,
    keywords: `${PDF_WATERMARK_ID}, ${documentRef}, ${generatedAt}`,
  });
}

/** Aplica selo de identificação no rodapé e metadados em todas as páginas do PDF. */
export async function applyPdfWatermark(doc: jsPDF): Promise<void> {
  const generatedAtDate = new Date();
  const generatedAt = formatGeneratedAt(generatedAtDate);
  const documentRef = buildDocumentRef(generatedAtDate);
  const logo = await loadLogoBase64();

  const totalPages = doc.internal.getNumberOfPages();

  for (let page = 1; page <= totalPages; page++) {
    doc.setPage(page);

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    drawFooterStamp(doc, pageWidth, pageHeight, page, totalPages, generatedAt, documentRef, logo);
  }

  setPdfMetadata(doc, documentRef, generatedAt);
}

/** Salva o PDF após aplicar a marca d'água do portal. */
export async function savePdfWithWatermark(doc: jsPDF, fileName: string): Promise<string> {
  await applyPdfWatermark(doc);
  doc.save(fileName);
  return fileName;
}

/** Gera o blob do PDF (com marca d'água) sem forçar download. */
export async function buildPdfBlobWithWatermark(
  doc: jsPDF,
  fileName: string,
): Promise<{ blob: Blob; fileName: string }> {
  await applyPdfWatermark(doc);
  const blob = doc.output('blob');
  return { blob, fileName };
}
