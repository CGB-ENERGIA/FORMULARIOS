import { defineBoot } from '#q-app/wrappers';

const SKIP_INPUT_TYPES = new Set([
  'password',
  'number',
  'email',
  'file',
  'hidden',
  'checkbox',
  'radio',
  'range',
  'color',
  'date',
  'time',
  'datetime-local',
  'month',
  'week',
]);

function shouldUppercase(el: HTMLInputElement | HTMLTextAreaElement): boolean {
  if (el instanceof HTMLInputElement && SKIP_INPUT_TYPES.has(el.type)) return false;
  if (el.disabled || el.readOnly) return false;
  if (el instanceof HTMLInputElement && el.inputMode === 'numeric') return false;
  if (el.closest('[data-no-uppercase]')) return false;
  return true;
}

function applyUppercase(el: HTMLInputElement | HTMLTextAreaElement): void {
  const { selectionStart, selectionEnd, value } = el;
  const upper = value.toUpperCase();
  if (value === upper) return;

  el.value = upper;
  el.dispatchEvent(new Event('input', { bubbles: true }));

  if (selectionStart != null && selectionEnd != null) {
    el.setSelectionRange(selectionStart, selectionEnd);
  }
}

function bindUppercase(el: HTMLInputElement | HTMLTextAreaElement): void {
  if ((el as HTMLInputElement & { __uppercaseBound?: boolean }).__uppercaseBound) return;
  (el as HTMLInputElement & { __uppercaseBound?: boolean }).__uppercaseBound = true;

  const handleInput = () => {
    if (shouldUppercase(el)) applyUppercase(el);
  };

  el.addEventListener('input', handleInput);
  el.addEventListener('blur', handleInput);

  if (shouldUppercase(el) && el.value) {
    applyUppercase(el);
  }
}

function scanUppercaseTargets(root: ParentNode): void {
  root.querySelectorAll('input, textarea').forEach((node) => {
    if (node instanceof HTMLInputElement || node instanceof HTMLTextAreaElement) {
      bindUppercase(node);
    }
  });
}

export default defineBoot(() => {
  if (typeof document === 'undefined') return;

  scanUppercaseTargets(document.body);

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (!(node instanceof HTMLElement)) continue;
        if (node.matches('input, textarea')) {
          bindUppercase(node as HTMLInputElement | HTMLTextAreaElement);
        }
        scanUppercaseTargets(node);
      }
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
});
