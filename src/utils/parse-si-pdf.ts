import * as pdfjsLib from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

// ─── tipos ────────────────────────────────────────────────────────────────────

export interface DesligamentoDates {
  data: string;             // DD/MM/YYYY  (data do desligamento)
  inicioDesligamento: string; // DD/MM/YYYY HH:MM
  fimDesligamento: string;    // DD/MM/YYYY HH:MM
}

interface PdfTextItem {
  str: string;
  x: number;
  y: number;
}

export interface ConsumidorPdfData {
  numeroMedidor: string;
  contaContrato: string;
  nomeCompleto: string;
}

// ─── extração posicional ──────────────────────────────────────────────────────

async function extractItems(file: File): Promise<PdfTextItem[]> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const all: PdfTextItem[] = [];

  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const viewport = page.getViewport({ scale: 1 });
    const pageOffset = (pdf.numPages - p) * viewport.height;
    const content = await page.getTextContent();

    for (const item of content.items) {
      if ('str' in item && item.str.trim()) {
        all.push({
          str: item.str.trim(),
          x: item.transform[4] as number,
          y: (item.transform[5] as number) + pageOffset,
        });
      }
    }
  }
  return all;
}

// Agrupa itens em linhas baseado na proximidade de Y
function groupRows(items: PdfTextItem[], yTol = 4): PdfTextItem[][] {
  const sorted = [...items].sort((a, b) => b.y - a.y);
  const rows: PdfTextItem[][] = [];

  for (const item of sorted) {
    const row = rows.find((r) => Math.abs(r[0]!.y - item.y) <= yTol);
    if (row) row.push(item);
    else rows.push([item]);
  }

  for (const row of rows) row.sort((a, b) => a.x - b.x);
  return rows;
}

// ─── extração de texto completo (para SI) ────────────────────────────────────

async function extractFullText(file: File): Promise<string> {
  const items = await extractItems(file);
  return items.map((i) => i.str).join(' ');
}

// ─── tokens a ignorar no nome ─────────────────────────────────────────────────

const ENTREGUE_TOKENS = new Set(['(', ')', 'Sim', 'Não', 'Nao', 'SIM', 'NÃO', 'NAO', 'Si', 'm']);

// ─── APIs públicas ────────────────────────────────────────────────────────────

export async function parseDatesFromPdf(file: File): Promise<DesligamentoDates> {
  const text = (await extractFullText(file)).replace(/\s+/g, ' ');

  // "Desligamento Previsto: 01/06/2026 09:00 até 01/06/2026 13:00"
  const match = text.match(
    /Desligamento\s+Previsto[:\s]+(\d{2}\/\d{2}\/\d{4})\s+(\d{2}:\d{2})\s+at[eé]\s+(\d{2}\/\d{2}\/\d{4})\s+(\d{2}:\d{2})/i,
  );

  if (!match) {
    throw new Error('Datas de desligamento não encontradas no PDF.');
  }

  const [, dataInicio, horaInicio, dataFim, horaFim] = match as [string, string, string, string, string];

  return {
    data: dataInicio!,
    inicioDesligamento: `${dataInicio} ${horaInicio}`,
    fimDesligamento: `${dataFim} ${horaFim}`,
  };
}

export async function parseSiMesFromPdf(file: File): Promise<string> {
  const text = (await extractFullText(file)).replace(/\s+/g, ' ');

  // pdfjs extrai o SI logo após o horário final: "...13:00 137491 devidos..."
  const siMatch =
    text.match(/\d{2}:\d{2}\s+(\d{4,})/i) ??
    text.match(/\bSI\s*:\s*(\d{4,})/i) ??
    text.match(/\bSI\s+(\d{4,})/i);

  if (!siMatch) {
    throw new Error(
      `Número SI não encontrado no PDF.\n\nTexto extraído:\n${text.slice(0, 300)}`,
    );
  }

  return siMatch[1]!;
}

export async function parseConsumidoresFromPdf(file: File): Promise<ConsumidorPdfData[]> {
  const items = await extractItems(file);
  const rows = groupRows(items);
  const result: ConsumidorPdfData[] = [];

  for (const row of rows) {
    // Une todos os itens da linha em uma string (resolve splits do pdfjs)
    const line = row.map((c) => c.str).join(' ').trim();

    // Medidor: XX.XX.DDDDDDD (aceita espaços entre as partes por causa do pdfjs)
    // Ex: "MA.ND.10131344355" ou "MA. ND. 10131344355"
    const medidorMatch = line.match(/([A-Z]{2,}\s*\.\s*[A-Z]{2,}\s*\.\s*\d{6,})/);
    if (!medidorMatch) continue;

    const medidorRaw = medidorMatch[0]!;
    // Remove prefixo "MA.ND." → deixa só o número
    const medidorNumero = medidorRaw.replace(/\s+/g, '').replace(/^(?:[A-Z]+\.)+/, '');

    // Resto da linha após o medidor
    const afterMedidor = line.slice(medidorMatch.index! + medidorRaw.length).trim();

    // Tokens separados por espaço
    const tokens = afterMedidor.split(/\s+/);

    // Primeiro token = contrato (5+ dígitos)
    const contrato = tokens[0];
    if (!contrato || !/^\d{5,}$/.test(contrato)) continue;

    // Nome: tokens seguintes até encontrar "(" (início do ENTREGUE)
    const nomeTokens: string[] = [];
    for (const token of tokens.slice(1)) {
      if (token === '(' || ENTREGUE_TOKENS.has(token)) break;
      nomeTokens.push(token);
    }
    if (nomeTokens.length === 0) continue;

    result.push({
      numeroMedidor: medidorNumero,
      contaContrato: contrato,
      nomeCompleto: nomeTokens.join(' '),
    });
  }

  return result;
}
