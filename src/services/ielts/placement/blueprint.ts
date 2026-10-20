/**
 * Khung đề kiểm tra đầu vào IELTS (Academic). Đây là LUẬT của bài thi, không phải giao diện:
 * số phần, số câu, số phút, thứ tự. Màn làm bài và bộ chấm đều đọc từ đây, nên đổi một con số
 * thì cả hai cùng đổi.
 *
 * Khổ theo format thi thật: Listening 4 phần / 40 câu / 30 phút (kể cả 10 phút chép đáp án);
 * Reading 3 bài / 40 câu / 60 phút; Writing 2 bài / 60 phút (Task 1 tối thiểu 150 từ,
 * Task 2 tối thiểu 250 từ).
 *
 * Đề này tự soạn, không sao chép đề thi chính thức (đề IELTS có bản quyền).
 */

export const READING = { parts: 3, questions: 40, minutes: 60 } as const;
export const LISTENING = { parts: 4, questions: 40, minutes: 30 } as const;
export const WRITING = { tasks: 2, minutes: 60, minWords: { task1: 150, task2: 250 } } as const;

/** Số phút đồng hồ của cả bài đọc, tính bằng mili-giây. */
export const READING_DURATION_MS = READING.minutes * 60_000;
