/**
 * TỔNG HỢP PHƯƠNG PHÁP, LỘ TRÌNH VÀ TỦ SÁCH TÀI LIỆU SAT
 *
 * Dữ liệu nghiên cứu sâu từ:
 * 1. Google Spreadsheet tài liệu SAT (SAT by Springboard & College Board).
 * 2. Giáo trình "SAT Reading & Writing — Đường tới 700+ trong 16 tuần".
 * 3. Giáo trình "SAT Math — Đường tới 700+ trong 20 tuần".
 * 4. 27 tựa sách kinh điển: Erica Meltzer, The College Panda, Princeton Review, Barron's, McGraw-Hill...
 */

export type SatMethodStep = {
  step: number;
  titleVi: string;
  titleEn: string;
  summaryVi: string;
  summaryEn: string;
  tips: string[];
};

export const SAT_5_STEP_METHOD: SatMethodStep[] = [
  {
    step: 1,
    titleVi: 'Đọc stem câu hỏi trước',
    titleEn: 'Read the Question Stem First',
    summaryVi: 'Xác định chính xác dạng bài và mục tiêu câu hỏi trước khi chạm vào đoạn văn.',
    summaryEn: 'Identify the exact question type and target before touching the passage text.',
    tips: [
      'Phân biệt ngay câu hỏi hỏi từ vựng ("most nearly means"), chức năng ("main purpose of the text"), hay suy luận ("most logically completes the text").',
      'Với câu Rhetorical Synthesis (ghi chú bullet points): đọc dòng mục tiêu ở cuối ("The student wants to...") để bỏ qua 80% thông tin thừa.'
    ]
  },
  {
    step: 2,
    titleVi: 'Đọc chủ động & Quét manh mối định hướng',
    titleEn: 'Read Actively & Spot Directional Clues',
    summaryVi: 'Tìm từ nối (transitions), dấu câu mang tính bước ngoặt, và sắc thái thái độ.',
    summaryEn: 'Spot transition markers, structural punctuation, and positive/negative tone shifts.',
    tips: [
      'Khoanh vùng từ nối xoay chiều (however, nonetheless, yet) — ý chính thường nằm ngay sau từ nối đối lập.',
      'Chú ý dấu hai chấm (:) và gạch ngang (—): vế sau luôn giải thích hoặc định nghĩa cho vế trước.'
    ]
  },
  {
    step: 3,
    titleVi: 'Tự dự đoán câu trả lời (Prediction)',
    titleEn: 'Formulate Your Own Prediction',
    summaryVi: 'Tự nghĩ ra một từ hoặc cụm từ tương đương TRƯỚC KHI nhìn 4 phương án A/B/C/D.',
    summaryEn: 'Form an anticipated answer in your mind BEFORE looking at choices A/B/C/D.',
    tips: [
      'Với Words in Context: thay chỗ trống bằng một từ tiếng Anh đơn giản (ví dụ: "harmful", "supports", "proves").',
      'Bước này triệt tiêu hoàn toàn bẫy distractor — không bị đáp án sai "thao túng tâm lý".'
    ]
  },
  {
    step: 4,
    titleVi: 'Loại trừ có phương pháp (POE)',
    titleEn: 'Process of Elimination (POE)',
    summaryVi: 'Tìm lý do để LOẠI 3 phương án sai thay vì cố tìm phương án nghe xuôi tai.',
    summaryEn: 'Find factual flaws to eliminate 3 wrong options instead of looking for what sounds nice.',
    tips: [
      '4 kiểu bẫy kinh điển: Quá rộng (Too Broad), Quá hẹp (Too Narrow), Đảo ngược quan hệ (Reversed Causation), và Vô căn cứ (Not in Text / Extreme).',
      'Chỉ cần 1 từ trong phương án sai thực tế là cả phương án đó bị loại ngay lập tức.'
    ]
  },
  {
    step: 5,
    titleVi: 'Kiểm chứng bằng chứng trực tiếp',
    titleEn: 'Verify with Direct Evidence',
    summaryVi: 'Phương án đúng luôn có cụm từ paraphrase chính xác 1:1 với đoạn văn.',
    summaryEn: 'The correct choice always has a direct, verifiable paraphrase in the passage.',
    tips: [
      'Không dựa vào suy đoán ngoài đời hoặc kiến thức chung của bạn.',
      'Mọi câu đúng đều phải chỉ ra được dòng / câu chứa chứng cứ trong đoạn.'
    ]
  }
];

