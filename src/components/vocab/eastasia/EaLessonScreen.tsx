import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import { Appear } from '@/components/motion/Motion';
import { ChineseTopicPage } from '@/components/vocab/chinese/ChineseTopicPage';
import { Flashcards } from '@/components/vocab/study/Flashcards';
import type { EaLang } from '@/data/learning-path/east-asian';
import { BOOK_VOCAB_BOOKS } from '@/data/vocab-topics';
import { useL } from '@/i18n/useL';
import type { DeckStatus } from '@/services/vocab/deck-status';
import type { StudyWord, WordStage } from '@/services/vocab/topic-study';
import { isDialogueLesson, JA_SET_ART, sceneOf } from '../japanese/ja-art';

import { EaHero, EaScreen } from './EaPages';
import { EA_FONT, Divider, Footer, SectionTitle, glow, useEaSkin } from './EaParts';
import { EaFrame, EaModeTile, EaSiblings, EaTileGrid, EaWordRow, modeArt, statusArt } from './EaLesson';

export type EaMode = { key: string; route?: string; label: string; labelEn: string; note: string; noteEn: string; recommended?: boolean };

const STATUS: { key: DeckStatus; label: string; labelEn: string; only: string }[] = [
  { key: 'mastered', label: 'Đã nhớ', labelEn: 'Remembered', only: 'all' },
  { key: 'new', label: 'Chưa nhớ', labelEn: 'Not yet', only: 'new' },
  { key: 'review', label: 'Cần ôn tập', labelEn: 'Needs review', only: 'review' },
];

const GROUP_LABEL_EN: Record<string, string> = { 'Từ đã lưu': 'Saved words', 'Từ trong bài': 'Words from the article', 'Thuật ngữ': 'Terms', 'Từ tiếng Nhật': 'Japanese words', 'Từ tiếng Trung': 'Chinese words' };

type Props = {
  lang: EaLang;
  slug: string;
  title: string;
  words: StudyWord[];
  pct: number;
  status: Record<DeckStatus, readonly unknown[]>;
  groups: { label: string; words: StudyWord[] }[];
  modes: EaMode[];
  stages: Readonly<Record<string, WordStage>> | undefined;
  starred: Set<string>;
  saved: Set<string>;
  remaining: number;
  justSaved: number;
  shuffle: boolean;
  onSave: (w: StudyWord) => void;
  onSaveAll: () => void;
  onStar: (w: StudyWord) => void;
  onRate: (w: StudyWord, stage: WordStage) => void;
};

/**
 * Trang một bài học tiếng Trung / Nhật theo skin: hero có tranh, các cách luyện, ba nhóm trạng thái,
 * khu học từng từ trong khung hoa văn, danh sách từ (Nhật) và các bài cùng chủ đề.
 * Mọi xử lý (lưu, sao, chấm mức nhớ) do trang gọi truyền vào nên dùng chung với các bộ khác.
 */
