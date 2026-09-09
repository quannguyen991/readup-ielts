import { hashString, mulberry32 } from '@/services/questions/rng';

import { SUBJECTS, subjectBySlug, type SynthesisSubject, type SynthesisTag } from './subjects';

/**
 * Dựng câu Rhetorical Synthesis: một tập ghi chú, một mục đích, bốn phương án.
 *
 * ĐÁP ÁN LÀ KẾT QUẢ MỘT PHÉP SO NHÃN, không phải một lời khai. Mỗi ghi chú mang
 * nhãn mục đích nó phục vụ; mục đích của đề cũng là một nhãn; phương án đúng là
 * ghi chú mang nhãn ấy. Không có bước nào ai đó đánh dấu đáp án.
 *
 * MỌI PHƯƠNG ÁN SAI VẪN LÀ MỘT SỰ THẬT — chúng lấy nguyên văn từ ghi chú in ngay
 * trên đề. Đó là cái bẫy chính của dạng này và nó tự nhiên có sẵn: người học
 * kiểm tính đúng, thấy đúng, rồi dừng — quên mất câu hỏi là "phương án nào PHỤC
 * VỤ MỤC ĐÍCH". Cùng cơ chế `accurate_but_irrelevant` của bộ Command of Evidence.
 */

export type SynthesisWhy =
  /** Đúng, có trong ghi chú, nhưng không phục vụ mục đích đang hỏi. */
  | 'accurate_but_irrelevant'
  /** Không có trong ghi chú. */
  | 'not_in_notes';

export type SynthesisItem = {
  /** `${slug}:${tag}` — mở lại đúng id là ra đúng câu ấy. */
  id: string;
  subjectSlug: string;
  goalTag: SynthesisTag;
  /** Dòng dẫn + danh sách ghi chú, in nguyên trên đề. */
  notes: readonly string[];
  intro: string;
  stem: string;
  options: string[];
  optionWhy: (SynthesisWhy | null)[];
  answerIndex: number;
  solutionVi: string;
};

export const SYNTHESIS_INTRO =
  'While researching a topic, a student has taken the following notes.';

export function buildSynthesisItem(slug: string, goalTag: SynthesisTag): SynthesisItem | null {
  const subject = subjectBySlug(slug);
  if (!subject) return null;

  const goal = subject.goals.find((g) => g.tag === goalTag);
  if (!goal) return null;

  const matching = subject.facts.filter((f) => f.tags.includes(goalTag));
  const nonMatching = subject.facts.filter((f) => !f.tags.includes(goalTag));

  /*
    ĐÚNG MỘT GHI CHÚ KHỚP NHÃN. Hai ghi chú cùng khớp thì câu có hai đáp án đúng —
    và một câu trắc nghiệm hai đáp án đúng thì người học làm đúng vẫn bị chấm sai,
    mà họ sẽ nghĩ mình hiểu sai. Thà không dựng câu ấy.
  */
  if (matching.length !== 1) return null;
  if (nonMatching.length < 2) return null;

  const rng = mulberry32(hashString(`synthesis:${slug}:${goalTag}`));

  /*
    NHIỄU PHẢI XOAY THEO MỤC ĐÍCH, không phải luôn lấy hai ghi chú đầu.

    Một chủ đề có sáu mục đích, tức sáu câu dùng chung một tập ghi chú. Lấy cố
    định `nonMatching[0]` và `[1]` thì làm hết sáu câu sẽ gặp lại đúng hai phương
    án ấy sáu lần — người học nhớ mặt chúng và loại bằng trí nhớ chứ không bằng
    mục đích. Trộn theo hạt giống của từng mục đích thì vẫn tất định mà không lặp.
  */
  const pool = [...nonMatching];
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [pool[i], pool[j]] = [pool[j]!, pool[i]!];
  }

  const fabricated = subject.fabricated[Math.floor(rng() * subject.fabricated.length)]!;

  const entries: { text: string; why: SynthesisWhy | null }[] = [
    { text: matching[0]!.text, why: null },
    { text: pool[0]!.text, why: 'accurate_but_irrelevant' },
    { text: pool[1]!.text, why: 'accurate_but_irrelevant' },
    { text: fabricated, why: 'not_in_notes' },
  ];

  // Trộn tất định: cùng chủ đề + cùng mục đích ra cùng thứ tự phương án.
  for (let i = entries.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [entries[i], entries[j]] = [entries[j]!, entries[i]!];
  }

  const answerIndex = entries.findIndex((e) => e.why === null);

  return {
    id: `${slug}:${goalTag}`,
    subjectSlug: slug,
    goalTag,
    intro: `${SYNTHESIS_INTRO} The notes concern ${subject.topic}.`,
    notes: subject.facts.map((f) => f.text),
    stem: `The student wants to ${goal.text}. Which choice most effectively uses relevant information from the notes to accomplish this goal?`,
    options: entries.map((e) => e.text),
    optionWhy: entries.map((e) => e.why),
    answerIndex,
    solutionVi:
      `Mục đích là "${goal.text}". Chỉ một ghi chú phục vụ đúng mục đích ấy. ` +
      'Hai phương án sai còn lại ĐỀU ĐÚNG và đều nằm trong ghi chú — chúng chỉ nói về ' +
      'chuyện khác, và đó là chỗ dễ mắc nhất: kiểm thấy đúng rồi dừng, quên mất câu hỏi ' +
      'là phương án nào PHỤC VỤ MỤC ĐÍCH. Phương án còn lại nêu một điều không có trong ghi chú.',
  };
}

/** Mọi câu dựng được từ bảng chủ đề hiện có. */
export function allSynthesisItems(): SynthesisItem[] {
  const out: SynthesisItem[] = [];
  for (const subject of SUBJECTS) {
    for (const goal of subject.goals) {
      const item = buildSynthesisItem(subject.slug, goal.tag);
      if (item) out.push(item);
    }
  }
  return out;
}

export function subjectsWithUnusableGoals(): { slug: string; tag: SynthesisTag; matched: number }[] {
  /*
    Báo ra những mục đích KHÔNG dựng được câu, thay vì bỏ qua im lặng. Một mục
    đích khớp hai ghi chú là lỗi của bảng dữ liệu, và người soạn phải thấy nó —
    nếu không bảng cứ lớn dần mà số câu không tăng, không ai hiểu vì sao.
  */
  const out: { slug: string; tag: SynthesisTag; matched: number }[] = [];
  for (const s of SUBJECTS as SynthesisSubject[]) {
    for (const g of s.goals) {
      const n = s.facts.filter((f) => f.tags.includes(g.tag)).length;
      if (n !== 1) out.push({ slug: s.slug, tag: g.tag, matched: n });
    }
  }
  return out;
}
