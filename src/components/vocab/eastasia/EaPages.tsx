import React, { useMemo } from 'react';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { Appear } from '@/components/motion/Motion';
import type { EaLang } from '@/data/learning-path/east-asian';
import type { BookVocabBook, BookVocabLesson, BookVocabTheme } from '@/data/vocab-topics';
import { useL } from '@/i18n/useL';
import { isDialogueLesson, JA_SET_ART, JA_THUMB, sceneOf } from '../japanese/ja-art';

import { Bar, Chip, Divider, EA_FONT, Footer, SectionTitle, TITLE_FONT, glow, goldTextStyle, useEaSkin, useLessonProgress, useSkinFont, web, type LessonProgress } from './EaParts';
import { KIT, SEALS } from './kit';
import { JA_MOTIF, ZH_MOTIF } from './motifs';
import type { EaSkin } from './skins';

/** Họa tiết đại diện cho các chủ đề (xoay vòng theo thứ tự chủ đề trong cấp). */
export const PART_MOTIF: Record<EaLang, readonly number[]> = {
  ja: [JA_MOTIF.neko, JA_MOTIF.umbrella, JA_MOTIF.koi, JA_MOTIF.teahouse, JA_MOTIF.fuji, JA_MOTIF.daruma, JA_MOTIF.maple, JA_MOTIF.wisteria, JA_MOTIF.craneFly],
  zh: [ZH_MOTIF.panda, ZH_MOTIF.turtle, ZH_MOTIF.koi, ZH_MOTIF.magpie, ZH_MOTIF.lion, ZH_MOTIF.orchid, ZH_MOTIF.bamboo, ZH_MOTIF.lotus, ZH_MOTIF.phoenix],
};

const hot = (skin: EaSkin) => (skin.lang === 'ja' ? '#C23B2F' : skin.c.accent);
const hotText = (skin: EaSkin) => (skin.lang === 'ja' ? '#C0392B' : skin.c.accent);

/* ------------------------------------------------------------------ khung trang */

/** Khung chung của mọi trang bên trong: cột 1080px, nút quay lại có viền, cuộn bằng Screen. */
export function EaScreen({ lang, backLabel, onBack, actions, children }: { lang: EaLang; backLabel: string; onBack: () => void; actions?: React.ReactNode; children: React.ReactNode }) {
  const skin = useEaSkin(lang);
  useSkinFont(skin);
  const c = skin.c;
  return (
    <Screen>
      <View style={{ width: '100%', maxWidth: 1080, alignSelf: 'center', gap: 26, paddingBottom: 10 }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10 }}>
          <Pressable accessibilityRole="link" onPress={onBack} style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: c.panel, borderWidth: 1, borderColor: c.border, opacity: pressed ? 0.8 : 1 })}>
            <Text style={{ color: c.ink, fontSize: 13, fontFamily: EA_FONT.heavy }}>{`‹ ${backLabel}`}</Text>
          </Pressable>
          {actions}
        </View>
        {children}
      </View>
    </Screen>
  );
}

/** Nút phụ trong thanh trên cùng (ví dụ "Xem lộ trình"). */
export function EaPill({ skin, label, onPress }: { skin: EaSkin; label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="link" onPress={onPress} style={({ pressed }) => ({ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: hot(skin), opacity: pressed ? 0.85 : 1, ...glow(`${hot(skin)}55`, 12) })}>
      <Text style={{ color: skin.lang === 'ja' ? '#FFFFFF' : skin.c.onAccent, fontSize: 13, fontFamily: EA_FONT.heavy }}>{label}</Text>
    </Pressable>
  );
}

/* ------------------------------------------------------------------ hero */

