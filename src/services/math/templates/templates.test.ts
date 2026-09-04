import assert from 'node:assert/strict';
import { test } from 'node:test';

import { MATH_TEMPLATES, uncoveredSkills } from './index';
import { validateMath } from '@/lib/math/expr';
import { MATH_SKILL_DOMAIN } from '@/lib/math/types';
import type { MathItem, MathValue } from '@/lib/math/types';
import { equalsValue, formatValue, rat, toDecimal } from '@/lib/math/value';
import { generateMathItem } from '@/services/math/generator';
import { fitsGrid } from '@/services/math/grid-in';

/**
 * Property test của bộ sinh đề Math.
 *
 * ĐÂY LÀ CHỖ QUYẾT ĐỊNH module đáng tin hay không. Một câu toán sai đáp án tệ
 * hơn hẳn một câu đọc hiểu sai đáp án: người học tự giải ra kết quả của mình,
 * thấy lệch, và sẽ tin là mình sai.
 *
 * Nguyên tắc của bộ kiểm chứng bên dưới: ĐỌC NGƯỢC TỪ ĐỀ BÀI, không đọc tham số
 * nội bộ của template. Nếu chỉ so đáp án với biến mà chính template vừa tính ra
 * thì test luôn xanh kể cả khi câu đề in ra một dãy số hoàn toàn khác — mà đó
 * đúng là kiểu hỏng nguy hiểm nhất ở đây.
 *
 * Chỗ nào kiểm được bằng cách THẾ NGƯỢC thì kiểm bằng cách ấy, vì nó không phụ
 * thuộc vào việc người viết test có hiểu đúng ý người viết template hay không:
 * nghiệm thế vào phương trình phải ra 0, đỉnh parabol phải là trục đối xứng,
 * số nguyên lớn nhất thoả bất phương trình thì số kế tiếp phải không thoả.
 */

const SEEDS = 200;

// --------------------------------------------------------------- tiện ích

/** Đọc lựa chọn dạng SỐ. Trả về null nếu đây là lựa chọn bằng chữ. */
function tryDisplayToValue(display: string): MathValue | null {
  const int = display.match(/^(-?\d+)$/);
  if (int) return rat(Number(int[1]));

  const frac = display.match(/^(-?)frac\((\d+),(\d+)\)$/);
  if (frac) return rat((frac[1] === '-' ? -1 : 1) * Number(frac[2]), Number(frac[3]));

  return null;
}

function displayToValue(display: string): MathValue {
  const value = tryDisplayToValue(display);
  assert.ok(value, `Lựa chọn "${display}" không ở dạng số nguyên hay frac(a,b).`);
  return value;
}

function correctChoice(item: MathItem): string {
  assert.ok(item.choices && item.correctIndex !== null, 'Câu trắc nghiệm thiếu lựa chọn.');
  const choice = item.choices[item.correctIndex];
  assert.ok(choice, 'correctIndex trỏ ra ngoài mảng lựa chọn.');
  return choice.display;
}

function correctValue(item: MathItem): MathValue {
  return displayToValue(correctChoice(item));
}

/** Hệ số viết tắt: "" là 1, "-" là -1. */
function parseCoefficient(text: string): number {
  if (text === '' || text === '+') return 1;
  if (text === '-') return -1;
  return Number(text);
}

function requireMatch(text: string, pattern: RegExp, label: string): RegExpMatchArray {
  const m = text.match(pattern);
  assert.ok(m, `${label} không đúng khuôn đã định: ${text}`);
  return m;
}

/** Mọi markup toán hiện ra màn hình đều phải parse sạch. */
function assertMarkupClean(item: MathItem) {
  assert.deepEqual(validateMath(item.stem), [], `Markup hỏng trong đề: ${item.stem}`);
  for (const choice of item.choices ?? []) {
    assert.deepEqual(validateMath(choice.display), [], `Markup hỏng ở lựa chọn: ${choice.display}`);
  }
  for (const step of item.steps) {
    if (step.expr) {
      assert.deepEqual(validateMath(step.expr), [], `Markup hỏng ở bước giải: ${step.expr}`);
    }
  }
}

// --------------------------- kiểm chứng riêng từng template, đọc ngược từ đề

type Verifier = (item: MathItem) => void;

