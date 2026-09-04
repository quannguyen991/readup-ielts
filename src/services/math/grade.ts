import { gradeGridIn, type GridInVerdict } from './grid-in';
import type { MathChoice, MathErrorTag, MathItem } from '@/lib/math/types';

/**
 * Chấm một câu Math.
 *
 * Tách khỏi màn hình để chấm được trong test, và để đúng MỘT chỗ quyết định thế
 * nào là đúng. Màn làm bài và màn Review đều gọi hàm này, nên không có cửa nào
 * cho hai nơi chấm lệch nhau.
 */

export type MathGrade = {
  isCorrect: boolean;
  /** Nhãn lỗi của nhiễu đã chọn — null khi đúng, khi bỏ trống, hoặc khi nhiễu không có nhãn. */
  errorTag: MathErrorTag | null;
  /** Giải thích riêng của lựa chọn đã chọn, nếu có. */
  note: string | null;
  /** Chỉ câu grid-in: vì sao sai (gõ sai định dạng, dài quá ô, chưa điền kín…). */
  gridVerdict: GridInVerdict | null;
  /** Lựa chọn người học đã chọn, để màn Review tô lại. */
  chosen: MathChoice | null;
};

const BLANK: MathGrade = {
  isCorrect: false,
  errorTag: null,
  note: null,
  gridVerdict: null,
  chosen: null,
};

/**
 * `answer` là chuỗi vì hai định dạng lưu hai thứ khác nhau: câu trắc nghiệm lưu
 * CHỈ SỐ lựa chọn, câu grid-in lưu đúng chuỗi người học gõ. Giữ nguyên chuỗi gõ
 * vào chứ không chuẩn hoá: '2/3' và '.6667' cùng đúng nhưng nói hai điều khác
 * nhau về cách người học nghĩ, và màn Review cần biết điều đó.
 */
export function gradeMathItem(item: MathItem, answer: string | null): MathGrade {
  if (answer === null || answer.trim() === '') {
    // Bỏ trống không phải là chọn sai: không gán nhãn lỗi nào cho nó.
    return item.format === 'grid_in'
      ? { ...BLANK, gridVerdict: { ok: false, reason: 'empty' } }
      : BLANK;
  }

  if (item.format === 'grid_in') {
    if (!item.answerValue) return BLANK;
    const gridVerdict = gradeGridIn(answer, item.answerValue);
    return { ...BLANK, isCorrect: gridVerdict.ok, gridVerdict };
  }

  const index = Number(answer);
  const chosen = item.choices?.[index] ?? null;
  if (!chosen) return BLANK;

  const isCorrect = index === item.correctIndex;
  return {
    isCorrect,
    errorTag: isCorrect ? null : chosen.errorTag,
    note: isCorrect ? null : (chosen.note ?? null),
    gridVerdict: null,
    chosen,
  };
}

export type MathResponse = {
  itemId: string;
  answer: string | null;
  timeSpentMs: number;
};

export type GradedAttempt = {
  itemId: string;
  skill: MathItem['skill'];
  domain: MathItem['domain'];
  format: MathItem['format'];
  userAnswer: string | null;
  isCorrect: boolean;
  errorTag: MathErrorTag | null;
  timeSpentMs: number;
};

/**
 * Chấm cả một lượt.
 *
 * Câu KHÔNG CÓ trong `responses` vẫn được chấm, thành sai và không nhãn — người
 * học bỏ trắng vẫn phải nằm trong mẫu số, nếu không thì bỏ trắng nhiều lại làm
 * độ chính xác đẹp lên.
 */
export function gradeMathSession(items: MathItem[], responses: MathResponse[]): GradedAttempt[] {
  const byId = new Map(responses.map((r) => [r.itemId, r]));

  return items.map((item) => {
    const response = byId.get(item.id);
    const grade = gradeMathItem(item, response?.answer ?? null);
    return {
      itemId: item.id,
      skill: item.skill,
      domain: item.domain,
      format: item.format,
      userAnswer: response?.answer ?? null,
      isCorrect: grade.isCorrect,
      errorTag: grade.errorTag,
      timeSpentMs: response?.timeSpentMs ?? 0,
    };
  });
}

export function countCorrect(attempts: GradedAttempt[]): number {
  return attempts.filter((a) => a.isCorrect).length;
}