export function EaLessonScreen(p: Props) {
  const { L, en } = useL();
  const lang = p.lang;
  const skin = useEaSkin(lang);
  const c = skin.c;
  const [limit, setLimit] = useState(30);
  const unit = BOOK_VOCAB_BOOKS.flatMap((b) => b.topics.map((t) => ({ b, t }))).find(({ t }) => t.lessons.some((l) => l.slug === p.slug));
  const dialogue = isDialogueLesson(p.slug);
  const scene = lang === 'ja' ? JA_SET_ART[p.slug] ?? sceneOf(p.title) : undefined;
  const hot = lang === 'ja' ? '#D9463A' : c.accent;
  const learn = p.modes.find((m) => m.recommended) ?? p.modes[0];
  const total = p.groups.reduce((n, g) => n + g.words.length, 0);
  let budget = limit;

  return (
    <EaScreen
      lang={lang}
      backLabel={unit ? L('Danh sách buổi học', 'Lessons') : L('Tất cả sách từ vựng', 'All vocabulary books')}
      onBack={() => router.push((unit ? `/vocabulary/book/${unit.b.slug}/${unit.t.slug}` : '/vocabulary/topics') as never)}
    >
      <EaHero
        lang={lang}
        skin={skin}
        kicker={lang === 'zh' ? L('BỘ TỪ TIẾNG TRUNG', 'CHINESE WORD SET') : dialogue ? L('HỘI THOẠI · TIẾNG NHẬT', 'DIALOGUE · JAPANESE') : L('TỪ RIÊNG LẺ · TIẾNG NHẬT', 'SINGLE WORDS · JAPANESE')}
        title={p.title}
        side={scene}
        chips={[L(`${p.words.length} từ`, `${p.words.length} words`), L(`${p.status.mastered.length} đã nhớ`, `${p.status.mastered.length} remembered`), L(`${p.status.review.length} cần ôn`, `${p.status.review.length} to review`)]}
        pct={p.pct}
        pctLabel={L(`Đã học ${p.pct}%`, `${p.pct}% studied`)}
        cta={learn ? { label: L('Học ngay', 'Study now'), onPress: () => router.push(`/vocabulary/topic/${p.slug}/${learn.route ?? learn.key}` as never) } : undefined}
      />

      <View style={{ gap: 14 }}>
        <SectionTitle skin={skin} text={L('Cách luyện', 'Practice modes')} sub={`${p.modes.length}`} />
        <EaTileGrid min={200}>
          {p.modes.map((m) => (
            <EaModeTile key={m.key} skin={skin} art={modeArt(lang, m.key)} title={en ? m.labelEn : m.label} sub={en ? m.noteEn : m.note} chip={m.recommended ? L('Gợi ý', 'Suggested') : undefined} cta={L('Bắt đầu', 'Start')} onPress={() => router.push(`/vocabulary/topic/${p.slug}/${m.route ?? m.key}` as never)} />
          ))}
        </EaTileGrid>
      </View>

      <View style={{ gap: 12 }}>
        <EaTileGrid min={170}>
          {STATUS.map((t) => {
            const count = p.status[t.key].length;
            return <EaModeTile key={t.key} skin={skin} art={statusArt(lang, t.key)} title={en ? t.labelEn : t.label} value={count} disabled={count === 0 && t.key !== 'mastered'} onPress={() => router.push(`/vocabulary/topic/${p.slug}/quiz?only=${t.only}` as never)} />;
          })}
        </EaTileGrid>
      </View>

      <Divider lang={lang} skin={skin} />

      <View style={{ gap: 14 }}>
        <SectionTitle skin={skin} text={L('Học từng từ', 'Study word by word')} sub={lang === 'zh' ? '字' : '語'} />
        {lang === 'zh' ? (
          <ChineseTopicPage bare slug={p.slug} title={p.title} eyebrow="" words={p.words} stages={p.stages} starred={p.starred} saved={p.saved} shuffle={p.shuffle} onSave={p.onSave} onStar={p.onStar} onRate={p.onRate} />
        ) : (
          <EaFrame skin={skin} pad={26}>
            <View style={{ width: '100%', maxWidth: 560, alignSelf: 'center' }}>
              {p.words.length > 0 ? (
                <Flashcards initialShuffle={p.shuffle} words={p.words} savedWords={p.saved} onSave={p.onSave} starredWords={p.starred} onStar={p.onStar} accent={hot} tone={['#E2574A', '#8E2A22']} onRate={p.onRate} />
              ) : (
                <Text style={{ color: c.ink2, fontFamily: EA_FONT.body, textAlign: 'center', padding: 24 }}>{L('Chưa có từ nào trong bộ này.', 'There are no words in this set yet.')}</Text>
              )}
            </View>
          </EaFrame>
        )}
      </View>

      {p.justSaved > 0 ? (
        <Text style={{ color: c.ink, fontFamily: EA_FONT.heavy, fontSize: 14 }}>{L(`Đã thêm ${p.justSaved} từ vào sổ.`, `Added ${p.justSaved} words to your notebook.`)}</Text>
      ) : null}
      {p.remaining > 0 ? (
        <Pressable accessibilityRole="button" onPress={p.onSaveAll} style={({ pressed }) => ({ alignSelf: 'flex-start', minHeight: 44, paddingHorizontal: 22, borderRadius: 999, backgroundColor: hot, flexDirection: 'row', alignItems: 'center', gap: 10, opacity: pressed ? 0.85 : 1, ...glow(`${hot}55`, 14) })}>
          <Text style={{ color: lang === 'ja' ? '#FFFFFF' : c.onAccent, fontFamily: EA_FONT.heavy, fontSize: 14 }}>{L(`Thêm cả ${p.remaining} từ chưa lưu vào sổ`, `Add all ${p.remaining} unsaved words to notebook`)}</Text>
          <Text style={{ color: lang === 'ja' ? '#FFFFFF' : c.onAccent, fontSize: 18, fontFamily: EA_FONT.heavy }}>+</Text>
        </Pressable>
      ) : (
        <Text style={{ color: c.ink, fontFamily: EA_FONT.heavy, fontSize: 14 }}>{L('Đã lưu hết cả bộ này vào sổ từ.', 'This whole set is saved in your notebook.')}</Text>
      )}

      {lang === 'ja'
        ? p.groups.map((g, gi) => {
            const take = Math.max(0, Math.min(g.words.length, budget));
            budget -= take;
            if (take === 0) return null;
            return (
              <Appear key={g.label} index={gi}>
                <View style={{ gap: 12 }}>
                  <SectionTitle skin={skin} text={en ? (GROUP_LABEL_EN[g.label] ?? g.label) : g.label} sub={L(`${g.words.length} từ`, `${g.words.length} words`)} />
                  <View style={{ gap: 10 }}>
                    {g.words.slice(0, take).map((w, wi) => <EaWordRow key={`${w.word}-${wi}`} skin={skin} word={w} saved={p.saved.has(w.word.toLowerCase())} onSave={() => p.onSave(w)} />)}
                  </View>
                </View>
              </Appear>
            );
          })
        : null}
      {lang === 'ja' && total > limit ? (
        <Pressable accessibilityRole="button" onPress={() => setLimit((n) => n + 30)} style={{ alignItems: 'center', paddingVertical: 12, borderRadius: 999, backgroundColor: c.panel, borderWidth: 1.5, borderColor: c.border }}>
          <Text style={{ color: c.ink, fontFamily: EA_FONT.heavy, fontSize: 14 }}>{L(`Hiện thêm ${Math.min(30, total - limit)} từ (còn ${total - limit})`, `Show ${Math.min(30, total - limit)} more (${total - limit} left)`)}</Text>
        </Pressable>
      ) : null}

      {unit ? (
        <>
          <Divider lang={lang} skin={skin} />
          <View style={{ gap: 12 }}>
            <SectionTitle skin={skin} text={(en ? unit.t.name : unit.t.nameVi).replace(/^(HSK \d(?:-9)?|JLPT N\d) · /, '')} sub={L('Các bài cùng chủ đề', 'Same topic')} />
            <EaSiblings skin={skin} lessons={unit.t.lessons} currentSlug={p.slug} />
          </View>
        </>
      ) : null}
      <Footer lang={lang} skin={skin} wide />
    </EaScreen>
  );
}
