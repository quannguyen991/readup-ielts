/**
 * Chấm điểm giọng đọc tiếng Anh (hàm thuần) — dùng ở `voice.ts`.
 *   - tên nữ quen thuộc: +10; tên nam: loại hẳn;
 *   - giọng nơ-ron ("natural", "neural", "premium", "enhanced", "online"): +5;
 *   - Anh–Mỹ +2, Anh–Anh +1;
 *   - giọng Google của Chrome (giọng mạng, tự nhiên) +4;
 *   - giọng máy đời cũ của Windows (Zira, Hazel, Susan… bản SAPI, không có chữ
 *     "Online/Natural"): −8 — nghe như rô-bốt. Người dùng 01/10/2026: "giọng này
 *     khó nghe quá" (khi đó máy chọn "Microsoft Zira" vì hoà điểm với Google).
 */
export type VoiceInfo = { identifier: string; name: string; language: string };

const FEMALE = [
  'aria', 'jenny', 'michelle', 'ana', 'ava', 'emma', 'sonia', 'libby', 'maisie', 'natasha', 'clara', 'emily',
  'samantha', 'allison', 'susan', 'victoria', 'karen', 'moira', 'tessa', 'serena', 'kate', 'fiona', 'nicky', 'zoe',
  'zira', 'hazel', 'linda', 'heera', 'catherine', 'female', 'google us english', 'jessa', 'nancy', 'amber', 'ashley',
  'cora', 'elizabeth', 'monica', 'sara', 'joanna', 'salli', 'kendra', 'kimberly', 'ivy', 'amy',
];
const MALE = [
  'david', 'mark', 'guy', 'ryan', 'christopher', 'eric', 'roger', 'steffan', 'brian', 'andrew', 'daniel', 'alex',
  'fred', 'george', 'james', 'thomas', 'tom', 'aaron', 'arthur', 'davis', 'tony', 'jason', 'william', 'male', 'rishi',
  'oliver', 'gordon', 'lee', 'matthew', 'joey', 'justin', 'kevin', 'liam', 'noah', 'richard', 'sam', 'connor',
];
const NEURAL = ['natural', 'neural', 'premium', 'enhanced', 'online'];
/** Giọng SAPI cài sẵn trên Windows — dùng khi không còn giọng nào khác. */
const LEGACY = ['zira', 'hazel', 'susan', 'heera', 'linda', 'catherine', 'mark', 'david'];

const hasWord = (name: string, needle: string) => new RegExp(`(^|[^a-z])${needle}([^a-z]|$)`).test(name);

/** Điểm của một giọng; `null` = loại (không phải tiếng Anh, hoặc giọng nam). */
export function scoreVoice(v: VoiceInfo): number | null {
  const lang = v.language.replace('_', '-').toLowerCase();
  if (!lang.startsWith('en')) return null;
  const name = v.name.toLowerCase();
  const female = FEMALE.some((f) => hasWord(name, f));
  if (!female && MALE.some((m) => hasWord(name, m))) return null;
  let score = female ? 10 : 0;
  const neural = NEURAL.some((n) => name.includes(n));
  if (neural) score += 5;
  if (name.includes('google')) score += 4;
  if (!neural && name.includes('microsoft') && LEGACY.some((l) => hasWord(name, l))) score -= 8;
  if (lang.startsWith('en-us')) score += 2;
  else if (lang.startsWith('en-gb')) score += 1;
  return score;
}

/** Giọng tốt nhất trong danh sách, hoặc null nếu không có giọng tiếng Anh nào dùng được. */
export function bestVoice(voices: readonly VoiceInfo[]): VoiceInfo | null {
  let best: VoiceInfo | null = null;
  let top = -1;
  for (const v of voices) {
    const s = scoreVoice(v);
    if (s !== null && s > top) {
      top = s;
      best = v;
    }
  }
  return best;
}
