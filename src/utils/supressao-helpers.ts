import type { SupressaoForm } from '../stores/supressao';

export const EMPRESA_FIXO = 'CGB ENERGIA LTDA';
export const REGIONAL_FIXO = 'CENTRO';

export function formatCoord(lat: string, lng: string): string {
  if (!lat && !lng) return 'Coordenadas (Lat.:  Long.: )';
  return `Coordenadas (Lat.: ${lat} Long.: ${lng})`;
}

export function countFotos(fotos: string[]): number {
  return fotos.filter(Boolean).length;
}

export function formTemDados(form: SupressaoForm): boolean {
  return !!(
    form.responsavel.trim() ||
    form.municipio.trim() ||
    form.notaProjeto.trim() ||
    countFotos(form.fotosDerivacao) > 0 ||
    countFotos(form.fotosPercurso1) > 0 ||
    countFotos(form.fotosPercurso2) > 0 ||
    countFotos(form.fotosFinal) > 0
  );
}
