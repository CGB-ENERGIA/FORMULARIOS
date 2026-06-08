/**
 * Histórico de consumidores por distrital.
 *
 * Estratégia dupla:
 *  1. IndexedDB  — leitura rápida no app, sempre disponível.
 *  2. Arquivo em Documentos — persistência real na máquina do usuário.
 *     • 1ª vez: abre seletor já em Documentos (usuário clica "Selecionar pasta").
 *     • Sessões seguintes: pequeno aviso do Chrome "Permitir editar arquivos?" → Permitir.
 *     • Dentro da mesma sessão: salva silenciosamente, sem nenhum diálogo.
 */

// ─── Tipos públicos ───────────────────────────────────────────────────────────

export type DistritalCode = 'BCB' | 'BDC' | 'ITM' | 'PDS' | 'PDT' | 'STI';

export const DISTRITAIS: DistritalCode[] = ['BCB', 'BDC', 'ITM', 'PDS', 'PDT', 'STI'];

export interface HistoricoConsumidor {
  nome: string;
  numeroMedidor: string;
  tipoLigacao: string;
  padrao: string;
  posteLigacao: string;
  dataLigacao: string;
}

export interface HistoricoEntry {
  id: string; // ISO timestamp — chave única
  distrital: DistritalCode;
  descricaoObra: string;
  elementoPep: string;
  dataConclusao: string;
  municipio: string;
  localidade: string;
  totalConsumidores: number;
  consumidores: HistoricoConsumidor[];
}

// ─── IndexedDB ────────────────────────────────────────────────────────────────

const IDB_DB_NAME = 'cgb-formularios';
const IDB_HISTORICO_STORE = 'historico';
const IDB_HANDLES_STORE = 'dir-handles';
const IDB_HANDLE_KEY = 'documentos-dir';
const IDB_VERSION = 3;

let _db: IDBDatabase | null = null;

function openIDB(): Promise<IDBDatabase> {
  if (_db) return Promise.resolve(_db);
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_DB_NAME, IDB_VERSION);
    req.onupgradeneeded = (event) => {
      const db = req.result;
      if (!db.objectStoreNames.contains(IDB_HISTORICO_STORE)) {
        db.createObjectStore(IDB_HISTORICO_STORE, { keyPath: ['distrital', 'id'] });
      }
      if (!db.objectStoreNames.contains(IDB_HANDLES_STORE)) {
        db.createObjectStore(IDB_HANDLES_STORE);
      }
      // Remove stores antigas se existirem (migração)
      if (event.oldVersion < 3) {
        if (db.objectStoreNames.contains('file-handles')) {
          db.deleteObjectStore('file-handles');
        }
      }
    };
    req.onsuccess = () => { _db = req.result; resolve(_db); };
    req.onerror = () => reject(req.error);
  });
}

// ─── IndexedDB: histórico ─────────────────────────────────────────────────────

async function idbPutEntry(entry: HistoricoEntry): Promise<void> {
  const db = await openIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_HISTORICO_STORE, 'readwrite');
    tx.objectStore(IDB_HISTORICO_STORE).put(entry);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function idbGetEntries(distrital: DistritalCode): Promise<HistoricoEntry[]> {
  const db = await openIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_HISTORICO_STORE, 'readonly');
    const range = IDBKeyRange.bound([distrital, ''], [distrital, '￿']);
    const req = tx.objectStore(IDB_HISTORICO_STORE).getAll(range);
    req.onsuccess = () =>
      resolve((req.result as HistoricoEntry[]).sort((a, b) => b.id.localeCompare(a.id)));
    req.onerror = () => reject(req.error);
  });
}

async function idbDeleteEntry(distrital: DistritalCode, id: string): Promise<void> {
  const db = await openIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_HISTORICO_STORE, 'readwrite');
    tx.objectStore(IDB_HISTORICO_STORE).delete([distrital, id]);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ─── IndexedDB: handle de diretório ──────────────────────────────────────────

async function idbSaveHandle(handle: FileSystemDirectoryHandle): Promise<void> {
  const db = await openIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_HANDLES_STORE, 'readwrite');
    tx.objectStore(IDB_HANDLES_STORE).put(handle, IDB_HANDLE_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function idbLoadHandle(): Promise<FileSystemDirectoryHandle | null> {
  const db = await openIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_HANDLES_STORE, 'readonly');
    const req = tx.objectStore(IDB_HANDLES_STORE).get(IDB_HANDLE_KEY);
    req.onsuccess = () =>
      resolve((req.result as FileSystemDirectoryHandle | undefined) ?? null);
    req.onerror = () => reject(req.error);
  });
}

// ─── File System Access API — pasta Documentos ───────────────────────────────

let _dirHandle: FileSystemDirectoryHandle | null = null;

async function ensurePermission(handle: FileSystemDirectoryHandle): Promise<boolean> {
  const opts = { mode: 'readwrite' } as FileSystemHandlePermissionDescriptor;
  if ((await handle.queryPermission(opts)) === 'granted') return true;
  return (await handle.requestPermission(opts)) === 'granted';
}

