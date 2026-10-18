/**
 * KẾ HOẠCH HỌC TẬP DIGITAL SAT TỪNG NGÀY (DAILY SAT STUDY PLAN)
 *
 * Thiết kế theo nhịp học thực chiến 30 ngày (Cấp tốc 1400+) & 60 ngày (Chinh phục 1500+):
 * Mỗi ngày có:
 * - Mục tiêu trọng tâm (Daily Focus)
 * - Bài học & bài tập Reading / Writing
 * - Dạng bài Toán & kỹ thuật Desmos
 * - 15-20 Từ vựng học thuật trích từ đề thi
 * - Đoạn văn đọc song ngữ kèm chú giải
 * - Mẹo thực chiến (Pro Tips) từ giáo viên 1580 SAT
 */

export type DailySatTask = {
  day: number;
  week: number;
  phase: 'Nền tảng' | 'Tăng tốc' | 'Bứt phá 1500+' | 'Về đích';
  titleVi: string;
  titleEn: string;
  focusVi: string;
  focusEn: string;
  estimatedMinutes: number;
  rw: {
    skill: string;
    topicVi: string;
    topicEn: string;
    actionVi: string;
    href: string;
    practiceSet: string;
  };
  math: {
    domain: string;
    topicVi: string;
    topicEn: string;
    desmosTipVi: string;
    href: string;
    practiceChapter: string;
  };
  vocab: {
    unitNameVi: string;
    words: string[];
    quizHref: string;
  };
  bilingualReading?: {
    title: string;
    source: string;
    enPassage: string;
    viPassage: string;
    keyTerms: { en: string; vi: string }[];
  };
  proTipVi: string;
};

