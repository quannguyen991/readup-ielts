/**
 * Ví dụ trong bài lý thuyết có dạng "(is / are)" thì cho người học bấm chọn
 * trước khi mở lời giải. Hai hàm thuần, test được không cần react-native.
 */

/** "(is / are)" trong đề → các lựa chọn. Không có thì null. */
export function choicesIn(problem: string): string[] | null {
  const m = problem.match(/\(([^()]{1,40}?\s\/\s[^()]{1,40}?)\)/);
  if (!m) return null;
  const opts = m[1]!.split(/\s\/\s/).map((x) => x.trim()).filter(Boolean);
  return opts.length >= 2 && opts.length <= 4 ? opts : null;
}

/**
 * Lựa chọn nào khớp đáp án. Ưu tiên khớp NGUYÊN VĂN: "scientists’" không được
 * coi là khớp với lựa chọn "scientists" chỉ vì bắt đầu giống nhau.
 */
export function matchingChoice(choices: string[], answer: string): string | null {
  const a = answer.trim().toLowerCase();
  const exact = choices.find((c) => c.toLowerCase() === a);
  if (exact) return exact;
  // Khớp theo tiền tố nhưng ngay sau đó phải hết chữ: "were — …" khớp "were".
  const byWord = choices.filter((c) => {
    const k = c.toLowerCase();
    return a.startsWith(k) && !/[\p{L}’']/u.test(a.charAt(k.length));
  });
  return byWord.length === 1 ? byWord[0]! : null;
}
