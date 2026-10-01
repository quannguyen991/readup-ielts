import React, { useEffect, useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';

import { BrandMark } from '@/components/layout/Logo';
import { Screen } from '@/components/layout/Screen';
import { LEGACY_HOSTS } from '@/lib/site';
import { DATA, DONE, READY, parseMessage, plan, snapshot } from '@/services/migrate/handoff';

/**
 * /chuyen-du-lieu — trang NHẬN dữ liệu ở tên miền Band 9. Trang cũ mở trang này
 * (giữ `opener`); ở đây báo "sẵn sàng" về đúng tên miền cũ, chỉ nhận thư từ tên
 * miền cũ trong danh sách, ghi các khoá CHƯA có rồi tải lại app. Mở thẳng (không
 * qua trang cũ) thì chỉ hướng dẫn đăng nhập — tiến độ trên máy chủ vẫn về đủ.
 */
const LEGACY_ORIGINS = LEGACY_HOSTS.map((h) => `https://${h}`);

export default function ReceiveHandoff() {
  const [state, setState] = useState<'waiting' | 'done' | 'alone'>('waiting');
  const [written, setWritten] = useState(0);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const opener = window.opener as Window | null;
    if (!opener) {
      const id = setTimeout(() => setState('alone'), 0);
      return () => clearTimeout(id);
    }
    const onMessage = (e: MessageEvent) => {
      if (!LEGACY_ORIGINS.includes(e.origin) || e.source !== opener) return;
      const msg = parseMessage(e.data);
      if (msg?.type !== DATA) return;
      const todo = plan(snapshot(localStorage), msg.items);
      let n = 0;
      for (const [k, v] of Object.entries(todo)) {
        try {
          localStorage.setItem(k, v);
          n += 1;
        } catch {
          /* hết chỗ: bỏ khoá đó, máy chủ vẫn đồng bộ lại */
        }
      }
      setWritten(n);
      setState('done');
      opener.postMessage({ type: DONE, written: n }, e.origin);
      window.removeEventListener('message', onMessage);
    };
    window.addEventListener('message', onMessage);
    // Báo sẵn sàng cho từng tên miền cũ (chỉ đúng tên miền đang mở trang này nhận được).
    for (const o of LEGACY_ORIGINS) {
      try {
        opener.postMessage({ type: READY }, o);
      } catch {
        /* không phải tên miền này */
      }
    }
    const fallback = setTimeout(() => setState((s) => (s === 'waiting' ? 'alone' : s)), 8000);
    return () => {
      clearTimeout(fallback);
      window.removeEventListener('message', onMessage);
    };
  }, []);

  return (
    <Screen>
      <View style={{ alignSelf: 'center', width: '100%', maxWidth: 560, marginTop: 40, borderRadius: 28, padding: 28, backgroundColor: '#0F1D33', alignItems: 'center', gap: 14 }}>
        <BrandMark size={72} />
        <Text className="font-heavy" style={{ fontSize: 26, color: '#F3EDE1', textAlign: 'center' }}>
          {state === 'done' ? 'Đã mang tiến độ sang Band 9' : state === 'alone' ? 'Chào mừng tới Band 9' : 'Đang nhận tiến độ…'}
        </Text>
        <Text className="font-sans" style={{ fontSize: 15, lineHeight: 22, color: 'rgba(243,237,225,0.8)', textAlign: 'center' }}>
          {state === 'done'
            ? `Đã chép ${written} mục dữ liệu học tập và phiên đăng nhập. Bấm nút dưới để vào học tiếp.`
            : state === 'alone'
              ? 'Đăng nhập bằng tài khoản cũ là toàn bộ tiến độ trên máy chủ được đồng bộ về. Muốn mang cả dữ liệu chỉ có trên máy, hãy mở tên miền cũ và bấm "Mang tiến độ sang Band 9".'
              : 'Giữ cửa sổ tên miền cũ đang mở trong giây lát.'}
        </Text>
        {state !== 'waiting' ? (
          <Pressable
            accessibilityRole="link"
            onPress={() => window.location.assign('/dashboard')}
            style={{ marginTop: 6, borderRadius: 999, paddingHorizontal: 22, paddingVertical: 12, backgroundColor: '#B8955A' }}
          >
            <Text className="font-heavy" style={{ fontSize: 15, color: '#0F1D33' }}>
              Vào Band 9 →
            </Text>
          </Pressable>
        ) : null}
      </View>
    </Screen>
  );
}
