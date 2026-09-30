import assert from 'node:assert/strict';
import { test } from 'node:test';

import { PANDA_D_TEMPLATES } from './panda-d';
import { parseMath, validateMath, type MathNode } from '@/lib/math/expr';
import type { MathItemDraft, MathValue } from '@/lib/math/types';
import { addValue, divValue, equalsValue, mulValue, rat, subValue, toDecimal } from '@/lib/math/value';
import { fitsGrid } from '@/services/math/grid-in';
import { hashString, mulberry32 } from '@/services/questions/rng';

/**
 * Property test cho các dạng câu bám sách của `panda-d.ts` (chương 14 – 27).
 *
 * Cùng triết lý với `panda-b.test.ts`: ĐỌC NGƯỢC TỪ ĐỀ (và bảng số in kèm) rồi
 * tự giải lại bằng code độc lập, không đọc tham số nội bộ của template. Lựa
 * chọn dạng biểu thức (căn, π, biến) được tính ra số bằng một bộ đọc markup
 * riêng rồi so với giá trị giải được.
 */

const SEEDS = 200;

function build(slug: string, i: number): MathItemDraft {
  const template = PANDA_D_TEMPLATES.find((t) => t.slug === slug);
  assert.ok(template, `Không có template ${slug}`);
  return template.build(mulberry32(hashString(`${slug}:${i}`)));
}

// --------------------------------------------------------------- tiện ích đọc

/** "12", "-3", "1.5", "frac(3,4)", "-frac(3,4)", kèm "%" ở cuối nếu có. */
function tryNum(display: string): MathValue | null {
  const raw = display.replace(/%$/, '');
  const t = /^-?[\d,]+(\.\d+)?$/.test(raw) ? raw.replace(/,/g, '') : raw;
  const int = t.match(/^(-?\d+)$/);
  if (int) return rat(Number(int[1]));
  const dec = t.match(/^(-?)(\d*)\.(\d+)$/);
  if (dec) {
    const den = 10 ** dec[3]!.length;
    return rat((dec[1] === '-' ? -1 : 1) * (Number(dec[2] || '0') * den + Number(dec[3])), den);
  }
  const frac = t.match(/^(-?)frac\((\d+),(\d+)\)$/);
  if (frac) return rat((frac[1] === '-' ? -1 : 1) * Number(frac[2]), Number(frac[3]));
  return null;
}

function num(display: string): MathValue {
  const v = tryNum(display);
  assert.ok(v, `Không đọc được số: "${display}"`);
  return v;
}

function correctDisplay(d: MathItemDraft): string {
  assert.equal(d.format, 'mcq');
  if (d.format !== 'mcq') throw new Error('unreachable');
  return d.choices[d.correctIndex]!.display;
}

function answerOf(d: MathItemDraft): MathValue {
  return d.format === 'grid_in' ? d.answer : num(correctDisplay(d));
}

function expect(d: MathItemDraft, expected: MathValue | number, why: string) {
  const e = typeof expected === 'number' ? rat(expected) : expected;
  const got = answerOf(d);
  assert.ok(equalsValue(got, e), `${why}: kỳ vọng ${e.num}/${e.den}, template cho ${got.num}/${got.den}. Đề: ${d.stem}`);
}

function match(text: string, pattern: RegExp): RegExpMatchArray {
  const m = text.match(pattern);
  assert.ok(m, `Đề không đúng khuôn ${pattern}: ${text}`);
  return m;
}

const N = (s: string | undefined) => {
  assert.ok(s !== undefined);
  return Number(s.replace(/,/g, ''));
};
const sgn = (s: string | undefined) => (s === '-' ? -1 : 1);
const coef = (t: string | undefined) => (t === undefined || t === '' ? 1 : t === '-' ? -1 : Number(t));

/** Đọc đa thức một biến: "2x^3 - x^2 + 4x - 7" → {3:2, 2:-1, 1:4, 0:-7}. */
function parsePoly(text: string, v = 'x'): Map<number, number> {
  const out = new Map<number, number>();
  const terms = text.trim().replace(/ - /g, ' + -').split(' + ');
  for (const term of terms) {
    const pow = term.match(new RegExp(`^(-?\\d*)${v}\\^(\\d+)$`));
    const lin = term.match(new RegExp(`^(-?\\d*)${v}$`));
    const con = term.match(/^-?\d+$/);
    if (pow) out.set(Number(pow[2]), (out.get(Number(pow[2])) ?? 0) + coef(pow[1]));
    else if (lin) out.set(1, (out.get(1) ?? 0) + coef(lin[1]));
    else if (con) out.set(0, (out.get(0) ?? 0) + Number(term));
    else throw new Error(`Không đọc được số hạng "${term}" trong "${text}"`);
  }
  return out;
}

const pc = (p: Map<number, number>, k: number) => p.get(k) ?? 0;
const polyAt = (p: Map<number, number>, x: number) => [...p].reduce((s, [k, c]) => s + c * x ** k, 0);

/** Đọc "x - 3" / "x + 3" / "x" → a của nhân tử x - a. */
function rootOfDivisor(text: string, v = 'x'): number {
  const m = match(text.trim(), new RegExp(`^${v}(?: ([+-]) (\\d+))?$`));
  return m[1] ? -sgn(m[1]) * Number(m[2]) : 0;
}

/** Markup → biểu thức JS, rồi tính ra số. Biến thay bằng giá trị trong `vars`. */
function toJs(nodes: MathNode[]): string {
  return nodes
    .map((n) => {
      switch (n.kind) {
        case 'text':
          return n.value;
        case 'sup':
          return `**(${toJs(n.children)})`;
        case 'sub':
          return `_${toJs(n.children)}`;
        case 'frac':
          return `((${toJs(n.numerator)})/(${toJs(n.denominator)}))`;
        case 'sqrt':
          return `SQRT(${toJs(n.children)})`;
      }
    })
    .join('');
}

function evalMath(src: string, vars: Record<string, number> = {}): number {
  let js = toJs(parseMath(src)).replace(/π/g, ' PI ').replace(/−/g, '-').replace(/°/g, '');
  js = js.replace(/(?<![A-Za-z])sin(?![A-Za-z])/g, ' SIN ').replace(/(?<![A-Za-z])cos(?![A-Za-z])/g, ' COS ').replace(/(?<![A-Za-z])tan(?![A-Za-z])/g, ' TAN ');
  for (const [k, v] of Object.entries(vars)) js = js.replace(new RegExp(`(?<![A-Za-z])${k}(?![A-Za-z])`, 'g'), ` (${v}) `);
  const tokens = js.match(/\d*\.?\d+|[A-Z]+|\*\*|[-+*/()]/g) ?? [];
  const joined = js.replace(/\s+/g, '');
  assert.equal(tokens.join(''), joined, `Không tính được "${src}" (còn ký tự lạ: ${joined})`);
  let i = 0;
  const peek = () => tokens[i];
  const FN: Record<string, (x: number) => number> = { SQRT: Math.sqrt, SIN: Math.sin, COS: Math.cos, TAN: Math.tan };
  const startsFactor = (t: string | undefined) => t !== undefined && (/^[\d.]/.test(t) || t === '(' || /^[A-Z]+$/.test(t));
  function expr(): number {
    let v = term();
    while (peek() === '+' || peek() === '-') v = tokens[i++] === '+' ? v + term() : v - term();
    return v;
  }
  function term(): number {
    let v = unary();
    for (;;) {
      if (peek() === '*' || peek() === '/') v = tokens[i++] === '*' ? v * unary() : v / unary();
      else if (startsFactor(peek())) v *= power();
      else return v;
    }
  }
  function unary(): number {
    if (peek() === '-') {
      i += 1;
      return -unary();
    }
    if (peek() === '+') {
      i += 1;
      return unary();
    }
    return power();
  }
  function power(): number {
    const base = primary();
    if (peek() === '**') {
      i += 1;
      return base ** unary();
    }
    return base;
  }
  function primary(): number {
    const t = tokens[i++];
    assert.ok(t !== undefined, `Biểu thức cụt: ${src}`);
    if (t === '(') {
      const v = expr();
      assert.equal(tokens[i++], ')', `Thiếu ngoặc đóng: ${src}`);
      return v;
    }
    if (t === 'PI') return Math.PI;
    if (FN[t]) return FN[t]!(power());
    assert.ok(/^[\d.]/.test(t), `Ký hiệu lạ "${t}" trong ${src}`);
    return Number(t);
  }
  const v = expr();
  assert.equal(i, tokens.length, `Đọc không hết biểu thức: ${src}`);
  return v;
}

const range = (lo: number, hi: number) => Array.from({ length: hi - lo + 1 }, (_, i) => lo + i);

const close = (a: number, b: number, eps = 1e-9) => Math.abs(a - b) <= eps * Math.max(1, Math.abs(a), Math.abs(b));

/** Lựa chọn đúng có giá trị bằng `expected`, và KHÔNG nhiễu nào cũng bằng. */
function expectNumeric(d: MathItemDraft, expected: number, vars: Record<string, number> = {}, strip = (s: string) => s) {
  assert.equal(d.format, 'mcq');
  if (d.format !== 'mcq') return;
  d.choices.forEach((c, i) => {
    const v = evalMath(strip(c.display), vars);
    if (i === d.correctIndex) assert.ok(close(v, expected), `Đáp án "${c.display}" = ${v}, kỳ vọng ${expected}. Đề: ${d.stem}`);
    else assert.ok(!close(v, expected), `Nhiễu "${c.display}" cũng bằng ${expected}. Đề: ${d.stem}`);
  });
}

/** Như trên nhưng thử ở nhiều giá trị biến (biểu thức tương đương). */
function expectEquivalent(d: MathItemDraft, fn: (vars: Record<string, number>) => number, varNames: string[], strip = (s: string) => s) {
  assert.equal(d.format, 'mcq');
  if (d.format !== 'mcq') return;
  const samples = [0.37, 1.91, -2.23, 3.7].map((base, j) => Object.fromEntries(varNames.map((v, k) => [v, base + 0.61 * k + j * 0.013])));
  d.choices.forEach((c, i) => {
    const same = samples.every((vars) => close(evalMath(strip(c.display), vars), fn(vars), 1e-7));
    if (i === d.correctIndex) assert.ok(same, `Đáp án "${c.display}" không tương đương. Đề: ${d.stem}`);
    else assert.ok(!same, `Nhiễu "${c.display}" cũng tương đương. Đề: ${d.stem}`);
  });
}

type Table = { columns: string[]; rows: Array<{ label: string; cells: Array<string | number> }>; totalRow?: { label: string; cells: Array<string | number> } };

function table(d: MathItemDraft): Table {
  assert.ok(d.figure && d.figure.kind === 'data_table', 'Câu này phải có bảng.');
  return d.figure;
}

/** Bảng x | f(x) | g(x)… → mảng x và từng cột số. */
function fnCols(d: MathItemDraft): { xs: number[]; cols: number[][] } {
  const t = table(d);
  return { xs: t.rows.map((r) => Number(r.label)), cols: t.columns.slice(1).map((_, j) => t.rows.map((r) => Number(r.cells[j]))) };
}

const ROMAN_T = ['I', 'II', 'III'];
function romanOf(set: boolean[]): string {
  const on = ROMAN_T.filter((_, i) => set[i]);
  if (on.length === 0) return 'None';
  if (on.length === 1) return `${on[0]} only`;
  if (on.length === 2) return `${on[0]} and ${on[1]} only`;
  return 'I, II, and III';
}


// ----------------------------------------------------------------- verifier

type Verifier = (d: MathItemDraft) => void;

// ---- Chương 14

function levelCountT(ys: number[], k: number): number {
  // Đếm bằng cách quét dày đặc trên từng đoạn (độc lập với cách đếm của template).
  let c = 0;
  for (let i = 0; i < ys.length; i += 1) {
    if (ys[i] === k) c += 1;
    if (i + 1 < ys.length) {
      const a = ys[i]!;
      const b = ys[i + 1]!;
      if (Math.min(a, b) < k && k < Math.max(a, b)) c += 1;
    }
  }
  return c;
}

