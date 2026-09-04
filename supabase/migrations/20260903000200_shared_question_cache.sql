-- ============================================================================
-- Bộ đề AI sinh ra dùng CHUNG cho mọi người, không sinh lại mỗi lần một người
-- khác mở cùng bài.
--
-- BẢNG `question_sets`/`questions` ĐÃ CÓ TỪ MIGRATION KHỞI TẠO nhưng CHƯA TỪNG
-- ĐƯỢC GHI — không route nào trong app gọi `.from('question_sets')`. Sinh đề
-- vẫn hoàn toàn on-demand ở phía client, và với 12 câu mất 20-21 giây đo thật
-- trên production, mỗi lần một người khác mở CÙNG một bài là bắt họ chờ lại
-- đúng ngần ấy giây cho một kết quả gần như giống hệt lần trước.
--
-- `question_sets.user_id` vốn đã NULLABLE (không `not null` như `article_id`),
-- nên bảng này thiết kế sẵn cho cả hai vai trò: hàng có `user_id` là lịch sử
-- một người tự tạo, hàng `user_id is null` là BỘ ĐỀ DÙNG CHUNG. Chỉ thiếu một
-- cột để phân biệt CÁC BIẾN THỂ dùng chung của cùng một bài — người lọc "chỉ
-- Matching Headings" phải nhận bộ khác người không lọc gì.
-- ============================================================================

alter table question_sets
  -- Chuỗi dạng câu đã đặt hàng, ĐÃ SẮP XẾP VÀ NỐI BẰNG DẤU PHẨY — cùng khuôn
  -- với `requestedTypes` phía client (`useQuestionStore.ts`). Rỗng = không lọc
  -- gì, không phải NULL — NULL và rỗng mà lẫn lộn thì hai bộ khác nhau bị coi
  -- là trùng khoá.
  add column requested_types text not null default '';

-- MỘT bộ dùng chung cho mỗi (bài, đơn hàng dạng câu) — chặn đua ghi trùng khi
-- hai người mở cùng bài, cùng bộ lọc, cùng lúc mà cache còn trống.
create unique index question_sets_shared_cache_idx
  on question_sets (article_id, requested_types)
  where user_id is null;

-- ---------------------------------------------------------------------------
-- Ai đọc/ghi được bộ đề dùng chung
-- ---------------------------------------------------------------------------
--
-- Đọc: MỌI NGƯỜI, kể cả chưa đăng nhập — đây là nội dung sinh sẵn để phục vụ
-- bất kỳ ai mở bài, không phải dữ liệu riêng tư của ai.
--
-- Ghi: CHỈ service_role, qua route `/api/questions`. Route đó gọi AI thật rồi
-- mới ghi, nên client tự ghi được thì ai cũng nhét được câu hỏi bịa vào cache
-- dùng chung.
alter table question_sets enable row level security;
alter table questions enable row level security;

create policy question_sets_read_shared on question_sets
  for select using (user_id is null);

create policy questions_read_of_shared_set on questions
  for select using (
    exists (
      select 1 from question_sets qs
      where qs.id = questions.question_set_id and qs.user_id is null
    )
  );

revoke insert, update, delete, truncate on question_sets from authenticated, anon;
revoke insert, update, delete, truncate on questions from authenticated, anon;
