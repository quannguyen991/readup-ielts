/**
 * Đọc `/api/city-hub` (Trung tâm Tương lai) cho giao diện — dùng chung giữa màn
 * 3D (`ui/HubView.tsx`) và khối giới thiệu ở trang /quest (`QuestCityHero`).
 *
 * Giữ bản gần nhất trong bộ nhớ của phiên: mở lại màn là thấy ngay số cũ, rồi
 * làm mới nếu bản đó quá 20 giây (máy chủ cũng đệm 20 giây). Không thời gian
 * thực — người dùng bấm "Làm mới" hoặc góp xong là có số mới.
 */
import { useCallback, useEffect, useState } from 'react';

import type { HubSnapshot } from '@/services/city/hub';
import { currentLocale, pick } from '@/i18n/useL';

const FRESH_MS = 20_000;
let last: { at: number; token: string | null; data: HubSnapshot } | null = null;

export function rememberHub(data: HubSnapshot, token: string | null): void {
  last = { at: Date.now(), token, data };
}

export function useHubSnapshot(token: string | null): { data: HubSnapshot | null; error: string | null; loading: boolean; refresh: () => void; replace: (d: HubSnapshot) => void } {
  // Dữ liệu gắn với người xem đã tải nó: đổi người dùng (đăng nhập / đăng xuất) thì phần
  // "của tôi" của người trước không được hiện sang người sau.
  const [got, setGot] = useState<{ token: string | null; data: HubSnapshot } | null>(() => (last ? { token: last.token, data: last.data } : null));
  const data = got && got.token === token ? got.data : last && last.token === token ? last.data : null;
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(() => !(last && last.token === token && Date.now() - last.at < FRESH_MS));
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (last && last.token === token && Date.now() - last.at < FRESH_MS && tick === 0) return;
    let dead = false;
    fetch('/api/city-hub', { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then((r) => r.json())
      .then((b: HubSnapshot & { error?: string }) => {
        if (dead) return;
        if (b.error || !b.progress) setError(b.error ?? pick(currentLocale(), 'Lỗi', 'Error'));
        else {
          rememberHub(b, token);
          setGot({ token, data: b });
          setError(null);
        }
      })
      .catch((e: unknown) => !dead && setError(e instanceof Error ? e.message : String(e)))
      .finally(() => !dead && setLoading(false));
    return () => {
      dead = true;
    };
  }, [token, tick]);

  const refresh = useCallback(() => {
    setLoading(true);
    setTick((n) => n + 1);
  }, []);
  const replace = useCallback(
    (d: HubSnapshot) => {
      rememberHub(d, token);
      setGot({ token, data: d });
    },
    [token],
  );
  return { data, error, loading, refresh, replace };
}
