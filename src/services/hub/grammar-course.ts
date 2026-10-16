/**
 * Khoá ngữ pháp theo cấp độ A1 → C: mỗi bài có quy tắc ngắn bằng tiếng Việt kèm ví dụ
 * tiếng Anh, và ba câu trắc nghiệm. Đạt khi đúng ít nhất 2/3 câu.
 */

export type GrammarLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C';

export type GrammarQuestion = { q: string; options: string[]; answer: number };

export type GrammarLesson = {
  id: string;
  level: GrammarLevel;
  title: string;
  subtitle: string;
  /** Quy tắc, viết ngắn gọn bằng tiếng Việt kèm ví dụ tiếng Anh. */
  rules: string[];
  questions: GrammarQuestion[];
};

export const A1_LESSONS: GrammarLesson[] = [
  {
    id: 'a1-articles', level: 'A1', title: 'Mạo từ a/an/the', subtitle: 'Cách dùng a, an, the',
    rules: [
      'a / an đứng trước danh từ đếm được số ít chưa xác định. Dùng "an" khi từ sau đó bắt đầu bằng nguyên âm: an apple, an hour.',
      'the đứng trước danh từ đã xác định hoặc duy nhất: the sun, the book on the table.',
    ],
    questions: [
      { q: 'I have ___ apple.', options: ['a', 'an', 'the'], answer: 1 },
      { q: '___ sun is very hot today.', options: ['A', 'An', 'The'], answer: 2 },
      { q: 'She is ___ teacher.', options: ['a', 'an', 'the'], answer: 0 },
    ],
  },
  {
    id: 'a1-can', level: 'A1', title: 'Can / Can\'t', subtitle: 'Khả năng và kỹ năng',
    rules: [
      'can + động từ nguyên mẫu (không "to"): I can swim. Không thêm -s với he/she: She can drive.',
      'Phủ định: cannot viết liền, hoặc can\'t. Câu hỏi: Can you...?',
    ],
    questions: [
      { q: 'He ___ speak three languages.', options: ['can', 'cans', 'can to'], answer: 0 },
      { q: 'I ___ see the board, it is too far.', options: ['can\'t', 'don\'t', 'cans'], answer: 0 },
      { q: '___ you help me with this?', options: ['Can', 'Do', 'Are'], answer: 0 },
    ],
  },
  {
    id: 'a1-past-simple', level: 'A1', title: 'Quá khứ đơn', subtitle: 'Sự kiện và hành động trong quá khứ',
    rules: [
      'Động từ có quy tắc thêm -ed: walk → walked. Động từ bất quy tắc phải nhớ: go → went, see → saw.',
      'Phủ định dùng did not / didn\'t + động từ nguyên mẫu: I didn\'t go.',
    ],
    questions: [
      { q: 'Yesterday I ___ to school.', options: ['go', 'went', 'goes'], answer: 1 },
      { q: 'She ___ a movie last night.', options: ['watched', 'watch', 'watches'], answer: 0 },
      { q: 'They ___ finish the homework.', options: ['didn\'t', 'don\'t', 'doesn\'t'], answer: 0 },
    ],
  },
  {
    id: 'a1-plurals', level: 'A1', title: 'Danh từ số nhiều', subtitle: 'Hơn một sự vật',
    rules: [
      'Thường thêm -s: cat → cats. Tận cùng bằng s, x, ch, sh thì thêm -es: box → boxes.',
      'Một số từ bất quy tắc: child → children, man → men, person → people.',
    ],
    questions: [
      { q: 'Two ___', options: ['cat', 'cats', 'catss'], answer: 1 },
      { q: 'Three ___ are playing outside.', options: ['childs', 'children', 'childes'], answer: 1 },
      { q: 'Two ___ are on the table.', options: ['boxs', 'boxes', 'boxies'], answer: 1 },
    ],
  },
  {
    id: 'a1-present-continuous', level: 'A1', title: 'Hiện tại tiếp diễn', subtitle: 'Hành động đang xảy ra',
    rules: [
      'Cấu trúc: am / is / are + động từ thêm -ing. Dùng cho việc đang xảy ra lúc nói: She is watching TV now.',
      'I đi với am, he/she/it đi với is, we/you/they đi với are.',
    ],
    questions: [
      { q: 'She ___ TV now.', options: ['is watching', 'watches', 'watch'], answer: 0 },
      { q: 'They ___ playing football.', options: ['is', 'are', 'am'], answer: 1 },
      { q: 'I ___ reading a book.', options: ['am', 'is', 'are'], answer: 0 },
    ],
  },
  {
    id: 'a1-present-simple', level: 'A1', title: 'Hiện tại đơn', subtitle: 'Thói quen hằng ngày',
    rules: [
      'Dùng cho thói quen và sự thật. Với he/she/it thêm -s hoặc -es: she works, he goes.',
      'Phủ định: do not / does not (doesn\'t) + động từ nguyên mẫu.',
    ],
    questions: [
      { q: 'I ___ coffee every morning.', options: ['drink', 'drinks', 'drinking'], answer: 0 },
      { q: 'She ___ to work by bus.', options: ['go', 'goes', 'going'], answer: 1 },
      { q: 'They don\'t ___ in London.', options: ['live', 'lives', 'living'], answer: 0 },
    ],
  },
  {
    id: 'a1-questions', level: 'A1', title: 'Câu hỏi', subtitle: 'Câu hỏi yes/no và wh-',
    rules: [
      'Câu hỏi yes/no bắt đầu bằng trợ động từ: Do / Does / Is / Are / Can: Do you like music?',
      'Câu hỏi wh- (what, where, when, why, how) đặt trước trợ động từ: Where are you from?',
    ],
    questions: [
      { q: '___ you like music?', options: ['Do', 'Does', 'Is'], answer: 0 },
      { q: 'What ___ you do?', options: ['is', 'do', 'are'], answer: 1 },
      { q: 'Where ___ she from?', options: ['does', 'is', 'do'], answer: 1 },
    ],
  },
  {
    id: 'a1-there-is', level: 'A1', title: 'There is / There are', subtitle: 'Có cái gì đó ở đâu',
    rules: [
      'There is + danh từ số ít hoặc không đếm được. There are + danh từ số nhiều: There is a book. There are two cats.',
      'Câu hỏi: Is there...? / Are there...?',
    ],
    questions: [
      { q: 'There ___ a book on the table.', options: ['is', 'are', 'am'], answer: 0 },
      { q: 'There ___ two cats in the garden.', options: ['is', 'are', 'be'], answer: 1 },
      { q: '___ any milk in the fridge?', options: ['Is there', 'There is', 'Are there'], answer: 0 },
    ],
  },
];

