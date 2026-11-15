import React, { useEffect, useMemo } from 'react';
import { Platform, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';

import { usePathData } from '@/components/learning-path/usePathData';
import type { EaLang } from '@/data/learning-path/east-asian';
import type { PathNode } from '@/data/learning-path/types';
import { useL } from '@/i18n/useL';
import { nodeStatus } from '@/services/learning-path/progress';
import { PATH_RESOLVERS } from '@/services/learning-path/resolvers';
import { useEaStore } from '@/store/useEaStore';

import { KIT } from './kit';
import { JA_MOTIF, ZH_MOTIF } from './motifs';
import { skinById, type EaSkin } from './skins';

/** Phông của app (xem tailwind.config.js): chữ Việt luôn dùng Inter; phông thư pháp chỉ cho chữ Hán. */
export const EA_FONT = { body: 'Inter_400Regular', mid: 'Inter_500Medium', strong: 'Inter_600SemiBold', heavy: 'InterTight_600SemiBold' } as const;
/** Tiêu đề lớn chữ Việt (serif có đủ dấu), dùng ở hero các trang bên trong. */
export const TITLE_FONT = "'Noto Serif', serif";
export const TITLE_HREF = 'https://fonts.googleapis.com/css2?family=Noto+Serif:ital,wght@0,800;1,700&display=swap';

export const web = Platform.OS === 'web';

/** Phát sáng chỉ trên web (RN-web nhận `boxShadow`). */
export const glow = (color: string, blur = 18): object => (web ? { boxShadow: `0 0 ${blur}px ${color}` } : {});

/** Chữ vàng chuyển sắc (web); native rơi về màu nhấn. */
export const goldTextStyle = (fallback: string): object =>
  web
    ? { backgroundImage: 'linear-gradient(180deg, #fff3c4 0%, #ecc97e 52%, #b98a3a 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', WebkitTextFillColor: 'transparent' }
    : { color: fallback };

export function useBi(b: { vi: string; en: string }): string {
  const { en } = useL();
  return en ? b.en : b.vi;
}

/** Nạp phông Hán của skin và phông tiêu đề (serif) trên web; phông Hán không subset để giữ chữ Hán. */
export function useSkinFont(skin: EaSkin) {
  useEffect(() => {
    if (!web || typeof document === 'undefined') return;
    const hrefs: [string, string][] = [[`ea-font-${skin.id}`, skin.fontHref], ['ea-font-title', TITLE_HREF]];
    for (const [id, href] of hrefs) {
      if (document.getElementById(id)) continue;
      const link = document.createElement('link');
      link.id = id;
      link.rel = 'stylesheet';
      link.href = href;
      document.head.appendChild(link);
    }
  }, [skin]);
}

/** Skin người học đang chọn cho một tiếng. */
export function useEaSkin(lang: EaLang): EaSkin {
  const id = useEaStore((s) => s.skin[lang]);
  return skinById(id, lang);
}

export const asPathNode = (slug: string, words = 0): PathNode => ({
  id: `ea-lesson-${slug}`,
  title: { vi: slug, en: slug },
  desc: { vi: '', en: '' },
  minutes: Math.max(5, Math.round(words * 0.5)),
  target: { kind: 'vocab', slug },
});

export type LessonProgress = { state: 'done' | 'started' | 'todo'; have: number; need: number; pct: number };

/** Tiến độ một buổi học (luật bộ từ dùng chung với Lớp học và lộ trình). */
export function useLessonProgress(): (slug: string) => LessonProgress {
  const data = usePathData();
  return useMemo(() => {
    const cache = new Map<string, LessonProgress>();
    return (slug: string) => {
      const hit = cache.get(slug);
      if (hit) return hit;
      const st = nodeStatus(asPathNode(slug), data, PATH_RESOLVERS);
      const need = st.need ?? 0;
      const have = st.have ?? 0;
      const p: LessonProgress = { state: st.state, have, need, pct: st.state === 'done' ? 100 : need ? Math.min(100, Math.round((have / need) * 100)) : 0 };
      cache.set(slug, p);
      return p;
    };
  }, [data]);
}

export function Chip({ skin, text, icon, hero }: { skin: EaSkin; text: string; icon?: number; hero?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: hero ? skin.c.heroPanel : skin.c.panel, borderColor: skin.c.border, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 }}>
      {icon ? <Image source={icon} contentFit="contain" style={{ width: 16, height: 16 }} /> : null}
      <Text style={{ color: hero ? skin.c.heroInk : skin.c.ink, fontSize: 12.5, fontFamily: EA_FONT.heavy }}>{text}</Text>
    </View>
  );
}

export function Bar({ pct, skin, height = 6 }: { pct: number; skin: EaSkin; height?: number }) {
  const p = Math.max(0, Math.min(100, pct));
  return (
    <View style={{ height, borderRadius: 999, backgroundColor: skin.dark ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.10)', borderWidth: 1, borderColor: skin.c.border, overflow: 'hidden' }}>
      <LinearGradient colors={[skin.c.accent, skin.c.accent2]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ width: `${p}%`, height: '100%' }} />
    </View>
  );
}

