/**
 * Histórico de consumidores por distrital.
 * Armazenamento: IndexedDB do navegador.
 * — Salva automaticamente ao exportar, sem nenhum diálogo.
 * — Persiste entre sessões enquanto o cache do Chrome não for limpo.
 * — Botão "Exportar JSON" na tela de histórico para backup em arquivo.
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
  nota: string;
  dataConclusao: string;
  municipio: string;
  localidade: string;
  totalConsumidores: number;
  consumidores: HistoricoConsumidor[];
}

// ─── IndexedDB ────────────────────────────────────────────────────────────────

const IDB_DB_NAME = 'cgb-formularios';
const IDB_STORE = 'historico';
const IDB_VERSION = 4;

let _db: IDBDatabase | null = null;

function openIDB(): Promise<IDBDatabase> {
  if (_db) return Promise.resolve(_db);
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_DB_NAME, IDB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE, { keyPath: ['distrital', 'id'] });
      }
      // Remove stores de versões anteriores se existirem
      for (const name of ['file-handles', 'dir-handles']) {
        if (db.objectStoreNames.contains(name)) db.deleteObjectStore(name);
      }
    };
    req.onsuccess = () => { _db = req.result; resolve(_db); };
    req.onerror = () => reject(req.error);
  });
}

// ─── API pública ──────────────────────────────────────────────────────────────

/** Salva uma entrada. Silencioso, sem diálogo. */
export async function appendHistoricoEntry(entry: HistoricoEntry): Promise<void> {
  const db = await openIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).put(entry);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** Retorna todos os registros de uma distrital (mais recente primeiro). */
export async function loadHistoricoEntries(
  distrital: DistritalCode,
): Promise<HistoricoEntry[]> {
  const db = await openIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readonly');
    const range = IDBKeyRange.bound([distrital, ''], [distrital, '￿']);
    const req = tx.objectStore(IDB_STORE).getAll(range);
    req.onsuccess = () =>
      resolve((req.result as HistoricoEntry[]).sort((a, b) => b.id.localeCompare(a.id)));
    req.onerror = () => reject(req.error);
  });
}

/** Remove um registro. */
export async function deleteHistoricoEntry(
  distrital: DistritalCode,
  id: string,
): Promise<void> {
  const db = await openIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).delete([distrital, id]);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** Baixa o histórico da distrital como arquivo JSON (backup manual). */
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
