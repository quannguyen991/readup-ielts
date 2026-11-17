import { ZhLearnTiles } from '@/components/zh-learn/LearnTiles';
import { EaSentenceTiles } from '@/components/east-asian-sentences/SentenceTiles';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';

import { usePathData } from '@/components/learning-path/usePathData';
import { Appear } from '@/components/motion/Motion';
import { eaLevels, eaNodeHref, eaNodesOf, type EaLang, type EaLevel, type EaNode, type EaPart } from '@/data/learning-path/east-asian';
import type { PathNode } from '@/data/learning-path/types';
import { BOOK_VOCAB_BOOKS } from '@/data/vocab-topics';
import { useL } from '@/i18n/useL';
import { nodeStatus, type NodeState } from '@/services/learning-path/progress';
import { PATH_RESOLVERS } from '@/services/learning-path/resolvers';
import { useEaStore } from '@/store/useEaStore';

import { coverOf, KIT, SEALS } from './kit';
import { JA_MOTIF, ZH_MOTIF } from './motifs';
import { PART_MOTIF } from './EaPages';
import { Bar, Chip, Divider, EA_FONT, Footer, SectionTitle, glow, useBi, useSkinFont, web } from './EaParts';
import { skinById, skinsOf, type EaSkin } from './skins';

/** Tiêu đề lớn chữ Việt ở hero Nhật (serif có đủ dấu). */
const JA_TITLE_FONT = "'Noto Serif', serif";

const asPathNode = (n: EaNode): PathNode => ({
  id: n.id,
  title: n.title,
  desc: { vi: '', en: '' },
  minutes: n.minutes,
  target: { kind: 'vocab', slug: n.slug },
});

type Progress = { done: number; started: number; total: number; words: number; wordsDone: number; states: Record<string, NodeState>; byLevel: Record<string, { done: number; total: number }> };

function useProgress(levels: readonly EaLevel[]): Progress {
  const data = usePathData();
  return useMemo(() => {
    const states: Record<string, NodeState> = {};
    const byLevel: Record<string, { done: number; total: number }> = {};
    let done = 0;
    let started = 0;
    let total = 0;
    let words = 0;
    let wordsDone = 0;
    for (const lv of levels) {
      let ld = 0;
      const nodes = eaNodesOf(lv);
      for (const n of nodes) {
        const st = nodeStatus(asPathNode(n), data, PATH_RESOLVERS).state;
        states[n.id] = st;
        total += 1;
        words += n.words;
        if (st === 'done') {
          done += 1;
          ld += 1;
          wordsDone += n.words;
        } else if (st === 'started') started += 1;
      }
      byLevel[lv.id] = { done: ld, total: nodes.length };
    }
    return { done, started, total, words, wordsDone, states, byLevel };
  }, [levels, data]);
}

/* ------------------------------------------------------------------ màn hình */

