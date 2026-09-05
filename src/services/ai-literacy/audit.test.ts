import test from 'node:test';
import assert from 'node:assert/strict';

import { auditFeedback, auditSkill, gradeAudit } from './audit';
import { buildAuditItem, FLAW_KINDS, NO_FALSE_ALARM, type AuditItem, type FlawKind } from './flaws';
import { classify } from '@/services/mastery/ledger';
import type { ProbeDraft } from '@/services/proofloop/draft-schema';

/**
 * Canh mảng "đọc kết quả của AI".
 *
 * Ràng buộc nặng nhất ở đây là ràng buộc về ĐO LƯỜNG, không phải về mã: một nửa
 * số bản phải sạch, đối chứng phải là thứ ta tự đặt vào, và người học không được
 * tự chọn mình đang luyện kỹ năng nào.
 */

const PARAGRAPHS = [
  'Coral reefs cover less than one percent of the ocean floor. They shelter roughly a quarter of all marine species.',
  'Bleaching happens when warm water drives out the microscopic algae living inside coral tissue.',
  'Some reefs recovered afterwards, but recovery required at least a decade of stable temperatures.',
];

const DRAFT: ProbeDraft = {
  kind: 'transfer',
  stem: 'What drives the algae out of coral tissue?',
  options: ['Warm water', 'Strong currents', 'Falling salinity'],
  correctOption: 0,
  evidenceText: 'Bleaching happens when warm water drives out the microscopic algae living inside coral tissue.',
  evidenceParagraphIndex: 1,
  decisivePhrase: 'warm water',
  whyEachWrong: ['currents are never mentioned', 'salinity is never mentioned'],
  insufficientEvidence: false,
};

function itemWith(planted: FlawKind | null): AuditItem {
  return { shown: DRAFT, extraNote: null, planted };
}

/* ---------- dựng bản ---------- */

test('cùng một seed thì luôn ra cùng một bản', () => {
  const a = buildAuditItem(DRAFT, PARAGRAPHS, 'luot-1');
  for (let i = 0; i < 8; i += 1) {
    assert.deepEqual(buildAuditItem(DRAFT, PARAGRAPHS, 'luot-1'), a);
  }
});

/*
  Không có bản sạch thì người học học được đúng một mẹo: cứ nói "có lỗi" là
  trúng. Lúc ấy con số đẹp lên còn năng lực thì không.
*/
test('khoảng một nửa số bản là sạch', () => {
  const seeds = Array.from({ length: 200 }, (_, i) => `luot-${i}`);
  const clean = seeds.filter((s) => buildAuditItem(DRAFT, PARAGRAPHS, s).planted === null).length;
  assert.ok(clean > 70 && clean < 130, `bản sạch chiếm ${clean}/200 — lệch quá xa một nửa`);
});

test('cả bốn họ lỗi đều được dùng tới', () => {
  const seeds = Array.from({ length: 200 }, (_, i) => `luot-${i}`);
  const seen = new Set(
    seeds.map((s) => buildAuditItem(DRAFT, PARAGRAPHS, s).planted).filter(Boolean),
  );
  assert.equal(seen.size, FLAW_KINDS.length, `mới dùng tới ${seen.size}/${FLAW_KINDS.length} họ lỗi`);
});

test('lỗi trích dẫn bịa làm câu trích KHÔNG còn nguyên văn trong bài', () => {
  const seeds = Array.from({ length: 200 }, (_, i) => `luot-${i}`);
  const item = seeds
    .map((s) => buildAuditItem(DRAFT, PARAGRAPHS, s))
    .find((x) => x.planted === 'fabricated-evidence');
  assert.ok(item, 'không dựng được ca nào để kiểm');
  assert.ok(!PARAGRAPHS.join('\n').includes(item.shown.evidenceText));
  // Vẫn phải đọc trôi: chỉ một từ bị thay, không phải đảo lộn cả câu.
  assert.ok(item.shown.evidenceText.split(/\s+/).length === DRAFT.evidenceText.split(/\s+/).length);
});

test('lỗi chỉ sai chỗ chỉ đổi chỉ số đoạn, không đổi chữ', () => {
  const seeds = Array.from({ length: 200 }, (_, i) => `luot-${i}`);
  const item = seeds
    .map((s) => buildAuditItem(DRAFT, PARAGRAPHS, s))
    .find((x) => x.planted === 'wrong-source-pointer');
  assert.ok(item);
  assert.equal(item.shown.evidenceText, DRAFT.evidenceText);
  assert.notEqual(item.shown.evidenceParagraphIndex, DRAFT.evidenceParagraphIndex);
});

test('lỗi nói quá nằm ở câu nói thêm, và nói về thứ không nhìn thấy được', () => {
  const seeds = Array.from({ length: 200 }, (_, i) => `luot-${i}`);
  const item = seeds
    .map((s) => buildAuditItem(DRAFT, PARAGRAPHS, s))
    .find((x) => x.planted === 'overclaim');
  assert.ok(item);
  assert.ok(item.extraNote);
  assert.ok(/understood|Band|guessed/i.test(item.extraNote));
});

test('bài một đoạn thì không cấy được lỗi chỉ sai chỗ, và trả về bản sạch', () => {
  const seeds = Array.from({ length: 60 }, (_, i) => `x-${i}`);
  for (const s of seeds) {
    const item = buildAuditItem(DRAFT, [PARAGRAPHS[0] as string], s);
    assert.notEqual(item.planted, 'wrong-source-pointer');
  }
});

/* ---------- chấm ---------- */

