-- ============================================================================
-- Giới thiệu bạn bè: đủ 10 lượt HỢP LỆ → 3 tháng gói Plus.
--
-- App mới cần người dùng hơn cần doanh thu, và lời giới thiệu của một người học
-- thật đáng tin hơn mọi quảng cáo. Nhưng phần thưởng nào cũng bị lợi dụng, nên
-- điều kiện tính "hợp lệ" phải chặt hơn "đã bấm vào link".
-- ============================================================================

alter table profiles
  -- Mã mời riêng, sinh khi người dùng mở trang mời lần đầu.
  add column referral_code text unique,
  -- Số tháng Plus ĐÃ THƯỞNG nhưng chưa dùng, vì đang có gói cao hơn. Không có
  -- cột này thì cách duy nhất để "thưởng Plus" cho người đang dùng Pro là hạ họ
  -- xuống Plus — món quà biến thành hình phạt.
  add column plus_credit_months integer not null default 0
    check (plus_credit_months >= 0 and plus_credit_months <= 120),
  -- Đã phát bao nhiêu mốc thưởng. Chống phát lại mỗi lần tính lại tiến độ.
  add column referral_rewards_granted integer not null default 0
    check (referral_rewards_granted >= 0);

create index profiles_referral_code_idx on profiles (referral_code)
  where referral_code is not null;

-- ---------------------------------------------------------------------------
-- Ai giới thiệu ai
-- ---------------------------------------------------------------------------
create table referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references auth.users (id) on delete cascade,
  -- DUY NHẤT: một người chỉ được tính cho ĐÚNG MỘT người giới thiệu, mãi mãi.
  -- Thiếu ràng buộc này thì một tài khoản mới đi khai với mười người là đủ để
  -- cả mười cùng nhận thưởng.
  invited_id uuid not null unique references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  -- null = chưa hợp lệ. Chỉ lượt có `qualified_at` mới được đếm.
  qualified_at timestamptz,

  -- Tự giới thiệu chính mình là cách gian lận đơn giản nhất; chặn ở tầng dữ liệu
  -- chứ không chỉ ở tầng route, vì route thì có thể thêm cái mới mà quên kiểm.
  constraint referrals_no_self check (referrer_id <> invited_id)
);

create index referrals_referrer_idx on referrals (referrer_id, qualified_at);

alter table referrals enable row level security;

-- Người dùng chỉ ĐỌC được các lượt mình giới thiệu, để hiện tiến độ. Không có
-- policy insert/update: mọi dòng do route máy chủ ghi bằng service_role, vì
-- client tự ghi được một dòng `qualified_at` thì cả cơ chế mất ý nghĩa.
create policy referrals_read_own on referrals
  for select using (auth.uid() = referrer_id);

create policy referrals_read_all_for_admin on referrals
  for select using (public.is_admin());

-- ---------------------------------------------------------------------------
-- ĐIỂM QUAN TRỌNG: ba cột mới KHÔNG được để người dùng tự ghi
-- ---------------------------------------------------------------------------
--
-- Bài học từ migration 20260902000200: `REVOKE UPDATE (cột)` KHÔNG trừ được vào
-- quyền UPDATE mức bảng. Ở đây quyền mức bảng đã bị thu hồi từ migration đó và
-- chỉ cấp lại theo danh sách cột — nên chỉ cần KHÔNG thêm ba cột mới vào danh
-- sách ấy là chúng tự động nằm ngoài tầm với.
--
-- Chạy lại lệnh grant cho tường minh: ai đọc file này sau cũng thấy ngay danh
-- sách cột được phép sửa, không phải lần ngược ba migration.
grant update (display_name, avatar_url, target_band, target_date, daily_goal_minutes, locale)
  on profiles to authenticated;
