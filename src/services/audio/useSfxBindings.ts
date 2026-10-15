import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { usePathname } from 'expo-router';

import { useGameFx } from '@/store/useGameFx';
import { useRewardStore } from '@/store/useRewardStore';
import { useStudyStore } from '@/store/useStudyStore';
import { useTravelStore } from '@/store/useTravelStore';
import { playSfx } from './sfx-ui';

/**
 * NỐI ÂM THANH GIAO DIỆN VÀO TOÀN APP — một chỗ, không phải sửa từng màn.
 * Bảng sự kiện → mã tiếng ở `sfx-core.ts`. Gắn MỘT lần ở `app/_layout.tsx`.
 *
 *  - Bấm (web): mọi nút / tab / thẻ bấm được → `tap`; tab → `tab`; ô chọn → `select`;
 *    nút "Quay lại / Đóng" → `back`. Gắn `data-sfx="off"` lên một vùng để vùng đó im.
 *  - Hộp thoại (aria-modal) xuất hiện / biến mất → `modalOpen` / `modalClose`.
 *  - Đổi trang → `nav` (rất khẽ).
 *  - Kho du ngoạn: +vé, +xu, +quà lưu niệm, đóng dấu, đổi thành phố, lên hạng hộ chiếu.
 *  - Sao nhận được, lời linh vật (toast), chuỗi ngày học tăng, nhận thưởng hạng tháng.
 *
 * Mọi tiếng đi qua `playSfx` nên tôn trọng tắt tiếng, âm lượng và chống kêu dồn.
 */

const INTERACTIVE = '[role="button"],[role="tab"],[role="radio"],[role="checkbox"],[role="switch"],[role="link"],button,a[href],[role="menuitem"]';
const BACK_LABEL = /^(quay lại|trở lại|đóng|thoát|back|close|exit)\b/i;

function soundFor(el: Element): 'tap' | 'tab' | 'select' | 'back' | null {
  if (el.closest('[data-sfx="off"]')) return null;
  if (el.getAttribute('aria-disabled') === 'true' || (el as HTMLButtonElement).disabled) return null;
  const role = el.getAttribute('role');
  if (role === 'tab') return 'tab';
  if (role === 'radio' || role === 'checkbox' || role === 'switch') return 'select';
  if (BACK_LABEL.test(el.getAttribute('aria-label') ?? '')) return 'back';
  return 'tap';
}

let installed = false;

function installDomBindings(): void {
  if (installed || Platform.OS !== 'web' || typeof document === 'undefined') return;
  installed = true;

  document.addEventListener(
    'click',
    (ev) => {
      const el = (ev.target as Element | null)?.closest?.(INTERACTIVE);
      if (!el) return;
      const id = soundFor(el);
      if (id) playSfx(id);
    },
    true,
  );

  // Hộp thoại: RN-web gắn Modal ngay dưới <body>.
  const isDialog = (n: Node) =>
    n.nodeType === 1 && ((n as Element).matches('[aria-modal="true"],[role="dialog"]') || !!(n as Element).querySelector('[aria-modal="true"],[role="dialog"]'));
  new MutationObserver((records) => {
    for (const r of records) {
      r.addedNodes.forEach((n) => isDialog(n) && playSfx('modalOpen'));
      r.removedNodes.forEach((n) => isDialog(n) && playSfx('modalClose'));
    }
  }).observe(document.body, { childList: true });
}

let storesBound = false;

function bindStores(): void {
  if (storesBound) return;
  storesBound = true;
  // Đồng bộ từ tài khoản cũng đổi số liệu — chỉ kêu khi người dùng đang nhìn trang.
  const visible = () => typeof document === 'undefined' || document.visibilityState !== 'hidden';

  useTravelStore.subscribe((s, p) => {
    if (!visible()) return;
    if (s.city !== p.city) playSfx('takeoff');
    if (s.tickets > p.tickets) playSfx('ticket');
    if (s.coins > p.coins) playSfx('coin');
    if ((s.souvenirs?.length ?? 0) > (p.souvenirs?.length ?? 0)) playSfx('souvenir');
    if (s.passportLevel > p.passportLevel) playSfx('reward');
    const stamps = (v: typeof s.visited) => Object.values(v).filter((x) => x?.stamp).length;
    if (stamps(s.visited) > stamps(p.visited)) playSfx('stamp');
  });

  useRewardStore.subscribe((s, p) => {
    if (visible() && Object.keys(s.prizes).length > Object.keys(p.prizes).length) playSfx('reward');
  });

  useGameFx.subscribe((s, p) => {
    const before = p.events.length ? p.events[p.events.length - 1]!.id : 0;
    for (const e of s.events) {
      if (e.id <= before) continue;
      if (e.kind === 'stars') playSfx('coin');
      else if (e.kind === 'mascot') playSfx('toast');
    }
  });

  let streak = useStudyStore.getState().streak().current;
  useStudyStore.subscribe((s) => {
    const now = s.streak().current;
    if (now > streak && visible()) playSfx('streak');
    streak = now;
  });
}

export function useSfxBindings(): void {
  const pathname = usePathname();
  const first = useRef(true);
  useEffect(() => {
    installDomBindings();
    bindStores();
  }, []);
  useEffect(() => {
    if (first.current) first.current = false;
    // Điện thoại: chuyển tab dưới đã có rung nhẹ; tiếng gió mỗi lần đổi trang nghe chướng tai, nên bỏ ở màn hẹp.
    else if (!(typeof window !== 'undefined' && window.matchMedia?.('(max-width: 1023px)').matches)) playSfx('nav');
  }, [pathname]);
}
