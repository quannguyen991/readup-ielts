import { Platform } from 'react-native';
import * as Speech from 'expo-speech';

/**
 * GIỌNG ĐỌC TIẾNG ANH CHUNG CỦA CẢ APP — chỉ hai giọng: một NỮ, một NAM (mặc định nữ), mỗi giới chọn giọng tốt nhất của máy.
 *
 * Người dùng muốn giọng nữ thay cho giọng mặc định của máy. Tên giọng khác nhau
 * theo máy (Windows có Aria/Jenny/Zira, Mac có Samantha/Ava, Chrome có "Google US
 * English"), nên chấm điểm theo tên:
 *   - tên nữ quen thuộc: +10; tên nam: loại hẳn;
 *   - giọng nơ-ron ("natural", "neural", "premium", "enhanced", "online"): +5 —
 *     có ngữ điệu, nghe cả câu không mệt;
 *   - Anh–Mỹ +2, Anh–Anh +1.
 * Máy không có giọng nữ nào thì dùng giọng tiếng Anh tốt nhất còn lại (không nam).
 */
import { bestVoiceFor, type Gender, type VoiceInfo } from './voice-pick';

let all: VoiceInfo[] = [];
const chosen: Partial<Record<Gender, string>> = {};
let loading = false;

/** Giới đang chọn ("Nữ / Nam" trong Cài đặt học từ), mặc định nữ. */
export function voiceGender(): Gender {
  // Device TTS is only a temporary fallback for the configured female clip voice.
  return 'f';
}

/** Nạp danh sách giọng (trên web danh sách tới trễ nên hỏi lại vài lần). */
function load(attempt = 0) {
  if (loading && attempt === 0) return;
  loading = true;
  void Speech.getAvailableVoicesAsync()
    .then((list) => {
      all = list.map((x) => ({ identifier: x.identifier, name: x.name, language: x.language }));
      const f = bestVoiceFor(all, 'f');
      const m = bestVoiceFor(all, 'm');
      if (f) chosen.f = f.identifier;
      if (m) chosen.m = m.identifier;
      if (!f && !m && attempt < 6) setTimeout(() => load(attempt + 1), 400);
    })
    .catch(() => undefined);
}

if (Platform.OS === 'web' && typeof window !== 'undefined') load();

/** Giọng tiếng Anh tốt nhất của một giới trên máy (undefined khi chưa nạp / không có — máy dùng giọng mặc định). */
export function englishVoiceFor(gender: Gender): string | undefined {
  if (!chosen[gender]) load();
  return chosen[gender] ?? (gender === 'm' ? undefined : chosen.f);
}

/** Mã giọng đọc chung của cả app, theo giới đã chọn. */
export function englishVoice(): string | undefined {
  return englishVoiceFor(voiceGender());
}
