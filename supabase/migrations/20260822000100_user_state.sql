-- ============================================================================
-- Tài khoản & đồng bộ dữ liệu học.
--
-- Hai việc:
--   1. Vá `handle_new_user` để chịu được người đăng ký bằng SỐ ĐIỆN THOẠI hoặc
--      bằng Google/Facebook — bản cũ chỉ đúng với đăng ký bằng email.
--   2. Thêm bảng `user_state`: kho khoá-giá trị cho dữ liệu học của từng người.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Tên hiển thị khi đăng ký bằng bất cứ cách nào
-- ---------------------------------------------------------------------------
--
-- Bản cũ dựng tên bằng `split_part(new.email, '@', 1)`. Đăng ký bằng số điện
-- thoại thì `email` là NULL, `split_part` trả chuỗi rỗng, và hồ sơ ra đời với
-- tên trống — người dùng thấy một khoảng trắng ở chỗ đáng lẽ là tên mình.
--
-- Thứ tự ưu tiên dưới đây đi từ nguồn ĐÁNG TIN NHẤT xuống: tên thật do Google/
-- Facebook trả về, rồi tới phần trước @ của email, rồi tới số điện thoại. Hết
-- cả ba thì để NULL và để màn hình tự hỏi, chứ không bịa ra "User 4f2a".
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  resolved_name text;
begin
  resolved_name := coalesce(
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'name', ''),
    nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
    nullif(new.phone, '')
  );

  insert into public.profiles (id, display_name)
  values (new.id, resolved_name)
  on conflict (id) do nothing;

  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 2. user_state — dữ liệu học của từng người, tách theo store
-- ---------------------------------------------------------------------------
--
-- VÌ SAO LÀ JSONB CHỨ KHÔNG PHẢI CÁC BẢNG QUAN HỆ đã có sẵn:
--
-- App chạy LOCAL-FIRST. Mọi store zustand là nguồn sự thật lúc đang học, và
-- việc cần làm ở đây chỉ là "dữ liệu không mất khi đổi máy". Một bảng khoá-giá
-- trị giải quyết trọn vẹn việc đó cho MỌI store cùng lúc; viết pipeline đọc/ghi
-- riêng cho từng bảng quan hệ là hàng chục chỗ có thể lệch với kiểu dữ liệu
-- phía client, mà mỗi chỗ lệch đều âm thầm.
--
-- Các bảng quan hệ (`math_sessions`, `vocab_entries`…) vẫn còn nguyên và vẫn
-- đúng. Chúng dành cho thứ JSONB không làm được: truy vấn phía máy chủ, thống
-- kê nhiều người, bảng xếp hạng. Khi cần thì đẩy song song, không phải bỏ bảng này.
--
-- ĐÁNH ĐỔI ĐÃ BIẾT: máy chủ không truy vấn được vào trong payload, và việc gộp
-- diễn ra ở client. Với khối lượng của một người học thì payload cỡ vài trăm KB.
create table user_state (
  user_id uuid not null references auth.users (id) on delete cascade,
  -- 'math' | 'study' | 'vocab' | … — khớp `SyncedStore.key` phía client.
  store_key text not null,
  payload jsonb not null,
  updated_at timestamptz not null default now(),

  primary key (user_id, store_key),

  -- Chặn payload phình vô hạn do lỗi vòng lặp phía client. 4 MB là gấp nhiều
  -- lần dữ liệu thật của một người học, nhưng vẫn đủ nhỏ để một bản ghi hỏng
  -- không kéo sập cả hàng.
  constraint user_state_payload_size check (pg_column_size(payload) < 4 * 1024 * 1024)
);

create index user_state_user_idx on user_state (user_id);

alter table user_state enable row level security;

-- Một policy cho cả bốn thao tác: chỉ chính chủ. `with check` bắt buộc phải có,
-- nếu không thì người dùng ghi được bản ghi mang user_id của người khác — RLS
-- chỉ lọc lúc ĐỌC nếu thiếu vế này.
create policy user_state_own on user_state
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create trigger user_state_updated_at
before update on user_state
for each row execute function set_updated_at();
