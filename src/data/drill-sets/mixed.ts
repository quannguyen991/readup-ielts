import { IELTS_QUESTION_TYPES } from '@/data/ielts-question-types';

import { getExplain } from './explain';
import { getDrillSets, optionsOf, type DrillSet, type DrillSetQuestion } from './index';

/**
 * Bài tổng hợp 40 câu: 4 phần × 10 câu, mỗi phần lấy từ một dạng khác nhau (bài đọc hoặc bài nghe riêng của phần đó).
 * Dùng để có band chắc hơn một set 20 câu và để thấy độ chính xác của từng dạng trong CÙNG một bài.
 * Dạng Map labelling bị loại vì cần hình bản đồ riêng của set.
 */

export type MixedSkill = 'reading' | 'listening';

export const MIXED_PARTS = 4;
export const MIXED_PER_PART = 10;

/** Bộ sinh số giả ngẫu nhiên có hạt giống, để một bài tổng hợp dựng lại giống hệt khi biết seed. */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(arr: readonly T[], r: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

/** Các dạng có bộ đề, đủ dùng cho bài tổng hợp của kỹ năng này. */
export function mixableTypes(skill: MixedSkill): string[] {
  return IELTS_QUESTION_TYPES
    .filter((t) => t.skill === skill && t.id !== 'listening-map-labelling')
    .filter((t) => getDrillSets(t.id).some((s) => s.questions.length >= MIXED_PER_PART && !s.maps?.length))
    .map((t) => t.id);
}

export function buildMixedTest(skill: MixedSkill, seed: number): DrillSet | null {
  const types = mixableTypes(skill);
  if (types.length < MIXED_PARTS) return null;
  const r = rng(seed);
  const picked = shuffle(types, r).slice(0, MIXED_PARTS);
  const questions: DrillSetQuestion[] = [];

  picked.forEach((typeId, p) => {
    const sets = getDrillSets(typeId).filter((s) => s.questions.length >= MIXED_PER_PART);
    const set = sets[Math.floor(r() * sets.length)]!;
    const from = r() < 0.5 ? 0 : set.questions.length - MIXED_PER_PART;
    const meta = IELTS_QUESTION_TYPES.find((t) => t.id === typeId);
    const part = `Part ${p + 1} · ${meta?.titleEn ?? typeId}`;
    set.questions.slice(from, from + MIXED_PER_PART).forEach((q, off) => {
      questions.push({
        ...q,
        ex: getExplain(typeId, set.id, from + off),
        typeId,
        part,
        // Phương án của set (nối đối tượng, nối tiêu đề…) và phương án cố định của dạng phải đi theo từng câu.
        options: optionsOf(typeId, set, q),
        ...(skill === 'reading' ? { passage: q.context ? undefined : set.context } : { script: set.context }),
      });
    });
  });

  return {
    id: `mixed-${skill}-${seed}`,
    title: skill === 'reading' ? 'Reading · bài tổng hợp 40 câu' : 'Listening · bài tổng hợp 40 câu',
    topic: picked.map((t) => IELTS_QUESTION_TYPES.find((x) => x.id === t)?.titleEn ?? t).join(' · '),
    questions,
  };
}
