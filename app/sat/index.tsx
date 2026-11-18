import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';

import { Screen } from '@/components/layout/Screen';
import { useHydrated } from '@/components/layout/useHydrated';
import { B9 } from '@/components/practice/SkillBank';
import { Grid } from '@/components/layout/Grid';
import { NeonIcon, NeonWindow, PixelText } from '@/components/neon/Neon';
import { NEON_PALETTES, NeonTile } from '@/components/neon/NeonTile';
import { MoreLink, go } from '@/components/sat-hub/SatHub';
import { SatFocusPicker } from '@/components/practice/SatFocusPicker';
import { Icon } from '@/components/ui/Icon';
import { MATH_LESSONS } from '@/data/lessons/math-lessons';
import { VERBAL_LESSONS } from '@/data/lessons/verbal-lessons';
import { SAT_RW_QUESTIONS } from '@/data/sat-rw-repository';
import { useL } from '@/i18n/useL';
import { SAT_LEVELS_LINK, SAT_PATH_STEPS } from '@/navigation/sat-hub';

/** Màu ô số của từng bước. */
const STEP_COLORS = ['#FF5DB1', '#6A3FE0', '#19B8C8', '#FF8A3D'];
import { MATH_BANK_TOTAL, mathBankDone } from '@/services/math/bank';
import { SAT_RW_MIXED_SETS } from '@/services/sat-rw/mixed-sets';
import { lessonKey, useLessonStore } from '@/store/useLessonStore';
import { useLatestDiagnostic, useMathBankProgress, useMathStore, useMathTotals } from '@/store/useMathStore';
import { useSatGuideStore } from '@/store/useSatGuideStore';
import { useSatRwStore } from '@/store/useSatRwStore';

/**
 * TỔNG QUAN SAT — trang duy nhất người ôn SAT cần mở đầu tiên (01/10/2026).
 *
 * Người dùng: "hơi nhiều tác vụ, mọi người sẽ rối". Trước đây nhóm SAT có bảy
 * trang con ngang hàng và ba trang hub; giờ trang này xếp mọi thứ thành BỐN
 * BƯỚC theo thứ tự nên làm: kiểm tra đầu vào → học theo chủ đề → luyện theo
 * dạng (dễ → khó) → thi thử. Mỗi bước một câu, một dòng tiến độ thật (chưa
 * biết thì "—"), đúng một nút chính. Các trang còn lại là liên kết phụ.
 */
