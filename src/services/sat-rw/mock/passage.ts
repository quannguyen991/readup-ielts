/**
 * Tách văn bản kép của câu "nối hai văn bản" thành từng khối có nhãn.
 *
 * VÌ SAO PHẢI CÓ HÀM NÀY. 24 câu trong kho lưu hai văn bản trong MỘT chuỗi, ngăn
 * nhau bằng đúng chữ "Văn bản 1" / "Văn bản 2" và KHÔNG có ký tự xuống dòng. In
 * thẳng chuỗi ấy ra màn hình thì hai văn bản dính liền thành một đoạn, giữa đoạn
 * lù lù chữ "Văn bản 2" — người học không thấy được đâu là ranh giới, mà ranh
 * giới chính là thứ câu hỏi đang hỏi.
 *
 * NHÃN DỊCH SANG "Text N", và đây là sửa lỗi chứ không phải đổi giọng văn: cả 24
 * câu ấy đều có đề bài tiếng Anh nhắc tới "Text 1" / "Text 2" (không câu nào
 * viết "Văn bản"). Trang hiện "Văn bản 1" trong khi đề hỏi về "Text 1" bắt người
 * học phải tự đoán hai cái là một.
 *
 * Chuỗi không có dấu ngăn nào thì trả về đúng một khối không nhãn — phần lớn câu
 * trong kho là như vậy, và chúng không được phép đổi cách hiển thị.
 */

export type PassageBlock = {
  /** `null` khi văn bản đứng một mình, không cần nhãn. */
  label: string | null;
  text: string;
};

const MARKER = /Văn bản\s*(\d+)\s*/g;

export function splitPassage(passage: string): PassageBlock[] {
  const blocks: PassageBlock[] = [];
  let cursor = 0;
  let label: string | null = null;

  for (const m of passage.matchAll(MARKER)) {
    const at = m.index ?? 0;
    const text = passage.slice(cursor, at).trim();
    /*
      Chỉ đẩy khối khi có chữ. Dấu ngăn đứng ngay đầu chuỗi (trường hợp thường
      gặp nhất) sẽ tạo một khối rỗng, và một khối rỗng in ra là một nhãn treo
      lơ lửng không có văn bản nào dưới nó.
    */
    if (text) blocks.push({ label, text });
    label = `Text ${m[1]}`;
    cursor = at + m[0].length;
  }

  const tail = passage.slice(cursor).trim();
  if (tail) blocks.push({ label, text: tail });

  return blocks.length > 0 ? blocks : [{ label: null, text: passage }];
}

/* ------------------------------------------------------------- gạch chân */

export type TextRun = { text: string; underlined: boolean };

/**
 * Cắt một khối văn bản quanh đoạn được gạch chân.
 *
 * VÌ SAO CẦN. 17 câu trong kho hỏi thẳng về "the underlined sentence" / "the
 * underlined claim in Text 1". Không gạch chân gì thì người học phải tự đoán câu
 * nào đang bị hỏi — đoán sai là làm sai, mà cái sai ấy không nói lên gì về việc
 * họ có hiểu bài hay không. `scripts/mark-underlines.ts` đặt dấu vào kho, hàm
 * này chỉ lo phần cắt ra để vẽ.
 *
 * KHÔNG TÌM THẤY THÌ TRẢ VỀ NGUYÊN KHỐI, không ném lỗi: đoạn gạch chân nằm trong
 * Text 1 nên khi vẽ Text 2 sẽ không khớp, và đó là chuyện bình thường chứ không
 * phải hỏng. Việc canh cho mọi câu hỏi "underlined" đều CÓ dấu là của test, chỗ
 * đúng để bắt lỗi ấy — không phải giữa lúc người ta đang thi.
 */
export function markUnderline(text: string, underline?: string): TextRun[] {
  if (!underline) return [{ text, underlined: false }];

  const at = text.indexOf(underline);
  if (at < 0) return [{ text, underlined: false }];

  return [
    { text: text.slice(0, at), underlined: false },
    { text: underline, underlined: true },
    { text: text.slice(at + underline.length), underlined: false },
  ].filter((run) => run.text.length > 0);
}
