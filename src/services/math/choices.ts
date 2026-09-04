import { addValue, equalsValue, formatValueMath, rat } from '@/lib/math/value';
import type { MathChoice, MathErrorTag, MathValue } from '@/lib/math/types';
import { shuffle } from '@/services/questions/rng';

/**
 * Dựng bốn lựa chọn trắc nghiệm từ đáp án đúng và các nhiễu có nhãn lỗi.
 *
 * BÀI TOÁN THẬT Ở ĐÂY là chống trùng. Nhiễu được dựng từ một sai lầm cụ thể
 * ("quên nhân phân phối thì ra số này"), nên với một số bộ tham số nó rơi trúng
 * đáp án đúng hoặc trúng một nhiễu khác. Bốn lựa chọn mà có hai cái giống nhau
 * thì câu hỏi hỏng.
 *
 * Cách xử lý: nhiễu nào trùng thì BỎ HẲN, rồi bù bằng một số cạnh đáp án và để
 * `errorTag: null`. Tuyệt đối không nhích giá trị của nhiễu cho hết trùng —
 * nhích xong thì nó không còn là "kết quả của việc quên nhân phân phối" nữa,
 * mà màn Review vẫn đang nói với người học rằng đó chính là lỗi họ mắc. Thà
 * không gọi tên lỗi còn hơn gọi sai tên.
 *
 * So sánh theo GIÁ TRỊ chứ không theo chuỗi hiển thị: 6/4 và 3/2 hiện ra khác
 * nhau nhưng là một số, để lọt vào cùng một câu là người học loại trừ được.
 */
export function buildChoices(
  correct: MathValue,
  candidates: Array<{ value: MathValue; errorTag: MathErrorTag | null; note?: string }>,
  rng: () => number,
  format: (value: MathValue) => string = formatValueMath,
): { choices: MathChoice[]; correctIndex: number } {
  const values: MathValue[] = [correct];
  const picked: Array<{ value: MathValue; errorTag: MathErrorTag | null; note?: string }> = [];

  for (const candidate of candidates) {
    if (picked.length === 3) break;
    if (values.some((v) => equalsValue(v, candidate.value))) continue;
    values.push(candidate.value);
    picked.push(candidate);
  }

  // Bù cho đủ ba nhiễu. Đi xa dần khỏi đáp án nên luôn dừng được.
  //
  // Nhiễu bù mang ghi chú NÓI THẲNG rằng nó không ứng với sai lầm nào. Để
  // trống thì màn Review chỉ báo được "sai" mà không nói thêm gì, và người học
  // ngồi đoán xem mình đã nghĩ hỏng ở đâu — trong khi sự thật là chẳng ở đâu cả.
  for (let step = 1; picked.length < 3; step += 1) {
    for (const delta of [step, -step]) {
      if (picked.length === 3) break;
      const value = addValue(correct, rat(delta));
      if (values.some((v) => equalsValue(v, value))) continue;
      values.push(value);
      picked.push({
        value,
        errorTag: null,
        note: 'Không có cách hiểu sai nào dẫn tới đúng số này — nó chỉ nằm cạnh đáp án. Nếu bạn chọn nó thì nhiều khả năng là lỗi tính toán ở bước cuối.',
      });
    }
  }

  const correctChoice: MathChoice = { display: format(correct), errorTag: null };
  const all = shuffle(
    [
      correctChoice,
      ...picked.map((p) => ({ display: format(p.value), errorTag: p.errorTag, note: p.note })),
    ],
    rng,
  );

  return { choices: all, correctIndex: all.indexOf(correctChoice) };
}

/**
 * Dựng lựa chọn khi đáp án KHÔNG phải một con số: biểu thức đại số, hoặc cả một
 * câu kết luận thống kê.
 *
 * Khác `buildChoices` ở chỗ không bù được nhiễu: không có "số cạnh đáp án" nào
 * cho một câu văn. Nên template phải tự đưa đủ ba nhiễu khác nhau, và hàm này
 * chỉ kiểm rồi trộn. Thiếu thì ném lỗi ngay lúc sinh — property test bắt được ở
 * `npm test` chứ không để người học mở ra thấy câu ba lựa chọn.
 */
export function buildTextChoices(
  correct: string,
  distractors: Array<{ display: string; errorTag: MathErrorTag | null; note?: string }>,
  rng: () => number,
): { choices: MathChoice[]; correctIndex: number } {
  const seen = new Set([correct]);
  const picked: MathChoice[] = [];

  for (const candidate of distractors) {
    if (picked.length === 3) break;
    if (seen.has(candidate.display)) continue;
    seen.add(candidate.display);
    picked.push(candidate);
  }

  if (picked.length < 3) {
    throw new Error(
      `Chỉ dựng được ${picked.length} nhiễu khác nhau cho "${correct}" — template phải đưa thêm.`,
    );
  }

  const correctChoice: MathChoice = { display: correct, errorTag: null };
  const all = shuffle([correctChoice, ...picked], rng);
  return { choices: all, correctIndex: all.indexOf(correctChoice) };
}