type HeroProps = {
  lang: EaLang;
  skin: EaSkin;
  kicker: string;
  title: string;
  blurb?: string;
  chips: string[];
  /** Phần trăm đã học (thanh tiến độ). */
  pct?: number;
  pctLabel?: string;
  cta?: { label: string; onPress: () => void };
  /** Tranh có khung vàng ở bên phải (ảnh chủ đề / cảnh bài). */
  side?: number;
  /** Chỗ cho nội dung thêm dưới chip (ví dụ nút). */
  footer?: React.ReactNode;
};

/** Chi tiết nằm TRONG hero (cắt theo khung bo góc): mây, cánh hoa, bướm. */
function HeroInside({ lang, wide }: { lang: EaLang; wide: boolean }) {
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, borderRadius: 26, overflow: 'hidden' }}>
      {lang === 'ja' ? (
        <>
          {wide ? <Image source={JA_MOTIF.cloud} contentFit="contain" style={{ position: 'absolute', left: '40%', top: '6%', width: wide ? 170 : 100, height: wide ? 74 : 44, opacity: 0.85 }} /> : null}
          <Image source={JA_MOTIF.cloudBand} contentFit="contain" style={{ position: 'absolute', left: '36%', bottom: '3%', width: wide ? 230 : 130, height: wide ? 56 : 34, opacity: 0.85 }} />
          <Image source={JA_MOTIF.petals} contentFit="contain" style={{ position: 'absolute', right: '34%', top: '12%', width: 64, height: 50, opacity: 0.95, transform: [{ rotate: '24deg' }] }} />
          <Image source={JA_MOTIF.petals} contentFit="contain" style={{ position: 'absolute', right: '10%', top: '50%', width: 54, height: 44, opacity: 0.9, transform: [{ rotate: '-30deg' }] }} />
        </>
      ) : (
        <>
          {wide ? <Image source={ZH_MOTIF.ruyiCloud} contentFit="contain" style={{ position: 'absolute', left: '42%', top: '8%', width: wide ? 130 : 80, height: wide ? 64 : 40, opacity: 0.95 }} /> : null}
          <Image source={ZH_MOTIF.cloudScroll} contentFit="contain" style={{ position: 'absolute', left: '38%', bottom: '3%', width: wide ? 200 : 120, height: wide ? 70 : 42, opacity: 0.9 }} />
          {wide ? <Image source={ZH_MOTIF.butterflies} contentFit="contain" style={{ position: 'absolute', right: '30%', bottom: '14%', width: 100, height: 72, opacity: 0.95 }} /> : null}
        </>
      )}
    </View>
  );
}

