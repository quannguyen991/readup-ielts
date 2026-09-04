-- ============================================================================
-- Bậc gói mới (Free · Plus · Pro · Max) và vai trò quản trị.
--
-- Hai việc trong một migration vì chúng dính nhau: trang admin tồn tại chính là
-- để CẤP GÓI bằng tay, khi chưa có cổng thanh toán.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Đổi bậc gói: standard → plus, vip → pro, thêm max
-- ---------------------------------------------------------------------------
--
-- KHÔNG dùng `alter type ... rename value` + `add value`. `ADD VALUE` không chạy
-- được trong cùng một transaction với câu lệnh dùng tới giá trị vừa thêm, mà
-- endpoint SQL của Supabase gói cả file vào một transaction. Đường vòng an toàn
-- là hạ về text, dựng lại type, rồi nâng ngược — tất cả trong một transaction.

-- Index có mệnh đề `where plan <> 'free'` nên phụ thuộc vào type; bỏ trước.
drop index if exists profiles_plan_expiry_idx;

alter table profiles alter column plan drop default;
alter table profiles alter column plan type text;
alter table payments alter column plan type text;

drop type plan_id;
create type plan_id as enum ('free', 'plus', 'pro', 'max');

-- Người đang ở gói cũ được chuyển sang bậc TƯƠNG ĐƯƠNG, không bị tụt:
--   standard (mở hết nội dung)      → plus  (cũng mở hết nội dung)
--   vip      (có chatbox, bài mẫu)  → pro   (cũng có chatbox, bài mẫu)
-- Không ai được đẩy lên max, vì họ chưa trả tiền cho ngân sách AI đó.
update profiles set plan = case plan
  when 'standard' then 'plus'
  when 'vip' then 'pro'
  when 'free' then 'free'
  else 'free'
end;

update payments set plan = case plan
  when 'standard' then 'plus'
  when 'vip' then 'pro'
  else 'free'
end;

alter table profiles alter column plan type plan_id using plan::plan_id;
alter table profiles alter column plan set default 'free';
alter table profiles alter column plan set not null;
alter table payments alter column plan type plan_id using plan::plan_id;

create index profiles_plan_expiry_idx on profiles (plan_expires_at)
  where plan <> 'free' and plan_expires_at is not null;

-- ---------------------------------------------------------------------------
-- 2. Vai trò
-- ---------------------------------------------------------------------------
create type user_role as enum ('user', 'admin');

alter table profiles add column role user_role not null default 'user';

-- ---------------------------------------------------------------------------
-- ĐIỂM QUAN TRỌNG NHẤT CỦA FILE NÀY
-- ---------------------------------------------------------------------------
--
-- Policy `profiles_update_own` cho người dùng sửa hàng của chính họ. Nếu không
-- làm gì thêm thì AI CŨNG TỰ PHONG MÌNH LÀM ADMIN bằng đúng một lời gọi REST —
-- và admin thì cấp được gói Max cho bất kỳ ai, kể cả chính mình.
--
-- RLS là bảo mật theo HÀNG, không theo CỘT. Quyền theo cột mới là công cụ đúng.
revoke update (role) on profiles from authenticated;

-- Postgres cần GRANT tường minh liệt kê các cột CÒN được sửa, nếu không một
-- GRANT ALL trước đó có thể phủ lên lệnh revoke.
grant update (display_name, avatar_url, target_band, target_date, daily_goal_minutes, locale)
  on profiles to authenticated;

-- ---------------------------------------------------------------------------
-- 3. Admin đọc được hồ sơ người khác
-- ---------------------------------------------------------------------------
--
-- Hàm SECURITY DEFINER, KHÔNG phải một policy đọc thẳng `profiles`. Policy dạng
-- `exists (select 1 from profiles where id = auth.uid() and role = 'admin')`
-- khiến Postgres phải áp RLS của `profiles` để đánh giá RLS của `profiles` —
-- đệ quy vô hạn, lỗi lúc chạy chứ không phải lúc tạo.
--
-- `search_path` cố định để hàm không bị đánh lừa bằng một schema cùng tên đặt
-- trước trong search_path của phiên gọi.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select role = 'admin' from profiles where id = auth.uid()), false);
$$;

revoke execute on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

create policy profiles_read_all_for_admin on profiles
  for select using (public.is_admin());

-- Admin đọc được toàn bộ lịch sử thanh toán để đối soát chuyển khoản.
create policy payments_read_all_for_admin on payments
  for select using (public.is_admin());

-- ---------------------------------------------------------------------------
-- 4. Nhật ký thao tác quản trị
-- ---------------------------------------------------------------------------
--
-- Cấp gói bằng tay là thao tác đụng tới tiền. Không có nhật ký thì tháng sau
-- không ai trả lời được câu "vì sao tài khoản này thành Max".
create table admin_audit (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references auth.users (id) on delete cascade,
  target_id uuid not null references auth.users (id) on delete cascade,
  action text not null,
  -- Ghi cả TRƯỚC và SAU, vì "đổi thành Max" một mình không cho biết đã lấy đi gì.
  before jsonb,
  after jsonb,
  note text,
  created_at timestamptz not null default now()
);

create index admin_audit_target_idx on admin_audit (target_id, created_at desc);
create index admin_audit_actor_idx on admin_audit (actor_id, created_at desc);

alter table admin_audit enable row level security;

-- Chỉ admin ĐỌC được. Không có policy insert cho `authenticated`: mọi dòng đều
-- do route máy chủ ghi bằng service_role, vì một nhật ký mà đối tượng bị ghi
-- cũng sửa được thì không còn là bằng chứng.
create policy admin_audit_read on admin_audit for select using (public.is_admin());
