import type { Bi } from '@/i18n/useL';

/**
 * Bài luyện Viết và Nói do Band 9 tự soạn. Chưa có chấm bằng AI: người học tự đánh giá
 * theo danh sách kiểm. Thời gian gợi ý là thời gian luyện, không phải thời gian chính thức.
 */

export type WritingTask = {
  id: string;
  exam: 'toeic' | 'toefl';
  title: Bi;
  prompt: string;
  /** Từ bắt buộc phải có trong bài (nếu có). */
  requiredWords?: readonly string[];
  minWords: number;
  suggestedMinutes: number;
  checklist: readonly Bi[];
};

export type SpeakingTask = {
  id: string;
  exam: 'toeic' | 'toefl';
  title: Bi;
  prompt: string;
  prepSeconds: number;
  responseSeconds: number;
  checklist: readonly Bi[];
};

export type ChunkTask = { id: string; answer: string; chunks: readonly string[] };

export const TOEIC_WRITING: readonly WritingTask[] = [
  {
    id: 'toeic-w1',
    exam: 'toeic',
    title: { vi: 'Viết một câu', en: 'Write one sentence' },
    prompt: 'Viết một câu hoàn chỉnh có đủ hai từ "budget" và "approve".',
    requiredWords: ['budget', 'approve'],
    minWords: 6,
    suggestedMinutes: 3,
    checklist: [
      { vi: 'Đủ hai từ bắt buộc', en: 'Both required words are used' },
      { vi: 'Là một câu đầy đủ (có chủ ngữ và động từ)', en: 'It is one complete sentence with a subject and verb' },
      { vi: 'Ngữ pháp đúng, không lỗi chính tả', en: 'Grammar and spelling are correct' },
    ],
  },
  {
    id: 'toeic-w2',
    exam: 'toeic',
    title: { vi: 'Trả lời thư của khách', en: 'Reply to a customer email' },
    prompt:
      'Khách hàng viết: "Our order arrived two days late. Please tell us what you will do." Viết thư trả lời khoảng 60–80 từ: xin lỗi, nêu nguyên nhân, nêu cách xử lý, và kết thư lịch sự.',
    minWords: 60,
    suggestedMinutes: 10,
    checklist: [
      { vi: 'Có lời xin lỗi', en: 'Includes an apology' },
      { vi: 'Nêu nguyên nhân', en: 'Explains the cause' },
      { vi: 'Nêu cách xử lý cụ thể', en: 'Gives a concrete solution' },
      { vi: 'Kết thư lịch sự', en: 'Ends politely' },
    ],
  },
  {
    id: 'toeic-w3',
    exam: 'toeic',
    title: { vi: 'Nêu ý kiến', en: 'Give your opinion' },
    prompt:
      'Some people think employees should work from home. Do you agree or disagree? Give reasons and examples. Viết ít nhất 150 từ để luyện tập.',
    minWords: 150,
    suggestedMinutes: 25,
    checklist: [
      { vi: 'Có quan điểm rõ ràng', en: 'States a clear position' },
      { vi: 'Có ít nhất hai lý do', en: 'Gives at least two reasons' },
      { vi: 'Có ví dụ cụ thể', en: 'Includes a concrete example' },
      { vi: 'Có kết luận', en: 'Has a conclusion' },
    ],
  },
  {
    id: 'toeic-w4',
    exam: 'toeic',
    title: { vi: 'Viết câu với hai từ cho trước', en: 'Write a sentence with two given words' },
    prompt: 'Viết một câu hoàn chỉnh có đủ hai từ "schedule" và "delay".',
    requiredWords: ['schedule', 'delay'],
    minWords: 6,
    suggestedMinutes: 3,
    checklist: [
      { vi: 'Đủ hai từ bắt buộc', en: 'Both required words are used' },
      { vi: 'Là một câu đầy đủ', en: 'It is one complete sentence' },
      { vi: 'Ngữ pháp đúng', en: 'Grammar is correct' },
    ],
  },
  {
    id: 'toeic-w5',
    exam: 'toeic',
    title: { vi: 'Email xin lịch họp', en: 'Email requesting a meeting' },
    prompt:
      'Bạn cần gặp một nhà cung cấp để thảo luận về lô hàng bị trễ. Viết email khoảng 60–80 từ: nêu lý do, đề nghị hai khung giờ, và cảm ơn.',
    minWords: 60,
    suggestedMinutes: 10,
    checklist: [
      { vi: 'Nêu rõ mục đích cuộc họp', en: 'States the purpose of the meeting' },
      { vi: 'Đề nghị hai khung giờ', en: 'Proposes two time slots' },
      { vi: 'Có lời cảm ơn và kết thư', en: 'Thanks the reader and closes politely' },
    ],
  },
];

