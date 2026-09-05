import test from 'node:test';
import assert from 'node:assert/strict';

import { checkProbeValidity, overlapRatio, type ProbeValidityInput } from './probe-validity';
import type { ProbeDraft } from './draft-schema';

/**
 * Canh tầng kiểm hiệu lực phép thử.
 *
 * Ràng buộc ở đây không phải chuyện kiểu dữ liệu — `draft-schema.ts` lo phần đó
 * rồi. Ở đây là chuyện một phép thử ĐÚNG HÌNH THỨC vẫn có thể không đo được gì,
 * và mỗi test dưới đây khoá lại đúng một kiểu vô dụng đã lường trước.
 */

const PARAGRAPHS = [
  'Coral reefs cover less than one percent of the ocean floor. They shelter roughly a quarter of all marine species.',
  'Bleaching happens when warm water drives out the algae living in coral tissue. Without the algae the coral turns white and begins to starve.',
  'Some reefs have recovered after bleaching events, but recovery takes at least a decade of stable temperatures.',
];

function draft(over: Partial<ProbeDraft> = {}): ProbeDraft {
  return {
    kind: 'transfer',
    stem: 'According to the text, what happens to coral once the algae leave?',
    /*
      Ba phương án dài xấp xỉ nhau, và đó là chủ ý của bộ mẫu.

      Bản đầu của file này để phương án đúng dài 35 ký tự cạnh hai phương án 15
      và 18 — luật `correct-option-longest` nổ ngay, và nó nổ đúng: đề như vậy
      đoán được mà không cần đọc bài. Sửa bộ mẫu chứ không nới luật.
    */
    options: [
      'It turns white and begins to starve',
      'It darkens and grows much faster',
      'It changes into a different species',
    ],
    correctOption: 0,
    evidenceText: 'Without the algae the coral turns white and begins to starve.',
    evidenceParagraphIndex: 1,
    decisivePhrase: 'turns white and begins to starve',
    whyEachWrong: ['nothing in the text says growth speeds up', 'species change is never mentioned'],
    insufficientEvidence: false,
    ...over,
  };
}

function input(over: Partial<ProbeValidityInput> = {}): ProbeValidityInput {
  return {
    draft: draft(),
    kind: 'transfer',
    paragraphs: PARAGRAPHS,
    probeSourceId: 'bai-B',
    difficultySourceId: 'bai-A',
    originalStem: 'How much of the ocean floor do coral reefs occupy?',
    originalEvidenceText: 'Coral reefs cover less than one percent of the ocean floor.',
    ...over,
  };
}

test('phép thử hợp lệ thì đi qua', () => {
  const r = checkProbeValidity(input());
  assert.equal(r.ok, true);
});

/*
  Luật nặng nhất. Sổ chỉ công nhận khi làm được trên NGUỒN KHÁC, nhưng lời dặn
  gửi cho model lại bảo dựng câu mới trong CÙNG bài. Hai câu đó chống nhau, và
  bên thua là cơ chế — nên chỗ mâu thuẫn phải nổ ra thành lỗi, không được im.
*/
test('chuyển giao mà vẫn nằm trên bài cũ thì bị chặn', () => {
  const r = checkProbeValidity(input({ probeSourceId: 'bai-A', difficultySourceId: 'bai-A' }));
  assert.equal(r.ok, false);
  assert.equal(r.ok === false && r.reason, 'transfer-same-source');
});

test('các loại phép thử khác KHÔNG bị đòi đổi nguồn', () => {
  // `evidence-reselect` cố ý hỏi lại trên chính bài cũ: nó đo việc chỉ chỗ, và
  // đổi bài thì không còn chỗ cũ để chỉ lại nữa.
  const r = checkProbeValidity(
    input({
      kind: 'evidence-reselect',
      draft: draft({ kind: 'evidence-reselect' }),
      probeSourceId: 'bai-A',
      difficultySourceId: 'bai-A',
    }),
  );
  assert.equal(r.ok, true);
});

test('chỉ số đoạn không chứa câu vừa trích thì bị chặn', () => {
  const r = checkProbeValidity(input({ draft: draft({ evidenceParagraphIndex: 2 }) }));
  assert.equal(r.ok, false);
  assert.equal(r.ok === false && r.reason, 'evidence-paragraph-mismatch');
});

