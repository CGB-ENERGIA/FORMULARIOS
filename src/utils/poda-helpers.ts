import type { PodaCabecalho } from '../stores/poda';

export function validatePodaCabecalho(cabecalho: PodaCabecalho): string[] {
  const errors: string[] = [];
  if (!cabecalho.pep.trim()) errors.push('Informe o PEP.');
  if (!cabecalho.base.trim()) errors.push('Informe a base.');
  if (!cabecalho.cidade.trim()) errors.push('Informe a cidade.');
  if (!cabecalho.descricaoObra.trim()) errors.push('Informe a descrição da obra.');
  return errors;
}
