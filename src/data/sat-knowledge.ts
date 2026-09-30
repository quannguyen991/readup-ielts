/**
 * KIẾN THỨC SAT TRONG MỘT KHUNG — dữ liệu cho trang `/sat/kien-thuc`.
 *
 * Viết tay theo cấu trúc Digital SAT của College Board (Bluebook, từ 2024):
 * hai phần, mỗi phần hai module thích ứng; tỉ trọng mảng theo bảng đặc tả đề.
 * Mỗi mảng dẫn sang bài học lý thuyết đã có (`/math/learn/<kỹ năng>`,
 * `/sat-rw/learn/<kỹ năng>`) — trang này là bản đồ tổng, bài học là chi tiết.
 * Số câu / thời gian / tỉ trọng có test đối chiếu (`sat-knowledge.test.ts`).
 */

export type Section = { id: 'rw' | 'math'; vi: string; modules: number; perModule: number; minutesPerModule: number; pretest: number; note: string };

export const SAT_SECTIONS: readonly Section[] = [
  { id: 'rw', vi: 'Đọc & Viết (Reading and Writing)', modules: 2, perModule: 27, minutesPerModule: 32, pretest: 4, note: 'Mỗi câu một đoạn văn ngắn (25–150 từ), toàn bộ là trắc nghiệm 4 lựa chọn.' },
  { id: 'math', vi: 'Toán (Math)', modules: 2, perModule: 22, minutesPerModule: 35, pretest: 4, note: 'Khoảng 75% trắc nghiệm, 25% tự điền đáp số. Được dùng máy tính Desmos cho cả phần, có bảng công thức.' },
];

export const SAT_FACTS = [
  { k: 'Tổng thời gian', v: '2 giờ 14 phút', d: 'Đọc & Viết 64 phút + nghỉ 10 phút + Toán 70 phút.' },
  { k: 'Thang điểm', v: '400 – 1600', d: 'Mỗi phần 200 – 800. Không trừ điểm câu sai — đừng bỏ trống câu nào.' },
  { k: 'Thích ứng theo module', v: 'Module 2 đổi độ khó', d: 'Làm tốt module 1 thì module 2 khó hơn và mở trần điểm cao; module 1 là module quan trọng nhất.' },
  { k: 'Câu thử nghiệm', v: '4 câu / phần', d: 'Không tính điểm và không biết câu nào — cứ làm hết như câu thật.' },
] as const;

export type Domain = {
  id: string;
  section: 'rw' | 'math';
  vi: string;
  en: string;
  /** Tỉ trọng xấp xỉ và số câu theo đặc tả đề. */
  share: number;
  questions: string;
  color: string;
  glyph: string;
  /** Kiến thức cốt lõi — mỗi dòng một ý, ngắn. */
  core: string[];
  /** Công thức / quy tắc cần thuộc (tuỳ mảng). */
  formulas?: string[];
  /** Bẫy hay gặp. */
  traps: string[];
  /** Bài học chi tiết đã có trong app. */
  lessons: { label: string; href: string }[];
};

const M = (skill: string) => `/math/learn/${skill}`;
const V = (skill: string) => `/sat-rw/learn/${skill}`;