test('bản bẩn ghi vào ĐÚNG họ lỗi đã cấy, không phải họ người học đoán', () => {
  const item = itemWith('overclaim');
  const skill = auditSkill(item);
  assert.deepEqual(skill, { domain: 'ai-literacy', key: 'overclaim' });

  const obs = gradeAudit(item, { flawed: true, kind: 'fabricated-evidence' }, 'ban-1', 'T');
  assert.equal(obs.skill.key, 'overclaim', 'người học tự chọn được kỹ năng mình đang luyện');
});

test('bản sạch ghi vào kỹ năng riêng — không kêu oan cũng là năng lực', () => {
  assert.deepEqual(auditSkill(itemWith(null)), {
    domain: 'ai-literacy',
    key: NO_FALSE_ALARM,
  });
});

/*
  Bốn trạng thái, và trạng thái thứ hai là lý do mảng này dùng hai trục.
*/

test('bắt được lỗi và gọi đúng tên → aligned-correct', () => {
  const obs = gradeAudit(itemWith('overclaim'), { flawed: true, kind: 'overclaim' }, 'ban-1', 'T');
  assert.equal(classify(obs), 'aligned-correct');
});

test('thấy có vấn đề nhưng gọi sai tên → misaligned-correct', () => {
  const obs = gradeAudit(
    itemWith('overclaim'),
    { flawed: true, kind: 'self-contradiction' },
    'ban-1',
    'T',
  );
  assert.equal(
    classify(obs),
    'misaligned-correct',
    'ngờ ngợ và đọc ra là hai việc khác nhau, thang gộp lại thì chấm họ ngang nhau',
  );
});

/*
  Bỏ lọt thì CẢ HAI trục đều trượt: không phát hiện ra, và cũng không chỉ vào đâu.
  Trạng thái này kéo theo phép thử `locate` — đưa lại đúng bản ấy và hỏi "chỗ nào
  không ổn", tức là bỏ hẳn bước phát hiện đi để đo riêng bước chỉ chỗ. Đúng việc
  cần làm với người vừa đọc lướt qua một lỗi.
*/
test('bỏ lọt lỗi → misaligned-wrong', () => {
  const obs = gradeAudit(itemWith('overclaim'), { flawed: false, kind: null }, 'ban-1', 'T');
  assert.equal(classify(obs), 'misaligned-wrong');
});

/*
  Kẽ hở đã suýt lọt: nếu "thấy có lỗi mà không gọi tên" dùng chung nhãn với "bản
  này sạch", thì trên một bản SẠCH hai người trái ngược nhau sẽ ra cùng một
  trạng thái, và một lượt báo động giả được ghi thành một lượt chỉ chuẩn.
*/
test('báo động giả mà không gọi tên lỗi vẫn là báo động giả', () => {
  const obs = gradeAudit(itemWith(null), { flawed: true, kind: null }, 'ban-1', 'T');
  assert.equal(classify(obs), 'misaligned-wrong');
  assert.notEqual(classify(obs), 'aligned-wrong');
});

test('trên bản bẩn, thấy có lỗi mà không gọi tên vẫn là ngờ ngợ chứ chưa đọc ra', () => {
  const obs = gradeAudit(itemWith('overclaim'), { flawed: true, kind: null }, 'ban-1', 'T');
  assert.equal(classify(obs), 'misaligned-correct');
});

test('báo động giả trên bản sạch → misaligned-wrong', () => {
  const obs = gradeAudit(itemWith(null), { flawed: true, kind: 'overclaim' }, 'ban-1', 'T');
  assert.equal(classify(obs), 'misaligned-wrong');
});

/*
  Lượt soi bản sạch mà trả lời đúng KHÔNG được biến mất khỏi sổ. Để `pointer` là
  `null` thì bộ phân loại ghi `unobserved`, và cả một nửa số lượt sẽ không đếm.
*/
test('nói đúng là bản sạch vẫn được ghi nhận, không rơi vào unobserved', () => {
  const obs = gradeAudit(itemWith(null), { flawed: false, kind: null }, 'ban-1', 'T');
  assert.equal(classify(obs), 'aligned-correct');
});

/* ---------- lời nói lại ---------- */

const JUDGEMENT_WORDS = ['đoán bừa', 'lười', 'kém', 'không hiểu', 'chưa hiểu', 'ẩu'];

test('không câu nào phán đoán thứ nằm trong đầu người học', () => {
  const cases: [AuditItem, Parameters<typeof auditFeedback>[1]][] = [
    [itemWith(null), { flawed: false, kind: null }],
    [itemWith(null), { flawed: true, kind: 'overclaim' }],
    [itemWith('overclaim'), { flawed: false, kind: null }],
    [itemWith('overclaim'), { flawed: true, kind: 'overclaim' }],
    [itemWith('overclaim'), { flawed: true, kind: 'fabricated-evidence' }],
  ];
  for (const [item, answer] of cases) {
    const text = auditFeedback(item, answer).toLowerCase();
    for (const word of JUDGEMENT_WORDS) {
      assert.ok(!text.includes(word), `lời nói lại dùng chữ phán đoán "${word}": ${text}`);
    }
  }
});

test('mỗi trạng thái có một lời nói lại riêng, không dùng chung', () => {
  const texts = new Set([
    auditFeedback(itemWith(null), { flawed: false, kind: null }),
    auditFeedback(itemWith(null), { flawed: true, kind: 'overclaim' }),
    auditFeedback(itemWith('overclaim'), { flawed: false, kind: null }),
    auditFeedback(itemWith('overclaim'), { flawed: true, kind: 'overclaim' }),
    auditFeedback(itemWith('overclaim'), { flawed: true, kind: 'fabricated-evidence' }),
  ]);
  assert.equal(texts.size, 5);
});
