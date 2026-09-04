import {
  decimalString,
  equalsValue,
  formatValue,
  hasTerminatingDecimal,
  isIntegerValue,
  rat,
  toDecimal,
} from '@/lib/math/value';
import type { MathValue } from '@/lib/math/types';

/**
 * Chấm câu student-produced response (grid-in) của SAT Math.
 *
 * Đây là chỗ dễ chấm oan nhất trong cả module, vì luật của College Board không
 * hiển nhiên và một cách chấm "hợp lý" tự nghĩ ra sẽ sai ở nhiều ca:
 *
 * - Ô điền chỉ chứa 5 ký tự (6 nếu đáp án âm, dấu trừ ăn một ô). Gõ đúng giá
 *   trị nhưng dài quá ô thì đề thật vẫn tính SAI. App phải bắt chước đúng điều
 *   đó, nếu không thì người học quen tay rồi mất điểm oan ở phòng thi.
 * - Phân số và số thập phân đều được. HỖN SỐ thì không: "1 1/2" bị đọc thành
 *   11/2, nên phải viết 3/2 hoặc 1.5.
 * - Đáp án thập phân vô hạn tuần hoàn phải ĐIỀN KÍN Ô, cắt hay làm tròn đều
 *   được. Với 2/3 thì `.6666`, `.6667`, `0.666`, `0.667` đều đúng — nhưng
 *   `.667` thì sai, vì còn ô trống mà không điền.
 * - Không dấu phẩy ngăn nghìn, không dấu %, không khoảng trắng.
 *
 * `gradeGridIn` trả về LÝ DO chứ không chỉ đúng/sai, để màn Review nói được
 * "giá trị đúng nhưng viết không vừa ô" thay vì gộp chung vào "sai".
 */

export const GRID_LIMIT_POSITIVE = 5;
export const GRID_LIMIT_NEGATIVE = 6;

export type GridInReason =
  | 'empty'
  | 'malformed'
  | 'mixed_number'
  | 'too_long'
  | 'not_precise_enough'
  | 'wrong';

export type GridInVerdict = { ok: true } | { ok: false; reason: GridInReason };

export const GRID_IN_REASON_LABEL: Record<GridInReason, string> = {
  empty: 'Chưa điền gì.',
  malformed: 'Ô này chỉ nhận chữ số, dấu chấm thập phân, dấu gạch phân số và dấu trừ.',
  mixed_number: 'Không viết được hỗn số — "1 1/2" bị đọc thành 11/2. Viết 3/2 hoặc 1.5.',
  too_long: 'Đúng giá trị nhưng dài quá ô điền. Đề thật cũng tính sai ở đây.',
  not_precise_enough: 'Đáp án là số thập phân vô hạn, phải điền kín ô mới được tính đúng.',
  wrong: 'Chưa đúng.',
};

function limitFor(text: string): number {
  return text.startsWith('-') ? GRID_LIMIT_NEGATIVE : GRID_LIMIT_POSITIVE;
}

type ParsedInput = {
  value: MathValue;
  form: 'fraction' | 'decimal';
  /** Số chữ số sau dấu phẩy khi viết ở dạng thập phân. 0 với số nguyên và phân số. */
  places: number;
};

/** Đọc chuỗi người học gõ. Trả về null nếu không phải một số hợp lệ của ô grid-in. */
export function parseGridInput(raw: string): ParsedInput | null {
  const text = raw.trim();
  if (text.length === 0) return null;

  const fraction = text.match(/^(-?\d+)\/(\d+)$/);
  if (fraction) {
    const den = Number(fraction[2]);
    if (den === 0) return null;
    return { value: rat(Number(fraction[1]), den), form: 'fraction', places: 0 };
  }

  const decimal = text.match(/^(-?)(\d*)(?:\.(\d*))?$/);
  if (decimal) {
    const sign = decimal[1] === '-' ? -1 : 1;
    const intPart = decimal[2] ?? '';
    const fracPart = decimal[3] ?? '';
    // Phải có ít nhất một chữ số ở đâu đó: '.', '-' hay '-.' không phải là số.
    if (intPart.length === 0 && fracPart.length === 0) return null;

    const digits = `${intPart}${fracPart}`;
    return {
      value: rat(sign * Number(digits), 10 ** fracPart.length),
      form: 'decimal',
      places: fracPart.length,
    };
  }

  return null;
}

function stripLeadingZero(text: string): string {
  return text.replace(/^(-?)0\./, '$1.');
}

/** Cách viết thập phân CHÍNH XÁC ngắn nhất, hoặc null nếu đáp án lặp vô hạn. */
function shortestExactDecimal(value: MathValue): string | null {
  if (!hasTerminatingDecimal(value)) return null;

  let den = value.den;
  let twos = 0;
  let fives = 0;
  while (den % 2 === 0) {
    den /= 2;
    twos += 1;
  }
  while (den % 5 === 0) {
    den /= 5;
    fives += 1;
  }

  const places = Math.max(twos, fives);
  const full = decimalString(value, places, 'truncate');
  const stripped = stripLeadingZero(full);
  return stripped.length < full.length ? stripped : full;
}

