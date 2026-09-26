-- Lượt truy cập web của ReadUp — bộ đếm riêng hiện trong trang quản trị.
--
-- ẨN DANH: không lưu IP, không lưu chuỗi User-Agent đầy đủ, không lưu email.
--   visitor  = mã ngẫu nhiên do trình duyệt tự sinh, cất ở localStorage của người xem
--   session  = mã ngẫu nhiên của một lần mở tab (sessionStorage)
--   device / os / browser = nhóm thô máy chủ suy ra từ User-Agent rồi bỏ chuỗi gốc
--   referrer = chỉ TÊN MIỀN nơi người xem bấm vào (facebook.com, zalo.me…)
--   country  = mã nước từ header của Vercel, không phải IP
--
-- CHỈ MÁY CHỦ ĐỌC GHI: bật RLS và không có policy nào, lại thu hồi quyền mức
-- BẢNG của anon/authenticated (thu hồi theo cột không trừ được quyền mức bảng).
-- /api/track và /api/admin/traffic dùng service key.

create table if not exists public.page_views (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  visitor text not null check (char_length(visitor) between 8 and 40),
  session text check (session is null or char_length(session) <= 40),
  path text not null check (char_length(path) <= 200),
  device text not null check (device in ('mobile', 'tablet', 'desktop')),
  os text check (os is null or char_length(os) <= 24),
  browser text check (browser is null or char_length(browser) <= 24),
  referrer text check (referrer is null or char_length(referrer) <= 80),
  country text check (country is null or char_length(country) <= 2),
  signed_in boolean not null default false
);

create index if not exists page_views_at_idx on public.page_views (at desc);
create index if not exists page_views_visitor_idx on public.page_views (visitor, at desc);

alter table public.page_views enable row level security;
revoke all on table public.page_views from anon, authenticated;
