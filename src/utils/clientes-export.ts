import type { CadastroForm } from '../stores/cadastro';
import type { Consumidor, ObraInfo } from '../stores/consumidores';
import { exportCadastroToExcel } from './cadastro-excel';
import { exportToPdf as exportConsumidoresToPdf } from './pdf';

export interface ClientesExportResult {
  consumidoresFileName: string;
  cadastroFileName: string;
}

/**
 * Exportação padrão de Clientes:
 * 1) Consumidores → PDF
 * 2) Cadastro → Excel (modelo CADASTRO.xlsx)
 */
export async function exportClientesPadrao(
  obra: ObraInfo,
  consumidores: Consumidor[],
  clientes: CadastroForm[],
): Promise<ClientesExportResult> {
  const consumidoresFileName = await exportConsumidoresToPdf(obra, consumidores);
  const cadastroFileName = await exportCadastroToExcel(clientes);

  return { consumidoresFileName, cadastroFileName };
}
