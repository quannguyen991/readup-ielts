/**
 * Mở khoá câu mẫu THEO TỪNG TỪ.
 *
 * Cách luyện: câu mẫu hiện ra dưới dạng các ô bị che — mỗi từ chỉ lộ chữ cái
 * đầu, phần còn lại là dấu sao đúng bằng số chữ còn thiếu ("teaches" →
 * "t******"). Người học gõ bản dịch của mình; gõ đúng từ nào thì ô đó lật ra.
 *
 * Vì sao khớp TUẦN TỰ và chặn ở từ sai đầu tiên, chứ không đếm số từ trùng:
 * đếm số từ trùng sẽ cho điểm cả khi người học gõ đúng từ nhưng sai chỗ, mà
 * trật tự từ chính là thứ bài tập này rèn. Chặn ở từ sai đầu tiên còn cho một
 * lợi ích nữa: chỗ dừng lại chính là chỗ cần suy nghĩ, nên giao diện chỉ cần
 * tô đúng một ô là người học biết phải sửa từ nào.
 *
 * Bài tập này KHÁC "dịch tự do" ở chỗ nó nhận đúng một đáp án. Đó là lựa chọn
 * có chủ đích, không phải hạn chế: mục tiêu ở đây là tái tạo một mẫu câu đã
 * biết cho tới khi thuộc tay, chứ không phải đánh giá một bản dịch mới. Chấm
 * bản dịch tự do vẫn nằm ở chế độ khác.
 */

export type RevealStatus = 'solved' | 'active' | 'locked';

export type RevealToken = {
  /** Nguyên văn trong câu mẫu, giữ hoa/thường và dấu câu bám theo. */
  word: string;
  /** Dạng đã chuẩn hoá để so khớp: thường hoá, bỏ dấu câu. */
  key: string;
  /** Chuỗi hiện khi chưa mở: chữ cái đầu + sao, cộng dấu câu nếu có. */
  masked: string;
  status: RevealStatus;
};

export type RevealState = {
  tokens: RevealToken[];
  solvedCount: number;
  total: number;
  done: boolean;
  /** Phần vừa gõ đã lệch khỏi câu mẫu — ô đang mở cần được tô cảnh báo. */
  mismatch: boolean;
};

/**
 * Bỏ dấu câu và thường hoá. Giữ lại dấu nháy đơn vì nó nằm TRONG từ
 * ("don't", "I've") — bỏ đi thì "dont" và "don't" thành hai từ khác nhau.
 * Nháy cong ’ quy về nháy thẳng ' vì bàn phím điện thoại hay tự đổi.
 */
function normalize(word: string): string {
  return word
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    .replace(/[^a-z0-9']/g, '');
}

function splitWords(text: string): string[] {
  const trimmed = text.trim();
  return trimmed.length === 0 ? [] : trimmed.split(/\s+/);
}

/**
 * "teaches" → "t******"; "school." → "s*****."; "a" → "a".
 *
 * Số sao đếm theo số CHỮ CÁI chứ không theo độ dài chuỗi, còn dấu câu cuối thì
 * giữ nguyên: người học cần biết chỗ nào hết câu, và một dấu chấm lộ ra không
 * làm bài dễ đi.
 */
function mask(word: string): string {
  const letters = normalize(word);
  if (letters.length === 0) return word;
  const trailing = word.match(/[^a-zA-Z0-9'‘’]+$/)?.[0] ?? '';
  return word.slice(0, 1) + '*'.repeat(letters.length - 1) + trailing;
}

export function buildReveal(model: string, typed: string): RevealState {
  const modelWords = splitWords(model).map((word) => ({ word, key: normalize(word) }));
  const typedWords = splitWords(typed).map((word) => normalize(word));

  // Một từ chỉ được coi là GÕ XONG khi sau nó đã có dấu cách. Từ cuối cùng khi
  // chưa gõ cách vẫn đang dở, nên nó được xét riêng ở dưới — nếu tính luôn là
  // xong thì mới gõ chữ "s" của "school" đã bị báo sai ngay.
  const trailingSpace = typed.length === 0 || /\s$/.test(typed);
  const finished = trailingSpace ? typedWords.length : Math.max(0, typedWords.length - 1);

  let solvedCount = 0;
  let mismatch = false;

  for (let i = 0; i < finished; i += 1) {
    if (i >= modelWords.length) {
      mismatch = true;
      break;
    }
    if (typedWords[i] === modelWords[i]!.key) solvedCount += 1;
    else {
      mismatch = true;
      break;
    }
  }

  if (!mismatch && !trailingSpace && typedWords.length > 0) {
    const index = typedWords.length - 1;
    const partial = typedWords[index]!;
    if (index !== solvedCount || solvedCount >= modelWords.length) {
      mismatch = true;
    } else if (partial === modelWords[solvedCount]!.key) {
      // Gõ trọn từ rồi thì mở luôn, không bắt phải bấm thêm dấu cách.
      solvedCount += 1;
    } else if (!modelWords[solvedCount]!.key.startsWith(partial)) {
      mismatch = true;
    }
  }

  const tokens: RevealToken[] = modelWords.map((entry, index) => ({
    word: entry.word,
    key: entry.key,
    masked: mask(entry.word),
    status: index < solvedCount ? 'solved' : index === solvedCount ? 'active' : 'locked',
  }));

  return {
    tokens,
    solvedCount,
    total: modelWords.length,
    done: modelWords.length > 0 && solvedCount === modelWords.length,
    mismatch,
  };
}
