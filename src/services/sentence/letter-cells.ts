/**
 * Bàn ô chữ cho bài chép chính tả: mỗi CHỮ CÁI một ô vuông.
 *
 * Vì sao đổi từ một ô nhập dài sang từng ô chữ cái: nghe rồi gõ vào một ô dài
 * thì người học không biết mình còn thiếu bao nhiêu, và một từ nghe hụt sẽ kéo
 * lệch toàn bộ phần sau. Chia sẵn thành ô cho biết ngay câu có mấy từ, mỗi từ
 * mấy chữ — đó là phần thông tin mà bài nghe chép vốn dĩ cho phép biết (người
 * chấm thật cũng đọc từng từ), và nó biến bài từ "nhớ cả câu" thành "bắt đúng
 * từng âm", đúng thứ cần rèn.
 *
 * Dấu câu và dấu nháy KHÔNG chiếm ô. Chúng vẫn hiện ra giữa các ô để câu đọc
 * được nhịp, nhưng bắt gõ dấu câu thì phần lớn lỗi sẽ là lỗi dấu chấm phẩy chứ
 * không phải lỗi nghe — sai người, sai việc.
 */

export type LetterUnit =
  /** Một ô cần điền. `index` là vị trí trong chuỗi đáp án. */
  | { kind: 'letter'; index: number; expected: string }
  /** Dấu câu / dấu nháy, hiện ra nhưng không phải điền. */
  | { kind: 'mark'; text: string };

export type LetterWord = {
  units: LetterUnit[];
  /** Nguyên văn của từ, giữ hoa/thường — để hiện lại và để đọc bằng TTS. */
  text: string;
};

export type LetterBoard = {
  words: LetterWord[];
  /** Chuỗi chữ cái đúng, đã viết hoa. Độ dài = tổng số ô. */
  answer: string;
};

export type LetterCellState = 'empty' | 'correct' | 'wrong';

export type LetterGrade = {
  states: LetterCellState[];
  correctCount: number;
  filledCount: number;
  total: number;
  done: boolean;
};

const IS_LETTER = /[a-zA-Z0-9]/;

export function buildLetterBoard(sentence: string): LetterBoard {
  const words: LetterWord[] = [];
  let answer = '';

  for (const raw of sentence.trim().split(/\s+/)) {
    if (raw.length === 0) continue;
    const units: LetterUnit[] = [];
    let pendingMark = '';

    for (const char of raw) {
      if (IS_LETTER.test(char)) {
        if (pendingMark) {
          units.push({ kind: 'mark', text: pendingMark });
          pendingMark = '';
        }
        units.push({ kind: 'letter', index: answer.length, expected: char.toUpperCase() });
        answer += char.toUpperCase();
      } else {
        pendingMark += char;
      }
    }

    if (pendingMark) units.push({ kind: 'mark', text: pendingMark });
    words.push({ units, text: raw });
  }

  return { words, answer };
}

/**
 * Chấm những gì đã gõ.
 *
 * `typed` là chuỗi chữ cái theo thứ tự, không có dấu cách — màn hình gom mọi
 * phím vào một ô nhập ẩn rồi rải ra các ô, nên thứ tự luôn khớp với `answer`.
 */
export function gradeLetters(answer: string, typed: string): LetterGrade {
  const upper = typed.toUpperCase();
  const states: LetterCellState[] = [];
  let correctCount = 0;

  for (let i = 0; i < answer.length; i += 1) {
    const char = upper[i];
    if (char === undefined || char === '') {
      states.push('empty');
      continue;
    }
    if (char === answer[i]) {
      states.push('correct');
      correctCount += 1;
    } else {
      states.push('wrong');
    }
  }

  const filledCount = Math.min(upper.length, answer.length);

  return {
    states,
    correctCount,
    filledCount,
    total: answer.length,
    done: answer.length > 0 && correctCount === answer.length,
  };
}

/** Bỏ mọi thứ không phải chữ cái/chữ số và cắt cho vừa số ô. */
export function sanitizeTyped(input: string, capacity: number): string {
  return input.replace(/[^a-zA-Z0-9]/g, '').slice(0, capacity);
}

/** Số từ đã điền đúng trọn vẹn — dùng cho thanh nạp đòn của game khi học. */
export function solvedWordCount(board: LetterBoard, grade: LetterGrade): number {
  return board.words.filter((word) =>
    word.units.every((u) => u.kind !== 'letter' || grade.states[u.index] === 'correct'),
  ).length;
}

/**
 * Chuỗi gõ sau khi MỞ HỘ từ đầu tiên chưa đúng: điền đúng mọi chữ từ đầu câu tới
 * hết từ đó (sửa luôn chữ sai phía trước), bỏ phần gõ lấn sang sau. Trả về `null`
 * khi câu đã đúng hết — không còn gì để mở.
 */
export function revealNextWord(board: LetterBoard, typed: string): string | null {
  const grade = gradeLetters(board.answer, typed);
  for (const word of board.words) {
    const letters = word.units.filter((u): u is Extract<LetterUnit, { kind: 'letter' }> => u.kind === 'letter');
    if (letters.length === 0) continue;
    if (letters.every((u) => grade.states[u.index] === 'correct')) continue;
    return board.answer.slice(0, letters[letters.length - 1]!.index + 1);
  }
  return null;
}

/** Số ô của từ dài nhất trong câu. */
export function longestWordLetters(board: LetterBoard): number {
  return board.words.reduce((max, word) => Math.max(max, word.units.filter((u) => u.kind === 'letter').length), 0);
}

/**
 * Cỡ ô chữ sao cho TỪ DÀI NHẤT nằm trọn một dòng trong khung rộng `available` px
 * (từ không bao giờ bị bẻ đôi giữa hai dòng, nên từ dài mà ô cố định là bị cắt
 * mất đuôi trên điện thoại). Cỡ chuẩn 32px; ô nhỏ thì khe cũng hẹp lại. Ô chỉ để
 * NHÌN — gõ đi qua một ô nhập ẩn — nên nhỏ tới 12px vẫn dùng được.
 */
export function fitCells(available: number, longest: number): { size: number; gap: number } {
  const BASE = 32;
  if (available <= 0 || longest <= 0) return { size: BASE, gap: 4 };
  const fit = (gap: number) => Math.floor((available - gap * (longest - 1)) / longest);
  if (fit(4) >= 24) return { size: Math.min(BASE, fit(4)), gap: 4 };
  return { size: Math.max(12, Math.min(BASE, fit(2))), gap: 2 };
}
