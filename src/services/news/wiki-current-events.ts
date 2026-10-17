/**
 * Đổi trang "Portal:Current events" của Wikipedia (dạng wikitext) thành các tin tiếng
 * Anh để luyện đọc.
 *
 * GIẤY PHÉP: nội dung Wikipedia thuộc CC BY-SA 4.0. Vì vậy mỗi tin mang kèm
 * `sourceUrl` và `license`, màn hình phải ghi nguồn, và bản dẫn xuất cũng phải chia
 * sẻ theo CC BY-SA. Các hàm ở đây chỉ đổi đánh dấu wiki sang chữ thường, không viết
 * lại nghĩa.
 */

export type WikiNewsItem = {
  /** Ngày + số thứ tự trong ngày, ví dụ "2026-10-16-3". */
  id: string;
  /** Ngày của trang tin, dạng YYYY-MM-DD. */
  date: string;
  /** Mục của trang, tiếng Anh gốc, ví dụ "Armed conflicts and attacks". */
  section: string;
  /** Dòng tin chính. */
  headline: string;
  /** Các ý chi tiết (gạch đầu dòng cấp 2 trở xuống). */
  details: string[];
  sourceUrl: string;
  license: 'CC BY-SA 4.0';
};

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const SUPERSCRIPT: Record<string, string> = { '2': '²', '3': '³' };

const ENTITIES: Record<string, string> = {
  '&nbsp;': ' ',
  '&amp;': '&',
  '&quot;': '"',
  '&#39;': "'",
  '&apos;': "'",
  '&ndash;': '–',
  '&mdash;': '—',
  '&lt;': '<',
  '&gt;': '>',
};

/** Tên trang của một ngày, ví dụ "Portal:Current events/2026 October 16". */
export function currentEventsTitle(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  return `Portal:Current events/${y} ${MONTHS[(m ?? 1) - 1]} ${d}`;
}

export function currentEventsUrl(isoDate: string): string {
  return `https://en.wikipedia.org/wiki/${currentEventsTitle(isoDate).replace(/ /g, '_')}`;
}

/** Mẫu `{{...}}`: chỉ giữ giá trị có nghĩa cho vài mẫu thường gặp, còn lại bỏ hẳn. */
function templateText(body: string): string {
  const parts = body.split('|').map((p) => p.trim());
  const name = (parts[0] ?? '').toLowerCase();

  if (name === 'convert') {
    // {{convert|5796|km2|sqmi|abbr=on}} -> "5796 km²"
    const value = parts[1] ?? '';
    const unit = (parts[2] ?? '').replace(/(\d)$/, (d) => SUPERSCRIPT[d] ?? d);
    return unit ? `${value} ${unit}` : value;
  }

  if (['nowrap', 'nobr', 'lang', 'transliteration', 'transl'].includes(name)) {
    const positional = parts.slice(1).filter((p) => p && !p.includes('='));
    return positional[positional.length - 1] ?? '';
  }

  return '';
}

/** Đổi một đoạn wikitext thành chữ thường: bỏ link, mẫu, thẻ và ký hiệu định dạng. */
export function wikiToPlain(raw: string): string {
  let s = raw
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<ref[^>]*\/>/g, '')
    .replace(/<ref[^>]*>[\s\S]*?<\/ref>/g, '');

  // Mẫu có thể lồng nhau: thay phần trong cùng trước, lặp tới khi hết.
  let prev = '';
  while (prev !== s) {
    prev = s;
    s = s.replace(/\{\{([^{}]*)\}\}/g, (_, body: string) => templateText(body));
  }

  s = s
    .replace(/\[\[(?:File|Image|Category):[^\]]*\]\]/gi, '')
    .replace(/\[\[([^\]|]*)\|([^\]]*)\]\]/g, '$2')
    .replace(/\[\[([^\]]*)\]\]/g, '$1')
    .replace(/\[(https?:\/\/[^\s\]]+)\s+([^\]]+)\]/g, '$2')
    .replace(/\[https?:\/\/[^\s\]]+\]/g, '')
    .replace(/'{2,}/g, '')
    .replace(/<\/?[a-zA-Z][^>]*>/g, '')
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCodePoint(Number(n)))
    .replace(/&[a-zA-Z]+;/g, (e) => ENTITIES[e] ?? e);

  return s
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.;:!?%)\]])/g, '$1')
    .replace(/([(\[])\s+/g, '$1')
    .trim();
}

/**
 * Tách các tin từ wikitext của một ngày.
 *
 * Dòng `'''Tên mục'''` mở một mục. Gạch đầu dòng cấp 1 (`*`) là một tin, cấp 2 trở
 * xuống (`**`) là ý chi tiết của tin đứng trước. Dòng trước mục đầu tiên (khung mẫu,
 * ghi chú) bị bỏ.
 */
export function parseCurrentEvents(wikitext: string, isoDate: string): WikiNewsItem[] {
  const sourceUrl = currentEventsUrl(isoDate);
  const rows: { section: string; headline: string; details: string[] }[] = [];
  let section = '';
  let current: { section: string; headline: string; details: string[] } | null = null;

  for (const raw of wikitext.split('\n')) {
    const line = raw.trimEnd();

    const head = /^'''(.+?)'''\s*$/.exec(line);
    if (head) {
      section = wikiToPlain(head[1] ?? '');
      current = null;
      continue;
    }

    const bullet = /^(\*+)\s*(.*)$/.exec(line);
    if (!bullet || !section) continue;

    const depth = (bullet[1] ?? '').length;
    const text = wikiToPlain(bullet[2] ?? '');
    if (!text) continue;

    if (depth === 1) {
      current = { section, headline: text, details: [] };
      rows.push(current);
    } else if (current) {
      current.details.push(text);
    }
  }

  return rows
    .filter((r) => r.headline.length >= 12 || r.details.length > 0)
    .map((r, i) => ({
      id: `${isoDate}-${i + 1}`,
      date: isoDate,
      section: r.section,
      headline: r.headline,
      details: r.details,
      sourceUrl,
      license: 'CC BY-SA 4.0' as const,
    }));
}