export function EaRoadmap({ lang }: { lang: EaLang }) {
  const { L } = useL();
  const { width } = useWindowDimensions();
  const wide = width >= 900;
  const levels = eaLevels(lang);
  const skinId = useEaStore((s) => s.skin[lang]);
  const levelId = useEaStore((s) => s.level[lang]);
  const setSkin = useEaStore((s) => s.setSkin);
  const setLevel = useEaStore((s) => s.setLevel);
  const skin = skinById(skinId, lang);
  useSkinFont(skin);
  const prog = useProgress(levels);

  // Cấp mặc định: cấp đầu tiên còn bài chưa xong.
  const firstOpen = levels.find((l) => (prog.byLevel[l.id]?.done ?? 0) < (prog.byLevel[l.id]?.total ?? 0)) ?? levels[0]!;
  const level = levels.find((l) => l.id === levelId) ?? firstOpen;
  const nextNode = eaNodesOf(level).find((n) => prog.states[n.id] !== 'done') ?? eaNodesOf(level)[0]!;
  const pct = prog.total ? Math.round((prog.wordsDone / Math.max(1, prog.words)) * 100) : 0;
  const c = skin.c;
  const K = KIT[lang];
  const motif = lang === 'zh' ? ZH_MOTIF : JA_MOTIF;
  const edge = (s: string) => s.replace(/^HSK /, '');
  const kicker =
    lang === 'zh'
      ? `${L('TIẾNG TRUNG', 'CHINESE')} · HSK ${edge(levels[0]!.label)} → ${edge(levels[levels.length - 1]!.label)}`
      : `${L('TIẾNG NHẬT', 'JAPANESE')} · JLPT ${levels[0]!.label} → ${levels[levels.length - 1]!.label}`;
  const goldText: object = web
    ? { backgroundImage: 'linear-gradient(180deg, #fff3c4 0%, #ecc97e 52%, #b98a3a 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', WebkitTextFillColor: 'transparent' }
    : { color: c.accent };
  const cta = lang === 'ja' ? '#C23B2F' : c.accent;

  return (
    <View style={{ gap: 28, paddingBottom: 10, width: '100%', maxWidth: 1080, alignSelf: 'center' }}>
      {/* ---------------------------------------------------------------- hero */}
      <Appear>
        <View style={{ position: 'relative' }}>
          <View style={{ borderRadius: 26, overflow: 'hidden', minHeight: wide ? 340 : 300, justifyContent: 'center', borderWidth: 1.5, borderColor: c.accent, ...glow(`${c.accent}33`, 22) }}>
            <Image source={skin.hero} contentFit="cover" style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }} />
            <LinearGradient colors={c.wash} locations={[0, 0.45, 0.85]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }} />
          {!wide ? <LinearGradient colors={['rgba(0,0,0,0.5)', 'rgba(0,0,0,0.22)']} style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }} /> : null}
            {lang === 'zh' && K.latticeTL ? <Image source={K.latticeTL} contentFit="contain" contentPosition="top left" pointerEvents="none" style={{ position: 'absolute', left: 4, top: 4, width: wide ? 150 : 96, height: wide ? 120 : 80 }} /> : null}
            {lang === 'zh' && K.latticeBL ? <Image source={K.latticeBL} contentFit="contain" contentPosition="bottom left" pointerEvents="none" style={{ position: 'absolute', left: 4, bottom: 4, width: wide ? 120 : 80, height: wide ? 150 : 100 }} /> : null}
            {lang === 'ja' ? <Image source={motif.corner} contentFit="contain" pointerEvents="none" style={{ position: 'absolute', left: 6, top: 6, width: wide ? 96 : 64, height: wide ? 96 : 64 }} /> : null}
            <View style={{ paddingLeft: wide ? 64 : 34, paddingRight: wide ? 24 : 20, paddingTop: wide ? 40 : 54, paddingBottom: 38, gap: 10, maxWidth: wide ? '60%' : '90%' }}>
              <Text style={{ color: c.accent, fontSize: 13, letterSpacing: 2.2, fontFamily: EA_FONT.heavy }}>{kicker}</Text>
              {lang === 'zh' ? (
                <Text accessibilityRole="header" style={[{ fontSize: wide ? 80 : 54, lineHeight: wide ? 92 : 62, fontFamily: skin.fontHan as never, fontWeight: '800' }, goldText] as never}>
                  {skin.han}
                </Text>
              ) : (
                <>
                  <Text accessibilityRole="header" style={{ color: '#FFFFFF', fontSize: wide ? 56 : 38, lineHeight: wide ? 64 : 44, fontFamily: JA_TITLE_FONT as never, fontWeight: '800', letterSpacing: 1, ...(web ? { textShadow: '0 2px 10px rgba(0,0,0,0.45)' } : null) }}>
                    {L('TIẾNG NHẬT', 'JAPANESE')}
                  </Text>
                  <View style={{ alignSelf: 'flex-start', justifyContent: 'center', minHeight: 48, minWidth: wide ? 360 : 300, paddingHorizontal: wide ? 34 : 22 }}>
                    {K.ribbon ? <Image source={K.ribbon} contentFit="fill" style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }} /> : null}
                    <Text style={{ color: '#FFF6DC', fontSize: wide ? 22 : 14, fontFamily: JA_TITLE_FONT as never, fontStyle: 'italic', fontWeight: '700' }}>{L('Hành trình chinh phục JLPT', 'Your JLPT journey')}</Text>
                  </View>
                </>
              )}
              <Text style={{ color: c.heroInk, fontSize: wide ? 17 : 15, lineHeight: 25, opacity: 0.95, fontFamily: EA_FONT.body }}>
                {lang === 'zh'
                  ? L('Lộ trình từ HSK 1 đến HSK 6: từng chủ đề, từng buổi học, tiến độ rõ ràng, hiệu quả cao.', 'HSK 1 to HSK 6, theme by theme, with clear measured progress.')
                  : L('Lộ trình từ N5 đến N1: từng chủ đề, từng buổi học, tiến độ đo thật.', 'N5 to N1, theme by theme. Progress is measured, not guessed.')}
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
                <Chip skin={skin} hero icon={lang === 'ja' ? K.flowerIcon : undefined} text={`${levels.length} ${L('cấp', 'levels')}`} />
                <Chip skin={skin} hero text={`${prog.words.toLocaleString('vi-VN')} ${L('từ', 'words')}`} />
                <Chip skin={skin} hero text={`${prog.done}/${prog.total} ${L('buổi xong', 'lessons done')}`} />
              </View>
              <View style={{ marginTop: 8, maxWidth: 440, gap: 10, flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ color: c.heroInk2, fontSize: 13, fontFamily: EA_FONT.strong }}>{L(`Đã học ${pct}% số từ`, `${pct}% of words studied`)}</Text>
                <View style={{ flex: 1 }}><Bar pct={pct} skin={skin} height={9} /></View>
              </View>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push(eaNodeHref(nextNode) as never)}
                style={({ pressed }) => ({ alignSelf: 'flex-start', marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: cta, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 999, opacity: pressed ? 0.85 : 1, ...glow(`${cta}66`, 16) })}
              >
                <Text style={{ color: lang === 'ja' ? '#FFFFFF' : c.onAccent, fontSize: 15, fontFamily: EA_FONT.heavy }}>{prog.done > 0 ? L('Tiếp tục học', 'Continue') : L('Bắt đầu học', 'Start learning')} →</Text>
                {lang === 'zh' && K.cloud ? <Image source={K.cloud} contentFit="contain" style={{ width: 44, height: 20 }} /> : null}
              </Pressable>
            </View>
          </View>
          {/* Lớp chi tiết nằm TRONG hero (cắt theo khung bo góc): mây, cánh hoa, bướm. */}
          <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, borderRadius: 26, overflow: 'hidden' }}>
            {lang === 'ja' ? (
              <>
                {wide ? <Image source={JA_MOTIF.cloud} contentFit="contain" style={{ position: 'absolute', left: '38%', top: '8%', width: wide ? 190 : 110, height: 84, opacity: 0.9 }} /> : null}
                <Image source={JA_MOTIF.cloudBand} contentFit="contain" style={{ position: 'absolute', left: '34%', bottom: '3%', width: wide ? 260 : 150, height: wide ? 64 : 40, opacity: 0.9 }} />
                <Image source={JA_MOTIF.petals} contentFit="contain" style={{ position: 'absolute', right: '30%', top: '10%', width: 76, height: 60, opacity: 0.95, transform: [{ rotate: '24deg' }] }} />
                <Image source={JA_MOTIF.petals} contentFit="contain" style={{ position: 'absolute', right: '12%', top: '46%', width: 60, height: 48, opacity: 0.9, transform: [{ rotate: '-30deg' }] }} />
                <Image source={JA_MOTIF.petals} contentFit="contain" style={{ position: 'absolute', left: '46%', top: '58%', width: 52, height: 42, opacity: 0.8, transform: [{ rotate: '60deg' }] }} />
              </>
            ) : (
              <>
                {wide ? <Image source={ZH_MOTIF.ruyiCloud} contentFit="contain" style={{ position: 'absolute', left: '40%', top: '10%', width: wide ? 150 : 90, height: 74, opacity: 0.95 }} /> : null}
                <Image source={ZH_MOTIF.cloudScroll} contentFit="contain" style={{ position: 'absolute', left: '36%', bottom: '4%', width: wide ? 230 : 130, height: wide ? 80 : 46, opacity: 0.9 }} />
                {wide ? <Image source={ZH_MOTIF.butterflies} contentFit="contain" style={{ position: 'absolute', right: '26%', bottom: '16%', width: 120, height: 86, opacity: 0.95 }} /> : null}
                {wide ? <Image source={ZH_MOTIF.osmanthus} contentFit="contain" style={{ position: 'absolute', left: '52%', top: '56%', width: 90, height: 64, opacity: 0.85, transform: [{ rotate: '-14deg' }] }} /> : null}
              </>
            )}
          </View>
          {/* Họa tiết bóc tách vượt khung hero. */}
          {lang === 'zh' ? (
            <>
              {wide ? <Image source={ZH_MOTIF.lantern} contentFit="contain" pointerEvents="none" style={{ position: 'absolute', right: 28, top: -8, width: 74, height: 130 }} /> : null}
              {wide ? <Image source={ZH_MOTIF.lantern} contentFit="contain" pointerEvents="none" style={{ position: 'absolute', right: 96, top: -8, width: 56, height: 100 }} /> : null}
              <Image source={motif.craneFly} contentFit="contain" pointerEvents="none" style={{ position: 'absolute', right: wide ? 150 : 6, top: wide ? -30 : -40, width: wide ? 250 : 96, height: wide ? 210 : 96, transform: [{ rotate: '-4deg' }] }} />
              <Image source={ZH_MOTIF.plum} contentFit="contain" pointerEvents="none" style={{ position: 'absolute', right: -14, bottom: -30, width: wide ? 300 : 190, height: wide ? 210 : 130 }} />
            </>
          ) : (
            <>
              <Image source={motif.craneFly} contentFit="contain" pointerEvents="none" style={{ position: 'absolute', right: wide ? 120 : 4, top: wide ? -34 : -44, width: wide ? 190 : 96, height: wide ? 180 : 96, transform: [{ rotate: '-6deg' }] }} />
              <Image source={JA_MOTIF.sakuraL} contentFit="contain" pointerEvents="none" style={{ position: 'absolute', right: -16, bottom: -30, width: wide ? 280 : 200, height: wide ? 190 : 140 }} />
            </>
          )}
        </View>
      </Appear>
      {lang === 'zh' ? <ZhLearnTiles accent={c.accent} /> : null}
      <EaSentenceTiles lang={lang} accent={c.accent} />

      {/* ---------------------------------------------------------------- skin */}
      <SkinPicker lang={lang} skin={skin} onPick={(id) => setSkin(lang, id)} />

      <Divider lang={lang} skin={skin} />

      {/* ---------------------------------------------------------------- cấp */}
      <View style={{ gap: 12 }}>
        <SectionTitle skin={skin} text={L('Chọn cấp', 'Choose a level')} sub={lang === 'zh' ? 'HSK' : 'JLPT'} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingVertical: 8, paddingRight: 8 }}>
          {levels.map((lv, i) => (
            <LevelSeal key={lv.id} level={lv} skin={skin} seal={K[SEALS[lang][i] ?? '']} active={lv.id === level.id} done={prog.byLevel[lv.id]?.done ?? 0} total={prog.byLevel[lv.id]?.total ?? 0} onPress={() => setLevel(lang, lv.id)} />
          ))}
        </ScrollView>
      </View>

      {/* ---------------------------------------------------------------- chặng của cấp */}
      <LevelBody level={level} skin={skin} states={prog.states} lang={lang} nextId={nextNode.id} />

      <Divider lang={lang} skin={skin} />

      {/* ---------------------------------------------------------------- sách đi kèm */}
      {level.books.length ? (
        <View style={{ gap: 12 }}>
          <SectionTitle skin={skin} text={L('Sách đi kèm', 'Companion books')} sub={level.label} />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            {level.books.map((b) => (
              <BookCard key={b.slug} skin={skin} slug={b.slug} title={b.title} blurb={b.blurb} words={BOOK_VOCAB_BOOKS.find((x) => x.slug === b.slug)?.words.length} />
            ))}
          </View>
        </View>
      ) : null}

      <Footer lang={lang} skin={skin} wide={wide} />
    </View>
  );
}

