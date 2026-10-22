import { TileArt } from '@/components/ui/TileArt';
import React, { useMemo, useState } from 'react';
import { Pressable, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { pronounce } from '@/services/audio/pronounce';

import { Grid } from '@/components/layout/Grid';
import { VOCAB_TOPIC_TOTALS } from '@/data/vocab-topics';
import { Screen } from '@/components/layout/Screen';
import { Badge, Button, Card, Icon, IconButton, ProgressBar, SectionHeader, StatCard } from '@/components/ui';
import { useStudyStore } from '@/store/useStudyStore';
import { useDueCards, useVocabStore, type CardKind, type VocabEntry } from '@/store/useVocabStore';
import { useVocabCoverStore } from '@/store/useVocabCoverStore';
import { color, wordStatusColor } from '@/theme/tokens';
import type { WordStatusKind } from '@/types/database';
import { CrossFade } from '@/components/motion/Motion';
import { CuteBook, CuteGlobe } from '@/components/illust/Cute';
import { CuteBulb, CuteNotebook } from '@/components/illust/CuteMore';
import { useDisplayName } from '@/store/useAuthStore';
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
  const { width } = useWindowDimensions();
  const narrow = width < 768;
  const coverOnPhone = useVocabCoverStore((s) => s.coverOnPhone);
  const setCoverOnPhone = useVocabCoverStore((s) => s.setCoverOnPhone);
  // Trên máy hẹp bìa chỉ hiện khi người học bật; máy rộng luôn hiện như cũ.
  const showCover = !narrow || coverOnPhone;

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

  const [query, setQuery] = useState('');
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? words.filter((w) => w.word.toLowerCase().includes(q) || (w.definitionVi ?? '').toLowerCase().includes(q)) : words;
  }, [words, query]);
  const name = useDisplayName().trim();

  const avgMastery =
    words.length === 0
      ? 0
      : Math.round(words.reduce((sum, w) => sum + w.masteryPercent, 0) / words.length);

  return (
    <Screen>
      {/* Đầu trang kiểu ứng dụng học: lời chào, ô tìm và bốn thẻ lối vào, cùng một bảng màu pastel. */}
      <View style={{ gap: 4, marginTop: 4 }}>
        <Text className="font-heavy text-pageTitle text-ink">{L(`Chào ${name || 'bạn'}!`, `Hi, ${name || 'there'}!`)}</Text>
        <Text className="font-sans text-body text-muted">{L('Mỗi từ là một lần gặp lại đúng lúc.', 'Each word comes back right on time.')}</Text>
      </View>

      <View className="mt-4 flex-row items-center gap-3 rounded-pill border border-border bg-surface px-4" style={{ height: 50 }}>
        <Icon name="search" size={18} color={color.subtle} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={L('Tìm từ hoặc nghĩa', 'Search a word or meaning')}
          placeholderTextColor={color.subtle}
          className="flex-1 font-sans text-body text-ink outline-none"
        />
      </View>

      {narrow ? (
        <Pressable
          accessibilityRole="switch"
          accessibilityLabel={L('Bìa đầu trang', 'Header cover')}
          accessibilityState={{ checked: coverOnPhone }}
          onPress={() => setCoverOnPhone(!coverOnPhone)}
          style={({ pressed }: { pressed: boolean }) => ({
            marginTop: 16,
            minHeight: 44,
            alignSelf: 'flex-start',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            paddingHorizontal: 16,
            borderRadius: 999,
            borderWidth: 1,
            borderColor: '#EAE4F8',
            backgroundColor: '#FFFFFF',
            opacity: pressed ? 0.92 : 1,
          })}
        >
          <Text className="font-strong text-label text-ink">{coverOnPhone ? L('Ẩn bìa', 'Hide cover') : L('Hiện bìa', 'Show cover')}</Text>
          <Icon name={coverOnPhone ? 'chevron-up' : 'chevron-down'} size={16} color={color.subtle} />
        </Pressable>
      ) : null}

      {showCover ? (
        <View className="mt-5 flex-row flex-wrap justify-between" style={{ rowGap: 12 }}>
          <VocabCategory
            title={L('Ôn ngay', 'Review now')}
            sub={dueCards.length > 0 ? L(`${dueCards.length} thẻ đến hạn`, `${dueCards.length} cards due`) : L('Chưa có thẻ đến hạn', 'Nothing due yet')}
            colors={['#FFE3EC', '#FFC4D8']}
            art={<CuteBulb size={40} />}
            disabled={words.length === 0}
            onPress={() => router.push('/vocabulary/topic/so-tu' as never)}
          />
          <VocabCategory
            title={L('Sổ từ', 'Word book')}
            sub={L(`${words.length} từ đã lưu`, `${words.length} saved words`)}
            colors={['#EEE9FF', '#D9CCFF']}
            art={<CuteBook size={40} />}
            onPress={() => setTab('list')}
          />
          <VocabCategory
            title={L('Trắc nghiệm THPT', 'THPT quiz')}
            sub={L('35 câu mỗi bài', '35 questions per set')}
            colors={['#E6F7EF', '#BFEBD3']}
            art={<CuteNotebook size={40} />}
            onPress={() => router.push('/vocabulary/thpt' as never)}
          />
          <VocabCategory
            title={L('Theo đề IELTS · SAT', 'IELTS · SAT tests')}
            sub={L('Từ trong đề thật', 'Words from real tests')}
            colors={['#FFEFE6', '#FFD6BF']}
            art={<CuteGlobe size={40} />}
            onPress={() => router.push('/vocabulary/from-tests' as never)}
          />
        </View>
      ) : null}

      <View className="mt-4">
        <Grid columns={4} tabletColumns={2} mobileColumns={2}>
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
            {filtered.slice(0, shown).map((word) => (
              <View key={word.id} className="cv-auto">
                <WordRow entry={word} status={wordStatus[word.lemma]?.status ?? 'new'} />
              </View>
            ))}
            {filtered.length > shown ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => setShown((n) => n + WORDS_PER_PAGE)}
                className="items-center justify-center rounded-panel border border-borderStrong bg-surface"
                style={{ minHeight: 48 }}
              >
                <Text className="font-semi text-body text-primary-700">
                  {L(`Hiện thêm ${Math.min(WORDS_PER_PAGE, filtered.length - shown)} từ`, `Show ${Math.min(WORDS_PER_PAGE, filtered.length - shown)} more`)}
                  {' · '}
                  {filtered.length - shown}
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
 * Dải luyện sổ từ, đặt NGAY TRÊN danh sách từ: nút mở Quiz từ vựng chạy trên chính
 * sổ từ của người học. Sổ dưới 4 từ thì chưa đủ làm phương án nhiễu cho trắc
 * nghiệm — nói rõ thay vì mở ra màn trống.
 */
/** Thẻ lối vào: nền pastel, icon trong ô trắng, tên và dòng phụ. Hai cột trên điện thoại. */
function VocabCategory({ title, sub, colors, art, onPress, disabled = false }: { title: string; sub: string; colors: [string, string]; art: React.ReactNode; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }: { pressed: boolean }) => ({ width: '48%', minHeight: 150, borderRadius: 24, overflow: 'hidden', opacity: disabled ? 0.5 : pressed ? 0.92 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] })}
    >
      <View style={{ flex: 1, padding: 16, justifyContent: 'space-between', overflow: 'hidden' }}>
        <TileArt seed={'vocab-' + title} tone={colors} height={200} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, height: '100%', borderRadius: 0 }} />
        <View style={{ width: 56, height: 56, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.88)', alignItems: 'center', justifyContent: 'center' }}>{art}</View>
        <View style={{ gap: 2 }}>
          <Text className="font-heavy text-cardTitle text-ink">{title}</Text>
          <Text className="font-sans text-label text-body">{sub}</Text>
        </View>
      </View>
    </Pressable>
  );
}

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
            ? L('Quiz chạy trên chính những từ bạn đã lưu', 'Quizzes running on the words you’ve saved')
            : L(`Lưu thêm ${4 - entries.length} từ nữa là luyện được`, `Save ${4 - entries.length} more words to start practising`)
        }
        icon="target"
        action={{
          label: L('Quiz từ vựng', 'Vocabulary quiz'),
          onPress: () => router.push('/vocabulary/quiz' as never),
        }}
      />
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
          <Field
            label={entry.articleTitle?.startsWith('Từ vựng theo đề ·') ? L('Ví dụ tự tạo', 'Original example') : L('Câu gốc trong bài', 'Original sentence')}
            value={`“${entry.sourceSentence}”`}
          />
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
