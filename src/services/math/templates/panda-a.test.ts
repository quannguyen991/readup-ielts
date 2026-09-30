import assert from 'node:assert/strict';
import { test } from 'node:test';

import { PANDA_A_TEMPLATES } from './panda-a';
import { validateMath } from '@/lib/math/expr';
import type { MathItemDraft, MathValue } from '@/lib/math/types';
import { equalsValue, rat, toDecimal } from '@/lib/math/value';
import { fitsGrid } from '@/services/math/grid-in';
import { hashString, mulberry32 } from '@/services/questions/rng';

/**
 * Property test cho 22 dạng câu `pd-` phần A.
 *
 * Cùng triết lý với `templates.test.ts`: ĐỌC NGƯỢC TỪ ĐỀ BÀI rồi tự giải, không
 * đọc tham số nội bộ của template. Template in ra một dãy số khác với thứ nó
 * nghĩ trong đầu thì bộ kiểm chứng giải theo đề và bắt được ngay — đó là kiểu
 * hỏng nguy hiểm nhất, vì người học tự giải ra đúng mà bị báo sai.
 *
 * Gọi thẳng `template.build(rng)` với hạt `${slug}:${i}` — cùng cách gieo hạt
 * của `generateMathItem` — vì các template này chưa nối vào danh bạ chung.
 */

const SEEDS = 200;