export const SAT_CONTEXT_CLUES = [
  { nameVi: 'Đòn bẩy tương phản (Contrast)', signal: 'however, yet, although, while, conversely, by contrast', ruleVi: 'Nghĩa chỗ trống TRÁI NGƯỢC với từ khóa vế kia.' },
  { nameVi: 'Diễn giải đồng nghĩa (Restatement)', signal: 'in other words, that is, simply put, essentially', ruleVi: 'Nghĩa chỗ trống LẶP LẠI ý của vế trước bằng từ ngữ khác.' },
  { nameVi: 'Nguyên nhân – Kết quả (Cause & Effect)', signal: 'because, since, therefore, consequently, thus', ruleVi: 'Chỗ trống là hệ quả trực tiếp từ nguyên nhân đã nêu.' },
  { nameVi: 'Ví dụ cụ thể (Exemplification)', signal: 'for example, for instance, such as, specifically', ruleVi: 'Đọc kỹ ví dụ để rút ngược lại đặc điểm của khái niệm tổng quát.' },
  { nameVi: 'Định nghĩa & Đồng vị ngữ (Appositive)', signal: 'dấu gạch ngang (—), dấu phẩy kép (,), mệnh đề quan hệ', ruleVi: 'Phần nằm giữa hai dấu phẩy giải thích thẳng nghĩa của danh từ trước đó.' },
  { nameVi: 'Âm điệu & Thái độ (Tone & Charge)', signal: 'khen ngợi (+), phê phán (-), hoài nghi (neutral)', ruleVi: 'Xác định sắc thái tích cực hay tiêu cực để loại 2-3 phương án lệch tông.' },
  { nameVi: 'Từ đi kèm cố định (Collocation)', signal: 'giới từ đi kèm (to, of, with, in)', ruleVi: 'Cân nhắc động từ hay tính từ nào kết hợp tự nhiên với giới từ có sẵn.' }
];

export const SAT_TRANSITION_GROUPS = [
  { groupVi: 'Tương phản / Đổi hướng', words: ['however', 'nevertheless', 'nonetheless', 'conversely', 'on the other hand', 'by contrast', 'still', 'yet'] },
  { groupVi: 'Hệ quả / Kết luận', words: ['therefore', 'thus', 'consequently', 'as a result', 'hence', 'accordingly'] },
  { groupVi: 'Bổ sung / Đồng thuận', words: ['furthermore', 'moreover', 'in addition', 'additionally', 'likewise', 'similarly'] },
  { groupVi: 'Ví dụ minh họa', words: ['for example', 'for instance', 'to illustrate'] },
  { groupVi: 'Làm rõ / Diễn giải', words: ['that is', 'in other words', 'specifically', 'to clarify'] },
  { groupVi: 'Nhấn mạnh / Thực tế', words: ['in fact', 'indeed', 'actually', 'certainly'] },
  { groupVi: 'Thời gian / Thứ tự', words: ['previously', 'subsequently', 'meanwhile', 'thereafter', 'eventually'] },
  { groupVi: 'Phương án thay thế', words: ['instead', 'alternatively', 'otherwise'] },
  { groupVi: 'Tóm lược', words: ['in summary', 'in short', 'overall', 'in conclusion'] }
];

export const SAT_DESMOS_TECHNIQUES = [
  {
    nameVi: 'Giao điểm giải hệ phương trình',
    useVi: 'Nhập thẳng hai phương trình (kể cả bậc nhất, parabol, đường tròn). Nhấp chuột vào giao điểm để đọc nghiệm (x, y) tức thì.',
    shortcut: 'y = f(x) & y = g(x) ⇒ click intersection points'
  },
  {
    nameVi: 'Thanh trượt Slider tìm tham số k',
    useVi: 'Khi đề hỏi "phương trình có đúng 1 nghiệm / vô nghiệm khi k bằng bao nhiêu", gõ phương trình chứa k rồi trượt slider để thấy đáp số.',
    shortcut: 'Add Slider: k ∈ [-10, 10]'
  },
  {
    nameVi: 'Hồi quy tự động (Regression ~)',
    useVi: 'Nhập bảng số liệu (x1, y1), sau đó gõ công thức y1 ~ mx1 + b hoặc y1 ~ a(x1 - h)^2 + k. Desmos tìm chính xác hệ số và R^2.',
    shortcut: 'Table (x1, y1) & y1 ~ mx1 + b'
  },
  {
    nameVi: 'Tìm nghiệm phương trình một ẩn phức tạp',
    useVi: 'Chuyển toàn bộ vế phải sang vế trái để thành F(x) = 0. Gõ y = F(x) vào Desmos; hoành độ giao điểm với trục Ox chính là nghiệm x.',
    shortcut: 'y = [Left Side] - [Right Side] ⇒ read x-intercept'
  }
];

