import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { useHydrated } from '@/components/layout/useHydrated';
import { useWide } from '@/components/hsa/stage';
import { DailyPlanStage, type StageChip, type StageTask } from '@/components/today/DailyPlanStage';
import { Icon } from '@/components/ui/Icon';
import { HSA_QUESTION_BANK } from '@/data/hsa-bank';
import { bi, useL } from '@/i18n/useL';
import { restoreItems } from '@/services/hsa/attempts';
import { buildAutoPlan, buildContext, dayOrdinal, daysUntil, inferredDone, latestPerQuestion, scheduleTasks, type PlanTask, type PlanTaskType } from '@/services/hsa/plan';
import { fetchAiPlan } from '@/services/hsa/plan-client';
import { todayKey } from '@/store/persist';
import { useAuthStore } from '@/store/useAuthStore';
import { placementDone, useHsaStore } from '@/store/useHsaStore';

const INDEX = new Map(HSA_QUESTION_BANK.map((q) => [q.id, q]));

const TAG: Record<PlanTaskType, { vi: string; en: string; color: string }> = {
  placement: { vi: 'Test đầu vào', en: 'Entry test', color: '#3A8CFF' },
  kind: { vi: 'Luyện dạng câu', en: 'Question type', color: '#7C5CF0' },
  topic: { vi: 'Chủ điểm', en: 'Topic', color: '#22A06B' },
  mock: { vi: 'Thi thử', en: 'Mock paper', color: '#E5527B' },
  challenge: { vi: 'Thử thách', en: 'Challenge', color: '#F59E0B' },
  review: { vi: 'Chữa lỗi', en: 'Fix mistakes', color: '#E5484D' },
  vocab: { vi: 'Từ vựng', en: 'Vocabulary', color: '#6A4BD9' },
};

/**
 * BƯỚC 3: LỘ TRÌNH MỖI NGÀY — theo bố cục ảnh mẫu (số thứ tự lớn, một bài đang làm, bài tiếp theo).
 * Mỗi ngày kế hoạch được lập MỘT LẦN ở lần mở đầu tiên: nếu đã đăng nhập và làm xong bài test đầu vào
 * thì AI lập theo điểm yếu thật; còn lại dùng luật tự động. Có nút để AI lập lại (tính vào hạn mức AI).
 */
