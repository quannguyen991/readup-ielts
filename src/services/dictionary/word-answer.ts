import type { ResolvedWord } from './word-lookup';

/**
 * Câu trả lời dạng chữ trần cho "Hỏi nhanh" khi người học chỉ gõ một từ — dựng
 * từ tra cứu trong máy, nên vẫn có đáp án khi AI bận. Bong bóng không có bộ dựng
 * markdown, nên chỉ xuống dòng, không dấu sao.
 */
export function formatWordAnswer(r: ResolvedWord, en: boolean): string {
  const head = [r.word, r.partOfSpeech ? `(${r.partOfSpeech})` : '', r.phonetic ?? ''].filter(Boolean).join(' ');
  const lines = [head];
  if (r.definitionVi) lines.push(r.definitionVi);
  if (r.definitionGeneral) lines.push(`${r.englishOnly ? 'EN: ' : ''}${r.definitionGeneral}`);
  if (r.examples[0]) lines.push(`${en ? 'Example' : 'Ví dụ'}: ${r.examples[0]}`);
  return lines.join('\n');
}

/** Chỉ MỘT từ Latin (cho phép gạch nối/nháy) — cụm và câu hỏi đi đường AI. */
export function isSingleWordQuestion(text: string): string | null {
  const t = text.trim().replace(/[?.!,;:]+$/, '');
  return /^[A-Za-z][A-Za-z'’-]{1,29}$/.test(t) ? t : null;
}