const V14: Record<string, Verifier> = {
  'pd-d-fn-table-formula': (d) => {
    const { xs, cols } = fnCols(d);
    const fits = (disp: string) => {
      const p = parsePoly(disp.replace(/^f\(x\) = /, ''));
      return xs.every((x, i) => polyAt(p, x) === cols[0]![i]);
    };
    if (d.format !== 'mcq') return;
    d.choices.forEach((c, i) => assert.equal(fits(c.display), i === d.correctIndex, `Lựa chọn ${c.display}. Bảng: ${JSON.stringify(cols)}`));
  },
  'pd-d-fn-intersection-count': (d) => {
    const m = match(d.stem, /f\(x\) = (.+) and g\(x\) = (.+)\. For how many/);
    const f = parsePoly(m[1]!);
    const g = parsePoly(m[2]!);
    const a = pc(f, 2) - pc(g, 2);
    const b = pc(f, 1) - pc(g, 1);
    const c = pc(f, 0) - pc(g, 0);
    const D = b * b - 4 * a * c;
    expect(d, D > 0 ? 2 : D === 0 ? 1 : 0, 'Số giao điểm');
  },
  'pd-d-fn-piecewise-equal': (d) => {
    const { xs, cols } = fnCols(d);
    const t = N(match(d.stem, /If f\(a\) = f\((-?\d+)\)/)[1]);
    const ft = cols[0]![xs.indexOf(t)]!;
    if (d.format !== 'mcq') return;
    d.choices.forEach((c, i) => {
      const a = N(c.display);
      assert.notEqual(a, t);
      const idx = xs.indexOf(a);
      assert.ok(idx >= 0, 'Lựa chọn phải là hoành độ trong bảng.');
      assert.equal(cols[0]![idx] === ft, i === d.correctIndex, `a = ${a}`);
    });
  },
  'pd-d-fn-level-count': (d) => {
    const { cols } = fnCols(d);
    const k = N(match(d.stem, /satisfy f\(x\) = (-?\d+)\?/)[1]);
    for (let i = 0; i + 1 < cols[0]!.length; i += 1) assert.notEqual(cols[0]![i], cols[0]![i + 1], 'Có đoạn nằm ngang.');
    expect(d, levelCountT(cols[0]!, k), 'Số nghiệm');
  },
  'pd-d-fn-level-count-grid': (d) => {
    const { xs, cols } = fnCols(d);
    assert.ok(d.stem.includes('satisfy f(x) = f(0)?'));
    for (let i = 0; i + 1 < cols[0]!.length; i += 1) assert.notEqual(cols[0]![i], cols[0]![i + 1], 'Có đoạn nằm ngang.');
    expect(d, levelCountT(cols[0]!, cols[0]![xs.indexOf(0)]!), 'Số nghiệm');
  },
  'pd-d-fn-even-check': (d) => {
    const c = N(match(d.stem, /f\(-(\d+)\) = f\(\d+\)/)[1]);
    if (d.format !== 'mcq') return;
    d.choices.forEach((ch, i) => {
      const p = parsePoly(ch.display.replace(/^f\(x\) = /, ''));
      assert.equal(polyAt(p, c) === polyAt(p, -c), i === d.correctIndex, ch.display);
    });
  },
  'pd-d-fn-inner-scale': (d) => {
    const m = match(d.stem, /f\(x\) = (.+)\. The function g is defined by g\(x\) = f\((\d)x\)(?: ([+-]) (\d+))?\. What is the value of g\((-?\d+)\)\?/);
    const f = parsePoly(m[1]!);
    const q = m[3] ? sgn(m[3]) * N(m[4]) : 0;
    expect(d, polyAt(f, N(m[2]) * N(m[5])) + q, 'g(k)');
  },
  'pd-d-fn-eval-rational': (d) => {
    const m = match(d.stem, /f\(x\) = frac\((.+),x\^2 \+ (\d+)\)\. What is the value of f\(-(\d+)\)\?/);
    const top = parsePoly(m[1]!);
    const x = -N(m[3]);
    expect(d, rat(polyAt(top, x), x * x + N(m[2])), 'f(-k)');
  },
  'pd-d-fn-table-ax2b': (d) => {
    const { xs, cols } = fnCols(d);
    const k = N(match(d.stem, /value of f\((\d+)\)\?/)[1]);
    const [x1, x2] = xs as [number, number];
    const [y1, y2] = cols[0] as [number, number];
    const a = rat(y2 - y1, x2 * x2 - x1 * x1);
    const b = subValue(rat(y1), mulValue(a, rat(x1 * x1)));
    expect(d, addValue(mulValue(a, rat(k * k)), b), 'f(k)');
  },
  'pd-d-fn-square-below': (d) => {
    const less = d.stem.includes('f(c) < c');
    if (d.format !== 'mcq') return;
    d.choices.forEach((c, i) => {
      const v = toDecimal(num(c.display));
      assert.equal(less ? v * v < v : v * v > v, i === d.correctIndex, c.display);
    });
  },
  'pd-d-fn-intercepts-formula': (d) => {
    const m = match(d.stem, /touches the x-axis at x = (-?\d+) without crossing it, crosses the x-axis at x = (-?\d+), .* \(0, (-?\d+)\)\./);
    const p = N(m[1]);
    const q = N(m[2]);
    const Y = N(m[3]);
    if (d.format !== 'mcq') return;
    d.choices.forEach((c, i) => {
      const f = (x: number) => evalMath(c.display.replace(/^f\(x\) = /, ''), { x });
      // Nghiệm kép tại p: f(p) = 0 và không đổi dấu quanh p; nghiệm đơn tại q: đổi dấu.
      const ok = close(f(p), 0) && Math.sign(f(p - 0.01)) === Math.sign(f(p + 0.01)) && close(f(q), 0) && Math.sign(f(q - 0.01)) !== Math.sign(f(q + 0.01)) && close(f(0), Y);
      assert.equal(ok, i === d.correctIndex, c.display);
    });
  },
  'pd-d-fn-compose-quad': (d) => {
    const m = match(d.stem, /f\(x\) = (.+) and g\(x\) = (.+)\. What is the value of f\(g\((-?\d+)\)\)\?/);
    const f = parsePoly(m[1]!);
    const g = parsePoly(m[2]!);
    expect(d, polyAt(f, polyAt(g, N(m[3]))), 'f(g(k))');
  },
  'pd-d-fn-table-scaled-solve': (d) => {
    const { xs, cols } = fnCols(d);
    const m = match(d.stem, /g\(x\) = (\d)f\(x\)\. If g\(k\) = (-?\d+)/);
    const hits = xs.filter((_, i) => N(m[1]) * cols[0]![i]! === N(m[2]));
    assert.equal(hits.length, 1);
    expect(d, hits[0]!, 'k');
  },
  'pd-d-fn-sqrt-diff': (d) => {
    const m = match(d.stem, /f\(x\) = sqrt\(x ([+-]) (\d+)\)\. If f\((-?\d+)\) - f\((-?\d+)\) = f\(t\)/);
    const a = sgn(m[1]) * N(m[2]);
    const diff = Math.sqrt(N(m[3]) + a) - Math.sqrt(N(m[4]) + a);
    const t = answerOf(d);
    assert.ok(close(Math.sqrt(toDecimal(t) + a), diff), 'f(t) phải bằng hiệu.');
  },
  'pd-d-fn-point-not-on': (d) => {
    const m = match(d.stem, /y = frac\((.+),(.+)\)\?$/);
    const top = parsePoly(m[1]!);
    const bot = parsePoly(m[2]!);
    if (d.format !== 'mcq') return;
    d.choices.forEach((c, i) => {
      const p = match(c.display, /^\((-?\d+), (.+)\)$/);
      const x = N(p[1]);
      const on = equalsValue(rat(polyAt(top, x), polyAt(bot, x)), num(p[2]!));
      assert.equal(on, i !== d.correctIndex, c.display);
    });
  },
  'pd-d-fn-sqrt-solve': (d) => {
    const m = match(d.stem, /[fgh]\(x\) = sqrt\((.+)\)\. If [fgh]\(a\) = (\d+)/);
    const inside = parsePoly(m[1]!);
    expect(d, rat(N(m[2]) ** 2 - pc(inside, 0), pc(inside, 1)), 'a');
  },
  'pd-d-fn-table-compose': (d) => {
    const { xs, cols } = fnCols(d);
    const k = N(match(d.stem, /f\(g\((-?\d+)\)\)/)[1]);
    const g = cols[1]![xs.indexOf(k)]!;
    expect(d, cols[0]![xs.indexOf(g)]!, 'f(g(k))');
  },
  'pd-d-fn-table-lookup-back': (d) => {
    const { xs, cols } = fnCols(d);
    const V = N(match(d.stem, /If g\(c\) = (-?\d+)/)[1]);
    const idx = cols[1]!.indexOf(V);
    assert.equal(cols[1]!.filter((v) => v === V).length, 1);
    void xs;
    expect(d, cols[0]![idx]!, 'f(c)');
  },
  'pd-d-fn-linear-fraction-solve': (d) => {
    const m = match(d.stem, /f\(x\) = (.+)\. If frac\(1,(\d)\)f\(a\) = (-?\d+)/);
    const f = parsePoly(m[1]!);
    expect(d, rat(N(m[2]) * N(m[3]) - pc(f, 0), pc(f, 1)), 'a');
  },
  'pd-d-fn-table-inner': (d) => {
    const { xs, cols } = fnCols(d);
    const m = match(d.stem, /g\(x\) = f\((.+)\)\. What is the value of g\((\d+)\)\?/);
    const inner = polyAt(parsePoly(m[1]!), N(m[2]));
    assert.ok(xs.includes(inner));
    expect(d, cols[0]![xs.indexOf(inner)]!, 'g(k)');
  },
  'pd-d-fn-linear-match': (d) => {
    const m = match(d.stem, /f\(x\) = (.+) and g\(x\) = (.+)\. The value of f\((-?\d+)\) is equal/);
    const f = parsePoly(m[1]!);
    const g = parsePoly(m[2]!);
    expect(d, rat(polyAt(f, N(m[3])) - pc(g, 0), pc(g, 1)), 't');
  },
  'pd-d-fn-parabola-distance': (d) => {
    const m = match(d.stem, /graph of y = (.+) has vertex V/);
    const f = (x: number) => evalMath(m[1]!, { x });
    // Tìm đỉnh và nghiệm bằng số: đỉnh là điểm đối xứng, nghiệm quét trên lưới.
    const xsScan = Array.from({ length: 4001 }, (_, i) => -20 + i * 0.01);
    const roots = xsScan.filter((x) => Math.abs(f(x)) < 1e-9);
    assert.equal(roots.length, 2, 'Phải có hai giao điểm nguyên với trục hoành.');
    const h = (roots[0]! + roots[1]!) / 2;
    expectNumeric(d, Math.hypot(roots[1]! - h, f(h)));
  },
  'pd-d-fn-line-shift-xint': (d) => {
    const m = match(d.stem, /points \(0, (\d+)\) and \((\d+), 0\).*g\(x\) = f\(x\) ([+-]) (\d+)\./);
    const b = N(m[1]);
    const a = N(m[2]);
    const k = sgn(m[3]) * N(m[4]);
    // g(x) = b - (b/a)x + k = 0
    expect(d, rat(a * (b + k), b), 'Hoành độ gốc');
  },
  'pd-d-fn-cubic-three': (d) => {
    const m = match(d.stem, /f\(x\) = x\^3(?: ([+-]) (\d+))? and g\(x\) = (\d*)x \+ k/);
    const c = m[1] ? sgn(m[1]) * N(m[2]) : 0;
    const s = m[3] ? N(m[3]) : 1;
    if (d.format !== 'mcq') return;
    d.choices.forEach((ch, i) => {
      const q = c - N(ch.display);
      // x³ − s·x + q: ba nghiệm thực phân biệt ⇔ 4s³ − 27q² > 0.
      assert.equal(4 * s ** 3 - 27 * q * q > 0, i === d.correctIndex, ch.display);
    });
  },
  'pd-d-fn-line-point-a': (d) => {
    const m = match(d.stem, /y = ax \+ (\d+), .* passes through the point \(-(\d*)a, (-?\d*)a\)/);
    const c = N(m[1]);
    const q = coef(m[2]);
    const p = coef(m[3]);
    const a = toDecimal(answerOf(d));
    assert.ok(a > 0);
    assert.ok(close(p * a, -q * a * a + c), 'Điểm không nằm trên đường.');
  },
};

// ---- Chương 15

const V15: Record<string, Verifier> = {
  'pd-d-quad-intercept-distance': (d) => {
    const p = parsePoly(match(d.stem, /graph of y = (.+) crosses/)[1]!);
    const [a, b, c] = [pc(p, 2), pc(p, 1), pc(p, 0)];
    const D = Math.sqrt(b * b - 4 * a * c);
    expect(d, Math.round(D / a), 'Hiệu hai nghiệm');
    assert.ok(close(D / a, Math.round(D / a)));
  },
  'pd-d-quad-irrational-roots': (d) => {
    const p = parsePoly(match(d.stem, /solutions to (.+) = 0\?/)[1]!);
    if (d.format !== 'mcq') return;
    d.choices.forEach((c, i) => {
      const [h, rad] = c.display.split(' ± ') as [string, string];
      const roots = [evalMath(`${h} + ${rad}`), evalMath(`${h} - ${rad}`)];
      const ok = roots.every((x) => close(polyAt(p, x), 0, 1e-9));
      assert.equal(ok, i === d.correctIndex, c.display);
    });
  },
  'pd-d-quad-fraction-root': (d) => {
    const m = match(d.stem, /^If (.+) = 0 and ([atkw]) < 1/);
    const p = parsePoly(m[1]!, m[2]!);
    const x = answerOf(d);
    assert.ok(toDecimal(x) < 1);
    // Thế ngược chính xác: a·(n/d)² + b·(n/d) + c = 0 ⇔ a n² + b n d + c d² = 0.
    assert.equal(pc(p, 2) * x.num ** 2 + pc(p, 1) * x.num * x.den + pc(p, 0) * x.den ** 2, 0);
  },
  'pd-d-quad-smaller-root-square': (d) => {
    const m = match(d.stem, /solutions to (.+) = (\d+) and a > b/);
    const p = parsePoly(m[1]!);
    const [a, b, c] = [pc(p, 2), pc(p, 1), pc(p, 0) - N(m[2])];
    const small = (-b - Math.sqrt(b * b - 4 * a * c)) / (2 * a);
    assert.ok(Number.isInteger(Math.round(small)) && close(small, Math.round(small)));
    expect(d, Math.round(small) ** 2, 'b²');
  },
  'pd-d-quad-sum-expanded': (d) => {
    const m = match(d.stem, /\((\d*)x ([+-]) (\d+)\)\^2 = (.+)\?$/);
    const p = coef(m[1]);
    const q = sgn(m[2]) * N(m[3]);
    const r = parsePoly(m[4]!);
    const A = p * p;
    const B = 2 * p * q - pc(r, 1);
    const C = q * q - pc(r, 0);
    assert.ok(B * B - 4 * A * C > 0, 'Phải có hai nghiệm thực.');
    expect(d, rat(-B, A), 'Tổng nghiệm');
  },
  'pd-d-quad-system-two-solutions': (d) => {
    const K = N(match(d.stem, /y = (-\d+) and y = x\^2 \+ cx/)[1]);
    if (d.format !== 'mcq') return;
    d.choices.forEach((ch, i) => {
      const c = N(ch.display);
      assert.equal(c * c + 4 * K > 0, i === d.correctIndex, ch.display);
    });
  },
  'pd-d-quad-line-meets-vertex': (d) => {
    const m = match(d.stem, /the line y = (-?\d+) intersects the graph of y = (.+) at two points/);
    const k = N(m[1]);
    const f = (x: number) => evalMath(m[2]!, { x });
    if (d.format !== 'mcq') return;
    d.choices.forEach((c, i) => {
      const p = match(c.display, /^\((-?\d+), (-?\d+)\) and \((-?\d+), (-?\d+)\)$/);
      const ok = N(p[2]) === k && N(p[4]) === k && close(f(N(p[1])), k) && close(f(N(p[3])), k) && N(p[1]) !== N(p[3]);
      assert.equal(ok, i === d.correctIndex, c.display);
    });
  },
  'pd-d-quad-vertex-root-equation': (d) => {
    const m = match(d.stem, /vertex at \((-?\d+), (-?\d+)\) and crosses the x-axis at x = (-?\d+)\./);
    const [h, k, r] = [N(m[1]), N(m[2]), N(m[3])];
    if (d.format !== 'mcq') return;
    d.choices.forEach((c, i) => {
      const f = (x: number) => evalMath(c.display.replace(/^y = /, ''), { x });
      const ok = close(f(h), k) && close(f(r), 0) && close(f(h - 1.3), f(h + 1.3));
      assert.equal(ok, i === d.correctIndex, c.display);
    });
  },
  'pd-d-quad-max-time': (d) => {
    const p = parsePoly(match(d.stem, /f\(t\) = (.+) models/)[1]!, 't');
    assert.ok(pc(p, 2) < 0);
    expect(d, rat(-pc(p, 1), 2 * pc(p, 2)), 'Đỉnh');
  },
  'pd-d-quad-break-even': (d) => {
    const p = parsePoly(match(d.stem, /P\(n\) = (.+)\. What is the least/)[1]!, 'n');
    const [b, c] = [pc(p, 1), pc(p, 0)];
    const root = (-b + Math.sqrt(b * b - 4 * c)) / 2;
    expect(d, Math.ceil(root - 1e-9), 'Nghiệm dương');
    assert.ok(polyAt(p, toDecimal(answerOf(d))) >= 0 && polyAt(p, toDecimal(answerOf(d)) - 1) < 0);
  },
  'pd-d-quad-one-solution-a': (d) => {
    const m = match(d.stem, /y = (-?\d+) and y = ax\^2(.*), a is a nonzero/);
    const rest = parsePoly(`0x^2${m[2]!.replace(/^ /, ' ')}`.replace('0x^2 ', '0x^2 '));
    const b = pc(rest, 1);
    const c = pc(rest, 0) - N(m[1]);
    expect(d, rat(b * b, 4 * c), 'a');
  },
  'pd-d-quad-form-shows-extreme': (d) => {
    if (d.format !== 'mcq') return;
    const fs = d.choices.map((c) => (x: number) => evalMath(c.display.replace(/^[fghp]\(x\) = /, ''), { x }));
    for (const x of [-2.3, 0.7, 4.1]) fs.forEach((f) => assert.ok(close(f(x), fs[0]!(x)), 'Bốn dạng phải tương đương.'));
    d.choices.forEach((c, i) => assert.equal(/^[fghp]\(x\) = -?\(x [+-] \d+\)\^2 [+-] \d+$/.test(c.display), i === d.correctIndex, c.display));
  },
  'pd-d-quad-factored-vertex-a': (d) => {
    const m = match(d.stem, /y = a(\(x [+-] \d+\)|x)\(x - k\), .* vertex at \((-?\d+), (-?\d+)\)/);
    const p = m[1] === 'x' ? 0 : rootOfDivisor(m[1]!.slice(1, -1));
    const h = N(m[2]);
    const v = N(m[3]);
    const k = 2 * h - p;
    expect(d, rat(v, (h - p) * (h - k)), 'a');
  },
  'pd-d-quad-line-parabola-shared': (d) => {
    const m = match(d.stem, /the line y = (-?\d*)x \+ b and the parabola y = x\^2 \+ bx(?: ([+-]) (\d+))?, .* at the point \((-?\d+), k\)/);
    const mm = coef(m[1]);
    const c = m[2] ? sgn(m[2]) * N(m[3]) : 0;
    const s = N(m[4]);
    // m s + b = s² + b s + c  ⇒  b(1 − s) = s² + c − m s
    const b = rat(s * s + c - mm * s, 1 - s);
    expect(d, addValue(rat(mm * s), b), 'k');
  },
};

// ---- Chương 16

/** Lựa chọn dạng "Q ± frac(R,D)" tương đương với frac(N, D)? */
function equivDiv(d: MathItemDraft, lhs: (x: number) => number) {
  if (d.format !== 'mcq') return;
  const xs = [0.37, 2.9, -3.3, 5.1];
  d.choices.forEach((c, i) => {
    const same = xs.every((x) => close(evalMath(c.display, { x }), lhs(x), 1e-7));
    assert.equal(same, i === d.correctIndex, c.display);
  });
}

