import type { Bi } from '@/i18n/useL';

/** Một tình huống trong ca làm: khách nói một câu, có bốn đáp án, một đáp án đúng, và một gợi ý (như spec §5). */
export type ShiftQuestion = {
  id: string;
  customer: string;
  options: readonly string[];
  answer: number;
  hint: Bi;
  explanation: Bi;
};

/** Việc làm thêm gắn với một địa điểm có sẵn trên bản đồ thành phố (không vẽ thêm). */
export type StudyJob = {
  id: string;
  city: 'singapore';
  title: Bi;
  place: Bi;
  /** Mã địa điểm trong `src/data/travel/pois.ts`. */
  poi: string;
  /** Nhiệm vụ phải xong trước khi việc này mở. */
  unlockMission: string;
  questions: readonly ShiftQuestion[];
};

export const STUDY_JOBS: readonly StudyJob[] = [
  {
    id: 'sg-hawker-server',
    city: 'singapore',
    title: { vi: 'Phục vụ quầy Hawker', en: 'Hawker stall server' },
    place: { vi: 'Khu ăn vặt Hawker', en: 'Hawker centre' },
    poi: 'singapore-hawker',
    unlockMission: 'arrival',
    questions: [
      {
        id: 'seat',
        customer: 'Excuse me, is this seat taken?',
        options: ['Yes, the seat is very nice.', 'No, it is free. Please have a seat.', 'I took the seat to the station.', 'The seat is in the sea.'],
        answer: 1,
        hint: { vi: 'Câu hỏi có hay không: bắt đầu bằng “No” hoặc “Yes”, rồi mời khách.', en: 'A yes-or-no question: start with “No” or “Yes”, then invite the customer.' },
        explanation: { vi: '“No, it is free” trả lời đúng câu hỏi có hay không; “Please have a seat” mời khách ngồi.', en: '“No, it is free” answers the yes-or-no question; “Please have a seat” invites the customer to sit.' },
      },
      {
        id: 'takeaway',
        customer: 'Can I get one bowl of chicken rice to go, please?',
        options: ['Of course. That will be four dollars, please.', 'I went to the bowl yesterday.', 'Chicken rice is a very long train.', 'Please sit down and wait for the bus.'],
        answer: 0,
        hint: { vi: 'Khách xin mang đi: nhận yêu cầu trước, rồi báo giá.', en: 'The customer asks for takeaway: accept first, then state the price.' },
        explanation: { vi: '“Of course” nhận yêu cầu; “That will be…” báo giá.', en: '“Of course” accepts the request; “That will be…” states the price.' },
      },
      {
        id: 'repeat',
        customer: 'Sorry, I didn\'t catch that. Could you say it again?',
        options: ['No, I am not hungry at all.', 'Sorry, I am going to the station.', 'Of course. I said the chicken rice costs four dollars.', 'The rice is in the bus.'],
        answer: 2,
        hint: { vi: 'Khách chưa nghe rõ: nhắc lại đúng ý đã nói, mở đầu lịch sự.', en: 'The customer did not catch it: repeat the point you made, politely.' },
        explanation: { vi: 'Nhắc lại đúng ý, mở đầu lịch sự bằng “Of course”.', en: 'Repeats the point politely, opening with “Of course”.' },
      },
      {
        id: 'spicy',
        customer: 'Is there any chilli sauce? I don\'t like it too spicy.',
        options: ['Yes, we have chilli sauce. It is mild, so try a little.', 'No, the sauce is in the sea.', 'The sauce is very sweet yesterday.', 'I can\'t speak English to you.'],
        answer: 0,
        hint: { vi: 'Khách hỏi có ớt không và muốn ít cay: trả lời có hay không, rồi mô tả mức cay.', en: 'The customer asks about chilli and wants less heat: answer yes or no, then describe the heat.' },
        explanation: { vi: 'Trả lời có hay không rồi mô tả mức cay (“mild”) đúng yêu cầu của khách.', en: 'Answers yes or no, then describes the heat level (“mild”) as the customer asked.' },
      },
    ],
  },
];
