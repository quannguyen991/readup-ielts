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
  // Thành phố Tri thức: cảnh 3D chiếm trọn màn hình, không thanh bên.
  /^\/quest\/city$/,
  // Chuyến bay từ vựng: trang riêng nền tối, tự có đầu trang và nút quay lại.
  /^\/quest\/rail$/,
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
  // Listening: phòng thi và kết quả của một đề (trang thư viện / lịch sử vẫn có điều hướng).
  /^\/listening\/(?!history$)[^/]+$/,
  // Phòng luyện nói: phòng thi (micro + đồng hồ) và phiếu điểm của một lượt.
  /^\/speaking\/room$/,
  /^\/speaking\/result\/[^/]+$/,

  // Từ vựng theo chủ đề — đây là màn học thẻ, không phải màn duyệt.
  /^\/vocabulary\/topic\/[^/]+$/,
  // Các màn học một bộ từ: Học, Nghe chép, Điền câu, Phát âm, Kiểm tra, Bóng bay.
  /^\/vocabulary\/topic\/[^/]+\/(learn|quiz|dictation|cloze|speak|test|game)$/,
  // Quiz ôn từ SAT (một chủ đề, một mức).
  /^\/vocabulary\/sat-quiz\/[^/]+$/,

  // Thi thử SAT đầy đủ: 98 câu, hơn hai tiếng. Đây là màn tập trung nhất trong
  // cả app — mọi lối rẽ ngang đều là một cách bỏ dở bài thi.
  /^\/sat\/full-test$/,

  // Đăng nhập và thanh toán: dẫn người dùng đi thẳng, không mời rẽ ngang.
  /^\/auth(\/|$)/,
  /^\/checkout$/,
  // Du ngoạn Band 9: cảnh thành phố và lượt làm bài ở một địa điểm.
  /^\/quest\/du-ngoan\/visit\/[^/]+$/,
  /^\/quest\/du-ngoan\/guide\/[^/]+$/,
  /^\/quest\/du-ngoan\/(hanoi|singapore|london|paris|amsterdam|rome|hochiminh|danang)$/,
  // Bản đồ ReadUp: thế giới pixel chiếm trọn màn hình.
  /^\/quest\/world(\/[^/]+)?$/,
];

/**
 * Các màn học một bộ từ (Học, Nghe chép, Điền câu, Phát âm, Kiểm tra, Bóng bay):
 * nền chàm kẻ ô như màn Đọc song ngữ — người dùng chọn nền này cho phần học từ
 * vựng (24/09/2026). AppShell vẽ nền, `StudyFrame` đổi chữ ngoài thẻ sang màu sáng.
 */
const VOCAB_STUDY = /^\/vocabulary\/(topic\/[^/]+\/(learn|quiz|dictation|cloze|speak|test|game)|sat-quiz\/[^/]+)$/;

/**
 * Màn KHÔNG bật "bôi đen là tra": màn làm đề (tra được là lộ đáp án) và màn đọc
 * bài / đọc song ngữ (đã có thẻ tra riêng theo đoạn văn, hai thẻ chồng nhau).
 */
const NO_LOOKUP: readonly RegExp[] = [
  // Listening: bôi đen tra từ lộ đáp án; phần bản chữ sau khi nộp có thẻ tra riêng.
  /^\/listening\/(?!history$)[^/]+$/,
  /^\/read\/[^/]+$/,
  /^\/bilingual\/[^/]+$/,
  // Trang đọc lịch sử có thanh nghe riêng và tự có đường tra từ; chuyển động nhẹ, không bôi-đen-là-tra chồng thẻ.
  /^\/history\/[^/]+$/,
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

/** Màn luyện câu có nền cá nhân hoá (cảnh bay, cảnh thành phố, tranh…; tông sáng): chép chính tả, dịch câu, nghe chép, chép theo video. */
const TRAVEL_LIGHT = /^\/sentence\/(dictation|translate|listen|youtube)$/;

/** Màn có nền cảnh bay: ôn từ vựng (tông tối) + luyện câu (tông sáng). */
export function isTravelRoute(pathname: string): boolean {
  return VOCAB_STUDY.test(pathname) || TRAVEL_LIGHT.test(pathname);
}

export function isTravelLightRoute(pathname: string): boolean {
  return TRAVEL_LIGHT.test(pathname);
}

export function isVocabStudyRoute(pathname: string): boolean {
  return VOCAB_STUDY.test(pathname);
}

export function isFocusRoute(pathname: string): boolean {
  return FOCUS_PATTERNS.some((pattern) => pattern.test(pathname));
}

/**
 * Màn THI / CHẤM ĐIỂM: ẩn trợ lý AI ở góc. Người dùng muốn trợ lý ghim cố định
 * trên mọi màn, kể cả màn làm bài (27/09/2026) — trừ lúc đang thi, vì hỏi AI
 * giữa bài thi thử là không còn đo được gì.
 */
const EXAM: readonly RegExp[] = [
  /^\/listening\/(?!history$)[^/]+$/,
  /^\/sat\/full-test$/,
  /^\/math\/(mock|diagnostic)$/,
  /^\/weekly(\/|$)/,
  /^\/duel\/[^/]+$/,
  /^\/vocabulary\/topic\/[^/]+\/test$/,
  /^\/vocabulary\/sat-quiz\/[^/]+$/,
];

export function isExamRoute(pathname: string): boolean {
  return EXAM.some((pattern) => pattern.test(pathname));
}

/**
 * Màn làm bài TOÀN KHUNG: không thanh bên, không thanh trên của app, không bong bóng
 * trợ lý — màn tự vẽ thanh trên riêng (phòng thi Reading kiểu đề máy).
 */
export function isImmersiveRoute(pathname: string): boolean {
  // + trang giới thiệu ngắn cho người lần đầu mở link: không thanh bên, không băng khuyến mãi.
  return /^\/read\/[^/]+$/.test(pathname) || /^\/history\/[^/]+$/.test(pathname) || pathname === '/gioi-thieu';
}

/**
 * Màn LÀM BÀI giữ cột bên trái ở desktop nhưng, trên ĐIỆN THOẠI, bỏ hẳn thanh đầu
 * trang của app (cao ~64px + viền): màn tự có thanh đồng hồ / nút thoát của nó, mà
 * 80px của một màn 360×740 là gần một câu hỏi. Gồm mọi màn thi (`EXAM`) cộng các
 * màn luyện từng bài của SAT Math / Verbal.
 *
 * KHÔNG gồm trang chọn bài (`/listening`, `/sat`, `/math`, `/sat-rw`): ở đó người
 * dùng đang duyệt và cần thanh điều hướng.
 */
const PHONE_CHROMELESS_EXTRA: readonly RegExp[] = [
  /^\/math\/(drill|review|set)\/[^/]+$/,
  /^\/sat-rw\/(?!learn$)[^/]+$/,
  /^\/sat-rw\/(mix|set|skill)\/[^/]+$/,
  /^\/listening\/(?!history$)[^/]+\/result$/,
];

export function isPhoneChromelessRoute(pathname: string): boolean {
  return isExamRoute(pathname) || PHONE_CHROMELESS_EXTRA.some((pattern) => pattern.test(pathname));
}
