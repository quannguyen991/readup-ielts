/**
 * Tách lời giải SAT Verbal (một đoạn văn liền) thành các ý để đọc nhanh.
 *
 * 01/10/2026: người dùng chê lời giải "như viết văn, sớ" và đòi chia gạch đầu
 * dòng. `solutionVi` đến từ nhiều nguồn (kho soạn tay, bộ sinh, câu khó) nên
 * không có cấu trúc; hàm này đọc đoạn văn và trả:
 *   - `why`     : các ý giải thích vì sao đáp án đúng (mỗi câu một ý);
 *   - `wrong`   : lý do từng phương án sai (tìm theo chữ đầu của phương án);
 *   - `meaning` : bản dịch sau chữ "Nghĩa:".
 * Không tách được phần nào thì phần đó rỗng và các câu rơi vào `why`, nên
 * không bao giờ mất chữ nào.
 */
export type SolutionSource = {
  solutionVi: string;
  options: readonly string[];
  answerIndex: number;
  whyWrong?: readonly string[];
};

export type SolutionParts = {
  why: string[];
  wrong: { index: number; reason: string }[];
  meaning: string | null;
};

/** Dọn khoảng trắng thừa trước dấu câu ("độc lập : x" → "độc lập: x"). */
export function tidy(s: string): string {
  return s
    .replace(/\s+([,.;:!?])/g, '$1')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/** Tách thành câu: sau . ! ? khi chữ kế tiếp viết hoa hoặc mở ngoặc/nháy. */
export function splitSentences(s: string): string[] {
  return s
    .split(/(?<=[.!?])\s+(?=[\p{Lu}"“(])/u)
    .map((x) => tidy(x))
    .filter((x) => x.length > 0);
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Vị trí đoạn trích của phương án trong lời giải ("<đầu phương án>… — lý do"), hoặc -1. */
function findOption(text: string, option: string): number {
  const o = option.trim();
  if (o.length === 0) return -1;
  for (const n of [Math.min(o.length, 22), Math.min(o.length, 14), Math.min(o.length, 9)]) {
    const key = o.slice(0, n);
    if (key.length < 4) continue;
    const re = new RegExp(escapeRe(key), 'g');
    let m: RegExpExecArray | null;
    while ((m = re.exec(text))) {
      // Đoạn trích phải được nối với lý do bằng dấu gạch dài ngay sau đó.
      const after = text.slice(m.index, m.index + Math.min(o.length, 120) + 12);
      if (/\s[—–-]\s/.test(after) || /…\s*[—–-]/.test(after)) return m.index;
    }
  }
  return -1;
}

const cap = (s: string): string => (s ? s.charAt(0).toLocaleUpperCase('vi') + s.slice(1) : s);

export function formatSolution(q: SolutionSource): SolutionParts {
  let text = q.solutionVi.trim();

  let meaning: string | null = null;
  const mi = text.lastIndexOf('Nghĩa:');
  if (mi >= 0) {
    meaning = tidy(text.slice(mi + 'Nghĩa:'.length)) || null;
    text = text.slice(0, mi).trim();
  }

  const found: { index: number; at: number }[] = [];
  q.options.forEach((opt, i) => {
    if (i === q.answerIndex) return;
    const at = findOption(text, opt);
    if (at >= 0) found.push({ index: i, at });
  });
  found.sort((a, b) => a.at - b.at);

  const wrong: SolutionParts['wrong'] = [];
  let head = text;
  if (found.length > 0) {
    head = text.slice(0, found[0]!.at);
    found.forEach((f, k) => {
      const seg = text.slice(f.at, found[k + 1]?.at ?? text.length);
      const dash = seg.indexOf('—');
      const reasonRaw = dash >= 0 ? seg.slice(dash + 1) : seg;
      const reason = tidy(reasonRaw).replace(/^[;:,\s]+|[;\s]+$/g, '');
      if (reason) wrong.push({ index: f.index, reason: cap(reason) });
    });
  }
  // Có `whyWrong` soạn tay thì dùng, đúng thứ tự phương án.
  if (q.whyWrong && q.whyWrong.some((w) => w && w.trim())) {
    const given = q.whyWrong
      .map((w, i) => ({ index: i, reason: cap(tidy(w ?? '')) }))
      .filter((w) => w.reason && w.index !== q.answerIndex);
    if (given.length >= wrong.length) {
      wrong.length = 0;
      wrong.push(...given);
    }
  }
  wrong.sort((a, b) => a.index - b.index);

  const why = splitSentences(head);
  return { why: why.length > 0 ? why : splitSentences(text), wrong, meaning };
}
