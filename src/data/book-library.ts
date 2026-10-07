import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

/**
 * Books imported by a reader stay on this device. Nothing from this library is
 * added to the shared bilingual article catalogue or synced to the server.
 */
export type PersonalBook = {
  id: string;
  catalogId?: string;
  title: string;
  author?: string;
  importedAt: string;
  /** One text page per source PDF page, or roughly 1,800-character text slices. */
  pagesEn: string[];
  /** Optional Vietnamese PDF/text edition imported by the reader. */
  pagesVi?: string[];
  /** On-demand AI translations, indexed by English page. Kept on-device. */
  translatedPages: Record<number, string>;
  currentPage: number;
};

const STORAGE_KEY = 'readup:bilingual:personal-books:v1';
const DATABASE_NAME = 'readup-bilingual-library';
const STORE_NAME = 'books';
const MAX_BOOKS = 30;
let databasePromise: Promise<IDBDatabase> | null = null;

export async function listPersonalBooks(): Promise<PersonalBook[]> {
  if (Platform.OS === 'web' && typeof indexedDB !== 'undefined') {
    const books = await webRequest<PersonalBook[]>('readonly', (store) => store.getAll());
    return (books ?? []).sort((a, b) => b.importedAt.localeCompare(a.importedAt));
  }
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const value = JSON.parse(raw) as unknown;
    return Array.isArray(value) ? (value as PersonalBook[]) : [];
  } catch {
    return [];
  }
}

export async function savePersonalBook(book: PersonalBook): Promise<void> {
  if (Platform.OS === 'web' && typeof indexedDB !== 'undefined') {
    const books = await listPersonalBooks();
    if (books.length >= MAX_BOOKS && !books.some((item) => item.id === book.id)) {
      throw new Error('Thư viện đã đủ 30 sách. Hãy xoá sách cũ trước khi nhập thêm.');
    }
    await webRequest('readwrite', (store) => store.put(book));
    return;
  }
  const books = await listPersonalBooks();
  const next = [book, ...books.filter((item) => item.id !== book.id)].slice(0, MAX_BOOKS);
  const serialized = JSON.stringify(next);
  // Keep below common browser localStorage quotas (UTF-16 storage).
  if (serialized.length > 1_500_000) {
    throw new Error('Thư viện trên thiết bị gần đầy. Hãy xoá sách đã đọc hoặc nhập từng phần ngắn hơn.');
  }
  await AsyncStorage.setItem(STORAGE_KEY, serialized);
}

export async function updatePersonalBook(id: string, update: (book: PersonalBook) => PersonalBook): Promise<PersonalBook | null> {
  const books = await listPersonalBooks();
  const current = books.find((book) => book.id === id);
  if (!current) return null;
  const nextBook = update(current);
  if (Platform.OS === 'web' && typeof indexedDB !== 'undefined') {
    await webRequest('readwrite', (store) => store.put(nextBook));
    return nextBook;
  }
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(books.map((book) => (book.id === id ? nextBook : book))));
  return nextBook;
}

export async function deletePersonalBook(id: string): Promise<void> {
  if (Platform.OS === 'web' && typeof indexedDB !== 'undefined') {
    await webRequest('readwrite', (store) => store.delete(id));
    return;
  }
  const books = await listPersonalBooks();
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(books.filter((book) => book.id !== id)));
}

function openDatabase(): Promise<IDBDatabase> {
  if (databasePromise) return databasePromise;
  databasePromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Could not open the local book library.'));
  });
  return databasePromise;
}

function webRequest<T>(mode: IDBTransactionMode, createRequest: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDatabase().then((database) => new Promise<T>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, mode);
    const request = createRequest(transaction.objectStore(STORE_NAME));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Could not access the local book library.'));
    transaction.onabort = () => reject(transaction.error ?? new Error('Could not save to the local book library.'));
  }));
}