export const A2_LESSONS: GrammarLesson[] = [
  {
    id: 'a2-comparatives', level: 'A2', title: 'So sánh hơn và nhất', subtitle: 'Tính từ ngắn và dài',
    rules: [
      'Tính từ ngắn (một âm tiết) thêm -er / -est: tall → taller → the tallest. Tính từ dài dùng more / the most: interesting → more interesting.',
      'So sánh hơn đi với than: This road is wider than that one.',
    ],
    questions: [
      { q: 'This road is ___ than that one.', options: ['wider', 'more wide', 'widest'], answer: 0 },
      { q: 'She is ___ student in the class.', options: ['the tallest', 'the taller', 'the more tall'], answer: 0 },
      { q: 'Today is ___ than yesterday.', options: ['hotter', 'more hot', 'hotest'], answer: 0 },
    ],
  },
  {
    id: 'a2-past-continuous', level: 'A2', title: 'Quá khứ tiếp diễn', subtitle: 'Hành động đang diễn ra trong quá khứ',
    rules: [
      'Cấu trúc: was / were + V-ing. Dùng cho hành động đang diễn ra tại một thời điểm trong quá khứ: I was reading at 8 p.m.',
      'Hay đi với when / while: I was reading when she called.',
    ],
    questions: [
      { q: 'They ___ dinner when the power went out.', options: ['were having', 'had', 'have'], answer: 0 },
      { q: 'She ___ to the radio at that time.', options: ['wasn\'t listening', 'didn\'t listened', 'isn\'t listening'], answer: 0 },
      { q: 'What ___ you doing at 8 p.m.?', options: ['were', 'was', 'did'], answer: 0 },
    ],
  },
  {
    id: 'a2-future', level: 'A2', title: 'Thì tương lai', subtitle: 'will và be going to',
    rules: [
      'will dùng cho quyết định tức thời hoặc dự đoán không có bằng chứng: I think it will rain.',
      'be going to dùng cho kế hoạch đã định hoặc dự đoán có dấu hiệu: We are going to visit Grandma. Look at the clouds, it is going to rain.',
    ],
    questions: [
      { q: 'I think it ___ rain tomorrow.', options: ['will', 'is going', 'goes'], answer: 0 },
      { q: 'We ___ visit Grandma next Sunday. The tickets are booked.', options: ['are going to', 'will', 'go'], answer: 0 },
      { q: 'Don\'t worry, I ___ help you.', options: ['will', 'am going', 'going'], answer: 0 },
    ],
  },
  {
    id: 'a2-modals', level: 'A2', title: 'Must, should, have to', subtitle: 'Bắt buộc và khuyên nhủ',
    rules: [
      'must và have to diễn đạt bắt buộc: You must wear a seatbelt. I have to get up early.',
      'should diễn đạt lời khuyên: You should eat more vegetables. Chú ý: have to đi với he/she/it là has to.',
    ],
    questions: [
      { q: 'You ___ wear a seatbelt. It is the law.', options: ['must', 'should', 'would'], answer: 0 },
      { q: 'You ___ eat more vegetables. It is good for you.', options: ['should', 'have', 'can'], answer: 0 },
      { q: 'I ___ get up early tomorrow.', options: ['have to', 'have', 'am have'], answer: 0 },
    ],
  },
];

