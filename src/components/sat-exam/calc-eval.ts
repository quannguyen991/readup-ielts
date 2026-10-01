/**
 * Bộ tính biểu thức cho máy tính trong phòng thi — KHÔNG dùng `eval`.
 *
 * Đọc chuỗi thành từng mẩu, rồi phân tích đệ quy theo thứ bậc phép toán:
 *   biểu thức = hạng (+|− hạng)*
 *   hạng      = nhân tử ((×|÷)? nhân tử)*      ← nhân ngầm: 2π, 3(4), 2√9
 *   nhân tử   = (+|−) nhân tử | luỹ thừa
 *   luỹ thừa  = cơ sở (^ nhân tử)?             ← kết hợp phải: 2^3^2 = 2^9
 *   cơ sở     = số | hằng | hàm(…) | √ nhân tử | ( biểu thức ) ; theo sau có thể là !
 *
 * Lỗi ném `CalcError` với mã ngắn để giao diện tự dịch.
 */

export type AngleMode = 'deg' | 'rad';

export class CalcError extends Error {
  constructor(public code: 'syntax' | 'paren' | 'domain' | 'unknown' | 'empty') {
    super(code);
  }
}

type Tok =
  | { t: 'num'; v: number }
  | { t: 'id'; v: string }
  | { t: 'op'; v: string }
  | { t: '('; v: '(' }
  | { t: ')'; v: ')' };

