/**
 * BẢN ĐỒ READUP — sáu hòn đảo quanh một trạm xuất phát, mỗi đảo là một mảng học.
 *
 * NHIỆM VỤ LÀ BÀI HỌC THẬT, TIẾN ĐỘ LÀ TIẾN ĐỘ THẬT: không có điểm game tách rời.
 * Học xong một bài lý thuyết, làm một bài chép chính tả, thắng một trận Quest…
 * thì đúng nhiệm vụ đó được đánh dấu, và sợi sáng nối đảo với trạm dài thêm.
 * (Ý tưởng từ FreeCareerPath: "cùng bài học, cùng tiến độ với danh sách".)
 *
 * Hàm thuần: nhận dữ liệu tiến độ đã đọc từ các kho, trả về đảo + nhiệm vụ.
 */
import { MATH_LESSONS } from '@/data/lessons/math-lessons';
import { VERBAL_LESSONS } from '@/data/lessons/verbal-lessons';
import { SAT_VOCAB_LESSONS } from '@/data/lessons/vocab-lessons';
import { DICTATION_SETS } from '@/data/dictation-sets';
import { TRANSLATION_SETS } from '@/data/translation-sets';
import { QUEST_MAPS } from '@/services/quest/maps';

export type IslandId = 'math' | 'verbal' | 'vocab' | 'listen' | 'translate' | 'arena';

export type Mission = { id: string; title: string; href: string; done: boolean };

export type Island = {
  id: IslandId;
  name: string;
  /** Một câu nói đảo này luyện gì. */
  tagline: string;
  color: string;
  missions: Mission[];
  done: number;
  /** 0–1. */
  progress: number;
};

export type WorldProgress = {
  /** useLessonStore.done — khoá "math:skill", "verbal:skill". */
  lessonDone: Record<string, string>;
  /** useTopicStudyStore.stages — slug → từ → 0/1/2. */
  stages: Record<string, Record<string, number>>;
  /** Các bài chép chính tả / dịch câu đã làm ít nhất một lượt. */
  dictationSets: ReadonlySet<string>;
  translationSets: ReadonlySet<string>;
  /** useQuestStore.stars — node → số sao. */
  questStars: Record<string, number>;
};

/** Bộ từ tính là xong khi đã nhớ chắc từ 70% số từ trở lên. */
export const VOCAB_DONE_SHARE = 0.7;

function island(id: IslandId, name: string, tagline: string, color: string, missions: Mission[]): Island {
  const done = missions.filter((m) => m.done).length;
  return { id, name, tagline, color, missions, done, progress: missions.length ? done / missions.length : 0 };
}

export function buildIslands(p: WorldProgress): Island[] {
  return [
    island(
      'math',
      'Đảo SAT Math',
      'Bài lý thuyết Toán, mỗi bài một dạng đề',
      '#6366F1',
      MATH_LESSONS.map((l) => ({ id: `math:${l.skill}`, title: l.title, href: `/math/learn/${l.skill}`, done: !!p.lessonDone[`math:${l.skill}`] })),
    ),
    island(
      'verbal',
      'Đảo SAT Verbal',
      'Đọc hiểu, ngữ pháp và cách viết câu',
      '#F43F5E',
      VERBAL_LESSONS.map((l) => ({ id: `verbal:${l.skill}`, title: l.title, href: `/sat-rw/learn/${l.skill}`, done: !!p.lessonDone[`verbal:${l.skill}`] })),
    ),
    island(
      'vocab',
      'Đảo Từ vựng',
      'Bộ từ SAT, nhớ chắc 70% là qua',
      '#10B981',
      SAT_VOCAB_LESSONS.map((l) => {
        const st = p.stages[l.slug] ?? {};
        const mastered = l.words.filter((w) => (st[w.word] ?? 0) >= 2).length;
        return { id: `vocab:${l.slug}`, title: l.title, href: `/vocabulary/topic/${l.slug}/learn`, done: l.words.length > 0 && mastered / l.words.length >= VOCAB_DONE_SHARE };
      }),
    ),
    island(
      'listen',
      'Đảo Nghe & chép',
      '50 bài chép chính tả theo chủ đề',
      '#0EA5E9',
      DICTATION_SETS.map((s) => ({ id: `listen:${s.id}`, title: s.title, href: `/sentence/dictation?set=${s.id}`, done: p.dictationSets.has(s.id) })),
    ),
    island(
      'translate',
      'Đảo Dịch câu',
      '50 bài dịch Việt → Anh',
      '#F59E0B',
      TRANSLATION_SETS.map((s) => ({ id: `translate:${s.id}`, title: s.title, href: `/sentence/translate?set=${s.id}`, done: p.translationSets.has(s.id) })),
    ),
    island(
      'arena',
      'Đấu trường',
      'Trận đánh boss bằng câu SAT',
      '#A855F7',
      QUEST_MAPS.flatMap((m) =>
        m.nodes.map((n) => ({ id: `arena:${n.id}`, title: `${m.title} · ${n.title}`, href: `/quest/map/${m.id}`, done: (p.questStars[n.id] ?? 0) > 0 })),
      ),
    ),
  ];
}

/**
 * Nhiệm vụ nên làm tiếp: ở đảo đang dở nhiều nhất (tiến độ thấp nhất), lấy bài
 * đầu tiên chưa xong. Đảo xong hết thì bỏ qua; xong cả bản đồ thì null.
 */
export function nextMission(islands: readonly Island[]): { island: Island; mission: Mission } | null {
  const open = islands.filter((i) => i.missions.some((m) => !m.done));
  if (open.length === 0) return null;
  const pick = [...open].sort((a, b) => a.progress - b.progress)[0]!;
  return { island: pick, mission: pick.missions.find((m) => !m.done)! };
}

/**
 * Vị trí các đảo quanh trạm (toạ độ 0–1 theo khung), dùng chung cho canvas vẽ
 * đảo và lớp chữ đặt nhãn — hai lớp phải khớp nhau từng điểm.
 */
export const ISLAND_ORDER: readonly IslandId[] = ['math', 'verbal', 'vocab', 'listen', 'translate', 'arena'];

export function islandPosition(index: number, aspect: number): { x: number; y: number } {
  // Khung dọc (điện thoại): trải đảo theo chiều cao nhiều hơn chiều ngang.
  const angle = (-150 + index * 60) * (Math.PI / 180);
  const rx = aspect >= 1 ? 0.36 : 0.34;
  const ry = aspect >= 1 ? 0.34 : 0.3;
  return { x: 0.5 + Math.cos(angle) * rx, y: 0.52 + Math.sin(angle) * ry };
}