const V16: Record<string, Verifier> = {
  'pd-d-div-linear-over-linear': (d) => {
    const m = match(d.stem, /equivalent to frac\((.+),(.+)\)\?$/);
    const top = parsePoly(m[1]!);
    const bot = parsePoly(m[2]!);
    equivDiv(d, (x) => polyAt(top, x) / polyAt(bot, x));
  },
  'pd-d-div-find-quotient': (d) => {
    const m = match(d.stem, /^If frac\((.+),(.+)\) = ([QA]) ([+-]) frac\((\d+),(.+)\), where [QA] is a polynomial/);
    const top = parsePoly(m[1]!);
    const bot = parsePoly(m[2]!);
    const R = sgn(m[4]) * N(m[5]);
    // Q = N/D − R/D phải là đa thức: kiểm lựa chọn nào khớp tại nhiều điểm.
    equivDiv(d, (x) => (polyAt(top, x) - R) / polyAt(bot, x));
  },
  'pd-d-div-remainder-fraction': (d) => {
    const m = match(d.stem, /expression (.+) can be written as A\((\d)x - 1\) \+ R/);
    const p = parsePoly(m[1]!);
    const q = N(m[2]);
    // R = p(1/q), tính chính xác bằng số hữu tỉ.
    const R = [...p].reduce((acc, [k, c]) => addValue(acc, rat(c, q ** k)), rat(0));
    expect(d, R, 'R');
  },
  'pd-d-div-table-remainder': (d) => {
    const { xs, cols } = fnCols(d);
    const k = rootOfDivisor(match(d.stem, /divided by (x [+-] \d+)\?$/)[1]!);
    expect(d, cols[0]![xs.indexOf(k)]!, 'g(k)');
  },
  'pd-d-div-factor-k-grid': (d) => {
    const m = match(d.stem, /p\(([xzt])\) = (\d*)[xzt]\^3 - k[xzt]\^2(.*), k is a constant\. If ([xzt] [+-] \d+) is a factor/);
    const v = m[1]!;
    const a = coef(m[2]);
    const rest = m[3]!.trim() === '' ? new Map<number, number>() : parsePoly(m[3]!.trim().replace(/^\+ /, '').replace(/^- /, '-'), v);
    const r = rootOfDivisor(m[4]!, v);
    const k = answerOf(d);
    // a r³ − k r² + rest(r) = 0
    assert.ok(equalsValue(subValue(rat(a * r ** 3 + polyAt(rest, r)), mulValue(k, rat(r * r))), rat(0)), d.stem);
  },
  'pd-d-div-identity-quotient': (d) => {
    const m = match(d.stem, /equation (.+) = A\((.+)\) \+ B, A is a polynomial/);
    const top = parsePoly(m[1]!);
    const bot = parsePoly(m[2]!);
    const d0 = pc(bot, 0);
    // B = p(−d); A = (p(x) − B)/(x + d)
    const B = polyAt(top, -d0);
    equivDiv(d, (x) => (polyAt(top, x) - B) / polyAt(bot, x));
  },
  'pd-d-div-identity-sum': (d) => {
    const m = match(d.stem, /equation (.+) = \(ax \+ b\)\((x [+-] \d+)\) \+ e is true/);
    const p = parsePoly(m[1]!);
    const r = rootOfDivisor(m[2]!);
    const e = polyAt(p, r);
    // (p(x) − e)/(x − r) = ax + b: a là hệ số đầu, b = −(p(0) − e)/r
    const a = pc(p, 2);
    const b = (e - pc(p, 0)) / r;
    expect(d, a + b + e, 'a + b + e');
  },
  'pd-d-div-root-to-factor': (d) => {
    const m = match(d.stem, /p\((-?\d+)\) = 0 and p\((-?\d+)\) = (\d+)\./);
    const r = N(m[1]);
    if (d.format !== 'mcq') return;
    d.choices.forEach((c, i) => assert.equal(rootOfDivisor(c.display) === r, i === d.correctIndex, c.display));
  },
  'pd-d-div-fraction-root-factor': (d) => {
    const root = toDecimal(num(match(d.stem, /[pqh]\((-?frac\(\d+,\d+\))\) = 0 and/)[1]!));
    if (d.format !== 'mcq') return;
    d.choices.forEach((c, i) => assert.equal(close(evalMath(c.display, { x: root }), 0), i === d.correctIndex, c.display));
  },
  'pd-d-div-roman-factors': (d) => {
    const m = match(d.stem, /p\(x\) = (.+)\. Which of the following are factors of p\(x\)\? I\. (.+); II\. (.+); III\. (.+)$/);
    const p = parsePoly(m[1]!);
    const truth = [m[2]!, m[3]!, m[4]!].map((f) => polyAt(p, rootOfDivisor(f)) === 0);
    assert.equal(correctDisplay(d), romanOf(truth));
  },
  'pd-d-div-which-divisible': (d) => {
    const r = rootOfDivisor(match(d.stem, /divisible by (x [+-] \d+)\?$/)[1]!);
    if (d.format !== 'mcq') return;
    d.choices.forEach((c, i) => assert.equal(polyAt(parsePoly(c.display), r) === 0, i === d.correctIndex, c.display));
  },
  'pd-d-div-two-factors-a': (d) => {
    const m = match(d.stem, /p\(x\) = ax\^4 \+ bx\^3(.*), a and b are constants/);
    const rest = parsePoly(m[1]!.trim().replace(/^\+ /, '').replace(/^- /, '-'));
    // p(1) = a + b + r(1) = 0, p(−1) = a − b + r(−1) = 0
    expect(d, rat(-(polyAt(rest, 1) + polyAt(rest, -1)), 2), 'a');
  },
};

// ---- Chương 17

type C2 = [number, number];
function parseCx(text: string): C2 {
  let re = 0;
  let im = 0;
  for (const term of text.trim().replace(/ - /g, ' + -').split(' + ')) {
    if (term.endsWith('i')) {
      const c = term.slice(0, -1);
      im += c === '' ? 1 : c === '-' ? -1 : Number(c);
    } else re += Number(term);
  }
  assert.ok(Number.isFinite(re) && Number.isFinite(im), `Không đọc được số phức "${text}"`);
  return [re, im];
}
const cMul = (a: C2, b: C2): C2 => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
const cAdd = (a: C2, b: C2): C2 => [a[0] + b[0], a[1] + b[1]];
const cScale = (k: number, a: C2): C2 => [k * a[0], k * a[1]];
function cPow(n: number): C2 {
  let r: C2 = [1, 0];
  for (let j = 0; j < n; j += 1) r = cMul(r, [0, 1]);
  return r;
}
function cDiv(a: C2, b: C2): C2 {
  const den = b[0] ** 2 + b[1] ** 2;
  const t = cMul(a, [b[0], -b[1]]);
  return [t[0] / den, t[1] / den];
}

function expectCx(d: MathItemDraft, expected: C2) {
  if (d.format !== 'mcq') return;
  d.choices.forEach((c, i) => {
    const v = parseCx(c.display);
    const same = close(v[0], expected[0]) && close(v[1], expected[1]);
    assert.equal(same, i === d.correctIndex, `Lựa chọn ${c.display}, kỳ vọng ${expected.join(' + ')}i. Đề: ${d.stem}`);
  });
}

const CX = String.raw`(-?\d*i?(?: [+-] \d*i)?)`;

const V17: Record<string, Verifier> = {
  'pd-d-cx-subtract': (d) => {
    const m = match(d.stem, new RegExp(String.raw`^Which of the following is equivalent to \(${CX}\) - \(${CX}\), where`));
    const a = parseCx(m[1]!);
    const b = parseCx(m[2]!);
    expectCx(d, [a[0] - b[0], a[1] - b[1]]);
  },
  'pd-d-cx-i-times': (d) => {
    const m = match(d.stem, new RegExp(String.raw`equivalent to (-?\d*)i\(${CX}\), where`));
    expectCx(d, cMul([0, coef(m[1])], parseCx(m[2]!)));
  },
  'pd-d-cx-power-sum': (d) => {
    const m = match(d.stem, /equivalent to (-?)(\d*)i\^(\d) ([+-]) (\d*)i\^(\d)(?: ([+-]) (\d+))?, where/);
    const a = (m[1] === '-' ? -1 : 1) * coef(m[2]);
    const b = sgn(m[4]) * coef(m[5]);
    const c = m[7] ? sgn(m[7]) * N(m[8]) : 0;
    expectCx(d, cAdd(cAdd(cScale(a, cPow(N(m[3]))), cScale(b, cPow(N(m[6])))), [c, 0]));
  },
  'pd-d-cx-product-real-part': (d) => {
    const m = match(d.stem, new RegExp(String.raw`^If \(${CX}\)\(${CX}\) = x \+ yi`));
    expect(d, cMul(parseCx(m[1]!), parseCx(m[2]!))[0], 'Phần thực');
  },
  'pd-d-cx-distribute-combine': (d) => {
    const m = match(d.stem, /equivalent to (\d+)\(i ([+-]) (\d+)\) - (\d+)\((-?\d+) - (\d*)i\), where/);
    const first = cScale(N(m[1]), [sgn(m[2]) * N(m[3]), 1]);
    const second = cScale(N(m[4]), [N(m[5]), -coef(m[6])]);
    expectCx(d, [first[0] - second[0], first[1] - second[1]]);
  },
  'pd-d-cx-i-distribute-diff': (d) => {
    const m = match(d.stem, /equivalent to (\d+)i\(i \+ (\d+)\) - (\d*)i\(i - (\d+)\), where/);
    const A = cMul([0, N(m[1])], [N(m[2]), 1]);
    const B = cMul([0, coef(m[3])], [-N(m[4]), 1]);
    expectCx(d, [A[0] - B[0], A[1] - B[1]]);
  },
  'pd-d-cx-big-power': (d) => {
    const m = match(d.stem, /equivalent to (-?\d*)i\^(\d+), where/);
    expectCx(d, cScale(coef(m[1]), cPow(N(m[2]) % 4)));
    assert.ok(N(m[2]) > 20);
  },
  'pd-d-cx-square': (d) => {
    const m = match(d.stem, new RegExp(String.raw`equivalent to \(${CX}\)\^2, where`));
    const z = parseCx(m[1]!);
    expectCx(d, cMul(z, z));
  },
  'pd-d-cx-reciprocal-powers': (d) => {
    const body = match(d.stem, /equivalent to (.+), where/)[1]!;
    let total: C2 = [0, 0];
    for (const t of body.replace(/ - /g, ' + -').split(' + ')) {
      const m = match(t, /^(-?)frac\((\d+),i(?:\^(\d))?\)$/);
      const k = (m[1] === '-' ? -1 : 1) * N(m[2]);
      total = cAdd(total, cScale(k, cDiv([1, 0], cPow(m[3] ? N(m[3]) : 1))));
    }
    expectCx(d, total);
  },
  'pd-d-cx-divide-pure': (d) => {
    const m = match(d.stem, new RegExp(String.raw`equivalent to frac\(${CX},${CX}\), where`));
    expectCx(d, cDiv(parseCx(m[1]!), parseCx(m[2]!)));
  },
};

// ---- Chương 18

/** "|x - 3| + 2", "-2|x + 1| - 4", "|x|" → hàm số. */
function absFn(text: string): (x: number) => number {
  const m = match(text.trim(), /^(-?\d*)\|x(?: ([+-]) (\d+))?\|(?: ([+-]) (\d+))?$/);
  const a = coef(m[1]);
  const inner = m[2] ? sgn(m[2]) * N(m[3]) : 0;
  const k = m[4] ? sgn(m[4]) * N(m[5]) : 0;
  return (x: number) => a * Math.abs(x + inner) + k;
}

/** Kiểm "với MỌI a thoả |a| < 1" bằng quét dày (độc lập với bảng của template). */
const ABS_CHECK: Record<string, (a: number) => boolean> = {
  'a^2 < 1': (a) => a * a < 1,
  '-1 < a < 1': (a) => -1 < a && a < 1,
  'a + 1 > 0': (a) => a + 1 > 0,
  '1 - a > 0': (a) => 1 - a > 0,
  'a^3 < 1': (a) => a ** 3 < 1,
  'a > 0': (a) => a > 0,
  'a^2 < a': (a) => a * a < a,
  'a < 0': (a) => a < 0,
  'a^2 > a': (a) => a * a > a,
  'a^3 > a': (a) => a ** 3 > a,
  '2a < 1': (a) => 2 * a < 1,
};

const V18: Record<string, Verifier> = {
  'pd-d-abs-of-quadratic': (d) => {
    const m = match(d.stem, /f\(x\) = (.+)\. What is the value of \|f\((\d+)\)\|\?/);
    const v = polyAt(parsePoly(m[1]!), N(m[2]));
    assert.ok(v < 0, 'f(k) phải âm để bẫy có nghĩa.');
    expect(d, Math.abs(v), '|f(k)|');
  },
  'pd-d-abs-can-equal-negative': (d) => {
    const target = -N(match(d.stem, /equal to -(\d+)\?$/)[1]);
    if (d.format !== 'mcq') return;
    d.choices.forEach((c, i) => {
      const f = absFn(c.display);
      // Giá trị nhỏ nhất đạt tại đỉnh; liên tục nên đạt mọi giá trị từ đó trở lên.
      const minV = Math.min(...Array.from({ length: 4001 }, (_, j) => f(-20 + j * 0.01)));
      assert.equal(minV <= target + 1e-9, i === d.correctIndex, c.display);
    });
  },
  'pd-d-abs-v-graph': (d) => {
    const m = match(d.stem, /(opens upward|opens downward), with its vertex at \((-?\d+), (-?\d+)\)\. The graph passes through the point \((-?\d+), (-?\d+)\)\./);
    const up = m[1] === 'opens upward';
    const [h, k, px, py] = [N(m[2]), N(m[3]), N(m[4]), N(m[5])];
    if (d.format !== 'mcq') return;
    d.choices.forEach((c, i) => {
      const f = absFn(c.display.replace(/^f\(x\) = /, ''));
      const ok = close(f(h), k) && close(f(px), py) && (up ? f(h + 1) > k && f(h - 1) > k : f(h + 1) < k && f(h - 1) < k);
      assert.equal(ok, i === d.correctIndex, c.display);
    });
  },
  'pd-d-abs-could-be': (d) => {
    const m = match(d.stem, /\|x ([+-]) (\d+)\| > (\d+)/);
    const a = sgn(m[1]) * N(m[2]);
    const b = N(m[3]);
    if (d.format !== 'mcq') return;
    d.choices.forEach((c, i) => {
      const v = N(c.display);
      const ok = Math.abs(v + a) > b || Math.abs(-v + a) > b;
      assert.equal(ok, i === d.correctIndex, c.display);
    });
  },
  'pd-d-abs-count-integers': (d) => {
    const m = match(d.stem, /\|x ([+-]) (\d+)\| (<|<=) (\d+)\?$/);
    const a = sgn(m[1]) * N(m[2]);
    const b = N(m[4]);
    let count = 0;
    for (let x = -100; x <= 100; x += 1) if (m[3] === '<' ? Math.abs(x + a) < b : Math.abs(x + a) <= b) count += 1;
    expect(d, count, 'Số nghiệm nguyên');
  },
  'pd-d-abs-reflect-values': (d) => {
    const { cols } = fnCols(d);
    assert.equal(correctDisplay(d), cols[0]!.map((y) => Math.abs(y)).join(', '));
  },
  'pd-d-abs-express': (d) => {
    const m = match(d.stem, /\|([xynt]) - (\d+)\| = ([bkc]), where [xynt] < \d+, what is (.+) in terms of [bkc]\?/);
    const [xv, a, bv, ask] = [m[1]!, N(m[2]), m[3]!, m[4]!];
    const f = (vars: Record<string, number>) => evalMath(ask, { [xv]: a - vars[bv]!, [bv]: vars[bv]! });
    expectEquivalent(d, f, [bv]);
  },
  'pd-d-abs-tolerance-fraction': (d) => tolVerify(d),
  'pd-d-abs-tolerance-int': (d) => tolVerify(d),
  'pd-d-abs-product-extreme': (d) => {
    const m = match(d.stem, /^If \|(.+)\| = (\d+) and \|(.+)\| = (\d+), what is the (least|greatest) possible value of xy\?$/);
    const sols = (lin: Map<number, number>, r: number) => [(r - pc(lin, 0)) / pc(lin, 1), (-r - pc(lin, 0)) / pc(lin, 1)];
    const xs = sols(parsePoly(m[1]!), N(m[2]));
    const ys = sols(parsePoly(m[3]!, 'y'), N(m[4]));
    const prods = xs.flatMap((x) => ys.map((y) => x * y));
    expect(d, m[5] === 'least' ? Math.min(...prods) : Math.max(...prods), 'Cực trị của xy');
  },
  'pd-d-abs-roman-must': (d) => {
    const m = match(d.stem, /I\. (.+); II\. (.+); III\. (.+)$/);
    const grid = Array.from({ length: 1999 }, (_, j) => -0.999 + j * 0.001);
    const truth = [m[1]!, m[2]!, m[3]!].map((t) => {
      const f = ABS_CHECK[t];
      assert.ok(f, `Chưa có mệnh đề "${t}" trong bảng kiểm.`);
      return grid.every(f);
    });
    assert.equal(correctDisplay(d), romanOf(truth));
  },
};

function tolVerify(d: MathItemDraft) {
  const m = match(d.stem, /are from (.+) to (.+), inclusive\. If ([LwTt]) represents/);
  const lo = toDecimal(num(m[1]!));
  const hi = toDecimal(num(m[2]!));
  const v = m[3]!;
  // Lựa chọn đúng: đúng với mọi giá trị trong [lo, hi] và sai ngay bên ngoài.
  const test = (ineq: string, x: number) => {
    const p = match(ineq, new RegExp(String.raw`^\|${v} ([+-]) (.+)\| (<=|>=) (.+)$`));
    const c = toDecimal(num(p[2]!));
    const r = toDecimal(num(p[4]!));
    const val = Math.abs(x + (p[1] === '-' ? -c : c));
    return p[3] === '<=' ? val <= r + 1e-12 : val >= r - 1e-12;
  };
  if (d.format !== 'mcq') return;
  const eps = (hi - lo) / 1000;
  const inside = [lo, hi, (lo + hi) / 2, lo + (hi - lo) / 3];
  const outside = [lo - eps, hi + eps, lo - 5, hi + 5];
  d.choices.forEach((c, i) => {
    const ok = inside.every((x) => test(c.display, x)) && outside.every((x) => !test(c.display, x));
    assert.equal(ok, i === d.correctIndex, c.display);
  });
}