export default function SatHubScreen() {
  const { L, en } = useL();
  const { width } = useWindowDimensions();
  const wide = width >= 900;
  const hydrated = useHydrated();

  // ------------------------------------------------------- tiến độ thật
  const diagnostic = useLatestDiagnostic();
  const sessions = useMathStore((s) => s.sessions);
  const bank = useMathBankProgress();
  const totals = useMathTotals();
  const rwAttempts = useSatRwStore((s) => s.attempts);
  const lessonsDone = useLessonStore((s) => s.done);

  const mix1 = SAT_RW_MIXED_SETS[0]!;
  const mix1Answered = mix1.questions.filter((q) => rwAttempts[q.id]).length;
  const mix1Correct = mix1.questions.filter((q) => rwAttempts[q.id]?.correct).length;
  const mathLessons = MATH_LESSONS.filter((l) => lessonsDone[lessonKey('math', l.skill)]).length;
  const verbalLessons = VERBAL_LESSONS.filter((l) => lessonsDone[lessonKey('verbal', l.skill)]).length;
  const mathPractised = mathBankDone(bank);
  const rwPractised = SAT_RW_QUESTIONS.filter((q) => rwAttempts[q.id]).length;
  const practisedAny = sessions.some((s) => s.mode === 'drill' || s.mode === 'lesson') || rwPractised > mix1Answered;
  const mocked = sessions.some((s) => s.mode === 'mock');

  const dash = '—';
  const status: Record<string, string> = {
    diagnose: L(
      `Math: ${diagnostic ? `đúng ${diagnostic.reading.correct}/${diagnostic.reading.total}` : dash} · Verbal: ${mix1Answered > 0 ? `đúng ${mix1Correct}/${mix1.questions.length}` : dash}`,
      `Math: ${diagnostic ? `${diagnostic.reading.correct}/${diagnostic.reading.total} correct` : dash} · Verbal: ${mix1Answered > 0 ? `${mix1Correct}/${mix1.questions.length} correct` : dash}`,
    ),
    learn: L(
      `Đã học: Math ${mathLessons}/${MATH_LESSONS.length} · Verbal ${verbalLessons}/${VERBAL_LESSONS.length} bài`,
      `Lessons done: Math ${mathLessons}/${MATH_LESSONS.length} · Verbal ${verbalLessons}/${VERBAL_LESSONS.length}`,
    ),
    practice: L(
      `Đã làm: Math ${mathPractised}/${MATH_BANK_TOTAL} · Verbal ${rwPractised}/${SAT_RW_QUESTIONS.length} câu`,
      `Answered: Math ${mathPractised}/${MATH_BANK_TOTAL} · Verbal ${rwPractised}/${SAT_RW_QUESTIONS.length}`,
    ),
    test: L(
      `Điểm Math ước lượng gần nhất: ${totals.latestMockScore ?? dash}`,
      `Latest estimated Math score: ${totals.latestMockScore ?? dash}`,
    ),
  };
  const started: Record<string, boolean> = {
    diagnose: !!diagnostic || mix1Answered > 0,
    learn: mathLessons + verbalLessons > 0,
    practice: practisedAny,
    test: mocked,
  };
  // Trước hydrate chưa đọc được dữ liệu máy — không đánh dấu bước nào để khỏi nhảy.
  const nextId = hydrated ? (SAT_PATH_STEPS.find((s) => !started[s.id])?.id ?? null) : null;

  return (
    <Screen>
      <View className="w-full self-center" style={{ maxWidth: 1080, gap: 16 }}>
        <SatFocusPicker />

        <Guide />

        {/* ------------------------------------------------ bốn bước */}
        <NeonWindow title={L('Lộ trình 4 bước', '4-step path')} icon="rocket" padded={false}>
          {SAT_PATH_STEPS.map((step, i) => (
            <View
              key={step.id}
              style={{
                flexDirection: wide ? 'row' : 'column',
                alignItems: wide ? 'center' : 'stretch',
                gap: wide ? 18 : 10,
                padding: wide ? 18 : 14,
                borderTopWidth: i === 0 ? 0 : 2,
                borderColor: '#E9E4FF',
                backgroundColor: nextId === step.id ? '#F6F2FF' : '#FFFFFF',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: wide ? 1 : undefined, minWidth: 0 }}>
                <View style={{ width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: STEP_COLORS[i % STEP_COLORS.length], borderWidth: 2, borderColor: 'rgba(255,255,255,0.7)', ...({ boxShadow: '0 4px 0 rgba(42,34,181,0.35)' } as object) }}>
                  <PixelText size={40}>{step.n}</PixelText>
                </View>
                <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                  <View className="flex-row flex-wrap items-center gap-2">
                    <Text className="font-heavy" style={{ fontSize: 18, lineHeight: 24, color: B9.navy }}>
                      {en ? step.title.en : step.title.vi}
                    </Text>
                    {nextId === step.id ? (
                      <View style={{ borderRadius: 8, paddingHorizontal: 8, paddingTop: 1, backgroundColor: '#FFD84A' }}>
                        <PixelText size={18} color="#2B1D00">
                          {L('TIẾP', 'NEXT')}
                        </PixelText>
                      </View>
                    ) : null}
                  </View>
                  <Text className="font-semi" style={{ fontSize: 13, lineHeight: 19, color: B9.muted }}>
                    {hydrated ? status[step.id] : dash}
                  </Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 12 }}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => go(step.primary.href)}
                  style={({ hovered, pressed }: { hovered?: boolean; pressed?: boolean }) =>
                    ({ flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 46, paddingLeft: 18, paddingRight: 8, borderRadius: 23, backgroundColor: hovered ? '#3A31C8' : '#2A22B5', borderWidth: 2, borderColor: '#8F84FF', transform: [{ translateY: pressed ? 3 : 0 }], boxShadow: pressed ? '0 1px 0 #1A1566' : '0 4px 0 #1A1566' }) as object
                  }
                >
                  <Text className="font-nun-heavy" style={{ fontSize: 15, color: '#FFFFFF' }}>
                    {en ? step.primary.en : step.primary.vi}
                  </Text>
                  <NeonIcon name="next" height={30} />
                </Pressable>
                {step.more.map((m) => (
                  <MoreLink key={m.href} link={m} />
                ))}
              </View>
            </View>
          ))}
        </NeonWindow>

        <Grid columns={2} tabletColumns={2} mobileColumns={1} gap={14}>
          <NeonTile
            title={L('Luyện 50 đề', '50 practice forms')}
            sub={L('Math · Reading & Writing · full đề', 'Math · Reading & Writing · full test')}
            chip="SAT"
            index="50"
            icon="trophy"
            palette={NEON_PALETTES.lime!}
            minHeight={wide ? 190 : 170}
            onPress={() => go('/sat/practice-tests')}
          />
          <NeonTile
            title={L('Theo trình độ', 'By level')}
            sub={L('~1000 · ~1200 · 1400+', '~1000 · ~1200 · 1400+')}
            chip="LEVEL"
            index="03"
            icon="crown"
            palette={NEON_PALETTES.gold!}
            minHeight={wide ? 190 : 170}
            onPress={() => go(SAT_LEVELS_LINK.href)}
          />
        </Grid>
      </View>
    </Screen>
  );
}