/**
 * Những cách viết ĐIỀN KÍN Ô của một đáp án không viết chính xác được.
 *
 * Hai kiểu, vì bỏ số 0 đứng đầu tiết kiệm được một ô nên cho thêm một chữ số
 * sau dấu phẩy: với 2/3 ra `0.666`/`0.667` (giữ số 0) và `.6666`/`.6667` (bỏ).
 */
function fullFieldForms(value: MathValue, limit: number): string[] {
  const signChars = value.num < 0 ? 1 : 0;
  const intDigits = String(Math.floor(Math.abs(value.num) / value.den)).length;
  const forms: string[] = [];

  const keepZero = limit - signChars - intDigits - 1;
  if (keepZero >= 1) {
    forms.push(decimalString(value, keepZero, 'truncate'));
    forms.push(decimalString(value, keepZero, 'round'));
  }

  if (Math.abs(toDecimal(value)) < 1) {
    const dropZero = limit - signChars - 1;
    if (dropZero >= 1) {
      forms.push(stripLeadingZero(decimalString(value, dropZero, 'truncate')));
      forms.push(stripLeadingZero(decimalString(value, dropZero, 'round')));
    }
  }

  return [...new Set(forms)].filter((f) => f.length <= limit);
}

/**
 * Mọi cách viết được chấp nhận cho một đáp án. Màn Review hiện đúng danh sách
 * này, vì "đáp án là 2/3" không nói cho người học biết `.6667` cũng được tính.
 */
export function gridInAcceptedForms(answer: MathValue): string[] {
  const limit = answer.num < 0 ? GRID_LIMIT_NEGATIVE : GRID_LIMIT_POSITIVE;
  const forms: string[] = [];

  const fraction = formatValue(answer);
  if (fraction.length <= limit) forms.push(fraction);

  const exactDecimal = shortestExactDecimal(answer);
  if (exactDecimal && exactDecimal.length <= limit && exactDecimal !== fraction) {
    forms.push(exactDecimal);
  }

  if (!exactDecimal || exactDecimal.length > limit) {
    forms.push(...fullFieldForms(answer, limit));
  }

  return [...new Set(forms)];
}

/**
 * Đáp án này có điền được vào ô grid-in không.
 *
 * Template nào sinh ra đáp án không điền nổi là template hỏng — property test
 * gọi hàm này trên mọi hạt để chặn ngay, chứ không đợi người học gặp một câu
 * không có cách nào trả lời đúng.
 */
export function fitsGrid(answer: MathValue): boolean {
  return gridInAcceptedForms(answer).length > 0;
}

export function gradeGridIn(raw: string, answer: MathValue): GridInVerdict {
  const text = raw.trim();
  if (text.length === 0) return { ok: false, reason: 'empty' };

  if (/^-?\d+\s+\d+\/\d+$/.test(text)) return { ok: false, reason: 'mixed_number' };

  const parsed = parseGridInput(text);
  if (!parsed) return { ok: false, reason: 'malformed' };

  const limit = limitFor(text);
  const tooLong = text.length > limit;

  // "Dài quá ô" chỉ là lời nhắc hữu ích khi giá trị vốn đã đúng. Vừa dài vừa
  // sai thì nói "dài quá ô" là che mất vấn đề thật.
  if (equalsValue(parsed.value, answer)) {
    return tooLong ? { ok: false, reason: 'too_long' } : { ok: true };
  }

  // Từ đây trở xuống chỉ còn cửa xấp xỉ, và chỉ mở khi bản thân đáp án KHÔNG
  // viết chính xác được trong ô.
  const exactDecimal = shortestExactDecimal(answer);
  const exactFits = exactDecimal !== null && exactDecimal.length <= limit;
  if (parsed.form !== 'decimal' || exactFits) return { ok: false, reason: 'wrong' };

  const truncated = parseGridInput(decimalString(answer, parsed.places, 'truncate'));
  const rounded = parseGridInput(decimalString(answer, parsed.places, 'round'));
  const matches =
    (truncated && equalsValue(parsed.value, truncated.value)) ||
    (rounded && equalsValue(parsed.value, rounded.value));

  if (!matches) return { ok: false, reason: 'wrong' };
  if (tooLong) return { ok: false, reason: 'too_long' };

  // Giá trị khớp với bản cắt/làm tròn, nhưng còn ô trống thì đề thật vẫn tính sai.
  return text.length === limit ? { ok: true } : { ok: false, reason: 'not_precise_enough' };
}

export function gridInEquals(raw: string, answer: MathValue): boolean {
  return gradeGridIn(raw, answer).ok;
}

/** Dùng cho khẳng định trong test: đáp án nguyên thì viết thẳng, phân số thì giữ nguyên. */
export function isPlainInteger(answer: MathValue): boolean {
  return isIntegerValue(answer);
}
