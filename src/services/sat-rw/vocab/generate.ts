import { ARTICLES, getArticleWithBody } from '@/data/articles';
import { hashString, mulberry32 } from '@/services/questions/rng';
import { splitSentences } from '@/services/ingest/readability';

import { VOCAB_FRAMES, type VocabDistractorWhy, type VocabFrame } from './frames';

/**
 * Dựng câu "Từ trong ngữ cảnh" từ khung vốn từ + câu văn THẬT trong kho bài đọc.
 *
 * VÌ SAO LẤY CÂU THẬT CHỨ KHÔNG DỰNG CÂU. Dựng câu bằng khuôn thì tới bài thứ
 * năm người học nhận ra hình dạng và thôi đọc — đúng lỗi mà bộ đề trộn R&W đã
 * ghi lại. Câu thật trong 1.399 bài đọc thì mỗi câu một giọng, và nó cũng đúng
 * chất liệu SAT: văn khoa học và khoa học xã hội, không phải câu đặt ra để dạy.
 *
 * PHẦN SOẠN TAY LÀ PHẦN KHÔNG NHÂN ĐƯỢC. Vốn từ và bộ nhiễu phải người soạn;
 * nhưng một khung ấy gặp bao nhiêu câu trong kho thì ra bấy nhiêu đề. Ba mươi
 * khung ra khoảng hai trăm câu — máy làm phần nhân, người làm phần không nhân được.
 */

export type VocabItem = {
  /** `${word}:${articleId}#${index}` — mở lại đúng id là ra đúng câu ấy. */
  id: string;
  word: string;
  /** Câu văn thật, đã thay từ đích bằng chỗ trống. */
  passage: string;
  stem: string;
  options: string[];
  answerIndex: number;
  /** Vì sao từng phương án sai; `null` ở đáp án. */
  optionWhy: (VocabDistractorWhy | null)[];
  sourceId: string;
  solutionVi: string;
};

export const BLANK = '______';

export const VOCAB_STEM =
  'Which choice completes the text with the most logical and precise word or phrase?';

/** Câu chứa từ đích đúng một lần, ở dạng nguyên gốc (không phải biến thể). */
function occurrences(sentence: string, word: string): number {
  const re = new RegExp(`(?<![A-Za-z])${word}(?![A-Za-z])`, 'gi');
  return (sentence.match(re) ?? []).length;
}

function blankOut(sentence: string, word: string): string {
  return sentence.replace(new RegExp(`(?<![A-Za-z])${word}(?![A-Za-z])`, 'i'), BLANK);
}

/**
 * Câu này có dùng được làm bài dẫn không.
 *
 * Lọc ở đây là lọc HÌNH THỨC — đủ dài để có ngữ cảnh, không quá dài để đọc nổi,
 * không mở đầu bằng đại từ trỏ ra ngoài câu. Phần ngữ nghĩa (blank có ép được
 * đúng một từ không) nằm ở `verify.ts` và ở chính bộ nhiễu soạn tay.
 */
