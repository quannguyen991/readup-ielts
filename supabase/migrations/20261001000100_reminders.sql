-- Nhắc học qua thông báo đẩy (web push) và email — 01/10/2026.
--
-- reminder_prefs     = người học bật kênh nào, nhận bằng thứ tiếng nào, và
--                      ngày (giờ Việt Nam) đã gửi lời nhắc gần nhất — cron
--                      20:00 mỗi ngày dựa vào cột này để không gửi hai lần.
-- push_subscriptions = mỗi trình duyệt / máy đã cho phép thông báo một dòng
--                      (endpoint của dịch vụ đẩy + hai khoá mã hoá). Máy chủ đẩy
--                      trả 404/410 thì API tự xoá dòng đó.
--
-- Xoá tài khoản là dọn sạch theo (on delete cascade).
--
-- CHỈ MÁY CHỦ ĐỌC GHI: bật RLS và không có policy nào, lại thu hồi quyền mức
-- BẢNG của anon/authenticated (thu hồi theo cột không trừ được quyền mức bảng).
-- /api/reminders/* và /api/cron/reminders dùng service key, danh tính lấy từ
-- access token.

create table if not exists public.reminder_prefs (
  user_id uuid primary key references auth.users (id) on delete cascade,
  push_enabled boolean not null default false,
  email_enabled boolean not null default false,
  locale text not null default 'vi' check (locale in ('vi', 'en')),
  last_sent_on date,
  updated_at timestamptz not null default now()
);

create index if not exists reminder_prefs_enabled_idx
  on public.reminder_prefs (user_id)
  where push_enabled or email_enabled;

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  endpoint text not null unique check (char_length(endpoint) <= 1000),
  p256dh text not null check (char_length(p256dh) <= 200),
  auth text not null check (char_length(auth) <= 100),
  user_agent text check (user_agent is null or char_length(user_agent) <= 300),
  created_at timestamptz not null default now()
);

create index if not exists push_subscriptions_user_idx on public.push_subscriptions (user_id);

alter table public.reminder_prefs enable row level security;
alter table public.push_subscriptions enable row level security;
revoke all on table public.reminder_prefs from anon, authenticated;
revoke all on table public.push_subscriptions from anon, authenticated;
