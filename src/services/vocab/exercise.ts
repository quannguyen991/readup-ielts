import {
  clozeableSentence,
  contextSentenceOf,
  findWordInSentence,
  meaningOf,
  type VocabModeId,
} from './modes';
import type { VocabEntry } from '@/store/useVocabStore';

/**
 * Dựng một lượt ôn từ một từ + một chế độ.
 *
 * HÀM THUẦN, tách khỏi màn hình. Ba thứ dễ sai ở đây và cả ba đều không lộ ra
 * khi bấm thử vài cái: nhiễu trùng đáp án, chỗ trống khoét nhầm từ, và đáp án
 * luôn rơi vào cùng một vị trí. Cái thứ ba là tệ nhất — người học sẽ học được
 * quy luật vị trí thay vì học từ, và họ không tự biết mình đang làm thế.
 */

export type VocabExercise =
  | {
      mode: 'flashcard';
      entry: VocabEntry;
      front: string;
      back: string;
      /** Câu gốc, hiện ở mặt sau để nhớ theo ngữ cảnh. */
      context: string | null;
    }
  | {
      mode: 'context';
      entry: VocabEntry;
      /** Câu đã khoét, chỗ trống là một dãy gạch dưới. */
      blanked: string;
      answer: string;
      meaning: string | null;
    }
  | {
      mode: 'context_choice';
      entry: VocabEntry;
      /** Câu đã khoét, chỗ trống là một dãy gạch dưới. */
      blanked: string;
      answer: string;
      /** Bốn TỪ để chọn, không phải bốn nghĩa. */
      options: string[];
      answerIndex: number;
      meaning: string | null;
    }
  | {
      mode: 'multiple_choice';
      entry: VocabEntry;
      prompt: string;
      context: string | null;
      options: string[];
      answerIndex: number;
    }
  | {
      mode: 'translate_sentence';
      entry: VocabEntry;
      sentence: string;
      /** Nghĩa của từ khoá, hiện sau khi người học đã viết xong. */
      wordMeaning: string | null;
    }
  | {
      mode: 'dictation';
      entry: VocabEntry;
      sentence: string;
    };

/** Dãy gạch dưới thay cho từ bị khoét. Dài theo từ để không lộ độ dài. */
export const BLANK = '______';

export function buildCloze(entry: VocabEntry): { blanked: string; answer: string } | null {
  const sentence = clozeableSentence(entry);
  if (!sentence) return null;
  const at = findWordInSentence(sentence, entry);
  if (!at) return null;
  return {
    blanked: sentence.slice(0, at.start) + BLANK + sentence.slice(at.end),
    answer: sentence.slice(at.start, at.end),
  };
}

/**
 * Bốn phương án nghĩa: một đúng, ba nhiễu lấy từ chính sổ từ.
 *
 * NHIỄU LẤY TỪ SỔ CỦA CHÍNH NGƯỜI HỌC chứ không bịa: nghĩa bịa thường lạc quẻ
 * hẳn và loại được mà không cần biết từ. Nghĩa của từ khác trong cùng sổ thì
 * cùng miền chủ đề, cùng độ dài, cùng giọng văn — muốn loại phải thật sự biết
 * từ đang hỏi.
 *
 * `rnd` bơm từ ngoài để test gieo hạt cố định.
 */
export function buildChoices(
  entry: VocabEntry,
  pool: VocabEntry[],
  rnd: () => number,
): { options: string[]; answerIndex: number } | null {
  const answer = meaningOf(entry);
  if (!answer) return null;

  const seen = new Set([normalize(answer)]);
  const distractors: string[] = [];

  for (const other of shuffle(pool, rnd)) {
    if (other.id === entry.id) continue;
    const m = meaningOf(other);
    if (!m) continue;
    const key = normalize(m);
    /* Hai từ đồng nghĩa trong sổ sẽ cho hai nghĩa giống nhau — câu ấy có hai đáp án đúng. */
    if (seen.has(key)) continue;
    seen.add(key);
    distractors.push(m);
    if (distractors.length === 3) break;
  }

  /* Dưới bốn phương án thì không phải câu trắc nghiệm nữa. Thà không dựng. */
  if (distractors.length < 3) return null;

  const options = shuffle([answer, ...distractors], rnd);
  return { options, answerIndex: options.indexOf(answer) };
}

