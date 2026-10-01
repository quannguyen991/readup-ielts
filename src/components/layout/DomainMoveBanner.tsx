/**
 * TÊN MIỀN CŨ → BAND 9 (người dùng 01/10/2026: "cho tên miền cũ chuyển hướng
 * sang band 9 luôn"). Chỉ chạy ở tên miền cũ (readup-ielts.vercel.app).
 *
 * Không chuyển hướng cứng ở máy chủ: bộ nhớ trình duyệt gắn với từng tên miền,
 * chuyển cứng là bỏ lại phiên đăng nhập và dữ liệu trên máy. Thay vào đó:
 *  - Máy KHÔNG có dữ liệu (khách mới bấm link cũ) → chuyển ngay sang Band 9,
 *    giữ nguyên đường dẫn.
 *  - Máy CÓ dữ liệu → màn "Band 9 đã chuyển nhà" phủ cả trang, một nút: mang
 *    toàn bộ dữ liệu + phiên đăng nhập sang (`services/migrate/handoff.ts`) rồi
 *    tự chuyển sang Band 9. Cần đúng một cú bấm vì trình duyệt chỉ cho mở cửa
 *    sổ mới khi người dùng bấm. Cửa sổ được mở NGAY trong cú bấm (chờ mạng xong
 *    mới mở thì Safari chặn), đồng bộ lên máy chủ chạy song song.
 *
 * Thử ở máy dev: http://localhost:8081/?legacy=1
 */
