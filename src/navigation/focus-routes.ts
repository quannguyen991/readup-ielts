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
  // Báo cáo phụ huynh: người mở không phải học sinh, không cần thanh điều hướng của app.
  /^\/report\/[^/]+$/,
  /^\/math\/(diagnostic|mock|vocab)$/,
  /^\/math\/(drill|review|set)\/[^/]+$/,

  // SAT Verbal: màn luyện từng unit, và màn làm đề trộn.
  // /sat-rw/learn là trang danh sách bài học, không phải màn làm bài.
  /^\/sat-rw\/(?!learn$)[^/]+$/,
  /^\/sat-rw\/mix\/[^/]+$/,
  /^\/sat-rw\/set\/[^/]+$/,
  /^\/sat-rw\/skill\/[^/]+$/,

  // Reading: đọc bài, đọc song ngữ, và xem lại phiên.
  /^\/read\/[^/]+$/,
  /^\/bilingual\/[^/]+$/,
  /^\/review\/[^/]+$/,

  // Luyện câu: dịch câu và chép chính tả.
  /^\/sentence\/(translate|dictation|youtube)$/,
  // Đọc theo một bài VOA và phòng đấu 1–1: có micro / đồng hồ, không mời rẽ ngang.
  /^\/shadow\/[^/]+$/,
  /^\/duel\/[^/]+$/,

  // Từ vựng theo chủ đề — đây là màn học thẻ, không phải màn duyệt.
  /^\/vocabulary\/topic\/[^/]+$/,
  // Các màn học một bộ từ: Học, Nghe chép, Điền câu, Phát âm, Kiểm tra, Bóng bay.
  /^\/vocabulary\/topic\/[^/]+\/(learn|dictation|cloze|speak|test|game)$/,
  // Quiz ôn từ SAT (một chủ đề, một mức).
  /^\/vocabulary\/sat-quiz\/[^/]+$/,

  // Thi thử SAT đầy đủ: 98 câu, hơn hai tiếng. Đây là màn tập trung nhất trong
  // cả app — mọi lối rẽ ngang đều là một cách bỏ dở bài thi.
  /^\/sat\/full-test$/,

  // Đăng nhập và thanh toán: dẫn người dùng đi thẳng, không mời rẽ ngang.
  /^\/auth(\/|$)/,
  /^\/checkout$/,
  // Bản đồ ReadUp: thế giới pixel chiếm trọn màn hình.
  /^\/quest\/world(\/[^/]+)?$/,
];

/**
 * Các màn học một bộ từ (Học, Nghe chép, Điền câu, Phát âm, Kiểm tra, Bóng bay):
 * nền chàm kẻ ô như màn Đọc song ngữ — người dùng chọn nền này cho phần học từ
 * vựng (24/09/2026). AppShell vẽ nền, `StudyFrame` đổi chữ ngoài thẻ sang màu sáng.
 */
const VOCAB_STUDY = /^\/vocabulary\/(topic\/[^/]+\/(learn|dictation|cloze|speak|test|game)|sat-quiz\/[^/]+)$/;

/**
 * Màn KHÔNG bật "bôi đen là tra": màn làm đề (tra được là lộ đáp án) và màn đọc
 * bài / đọc song ngữ (đã có thẻ tra riêng theo đoạn văn, hai thẻ chồng nhau).
 */
const NO_LOOKUP: readonly RegExp[] = [
  /^\/read\/[^/]+$/,
  /^\/bilingual\/[^/]+$/,
  /^\/sat\/full-test$/,
  /^\/math\/(mock|diagnostic)$/,
  /^\/weekly(\/|$)/,
  /^\/duel\/[^/]+$/,
  /^\/vocabulary\/topic\/[^/]+\/test$/,
  // Quiz ôn từ SAT: tra được là lộ đáp án.
  /^\/vocabulary\/sat-quiz\/[^/]+$/,
];

export function isLookupBlocked(pathname: string): boolean {
  return NO_LOOKUP.some((re) => re.test(pathname));
}

export function isVocabStudyRoute(pathname: string): boolean {
  return VOCAB_STUDY.test(pathname);
}

export function isFocusRoute(pathname: string): boolean {
  return FOCUS_PATTERNS.some((pattern) => pattern.test(pathname));
}
