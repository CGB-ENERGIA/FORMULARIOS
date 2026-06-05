import JSZip from 'jszip';

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function unescapeXml(text: string): string {
  return text
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&gt;/g, '>')
    .replace(/&lt;/g, '<')
    .replace(/&amp;/g, '&');
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function extractSharedStringText(siInner: string): string {
  const parts: string[] = [];
  const textPattern = /<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g;
  let match: RegExpExecArray | null = textPattern.exec(siInner);

  while (match !== null) {
    parts.push(unescapeXml(match[1]));
    match = textPattern.exec(siInner);
  }

  return parts.join('');
}

function getCellStyle(xml: string, ref: string, fallback = '60'): string {
  const match = xml.match(new RegExp(`<c r="${escapeRegex(ref)}" s="(\\d+)"`));
  return match?.[1] ?? fallback;
}

function replaceCell(xml: string, ref: string, replacement: string): string {
  const escapedRef = escapeRegex(ref);
  const selfClosing = new RegExp(`<c r="${escapedRef}"(?:\\s[^>]*)?/>`);
  const withContent = new RegExp(`<c r="${escapedRef}"(?:\\s[^>]*)?>[\\s\\S]*?</c>`);

  if (selfClosing.test(xml)) {
    return xml.replace(selfClosing, replacement);
  }

  if (withContent.test(xml)) {
    return xml.replace(withContent, replacement);
  }

  return xml;
}

export class SharedStringTable {
  private xml: string;
  private readonly texts: string[];

  constructor(xml: string) {
    this.xml = xml;
    this.texts = [];

    const entryPattern = /<si>([\s\S]*?)<\/si>/g;
    let match: RegExpExecArray | null = entryPattern.exec(xml);

    while (match !== null) {
      this.texts.push(extractSharedStringText(match[1]));
      match = entryPattern.exec(xml);
    }
  }

  getOrAdd(value: string): number {
    const existingIndex = this.texts.indexOf(value);
    if (existingIndex >= 0) return existingIndex;

    const countMatch = this.xml.match(/count="(\d+)"/);
    const uniqueCountMatch = this.xml.match(/uniqueCount="(\d+)"/);
    if (!countMatch || !uniqueCountMatch) {
      throw new Error('sharedStrings.xml inválido.');
    }

    const count = Number(countMatch[1]) + 1;
    const uniqueCount = Number(uniqueCountMatch[1]) + 1;
    const index = uniqueCount - 1;
    const newEntry = `<si><t xml:space="preserve">${escapeXml(value)}</t></si>`;

    this.xml = this.xml
      .replace(/count="\d+"/, `count="${count}"`)
      .replace(/uniqueCount="\d+"/, `uniqueCount="${uniqueCount}"`)
      .replace('</sst>', `${newEntry}</sst>`);
    this.texts.push(value);

    return index;
  }

  toXml(): string {
    return this.xml;
  }
}

export async function loadSharedStringTable(zip: JSZip): Promise<SharedStringTable> {
  const entry = zip.file('xl/sharedStrings.xml');
  if (!entry) {
    throw new Error('sharedStrings.xml não encontrado no modelo.');
  }

  const xml = await entry.async('string');
  return new SharedStringTable(xml);
}

export function setSharedStringCell(
  xml: string,
  ref: string,
  value: string,
  stringIndex: number | null,
): string {
  const style = getCellStyle(xml, ref);
  const replacement =
    value.trim() && stringIndex !== null
      ? `<c r="${ref}" s="${style}" t="s"><v>${stringIndex}</v></c>`
      : `<c r="${ref}" s="${style}"/>`;

  return replaceCell(xml, ref, replacement);
}

/** @deprecated Use setSharedStringCell com SharedStringTable — inlineStr corrompe o .xlsm. */
export function setInlineStringCell(xml: string, ref: string, value: string): string {
  const style = getCellStyle(xml, ref);
  const replacement = value.trim()
    ? `<c r="${ref}" s="${style}" t="inlineStr"><is><t xml:space="preserve">${escapeXml(value)}</t></is></c>`
    : `<c r="${ref}" s="${style}"/>`;

  return replaceCell(xml, ref, replacement);
}

export function setNumberCell(xml: string, ref: string, value: number | null): string {
  const style = getCellStyle(xml, ref, '8');
  const replacement =
    value === null || Number.isNaN(value)
      ? `<c r="${ref}" s="${style}"/>`
      : `<c r="${ref}" s="${style}"><v>${value}</v></c>`;

  return replaceCell(xml, ref, replacement);
}

