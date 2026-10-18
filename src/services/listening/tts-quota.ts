import { vnToday } from '@/services/gamification/golden';

/**
 * Hạn mức bản đọc Aoede cho phần Listening: mỗi người mỗi ngày (giờ Việt Nam).
 *
 * Một đề gốc đủ 4 section, nên 8 lượt là hai đề mỗi ngày. Mỗi lượt là một lời gọi
 * Gemini TTS có tiền thật, và chung hạn mức với việc tạo audio hằng ngày của chủ app.
 */
export const LISTENING_TTS_PER_DAY = 8;

/**
 * Khoá kỳ trong bảng `ai_usage`, dùng lại hàm `bump_ai_usage` có sẵn. Khoá riêng, không
 * tiền tố `YYYY-MM` của hạn mức AI, nên bản đọc không ăn vào lượt chấm bài hay tìm bài.
 */
export function listeningTtsPeriod(now: Date = new Date()): string {
  return `listening-tts:${vnToday(now).key}`;
}