/**
 * Retorna o handle da pasta Documentos.
 * - Na 1ª vez: abre o seletor já em Documentos.
 * - Nas demais: restaura do IndexedDB e re-pede permissão se necessário.
 */
export async function getDirHandle(): Promise<FileSystemDirectoryHandle> {
  // Cache em memória (mesma sessão, já autorizado)
  if (_dirHandle && (await ensurePermission(_dirHandle))) return _dirHandle;

  // Tenta restaurar do IndexedDB
  const saved = await idbLoadHandle();
  if (saved && (await ensurePermission(saved))) {
    _dirHandle = saved;
    return saved;
  }

  // Primeira vez: abre o seletor de pasta (começa na Área de Trabalho)
  const handle = await window.showDirectoryPicker({
    mode: 'readwrite',
    startIn: 'desktop',
  });
  await idbSaveHandle(handle);
  _dirHandle = handle;
  return handle;
}

/** Escreve (ou atualiza) o arquivo JSON da distrital na pasta configurada. */
async function writeDistritalFile(
  dir: FileSystemDirectoryHandle,
  distrital: DistritalCode,
  entries: HistoricoEntry[],
): Promise<void> {
  const fh = await dir.getFileHandle(`consumidores-${distrital}.json`, { create: true });
  const writable = await fh.createWritable();
  await writable.write(JSON.stringify(entries, null, 2));
  await writable.close();
}

async function readDistritalFile(
  dir: FileSystemDirectoryHandle,
  distrital: DistritalCode,
): Promise<HistoricoEntry[]> {
  try {
    const fh = await dir.getFileHandle(`consumidores-${distrital}.json`);
    const text = await (await fh.getFile()).text();
    const parsed = JSON.parse(text) as unknown;
    return Array.isArray(parsed) ? (parsed as HistoricoEntry[]) : [];
  } catch {
    return [];
  }
}

// ─── API pública ──────────────────────────────────────────────────────────────

/**
 * Salva uma entrada no histórico.
 * Sempre grava no IndexedDB (silencioso).
 * Se o handle da pasta já estiver configurado, grava também no arquivo — sem abrir diálogo.
 * NÃO chama showDirectoryPicker aqui (precisa ser feito via botão direto do usuário).
 */
export async function appendHistoricoEntry(entry: HistoricoEntry): Promise<void> {
  // 1. IndexedDB — sempre, sem falha
  await idbPutEntry(entry);

  // 2. Arquivo — apenas se o handle já existir e tiver permissão (sem diálogo)
  try {
    const saved = _dirHandle ?? (await idbLoadHandle());
    if (!saved) return; // pasta não configurada ainda — tudo bem, IndexedDB tem os dados

    const opts = { mode: 'readwrite' } as FileSystemHandlePermissionDescriptor;
    const perm = await saved.queryPermission(opts);
    if (perm !== 'granted') return; // permissão expirou — silencioso, sem pedir

    _dirHandle = saved;
    const existing = await readDistritalFile(saved, entry.distrital);
    const updated = [...existing.filter((e) => e.id !== entry.id), entry];
    await writeDistritalFile(saved, entry.distrital, updated);
  } catch (err) {
    console.warn('Falhou ao gravar arquivo (IndexedDB preservado):', err);
  }
}

/** Lê todos os registros de uma distrital do IndexedDB (leitura rápida no app). */
export async function loadHistoricoEntries(
  distrital: DistritalCode,
): Promise<HistoricoEntry[]> {
  return idbGetEntries(distrital);
}

/** Remove um registro do IndexedDB e do arquivo (se o handle existir). */
export async function deleteHistoricoEntry(
  distrital: DistritalCode,
  id: string,
): Promise<void> {
  await idbDeleteEntry(distrital, id);

  try {
    const saved = _dirHandle ?? (await idbLoadHandle());
    if (!saved) return;
    const opts = { mode: 'readwrite' } as FileSystemHandlePermissionDescriptor;
    if ((await saved.queryPermission(opts)) !== 'granted') return;
    const entries = await readDistritalFile(saved, distrital);
    await writeDistritalFile(saved, distrital, entries.filter((e) => e.id !== id));
  } catch {
    // silencioso
  }
}

/**
 * Abre o seletor de pasta para configurar onde salvar os arquivos.
 * DEVE ser chamado diretamente de um evento de clique do usuário.
 */
export async function configurarPastaHistorico(): Promise<string> {
  const handle = await window.showDirectoryPicker({
    mode: 'readwrite',
    startIn: 'desktop',
  });
  await idbSaveHandle(handle);
  _dirHandle = handle;
  return handle.name; // retorna o nome da pasta escolhida
}

/** Verifica se uma pasta já foi configurada (sem abrir diálogo). */
export async function isPastaConfigurada(): Promise<boolean> {
  if (_dirHandle) return true;
  const saved = await idbLoadHandle();
  return saved !== null;
}

/** Exporta o histórico da distrital como download de arquivo JSON (backup manual). */
export async function exportHistoricoAsJson(distrital: DistritalCode): Promise<void> {
  const entries = await idbGetEntries(distrital);
  const blob = new Blob([JSON.stringify(entries, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `consumidores-${distrital}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
