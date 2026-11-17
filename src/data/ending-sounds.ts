/**
 * Cách đọc đuôi -s/-es và -ed (15/11/2026). Người Việt hay bỏ âm cuối hoặc đọc mọi đuôi -ed thành /id/.
 * Quy tắc phụ thuộc vào ÂM CUỐI của từ gốc (không phải chữ cái cuối).
 * Nội dung do Band 9 tự biên soạn.
 */

export type EdSound = '/t/' | '/d/' | '/ɪd/';
export type SSound = '/s/' | '/z/' | '/ɪz/';
export type EndingRule = 'ed' | 's';

/** Âm cuối của từ gốc, dạng ký hiệu IPA dùng trong quy tắc. */
const VOICELESS = ['p', 'k', 'f', 's', 'ʃ', 'tʃ', 'θ'] as const;
const S_VOICELESS = ['p', 't', 'k', 'f', 'θ'] as const;
const SIBILANT = ['s', 'z', 'ʃ', 'ʒ', 'tʃ', 'dʒ'] as const;

/** Suy ra cách đọc đuôi -ed từ âm cuối của từ gốc. */
export function edSound(last: string): EdSound {
  if (last === 't' || last === 'd') return '/ɪd/';
  if ((VOICELESS as readonly string[]).includes(last)) return '/t/';
  return '/d/';
}

/** Suy ra cách đọc đuôi -s/-es từ âm cuối của từ gốc. */
export function sSound(last: string): SSound {
  if ((SIBILANT as readonly string[]).includes(last)) return '/ɪz/';
  if ((S_VOICELESS as readonly string[]).includes(last)) return '/s/';
  return '/z/';
}

export type EndingWord = {
  word: string;
  rule: EndingRule;
  /** Từ gốc. */
  base: string;
  /** Âm cuối của từ gốc (IPA). */
  last: string;
  /** Cách đọc đuôi, ghi tay để test đối chiếu với quy tắc. */
  sound: EdSound | SSound;
};

type Row = readonly [word: string, base: string, last: string, sound: EdSound | SSound];

const ED: readonly Row[] = [
  // /t/ sau âm vô thanh
  ['worked', 'work', 'k', '/t/'], ['washed', 'wash', 'ʃ', '/t/'], ['stopped', 'stop', 'p', '/t/'], ['laughed', 'laugh', 'f', '/t/'],
  ['watched', 'watch', 'tʃ', '/t/'], ['missed', 'miss', 's', '/t/'], ['pushed', 'push', 'ʃ', '/t/'], ['hoped', 'hope', 'p', '/t/'],
  ['asked', 'ask', 'k', '/t/'], ['danced', 'dance', 's', '/t/'], ['helped', 'help', 'p', '/t/'], ['jumped', 'jump', 'p', '/t/'],
  ['cooked', 'cook', 'k', '/t/'], ['fixed', 'fix', 's', '/t/'], ['kissed', 'kiss', 's', '/t/'],
  // /d/ sau âm hữu thanh và nguyên âm
  ['played', 'play', 'eɪ', '/d/'], ['called', 'call', 'l', '/d/'], ['cleaned', 'clean', 'n', '/d/'], ['loved', 'love', 'v', '/d/'],
  ['opened', 'open', 'n', '/d/'], ['lived', 'live', 'v', '/d/'], ['changed', 'change', 'dʒ', '/d/'], ['rained', 'rain', 'n', '/d/'],
  ['studied', 'study', 'i', '/d/'], ['answered', 'answer', 'ə', '/d/'], ['enjoyed', 'enjoy', 'ɔɪ', '/d/'], ['stayed', 'stay', 'eɪ', '/d/'],
  ['learned', 'learn', 'n', '/d/'], ['listened', 'listen', 'n', '/d/'], ['moved', 'move', 'v', '/d/'],
  // /ɪd/ sau /t/ và /d/
  ['wanted', 'want', 't', '/ɪd/'], ['needed', 'need', 'd', '/ɪd/'], ['decided', 'decide', 'd', '/ɪd/'], ['started', 'start', 't', '/ɪd/'],
  ['visited', 'visit', 't', '/ɪd/'], ['ended', 'end', 'd', '/ɪd/'], ['waited', 'wait', 't', '/ɪd/'], ['painted', 'paint', 't', '/ɪd/'],
  ['hated', 'hate', 't', '/ɪd/'], ['added', 'add', 'd', '/ɪd/'], ['planted', 'plant', 't', '/ɪd/'], ['collected', 'collect', 't', '/ɪd/'],
];

