import React, { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { pronounce } from '@/services/audio/pronounce';

import { Grid } from '@/components/layout/Grid';
import { HeroStat, LightHero } from '@/components/layout/LightHero';
import { VOCAB_TOPIC_TOTALS } from '@/data/vocab-topics';
import { Screen } from '@/components/layout/Screen';
import { Badge, Button, Card, Icon, IconButton, ProgressBar, SectionHeader, StatCard } from '@/components/ui';
import { useStudyStore } from '@/store/useStudyStore';
import { useDueCards, useVocabStore, type CardKind, type VocabEntry } from '@/store/useVocabStore';
import { color, wordStatusColor } from '@/theme/tokens';
import type { WordStatusKind } from '@/types/database';
import { CrossFade } from '@/components/motion/Motion';
import { SpacedRepetitionWidget } from '@/components/vocab/SpacedRepetitionWidget';
import { bi, useL, type Bi } from '@/i18n/useL';

const CARD_KIND_LABEL: Record<CardKind, Bi> = {
  word_to_meaning: { vi: 'Từ → nghĩa', en: 'Word → meaning' },
  meaning_to_word: { vi: 'Nghĩa → từ', en: 'Meaning → word' },
  cloze: { vi: 'Điền vào câu gốc', en: 'Fill in the original sentence' },
  multiple_choice: { vi: 'Trắc nghiệm 4 đáp án', en: 'Multiple choice (4 options)' },
};

const STATUS_LABEL: Record<WordStatusKind, Bi> = {
  new: { vi: 'Mới', en: 'New' },
  learning: { vi: 'Đang học', en: 'Learning' },
  familiar: { vi: 'Quen mặt', en: 'Familiar' },
  known: { vi: 'Đã thuộc', en: 'Known' },
  ignored: { vi: 'Bỏ qua', en: 'Ignored' },
};

const WORDS_PER_PAGE = 40;

export default function VocabularyScreen() {
  const [tab, setTab] = useState<'list' | 'review'>('list');
  // Sổ vài trăm từ: chỉ dựng từng đợt, không dựng một lượt cả danh sách (mỗi dòng là một cây view khá nặng).
  const [shown, setShown] = useState(WORDS_PER_PAGE);
  const { L, locale } = useL();

  const entries = useVocabStore((s) => s.entries);
  const dueCards = useDueCards();
  const wordStatus = useVocabStore((s) => s.wordStatus);

  const words = useMemo(
    () => Object.values(entries).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [entries],
  );

  const statusCounts = useMemo(() => {
    const counts: Record<WordStatusKind, number> = {
      new: 0,
      learning: 0,
      familiar: 0,
      known: 0,
      ignored: 0,
    };
    for (const word of words) {
      const status = wordStatus[word.lemma]?.status ?? 'new';
      counts[status] += 1;
    }
    return counts;
  }, [words, wordStatus]);

  const avgMastery =
    words.length === 0
      ? 0
      : Math.round(words.reduce((sum, w) => sum + w.masteryPercent, 0) / words.length);

  return (
    <Screen>
      <LightHero
        scene="vocab"
        badge="VOCABULARY PRACTICE"
        line1="Vocabulary"
        line2={L('gặp lại đúng lúc sắp quên', 'see it again right before you forget')}
        subtitle={L(
          'Mỗi từ lưu kèm nguyên câu gặp nó. Ôn theo FSRS nên bạn chỉ gặp lại đúng lúc sắp quên.',
          'Every word is saved with the sentence you found it in. FSRS reviews bring it back right before you’d forget it.',
        )}
        footer={
          <>
            <HeroStat value={String(words.length)} label={L('tổng số từ', 'total words')} />
            <HeroStat value={String(dueCards.length)} label={L('đến hạn ôn', 'due for review')} />
            <HeroStat value={words.length === 0 ? '—' : `${avgMastery}%`} label={L('mastery trung bình', 'avg. mastery')} />
          </>
        }
      >
        <View className="flex-row gap-2">
          <Button
            label={L('Danh sách', 'List')}
            variant={tab === 'list' ? 'primary' : 'outline'}
            onPress={() => setTab('list')}
          />
          <Button
            label={dueCards.length > 0 ? L(`Ôn ngay (${dueCards.length})`, `Review now (${dueCards.length})`) : L('Ôn tập', 'Review')}
            variant="outline"
            iconLeft="refresh"
            disabled={words.length === 0}
            onPress={() => router.push('/vocabulary/topic/so-tu' as never)}
          />
          <Button
            label={L('Destination · Phiếu 50 câu', 'Destination · 50-question sheet')}
            variant="outline"
            iconLeft="book"
            onPress={() => router.push('/vocabulary/review' as never)}
          />
        </View>
      </LightHero>

      <View className="mt-4">
        <Grid columns={4} tabletColumns={2} mobileColumns={1}>
          <StatCard label={L('Tổng số từ', 'Total words')} value={String(words.length)} icon="letters" tone="primary" />
          <StatCard
            label={L('Đến hạn ôn', 'Due for review')}
            value={String(dueCards.length)}
            icon="clock"
            tone="warning"
            caption={L('Tính theo lịch FSRS', 'Based on the FSRS schedule')}
          />
          <StatCard
            label={L('Đã thuộc', 'Known')}
            value={String(statusCounts.known)}
            icon="check"
            tone="success"
            caption={L(`${statusCounts.familiar} từ quen mặt`, `${statusCounts.familiar} familiar`)}
          />
          <StatCard
            label={L('Mastery trung bình', 'Average mastery')}
            // Sổ trống thì không có gì để lấy trung bình — "0%" đọc như đã đo mà kém.
            value={words.length === 0 ? '—' : `${avgMastery}`}
            unit={words.length === 0 ? undefined : '%'}
            icon="target"
            tone="accent"
            caption={words.length === 0 ? L('Chưa có từ nào trong sổ', 'No words in your notebook yet') : undefined}
            progress={words.length === 0 ? undefined : { value: avgMastery, tone: 'accent' }}
          />
        </Grid>

        <View className="mt-4">
          <SpacedRepetitionWidget />
        </View>
      </View>

      {/* Đổi tab Danh sách / Ôn ngay: nội dung mờ dần sang, không nhảy cụt. */}
      <CrossFade swapKey={tab}>
      {tab === 'list' ? <PracticeStrip entries={words} /> : null}

      {tab === 'review' ? (
        <ReviewSession />
      ) : (
        <Card className="mt-4">
          <SectionHeader
            title={L('Sổ từ', 'Word notebook')}
            subtitle={L(`${words.length} từ · sắp theo thời gian lưu`, `${words.length} words · sorted by date saved`)}
            icon="book"
          />

          <View className="mt-4 gap-3">
            {words.slice(0, shown).map((word) => (
              <View key={word.id} className="cv-auto">
                <WordRow entry={word} status={wordStatus[word.lemma]?.status ?? 'new'} />
              </View>
            ))}
            {words.length > shown ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => setShown((n) => n + WORDS_PER_PAGE)}
                className="items-center justify-center rounded-panel border border-borderStrong bg-surface"
                style={{ minHeight: 48 }}
              >
                <Text className="font-semi text-body text-primary-700">
                  {L(`Hiện thêm ${Math.min(WORDS_PER_PAGE, words.length - shown)} từ`, `Show ${Math.min(WORDS_PER_PAGE, words.length - shown)} more`)}
                  {' · '}
                  {words.length - shown}
                  {L(' còn lại', ' left')}
                </Text>
              </Pressable>
            ) : null}

            {words.length === 0 ? (
              /*
                Trạng thái rỗng phải CHO MỘT ĐƯỜNG ĐI, không chỉ giải thích vì
                sao nó rỗng. Bản trước bảo người dùng đi mở Library rồi chạm vào
                từng từ — đúng, nhưng đó là việc của ngày thứ ba, không phải của
                phút đầu tiên. Bộ từ theo chủ đề lấp đúng khoảng đó.
              */
              <View className="items-center rounded-panel bg-surfaceAlt px-4 py-8">
                <Icon name="letters" size={32} color={color.subtle} />
                <Text className="mt-3 text-center font-sans text-body text-muted">
                  {L('Sổ từ đang trống — và không cần trống lâu.', 'Your notebook is empty — but it doesn’t have to stay that way.')}
                </Text>
                <Text className="mt-1 max-w-[420px] text-center font-sans text-label text-subtle">
                  {VOCAB_TOPIC_TOTALS.topics > 0
                    ? L(
                        `Lấy sẵn một bộ ${VOCAB_TOPIC_TOTALS.words.toLocaleString('vi-VN')} từ IELTS chia theo ${VOCAB_TOPIC_TOTALS.topics} chủ đề, hoặc mở một bài trong Library rồi chạm vào từ bất kỳ.`,
                        `Grab a ready-made set of ${VOCAB_TOPIC_TOTALS.words.toLocaleString(locale === 'en' ? 'en-US' : 'vi-VN')} IELTS words across ${VOCAB_TOPIC_TOTALS.topics} topics, or open a passage in the Library and tap any word.`,
                      )
                    : L(
                        'Mở một bài trong Library, chạm vào từ bất kỳ rồi bấm “Lưu vào sổ từ”.',
                        'Open a passage in the Library, tap any word and hit “Save to notebook”.',
                      )}
                </Text>
                <View className="mt-4 flex-row flex-wrap justify-center gap-2">
                  {/* Nút chỉ hiện khi kho chủ đề thật sự có bộ nào. Mời người
                      dùng vào một trang trống là lời hứa hỏng ngay tại chỗ. */}
                  {VOCAB_TOPIC_TOTALS.topics > 0 ? (
                    <Button
                      label={L('Chọn bộ từ theo chủ đề', 'Choose a topic word set')}
                      iconRight="arrow-right"
                      onPress={() => router.push('/vocabulary/topics' as never)}
                    />
                  ) : null}
                  <Button
                    label={L('Mở kho bài đọc', 'Open the reading library')}
                    variant="outline"
                    onPress={() => router.push('/library' as never)}
                  />
                </View>
              </View>
            ) : null}
          </View>
        </Card>
      )}
      </CrossFade>
    </Screen>
  );
}

