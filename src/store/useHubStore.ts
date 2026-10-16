import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { STORAGE_PREFIX, storage } from './persist';

/**
 * Tiến độ của khu vực luyện nói (tab Hôm nay / Học / Gia sư / Khám phá / Tiến độ).
 *
 * Chỉ giữ trên máy này, như các store khác của app. Các mốc quan trọng cũng đẩy
 * sang store chung: bài ngữ pháp đạt vào `useLessonStore`, nhiệm vụ hằng ngày vào
 * bộ đếm nhiệm vụ của `useGameStore` — để quà sách vẫn đếm đúng.
 */

export type UserSet = { id: string; title: string; items: string[]; createdAt: string };

type HubState = {
  /** Điểm tốt nhất từng đạt cho mỗi âm (0–100). */
  phonemeBest: Record<string, number>;
  /** Số lần luyện mỗi âm. */
  phonemeTries: Record<string, number>;
  /** Nhiệm vụ đã làm theo ngày: `YYYY-MM-DD` → id nhiệm vụ. */
  doneByDay: Record<string, string[]>;
  /** Bài ngữ pháp đã đạt: id bài → thời điểm. */
  lessonsDone: Record<string, string>;
  /** Số lần hoàn thành mỗi kịch bản nhập vai. */
  roleplayDone: Record<string, number>;
  /** Bài luyện nói IELTS đã đánh dấu xong: id bài → thời điểm. */
  ieltsDone: Record<string, string>;
  completeIelts: (id: string) => void;
  /** Điểm chấm cao nhất (0–100) cho từng cụm nói theo câu: id cụm → điểm. */
  phraseBest: Record<string, number>;
  recordPhrase: (id: string, pct: number) => void;
  /** Đề luyện nói theo chủ đề đã làm trọn: id chủ đề → thời điểm. */
  topicsDone: Record<string, string>;
  completeTopic: (id: string) => void;
  /** Bộ học do người học tự tạo. */
  userSets: UserSet[];
  /** Bộ học đã lưu (bookmark). */
  saved: string[];
  /** Nội dung slide để diễn tập thuyết trình (mỗi phần tử là một slide). */
  slides: string[];
  setSlides: (slides: string[]) => void;
  recordPhoneme: (symbol: string, score: number) => void;
  completeTask: (day: string, taskId: string) => boolean;
  completeLesson: (id: string) => void;
  completeRoleplay: (id: string) => void;
  addUserSet: (title: string, items: string[]) => void;
  removeUserSet: (id: string) => void;
  toggleSaved: (id: string) => void;
};

export const useHubStore = create<HubState>()(
  persist(
    (set, get) => ({
      phonemeBest: {},
      phonemeTries: {},
      doneByDay: {},
      lessonsDone: {},
      roleplayDone: {},
      ieltsDone: {},
      completeIelts: (id) => set((s) => ({ ieltsDone: { ...s.ieltsDone, [id]: s.ieltsDone[id] ?? new Date().toISOString() } })),
      phraseBest: {},
      recordPhrase: (id, pct) =>
        set((s) => ({ phraseBest: { ...s.phraseBest, [id]: Math.max(s.phraseBest[id] ?? 0, Math.round(pct)) } })),
      topicsDone: {},
      completeTopic: (id) => set((s) => ({ topicsDone: { ...s.topicsDone, [id]: s.topicsDone[id] ?? new Date().toISOString() } })),
      userSets: [],
      saved: [],
      slides: [],
      setSlides: (slides) => set({ slides: slides.slice(0, 30) }),
      recordPhoneme: (symbol, score) =>
        set((s) => ({
          phonemeBest: { ...s.phonemeBest, [symbol]: Math.max(s.phonemeBest[symbol] ?? 0, Math.round(score)) },
          phonemeTries: { ...s.phonemeTries, [symbol]: (s.phonemeTries[symbol] ?? 0) + 1 },
        })),
      completeTask: (day, taskId) => {
        const cur = get().doneByDay[day] ?? [];
        if (cur.includes(taskId)) return false;
        set((s) => ({ doneByDay: { ...s.doneByDay, [day]: [...cur, taskId] } }));
        return true;
      },
      completeLesson: (id) => set((s) => ({ lessonsDone: { ...s.lessonsDone, [id]: new Date().toISOString() } })),
      completeRoleplay: (id) => set((s) => ({ roleplayDone: { ...s.roleplayDone, [id]: (s.roleplayDone[id] ?? 0) + 1 } })),
      addUserSet: (title, items) =>
        set((s) => ({
          userSets: [{ id: `u-${Date.now().toString(36)}`, title, items, createdAt: new Date().toISOString() }, ...s.userSets],
        })),
      removeUserSet: (id) => set((s) => ({ userSets: s.userSets.filter((u) => u.id !== id) })),
      toggleSaved: (id) => set((s) => ({ saved: s.saved.includes(id) ? s.saved.filter((x) => x !== id) : [...s.saved, id] })),
    }),
    {
      name: `${STORAGE_PREFIX}hub`,
      storage: storage<HubState>(),
      version: 1,
      partialize: (s) =>
        ({
          phonemeBest: s.phonemeBest,
          phonemeTries: s.phonemeTries,
          doneByDay: s.doneByDay,
          lessonsDone: s.lessonsDone,
          roleplayDone: s.roleplayDone,
          ieltsDone: s.ieltsDone,
          phraseBest: s.phraseBest,
          topicsDone: s.topicsDone,
          userSets: s.userSets,
          saved: s.saved,
          slides: s.slides,
        }) as HubState,
    },
  ),
);