// ---- Chương 19

/** "above line k and to the left of line t" → nhóm góc (0: trên-trái/dưới-phải, 1: còn lại). */
function cornerGroup(text: string): number {
  const m = match(text, /^(above|below) line \w and to the (left|right) of line \w$/);
  return (m[1] === 'above') === (m[2] === 'left') ? 0 : 1;
}

const DEG = (s: string | undefined) => N(s);

const V19: Record<string, Verifier> = {
  'pd-d-ang-exterior-find-interior': (d) => {
    const m = match(d.stem, /The measure of angle \w{3} is (\d+)deg, and the measure of angle \w is (\d+)deg\. What is the measure of angle \w\?/);
    expect(d, DEG(m[1]) - DEG(m[2]), 'Góc trong');
  },
  'pd-d-ang-cevian': (d) => {
    const m = match(d.stem, /angle ABD is (\d+)deg, the measure of angle BAD is (\d+)deg, and the measure of angle ACB is (\d+)deg/);
    const [q, p, r] = [DEG(m[1]), DEG(m[2]), DEG(m[3])];
    // Tam giác ABC: BAC = 180 − q − r; DAC = BAC − BAD.
    expect(d, 180 - q - r - p, 'DAC');
    assert.ok(180 - q - r - p > 0);
  },
  'pd-d-ang-two-transversals-sum': (d) => {
    const m = match(d.stem, /If a = (\d+)deg and c = (\d+)deg/);
    expect(d, 180 - DEG(m[1]) + (180 - DEG(m[2])), 'b + d');
  },
  'pd-d-ang-triangle-xy': (d) => {
    const m = match(d.stem, /xdeg, ydeg, and \(x \+ y(?: ([+-]) (\d+))?\)deg\. If x = (\d+)/);
    const e = m[1] ? sgn(m[1]) * N(m[2]) : 0;
    const x = N(m[3]);
    const y = toDecimal(answerOf(d));
    assert.equal(x + y + x + y + e, 180);
    assert.ok(y > 0);
  },
  'pd-d-ang-zigzag': (d) => {
    const m = match(d.stem, /angle of (\d+)deg with line j, and segment PB makes an angle of (\d+)deg/);
    expect(d, DEG(m[1]) + DEG(m[2]), 'APB');
  },
  'pd-d-ang-cut-triangle': (d) => {
    const m = match(d.stem, /measure of angle A is (\d+)deg and the measure of angle ADE is (\d+)deg/);
    const A = DEG(m[1]);
    const ade = DEG(m[2]);
    const aed = 180 - A - ade;
    assert.ok(aed > 0);
    expect(d, 180 - ade + (180 - aed), 'BDE + CED');
  },
  'pd-d-ang-three-lines': (d) => {
    const m = match(d.stem, /measure (\d+)deg and (\d+)deg\./);
    expect(d, 180 - DEG(m[1]) - DEG(m[2]), 'x');
  },
  'pd-d-ang-bowtie': (d) => {
    const m = match(d.stem, /angle A is (\d+)deg and the measure of angle B is (\d+)deg\. In triangle DEC, the measure of angle D is (\d+)deg/);
    const C = 180 - DEG(m[1]) - DEG(m[2]);
    const E = 180 - C - DEG(m[3]);
    assert.ok(E > 0);
    expect(d, E, 'E');
  },
  'pd-d-ang-linear-pair': (d) => {
    const m = match(d.stem, /measures are \((.+)\)deg and \((.+)\)deg\./);
    const p1 = parsePoly(m[1]!);
    const p2 = parsePoly(m[2]!);
    const x = rat(180 - pc(p1, 0) - pc(p2, 0), pc(p1, 1) + pc(p2, 1));
    expect(d, x, 'x');
    assert.ok(polyAt(p1, toDecimal(x)) > 0 && polyAt(p2, toDecimal(x)) > 0, 'Hai góc phải dương.');
  },
  'pd-d-ang-exterior-pair': (d) => {
    const m = match(d.stem, /exterior angles measure (\d+)deg and (\d+)deg/);
    expect(d, 180 - (180 - DEG(m[1])) - (180 - DEG(m[2])), 'Góc trong thứ ba');
  },
  'pd-d-ang-polygon-sum-two': (d) => {
    const SIDES: Record<string, number> = { triangle: 3, rectangle: 4, square: 4, pentagon: 5, hexagon: 6, heptagon: 7, octagon: 8 };
    const m = match(d.stem, /^A (\w+) and a (\w+) overlap.* total measure of (\d+)deg\./);
    const total = 180 * (SIDES[m[1]!]! - 2) + 180 * (SIDES[m[2]!]! - 2);
    expect(d, total - DEG(m[3]), 'Góc còn lại');
  },
  'pd-d-ang-regular-perp': (d) => {
    const m = match(d.stem, /regular polygon with (\d+) sides.*between this ray and (the extension of side|side)/);
    const n = N(m[1]);
    const interior = (180 * (n - 2)) / n;
    const toSide = interior - 90;
    expect(d, m[2] === 'side' ? toSide : 180 - toSide, 'Góc');
  },
  'pd-d-ang-parallel-roman': (d) => {
    const spots = [...d.stem.matchAll(/angle ([abcd]) is ((?:above|below) line \w and to the (?:left|right) of line t)/g)];
    const group: Record<string, number> = {};
    for (const s of spots) group[s[1]!] = cornerGroup(s[2]!);
    const m = match(d.stem, /I\. (.+); II\. (.+); III\. (.+)$/);
    const truth = [m[1]!, m[2]!, m[3]!].map((t) => {
      const eq = t.match(/^([abcd]) = ([abcd])$/);
      if (eq) return group[eq[1]!] === group[eq[2]!];
      const sup = match(t, /^([abcd]) \+ ([abcd]) = 180$/);
      return group[sup[1]!] !== group[sup[2]!];
    });
    assert.equal(correctDisplay(d), romanOf(truth));
  },
  'pd-d-ang-dart': (d) => {
    const m = match(d.stem, /angle BAC is (\d+)deg and the measure of angle BDC is (\d+)deg/);
    expect(d, 180 - DEG(m[1]) - (180 - DEG(m[2])), 'ABD + ACD');
  },
  'pd-d-ang-three-parallel': (d) => {
    const m = match(
      d.stem,
      /The angle ((?:above|below) line \w and to the (?:left|right) of line t) measures (\d+)deg, and the angle ((?:above|below) line \w and to the (?:left|right) of line s) measures (\d+)deg\. Angle a is ((?:above|below) line k and to the (?:left|right) of line t), and angle b is ((?:above|below) line k and to the (?:left|right) of line s)\./,
    );
    const same = (g: string, a: string) => cornerGroup(g) === cornerGroup(a);
    const a = same(m[1]!, m[5]!) ? DEG(m[2]) : 180 - DEG(m[2]);
    const b = same(m[3]!, m[6]!) ? DEG(m[4]) : 180 - DEG(m[4]);
    expect(d, a + b, 'a + b');
  },
};

// ---- Chương 20

const V20: Record<string, Verifier> = {
  'pd-d-tri-pyth-setup': (d) => {
    const m = match(d.stem, /side lengths of a right triangle are (.+), (.+), and (.+)\. Which/);
    const v = match(m[1]!, /([xns])/)[1]!;
    const sides = [m[1]!, m[2]!, m[3]!];
    const at = (e: string, x: number) => evalMath(e, { [v]: x });
    if (d.format !== 'mcq') return;
    d.choices.forEach((c, i) => {
      const eq = c.display.match(/^(.+)\^2 \+ (.+)\^2 = (.+)\^2$/);
      let ok = false;
      if (eq) {
        const parts = [eq[1]!, eq[2]!, eq[3]!].map((p) => p.replace(/^\((.*)\)$/, '$1'));
        const sameSet = [...parts].sort().join('|') === [...sides].sort().join('|');
        const big = 100;
        ok = sameSet && at(parts[2]!, big) > at(parts[0]!, big) && at(parts[2]!, big) > at(parts[1]!, big);
      }
      assert.equal(ok, i === d.correctIndex, c.display);
    });
  },
  'pd-d-tri-equilateral-parts': (d) => {
    const m = match(d.stem, /side length (\d+)\..*What is the length of (\w)(\w)\?/);
    const s = N(m[1]);
    const foot = m[2] === 'D';
    expectNumeric(d, foot ? s / 2 : (s / 2) * Math.sqrt(3));
  },
  'pd-d-tri-square-diagonal': (d) => {
    const m = match(d.stem, /square has (a side length|a perimeter|an area) of (\d+)\./);
    const v = N(m[2]);
    const s = m[1] === 'a side length' ? v : m[1] === 'a perimeter' ? v / 4 : Math.sqrt(v);
    expectNumeric(d, s * Math.SQRT2);
  },
  'pd-d-tri-bowtie-similar': (d) => {
    const m = match(d.stem, /AE = (\d+), ED = (\d+), and CD = (\d+)/);
    expect(d, rat(N(m[1]) * N(m[3]), N(m[2])), 'AB');
  },
  'pd-d-tri-third-side-extreme': (d) => {
    const m = match(d.stem, /lengths (\d+) and (\d+)\..*the (greatest|least) possible length/);
    const [p, q] = [N(m[1]), N(m[2])];
    const ok = range(1, 200).filter((c) => c + p > q && c + q > p && p + q > c);
    expect(d, m[3] === 'greatest' ? Math.max(...ok) : Math.min(...ok), 'Cạnh thứ ba');
  },
  'pd-d-tri-isosceles-perimeter': (d) => {
    const m = match(d.stem, /one side of length (\d+) and another side of length (\d+)\. What is the (greatest|least)/);
    const [p, q] = [N(m[1]), N(m[2])];
    const valid = (a: number, b: number, c: number) => a + b > c && a + c > b && b + c > a;
    const pers = [valid(p, p, q) ? 2 * p + q : null, valid(p, q, q) ? p + 2 * q : null].filter((x): x is number => x !== null);
    expect(d, m[3] === 'greatest' ? Math.max(...pers) : Math.min(...pers), 'Chu vi');
  },
  'pd-d-tri-roman-valid': (d) => {
    const m = match(d.stem, /I\. (.+); II\. (.+); III\. (.+)$/);
    const truth = [m[1]!, m[2]!, m[3]!].map((t) => {
      const [a, b, c] = t.split(', ').map(Number).sort((x, y) => x - y) as [number, number, number];
      return a + b > c;
    });
    assert.equal(correctDisplay(d), romanOf(truth));
  },
  'pd-d-tri-isosceles-area': (d) => {
    const m = match(d.stem, /= (\d+) and \w\w = (\d+)\. What is the area/);
    const s = N(m[1]);
    const half = N(m[2]) / 2;
    expect(d, rat(Math.round(half * Math.sqrt(s * s - half * half))), 'Diện tích');
    assert.ok(close(half * Math.sqrt(s * s - half * half), toDecimal(answerOf(d))));
  },
  'pd-d-tri-square-equilateral': (d) => {
    const m = match(d.stem, /has (an area|a perimeter) of (\d+)\./);
    const s = m[1] === 'an area' ? Math.sqrt(N(m[2])) : N(m[2]) / 4;
    expectNumeric(d, (Math.sqrt(3) / 4) * s * s);
  },
  'pd-d-tri-cone-slice': (d) => {
    const m = match(d.stem, /small cone has height (\d+) and base radius (\d+)\. The base of the original cone has radius (\d+)\./);
    const [h1, r1, r2] = [N(m[1]), N(m[2]), N(m[3])];
    expect(d, rat(h1 * r2 - h1 * r1, r1), 'Chiều cao phần dưới');
  },
  'pd-d-tri-integer-perimeter-max': (d) => {
    const m = match(d.stem, /perimeter of the triangle is (\d+), what is the (greatest|least) possible value of z\?/);
    const P = N(m[1]);
    const zs: number[] = [];
    for (let x = 1; x <= P; x += 1) for (let y = x; x + y <= P; y += 1) {
      const z = P - x - y;
      if (z >= y && x + y > z) zs.push(z);
    }
    expect(d, m[2] === 'greatest' ? Math.max(...zs) : Math.min(...zs), 'z');
  },
  'pd-d-tri-nested-parallel': (d) => {
    const m = match(d.stem, /DE = (\d+), FG = (\d+), BC = (\d+), and FB = (\d+)/);
    const [p, q, r, f] = [N(m[1]), N(m[2]), N(m[3]), N(m[4])];
    // AB = t, AF = t q / r, FB = t (r − q)/r
    const AB = rat(f * r, r - q);
    expect(d, mulValue(AB, rat(p, r)), 'AD');
  },
  'pd-d-tri-deg-to-rad': (d) => {
    const D = N(match(d.stem, /angle of (\d+)deg\?/)[1]);
    expectNumeric(d, (D * Math.PI) / 180);
  },
  'pd-d-tri-similar-perimeter': (d) => {
    const m = match(d.stem, /side lengths (\d+), (\d+), and (\d+)\. A similar triangle has its longest side of length (.+)\. What/);
    const sides = [N(m[1]), N(m[2]), N(m[3])];
    const k = divValue(num(m[4]!), rat(Math.max(...sides)));
    expect(d, mulValue(k, rat(sides[0]! + sides[1]! + sides[2]!)), 'Chu vi');
  },
  'pd-d-tri-count-third-sides': (d) => {
    const m = match(d.stem, /lengths (\d+) and (\d+)\. How many/);
    const [p, q] = [N(m[1]), N(m[2])];
    expect(d, range(1, 200).filter((c) => c + p > q && c + q > p && p + q > c).length, 'Số cạnh');
  },
  'pd-d-tri-right-parallel-inside': (d) => {
    const m = match(d.stem, /AC = (\d+), and AB = (\d+)\..*If CD = (\d+)/);
    const [AC, AB, CD] = [N(m[1]), N(m[2]), N(m[3])];
    const BC = Math.sqrt(AB * AB - AC * AC);
    assert.ok(Number.isInteger(BC));
    expect(d, rat(CD * BC, AC), 'CE');
  },
  'pd-d-tri-isosceles-angle-bound': (d) => {
    const m = match(d.stem, /side \w\w is (shorter|longer) than each of the other two sides\. The measure of angle \w, in degrees, is a multiple of (\d+)\. What is the (least|greatest) possible/);
    const mm = N(m[2]);
    const As = range(1, 179).filter((a) => a % mm === 0 && (m[1] === 'shorter' ? a < 60 : a > 60));
    const Bs = As.map((a) => (180 - a) / 2);
    const target = m[3] === 'least' ? Math.min(...Bs) : Math.max(...Bs);
    expect(d, rat(target * 2, 2), 'B');
  },
  'pd-d-tri-poles-rope': (d) => {
    const m = match(d.stem, /ground (\d+) meters apart\. One pole is (\d+) meters tall and the other is (\d+) meters tall/);
    expectNumeric(d, Math.hypot(N(m[1]), N(m[3]) - N(m[2])));
  },
  'pd-d-tri-right-trapezoid': (d) => {
    const m = match(d.stem, /longer base has length (\d+), its height is (\d+), and its slanted side has length (\d+)/);
    const [B, h, s] = [N(m[1]), N(m[2]), N(m[3])];
    const o = Math.sqrt(s * s - h * h);
    expect(d, Math.round(B + (B - o) + h + s), 'Chu vi');
  },
  'pd-d-tri-legs-hyp-plus': (d) => {
    const m = match(d.stem, /legs of lengths (\d+) and [xyn] and a hypotenuse of length [xyn] \+ (\d+)/);
    const [a, dd] = [N(m[1]), N(m[2])];
    const x = toDecimal(answerOf(d));
    assert.ok(close(a * a + x * x, (x + dd) ** 2));
  },
  'pd-d-tri-square-corner-cut': (d) => {
    const m = match(d.stem, /side length (\d+)\. .* AP = AQ = (\d+), .* What is the (perimeter|area)/);
    const [s, c] = [N(m[1]), N(m[2])];
    // Toạ độ: P(c,0), R(s,s−c), T(s−c,s), Q(0,c)
    const P = [c, 0];
    const Rr = [s, s - c];
    const Q = [0, c];
    const PR = Math.hypot(Rr[0]! - P[0]!, Rr[1]! - P[1]!);
    const PQ = Math.hypot(Q[0]! - P[0]!, Q[1]! - P[1]!);
    expectNumeric(d, m[3] === 'perimeter' ? 2 * (PR + PQ) : PR * PQ);
  },
  'pd-d-tri-coord-angle-rad': (d) => {
    const m = match(d.stem, /point A is at \((.+), 0\), and point B is at \((.+), (.+)\)\. What is the measure, in radians, of angle (AOB|OBA)\?/);
    const bx = evalMath(m[2]!);
    const by = evalMath(m[3]!);
    assert.ok(close(evalMath(m[1]!), bx));
    const aob = Math.atan2(by, bx);
    expectNumeric(d, m[4] === 'AOB' ? aob : Math.PI / 2 - aob);
  },
  'pd-d-tri-parallel-intercepts': (d) => {
    const m = match(d.stem, /A\(0, (\d+)\) and B\(b, 0\), where b > 0, and AB = (\d+)\. Line q is parallel to line p and passes through \(0, (\d+)\)/);
    const [OA, AB, c] = [N(m[1]), N(m[2]), N(m[3])];
    const OB = Math.sqrt(AB * AB - OA * OA);
    expect(d, rat(Math.round(c * OB), OA), 'n');
    assert.ok(close((c * OB) / OA, toDecimal(answerOf(d))));
  },
  'pd-d-tri-inscribed-central': (d) => {
    const m = match(d.stem, /^Regular polygon (\w+) has (\d+) sides .* angle (\w)O(\w)\?$/);
    const n = N(m[2]);
    assert.equal(m[1]!.length, n);
    const gap = Math.abs(m[1]!.indexOf(m[3]!) - m[1]!.indexOf(m[4]!));
    const k = Math.min(gap, n - gap);
    expectNumeric(d, (2 * Math.PI * k) / n);
  },
  'pd-d-tri-chain-special': (d) => {
    const m = match(d.stem, /AC = BC = (\d+)\..*angle ADB is (30|60)deg\. What is the length of (DB|AD)\?/);
    const AB = N(m[1]) * Math.SQRT2;
    const D = (N(m[2]) * Math.PI) / 180;
    // Góc B vuông, góc D biết: tan(D) = AB / DB, sin(D) = AB / AD.
    expectNumeric(d, m[3] === 'DB' ? AB / Math.tan(D) : AB / Math.sin(D));
  },
  'pd-d-tri-circle-in-square': (d) => {
    const m = match(d.stem, /diagonal of length (\d+)\. A circle is (inscribed|circumscribed)/);
    const diag = N(m[1]);
    const r = m[2] === 'inscribed' ? diag / Math.SQRT2 / 2 : diag / 2;
    expectNumeric(d, Math.PI * r * r);
  },
  'pd-d-tri-roman-perimeters': (d) => {
    const m = match(d.stem, /lengths (\d+) and (\d+)\. .* I\. (\d+); II\. (\d+); III\. (\d+)$/);
    const [p, q] = [N(m[1]), N(m[2])];
    const truth = [N(m[3]), N(m[4]), N(m[5])].map((P) => {
      const c = P - p - q;
      return c > q - p && c < p + q && c > 0;
    });
    assert.equal(correctDisplay(d), romanOf(truth));
  },
  'pd-d-tri-inscribed-equilateral': (d) => {
    const m = match(d.stem, /side length (\d+)\..*What is the (area of triangle DEF|length of ED)\?/);
    const s = N(m[1]);
    // Toạ độ: A(0,0), C(s,0), B(s/2, s√3/2). D trên AC với AD = s/3, E trên AB với AE = 2s/3.
    const D = [s / 3, 0];
    const E = [(2 * s) / 3 / 2, ((2 * s) / 3) * (Math.sqrt(3) / 2)];
    assert.ok(close(E[0]!, D[0]!), 'ED phải vuông góc với AC.');
    const ED = Math.hypot(E[0]! - D[0]!, E[1]! - D[1]!);
    expectNumeric(d, m[2] === 'length of ED' ? ED : (Math.sqrt(3) / 4) * ED * ED);
  },
  'pd-d-tri-two-triangles-diff': (d) => {
    const m = match(d.stem, /side lengths (\d+), (\d+), and a\./);
    const [p, q] = [N(m[1]), N(m[2])];
    const width = p + q - Math.abs(q - p);
    if (d.format !== 'mcq') return;
    d.choices.forEach((c, i) => assert.equal(N(c.display) >= width, i === d.correctIndex, c.display));
  },
  'pd-d-tri-square-equilateral-angle': (d) => {
    const m = match(d.stem, /^Square (\w)(\w)(\w)(\w) and equilateral triangle \w\w(\w) share side \w\w, and point \w lies (inside|outside) the square\. What is the measure, in degrees, of angle (\w{3})\?/);
    const [A, B, C, D, E] = [m[1]!, m[2]!, m[3]!, m[4]!, m[5]!];
    const inside = m[6] === 'inside';
    // Toạ độ: A(0,0), B(1,0), C(1,1), D(0,1); E phía trong: (0.5, √3/2), phía ngoài: (0.5, −√3/2).
    const P: Record<string, [number, number]> = { [A]: [0, 0], [B]: [1, 0], [C]: [1, 1], [D]: [0, 1], [E]: [0.5, inside ? Math.sqrt(3) / 2 : -Math.sqrt(3) / 2] };
    const [X, Y, Z] = m[7]!.split('') as [string, string, string];
    const v1 = [P[X]![0] - P[Y]![0], P[X]![1] - P[Y]![1]];
    const v2 = [P[Z]![0] - P[Y]![0], P[Z]![1] - P[Y]![1]];
    const ang = (Math.acos((v1[0]! * v2[0]! + v1[1]! * v2[1]!) / (Math.hypot(v1[0]!, v1[1]!) * Math.hypot(v2[0]!, v2[1]!))) * 180) / Math.PI;
    expect(d, Math.round(ang), 'Góc');
    assert.ok(close(ang, Math.round(ang), 1e-6));
  },
  'pd-d-tri-semicircle-square': (d) => {
    const m = match(d.stem, /^Square (\w)(\w)(\w)(\w) has side length (\d+),.*distance from X to (\w)\?/);
    const s = N(m[5]);
    // A(0,s), B(s,s), C(s,0), D(0,0); M(s/2, s + s/2)
    const pts: Record<string, [number, number]> = { [m[1]!]: [0, s], [m[2]!]: [s, s], [m[3]!]: [s, 0], [m[4]!]: [0, 0] };
    const T = pts[m[6]!]!;
    expectNumeric(d, Math.hypot(T[0] - s / 2, T[1] - 1.5 * s));
  },
  'pd-d-tri-isosceles-special-area': (d) => {
    const m = match(d.stem, /AB = BC = (\d+) and the measure of angle B is (\d+)deg/);
    const s = N(m[1]);
    expectNumeric(d, 0.5 * s * s * Math.sin((N(m[2]) * Math.PI) / 180));
  },
  'pd-d-tri-point-angle-rad': (d) => {
    const m = match(d.stem, /coordinates \((.+), (.+)\)\. What/);
    let a = Math.atan2(evalMath(m[2]!), evalMath(m[1]!));
    if (a < 0) a += 2 * Math.PI;
    expectNumeric(d, a);
  },
  'pd-d-tri-square-in-right': (d) => {
    const m = match(d.stem, /side length of the square is (\d+) and EB = (\d+)/);
    const [s, e] = [N(m[1]), N(m[2])];
    // Toạ độ: O gốc, OB trên trục tung dài s + e, OA trên trục hoành dài a; F(s, s) nằm trên AB.
    // Đường AB: x/a + y/(s + e) = 1 ⇒ s/a = 1 − s/(s + e) ⇒ a = s(s + e)/e.
    expect(d, subValue(rat(s * (s + e), e), rat(s)), 'DA');
  },
  'pd-d-tri-square-diag-intersect': (d) => {
    const m = match(d.stem, /side length (\d+)\. Point F lies on side BC with BF = (\d+)\..*length of (BE|ED)\?/);
    const [s, f] = [N(m[1]), N(m[2])];
    // B gốc, A(0,s), F(f,0); BD: y = x. AF: y = s − (s/f)x.
    const x = s / (1 + s / f);
    expectNumeric(d, m[3] === 'BE' ? x * Math.SQRT2 : (s - x) * Math.SQRT2);
  },
  'pd-d-tri-altitude-similar': (d) => {
    const m = match(d.stem, /AB = (\d+), BC = (\d+), and AC = (\d+)\..*If DE = (\d+)/);
    const [AB, BC, AC, DE] = [N(m[1]), N(m[2]), N(m[3]), N(m[4])];
    assert.equal(AB * AB + BC * BC, AC * AC);
    // tan A = BC/AB = DE/AE
    expect(d, rat(DE * AB, BC), 'AE');
  },
};

