-- Sự kiện của ReadUp: bắt đầu bài, làm xong bài, đăng ký. Mỗi dòng kèm utm lần đầu.
--
-- ẨN DANH như page_views: không lưu IP, không lưu email, không lưu User-Agent gốc.
-- CHỈ MÁY CHỦ ĐỌC GHI: bật RLS, không có policy, thu hồi quyền mức bảng của anon/authenticated.
-- /api/event và /api/admin/events dùng service key.

create table if not exists public.app_events (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  name text not null check (name in ('start_lesson', 'complete_lesson', 'sign_up')),
  visitor text not null check (char_length(visitor) between 8 and 40),
  session text check (session is null or char_length(session) <= 40),
  path text not null check (char_length(path) <= 200),
  signed_in boolean not null default false,
  utm_source text check (utm_source is null or char_length(utm_source) <= 100),
  utm_medium text check (utm_medium is null or char_length(utm_medium) <= 100),
  utm_campaign text check (utm_campaign is null or char_length(utm_campaign) <= 100),
  utm_content text check (utm_content is null or char_length(utm_content) <= 100)
);

create index if not exists app_events_at_idx on public.app_events (at desc);
create index if not exists app_events_name_at_idx on public.app_events (name, at desc);

alter table public.app_events enable row level security;
revoke all on table public.app_events from anon, authenticated;
