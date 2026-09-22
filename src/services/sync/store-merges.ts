import { planRank, type PlanId } from '@/lib/billing/plans';

import { mergeRecords, sortByFinishedDesc, unionByKey, unionStrings } from './merge';
import type { QuestBattleResult } from '@/services/quest/types';

/**
 * Luật gộp của từng store, viết dưới dạng HÀM THUẦN.
 *
 * Tách khỏi `stores.ts` vì file kia phải import zustand store, mà store lại
 * import `react-native` — thứ mà bộ chạy test của Node không parse được. Ranh
 * giới này không chỉ để test chạy: nó cũng đúng về thiết kế, vì phần dễ sai
 * nhất (gộp dữ liệu) không cần biết gì về React.
 *
 * Câu hỏi phải trả lời đúng cho mỗi trường: đây là LỊCH SỬ TÍCH LUỸ hay là một
 * LỰA CHỌN? Tích luỹ thì hợp hai tập, không bao giờ mất. Lựa chọn thì bên sửa
 * sau thắng. Nhầm loại đầu thành loại sau là cách mất dữ liệu âm thầm nhất.
 */

export type MathPayload = { sessions: { id: string; finishedAt: string }[] };

export function mergeMath(local: unknown, remote: unknown | null): MathPayload {
  const a = (local as MathPayload | null) ?? { sessions: [] };
  const b = (remote as MathPayload | null) ?? { sessions: [] };
  return {
    sessions: sortByFinishedDesc(unionByKey(a.sessions ?? [], b.sessions ?? [], (s) => s.id)),
  };
}

export type StudyPayload = {
  sessions: { id: string; finishedAt: string }[];
  progress: Record<string, { lastReadAt: string; percentCompleted: number }>;
  daily: Record<string, { minutes: number; questions: number; wordsReviewed: number }>;
  bookmarks: string[];
  targetBand: number;
  dailyGoalMinutes: number;
  readingWpm: number[];
};

export function mergeStudy(local: unknown, remote: unknown | null): StudyPayload {
  const a = (local as StudyPayload | null) ?? emptyStudy();
  const b = remote as StudyPayload | null;
  if (!b) return a;

  return {
    sessions: sortByFinishedDesc(unionByKey(a.sessions ?? [], b.sessions ?? [], (s) => s.id)),

    // Cùng một bài đọc trên hai máy: giữ lần đọc XA HƠN, không phải lần ghi
    // sau. Mở lại bài rồi thoát ngay không được phép kéo tiến độ tụt về.
    progress: mergeRecords(a.progress ?? {}, b.progress ?? {}, (x, y) =>
      (x?.percentCompleted ?? 0) >= (y?.percentCompleted ?? 0) ? x : y,
    ),

    // Phút học trong ngày: lấy số LỚN HƠN. Cộng dồn thì đồng bộ hai lần là
    // thành tích tự nhân đôi, mà chuỗi ngày lại dựa vào chính con số này.
    daily: mergeDaily(a.daily ?? {}, b.daily ?? {}),

    bookmarks: unionStrings(a.bookmarks ?? [], b.bookmarks ?? []),

    // Hai cái dưới là LỰA CHỌN, không phải tích luỹ: máy đang đăng nhập thắng.
    targetBand: a.targetBand ?? b.targetBand,
    dailyGoalMinutes: a.dailyGoalMinutes ?? b.dailyGoalMinutes,

    readingWpm: [...(b.readingWpm ?? []), ...(a.readingWpm ?? [])].slice(-50),
  };
}

function emptyStudy(): StudyPayload {
  return {
    sessions: [],
    progress: {},
    daily: {},
    bookmarks: [],
    targetBand: 7,
    dailyGoalMinutes: 60,
    readingWpm: [],
  };
}

function mergeDaily(
  local: StudyPayload['daily'],
  remote: StudyPayload['daily'],
): StudyPayload['daily'] {
  const keys = unionStrings(Object.keys(local), Object.keys(remote));
  const out: StudyPayload['daily'] = {};
  for (const key of keys) {
    const l = local[key];
    const r = remote[key];
    out[key] = {
      ...(r ?? {}),
      ...(l ?? {}),
      minutes: Math.max(l?.minutes ?? 0, r?.minutes ?? 0),
      questions: Math.max(l?.questions ?? 0, r?.questions ?? 0),
      wordsReviewed: Math.max(l?.wordsReviewed ?? 0, r?.wordsReviewed ?? 0),
    };
  }
  return out;
}

export type VocabPayload = {
  entries: Record<string, unknown>;
  cards: Record<string, unknown>;
  wordStatus: Record<string, { timesSeen: number; lastSeenAt: string }>;
  reviewLog: unknown[];
};

export function mergeVocab(local: unknown, remote: unknown | null): VocabPayload {
  const a = (local as VocabPayload | null) ?? emptyVocab();
  const b = remote as VocabPayload | null;
  if (!b) return a;

  return {
    // Từ đã lưu: hợp hai tập. Xoá một từ ở máy này KHÔNG xoá ở máy kia — đánh
    // đổi có ý thức, vì mất một từ đã lưu khó chịu hơn thấy lại một từ tưởng đã xoá.
    entries: { ...(b.entries ?? {}), ...(a.entries ?? {}) },

    // Thẻ FSRS: giữ bản ôn gần đây hơn. Chọn nhầm là lịch ôn lùi về quá khứ và
    // thẻ hiện lại ngay hôm sau — phá đúng cái mà giãn cách lặp lại sinh ra để làm.
    cards: mergeRecords(a.cards ?? {}, b.cards ?? {}, pickFresherCard),

    wordStatus: mergeRecords(a.wordStatus ?? {}, b.wordStatus ?? {}, (x, y) =>
      (x?.timesSeen ?? 0) >= (y?.timesSeen ?? 0) ? x : y,
    ),

    reviewLog: [...(b.reviewLog ?? []), ...(a.reviewLog ?? [])].slice(-2000),
  };
}

