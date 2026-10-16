/**
 * Gọi giám khảo AI (route /api/hub/tutor) và đọc phản hồi theo luồng.
 *
 * Route trả về văn bản thuần theo từng mẩu, nên client đọc luồng và báo văn bản đã có
 * ngay khi nó tới. Giao diện hiện chữ dần trong lúc AI đang viết, không chờ cả đoạn.
 */

export type ExaminerOutcome =
  | { ok: true; text: string }
  | { ok: false; reason: 'signed_out' | 'quota' | 'busy' | 'failed'; message: string };

export async function askExaminer(args: {
  tutorId: string;
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  token: string | null;
  onChunk?: (soFar: string) => void;
}): Promise<ExaminerOutcome> {
  if (!args.token) return { ok: false, reason: 'signed_out', message: 'Đăng nhập để trò chuyện với giám khảo.' };

  let res: Response;
  try {
    res = await fetch('/api/hub/tutor', {
      method: 'POST',
      headers: { Authorization: `Bearer ${args.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ tutorId: args.tutorId, messages: args.messages }),
    });
  } catch {
    return { ok: false, reason: 'failed', message: 'Mất kết nối. Thử lại khi có mạng.' };
  }

  if (res.status === 401) return { ok: false, reason: 'signed_out', message: 'Phiên đăng nhập đã hết. Đăng nhập lại để tiếp tục.' };
  if (res.status === 429) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    return { ok: false, reason: 'quota', message: data.error ?? 'Đã hết lượt AI của tháng này.' };
  }
  if (res.status === 503) return { ok: false, reason: 'busy', message: 'AI đang bận, thử lại sau ít phút.' };
  if (!res.ok || !res.body) return { ok: false, reason: 'failed', message: 'Giám khảo chưa trả lời được, thử lại.' };

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let text = '';
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    text += decoder.decode(value, { stream: true });
    args.onChunk?.(text);
  }
  text += decoder.decode();
  const clean = text.trim();
  if (!clean) return { ok: false, reason: 'failed', message: 'Giám khảo trả lời trống, thử lại.' };
  return { ok: true, text: clean };
}

/**
 * Đọc JSON nhận xét từ phản hồi AI. Model đôi khi bọc JSON trong chữ hoặc khối mã, nên tìm
 * cặp ngoặc nhọn ngoài cùng. Không đọc được thì trả về null để giao diện chỉ hiện số liệu đo được.
 */
export function parseFeedbackJson(raw: string): { grammar: string[]; coherence: string[]; vocabulary: string[] } | null {
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start < 0 || end <= start) return null;
  try {
    const data = JSON.parse(raw.slice(start, end + 1)) as Record<string, unknown>;
    const pick = (key: string): string[] =>
      Array.isArray(data[key]) ? (data[key] as unknown[]).filter((x): x is string => typeof x === 'string').slice(0, 4) : [];
    return { grammar: pick('grammar'), coherence: pick('coherence'), vocabulary: pick('vocabulary') };
  } catch {
    return null;
  }
}
