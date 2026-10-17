import React, { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { HubScreen } from '@/components/hub/HubScreen';
import { GLASS_CARD, HUB } from '@/components/hub/theme';
import { Icon } from '@/components/ui/Icon';
import { ALL_LESSONS, type GrammarLevel } from '@/services/hub/grammar-course';
import { PASS_PERCENT, buildLevelTest, gradeLevelTest, type LevelTestGrade } from '@/services/hub/level-test';
import { dayKeyOf } from '@/services/hub/daily';
import { useLevelTestStore } from '@/store/useLevelTestStore';

const LEVELS: GrammarLevel[] = ['A1', 'A2', 'B1', 'B2', 'C'];

/** Đề kiểm tra một cấp độ: 10 câu lấy từ các bài của cấp đó, nộp một lần, có danh sách bài cần ôn lại. */
export default function GrammarLevelTest() {
  const params = useLocalSearchParams<{ level: string }>();
  const level: GrammarLevel = (LEVELS as string[]).includes(params.level ?? '') ? (params.level as GrammarLevel) : 'A1';
  const attempts = useLevelTestStore((s) => s.best[level]?.attempts ?? 0);
  const record = useLevelTestStore((s) => s.record);

  // Đề đổi theo ngày và theo số lần đã làm, nên làm lại không gặp đúng bộ câu cũ.
  const items = useMemo(() => buildLevelTest(level, `${dayKeyOf(new Date())}|${attempts}`), [level, attempts]);
  const [index, setIndex] = useState(0);
  const [picks, setPicks] = useState<(number | null)[]>([]);
  const [grade, setGrade] = useState<LevelTestGrade | null>(null);

  const restart = () => {
    setIndex(0);
    setPicks([]);
    setGrade(null);
  };

  const submit = () => {
    const g = gradeLevelTest(items, picks);
    setGrade(g);
    record(level, g.percent);
  };

  if (grade) {
    return (
      <HubScreen title={`Đề kiểm tra ${level}`} subtitle="Kết quả" back>
        <View style={[GLASS_CARD, { padding: 16, gap: 10 }]}>
          <Text style={{ color: HUB.ink, fontSize: 28, fontWeight: '800', fontVariant: ['tabular-nums'] }}>{grade.percent}%</Text>
          <Text style={{ color: HUB.ink, fontSize: 15, fontWeight: '700' }}>
            {`Đúng ${grade.correct}/${grade.total} câu · ${grade.passed ? 'Đạt' : 'Chưa đạt'} (ngưỡng ${PASS_PERCENT}%)`}
          </Text>
          <Text style={{ color: HUB.muted, fontSize: 12, lineHeight: 18 }}>
            Ngưỡng 80% là mốc thành thạo của app. Làm lại nhiều lần, cách nhau vài ngày, sẽ đo được tiến bộ rõ hơn một lần làm dồn.
          </Text>
        </View>

        {grade.weakLessonIds.length > 0 ? (
          <View style={[GLASS_CARD, { padding: 16, gap: 10 }]}>
            <Text style={{ color: HUB.ink, fontSize: 16, fontWeight: '800' }}>Nên ôn lại</Text>
            {grade.weakLessonIds.map((id) => {
              const lesson = ALL_LESSONS.find((l) => l.id === id);
              if (!lesson) return null;
              return (
                <Pressable key={id} accessibilityRole="button" onPress={() => router.push(`/hub/grammar/${id}` as never)} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 }}>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={{ color: HUB.ink, fontSize: 15, fontWeight: '700' }}>{lesson.title}</Text>
                    <Text style={{ color: HUB.muted, fontSize: 12 }}>{lesson.subtitle}</Text>
                  </View>
                  <Icon name="chevron-right" size={18} color={HUB.muted} />
                </Pressable>
              );
            })}
          </View>
        ) : (
          <Text style={{ color: HUB.green, fontSize: 14, fontWeight: '700' }}>Không có bài nào sai. Tiếp tục với cấp độ tiếp theo.</Text>
        )}

        <Pressable accessibilityRole="button" onPress={restart} style={[GLASS_CARD, { padding: 14, alignItems: 'center' }]}>
          <Text style={{ color: HUB.ink, fontSize: 15, fontWeight: '800' }}>Làm đề khác</Text>
        </Pressable>
      </HubScreen>
    );
  }

  const item = items[index];
  const picked = picks[index] ?? null;
  const isLast = index === items.length - 1;

  if (!item) {
    return (
      <HubScreen title={`Đề kiểm tra ${level}`} subtitle="Chưa có câu" back>
        <Text style={{ color: HUB.muted, fontSize: 14 }}>Cấp độ này chưa có câu hỏi.</Text>
      </HubScreen>
    );
  }

  const choose = (opt: number) => {
    setPicks((prev) => {
      const next = prev.slice();
      next[index] = opt;
      return next;
    });
  };

  return (
    <HubScreen title={`Đề kiểm tra ${level}`} subtitle={`Câu ${index + 1}/${items.length}`} back>
      <View style={{ height: 6, borderRadius: 3, backgroundColor: HUB.glassStrong, overflow: 'hidden' }}>
        <View style={{ width: `${((index + 1) / items.length) * 100}%`, height: 6, borderRadius: 3, backgroundColor: HUB.blue }} />
      </View>

      <View style={[GLASS_CARD, { padding: 18, gap: 14 }]}>
        <Text style={{ color: HUB.ink, fontSize: 17, fontWeight: '700', lineHeight: 24 }}>{item.q}</Text>
        <View style={{ gap: 10 }}>
          {item.options.map((opt, i) => {
            const on = picked === i;
            return (
              <Pressable
                key={`${index}-${i}`}
                accessibilityRole="radio"
                accessibilityState={{ checked: on }}
                onPress={() => choose(i)}
                style={{ paddingVertical: 14, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1.5, borderColor: on ? HUB.blue : 'rgba(120, 68, 21, 0.12)', backgroundColor: on ? 'rgba(59,130,246,0.14)' : HUB.glassStrong }}
              >
                <Text style={{ color: HUB.ink, fontSize: 15, fontWeight: on ? '800' : '600' }}>{opt}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Pressable
          accessibilityRole="button"
          disabled={index === 0}
          onPress={() => setIndex((i) => Math.max(0, i - 1))}
          style={[GLASS_CARD, { flex: 1, padding: 14, alignItems: 'center', opacity: index === 0 ? 0.4 : 1 }]}
        >
          <Text style={{ color: HUB.ink, fontSize: 15, fontWeight: '800' }}>Câu trước</Text>
        </Pressable>
        {isLast ? (
          <Pressable accessibilityRole="button" disabled={picked === null} onPress={submit} style={{ flex: 1, padding: 14, borderRadius: 999, alignItems: 'center', backgroundColor: HUB.blue, opacity: picked === null ? 0.4 : 1 }}>
            <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '800' }}>Nộp bài</Text>
          </Pressable>
        ) : (
          <Pressable accessibilityRole="button" disabled={picked === null} onPress={() => setIndex((i) => i + 1)} style={{ flex: 1, padding: 14, borderRadius: 999, alignItems: 'center', backgroundColor: HUB.blue, opacity: picked === null ? 0.4 : 1 }}>
            <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '800' }}>Câu tiếp</Text>
          </Pressable>
        )}
      </View>
    </HubScreen>
  );
}