/**
 * Lối vào luyện sổ từ, đặt NGAY TRÊN danh sách từ: ba kiểu của Quiz từ vựng chạy
 * thẳng trên chính sổ từ của người học (bộ `so-tu`). Sổ dưới 4 từ thì chưa đủ
 * làm phương án nhiễu cho trắc nghiệm — nói rõ thay vì mở ra màn trống.
 */
const NOTEBOOK_MODES: { id: string; label: Bi; icon: React.ComponentProps<typeof Icon>['name'] }[] = [
  { id: 'learn', label: { vi: 'Học xen kẽ', en: 'Mixed learning' }, icon: 'book' },
  { id: 'test', label: { vi: 'Kiểm tra', en: 'Test' }, icon: 'clipboard' },
  { id: 'cloze', label: { vi: 'Điền vào câu', en: 'Fill the gap' }, icon: 'pencil' },
];

function PracticeStrip({ entries }: { entries: VocabEntry[] }) {
  const { L, locale } = useL();
  if (entries.length === 0) return null;
  const enough = entries.length >= 4;

  return (
    <Card className="mt-4">
      <SectionHeader
        title={L('Luyện sổ từ', 'Practise your notebook')}
        subtitle={
          enough
            ? L('Ba kiểu quiz chạy trên chính những từ bạn đã lưu', 'Three quiz types using the words you’ve saved')
            : L(`Lưu thêm ${4 - entries.length} từ nữa là luyện được`, `Save ${4 - entries.length} more words to start practising`)
        }
        icon="target"
        action={{
          label: L('Quiz từ vựng', 'Vocabulary quiz'),
          onPress: () => router.push('/vocabulary/quiz' as never),
        }}
      />
      <View className="mt-3 flex-row flex-wrap gap-2">
        {NOTEBOOK_MODES.map((mode) => (
          <Pressable
            key={mode.id}
            accessibilityRole="button"
            aria-disabled={!enough}
            disabled={!enough}
            onPress={() => router.push(`/vocabulary/topic/so-tu/${mode.id}` as never)}
            className={`flex-row items-center gap-2 rounded-pill border px-3 py-2 ${
              enough ? 'border-primary-200 bg-primary-50' : 'border-border bg-surfaceAlt'
            }`}
          >
            <Icon name={mode.icon} size={15} color={enough ? color.primary : color.subtle} />
            <Text className={enough ? 'font-strong text-label text-ink' : 'font-mid text-label text-subtle'}>{bi(mode.label, locale)}</Text>
          </Pressable>
        ))}
      </View>
    </Card>
  );
}

