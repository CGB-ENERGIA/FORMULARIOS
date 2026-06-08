/**
 * Histórico de consumidores por distrital.
 * Armazena automaticamente no IndexedDB do navegador — sem diálogos, sem permissões.
 * Oferece exportação como JSON para backup em arquivo quando necessário.
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
const IDB_STORE_NAME = 'historico';
const IDB_VERSION = 2; // versão 2: migra de file-handles para historico

let _db: IDBDatabase | null = null;

function openIDB(): Promise<IDBDatabase> {
  if (_db) return Promise.resolve(_db);

  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_DB_NAME, IDB_VERSION);

    req.onupgradeneeded = (event) => {
      const db = req.result;
      // Cria a store de histórico se não existir
      if (!db.objectStoreNames.contains(IDB_STORE_NAME)) {
        // keyPath composto: distrital + id
        db.createObjectStore(IDB_STORE_NAME, { keyPath: ['distrital', 'id'] });
      }
      // Remove store antiga de handles se existir (migração da versão 1)
      if (event.oldVersion < 2 && db.objectStoreNames.contains('file-handles')) {
        db.deleteObjectStore('file-handles');
      }
    };

    req.onsuccess = () => {
      _db = req.result;
      resolve(_db);
    };
    req.onerror = () => reject(req.error);
  });
}

// ─── API pública ──────────────────────────────────────────────────────────────

/** Salva uma entrada no histórico (sem nenhum diálogo). */
export async function appendHistoricoEntry(entry: HistoricoEntry): Promise<void> {
  const db = await openIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE_NAME, 'readwrite');
    tx.objectStore(IDB_STORE_NAME).put(entry);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** Retorna todos os registros de uma distrital, do mais recente ao mais antigo. */
export async function loadHistoricoEntries(
  distrital: DistritalCode,
): Promise<HistoricoEntry[]> {
  const db = await openIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE_NAME, 'readonly');
    const store = tx.objectStore(IDB_STORE_NAME);
    // IDBKeyRange para buscar todos com distrital = X
    const range = IDBKeyRange.bound([distrital, ''], [distrital, '￿']);
    const req = store.getAll(range);
    req.onsuccess = () => {
      const entries = (req.result as HistoricoEntry[]).sort(
        (a, b) => b.id.localeCompare(a.id), // mais recente primeiro
      );
      resolve(entries);
    };
    req.onerror = () => reject(req.error);
  });
}

/** Remove um registro pelo id. */
export async function deleteHistoricoEntry(
  distrital: DistritalCode,
  id: string,
): Promise<void> {
  const db = await openIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE_NAME, 'readwrite');
    tx.objectStore(IDB_STORE_NAME).delete([distrital, id]);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** Exporta todos os registros de uma distrital como download de arquivo JSON. */
export async function exportHistoricoAsJson(distrital: DistritalCode): Promise<void> {
  const entries = await loadHistoricoEntries(distrital);
  const json = JSON.stringify(entries, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `consumidores-${distrital}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Retorna o total de registros salvos de uma distrital (rápido, sem carregar tudo). */
export async function countHistoricoEntries(distrital: DistritalCode): Promise<number> {
  const db = await openIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE_NAME, 'readonly');
    const range = IDBKeyRange.bound([distrital, ''], [distrital, '￿']);
    const req = tx.objectStore(IDB_STORE_NAME).count(range);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
