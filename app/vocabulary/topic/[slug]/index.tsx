import { themedHex } from '@/theme/palette-state';
import React, { useMemo, useState } from 'react';
import { DueToday } from '@/components/vocab/DueToday';
import { Pressable, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { Appear } from '@/components/motion/Motion';
import { Badge, Button, Card, Icon, SectionHeader } from '@/components/ui';
import { useStudyDeck } from '@/components/vocab/study/useStudyDeck';
import { ExampleSentence } from '@/components/vocab/ExampleSentence';
import { deckLevels, getStaticDeck, groupDeckWords, levelOf, NOTEBOOK_SLUG, splitLevelSlug } from '@/data/study-decks';
import type { StudyWord } from '@/services/vocab/topic-study';
import { isLetterWord } from '@/services/vocab/review-games';
import { useVocabStore } from '@/store/useVocabStore';
import { lemmatize } from '@/services/dictionary/lookup';
import { color } from '@/theme/tokens';
import { Flashcards } from '@/components/vocab/study/Flashcards';
import { Grid } from '@/components/layout/Grid';
import type { IconName } from '@/components/ui/Icon';
import { useTopicStudyStore } from '@/store/useTopicStudyStore';
import { deckLook } from '@/components/vocab/deck-style';
import { deckProgress } from '@/services/vocab/deck-library';
import { groupByStatus, type DeckStatus } from '@/services/vocab/deck-status';
import { ProgressRing } from '@/components/vocab/DeckCard';
import { LevelCard } from '@/components/vocab/LevelCard';
import { LevelHeader } from '@/components/vocab/LevelHeader';
import { useReadingFonts } from '@/lib/readingFonts';
import { SealIcon } from '@/components/illust/HeroArt';
import { Sticker } from '@/components/illust/Sticker';
import { HeroShell } from '@/components/layout/HeroShell';
import { ToneTile } from '@/components/vocab/ToneTile';
import { Badge as BadgeSticker, CuteBook, type BadgeIcon } from '@/components/illust/Cute';
import { CuteTrophy, Motion } from '@/components/illust/CuteMore';
import { useL } from '@/i18n/useL';

/** Nhãn nhóm từ không theo band (bản tiếng Việt viết sẵn trong `groupDeckWords`). */
const GROUP_LABEL_EN: Record<string, string> = {
  'Từ đã lưu': 'Saved words',
  'Từ trong bài': 'Words from the article',
  'Thuật ngữ': 'Terms',
};

const GROUP_BADGE: readonly BadgeIcon[] = ['check', 'star', 'target', 'bolt'];
const GROUP_TONE = ['#22A06B', '#6A4BD9', '#F0703F', '#E0533D'] as const;

/**
 * Một bộ từ vựng: 50 từ, xếp theo mức band từ dễ tới khó.
 *
 * ĐÂY LÀ NƠI CHỌN CÁCH LUYỆN: thư viện Quiz từ vựng chỉ cho chọn bộ; vào tới
 * đây mới hiện đủ sáu cách luyện, thẻ ghi nhớ, từ gắn sao và danh sách từ.
 *
 * XẾP THEO BAND CHỨ KHÔNG THEO BẢNG CHỮ CÁI. Người học band 5.5 mở bộ Môi
 * trường ra mà gặp ngay "anthropogenic" thì đóng lại luôn; xếp theo độ khó thì
 * họ học được mười lăm từ đầu rồi mới gặp phần khó, và mười lăm từ đó dùng được
 * ngay ở bài viết tối nay.
 *
 * Lưu vào sổ từ đi qua đúng `saveWord` của store, nên từ lưu ở đây và từ lưu
 * lúc đọc bài nằm chung một chỗ, chung một lịch ôn FSRS. Hai kho riêng là hai
 * lịch ôn riêng, và người học sẽ ôn cùng một từ hai lần.
 */
/**
 * Bước chọn mức trước khi học một bộ có nhiều mức (Oxford A1–C1, bộ IELTS B1–C2, các bộ band):
 * "Tất cả" hoặc từng mức. Mỗi mức là một bộ riêng (`<bộ>--B1`), nên tiến độ và các cách luyện tách bạch theo mức.
 */
function LevelChooser({ slug, levels }: { slug: string; levels: string[] }) {
  const { L, en } = useL();
  useReadingFonts();
  const deck = getStaticDeck(slug);
  if (!deck) return null;
  const count = (lv: string) => (lv === 'all' ? deck.words.length : deck.words.filter((w) => levelOf(w) === lv).length);
  const options = [{ lv: 'all' }, ...levels.map((lv) => ({ lv }))];
  return (
    <Screen>
      <Appear>
        <Button
          className="mb-3 self-start"
          label={L('Tất cả bộ từ', 'All word sets')}
          variant="ghost"
          size="sm"
          iconLeft="chevron-left"
          onPress={() => router.push('/vocabulary/quiz' as never)}
        />
        <LevelHeader
          eyebrow={L('Bộ từ', 'Word set')}
          title={en && deck.name !== deck.nameVi ? deck.name : deck.nameVi}
          subtitle={L('Chọn cấp độ để học. Mỗi cấp có tiến độ riêng.', 'Pick a level to study. Each level keeps its own progress.')}
        />
        <Text className="mt-6 font-heavy text-sectionTitle text-ink">{L('Chọn cấp độ', 'Choose a level')}</Text>
        <View className="mt-3 flex-row flex-wrap" style={{ gap: 14 }}>
          {options.map((o) => (
            <LevelCard
              key={o.lv}
              lv={o.lv}
              en={en}
              title={o.lv === 'all' ? L('Tất cả', 'All levels') : o.lv}
              sub={L(`${count(o.lv)} từ`, `${count(o.lv)} words`)}
              onPress={() => router.push(`/vocabulary/topic/${slug}--${o.lv}` as never)}
            />
          ))}
        </View>
      </Appear>
    </Screen>
  );
}

export default function VocabTopicScreen() {
  const { slug } = useLocalSearchParams<{ slug?: string }>();
  const topic = useStudyDeck(typeof slug === 'string' ? slug : '');
  const { L, en } = useL();

  const entries = useVocabStore((s) => s.entries);
  const saveWord = useVocabStore((s) => s.saveWord);
  const [justSaved, setJustSaved] = useState(0);
  // Số từ đã hiện trong danh sách, tăng dần khi bấm "Hiện thêm".
  const [listLimit, setListLimit] = useState(30);
  const stages = useTopicStudyStore((s) => (typeof slug === 'string' ? s.stages[slug] : undefined));
  const starredList = useTopicStudyStore((s) => (typeof slug === 'string' ? s.starred[slug] : undefined));
  const toggleStar = useTopicStudyStore((s) => s.toggleStar);
  const setStage = useTopicStudyStore((s) => s.setStage);
  const addLapse = useTopicStudyStore((s) => s.addLapse);
  const lapseMap = useTopicStudyStore((s) => (typeof slug === 'string' ? s.lapses[slug] : undefined));
  const touch = useTopicStudyStore((s) => s.touch);
  const starredWords = useMemo(() => new Set(starredList ?? []), [starredList]);
  const lastAt = useTopicStudyStore((s) => (typeof slug === 'string' ? (s.lastAt?.[slug] ?? null) : null));

  const savedLemmas = useMemo(
    () => new Set(Object.values(entries).map((e) => e.lemma.toLowerCase())),
    [entries],
  );

  // Bộ có nhiều mức mà chưa chọn: hiện bước chọn cấp độ trước khi vào bài.
  if (typeof slug === 'string' && splitLevelSlug(slug).level === null) {
    const levels = deckLevels(slug);
    if (levels.length > 1) return <LevelChooser slug={slug} levels={levels} />;
  }

  if (!topic) {
    return (
      <Screen>
        <Card>
          <Text className="font-strong text-cardTitle text-ink">{L('Không có bộ từ này', 'Word set not found')}</Text>
          <Button
            className="mt-3 self-start"
            label={L('Về thư viện bộ từ', 'Back to word sets')}
            onPress={() => router.replace('/vocabulary/quiz' as never)}
          />
        </Card>
      </Screen>
    );
  }

  const save = (word: StudyWord) => {
    saveWord({
      word: word.word,
      lemma: lemmatize(word.word),
      phonetic: word.ipa,
      partOfSpeech: word.pos,
      definitionContext: word.collocation,
      definitionGeneral: word.definitionEn,
      definitionVi: word.meaningVi,
      exampleSentence: word.example,
      // Câu nguồn là chính câu ví dụ: FSRS và thẻ ôn đều cần một câu để đặt từ
      // vào ngữ cảnh, và ở đây ví dụ chính là ngữ cảnh duy nhất ta có.
      sourceSentence: word.example,
      articleId: null,
      articleTitle: L(`Chủ đề: ${topic.nameVi}`, `Topic: ${topic.name}`),
      paragraphIndex: null,
      isCollocation: false,
    });
  };

  const remaining = topic.words.filter((w) => !savedLemmas.has(w.word.toLowerCase()));

  const saveAll = () => {
    remaining.forEach(save);
    setJustSaved(remaining.length);
  };

  const groups = groupDeckWords(topic);
  const look = deckLook(topic.slug);
  const bg = look.accent[1];
  const progress = deckProgress(topic.words, stages, lastAt);
  const starredEntries = topic.words.filter((w) => starredWords.has(w.word));
  const status = groupByStatus(topic.words, stages, lapseMap);
  const pct = topic.words.length > 0 ? Math.round((progress.mastered / topic.words.length) * 100) : 0;

  return (
    <Screen>
      {/* Khung đọc hẹp lại trên màn rộng: thẻ cách luyện không bị kéo giãn ngang. */}
      <View className="w-full self-center" style={{ maxWidth: 1000 }}>
      <Appear>
        <Button
          className="mb-3 self-start"
          label={slug === NOTEBOOK_SLUG ? L('Quay lại', 'Back') : splitLevelSlug(slug ?? '').level !== null ? L('Đổi cấp độ', 'Change level') : L('Tất cả bộ từ', 'All word sets')}
          variant="ghost"
          size="sm"
          iconLeft="chevron-left"
          onPress={() => {
            if (slug === NOTEBOOK_SLUG || splitLevelSlug(slug ?? '').level !== null) {
              router.back();
            } else {
              router.push('/vocabulary/quiz' as never);
            }
          }}
        />
        {/* Đầu trang kiểu hero trang chủ: viền gradient, hoạ tiết pastel, tên bộ và vòng tiến độ. */}
        <HeroShell radius={26} style={{ padding: 22 }}>
          <View className="flex-row flex-wrap items-center gap-4">
            <View className="min-w-0 flex-1" style={{ minWidth: 220 }}>
              <Text className="font-strong text-label" style={{ color: 'rgba(27,17,64,0.75)', letterSpacing: 1.4 }}>
                {L('BỘ TỪ', 'WORD SET')}
              </Text>
              <Text className="mt-1 font-heavy text-pageTitle" style={{ color: '#1B1140' }}>
                {en && (topic.kind === 'topic' || topic.kind === 'notebook') ? topic.name : topic.nameVi}
              </Text>
              <Text className="font-sans text-body" style={{ color: 'rgba(27,17,64,0.85)' }}>
                {!en && topic.name !== topic.nameVi ? `${topic.name} · ` : ''}
                {L(`${topic.words.length} từ`, `${topic.words.length} words`)}
              </Text>
            </View>
            <View className="items-center justify-center rounded-full bg-white" style={{ width: 80, height: 80, boxShadow: '0 6px 16px rgba(27,17,64,0.12)' } as object}>
              <ProgressRing pct={pct} color={bg} size={62} />
            </View>
          </View>
        </HeroShell>
      </Appear>
      <DueToday slug={slug} />

      {/* ---------------------------------------------- mọi cách luyện của bộ */}
      <Appear index={1}>
        <View className="mt-5">
          <View className="flex-row items-center gap-2.5">
            <View aria-hidden>
              <SealIcon name="target" color="#6A4BD9" size={38} />
            </View>
            <Text className="font-heavy text-sectionTitle text-ink">{L('Cách luyện', 'Practice modes')}</Text>
          </View>
          <View className="mt-3">
            <Grid columns={4} tabletColumns={3} mobileColumns={2} gap={12}>
              {MODES.filter((m) => modeReady(m.key, topic.words)).map((m) => (
                <ToneTile
                  key={m.key}
                  seed={'mode-' + m.key}
                  tone={m.tone}
                  icon={m.icon}
                  title={en ? m.labelEn : m.label}
                  sub={en ? m.noteEn : m.note}
                  chip={m.recommended ? (en ? 'Suggested' : 'Gợi ý') : undefined}
                  minHeight={220}
                  onPress={() => router.push(`/vocabulary/topic/${topic.slug}/${m.route ?? m.key}` as never)}
                />
              ))}
            </Grid>
          </View>
        </View>
      </Appear>

      {/* ------------------------------------------ ba nhóm từ + ôn nhanh */}
      <Appear index={1}>
        <View className="mt-4">
          <Grid columns={3} tabletColumns={3} mobileColumns={3} gap={10}>
            {STATUS_TILES.map((t) => {
              const count = status[t.key].length;
              return (
                <ToneTile
                  key={t.key}
                  seed={'status-' + t.key}
                  tone={t.tone}
                  icon={t.icon}
                  title={en ? t.labelEn : t.label}
                  value={count}
                  minHeight={150}
                  disabled={count === 0 && t.key !== 'mastered'}
                  onPress={() => router.push(`/vocabulary/topic/${topic.slug}/quiz?only=${t.only}` as never)}
                />
              );
            })}
          </Grid>
        </View>
      </Appear>

      {/* ------------------------------------------------ thẻ ghi nhớ */}
      <Appear index={2}>
        <View className="mt-6 w-full self-center" style={{ maxWidth: 720 }}>
          {topic.words.length > 0 ? (
            <Flashcards
              words={topic.words}
              savedWords={savedLemmas}
              onSave={save}
              starredWords={starredWords}
              onStar={(w) => typeof slug === 'string' && toggleStar(slug, w.word)}
              accent={bg}
              tone={look.accent}
              onRate={(w, stage) => {
                if (typeof slug !== 'string') return;
                setStage(slug, w.word, stage);
                if (stage === 0) addLapse(slug, w.word);
                // Tự chấm thẻ ghi nhớ cũng vào lịch ôn: Quên = sai, Mơ hồ / Nhớ rồi = đúng.
                useTopicStudyStore.getState().review(slug, w.word, stage !== 0);
                touch(slug);
              }}
            />
          ) : (
            <Card className="items-center py-10">
              <View aria-hidden>
                <Motion kind="float">
                  <Sticker tilt={-6}>
                    <CuteBook size={72} />
                  </Sticker>
                </Motion>
              </View>
              <Text className="mt-4 font-strong text-cardTitle text-ink">
                {slug === NOTEBOOK_SLUG ? L('Chưa có từ nào trong sổ từ', 'Your notebook has no words yet') : L('Bộ từ đang trống', 'This word set is empty')}
              </Text>
              <Text className="mt-1.5 max-w-md text-center font-sans text-body text-muted">
                {slug === NOTEBOOK_SLUG
                  ? L(
                      'Hãy học các từ trong bộ từ IELTS hoặc lưu từ mới khi đọc báo để hệ thống FSRS tự động xếp lịch ôn tập ngắt quãng.',
                      'Learn words from the IELTS word sets or save new words while reading, and FSRS will schedule spaced reviews for you.',
                    )
                  : L('Chưa có từ nào trong bộ này.', 'There are no words in this set yet.')}
              </Text>
              {slug === NOTEBOOK_SLUG ? (
                <Button
                  className="mt-4"
                  label={L('Khám phá 50 bộ từ IELTS', 'Explore 50 IELTS word sets')}
                  iconRight="arrow-right"
                  onPress={() => router.push('/vocabulary/quiz' as never)}
                />
              ) : null}
            </Card>
          )}
        </View>
      </Appear>

      {starredEntries.length > 0 ? (
        <Appear index={3}>
          <View className="mt-6">
            <View className="flex-row flex-wrap items-center justify-between gap-2">
              <View className="min-w-0 flex-1">
                <SectionHeader title={L('Từ gắn sao', 'Starred words')} icon="star" iconTone="warning" />
              </View>
              <Button
                label={L(`Học riêng ${starredEntries.length} từ này`, `Study just these ${starredEntries.length} words`)}
                size="sm"
                iconLeft="star"
                onPress={() => router.push(`/vocabulary/topic/${topic.slug}/learn?only=starred` as never)}
              />
            </View>
            <View className="mt-3 flex-row flex-wrap gap-2">
              {starredEntries.map((w) => (
                <View key={w.word} className="flex-row items-center gap-2 rounded-pill bg-white py-1.5 pl-3 pr-1.5" style={{ borderWidth: 1, borderColor: '#FDE68A' }}>
                  <Text className="font-strong text-body text-ink">{w.word}</Text>
                  <Text className="font-sans text-label text-muted" numberOfLines={1} style={{ maxWidth: 180 }}>
                    {w.meaningVi}
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={L(`Bỏ sao ${w.word}`, `Unstar ${w.word}`)}
                    onPress={() => typeof slug === 'string' && toggleStar(slug, w.word)}
                    className="h-7 w-7 items-center justify-center rounded-pill"
                    style={{ backgroundColor: '#F3F0FB' }}
                  >
                    <Icon name="star-fill" size={14} color="#6A4BD9" />
                  </Pressable>
                </View>
              ))}
            </View>
          </View>
        </Appear>
      ) : null}

      {justSaved > 0 ? (
        <View className="mt-3 flex-row items-start gap-2 rounded-card bg-success-soft p-3">
          <Icon name="check" size={16} color={color.success} />
          <Text className="flex-1 font-sans text-body text-ink">
            {L(`Đã thêm ${justSaved} từ vào sổ.`, `Added ${justSaved} words to your notebook.`)}
          </Text>
        </View>
      ) : null}

      {remaining.length > 0 ? (
        <Appear index={1}>
          <Button
            className="mt-3 self-start"
            label={L(`Thêm cả ${remaining.length} từ chưa lưu vào sổ`, `Add all ${remaining.length} unsaved words to notebook`)}
            iconRight="plus"
            onPress={saveAll}
          />
        </Appear>
      ) : (
        <View className="mt-3 flex-row items-center gap-2">
          <View aria-hidden>
            <Motion kind="wobble">
              <Sticker tilt={-8}>
                <CuteTrophy size={36} />
              </Sticker>
            </Motion>
          </View>
          <Text className="font-strong text-body text-ink">
            {L('Đã lưu hết cả bộ này vào sổ từ.', 'This whole set is saved in your notebook.')}
          </Text>
        </View>
      )}

      {/* Danh sách từ hiện từng đợt: cả bộ 170 từ dựng cùng lúc làm trang nặng và giật khi cuộn. */}
      {(() => {
        let budget = listLimit;
        const total = groups.reduce((sum, g) => sum + g.words.length, 0);
        return (
          <>
            {groups.map((group, gi) => {
              const take = Math.max(0, Math.min(group.words.length, budget));
              budget -= take;
              if (take === 0) return null;
              return (
                <Appear key={group.label} index={gi + 2}>
                  <View className="mt-5">
                    <View className="flex-row items-center gap-2">
                      <View aria-hidden>
                        <BadgeSticker icon={GROUP_BADGE[gi % GROUP_BADGE.length]!} color={GROUP_TONE[gi % GROUP_TONE.length]!} size={28} />
                      </View>
                      <Text className="font-heavy text-sectionTitle text-ink">{en ? (GROUP_LABEL_EN[group.label] ?? group.label) : group.label}</Text>
                      <Text className="font-sans text-label text-muted">{L(`${group.words.length} từ`, `${group.words.length} words`)}</Text>
                    </View>

                    <View className="mt-2 gap-2">
                      {group.words.slice(0, take).map((word) => (
                        <WordRow
                          key={word.word}
                          word={word}
                          saved={savedLemmas.has(word.word.toLowerCase())}
                          onSave={() => save(word)}
                        />
                      ))}
                    </View>
                  </View>
                </Appear>
              );
            })}

            {total > listLimit ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => setListLimit((n) => n + 30)}
                className="mt-4 items-center rounded-pill bg-white py-3"
                style={{ borderWidth: 1, borderColor: '#EAE4F8' }}
              >
                <Text className="font-strong text-body text-ink">
                  {L(`Hiện thêm ${Math.min(30, total - listLimit)} từ (còn ${total - listLimit})`, `Show ${Math.min(30, total - listLimit)} more (${total - listLimit} left)`)}
                </Text>
              </Pressable>
            ) : null}
          </>
        );
      })()}

      <View className="h-6" />
      </View>
    </Screen>
  );
}

