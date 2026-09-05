import test from 'node:test';
import assert from 'node:assert/strict';

import { hashId, pickTransferSource, type TransferCandidate } from './transfer-source';

function a(over: Partial<TransferCandidate> & { id: string }): TransferCandidate {
  return {
    exam: 'ielts',
    passageTier: 'p2',
    licenseType: 'full_text',
    wordCount: 900,
    ...over,
  } as TransferCandidate;
}

const CURRENT = a({ id: 'bai-goc' });

test('không bao giờ trả về chính bài đang làm', () => {
  const pool = [CURRENT, a({ id: 'bai-1' }), a({ id: 'bai-2' })];
  for (let i = 0; i < 5; i += 1) {
    assert.notEqual(pickTransferSource(CURRENT, pool)?.id, CURRENT.id);
  }
});

test('bài chỉ có tiêu đề không được chọn — không có toàn văn để trích', () => {
  const pool = [CURRENT, a({ id: 'chi-tieu-de', licenseType: 'headline_only' })];
  assert.equal(pickTransferSource(CURRENT, pool), null);
});

test('không lấy bài của kỳ thi khác', () => {
  const pool = [CURRENT, a({ id: 'bai-sat', exam: 'sat' })];
  assert.equal(pickTransferSource(CURRENT, pool), null);
});

test('ưu tiên bài cùng khổ passage', () => {
  const pool = [CURRENT, a({ id: 'khac-kho', passageTier: 'p1' }), a({ id: 'cung-kho' })];
  assert.equal(pickTransferSource(CURRENT, pool)?.id, 'cung-kho');
});

test('không có bài cùng khổ thì lùi về cùng kỳ thi, chứ không trả rỗng', () => {
  const pool = [CURRENT, a({ id: 'khac-kho', passageTier: 'p1' })];
  assert.equal(pickTransferSource(CURRENT, pool)?.id, 'khac-kho');
});

test('kho không có bài nào hợp thì nói thẳng là không có', () => {
  assert.equal(pickTransferSource(CURRENT, [CURRENT]), null);
  assert.equal(pickTransferSource(CURRENT, []), null);
});

/*
  Tất định là yêu cầu về ĐO LƯỜNG, không phải về kỹ thuật: một lượt làm bài phải
  dựng lại được khi cần soi lại, và trong nghiên cứu hai tuần thì "mỗi em gặp một
  bài khác nhau" là biến không kiểm soát nằm ngay giữa phép đo.
*/
test('cùng bài gốc thì luôn ra cùng bài chuyển giao', () => {
  const pool = [CURRENT, a({ id: 'x' }), a({ id: 'y' }), a({ id: 'z' })];
  const first = pickTransferSource(CURRENT, pool)?.id;
  for (let i = 0; i < 10; i += 1) {
    assert.equal(pickTransferSource(CURRENT, pool)?.id, first);
  }
});

test('thứ tự bài trong kho đổi thì kết quả không đổi', () => {
  const pool = [CURRENT, a({ id: 'x' }), a({ id: 'y' }), a({ id: 'z' })];
  const reversed = [...pool].reverse();
  assert.equal(pickTransferSource(CURRENT, pool)?.id, pickTransferSource(CURRENT, reversed)?.id);
});

test('bài gốc khác nhau thì không dồn hết vào một bài', () => {
  const pool = Array.from({ length: 12 }, (_, i) => a({ id: `bai-${i}` }));
  const picks = new Set(
    pool.map((cur) => pickTransferSource(cur, pool)?.id).filter((x): x is string => Boolean(x)),
  );
  assert.ok(picks.size >= 5, `chỉ tản ra ${picks.size} bài, băm đang dồn cục`);
});

test('băm không phụ thuộc độ dài chuỗi', () => {
  assert.notEqual(hashId('aaa'), hashId('aab'));
  assert.notEqual(hashId('bai-1'), hashId('bai-2'));
});
