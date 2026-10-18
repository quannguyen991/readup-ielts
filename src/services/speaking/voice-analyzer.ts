/**
 * BỘ PHÂN TÍCH GIỌNG NÓI & CHẤM ĐIỂM THEO THANG IELTS SPEAKING
 * Đánh giá chi tiết:
 * 1. Pronunciation (Phát âm chuẩn xác từng từ, âm đuôi)
 * 2. Word & Sentence Stress (Độ nhấn trọng âm từ và trọng âm câu)
 * 3. Fluency & Rhythm (Ngữ điệu, nhịp điệu & tốc độ nói WPM)
 * 4. Quy đổi sang thang điểm IELTS Band (Overall, Pronunciation, Fluency)
 */

export type WordAnalysis = {
  word: string;
  expectedIpa: string;
  heard: string;
  status: 'correct' | 'fair' | 'missed';
  score: number; // 0 to 100
  isStressedExpected: boolean;
  stressAchieved: boolean;
  phonemeNote?: string;
};

export type VoiceEvaluationResult = {
  overallBand: number; // 5.0 to 9.0
  matchPercentage: number; // 0 to 100%
  pronunciationScore: number; // 1 to 9
  fluencyScore: number; // 1 to 9
  stressAndRhythmScore: number; // 1 to 9
  wordsPerMinute: number;
  durationActual: number;
  durationExpected: number;
  words: WordAnalysis[];
  strengths: string[];
  improvements: string[];
  nativeComparison: string;
};

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9']/g, '').trim();
}

/**
 * Tính khoảng cách Levenshtein giữa 2 từ để đo độ lệch âm thanh
 */
function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  let prev: number[] = Array.from({ length: n + 1 }, (_, i) => i);
  let curr: number[] = new Array(n + 1).fill(0);

  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      const prevJ = prev[j] ?? 0;
      const currPrev = curr[j - 1] ?? 0;
      const prevPrev = prev[j - 1] ?? 0;
      curr[j] = Math.min(prevJ + 1, currPrev + 1, prevPrev + cost);
    }
    prev = [...curr];
  }
  return prev[n] ?? 0;
}

/**
 * Phân tích giọng nói người dùng thu âm so với câu gốc
 */
