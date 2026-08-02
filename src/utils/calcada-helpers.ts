import type { CalcadaObra, CalcadaEvidencia } from '../stores/calcada';

/**
 * PI — extrai 3 caracteres do PEP a partir da posição 11 (MID(PEP;11;3)).
 * Ex: "MA-2609612MGD1.3.0008" → caracteres 11-13.
 */
export function calcularPi(pep: string): string {
  if (!pep) return '';
  return pep.substring(10, 13);
}

/**
 * SETOR — "EME" se o PI for "EME", senão "OBRA". Vazio se não houver PEP.
 */
export function calcularSetor(pep: string): string {
  if (!pep) return '';
  return calcularPi(pep) === 'EME' ? 'EME' : 'OBRA';
}

/**
 * PEP sem pontuação — remove "." e "-".
 * Ex: "MA-2609612MGD1.3.0008" → "MA2609612MGD130008".
 */
export function calcularPepLimpo(pep: string): string {
  return pep.replace(/[.-]/g, '');
}

/**
 * VALOR R$ — quantidade de calçada × valor SAP (preço unitário).
 */
export function calcularValorRs(quantidade: number | null, valorSap: number | null): number {
  const q = quantidade ?? 0;
  const v = valorSap ?? 0;
  return q * v;
}

/** Formata número como moeda BRL. */
export function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** Garante que os dados mínimos da obra estão preenchidos para exportação. */
export function validateCalcadaObra(obra: CalcadaObra): string[] {
  const errors: string[] = [];
  if (!obra.pep.trim()) errors.push('Informe o PEP da obra.');
  if (!obra.nota.trim()) errors.push('Informe a nota.');
  if (!obra.distrital.trim()) errors.push('Informe o distrital.');
  if (!obra.descricaoObra.trim()) errors.push('Informe a descrição da obra.');
  if (!obra.municipio.trim()) errors.push('Informe o município.');
  if (!calcularPi(obra.pep)) errors.push('PEP inválido — não foi possível calcular o PI.');
  if (!calcularSetor(obra.pep)) errors.push('PEP inválido — não foi possível calcular o setor.');
  if (obra.quantidade == null || obra.quantidade <= 0) {
    errors.push('Informe a quantidade de reparos.');
  }
  return errors;
}

/** Evidência com PG e par de fotos Antes/Depois preenchidos. */
export function evidenciaCompleta(e: CalcadaEvidencia): boolean {
  return !!(e.pg.trim() && e.fotoAntes && e.fotoDepois);
}

/** Quantidade informada define quantas evidências completas são obrigatórias. */
export function quantidadeEvidenciasRequeridas(quantidade: number | null): number {
  if (quantidade == null || quantidade <= 0) return 1;
  return Math.ceil(quantidade);
}

export function validateCalcadaEvidencias(
  obra: CalcadaObra,
  evidencias: CalcadaEvidencia[],
): string[] {
  const required = quantidadeEvidenciasRequeridas(obra.quantidade);
  const errors: string[] = [];

  if (evidencias.length < required) {
    errors.push(`Adicione ${required} evidência(s) conforme a quantidade informada.`);
  }

  for (let i = 0; i < required; i++) {
    const ev = evidencias[i];
    if (!ev || !evidenciaCompleta(ev)) {
      errors.push(`Evidência ${i + 1}: informe o PG e as fotos Antes e Depois.`);
    }
  }

  return errors;
}
