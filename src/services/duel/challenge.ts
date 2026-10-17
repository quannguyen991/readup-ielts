/**
 * THÁCH ĐẤU BẤT ĐỒNG BỘ — gửi kết quả qua đường dẫn, không cần máy chủ lưu.
 *
 * Người thách chơi một ván (cùng cách chấm như phòng 1–1), rồi gửi đường dẫn
 * chứa: bộ từ, hạt giống đề, điểm và số câu đúng. Người nhận mở đường dẫn sẽ
 * làm đúng bộ câu đó, rồi so điểm.
 *
 * GIỚI HẠN CẦN BIẾT: điểm trong đường dẫn do người thách tự ghi, không có máy
 * chủ kiểm chứng. Đây là chơi vui giữa bạn bè, không dùng để xếp hạng chính thức.
 */

export type ChallengePayload = {
  /** Mã bộ từ (slug). */
  d: string;
  /** Hạt giống đề: cùng hạt + cùng bộ từ thì ra cùng câu hỏi. */
  s: string;
  /** Điểm người thách. */
  p: number;
  /** Số câu đúng của người thách. */
  c: number;
  /** Tổng số câu của ván. */
  t: number;
};

const VERSION = 1;

function toBase64Url(text: string): string {
  return btoa(text).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(text: string): string {
  const padded = text.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (text.length % 4)) % 4);
  return atob(padded);
}

export function encodeChallenge(payload: ChallengePayload): string {
  return toBase64Url(JSON.stringify({ v: VERSION, ...payload }));
}

/** Trả về null nếu chuỗi không phải thách đấu hợp lệ — không bao giờ ném lỗi ra màn hình. */
export function decodeChallenge(raw: string): ChallengePayload | null {
  if (!raw || raw.length > 400) return null;
  try {
    const data = JSON.parse(fromBase64Url(raw)) as Partial<ChallengePayload> & { v?: number };
    if (data.v !== VERSION) return null;
    if (typeof data.d !== 'string' || data.d.length === 0 || data.d.length > 80) return null;
    if (typeof data.s !== 'string' || data.s.length === 0 || data.s.length > 80) return null;
    if (!Number.isInteger(data.p) || (data.p as number) < 0 || (data.p as number) > 5000) return null;
    if (!Number.isInteger(data.t) || (data.t as number) < 1 || (data.t as number) > 20) return null;
    if (!Number.isInteger(data.c) || (data.c as number) < 0 || (data.c as number) > (data.t as number)) return null;
    return { d: data.d, s: data.s, p: data.p as number, c: data.c as number, t: data.t as number };
  } catch {
    return null;
  }
}

/** Hạt giống ngẫu nhiên cho ván thách đấu mới. */
export function newChallengeSeed(rand: () => number = Math.random): string {
  return Math.floor(rand() * 36 ** 6).toString(36).padStart(6, '0');
}

export type ChallengeVerdict = 'win' | 'lose' | 'draw';

export function verdictOf(mine: number, theirs: number): ChallengeVerdict {
  if (mine === theirs) return 'draw';
  return mine > theirs ? 'win' : 'lose';
}
