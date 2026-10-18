-- Yêu cầu tính năng: người học gửi ý tưởng, người khác bấm "Tôi cũng muốn".
-- Chỉ đọc/ghi qua API máy chủ (app/api/feature-requests+api.ts), không mở quyền trực tiếp cho client.

create table if not exists public.feature_requests (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users (id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 3 and 120),
  body text not null default '' check (char_length(body) <= 1500),
  status text not null default 'new' check (status in ('new', 'reviewing', 'planned', 'doing', 'done')),
  hidden boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists feature_requests_feed_idx
  on public.feature_requests (created_at desc) where hidden = false;
create index if not exists feature_requests_author_idx
  on public.feature_requests (author_id, created_at desc);

create table if not exists public.feature_votes (
  request_id uuid not null references public.feature_requests (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (request_id, user_id)
);
create index if not exists feature_votes_user_idx on public.feature_votes (user_id);

alter table public.feature_requests enable row level security;
alter table public.feature_votes enable row level security;
