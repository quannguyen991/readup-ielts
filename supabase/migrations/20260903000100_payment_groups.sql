-- ============================================================================
-- Mua theo nhóm: càng đông người mua cùng một gói (chu kỳ NĂM), giá càng giảm.
--
-- MÔ HÌNH: TRẢ TRƯỚC, KHÔNG PHẢI GHI DANH RỒI TRẢ SAU. Mỗi thành viên tự
-- chuyển khoản QR NGAY tại giá của mốc mình nhắm tới (3/5/10 người), y hệt một
-- đơn thường — không có bước "giữ chỗ chưa trả tiền" nào cả. Chọn mô hình này
-- (không phải ghi-danh-trước) vì toàn bộ hệ thống thanh toán vẫn là đối chiếu
-- QR THỦ CÔNG bởi một người: một cỗ máy trạng thái nhiều mốc thời gian (ghi
-- danh → khoá danh sách → nhắc thanh toán → mời bù người) là quá tải để một
-- người vận hành đúng, và không nợ ai một khoản tiền đang "chờ hoàn" nếu nhóm
-- vỡ — khoản thiếu hụt (nếu nhóm không đủ người) được BÙ BẰNG NGÀY DÙNG THÊM,
-- không hoàn tiền mặt, dùng đúng cơ chế `extendExpiry()` đã có sẵn.
--
-- Đối chiếu/chốt nhóm vẫn là hành động THỦ CÔNG của admin qua `/admin`, đúng
-- như mọi đơn hàng khác trong hệ thống này — không có gì tự động chạy nền.
-- ============================================================================

create type payment_group_status as enum ('collecting', 'settled', 'expired');

create table payment_groups (
  id uuid primary key default gen_random_uuid(),
  leader_id uuid not null references auth.users (id) on delete cascade,
  plan plan_id not null,
  -- Chỉ ba mốc có bậc giảm giá thật (xem src/services/payment/groupBuy.ts).
  -- Check ở tầng DB để không ai tạo được nhóm với một mốc bịa ra.
  target_size integer not null check (target_size in (3, 5, 10)),
  discount_percent integer not null check (discount_percent > 0 and discount_percent < 100),
  -- Mã 6 ký tự để chia sẻ link mời, cùng khuôn với referral_code.
  code text not null unique,
  status payment_group_status not null default 'collecting',
  created_at timestamptz not null default now(),
  -- Quá hạn này mà chưa chốt thì coi như hết hiệu lực nhận thành viên mới —
  -- không phải "tiền mất", chỉ là không nhận thêm người NỮA vào giá đã chọn.
  settle_by timestamptz not null default (now() + interval '7 days'),
  -- Điền lúc admin CHỐT nhóm: số người THẬT SỰ đã trả tiền, và ai chốt.
  settled_size integer,
  settled_at timestamptz,
  settled_by uuid references auth.users (id) on delete set null
);

create index payment_groups_leader_idx on payment_groups (leader_id);
create index payment_groups_code_idx on payment_groups (code);
-- Dùng để lọc "nhóm đã quá hạn mà chưa chốt" ở màn admin.
create index payment_groups_pending_settle_idx on payment_groups (settle_by)
  where status = 'collecting';

alter table payments
  add column group_id uuid references payment_groups (id) on delete set null;

create index payments_group_idx on payments (group_id) where group_id is not null;

alter table payment_groups enable row level security;

-- Đọc được nhóm nếu: mình là trưởng nhóm, HOẶC mình có một đơn `payments`
-- thuộc nhóm đó (tức đã tham gia), HOẶC là admin. Không cho đọc nhóm người
-- lạ — mã nhóm coi như bí mật chia sẻ qua link, không phải liệt kê công khai.
create policy payment_groups_read_member on payment_groups
  for select using (
    auth.uid() = leader_id
    or exists (
      select 1 from payments p
      where p.group_id = payment_groups.id and p.user_id = auth.uid()
    )
    or public.is_admin()
  );

-- KHÔNG có policy insert/update cho `authenticated`. Tạo nhóm và chốt nhóm đều
-- là ghi tiền/hạn dùng — cùng nguyên tắc với `payments`: chỉ service_role
-- trong route máy chủ được ghi, đúng lý do migration payments_qr đã nêu (RLS
-- theo hàng không chặn được nếu client tự thêm một dòng với leader_id = mình
-- rồi tự đặt discount_percent tuỳ ý).
revoke insert, update, delete, truncate on payment_groups from authenticated, anon;