export const SAT_DOMAINS: readonly Domain[] = [
  // ---------------------------------------------------------------- Toán
  {
    id: 'algebra',
    section: 'math',
    vi: 'Đại số',
    en: 'Algebra',
    share: 35,
    questions: '13–15 câu',
    color: '#F2B632',
    glyph: '📈',
    core: [
      'Phương trình, bất phương trình bậc nhất một ẩn và hai ẩn.',
      'Hàm bậc nhất: đọc hệ số góc (tốc độ thay đổi) và tung độ gốc (giá trị ban đầu) trong bài toán thực tế.',
      'Hệ hai phương trình bậc nhất: thế, cộng đại số, hoặc giải bằng Desmos (giao điểm).',
      'Dựng phương trình / bất phương trình từ đề chữ.',
    ],
    formulas: ['y = mx + b', 'Hệ số góc m = (y₂ − y₁) / (x₂ − x₁)', 'Hai đường song song: cùng m · vuông góc: m₁·m₂ = −1', 'Hệ vô nghiệm: cùng m, khác b · vô số nghiệm: trùng nhau'],
    traps: ['Nhầm "tốc độ thay đổi" với "giá trị ban đầu".', 'Đổi chiều bất phương trình khi nhân / chia số âm.', 'Hệ có "vô số nghiệm" nghĩa là hai phương trình tỉ lệ nhau.'],
    lessons: [
      { label: 'PT bậc nhất một ẩn', href: M('linear_equations_one_var') },
      { label: 'PT bậc nhất hai ẩn', href: M('linear_equations_two_var') },
      { label: 'Hàm bậc nhất', href: M('linear_functions') },
      { label: 'Hệ phương trình', href: M('systems_linear_two_var') },
      { label: 'Bất phương trình', href: M('linear_inequalities') },
    ],
  },
  {
    id: 'advanced',
    section: 'math',
    vi: 'Toán nâng cao',
    en: 'Advanced Math',
    share: 35,
    questions: '13–15 câu',
    color: '#E8674A',
    glyph: '🧮',
    core: [
      'Biểu thức tương đương: khai triển, phân tích nhân tử, rút gọn phân thức, luỹ thừa.',
      'Phương trình bậc hai, căn thức, phân thức, hệ gồm một phương trình phi tuyến.',
      'Hàm bậc hai, hàm mũ (tăng / giảm theo tỉ lệ), đa thức; đọc đồ thị và dịch chuyển đồ thị.',
    ],
    formulas: [
      'x = (−b ± √(b² − 4ac)) / 2a',
      'Δ = b² − 4ac: > 0 hai nghiệm · = 0 nghiệm kép · < 0 vô nghiệm thực',
      'Tổng nghiệm = −b/a · Tích nghiệm = c/a',
      'Đỉnh parabol: x = −b / 2a; dạng đỉnh y = a(x − h)² + k',
      'Hàm mũ: y = a(1 + r)ᵗ (tăng) · y = a(1 − r)ᵗ (giảm)',
    ],
    traps: ['Chia hai vế cho biến có thể làm mất nghiệm x = 0.', 'Nghiệm của phương trình căn phải thử lại (nghiệm ngoại lai).', 'Hàm mũ tăng "theo %" khác hàm bậc nhất tăng "theo lượng cố định".'],
    lessons: [
      { label: 'Biểu thức tương đương', href: M('equivalent_expressions') },
      { label: 'Phương trình phi tuyến', href: M('nonlinear_equations') },
      { label: 'Hàm phi tuyến', href: M('nonlinear_functions') },
    ],
  },
  {
    id: 'psda',
    section: 'math',
    vi: 'Giải quyết vấn đề & Phân tích dữ liệu',
    en: 'Problem-Solving and Data Analysis',
    share: 15,
    questions: '5–7 câu',
    color: '#2FA36B',
    glyph: '📊',
    core: [
      'Tỉ số, tỉ lệ, tốc độ, đổi đơn vị; phần trăm và phần trăm thay đổi.',
      'Dữ liệu một biến: trung bình, trung vị, khoảng biến thiên, độ lệch chuẩn (ý nghĩa), biểu đồ hộp.',
      'Dữ liệu hai biến: biểu đồ phân tán, đường xu hướng, dự đoán.',
      'Xác suất và xác suất có điều kiện từ bảng hai chiều.',
      'Suy luận từ mẫu, biên sai số; đánh giá kết luận thống kê.',
    ],
    formulas: ['% thay đổi = (mới − cũ) / cũ × 100%', 'P(A | B) = số ca A và B / số ca B', 'Chọn mẫu ngẫu nhiên → khái quát cho tổng thể · phân nhóm ngẫu nhiên → kết luận nhân quả'],
    traps: ['Tăng 20% rồi giảm 20% không về giá trị ban đầu.', 'Giá trị ngoại lai kéo trung bình, ít ảnh hưởng trung vị.', 'Nghiên cứu quan sát không cho kết luận "gây ra".'],
    lessons: [
      { label: 'Tỉ lệ, tốc độ, đơn vị', href: M('ratios_rates_units') },
      { label: 'Phần trăm', href: M('percentages') },
      { label: 'Dữ liệu một biến', href: M('one_var_data') },
      { label: 'Dữ liệu hai biến', href: M('two_var_data') },
      { label: 'Xác suất', href: M('probability') },
      { label: 'Suy luận từ mẫu', href: M('sample_inference') },
      { label: 'Kết luận thống kê', href: M('statistical_claims') },
    ],
  },
  {
    id: 'geometry',
    section: 'math',
    vi: 'Hình học & Lượng giác',
    en: 'Geometry and Trigonometry',
    share: 15,
    questions: '5–7 câu',
    color: '#3A8FD6',
    glyph: '📐',
    core: [
      'Diện tích, thể tích (có sẵn trong bảng công thức của đề).',
      'Đường thẳng, góc, tam giác; tam giác đồng dạng.',
      'Tam giác vuông: Pythagore, tam giác đặc biệt, tỉ số lượng giác.',
      'Đường tròn: cung, góc ở tâm, radian, phương trình đường tròn.',
    ],
    formulas: [
      'a² + b² = c²',
      '30°-60°-90°: x, x√3, 2x · 45°-45°-90°: x, x, x√2',
      'sin = đối/huyền · cos = kề/huyền · tan = đối/kề; sin x° = cos(90 − x)°',
      'π rad = 180° · độ dài cung = (θ/360)·2πr',
      '(x − h)² + (y − k)² = r² (tâm (h; k), bán kính r)',
    ],
    traps: ['Phương trình đường tròn dạng khai triển: phải hoàn thành bình phương để đọc tâm và bán kính.', 'Nhầm độ và radian khi đọc đề.', 'Tổng ba góc tam giác 180°, góc ngoài bằng tổng hai góc trong không kề.'],
    lessons: [
      { label: 'Diện tích, thể tích', href: M('area_volume') },
      { label: 'Đường, góc, tam giác', href: M('lines_angles_triangles') },
      { label: 'Tam giác vuông, lượng giác', href: M('right_triangles_trig') },
      { label: 'Đường tròn', href: M('circles') },
    ],
  },
  // ---------------------------------------------------------------- Đọc & Viết
  {
    id: 'craft',
    section: 'rw',
    vi: 'Kỹ thuật & Cấu trúc',
    en: 'Craft and Structure',
    share: 28,
    questions: '13–15 câu',
    color: '#0EA5E9',
    glyph: '🧩',
    core: [
      'Từ trong ngữ cảnh: chọn từ chính xác, hợp văn phong nhất cho chỗ trống.',
      'Cấu trúc & mục đích văn bản: câu / đoạn đó làm nhiệm vụ gì trong cả đoạn.',
      'Liên hệ hai văn bản: tác giả 2 sẽ phản hồi quan điểm của tác giả 1 thế nào.',
    ],
    traps: ['Chọn từ "nghe hay" nhưng sai sắc thái (quá mạnh / quá yếu).', 'Mô tả nội dung thay vì CHỨC NĂNG của câu.', 'Nhầm hai tác giả khi đọc đề liên hệ văn bản.'],
    lessons: [
      { label: 'Từ trong ngữ cảnh', href: V('words') },
      { label: 'Cấu trúc & mục đích', href: V('structure') },
      { label: 'Liên hệ hai văn bản', href: V('crosstext') },
    ],
  },
  {
    id: 'info',
    section: 'rw',
    vi: 'Thông tin & Ý tưởng',
    en: 'Information and Ideas',
    share: 26,
    questions: '12–14 câu',
    color: '#2FA3A0',
    glyph: '🔎',
    core: [
      'Ý chính và chi tiết: nắm điều đoạn văn thật sự nói.',
      'Chứng cứ: chọn trích dẫn / số liệu biểu đồ ủng hộ (hoặc bác bỏ) đúng nhận định.',
      'Suy luận: chọn kết luận LOGIC NHẤT để hoàn thành đoạn văn.',
    ],
    traps: ['Đáp án đúng về dữ kiện nhưng không liên quan nhận định cần chứng minh.', 'Biểu đồ: đọc nhầm nhóm / năm; số liệu phải khớp CHÍNH XÁC câu khẳng định.', 'Suy luận quá đà, vượt khỏi điều đoạn văn cho phép.'],
    lessons: [
      { label: 'Ý chính & chi tiết', href: V('central') },
      { label: 'Chứng cứ (chữ & số liệu)', href: V('evidence') },
      { label: 'Suy luận', href: V('inference') },
    ],
  },
  {
    id: 'conventions',
    section: 'rw',
    vi: 'Quy tắc tiếng Anh chuẩn',
    en: 'Standard English Conventions',
    share: 26,
    questions: '11–15 câu',
    color: '#D65A8A',
    glyph: '✍️',
    core: [
      'Ranh giới câu: nối / tách mệnh đề bằng dấu câu đúng.',
      'Hình thức, cấu trúc, nghĩa: hoà hợp chủ – vị, đại từ, thì, sở hữu – số nhiều, bổ ngữ.',
    ],
    formulas: [
      'Hai mệnh đề độc lập: dấu chấm · dấu chấm phẩy · dấu phẩy + FANBOYS (for, and, nor, but, or, yet, so)',
      'Dấu hai chấm: chỉ sau một mệnh đề HOÀN CHỈNH',
      'Phần chêm: hai dấu phẩy HOẶC hai gạch ngang — không trộn',
      'Không đặt dấu phẩy giữa chủ ngữ và động từ',
      'its = của nó · it’s = it is · their = của họ',
    ],
    traps: ['Comma splice: nối hai mệnh đề độc lập chỉ bằng dấu phẩy.', 'Chủ ngữ bị cụm "of …" chen giữa che mất.', 'Bổ ngữ treo: chủ thể đứng ngay sau cụm bổ ngữ phải đúng người / vật.'],
    lessons: [
      { label: 'Ranh giới câu & dấu câu', href: V('boundaries') },
      { label: 'Hoà hợp chủ – vị', href: V('form') },
      { label: 'Đại từ', href: V('pronoun') },
      { label: 'Thì & song song', href: V('tense') },
      { label: 'Sở hữu & số nhiều', href: V('possessive') },
    ],
  },
  {
    id: 'expression',
    section: 'rw',
    vi: 'Diễn đạt ý tưởng',
    en: 'Expression of Ideas',
    share: 20,
    questions: '8–12 câu',
    color: '#E0913A',
    glyph: '💬',
    core: [
      'Từ nối: chọn từ nối đúng quan hệ logic giữa hai câu.',
      'Tổng hợp từ ghi chú (Rhetorical Synthesis): chọn câu dùng ghi chú để đạt ĐÚNG mục tiêu đề nêu.',
    ],
    formulas: [
      'Đối lập: however, nevertheless, in contrast, still',
      'Nguyên nhân – kết quả: therefore, thus, consequently, as a result',
      'Bổ sung: moreover, furthermore, additionally, similarly',
      'Ví dụ / làm rõ: for example, for instance, in other words, specifically',
    ],
    traps: ['Tổng hợp ghi chú: đáp án đúng về thông tin nhưng không đạt mục tiêu (so sánh, nhấn mạnh…).', 'Từ nối "nghe trơn" nhưng sai quan hệ logic.'],
    lessons: [{ label: 'Từ nối', href: V('transition') }],
  },
];

