import type { Bi } from '@/i18n/useL';

export type ToeflSection = {
  key: 'reading' | 'listening' | 'writing' | 'speaking';
  title: Bi;
  minutes: string;
  items: string;
  tasks: readonly { title: Bi; desc: Bi }[];
};

/**
 * TOEFL iBT theo định dạng có hiệu lực từ 21/01/2026. Trang ETS công khai đang hiển thị
 * định dạng cũ, các nguồn tổng hợp cho số liệu khác nhau nên thời lượng và số câu
 * được ghi dạng khoảng. Cần đối chiếu với TOEFL iBT Test Specifications 2026 của ETS.
 */
export const TOEFL_SECTIONS: readonly ToeflSection[] = [
  {
    key: 'reading',
    title: { vi: 'Reading (Đọc)', en: 'Reading' },
    minutes: '~30 phút',
    items: 'tối đa ~50 câu, thích ứng theo kết quả module 1',
    tasks: [
      { title: { vi: 'Hoàn thành từ', en: 'Complete the words' }, desc: { vi: 'Đoạn văn có những từ thiếu chữ, điền đủ chữ cho từ.', en: 'Passage with partly missing words; type the full word.' } },
      { title: { vi: 'Đọc đời sống', en: 'Read in daily life' }, desc: { vi: 'Thông báo, email, quảng cáo ngắn kèm câu hỏi.', en: 'Notices, emails and ads with questions.' } },
      { title: { vi: 'Đọc bài học thuật', en: 'Read an academic passage' }, desc: { vi: 'Bài giảng hoặc bài báo khoa học kèm câu hỏi hiểu nội dung.', en: 'Academic passage with comprehension questions.' } },
    ],
  },
  {
    key: 'listening',
    title: { vi: 'Listening (Nghe)', en: 'Listening' },
    minutes: '~27–29 phút',
    items: 'khoảng 35–47 câu, thích ứng theo kết quả module 1',
    tasks: [
      { title: { vi: 'Nghe và chọn phản hồi', en: 'Listen and choose a response' }, desc: { vi: 'Một câu nói ngắn, chọn cách đáp phù hợp.', en: 'A short utterance; choose the best reply.' } },
      { title: { vi: 'Nghe hội thoại', en: 'Listen to a conversation' }, desc: { vi: 'Đoạn hội thoại giữa sinh viên và nhân viên.', en: 'A conversation between a student and staff.' } },
      { title: { vi: 'Nghe thông báo', en: 'Listen to an announcement' }, desc: { vi: 'Thông báo của trường hoặc cơ sở.', en: 'A campus or facility announcement.' } },
      { title: { vi: 'Nghe bài giảng', en: 'Listen to an academic talk' }, desc: { vi: 'Bài giảng ngắn, kèm câu hỏi về ý chính và chi tiết.', en: 'A short lecture with questions on main ideas and details.' } },
    ],
  },
  {
    key: 'writing',
    title: { vi: 'Writing (Viết)', en: 'Writing' },
    minutes: '~23 phút',
    items: '12 nhiệm vụ',
    tasks: [
      { title: { vi: 'Ghép câu', en: 'Build a sentence' }, desc: { vi: 'Sắp xếp các cụm từ bị xáo trộn thành câu đúng.', en: 'Put scrambled word groups into a correct sentence.' } },
      { title: { vi: 'Viết email', en: 'Write an email' }, desc: { vi: 'Viết email theo tình huống, khoảng 7 phút.', en: 'Write a scenario-based email in about 7 minutes.' } },
      { title: { vi: 'Thảo luận học thuật', en: 'Write for an academic discussion' }, desc: { vi: 'Nêu và giải thích một ý kiến trong thảo luận, khoảng 10 phút.', en: 'State and support an opinion in a discussion, about 10 minutes.' } },
    ],
  },
  {
    key: 'speaking',
    title: { vi: 'Speaking (Nói)', en: 'Speaking' },
    minutes: '~8 phút',
    items: '11 nhiệm vụ',
    tasks: [
      { title: { vi: 'Nghe và lặp lại', en: 'Listen and repeat' }, desc: { vi: 'Nghe một câu rồi nhắc lại đúng nguyên văn.', en: 'Hear a sentence and repeat it exactly.' } },
      { title: { vi: 'Phỏng vấn', en: 'Take an interview' }, desc: { vi: 'Trả lời câu hỏi phỏng vấn ngắn về trải nghiệm cá nhân.', en: 'Answer short interview questions about personal experience.' } },
    ],
  },
];

export const TOEFL_SCALE_NOTE: Bi = {
  vi: 'Điểm mỗi kỹ năng và điểm tổng theo thang 1–6 (bước 0,5). Nguồn tổng hợp ghi thêm thang cũ 0–120 vẫn xuất hiện trên bảng điểm trong khoảng hai năm.',
  en: 'Each section and the overall score use a 1–6 scale in half-point steps. Some sources note the old 0–120 scale still appears on score reports for about two years.',
};
