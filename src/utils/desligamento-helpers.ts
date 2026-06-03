import type { DesligamentoConsumidor, ProtocolarOpcao } from '../stores/desligamento';

export function consumidorDesligamentoComDados(consumidor: DesligamentoConsumidor) {
  return Boolean(
    consumidor.contaContrato ||
      consumidor.numeroMedidor ||
      consumidor.nomeCompleto ||
      consumidor.protocolar,
  );
}

export function getConsumidoresDesligamentoPreenchidos(consumidores: DesligamentoConsumidor[]) {
  return consumidores.filter(consumidorDesligamentoComDados);
}

export function getTipoCliente(protocolar: ProtocolarOpcao) {
  if (!protocolar) return '';
  return protocolar === 'NAO' ? 'PESSOA FISICA' : 'PESSOA JURIDICA';
}

export function contarPorProtocolar(
  consumidores: DesligamentoConsumidor[],
  protocolar: Exclude<ProtocolarOpcao, ''>,
) {
  return getConsumidoresDesligamentoPreenchidos(consumidores).filter(
    (consumidor) => consumidor.protocolar === protocolar,
  ).length;
}

export function validateDesligamentoParaExportacao(
  consumidores: DesligamentoConsumidor[],
): string[] {
  const preenchidos = getConsumidoresDesligamentoPreenchidos(consumidores);
  if (preenchidos.length === 0) {
    return ['Preencha ao menos um consumidor antes de exportar.'];
  }

  const errors: string[] = [];
  for (const consumidor of preenchidos) {
    if (!consumidor.protocolar) {
      errors.push(`Linha ${consumidor.id}: informe se é com ou sem protocolo.`);
    }
  }

  return errors;
}
