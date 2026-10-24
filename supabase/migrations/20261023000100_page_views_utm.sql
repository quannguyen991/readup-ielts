-- Cột UTM cho bảng page_views.
--
-- /api/track ghi utm_source/medium/campaign/content từ commit e0f476da (22/10/2026),
-- nhưng không migration nào tạo các cột này. PostgREST từ chối mọi lượt xem
-- (PGRST204), và /api/track nuốt lỗi rồi trả 204 — nên bảng ngừng nhận dữ liệu
-- từ khoảng 15:46 ngày 22/10 (giờ VN) và trang quản trị hiện 0 hôm nay.
--
-- Chỉ thêm cột nullable, không đụng dữ liệu cũ.

alter table public.page_views
  add column if not exists utm_source text check (utm_source is null or char_length(utm_source) <= 100),
  add column if not exists utm_medium text check (utm_medium is null or char_length(utm_medium) <= 100),
  add column if not exists utm_campaign text check (utm_campaign is null or char_length(utm_campaign) <= 100),
  add column if not exists utm_content text check (utm_content is null or char_length(utm_content) <= 100);
