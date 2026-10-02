import type { DisplayLang, NarrationLang } from './types';

/**
 * TIẾN ĐỘ ĐỌC lịch sử — hàm thuần để test và để đồng bộ (khoá `history`, cộng thêm, không đụng khoá cũ).
 * Chỉ tiến độ được đồng bộ; tuỳ chọn hiển thị / tốc độ nằm ở từng máy.
 */

export type SceneProgress = {
  /** ISO — lần đầu đánh dấu đã đọc xong. */
  completedAt?: string;
  /** ISO — lần mở gần nhất. */
  openedAt?: string;
  /** Mã câu hỏi → lựa chọn gần nhất. */
  answers?: Record<string, number>;
};

export type TopicProgress = {
  lastSceneId?: string;
  updatedAt: string;
  scenes: Record<string, SceneProgress>;
};

export type HistoryProgress = { topics: Record<string, TopicProgress> };

export type HistoryPrefs = {
  displayLang: DisplayLang;
  narrationLang: NarrationLang;
  speed: number;
  autoAdvance: boolean;
};

export const DEFAULT_PREFS: HistoryPrefs = { displayLang: 'both', narrationLang: 'en', speed: 1, autoAdvance: false };

const empty = (iso: string): TopicProgress => ({ updatedAt: iso, scenes: {} });

export function openScene(p: HistoryProgress, topicId: string, sceneId: string, iso: string): HistoryProgress {
  const t = p.topics[topicId] ?? empty(iso);
  const sc = t.scenes[sceneId] ?? {};
  return {
    topics: { ...p.topics, [topicId]: { ...t, lastSceneId: sceneId, updatedAt: iso, scenes: { ...t.scenes, [sceneId]: { ...sc, openedAt: iso } } } },
  };
}

export function completeScene(p: HistoryProgress, topicId: string, sceneId: string, iso: string): HistoryProgress {
  const t = p.topics[topicId] ?? empty(iso);
  const sc = t.scenes[sceneId] ?? {};
  if (sc.completedAt) return p;
  return { topics: { ...p.topics, [topicId]: { ...t, updatedAt: iso, scenes: { ...t.scenes, [sceneId]: { ...sc, completedAt: iso } } } } };
}

export function answerQuestion(p: HistoryProgress, topicId: string, sceneId: string, questionId: string, choice: number, iso: string): HistoryProgress {
  const t = p.topics[topicId] ?? empty(iso);
  const sc = t.scenes[sceneId] ?? {};
  return {
    topics: {
      ...p.topics,
      [topicId]: { ...t, updatedAt: iso, scenes: { ...t.scenes, [sceneId]: { ...sc, answers: { ...(sc.answers ?? {}), [questionId]: choice } } } },
    },
  };
}

export function completedCount(p: HistoryProgress, topicId: string, sceneIds: readonly string[]): number {
  const t = p.topics[topicId];
  return sceneIds.filter((id) => !!t?.scenes[id]?.completedAt).length;
}

/** Cảnh nên mở khi vào chủ đề: cảnh đang đọc dở nếu còn trong danh sách, không thì cảnh đầu tiên chưa xong, không thì cảnh đầu. */
export function resumeScene(p: HistoryProgress, topicId: string, sceneIds: readonly string[]): string | null {
  if (sceneIds.length === 0) return null;
  const t = p.topics[topicId];
  if (t?.lastSceneId && sceneIds.includes(t.lastSceneId)) return t.lastSceneId;
  return sceneIds.find((id) => !t?.scenes[id]?.completedAt) ?? sceneIds[0]!;
}

const later = (a?: string, b?: string): string | undefined => (a && b ? (a > b ? a : b) : (a ?? b));
const earlier = (a?: string, b?: string): string | undefined => (a && b ? (a < b ? a : b) : (a ?? b));

function mergeScene(a: SceneProgress | undefined, b: SceneProgress | undefined): SceneProgress {
  const out: SceneProgress = {};
  const done = earlier(a?.completedAt, b?.completedAt);
  if (done) out.completedAt = done;
  const opened = later(a?.openedAt, b?.openedAt);
  if (opened) out.openedAt = opened;
  const answers = { ...(a?.answers ?? {}), ...(b?.answers ?? {}) };
  if (Object.keys(answers).length) out.answers = answers;
  return out;
}

/**
 * Gộp hai máy: đã đọc xong là một chiều (không bao giờ bị bỏ dấu bởi bản cũ hơn); mốc mở / cảnh dở lấy
 * bản MỚI hơn; đáp án lấy bản mới hơn của chủ đề khi hai bên cùng trả lời một câu.
 */
export function mergeHistory(local: HistoryProgress | null | undefined, remote: HistoryProgress | null | undefined): HistoryProgress {
  const l = local?.topics ?? {};
  const r = remote?.topics ?? {};
  const topics: Record<string, TopicProgress> = {};
  for (const id of new Set([...Object.keys(l), ...Object.keys(r)])) {
    const a = l[id];
    const b = r[id];
    if (!a || !b) {
      topics[id] = (a ?? b)!;
      continue;
    }
    const newer = a.updatedAt >= b.updatedAt ? a : b;
    const older = newer === a ? b : a;
    const scenes: Record<string, SceneProgress> = {};
    for (const sid of new Set([...Object.keys(a.scenes), ...Object.keys(b.scenes)])) {
      const merged = mergeScene(older.scenes[sid], newer.scenes[sid]); // bản mới ghi đè đáp án
      scenes[sid] = merged;
    }
    topics[id] = { lastSceneId: newer.lastSceneId ?? older.lastSceneId, updatedAt: later(a.updatedAt, b.updatedAt)!, scenes };
  }
  return { topics };
}

/** Làm sạch dữ liệu từ máy chủ / bộ nhớ cũ. */
export function normalizeHistory(raw: unknown): HistoryProgress {
  const topics: Record<string, TopicProgress> = {};
  const src = (raw as HistoryProgress | null)?.topics;
  if (src && typeof src === 'object') {
    for (const [id, t] of Object.entries(src)) {
      if (!t || typeof t !== 'object' || typeof t.updatedAt !== 'string') continue;
      topics[id] = { lastSceneId: typeof t.lastSceneId === 'string' ? t.lastSceneId : undefined, updatedAt: t.updatedAt, scenes: t.scenes && typeof t.scenes === 'object' ? t.scenes : {} };
    }
  }
  return { topics };
}
