import seed from './seed/video-library/index.json';

/**
 * Thư viện video luyện nghe.
 *
 * CHỈ CHỨA SIÊU DỮ LIỆU ĐỂ NHÚNG — id video, tiêu đề, tên kênh, thời lượng.
 * Không có phụ đề, không có nội dung video. Video phát qua trình nhúng chính
 * thức của YouTube, đúng cách nó được thiết kế để dùng; phần nội dung vẫn thuộc
 * về chủ kênh và người xem vẫn được tính lượt xem cho họ.
 *
 * Danh sách tuyển thẳng từ trang kênh trên YouTube bằng
 * `scripts/build-video-library.mjs`, KHÔNG lấy từ nền tảng học nào khác: danh
 * sách bài của một app khác là công sức tuyển chọn của họ.
 *
 * MỘT SỰ THẬT PHẢI NÓI RÕ, vì nó định hình cả tính năng: app KHÔNG tự lấy được
 * phụ đề. Đo cả hai đường vào 05/09/2026 — máy chủ Vercel gọi `timedtext` nhận
 * HTTP 200 nhưng 0 byte, mọi client InnerTube trả về 0 caption track; còn từ
 * trình duyệt thì trang watch bị CORS chặn và InnerTube cũng bị chặn. YouTube
 * nay đòi tham số ký sinh từ chính trình phát của họ.
 *
 * Nên thư viện này KHÔNG hứa "bấm là có bài". Nó hứa đúng thứ nó làm được: chọn
 * sẵn video hợp trình độ, và người học dán phụ đề một lần cho mỗi video. Đã dán
 * rồi thì `useVideoTranscriptStore` nhớ lại, lần sau vào là làm ngay.
 */

export type LibraryVideo = {
  id: string;
  title: string;
  channel: string;
  level: string;
  topic: string;
  durationSeconds: number | null;
};

export const LIBRARY_VIDEOS: LibraryVideo[] = seed as LibraryVideo[];

/** Trình độ, xếp từ dễ tới khó chứ không theo bảng chữ cái. */
export const VIDEO_LEVELS = ['A2', 'B1', 'B2', 'C1'] as const;

export const VIDEO_TOPICS: string[] = [...new Set(LIBRARY_VIDEOS.map((v) => v.topic))];

export const VIDEO_CHANNELS: string[] = [...new Set(LIBRARY_VIDEOS.map((v) => v.channel))].sort();

export function getLibraryVideo(id: string): LibraryVideo | undefined {
  return LIBRARY_VIDEOS.find((v) => v.id === id);
}

/**
 * Ảnh đại diện lấy thẳng từ CDN ảnh của YouTube.
 *
 * Không tải về máy chủ mình: ảnh là của chủ kênh, và dẫn thẳng thì nó luôn khớp
 * với ảnh hiện tại của video kể cả khi chủ kênh đổi.
 */
export function thumbnailUrl(id: string): string {
  return `https://i.ytimg.com/vi/${id}/mqdefault.jpg`;
}

export function formatDuration(seconds: number | null): string | null {
  if (seconds === null) return null;
  // Xét theo GIÂY, không theo phút đã làm tròn: 45 giây làm tròn lên thành "1
  // phút", nghe như dài gấp rưỡi thực tế.
  if (seconds < 60) return 'dưới 1 phút';
  return `${Math.round(seconds / 60)} phút`;
}

export function filterVideos(filters: { level?: string; topic?: string; search?: string } = {}): LibraryVideo[] {
  const { level = 'all', topic = 'all', search = '' } = filters;
  const q = search.trim().toLowerCase();

  return LIBRARY_VIDEOS.filter((v) => {
    if (level !== 'all' && v.level !== level) return false;
    if (topic !== 'all' && v.topic !== topic) return false;
    if (q && !v.title.toLowerCase().includes(q) && !v.channel.toLowerCase().includes(q)) return false;
    return true;
  });
}

export function videoLibraryStats() {
  const byLevel: Record<string, number> = {};
  for (const v of LIBRARY_VIDEOS) byLevel[v.level] = (byLevel[v.level] ?? 0) + 1;
  return {
    videos: LIBRARY_VIDEOS.length,
    channels: VIDEO_CHANNELS.length,
    topics: VIDEO_TOPICS.length,
    byLevel,
  };
}
