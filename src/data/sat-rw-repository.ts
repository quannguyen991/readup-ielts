import seed from './seed/sat-rw/index.json';

/**
 * Kho câu hỏi SAT Reading & Writing.
 *
 * NGUỒN: dự án `sat-rw-luyen-tap`. Unit 1–10 sinh từ luật ngữ pháp (ghép mảnh,
 * nhiễu tạo bằng cách phá đúng một luật đã biết), unit 11–16 soạn tay vì không
 * có luật nào tính được "ý chính của đoạn này là gì". Toàn bộ 384 câu đã qua
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
  stem: string;
  options: string[];
  answerIndex: number;
  solutionVi: string;
};

type Seed = { units: SatRwUnit[]; questions: SatRwQuestion[] };

const data = seed as Seed;

export const SAT_RW_UNITS: SatRwUnit[] = data.units;
export const SAT_RW_QUESTIONS: SatRwQuestion[] = data.questions;

/**
 * Bốn mảng của đề Digital SAT R&W, kèm tỷ trọng trong đề thật.
 *
 * Giữ nguyên tên tiếng Anh của College Board như mọi chỗ khác trong app: đó là
 * tên người luyện thi đọc trong mọi tài liệu, dịch ra lại thành xa lạ.
 */
export const SAT_RW_DOMAINS: ReadonlyArray<{ key: string; labelVi: string; percent: string }> = [
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

export function questionsForUnit(unit: number): SatRwQuestion[] {
  return SAT_RW_QUESTIONS.filter((q) => q.unit === unit);
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
