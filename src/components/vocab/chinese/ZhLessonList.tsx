import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import { Grid } from '@/components/layout/Grid';
import { Appear } from '@/components/motion/Motion';
import type { BookVocabBook, BookVocabTheme, VocabTopicWord } from '@/data/vocab-topics';
import { masteredCount, useTopicStudyStore } from '@/store/useTopicStudyStore';
import { HANZI_FAMILY, RADIUS, ZH, ZH_TONE, toneOf } from './palette';
import { groupWordsByTheme, levelOfName, UNSORTED_THEME } from './themes';
import { useChineseFonts } from './useChineseFonts';

/** Màu nhấn luân phiên cho từng chủ đề (và đầu mỗi thẻ). */
const ACCENTS = [ZH.seal, ZH.sage, ZH.gold, '#3C6E9E', '#6B4A8A', ZH.ink2] as const;
/** Số từ xem trước trên mỗi thẻ buổi / chủ đề. */
const PREVIEW_LESSON = 6;
const PREVIEW_THEME = 8;

/** Một hàng chữ Hán xem trước: mỗi chữ mang màu thanh điệu của nó. */
function HanziChips({ words, limit, more }: { words: readonly VocabTopicWord[]; limit: number; more: number }) {
  const shown = words.slice(0, limit);
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
      {shown.map((w, i) => (
        <View
          key={`${w.word}-${i}`}
          style={{ minWidth: 34, height: 34, paddingHorizontal: 6, borderRadius: 10, backgroundColor: ZH.cream2, borderWidth: 1, borderColor: ZH.line, alignItems: 'center', justifyContent: 'center' }}
        >
          <Text style={{ fontFamily: HANZI_FAMILY, fontSize: 18, color: ZH_TONE[toneOf(w.romanization || w.ipa)] }}>{w.word}</Text>
        </View>
      ))}
      {more > 0 ? (
        <View style={{ height: 34, paddingHorizontal: 10, borderRadius: 10, backgroundColor: ZH.card, borderWidth: 1, borderColor: ZH.line, justifyContent: 'center' }}>
          <Text className="font-strong text-label" style={{ color: ZH.ink2 }}>
            +{more}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

/** Thanh tiến độ mỏng: phần xanh là số từ đã nhớ. */
function Progress({ done, size, color }: { done: number; size: number; color: string }) {
  const pct = size ? Math.round((done / size) * 100) : 0;
  return (
    <View style={{ height: 6, borderRadius: 3, backgroundColor: '#EFE6D4', overflow: 'hidden' }}>
      <View style={{ width: `${pct}%`, height: '100%', backgroundColor: color }} />
    </View>
  );
}

/** Nhãn nhỏ (đơn vị, trang sách…). */
function Tag({ label, strong = false }: { label: string; strong?: boolean }) {
  return (
    <View
      style={{
        height: 24,
        paddingHorizontal: 10,
        borderRadius: 999,
        backgroundColor: strong ? ZH.ink : ZH.cream2,
        borderWidth: 1,
        borderColor: strong ? ZH.ink : ZH.line,
        justifyContent: 'center',
      }}
    >
      <Text className="font-strong text-label" style={{ color: strong ? ZH.cream2 : ZH.ink2 }}>
        {label}
      </Text>
    </View>
  );
}

/**
 * Trang một cấp HSK (giấy Band 9). Trên cùng là các CHỦ ĐỀ của cấp (từ sách HSK 2.0 cộng đồng, xem `themes.ts`),
 * bấm một chủ đề để mở buổi có từ đầu tiên của nhóm. Bên dưới là các BUỔI, mỗi buổi kèm Unit, trang sách,
 * sáu từ xem trước và tiến độ. Sách HSK 2.0 cộng đồng đã chia sẵn theo chủ đề nên không lặp lại phần chủ đề.
 */
export function ZhLessonList({ book, topic }: { book: BookVocabBook; topic: BookVocabTheme }) {
  useChineseFonts();
  const stages = useTopicStudyStore((s) => s.stages);
  const total = topic.words.length;
  const mastered = topic.lessons.reduce((n, lesson) => n + masteredCount(stages[lesson.slug]), 0);
  const level = levelOfName(topic.nameVi);
  const showThemes = !book.slug.includes('community');
  const groups = showThemes ? groupWordsByTheme(topic) : [];
  const realThemes = groups.filter((g) => g.theme !== UNSORTED_THEME).length;
  const sourceLessonGroups = groups.filter((g) => g.sourceLesson).length;

  // Từ → buổi chứa nó (để bấm chủ đề mở đúng buổi) và trạng thái đã nhớ của từ đó.
  const lessonOf = new Map<string, string>();
  for (const lesson of topic.lessons) for (const w of lesson.words) if (!lessonOf.has(w.word)) lessonOf.set(w.word, lesson.slug);
  const isMastered = (w: VocabTopicWord) => stages[lessonOf.get(w.word) ?? '']?.[w.word] === 2;

  return (
    <View style={{ gap: 26 }}>
      <Pressable accessibilityRole="button" onPress={() => router.push(`/vocabulary/book/${book.slug}` as never)} style={{ alignSelf: 'flex-start' }}>
        <Text className="font-strong text-label" style={{ color: ZH.onPage }}>
          ← {book.nameVi.split(' · ')[0]}
        </Text>
      </Pressable>

      {/* Đầu cấp: tên, số liệu và tiến độ chung */}
      <View style={{ gap: 8 }}>
        <Text className="font-sans text-label" style={{ color: ZH.onPageSoft }}>
          {book.nameVi.split(' · ')[1] ?? 'Từ vựng tiếng Trung'}
        </Text>
        <Text className="font-heavy text-pageTitle" style={{ color: ZH.onPage }}>
          {topic.nameVi}
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
          {[
            `${total.toLocaleString('vi-VN')} từ`,
            `${topic.lessons.length} buổi học`,
            ...(realThemes ? [`${realThemes} nhóm từ`] : []),
            `${mastered} đã nhớ`,
          ].map((label) => (
            <Tag key={label} label={label} />
          ))}
        </View>
        <View style={{ maxWidth: 480, marginTop: 8 }}>
          <Progress done={mastered} size={total} color={ZH.sage} />
        </View>
      </View>

      {/* 1 · Chủ đề của cấp */}
      {groups.length ? (
        <View style={{ gap: 14 }}>
          <View style={{ gap: 4 }}>
            <Text className="font-heavy text-sectionTitle" style={{ color: ZH.onPage }}>
              {level ? `Chủ đề trong HSK ${level}` : 'Chủ đề từ vựng'}
            </Text>
            <Text className="font-sans text-label" style={{ color: ZH.onPageSoft }}>
              Bấm một nhóm để mở bài chứa từ đầu tiên. {sourceLessonGroups ? `${sourceLessonGroups} nhóm chưa khớp chủ đề HSK được giữ theo bài nguồn.` : ''}
            </Text>
          </View>
          <Grid columns={3} tabletColumns={2} mobileColumns={1} gap={16}>
            {groups.map((g, i) => {
              const accent = ACCENTS[i % ACCENTS.length]!;
              const done = g.words.filter(isMastered).length;
              const first = lessonOf.get(g.words[0]!.word);
              return (
                <Appear key={g.theme} index={Math.min(i, 8)}>
                  <Pressable
                    accessibilityRole="link"
                    accessibilityLabel={`${g.theme}, ${g.words.length} từ`}
                    onPress={() => first && router.push(`/vocabulary/topic/${first}` as never)}
                    style={({ hovered, pressed }: { hovered?: boolean; pressed?: boolean }) => ({
                      overflow: 'hidden',
                      borderRadius: RADIUS.sheet,
                      borderWidth: 1,
                      borderColor: hovered ? ZH.gold : ZH.line,
                      backgroundColor: ZH.card,
                      opacity: pressed ? 0.92 : 1,
                      transform: [{ scale: hovered ? 1.01 : 1 }],
                      ...(hovered ? ({ boxShadow: '0 14px 30px -18px rgba(92,64,22,0.4)' } as object) : null),
                    })}
                  >
                    <View style={{ height: 5, backgroundColor: accent }} />
                    <View style={{ padding: 18, gap: 12 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                        <Text className="font-heavy text-body" style={{ color: ZH.ink, flex: 1 }}>
                          {g.theme}
                        </Text>
                        <Tag label={`${g.words.length} từ`} strong />
                      </View>
                      <HanziChips words={g.words} limit={PREVIEW_THEME} more={Math.max(0, g.words.length - PREVIEW_THEME)} />
                      <View style={{ gap: 6 }}>
                        <Progress done={done} size={g.words.length} color={accent} />
                        <Text className="font-sans text-label" style={{ color: ZH.ink2 }}>
                          {done} / {g.words.length} từ đã nhớ
                        </Text>
                      </View>
                    </View>
                  </Pressable>
                </Appear>
              );
            })}
          </Grid>
        </View>
      ) : null}

      {/* 2 · Các buổi học */}
      <View style={{ gap: 14 }}>
        <View style={{ gap: 4 }}>
          <Text className="font-heavy text-sectionTitle" style={{ color: ZH.onPage }}>
            Các buổi học
          </Text>
          <Text className="font-sans text-label" style={{ color: ZH.onPageSoft }}>
            Mỗi buổi tối đa 50 từ, theo đúng thứ tự của sách.
          </Text>
        </View>
        <Grid columns={3} tabletColumns={2} mobileColumns={1} gap={16}>
          {topic.lessons.map((lesson, index) => {
            const done = masteredCount(stages[lesson.slug]);
            const size = lesson.words.length;
            const pages = lesson.sourcePages ?? [];
            const pageLabel = pages.length ? `trang ${pages[0]}${pages.length > 1 ? `–${pages[pages.length - 1]}` : ''}` : null;
            return (
              <Appear key={lesson.slug} index={Math.min(index, 8)}>
                <Pressable
                  accessibilityRole="link"
                  accessibilityLabel={`${lesson.nameVi}, ${size} từ`}
                  onPress={() => router.push(`/vocabulary/topic/${lesson.slug}` as never)}
                  style={({ hovered, pressed }: { hovered?: boolean; pressed?: boolean }) => ({
                    padding: 18,
                    gap: 14,
                    borderRadius: RADIUS.sheet,
                    borderWidth: 1,
                    borderColor: hovered ? ZH.gold : ZH.line,
                    backgroundColor: ZH.card,
                    opacity: pressed ? 0.92 : 1,
                    transform: [{ scale: hovered ? 1.01 : 1 }],
                    ...(hovered ? ({ boxShadow: '0 14px 30px -18px rgba(92,64,22,0.4)' } as object) : null),
                  })}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                    <View style={{ width: 46, height: 46, borderRadius: 12, backgroundColor: ZH.seal, alignItems: 'center', justifyContent: 'center' }}>
                      <Text className="font-heavy text-body" style={{ color: '#FFF8EE' }}>
                        {String(index + 1).padStart(2, '0')}
                      </Text>
                    </View>
                    <View style={{ flex: 1, minWidth: 0, gap: 6 }}>
                      <Text className="font-heavy text-body" style={{ color: ZH.ink }}>
                        {lesson.nameVi}
                      </Text>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                        {lesson.sourceUnit ? <Tag label={`Unit ${String(lesson.sourceUnit).padStart(2, '0')}`} strong /> : null}
                        {pageLabel ? <Tag label={pageLabel} /> : null}
                      </View>
                    </View>
                  </View>

                  <HanziChips words={lesson.words} limit={PREVIEW_LESSON} more={Math.max(0, size - PREVIEW_LESSON)} />

                  <View style={{ gap: 6 }}>
                    <Progress done={done} size={size} color={ZH.sage} />
                    <Text className="font-sans text-label" style={{ color: ZH.ink2 }}>
                      {done} / {size} từ đã nhớ
                    </Text>
                  </View>
                </Pressable>
              </Appear>
            );
          })}
        </Grid>
      </View>
    </View>
  );
}
