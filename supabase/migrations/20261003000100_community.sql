-- Khu cộng đồng học tập: hỏi đáp, bạn bè và nhắn tin.
-- Tất cả bảng chỉ được đọc/ghi qua API máy chủ xác thực phiên người dùng.

create table if not exists public.community_friendships (
  user_low_id uuid not null references auth.users (id) on delete cascade,
  user_high_id uuid not null references auth.users (id) on delete cascade,
  requested_by uuid not null references auth.users (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  accepted_at timestamptz,
  primary key (user_low_id, user_high_id),
  check (user_low_id < user_high_id),
  check (requested_by = user_low_id or requested_by = user_high_id)
);
create index if not exists community_friendships_inbox_idx
  on public.community_friendships (user_high_id, status, created_at desc);
create index if not exists community_friendships_member_idx
  on public.community_friendships (user_low_id, status, created_at desc);

create table if not exists public.community_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('question', 'share')),
  category text not null check (category in ('vocabulary', 'grammar', 'speaking', 'writing', 'reading', 'general')),
  title text not null check (char_length(btrim(title)) between 1 and 160),
  body text not null check (char_length(btrim(body)) between 1 and 3000),
  hidden boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists community_posts_feed_idx
  on public.community_posts (created_at desc) where hidden = false;
create index if not exists community_posts_author_idx
  on public.community_posts (author_id, created_at desc);

create table if not exists public.community_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts (id) on delete cascade,
  author_id uuid not null references auth.users (id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 1500),
  created_at timestamptz not null default now()
);
create index if not exists community_comments_post_idx
  on public.community_comments (post_id, created_at desc);

create table if not exists public.community_messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users (id) on delete cascade,
  recipient_id uuid not null references auth.users (id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 1500),
  created_at timestamptz not null default now(),
  read_at timestamptz,
  check (sender_id <> recipient_id)
);
create index if not exists community_messages_sender_idx
  on public.community_messages (sender_id, created_at desc);
create index if not exists community_messages_recipient_idx
  on public.community_messages (recipient_id, created_at desc);

create table if not exists public.community_blocks (
  blocker_id uuid not null references auth.users (id) on delete cascade,
  blocked_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

create table if not exists public.community_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users (id) on delete cascade,
  target_kind text not null check (target_kind in ('post', 'comment', 'message', 'user')),
  target_id uuid not null,
  reason text not null check (char_length(btrim(reason)) between 1 and 500),
  created_at timestamptz not null default now(),
  unique (reporter_id, target_kind, target_id)
);
create index if not exists community_reports_queue_idx
  on public.community_reports (created_at asc);

alter table public.community_friendships enable row level security;
alter table public.community_posts enable row level security;
alter table public.community_comments enable row level security;
alter table public.community_messages enable row level security;
alter table public.community_blocks enable row level security;
alter table public.community_reports enable row level security;

revoke all on table public.community_friendships from anon, authenticated;
revoke all on table public.community_posts from anon, authenticated;
revoke all on table public.community_comments from anon, authenticated;
revoke all on table public.community_messages from anon, authenticated;
revoke all on table public.community_blocks from anon, authenticated;
revoke all on table public.community_reports from anon, authenticated;
