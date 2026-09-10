import { Platform } from 'react-native';

/**
 * Tiếng chuông ngắn khi làm đúng.
 *
 * TỰ TỔNG HỢP BẰNG WEB AUDIO, KHÔNG NẠP TỆP. Một tệp mp3 dù ngắn cũng là thêm
 * một thứ phải tải, phải đặt tên, phải nhớ chép vào bản build, và phải chọn giấy
 * phép cho nó. Hai nốt sin có bao đóng nhanh thì dựng bằng mười dòng và nặng
 * đúng không byte nào.
 *
 * MỘT `AudioContext` DÙNG LẠI cho cả phiên. Trình duyệt giới hạn số context mở
 * được (Chrome cho khoảng sáu), và màn chép chính tả thì bắn tiếng này mỗi câu —
 * tạo mới mỗi lần là sau mươi câu trình duyệt lặng thinh không báo gì.
 *
 * TẠO MUỘN, sau cú bấm đầu tiên. Dựng `AudioContext` lúc trang vừa mở thì nó ra
 * đời ở trạng thái `suspended` (chính sách tự phát của trình duyệt) và Chrome in
 * một cảnh báo vào console mỗi lần tải trang.
 *
 * NATIVE THÌ IM LẶNG — có chủ ý, không phải bỏ sót. Bản native chưa cài
 * `expo-audio`; thêm một phụ thuộc gốc chỉ để kêu hai nốt là cái giá phải bàn
 * riêng, còn phần web thì không nên đợi nó.
 */

let ctx: AudioContext | null = null;

/** Trình duyệt cũ để `AudioContext` sau tiền tố. */
function audioContextClass(): typeof AudioContext | null {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;
  const w = window as unknown as {
    AudioContext?: typeof AudioContext;
    webkitAudioContext?: typeof AudioContext;
  };
  return w.AudioContext ?? w.webkitAudioContext ?? null;
}

function context(): AudioContext | null {
  const Ctor = audioContextClass();
  if (!Ctor) return null;
  if (!ctx) {
    try {
      ctx = new Ctor();
    } catch {
      return null;
    }
  }
  return ctx;
}

/** Một nốt sin, vào nhanh ra chậm. */
function note(ac: AudioContext, hz: number, startAt: number, seconds: number, gain: number): void {
  const osc = ac.createOscillator();
  const amp = ac.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(hz, startAt);

  /*
    Bao đóng phải có, không được bật/tắt thẳng. Một sóng sin bị cắt ngang giữa
    chu kỳ tạo ra tiếng "tách" ở loa — nghe như lỗi chứ không như tiếng chuông.
  */
  amp.gain.setValueAtTime(0, startAt);
  amp.gain.linearRampToValueAtTime(gain, startAt + 0.012);
  amp.gain.exponentialRampToValueAtTime(0.0001, startAt + seconds);

  osc.connect(amp).connect(ac.destination);
  osc.start(startAt);
  osc.stop(startAt + seconds + 0.02);
}

/**
 * Hai nốt đi lên — E6 rồi A6.
 *
 * ĐI LÊN chứ không đi xuống: quãng lên nghe như "xong rồi, tiếp đi", quãng
 * xuống nghe như báo hỏng. Đây là quy ước người dùng đã quen từ mọi phần mềm
 * khác, không phải chỗ để sáng tạo.
 *
 * Nuốt mọi lỗi: một tiếng chuông không kêu được thì không đáng làm hỏng màn làm
 * bài. Trả về `true` khi thực sự phát, để test hoặc nơi gọi biết.
 */
export function playCorrectChime(): boolean {
  const ac = context();
  if (!ac) return false;

  try {
    /* Trình duyệt treo context khi tab ẩn; đánh thức trước rồi mới xếp nốt. */
    if (ac.state === 'suspended') void ac.resume();

    const t = ac.currentTime;
    note(ac, 1318.51, t, 0.12, 0.16); // E6
    note(ac, 1760.0, t + 0.085, 0.22, 0.13); // A6
    return true;
  } catch {
    return false;
  }
}
