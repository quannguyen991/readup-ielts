import { getSupabaseAdmin } from '@/lib/supabase-admin';
import type { GeneratedQuestion, QuestionSet } from './types';
import type { QuestionType } from '@/types/database';

/**
 * SERVER-ONLY. Bộ đề AI sinh ra dùng CHUNG cho mọi người mở cùng một bài.
 *
 * VÌ SAO CẦN: sinh 12 câu mất 20-21 giây đo thật trên production. Không có
 * cache thì NGƯỜI THỨ HAI mở cùng bài đọc phải chờ lại đúng ngần ấy giây cho
 * một kết quả gần như giống hệt người đầu tiên — lãng phí thời gian của họ và
 * tiền gọi AI của app.
 *
 * Bảng `question_sets`/`questions` đã có sẵn từ migration khởi tạo (thiết kế
 * cho việc lưu LỊCH SỬ một người tự tạo, `user_id` có giá trị) nhưng CHƯA TỪNG
 * được ghi. Ở đây dùng lại đúng bảng đó cho một vai trò khác: `user_id IS NULL`
 * nghĩa là "bộ dùng chung", phân biệt theo bài + đơn hàng dạng câu qua cột
 * `requested_types` mới thêm (migration `20260903000200_shared_question_cache.sql`).
 *
 * CHỈ CACHE BỘ SINH BẰNG AI, KHÔNG CACHE BỘ OFFLINE. Bộ offline là đường lùi
 * khi gọi AI hỏng, chỉ làm được Multiple Choice — cache nó như một bộ "chính
 * thức" sẽ ghim mọi người mở bài này SAU vào bộ đề yếu vĩnh viễn, đúng lỗi đã
 * gặp và sửa ở `useQuestionStore.ts` (cache CLIENT) hồi 03/09/2026. Nguyên tắc
 * giống hệt, chỉ khác tầng: lần này là cache CHUNG trên server.
 *
 * CŨNG KHÔNG CACHE BỘ AI QUÁ MỎNG (phát hiện 03/09/2026 lúc chạy soạn sẵn đề
 * hàng loạt). Đích là 12 câu/bài, chia làm 3 lô song song 4 câu — proxy AI
 * thất thường thì một lô có thể hỏng, trả về chỉ 4-5 câu thay vì đủ. Trước đây
 * `writeSharedQuestionSet` ghi bất cứ gì miễn `generatedBy === 'ai'`, nên một
 * lần trả mỏng do proxy nghẽn sẽ bị ĐÓNG BĂNG VĨNH VIỄN trong cache — mọi
 * người mở bài đó SAU, kể cả script tự thử lại, đều chỉ đọc lại đúng bộ mỏng
 * ấy chứ không có cơ hội sinh lại. Ngưỡng `MIN_CACHEABLE_QUESTIONS` chặn đúng
 * trường hợp đó: sinh mỏng thì vẫn trả cho người đang chờ (không biến câu trả
 * lời thành lỗi), nhưng KHÔNG ghi vào cache — để người/script mở sau còn cơ
 * hội gặp một lượt gọi AI khác, đủ câu hơn.
 */

/** Dưới ngần này câu thì không đáng ghim vào cache dùng chung — xem lý do ở trên. */
export const MIN_CACHEABLE_QUESTIONS = 6;

/** Khoá đơn hàng dạng câu — CÙNG khuôn với `requestedTypes` phía client. */
export function questionCacheKey(options: { types?: QuestionType[]; focusType?: QuestionType }): string {
  if (options.focusType) return options.focusType;
  return options.types?.length ? [...options.types].sort().join(',') : '';
}

export async function readSharedQuestionSet(
  articleId: string,
  requestedTypes: string,
): Promise<QuestionSet | null> {
  const admin = getSupabaseAdmin();

  const { data: set } = await admin
    .from('question_sets')
    .select('id, article_id, title, generated_by, model, created_at')
    .eq('article_id', articleId)
    .eq('requested_types', requestedTypes)
    .is('user_id', null)
    .maybeSingle();
  if (!set) return null;

  const { data: rows } = await admin
    .from('questions')
    .select('id, order_index, type, prompt, instruction, options, correct_answer, evidence_text, evidence_paragraph_index, explanation, lesson_tip')
    .eq('question_set_id', set.id)
    .order('order_index', { ascending: true });

  // Hàng question_sets có mà rỗng câu hỏi là dữ liệu hỏng (ghi dở dang lúc
  // trước) — coi như CACHE MISS để sinh lại, không trả về một bộ đề rỗng.
  if (!rows || rows.length === 0) return null;

  const questions: GeneratedQuestion[] = rows.map((q) => ({
    id: q.id,
    orderIndex: q.order_index,
    type: q.type,
    prompt: q.prompt,
    instruction: q.instruction,
    options: (q.options as string[] | null) ?? null,
    correctAnswer: q.correct_answer,
    evidenceText: q.evidence_text,
    evidenceParagraphIndex: q.evidence_paragraph_index,
    explanation: q.explanation,
    lessonTip: q.lesson_tip,
  }));

  return {
    articleId: set.article_id,
    title: set.title ?? '',
    generatedBy: 'ai',
    model: set.model,
    createdAt: set.created_at,
    requestedTypes,
    questions,
  };
}

/**
 * Ghi một bộ đề vào cache dùng chung. KHÔNG NÉM LỖI — cache là tối ưu, không
 * phải đường đi bắt buộc. Người dùng đang chờ câu trả lời của HỌ; ghi cache
 * hỏng (kể cả đua ghi trùng khoá — mã lỗi 23505) không nên biến câu trả lời đã
 * sinh xong thành một trang lỗi.
 */
export async function writeSharedQuestionSet(
  articleId: string,
  requestedTypes: string,
  set: QuestionSet,
): Promise<void> {
  if (set.generatedBy !== 'ai' || set.questions.length < MIN_CACHEABLE_QUESTIONS) return;

  try {
    const admin = getSupabaseAdmin();
    const { data: row, error } = await admin
      .from('question_sets')
      .insert({
        article_id: articleId,
        user_id: null,
        requested_types: requestedTypes,
        title: set.title,
        total_questions: set.questions.length,
        generated_by: set.generatedBy,
        model: set.model,
      })
      .select('id')
      .single();

    if (error || !row) return;

    await admin.from('questions').insert(
      set.questions.map((q) => ({
        question_set_id: row.id,
        order_index: q.orderIndex,
        type: q.type,
        prompt: q.prompt,
        instruction: q.instruction,
        options: q.options,
        correct_answer: q.correctAnswer,
        evidence_text: q.evidenceText,
        evidence_paragraph_index: q.evidenceParagraphIndex,
        explanation: q.explanation,
        lesson_tip: q.lessonTip,
      })),
    );
  } catch {
    // Mất mạng, Supabase tạm chậm — bỏ qua, lần mở bài sau sinh lại là xong.
  }
}