export function EaHero({ lang, skin, kicker, title, blurb, chips, pct, pctLabel, cta, side, footer }: HeroProps) {
  const { width } = useWindowDimensions();
  const wide = width >= 900;
  const c = skin.c;
  const K = KIT[lang];
  const motif = lang === 'zh' ? ZH_MOTIF : JA_MOTIF;
  return (
    <Appear>
      <View style={{ position: 'relative' }}>
        <View style={{ borderRadius: 26, overflow: 'hidden', minHeight: wide ? 260 : 230, justifyContent: 'center', borderWidth: 1.5, borderColor: c.accent, ...glow(`${c.accent}33`, 22) }}>
          <Image source={skin.hero} contentFit="cover" style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }} />
          <LinearGradient colors={c.wash} locations={[0, 0.45, 0.85]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }} />
          {!wide ? <LinearGradient colors={['rgba(0,0,0,0.5)', 'rgba(0,0,0,0.22)']} style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }} /> : null}
          {lang === 'zh' && K.latticeTL ? <Image source={K.latticeTL} contentFit="contain" contentPosition="top left" pointerEvents="none" style={{ position: 'absolute', left: 4, top: 4, width: wide ? 130 : 84, height: wide ? 104 : 68 }} /> : null}
          {lang === 'zh' && K.latticeBL ? <Image source={K.latticeBL} contentFit="contain" contentPosition="bottom left" pointerEvents="none" style={{ position: 'absolute', left: 4, bottom: 4, width: wide ? 104 : 68, height: wide ? 130 : 84 }} /> : null}
          {lang === 'ja' ? <Image source={motif.corner} contentFit="contain" pointerEvents="none" style={{ position: 'absolute', left: 6, top: 6, width: wide ? 88 : 60, height: wide ? 88 : 60 }} /> : null}
          <HeroInside lang={lang} wide={wide} />
          <View style={{ paddingLeft: wide ? 60 : 30, paddingRight: 20, paddingTop: wide ? 34 : 44, paddingBottom: 30, gap: 9, maxWidth: wide ? (side ? '56%' : '62%') : '92%' }}>
            <Text style={{ color: c.accent, fontSize: 13, letterSpacing: 2.2, fontFamily: EA_FONT.heavy }}>{kicker}</Text>
            <Text
              accessibilityRole="header"
              style={[{ fontSize: wide ? 42 : 30, lineHeight: wide ? 50 : 38, fontFamily: TITLE_FONT as never, fontWeight: '800', color: '#FFFFFF' }, lang === 'zh' ? goldTextStyle(c.accent) : web ? { textShadow: '0 2px 10px rgba(0,0,0,0.45)' } : null] as never}
            >
              {title}
            </Text>
            {blurb ? <Text style={{ color: c.heroInk, fontSize: wide ? 16 : 14.5, lineHeight: 24, opacity: 0.95, fontFamily: EA_FONT.body }}>{blurb}</Text> : null}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 2 }}>
              {chips.map((t, i) => <Chip key={t} skin={skin} hero icon={lang === 'ja' && i === 0 ? K.flowerIcon : undefined} text={t} />)}
            </View>
            {pct !== undefined ? (
              <View style={{ marginTop: 6, maxWidth: 440, gap: 10, flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ color: c.heroInk2, fontSize: 13, fontFamily: EA_FONT.strong }}>{pctLabel ?? `${pct}%`}</Text>
                <View style={{ flex: 1 }}><Bar pct={pct} skin={skin} height={9} /></View>
              </View>
            ) : null}
            {cta ? (
              <Pressable accessibilityRole="button" onPress={cta.onPress} style={({ pressed }) => ({ alignSelf: 'flex-start', marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: hot(skin), paddingHorizontal: 22, paddingVertical: 11, borderRadius: 999, opacity: pressed ? 0.85 : 1, ...glow(`${hot(skin)}66`, 16) })}>
                <Text style={{ color: lang === 'ja' ? '#FFFFFF' : c.onAccent, fontSize: 15, fontFamily: EA_FONT.heavy }}>{cta.label} →</Text>
                {lang === 'zh' && K.cloud ? <Image source={K.cloud} contentFit="contain" style={{ width: 44, height: 20 }} /> : null}
              </Pressable>
            ) : null}
            {footer}
          </View>
          {/* Tranh có khung vàng bên phải (ảnh chủ đề), hơi nghiêng như tấm ảnh dán. */}
          {side && wide ? (
            <View pointerEvents="none" style={{ position: 'absolute', right: 56, top: 34, bottom: 34, width: 250, justifyContent: 'center' }}>
              <View style={{ transform: [{ rotate: '2.5deg' }], borderRadius: 16, borderWidth: 3, borderColor: c.accent, backgroundColor: c.panelSolid, padding: 6, ...glow('rgba(0,0,0,0.5)', 24) }}>
                <Image source={side} contentFit="cover" style={{ width: '100%', aspectRatio: 1.35, borderRadius: 10 }} />
              </View>
            </View>
          ) : null}
        </View>
        {/* Họa tiết bóc tách vượt khung hero. */}
        {lang === 'zh' ? (
          <>
            {wide && !side ? <Image source={ZH_MOTIF.lantern} contentFit="contain" pointerEvents="none" style={{ position: 'absolute', right: 30, top: -8, width: 66, height: 116 }} /> : null}
            {wide && !side ? <Image source={motif.craneFly} contentFit="contain" pointerEvents="none" style={{ position: 'absolute', right: 120, top: -26, width: 210, height: 176, transform: [{ rotate: '-4deg' }] }} /> : null}
            <Image source={ZH_MOTIF.plum} contentFit="contain" pointerEvents="none" style={{ position: 'absolute', right: -14, bottom: -28, width: wide ? 250 : 160, height: wide ? 175 : 110 }} />
          </>
        ) : (
          <>
            {wide && !side ? <Image source={motif.craneFly} contentFit="contain" pointerEvents="none" style={{ position: 'absolute', right: 110, top: -30, width: 170, height: 160, transform: [{ rotate: '-6deg' }] }} /> : null}
            <Image source={JA_MOTIF.sakuraL} contentFit="contain" pointerEvents="none" style={{ position: 'absolute', right: -16, bottom: -28, width: wide ? 240 : 170, height: wide ? 165 : 118 }} />
          </>
        )}
      </View>
    </Appear>
  );
}

