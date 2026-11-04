import type { Session } from './types';
import { validateSession } from './utils';

const DATABASE_NAME = 'campo-sistemico-v2';
const STORE_NAME = 'sessions';
const DATABASE_VERSION = 1;

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const store = database.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('updatedAt', 'updatedAt');
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('No se pudo abrir la base local.'));
  });
}

export async function listSessions(): Promise<Session[]> {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const request = database.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).getAll();
    request.onsuccess = () => {
      database.close();
      try {
        resolve((request.result as unknown[]).map(validateSession).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
      } catch (error) {
        reject(error);
      }
    };
    request.onerror = () => {
      database.close();
      reject(request.error ?? new Error('No se pudieron leer las sesiones.'));
    };
  });
}

export async function saveSession(session: Session): Promise<void> {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readwrite');
    transaction.objectStore(STORE_NAME).put(session);
    transaction.oncomplete = () => {
      database.close();
      resolve();
    };
    transaction.onerror = () => {
      database.close();
      reject(transaction.error ?? new Error('No se pudo guardar la sesión.'));
    };
  });
}

export async function removeSession(id: string): Promise<void> {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readwrite');
    transaction.objectStore(STORE_NAME).delete(id);
    transaction.oncomplete = () => {
      database.close();
      resolve();
    };
    transaction.onerror = () => {
      database.close();
      reject(transaction.error ?? new Error('No se pudo eliminar la sesión.'));
    };
  });
}
