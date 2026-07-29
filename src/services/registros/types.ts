/**
 * Modelo de registro do módulo Clientes (controle / pesquisa / medidores).
 * Campos em snake_case alinhados ao futuro schema Supabase.
 */

import type { DistritalCode } from 'src/utils/historico-file';

export type FormularioTipo = 'clientes' | 'consumidores' | 'cadastro';

export type RelatorioFormato = 'pdf' | 'excel';

/** Metadados de um arquivo gerado (PDF/Excel). O blob fica no store de arquivos. */
export interface RelatorioGerado {
  id: string;
  formato: RelatorioFormato;
  nome_arquivo: string;
  mime_type: string;
  tamanho_bytes: number;
  /** true quando o binário está persistido localmente (ou no Storage remoto). */
  armazenado: boolean;
  /** Quando este arquivo foi gerado (ISO). */
  exported_at?: string;
}

export interface RegistroConsumidor {
  nome: string;
  numero_medidor: string;
  tipo_ligacao: string;
  padrao: string;
  poste_ligacao: string;
  data_ligacao: string;
  /** Controle: medidor já baixado / entregue. */
  medidor_baixado: boolean;
}

/** Uma exportação no histórico do mesmo Elemento PEP. */
export interface HistoricoExportacao {
  id: string;
  exported_at: string;
  total_consumidores: number;
  descricao_obra: string;
  relatorios: RelatorioGerado[];
}

/** Registro consolidado de uma obra no módulo Clientes (1 por PEP + distrital). */
export interface FormRegistro {
  id: string;
  created_at: string;
  updated_at: string;
  distrital: DistritalCode;
  formulario: FormularioTipo;
  /** Arquivos da exportação mais recente. */
  relatorios: RelatorioGerado[];
  /** Histórico de exportações (mais recente primeiro). */
  historico_exportacoes: HistoricoExportacao[];
  descricao_obra: string;
  elemento_pep: string;
  data_conclusao: string;
  municipio: string;
  localidade: string;
  total_consumidores: number;
  consumidores: RegistroConsumidor[];
  /** Extensível para metadados futuros (Supabase JSONB). */
  metadata?: Record<string, unknown>;
}

export interface ArquivoRegistro {
  id: string;
  registro_id: string;
  distrital: DistritalCode;
  formato: RelatorioFormato;
  nome_arquivo: string;
  mime_type: string;
  blob: Blob;
  created_at: string;
}

export type MedidorFiltro = 'todos' | 'baixados' | 'pendentes';

export interface RegistrosRepository {
  list(distrital?: DistritalCode | null): Promise<FormRegistro[]>;
  findByPep(distrital: DistritalCode, elementoPep: string): Promise<FormRegistro | null>;
  save(registro: FormRegistro): Promise<void>;
  remove(distrital: DistritalCode, id: string): Promise<void>;
  updateConsumidorMedidor(
    distrital: DistritalCode,
    registroId: string,
    numeroMedidor: string,
    medidorBaixado: boolean,
  ): Promise<void>;
  saveArquivo(arquivo: Omit<ArquivoRegistro, 'created_at'> & { created_at?: string }): Promise<void>;
  getArquivo(arquivoId: string): Promise<ArquivoRegistro | null>;
  listArquivos(registroId: string): Promise<ArquivoRegistro[]>;
  exportJson(distrital: DistritalCode): Promise<void>;
}

export function normalizePep(pep: string): string {
  return pep.trim().toUpperCase();
}
