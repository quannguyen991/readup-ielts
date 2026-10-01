/**
 * DANH MỤC NỘI DUNG GIAO ĐƯỢC — chỉ nội dung có thật trong app.
 *
 * Giao diện dùng để dựng bộ chọn bài; máy chủ dùng để từ chối mã bài bịa ra và
 * đặt tiêu đề mặc định. Danh sách từ của bộ từ cũng lấy ở đây (để tính "xong").
 */
import { FREE_STAGE_COUNT } from '@/lib/billing/entitlements';
import { ROAD_CHAPTERS } from '@/data/sat-roadmap';
import { getStaticDeck } from '@/data/study-decks';
import { SAT_VOCAB_LESSONS } from '@/data/lessons/vocab-lessons';
import { VOCAB_TOPICS } from '@/data/vocab-topics';
import { MATH_CURRICULUM } from '@/services/math/curriculum';

import { SPEAKING_MODES, type AssignmentKind } from './assignments';

export type Bi = { vi: string; en: string };

export type CatalogItem = {
  kind: AssignmentKind;
  ref: string;
  title: Bi;
  /** Nhóm để xếp trong bộ chọn (chủ đề, chặng, giai đoạn…). */
  group: Bi;
  /** Ghi chú cho giáo viên (vd. bộ cần gói trả phí). */
  note?: Bi;
};

export const KIND_LABEL: Record<AssignmentKind, Bi> = {
  vocab_deck: { vi: 'Bộ từ vựng', en: 'Vocabulary deck' },
  sat_chapter: { vi: 'Chương Lộ trình SAT Math', en: 'SAT Math roadmap chapter' },
  math_set: { vi: 'Bộ đề SAT Math', en: 'SAT Math practice set' },
  speaking: { vi: 'Lượt luyện nói', en: 'Speaking session' },
};

/** Thế nào là "xong" — hiện ngay dưới bộ chọn để giáo viên biết app đo gì. */
export const KIND_DONE_RULE: Record<AssignmentKind, Bi> = {
  vocab_deck: { vi: 'Xong khi em nhớ được ít nhất 80% số từ của bộ.', en: 'Done when the student has learned at least 80% of the words.' },
  sat_chapter: { vi: 'Xong khi em đạt từ 80% ở một mức bất kỳ của chương.', en: 'Done when the student scores 80%+ on any level of the chapter.' },
  math_set: { vi: 'Xong khi em làm hết một lượt bộ đề.', en: 'Done when the student finishes one round of the set.' },
  speaking: { vi: 'Xong khi em làm một lượt phần thi này sau lúc bạn giao.', en: 'Done when the student completes this part after you assign it.' },
};

const SPEAKING_TITLE: Record<(typeof SPEAKING_MODES)[number], Bi> = {
  full: { vi: 'Speaking — thi thử đủ 3 phần', en: 'Speaking — full test (3 parts)' },
  p1: { vi: 'Speaking — Part 1', en: 'Speaking — Part 1' },
  p2: { vi: 'Speaking — Part 2 (thẻ đề)', en: 'Speaking — Part 2 (cue card)' },
  p3: { vi: 'Speaking — Part 3', en: 'Speaking — Part 3' },
};

let cache: Record<AssignmentKind, CatalogItem[]> | null = null;

function build(): Record<AssignmentKind, CatalogItem[]> {
  const vocab: CatalogItem[] = [
    ...VOCAB_TOPICS.map((t) => ({
      kind: 'vocab_deck' as const,
      ref: t.slug,
      title: { vi: t.nameVi || t.name, en: t.name },
      group: { vi: 'Chủ đề IELTS', en: 'IELTS topics' },
    })),
    ...SAT_VOCAB_LESSONS.map((l) => ({
      kind: 'vocab_deck' as const,
      ref: l.slug,
      title: { vi: l.title, en: l.title },
      group: l.subject === 'math' ? { vi: 'Từ vựng SAT Math', en: 'SAT Math vocabulary' } : { vi: 'Từ vựng SAT Verbal', en: 'SAT Verbal vocabulary' },
    })),
  ];

  const chapters: CatalogItem[] = ROAD_CHAPTERS.map((c) => ({
    kind: 'sat_chapter' as const,
    ref: c.id,
    title: { vi: `Chương ${c.n} · ${c.title.vi}`, en: `Chapter ${c.n} · ${c.title.en}` },
    group: { vi: `Giai đoạn ${c.phase}`, en: `Phase ${c.phase}` },
  }));

  const sets: CatalogItem[] = MATH_CURRICULUM.flatMap((stage, stageIndex) =>
    stage.units.flatMap((unit) =>
      unit.sets.map((s) => ({
        kind: 'math_set' as const,
        ref: s.id,
        title: { vi: `${unit.title} · ${s.title}`, en: `${unit.englishName} · ${s.title}` },
        group: { vi: stage.title, en: stage.title },
        note:
          stageIndex >= FREE_STAGE_COUNT
            ? { vi: 'Học sinh gói Free chưa mở được chặng này.', en: 'Students on the Free plan cannot open this stage yet.' }
            : undefined,
      })),
    ),
  );

  const speaking: CatalogItem[] = SPEAKING_MODES.map((m) => ({
    kind: 'speaking' as const,
    ref: m,
    title: SPEAKING_TITLE[m],
    group: { vi: 'Phòng luyện nói', en: 'Speaking room' },
  }));

  return { vocab_deck: vocab, sat_chapter: chapters, math_set: sets, speaking };
}

export function catalogOf(kind: AssignmentKind): readonly CatalogItem[] {
  cache ??= build();
  return cache[kind];
}

export function findCatalogItem(kind: AssignmentKind, ref: string): CatalogItem | undefined {
  return catalogOf(kind).find((i) => i.ref === ref);
}

/** Danh sách từ của một bộ (để tính "xong" của bài giao bộ từ). */
export function deckWords(slug: string): readonly string[] | undefined {
  return getStaticDeck(slug)?.words.map((w) => w.word);
}

/** Bỏ dấu tiếng Việt và viết thường — để tìm "moi truong" ra "Môi trường". */
export function foldText(s: string): string {
  return s
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
}

export function searchCatalog(kind: AssignmentKind, query: string): readonly CatalogItem[] {
  const q = foldText(query.trim());
  const all = catalogOf(kind);
  if (!q) return all;
  return all.filter((i) => foldText(`${i.title.vi} ${i.title.en} ${i.group.vi} ${i.group.en}`).includes(q));
}
