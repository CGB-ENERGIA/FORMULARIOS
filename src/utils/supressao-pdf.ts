import { jsPDF } from 'jspdf';
import type { SupressaoForm, SupressaoTipo } from '../stores/supressao';
import { EMPRESA_FIXO, REGIONAL_FIXO } from './supressao-helpers';
import { sanitizeFileNamePart } from './export-helpers';
import { publicAsset } from './assets';

type RGB = [number, number, number];

interface SupressaoTheme {
  headerUrl: string;
  headerFormat: 'PNG' | 'JPEG';
  headerRatio: number;
  /** Se falso, o título já está desenhado na própria imagem do banner. */
  drawDynamicTitle: boolean;
  reportTitle: string;
  reportSubtitle: string;
  sectionBg: RGB;
  pillBg: RGB;
  pillText: RGB;
  fileTitle: string;
}

const THEMES: Record<SupressaoTipo, SupressaoTheme> = {
  sem: {
    headerUrl: publicAsset('template/supressao-header.png'),
    headerFormat: 'PNG',
    headerRatio: 168 / 870,
    drawDynamicTitle: true,
    reportTitle: 'RELATÓRIO DE VALIDAÇÃO AMBIENTAL',
    reportSubtitle: 'OBRAS SEM SUPRESSÃO DE VEGETAÇÃO',
    sectionBg: [173, 217, 223],
    pillBg: [173, 217, 223],
    pillText: [20, 30, 60],
    fileTitle: 'RELATÓRIO DE VALIDAÇÃO AMBIENTAL',
  },
  com: {
    headerUrl: publicAsset('template/supressao-header-com.jpg'),
    headerFormat: 'JPEG',
    headerRatio: 176 / 867,
    drawDynamicTitle: false,
    reportTitle: 'RELATÓRIO DE APONTAMENTO AMBIENTAL',
    reportSubtitle: 'OBRAS COM SUPRESSÃO DE VEGETAÇÃO',
    sectionBg: [226, 240, 217],
    pillBg: [31, 56, 100],
    pillText: [255, 255, 255],
    fileTitle: 'RELATÓRIO DE APONTAMENTO AMBIENTAL',
  },
};

const FOOTER_URL = publicAsset('template/supressao-footer.png');
const FOOTER_RATIO = 68 / 833;

// ─── Layout: A4 retrato (pt), fiel aos relatórios oficiais Equatorial Energia ──
const M = 18;
const PW = 595.28;
const PH = 841.89;
const CW = PW - 2 * M;

const NAVY: RGB = [31, 56, 100];
const COORD_BG: RGB = [223, 223, 223];
const BORDER_W = 1.1;

async function loadImageBase64(url: string, mime: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Recurso do relatório não encontrado.');
  const buf = await res.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]!);
  return `data:${mime};base64,${btoa(bin)}`;
}

function box(doc: jsPDF, x: number, y: number, w: number, h: number, fill?: RGB) {
  doc.setDrawColor(...NAVY);
  doc.setLineWidth(BORDER_W);
  if (fill) {
    doc.setFillColor(...fill);
    doc.rect(x, y, w, h, 'FD');
  } else {
    doc.rect(x, y, w, h, 'D');
  }
}

/** Barra de seção (fundo temático, borda azul-marinho, título centralizado em negrito). */
function sectionBar(doc: jsPDF, y: number, theme: SupressaoTheme, title: string, subtitle?: string): number {
  const h = subtitle ? 34 : 24;
  box(doc, M, y, CW, h, theme.sectionBg);
  doc.setTextColor(...NAVY);
  doc.setFont('helvetica', 'bold');
  if (subtitle) {
    doc.setFontSize(10.5);
    doc.text(title, PW / 2, y + 14, { align: 'center' });
    doc.setFontSize(8.5);
    doc.text(subtitle, PW / 2, y + 26, { align: 'center' });
  } else {
    doc.setFontSize(10.5);
    doc.text(title, PW / 2, y + h / 2 + 3.6, { align: 'center' });
  }
  return y + h;
}

/** Barra de coordenadas (fundo cinza claro, texto à esquerda). */
function coordBar(doc: jsPDF, y: number, lat: string, lng: string): number {
  const h = 22;
  box(doc, M, y, CW, h, COORD_BG);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(0, 0, 0);
  doc.text(`Coordenadas (Lat.: ${lat} Long.: ${lng})`, M + 4, y + h / 2 + 3.2);
  return y + h;
}

function photoCell(doc: jsPDF, dataUrl: string, x: number, y: number, w: number, h: number) {
  doc.setDrawColor(...NAVY);
  doc.setLineWidth(0.6);
  doc.rect(x, y, w, h, 'D');
  const fmt = dataUrl.startsWith('data:image/png') ? 'PNG' : 'JPEG';
  try {
    doc.addImage(dataUrl, fmt, x + 1, y + 1, w - 2, h - 2);
  } catch {
    // imagem inválida — deixa a célula vazia
  }
}

/** Grade de fotos: exibe apenas as células preenchidas (sem placeholders vazios), esticando para preencher o espaço disponível. */
function photoGrid(
  doc: jsPDF,
  fotos: string[],
  cols: number,
  y: number,
  bottom: number,
) {
  const preenchidas = fotos.filter(Boolean);
  if (preenchidas.length === 0) return;

  const rows = Math.ceil(preenchidas.length / cols);
  const gap = 6;
  const colW = (CW - (cols - 1) * gap) / cols;
  const rowH = (bottom - y - (rows - 1) * gap) / rows;

  preenchidas.forEach((foto, idx) => {
    const row = Math.floor(idx / cols);
    const col = idx % cols;
    photoCell(
      doc,
      foto,
      M + col * (colW + gap),
      y + row * (rowH + gap),
      colW,
      rowH,
    );
  });
}

