import assert from 'node:assert/strict';
import { test } from 'node:test';

import { SAT_VERBAL_VOCAB_LESSONS } from '@/data/lessons/vocab-lessons';
import { buildChapterPractice, chapterPracticeReady, SAT_PRACTICE_MAX, SAT_STEM_COMPLETE } from '@/services/vocab/sat-quiz';
import { seededRng } from '@/services/vocab/topic-study';

test('mỗi chủ điểm SAT Verbal dựng được đề 20–40 câu đúng dạng', () => {
  let ready = 0;
  for (const lesson of SAT_VERBAL_VOCAB_LESSONS) {
    const items = buildChapterPractice(lesson, seededRng(7));
    if (!chapterPracticeReady(lesson)) continue;
    ready += 1;
    assert.ok(items.length >= 20 && items.length <= SAT_PRACTICE_MAX, `${lesson.slug}: ${items.length} câu`);
    for (const it of items) {
      assert.equal(it.options.length, 4, `${it.id}: cần 4 phương án`);
      assert.equal(new Set(it.options.map((o) => o.toLowerCase())).size, 4, `${it.id}: phương án trùng`);
      assert.ok(it.answerIndex >= 0 && it.answerIndex < 4);
      if (it.kind === 'cloze') {
        assert.equal(it.prompt, SAT_STEM_COMPLETE);
        assert.ok(it.context?.includes('______'));
        assert.equal(it.options[it.answerIndex], it.word.word);
      } else {
        assert.ok(it.context?.toLowerCase().includes(it.word.word.toLowerCase()), `${it.id}: câu không chứa từ`);
        assert.equal(it.options[it.answerIndex], it.word.synonyms?.[0]);
      }
    }
  }
  // Phải có đa số chủ điểm đủ câu; các chủ điểm còn lại cần thêm câu ví dụ thật.
  assert.ok(ready >= 50, `chỉ ${ready} chủ điểm đủ câu`);
});
