import React, { useState } from 'react';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';

import { Appear } from '@/components/motion/Motion';
import type { EaLang } from '@/data/learning-path/east-asian';
import type { BookVocabLesson } from '@/data/vocab-topics';
import { useL } from '@/i18n/useL';
import type { StudyWord } from '@/services/vocab/topic-study';
import { ExampleSentence } from '@/components/vocab/ExampleSentence';
import { isDialogueLesson, JA_MODE_ART, JA_SET_ART, JA_STATUS_ART, sceneOf } from '../japanese/ja-art';
import { ZH_V4 } from '../chinese/v4';

import { EA_FONT, Bar, glow, useLessonProgress } from './EaParts';
import { EaLessonRow, PART_MOTIF } from './EaPages';
import { KIT } from './kit';
import { JA_MOTIF, ZH_MOTIF } from './motifs';
import type { EaSkin } from './skins';

const hot = (skin: EaSkin) => (skin.lang === 'ja' ? '#D9463A' : skin.c.accent);
const hotText = (skin: EaSkin) => (skin.lang === 'ja' ? '#C0392B' : skin.c.accent);
const onHot = (skin: EaSkin) => (skin.lang === 'ja' ? '#FFFFFF' : skin.c.onAccent);
const cornerOf = (lang: EaLang) => (lang === 'ja' ? JA_MOTIF.corner : ZH_MOTIF.corner);

/** Tranh icon của một cách luyện: Nhật dùng bộ icon tranh Nhật, Trung dùng bộ icon mây vàng. */
export function modeArt(lang: EaLang, key: string): number | undefined {
  if (lang === 'ja') return JA_MODE_ART[key] ?? JA_MODE_ART.learn;
  return (ZH_V4.icon as Record<string, number>)[key] ?? (ZH_V4.icon as Record<string, number>).learn;
}

/** Tranh của ba nhóm trạng thái (đã nhớ / chưa nhớ / cần ôn). */
export function statusArt(lang: EaLang, key: string): number {
  if (lang === 'ja') return JA_STATUS_ART[key] ?? JA_MOTIF.sakuraL;
  return key === 'mastered' ? ZH_MOTIF.peony : key === 'new' ? ZH_MOTIF.butterflies : ZH_MOTIF.turtle;
}

/* ------------------------------------------------------------------ ô cách luyện */

export type ModeTileProps = { skin: EaSkin; art?: number; title: string; sub?: string; chip?: string; value?: number; disabled?: boolean; cta?: string; onPress: () => void };

