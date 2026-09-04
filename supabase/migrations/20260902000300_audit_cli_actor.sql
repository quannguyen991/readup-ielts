-- ============================================================================
-- Cho phép nhật ký quản trị ghi lại thao tác KHÔNG có người dùng đứng sau.
--
-- Chuyện đã xảy ra: `scripts/grant-account.ts` cấp gói bằng service key từ máy
-- phát triển, không đi qua route nào, nên không ghi nhật ký. Câu dọn dẹp trong
-- migration 20260902000200 — vốn để hạ những tài khoản TỰ nâng gói qua lỗ hổng —
-- không phân biệt được nó với một kẻ lạm dụng, và hạ luôn tài khoản chủ app.
--
-- Bài học: một hàng dữ liệu không có lời giải thích đi kèm thì sớm muộn cũng bị
-- một câu lệnh dọn dẹp nào đó hiểu nhầm. Nên lệnh CLI cũng phải ghi nhật ký.
--
-- `actor_id` thành nullable vì lệnh chạy từ máy không có người dùng đăng nhập.
-- Ghi đại id của chính người được cấp vào đó thì nhật ký nói sai — "người này tự
-- cấp cho mình" — đúng cái điều mà nhật ký sinh ra để phân biệt.
-- ============================================================================

alter table admin_audit alter column actor_id drop not null;

comment on column admin_audit.actor_id is
  'Người thực hiện. NULL = chạy từ CLI bằng service key, không có phiên đăng nhập.';
