/**
 * LỘ TRÌNH LUYỆN NÓI IELTS — 5 chặng (5.0 → 9.0), mỗi chặng 4 bài, tổng 20 bài.
 *
 * Câu hỏi, cụm từ và bài mẫu do Band 9 tự soạn, không chép từ đề thi hay sách nào.
 * Mỗi bài có: mục tiêu, các tiêu chí chấm, phần giải thích, cụm từ mẫu, bài tập theo
 * Part, một bài mẫu kèm lý do, lỗi thường gặp, và danh sách tự kiểm trước khi đánh dấu xong.
 */

export type Criterion = 'fluency' | 'lexical' | 'grammar' | 'pronunciation';
export type StageId = 'band5' | 'band6' | 'band7' | 'band8' | 'band9';

export type Stage = { id: StageId; band: string; titleVi: string; goalVi: string };

export type Phrase = { phrase: string; meaningVi: string; use: string };

/** `all`: bài tập không gắn riêng một Part (phát âm, ngữ điệu, tự sửa). */
export type Drill = { part: 1 | 2 | 3 | 'all'; prompt: string; hint?: string };

export type IeltsLesson = {
  id: string;
  stage: StageId;
  order: number;
  part: 1 | 2 | 3 | 'all';
  title: string;
  goal: string;
  criteria: Criterion[];
  explanation: string[];
  phrases: Phrase[];
  drills: Drill[];
  model: { prompt: string; answer: string; whyGood: string[] };
  mistakes: string[];
  checklist: string[];
  /** Mục tiêu đo được từ bản ghi: tốc độ nói (từ/phút) và tỉ lệ từ đệm tối đa. */
  target: { wpmMin: number; wpmMax: number; fillerRateMax: number };
};

export const STAGES: Stage[] = [
  { id: 'band5', band: '5.0–5.5', titleVi: 'Nền tảng', goalVi: 'Trả lời đủ ý, nói được cả câu dài hơn một từ.' },
  { id: 'band6', band: '6.0–6.5', titleVi: 'Mở rộng', goalVi: 'Có lý do, có ví dụ, nói được một phút không cần dừng dài.' },
  { id: 'band7', band: '7.0', titleVi: 'Chắc chắn', goalVi: 'Dùng cấu trúc đa dạng và collocation tự nhiên, phân tích được hai mặt vấn đề.' },
  { id: 'band8', band: '8.0', titleVi: 'Linh hoạt', goalVi: 'Diễn đạt tự nhiên, nhấn trọng âm đúng, tự sửa khi nói sai.' },
  { id: 'band9', band: '8.5–9.0', titleVi: 'Đỉnh cao', goalVi: 'Lập luận có cấu trúc, từ vựng chính xác, giữ mạch lạc ở chủ đề khó.' },
];

export const CRITERIA_INFO: { key: Criterion; titleVi: string; checkVi: string[] }[] = [
  {
    key: 'fluency',
    titleVi: 'Lưu loát & mạch lạc',
    checkVi: ['Nói liền mạch, ít khoảng lặng dài', 'Dùng từ nối để sắp xếp ý', 'Ít từ đệm (uh, um, like)'],
  },
  {
    key: 'lexical',
    titleVi: 'Vốn từ',
    checkVi: ['Dùng từ đúng ngữ cảnh', 'Có collocation tự nhiên', 'Không lặp một từ quá nhiều lần'],
  },
  {
    key: 'grammar',
    titleVi: 'Ngữ pháp',
    checkVi: ['Đa dạng cấu trúc: câu đơn, phức, điều kiện', 'Thì đúng, chủ ngữ và động từ khớp nhau', 'Lỗi không làm người nghe hiểu sai'],
  },
  {
    key: 'pronunciation',
    titleVi: 'Phát âm',
    checkVi: ['Phát âm rõ các âm cuối từ', 'Nhấn trọng âm từ và trọng âm câu', 'Ngữ điệu lên xuống tự nhiên'],
  },
];

const DEFAULT_TARGET = { wpmMin: 110, wpmMax: 160, fillerRateMax: 0.03 };

