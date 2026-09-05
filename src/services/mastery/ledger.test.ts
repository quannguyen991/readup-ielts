import test from 'node:test';
import assert from 'node:assert/strict';

import {
  applyOutcome,
  classify,
  confirmed,
  emptyLedger,
  needsWork,
  pointsSame,
  probeFor,
  record,
  statusOf,
  type ProbeOutcome,
} from './ledger';
import type { EvidencePointer, Observation, SkillRef } from './types';

/**
 * Canh sổ bằng chứng.
 *
 * Đây là chỗ giữ quyền kết luận "đã hiểu hay chưa" của cả app, nên các ràng buộc
 * ở đây không phải chi tiết kỹ thuật mà là cam kết sư phạm. Hai cái quan trọng
 * nhất, và cũng là hai cái sẽ bị bào mòn đầu tiên khi có người muốn bảng trông
 * đẹp hơn:
 *
 *   · chỉ CHUYỂN GIAO trên một nguồn KHÁC mới sinh ra `confirmed`;
 *   · `confirmed` GỠ LẠI được khi sau đó trượt.
 */

const READING: SkillRef = { domain: 'reading', key: 'locate' };
const MATH: SkillRef = { domain: 'sat-math', key: 'linear_equations_one_var' };

const P = (index: number): EvidencePointer => ({ kind: 'paragraph', index });

function obs(over: Partial<Observation> = {}): Observation {
  return {
    skill: READING,
    sourceId: 'article-1',
    answerCorrect: true,
    pointer: P(2),
    truth: P(2),
    at: '2026-09-05T10:00:00.000Z',
    ...over,
  };
}

function outcome(over: Partial<ProbeOutcome> = {}): ProbeOutcome {
  return {
    skill: READING,
    kind: 'transfer',
    passed: true,
    sourceId: 'article-1',
    probeSourceId: 'article-2',
    at: '2026-09-05T10:05:00.000Z',
    ...over,
  };
}

// ------------------------------------------------------------------ so sánh

test('hai con trỏ cùng loại, cùng vị trí thì khớp', () => {
  assert.equal(pointsSame(P(3), P(3)), true);
  assert.equal(pointsSame(P(3), P(4)), false);
});

test('khác loại con trỏ thì không so được, coi như lệch', () => {
  assert.equal(pointsSame(P(1), { kind: 'transcript-line', index: 1 }), false);
});

test('con trỏ nhãn lỗi so bằng nhãn, không so bằng số', () => {
  assert.equal(
    pointsSame({ kind: 'error-tag', tag: 'sign_flip' }, { kind: 'error-tag', tag: 'sign_flip' }),
    true,
  );
  assert.equal(
    pointsSame({ kind: 'error-tag', tag: 'sign_flip' }, { kind: 'error-tag', tag: 'off_by_one' }),
    false,
  );
});

// ------------------------------------------------------------ phân loại 2×2

test('bốn trạng thái quan sát được, đúng theo hai trục', () => {
  assert.equal(classify(obs({ answerCorrect: true, pointer: P(2), truth: P(2) })), 'aligned-correct');
  assert.equal(classify(obs({ answerCorrect: true, pointer: P(5), truth: P(2) })), 'misaligned-correct');
  assert.equal(classify(obs({ answerCorrect: false, pointer: P(2), truth: P(2) })), 'aligned-wrong');
  assert.equal(classify(obs({ answerCorrect: false, pointer: P(5), truth: P(2) })), 'misaligned-wrong');
});

test('không chỉ bằng chứng thì là CHƯA ĐO ĐƯỢC, không phải đo rồi thấy sai', () => {
  assert.equal(classify(obs({ pointer: null })), 'unobserved');
  assert.equal(classify(obs({ truth: null })), 'unobserved');
  // Kể cả khi trả lời sai — sai mà không biết họ dựa vào đâu thì vẫn chưa đo được.
  assert.equal(classify(obs({ answerCorrect: false, pointer: null })), 'unobserved');
});

test('mỗi trạng thái ra đúng một phép thử, và chưa đo được thì không có phép thử', () => {
  assert.equal(probeFor('aligned-correct'), 'transfer');
  assert.equal(probeFor('misaligned-correct'), 'evidence-reselect');
  assert.equal(probeFor('aligned-wrong'), 'entailment');
  assert.equal(probeFor('misaligned-wrong'), 'locate');
  assert.equal(probeFor('unobserved'), null);
});