const FUNCS = ['sqrt', 'sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'ln', 'log', 'abs'] as const;
const CONSTS: Record<string, number> = { pi: Math.PI, 'π': Math.PI, e: Math.E };

function tokenize(src: string): Tok[] {
  const s = src
    .replace(/×|·|∙/g, '*')
    .replace(/÷/g, '/')
    .replace(/−|–/g, '-')
    .replace(/\*\*/g, '^')
    .replace(/,/g, '.');
  const out: Tok[] = [];
  let i = 0;
  while (i < s.length) {
    const c = s[i]!;
    if (/\s/.test(c)) {
      i++;
      continue;
    }
    if (/[0-9.]/.test(c)) {
      let j = i;
      while (j < s.length && /[0-9.]/.test(s[j]!)) j++;
      // Ký hiệu khoa học: 1e5, 2.5e-3 — chỉ khi ngay sau "e" là chữ số.
      if (s[j] === 'e' && /[0-9+-]/.test(s[j + 1] ?? '') && /[0-9]/.test(s[j + 1] === '+' || s[j + 1] === '-' ? (s[j + 2] ?? '') : s[j + 1]!)) {
        j += s[j + 1] === '+' || s[j + 1] === '-' ? 2 : 1;
        while (j < s.length && /[0-9]/.test(s[j]!)) j++;
      }
      const text = s.slice(i, j);
      if ((text.match(/\./g) ?? []).length > 1 || text === '.') throw new CalcError('syntax');
      out.push({ t: 'num', v: Number(text) });
      i = j;
      continue;
    }
    if (c === 'π' || c === '√') {
      out.push(c === 'π' ? { t: 'id', v: 'π' } : { t: 'id', v: 'sqrt' });
      i++;
      continue;
    }
    if (/[a-zA-Z]/.test(c)) {
      let j = i;
      while (j < s.length && /[a-zA-Z]/.test(s[j]!)) j++;
      // Tách chuỗi chữ liền nhau thành tên đã biết: "2pie" → pi, e.
      let word = s.slice(i, j).toLowerCase();
      while (word.length > 0) {
        const name = ['asin', 'acos', 'atan', 'sqrt', 'sin', 'cos', 'tan', 'abs', 'log', 'ans', 'ln', 'pi', 'e'].find((n) =>
          word.startsWith(n),
        );
        if (!name) throw new CalcError('unknown');
        out.push({ t: 'id', v: name });
        word = word.slice(name.length);
      }
      i = j;
      continue;
    }
    if ('+-*/^!%'.includes(c)) {
      out.push({ t: 'op', v: c });
      i++;
      continue;
    }
    if (c === '(' || c === '[') {
      out.push({ t: '(', v: '(' });
      i++;
      continue;
    }
    if (c === ')' || c === ']') {
      out.push({ t: ')', v: ')' });
      i++;
      continue;
    }
    throw new CalcError('syntax');
  }
  return out;
}

function factorial(n: number): number {
  if (n < 0 || !Number.isInteger(n) || n > 170) throw new CalcError('domain');
  let r = 1;
  for (let k = 2; k <= n; k++) r *= k;
  return r;
}

export function evaluate(src: string, opts: { angle?: AngleMode; ans?: number } = {}): number {
  const angle = opts.angle ?? 'deg';
  const toks = tokenize(src);
  if (toks.length === 0) throw new CalcError('empty');
  let p = 0;
  const peek = () => toks[p];
  const isOp = (v: string) => {
    const k = peek();
    return !!k && k.t === 'op' && k.v === v;
  };

  const toRad = (x: number) => (angle === 'deg' ? (x * Math.PI) / 180 : x);
  const fromRad = (x: number) => (angle === 'deg' ? (x * 180) / Math.PI : x);

  const applyFn = (name: string, x: number): number => {
    switch (name) {
      case 'sqrt':
        if (x < 0) throw new CalcError('domain');
        return Math.sqrt(x);
      case 'sin':
        return Math.sin(toRad(x));
      case 'cos':
        return Math.cos(toRad(x));
      case 'tan': {
        const c = Math.cos(toRad(x));
        if (Math.abs(c) < 1e-12) throw new CalcError('domain');
        return Math.tan(toRad(x));
      }
      case 'asin':
        if (x < -1 || x > 1) throw new CalcError('domain');
        return fromRad(Math.asin(x));
      case 'acos':
        if (x < -1 || x > 1) throw new CalcError('domain');
        return fromRad(Math.acos(x));
      case 'atan':
        return fromRad(Math.atan(x));
      case 'ln':
        if (x <= 0) throw new CalcError('domain');
        return Math.log(x);
      case 'log':
        if (x <= 0) throw new CalcError('domain');
        return Math.log10(x);
      case 'abs':
        return Math.abs(x);
      default:
        throw new CalcError('unknown');
    }
  };

  /** Có bắt đầu được một nhân tử ở vị trí này không — để nhận nhân ngầm. */
  const startsFactor = () => {
    const k = peek();
    return !!k && (k.t === 'num' || k.t === 'id' || k.t === '(');
  };

  function expr(): number {
    let v = term();
    while (isOp('+') || isOp('-')) {
      const op = (toks[p++] as { v: string }).v;
      const r = term();
      v = op === '+' ? v + r : v - r;
    }
    return v;
  }

  function term(): number {
    let v = unary();
    for (;;) {
      if (isOp('*') || isOp('/')) {
        const op = (toks[p++] as { v: string }).v;
        const r = unary();
        if (op === '/' && r === 0) throw new CalcError('domain');
        v = op === '*' ? v * r : v / r;
      } else if (startsFactor()) {
        v *= power();
      } else break;
    }
    return v;
  }

  function unary(): number {
    if (isOp('-')) {
      p++;
      return -unary();
    }
    if (isOp('+')) {
      p++;
      return unary();
    }
    return power();
  }

  function power(): number {
    const b = postfix();
    if (isOp('^')) {
      p++;
      const e = unary();
      const r = Math.pow(b, e);
      if (Number.isNaN(r)) throw new CalcError('domain');
      return r;
    }
    return b;
  }

  function postfix(): number {
    let v = base();
    for (;;) {
      if (isOp('!')) {
        p++;
        v = factorial(v);
      } else if (isOp('%')) {
        p++;
        v = v / 100;
      } else break;
    }
    return v;
  }

  function base(): number {
    const k = toks[p];
    if (!k) throw new CalcError('syntax');
    if (k.t === 'num') {
      p++;
      return k.v;
    }
    if (k.t === '(') {
      p++;
      const v = expr();
      if (peek()?.t !== ')') throw new CalcError('paren');
      p++;
      return v;
    }
    if (k.t === 'id') {
      p++;
      if (k.v in CONSTS) return CONSTS[k.v]!;
      if (k.v === 'ans') return opts.ans ?? 0;
      if ((FUNCS as readonly string[]).includes(k.v)) {
        // sin(30) hoặc sin 30 hoặc √9 — đối số là một nhân tử có luỹ thừa.
        const arg = peek()?.t === '(' ? base() : power();
        return applyFn(k.v, arg);
      }
      throw new CalcError('unknown');
    }
    throw new CalcError('syntax');
  }

  // Cho phép quên đóng ngoặc ở cuối: "sqrt(2" → sqrt(2).
  const opens = toks.filter((k) => k.t === '(').length;
  const closes = toks.filter((k) => k.t === ')').length;
  if (closes > opens) throw new CalcError('paren');
  for (let k = 0; k < opens - closes; k++) toks.push({ t: ')', v: ')' });

  const v = expr();
  if (p !== toks.length) throw new CalcError('syntax');
  if (!Number.isFinite(v)) throw new CalcError('domain');
  return v;
}

/** In một số cho gọn: bỏ đuôi lỗi dấu phẩy động (0.1+0.2 → 0.3). */
export function formatNumber(v: number): string {
  if (Object.is(v, -0) || Math.abs(v) < 1e-12) return '0';
  const abs = Math.abs(v);
  if (abs >= 1e12 || abs < 1e-6) return v.toExponential(6).replace(/\.?0+e/, 'e');
  return String(Number(v.toPrecision(12)));
}

/**
 * Phân số gần đúng (liên phân số), chỉ khi khớp tới 1e-9 và mẫu ≤ 10 000.
 * Trả `null` nếu số đã nguyên hoặc không có phân số gọn.
 */
export function toFraction(v: number): string | null {
  if (!Number.isFinite(v) || Number.isInteger(v)) return null;
  const sign = v < 0 ? '-' : '';
  const x = Math.abs(v);
  let h1 = 1;
  let h0 = 0;
  let k1 = 0;
  let k0 = 1;
  let b = x;
  for (let i = 0; i < 30; i++) {
    const a = Math.floor(b);
    const h2 = a * h1 + h0;
    const k2 = a * k1 + k0;
    if (k2 > 10_000) break;
    h0 = h1;
    h1 = h2;
    k0 = k1;
    k1 = k2;
    if (Math.abs(x - h1 / k1) < 1e-9) return k1 === 1 ? null : `${sign}${h1}/${k1}`;
    const frac = b - a;
    if (frac < 1e-12) break;
    b = 1 / frac;
  }
  return null;
}
