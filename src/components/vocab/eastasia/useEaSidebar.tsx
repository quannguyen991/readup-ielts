import React from 'react';
import { View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { usePathname } from 'expo-router';

import { useHydrated } from '@/components/layout/useHydrated';
import type { SidebarThemeConfig } from '@/components/layout/SidebarAtmosphere';
import type { EaLang } from '@/data/learning-path/east-asian';
import { useEaStore } from '@/store/useEaStore';

import { KIT } from './kit';
import { skinById, type EaSkin } from './skins';

/**
 * Trang nào thuộc khu Tiếng Trung / Tiếng Nhật? Lộ trình (`/vocabulary/lo-trinh/zh|ja`),
 * trang sách, bộ và bài học có slug bắt đầu bằng mã sách (`book-hsk…`, `book-irodori…`,
 * `book-jlpt…`). Ngoài các trang đó thanh bên giữ giao diện chung của app.
 */
export function eaLangOfPath(pathname: string | null | undefined): EaLang | null {
  const seg = (pathname ?? '').split('/').filter(Boolean);
  if (seg[0] !== 'vocabulary') return null;
  if (seg[1] === 'lo-trinh') return seg[2] === 'ja' ? 'ja' : seg[2] === 'zh' ? 'zh' : null;
  if ((seg[1] === 'book' || seg[1] === 'topic') && seg[2]) {
    const slug = decodeURIComponent(seg[2]);
    if (slug.startsWith('book-hsk')) return 'zh';
    if (slug.startsWith('book-irodori') || slug.startsWith('book-jlpt')) return 'ja';
  }
  return null;
}

/** Cấu hình thanh bên theo skin: nền, chữ, nút đang chọn. Skin sáng dùng chữ tối và ngược lại. */
export function sidebarConfigOf(skin: EaSkin): SidebarThemeConfig {
  const c = skin.c;
  return {
    id: `ea-${skin.id}`,
    name: skin.name,
    isDark: skin.sidebar.dark,
    bgStyle: { backgroundColor: skin.sidebar.bg },
    borderRightColor: skin.sidebar.border,
    textPrimary: skin.sidebar.text,
    textMuted: skin.sidebar.muted,
    activeFill: skin.sidebar.active,
    activeGradient: skin.sidebar.activeGradient,
    activeTextColor: skin.sidebar.activeText,
    activeGlow: `0 6px 16px ${skin.sidebar.active}59`,
    hoverBg: skin.sidebar.dark ? 'rgba(255,255,255,0.10)' : `${c.accent}1f`,
    defaultEffect: null,
  };
}

export type EaSidebar = { config: SidebarThemeConfig; skin: EaSkin; lang: EaLang };

/** `null` khi trang hiện tại không thuộc khu Trung/Nhật. */
export function useEaSidebar(): EaSidebar | null {
  const pathname = usePathname();
  const hydrated = useHydrated();
  const lang = eaLangOfPath(pathname);
  const skinId = useEaStore((s) => (lang ? s.skin[lang] : undefined));
  return React.useMemo(() => {
    if (!lang) return null;
    const skin = skinById(hydrated ? skinId : undefined, lang);
    return { config: sidebarConfigOf(skin), skin, lang };
  }, [lang, skinId, hydrated]);
}

/** Tranh dưới đáy thanh bên (núi, tháp, hoa) phủ mờ dần lên trên để chữ menu vẫn đọc được. */
export function EaSidebarArt({ skin }: { skin: EaSkin }) {
  if (!skin.sidebar.art) return null;
  const bg = skin.sidebar.bg;
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '38%' }}>
      <Image source={skin.sidebar.art} contentFit="cover" contentPosition="bottom" style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }} />
      <LinearGradient colors={[bg, `${bg}00`]} locations={[0, 0.4]} style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }} />
    </View>
  );
}

export type EaTabTone = {
  bg: string;
  border: string;
  muted: string;
  /** Màu biểu tượng + nhãn của mục đang chọn. */
  accent: string;
  /** Nền viên thuốc sau biểu tượng đang chọn. */
  pill: string;
  /** Vòng quanh nút Nói giữa và hai màu chuyển sắc của nó. */
  ring: string;
  gradient: [string, string];
  shadow: string;
  cloud?: number;
};

/** Màu cho thanh tab dưới (điện thoại) khi đang ở khu Trung/Nhật. Giữ nguyên các mục, chỉ đổi giao diện. */
export function eaTabTone(skin: EaSkin): EaTabTone {
  const sb = skin.sidebar;
  return {
    bg: `${sb.bg}f7`,
    border: skin.c.accent,
    muted: sb.muted,
    accent: sb.dark ? skin.c.accent : sb.active,
    pill: sb.dark ? 'rgba(255,255,255,0.14)' : `${sb.active}1f`,
    ring: skin.c.accent,
    gradient: [sb.active, skin.c.accent],
    shadow: sb.active,
    cloud: KIT[skin.lang].cloud,
  };
}