// --------------------------------------------------------------- ghi sổ

test('làm đúng một câu KHÔNG tự nó tạo ra công nhận', () => {
  // Đây là ràng buộc trung tâm: đúng một lần chỉ nghĩa là lần này đúng.
  const l = record(emptyLedger(), obs());
  assert.equal(statusOf(l, READING), 'probing');
  assert.notEqual(statusOf(l, READING), 'confirmed');
});

test('trả lời sai đặt kỹ năng vào diện cần làm rõ', () => {
  const l = record(emptyLedger(), obs({ answerCorrect: false, pointer: P(9) }));
  assert.equal(statusOf(l, READING), 'needs-probe');
});

test('kỹ năng chưa gặp thì là chưa quan sát', () => {
  assert.equal(statusOf(emptyLedger(), MATH), 'unobserved');
});

test('đếm số lần quan sát và nhớ nguồn gần nhất', () => {
  let l = record(emptyLedger(), obs({ sourceId: 'a' }));
  l = record(l, obs({ sourceId: 'b' }));
  const rec = l['reading:locate'];
  assert.equal(rec?.observations, 2);
  assert.equal(rec?.lastSourceId, 'b');
});

// ------------------------------------------------------- điều kiện công nhận

test('CHUYỂN GIAO trên nguồn KHÁC thì mới công nhận', () => {
  const l = applyOutcome(record(emptyLedger(), obs()), outcome());
  assert.equal(statusOf(l, READING), 'confirmed');
});

test('chuyển giao trên ĐÚNG nguồn cũ thì KHÔNG công nhận', () => {
  // Làm lại đúng bài cũ không tách được "đã hiểu" khỏi "nhớ đáp án".
  const l = applyOutcome(
    record(emptyLedger(), obs()),
    outcome({ probeSourceId: 'article-1', sourceId: 'article-1' }),
  );
  assert.notEqual(statusOf(l, READING), 'confirmed');
});

test('phép thử KHÔNG phải chuyển giao thì không bao giờ công nhận, dù qua', () => {
  for (const kind of ['locate', 'entailment', 'evidence-reselect'] as const) {
    const l = applyOutcome(record(emptyLedger(), obs()), outcome({ kind, passed: true }));
    assert.notEqual(statusOf(l, READING), 'confirmed', `phép thử ${kind} không được tạo công nhận`);
    assert.equal(statusOf(l, READING), 'probing');
  }
});

test('trượt chuyển giao thì quay về diện cần làm rõ', () => {
  const l = applyOutcome(record(emptyLedger(), obs()), outcome({ passed: false }));
  assert.equal(statusOf(l, READING), 'needs-probe');
});

test('công nhận GỠ LẠI được khi sau đó trượt chuyển giao', () => {
  /*
    Mastery là phát biểu về hiện tại, không phải huy chương đã trao. Người học
    tụt lại là chuyện có thật; một cái sổ không phản ánh được điều đó thì không
    dùng để quyết định dạy gì tiếp theo được.
  */
  let l = applyOutcome(record(emptyLedger(), obs()), outcome());
  assert.equal(statusOf(l, READING), 'confirmed');

  l = applyOutcome(l, outcome({ passed: false, probeSourceId: 'article-3' }));
  assert.equal(statusOf(l, READING), 'needs-probe');
});

test('đã công nhận rồi mà làm sai một câu thường cũng gỡ lại', () => {
  let l = applyOutcome(record(emptyLedger(), obs()), outcome());
  l = record(l, obs({ answerCorrect: false, pointer: P(9) }));
  assert.equal(statusOf(l, READING), 'needs-probe');
});

test('đã công nhận rồi mà làm đúng thêm thì vẫn giữ công nhận', () => {
  let l = applyOutcome(record(emptyLedger(), obs()), outcome());
  l = record(l, obs({ sourceId: 'article-9' }));
  assert.equal(statusOf(l, READING), 'confirmed');
});

test('đếm số lần đạt chuyển giao', () => {
  let l = applyOutcome(record(emptyLedger(), obs()), outcome({ probeSourceId: 'b' }));
  l = applyOutcome(l, outcome({ probeSourceId: 'c' }));
  assert.equal(l['reading:locate']?.transfers, 2);
});

// ------------------------------------------------------------ nhiều kỹ năng