/* ------------------------------------------------------------------ mảnh nhỏ */

function BookCard({ skin, slug, title, blurb, words }: { skin: EaSkin; slug: string; title: { vi: string; en: string }; blurb: { vi: string; en: string }; words?: number }) {
  const { L } = useL();
  const c = skin.c;
  const cover = coverOf(slug);
  return (
    <Pressable accessibilityRole="link" onPress={() => router.push(`/vocabulary/book/${slug}` as never)} style={({ pressed }) => ({ flexGrow: 1, flexBasis: 300, flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: c.panel, borderColor: c.border, borderWidth: 1, borderRadius: 18, padding: 14, opacity: pressed ? 0.85 : 1 })}>
      {cover ? <Image source={cover} contentFit="contain" style={{ width: 70, height: 88 }} /> : null}
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={{ color: skin.lang === 'ja' ? '#C0392B' : c.accent, fontSize: 16, fontFamily: EA_FONT.heavy }}>{useBi(title)}</Text>
        <Text style={{ color: c.ink2, fontSize: 13, fontFamily: EA_FONT.body }}>{useBi(blurb)}</Text>
        {words ? <Text style={{ color: c.ink2, fontSize: 13, fontFamily: EA_FONT.mid }}>{`${words.toLocaleString('vi-VN')} ${L('từ', 'words')}`}</Text> : null}
      </View>
    </Pressable>
  );
}

