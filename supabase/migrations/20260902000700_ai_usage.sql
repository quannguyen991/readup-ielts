-- ============================================================================
-- Đếm lượt gọi AI Ở MÁY CHỦ.
--
-- Trước migration này, hạn mức "30 lượt AI mỗi tháng" chỉ tồn tại trong
-- `useBillingStore` — tức là trong bộ nhớ trình duyệt của chính người dùng. Ai
-- mở DevTools sửa một con số là gọi được không giới hạn, và mỗi lượt gọi là
-- tiền thật ra khỏi túi. Chấp nhận được khi chưa bán gói; giờ đã bán thì không.
--
-- Bộ đếm ở client VẪN GIỮ, và vẫn có ích: nó hiện "còn 12 lượt" mà không cần
-- gọi mạng. Nó chỉ thôi làm hàng rào — hàng rào nằm ở đây.
-- ============================================================================

create table ai_usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  -- 'YYYY-MM' theo giờ Việt Nam. Trùng cách tính của `periodKey('month')` ở
  -- client, để hai bên cùng nói về một tháng.
  period_key text not null,
  calls integer not null default 0 check (calls >= 0),
  updated_at timestamptz not null default now(),

  primary key (user_id, period_key)
);

alter table ai_usage enable row level security;

-- Người dùng ĐỌC được số lượt của mình để giao diện hiện đúng khi đổi máy.
create policy ai_usage_read_own on ai_usage for select using (auth.uid() = user_id);
create policy ai_usage_read_all_for_admin on ai_usage for select using (public.is_admin());

-- Không policy ghi cho `authenticated`, và thu hồi luôn quyền: bộ đếm mà đối
-- tượng bị đếm sửa được thì không còn là bộ đếm.
revoke insert, update, delete, truncate on ai_usage from authenticated, anon;

-- ---------------------------------------------------------------------------
-- Tăng bộ đếm và trả về số mới, TRONG MỘT LỆNH
-- ---------------------------------------------------------------------------
--
-- Đọc rồi ghi bằng hai lời gọi riêng là một cuộc đua: hai tab bấm cùng lúc thì
-- cả hai cùng đọc được 29, cả hai cùng ghi 30, và người dùng gọi được 31 lượt.
-- `insert … on conflict do update` là một câu lệnh nguyên tử, nên không có khe
-- nào để chen vào.
--
-- Hàm KHÔNG tự kiểm hạn mức: trần phụ thuộc vào gói, mà gói thì đọc ở tầng
-- ứng dụng. Ở đây chỉ đếm cho đúng.
create or replace function public.bump_ai_usage(p_user uuid, p_period text)
returns integer
language sql
security definer
set search_path = public
as $$
  insert into ai_usage (user_id, period_key, calls, updated_at)
  values (p_user, p_period, 1, now())
  on conflict (user_id, period_key)
  do update set calls = ai_usage.calls + 1, updated_at = now()
  returning calls;
$$;

-- Chỉ service_role gọi được — hàm này chạy trong route máy chủ, không phải từ
-- trình duyệt. Cho `authenticated` gọi nghĩa là cho họ tự cộng bộ đếm của mình,
-- và cộng thì cũng có nghĩa là biết cách không cộng.
revoke execute on function public.bump_ai_usage(uuid, text) from public, authenticated, anon;
