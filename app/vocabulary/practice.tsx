import { Redirect } from 'expo-router';

/**
 * Phòng "Luyện từ vựng" cũ đã bỏ — người dùng chọn giữ Quiz từ vựng (Học xen kẽ,
 * Kiểm tra, Điền vào câu). Đường dẫn cũ còn nằm trong bookmark, lịch sử và các
 * liên kết đã gửi đi, nên chuyển thẳng sang chỗ mới thay vì báo không tìm thấy.
 */
export default function OldVocabPractice() {
  return <Redirect href={'/vocabulary/quiz' as never} />;
}