// ---- Chương 21

/** "(x - 3)^2 + (y + 2)^2 = 25" → tâm và r². */
function parseCircle(text: string): { h: number; k: number; r2: number } {
  const m = match(text.trim(), /^(?:\(x ([+-]) (\d+)\)|x)\^2 \+ (?:\(y ([+-]) (\d+)\)|y)\^2 = (\d+)$/);
  return { h: m[1] ? -sgn(m[1]) * N(m[2]) : 0, k: m[3] ? -sgn(m[3]) * N(m[4]) : 0, r2: N(m[5]) };
}

const piNum = (s: string) => evalMath(s) / Math.PI;

const V21: Record<string, Verifier> = {
  'pd-d-cir-inscribed-polygon-arc': (d) => {
    const m = match(d.stem, /(?:Square|Equilateral triangle|Regular polygon) ([A-H]+) is inscribed in a circle with radius (\d+)\./);
    const n = m[1]!.length;
    expectNumeric(d, (2 * Math.PI * N(m[2])) / n);
  },
  'pd-d-cir-circles-on-diameter': (d) => {
    const m = match(d.stem, /^(\d) congruent circles .* each small circle has area (.+), what is the area/);
    const r = Math.sqrt(piNum(m[2]!));
    expectNumeric(d, Math.PI * (N(m[1]) * r) ** 2);
  },
  'pd-d-cir-sector-perimeter': (d) => {
    const m = match(d.stem, /circle has area (.+) and is divided into (\d+) congruent sectors/);
    const r = Math.sqrt(piNum(m[1]!));
    expectNumeric(d, 2 * r + (2 * Math.PI * r) / N(m[2]));
  },
  'pd-d-cir-equation-center-area': (d) => {
    const m = match(d.stem, /center \((-?\d+), (-?\d+)\) and (an area|a circumference) of (.+)\?$/);
    const v = piNum(m[4]!);
    const r2 = m[3] === 'an area' ? v : (v / 2) ** 2;
    if (d.format !== 'mcq') return;
    d.choices.forEach((c, i) => {
      const e = parseCircle(c.display);
      assert.equal(e.h === N(m[1]) && e.k === N(m[2]) && close(e.r2, r2), i === d.correctIndex, c.display);
    });
  },
  'pd-d-cir-inscribed-arc-fraction': (d) => {
    const t = N(match(d.stem, /measures (\d+)deg/)[1]);
    expect(d, rat(2 * t, 360), 'Phần chu vi');
  },
  'pd-d-cir-diameter-chord-angle': (d) => {
    const m = match(d.stem, /radius (\d+), (\w)(\w) is a diameter and (\w) is another point on the circle\. If (\w\w) = (.+), what is the measure, in degrees, of angle \w\w\w\?/);
    const r = N(m[1]);
    const [A, C] = [m[2]!, m[3]!];
    const chord = evalMath(m[6]!);
    // Góc B vuông; cạnh huyền AC = 2r. Chord là AB hoặc BC.
    const other = Math.sqrt(4 * r * r - chord * chord);
    const isAB = m[5]!.includes(A) && !m[5]!.includes(C);
    const BC = isAB ? other : chord;
    const ang = (Math.asin(BC / (2 * r)) * 180) / Math.PI;
    expect(d, Math.round(ang), 'Góc BAC');
    assert.ok(close(ang, Math.round(ang), 1e-9));
  },
  'pd-d-cir-equilateral-arc': (d) => {
    const m = match(d.stem, /If the (area|circumference) of the circle is (.+), what is the length of (major|minor) arc/);
    const v = piNum(m[2]!);
    const r = m[1] === 'area' ? Math.sqrt(v) : v / 2;
    expectNumeric(d, ((m[3] === 'major' ? 2 : 1) * 2 * Math.PI * r) / 3);
  },
  'pd-d-cir-sector-angle-rad': (d) => {
    const m = match(d.stem, /radius (\d+), the sector formed by central angle ACB has an area of (.+)\. What/);
    const r = N(m[1]);
    expectNumeric(d, (2 * evalMath(m[2]!)) / (r * r));
  },
  'pd-d-cir-arc-integer-range': (d) => {
    const m = match(d.stem, /radius (\d+)\. .* between frac\(π,(\d)\) and frac\(π,(\d)\) radians\. .* what is its (greatest|least) possible value\?/);
    const r = N(m[1]);
    const lo = (r * Math.PI) / N(m[2]);
    const hi = (r * Math.PI) / N(m[3]);
    const ints = range(1, 200).filter((x) => x > lo && x < hi);
    assert.ok(ints.length > 0, 'Khoảng phải chứa số nguyên.');
    expect(d, m[4] === 'greatest' ? Math.max(...ints) : Math.min(...ints), 'Độ dài cung');
  },
  'pd-d-cir-tangent-gap': (d) => {
    const r = N(match(d.stem, /radius (\d+),/)[1]);
    const area = d.stem.startsWith('Three')
      ? Math.sqrt(3) * r * r - (Math.PI * r * r) / 2
      : d.stem.includes('inside a square')
        ? 16 * r * r - 4 * Math.PI * r * r
        : 4 * r * r - Math.PI * r * r;
    expectNumeric(d, area);
  },
  'pd-d-cir-cylinder-surface': (d) => {
    const m = match(d.stem, /base radius of (\d+) and a height of (\d+)\./);
    const [r, h] = [N(m[1]), N(m[2])];
    expectNumeric(d, 2 * Math.PI * r * r + 2 * Math.PI * r * h);
  },
  'pd-d-cir-two-circles-equilateral': (d) => {
    const r = N(match(d.stem, /each have radius (\d+)/)[1]);
    const inside = 2 * (Math.PI * r * r) / 6;
    const tri = (Math.sqrt(3) / 4) * (2 * r) ** 2;
    const v = d.stem.includes('lies outside triangle PHU') ? 2 * Math.PI * r * r - inside : d.stem.includes('lies inside triangle PHU') ? inside : tri - inside;
    expectNumeric(d, v);
  },
  'pd-d-cir-tangent-lines-angle': (d) => {
    const m = match(d.stem, /radius (\d+)\..*has area (.+)\. The lines/);
    const r = N(m[1]);
    const major = (evalMath(m[2]!) / (Math.PI * r * r)) * 360;
    const ang = 180 - (360 - major);
    expect(d, Math.round(ang), 'APB');
    assert.ok(close(ang, Math.round(ang), 1e-9));
  },
  'pd-d-cir-tangent-circles-triangle': (d) => {
    const m = match(d.stem, /Circle A has radius (\d+) and circle B has radius (\d+)/);
    const [a, b] = [N(m[1]), N(m[2])];
    expectNumeric(d, 0.5 * b * Math.sqrt((a + b) ** 2 - b * b));
  },
  'pd-d-cir-equation-roman': (d) => {
    const m = match(d.stem, /has equation (.+)\. Which of the following must be true\? I\. (.+) II\. (.+) III\. (.+)$/);
    const c = parseCircle(m[1]!);
    const r = Math.sqrt(c.r2);
    const judge = (t: string): boolean => {
      const center = t.match(/^The center of the circle is at \((-?\d+), (-?\d+)\)\.$/);
      if (center) return N(center[1]) === c.h && N(center[2]) === c.k;
      if (t === 'The circle is tangent to the x-axis.') return Math.abs(c.k) === r;
      if (t === 'The circle is tangent to the y-axis.') return Math.abs(c.h) === r;
      if (t === 'The circle passes through the origin.') return c.h ** 2 + c.k ** 2 === c.r2;
      const rad = match(t, /^The radius of the circle is (\d+)\.$/);
      return N(rad[1]) === r;
    };
    assert.equal(correctDisplay(d), romanOf([m[2]!, m[3]!, m[4]!].map(judge)));
  },
};

// ---- Chương 22

const rad = (deg: number) => (deg * Math.PI) / 180;