/* ------------------------------------------------------------------ thẻ */

/** Thẻ chủ đề / bộ: ảnh (hoặc họa tiết) ở trên, tên, số từ, thanh tiến độ, mũi tên. */
export function EaTopicCard({ skin, title, count, meta, pct, art, motif, seal, onPress }: { skin: EaSkin; title: string; count: number; meta: string; pct: number; art?: number; motif: number; seal?: number; onPress: () => void }) {
  const { L } = useL();
  const c = skin.c;
  const K = KIT[skin.lang];
  const corner = skin.lang === 'ja' ? JA_MOTIF.corner : ZH_MOTIF.corner;
  return (
    <Pressable accessibilityRole="link" onPress={onPress} style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => ({ borderRadius: 20, overflow: 'hidden', backgroundColor: c.panel, borderWidth: 1.5, borderColor: hovered ? hot(skin) : c.border, opacity: pressed ? 0.88 : 1, ...(hovered ? glow(`${hot(skin)}44`, 16) : null) })}>
      <View style={{ height: 124, backgroundColor: c.panelSolid, alignItems: 'center', justifyContent: 'center' }}>
        {art ? (
          <Image source={art} contentFit="cover" style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }} />
        ) : (
          <>
            <Image source={skin.thumb} contentFit="cover" style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, opacity: 0.55 }} />
            <LinearGradient colors={[`${c.panelSolid}00`, `${c.panelSolid}dd`]} style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }} />
            <Image source={seal ?? motif} contentFit="contain" style={{ width: 92, height: 92 }} />
          </>
        )}
        <Image source={corner} contentFit="contain" pointerEvents="none" style={{ position: 'absolute', left: 2, top: 2, width: 40, height: 40 }} />
        <Image source={corner} contentFit="contain" pointerEvents="none" style={{ position: 'absolute', right: 2, bottom: 2, width: 40, height: 40, transform: [{ rotate: '180deg' }] }} />
        {!art && K.cloud ? <Image source={K.cloud} contentFit="contain" pointerEvents="none" style={{ position: 'absolute', right: 10, top: 8, width: 70, height: 26, opacity: 0.7 }} /> : null}
      </View>
      <View style={{ padding: 14, gap: 6 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
          <Text style={{ flex: 1, color: c.ink, fontSize: 16, lineHeight: 21, fontFamily: EA_FONT.heavy }}>{title}</Text>
          <View style={{ paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999, backgroundColor: `${hot(skin)}26`, borderWidth: 1, borderColor: `${hot(skin)}66` }}>
            <Text style={{ color: hotText(skin), fontSize: 13, fontFamily: EA_FONT.heavy }}>{count}</Text>
          </View>
        </View>
        <Text style={{ color: c.ink2, fontSize: 13, fontFamily: EA_FONT.body }}>{meta}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 2 }}>
          <View style={{ flex: 1 }}><Bar pct={pct} skin={skin} /></View>
          <Text style={{ color: c.ink2, fontSize: 13, fontFamily: EA_FONT.mid }}>{`${pct}%`}</Text>
          <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: hot(skin), alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: skin.lang === 'ja' ? '#FFFFFF' : c.onAccent, fontSize: 16, fontFamily: EA_FONT.heavy }}>→</Text>
          </View>
        </View>
        <Text accessibilityElementsHidden style={{ position: 'absolute', width: 0, height: 0, opacity: 0 }}>{L('Mở', 'Open')}</Text>
      </View>
    </Pressable>
  );
}

