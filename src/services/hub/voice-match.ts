/**
 * Ghép câu người học vừa nói với một phương án trả lời. Đếm tỷ lệ từ nội dung của phương án có
 * mặt trong câu nói; từ phụ (a, the, I…) không tính. Chỉ chọn khi khớp ít nhất một nửa và không
 * có phương án khác khớp ngang bằng, để tránh chọn nhầm khi nghe chưa rõ.
 */

const STOP = new Set([
  'a', 'an', 'the', 'i', 'to', 'of', 'is', 'it', 'you', 'and', 'or', 'be', 'my', 'me', 'for', 'on', 'in', 'at',
  'that', 'this', 'please', 'would', 'could', 'with', 'do', 'does', 'so', 'if', 'as', 'by', 'are', 'was', 'we', 'your',
]);

const MIN_RATIO = 0.5;

export function contentWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9'\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 0 && !STOP.has(w));
}

export function matchChoice(transcript: string, options: { text: string }[]): { index: number; score: number } | null {
  const heard = new Set(contentWords(transcript));
  if (heard.size === 0) return null;
  const scored = options
    .map((opt, index) => {
      const words = contentWords(opt.text);
      const common = words.filter((w) => heard.has(w)).length;
      return { index, score: words.length ? common / words.length : 0 };
    })
    .sort((a, b) => b.score - a.score);
  const [best, second] = scored;
  if (!best || best.score < MIN_RATIO) return null;
  if (second && second.score === best.score) return null;
  return best;
}
