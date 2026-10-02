import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { createJSONStorage, type PersistStorage } from 'zustand/middleware';

import { createLazyWriter } from './lazy-persist-core';

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

/**
 * GHI TRỄ trên web. Zustand `persist` mặc định `JSON.stringify` CẢ state rồi ghi
 * localStorage ĐỒNG BỘ ở mỗi lần `set` — mỗi câu trả lời ở màn học là vài lần như
 * vậy, trên một state có hàng nghìn từ + nhật ký lỗi: mất vài chục ms mỗi câu, đúng
 * lúc người học bấm "Tiếp tục". Giờ: gom lại, chỉ chuỗi hoá + ghi một lần sau 500 ms
 * yên (tối đa chờ 2 giây), và GHI NGAY khi tab ẩn / đóng / rời trang (`flushPersist`),
 * nên thoát giữa chừng vẫn không mất tiến độ.
 */
let hooked = false;
const lazy = createLazyWriter({ write: (name, value) => webOrMemoryStorage.setItem(name, JSON.stringify(value)) });

/** Ghi ngay mọi thay đổi đang chờ xuống localStorage. An toàn gọi bất cứ lúc nào. */
export function flushPersist(): void {
  lazy.flush();
}

function hookFlush() {
  if (hooked || typeof window === 'undefined') return;
  hooked = true;
  const onHide = () => {
    if (typeof document === 'undefined' || document.visibilityState === 'hidden') flushPersist();
  };
  document.addEventListener('visibilitychange', onHide);
  window.addEventListener('pagehide', flushPersist);
  window.addEventListener('beforeunload', flushPersist);
}

function lazyWebStorage<T>(): PersistStorage<T> {
  return {
    getItem: (name) => {
      if (lazy.has(name)) return lazy.get(name) as never;
      const raw = webOrMemoryStorage.getItem(name);
      if (raw == null) return null;
      try {
        return JSON.parse(raw);
      } catch {
        return null;
      }
    },
    setItem: (name, value) => {
      hookFlush();
      lazy.set(name, value);
    },
    removeItem: (name) => {
      lazy.remove(name);
      webOrMemoryStorage.removeItem(name);
    },
  };
}

export function storage<T>(): PersistStorage<T> | undefined {
  if (Platform.OS === 'web') return lazyWebStorage<T>();
  return createJSONStorage<T>(() => AsyncStorage);
}

export const STORAGE_PREFIX = 'readup:';

/**
 * Ngày theo giờ MÁY người dùng, không phải UTC. Bản cũ dùng `toISOString()` nên
 * ở Việt Nam từ 00:00 tới 06:59 "hôm nay" vẫn là hôm qua, lệch với chuỗi ngày ở
 * trang Hồ sơ/Xếp hạng (vốn tính theo giờ máy — `gamification/points.ts`).
 */
export function todayKey(date = new Date()): string {
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${m}-${d}`;
}

export function uid(): string {
  const random = Math.random().toString(36).slice(2, 10);
  return `${Date.now().toString(36)}-${random}`;
}