export const TOEFL_WRITING: readonly WritingTask[] = [
  {
    id: 'toefl-w-email',
    exam: 'toefl',
    title: { vi: 'Viết email cho giảng viên', en: 'Write an email to a professor' },
    prompt:
      'Bạn đã vắng buổi học hôm qua. Viết email cho giáo sư: xin lỗi, nêu lý do ngắn gọn, nhờ gửi ghi chép bài, và đề nghị gặp để bổ sung. Khoảng 80–120 từ.',
    minWords: 80,
    suggestedMinutes: 7,
    checklist: [
      { vi: 'Có lời chào và lời kết đúng mực', en: 'Has an appropriate greeting and closing' },
      { vi: 'Nêu lý do vắng mặt', en: 'Gives the reason for missing class' },
      { vi: 'Có yêu cầu cụ thể', en: 'Makes a specific request' },
      { vi: 'Đề nghị gặp hoặc bước tiếp theo', en: 'Offers to meet or a next step' },
    ],
  },
  {
    id: 'toefl-w-discussion',
    exam: 'toefl',
    title: { vi: 'Thảo luận học thuật', en: 'Academic discussion' },
    prompt:
      'Giáo sư hỏi: "Some universities require all students to take a foreign language course. Do you think this is a good requirement?" Bạn học Minh trả lời: "I think it is unnecessary for science majors." Viết phản hồi nêu ý kiến của bạn, giải thích và đáp lại bạn Minh. Khoảng 100 từ.',
    minWords: 100,
    suggestedMinutes: 10,
    checklist: [
      { vi: 'Nêu ý kiến rõ ràng', en: 'States an opinion clearly' },
      { vi: 'Có lý do hỗ trợ', en: 'Supports the opinion with reasons' },
      { vi: 'Đáp lại ý của bạn học', en: 'Responds to the classmate’s point' },
    ],
  },
  {
    id: 'toefl-w-discussion-2',
    exam: 'toefl',
    title: { vi: 'Thảo luận: học trực tuyến', en: 'Discussion: online courses' },
    prompt:
      'Giáo sư hỏi: "Should universities offer more online courses?" Bạn học Lan trả lời: "Online courses are cheaper, but students lose social contact." Viết phản hồi nêu ý kiến của bạn, giải thích và đáp lại bạn Lan. Khoảng 100 từ.',
    minWords: 100,
    suggestedMinutes: 10,
    checklist: [
      { vi: 'Nêu ý kiến rõ ràng', en: 'States an opinion clearly' },
      { vi: 'Có lý do hỗ trợ', en: 'Supports the opinion with reasons' },
      { vi: 'Đáp lại ý của bạn Lan', en: 'Responds to Lan’s point' },
    ],
  },
  {
    id: 'toefl-w-email-2',
    exam: 'toefl',
    title: { vi: 'Viết email xin gia hạn bài tập', en: 'Write an email asking for an extension' },
    prompt:
      'Bạn bị ốm nên chưa nộp bài tập đúng hạn. Viết email cho giáo sư: xin lỗi, nêu lý do cụ thể, đề nghị một ngày nộp mới và cho biết bạn đã làm đến đâu. Khoảng 80–120 từ.',
    minWords: 80,
    suggestedMinutes: 7,
    checklist: [
      { vi: 'Có lời chào và lời kết đúng mực', en: 'Has an appropriate greeting and closing' },
      { vi: 'Nêu lý do cụ thể', en: 'Gives a specific reason' },
      { vi: 'Đề nghị một ngày nộp mới', en: 'Proposes a new deadline' },
      { vi: 'Nói rõ tiến độ hiện tại', en: 'Explains how far the work has progressed' },
    ],
  },
  {
    id: 'toefl-w-discussion-3',
    exam: 'toefl',
    title: { vi: 'Thảo luận: hạn chế xe ô tô', en: 'Discussion: limiting cars' },
    prompt:
      'Giáo sư hỏi: "Should cities limit the number of cars in the city center?" Bạn học Hùng trả lời: "Limiting cars would hurt small shops that depend on deliveries." Viết phản hồi nêu ý kiến của bạn, giải thích và đáp lại bạn Hùng. Khoảng 100 từ.',
    minWords: 100,
    suggestedMinutes: 10,
    checklist: [
      { vi: 'Nêu ý kiến rõ ràng', en: 'States an opinion clearly' },
      { vi: 'Có lý do hỗ trợ', en: 'Supports the opinion with reasons' },
      { vi: 'Đáp lại ý của bạn Hùng', en: 'Responds to Hùng’s point' },
    ],
  },
];

