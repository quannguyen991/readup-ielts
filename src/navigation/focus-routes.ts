/**
 * Những màn CHẠY MỘT TÁC VỤ — vào đó là không còn thanh điều hướng nào.
 *
 * Lý do tách thành danh sách riêng thay vì gắn cờ vào từng file màn hình: khung
 * app (`AppShell`) phải quyết định vẽ hay không vẽ thanh điều hướng TRƯỚC khi
 * màn hình con kịp render. Nếu để màn hình tự khai báo, thanh nav sẽ hiện ra
 * một nhịp rồi mới biến mất mỗi lần vào bài — đúng thứ nhấp nháy mà chế độ tập
 * trung sinh ra để tránh.
 *
 * Nguyên tắc chọn: màn có ĐỒNG HỒ, có Ô NHẬP, hoặc đang trình bày KẾT QUẢ của
 * một lượt làm thì vào đây. Màn để CHỌN bài (kho đề, hub kỹ năng, thư viện) thì
 * không — ở đó người dùng đang duyệt và cần đường đi tiếp.
 */
const FOCUS_PATTERNS: readonly RegExp[] = [
  // Writing: phòng viết, luyện từng phần, bảng chấm, drill SAT.
  /^\/write\/[^/]+$/,
  /^\/write\/drill\/[^/]+$/,
  /^\/write\/result\/[^/]+$/,

  // SAT Math: chẩn đoán, drill, xem lại, thi thử, bộ bài, từ vựng toán.
  /^\/math\/(diagnostic|mock|vocab)$/,
  /^\/math\/(drill|review|set)\/[^/]+$/,

  // SAT Verbal: màn luyện từng unit, và màn làm đề trộn.
  /^\/sat-rw\/[^/]+$/,
  /^\/sat-rw\/mix\/[^/]+$/,
  /^\/sat-rw\/set\/[^/]+$/,
  /^\/sat-rw\/skill\/[^/]+$/,

  // Reading: đọc bài, đọc song ngữ, và xem lại phiên.
  /^\/read\/[^/]+$/,
  /^\/bilingual\/[^/]+$/,
  /^\/review\/[^/]+$/,

  // Luyện câu: dịch câu và chép chính tả.
  /^\/sentence\/(translate|dictation|youtube)$/,

  // Từ vựng theo chủ đề — đây là màn học thẻ, không phải màn duyệt.
  /^\/vocabulary\/topic\/[^/]+$/,
  // Các màn học một bộ từ: Học, Nghe chép, Điền câu, Phát âm, Kiểm tra, Bóng bay.
  /^\/vocabulary\/topic\/[^/]+\/(learn|dictation|cloze|speak|test|game)$/,
  /^\/vocabulary\/practice$/,

  // Thi thử SAT đầy đủ: 98 câu, hơn hai tiếng. Đây là màn tập trung nhất trong
  // cả app — mọi lối rẽ ngang đều là một cách bỏ dở bài thi.
  /^\/sat\/full-test$/,

  // Đăng nhập và thanh toán: dẫn người dùng đi thẳng, không mời rẽ ngang.
  /^\/auth(\/|$)/,
  /^\/checkout$/,
  // Quest battle: full attention on the question and battle feedback.
  /^\/quest\/battle\//,
  /^\/quest\/result\//,
];

export function isFocusRoute(pathname: string): boolean {
  return FOCUS_PATTERNS.some((pattern) => pattern.test(pathname));
}