test('các kỹ năng độc lập với nhau, kể cả khác mảng', () => {
  let l = record(emptyLedger(), obs());
  l = record(l, obs({ skill: MATH, sourceId: 'item-1', answerCorrect: false, pointer: P(1), truth: P(0) }));

  assert.equal(statusOf(l, READING), 'probing');
  assert.equal(statusOf(l, MATH), 'needs-probe');
});

test('liệt kê được kỹ năng cần làm rõ và kỹ năng đã công nhận', () => {
  let l = record(emptyLedger(), obs({ answerCorrect: false, pointer: P(9) }));
  l = applyOutcome(record(l, obs({ skill: MATH, sourceId: 'i1' })), outcome({ skill: MATH, sourceId: 'i1', probeSourceId: 'i2' }));

  assert.deepEqual(needsWork(l).map((r) => r.skill.key), ['locate']);
  assert.deepEqual(confirmed(l).map((r) => r.skill.key), ['linear_equations_one_var']);
});

/** Lấy bản ghi và khẳng định nó có thật — `noUncheckedIndexedAccess` bật. */
function at(led: ReturnType<typeof emptyLedger>, id = 'reading:locate') {
  const r = led[id];
  assert.ok(r, `sổ không có bản ghi ${id}`);
  return r;
}

/*
  Nhóm test dưới đây khoá lại một lỗi đã có thật trong bản chạy được: lượt KHÔNG
  quan sát được ghi đè lên dấu vết của lượt đã quan sát được, và nó phá cơ chế
  trong im lặng — không có gì đỏ, không có gì hiện ra, phép thử chỉ đơn giản là
  không bao giờ chạy nữa.
*/

test('lượt không khoanh bằng chứng KHÔNG dập trạng thái đã quan sát được', () => {
  // Câu 1: đúng đáp án nhưng khoanh sai chỗ — đúng thứ cơ chế sinh ra để bắt.
  let led = record(emptyLedger(), obs({ pointer: P(5), truth: P(2) }));
  assert.equal(at(led).lastState, 'misaligned-correct');

  // Chín câu sau không khoanh gì.
  for (let i = 0; i < 9; i += 1) led = record(led, obs({ pointer: null }));

  assert.equal(
    at(led).lastState,
    'misaligned-correct',
    'trạng thái quan sát được bị lượt trống dập mất',
  );
  assert.equal(probeFor(at(led).lastState), 'evidence-reselect');
});

test('lượt không khoanh bằng chứng KHÔNG đổi nguồn dùng cho phép so chuyển giao', () => {
  let led = record(emptyLedger(), obs({ sourceId: 'bai-A', answerCorrect: false, truth: P(9) }));
  assert.equal(at(led).lastSourceId, 'bai-A');

  // Lướt một bài khác mà không khoanh gì.
  led = record(led, obs({ sourceId: 'bai-B', pointer: null }));

  assert.equal(
    at(led).lastSourceId,
    'bai-A',
    'nguồn so chuyển giao bị lượt trống dời sang bài khác — luật chuyển giao lộn ngược',
  );
});

test('lượt không khoanh bằng chứng KHÔNG xoá trạng thái cần phép thử', () => {
  let led = record(emptyLedger(), obs({ answerCorrect: false, pointer: P(1), truth: P(1) }));
  assert.equal(at(led).status, 'needs-probe');

  led = record(led, obs({ pointer: null }));
  assert.equal(at(led).status, 'needs-probe');
});

test('hai bộ đếm tách nhau: làm bao nhiêu lượt, và quan sát được bao nhiêu lượt', () => {
  let led = record(emptyLedger(), obs({ pointer: P(2), truth: P(2) }));
  for (let i = 0; i < 4; i += 1) led = record(led, obs({ pointer: null }));

  assert.equal(at(led).observations, 5, 'tổng lượt làm bài');
  assert.equal(at(led).observed, 1, 'lượt thật sự quan sát được');
});

test('sổ lưu từ bản cũ không có trường observed thì không sinh ra NaN', () => {
  const legacy = {
    'reading:locate': {
      skill: READING,
      status: 'probing' as const,
      lastState: 'aligned-correct' as const,
      lastSourceId: 'bai-A',
      observations: 3,
      transfers: 0,
      updatedAt: '2026-09-01T00:00:00.000Z',
    },
  } as unknown as Parameters<typeof record>[0];

  const led = record(legacy, obs({ pointer: P(2), truth: P(2) }));
  assert.equal(at(led).observed, 1);
});