function drawFooter(doc: jsPDF, footerImg: string) {
  const w = CW;
  const h = w * FOOTER_RATIO;
  const y = PH - M - h;
  doc.addImage(footerImg, 'PNG', M, y, w, h);
  return y;
}

function drawHeaderBanner(
  doc: jsPDF,
  headerImg: string,
  theme: SupressaoTheme,
  data: string,
): number {
  const w = CW;
  const h = w * theme.headerRatio;
  const y = M;
  doc.addImage(headerImg, theme.headerFormat, M, y, w, h);

  if (theme.drawDynamicTitle) {
    const textX = M + w * 0.264;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(255, 255, 255);
    doc.text(theme.reportTitle, textX, y + h * 0.30);
    doc.text(theme.reportSubtitle, textX, y + h * 0.50);
  }

  // Selo de data (canto inferior direito do banner)
  const pillW = w * 0.25;
  const pillH = h * 0.26;
  const pillX = M + w - pillW - w * 0.02;
  const pillY = y + h * 0.70;
  doc.setFillColor(...theme.pillBg);
  doc.roundedRect(pillX, pillY, pillW, pillH, pillH / 2, pillH / 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11.5);
  doc.setTextColor(...theme.pillText);
  doc.text(`Data: ${data || '—'}`, pillX + pillW / 2, pillY + pillH / 2 + 4, { align: 'center' });

  return y + h;
}

function drawInfoFields(doc: jsPDF, y: number, form: SupressaoForm): number {
  const lines = [
    `Empresa Executora: ${EMPRESA_FIXO}`,
    `Responsável pela Validação: ${form.responsavel}`,
    `Regional: ${REGIONAL_FIXO}`,
    `Município: ${form.municipio}`,
    `Nota do Projeto: ${form.notaProjeto}`,
  ];
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(...NAVY);
  let cursor = y;
  for (const line of lines) {
    doc.text(line, M, cursor);
    cursor += 15.5;
  }
  return cursor;
}

// ─── Páginas ─────────────────────────────────────────────────────────────

function drawPage1(
  doc: jsPDF,
  form: SupressaoForm,
  theme: SupressaoTheme,
  headerImg: string,
  footerImg: string,
  cols: number,
) {
  let y = drawHeaderBanner(doc, headerImg, theme, form.data);
  y += 14;
  y = drawInfoFields(doc, y, form);
  y += 6;
  y = sectionBar(doc, y, theme, 'FOTOS DO PONTO DE DERIVAÇÃO');
  y = coordBar(doc, y, form.latDerivacao, form.lngDerivacao);
  y += 10;

  const footerTop = drawFooter(doc, footerImg);
  photoGrid(doc, form.fotosDerivacao, cols, y, footerTop - 10);
}

function drawPercursoPage(
  doc: jsPDF,
  theme: SupressaoTheme,
  titulo: string,
  lat: string,
  lng: string,
  fotos: string[],
  footerImg: string,
  cols: number,
) {
  let y = M;
  y = sectionBar(doc, y, theme, titulo, 'Incluir setas e indicações do sentido por onde irá passar a rede');
  y = coordBar(doc, y, lat, lng);
  y += 10;

  const footerTop = drawFooter(doc, footerImg);
  photoGrid(doc, fotos, cols, y, footerTop - 10);
}

function drawFinalPage(
  doc: jsPDF,
  form: SupressaoForm,
  theme: SupressaoTheme,
  footerImg: string,
  cols: number,
) {
  let y = M;
  y = sectionBar(doc, y, theme, 'FOTO DO PONTO FINAL DA OBRA');
  y = coordBar(doc, y, form.latFinal, form.lngFinal);
  y += 10;

  const footerTop = drawFooter(doc, footerImg);
  photoGrid(doc, form.fotosFinal, cols, y, footerTop - 10);
}

// ─── Exportação principal ───────────────────────────────────────────────

export async function exportSupressaoToPdf(
  form: SupressaoForm,
  tipo: SupressaoTipo,
): Promise<string> {
  const theme = THEMES[tipo];
  const finalCols = tipo === 'sem' ? 2 : 3;

  const [headerImg, footerImg] = await Promise.all([
    loadImageBase64(theme.headerUrl, theme.headerFormat === 'PNG' ? 'image/png' : 'image/jpeg'),
    loadImageBase64(FOOTER_URL, 'image/png'),
  ]);

  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });

  drawPage1(doc, form, theme, headerImg, footerImg, 2);

  doc.addPage();
  drawPercursoPage(
    doc,
    theme,
    'FOTO DO PERCURSO DA OBRA',
    form.latPercurso1,
    form.lngPercurso1,
    form.fotosPercurso1,
    footerImg,
    3,
  );

  doc.addPage();
  drawPercursoPage(
    doc,
    theme,
    'FOTO DO PERCURSO DA OBRA',
    form.latPercurso2,
    form.lngPercurso2,
    form.fotosPercurso2,
    footerImg,
    3,
  );

  doc.addPage();
  drawFinalPage(doc, form, theme, footerImg, finalCols);

  const nota = sanitizeFileNamePart(form.notaProjeto) || 'supressao';
  const tipoLabel = tipo === 'sem' ? 'SEM SUPRESSÃO' : 'COM SUPRESSÃO';
  const fileName = `${theme.fileTitle} - OBRAS ${tipoLabel} - NOTA ${nota}.pdf`;

  doc.save(fileName);
  return fileName;
}