export const SAT_30_DAY_STUDY_PLAN: DailySatTask[] = [
  // TUẦN 1: NỀN TẢNG NGỮ PHÁP & ĐẠI SỐ TUYẾN TÍNH
  {
    day: 1,
    week: 1,
    phase: 'Nền tảng',
    titleVi: 'Ngày 1: Ranh giới câu (Punctuation) & Đại số 1 ẩn',
    titleEn: 'Day 1: Sentence Boundaries & Linear Equations',
    focusVi: 'Nắm chắc 100% câu dấu câu; làm chủ phương trình bậc nhất một ẩn.',
    focusEn: 'Master sentence boundary punctuation; perfect 1-variable linear equations.',
    estimatedMinutes: 60,
    rw: {
      skill: 'boundaries',
      topicVi: 'Ranh giới câu: Dấu phẩy, chấm phẩy & liên từ FANBOYS',
      topicEn: 'Sentence Boundaries: Commas, Semicolons & FANBOYS',
      actionVi: 'Học lý thuyết nhận diện 2 mệnh đề độc lập; làm 12 câu bộ Học Unit 1.',
      href: '/sat-rw/skill/boundaries',
      practiceSet: 'satrw-u1-learn',
    },
    math: {
      domain: 'Algebra',
      topicVi: 'Phương trình bậc nhất 1 ẩn: Chuyển vế, khử mẫu & nghiệm ngoại lai',
      topicEn: 'Linear Equations in 1 Variable: Moving terms & extraneous solutions',
      desmosTipVi: 'Gõ trực tiếp pt vào Desmos; hoành độ giao điểm với Ox chính là nghiệm x.',
      href: '/sat/lo-trinh/solving-equations',
      practiceChapter: 'solving-equations',
    },
    vocab: {
      unitNameVi: '30 Từ vựng lập luận, bằng chứng & giả thuyết',
      words: ['assert', 'corroborate', 'hypothesis', 'substantiate', 'empirical', 'refute'],
      quizHref: '/vocabulary/sat-quiz?unit=sat-tang-1-unit-01',
    },
    bilingualReading: {
      title: 'Sự hình thành rạn san hô và nhiệt độ vi khí hậu',
      source: 'Marine Ecology Research (College Board 2024)',
      enPassage: 'Marine ecologists once treated minor temperature fluctuations in intertidal pools as background noise. However, continuous micro-sensor arrays demonstrated that shaded pools warmed significantly more slowly at midday, creating critical thermal refugia for benthic organisms.',
      viPassage: 'Các nhà sinh thái biển từng xem những biến động nhiệt độ nhỏ ở các vũng nước triều là nhiễu nền. Tuy nhiên, các mảng cảm biến siêu nhỏ liên tục đã chứng minh rằng các vũng nước có bóng râm ấm lên chậm hơn đáng kể vào giữa trưa, tạo ra các khu bảo tồn nhiệt quan trọng cho các sinh vật đáy.',
      keyTerms: [
        { en: 'fluctuations', vi: 'sự dao động, biến động' },
        { en: 'micro-sensor arrays', vi: 'mảng cảm biến siêu nhỏ' },
        { en: 'thermal refugia', vi: 'khu vực trú ẩn nhiệt độ' },
        { en: 'benthic organisms', vi: 'sinh vật đáy biển' },
      ],
    },
    proTipVi: 'Bẫy dấu phẩy: Dấu phẩy KHÔNG BAO GIỜ được đứng một mình nối hai mệnh đề độc lập (Comma Splice). Luôn dùng chấm phẩy (;), gạch ngang (—), hoặc phẩy + FANBOYS.',
  },
  {
    day: 2,
    week: 1,
    phase: 'Nền tảng',
    titleVi: 'Ngày 2: Hoà hợp Chủ - Vị & Hệ phương trình 2 ẩn',
    titleEn: 'Day 2: Subject-Verb Agreement & Linear Systems',
    focusVi: 'Triệt tiêu bẫy cụm giới từ chen ngang; giải hệ pt bằng giao điểm Desmos.',
    focusEn: 'Eliminate prepositional phrase traps; solve linear systems via Desmos intersections.',
    estimatedMinutes: 60,
    rw: {
      skill: 'form',
      topicVi: 'Hoà hợp Chủ - Vị: Bỏ qua cụm giới từ chen ngang',
      topicEn: 'Subject-Verb Agreement: Ignoring Intervening Prepositional Phrases',
      actionVi: 'Gạch chân chủ ngữ thật, bỏ qua cụm từ nằm giữa dấu phẩy kép hoặc giới từ.',
      href: '/sat-rw/skill/form',
      practiceSet: 'satrw-u2-learn',
    },
    math: {
      domain: 'Algebra',
      topicVi: 'Hệ phương trình bậc nhất 2 ẩn: Vô nghiệm, vô số nghiệm & nghiệm duy nhất',
      topicEn: 'Systems of Linear Equations: No solution, infinite solutions, unique solution',
      desmosTipVi: 'Nhập cả 2 pt vào Desmos. Nhấp chuột vào giao điểm để đọc cặp nghiệm (x, y) trong 5 giây.',
      href: '/sat/lo-trinh/systems-of-equations',
      practiceChapter: 'systems-of-equations',
    },
    vocab: {
      unitNameVi: '30 Từ vựng xu hướng, chuyển động & biến đổi',
      words: ['fluctuate', 'accelerate', 'stagnate', 'evolve', 'precipitate', 'oscillate'],
      quizHref: '/vocabulary/sat-quiz?unit=sat-tang-1-unit-02',
    },
    bilingualReading: {
      title: 'Tập tính săn mồi của loài dơi và sóng siêu âm',
      source: 'Animal Behavior Journal (Princeton Review)',
      enPassage: 'Echolocating bats emit modulated ultrasonic pulses to construct high-resolution spatial maps of their surroundings. Certain moth species have evolved acoustic countermeasures, generating disruptive clicks that either jam the bats sensory perception or advertise distasteful chemical defenses.',
      viPassage: 'Dơi định vị bằng tiếng vang phát ra các xung siêu âm điều biến để xây dựng bản đồ không gian độ phân giải cao về môi trường xung quanh. Một số loài bướm đêm đã tiến hóa các biện pháp đối phó âm thanh, tạo ra các tiếng click gây nhiễu làm nghẽn nhận thức cảm giác của dơi hoặc quảng bá các chất độc hóa học khó chịu.',
      keyTerms: [
        { en: 'echolocating', vi: 'định vị bằng tiếng vang' },
        { en: 'spatial maps', vi: 'bản đồ không gian' },
        { en: 'countermeasures', vi: 'biện pháp đối phó' },
        { en: 'distasteful defenses', vi: 'cơ chế phòng vệ có vị khó chịu' },
      ],
    },
    proTipVi: 'Hệ phương trình vô nghiệm khi hai đường thẳng song song (cùng hệ số góc m1 = m2 nhưng khác tung độ gốc b1 ≠ b2). Vô số nghiệm khi hai đường thẳng trùng khít hoàn toàn.',
  },
  {
    day: 3,
    week: 1,
    phase: 'Nền tảng',
    titleVi: 'Ngày 3: Đại từ & Hệ số góc thực tế (Slope & Intercept)',
    titleEn: 'Day 3: Pronouns & Real-world Slope Interpretation',
    focusVi: 'Bẫy đại từ số ít/nhiều; hiểu rõ ý nghĩa thực tế của y = mx + b.',
    focusEn: 'Pronoun antecedent agreement; interpret real-world meaning of slope & intercept.',
    estimatedMinutes: 65,
    rw: {
      skill: 'pronoun',
      topicVi: 'Đại từ nhân xưng & Sở hữu: it vs they, its vs their',
      topicEn: 'Pronoun Agreement & Reference: it vs they, singular nouns',
      actionVi: 'Tìm danh từ gốc mà đại từ thay thế; các tổ chức/công ty là danh từ số ít (it/its).',
      href: '/sat-rw/skill/pronoun',
      practiceSet: 'satrw-u3-learn',
    },
    math: {
      domain: 'Algebra',
      topicVi: 'Hàm số bậc nhất: Ý nghĩa thực tế của hệ số góc m và tung độ gốc b',
      topicEn: 'Linear Functions: Contextual meaning of slope m and y-intercept b',
      desmosTipVi: 'Dùng y = mx + b với thanh trượt slider m và b để thấy đồ thị dịch chuyển.',
      href: '/sat/lo-trinh/linear-functions',
      practiceChapter: 'linear-functions',
    },
    vocab: {
      unitNameVi: '30 Từ vựng mức độ, phạm vi & tần suất',
      words: ['substantial', 'pervasive', 'marginal', 'ubiquitous', 'negligible', 'scant'],
      quizHref: '/vocabulary/sat-quiz?unit=sat-tang-1-unit-03',
    },
    proTipVi: 'Trong bài toán thực tế y = mx + b: b là giá trị ban đầu khi x = 0 (khởi điểm/phí cố định); m là tốc độ thay đổi trên mỗi 1 đơn vị của x (tăng thêm/giảm đi).',
  },
  {
    day: 4,
    week: 1,
    phase: 'Nền tảng',
    titleVi: 'Ngày 4: Thì động từ & Bất phương trình miền nghiệm',
    titleEn: 'Day 4: Verb Tenses & Linear Inequalities',
    focusVi: 'Nhận biết mốc thời gian trong câu; vẽ miền nghiệm bất phương trình.',
    focusEn: 'Identify timeline markers; graph linear inequality solution regions.',
    estimatedMinutes: 60,
    rw: {
      skill: 'tense',
      topicVi: 'Thì động từ: Nhất quán thì quá khứ đơn, hiện tại hoàn thành',
      topicEn: 'Verb Tenses: Simple past vs present perfect consistency',
      actionVi: 'Tìm từ chỉ thời gian (in 1850, since, currently) để cố định mốc thời gian.',
      href: '/sat-rw/skill/tense',
      practiceSet: 'satrw-u4-learn',
    },
    math: {
      domain: 'Algebra',
      topicVi: 'Bất phương trình bậc nhất & Hệ bất phương trình miền nghiệm',
      topicEn: 'Linear Inequalities & Systems of Inequalities',
      desmosTipVi: 'Nhập y > 2x - 3 và y <= -x + 5. Desmos sẽ tô màu miền giao nhau rõ ràng.',
      href: '/sat/lo-trinh/linear-inequalities',
      practiceChapter: 'linear-inequalities',
    },
    vocab: {
      unitNameVi: '30 Từ vựng nguyên nhân & hệ quả',
      words: ['catalyst', 'induce', 'engender', 'consequence', 'implication', 'preclude'],
      quizHref: '/vocabulary/sat-quiz?unit=sat-tang-1-unit-04',
    },
    proTipVi: 'Bất phương trình: Nhớ đảo chiều dấu bất đẳng thức (đang < thành >) khi nhân hoặc chia hai vế cho một số âm!',
  },
  {
    day: 5,
    week: 1,
    phase: 'Nền tảng',
    titleVi: 'Ngày 5: Bổ ngữ lơ lửng (Modifiers) & Tỉ lệ thức, Đổi đơn vị',
    titleEn: 'Day 5: Modifiers & Ratios, Rates, Unit Conversions',
    focusVi: 'Bẫy Dangling Modifier; đổi đơn vị liên hoàn không sợ nhầm nhân/chia.',
    focusEn: 'Master dangling modifier traps; dimensional analysis for multi-step unit conversions.',
    estimatedMinutes: 65,
    rw: {
      skill: 'form',
      topicVi: 'Bổ ngữ đầu câu: Chủ ngữ thật PHẢI đứng ngay sau dấu phẩy',
      topicEn: 'Introductory Modifiers: The real subject must immediately follow the comma',
      actionVi: 'Sau cụm "Walking down the street,...", chủ ngữ phải là người đi bộ, không thể là "the rain".',
      href: '/sat-rw/skill/form',
      practiceSet: 'satrw-u2-drill',
    },
    math: {
      domain: 'Problem Solving',
      topicVi: 'Tỉ lệ thức, tốc độ & đổi đơn vị bằng phương pháp phân số triệt tiêu',
      topicEn: 'Ratios, Rates & Multi-step Unit Conversions',
      desmosTipVi: 'Dùng Desmos tính toán phân số liên hoàn: (miles/hour) * (5280 ft/mile) * (1 hour/3600 sec).',
      href: '/sat/lo-trinh/ratios-rates-units',
      practiceChapter: 'ratios-rates-units',
    },
    vocab: {
      unitNameVi: '36 Động từ chức năng tu từ của tác giả (Tầng 1)',
      words: ['elucidate', 'substantiate', 'validate', 'exemplify', 'concur', 'advocate'],
      quizHref: '/vocabulary/sat-quiz?unit=sat-tang-3-unit-01',
    },
    proTipVi: 'Đổi đơn vị diện tích và thể tích: Nếu 1 yard = 3 feet, thì 1 yard vuông = 9 feet vuông (3^2), và 1 yard khối = 27 feet khối (3^3)!',
  },
  {
    day: 6,
    week: 1,
    phase: 'Nền tảng',
    titleVi: 'Ngày 6: Dấu câu nâng cao (:, —, ;) & Phần trăm tăng giảm',
    titleEn: 'Day 6: Advanced Punctuation & Percents',
    focusVi: 'Quy tắc vàng của dấu hai chấm (:); bẫy tăng x% rồi giảm x%.',
    focusEn: 'The golden rule of colons; avoid the classic percent increase/decrease trap.',
    estimatedMinutes: 70,
    rw: {
      skill: 'boundaries',
      topicVi: 'Dấu hai chấm (:) & gạch ngang đôi (—): Trước dấu hai chấm PHẢI là câu hoàn chỉnh',
      topicEn: 'Colons and Dashes: Full independent clause required before the colon',
      actionVi: 'Kiểm tra vế trước dấu hai chấm. Nếu vế trước là câu què (fragment) thì gạch ngay phương án đó.',
      href: '/sat-rw/skill/boundaries',
      practiceSet: 'satrw-u1-drill',
    },
    math: {
      domain: 'Problem Solving',
      topicVi: 'Phần trăm: Tăng/giảm phần trăm, giá trị sau thuế & phần trăm điểm',
      topicEn: 'Percentages: Percent increase/decrease, successive discounts, percentage points',
      desmosTipVi: 'Tăng 15% là nhân với 1.15; giảm 20% là nhân với 0.80. Không dùng công thức dài.',
      href: '/sat/lo-trinh/percent',
      practiceChapter: 'percent',
    },
    vocab: {
      unitNameVi: '36 Động từ phê phán & bác bỏ (Tầng 2)',
      words: ['undermine', 'refute', 'repudiate', 'debunk', 'challenge', 'concede'],
      quizHref: '/vocabulary/sat-quiz?unit=sat-tang-3-unit-02',
    },
    proTipVi: 'Bẫy phần trăm: Tăng 20% rồi giảm 20% KHÔNG BAO GIỜ trở về giá cũ! Ví dụ: 100 * 1.20 = 120; 120 * 0.80 = 96 (bị giảm 4%).',
  },
  {
    day: 7,
    week: 1,
    phase: 'Nền tảng',
    titleVi: 'Ngày 7: Ôn tập Tuần 1 & Thi thử Mini Test (30 câu)',
    titleEn: 'Day 7: Week 1 Synthesis & Mini Diagnostic Check',
    focusVi: 'Tổng kết ngữ pháp nền tảng; giải nhanh 15 câu Math + 15 câu Verbal.',
    focusEn: 'Weekly review; timed 15-question Math + 15-question Verbal mini checkpoint.',
    estimatedMinutes: 60,
    rw: {
      skill: 'mixed',
      topicVi: 'Đề trộn Verbal Số 1 (12 câu chuẩn nhịp)',
      topicEn: 'Verbal Mixed Set #1 (12 timed questions)',
      actionVi: 'Làm đề bấm giờ 14 phút; ghi lại mọi câu sai vào sổ tay lỗi sai (Error Log).',
      href: '/sat-rw/mix/satrw-mix-01',
      practiceSet: 'satrw-mix-01',
    },
    math: {
      domain: 'Algebra',
      topicVi: 'Chẩn đoán Toán nền tảng (19 câu chẩn đoán)',
      topicEn: 'Math Diagnostic Placement Check',
      desmosTipVi: 'Tận dụng Desmos để tăng tốc độ làm bài lên gấp đôi.',
      href: '/math/diagnostic',
      practiceChapter: 'math-diagnostic',
    },
    vocab: {
      unitNameVi: 'Ôn tập 120 từ vựng tuần 1',
      words: ['assert', 'empirical', 'fluctuate', 'ubiquitous', 'catalyst', 'refute'],
      quizHref: '/vocabulary/sat-quiz?unit=sat-tang-1-unit-01',
    },
    proTipVi: 'Sổ tay lỗi sai: Sau khi làm đề, hãy tự trả lời 3 câu hỏi: 1) Tại sao mình chọn đáp án sai đó? 2) Tại sao đáp án đúng lại đúng? 3) Từ khóa/dấu hiệu nhận biết lần sau là gì?',
  },

  // TUẦN 2: TỪ NỐI, WORDS IN CONTEXT & HÀM BẬC HAI
  {
    day: 8,
    week: 2,
    phase: 'Tăng tốc',
    titleVi: 'Ngày 8: 9 Họ từ nối (Transitions) & Phương trình bậc hai (Delta)',
    titleEn: 'Day 8: Transition Words & Quadratic Equations',
    focusVi: 'Nhận diện quan hệ tương phản/hệ quả; công thức nghiệm & số nghiệm.',
    focusEn: 'Master logical contrast/causation transitions; quadratic formula & discriminant.',
    estimatedMinutes: 65,
    rw: {
      skill: 'transition',
      topicVi: 'Từ nối (Transitions): Bảng đối chiếu 9 nhóm quan hệ logic',
      topicEn: 'Transitions: Logical relationship mapping across 9 semantic categories',
      actionVi: 'Đọc câu 1 và câu 2 độc lập, tự điền từ nối tiếng Việt trước khi nhìn 4 đáp án.',
      href: '/sat-rw/skill/transition',
      practiceSet: 'satrw-u6-learn',
    },
    math: {
      domain: 'Advanced Math',
      topicVi: 'Phương trình bậc hai: Biệt thức Delta = b^2 - 4ac và số nghiệm',
      topicEn: 'Quadratic Equations: Discriminant b^2 - 4ac and number of real solutions',
      desmosTipVi: 'Gõ y = ax^2 + bx + c. Đồ thị cắt Ox tại 2 điểm (Delta > 0), tiếp xúc (Delta = 0), không cắt (Delta < 0).',
      href: '/sat/lo-trinh/quadratic-equations',
      practiceChapter: 'quadratic-equations',
    },
    vocab: {
      unitNameVi: '30 Từ vựng con người, tính cách & thái độ',
      words: ['candid', 'reticent', 'ambivalent', 'indifferent', 'dogmatic', 'altruistic'],
      quizHref: '/vocabulary/sat-quiz?unit=sat-tang-1-unit-07',
    },
    proTipVi: 'Bẫy từ nối: Nếu 2 phương án thuộc CÙNG MỘT HỌ quan hệ logic (ví dụ: Furthermore và In addition), cả hai đều SAI ngay lập tức vì không thể có 2 đáp án đúng!',
  },
  {
    day: 9,
    week: 2,
    phase: 'Tăng tốc',
    titleVi: 'Ngày 9: Words in Context (Kỹ thuật Manh mối) & Đỉnh Parabol (Vertex Form)',
    titleEn: 'Day 9: Words in Context & Parabola Vertex Form',
    focusVi: 'Đoán nghĩa từ qua đòn bẩy tương phản; tìm tọa độ đỉnh parabol h, k.',
    focusEn: 'Predict word meaning via contrast clues; identify vertex coordinates (h, k).',
    estimatedMinutes: 70,
    rw: {
      skill: 'words',
      topicVi: 'Words in Context: 7 kỹ thuật bắt manh mối ngữ cảnh (Erica Meltzer)',
      topicEn: 'Words in Context: 7 context clue strategies for tier-2 academic vocabulary',
      actionVi: 'Gạch chân từ khóa manh mối; tự điền một từ đơn giản vào chỗ trống trước.',
      href: '/sat-rw/skill/words',
      practiceSet: 'satrw-u11-learn',
    },
    math: {
      domain: 'Advanced Math',
      topicVi: 'Dạng đỉnh Parabol y = a(x - h)^2 + k: Giá trị cực đại và cực tiểu',
      topicEn: 'Vertex Form of Quadratic: Maximum, minimum and axis of symmetry',
      desmosTipVi: 'Tọa độ đỉnh (h, k) đọc thẳng từ đồ thị; nếu a > 0 thì k là min, nếu a < 0 thì k là max.',
      href: '/sat/lo-trinh/parabolas',
      practiceChapter: 'parabolas',
    },
    vocab: {
      unitNameVi: '25 Từ quen nghĩa lạ trong đề SAT (Polysemy Part 1)',
      words: ['qualify (hạn chế)', 'champion (ủng hộ)', 'compromise (làm tổn hại)', 'table (hoãn lại)'],
      quizHref: '/vocabulary/sat-quiz?unit=sat-tang-2-unit-01',
    },
    proTipVi: 'Words in Context: Chữ "qualify" trong đề thi SAT hầu như KHÔNG BAO GIỜ mang nghĩa "đủ tiêu chuẩn", mà nghĩa là "hạn chế, đặt điều kiện dè dặt" (limit/moderate a claim)!',
  },
  {
    day: 10,
    week: 2,
    phase: 'Tăng tốc',
    titleVi: 'Ngày 10: Ý chính & Chi tiết (Central Ideas) & Đa thức, Nghiệm số',
    titleEn: 'Day 10: Central Ideas & Polynomials, Factoring',
    focusVi: 'Xác định luận điểm cốt lõi; phân tích nhân tử và định lý số dư.',
    focusEn: 'Identify core thesis; polynomial factoring and remainder theorem.',
    estimatedMinutes: 65,
    rw: {
      skill: 'central',
      topicVi: 'Central Ideas: Tóm lược luận điểm tác giả trong một câu',
      topicEn: 'Central Ideas & Details: Distinguishing primary claim from supporting details',
      actionVi: 'Loại bỏ đáp án quá rộng (too broad), quá hẹp (too narrow) hoặc đi ngược văn bản.',
      href: '/sat-rw/skill/central',
      practiceSet: 'satrw-u14-learn',
    },
    math: {
      domain: 'Advanced Math',
      topicVi: 'Đa thức bậc cao: Phân tích nhân tử, định lý số dư và tính chất nghiệm',
      topicEn: 'Higher Polynomials: Factoring, remainder theorem and zeros of functions',
      desmosTipVi: 'Đa thức cắt Ox ở đâu thì ở đó có nghiệm (x - c). Nếu đồ thị tiếp xúc Ox thì nghiệm có bội chẵn.',
      href: '/sat/lo-trinh/polynomials',
      practiceChapter: 'polynomials',
    },
    vocab: {
      unitNameVi: '30 Từ vựng thời gian, lịch sử & khái niệm trừu tượng',
      words: ['anachronism', 'precursor', 'transient', 'paradigm', 'dichotomy', 'anomaly'],
      quizHref: '/vocabulary/sat-quiz?unit=sat-tang-1-unit-08',
    },
    proTipVi: 'Central Ideas: Chú ý từ nối đối lập (However, Yet, But) ở giữa đoạn văn — tác giả thường nêu ý kiến của người khác trước, sau đó từ nối mới dẫn vào ý chính thật sự của mình!',
  },
];