const V22: Record<string, Verifier> = {
  'pd-d-trig-cofunction-letter': (d) => {
    const m = match(d.stem, /^If (sin|cos)\((\d+)deg\) = ([akmp]), what is (sin|cos)\((\d+)deg\) in terms of [akmp]\?$/);
    const t = N(m[2]);
    const given = m[1] === 'sin' ? Math.sin(rad(t)) : Math.cos(rad(t));
    const asked = m[4] === 'sin' ? Math.sin(rad(N(m[5]))) : Math.cos(rad(N(m[5])));
    // Đáp án là biểu thức theo chữ; thay chữ bằng giá trị đã cho rồi so.
    expectNumeric(d, asked, { [m[3]!]: given });
  },
  'pd-d-trig-tan-to-cos': (d) => {
    const m = match(d.stem, /(sin|cos|tan) (x|A|θ) = (.+)\. What is the value of (cos|sin|tan) (?:x|A|θ)\?/);
    const g = toDecimal(num(m[3]!));
    const ang = m[1] === 'tan' ? Math.atan(g) : m[1] === 'sin' ? Math.asin(g) : Math.acos(g);
    const want = m[4] === 'cos' ? Math.cos(ang) : m[4] === 'sin' ? Math.sin(ang) : Math.tan(ang);
    assert.ok(close(toDecimal(answerOf(d)), want));
  },
  'pd-d-trig-cofunction-sum': (d) => {
    const expr = match(d.stem, /equivalent to (.+)\?$/)[1]!.replace(/\(90deg - θ\)/g, '(1.5707963267948966 - θ)');
    expectEquivalent(d, (v) => evalMath(expr, v), ['θ']);
  },
  'pd-d-trig-hyp-side': (d) => {
    const m = match(d.stem, /\w\w = (\d+)\. If (cos|sin) \w = (.+), what is the length/);
    expect(d, mulValue(rat(N(m[1])), num(m[3]!)), 'Cạnh');
  },
  'pd-d-trig-tan-m': (d) => {
    const m = match(d.stem, /^If tan (x|θ) = (.+), where 0 < (?:x|θ) < 90deg, what is (sin|cos) (?:x|θ) in terms of ([mktp])\?$/);
    const L = m[4]!;
    const want = (vars: Record<string, number>) => {
      const ang = Math.atan(evalMath(m[2]!, vars));
      return m[3] === 'sin' ? Math.sin(ang) : Math.cos(ang);
    };
    // Chỉ thử giá trị dương của chữ (góc nhọn).
    if (d.format !== 'mcq') return;
    const samples = [0.37, 1.91, 0.8, 2.6];
    d.choices.forEach((c, i) => {
      const same = samples.every((v) => {
        const got = evalMath(c.display, { [L]: v });
        return Number.isFinite(got) && close(got, want({ [L]: v }), 1e-7);
      });
      assert.equal(same, i === d.correctIndex, c.display);
    });
  },
  'pd-d-trig-sin-plus-cos': (d) => {
    const m = match(d.stem, /tan B = (.+)\. What is the value of sin B ([+-]) cos B\?/);
    const ang = Math.atan(toDecimal(num(m[1]!)));
    const v = m[2] === '+' ? Math.sin(ang) + Math.cos(ang) : Math.sin(ang) - Math.cos(ang);
    assert.ok(close(toDecimal(answerOf(d)), v));
  },
  'pd-d-trig-sin-decimal-hyp': (d) => {
    const m = match(d.stem, /= (\d+)\. If the measure of angle \w is x degrees and (sin|cos) x = ([\d.]+), what is the length/);
    expect(d, divValue(rat(N(m[1])), num(m[3]!)), 'Cạnh huyền');
  },
  'pd-d-trig-similar-tan-cos': (d) => {
    const m = match(d.stem, /similar to right triangle (\w)(\w)(\w),.*If tan \w = (.+), what is the value of (cos|sin) (\w)\?/);
    let ang = Math.atan(toDecimal(num(m[4]!)));
    if (m[6] === m[3]) ang = Math.PI / 2 - ang;
    else assert.equal(m[6], m[2]);
    assert.ok(close(toDecimal(answerOf(d)), m[5] === 'cos' ? Math.cos(ang) : Math.sin(ang)));
  },
  'pd-d-trig-cofunction-solve': (d) => {
    const m = match(d.stem, /(cos|sin)\((\d+)deg\) = (sin|cos)\(\((\d*)m(?: - (\d+))?\)deg\)/);
    const a = N(m[2]);
    const p = coef(m[4]);
    const q = m[5] ? N(m[5]) : 0;
    const mm = toDecimal(answerOf(d));
    const inner = p * mm - q;
    assert.ok(inner > 0 && inner < 90);
    const lhs = m[1] === 'cos' ? Math.cos(rad(a)) : Math.sin(rad(a));
    const rhs = m[3] === 'sin' ? Math.sin(rad(inner)) : Math.cos(rad(inner));
    assert.ok(close(lhs, rhs));
  },
  'pd-d-trig-coord-cos': (d) => {
    const m = match(d.stem, /A\((-?\d+), (-?\d+)\), B\((-?\d+), (-?\d+)\), and C\((-?\d+), (-?\d+)\)\. What is the value of (cos|sin|tan) C\?/);
    const [ax, ay, cx2, cy] = [N(m[1]), N(m[2]), N(m[5]), N(m[6])];
    const ang = Math.atan2(Math.abs(ay - cy), Math.abs(cx2 - ax));
    const v = m[7] === 'cos' ? Math.cos(ang) : m[7] === 'sin' ? Math.sin(ang) : Math.tan(ang);
    assert.ok(close(toDecimal(answerOf(d)), v));
  },
  'pd-d-trig-diameter-area': (d) => {
    const dd = N(match(d.stem, /diameter with length (\d+),/)[1]);
    expectEquivalent(d, (v) => 0.5 * dd * Math.sin(v.θ!) * dd * Math.cos(v.θ!), ['θ']);
  },
  'pd-d-trig-quadrant-roman': (d) => {
    const m = match(d.stem, /^Given that (.+), where θ is the radian measure of an angle, which of the following could be true\? I\. (.+); II\. (.+); III\. (.+)$/);
    const cond = (t: number): boolean => {
      const s = Math.sin(t);
      const c = Math.cos(t);
      switch (m[1]) {
        case 'sin θ - cos θ = 0': return Math.abs(s - c) < 1e-9;
        case 'sin θ + cos θ = 0': return Math.abs(s + c) < 1e-9;
        case 'tan θ > 0': return s / c > 0;
        case 'tan θ < 0': return s / c < 0;
        case 'sin θ > 0 and cos θ < 0': return s > 0 && c < 0;
        case 'sin θ < 0': return s < 0;
        case 'cos θ > 0': return c > 0;
        case 'sin θ cos θ < 0': return s * c < 0;
        case 'cos θ < 0 and tan θ > 0': return c < 0 && s / c > 0;
        default: throw new Error(`Điều kiện lạ: ${m[1]}`);
      }
    };
    const bounds: Record<string, [number, number]> = {
      '0 < θ < frac(π,2)': [0, Math.PI / 2],
      'frac(π,2) < θ < π': [Math.PI / 2, Math.PI],
      'π < θ < frac(3π,2)': [Math.PI, 1.5 * Math.PI],
      'frac(3π,2) < θ < 2π': [1.5 * Math.PI, 2 * Math.PI],
    };
    const truth = [m[2]!, m[3]!, m[4]!].map((r) => {
      const [lo, hi] = bounds[r]!;
      // Có thể đúng: tồn tại θ trong khoảng thoả điều kiện (kể cả điểm cô lập như π/4).
      const pts = Array.from({ length: 2001 }, (_, i) => lo + ((hi - lo) * (i + 0.5)) / 2001);
      const special = [lo + (hi - lo) / 2];
      return [...pts, ...special].some(cond);
    });
    assert.equal(correctDisplay(d), romanOf(truth));
  },
};

// ---- Chương 23

/** Bảng → {nhãn: [ô số]} */
function rowsOf(d: MathItemDraft): Array<{ label: string; v: number[] }> {
  return table(d).rows.map((r) => ({ label: r.label, v: r.cells.map(Number) }));
}

function argBy<T>(xs: T[], score: (x: T) => number, best: 'max' | 'min'): T[] {
  const vals = xs.map(score);
  const target = best === 'max' ? Math.max(...vals) : Math.min(...vals);
  return xs.filter((_, i) => vals[i] === target);
}

const V23: Record<string, Verifier> = {
  'pd-d-data-max-sum': (d) => {
    const greatest = d.stem.includes('was the total commute time greatest');
    const win = argBy(rowsOf(d), (r) => r.v[0]! + r.v[1]!, greatest ? 'max' : 'min');
    assert.equal(win.length, 1);
    assert.equal(correctDisplay(d), win[0]!.label);
  },
  'pd-d-data-gap-smallest': (d) => {
    const win = argBy(rowsOf(d), (r) => Math.abs(r.v[0]! - r.v[1]!), 'min');
    assert.equal(win.length, 1);
    assert.equal(correctDisplay(d), win[0]!.label);
  },
  'pd-d-data-quarter-highest': (d) => {
    const rs = rowsOf(d);
    const top0 = argBy(rs, (r) => r.v[0]!, 'max');
    const top1 = argBy(rs, (r) => r.v[1]!, 'max');
    assert.equal(top0.length, 1);
    assert.equal(top1.length, 1);
    assert.equal(top0[0]!.label, top1[0]!.label);
    assert.equal(correctDisplay(d), top0[0]!.label);
  },
  'pd-d-data-percent-of': (d) => {
    const m = match(d.stem, /The rainfall in (\w+) was what percent of the rainfall in (\w+)\?/);
    const rs = rowsOf(d);
    const x = rs.find((r) => r.label === m[1])!.v[0]!;
    const y = rs.find((r) => r.label === m[2])!.v[0]!;
    expect(d, rat(100 * x, y), 'Phần trăm');
  },
  'pd-d-data-under-roman': (d) => {
    const m = match(d.stem, /I\. (.+); II\. (.+); III\. (.+)$/);
    const rs = rowsOf(d);
    const truth = [m[1]!, m[2]!, m[3]!].map((t) => {
      const r = rs.find((x) => x.label === t)!;
      return r.v[1]! < r.v[0]!;
    });
    assert.equal(correctDisplay(d), romanOf(truth));
  },
  'pd-d-data-trend': (d) => {
    const t = table(d);
    const [n1, n2] = [t.columns[1]!, t.columns[2]!];
    const dir = (j: number) => {
      const col = t.rows.map((r) => Number(r.cells[j]));
      const inc = col.every((v, i) => i === 0 || v > col[i - 1]!);
      const dec = col.every((v, i) => i === 0 || v < col[i - 1]!);
      assert.ok(inc || dec, 'Chuỗi phải đơn điệu.');
      return inc ? 'increased' : 'decreased';
    };
    const [a, b] = [dir(0), dir(1)];
    const want = a === b ? `Each year, the rate ${a} in both ${n1} and ${n2}.` : `Each year, the rate ${a} in ${n1} but ${b} in ${n2}.`;
    assert.equal(correctDisplay(d), want);
  },
  'pd-d-data-scatter-argmin': (d) => {
    assert.ok(d.figure && d.figure.kind === 'scatterplot');
    const pts = d.figure.points;
    const least = d.stem.includes('needed the least sleep');
    const win = argBy(pts, (p) => p.y, least ? 'min' : 'max');
    assert.equal(win.length, 1);
    expect(d, win[0]!.x, 'Hoành độ');
  },
  'pd-d-data-peak': (d) => {
    expect(d, Math.max(...rowsOf(d).map((r) => r.v[0]!)), 'Giá trị lớn nhất');
  },
  'pd-d-data-matching-percent': (d) => {
    const m = match(d.stem, /percent decrease from (\d+) to (\d+)\?$/);
    const rs = rowsOf(d);
    const val = (y: string) => rs.find((r) => r.label === y)!.v[0]!;
    const target = rat(val(m[1]!) - val(m[2]!), val(m[1]!));
    if (d.format !== 'mcq') return;
    d.choices.forEach((c, i) => {
      const p = match(c.display, /^(\d+) to (\d+)$/);
      assert.equal(N(p[2]) - N(p[1]), 1);
      const inc = rat(val(p[2]!) - val(p[1]!), val(p[1]!));
      assert.equal(equalsValue(inc, target), i === d.correctIndex, c.display);
    });
  },
  'pd-d-data-fraction-of': (d) => {
    const m = match(d.stem, /heart mass of a (\w+) is what fraction of the average heart mass of a (\w+)\?/);
    const rs = rowsOf(d);
    const v = (name: string) => rs.find((r) => r.label.toLowerCase() === name)!.v[0]!;
    expect(d, rat(v(m[1]!), v(m[2]!)), 'Phân số');
  },
  'pd-d-data-max-revenue': (d) => {
    const win = argBy(rowsOf(d), (r) => r.v[0]! * r.v[1]!, 'max');
    assert.equal(win.length, 1);
    assert.equal(correctDisplay(d), `Model ${win[0]!.label}`);
  },
  'pd-d-data-twice': (d) => {
    const hits = rowsOf(d).filter((r) => r.v[0] === 2 * r.v[1]!);
    assert.equal(hits.length, 1);
    expect(d, Number(hits[0]!.label), 'Quý');
  },
  'pd-d-data-combined-max': (d) => {
    const win = argBy(rowsOf(d), (r) => r.v[0]! + r.v[1]!, 'max');
    assert.equal(win.length, 1);
    assert.equal(correctDisplay(d), win[0]!.label);
  },
  'pd-d-data-rate-total': (d) => {
    let total = 0;
    for (const r of rowsOf(d)) {
      const p = match(r.label, /^(\d+) to (\d+)$/);
      total += r.v[0]! * (N(p[2]) - N(p[1]));
    }
    expect(d, total, 'Tổng');
  },
  'pd-d-data-recovery-diff': (d) => {
    const s = N(match(d.stem, /lunch at hour ([\d.]+)\./)[1]);
    const rs = rowsOf(d).map((r) => ({ t: Number(r.label), v: r.v[0]! }));
    const recover = (start: number) => {
      const base = rs.find((r) => r.t === start)!.v;
      const back = rs.find((r) => r.t > start && r.v === base);
      assert.ok(back, 'Phải có lúc quay lại mức ban đầu.');
      return back.t - start;
    };
    const diff = recover(s) - recover(0);
    assert.ok(diff > 0);
    expect(d, rat(Math.round(diff * 2), 2), 'Chênh lệch');
  },
  'pd-d-data-mileage-gallons': (d) => {
    const m = match(d.stem, /for (\d+) hours at a constant speed of (\d+) miles per hour/);
    const mpg = rowsOf(d).find((r) => r.label === m[2])!.v[0]!;
    expect(d, rat(N(m[1]) * N(m[2]), mpg), 'Gallon');
  },
};

// ---- Chương 24

const numCell = (v: string | number) => Number(String(v).replace(/,/g, '').replace('%', ''));

/** Bảng → ma trận số (ô trống thành NaN), tra theo tên hàng/cột. */
function grid(d: MathItemDraft) {
  const t = table(d);
  const cols = t.columns.slice(1);
  const at = (row: string, col: string) => {
    const r = row === 'Total' ? t.totalRow : t.rows.find((x) => x.label === row);
    assert.ok(r, `Không có hàng ${row}`);
    const j = cols.indexOf(col);
    assert.ok(j >= 0, `Không có cột ${col}`);
    const v = r.cells[j]!;
    return v === '' ? NaN : numCell(v);
  };
  return { t, cols, at };
}

const decStr = (v: MathValue, places: number, percent = false) => (percent ? `${(toDecimal(v) * 100).toFixed(places)}%` : toDecimal(v).toFixed(places));

