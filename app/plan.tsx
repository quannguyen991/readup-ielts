import React, { useMemo, useState } from 'react';
import { Platform, Pressable, Text, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';

import { Grid } from '@/components/layout/Grid';
import { Screen } from '@/components/layout/Screen';
import { Appear, CrossFade } from '@/components/motion/Motion';
import { PlanBlockRow, SKILL_TONE } from '@/components/plan/PlanBlockRow';
import { TemplatePlan } from '@/components/plan/TemplatePlan';
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

  return (
    <View className="pb-8">
      <Appear>
        <LinearGradient colors={[...gradient.hero]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: 22, padding: 22 }}>
          <View className="flex-row flex-wrap items-end justify-between gap-4">
            <View className="min-w-0 flex-1" style={{ minWidth: 240 }}>
              <Text className="font-strong text-label uppercase text-white/75">
                Lộ trình của tôi · lập ngày {fmtDate(input.startIso)}
              </Text>
              <Text className="mt-1 font-heavy text-white" style={{ fontSize: 40, lineHeight: 46 }}>
                Tuần {current}
                <Text className="font-sans text-bodyLg text-white/70"> / {plan.totalWeeks}</Text>
              </Text>
              <View className="mt-3 flex-row flex-wrap gap-2">
                {goals.map((g) => {
                  const gi = input[g]!;
                  const left = daysBetween(today, gi.examIso);
                  const fmt = (v: number) => (g === 'ielts' ? v.toFixed(1) : String(v));
                  return (
                    <View key={g} className="rounded-2xl px-3 py-2" style={{ backgroundColor: 'rgba(255,255,255,0.16)' }}>
                      <Text className="font-heavy text-body text-white">
                        {g === 'ielts' ? 'IELTS' : 'SAT'} {gi.now === null ? '?' : fmt(gi.now)} → {fmt(gi.target)}
                      </Text>
                      <Text className="font-mid text-label text-white/80">
                        Thi {fmtDate(gi.examIso)} · {left > 0 ? `còn ${left} ngày` : left === 0 ? 'hôm nay' : 'đã thi'}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
            <View className="items-end gap-2">
              <Button label="Sửa lộ trình" variant="outline" size="sm" onPress={() => router.push('/plan?sua=1' as never)} />
              <Text className="font-mid text-label text-white/80">
                {input.minutesPerDay} phút/ngày · {input.studyDays.length} ngày/tuần
              </Text>
            </View>
          </View>
        </LinearGradient>
      </Appear>

      {/* ------------------------------------------------ hôm nay */}
      <Appear index={1}>
        <SectionHeader
          className="mt-6"
          title="Hôm nay"
          subtitle={todayBlocks.length > 0 ? 'Làm xong khối nào thì bấm ô vuông bên trái để đánh dấu.' : 'Hôm nay là ngày nghỉ theo lộ trình.'}
          icon="clock"
        />
        <View className="mt-3 gap-2">
          {todayBlocks.length > 0 ? (
            todayBlocks.map((b) => <PlanBlockRow key={b.id} block={b} />)
          ) : next ? (
            <Card>
              <Text className="font-strong text-body text-ink">
                Buổi học tiếp: {WEEKDAY_LABEL[next.weekday]} {fmtDate(next.iso)}
              </Text>
              <View className="mt-3 gap-2">
                {next.blocks.map((b) => (
                  <PlanBlockRow key={b.id} block={b} compact />
                ))}
              </View>
            </Card>
          ) : (
            <Card>
              <Text className="font-sans text-body text-ink">Lộ trình đã đi hết. Bấm “Sửa lộ trình” để đặt mục tiêu mới.</Text>
            </Card>
          )}
        </View>
      </Appear>

      {/* ------------------------------------------------ cả tuần */}
      <Appear index={2}>
        <View className="mt-6 flex-row flex-wrap items-center justify-between gap-3">
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
