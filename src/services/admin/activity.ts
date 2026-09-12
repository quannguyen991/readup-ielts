/**
 * Tóm tắt hoạt động học của một tài khoản, đọc từ bảng `user_state`.
 *
 * VÌ SAO PHẢI TÓM TẮT Ở ĐÂY. Dữ liệu học không nằm trong bảng quan hệ — mỗi kho
 * (math, study, vocab, billing) là một cục JSON. Muốn biết "người này học được
 * bao nhiêu" thì phải đọc cục ấy, và chỗ đọc phải là một hàm thuần có test, vì
 * hình dạng JSON đổi theo store mà không ai báo.
 *
 * CHỈ ĐẾM, KHÔNG ĐỌC NỘI DUNG. Trang quản trị cần biết tài khoản này có học thật
 * hay không — để xét hoàn tiền, để biết lượt mời có hợp lệ, để trả lời "sao tôi
 * mất dữ liệu". Nó KHÔNG cần đọc bài viết, ghi chú hay từng câu trả lời, nên
 * hàm này không trả ra thứ nào như thế.
 *
 * HỎNG THÌ TRẢ SỐ 0, KHÔNG NÉM LỖI. Một payload méo của một người không được làm
 * đổ cả trang quản trị.
 */

export type UserStateRow = {
  store_key: string;
  payload: unknown;
  updated_at: string;
};

export type UserActivity = {
  lastSyncAt: string | null;
  syncedStores: string[];
  /** Số ngày có ghi nhận hoạt động, cùng tổng phút và tổng câu đã làm. */
  activeDays: number;
  minutes: number;
  questions: number;
  firstDay: string | null;
  lastDay: string | null;
  readingSessions: number;
  mathSessions: number;
  articlesRead: number;
  articlesFinished: number;
  vocabWords: number;
  fsrsCards: number;
  bookmarks: number;
  /** Gói theo bản ghi của máy người dùng — có thể lệch với hồ sơ nếu chưa đồng bộ. */
  planOnDevice: string | null;
};

const EMPTY: UserActivity = {
  lastSyncAt: null,
  syncedStores: [],
  activeDays: 0,
  minutes: 0,
  questions: 0,
  firstDay: null,
  lastDay: null,
  readingSessions: 0,
  mathSessions: 0,
  articlesRead: 0,
  articlesFinished: 0,
  vocabWords: 0,
  fsrsCards: 0,
  bookmarks: 0,
  planOnDevice: null,
};

/** Đếm phần tử, nhận cả mảng lẫn object-theo-id — hai kho dùng hai kiểu khác nhau. */
function count(value: unknown): number {
  if (Array.isArray(value)) return value.length;
  if (value && typeof value === 'object') return Object.keys(value).length;
  return 0;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function num(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

export function summarizeUserState(rows: readonly UserStateRow[]): UserActivity {
  if (rows.length === 0) return { ...EMPTY };

  const out: UserActivity = { ...EMPTY, syncedStores: [] };

  for (const row of rows) {
    if (row.updated_at && (!out.lastSyncAt || row.updated_at > out.lastSyncAt)) {
      out.lastSyncAt = row.updated_at;
    }
    out.syncedStores.push(row.store_key);

    const payload = asRecord(row.payload);

    if (row.store_key === 'study') {
      const daily = asRecord(payload.daily);
      const days = Object.keys(daily).sort();
      out.activeDays = days.length;
      out.firstDay = days[0] ?? null;
      out.lastDay = days[days.length - 1] ?? null;
      for (const value of Object.values(daily)) {
        const day = asRecord(value);
        out.minutes += num(day.minutes);
        out.questions += num(day.questions);
      }

      out.readingSessions = count(payload.sessions);
      out.bookmarks = count(payload.bookmarks);

      const progress = asRecord(payload.progress);
      out.articlesRead = Object.keys(progress).length;
      out.articlesFinished = Object.values(progress).filter(
        (entry) => num(asRecord(entry).percentCompleted) >= 100,
      ).length;
    }

    if (row.store_key === 'math') out.mathSessions = count(payload.sessions);

    if (row.store_key === 'vocab') {
      out.vocabWords = count(payload.entries);
      out.fsrsCards = count(payload.cards);
    }

    if (row.store_key === 'billing') {
      out.planOnDevice = typeof payload.plan === 'string' ? payload.plan : null;
    }
  }

  out.syncedStores.sort();
  return out;
}