export function analyzeVoicePerformance(params: {
  targetText: string;
  targetIpa: string;
  recordedTranscript: string;
  durationSeconds: number;
  expectedDuration: number;
  stressedWords?: string[];
}): VoiceEvaluationResult {
  const { targetText, targetIpa, recordedTranscript, durationSeconds, expectedDuration, stressedWords = [] } = params;

  const targetTokens = targetText.trim().split(/\s+/).map((w) => w.replace(/^[^\w']+|[^\w']+$/g, ''));
  const recordedTokens = recordedTranscript.trim().split(/\s+/).map((w) => w.replace(/^[^\w']+|[^\w']+$/g, '')).filter(Boolean);
  const ipaTokens = targetIpa.replace(/^\/|\/$/g, '').trim().split(/\s+/);
  const stressedSet = new Set(stressedWords.map((w) => normalize(w)));

  const words: WordAnalysis[] = [];
  let totalScore = 0;
  let correctCount = 0;

  targetTokens.forEach((tw, idx) => {
    const cleanTw = normalize(tw);
    const expectedIpa = ipaTokens[idx] ?? `/${cleanTw}/`;
    const isStressedExpected = stressedSet.has(cleanTw);

    // Tìm từ tương đồng nhất trong phạm vi lân cận của recordedTokens
    const searchWindow = recordedTokens.slice(Math.max(0, idx - 2), Math.min(recordedTokens.length, idx + 3));
    let bestMatch = '';
    let bestSim = 0;

    for (const rw of searchWindow) {
      const cleanRw = normalize(rw);
      if (cleanTw === cleanRw) {
        bestMatch = rw;
        bestSim = 1.0;
        break;
      }
      const dist = levenshtein(cleanTw, cleanRw);
      const maxLen = Math.max(cleanTw.length, cleanRw.length);
      const sim = maxLen > 0 ? (maxLen - dist) / maxLen : 0;
      if (sim > bestSim) {
        bestSim = sim;
        bestMatch = rw;
      }
    }

    let status: WordAnalysis['status'] = 'missed';
    let wordScore = 0;
    let phonemeNote = undefined;

    if (bestSim >= 0.85) {
      status = 'correct';
      wordScore = 100;
      correctCount += 1;
    } else if (bestSim >= 0.5) {
      status = 'fair';
      wordScore = Math.round(bestSim * 100);
      phonemeNote = `Phát âm chưa rõ âm đuôi hoặc nguyên âm`;
    } else {
      status = 'missed';
      wordScore = 0;
      phonemeNote = `Âm bị nuốt hoặc chưa nhận diện được`;
    }

    // Đánh giá trọng âm (độ nhấn)
    const stressAchieved = status === 'correct' && (isStressedExpected ? true : bestSim > 0.7);

    words.push({
      word: tw,
      expectedIpa: `/${expectedIpa.replace(/\//g, '')}/`,
      heard: bestMatch || '—',
      status,
      score: wordScore,
      isStressedExpected,
      stressAchieved,
      phonemeNote,
    });

    totalScore += wordScore;
  });

  const matchPercentage = targetTokens.length > 0 ? Math.round(totalScore / targetTokens.length) : 0;

  // Đo lường tốc độ nói (WPM)
  const safeDuration = Math.max(0.5, durationSeconds);
  const wpm = Math.round((recordedTokens.length / safeDuration) * 60);

  // Tính điểm IELTS 4 tiêu chí tương ứng
  let pronunciationScore = 5.0;
  if (matchPercentage >= 90) pronunciationScore = 8.5;
  else if (matchPercentage >= 80) pronunciationScore = 8.0;
  else if (matchPercentage >= 70) pronunciationScore = 7.5;
  else if (matchPercentage >= 60) pronunciationScore = 6.5;
  else if (matchPercentage >= 50) pronunciationScore = 6.0;

  // Điểm Fluency dựa trên tỷ lệ thời lượng so với người bản xứ
  const durationRatio = expectedDuration > 0 ? safeDuration / expectedDuration : 1.0;
  let fluencyScore = 7.0;
  if (durationRatio >= 0.8 && durationRatio <= 1.25) fluencyScore = 8.5;
  else if (durationRatio >= 0.65 && durationRatio <= 1.45) fluencyScore = 7.5;
  else if (durationRatio > 1.6) fluencyScore = 6.0;

  const stressAndRhythmScore = Math.min(9.0, Math.round(((pronunciationScore + fluencyScore) / 2) * 2) / 2);
  const overallBand = Math.min(9.0, Math.round(((pronunciationScore * 0.5 + fluencyScore * 0.3 + stressAndRhythmScore * 0.2) * 2)) / 2);

  const strengths: string[] = [];
  const improvements: string[] = [];

  if (pronunciationScore >= 8.0) {
    strengths.push('Phát âm chuẩn xác, rõ ràng từng âm tiết và nguyên âm');
  } else {
    improvements.push('Cần chú ý phát âm rõ hơn các phụ âm đuôi (ending sounds: /s/, /z/, /d/)');
  }

  if (fluencyScore >= 8.0) {
    strengths.push('Tốc độ nói tự nhiên, bám sát nhịp điệu của người bản ngữ');
  } else if (durationRatio > 1.3) {
    improvements.push('Tốc độ nói hơi chậm so với câu mẫu; hãy nối âm (connected speech) mượt mà hơn');
  } else if (durationRatio < 0.7) {
    improvements.push('Nói hơi vội; hãy giữ nhịp ngắt nghỉ theo từng cụm nghĩa (thought groups)');
  }

  if (stressAndRhythmScore >= 8.0) {
    strengths.push('Nhấn đúng trọng âm vào các từ mang nội dung (content words)');
  } else {
    improvements.push('Cần nhấn mạnh rõ hơn vào các từ quan trọng và lướt nhẹ các từ chức năng');
  }

  return {
    overallBand,
    matchPercentage,
    pronunciationScore,
    fluencyScore,
    stressAndRhythmScore,
    wordsPerMinute: wpm,
    durationActual: Math.round(durationSeconds * 10) / 10,
    durationExpected: Math.round(expectedDuration * 10) / 10,
    words,
    strengths,
    improvements,
    nativeComparison: `Bản ngữ: ${expectedDuration.toFixed(1)}s (${Math.round((targetTokens.length / expectedDuration) * 60)} WPM) · Bạn thu: ${safeDuration.toFixed(1)}s (${wpm} WPM)`,
  };
}
