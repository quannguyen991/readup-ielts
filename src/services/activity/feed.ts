/**
 * Lịch sử hoạt động — HÀM THUẦN gộp mọi loại việc đã làm thành một dòng thời gian.
 *
 * Nguồn là các kho đã lưu và đã đồng bộ: lượt làm bài (`useStudyStore.sessions`), lượt nghe
 * (`useListeningStore`), lượt nói (`useSpeakingStore`), bài viết đã nộp (`useWritingStore`),
 * bài ngữ pháp đã đạt và nhiệm vụ hằng ngày (`useHubStore`). Không có nguồn nào được nhân bản
 * ở đây: trang này chỉ đọc và sắp xếp lại, nên không thể lệch với số liệu thật.
 */

export type FeedKind = 'test' | 'listening' | 'speaking' | 'writing' | 'vocab' | 'lesson' | 'daily';

export type FeedItem = {
  id: string;
  kind: FeedKind;
  title: string;
  /** Một dòng phụ: điểm, số từ, số việc… Trống thì không hiện. */
  detail: string;
  /** Mốc thời gian (ISO). Nhiệm vụ hằng ngày chỉ có ngày, nên lấy giữa trưa của ngày đó. */
  at: string;
};

export type FeedInput = {
  sessions?: ReadonlyArray<{
    id: string;
    articleTitle: string;
    mode: 'practice' | 'mock_test';
    rawScore: number;
    total: number;
    estimatedBand: number | null;
    finishedAt: string;
  }>;
  listening?: ReadonlyArray<{
    id: string;
    title: string;
    score: number;
    total: number;
    band: number;
    finishedAt: string;
  }>;
  speaking?: ReadonlyArray<{ id: string; titleVi: string; typed: boolean; finishedAt: string }>;
  writing?: ReadonlyArray<{ id: string; promptLabel: string; wordCount: number; submittedAt: string }>;
  vocab?: ReadonlyArray<{ id: string; title: string; correct: number; total: number; finishedAt: string }>;
  /** Bài ngữ pháp đã đạt: id, tên bài và lúc đạt. */
  lessons?: ReadonlyArray<{ id: string; title: string; at: string }>;
  /** Nhiệm vụ hằng ngày đã làm: `YYYY-MM-DD` → số việc đã xong trong ngày. */
  dailyDone?: Record<string, number>;
};

/** Tên loại việc, tiếng Việt và tiếng Anh. */
export const FEED_KIND_LABEL: Record<FeedKind, { vi: string; en: string }> = {
  test: { vi: 'Làm bài', en: 'Test' },
  vocab: { vi: 'Từ vựng', en: 'Vocabulary' },
  listening: { vi: 'Nghe', en: 'Listening' },
  speaking: { vi: 'Nói', en: 'Speaking' },
  writing: { vi: 'Viết', en: 'Writing' },
  lesson: { vi: 'Ngữ pháp', en: 'Grammar' },
  daily: { vi: 'Nhiệm vụ', en: 'Daily task' },
};

const stamp = (item: FeedItem) => Date.parse(item.at) || 0;

/** Mọi việc đã làm, mới nhất trước. Không có giới hạn: cắt ở chỗ hiển thị. */
export function buildActivityFeed(input: FeedInput): FeedItem[] {
  const items: FeedItem[] = [];

  for (const s of input.sessions ?? []) {
    const band = s.estimatedBand == null ? '' : `Band ${s.estimatedBand.toFixed(1)} · `;
    items.push({
      id: `test:${s.id}`,
      kind: 'test',
      title: s.articleTitle,
      detail: `${band}${s.rawScore}/${s.total} đúng${s.mode === 'mock_test' ? ' · thi thử' : ''}`,
      at: s.finishedAt,
    });
  }

  for (const a of input.listening ?? []) {
    items.push({
      id: `listening:${a.id}`,
      kind: 'listening',
      title: a.title,
      detail: `Band ${a.band.toFixed(1)} · ${a.score}/${a.total} đúng`,
      at: a.finishedAt,
    });
  }

  for (const a of input.speaking ?? []) {
    items.push({
      id: `speaking:${a.id}`,
      kind: 'speaking',
      title: a.titleVi,
      detail: a.typed ? 'Gõ phím, không chấm nói' : '',
      at: a.finishedAt,
    });
  }

  for (const w of input.writing ?? []) {
    items.push({
      id: `writing:${w.id}`,
      kind: 'writing',
      title: w.promptLabel,
      detail: `${w.wordCount} từ`,
      at: w.submittedAt,
    });
  }

  for (const v of input.vocab ?? []) {
    items.push({
      id: `vocab:${v.id}`,
      kind: 'vocab',
      title: v.title,
      detail: `${v.correct}/${v.total} đúng`,
      at: v.finishedAt,
    });
  }

  for (const l of input.lessons ?? []) {
    items.push({ id: `lesson:${l.id}`, kind: 'lesson', title: l.title, detail: '', at: l.at });
  }

  for (const [day, count] of Object.entries(input.dailyDone ?? {})) {
    if (count <= 0) continue;
    const [y, m, d] = day.split('-').map(Number);
    if (!y || !m || !d) continue;
    items.push({
      id: `daily:${day}`,
      kind: 'daily',
      title: 'Nhiệm vụ hôm nay',
      detail: `${count} việc đã xong`,
      at: new Date(y, m - 1, d, 12).toISOString(),
    });
  }

  return items.sort((a, b) => stamp(b) - stamp(a));
}

/** Gom theo ngày địa phương (YYYY-MM-DD), giữ thứ tự mới trước. */
export function groupFeedByDay(items: readonly FeedItem[]): Array<{ day: string; items: FeedItem[] }> {
  const groups = new Map<string, FeedItem[]>();
  for (const item of items) {
    const day = localDayOf(item.at);
    const list = groups.get(day);
    if (list) list.push(item);
    else groups.set(day, [item]);
  }
  return [...groups.entries()].map(([day, list]) => ({ day, items: list }));
}

/** Số việc theo loại trong khoảng `sinceMs` tới `now`. Dùng cho thống kê theo loại. */
export function countFeedByKind(
  items: readonly FeedItem[],
  now: number,
  sinceMs: number,
): Record<FeedKind, number> {
  const counts: Record<FeedKind, number> = { test: 0, listening: 0, speaking: 0, writing: 0, vocab: 0, lesson: 0, daily: 0 };
  const cutoff = now - sinceMs;
  for (const item of items) {
    const t = stamp(item);
    if (t >= cutoff && t <= now) counts[item.kind] += 1;
  }
  return counts;
}

/** Ngày địa phương của một mốc ISO: đúng ngày người học thấy trên máy của họ. */
export function localDayOf(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
