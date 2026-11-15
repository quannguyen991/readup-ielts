import type { HsaQuestion } from '@/data/hsa';
import type { DayPlan } from './plan';
import type { HsaProfile } from './profile';
import type { AttemptItem } from './scoring';

/**
 * Một lượt làm bài lưu gọn: chỉ mã câu và đáp án đã chọn. Dạng câu, mức, đáp án đúng và lời giải lấy
 * lại từ ngân hàng câu theo mã, nên nhẹ (mấy chục byte mỗi câu) và đồng bộ lên tài khoản được.
 */
export type StoredAttempt = {
  id: string;
  activity: string;
  finishedAt: string;
  /** Số giây đã dùng; 0 nếu bài không bấm giờ. */
  seconds: number;
  items: [string, number | null][];
};

export const MAX_ATTEMPTS = 25;

export function storeItems(items: readonly AttemptItem[]): StoredAttempt['items'] {
  return items.map((it) => [it.qid, it.picked]);
}

/** Dựng lại các câu từ ngân hàng; câu nào không còn trong ngân hàng thì bỏ. */
export function restoreItems(stored: StoredAttempt, index: ReadonlyMap<string, HsaQuestion>): AttemptItem[] {
  const out: AttemptItem[] = [];
  for (const [qid, picked] of stored.items) {
    const q = index.get(qid);
    if (q) out.push({ qid, kind: q.kind, level: q.level, topic: q.topic, picked, answer: q.answer });
  }
  return out;
}

// ---------------------------------------------------------------- đồng bộ giữa các máy

export type HsaSynced = {
  profile: HsaProfile | null;
  attempts: StoredAttempt[];
  plans: Record<string, DayPlan>;
  done: Record<string, true>;
};

export const emptySynced = (): HsaSynced => ({ profile: null, attempts: [], plans: {}, done: {} });

const KEEP_PLANS = 21;

function isObj(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object' && !Array.isArray(v);
}

/** Đọc dữ liệu thô (từ máy chủ hoặc từ ổ lưu) thành dạng an toàn; trường hỏng thành rỗng. */
export function readSynced(raw: unknown): HsaSynced {
  const out = emptySynced();
  if (!isObj(raw)) return out;
  if (isObj(raw.profile) && typeof raw.profile.createdAt === 'string') out.profile = raw.profile as unknown as HsaProfile;
  if (Array.isArray(raw.attempts)) {
    out.attempts = raw.attempts.filter(
      (a): a is StoredAttempt => isObj(a) && typeof a.id === 'string' && typeof a.activity === 'string' && typeof a.finishedAt === 'string' && Array.isArray(a.items),
    );
  }
  if (isObj(raw.plans)) {
    for (const [k, v] of Object.entries(raw.plans)) if (isObj(v) && Array.isArray(v.tasks) && typeof v.createdAt === 'string') out.plans[k] = v as unknown as DayPlan;
  }
  if (isObj(raw.done)) for (const k of Object.keys(raw.done)) if (raw.done[k] === true) out.done[k] = true;
  return out;
}

export function mergeSynced(localRaw: unknown, remoteRaw: unknown | null): HsaSynced {
  const a = readSynced(localRaw);
  const b = readSynced(remoteRaw);

  const profile = !a.profile ? b.profile : !b.profile ? a.profile : a.profile.createdAt >= b.profile.createdAt ? a.profile : b.profile;

  const byId = new Map<string, StoredAttempt>();
  for (const at of [...b.attempts, ...a.attempts]) byId.set(at.id, at);
  const attempts = [...byId.values()].sort((x, y) => y.finishedAt.localeCompare(x.finishedAt)).slice(0, MAX_ATTEMPTS);

  const plans: Record<string, DayPlan> = { ...b.plans };
  for (const [k, p] of Object.entries(a.plans)) if (!plans[k] || p.createdAt >= plans[k]!.createdAt) plans[k] = p;
  const planKeys = Object.keys(plans).sort();
  for (const key of planKeys.slice(0, Math.max(0, planKeys.length - KEEP_PLANS))) delete plans[key];

  // Dấu "đã xong" gắn với ngày của kế hoạch; ngày nào đã bị cắt khỏi `plans` thì bỏ dấu của nó luôn.
  const done: Record<string, true> = {};
  for (const key of Object.keys({ ...b.done, ...a.done })) if (plans[key.split('|')[0]!]) done[key] = true;

  return { profile, attempts, plans, done };
}
