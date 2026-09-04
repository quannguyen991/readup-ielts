/**
 * Tiện ích dùng khi SOẠN template: bốc số ngẫu nhiên và viết số hạng cho đúng
 * quy ước toán.
 *
 * Hai lý do tách riêng ra đây:
 *
 * 1. Mọi hàm bốc số đều KHÔNG có vòng thử lại. Bốc rồi kiểm rồi bốc lại nghĩa
 *    là với một hạt xấu, template có thể quay vô hạn — mà hạt lại do id câu
 *    quyết định, nên câu ấy sẽ treo mãi mãi chứ không phải treo một lần. Cùng
 *    lý do đã ghi ở bộ sinh biểu đồ Task 1: ràng buộc phải nằm trong cấu trúc
 *    phép bốc.
 * 2. Viết số hạng bằng nối chuỗi thẳng tay sẽ đẻ ra "1x", "+ -5", "= 0" — đề
 *    trông nghiệp dư và người học mất thời gian giải mã thay vì giải toán.
 */

export function pickInt(rng: () => number, lo: number, hi: number): number {
  return lo + Math.floor(rng() * (hi - lo + 1));
}

/**
 * Bốc số nguyên trong [lo, hi] nhưng bỏ số 0, bằng cách bốc trên dải ngắn hơn
 * một đơn vị rồi đẩy nửa trên lên — không thử lại lần nào.
 */
export function pickNonZeroInt(rng: () => number, lo: number, hi: number): number {
  const value = lo + Math.floor(rng() * (hi - lo));
  return value >= 0 ? value + 1 : value;
}

export function pick<T>(rng: () => number, items: readonly T[]): T {
  const item = items[Math.floor(rng() * items.length)];
  if (item === undefined) throw new Error('pick() nhận mảng rỗng.');
  return item;
}

/** ` + 5` hoặc ` - 5`. Số 0 trả về chuỗi rỗng — không ai viết "x + 0". */
export function signedTerm(n: number): string {
  if (n === 0) return '';
  return n < 0 ? ` - ${-n}` : ` + ${n}`;
}

/** `3x`, `-x`, `x`. Hệ số 0 trả về chuỗi rỗng. */
export function coefTerm(n: number, variable = 'x'): string {
  if (n === 0) return '';
  if (n === 1) return variable;
  if (n === -1) return `-${variable}`;
  return `${n}${variable}`;
}

/** Một vế dạng `ax + b`, đã bỏ những phần bằng 0. */
export function linearSide(coef: number, constant: number, variable = 'x'): string {
  if (coef === 0) return String(constant);
  return `${coefTerm(coef, variable)}${signedTerm(constant)}`;
}

/** ` + 3y`, ` - y`. Dùng để nối số hạng thứ hai của phương trình hai ẩn. */
export function signedCoefTerm(n: number, variable: string): string {
  if (n === 0) return '';
  return n < 0 ? ` - ${coefTerm(-n, variable)}` : ` + ${coefTerm(n, variable)}`;
}

/** Một vế dạng `ax + by`, đã xử lý dấu và hệ số 1. */
export function twoVarSide(a: number, b: number, first = 'x', second = 'y'): string {
  if (a === 0) return coefTerm(b, second);
  return `${coefTerm(a, first)}${signedCoefTerm(b, second)}`;
}

/** Một tam thức `ax² + bx + c`, đã xử lý dấu và bỏ những phần bằng 0. */
export function quadraticSide(a: number, b: number, c: number, variable = 'x'): string {
  const head = coefTerm(a, `${variable}^2`);
  return `${head}${signedCoefTerm(b, variable)}${signedTerm(c)}`;
}

/**
 * Viết một phân số ở dạng markup, tự rút về số nguyên khi chia hết.
 *
 * Lời giải in ra `frac(12,4)` thay vì `3` là bắt người học tự rút gọn giữa
 * chừng một bước đáng lẽ đã xong.
 */
export function fracOrInt(num: number, den: number): string {
  if (den !== 0 && num % den === 0) return String(num / den);
  const sign = num * den < 0 ? '-' : '';
  return `${sign}frac(${Math.abs(num)},${Math.abs(den)})`;
}
