-- ============================================================================
-- Thanh toán bằng QR chuyển khoản, đối chiếu tay.
--
-- Chưa nối cổng thanh toán tự động (VNPay/MoMo/PayOS/Casso đều cần tài khoản
-- doanh nghiệp và khoá API). Luồng thật hiện nay:
--
--   người dùng chọn gói → app tạo một đơn `pending` kèm MÃ ĐỐI CHIẾU
--   → người dùng quét QR, chuyển khoản, nội dung mang mã đó
--   → chủ app đối chiếu sao kê, bấm xác nhận ở /admin
--   → gói được bật, đơn chuyển sang `paid`
--
-- Bảng `payments` đã có sẵn từ migration 20260823000100. Migration này thêm
-- những gì luồng đối chiếu tay cần, và giữ nguyên chỗ để cắm webhook tự động
-- sau này — lúc đó chỉ đổi ai ghi dòng `paid`, không đổi lược đồ.
-- ============================================================================

alter table payments
  -- Mã in trong nội dung chuyển khoản. DUY NHẤT trên toàn bảng: hai đơn cùng
  -- mã thì một lần chuyển khoản khớp được cả hai, và đối chiếu mất ý nghĩa.
  add column reference text unique,
  -- Chu kỳ đã có; thêm số tháng để tính hạn khi xác nhận, thay vì suy lại từ
  -- chuỗi 'monthly'/'yearly' ở ba nơi khác nhau rồi lệch nhau một chỗ.
  add column months integer check (months is null or (months >= 1 and months <= 120)),
  add column confirmed_by uuid references auth.users (id) on delete set null,
  add column confirmed_at timestamptz,
  -- Ghi chú của người đối chiếu: số giao dịch trong sao kê, hoặc lý do từ chối.
  add column admin_note text;

create index payments_reference_idx on payments (reference) where reference is not null;
create index payments_pending_idx on payments (created_at desc) where status = 'pending';

-- ---------------------------------------------------------------------------
-- Người dùng TỰ TẠO ĐƯỢC đơn của mình, nhưng chỉ ở trạng thái chờ
-- ---------------------------------------------------------------------------
--
-- Migration cũ không có policy insert nào, nên client không tạo đơn được. Giờ
-- cần, vì chính người dùng bấm "Chọn gói". Hai vế `with check` giữ cho nó vô hại:
--
--   auth.uid() = user_id   → không tạo đơn hộ người khác
--   status = 'pending'     → KHÔNG tự ghi 'paid'
--
-- Thiếu vế thứ hai thì cả bảng vô nghĩa: ai cũng tự khai mình đã trả tiền.
create policy payments_insert_own on payments
  for insert to authenticated
  with check (auth.uid() = user_id and status = 'pending');

-- ---------------------------------------------------------------------------
-- ĐIỂM QUAN TRỌNG NHẤT: không cho sửa đơn sau khi đã tạo
-- ---------------------------------------------------------------------------
--
-- Không có policy UPDATE nào cho `authenticated`, nên RLS chặn mọi lệnh sửa.
-- Nhưng RLS chỉ là một nửa — bài học từ migration 20260902000200: quyền cấp ở
-- MỨC BẢNG cho ghi mọi cột, và `grant all` của Supabase có sẵn UPDATE. Ở đây
-- RLS đủ để chặn (không policy = không hàng nào qua được), nhưng thu hồi quyền
-- vẫn đúng hơn: hai lớp, và lớp quyền không phụ thuộc vào việc ai đó vô tình
-- thêm một policy UPDATE rộng tay về sau.
revoke update, delete, truncate on payments from authenticated, anon;

-- Xác nhận thanh toán chỉ đi qua service_role trong route máy chủ.
