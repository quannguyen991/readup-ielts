import test from 'node:test';
import assert from 'node:assert/strict';

import { buildEvidenceItem, EVIDENCE_SLUGS } from './generate';
import { verifyEvidenceItem } from './verify';
import type { EvidenceItem } from './types';

/** Sinh nhiều câu để kiểm bằng tính chất, không phải bằng một ví dụ. */
function sample(count: number): EvidenceItem[] {
  const out: EvidenceItem[] = [];
  for (let i = 0; i < count; i += 1) {
    const slug = EVIDENCE_SLUGS[i % EVIDENCE_SLUGS.length]!;
    const item = buildEvidenceItem(slug, `s${i}`);
    if (item) out.push(item);
  }
  return out;
}

const ITEMS = sample(200);

test('sinh được gần hết số hạt giống đã thử', () => {
  // Vòng dựng bảng có trần 40 lần thử; nếu tỉ lệ ra thấp thì luật quá chặt.
  assert.ok(ITEMS.length >= 190, `chỉ dựng được ${ITEMS.length}/200`);
});

test('MỌI câu sinh ra đều qua hàng rào', () => {
  /*
    Đây là test quan trọng nhất của cả bộ sinh. Nó không kiểm một ví dụ mà kiểm
    một TÍNH CHẤT: không có hạt giống nào dựng ra được câu hỏng. Bộ sinh và hàng
    rào viết độc lập, nên test này bắt được cả lỗi của bên dựng lẫn lỗi của bên
    kiểm.
  */
  for (const item of ITEMS) {
    const v = verifyEvidenceItem(item);
    assert.equal(v.ok, true, `${item.id} trượt: ${v.ok ? '' : v.reason}`);
  }
});

test('tất định: cùng hạt giống ra cùng câu, cùng thứ tự phương án', () => {
  const a = buildEvidenceItem('reserve-species', 'lap-lai')!;
  const b = buildEvidenceItem('reserve-species', 'lap-lai')!;
  assert.deepEqual(a, b);
});

test('hạt giống khác thì câu khác', () => {
  const a = buildEvidenceItem('reserve-species', 'x1')!;
  const b = buildEvidenceItem('reserve-species', 'x2')!;
  assert.notDeepEqual(a.table.rows, b.table.rows);
});

test('mỗi câu có đúng bốn phương án, đúng một đáp án', () => {
  for (const item of ITEMS) {
    assert.equal(item.options.length, 4, item.id);
    assert.equal(item.options.filter((o) => o.code === null).length, 1, item.id);
    assert.equal(item.options[item.answerIndex]!.code, null, item.id);
  }
});

test('mỗi câu có nhiễu accurate_but_irrelevant HOẶC not_in_table, không thiếu cả hai', () => {
  for (const item of ITEMS) {
    const codes = item.options.map((o) => o.code);
    assert.ok(
      codes.includes('accurate_but_irrelevant') || codes.includes('not_in_table'),
      `${item.id} thiếu nhiễu quan trọng`,
    );
  }
});

test('nhiễu accurate_but_irrelevant thật sự ĐÚNG với bảng', () => {
  /*
    Nếu nó sai với bảng thì nó chỉ là một nhiễu tầm thường, và cái bẫy đắt giá
    nhất của dạng đề này biến mất: người học sẽ loại nó bằng cách kiểm tính đúng,
    thay vì phải nhận ra nó không đỡ nhận định.
  */
  let checked = 0;
  for (const item of ITEMS) {
    const idx = item.options.findIndex((o) => o.code === 'accurate_but_irrelevant');
    if (idx === -1) continue;
    checked += 1;
    const { evaluate } = require('./evaluate') as typeof import('./evaluate');
    assert.equal(evaluate(item.table, item.options[idx]!.claim), true, `${item.id} nhiễu này lại sai`);
  }
  assert.ok(checked > 20, `chỉ kiểm được ${checked} câu, quá ít để tin`);
});

test('KHÔNG phương án nào tự mâu thuẫn — loại được mà chưa cần mở bảng', () => {
  /*
    Bản đầu sinh ra "Alloy A showed a larger increase (from 639 to 612)" — ngoặc
    đơn cho thấy GIẢM trong khi câu nói TĂNG. Người học loại nó mà không cần nhìn
    bảng, nên câu hỏi mất hết giá trị đo lường. Đây đúng là "nhiễu tự lộ" mà bộ
    sinh IELTS đã cấm bằng luật số 13.
  */
  for (const item of ITEMS) {
    for (const o of item.options) {
      const m = /larger (increase|decrease) \(from (\d+) to (\d+)\)/.exec(o.text);
      if (!m) continue;
      const [, dir, a, b] = m;
      const rose = Number(b) > Number(a);
      assert.equal(rose, dir === 'increase', `${item.id} tự mâu thuẫn: ${o.text}`);
    }
  }
});

test('nhiễu wrong_row nói về một nơi CŨNG TĂNG, chỉ tăng ít hơn', () => {
  // Chỉ vào một nơi đang giảm thì loại được bằng mắt; chỉ vào một nơi cũng tăng
  // thì buộc phải so độ lớn, tức buộc phải đọc bảng.
  let checked = 0;
  for (const item of ITEMS) {
    const o = item.options.find((x) => x.code === 'wrong_row');
    if (!o || o.claim.kind !== 'change-most') continue;
    checked += 1;
    const row = item.table.rows.find((r) => r.entity === o.claim.entity)!;
    assert.ok(row.values[1]! > row.values[0]!, `${item.id}: ${o.claim.entity} lại đang giảm`);
  }
  assert.ok(checked > 100, `chỉ kiểm được ${checked} câu`);
});

test('không câu nào lọt chữ sai ngữ pháp của bản đầu', () => {
  for (const item of ITEMS) {
    const all = [item.passage, item.stem, ...item.options.map((o) => o.text)].join(' ');
    assert.ok(!/In (Untreated|Heat-treated)/.test(all), `${item.id}: nhãn cột không phải năm`);
    assert.ok(!/number of megapascals/.test(all), `${item.id}: MPa không đếm được`);
  }
});

test('bảng không có hoà ở bất kỳ cột nào', () => {
  // Hoà làm mệnh đề "cao nhất" có hai đáp án đúng.
  for (const item of ITEMS) {
    item.table.columns.forEach((_, c) => {
      const col = item.table.rows.map((r) => r.values[c]!);
      assert.equal(new Set(col).size, col.length, `${item.id} hoà ở cột ${c}`);
    });
  }
});

test('đề và phương án viết bằng tiếng Anh, lời giải tiếng Việt', () => {
  // SAT là kỳ thi tiếng Anh; lời giải thì cho người học Việt.
  const item = ITEMS[0]!;
  assert.ok(!/[àáâãèéêìíòóôõùúýăđĩũơư]/i.test(item.stem), 'stem phải là tiếng Anh');
  for (const o of item.options) {
    assert.ok(!/[àáâãèéêìíòóôõùúýăđĩũơư]/i.test(o.text), `phương án phải tiếng Anh: ${o.text}`);
  }
  assert.match(item.solutionVi, /[àáâãèéêìíòóôõùúýăđĩũơư]/i);
});

test('slug lạ thì trả null chứ không ném lỗi', () => {
  assert.equal(buildEvidenceItem('khong-co-boi-canh-nay', 's1'), null);
});