export type AiRoadmapProfile = {
  currentScore: number;
  targetScore: number;
  weeksUntilExam: number;
  hoursPerDay: number;
  weakestSection: 'reading_vocab' | 'reading_inference' | 'writing_grammar' | 'math_algebra' | 'math_advanced' | 'math_geometry';
};

export type AiRoadmapAnalysis = {
  gapScore: number;
  feasibilityPercent: number;
  rwTarget: number;
  mathTarget: number;
  recommendedPhase: string;
  focusMilestones: { week: string; goalVi: string; actionVi: string }[];
  trapAlertsVi: string[];
  suggestedDailyMinutes: number;
};

export function analyzeSatRoadmap(profile: AiRoadmapProfile): AiRoadmapAnalysis {
  const gap = Math.max(0, profile.targetScore - profile.currentScore);
  const totalHours = profile.weeksUntilExam * 7 * profile.hoursPerDay;
  
  // Feasibility logic
  const requiredHours = gap * 0.45; // ~45 hours per 100 points
  const feasibility = Math.min(98, Math.max(45, Math.round((totalHours / Math.max(10, requiredHours)) * 85)));

  // Target partition
  const currentMath = Math.round(profile.currentScore * 0.52 / 10) * 10;
  const currentRw = profile.currentScore - currentMath;
  const targetMath = Math.min(800, Math.round((profile.targetScore * 0.525) / 10) * 10);
  const targetRw = Math.min(800, profile.targetScore - targetMath);

  const milestones: { week: string; goalVi: string; actionVi: string }[] = [];
  if (profile.weeksUntilExam <= 4) {
    milestones.push({
      week: 'Tuần 1',
      goalVi: 'Vét cạn điểm Ngữ pháp (Conventions) & Kỹ thuật Desmos giải hệ',
      actionVi: 'Luyện 5 set boundaries, form & áp dụng Desmos giải 100% câu hệ phương trình.',
    });
    milestones.push({
      week: 'Tuần 2',
      goalVi: 'Xử lý Words in Context & Hàm số bậc hai, Parabol',
      actionVi: 'Học 100 từ vựng đa nghĩa hay gặp; làm chủ dạng đỉnh Parabol y = a(x-h)^2 + k.',
    });
    milestones.push({
      week: 'Tuần 3',
      goalVi: 'Chinh phục Inferences, Command of Evidence & Bảng số liệu',
      actionVi: 'Luyện 12 bộ đề Reading chuyên sâu; luyện phân tích bảng số liệu khoa học.',
    });
    milestones.push({
      week: 'Tuần 4',
      goalVi: 'Tổng duyệt đề thi thật & Luyện phản xạ Module 2 Khó',
      actionVi: 'Bấm giờ 2 đề thi thật hoàn chỉnh (Bluebook Test 5 & 6); rà soát sổ tay lỗi sai.',
    });
  } else {
    milestones.push({
      week: 'Giai đoạn 1 (Tuần 1–3)',
      goalVi: 'Xây dựng nền tảng vững chắc (Mục tiêu 1300+)',
      actionVi: 'Quét sạch 16 unit Ngữ pháp & 27 chủ đề Đại số căn bản; học 300 từ vựng học thuật lõi.',
    });
    milestones.push({
      week: 'Giai đoạn 2 (Tuần 4–7)',
      goalVi: 'Tăng tốc Đọc hiểu & Toán nâng cao (Mục tiêu 1400–1450)',
      actionVi: 'Tập trung dạng Cross-Text Connections, Inferences và các bài toán cực trị, mũ, hình học.',
    });
    milestones.push({
      week: 'Giai đoạn 3 (Tuần 8+)',
      goalVi: 'Chinh phục Module 2 Thích ứng Khó (Mục tiêu 1500+)',
      actionVi: 'Luyện kho 65 đề thi thật; rèn phản xạ thời gian 71 giây/câu Verbal và 95 giây/câu Math.',
    });
  }

  const traps: string[] = [
    'Bẫy đọc xuôi tai: Trong phần Verbal, đáp án nghe "quen tai" nhất thường là bẫy của College Board. Luôn dùng phương pháp loại trừ (POE) dựa trên lỗi thực tế.',
    'Bẫy giải tay môn Toán: Hơn 60% câu hỏi toán SAT có thể giải ngay lập tức bằng Desmos (Slider, Giao điểm, Hồi quy ~). Đừng mất 3 phút giải tay một bài toán mà Desmos vẽ xong trong 10 giây.',
    'Bẫy học từ vựng dàn trải: Không nên học từ điển A–Z. Hãy học từ vựng trích xuất trực tiếp từ các bài đọc thi thật và sách kinh điển của Erica Meltzer.',
  ];

  let recommendedPhase = 'Nền tảng & Đại số';
  if (profile.currentScore >= 1350) {
    recommendedPhase = 'Bứt phá 1500+ & Module 2 Khó';
  } else if (profile.currentScore >= 1150) {
    recommendedPhase = 'Tăng tốc Đọc hiểu & Toán nâng cao';
  }

  return {
    gapScore: gap,
    feasibilityPercent: feasibility,
    rwTarget: targetRw,
    mathTarget: targetMath,
    recommendedPhase,
    focusMilestones: milestones,
    trapAlertsVi: traps,
    suggestedDailyMinutes: Math.round(profile.hoursPerDay * 60),
  };
}
