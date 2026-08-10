import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { createJSONStorage, type PersistStorage } from 'zustand/middleware';

/**
 * Lưu state xuống thiết bị: AsyncStorage trên native, localStorage trên web.
 * Trên bản render phía server (Expo Router web) thì không có storage — trả về
 * bộ nhớ tạm để không nổ lỗi lúc hydrate.
 */
const memoryStore = new Map<string, string>();

const webOrMemoryStorage = {
  getItem: (name: string) =>
    typeof localStorage !== 'undefined' ? localStorage.getItem(name) : (memoryStore.get(name) ?? null),
  setItem: (name: string, value: string) => {
    if (typeof localStorage !== 'undefined') localStorage.setItem(name, value);
    else memoryStore.set(name, value);
  },
  removeItem: (name: string) => {
    if (typeof localStorage !== 'undefined') localStorage.removeItem(name);
    else memoryStore.delete(name);
  },
};

export function storage<T>(): PersistStorage<T> | undefined {
  return createJSONStorage<T>(() =>
    Platform.OS === 'web' ? webOrMemoryStorage : AsyncStorage,
  );
}

export const STORAGE_PREFIX = 'readup:';

export function todayKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export function uid(): string {
  const random = Math.random().toString(36).slice(2, 10);
  return `${Date.now().toString(36)}-${random}`;
}