function WordRow({ entry, status }: { entry: VocabEntry; status: WordStatusKind }) {
  const setWordStatus = useVocabStore((s) => s.setWordStatus);
  const removeWord = useVocabStore((s) => s.removeWord);
  const [open, setOpen] = useState(false);
  const { L, locale } = useL();

  return (
    <View className="rounded-panel border border-border p-3">
      <View className="flex-row items-center gap-2">
        <View
          className="rounded-md px-2 py-1"
          style={{ backgroundColor: wordStatusColor[status].fill }}
        >
          <Text className="font-semi text-label" style={{ color: wordStatusColor[status].ink }}>
            {bi(STATUS_LABEL[status], locale)}
          </Text>
        </View>

        <Text className="font-strong text-cardTitle text-ink">{entry.word}</Text>

        {entry.phonetic ? (
          <Text className="font-mid text-label text-muted">{entry.phonetic}</Text>
        ) : null}

        <IconButton
          name="volume"
          accessibilityLabel={L('Phát âm', 'Pronounce')}
          onPress={() => void pronounce(entry.word)}
        />

        <View className="flex-1" />

        <Badge label={`${entry.masteryPercent}%`} tone="accent" />
        <IconButton
          name={open ? 'chevron-down' : 'chevron-right'}
          accessibilityLabel={L('Chi tiết', 'Details')}
          onPress={() => setOpen((v) => !v)}
        />
      </View>

      <Text className="mt-2 font-sans text-body text-body">
        {entry.definitionContext ?? entry.definitionVi ?? entry.definitionGeneral ?? '—'}
      </Text>

      <ProgressBar value={entry.masteryPercent} tone="accent" className="mt-2" />

      {open ? (
        <View className="mt-3 gap-2 border-t border-border pt-3">
          <Field label={L('Câu gốc trong bài', 'Original sentence')} value={`“${entry.sourceSentence}”`} />
          {entry.definitionGeneral ? (
            <Field label={L('Nghĩa tổng quát', 'General meaning')} value={entry.definitionGeneral} />
          ) : null}
          {entry.definitionVi ? <Field label={L('Tiếng Việt', 'Vietnamese')} value={entry.definitionVi} /> : null}
          {entry.exampleSentence ? <Field label={L('Ví dụ', 'Example')} value={entry.exampleSentence} /> : null}
          {entry.articleTitle ? <Field label={L('Gặp trong bài', 'Found in')} value={entry.articleTitle} /> : null}

          <View className="mt-1 flex-row flex-wrap gap-2">
            {(['learning', 'familiar', 'known', 'ignored'] as WordStatusKind[]).map((s) => (
              <Pressable
                key={s}
                onPress={() => setWordStatus(entry.lemma, s)}
                className={[
                  'rounded-pill px-3 py-1.5',
                  status === s ? 'bg-primary-600' : 'bg-surfaceAlt',
                ].join(' ')}
              >
                <Text
                  className={[
                    'font-semi text-label',
                    status === s ? 'text-white' : 'text-muted',
                  ].join(' ')}
                >
                  {bi(STATUS_LABEL[s], locale)}
                </Text>
              </Pressable>
            ))}

            <View className="flex-1" />

            <Button
              label={L('Xoá từ', 'Delete word')}
              variant="ghost"
              size="sm"
              onPress={() => removeWord(entry.id)}
            />
          </View>
        </View>
      ) : null}
    </View>
  );
}