export const TOEIC_SPEAKING: readonly SpeakingTask[] = [
  {
    id: 'toeic-s1',
    exam: 'toeic',
    title: { vi: 'Đọc to một câu', en: 'Read a sentence aloud' },
    prompt: 'Please remind all staff that the monthly report is due on the last Friday of the month.',
    prepSeconds: 30,
    responseSeconds: 45,
    checklist: [{ vi: 'Đọc rõ từng từ', en: 'Reads each word clearly' }, { vi: 'Ngữ điệu tự nhiên', en: 'Natural intonation' }],
  },
  {
    id: 'toeic-s2',
    exam: 'toeic',
    title: { vi: 'Trả lời về công việc', en: 'Answer about work' },
    prompt: 'Describe your daily work schedule. What tasks do you do first?',
    prepSeconds: 15,
    responseSeconds: 30,
    checklist: [{ vi: 'Trả lời đúng câu hỏi', en: 'Answers the question' }, { vi: 'Có ít nhất ba chi tiết', en: 'Gives at least three details' }],
  },
  {
    id: 'toeic-s3',
    exam: 'toeic',
    title: { vi: 'Nêu ý kiến', en: 'Express an opinion' },
    prompt: 'Should companies offer flexible working hours? Give reasons for your opinion.',
    prepSeconds: 15,
    responseSeconds: 60,
    checklist: [{ vi: 'Có quan điểm rõ', en: 'Clear position' }, { vi: 'Có lý do và ví dụ', en: 'Reasons and an example' }],
  },
  {
    id: 'toeic-s4',
    exam: 'toeic',
    title: { vi: 'Mô tả quy trình làm việc', en: 'Describe a work process' },
    prompt: 'Describe a process you follow at work. Explain each step briefly.',
    prepSeconds: 15,
    responseSeconds: 45,
    checklist: [{ vi: 'Nêu đủ các bước', en: 'Covers all the steps' }, { vi: 'Dùng từ nối (first, then, finally)', en: 'Uses linking words (first, then, finally)' }],
  },
];

