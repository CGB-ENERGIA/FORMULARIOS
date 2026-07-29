/**
 * Modelo de registro de formulário / relatório.
 * Campos em snake_case alinhados ao futuro schema Supabase.
 */

import type { DistritalCode } from 'src/utils/historico-file';

export type FormularioTipo = 'clientes' | 'consumidores' | 'cadastro';

export type RelatorioFormato = 'pdf' | 'excel' | 'pdf_excel';

export interface RelatorioGerado {
  formato: RelatorioFormato;
  nome_arquivo: string;
}

export interface RegistroConsumidor {
  nome: string;
  numero_medidor: string;
  tipo_ligacao: string;
  padrao: string;
  poste_ligacao: string;
  data_ligacao: string;
}

/** Registro consolidado de uma exportação / obra. */
export interface FormRegistro {
  id: string;
  created_at: string;
  distrital: DistritalCode;
  formulario: FormularioTipo;
  relatorios: RelatorioGerado[];
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

export interface RegistrosRepository {
  list(distrital?: DistritalCode | null): Promise<FormRegistro[]>;
  save(registro: FormRegistro): Promise<void>;
  remove(distrital: DistritalCode, id: string): Promise<void>;
  exportJson(distrital: DistritalCode): Promise<void>;
}
