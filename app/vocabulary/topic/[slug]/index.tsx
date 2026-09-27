import React, { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { Appear } from '@/components/motion/Motion';
import { Badge, Button, Card, Icon, SectionHeader } from '@/components/ui';
import { useStudyDeck } from '@/components/vocab/study/useStudyDeck';
import { groupDeckWords } from '@/data/study-decks';
import type { StudyWord } from '@/services/vocab/topic-study';
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
          <Text className="font-strong text-cardTitle text-ink">Không có bộ từ này</Text>
          <Button
            className="mt-3 self-start"
            label="Về thư viện bộ từ"
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
      articleTitle: `Chủ đề: ${topic.nameVi}`,
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
          label="Tất cả bộ từ"
          variant="ghost"
          size="sm"
          iconLeft="chevron-left"
          onPress={() => router.push('/vocabulary/quiz' as never)}
        />
        {/* Cùng kiểu thẻ giấy có gáy màu như ở thư viện bộ từ. */}
        <View className="flex-row overflow-hidden rounded-[20px] bg-white" style={{ boxShadow: '0 4px 14px rgba(15,23,42,0.08)' } as object}>
          <View style={{ width: 8, backgroundColor: bg }} />
          <View className="flex-1 flex-row flex-wrap items-center gap-4 p-5">
            <View className="h-12 w-12 items-center justify-center rounded-2xl" style={{ backgroundColor: look.accent[0] }}>
              <Icon name={look.icon} size={22} color={bg} strokeWidth={2.1} />
            </View>
            <View className="min-w-0 flex-1" style={{ minWidth: 200 }}>
              <Text className="font-heavy text-pageTitle text-ink">{topic.nameVi}</Text>
              <Text className="font-sans text-body text-muted">
                {topic.name !== topic.nameVi ? `${topic.name} · ` : ''}
                {topic.words.length} từ
              </Text>
            </View>
            <ProgressRing pct={pct} color={bg} size={60} />
          </View>
        </View>
      </Appear>

      {/* ---------------------------------------------- mọi cách luyện của bộ */}
      <Appear index={1}>
        <View className="mt-5">
          <Text className="font-heavy text-sectionTitle text-ink">Cách luyện</Text>
          <View className="mt-3">
            <Grid columns={7} tabletColumns={4} mobileColumns={2} gap={12}>
              {MODES.map((m) => (
                <ModeTile key={m.key} mode={m} onPress={() => router.push(`/vocabulary/topic/${topic.slug}/${m.key}` as never)} />
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
              count={status[t.key].length}
              onPress={() => router.push(`/vocabulary/topic/${topic.slug}/quiz?only=${t.only}` as never)}
            />
          ))}
        </View>
      </Appear>

      {/* ------------------------------------------------ thẻ ghi nhớ */}
      <Appear index={2}>
        <View className="mt-6 w-full self-center" style={{ maxWidth: 720 }}>
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
              touch(slug);
            }}
          />
        </View>
      </Appear>

      {starredEntries.length > 0 ? (
        <Appear index={3}>
          <View className="mt-6">
            <View className="flex-row flex-wrap items-center justify-between gap-2">
              <View className="min-w-0 flex-1">
                <SectionHeader title="Từ gắn sao" icon="star" iconTone="warning" />
              </View>
              <Button
                label={`Học riêng ${starredEntries.length} từ này`}
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
                    accessibilityLabel={`Bỏ sao ${w.word}`}
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
            Đã thêm {justSaved} từ vào sổ.
          </Text>
        </View>
      ) : null}

      {remaining.length > 0 ? (
        <Appear index={1}>
          <Button
            className="mt-3 self-start"
            label={`Thêm cả ${remaining.length} từ chưa lưu vào sổ`}
            iconRight="plus"
            onPress={saveAll}
          />
        </Appear>
      ) : (
        <View className="mt-3 flex-row items-center gap-2">
          <Icon name="trophy" size={16} color={color.success} />
          <Text className="font-strong text-body text-ink">
            Đã lưu hết cả bộ này vào sổ từ.
          </Text>
        </View>
      )}

      {groups.map((group, gi) => (
        <Appear key={group.label} index={gi + 2}>
          <View className="mt-5">
            <View className="flex-row items-center gap-2">
              <Text className="font-heavy text-sectionTitle text-ink">{group.label}</Text>
              <Text className="font-sans text-label text-muted">{group.words.length} từ</Text>
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

  return (
    <Card>
      <View className="flex-row flex-wrap items-start justify-between gap-2">
        <View className="min-w-0 flex-1" style={{ minWidth: 200 }}>
          <View className="flex-row flex-wrap items-baseline gap-2">
            <Text className="font-heavy text-cardTitle text-ink">{word.word}</Text>
            <Text className="font-sans text-label text-subtle">{word.ipa}</Text>
            {word.pos ? <Badge label={word.pos} tone="neutral" shape="tag" /> : null}
          </View>
          <Text className="mt-0.5 font-strong text-body text-ink">{word.meaningVi}</Text>
        </View>

        <View className="flex-row items-center gap-2">
          <Button
            label={open ? 'Thu gọn' : 'Ví dụ'}
            variant="ghost"
            size="sm"
            onPress={() => setOpen((v) => !v)}
          />
          {saved ? (
            <View className="flex-row items-center gap-1 rounded-pill bg-success-soft px-2.5 py-1.5">
              <Icon name="check" size={13} color={color.success} />
              <Text className="font-strong text-label" style={{ color: color.success }}>
                Đã lưu
              </Text>
            </View>
          ) : (
            <Button label="Lưu" size="sm" iconRight="plus" onPress={onSave} />
          )}
        </View>
      </View>

      {open ? (
        <View className="mt-3 gap-2 border-t border-border pt-3">
          <Detail label="Ví dụ" value={word.example} italic />
          <Detail label="Cụm hay đi kèm" value={word.collocation} />
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
const MODES: { key: string; label: string; note: string; icon: IconName; tone: string; recommended?: boolean }[] = [
  { key: 'learn', label: 'Học xen kẽ', note: 'Lật thẻ · trắc nghiệm · gõ từ, từ sai quay lại', icon: 'book', tone: '#5B8BEE', recommended: true },
  { key: 'quiz', label: 'Quiz ôn tập', note: 'Trắc nghiệm A/B/C/D kiểu đề THPT', icon: 'target', tone: '#EA580C' },
  { key: 'dictation', label: 'Nghe chép', note: 'Nghe từ, viết đúng chính tả', icon: 'volume', tone: '#0891B2' },
  { key: 'cloze', label: 'Điền vào câu', note: 'Chọn, xếp chữ, gõ, nghe — xen kẽ', icon: 'pencil', tone: '#7C3AED' },
  { key: 'speak', label: 'Phát âm', note: 'Đọc to, máy nghe và chấm', icon: 'mic', tone: '#DB2777' },
  { key: 'test', label: 'Kiểm tra', note: '20 câu trộn 4 dạng, chấm khi nộp', icon: 'clipboard', tone: '#D97706' },
  { key: 'game', label: 'Bóng bay', note: 'Trò chơi, có bảng điểm', icon: 'sparkle', tone: '#16A34A' },
];

const STATUS_TILES: { key: DeckStatus; label: string; only: string; icon: IconName; tone: string; soft: string }[] = [
  { key: 'mastered', label: 'Đã nhớ', only: 'all', icon: 'check', tone: '#16A34A', soft: '#DCFCE7' },
  { key: 'new', label: 'Chưa nhớ', only: 'new', icon: 'info', tone: '#4F7FE6', soft: '#E0EAFF' },
  { key: 'review', label: 'Cần ôn tập', only: 'review', icon: 'refresh', tone: '#EA580C', soft: '#FFEDD5' },
];

/** Một nhóm từ: số từ + bấm là vào Quiz chỉ với nhóm đó (Đã nhớ thì ôn cả bộ). */
function StatusTile({ tile, count, onPress }: { tile: (typeof STATUS_TILES)[number]; count: number; onPress: () => void }) {
  const empty = count === 0 && tile.key !== 'mastered';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${tile.label}: ${count} từ. ${empty ? 'Chưa có từ nào.' : 'Bấm để ôn bằng Quiz.'}`}
      disabled={empty}
      onPress={onPress}
      className="min-w-[180px] flex-1 flex-row items-center gap-3 rounded-2xl bg-white px-4 py-3"
      style={{ opacity: empty ? 0.6 : 1, boxShadow: '0 3px 10px rgba(15,23,42,0.06)' } as object}
    >
      <View className="h-9 w-9 items-center justify-center rounded-full" style={{ backgroundColor: tile.soft }}>
        <Icon name={tile.icon} size={17} color={tile.tone} />
      </View>
      <Text className="flex-1 font-strong text-body text-ink">{tile.label}</Text>
      <Text className="font-heavy text-sectionTitle" style={{ color: tile.tone }}>
        {count}
      </Text>
      {empty ? null : <Icon name="chevron-right" size={15} color="#94A3B8" />}
    </Pressable>
  );
}

function ModeTile({ mode, onPress }: { mode: (typeof MODES)[number]; onPress: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${mode.label}: ${mode.note}`}
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      className="items-center rounded-2xl bg-white px-3 py-4"
      style={{ borderWidth: 1.5, borderColor: hovered ? mode.tone : 'transparent', boxShadow: '0 3px 10px rgba(15,23,42,0.06)' } as object}
    >
      <View className="h-11 w-11 items-center justify-center rounded-2xl" style={{ backgroundColor: `${mode.tone}1A` }}>
        <Icon name={mode.icon} size={20} color={mode.tone} />
      </View>
      <Text className="mt-2 text-center font-strong text-body text-ink">{mode.label}</Text>
    </Pressable>
  );
}
