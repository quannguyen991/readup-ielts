import { mergeRecords, unionByKey, unionStrings } from '@/services/sync/merge';
import type { UserSet } from '@/store/useHubStore';

/**
 * Gộp tiến độ khu luyện nói giữa máy này và tài khoản (store `hub` trong user_state).
 *
 * Quy tắc từng trường, theo cùng nguyên tắc của các store khác:
 * - Lịch sử tích luỹ (nhiệm vụ đã làm, bài đã đạt, bộ tự tạo, bộ đã lưu): HỢP hai bên.
 * - Điểm tốt nhất và số lần luyện: lấy giá trị lớn hơn, không bao giờ tụt xuống.
 * - Slide thuyết trình: một giá trị duy nhất, giữ bản có nội dung ở máy này trước.
 */

export type HubPayload = {
  phonemeBest: Record<string, number>;
  phonemeTries: Record<string, number>;
  doneByDay: Record<string, string[]>;
  lessonsDone: Record<string, string>;
  roleplayDone: Record<string, number>;
  ieltsDone: Record<string, string>;
  userSets: UserSet[];
  saved: string[];
  slides: string[];
};

function empty(): HubPayload {
  return { phonemeBest: {}, phonemeTries: {}, doneByDay: {}, lessonsDone: {}, roleplayDone: {}, ieltsDone: {}, userSets: [], saved: [], slides: [] };
}

export function mergeHub(local: unknown, remote: unknown | null): HubPayload {
  const a = { ...empty(), ...((local as Partial<HubPayload> | null) ?? {}) };
  const b = { ...empty(), ...((remote as Partial<HubPayload> | null) ?? {}) };

  const maxNum = (x: number, y: number) => Math.max(x, y);
  const earlier = (x: string, y: string) => (x <= y ? x : y);

  return {
    phonemeBest: mergeRecords(a.phonemeBest, b.phonemeBest, maxNum),
    phonemeTries: mergeRecords(a.phonemeTries, b.phonemeTries, maxNum),
    doneByDay: mergeRecords(a.doneByDay, b.doneByDay, (x, y) => unionStrings(x, y)),
    lessonsDone: mergeRecords(a.lessonsDone, b.lessonsDone, earlier),
    roleplayDone: mergeRecords(a.roleplayDone, b.roleplayDone, maxNum),
    ieltsDone: mergeRecords(a.ieltsDone, b.ieltsDone, earlier),
    userSets: unionByKey(a.userSets, b.userSets, (s) => s.id),
    saved: unionStrings(a.saved, b.saved),
    slides: a.slides.length > 0 ? a.slides : b.slides,
  };
}
