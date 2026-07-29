/**
 * Persistência local dos binários PDF/Excel do módulo Clientes.
 * IndexedDB dedicado — isolado do histórico de metadados.
 */

import type { ArquivoRegistro } from './types';

const IDB_DB_NAME = 'cgb-clientes-arquivos';
const IDB_STORE = 'arquivos';
const IDB_VERSION = 1;

let _db: IDBDatabase | null = null;

function openIDB(): Promise<IDBDatabase> {
  if (_db) return Promise.resolve(_db);
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_DB_NAME, IDB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        const store = db.createObjectStore(IDB_STORE, { keyPath: 'id' });
        store.createIndex('registro_id', 'registro_id', { unique: false });
        store.createIndex('distrital', 'distrital', { unique: false });
      }
    };
    req.onsuccess = () => {
      _db = req.result;
      resolve(_db);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function putArquivo(arquivo: ArquivoRegistro): Promise<void> {
  const db = await openIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).put(arquivo);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getArquivoById(id: string): Promise<ArquivoRegistro | null> {
  const db = await openIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readonly');
    const req = tx.objectStore(IDB_STORE).get(id);
    req.onsuccess = () => resolve((req.result as ArquivoRegistro | undefined) ?? null);
    req.onerror = () => reject(req.error);
  });
}

export async function listArquivosByRegistro(registroId: string): Promise<ArquivoRegistro[]> {
  const db = await openIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readonly');
    const index = tx.objectStore(IDB_STORE).index('registro_id');
    const req = index.getAll(registroId);
    req.onsuccess = () => resolve((req.result as ArquivoRegistro[]) ?? []);
    req.onerror = () => reject(req.error);
  });
}

export async function deleteArquivosByRegistro(registroId: string): Promise<void> {
  const arquivos = await listArquivosByRegistro(registroId);
  if (!arquivos.length) return;
  const db = await openIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    const store = tx.objectStore(IDB_STORE);
    for (const arquivo of arquivos) {
      store.delete(arquivo.id);
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export function createArquivoId(registroId: string, formato: string): string {
  return `${registroId}::${formato}::${crypto.randomUUID()}`;
}

export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
