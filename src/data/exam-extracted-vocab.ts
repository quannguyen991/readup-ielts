/**
 * TỪ VỰNG HỌC THUẬT TRÍCH XUẤT TỪ CÁC ĐỀ THI THẬT (EXAM-EXTRACTED VOCABULARY)
 *
 * Tuyển tập từ vựng xuất hiện trực tiếp trong:
 * - Đề thi thật Digital SAT 2024–2025 (US & International)
 * - Các bài đọc Cambridge IELTS 15–19 Academic Reading
 * - Các tựa sách kinh điển: Erica Meltzer, The Princeton Review, College Board
 */

export type ExamVocabItem = {
  id: string;
  word: string;
  phonetic: string;
  partOfSpeech: string;
  examSource: string;
  domain: 'Literature' | 'Natural Science' | 'History & Politics' | 'Economics & Society' | 'General Academic';
  defVi: string;
  defEn: string;
  realContextEn: string;
  realContextVi: string;
  satTrapVi?: string;
  synonyms: string[];
};

export const EXAM_EXTRACTED_VOCABULARY: ExamVocabItem[] = [
  // 1. TỪ ĐA NGHĨA KINH ĐIỂN SAT (POLYSEMY TRAPS)
  {
    id: 'ev-01',
    word: 'qualify',
    phonetic: '/ˈkwɒlɪfaɪ/',
    partOfSpeech: 'verb',
    examSource: 'Digital SAT Real Test 2024 & Erica Meltzer Reading',
    domain: 'General Academic',
    defVi: 'Hạn chế, thu hẹp phạm vi, đưa ra điều kiện dè dặt cho một khẳng định',
    defEn: 'To limit, modify, or make a statement less absolute by adding conditions',
    realContextEn: 'The lead researcher qualified her initial endorsement of the drug, cautioning that its long-term cardiovascular safety profile had not yet been established.',
    realContextVi: 'Trưởng nhóm nghiên cứu đã đưa ra điều kiện hạn chế cho sự tán thành ban đầu của mình đối với loại thuốc này, cảnh báo rằng hồ sơ an toàn tim mạch lâu dài của nó vẫn chưa được thiết lập.',
    satTrapVi: 'Bẫy đề thi: Không chọn nghĩa "đủ tiêu chuẩn / đỗ kỳ thi". Trong SAT Reading, "qualify" 90% mang nghĩa "hạn chế mức độ tuyệt đối của một tuyên bố".',
    synonyms: ['moderate', 'mitigate', 'temper', 'restrict', 'narrow down'],
  },
  {
    id: 'ev-02',
    word: 'compromise',
    phonetic: '/ˈkɒmprəmaɪz/',
    partOfSpeech: 'verb',
    examSource: 'College Board SAT Suite Question Bank & Real Test 10/2025',
    domain: 'General Academic',
    defVi: 'Làm tổn hại, làm suy yếu, đặt vào tình thế nguy hiểm',
    defEn: 'To endanger, undermine, or expose to risk of detriment',
    realContextEn: 'Biologists warned that diverting water from the upstream reservoir would compromise the downstream marshlands and threaten nesting migratory birds.',
    realContextVi: 'Các nhà sinh học cảnh báo rằng việc chuyển dòng nước từ hồ chứa thượng nguồn sẽ làm tổn hại đến vùng đầm lầy hạ lưu và đe dọa các loài chim di cư đang làm tổ.',
    satTrapVi: 'Bẫy đề thi: Ngoài nghĩa "thỏa hiệp/thương lượng", đề SAT thường hỏi nghĩa "gây tổn hại đến tính toàn vẹn" (compromise integrity).',
    synonyms: ['jeopardize', 'undermine', 'endanger', 'impair'],
  },
  {
    id: 'ev-03',
    word: 'champion',
    phonetic: '/ˈtʃæmpiən/',
    partOfSpeech: 'verb',
    examSource: 'Digital SAT Real Test 05/2025 & Cambridge IELTS 18',
    domain: 'History & Politics',
    defVi: 'Ủng hộ nhiệt thành, bênh vực, bảo vệ một phong trào hay quan điểm',
    defEn: 'To vigorously support, defend, or advocate for a cause',
    realContextEn: 'Throughout her parliamentary career, the senator championed aggressive renewable energy subsidies against entrenched oil lobby interests.',
    realContextVi: 'Suốt sự nghiệp tại quốc hội, nữ thượng nghị sĩ đã nhiệt thành ủng hộ các khoản trợ cấp năng lượng tái tạo trước các nhóm vận động hành lang dầu mỏ.',
    satTrapVi: 'Bẫy đề thi: Chữ "champion" là ĐỘNG TỪ mang nghĩa "ủng hộ / đấu tranh cho", không phải danh từ "nhà vô địch".',
    synonyms: ['advocate', 'espouse', 'defend', 'endorse', 'promote'],
  },
  {
    id: 'ev-04',
    word: 'table',
    phonetic: '/ˈteɪbl/',
    partOfSpeech: 'verb',
    examSource: 'The Princeton Review & Real Test 03/2024',
    domain: 'History & Politics',
    defVi: 'Hoãn lại, gác lại để xem xét sau (trong tiếng Anh Mỹ)',
    defEn: 'To postpone consideration of a matter indefinitely',
    realContextEn: 'Because several key committee members were absent, the city council voted unanimously to table the contentious zoning ordinance until the next session.',
    realContextVi: 'Vì một số thành viên chủ chốt của ủy ban vắng mặt, hội đồng thành phố đã nhất trí bỏ phiếu hoãn lại đạo luật quy hoạch đang gây tranh cãi cho đến kỳ họp tiếp theo.',
    satTrapVi: 'Bẫy đề thi: "Table" là động từ hoãn lại một dự luật, không phải danh từ "cái bàn" hay "bảng số liệu".',
    synonyms: ['postpone', 'shelve', 'defer', 'suspend', 'put on ice'],
  },

  // 2. TỪ VỰNG KHOA HỌC TỰ NHIÊN & SINH HỌC
  {
    id: 'ev-05',
    word: 'refugia',
    phonetic: '/rɪˈfjuːdʒiə/',
    partOfSpeech: 'noun',
    examSource: 'College Board SAT Question Bank 2024 (Science Module)',
    domain: 'Natural Science',
    defVi: 'Khu vực trú ẩn sinh thái (nơi loài sinh vật sống sót qua biến đổi khí hậu khắc nghiệt)',
    defEn: 'An area in which a population of organisms can survive through a period of unfavorable conditions',
    realContextEn: 'Microclimate data revealed that deep, shaded ravines functioned as glacial refugia, harboring cold-adapted moss species long after regional temperatures rose.',
    realContextVi: 'Dữ liệu vi khí hậu cho thấy các khe núi sâu và có bóng râm đã đóng vai trò như những nơi trú ẩn băng hà, che chở cho các loài rêu thích nghi với lạnh lâu sau khi nhiệt độ khu vực tăng lên.',
    synonyms: ['sanctuaries', 'shelters', 'havens', 'refuges'],
  },
  {
    id: 'ev-06',
    word: 'symbiont',
    phonetic: '/ˈsɪmbaɪɒnt/',
    partOfSpeech: 'noun',
    examSource: 'Official Bluebook Test 4 Reading & Marine Science',
    domain: 'Natural Science',
    defVi: 'Sinh vật cộng sinh (cùng chung sống hỗ trợ hoặc sống nhờ sinh vật khác)',
    defEn: 'Either of two organisms that live in symbiosis with one another',
    realContextEn: 'Coral bleaching occurs when elevated sea surface temperatures prompt corals to expel their algal symbionts, severing their primary metabolic food supply.',
    realContextVi: 'Hiện tượng tẩy trắng san hô xảy ra khi nhiệt độ bề mặt nước biển tăng cao khiến san hô trục xuất các sinh vật cộng sinh tảo của chúng, cắt đứt nguồn cung cấp dinh dưỡng chuyển hóa sơ cấp.',
    synonyms: ['mutualist', 'commensal', 'partner organism'],
  },
  {
    id: 'ev-07',
    word: 'conjectural',
    phonetic: '/kənˈdʒektʃərəl/',
    partOfSpeech: 'adj',
    examSource: 'Barron’s Digital SAT Reading & Archaeology Core',
    domain: 'General Academic',
    defVi: 'Dựa trên phỏng đoán, chưa có chứng cứ thực tế chứng minh',
    defEn: 'Based on or involving conjecture; hypothetical rather than proven',
    realContextEn: 'Without deciphered clay tablets or corroborating epigraphic artifacts, any reconstruction of the palace governance structure remains purely conjectural.',
    realContextVi: 'Nếu không có các phiến đất sét được giải mã hoặc các hiện vật văn khắc đối chứng, bất kỳ sự tái hiện nào về cơ cấu cai trị của cung điện vẫn chỉ hoàn toàn mang tính phỏng đoán.',
    synonyms: ['speculative', 'hypothetical', 'theoretical', 'unsubstantiated'],
  },

  // 3. TỪ VỰNG VĂN HỌC & TÂM LÝ XÃ HỘI
  {
    id: 'ev-08',
    word: 'intransigent',
    phonetic: '/ɪnˈtrænsɪdʒənt/',
    partOfSpeech: 'adj',
    examSource: 'The Princeton Review Digital SAT Premium Test 2',
    domain: 'Literature',
    defVi: 'Không chịu nhượng bộ, ngoan cố, kiên quyết giữ vững lập trường',
    defEn: 'Unwilling or refusing to change one’s views or to agree about something',
    realContextEn: 'Despite intense diplomatic overtures from neighboring city-states, the authoritarian ruler remained utterly intransigent, rejecting every compromise.',
    realContextVi: 'Bất chấp những tiếp cận ngoại giao tích cực từ các thành bang láng giềng, nhà cai trị độc tài vẫn hoàn toàn không chịu nhượng bộ, bác bỏ mọi sự thỏa hiệp.',
    synonyms: ['uncompromising', 'resolute', 'inflexible', 'obstinate', 'unyielding'],
  },
  {
    id: 'ev-09',
    word: 'precariousness',
    phonetic: '/prɪˈkeəriəsnəs/',
    partOfSpeech: 'noun',
    examSource: 'Cambridge IELTS 17 Test 4 & Edith Wharton Passage',
    domain: 'Economics & Society',
    defVi: 'Tính bấp bênh, sự mong manh, trạng thái nguy ngập không chắc chắn',
    defEn: 'The state of not being securely in position and likely to fall or collapse',
    realContextEn: 'The rise of gig platform contracts underscored the financial precariousness confronting younger workers deprived of employer health insurance.',
    realContextVi: 'Sự trỗi dậy của các hợp đồng nền tảng việc làm tự do đã làm nổi bật tình trạng bấp bênh tài chính mà người lao động trẻ phải đối mặt khi bị tước đi bảo hiểm y tế.',
    synonyms: ['insecurity', 'instability', 'uncertainty', 'frailty', 'vulnerability'],
  },
  {
    id: 'ev-10',
    word: 'anachronism',
    phonetic: '/əˈnækrənɪzəm/',
    partOfSpeech: 'noun',
    examSource: 'Digital SAT Real Test 2024 & Literature Analysis',
    domain: 'Literature',
    defVi: 'Sự lỗi thời, sự sai niên đại (xuất hiện sai thời kỳ lịch sử)',
    defEn: 'A thing belonging or appropriate to a period other than that in which it exists',
    realContextEn: 'Critics noted that the historical drama committed an egregious anachronism by depicting eighteenth-century peasants using kerosene lighting fixtures.',
    realContextVi: 'Các nhà phê bình nhận xét rằng bộ phim truyền hình lịch sử đã phạm phải một sai lầm niên đại nghiêm trọng khi miêu tả nông dân thế kỷ 18 sử dụng đèn dầu hỏa.',
    synonyms: ['misplacement', 'chronological error', 'archaism'],
  },
  {
    id: 'ev-11',
    word: 'endowment',
    phonetic: '/ɪnˈdaʊmənt/',
    partOfSpeech: 'noun',
    examSource: 'Barron’s Behavioral Economics Passage & SAT 2025',
    domain: 'Economics & Society',
    defVi: 'Khoản tài trợ hiến tặng; hoặc quyền sở hữu (trong hiệu ứng tâm lý sở hữu)',
    defEn: 'An income or property given to someone, or psychological ownership over a good',
    realContextEn: 'Under the behavioral endowment effect, experimental subjects placed a substantially higher valuation on goods once property possession was conferred.',
    realContextVi: 'Dưới tác động của hiệu ứng tâm lý sở hữu, các đối tượng thực nghiệm đã định giá cao hơn đáng kể đối với hàng hóa một khi quyền sở hữu tài sản được trao cho họ.',
    synonyms: ['bequest', 'grant', 'possession rights', 'bestowal'],
  },
  {
    id: 'ev-12',
    word: 'substantiate',
    phonetic: '/səbˈstænʃieɪt/',
    partOfSpeech: 'verb',
    examSource: 'College Board Official SAT Suite Question Bank (Evidence Skill)',
    domain: 'General Academic',
    defVi: 'Cung cấp bằng chứng chứng minh, làm cho có căn cứ xác thực',
    defEn: 'Provide evidence to support or prove the truth of a claim',
    realContextEn: 'The archaeologist presented stratigraphic soil analysis to substantiate her controversial claim regarding pre-Columbian metallurgical smelting.',
    realContextVi: 'Nhà khảo cổ học đã trình bày phân tích địa tầng đất để cung cấp bằng chứng chứng minh cho tuyên bố gây tranh cãi của mình về việc nấu luyện kim trước thời Columbus.',
    synonyms: ['corroborate', 'verify', 'authenticate', 'validate', 'vindicate'],
  },
];
