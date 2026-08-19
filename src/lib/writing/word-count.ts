/**
 * Đếm từ theo luật chấm của IELTS.
 *
 * Không dùng `split(' ')` được, vì luật IELTS khác trực giác ở hai chỗ: từ ghép
 * nối bằng gạch nối tính MỘT từ (`well-known` = 1), còn gạch ngang dài lại chỉ
 * là dấu ngăn cách nên `one—two` là HAI từ. Con số và phần trăm cũng tính một
 * từ, nên không được tách theo ký tự không phải chữ cái.
 *
 * Con số này hiện ngay dưới ô soạn thảo và là căn cứ cảnh báo "dưới 150 từ" —
 * đếm sai thì người học tưởng đủ bài trong khi thật ra bị trừ điểm.
 */

/** Gạch ngang dài, gạch ngang ngắn và ba chấm — đều là dấu ngăn, không phải chữ. */
const SEPARATORS = /[‐‒–—―…]+/gu;

export function countWords(text: string): number {
  return text.replace(SEPARATORS, ' ').split(/\s+/u).filter(isWord).length;
}

/**
 * Một token chỉ được tính khi có ít nhất một chữ cái hoặc chữ số. Loại này bỏ
 * được dấu câu đứng lẻ (`.` `,` `...`) mà vẫn giữ `20%` và `don't`.
 */
function isWord(token: string): boolean {
  return /[\p{L}\p{N}]/u.test(token);
}
