import type { Consumidor } from '../stores/consumidores';

export function sanitizeDigits(value: string | number | null | undefined): string {
  return String(value ?? '').replace(/\D/g, '');
}

export function consumidorComDados(c: Consumidor) {
  return Boolean(
    c.nome ||
      c.numeroMedidor ||
      c.tipoLigacao ||
      c.padrao ||
      c.ramalDuplex ||
      c.ramalTriplex ||
      c.posteLigacao ||
      c.fotoPadrao ||
      c.fotoMedidor,
  );
}

export function consumidorPreenchido(c: Consumidor) {
  return consumidorComDados(c);
}

export function getConsumidoresPreenchidos(consumidores: Consumidor[]) {
  return consumidores.filter(consumidorPreenchido);
}

export function inferTipoLigacaoFromMedidor(numeroMedidor: string): 'MO' | 'TRI' | null {
  const first = numeroMedidor.trim().charAt(0);
  if (first === '1') return 'MO';
  if (first === '3') return 'TRI';
  return null;
}

export function applyTipoLigacaoFromMedidor(consumidor: Consumidor): void {
  const inferred = inferTipoLigacaoFromMedidor(consumidor.numeroMedidor);
  if (inferred) {
    consumidor.tipoLigacao = inferred;
  }
}

export function validateMedidorPorTipoLigacao(_consumidor: Consumidor): string | null {
  return null;
}

export function getMedidorFieldError(_consumidor: Consumidor): string | null {
  return null;
}

export function validateConsumidoresParaExportacao(consumidores: Consumidor[]): string[] {
  const preenchidos = getConsumidoresPreenchidos(consumidores);
  if (preenchidos.length === 0) {
    return ['Preencha ao menos um consumidor antes de exportar.'];
  }

  const errors: string[] = [];
  for (const consumidor of preenchidos) {
    const identificacao = consumidor.nome
      ? ` (${consumidor.nome})`
      : ` linha ${consumidor.id}`;

    const medidorError = validateMedidorPorTipoLigacao(consumidor);
    if (medidorError) {
      errors.push(`Linha ${consumidor.id}${identificacao}: ${medidorError}`);
    }

    if (consumidor.nome?.trim() && !consumidor.numeroMedidor?.trim()) {
      errors.push(`Linha ${consumidor.id}${identificacao}: informe o Número do Medidor.`);
    }

    if (!consumidor.padrao) {
      errors.push(`Linha ${consumidor.id}${identificacao}: selecione o Padrão (5M, 7M ou CPP).`);
    }

    if (!consumidor.posteLigacao?.trim()) {
      errors.push(`Linha ${consumidor.id}${identificacao}: informe o Poste de Ligação.`);
    }

    if (!consumidor.fotoPadrao?.trim()) {
      errors.push(`Linha ${consumidor.id}${identificacao}: anexe a FOTO DA FACHADA.`);
    }

    if (!consumidor.fotoMedidor?.trim()) {
      errors.push(`Linha ${consumidor.id}${identificacao}: anexe a FOTO DO MEDIDOR.`);
    }
  }

  return errors;
}
