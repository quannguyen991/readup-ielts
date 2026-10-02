import test from 'node:test';
import assert from 'node:assert/strict';

import { DECLARED_QUESTION_TYPES, isLedgerScored, readingSkillFor } from './reading-skill';
import type { QuestionType } from '@/types/database';

/**
 * Danh sách này chép tay từ `QuestionType` một cách CỐ Ý.
 *
 * Nếu ai đó thêm một dạng câu hỏi mới mà quên khai kỹ năng, test cuối file sẽ
 * đỏ. Sinh danh sách này ra từ chính bảng ánh xạ thì test luôn xanh và không
 * chặn được gì — nó sẽ chỉ khẳng định bảng bằng chính nó.
 */
const ALL_TYPES: QuestionType[] = [
  'true_false_not_given',
  'yes_no_not_given',
  'matching_headings',
  'matching_information',
  'matching_features',
  'matching_sentence_endings',
  'multiple_choice',
  'sentence_completion',
  'summary_completion',
  'short_answer',
  'multiple_choice_multi',
  'note_completion',
  'table_completion',
  'flow_chart_completion',
  'diagram_label_completion',
  'sat_words_in_context',
  'sat_central_idea',
  'sat_command_of_evidence',
  'sat_inference',
  'sat_text_structure',
  'sat_transitions',
  'sat_rhetorical_synthesis',
  'sat_boundaries',
  'sat_form_structure_sense',
];

test('dạng nào cũng có phán quyết, không dạng nào rơi ra ngoài', () => {
  for (const type of ALL_TYPES) {
    const skill = readingSkillFor(type);
    assert.ok(
      skill === null || ['locate', 'paraphrase', 'entailment', 'quantifier'].includes(skill),
      `dạng ${type} trả về giá trị lạ: ${String(skill)}`,
    );
  }
});

test('hai dạng ngữ pháp thuần KHÔNG vào sổ', () => {
  assert.equal(readingSkillFor('sat_boundaries'), null);
  assert.equal(readingSkillFor('sat_form_structure_sense'), null);
  assert.equal(isLedgerScored('sat_boundaries'), false);
  assert.equal(isLedgerScored('sat_form_structure_sense'), false);
});

test('mọi dạng đọc hiểu còn lại đều vào sổ', () => {
  const grammarOnly = new Set<QuestionType>(['sat_boundaries', 'sat_form_structure_sense']);
  for (const type of ALL_TYPES) {
    if (grammarOnly.has(type)) continue;
    assert.equal(isLedgerScored(type), true, `dạng ${type} lẽ ra phải vào sổ`);
  }
});

test('dạng hỏi quan hệ suy ra được xếp vào entailment', () => {
  assert.equal(readingSkillFor('true_false_not_given'), 'entailment');
  assert.equal(readingSkillFor('yes_no_not_given'), 'entailment');
  assert.equal(readingSkillFor('sat_inference'), 'entailment');
});

test('dạng bắt tra đúng chỗ được xếp vào locate', () => {
  assert.equal(readingSkillFor('matching_information'), 'locate');
  assert.equal(readingSkillFor('matching_features'), 'locate');
  assert.equal(readingSkillFor('short_answer'), 'locate');
  assert.equal(readingSkillFor('sat_command_of_evidence'), 'locate');
});

test('dạng bắt nhận ra ý nói lại bằng chữ khác được xếp vào paraphrase', () => {
  assert.equal(readingSkillFor('multiple_choice'), 'paraphrase');
  assert.equal(readingSkillFor('sat_words_in_context'), 'paraphrase');
  assert.equal(readingSkillFor('matching_headings'), 'paraphrase');
});

/**
 * Đây là ràng buộc về tính trung thực, không phải về kiểu dữ liệu.
 *
 * `quantifier` chỉ nhận ra được ở TỪNG CÂU, không nhìn dạng đề mà biết. Ngày nào
 * còn chưa có nhãn ở tầng sinh đề thì gán nó ở đây là bịa số: lượt của
 * `entailment` sẽ chảy sang một ô không ai kiểm chứng được.
 */
test('không dạng nào được tự phong là quantifier khi chưa có nhãn từng câu', () => {
  for (const type of ALL_TYPES) {
    assert.notEqual(
      readingSkillFor(type),
      'quantifier',
      `dạng ${type} không được gán quantifier ở tầng dạng đề`,
    );
  }
});

test('thêm dạng câu hỏi mới mà quên khai kỹ năng thì test này đỏ', () => {
  for (const type of ALL_TYPES) {
    assert.ok(
      DECLARED_QUESTION_TYPES.has(type),
      `dạng ${type} chưa được khai trong bảng ánh xạ của reading-skill.ts`,
    );
  }
});

test('bảng không khai thừa dạng nào không còn tồn tại', () => {
  const known = new Set<string>(ALL_TYPES);
  for (const declared of DECLARED_QUESTION_TYPES) {
    assert.ok(known.has(declared), `bảng còn khai dạng ${declared} nhưng QuestionType không có nữa`);
  }
});
