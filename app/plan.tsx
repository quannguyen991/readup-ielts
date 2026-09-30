import React, { useMemo, useState } from 'react';
import { Platform, Pressable, Text, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';

import { Grid } from '@/components/layout/Grid';
import { Screen } from '@/components/layout/Screen';
import { Appear, CrossFade } from '@/components/motion/Motion';
import { PlanBlockRow, SKILL_TONE } from '@/components/plan/PlanBlockRow';
import { TemplatePlan } from '@/components/plan/TemplatePlan';
import { Badge, CuteBook, CuteCalendar, CuteClock, CuteCloud, CutePencil, type BadgeIcon } from '@/components/illust/Cute';
import { CuteFlame, CutePlant, CuteRocket, CuteTrophy, Motion, Sparkles } from '@/components/illust/CuteMore';
import { Button, Card, Icon, SectionHeader } from '@/components/ui';
import {
  PHASE_LABEL,
  SKILL_LABEL,
  WEEKDAY_LABEL,
  blocksOn,
  daysBetween,
  nextStudyDayIso,
  planWeekOf,
  validatePlanInput,
  type CustomPlan,
  type GoalInput,
  type Phase,
  type PlanInput,
  type Skill,
} from '@/services/plan/custom';
import { todayKey } from '@/store/persist';
import { useCustomPlan, useRoadmapStore } from '@/store/useRoadmapStore';
import { color, gradient } from '@/theme/tokens';

/**
 * LỘ TRÌNH CỦA TÔI — dựng theo đúng mục tiêu người học khai.
 *
 * Ba trạng thái, trên cùng một đường dẫn:
 *   - chưa khai (hoặc `?sua=1`): form 6 câu hỏi → lập lộ trình;
 *   - đã khai: hôm nay học gì, cả tuần, các giai đoạn và cửa kiểm tra;
 *   - `?mau=1`: lộ trình mẫu 60 tuần cũ, ghi rõ là MẪU.
 *
 * Người dùng bắt sửa 26/09/2026: lộ trình cũ là của riêng người làm app mà hiện
 * cho mọi người ("Tuần 3/60" với người vừa mở app). Luật chia giờ ở
 * `services/plan/custom.ts`.
 */
export default function PlanScreen() {
  const { sua, mau } = useLocalSearchParams<{ sua?: string; mau?: string }>();
  const input = useRoadmapStore((s) => s.input);
  const plan = useCustomPlan();

  if (mau) return <TemplatePlan />;

  return (
    <Screen>
      <CrossFade swapKey={!input || sua ? 'setup' : 'plan'}>
        {!input || sua || !plan ? <PlanSetup initial={input} /> : <MyPlan input={input} plan={plan} />}
      </CrossFade>
    </Screen>
  );
}

/* ================================================================ FORM */

const IELTS_NOW = [4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5];
const IELTS_TARGET = [5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5];
const SAT_NOW = [800, 900, 1000, 1100, 1200, 1300, 1400, 1500];
const SAT_TARGET = [1000, 1100, 1200, 1300, 1350, 1400, 1450, 1500, 1550];
const MINUTES = [30, 45, 60, 90, 120, 150];
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

function addDaysIso(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function fmtDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

function PlanSetup({ initial }: { initial: PlanInput | null }) {
  const setInput = useRoadmapStore((s) => s.setInput);
  const today = todayKey();
  const [ielts, setIelts] = useState<GoalInput | null>(initial?.ielts ?? null);
  const [sat, setSat] = useState<GoalInput | null>(initial?.sat ?? null);
  const [minutes, setMinutes] = useState(initial?.minutesPerDay ?? 60);
  const [days, setDays] = useState<number[]>(initial?.studyDays ?? [1, 2, 3, 4, 5, 6]);
  const [weak, setWeak] = useState<Skill[]>(initial?.weak ?? []);
  const [tried, setTried] = useState(false);

  const draft: PlanInput = { ielts, sat, minutesPerDay: minutes, studyDays: days, weak, startIso: today };
  const problems = validatePlanInput(draft);
  const skills: Skill[] = [...(ielts ? (['reading', 'listening', 'writing'] as Skill[]) : []), ...(sat ? (['math', 'verbal'] as Skill[]) : [])];

  const submit = () => {
    setTried(true);
    if (problems.length > 0) return;
    setInput({ ...draft, weak: weak.filter((w) => skills.includes(w)) });
    router.replace('/plan' as never);
  };

  return (
    <View className="pb-8">
      <Appear>
        <LinearGradient colors={[...gradient.hero]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: 22, padding: 22 }}>
          <Text className="font-strong text-label uppercase text-white/75">Lộ trình của tôi</Text>
          <Text className="mt-1 font-heavy text-white" style={{ fontSize: 32, lineHeight: 38 }}>
            {initial ? 'Sửa lộ trình' : 'Lập lộ trình theo mục tiêu của bạn'}
          </Text>
          <Text className="mt-2 font-sans text-body text-white/85" style={{ maxWidth: 620 }}>
            Trả lời vài câu dưới đây. App chia giờ theo khoảng cách tới điểm mục tiêu và số tuần còn lại, mỗi buổi dẫn vào đúng bài
            trong app. Chưa biết điểm hiện tại cũng được.
          </Text>
        </LinearGradient>
      </Appear>

      <Card className="mt-4">
        <Question no={1} title="Bạn thi gì?" hint="Chọn một hoặc cả hai.">
          <View className="flex-row flex-wrap gap-3">
            <ExamToggle
              label="IELTS"
              sub="Reading, Listening, Writing, từ vựng"
              on={!!ielts}
              onPress={() => setIelts(ielts ? null : { now: null, target: 6.5, examIso: '' })}
            />
            <ExamToggle
              label="SAT"
              sub="Math, Reading & Writing"
              on={!!sat}
              onPress={() => setSat(sat ? null : { now: null, target: 1400, examIso: '' })}
            />
          </View>
        </Question>

        {ielts ? (
          <Question no={2} title="IELTS: bây giờ, mục tiêu, ngày thi">
            <GoalFields
              nowOptions={IELTS_NOW}
              targetOptions={IELTS_TARGET}
              value={ielts}
              onChange={setIelts}
              format={(v) => v.toFixed(1)}
              minDate={addDaysIso(today, 14)}
            />
          </Question>
        ) : null}

        {sat ? (
          <Question no={ielts ? 3 : 2} title="SAT: bây giờ, mục tiêu, ngày thi">
            <GoalFields
              nowOptions={SAT_NOW}
              targetOptions={SAT_TARGET}
              value={sat}
              onChange={setSat}
              format={(v) => String(v)}
              minDate={addDaysIso(today, 14)}
            />
          </Question>
        ) : null}

        <Question no={2 + (ielts ? 1 : 0) + (sat ? 1 : 0)} title="Mỗi ngày học bao lâu?" hint="Tính cả thời gian làm bài trong app.">
          <View className="flex-row flex-wrap gap-2">
            {MINUTES.map((m) => (
              <Pill key={m} label={m < 60 ? `${m} phút` : `${m / 60 === Math.floor(m / 60) ? m / 60 : (m / 60).toFixed(1).replace('.', ',')} giờ`} active={minutes === m} onPress={() => setMinutes(m)} />
            ))}
          </View>
        </Question>

        <Question no={3 + (ielts ? 1 : 0) + (sat ? 1 : 0)} title="Học những ngày nào?" hint="Ngày không chọn là ngày nghỉ, lộ trình không xếp bài.">
          <View className="flex-row flex-wrap gap-2">
            {WEEK_ORDER.map((d) => (
              <Pill
                key={d}
                label={WEEKDAY_LABEL[d]!}
                active={days.includes(d)}
                onPress={() => setDays(days.includes(d) ? days.filter((x) => x !== d) : [...days, d])}
              />
            ))}
          </View>
        </Question>

        {skills.length > 0 ? (
          <Question no={4 + (ielts ? 1 : 0) + (sat ? 1 : 0)} title="Phần nào bạn thấy yếu?" hint="Phần yếu được thêm giờ. Không chọn cũng được." last>
            <View className="flex-row flex-wrap gap-2">
              {skills.map((s) => (
                <Pill key={s} label={SKILL_LABEL[s]} active={weak.includes(s)} onPress={() => setWeak(weak.includes(s) ? weak.filter((x) => x !== s) : [...weak, s])} />
              ))}
            </View>
          </Question>
        ) : null}
      </Card>

      {tried && problems.length > 0 ? (
        <View className="mt-3 gap-1 rounded-card bg-warning-soft p-3">
          {problems.map((p) => (
            <View key={p} className="flex-row items-start gap-2">
              <Icon name="info" size={15} color={color.warning} />
              <Text className="flex-1 font-sans text-label text-ink">{p}</Text>
            </View>
          ))}
        </View>
      ) : null}

      <View className="mt-4 flex-row flex-wrap items-center gap-3">
        <Button label={initial ? 'Lập lại lộ trình' : 'Lập lộ trình'} variant="brand" iconRight="arrow-right" onPress={submit} />
        {initial ? <Button label="Huỷ" variant="outline" onPress={() => router.replace('/plan' as never)} /> : null}
        <Pressable accessibilityRole="link" onPress={() => router.push('/plan?mau=1' as never)}>
          <Text className="font-semi text-label text-ink" style={{ opacity: 0.75 }}>
            Xem lộ trình mẫu 60 tuần →
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function Question({ no, title, hint, last, children }: { no: number; title: string; hint?: string; last?: boolean; children: React.ReactNode }) {
  return (
    <View className={last ? 'py-3' : 'border-b py-4'} style={{ borderColor: '#EEF0F6' }}>
      <View className="flex-row items-center gap-2.5">
        <View className="h-7 min-w-7 items-center justify-center rounded-lg px-1.5" style={{ backgroundColor: '#EEF2FF' }}>
          <Text className="font-heavy text-label" style={{ color: color.primary }}>
            {no}
          </Text>
        </View>
        <Text className="font-heavy text-cardTitle text-ink">{title}</Text>
      </View>
      {hint ? <Text className="ml-9 mt-0.5 font-sans text-label text-muted">{hint}</Text> : null}
      <View className="ml-9 mt-3">{children}</View>
    </View>
  );
}

function ExamToggle({ label, sub, on, onPress }: { label: string; sub: string; on: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      aria-checked={on}
      onPress={onPress}
      className="flex-row items-center gap-3 rounded-2xl px-4 py-3"
      style={{ minWidth: 220, borderWidth: 1.5, borderColor: on ? color.primary : '#E0E4F0', backgroundColor: on ? '#EEF2FF' : '#FFFFFF' }}
    >
      <View className="h-6 w-6 items-center justify-center rounded-md" style={{ backgroundColor: on ? color.primary : '#FFFFFF', borderWidth: on ? 0 : 1.5, borderColor: '#C7CCE0' }}>
        {on ? <Icon name="check" size={14} color="#FFFFFF" strokeWidth={2.8} /> : null}
      </View>
      <View>
        <Text className="font-heavy text-body text-ink">{label}</Text>
        <Text className="font-sans text-label text-muted">{sub}</Text>
      </View>
    </Pressable>
  );
}

function Pill({ label, active, onPress, disabled }: { label: string; active: boolean; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      aria-selected={active}
      disabled={disabled}
      onPress={onPress}
      className="rounded-pill px-3.5 py-1.5"
      style={{
        borderWidth: 1,
        borderColor: active ? color.primary : '#E0E4F0',
        backgroundColor: active ? color.primary : '#FFFFFF',
        opacity: disabled ? 0.35 : 1,
      }}
    >
      <Text className="font-semi text-label" style={{ color: active ? '#FFFFFF' : color.ink }}>
        {label}
      </Text>
    </Pressable>
  );
}

function GoalFields({
  nowOptions,
  targetOptions,
  value,
  onChange,
  format,
  minDate,
}: {
  nowOptions: number[];
  targetOptions: number[];
  value: GoalInput;
  onChange: (v: GoalInput) => void;
  format: (v: number) => string;
  minDate: string;
}) {
  return (
    <View className="gap-3">
      <View>
        <Text className="mb-1.5 font-semi text-label text-muted">Điểm bây giờ</Text>
        <View className="flex-row flex-wrap gap-2">
          <Pill label="Chưa biết" active={value.now === null} onPress={() => onChange({ ...value, now: null })} />
          {nowOptions.map((v) => (
            <Pill key={v} label={format(v)} active={value.now === v} onPress={() => onChange({ ...value, now: v, target: value.target > v ? value.target : (targetOptions.find((t) => t > v) ?? value.target) })} />
          ))}
        </View>
      </View>
      <View>
        <Text className="mb-1.5 font-semi text-label text-muted">Điểm muốn đạt</Text>
        <View className="flex-row flex-wrap gap-2">
          {targetOptions.map((v) => (
            <Pill key={v} label={format(v)} active={value.target === v} disabled={value.now !== null && v <= value.now} onPress={() => onChange({ ...value, target: v })} />
          ))}
        </View>
      </View>
      <View>
        <Text className="mb-1.5 font-semi text-label text-muted">Ngày thi (dự kiến cũng được)</Text>
        <DateField value={value.examIso} min={minDate} onChange={(iso) => onChange({ ...value, examIso: iso })} />
      </View>
    </View>
  );
}

function DateField({ value, min, onChange }: { value: string; min: string; onChange: (iso: string) => void }) {
  const style = { height: 42, borderWidth: 1, borderColor: '#E0E4F0', borderRadius: 12, paddingLeft: 12, paddingRight: 12, fontSize: 15, color: color.ink, backgroundColor: '#FFFFFF', maxWidth: 220 };
  if (Platform.OS === 'web') {
    return React.createElement('input', {
      type: 'date',
      value,
      min,
      'aria-label': 'Ngày thi',
      onChange: (e: { target: { value: string } }) => onChange(e.target.value),
      style: { ...style, fontFamily: 'inherit', borderStyle: 'solid' },
    });
  }
  return <TextInput value={value} onChangeText={onChange} placeholder="YYYY-MM-DD" style={style} />;
}

/* ================================================================ LỘ TRÌNH */

const PHASE_ORDER: Phase[] = ['nen', 'dang', 'de', 'nuoc-rut'];

function MyPlan({ input, plan }: { input: PlanInput; plan: CustomPlan }) {
  const today = todayKey();
  const current = Math.min(Math.max(planWeekOf(input, today), 1), plan.totalWeeks);
  const [shown, setShown] = useState(current);
  const week = plan.weeks[shown - 1] ?? plan.weeks[0]!;
  const todayBlocks = blocksOn(plan, today);
  const next = todayBlocks.length === 0 ? nextStudyDayIso(plan, today) : null;
  const done = useRoadmapStore((s) => s.done);

  const goals = (['ielts', 'sat'] as const).filter((g) => input[g]);
  const doneThisWeek = week.days.flatMap((d) => d.blocks).filter((b) => done[b.id]).length;
  const totalThisWeek = week.days.flatMap((d) => d.blocks).length;

  const ranges = useMemo(() => {
    const out: { goal: 'ielts' | 'sat'; phase: Phase; from: number; to: number }[] = [];
    for (const g of goals) {
      for (const w of plan.weeks) {
        const p = w.phases[g];
        if (!p) continue;
        const last = [...out].reverse().find((r) => r.goal === g);
        if (last && last.phase === p) last.to = w.week;
        else out.push({ goal: g, phase: p, from: w.week, to: w.week });
      }
    }
    return out;
  }, [goals, plan]);

  const checks = useMemo(
    () => plan.weeks.flatMap((w) => w.days.flatMap((d) => d.blocks.filter((b) => b.skill === 'check').map((b) => ({ iso: d.iso, block: b })))),
    [plan],
  );

  const skillTotal = Object.values(plan.minutesBySkill).reduce((a, b) => a + b, 0) || 1;

  // Thống kê nhanh cho hàng ô số (chỉ số thật từ lộ trình + dấu "đã làm").
  const allBlocks = plan.weeks.flatMap((w) => w.days.flatMap((d) => d.blocks));
  const doneAll = allBlocks.filter((b) => done[b.id]).length;
  const weekMinutes = week.days.flatMap((d) => d.blocks).reduce((a, b) => a + b.minutes, 0);
  const todayDone = todayBlocks.filter((b) => done[b.id]).length;

  return (
    <View className="pb-8" style={{ gap: 14 }}>
      {/* ------------------------------------------------ khối đầu (xanh) */}
      <Appear>
        <View style={{ borderRadius: 28, padding: 24, backgroundColor: '#4A7FE8', overflow: 'hidden' }}>
          <View style={{ position: 'absolute', right: -70, top: -70, width: 280, height: 280, borderRadius: 140, backgroundColor: 'rgba(255,255,255,0.10)' }} />
          <View style={{ position: 'absolute', right: 120, bottom: -90, width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(255,255,255,0.07)' }} />
          <Sparkles count={7} />
          <View className="flex-row flex-wrap items-start justify-between gap-4">
            <View className="min-w-0 flex-1" style={{ minWidth: 260 }}>
              <Text className="font-strong" style={{ fontSize: 13, letterSpacing: 2, color: 'rgba(255,255,255,0.85)' }}>
                LỘ TRÌNH CỦA BẠN · LẬP NGÀY {fmtDate(input.startIso)}
              </Text>
              <Text className="mt-2 font-heavy text-white" style={{ fontSize: 44, lineHeight: 50 }}>
                Tuần {current}
                <Text className="font-sans text-white/70" style={{ fontSize: 22 }}>
                  {' '}
                  / {plan.totalWeeks}
                </Text>
              </Text>
              <View className="mt-2 flex-row flex-wrap gap-2">
                <InfoPill glyph="⏱" text={`${input.minutesPerDay}'/ngày`} />
                <InfoPill glyph="📅" text={`${input.studyDays.length} ngày/tuần`} />
              </View>
            </View>
            <View className="items-end gap-2">
              <Button label="Sửa lộ trình" variant="outline" size="sm" onPress={() => router.push('/plan?sua=1' as never)} />
              <View className="flex-row items-end" style={{ gap: 6 }} aria-hidden>
                <Motion kind="float" delay={0.5}>
                  <CuteCloud size={64} />
                </Motion>
                <Motion kind="wobble">
                  <CuteCalendar size={70} />
                </Motion>
              </View>
            </View>
          </View>
          <View className="mt-5 flex-row flex-wrap gap-3">
            {goals.map((g) => {
              const gi = input[g]!;
              const fmt = (v: number) => (g === 'ielts' ? v.toFixed(1) : String(v));
              return (
                <View key={g} style={{ flexGrow: 1, flexBasis: 220, borderRadius: 20, padding: 16, backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                  <Motion kind="float" delay={g === 'sat' ? 0.6 : 0}>
                    {g === 'ielts' ? <CuteTrophy size={52} /> : <CuteRocket size={52} />}
                  </Motion>
                  <View style={{ flex: 1 }}>
                  <Text className="font-strong" style={{ fontSize: 12, letterSpacing: 1.4, color: '#64748B' }}>
                    {g === 'ielts' ? 'IELTS' : 'SAT'} · MỤC TIÊU
                  </Text>
                  <Text className="mt-1 font-heavy" style={{ fontSize: 30, color: '#0F172A' }}>
                    {fmt(gi.target)}
                    <Text className="font-sans" style={{ fontSize: 15, color: '#64748B' }}>
                      {'  '}← {gi.now === null ? '?' : fmt(gi.now)}
                    </Text>
                  </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </Appear>

      {/* ------------------------------------------------ hôm nay (xanh lá) + tuần này (tím) */}
      <Appear index={1}>
        <Grid columns={2} tabletColumns={1} mobileColumns={1} gap={14}>
          <View style={{ height: '100%', borderRadius: 28, padding: 20, backgroundColor: '#22A06B', overflow: 'hidden' }}>
            <Sparkles count={5} />
            <View className="flex-row items-start justify-between gap-3">
              <View className="min-w-0 flex-1">
                <Text className="font-heavy text-white" style={{ fontSize: 26 }}>
                  Hôm nay.
                </Text>
                <View className="mt-2 self-start rounded-pill px-3 py-1" style={{ backgroundColor: 'rgba(255,255,255,0.18)' }}>
                  <Text className="font-strong text-white" style={{ fontSize: 13 }}>
                    {todayBlocks.length > 0 ? `✓ ${todayDone}/${todayBlocks.length}` : '😴 Nghỉ'}
                  </Text>
                </View>
              </View>
              <View className="flex-row items-center" aria-hidden>
                <Motion kind="float">
                  <CuteBook size={64} />
                </Motion>
                <Motion kind="wobble" delay={0.3}>
                  <CutePencil size={52} />
                </Motion>
              </View>
            </View>
            <View className="mt-4 gap-2">
              {todayBlocks.length > 0 ? (
                todayBlocks.map((b) => <PlanBlockRow key={b.id} block={b} />)
              ) : next ? (
                <View className="rounded-2xl bg-white p-4">
                  <Text className="font-strong text-body text-ink">
                    Buổi học tiếp: {WEEKDAY_LABEL[next.weekday]} {fmtDate(next.iso)}
                  </Text>
                  <View className="mt-3 gap-2">
                    {next.blocks.map((b) => (
                      <PlanBlockRow key={b.id} block={b} compact />
                    ))}
                  </View>
                </View>
              ) : (
                <View className="rounded-2xl bg-white p-4">
                  <Text className="font-sans text-body text-ink">Lộ trình đã đi hết. Bấm “Sửa lộ trình” để đặt mục tiêu mới.</Text>
                </View>
              )}
            </View>
          </View>

          <View style={{ height: '100%', borderRadius: 28, padding: 20, backgroundColor: '#8A63D2', overflow: 'hidden' }}>
            <Sparkles count={5} />
            <View className="flex-row items-start justify-between gap-3">
              <View className="min-w-0 flex-1">
                <Text className="font-heavy text-white" style={{ fontSize: 26 }}>
                  Tuần này.
                </Text>
                <Text className="mt-1 font-sans" style={{ fontSize: 14, color: 'rgba(255,255,255,0.88)' }}>
                  {goals.map((g) => `${g === 'ielts' ? 'IELTS' : 'SAT'}: ${plan.weeks[current - 1]?.phases[g] ? PHASE_LABEL[plan.weeks[current - 1]!.phases[g]!] : 'đã thi'}`).join(' · ')}
                </Text>
              </View>
              <View aria-hidden className="flex-row items-end">
                <Motion kind="wobble">
                  <CuteFlame size={54} sleepy={doneThisWeek === 0} />
                </Motion>
                <Motion kind="float" delay={0.4}>
                  <CuteCloud size={58} />
                </Motion>
              </View>
            </View>
            <WeekDots week={plan.weeks[current - 1] ?? week} today={today} done={done} />
            <View className="mt-4 flex-row flex-wrap gap-2">
              <Tile value={`✓ ${doneThisWeek}/${totalThisWeek}`} label="khối" />
              <Tile value={`⏱ ${Math.round((weekMinutes / 60) * 10) / 10}h`} label="tuần này" />
            </View>
          </View>
        </Grid>
      </Appear>

      {/* ------------------------------------------------ ngày thi (cam) */}
      <Appear index={2}>
        <View style={{ borderRadius: 28, padding: 20, backgroundColor: '#F0703F', overflow: 'hidden' }}>
          <Sparkles count={6} />
          <View className="flex-row flex-wrap items-center justify-between gap-3">
            <Text className="font-heavy text-white" style={{ fontSize: 26 }}>
              Ngày thi.
            </Text>
            <View aria-hidden className="flex-row items-end" style={{ gap: 6 }}>
              <Motion kind="wobble">
                <CuteClock size={62} />
              </Motion>
              <Motion kind="float" delay={0.5}>
                <CutePlant size={56} />
              </Motion>
            </View>
          </View>
          <View className="mt-3 flex-row flex-wrap gap-3">
            {goals.map((g) => {
              const gi = input[g]!;
              const left = daysBetween(today, gi.examIso);
              const span = Math.max(1, daysBetween(input.startIso, gi.examIso));
              const gone = Math.min(1, Math.max(0, (span - Math.max(0, left)) / span));
              return (
                <View key={g} style={{ flexGrow: 1, flexBasis: 260, borderRadius: 20, padding: 16, backgroundColor: '#FFFFFF' }}>
                  <Text className="font-strong" style={{ fontSize: 12, letterSpacing: 1.4, color: '#C2410C' }}>
                    {g === 'ielts' ? 'IELTS' : 'SAT'} · {fmtDate(gi.examIso)}
                  </Text>
                  <Text className="mt-1 font-heavy" style={{ fontSize: 34, color: '#0F172A' }}>
                    {left > 0 ? left : left === 0 ? 'Hôm nay' : 'Đã thi'}
                    {left > 0 ? (
                      <Text className="font-sans" style={{ fontSize: 15, color: '#64748B' }}>
                        {' '}
                        ngày nữa
                      </Text>
                    ) : null}
                  </Text>
                  <View className="mt-2 h-2 overflow-hidden rounded-pill" style={{ backgroundColor: '#FDE2D6' }}>
                    <View style={{ height: 8, width: '100%', backgroundColor: '#F0703F', transform: [{ scaleX: gone }], transformOrigin: 'left' }} />
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </Appear>

      {/* ------------------------------------------------ ô số */}
      <Appear index={3}>
        <Grid columns={4} tabletColumns={2} mobileColumns={2} gap={12}>
          <StatTile icon="clock" tone="#F2B632" label="Tổng giờ" value={`${Math.round(plan.totalMinutes / 60)}h`} sub="" />
          <StatTile icon="check" tone="#22A06B" label="Đã làm" value={`${doneAll}/${allBlocks.length}`} sub="" />
          <StatTile icon="target" tone="#E0533D" label="Thi thử" value={`${checks.length}`} sub="" />
          <StatTile icon="star" tone="#4A7FE8" label="Hoàn thành" value={allBlocks.length ? `${Math.round((doneAll / allBlocks.length) * 100)}%` : '—'} sub="" />
        </Grid>
      </Appear>

      {/* ------------------------------------------------ cả tuần */}
      <Appear index={2}>
        <View className="mt-2 flex-row flex-wrap items-center justify-between gap-3">
          <SectionHeader
            title={`Tuần ${week.week}${week.week === current ? ' (tuần này)' : ''}`}
            subtitle={`${goals.map((g) => `${g === 'ielts' ? 'IELTS' : 'SAT'}: ${week.phases[g] ? PHASE_LABEL[week.phases[g]!] : 'đã thi'}`).join(' · ')} · đã làm ${doneThisWeek}/${totalThisWeek}`}
            icon="calendar"
          />
          <View className="flex-row gap-2">
            <Button label="Tuần trước" variant="outline" size="sm" disabled={shown <= 1} onPress={() => setShown((s) => Math.max(1, s - 1))} />
            {shown !== current ? <Button label="Tuần này" variant="outline" size="sm" onPress={() => setShown(current)} /> : null}
            <Button label="Tuần sau" variant="outline" size="sm" disabled={shown >= plan.totalWeeks} onPress={() => setShown((s) => Math.min(plan.totalWeeks, s + 1))} />
          </View>
        </View>
        {week.milestones.length > 0 ? (
          <View className="mt-2 flex-row flex-wrap gap-2">
            {week.milestones.map((m) => (
              <View key={m} className="flex-row items-center gap-1.5 rounded-pill px-3 py-1" style={{ backgroundColor: SKILL_TONE.check.soft }}>
                <Icon name="target" size={13} color={SKILL_TONE.check.tone} />
                <Text className="font-strong text-label" style={{ color: '#92400E' }}>
                  {m}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
        <CrossFade swapKey={`w${week.week}`}>
          <View className="mt-3 gap-3">
            {week.days.length === 0 ? (
              <Card>
                <Text className="font-sans text-body text-muted">Tuần này không có buổi học nào.</Text>
              </Card>
            ) : (
              week.days
                .filter((d) => d.blocks.length > 0)
                .map((d) => (
                  <View key={d.iso}>
                    <Text className="mb-1.5 font-heavy text-label text-ink" style={{ opacity: d.iso === today ? 1 : 0.75 }}>
                      {WEEKDAY_LABEL[d.weekday]} {fmtDate(d.iso)}
                      {d.iso === today ? ' · hôm nay' : ''}
                    </Text>
                    <View className="gap-1.5">
                      {d.blocks.map((b) => (
                        <PlanBlockRow key={b.id} block={b} compact />
                      ))}
                    </View>
                  </View>
                ))
            )}
          </View>
        </CrossFade>
      </Appear>

      {/* ------------------------------------------------ giai đoạn + chia giờ */}
      <View className="mt-6">
        <Grid columns={2} tabletColumns={1} mobileColumns={1} gap={14}>
          <Card className="h-full">
            <SectionHeader title="Các giai đoạn" subtitle="Nền → dạng → đề, cuối mỗi giai đoạn là một bài thi thử." icon="list" />
            <View className="mt-3 gap-2">
              {ranges
                .sort((a, b) => a.from - b.from || PHASE_ORDER.indexOf(a.phase) - PHASE_ORDER.indexOf(b.phase))
                .map((r) => {
                  const on = current >= r.from && current <= r.to;
                  return (
                    <View key={`${r.goal}-${r.phase}`} className="flex-row items-center gap-3 rounded-xl px-3 py-2" style={{ backgroundColor: on ? '#EEF2FF' : '#F7F8FC' }}>
                      <Text className="font-heavy text-label" style={{ width: 44, color: r.goal === 'ielts' ? SKILL_TONE.reading.tone : SKILL_TONE.math.tone }}>
                        {r.goal === 'ielts' ? 'IELTS' : 'SAT'}
                      </Text>
                      <Text className="flex-1 font-strong text-body text-ink">{PHASE_LABEL[r.phase]}</Text>
                      <Text className="font-mid text-label text-muted">
                        Tuần {r.from}
                        {r.to !== r.from ? `–${r.to}` : ''}
                      </Text>
                    </View>
                  );
                })}
            </View>
            {checks.length > 0 ? (
              <View className="mt-4">
                <Text className="font-strong text-label text-ink">Cửa kiểm tra</Text>
                {checks.map((c) => (
                  <Text key={c.block.id} className="mt-1 font-sans text-label text-muted">
                    {fmtDate(c.iso)} · {c.block.title}
                  </Text>
                ))}
              </View>
            ) : null}
          </Card>

          <Card className="h-full">
            <SectionHeader title="Chia thời gian" subtitle={`Tổng ${Math.round(plan.totalMinutes / 60)} giờ tới ngày thi.`} icon="gauge" />
            <View className="mt-3 gap-2.5">
              {(Object.keys(plan.minutesBySkill) as Skill[])
                .filter((s) => plan.minutesBySkill[s] > 0)
                .sort((a, b) => plan.minutesBySkill[b] - plan.minutesBySkill[a])
                .map((s) => {
                  const share = plan.minutesBySkill[s] / skillTotal;
                  return (
                    <View key={s}>
                      <View className="flex-row justify-between">
                        <Text className="font-semi text-label text-ink">
                          {SKILL_LABEL[s]}
                          {input.weak.includes(s) ? ' · phần yếu' : ''}
                        </Text>
                        <Text className="font-mid text-label text-muted">
                          {Math.round(plan.minutesBySkill[s] / 60)} giờ · {Math.round(share * 100)}%
                        </Text>
                      </View>
                      <View className="mt-1 h-2 overflow-hidden rounded-pill" style={{ backgroundColor: '#EEF0F6' }}>
                        <View style={{ height: 8, width: '100%', backgroundColor: SKILL_TONE[s].tone, transform: [{ scaleX: share }], transformOrigin: 'left' }} />
                      </View>
                    </View>
                  );
                })}
            </View>
          </Card>
        </Grid>
      </View>
    </View>
  );
}

/** Bảy ngày trong tuần (T2 → CN): đã học xong / hôm nay / bỏ lỡ / chưa tới / nghỉ. */
function WeekDots({ week, today, done }: { week: CustomPlan['weeks'][number]; today: string; done: Record<string, unknown> }) {
  const byIso = new Map(week.days.map((d) => [d.iso, d]));
  return (
    <View className="mt-4 flex-row justify-between rounded-2xl px-3 py-3" style={{ backgroundColor: 'rgba(255,255,255,0.14)' }}>
      {Array.from({ length: 7 }, (_, i) => {
        const iso = addDaysIso(week.startIso, i);
        const day = byIso.get(iso);
        const study = !!day && day.blocks.length > 0;
        const complete = study && day!.blocks.every((b) => done[b.id]);
        const missed = study && !complete && iso < today;
        const isToday = iso === today;
        const weekday = new Date(`${iso}T00:00:00.000Z`).getUTCDay();
        return (
          <View key={iso} className="items-center" style={{ gap: 6 }}>
            <View
              accessibilityLabel={`${WEEKDAY_LABEL[weekday]}: ${!study ? 'nghỉ' : complete ? 'đã học xong' : missed ? 'bỏ lỡ' : 'chưa học'}`}
              style={{
                width: 30,
                height: 30,
                borderRadius: 15,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: complete ? '#FFFFFF' : 'transparent',
                borderWidth: 2,
                borderStyle: study ? 'solid' : 'dashed',
                borderColor: missed ? '#FCA5A5' : isToday ? '#FFFFFF' : 'rgba(255,255,255,0.5)',
              }}
            >
              {complete ? <Icon name="check" size={16} color="#8A63D2" strokeWidth={3} /> : null}
            </View>
            <Text className="font-strong" style={{ fontSize: 12, color: isToday ? '#FFFFFF' : 'rgba(255,255,255,0.8)' }}>
              {WEEKDAY_SHORT[weekday]}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

function InfoPill({ glyph, text }: { glyph: string; text: string }) {
  return (
    <View className="flex-row items-center gap-1.5 rounded-pill px-3 py-1" style={{ backgroundColor: 'rgba(255,255,255,0.18)' }}>
      <Text style={{ fontSize: 13 }}>{glyph}</Text>
      <Text className="font-strong text-white" style={{ fontSize: 13 }}>
        {text}
      </Text>
    </View>
  );
}

const WEEKDAY_SHORT = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

function Tile({ value, label }: { value: string; label: string }) {
  return (
    <View className="flex-row items-baseline gap-1.5 rounded-xl px-3 py-2" style={{ backgroundColor: 'rgba(255,255,255,0.16)' }}>
      <Text className="font-heavy text-white" style={{ fontSize: 18 }}>
        {value}
      </Text>
      <Text className="font-semi" style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)' }}>
        {label}
      </Text>
    </View>
  );
}

/** Ô số tối (như thẻ thống kê): biểu tượng tròn màu, nhãn, con số lớn. */
function StatTile({ icon, tone, label, value, sub }: { icon: BadgeIcon; tone: string; label: string; value: string; sub: string }) {
  return (
    <View style={{ height: '100%', borderRadius: 24, padding: 16, backgroundColor: '#1E2233' }}>
      <View className="flex-row items-center gap-2.5">
        <Badge icon={icon} color={tone} size={38} />
        <Text className="font-semi" style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)' }}>
          {label}
        </Text>
      </View>
      <Text className="mt-3 font-heavy text-white" style={{ fontSize: 32 }}>
        {value}
      </Text>
      {sub ? (
        <Text className="font-mid" style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
          {sub}
        </Text>
      ) : null}
    </View>
  );
}
