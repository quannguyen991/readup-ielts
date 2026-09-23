/**
 * ĐỀ CỦA TUẦN — mỗi tuần một đề 10 câu, cả nước cùng làm đúng một đề.
 *
 * - Đề sinh từ MÃ TUẦN: cùng tuần thì ở máy nào cũng ra đúng 10 câu đó, không
 *   cần máy chủ phát đề. Tuần tính theo giờ Việt Nam (UTC+7), thứ Hai là đầu tuần.
 * - 5 câu SAT Math (sinh bằng khuôn, mỗi mảng kiến thức một câu) xen kẽ 5 câu
 *   SAT Verbal (chọn từ kho, mỗi mảng một câu).
 * - CHỈ LẦN LÀM ĐẦU TIÊN được tính: làm lại là luyện tập. Nếu không, người ta
 *   làm đi làm lại tới khi thuộc đề rồi mới leo bảng.
 * - Xếp hạng: nhiều câu đúng hơn đứng trên; bằng câu đúng thì ai nhanh hơn.
 *
 * Hàm thuần — test được, và máy chủ dùng đúng luật này.
 */
import { SAT_RW_QUESTIONS, type SatRwQuestion } from '@/data/sat-rw-repository';
import { MATH_SKILL_DOMAIN, type MathDomain, type MathItem, type MathSkill } from '@/lib/math/types';
import { generateMathSet } from '@/services/math/generator';
import { seededRng, shuffled } from '@/services/vocab/topic-study';

const VN_OFFSET = 7 * 3_600_000;
const DAY = 86_400_000;

/** Mã tuần dạng `w2026_39` (ISO week, giờ Việt Nam). Không có gạch ngang để dùng làm khoá JSON an toàn. */
export function weekId(now: number = Date.now()): string {
  const d = new Date(now + VN_OFFSET);
  // ISO: tuần chứa thứ Năm của nó; năm ISO là năm của thứ Năm ấy.
  const day = (d.getUTCDay() + 6) % 7; // 0 = thứ Hai
  const thursday = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - day + 3));
  const year = thursday.getUTCFullYear();
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4Day = (jan4.getUTCDay() + 6) % 7;
  const week = 1 + Math.round(((thursday.getTime() - jan4.getTime()) / DAY - 3 + jan4Day) / 7);
  return `w${year}_${String(week).padStart(2, '0')}`;
}

export function parseWeekId(id: string): { year: number; week: number } | null {
  const m = /^w(\d{4})_(\d{2})$/.exec(id);
  return m ? { year: Number(m[1]), week: Number(m[2]) } : null;
}

/** Thứ Hai 00:00 (giờ VN) của tuần, dưới dạng mốc UTC. */
export function weekStart(id: string): number {
  const p = parseWeekId(id);
  if (!p) return NaN;
  const jan4 = Date.UTC(p.year, 0, 4);
  const jan4Day = (new Date(jan4).getUTCDay() + 6) % 7;
  const mondayWeek1 = jan4 - jan4Day * DAY;
  return mondayWeek1 + (p.week - 1) * 7 * DAY - VN_OFFSET;
}

/** "22/9–28/9" */
export function weekLabel(id: string): string {
  const start = weekStart(id) + VN_OFFSET;
  const end = start + 6 * DAY;
  const f = (t: number) => {
    const d = new Date(t);
    return `${d.getUTCDate()}/${d.getUTCMonth() + 1}`;
  };
  return `${f(start)}–${f(end)}`;
}

/** Mili giây còn lại tới đề tuần sau. */
export function msUntilNextWeek(now: number = Date.now()): number {
  return weekStart(weekId(now)) + 7 * DAY - now;
}

export type WeeklyItem =
  | { kind: 'math'; id: string; item: MathItem }
  | { kind: 'verbal'; id: string; question: SatRwQuestion };

const MATH_DOMAINS: MathDomain[] = ['algebra', 'advanced_math', 'problem_solving_data', 'geometry_trig'];
const VERBAL_DOMAINS = ['Information and Ideas', 'Craft and Structure', 'Expression of Ideas', 'Standard English Conventions'];

export function buildWeeklyChallenge(id: string): WeeklyItem[] {
  const rand = seededRng(hash(id));
  const skillsOf = (d: MathDomain) => (Object.keys(MATH_SKILL_DOMAIN) as MathSkill[]).filter((s) => MATH_SKILL_DOMAIN[s] === d);
  // Bốn mảng Math mỗi mảng một câu, câu thứ năm lấy thêm ở Advanced Math (mảng nặng nhất đề thật).
  const mathSkills = [...MATH_DOMAINS, 'advanced_math' as MathDomain].map((d) => shuffled(skillsOf(d), rand)[0]!);
  const math: WeeklyItem[] = mathSkills.map((skill, i) => {
    const [item] = generateMathSet({ skills: [skill], count: 1, seed: `weekly:${id}:m${i}` });
    return { kind: 'math', id: `m${i}`, item: item! };
  });
  const used = new Set<string>();
  const verbal: WeeklyItem[] = [...VERBAL_DOMAINS, 'Expression of Ideas'].map((domain, i) => {
    const pool = shuffled(
      SAT_RW_QUESTIONS.filter((q) => q.domain === domain && !used.has(q.id)),
      rand,
    );
    const q = pool[0] ?? SAT_RW_QUESTIONS.find((x) => !used.has(x.id))!;
    used.add(q.id);
    return { kind: 'verbal', id: `v${i}`, question: q };
  });
  // Xen kẽ Math / Verbal.
  return math.flatMap((m, i) => [m, verbal[i]!]);
}

function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export type WeeklyResult = {
  score: number;
  total: number;
  /** Thời gian làm, mili giây. */
  ms: number;
  /** Lúc nộp (ISO). */
  at: string;
  /** Mã các câu sai, để xem lại. */
  wrong: string[];
};

export type Standing = { score: number; ms: number };

/** a đứng trên b? Nhiều câu đúng hơn; bằng câu đúng thì nhanh hơn. */
export function better(a: Standing, b: Standing): boolean {
  return a.score > b.score || (a.score === b.score && a.ms < b.ms);
}

/**
 * Thứ hạng của `mine` giữa `others` (không gồm chính mình): hạng, tổng số người,
 * và "top X%" (làm tròn lên — hạng 1/200 là top 1%, không phải top 0%).
 */
export function rankOf(mine: Standing, others: readonly Standing[]): { rank: number; total: number; topPercent: number } {
  const rank = 1 + others.filter((o) => better(o, mine)).length;
  const total = others.length + 1;
  return { rank, total, topPercent: Math.max(1, Math.ceil((rank / total) * 100)) };
}

/** Gộp kết quả giữa hai máy: mỗi tuần giữ LẦN LÀM ĐẦU TIÊN. */
export function mergeWeekly(
  local: Record<string, WeeklyResult> | undefined,
  remote: Record<string, WeeklyResult> | undefined,
): Record<string, WeeklyResult> {
  const out: Record<string, WeeklyResult> = { ...(remote ?? {}) };
  for (const [week, r] of Object.entries(local ?? {})) {
    const other = out[week];
    if (!other || new Date(r.at).getTime() < new Date(other.at).getTime()) out[week] = r;
  }
  return out;
}

/** "12 phút 05 giây" / "58 giây" */
export function formatDuration(ms: number): string {
  const s = Math.round(ms / 1000);
  const m = Math.floor(s / 60);
  return m > 0 ? `${m} phút ${String(s % 60).padStart(2, '0')} giây` : `${s} giây`;
}
