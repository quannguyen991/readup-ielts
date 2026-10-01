/**
 * DẢI "BAND 9 CÓ TÊN MIỀN MỚI" — chỉ hiện ở tên miền cũ (readup-ielts.vercel.app).
 * Bấm "Mang tiến độ sang" là mở Band 9 ở tên miền mới và chuyển toàn bộ dữ liệu
 * trên máy (kể cả phiên đăng nhập) qua `postMessage` — giao thức ở
 * `services/migrate/handoff.ts`. Hai tên miền vẫn chạy song song.
 */
import React, { useEffect, useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';

import { BrandMark } from './Logo';
import { DATA, DONE, READY, parseMessage, snapshot } from '@/services/migrate/handoff';
import { SITE_HOST, SITE_ORIGIN, isLegacyHost } from '@/lib/site';
import { useAuthStore } from '@/store/useAuthStore';
import { useSyncStore } from '@/store/useSyncStore';

const HIDE_KEY = 'band9:move-banner-hidden';

export function DomainMoveBanner() {
  const [show, setShow] = useState(false);
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'blocked'>('idle');
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const syncNow = useSyncStore((s) => s.syncNow);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    let hidden = false;
    try {
      hidden = sessionStorage.getItem(HIDE_KEY) === '1';
    } catch {
      hidden = false;
    }
    // Đọc sau khi gắn vào trang: bản dựng phía máy chủ không có tên miền.
    const legacy = isLegacyHost(window.location.host);
    const id = setTimeout(() => setShow(legacy && !hidden), 0);
    return () => clearTimeout(id);
  }, []);

  if (!show) return null;

  const move = async () => {
    setState('sending');
    // Đẩy tiến độ lên máy chủ trước — kể cả khi bước chuyển trên máy hỏng, đăng
    // nhập ở Band 9 vẫn có đủ dữ liệu.
    if (userId) await syncNow(userId, 'push').catch(() => undefined);
    const win = window.open(`${SITE_ORIGIN}/chuyen-du-lieu`, '_blank');
    if (!win) {
      setState('blocked');
      return;
    }
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== SITE_ORIGIN || e.source !== win) return;
      const msg = parseMessage(e.data);
      if (msg?.type === READY) win.postMessage({ type: DATA, items: snapshot(localStorage) }, SITE_ORIGIN);
      else if (msg?.type === DONE) {
        setState('done');
        window.removeEventListener('message', onMessage);
      }
    };
    window.addEventListener('message', onMessage);
  };

  const hide = () => {
    try {
      sessionStorage.setItem(HIDE_KEY, '1');
    } catch {
      /* chế độ riêng tư: chỉ ẩn trong lần này */
    }
    setShow(false);
  };

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#0F1D33', borderBottomWidth: 1, borderBottomColor: '#B8955A' }}>
      <BrandMark size={28} />
      <Text className="font-semi" style={{ flex: 1, minWidth: 220, fontSize: 14, color: '#F3EDE1' }}>
        {state === 'done'
          ? '✓ Đã chuyển tiến độ sang Band 9. Từ giờ học ở '
          : state === 'blocked'
            ? 'Trình duyệt đã chặn cửa sổ mới — cho phép cửa sổ bật lên rồi bấm lại. Tên miền mới: '
            : 'ReadUp giờ là Band 9, tên miền mới: '}
        <Text className="font-heavy" style={{ color: '#E2C88F' }}>
          {SITE_HOST}
        </Text>
      </Text>
      {state === 'done' ? (
        <Pressable accessibilityRole="link" onPress={() => window.location.assign(SITE_ORIGIN)} style={BTN}>
          <Text className="font-heavy" style={BTN_TEXT}>
            Mở Band 9 →
          </Text>
        </Pressable>
      ) : (
        <Pressable accessibilityRole="button" disabled={state === 'sending'} onPress={() => void move()} style={[BTN, { opacity: state === 'sending' ? 0.6 : 1 }]}>
          <Text className="font-heavy" style={BTN_TEXT}>
            {state === 'sending' ? 'Đang chuyển…' : 'Mang tiến độ sang Band 9'}
          </Text>
        </Pressable>
      )}
      <Pressable accessibilityRole="button" accessibilityLabel="Ẩn thông báo" onPress={hide} style={{ padding: 6 }}>
        <Text style={{ color: 'rgba(243,237,225,0.7)', fontSize: 16 }}>✕</Text>
      </Pressable>
    </View>
  );
}

const BTN = { borderRadius: 999, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#B8955A' } as const;
const BTN_TEXT = { fontSize: 14, color: '#0F1D33' } as const;
