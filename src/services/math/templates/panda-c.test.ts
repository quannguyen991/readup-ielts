import assert from 'node:assert/strict';
import { test } from 'node:test';

import { PANDA_C_TEMPLATES } from './panda-c';
import { validateMath } from '@/lib/math/expr';
import type { MathItemDraft, MathValue } from '@/lib/math/types';
import { equalsValue, rat, toDecimal } from '@/lib/math/value';
import { fitsGrid } from '@/services/math/grid-in';
import { hashString, mulberry32 } from '@/services/questions/rng';

/**
 * Property test cho các dạng câu `pd-c-` (bám bài tập cuối chương 1 – 13).
 *
 * Cùng triết lý với `panda-a.test.ts`: ĐỌC NGƯỢC TỪ ĐỀ ĐÃ IN rồi tự giải, không
 * đọc tham số nội bộ của template. Với lựa chọn là biểu thức, bộ kiểm chứng
 * TÍNH GIÁ TRỊ biểu thức tại vài điểm (bộ tính riêng ở dưới) rồi so với lời
 * giải tự dựng từ đề — nên hai cách viết khác nhau của cùng một biểu thức vẫn
 * được nhận ra, và một nhiễu vô tình bằng đáp án cũng bị bắt.
 */

const SEEDS = 200;

function draftOf(slug: string, seed: number): MathItemDraft {
  const template = PANDA_C_TEMPLATES.find((t) => t.slug === slug);
  assert.ok(template, `Không có template ${slug}.`);
  return template.build(mulberry32(hashString(`${slug}:${seed}`)));
}

// --------------------------------------------------------------- tiện ích

function tryValue(display: string): MathValue | null {
  const int = display.match(/^(-?\d+)$/);
  if (int) return rat(Number(int[1]));
  const frac = display.match(/^(-?)frac\((\d+),(\d+)\)$/);
  if (frac) return rat((frac[1] === '-' ? -1 : 1) * Number(frac[2]), Number(frac[3]));
  return null;
}

function mcq(d: MathItemDraft) {
  assert.equal(d.format, 'mcq');
  if (d.format !== 'mcq') throw new Error('unreachable');
  return d;
}

function correctDisplay(d: MathItemDraft): string {
  const m = mcq(d);
  const choice = m.choices[m.correctIndex];
  assert.ok(choice, 'correctIndex trỏ ra ngoài mảng lựa chọn.');
  return choice.display;
}

function answerOf(d: MathItemDraft): MathValue {
  if (d.format === 'grid_in') return d.answer;
  const v = tryValue(correctDisplay(d));
  assert.ok(v, `Đáp án "${correctDisplay(d)}" không ở dạng số.`);
  return v;
}

function toR(n: number): MathValue {
  if (Number.isInteger(n)) return rat(n);
  const r = Math.round(n * 1e6);
  assert.ok(Math.abs(r / 1e6 - n) < 1e-9, `Kỳ vọng ${n} không phải số thập phân hữu hạn gọn.`);
  return rat(r, 1e6);
}

function expectAnswer(d: MathItemDraft, expected: MathValue | number) {
  const e = typeof expected === 'number' ? toR(expected) : expected;
  const got = answerOf(d);
  assert.ok(equalsValue(got, e), `Kỳ vọng ${e.num}/${e.den}, template cho ${got.num}/${got.den}. Đề: ${d.stem}`);
}

/** Đáp án là một số thập phân in ra (vd "12.35" hoặc "45%"). */
function expectNear(d: MathItemDraft, expected: number, tol = 1e-6) {
  const s = correctDisplay(d).replace(/[%$,]/g, '');
  const got = Number(s);
  assert.ok(Number.isFinite(got), `Đáp án "${correctDisplay(d)}" không đọc được thành số.`);
  assert.ok(Math.abs(got - expected) <= tol, `Kỳ vọng ≈ ${expected}, template cho ${got}. Đề: ${d.stem}`);
}

function match(text: string, pattern: RegExp): RegExpMatchArray {
  const m = text.match(pattern);
  assert.ok(m, `Đề không đúng khuôn: ${text}`);
  return m;
}

const N = (s: string | undefined) => Number((s ?? '').replace(/,/g, ''));
const close = (a: number, b: number, tol = 1e-7) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));

/** "3" → 3, "" → 1, "-" → -1. */
function coef(text: string | undefined): number {
  if (text === undefined || text === '') return 1;
  if (text === '-') return -1;
  return Number(text);
}

/**
 * Bộ tính biểu thức markup: số (có thập phân), biến một chữ cái, pi, + - · × * /,
 * nhân ngầm, ngoặc, luỹ thừa ^, frac(a,b), sqrt(…).
 */