function usableSentence(s: string): boolean {
  const t = s.trim();
  if (t.length < 95 || t.length > 280) return false;
  if (!/[.!?]$/.test(t)) return false;

  // Mở đầu bằng đại từ hoặc từ chỉ định là câu dựa vào câu trước — tách ra thì mất nghĩa.
  if (/^(it|he|she|they|this|that|these|those|such|but|and|however|therefore)\b/i.test(t)) {
    return false;
  }

  // Câu có ngoặc kép là lời dẫn trực tiếp; cắt ra khỏi bài thường hụt ngữ cảnh.
  if (/["“”]/.test(t)) return false;

  /*
    HAI BỘ LỌC DƯỚI ĐÂY THÊM SAU KHI ĐỌC BÀI SINH RA, không phải nghĩ trước.

    Hàng rào hình thức cũ cho lọt hai kiểu câu hỏng mà chỉ đọc mới thấy:

    · "Rationalism and scientific inquiry: Encouraging critical thinking, ___
      evidence, and technological progress." — mẩu TIÊU ĐỀ có dấu hai chấm, không
      phải câu văn. Nó dài quá 95 ký tự nên lọt.

    · "…caused after birth by disease, injury, accident, ___ modification,
      variation, repeated use, disuse, misuse, or other environmental influence."
      — chỗ trống nằm giữa một DANH SÁCH DÀI, nên ngữ cảnh gần như không ràng
      buộc gì và blank điền được nhiều từ.

    Dấu hai chấm loại kiểu thứ nhất; đếm dấu phẩy loại kiểu thứ hai.
  */
  if (/[:;]/.test(t)) return false;
  if ((t.match(/,/g) ?? []).length > 3) return false;

  // Đủ dài về SỐ TỪ, không chỉ số ký tự: một câu ít từ mà từ nào cũng dài vẫn hụt ngữ cảnh.
  if (t.split(/\s+/).length < 16) return false;

  return true;
}

/** Câu có chứa ít nhất một cue của khung này không. */
export function hasCue(sentence: string, frame: VocabFrame): boolean {
  const lower = sentence.toLowerCase();
  return frame.cues.some((c) => lower.includes(c.toLowerCase()));
}

export type VocabCandidate = { frame: VocabFrame; sentence: string; sourceId: string; index: number };

/**
 * Quét kho bài đọc, trả về mọi câu dùng được cho mọi khung.
 *
 * Quét TẤT ĐỊNH theo thứ tự id bài: cùng kho ra cùng danh sách, cùng thứ tự, nên
 * `--limit 50` hôm nay và ngày mai vẫn là đúng năm mươi câu ấy.
 */
export function scanCandidates(limit = Infinity): VocabCandidate[] {
  const out: VocabCandidate[] = [];
  const ordered = [...ARTICLES].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

  for (const meta of ordered) {
    if (out.length >= limit) break;
    const full = getArticleWithBody(meta.id);
    if (!full?.bodyText) continue;

    const sentences = splitSentences(full.bodyText);
    for (const [index, sentence] of sentences.entries()) {
      if (out.length >= limit) break;
      if (!usableSentence(sentence)) continue;

      for (const frame of VOCAB_FRAMES) {
        if (occurrences(sentence, frame.word) !== 1) continue;
        if (!hasCue(sentence, frame)) continue;
        // Nhiễu KHÔNG được xuất hiện trong chính câu: nó vừa lộ đáp án vừa làm
        // người đọc tưởng câu đang nói về từ ấy.
        if (frame.distractors.some((d) => occurrences(sentence, d.word) > 0)) continue;

        out.push({ frame, sentence, sourceId: meta.id, index });
        break; // một câu chỉ dùng cho MỘT khung, tránh hai đề trùng câu dẫn
      }
    }
  }
  return out;
}

export function buildVocabItem(candidate: VocabCandidate): VocabItem {
  const { frame, sentence, sourceId, index } = candidate;
  const id = `${frame.word}:${sourceId}#${index}`;
  const rng = mulberry32(hashString(`vocab:${id}`));

  const entries = [
    { word: frame.word, why: null as VocabDistractorWhy | null },
    ...frame.distractors.map((d) => ({ word: d.word, why: d.why })),
  ];

  // Trộn tất định: cùng id ra cùng thứ tự phương án.
  for (let i = entries.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [entries[i], entries[j]] = [entries[j]!, entries[i]!];
  }

  const answerIndex = entries.findIndex((e) => e.why === null);
  const wrongWhy: Record<VocabDistractorWhy, string> = {
    opposite: 'nghĩa ngược với thứ ngữ cảnh đòi',
    too_strong: 'đúng hướng nhưng quá mức — mức độ chính là chỗ ăn thua',
    related_not_entailed: 'liên quan tới chủ đề nhưng ngữ cảnh không ép ra nghĩa ấy',
    wrong_register: 'sai sắc thái cho văn học thuật',
  };

  return {
    id,
    word: frame.word,
    passage: blankOut(sentence, frame.word),
    stem: VOCAB_STEM,
    options: entries.map((e) => e.word),
    answerIndex,
    optionWhy: entries.map((e) => e.why),
    sourceId,
    solutionVi:
      `Đáp án là "${frame.word}": ${frame.sense}. ` +
      entries
        .filter((e) => e.why !== null)
        .map((e) => `"${e.word}" — ${wrongWhy[e.why!]}`)
        .join('; ') +
      '.',
  };
}