/** Phiên ôn FSRS với 4 nút Again / Hard / Good / Easy và 4 kiểu thẻ xen kẽ. */
function ReviewSession() {
  const dueCards = useVocabStore((s) => s.dueCards());
  const gradeCard = useVocabStore((s) => s.gradeCard);
  const entries = useVocabStore((s) => s.entries);
  const logWordsReviewed = useStudyStore((s) => s.logWordsReviewed);
  const logStudyTime = useStudyStore((s) => s.logStudyTime);

  const [revealed, setRevealed] = useState(false);
  const [done, setDone] = useState(0);
  const { L, locale } = useL();

  const current = dueCards[0];

  if (!current) {
    return (
      <Card className="mt-4 items-center py-10">
        <Icon name="check" size={32} color={color.success} />
        <Text className="mt-3 font-strong text-cardTitle text-ink">
          {L('Hết thẻ đến hạn.', 'No more cards due.')}{' '}
          {done > 0 ? L(`Bạn vừa ôn ${done} thẻ.`, `You just reviewed ${done} ${done === 1 ? 'card' : 'cards'}.`) : ''}
        </Text>
        <Text className="mt-1 font-sans text-body text-muted">
          {L('FSRS sẽ hẹn bạn quay lại đúng lúc sắp quên.', 'FSRS will bring you back right before you forget.')}
        </Text>
      </Card>
    );
  }

  const { entry, kind } = current;

  const choices =
    kind === 'multiple_choice'
      ? buildChoices(entry, Object.values(entries))
      : [];

  const grade = (rating: 1 | 2 | 3 | 4) => {
    gradeCard(entry.id, kind, rating);
    logWordsReviewed(1);
    logStudyTime('review', 1);
    setRevealed(false);
    setDone((d) => d + 1);
  };

  return (
    <Card className="mt-4">
      <View className="flex-row items-center justify-between">
        <Badge label={bi(CARD_KIND_LABEL[kind], locale)} tone="accent" />
        <Text className="font-mid text-label text-muted">{L(`Còn ${dueCards.length} thẻ`, `${dueCards.length} left`)}</Text>
      </View>

      <View className="mt-6 items-center">
        {kind === 'word_to_meaning' ? (
          <Text className="font-heavy text-pageTitle text-ink">{entry.word}</Text>
        ) : null}

        {kind === 'meaning_to_word' ? (
          <Text className="text-center font-semi text-sectionTitle text-ink">
            {entry.definitionVi ?? entry.definitionContext ?? entry.definitionGeneral ?? '—'}
          </Text>
        ) : null}

        {kind === 'cloze' ? (
          <Text className="text-center font-sans text-bodyLg text-body">
            {entry.sourceSentence.replace(new RegExp(entry.word, 'i'), '________')}
          </Text>
        ) : null}

        {kind === 'multiple_choice' ? (
          <>
            <Text className="text-center font-semi text-sectionTitle text-ink">
              {entry.definitionVi ?? entry.definitionGeneral ?? entry.word}
            </Text>
            <View className="mt-4 w-full gap-2">
              {choices.map((choice) => (
                <Pressable
                  key={choice}
                  onPress={() => setRevealed(true)}
                  className="rounded-panel border border-border px-3 py-3"
                >
                  <Text className="font-mid text-body text-body">{choice}</Text>
                </Pressable>
              ))}
            </View>
          </>
        ) : null}
      </View>

      {revealed ? (
        <View className="mt-6 gap-2 rounded-panel bg-surfaceAlt p-4">
          <Text className="font-strong text-cardTitle text-ink">{entry.word}</Text>
          <Text className="font-sans text-body text-body">
            {entry.definitionContext ?? entry.definitionGeneral ?? '—'}
          </Text>
          {entry.definitionVi ? (
            <Text className="font-sans text-body text-accent-700">{entry.definitionVi}</Text>
          ) : null}
          <Text className="font-sans text-label text-subtle">“{entry.sourceSentence}”</Text>
        </View>
      ) : (
        <Button
          label={L('Hiện đáp án', 'Show answer')}
          variant="outline"
          fullWidth
          className="mt-6"
          onPress={() => setRevealed(true)}
        />
      )}

      {revealed ? (
        <View className="mt-4 flex-row flex-wrap gap-2">
          <GradeButton label="Again" tone="danger" onPress={() => grade(1)} />
          <GradeButton label="Hard" tone="warning" onPress={() => grade(2)} />
          <GradeButton label="Good" tone="primary" onPress={() => grade(3)} />
          <GradeButton label="Easy" tone="success" onPress={() => grade(4)} />
        </View>
      ) : null}
    </Card>
  );
}

function GradeButton({
  label,
  tone,
  onPress,
}: {
  label: string;
  tone: 'danger' | 'warning' | 'primary' | 'success';
  onPress: () => void;
}) {
  const bg =
    tone === 'danger'
      ? 'bg-danger'
      : tone === 'warning'
        ? 'bg-warning'
        : tone === 'success'
          ? 'bg-success'
          : 'bg-primary-600';

  return (
    <Pressable onPress={onPress} className={`h-11 flex-1 items-center justify-center rounded-panel ${bg}`}>
      <Text className="font-semi text-body text-white">{label}</Text>
    </Pressable>
  );
}

function buildChoices(entry: VocabEntry, all: VocabEntry[]): string[] {
  const others = all
    .filter((e) => e.id !== entry.id)
    .slice(0, 3)
    .map((e) => e.word);

  return [entry.word, ...others].sort();
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <View>
      <Text className="font-mid text-label text-muted">{label}</Text>
      <Text className="mt-0.5 font-sans text-body text-body">{value}</Text>
    </View>
  );
}