import React, { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { createPortal } from 'react-dom';

import { BrandMark } from './Logo';
import { DATA, DONE, READY, parseMessage, snapshot } from '@/services/migrate/handoff';
import { SITE_HOST, SITE_ORIGIN, isLegacyHost, onLegacySite } from '@/lib/site';
import { useAuthStore } from '@/store/useAuthStore';
import { useSyncStore } from '@/store/useSyncStore';
import { useL } from '@/i18n/useL';

/** Mã đếm lượt xem — không phải dữ liệu học, không tính là "có dữ liệu". */
const IGNORE = new Set(['readup:vid', 'readup:sid']);

/**
 * Danh sách khoá CHỤP NGAY LÚC TẢI MÃ (trước khi app kịp ghi gì): bộ đếm lượt
 * xem hay các store có thể ghi khoá mới sau khi trang mở, làm khách mới trông
 * như người cũ.
 */
const BOOT_KEYS: string[] = (() => {
  try {
    return typeof localStorage === 'undefined' ? [] : Object.keys(localStorage);
  } catch {
    return [];
  }
})();

/** Máy có dữ liệu đáng mang theo không (tiến độ của app hoặc phiên đăng nhập Supabase). */
function hasLocalData(): boolean {
  return BOOT_KEYS.some((k) => (k.startsWith('readup:') && !IGNORE.has(k)) || (k.startsWith('sb-') && k.endsWith('-auth-token')));
}

const target = () => `${SITE_ORIGIN}${window.location.pathname === '/' ? '/intro' : window.location.pathname}`;

export function DomainMoveBanner() {
  const [mode, setMode] = useState<'off' | 'move'>('off');
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'blocked'>('idle');
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const syncNow = useSyncStore((s) => s.syncNow);
  const winRef = useRef<Window | null>(null);
  const { L } = useL();

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined' || !onLegacySite()) return;
    if (!hasLocalData() && isLegacyHost(window.location.host)) {
      // Khách mới: không có gì để mang → sang thẳng Band 9.
      window.location.replace(target());
      return;
    }
    // Đọc sau khi gắn vào trang: bản dựng phía máy chủ không biết tên miền.
    const id = setTimeout(() => setMode('move'), 0);
    return () => clearTimeout(id);
  }, []);

  if (mode === 'off') return null;

  const move = () => {
    setState('sending');
    // Mở cửa sổ NGAY trong cú bấm, trước mọi lệnh chờ mạng.
    const win = window.open(`${SITE_ORIGIN}/chuyen-du-lieu`, '_blank');
    winRef.current = win;
    // Đẩy tiến độ lên máy chủ song song — lỡ bước chuyển trên máy hỏng, đăng
    // nhập ở Band 9 vẫn có đủ dữ liệu.
    if (userId) void syncNow(userId, 'push').catch(() => undefined);
    if (!win) {
      setState('blocked');
      return;
    }
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== SITE_ORIGIN || e.source !== win) return;
      const msg = parseMessage(e.data);
      if (msg?.type === READY) win.postMessage({ type: DATA, items: snapshot(localStorage) }, SITE_ORIGIN);
      else if (msg?.type === DONE) {
        window.removeEventListener('message', onMessage);
        setState('done');
        // Dữ liệu đã sang: đóng cửa sổ phụ, tab này chuyển hẳn sang Band 9.
        setTimeout(() => {
          try {
            win.close();
          } catch {
            /* để người dùng tự đóng */
          }
          window.location.replace(target());
        }, 900);
      }
    };
    window.addEventListener('message', onMessage);
  };

  /** Không mang dữ liệu trên máy: đẩy tiến độ lên máy chủ rồi sang (đăng nhập lại ở Band 9). */
  const skip = async () => {
    setState('sending');
    if (userId) await syncNow(userId, 'push').catch(() => undefined);
    window.location.replace(target());
  };

  const screen = (
    <View
      accessibilityRole="alert"
      style={{ position: 'fixed' as never, top: 0, left: 0, right: 0, bottom: 0, zIndex: 100000, backgroundColor: 'rgba(11,21,38,0.92)', alignItems: 'center', justifyContent: 'center', padding: 16 }}
    >
      <View style={{ width: '100%', maxWidth: 520, borderRadius: 28, padding: 28, backgroundColor: '#0F1D33', borderWidth: 1, borderColor: '#B8955A', alignItems: 'center', gap: 14 }}>
        <BrandMark size={76} />
        <Text className="font-heavy" style={{ fontSize: 26, color: '#F3EDE1', textAlign: 'center' }}>
          {state === 'done' ? L('Xong! Đang mở Band 9…', 'Done! Opening Band 9…') : L('ReadUp đã chuyển sang nhà mới', 'ReadUp has moved to a new home')}
        </Text>
        <Text className="font-sans" style={{ fontSize: 15, lineHeight: 22, color: 'rgba(243,237,225,0.82)', textAlign: 'center' }}>
          {state === 'blocked'
            ? L('Trình duyệt chặn cửa sổ mới. Cho phép rồi bấm lại, hoặc chọn "Sang luôn".', 'The pop-up was blocked. Allow it and retry, or choose "Go now".')
            : L('Vẫn là app cũ, chỉ đổi tên và địa chỉ. Bấm một lần để mang theo tiến độ.', 'Same app, new name and address. One tap brings your progress.')}
        </Text>
        <Text className="font-heavy" style={{ fontSize: 16, color: '#E2C88F' }}>
          {SITE_HOST}
        </Text>
        <Pressable
          accessibilityRole="button"
          disabled={state === 'sending' || state === 'done'}
          onPress={move}
          style={{ marginTop: 4, borderRadius: 999, paddingHorizontal: 24, paddingVertical: 13, backgroundColor: '#B8955A', opacity: state === 'sending' || state === 'done' ? 0.65 : 1 }}
        >
          <Text className="font-heavy" style={{ fontSize: 16, color: '#0F1D33' }}>
            {state === 'sending'
              ? L('Đang chuyển…', 'Moving…')
              : state === 'done'
                ? L('✓ Đã chuyển', '✓ Moved')
                : L('Mang tiến độ sang Band 9', 'Bring my progress to Band 9')}
          </Text>
        </Pressable>
        <Pressable accessibilityRole="link" disabled={state === 'sending' || state === 'done'} onPress={() => void skip()}>
          <Text className="font-semi" style={{ fontSize: 13, color: 'rgba(243,237,225,0.6)' }}>
            {L('Sang luôn (đăng nhập lại ở Band 9)', 'Go now (sign in again on Band 9)')}
          </Text>
        </Pressable>
      </View>
    </View>
  );
  // Ra cấp <body>: phủ cả thanh bên, không bị khung cột nội dung cắt.
  return typeof document !== 'undefined' ? createPortal(screen, document.body) : screen;
}