export const SAT_RW_16_WEEK_ROADMAP = [
  { phase: 'Chặng 1: Nền tảng ngữ pháp & Dấu câu', weeks: 'Tuần 1 – 4', target: 'Nắm chắc 100% câu Standard English Conventions', items: ['Ranh giới câu, comma splice & run-on', 'Hoà hợp chủ - vị và bẫy cụm giới từ chen ngang', 'Bổ ngữ lơ lửng (dangling modifiers)', 'Dấu câu nâng cao: dấu hai chấm (:), chấm phẩy (;), gạch ngang (—)'] },
  { phase: 'Chặng 2: Từ vựng & Logic liên kết', weeks: 'Tuần 5 – 8', target: 'Làm chủ Words in Context & Transitions', items: ['7 kỹ thuật đọc manh mối ngữ cảnh (context clues)', '9 họ từ nối logic và bảng khoá đúng', 'Rhetorical synthesis: bắt mạch câu hỏi mục tiêu', 'Tích luỹ 300 từ vựng học thuật lõi'] },
  { phase: 'Chặng 3: Đọc hiểu chuyên sâu & Bằng chứng', weeks: 'Tuần 9 – 12', target: 'Chinh phục Information and Ideas', items: ['Xác định ý chính và cấu trúc đoạn văn (Text Structure)', 'Suy luận logic (Inferences) — bẫy suy diễn quá đà', 'Bằng chứng định lượng (Command of Evidence - Quantitative: đọc biểu đồ/bảng)', 'Bằng chứng văn học và khoa học (Cross-Text Connections)'] },
  { phase: 'Chặng 4: Tăng tốc & Thực chiến Module 2 Khó', weeks: 'Tuần 13 – 16', target: 'Chinh phục 700+ Reading & Writing', items: ['Phân tích bẫy Module 2 thích ứng (Hard module traps)', 'Canh thời gian chuẩn: 71 giây/câu', 'Luyện 5 đề thi thật hoàn chỉnh bấm giờ', 'Sửa sổ tay lỗi sai (Error Log Review)'] }
];

export const SAT_MATH_20_WEEK_ROADMAP = [
  { phase: 'Chặng 1: Đại số nền tảng (Algebra)', weeks: 'Tuần 1 – 5', target: 'Làm chủ 35% đề thi với độ chính xác tuyệt đối', items: ['Phương trình và hệ phương trình bậc nhất hai ẩn', 'Ý nghĩa của hệ số góc m và tung độ gốc b trong ngữ cảnh thực tế', 'Bất phương trình và miền nghiệm', 'Kỹ thuật Desmos giải hệ phương trình trong 10 giây'] },
  { phase: 'Chặng 2: Toán nâng cao (Advanced Math)', weeks: 'Tuần 6 – 10', target: 'Làm chủ 35% đề thi tiếp theo', items: ['Phương trình bậc hai, biệt thức Delta và số nghiệm', 'Đỉnh parabol (Vertex Form) và bài toán cực trị', 'Hàm mũ và tăng trưởng/suy giảm mũ (Exponential growth/decay)', 'Chia đa thức và định lý số dư'] },
  { phase: 'Chặng 3: Giải quyết vấn đề & Số liệu (Data Analysis)', weeks: 'Tuần 11 – 14', target: 'Tránh toàn bộ bẫy ngôn ngữ đề bài (15% đề thi)', items: ['Tỉ lệ thức, đổi đơn vị liên hoàn (unit conversions)', 'Phần trăm tăng/giảm và phần trăm điểm (percentage points)', 'Thống kê: Mean, Median, Range, Standard Deviation', 'Xác suất có điều kiện và khoảng tin cậy (Margin of Error)'] },
  { phase: 'Chặng 4: Hình học & Lượng giác (Geometry & Trig)', weeks: 'Tuần 15 – 17', target: 'Lấy trọn điểm 15% câu hình học', items: ['Tam giác đồng dạng, tam giác vuông đặc biệt', 'Tỉ số lượng giác sin, cos, tan và góc phụ nhau sin(x) = cos(90°-x)', 'Phương trình đường tròn chuẩn (x-h)^2 + (y-k)^2 = r^2', 'Hình học không gian: diện tích xung quanh và thể tích'] },
  { phase: 'Chặng 5: Đột phá 750 – 800 Math', weeks: 'Tuần 18 – 20', target: 'Hoàn thiện điểm tuyệt đối SAT Math', items: ['Tuyệt kỹ bấm máy Desmos nâng cao (Sliders, Regressions)', '40 bẫy từ vựng toán tiếng Anh', 'Luyện đề phân tầng khó (Module 2 Hard Tests)', 'Tập thói quen kiểm tra kép (Double-check routine)'] }
];

