import type { CadastroForm } from '../stores/cadastro';
import type { Consumidor, ObraInfo } from '../stores/consumidores';
import { buildCadastroExcelBlob } from './cadastro-excel';
import { buildConsumidoresPdfBlob } from './pdf';
import { downloadBlob } from 'src/services/registros';

export interface ClientesExportResult {
  consumidoresFileName: string;
  cadastroFileName: string;
  pdfBlob: Blob;
  excelBlob: Blob;
}

/**
 * Exportação padrão de Clientes:
 * 1) Consumidores → PDF
 * 2) Cadastro → Excel (modelo CADASTRO.xlsx)
 * Retorna blobs para persistência no módulo de controle.
 */
export async function exportClientesPadrao(
  obra: ObraInfo,
  consumidores: Consumidor[],
  clientes: CadastroForm[],
): Promise<ClientesExportResult> {
  const pdf = await buildConsumidoresPdfBlob(obra, consumidores);
  const excel = await buildCadastroExcelBlob(clientes);

  downloadBlob(pdf.blob, pdf.fileName);
  downloadBlob(excel.blob, excel.fileName);

  return {
    consumidoresFileName: pdf.fileName,
    cadastroFileName: excel.fileName,
    pdfBlob: pdf.blob,
    excelBlob: excel.blob,
  };
}
