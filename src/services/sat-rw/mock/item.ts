import type { EvidenceItem } from '@/services/sat-rw/evidence/types';
import type { SynthesisItem } from '@/services/sat-rw/synthesis/generate';
import type { VocabItem } from '@/services/sat-rw/vocab/generate';
import type { SatRwQuestion } from '@/data/sat-rw-repository';

/**
 * Một câu R&W đã quy về hình dạng chung, sẵn sàng xếp vào đề thi thử.
 *
 * VÌ SAO CẦN LỚP NÀY. Bốn nguồn câu cho ra bốn hình dạng khác nhau: kho soạn tay
 * chỉ có đoạn văn; Command of Evidence có thêm BẢNG SỐ; Rhetorical Synthesis có
 * thêm DANH SÁCH GHI CHÚ; Từ trong ngữ cảnh có chỗ trống trong đoạn. Không quy
 * về một hình dạng thì màn làm bài phải biết bốn kiểu, và mỗi lần thêm nguồn là
 * một lần sửa màn hình.
 *
 * TRƯỜNG PHỤ ĐỂ `undefined` CHỨ KHÔNG ĐỂ RỖNG. `table: undefined` nói "câu này
 * không có bảng"; `table: { rows: [] }` nói "có bảng nhưng bảng trống" — và màn
 * hình sẽ vẽ ra một cái khung rỗng. Hai chuyện khác nhau.
 */

export type MockDomain =
  | 'Information and Ideas'
  | 'Craft and Structure'
  | 'Expression of Ideas'
  | 'Standard English Conventions';

export type MockItem = {
  id: string;
  domain: MockDomain;
  /** Nhãn dạng câu, để màn xem lại gọi đúng tên chỗ sai. */
  skill: string;
  /** Đoạn văn. Với câu điền từ, chỗ trống nằm sẵn trong đây. */
  passage: string;
  /** Chuỗi con của `passage` phải gạch chân — chỉ câu hỏi về "the underlined …" mới có. */
  underline?: string;
  stem: string;
  options: string[];
  answerIndex: number;
  solutionVi: string;
  /** Chỉ câu Command of Evidence mới có. */
  table?: EvidenceItem['table'];
  /** Chỉ câu Rhetorical Synthesis mới có. */
  notes?: readonly string[];
};

/* --------------------------------------------------------------- bộ chuyển */

export function fromRepository(q: SatRwQuestion): MockItem {
  return {
    id: `repo:${q.id}`,
    domain: q.domain as MockDomain,
    skill: q.skill,
    passage: q.passage,
    underline: q.underline,
    stem: q.stem,
    options: q.options,
    answerIndex: q.answerIndex,
    solutionVi: q.solutionVi,
  };
}

export function fromEvidence(item: EvidenceItem): MockItem {
  return {
    id: `evidence:${item.id}`,
    domain: 'Information and Ideas',
    skill: 'command_of_evidence_quantitative',
    passage: item.passage,
    stem: item.stem,
    options: item.options.map((o) => o.text),
    answerIndex: item.answerIndex,
    solutionVi: item.solutionVi,
    table: item.table,
  };
}

export function fromVocab(item: VocabItem): MockItem {
  return {
    id: `vocab:${item.id}`,
    domain: 'Craft and Structure',
    skill: 'words_in_context',
    passage: item.passage,
    stem: item.stem,
    options: item.options,
    answerIndex: item.answerIndex,
    solutionVi: item.solutionVi,
  };
}

export function fromSynthesis(item: SynthesisItem): MockItem {
  return {
    id: `synthesis:${item.id}`,
    domain: 'Expression of Ideas',
    skill: 'rhetorical_synthesis',
    passage: item.intro,
    stem: item.stem,
    options: item.options,
    answerIndex: item.answerIndex,
    solutionVi: item.solutionVi,
    notes: item.notes,
  };
}
