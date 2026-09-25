/**
 * BẢN ĐỒ READUP — sáu hòn đảo quanh một trạm xuất phát, mỗi đảo là một mảng học.
 *
 * NHIỆM VỤ LÀ BÀI HỌC THẬT, TIẾN ĐỘ LÀ TIẾN ĐỘ THẬT: không có điểm game tách rời.
 * Học xong một bài lý thuyết, làm một bài chép chính tả, hạ một loài quái trong
 * game khi học… thì đúng nhiệm vụ đó được đánh dấu, và sợi sáng nối đảo với trạm
 * dài thêm.
 * (Ý tưởng từ FreeCareerPath: "cùng bài học, cùng tiến độ với danh sách".)
 *
 * Hàm thuần: nhận dữ liệu tiến độ đã đọc từ các kho, trả về đảo + nhiệm vụ.
 */
import { MATH_LESSONS } from '@/data/lessons/math-lessons';
import { VERBAL_LESSONS } from '@/data/lessons/verbal-lessons';
import { SAT_VOCAB_LESSONS } from '@/data/lessons/vocab-lessons';
import { DICTATION_SETS } from '@/data/dictation-sets';
import { TRANSLATION_SETS } from '@/data/translation-sets';
import { ENEMIES, isBoss } from '@/services/game/rules';

export type IslandId = 'math' | 'verbal' | 'vocab' | 'listen' | 'translate' | 'arena';

export type Mission = {
  id: string;
  title: string;
  href: string;
  done: boolean;
  /** Một câu nói bài này luyện gì — hiện trên thẻ ở màn chọn bài. */
  blurb?: string;
  /** Nhãn độ khó hiển thị ("Nền tảng", "B1", "Khó"…). */
  level?: string;
  /** Bậc khó 0–3 để tô màu, không phải để xếp hạng. */
  tier?: number;
  /** Dòng phụ ngắn: "12 phút", "12 câu", "8 từ". */
  meta?: string;
};

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
  /** useGameStore.enemyIndex — số quái đã hạ trong game khi học (tính cả các vòng). */
  enemiesDefeated: number;
};

/**
 * Đấu trường: bảy loài quái của game khi học, theo đúng thứ tự chúng xuất hiện.
 * Quái nào cũng đánh được ở MỌI màn học; đường dẫn chỉ gợi một chỗ hợp với loài
 * đó (Bọ Lỗi Chính Tả → chép chính tả, Người Đá Phương Trình → phương trình…).
 */
const ARENA_HREF: Record<string, string> = {
  'typo-bug': '/sentence/dictation',
  'comma-slime': '/sat-rw/skill/boundaries',
  'tense-ghost': '/sat-rw/skill/tense',
  'math-golem': '/math/drill/linear_equations_one_var',
  'idiom-bat': '/sentence/translate',
  'false-friend': '/sat-rw/skill/words',
  'blank-dragon': '/weekly',
};

/** Bộ từ tính là xong khi đã nhớ chắc từ 70% số từ trở lên. */
export const VOCAB_DONE_SHARE = 0.7;

const LESSON_TIER: Record<string, number> = { 'Nền tảng': 0, 'Trung bình': 1, 'Nâng cao': 3 };
const CEFR_TIER: Record<string, number> = { A2: 0, B1: 1, B2: 2, C1: 3 };
const SENTENCE_TIER: Record<string, number> = { easy: 0, medium: 1, hard: 3 };
const SENTENCE_LEVEL: Record<string, string> = { easy: 'Dễ', medium: 'Trung bình', hard: 'Khó' };

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
      MATH_LESSONS.map((l) => ({ id: `math:${l.skill}`, title: l.title, href: `/math/learn/${l.skill}`, done: !!p.lessonDone[`math:${l.skill}`], blurb: l.goal, level: l.level, tier: LESSON_TIER[l.level] ?? 1, meta: `${l.minutes} phút` })),
    ),
    island(
      'verbal',
      'Đảo SAT Verbal',
      'Đọc hiểu, ngữ pháp và cách viết câu',
      '#F43F5E',
      VERBAL_LESSONS.map((l) => ({ id: `verbal:${l.skill}`, title: l.title, href: `/sat-rw/learn/${l.skill}`, done: !!p.lessonDone[`verbal:${l.skill}`], blurb: l.goal, level: l.level, tier: LESSON_TIER[l.level] ?? 1, meta: `${l.minutes} phút` })),
    ),
    island(
      'vocab',
      'Đảo Từ vựng',
      'Bộ từ SAT, nhớ chắc 70% là qua',
      '#10B981',
      SAT_VOCAB_LESSONS.map((l) => {
        const st = p.stages[l.slug] ?? {};
        const mastered = l.words.filter((w) => (st[w.word] ?? 0) >= 2).length;
        return { id: `vocab:${l.slug}`, title: l.title, href: `/vocabulary/topic/${l.slug}/learn`, done: l.words.length > 0 && mastered / l.words.length >= VOCAB_DONE_SHARE, blurb: l.blurb, level: l.subject === 'math' ? 'SAT Math' : 'SAT Verbal', tier: l.subject === 'math' ? 1 : 2, meta: `${mastered}/${l.words.length} từ đã nhớ` };
      }),
    ),
    island(
      'listen',
      'Đảo Nghe & chép',
      '50 bài chép chính tả theo chủ đề',
      '#0EA5E9',
      DICTATION_SETS.map((s) => ({ id: `listen:${s.id}`, title: s.title, href: `/sentence/dictation?set=${s.id}`, done: p.dictationSets.has(s.id), blurb: s.blurb, level: s.level, tier: CEFR_TIER[s.level] ?? 1, meta: `${s.sentences.length} câu` })),
    ),
    island(
      'translate',
      'Đảo Dịch câu',
      '50 bài dịch Việt → Anh',
      '#F59E0B',
      TRANSLATION_SETS.map((s) => ({ id: `translate:${s.id}`, title: s.title, href: `/sentence/translate?set=${s.id}`, done: p.translationSets.has(s.id), blurb: s.blurb, level: SENTENCE_LEVEL[s.level], tier: SENTENCE_TIER[s.level] ?? 1, meta: `${s.items.length} câu` })),
    ),
    island(
      'arena',
      'Đấu trường',
      'Hạ đủ bảy loài quái của game khi học',
      '#A855F7',
      ENEMIES.map((e, i) => ({
        id: `arena:${e.id}`,
        title: `Hạ ${isBoss(i) ? 'Boss ' : ''}${e.name}`,
        href: ARENA_HREF[e.id] ?? '/vocabulary/quiz',
        done: p.enemiesDefeated > i,
      })),
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
