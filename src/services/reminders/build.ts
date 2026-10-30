/**
 * NHẮC HỌC QUA THÔNG BÁO ĐẨY / EMAIL — luật thuần, không chạm mạng hay store.
 *
 * Máy chủ (cron 20:00 giờ Việt Nam, `app/api/cron/reminders+api.ts`) đọc các
 * payload đồng bộ của một người trong bảng `user_state` rồi gọi `buildReminder`.
 * Dùng LẠI đúng các hàm mà giao diện đang dùng, để lời nhắc không bao giờ nói
 * khác những gì người học thấy trong app:
 *
 * - Số từ đến hạn: thẻ FSRS trong payload `vocab` (`services/vocab/fsrs-due.ts`) — cùng con số
 *   trang chủ, trang Ôn và khối "Ôn hôm nay" hiện. Chỉ khi tài khoản chưa có mục FSRS nào mới
 *   quay về lịch Leitner cũ (`topic_study.reviews`).
 * - Chuỗi ngày: `currentStreak` (`services/gamification/points.ts`) trên
 *   `study.daily`, tính cả ngày giữ chuỗi đã mua (`reward.frozenDays`).
 *
 * KHÔNG SPAM: không có gì đáng nói (không từ nào đến hạn, chuỗi không gặp nguy
 * hoặc chưa có chuỗi) thì trả `null` và máy chủ im lặng. Mỗi ngày nhiều nhất một
 * lời nhắc — phần đó do cột `last_sent_on` lo.
 */
import type { Locale } from '@/i18n/keys';
import { currentStreak, type DayLog } from '@/services/gamification/points';
import { dueBySlugBefore, NOTEBOOK_DECK, type VocabSlice } from '@/services/vocab/fsrs-due';
import { dueBySlug, type ReviewEntry } from '@/services/vocab/review-schedule';
import { SITE_ORIGIN } from '@/lib/site';

export type Reminder = { title: string; body: string; url: string };

/** Payload đồng bộ theo `store_key` (chỉ các khoá lời nhắc đọc tới). */
export type ReminderPayloads = Partial<Record<string, unknown>>;

/** Chuỗi ngắn hơn mức này thì "sắp đứt" chưa đáng một lời nhắc. */
export const MIN_STREAK_AT_RISK = 2;

const VN_OFFSET_MS = 7 * 60 * 60 * 1000;

/**
 * Ngày hôm nay theo giờ Việt Nam ("YYYY-MM-DD"), cộng thẳng +7 giờ.
 * KHÔNG dùng biến TZ / Intl với tên múi IANA: trên Windows chúng lặng lẽ thành
 * UTC và lệch 7 tiếng; Việt Nam không có giờ mùa hè nên +7 cố định là đúng.
 */
export function vnTodayKey(nowMs: number = Date.now()): string {
  return new Date(nowMs + VN_OFFSET_MS).toISOString().slice(0, 10);
}

function asRecord(v: unknown): Record<string, unknown> {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
}

/** Khoá ngày → Date lúc 12:00 GIỜ MÁY, để `dateKey`/`shiftDays` (đọc giờ máy) ra đúng khoá ấy ở mọi múi giờ. */
function localNoon(dayKey: string): Date {
  const [y, m, d] = dayKey.split('-').map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1, 12);
}

export type ReminderFacts = {
  /** Tổng số từ đến hạn hôm nay (gồm cả từ quá hạn). */
  due: number;
  /** Các bộ có từ đến hạn. */
  dueSlugs: string[];
  /** Hôm nay đã học (hoặc đã dùng thẻ giữ chuỗi). */
  activeToday: boolean;
  /** Chuỗi ngày tính tới hôm nay (hôm nay chưa học thì tính tới hôm qua). */
  streak: number;
};

