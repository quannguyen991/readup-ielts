import {
  PLAN_CHECKPOINTS,
  PLAN_STAGES,
  PLAN_WEEKS,
  type PlanBlock,
  type PlanCheckpoint,
  type PlanStage,
  type PlanWeek,
} from './weeks';

/**
 * Lộ trình liên môn: hôm nay là tuần mấy, và tuần này mỗi buổi học gì.
 *
 * HAI NGUỒN, GHÉP LẠI Ở ĐÂY. Nội dung 60 tuần nằm ở `weeks.ts` (sinh ra từ
 * trang lộ trình đã chốt). Khung giờ trong ngày thì cố định theo lịch năm học:
 * khối từ vựng 08:50 mọi ngày, slot sáng 90 phút, và hai slot tối chạy cách
 * ngày — tối SAT Math vào T2, T4, T6, CN; tối kỹ năng viết/nghe vào T3, T5, T7.
 *
 * MỌI THỨ TÍNH TỪ NGÀY, KHÔNG LƯU TRẠNG THÁI. Không có "bạn đang ở tuần mấy"
 * cất trong máy để rồi lệch khi đổi thiết bị hay bỏ học một tuần — tuần suy ra
 * từ lịch, đúng như trang lộ trình trên giấy.
 *
 * DẪN THẲNG VÀO MÀN LÀM ĐƯỢC. Mỗi việc trong ngày kèm đường vào app nếu app
 * làm được việc ấy; không làm được (Speaking, đề Kaplan giấy) thì để trống và
 * nói rõ là học ngoài app, chứ không dẫn vào một màn không liên quan.
 */

/** Thứ Hai của tuần 1. */
export const PLAN_START_ISO = '2026-09-07';
export const SAT_EXAM_ISO = '2027-11-06';
export const PLAN_TOTAL_WEEKS = PLAN_WEEKS.length;

const DAY_MS = 86_400_000;

function atMidnight(date: Date): number {
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
}

/**
 * Hôm nay là tuần thứ mấy của lộ trình.
 *
 * Trả 0 nếu chưa tới ngày bắt đầu, và số lớn hơn 60 nếu đã qua — người dùng
 * đứng ngoài lộ trình vẫn phải thấy một con số thật, không phải bị kẹp về 1.
 */
export function weekNumber(today: Date, startIso: string = PLAN_START_ISO): number {
  const start = Date.parse(`${startIso}T00:00:00.000Z`);
  const diff = atMidnight(today) - start;
  if (diff < 0) return 0;
  return Math.floor(diff / (7 * DAY_MS)) + 1;
}

export function planWeek(week: number): PlanWeek | null {
  return PLAN_WEEKS.find((w) => w.week === week) ?? null;
}

export function stageOf(week: number): PlanStage | null {
  return PLAN_STAGES.find((s) => week >= s.fromWeek && week <= s.toWeek) ?? null;
}

/** Cửa kiểm tra gần nhất còn ở phía trước, kể cả cửa của chính tuần này. */
export function nextCheckpoint(week: number): PlanCheckpoint | null {
  return PLAN_CHECKPOINTS.find((c) => c.week >= week) ?? null;
}

export function daysUntil(iso: string, today: Date): number {
  return Math.ceil((Date.parse(`${iso}T00:00:00.000Z`) - atMidnight(today)) / DAY_MS);
}

/* ------------------------------------------------------------ việc trong ngày */

export type PlanSlotId = 'vocab' | 'morning' | 'evening';

export type PlanSlot = {
  id: PlanSlotId;
  /** Khung giờ theo lịch năm học, viết đúng như người dùng vẫn đọc. */
  when: string;
  title: string;
  detail: string;
  /** Màn trong app làm được việc này; `null` = học ngoài app. */
  href: string | null;
};

/**
 * Nhãn việc → màn trong app.
 *
 * So theo PHẦN ĐẦU của nhãn vì nhãn sinh từ trang lộ trình ("Đề Listening",
 * "Bài tập R&W"), không phải hằng số trong code. Không khớp thì trả `null` —
 * thà nói "học trong sách" còn hơn dẫn người học vào một màn chẳng liên quan.
 */
const ROUTES: { match: RegExp; href: string }[] = [
  { match: /^Reading/i, href: '/practice' },
  // "Đề full-length Kaplan" KHÔNG nằm ở đây: đó là sách giấy người dùng tự có,
  // app không có đề ấy. Dẫn sang thi thử của app là đưa nhầm đề cho một phép đo.
  { match: /^Đề trộn|^Đề đầy đủ/i, href: '/mock-tests' },
  { match: /^Listening|^Đề Listening/i, href: '/sentence/listen' },
  { match: /^Task 1|^Task 2|^Chữa đề và viết lại/i, href: '/write' },
  { match: /^Math|^Duy trì|^Đề Math/i, href: '/math' },
  { match: /^SAT R&W|^Bài tập R&W|^Đề R&W/i, href: '/sat-rw' },
  { match: /^Ôn nhẹ|^Sổ lỗi|^Ôn |^Làm lại/i, href: '/progress' },
];

export function routeFor(block: PlanBlock): string | null {
  if (!block) return null;
  return ROUTES.find((r) => r.match.test(block.label))?.href ?? null;
}

/**
 * Ba việc của hôm nay, theo đúng khung giờ năm học.
 *
 * Thứ Hai, Tư, Sáu và Chủ nhật là tối SAT Math; Ba, Năm, Bảy là tối kỹ năng
 * viết hoặc nghe. Chủ nhật không có slot sáng: theo lộ trình, chủ nhật chỉ
 * chữa lỗi và một unit từ vựng.
 */
export function todaySlots(today: Date, week: number = weekNumber(today)): PlanSlot[] {
  const plan = planWeek(week);
  if (!plan) return [];

  const weekday = today.getDay(); // 0 = chủ nhật
  const sunday = weekday === 0;
  const mathEvening = weekday === 1 || weekday === 3 || weekday === 5 || sunday;

  const slots: PlanSlot[] = [
    {
      id: 'vocab',
      when: '08:50 · 50 phút',
      title: 'Từ vựng',
      detail: plan.vocab ? `${plan.vocab} — quiz rồi làm bài tập của chính unit đó` : 'Quiz từ vựng',
      href: '/vocabulary/practice',
    },
  ];

  if (!sunday && plan.morning) {
    slots.push({
      id: 'morning',
      when: 'Sáng · 90 phút',
      title: plan.morning.label,
      detail: plan.morning.detail,
      href: routeFor(plan.morning),
    });
  }

  if (sunday) {
    slots.push({
      id: 'morning',
      when: 'Chủ nhật',
      title: 'Chữa lỗi',
      detail: 'Đọc lại câu sai trong tuần, không học nội dung mới',
      href: '/progress',
    });
  }

  const evening = mathEvening ? plan.eveningA : plan.eveningB;
  if (evening) {
    slots.push({
      id: 'evening',
      when: mathEvening ? 'Tối · SAT Math' : 'Tối · viết và nghe',
      title: evening.label,
      detail: evening.detail,
      href: routeFor(evening),
    });
  }

  return slots;
}
