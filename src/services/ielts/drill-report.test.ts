import assert from 'node:assert/strict';
import test from 'node:test';

import { accuracyVerdict, bandFor, bandSpectrum, buildReport, spectrumRowFor, type ReportItem } from './drill-report';

const item = (index: number, typeId: string, correct: boolean, given: string | null = correct ? 'A' : 'B'): ReportItem => ({
  index, typeId, prompt: `q${index}`, answer: 'A', given, correct, why: 'vì',
});

test('quy đổi band Reading và Listening theo bảng 40 câu', () => {
  assert.equal(bandFor('reading', 30, 40), 7);
  assert.equal(bandFor('listening', 30, 40), 7);
  assert.equal(bandFor('reading', 27, 40), 6.5);
  assert.equal(bandFor('listening', 26, 40), 6.5);
  // 20 câu được nhân đôi lên thang 40: 15/20 = 30/40.
  assert.equal(bandFor('reading', 15, 20), 7);
  assert.equal(bandFor('listening', 0, 0), 0);
});

test('Reading và Listening lệch nhau ở các mốc khác bảng (32 câu)', () => {
  assert.equal(bandFor('listening', 32, 40), 7.5);
  assert.equal(bandFor('reading', 32, 40), 7);
});

test('báo cáo tính đúng điểm, chưa làm, độ chính xác từng dạng', () => {
  const items: ReportItem[] = [
    ...[1, 2, 3, 4, 5].map((i) => item(i, 'reading-tfng', i <= 4)),
    ...[6, 7, 8, 9].map((i) => item(i, 'reading-ynng', i === 6)),
    item(10, 'reading-short-answer', false, null),
  ];
  const r = buildReport('reading', items);
  assert.equal(r.total, 10);
  assert.equal(r.correct, 5);
  assert.equal(r.unanswered, 1);
  assert.equal(r.pct, 50);
  assert.equal(r.scaled40, 20);
  assert.equal(r.fullLength, false);
  const tfng = r.byType.find((t) => t.typeId === 'reading-tfng')!;
  assert.deepEqual([tfng.correct, tfng.total, tfng.pct], [4, 5, 80]);
  assert.equal(r.weakest?.typeId, 'reading-ynng');
  assert.equal(r.strongest?.typeId, 'reading-tfng');
  // Dạng chỉ có 1 câu chưa đủ để gọi là yếu hay mạnh.
  assert.ok(r.byType.some((t) => t.typeId === 'reading-short-answer'));
  assert.notEqual(r.weakest?.typeId, 'reading-short-answer');
});

test('lượt dưới 40 câu có khoảng sai số, đủ 40 câu thì band chắc chắn', () => {
  const part = buildReport('listening', Array.from({ length: 20 }, (_, i) => item(i + 1, 'listening-mcq', i < 15)));
  assert.equal(part.band, 7);
  assert.ok(part.bandLow < part.band || part.bandHigh > part.band);
  const full = buildReport('listening', Array.from({ length: 40 }, (_, i) => item(i + 1, 'listening-mcq', i < 30)));
  assert.equal(full.fullLength, true);
  assert.equal(full.bandLow, full.band);
  assert.equal(full.bandHigh, full.band);
});

test('phổ điểm phủ kín thang 40 không chồng lấn và tìm đúng hàng của điểm', () => {
  for (const skill of ['reading', 'listening'] as const) {
    const rows = bandSpectrum(skill);
    assert.equal(rows[0]!.band, 9);
    assert.equal(rows[0]!.maxRaw, 40);
    for (let i = 1; i < rows.length; i++) assert.equal(rows[i]!.maxRaw, rows[i - 1]!.minRaw - 1, `${skill} hàng ${i}`);
    for (let raw = rows[rows.length - 1]!.minRaw; raw <= 40; raw++) {
      const row = spectrumRowFor(skill, raw)!;
      assert.equal(row.band, bandFor(skill, raw, 40), `${skill} ${raw}/40`);
    }
  }
});

test('nhận xét độ chính xác theo ngưỡng', () => {
  assert.equal(accuracyVerdict(90), 'strong');
  assert.equal(accuracyVerdict(60), 'ok');
  assert.equal(accuracyVerdict(30), 'weak');
});
