/**
 * BÀI GIAO CỦA LỚP — những loại bài app TỰ NHẬN RA được là đã làm hay chưa.
 *
 * Chỉ nhận loại bài có dấu vết chắc chắn trong dữ liệu học đã đồng bộ
 * (`user_state`). Bài Writing không có ở đây: bài viết không đồng bộ lên tài
 * khoản, nên giáo viên sẽ thấy "chưa làm" với một em đã viết xong — một con số
 * sai còn tệ hơn không có con số.
 *
 *   vocab_deck  — một bộ từ (50 bộ chủ đề IELTS, bài từ vựng SAT).
 *                 XONG khi ≥ 80% số từ của bộ ở chặng "nhớ được" (topic_study.stages).
 *                 ĐANG LÀM khi đã có từ nhận ra / nhớ được, hoặc đã mở bộ (lastAt).
 *   sat_chapter — một chương Lộ trình SAT Math (sat_roadmap.progress).
 *                 XONG khi một mức bất kỳ đạt ≥ 80% (đúng ngưỡng "qua mức" của
 *                 màn lộ trình). ĐANG LÀM khi đã làm ít nhất một lượt.
 *   math_set    — một bộ đề SAT Math trong lộ trình kỹ năng (math.sessions).
 *                 XONG khi có một lượt làm xong bộ đó (session.setId).
 *   speaking    — một lượt Phòng luyện nói theo phần thi (speaking.attempts).
 *                 XONG khi có lượt cùng phần thi, kết thúc SAU lúc giao bài, có ít
 *                 nhất một câu trả lời không bỏ qua. Loại này chung chung (không
 *                 gắn với một đề cụ thể) nên lượt làm TRƯỚC khi giao không tính.
 *
 * Ba loại đầu gắn với một nội dung cụ thể: em đã làm trước khi được giao vẫn
 * tính là xong — em đã làm đúng bài đó rồi.
 */
export const ASSIGNMENT_KINDS = ['vocab_deck', 'sat_chapter', 'math_set', 'speaking'] as const;
export type AssignmentKind = (typeof ASSIGNMENT_KINDS)[number];

export function isAssignmentKind(v: unknown): v is AssignmentKind {
  return typeof v === 'string' && (ASSIGNMENT_KINDS as readonly string[]).includes(v);
}

export const SPEAKING_MODES = ['full', 'p1', 'p2', 'p3'] as const;
export type SpeakingModeRef = (typeof SPEAKING_MODES)[number];

/** Tỉ lệ từ "nhớ được" để coi một bộ từ là xong. */
export const DECK_DONE_RATIO = 0.8;
/** Ngưỡng qua một mức của chương Lộ trình SAT Math — bằng `PASS_RATIO` của `data/sat-roadmap` (có test canh). */
export const CHAPTER_PASS_RATIO = 0.8;

export type Assignment = {
  id: string;
  kind: AssignmentKind;
  ref: string;
  title: string;
  due_on: string | null;
  created_at: string;
};

/**
 * Phần dữ liệu học của một học sinh mà Lớp học cần đọc. Mỗi trường là một khoá
 * `user_state` (đã cắt bớt — máy chủ chỉ xin đúng các nhánh này). `undefined` /
 * `null` = học sinh chưa đồng bộ khoá đó.
 */
export type StudentData = {
  /** Có ít nhất một dòng `user_state` — tức máy của em đã từng đồng bộ. */
  synced: boolean;
  study?: { daily?: Record<string, { minutes?: number; questions?: number; wordsReviewed?: number } | undefined> | null } | null;
  topicStudy?: { stages?: Record<string, Record<string, number> | undefined> | null; lastAt?: Record<string, string> | null } | null;
  satRoadmap?: { progress?: Record<string, Partial<Record<string, { correct: number; total: number; at?: string }>> | undefined> | null } | null;
  math?: { sessions?: { setId?: string | null; finishedAt?: string }[] | null } | null;
  speaking?: { attempts?: { mode?: string; finishedAt?: string; answers?: { skipped?: boolean }[] }[] | null } | null;
};

export type AssignmentState = 'done' | 'started' | 'todo' | 'unknown';
export type AssignmentStatus = { state: AssignmentState; have?: number; need?: number };

export type Resolvers = {
  /** Danh sách từ của một bộ; undefined nếu bộ không còn tồn tại. */
  deckWords: (slug: string) => readonly string[] | undefined;
};

const ms = (iso: string | undefined | null) => (iso ? Date.parse(iso) : NaN);

/** Trạng thái một bài giao với một học sinh. */
export function assignmentStatus(a: Pick<Assignment, 'kind' | 'ref' | 'created_at'>, d: StudentData, r: Resolvers): AssignmentStatus {
  if (!d.synced) return { state: 'unknown' };

  switch (a.kind) {
    case 'vocab_deck': {
      const words = r.deckWords(a.ref);
      if (!words || words.length === 0) return { state: 'unknown' };
      const stages = d.topicStudy?.stages?.[a.ref] ?? {};
      let mastered = 0;
      let touched = 0;
      for (const w of words) {
        const s = stages[w] ?? 0;
        if (s >= 2) mastered += 1;
        if (s >= 1) touched += 1;
      }
      const need = Math.ceil(words.length * DECK_DONE_RATIO);
      if (mastered >= need) return { state: 'done', have: mastered, need };
      const opened = !!d.topicStudy?.lastAt?.[a.ref];
      return { state: touched > 0 || opened ? 'started' : 'todo', have: mastered, need };
    }
    case 'sat_chapter': {
      const levels = d.satRoadmap?.progress?.[a.ref];
      const bests = Object.values(levels ?? {}).filter((b): b is { correct: number; total: number } => !!b && b.total > 0);
      if (bests.some((b) => b.correct / b.total >= CHAPTER_PASS_RATIO)) return { state: 'done' };
      return { state: bests.length > 0 ? 'started' : 'todo' };
    }
    case 'math_set': {
      const done = (d.math?.sessions ?? []).some((s) => s && s.setId === a.ref);
      return { state: done ? 'done' : 'todo' };
    }
    case 'speaking': {
      const since = ms(a.created_at);
      const done = (d.speaking?.attempts ?? []).some(
        (t) =>
          !!t &&
          t.mode === a.ref &&
          ms(t.finishedAt) >= (Number.isNaN(since) ? 0 : since) &&
          (t.answers ?? []).some((x) => x && !x.skipped),
      );
      return { state: done ? 'done' : 'todo' };
    }
    default:
      return { state: 'unknown' };
  }
}

/** Nơi học sinh làm bài này. */
export function assignmentHref(kind: AssignmentKind, ref: string): string {
  const id = encodeURIComponent(ref);
  switch (kind) {
    case 'vocab_deck':
      return `/vocabulary/topic/${id}`;
    case 'sat_chapter':
      return `/sat/lo-trinh/${id}`;
    case 'math_set':
      return `/math/set/${id}`;
    case 'speaking':
      return `/speaking?mode=${id}`;
  }
}

/** Những khoá `user_state` cần đọc cho các loại bài đang giao. */
export function storesNeeded(kinds: readonly AssignmentKind[]): ('math' | 'speaking')[] {
  const out: ('math' | 'speaking')[] = [];
  if (kinds.includes('math_set')) out.push('math');
  if (kinds.includes('speaking')) out.push('speaking');
  return out;
}
