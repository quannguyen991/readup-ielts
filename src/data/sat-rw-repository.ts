import seed from './seed/sat-rw/index.json';
import generated2 from './seed/sat-rw/generated-2.json';
import hardConventions from './seed/sat-rw/hard-conventions.json';
import hardReading from './seed/sat-rw/hard-reading.json';
import { SAT_RW_ORIGINAL_READING_EXPANSION } from './seed/sat-rw/original-reading-expansion';
import type { MockItem } from '@/services/sat-rw/mock/item';
import { difficultyScore } from '@/services/sat-rw/mock/difficulty';
import { sortByDifficulty, type Difficulty } from '@/lib/difficulty';

/**
 * Kho câu hỏi SAT Reading & Writing.
 *
 * NGUỒN: dự án `sat-rw-luyen-tap`. Unit 1–10 sinh từ luật ngữ pháp (ghép mảnh,
 * nhiễu tạo bằng cách phá đúng một luật đã biết), unit 11–16 soạn tay vì không
 * có luật nào tính được "ý chính của đoạn này là gì". Toàn bộ 384 câu gốc đã qua
 * bộ kiểm của dự án ấy: bốn phương án phân biệt, đáp án hợp lệ, không trùng đề,
 * đáp án rải đều A/B/C/D.
 *
 * VÌ SAO ĐỨNG RIÊNG, KHÔNG NHẬP VÀO BỘ SINH ĐỀ SẴN CÓ: bộ sinh đề của app
 * (`sat-generator`) sinh câu TỪ BÀI ĐỌC có sẵn, nên nó chỉ làm được hai dạng
 * mà máy kiểm chứng được — Words in Context và Inferences. Ba mảng còn lại của
 * đề thật (Cross-Text Connections, Rhetorical Synthesis, Command of Evidence
 * dạng bảng) cần văn bản được VIẾT RA cho đúng dạng ấy, không cắt từ bài có sẵn
 * được. Kho này lấp đúng chỗ đó.
 */

export type SatRwUnit = {
  unit: number;
  title: string;
  domain: string;
  /** Hộp luật của unit, đã bỏ thẻ HTML. */
  ruleVi: string;
  count: number;
};

export type SatRwQuestion = {
  id: string;
  unit: number;
  unitTitle: string;
  domain: string;
  skill: string;
  /** Đoạn văn, có chỗ trống là dãy gạch dưới với các unit ngữ pháp. */
  passage: string;
  /**
   * Chuỗi con của `passage` được gạch chân khi hiện ra màn hình.
   *
   * Chỉ 17 câu có: những câu mà đề bài hỏi thẳng "the underlined sentence" /
   * "the underlined claim in Text 1". Dấu do `scripts/mark-underlines.ts` đặt
   * vào, và `passage.test.ts` canh cho không câu nào mất dấu hay thừa dấu.
   */
  underline?: string;
  /**
   * Bảng số và danh sách ghi chú — CHỈ câu sinh từ bộ sinh mới có.
   *
   * Kho soạn tay không có câu nào dùng tới hai trường này, nhưng bộ sinh
   * Command of Evidence và Rhetorical Synthesis thì có, và nếu kiểu dữ liệu
   * không chỗ chứa chúng thì `QuestionCard` in ra một câu hỏi "dùng số liệu
   * trong bảng" mà không có bảng nào.
   */
  table?: MockItem['table'];
  notes?: readonly string[];
  stem: string;
  options: string[];
  answerIndex: number;
  solutionVi: string;
  /**
   * Bậc dễ / vừa / khó — để màn làm bài gắn nhãn "Dễ / Vừa / Khó" và để bộ đề
   * xếp dễ → khó. Mọi câu trong `SAT_RW_QUESTIONS` đều có; câu do bộ sinh tạo
   * ra lúc chạy có thể thiếu, khi ấy đọc bằng `rwDifficulty()`.
   */
  difficulty?: Difficulty;
  /**
   * Vì sao từng phương án sai, cùng thứ tự với `options`; chuỗi rỗng ở đáp án.
   * Chỉ câu khó soạn tay (01/10/2026) có — màn xem lại có thể hiện cạnh từng
   * phương án thay vì chỉ đọc `solutionVi`.
   */
  whyWrong?: string[];
};

type Seed = { units: SatRwUnit[]; questions: SatRwQuestion[] };

const data = seed as Seed;

