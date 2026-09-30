import assert from 'node:assert/strict';
import { test } from 'node:test';

import { PANDA_B_TEMPLATES } from './panda-b';
import { validateMath } from '@/lib/math/expr';
import type { MathItemDraft, MathValue } from '@/lib/math/types';
import { addValue, divValue, equalsValue, mulValue, negValue, rat, subValue } from '@/lib/math/value';
import { fitsGrid } from '@/services/math/grid-in';
import { hashString, mulberry32 } from '@/services/questions/rng';

/**
 * Property test cho 20 dạng câu của `panda-b.ts`.
 *
 * Cùng triết lý với `templates.test.ts`: ĐỌC NGƯỢC TỪ ĐỀ BÀI rồi tự giải, không
 * đọc tham số nội bộ của template. Đề in ra một dãy số khác với thứ template
 * nghĩ thì bộ kiểm chứng giải theo đề và bắt được ngay. Chỗ nào thế ngược được
 * (thương × mẫu + dư phải ra tử, nghiệm thế vào phải thoả) thì kiểm bằng cách ấy.
 *
 * Gọi thẳng `template.build(rng)` với hạt `${slug}:${i}`, để file này chạy được
 * độc lập trước khi các template được nối vào danh bạ chung.
 */

const SEEDS = 200;

function build(slug: string, i: number): MathItemDraft {
  const template = PANDA_B_TEMPLATES.find((t) => t.slug === slug);
  assert.ok(template, `Không có template ${slug}`);
  return template.build(mulberry32(hashString(`${slug}:${i}`)));
}

// --------------------------------------------------------------- tiện ích đọc

