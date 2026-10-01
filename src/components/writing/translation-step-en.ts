/**
 * Bản tiếng Anh cho tên / mô tả / nhãn của năm bước (dữ liệu gốc ở
 * `services/writing/translation-path` giữ tiếng Việt). Tra theo `id`.
 */
export const STEP_EN: Record<string, { title: string; blurb: string; badge: string | null }> = {
  structure: {
    title: 'Core sentence structures',
    blurb: 'Practise by STRUCTURE, not topic: each set groups sentences that share a tense or sentence pattern, drawn from every topic.',
    badge: null,
  },
  topic: {
    title: 'Vocabulary by topic',
    blurb: "The same structures with each field's vocabulary. If you get stuck here, it's the words, not the grammar.",
    badge: 'VOCAB',
  },
  'para-65': {
    title: 'Short passages',
    blurb: "Three sentences per round. Keep the thread between sentences — don't forget the last one while typing the next.",
    badge: 'BAND 6.5',
  },
  'para-80': {
    title: 'Long passages',
    blurb: 'Four sentences in a row from the hardest sets — multi-clause sentences and rarer vocabulary.',
    badge: 'BAND 8.0',
  },
  essay: {
    title: 'Full paragraphs',
    blurb: 'Six sentences per round, the length of a body paragraph. The closest step to real writing.',
    badge: 'LONGEST',
  },
};
