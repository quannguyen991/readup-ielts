/** Tiến độ lộ trình (thuần, test được trên Node). */
export type LevelBest = { correct: number; total: number; rounds: number; at: string };
/** Ba mức của quiz, `book` là bộ bài bám sách, `extra` là bộ Luyện thêm 20 câu. */
export type PracticeKey = 'easy' | 'medium' | 'hard' | 'book' | 'extra';
export type RoadmapProgress = Record<string, Partial<Record<PracticeKey, LevelBest>>>;

/** Gộp hai máy: mỗi (chương, mức) lấy điểm tỉ lệ cao hơn, số lượt lớn hơn. */
export function mergeRoadmapProgress(a: RoadmapProgress | undefined, b: RoadmapProgress | undefined): RoadmapProgress {
  const out: RoadmapProgress = { ...(a ?? {}) };
  for (const [ch, levels] of Object.entries(b ?? {})) {
    const merged = { ...(out[ch] ?? {}) };
    for (const [lv, v] of Object.entries(levels ?? {}) as [PracticeKey, LevelBest][]) {
      const cur = merged[lv];
      if (!cur) merged[lv] = v;
      else {
        const best = v.correct / v.total > cur.correct / cur.total ? v : cur;
        merged[lv] = { ...best, rounds: Math.max(cur.rounds, v.rounds) };
      }
    }
    out[ch] = merged;
  }
  return out;
}
