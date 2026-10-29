-- Phân loại góp ý: 'feature' = tính năng mới, 'improvement' = cải thiện / báo lỗi tính năng đang có.
-- Chạy sau 20261018000100_feature_requests.sql.

alter table public.feature_requests
  add column if not exists kind text not null default 'feature'
  check (kind in ('feature', 'improvement'));

create index if not exists feature_requests_kind_idx
  on public.feature_requests (kind, created_at desc) where hidden = false;
