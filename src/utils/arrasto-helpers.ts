import type { ArrastoMaterial } from './arrasto-types';
import type { ArrastoObra } from '../stores/arrasto';

type ArrastoObraField = keyof ArrastoObra;

const OBRA_FIELD_LABELS: Record<ArrastoObraField, string> = {
  pep: 'PEP',
  nota: 'Nota',
  distrital: 'Distrital',
  reserva: 'Reserva',
  descricaoObra: 'Descrição da Obra',
  cidade: 'Cidade',
};

const OBRA_REQUIRED_FIELDS: ArrastoObraField[] = [
  'pep',
  'nota',
  'distrital',
  'descricaoObra',
  'cidade',
];

export function roundUp(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.ceil(value * factor) / factor;
}

export function calcularTotalLinha(quantidade: number, peso: number): number {
  if (quantidade <= 0) return 0;
  return quantidade * peso;
}

export function calcularPesoTotalBruto(
  quantidades: Record<number, number>,
  materiais: ArrastoMaterial[],
): number {
  return materiais.reduce((sum, material) => {
    const quantidade = quantidades[material.id] ?? 0;
    return sum + calcularTotalLinha(quantidade, material.peso);
  }, 0);
}

export function calcularPesoEmKg(
  quantidades: Record<number, number>,
  materiais: ArrastoMaterial[],
): number {
  return roundUp(calcularPesoTotalBruto(quantidades, materiais), 3);
}

export function calcularPesoEmT(pesoEmKg: number): number {
  return roundUp(pesoEmKg / 1000, 3);
}

export function calcularArrastoEmKm(arrastoEmM: number): number {
  return arrastoEmM / 1000;
}

export function calcularQtdACobrar(pesoEmT: number, arrastoEmKm: number): number {
  return roundUp(pesoEmT * arrastoEmKm, 3);
}

export function calcularValorRs(qtdACobrar: number, precoUnitario: number): number {
  return roundUp(qtdACobrar * precoUnitario, 2);
}

export function formatDistritalLabel(value: string): string {
  return value.replace(/_/g, ' ');
}

export function formatNumeroBr(value: number, decimals = 3): string {
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
}

function isObraFieldFilled(obra: ArrastoObra, field: ArrastoObraField): boolean {
  return Boolean(obra[field].trim());
}

export function getArrastoObraFieldError(obra: ArrastoObra, field: ArrastoObraField): string | null {
  if (field === 'reserva') return null;
  if (!OBRA_REQUIRED_FIELDS.includes(field)) return null;
  if (isObraFieldFilled(obra, field)) return null;
  return `${OBRA_FIELD_LABELS[field]} é obrigatório.`;
}

export function getArrastoArrastoEmMError(arrastoEmM: number | null): string | null {
  if (arrastoEmM !== null && arrastoEmM > 0) return null;
  return 'Arrasto em M é obrigatório.';
}

export function validateArrastoParaExportacao(
  obra: ArrastoObra,
  arrastoEmM: number | null,
): string[] {
  const errors = OBRA_REQUIRED_FIELDS.map((field) => getArrastoObraFieldError(obra, field)).filter(
    (error): error is string => error !== null,
  );

  const arrastoError = getArrastoArrastoEmMError(arrastoEmM);
  if (arrastoError) errors.push(arrastoError);

  return errors;
}
