import { Platform } from 'react-native';
import * as Speech from 'expo-speech';

/**
 * GIỌNG ĐỌC TIẾNG ANH CHUNG CỦA CẢ APP — giọng NỮ, chọn một lần cho mọi chỗ đọc.
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
import { bestVoice } from './voice-pick';

let chosen: string | undefined;
let loading = false;

/** Nạp danh sách giọng (trên web danh sách tới trễ nên hỏi lại vài lần). */
function load(attempt = 0) {
  if (loading && attempt === 0) return;
  loading = true;
  void Speech.getAvailableVoicesAsync()
    .then((all) => {
      const v = bestVoice(all.map((x) => ({ identifier: x.identifier, name: x.name, language: x.language })));
      if (v) chosen = v.identifier;
      else if (attempt < 6) setTimeout(() => load(attempt + 1), 400);
    })
    .catch(() => undefined);
}

if (Platform.OS === 'web' && typeof window !== 'undefined') load();

/** Mã giọng nữ tiếng Anh đã chọn (undefined khi chưa nạp xong — máy dùng giọng mặc định). */
export function englishVoice(): string | undefined {
  if (!chosen) load();
  return chosen;
}