export const TOEFL_SPEAKING: readonly SpeakingTask[] = [
  {
    id: 'toefl-s-interview',
    exam: 'toefl',
    title: { vi: 'Phỏng vấn ngắn', en: 'Short interview' },
    prompt: 'Tell us about a place in your city that you enjoy visiting. Why do you like it?',
    prepSeconds: 15,
    responseSeconds: 45,
    checklist: [{ vi: 'Trả lời đủ hai phần', en: 'Answers both parts' }, { vi: 'Nói liền mạch', en: 'Speaks fluently' }],
  },
  {
    id: 'toefl-s-repeat',
    exam: 'toefl',
    title: { vi: 'Nghe và lặp lại', en: 'Listen and repeat' },
    prompt: 'The library will extend its opening hours during the exam period.',
    prepSeconds: 0,
    responseSeconds: 20,
    checklist: [{ vi: 'Lặp đúng nguyên văn', en: 'Repeats the sentence exactly' }, { vi: 'Phát âm rõ', en: 'Clear pronunciation' }],
  },
  {
    id: 'toefl-s-opinion',
    exam: 'toefl',
    title: { vi: 'Nêu ý kiến', en: 'State an opinion' },
    prompt: 'Do you think students should have a part-time job during university? Explain your answer with reasons.',
    prepSeconds: 15,
    responseSeconds: 45,
    checklist: [{ vi: 'Có quan điểm rõ', en: 'States a clear position' }, { vi: 'Có ít nhất một lý do', en: 'Gives at least one reason' }],
  },
  {
    id: 'toefl-s-teacher',
    exam: 'toefl',
    title: { vi: 'Kể về một giáo viên', en: 'Describe a teacher' },
    prompt: 'Describe a teacher who influenced you. What did this teacher do, and why was it important to you?',
    prepSeconds: 15,
    responseSeconds: 45,
    checklist: [{ vi: 'Nêu rõ việc giáo viên đã làm', en: 'Explains what the teacher did' }, { vi: 'Giải thích vì sao quan trọng', en: 'Explains why it mattered' }],
  },
  {
    id: 'toefl-s-city-town',
    exam: 'toefl',
    title: { vi: 'So sánh thành phố và thị trấn', en: 'City or small town' },
    prompt: 'Some people prefer living in a big city, while others prefer a small town. Which do you prefer, and why?',
    prepSeconds: 15,
    responseSeconds: 45,
    checklist: [{ vi: 'Chọn một lựa chọn rõ ràng', en: 'Chooses one option clearly' }, { vi: 'Có ít nhất một lý do cụ thể', en: 'Gives at least one specific reason' }],
  },
];

/** Nhiệm vụ "Build a sentence" của TOEFL: sắp xếp các cụm bị xáo trộn thành câu đúng. */
export const TOEFL_BUILD: readonly ChunkTask[] = [
  { id: 'toefl-b1', answer: 'The students submitted the lab report before the deadline.', chunks: ['before the deadline', 'The students', 'submitted', 'the lab report'] },
  { id: 'toefl-b2', answer: 'Our team will conduct the survey next month.', chunks: ['next month', 'Our team', 'will conduct', 'the survey'] },
  { id: 'toefl-b3', answer: 'The data were analyzed carefully by the researchers.', chunks: ['carefully', 'The data were analyzed', 'by the researchers'] },
  { id: 'toefl-b4', answer: 'The committee approved the new policy after the vote.', chunks: ['after the vote', 'The committee', 'approved', 'the new policy'] },
  { id: 'toefl-b5', answer: 'Researchers collected samples from three different lakes.', chunks: ['from three different lakes', 'Researchers', 'collected', 'samples'] },
  { id: 'toefl-b6', answer: 'The researchers carefully compared the results with the earlier survey.', chunks: ['with the earlier survey', 'The researchers', 'carefully', 'compared', 'the results'] },
  { id: 'toefl-b7', answer: 'Students who finish the course early can join the advanced seminar.', chunks: ['can join the advanced seminar', 'Students', 'who finish', 'the course', 'early'] },
  { id: 'toefl-b8', answer: 'Researchers will publish the findings after the review is complete.', chunks: ['after the review is complete', 'Researchers', 'will publish', 'the findings'] },
  { id: 'toefl-b9', answer: 'The library has extended its opening hours for the exam period.', chunks: ['for the exam period', 'The library', 'has extended', 'its opening hours'] },
  { id: 'toefl-b10', answer: 'Students who miss the lecture should read the notes from a classmate.', chunks: ['from a classmate', 'Students who miss', 'the lecture', 'should read', 'the notes'] },
];
