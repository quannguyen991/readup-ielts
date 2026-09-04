import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { TaskShell } from '@/components/layout/TaskShell';
import { Button, Icon, PaperCard } from '@/components/ui';
import {
  SENTENCE_DIFFICULTY_LABEL,
  TRANSLATION_SENTENCES,
  type TranslationItem,
} from '@/data/sentence-drills';
import { SENTENCE_ENRICHMENT } from '@/data/sentence-enrichment';
import { getTranslationSet } from '@/data/translation-sets';
import { TranslationLibrary } from '@/components/sentence/TranslationLibrary';
import { hashString, mulberry32, shuffle } from '@/services/questions/rng';
import { buildReveal } from '@/services/sentence/word-reveal';
import { useSentenceStore, type TranslationAttempt } from '@/store/useSentenceStore';
import { useStudyStore } from '@/store/useStudyStore';
import { color, paper } from '@/theme/tokens';

/**
 * Luyện dịch Việt → Anh bằng cách TÁI TẠO ĐÚNG CÂU MẪU.
 *
 * Câu mẫu hiện sẵn nhưng bị che: mỗi từ chỉ lộ chữ cái đầu cộng số dấu sao đúng
 * bằng số chữ còn lại. Gõ đúng từ nào thì ô đó lật ra. Sai một từ là dừng ngay
 * tại đó — chỗ dừng chính là chỗ cần nghĩ.
 *
 * Bản trước ở đây là "dịch tự do rồi tự chấm": gõ gì cũng được, bấm xem đáp án,
 * rồi tự bấm "Đúng ý" / "Cần xem lại". Cách ấy tôn trọng chuyện một câu tiếng
 * Việt có nhiều bản dịch đúng, nhưng đổi lại thì không có gì buộc người học
 * phải nhớ chính xác cấu trúc, và tự chấm thì lúc mệt ai cũng bấm "Đúng ý".
 *
 * Bản này đổi mục tiêu chứ không chỉ đổi cách chấm: đây là bài rèn PHẢN XẠ với
 * một mẫu câu cụ thể cho tới khi thuộc tay. Đáp án duy nhất là điều kiện của
 * loại bài đó, không phải hạn chế của nó. Chính vì vậy phần "cách diễn đạt
 * khác" vẫn còn nguyên và hiện ra ngay khi gõ xong — để không ai hiểu nhầm
 * rằng câu mẫu là bản dịch duy nhất đúng trên đời.
 */

const SESSION_LENGTH = 10;

type Phase = 'setup' | 'running' | 'summary';

export default function TranslateScreen() {
  /*
    Hai đường vào, giống hệt màn Chép chính tả:
      /sentence/translate                  — thư viện bài, chọn bài rồi vào
      /sentence/translate?set=tset-health  — luyện thẳng một bài theo chủ đề
  */
  const { set: setParam } = useLocalSearchParams<{ set?: string }>();
  const chosenSet = typeof setParam === 'string' ? getTranslationSet(setParam) : undefined;

  const [phase, setPhase] = useState<Phase>(chosenSet ? 'running' : 'setup');
  const [items, setItems] = useState<TranslationItem[]>(() => chosenSet?.items ?? []);
  const [index, setIndex] = useState(0);
  const [attempts, setAttempts] = useState<TranslationAttempt[]>([]);

  const addSession = useSentenceStore((s) => s.addSession);
  const logStudyTime = useStudyStore((s) => s.logStudyTime);
  const logQuestions = useStudyStore((s) => s.logQuestions);

  /*
    Mốc thời gian đặt trong effect, không gọi `Date.now()` lúc render: bản render
    bị bỏ rồi render lại sẽ cho hai mốc khác nhau.
  */
  const sessionStartedAt = useRef(0);
  useEffect(() => {
    sessionStartedAt.current = Date.now();
  }, []);

  const start = () => {
    // Nút bốc ngẫu nhiên lấy từ toàn bộ kho: người bấm nó muốn ôn rải, không
    // muốn trả lời thêm một câu hỏi lọc nào nữa.
    const pool = TRANSLATION_SENTENCES;
    const rng = mulberry32(hashString(String(Date.now())));
    const picked = shuffle(pool, rng).slice(0, Math.min(SESSION_LENGTH, pool.length));
    setItems(picked);
    setIndex(0);
    setAttempts([]);
    sessionStartedAt.current = Date.now();
    setPhase('running');
  };

  const finishItem = (attempt: TranslationAttempt) => {
    const next = [...attempts, attempt];
    setAttempts(next);
    if (index + 1 < items.length) {
      setIndex(index + 1);
      return;
    }
    const durationMs = Date.now() - sessionStartedAt.current;
    addSession({
      mode: 'translation',
      attempts: next,
      total: items.length,
      durationMs,
      ...(chosenSet ? { setId: chosenSet.id } : {}),
    });
    logStudyTime('practice', Math.max(1, Math.round(durationMs / 60_000)));
    logQuestions(items.length);
    setPhase('summary');
  };

  if (phase === 'setup') {
    return <LibraryView onRandom={start} />;
  }

  if (phase === 'summary') {
    return <SummaryView attempts={attempts} items={items} onRestart={() => setPhase('setup')} />;
  }

  return (
    <RunningView
      key={items[index]?.id ?? index}
      item={items[index]!}
      index={index}
      total={items.length}
      onSubmit={finishItem}
    />
  );
}