function evalM(src: string, env: Record<string, number>): number {
  const s = src.replace(/pi(?![A-Za-z])/g, 'π').replace(/\s+/g, '').replace(/−/g, '-');
  let i = 0;
  const peek = () => s[i];
  const expectCh = (ch: string) => {
    assert.equal(s[i], ch, `Thiếu "${ch}" ở vị trí ${i} trong ${src}`);
    i += 1;
  };
  const startsFactor = () => {
    const c = s[i];
    return c !== undefined && /[0-9A-Za-z(.π]/.test(c);
  };
  function atom(): number {
    if (s.startsWith('frac(', i)) {
      i += 5;
      const a = expr();
      expectCh(',');
      const b = expr();
      expectCh(')');
      return a / b;
    }
    if (s.startsWith('sqrt(', i)) {
      i += 5;
      const a = expr();
      expectCh(')');
      return Math.sqrt(a);
    }
    if (s[i] === 'π') {
      i += 1;
      return Math.PI;
    }
    if (peek() === '(') {
      i += 1;
      const a = expr();
      expectCh(')');
      return a;
    }
    const numM = s.slice(i).match(/^\d*\.?\d+/);
    if (numM) {
      i += numM[0].length;
      return Number(numM[0]);
    }
    const ch = peek();
    assert.ok(ch !== undefined && /[A-Za-z]/.test(ch) && ch in env, `Biến lạ "${ch}" trong ${src}`);
    i += 1;
    return env[ch]!;
  }
  function expAtom(): number {
    let neg = false;
    if (peek() === '-') {
      neg = true;
      i += 1;
    }
    let v: number;
    if (peek() === '(') {
      i += 1;
      v = expr();
      expectCh(')');
    } else {
      const d = s.slice(i).match(/^\d+/);
      if (d) {
        i += d[0].length;
        v = Number(d[0]);
      } else {
        const ch = peek();
        assert.ok(ch !== undefined && ch in env, `Số mũ lạ trong ${src}`);
        i += 1;
        v = env[ch]!;
      }
    }
    return neg ? -v : v;
  }
  function power(): number {
    const base = atom();
    if (peek() === '^') {
      i += 1;
      return base ** expAtom();
    }
    return base;
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
  function term(): number {
    let v = unary();
    for (;;) {
      const c = peek();
      if (c === '*' || c === '·' || c === '×') {
        i += 1;
        v *= unary();
      } else if (c === '/') {
        i += 1;
        v /= unary();
      } else if (startsFactor()) {
        v *= power();
      } else return v;
    }
  }
  function expr(): number {
    let v = term();
    while (peek() === '+' || peek() === '-') {
      const op = peek();
      i += 1;
      const t = term();
      v = op === '+' ? v + t : v - t;
    }
    return v;
  }
  const v = expr();
  assert.equal(i, s.length, `Không đọc hết biểu thức: ${src} (dừng ở ${i})`);
  return v;
}

/** Bỏ "y = " / "V(t) = " ở đầu một lựa chọn. */
const rhs = (display: string) => display.replace(/^[A-Za-z]\w*(\([a-z]\))? = /, '');

/**
 * Kiểm lựa chọn là BIỂU THỨC: đáp án đúng bằng `expected` tại mọi điểm thử,
 * còn mỗi nhiễu phải lệch ở ít nhất một điểm.
 */
function checkExprChoices(d: MathItemDraft, expected: (env: Record<string, number>) => number, vars: string[], strip = true) {
  const m = mcq(d);
  const points = [0.37, 1.61, 2.3, 3.7, 5.3].map((base, k) =>
    Object.fromEntries(vars.map((v, j) => [v, base + 0.41 * j + 0.13 * k])),
  );
  m.choices.forEach((c, idx) => {
    const src = strip ? rhs(c.display) : c.display;
    const same = points.every((env) => close(evalM(src, env), expected(env), 1e-6));
    if (idx === m.correctIndex) assert.ok(same, `Đáp án "${c.display}" không khớp lời giải. Đề: ${d.stem}`);
    else assert.ok(!same, `Nhiễu "${c.display}" cũng khớp lời giải — hai đáp án đúng. Đề: ${d.stem}`);
  });
}

/** Kiểm lựa chọn chữ: đúng là chuỗi `expected`, và không nhiễu nào trùng. */
function expectText(d: MathItemDraft, expected: string) {
  assert.equal(correctDisplay(d), expected, `Đề: ${d.stem}`);
}

// --------------------------- kiểm chứng riêng từng template, đọc ngược từ đề

type Verifier = (d: MathItemDraft) => void;

const ORD: Record<string, number> = { square: 2, cube: 3 };
const ordN = (w: string) => ORD[w] ?? Number(w.replace(/th$/, ''));

function logBase(v: number, r: number): number | null {
  let e = 0;
  let x = 1;
  while (x < v) {
    x *= r;
    e += 1;
  }
  return x === v ? e : null;
}

const LABELS = {
  'lin-up': 'Linear growth',
  'lin-down': 'Linear decay',
  'exp-up': 'Exponential growth',
  'exp-down': 'Exponential decay',
} as const;

/** Phân loại một tình huống bằng lời, độc lập với template. */
function classify(t: string): keyof typeof LABELS {
  const exp = /doubles|triples|splits into|Half of the remaining|of its current value/.test(t);
  const lin = /of its original|adds \d+|gains \d+|gives away \d+|loses \d+ liters|increases in height by \d+|decreases in height by \d+/.test(t);
  assert.ok(exp !== lin, `Không phân loại được: ${t}`);
  const down = /loses|gives away|decreases|decays|Half/.test(t);
  return `${exp ? 'exp' : 'lin'}-${down ? 'down' : 'up'}` as keyof typeof LABELS;
}

/** Các chữ cái biến trong một biểu thức markup. */
function lettersOf(src: string): string[] {
  return [...new Set(src.replace(/frac|sqrt|pi/g, '').match(/[A-Za-z]/g) ?? [])];
}

/** "Which of the following is equivalent to EXPR?" — so từng lựa chọn với EXPR tại nhiều điểm. */
function equivalentTo(d: MathItemDraft) {
  const m = match(d.stem, /equivalent to (.+?)(?:, for .+)?\?$/);
  const expr = m[1]!;
  checkExprChoices(d, (env) => evalM(expr, env), lettersOf(expr), false);
}

/**
 * Lựa chọn dạng "X = biểu thức": thế ngược X vào công thức gốc L = R tại nhiều
 * điểm. Đáp án đúng phải thoả mọi điểm; nhiễu phải sai ở ít nhất một điểm.
 */
function checkIsolation(d: MathItemDraft, L: string, R: string, target: string) {
  const vars = lettersOf(`${L} ${R}`).filter((v) => v !== target);
  const points = [0, 1, 2, 3].map((k) => Object.fromEntries(vars.map((v, j) => [v, 1.37 + 0.53 * j + 0.29 * k + 0.11 * j * k])));
  const c = mcq(d);
  c.choices.forEach((ch, i) => {
    const expr = ch.display.replace(new RegExp(`^${target} = `), '');
    const ok = points.every((env) => {
      const X = evalM(expr, env);
      if (!Number.isFinite(X)) return false;
      const full = { ...env, [target]: X };
      return close(evalM(L, full), evalM(R, full), 1e-6);
    });
    if (i === c.correctIndex) assert.ok(ok, `Đáp án "${ch.display}" không thoả công thức. Đề: ${d.stem}`);
    else assert.ok(!ok, `Nhiễu "${ch.display}" cũng thoả công thức. Đề: ${d.stem}`);
  });
}

/** "L = R" tuyến tính theo x, y → [a, b, c] với ax + by = c. */
function lin2(eq: string): [number, number, number] {
  const [L, R] = eq.split(' = ');
  assert.ok(L !== undefined && R !== undefined, `Không tách được phương trình: ${eq}`);
  const F = (x: number, y: number) => evalM(L, { x, y }) - evalM(R, { x, y });
  const c0 = F(0, 0);
  return [F(1, 0) - c0, F(0, 1) - c0, -c0];
}

function solve2(e1: string, e2: string): [number, number] {
  const [a1, b1, c1] = lin2(e1);
  const [a2, b2, c2] = lin2(e2);
  const det = a1 * b2 - a2 * b1;
  assert.ok(Math.abs(det) > 1e-9, 'Hệ không có nghiệm duy nhất.');
  return [(c1 * b2 - c2 * b1) / det, (a1 * c2 - a2 * c1) / det];
}

/** Lựa chọn là cặp "(x, y)": chỉ đáp án đúng khớp nghiệm. */
function checkPair(d: MathItemDraft, x: number, y: number) {
  const c = mcq(d);
  c.choices.forEach((ch, i) => {
    const m = match(ch.display, /^\((-?[\d.]+), (-?[\d.]+)\)$/);
    const ok = close(N(m[1]), x) && close(N(m[2]), y);
    assert.equal(ok, i === c.correctIndex, `${ch.display} vs (${x}, ${y}). Đề: ${d.stem}`);
  });
}

function gcd(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y !== 0) [x, y] = [y, x % y];
  return x;
}

/** Tổ hợp La Mã đúng từ bảng chân trị (tự dựng, không đọc template). */
function romanText(truth: boolean[]): string {
  const R = ['I', 'II', 'III'];
  const on = truth.map((t, i) => (t ? R[i]! : '')).filter(Boolean);
  if (on.length === 0) return 'None of them';
  if (on.length === 1) return `${on[0]} only`;
  if (on.length === 2) return `${on[0]} and ${on[1]} only`;
  return 'I, II, and III';
}

const VERIFIERS: Record<string, Verifier> = {
  // ------------------------------------------------ Chương 1
  'pd-c-neg-frac-exp': (d) => {
    const m = match(d.stem, /^If ([a-z])\^\(-frac\(1,(\d+)\)\) = (frac\(1,)?(\d+)\)?, what is the value of \1\?$/);
    expectAnswer(d, m[3] ? rat(N(m[4]) ** N(m[2])) : rat(1, N(m[4]) ** N(m[2])));
  },
  'pd-c-power-of-one-sum': (d) => {
    const a = d.stem.match(/^Let n = 1\^(\d+) \+ 1\^(\d+) \+ 1\^(\d+) \+ \.\.\. \+ 1\^(\d+)\. What is the value of n\?$/);
    if (a) {
      const s = N(a[1]);
      assert.equal(N(a[2]), 2 * s);
      expectAnswer(d, N(a[4]) / s);
      return;
    }
    const b = match(d.stem, /^Let n = \(-1\)\^1 \+ \(-1\)\^2 \+ \(-1\)\^3 \+ \.\.\. \+ \(-1\)\^(\d+)\./);
    let sum = 0;
    for (let k = 1; k <= N(b[1]); k += 1) sum += (-1) ** k;
    expectAnswer(d, sum);
  },
  'pd-c-common-base-mcq': (d) => {
    const m = match(d.stem, /^If (\d+)\^\((\d*)([a-z]) \+ (\d+)\) = (\d+)\^\(\3 \+ (\d+)\), what is the value of \3\?$/);
    const [B1, a, b, B2, c] = [N(m[1]), coef(m[2]), N(m[4]), N(m[5]), N(m[6])];
    const r = [2, 3].find((rr) => logBase(B1, rr) !== null && logBase(B2, rr) !== null)!;
    const p = logBase(B1, r)!;
    const q = logBase(B2, r)!;
    expectAnswer(d, rat(q * c - p * b, p * a - q));
  },
  'pd-c-exp-quotient-relation': (d) => {
    const q = d.stem.match(/^If frac\((\d+)\^x,(\d+)\^y\) = (\d+)\^(\d+), then x must equal$/);
    if (q) {
      const [b1, b2, b3, k] = [N(q[1]), N(q[2]), N(q[3]), N(q[4])];
      const e1 = b1 === b2 ? 1 : 2;
      assert.equal(b2, b3);
      if (e1 === 2) assert.equal(b1, b2 * b2);
      checkExprChoices(d, (env) => (env.y! + k) / e1, ['y']);
      return;
    }
    const p = match(d.stem, /^If (\d+)\^x · \1\^y = \1\^(\d+), then x must equal$/);
    checkExprChoices(d, (env) => N(p[2]) - env.y!, ['y']);
  },
  'pd-c-exp-shift': (d) => {
    const m = match(d.stem, /^If (\d+)\^([a-z]) = (\d+), what is the value of \1\^\(\2 ([+-]) (\d+)\)\?$/);
    const [b, n, k] = [N(m[1]), N(m[3]), N(m[5])];
    expectAnswer(d, m[4] === '-' ? rat(n, b ** k) : rat(n * b ** k));
  },
  'pd-c-exp-product-combine': (d) => {
    const m = match(d.stem, /^If x\^(\d+)y\^(\d+) = (\d+) and x\^\2y\^\1 = (\d+), what is the value of x\^(\d+)y\^\5\?$/);
    assert.equal(N(m[1]) + N(m[2]), N(m[5]));
    expectAnswer(d, N(m[3]) * N(m[4]));
  },
  'pd-c-signed-power-compare': (d) => {
    const m = match(d.stem, /^If ([a-z]) and ([a-z]) are positive (even|odd) integers(?: and \1 > 1)?, which of the following is (greatest|least)\?$/);
    const [u, v] = [m[1]!, m[2]!];
    const samples = m[3] === 'even' ? [[2, 2], [4, 2], [2, 4], [6, 2]] : [[3, 1], [3, 3], [5, 1], [7, 3]];
    const c = mcq(d);
    for (const [a, b] of samples) {
      const vals = c.choices.map((ch) => evalM(ch.display, { [u]: a!, [v]: b! }));
      const best = vals[c.correctIndex]!;
      vals.forEach((val, i) => {
        if (i !== c.correctIndex) assert.ok(m[4] === 'greatest' ? best > val : best < val, `${c.choices[i]!.display} không thua đáp án. Đề: ${d.stem}`);
      });
    }
  },
  'pd-c-frac-exp-to-root': (d) => {
    const f = d.stem.match(/^Which of the following is equivalent to ([a-z])\^\(frac\((\d+),(\d+)\)\), for \1 > 0\?$/);
    if (f) {
      const [v, m, n] = [f[1]!, N(f[2]), N(f[3])];
      const ordW = n === 2 ? 'square' : n === 3 ? 'cube' : `${n}th`;
      expectText(d, `the ${ordW} root of ${m === 1 ? v : `${v}^${m}`}`);
      return;
    }
    const b = match(d.stem, /^Which of the following is equal to the (\w+) root of ([a-z])(?:\^(\d+))?, for \2 > 0\?$/);
    const [n, v, m] = [ordN(b[1]!), b[2]!, b[3] ? N(b[3]) : 1];
    checkExprChoices(d, (env) => env[v]! ** (m / n), [v], false);
  },
  'pd-c-exp-equate-power': (d) => {
    const m = match(d.stem, /^If x\^(\d+) = y\^(\d+), for what value of z does x\^\((\d*)z\) = y\^(\d+)\?$/);
    const [p, q, c, e] = [N(m[1]), N(m[2]), coef(m[3]), N(m[4])];
    // y^e = x^(p·e/q)
    expectAnswer(d, rat(p * e, q * c));
  },
  'pd-c-exp-factor-out': (d) => {
    const m = match(d.stem, /^If (?:(\d+) · )?(\d+)\^\(([a-z]) \+ (\d+)\) ([+-]) \2\^\3 = k\(\2\^\3\), what is the value of k\?$/);
    const [mm, b, s] = [m[1] ? N(m[1]) : 1, N(m[2]), N(m[4])];
    expectAnswer(d, mm * b ** s + (m[5] === '-' ? -1 : 1));
  },
  'pd-c-nested-radical-exp': (d) => {
    const m = match(d.stem, /^If (.+) = ([a-z])\^a for all \2 > 0, what is the value of a\?$/);
    const x = 2.7;
    const a = Math.log(evalM(m[1]!, { [m[2]!]: x })) / Math.log(x);
    assert.ok(close(toDecimal(answerOf(d)), a), `a = ${a}. Đề: ${d.stem}`);
  },
  'pd-c-radical-coef-solve': (d) => {
    const a = d.stem.match(/^If (\d+)sqrt\(x \+ (\d+)\) = (\d*)sqrt\((\d+)\) and x > 0, what is the value of x\?$/);
    if (a) {
      const [k, c, b, dd] = [N(a[1]), N(a[2]), coef(a[3]), N(a[4])];
      const x = rat(b * b * dd - c * k * k, k * k);
      expectAnswer(d, x);
      assert.ok(toDecimal(x) > 0);
      return;
    }
    const b = match(d.stem, /^If (\d+)sqrt\((\d+)\) = sqrt\((\d*)x\), what is the value of x\?$/);
    expectAnswer(d, rat(N(b[1]) ** 2 * N(b[2]), coef(b[3])));
  },
  'pd-c-exp-sum-factor': (d) => {
    const m = match(d.stem, /x\^(\d+), x > 1, and [a-z] [+-] [a-z] = (\d+), what is the value of [a-z]\?$/);
    expectAnswer(d, rat(N(m[1]), N(m[2])));
  },
  'pd-c-power-system-grid': (d) => {
    const m = match(d.stem, /^If n\^(\d+) = x and n\^(\d+) = (\d+)x, where n > 0, what is the value of x\?$/);
    const gap = N(m[2]) - N(m[1]);
    const n = Math.round(N(m[3]) ** (1 / gap));
    assert.equal(n ** gap, N(m[3]));
    expectAnswer(d, n ** N(m[1]));
  },
  'pd-c-exp-quotient-combine': (d) => {
    const m = match(d.stem, /^If x\^(\d+)y\^(\d+) = (\d+) and x\^(\d+)y\^(\d+) = (\d+), what is the value of xy\?$/);
    assert.equal(N(m[1]) - N(m[4]), 1);
    assert.equal(N(m[2]) - N(m[5]), 1);
    expectAnswer(d, rat(N(m[3]), N(m[6])));
  },
  // ------------------------------------------------ Chương 2
  'pd-c-pct-larger-than': (d) => {
    const m = match(d.stem, /is (\d+)% greater than .+?, and .+? is (\d+)% greater than .+?\. .+ is what percent greater than .+\?$/);
    expectNear(d, ((100 + N(m[1])) / (100 + N(m[2])) - 1) * 100);
  },
  'pd-c-compound-base-expr': (d) => {
    const g = d.stem.match(/earns ([a-z])% interest compounded annually/);
    const l = d.stem.match(/loses ([a-z])% of its value each year/);
    const v = (g ?? l)![1]!;
    checkExprChoices(d, (env) => 1 + (g ? 1 : -1) * (env[v]! / 100), [v]);
  },
  'pd-c-survey-scale-grid': (d) => {
    const m = match(d.stem, /it is estimated that ([\d,]+) of all ([\d,]+) /);
    expectAnswer(d, rat(N(m[1]) * 100, N(m[2])));
  },
  'pd-c-pct-table-share': (d) => {
    const f = d.figure;
    assert.ok(f && f.kind === 'data_table' && f.totalRow);
    const col = (name: string) => f.columns.indexOf(name) - 1;
    const a = d.stem.match(/percent of all \w+ that were in the (\w+) category\?$/);
    if (a) {
      const j = col(a[1]!);
      expectNear(d, Math.round((Number(f.totalRow.cells[j]) / Number(f.totalRow.cells[3])) * 100));
      return;
    }
    const b = match(d.stem, /of the \w+ in the (\w+) category, .+ percent that were from (.+)\?$/);
    const j = col(b[1]!);
    const row = f.rows.find((r) => r.label === b[2])!;
    expectNear(d, Math.round((Number(row.cells[j]) / Number(f.totalRow.cells[j])) * 100));
  },
  'pd-c-pct-table-which': (d) => {
    const f = d.figure;
    assert.ok(f && f.kind === 'data_table');
    const m = match(d.stem, /for (.+), which category accounted for approximately (\d+)% of the \w+\?$/);
    const row = f.rows.find((r) => r.label === m[1])!;
    const cells = row.cells.slice(0, 3).map(Number);
    const tot = cells[0]! + cells[1]! + cells[2]!;
    const hits = cells.map((c, j) => (Math.round((c / tot) * 100) === N(m[2]) ? j : -1)).filter((j) => j >= 0);
    assert.equal(hits.length, 1, `Có ${hits.length} loại khớp ${m[2]}%. Đề: ${d.stem}`);
    expectText(d, f.columns[hits[0]! + 1]!);
  },
  'pd-c-pct-table-change': (d) => {
    const f = d.figure;
    assert.ok(f && f.kind === 'data_table');
    const m = match(d.stem, /^Based on the table, the number of (\w+) \w+ for (.+?) was approximately what percent (less|greater) than the number for (.+)\?$/);
    const j = f.columns.indexOf(m[1]!) - 1;
    const to = Number(f.rows.find((r) => r.label === m[2])!.cells[j]);
    const from = Number(f.rows.find((r) => r.label === m[4])!.cells[j]);
    assert.ok(m[3] === 'less' ? to < from : to > from, 'Chiều thay đổi sai.');
    expectNear(d, Math.round((Math.abs(to - from) / from) * 100));
  },
  'pd-c-pct-repeated-remove': (d) => {
    const m = match(d.stem, /Each day, (\d+)% of .+ At the end of day (\d+), (\d+) \w+ remain\./);
    expectNear(d, N(m[3]) / (1 - N(m[1]) / 100) ** N(m[2]), 1e-6);
  },
  'pd-c-pct-discount-tax-solve': (d) => {
    const m = match(d.stem, /was \$([\d,.]+)\. The price was reduced by (\d+)%, .+ total paid was \$([\d,.]+), what is the value of x\?$/);
    const D = N(m[1]) * (1 - N(m[2]) / 100);
    expectNear(d, (N(m[3]) / D - 1) * 100, 1e-6);
  },
  'pd-c-pct-greater-reverse': (d) => {
    const m = match(d.stem, /was (\d+)% (greater|less) than .+ If .+ served (\d+) customers/);
    expectAnswer(d, rat(N(m[3]) * 100, 100 + (m[2] === 'greater' ? 1 : -1) * N(m[1])));
  },
  'pd-c-pct-weighted-increase': (d) => {
    const m = match(d.stem, /cost \$([\d,]+) and .+ cost \$([\d,]+)\. .+ increased by (\d+)% and .+ increased by (\d+)%\./);
    const [P1, P2, a, b] = [N(m[1]), N(m[2]), N(m[3]), N(m[4])];
    expectNear(d, (P1 * a + P2 * b) / (P1 + P2));
  },
  'pd-c-pct-loss-gain-expr': (d) => {
    const m = match(d.stem, /lost (\d+)% .+ gained (\d+)% .+ was ([a-z]) dollars/);
    const [a, b, v] = [N(m[1]), N(m[2]), m[3]!];
    checkExprChoices(d, (env) => env[v]! / ((1 - a / 100) * (1 + b / 100)), [v]);
  },
  'pd-c-pct-decline-approx': (d) => {
    const m = match(d.stem, /had ([\d,]+) \w+ at the start .+ decreased by (\d+)% each year\. .+ (\d+) years after/);
    expectAnswer(d, Math.round(N(m[1]) * (1 - N(m[2]) / 100) ** N(m[3])));
  },
  'pd-c-simple-interest-model': (d) => {
    const s = d.stem.match(/lends \$([\d,]+) at a simple interest rate of (\d+)% per year/);
    if (s) {
      checkExprChoices(d, (env) => N(s[1]) * (1 + (N(s[2]) / 100) * env.t!), ['t']);
      return;
    }
    const c = match(d.stem, /^\$([\d,]+) is deposited in an account that earns (\d+)% interest compounded annually/);
    checkExprChoices(d, (env) => N(c[1]) * (1 + N(c[2]) / 100) ** env.t!, ['t']);
  },
  'pd-c-pct-category-shift': (d) => {
    const m = match(d.stem, /has (\d+)% .+?, (\d+)% .+?, and the remaining (\d+) /);
    const [a, b, nC] = [N(m[1]), N(m[2]), N(m[3])];
    const total = nC / (1 - (a + b) / 100);
    expectAnswer(d, toR((total * a) / 100 + (total * b) / 200));
  },
  'pd-c-compound-two-accounts': (d) => {
    const m = match(d.stem, /deposits \$([\d,]+) .+ earns (\d+)% .+ deposits \$([\d,]+) .+ earns (\d+)% .+ after (\d+) years\?$/);
    const t = N(m[5]);
    const I = (P: number, r: number) => P * (1 + r / 100) ** t - P;
    expectAnswer(d, Math.round(I(N(m[1]), N(m[2])) - I(N(m[3]), N(m[4]))));
  },
  'pd-c-growth-every-k': (d) => {
    const g = d.stem.match(/investment of \$([\d,]+) earns (\d+)% interest, compounded once every (\d+) years/);
    const l = d.stem.match(/covered ([\d,]+) acres in 2020\. Its area decreases by (\d+)% every (\d+) years/);
    const m = (g ?? l)!;
    assert.ok(m, d.stem);
    const f = 1 + (g ? 1 : -1) * (N(m[2]) / 100);
    checkExprChoices(d, (env) => N(m[1]) * f ** (env.t! / N(m[3])), ['t']);
  },

  // ------------------------------------------------ Chương 3
  'pd-c-exp-model-from-two-points': (d) => {
    const m = match(d.stem, /^There were ([\d,]+) .+ in (\d+) and ([\d,]+) in (\d+)\. If the number changes by the same percent/);
    const [P0, y0, P2, y2] = [N(m[1]), N(m[2]), N(m[3]), N(m[4])];
    checkExprChoices(d, (env) => P0 * (P2 / P0) ** (env.t! / (y2 - y0)), ['t']);
  },
  'pd-c-linear-model-from-two-points': (d) => {
    const m = match(d.stem, /^There were (\d+) .+ in (\d+) and (\d+) in (\d+)\. If the number changed linearly/);
    const [P0, y0, P1, y1] = [N(m[1]), N(m[2]), N(m[3]), N(m[4])];
    checkExprChoices(d, (env) => P0 + ((P1 - P0) / (y1 - y0)) * env.t!, ['t']);
  },
  'pd-c-scatter-association': (d) => {
    const f = d.figure;
    assert.ok(f && f.kind === 'scatterplot');
    const n = f.points.length;
    const mx = f.points.reduce((s, p) => s + p.x, 0) / n;
    const my = f.points.reduce((s, p) => s + p.y, 0) / n;
    let sxy = 0;
    let sxx = 0;
    let syy = 0;
    for (const p of f.points) {
      sxy += (p.x - mx) * (p.y - my);
      sxx += (p.x - mx) ** 2;
      syy += (p.y - my) ** 2;
    }
    const r = sxy / Math.sqrt(sxx * syy);
    const label = r > 0.8 ? 'A positive linear association' : r < -0.8 ? 'A negative linear association' : Math.abs(r) < 0.2 ? 'No apparent association' : '';
    assert.ok(label, `r = ${r} nằm ở vùng mơ hồ.`);
    expectText(d, label);
  },
  'pd-c-scenario-classify': (d) => {
    const m = match(d.stem, /^(.+\.) Which of the following best describes how the quantity changes over time\?$/);
    expectText(d, LABELS[classify(m[1]!)]);
  },
  'pd-c-exp-model-params': (d) => {
    const a = d.stem.match(/starts with (\d+) cells\. Every hour, each cell splits into (\d+) cells/);
    const b = d.stem.match(/contains (\d+) grams .+ Each hour, (\d+)% of the substance/);
    const [c, r] = a ? [N(a[1]), N(a[2])] : [N(b![1]), 1 - N(b![2]) / 100];
    const got = match(correctDisplay(d), /^c = ([\d.]+) and r = ([\d.]+)$/);
    assert.ok(close(N(got[1]), c) && close(N(got[2]), r), `${correctDisplay(d)}. Đề: ${d.stem}`);
  },
  'pd-c-scenario-pick': (d) => {
    const m = match(d.stem, /^Which of the following situations is an example of (.+)\?$/);
    const target = (Object.keys(LABELS) as Array<keyof typeof LABELS>).find((k) => LABELS[k].toLowerCase() === m[1])!;
    const c = mcq(d);
    c.choices.forEach((ch, i) => {
      const k = classify(ch.display);
      if (i === c.correctIndex) assert.equal(k, target, `${ch.display}`);
      else assert.notEqual(k, target, `Nhiễu cũng đúng: ${ch.display}`);
    });
  },

  // ------------------------------------------------ Chương 4
  'pd-c-scale-formula-effect': (d) => {
    const m = match(d.stem, /^The formula ([A-Za-z]) = (.+?) gives .+?\. If (.+), which of the following describes the effect on \1\?$/);
    const rhsSrc = m[2]!;
    const letters = [...new Set(rhsSrc.replace(/frac|pi/g, '').match(/[A-Za-z]/g) ?? [])];
    const base = Object.fromEntries(letters.map((l, i) => [l, 1.3 + 0.7 * i]));
    const scaled = { ...base };
    const WORD: Record<string, number> = { doubled: 2, tripled: 3, quadrupled: 4, halved: 0.5, 'cut to one-third': 1 / 3 };
    const re = /(?:both ([a-z]) and ([a-z]) are|([A-Za-z]) is) (doubled|tripled|quadrupled|halved|cut to one-third)/g;
    let hit = 0;
    for (const c of m[3]!.matchAll(re)) {
      hit += 1;
      for (const v of [c[1], c[2], c[3]].filter(Boolean) as string[]) scaled[v] = scaled[v]! * WORD[c[4]!]!;
    }
    assert.ok(hit >= 1, d.stem);
    const ratio = evalM(rhsSrc, scaled) / evalM(rhsSrc, base);
    const got = match(correctDisplay(d), /is (unchanged|multiplied by (.+))\.$/);
    const val = got[1] === 'unchanged' ? 1 : toDecimal(tryValue(got[2]!)!);
    assert.ok(close(val, ratio), `Hệ số ${val}, tính lại được ${ratio}. Đề: ${d.stem}`);
  },
  'pd-c-scale-percent-change': (d) => {
    const m = match(d.stem, /^A (.+?) is changed so that (.+)\. Which of the following describes the change in the (area|volume) of the \1\?$/);
    const EXP: Record<string, number> = {
      'square/side length': 2,
      'cube/edge length': 3,
      'circle/radius': 2,
      'sphere/radius': 3,
      'rectangle/length': 1,
      'rectangle/width': 1,
      'right circular cylinder/radius': 2,
      'right circular cylinder/height': 1,
      'right circular cone/radius': 2,
      'right circular cone/height': 1,
    };
    let f = 1;
    for (const c of m[2]!.matchAll(/its ([a-z ]+?) is (increased|decreased) by (\d+)%/g)) {
      const e = EXP[`${m[1]}/${c[1]}`];
      assert.ok(e, `Không biết số mũ của ${c[1]} trong ${m[1]}`);
      f *= (1 + (c[2] === 'increased' ? 1 : -1) * (N(c[3]) / 100)) ** e;
    }
    const got = correctDisplay(d) === 'There is no change.' ? null : match(correctDisplay(d), /^It (increases|decreases) by ([\d.]+)%\.$/);
    const val = got ? (got[1] === 'increases' ? 1 : -1) * N(got[2]) : 0;
    assert.ok(close(val, (f - 1) * 100, 1e-6), `${val} vs ${(f - 1) * 100}. Đề: ${d.stem}`);
  },
  'pd-c-scale-root-factor': (d) => {
    const m = match(d.stem, /^The (volume|area) of a (\w+) is multiplied by (\d+)\./);
    expectNear(d, Math.round(N(m[3]) ** (1 / (m[1] === 'volume' ? 3 : 2)) * 100) / 100, 1e-9);
  },
  'pd-c-scale-area-percent-back': (d) => {
    const a = d.stem.match(/its area is ([\d.]+)% of the original area/);
    const b = d.stem.match(/its area (increases|decreases) by ([\d.]+)%/);
    const areaF = a ? N(a[1]) / 100 : 1 + (b![1] === 'increases' ? 1 : -1) * (N(b![2]) / 100);
    expectNear(d, Math.abs(Math.sqrt(areaF) - 1) * 100, 1e-6);
  },
  'pd-c-scale-solve-inverse': (d) => {
    const m = match(d.stem, /^The formula ([A-Za-z]) = (.+?) gives .+?\. Objects \w and \w have the same value of \1\. The (.+?) for \w is (.+?) times the \3 for \w\. The (.+?) for \w is how many times the \5 for \w\?$/);
    const WORD: Record<string, string> = { power: 'P', mass: 'm', speed: 'v', height: 'h', radius: 'r', 'distance from the listener': 'r', distance: 'd', 'light received per unit area': 's' };
    const [g, a] = [WORD[m[3]!]!, WORD[m[5]!]!];
    const rhsSrc = m[2]!;
    const letters = [...new Set(rhsSrc.replace(/frac|pi/g, '').match(/[A-Za-z]/g) ?? [])];
    const env = Object.fromEntries(letters.map((l, i) => [l, 1.5 + 0.5 * i]));
    const expOf = (v: string) => Math.log2(evalM(rhsSrc, { ...env, [v]: env[v]! * 2 }) / evalM(rhsSrc, env));
    const ratio = toDecimal(tryValue(m[4]!)!);
    assert.ok(close(toDecimal(answerOf(d)), ratio ** (-expOf(g) / expOf(a))), `Đề: ${d.stem}`);
  },

  // ------------------------------------------------ Chương 5
  'pd-c-rate-two-legs-expr': (d) => {
    const m = match(d.stem, /travels at x .+? for y \w+, and then travels at (half|one-third of|one-fourth of|one-fifth of) that speed for (\d+) times as long\./);
    const a = { half: 2, 'one-third of': 3, 'one-fourth of': 4, 'one-fifth of': 5 }[m[1]!]!;
    checkExprChoices(d, (e) => e.x! * e.y! * (1 + N(m[2]) / a), ['x', 'y']);
  },
  'pd-c-rate-daily-weekly-grid': (d) => {
    const m = match(d.stem, /needs (\d+) .+ each day\. Each \w+(?: \w+)? provides (\d+) .+ needed for (\d+) days\?$/);
    expectAnswer(d, rat(N(m[1]) * N(m[3]), N(m[2])));
  },
  'pd-c-rate-from-two-readings': (d) => {
    const a = d.stem.match(/was (\d+) in (\d+) and (\d+) in (\d+)\. If the number changed by the same amount each year/);
    if (a) {
      expectAnswer(d, rat(N(a[3]) - N(a[1]), N(a[4]) - N(a[2])));
      return;
    }
    const b = match(d.stem, /^At (\d+) .+?, .+ is (\d+) .+?\. At (\d+) .+?, it is (\d+) .+ for every (\d+) \w+\?$/);
    expectAnswer(d, rat((N(b[4]) - N(b[2])) * N(b[5]), N(b[3]) - N(b[1])));
  },
  'pd-c-rate-inverse-time-grid': (d) => {
    const m = match(d.stem, /at a rate of (\d+) .+ in (\d+) \w+\. At a rate of (\d+) /);
    expectAnswer(d, rat(N(m[1]) * N(m[2]), N(m[3])));
  },
  'pd-c-rate-unit-cost-expr': (d) => {
    const m = match(d.stem, /^If ([a-z]) .+ cost ([a-z]) dollars, what is the cost, in dollars, of (\d+) /);
    checkExprChoices(d, (e) => (N(m[3]) * e[m[2]!]!) / e[m[1]!]!, [m[1]!, m[2]!]);
  },
  'pd-c-rate-share-expr': (d) => {
    const m = match(d.stem, /buys ([a-z]) .+ contains (\d+) .+ among ([a-z]) .+, each with ([a-z]) /);
    checkExprChoices(d, (e) => (N(m[2]) * e[m[1]!]!) / (e[m[3]!]! * e[m[4]!]!), [m[1]!, m[3]!, m[4]!]);
  },
  'pd-c-rate-extrapolate': (d) => {
    const m = match(d.stem, /has (\d+) .+ left after \w+ (\d+) and (\d+) .+ left after \w+ (\d+)\. After which \w+ will it have exactly (\d+) /);
    const use = (N(m[1]) - N(m[3])) / (N(m[4]) - N(m[2]));
    expectAnswer(d, toR(N(m[4]) + (N(m[3]) - N(m[5])) / use));
  },
  'pd-c-rate-clock-total': (d) => {
    const m = match(d.stem, /^By (\d+):(\d+) (a|p)\.m\., .+ a total of (\d+) .+ By (\d+):(\d+) (a|p)\.m\., the total was (\d+) .+ by (\d+):(\d+) (a|p)\.m\.\?$/);
    const t = (h: string, mm: string, ap: string) => ((N(h) % 12) + (ap === 'p' ? 12 : 0)) * 60 + N(mm);
    const [t1, t2, t3] = [t(m[1]!, m[2]!, m[3]!), t(m[5]!, m[6]!, m[7]!), t(m[9]!, m[10]!, m[11]!)];
    const rate = (N(m[8]) - N(m[4])) / (t2 - t1);
    expectAnswer(d, toR(N(m[8]) + rate * (t3 - t2)));
  },
  'pd-c-rate-budget-weeks-expr': (d) => {
    const m = match(d.stem, /earns ([a-z]) dollars each week and spends (one-half|one-third|one-fourth|one-fifth|one-sixth) of it .+ a total of \$(\d+) /);
    const k = { 'one-half': 2, 'one-third': 3, 'one-fourth': 4, 'one-fifth': 5, 'one-sixth': 6 }[m[2]!]!;
    checkExprChoices(d, (e) => (k * N(m[3])) / e[m[1]!]!, [m[1]!]);
  },
  'pd-c-rate-fee-expr': (d) => {
    const m = match(d.stem, /fee of \$(\d+) and a .+ fee of \$(\d+)\./);
    checkExprChoices(d, (e) => N(m[1]) * e.c! + N(m[2]) * e.c! * e.m!, ['c', 'm']);
  },
  'pd-c-rate-temp-expr': (d) => {
    const m = match(d.stem, /is t \w+ and rises (\d+) \w+ every (\d+) minutes/);
    checkExprChoices(d, (e) => e.t! + (N(m[1]) / N(m[2])) * e.x!, ['t', 'x']);
  },
  'pd-c-rate-discount-additional-expr': (d) => {
    const m = match(d.stem, /The first one costs \$(\d+), and each additional one costs (\d+)% less than the first/);
    checkExprChoices(d, (e) => N(m[1]) + (e.n! - 1) * (1 - N(m[2]) / 100) * N(m[1]), ['n']);
  },
  'pd-c-rate-boxes-expr': (d) => {
    const m = match(d.stem, /If (\d+)x \w+(?: \w+)?s work for (\d+) days/);
    checkExprChoices(d, (e) => (N(m[1]) * e.x! * e.y! * N(m[2])) / e.x!, ['x', 'y']);
  },
  'pd-c-rate-pizza-expr': (d) => {
    const m = match(d.stem, /For (\d+) days, every one of the \w+ gets (\d+) .+ per day, and each \w+ provides (\d+) /);
    checkExprChoices(d, (e) => (e.m! * e.n! * N(m[1]) * N(m[2])) / N(m[3]), ['m', 'n']);
  },
  'pd-c-pct-change-expr-power': (d) => {
    const m = match(d.stem, /is (\d+)\(1 \+ frac\(([a-z]),100\)\)\^t dollars.+ over the first (\d+) years\?$/);
    const v = m[2]!;
    checkExprChoices(d, (e) => 100 * ((1 + e[v]! / 100) ** N(m[3]) - 1), [v]);
  },
  'pd-c-avg-speed-two-legs': (d) => {
    const m = match(d.stem, /travels (\d+) miles at an average speed of (\d+) .+ travels (\d+) miles at an average speed of (\d+) /);
    const [d1, v1, d2, v2] = [N(m[1]), N(m[2]), N(m[3]), N(m[4])];
    expectNear(d, Math.round(((d1 + d2) / (d1 / v1 + d2 / v2)) * 100) / 100, 1e-9);
  },
  'pd-c-unit-convert-rate-grid': (d) => {
    const a = d.stem.match(/moves (\d+) feet in (\d+) minutes\. What is its speed in inches per second\?/);
    if (a) {
      expectAnswer(d, rat(N(a[1]) * 12, N(a[2]) * 60));
      return;
    }
    const b = match(d.stem, /travels ([\d.]+) meters in (\d+) minutes\. What is its speed in centimeters per second\?/);
    expectAnswer(d, toR((N(b[1]) * 100) / (N(b[2]) * 60)));
  },
  'pd-c-rate-scale-time-grid': (d) => {
    const m = match(d.stem, / (\d+) [a-z ]+ in ([\d.]+) minutes\. At this rate, how many .+ in (\d+) minutes\?$/);
    expectAnswer(d, toR((N(m[1]) / N(m[2])) * N(m[3])));
  },
  'pd-c-rate-area-growth-grid': (d) => {
    const m = match(d.stem, /grows from 0 to (\d+) \w+ in (\d+) minutes\. .+ radius be (\d+) /);
    expectAnswer(d, toR(N(m[2]) * (N(m[3]) / N(m[1])) ** 2));
  },
  'pd-c-slow-clock': (d) => {
    const m = match(d.stem, /correct time at (\d+):(\d+) (a|p)\.m\.\. When the clock shows (\d+):(\d+) (a|p)\.m\., the correct time is (\d+):(\d+) (a|p)\.m\.\. When the clock shows (\d+):(\d+) (a|p)\.m\. later/);
    const t = (h: string, mm: string, ap: string) => ((N(h) % 12) + (ap === 'p' ? 12 : 0)) * 60 + N(mm);
    const [s0, c1, a1, c2] = [t(m[1]!, m[2]!, m[3]!), t(m[4]!, m[5]!, m[6]!), t(m[7]!, m[8]!, m[9]!), t(m[10]!, m[11]!, m[12]!)];
    const actual = s0 + ((c2 - s0) * (a1 - s0)) / (c1 - s0);
    const h24 = Math.floor(actual / 60) % 24;
    const txt = `${h24 % 12 === 0 ? 12 : h24 % 12}:${String(actual % 60).padStart(2, '0')} ${h24 < 12 ? 'a.m.' : 'p.m.'}`;
    expectText(d, txt);
  },
  'pd-c-commission-grid': (d) => {
    const m = match(d.stem, /commission of \$(\d+) for every \$100 .+ sells for \$(\d+)\. .+ commission of \$([\d,.]+)\?$/);
    expectAnswer(d, toR(N(m[3]) / ((N(m[1]) / 100) * N(m[2]))));
  },
  'pd-c-rate-distance-closest': (d) => {
    const m = match(d.stem, /rides (\d+) kilometers in ([\d.]+) minutes\. .+ ride in ([\d.]+) hours\?$/);
    expectAnswer(d, Math.round((N(m[1]) * 60 * N(m[3])) / N(m[2])));
  },
  'pd-c-unit-max-full-cups': (d) => {
    const m = match(d.stem, /holds ([\d.]+) liters of [a-z ]+, and each cup holds (\d+) fluid ounces/);
    expectAnswer(d, Math.floor((33.8 * N(m[1])) / N(m[2]) + 1e-9));
  },
  'pd-c-fuel-cost-mpg': (d) => {
    const m = match(d.stem, /spends \$([\d.]+) .+ gets (\d+) miles per gallon\. .+ gets (\d+) miles per gallon/);
    expectNear(d, (N(m[1]) * N(m[2])) / N(m[3]));
  },
  'pd-c-cost-prop-area': (d) => {
    const m = match(d.stem, /that is (\d+) \w+ by (\d+) \w+ costs \$(\d+)\. .+ that is (\d+) \w+ by (\d+) \w+ cost\?$/);
    expectNear(d, (N(m[3]) * N(m[4]) * N(m[5])) / (N(m[1]) * N(m[2])));
  },
  'pd-c-buy-sell-profit-grid': (d) => {
    const m = match(d.stem, /at (\d+) for \$(\d+) and sells them at (\d+) for \$(\d+)\. .+ profit of \$(\d+)\?$/);
    const each = N(m[4]) / N(m[3]) - N(m[2]) / N(m[1]);
    expectAnswer(d, toR(Math.round((N(m[5]) / each) * 1e6) / 1e6));
  },
  'pd-c-rate-range-hours': (d) => {
    const m = match(d.stem, /at least (\d+) but no more than (\d+) .+ install (\d+) /);
    const [lo, hi] = [N(m[3]) / N(m[2]), N(m[3]) / N(m[1])];
    const c = mcq(d);
    c.choices.forEach((ch, i) => {
      const h = Number(ch.display);
      const ok = h >= lo - 1e-9 && h <= hi + 1e-9;
      assert.equal(ok, i === c.correctIndex, `Lựa chọn ${ch.display} (khoảng ${lo}–${hi}). Đề: ${d.stem}`);
    });
  },
  'pd-c-unit-chain-max-grid': (d) => {
    const m = match(d.stem, /holds (\d+) cups .+ contain (\d+) milliliters/);
    expectAnswer(d, Math.floor((N(m[1]) * 8 * 29.6) / N(m[2]) + 1e-9));
  },
  'pd-c-catch-up-grid': (d) => {
    const m = match(d.stem, /starts (\d+) meters ahead .+ moves at (\d+) meters per second\. Robot B moves at (\d+) meters per second/);
    const [h, v1, v2] = [N(m[1]), N(m[2]), N(m[3])];
    expectAnswer(d, toR((v2 * h) / (v2 - v1)));
  },

  // ------------------------------------------------ Chương 6
  'pd-c-factor-gcf': equivalentTo,
  'pd-c-add-fractions-var': equivalentTo,
  'pd-c-expand-product': equivalentTo,
  'pd-c-split-fraction': equivalentTo,
  'pd-c-factor-fully': equivalentTo,
  'pd-c-perfect-square-sub': equivalentTo,
  'pd-c-factor-cancel': equivalentTo,
  'pd-c-complex-fraction-sum': equivalentTo,
  'pd-c-complex-fraction-ratio': equivalentTo,
  'pd-c-poly-sum': equivalentTo,
  'pd-c-combine-radical-terms': equivalentTo,
  'pd-c-eval-monomial-ratio': (d) => {
    const m = match(d.stem, /^If y != 0, what is the value of (.+)\?$/);
    const a = evalM(m[1]!, { y: 1.7 });
    assert.ok(close(a, evalM(m[1]!, { y: 3.1 })), 'Biểu thức còn phụ thuộc y.');
    assert.ok(close(toDecimal(answerOf(d)), a), `Đề: ${d.stem}`);
  },

  // ------------------------------------------------ Chương 7
  'pd-c-sum-power-sub': (d) => {
    const m = match(d.stem, /^If (\d+)([a-z]) \+ \1([a-z]) = (-?\d+), what is the value of \(\2 \+ \3\)\^(\d+)\?$/);
    expectAnswer(d, (N(m[4]) / N(m[1])) ** N(m[5]));
  },
  'pd-c-square-both-sides-equal': (d) => {
    const m = match(d.stem, /^If \(([a-z]) - (\d+)\)\^2 = \(\1 \+ (\d+)\)\^2, what is the value of \1\?$/);
    const [a, b] = [N(m[2]), N(m[3])];
    expectAnswer(d, rat(a * a - b * b, 2 * (a + b)));
  },
  'pd-c-product-equation-expr': (d) => {
    const m = match(d.stem, /^If \(frac\((\d+),([a-z])\)\)\(frac\(([a-z]),([a-z])\)\) = (\d+),/);
    const [k, A, B, C, mm] = [N(m[1]), m[2]!, m[3]!, m[4]!, N(m[5])];
    const c = mcq(d);
    const pts = [
      [1.3, 2.9],
      [3.1, 0.7],
      [2.2, 4.4],
    ];
    c.choices.forEach((ch, i) => {
      const e = match(ch.display, /^(.+) = (-?\d+)$/);
      const ok = pts.every(([a, cc]) => close(evalM(e[1]!, { [A]: a!, [C]: cc!, [B]: (mm * a! * cc!) / k }), N(e[2]), 1e-9));
      assert.equal(ok, i === c.correctIndex, `${ch.display}. Đề: ${d.stem}`);
    });
  },
  'pd-c-solve-then-expression': (d) => {
    const m = match(d.stem, /^If (.+) = (-?\d+), what is the value of (.+)\?$/);
    const f0 = evalM(m[1]!, { x: 0 });
    const f1 = evalM(m[1]!, { x: 1 });
    const x = (N(m[2]) - f0) / (f1 - f0);
    expectAnswer(d, toR(Math.round(evalM(m[3]!, { x }) * 1e6) / 1e6));
  },
  'pd-c-frac-coef-solve': (d) => {
    const m = match(d.stem, /^If frac\((\d+),(\d+)\) = frac\((\d+),(\d+)\)([a-z]), what is the value of \5\?$/);
    expectAnswer(d, rat(N(m[1]) * N(m[4]), N(m[2]) * N(m[3])));
  },
  'pd-c-cross-mult-isolate': (d) => {
    const m = match(d.stem, /^If (.+) = (.+), which of the following expresses ([a-z]) in terms of x\?$/);
    checkIsolation(d, m[1]!, m[2]!, m[3]!);
  },
  'pd-c-square-neg-root': (d) => {
    const m = match(d.stem, /^If \(x ([+-]) (\d+)\)\^2 = (\d+) and x ([<>]) 0, what is the value of x\^2\?$/);
    const sh = (m[1] === '-' ? 1 : -1) * N(m[2]);
    const r = Math.sqrt(N(m[3]));
    const x = [sh + r, sh - r].find((v) => (m[4] === '<' ? v < 0 : v > 0))!;
    expectAnswer(d, toR(x * x));
  },
  'pd-c-isolate-formula': (d) => {
    const m = match(d.stem, /^The formula ([A-Za-z]) = (.+?) is used to .+\. Which of the following expresses ([A-Za-z]) in terms of/);
    checkIsolation(d, m[1]!, m[2]!, m[3]!);
  },
  'pd-c-ratio-flip': (d) => {
    const m = match(d.stem, /^If frac\(m,(\d*)n\) = (\d+), what is the value of frac\(n,(\d*)m\)\?$/);
    expectAnswer(d, rat(1, coef(m[1]) * N(m[2]) * coef(m[3])));
  },
  'pd-c-neg-root-solve': (d) => {
    const m = match(d.stem, /^If x < 0 and x\^2 - (\d+) = (\d+), what is the value of x\?$/);
    expectAnswer(d, toR(-Math.sqrt(N(m[1]) + N(m[2]))));
  },
  'pd-c-solve-expression-square': (d) => {
    const m = match(d.stem, /^If x\^2 \+ (\d+) = (\d+), what is the value of x\^2 ([+-]) (\d+)\?$/);
    expectAnswer(d, N(m[2]) - N(m[1]) + (m[3] === '-' ? -1 : 1) * N(m[4]));
  },
  'pd-c-high-degree-solve': (d) => {
    const m = match(d.stem, /^If x\^2\(x\^4 - (\d+)\) = (\d*)x\^4 and x > 0, what is the value of x\?$/);
    const [a, b] = [N(m[1]), coef(m[2])];
    const u = (b + Math.sqrt(b * b + 4 * a)) / 2;
    expectAnswer(d, toR(Math.sqrt(u)));
  },
  'pd-c-radical-solve-grid': (d) => {
    const m = match(d.stem, /^If frac\((\d+)sqrt\(x \+ (\d+)\),(\d+)\) = (\d+), what is the value of x\?$/);
    const sq = (N(m[4]) * N(m[3])) / N(m[1]);
    expectAnswer(d, toR(sq * sq - N(m[2])));
  },
  'pd-c-radical-collect-grid': (d) => {
    const m = match(d.stem, /^If (\d+) - sqrt\(x\) = frac\((\d+),(\d+)\)sqrt\(x\) \+ (\d+), what is the value of x\?$/);
    const r = (N(m[1]) - N(m[4])) / (1 + N(m[2]) / N(m[3]));
    expectAnswer(d, toR(Math.round(r * r * 1e6) / 1e6));
  },
  'pd-c-translate-twice': (d) => {
    const m = match(d.stem, /^If (.+) is (twice|three times|four times|five times) the quantity x - (\d+), what is the value of x\?$/);
    const k = { twice: 2, 'three times': 3, 'four times': 4, 'five times': 5 }[m[2]!]!;
    const f0 = evalM(m[1]!, { x: 0 });
    const f1 = evalM(m[1]!, { x: 1 }) - f0;
    expectAnswer(d, toR((-k * N(m[3]) - f0) / (f1 - k)));
  },
  'pd-c-proportion-then-recip': (d) => {
    const m = match(d.stem, /^If frac\(x,(\d+)\) = frac\(x \+ (\d+),(\d+)\), what is the value of frac\((\d+),x\)\?$/);
    const [p, a, q, r] = [N(m[1]), N(m[2]), N(m[3]), N(m[4])];
    expectAnswer(d, rat(r * (q - p), p * a));
  },
  'pd-c-formula-substitute-solve': (d) => {
    const m = match(d.stem, /^The formula ([a-z]) = frac\(([a-z])\(([a-z]) \+ (\d+)\),(\d+)\) gives .+ equal to frac\(1,(\d+)\) of \2\?$/);
    expectAnswer(d, rat(N(m[5]), N(m[6])).num / rat(N(m[5]), N(m[6])).den - N(m[4]));
  },
  'pd-c-isolate-linear-letters': (d) => {
    const m = match(d.stem, /^If (.+) = 0, which of the following expresses x in terms of y and z\?$/);
    checkIsolation(d, m[1]!, '0', 'x');
  },
  'pd-c-all-values-identity': (d) => {
    const m = match(d.stem, /^If (\d*)xy\^2 \+ (\d*)x - (\d*)y\^2 - (\d+) = 0 for all values of y/);
    const [A, B, C, D] = [coef(m[1]), coef(m[2]), coef(m[3]), N(m[4])];
    assert.equal(C * B, D * A, 'Hai hệ số không cho cùng một x.');
    expectAnswer(d, rat(C, A));
  },
  'pd-c-isolate-exponent-base': (d) => {
    const m = match(d.stem, /^The formula ([A-Za-z]) = (.+?) is used to .+\. Which of the following expresses ([a-z]) in terms of/);
    checkIsolation(d, m[1]!, m[2]!, m[3]!);
  },
  'pd-c-half-life-rate-approx': (d) => {
    const m = match(d.stem, /worth (half|one-third|one-fourth|two-thirds) of its purchase price after (\d+) years/);
    const f = { half: 1 / 2, 'one-third': 1 / 3, 'one-fourth': 1 / 4, 'two-thirds': 2 / 3 }[m[1]!]!;
    expectNear(d, Math.round((1 - f ** (1 / N(m[2]))) * 100) / 100, 1e-9);
  },

  // ------------------------------------------------ Chương 8
  'pd-c-match-coef-product': (d) => {
    const m = match(d.stem, /^If \((\d*)x \+ (\d+)\)\(ax - (\d+)\) = (\d+)x\^2 \+ bx - (\d+) for all values of x/);
    const [p, q, r, A] = [coef(m[1]), N(m[2]), N(m[3]), N(m[4])];
    const a = A / p;
    assert.equal(q * r, N(m[5]));
    expectAnswer(d, q * a - p * r);
  },
  'pd-c-square-cross-term': (d) => {
    const m = match(d.stem, /^If \(x \+ (\d*)y\)\^2 = x\^2 \+ (\d*)y\^2 ([+-]) (\d+), what is the value of (x\^2y\^2|xy)\?$/);
    const k = coef(m[1]);
    assert.equal(coef(m[2]), k * k);
    const xy = ((m[3] === '-' ? -1 : 1) * N(m[4])) / (2 * k);
    expectAnswer(d, toR(m[5] === 'xy' ? xy : xy * xy));
  },
  'pd-c-identity-split-fraction': (d) => {
    const m = match(d.stem, /^If frac\((\d*)([a-z])([a-z]) \+ \2,\3\) = frac\(\2,\3\) ([+-]) (\d+) for all nonzero values of \3, what is the value of \2\?$/);
    expectAnswer(d, rat((m[4] === '-' ? -1 : 1) * N(m[5]), coef(m[1])));
  },
  'pd-c-rational-to-quadratic': (d) => {
    const m = match(d.stem, /^What is the (greatest|least) value of ([a-z]) that satisfies the equation frac\((\d+),\2\) - frac\(\3,\2 - (\d+)\) = 1\?$/);
    m.splice(2, 1);
    const [c, a] = [N(m[2]), N(m[3])];
    const disc = Math.sqrt(a * a - 4 * a * c);
    const roots = [(a + disc) / 2, (a - disc) / 2].filter((x) => x !== 0 && x !== a);
    for (const x of roots) assert.ok(close(c / x - c / (x - a), 1));
    expectAnswer(d, toR(m[1] === 'greatest' ? Math.max(...roots) : Math.min(...roots)));
  },
  'pd-c-perfect-square-match': (d) => {
    const m = match(d.stem, /^If (\d*)x\^2 \+ [a-z]x \+ (\d+) = \((\d*)x \+ [a-z]\)\^2 for all values of x, .+ [a-z] ([<>]) 0, what is the value of [a-z] \+ [a-z]\?$/);
    const p = coef(m[3]);
    assert.equal(coef(m[1]), p * p);
    const n = (m[4] === '<' ? -1 : 1) * Math.sqrt(N(m[2]));
    expectAnswer(d, toR(2 * p * n + n));
  },
  'pd-c-reciprocal-sum-isolate': (d) => {
    const m = match(d.stem, /^If (.+) = (.+), which of the following expresses ([a-z]) in terms of [a-z] and [a-z]\?$/);
    checkIsolation(d, m[1]!, m[2]!, m[3]!);
  },
  'pd-c-match-coef-two-values': (d) => {
    const m = match(d.stem, /^If \((\d*)x \+ a\)\((\d*)x \+ b\) = (\d*)x\^2 \+ cx \+ (\d+) for all values of x/);
    const [p, q, P] = [coef(m[1]), coef(m[2]), N(m[4])];
    const cs = new Set<number>();
    for (let a = -P; a <= P; a += 1) if (a !== 0 && P % a === 0) cs.add(p * (P / a) + q * a);
    const c = mcq(d);
    c.choices.forEach((ch, i) => assert.equal(cs.has(Number(ch.display)), i === c.correctIndex, `${ch.display}. Đề: ${d.stem}`));
  },
  'pd-c-division-remainder-match': (d) => {
    const m = match(d.stem, /^The equation frac\((.+?) \+ mx(?: ([+-]) (\d+))?,(.+?)\) = (.+?) ([+-]) frac\((\d+),\4\) is true/);
    const Q = m[5]!;
    const D = m[4]!;
    const R = (m[6] === '-' ? -1 : 1) * N(m[7]);
    // Nhân ngược: thương × mẫu + dư; hệ số của x là nửa hiệu giá trị tại 1 và −1.
    const prod = (x: number) => evalM(Q, { x }) * evalM(D, { x }) + R;
    const cst = (m[2] === '-' ? -1 : 1) * N(m[3] ?? '0');
    assert.ok(close(prod(0), cst), `Hằng số không khớp. Đề: ${d.stem}`);
    expectAnswer(d, toR(Math.round(((prod(1) - prod(-1)) / 2) * 1e6) / 1e6));
  },
  'pd-c-cubic-product-match': (d) => {
    const m = match(d.stem, /^If \(x\^3 \+ kx\^2 - (\d+)\)\(x ([+-]) (\d+)\) = (.+) for all values of x, what is the value of k\?$/);
    const dd = (m[2] === '-' ? 1 : -1) * N(m[3]);
    // So giá trị hai vế tại x = 2 (không phải nghiệm của thừa số tuyến tính trừ khi d = 2).
    const x = dd === 2 ? 3 : 2;
    const rhsV = evalM(m[4]!, { x });
    const k = (rhsV / (x - dd) + N(m[1]) - x ** 3) / (x * x);
    expectAnswer(d, toR(Math.round(k * 1e6) / 1e6));
  },
  'pd-c-rational-clear-grid': (d) => {
    const m = match(d.stem, /^If frac\((\d+),([a-z]) - 1\) \+ frac\((\d*)\2,\2 \+ 1\) = (\d+) and \2 > 0, what is the value of \2\?$/);
    m.splice(2, 1);
    const [a, b, R] = [N(m[1]), coef(m[2]), N(m[3])];
    const n = toDecimal(answerOf(d));
    assert.ok(n > 0 && close(a / (n - 1) + (b * n) / (n + 1), R), `n = ${n} không thoả. Đề: ${d.stem}`);
    // Không có nghiệm dương nào khác.
    for (let x = 0.5; x < 200; x += 0.5) if (x !== 1 && x !== n) assert.ok(!close(a / (x - 1) + (b * x) / (x + 1), R, 1e-12));
  },
  'pd-c-rational-two-roots-grid': (d) => {
    const m = match(d.stem, /^What is the (greater|lesser) of the two solutions to the equation frac\((\d+),x \+ (\d+)\) - frac\((\d+),x - \3\) = 1\?$/);
    const [A, c, B] = [N(m[2]), N(m[3]), N(m[4])];
    const s1 = A - B;
    const p1 = (A + B) * c - c * c;
    const disc = Math.sqrt(s1 * s1 - 4 * p1);
    const roots = [(s1 + disc) / 2, (s1 - disc) / 2];
    for (const x of roots) assert.ok(close(A / (x + c) - B / (x - c), 1));
    expectAnswer(d, toR(m[1] === 'greater' ? Math.max(...roots) : Math.min(...roots)));
  },
  'pd-c-rational-common-den-grid': (d) => {
    const m = match(d.stem, /^If frac\((\d+),x - (\d+)\) \+ frac\((\d+),x \+ \2\) = frac\((-?\d+),x\^2 - (\d+)\) and x > \2, what is the value of x\?$/);
    const [a, c, b, K] = [N(m[1]), N(m[2]), N(m[3]), N(m[4])];
    assert.equal(N(m[5]), c * c);
    const x = rat(K - (a - b) * c, a + b);
    assert.ok(toDecimal(x) > c);
    expectAnswer(d, x);
  },

  // ------------------------------------------------ Chương 9
  'pd-c-sys-substitution-pair': (d) => {
    const m = match(d.stem, /^If x = (.+?) and (.+?) = (-?\d+), what is the solution \(x, y\) to the system\?$/);
    const xOf = (y: number) => evalM(m[1]!, { y });
    const g = (y: number) => evalM(m[2]!, { x: xOf(y), y }) - N(m[3]);
    const y = -g(0) / (g(1) - g(0));
    checkPair(d, xOf(y), y);
  },
  'pd-c-sys-solve-pair': (d) => {
    const m = match(d.stem, /^What is the solution \(x, y\) to the system of equations (.+) and (.+)\?$/);
    const [x, y] = solve2(m[1]!, m[2]!);
    checkPair(d, x, y);
  },
  'pd-c-sys-combo-trick': (d) => {
    const m = match(d.stem, /^If (.+) and (.+), what is the value of (.+)\?$/);
    const [x, y] = solve2(m[1]!, m[2]!);
    expectAnswer(d, toR(Math.round(evalM(m[3]!, { x, y }) * 1e6) / 1e6));
  },
  'pd-c-sys-rearrange-product': (d) => {
    const m = match(d.stem, /^If (.+) and (.+), what is the value of xy\?$/);
    const [x, y] = solve2(m[1]!, m[2]!);
    expectAnswer(d, toR(Math.round(x * y * 1e6) / 1e6));
  },
  'pd-c-line-parabola-count': (d) => {
    const m = match(d.stem, /^How many solutions does the system of equations y = x\^2(?: ([+-]) (\d+))? and y = (.+) have\?$/);
    const c = (m[1] === '-' ? -1 : 1) * N(m[2] ?? '0');
    const b0 = evalM(m[3]!, { x: 0 });
    const mm = evalM(m[3]!, { x: 1 }) - b0;
    const disc = mm * mm - 4 * (c - b0);
    expectText(d, disc < 0 ? 'Zero' : disc === 0 ? 'Exactly one' : 'Exactly two');
  },
  'pd-c-sys-count-solutions': (d) => {
    const m = match(d.stem, /^How many solutions does the system of equations (.+) and (.+) have\?$/);
    const [a1, b1, c1] = lin2(m[1]!);
    const [a2, b2, c2] = lin2(m[2]!);
    const det = a1 * b2 - a2 * b1;
    const same = close(a1 * c2, a2 * c1) && close(b1 * c2, b2 * c1);
    expectText(d, det !== 0 ? 'Exactly one' : same ? 'Infinitely many' : 'Zero');
  },
  'pd-c-sys-infinite-param': (d) => {
    const m = match(d.stem, /^In the system of equations (.+?) = a and bx ([+-]) (\d*)y = (-?\d+), a and b are constants\./);
    const [, q] = lin2(`${m[1]!} = 0`);
    const K = (m[2] === '-' ? -1 : 1) * coef(m[3]);
    const k = K / q;
    expectAnswer(d, toR(N(m[4]) / k));
  },
  'pd-c-sys-one-solution-exclude': (d) => {
    const m = match(d.stem, /^The system of equations ax \+ (\d*)y = (\d+) and (.+) = (\d+) has exactly one solution\./);
    const p = coef(m[1]);
    const [s, t] = lin2(`${m[3]!} = 0`);
    const bad = (s * p) / t;
    const c = mcq(d);
    c.choices.forEach((ch, i) => assert.equal(close(Number(ch.display), bad), i === c.correctIndex, `${ch.display} (loại ${bad}). Đề: ${d.stem}`));
  },
  'pd-c-sys-fraction-coef': (d) => {
    const m = match(d.stem, /^What is the solution \(x, y\) to the system of equations (.+) and (.+)\?$/);
    const [x, y] = solve2(m[1]!, m[2]!);
    checkPair(d, x, y);
  },
  'pd-c-sys-decimal-grid': (d) => {
    const m = match(d.stem, /^If (.+) and (.+), what is the value of ([xy])\?$/);
    const [x, y] = solve2(m[1]!, m[2]!);
    expectAnswer(d, toR(Math.round((m[3] === 'x' ? x : y) * 1e6) / 1e6));
  },
  'pd-c-sys-infinite-ratio': (d) => {
    const m = match(d.stem, /^In the system of equations ([a-z])x ([+-]) (\d+)y = (-?\d+) and (\d*)x - ([a-z])y = (-?\d+), /);
    const k = N(m[4]) / N(m[7]);
    assert.ok(Number.isInteger(k));
    // Hệ số của y ở phương trình đầu là k nhân (−n).
    const yCoef = (m[2] === '-' ? -1 : 1) * N(m[3]);
    const n = -yCoef / k;
    expectAnswer(d, rat(k * coef(m[5]), n));
  },
  'pd-c-sys-radical-grid': (d) => {
    const m = match(d.stem, /^If y = sqrt\(x\) \+ (\d+) and sqrt\((\d+)x\) - y = (-?\d+), what is the value of ([xy])\?$/);
    const k = Math.sqrt(N(m[2]));
    const r = (N(m[1]) + N(m[3])) / (k - 1);
    expectAnswer(d, toR(m[4] === 'y' ? r + N(m[1]) : r * r));
  },
  'pd-c-sys-weights-express': (d) => {
    const m = match(d.stem, /They satisfy (\d+)S = (\d*)M \+ L and (\d*)S \+ M = L\./);
    const [A, b, c] = [N(m[1]), coef(m[2]), coef(m[3])];
    const K = (A + b * c) / (b + 1);
    expectText(d, `L = ${K}S`);
  },
  'pd-c-sys-score-model': (d) => {
    const m = match(d.stem, /^On a quiz with (\d+) questions, each correct answer earns (\d+) points and each incorrect answer loses (\d+) points?\. .+ scored (-?\d+) points\./);
    const q = N(m[3]);
    expectText(d, `c + w = ${m[1]} and ${m[2]}c - ${q === 1 ? '' : q}w = ${m[4]}`);
  },
  'pd-c-sys-darts-grid': (d) => {
    const m = match(d.stem, /scored (\d+) points with 1 hit in (.+?) and (\d+) hits in (.+?)\. Another player scored (\d+) points .+ How many points is one hit in (.+?) worth\?$/);
    const [s1, k, s2] = [N(m[1]), N(m[3]), N(m[5])];
    // A + kB = s1, kA + B = s2
    const B = (k * s1 - s2) / (k * k - 1);
    const A = s1 - k * B;
    expectAnswer(d, toR(m[6] === m[2] ? A : B));
  },
  'pd-c-sys-tables-count': (d) => {
    const m = match(d.stem, /has (\d+) \w+\. Some \w+ have (\d+) .+ the rest have (\d+) .+ If all (\d+) /);
    const [T, p, q, P] = [N(m[1]), N(m[2]), N(m[3]), N(m[4])];
    expectAnswer(d, toR((q * T - P) / (q - p)));
  },

  // ------------------------------------------------ Chương 10
  'pd-c-ineq-which-solution': (d) => {
    const m = match(d.stem, /^Which of the following is a solution to the inequality (.+) > (.+)\?$/);
    const c = mcq(d);
    c.choices.forEach((ch, i) => {
      const x = Number(ch.display);
      assert.equal(evalM(m[1]!, { x }) > evalM(m[2]!, { x }), i === c.correctIndex, `${ch.display}. Đề: ${d.stem}`);
    });
  },
  'pd-c-ineq-frac-coef': (d) => {
    const m = match(d.stem, /^If (.+) > (.+), which of the following must be true\?$/);
    const v = lettersOf(m[1]!)[0]!;
    const f = (t: number) => evalM(m[1]!, { [v]: t }) - evalM(m[2]!, { [v]: t });
    const slope = f(1) - f(0);
    const root = -f(0) / slope;
    expectText(d, `${v} ${slope > 0 ? '>' : '<'} ${Math.round(root)}`);
    assert.ok(close(root, Math.round(root)));
  },
  'pd-c-ineq-region-words': (d) => {
    const a = d.stem.match(/bounded by two (solid|dashed) lines: the horizontal line through \(0, (-?\d+)\) and the line through \(0, 0\) and \(1, (-?\d+)\)\. The shaded region lies (below|above) the horizontal line and (above|below) the other line\./);
    if (a) {
      const solid = a[1] === 'solid';
      const [lt, gt] = solid ? ['<=', '>='] : ['<', '>'];
      const mm = N(a[3]);
      const L = mm === 1 ? 'x' : mm === -1 ? '-x' : `${mm}x`;
      expectText(d, `y ${a[4] === 'below' ? lt : gt} ${a[2]} and y ${a[5] === 'above' ? gt : lt} ${L}`);
      return;
    }
    const b = match(d.stem, /the band between two (solid|dashed) (vertical|horizontal) lines, one through \((-?\d+), (-?\d+)\) and one through \((-?\d+), (-?\d+)\)/);
    const vert = b[2] === 'vertical';
    const [le, ge] = b[1] === 'solid' ? ['<=', '>='] : ['<', '>'];
    const hi = vert ? N(b[3]) : N(b[4]);
    const lo = vert ? N(b[5]) : N(b[6]);
    const v = vert ? 'x' : 'y';
    expectText(d, `${v} ${le} ${hi} and ${v} ${ge} ${lo}`);
  },
  'pd-c-ineq-within-tolerance': (d) => {
    const m = match(d.stem, /estimates that there are ([a-z]) .+ The actual number, ([a-z]), is within (\d+) \(inclusive\)/);
    expectText(d, `${m[1]} - ${m[3]} <= ${m[2]} <= ${m[1]} + ${m[3]}`);
  },
  'pd-c-ineq-supply-demand': (d) => {
    const m = match(d.stem, /M = (\d+)P \+ (\d+), .+ S = -(\d*)P \+ (\d+)\./);
    const K = (N(m[4]) - N(m[2])) / (N(m[1]) + coef(m[3]));
    expectText(d, `P >= ${K}`);
  },
  'pd-c-ineq-least-integer-grid': (d) => {
    const m = match(d.stem, /^If ([a-z]) is an integer and (\d+)\(\1 - (\d+)\) > -(\d+)\(\1 - (\d+)\), what is the least possible value of \1\?$/);
    const [a, b, c, dd] = [N(m[2]), N(m[3]), N(m[4]), N(m[5])];
    let n = -100;
    while (!(a * (n - b) > -c * (n - dd))) n += 1;
    expectAnswer(d, n);
  },
  'pd-c-ineq-time-budget': (d) => {
    const m = match(d.stem, /travels (\d+) miles by \w+ and then (\d+) miles by \w+\. .+ never takes more than (\d+) hours?,/);
    expectText(d, `frac(${m[1]},x) + frac(${m[2]},y) <= ${m[3]}`);
  },
  'pd-c-ineq-two-rates-split': (d) => {
    const m = match(d.stem, /The first can make (\d+) per hour and the second can make (\d+) per hour\. .+ more than ([\d,]+) .+ total of (\d+) hours/);
    expectText(d, `${m[1]}x + ${m[2]}(${m[4]} - x) > ${N(m[3])}`);
  },
  'pd-c-ineq-point-constants': (d) => {
    const m = match(d.stem, /y > (\d+)x \+ a and y < (\d*)x \+ b, .+ If \((\d+), (\d+)\) is a solution/);
    const [m1, m2, x0, y0] = [N(m[1]), coef(m[2]), N(m[3]), N(m[4])];
    const gap = y0 - m2 * x0 - (y0 - m1 * x0);
    const c = mcq(d);
    c.choices.forEach((ch, i) => assert.equal(Number(ch.display) > gap, i === c.correctIndex, `${ch.display} (cần > ${gap}). Đề: ${d.stem}`));
  },
  'pd-c-ineq-system-hours-earnings': (d) => {
    const m = match(d.stem, /no more than (\d+) hours .+ takes (\d+) minutes and earns \$(\d+), and each .+ takes (\d+) minutes and earns \$(\d+)\. .+ at least \$(\d+) each week\./);
    const f = (t: number, v: string) => {
      const g = gcd(t, 60);
      return t / g === 1 ? `frac(${v},${60 / g})` : `frac(${t / g}${v},${60 / g})`;
    };
    expectText(d, `${f(N(m[2]), 'm')} + ${f(N(m[4]), 'p')} <= ${m[1]} and ${m[3]}m + ${m[5]}p >= ${m[6]}`);
  },
  'pd-c-ineq-must-be-true-compound': (d) => {
    const m = match(d.stem, /^If k <= x <= (\d+)k \+ (\d+), which of the following must be true\? I\. (.+) II\. (.+) III\. (.+)$/);
    const [a, b] = [N(m[1]), N(m[2])];
    const kMin = -b / (a - 1);
    const truth = [m[3]!, m[4]!, m[5]!].map((st) => {
      const t = match(st, /^(.+?) (<=|>=|<|>) (.+)$/);
      for (let k = kMin; k <= kMin + 30; k += 0.5)
        for (let x = k; x <= a * k + b + 1e-9; x += 0.5) {
          const [L, R] = [evalM(t[1]!, { k, x }), evalM(t[3]!, { k, x })];
          const ok = t[2] === '<=' ? L <= R + 1e-9 : t[2] === '>=' ? L >= R - 1e-9 : t[2] === '<' ? L < R - 1e-9 : L > R + 1e-9;
          if (!ok) return false;
        }
      return true;
    });
    expectText(d, romanText(truth));
  },
  'pd-c-ineq-compound-grid': (d) => {
    const m = match(d.stem, /^If (.+?) < -(\d+)x \+ (\d+) < (.+?) and x - (\d+) is an integer, what is the value of x - \5\?$/);
    const [lo, a, b, hi, c] = [evalM(m[1]!, {}), N(m[2]), N(m[3]), evalM(m[4]!, {}), N(m[5])];
    const xLo = (b - hi) / a - c;
    const xHi = (b - lo) / a - c;
    const ints: number[] = [];
    for (let t = Math.ceil(xLo - 1); t <= xHi + 1; t += 1) if (t > xLo + 1e-9 && t < xHi - 1e-9) ints.push(t);
    assert.equal(ints.length, 1, `Khoảng (${xLo}, ${xHi}) chứa ${ints.length} số nguyên.`);
    expectAnswer(d, ints[0]!);
  },
  'pd-c-ineq-area-perimeter-system': (d) => {
    const m = match(d.stem, /area of at least (\d+) square meters and a perimeter of at least (\d+) meters/);
    expectText(d, `xy >= ${m[1]} and x + y >= ${N(m[2]) / 2}`);
  },
  'pd-c-ineq-must-be-true-ab': (d) => {
    const m = match(d.stem, /^If a < b, which of the following must be true\? I\. (.+) II\. (.+) III\. (.+)$/);
    const vals = [-5, -2.5, -1, -0.5, 0.5, 1, 2, 3.5, 6];
    const truth = [m[1]!, m[2]!, m[3]!].map((st) => {
      const t = match(st, /^(.+?) (<|>) (.+)$/);
      for (const a of vals)
        for (const b of vals) {
          if (!(a < b)) continue;
          const [L, R] = [evalM(t[1]!, { a, b }), evalM(t[3]!, { a, b })];
          if (!(t[2] === '<' ? L < R : L > R)) return false;
        }
      return true;
    });
    expectText(d, romanText(truth));
  },

  // ------------------------------------------------ Chương 11
  'pd-c-translate-expression': (d) => {
    const m = match(d.stem, /^Which of the following represents (.+)\?$/);
    const t = m[1]!;
    let f: ((e: Record<string, number>) => number) | null = null;
    let vars: string[] = [];
    let r: RegExpMatchArray | null;
    if ((r = t.match(/^the result of subtracting (\d+) times the product of ([a-z]) and ([a-z]) from the square of their sum$/))) {
      const [k, x, y] = [N(r[1]), r[2]!, r[3]!];
      f = (e) => (e[x]! + e[y]!) ** 2 - k * e[x]! * e[y]!;
      vars = [x, y];
    } else if ((r = t.match(/^(\d+) less than the product of ([a-z]) and the square of ([a-z])$/))) {
      const [k, x, y] = [N(r[1]), r[2]!, r[3]!];
      f = (e) => e[x]! * e[y]! ** 2 - k;
      vars = [x, y];
    } else if ((r = t.match(/^the square of the difference of ([a-z]) and ([a-z]), divided by (\d+) more than their sum$/))) {
      const [x, y, k] = [r[1]!, r[2]!, N(r[3])];
      f = (e) => (e[x]! - e[y]!) ** 2 / (e[x]! + e[y]! + k);
      vars = [x, y];
    } else if ((r = t.match(/^(\d+) times the sum of ([a-z]) and the square of ([a-z])$/))) {
      const [k, x, y] = [N(r[1]), r[2]!, r[3]!];
      f = (e) => k * (e[x]! + e[y]! ** 2);
      vars = [x, y];
    } else if ((r = t.match(/^the sum of the squares of ([a-z]) and ([a-z]), increased by (\d+) times their product$/))) {
      const [x, y, k] = [r[1]!, r[2]!, N(r[3])];
      f = (e) => e[x]! ** 2 + e[y]! ** 2 + k * e[x]! * e[y]!;
      vars = [x, y];
    }
    assert.ok(f, `Cụm từ lạ: ${t}`);
    checkExprChoices(d, f, vars, false);
  },
  'pd-c-number-line-distance': (d) => {
    const m = match(d.stem, /marks are drawn at (\d+), X, and (\d+), .+ The distance between the marks at X and \2 is (twice|\d+ times) the distance/);
    const [a, b] = [N(m[1]), N(m[2])];
    const k = m[3] === 'twice' ? 2 : N(m[3]!.split(' ')[0]);
    expectAnswer(d, rat(b + k * a, k + 1));
  },
  'pd-c-translate-sqrt': (d) => {
    const m = match(d.stem, /^If (\d+) is (added to|subtracted from) the square root of x, the result is (-?\d+)\. What is the value of x ([+-]) (\d+)\?$/);
    const r = m[2] === 'added to' ? N(m[3]) - N(m[1]) : N(m[3]) + N(m[1]);
    assert.ok(r >= 0);
    expectAnswer(d, r * r + (m[4] === '-' ? -1 : 1) * N(m[5]));
  },
  'pd-c-two-pack-combos': (d) => {
    const m = match(d.stem, /in packs of (\d+) or (\d+)\. .+ for a total of (\d+) /);
    const [p, q, T] = [N(m[1]), N(m[2]), N(m[3])];
    let best = -1;
    for (let x = 1; x * p <= T; x += 1) for (let y = 1; x * p + y * q <= T; y += 1) if (x * p + y * q === T) best = Math.max(best, x);
    expectAnswer(d, best);
  },
  'pd-c-cost-annual-model': (d) => {
    const m = match(d.stem, /fixed costs of \$([\d,]+) each month and pays each employee \$([\d,]+) each month/);
    expectText(d, `c = 12(${N(m[1])} + ${N(m[2])}x)`);
  },
  'pd-c-integer-weights-cost': (d) => {
    const m = match(d.stem, /costs \$([\d.]+) per pound and the \w+ costs \$(\d+) per pound\. If the total cost is \$(\d+),/);
    const [a, b, T] = [N(m[1]), N(m[2]), N(m[3])];
    const c = mcq(d);
    c.choices.forEach((ch, i) => {
      const y = Number(ch.display);
      const x = (T - b * y) / (2 * a);
      assert.equal(y > 0 && x > 0 && Number.isInteger(Math.round(x * 1e9) / 1e9), i === c.correctIndex, `${ch.display}. Đề: ${d.stem}`);
    });
  },
  'pd-c-percent-equal': (d) => {
    const m = match(d.stem, /^If (\d+)% of (\d+) is the same as (\d+)% of n/);
    expectAnswer(d, rat(N(m[1]) * N(m[2]), N(m[3])));
  },
  'pd-c-win-half': (d) => {
    const m = match(d.stem, /won exactly (\d+) of the first (\d+) games .+ If they won exactly (half|two-thirds|three-fourths|60%) of all/);
    const r = { half: 1 / 2, 'two-thirds': 2 / 3, 'three-fourths': 3 / 4, '60%': 3 / 5 }[m[3]!]!;
    const [w0, g] = [N(m[1]), N(m[2])];
    expectAnswer(d, toR(Math.round(((r * g - w0) / (1 - r)) * 1e6) / 1e6));
  },
  'pd-c-equal-start-transfer': (d) => {
    const m = match(d.stem, /After \w+ gives (\d+) of her .+ has (twice|\d+ times) as many/);
    const t = N(m[1]);
    const k = m[2] === 'twice' ? 2 : N(m[2]!.split(' ')[0]);
    expectAnswer(d, rat(t * (k + 1), k - 1));
  },
  'pd-c-fractions-rest': (d) => {
    const m = match(d.stem, /frac\(1,(\d+)\) .+ frac\(1,(\d+)\) .+ frac\(1,(\d+)\) .+ The remaining (\d+) /);
    const share = 1 - 1 / N(m[1]) - 1 / N(m[2]) - 1 / N(m[3]);
    expectAnswer(d, toR(Math.round((N(m[4]) / share) * 1e6) / 1e6));
  },
  'pd-c-trade-equalize': (d) => {
    const m = match(d.stem, /has (\d+) stickers and \w+ has (\d+) stickers\. In each swap, \w+ gives \w+ (\d+) stickers/);
    const [p, q, mm] = [N(m[1]), N(m[2]), N(m[3])];
    expectAnswer(d, rat(q - p, 2 * (mm - 1)));
  },
  'pd-c-translate-solve-expr': (d) => {
    const m = match(d.stem, /^If (\d+) is subtracted from (\d+) times the number x, the result is (-?\d+)\. What is the result when (\d+) is added to (half|one-third|one-fourth) of x\?$/);
    const x = (N(m[3]) + N(m[1])) / N(m[2]);
    const e = { half: 2, 'one-third': 3, 'one-fourth': 4 }[m[5]!]!;
    expectAnswer(d, toR(N(m[4]) + x / e));
  },
  'pd-c-price-relation-grid': (d) => {
    const m = match(d.stem, /is k dollars less than (twice|\d+ times) the price of .+ costs \$(\d+) and a .+ costs \$(\d+), what is the value of k\?$/);
    const k = m[1] === 'twice' ? 2 : N(m[1]!.split(' ')[0]);
    expectAnswer(d, k * N(m[2]) - N(m[3]));
  },
  'pd-c-coupon-ratio-total': (d) => {
    const m = match(d.stem, /worth \$(\d+), \$(\d+), or \$(\d+)\. There were (\d+) times as many .+ and (\d+) times as many .+ was \$([\d,]+)\. How many/);
    const [v1, v2, v3, r1, r2, T] = [N(m[1]), N(m[2]), N(m[3]), N(m[4]), N(m[5]), N(m[6])];
    const t = T / (v1 * r1 * r2 + v2 * r2 + v3);
    expectAnswer(d, toR(r2 * t));
  },
  'pd-c-chain-ratio': (d) => {
    const m = match(d.stem, /has (half|one-third|one-fourth) as many stamps as \w+\. \w+ has (\d+) times as many .+ together have (\d+) stamps/);
    const h = { half: 2, 'one-third': 3, 'one-fourth': 4 }[m[1]!]!;
    const B = N(m[3]) / (N(m[2]) + 1);
    expectAnswer(d, toR(h * B));
  },

  // ------------------------------------------------ Chương 12
  'pd-c-vertical-horizontal-line': (d) => {
    const a = d.stem.match(/parallel to the (x|y)-axis and (\d+) units (to the right|to the left|above|below)/);
    if (a) {
      const val = (a[3] === 'to the right' || a[3] === 'above' ? 1 : -1) * N(a[2]);
      expectText(d, `${a[1] === 'y' ? 'x' : 'y'} = ${val}`);
      return;
    }
    const b = match(d.stem, /the (vertical|horizontal) line that passes through the point \((-?\d+), (-?\d+)\)/);
    expectText(d, b[1] === 'vertical' ? `x = ${b[2]}` : `y = ${b[3]}`);
  },
  'pd-c-slope-unknown-coord': (d) => {
    const a = d.stem.match(/slope of (.+?) passes through the points \((-?\d+), (-?\d+)\) and \((-?\d+), n\)/);
    if (a) {
      const m = evalM(a[1]!, {});
      expectAnswer(d, toR(Math.round((N(a[3]) + m * (N(a[4]) - N(a[2]))) * 1e6) / 1e6));
      return;
    }
    const b = match(d.stem, /slope of (.+?) passes through the points \((-?\d+), (-?\d+)\) and \(x, (-?\d+)\)/);
    const m = evalM(b[1]!, {});
    expectAnswer(d, toR(Math.round((N(b[2]) + (N(b[4]) - N(b[3])) / m) * 1e6) / 1e6));
  },
  'pd-c-point-on-line': (d) => {
    const m = match(d.stem, /the points \((-?\d+), (-?\d+)\) and \((-?\d+), (-?\d+)\) lie on line l/);
    const [x1, y1, x2, y2] = [N(m[1]), N(m[2]), N(m[3]), N(m[4])];
    const c = mcq(d);
    c.choices.forEach((ch, i) => {
      const p = match(ch.display, /^\((-?\d+), (-?\d+)\)$/);
      const on = (N(p[2]) - y1) * (x2 - x1) === (y2 - y1) * (N(p[1]) - x1);
      assert.equal(on, i === c.correctIndex, `${ch.display}. Đề: ${d.stem}`);
    });
  },
  'pd-c-parallel-from-intercepts': (d) => {
    const m = match(d.stem, /crosses the x-axis at \((-?\d+), 0\) and the y-axis at \(0, (-?\d+)\)/);
    const [a, b] = [N(m[1]), N(m[2])];
    const c = mcq(d);
    c.choices.forEach((ch, i) => {
      const r = rhs(ch.display);
      const sl = evalM(r, { x: 1 }) - evalM(r, { x: 0 });
      const ok = close(sl, -b / a) && !close(evalM(r, { x: 0 }), b);
      assert.equal(ok, i === c.correctIndex, `${ch.display}. Đề: ${d.stem}`);
    });
  },
  'pd-c-lines-intersect-params': (d) => {
    const m = match(d.stem, /intersect at the point \((-?\d+), (-?\d+)\), .+ What is the value of ([ab])\?$/);
    const [p, q] = [N(m[1]), N(m[2])];
    const b = -q / p;
    expectAnswer(d, toR(m[3] === 'b' ? b : (q - b) / p));
  },
  'pd-c-slope-from-intercepts': (d) => {
    const m = match(d.stem, /passes through the points \(0, (-?\d+)\) and \((-?\d+), 0\)/);
    expectAnswer(d, rat(-N(m[1]), N(m[2])));
  },
  'pd-c-sign-slope-intercept': (d) => {
    const m = match(d.stem, /crosses the x-axis at \((-?\d+), 0\) and the y-axis at \(0, (-?\d+)\)/);
    const [p, q] = [N(m[1]), N(m[2])];
    const mb = (-q / p) * q;
    expectText(d, mb > 0 ? 'mb > 0' : 'mb < 0');
  },
  'pd-c-perp-same-intercept': (d) => {
    const m = match(d.stem, /^The line y = (.+?) is perpendicular to line l\./);
    const s0 = evalM(m[1]!, { x: 1 }) - evalM(m[1]!, { x: 0 });
    const b0 = evalM(m[1]!, { x: 0 });
    const c = mcq(d);
    c.choices.forEach((ch, i) => {
      const r = rhs(ch.display);
      const sl = evalM(r, { x: 1 }) - evalM(r, { x: 0 });
      const ok = close(sl * s0, -1) && close(evalM(r, { x: 0 }), b0);
      assert.equal(ok, i === c.correctIndex, `${ch.display}. Đề: ${d.stem}`);
    });
  },
  'pd-c-linear-constant-deduce': (d) => {
    const m = match(d.stem, /^If ([fgh]) is a linear function such that \1\((-?\d+)\) <= \1\((-?\d+)\), \1\((-?\d+)\) >= \1\((-?\d+)\), and \1\((-?\d+)\) = (-?\d+),/);
    assert.ok(N(m[2]) < N(m[3]) && N(m[4]) < N(m[5]), 'Hai điều kiện phải buộc hệ số góc bằng 0.');
    expectText(d, `${m[1]}(0) = ${m[7]}`);
  },
  'pd-c-perp-slope-range': (d) => {
    const m = match(d.stem, /are perpendicular, .+ If (.+), which of the following must be true\?$/);
    const g = m[1]!;
    const lettersG = g.match(/frac\(([a-z]),([a-z])\)/)!;
    const S2 = d.stem.match(/y = frac\([a-z],[a-z]\)x \+ c and y = (frac\([a-z],[a-z]\))x/)![1]!;
    const k = Math.max(...(g.replace(/frac\([a-z],[a-z]\)/g, '').match(/\d+/g) ?? ['1']).map(Number));
    const inv = k === 1 ? '1' : `frac(1,${k})`;
    let want = '';
    if (g.startsWith('0 <')) want = `${S2} < -${k}`;
    else if (/^frac\(\w,\w\) > /.test(g)) want = `-${inv} < ${S2} < 0`;
    else if (g.startsWith('-')) want = `${S2} > ${k}`;
    else want = `0 < ${S2} < ${inv}`;
    assert.ok(lettersG);
    expectText(d, want);
  },

  // ------------------------------------------------ Chương 13
  'pd-c-model-slope-meaning': (d) => {
    const m = match(d.stem, /^The equation ([A-Za-z]) = (\d+) ([+-]) (\d+)([a-z]) models /);
    const [dir, mm] = [m[3] === '+' ? 'increases' : 'decreases', m[4]!];
    const c = correctDisplay(d);
    if (/how does .+ change for each additional/.test(d.stem)) {
      assert.equal(c.match(/^It (increases|decreases) by (\d+) /)?.slice(1).join(' '), `${dir} ${mm}`, `${c}. Đề: ${d.stem}`);
    } else {
      match(d.stem, new RegExp(`best interpretation of the number ${mm} in this model\\?$`));
      assert.ok(new RegExp(`^For each additional .+, .+ ${dir} by ${mm} `).test(c), `${c}. Đề: ${d.stem}`);
    }
  },
  'pd-c-model-intercept-meaning': (d) => {
    const a = d.stem.match(/the equation ([a-z]) = (\d+) \+ (\d+)([a-z]),/);
    if (a) {
      assert.ok(correctDisplay(d).startsWith(`There would be about ${a[2]} `), `${correctDisplay(d)}. Đề: ${d.stem}`);
      assert.ok(correctDisplay(d).includes(' with no '));
      return;
    }
    const b = match(d.stem, /uses the equation y = [\d.]+x - ([\d.]+) to convert x (.+?) into y (.+?)\. Which .+ number \1 in the equation\?$/);
    expectText(d, `The exchange charges a fee of ${b[1]} ${b[3]}.`);
  },
  'pd-c-model-product-coef': (d) => {
    const m = match(d.stem, /is given by the expression (\d+) \+ (\d+)xc, where x is .+ and c is the number of (\w+) .+ the number \2 in this context\?$/);
    const noun = { cruises: 'cruise', sessions: 'session', homes: 'home' }[m[3]!]!;
    assert.ok(noun, d.stem);
    assert.ok(new RegExp(`(price of a ${noun}|fee charged for each ${noun})`).test(correctDisplay(d)), `${correctDisplay(d)}. Đề: ${d.stem}`);
  },
  'pd-c-model-time-left': (d) => {
    const m = match(d.stem, /the equation ([A-Za-z]) = (\d+) - (\d+)([a-z]), where \4 is the number of (seconds|minutes) (left|left before)/);
    assert.ok(m);
    assert.ok(/at the end|by the end|to the destination/.test(correctDisplay(d)), `${correctDisplay(d)}. Đề: ${d.stem}`);
  },
  'pd-c-model-rate-per-unit': (d) => {
    const a = d.stem.match(/^The equation [A-Za-z] = frac\((\d*)x \+ (\d+),(\d+)\) models/);
    if (a) {
      expectAnswer(d, rat(coef(a[1]), N(a[3])));
      return;
    }
    const b = match(d.stem, / = (\d+) \+ (\d+)h\. Based on the model, .+ for every (\d+) minutes\?$/);
    expectAnswer(d, rat(N(b[2]) * N(b[3]), 60));
  },
  'pd-c-model-profit-table': (d) => {
    const f = d.figure;
    assert.ok(f && f.kind === 'data_table');
    const pts = f.rows.map((r) => [Number(r.label), Number(r.cells[0])] as const);
    const slope = (pts[1]![1] - pts[0]![1]) / (pts[1]![0] - pts[0]![0]);
    for (const [x, y] of pts) assert.ok(close(y, pts[0]![1] + slope * (x - pts[0]![0])), 'Bảng không tuyến tính.');
    const intercept = pts[0]![1] - slope * pts[0]![0];
    const c = correctDisplay(d);
    if (/slope of the line/.test(d.stem)) assert.ok(c.startsWith('The profit generated from each'), c);
    else if (/y-intercept/.test(d.stem)) {
      assert.ok(intercept < 0);
      assert.ok(c.startsWith('The daily costs of running'), c);
    } else {
      const k = N(match(d.stem, /that \((\d+), 0\) lies on the line/)[1]);
      assert.ok(close(-intercept / slope, k), `Giao điểm trục x là ${-intercept / slope}, đề ghi ${k}.`);
      assert.ok(c.includes(`needs to sell ${k} `), c);
    }
  },
  'pd-c-model-roman': (d) => {
    const m = match(d.stem, /uses the equation (\d*)y - (\d*)x = (\d+) to find .+ must be true\? I\. (.+?) II\. (.+?) III\. (.+)$/);
    const [a, b] = [coef(m[1]), coef(m[2])];
    const truth = [m[4]!, m[5]!, m[6]!].map((st) => {
      const r = st.match(/requires (.+?) more /);
      if (r) return close(evalM(r[1]!, {}), b / a);
      const s2 = match(st, /can support (.+?) more /);
      return close(evalM(s2[1]!, {}), a / b);
    });
    expectText(d, romanText(truth));
  },
  'pd-c-model-inverse-change': (d) => {
    const m = match(d.stem, /the equation C = ([\d.]+) \+ ([\d.]+)x .+ An increase of ([\d.]+) dollars/);
    expectNear(d, N(m[3]) / N(m[2]), 1e-9);
  },

};

// ------------------------------------------------------------ kiểm chung

test('slug duy nhất, mang tiền tố pd-c-', () => {
  const slugs = PANDA_C_TEMPLATES.map((t) => t.slug);
  assert.equal(new Set(slugs).size, slugs.length);
  for (const slug of slugs) assert.ok(slug.startsWith('pd-c-'), slug);
});

test('mọi template đều có bộ kiểm chứng riêng', () => {
  for (const t of PANDA_C_TEMPLATES) assert.ok(VERIFIERS[t.slug], `Thiếu bộ kiểm chứng cho ${t.slug}`);
});

for (const template of PANDA_C_TEMPLATES) {
  test(`${template.slug}: đáp án đúng trên ${SEEDS} hạt (đọc ngược từ đề)`, () => {
    const verify = VERIFIERS[template.slug];
    assert.ok(verify);
    for (let seed = 0; seed < SEEDS; seed += 1) verify(draftOf(template.slug, seed));
  });

  test(`${template.slug}: đề, markup, lời giải sạch`, () => {
    for (let seed = 0; seed < SEEDS; seed += 1) {
      const d = draftOf(template.slug, seed);
      assert.equal(d.format, template.format, 'Định dạng khai báo lệch với định dạng sinh ra.');
      assert.ok(d.stem.trim().length > 0, 'Đề rỗng.');
      assert.deepEqual(validateMath(d.stem), [], `Markup hỏng trong đề: ${d.stem}`);
      const displays = d.format === 'mcq' ? d.choices.map((c) => c.display) : [];
      for (const display of displays) assert.deepEqual(validateMath(display), [], `Markup hỏng ở lựa chọn: ${display}`);
      assert.ok(d.steps.length > 0, 'Câu nào cũng phải có lời giải.');
      d.steps.forEach((step, i) => {
        assert.ok(step.text.trim().length > 0, 'Bước giải rỗng.');
        assert.ok(!/frac\(|sqrt\(|\^\d|_\d/.test(step.text), `Markup toán lọt vào phần lời: "${step.text}"`);
        if (step.expr) assert.deepEqual(validateMath(step.expr), [], `Markup hỏng ở bước giải: ${step.expr}`);
        const prev = d.steps[i - 1]?.expr;
        if (prev && step.expr) assert.notEqual(step.expr, prev, `Bước ${i + 1} in lại y hệt bước trước (hạt ${seed}).`);
      });
      const rendered = [d.stem, ...displays, ...d.steps.map((s) => `${s.text} ${s.expr ?? ''}`)].join(' ');
      assert.ok(!/NaN|Infinity|undefined|\bnull\b/.test(rendered), `Đề in ra rác: ${rendered}`);
      assert.ok(!/-0\b(?!\.)/.test(rendered), `Đề in ra số âm 0: ${rendered}`);
      assert.ok(!/\+ -|- -|\+ \+/.test(rendered), `Đề in ra dấu chồng dấu: ${rendered}`);
      assert.ok(!/(?<![\d.])1[a-z]\b/.test([d.stem, ...displays].join(' ')), `Đề in ra hệ số 1 thừa: ${d.stem}`);
      assert.ok(!/\(\s*\)/.test(rendered), `Đề in ra ngoặc rỗng: ${rendered}`);
      if (d.figure?.kind === 'data_table') {
        for (const r of d.figure.rows) assert.equal(r.cells.length, d.figure.columns.length - 1, 'Bảng lệch số cột.');
      }
    }
  });

  if (template.format === 'mcq') {
    test(`${template.slug}: bốn lựa chọn khác nhau, đáp án rải đều, nhiễu nào cũng có lý do`, () => {
      const positions = new Set<number>();
      for (let seed = 0; seed < SEEDS; seed += 1) {
        const d = mcq(draftOf(template.slug, seed));
        assert.equal(d.choices.length, 4);
        assert.ok(d.correctIndex >= 0 && d.correctIndex < 4, 'correctIndex nằm ngoài khoảng.');
        positions.add(d.correctIndex);
        const displays = d.choices.map((c) => c.display);
        assert.equal(new Set(displays).size, 4, `Hai lựa chọn trùng chữ: ${displays.join(' | ')}`);
        const values = displays.map(tryValue);
        if (values.every((v) => v !== null)) {
          for (let i = 0; i < 4; i += 1) {
            for (let j = i + 1; j < 4; j += 1) assert.ok(!equalsValue(values[i]!, values[j]!), 'Hai lựa chọn trùng giá trị.');
          }
        }
        const correct = d.choices[d.correctIndex]!;
        assert.equal(correct.errorTag, null, 'Đáp án đúng mang nhãn lỗi.');
        assert.equal(correct.note, undefined, 'Đáp án đúng có ghi chú lỗi.');
        d.choices.forEach((c, i) => {
          if (i === d.correctIndex) return;
          assert.ok(c.errorTag !== null || (c.note?.length ?? 0) > 0, `Nhiễu "${c.display}" không có nhãn lẫn ghi chú.`);
        });
      }
      assert.equal(positions.size, 4, `Đáp án đúng chỉ rơi vào ${[...positions].join(', ')}.`);
    });
  } else {
    test(`${template.slug}: đáp án điền vừa ô grid-in`, () => {
      for (let seed = 0; seed < SEEDS; seed += 1) {
        const d = draftOf(template.slug, seed);
        assert.ok(d.format === 'grid_in');
        assert.ok(fitsGrid(d.answer), `Đáp án ${toDecimal(d.answer)} không điền vừa ô. Đề: ${d.stem}`);
      }
    });
  }

  test(`${template.slug}: cùng hạt cùng câu, khác hạt đủ đa dạng`, () => {
    for (let seed = 0; seed < 20; seed += 1) {
      assert.deepEqual(draftOf(template.slug, seed), draftOf(template.slug, seed), 'Có Math.random() lọt vào đâu đó.');
    }
    const signatures = new Set<string>();
    for (let seed = 0; seed < SEEDS; seed += 1) {
      const d = draftOf(template.slug, seed);
      signatures.add(
        JSON.stringify([
          d.stem,
          d.figure ?? null,
          d.format === 'mcq' ? d.choices.map((c) => c.display).sort() : [],
          d.format === 'grid_in' ? d.answer : null,
        ]),
      );
    }
    assert.ok(signatures.size > SEEDS / 2, `${SEEDS} hạt chỉ ra ${signatures.size} câu khác nhau.`);
  });
}
