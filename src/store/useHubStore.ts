import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { STORAGE_PREFIX, storage } from './persist';

/**
 * Tiến độ và State toàn cục của khu vực BAND 9 (tab Hôm nay / Học / Gia sư / Khám phá / Tiến độ).
 */

export type ProgramMode = 'academic' | 'speaking' | 'sat';

export type UserSet = { id: string; title: string; items: string[]; createdAt: string };

export type CreatorScenario = {
  id: string;
  characterName: string;
  characterPersonality: string;
  learnerRole: string;
  situation: string;
  goals: string[];
  isCoop?: boolean;
  createdAt: string;
};

export type MentorRequest = {
  id: string;
  symbol: string;
  requestedAt: string;
  status: 'pending' | 'reviewed';
  feedback?: string;
};

type HubState = {
  /** Chương trình đang chọn ở Top Dropdown: Band 9 IELTS Academic, Band 9 Real-Life Speaking, Band 9 Digital SAT. */
  selectedProgram: ProgramMode;
  setProgram: (p: ProgramMode) => void;

  /** Cụm chỉ số Gamification toàn cục. */
  gems: number;
  addGems: (n: number) => void;
  trophyScore: number;
  addTrophy: (n: number) => void;
  streakCount: number;

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
  /** Danh sách từ vựng đã lưu trong từ điển. */
  wordBookmarks: string[];
  toggleWordBookmark: (word: string) => void;
  /** Kịch bản do người dùng tự tạo trong Creator Mode. */
  creatorScenarios: CreatorScenario[];
  addCreatorScenario: (scenario: Omit<CreatorScenario, 'id' | 'createdAt'>) => void;
  /** Danh sách yêu cầu nhờ Mentor Band 8.5+ sửa âm đỏ. */
  mentorRequests: Record<string, MentorRequest>;
  requestMentor: (symbol: string) => void;
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
      selectedProgram: 'speaking',
      setProgram: (selectedProgram) => set({ selectedProgram }),
      gems: 0,
      addGems: (n) => set((s) => ({ gems: s.gems + n })),
      trophyScore: 0,
      addTrophy: (n) => set((s) => ({ trophyScore: s.trophyScore + n })),
      streakCount: 0,

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
      wordBookmarks: [],
      toggleWordBookmark: (word) =>
        set((s) => ({
          wordBookmarks: s.wordBookmarks.includes(word)
            ? s.wordBookmarks.filter((w) => w !== word)
            : [...s.wordBookmarks, word],
        })),
      creatorScenarios: [],
      addCreatorScenario: (scenario) =>
        set((s) => ({
          creatorScenarios: [
            {
              id: `cs-${Date.now().toString(36)}`,
              ...scenario,
              createdAt: new Date().toISOString(),
            },
            ...s.creatorScenarios,
          ],
        })),
      mentorRequests: {},
      requestMentor: (symbol) =>
        set((s) => ({
          mentorRequests: {
            ...s.mentorRequests,
            [symbol]: {
              id: `req-${Date.now()}`,
              symbol,
              requestedAt: new Date().toISOString(),
              status: 'pending',
              feedback: 'Mentor Band 8.5+ đang nghe lại bản thu âm của bạn. Nhận xét chi tiết sẽ gửi về trong 2h.',
            },
          },
        })),
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
      version: 3,
      // Bản cũ đặt sẵn số mẫu (10 đá quý, cúp 10250, chuỗi 10, âm đỏ mẫu, bộ và từ mẫu). Chỉ xoá
      // đúng những giá trị còn nguyên như mẫu; số người dùng tự kiếm được thì giữ nguyên.
      migrate: (persisted, version) => {
        const s = { ...((persisted ?? {}) as Partial<HubState>) };
        if (version < 3) {
          if (s.gems === 10) s.gems = 0;
          if (s.trophyScore === 10250) s.trophyScore = 0;
          if (s.streakCount === 10) s.streakCount = 0;
          if (s.phonemeBest?.p === 88 && s.phonemeBest?.s === 45) s.phonemeBest = {};
          if (s.phonemeTries?.s === 5 && s.phonemeTries?.p === 6) s.phonemeTries = {};
          if (Array.isArray(s.saved) && s.saved.join(',') === 'set-1,set-3') s.saved = [];
          if (Array.isArray(s.wordBookmarks) && s.wordBookmarks.join(',') === 'serendipity,eloquent') s.wordBookmarks = [];
        }
        return s as HubState;
      },
      partialize: (s) =>
        ({
          selectedProgram: s.selectedProgram,
          gems: s.gems,
          trophyScore: s.trophyScore,
          streakCount: s.streakCount,
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
          wordBookmarks: s.wordBookmarks,
          creatorScenarios: s.creatorScenarios,
          mentorRequests: s.mentorRequests,
          slides: s.slides,
        }) as HubState,
    },
  ),
);