const V24: Record<string, Verifier> = {
  'pd-d-prob-col-given': (d) => {
    const { t, at } = grid(d);
    // Tìm hàng/cột theo cụm từ trong đề: đề nhắc đúng tên cột và tên hàng (viết thường).
    const col = t.columns.slice(1, -1).find((c) => d.stem.toLowerCase().includes(c.toLowerCase()))!;
    const row = t.rows.map((r) => r.label).find((r) => d.stem.toLowerCase().includes(r.toLowerCase()))!;
    assert.ok(col && row);
    assert.equal(correctDisplay(d), decStr(rat(at(row, col), at('Total', col)), 3));
  },
  'pd-d-prob-row-atleast': (d) => {
    const m = match(d.stem, /If a (\w+) is chosen at random, .* at least (\d) years of service\?/);
    const { t, at } = grid(d);
    const row = t.rows.find((r) => r.label.toLowerCase() === m[1])!.label;
    const k = N(m[2]);
    const cols = ['1', '2', '3', '4', '5+'].slice(k - 1);
    const part = cols.reduce((s, c) => s + at(row, c), 0);
    assert.equal(correctDisplay(d), decStr(rat(part, at(row, 'Total')), 2));
  },
  'pd-d-prob-reverse-conditional': (d) => {
    const m = match(d.stem, /at least (\d) years of service is chosen at random, .* the volunteer is a (\w+)\?/);
    const { t, at } = grid(d);
    const row = t.rows.find((r) => r.label.toLowerCase() === m[2])!.label;
    const cols = ['1', '2', '3', '4', '5+'].slice(N(m[1]) - 1);
    const part = cols.reduce((s, c) => s + at(row, c), 0);
    const all = cols.reduce((s, c) => s + at('Total', c), 0);
    assert.equal(correctDisplay(d), decStr(rat(part, all), 2));
  },
  'pd-d-prob-missing-percent': (d) => {
    const m = match(d.stem, /color is (\w+) or (\w+)\?$/);
    const t = table(d);
    const names = t.columns.slice(1).map((c) => c.toLowerCase());
    const vals = t.rows[0]!.cells.map((c) => (c === '' ? NaN : numCell(c)));
    const missing = 100 - vals.filter((v) => !Number.isNaN(v)).reduce((s, v) => s + v, 0);
    const val = (n: string) => {
      const v = vals[names.indexOf(n)]!;
      return Number.isNaN(v) ? missing : v;
    };
    expect(d, val(m[1]!) + val(m[2]!), 'Phần trăm');
  },
  'pd-d-prob-row-fraction': (d) => {
    const { t, at } = grid(d);
    const low = d.stem.toLowerCase();
    const row = t.rows.map((r) => r.label).sort((a, b) => b.length - a.length).find((r) => low.includes(r.toLowerCase()))!;
    const colWords: Record<string, string[]> = { Won: ['win'], Lost: ['lose'], Survived: [' survived?'], 'Did not survive': ['did not survive'], Accepted: ['accepted'], Rejected: ['rejected'] };
    const col = t.columns.slice(1, -1).find((c) => colWords[c]!.some((w) => low.includes(w)))!;
    assert.ok(row && col, d.stem);
    expect(d, rat(at(row, col), at(row, 'Total')), 'Phân số');
  },
  'pd-d-prob-incomplete-weeks': (d) => {
    const m = match(d.stem, /sold over four weeks in the incomplete table\. Weeks (\d) and (\d) accounted for what fraction of all ([\w ]+) sold\?/);
    const { t, at } = grid(d);
    const [r1, r2] = [t.rows[0]!.label, t.rows[1]!.label];
    assert.equal(r1.toLowerCase(), m[3]);
    const wk = (w: number) => {
      const v = at(r1, `Week ${w}`);
      return Number.isNaN(v) ? at('Total', `Week ${w}`) - at(r2, `Week ${w}`) : v;
    };
    const total1 = Number.isNaN(at(r1, 'Total')) ? at('Total', 'Total') - at(r2, 'Total') : at(r1, 'Total');
    expect(d, rat(wk(N(m[1])) + wk(N(m[2])), total1), 'Phân số');
  },
  'pd-d-prob-highest-conditional': (d) => {
    const col = match(d.stem, /choosing a (gold|silver|bronze) medalist/)[1]!;
    const { t, at } = grid(d);
    const C = col[0]!.toUpperCase() + col.slice(1);
    const win = argBy(t.rows.map((r) => r.label), (r) => at(r, C) / at(r, 'Total'), 'max');
    assert.equal(win.length, 1);
    assert.equal(correctDisplay(d), win[0]);
  },
  'pd-d-prob-difference': (d) => {
    const m = match(d.stem, /spotted fish in ([\w ]+) is how much greater than the probability of catching a spotted fish in ([\w ]+)\?/);
    const { at } = grid(d);
    const p = (loc: string) => rat(at(loc, 'Spotted'), at(loc, 'Spotted') + at(loc, 'Striped'));
    const diff = subValue(p(m[1]!), p(m[2]!));
    assert.ok(toDecimal(diff) > 0);
    expect(d, diff, 'Hiệu');
  },
  'pd-d-prob-incomplete-2x2': (d) => {
    const m = match(d.stem, /wildfires in the ([\w ]+) were caused by people\?/);
    const { t, at } = grid(d);
    const rA = t.rows.find((r) => r.label.toLowerCase() === m[1])!.label;
    const rB = t.rows.find((r) => r.label !== rA)!.label;
    const peopleB = at('Total', 'People') - at(rA, 'People');
    const totalB = at(rB, 'Lightning') + peopleB;
    const totalA = at('Total', 'Total') - totalB;
    expect(d, rat(at(rA, 'People'), totalA), 'Phân số');
  },
  'pd-d-prob-given-col-percent': (d) => {
    const line = match(d.stem, /made on Line (A|B)\?/)[1]!;
    const { at } = grid(d);
    assert.equal(correctDisplay(d), decStr(rat(at(`Line ${line}`, 'Defective'), at('Total', 'Defective')), 1, true));
  },
  'pd-d-prob-given-col-rows': (d) => {
    const m = match(d.stem, /If a (\w+) in the neighborhood is chosen at random, .* no more than (\d) resident/);
    const { t, at } = grid(d);
    const col = t.columns.slice(1, -1).find((c) => c.toLowerCase() === m[1])!;
    const k = N(m[2]);
    const rows = ['1', '2', '3', '4 or more'].slice(0, k);
    expect(d, rat(rows.reduce((s, r) => s + at(r, col), 0), at('Total', col)), 'Xác suất');
  },
  'pd-d-prob-weighted': (d) => {
    const m = match(d.stem, /Pond 1 provided (\d+) samples, of which (\d+)% .* Pond 2 provided (\d+) samples, of which (\d+)%/);
    const [n1, p1, n2, p2] = [N(m[1]), N(m[2]), N(m[3]), N(m[4])];
    assert.equal(correctDisplay(d), decStr(rat(n1 * p1 + n2 * p2, 100 * (n1 + n2)), 3));
  },
  'pd-d-prob-incorrect-test': (d) => {
    const { at } = grid(d);
    const wrong = at('Has condition', 'Negative') + at('No condition', 'Positive');
    assert.equal(correctDisplay(d), decStr(rat(wrong, at('Total', 'Total')), 1, true));
  },
  'pd-d-prob-ratio-reasoning': (d) => {
    const m = match(d.stem, /for every (\d+) patients? cured by the placebo, (\d+) patients given the placebo were not cured/);
    expect(d, rat(N(m[1]), N(m[1]) + N(m[2])), 'Xác suất');
  },
  'pd-d-prob-solve-total': (d) => {
    const k = N(match(d.stem, /sports equipment is frac\(1,(\d+)\)/)[1]);
    const { at } = grid(d);
    const laptops = at('Seniors', 'Laptops');
    const T = toDecimal(answerOf(d));
    // Thế ngược: phần còn lại (T − T/k) phải bằng số chọn laptop.
    assert.ok(close(T - T / k, laptops));
  },
};

// ---- Chương 25

const tSum = (v: number[]) => v.reduce((s, x) => s + x, 0);
const tMean = (v: number[]) => tSum(v) / v.length;
function tMedian(v: number[]): number {
  const s = [...v].sort((a, b) => a - b);
  const n = s.length;
  return n % 2 ? s[(n - 1) / 2]! : (s[n / 2 - 1]! + s[n / 2]!) / 2;
}
const tSd = (v: number[]) => Math.sqrt(tSum(v.map((x) => (x - tMean(v)) ** 2)) / v.length);
const tExpand = (vals: number[], freq: number[]) => vals.flatMap((x, i) => Array<number>(freq[i]!).fill(x));
function tModes(v: number[]): number[] {
  const c = new Map<number, number>();
  v.forEach((x) => c.set(x, (c.get(x) ?? 0) + 1));
  const m = Math.max(...c.values());
  return [...c].filter(([, k]) => k === m).map(([x]) => x).sort((a, b) => a - b);
}

const V25: Record<string, Verifier> = {
  'pd-d-stat-combined-mean': (d) => {
    const m = match(d.stem, /of (\d+) students in one group is (\d+)\. .* of (\d+) students in another group is (\d+)\./);
    const [n1, m1, n2, m2] = [N(m[1]), N(m[2]), N(m[3]), N(m[4])];
    expect(d, rat(n1 * m1 + n2 * m2, n1 + n2), 'Trung bình chung');
  },
  'pd-d-stat-mean-first-part': (d) => {
    const m = match(d.stem, /has taken (\d+) tests\. The average score on all \d+ tests is ([\d.]+)\. The average score on the last (\d+) tests is (\d+)\./);
    const n = N(m[1]);
    const M = num(m[2]!);
    const k = N(m[3]);
    expect(d, divValue(subValue(mulValue(M, rat(n)), rat(k * N(m[4]))), rat(n - k)), 'Trung bình phần đầu');
  },
  'pd-d-stat-histogram-median-bin': (d) => {
    const rs = table(d).rows.map((r) => {
      const b = match(r.label, /^(\d+)-(\d+)$/);
      return { lo: N(b[1]), hi: N(b[2]), f: Number(r.cells[0]) };
    });
    const n = tSum(rs.map((r) => r.f));
    const binAt = (pos: number) => {
      let c = 0;
      for (const r of rs) {
        c += r.f;
        if (c >= pos) return r;
      }
      throw new Error('vượt');
    };
    const b1 = binAt(n / 2);
    const b2 = binAt(n / 2 + 1);
    assert.equal(b1, b2, 'Hai vị trí giữa phải cùng một khoảng.');
    if (d.format !== 'mcq') return;
    d.choices.forEach((c, i) => {
      const v = N(c.display);
      assert.equal(v >= b1.lo && v < b1.hi, i === d.correctIndex, c.display);
    });
  },
  'pd-d-stat-dotplot-mean': (d) => {
    const { xs, cols } = fnCols(d);
    const mean = tMean(tExpand(xs, cols[0]!));
    if (d.format !== 'mcq') return;
    const dist = d.choices.map((c) => Math.abs(N(c.display) - mean));
    const best = Math.min(...dist);
    assert.equal(dist.filter((x) => x === best).length, 1);
    assert.equal(dist[d.correctIndex], best);
  },
  'pd-d-stat-sd-remove-two': (d) => {
    const rows = table(d).rows.map((r) => ({ name: r.label, v: Number(r.cells[0]) }));
    if (d.format !== 'mcq') return;
    const sdWithout = (disp: string) => {
      const [a, b] = disp.split(' and ');
      return tSd(rows.filter((r) => r.name !== a && r.name !== b).map((r) => r.v));
    };
    const sds = d.choices.map((c) => sdWithout(c.display));
    const best = Math.min(...sds);
    assert.equal(sds.filter((x) => close(x, best)).length, 1);
    assert.ok(close(sds[d.correctIndex]!, best));
  },
  'pd-d-stat-sd-compare-freq': (d) => {
    const parse = (g: string) => {
      const part = match(d.stem, new RegExp(`Route ${g}: ([^.]+)\\.`))[1]!;
      return [...part.matchAll(/(\d+) min \((\d+) days\)/g)].flatMap((m) => Array<number>(N(m[2])).fill(N(m[1])));
    };
    const a = tSd(parse('A'));
    const b = tSd(parse('B'));
    assert.ok(!close(a, b));
    assert.equal(correctDisplay(d), `The standard deviation of the travel times for Route ${a < b ? 'A' : 'B'} is smaller.`);
  },
  'pd-d-stat-median-compare': (d) => {
    const { xs, cols } = fnCols(d);
    const ma = tMedian(tExpand(xs, cols[0]!));
    const mb = tMedian(tExpand(xs, cols[1]!));
    const want = ma < mb ? 'The median weight of the kayaks made by Company A is smaller.' : ma > mb ? 'The median weight of the kayaks made by Company B is smaller.' : 'The median weight of the kayaks is the same for both companies.';
    assert.equal(correctDisplay(d), want);
  },
  'pd-d-stat-freq-median': (d) => {
    const { xs, cols } = fnCols(d);
    const med = tMedian(tExpand(xs, cols[0]!));
    expect(d, rat(Math.round(med * 2), 2), 'Trung vị');
  },
  'pd-d-stat-median-must': (d) => {
    assert.ok(correctDisplay(d).startsWith('At least half of the'));
  },
  'pd-d-stat-range-must': (d) => {
    const R = N(match(d.stem, /has a range of (\d+)/)[1]);
    assert.ok(correctDisplay(d).includes(`lasted ${R} `) && correctDisplay(d).includes('longer than the unit with the shortest'));
  },
  'pd-d-stat-freq-mean-range': (d) => {
    const { xs, cols } = fnCols(d);
    const list = tExpand(xs, cols[0]!);
    const m = match(correctDisplay(d), /^Mean = ([\d.]+), Range = (\d+)$/);
    assert.ok(close(Number(m[1]), tMean(list)));
    assert.equal(N(m[2]), Math.max(...list) - Math.min(...list));
    if (d.format !== 'mcq') return;
    d.choices.forEach((c, i) => {
      if (i === d.correctIndex) return;
      const p = match(c.display, /^Mean = ([\d.]+), Range = (\d+)$/);
      assert.ok(!(close(Number(p[1]), tMean(list)) && N(p[2]) === Math.max(...list) - Math.min(...list)), c.display);
    });
  },
  'pd-d-stat-list-roman': (d) => {
    const scores = table(d).rows[0]!.cells.map(Number);
    const T = N(match(d.stem, /The range is greater than (\d+)\./)[1]);
    const modes = tModes(scores);
    assert.equal(modes.length, 1, 'Phải có đúng một mốt.');
    const truth = [modes[0]! > tMedian(scores), tMedian(scores) > tMean(scores), Math.max(...scores) - Math.min(...scores) > T];
    assert.equal(correctDisplay(d), romanOf(truth));
  },
  'pd-d-stat-compare-mean-median': (d) => {
    const { xs, cols } = fnCols(d);
    const a = tExpand(xs, cols[0]!);
    const b = tExpand(xs, cols[1]!);
    const [ma, mb, da, db] = [tMean(a), tMean(b), tMedian(a), tMedian(b)];
    const c = correctDisplay(d);
    if (c.includes('both greater in School A')) assert.ok(ma > mb && da > db);
    else if (c.includes('both greater in School B')) assert.ok(mb > ma && db > da);
    else if (c.includes('but the median is the same')) assert.ok(ma > mb && da === db);
    else assert.ok(close(ma, mb) && da === db);
  },
  'pd-d-stat-add-value-roman': (d) => {
    const vals = table(d).rows[0]!.cells.map(Number);
    const add = N(match(d.stem, /If a (\d+)-calorie meal/)[1]);
    const after = [...vals, add];
    const rangeOf = (v: number[]) => Math.max(...v) - Math.min(...v);
    const truth = [tMedian(vals) === tMedian(after), tModes(vals).join() === tModes(after).join(), rangeOf(vals) === rangeOf(after)];
    assert.equal(correctDisplay(d), romanOf(truth));
  },
  'pd-d-stat-remove-outlier': (d) => {
    const { xs, cols } = fnCols(d);
    const before = tExpand(xs, cols[0]!);
    const mx = Math.max(...before);
    const after = [...before];
    after.splice(after.indexOf(mx), 1);
    const dec = [tMean(after) < tMean(before), tMedian(after) < tMedian(before), tSd(after) < tSd(before)];
    const want =
      dec[0] && dec[1] && dec[2]
        ? 'The mean, median, and standard deviation will decrease.'
        : dec[0] && dec[2] && !dec[1]
          ? 'Only the mean and standard deviation will decrease.'
          : dec[0] && dec[1]
            ? 'Only the mean and median will decrease.'
            : 'Only the mean will decrease.';
    assert.equal(correctDisplay(d), want);
  },
  'pd-d-stat-correct-outlier': (d) => {
    const m = match(d.stem, /The measurement of (\d+) inches is an error\..*correct measurement of (\d+) inches\?/);
    const cells = table(d).rows.flatMap((r) => r.cells).filter((c) => c !== '').map(Number);
    const before = cells;
    const after = [...cells];
    after[after.indexOf(N(m[1]))] = N(m[2]);
    const rangeOf = (v: number[]) => Math.max(...v) - Math.min(...v);
    const ch: Record<string, number> = {
      Mean: Math.abs(tMean(before) - tMean(after)),
      Median: Math.abs(tMedian(before) - tMedian(after)),
      Range: Math.abs(rangeOf(before) - rangeOf(after)),
    };
    const best = Math.max(...Object.values(ch));
    const names = Object.keys(ch).filter((k) => ch[k] === best);
    assert.equal(names.length, 1);
    assert.equal(correctDisplay(d), names[0]);
  },
};

// ---- Chương 26

function scatter(d: MathItemDraft) {
  assert.ok(d.figure && d.figure.kind === 'scatterplot', 'Câu này phải có đồ thị điểm.');
  const f = d.figure;
  assert.ok(f.line, 'Phải có đường khớp nhất.');
  return { pts: f.points, at: (x: number) => f.line!.slope * x + f.line!.intercept };
}

