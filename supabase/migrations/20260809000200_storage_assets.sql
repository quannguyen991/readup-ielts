-- ============================================================================
-- Bước 2 — Storage cho icon / thumbnail / illustration sinh bằng OpenAI API
-- Bucket công khai: ảnh chỉ là tài nguyên giao diện, không chứa dữ liệu cá nhân.
-- Ghi vào bucket chỉ qua service key (script + API route server-side).
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'assets',
  'assets',
  true,
  10485760, -- 10 MB
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- Ai cũng đọc được (kể cả chưa đăng nhập) để ảnh hiện ngay khi mở app.
drop policy if exists "assets_public_read" on storage.objects;
create policy "assets_public_read" on storage.objects
  for select
  using (bucket_id = 'assets');

-- Không có policy insert/update/delete cho anon và authenticated:
-- service role bỏ qua RLS nên chỉ script/API route server-side ghi được.

-- Bảng generated_assets: cho phép đọc kể cả khi chưa đăng nhập, để icon và
-- illustration hiện ngay ở màn hình đăng nhập / lần mở app đầu tiên.
drop policy if exists generated_assets_read on generated_assets;
create policy generated_assets_read on generated_assets
  for select to anon, authenticated using (true);
