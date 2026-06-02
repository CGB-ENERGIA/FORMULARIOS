import type { Consumidor } from '../stores/consumidores';

export function consumidorPreenchido(c: Consumidor) {
  return Boolean(
    c.nome ||
      c.numeroMedidor ||
      c.tipoLigacao ||
      c.padrao ||
      c.ramalDuplex ||
      c.ramalTriplex ||
      c.posteLigacao ||
      c.dataLigacao,
  );
}

export function getConsumidoresPreenchidos(consumidores: Consumidor[]) {
  return consumidores.filter(consumidorPreenchido);
}