/** "12", "-3", "frac(3,4)", "-frac(3,4)", kèm "%" ở cuối nếu có. */
function tryNum(display: string): MathValue | null {
  const t = display.replace(/%$/, '');
  const int = t.match(/^(-?\d+)$/);
  if (int) return rat(Number(int[1]));
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

function expect(d: MathItemDraft, expected: MathValue, why: string) {
  const got = answerOf(d);
  assert.ok(
    equalsValue(got, expected),
    `${why}: kỳ vọng ${expected.num}/${expected.den}, template cho ${got.num}/${got.den}. Đề: ${d.stem}`,
  );
}

function match(text: string, pattern: RegExp): RegExpMatchArray {
  const m = text.match(pattern);
  assert.ok(m, `Đề không đúng khuôn ${pattern}: ${text}`);
  return m;
}

const sgn = (s: string | undefined) => (s === '-' ? -1 : 1);
const coef = (t: string | undefined) => (t === undefined || t === '' ? 1 : t === '-' ? -1 : Number(t));

/** Đọc đa thức một biến bất kỳ bậc: "2x^3 - x^2 + 4x - 7" → {3:2, 2:-1, 1:4, 0:-7}. */
function parsePoly(text: string, v = 'x'): Map<number, number> {
  const out = new Map<number, number>();
  const terms = text.trim().replace(/ - /g, ' + -').split(' + ');
  for (const term of terms) {
    const pow = term.match(new RegExp(`^(-?\\d*)${v}\\^(\\d+)$`));
    const lin = term.match(new RegExp(`^(-?\\d*)${v}$`));
    const con = term.match(/^-?\d+$/);
    if (pow) out.set(Number(pow[2]), coef(pow[1]));
    else if (lin) out.set(1, coef(lin[1]));
    else if (con) out.set(0, Number(term));
    else throw new Error(`Không đọc được số hạng "${term}" trong "${text}"`);
  }
  return out;
}

const pc = (p: Map<number, number>, k: number) => p.get(k) ?? 0;

/** Đọc "x - 3" / "x + 3" / "x" → nghiệm a của nhân tử x - a. */
function rootOfDivisor(text: string): number {
  const m = match(text.trim(), /^x(?: ([+-]) (\d+))?$/);
  return m[1] ? -sgn(m[1]) * Number(m[2]) : 0;
}

type Cx = { re: MathValue; im: MathValue };

/** Đọc số phức "a + bi" với phần hữu tỉ. */
function parseComplex(text: string): Cx {
  let re = rat(0);
  let im = rat(0);
  const terms = text.trim().replace(/ - /g, ' + -').split(' + ');
  for (const term of terms) {
    if (term.endsWith('i')) {
      const c = term.slice(0, -1);
      im = addValue(im, c === '' ? rat(1) : c === '-' ? rat(-1) : num(c));
    } else {
      re = addValue(re, num(term));
    }
  }
  return { re, im };
}

const cxEq = (a: Cx, b: Cx) => equalsValue(a.re, b.re) && equalsValue(a.im, b.im);
const cxMul = (a: Cx, b: Cx): Cx => ({
  re: subValue(mulValue(a.re, b.re), mulValue(a.im, b.im)),
  im: addValue(mulValue(a.re, b.im), mulValue(a.im, b.re)),
});

function expectComplex(d: MathItemDraft, expected: Cx) {
  const got = parseComplex(correctDisplay(d));
  assert.ok(cxEq(got, expected), `Số phức sai: template cho ${correctDisplay(d)}. Đề: ${d.stem}`);
  // Không nhiễu nào được vô tình cũng đúng.
  if (d.format === 'mcq') {
    d.choices.forEach((c, i) => {
      if (i !== d.correctIndex) assert.ok(!cxEq(parseComplex(c.display), expected), `Nhiễu "${c.display}" cũng đúng.`);
    });
  }
}

function tableCells(d: MathItemDraft): Array<{ label: string; cells: number[] }> {
  assert.ok(d.figure && d.figure.kind === 'data_table', 'Câu này phải có bảng.');
  return d.figure.rows.map((r) => ({ label: r.label, cells: r.cells.map(Number) }));
}

// ----------------------------------------------------------------- verifier

type Verifier = (d: MathItemDraft) => void;

const VERIFIERS: Record<string, Verifier> = {
  'pd-function-undefined-or-inverse': (d) => {
    if (d.stem.includes('not defined')) {
      const m = match(d.stem, /f\(x\) = frac\(([^,]+),([^)]+)\)\. What is the (greatest|least) value of x/);
      const p = parsePoly(m[2]!);
      assert.equal(pc(p, 2), 1);
      const b = pc(p, 1);
      const c = pc(p, 0);
      const disc = b * b - 4 * c;
      const s = Math.round(Math.sqrt(disc));
      assert.equal(s * s, disc, 'Mẫu phải có nghiệm nguyên.');
      assert.ok(s > 0, 'Mẫu phải có hai nghiệm phân biệt.');
      const roots = [(-b - s) / 2, (-b + s) / 2];
      expect(d, rat(m[3] === 'greatest' ? roots[1]! : roots[0]!), 'Nghiệm của mẫu');
      return;
    }
    const m = match(
      d.stem,
      /f\(x\) = (\d+)x(?: ([+-]) (\d+))? and g\(x\) = x\^2(?: ([+-]) (\d+))?\. If f\(g\(t\)\) = (-?\d+) and t > 0/,
    );
    const slope = Number(m[1]);
    const n = m[2] ? sgn(m[2]) * Number(m[3]) : 0;
    const q = m[4] ? sgn(m[4]) * Number(m[5]) : 0;
    const K = Number(m[6]);
    const t = answerOf(d);
    assert.equal(t.den, 1);
    assert.ok(t.num > 0, 't phải dương.');
    assert.equal(slope * (t.num * t.num + q) + n, K, 'Thế t vào f(g(t)) không ra K.');
  },

  'pd-remainder-theorem': (d) => {
    const m = match(d.stem, /p\(x\) = (.+)\. What is the remainder when p\(x\) is divided by (x [+-] \d+)\?$/);
    const p = parsePoly(m[1]!);
    const a = rootOfDivisor(m[2]!);
    let value = 0;
    for (const [k, c] of p) value += c * a ** k;
    expect(d, rat(value), 'p(a)');
  },

  'pd-polynomial-factor-k': (d) => {
    const m = match(
      d.stem,
      /p\(x\) = x\^3 ([+-]) (\d*)x\^2 \+ kx ([+-]) (\d+), k is a constant\. If (x [+-] \d+) is a factor of p\(x\)/,
    );
    const b = sgn(m[1]) * coef(m[2]);
    const dd = sgn(m[3]) * Number(m[4]);
    const a = rootOfDivisor(m[5]!);
    const k = answerOf(d);
    // p(a) = a^3 + b a^2 + k a + d phải bằng 0.
    const pa = addValue(rat(a ** 3 + b * a * a + dd), mulValue(k, rat(a)));
    assert.ok(equalsValue(pa, rat(0)), `p(${a}) ≠ 0 với k = ${k.num}/${k.den}. Đề: ${d.stem}`);
  },

  'pd-poly-division-quotient': (d) => {
    const m = match(d.stem, /equivalent to frac\(([^,]+),([^)]+)\)\?$/);
    const p = parsePoly(m[1]!);
    const a = rootOfDivisor(m[2]!);
    const ans = match(
      correctDisplay(d),
      /^(\d*)x(?: ([+-]) (\d+))?(?: ([+-]) frac\((\d+),(x(?: [+-] \d+)?)\))?$/,
    );
    const Q = coef(ans[1]);
    const q0 = ans[2] ? sgn(ans[2]) * Number(ans[3]) : 0;
    const R = ans[4] ? sgn(ans[4]) * Number(ans[5]) : 0;
    if (ans[6]) assert.equal(rootOfDivisor(ans[6]), a, 'Mẫu của phần dư phải là số chia.');
    // (Qx + q0)(x - a) + R ≡ tử số.
    assert.equal(Q, pc(p, 2), 'Hệ số bậc hai');
    assert.equal(q0 - Q * a, pc(p, 1), 'Hệ số bậc nhất');
    assert.equal(R - q0 * a, pc(p, 0), 'Hằng số');
    assert.equal(p.size <= 3 && [...p.keys()].every((k) => k <= 2), true);
  },

  'pd-complex-add': (d) => {
    const m = match(d.stem, /equivalent to \((.+)\) ([+-]) \((.+)\), where i = sqrt\(-1\)\?$/);
    const x = parseComplex(m[1]!);
    const y = parseComplex(m[3]!);
    const s = rat(sgn(m[2]));
    expectComplex(d, { re: addValue(x.re, mulValue(s, y.re)), im: addValue(x.im, mulValue(s, y.im)) });
  },

  'pd-complex-multiply': (d) => {
    const m = match(d.stem, /equivalent to \((.+)\)\((.+)\), where i = sqrt\(-1\)\?$/);
    expectComplex(d, cxMul(parseComplex(m[1]!), parseComplex(m[2]!)));
  },

  'pd-complex-divide': (d) => {
    const m = match(d.stem, /equivalent to frac\(([^,]+),([^)]+)\), where i = sqrt\(-1\)\?$/);
    const top = parseComplex(m[1]!);
    const bottom = parseComplex(m[2]!);
    const conj = { re: bottom.re, im: negValue(bottom.im) };
    const n = cxMul(top, conj);
    const N = cxMul(bottom, conj).re;
    const expected = { re: divValue(n.re, N), im: divValue(n.im, N) };
    expectComplex(d, expected);
    // Thế ngược: đáp án × mẫu phải ra tử.
    assert.ok(cxEq(cxMul(parseComplex(correctDisplay(d)), bottom), top));
  },

  'pd-abs-evaluate': (d) => {
    const m = match(
      d.stem,
      /f\(x\) = \|(\d*)x(?: ([+-]) (\d+))?\|(?: ([+-]) (\d+))?\. What is the value of f\((-?\d+)\)\?$/,
    );
    const a = coef(m[1]);
    const b = m[2] ? sgn(m[2]) * Number(m[3]) : 0;
    const c = m[4] ? sgn(m[4]) * Number(m[5]) : 0;
    const k = Number(m[6]);
    expect(d, rat(Math.abs(a * k + b) + c), 'f(k)');
  },

  'pd-abs-inequality': (d) => {
    const count = d.stem.match(/^How many integer values of x satisfy \|(\d*)x(?: ([+-]) (\d+))?\| < (\d+)\?$/);
    if (count) {
      const k = coef(count[1]);
      const s = count[2] ? sgn(count[2]) * Number(count[3]) : 0;
      const b = Number(count[4]);
      let n = 0;
      for (let x = -200; x <= 200; x += 1) if (Math.abs(k * x + s) < b) n += 1;
      expect(d, rat(n), 'Đếm nghiệm nguyên');
      return;
    }
    const m = match(d.stem, /^Which of the following inequalities is equivalent to (-?\d+) < x < (-?\d+)\?$/);
    const lo = Number(m[1]);
    const hi = Number(m[2]);
    // Một lựa chọn đúng khi tập nghiệm của nó (trên lưới nửa đơn vị) trùng khoảng (lo, hi).
    const describes = (display: string) => {
      const c = match(display, /^\|x(?: ([+-]) (\d+))?\| (<|>) (-?\d+)$/);
      const shift = c[1] ? sgn(c[1]) * Number(c[2]) : 0;
      const r = Number(c[4]);
      for (let x2 = 2 * lo - 40; x2 <= 2 * hi + 40; x2 += 1) {
        const x = x2 / 2;
        const holds = c[3] === '<' ? Math.abs(x + shift) < r : Math.abs(x + shift) > r;
        if (holds !== (x > lo && x < hi)) return false;
      }
      return true;
    };
    assert.ok(describes(correctDisplay(d)), `Đáp án không mô tả đúng khoảng: ${correctDisplay(d)}`);
    if (d.format === 'mcq') {
      d.choices.forEach((c, i) => {
        if (i !== d.correctIndex) assert.ok(!describes(c.display), `Nhiễu "${c.display}" cũng đúng.`);
      });
    }
  },

  'pd-supplementary-angles': (d) => {
    const direct = d.stem.match(/the measure of angle P is (\d+)°/);
    if (direct) {
      expect(d, rat(180 - Number(direct[1])), 'Góc bù');
      return;
    }
    const m = match(d.stem, /one angle is x°, and the measure of the other angle is \(x \+ (\d+)\)°/);
    const x = answerOf(d);
    assert.ok(equalsValue(addValue(mulValue(rat(2), x), rat(Number(m[1]))), rat(180)), 'x + (x + d) ≠ 180');
  },

  'pd-polygon-interior': (d) => {
    const regular = d.stem.match(/^Each interior angle of a regular polygon measures (\d+)°/);
    if (regular) {
      const E = Number(regular[1]);
      const n = answerOf(d).num;
      assert.equal(180 * (n - 2), E * n, 'Góc trong của đa giác đều không khớp.');
      return;
    }
    const each = d.stem.match(/each interior angle of a regular polygon with (\d+) sides\?$/);
    if (each) {
      const n = Number(each[1]);
      expect(d, rat(180 * (n - 2), n), 'Góc trong đa giác đều');
      return;
    }
    const sum = d.stem.match(/interior angles of a convex polygon is (\d+)°\. How many sides/);
    if (sum) {
      const S = Number(sum[1]);
      assert.equal(S % 180, 0);
      expect(d, rat(S / 180 + 2), 'Số cạnh');
      return;
    }
    const m = match(d.stem, /has (\d+) sides\. The sum of the measures of (\d+) of its interior angles is (\d+)°/);
    const n = Number(m[1]);
    assert.equal(Number(m[2]), n - 1);
    const last = 180 * (n - 2) - Number(m[3]);
    assert.ok(last > 0 && last < 180, 'Góc còn lại phải hợp với đa giác lồi.');
    expect(d, rat(last), 'Góc còn lại');
  },

  'pd-similar-triangles': (d) => {
    const par = d.stem.match(/AD = (\d+), DB = (\d+), and DE = (\d+)/);
    if (par) {
      const [AD, DB, DE] = par.slice(1, 4).map(Number) as [number, number, number];
      expect(d, rat(DE * (AD + DB), AD), 'BC = DE · AB / AD');
      return;
    }
    const m = match(d.stem, /PQ = (\d+), XY = (\d+), and the area of triangle PQR is (\d+) square units/);
    const [PQ, XY, A] = m.slice(1, 4).map(Number) as [number, number, number];
    expect(d, rat(A * XY * XY, PQ * PQ), 'Diện tích theo bình phương tỉ số');
  },

  'pd-circle-diameter-easy': (d) => {
    const ask = match(d.stem, /What is the (diameter|radius),/)[1];
    let diameter: MathValue;
    const r = d.stem.match(/has a radius of (\d+) /);
    const dia = d.stem.match(/has a diameter of (\d+) /);
    const circ = d.stem.match(/circumference of a circle is (\d+) pi /);
    if (r) diameter = rat(2 * Number(r[1]));
    else if (dia) diameter = rat(Number(dia[1]));
    else diameter = rat(Number(match(d.stem, /circumference of a circle is (\d+) pi /)[1]));
    assert.ok(r || dia || circ);
    expect(d, ask === 'diameter' ? diameter : divValue(diameter, rat(2)), 'Đường tròn');
  },

  'pd-sin-cos-complement': (d) => {
    const angle = d.stem.match(/^If (sin|cos)\((\d+)°\) = (sin|cos)\(k°\), where 0 < k < 90/);
    if (angle) {
      assert.notEqual(angle[1], angle[3]);
      const k = answerOf(d);
      assert.ok(equalsValue(addValue(k, rat(Number(angle[2]))), rat(90)), 'k + x phải bằng 90.');
      return;
    }
    const m = match(
      d.stem,
      /^In right triangle (\w)(\w)(\w), angle (\w) is a right angle and sin (\w) = frac\((\d+),(\d+)\)\. What is the value of cos (\w)\?$/,
    );
    const letters = new Set([m[1], m[2], m[3]]);
    assert.equal(letters.size, 3);
    assert.ok(letters.has(m[4]) && letters.has(m[5]) && letters.has(m[8]));
    assert.equal(new Set([m[4], m[5], m[8]]).size, 3, 'Hai góc nhọn và góc vuông phải khác nhau.');
    expect(d, rat(Number(m[6]), Number(m[7])), 'cos B = sin A');
  },

  'pd-radians-convert': (d) => {
    const deg = d.stem.match(/^An angle has a measure of (\d+)°\. The measure of the angle is k pi radians/);
    if (deg) {
      expect(d, rat(Number(deg[1]), 180), 'Độ sang radian');
      return;
    }
    const rad = d.stem.match(/^An angle has a measure of frac\((\d+),(\d+)\) pi radians\. What is the measure of the angle, in degrees\?$/);
    if (rad) {
      expect(d, rat(180 * Number(rad[1]), Number(rad[2])), 'Radian sang độ');
      return;
    }
    const m = match(d.stem, /radius of (\d+) centimeters\. A central angle of frac\((\d+),(\d+)\) pi radians intercepts an arc of length k pi/);
    expect(d, rat(Number(m[1]) * Number(m[2]), Number(m[3])), 'Độ dài cung');
  },

  'pd-table-read': (d) => {
    const rows = tableCells(d);
    const valueOf = (day: string) => {
      const row = rows.find((r) => r.label === day);
      assert.ok(row, `Bảng không có dòng ${day}`);
      return row.cells[0]!;
    };
    const diff = d.stem.match(/How many more .+ on (\w+) than on (\w+)\?$/);
    if (diff) {
      const v = valueOf(diff[1]!) - valueOf(diff[2]!);
      assert.ok(v > 0, 'Hỏi "nhiều hơn" thì ngày đầu phải lớn hơn.');
      expect(d, rat(v), 'Chênh lệch');
      return;
    }
    const m = match(d.stem, /from (\w+) through (\w+)\?$/);
    const i = rows.findIndex((r) => r.label === m[1]);
    const j = rows.findIndex((r) => r.label === m[2]);
    assert.ok(i >= 0 && j > i);
    expect(d, rat(rows.slice(i, j + 1).reduce((s, r) => s + r.cells[0]!, 0)), 'Tổng');
  },

  'pd-table-percent-hard': (d) => {
    assert.ok(d.figure && d.figure.kind === 'data_table');
    const fig = d.figure;
    const rows = tableCells(d);
    const colLabels = fig.columns.slice(1, 3);
    // Tổng phải cộng đúng từ các ô, và bằng con số in trong đề.
    for (const r of rows) assert.equal(r.cells[0]! + r.cells[1]!, r.cells[2]);
    const grand = rows.reduce((s, r) => s + r.cells[2]!, 0);
    assert.equal(Number(match(d.stem, /shows the (\d+) /)[1]), grand);
    assert.deepEqual(fig.totalRow?.cells.map(Number), [rows[0]!.cells[0]! + rows[1]!.cells[0]!, rows[0]!.cells[1]! + rows[1]!.cells[1]!, grand]);
    for (const r of rows) for (const c of r.cells) assert.ok(c > 0, 'Ô âm hoặc bằng 0.');

    const lower = d.stem.toLowerCase();
    const ri = rows.findIndex((r) => lower.includes(r.label.toLowerCase()));
    const ci = colLabels.findIndex((c) => lower.includes(` ${c.toLowerCase()}`));
    assert.ok(ri >= 0 && ci >= 0, `Không nhận ra hàng/cột trong đề: ${d.stem}`);
    const cell = rows[ri]!.cells[ci]!;
    const byColumn = / who /.test(d.stem);
    const base = byColumn ? rows[0]!.cells[ci]! + rows[1]!.cells[ci]! : rows[ri]!.cells[0]! + rows[ri]!.cells[1]!;
    assert.ok(correctDisplay(d).endsWith('%'));
    expect(d, rat(100 * cell, base), 'Phần trăm theo nhóm điều kiện');
  },

  'pd-probability-without-replacement': (d) => {
    const m = match(d.stem, /contains (\d+) (\w+) marbles and (\d+) (\w+) marbles/);
    const count: Record<string, number> = { [m[2]!]: Number(m[1]), [m[4]!]: Number(m[3]) };
    const n = Number(m[1]) + Number(m[3]);
    assert.ok(d.stem.includes('without replacement'));
    const both = d.stem.match(/both marbles are (\w+)\?$/);
    if (both) {
      const t = count[both[1]!]!;
      expect(d, rat(t * (t - 1), n * (n - 1)), 'Cả hai cùng màu');
      return;
    }
    const o = match(d.stem, /the first marble is (\w+) and the second marble is (\w+)\?$/);
    assert.notEqual(o[1], o[2]);
    expect(d, rat(count[o[1]!]! * count[o[2]!]!, n * (n - 1)), 'Có thứ tự');
  },

  'pd-range-stddev-compare': (d) => {
    const sets = d.stem.match(/^Data set A consists of the values ([\d, ]+)\. Data set B consists of the values ([\d, ]+)\./);
    if (sets) {
      const parse = (s: string) => s.split(', ').map(Number);
      // Cùng số phần tử, nên so n·Σx² - (Σx)² là so phương sai.
      const spread = (v: number[]) => v.length * v.reduce((s, x) => s + x * x, 0) - v.reduce((s, x) => s + x, 0) ** 2;
      const A = parse(sets[1]!);
      const B = parse(sets[2]!);
      assert.equal(A.length, B.length);
      assert.notEqual(spread(A), spread(B));
      const bigger = spread(A) > spread(B) ? 'A' : 'B';
      assert.equal(correctDisplay(d), `Data set ${bigger} has the greater standard deviation.`);
      // Bẫy phải thật: tập đúng có khoảng biến thiên NHỎ hơn.
      const range = (v: number[]) => Math.max(...v) - Math.min(...v);
      const [big, small] = bigger === 'A' ? [A, B] : [B, A];
      assert.ok(range(big) < range(small), 'Tập có độ lệch chuẩn lớn hơn phải có khoảng biến thiên nhỏ hơn.');
      return;
    }
    const m = match(d.stem, /^A data set consists of the values ([\d, ]+)\. If the value (\d+) is replaced with (\d+),/);
    const before = m[1]!.split(', ').map(Number);
    const oldV = Number(m[2]);
    const newV = Number(m[3]);
    const idx = before.indexOf(oldV);
    assert.ok(idx >= 0);
    const after = [...before];
    after[idx] = newV;
    const median = (v: number[]) => {
      const s = [...v].sort((x, y) => x - y);
      return s.length % 2 ? s[(s.length - 1) / 2]! : (s[s.length / 2 - 1]! + s[s.length / 2]!) / 2;
    };
    const dir = (x: number, y: number) => (y > x ? 'increases' : y < x ? 'decreases' : 'stays the same');
    const sum = (v: number[]) => v.reduce((s, x) => s + x, 0);
    const c = match(correctDisplay(d), /^The mean (increases|decreases|stays the same) and the median (increases|decreases|stays the same)\.$/);
    assert.equal(c[1], dir(sum(before), sum(after)), 'Chiều đổi của trung bình');
    assert.equal(c[2], dir(median(before), median(after)), 'Chiều đổi của trung vị');
  },

  'pd-cone-sphere-volume': (d) => {
    const cone = d.stem.match(/diameter of (\d+) (\w+) and a height of (\d+) \w+\. The volume of the cone is k pi/);
    if (cone) {
      const r = rat(Number(cone[1]), 2);
      expect(d, mulValue(mulValue(r, r), rat(Number(cone[3]), 3)), 'Thể tích nón');
      return;
    }
    const sphere = d.stem.match(/^The volume of a sphere is (\d+|frac\(\d+,\d+\)) pi cubic \w+\. What is the radius/);
    if (sphere) {
      const V = num(sphere[1]!);
      const r = answerOf(d);
      // Thế ngược: 4/3 · r^3 phải bằng V.
      assert.ok(equalsValue(mulValue(rat(4, 3), mulValue(r, mulValue(r, r))), V), 'Thể tích cầu không khớp.');
      return;
    }
    const m = match(d.stem, /sphere has a radius of (\d+) \w+\. A right circular cone has a base radius of (\d+) \w+ and the same volume/);
    const R = Number(m[1]);
    const r = Number(m[2]);
    const h = answerOf(d);
    // 1/3 · r^2 · h = 4/3 · R^3
    assert.ok(equalsValue(mulValue(rat(r * r, 3), h), rat(4 * R ** 3, 3)), 'Thể tích nón ≠ thể tích cầu.');
  },
};

// ------------------------------------------------------------------ các test

test('panda-b: mỗi template đều có verifier, slug duy nhất và đúng tiền tố', () => {
  const slugs = PANDA_B_TEMPLATES.map((t) => t.slug);
  assert.equal(new Set(slugs).size, slugs.length);
  for (const t of PANDA_B_TEMPLATES) {
    assert.ok(t.slug.startsWith('pd-'), t.slug);
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
}

for (const template of PANDA_B_TEMPLATES) {
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
      assert.ok(!/-0\b/.test(rendered), `Đề in ra số âm 0: ${rendered}`);
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
