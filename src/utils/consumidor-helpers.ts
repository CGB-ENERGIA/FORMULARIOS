import type { Consumidor } from '../stores/consumidores';

export function consumidorComDados(c: Consumidor) {
  return Boolean(
    c.nome ||
      c.numeroMedidor ||
      c.tipoLigacao ||
      c.padrao ||
      c.ramalDuplex ||
      c.ramalTriplex ||
      c.posteLigacao,
  );
}

export function consumidorPreenchido(c: Consumidor) {
  return consumidorComDados(c);
}

export function getConsumidoresPreenchidos(consumidores: Consumidor[]) {
  return consumidores.filter(consumidorPreenchido);
}

const MEDIDOR_PREFIX: Partial<Record<Consumidor['tipoLigacao'], string>> = {
  MO: '1',
  TRI: '3',
};

export function validateMedidorPorTipoLigacao(consumidor: Consumidor): string | null {
  const prefix = MEDIDOR_PREFIX[consumidor.tipoLigacao];
  if (!prefix) return null;

  const medidor = consumidor.numeroMedidor.trim();
  const tipoLabel = consumidor.tipoLigacao === 'MO' ? 'monofásico (MO)' : 'trifásico (TRI)';

  if (!medidor) {
    return `Informe o número do medidor ${tipoLabel}.`;
  }

  if (!medidor.startsWith(prefix)) {
    return `Medidor ${tipoLabel} deve começar com ${prefix}.`;
  }

  return null;
}

export function getMedidorFieldError(consumidor: Consumidor): string | null {
  const prefix = MEDIDOR_PREFIX[consumidor.tipoLigacao];
  if (!prefix) return null;

  const medidor = consumidor.numeroMedidor.trim();
  if (!medidor) return null;

  if (!medidor.startsWith(prefix)) {
    const tipoLabel = consumidor.tipoLigacao === 'MO' ? 'monofásico (MO)' : 'trifásico (TRI)';
    return `Medidor ${tipoLabel} deve começar com ${prefix}.`;
  }

  return null;
}

export function validateConsumidoresParaExportacao(consumidores: Consumidor[]): string[] {
  const preenchidos = getConsumidoresPreenchidos(consumidores);
  if (preenchidos.length === 0) {
    return ['Preencha ao menos um consumidor antes de exportar.'];
  }

  const errors: string[] = [];
  for (const consumidor of preenchidos) {
    const error = validateMedidorPorTipoLigacao(consumidor);
    if (error) {
      const identificacao = consumidor.nome ? ` (${consumidor.nome})` : '';
      errors.push(`Linha ${consumidor.id}${identificacao}: ${error}`);
    }
  }

  return errors;
}