/**
 * Bốn TỪ để điền vào chỗ trống: một đúng, ba lấy từ sổ của chính người học.
 *
 * Khác `buildChoices` ở chỗ phương án là TỪ chứ không phải nghĩa — người học
 * phải đọc câu rồi chọn từ hợp nghĩa, tức là đo đúng thứ đề thi đo.
 *
 * LOẠI TỪ ĐÃ CÓ SẴN TRONG CÂU. Một phương án xuất hiện ở chỗ khác ngay trong
 * câu đang đọc thì loại được mà không cần hiểu gì: không ai điền một từ vừa
 * nhìn thấy cách đó năm chữ.
 */
export function buildWordChoices(
  entry: VocabEntry,
  pool: VocabEntry[],
  rnd: () => number,
  blanked: string,
): { options: string[]; answerIndex: number } | null {
  const answer = entry.word?.trim();
  if (!answer) return null;

  const seen = new Set([normalize(answer)]);
  const distractors: string[] = [];

  for (const other of shuffle(pool, rnd)) {
    if (other.id === entry.id) continue;
    const word = other.word?.trim();
    if (!word) continue;
    const key = normalize(word);
    if (seen.has(key)) continue;
    if (new RegExp(`\\b${escapeRegExp(word)}\\b`, 'i').test(blanked)) continue;
    seen.add(key);
    distractors.push(word);
    if (distractors.length === 3) break;
  }

  if (distractors.length < 3) return null;

  const options = shuffle([answer, ...distractors], rnd);
  return { options, answerIndex: options.indexOf(answer) };
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalize(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, ' ');
}

function shuffle<T>(list: T[], rnd: () => number): T[] {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rnd() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

/**
 * Dựng lượt ôn. Trả `null` khi từ không đủ liệu cho chế độ ấy.
 *
 * TRẢ NULL CHỨ KHÔNG DỰNG BỪA. Màn hình gọi hàm này rồi bỏ qua từ nào trả null
 * — thà một buổi ôn ngắn hơn dự tính còn hơn một câu hỏi không trả lời được
 * chen vào giữa.
 */
export function buildExercise(
  mode: VocabModeId,
  entry: VocabEntry,
  pool: VocabEntry[],
  rnd: () => number = Math.random,
): VocabExercise | null {
  const meaning = meaningOf(entry);
  const context = contextSentenceOf(entry);

  switch (mode) {
    case 'flashcard':
      return meaning ? { mode, entry, front: entry.word, back: meaning, context } : null;

    case 'context': {
      const cloze = buildCloze(entry);
      return cloze ? { mode, entry, ...cloze, meaning } : null;
    }

    case 'context_choice': {
      const cloze = buildCloze(entry);
      if (!cloze) return null;
      const choices = buildWordChoices(entry, pool, rnd, cloze.blanked);
      return choices ? { mode, entry, ...cloze, ...choices, meaning } : null;
    }

    case 'multiple_choice': {
      const choices = buildChoices(entry, pool, rnd);
      return choices ? { mode, entry, prompt: entry.word, context, ...choices } : null;
    }

    case 'translate_sentence':
      return context ? { mode, entry, sentence: context, wordMeaning: meaning } : null;

    case 'dictation':
      return context ? { mode, entry, sentence: context } : null;

    /*
      Dịch đoạn cần cả đoạn văn, mà đoạn nằm trong kho bài đọc chứ không trong
      sổ từ. Màn hình tự lấy đoạn rồi dùng `translate_sentence` với chuỗi dài
      hơn — không dựng ở đây để hàm này không phải biết tới kho bài đọc.
    */
    default:
      return null;
  }
}
