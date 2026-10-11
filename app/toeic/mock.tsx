import React, { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { Countdown, QaSet } from '@/components/intl/SkillKit';
import { IntlDisclaimer, QuestionList } from '@/components/intl/IntlKit';
import { Button, Card, SectionHeader } from '@/components/ui';
import { TOEIC_PART2 } from '@/data/intl/listening';
import { TOEIC_PART6, TOEIC_PART7 } from '@/data/intl/toeic-reading';
import { bi, useL } from '@/i18n/useL';
import { buildPart5Set } from '@/services/intl/toeic-part5';
import { fromPart5, fromReading } from '@/services/intl/practice';
import { useIntlStore } from '@/store/useIntlStore';

/**
 * Đề thi thử rút gọn cho Reading: Part 5 (30 câu) + Part 6 (8 chỗ trống) + Part 7 (7 câu).
 * Không phải đề thi thật, không quy đổi điểm. Điểm là số câu đúng.
 */
export default function ToeicMockScreen() {
  const { L, locale } = useL();
  const recordSession = useIntlStore((s) => s.recordSession);
  const [seed] = useState(() => String(Date.now()));
  const part5 = useMemo(() => fromPart5(buildPart5Set(seed, 30)), [seed]);
  const part6 = useMemo(() => TOEIC_PART6.flatMap((t) => fromReading(t.blanks)), []);
  const part7 = useMemo(() => TOEIC_PART7.flatMap((s) => fromReading(s.questions)), []);
  const [scores, setScores] = useState<{ p5?: [number, number]; p6?: [number, number]; p7?: [number, number] }>({});
  const [saved, setSaved] = useState(false);

  const allDone = scores.p5 && scores.p6 && scores.p7;
  const correct = (scores.p5?.[0] ?? 0) + (scores.p6?.[0] ?? 0) + (scores.p7?.[0] ?? 0);
  const total = part5.length + part6.length + part7.length;

  const finish = () => {
    if (saved) return;
    setSaved(true);
    recordSession({ exam: 'toeic', activity: 'mock:reading', correct, total });
  };

  return (
    <Screen>
      <Text className="font-heavy text-pageTitle text-ink">{L('TOEIC · Thi thử Reading', 'TOEIC · Reading mock test')}</Text>
      <Text className="mt-1 font-sans text-body text-muted">
        {L(`${total} câu. Thời gian gợi ý 40 phút (tự đặt, không phải thời gian chính thức).`, `${total} questions. Suggested time 40 minutes (self-timed, not the official time).`)}
      </Text>
      <Card className="mt-3">
        <Countdown seconds={40 * 60} running />
      </Card>

      <SectionHeader className="mt-6" title={L('Nghe · Part 2 (chấm riêng)', 'Listening · Part 2 (scored separately)')} icon="volume" />
      <View className="mt-3">
        <QaSet items={TOEIC_PART2} exam="toeic" />
      </View>

      <SectionHeader className="mt-6" title="Part 5" icon="list" />
      <View className="mt-3">
        <QuestionList key={`p5-${seed}`} questions={part5} onSubmit={(c, t) => setScores((s) => ({ ...s, p5: [c, t] }))} />
      </View>

      <SectionHeader className="mt-6" title="Part 6" icon="list" />
      <View className="mt-3 gap-3">
        {TOEIC_PART6.map((t) => (
          <Card key={t.id}>
            <Text className="font-strong text-body text-ink">{bi(t.title, locale)}</Text>
            <Text className="mt-2 font-sans text-body text-ink">{t.body}</Text>
          </Card>
        ))}
        <QuestionList questions={part6} onSubmit={(c, t) => setScores((s) => ({ ...s, p6: [c, t] }))} />
      </View>

      <SectionHeader className="mt-6" title="Part 7" icon="list" />
      <View className="mt-3 gap-3">
        {TOEIC_PART7.map((s) => (
          <Card key={s.id}>
            <Text className="font-strong text-body text-ink">{bi(s.title, locale)}</Text>
            {s.texts.map((t, i) => (
              <Text key={i} className="mt-2 font-sans text-body text-ink">{t}</Text>
            ))}
          </Card>
        ))}
        <QuestionList questions={part7} onSubmit={(c, t) => setScores((s) => ({ ...s, p7: [c, t] }))} />
      </View>

      {allDone ? (
        <Card className="mt-6">
          <Text className="font-heavy text-cardTitle text-ink">{L(`Kết quả: ${correct}/${total} câu đúng`, `Score: ${correct}/${total} correct`)}</Text>
          <Button className="mt-3" label={saved ? L('Đã lưu', 'Saved') : L('Lưu kết quả', 'Save result')} disabled={saved} onPress={finish} />
        </Card>
      ) : null}

      <View className="mt-4">
        <Button variant="outline" label={L('Về TOEIC', 'Back to TOEIC')} onPress={() => router.replace('/toeic' as never)} />
      </View>
      <View className="mt-6">
        <IntlDisclaimer />
      </View>
    </Screen>
  );
}
