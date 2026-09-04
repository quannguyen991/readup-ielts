-- ============================================================================
-- Gói thuê bao: Free · Thường · VIP.
--
-- Gói hiện đang lưu ở client (`useBillingStore`) vì chưa nối cổng thanh toán.
-- Migration này dựng sẵn phía máy chủ để lúc nối thanh toán KHÔNG phải sửa lại
-- mô hình bảo mật — chỉ cần đổi nguồn đọc.
-- ============================================================================

create type plan_id as enum ('free', 'standard', 'vip');

alter table profiles
  add column plan plan_id not null default 'free',
  add column plan_started_at timestamptz,
  -- null = không hết hạn (gói vĩnh viễn hoặc gói Free).
  add column plan_expires_at timestamptz;

-- ---------------------------------------------------------------------------
-- ĐIỂM QUAN TRỌNG NHẤT CỦA FILE NÀY
-- ---------------------------------------------------------------------------
--
-- RLS là bảo mật theo HÀNG, không theo CỘT. Policy `profiles_update_own` cho
-- người dùng sửa hàng của chính họ — nghĩa là nếu không làm gì thêm, ai cũng tự
-- đặt `plan = 'vip'` cho mình bằng một lời gọi REST.
--
-- Quyền theo CỘT mới là công cụ đúng ở đây: thu hồi UPDATE trên ba cột gói của
-- vai trò `authenticated`. Người dùng vẫn ĐỌC được gói của mình (cần để hiện
-- giao diện) và vẫn sửa được tên, mục tiêu band, phút mỗi ngày.
--
-- Chỉ `service_role` — dùng trong webhook thanh toán chạy phía máy chủ — mới
-- ghi được ba cột này.
revoke update (plan, plan_started_at, plan_expires_at) on profiles from authenticated;

-- Postgres cần một GRANT tường minh liệt kê các cột CÒN được sửa; nếu không,
-- lệnh revoke ở trên có thể bị một GRANT ALL trước đó phủ lên.
grant update (display_name, avatar_url, target_band, target_date, daily_goal_minutes, locale)
  on profiles to authenticated;

-- ---------------------------------------------------------------------------
-- Đọc nhanh những tài khoản sắp hết hạn — dùng cho việc nhắc gia hạn.
-- ---------------------------------------------------------------------------
create index profiles_plan_expiry_idx on profiles (plan_expires_at)
  where plan <> 'free' and plan_expires_at is not null;

-- ---------------------------------------------------------------------------
-- Nhật ký thanh toán
-- ---------------------------------------------------------------------------
--
-- Dựng trước cả khi có cổng thanh toán, vì hai lý do:
--
-- 1. Khi tiền đã chạy, KHÔNG được phép có khoảng thời gian nào không truy vết
--    được. Bảng này là bằng chứng để đối soát khi người dùng báo "tôi đã chuyển
--    khoản rồi".
-- 2. `provider_ref` là DUY NHẤT — một mã giao dịch chỉ cộng gói đúng một lần,
--    kể cả khi webhook bị gửi lại (chuyện bình thường ở mọi cổng thanh toán).
create table payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  plan plan_id not null,
  -- Số tiền theo ĐỒNG, kiểu nguyên. Tiền không bao giờ để kiểu dấu phẩy động.
  amount_vnd bigint not null check (amount_vnd >= 0),
  billing_cycle text not null check (billing_cycle in ('monthly', 'yearly')),
  status text not null check (status in ('pending', 'paid', 'failed', 'refunded')),
  -- Mã giao dịch bên cổng thanh toán. Chống cộng gói hai lần khi webhook lặp.
  provider text not null default 'manual_qr',
  provider_ref text,
  paid_at timestamptz,
  created_at timestamptz not null default now(),

  unique (provider, provider_ref)
);

create index payments_user_idx on payments (user_id, created_at desc);

alter table payments enable row level security;

-- Người dùng CHỈ ĐỌC lịch sử thanh toán của mình. Không có policy insert/update
-- cho `authenticated`: mọi thay đổi đi qua service_role trong webhook, vì client
-- tự ghi được một dòng `status = 'paid'` thì cả bảng mất ý nghĩa.
create policy payments_read_own on payments
  for select using (auth.uid() = user_id);
