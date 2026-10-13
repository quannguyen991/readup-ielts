import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import { TravelPage } from '@/components/travel/ui/TravelPage';
import { GameButton, PixelPanel, T } from '@/components/travel/ui/kit';
import { STUDY_JOBS } from '@/data/study-abroad-jobs';
import { STUDY_PAY, balanceOf, type ShiftReason } from '@/services/study-abroad/economy';
import { bi, useL } from '@/i18n/useL';
import { uid } from '@/store/persist';
import { useStudyAbroadStore } from '@/store/useStudyAbroadStore';

type Phase = 'idle' | 'playing' | 'done';
type Result = { correct: number; paid: number; reason: ShiftReason };

export default function StudyAbroadWorkScreen() {
  const { L, locale } = useL();
  const completed = useStudyAbroadStore((state) => state.completed);
  const ledger = useStudyAbroadStore((state) => state.ledger);
  const workShift = useStudyAbroadStore((state) => state.workShift);
  // G1 chỉ có một việc. Khi thêm thành phố, màn này sẽ chọn việc theo thành phố đang ở.
  const job = STUDY_JOBS[0]!;
  const unlocked = completed.includes(job.unlockMission);
  const balance = balanceOf(ledger);

  const [phase, setPhase] = useState<Phase>('idle');
  const [attemptId, setAttemptId] = useState('');
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [result, setResult] = useState<Result | null>(null);

  const start = () => {
    setAttemptId(uid());
    setAnswers([]);
    setIndex(0);
    setResult(null);
    setPhase('playing');
  };

  const choose = (option: number) => {
    const next = [...answers, option];
    if (next.length < job.questions.length) {
      setAnswers(next);
      setIndex(index + 1);
      return;
    }
    const correct = next.filter((picked, i) => picked === job.questions[i]!.answer).length;
    const outcome = workShift(attemptId, correct);
    setAnswers(next);
    setResult({ correct, paid: outcome.paid, reason: outcome.reason });
    setPhase('done');
  };

  const reasonText = (reason: ShiftReason) => {
    if (reason === 'paid') return L('Đã trả lương cho ca này.', 'Pay for this shift has been recorded.');
    if (reason === 'failed') return L(`Chưa đủ ${STUDY_PAY.passAt}/${job.questions.length} câu nên ca không được trả. Bạn có thể nhận ca khác.`, `Fewer than ${STUDY_PAY.passAt} of ${job.questions.length} correct, so no pay. You can take another shift.`);
    if (reason === 'full') return L('Hôm nay đã đủ 2 ca được trả. Ngày mai hoặc ngày học tiếp theo sẽ mở thêm ca.', 'You have already been paid for 2 shifts today. Tomorrow or the next study day opens more shifts.');
    return L('Ca này đã được ghi.', 'This shift has already been recorded.');
  };

  const question = job.questions[Math.min(index, job.questions.length - 1)]!;

  return (
    <TravelPage title={L('Việc làm thêm', 'Part-time work')} back="/quest/study-abroad/dorm" backLabel={L('Phòng ký túc xá', 'Dorm room')}>
      <PixelPanel tone="navy" inner={{ padding: 16, gap: 9 }}>
        <Text className="font-heavy" style={{ color: T.goldLight, fontSize: 21 }}>{bi(job.title, locale)}</Text>
        <Text className="font-sans" style={{ color: T.cream, fontSize: 13, lineHeight: 19 }}>
          {bi(job.place, locale)} · {L(`${job.questions.length} tình huống mỗi ca · đạt từ ${STUDY_PAY.passAt} câu · ${STUDY_PAY.payPerCorrect} đồng mỗi câu đúng`, `${job.questions.length} situations per shift · pass at ${STUDY_PAY.passAt} · ${STUDY_PAY.payPerCorrect} per correct answer`)}
        </Text>
        <Text className="font-semi" style={{ color: T.goldLight, fontSize: 14 }}>{L(`Số dư: ${balance} đồng du học`, `Balance: ${balance} study funds`)}</Text>
      </PixelPanel>

      {!unlocked ? (
        <PixelPanel tone="paper" style={{ marginTop: 14 }} inner={{ padding: 14, gap: 8 }}>
          <Text className="font-sans" style={{ color: T.muted, fontSize: 13, lineHeight: 19 }}>
            {L('Việc này mở khi bạn đến Singapore và làm xong nhiệm vụ nhập cảnh.', 'This job opens once you reach Singapore and finish the arrival mission.')}
          </Text>
        </PixelPanel>
      ) : phase === 'idle' ? (
        <View style={{ marginTop: 14 }}>
          <GameButton label={L('Nhận ca', 'Start shift')} tone="gold" onPress={start} />
        </View>
      ) : phase === 'playing' ? (
        <PixelPanel tone="paper" style={{ marginTop: 14 }} inner={{ padding: 14, gap: 10 }}>
          <Text className="font-semi" style={{ color: T.muted, fontSize: 12 }}>{L(`Tình huống ${index + 1}/${job.questions.length}`, `Situation ${index + 1}/${job.questions.length}`)}</Text>
          <Text className="font-heavy" style={{ color: T.ink, fontSize: 16, lineHeight: 22 }}>{`"${question.customer}"`}</Text>
          <Text className="font-sans" style={{ color: T.goldDark, fontSize: 12, lineHeight: 18 }}>{`${L('Gợi ý', 'Hint')}: ${bi(question.hint, locale)}`}</Text>
          <View style={{ gap: 8 }}>
            {question.options.map((option, i) => (
              <Pressable key={`${question.id}-${i}`} accessibilityRole="button" onPress={() => choose(i)} style={{ padding: 11, borderRadius: 9, borderWidth: 1.5, borderColor: T.line, backgroundColor: '#FFFFFF' }}>
                <Text className="font-sans" style={{ color: T.ink, fontSize: 14, lineHeight: 20 }}>{option}</Text>
              </Pressable>
            ))}
          </View>
        </PixelPanel>
      ) : result ? (
        <PixelPanel tone="paper" style={{ marginTop: 14 }} inner={{ padding: 14, gap: 9 }}>
          <Text className="font-heavy" style={{ color: T.ink, fontSize: 16 }}>{L(`Đúng ${result.correct}/${job.questions.length} tình huống`, `${result.correct}/${job.questions.length} correct`)}</Text>
          <Text className="font-semi" style={{ color: result.paid > 0 ? T.good : T.muted, fontSize: 14, lineHeight: 20 }}>
            {result.paid > 0 ? L(`+${result.paid} đồng du học. `, `+${result.paid} study funds. `) : ''}{reasonText(result.reason)}
          </Text>
          {job.questions.map((q, i) => {
            const right = answers[i] === q.answer;
            return (
              <Text key={q.id} className="font-sans" style={{ color: right ? T.good : T.bad, fontSize: 12, lineHeight: 18 }}>
                {`${right ? '✓' : '✗'} ${bi(q.explanation, locale)}`}
              </Text>
            );
          })}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            <GameButton label={L('Nhận ca khác', 'Another shift')} tone="gold" onPress={start} />
            <GameButton label={L('Về phòng ký túc xá', 'Back to dorm')} tone="paper" onPress={() => router.push('/quest/study-abroad/dorm' as never)} />
          </View>
        </PixelPanel>
      ) : null}
      <View style={{ height: 24 }} />
    </TravelPage>
  );
}