function draftOf(slug: string, seed: number): MathItemDraft {
  const template = PANDA_A_TEMPLATES.find((t) => t.slug === slug);
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

function correctDisplay(d: MathItemDraft): string {
  assert.equal(d.format, 'mcq');
  if (d.format !== 'mcq') throw new Error('unreachable');
  const choice = d.choices[d.correctIndex];
  assert.ok(choice, 'correctIndex trỏ ra ngoài mảng lựa chọn.');
  return choice.display;
}

function answerOf(d: MathItemDraft): MathValue {
  if (d.format === 'grid_in') return d.answer;
  const v = tryValue(correctDisplay(d));
  assert.ok(v, `Đáp án "${correctDisplay(d)}" không ở dạng số.`);
  return v;
}

function expectAnswer(d: MathItemDraft, expected: MathValue) {
  const got = answerOf(d);
  assert.ok(
    equalsValue(got, expected),
    `Kỳ vọng ${expected.num}/${expected.den}, template cho ${got.num}/${got.den}. Đề: ${d.stem}`,
  );
}

function match(text: string, pattern: RegExp): RegExpMatchArray {
  const m = text.match(pattern);
  assert.ok(m, `Đề không đúng khuôn: ${text}`);
  return m;
}

function sgn(sign: string | undefined): number {
  return sign === '-' ? -1 : 1;
}

/** "3", "-3", "" (=1), "-" (=-1). */
function coef(text: string | undefined): number {
  if (text === undefined || text === '') return 1;
  if (text === '-') return -1;
  return Number(text);
}

/** Đọc "mx + b" / "mx" / "-x - 4". */
function linear(text: string): { m: number; b: number } {
  const t = text.trim().match(/^(-?\d*)x(?: ([+-]) (\d+))?$/);
  assert.ok(t, `Không đọc được biểu thức bậc nhất: ${text}`);
  return { m: coef(t[1]), b: t[2] ? sgn(t[2]) * Number(t[3]) : 0 };
}

/** Căn bậc n nguyên của v; null nếu v không phải luỹ thừa bậc n đúng. */
function intRoot(v: number, n: number): number | null {
  for (let r = 0; r ** n <= v; r += 1) if (r ** n === v) return r;
  return null;
}

/**
 * Tính một biểu thức markup phẳng: số, biến một chữ cái, + -, nhân ngầm,
 * ngoặc và frac(a,b). Đủ cho các công thức của `pd-isolate-variable`.
 */
function evalExpr(src: string, env: Record<string, number>): number {
  const s = src.replace(/\s+/g, '');
  let i = 0;
  const expect = (ch: string) => {
    assert.equal(s[i], ch, `Thiếu "${ch}" trong ${src}`);
    i += 1;
  };
  const parseFactor = (): number => {
    if (s.startsWith('frac(', i)) {
      i += 5;
      const n = parseExpr();
      expect(',');
      const d = parseExpr();
      expect(')');
      return n / d;
    }
    if (s[i] === '(') {
      i += 1;
      const v = parseExpr();
      expect(')');
      return v;
    }
    const num = s.slice(i).match(/^\d+/);
    if (num) {
      i += num[0].length;
      return Number(num[0]);
    }
    const ch = s[i];
    assert.ok(ch !== undefined && /[A-Za-z]/.test(ch) && ch in env, `Biến lạ "${ch}" trong ${src}`);
    i += 1;
    return env[ch]!;
  };
  const parseTerm = (): number => {
    let neg = false;
    if (s[i] === '-') {
      neg = true;
      i += 1;
    }
    let v = parseFactor();
    while (i < s.length && /[0-9A-Za-z(]/.test(s[i]!)) v *= parseFactor();
    return neg ? -v : v;
  };
  function parseExpr(): number {
    let v = parseTerm();
    while (s[i] === '+' || s[i] === '-') {
      const op = s[i];
      i += 1;
      const t = parseTerm();
      v = op === '+' ? v + t : v - t;
    }
    return v;
  }
  const v = parseExpr();
  assert.equal(i, s.length, `Không đọc hết biểu thức: ${src}`);
  return v;
}

const close = (a: number, b: number) => Math.abs(a - b) < 1e-9 * Math.max(1, Math.abs(b));

// --------------------------- kiểm chứng riêng từng template, đọc ngược từ đề

type Verifier = (d: MathItemDraft) => void;

const VERIFIERS: Record<string, Verifier> = {
  /** Bình phương từng lựa chọn: chỉ đáp án đúng bằng c²·n, và phần dưới căn không còn thừa số chính phương. */
  'pd-simplify-sqrt': (d) => {
    const m = match(d.stem, /^Which of the following is equivalent to (\d*)sqrt\((\d+)\)\?$/);
    const target = coef(m[1]) ** 2 * Number(m[2]);
    const squared = (display: string): number => {
      const r = display.match(/^(\d+)sqrt\((\d+)\)$/);
      if (r) return Number(r[1]) ** 2 * Number(r[2]);
      const n = display.match(/^(\d+)$/);
      assert.ok(n, `Lựa chọn lạ: ${display}`);
      return Number(n[1]) ** 2;
    };
    assert.ok(d.format === 'mcq');
    d.choices.forEach((c, i) => {
      if (i === d.correctIndex) assert.equal(squared(c.display), target, `Đáp án ${c.display} không bằng đề ${d.stem}`);
      else assert.notEqual(squared(c.display), target, `Nhiễu ${c.display} cũng bằng đề — hai đáp án đúng.`);
    });
    const under = Number(match(correctDisplay(d), /sqrt\((\d+)\)$/)[1]);
    for (let k = 2; k * k <= under; k += 1) assert.notEqual(under % (k * k), 0, `sqrt(${under}) chưa rút gọn hết.`);
  },

  'pd-fractional-exponent': (d) => {
    const value = d.stem.match(/^What is the value of (\d+)\^\((-?)(\d+)\/(\d+)\)\?$/);
    if (value) {
      const [base, neg, m, n] = [Number(value[1]), value[2] === '-', Number(value[3]), Number(value[4])];
      const r = intRoot(base, n);
      assert.ok(r !== null, `${base} không phải luỹ thừa bậc ${n}.`);
      expectAnswer(d, neg ? rat(1, r ** m) : rat(r ** m));
      return;
    }
    const solve = match(d.stem, /^If x\^\((\d+)\/(\d+)\) = (\d+) and x > 0, what is the value of x\?$/);
    const [m, n, V] = [Number(solve[1]), Number(solve[2]), Number(solve[3])];
    const r = intRoot(V, m);
    assert.ok(r !== null, `${V} không phải luỹ thừa bậc ${m}.`);
    const x = r ** n;
    // Thế ngược: căn bậc n của x mũ m phải ra đúng V.
    assert.equal(intRoot(x, n)! ** m, V);
    expectAnswer(d, rat(x));
  },

  /** Tìm cơ số chung từ hai cơ số in trong đề, rồi cân số mũ. */
  'pd-exponent-solve-hard': (d) => {
    const m = match(d.stem, /^If (\d+)\^(x|\(x ([+-]) (\d+)\)) = (\d+)\^(x|\(x ([+-]) (\d+)\)), what is the value of x\?$/);
    const B1 = Number(m[1]);
    const c1 = m[3] ? sgn(m[3]) * Number(m[4]) : 0;
    const B2 = Number(m[5]);
    const c2 = m[7] ? sgn(m[7]) * Number(m[8]) : 0;
    let found = false;
    for (let r = 2; r <= 10 && !found; r += 1) {
      let p = 0;
      let q = 0;
      for (let e = 1; e <= 10; e += 1) {
        if (r ** e === B1) p = e;
        if (r ** e === B2) q = e;
      }
      if (p && q) {
        found = true;
        assert.notEqual(p, q, 'Hai cơ số bằng nhau — phương trình suy biến.');
        expectAnswer(d, rat(q * c2 - p * c1, p - q));
      }
    }
    assert.ok(found, `Hai cơ số ${B1}, ${B2} không cùng là luỹ thừa của một số.`);
  },

  'pd-simple-interest': (d) => {
    const m = match(d.stem, /deposits \$(\d+) in an account that earns simple interest at an annual rate of (\d+)%\..* at the end of (\d+) years\?$/);
    const [P, r, t] = [Number(m[1]), Number(m[2]), Number(m[3])];
    expectAnswer(d, rat(100 * P + P * r * t, 100));
  },

  /** Tính giá trị số của từng hàm tại t = 1, 2, 3 và so với công thức lãi kép. */
  'pd-compound-interest': (d) => {
    const m = match(d.stem, /deposit of \$(\d+)\. The account earns (\d+)% annual interest, compounded (\w+),/);
    const P = Number(m[1]);
    const r = Number(m[2]) / 100;
    const n = { semiannually: 2, quarterly: 4, monthly: 12 }[m[3] as 'semiannually' | 'quarterly' | 'monthly'];
    assert.ok(n, `Không biết kỳ ghép lãi "${m[3]}".`);
    const truth = (t: number) => P * (1 + r / n) ** (n * t);
    const evalV = (display: string, t: number): number => {
      const v = display.match(/^V\(t\) = (\d+)\(1 \+ (?:frac\(([\d.]+),(\d+)\)|([\d.]+)(t?))\)(?:\^(?:\((\d+)t\)|(t)))?$/);
      assert.ok(v, `Không đọc được hàm: ${display}`);
      const principal = Number(v[1]);
      if (v[5] === 't') return principal * (1 + Number(v[4]) * t);
      const rate = v[2] ? Number(v[2]) / Number(v[3]) : Number(v[4]);
      const exp = v[6] ? Number(v[6]) * t : v[7] ? t : 1;
      return principal * (1 + rate) ** exp;
    };
    assert.ok(d.format === 'mcq');
    d.choices.forEach((c, i) => {
      const same = [1, 2, 3].every((t) => close(evalV(c.display, t), truth(t)));
      assert.equal(same, i === d.correctIndex, `Lựa chọn ${c.display} ${same ? 'cũng khớp' : 'không khớp'} lãi kép. Đề: ${d.stem}`);
    });
  },

  /** Đọc bảng: hiệu không đổi là tuyến tính, tỉ số không đổi là mũ. */
  'pd-linear-vs-exp-identify': (d) => {
    assert.ok(d.figure && d.figure.kind === 'data_table', 'Câu này phải có bảng.');
    const ys = d.figure.rows.map((row) => Number(row.cells[0]));
    const xs = d.figure.rows.map((row) => Number(row.label));
    assert.equal(ys.length, 4);
    for (let i = 1; i < 4; i += 1) assert.equal(xs[i]! - xs[i - 1]!, 1, 'x phải cách đều 1.');
    const diffs = ys.slice(1).map((y, i) => y - ys[i]!);
    const ratios = ys.slice(1).map((y, i) => y / ys[i]!);
    const linearish = diffs.every((v) => v === diffs[0]) && diffs[0] !== 0;
    const expish = ratios.every((v) => close(v, ratios[0]!)) && ratios[0] !== 1;
    assert.ok(linearish !== expish, `Bảng vừa/không phải tuyến tính lẫn mũ: ${ys.join(', ')}`);
    const dir = ys[3]! > ys[0]! ? 'Increasing' : 'Decreasing';
    assert.equal(correctDisplay(d), `${dir} ${linearish ? 'linear' : 'exponential'}`);
  },

  /** Tỉ số F/A phải là luỹ thừa bậc t của một phân số; phần trăm tăng suy ra từ đó. */
  'pd-exp-growth-model-hard': (d) => {
    const m = match(d.stem, /increased by p% each (\w+), where p is a constant\. At the start of a study the count was (\d+), and exactly (\d+) (\w+) later it was (\d+)\. What is the value of p\?$/);
    assert.equal(m[4], `${m[1]}s`);
    const A = Number(m[2]);
    const t = Number(m[3]);
    const ratio = rat(Number(m[5]), A);
    const rn = intRoot(ratio.num, t);
    const rd = intRoot(ratio.den, t);
    assert.ok(rn !== null && rd !== null, `Tỉ số ${ratio.num}/${ratio.den} không phải luỹ thừa bậc ${t}.`);
    expectAnswer(d, rat((rn - rd) * 100, rd));
  },

  'pd-proportion-inverse': (d) => {
    assert.ok(d.stem.includes('is inversely proportional to the square of the distance'));
    const m = match(d.stem, /At a distance of (\d+) \w+, the \w+ is (\d+) \w+\. What is the \w+, in \w+, at a distance of (\d+) \w+\?$/);
    const [d1, I1, d2] = [Number(m[1]), Number(m[2]), Number(m[3])];
    expectAnswer(d, rat(I1 * d1 * d1, d2 * d2));
  },

  'pd-conversion-chain': (d) => {
    const coins = d.stem.match(/1 gold coin is worth (\d+) silver coins, and 1 silver coin is worth (\d+) bronze coins\. A player exchanges (\d+) bronze coins/);
    if (coins) {
      const [g, s, N] = [Number(coins[1]), Number(coins[2]), Number(coins[3])];
      const G = rat(N, g * s);
      assert.equal(G.den, 1, 'Số đồng không đổi trọn ra vàng.');
      expectAnswer(d, G);
      return;
    }
    const pump = match(d.stem, /rate of (\d+) liters per minute\. At this rate, how many hours will it take the pump to move (\d+) kiloliters of water\?/);
    expectAnswer(d, rat(Number(pump[2]) * 1000, Number(pump[1]) * 60));
  },

  'pd-rate-combined-work': (d) => {
    const together = d.stem.match(/^Working alone at a constant rate, [\w ]+? can [\w ]+? in (\d+) hours\. Working alone at a constant rate, [\w ]+? can [\w ]+? in (\d+) hours\. If both work together/);
    if (together) {
      const [a, b] = [Number(together[1]), Number(together[2])];
      expectAnswer(d, rat(a * b, a + b));
      return;
    }
    const alone = match(d.stem, /^Working together at constant rates, [\w ]+? can [\w ]+? in (\d+) hours\. Working alone, [\w ]+? can [\w ]+? in (\d+) hours\./);
    const [T, a] = [Number(alone[1]), Number(alone[2])];
    assert.ok(a > T, 'Một vòi không thể nhanh hơn hai vòi cùng chảy.');
    expectAnswer(d, rat(a * T, a - T));
  },

  /**
   * Thế số: chọn giá trị cho ẩn cần rút và biến còn lại, tính vế trái theo công
   * thức IN TRONG ĐỀ, rồi đưa vào từng lựa chọn. Chỉ đáp án đúng trả lại đúng
   * giá trị ban đầu ở mọi bộ số.
   */
  'pd-isolate-variable': (d) => {
    const f = match(d.stem, /\b([A-Z]) = (frac\(\d+[a-z],[a-z]\)|\d+[a-z] \+ \d+[a-z]|\d+\([A-Za-z] \+ \d+[A-Za-z]\))/);
    const Y = f[1]!;
    const formula = f[2]!;
    const q = match(d.stem, /correctly expresses ([A-Za-z]) in terms of ([A-Za-z]) and ([A-Za-z])\?$/);
    const target = q[1]!;
    const other = q[2] === Y ? q[3]! : q[2]!;
    assert.ok(q[2] === Y || q[3] === Y, 'Câu hỏi phải nhắc tới biến vế trái.');
    const sets = [
      { t: 7, o: 3 },
      { t: 2, o: 5 },
      { t: 11, o: 4 },
    ];
    const works = (display: string): boolean => {
      const c = display.match(/^([A-Za-z]) = (.+)$/);
      assert.ok(c, `Lựa chọn lạ: ${display}`);
      if (c[1] !== target) return false;
      return sets.every(({ t, o }) => {
        const yVal = evalExpr(formula, { [target]: t, [other]: o });
        return close(evalExpr(c[2]!, { [Y]: yVal, [other]: o }), t);
      });
    };
    assert.ok(d.format === 'mcq');
    d.choices.forEach((c, i) => {
      assert.equal(works(c.display), i === d.correctIndex, `Lựa chọn ${c.display} sai vai trò. Đề: ${d.stem}`);
    });
  },

  'pd-match-coef-easy': (d) => {
    const m = match(d.stem, /^The expression \((\d+)x ([+-]) (\d+)\)\(x ([+-]) (\d+)\) is equivalent to (\d+)x\^2 \+ kx ([+-]) (\d+), where k is a constant\./);
    const a = Number(m[1]);
    const b = sgn(m[2]) * Number(m[3]);
    const c = sgn(m[4]) * Number(m[5]);
    assert.equal(Number(m[6]), a, 'Hệ số x² in sai.');
    assert.equal(sgn(m[7]) * Number(m[8]), b * c, 'Hằng số in sai.');
    const k = answerOf(d);
    // Thế x = 2 vào hai vế.
    assert.ok((2 * a + b) * (2 + c) === 4 * a + 2 * toDecimal(k) + b * c, `Thế x = 2 thì hai vế lệch. Đề: ${d.stem}`);
  },

  'pd-matching-coefficients': (d) => {
    const m = match(d.stem, /^The equation (\d+)x\(x \+ (\d+)\) - k\(x \+ (\d+)\) = (\d+)x\^2(?: ([+-]) (\d*)x)? - (\d+) is true for all values of x/);
    const [M, a, b] = [Number(m[1]), Number(m[2]), Number(m[3])];
    assert.equal(Number(m[4]), M);
    const e = m[5] ? sgn(m[5]) * coef(m[6]) : 0;
    const f = Number(m[7]);
    const k = rat(f, b);
    assert.equal(k.den, 1);
    assert.equal(M * a - k.num, e, 'Hệ số của x không khớp với k suy từ hằng số — không phải đồng nhất thức.');
    expectAnswer(d, k);
  },

  /** Quét nghiệm nguyên, loại giá trị làm mẫu bằng 0, rồi dựng lại câu trả lời. */
  'pd-clearing-denominators': (d) => {
    const m = match(d.stem, /frac\(x,x ([+-]) (\d+)\) ([+-]) frac\((\d+),x\) = frac\((\d+),x\(x ([+-]) (\d+)\)\)\?$/);
    const a = -sgn(m[1]) * Number(m[2]);
    const c = sgn(m[3]) * Number(m[4]);
    const D = Number(m[5]);
    assert.equal(-sgn(m[6]) * Number(m[7]), a, 'Hai mẫu phải cùng thừa số x - a.');
    const sols: number[] = [];
    for (let x = -60; x <= 60; x += 1) {
      if (x === 0 || x === a) continue;
      // Tính trực tiếp trên phương trình gốc bằng phân số chính xác.
      const lhs = rat(x * x + c * (x - a), x * (x - a));
      if (equalsValue(lhs, rat(D, x * (x - a)))) sols.push(x);
    }
    assert.equal(sols.length, 1, `Kỳ vọng đúng một nghiệm, tìm được ${sols.join(', ')}.`);
    assert.equal(correctDisplay(d), String(sols[0]));
  },

  'pd-system-elimination-easy': (d) => {
    const eqs = [...d.stem.matchAll(/(-?\d*)x ([+-]) (\d*)y = (-?\d+)/g)].map((m) => ({
      a: coef(m[1]),
      b: sgn(m[2]) * coef(m[3]),
      c: Number(m[4]),
    }));
    assert.equal(eqs.length, 2);
    const [p, q] = eqs as [{ a: number; b: number; c: number }, { a: number; b: number; c: number }];
    const det = p.a * q.b - q.a * p.b;
    assert.notEqual(det, 0);
    const ask = match(d.stem, /value of ([xy])\?$/)[1];
    expectAnswer(d, ask === 'x' ? rat(p.c * q.b - q.c * p.b, det) : rat(p.a * q.c - q.a * p.c, det));
  },

  'pd-inequality-solve-easy': (d) => {
    const m = match(d.stem, /inequality (\d+)x ([+-]) (\d+) (<=|>=|<|>) (-?\d+)\?$/);
    const a = Number(m[1]);
    const b = sgn(m[2]) * Number(m[3]);
    const c = Number(m[5]);
    const k = rat(c - b, a);
    assert.equal(k.den, 1);
    assert.equal(correctDisplay(d), `x ${m[4]} ${k.num}`);
  },

  /** Thế từng điểm vào hai bất phương trình in trong đề: đúng một điểm thoả cả hai. */
  'pd-inequality-system-region': (d) => {
    const m = match(d.stem, /system of inequalities y (>=|>) (.+) and y (<=|<) (.+)\?$/);
    const l1 = linear(m[2]!);
    const l2 = linear(m[4]!);
    const ok = (x: number, y: number) => {
      const v1 = l1.m * x + l1.b;
      const v2 = l2.m * x + l2.b;
      const first = m[1] === '>' ? y > v1 : y >= v1;
      const second = m[3] === '<' ? y < v2 : y <= v2;
      return first && second;
    };
    assert.ok(d.format === 'mcq');
    d.choices.forEach((c, i) => {
      const p = match(c.display, /^\((-?\d+), (-?\d+)\)$/);
      assert.equal(ok(Number(p[1]), Number(p[2])), i === d.correctIndex, `Điểm ${c.display} sai vai trò. Đề: ${d.stem}`);
    });
  },

  'pd-word-age-or-consecutive': (d) => {
    const age = d.stem.match(/^(\w+) is (\d+) times as old as her brother\. In (\d+) years, (\w+) will be (\d+) times as old as her brother\. How old is (.+) now, in years\?$/);
    if (age) {
      const [m, y, n] = [Number(age[2]), Number(age[3]), Number(age[5])];
      assert.equal(age[1], age[4]);
      const B = rat(y * (n - 1), m - n);
      assert.equal(B.den, 1, 'Tuổi phải nguyên.');
      assert.ok(B.num > 0);
      expectAnswer(d, age[6] === 'her brother' ? B : rat(m * B.num));
      return;
    }
    const c = match(d.stem, /^The sum of (\d+) consecutive (odd integers|even integers|integers) is (-?\d+)\. What is the (greatest|least) of these integers\?$/);
    const k = Number(c[1]);
    const gap = c[2] === 'integers' ? 1 : 2;
    const S = Number(c[3]);
    const first = rat(S - (gap * k * (k - 1)) / 2, k);
    assert.equal(first.den, 1);
    if (c[2] === 'odd integers') assert.equal(Math.abs(first.num % 2), 1);
    if (c[2] === 'even integers') assert.equal(Math.abs(first.num % 2), 0);
    expectAnswer(d, rat(c[4] === 'greatest' ? first.num + gap * (k - 1) : first.num));
  },

  'pd-perpendicular-line': (d) => {
    const m = match(d.stem, /through the point \((-?\d+), (-?\d+)\) and is perpendicular to the line with equation (-?\d*)x ([+-]) (\d*)y = (-?\d+)\./);
    const [p, q] = [Number(m[1]), Number(m[2])];
    const a = coef(m[3]);
    const b = sgn(m[4]) * coef(m[5]);
    // Hệ số góc đã cho là -a/b, vuông góc là b/a; tung độ gốc c = q - (b/a)p.
    expectAnswer(d, rat(q * a - b * p, a));
  },

  'pd-model-interpret-hard': (d) => {
    const units = d.stem.match(/^The equation V = (\d+) - (\d+)t models the value V, in dollars, of a [\w ]+ t months after it was purchased, for 0 <= t <= (\d+)\./);
    if (units) {
      const [a, b, tMax] = [Number(units[1]), Number(units[2]), Number(units[3])];
      assert.ok(a - b * tMax > 0, 'Giá trị âm trong miền mô hình.');
      assert.equal(correctDisplay(d), `The value decreases by $${12 * b} each year.`);
      return;
    }
    const m = match(d.stem, /small gift boxes for \$(\d+) each and large gift boxes for \$(\d+) each\. .* was \$(\d+), as modeled by the equation (\d+)x \+ (\d+)y = (\d+)\./);
    const [p, q, T] = [Number(m[1]), Number(m[2]), Number(m[3])];
    assert.deepEqual([Number(m[4]), Number(m[5]), Number(m[6])], [p, q, T], 'Phương trình không khớp giá trong đề.');
    const y = rat(T, q);
    assert.equal(y.den, 1);
    assert.equal(correctDisplay(d), `If the store sold no small boxes, it sold ${y.num} large boxes.`);
  },

  'pd-a-extra-1': (d) => {
    const m = match(d.stem, /passes through the points \((-?\d+), (-?\d+)\) and \((-?\d+), (-?\d+)\)\./);
    const [x1, y1, x2, y2] = [1, 2, 3, 4].map((i) => Number(m[i]));
    assert.notEqual(y1, y2, 'Đường nằm ngang không cắt trục x.');
    // X = x1 - y1·(x2 - x1)/(y2 - y1)
    expectAnswer(d, rat(x1! * (y2! - y1!) - y1! * (x2! - x1!), y2! - y1!));
  },

  'pd-a-extra-2': (d) => {
    const m = match(d.stem, /^For x > 0, which of the following is equivalent to frac\(([^,]+),(.+)\)\?$/);
    const expOf = (part: string): MathValue => {
      const sq = part.match(/sqrt\(x(?:\^(\d+))?\)/);
      const rest = part.replace(/sqrt\(x(?:\^\d+)?\)/, '');
      const p = rest.match(/x\^(\d+)/);
      assert.ok(p, `Không đọc được luỹ thừa: ${part}`);
      return rat(2 * Number(p[1]) + (sq ? coef(sq[1]) : 0), 2);
    };
    const top = expOf(m[1]!);
    const bottom = expOf(m[2]!);
    const expected = rat(top.num * bottom.den - bottom.num * top.den, top.den * bottom.den);
    const shown = correctDisplay(d);
    let got: MathValue;
    if (shown === '1') got = rat(0);
    else if (shown === 'x') got = rat(1);
    else {
      const e = match(shown, /^x\^(?:(\d+)|\((-?\d+)(?:\/(\d+))?\))$/);
      got = e[1] ? rat(Number(e[1])) : rat(Number(e[2]), e[3] ? Number(e[3]) : 1);
    }
    assert.ok(equalsValue(got, expected), `Số mũ ${got.num}/${got.den} ≠ ${expected.num}/${expected.den}. Đề: ${d.stem}`);
  },
};

// --------------------------------------------------------------- test

test('đủ 22 template, slug duy nhất và mang tiền tố pd-', () => {
  assert.equal(PANDA_A_TEMPLATES.length, 22);
  const slugs = PANDA_A_TEMPLATES.map((t) => t.slug);
  assert.equal(new Set(slugs).size, slugs.length);
  for (const slug of slugs) assert.ok(slug.startsWith('pd-'), slug);
});

test('mọi template đều có bộ kiểm chứng riêng', () => {
  for (const t of PANDA_A_TEMPLATES) assert.ok(VERIFIERS[t.slug], `Thiếu bộ kiểm chứng cho ${t.slug}`);
});

for (const template of PANDA_A_TEMPLATES) {
  test(`${template.slug}: đáp án đúng trên ${SEEDS} hạt (đọc ngược từ đề)`, () => {
    const verify = VERIFIERS[template.slug]!;
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
      const rendered = [d.stem, ...displays].join(' ');
      assert.ok(!/NaN|Infinity|undefined|null/.test(rendered), `Đề in ra rác: ${rendered}`);
      assert.ok(!/-0\b/.test(rendered), `Đề in ra số âm 0: ${rendered}`);
      assert.ok(!/\+ -|- -/.test(rendered), `Đề in ra dấu chồng dấu: ${rendered}`);
      assert.ok(!/(?<![\d.])1x\b/.test(rendered), `Đề in ra hệ số 1 thừa: ${rendered}`);
      assert.ok(!/\(\s*\)/.test(rendered), `Đề in ra ngoặc rỗng: ${rendered}`);
    }
  });

  if (template.format === 'mcq') {
    test(`${template.slug}: bốn lựa chọn khác nhau, đáp án rải đều, nhiễu nào cũng có lý do`, () => {
      const positions = new Set<number>();
      for (let seed = 0; seed < SEEDS; seed += 1) {
        const d = draftOf(template.slug, seed);
        assert.ok(d.format === 'mcq');
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
