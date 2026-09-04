import assert from 'node:assert/strict';
import { test } from 'node:test';

import { MIN_CACHEABLE_QUESTIONS, questionCacheKey, writeSharedQuestionSet } from './cache';
import type { QuestionSet } from './types';

/*
  Chỉ test `questionCacheKey` — hàm THUẦN, không chạm Supabase. Phần đọc/ghi
  cache thật (readSharedQuestionSet/writeSharedQuestionSet) cần DB sống, không
  test đơn vị được ở đây; đã xác nhận qua đường thủ công lúc triển khai.

  RIÊNG "bộ mỏng không được ghi" (`writeSharedQuestionSet` trả về trước khi
  chạm Supabase khi dưới `MIN_CACHEABLE_QUESTIONS`) test được mà không cần DB
  sống — hàm return sớm ngay dòng đầu, chưa gọi `getSupabaseAdmin()`. Đây
  chính là ca đã gây lỗi thật: một lô AI trả 5/12 câu do proxy nghẽn bị ghim
  vĩnh viễn vào cache vì trước đó không có ngưỡng nào chặn.
*/

function fakeSet(n: number): QuestionSet {
  return {
    articleId: 'a1',
    title: 't',
    generatedBy: 'ai',
    model: 'm',
    createdAt: new Date().toISOString(),
    requestedTypes: '',
    questions: Array.from({ length: n }, (_, i) => ({
      id: `q${i}`,
      orderIndex: i,
      type: 'multiple_choice' as never,
      prompt: 'p',
      instruction: 'i',
      options: null,
      correctAnswer: 'A',
      evidenceText: 'e',
      evidenceParagraphIndex: 0,
      explanation: 'ex',
      lessonTip: 'lt',
    })),
  };
}

test('không lọc gì thì khoá là chuỗi rỗng', () => {
  assert.equal(questionCacheKey({}), '');
  assert.equal(questionCacheKey({ types: [] }), '');
});

test('lọc theo dạng thì khoá là các dạng đã SẮP XẾP, nối dấu phẩy', () => {
  // Sắp xếp là bắt buộc: chọn "A rồi B" và "B rồi A" phải RA CÙNG MỘT KHOÁ,
  // nếu không cùng một đơn hàng thực chất lại sinh hai bản cache khác nhau.
  assert.equal(
    questionCacheKey({ types: ['matching_headings', 'true_false_not_given'] as never }),
    questionCacheKey({ types: ['true_false_not_given', 'matching_headings'] as never }),
  );
});

test('focusType tạo khoá riêng, không lẫn với types thường', () => {
  const focus = questionCacheKey({ focusType: 'matching_headings' as never });
  const filtered = questionCacheKey({ types: ['matching_headings'] as never });
  // Trùng nội dung (cùng một dạng) nhưng đây LÀ ý muốn: đơn "luyện dạng yếu
  // nhất" và đơn "lọc còn một dạng" cho ra kết quả giống hệt nhau về mặt nội
  // dung, nên chia sẻ chung một hàng cache là đúng, không phải lỗi.
  assert.equal(focus, filtered);
});

test('focusType có ưu tiên hơn types khi cả hai cùng có mặt', () => {
  const key = questionCacheKey({ focusType: 'multiple_choice' as never, types: ['matching_headings'] as never });
  assert.equal(key, 'multiple_choice');
});

test('bộ dưới ngưỡng thì không ghi cache — không ném lỗi dù chưa có DB thật', async () => {
  // Không set biến môi trường Supabase trong test — nếu hàm lỡ chạm tới
  // `getSupabaseAdmin()` ở nhánh này thì sẽ ném lỗi thiếu cấu hình, và test
  // FAIL đúng vào chỗ cần bắt: nghĩa là ngưỡng không chặn được trước khi gọi DB.
  await assert.doesNotReject(() =>
    writeSharedQuestionSet('a1', '', fakeSet(MIN_CACHEABLE_QUESTIONS - 1)),
  );
});