const VERIFIERS: Record<string, Verifier> = {
  // ------------------------------------------------------------- Algebra

  /**
   * Đọc lại `If a(x + b) = cx + d` từ đề, rồi THẾ đáp án vào cả hai vế.
   * Hai vế bằng nhau là đáp án đúng, không cần biết template đã nghĩ gì.
   */
  'alg-linear-one-var-distribute': (item) => {
    const m = requireMatch(
      item.stem,
      /^If (\d+)\(x ([+-]) (\d+)\) = (\d+)x(?: ([+-]) (\d+))?, what is the value of x\?$/,
      'Đề',
    );

    const a = Number(m[1]);
    const b = (m[2] === '-' ? -1 : 1) * Number(m[3]);
    const c = Number(m[4]);
    const d = m[5] ? (m[5] === '-' ? -1 : 1) * Number(m[6]) : 0;

    const answer = correctValue(item);
    assert.equal(answer.den, 1, 'Nghiệm phải là số nguyên ở dạng này.');
    const x = answer.num;

    assert.equal(a * (x + b), c * x + d, `Thế x = ${x} vào "${item.stem}" thì hai vế không bằng nhau.`);
    assert.notEqual(a, c, 'a = c thì hệ số x triệt tiêu, phương trình hết ẩn.');
    assert.notEqual(b, 0, 'b = 0 thì không còn gì để nhân phân phối.');
    assert.notEqual(x, 0, 'Nghiệm 0 làm nhiễu "đổi dấu" trùng luôn đáp án đúng.');
  },

  /** Giao điểm trục tung: thế x = 0 thì `by` phải bằng `c`. */
  'alg-linear-two-var-intercept': (item) => {
    const m = requireMatch(
      item.stem,
      /^The graph of (\d+)x \+ (\d+)y = (-?\d+) in the xy-plane crosses the y-axis at the point \(0, k\)\./,
      'Đề',
    );

    const a = Number(m[1]);
    const b = Number(m[2]);
    const c = Number(m[3]);
    const k = correctValue(item);

    assert.equal(k.den, 1, 'Tung độ giao điểm phải nguyên.');
    assert.equal(b * k.num, c, `Thế x = 0 thì ${b}·${k.num} phải bằng ${c}.`);
    assert.notEqual(a, b, 'a = b thì hai giao điểm trùng nhau, nhiễu mất nghĩa.');
  },

  /**
   * Dựng lại hàm số TỪ CHÍNH BẢNG người học nhìn thấy, rồi so với đáp án.
   * Bảng lệch với đáp án là hỏng, dù template tính đúng ở bên trong.
   */
  'alg-linear-function-table': (item) => {
    const m = requireMatch(item.stem, /What is the value of f\((\d+)\)\?$/, 'Đề');
    const at = Number(m[1]);

    assert.ok(item.figure && item.figure.kind === 'data_table', 'Câu này phải có bảng giá trị.');
    const rows = item.figure.rows.map((r) => ({ x: Number(r.label), y: Number(r.cells[0]) }));
    assert.equal(rows.length, 3, 'Bảng phải có đúng ba dòng.');

    const [p0, p1, p2] = rows as [{ x: number; y: number }, { x: number; y: number }, { x: number; y: number }];
    const slope = (p1.y - p0.y) / (p1.x - p0.x);
    assert.ok(Number.isInteger(slope), 'Hệ số góc phải nguyên.');
    assert.equal(
      (p2.y - p1.y) / (p2.x - p1.x),
      slope,
      'Ba điểm trong bảng không thẳng hàng — đây không còn là hàm bậc nhất.',
    );

    const intercept = p0.y - slope * p0.x;
    assert.equal(correctValue(item).num, slope * at + intercept, 'f(x) tính từ bảng không khớp đáp án.');
    assert.ok(!rows.some((r) => r.x === at), 'Giá trị được hỏi không được nằm sẵn trong bảng.');
  },

  /** Giải lại hệ bằng Cramer từ hai phương trình in trong đề. */
  'alg-system-two-var-sum': (item) => {
    const equations = [
      ...item.stem.matchAll(/(-?\d*)x ([+-]) (\d*)y = (-?\d+)/g),
    ].map((m) => ({
      a: parseCoefficient(m[1] ?? ''),
      b: (m[2] === '-' ? -1 : 1) * parseCoefficient(m[3] ?? ''),
      c: Number(m[4]),
    }));
    assert.equal(equations.length, 2, `Không đọc được hai phương trình: ${item.stem}`);

    const [first, second] = equations as [
      { a: number; b: number; c: number },
      { a: number; b: number; c: number },
    ];
    const determinant = first.a * second.b - second.a * first.b;
    assert.notEqual(determinant, 0, 'Hệ suy biến — không có nghiệm duy nhất.');

    const x = (first.c * second.b - second.c * first.b) / determinant;
    const y = (first.a * second.c - second.a * first.c) / determinant;
    assert.ok(Number.isInteger(x) && Number.isInteger(y), 'Nghiệm phải nguyên.');
    assert.equal(correctValue(item).num, x + y, 'Đáp án không bằng x + y của hệ in trong đề.');
  },

  /**
   * Kiểm bằng ĐỊNH NGHĨA: số được chọn phải thoả bất phương trình, còn số kế
   * tiếp về phía "xa hơn" thì không. Không cần biết template tính ngưỡng ra sao.
   */
  'alg-linear-inequality-bound': (item) => {
    const m = requireMatch(
      item.stem,
      /What is the (greatest|least) integer value of x that satisfies (-?\d*)x ([+-]) (\d+) < (-?\d+)\?$/,
      'Đề',
    );

    const direction = m[1];
    const a = parseCoefficient(m[2] ?? '');
    const b = (m[3] === '-' ? -1 : 1) * Number(m[4]);
    const c = Number(m[5]);

    assert.ok(item.answerValue, 'Câu grid-in phải có giá trị đáp án.');
    assert.equal(item.answerValue.den, 1, 'Đáp án phải là số nguyên.');
    const x = item.answerValue.num;

    assert.ok(a * x + b < c, `x = ${x} không thoả "${item.stem}".`);
    const nextX = direction === 'greatest' ? x + 1 : x - 1;
    assert.ok(
      !(a * nextX + b < c),
      `x = ${nextX} cũng thoả, nên ${x} không phải giá trị ${direction}.`,
    );
    assert.equal(direction, a > 0 ? 'greatest' : 'least', 'Chiều câu hỏi không khớp dấu hệ số.');
  },

  // ------------------------------------------------------- Advanced Math

  /**
   * So bằng GIÁ TRỊ SỐ tại nhiều điểm x, không so chuỗi: hai biểu thức tương
   * đương thì cho cùng giá trị ở mọi x, và đó đúng là định nghĩa của "tương
   * đương" mà câu hỏi đang kiểm tra.
   */
  'adv-expand-binomial-square': (item) => {
    const m = requireMatch(
      item.stem,
      /equivalent to \((\d+)x ([+-]) (\d+)\)\^2\?$/,
      'Đề',
    );
    const p = Number(m[1]);
    const q = (m[2] === '-' ? -1 : 1) * Number(m[3]);

    const expanded = requireMatch(
      correctChoice(item),
      /^(\d+)x\^2 ([+-]) (\d+)x ([+-]) (\d+)$/,
      'Đáp án',
    );
    const a = Number(expanded[1]);
    const b = (expanded[2] === '-' ? -1 : 1) * Number(expanded[3]);
    const c = (expanded[4] === '-' ? -1 : 1) * Number(expanded[5]);

    for (const x of [-3, -1, 0, 2, 5]) {
      assert.equal(
        a * x * x + b * x + c,
        (p * x + q) ** 2,
        `Tại x = ${x}, "${correctChoice(item)}" không bằng (${p}x + ${q})².`,
      );
    }
  },

  /** Thế nghiệm vào phương trình phải ra 0, và nghiệm phải dương. */
  'adv-quadratic-positive-root': (item) => {
    // Hệ số của x có thể vắng mặt (khi hai nghiệm đối nhau) hoặc viết tắt là
    // "x" / "-x" — khuôn phải nhận được cả ba dạng.
    const m = requireMatch(
      item.stem,
      /^The equation x\^2(?: ([+-]) (\d*)x)? ([+-]) (\d+) = 0 has two solutions\./,
      'Đề',
    );
    const b = m[1] ? (m[1] === '-' ? -1 : 1) * parseCoefficient(m[2] ?? '') : 0;
    const c = (m[3] === '-' ? -1 : 1) * Number(m[4]);

    assert.ok(item.answerValue, 'Câu grid-in phải có giá trị đáp án.');
    const x = item.answerValue.num;
    assert.equal(item.answerValue.den, 1, 'Nghiệm phải nguyên.');
    assert.ok(x > 0, `Đề hỏi nghiệm dương nhưng đáp án là ${x}.`);
    assert.equal(x * x + b * x + c, 0, `Thế x = ${x} vào phương trình không ra 0.`);

    // Phải có đúng một nghiệm dương, nếu không câu hỏi nhập nhằng.
    const otherRoot = -b - x;
    assert.ok(otherRoot < 0, `Nghiệm còn lại (${otherRoot}) cũng dương — câu hỏi có hai đáp án.`);
  },

  /** Đỉnh parabol là trục đối xứng: f(v - 1) phải bằng f(v + 1). */
  'adv-parabola-vertex-from-roots': (item) => {
    const m = requireMatch(
      item.stem,
      /f\(x\) = (-?\d*)\(x ([+-]) (\d+)\)\(x ([+-]) (\d+)\)\./,
      'Đề',
    );
    const lead = parseCoefficient(m[1] ?? '');
    const first = -(m[2] === '-' ? -1 : 1) * Number(m[3]);
    const second = -(m[4] === '-' ? -1 : 1) * Number(m[5]);

    const vertex = toDecimal(correctValue(item));
    const f = (x: number) => lead * (x - first) * (x - second);
    // So bằng `===` chứ không phải `assert.equal`: khi hai nghiệm cách nhau
    // đúng 2 thì cả hai vế cùng bằng 0, nhưng một vế ra -0 và `assert.equal`
    // coi 0 khác -0. Ở đây -0 và 0 là cùng một số.
    for (const offset of [1, 3]) {
      assert.ok(
        f(vertex - offset) === f(vertex + offset),
        `x = ${vertex} không phải trục đối xứng: f(${vertex - offset}) = ${f(vertex - offset)} ` +
          `nhưng f(${vertex + offset}) = ${f(vertex + offset)}.`,
      );
    }
    assert.notEqual(first, second, 'Hai nghiệm trùng nhau thì không còn là câu hỏi về trung điểm.');
  },

  // ------------------------------------ Problem-Solving and Data Analysis

  /**
   * Đọc lại tỉ lệ giảm và giá sau giảm từ đề, rồi kiểm giá gốc bằng phép nhân
   * xuôi — nhân lại ra đúng giá đã in trong đề thì đáp án đúng.
   */
  'psda-percent-discount-original': (item) => {
    const m = requireMatch(
      item.stem,
      /at a discount of (\d+)% off the original price\. The sale price is \$(\d+)\./,
      'Đề',
    );
    const percentOff = Number(m[1]);
    const sale = Number(m[2]);

    assert.ok(item.answerValue, 'Câu grid-in phải có giá trị đáp án.');
    assert.equal(item.answerValue.den, 1, 'Giá gốc phải là số nguyên.');
    const original = item.answerValue.num;

    assert.equal(
      (original * (100 - percentOff)) / 100,
      sale,
      `Giá gốc ${original} giảm ${percentOff}% không ra ${sale}.`,
    );
    assert.ok(original > sale, 'Giá gốc phải lớn hơn giá sau giảm.');
  },

  'psda-rate-unit-conversion': (item) => {
    const m = requireMatch(item.stem, /(\d+) \w+ per minute\..*in (\d+) hours\?$/, 'Đề');
    const perMinute = Number(m[1]);
    const hours = Number(m[2]);

    assert.ok(item.answerValue, 'Câu grid-in phải có giá trị đáp án.');
    assert.equal(item.answerValue.den, 1, 'Đáp án phải nguyên.');
    assert.equal(
      item.answerValue.num,
      perMinute * 60 * hours,
      'Đáp án không khớp phép đổi giờ sang phút.',
    );
  },

  /**
   * Bung bảng tần số thành dãy số thật rồi lấy phần tử giữa. Đây là định nghĩa
   * của trung vị, nên nó kiểm được cả cách template cộng dồn tần số.
   */
  'psda-median-frequency-table': (item) => {
    assert.ok(item.figure && item.figure.kind === 'data_table', 'Câu này phải có bảng tần số.');
    const table = item.figure;

    const expanded: number[] = [];
    for (const row of table.rows) {
      const value = Number(row.label);
      const frequency = Number(row.cells[0]);
      for (let i = 0; i < frequency; i += 1) expanded.push(value);
    }

    assert.equal(expanded.length % 2, 1, 'Tổng tần số phải lẻ để trung vị rơi vào một giá trị.');
    assert.equal(
      Number(table.totalRow?.cells[0]),
      expanded.length,
      'Hàng Total của bảng không khớp tổng các tần số.',
    );

    const stemTotal = requireMatch(item.stem, /number of \w+ that (\d+) /, 'Đề');
    assert.equal(Number(stemTotal[1]), expanded.length, 'Tổng in trong đề lệch với bảng.');

    expanded.sort((a, b) => a - b);
    const median = expanded[(expanded.length - 1) / 2];
    assert.equal(correctValue(item).num, median, 'Đáp án không phải trung vị của dãy bung ra từ bảng.');

    // Mốt phải duy nhất, nếu không thì nhiễu "lấy mốt" mơ hồ.
    const peak = Math.max(...table.rows.map((r) => Number(r.cells[0])));
    assert.equal(
      table.rows.filter((r) => Number(r.cells[0]) === peak).length,
      1,
      'Bảng có hai giá trị cùng tần số lớn nhất — mốt không duy nhất.',
    );
  },

  'psda-scatterplot-prediction': (item) => {
    const m = requireMatch(
      item.stem,
      /line of best fit is given by y = (\d+)x \+ (\d+)\..*when x = (\d+)\?$/,
      'Đề',
    );
    const slope = Number(m[1]);
    const intercept = Number(m[2]);
    const at = Number(m[3]);

    assert.equal(correctValue(item).num, slope * at + intercept, 'Đáp án không nằm trên đường đã cho.');

    assert.ok(item.figure && item.figure.kind === 'scatterplot', 'Câu này phải có scatterplot.');
    assert.deepEqual(
      item.figure.line,
      { slope, intercept },
      'Đường vẽ trên biểu đồ lệch với phương trình in trong đề.',
    );
    for (const point of item.figure.points) {
      assert.ok(
        Math.abs(point.y - (slope * point.x + intercept)) <= 3,
        `Điểm (${point.x}, ${point.y}) nằm quá xa đường, biểu đồ trông không còn là xu hướng ấy.`,
      );
      assert.ok(
        point.x >= item.figure.xRange[0] && point.x <= item.figure.xRange[1],
        'Có điểm nằm ngoài khung vẽ.',
      );
      assert.ok(
        point.y >= item.figure.yRange[0] && point.y <= item.figure.yRange[1],
        'Có điểm nằm ngoài khung vẽ.',
      );
    }
  },

  /**
   * Đọc bảng hai chiều, tìm đúng HÀNG mà đề nhắc tên, rồi lập tỉ số. Kiểm cả
   * tính nhất quán của hàng Total và cột Total — bảng tự mâu thuẫn thì câu hỏi
   * không có đáp án đúng nào cả.
   */
  'psda-two-way-table-conditional': (item) => {
    assert.ok(item.figure && item.figure.kind === 'data_table', 'Câu này phải có bảng hai chiều.');
    const table = item.figure;

    for (const row of table.rows) {
      const cells = row.cells.map(Number);
      const total = cells[cells.length - 1];
      assert.equal(
        cells.slice(0, -1).reduce((s, n) => s + n, 0),
        total,
        `Hàng "${row.label}" có cột Total không khớp tổng các ô.`,
      );
    }

    const rowMatch = requireMatch(item.stem, /If one of the \w+ in ([^)]+?) is selected at random/, 'Đề');
    const rowName = rowMatch[1]!.trim();
    const row = table.rows.find((r) => r.label.toLowerCase() === rowName.toLowerCase());
    assert.ok(row, `Đề nhắc hàng "${rowName}" nhưng bảng không có hàng ấy.`);

    const colMatch = requireMatch(item.stem, /\w+ (chose \w+|prefers [\w-]+)\?$/, 'Đề');
    const colName = colMatch[1]!.trim();
    const colIndex = table.columns.findIndex((c) => c.toLowerCase() === colName.toLowerCase());
    assert.ok(colIndex > 0, `Đề nhắc cột "${colName}" nhưng bảng không có cột ấy.`);

    const cell = Number(row.cells[colIndex - 1]);
    const rowTotal = Number(row.cells[row.cells.length - 1]);
    assert.ok(
      equalsValue(correctValue(item), rat(cell, rowTotal)),
      `Xác suất phải là ${cell}/${rowTotal}.`,
    );
  },

  /**
   * Kết luận đúng phải chứa ĐÚNG hai đầu khoảng tính từ hai số in trong đề, và
   * phải nói về trung bình của đúng tổng thể đã lấy mẫu.
   */
  'psda-margin-of-error-conclusion': (item) => {
    const m = requireMatch(
      item.stem,
      /random sample of (\d+) residents of (\w+)\..*is (\d+\.\d) hours, with an associated margin of error of (\d\.\d) hours\./,
      'Đề',
    );
    const city = m[2]!;
    const mean = Math.round(Number(m[3]) * 10);
    const margin = Math.round(Number(m[4]) * 10);

    const low = ((mean - margin) / 10).toFixed(1);
    const high = ((mean + margin) / 10).toFixed(1);

    const answer = correctChoice(item);
    assert.ok(answer.includes(`between ${low} and ${high}`), `Đáp án thiếu khoảng ${low}–${high}: ${answer}`);
    assert.ok(answer.includes('plausible'), 'Kết luận phải nói "plausible", không nói chắc chắn.');
    assert.ok(answer.includes('mean'), 'Kết luận phải nói về TRUNG BÌNH.');
    assert.ok(answer.includes(city), `Kết luận phải giới hạn trong ${city}.`);

    // Đúng một lựa chọn nói về khoảng của trung bình đúng thành phố ấy.
    const plausible = (item.choices ?? []).filter(
      (c) => c.display.includes('plausible') && c.display.includes('mean') && c.display.includes(city),
    );
    assert.equal(plausible.length, 1, 'Có hơn một lựa chọn cùng đúng.');
  },

  /**
   * Kết luận đúng do THIẾT KẾ NGHIÊN CỨU quyết định — đây chính là nội dung của
   * kỹ năng này, nên test phải kiểm đúng cái ràng buộc ấy.
   */
  'psda-study-design-conclusion': (item) => {
    const randomized = item.stem.includes('randomly assigned');
    const observational = item.stem.includes('surveyed');
    assert.ok(randomized !== observational, `Đề không nói rõ thiết kế: ${item.stem}`);

    const answer = correctChoice(item);
    if (randomized) {
      assert.ok(answer.includes('caused'), `Thí nghiệm ngẫu nhiên thì kết luận nhân quả hợp lệ: ${answer}`);
      assert.ok(answer.includes('in the study'), 'Kết luận phải giới hạn trong nhóm nghiên cứu.');
    } else {
      assert.ok(
        answer.includes('association') && answer.includes('does not show'),
        `Nghiên cứu quan sát chỉ kết luận được là có liên hệ: ${answer}`,
      );
    }

    // Lựa chọn nhân quả phải LUÔN có mặt, ở cả hai thiết kế — nếu chỉ xuất hiện
    // khi nó đúng thì người học nhận ra nó mà không cần đọc đề.
    assert.ok(
      (item.choices ?? []).some((c) => c.display.includes('caused')),
      'Thiếu lựa chọn nhân quả, câu hỏi mất chỗ để bẫy.',
    );
  },

  // ------------------------------------------- Geometry and Trigonometry

  /**
   * Đọc lại hai cạnh góc vuông từ đề, tự tính cạnh huyền, rồi so tỉ số.
   * Cạnh huyền phải ra số nguyên — nếu không thì đáp án không còn hữu tỉ.
   */
  'geo-right-triangle-trig-ratio': (item) => {
    const m = requireMatch(
      item.stem,
      /AB = (\d+) cm, and BC = (\d+) cm\. What is the value of (sin|cos)\((A|C)\)\?$/,
      'Đề',
    );

    const ab = Number(m[1]);
    const bc = Number(m[2]);
    const ratio = m[3];
    const angle = m[4];
    const hypotenuse = Math.sqrt(ab * ab + bc * bc);
    assert.ok(Number.isInteger(hypotenuse), `Cạnh huyền của (${ab}, ${bc}) không phải số nguyên.`);

    // Góc vuông ở B, nên với góc C cạnh đối là AB và cạnh kề là BC; góc A ngược lại.
    const opposite = angle === 'C' ? ab : bc;
    const adjacent = angle === 'C' ? bc : ab;
    const expected = ratio === 'sin' ? rat(opposite, hypotenuse) : rat(adjacent, hypotenuse);

    assert.ok(
      equalsValue(correctValue(item), expected),
      `${ratio}(${angle}) trong tam giác (${ab}, ${bc}, ${hypotenuse}) phải là ${expected.num}/${expected.den}.`,
    );

    assert.ok(item.figure && item.figure.kind === 'right_triangle', 'Câu này phải có hình.');
    assert.deepEqual(item.figure.legs, [ab, bc], 'Số trên hình lệch với số trong đề.');
    assert.equal(item.figure.hypotenuse, hypotenuse, 'Cạnh huyền trên hình sai.');
    assert.equal(
      item.figure.unknown,
      'hypotenuse',
      'Cạnh huyền phải để trống trên hình, không thì đề tự lộ đáp án.',
    );
  },

  /** Hai chiều hỏi, cả hai đều quy về cạnh rồi kiểm bằng hai công thức gốc. */
  'geo-cube-volume-from-surface': (item) => {
    assert.ok(item.answerValue, 'Câu grid-in phải có giá trị đáp án.');
    assert.equal(item.answerValue.den, 1, 'Đáp án phải nguyên.');

    const fromSurface = item.stem.includes('surface area of a cube is');
    if (fromSurface) {
      const m = requireMatch(item.stem, /surface area of a cube is (\d+) square (\w+)/, 'Đề');
      const surface = Number(m[1]);
      const side = Math.sqrt(surface / 6);
      assert.ok(Number.isInteger(side), `Diện tích ${surface} không ứng với cạnh nguyên.`);
      assert.equal(item.answerValue.num, side ** 3, 'Thể tích không khớp cạnh suy từ diện tích.');
      assert.ok(item.stem.includes(`in cubic ${m[2]}`), 'Đơn vị hỏi ra không khớp đơn vị đề cho.');
    } else {
      const m = requireMatch(item.stem, /volume of a cube is (\d+) cubic (\w+)/, 'Đề');
      const volume = Number(m[1]);
      const side = Math.round(Math.cbrt(volume));
      assert.equal(side ** 3, volume, `Thể tích ${volume} không ứng với cạnh nguyên.`);
      assert.equal(item.answerValue.num, 6 * side * side, 'Diện tích không khớp cạnh suy từ thể tích.');
      assert.ok(item.stem.includes(`in square ${m[2]}`), 'Đơn vị hỏi ra không khớp đơn vị đề cho.');
    }
  },

  /**
   * Quan hệ hai góc suy lại từ VỊ TRÍ ghi trong hình: cùng vị trí hoặc đối đỉnh
   * thì bằng nhau, còn lại thì bù nhau.
   */
  'geo-parallel-lines-angle': (item) => {
    const m = requireMatch(item.stem, /measure of ∠1 is (\d+)°/, 'Đề');
    const degrees = Number(m[1]);

    assert.ok(item.figure && item.figure.kind === 'parallel_lines', 'Câu này phải có hình.');
    const { known, asked } = item.figure;
    assert.equal(known.degrees, degrees, 'Số độ trên hình lệch với số trong đề.');

    const opposite: Record<string, string> = {
      upper_left: 'lower_right',
      upper_right: 'lower_left',
      lower_left: 'upper_right',
      lower_right: 'upper_left',
    };
    const equal = asked.corner === known.corner || asked.corner === opposite[known.corner];
    const expected = equal ? degrees : 180 - degrees;

    assert.equal(correctValue(item).num, expected, 'Đáp án không khớp quan hệ vị trí của hai góc.');
    assert.ok(
      !(asked.line === known.line && asked.corner === known.corner),
      'Góc được hỏi trùng đúng góc đã cho — câu hỏi vô nghĩa.',
    );
    assert.ok(degrees > 0 && degrees < 90, 'Góc đã cho phải nhọn để nhiễu 90° − x còn dương.');
  },

  /** Vuông hoá ngược từ ba hệ số in trong đề: r² = F + (D/2)² + (E/2)². */
  'geo-circle-equation-radius': (item) => {
    const m = requireMatch(
      item.stem,
      /x\^2 \+ y\^2 ([+-]) (\d+)x ([+-]) (\d+)y = (-?\d+)\./,
      'Đề',
    );
    const d = (m[1] === '-' ? -1 : 1) * Number(m[2]);
    const e = (m[3] === '-' ? -1 : 1) * Number(m[4]);
    const f = Number(m[5]);

    const radiusSquared = f + (d / 2) ** 2 + (e / 2) ** 2;
    const radius = Math.sqrt(radiusSquared);
    assert.ok(Number.isInteger(radius), `r² = ${radiusSquared} không phải số chính phương.`);

    assert.equal(correctValue(item).num, radius, 'Đáp án không khớp bán kính vuông hoá được.');
    assert.ok(radius >= 3, 'r = 2 làm nhiễu 2r trùng nhiễu r².');
  },
  'alg-linear-word-rental-fee': (item) => {
  const m = requireMatch(item.stem, /^A moving company charges a flat fee of \$(\d+) plus \$(\d+) per day to rent a truck\. If the total cost to rent the truck for x days was \$(\d+), what is the value of x\?$/, 'stem');
  const f = Number(m[1]);
  const r = Number(m[2]);
  const total = Number(m[3]);

  // Tự tính lại nghiệm từ chính các số đọc được trên đề, không dùng biến nội bộ của build().
  assert.ok(Number.isInteger((total - f) / r), 'Tổng chi phí trừ phí cố định phải chia hết cho đơn giá mỗi ngày.');
  const expected = rat(total - f, r);

  const got = correctValue(item);
  assert.ok(equalsValue(got, expected), `Đáp án đúng phải là x = ${formatValue(expected)}, nhưng lựa chọn đúng là ${formatValue(got)}.`);

  // Thế ngược lại vào phương trình gốc để chắc chắn khớp.
  assert.equal(f + r * toDecimal(got), total, 'Thế x vào phương trình gốc (phí cố định + đơn giá × x) không khớp tổng chi phí.');
},

  'alg-linear-two-var-rate-fee-context': (item) => {
  const m = item.stem.match(/^A rideshare service charges \$(\d+) per mile driven plus a flat booking fee of \$(\d+)\. The total cost y, in dollars, for a ride of x miles is given by y = (\d+)x \+ (\d+)\. What is the total cost, in dollars, for a ride of (\d+) miles\?$/);
  if (!m) throw new Error('Đề không khớp khuôn: ' + item.stem);
  const R = Number(m[1]);
  const F = Number(m[2]);
  const Requation = Number(m[3]);
  const Fequation = Number(m[4]);
  const n = Number(m[5]);

  assert.equal(Requation, R, 'Hệ số x trong phương trình không khớp đơn giá mỗi dặm đã nêu.');
  assert.equal(Fequation, F, 'Hằng số trong phương trình không khớp phí cố định đã nêu.');

  const expected = rat(F + R * n);
  const got = correctValue(item);
  assert.ok(equalsValue(got, expected), `Đáp án đúng phải là ${formatValue(expected)} nhưng lựa chọn đúng là ${formatValue(got)}.`);
},

  'alg-linear-fn-draining-tank': (item) => {
  const m = requireMatch(
    item.stem,
    /^A water tank is being drained at a constant rate\. After (\d+) minutes, the tank holds (\d+) gallons of water\. After (\d+) minutes, the tank holds (\d+) gallons of water\. Assuming the volume of water in the tank is a linear function of time, how many gallons of water are in the tank after (\d+) minutes\?$/,
    'stem',
  );
  const t1 = Number(m[1]);
  const V1 = Number(m[2]);
  const t2 = Number(m[3]);
  const V2 = Number(m[4]);
  const t3 = Number(m[5]);

  assert.ok(t2 > t1, 'Mốc thời gian thứ hai phải lớn hơn mốc thứ nhất.');
  assert.ok(t3 > t2, 'Mốc thời gian thứ ba phải lớn hơn mốc thứ hai.');

  const numerator = V1 - V2;
  const denom = t2 - t1;
  assert.ok(numerator % denom === 0, 'Tốc độ xả nước suy từ hai mốc đã cho không phải số nguyên.');
  const r = numerator / denom;
  assert.ok(r > 0, 'Tốc độ xả nước phải dương (bể phải cạn dần theo thời gian).');

  const expected = V2 - r * (t3 - t2);
  assert.ok(Number.isInteger(expected) && expected >= 0, 'Thể tích kỳ vọng tại mốc thứ ba phải là số nguyên không âm.');

  const actual = correctValue(item);
  assert.ok(
    equalsValue(actual, rat(expected)),
    `Kỳ vọng thể tích ${expected} gallons tại mốc thứ ba, nhưng lựa chọn đúng lại là ${actual.num}/${actual.den}.`,
  );
},

  'alg-systems-ticket-prices': (item) => {
  const m = requireMatch(
    item.stem,
    /^A community theater sold (\d+) adult tickets and (\d+) student tickets on Friday for a total of \$(\d+)\. On Saturday, it sold (\d+) adult tickets and (\d+) student tickets for a total of \$(\d+)\. Every adult ticket has the same price, and every student ticket has the same price\. What is the price, in dollars, of one adult ticket\?$/,
    'stem của alg-systems-ticket-prices',
  );

  const a = Number(m[1]);
  const b = Number(m[2]);
  const T1 = Number(m[3]);
  const c = Number(m[4]);
  const d = Number(m[5]);
  const T2 = Number(m[6]);

  const det = a * d - b * c;
  assert.ok(det !== 0, 'Định thức hệ phương trình bằng 0 (hệ vô nghiệm hoặc vô số nghiệm): ' + item.stem);

  // Giải lại hệ HOÀN TOÀN từ các số đọc được trong đề (không dùng biến nội bộ của build()).
  const x = rat(d * T1 - b * T2, det);
  const y = rat(a * T2 - c * T1, det);

  // Kiểm tra nghiệm (x, y) thật sự thoả cả hai phương trình gốc (bằng số thập phân, đủ chặt vì
  // các số liệu đều nhỏ và nguyên).
  const xDec = toDecimal(x);
  const yDec = toDecimal(y);
  assert.ok(
    Math.abs(a * xDec + b * yDec - T1) < 1e-9,
    'Nghiệm tính lại không thoả phương trình ngày Sáu: ' + item.stem,
  );
  assert.ok(
    Math.abs(c * xDec + d * yDec - T2) < 1e-9,
    'Nghiệm tính lại không thoả phương trình ngày Bảy: ' + item.stem,
  );

  assert.ok(
    equalsValue(x, correctValue(item)),
    `Giá vé người lớn giải lại từ đề (x = ${xDec}) không khớp đáp án đúng đã chọn trong item.`,
  );
},

  'alg-budget-max-items-inequality': (item) => {
  const m = requireMatch(
    item.stem,
    /^A customer plans to buy identical items at a store\. Each item costs \$(\d+), and the store charges a one-time delivery fee of \$(\d+)\. If the customer has \$(\d+) to spend in total, what is the maximum number of items the customer can buy without exceeding this budget\?$/,
    'stem',
  );
  const p = Number(m[1]);
  const f = Number(m[2]);
  const C = Number(m[3]);
  assert.ok(p > 0, 'Giá mỗi món phải dương.');

  const expected = Math.floor((C - f) / p);
  const x = correctValue(item);
  assert.equal(x.den, 1, 'Số món tối đa phải là số nguyên.');
  assert.equal(x.num, expected, `Đáp án đúng phải là ${expected} nhưng item ghi ${x.num}.`);

  // Kiểm tra trực tiếp bằng chính bất phương trình ngân sách, không chỉ tin vào công thức floor.
  assert.ok(p * expected + f <= C, 'Số món ở đáp án đúng đã vượt ngân sách.');
  assert.ok(p * (expected + 1) + f > C, 'Đáp án chưa phải số món tối đa — mua thêm 1 món vẫn còn trong ngân sách.');
},

  'adv-foil-binomial-product': (item) => {
  const stemMatch = item.stem.match(
    /^Which of the following is equivalent to \((\d+)x ([+-]) (\d+)\)\((\d+)x ([+-]) (\d+)\)\?$/,
  );
  if (!stemMatch) throw new Error('Đề không khớp khuôn: ' + item.stem);

  const p = Number(stemMatch[1]);
  const q = (stemMatch[2] === '-' ? -1 : 1) * Number(stemMatch[3]);
  const r = Number(stemMatch[4]);
  const s = (stemMatch[5] === '-' ? -1 : 1) * Number(stemMatch[6]);

  // Hệ số 1 hiện dưới dạng "x" chứ không phải "1x" (coefTerm/signedCoefTerm) —
  // phần chữ số của số hạng bậc nhất PHẢI là \d* (có thể rỗng), không phải \d+.
  const quadraticPattern = /^(-?\d+)x\^2(?: ([+-]) (\d*)x)?(?: ([+-]) (\d+))?$/;

  type ParsedQuadratic = { a2: number; b2: number; c2: number };
  const parseQuadratic = (text: string): ParsedQuadratic | null => {
    const m = text.match(quadraticPattern);
    if (!m) return null;
    const a2 = Number(m[1]);
    const b2Magnitude = m[3] ? Number(m[3]) : 1;
    const b2 = m[2] ? (m[2] === '-' ? -1 : 1) * b2Magnitude : 0;
    const c2 = m[4] ? (m[4] === '-' ? -1 : 1) * Number(m[5]) : 0;
    return { a2, b2, c2 };
  };

  const samplePoints = [-2, -1, 0, 1, 2, 3];

  const matchesProduct = (parsed: ParsedQuadratic | null): boolean => {
    if (!parsed) return false;
    return samplePoints.every((x) => {
      const lhs = (p * x + q) * (r * x + s);
      const rhs = parsed.a2 * x * x + parsed.b2 * x + parsed.c2;
      return lhs === rhs;
    });
  };

  const correctText = correctChoice(item);
  const parsedCorrect = parseQuadratic(correctText);
  if (!parsedCorrect) {
    throw new Error('Lựa chọn đúng không đúng khuôn đa thức bậc hai: ' + correctText);
  }
  for (const x of samplePoints) {
    // "+ 0" chuẩn hoá -0 thành 0 (IEEE754: -0 + 0 = 0) — hai giá trị bằng nhau
    // về mặt toán học nhưng assert.equal (Object.is) phân biệt -0 với 0.
    const productValue: number = (p * x + q) * (r * x + s) + 0;
    const correctValueAtX: number = parsedCorrect.a2 * x * x + parsedCorrect.b2 * x + parsedCorrect.c2 + 0;
    assert.equal(
      productValue,
      correctValueAtX,
      `Tại x=${x}: (${p}x${q >= 0 ? ' + ' + q : ' - ' + -q})(${r}x${s >= 0 ? ' + ' + s : ' - ' + -s}) = ${productValue} nhưng lựa chọn đúng cho ${correctValueAtX}`,
    );
  }

  (item.choices ?? []).forEach((choice, i) => {
    if (i === item.correctIndex) return;
    const parsedOther = parseQuadratic(choice.display);
    if (!parsedOther) return; // dạng khác hẳn, không thể trùng với đáp án đúng
    if (matchesProduct(parsedOther)) {
      throw new Error('Một lựa chọn sai lại tương đương với biểu thức đúng: ' + choice.display);
    }
  });
},

  'adv-system-linear-quadratic-sum': (item) => {
  const m = item.stem.match(
    /^y = x( [+-] \d+)\ny = x\^2( [+-] \d*x)?( [+-] \d+)?\n\nIn the system of equations above, \(x_1, y_1\) and \(x_2, y_2\) are the two distinct solutions\. What is the value of y_1 \+ y_2\?$/,
  );
  if (!m) throw new Error('Đề không khớp khuôn hệ phương trình: ' + item.stem);

  const parseSigned = (s: string | undefined): number => {
    if (!s) return 0;
    const mm = s.trim().match(/^([+-])\s*(\d+)$/);
    if (!mm) throw new Error('Không đọc được số có dấu: "' + s + '"');
    return (mm[1] === '-' ? -1 : 1) * Number(mm[2]);
  };
  // Hệ số 1 hiện dưới dạng "x" chứ không phải "1x" (xem coefTerm/signedCoefTerm
  // trong authoring.ts) — phần chữ số có thể rỗng, khi đó hệ số là 1.
  const parseSignedX = (s: string | undefined): number => {
    if (!s) return 0;
    const mm = s.trim().match(/^([+-])\s*(\d*)x$/);
    if (!mm) throw new Error('Không đọc được hệ số x: "' + s + '"');
    const magnitude = mm[2] ? Number(mm[2]) : 1;
    return (mm[1] === '-' ? -1 : 1) * magnitude;
  };

  const k = parseSigned(m[1]);
  const b = parseSignedX(m[2]);
  const c = parseSigned(m[3]);

  // Thế y = x + k vào y = x^2 + bx + c  =>  x^2 + (b-1)x + (c-k) = 0
  const B = b - 1;
  const C = c - k;
  const disc = B * B - 4 * C;
  if (disc < 0) {
    throw new Error('Phương trình bậc hai suy ra từ đề vô nghiệm thực: discriminant = ' + disc);
  }
  const sqrtDisc = Math.sqrt(disc);
  if (!Number.isInteger(sqrtDisc)) {
    throw new Error('Nghiệm không đẹp: sqrt(discriminant) = ' + sqrtDisc);
  }

  const rootA = (-B - sqrtDisc) / 2;
  const rootB = (-B + sqrtDisc) / 2;
  if (!Number.isInteger(rootA) || !Number.isInteger(rootB)) {
    throw new Error('Nghiệm x tính ra không phải số nguyên: ' + rootA + ', ' + rootB);
  }
  if (rootA === rootB) {
    throw new Error('Hai nghiệm trùng nhau, đề yêu cầu hai nghiệm phân biệt.');
  }

  // Kiểm tra thế lại cả hai phương trình gốc cho từng nghiệm x
  for (const x of [rootA, rootB]) {
    const yFromLine = x + k;
    const yFromQuad = x * x + b * x + c;
    if (yFromLine !== yFromQuad) {
      throw new Error(`Nghiệm x = ${x} không thoả mãn đồng thời cả hai phương trình.`);
    }
  }

  const y1 = rootA + k;
  const y2 = rootB + k;
  const expectedSum = rat(y1 + y2);
  const got = correctValue(item);
  assert.ok(
    equalsValue(got, expectedSum),
    `Tổng y1+y2 tính lại từ đề là ${expectedSum.num}/${expectedSum.den} nhưng đáp án đúng ghi ${got.num}/${got.den}`,
  );
},

  'adv-exponential-growth-value': (item) => {
  const m = item.stem.match(/^A quantity's value is modeled by the function f\(t\) = (\d+) \* (?:(\d+)|frac\((\d+),(\d+)\))\^t, where t is the number of (\w+)s elapsed since t = 0\. This models a situation in which [^.]+\. What is f\((\d+)\)\?$/);
  if (!m) throw new Error('Đề không khớp khuôn: ' + item.stem);

  const P0 = Number(m[1]);
  let bNum, bDen;
  if (m[2] !== undefined) {
    bNum = Number(m[2]);
    bDen = 1;
  } else {
    bNum = Number(m[3]);
    bDen = Number(m[4]);
  }
  const t = Number(m[6]);

  // Tự tính lại f(t) = P0 * (bNum/bDen)^t từ đúng các số đọc được trên đề, không dùng biến nội bộ của build().
  const num = P0 * Math.pow(bNum, t);
  const den = Math.pow(bDen, t);
  const expected = rat(num, den);

  const actual = correctValue(item);
  assert.ok(
    equalsValue(actual, expected),
    `Đáp án đúng phải là ${expected.num}/${expected.den} nhưng lựa chọn đúng của item lại là ${actual.num}/${actual.den} (P0=${P0}, b=${bNum}/${bDen}, t=${t}).`,
  );
},

  'psda-scale-drawing-proportion': (item) => {
  const m = requireMatch(
    item.stem,
    /^On a certain scale drawing, (\d+) inches represent (\d+) feet\. At the same scale, (\d+) inches represent how many feet\?$/,
    'stem',
  );
  const a = Number(m[1]);
  const b = Number(m[2]);
  const d = Number(m[3]);
  const expected = rat(b * d, a);
  const actual = correctValue(item);
  assert.ok(
    equalsValue(expected, actual),
    `Kỳ vọng x = ${b}*${d}/${a} = ${expected.num}/${expected.den}, nhưng đáp án đúng trong item lại là ${actual.num}/${actual.den}`,
  );
},

  'psda-two-step-percent-change': (item) => {
  const m = requireMatch(
    item.stem,
    /^A quantity is first (increased|decreased) by (\d+)% and then (increased|decreased) by (\d+)%\. The resulting quantity is what percent of the original quantity\?$/,
    'stem',
  );
  const dir1 = m[1];
  const a = Number(m[2]);
  const dir2 = m[3];
  const b = Number(m[4]);
  const s1 = dir1 === 'increased' ? 1 : -1;
  const s2 = dir2 === 'increased' ? 1 : -1;

  const firstFactorPercent = 100 + s1 * a;
  const secondFactorPercent = 100 + s2 * b;

  assert.equal(
    (firstFactorPercent * secondFactorPercent) % 100,
    0,
    'Tích hai hệ số phải chia hết cho 100 để phần trăm cuối cùng là số nguyên',
  );
  const expectedPercent = (firstFactorPercent * secondFactorPercent) / 100;

  const correctDisplay = correctChoice(item);
  const cm = requireMatch(correctDisplay, /^(-?\d+)%$/, 'lựa chọn đúng');
  const actualPercent = Number(cm[1]);
  assert.equal(
    actualPercent,
    expectedPercent,
    `Kỳ vọng đáp án đúng là ${expectedPercent}% nhưng lựa chọn đúng ghi ${correctDisplay}`,
  );

  // Bắt buộc: nhiễu "cộng thẳng phần trăm thay vì nhân hệ số" phải có mặt và đúng nhãn lỗi.
  const naivePercent = 100 + s1 * a + s2 * b;
  assert.notEqual(
    naivePercent,
    expectedPercent,
    'Nhiễu cộng thẳng phần trăm trùng giá trị với đáp án đúng — tham số sinh bị suy biến',
  );
  const naiveChoice = (item.choices ?? []).find((c) => c.display === `${naivePercent}%`);
  assert.ok(naiveChoice, `Không tìm thấy nhiễu cộng thẳng phần trăm (${naivePercent}%) trong các lựa chọn`);
  assert.equal(
    naiveChoice.errorTag,
    'percent_added_instead_of_multiplied',
    'Nhiễu cộng thẳng phần trăm phải gắn nhãn lỗi percent_added_instead_of_multiplied',
  );

  // Không có hai lựa chọn nào trùng giá trị hiển thị.
  const displays = (item.choices ?? []).map((c) => c.display);
  assert.equal(new Set(displays).size, displays.length, 'Có hai lựa chọn trùng nhau về giá trị hiển thị');
},

  'psda-mean-after-adding-value': (item) => {
  const m = item.stem.match(/^A group of (\d+) students has a mean quiz score of (\d+) points\. A new student joins the group and scores (\d+) points on the same quiz\. What is the mean quiz score of all (\d+) students in the group\?$/);
  if (!m) throw new Error('Đề không khớp khuôn: ' + item.stem);
  const n = Number(m[1]);
  const mean0 = Number(m[2]);
  const newStudentScore = Number(m[3]);
  const nPlus1 = Number(m[4]);
  assert.equal(nPlus1, n + 1, 'Số học sinh mới phải bằng n + 1.');
  const sum0 = n * mean0;
  const sumNew = sum0 + newStudentScore;
  const expected = rat(sumNew, nPlus1);
  const actual = correctValue(item);
  assert.ok(equalsValue(actual, expected), `Trung bình mới phải là ${formatValue(expected)}, nhưng lựa chọn đúng lại là ${formatValue(actual)}.`);
},

  'psda-best-fit-slope-from-points': (item) => {
  const m = item.stem.match(/^A line of best fit for a set of data passes near the points \((-?\d+), (-?\d+)\) and \((-?\d+), (-?\d+)\)\. Based on this line of best fit, what is the predicted value of y when x = (-?\d+)\?$/);
  if (!m) throw new Error('Đề không khớp khuôn: ' + item.stem);
  const x1 = Number(m[1]);
  const y1 = Number(m[2]);
  const x2 = Number(m[3]);
  const y2 = Number(m[4]);
  const x3 = Number(m[5]);

  const step = x2 - x1;
  assert.ok(step !== 0, 'Hai điểm dữ liệu trùng hoành độ, không thể suy hệ số góc.');

  // Suy hệ số góc từ hai điểm dữ liệu đọc được trong đề, rồi ngoại suy tới x3.
  // predicted = y2 + ((y2 - y1) / step) * (x3 - x2)
  const deltaX = x3 - x2;
  const predictedNum = y2 * step + (y2 - y1) * deltaX;
  const predicted = rat(predictedNum, step);

  const actual = correctValue(item);
  assert.ok(
    equalsValue(predicted, actual),
    `Giá trị dự đoán tính lại từ hai điểm dữ liệu là ${predicted.num}/${predicted.den} nhưng đáp án đúng ghi trong đề là ${actual.num}/${actual.den}.`,
  );
},

  'psda-independent-events-multiply': (item) => {
  const m = item.stem.match(/^The probability that (.+) is frac\((\d+),(\d+)\)\. Independently, the probability that (.+) is frac\((\d+),(\d+)\)\. What is the probability that both events occur\?$/);
  if (!m) throw new Error('Đề không khớp khuôn: ' + item.stem);

  const event1 = m[1];
  const p1 = Number(m[2]);
  const q1 = Number(m[3]);
  const event2 = m[4];
  const p2 = Number(m[5]);
  const q2 = Number(m[6]);

  if (event1 === event2) throw new Error('Hai biến cố phải khác nhau nhưng đọc được cùng một mô tả: ' + event1);
  if (q1 <= 0 || q2 <= 0) throw new Error('Mẫu số của xác suất phải dương.');
  if (!(p1 > 0 && p1 < q1) || !(p2 > 0 && p2 < q2)) {
    throw new Error('Mỗi xác suất đọc từ đề phải nằm strictly giữa 0 và 1.');
  }

  const expected = rat(p1 * p2, q1 * q2);
  const actual = correctValue(item);
  assert.ok(
    equalsValue(expected, actual),
    `Nhân hai xác suất frac(${p1},${q1}) và frac(${p2},${q2}) phải cho ${expected.num}/${expected.den}, nhưng lựa chọn đúng trong item là ${actual.num}/${actual.den}.`,
  );
},

  'psda-ci-margin-or-point-estimate': (item) => {
  const m = item.stem.match(/^Based on a random sample, researchers constructed a 95 percent confidence interval for (.+)\. The interval extends from (\d+) to (\d+)\. What is the (margin of error|point estimate) of this confidence interval\?$/);
  if (!m) throw new Error('Đề không khớp khuôn: ' + item.stem);
  const lower = Number(m[2]);
  const upper = Number(m[3]);
  const target = m[4];
  if (!(upper > lower)) throw new Error(`Đầu mút trên phải lớn hơn đầu mút dưới: ${lower} vs ${upper}`);
  const widthDoubled = upper - lower;
  const sumDoubled = lower + upper;
  const expected = target === 'margin of error' ? rat(widthDoubled / 2) : rat(sumDoubled / 2);
  assert.ok(item.answerValue, 'Câu grid-in phải có giá trị đáp án.');
  const actual = item.answerValue;
  assert.ok(
    equalsValue(expected, actual),
    `Kỳ vọng ${target} = ${JSON.stringify(expected)} (đọc từ khoảng ${lower}–${upper}) nhưng answerValue lưu là ${JSON.stringify(actual)}`,
  );
},

  'psda-sampling-bias-conclusion': (item) => {
  const m = requireMatch(
    item.stem,
    /surveyed (\d+) .+ found that (\d+) of the \1 people surveyed/,
    'stem khảo sát mẫu (surveyed N ... found that K of the N people surveyed)',
  );
  const n = Number(m[1]);
  const k = Number(m[2]);
  assert.ok(n > 0, 'Cỡ mẫu n phải dương.');
  assert.ok(k >= 0 && k < n, 'k phải nằm trong khoảng [0, n) — đề không cho phép 100%.');
  assert.ok(n % 10 === 0, 'Cỡ mẫu n phải là bội số của 10 theo cấu trúc template.');

  const percentRaw = (k * 100) / n;
  assert.ok(Number.isInteger(percentRaw), `Phần trăm k/n phải là số nguyên: k=${k}, n=${n}.`);
  const percent = percentRaw;

  assert.ok(item.choices, 'Câu trắc nghiệm thiếu lựa chọn.');
  assert.equal(item.choices.length, 4, 'Câu hỏi phải có đúng 4 lựa chọn.');
  assert.ok(item.correctIndex !== null && item.correctIndex >= 0 && item.correctIndex < 4, 'correctIndex phải trong khoảng hợp lệ.');

  const correct = correctChoice(item);
  const cm = requireMatch(
    correct,
    /Exactly (\d+)% of the (\d+) .* surveyed .* said they/,
    'câu trả lời đúng (Exactly P% of the N ... surveyed ... said they ...)',
  );
  assert.equal(Number(cm[1]), percent, 'Phần trăm nêu trong đáp án đúng không khớp k/n đọc được từ đề.');
  assert.equal(Number(cm[2]), n, 'Cỡ mẫu n nêu trong đáp án đúng không khớp với đề.');
  assert.ok(
    /cannot be generalized/i.test(correct) && /not randomly selected/i.test(correct),
    'Đáp án đúng phải nêu rõ kết quả không thể suy rộng vì mẫu không được chọn ngẫu nhiên.',
  );

  // Mỗi lựa chọn sai phải mang một trong ba kiểu ngộ nhận: khái quát hoá thẳng ra "all X",
  // ngộ nhận "cỡ mẫu lớn là đủ", hoặc ngộ nhận "khảo sát thêm cùng nhóm thiên lệch sẽ hết lệch".
  for (let i = 0; i < item.choices.length; i++) {
    if (i === item.correctIndex) continue;
    const choiceText: string = item.choices[i]!.display;
    const isOvergeneralize = /% of all /.test(choiceText);
    const isSampleSizeFallacy = /large enough sample size/i.test(choiceText);
    const isMoreOfSameFallacy = /Surveying additional/i.test(choiceText);
    assert.ok(
      isOvergeneralize || isSampleSizeFallacy || isMoreOfSameFallacy,
      `Lựa chọn sai #${i} phải chứa một lỗi suy luận về tính đại diện của mẫu đã biết: "${choiceText}"`,
    );
  }
},

  'geo-cylinder-volume-height': (item) => {
  const volMatch = item.stem.match(
    /^A right circular cylinder has a radius of (\d+) (\w+) and a height of (\d+) \2\. The volume of the cylinder can be written as k pi cubic \2, where k is a constant\. What is the value of k\?$/,
  );
  const heightMatch = item.stem.match(
    /^A right circular cylinder has a radius of (\d+) (\w+)\. The volume of the cylinder is (\d+) pi cubic \2\. What is the height of the cylinder, in \2\?$/,
  );

  assert.ok(item.answerValue, 'Câu grid-in phải có giá trị đáp án.');
  const ans = item.answerValue;

  if (volMatch) {
    const r = Number(volMatch[1]);
    const h = Number(volMatch[3]);
    const expectedK = r * r * h;
    assert.ok(
      equalsValue(ans, rat(expectedK)),
      `k phải bằng r^2*h = ${expectedK}, nhưng answerValue là ${toDecimal(ans)}`,
    );
    return;
  }

  if (heightMatch) {
    const r = Number(heightMatch[1]);
    const k = Number(heightMatch[3]);
    assert.ok(k % (r * r) === 0, `k=${k} phải chia hết cho r^2=${r * r} để chiều cao là số nguyên`);
    const expectedH = k / (r * r);
    assert.ok(
      equalsValue(ans, rat(expectedH)),
      `Chiều cao phải bằng k/r^2 = ${expectedH}, nhưng answerValue là ${toDecimal(ans)}`,
    );
    return;
  }

  throw new Error('Đề không khớp khuôn cylinder: ' + item.stem);
},

  'geo-triangle-exterior-angle': (item) => {
  const m = item.stem.match(/^In triangle ABC, the measure of angle A is (\d+)deg and the measure of angle B is (\d+)deg\. Side BC is extended through C to point D\. What is the measure of exterior angle ACD\?$/);
  if (!m) throw new Error('Đề không khớp khuôn: ' + item.stem);
  const a = Number(m[1]);
  const b = Number(m[2]);
  assert.ok(a > 0 && b > 0 && a + b < 180, 'Hai góc trong đã cho phải dương và tổng nhỏ hơn 180 để tam giác hợp lệ.');
  const expected = rat(a + b);
  const actual = correctValue(item);
  assert.ok(equalsValue(actual, expected), `Góc ngoài ACD phải bằng ${a} + ${b} = ${a + b} độ theo định lý góc ngoài, nhưng đáp án đúng đọc được là ${actual.num}/${actual.den}.`);
},

  'geo-special-angle-missing-side': (item) => {
  const m = item.stem.match(/^In right triangle ([A-Z])([A-Z])([A-Z]), angle ([A-Z]) = 90deg and angle ([A-Z]) = (30|60)deg\. If ([A-Z]{2}) = (\d+), what is the length of ([A-Z]{2})\?$/);
  if (!m) throw new Error('Đề không khớp khuôn: ' + item.stem);

  const vA = m[1]!;
  const vB = m[2]!;
  const vC = m[3]!;
  const rightVertex = m[4]!;
  const angleVertex = m[5]!;
  const theta = Number(m[6]);
  const knownSide = m[7]!;
  const knownVal = Number(m[8]);
  const askSide = m[9]!;

  if (rightVertex !== vC) throw new Error('Đỉnh góc vuông đọc được không khớp đỉnh thứ ba của tam giác: ' + item.stem);
  if (angleVertex !== vA) throw new Error('Đỉnh mang góc đặc biệt không khớp đỉnh đầu tiên của tam giác: ' + item.stem);

  const hypName = vA + vB; // cạnh huyền, nối hai đỉnh nhọn
  const legOpposite = vB + vC; // đối diện góc tại vA, dùng khi theta = 30
  const legAdjacent = vA + vC; // kề góc tại vA, dùng khi theta = 60
  const relevantLeg = theta === 30 ? legOpposite : legAdjacent; // sin(30) = cos(60) = 1/2

  let expected;
  if (knownSide === hypName && askSide === relevantLeg) {
    expected = rat(knownVal, 2);
  } else if (knownSide === relevantLeg && askSide === hypName) {
    expected = rat(knownVal * 2, 1);
  } else {
    throw new Error(`Cặp cạnh đã cho (${knownSide}) / đang hỏi (${askSide}) không khớp tỉ số lượng giác của góc ${theta} độ: ` + item.stem);
  }

  const actual = correctValue(item);
  assert.ok(
    equalsValue(actual, expected),
    `Đáp án đúng phải là ${expected.num}/${expected.den} nhưng lựa chọn đúng đang là ${actual.num}/${actual.den}`,
  );
},

  'geo-circle-arc-sector-pi': (item) => {
  const arcRe = /^A circle has a radius of (\d+) units\. An arc of the circle is intercepted by a central angle that measures (\d+) deg\. The length of the arc can be written as k pi units, where k is a constant\. What is the value of k\?$/;
  const areaRe = /^A circle has a radius of (\d+) units\. A sector of the circle has a central angle that measures (\d+) deg\. The area of the sector can be written as k pi square units, where k is a constant\. What is the value of k\?$/;

  const arcMatch = item.stem.match(arcRe);
  const areaMatch = item.stem.match(areaRe);
  if (!arcMatch && !areaMatch) throw new Error('Đề không khớp khuôn arc/area: ' + item.stem);

  assert.ok(item.answerValue, 'Câu grid-in phải có giá trị đáp án.');
  const answer = item.answerValue;

  if (arcMatch) {
    const r = Number(arcMatch[1]);
    const deg = Number(arcMatch[2]);
    if (!(deg > 0 && deg < 360)) throw new Error('Góc ở tâm phải trong khoảng (0, 360): ' + deg);
    // độ dài cung = (deg/360) * 2 * pi * r => hệ số k = 2*r*deg/360
    const expected = rat(2 * r * deg, 360);
    assert.ok(
      equalsValue(answer, expected),
      `Độ dài cung sai: kỳ vọng k = ${expected.num}/${expected.den}, thực tế k = ${answer.num}/${answer.den} (r=${r}, deg=${deg})`,
    );
  } else {
    if (!areaMatch) throw new Error('Đề không khớp khuôn area: ' + item.stem);
    const r = Number(areaMatch[1]);
    const deg = Number(areaMatch[2]);
    if (!(deg > 0 && deg < 360)) throw new Error('Góc ở tâm phải trong khoảng (0, 360): ' + deg);
    // diện tích quạt = (deg/360) * pi * r^2 => hệ số k = r^2*deg/360
    const expected = rat(r * r * deg, 360);
    assert.ok(
      equalsValue(answer, expected),
      `Diện tích quạt sai: kỳ vọng k = ${expected.num}/${expected.den}, thực tế k = ${answer.num}/${answer.den} (r=${r}, deg=${deg})`,
    );
  }

  // Đề bài yêu cầu hệ số của pi phải là số nguyên (bội nguyên của pi), không phải phân số.
  assert.equal(answer.den, 1, `Hệ số của pi phải là số nguyên, nhận được ${answer.num}/${answer.den}`);
},

};

