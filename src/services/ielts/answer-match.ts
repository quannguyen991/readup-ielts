/**
 * So đáp án khi chấm đề Cambridge. Khoá đáp án nhập từ sách có nhiều dạng không khớp thẳng với chữ người học gõ:
 * "flavour / flavor", "intestines/gut", "floor(s)", "(food) consumption", "B – Tên người", "C/D" (hai ý, thứ tự tuỳ ý),
 * "F" thay cho FALSE, "4 sides" so với "four sides". Mọi dạng đó đều được tách thành các phương án chấp nhận được.
 */

const ABBREVIATIONS: Record<string, string> = { t: 'true', f: 'false', ng: 'not given', y: 'yes', n: 'no' };
/** TRUE/FALSE và YES/NO là cùng một nghĩa; khoá ghi một kiểu thì chấp nhận cả kiểu kia. */
const FAMILY: Record<string, string> = { true: 'yes', yes: 'true', false: 'no', no: 'false' };
const NUMBER_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'];

export function normalizeAnswer(value: string): string {
  return value
    .normalize('NFKC')
    .toLocaleLowerCase()
    .replace(/(\d)[,.](?=\d{3}\b)/g, '$1')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function withoutParens(text: string): string[] {
  const groups = text.match(/\([^)]*\)/g) ?? [];
  if (groups.length === 0 || groups.length > 3) return [text];
  const out: string[] = [];
  for (let mask = 0; mask < 1 << groups.length; mask += 1) {
    let i = 0;
    out.push(text.replace(/\([^)]*\)/g, (g) => ((mask >> i++) & 1 ? g.slice(1, -1) : '')));
  }
  return out;
}

function numberVariants(text: string): string[] {
  const out = [text];
  const words = text.split(' ');
  words.forEach((w, i) => {
    const asNumber = /^\d{1,2}$/.test(w) ? Number(w) : -1;
    if (asNumber >= 0 && asNumber <= 20) out.push([...words.slice(0, i), NUMBER_WORDS[asNumber]!, ...words.slice(i + 1)].join(' '));
    const idx = NUMBER_WORDS.indexOf(w);
    if (idx >= 0) out.push([...words.slice(0, i), String(idx), ...words.slice(i + 1)].join(' '));
  });
  return out;
}

/** Tách một khoá đáp án thành các phương án đúng (đã chuẩn hoá). */
export function expandExpected(raw: string | string[] | undefined | null): string[] {
  if (raw === undefined || raw === null) return [];
  if (Array.isArray(raw)) return [...new Set(raw.flatMap((r) => expandExpected(r)))];
  const text = String(raw).trim();
  if (!text) return [];
  const pieces: string[] = [];
  if (/^[A-I]\s*([,&]\s*[A-I]\s*)+$/.test(text)) pieces.push(...text.split(/[,&]/));
  else pieces.push(...text.split(/\s*\/\s*|\s+(?:or|hoặc)\s+/i));
  const out = new Set<string>();
  for (const piece of pieces) {
    const p = piece.trim();
    if (!p) continue;
    const named = /^([A-I])\s*[–—-]\s*\S/.exec(p);
    // khoá tiêu đề kèm số La Mã / chữ cái: "v) Potential threat…", "F. Incineration…", "D original plans"
    const headed = /^([ivx]{1,5}|[A-I])\s*[).:]\s+\S/.exec(p) ?? /^([A-I])\s+[a-z]/.exec(p);
    const bases = named ? [p, named[1]!] : headed ? [p, headed[1]!] : [p];
    for (const base of bases) {
      for (const v of withoutParens(base)) {
        const n = normalizeAnswer(v);
        if (!n) continue;
        for (const w of numberVariants(n)) out.add(w);
        const abbr = ABBREVIATIONS[n];
        if (abbr) out.add(abbr);
        const full = abbr ?? n;
        const twin = FAMILY[full];
        if (twin) out.add(twin);
      }
    }
  }
  return [...out];
}

export function answerMatches(given: string, rawExpected: string | string[] | undefined | null): boolean {
  const g = normalizeAnswer(given ?? '');
  if (!g) return false;
  const gv = numberVariants(g);
  return expandExpected(rawExpected).some((e) => gv.includes(e));
}
