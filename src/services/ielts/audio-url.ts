/**
 * Đường dẫn audio của đề IELTS.
 *
 * Cambridge 21 được đưa vào public/ để bản deploy phát được. Các đề còn lại vẫn đọc từ
 * .local-private qua API cục bộ, nên chỉ chạy trên máy dev.
 */
export function ieltsAudioUrl(name: string): string {
  if (!name) return '';
  if (name.startsWith('http://') || name.startsWith('https://')) return name;
  if (/^cambridge21-listening-test\d-part\d\.mp3$/.test(name)) return `/audio/ielts/cam21/${name}`;
  return `/api/ielts/local-ocr?asset=${encodeURIComponent(name)}`;
}