/** Ô cách luyện / trạng thái: góc hoa văn, tranh lớn, tên, mô tả và nút "Bắt đầu". */
export function EaModeTile({ skin, art, title, sub, chip, value, disabled, cta, onPress }: ModeTileProps) {
  const c = skin.c;
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => ({ height: '100%', borderRadius: 20, backgroundColor: c.panel, borderWidth: 1.5, borderColor: hovered && !disabled ? hot(skin) : c.border, padding: 14, alignItems: 'center', gap: 6, opacity: disabled ? 0.45 : pressed ? 0.88 : 1, overflow: 'hidden', ...(hovered && !disabled ? glow(`${hot(skin)}44`, 16) : null) })}
    >
      <Image source={cornerOf(skin.lang)} contentFit="contain" pointerEvents="none" style={{ position: 'absolute', left: 2, top: 2, width: 36, height: 36 }} />
      <Image source={cornerOf(skin.lang)} contentFit="contain" pointerEvents="none" style={{ position: 'absolute', right: 2, bottom: 2, width: 36, height: 36, transform: [{ rotate: '180deg' }] }} />
      {chip ? (
        <View style={{ position: 'absolute', right: 10, top: 10, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, backgroundColor: hot(skin) }}>
          <Text style={{ color: onHot(skin), fontSize: 10.5, fontFamily: EA_FONT.heavy }}>{chip}</Text>
        </View>
      ) : null}
      <View style={{ width: 92, height: 92, alignItems: 'center', justifyContent: 'center' }}>
        {art ? <Image source={art} contentFit="contain" style={{ width: 92, height: 92 }} /> : null}
      </View>
      {value !== undefined ? <Text style={{ color: hotText(skin), fontSize: 30, lineHeight: 34, fontFamily: EA_FONT.heavy }}>{value}</Text> : null}
      <Text style={{ color: c.ink, fontSize: 15.5, textAlign: 'center', fontFamily: EA_FONT.heavy }}>{title}</Text>
      {sub ? <Text style={{ color: c.ink2, fontSize: 12, lineHeight: 17, textAlign: 'center', fontFamily: EA_FONT.body }}>{sub}</Text> : null}
      {cta ? (
        <View style={{ marginTop: 6, paddingHorizontal: 16, paddingVertical: 7, borderRadius: 999, backgroundColor: disabled ? c.border : hot(skin) }}>
          <Text style={{ color: onHot(skin), fontSize: 12.5, fontFamily: EA_FONT.heavy }}>{cta} →</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

/** Lưới ô: các ô cùng chiều cao, 4 cột trên máy tính, 2 cột trên điện thoại. */
export function EaTileGrid({ children, min = 200 }: { children: React.ReactNode; min?: number }) {
  const { width } = useWindowDimensions();
  // Điện thoại: 2 cột (mỗi ô ~44% bề ngang), máy tính: theo `min`.
  const basis = width < 700 ? 150 : min;
  return <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>{React.Children.map(children, (ch, i) => (ch ? <View key={i} style={{ flexGrow: 1, flexBasis: basis, maxWidth: '100%' }}><Appear index={Math.min(i, 8)}>{ch}</Appear></View> : null))}</View>;
}

/* ------------------------------------------------------------------ khung thẻ học */

/** Khung ornate bao khu thẻ học: viền vàng, bốn góc hoa văn. */
export function EaFrame({ skin, children, pad = 22 }: { skin: EaSkin; children: React.ReactNode; pad?: number }) {
  const c = skin.c;
  const K = KIT[skin.lang];
  const corner = skin.lang === 'zh' && K.latticeTL ? K.latticeTL : cornerOf(skin.lang);
  const size = skin.lang === 'zh' ? { w: 70, h: 56 } : { w: 56, h: 56 };
  return (
    <View style={{ position: 'relative', borderRadius: 26, borderWidth: 1.5, borderColor: c.accent, backgroundColor: c.panel, padding: pad, ...glow(`${c.accent}22`, 20) }}>
      <Image source={corner} contentFit="contain" contentPosition="top left" pointerEvents="none" style={{ position: 'absolute', left: 4, top: 4, width: size.w, height: size.h }} />
      <Image source={corner} contentFit="contain" contentPosition="top left" pointerEvents="none" style={{ position: 'absolute', right: 4, top: 4, width: size.w, height: size.h, transform: [{ scaleX: -1 }] }} />
      <Image source={corner} contentFit="contain" contentPosition="top left" pointerEvents="none" style={{ position: 'absolute', left: 4, bottom: 4, width: size.w, height: size.h, transform: [{ scaleY: -1 }] }} />
      <Image source={corner} contentFit="contain" contentPosition="top left" pointerEvents="none" style={{ position: 'absolute', right: 4, bottom: 4, width: size.w, height: size.h, transform: [{ rotate: '180deg' }] }} />
      {children}
    </View>
  );
}

/* ------------------------------------------------------------------ một từ */

/** Một từ trong bài (Nhật): chữ lớn, phiên âm, nghĩa, nút lưu, ví dụ mở ra khi bấm. */
export function EaWordRow({ skin, word, saved, onSave }: { skin: EaSkin; word: StudyWord; saved: boolean; onSave: () => void }) {
  const { L } = useL();
  const [open, setOpen] = useState(false);
  const c = skin.c;
  const hasDetails = Boolean(word.example || word.collocation);
  return (
    <View style={{ borderRadius: 18, borderWidth: 1.5, borderColor: c.border, backgroundColor: c.panel, padding: 14, gap: 8, overflow: 'hidden' }}>
      <Image source={JA_MOTIF.petals} contentFit="contain" pointerEvents="none" style={{ position: 'absolute', right: 150, top: 4, width: 90, height: 56, opacity: 0.35 }} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <View style={{ flexShrink: 1, gap: 2 }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline', gap: 8 }}>
            <Text style={{ color: c.ink, fontSize: 22, fontFamily: EA_FONT.heavy }}>{word.word}</Text>
            {word.romanization ? <Text style={{ color: hotText(skin), fontSize: 13, fontFamily: EA_FONT.mid }}>{word.romanization}</Text> : null}
            {word.pos ? (
              <View style={{ paddingHorizontal: 8, height: 20, borderRadius: 999, backgroundColor: `${hot(skin)}22`, borderWidth: 1, borderColor: `${hot(skin)}55`, justifyContent: 'center' }}>
                <Text style={{ color: hotText(skin), fontSize: 11, fontFamily: EA_FONT.heavy }}>{word.pos}</Text>
              </View>
            ) : null}
          </View>
          {word.meaningVi ? <Text style={{ color: c.ink, fontSize: 14.5, fontFamily: EA_FONT.body }}>{word.meaningVi}</Text> : null}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {hasDetails ? (
            <Pressable accessibilityRole="button" onPress={() => setOpen((v) => !v)} style={{ height: 30, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1, borderColor: c.accent, justifyContent: 'center' }}>
              <Text style={{ color: c.ink, fontSize: 12, fontFamily: EA_FONT.heavy }}>{open ? L('Thu gọn', 'Collapse') : L('Ví dụ', 'Example')}</Text>
            </Pressable>
          ) : null}
          {saved ? (
            <Text style={{ color: hotText(skin), fontSize: 12.5, fontFamily: EA_FONT.heavy }}>✓ {L('Đã lưu', 'Saved')}</Text>
          ) : (
            <Pressable accessibilityRole="button" onPress={onSave} style={{ height: 30, paddingHorizontal: 14, borderRadius: 999, backgroundColor: hot(skin), justifyContent: 'center' }}>
              <Text style={{ color: onHot(skin), fontSize: 12.5, fontFamily: EA_FONT.heavy }}>{L('Lưu', 'Save')}</Text>
            </Pressable>
          )}
        </View>
      </View>
      {open && hasDetails ? (
        <View style={{ borderTopWidth: 1, borderColor: c.border, paddingTop: 8, gap: 6 }}>
          {word.example ? <ExampleSentence example={word.example} word={word.word} language="ja" /> : null}
          {word.collocation ? <Text style={{ color: c.ink2, fontSize: 12.5, fontFamily: EA_FONT.body }}>{word.collocation}</Text> : null}
        </View>
      ) : null}
    </View>
  );
}

/* ------------------------------------------------------------------ bài cùng chủ đề */

export function EaSiblings({ skin, lessons, currentSlug }: { skin: EaSkin; lessons: BookVocabLesson[]; currentSlug: string }) {
  const { L, en } = useL();
  const lang = skin.lang;
  const progress = useLessonProgress();
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
      {lessons.map((l, i) => {
        const p = progress(l.slug);
        const dlg = isDialogueLesson(l.slug);
        return (
          <View key={l.slug} style={{ flexGrow: 1, flexBasis: 320, maxWidth: '100%', opacity: l.slug === currentSlug ? 1 : 0.96 }}>
            <EaLessonRow
              skin={skin}
              index={i}
              title={(en ? l.name : l.nameVi).replace(/^(HSK \d(?:-9)?|JLPT N\d) · /, '')}
              tag={l.slug === currentSlug ? L('Đang học', 'Current') : lang === 'ja' ? (dlg ? L('Hội thoại', 'Dialogue') : L('Từ riêng lẻ', 'Single words')) : undefined}
              meta={L(`${l.words.length} từ`, `${l.words.length} words`)}
              pct={p.pct}
              state={p.state}
              art={lang === 'ja' ? (dlg ? sceneOf(l.nameVi) : JA_SET_ART[l.slug]) : undefined}
              motif={PART_MOTIF[lang][(i + 3) % PART_MOTIF[lang].length]!}
              onPress={() => router.push(`/vocabulary/topic/${l.slug}` as never)}
            />
          </View>
        );
      })}
    </View>
  );
}

/** Thanh tiến độ trong một ô tóm tắt (dùng ở đầu phần học). */
export function EaMiniBar({ skin, pct }: { skin: EaSkin; pct: number }) {
  return <Bar pct={pct} skin={skin} />;
}
