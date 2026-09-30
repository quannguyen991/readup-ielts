import { effectivePlan } from '@/lib/billing/entitlements';
import { planRank, type PlanId } from '@/lib/billing/plans';
import { mergeReviewEntry, type ReviewEntry } from '@/services/vocab/review-schedule';

import { mergeRecords, sortByFinishedDesc, unionByKey, unionStrings } from './merge';

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
  // So theo gói CÒN HIỆU LỰC (vé Pro hết hạn coi như Free), cùng hạng thì lấy hạn
  // xa hơn (null = không hết hạn). Bản chỉ so hạng gói để một máy có vé Pro ĐÃ
  // HẾT HẠN thắng máy có vé Pro còn hạn — người dùng mất Pro ở máy kia.
  const now = new Date();
  const rankA = planRank(effectivePlan(a.plan ?? 'free', a.expiresAt ?? null, now));
  const rankB = planRank(effectivePlan(b.plan ?? 'free', b.expiresAt ?? null, now));
  const later = (x: string | null | undefined, y: string | null | undefined) => (x === null || x === undefined ? true : y === null || y === undefined ? false : x > y);
  const winner = rankB > rankA ? b : rankA > rankB ? a : later(b.expiresAt, a.expiresAt) && !later(a.expiresAt, b.expiresAt) ? b : a;

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

export type TopicStudyGameScore = { score: number; at: string };
export type TopicStudyMistake = { kind: string; word: string; slug: string; at: string };

export type TopicStudyPayload = {
  stages: Record<string, Record<string, number>>;
  scores: Record<string, TopicStudyGameScore[]>;
  starred: Record<string, string[]>;
  lapses: Record<string, Record<string, number>>;
  mistakeLog: TopicStudyMistake[];
  learnSettings?: Record<string, unknown>;
  lastAt: Record<string, string>;
  /** Lịch ôn theo ngày (có từ 30/09/2026 — bản cũ không có). */
  reviews?: Record<string, Record<string, ReviewEntry>>;
};

export function mergeTopicStudy(local: unknown, remote: unknown | null): TopicStudyPayload {
  const a = (local as TopicStudyPayload | null) ?? emptyTopicStudy();
  const b = remote as TopicStudyPayload | null;
  if (!b) return a;

  // Stages: hợp theo từng slug, với mỗi từ lấy stage lớn hơn (0: chưa học, 1: nhận ra, 2: nhớ được)
  const allStageSlugs = unionStrings(Object.keys(a.stages ?? {}), Object.keys(b.stages ?? {}));
  const stages: TopicStudyPayload['stages'] = {};
  for (const slug of allStageSlugs) {
    const lWords = a.stages?.[slug] ?? {};
    const rWords = b.stages?.[slug] ?? {};
    const words = unionStrings(Object.keys(lWords), Object.keys(rWords));
    stages[slug] = {};
    for (const w of words) {
      stages[slug][w] = Math.max(lWords[w] ?? 0, rWords[w] ?? 0);
    }
  }

  // Scores: top 5 điểm cao nhất mỗi bộ
  const allScoreSlugs = unionStrings(Object.keys(a.scores ?? {}), Object.keys(b.scores ?? {}));
  const scores: TopicStudyPayload['scores'] = {};
  for (const slug of allScoreSlugs) {
    const combined = [...(a.scores?.[slug] ?? []), ...(b.scores?.[slug] ?? [])];
    const seen = new Set<string>();
    const unique: TopicStudyGameScore[] = [];
    for (const item of combined) {
      const k = `${item.score}_${item.at}`;
      if (!seen.has(k)) {
        seen.add(k);
        unique.push(item);
      }
    }
    unique.sort((x, y) => y.score - x.score || y.at.localeCompare(x.at));
    scores[slug] = unique.slice(0, 5);
  }

  // Starred: hợp hai danh sách từ gắn sao
  const allStarSlugs = unionStrings(Object.keys(a.starred ?? {}), Object.keys(b.starred ?? {}));
  const starred: TopicStudyPayload['starred'] = {};
  for (const slug of allStarSlugs) {
    starred[slug] = unionStrings(a.starred?.[slug] ?? [], b.starred?.[slug] ?? []);
  }

  // Lapses: số lần sai lấy số lớn hơn để vòng sau ưu tiên hỏi lại
  const allLapseSlugs = unionStrings(Object.keys(a.lapses ?? {}), Object.keys(b.lapses ?? {}));
  const lapses: TopicStudyPayload['lapses'] = {};
  for (const slug of allLapseSlugs) {
    const lMap = a.lapses?.[slug] ?? {};
    const rMap = b.lapses?.[slug] ?? {};
    const words = unionStrings(Object.keys(lMap), Object.keys(rMap));
    lapses[slug] = {};
    for (const w of words) {
      lapses[slug][w] = Math.max(lMap[w] ?? 0, rMap[w] ?? 0);
    }
  }

  // Mistake log: hợp danh sách, khử trùng, giữ tối đa 400 dòng mới nhất
  const mistakesCombined = [...(b.mistakeLog ?? []), ...(a.mistakeLog ?? [])];
  const mistakeSeen = new Set<string>();
  const mistakeLog: TopicStudyMistake[] = [];
  for (const m of mistakesCombined) {
    const k = `${m.at}_${m.slug}_${m.word}_${m.kind}`;
    if (!mistakeSeen.has(k)) {
      mistakeSeen.add(k);
      mistakeLog.push(m);
    }
  }
  mistakeLog.sort((x, y) => x.at.localeCompare(y.at));
  const trimmedMistakes = mistakeLog.slice(-400);

  // Lịch ôn: từng từ lấy bản ôn gần nhất
  const reviews: NonNullable<TopicStudyPayload['reviews']> = {};
  for (const slug of unionStrings(Object.keys(a.reviews ?? {}), Object.keys(b.reviews ?? {}))) {
    const l = a.reviews?.[slug] ?? {};
    const r = b.reviews?.[slug] ?? {};
    reviews[slug] = {};
    for (const w of unionStrings(Object.keys(l), Object.keys(r))) {
      const m = mergeReviewEntry(l[w], r[w]);
      if (m) reviews[slug][w] = m;
    }
  }

  // Last at: mốc thời gian học gần nhất
  const allLastAtSlugs = unionStrings(Object.keys(a.lastAt ?? {}), Object.keys(b.lastAt ?? {}));
  const lastAt: TopicStudyPayload['lastAt'] = {};
  for (const slug of allLastAtSlugs) {
    const lTime = a.lastAt?.[slug] ?? '';
    const rTime = b.lastAt?.[slug] ?? '';
    lastAt[slug] = lTime >= rTime ? lTime : rTime;
  }

  return {
    stages,
    scores,
    starred,
    lapses,
    mistakeLog: trimmedMistakes,
    learnSettings: { ...(b.learnSettings ?? {}), ...(a.learnSettings ?? {}) },
    lastAt,
    reviews,
  };
}

function emptyTopicStudy(): TopicStudyPayload {
  return {
    stages: {},
    scores: {},
    starred: {},
    lapses: {},
    mistakeLog: [],
    learnSettings: {},
    lastAt: {},
  };
}
