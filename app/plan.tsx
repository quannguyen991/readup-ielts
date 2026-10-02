import React, { useMemo, useState } from 'react';
import { HEADER_ART_MIN } from '@/components/three/hero-star-policy';
import { Platform, Pressable, Text, TextInput, View, useWindowDimensions } from 'react-native';
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
import { useL } from '@/i18n/useL';

/* Bản tiếng Anh cho nhãn lấy từ services/plan/custom (bản tiếng Việt giữ ở đó). */
const SKILL_LABEL_EN: Record<Skill, string> = {
  reading: 'IELTS Reading',
  listening: 'Listen & dictate',
  writing: 'IELTS Writing',
  vocab: 'Vocabulary',
  math: 'SAT Math',
  verbal: 'SAT Verbal',
};
const PHASE_LABEL_EN: Record<Phase, string> = {
  nen: 'Foundations',
  dang: 'Question types',
  de: 'Full tests',
  'nuoc-rut': 'Final sprint',
};
const WEEKDAY_LABEL_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** Cột mốc / tên cửa kiểm tra do services/plan sinh ra → tiếng Anh; chuỗi lạ thì giữ nguyên. */
const PLAN_TEXT_EN: Record<string, string> = {
  'Ngày thi IELTS': 'IELTS exam day',
  'Ngày thi SAT': 'SAT exam day',
  'Cửa kiểm tra IELTS': 'IELTS checkpoint',
  'Cửa kiểm tra SAT': 'SAT checkpoint',
  'Cửa kiểm tra IELTS · thi thử Reading': 'IELTS checkpoint · Reading mock test',
  'Cửa kiểm tra SAT · thi thử đủ 98 câu': 'SAT checkpoint · full 98-question mock test',
};

/** Lỗi của validatePlanInput (tiếng Việt) → tiếng Anh. */
function problemEn(p: string): string {
  const fixed: Record<string, string> = {
    'Chọn ít nhất một kỳ thi: IELTS hoặc SAT.': 'Pick at least one exam: IELTS or SAT.',
    'Chọn ít nhất một ngày học trong tuần.': 'Pick at least one study day a week.',
    'Mỗi ngày học ít nhất 20 phút.': 'Study at least 20 minutes a day.',
  };
  const f = fixed[p];
  if (f) return f;
  let m = /^Chọn ngày thi (\w+)\.$/.exec(p);
  if (m) return `Pick your ${m[1]} exam date.`;
  m = /^Ngày thi (\w+) phải cách hôm nay ít nhất 2 tuần/.exec(p);
  if (m) return `Your ${m[1]} exam date must be at least 2 weeks away so there's time to study.`;
  m = /^Ngày thi (\w+) xa quá 2 năm/.exec(p);
  if (m) return `Your ${m[1]} exam date is more than 2 years away — pick a closer date; plans that long are hard to stick to.`;
  m = /^Điểm mục tiêu (\w+) phải cao hơn/.exec(p);
  if (m) return `Your ${m[1]} target must be higher than your current score.`;
  return p;
}

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

/**
 * FORM LẬP LỘ TRÌNH = "PHIẾU LỘ TRÌNH" BAND 9 (01/10/2026).
 *
 * Bản bento trước (khối vàng to, khối chàm có lịch tháng, chip tròn, tiêu đề
 * có dấu chấm) bị chê "giống IELTS Dictionary quá". Bản này đi theo hình ảnh
 * riêng của Band 9: một tờ phiếu giấy kem kẻ chỉ vàng, bốn mục đánh số như
 * phiếu đăng ký thi, chọn band trên MỘT THƯỚC đo (thấy luôn khoảng cách từ
 * điểm bây giờ tới mục tiêu), và cuống vé màu xanh đậm bên phải tóm tắt lộ
 * trình kèm nút lập — đúng cảm giác "vé đi Band 9".
 */
const P = {
  navy: '#0F1D33',
  gold: '#A8843F',
  goldDeep: '#8F6E36',
  goldLight: '#E2C88F',
  paper: '#FFFDF8',
  line: '#E8DCC0',
  muted: '#6B6250',
  canvas: '#F3EDE1',
};

/** Thang band trên thước: gộp thang "bây giờ" và thang "mục tiêu". */
const IELTS_SCALE = [...new Set([...IELTS_NOW, ...IELTS_TARGET])].sort((a, b) => a - b);
const SAT_SCALE = [...new Set([...SAT_NOW, ...SAT_TARGET])].sort((a, b) => a - b);
const QUICK_WEEKS = [8, 12, 16, 24];