// ------------------------------------------------------------ tính chất chung

test('taxonomy 19 kỹ năng đã được phủ hết', () => {
  assert.deepEqual(uncoveredSkills(), [], 'Còn kỹ năng chưa có template.');
  assert.equal(MATH_TEMPLATES.length, 38);
});

test('mọi template đều có bộ kiểm chứng riêng', () => {
  // Thêm template mà quên viết verifier thì nó lọt qua mọi test bên dưới với
  // đáp án chưa từng được kiểm. Chặn ngay ở đây.
  for (const template of MATH_TEMPLATES) {
    assert.ok(VERIFIERS[template.slug], `Template "${template.slug}" chưa có verifier.`);
  }
});

test('slug không trùng nhau', () => {
  const slugs = MATH_TEMPLATES.map((t) => t.slug);
  assert.equal(new Set(slugs).size, slugs.length, 'Có slug trùng — id câu sẽ đụng nhau.');
});

test('tỉ lệ câu tự điền đáp án bám đề thật', () => {
  // Đề thi thật có khoảng một phần tư số câu là grid-in. Lệch nhiều thì bài
  // chẩn đoán và mock đều không còn giống nhịp đề thi.
  const gridIn = MATH_TEMPLATES.filter((t) => t.format === 'grid_in').length;
  const ratio = gridIn / MATH_TEMPLATES.length;
  assert.ok(ratio >= 0.15 && ratio <= 0.35, `Tỉ lệ grid-in là ${(ratio * 100).toFixed(0)}%.`);
});