export const IELTS_LESSONS: IeltsLesson[] = [
  // ───────────── Chặng 1: Nền tảng (5.0–5.5) ─────────────
  {
    id: 'b5-01-full-answers', stage: 'band5', order: 1, part: 1,
    title: 'Trả lời đủ câu Part 1', goal: 'Mỗi câu trả lời có ít nhất hai đến ba câu, không chỉ "yes" hay "no".',
    criteria: ['fluency', 'grammar'],
    explanation: [
      'Giám khảo muốn nghe bạn nói được cả câu. Cấu trúc đơn giản nhất: trả lời trực tiếp, thêm một lý do, rồi thêm một ví dụ ngắn.',
      'Đừng dừng ngay sau khi trả lời "Yes, I do." Hãy nói tiếp: "...because it helps me relax."',
    ],
    phrases: [
      { phrase: 'Yes, I do. I usually...', meaningVi: 'Có, tôi thường...', use: 'Trả lời trực tiếp rồi mở rộng' },
      { phrase: 'I\'d say that...', meaningVi: 'Tôi cho rằng...', use: 'Nêu ý kiến một cách nhẹ nhàng' },
      { phrase: 'It helps me...', meaningVi: 'Nó giúp tôi...', use: 'Thêm lý do' },
      { phrase: 'For example,...', meaningVi: 'Ví dụ như...', use: 'Thêm một ví dụ cụ thể' },
    ],
    drills: [
      { part: 1, prompt: 'Do you like cooking?', hint: 'Trả lời trực tiếp, thêm một lý do.' },
      { part: 1, prompt: 'What do you usually do in your free time?', hint: 'Nói ít nhất hai câu.' },
      { part: 1, prompt: 'Do you prefer mornings or evenings?', hint: 'Thêm một ví dụ trong ngày của bạn.' },
    ],
    model: {
      prompt: 'Do you like reading?',
      answer: 'Yes, I do. I usually read novels before going to bed, because it helps me relax after a busy day. Last month I finished a history book, and I found it really interesting.',
      whyGood: ['Trả lời trực tiếp ở câu đầu', 'Có lý do rõ ràng', 'Có một ví dụ cụ thể'],
    },
    mistakes: ['Trả lời yes/no rồi im lặng', 'Lặp lại nguyên câu hỏi trước khi trả lời', 'Nói rất nhanh rồi dừng đột ngột'],
    checklist: ['Câu đầu có trả lời trực tiếp', 'Có ít nhất một lý do', 'Có một ví dụ', 'Mỗi câu nói được khoảng 15–20 giây'],
    target: { wpmMin: 100, wpmMax: 150, fillerRateMax: 0.05 },
  },
  {
    id: 'b5-02-linkers', stage: 'band5', order: 2, part: 1,
    title: 'Từ nối cơ bản', goal: 'Nối hai ý bằng and, but, so, because thay vì nói các câu rời rạc.',
    criteria: ['fluency'],
    explanation: [
      'Từ nối giúp người nghe thấy bạn đang đi từ ý này sang ý khác. Bắt đầu với năm từ: and, but, so, because, also.',
      'Một câu có từ nối luôn dễ nghe hơn ba câu cụt.',
    ],
    phrases: [
      { phrase: 'First of all,...', meaningVi: 'Trước hết,...', use: 'Mở đầu một danh sách ý' },
      { phrase: 'On top of that,...', meaningVi: 'Thêm vào đó,...', use: 'Bổ sung ý' },
      { phrase: 'That\'s why...', meaningVi: 'Đó là lý do...', use: 'Nêu kết quả của ý trước' },
      { phrase: 'The main reason is that...', meaningVi: 'Lý do chính là...', use: 'Nêu lý do' },
    ],
    drills: [
      { part: 1, prompt: 'Describe your hometown in three sentences, using "and", "but", and "because".' },
      { part: 1, prompt: 'Do you think you are an organised person?', hint: 'Dùng "but" để nói một mặt chưa tốt.' },
      { part: 1, prompt: 'Why do you study English?', hint: 'Dùng "because" để nêu lý do.' },
    ],
    model: {
      prompt: 'Describe your hometown.',
      answer: 'My hometown is quite small, but it is very peaceful. First of all, the people are friendly, and the food is delicious. That\'s why I always enjoy going back there.',
      whyGood: ['Dùng "but" để tạo đối lập', 'Có "first of all" để mở đầu', 'Có "that\'s why" để kết lại'],
    },
    mistakes: ['Dùng "and" cho mọi câu', 'Dùng "because" nhưng quên nói lý do', 'Nói "so" ở đầu câu rồi im'],
    checklist: ['Dùng ít nhất ba từ nối khác nhau', 'Câu có từ nối nói trơn, không ngập ngừng', 'Không lặp "and" quá ba lần'],
    target: DEFAULT_TARGET,
  },
  {
    id: 'b5-03-tenses', stage: 'band5', order: 3, part: 1,
    title: 'Thì khi nói về bản thân', goal: 'Dùng đúng thì quá khứ, hiện tại tiếp diễn và hiện tại hoàn thành khi kể về mình.',
    criteria: ['grammar'],
    explanation: [
      'Part 1 hỏi về thói quen, kinh nghiệm và việc đang diễn ra. Ba thì bạn cần chắc: hiện tại đơn (thói quen), quá khứ đơn (việc đã xảy ra), hiện tại hoàn thành (kinh nghiệm).',
    ],
    phrases: [
      { phrase: 'I usually...', meaningVi: 'Tôi thường...', use: 'Thói quen (hiện tại đơn)' },
      { phrase: 'Last weekend I...', meaningVi: 'Cuối tuần trước tôi...', use: 'Việc đã xảy ra (quá khứ đơn)' },
      { phrase: 'I\'ve been...', meaningVi: 'Tôi đã (và đang)...', use: 'Kinh nghiệm kéo dài (hiện tại hoàn thành)' },
      { phrase: 'These days I\'m...', meaningVi: 'Dạo này tôi đang...', use: 'Việc đang diễn ra' },
    ],
    drills: [
      { part: 1, prompt: 'What did you do last weekend?' },
      { part: 1, prompt: 'What are you doing these days?' },
      { part: 1, prompt: 'Have you ever travelled abroad?' },
    ],
    model: {
      prompt: 'What did you do last weekend?',
      answer: 'Last weekend I visited my grandparents in the countryside. We cooked lunch together, and I helped my grandfather in the garden.',
      whyGood: ['Dùng quá khứ đơn nhất quán', 'Câu thứ hai nối bằng "and"', 'Chi tiết cụ thể, không chung chung'],
    },
    mistakes: ['Dùng hiện tại cho việc đã xảy ra: "Last weekend I go..."', 'Quên "-ed": "I visit yesterday"', 'Dùng "have" với "ever" sai dạng'],
    checklist: ['Thì quá khứ đúng với mốc thời gian', 'Không trộn lẫn hiện tại và quá khứ trong cùng một câu', 'Có ít nhất một câu hiện tại hoàn thành'],
    target: DEFAULT_TARGET,
  },
  {
    id: 'b5-04-final-sounds', stage: 'band5', order: 4, part: 'all',
    title: 'Phát âm âm cuối', goal: 'Phát âm rõ âm cuối /s/, /t/, /d/, /k/ để từ không bị nuốt.',
    criteria: ['pronunciation'],
    explanation: [
      'Người Việt hay bỏ âm cuối: "stop" thành "sto", "cat" thành "ca". Giám khảo nghe không rõ từ là bị trừ điểm phát âm.',
      'Đọc chậm từng từ, giữ âm cuối một nhịp rồi mới dừng. Dùng trang Điều chỉnh giọng để so với mẫu.',
    ],
    phrases: [
      { phrase: 'stop, cat, book', meaningVi: 'Âm cuối /p/ /t/ /k/ phải khép', use: 'Luyện khép miệng ở cuối từ' },
      { phrase: 'likes, works, plays', meaningVi: 'Âm cuối /s/ /z/ rõ', use: 'Luyện -s cuối từ' },
      { phrase: 'walked, played', meaningVi: 'Âm cuối -ed', use: 'Luyện -ed cuối từ' },
    ],
    drills: [
      { part: 'all', prompt: 'Read aloud: "She likes to work at night, and she plays the piano every day."', hint: 'Giữ các âm cuối /s/ /t/ /d/.' },
      { part: 'all', prompt: 'Read aloud: "Stop talking, look at the book, and wait for me."', hint: 'Khép môi và lưỡi ở các âm /p/ /k/.' },
    ],
    model: {
      prompt: 'Read: "The cat walked into the kitchen."',
      answer: 'The cat walked into the kitchen.',
      whyGood: ['Âm cuối "cat" và "walked" đều rõ', 'Không thêm âm "ơ" sau âm cuối'],
    },
    mistakes: ['Bỏ âm cuối /t/ /d/ /k/', 'Thêm âm "ơ" sau âm cuối: "cat-ơ"', 'Đọc -ed thành "ét" ở mọi từ'],
    checklist: ['Đọc được từ có âm cuối /p/ /t/ /k/ mà không bỏ âm', 'Đọc -s và -ed đúng', 'Nghe lại bản ghi thấy các từ rõ'],
    target: { wpmMin: 90, wpmMax: 140, fillerRateMax: 0.05 },
  },

  // ───────────── Chặng 2: Mở rộng (6.0–6.5) ─────────────
  {
    id: 'b6-01-reasons-examples', stage: 'band6', order: 1, part: 1,
    title: 'Lý do và ví dụ trong Part 1', goal: 'Mỗi câu có đủ ba phần: trả lời, lý do, ví dụ.',
    criteria: ['fluency', 'lexical'],
    explanation: [
      'Cấu trúc ba phần: trả lời (câu 1), lý do (câu 2), ví dụ (câu 3). Lặp lại cấu trúc này giúp bạn trả lời nhanh mà vẫn có chiều sâu.',
    ],
    phrases: [
      { phrase: 'The reason I enjoy it is that...', meaningVi: 'Lý do tôi thích là...', use: 'Mở đầu phần lý do' },
      { phrase: 'Take my own experience, for instance...', meaningVi: 'Lấy kinh nghiệm của tôi làm ví dụ...', use: 'Mở đầu phần ví dụ' },
      { phrase: 'Honestly, I don\'t mind...', meaningVi: 'Thật lòng mà nói, tôi không ngại...', use: 'Trả lời mềm, tự nhiên' },
    ],
    drills: [
      { part: 1, prompt: 'Do you enjoy shopping?', hint: 'Trả lời + lý do + ví dụ.' },
      { part: 1, prompt: 'Is it important to have hobbies?', hint: 'Nêu một lý do và một ví dụ về bạn bè.' },
      { part: 1, prompt: 'What kind of food do you like?', hint: 'Đưa một ví dụ món ăn bạn thường nấu.' },
    ],
    model: {
      prompt: 'Do you enjoy cooking?',
      answer: 'Yes, I really do. The reason I enjoy it is that it lets me relax and be creative. Take last Sunday, for instance, when I made a noodle soup for my family and everyone asked for more.',
      whyGood: ['Trả lời rồi lý do rồi ví dụ', 'Có "for instance" để mở ví dụ', 'Ví dụ có chi tiết người và việc'],
    },
    mistakes: ['Chỉ đưa lý do mà không có ví dụ', 'Ví dụ quá chung chung: "sometimes"', 'Lý do lặp lại ý của câu trả lời'],
    checklist: ['Câu một trả lời trực tiếp', 'Câu hai có lý do khác với câu trả lời', 'Câu ba có một ví dụ cụ thể (người, việc, nơi)'],
    target: DEFAULT_TARGET,
  },
  {
    id: 'b6-02-p2-structure', stage: 'band6', order: 2, part: 2,
    title: 'Part 2: cấu trúc một phút', goal: 'Nói một phút cho thẻ đề: mở, ba ý, phần "and explain".',
    criteria: ['fluency', 'lexical'],
    explanation: [
      'Bạn có một phút chuẩn bị để ghi ba ý ngắn lên giấy nháp. Khi nói: mở đầu bằng một câu nêu chủ đề, mỗi ý dành khoảng 30 giây, phần cuối trả lời "and explain" bằng một lý do hoặc cảm xúc.',
      'Không cần nói đủ hai phút. Quan trọng là nói liền mạch và đi hết các ý trong thẻ.',
    ],
    phrases: [
      { phrase: 'I\'d like to talk about...', meaningVi: 'Tôi muốn nói về...', use: 'Mở đầu bài nói' },
      { phrase: 'The first thing I\'d mention is...', meaningVi: 'Điều đầu tiên tôi muốn nhắc tới là...', use: 'Chuyển sang ý một' },
      { phrase: 'What I find most interesting is...', meaningVi: 'Điều tôi thấy thú vị nhất là...', use: 'Phần "and explain"' },
    ],
    drills: [
      { part: 2, prompt: 'Describe a place you visited that you really liked.', hint: 'Nói: nơi đó là gì, bạn đến đó khi nào và với ai, vì sao bạn thích.' },
    ],
    model: {
      prompt: 'Describe a place you visited that you really liked.',
      answer: 'I\'d like to talk about a small town in the mountains that I visited last year. I went there with two friends during the summer holiday. The first thing I\'d mention is the scenery, which was incredible, with green hills and a river running through the centre. We also stayed in a family guesthouse, and the owner cooked us dinner every night. What I find most interesting is how relaxed everyone seemed, and I think that is why I still think about that trip.',
      whyGood: ['Mở đầu nêu chủ đề rõ ràng', 'Đi lần lượt qua các ý trong thẻ', 'Kết bằng phần cảm xúc và lý do'],
    },
    mistakes: ['Nói quá nhanh rồi hết ý sau một phút', 'Bỏ qua một ý trong thẻ', 'Không có phần "and explain"'],
    checklist: ['Mở đầu có chủ đề', 'Đi đủ ba ý trong thẻ', 'Có phần giải thích cảm xúc hoặc lý do', 'Nói được khoảng một phút'],
    target: { wpmMin: 110, wpmMax: 150, fillerRateMax: 0.03 },
  },
  {
    id: 'b6-03-p3-compare', stage: 'band6', order: 3, part: 3,
    title: 'Part 3: so sánh và nguyên nhân', goal: 'Trả lời câu hỏi xã hội bằng so sánh quá khứ – hiện tại và nêu nguyên nhân.',
    criteria: ['lexical', 'grammar'],
    explanation: [
      'Part 3 hỏi về xã hội và ý kiến chung. Đừng nói về bản thân nhiều. Cấu trúc hữu ích: so sánh (in the past... now...), nguyên nhân (this is mainly because...), và kết quả (as a result...).',
    ],
    phrases: [
      { phrase: 'In the past, ... whereas now...', meaningVi: 'Trước đây... còn bây giờ...', use: 'So sánh hai thời điểm' },
      { phrase: 'This is mainly because...', meaningVi: 'Điều này chủ yếu vì...', use: 'Nêu nguyên nhân' },
      { phrase: 'As a result,...', meaningVi: 'Kết quả là...', use: 'Nêu hệ quả' },
    ],
    drills: [
      { part: 3, prompt: 'How has travel changed in your country over the last twenty years?' },
      { part: 3, prompt: 'Why do some people prefer living in big cities?' },
    ],
    model: {
      prompt: 'How has travel changed in your country over the last twenty years?',
      answer: 'In the past, most people travelled by bus or train, whereas now many prefer to fly or drive their own cars. This is mainly because incomes have risen, and the roads have improved. As a result, weekend trips have become much more common.',
      whyGood: ['So sánh rõ quá khứ và hiện tại', 'Nguyên nhân có "mainly because"', 'Hệ quả có "as a result"'],
    },
    mistakes: ['Trả lời bằng kinh nghiệm cá nhân thay vì xã hội', 'Thiếu nguyên nhân', 'Dùng hiện tại cho mọi thứ, không so sánh'],
    checklist: ['Có so sánh hai thời điểm', 'Có ít nhất một nguyên nhân', 'Có một hệ quả hoặc ví dụ xã hội'],
    target: DEFAULT_TARGET,
  },
  {
    id: 'b6-04-fillers', stage: 'band6', order: 4, part: 'all',
    title: 'Giảm từ đệm và ngập ngừng', goal: 'Thay "uh", "um", "like" bằng khoảng lặng ngắn và cụm dẫn dắt.',
    criteria: ['fluency'],
    explanation: [
      'Ngập ngừng không bị trừ điểm nặng, nhưng từ đệm liên tục làm bài nghe lộn xộn. Khi cần nghĩ, hãy dùng cụm dẫn dắt thay vì "uh".',
    ],
    phrases: [
      { phrase: 'That\'s an interesting question...', meaningVi: 'Đó là một câu hỏi thú vị...', use: 'Mua thêm vài giây để nghĩ' },
      { phrase: 'Let me think for a moment...', meaningVi: 'Để tôi suy nghĩ một chút...', use: 'Mua thêm thời gian khi cần' },
      { phrase: 'If I had to put it simply,...', meaningVi: 'Nếu phải nói ngắn gọn...', use: 'Tóm tắt trước khi giải thích' },
    ],
    drills: [
      { part: 1, prompt: 'What is your favourite season? Speak for 20 seconds with no "uh" or "um".' },
      { part: 3, prompt: 'Do you think people read less than they used to?', hint: 'Dừng 1 giây thay vì nói "uh".' },
    ],
    model: {
      prompt: 'What is your favourite season?',
      answer: 'That\'s an easy one. I\'d say autumn is my favourite, because the weather is cool and the streets look beautiful. Let me think of an example... Last year I took a long walk by the lake in October, and it felt perfect.',
      whyGood: ['Cụm dẫn dắt thay cho "uh"', 'Khoảng lặng ngắn trước ví dụ', 'Trả lời trực tiếp rồi giải thích'],
    },
    mistakes: ['Nói "like" sau mỗi vài từ', 'Dừng rất lâu rồi mới nói tiếp', 'Lặp "you know" làm câu rối'],
    checklist: ['Tỉ lệ từ đệm dưới 3% (xem bản ghi)', 'Không có khoảng lặng quá 3 giây', 'Dùng ít nhất một cụm dẫn dắt'],
    target: { wpmMin: 110, wpmMax: 150, fillerRateMax: 0.03 },
  },

  // ───────────── Chặng 3: Chắc chắn (7.0) ─────────────
  {
    id: 'b7-01-collocations', stage: 'band7', order: 1, part: 2,
    title: 'Collocation trong Part 2', goal: 'Dùng cụm từ đi cùng nhau tự nhiên: make a decision, take responsibility, get along with.',
    criteria: ['lexical'],
    explanation: [
      'Người có band 7 dùng cụm từ đã quen tai người bản ngữ, ví dụ "make an effort" thay vì "do an effort". Học collocation theo cụm, không học từng từ rời.',
    ],
    phrases: [
      { phrase: 'make a decision', meaningVi: 'đưa ra quyết định', use: 'Kể về một lựa chọn' },
      { phrase: 'take responsibility for', meaningVi: 'chịu trách nhiệm về', use: 'Kể về việc đã làm' },
      { phrase: 'get along with', meaningVi: 'hợp nhau với', use: 'Kể về một người' },
      { phrase: 'make an effort', meaningVi: 'nỗ lực', use: 'Kể về việc cố gắng' },
    ],
    drills: [
      { part: 2, prompt: 'Describe a person who helped you when you needed it.', hint: 'Dùng ít nhất hai collocation từ bảng trên.' },
    ],
    model: {
      prompt: 'Describe a person who helped you when you needed it.',
      answer: 'I\'d like to talk about my old manager, who helped me a lot when I first started my job. I was nervous, but she made an effort to explain everything step by step. When I had to make a difficult decision about a project, she encouraged me to take responsibility for it, and I ended up getting along very well with the whole team.',
      whyGood: ['Dùng "make an effort" và "take responsibility" đúng nghĩa', 'Có "get along with" tự nhiên', 'Cụm từ nằm trong câu, không đứng rời'],
    },
    mistakes: ['Dùng "do a decision" thay vì "make a decision"', 'Dùng "make" cho mọi động từ', 'Học từ đơn rồi ghép sai'],
    checklist: ['Có ít nhất ba collocation đúng', 'Không ghép sai động từ với danh từ', 'Từ mới được dùng trong câu có nghĩa'],
    target: DEFAULT_TARGET,
  },
  {
    id: 'b7-02-complex-grammar', stage: 'band7', order: 2, part: 3,
    title: 'Ngữ pháp đa dạng khi nói', goal: 'Dùng câu điều kiện, mệnh đề quan hệ và câu bị động trong lời nói tự nhiên.',
    criteria: ['grammar'],
    explanation: [
      'Band 7 cần nhiều cấu trúc, nhưng đúng quan trọng hơn nhiều. Chọn một cấu trúc mỗi bài và luyện đến khi dùng được không cần nghĩ.',
    ],
    phrases: [
      { phrase: 'If the government invested more in..., people would...', meaningVi: 'Nếu chính phủ đầu tư nhiều hơn vào..., người dân sẽ...', use: 'Câu điều kiện loại 2' },
      { phrase: 'The people who...', meaningVi: 'Những người mà...', use: 'Mệnh đề quan hệ' },
      { phrase: 'It is widely believed that...', meaningVi: 'Nhiều người tin rằng...', use: 'Câu bị động ý kiến chung' },
    ],
    drills: [
      { part: 3, prompt: 'What would you change about your city if you had the power?' },
      { part: 3, prompt: 'Do you think schools should teach practical skills?' },
    ],
    model: {
      prompt: 'What would you change about your city if you had the power?',
      answer: 'If I had the power, I would build more cycle lanes, because the traffic in the centre is really heavy. Many people who commute every day would benefit from a safer route. It is widely believed that cycling would also reduce pollution, which is a real problem here.',
      whyGood: ['Câu điều kiện loại 2 đúng', 'Mệnh đề quan hệ "who commute..."', 'Câu bị động "is widely believed"'],
    },
    mistakes: ['"If I would have..." thay vì "If I had..."', 'Dùng "which" cho người', 'Bị động sai: "It is believe that..."'],
    checklist: ['Có một câu điều kiện đúng', 'Có một mệnh đề quan hệ đúng', 'Có một câu bị động đúng'],
    target: DEFAULT_TARGET,
  },
  {
    id: 'b7-03-p2-explain', stage: 'band7', order: 3, part: 2,
    title: 'Part 2: phát triển phần "and explain"', goal: 'Trả lời phần giải thích bằng hai lý do và một hệ quả.',
    criteria: ['lexical', 'grammar'],
    explanation: [
      'Phần "and explain" thường bị nói qua loa. Band 7 đưa ra hai lý do và một hệ quả cụ thể, không chỉ một câu cảm thán.',
    ],
    phrases: [
      { phrase: 'There are two main reasons why...', meaningVi: 'Có hai lý do chính khiến...', use: 'Mở phần giải thích' },
      { phrase: 'The result of this is that...', meaningVi: 'Kết quả của điều này là...', use: 'Nêu hệ quả' },
    ],
    drills: [
      { part: 2, prompt: 'Describe a book that influenced you.', hint: 'Phần "and explain": giải thích hai lý do và một hệ quả.' },
    ],
    model: {
      prompt: 'Describe a book that influenced you.',
      answer: 'I\'d like to talk about a biography of a scientist that I read at sixteen. There are two main reasons why it affected me so much. First, the author showed how failure was part of every discovery. Second, it made me want to study physics seriously. The result of this is that I changed my university subject and I still think about that book whenever I face a difficult problem.',
      whyGood: ['Hai lý do được nêu rõ bằng "two main reasons"', 'Có "the result of this is that" cho hệ quả', 'Giải thích cụ thể, không chung chung'],
    },
    mistakes: ['Phần giải thích chỉ là "because it is good"', 'Lý do không liên quan tới bài kể', 'Bỏ qua hệ quả'],
    checklist: ['Có đúng hai lý do', 'Có một hệ quả cụ thể', 'Lý do liên quan trực tiếp tới câu chuyện'],
    target: DEFAULT_TARGET,
  },
  {
    id: 'b7-04-two-sides', stage: 'band7', order: 4, part: 3,
    title: 'Part 3: phân tích hai mặt', goal: 'Trả lời câu hỏi có hai mặt: lợi, hại, và kết luận có cân nhắc.',
    criteria: ['lexical', 'fluency'],
    explanation: [
      'Khi giám khảo hỏi "Should...?", đừng chọn một phía ngay. Nêu một mặt tốt, một mặt hạn chế, rồi kết luận có điều kiện.',
    ],
    phrases: [
      { phrase: 'On the one hand,... On the other hand,...', meaningVi: 'Một mặt thì... Mặt khác thì...', use: 'Phân tích hai mặt' },
      { phrase: 'Overall, I think it depends on...', meaningVi: 'Nhìn chung, tôi nghĩ điều đó phụ thuộc vào...', use: 'Kết luận có điều kiện' },
    ],
    drills: [
      { part: 3, prompt: 'Should governments invest more in public transport or in roads?' },
      { part: 3, prompt: 'Is it better for children to learn at home or at school?' },
    ],
    model: {
      prompt: 'Should governments invest more in public transport or in roads?',
      answer: 'On the one hand, investing in roads helps people reach their jobs faster, especially in areas where public transport is limited. On the other hand, better public transport reduces traffic and pollution in the long term. Overall, I think the best approach depends on the city, but I would prioritise public transport in large urban areas.',
      whyGood: ['Có hai mặt được phân tích', 'Kết luận có điều kiện', 'Không chọn phía một cách cực đoan'],
    },
    mistakes: ['Chỉ nói một mặt', 'Kết luận quá tuyệt đối: "It is always better..."', 'Hai mặt không có lý do'],
    checklist: ['Có hai mặt được nêu', 'Có kết luận có điều kiện', 'Mỗi mặt có ít nhất một lý do'],
    target: DEFAULT_TARGET,
  },

  // ───────────── Chặng 4: Linh hoạt (8.0) ─────────────
  {
    id: 'b8-01-natural-expressions', stage: 'band8', order: 1, part: 1,
    title: 'Diễn đạt tự nhiên', goal: 'Dùng các cụm rào đón và diễn đạt bản ngữ, không học vẹt câu mẫu.',
    criteria: ['lexical', 'fluency'],
    explanation: [
      'Band 8 nghe như người bản ngữ: biết rào đón ("as far as I know"), dùng cụm đời thường vừa phải, và tránh câu mẫu học vẹt. Giám khảo nhận ra câu học vẹt rất nhanh.',
    ],
    phrases: [
      { phrase: 'As far as I know,...', meaningVi: 'Theo tôi biết thì...', use: 'Rào đón khi không chắc' },
      { phrase: 'It\'s not really my thing, but...', meaningVi: 'Không hẳn là sở thích của tôi, nhưng...', use: 'Trả lời tự nhiên' },
      { phrase: 'I\'m not a big fan of...', meaningVi: 'Tôi không mấy thích...', use: 'Nói không thích một cách lịch sự' },
    ],
    drills: [
      { part: 1, prompt: 'Are you a morning person?' },
      { part: 1, prompt: 'Do you like shopping for clothes?' },
    ],
    model: {
      prompt: 'Are you a morning person?',
      answer: 'Honestly, not really. As far as I know, I\'m more productive in the evening, but I\'ve been trying to get up earlier for work, and it\'s getting easier.',
      whyGood: ['Dùng "honestly" và "as far as I know" tự nhiên', 'Có sự đối lập và nỗ lực cụ thể'],
    },
    mistakes: ['Câu mẫu học vẹt không liên quan tới câu hỏi', 'Dùng quá nhiều idiom trong một câu', 'Thiếu rào đón khi nói ý kiến'],
    checklist: ['Có ít nhất hai cụm rào đón hoặc diễn đạt tự nhiên', 'Không có câu học vẹt không liên quan', 'Không dùng quá ba idiom trong một bài'],
    target: DEFAULT_TARGET,
  },
  {
    id: 'b8-02-stress-intonation', stage: 'band8', order: 2, part: 'all',
    title: 'Nhấn trọng âm và ngữ điệu', goal: 'Nhấn từ khóa trong câu và lên xuống giọng đúng vị trí.',
    criteria: ['pronunciation'],
    explanation: [
      'Trọng âm câu nằm ở từ mang nghĩa chính. "I didn\'t say he stole the money" có năm nghĩa khác nhau tuỳ từ được nhấn. Ngữ điệu câu hỏi Yes/No thường lên, câu kể thường xuống.',
    ],
    phrases: [
      { phrase: 'I REALLY like it.', meaningVi: 'Tôi THỰC SỰ thích nó.', use: 'Nhấn từ muốn nhấn mạnh' },
      { phrase: 'Are you coming tonight?', meaningVi: 'Tối nay bạn có đến không?', use: 'Ngữ điệu lên ở cuối (Yes/No)' },
      { phrase: 'Where is the station?', meaningVi: 'Nhà ga ở đâu?', use: 'Ngữ điệu xuống ở cuối (wh-)' },
    ],
    drills: [
      { part: 'all', prompt: 'Say "I didn\'t say she took the money" seven times, stressing a different word each time.' },
      { part: 'all', prompt: 'Read: "Are you coming to the meeting tonight?" Then: "Where is the nearest station?"' },
    ],
    model: {
      prompt: 'Read: "I really enjoyed the trip to Da Nang."',
      answer: 'I REALLY enjoyed the trip to DA NANG.',
      whyGood: ['Nhấn "really" để nhấn mạnh cảm xúc', 'Nhấn tên địa điểm mang thông tin mới'],
    },
    mistakes: ['Nhấn đều mọi từ như đọc danh sách', 'Lên giọng cuối mọi câu', 'Nuốt từ chức năng như "the", "to" thành nhỏ quá mức'],
    checklist: ['Nhấn đúng từ mang nghĩa chính', 'Câu hỏi Yes/No lên giọng cuối', 'Đối chiếu với trang Điều chỉnh giọng ít nhất một lần'],
    target: { wpmMin: 100, wpmMax: 150, fillerRateMax: 0.03 },
  },
  {
    id: 'b8-03-speculate', stage: 'band8', order: 3, part: 3,
    title: 'Part 3: suy đoán và dự báo', goal: 'Nói về tương lai và khả năng bằng các cấu trúc dự đoán có độ chắc chắn khác nhau.',
    criteria: ['grammar', 'lexical'],
    explanation: [
      'Khi được hỏi về tương lai, hãy cho thấy mức độ chắc chắn: "is likely to" (khá chắc), "might" (có thể), "I suspect" (tôi đoán). Đa dạng mức độ là dấu hiệu band cao.',
    ],
    phrases: [
      { phrase: 'It\'s likely that...', meaningVi: 'Có khả năng là...', use: 'Dự đoán khá chắc' },
      { phrase: 'I suspect that...', meaningVi: 'Tôi đoán là...', use: 'Dự đoán nhẹ' },
      { phrase: 'Things might change if...', meaningVi: 'Mọi thứ có thể thay đổi nếu...', use: 'Điều kiện của dự đoán' },
    ],
    drills: [
      { part: 3, prompt: 'How might technology change education in twenty years?' },
      { part: 3, prompt: 'Do you think cities will look very different in the future?' },
    ],
    model: {
      prompt: 'How might technology change education in twenty years?',
      answer: 'I suspect that many lessons will be personalised, so students could learn at their own pace. It\'s likely that teachers will spend more time coaching and less time lecturing. Things might change even more if internet access becomes universal.',
      whyGood: ['Dùng ba mức độ chắc chắn khác nhau', 'Có điều kiện "if"', 'Câu rõ ràng, không lan man'],
    },
    mistakes: ['Dùng "will" cho mọi dự đoán, không có mức độ', 'Dự đoán quá chung: "Everything will be better"', 'Thiếu lý do cho dự đoán'],
    checklist: ['Có ít nhất ba mức độ chắc chắn khác nhau', 'Có một điều kiện', 'Mỗi dự đoán có một lý do ngắn'],
    target: DEFAULT_TARGET,
  },
  {
    id: 'b8-04-self-correct', stage: 'band8', order: 4, part: 'all',
    title: 'Tự sửa khi nói sai', goal: 'Nhận ra lỗi của mình và sửa ngay, không bỏ dở câu.',
    criteria: ['fluency', 'grammar'],
    explanation: [
      'Ai cũng nói sai. Điểm khác giữa band 7 và band 8 là cách xử lý: tự sửa gọn gàng ("Sorry, what I meant was...") thường được đánh giá tốt hơn là cố nói tiếp câu sai.',
    ],
    phrases: [
      { phrase: 'Sorry, what I meant was...', meaningVi: 'Xin lỗi, ý tôi là...', use: 'Sửa một câu vừa nói sai' },
      { phrase: 'Let me rephrase that.', meaningVi: 'Để tôi nói lại cho rõ.', use: 'Nói lại cả ý' },
    ],
    drills: [
      { part: 'all', prompt: 'Talk for 40 seconds about your daily routine. Deliberately correct one mistake you make.' },
      { part: 'all', prompt: 'Describe a meal you enjoyed. If you make a tense mistake, stop and rephrase it.' },
    ],
    model: {
      prompt: 'Describe a meal you enjoyed.',
      answer: 'Last month I had a seafood dinner by the river. It was... sorry, let me rephrase that. It was the best seafood I\'ve had in years, and the view made it even better.',
      whyGood: ['Dừng lại và tự sửa gọn', 'Câu tiếp theo mạch lạc'],
    },
    mistakes: ['Cố nói tiếp câu sai rồi bỏ dở', 'Xin lỗi quá nhiều lần', 'Sửa lỗi trong lúc đang lặp lại câu cũ'],
    checklist: ['Có ít nhất một lần tự sửa gọn', 'Không xin lỗi quá hai lần trong một bài', 'Câu sau khi sửa đúng ngữ pháp'],
    target: DEFAULT_TARGET,
  },

  // ───────────── Chặng 5: Đỉnh cao (8.5–9.0) ─────────────
  {
    id: 'b9-01-argument', stage: 'band9', order: 1, part: 3,
    title: 'Lập luận có cấu trúc', goal: 'Mỗi ý kiến có: luận điểm, lý do, ví dụ, và hệ quả.',
    criteria: ['fluency', 'lexical', 'grammar'],
    explanation: [
      'Band 9 không chỉ trả lời đúng mà còn xây được một lập luận: luận điểm (claim), lý do (reason), ví dụ (example), và hàm ý (implication). Bốn bước này giúp bạn nói dài mà không lạc đề.',
    ],
    phrases: [
      { phrase: 'My view is that...', meaningVi: 'Quan điểm của tôi là...', use: 'Luận điểm' },
      { phrase: 'This matters because...', meaningVi: 'Điều này quan trọng vì...', use: 'Lý do' },
      { phrase: 'A clear example of this is...', meaningVi: 'Một ví dụ rõ ràng là...', use: 'Ví dụ' },
      { phrase: 'Which means that...', meaningVi: 'Điều đó có nghĩa là...', use: 'Hàm ý' },
    ],
    drills: [
      { part: 3, prompt: 'Should governments fund the arts, even when money is tight?' },
    ],
    model: {
      prompt: 'Should governments fund the arts, even when money is tight?',
      answer: 'My view is that governments should continue funding the arts, because culture shapes how people think about their community. This matters because a city without theatres or libraries tends to lose young residents. A clear example of this is a small town that rebuilt its theatre and then saw new businesses open nearby. Which means that arts funding can be an economic investment, not just a cost.',
      whyGood: ['Đủ bốn bước: luận điểm, lý do, ví dụ, hàm ý', 'Ví dụ cụ thể, không chung chung', 'Kết nối hàm ý với câu hỏi ban đầu'],
    },
    mistakes: ['Đưa luận điểm rồi không có lý do', 'Ví dụ không thật hoặc quá chung', 'Kết luận lặp lại nguyên văn luận điểm'],
    checklist: ['Có luận điểm rõ ràng ở câu đầu', 'Có lý do và ví dụ', 'Có hàm ý hoặc kết luận không lặp lại nguyên văn'],
    target: { wpmMin: 110, wpmMax: 150, fillerRateMax: 0.02 },
  },
  {
    id: 'b9-02-academic-lexis', stage: 'band9', order: 2, part: 3,
    title: 'Từ vựng học thuật chính xác', goal: 'Dùng từ học thuật đúng sắc thái: significant, considerable, undeniably.',
    criteria: ['lexical'],
    explanation: [
      'Từ học thuật chỉ có giá trị khi đúng nghĩa và đúng ngữ cảnh. Dùng "significant" khi nói về thay đổi có ý nghĩa thống kê hay quan trọng; dùng "considerable" cho số lượng lớn.',
    ],
    phrases: [
      { phrase: 'a significant impact on', meaningVi: 'tác động đáng kể tới', use: 'Nói về ảnh hưởng quan trọng' },
      { phrase: 'a considerable amount of', meaningVi: 'một lượng lớn', use: 'Nói về số lượng' },
      { phrase: 'undeniably', meaningVi: 'không thể phủ nhận', use: 'Nhấn mạnh một điều rõ ràng' },
      { phrase: 'to a large extent', meaningVi: 'ở mức độ lớn', use: 'Rào đón một cách học thuật' },
    ],
    drills: [
      { part: 3, prompt: 'Is success mainly due to talent or to hard work?' },
    ],
    model: {
      prompt: 'Is success mainly due to talent or to hard work?',
      answer: 'It is undeniable that talent opens some doors, but to a large extent, success depends on sustained effort. Many people with considerable natural ability never reach their potential, which suggests that discipline has a significant impact on outcomes.',
      whyGood: ['Từ học thuật đúng ngữ cảnh', 'Rào đón "to a large extent"', 'Câu văn cân đối, không nhồi từ'],
    },
    mistakes: ['Nhồi từ khó không đúng nghĩa', 'Dùng "very significant" (thường không cần thiết)', 'Lặp một từ học thuật nhiều lần'],
    checklist: ['Có ít nhất ba từ học thuật đúng ngữ cảnh', 'Không lặp một từ khó quá hai lần', 'Từ khó đi cùng collocation tự nhiên'],
    target: DEFAULT_TARGET,
  },
  {
    id: 'b9-03-sensitive-topics', stage: 'band9', order: 3, part: 3,
    title: 'Chủ đề xã hội và môi trường', goal: 'Trả lời chủ đề nhạy cảm một cách cân bằng, có quan điểm rõ nhưng không tuyệt đối.',
    criteria: ['fluency', 'grammar', 'lexical'],
    explanation: [
      'Chủ đề môi trường, công bằng xã hội hay công nghệ thường xuất hiện ở band cao. Giữ quan điểm rõ nhưng thừa nhận quan điểm khác và nói rằng điều đó phụ thuộc vào bối cảnh.',
    ],
    phrases: [
      { phrase: 'From my perspective,...', meaningVi: 'Theo góc nhìn của tôi,...', use: 'Nêu quan điểm' },
      { phrase: 'It largely depends on...', meaningVi: 'Phần lớn phụ thuộc vào...', use: 'Cân bằng quan điểm' },
      { phrase: 'Critics would argue that...', meaningVi: 'Những người phản đối sẽ cho rằng...', use: 'Thừa nhận quan điểm khác' },
    ],
    drills: [
      { part: 3, prompt: 'Should people be required by law to recycle?' },
      { part: 3, prompt: 'Does social media do more harm than good for young people?' },
    ],
    model: {
      prompt: 'Should people be required by law to recycle?',
      answer: 'From my perspective, some form of legal requirement is justified, because individual choices alone have not solved the problem. Critics would argue that such laws are intrusive, and that is a fair concern. Still, it largely depends on whether the system makes recycling easy, because a rule without convenient bins rarely works.',
      whyGood: ['Có quan điểm rõ', 'Thừa nhận quan điểm đối lập một cách công bằng', 'Kết luận có điều kiện, không tuyệt đối'],
    },
    mistakes: ['Nói tuyệt đối "always" hay "never"', 'Bỏ qua quan điểm khác', 'Chỉ nói chung chung không có lập trường'],
    checklist: ['Có quan điểm rõ ràng', 'Có thừa nhận ít nhất một quan điểm khác', 'Có kết luận có điều kiện'],
    target: DEFAULT_TARGET,
  },
  {
    id: 'b9-04-full-mock', stage: 'band9', order: 4, part: 'all',
    title: 'Mô phỏng thi đầy đủ và tự đánh giá', goal: 'Làm một bài thi thử đủ ba phần, rồi đối chiếu với bốn tiêu chí.',
    criteria: ['fluency', 'lexical', 'grammar', 'pronunciation'],
    explanation: [
      'Bài cuối là bài thi thử: Part 1 khoảng 4 phút, Part 2 khoảng 3 phút (1 phút chuẩn bị), Part 3 khoảng 5 phút. Sau khi nói, đối chiếu với bốn tiêu chí và ghi lại điểm yếu nhất.',
      'Nên làm bài này với gia sư "Giám khảo IELTS Speaking" để có cảm giác thật.',
    ],
    phrases: [
      { phrase: 'Let me think about that for a moment.', meaningVi: 'Để tôi nghĩ về điều đó một chút.', use: 'Mua thời gian trong phần 3' },
      { phrase: 'That\'s a question I haven\'t considered before, but...', meaningVi: 'Đó là câu hỏi tôi chưa từng nghĩ tới, nhưng...', use: 'Trả lời câu hỏi lạ' },
    ],
    drills: [
      { part: 1, prompt: 'Part 1 sample: Let\'s talk about your hometown. Where is it?' },
      { part: 2, prompt: 'Part 2 sample: Describe a time you helped someone. You have one minute to prepare.' },
      { part: 3, prompt: 'Part 3 sample: Do you think volunteering should be compulsory for students?' },
    ],
    model: {
      prompt: 'Self-check after the mock',
      answer: 'Xem lại bản ghi, đếm từ đệm, ghi lại điểm yếu nhất trong bốn tiêu chí, rồi chọn một bài ở chặng trước để luyện đúng điểm đó.',
      whyGood: ['Tự đánh giá có tiêu chí cụ thể', 'Nối lại với bài luyện trước'],
    },
    mistakes: ['Làm mock mà không ghi âm', 'Không đối chiếu với tiêu chí sau khi nói', 'Chỉ nhìn điểm tổng, không xem điểm yếu cụ thể'],
    checklist: ['Đã ghi âm đủ ba phần', 'Đã đếm từ đệm và đọc lại bản chữ', 'Đã chọn một tiêu chí cần luyện tiếp'],
    target: DEFAULT_TARGET,
  },
];

export function lessonsOfStage(stage: StageId): IeltsLesson[] {
  return IELTS_LESSONS.filter((l) => l.stage === stage).sort((a, b) => a.order - b.order);
}

export function lessonById(id: string): IeltsLesson | undefined {
  return IELTS_LESSONS.find((l) => l.id === id);
}
