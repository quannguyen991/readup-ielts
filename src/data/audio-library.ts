import seed from './seed/audio-library/index.json';

/**
 * Thư viện NGHE có sẵn lời — nguồn VOA Learning English.
 *
 * VÌ SAO CÓ THƯ VIỆN NÀY BÊN CẠNH THƯ VIỆN VIDEO
 *
 * Thư viện video vướng một chỗ không đi qua được: YouTube nay đòi tham số ký
 * sinh từ chính trình phát của họ, nên app không lấy được phụ đề (đo cả hai
 * đường ngày 05/09/2026 — máy chủ nhận 0 byte, trình duyệt bị CORS chặn). Hệ
 * quả là mỗi video người học phải tự dán phụ đề một lần.
 *
 * Cách đi vòng qua chỗ khoá ấy đều là làm ngược điều nền tảng nói rõ là không
 * cho, và đều hỏng lại vào lần sau họ đổi. Nên chọn đường thẳng: ĐỔI NGUỒN.
 *
 * VOA Learning English do Voice of America sản xuất — cơ quan liên bang Hoa Kỳ
 * — nên thuộc **phạm vi công cộng**: điều khoản của họ cho in lại chữ, MP3 và
 * ảnh cho cả mục đích giáo dục lẫn thương mại, miễn ghi nguồn
 * learningenglish.voanews.com. Mỗi bài có sẵn MP3 phát thẳng, TOÀN VĂN lời đọc,
 * và một bảng chú giải từ do chính ban biên tập soạn.
 *
 * ⇒ Bài ở đây **bấm là làm được ngay**, không phải dán gì cả.
 *
 * HAI THƯ VIỆN KHÔNG THAY NHAU, chúng bù cho nhau:
 *
 *   video (YouTube)  giọng bản xứ, tốc độ THẬT, có mốc thời gian thật
 *                    ⇒ chép chính tả được; đổi lại phải dán phụ đề
 *   âm thanh (VOA)   giọng Mỹ đọc CHẬM hơn tự nhiên, không có mốc thời gian
 *                    ⇒ nghe hiểu ngay, không phải chuẩn bị gì
 *
 * Nói rõ chỗ này quan trọng: nếu chỉ luyện trên tài liệu đọc chậm rồi tưởng đã
 * nghe được, thì vào phòng thi gặp giọng nói ở tốc độ thật sẽ vỡ.
 */

export type LibraryAudio = {
  id: string;
  title: string;
  /** Tên chuyên mục của VOA, ví dụ "American Stories". */
  program: string;
  level: string;
  topic: string;
  audioUrl: string;
  sourceUrl: string;
  publishedAt: string | null;
  words: number;
  chunk: number;
};

export const LIBRARY_AUDIO: LibraryAudio[] = seed as LibraryAudio[];

export const AUDIO_LEVELS = ['A2', 'B1', 'B2', 'C1'] as const;

export const AUDIO_TOPICS: string[] = [...new Set(LIBRARY_AUDIO.map((a) => a.topic))];

export const AUDIO_PROGRAMS: string[] = [...new Set(LIBRARY_AUDIO.map((a) => a.program))].sort();

/** Ghi nguồn — bắt buộc theo điều khoản của VOA, và hiện ngay trên màn luyện. */
export const AUDIO_NGUON = {
  ten: 'VOA Learning English',
  trang: 'learningenglish.voanews.com',
  giay_phep: 'Phạm vi công cộng (tác phẩm của cơ quan liên bang Hoa Kỳ)',
};

export function getLibraryAudio(id: string): LibraryAudio | undefined {
  return LIBRARY_AUDIO.find((a) => a.id === id);
}

/**
 * Thời lượng ƯỚC LƯỢNG theo số từ.
 *
 * Chỉ dùng để người học ước chừng bài dài bao nhiêu TRƯỚC khi bấm vào. Thời
 * lượng thật đọc được từ chính tệp MP3 lúc phát, và màn luyện dùng con số thật
 * đó chứ không dùng số này.
 *
 * 130 từ/phút là tốc độ đọc của VOA Learning English — chậm hơn hội thoại tự
 * nhiên (~160) một cách có chủ ý.
 */
const TU_MOI_PHUT = 130;

export function estimateMinutes(words: number): number {
  return Math.max(1, Math.round(words / TU_MOI_PHUT));
}

export function formatLength(words: number): string {
  return `~${estimateMinutes(words)} phút`;
}

export function filterAudio(
  filters: { level?: string; topic?: string; search?: string } = {},
): LibraryAudio[] {
  const { level = 'all', topic = 'all', search = '' } = filters;
  const q = search.trim().toLowerCase();

  return LIBRARY_AUDIO.filter((a) => {
    if (level !== 'all' && a.level !== level) return false;
    if (topic !== 'all' && a.topic !== topic) return false;
    if (q && !a.title.toLowerCase().includes(q) && !a.program.toLowerCase().includes(q)) return false;
    return true;
  });
}

export function audioLibraryStats() {
  const byLevel: Record<string, number> = {};
  for (const a of LIBRARY_AUDIO) byLevel[a.level] = (byLevel[a.level] ?? 0) + 1;
  return {
    items: LIBRARY_AUDIO.length,
    programs: AUDIO_PROGRAMS.length,
    topics: AUDIO_TOPICS.length,
    words: LIBRARY_AUDIO.reduce((s, a) => s + a.words, 0),
    byLevel,
  };
}
