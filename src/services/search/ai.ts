/**
 * TÌM BÀI BẰNG AI — phần thuần (dựng lời nhắc, kiểm câu trả lời), dùng chung cho
 * route `/api/search/ai` và test.
 *
 * Nguyên tắc: AI CHỈ ĐƯỢC CHỌN, KHÔNG ĐƯỢC BỊA. Máy chủ lọc sẵn một danh sách
 * ứng viên từ chỉ mục thật, đánh số lại thành `c1…cN`, và AI chỉ được trả về
 * các số đó. Mọi số lạ bị bỏ, nên không có đường nào để một đường dẫn bịa lọt
 * ra giao diện.
 *
 * Vì sao đánh số lại thay vì gửi mã thật: mã bài đọc là UUID 36 ký tự — model
 * chép lại hay sai một hai ký tự, và một mã sai là một gợi ý mất trắng. "c7" thì
 * không chép sai được.
 */
import type { Locale } from '@/i18n/keys';

import { searchEntries } from './match';
import type { SearchEntry } from './types';

/** Số ứng viên tối đa gửi cho AI (ngoài các mục cấp trang). */
export const SHORTLIST_SIZE = 40;
/** Trần tổng — giữ lời nhắc ngắn để model rẻ trả lời nhanh. */
export const MAX_CANDIDATES = 90;
export const MAX_PICKS = 6;
export const MAX_QUERY_LENGTH = 300;

/**
 * Danh sách ứng viên cho một câu hỏi: các mục khớp nhất (chế độ lỏng — câu hỏi
 * tự nhiên ít khi khớp đủ mọi chữ) cộng các mục cấp trang làm lưới an toàn, để
 * AI vẫn chỉ được chỗ đúng khi câu hỏi không trùng chữ nào với tên bài.
 */
export function shortlistIds(query: string, entries: readonly SearchEntry[]): string[] {
  const hits = searchEntries(query, entries, { mode: 'loose', limit: SHORTLIST_SIZE }).map((h) => h.entry.id);
  const sections = entries.filter((e) => e.kind === 'page' || e.kind === 'test').map((e) => e.id);
  return [...new Set([...hits, ...sections])].slice(0, MAX_CANDIDATES);
}

/**
 * Gộp danh sách client gửi với danh sách máy chủ tự tính, chỉ giữ mã có thật.
 * Client gửi gì cũng không thêm được mục ngoài chỉ mục.
 */
export function mergeCandidates(
  clientIds: unknown,
  serverIds: readonly string[],
  byId: (id: string) => SearchEntry | undefined,
): SearchEntry[] {
  const fromClient = Array.isArray(clientIds)
    ? clientIds.filter((id): id is string => typeof id === 'string' && id.length <= 200).slice(0, SHORTLIST_SIZE)
    : [];
  const out: SearchEntry[] = [];
  const seen = new Set<string>();
  for (const id of [...fromClient, ...serverIds]) {
    if (seen.has(id)) continue;
    seen.add(id);
    const entry = byId(id);
    if (entry) out.push(entry);
    if (out.length >= MAX_CANDIDATES) break;
  }
  return out;
}

export type AiPrompt = {
  system: string;
  user: string;
  /** `aliases[i]` là mã thật của ứng viên `c{i+1}`. */
  aliases: string[];
};

function clean(text: string): string {
  return text.replace(/[\r\n|]+/g, ' ').replace(/\s+/g, ' ').trim();
}

const EXAM_LABEL: Record<SearchEntry['exam'], string> = { ielts: 'IELTS', sat: 'SAT', both: 'IELTS+SAT' };

