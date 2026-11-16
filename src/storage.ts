import type { Session } from './types';
import { validateSession } from './utils';

const DATABASE_NAME = 'campo-sistemico-v2';
const STORE_NAME = 'sessions';
const DATABASE_VERSION = 1;
const FALLBACK_KEY = 'campo-sistemico-v2-fallback';

let useFallback = false;

function getFallbackSessions(): Session[] {
  try {
    const raw = localStorage.getItem(FALLBACK_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(validateSession).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  } catch {
    return [];
  }
}

function setFallbackSessions(sessions: Session[]): void {
  try {
    localStorage.setItem(FALLBACK_KEY, JSON.stringify(sessions));
  } catch (error) {
    console.warn('No se pudo guardar en almacenamiento alternativo:', error);
  }
}

function openDatabase(): Promise<IDBDatabase> {
  if (typeof indexedDB === 'undefined') {
    useFallback = true;
    return Promise.reject(new Error('IndexedDB no está disponible en este entorno.'));
  }
  return new Promise((resolve, reject) => {
    try {
      const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
      request.onupgradeneeded = () => {
        const database = request.result;
        if (!database.objectStoreNames.contains(STORE_NAME)) {
          const store = database.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('updatedAt', 'updatedAt');
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        useFallback = true;
        reject(request.error ?? new Error('No se pudo abrir la base local.'));
      };
    } catch (error) {
      useFallback = true;
      reject(error);
    }
  });
}

export async function listSessions(): Promise<Session[]> {
  try {
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
  } catch (error) {
    if (useFallback) return getFallbackSessions();
    throw error;
  }
}

export async function saveSession(session: Session): Promise<void> {
  try {
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
  } catch (error) {
    if (useFallback) {
      const list = getFallbackSessions();
      const index = list.findIndex((item) => item.id === session.id);
      if (index === -1) list.unshift(session);
      else list[index] = session;
      setFallbackSessions(list);
      return;
    }
    throw error;
  }
}

export async function saveAllSessions(sessions: Session[]): Promise<void> {
  try {
    const database = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      for (const item of sessions) {
        store.put(item);
      }
      transaction.oncomplete = () => {
        database.close();
        resolve();
      };
      transaction.onerror = () => {
        database.close();
        reject(transaction.error ?? new Error('No se pudieron guardar las sesiones.'));
      };
    });
  } catch (error) {
    if (useFallback) {
      setFallbackSessions(sessions);
      return;
    }
    throw error;
  }
}

export async function removeSession(id: string): Promise<void> {
  try {
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
  } catch (error) {
    if (useFallback) {
      const list = getFallbackSessions().filter((item) => item.id !== id);
      setFallbackSessions(list);
      return;
    }
    throw error;
  }
}
