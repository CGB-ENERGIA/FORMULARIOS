/**
 * Histórico de consumidores por distrital.
 * Usa a File System Access API para ler/escrever JSON na máquina do usuário.
 * O FileSystemDirectoryHandle é persistido no IndexedDB para não pedir a pasta toda vez.
 */

// ─── Tipos públicos ───────────────────────────────────────────────────────────

export type DistritalCode = 'BCB' | 'BDC' | 'ITM' | 'PDS' | 'PDT' | 'STI';

export const DISTRITAIS: DistritalCode[] = ['BCB', 'BDC', 'ITM', 'PDS', 'PDT', 'STI'];

export interface HistoricoConsumidor {
  numeroMedidor: string;
  contaContrato: string;
  nomeCompleto: string;
  protocolar: string;
}

export interface HistoricoEntry {
  id: string; // ISO timestamp — chave única
  distrital: DistritalCode;
  siMes: string;
  dataDesligamento: string;
  nota: string;
  pep: string;
  cidade: string;
  inicioDesligamento: string;
  fimDesligamento: string;
  totalConsumidores: number;
  comProtocolo: number;
  semProtocolo: number;
  consumidores: HistoricoConsumidor[];
}

// ─── IndexedDB — armazena o FileSystemDirectoryHandle entre sessões ──────────

const IDB_DB_NAME = 'cgb-formularios';
const IDB_STORE_NAME = 'file-handles';
const IDB_HANDLE_KEY = 'historico-dir';
const IDB_VERSION = 1;

function openIDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_DB_NAME, IDB_VERSION);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(IDB_STORE_NAME);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function saveHandleIDB(handle: FileSystemDirectoryHandle): Promise<void> {
  const db = await openIDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(IDB_STORE_NAME, 'readwrite');
    tx.objectStore(IDB_STORE_NAME).put(handle, IDB_HANDLE_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function loadHandleIDB(): Promise<FileSystemDirectoryHandle | null> {
  const db = await openIDB();
  return new Promise<FileSystemDirectoryHandle | null>((resolve, reject) => {
    const tx = db.transaction(IDB_STORE_NAME, 'readonly');
    const req = tx.objectStore(IDB_STORE_NAME).get(IDB_HANDLE_KEY);
    req.onsuccess = () =>
      resolve((req.result as FileSystemDirectoryHandle | undefined) ?? null);
    req.onerror = () => reject(req.error);
  });
}

async function deleteHandleIDB(): Promise<void> {
  const db = await openIDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(IDB_STORE_NAME, 'readwrite');
    tx.objectStore(IDB_STORE_NAME).delete(IDB_HANDLE_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ─── Gerenciamento de permissão ───────────────────────────────────────────────

async function ensurePermission(handle: FileSystemDirectoryHandle): Promise<boolean> {
  const opts = { mode: 'readwrite' } as FileSystemHandlePermissionDescriptor;
  if ((await handle.queryPermission(opts)) === 'granted') return true;
  return (await handle.requestPermission(opts)) === 'granted';
}

// ─── Obtém o diretório (restaura do IDB ou pede ao usuário) ──────────────────

let _cachedHandle: FileSystemDirectoryHandle | null = null;

export async function getHistoricoDirHandle(): Promise<FileSystemDirectoryHandle> {
  // 1. Usa cache em memória (mesma aba, já autenticado)
  if (_cachedHandle) {
    const ok = await ensurePermission(_cachedHandle);
    if (ok) return _cachedHandle;
    _cachedHandle = null;
  }

  // 2. Tenta restaurar do IndexedDB
  const saved = await loadHandleIDB();
  if (saved) {
    const ok = await ensurePermission(saved);
    if (ok) {
      _cachedHandle = saved;
      return saved;
    }
    // Permissão negada — descarta
    await deleteHandleIDB();
  }

  // 3. Pede ao usuário para escolher a pasta
  const handle = await window.showDirectoryPicker({ mode: 'readwrite' });
  await saveHandleIDB(handle);
  _cachedHandle = handle;
  return handle;
}

export async function clearHistoricoDirHandle(): Promise<void> {
  _cachedHandle = null;
  await deleteHandleIDB();
}

/** Verifica se já existe uma pasta configurada (sem pedir permissão). */
export async function hasStoredDirHandle(): Promise<boolean> {
  const saved = await loadHandleIDB();
  return saved !== null;
}

// ─── Operações de arquivo ─────────────────────────────────────────────────────

function fileNameFor(distrital: DistritalCode): string {
  return `consumidores-${distrital}.json`;
}

async function readEntries(
  dir: FileSystemDirectoryHandle,
  distrital: DistritalCode,
): Promise<HistoricoEntry[]> {
  try {
    const fh = await dir.getFileHandle(fileNameFor(distrital));
    const file = await fh.getFile();
    const text = await file.text();
    const parsed = JSON.parse(text) as unknown;
    return Array.isArray(parsed) ? (parsed as HistoricoEntry[]) : [];
  } catch {
    return [];
  }
}

async function writeEntries(
  dir: FileSystemDirectoryHandle,
  distrital: DistritalCode,
  entries: HistoricoEntry[],
): Promise<void> {
  const fh = await dir.getFileHandle(fileNameFor(distrital), { create: true });
  const writable = await fh.createWritable();
  await writable.write(JSON.stringify(entries, null, 2));
  await writable.close();
}

// ─── API pública ──────────────────────────────────────────────────────────────

/** Adiciona um registro ao histórico da distrital. */
export async function appendHistoricoEntry(entry: HistoricoEntry): Promise<void> {
  const dir = await getHistoricoDirHandle();
  const entries = await readEntries(dir, entry.distrital);
  entries.push(entry);
  await writeEntries(dir, entry.distrital, entries);
}

/** Lê todos os registros de uma distrital. */
export async function loadHistoricoEntries(
  distrital: DistritalCode,
): Promise<HistoricoEntry[]> {
  const dir = await getHistoricoDirHandle();
  return readEntries(dir, distrital);
}

/** Remove um registro pelo id. */
export async function deleteHistoricoEntry(
  distrital: DistritalCode,
  id: string,
): Promise<void> {
  const dir = await getHistoricoDirHandle();
  const entries = await readEntries(dir, distrital);
  await writeEntries(
    dir,
    distrital,
    entries.filter((e) => e.id !== id),
  );
}