function PlanSetup({ initial }: { initial: PlanInput | null }) {
  const setInput = useRoadmapStore((s) => s.setInput);
  const { L, en } = useL();
  const today = todayKey();
  const { width } = useWindowDimensions();
  const wide = width >= 1000;
  const [ielts, setIelts] = useState<GoalInput | null>(initial?.ielts ?? null);
  const [sat, setSat] = useState<GoalInput | null>(initial?.sat ?? null);
  const [minutes, setMinutes] = useState(initial?.minutesPerDay ?? 60);
  const [days, setDays] = useState<number[]>(initial?.studyDays ?? [1, 2, 3, 4, 5, 6]);
  const [weak, setWeak] = useState<Skill[]>(initial?.weak ?? []);
  const [tried, setTried] = useState(false);
  // Kỳ thi đang chỉnh ở mục 02–03 (khi chọn cả hai).
  const [focusExam, setFocusExam] = useState<'ielts' | 'sat'>(initial?.sat && !initial?.ielts ? 'sat' : 'ielts');

  const draft: PlanInput = { ielts, sat, minutesPerDay: minutes, studyDays: days, weak, startIso: today };
  const problems = validatePlanInput(draft);
  const skills: Skill[] = [...(ielts ? (['reading', 'listening', 'writing'] as Skill[]) : []), ...(sat ? (['math', 'verbal'] as Skill[]) : [])];

  const toggleExam = (e: 'ielts' | 'sat') => {
    if (e === 'ielts') setIelts(ielts ? null : { now: null, target: 6.5, examIso: '' });
    else setSat(sat ? null : { now: null, target: 1400, examIso: '' });
    // Bỏ chọn một kỳ thì chuyển mục chỉnh sang kỳ còn lại.
    const turningOff = e === 'ielts' ? !!ielts : !!sat;
    setFocusExam(turningOff ? (e === 'ielts' ? 'sat' : 'ielts') : e);
  };
  const goal = focusExam === 'ielts' ? ielts : sat;
  const setGoal = (g: GoalInput) => (focusExam === 'ielts' ? setIelts(g) : setSat(g));
  const isIelts = focusExam === 'ielts';
  const minDate = addDaysIso(today, 14);

  const submit = () => {
    setTried(true);
    if (problems.length > 0) return;
    setInput({ ...draft, weak: weak.filter((w) => skills.includes(w)) });
    router.replace('/plan' as never);
  };

  const minutesLabel = (m: number) =>
    m < 60
      ? L(`${m} phút`, `${m} min`)
      : en
        ? `${Number.isInteger(m / 60) ? m / 60 : (m / 60).toFixed(1)} hr`
        : `${Number.isInteger(m / 60) ? m / 60 : (m / 60).toFixed(1).replace('.', ',')} giờ`;

  const both = !!ielts && !!sat;
  const examTabs = both ? <ExamTabs value={focusExam} onChange={setFocusExam} /> : null;

  const sheet = (
    <View style={{ borderRadius: 22, backgroundColor: P.paper, borderWidth: 1, borderColor: P.line, paddingHorizontal: wide ? 28 : 18, paddingVertical: 6 }}>
      {/* 01 · kỳ thi */}
      <Section n="01" title={L('Kỳ thi', 'Exam')} hint={L('Chọn một hoặc cả hai', 'Pick one or both')} wide={wide} first>
        <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
          <ExamTile label="IELTS" sub={L('Band 0 – 9', 'Band 0 – 9')} on={!!ielts} onPress={() => toggleExam('ielts')} />
          <ExamTile label="SAT" sub={L('400 – 1600 điểm', '400 – 1600 points')} on={!!sat} onPress={() => toggleExam('sat')} />
        </View>
      </Section>

      {/* 02 · mục tiêu */}
      <Section n="02" title={isIelts ? L('Band hiện tại và mục tiêu', 'Current and target band') : L('Điểm hiện tại và mục tiêu', 'Current and target score')} wide={wide} right={examTabs}>
        {goal ? (
          <GoalRuler
            key={focusExam}
            scale={isIelts ? IELTS_SCALE : SAT_SCALE}
            nowOptions={isIelts ? IELTS_NOW : SAT_NOW}
            targetOptions={isIelts ? IELTS_TARGET : SAT_TARGET}
            goal={goal}
            onChange={setGoal}
            fmt={(v) => (isIelts ? v.toFixed(1) : String(v))}
            unit={isIelts ? 'band' : L('điểm', 'pts')}
            compact={!wide}
          />
        ) : (
          <Muted text={L('Chọn kỳ thi ở mục 01 trước.', 'Pick an exam in step 01 first.')} />
        )}
      </Section>

      {/* 03 · ngày thi */}
      <Section n="03" title={L('Ngày thi', 'Exam date')} hint={L('Dự kiến cũng được', 'An estimate is fine')} wide={wide} right={examTabs}>
        {goal ? (
          <ExamDatePicker
            value={goal.examIso}
            today={today}
            minDate={minDate}
            onChange={(iso) => setGoal({ ...goal, examIso: iso })}
          />
        ) : (
          <Muted text={L('Chọn kỳ thi ở mục 01 trước.', 'Pick an exam in step 01 first.')} />
        )}
      </Section>

      {/* 04 · nhịp học */}
      <Section n="04" title={L('Nhịp học', 'Study rhythm')} hint={L('Ngày không chọn là ngày nghỉ', 'Unselected days are rest days')} wide={wide}>
        <Text className="font-strong" style={{ fontSize: 12, letterSpacing: 1.2, color: P.goldDeep }}>
          {L('MỖI BUỔI', 'EACH SESSION')}
        </Text>
        <Segmented options={MINUTES} value={minutes} onChange={setMinutes} label={wide ? minutesLabel : (m) => (m < 60 ? `${m}'` : minutesLabel(m))} />

        <Text className="font-strong" style={{ marginTop: 16, fontSize: 12, letterSpacing: 1.2, color: P.goldDeep }}>
          {L(`NGÀY HỌC · ${days.length} BUỔI/TUẦN`, `STUDY DAYS · ${days.length} PER WEEK`)}
        </Text>
        <View style={{ marginTop: 8, flexDirection: 'row', gap: 6 }}>
          {WEEK_ORDER.map((d) => {
            const on = days.includes(d);
            const name = (en ? WEEKDAY_LABEL_EN : WEEKDAY_LABEL)[d];
            return (
              <Pressable
                key={d}
                accessibilityRole="checkbox"
                aria-checked={on}
                accessibilityLabel={name}
                onPress={() => setDays(on ? days.filter((x) => x !== d) : [...days, d])}
                style={{ flex: 1, maxWidth: 56, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: on ? P.navy : P.line, backgroundColor: on ? P.navy : '#FFFFFF' }}
              >
                <Text className="font-strong" style={{ fontSize: 13, color: on ? P.goldLight : P.muted }}>
                  {en ? (name ?? '').slice(0, 2) : WEEKDAY_SHORT[d]}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text className="font-strong" style={{ marginTop: 16, fontSize: 12, letterSpacing: 1.2, color: P.goldDeep }}>
          {L('PHẦN YẾU · ĐƯỢC THÊM GIỜ (KHÔNG BẮT BUỘC)', 'WEAK SPOTS · GET EXTRA TIME (OPTIONAL)')}
        </Text>
        {skills.length === 0 ? (
          <Muted text={L('Chọn kỳ thi trước.', 'Pick an exam first.')} />
        ) : (
          <View style={{ marginTop: 8, flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {skills.map((s) => {
              const on = weak.includes(s);
              return (
                <Pressable
                  key={s}
                  accessibilityRole="checkbox"
                  aria-checked={on}
                  onPress={() => setWeak(on ? weak.filter((x) => x !== s) : [...weak, s])}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, borderWidth: 1, borderColor: on ? P.gold : P.line, backgroundColor: on ? '#FBF3E2' : '#FFFFFF' }}
                >
                  <CheckSquare on={on} />
                  <Text className="font-strong" style={{ fontSize: 14, color: P.navy }}>
                    {en ? SKILL_LABEL_EN[s] : SKILL_LABEL[s]}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </Section>
    </View>
  );

  const stub = (
    <TicketStub
      ielts={ielts}
      sat={sat}
      today={today}
      days={days.length}
      minutesText={minutesLabel(minutes)}
      weak={weak.filter((w) => skills.includes(w)).map((w) => (en ? SKILL_LABEL_EN[w] : SKILL_LABEL[w]))}
      problems={tried ? problems.map((p) => (en ? problemEn(p) : p)) : []}
      editing={!!initial}
      onSubmit={submit}
    />
  );

  return (
    <View style={{ paddingBottom: 40 }}>
      {/* ------------------------------------------------ đầu trang */}
      <Appear>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text className="font-strong" style={{ fontSize: 12, letterSpacing: 2.4, color: P.goldDeep }}>
              {L('BAND 9 · PHIẾU LỘ TRÌNH', 'BAND 9 · STUDY PLAN TICKET')}
            </Text>
            <Text className="font-heavy" style={{ marginTop: 2, fontSize: wide ? 38 : 28, lineHeight: wide ? 44 : 34, color: P.navy }}>
              {initial ? L('Sửa lộ trình', 'Edit your plan') : L('Lập lộ trình', 'Build your plan')}
            </Text>
            <Text className="font-sans" style={{ marginTop: 4, fontSize: 15, color: P.muted }}>
              {L('Điền bốn mục, app xếp từng buổi vào đúng bài.', 'Fill in four steps and the app maps every session to the right lesson.')}
            </Text>
          </View>
          {width >= HEADER_ART_MIN ? (
            <Motion kind="float">
              <Sticker tilt={8}>
                <CuteCalendar size={72} />
              </Sticker>
            </Motion>
          ) : null}
        </View>
      </Appear>

      <View style={{ marginTop: 18, flexDirection: wide ? 'row' : 'column', alignItems: wide ? 'flex-start' : 'stretch', gap: wide ? 0 : 16 }}>
        <Appear index={1} style={{ flex: wide ? 1 : undefined, minWidth: 0 }}>
          {sheet}
        </Appear>
        <Appear
          index={2}
          style={wide ? ({ width: 340, marginLeft: 18, position: Platform.OS === 'web' ? 'sticky' : 'relative', top: 16 } as object) : undefined}
        >
          {stub}
        </Appear>
      </View>
    </View>
  );
}

/** Một mục của phiếu: số thứ tự ở lề trái, tiêu đề, nội dung; ngăn bằng chỉ vàng. */
function Section({ n, title, hint, right, wide, first, children }: { n: string; title: string; hint?: string; right?: React.ReactNode; wide: boolean; first?: boolean; children: React.ReactNode }) {
  return (
    <View style={{ flexDirection: wide ? 'row' : 'column', gap: wide ? 20 : 6, paddingVertical: 20, borderTopWidth: first ? 0 : 1, borderColor: P.line }}>
      <Text className="font-heavy" style={{ width: wide ? 40 : undefined, fontSize: wide ? 22 : 13, lineHeight: wide ? 28 : 16, letterSpacing: wide ? 0 : 1.6, color: P.gold }}>
        {n}
      </Text>
      <View style={{ flex: wide ? 1 : undefined, minWidth: 0 }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <View style={{ flexShrink: 1 }}>
            <Text className="font-heavy" style={{ fontSize: 19, lineHeight: 26, color: P.navy }}>
              {title}
            </Text>
            {hint ? (
              <Text className="font-sans" style={{ fontSize: 13, color: P.muted }}>
                {hint}
              </Text>
            ) : null}
          </View>
          {right}
        </View>
        <View style={{ marginTop: 12 }}>{children}</View>
      </View>
    </View>
  );
}

function Muted({ text }: { text: string }) {
  return (
    <Text className="font-sans" style={{ marginTop: 6, fontSize: 14, color: P.muted }}>
      {text}
    </Text>
  );
}

function CheckSquare({ on, light }: { on: boolean; light?: boolean }) {
  return (
    <View style={{ width: 20, height: 20, borderRadius: 5, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: on ? P.gold : light ? 'rgba(255,255,255,0.5)' : '#C9B78F', backgroundColor: on ? P.gold : 'transparent' }}>
      {on ? <Icon name="check" size={13} color="#FFFFFF" strokeWidth={3} /> : null}
    </View>
  );
}

/** Ô chọn kỳ thi: thẻ chữ nhật có ô tích vuông (không phải chip tròn). */
function ExamTile({ label, sub, on, onPress }: { label: string; sub: string; on: boolean; onPress: () => void }) {
  const { L } = useL();
  return (
    <Pressable
      accessibilityRole="checkbox"
      aria-checked={on}
      accessibilityLabel={L(`Thi ${label}`, `Taking ${label}`)}
      onPress={onPress}
      style={{ flexGrow: 1, flexBasis: 120, maxWidth: 260, flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, borderWidth: on ? 1.5 : 1, borderColor: on ? P.navy : P.line, backgroundColor: on ? P.navy : '#FFFFFF' }}
    >
      <CheckSquare on={on} light={on} />
      <View>
        <Text className="font-heavy" style={{ fontSize: 18, lineHeight: 22, color: on ? '#FFFFFF' : P.navy }}>
          {label}
        </Text>
        <Text className="font-sans" style={{ fontSize: 12, color: on ? 'rgba(255,255,255,0.7)' : P.muted }}>
          {sub}
        </Text>
      </View>
    </Pressable>
  );
}

/** Thẻ gạch chân chọn kỳ đang chỉnh khi thi cả hai. */
function ExamTabs({ value, onChange }: { value: 'ielts' | 'sat'; onChange: (v: 'ielts' | 'sat') => void }) {
  return (
    <View accessibilityRole="tablist" style={{ flexDirection: 'row', gap: 16 }}>
      {(['ielts', 'sat'] as const).map((e) => {
        const on = value === e;
        return (
          <Pressable key={e} accessibilityRole="tab" aria-selected={on} onPress={() => onChange(e)} style={{ paddingVertical: 4, borderBottomWidth: 2, borderColor: on ? P.gold : 'transparent' }}>
            <Text className="font-heavy" style={{ fontSize: 14, color: on ? P.navy : P.muted }}>
              {e === 'ielts' ? 'IELTS' : 'SAT'}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/**
 * THƯỚC BAND: một thang ngang, chấm xanh = điểm bây giờ, chấm vàng = mục tiêu,
 * đoạn tô vàng giữa hai chấm là quãng phải đi. Chọn đang đặt mốc nào, rồi chạm
 * vạch trên thước.
 */
function GoalRuler({ scale, nowOptions, targetOptions, goal, onChange, fmt, unit, compact }: { scale: number[]; nowOptions: number[]; targetOptions: number[]; goal: GoalInput; onChange: (g: GoalInput) => void; fmt: (v: number) => string; unit: string; compact: boolean }) {
  const { L } = useL();
  const [mode, setMode] = useState<'target' | 'now'>('target');
  const pos = (v: number) => ((scale.indexOf(v) + 0.5) / scale.length) * 100;
  const tPos = pos(goal.target);
  const nPos = goal.now === null ? null : pos(goal.now);
  const gap = goal.now === null ? null : goal.target - goal.now;

  const pick = (v: number) => {
    if (mode === 'target') {
      if (!targetOptions.includes(v) || (goal.now !== null && v <= goal.now)) return;
      onChange({ ...goal, target: v });
    } else {
      if (!nowOptions.includes(v)) return;
      onChange({ ...goal, now: v, target: goal.target > v ? goal.target : (targetOptions.find((t) => t > v) ?? goal.target) });
    }
  };
  const allowed = (v: number) => (mode === 'target' ? targetOptions.includes(v) && (goal.now === null || v > goal.now) : nowOptions.includes(v));

  return (
    <View>
      {/* số đọc to: bây giờ → mục tiêu */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', flexWrap: 'wrap', gap: 10 }}>
        <Text className="font-heavy" style={{ fontSize: compact ? 34 : 44, lineHeight: compact ? 40 : 50, color: goal.now === null ? '#B7AC95' : P.navy }}>
          {goal.now === null ? '?' : fmt(goal.now)}
        </Text>
        <Text className="font-heavy" style={{ fontSize: compact ? 22 : 28, lineHeight: compact ? 34 : 44, color: P.gold }}>
          →
        </Text>
        <Text className="font-heavy" style={{ fontSize: compact ? 34 : 44, lineHeight: compact ? 40 : 50, color: P.goldDeep }}>
          {fmt(goal.target)}
        </Text>
        {gap !== null ? (
          <View style={{ marginBottom: compact ? 6 : 10, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, backgroundColor: '#FBF3E2', borderWidth: 1, borderColor: P.goldLight }}>
            <Text className="font-strong" style={{ fontSize: 12, color: P.goldDeep }}>
              +{unit === 'band' ? gap.toFixed(1) : gap} {unit}
            </Text>
          </View>
        ) : null}
      </View>

      {/* đang đặt mốc nào */}
      <View style={{ marginTop: 10, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
        <View style={{ flexDirection: 'row', borderRadius: 10, borderWidth: 1, borderColor: P.line, overflow: 'hidden' }}>
          {(['target', 'now'] as const).map((m) => (
            <Pressable key={m} accessibilityRole="button" aria-selected={mode === m} onPress={() => setMode(m)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 7, backgroundColor: mode === m ? P.navy : '#FFFFFF' }}>
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: m === 'target' ? P.gold : 'transparent', borderWidth: 2, borderColor: m === 'target' ? P.gold : mode === m ? '#FFFFFF' : P.navy }} />
              <Text className="font-strong" style={{ fontSize: 13, color: mode === m ? '#FFFFFF' : P.navy }}>
                {m === 'target' ? L('Đặt mục tiêu', 'Set target') : L('Đặt điểm bây giờ', 'Set current')}
              </Text>
            </Pressable>
          ))}
        </View>
        {mode === 'now' ? (
          <Pressable accessibilityRole="button" aria-selected={goal.now === null} onPress={() => onChange({ ...goal, now: null })} style={{ borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7, borderWidth: 1, borderColor: goal.now === null ? P.navy : P.line, backgroundColor: '#FFFFFF' }}>
            <Text className="font-strong" style={{ fontSize: 13, color: P.navy }}>
              {L('Chưa biết', "Don't know")}
            </Text>
          </Pressable>
        ) : null}
      </View>

      {/* thước */}
      <View style={{ marginTop: 18 }}>
        <View style={{ height: 26, justifyContent: 'center' }}>
          <View style={{ height: 4, borderRadius: 2, backgroundColor: '#EFE6D2' }} />
          {nPos !== null ? (
            <View style={{ position: 'absolute', left: `${nPos}%`, width: `${tPos - nPos}%`, height: 4, borderRadius: 2, backgroundColor: P.gold }} />
          ) : null}
          {nPos !== null ? (
            <View style={{ position: 'absolute', left: `${nPos}%`, marginLeft: -9, width: 18, height: 18, borderRadius: 9, backgroundColor: '#FFFFFF', borderWidth: 3, borderColor: P.navy }} />
          ) : null}
          <View style={{ position: 'absolute', left: `${tPos}%`, marginLeft: -12, width: 24, height: 24, borderRadius: 12, backgroundColor: P.gold, borderWidth: 3, borderColor: '#FFFFFF', boxShadow: '0 4px 10px -3px rgba(143,110,54,0.7)' } as object} />
        </View>
        <View style={{ flexDirection: 'row' }}>
          {scale.map((v, i) => {
            const ok = allowed(v);
            const major = Number.isInteger(v) || scale.length < 10;
            const chosen = v === goal.target || v === goal.now;
            const showLabel = !compact || i % 2 === 0 || chosen;
            return (
              <Pressable key={v} accessibilityRole="button" accessibilityLabel={fmt(v)} disabled={!ok} onPress={() => pick(v)} style={{ flex: 1, alignItems: 'center', paddingTop: 2, paddingBottom: 6 }}>
                <View style={{ width: 2, height: major ? 12 : 7, borderRadius: 1, backgroundColor: ok ? P.navy : '#D9CEB6' }} />
                <Text className={chosen ? 'font-heavy' : 'font-semi'} style={{ marginTop: 4, fontSize: compact ? 11 : 13, color: v === goal.target ? P.goldDeep : chosen ? P.navy : ok ? P.muted : '#C9BFA9' }}>
                  {showLabel ? fmt(v) : ' '}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

/** Ngày thi: ô ngày + chọn nhanh "sau N tuần" + đếm ngược. Không lịch tháng. */
function ExamDatePicker({ value, today, minDate, onChange }: { value: string; today: string; minDate: string; onChange: (iso: string) => void }) {
  const { L } = useL();
  const left = value ? daysBetween(today, value) : null;
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 16 }}>
      <View style={{ flexGrow: 1, flexBasis: 260, gap: 10 }}>
        <DateField value={value} min={minDate} onChange={onChange} />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {QUICK_WEEKS.map((w) => {
            const iso = addDaysIso(today, w * 7);
            const on = value === iso;
            return (
              <Pressable key={w} accessibilityRole="button" aria-selected={on} onPress={() => onChange(iso)} style={{ borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: on ? P.navy : P.line, backgroundColor: on ? P.navy : '#FFFFFF' }}>
                <Text className="font-strong" style={{ fontSize: 12, color: on ? '#FFFFFF' : P.navy }}>
                  {L(`Sau ${w} tuần`, `In ${w} weeks`)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
      <View style={{ minWidth: 120, alignItems: 'flex-start', borderLeftWidth: 2, borderColor: P.goldLight, paddingLeft: 14 }}>
        <Text className="font-heavy" style={{ fontSize: 40, lineHeight: 44, color: left === null ? '#B7AC95' : P.navy }}>
          {left === null ? '—' : left}
        </Text>
        <Text className="font-semi" style={{ fontSize: 13, color: P.muted }}>
          {left === null ? L('chưa có ngày thi', 'no date yet') : L(`ngày nữa · ~${Math.max(1, Math.round(left / 7))} tuần`, `days to go · ~${Math.max(1, Math.round(left / 7))} weeks`)}
        </Text>
      </View>
    </View>
  );
}

/** Thanh chọn liền khối (phút mỗi buổi). */
function Segmented({ options, value, onChange, label }: { options: number[]; value: number; onChange: (v: number) => void; label: (v: number) => string }) {
  return (
    <View style={{ marginTop: 8, flexDirection: 'row', borderRadius: 12, borderWidth: 1, borderColor: P.line, backgroundColor: '#FFFFFF', padding: 3, gap: 3 }}>
      {options.map((m) => {
        const on = value === m;
        return (
          <Pressable key={m} accessibilityRole="button" aria-selected={on} onPress={() => onChange(m)} style={{ flex: 1, alignItems: 'center', borderRadius: 9, paddingVertical: 9, backgroundColor: on ? P.navy : 'transparent' }}>
            <Text className="font-strong" numberOfLines={1} style={{ fontSize: 13, color: on ? P.goldLight : P.navy }}>
              {label(m)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Cuống vé: tóm tắt lộ trình + nút lập. Có đường xé răng cưa giữa hai nửa. */
function TicketStub({ ielts, sat, today, days, minutesText, weak, problems, editing, onSubmit }: { ielts: GoalInput | null; sat: GoalInput | null; today: string; days: number; minutesText: string; weak: string[]; problems: string[]; editing: boolean; onSubmit: () => void }) {
  const { L } = useL();
  const legs = [ielts ? { key: 'IELTS', g: ielts, fmt: (v: number) => v.toFixed(1) } : null, sat ? { key: 'SAT', g: sat, fmt: (v: number) => String(v) } : null].filter(Boolean) as { key: string; g: GoalInput; fmt: (v: number) => string }[];
  return (
    <View style={{ borderRadius: 22, backgroundColor: P.navy, overflow: 'hidden' }}>
      <View style={{ position: 'absolute', top: 8, left: 8, right: 8, bottom: 8, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(226,200,143,0.35)' }} pointerEvents="none" />
      <View style={{ padding: 22, paddingBottom: 18 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text className="font-heavy" style={{ fontSize: 13, letterSpacing: 2.4, color: P.goldLight }}>
            BAND 9
          </Text>
          <Text className="font-strong" style={{ fontSize: 12, letterSpacing: 1.6, color: 'rgba(255,255,255,0.55)' }}>
            {L('PHIẾU LỘ TRÌNH', 'PLAN TICKET')}
          </Text>
        </View>

        {legs.length === 0 ? (
          <Text className="font-heavy" style={{ marginTop: 18, fontSize: 22, lineHeight: 28, color: '#FFFFFF' }}>
            {L('Chưa chọn kỳ thi', 'No exam picked yet')}
          </Text>
        ) : (
          legs.map(({ key, g, fmt }) => {
            const left = g.examIso ? daysBetween(today, g.examIso) : null;
            return (
              <View key={key} style={{ marginTop: 16 }}>
                <Text className="font-strong" style={{ fontSize: 12, letterSpacing: 1.6, color: 'rgba(255,255,255,0.55)' }}>
                  {key}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Text className="font-heavy" style={{ fontSize: 30, lineHeight: 36, color: '#FFFFFF' }}>
                    {g.now === null ? '?' : fmt(g.now)}
                  </Text>
                  <View style={{ flex: 1, height: 1, borderTopWidth: 1, borderStyle: 'dashed', borderColor: 'rgba(226,200,143,0.6)' }} />
                  <Icon name="arrow-right" size={16} color={P.goldLight} />
                  <Text className="font-heavy" style={{ fontSize: 30, lineHeight: 36, color: P.goldLight }}>
                    {fmt(g.target)}
                  </Text>
                </View>
                <Text className="font-sans" style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
                  {g.examIso ? L(`Thi ${fmtDate(g.examIso)} · còn ${left} ngày`, `Exam ${fmtDate(g.examIso)} · ${left} days left`) : L('Chưa đặt ngày thi', 'No exam date yet')}
                </Text>
              </View>
            );
          })
        )}

        <View style={{ marginTop: 18, flexDirection: 'row', gap: 10 }}>
          <StubCell label={L('MỖI BUỔI', 'SESSION')} value={minutesText} />
          <StubCell label={L('MỖI TUẦN', 'PER WEEK')} value={L(`${days} buổi`, `${days} days`)} />
        </View>
        {weak.length > 0 ? (
          <Text className="font-sans" style={{ marginTop: 10, fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
            {L('Thêm giờ cho: ', 'Extra time for: ')}
            <Text className="font-strong" style={{ color: '#FFFFFF' }}>
              {weak.join(', ')}
            </Text>
          </Text>
        ) : null}
      </View>

      {/* đường xé */}
      <View style={{ height: 24, justifyContent: 'center' }}>
        <View style={{ marginHorizontal: 20, borderTopWidth: 2, borderStyle: 'dashed', borderColor: 'rgba(255,255,255,0.18)' }} />
        <View style={{ position: 'absolute', left: -12, width: 24, height: 24, borderRadius: 12, backgroundColor: P.canvas }} />
        <View style={{ position: 'absolute', right: -12, width: 24, height: 24, borderRadius: 12, backgroundColor: P.canvas }} />
      </View>

      <View style={{ padding: 22, paddingTop: 14, gap: 12 }}>
        {problems.length > 0 ? (
          <View style={{ gap: 6 }}>
            {problems.map((p) => (
              <View key={p} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
                <Icon name="info" size={15} color={P.goldLight} />
                <Text className="font-sans" style={{ flex: 1, fontSize: 13, color: '#FFFFFF' }}>
                  {p}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
        <Button label={editing ? L('Lập lại lộ trình', 'Rebuild plan') : L('Lập lộ trình', 'Build plan')} variant="brand" size="lg" iconRight="arrow-right" onPress={onSubmit} fullWidth />
        {editing ? <Button label={L('Huỷ', 'Cancel')} variant="outline" fullWidth onPress={() => router.replace('/plan' as never)} /> : null}
        <Pressable accessibilityRole="link" onPress={() => router.push('/plan?mau=1' as never)} style={{ alignSelf: 'center' }}>
          <Text className="font-semi" style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
            {L('Xem lộ trình mẫu 60 tuần →', 'See the 60-week sample plan →')}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function StubCell({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flex: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: 'rgba(255,255,255,0.06)' }}>
      <Text className="font-strong" style={{ fontSize: 12, letterSpacing: 1.4, color: 'rgba(255,255,255,0.55)' }}>
        {label}
      </Text>
      <Text className="font-heavy" style={{ marginTop: 2, fontSize: 17, color: '#FFFFFF' }}>
        {value}
      </Text>
    </View>
  );
}

function DateField({ value, min, onChange, disabled }: { value: string; min: string; onChange: (iso: string) => void; disabled?: boolean }) {
  const { L } = useL();
  const style = { height: 44, borderWidth: 1, borderColor: P.line, borderRadius: 10, paddingLeft: 12, paddingRight: 12, fontSize: 15, color: P.navy, backgroundColor: disabled ? '#F4EFE4' : '#FFFFFF', width: '100%' as const, maxWidth: 280 };
  if (Platform.OS === 'web') {
    return React.createElement('input', {
      type: 'date',
      value,
      min,
      disabled,
      'aria-label': L('Ngày thi', 'Exam date'),
      onChange: (e: { target: { value: string } }) => onChange(e.target.value),
      style: { ...style, fontFamily: 'inherit', borderStyle: 'solid', boxSizing: 'border-box' },
    });
  }
  return <TextInput value={value} onChangeText={onChange} placeholder="YYYY-MM-DD" editable={!disabled} style={style} />;
}

/* ================================================================ LỘ TRÌNH */

const PHASE_ORDER: Phase[] = ['nen', 'dang', 'de', 'nuoc-rut'];

function MyPlan({ input, plan }: { input: PlanInput; plan: CustomPlan }) {
  const { L, en } = useL();
  const phaseLabel = (p: Phase) => (en ? PHASE_LABEL_EN[p] : PHASE_LABEL[p]);
  const weekdayLabel = (d: number) => (en ? WEEKDAY_LABEL_EN : WEEKDAY_LABEL)[d];
  const planText = (s: string) => (en ? (PLAN_TEXT_EN[s] ?? s) : s);
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
                {L(`LỘ TRÌNH CỦA BẠN · LẬP NGÀY ${fmtDate(input.startIso)}`, `YOUR PLAN · CREATED ${fmtDate(input.startIso)}`)}
              </Text>
              <Text className="mt-2 font-heavy text-white" style={{ fontSize: 44, lineHeight: 50 }}>
                {L(`Tuần ${current}`, `Week ${current}`)}
                <Text className="font-sans text-white/70" style={{ fontSize: 22 }}>
                  {' '}
                  / {plan.totalWeeks}
                </Text>
              </Text>
              <View className="mt-2 flex-row flex-wrap gap-2">
                <InfoPill glyph="⏱" text={L(`${input.minutesPerDay}'/ngày`, `${input.minutesPerDay} min/day`)} />
                <InfoPill glyph="📅" text={L(`${input.studyDays.length} ngày/tuần`, `${input.studyDays.length} days/week`)} />
              </View>
            </View>
            <View className="items-end gap-2">
              <Button label={L('Sửa lộ trình', 'Edit plan')} variant="outline" size="sm" onPress={() => router.push('/plan?sua=1' as never)} />
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
                    {g === 'ielts' ? 'IELTS' : 'SAT'} · {L('MỤC TIÊU', 'TARGET')}
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

      {/* ------------------------------------------------ lối sang Lộ trình học theo trình độ */}
      <Appear index={1}>
        <Pressable
          accessibilityRole="link"
          onPress={() => router.push('/lo-trinh-hoc' as never)}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 18, borderWidth: 1, borderColor: P.line, backgroundColor: P.paper, paddingHorizontal: 16, paddingVertical: 14 }}
        >
          <Icon name="compass" size={22} color={P.gold} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text className="font-heavy" style={{ fontSize: 16, color: P.navy }}>
              {L('Lộ trình học theo trình độ', 'Learning path by level')}
            </Text>
            <Text className="font-sans" style={{ fontSize: 13, color: P.muted }}>
              {L('Học từng bài theo chủ đề, đúng mức điểm bạn đang đứng.', 'Lesson-by-lesson topics matched to your current score.')}
            </Text>
          </View>
          <Icon name="arrow-right" size={18} color={P.navy} />
        </Pressable>
      </Appear>

      {/* ------------------------------------------------ hôm nay (xanh lá) + tuần này (tím) */}
      <Appear index={1}>
        <Grid columns={2} tabletColumns={1} mobileColumns={1} gap={14}>
          <View style={{ height: '100%', borderRadius: 28, padding: 20, backgroundColor: '#22A06B', overflow: 'hidden' }}>
            <Sparkles count={5} />
            <View className="flex-row items-start justify-between gap-3">
              <View className="min-w-0 flex-1">
                <Text className="font-heavy text-white" style={{ fontSize: 26 }}>
                  {L('Hôm nay.', 'Today.')}
                </Text>
                <View className="mt-2 self-start rounded-pill px-3 py-1" style={{ backgroundColor: 'rgba(255,255,255,0.18)' }}>
                  <Text className="font-strong text-white" style={{ fontSize: 13 }}>
                    {todayBlocks.length > 0 ? `✓ ${todayDone}/${todayBlocks.length}` : L('😴 Nghỉ', '😴 Rest')}
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
                    {L('Buổi học tiếp:', 'Next session:')} {weekdayLabel(next.weekday)} {fmtDate(next.iso)}
                  </Text>
                  <View className="mt-3 gap-2">
                    {next.blocks.map((b) => (
                      <PlanBlockRow key={b.id} block={b} compact />
                    ))}
                  </View>
                </View>
              ) : (
                <View className="rounded-2xl bg-white p-4">
                  <Text className="font-sans text-body text-ink">
                    {L('Lộ trình đã đi hết. Bấm “Sửa lộ trình” để đặt mục tiêu mới.', "You've finished this plan. Tap “Edit plan” to set a new goal.")}
                  </Text>
                </View>
              )}
            </View>
          </View>

          <View style={{ height: '100%', borderRadius: 28, padding: 20, backgroundColor: '#CAA76B', overflow: 'hidden' }}>
            <Sparkles count={5} />
            <View className="flex-row items-start justify-between gap-3">
              <View className="min-w-0 flex-1">
                <Text className="font-heavy text-white" style={{ fontSize: 26 }}>
                  {L('Tuần này.', 'This week.')}
                </Text>
                <Text className="mt-1 font-sans" style={{ fontSize: 14, color: 'rgba(255,255,255,0.88)' }}>
                  {goals
                    .map((g) => `${g === 'ielts' ? 'IELTS' : 'SAT'}: ${plan.weeks[current - 1]?.phases[g] ? phaseLabel(plan.weeks[current - 1]!.phases[g]!) : L('đã thi', 'exam done')}`)
                    .join(' · ')}
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
              <Tile value={`✓ ${doneThisWeek}/${totalThisWeek}`} label={L('khối', 'blocks')} />
              <Tile value={`⏱ ${Math.round((weekMinutes / 60) * 10) / 10}h`} label={L('tuần này', 'this week')} />
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
              {L('Ngày thi.', 'Exam day.')}
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
                    {left > 0 ? left : left === 0 ? L('Hôm nay', 'Today') : L('Đã thi', 'Done')}
                    {left > 0 ? (
                      <Text className="font-sans" style={{ fontSize: 15, color: '#64748B' }}>
                        {' '}
                        {L('ngày nữa', 'days to go')}
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
          <StatTile icon="clock" tone="#F2B632" label={L('Tổng giờ', 'Total hours')} value={`${Math.round(plan.totalMinutes / 60)}h`} sub="" />
          <StatTile icon="check" tone="#22A06B" label={L('Đã làm', 'Done')} value={`${doneAll}/${allBlocks.length}`} sub="" />
          <StatTile icon="target" tone="#E0533D" label={L('Thi thử', 'Mock tests')} value={`${checks.length}`} sub="" />
          <StatTile icon="star" tone="#A8843F" label={L('Hoàn thành', 'Complete')} value={allBlocks.length ? `${Math.round((doneAll / allBlocks.length) * 100)}%` : '—'} sub="" />
        </Grid>
      </Appear>

      {/* ------------------------------------------------ cả tuần */}
      <Appear index={2}>
        <View className="mt-2 flex-row flex-wrap items-center justify-between gap-3">
          <SectionHeader
            title={L(`Tuần ${week.week}${week.week === current ? ' (tuần này)' : ''}`, `Week ${week.week}${week.week === current ? ' (this week)' : ''}`)}
            subtitle={`${goals.map((g) => `${g === 'ielts' ? 'IELTS' : 'SAT'}: ${week.phases[g] ? phaseLabel(week.phases[g]!) : L('đã thi', 'exam done')}`).join(' · ')} · ${L('đã làm', 'done')} ${doneThisWeek}/${totalThisWeek}`}
            icon="calendar"
          />
          <View className="flex-row gap-2">
            <Button label={L('Tuần trước', 'Previous week')} variant="outline" size="sm" disabled={shown <= 1} onPress={() => setShown((s) => Math.max(1, s - 1))} />
            {shown !== current ? <Button label={L('Tuần này', 'This week')} variant="outline" size="sm" onPress={() => setShown(current)} /> : null}
            <Button label={L('Tuần sau', 'Next week')} variant="outline" size="sm" disabled={shown >= plan.totalWeeks} onPress={() => setShown((s) => Math.min(plan.totalWeeks, s + 1))} />
          </View>
        </View>
        {week.milestones.length > 0 ? (
          <View className="mt-2 flex-row flex-wrap gap-2">
            {week.milestones.map((m) => (
              <View key={m} className="flex-row items-center gap-1.5 rounded-pill px-3 py-1" style={{ backgroundColor: SKILL_TONE.check.soft }}>
                <Icon name="target" size={13} color={SKILL_TONE.check.tone} />
                <Text className="font-strong text-label" style={{ color: '#92400E' }}>
                  {planText(m)}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
        <CrossFade swapKey={`w${week.week}`}>
          <View className="mt-3 gap-3">
            {week.days.length === 0 ? (
              <Card>
                <Text className="font-sans text-body text-muted">{L('Tuần này không có buổi học nào.', 'No sessions this week.')}</Text>
              </Card>
            ) : (
              week.days
                .filter((d) => d.blocks.length > 0)
                .map((d) => (
                  <View key={d.iso}>
                    <Text className="mb-1.5 font-heavy text-label text-ink" style={{ opacity: d.iso === today ? 1 : 0.75 }}>
                      {weekdayLabel(d.weekday)} {fmtDate(d.iso)}
                      {d.iso === today ? L(' · hôm nay', ' · today') : ''}
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
            <SectionHeader
              title={L('Các giai đoạn', 'Phases')}
              subtitle={L('Nền → dạng → đề, cuối mỗi giai đoạn là một bài thi thử.', 'Foundations → question types → full tests, with a mock test at the end of each phase.')}
              icon="list"
            />
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
                      <Text className="flex-1 font-strong text-body text-ink">{phaseLabel(r.phase)}</Text>
                      <Text className="font-mid text-label text-muted">
                        {L('Tuần', 'Week')} {r.from}
                        {r.to !== r.from ? `–${r.to}` : ''}
                      </Text>
                    </View>
                  );
                })}
            </View>
            {checks.length > 0 ? (
              <View className="mt-4">
                <Text className="font-strong text-label text-ink">{L('Cửa kiểm tra', 'Checkpoints')}</Text>
                {checks.map((c) => (
                  <Text key={c.block.id} className="mt-1 font-sans text-label text-muted">
                    {fmtDate(c.iso)} · {planText(c.block.title)}
                  </Text>
                ))}
              </View>
            ) : null}
          </Card>

          <Card className="h-full">
            <SectionHeader
              title={L('Chia thời gian', 'Time split')}
              subtitle={L(`Tổng ${Math.round(plan.totalMinutes / 60)} giờ tới ngày thi.`, `${Math.round(plan.totalMinutes / 60)} hours in total until exam day.`)}
              icon="gauge"
            />
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
                          {en ? SKILL_LABEL_EN[s] : SKILL_LABEL[s]}
                          {input.weak.includes(s) ? L(' · phần yếu', ' · weak spot') : ''}
                        </Text>
                        <Text className="font-mid text-label text-muted">
                          {Math.round(plan.minutesBySkill[s] / 60)} {L('giờ', 'hr')} · {Math.round(share * 100)}%
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
  const { L, en } = useL();
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
              accessibilityLabel={`${(en ? WEEKDAY_LABEL_EN : WEEKDAY_LABEL)[weekday]}: ${
                !study ? L('nghỉ', 'rest') : complete ? L('đã học xong', 'done') : missed ? L('bỏ lỡ', 'missed') : L('chưa học', 'not yet')
              }`}
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
              {(en ? WEEKDAY_LABEL_EN : WEEKDAY_SHORT)[weekday]}
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