export const B1_LESSONS: GrammarLesson[] = [
  {
    id: 'b1-present-perfect', level: 'B1', title: 'Hiện tại hoàn thành', subtitle: 'have/has + V3',
    rules: [
      'Cấu trúc: have/has + động từ quá khứ phân từ (V3). Dùng cho kinh nghiệm hoặc việc xảy ra trong quá khứ liên quan tới hiện tại: I have visited Japan twice.',
      'Hay đi với just, already, yet, ever, never, for và since.',
    ],
    questions: [
      { q: 'She ___ never ___ sushi.', options: ['has / tried', 'have / tried', 'has / try'], answer: 0 },
      { q: 'They ___ just ___ home.', options: ['have / arrived', 'has / arrive', 'are / arrived'], answer: 0 },
      { q: 'How long ___ you ___ here?', options: ['have / been', 'did / be', 'are / been'], answer: 0 },
    ],
  },
  {
    id: 'b1-relative', level: 'B1', title: 'Mệnh đề quan hệ', subtitle: 'who, which, that, where',
    rules: [
      'who thay cho người, which thay cho vật, that dùng cho cả hai: The man who lives next door is a doctor.',
      'where thay cho nơi chốn: The town where I grew up is small.',
    ],
    questions: [
      { q: 'The man ___ lives next door is a doctor.', options: ['who', 'which', 'whose'], answer: 0 },
      { q: 'This is the book ___ I told you about.', options: ['which', 'who', 'where'], answer: 0 },
      { q: 'The town ___ I grew up is small.', options: ['where', 'which', 'who'], answer: 0 },
    ],
  },
  {
    id: 'b1-passive', level: 'B1', title: 'Câu bị động', subtitle: 'be + V3',
    rules: [
      'Cấu trúc: be (đúng thì) + V3. Dùng khi không cần nhắc người làm: The letter was sent yesterday.',
      'Bị động hiện tại: is/are + V3. Ví dụ: English is spoken in many countries.',
    ],
    questions: [
      { q: 'The house ___ built in 1990.', options: ['was', 'is', 'has'], answer: 0 },
      { q: 'English ___ in many countries.', options: ['is spoken', 'speaks', 'spoken'], answer: 0 },
      { q: 'The windows ___ cleaned every week.', options: ['are', 'is', 'have'], answer: 0 },
    ],
  },
  {
    id: 'b1-conditionals', level: 'B1', title: 'Câu điều kiện loại 1 và 2', subtitle: 'If + hiện tại, và If + quá khứ',
    rules: [
      'Loại 1 (có thể xảy ra): If + hiện tại đơn, will + V: If it rains, I will stay at home.',
      'Loại 2 (không có thật ở hiện tại): If + quá khứ đơn, would + V: If I were rich, I would buy a yacht.',
    ],
    questions: [
      { q: 'If it rains, I ___ stay at home.', options: ['will', 'would', 'am'], answer: 0 },
      { q: 'If I ___ rich, I would buy a yacht.', options: ['were', 'am', 'was'], answer: 0 },
      { q: 'If you heat ice, it ___.', options: ['melts', 'will melt', 'melt'], answer: 0 },
    ],
  },
];