const V26: Record<string, Verifier> = {
  'pd-d-stat2-count-above-line': (d) => {
    const k = N(match(d.stem, /how many (\d+)-year-olds/)[1]);
    const { pts, at } = scatter(d);
    expect(d, pts.filter((p) => p.x === k && p.y > at(k)).length, 'Số điểm phía trên');
  },
  'pd-d-stat2-line-predict': (d) => {
    const m = match(d.stem, /line of best fit, y = (.+)x ([+-]) (\d+)\. .* a town with (\d+) traffic signals\?/);
    const slope = num(m[1]!);
    const b = rat(sgn(m[2]) * N(m[3]));
    expect(d, addValue(mulValue(slope, rat(N(m[4]))), b), 'Dự đoán');
    const { at } = scatter(d);
    assert.ok(close(at(N(m[4])), toDecimal(answerOf(d))), 'Đường trên hình phải khớp phương trình trong đề.');
  },
  'pd-d-stat2-best-survey': (d) => {
    if (d.format !== 'mcq') return;
    // Đáp án: mẫu ngẫu nhiên lớn nhất lấy từ đúng tổng thể mục tiêu (cụm từ xuất hiện trong đề).
    const parsed = d.choices.map((c) => match(c.display, /^Selecting a random sample of (\d+) people from (.+)$/));
    const sizes = parsed.map((p) => N(p[1]));
    const c = parsed[d.correctIndex]!;
    assert.equal(N(c[1]), Math.max(...sizes));
    assert.ok(!/^all |entire state|whole university/.test(c[2]!), String(c[2]));
    assert.ok(!/one |department|section|shift/.test(c[2]!), String(c[2]));
  },
  'pd-d-stat2-poll-difference': (d) => {
    const m = match(d.stem, /sample of (\d+) likely voters, (\d+) support Candidate A and (\d+) support Candidate B\. An estimated ([\d,]+) residents/);
    const [n, a, b] = [N(m[1]), N(m[2]), N(m[3])];
    assert.equal(a + b, n);
    expect(d, rat(Math.abs(b - a) * N(m[4]), n), 'Chênh lệch');
  },
  'pd-d-stat2-intercept-meaning': (d) => {
    assert.match(correctDisplay(d), /^The predicted .+ when the .+ is 0$/);
  },
  'pd-d-stat2-slope-units': (d) => {
    const m = match(d.stem, /relationship between (.+) and (.+) for \d+ companies, both measured in (thousands|millions) of dollars, with (.+) on the horizontal axis/);
    const u = m[3] === 'thousands' ? 'one thousand' : 'one million';
    assert.equal(correctDisplay(d), `The expected increase in ${m[1]} for every ${u} dollar increase in ${m[2]}`);
  },
  'pd-d-stat2-slope-scaled': (d) => {
    const m = match(d.stem, /shows (.+), in (\w+)s, on the horizontal axis and (.+) on the vertical axis .* y = (-?[\d.]+)x/);
    const up = Number(m[4]) > 0;
    assert.equal(correctDisplay(d), `The expected ${up ? 'increase' : 'decrease'} in ${m[3]} per ${m[2]} increase in ${m[1]}`);
  },
  'pd-d-stat2-slope-two-points': (d) => {
    const m = match(d.stem, /passes through the points \((\d+), (\d+)\) and \((\d+), (\d+)\)/);
    expect(d, rat(N(m[4]) - N(m[2]), N(m[3]) - N(m[1])), 'Hệ số góc');
  },
  'pd-d-stat2-closest-to-line': (d) => {
    const { pts, at } = scatter(d);
    const win = argBy(pts, (p) => Math.abs(p.y - at(p.x)), 'min');
    assert.equal(win.length, 1);
    expect(d, win[0]!.x, 'Hoành độ');
  },
  'pd-d-stat2-farthest-total': (d) => {
    const { pts, at } = scatter(d);
    const win = argBy(pts, (p) => Math.abs(p.y - at(p.x)), 'max');
    assert.equal(win.length, 1);
    expect(d, win[0]!.x * win[0]!.y, 'Tổng số ghế');
  },
  'pd-d-stat2-random-assignment': (d) => {
    assert.match(correctDisplay(d), /is given a random number, and those with an even number are assigned to/);
  },
  'pd-d-stat2-margin-compare': (d) => {
    const m = match(d.stem, /In Week 1, the sample had a mean [\w ]+ of ([\d.]+) \w+ with a margin of error of ([\d.]+) \w+\. In Week 2, the sample had a mean [\w ]+ of ([\d.]+) \w+ with a margin of error of ([\d.]+)/);
    const [m1, e1, m2, e2] = [Number(m[1]), Number(m[2]), Number(m[3]), Number(m[4])];
    assert.ok(m1 + e1 < m2 - e2 || m2 + e2 < m1 - e1, 'Hai khoảng không được chồng nhau.');
    const hi = m1 > m2 ? 'Week 1' : 'Week 2';
    assert.match(correctDisplay(d), new RegExp(`^It is very likely that the mean .+ produced in ${hi} was greater than`));
  },
  'pd-d-stat2-least-variability': (d) => {
    assert.match(correctDisplay(d), /same (daily meal plan|training schedule|delivery route)/);
  },
  'pd-d-stat2-ci-interpret': (d) => {
    const pop = match(d.stem, /selects \d+ (.+) at random/)[1]!;
    assert.ok(correctDisplay(d).startsWith('The true mean') && correctDisplay(d).includes(`of all ${pop} is likely`));
  },
};

// ---- Chương 27

const V27: Record<string, Verifier> = {
  'pd-d-vol-cylinder-half': (d) => {
    const m = match(d.stem, /base diameter of (\d+) centimeters and a height of (\d+) centimeters/);
    const r = N(m[1]) / 2;
    expectNumeric(d, (Math.PI * r * r * N(m[2])) / 2);
  },
  'pd-d-vol-box-surface': (d) => {
    const m = match(d.stem, /area of (\d+) square inches\. The volume of the box is (\d+) cubic inches/);
    const B = N(m[1]);
    const s = Math.sqrt(B);
    const h = N(m[2]) / B;
    expect(d, Math.round(2 * B + 4 * s * h), 'Diện tích toàn phần');
  },
  'pd-d-vol-cube-symbolic': (d) => {
    const m = match(d.stem, /^What is the (volume|surface area|edge length) of a cube with (volume|surface area) (.+)\?$/);
    const v = match(m[3]!, /([abxt])/)[1]!;
    const f = (vars: Record<string, number>) => {
      const g = evalMath(m[3]!, vars);
      const edge = m[2] === 'volume' ? Math.cbrt(g) : Math.sqrt(g / 6);
      return m[1] === 'volume' ? edge ** 3 : m[1] === 'surface area' ? 6 * edge * edge : edge;
    };
    // Chỉ thử giá trị dương của chữ.
    if (d.format !== 'mcq') return;
    d.choices.forEach((c, i) => {
      const same = [0.7, 1.9, 3.2].every((x) => close(evalMath(c.display, { [v]: x }), f({ [v]: x }), 1e-7));
      assert.equal(same, i === d.correctIndex, c.display);
    });
  },
  'pd-d-vol-fill-time': (d) => {
    const m = match(d.stem, /radius of (\d+) feet and a height of (\d+) feet can be filled in (\d+) hours\..* radius of (\d+) feet and a height of (\d+) feet\?/);
    const [r1, h1, t, r2, h2] = [N(m[1]), N(m[2]), N(m[3]), N(m[4]), N(m[5])];
    if (d.format !== 'mcq') return;
    const want = (t * r2 * r2 * h2) / (r1 * r1 * h1);
    d.choices.forEach((c, i) => assert.equal(close(evalMath(c.display), want), i === d.correctIndex, c.display));
  },
  'pd-d-vol-balls-cylinder': (d) => {
    const m = match(d.stem, /hold (\d) balls stacked in a single column, each with a radius of (\d+) inches/);
    const [n, r] = [N(m[1]), N(m[2])];
    expectNumeric(d, Math.PI * r * r * (2 * r * n));
  },
  'pd-d-vol-water-rise': (d) => {
    const m = match(d.stem, /measures (\d+) inches by (\d+) inches and a height of (\d+) inches\. .* depth of (\d+) inches\. .* volume of ([\d.]+) cubic inches/);
    const [l, w, H, dep, V] = [N(m[1]), N(m[2]), N(m[3]), N(m[4]), Number(m[5])];
    const rise = V / (l * w);
    assert.ok(dep + rise <= H, 'Nước không được tràn.');
    assert.ok(close(toDecimal(answerOf(d)), rise));
  },
  'pd-d-vol-painted-cube': (d) => {
    const m = match(d.stem, /edge length of (\d+) inches is painted .* each with an edge length of (\d+) inch(?:es)?\. How many of the small cubes (do not have any paint on them|have paint on exactly (one|two|three) faces?)\?/);
    const n = N(m[1]) / N(m[2]);
    const want = m[4] === undefined ? 0 : { one: 1, two: 2, three: 3 }[m[4]]!;
    // Đếm thẳng bằng toạ độ.
    let count = 0;
    for (let x = 0; x < n; x += 1) for (let y = 0; y < n; y += 1) for (let z = 0; z < n; z += 1) {
      const f = [x, y, z].reduce((s, c) => s + (c === 0 ? 1 : 0) + (c === n - 1 ? 1 : 0), 0);
      if (f === want) count += 1;
    }
    expect(d, count, 'Số khối');
  },
  'pd-d-vol-open-box-touching': (d) => {
    const m = match(d.stem, /^A box with (an open top|a closed lid) .* inside edges is (\d+) inches long\. .* cubes that measure (\d+) inch(?:es)? on each edge\. How many of these cubes are (not )?touching the box\?/);
    const open = m[1] === 'an open top';
    const n = N(m[2]) / N(m[3]);
    let count = 0;
    // z = 0 là đáy; nắp (nếu có) ở z = n − 1.
    for (let x = 0; x < n; x += 1) for (let y = 0; y < n; y += 1) for (let z = 0; z < n; z += 1) {
      if (x === 0 || x === n - 1 || y === 0 || y === n - 1 || z === 0 || (!open && z === n - 1)) count += 1;
    }
    expect(d, m[4] ? n ** 3 - count : count, 'Số khối');
  },
  'pd-d-vol-block-faces': (d) => {
    const m = match(d.stem, /A (\d+) × (\d+) × (\d+) solid block .* have paint on (exactly one face|exactly two faces|no faces)\?/);
    const [a, b, c] = [N(m[1]), N(m[2]), N(m[3])];
    const want = m[4] === 'exactly one face' ? 1 : m[4] === 'exactly two faces' ? 2 : 0;
    let count = 0;
    for (let x = 0; x < a; x += 1) for (let y = 0; y < b; y += 1) for (let z = 0; z < c; z += 1) {
      const f = (x === 0 ? 1 : 0) + (x === a - 1 ? 1 : 0) + (y === 0 ? 1 : 0) + (y === b - 1 ? 1 : 0) + (z === 0 ? 1 : 0) + (z === c - 1 ? 1 : 0);
      if (f === want) count += 1;
    }
    expect(d, count, 'Số khối');
  },
  'pd-d-vol-cone-hemisphere': (d) => {
    const m = match(d.stem, /base radius of (\d+) centimeters and a slant height of (\d+) centimeters/);
    const [r, s] = [N(m[1]), N(m[2])];
    const h = Math.sqrt(s * s - r * r);
    expectNumeric(d, (Math.PI * r * r * h) / 3 + (2 * Math.PI * r ** 3) / 3);
  },
  'pd-d-vol-crate-inside': (d) => {
    const m = match(d.stem, /crate is (\d+) inches long, (\d+) inches wide, and (\d+) inches high, .* each (\d+) inch(?:es)? thick/);
    const [L, W, H, t] = [N(m[1]), N(m[2]), N(m[3]), N(m[4])];
    expect(d, (L - 2 * t) * (W - 2 * t) * (H - t), 'Số khối');
  },
  'pd-d-vol-staircase-mass': (d) => {
    const m = match(d.stem, /base that is (\d+) meters long and (\d+) meters wide\. The staircase has (\d) steps .* rise of ([\d.]+) meter .* density of concrete is (\d+) kilograms/);
    const [L, W, k, rise, dens] = [N(m[1]), N(m[2]), N(m[3]), Number(m[4]), N(m[5])];
    let vol = 0;
    for (let i = 1; i <= k; i += 1) vol += W * (L / k) * rise * i;
    if (d.format !== 'mcq') return;
    d.choices.forEach((c, i) => assert.equal(close(Number(c.display.replace(/,/g, '')), vol * dens, 1e-9), i === d.correctIndex, c.display));
  },
};

// ------------------------------------------------------------------ các test

const VERIFIERS: Record<string, Verifier> = { ...V14, ...V15, ...V16, ...V17, ...V18, ...V19, ...V20, ...V21, ...V22, ...V23, ...V24, ...V25, ...V26, ...V27 };

test('panda-d: mỗi template đều có verifier, slug duy nhất và đúng tiền tố', () => {
  const slugs = PANDA_D_TEMPLATES.map((t) => t.slug);
  assert.equal(new Set(slugs).size, slugs.length);
  for (const t of PANDA_D_TEMPLATES) {
    assert.ok(t.slug.startsWith('pd-d-'), t.slug);
    assert.ok(VERIFIERS[t.slug], `Template "${t.slug}" chưa có verifier.`);
  }
});

function assertMarkupClean(d: MathItemDraft) {
  assert.deepEqual(validateMath(d.stem), [], `Markup hỏng trong đề: ${d.stem}`);
  if (d.format === 'mcq') {
    for (const c of d.choices) assert.deepEqual(validateMath(c.display), [], `Markup hỏng ở lựa chọn: ${c.display}`);
  }
  for (const s of d.steps) {
    if (s.expr) assert.deepEqual(validateMath(s.expr), [], `Markup hỏng ở bước giải: ${s.expr}`);
  }
  if (d.figure && d.figure.kind === 'data_table') {
    const cells = [...d.figure.rows.flatMap((r) => [r.label, ...r.cells]), ...(d.figure.totalRow?.cells ?? [])];
    for (const c of cells) assert.ok(!/NaN|undefined|null|Infinity/.test(String(c)), `Bảng có ô rác: ${c}`);
  }
}

for (const template of PANDA_D_TEMPLATES) {
  test(`${template.slug}: đáp án đúng và câu hỏi sạch trên ${SEEDS} hạt`, () => {
    const verify = VERIFIERS[template.slug]!;
    const seenCorrect = new Set<number>();
    const signatures = new Set<string>();

    for (let i = 0; i < SEEDS; i += 1) {
      const d = build(template.slug, i);
      assert.equal(d.format, template.format, 'Định dạng khai báo lệch với định dạng sinh ra.');
      assert.ok(d.stem.trim().length > 0, 'Đề rỗng.');
      assertMarkupClean(d);

      assert.ok(d.steps.length > 0, 'Câu nào cũng phải có lời giải.');
      d.steps.forEach((step, k) => {
        assert.ok(step.text.trim().length > 0, 'Bước giải rỗng.');
        assert.ok(!/frac\(|sqrt\(|\^\d|_\d/.test(step.text), `Markup toán lọt vào phần lời: "${step.text}"`);
        const prev = d.steps[k - 1]?.expr;
        if (prev && step.expr) assert.notEqual(step.expr, prev, `Bước ${k + 1} in lại y hệt bước ${k}.`);
      });

      const choiceDisplays = d.format === 'mcq' ? d.choices.map((c) => c.display) : [];
      const rendered = [d.stem, ...choiceDisplays].join(' ');
      assert.ok(!/NaN|Infinity|undefined|null/.test(rendered), `Đề in ra rác: ${rendered}`);
      assert.ok(!/-0\b(?!\.)/.test(rendered), `Đề in ra số âm 0: ${rendered}`);
      assert.ok(!/\+ -|- -/.test(rendered), `Đề in ra dấu chồng dấu: ${rendered}`);
      assert.ok(!/(?<![\d.])1[xi]\b/.test(rendered), `Đề in ra hệ số 1 thừa: ${rendered}`);
      assert.ok(!/\(\s*\)/.test(rendered), `Đề in ra ngoặc rỗng: ${rendered}`);

      if (d.format === 'mcq') {
        assert.equal(d.choices.length, 4);
        assert.ok(d.correctIndex >= 0 && d.correctIndex < 4, 'correctIndex nằm ngoài khoảng.');
        seenCorrect.add(d.correctIndex);
        const values = d.choices.map((c) => tryNum(c.display));
        if (values.every((v) => v !== null)) {
          for (let a = 0; a < 4; a += 1) {
            for (let b = a + 1; b < 4; b += 1) {
              assert.ok(!equalsValue(values[a]!, values[b]!), `Lựa chọn ${a} và ${b} trùng giá trị: ${rendered}`);
            }
          }
        }
        assert.equal(new Set(choiceDisplays).size, 4, `Có hai lựa chọn trùng chữ: ${choiceDisplays.join(' | ')}`);
        const correct = d.choices[d.correctIndex]!;
        assert.equal(correct.errorTag, null, 'Đáp án đúng mang nhãn lỗi.');
        assert.equal(correct.note, undefined, 'Đáp án đúng có ghi chú lỗi.');
        d.choices.forEach((c, k) => {
          if (k === d.correctIndex) return;
          assert.ok(c.errorTag !== null || (c.note?.length ?? 0) > 0, `Nhiễu "${c.display}" không có nhãn lẫn ghi chú.`);
        });
      } else {
        assert.ok(fitsGrid(d.answer), `Đáp án ${d.answer.num}/${d.answer.den} không điền vừa ô.`);
      }

      verify(d);

      signatures.add(JSON.stringify([d.stem, d.figure ?? null, [...choiceDisplays].sort(), d.format === 'grid_in' ? d.answer : null]));
    }

    if (template.format === 'mcq') {
      assert.equal(seenCorrect.size, 4, `Đáp án đúng chỉ rơi vào ${[...seenCorrect].join(', ')}.`);
    }
    assert.ok(signatures.size > SEEDS / 2, `${SEEDS} hạt chỉ ra ${signatures.size} câu khác nhau.`);
  });

  test(`${template.slug}: cùng hạt ra cùng một câu`, () => {
    for (let i = 0; i < 20; i += 1) {
      assert.deepEqual(build(template.slug, i), build(template.slug, i));
    }
  });
}