/** Hàng một buổi học: số thứ tự (hoa/vòng vàng), ảnh nhỏ, tên, loại bài, tiến độ. */
export function EaLessonRow({ skin, index, title, meta, tag, pct, state, art, motif, onPress }: { skin: EaSkin; index: number; title: string; meta: string; tag?: string; pct: number; state: LessonProgress['state']; art?: number; motif: number; onPress: () => void }) {
  const c = skin.c;
  const K = KIT[skin.lang];
  const done = state === 'done';
  return (
    <Pressable accessibilityRole="link" onPress={onPress} style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 20, backgroundColor: c.panel, borderWidth: 1.5, borderColor: hovered ? hot(skin) : c.border, opacity: pressed ? 0.88 : 1, overflow: 'hidden', ...(hovered ? glow(`${hot(skin)}44`, 14) : null) })}>
      <View style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}>
        {skin.lang === 'ja' && K.badge ? (
          <Image source={K.badge} contentFit="contain" style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }} />
        ) : (
          <View style={{ position: 'absolute', left: 3, right: 3, top: 3, bottom: 3, borderRadius: 16, borderWidth: 2, borderColor: c.accent, backgroundColor: done ? c.accent : c.panelSolid }} />
        )}
        <Text style={{ color: skin.lang === 'ja' ? '#FFFFFF' : done ? c.onAccent : c.accent, fontSize: 13, fontFamily: EA_FONT.heavy }}>{done ? '✓' : index + 1}</Text>
      </View>
      <View style={{ width: 74, height: 62, borderRadius: 12, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: c.panelSolid, borderWidth: 1, borderColor: c.border }}>
        {art ? <Image source={art} contentFit="cover" style={{ width: '100%', height: '100%' }} /> : <Image source={motif} contentFit="contain" style={{ width: 54, height: 54 }} />}
      </View>
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={{ color: c.ink, fontSize: 15.5, lineHeight: 20, fontFamily: EA_FONT.heavy }} numberOfLines={2}>{title}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
          {tag ? (
            <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, backgroundColor: `${hot(skin)}26`, borderWidth: 1, borderColor: `${hot(skin)}55` }}>
              <Text style={{ color: hotText(skin), fontSize: 12, fontFamily: EA_FONT.heavy }}>{tag}</Text>
            </View>
          ) : null}
          <Text style={{ color: c.ink2, fontSize: 13, fontFamily: EA_FONT.body }}>{meta}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={{ flex: 1, maxWidth: 260 }}><Bar pct={pct} skin={skin} /></View>
          <Text style={{ color: c.ink2, fontSize: 13, fontFamily: EA_FONT.mid }}>{`${pct}%`}</Text>
        </View>
      </View>
      <Text style={{ color: hotText(skin), fontSize: 22 }}>›</Text>
    </Pressable>
  );
}

/* ------------------------------------------------------------------ trang sách */

const lessonsOf = (t: BookVocabTheme) => t.lessons;