function WordRow({
  word,
  saved,
  onSave,
}: {
  word: StudyWord;
  saved: boolean;
  onSave: () => void;
}) {
  const [open, setOpen] = useState(false);
  const { L } = useL();
  const hasDetails = Boolean(word.example || word.collocation || word.context);

  return (
    <Card>
      <View className="flex-row flex-wrap items-start justify-between gap-2">
        <View className="min-w-0 flex-1" style={{ minWidth: 200 }}>
          <View className="flex-row flex-wrap items-baseline gap-2">
            <Text className="font-semi text-cardTitle text-ink">{word.word}</Text>
            <Text className="font-sans text-label text-subtle">{word.ipa}</Text>
            {word.pos ? <Badge label={word.pos} tone="neutral" shape="tag" /> : null}
            {(word as { more?: boolean }).more ? <Badge label={L('Mở rộng', 'Extra')} tone="primary" shape="tag" /> : null}
          </View>
          <Text className="mt-0.5 font-sans text-body text-ink">{word.meaningVi}</Text>
        </View>

        <View className="flex-row items-center gap-2">
          {hasDetails ? (
            <Button
              label={open ? L('Thu gọn', 'Collapse') : L('Ví dụ', 'Example')}
              variant="ghost"
              size="sm"
              onPress={() => setOpen((v) => !v)}
            />
          ) : null}
          {saved ? (
            <View className="flex-row items-center gap-1 rounded-pill bg-success-soft px-2.5 py-1.5">
              <Icon name="check" size={13} color={color.success} />
              <Text className="font-strong text-label" style={{ color: color.success }}>
                {L('Đã lưu', 'Saved')}
              </Text>
            </View>
          ) : (
            <Button label={L('Lưu', 'Save')} size="sm" iconRight="plus" onPress={onSave} />
          )}
        </View>
      </View>

      {open && hasDetails ? (
        <View className="mt-3 gap-2 border-t border-border pt-3">
          {word.example ? (
            <View>
              <Text className="font-mid text-label text-muted">{L('Ví dụ', 'Example')}</Text>
              <View className="mt-0.5">
                <ExampleSentence example={word.example} word={word.word} />
              </View>
            </View>
          ) : null}
          {word.collocation ? <Detail label={L('Cụm hay đi kèm', 'Common collocation')} value={word.collocation} /> : null}
          {word.context ? <Detail label={L('Ngữ cảnh dùng', 'Where to use it')} value={word.context} /> : null}
        </View>
      ) : null}
    </Card>
  );
}