export const B2_LESSONS: GrammarLesson[] = [
  {
    id: 'b2-third-conditional', level: 'B2', title: 'Câu điều kiện loại 3', subtitle: 'If + quá khứ hoàn thành',
    rules: [
      'Dùng cho việc không xảy ra trong quá khứ: If + had + V3, would have + V3. If I had studied harder, I would have passed.',
      'Mệnh đề chính có thể dùng would/could/might have + V3.',
    ],
    questions: [
      { q: 'If I had studied harder, I ___ the exam.', options: ['would have passed', 'would pass', 'had passed'], answer: 0 },
      { q: 'If she ___ earlier, she would have caught the train.', options: ['had left', 'left', 'has left'], answer: 0 },
      { q: 'We ___ the party if we had known.', options: ['would have missed', 'would miss', 'miss'], answer: 0 },
    ],
  },
  {
    id: 'b2-inversion', level: 'B2', title: 'Đảo ngữ cơ bản', subtitle: 'Never have I seen...',
    rules: [
      'Sau các trạng từ phủ định đặt đầu câu (never, rarely, hardly, not only) thì đảo trợ động từ lên trước chủ ngữ: Never have I seen such a view.',
      'Hardly ... when / No sooner ... than: Hardly had I closed the door when the phone rang.',
    ],
    questions: [
      { q: 'Rarely ___ such a good result.', options: ['have we seen', 'we have seen', 'we seen'], answer: 0 },
      { q: 'Not only ___ fast, but also accurate.', options: ['is she', 'she is', 'she be'], answer: 0 },
      { q: 'Hardly ___ the door when the phone rang.', options: ['had I closed', 'I had closed', 'I closed'], answer: 0 },
    ],
  },
  {
    id: 'b2-reduced-clauses', level: 'B2', title: 'Rút gọn mệnh đề', subtitle: 'Mệnh đề -ing và -ed',
    rules: [
      'Khi hai hành động cùng chủ ngữ, rút gọn bằng V-ing (chủ động) hoặc V3 (bị động): Reading the report, I noticed some errors.',
      'Hiện tại phân từ (V-ing) cho nghĩa chủ động; quá khứ phân từ (V3) cho nghĩa bị động: Scolded by the teacher, the students were quiet.',
    ],
    questions: [
      { q: '___ the report, I noticed some errors.', options: ['Having read', 'Read', 'Reading to'], answer: 0 },
      { q: 'The man ___ in the corner is my uncle.', options: ['sitting', 'sat', 'to sit'], answer: 0 },
      { q: '___ by the teacher, the students were quiet.', options: ['Scolded', 'Scolding', 'To scold'], answer: 0 },
    ],
  },
  {
    id: 'b2-relative-prepositions', level: 'B2', title: 'Mệnh đề quan hệ nâng cao', subtitle: 'whom, whose, giới từ đứng trước',
    rules: [
      'whose thay cho sở hữu: The author whose book I read is famous.',
      'Giới từ có thể đứng trước whom / which trong văn trang trọng: The friend with whom I went to school is now a lawyer.',
    ],
    questions: [
      { q: 'The friend ___ I went to school is now a lawyer.', options: ['whom', 'who', 'which'], answer: 0 },
      { q: 'The author ___ book I read is famous.', options: ['whose', 'who', 'which'], answer: 0 },
      { q: 'This is the room in ___ the meeting was held.', options: ['which', 'who', 'whose'], answer: 0 },
    ],
  },
];