const S: readonly Row[] = [
  // /s/ sau p, t, k, f, θ
  ['cats', 'cat', 't', '/s/'], ['books', 'book', 'k', '/s/'], ['stops', 'stop', 'p', '/s/'], ['laughs', 'laugh', 'f', '/s/'],
  ['hopes', 'hope', 'p', '/s/'], ['months', 'month', 'θ', '/s/'], ['cups', 'cup', 'p', '/s/'], ['maps', 'map', 'p', '/s/'],
  ['shirts', 'shirt', 't', '/s/'], ['weeks', 'week', 'k', '/s/'], ['works', 'work', 'k', '/s/'],
  // /z/ sau âm hữu thanh và nguyên âm
  ['dogs', 'dog', 'ɡ', '/z/'], ['plays', 'play', 'eɪ', '/z/'], ['days', 'day', 'eɪ', '/z/'], ['bags', 'bag', 'ɡ', '/z/'],
  ['rooms', 'room', 'm', '/z/'], ['pens', 'pen', 'n', '/z/'], ['lives', 'live', 'v', '/z/'], ['hands', 'hand', 'd', '/z/'],
  ['girls', 'girl', 'l', '/z/'], ['boys', 'boy', 'ɔɪ', '/z/'], ['songs', 'song', 'ŋ', '/z/'], ['cars', 'car', 'ɑː', '/z/'],
  // /ɪz/ sau s, z, ʃ, ʒ, tʃ, dʒ
  ['buses', 'bus', 's', '/ɪz/'], ['watches', 'watch', 'tʃ', '/ɪz/'], ['wishes', 'wish', 'ʃ', '/ɪz/'], ['boxes', 'box', 's', '/ɪz/'],
  ['judges', 'judge', 'dʒ', '/ɪz/'], ['roses', 'rose', 'z', '/ɪz/'], ['pages', 'page', 'dʒ', '/ɪz/'], ['dances', 'dance', 's', '/ɪz/'],
  ['churches', 'church', 'tʃ', '/ɪz/'], ['languages', 'language', 'dʒ', '/ɪz/'], ['washes', 'wash', 'ʃ', '/ɪz/'],
];

export const ENDING_WORDS: readonly EndingWord[] = [
  ...ED.map(([word, base, last, sound]) => ({ word, base, last, sound, rule: 'ed' as const })),
  ...S.map(([word, base, last, sound]) => ({ word, base, last, sound, rule: 's' as const })),
];

export const RULES: Record<EndingRule, { title: string; titleEn: string; sounds: { sound: EdSound | SSound; when: string; whenEn: string; hint: string }[] }> = {
  ed: {
    title: 'Đuôi -ed',
    titleEn: 'The -ed ending',
    sounds: [
      { sound: '/t/', when: 'Sau âm vô thanh: /p/ /k/ /f/ /s/ /ʃ/ /tʃ/ /θ/', whenEn: 'After voiceless sounds: /p/ /k/ /f/ /s/ /ʃ/ /tʃ/ /θ/', hint: 'worked, washed, stopped' },
      { sound: '/d/', when: 'Sau âm hữu thanh và nguyên âm', whenEn: 'After voiced sounds and vowels', hint: 'played, called, loved' },
      { sound: '/ɪd/', when: 'Sau /t/ hoặc /d/ (thêm một âm tiết)', whenEn: 'After /t/ or /d/ (adds a syllable)', hint: 'wanted, needed, decided' },
    ],
  },
  s: {
    title: 'Đuôi -s / -es',
    titleEn: 'The -s / -es ending',
    sounds: [
      { sound: '/s/', when: 'Sau âm vô thanh: /p/ /t/ /k/ /f/ /θ/', whenEn: 'After voiceless sounds: /p/ /t/ /k/ /f/ /θ/', hint: 'cats, books, stops' },
      { sound: '/z/', when: 'Sau âm hữu thanh và nguyên âm', whenEn: 'After voiced sounds and vowels', hint: 'dogs, plays, rooms' },
      { sound: '/ɪz/', when: 'Sau âm gió /s/ /z/ /ʃ/ /ʒ/ /tʃ/ /dʒ/ (thêm một âm tiết)', whenEn: 'After sibilants /s/ /z/ /ʃ/ /ʒ/ /tʃ/ /dʒ/ (adds a syllable)', hint: 'buses, watches, judges' },
    ],
  },
};

/** Câu giải thích vì sao đáp án đúng, dùng trong bài kiểm tra. */
export function explain(w: EndingWord): string {
  const kind = w.rule === 'ed' ? (w.sound === '/ɪd/' ? 'sau /t/ hoặc /d/' : w.sound === '/t/' ? 'sau âm vô thanh' : 'sau âm hữu thanh hoặc nguyên âm') : w.sound === '/ɪz/' ? 'sau âm gió' : w.sound === '/s/' ? 'sau âm vô thanh' : 'sau âm hữu thanh hoặc nguyên âm';
  return `${w.base} kết thúc bằng /${w.last}/ → ${kind} → đuôi đọc ${w.sound}.`;
}

export function pickEndingQuiz(count: number, rule: EndingRule | 'both', random: () => number = Math.random): EndingWord[] {
  const pool = ENDING_WORDS.filter((w) => rule === 'both' || w.rule === rule);
  const arr = [...pool];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
  return arr.slice(0, Math.min(count, arr.length));
}