/** 384 câu gốc — đề thi thử đầy đủ chỉ rút từ đây để đề đã gieo hạt không đổi. */
export const SAT_RW_BASE_QUESTIONS: SatRwQuestion[] = data.questions;

/**
 * 240 câu sinh thêm (26/09/2026) cho unit 1–10 — Conventions và Transitions.
 *
 * Cùng bộ sinh bằng luật của `sat-rw-luyen-tap` (`export_app.py`), chạy trên một
 * kho mảnh câu thứ hai (`bank2.py`) viết mới: kho gốc đã dùng gần hết cho 240 câu
 * đầu, sinh lại chỉ ra câu trùng. Đáp án do luật tính; không trùng đoạn với kho
 * gốc; đáp án rải đều 6/6/6/6 mỗi unit. Từ nối có thêm bảng khoá đúng theo từng
 * cặp câu — bộ sinh gốc bốc ngẫu nhiên trong "họ" từ nối nên có câu khoá sai
 * (đã sửa 15 câu trong kho gốc cùng ngày).
 */
export const SAT_RW_EXTRA_QUESTIONS: SatRwQuestion[] = (generated2 as { questions: SatRwQuestion[] }).questions;

/**
 * Câu KHÓ soạn tay (01/10/2026), sau phản hồi "đề hơi dễ".
 *
 * Kho cũ không có câu nào đạt độ khó module 2 của đề thật: đoạn ngắn, nhiễu lộ
 * ra bằng từ khoá. Bộ này viết riêng cho bậc khó — đoạn học thuật dày hơn,
 * nhiễu "đúng nhưng lạc đề", "quá mạnh", "đảo quan hệ", bảng số phải ghép hai ô.
 * 15 câu mỗi unit 1–10, 10 câu mỗi unit 11–16. Mỗi câu có lý do sai cho từng
 * phương án (`whyWrong`); test ở `sat-rw-hard.test.ts`.
 */
type HardSeed = {
  id: string;
  unit: number;
  unitTitle: string;
  domain: string;
  skill: string;
  passage: string;
  underline?: string;
  table?: MockItem['table'];
  stem: string;
  options: string[];
  answerIndex: number;
  explainVi: string;
  whyWrong: string[];
  meaningVi: string;
};

const LETTERS = ['A', 'B', 'C', 'D'];

/** Ghép lời giải theo đúng khuôn của kho cũ: vì sao đúng, vì sao từng phương án sai, rồi nghĩa. */
function hardSolution(q: HardSeed): string {
  const wrong = q.options
    .map((_, i) => (i === q.answerIndex ? null : `${LETTERS[i]} sai: ${q.whyWrong[i]}`))
    .filter(Boolean)
    .join('\n');
  return `${q.explainVi}\n${wrong}\nNghĩa: ${q.meaningVi}`;
}

function fromHardSeed(q: HardSeed): SatRwQuestion {
  return {
    id: q.id,
    unit: q.unit,
    unitTitle: q.unitTitle,
    domain: q.domain,
    skill: q.skill,
    passage: q.passage,
    ...(q.underline ? { underline: q.underline } : {}),
    ...(q.table ? { table: q.table } : {}),
    stem: q.stem,
    options: q.options,
    answerIndex: q.answerIndex,
    solutionVi: hardSolution(q),
    difficulty: 'hard',
    whyWrong: q.whyWrong,
  };
}

export const SAT_RW_HARD_QUESTIONS: SatRwQuestion[] = [
  ...(hardConventions as { questions: HardSeed[] }).questions,
  ...(hardReading as { questions: HardSeed[] }).questions,
].map(fromHardSeed);

/**
 * Chia câu CŨ của một unit thành Dễ / Vừa: nửa có điểm khó (phỏng theo, xem
 * `mock/difficulty.ts`) thấp hơn là Dễ, nửa còn lại là Vừa. Bậc Khó chỉ dành
 * cho câu viết riêng cho bậc ấy — điểm phỏng theo chưa từng hiệu chuẩn, không
 * đủ để gọi một câu cũ là "khó".
 */
