/**
 * Dò câu trích dẫn trong một đoạn văn, chịu được sai lệch nhỏ về dấu.
 *
 * VÌ SAO KHÔNG DÙNG `indexOf`: `evidenceText` do model chép lại từ bài, và nó
 * hay "sửa" dấu trên đường — `'` thành `’`, `-` thành `–`, thêm bớt khoảng
 * trắng, đổi xuống dòng thành cách. Lệch đúng một ký tự là `indexOf` trả -1.
 *
 * Bản trước của màn chữa bài dùng `indexOf` và khi trượt thì trả về đoạn văn
 * KHÔNG TÔ GÌ, không báo lỗi. Nên triệu chứng người dùng thấy là "app không chỉ
 * ra chỗ chứa đáp án", còn nguyên nhân thì nằm ở một dấu nháy.
 *
 * Cách làm: chuẩn hoá cả đoạn và cả câu trích, dò trên bản chuẩn hoá, rồi ÁNH XẠ
 * NGƯỢC vị trí về đoạn gốc. Ánh xạ ngược là phần bắt buộc — tô theo vị trí trên
 * bản chuẩn hoá sẽ lệch dần đúng bằng số ký tự đã gộp.
 */

/** Đưa dấu nháy, gạch ngang và khoảng trắng về một dạng duy nhất. */
function canonical(char: string): string {
  if (/\s/.test(char)) return ' ';
  if ('‘’‛′'.includes(char)) return "'";
  if ('“”‟″'.includes(char)) return '"';
  if ('–—−'.includes(char)) return '-';
  return char.toLowerCase();
}

/**
 * Chuẩn hoá chuỗi, đồng thời trả về bảng tra vị trí về chuỗi gốc.
 *
 * `map[i]` = chỉ số trong chuỗi gốc của ký tự thứ `i` trong chuỗi đã chuẩn hoá.
 * Nhiều khoảng trắng liền nhau gộp thành một, nên hai bảng không cùng độ dài.
 */
function normalize(text: string): { value: string; map: number[] } {
  let value = '';
  const map: number[] = [];

  for (let i = 0; i < text.length; i += 1) {
    const char = canonical(text[i]!);
    // Khoảng trắng lặp lại gộp thành một: bài đọc có chỗ xuống dòng kép, còn
    // model thì chép lại thành một dấu cách.
    if (char === ' ' && value.endsWith(' ')) continue;
    value += char;
    map.push(i);
  }

  return { value, map };
}

export type EvidenceSpan = { start: number; end: number };

/**
 * Tìm `needle` trong `paragraph`, trả về vị trí TRONG ĐOẠN GỐC.
 *
 * `null` khi không tìm được, hoặc khi câu trích quá ngắn để đáng tô — dưới 10 ký
 * tự thì vừa dễ khớp nhầm chỗ khác, vừa chẳng chỉ ra được gì cho người đọc.
 */
export function findEvidenceSpan(paragraph: string, needle: string): EvidenceSpan | null {
  if (!paragraph || !needle) return null;

  const hay = normalize(paragraph);
  const pin = normalize(needle.trim());
  if (pin.value.length < 10) return null;

  const at = hay.value.indexOf(pin.value);
  if (at === -1) return null;

  const start = hay.map[at]!;
  // +1 vì `map` trỏ tới ký tự ĐẦU của mỗi vị trí, còn `end` là mốc cắt sau nó.
  const lastIndex = at + pin.value.length - 1;
  const end = (hay.map[lastIndex] ?? start) + 1;

  return { start, end };
}

/**
 * Gộp các đoạn tô bị chồng lấn thành một.
 *
 * Nhiều câu hỏi có thể trích cùng một chỗ, hoặc trích hai câu liền nhau. Tô
 * chồng lên nhau thì màu đè màu và ranh giới thành nhoè; gộp trước rồi tô một
 * lần cho mỗi vùng.
 */
export function mergeSpans(spans: EvidenceSpan[]): EvidenceSpan[] {
  const sorted = [...spans].sort((a, b) => a.start - b.start);
  const out: EvidenceSpan[] = [];

  for (const span of sorted) {
    const last = out[out.length - 1];
    if (last && span.start <= last.end) {
      last.end = Math.max(last.end, span.end);
      continue;
    }
    out.push({ ...span });
  }

  return out;
}