function Detail({ label, value, italic }: { label: string; value: string; italic?: boolean }) {
  return (
    <View>
      <Text className="font-mid text-label text-muted">{label}</Text>
      <Text
        className="mt-0.5 font-sans text-body text-ink"
        style={italic ? { fontStyle: 'italic' } : undefined}
      >
        {value}
      </Text>
    </View>
  );
}

/**
 * Sáu cách học cùng một bộ từ. "Học" đứng đầu và được đề xuất: nó dẫn qua cả
 * nhận ra lẫn nhớ lại; các chế độ còn lại luyện một mặt riêng.
 */
const MODES: { key: string; route?: string; label: string; labelEn: string; note: string; noteEn: string; icon: IconName; tone: string; recommended?: boolean }[] = [
  { key: 'learn', label: 'Học xen kẽ', labelEn: 'Mixed learning', note: 'Lật thẻ · chọn nghĩa ABCD · gõ từ, từ sai quay lại', noteEn: 'Flashcards · ABCD meanings · typing; missed words come back', icon: 'book', tone: themedHex('#8B6CF0'), recommended: true },
  { key: 'dictation', label: 'Nghe chép', labelEn: 'Dictation', note: 'Nghe từ, viết đúng chính tả', noteEn: 'Hear the word, spell it right', icon: 'volume', tone: '#6A4BD9' },
  { key: 'cloze', label: 'Điền vào câu', labelEn: 'Fill the gap', note: 'Chọn, xếp chữ, gõ, nghe — xen kẽ', noteEn: 'Pick, unscramble, type, listen — mixed', icon: 'pencil', tone: '#E0533D' },
  { key: 'speak', label: 'Phát âm', labelEn: 'Pronunciation', note: 'Đọc to, máy nghe và chấm', noteEn: 'Read aloud, the app listens and scores', icon: 'mic', tone: '#DB2777' },
  { key: 'test', label: 'Kiểm tra', labelEn: 'Test', note: '20 câu trộn 4 dạng, chấm khi nộp', noteEn: '20 mixed questions, marked on submit', icon: 'clipboard', tone: '#6A4BD9' },
  { key: 'game', label: 'Bóng bay', labelEn: 'Balloons', note: 'Trò chơi, có bảng điểm', noteEn: 'A game with a leaderboard', icon: 'sparkle', tone: '#16A34A' },
  { key: 'pairs', label: 'Ghép cặp', labelEn: 'Match pairs', note: 'Ghép từ với nghĩa, nhớ vị trí các ô', noteEn: 'Match each word to its meaning and remember where tiles are', icon: 'grid', tone: '#2563EB' },
  { key: 'hangman', label: 'Đoán chữ', labelEn: 'Hangman', note: 'Đoán từ theo nghĩa, mỗi chữ sai mất một tim', noteEn: 'Guess the word from its meaning; each wrong letter costs a heart', icon: 'letters', tone: '#7C3AED' },
  { key: 'sentence', label: 'Xếp câu', labelEn: 'Build sentence', note: 'Xếp lại các từ thành câu ví dụ đúng thứ tự', noteEn: 'Rebuild the example sentence in the right order', icon: 'list', tone: '#0891B2' },
  { key: 'quiz', label: 'Trắc nghiệm ABCD', labelEn: 'ABCD quiz', note: 'Đề THPT: điền từ, gần nghĩa, trái nghĩa · chọn 10 đến 50 câu', noteEn: 'THPT style: fill the gap, closest and opposite meaning · 10 to 50 questions', icon: 'clipboard', tone: '#E0533D', recommended: true },
  { key: 'advert', route: 'quiz?mode=advert', label: 'Quảng cáo', labelEn: 'Advertisement', note: 'Điền từ vào đoạn quảng cáo, chọn ABCD như đề thi', noteEn: 'Fill the word into an advertisement, ABCD like the exam', icon: 'sparkle', tone: '#EA580C' },
  { key: 'flyer', route: 'quiz?mode=flyer', label: 'Tờ rơi', labelEn: 'Flyer', note: 'Điền từ vào tờ rơi thông báo, chọn ABCD như đề thi', noteEn: 'Fill the word into a flyer notice, ABCD like the exam', icon: 'mail', tone: '#0369A1' },
];

/** Chế độ cần dữ liệu riêng thì chỉ hiện khi bộ có đủ dữ liệu đó. */
function modeReady(key: string, words: readonly StudyWord[]): boolean {
  if (key === 'cloze' || key === 'quiz' || key === 'advert' || key === 'flyer') return words.some((word) => Boolean(word.example));
  if (key === 'hangman') return words.some((word) => isLetterWord(word.word));
  if (key === 'sentence') return words.some((word) => (word.example ?? '').trim().split(/\s+/).filter(Boolean).length >= 4);
  return true;
}

const STATUS_TILES: { key: DeckStatus; label: string; labelEn: string; only: string; icon: IconName; tone: string; soft: string }[] = [
  { key: 'mastered', label: 'Đã nhớ', labelEn: 'Remembered', only: 'all', icon: 'check', tone: '#16A34A', soft: '#DCFCE7' },
  { key: 'new', label: 'Chưa nhớ', labelEn: 'Not yet', only: 'new', icon: 'info', tone: '#D97706', soft: '#F3F0FB' },
  { key: 'review', label: 'Cần ôn tập', labelEn: 'Needs review', only: 'review', icon: 'refresh', tone: '#6A4BD9', soft: '#F3F0FB' },
];


