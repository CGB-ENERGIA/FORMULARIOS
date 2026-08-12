import type { CusteioCabecalho } from '../stores/custeio';

export function validateCusteioCabecalho(cabecalho: CusteioCabecalho): string[] {
  const errors: string[] = [];
  if (!cabecalho.base.trim()) errors.push('Informe a base.');
  if (!cabecalho.municipio.trim()) errors.push('Informe o município.');
  if (cabecalho.tipoOrdem === 'incidente') {
    if (!cabecalho.numeroIncidente.trim()) errors.push('Informe o número do incidente.');
  } else {
    if (!cabecalho.componenteOuPg.trim()) errors.push('Informe o componente ou PG.');
  }
  if (!cabecalho.prefixoEquipe.trim()) errors.push('Informe o prefixo da equipe.');
  if (!cabecalho.dataExecucao.trim()) errors.push('Informe a data de execução.');
  return errors;
}
