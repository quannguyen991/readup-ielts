-- ============================================================================
-- SỬA LỖ HỔNG: người dùng thường tự đặt được `plan = 'max'` và `role = 'admin'`.
--
-- Lỗi gốc: hai migration trước viết
--
--     revoke update (plan, plan_started_at, plan_expires_at) on profiles from authenticated;
--     revoke update (role) on profiles from authenticated;
--
-- và tin rằng thế là xong. KHÔNG PHẢI. Trong PostgreSQL, `REVOKE UPDATE (cột)`
-- chỉ gỡ được quyền cấp Ở MỨC CỘT; nó không trừ gì vào quyền cấp Ở MỨC BẢNG.
-- Supabase mặc định chạy `grant all on all tables in schema public to authenticated`,
-- nên `authenticated` có UPDATE toàn bảng — và UPDATE toàn bảng cho phép ghi
-- MỌI cột. Hai lệnh revoke kia là lệnh rỗng.
--
-- Hậu quả đo được (bằng bộ dò `verify-admin.mjs`, trước khi có file này):
--
--     PATCH /rest/v1/profiles?id=eq.<mình>  { "plan": "max" }   → HTTP 204
--     PATCH /rest/v1/profiles?id=eq.<mình>  { "role": "admin" } → HTTP 204
--
-- Tức là bất kỳ ai đăng nhập cũng tự cấp cho mình gói đắt nhất, và tự phong
-- quản trị viên — rồi từ đó cấp gói cho người khác. RLS không cứu được: policy
-- `profiles_update_own` cho phép sửa ĐÚNG HÀNG của mình, và hàng đó có cột
-- `role`. RLS lọc theo HÀNG, quyền lọc theo CỘT; đây là việc của quyền.
--
-- Cách đúng: thu hồi UPDATE MỨC BẢNG trước, rồi cấp lại theo đúng danh sách cột
-- được phép sửa.
-- ============================================================================

revoke update on profiles from authenticated;
revoke update on profiles from anon;

grant update (display_name, avatar_url, target_band, target_date, daily_goal_minutes, locale)
  on profiles to authenticated;

-- ---------------------------------------------------------------------------
-- TRUNCATE không đi qua RLS
-- ---------------------------------------------------------------------------
--
-- `grant all` của Supabase cũng cấp TRUNCATE, và TRUNCATE là lệnh DDL — RLS
-- không lọc nó. Một hàng bị xoá sai thì còn khôi phục được từ bản sao lưu; cả
-- bảng bị dọn sạch thì không.
--
-- Hiện chưa khai thác được qua PostgREST (nó không phát lệnh TRUNCATE), nên đây
-- là phòng thủ theo chiều sâu, không phải vá lỗ đang chảy máu. Vẫn nên có: chi
-- phí bằng không, và giả định "PostgREST sẽ không bao giờ làm việc đó" là thứ
-- không nên đem ra cược với dữ liệu người dùng.
revoke truncate on profiles, payments, admin_audit, user_state from authenticated, anon;

-- ---------------------------------------------------------------------------
-- Dọn hậu quả
-- ---------------------------------------------------------------------------
--
-- Nếu ai đó đã kịp tự nâng gói trong lúc lỗ hổng còn mở, hạ họ về Free. Bảng
-- `payments` là bằng chứng duy nhất cho việc đã trả tiền, nên giữ lại đúng
-- những người có một khoản `paid` — và giữ nguyên các tài khoản do quản trị cấp
-- tay, vì chúng có dấu vết trong `admin_audit`.
update profiles p
   set plan = 'free', plan_started_at = null, plan_expires_at = null
 where p.plan <> 'free'
   and not exists (select 1 from payments  where user_id  = p.id and status = 'paid')
   and not exists (select 1 from admin_audit where target_id = p.id and action = 'set_plan');