export function reminderFacts(payloads: ReminderPayloads, today: string): ReminderFacts {
  const reviews = asRecord(asRecord(payloads.topic_study).reviews) as Record<string, Record<string, ReviewEntry>>;
  const daily = asRecord(asRecord(payloads.study).daily) as Record<string, DayLog>;
  const frozenRaw = asRecord(payloads.reward).frozenDays;
  const frozen = Array.isArray(frozenRaw) ? frozenRaw.filter((d): d is string => typeof d === 'string') : [];

  // Hết ngày Việt Nam (`today` là ngày VN): máy chủ chạy giờ UTC nên không dùng giờ máy.
  const endOfVnDay = Date.parse(`${today}T23:59:59.999+07:00`);
  const vocab = asRecord(payloads.vocab);
  const fsrs = { entries: asRecord(vocab.entries), cards: asRecord(vocab.cards) } as unknown as VocabSlice;
  const bySlug =
    Object.keys(fsrs.entries).length > 0
      ? dueBySlugBefore(fsrs, endOfVnDay, (e) => (e.id.startsWith('topic_') && e.articleId ? e.articleId : NOTEBOOK_DECK))
      : dueBySlug(reviews, today);
  const dueSlugs = Object.keys(bySlug);
  const due = dueSlugs.reduce((n, s) => n + (bySlug[s]?.length ?? 0), 0);
  const activeToday = (daily[today]?.minutes ?? 0) > 0 || frozen.includes(today);
  const streak = currentStreak(daily, localNoon(today), frozen);
  return { due, dueSlugs, activeToday, streak };
}

/**
 * Lời nhắc cho một người vào ngày `today` (YYYY-MM-DD giờ Việt Nam), hoặc `null`
 * khi không có gì đáng nói.
 */
export function buildReminder(payloads: ReminderPayloads, today: string, locale: Locale): Reminder | null {
  const { due, dueSlugs, activeToday, streak } = reminderFacts(payloads, today);
  const en = locale === 'en';
  const L = (vi: string, e: string) => (en ? e : vi);
  const streakAtRisk = !activeToday && streak >= MIN_STREAK_AT_RISK;

  const dueUrl =
    dueSlugs.length === 1
      ? `${SITE_ORIGIN}/vocabulary/topic/${encodeURIComponent(dueSlugs[0]!)}/quiz?only=due`
      : `${SITE_ORIGIN}/vocabulary/topics`;
  const words = (n: number) => (en ? `${n} ${n === 1 ? 'word' : 'words'}` : `${n} từ`);

  if (streakAtRisk) {
    return {
      title: L(`Chuỗi ${streak} ngày sắp đứt`, `Your ${streak}-day streak is about to break`),
      body:
        due > 0
          ? L(
              `Hôm nay bạn chưa học. Ôn ${words(due)} đến hạn trong 5 phút để giữ chuỗi.`,
              `You haven't studied today. Review ${words(due)} due in 5 minutes to keep it.`,
            )
          : L('Hôm nay bạn chưa học. Học 5 phút để giữ chuỗi.', "You haven't studied today. Study 5 minutes to keep it."),
      url: due > 0 ? dueUrl : `${SITE_ORIGIN}/dashboard`,
    };
  }

  if (due > 0) {
    return {
      title: L(`Hôm nay bạn còn ${words(due)} cần ôn`, `You have ${words(due)} to review today`),
      body: L(
        'Ôn đúng hạn là lúc từ vào trí nhớ dài hạn nhanh nhất — chỉ mất vài phút.',
        'Reviewing on the due day is when words stick best — it only takes a few minutes.',
      ),
      url: dueUrl,
    };
  }

  return null;
}

/** Lời nhắc của nút "Gửi thử": dùng lời nhắc thật nếu có, không thì một câu thử nghiệm. */
export function testReminder(payloads: ReminderPayloads, today: string, locale: Locale): Reminder {
  const real = buildReminder(payloads, today, locale);
  if (real) return real;
  const en = locale === 'en';
  return {
    title: en ? 'Band 9 reminders are on' : 'Đã bật nhắc học Band 9',
    body: en
      ? "This is a test. Today there's nothing due and your streak is safe, so the real reminder would stay quiet."
      : 'Đây là thông báo thử. Hôm nay không có từ đến hạn và chuỗi vẫn an toàn, nên lời nhắc thật sẽ im lặng.',
    url: `${SITE_ORIGIN}/settings`,
  };
}
