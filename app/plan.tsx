import React, { useMemo, useState } from 'react';
import { Platform, Pressable, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';

import { Grid } from '@/components/layout/Grid';
import { Screen } from '@/components/layout/Screen';
import { Appear, CrossFade } from '@/components/motion/Motion';
import { PlanBlockRow, SKILL_TONE } from '@/components/plan/PlanBlockRow';
import { TemplatePlan } from '@/components/plan/TemplatePlan';
import { Badge, CuteBook, CuteCalendar, CuteClock, CuteCloud, CutePencil, type BadgeIcon } from '@/components/illust/Cute';
import { CuteFlame, CutePlant, CuteRocket, CuteTrophy, Motion, Sparkles } from '@/components/illust/CuteMore';
import { Sticker } from '@/components/illust/Sticker';
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
  const { width } = useWindowDimensions();
  const wide = width >= 1000;
  const [ielts, setIelts] = useState<GoalInput | null>(initial?.ielts ?? null);
  const [sat, setSat] = useState<GoalInput | null>(initial?.sat ?? null);
  const [minutes, setMinutes] = useState(initial?.minutesPerDay ?? 60);
  const [days, setDays] = useState<number[]>(initial?.studyDays ?? [1, 2, 3, 4, 5, 6]);
  const [weak, setWeak] = useState<Skill[]>(initial?.weak ?? []);
  const [tried, setTried] = useState(false);
  // Kỳ thi đang chỉnh ở khối "Mục tiêu" (khi chọn cả hai).
  const [focusExam, setFocusExam] = useState<'ielts' | 'sat'>(initial?.sat && !initial?.ielts ? 'sat' : 'ielts');

  const draft: PlanInput = { ielts, sat, minutesPerDay: minutes, studyDays: days, weak, startIso: today };
  const problems = validatePlanInput(draft);
  const skills: Skill[] = [...(ielts ? (['reading', 'listening', 'writing'] as Skill[]) : []), ...(sat ? (['math', 'verbal'] as Skill[]) : [])];

  const toggleExam = (e: 'ielts' | 'sat') => {
    if (e === 'ielts') setIelts(ielts ? null : { now: null, target: 6.5, examIso: '' });
    else setSat(sat ? null : { now: null, target: 1400, examIso: '' });
    setFocusExam(e);
  };
  const goal = focusExam === 'ielts' ? ielts : sat;
  const setGoal = (g: GoalInput) => (focusExam === 'ielts' ? setIelts(g) : setSat(g));
  const isIelts = focusExam === 'ielts';
  const fmt = (v: number) => (isIelts ? v.toFixed(1) : String(v));

  const submit = () => {
    setTried(true);
    if (problems.length > 0) return;
    setInput({ ...draft, weak: weak.filter((w) => skills.includes(w)) });
    router.replace('/plan' as never);
  };

  const minutesLabel = (m: number) => (m < 60 ? `${m} phút` : `${Number.isInteger(m / 60) ? m / 60 : (m / 60).toFixed(1).replace('.', ',')} giờ`);
  const row = { flexDirection: wide ? 'row' : 'column', gap: 16, marginTop: 16 } as const;

  return (
    <View style={{ paddingBottom: 40 }}>
      {/* ------------------------------------------------ đầu trang */}
      <Appear>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text className="font-strong" style={{ fontSize: 12, letterSpacing: 1.6, color: '#8F6E36' }}>
              LỘ TRÌNH CỦA TÔI
            </Text>
            <Text className="font-heavy" style={{ fontSize: wide ? 40 : 30, lineHeight: wide ? 46 : 36, color: B9.navy }}>
              {initial ? 'Sửa lộ trình.' : 'Lập lộ trình.'}
            </Text>
            <Text className="font-sans" style={{ marginTop: 4, fontSize: 15, color: '#5B5444' }}>
              Chọn mục tiêu, ngày thi, giờ học — app xếp từng buổi vào đúng bài.
            </Text>
          </View>
          <Motion kind="float">
            <Sticker tilt={8}>
              <CuteCalendar size={wide ? 76 : 54} />
            </Sticker>
          </Motion>
        </View>
      </Appear>

      {/* ------------------------------------------------ hàng 1: mục tiêu · ngày thi */}
      <View style={row}>
        <Appear style={{ flex: wide ? 1.7 : undefined }}>
          <View style={[B9CARD, { backgroundColor: '#F2C45A', minHeight: 330 }]}>
            <Sparkles count={5} />
            <View style={{ position: 'absolute', right: -60, top: -60, width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(255,255,255,0.18)' }} />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
              <ExamChip label="IELTS" on={!!ielts} focused={focusExam === 'ielts'} onToggle={() => toggleExam('ielts')} onFocus={() => setFocusExam('ielts')} />
              <ExamChip label="SAT" on={!!sat} focused={focusExam === 'sat'} onToggle={() => toggleExam('sat')} onFocus={() => setFocusExam('sat')} />
            </View>

            {goal ? (
              <View style={{ marginTop: 14, flexDirection: wide ? 'row' : 'column', gap: 18, alignItems: wide ? 'center' : 'stretch' }}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text className="font-heavy" style={{ fontSize: wide ? 38 : 30, lineHeight: wide ? 42 : 34, color: B9.navy }}>
                    Mục tiêu {isIelts ? 'band' : 'điểm'}.
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-end', marginTop: 6 }}>
                    <Text className="font-heavy" style={{ fontSize: wide ? 96 : 72, lineHeight: wide ? 100 : 76, color: B9.navy }}>
                      {fmt(goal.target)}
                    </Text>
                    <Text className="font-heavy" style={{ fontSize: 24, color: '#6B5320', marginBottom: 12, marginLeft: 4 }}>
                      /{isIelts ? '9' : '1600'}
                    </Text>
                  </View>
                  <Text className="font-strong" style={{ marginTop: 8, fontSize: 13, color: '#6B5320' }}>
                    ĐIỂM BÂY GIỜ
                  </Text>
                  <View style={{ marginTop: 6, flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                    <MiniPill label="Chưa biết" on={goal.now === null} onPress={() => setGoal({ ...goal, now: null })} />
                    {(isIelts ? IELTS_NOW : SAT_NOW).map((v) => (
                      <MiniPill
                        key={v}
                        label={fmt(v)}
                        on={goal.now === v}
                        onPress={() => {
                          const targets = isIelts ? IELTS_TARGET : SAT_TARGET;
                          setGoal({ ...goal, now: v, target: goal.target > v ? goal.target : (targets.find((t) => t > v) ?? goal.target) });
                        }}
                      />
                    ))}
                  </View>
                </View>
                <ValueWheel
                  options={(isIelts ? IELTS_TARGET : SAT_TARGET).filter((v) => goal.now === null || v > goal.now)}
                  value={goal.target}
                  format={fmt}
                  onChange={(v) => setGoal({ ...goal, target: v })}
                  label={isIelts ? 'CHỌN BAND' : 'CHỌN ĐIỂM'}
                />
              </View>
            ) : (
              <View style={{ marginTop: 18 }}>
                <Text className="font-heavy" style={{ fontSize: wide ? 38 : 30, lineHeight: wide ? 42 : 34, color: B9.navy }}>
                  Bạn thi gì?
                </Text>
                <Text className="font-sans" style={{ marginTop: 6, fontSize: 15, color: '#5A4318' }}>
                  Bấm IELTS, SAT hoặc cả hai ở trên để đặt mục tiêu.
                </Text>
              </View>
            )}
            <View style={{ position: 'absolute', right: 16, bottom: 16 }} aria-hidden>
              <Motion kind="wobble">
                <Sticker tilt={10}>
                  <CuteTrophy size={58} />
                </Sticker>
              </Motion>
            </View>
          </View>
        </Appear>

        <Appear index={1} style={{ flex: wide ? 1 : undefined }}>
          <ExamDateCard goal={goal} examLabel={isIelts ? 'IELTS' : 'SAT'} today={today} minDate={addDaysIso(today, 14)} onChange={(iso) => goal && setGoal({ ...goal, examIso: iso })} />
        </Appear>
      </View>

      {/* ------------------------------------------------ hàng 2: giờ học · ngày học · phần yếu */}
      <View style={row}>
        <Appear index={2} style={{ flex: wide ? 1 : undefined }}>
          <View style={[B9CARD, { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EADFC6' }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text className="font-heavy" style={{ fontSize: 24, color: B9.navy }}>
                Mỗi ngày.
              </Text>
              <Sticker tilt={-8}>
                <CuteClock size={44} />
              </Sticker>
            </View>
            <Text className="font-heavy" style={{ marginTop: 4, fontSize: 52, lineHeight: 58, color: B9.gold }}>
              {minutesLabel(minutes)}
            </Text>
            <View style={{ marginTop: 10, flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {MINUTES.map((m) => (
                <MiniPill key={m} label={minutesLabel(m)} on={minutes === m} onPress={() => setMinutes(m)} light />
              ))}
            </View>
          </View>
        </Appear>

        <Appear index={3} style={{ flex: wide ? 1 : undefined }}>
          <View style={[B9CARD, { backgroundColor: B9.navy }]}>
            <Sparkles count={4} />
            <Text className="font-heavy" style={{ fontSize: 24, color: '#FFFFFF' }}>
              Ngày học.
            </Text>
            <Text className="font-semi" style={{ marginTop: 2, fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
              {days.length} buổi / tuần · ngày không chọn là ngày nghỉ
            </Text>
            <View style={{ marginTop: 16, flexDirection: 'row', justifyContent: 'space-between', gap: 4 }}>
              {WEEK_ORDER.map((d) => {
                const on = days.includes(d);
                return (
                  <Pressable
                    key={d}
                    accessibilityRole="checkbox"
                    aria-checked={on}
                    accessibilityLabel={WEEKDAY_LABEL[d]}
                    onPress={() => setDays(on ? days.filter((x) => x !== d) : [...days, d])}
                    style={{ alignItems: 'center', gap: 6 }}
                  >
                    <View
                      style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: on ? B9.goldLight : 'rgba(255,255,255,0.3)', backgroundColor: on ? B9.gold : 'transparent' }}
                    >
                      {on ? <Icon name="check" size={16} color={B9.navy} strokeWidth={3} /> : null}
                    </View>
                    <Text className="font-strong" style={{ fontSize: 12, color: on ? B9.goldLight : 'rgba(255,255,255,0.6)' }}>
                      {WEEKDAY_LABEL[d]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </Appear>

        <Appear index={4} style={{ flex: wide ? 1 : undefined }}>
          <View style={[B9CARD, { backgroundColor: '#F6EBD3' }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text className="font-heavy" style={{ fontSize: 24, color: B9.navy }}>
                Phần yếu.
              </Text>
              <Sticker tilt={8}>
                <CuteRocket size={44} />
              </Sticker>
            </View>
            <Text className="font-semi" style={{ marginTop: 2, fontSize: 13, color: '#6B5320' }}>
              Được thêm giờ. Không chọn cũng được.
            </Text>
            <View style={{ marginTop: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {skills.length === 0 ? (
                <Text className="font-sans" style={{ fontSize: 14, color: '#6B5320' }}>
                  Chọn kỳ thi trước.
                </Text>
              ) : (
                skills.map((s) => {
                  const on = weak.includes(s);
                  return (
                    <Pressable
                      key={s}
                      accessibilityRole="checkbox"
                      aria-checked={on}
                      onPress={() => setWeak(on ? weak.filter((x) => x !== s) : [...weak, s])}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: on ? B9.navy : '#FFFFFF' }}
                    >
                      <Badge icon={on ? 'bolt' : 'target'} color={on ? B9.gold : '#D8C39A'} size={24} />
                      <Text className="font-strong" style={{ fontSize: 14, color: on ? '#FFFFFF' : B9.navy }}>
                        {SKILL_LABEL[s]}
                      </Text>
                    </Pressable>
                  );
                })
              )}
            </View>
          </View>
        </Appear>
      </View>

      {tried && problems.length > 0 ? (
        <View style={{ marginTop: 14, gap: 4, borderRadius: 18, padding: 14, backgroundColor: '#FFF4DB', borderWidth: 1, borderColor: '#EBCF8E' }}>
          {problems.map((p) => (
            <View key={p} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
              <Icon name="info" size={15} color="#8F6E36" />
              <Text className="font-sans" style={{ flex: 1, fontSize: 14, color: B9.navy }}>
                {p}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      {/* ------------------------------------------------ thanh chốt */}
      <View style={{ marginTop: 18, borderRadius: 24, padding: 16, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EADFC6', flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 12 }}>
        <View style={{ flex: 1, minWidth: 220 }}>
          <Text className="font-strong" style={{ fontSize: 12, letterSpacing: 1.4, color: '#8F6E36' }}>
            TÓM TẮT
          </Text>
          <Text className="font-heavy" style={{ fontSize: 16, color: B9.navy }}>
            {[ielts ? `IELTS ${ielts.target.toFixed(1)}` : null, sat ? `SAT ${sat.target}` : null].filter(Boolean).join(' + ') || 'Chưa chọn kỳ thi'} · {days.length} buổi × {minutesLabel(minutes)}
          </Text>
        </View>
        <Button label={initial ? 'Lập lại lộ trình' : 'Lập lộ trình'} variant="brand" size="lg" iconRight="arrow-right" onPress={submit} />
        {initial ? <Button label="Huỷ" variant="outline" onPress={() => router.replace('/plan' as never)} /> : null}
        <Pressable accessibilityRole="link" onPress={() => router.push('/plan?mau=1' as never)}>
          <Text className="font-semi" style={{ fontSize: 14, color: '#6B5320' }}>
            Xem lộ trình mẫu 60 tuần →
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const B9 = { navy: '#0F1D33', gold: '#A8843F', goldLight: '#E2C88F' };
const B9CARD = { borderRadius: 30, padding: 22, overflow: 'hidden' } as const;

function ExamChip({ label, on, focused, onToggle, onFocus }: { label: string; on: boolean; focused: boolean; onToggle: () => void; onFocus: () => void }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', borderRadius: 999, backgroundColor: on ? (focused ? B9.navy : 'rgba(15,29,51,0.75)') : 'rgba(255,255,255,0.55)', paddingLeft: 4, paddingRight: 12, paddingVertical: 4, gap: 8 }}>
      <Pressable accessibilityRole="checkbox" aria-checked={on} accessibilityLabel={`Thi ${label}`} onPress={onToggle} style={{ width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? B9.goldLight : '#FFFFFF' }}>
        {on ? <Icon name="check" size={15} color={B9.navy} strokeWidth={3} /> : <Icon name="plus" size={15} color={B9.navy} />}
      </Pressable>
      <Pressable accessibilityRole="button" onPress={on ? onFocus : onToggle}>
        <Text className="font-heavy" style={{ fontSize: 15, color: on ? '#FFFFFF' : B9.navy }}>
          {label}
        </Text>
      </Pressable>
    </View>
  );
}

function MiniPill({ label, on, onPress, light }: { label: string; on: boolean; onPress: () => void; light?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      aria-selected={on}
      onPress={onPress}
      style={{ borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7, backgroundColor: on ? B9.navy : light ? '#F6EFE0' : 'rgba(255,255,255,0.6)' }}
    >
      <Text className="font-strong" style={{ fontSize: 13, color: on ? '#FFFFFF' : B9.navy }}>
        {label}
      </Text>
    </Pressable>
  );
}

/**
 * Bánh xe chọn số (kiểu cuộn): số đang chọn nằm trong ô trắng, hai số trên dưới
 * mờ dần. Bấm số khác, bấm mũi tên, hoặc lăn chuột (web) để đổi.
 */
function ValueWheel({ options, value, onChange, format, label }: { options: number[]; value: number; onChange: (v: number) => void; format: (v: number) => string; label: string }) {
  const idx = Math.max(0, options.indexOf(value));
  const step = (d: number) => {
    const n = options[Math.min(options.length - 1, Math.max(0, idx + d))];
    if (n !== undefined && n !== value) onChange(n);
  };
  const stepRef = React.useRef(step);
  React.useLayoutEffect(() => {
    stepRef.current = step;
  });
  const boxRef = React.useRef<View | null>(null);
  React.useEffect(() => {
    if (Platform.OS !== 'web') return;
    const el = boxRef.current as unknown as HTMLElement | null;
    if (!el?.addEventListener) return;
    let last = 0;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const now = Date.now();
      if (now - last < 140) return;
      last = now;
      stepRef.current(e.deltaY > 0 ? 1 : -1);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);
  const around = [-2, -1, 0, 1, 2];
  return (
    <View style={{ alignItems: 'center', minWidth: 220 }}>
      <Text className="font-strong" style={{ fontSize: 12, letterSpacing: 1.6, color: '#6B5320' }}>
        {label} ↕
      </Text>
      <View ref={boxRef} style={{ marginTop: 6, alignItems: 'stretch', width: 240 }}>
        {around.map((o) => {
          const v = options[idx + o];
          if (o === 0)
            return (
              <View key={o} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#FFFFFF', boxShadow: '0 10px 24px -12px rgba(90,67,24,0.55)' } as object}>
                <Pressable accessibilityRole="button" accessibilityLabel="Giảm" onPress={() => step(-1)} style={{ padding: 6 }}>
                  <View style={{ transform: [{ rotate: '180deg' }] }}>
                    <Icon name="chevron-down" size={18} color={B9.navy} />
                  </View>
                </Pressable>
                <Text className="font-heavy" style={{ fontSize: 40, lineHeight: 46, color: B9.navy }}>
                  {format(value)}
                </Text>
                <Pressable accessibilityRole="button" accessibilityLabel="Tăng" onPress={() => step(1)} style={{ padding: 6 }}>
                  <Icon name="chevron-down" size={18} color={B9.navy} />
                </Pressable>
              </View>
            );
          return (
            <Pressable key={o} disabled={v === undefined} onPress={() => v !== undefined && onChange(v)} style={{ alignItems: 'center', paddingVertical: 2 }}>
              <Text className="font-heavy" style={{ fontSize: Math.abs(o) === 1 ? 26 : 20, color: `rgba(15,29,51,${Math.abs(o) === 1 ? 0.45 : 0.22})` }}>
                {v === undefined ? ' ' : format(v)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/** Khối ngày thi: đếm ngược thật + lịch tháng có đánh dấu hôm nay và ngày thi. */
function ExamDateCard({ goal, examLabel, today, minDate, onChange }: { goal: GoalInput | null; examLabel: string; today: string; minDate: string; onChange: (iso: string) => void }) {
  const exam = goal?.examIso || '';
  const left = exam ? daysBetween(today, exam) : null;
  const show = exam && exam.slice(0, 7) >= today.slice(0, 7) ? exam : today;
  const [y, m] = show.split('-').map(Number) as [number, number];
  const first = new Date(Date.UTC(y, m - 1, 1));
  const lead = (first.getUTCDay() + 6) % 7;
  const count = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const cells: (number | null)[] = [...Array.from({ length: lead }, () => null), ...Array.from({ length: count }, (_, i) => i + 1)];
  const iso = (d: number) => `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  return (
    <View style={[B9CARD, { backgroundColor: B9.navy, minHeight: 330 }]}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View>
          <Text className="font-heavy" style={{ fontSize: 24, color: '#FFFFFF' }}>
            Ngày thi.
          </Text>
          <Text className="font-semi" style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)' }}>
            {goal ? `${examLabel} · dự kiến cũng được` : 'Chọn kỳ thi trước'}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text className="font-heavy" style={{ fontSize: 40, lineHeight: 44, color: B9.goldLight }}>
            {left === null ? '—' : left}
          </Text>
          <Text className="font-semi" style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>
            ngày nữa
          </Text>
        </View>
      </View>
      <View style={{ marginTop: 12 }}>
        <DateField value={exam} min={minDate} onChange={onChange} disabled={!goal} />
      </View>
      <Text className="font-strong" style={{ marginTop: 14, fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>
        Tháng {m} · {y}
      </Text>
      <View style={{ marginTop: 6, flexDirection: 'row', flexWrap: 'wrap' }}>
        {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((d) => (
          <Text key={d} className="font-strong" style={{ width: `${100 / 7}%`, textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.5)', paddingVertical: 3 }}>
            {d}
          </Text>
        ))}
        {cells.map((d, i) => {
          const k = d ? iso(d) : '';
          const isToday = k === today;
          const isExam = !!exam && k === exam;
          return (
            <View key={i} style={{ width: `${100 / 7}%`, alignItems: 'center', paddingVertical: 2 }}>
              <View style={{ width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: isExam ? '#E0533D' : isToday ? B9.goldLight : 'transparent' }}>
                <Text className="font-semi" style={{ fontSize: 12, color: isToday && !isExam ? B9.navy : d ? '#FFFFFF' : 'transparent' }}>
                  {d ?? ''}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function DateField({ value, min, onChange, disabled }: { value: string; min: string; onChange: (iso: string) => void; disabled?: boolean }) {
  const style = { height: 42, borderWidth: 0, borderRadius: 12, paddingLeft: 12, paddingRight: 12, fontSize: 15, color: B9.navy, backgroundColor: disabled ? 'rgba(255,255,255,0.4)' : '#FFFFFF', width: '100%' as const, maxWidth: 260 };
  if (Platform.OS === 'web') {
    return React.createElement('input', {
      type: 'date',
      value,
      min,
      disabled,
      'aria-label': 'Ngày thi',
      onChange: (e: { target: { value: string } }) => onChange(e.target.value),
      style: { ...style, fontFamily: 'inherit', borderStyle: 'solid', boxSizing: 'border-box' },
    });
  }
  return <TextInput value={value} onChangeText={onChange} placeholder="YYYY-MM-DD" editable={!disabled} style={style} />;
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
        <View style={{ borderRadius: 28, padding: 24, backgroundColor: '#A8843F', overflow: 'hidden' }}>
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

          <View style={{ height: '100%', borderRadius: 28, padding: 20, backgroundColor: '#CAA76B', overflow: 'hidden' }}>
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
          <StatTile icon="star" tone="#A8843F" label="Hoàn thành" value={allBlocks.length ? `${Math.round((doneAll / allBlocks.length) * 100)}%` : '—'} sub="" />
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
                    <View key={`${r.goal}-${r.phase}`} className="flex-row items-center gap-3 rounded-xl px-3 py-2" style={{ backgroundColor: on ? '#FCF8F1' : '#FCFAF7' }}>
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
                      <View className="mt-1 h-2 overflow-hidden rounded-pill" style={{ backgroundColor: '#F6F3EE' }}>
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
              {complete ? <Icon name="check" size={16} color="#CAA76B" strokeWidth={3} /> : null}
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