export default function HsaPlanScreen() {
  const { L, locale } = useL();
  const wide = useWide();
  const hydrated = useHydrated();
  const today = todayKey();
  const token = useAuthStore((s) => s.session?.access_token ?? null);

  const profile = useHsaStore((s) => s.profile);
  const attempts = useHsaStore((s) => s.attempts);
  const plan = useHsaStore((s) => s.plans[today]);
  const done = useHsaStore((s) => s.done);
  const setPlan = useHsaStore((s) => s.setPlan);
  const toggleTask = useHsaStore((s) => s.toggleTask);

  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (hydrated && !profile) router.replace('/hsa/setup' as never);
  }, [hydrated, profile]);

  const buildCtx = useCallback(() => {
    const s = useHsaStore.getState();
    const latest = latestPerQuestion(s.attempts.map((a) => restoreItems(a, INDEX)));
    const metas = s.attempts.map((a) => ({ activity: a.activity, day: todayKey(new Date(a.finishedAt)) }));
    return buildContext({ profile: s.profile!, day: today, latest, metas, placementDone: placementDone(s.attempts) });
  }, [today]);

  const generate = useCallback(
    async (ai: boolean, replace = false) => {
      if (!useHsaStore.getState().profile) return;
      setLoading(true);
      setNote(null);
      const ctx = buildCtx();
      let made = false;
      if (ai) {
        if (!token) setNote(L('Đăng nhập để AI lập kế hoạch theo điểm yếu của bạn. Hôm nay đang dùng kế hoạch tự động.', 'Sign in so the AI can plan around your weak spots. Using the automatic plan today.'));
        else if (!ctx.placementDone) setNote(L('Làm xong 5 phần bài test đầu vào để AI có số liệu lập kế hoạch.', 'Finish the 5-part entry test so the AI has data to plan with.'));
        else {
          const out = await fetchAiPlan(ctx, token);
          if (out.ok) {
            setPlan(today, out.plan);
            made = true;
          } else setNote(out.message);
        }
      }
      // Chưa có kế hoạch nào cho hôm nay thì luôn có một kế hoạch tự động để làm; `replace` thay kế hoạch cũ đã lỗi thời.
      if (!made && (replace || !useHsaStore.getState().plans[today])) setPlan(today, buildAutoPlan(ctx));
      setLoading(false);
    },
    [L, buildCtx, setPlan, today, token],
  );

  // Lần mở đầu tiên trong ngày: tự lập kế hoạch (AI nếu được, không thì luật tự động).
  useEffect(() => {
    if (!hydrated || !profile || plan || started.current) return;
    started.current = true;
    void generate(true);
  }, [hydrated, profile, plan, generate]);

  const doneToday = useMemo(() => attempts.filter((a) => todayKey(new Date(a.finishedAt)) === today).map((a) => a.activity), [attempts, today]);
  const placed = placementDone(attempts);

  // Kế hoạch đầu ngày lập khi chưa làm bài test (việc đầu tiên là "làm bài test"): làm xong test thì lập lại.
  const replanned = useRef(false);
  useEffect(() => {
    if (!hydrated || !profile || !plan || replanned.current) return;
    if (placed && plan.tasks.some((t) => t.type === 'placement')) {
      replanned.current = true;
      void generate(true, true);
    }
  }, [hydrated, profile, plan, placed, generate]);

  const tasks = plan?.tasks ?? [];
  const isDone = (t: PlanTask) => !!done[`${today}|${t.id}`] || inferredDone(t, doneToday, placed);
  const slots = profile ? scheduleTasks(tasks, profile.startTime) : [];

  const week = profile ? Math.floor((dayOrdinal(today) - dayOrdinal(todayKey(new Date(profile.createdAt)))) / 7) + 1 : 1;
  const exam = profile ? daysUntil(profile.examDate, today) : null;
  const dateLabel = new Date().toLocaleDateString(locale === 'en' ? 'en-GB' : 'vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit' });

  const stageTasks: StageTask[] = tasks.map((t, i) => ({
    id: t.id,
    tag: bi(TAG[t.type], locale),
    tagColor: TAG[t.type].color,
    title: bi(t.title, locale),
    why: bi(t.why, locale),
    minutes: t.minutes,
    range: slots[i] ? `${slots[i]!.start}–${slots[i]!.end}` : undefined,
    href: t.href,
    done: isDone(t),
    onToggle: () => toggleTask(today, t.id),
  }));
  const chips: StageChip[] = [
    ...(slots.length ? [{ label: `${slots[0]!.start}–${slots[slots.length - 1]!.end}`, icon: 'clock' as const }] : []),
    ...(exam !== null ? [{ label: exam >= 0 ? L(`Còn ${exam} ngày thi`, `${exam} days to exam`) : L('Đã qua ngày thi', 'Exam date passed'), icon: 'calendar' as const }] : []),
    { label: L('Tuỳ chỉnh', 'Edit'), onPress: () => router.push('/hsa/setup' as never) },
  ];

  return (
    <Screen>
      <View className="w-full self-center" style={{ maxWidth: 1080 }}>
        <DailyPlanStage
          wide={wide}
          dateLabel={`${dateLabel} · ${L('Tuần', 'Week')} ${week}`}
          headline={plan ? bi(plan.headline, locale) : loading ? L('Đang lập kế hoạch hôm nay…', 'Planning your day…') : L('Kế hoạch hôm nay', 'Today’s plan')}
          chips={chips}
          tasks={stageTasks}
          empty={
            <Text className="font-nun-strong" style={{ fontSize: 16, color: 'rgba(255,255,255,0.85)' }}>
              {!hydrated ? L('Đang tải…', 'Loading…') : loading ? L('AI đang đọc kết quả của bạn…', 'The AI is reading your results…') : L('Chưa có kế hoạch cho hôm nay.', 'No plan for today yet.')}
            </Text>
          }
          footer={
            <View style={{ alignItems: 'center', gap: 8 }}>
              {note ? (
                <Text className="font-nun-strong" style={{ fontSize: 13, lineHeight: 19, color: '#FFD84A', textAlign: 'center' }}>
                  {note}
                </Text>
              ) : null}
              <Pressable accessibilityRole="button" disabled={loading} onPress={() => void generate(true)} style={({ hovered }: { hovered?: boolean }) => ({ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, minHeight: 44, borderRadius: 22, backgroundColor: hovered ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.12)', opacity: loading ? 0.6 : 1 })}>
                <Icon name="sparkle" size={15} color="#FFD84A" strokeWidth={2.2} />
                <Text className="font-nun-heavy" style={{ fontSize: 14, color: '#FFFFFF' }}>
                  {loading ? L('Đang lập…', 'Planning…') : L('AI lập lại', 'Re-plan')}
                </Text>
              </Pressable>
            </View>
          }
        />
      </View>
    </Screen>
  );
}
