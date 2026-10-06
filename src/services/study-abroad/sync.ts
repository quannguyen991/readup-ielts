import { DEFAULT_DORM_DECORATIONS, STUDY_ABROAD_DECORATIONS, type DormSlot } from '@/data/study-abroad-dorm';

/** Học kỳ du học: nhiệm vụ đã xong, đồ trang trí phòng, lần nghỉ gần nhất. */
export type StudyAbroadPayload = {
  completed: string[];
  decorations: Record<DormSlot, string>;
  restedAt: string | null;
};

export function normalizeStudyAbroad(raw: unknown): StudyAbroadPayload {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Partial<StudyAbroadPayload>;
  const completed = Array.isArray(r.completed) ? [...new Set(r.completed.filter((x): x is string => typeof x === 'string'))] : [];
  const decorations = { ...DEFAULT_DORM_DECORATIONS };
  for (const slot of Object.keys(decorations) as DormSlot[]) {
    const id = r.decorations?.[slot];
    const item = STUDY_ABROAD_DECORATIONS.find((d) => d.id === id && d.slot === slot);
    if (item) decorations[slot] = item.id;
  }
  return { completed, decorations, restedAt: typeof r.restedAt === 'string' ? r.restedAt : null };
}

/**
 * Gộp hai máy: nhiệm vụ đã xong là một chiều (hợp hai bên, giữ thứ tự bên local trước), lần nghỉ lấy mốc mới hơn.
 * Đồ trang trí: ô nào máy này đã đổi khỏi mặc định thì giữ lựa chọn của máy này, còn lại nhận của máy kia —
 * rồi bỏ món chưa mở khoá theo danh sách nhiệm vụ đã xong sau khi gộp.
 */
export function mergeStudyAbroad(local: unknown, remote: unknown | null): StudyAbroadPayload {
  const a = normalizeStudyAbroad(local);
  if (remote === null || remote === undefined) return a;
  const b = normalizeStudyAbroad(remote);
  const completed = [...new Set([...a.completed, ...b.completed])];
  const decorations = { ...DEFAULT_DORM_DECORATIONS };
  for (const slot of Object.keys(decorations) as DormSlot[]) {
    const pick = a.decorations[slot] !== DEFAULT_DORM_DECORATIONS[slot] ? a.decorations[slot] : b.decorations[slot];
    const item = STUDY_ABROAD_DECORATIONS.find((d) => d.id === pick);
    if (item && (!item.unlockMission || completed.includes(item.unlockMission))) decorations[slot] = pick;
  }
  const restedAt = [a.restedAt, b.restedAt].filter((x): x is string => !!x).sort().at(-1) ?? null;
  return { completed, decorations, restedAt };
}