test('chỉ số đoạn nằm ngoài bài thì bị chặn', () => {
  const r = checkProbeValidity(input({ draft: draft({ evidenceParagraphIndex: 9 }) }));
  assert.equal(r.ok, false);
  assert.equal(r.ok === false && r.reason, 'evidence-paragraph-mismatch');
});

test('dán sẵn cụm quyết định vào đề thì bị chặn', () => {
  const r = checkProbeValidity(
    input({
      draft: draft({
        stem: 'The text says the coral turns white and begins to starve — why does that happen?',
      }),
    }),
  );
  assert.equal(r.ok, false);
  assert.equal(r.ok === false && r.reason, 'stem-leaks-decisive-phrase');
});

test('chuyển giao mà dùng lại đúng câu bằng chứng cũ thì bị chặn', () => {
  const r = checkProbeValidity(
    input({
      draft: draft({
        evidenceText: 'Coral reefs cover less than one percent of the ocean floor.',
        evidenceParagraphIndex: 0,
        decisivePhrase: 'less than one percent',
      }),
    }),
  );
  assert.equal(r.ok, false);
  assert.equal(r.ok === false && r.reason, 'transfer-reuses-original-evidence');
});

test('chuyển giao mà chỉ chép lại câu hỏi cũ thì bị chặn', () => {
  const r = checkProbeValidity(
    input({
      draft: draft({ stem: 'How much of the ocean floor do coral reefs occupy, according to the text?' }),
    }),
  );
  assert.equal(r.ok, false);
  assert.equal(r.ok === false && r.reason, 'transfer-reuses-original-stem');
});

test('hai phương án trùng nhau thì bị chặn', () => {
  const r = checkProbeValidity(
    input({
      draft: draft({
        options: ['It turns white and starts to starve', 'It grows faster', 'it grows faster'],
        whyEachWrong: ['a', 'b'],
      }),
    }),
  );
  assert.equal(r.ok, false);
  assert.equal(r.ok === false && r.reason, 'duplicate-options');
});

/*
  Ghi nhận, không chặn. Đây là dấu hiệu đề viết vụng chứ không phải đề sai, và
  chặn hết thì tỉ lệ loại vọt lên tới mức tính năng chết. Nhưng im lặng bỏ qua
  thì không bao giờ biết mình đang đẻ ra đề kiểu gì — nên nó phải đi ra ngoài
  dưới dạng một con số đếm được.
*/
test('phương án đúng dài vượt trội thì bị GHI NHẬN chứ không bị chặn', () => {
  const r = checkProbeValidity(
    input({
      draft: draft({
        options: [
          'It turns white and begins to starve because the algae that fed it are gone',
          'It grows',
          'It sinks',
        ],
        correctOption: 0,
        whyEachWrong: ['a', 'b'],
      }),
    }),
  );
  assert.equal(r.ok, true);
  assert.ok(r.warnings.includes('correct-option-longest'));
});

test('chỉ hai phương án thì bị ghi nhận', () => {
  const r = checkProbeValidity(
    input({ draft: draft({ options: ['It turns white', 'It grows faster'], whyEachWrong: ['a'] }) }),
  );
  assert.equal(r.ok, true);
  assert.ok(r.warnings.includes('only-two-options'));
});

test('phương án đúng dài hơn nhưng không vượt trội thì không ghi nhận gì', () => {
  const r = checkProbeValidity(input());
  assert.equal(r.ok, true);
  assert.deepEqual(r.warnings, []);
});

test('so trùng dùng bigram nên đảo trật tự từ không bị coi là chép', () => {
  assert.equal(overlapRatio('the cat sat on the mat', 'mat the on sat cat the'), 0);
  assert.ok(overlapRatio('the cat sat on the mat', 'the cat sat on the mat today') > 0.9);
});

test('chép nguyên câu cũ rồi nối thêm mệnh đề vẫn bị tính là chép', () => {
  const a = 'Coral reefs cover less than one percent of the ocean floor.';
  const b =
    'Coral reefs cover less than one percent of the ocean floor, and they are found in warm shallow water.';
  assert.ok(
    overlapRatio(a, b) > 0.6,
    'chia cho bên nhỏ hơn chính là để câu nối dài không lọt lưới',
  );
});
