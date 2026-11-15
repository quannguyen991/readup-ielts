import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { CRITERION_COLOR, DarkButton, INK, LINE, MUTED, OptionTile, SoftButton, useWide } from '@/components/hsa/stage';
import { Icon } from '@/components/ui/Icon';
import { HSA_KIND_LABEL, type HsaQuestion } from '@/data/hsa';
import { bi, useL } from '@/i18n/useL';
import { KIND_CRITERION } from '@/services/hsa/criteria';
import { itemsFrom } from '@/services/hsa/scoring';
import { useHsaStore } from '@/store/useHsaStore';
import { useIntlStore } from '@/store/useIntlStore';
import { useStudyStore } from '@/store/useStudyStore';

type Props = {
  title: string;
  questions: readonly HsaQuestion[];
  activity: string;
  durationSeconds?: number;
};

const ACCENT = '#6A4BD9';

function clock(seconds: number) {
  return `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
}

/**
 * Bộ chạy bài HSA: mỗi lần một câu, đáp án và lời giải chỉ hiện sau khi nộp.
 * Nộp xong thì lưu chi tiết từng câu (`useHsaStore`) và chuyển sang trang kết quả `/hsa/result/[id]`,
 * nơi có điểm theo tiêu chí, đáp án chi tiết và cách làm mẫu.
 *
 * Thiết kế cho điện thoại trước: đáp án là ô lớn dễ chạm, nút Trước / Tiếp nằm ngay dưới đáp án,
 * đồng hồ và tiến độ nằm trên cùng, lưới nhảy câu để sau cùng.
 */
export function HsaRunner({ title, questions, activity, durationSeconds }: Props) {
  const { L, locale } = useL();
  const wide = useWide();
  const recordSession = useIntlStore((s) => s.recordSession);
  const recordAttempt = useHsaStore((s) => s.recordAttempt);
  const startedAt = useRef(Date.now());
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(() => questions.map(() => null));
  const [submitted, setSubmitted] = useState(false);
  const [remaining, setRemaining] = useState(durationSeconds ?? 0);
  const saved = useRef(false);
  const submitRef = useRef<() => void>(() => undefined);

  const correct = useMemo(
    () => questions.reduce((sum, question, index) => sum + (answers[index] === question.answer ? 1 : 0), 0),
    [answers, questions],
  );

  submitRef.current = () => {
    if (saved.current) return;
    saved.current = true;
    setSubmitted(true);
    recordSession({ exam: 'hsa', activity, correct, total: questions.length });
    const seconds = (Date.now() - startedAt.current) / 1000;
    const { id } = recordAttempt({ activity, items: itemsFrom(questions, answers), seconds });
    // Điểm xếp hạng là điểm CHUNG của app: phút học và số câu đã làm vào nhật ký học, không có điểm riêng của HSA.
    const study = useStudyStore.getState();
    const minutes = Math.floor(seconds / 60);
    if (minutes > 0) study.logStudyTime(activity.startsWith('mock:') ? 'mock_test' : 'practice', minutes);
    const attempted = answers.filter((v) => v !== null).length;
    if (attempted > 0) study.logQuestions(attempted);
    study.logEvent();
    router.replace(`/hsa/result/${id}` as never);
  };

  useEffect(() => {
    if (!durationSeconds || submitted) return;
    const timer = setInterval(() => {
      setRemaining((value) => {
        if (value <= 1) {
          clearInterval(timer);
          submitRef.current();
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [durationSeconds, submitted]);

  if (!questions.length) {
    return (
      <Screen>
        <Text className="font-nun-heavy" style={{ fontSize: 18, color: INK }}>
          {L('Chưa có câu hỏi cho mục này.', 'There are no questions in this section yet.')}
        </Text>
      </Screen>
    );
  }

  const q = questions[current] ?? questions[0]!;
  const picked = answers[current];
  const answered = answers.filter((value) => value !== null).length;
  const unanswered = questions.length - answered;
  const last = current === questions.length - 1;
  const low = !!durationSeconds && remaining < 300;

  return (
    <Screen>
      <View className="w-full self-center" style={{ maxWidth: 760, gap: 12 }}>
        {/* ---------------------------------------------- đầu bài: tên, đồng hồ, tiến độ */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <Text className="font-nun-heavy" numberOfLines={2} style={{ flex: 1, fontSize: wide ? 24 : 18, lineHeight: wide ? 30 : 23, color: INK }}>
            {title}
          </Text>
          {durationSeconds ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, height: 36, borderRadius: 18, backgroundColor: low ? '#FFE3E3' : '#EFEAFD' }}>
              <Icon name="clock" size={15} color={low ? '#C2272D' : ACCENT} strokeWidth={2.4} />
              <Text className="font-nun-heavy" style={{ fontSize: 15, color: low ? '#C2272D' : ACCENT }}>
                {clock(remaining)}
              </Text>
            </View>
          ) : null}
        </View>

        <View>
          <View style={{ height: 8, borderRadius: 4, backgroundColor: '#EFEAFD', overflow: 'hidden' }}>
            <View style={{ width: `${(answered / questions.length) * 100}%`, height: 8, borderRadius: 4, backgroundColor: ACCENT }} />
          </View>
          <Text className="font-nun-strong" style={{ fontSize: 12, color: MUTED, marginTop: 4 }}>
            {L(`Đã trả lời ${answered}/${questions.length}`, `Answered ${answered}/${questions.length}`)}
          </Text>
        </View>

        {/* ---------------------------------------------- câu hỏi */}
        <View style={{ backgroundColor: '#FFFFFF', borderRadius: 22, borderWidth: 1, borderColor: LINE, padding: wide ? 22 : 14, gap: 12 }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
            <Text className="font-nun-heavy" style={{ fontSize: 14, color: INK }}>
              {L(`Câu ${current + 1}/${questions.length}`, `Question ${current + 1}/${questions.length}`)}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F3F0FB', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: CRITERION_COLOR[KIND_CRITERION[q.kind]] }} />
              <Text className="font-nun-heavy" style={{ fontSize: 12, color: INK }}>
                {bi(HSA_KIND_LABEL[q.kind], locale)} · {q.level}
              </Text>
            </View>
          </View>
          {q.context ? (
            <View style={{ backgroundColor: '#F7F5FD', borderRadius: 14, borderLeftWidth: 4, borderColor: '#CFC6EE', padding: 12 }}>
              <Text className="font-nun-strong" style={{ fontSize: wide ? 16 : 15, lineHeight: wide ? 26 : 24, color: '#3F356F' }}>
                {q.context}
              </Text>
            </View>
          ) : null}
          <Text className="font-nun-heavy" style={{ fontSize: wide ? 19 : 17, lineHeight: wide ? 28 : 25, color: INK }}>
            {q.prompt}
          </Text>
          <View style={{ gap: 8 }}>
            {q.choices.map((choice, index) => (
              <OptionTile
                key={`${q.id}-${index}`}
                letter={String.fromCharCode(65 + index)}
                title={choice}
                selected={picked === index}
                accent={ACCENT}
                onPress={() => setAnswers((prev) => prev.map((value, i) => (i === current ? index : value)))}
              />
            ))}
          </View>

          {/* Nút điều hướng nằm ngay dưới đáp án để không phải cuộn xuống tìm. */}
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
            <View style={{ flex: 1 }}>
              <SoftButton label={L('Trước', 'Previous')} icon="chevron-left" onPress={() => setCurrent((n) => Math.max(0, n - 1))} />
            </View>
            <View style={{ flex: 1.4 }}>
              {last ? (
                <DarkButton label={L('Nộp bài', 'Submit')} onPress={() => submitRef.current()} icon={null} />
              ) : (
                <DarkButton label={L('Tiếp', 'Next')} onPress={() => setCurrent((n) => Math.min(questions.length - 1, n + 1))} />
              )}
            </View>
          </View>
          {last && unanswered > 0 ? (
            <Text className="font-nun-strong" style={{ fontSize: 13, color: '#C2272D', textAlign: 'center' }}>
              {L(`Còn ${unanswered} câu chưa trả lời. Câu bỏ trống tính là bỏ qua.`, `${unanswered} unanswered. Blank questions count as skipped.`)}
            </Text>
          ) : null}
        </View>

        {/* ---------------------------------------------- nhảy câu */}
        <View style={{ backgroundColor: '#FFFFFF', borderRadius: 22, borderWidth: 1, borderColor: LINE, padding: wide ? 18 : 12 }}>
          <Text className="font-nun-heavy" style={{ fontSize: 13, color: MUTED, marginBottom: 8 }}>
            {L('Đi đến câu', 'Jump to question')}
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {questions.map((question, index) => {
              const on = index === current;
              const has = answers[index] !== null;
              return (
                <Pressable
                  key={question.id}
                  accessibilityRole="button"
                  accessibilityLabel={L(`Câu ${index + 1}`, `Question ${index + 1}`)}
                  onPress={() => setCurrent(index)}
                  style={{ width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: on ? ACCENT : has ? '#BFE8CF' : LINE, backgroundColor: on ? ACCENT : has ? '#EAF7F0' : '#FFFFFF' }}
                >
                  <Text className="font-nun-heavy" style={{ fontSize: 14, color: on ? '#FFFFFF' : INK }}>
                    {index + 1}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </Screen>
  );
}
