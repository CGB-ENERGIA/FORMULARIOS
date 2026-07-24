import type { CadastroForm, LigadaFase, PadraoEntrada } from '../stores/cadastro';

export const PADRAO_OPTIONS: { value: PadraoEntrada; label: string }[] = [
  { value: 'existente', label: '( ) PADRÃO EXISTENTE' },
  { value: '5m', label: '( ) PADRÃO 5M' },
  { value: '7m', label: '( ) PADRÃO 7M' },
];

export const FASE_OPTIONS: { value: LigadaFase; label: string }[] = [
  { value: 'A', label: 'Monofásica' },
  { value: 'AB', label: 'Bifásica' },
  { value: 'ABC', label: 'Trifásica' },
];

export function getCadastroExportErrors(form: CadastroForm, clienteIndex = 0): string[] {
  const prefix = `Cliente ${clienteIndex + 1}: `;
  const errors: string[] = [];
  if (!form.pep.trim()) errors.push(`${prefix}PEP é obrigatório.`);
  if (!form.nome.trim()) errors.push(`${prefix}Nome é obrigatório.`);
  if (!form.endereco.trim()) errors.push(`${prefix}Endereço é obrigatório.`);
  return errors;
}

export function getCadastroClientesExportErrors(clientes: CadastroForm[]): string[] {
  return clientes.flatMap((form, index) => getCadastroExportErrors(form, index));
}

export function withLabel(label: string, value: string, fallback = label): string {
  const trimmed = value.trim();
  if (!trimmed) return fallback;
  return `${label}${trimmed}`;
}

export function checkboxLabel(checked: boolean, uncheckedText: string, checkedText: string): string {
  return checked ? checkedText : uncheckedText;
}

export function clienteTabLabel(form: CadastroForm, index: number): string {
  const nome = form.nome.trim();
  const cc = form.cc.trim();
  if (nome) return nome;
  if (cc) return `CC ${cc}`;
  return `Cliente ${index + 1}`;
}
