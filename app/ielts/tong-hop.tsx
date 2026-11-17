import React, { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { DrillExamHost } from '@/components/ielts/exam/DrillExamHost';
import { Screen } from '@/components/layout/Screen';
import { NeonWindow } from '@/components/neon/Neon';
import { Icon } from '@/components/ui';
import { buildMixedTest, MIXED_PARTS, MIXED_PER_PART, mixableTypes, type MixedSkill } from '@/data/drill-sets/mixed';
import { IELTS_QUESTION_TYPES } from '@/data/ielts-question-types';
import { useL } from '@/i18n/useL';
import { useDrillSetStore } from '@/store/useDrillSetStore';

/** /ielts/tong-hop?skill=reading|listening — bài thi thử 40 câu, chấm ở cuối: band, phổ điểm, độ chính xác từng dạng. */
export default function MixedTestScreen() {
  const { skill: skillParam } = useLocalSearchParams<{ skill?: string }>();
  const skill: MixedSkill = skillParam === 'listening' ? 'listening' : 'reading';
  const { L } = useL();
  const attempts = useDrillSetStore((s) => s.attempts);
  const [seed, setSeed] = useState<number | null>(null);

  const types = useMemo(() => mixableTypes(skill), [skill]);
  const test = useMemo(() => (seed === null ? null : buildMixedTest(skill, seed)), [seed, skill]);
  const history = attempts.filter((a) => a.skill === skill && a.total >= 40).slice(0, 5);
  const skillLabel = skill === 'reading' ? 'Reading' : 'Listening';

  if (test && seed !== null) {
    return (
      <Screen>
        <DrillExamHost
          typeId={`mixed-${skill}`}
          set={test}
          skill={skill}
          mixed
          onExit={() => setSeed(null)}
          onNext={() => setSeed(Date.now() % 1_000_000)}
          nextSetId={String(seed)}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <Pressable onPress={() => router.push('/ielts/skills' as never)} className="mb-3 flex-row items-center gap-1 self-start">
        <Icon name="chevron-left" size={16} color="#64748B" />
        <Text className="font-mid text-label text-muted">{L('Luyện theo dạng bài', 'Practice by type')}</Text>
      </Pressable>

      <NeonWindow title={L(`${skillLabel} · thi thử`, `${skillLabel} mock test`)} icon="trophy" padded={false}>
      <View className="gap-3 p-6">
        <Text className="font-heavy text-pageTitle text-ink">{L(`${skillLabel} · bài tổng hợp 40 câu`, `${skillLabel} · 40-question mixed test`)}</Text>
        <Text className="font-sans text-body text-muted">
          {L(
            `${MIXED_PARTS} phần × ${MIXED_PER_PART} câu, mỗi phần một dạng khác nhau (rút ngẫu nhiên từ ${types.length} dạng đang có). Làm xong mới biết đúng sai: bạn nhận band ước tính, phổ điểm, độ chính xác từng dạng và lời giải từng câu.`,
            `${MIXED_PARTS} parts × ${MIXED_PER_PART} questions, one type per part (drawn from ${types.length} types). Marked only at the end.`,
          )}
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {types.map((id) => (
            <View key={id} className="rounded-full px-3 py-1" style={{ backgroundColor: '#F1ECFF' }}>
              <Text className="font-strong text-[12px]" style={{ color: '#6A4BD9' }}>{IELTS_QUESTION_TYPES.find((t) => t.id === id)?.titleEn ?? id}</Text>
            </View>
          ))}
        </View>
        {types.length >= MIXED_PARTS ? (
          <Pressable onPress={() => setSeed(Date.now() % 1_000_000)} className="mt-2 items-center rounded-xl bg-primary py-3.5">
            <Text className="font-strong text-body text-white">{L('Bắt đầu làm bài', 'Start the test')}</Text>
          </Pressable>
        ) : (
          <Text className="font-strong text-body" style={{ color: '#B45309' }}>{L(`Cần ít nhất ${MIXED_PARTS} dạng có bộ đề; hiện có ${types.length}.`, `Need at least ${MIXED_PARTS} types with sets; have ${types.length}.`)}</Text>
        )}
        {skill === 'listening' ? <Text className="font-sans text-label text-muted">{L('Bài nghe phát bằng giọng máy, nghe lại được. Xem bản ghi sau khi nộp.', 'Audio is machine-voiced; you can replay it.')}</Text> : null}
      </View>
      </NeonWindow>

      {history.length > 0 ? (
        <View className="mt-4">
        <NeonWindow title={L('Các lần làm gần đây', 'Recent attempts')} icon="clock" padded={false}>
        <View className="gap-2 p-4">
          <Text className="font-strong text-label text-muted">{L('CÁC LẦN LÀM GẦN ĐÂY', 'RECENT ATTEMPTS')}</Text>
          {history.map((a) => (
            <View key={a.at} className="flex-row items-center justify-between">
              <Text className="font-sans text-body text-ink">{new Date(a.at).toLocaleDateString('vi-VN')} · {a.correct}/{a.total}</Text>
              <Text className="font-heavy text-body" style={{ color: '#6A4BD9' }}>Band {a.band.toFixed(1)}</Text>
            </View>
          ))}
        </View>
        </NeonWindow>
        </View>
      ) : null}
    </Screen>
  );
}