for (const template of MATH_TEMPLATES) {
  test(`${template.slug}: đáp án đúng trên ${SEEDS} hạt`, () => {
    const verify = VERIFIERS[template.slug];
    assert.ok(verify);
    for (let seed = 0; seed < SEEDS; seed += 1) {
      verify(generateMathItem(template.slug, seed));
    }
  });

  test(`${template.slug}: siêu dữ liệu khớp danh bạ`, () => {
    for (let seed = 0; seed < SEEDS; seed += 1) {
      const item = generateMathItem(template.slug, seed);
      assert.equal(item.skill, template.skill);
      assert.equal(item.domain, MATH_SKILL_DOMAIN[template.skill]);
      assert.equal(item.format, template.format, 'Định dạng khai báo lệch với định dạng sinh ra.');
      assert.equal(item.id, `${template.slug}:${seed}`);
    }
  });

  test(`${template.slug}: markup toán sạch và bước giải không rỗng`, () => {
    for (let seed = 0; seed < SEEDS; seed += 1) {
      const item = generateMathItem(template.slug, seed);
      assertMarkupClean(item);
      assert.ok(item.steps.length > 0, 'Câu nào cũng phải có lời giải.');
      for (const step of item.steps) {
        assert.ok(step.text.trim().length > 0, 'Bước giải rỗng.');
        // `text` vẽ bằng Text THƯỜNG, `expr` mới đi qua MathText. Nhét công
        // thức vào `text` thì người học đọc được nguyên chuỗi "frac(1,6)" giữa
        // câu tiếng Việt — đã xảy ra thật ở bước cuối của bất phương trình.
        assert.ok(
          !/frac\(|sqrt\(|\^\d|_\d/.test(step.text),
          `Markup toán lọt vào phần lời: "${step.text}"`,
        );
      }
    }
  });

  test(`${template.slug}: không có bước giải rỗng`, () => {
    // Hai bước liên tiếp in ra CÙNG một dòng toán nghĩa là bước sau không làm
    // gì. Đã bắt được thật: khi hệ số của x rút lại còn 1, bước "chia hai vế
    // cho 1" in lại y hệt dòng ngay trên nó.
    for (let seed = 0; seed < SEEDS; seed += 1) {
      const item = generateMathItem(template.slug, seed);
      for (let i = 1; i < item.steps.length; i += 1) {
        const previous = item.steps[i - 1]?.expr;
        const current = item.steps[i]?.expr;
        if (previous && current) {
          assert.notEqual(current, previous, `Bước ${i + 1} in lại y hệt bước ${i} (hạt ${seed}).`);
        }
      }
    }
  });

  test(`${template.slug}: không in ra số vô nghĩa`, () => {
    for (let seed = 0; seed < SEEDS; seed += 1) {
      const item = generateMathItem(template.slug, seed);
      const rendered = [item.stem, ...(item.choices ?? []).map((c) => c.display)].join(' ');
      assert.ok(!/NaN|Infinity|undefined|null/.test(rendered), `Đề in ra rác: ${rendered}`);
      assert.ok(!/-0\b/.test(rendered), `Đề in ra số âm 0: ${rendered}`);
      assert.ok(!/\+ -|- -/.test(rendered), `Đề in ra dấu chồng dấu: ${rendered}`);
      assert.ok(!/\b1x\b/.test(rendered), `Đề in ra hệ số 1 thừa: ${rendered}`);
      // Ngoặc rỗng nghĩa là có một số hạng bị rút mất trong lúc ghép chuỗi. Đã
      // bắt được thật: nghiệm 0 làm `(x - 0)` in ra thành "()" sau khi rút.
      assert.ok(!/\(\s*\)/.test(rendered), `Đề in ra ngoặc rỗng: ${rendered}`);
    }
  });

  if (template.format === 'mcq') {
    test(`${template.slug}: bốn lựa chọn đôi một khác nhau`, () => {
      for (let seed = 0; seed < SEEDS; seed += 1) {
        const item = generateMathItem(template.slug, seed);
        assert.ok(item.choices, 'Câu trắc nghiệm thiếu lựa chọn.');
        assert.equal(item.choices.length, 4);
        assert.ok(
          item.correctIndex !== null && item.correctIndex >= 0 && item.correctIndex < 4,
          'correctIndex nằm ngoài khoảng.',
        );

        // Lựa chọn bằng SỐ so theo giá trị (6/4 và 3/2 hiện khác nhau nhưng là
        // một số); lựa chọn bằng CHỮ thì so theo chuỗi.
        const values = item.choices.map((c) => tryDisplayToValue(c.display));
        if (values.every((v) => v !== null)) {
          for (let i = 0; i < values.length; i += 1) {
            for (let j = i + 1; j < values.length; j += 1) {
              assert.ok(
                !equalsValue(values[i]!, values[j]!),
                `Lựa chọn ${i} và ${j} trùng giá trị.`,
              );
            }
          }
        } else {
          const displays = item.choices.map((c) => c.display);
          assert.equal(new Set(displays).size, 4, 'Có hai lựa chọn trùng chữ.');
        }

        assert.equal(item.choices[item.correctIndex!]?.errorTag, null, 'Đáp án đúng mang nhãn lỗi.');
        assert.equal(item.choices[item.correctIndex!]?.note, undefined, 'Đáp án đúng có ghi chú lỗi.');
      }
    });

    test(`${template.slug}: mỗi nhiễu đều nói được vì sao nó sai`, () => {
      // Nhiễu không nhãn mà cũng không ghi chú thì màn Review chỉ báo được
      // "sai", và người học mất đúng cái phần dạy được của câu hỏi.
      for (let seed = 0; seed < SEEDS; seed += 1) {
        const item = generateMathItem(template.slug, seed);
        (item.choices ?? []).forEach((choice, index) => {
          if (index === item.correctIndex) return;
          assert.ok(
            choice.errorTag !== null || (choice.note?.length ?? 0) > 0,
            `Nhiễu "${choice.display}" (hạt ${seed}) không có nhãn lỗi lẫn ghi chú.`,
          );
        });
      }
    });

    test(`${template.slug}: vị trí đáp án đúng rải đều cả bốn chỗ`, () => {
      // Đáp án luôn nằm ở một chỗ là học được mẹo chọn, không cần giải toán.
      const seen = new Set<number>();
      for (let seed = 0; seed < SEEDS; seed += 1) {
        const index = generateMathItem(template.slug, seed).correctIndex;
        if (index !== null) seen.add(index);
      }
      assert.equal(seen.size, 4, `Đáp án đúng chỉ rơi vào ${[...seen].join(', ')}.`);
    });
  }

  if (template.format === 'grid_in') {
    test(`${template.slug}: đáp án điền vừa ô grid-in`, () => {
      for (let seed = 0; seed < SEEDS; seed += 1) {
        const item = generateMathItem(template.slug, seed);
        assert.ok(item.answerValue, 'Câu grid-in phải có giá trị đáp án.');
        assert.ok(
          fitsGrid(item.answerValue),
          `Đáp án ${toDecimal(item.answerValue)} không có cách nào điền vừa ô.`,
        );
        assert.equal(item.choices, null, 'Câu grid-in không được có lựa chọn.');
      }
    });
  }

  test(`${template.slug}: cùng hạt ra cùng một câu`, () => {
    for (let seed = 0; seed < 20; seed += 1) {
      assert.deepEqual(
        generateMathItem(template.slug, seed),
        generateMathItem(template.slug, seed),
        'Cùng một hạt mà ra hai câu khác nhau — có Math.random() lọt vào đâu đó.',
      );
    }
  });

  test(`${template.slug}: hạt khác nhau ra câu hỏi khác nhau`, () => {
    // Template bỏ quên rng sẽ in ra đúng một câu duy nhất cho mọi hạt, mà mọi
    // test khác vẫn xanh.
    //
    // So theo CẢ CÂU HỎI chứ không chỉ theo câu chữ của đề: câu hỏi bảng tần số
    // luôn viết đúng một dòng như nhau, nhưng bảng số liệu thì mỗi lần một
    // khác, và người học phải giải lại từ đầu. Chỉ đếm câu chữ là kết luận sai
    // rằng template ấy lặp.
    const signatures = new Set<string>();
    for (let seed = 0; seed < SEEDS; seed += 1) {
      const item = generateMathItem(template.slug, seed);
      signatures.add(
        JSON.stringify([
          item.stem,
          item.figure,
          (item.choices ?? []).map((c) => c.display).sort(),
          item.answerValue,
        ]),
      );
    }
    assert.ok(
      signatures.size > SEEDS / 2,
      `${SEEDS} hạt chỉ ra ${signatures.size} câu hỏi khác nhau — người drill sẽ gặp lại câu cũ rất nhanh.`,
    );
  });
}