function emptyVocab(): VocabPayload {
  return { entries: {}, cards: {}, wordStatus: {}, reviewLog: [] };
}

function pickFresherCard(a: unknown, b: unknown): unknown {
  const at = (a as { last_review?: string } | null)?.last_review ?? '';
  const bt = (b as { last_review?: string } | null)?.last_review ?? '';
  return at >= bt ? a : b;
}

export type BillingPayload = {
  plan: PlanId;
  expiresAt: string | null;
  source: 'local' | 'trial' | 'server';
  usage: Record<string, { count: number; periodKey: string }>;
};

/**
 * Gộp gói và số lượt đã dùng.
 *
 * HAI LUẬT NGƯỢC CHIỀU NHAU, và cả hai đều cố ý:
 *
 *   Gói  → lấy bên CAO HƠN. Đồng bộ không bao giờ được HẠ gói của người dùng.
 *          Mua Max trên điện thoại rồi mở máy tính (đang Free) mà bị kéo về Free
 *          là mất tiền oan, và đó là kiểu lỗi khiến người ta đòi hoàn tiền.
 *   Lượt → lấy bên CAO HƠN. Ngược lại thì đổi máy là một cách reset hạn mức,
 *          và hạn mức thành vô nghĩa.
 *
 * Hạn cuối đi kèm gói cao hơn, không lấy hạn xa nhất của hai bên — ghép gói của
 * bên này với hạn của bên kia là tạo ra một gói chưa từng tồn tại.
 */
export function mergeBilling(local: unknown, remote: unknown | null): BillingPayload {
  const a = (local as BillingPayload | null) ?? emptyBilling();
  const b = remote as BillingPayload | null;
  if (!b) return a;

  // Thứ hạng lấy thẳng từ bảng giá (`planRank`), không chép tay. Bản trước là
  // một object viết tay; thêm một gói vào bảng giá mà quên sửa ở đây thì gói mới
  // xếp hạng 0 và ĐỒNG BỘ SẼ HẠ CẤP người đã trả tiền xuống Free.
  const winner = planRank(b.plan ?? 'free') > planRank(a.plan ?? 'free') ? b : a;

  const usage: BillingPayload['usage'] = { ...(b.usage ?? {}) };
  for (const [quota, entry] of Object.entries(a.usage ?? {})) {
    const other = usage[quota];
    // Khác chu kỳ thì bên nào thuộc chu kỳ hiện tại mới đáng giữ; cùng chu kỳ
    // thì lấy số lớn hơn.
    if (!other) usage[quota] = entry;
    else if (other.periodKey !== entry.periodKey) {
      usage[quota] = entry.periodKey > other.periodKey ? entry : other;
    } else {
      usage[quota] = { ...entry, count: Math.max(entry.count, other.count) };
    }
  }

  return {
    plan: winner.plan ?? 'free',
    expiresAt: winner.expiresAt ?? null,
    source: winner.source ?? 'local',
    usage,
  };
}

function emptyBilling(): BillingPayload {
  return { plan: 'free', expiresAt: null, source: 'local', usage: {} };
}

export type QuestPayload = {
  xp: number;
  level: number;
  stars: Record<string, number>;
  unlockedNodes: string[];
  completedBattles: QuestBattleResult[];
    wrongQuestionIds: string[];
    ownedCosmetics: string[];
    equippedCosmetic: string | null;
};

/** Quest is an append-only history plus monotonic unlocks; never downgrade progress on merge. */
export function mergeQuest(local: unknown, remote: unknown | null): QuestPayload {
  const a = (local as QuestPayload | null) ?? emptyQuest();
  const b = (remote as QuestPayload | null) ?? emptyQuest();
  const battles = unionByKey(a.completedBattles ?? [], b.completedBattles ?? [], (battle) => battle.battleId)
    .sort((x, y) => y.completedAt.localeCompare(x.completedAt))
    .slice(0, 50);
  const stars: Record<string, number> = { ...(b.stars ?? {}) };
  for (const [nodeId, value] of Object.entries(a.stars ?? {})) stars[nodeId] = Math.max(stars[nodeId] ?? 0, value);
  return {
    xp: Math.max(a.xp ?? 0, b.xp ?? 0, battles.reduce((sum, battle) => sum + battle.xp, 0)),
    level: Math.max(a.level ?? 1, b.level ?? 1),
    stars,
    unlockedNodes: unionStrings(a.unlockedNodes ?? [], b.unlockedNodes ?? []),
    completedBattles: battles,
      wrongQuestionIds: unionStrings(a.wrongQuestionIds ?? [], b.wrongQuestionIds ?? []).slice(0, 100),
      ownedCosmetics: unionStrings(a.ownedCosmetics ?? [], b.ownedCosmetics ?? []),
      equippedCosmetic: a.equippedCosmetic ?? b.equippedCosmetic ?? null,
  };
}

function emptyQuest(): QuestPayload {
    return { xp: 0, level: 1, stars: {}, unlockedNodes: [], completedBattles: [], wrongQuestionIds: [], ownedCosmetics: [], equippedCosmetic: null };
}
