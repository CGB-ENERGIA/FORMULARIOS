import type { CusteioCabecalho } from '../stores/custeio';

export function validateCusteioCabecalho(cabecalho: CusteioCabecalho): string[] {
  const errors: string[] = [];
  if (!cabecalho.base.trim()) errors.push('Informe a base.');
  if (!cabecalho.municipio.trim()) errors.push('Informe o município.');
  if (!cabecalho.ordemIncidente.trim()) errors.push('Informe a ordem / incidente.');
  if (!cabecalho.componenteOuPg.trim()) errors.push('Informe o componente ou PG.');
  return errors;
}