/** Nhóm chủ đề theo tiền tố trước dấu " · " ("HSK 3 · …", "JLPT N4 · …") khi mọi chủ đề đều có tiền tố và có hơn một nhóm. */
function groupTopics(topics: BookVocabTheme[]): { key: string | null; topics: BookVocabTheme[] }[] {
  const prefix = (t: BookVocabTheme) => (t.nameVi.includes(' · ') ? t.nameVi.split(' · ')[0]! : null);
  const keys = topics.map(prefix);
  if (keys.every((k) => k) && new Set(keys).size > 1) {
    const out: { key: string | null; topics: BookVocabTheme[] }[] = [];
    topics.forEach((t, i) => {
      const k = keys[i]!;
      const g = out.find((x) => x.key === k) ?? (out.push({ key: k, topics: [] }), out[out.length - 1]!);
      g.topics.push(t);
    });
    return out;
  }
  return [{ key: null, topics }];
}

/** Số cấp trong tên chủ đề ("HSK 4", "JLPT N3", "HSK 7-9") → chỉ số huy hiệu. */
function sealIndex(lang: EaLang, name: string): number {
  const m = name.match(lang === 'zh' ? /HSK\s*(\d)/ : /N(\d)/);
  if (!m) return -1;
  const n = Number(m[1]);
  return lang === 'zh' ? n - 1 : 5 - n;
}

export function EaBookPage({ book }: { book: BookVocabBook }) {
  const { L, en } = useL();
  const lang = book.language as EaLang;
  const skin = useEaSkin(lang);
  const progress = useLessonProgress();
  const allLessons = useMemo(() => book.topics.flatMap(lessonsOf), [book]);
  const states = allLessons.map((l) => progress(l.slug));
  const doneLessons = states.filter((s) => s.state === 'done').length;
  const pct = allLessons.length ? Math.round((states.reduce((n, s) => n + s.pct, 0) / allLessons.length)) : 0;
  const next = allLessons.find((l) => progress(l.slug).state !== 'done') ?? allLessons[0];
  const words = book.topics.reduce((n, t) => n + t.words.length, 0);
  const dialogues = book.topics.reduce((n, t) => n + t.lessons.filter((l) => isDialogueLesson(l.slug)).length, 0);
  const groups = groupTopics(book.topics);
  const K = KIT[lang];
  const title = (en ? book.name : book.nameVi).split(' · ')[0] ?? book.nameVi;
  const open = (t: BookVocabTheme) => router.push(`/vocabulary/book/${book.slug}/${t.slug}` as never);
  const cardFor = (t: BookVocabTheme, i: number) => {
    const ts = t.lessons.map((l) => progress(l.slug));
    const tp = ts.length ? Math.round(ts.reduce((n, s) => n + s.pct, 0) / ts.length) : 0;
    const si = sealIndex(lang, t.name);
    const seal = si >= 0 ? K[SEALS[lang][Math.min(si, SEALS[lang].length - 1)] ?? ''] : undefined;
    const dlg = t.lessons.filter((l) => isDialogueLesson(l.slug)).length;
    const meta = lang === 'ja' && dlg ? L(`${dlg} bài hội thoại · ${t.lessons.length - dlg} bài từ riêng lẻ`, `${dlg} dialogues · ${t.lessons.length - dlg} word sets`) : L(`${t.lessons.length} buổi học · tối đa 50 từ/buổi`, `${t.lessons.length} lessons · up to 50 words each`);
    const label = (en ? t.name : t.nameVi).replace(/^(HSK \d(?:-9)?|JLPT N\d) · /, '');
    return (
      <View key={t.slug} style={{ flexGrow: 1, flexBasis: 240, maxWidth: '100%' }}>
      <Appear index={Math.min(i, 8)}>
        <EaTopicCard skin={skin} title={label} count={t.words.length} meta={meta} pct={tp} art={JA_THUMB[t.nameVi]} motif={PART_MOTIF[lang][i % PART_MOTIF[lang].length]!} seal={seal} onPress={() => open(t)} />
      </Appear>
      </View>
    );
  };
  return (
    <EaScreen
      lang={lang}
      backLabel={L('Tất cả sách từ vựng', 'All vocabulary books')}
      onBack={() => router.push('/vocabulary/topics' as never)}
      actions={<EaPill skin={skin} label={lang === 'zh' ? L('Xem lộ trình HSK 1–6', 'See the HSK 1–6 roadmap') : L('Xem lộ trình JLPT N5–N1', 'See the JLPT N5–N1 roadmap')} onPress={() => router.push(`/vocabulary/lo-trinh/${lang}` as never)} />}
    >
      <EaHero
        lang={lang}
        skin={skin}
        kicker={lang === 'zh' ? L('TỪ VỰNG TIẾNG TRUNG', 'CHINESE VOCABULARY') : L('TỪ VỰNG TIẾNG NHẬT', 'JAPANESE VOCABULARY')}
        title={title}
        blurb={book.blurb}
        chips={[
          L(`${book.topics.length} bộ`, `${book.topics.length} sets`),
          L(`${words.toLocaleString('vi-VN')} từ`, `${words.toLocaleString('en-US')} words`),
          lang === 'ja' && dialogues ? L(`${dialogues} bài hội thoại`, `${dialogues} dialogues`) : L(`${allLessons.length} buổi học`, `${allLessons.length} lessons`),
        ]}
        pct={pct}
        pctLabel={L(`Đã học ${pct}% (${doneLessons}/${allLessons.length} buổi)`, `${pct}% studied (${doneLessons}/${allLessons.length} lessons)`)}
        cta={next ? { label: doneLessons > 0 ? L('Tiếp tục học', 'Continue') : L('Bắt đầu học', 'Start learning'), onPress: () => router.push(`/vocabulary/topic/${next.slug}` as never) } : undefined}
      />
      {groups.map((g, gi) => (
        <View key={g.key ?? 'all'} style={{ gap: 14 }}>
          <SectionTitle skin={skin} text={g.key ?? L('Chọn chủ đề để học', 'Choose a topic to study')} sub={g.key ? `${g.topics.length}` : `${book.topics.length}`} />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14 }}>{g.topics.map((t, i) => cardFor(t, i))}</View>
          {gi < groups.length - 1 ? <Divider lang={lang} skin={skin} /> : null}
        </View>
      ))}
      {book.sourceNote ? <Text style={{ color: skin.c.ink2, fontSize: 13, lineHeight: 19, fontFamily: EA_FONT.body }}>{book.sourceNote}</Text> : null}
      <Footer lang={lang} skin={skin} wide />
    </EaScreen>
  );
}