function SkinPicker({ lang, skin, onPick }: { lang: EaLang; skin: EaSkin; onPick: (id: string) => void }) {
  const { L } = useL();
  const skins = skinsOf(lang);
  return (
    <View style={{ gap: 12 }}>
      <SectionTitle skin={skin} text={L('Giao diện', 'Theme')} sub={`${skins.length}`} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 14, paddingVertical: 6 }}>
        {skins.map((s) => {
          const on = s.id === skin.id;
          return (
            <Pressable key={s.id} accessibilityRole="button" accessibilityState={{ selected: on }} onPress={() => onPick(s.id)} style={({ pressed }) => ({ width: 210, borderRadius: 18, overflow: 'hidden', borderWidth: on ? 2.5 : 1, borderColor: on ? (lang === 'ja' ? '#C23B2F' : skin.c.accent) : skin.c.border, backgroundColor: skin.c.panelSolid, opacity: pressed ? 0.85 : 1, ...(on ? glow(`${skin.c.accent}55`, 16) : null) })}>
              <View>
                <Image source={s.thumb} contentFit="cover" style={{ width: '100%', height: 100 }} />
                <Image source={lang === 'ja' ? JA_MOTIF.corner : ZH_MOTIF.corner} contentFit="contain" pointerEvents="none" style={{ position: 'absolute', left: 2, top: 2, width: 34, height: 34 }} />
                <Image source={lang === 'ja' ? JA_MOTIF.corner : ZH_MOTIF.corner} contentFit="contain" pointerEvents="none" style={{ position: 'absolute', right: 2, bottom: 2, width: 34, height: 34, transform: [{ rotate: '180deg' }] }} />
              </View>
              <View style={{ padding: 10, gap: 2 }}>
                <Text style={{ color: skin.c.ink, fontSize: 14.5, fontFamily: EA_FONT.heavy }}>{s.name}</Text>
                <Text style={{ color: skin.c.ink2, fontSize: 13, fontFamily: s.fontHan as never }}>{s.han}</Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

function LevelSeal({ level, skin, seal, active, done, total, onPress }: { level: EaLevel; skin: EaSkin; seal?: number; active: boolean; done: number; total: number; onPress: () => void }) {
  const title = useBi(level.title);
  const c = skin.c;
  const pct = total ? Math.round((done / total) * 100) : 0;
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected: active }} onPress={onPress} style={({ pressed }) => ({ width: 168, borderRadius: 20, padding: 12, gap: 8, backgroundColor: active ? c.panelSolid : c.panel, borderWidth: active ? 2.5 : 1, borderColor: active ? (skin.lang === 'ja' ? '#C23B2F' : c.accent) : c.border, opacity: pressed ? 0.85 : 1, ...(active ? glow(`${c.accent}66`, 18) : null) })}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        {seal ? (
          <Image source={seal} contentFit="contain" style={{ width: 54, height: 54 }} />
        ) : (
          <View style={{ width: 46, height: 46, borderRadius: 23, borderWidth: 2, borderColor: c.accent, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: c.accent, fontSize: 22, fontFamily: skin.fontHan as never }}>{level.seal}</Text>
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={{ color: c.ink, fontSize: 17, fontFamily: EA_FONT.heavy }}>{level.label}</Text>
          <Text style={{ color: c.ink2, fontSize: 13, fontFamily: EA_FONT.body }} numberOfLines={1}>{title}</Text>
        </View>
      </View>
      <Bar pct={pct} skin={skin} />
      <Text style={{ color: c.ink2, fontSize: 13, fontFamily: EA_FONT.mid }}>{`${done}/${total} · ${pct}%`}</Text>
      {KIT[skin.lang].cloud ? <Image source={KIT[skin.lang].cloud} contentFit="contain" pointerEvents="none" style={{ position: 'absolute', right: 6, bottom: 4, width: 54, height: 20, opacity: active ? 0.95 : 0.55 }} /> : null}
    </Pressable>
  );
}

function LevelBody({ level, skin, states, lang, nextId }: { level: EaLevel; skin: EaSkin; states: Record<string, NodeState>; lang: EaLang; nextId: string }) {
  const { L, en } = useL();
  const c = skin.c;
  const nodes = eaNodesOf(level);
  const done = nodes.filter((n) => states[n.id] === 'done').length;
  // Chặng đang mở: chặng chứa bài kế tiếp.
  const nextPart = level.parts.find((p) => p.nodes.some((n) => n.id === nextId))?.id;
  const [open, setOpen] = useState<string | null>(nextPart ?? level.parts[0]!.id);
  useEffect(() => setOpen(nextPart ?? level.parts[0]!.id), [level.id, nextPart, level.parts]);
  // Hàm bật/tắt ổn định: mở một chặng không làm các chặng còn lại dựng lại.
  const toggle = useCallback((id: string) => setOpen((cur) => (cur === id ? null : id)), []);
  const icons = PART_MOTIF[lang];
  const wm = lang === 'ja' ? JA_MOTIF.kikko : ZH_MOTIF.medallion;
  return (
    <View style={{ gap: 14, position: 'relative' }}>
      {/* Hình mờ phía sau danh sách chặng: lộ ra ở khe giữa các hàng. */}
      <Image source={wm} contentFit="contain" pointerEvents="none" style={{ position: 'absolute', right: -50, top: 90, width: 360, height: 360, opacity: skin.dark ? 0.16 : 0.22 }} />
      <Image source={lang === 'ja' ? JA_MOTIF.seigaiha : ZH_MOTIF.wave} contentFit="cover" pointerEvents="none" style={{ position: 'absolute', left: -30, bottom: 30, width: 300, height: 46, opacity: skin.dark ? 0.2 : 0.3 }} />
      <SectionTitle skin={skin} text={`${level.label} · ${en ? level.title.en : level.title.vi}`} sub={`${done}/${nodes.length}`} />
      <Text style={{ color: c.ink2, fontSize: 14.5, lineHeight: 22, fontFamily: EA_FONT.body }}>{`${en ? level.blurb.en : level.blurb.vi} ${L('Mục tiêu:', 'Goal:')} ${en ? level.goal.en : level.goal.vi}`}</Text>
      <View style={{ gap: 10 }}>
        {level.parts.map((p, i) => (
          <PartCard key={p.id} part={p} index={i} skin={skin} icon={icons[i % icons.length]!} states={states} open={open === p.id} onToggle={toggle} nextId={nextId} last={i === level.parts.length - 1} />
        ))}
      </View>
    </View>
  );
}

const PartCard = React.memo(function PartCard({ part, index, skin, icon, states, open, onToggle, nextId, last }: { part: EaPart; index: number; skin: EaSkin; icon: number; states: Record<string, NodeState>; open: boolean; onToggle: (id: string) => void; nextId: string; last: boolean }) {
  const { L, en } = useL();
  const c = skin.c;
  const K = KIT[skin.lang];
  const done = part.nodes.filter((n) => states[n.id] === 'done').length;
  const complete = done === part.nodes.length && part.nodes.length > 0;
  const pct = part.nodes.length ? Math.round((done / part.nodes.length) * 100) : 0;
  // Dòng đang mở của skin đỏ vàng sáng lên thành màu ngà (đúng mẫu): chữ đổi sang tối.
  const ivory = open && skin.id === 'zh-a';
  const ink = ivory ? '#4A0A12' : c.ink;
  const ink2 = ivory ? '#7A4B3A' : c.ink2;
  const hot = skin.lang === 'ja' ? '#C23B2F' : c.accent;
  return (
    <View style={{ flexDirection: 'row', gap: 12 }}>
      {/* Đường nối + huy hiệu số thứ tự của chặng */}
      <View style={{ width: 40, alignItems: 'center' }}>
        <View style={{ width: 38, height: 38, marginTop: 14, alignItems: 'center', justifyContent: 'center' }}>
          {skin.lang === 'ja' && K.badge ? (
            <Image source={K.badge} contentFit="contain" style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }} />
          ) : (
            <View style={{ position: 'absolute', left: 3, right: 3, top: 3, bottom: 3, borderRadius: 18, borderWidth: 2, borderColor: c.accent, backgroundColor: complete ? c.accent : c.panelSolid }} />
          )}
          <Text style={{ color: skin.lang === 'ja' ? '#FFFFFF' : complete ? c.onAccent : c.accent, fontSize: 14, fontFamily: EA_FONT.heavy }}>{complete ? '✓' : index + 1}</Text>
        </View>
        {!last ? <View style={{ flex: 1, width: 0, borderLeftWidth: 2, borderStyle: 'dashed', borderColor: skin.lang === 'ja' ? '#C23B2F88' : c.border, marginTop: 4 }} /> : null}
      </View>
      <View style={{ flex: 1, backgroundColor: ivory ? '#FBF1DC' : c.panel, borderColor: open ? hot : c.border, borderWidth: open ? 1.8 : 1, borderRadius: 20, overflow: 'hidden', ...(open ? glow(`${c.accent}33`, 14) : null) }}>
        {skin.lang === 'ja' ? (
          <>
            <Image source={JA_MOTIF.petals} contentFit="contain" pointerEvents="none" style={{ position: 'absolute', right: 40, top: 8, width: 120, height: 70, opacity: 0.55 }} />
            {K.cloud ? <Image source={K.cloud} contentFit="contain" pointerEvents="none" style={{ position: 'absolute', right: 150, bottom: 6, width: 86, height: 32, opacity: 0.6 }} /> : null}
          </>
        ) : (
          <>
            <Image source={ZH_MOTIF.cloudScroll} contentFit="contain" pointerEvents="none" style={{ position: 'absolute', right: 44, top: 4, width: 150, height: 62, opacity: ivory ? 0.4 : 0.5 }} />
            {K.cloud ? <Image source={K.cloud} contentFit="contain" pointerEvents="none" style={{ position: 'absolute', right: 190, bottom: 6, width: 80, height: 30, opacity: 0.5 }} /> : null}
          </>
        )}
        {open ? (
          <>
            {skin.lang === 'ja' ? (
              <>
                <Image source={JA_MOTIF.corner} contentFit="contain" pointerEvents="none" style={{ position: 'absolute', left: 3, top: 3, width: 44, height: 44 }} />
                <Image source={JA_MOTIF.corner} contentFit="contain" pointerEvents="none" style={{ position: 'absolute', right: 3, bottom: 3, width: 44, height: 44, transform: [{ rotate: '180deg' }] }} />
              </>
            ) : K.latticeTL ? (
              <>
                <Image source={K.latticeTL} contentFit="contain" contentPosition="top left" pointerEvents="none" style={{ position: 'absolute', left: 3, top: 3, width: 58, height: 46 }} />
                <Image source={K.latticeTL} contentFit="contain" contentPosition="top left" pointerEvents="none" style={{ position: 'absolute', right: 3, bottom: 3, width: 58, height: 46, transform: [{ rotate: '180deg' }] }} />
              </>
            ) : null}
          </>
        ) : null}
        <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={() => onToggle(part.id)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 }}>
          <Image source={icon} contentFit="contain" style={{ width: 66, height: 66 }} />
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={{ color: ink, fontSize: 17, fontFamily: EA_FONT.heavy }}>{en ? part.title.en : part.title.vi}</Text>
            <Text style={{ color: ink2, fontSize: 13, fontFamily: EA_FONT.body }} numberOfLines={open ? 3 : 1}>{(en ? part.blurb.en : part.blurb.vi) || ''}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{ flex: 1, maxWidth: 240 }}><Bar pct={pct} skin={skin} /></View>
              <Text style={{ color: ink2, fontSize: 13, fontFamily: EA_FONT.mid }}>{`${done}/${part.nodes.length} · ${part.words} ${L('từ', 'words')}`}</Text>
            </View>
          </View>
          <Text style={{ color: ivory ? '#8E1420' : skin.lang === 'ja' ? '#C0392B' : c.accent, fontSize: 20 }}>{open ? '⌄' : '›'}</Text>
        </Pressable>
        {open ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 14, paddingBottom: 14 }}>
            {part.nodes.map((n) => (
              <LessonChip key={n.id} node={n} skin={skin} ivory={ivory} state={states[n.id] ?? 'todo'} isNext={n.id === nextId} />
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );
});

const LessonChip = React.memo(function LessonChip({ node, skin, ivory, state, isNext }: { node: EaNode; skin: EaSkin; ivory: boolean; state: NodeState; isNext: boolean }) {
  const { L, en } = useL();
  const c = skin.c;
  const done = state === 'done';
  const started = state === 'started';
  const hot = skin.lang === 'ja' ? '#C23B2F' : ivory ? '#8E1420' : c.accent;
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`${en ? node.title.en : node.title.vi}, ${node.words} ${L('từ', 'words')}`}
      onPress={() => router.push(eaNodeHref(node) as never)}
      style={({ pressed }) => ({
        minWidth: 116,
        paddingHorizontal: 12,
        paddingVertical: 9,
        borderRadius: 14,
        borderWidth: isNext ? 2.5 : 1.5,
        borderColor: done || isNext ? hot : started ? c.accent2 : ivory ? '#C9A56A' : c.border,
        backgroundColor: done ? hot : ivory ? '#FFF9EC' : c.panelSolid,
        opacity: pressed ? 0.8 : 1,
        gap: 1,
      })}
    >
      <Text style={{ color: done ? '#FFFFFF' : ivory ? '#4A0A12' : c.ink, fontSize: 13.5, fontFamily: EA_FONT.heavy }}>{`${done ? '✓ ' : ''}${en ? node.title.en : node.title.vi}`}</Text>
      <Text style={{ color: done ? '#FFFFFF' : ivory ? '#7A4B3A' : c.ink2, fontSize: 12, fontFamily: EA_FONT.body }}>{isNext ? L('Học tiếp', 'Up next') : started ? L('Đang học', 'In progress') : `${node.words} ${L('từ', 'words')} · ${node.minutes}′`}</Text>
    </Pressable>
  );
});
