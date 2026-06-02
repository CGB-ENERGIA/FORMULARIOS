import type { ObraInfo } from '../stores/consumidores';

export function buildExportFileName(obra: ObraInfo, extension: 'xlsx' | 'pdf'): string {
  return `CONSUMIDORES_${obra.municipio || 'obra'}_${new Date().toISOString().slice(0, 10)}.${extension}`.replace(
    /\s+/g,
    '_',
  );
}