/* ------------------------------------------------------------------ trang bộ (danh sách buổi) */

export function EaUnitPage({ book, topic }: { book: BookVocabBook; topic: BookVocabTheme }) {
  const { L, en } = useL();
  const lang = book.language as EaLang;
  const skin = useEaSkin(lang);
  const progress = useLessonProgress();
  const ps = topic.lessons.map((l) => progress(l.slug));
  const pct = ps.length ? Math.round(ps.reduce((n, s) => n + s.pct, 0) / ps.length) : 0;
  const done = ps.filter((s) => s.state === 'done').length;
  const next = topic.lessons.find((l) => progress(l.slug).state !== 'done') ?? topic.lessons[0];
  const thumb = JA_THUMB[topic.nameVi];
  const dialogues = topic.lessons.filter((l) => isDialogueLesson(l.slug));
  const others = topic.lessons.filter((l) => !isDialogueLesson(l.slug));
  const label = (en ? topic.name : topic.nameVi).replace(/^(HSK \d(?:-9)?|JLPT N\d) · /, '');
  const row = (l: BookVocabLesson, i: number, kind: 'dialogue' | 'words') => {
    const p = progress(l.slug);
    const idx = topic.lessons.indexOf(l);
    return (
      <View key={l.slug} style={{ flexGrow: 1, flexBasis: 440, maxWidth: '100%' }}>
      <Appear index={Math.min(i, 8)}>
        <EaLessonRow
          skin={skin}
          index={i}
          title={(en ? l.name : l.nameVi).replace(/^(HSK \d(?:-9)?|JLPT N\d) · /, '')}
          tag={lang === 'ja' ? (kind === 'dialogue' ? L('Hội thoại', 'Dialogue') : L('Từ riêng lẻ', 'Single words')) : undefined}
          meta={L(`${l.words.length} từ`, `${l.words.length} words`)}
          pct={p.pct}
          state={p.state}
          art={lang === 'ja' ? (kind === 'dialogue' ? sceneOf(l.nameVi) : JA_SET_ART[l.slug]) ?? thumb : undefined}
          motif={PART_MOTIF[lang][(idx + 3) % PART_MOTIF[lang].length]!}
          onPress={() => router.push(`/vocabulary/topic/${l.slug}` as never)}
        />
      </Appear>
      </View>
    );
  };
  const hasKinds = lang === 'ja' && dialogues.length > 0 && others.length > 0;
  return (
    <EaScreen lang={lang} backLabel={L('Tất cả chủ đề', 'All topics')} onBack={() => router.push(`/vocabulary/book/${book.slug}` as never)}>
      <EaHero
        lang={lang}
        skin={skin}
        kicker={`${(en ? book.name : book.nameVi).split(' · ')[0]!.toUpperCase()} · ${lang === 'zh' ? L('TIẾNG TRUNG', 'CHINESE') : L('TIẾNG NHẬT', 'JAPANESE')}`}
        title={label}
        blurb={topic.blurb}
        side={thumb}
        chips={[
          L(`${topic.lessons.length} buổi học`, `${topic.lessons.length} lessons`),
          L(`${topic.words.length} từ`, `${topic.words.length} words`),
          L(`${done}/${topic.lessons.length} xong`, `${done}/${topic.lessons.length} done`),
        ]}
        pct={pct}
        pctLabel={L(`Đã học ${pct}%`, `${pct}% studied`)}
        cta={next ? { label: done > 0 ? L('Tiếp tục học', 'Continue') : L('Bắt đầu học', 'Start learning'), onPress: () => router.push(`/vocabulary/topic/${next.slug}` as never) } : undefined}
      />
      {hasKinds ? (
        <>
          <View style={{ gap: 14 }}>
            <SectionTitle skin={skin} text={L('Bài hội thoại', 'Dialogues')} sub={`${dialogues.length}`} />
            <Text style={{ color: skin.c.ink2, fontSize: 14, lineHeight: 21, fontFamily: EA_FONT.body }}>{L('Học theo tình huống: mỗi bài có một đoạn hội thoại và các từ đi kèm.', 'Learn through scenes: each lesson has a dialogue and its words.')}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>{dialogues.map((l, i) => row(l, i, 'dialogue'))}</View>
          </View>
          <Divider lang={lang} skin={skin} />
          <View style={{ gap: 14 }}>
            <SectionTitle skin={skin} text={L('Từ riêng lẻ', 'Single words')} sub={`${others.length}`} />
            <Text style={{ color: skin.c.ink2, fontSize: 14, lineHeight: 21, fontFamily: EA_FONT.body }}>{L('Học từng từ một, mỗi bài tối đa 20 từ, gom từ mọi bài hội thoại của chủ đề.', 'Study words one by one, up to 20 per set, gathered from every dialogue in this topic.')}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>{others.map((l, i) => row(l, i, 'words'))}</View>
          </View>
        </>
      ) : (
        <View style={{ gap: 14 }}>
          <SectionTitle skin={skin} text={L('Chọn buổi học', 'Choose a lesson')} sub={`${topic.lessons.length}`} />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>{topic.lessons.map((l, i) => row(l, i, isDialogueLesson(l.slug) ? 'dialogue' : 'words'))}</View>
        </View>
      )}
      <Footer lang={lang} skin={skin} wide />
    </EaScreen>
  );
}