export function setFormulaCellCachedValue(xml: string, ref: string, value: number): string {
  const escapedRef = escapeRegex(ref);
  const cellPattern = new RegExp(`<c r="${escapedRef}"(?:\\s[^>]*)?>[\\s\\S]*?</c>`);
  const match = xml.match(cellPattern);
  if (!match || !match[0].includes('<f>')) return xml;

  const updatedCell = match[0].replace(
    /(<f>[\s\S]*?<\/f>)(?:<v[^>]*>[\s\S]*?<\/v>|<v\/>)/,
    `$1<v>${value}</v>`,
  );

  return xml.replace(match[0], updatedCell);
}

function removeControlByMacro(xml: string, macro: string): string {
  const pattern = new RegExp(
    `<mc:AlternateContent[^>]*>\\s*<mc:Choice[^>]*>\\s*<control(?:\\s|>)[\\s\\S]*?macro="\\[0\\]!${escapeRegex(macro)}"[\\s\\S]*?</control>\\s*</mc:Choice>\\s*</mc:AlternateContent>`,
    'g',
  );
  return xml.replace(pattern, '');
}

function removeVmlButtonByMacro(vml: string, macro: string): string {
  const pattern = new RegExp(
    `<v:shape[\\s\\S]*?<x:FmlaMacro>\\[0\\]!${escapeRegex(macro)}</x:FmlaMacro>[\\s\\S]*?</v:shape>`,
    'g',
  );
  return vml.replace(pattern, '');
}

function removeRelationship(xml: string, targetSuffix: string): string {
  const pattern = new RegExp(
    `<Relationship[^>]*Target="[^"]*${escapeRegex(targetSuffix)}"[^>]*/>`,
    'g',
  );
  return xml.replace(pattern, '');
}

export async function removeArrastoToolbarButtons(zip: JSZip): Promise<void> {
  const sheet1 = await zip.file('xl/worksheets/sheet1.xml')?.async('string');
  const vml = await zip.file('xl/drawings/vmlDrawing1.vml')?.async('string');
  const sheet1Rels = await zip.file('xl/worksheets/_rels/sheet1.xml.rels')?.async('string');

  if (sheet1) {
    let next = sheet1;
    next = removeControlByMacro(next, 'Limpar');
    next = removeControlByMacro(next, 'Filtrar');
    next = removeControlByMacro(next, 'GerarPDF');
    zip.file('xl/worksheets/sheet1.xml', next);
  }

  if (vml) {
    let next = vml;
    next = removeVmlButtonByMacro(next, 'Limpar');
    next = removeVmlButtonByMacro(next, 'Filtrar');
    next = removeVmlButtonByMacro(next, 'GerarPDF');
    zip.file('xl/drawings/vmlDrawing1.vml', next);
  }

  if (sheet1Rels) {
    let next = sheet1Rels;
    next = removeRelationship(next, 'ctrlProp1.xml');
    next = removeRelationship(next, 'ctrlProp2.xml');
    next = removeRelationship(next, 'ctrlProp3.xml');
    zip.file('xl/worksheets/_rels/sheet1.xml.rels', next);
  }

  zip.remove('xl/ctrlProps/ctrlProp1.xml');
  zip.remove('xl/ctrlProps/ctrlProp2.xml');
  zip.remove('xl/ctrlProps/ctrlProp3.xml');
}

export async function removeCalcChain(zip: JSZip): Promise<void> {
  zip.remove('xl/calcChain.xml');

  const workbookRels = await zip.file('xl/_rels/workbook.xml.rels')?.async('string');
  if (!workbookRels) return;

  const next = workbookRels.replace(
    /<Relationship[^>]*Type="[^"]*calcChain"[^>]*\/>/g,
    '',
  );
  zip.file('xl/_rels/workbook.xml.rels', next);
}

export async function patchWorksheet(
  zip: JSZip,
  sheetPath: string,
  patcher: (xml: string) => string,
): Promise<void> {
  const entry = zip.file(sheetPath);
  if (!entry) {
    throw new Error(`Aba não encontrada no modelo: ${sheetPath}`);
  }

  const xml = await entry.async('string');
  zip.file(sheetPath, patcher(xml));
}

export async function loadWorkbookZip(templateBuffer: ArrayBuffer): Promise<JSZip> {
  return JSZip.loadAsync(templateBuffer);
}

export async function writeWorkbookZip(zip: JSZip): Promise<ArrayBuffer> {
  return zip.generateAsync({
    type: 'arraybuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });
}
