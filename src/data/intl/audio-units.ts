import { TOEFL_LISTENING, TOEIC_PART1, TOEIC_PART2, TOEIC_PART3, TOEIC_PART4 } from './listening';

/** Một đoạn âm thanh cần sinh bằng giọng đọc tự nhiên. Mỗi đoạn là một tệp. */
export type AudioUnit = { id: string; text: string };

const stripSpeaker = (line: string) => line.replace(/^[MWSA]: /, '');

export function collectAudioUnits(): AudioUnit[] {
  const qa = [...TOEIC_PART1, ...TOEIC_PART2].map((item) => ({
    id: item.id,
    text: [item.question, ...item.responses].join('. ').replace(/\.\./g, '.') + '.',
  }));
  const passages = [...TOEIC_PART3, ...TOEIC_PART4, ...TOEFL_LISTENING].map((p) => ({
    id: p.id,
    text: p.lines.map(stripSpeaker).join(' '),
  }));
  return [...qa, ...passages];
}

/** Ước lượng để trình bày trước khi chạy: số từ, thời lượng và chi phí ở mức trả phí. */
export function estimateAudio(units: readonly AudioUnit[]) {
  const words = units.reduce((n, u) => n + u.text.split(/\s+/).length, 0);
  const seconds = Math.round(words / 2.4);
  const audioTokens = seconds * 25;
  const usdPaid = (audioTokens / 1_000_000) * 10;
  return { units: units.length, words, seconds, audioTokens, usdPaid };
}
