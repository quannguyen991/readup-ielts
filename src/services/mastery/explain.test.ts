import test from 'node:test';
import assert from 'node:assert/strict';

import { explain } from './explain';
import type { ProofState, SkillRecord, SkillStatus } from './types';

/**
 * Canh lời giải thích.
 *
 * Ràng buộc ở đây là ràng buộc VỀ NGÔN NGỮ, và nó nghiêm túc chứ không phải chuyện
 * văn phong: hệ thống không nhìn thấy trạng thái trong đầu người học, nên không
 * được nói như thể nó nhìn thấy. "Bạn chưa hiểu" là một phán đoán; "bạn trả lời
 * đúng nhưng đánh dấu sai chỗ" là một quan sát. Chỉ cái thứ hai mới kiểm được, và
 * chỉ cái thứ hai mới dạy được người học cách tự soi lại.
 */

function rec(over: Partial<SkillRecord> = {}): SkillRecord {
  return {
    skill: { domain: 'reading', key: 'locate' },
    status: 'probing' as SkillStatus,
    lastState: 'aligned-correct' as ProofState,
    lastSourceId: 'article-1',
    observations: 3,
    transfers: 0,
    updatedAt: '2026-09-05T10:00:00.000Z',
    ...over,
  };
}

/** Những chữ phán đoán trạng thái trong đầu, không được xuất hiện ở đâu cả. */
const CAM = ['chưa hiểu', 'không hiểu', 'đoán bừa', 'lười', 'kém', 'yếu'];

test('không dùng chữ phán đoán trạng thái trong đầu người học', () => {
  const states: ProofState[] = [
    'unobserved',
    'aligned-correct',
    'misaligned-correct',
    'aligned-wrong',
    'misaligned-wrong',
  ];
  const statuses: SkillStatus[] = ['unobserved', 'needs-probe', 'probing', 'confirmed'];

  for (const lastState of states) {
    for (const status of statuses) {
      const e = explain(rec({ lastState, status }));
      const text = [e.headline, e.nextVi, ...e.steps.map((s) => `${s.label} ${s.detail}`)]
        .join(' ')
        .toLowerCase();
      for (const tu of CAM) {
        assert.ok(!text.includes(tu), `[${status}/${lastState}] chứa chữ phán đoán: "${tu}"`);
      }
    }
  }
});

test('luôn nói ra điều kiện công nhận, ở mọi trạng thái', () => {
  // Người học phải luôn biết cái đích là gì, kể cả khi chưa quan sát được gì.
  for (const lastState of ['unobserved', 'aligned-wrong', 'aligned-correct'] as ProofState[]) {
    const e = explain(rec({ lastState }));
    const dieuKien = e.steps.find((s) => s.label.includes('Điều kiện'));
    assert.ok(dieuKien, `thiếu điều kiện công nhận ở trạng thái ${lastState}`);
    assert.ok(dieuKien.detail.includes('BÀI KHÁC'), 'điều kiện phải nêu rõ "bài khác"');
  }
});

test('nêu phép thử được chọn, trừ khi chưa quan sát được gì', () => {
  assert.ok(explain(rec({ lastState: 'aligned-wrong' })).steps.some((s) => s.label.includes('Phép thử')));
  assert.ok(
    !explain(rec({ lastState: 'unobserved' })).steps.some((s) => s.label.includes('Phép thử')),
    'chưa đo được thì không có phép thử nào để nêu',
  );
});

test('trạng thái chưa đo được nói rõ là CHƯA ĐO, không nói là sai', () => {
  const e = explain(rec({ lastState: 'unobserved', status: 'unobserved' }));
  const quanSat = e.steps.find((s) => s.label.includes('quan sát'));
  assert.ok(quanSat?.detail.includes('Chưa đo được'), quanSat?.detail ?? '(thiếu dòng quan sát)');
});

test('mỗi trạng thái quan sát có lời mô tả riêng, không dùng chung một câu', () => {
  const seen = new Set<string>();
  for (const lastState of [
    'aligned-correct',
    'misaligned-correct',
    'aligned-wrong',
    'misaligned-wrong',
  ] as ProofState[]) {
    const detail = explain(rec({ lastState })).steps.find((s) => s.label.includes('quan sát'))?.detail;
    assert.ok(detail);
    assert.ok(!seen.has(detail), `trạng thái ${lastState} dùng lại lời của trạng thái khác`);
    seen.add(detail);
  }
});

test('đã công nhận thì nói rõ vẫn còn bị theo dõi, không hứa vĩnh viễn', () => {
  const e = explain(rec({ status: 'confirmed', transfers: 1 }));
  assert.ok(e.nextVi.includes('gỡ'), `phải nói công nhận có thể bị gỡ: ${e.nextVi}`);
});

test('có số lần chuyển giao thì nêu ra, không có thì không bịa dòng rỗng', () => {
  assert.ok(explain(rec({ transfers: 2 })).steps.some((s) => s.label.includes('chuyển giao')));
  assert.ok(!explain(rec({ transfers: 0 })).steps.some((s) => s.label.includes('Đã đạt chuyển giao')));
});

test('nêu đúng số lượt đã quan sát', () => {
  assert.ok(explain(rec({ observations: 7 })).steps.some((s) => s.label.includes('7 lượt')));
});
