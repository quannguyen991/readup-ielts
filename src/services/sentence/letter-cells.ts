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
