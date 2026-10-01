/**
 * NHẮC HỌC MỖI NGÀY — luật thuần (test ở `reminder.test.ts`).
 *
 * App chạy trên web, không có máy chủ đẩy thông báo, nên có hai đường:
 *  1. Thông báo của trình duyệt khi có một tab Band 9 đang mở (kể cả tab nền):
 *     tới giờ mà hôm nay chưa học phút nào thì nhắc MỘT lần.
 *  2. Tệp lịch .ics lặp lại mỗi ngày (có chuông) — thêm vào Google Calendar /
 *     lịch điện thoại là được nhắc cả khi không mở app. Nói thẳng điều này ở
 *     giao diện, không hứa "thông báo đẩy" mà app không có.
 */

/** "HH:MM" → số phút từ nửa đêm; sai dạng thì null. */
export function parseTime(s: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(s.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

/** Đã tới giờ nhắc hôm nay chưa (chưa nhắc lần nào hôm nay và hôm nay chưa học). */
export function dueNow(now: Date, time: string, lastFiredDay: string | null, todayKey: string, studiedToday: boolean): boolean {
  const t = parseTime(time);
  if (t === null || studiedToday || lastFiredDay === todayKey) return false;
  return now.getHours() * 60 + now.getMinutes() >= t;
}

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * Tệp lịch: một sự kiện 15 phút lặp mỗi ngày từ hôm nay, giờ địa phương
 * (không gắn múi giờ → lịch hiểu là giờ của máy), chuông báo đúng giờ.
 */
export function reminderIcs(time: string, url: string, today: Date, uid: string): string {
  const t = parseTime(time) ?? 20 * 60;
  const d = `${today.getFullYear()}${pad(today.getMonth() + 1)}${pad(today.getDate())}`;
  const start = `${d}T${pad(Math.floor(t / 60))}${pad(t % 60)}00`;
  const endMin = t + 15;
  const end = `${d}T${pad(Math.floor(endMin / 60) % 24)}${pad(endMin % 60)}00`;
  const stamp = today.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Band 9//Nhac hoc//VI',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${uid}@readup`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    'RRULE:FREQ=DAILY',
    'SUMMARY:Học Band 9 15 phút',
    `DESCRIPTION:Giữ chuỗi ngày học — mở ${url}`,
    `URL:${url}`,
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    'DESCRIPTION:Đến giờ học Band 9',
    'TRIGGER:PT0M',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
    '',
  ].join('\r\n');
}