/** Hướng dẫn cách dùng: năm gạch đầu dòng, gập được; lần đầu vào thì mở sẵn. */
function Guide() {
  const { L } = useL();
  const hydrated = useHydrated();
  const stored = useSatGuideStore((s) => s.open);
  const setOpen = useSatGuideStore((s) => s.setOpen);
  const markSeen = useSatGuideStore((s) => s.markSeen);
  // Đọc "đã từng vào chưa" MỘT lần lúc mở trang, trước khi đánh dấu đã vào.
  const [firstVisit] = useState(() => !useSatGuideStore.getState().seen);
  useEffect(() => {
    markSeen();
  }, [markSeen]);
  const open = hydrated ? (stored ?? firstVisit) : false;

  const tips = useMemo(
    () => [
      L('Làm bài chẩn đoán Math 19 câu để biết kỹ năng yếu.', 'Take the 19-question Math diagnostic to find weak skills.'),
      L('Học bài lý thuyết của kỹ năng yếu nhất trước.', 'Study the lesson for your weakest skill first.'),
      L('Luyện bộ Dễ → Vừa → Khó; đúng 80% mới lên bậc.', 'Practise Easy → Medium → Hard; move up at 80% correct.'),
      L('Sai câu nào, đọc lời giải câu đó ngay.', 'Read the explanation of every miss right away.'),
      L('Hai, ba tuần thi thử một lần để đo tiến bộ.', 'Take a mock every two or three weeks to measure progress.'),
    ],
    [L],
  );

  return (
    <NeonWindow title={L('Hướng dẫn', 'How to use')} icon="bolt" badge={open ? '−' : '+'} padded={false}>
      <Pressable accessibilityRole="button" aria-expanded={open} onPress={() => setOpen(!open)} style={{ paddingHorizontal: 18, paddingVertical: open ? 6 : 12 }}>
        {open ? (
          <View style={{ paddingVertical: 8, gap: 8 }}>
            {tips.map((t, i) => (
              <View key={i} className="flex-row items-start gap-3">
                <PixelText size={22} color="#6A3FE0" style={{ width: 18 }}>
                  {i + 1}
                </PixelText>
                <Text className="min-w-0 flex-1 font-sans" style={{ fontSize: 14, lineHeight: 21, color: B9.navy }}>
                  {t}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <Text className="font-sans" style={{ fontSize: 13, color: B9.muted }}>
            {L('Bấm để xem cách dùng', 'Tap to see how to use it')}
          </Text>
        )}
      </Pressable>
    </NeonWindow>
  );
}
