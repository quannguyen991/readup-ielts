import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';

import { Screen } from '@/components/layout/Screen';
import { useHydrated } from '@/components/layout/useHydrated';
import { B9 } from '@/components/practice/SkillBank';
import { HubTitle, MoreLink, NextTag, PaperSheet, PrimaryButton, go } from '@/components/sat-hub/SatHub';
import { Icon } from '@/components/ui/Icon';
import { MATH_LESSONS } from '@/data/lessons/math-lessons';
import { VERBAL_LESSONS } from '@/data/lessons/verbal-lessons';
import { SAT_RW_QUESTIONS } from '@/data/sat-rw-repository';
import { useL } from '@/i18n/useL';
import { SAT_LEVELS_LINK, SAT_PATH_STEPS } from '@/navigation/sat-hub';
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
      <View className="w-full self-center" style={{ maxWidth: 1080 }}>
        <HubTitle
          eyebrow="DIGITAL SAT"
          title={L('Ôn SAT theo bốn bước', 'Your SAT in four steps')}
          line={L('Đi lần lượt từ trên xuống; mỗi bước một nút.', 'Work top to bottom; one button per step.')}
        />

        <Guide />

        {/* ------------------------------------------------ phiếu bốn bước */}
        <PaperSheet style={{ marginTop: 16, paddingHorizontal: wide ? 24 : 16, paddingVertical: 4 }}>
          {SAT_PATH_STEPS.map((step, i) => (
            <View
              key={step.id}
              style={{
                flexDirection: wide ? 'row' : 'column',
                gap: wide ? 20 : 6,
                paddingVertical: 18,
                borderTopWidth: i === 0 ? 0 : 1,
                borderColor: B9.line,
              }}
            >
              <Text
                className="font-heavy"
                style={{ width: wide ? 40 : undefined, fontSize: wide ? 22 : 13, lineHeight: wide ? 28 : 16, letterSpacing: wide ? 0 : 1.6, color: B9.gold }}
              >
                {step.n}
              </Text>
              <View style={{ flex: wide ? 1 : undefined, minWidth: 0 }}>
                <View className="flex-row flex-wrap items-center gap-2">
                  <Text className="font-heavy" style={{ fontSize: 19, lineHeight: 26, color: B9.navy }}>
                    {en ? step.title.en : step.title.vi}
                  </Text>
                  {nextId === step.id ? <NextTag label={L('Bước tiếp theo', 'Next step')} /> : null}
                </View>
                <Text className="font-sans" style={{ marginTop: 2, fontSize: 14, lineHeight: 20, color: B9.muted }}>
                  {en ? step.line.en : step.line.vi}
                </Text>
                <Text className="font-semi" style={{ marginTop: 6, fontSize: 13, lineHeight: 19, color: B9.navy }}>
                  {hydrated ? status[step.id] : dash}
                </Text>
                <View className="flex-row flex-wrap items-center" style={{ marginTop: 12, columnGap: 16, rowGap: 6 }}>
                  <PrimaryButton label={en ? step.primary.en : step.primary.vi} onPress={() => go(step.primary.href)} />
                  {step.more.map((m) => (
                    <MoreLink key={m.href} link={m} />
                  ))}
                </View>
              </View>
            </View>
          ))}
        </PaperSheet>

        <Pressable
          accessibilityRole="link"
          onPress={() => go('/sat/practice-tests')}
          style={({ hovered }: { hovered?: boolean }) => ({
            marginTop: 12,
            borderRadius: 16,
            borderWidth: 1.5,
            borderColor: B9.line,
            backgroundColor: '#FFFFFF',
            paddingHorizontal: 18,
            paddingVertical: 14,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            opacity: hovered ? 0.86 : 1,
          })}
        >
          <Icon name="clipboard" size={20} color={B9.goldDeep} strokeWidth={2.2} />
          <View className="min-w-0 flex-1">
            <Text className="font-heavy" style={{ fontSize: 16, color: B9.navy }}>{L('50 bộ đề luyện SAT', '50 SAT practice forms')}</Text>
            <Text className="font-sans" style={{ marginTop: 2, fontSize: 13, lineHeight: 18, color: B9.muted }}>{L('Chọn Math, Reading and Writing hoặc full đề.', 'Choose Math, Reading and Writing, or the full test.')}</Text>
          </View>
          <Icon name="arrow-right" size={18} color={B9.goldDeep} strokeWidth={2.4} />
        </Pressable>

        {/* ------------------------------------------- sang Lộ trình học theo mức */}
        <Pressable
          accessibilityRole="link"
          onPress={() => go(SAT_LEVELS_LINK.href)}
          style={({ hovered }: { hovered?: boolean }) => ({
            marginTop: 16,
            borderRadius: 18,
            backgroundColor: B9.navy,
            paddingHorizontal: 20,
            paddingVertical: 16,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 14,
            opacity: hovered ? 0.94 : 1,
          })}
        >
          <View className="min-w-0 flex-1">
            <Text className="font-strong" style={{ fontSize: 11, letterSpacing: 1.6, color: B9.goldLight }}>
              {L('THEO TRÌNH ĐỘ', 'BY LEVEL')}
            </Text>
            <Text className="font-heavy" style={{ marginTop: 2, fontSize: 17, lineHeight: 23, color: '#FFFFFF' }}>
              {en ? SAT_LEVELS_LINK.en : SAT_LEVELS_LINK.vi}
            </Text>
            <Text className="font-sans" style={{ marginTop: 2, fontSize: 13, color: 'rgba(255,255,255,0.72)' }}>
              {L('Ba mức ~1000 · ~1200 · 1400+, xếp sẵn từng bài.', 'Three levels ~1000 · ~1200 · 1400+, lessons laid out.')}
            </Text>
          </View>
          <Icon name="arrow-right" size={20} color={B9.goldLight} strokeWidth={2.4} />
        </Pressable>
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
    <PaperSheet style={{ marginTop: 18 }}>
      <Pressable
        accessibilityRole="button"
        aria-expanded={open}
        onPress={() => setOpen(!open)}
        className="flex-row items-center gap-3"
        style={{ paddingHorizontal: 18, paddingVertical: 12 }}
      >
        <Icon name="info" size={16} color={B9.goldDeep} />
        <Text className="min-w-0 flex-1 font-heavy" style={{ fontSize: 16, color: B9.navy }}>
          {L('Hướng dẫn', 'How to use')}
        </Text>
        <Text className="font-heavy" style={{ fontSize: 18, color: B9.goldDeep }}>
          {open ? '−' : '+'}
        </Text>
      </Pressable>
      {open ? (
        <View style={{ borderTopWidth: 1, borderColor: B9.line, paddingHorizontal: 18, paddingVertical: 12, gap: 8 }}>
          {tips.map((t, i) => (
            <View key={i} className="flex-row items-start gap-3">
              <Text className="font-heavy" style={{ width: 18, fontSize: 14, lineHeight: 21, color: B9.gold }}>
                {i + 1}
              </Text>
              <Text className="min-w-0 flex-1 font-sans" style={{ fontSize: 14, lineHeight: 21, color: B9.navy }}>
                {t}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </PaperSheet>
  );
}