export function buildAiSearchPrompt(query: string, candidates: readonly SearchEntry[], locale: Locale): AiPrompt {
  const aliases = candidates.map((c) => c.id);
  const lines = candidates.map((c, i) => {
    const title = locale === 'en' ? c.title.en || c.title.vi : c.title.vi;
    const sub = c.subtitle ? (locale === 'en' ? c.subtitle.en : c.subtitle.vi) : '';
    return [
      `c${i + 1}`,
      c.kind,
      EXAM_LABEL[c.exam],
      clean(title).slice(0, 110),
      clean(sub).slice(0, 70),
      c.level ? clean(c.level) : '',
    ].join(' | ');
  });

  const language = locale === 'en' ? 'English' : 'tiếng Việt';
  const system = [
    'You are the lesson finder of Band 9, an IELTS and SAT practice app for Vietnamese learners.',
    'The learner describes what they want to practise. Pick the 3 to 6 CANDIDATES that best serve that need.',
    'Rules:',
    '- Only use ids from the CANDIDATES list (c1, c2, ...). Never invent ids, titles or links.',
    '- Prefer specific lessons/sets that match topic, skill, exam and level; add one broader section only if it clearly helps.',
    '- Skill words: "nghe" = listening, "đọc" = reading, "viết" = writing, "nói" = speaking, "từ vựng" = vocabulary, "toán" = math.',
    `- Write each reason in ${language}, one short sentence (max 20 words), saying why it fits this learner.`,
    `- "tip": one practical sentence in ${language}, or an empty string.`,
    'Reply with strict JSON only, no markdown fence:',
    '{"picks":[{"id":"c1","reason":"..."}],"tip":"..."}',
  ].join('\n');

  const user = [`LEARNER REQUEST: ${clean(query).slice(0, MAX_QUERY_LENGTH)}`, '', 'CANDIDATES (id | kind | exam | title | detail | level):', ...lines].join('\n');

  return { system, user, aliases };
}

export type AiPick = { id: string; reason: string };
export type AiPicks = { picks: AiPick[]; tip: string };

function stripMarkup(text: string): string {
  return text
    .replace(/\*\*|__|`/g, '')
    .replace(/^#+\s*/gm, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Bóc và KIỂM câu trả lời của model.
 *
 * Chấp nhận "c7", "C7", "7" hoặc chính mã thật nằm trong danh sách. Bỏ mã lạ,
 * mã trùng; cắt lời giải thích quá dài; tối đa `MAX_PICKS` mục. Trả `null` khi
 * không còn mục hợp lệ nào — lúc đó route rơi về kết quả tìm thường.
 */
export function parseAiPicks(text: string, aliases: readonly string[]): AiPicks | null {
  const from = text.indexOf('{');
  const to = text.lastIndexOf('}');
  if (from < 0 || to <= from) return null;
  let raw: unknown;
  try {
    raw = JSON.parse(text.slice(from, to + 1));
  } catch {
    return null;
  }
  if (!raw || typeof raw !== 'object') return null;
  const body = raw as { picks?: unknown; tip?: unknown };
  if (!Array.isArray(body.picks)) return null;

  const allowed = new Set(aliases);
  const picks: AiPick[] = [];
  const seen = new Set<string>();
  for (const item of body.picks) {
    if (!item || typeof item !== 'object') continue;
    const { id, reason } = item as { id?: unknown; reason?: unknown };
    if (typeof id !== 'string' && typeof id !== 'number') continue;
    const key = String(id).trim();
    const alias = /^c?(\d{1,3})$/i.exec(key);
    const real = alias ? aliases[Number(alias[1]) - 1] : allowed.has(key) ? key : undefined;
    if (!real || seen.has(real)) continue;
    seen.add(real);
    const why = typeof reason === 'string' ? stripMarkup(reason) : '';
    picks.push({ id: real, reason: why.length > 220 ? `${why.slice(0, 217).trimEnd()}…` : why });
    if (picks.length >= MAX_PICKS) break;
  }
  if (picks.length === 0) return null;

  const tipRaw = typeof body.tip === 'string' ? stripMarkup(body.tip) : '';
  return { picks, tip: tipRaw.length > 260 ? `${tipRaw.slice(0, 257).trimEnd()}…` : tipRaw };
}