/** Chiến lược làm bài — áp dụng cho cả đề. */
export const SAT_STRATEGY = [
  { t: 'Nhịp làm bài', d: 'Đọc & Viết ≈ 71 giây / câu, Toán ≈ 95 giây / câu. Câu nào quá 2 phút thì đánh dấu, làm tiếp, quay lại sau.' },
  { t: 'Không bỏ trống', d: 'Không trừ điểm câu sai: hết giờ vẫn phải chọn một đáp án cho mọi câu.' },
  { t: 'Module 1 là then chốt', d: 'Kết quả module 1 quyết định độ khó (và trần điểm) module 2 — làm chắc, soát kỹ module 1.' },
  { t: 'Dùng Desmos', d: 'Hệ phương trình, nghiệm bậc hai, giao điểm đồ thị: vẽ trên Desmos thường nhanh và ít sai hơn giải tay.' },
  { t: 'Đọc câu hỏi trước', d: 'Đọc & Viết: mỗi đoạn chỉ một câu hỏi — đọc câu hỏi trước để biết cần tìm gì trong đoạn.' },
  { t: 'Loại trừ', d: 'Gạch đáp án chắc chắn sai (tính năng loại trừ trong Bluebook) trước khi cân nhắc hai đáp án còn lại.' },
] as const;
