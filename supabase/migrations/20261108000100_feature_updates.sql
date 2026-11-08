-- Góp ý công khai: bình chọn "ủng hộ" (+1) hoặc "không cần" (-1), và bảng tin cập nhật
-- tự đăng mỗi khi trạng thái một ý tưởng đổi (Mới → Đang xem xét → … → Đã xong).
-- Chạy sau 20261029000100_feature_requests_kind.sql.

alter table public.feature_votes
  add column if not exists value smallint not null default 1
  check (value in (-1, 1));

create table if not exists public.feature_updates (
  id uuid primary key default gen_random_uuid(),
  request_id uuid references public.feature_requests (id) on delete set null,
  title text not null,
  status text not null check (status in ('new', 'reviewing', 'planned', 'doing', 'done')),
  hidden boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists feature_updates_feed_idx
  on public.feature_updates (created_at desc) where hidden = false;

alter table public.feature_updates enable row level security;

create or replace function public.feature_request_status_to_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status is distinct from old.status and not new.hidden then
    insert into public.feature_updates (request_id, title, status)
    values (new.id, new.title, new.status);
  end if;
  return new;
end;
$$;

drop trigger if exists feature_requests_status_update on public.feature_requests;
create trigger feature_requests_status_update
  after update of status on public.feature_requests
  for each row execute function public.feature_request_status_to_update();