export const SAT_BOOK_CATALOG = [
  { id: '1', title: 'The Critical Reader (Digital SAT Reading)', author: 'Erica L. Meltzer', category: 'Reading', level: 'Tất cả trình độ', note: 'Kinh điển số 1 về SAT Reading. Phân tích chi tiết từng dạng câu hỏi và cách đọc văn bản học thuật.' },
  { id: '2', title: 'The Ultimate Guide to SAT Grammar', author: 'Erica L. Meltzer', category: 'Grammar', level: 'Mới bắt đầu → Nâng cao', note: 'Quy chuẩn vàng về ngữ pháp SAT. Hệ thống toàn bộ quy tắc ranh giới câu, dấu câu, và hoà hợp chủ-vị.' },
  { id: '3', title: 'The College Panda SAT Math Advanced Guide', author: 'Nielson Phu', category: 'Math', level: 'Mục tiêu 700+ Math', note: 'Giáo trình toán SAT xuất sắc nhất với 27 chương chuyên đề và bài tập rèn phản xạ tư duy.' },
  { id: '4', title: 'The College Panda SAT Writing', author: 'Nielson Phu', category: 'Writing', level: 'Trung cấp → Nâng cao', note: 'Giải thích súc tích, bài tập thực hành dày đặc, phân loại bẫy ngữ pháp rõ ràng.' },
  { id: '5', title: 'Digital SAT Premium Prep', author: 'The Princeton Review', category: 'Tổng hợp', level: 'Mới bắt đầu', note: 'Cung cấp cái nhìn toàn cảnh về format Digital SAT, bài thi thử chuẩn mẫu và hướng dẫn công cụ Bluebook.' },
  { id: '6', title: 'Barron’s Digital SAT Study Guide & Math Workbook', author: 'Barron’s Educational Series', category: 'Tổng hợp / Math', level: 'Trung cấp → Nâng cao', note: 'Kho bài tập khổng lồ với độ khó nhỉnh hơn đề thật, rất tốt để rèn sức bền tư duy.' },
  { id: '7', title: 'McGraw-Hill 500 Questions to Know by Test Day', author: 'McGraw-Hill', category: 'Reading & Writing', level: 'Nâng cao', note: 'Tập hợp các câu hỏi đọc hiểu suy luận và từ vựng phân loại cao cho chặng về đích.' },
  { id: '8', title: '550 Words to Know for the Digital SAT', author: 'The Princeton Review', category: 'Vocabulary', level: 'Tất cả trình độ', note: '550 từ vựng học thuật then chốt xuất hiện với tần suất cao nhất trong đề thi Digital SAT.' },
  { id: '9', title: 'Digital SAT Math Orange Book', author: '1600.io', category: 'Math', level: 'Toàn diện', note: 'Bộ sách toán đi sâu vào bản chất từng công thức và phân loại bài tập từ dễ đến cực khó.' },
  { id: '10', title: 'Acing the New SAT Math', author: 'Greenhall Publishing', category: 'Math', level: 'Luyện đề nâng cao', note: 'Bám sát đề thi thật với các câu toán tư duy thực chiến và nhiều dạng bài bẫy.' },
  { id: '11', title: 'Dr. Jang’s SAT 800 Math Workbook', author: 'Dr. Jang', category: 'Math', level: 'Mục tiêu 800 Math', note: 'Hơn 1500 bài toán được phân tầng chặt chẽ dành cho học sinh quyết tâm lấy điểm tuyệt đối.' },
  { id: '12', title: 'SAT Suite Question Bank (Official)', author: 'College Board', category: 'Đề thi chính thức', level: 'Bắt buộc phải làm', note: 'Kho câu hỏi chính thức lớn nhất của đơn vị ra đề với phân loại Domain và độ khó Easy/Medium/Hard.' },
  { id: '13', title: 'Kho Đề Thi Thật SAT (2023 – 2025)', author: 'Springboard & Tổng hợp', category: 'Đề thi thật', level: 'Thực chiến', note: 'Tuyển tập các đề thi thật được giải chi tiết từng bước, phân tích vì sao đúng và bẫy vì sao sai.' }
];
