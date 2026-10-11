import type { Bi } from '@/i18n/useL';

export type TestPart = { part: number; title: Bi; questions: number; desc: Bi };
export type TestSection = { key: string; title: Bi; minutes: number; questions: number; parts: readonly TestPart[] };

/**
 * TOEIC Listening & Reading (cấu trúc hiện hành: 200 câu, 2 kỹ năng 100 câu).
 * Nguồn: IIBC (iibc-global.org) và tổng hợp đối chiếu. Đề của ETS là nhãn hiệu của ETS;
 * Band 9 không liên kết với ETS và đề luyện là nội dung tự soạn.
 */
export const TOEIC_LR: readonly TestSection[] = [
  {
    key: 'listening',
    title: { vi: 'Listening (Nghe)', en: 'Listening' },
    minutes: 45,
    questions: 100,
    parts: [
      { part: 1, title: { vi: 'Mô tả tranh', en: 'Photographs' }, questions: 6, desc: { vi: 'Nghe 4 câu mô tả một bức ảnh, chọn câu đúng nhất. Câu nói không in trên đề.', en: 'Hear four statements about a photo and pick the best one. The statements are spoken only.' } },
      { part: 2, title: { vi: 'Hỏi – đáp', en: 'Question–response' }, questions: 25, desc: { vi: 'Nghe một câu hỏi và ba câu trả lời, chọn câu trả lời phù hợp nhất.', en: 'Hear a question and three replies, choose the best reply.' } },
      { part: 3, title: { vi: 'Hội thoại', en: 'Conversations' }, questions: 39, desc: { vi: 'Nghe 13 đoạn hội thoại, mỗi đoạn có 3 câu hỏi (đôi khi kèm bảng hoặc biểu đồ trên đề).', en: '13 conversations with three questions each; some use a chart printed on the test.' } },
      { part: 4, title: { vi: 'Bài nói ngắn', en: 'Short talks' }, questions: 30, desc: { vi: 'Nghe 10 bài nói ngắn (thông báo, tin nhắn thoại, bài giới thiệu), mỗi bài 3 câu hỏi.', en: '10 short talks (announcements, voicemails, introductions), three questions each.' } },
    ],
  },
  {
    key: 'reading',
    title: { vi: 'Reading (Đọc)', en: 'Reading' },
    minutes: 75,
    questions: 100,
    parts: [
      { part: 5, title: { vi: 'Câu chưa hoàn chỉnh', en: 'Incomplete sentences' }, questions: 30, desc: { vi: 'Chọn từ hoặc cụm từ điền vào chỗ trống: từ loại, ngữ pháp, từ vựng.', en: 'Fill the blank: part of speech, grammar and vocabulary.' } },
      { part: 6, title: { vi: 'Hoàn thành đoạn văn', en: 'Text completion' }, questions: 16, desc: { vi: 'Bốn đoạn văn (thư, thông báo...), mỗi đoạn 4 chỗ trống cần điền.', en: 'Four short texts (emails, notices) with four blanks each.' } },
      { part: 7, title: { vi: 'Đọc hiểu', en: 'Reading comprehension' }, questions: 54, desc: { vi: 'Đoạn đơn (thông báo, quảng cáo, bài báo) và nhóm 2–3 đoạn liên quan, kèm câu hỏi.', en: 'Single texts and two- or three-text sets with questions.' } },
    ],
  },
];

/** Điểm mỗi kỹ năng L&R là thang 10–990. Ngưỡng năng lực theo mô tả của IIBC/ETS. */
export const TOEIC_LR_LEVELS: readonly { min: number; max: number; name: Bi }[] = [
  { min: 905, max: 990, name: { vi: 'Thành thạo quốc tế', en: 'International Proficiency' } },
  { min: 785, max: 900, name: { vi: 'Thành thạo làm việc (cao)', en: 'Working Proficiency Plus' } },
  { min: 605, max: 780, name: { vi: 'Làm việc có giới hạn', en: 'Limited Working Proficiency' } },
  { min: 405, max: 600, name: { vi: 'Sơ cấp (cao)', en: 'Elementary Proficiency Plus' } },
  { min: 255, max: 400, name: { vi: 'Sơ cấp', en: 'Elementary Proficiency' } },
  { min: 185, max: 250, name: { vi: 'Ghi nhớ cơ bản', en: 'Memorised Proficiency' } },
  { min: 10, max: 180, name: { vi: 'Chưa đủ dùng', en: 'No Useful Proficiency' } },
];

/**
 * TOEIC Speaking & Writing. Số câu và thời gian theo tổng hợp; chưa đối chiếu
 * trực tiếp được với tài liệu của ETS nên hiển thị kèm nhãn "cần đối chiếu".
 */
export const TOEIC_SW: readonly { key: string; title: Bi; minutes: number; questions: number; scale: string; desc: Bi }[] = [
  {
    key: 'speaking',
    title: { vi: 'Speaking (Nói)', en: 'Speaking' },
    minutes: 20,
    questions: 11,
    scale: '0–200',
    desc: { vi: 'Đọc to, mô tả tranh, trả lời câu hỏi và nêu ý kiến. Ghi âm và chấm bằng máy.', en: 'Read aloud, describe a picture, answer questions and give an opinion. Recorded and machine-scored.' },
  },
  {
    key: 'writing',
    title: { vi: 'Writing (Viết)', en: 'Writing' },
    minutes: 60,
    questions: 8,
    scale: '0–200',
    desc: { vi: 'Viết một câu theo tranh, trả lời thư yêu cầu và viết bài nêu ý kiến.', en: 'Write sentences from pictures, reply to a written request, and write an opinion essay.' },
  },
];
