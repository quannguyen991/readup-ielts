import React, { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import * as Speech from 'expo-speech';
import { englishVoice } from '@/services/audio/voice';

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

const CARD_KIND_LABEL: Record<CardKind, string> = {
  word_to_meaning: 'Từ → nghĩa',
  meaning_to_word: 'Nghĩa → từ',
  cloze: 'Điền vào câu gốc',
  multiple_choice: 'Trắc nghiệm 4 đáp án',
};

const STATUS_LABEL: Record<WordStatusKind, string> = {
  new: 'Mới',
  learning: 'Đang học',
  familiar: 'Quen mặt',
  known: 'Đã thuộc',
  ignored: 'Bỏ qua',
};

export default function VocabularyScreen() {
  const [tab, setTab] = useState<'list' | 'review'>('list');

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
        line2="gặp lại đúng lúc sắp quên"
        subtitle="Mỗi từ lưu kèm nguyên câu gặp nó. Ôn theo FSRS nên bạn chỉ gặp lại đúng lúc sắp quên."
        footer={
          <>
            <HeroStat value={String(words.length)} label="tổng số từ" />
            <HeroStat value={String(dueCards.length)} label="đến hạn ôn" />
            <HeroStat value={words.length === 0 ? '—' : `${avgMastery}%`} label="mastery trung bình" />
          </>
        }
      >
        <View className="flex-row gap-2">
          <Button
            label="Danh sách"
            variant={tab === 'list' ? 'primary' : 'outline'}
            onPress={() => setTab('list')}
          />
          <Button
            label={dueCards.length > 0 ? `Ôn ngay (${dueCards.length})` : 'Ôn tập'}
            variant="outline"
            iconLeft="refresh"
            disabled={words.length === 0}
            onPress={() => router.push('/vocabulary/topic/so-tu' as never)}
          />
        </View>
      </LightHero>

      <View className="mt-4">
        <Grid columns={4} tabletColumns={2} mobileColumns={1}>
          <StatCard label="Tổng số từ" value={String(words.length)} icon="letters" tone="primary" />
          <StatCard
            label="Đến hạn ôn"
            value={String(dueCards.length)}
            icon="clock"
            tone="warning"
            caption="Tính theo lịch FSRS"
          />
          <StatCard
            label="Đã thuộc"
            value={String(statusCounts.known)}
            icon="check"
            tone="success"
            caption={`${statusCounts.familiar} từ quen mặt`}
          />
          <StatCard
            label="Mastery trung bình"
            // Sổ trống thì không có gì để lấy trung bình — "0%" đọc như đã đo mà kém.
            value={words.length === 0 ? '—' : `${avgMastery}`}
            unit={words.length === 0 ? undefined : '%'}
            icon="target"
            tone="accent"
            caption={words.length === 0 ? 'Chưa có từ nào trong sổ' : undefined}
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
            title="Sổ từ"
            subtitle={`${words.length} từ · sắp theo thời gian lưu`}
            icon="book"
          />

          <View className="mt-4 gap-3">
            {words.map((word) => (
              <WordRow
                key={word.id}
                entry={word}
                status={wordStatus[word.lemma]?.status ?? 'new'}
              />
            ))}

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
                  Sổ từ đang trống — và không cần trống lâu.
                </Text>
                <Text className="mt-1 max-w-[420px] text-center font-sans text-label text-subtle">
                  {VOCAB_TOPIC_TOTALS.topics > 0
                    ? `Lấy sẵn một bộ ${VOCAB_TOPIC_TOTALS.words.toLocaleString('vi-VN')} từ IELTS chia theo ${VOCAB_TOPIC_TOTALS.topics} chủ đề, hoặc mở một bài trong Library rồi chạm vào từ bất kỳ.`
                    : 'Mở một bài trong Library, chạm vào từ bất kỳ rồi bấm “Lưu vào sổ từ”.'}
                </Text>
                <View className="mt-4 flex-row flex-wrap justify-center gap-2">
                  {/* Nút chỉ hiện khi kho chủ đề thật sự có bộ nào. Mời người
                      dùng vào một trang trống là lời hứa hỏng ngay tại chỗ. */}
                  {VOCAB_TOPIC_TOTALS.topics > 0 ? (
                    <Button
                      label="Chọn bộ từ theo chủ đề"
                      iconRight="arrow-right"
                      onPress={() => router.push('/vocabulary/topics' as never)}
                    />
                  ) : null}
                  <Button
                    label="Mở kho bài đọc"
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
const NOTEBOOK_MODES: { id: string; label: string; icon: React.ComponentProps<typeof Icon>['name'] }[] = [
  { id: 'learn', label: 'Học xen kẽ', icon: 'book' },
  { id: 'test', label: 'Kiểm tra', icon: 'clipboard' },
  { id: 'cloze', label: 'Điền vào câu', icon: 'pencil' },
];

function PracticeStrip({ entries }: { entries: VocabEntry[] }) {
  if (entries.length === 0) return null;
  const enough = entries.length >= 4;

  return (
    <Card className="mt-4">
      <SectionHeader
        title="Luyện sổ từ"
        subtitle={enough ? 'Ba kiểu quiz chạy trên chính những từ bạn đã lưu' : `Lưu thêm ${4 - entries.length} từ nữa là luyện được`}
        icon="target"
        action={{
          label: 'Quiz từ vựng',
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
            <Text className={enough ? 'font-strong text-label text-ink' : 'font-mid text-label text-subtle'}>{mode.label}</Text>
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

  return (
    <View className="rounded-panel border border-border p-3">
      <View className="flex-row items-center gap-2">
        <View
          className="rounded-md px-2 py-1"
          style={{ backgroundColor: wordStatusColor[status].fill }}
        >
          <Text className="font-semi text-label" style={{ color: wordStatusColor[status].ink }}>
            {STATUS_LABEL[status]}
          </Text>
        </View>

        <Text className="font-strong text-cardTitle text-ink">{entry.word}</Text>

        {entry.phonetic ? (
          <Text className="font-mid text-label text-muted">{entry.phonetic}</Text>
        ) : null}

        <IconButton
          name="volume"
          accessibilityLabel="Phát âm"
          onPress={() => Speech.speak(entry.word, { language: 'en-US', rate: 0.9, voice: englishVoice() })}
        />

        <View className="flex-1" />

        <Badge label={`${entry.masteryPercent}%`} tone="accent" />
        <IconButton
          name={open ? 'chevron-down' : 'chevron-right'}
          accessibilityLabel="Chi tiết"
          onPress={() => setOpen((v) => !v)}
        />
      </View>

      <Text className="mt-2 font-sans text-body text-body">
        {entry.definitionContext ?? entry.definitionVi ?? entry.definitionGeneral ?? '—'}
      </Text>

      <ProgressBar value={entry.masteryPercent} tone="accent" className="mt-2" />

      {open ? (
        <View className="mt-3 gap-2 border-t border-border pt-3">
          <Field label="Câu gốc trong bài" value={`“${entry.sourceSentence}”`} />
          {entry.definitionGeneral ? (
            <Field label="Nghĩa tổng quát" value={entry.definitionGeneral} />
          ) : null}
          {entry.definitionVi ? <Field label="Tiếng Việt" value={entry.definitionVi} /> : null}
          {entry.exampleSentence ? <Field label="Ví dụ" value={entry.exampleSentence} /> : null}
          {entry.articleTitle ? <Field label="Gặp trong bài" value={entry.articleTitle} /> : null}

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
                  {STATUS_LABEL[s]}
                </Text>
              </Pressable>
            ))}

            <View className="flex-1" />

            <Button
              label="Xoá từ"
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

  const current = dueCards[0];

  if (!current) {
    return (
      <Card className="mt-4 items-center py-10">
        <Icon name="check" size={32} color={color.success} />
        <Text className="mt-3 font-strong text-cardTitle text-ink">
          Hết thẻ đến hạn. {done > 0 ? `Bạn vừa ôn ${done} thẻ.` : ''}
        </Text>
        <Text className="mt-1 font-sans text-body text-muted">
          FSRS sẽ hẹn bạn quay lại đúng lúc sắp quên.
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
        <Badge label={CARD_KIND_LABEL[kind]} tone="accent" />
        <Text className="font-mid text-label text-muted">Còn {dueCards.length} thẻ</Text>
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
          label="Hiện đáp án"
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
