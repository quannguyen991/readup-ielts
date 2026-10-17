import { themedHex } from '@/theme/palette-state';
import React, { useMemo, useState } from 'react';
import { HEADER_ART_MIN } from '@/components/three/hero-star-policy';
import { Platform, Pressable, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { Grid } from '@/components/layout/Grid';
import { Screen } from '@/components/layout/Screen';
import { Appear, CrossFade } from '@/components/motion/Motion';
import { PlanBlockRow } from '@/components/plan/PlanBlockRow';
import { TemplatePlan } from '@/components/plan/TemplatePlan';
import { RoadmapView } from '@/components/roadmap/RoadmapView';
import { CuteCalendar } from '@/components/illust/Cute';
import { Motion } from '@/components/illust/CuteMore';
import { Sticker } from '@/components/illust/Sticker';
import { Button, Icon } from '@/components/ui';
import { SKILL_LABEL, WEEKDAY_LABEL, daysBetween, validatePlanInput, type GoalInput, type Phase, type PlanInput, type Skill } from '@/services/plan/custom';
import { todayKey } from '@/store/persist';
import { useCustomPlan, useRoadmapStore } from '@/store/useRoadmapStore';
import { useL } from '@/i18n/useL';
import { GOLD_BUTTON } from '@/components/layout/phone-theme';
import { CatSticker } from '@/components/mascot/CatSticker';

/* Bản tiếng Anh cho nhãn lấy từ services/plan/custom (bản tiếng Việt giữ ở đó). */
const SKILL_LABEL_EN: Record<Skill, string> = {
  reading: 'IELTS Reading',
  listening: 'Listen & dictate',
  writing: 'IELTS Writing',
  vocab: 'Vocabulary',
  math: 'SAT Math',
  verbal: 'SAT Verbal',
};
const WEEKDAY_LABEL_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEKDAY_SHORT = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];


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

  const showSetup = !input || Boolean(sua) || !plan;
  return (
    <Screen cat={showSetup ? 'think' : undefined}>
      <CrossFade swapKey={showSetup ? 'setup' : 'plan'}>
        {showSetup || !input || !plan ? (
          <PlanSetup initial={input} />
        ) : (
          <RoadmapView input={input} plan={plan} onEdit={() => router.setParams({ sua: '1' })} />
        )}
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
  /** Mực nâu ấm: chữ chính và nền tối của phiếu (thay navy cũ, lệch với nền vàng). */
  ink: themedHex('#3B2A10'),
  /** Vàng đậm: nền của mục đang chọn; chữ trắng đọc rõ trên đây. */
  deep: themedHex('#8C6A1F'),
  gold: '#A8843F',
  goldDeep: '#8F6E36',
  goldLight: '#E2C88F',
  paper: '#FFFBF0',
  line: '#EADFC6',
  muted: '#6B5C3E',
  canvas: '#F7E7B8',
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
                style={{ flex: 1, maxWidth: 56, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: on ? P.deep : P.line, backgroundColor: on ? P.deep : '#FFFFFF' }}
              >
                <Text className="font-strong" style={{ fontSize: 13, color: on ? '#FFFFFF' : P.muted }}>
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
                  <Text className="font-strong" style={{ fontSize: 14, color: P.ink }}>
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
            <Text className="font-heavy" style={{ marginTop: 2, fontSize: wide ? 38 : 28, lineHeight: wide ? 44 : 34, color: P.ink }}>
              {initial ? L('Sửa lộ trình', 'Edit your plan') : L('Lập lộ trình', 'Build your plan')}
            </Text>
            <Text className="font-sans" style={{ marginTop: 4, fontSize: 15, color: P.muted }}>
              {L('Điền bốn mục, app xếp từng buổi vào đúng bài.', 'Fill in four steps and the app maps every session to the right lesson.')}
            </Text>
          </View>
          {width < HEADER_ART_MIN ? <CatSticker pose="peeking" size={64} /> : null}
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
            <Text className="font-heavy" style={{ fontSize: 19, lineHeight: 26, color: P.ink }}>
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
      style={{ flexGrow: 1, flexBasis: 120, maxWidth: 260, flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, borderWidth: on ? 1.5 : 1, borderColor: on ? P.deep : P.line, backgroundColor: on ? P.deep : '#FFFFFF' }}
    >
      <CheckSquare on={on} light={on} />
      <View>
        <Text className="font-heavy" style={{ fontSize: 18, lineHeight: 22, color: on ? '#FFFFFF' : P.ink }}>
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
            <Text className="font-heavy" style={{ fontSize: 14, color: on ? P.ink : P.muted }}>
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
        <Text className="font-heavy" style={{ fontSize: compact ? 34 : 44, lineHeight: compact ? 40 : 50, color: goal.now === null ? '#B7AC95' : P.ink }}>
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
            <Pressable key={m} accessibilityRole="button" aria-selected={mode === m} onPress={() => setMode(m)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 7, backgroundColor: mode === m ? P.deep : '#FFFFFF' }}>
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: m === 'target' ? P.gold : 'transparent', borderWidth: 2, borderColor: m === 'target' ? P.gold : mode === m ? '#FFFFFF' : P.ink }} />
              <Text className="font-strong" style={{ fontSize: 13, color: mode === m ? '#FFFFFF' : P.ink }}>
                {m === 'target' ? L('Đặt mục tiêu', 'Set target') : L('Đặt điểm bây giờ', 'Set current')}
              </Text>
            </Pressable>
          ))}
        </View>
        {mode === 'now' ? (
          <Pressable accessibilityRole="button" aria-selected={goal.now === null} onPress={() => onChange({ ...goal, now: null })} style={{ borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7, borderWidth: 1, borderColor: goal.now === null ? P.ink : P.line, backgroundColor: '#FFFFFF' }}>
            <Text className="font-strong" style={{ fontSize: 13, color: P.ink }}>
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
            <View style={{ position: 'absolute', left: `${nPos}%`, marginLeft: -9, width: 18, height: 18, borderRadius: 9, backgroundColor: '#FFFFFF', borderWidth: 3, borderColor: P.ink }} />
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
                <View style={{ width: 2, height: major ? 12 : 7, borderRadius: 1, backgroundColor: ok ? P.ink : '#D9CEB6' }} />
                <Text className={chosen ? 'font-heavy' : 'font-semi'} style={{ marginTop: 4, fontSize: compact ? 11 : 13, color: v === goal.target ? P.goldDeep : chosen ? P.ink : ok ? P.muted : '#C9BFA9' }}>
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
              <Pressable key={w} accessibilityRole="button" aria-selected={on} onPress={() => onChange(iso)} style={{ borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: on ? P.deep : P.line, backgroundColor: on ? P.deep : '#FFFFFF' }}>
                <Text className="font-strong" style={{ fontSize: 12, color: on ? '#FFFFFF' : P.ink }}>
                  {L(`Sau ${w} tuần`, `In ${w} weeks`)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
      <View style={{ minWidth: 120, alignItems: 'flex-start', borderLeftWidth: 2, borderColor: P.goldLight, paddingLeft: 14 }}>
        <Text className="font-heavy" style={{ fontSize: 40, lineHeight: 44, color: left === null ? '#B7AC95' : P.ink }}>
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
          <Pressable key={m} accessibilityRole="button" aria-selected={on} onPress={() => onChange(m)} style={{ flex: 1, alignItems: 'center', borderRadius: 9, paddingVertical: 9, backgroundColor: on ? P.deep : 'transparent' }}>
            <Text className="font-strong" numberOfLines={1} style={{ fontSize: 13, color: on ? '#FFFFFF' : P.ink }}>
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
    <View style={{ borderRadius: 22, backgroundColor: P.ink, overflow: 'hidden' }}>
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
        <Pressable
          accessibilityRole="button"
          onPress={onSubmit}
          style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 999, paddingVertical: 15, ...GOLD_BUTTON, transform: [{ scale: pressed ? 0.98 : 1 }] } as never)}
        >
          <Text className="font-heavy" style={{ fontSize: 16, color: P.ink }}>
            {editing ? L('Lập lại lộ trình', 'Rebuild plan') : L('Lập lộ trình', 'Build plan')}
          </Text>
          <Icon name="arrow-right" size={18} color={P.ink} strokeWidth={2.2} />
        </Pressable>
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
  const style = { height: 44, borderWidth: 1, borderColor: P.line, borderRadius: 10, paddingLeft: 12, paddingRight: 12, fontSize: 15, color: P.ink, backgroundColor: disabled ? '#F4EFE4' : '#FFFFFF', width: '100%' as const, maxWidth: 280 };
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