// ------------------------------------------------------------------ chọn bài

/**
 * Vào màn Dịch câu là thấy ngay danh sách bài theo chủ đề.
 *
 * Cùng lý do như màn Chép chính tả: "dễ / trung bình / khó" không phải câu hỏi
 * trả lời được lúc chưa thấy bài nào, còn chủ đề thì có. Ai muốn ôn rải vẫn
 * bốc ngẫu nhiên được bằng nút trên đầu.
 */
function LibraryView({ onRandom }: { onRandom: () => void }) {
  return (
    <TaskShell
      backHref="/sentence"
      backLabel="Quay lại Luyện câu"
      title="Dịch câu"
      subtitle="Vietnamese → English"
      icon="languages"
      tone="paper"
      right={
        <Button
          variant="brandOutline"
          size="sm"
          label="Bốc ngẫu nhiên 10 câu"
          iconLeft="refresh"
          onPress={onRandom}
        />
      }
    >
      <TranslationLibrary />
    </TaskShell>
  );
}

// -------------------------------------------------------------------- luyện

function RunningView({
  item,
  index,
  total,
  onSubmit,
}: {
  item: TranslationItem;
  index: number;
  total: number;
  onSubmit: (attempt: TranslationAttempt) => void;
}) {
  const [typed, setTyped] = useState('');
  const [showHint, setShowHint] = useState(false);
  const enrichment = SENTENCE_ENRICHMENT[item.id];

  const reveal = useMemo(() => buildReveal(item.en, typed), [item.en, typed]);

  const enteredAt = useRef(0);
  useEffect(() => {
    enteredAt.current = Date.now();
  }, [item.id]);

  const goNext = () => {
    onSubmit({
      itemId: item.id,
      topic: item.topic,
      typed,
      // "Đúng" ở đây nghĩa là tự tái tạo được câu mẫu mà KHÔNG mở gợi ý. Ai đã
      // mở gợi ý thì vẫn đi tiếp được, chỉ là câu đó không tính là làm được.
      selfCorrect: !showHint,
      timeSpentMs: Date.now() - enteredAt.current,
    });
  };

  const percent = reveal.total > 0 ? (reveal.solvedCount / reveal.total) * 100 : 0;

  return (
    <TaskShell
      backHref="/sentence"
      backLabel="Quay lại Luyện câu"
      title="Dịch câu"
      subtitle="Vietnamese → English"
      icon="languages"
      right={
        <View className="rounded-pill bg-white/20 px-3.5 py-1.5">
          <Text className="font-strong text-label text-white">
            Câu {index + 1}/{total}
          </Text>
        </View>
      }
    >
      <View className="gap-4 lg:flex-row">
        {/* ---------------------------------------------------------- đề bài */}
        <View className="lg:w-[46%]">
          <PaperCard>
            <View className="flex-row items-center justify-between">
              <Text className="font-heavy text-cardTitle text-paper-ink">Đề bài</Text>
              <View className="rounded-pill bg-brand-soft px-2.5 py-1">
                <Text className="font-semi text-paper-body" style={{ fontSize: 10 }}>
                  {SENTENCE_DIFFICULTY_LABEL[item.difficulty]}
                </Text>
              </View>
            </View>

            <Text className="mt-4 font-semi uppercase tracking-wide text-paper-muted" style={{ fontSize: 10 }}>
              Tiếng Việt
            </Text>
            <Text className="mt-1.5 font-strong text-sectionTitle text-paper-ink">{item.vi}</Text>

            <View className="mt-5 h-px bg-brand-soft" />

            <Text className="mt-4 font-semi uppercase tracking-wide text-paper-muted" style={{ fontSize: 10 }}>
              Câu mẫu — gõ đúng để mở từ
            </Text>
            <View className="mt-2.5 flex-row flex-wrap gap-1.5">
              {reveal.tokens.map((token, i) => (
                <WordChip
                  key={`${item.id}-${i}`}
                  token={token}
                  warn={token.status === 'active' && reveal.mismatch}
                />
              ))}
            </View>

            <Pressable
              accessibilityRole="button"
              onPress={() => setShowHint((v) => !v)}
              className="mt-4 flex-row items-center gap-1.5 self-start"
            >
              <Icon
                name={showHint ? 'chevron-down' : 'chevron-right'}
                size={15}
                color={paper.brandMid}
                strokeWidth={2}
              />
              <Text className="font-strong text-label" style={{ color: paper.brandMid }}>
                {showHint ? 'Ẩn gợi ý' : 'Xem gợi ý'}
              </Text>
            </Pressable>

            {showHint ? (
              <View className="mt-2.5 rounded-panel border border-brand-soft bg-brand-tint p-3">
                <Text className="font-sans text-body text-paper-body">{item.hint}</Text>
                {reveal.solvedCount < reveal.total ? (
                  <Text className="mt-2 font-sans text-label text-paper-muted">
                    Từ tiếp theo có{' '}
                    <Text className="font-strong">
                      {reveal.tokens[reveal.solvedCount]?.key.length ?? 0} chữ cái
                    </Text>
                    , bắt đầu bằng “{reveal.tokens[reveal.solvedCount]?.word.slice(0, 1)}”.
                  </Text>
                ) : null}
              </View>
            ) : null}
          </PaperCard>
        </View>

        {/* ------------------------------------------------------- bài dịch */}
        <View className="lg:flex-1">
          <PaperCard>
            <View className="flex-row items-center justify-between">
              <Text className="font-heavy text-cardTitle text-paper-ink">Bài dịch của em</Text>
              <Text
                className="font-strong text-label"
                style={{ color: reveal.done ? paper.brandMid : paper.muted }}
              >
                {reveal.solvedCount}/{reveal.total} từ đúng
              </Text>
            </View>

            <View className="mt-2.5 h-2 overflow-hidden rounded-pill bg-brand-soft">
              <View
                className="h-full rounded-pill"
                style={{ width: `${percent}%`, backgroundColor: paper.brandMid }}
              />
            </View>

            <TextInput
              value={typed}
              onChangeText={setTyped}
              onSubmitEditing={reveal.done ? goNext : undefined}
              placeholder="Gõ bản dịch tiếng Anh của bạn…"
              placeholderTextColor={paper.muted}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
              className="mt-4 rounded-panel border bg-white px-3.5 py-3 font-sans text-bodyLg text-paper-ink"
              style={{
                borderColor: reveal.mismatch
                  ? color.danger
                  : reveal.done
                    ? paper.brandMid
                    : paper.brandSoft,
                borderWidth: 1.5,
              }}
            />

            {reveal.mismatch ? (
              <Text className="mt-2 font-mid text-label text-danger">
                Chưa khớp câu mẫu ở từ đang gõ — sửa lại từ đó rồi đi tiếp.
              </Text>
            ) : null}

            <View className="mt-3 flex-row flex-wrap items-center gap-2">
              <Button label="Xoá hết" variant="brandOutline" size="sm" onPress={() => setTyped('')} />
              <View className="flex-1" />
              {reveal.done ? (
                <Button
                  label={index + 1 < total ? 'Câu tiếp theo' : 'Xem kết quả'}
                  variant="brand"
                  iconRight="arrow-right"
                  onPress={goNext}
                />
              ) : (
                <Button label="Bỏ qua câu này" variant="brandOutline" size="sm" onPress={goNext} />
              )}
            </View>

            {reveal.done ? (
              <View className="mt-4 gap-3">
                <View className="rounded-panel border border-success bg-success-soft p-3.5">
                  <View className="flex-row items-center gap-2">
                    <Icon name="check" size={17} color={color.success} strokeWidth={2.4} />
                    <Text className="font-strong text-body text-success-ink">
                      Chính xác! Câu hoàn chỉnh:
                    </Text>
                  </View>
                  <Text className="mt-1.5 font-strong text-bodyLg text-paper-ink">{item.en}</Text>
                </View>

                {enrichment ? (
                  <>
                    <View className="rounded-panel border border-brand-soft bg-brand-tint p-3.5">
                      <Text className="font-strong text-label text-paper-muted">
                        Cách diễn đạt khác — câu mẫu không phải bản dịch duy nhất đúng
                      </Text>
                      <View className="mt-2 gap-1.5">
                        {enrichment.paraphrases.map((p, i) => (
                          <Text key={i} className="font-sans text-body text-paper-body">
                            • {p}
                          </Text>
                        ))}
                      </View>
                    </View>

                    <View className="rounded-panel border border-brand-soft bg-brand-tint p-3.5">
                      <Text className="font-strong text-label text-paper-muted">Từ vựng mới</Text>
                      <View className="mt-2 gap-2.5">
                        {enrichment.vocab.map((v, i) => (
                          <View key={i}>
                            <Text className="font-sans text-body text-paper-ink">
                              <Text className="font-strong">{v.word}</Text>
                              <Text className="text-paper-muted"> — {v.meaningVi}</Text>
                            </Text>
                            <Text className="font-sans text-label text-paper-muted">{v.example}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  </>
                ) : null}
              </View>
            ) : null}
          </PaperCard>
        </View>
      </View>
    </TaskShell>
  );
}

/**
 * Một từ của câu mẫu.
 *
 * Ba trạng thái phân biệt bằng HAI dấu hiệu chứ không chỉ bằng màu — đã mở thì
 * đổi cả chữ (hiện từ thật thay cho dấu sao), đang gõ lệch thì thêm viền đỏ.
 * Chỉ đổi màu thôi thì người phân biệt màu kém không thấy gì thay đổi.
 */
function WordChip({ token, warn }: { token: ReturnType<typeof buildReveal>['tokens'][number]; warn: boolean }) {
  const solved = token.status === 'solved';
  const active = token.status === 'active';

  return (
    <View
      className="rounded-md border px-2 py-1"
      style={{
        backgroundColor: solved ? paper.fill : '#FFFFFF',
        borderColor: warn ? color.danger : solved ? paper.fillEdge : active ? paper.brandMid : paper.brandSoft,
        borderWidth: solved || active || warn ? 1.5 : 1,
      }}
    >
      <Text
        className={solved ? 'font-strong text-body' : 'font-mid text-body'}
        style={{
          color: solved ? paper.ink : warn ? color.danger : paper.muted,
          letterSpacing: solved ? 0 : 1,
        }}
      >
        {solved ? token.word : token.masked}
      </Text>
    </View>
  );
}

// ------------------------------------------------------------------- kết quả

function SummaryView({
  attempts,
  items,
  onRestart,
}: {
  attempts: TranslationAttempt[];
  items: TranslationItem[];
  onRestart: () => void;
}) {
  const correctCount = useMemo(() => attempts.filter((a) => a.selfCorrect).length, [attempts]);
  const toReview = useMemo(
    () =>
      attempts
        .filter((a) => !a.selfCorrect)
        .map((a) => items.find((i) => i.id === a.itemId))
        .filter((i): i is TranslationItem => !!i),
    [attempts, items],
  );

  return (
    <TaskShell
      backHref="/sentence"
      backLabel="Quay lại Luyện câu"
      title="Xong buổi luyện"
      subtitle="Translation practice"
      icon="languages"
    >
      <PaperCard className="items-center py-7">
        <Text className="font-heavy text-hero text-paper-ink">
          {correctCount}/{attempts.length}
        </Text>
        <Text className="mt-1 font-sans text-body text-paper-muted">
          câu tự tái tạo được mà không cần mở gợi ý
        </Text>
      </PaperCard>

      {toReview.length > 0 ? (
        <PaperCard className="mt-4">
          <Text className="font-strong text-cardTitle text-paper-ink">Câu cần xem lại</Text>
          <View className="mt-3 gap-3">
            {toReview.map((it) => (
              <View key={it.id} className="rounded-panel border border-brand-soft p-3">
                <Text className="font-sans text-body text-paper-body">{it.vi}</Text>
                <Text className="mt-1 font-strong text-body" style={{ color: paper.brandMid }}>
                  {it.en}
                </Text>
                <Text className="mt-1 font-mid text-label text-paper-muted">{it.hint}</Text>
              </View>
            ))}
          </View>
        </PaperCard>
      ) : null}

      <View className="mt-4 flex-row flex-wrap gap-2">
        <Button label="Luyện lại" iconLeft="refresh" variant="onDarkSolid" onPress={onRestart} />
        <Button
          label="Về Luyện câu"
          variant="onDark"
          onPress={() => router.replace('/sentence' as never)}
        />
      </View>
    </TaskShell>
  );
}