/** Tiêu đề mục: biểu tượng hoa (Nhật) hoặc thanh vàng (Trung), vạch mảnh và dải mây ở cuối dòng. */
export function SectionTitle({ skin, text, sub }: { skin: EaSkin; text: string; sub?: string }) {
  const K = KIT[skin.lang];
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      {skin.lang === 'ja' && K.flowerIcon ? <Image source={K.flowerIcon} contentFit="contain" style={{ width: 28, height: 28 }} /> : <View style={{ width: 4, height: 26, borderRadius: 2, backgroundColor: skin.c.accent }} />}
      <Text style={{ color: skin.c.ink, fontSize: 22, fontFamily: EA_FONT.heavy }}>{text}</Text>
      {sub ? <Text style={{ color: skin.lang === 'ja' ? '#C0392B' : skin.c.accent, fontSize: 12.5, letterSpacing: 1.8, fontFamily: EA_FONT.heavy }}>{sub}</Text> : null}
      <View style={{ flex: 1, height: 1, backgroundColor: skin.lang === 'ja' ? '#C0392B88' : skin.c.border }} />
      {K.cloud ? <Image source={K.cloud} contentFit="contain" style={{ width: 84, height: 30 }} /> : null}
    </View>
  );
}

/** Dải phân cách: vạch – mây – huy hiệu tròn – mây – vạch. */
export function Divider({ lang, skin }: { lang: EaLang; skin: EaSkin }) {
  const K = KIT[lang];
  const med = lang === 'ja' ? JA_MOTIF.kikko : ZH_MOTIF.medallion;
  const line = lang === 'ja' ? '#D9463A88' : skin.c.border;
  return (
    <View pointerEvents="none" style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 4 }}>
      <View style={{ flex: 1, height: 1, backgroundColor: line }} />
      {K.cloud ? <Image source={K.cloud} contentFit="contain" style={{ width: 90, height: 32, transform: [{ scaleX: -1 }] }} /> : null}
      <Image source={med} contentFit="contain" style={{ width: 46, height: 46 }} />
      {K.cloud ? <Image source={K.cloud} contentFit="contain" style={{ width: 90, height: 32 }} /> : null}
      <View style={{ flex: 1, height: 1, backgroundColor: line }} />
    </View>
  );
}

/** Chân trang: sóng xanh (Nhật) hoặc núi vàng (Trung) có tháp, đình, đèn lồng, hoa đứng trên. */
export function Footer({ lang, skin, wide }: { lang: EaLang; skin: EaSkin; wide: boolean }) {
  const K = KIT[lang];
  const c = skin.c;
  const h = wide ? 170 : 110;
  return (
    <View style={{ height: h + (wide ? 90 : 50), justifyContent: 'flex-end' }}>
      <View pointerEvents="none" style={{ height: h, borderRadius: 22, overflow: 'hidden' }}>
        {K.footer ? (
          <Image source={K.footer} contentFit="cover" contentPosition="bottom" style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }} />
        ) : (
          <>
            <Image source={lang === 'ja' ? JA_MOTIF.wave : ZH_MOTIF.mountains} contentFit="cover" contentPosition="bottom" style={{ position: 'absolute', left: -10, right: -10, bottom: -4, height: wide ? 200 : 130 }} />
            {K.cloud ? <Image source={K.cloud} contentFit="contain" style={{ position: 'absolute', left: 14, bottom: 14, width: 110, height: 40 }} /> : null}
            {K.cloud ? <Image source={K.cloud} contentFit="contain" style={{ position: 'absolute', right: 14, bottom: 14, width: 110, height: 40, transform: [{ scaleX: -1 }] }} /> : null}
          </>
        )}
        <LinearGradient colors={[`${c.bg}ff`, `${c.bg}00`]} locations={[0, 0.55]} style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }} />
      </View>
      {/* Công trình và hoa đứng trên mép chân trang (vượt khung). */}
      <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, bottom: h - 34, height: wide ? 170 : 110 }}>
        {lang === 'ja' ? (
          <>
            <Image source={JA_MOTIF.pagoda} contentFit="contain" contentPosition="bottom" style={{ position: 'absolute', left: wide ? 40 : 6, bottom: 0, width: wide ? 130 : 80, height: wide ? 170 : 104 }} />
            <Image source={JA_MOTIF.torii} contentFit="contain" contentPosition="bottom" style={{ position: 'absolute', right: wide ? 150 : 70, bottom: 0, width: wide ? 110 : 70, height: wide ? 100 : 64 }} />
            <Image source={JA_MOTIF.lantern} contentFit="contain" contentPosition="bottom" style={{ position: 'absolute', right: wide ? 40 : 6, bottom: 0, width: wide ? 70 : 46, height: wide ? 110 : 70 }} />
            <Image source={JA_MOTIF.sakuraR} contentFit="contain" contentPosition="bottom" style={{ position: 'absolute', left: wide ? 210 : 90, bottom: 8, width: wide ? 220 : 120, height: wide ? 120 : 70 }} />
          </>
        ) : (
          <>
            <Image source={ZH_MOTIF.pavilion} contentFit="contain" contentPosition="bottom" style={{ position: 'absolute', left: wide ? 40 : 6, bottom: 0, width: wide ? 170 : 100, height: wide ? 150 : 90 }} />
            <Image source={ZH_MOTIF.pagoda} contentFit="contain" contentPosition="bottom" style={{ position: 'absolute', right: wide ? 60 : 8, bottom: 0, width: wide ? 120 : 70, height: wide ? 170 : 104 }} />
            <Image source={ZH_MOTIF.lantern} contentFit="contain" contentPosition="bottom" style={{ position: 'absolute', right: wide ? 200 : 90, bottom: 0, width: wide ? 66 : 42, height: wide ? 108 : 68 }} />
            <Image source={ZH_MOTIF.plum} contentFit="contain" contentPosition="bottom" style={{ position: 'absolute', left: wide ? 230 : 110, bottom: 8, width: wide ? 220 : 120, height: wide ? 120 : 70 }} />
          </>
        )}
      </View>
    </View>
  );
}