export const C_LESSONS: GrammarLesson[] = [
  {
    id: 'c-cleft', level: 'C', title: 'Câu chẻ', subtitle: 'It is ... that / who ...',
    rules: [
      'Câu chẻ nhấn mạnh một thành phần: It was the teacher who encouraged me. Thành phần được nhấn đứng giữa It was ... và that/who.',
      'Có thể nhấn trạng ngữ thời gian hoặc nơi chốn: It was in 2010 that the company was founded.',
    ],
    questions: [
      { q: 'It was the teacher ___ encouraged me.', options: ['who', 'which', 'whom'], answer: 0 },
      { q: 'It was in 2010 ___ the company was founded.', options: ['that', 'which', 'when'], answer: 0 },
      { q: 'It is money ___ matters most.', options: ['that', 'what', 'where'], answer: 0 },
    ],
  },
  {
    id: 'c-subjunctive', level: 'C', title: 'Mệnh đề giả định', subtitle: 'suggest / insist / recommend that ...',
    rules: [
      'Sau suggest, insist, recommend, demand, essential... mệnh đề that dùng động từ nguyên mẫu không chia: I suggest that he submit the form.',
      'Đây là dạng giả định, dùng cho đề nghị, yêu cầu hoặc điều cần thiết.',
    ],
    questions: [
      { q: 'I suggest that he ___ the form today.', options: ['submit', 'submits', 'submitted'], answer: 0 },
      { q: 'It is essential that she ___ on time.', options: ['be', 'is', 'was'], answer: 0 },
      { q: 'The doctor recommended that he ___ more water.', options: ['drink', 'drinks', 'drank'], answer: 0 },
    ],
  },
  {
    id: 'c-mixed-conditionals', level: 'C', title: 'Điều kiện hỗn hợp và đảo ngữ điều kiện', subtitle: 'Had I known..., Were it not for...',
    rules: [
      'Điều kiện đảo bỏ if: Had you asked me, I would have helped you (= If you had asked...). Were it not for... (= If it were not for...).',
      'Điều kiện hỗn hợp: quá khứ ở mệnh đề if, hiện tại ở mệnh đề chính: If she had been more careful, she would not be in trouble now.',
    ],
    questions: [
      { q: 'Had you asked me, I ___ you.', options: ['would have helped', 'would help', 'helped'], answer: 0 },
      { q: 'Were it not for your help, we ___ lost.', options: ['would be', 'would have been', 'were'], answer: 0 },
      { q: 'Had she been more careful, she ___ the mistake.', options: ['would not have made', 'would not make', 'did not make'], answer: 0 },
    ],
  },
  {
    id: 'c-participle-phrases', level: 'C', title: 'Cụm phân từ nâng cao', subtitle: 'Having finished, sent, not knowing...',
    rules: [
      'Having + V3 diễn đạt hành động xảy ra trước: Having finished the project, she left.',
      'Cụm phân từ có thể đứng sau danh từ để rút gọn mệnh đề quan hệ bị động: The letter, sent last week, has arrived. Dạng phủ định: Not knowing the answer, he stayed silent.',
    ],
    questions: [
      { q: '___ with the project, the team celebrated.', options: ['Having finished', 'Finish', 'Finishing to'], answer: 0 },
      { q: 'The letter, ___ last week, has arrived.', options: ['sent', 'sending', 'to send'], answer: 0 },
      { q: 'Not ___ the answer, he stayed silent.', options: ['knowing', 'known', 'to know'], answer: 0 },
    ],
  },
];

/** Toàn bộ bài theo thứ tự A1 → C. */
export const ALL_LESSONS: GrammarLesson[] = [...A1_LESSONS, ...A2_LESSONS, ...B1_LESSONS, ...B2_LESSONS, ...C_LESSONS];

export const LEVEL_LESSONS: Record<GrammarLevel, GrammarLesson[]> = {
  A1: A1_LESSONS,
  A2: A2_LESSONS,
  B1: B1_LESSONS,
  B2: B2_LESSONS,
  C: C_LESSONS,
};

export function lessonById(id: string): GrammarLesson | undefined {
  return ALL_LESSONS.find((l) => l.id === id);
}

/** Đạt khi trả lời đúng ít nhất 2/3 câu. */
export function gradeLesson(lesson: GrammarLesson, picked: (number | null)[]): { correct: number; total: number; passed: boolean } {
  const total = lesson.questions.length;
  const correct = lesson.questions.reduce((n, q, i) => n + (picked[i] === q.answer ? 1 : 0), 0);
  return { correct, total, passed: correct >= Math.ceil((total * 2) / 3) };
}
