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

export function getCadastroExportErrors(form: CadastroForm): string[] {
  const errors: string[] = [];
  if (!form.pep.trim()) errors.push('PEP é obrigatório.');
  if (!form.nome.trim()) errors.push('Nome é obrigatório.');
  if (!form.endereco.trim()) errors.push('Endereço é obrigatório.');
  return errors;
}

export function withLabel(label: string, value: string, fallback = label): string {
  const trimmed = value.trim();
  if (!trimmed) return fallback;
  return `${label}${trimmed}`;
}

export function checkboxLabel(checked: boolean, uncheckedText: string, checkedText: string): string {
  return checked ? checkedText : uncheckedText;
}
