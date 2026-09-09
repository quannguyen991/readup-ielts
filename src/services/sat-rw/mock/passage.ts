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
