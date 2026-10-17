import seed from './seed/video-library/index.json';
import seedBilingual from './seed/bilingual-videos.json';

/**
 * Thư viện video luyện nghe.
 *
 * Chứa siêu dữ liệu của các video tuyển chọn (CNN, BBC News, Vietnam Today, Podcast, TED-Ed)
 * kèm các video có sẵn phụ đề song ngữ Anh - Việt.
 */

export type LibraryVideo = {
  id: string;
  title: string;
  channel: string;
  level: string;
  topic: string;
  durationSeconds: number | null;
};

const bilingualVideos: LibraryVideo[] = (seedBilingual.videos ?? []) as LibraryVideo[];
const bilingualIdSet = new Set(bilingualVideos.map((v) => v.id));
const otherVideos = (seed as LibraryVideo[]).filter((v) => !bilingualIdSet.has(v.id));

export const LIBRARY_VIDEOS: LibraryVideo[] = [...bilingualVideos, ...otherVideos];
export const BILINGUAL_VIDEO_IDS = new Set(Object.keys(seedBilingual.prepared ?? {}));

export function isBilingualVideo(id: string): boolean {
  return BILINGUAL_VIDEO_IDS.has(id);
}

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

export function filterVideos(filters: { level?: string; topic?: string; channel?: string; search?: string } = {}): LibraryVideo[] {
  const { level = 'all', topic = 'all', channel = 'all', search = '' } = filters;
  const q = search.trim().toLowerCase();

  return LIBRARY_VIDEOS.filter((v) => {
    if (level !== 'all' && v.level !== level) return false;
    if (topic !== 'all' && v.topic !== topic) return false;
    if (channel !== 'all' && v.channel !== channel) return false;
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
