import type { MathValue } from './types';

/**
 * Số hữu tỉ chính xác.
 *
 * VÌ SAO KHÔNG DÙNG `number`: đáp án SAT Math luôn hữu tỉ, mà trong dấu phẩy
 * động `0.1 + 0.2 !== 0.3`. Chấm bài bằng số thực nghĩa là sẽ có ngày người học
 * gõ đúng đáp án và bị báo sai, mà không tài nào biết vì sao. Giữ nguyên tử và
 * mẫu tới đúng lúc so sánh thì không có chuyện đó.
 *
 * Mọi giá trị ở đây đã rút gọn và dấu luôn nằm ở TỬ — nhờ vậy so sánh chỉ là so
 * hai cặp số nguyên, không cần quy đồng lúc so.
 */

function gcd(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y !== 0) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x === 0 ? 1 : x;
}

export function rat(num: number, den = 1): MathValue {
  if (den === 0) throw new Error('Mẫu số bằng 0 — bộ sinh đề đang dựng một câu không có đáp án.');
  if (!Number.isInteger(num) || !Number.isInteger(den)) {
    throw new Error(`rat() chỉ nhận số nguyên, nhận được ${num}/${den}.`);
  }

  const sign = den < 0 ? -1 : 1;
  const n = num * sign;
  const d = den * sign;
  const g = gcd(n, d);
  return { num: n / g, den: d / g };
}

export function isIntegerValue(v: MathValue): boolean {
  return v.den === 1;
}

export function toDecimal(v: MathValue): number {
  return v.num / v.den;
}

export function equalsValue(a: MathValue, b: MathValue): boolean {
  return a.num === b.num && a.den === b.den;
}

export function negValue(v: MathValue): MathValue {
  return rat(-v.num, v.den);
}

export function addValue(a: MathValue, b: MathValue): MathValue {
  return rat(a.num * b.den + b.num * a.den, a.den * b.den);
}

export function subValue(a: MathValue, b: MathValue): MathValue {
  return addValue(a, negValue(b));
}

export function mulValue(a: MathValue, b: MathValue): MathValue {
  return rat(a.num * b.num, a.den * b.den);
}

export function divValue(a: MathValue, b: MathValue): MathValue {
  if (b.num === 0) throw new Error('Chia cho 0 trong bộ sinh đề.');
  return rat(a.num * b.den, a.den * b.num);
}

/**
 * Mẫu số chỉ có ước nguyên tố 2 và 5 thì số thập phân hữu hạn — biết điều này
 * mới quyết định được câu grid-in có chấp nhận cách viết thập phân hay không.
 */
export function hasTerminatingDecimal(v: MathValue): boolean {
  let d = v.den;
  while (d % 2 === 0) d /= 2;
  while (d % 5 === 0) d /= 5;
  return d === 1;
}

/** Viết phẳng: `12`, `-3/4`. Dùng cho ô nhập grid-in và cho khẳng định trong test. */
export function formatValue(v: MathValue): string {
  return isIntegerValue(v) ? String(v.num) : `${v.num}/${v.den}`;
}

/** Viết dưới dạng markup toán: phân số xếp chồng. Dùng cho lựa chọn trắc nghiệm. */
export function formatValueMath(v: MathValue): string {
  if (isIntegerValue(v)) return String(v.num);
  const sign = v.num < 0 ? '-' : '';
  return `${sign}frac(${Math.abs(v.num)},${v.den})`;
}

/**
 * Khai triển thập phân, cắt hoặc làm tròn ở `places` chữ số sau dấu phẩy.
 *
 * Tính hoàn toàn bằng số nguyên. Dùng `toFixed()` là mời sai số dấu phẩy động
 * quay lại đúng chỗ ta vừa loại nó ra.
 */
export function decimalString(v: MathValue, places: number, mode: 'truncate' | 'round'): string {
  const sign = v.num < 0 ? '-' : '';
  const n = Math.abs(v.num);
  const d = v.den;

  const scaled = n * 10 ** places;
  let whole = Math.floor(scaled / d);
  const remainder = scaled - whole * d;
  if (mode === 'round' && remainder * 2 >= d) whole += 1;

  if (places === 0) return sign + String(whole);

  const text = String(whole).padStart(places + 1, '0');
  const intPart = text.slice(0, text.length - places);
  const fracPart = text.slice(text.length - places);
  return `${sign}${intPart}.${fracPart}`;
}
