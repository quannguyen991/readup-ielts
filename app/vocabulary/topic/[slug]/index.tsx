import React, { useMemo, useState } from 'react';
import { DueToday } from '@/components/vocab/DueToday';
import { Pressable, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { Appear } from '@/components/motion/Motion';
import { Badge, Button, Card, Icon, SectionHeader } from '@/components/ui';
import { useStudyDeck } from '@/components/vocab/study/useStudyDeck';
import { ExampleSentence } from '@/components/vocab/ExampleSentence';
import { groupDeckWords, NOTEBOOK_SLUG } from '@/data/study-decks';
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
import { PageStickers, SealIcon } from '@/components/illust/HeroArt';
import { Label, Sticker } from '@/components/illust/Sticker';
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
const GROUP_TONE = ['#22A06B', '#A8843F', '#F0703F', '#E0533D'] as const;

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
export default function VocabTopicScreen() {
  const { slug } = useLocalSearchParams<{ slug?: string }>();
  const topic = useStudyDeck(typeof slug === 'string' ? slug : '');
  const { L, en } = useL();

  const entries = useVocabStore((s) => s.entries);
  const saveWord = useVocabStore((s) => s.saveWord);
  const [justSaved, setJustSaved] = useState(0);
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
      <Appear>
        <Button
          className="mb-3 self-start"
          label={slug === NOTEBOOK_SLUG ? L('Quay lại', 'Back') : L('Tất cả bộ từ', 'All word sets')}
          variant="ghost"
          size="sm"
          iconLeft="chevron-left"
          onPress={() => {
            if (slug === NOTEBOOK_SLUG) {
              router.back();
            } else {
              router.push('/vocabulary/quiz' as never);
            }
          }}
        />
        {/* Cùng kiểu thẻ giấy có gáy màu như ở thư viện bộ từ. */}
        <View className="flex-row overflow-hidden rounded-[20px] bg-white" style={{ boxShadow: '0 4px 14px rgba(15,23,42,0.08)' } as object}>
          <View style={{ width: 8, backgroundColor: bg }} />
          <View className="flex-1 flex-row flex-wrap items-center gap-4 p-5">
            <View className="h-12 w-12 items-center justify-center rounded-2xl" style={{ backgroundColor: look.accent[0] }}>
              <Icon name={look.icon} size={22} color={bg} strokeWidth={2.1} />
            </View>
            <View className="min-w-0 flex-1" style={{ minWidth: 200 }}>
              <Text className="font-heavy text-pageTitle text-ink">{(en && (topic.kind === 'topic' || topic.kind === 'notebook') ? topic.name : topic.nameVi)}</Text>
              <Text className="font-sans text-body text-muted">
                {!en && topic.name !== topic.nameVi ? `${topic.name} · ` : ''}
                {L(`${topic.words.length} từ`, `${topic.words.length} words`)}
              </Text>
            </View>
            <View aria-hidden>
              <PageStickers scene="vocab" size={80} />
            </View>
            <ProgressRing pct={pct} color={bg} size={60} />
          </View>
        </View>
      </Appear>
      <DueToday slug={slug} />

      {/* ---------------------------------------------- mọi cách luyện của bộ */}
      <Appear index={1}>
        <View className="mt-5">
          <View className="flex-row items-center gap-2.5">
            <View aria-hidden>
              <SealIcon name="target" color="#A8843F" size={38} />
            </View>
            <Text className="font-heavy text-sectionTitle text-ink">{L('Cách luyện', 'Practice modes')}</Text>
          </View>
          <View className="mt-3">
            <Grid columns={7} tabletColumns={4} mobileColumns={2} gap={12}>
              {MODES.filter((m) => modeReady(m.key, topic.words)).map((m) => (
                <ModeTile key={m.key} mode={m} en={en} onPress={() => router.push(`/vocabulary/topic/${topic.slug}/${m.key}` as never)} />
              ))}
            </Grid>
          </View>
        </View>
      </Appear>

      {/* ------------------------------------------ ba nhóm từ + ôn nhanh */}
      <Appear index={1}>
        <View className="mt-4 flex-row flex-wrap gap-3">
          {STATUS_TILES.map((t) => (
            <StatusTile
              key={t.key}
              tile={t}
              en={en}
              count={status[t.key].length}
              onPress={() => router.push(`/vocabulary/topic/${topic.slug}/quiz?only=${t.only}` as never)}
            />
          ))}
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
                    style={{ backgroundColor: '#FEF3C7' }}
                  >
                    <Icon name="star-fill" size={14} color="#D97706" />
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

      {groups.map((group, gi) => (
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
              {group.words.map((word) => (
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
      ))}

      <View className="h-6" />
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
  const hasDetails = Boolean(word.example || word.collocation);

  return (
    <Card>
      <View className="flex-row flex-wrap items-start justify-between gap-2">
        <View className="min-w-0 flex-1" style={{ minWidth: 200 }}>
          <View className="flex-row flex-wrap items-baseline gap-2">
            <Text className="font-heavy text-cardTitle text-ink">{word.word}</Text>
            <Text className="font-sans text-label text-subtle">{word.ipa}</Text>
            {word.pos ? <Badge label={word.pos} tone="neutral" shape="tag" /> : null}
            {(word as { more?: boolean }).more ? <Badge label={L('Mở rộng', 'Extra')} tone="primary" shape="tag" /> : null}
          </View>
          <Text className="mt-0.5 font-strong text-body text-ink">{word.meaningVi}</Text>
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
const MODES: { key: string; label: string; labelEn: string; note: string; noteEn: string; icon: IconName; tone: string; recommended?: boolean }[] = [
  { key: 'learn', label: 'Học xen kẽ', labelEn: 'Mixed learning', note: 'Lật thẻ · chọn nghĩa ABCD · gõ từ, từ sai quay lại', noteEn: 'Flashcards · ABCD meanings · typing; missed words come back', icon: 'book', tone: '#B8955A', recommended: true },
  { key: 'dictation', label: 'Nghe chép', labelEn: 'Dictation', note: 'Nghe từ, viết đúng chính tả', noteEn: 'Hear the word, spell it right', icon: 'volume', tone: '#8E6A2C' },
  { key: 'cloze', label: 'Điền vào câu', labelEn: 'Fill the gap', note: 'Chọn, xếp chữ, gõ, nghe — xen kẽ', noteEn: 'Pick, unscramble, type, listen — mixed', icon: 'pencil', tone: '#E0533D' },
  { key: 'speak', label: 'Phát âm', labelEn: 'Pronunciation', note: 'Đọc to, máy nghe và chấm', noteEn: 'Read aloud, the app listens and scores', icon: 'mic', tone: '#DB2777' },
  { key: 'test', label: 'Kiểm tra', labelEn: 'Test', note: '20 câu trộn 4 dạng, chấm khi nộp', noteEn: '20 mixed questions, marked on submit', icon: 'clipboard', tone: '#D97706' },
  { key: 'game', label: 'Bóng bay', labelEn: 'Balloons', note: 'Trò chơi, có bảng điểm', noteEn: 'A game with a leaderboard', icon: 'sparkle', tone: '#16A34A' },
  { key: 'pairs', label: 'Ghép cặp', labelEn: 'Match pairs', note: 'Ghép từ với nghĩa, nhớ vị trí các ô', noteEn: 'Match each word to its meaning and remember where tiles are', icon: 'grid', tone: '#2563EB' },
  { key: 'hangman', label: 'Đoán chữ', labelEn: 'Hangman', note: 'Đoán từ theo nghĩa, mỗi chữ sai mất một tim', noteEn: 'Guess the word from its meaning; each wrong letter costs a heart', icon: 'letters', tone: '#7C3AED' },
  { key: 'sentence', label: 'Xếp câu', labelEn: 'Build sentence', note: 'Xếp lại các từ thành câu ví dụ đúng thứ tự', noteEn: 'Rebuild the example sentence in the right order', icon: 'list', tone: '#0891B2' },
];

/** Chế độ cần dữ liệu riêng thì chỉ hiện khi bộ có đủ dữ liệu đó. */
function modeReady(key: string, words: readonly StudyWord[]): boolean {
  if (key === 'cloze') return words.some((word) => Boolean(word.example));
  if (key === 'hangman') return words.some((word) => isLetterWord(word.word));
  if (key === 'sentence') return words.some((word) => (word.example ?? '').trim().split(/\s+/).filter(Boolean).length >= 4);
  return true;
}

const STATUS_TILES: { key: DeckStatus; label: string; labelEn: string; only: string; icon: IconName; tone: string; soft: string }[] = [
  { key: 'mastered', label: 'Đã nhớ', labelEn: 'Remembered', only: 'all', icon: 'check', tone: '#16A34A', soft: '#DCFCE7' },
  { key: 'new', label: 'Chưa nhớ', labelEn: 'Not yet', only: 'new', icon: 'info', tone: '#CFA966', soft: '#F9F2E6' },
  { key: 'review', label: 'Cần ôn tập', labelEn: 'Needs review', only: 'review', icon: 'refresh', tone: '#EA580C', soft: '#FFEDD5' },
];

/** Một nhóm từ: số từ + bấm là vào Quiz chỉ với nhóm đó (Đã nhớ thì ôn cả bộ). */
function StatusTile({ tile, count, en, onPress }: { tile: (typeof STATUS_TILES)[number]; count: number; en: boolean; onPress: () => void }) {
  const label = en ? tile.labelEn : tile.label;
  const empty = count === 0 && tile.key !== 'mastered';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        en
          ? `${label}: ${count} words. ${empty ? 'No words yet.' : 'Tap to review with a quiz.'}`
          : `${label}: ${count} từ. ${empty ? 'Chưa có từ nào.' : 'Bấm để ôn bằng Quiz.'}`
      }
      disabled={empty}
      onPress={onPress}
      className="min-w-[180px] flex-1 flex-row items-center gap-3 rounded-2xl bg-white px-4 py-3"
      style={{ opacity: empty ? 0.6 : 1, boxShadow: '0 3px 10px rgba(15,23,42,0.06)' } as object}
    >
      <View className="h-9 w-9 items-center justify-center rounded-full" style={{ backgroundColor: tile.soft }}>
        <Icon name={tile.icon} size={17} color={tile.tone} />
      </View>
      <Text className="flex-1 font-strong text-body text-ink">{label}</Text>
      <Text className="font-heavy text-sectionTitle" style={{ color: tile.tone }}>
        {count}
      </Text>
      {empty ? null : <Icon name="chevron-right" size={15} color="#94A3B8" />}
    </Pressable>
  );
}

function ModeTile({ mode, en, onPress }: { mode: (typeof MODES)[number]; en: boolean; onPress: () => void }) {
  const [hovered, setHovered] = useState(false);
  const label = en ? mode.labelEn : mode.label;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${en ? mode.noteEn : mode.note}`}
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      className="items-center rounded-2xl bg-white px-3 py-4"
      style={{ borderWidth: 1.5, borderColor: hovered ? mode.tone : 'transparent', boxShadow: '0 3px 10px rgba(15,23,42,0.06)' } as object}
    >
      <View className="h-11 w-11 items-center justify-center rounded-2xl" style={{ backgroundColor: `${mode.tone}1A` }}>
        <Icon name={mode.icon} size={20} color={mode.tone} />
      </View>
      <Text className="mt-2 text-center font-strong text-body text-ink">{label}</Text>
      {mode.recommended ? (
        <View aria-hidden style={{ position: 'absolute', top: -8, right: -4 }}>
          <Label text={en ? 'Suggested ⭐' : 'Gợi ý ⭐'} color="#F2B632" tilt={6} size={11} />
        </View>
      ) : null}
    </Pressable>
  );
}