function labelOldByUnit(questions: SatRwQuestion[]): SatRwQuestion[] {
  const byUnit = new Map<number, SatRwQuestion[]>();
  for (const q of questions) {
    if (!byUnit.has(q.unit)) byUnit.set(q.unit, []);
    byUnit.get(q.unit)!.push(q);
  }
  const level = new Map<string, Difficulty>();
  for (const list of byUnit.values()) {
    const ranked = list
      .map((q) => ({
        id: q.id,
        score: difficultyScore({ id: q.id, domain: q.domain as MockItem['domain'], skill: q.skill, passage: q.passage, stem: q.stem, options: q.options, answerIndex: q.answerIndex, solutionVi: '' }),
      }))
      .sort((a, b) => a.score - b.score || a.id.localeCompare(b.id));
    const cut = Math.ceil(ranked.length / 2);
    ranked.forEach((r, i) => level.set(r.id, i < cut ? 'easy' : 'medium'));
  }
  return questions.map((q) => ({ ...q, difficulty: level.get(q.id) ?? 'medium' }));
}

export const SAT_RW_QUESTIONS: SatRwQuestion[] = [
  ...labelOldByUnit([...SAT_RW_BASE_QUESTIONS, ...SAT_RW_EXTRA_QUESTIONS]),
  ...SAT_RW_HARD_QUESTIONS,
  ...SAT_RW_ORIGINAL_READING_EXPANSION,
];

/** Bậc của một câu; câu sinh lúc chạy không mang nhãn thì coi là Vừa. */
export function rwDifficulty(q: Pick<SatRwQuestion, 'difficulty'>): Difficulty {
  return q.difficulty ?? 'medium';
}

/** Số câu mỗi unit đếm lại từ kho đã gộp, không lấy con số ghi sẵn trong seed. */
export const SAT_RW_UNITS: SatRwUnit[] = data.units.map((u) => ({
  ...u,
  count: SAT_RW_QUESTIONS.filter((q) => q.unit === u.unit).length,
}));

/**
 * Bốn mảng của đề Digital SAT R&W, kèm tỷ trọng trong đề thật.
 *
 * Giữ nguyên tên tiếng Anh của College Board như mọi chỗ khác trong app: đó là
 * tên người luyện thi đọc trong mọi tài liệu, dịch ra lại thành xa lạ.
 */
export const SAT_RW_DOMAINS: readonly { key: string; labelVi: string; percent: string }[] = [
  { key: 'Information and Ideas', labelVi: 'Nắm thông tin và ý', percent: '~26%' },
  { key: 'Craft and Structure', labelVi: 'Từ ngữ và cấu trúc', percent: '~28%' },
  { key: 'Expression of Ideas', labelVi: 'Diễn đạt ý', percent: '~20%' },
  { key: 'Standard English Conventions', labelVi: 'Chuẩn mực tiếng Anh', percent: '~26%' },
];

export const SAT_RW_SKILL_LABEL: Record<string, string> = {
  boundaries: 'Ranh giới câu',
  form: 'Dạng từ & hoà hợp',
  pronoun: 'Đại từ',
  tense: 'Thì động từ',
  possessive: 'Sở hữu cách',
  transition: 'Từ nối',
  words: 'Words in Context',
  structure: 'Text Structure',
  crosstext: 'Cross-Text Connections',
  central: 'Central Ideas',
  evidence: 'Command of Evidence',
  inference: 'Inferences',
};

export function getSatRwUnit(unit: number): SatRwUnit | undefined {
  return SAT_RW_UNITS.find((u) => u.unit === unit);
}

/** Câu của một unit, XẾP DỄ → VỪA → KHÓ (giữ thứ tự kho trong cùng bậc). */
export function questionsForUnit(unit: number): SatRwQuestion[] {
  return sortByDifficulty(
    SAT_RW_QUESTIONS.filter((q) => q.unit === unit),
    rwDifficulty,
  );
}

/** Câu của một kỹ năng, xếp dễ → khó. */
export function questionsForSkill(skill: string): SatRwQuestion[] {
  return sortByDifficulty(
    SAT_RW_QUESTIONS.filter((q) => q.skill === skill),
    rwDifficulty,
  );
}

export function unitsByDomain(domain: string): SatRwUnit[] {
  return SAT_RW_UNITS.filter((u) => u.domain === domain);
}

export function satRwStats() {
  const byDomain: Record<string, number> = {};
  const skills = new Set<string>();
  for (const q of SAT_RW_QUESTIONS) {
    byDomain[q.domain] = (byDomain[q.domain] ?? 0) + 1;
    skills.add(q.skill);
  }
  return {
    questions: SAT_RW_QUESTIONS.length,
    units: SAT_RW_UNITS.length,
    domains: SAT_RW_DOMAINS.length,
    skills: skills.size,
    byDomain,
  };
}
