/**
 * SAT study methods, suggested pacing, and sources reviewed in the app.
 * Current College Board specifications and Khan Academy courses are the
 * blueprint and skills spine; supplied books are listed as supplements.
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
    titleVi: 'Xác định việc câu hỏi yêu cầu',
    titleEn: 'Identify the task',
    summaryVi: 'Nhận diện dạng câu hỏi. Với câu có ghi chú, đọc mục tiêu của người viết; với câu ngữ pháp, xác định phần câu cần sửa.',
    summaryEn: 'Identify the question type. For note-based questions, read the stated goal; for grammar questions, locate the part of the sentence being tested.',
    tips: [
      'Phân biệt Words in Context, mục đích/cấu trúc, suy luận, bằng chứng, chuyển ý và quy tắc ngữ pháp.',
      'Với Rhetorical Synthesis, đọc mục tiêu rồi chỉ chọn ghi chú cần thiết để đạt mục tiêu đó.'
    ]
  },
  {
    step: 2,
    titleVi: 'Đọc đoạn hoặc câu có liên quan',
    titleEn: 'Read the relevant text',
    summaryVi: 'Tìm quan hệ giữa các ý, cấu trúc câu, từ khóa và bằng chứng cần cho đúng câu hỏi.',
    summaryEn: 'Look for the relationship between ideas, sentence structure, key terms, and evidence relevant to the task.',
    tips: [
      'Từ nối như however, therefore, moreover gợi quan hệ giữa hai ý; đừng kết luận chỉ từ một từ đơn lẻ.',
      'Dấu hai chấm, chấm phẩy và gạch ngang phải được xét theo cấu trúc hai phía, không theo mẹo cố định.'
    ]
  },
  {
    step: 3,
    titleVi: 'Dự đoán quan hệ hoặc quy tắc',
    titleEn: 'Predict the relationship or rule',
    summaryVi: 'Tự nêu nghĩa/quan hệ có thể có, quy tắc cần dùng, hoặc loại bằng chứng cần tìm trước khi chốt lựa chọn.',
    summaryEn: 'State the likely meaning, relationship, rule, or kind of evidence before settling on a choice.',
    tips: [
      'Với Words in Context, thử một từ đơn giản có cùng nghĩa; với chuyển ý, gọi tên quan hệ logic.',
      'Dự đoán giúp so sánh đáp án, nhưng vẫn cần kiểm chứng bằng ngữ cảnh và ngữ pháp.'
    ]
  },
  {
    step: 4,
    titleVi: 'So sánh các lựa chọn với tiêu chí',
    titleEn: 'Compare choices against the criteria',
    summaryVi: 'Loại lựa chọn lệch nghĩa, sai quy tắc, không đủ bằng chứng hoặc không đáp ứng mục tiêu.',
    summaryEn: 'Eliminate choices that mismatch the meaning, rule, evidence, or stated goal.',
    tips: [
      'Kiểm tra phạm vi, quan hệ logic, tính chính xác và mức độ chắc chắn của từng lựa chọn.',
      'Một chi tiết đúng vẫn có thể sai nếu không trả lời đúng câu hỏi.'
    ]
  },
  {
    step: 5,
    titleVi: 'Kiểm chứng bằng chứng hoặc quy tắc',
    titleEn: 'Verify with evidence or a rule',
    summaryVi: 'Đối chiếu câu trả lời với chi tiết trong đoạn, cấu trúc ngữ pháp hoặc mục tiêu giao tiếp của câu hỏi.',
    summaryEn: 'Check the choice against passage evidence, sentence grammar, or the question’s communicative goal.',
    tips: [
      'Không thêm giả định ngoài văn bản khi câu hỏi yêu cầu suy luận từ đoạn.',
      'Với câu ngữ pháp, kiểm tra toàn bộ câu; với câu đọc hiểu, xác định chi tiết nâng đỡ kết luận.'
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
  { phase: 'Chặng 1: Chẩn đoán & Standard English Conventions', weeks: 'Tuần 1 – 4', target: 'Xây nền câu và dấu câu; điều chỉnh số buổi theo điểm yếu đầu vào.', items: ['Tuần 1: làm bài chẩn đoán Bluebook, gắn lỗi vào 4 domain', 'Ranh giới mệnh đề: câu hoàn chỉnh, comma splice, run-on', 'Form, structure, and sense: thành phần câu, hòa hợp chủ-vị, bổ ngữ', 'Đại từ, thì/dạng động từ, danh từ số nhiều và sở hữu cách'] },
  { phase: 'Chặng 2: Expression of Ideas & Craft and Structure', weeks: 'Tuần 5 – 8', target: 'Luyện mục tiêu giao tiếp và nghĩa từ/cấu trúc trong đoạn ngắn.', items: ['Transitions: xác định quan hệ logic giữa hai ý', 'Rhetorical synthesis: dùng ghi chú theo đúng mục tiêu', 'Words in Context: suy nghĩa bằng ngữ cảnh và sắc thái', 'Text structure/purpose và cross-text connections'] },
  { phase: 'Chặng 3: Information and Ideas', weeks: 'Tuần 9 – 12', target: 'Củng cố ý chính, bằng chứng và suy luận có căn cứ.', items: ['Central ideas and details: phân biệt ý chính với chi tiết', 'Command of textual evidence: chọn bằng chứng phù hợp nhận định', 'Quantitative evidence: đọc tiêu đề, đơn vị, nhóm và quan hệ số liệu', 'Inferences: kết luận hẹp nhất được văn bản hỗ trợ'] },
  { phase: 'Chặng 4: Luyện hỗn hợp & mô phỏng', weeks: 'Tuần 13 – 16', target: 'Kết hợp domain, thời gian và sửa lỗi theo dữ liệu cá nhân.', items: ['Bộ câu hỗn hợp theo 4 domain; ưu tiên domain yếu', 'Luyện mini-module có bấm giờ, sau khi độ chính xác ổn định', 'Làm đề đầy đủ trên Bluebook và rà từng lỗi/đáp án đoán', 'Dùng Student Question Bank để kiểm tra lại đúng kỹ năng còn yếu'] }
];

export const SAT_MATH_20_WEEK_ROADMAP = [
  { phase: 'Chặng 1: Chẩn đoán & Algebra', weeks: 'Tuần 1 – 5', target: 'Ưu tiên domain khoảng 35% bài thi; bắt đầu ở Foundation theo kết quả chẩn đoán.', items: ['Tuần 1: làm bài chẩn đoán Bluebook, phân loại lỗi theo domain/kỹ năng', 'Phương trình tuyến tính, hệ phương trình và bài toán có lời', 'Bất phương trình tuyến tính, đồ thị và hệ bất phương trình', 'Đường thẳng, hệ số góc, giao điểm và diễn giải mô hình tuyến tính'] },
  { phase: 'Chặng 2: Advanced Math', weeks: 'Tuần 6 – 10', target: 'Ưu tiên domain khoảng 35%; tiến từ biểu thức đến hàm và phương trình phi tuyến.', items: ['Biến đổi biểu thức, phân tích nhân tử và đa thức', 'Lũy thừa, căn thức và số mũ hữu tỉ', 'Phương trình/hệ phi tuyến, hàm bậc hai và đồ thị parabol', 'Hàm mũ, mô hình tăng/giảm và bài toán trong ngữ cảnh'] },
  { phase: 'Chặng 3: Problem-Solving and Data Analysis', weeks: 'Tuần 11 – 14', target: 'Domain khoảng 15%; luyện đọc đúng đại lượng, đơn vị và nhóm dữ liệu.', items: ['Tỉ lệ, tốc độ, tỉ lệ thức và đổi đơn vị', 'Phần trăm, phần trăm thay đổi và mô hình tăng trưởng', 'Bảng, biểu đồ, scatterplot, đường xu hướng và thống kê mô tả', 'Xác suất, mẫu khảo sát, suy luận và đánh giá nhận định thống kê'] },
  { phase: 'Chặng 4: Geometry and Trigonometry', weeks: 'Tuần 15 – 17', target: 'Domain khoảng 15%; tập trung công thức, hình vẽ và lượng giác tam giác vuông.', items: ['Góc, đường thẳng song song, tam giác và đồng dạng', 'Diện tích, chu vi, thể tích và bài toán hình trong ngữ cảnh', 'Đường tròn: phương trình, bán kính, chu vi/diện tích', 'Sin, cos, tan trong tam giác vuông; nhận diện dữ kiện và đơn vị'] },
  { phase: 'Chặng 5: Luyện hỗn hợp & thích ứng', weeks: 'Tuần 18 – 20', target: 'Giữ đủ 4 domain trong mỗi tuần; không bỏ hẳn domain đã học.', items: ['Luyện bộ hỗn hợp theo tỉ trọng gần blueprint và nhãn độ khó', 'Luyện quyết định dùng máy tính/Desmos, gắn cờ và quay lại câu hỏi', 'Làm full-length test trong Bluebook, rà câu sai và câu đoán', 'Giữ synthetic division và complex numbers ở mục mở rộng tùy chọn, không làm điều kiện hoàn thành core'] }
];

export type SatBookResource = {
  id: string;
  title: string;
  author: string;
  category: string;
  level: string;
  note: string;
  url?: string;
};

export const SAT_BOOK_CATALOG: SatBookResource[] = [
  { id: 'CB', title: 'Digital SAT blueprint, Student Question Bank & Bluebook', author: 'College Board', category: 'Nguồn chính thức', level: 'Chuẩn đối chiếu', url: 'https://satsuite.collegeboard.org/practice/content-domains', note: 'Nguồn chuẩn cho format, bốn domain mỗi phần, câu hỏi chính thức và bài thi thử thích ứng. Chỉ gắn nhãn “official” cho câu hỏi đã xác minh từ College Board.' },
  { id: 'KA-RW', title: 'Digital SAT Reading and Writing', author: 'Khan Academy', category: 'Khóa học', level: '12 units · 47 targets', url: 'https://www.khanacademy.org/sat-reading-and-writing', note: 'Khung kỹ năng chính cho Verbal; luyện theo ba mức, sáu kỹ năng challenge và tám bài grammar practice.' },
  { id: 'KA-M', title: 'Digital SAT Math', author: 'Khan Academy', category: 'Khóa học', level: '13 units · 111 targets', url: 'https://www.khanacademy.org/test-prep/v2-sat-math?lang=en', note: 'Khung chính theo bốn domain và ba mức Foundation, Medium, Advanced. Band 9 hiện gom các mục tiêu nhỏ vào 19 kỹ năng rộng hơn.' },
  { id: '1', title: 'The Critical Reader: The Complete Guide to SAT Reading, 2nd Edition', author: 'Erica L. Meltzer · 2015', category: 'Reading', level: 'Bổ trợ chiến lược', note: 'Dùng các chủ điểm bằng chứng, suy luận, từ trong ngữ cảnh, mục đích và cấu trúc. Sách theo format dài trước Digital SAT; bài tập trong app cần giữ dạng đoạn ngắn, một câu hỏi.' },
  { id: '2', title: 'The College Panda SAT Math Advanced Guide and Workbook', author: 'Nielson Phu · 2015', category: 'Math', level: '25 trọng tâm + 2 mở rộng', note: 'Lộ trình 27 chương của app theo thứ tự chủ đề trong sách. Chia đa thức và số phức được tách thành phần mở rộng, không phải chặng bắt buộc của core blueprint.' },
  { id: '3', title: "Erica's Vocabulary: A New Approach", author: 'Erica L. Meltzer', category: 'Vocabulary', level: 'Bổ trợ Words in Context', note: 'Dùng nhóm nghĩa và ví dụ để ôn từ; ưu tiên suy luận nghĩa từ đoạn và từ vựng xuất hiện trong luyện tập chính thức.' },
  { id: '4', title: 'SAT Power Vocab', author: 'The Princeton Review · 2017', category: 'Vocabulary', level: 'Bổ trợ', note: 'Có thể dùng cách học gốc từ, ghi nhớ và thuật ngữ Toán. Danh sách từ cũ không phải danh sách tần suất chính thức của Digital SAT.' },
  { id: '5', title: '1100 Words You Need to Know, 6th Edition', author: 'Barron’s', category: 'Vocabulary', level: 'Từ vựng học thuật', note: 'Chọn từ học thuật hữu ích để ôn cách quãng và đặt câu theo ngữ cảnh; không bắt buộc học đủ 1.100 từ để đạt chuẩn SAT.' },
  { id: '6', title: 'Vocabook by @satashkent', author: '@satashkent', category: 'Vocabulary', level: 'Bộ ôn bổ sung', note: 'Tham khảo theo set và ví dụ; giữ lịch ôn lặp lại, không coi danh sách trong sách là blueprint của College Board.' },
  { id: '7', title: '500 C1–C2 Words from Vocabulary-in-Context Questions', author: 'VietAccepted', category: 'Vocabulary', level: 'Bổ trợ nâng cao', note: 'Dùng từ chọn lọc và câu ví dụ tự viết để mở rộng vốn từ; cần đối chiếu tần suất với các câu hỏi Digital SAT chính thức.' },
];
